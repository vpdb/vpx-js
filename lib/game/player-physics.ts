/*
 * VPDB - Virtual Pinball Database
 * Copyright (C) 2019 freezy <freezy@vpdb.io>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { degToRad } from '../math/float';
import { Vertex3D } from '../math/vertex3d';
import { CollisionEvent } from '../physics/collision-event';
import {
	DEFAULT_STEPTIME,
	DEFAULT_TABLE_GRAVITY,
	DEFAULT_TABLE_MAX_SLOPE,
	DEFAULT_TABLE_MIN_SLOPE,
	PHYSICS_STEPTIME,
	STATICCNTS,
	STATICTIME,
} from '../physics/constants';
import { HitKD } from '../physics/hit-kd';
import { HitObject } from '../physics/hit-object';
import { HitPlane } from '../physics/hit-plane';
import { HitQuadtree } from '../physics/hit-quadtree';
import { MoverObject } from '../physics/mover-object';
import { now } from '../refs.node';
import { Ball } from '../vpt/ball/ball';
import { BallData } from '../vpt/ball/ball-data';
import { BallState } from '../vpt/ball/ball-state';
import { FlipperMover } from '../vpt/flipper/flipper-mover';
import { Table } from '../vpt/table/table';
import { MAX_TIMERS_MSEC_OVERALL } from '../vpt/timer/timer-const';
import { TimerHit } from '../vpt/timer/timer-hit';
import { TimerOnOff } from '../vpt/timer/timer-on-off';
import { Event } from './event';
import { IEmulator } from './iemulator';
import { PinInput } from './pin-input';
import { IBallCreationPosition, Player } from './player';

const SLOW_MO = 1; // the lower, the slower

export class PlayerPhysics {

	public readonly balls: Ball[] = [];
	public gravity = new Vertex3D();
	public timeMsec: number = 0;

	public recordContacts: boolean = false;
	public contacts: CollisionEvent[] = [];
	public activeBall?: Ball;
	public activeBallBC?: Ball;
	public swapBallCollisionHandling: boolean = false;
	public lastPlungerHit: number = 0;
	public ballControl = false;
	public bcTarget?: Vertex3D;
	public isPaused: boolean = false;

	private readonly table: Table;
	private readonly pinInput: PinInput;
	private readonly movers: MoverObject[] = [];
	private readonly flipperMovers: FlipperMover[] = [];

	private readonly hitObjects: HitObject[] = [];
	private readonly hitObjectsDynamic: HitObject[] = [];
	private hitPlayfield!: HitPlane; // HitPlanes cannot be part of octree (infinite size)
	private hitTopGlass!: HitPlane;

	private meshAsPlayfield: boolean = false;
	private hitOcTreeDynamic: HitKD = new HitKD();
	private hitOcTree: HitQuadtree = new HitQuadtree();
	private hitTimers: TimerHit[] = [];

	private minPhysLoopTime: number = 0;
	private lastFlipTime: number = 0;
	private lastTimeUsec: number = 0;
	private lastFrameDuration: number = 0;
	private cFrames: number = 0;

	private lastFpsTime: number = 0;
	private fps: number = 0;
	private fpsAvg: number = 0;
	private fpsCount: number = 0;
	private curPhysicsFrameTime: number = 0;
	private nextPhysicsFrameTime: number = 0;
	private startTimeUsec: number = 0;
	private physPeriod: number = 0;

	private activeBallDebug?: Ball;
	public readonly changedHitTimers: TimerOnOff[] = [];
	private scriptPeriod: number = 0;

	public emu?: IEmulator;

	/**
	 * Player physics are instantiated in the Player's constructor.
	 * @param table
	 * @param pinInput
	 */
	constructor(table: Table, pinInput: PinInput) {
		this.table = table;
		this.pinInput = pinInput;
	}

	/**
	 * This is called in the player's init().
	 */
	public init() {
		const minSlope = this.table.data!.overridePhysics ? DEFAULT_TABLE_MIN_SLOPE : this.table.data!.angletiltMin!;
		const maxSlope = this.table.data!.overridePhysics ? DEFAULT_TABLE_MAX_SLOPE : this.table.data!.angleTiltMax!;
		const slope = minSlope + (maxSlope - minSlope) * this.table.data!.globalDifficulty!;

		this.gravity.x = 0;
		this.gravity.y = Math.sin(degToRad(slope)) * (this.table.data!.overridePhysics ? DEFAULT_TABLE_GRAVITY : this.table.data!.gravity);
		this.gravity.z = -Math.cos(degToRad(slope)) * (this.table.data!.overridePhysics ? DEFAULT_TABLE_GRAVITY : this.table.data!.gravity);

		// [vpx-js added] init animation timers
		for (const animatable of this.table.getAnimatables()) {
			animatable.getAnimation().init(this.timeMsec);
		}

		this.indexTableElements();
		this.initOcTree(this.table);
	}

	private indexTableElements(): void {

		// index movables
		for (const movable of this.table.getMovables()) {
			this.movers.push(movable.getMover());
		}

		// index hittables
		for (const hittable of this.table.getHittables()) {
			for (const hitObject of hittable.getHitShapes()) {
				this.hitObjects.push(hitObject);
				hitObject.calcHitBBox();
			}
		}

		// index hit timers
		for (const scriptable of this.table.getScriptables()) {
			this.hitTimers.push(...scriptable.getApi()._getTimers());
		}

		this.hitObjects.push(...this.table.getHitShapes()); // these are the table's outer borders
		this.hitPlayfield = this.table.generatePlayfieldHit();
		this.hitTopGlass = this.table.generateGlassHit();

		// index flippers
		for (const flipper of Object.values(this.table.flippers)) {
			this.flipperMovers.push(flipper.getMover());
		}
	}

	private initOcTree(table: Table) {
		for (const hitObject of this.hitObjects) {
			this.hitOcTree.addElement(hitObject);
		}
		const tableBounds = table.getBoundingBox();
		this.hitOcTree.initialize(tableBounds);
		// initialize hit structure for dynamic objects
		this.hitOcTreeDynamic.fillFromVector(this.hitObjectsDynamic);
	}

	public physicsSimulateCycle(dTime: number) {

		let StaticCnts = STATICCNTS;    // maximum number of static counts

		// it's okay to have this code outside of the inner loop, as the ball hitrects already include the maximum distance they can travel in that timespan
		this.hitOcTreeDynamic.update();

		while (dTime > 0) {
			let hitTime = dTime;

			// find earliest time where a flipper collides with its stop
			for (const flipperMover of this.flipperMovers) {
				const flipperHitTime = flipperMover.getHitTime();
				if (flipperHitTime > 0 && flipperHitTime < hitTime) { //!! >= 0.f causes infinite loop
					hitTime = flipperHitTime;
				}
			}

			this.recordContacts = true;
			CollisionEvent.release(...this.contacts);
			this.contacts.length = 0;

			for (const ball of this.balls) {
				const ballHit = ball.hit;

				if (!ball.state.isFrozen) {                   // don't play with frozen balls

					ballHit.coll.hitTime = hitTime;        // search upto current hit time
					ballHit.coll.clear();

					// always check for playfield and top glass
					if (!this.meshAsPlayfield) {
						this.hitPlayfield.doHitTest(ball, ball.coll, this);
					}
					this.hitTopGlass.doHitTest(ball, ball.coll, this);

					// swap order of dynamic and static obj checks randomly
					if (Math.random() < 0.5) {
						this.hitOcTreeDynamic.hitTestBall(ball, ball.coll, this);  // dynamic objects
						this.hitOcTree.hitTestBall(ball, ball.coll, this);         // find the hit objects and hit times
					} else {
						this.hitOcTree.hitTestBall(ball, ball.coll, this);         // find the hit objects and hit times
						this.hitOcTreeDynamic.hitTestBall(ball, ball.coll, this);  // dynamic objects
					}

					const htz = ball.coll.hitTime;                                 // this ball's hit time

					if (htz < 0) {                         // no negative time allowed
						ball.coll.clear();
					}

					if (ball.coll.obj) {
						///////////////////////////////////////////////////////////////////////////
						if (htz <= hitTime) {
							hitTime = htz;                 // record actual event time

							if (htz < STATICTIME) {
								if (--StaticCnts < 0) {
									StaticCnts = 0;        // keep from wrapping
									hitTime = STATICTIME;
								}
							}
						}
					}
				}
			} // end loop over all balls

			this.recordContacts = false;

			// hittime now set ... or full frame if no hit
			// now update displacements to collide-contact or end of physics frame
			// !!!!! 2) move objects to hittime

			if (hitTime > STATICTIME) { // allow more zeros next round
				StaticCnts = STATICCNTS;
			}

			for (const mover of this.movers) {
				mover.updateDisplacements(hitTime);
			}

			// find balls that need to be collided and script'ed (generally there will be one, but more are possible)
			for (let i = 0; i < this.balls.length; i++) {

				const ball = this.balls[i];
				const pho = ball.coll.obj; // object that ball hit in trials

				// find balls with hit objects and minimum time
				if (pho && ball.coll.hitTime <= hitTime) {
					// now collision, contact and script reactions on active ball (object)+++++++++

					this.activeBall = ball;                         // For script that wants the ball doing the collision
					pho.collide(ball.coll, this);          // !!!!! 3) collision on active ball
					ball.coll.clear();                     // remove trial hit object pointer

					// Collide may have changed the velocity of the ball,
					// and therefore the bounding box for the next hit cycle
					if (this.balls[i] !== ball) { // Ball still exists? may have been deleted from list

						// collision script deleted the ball, back up one count
						--i;

					} else {
						ball.hit.calcHitBBox(); // do new boundings
					}
				}
			}

			/*
			 * Now handle contacts.
			 *
			 * At this point UpdateDisplacements() was already called, so the state is different
			 * from that at HitTest(). However, contacts have zero relative velocity, so
			 * hopefully nothing catastrophic has happened in the meanwhile.
			 *
			 * Maybe a two-phase setup where we first process only contacts, then only collisions
			 * could also work.
			 */
			if (Math.random() < 0.5) { // swap order of contact handling randomly
				// tslint:disable-next-line:prefer-for-of
				for (let i = 0; i < this.contacts.length; ++i) {
					this.contacts[i].obj!.contact(this.contacts[i], hitTime, this);
				}
			} else {
				for (let i = this.contacts.length - 1; i !== -1; --i) {
					this.contacts[i].obj!.contact(this.contacts[i], hitTime, this);
				}
			}
			CollisionEvent.release(...this.contacts);
			this.contacts.length = 0;

			// fixme ballspinhack

			dTime -= hitTime;
			this.swapBallCollisionHandling = !this.swapBallCollisionHandling; // swap order of ball-ball collisions
		}
	}

	/**
	 * Updates the physics engine.
	 *
	 * Call this before rendering each frame.
	 *
	 * @param time Absolute time in milliseconds
	 * @return Number of executed cycles
	 */
	public updatePhysics(time?: number): number {

		const initialTimeUsec = time !== undefined ? time * 1000 : Math.floor(this.now() * 1000);

		if (this.isPaused) {
			// Shift whole game forward in time
			this.startTimeUsec += initialTimeUsec - this.curPhysicsFrameTime;
			this.nextPhysicsFrameTime += initialTimeUsec - this.curPhysicsFrameTime;
			this.curPhysicsFrameTime = initialTimeUsec; // 0 time frame
		}

//#ifdef FPS
		this.lastFrameDuration = initialTimeUsec - this.lastTimeUsec;
		if (this.lastFrameDuration > 1000000) {
			this.lastFrameDuration = 0;
		}
		this.lastTimeUsec = initialTimeUsec;

		this.cFrames++;
		if (this.timeMsec - this.lastFpsTime > 1000) {
			this.fps = this.cFrames * 1000.0 / (this.timeMsec - this.lastFpsTime);
			this.lastFpsTime = this.timeMsec;
			this.fpsAvg += this.fps;
			this.fpsCount++;
			this.cFrames = 0;
		}
//#endif

		this.scriptPeriod = 0;
		let physIterations = 0;

		// loop here until current (real) time matches the physics (simulated) time
		while (this.curPhysicsFrameTime < initialTimeUsec) {

			// Get time in milliseconds for timers
			this.timeMsec = (this.curPhysicsFrameTime - this.startTimeUsec) / 1000;
			physIterations++;

			// Get the time until the next physics tick is done, and get the time
			// until the next frame is done
			// If the frame is the next thing to happen, update physics to that
			// point next update acceleration, and continue loop
			const physicsDiffTime = (this.nextPhysicsFrameTime - this.curPhysicsFrameTime) * (1.0 / DEFAULT_STEPTIME);

			const curTimeUsec = this.now(); // one could also do this directly in the while loop condition instead (so that the while loop will really match with the current time), but that leads to some stuttering on some heavy frames

			// TODO fix code below, breaks the test.
			// hung in the physics loop over 200 milliseconds or the number of physics iterations to catch up on is high (i.e. very low/unplayable FPS)
			// if ((this.now() - initialTimeUsec > 200000) || (this.physIterations > ((this.table.data!.physicsMaxLoops === 0) || (this.table.data!.physicsMaxLoops === 0xFFFFFFFF) ? 0xFFFFFFFF : (this.table.data!.physicsMaxLoops * (10000 / PHYSICS_STEPTIME))))) {
			// 	// can not keep up to real time
			// 	this.curPhysicsFrameTime  = initialTimeUsec;                             // skip physics forward ... slip-cycles -> 'slowed' down physics
			// 	this.nextPhysicsFrameTime = initialTimeUsec + PHYSICS_STEPTIME;
			// 	break; // go draw frame
			// }

			// update keys, hid, plumb, nudge, timers, etc
			this.pinInput.processKeys();

			// do the en/disable changes for the timers that piled up
			for (const changedHitTimer of this.changedHitTimers) {
				if (changedHitTimer.enabled) { // add the timer?
					if (this.hitTimers.indexOf(changedHitTimer.timer) < 0) {
						this.hitTimers.push(changedHitTimer.timer);
					}
				} else { // delete the timer?
					const idx = this.hitTimers.indexOf(changedHitTimer.timer);
					if (idx >= 0) {
						this.hitTimers.splice(idx, 1);
					}
				}
			}
			this.changedHitTimers.length = 0;

			const oldActiveBall = this.activeBall;
			this.activeBall = undefined; // No ball is the active ball for timers/key events

			if (this.scriptPeriod <= 1000 * MAX_TIMERS_MSEC_OVERALL) { // if overall script time per frame exceeded, skip
				const timeCur = (this.curPhysicsFrameTime - this.startTimeUsec) / 1000; // milliseconds

				for (const pht of this.hitTimers) {
					if ((pht.interval >= 0 && pht.nextFire <= timeCur) || pht.interval < 0) {
						const curNextFire = pht.nextFire;
						pht.pfe.fireGroupEvent(Event.TimerEventsTimer);
						// Only add interval if the next fire time hasn't changed since the event was run.
						if (curNextFire === pht.nextFire) {
							pht.nextFire += pht.interval;
						}
					}
				}
				this.scriptPeriod += Math.floor(this.now() - curTimeUsec);
			}
			this.activeBall = oldActiveBall;

			// emulator loop
			if (this.emu) {
				const deltaTimeMs = physicsDiffTime * 10;
				this.emu.emuSimulateCycle(deltaTimeMs);
			}

			this.updateVelocities();

			// primary physics loop
			this.physicsSimulateCycle(physicsDiffTime); // main simulator call

			this.curPhysicsFrameTime = this.nextPhysicsFrameTime; // new cycle, on physics frame boundary
			this.nextPhysicsFrameTime += PHYSICS_STEPTIME;     // advance physics position

		} // end while (m_curPhysicsFrameTime < initial_time_usec)

		this.physPeriod = Math.floor(this.now() * 1000) - initialTimeUsec;
		return physIterations;
	}

	public updateVelocities() {
		for (const mover of this.movers) {
			mover.updateVelocities(this); // always on integral physics frame boundary (spinner, gate, flipper, plunger, ball)
		}
	}

	public createBall(ballCreator: IBallCreationPosition, player: Player, radius = 25, mass = 1): Ball {

		const data = new BallData(radius, mass, this.table.data!.defaultBulbIntensityScaleOnBall);
		const ballId = Ball.idCounter++;
		const state = BallState.claim(`Ball${ballId}`, ballCreator.getBallCreationPosition(this.table));
		state.pos.z += data.radius;

		const ball = new Ball(ballId, data, state, ballCreator.getBallCreationVelocity(this.table), player, this.table);

		ballCreator.onBallCreated(this, ball);

		this.balls.push(ball);
		this.movers.push(ball.getMover()); // balls are always added separately to this list!

		this.hitObjectsDynamic.push(ball.hit);
		this.hitOcTreeDynamic.fillFromVector(this.hitObjectsDynamic);

		return ball;
	}

	public destroyBall(ball: Ball) {
		if (!ball) {
			return;
		}

		let activeBall: boolean;
		if (this.activeBallBC === ball) {
			activeBall = true;
			this.activeBall = undefined;
		} else {
			activeBall = false;
		}

		let debugBall: boolean;
		if (this.activeBallDebug === ball) {
			debugBall = true;
			this.activeBallDebug = undefined;
		} else {
			debugBall = false;
		}

		if (this.activeBallBC === ball) {
			this.activeBallBC = undefined;
		}

		this.balls.splice(this.balls.indexOf(ball), 1);
		this.movers.splice(this.movers.indexOf(ball.getMover()), 1);
		this.hitObjectsDynamic.splice(this.hitObjectsDynamic.indexOf(ball.hit), 1);
		this.hitOcTreeDynamic.fillFromVector(this.hitObjectsDynamic);

		//m_vballDelete.push_back(pball);

		if (debugBall && this.balls.length > 0) {
			this.activeBallDebug = this.balls[0];
		}
		if (activeBall && this.balls.length > 0) {
			this.activeBall = this.balls[0];
		}
	}

	private now(): number {
		return now() * SLOW_MO;
	}

	public setGravity(slopeDeg: number, strength: number): void {
		this.gravity.x = 0;
		this.gravity.y = Math.sin(degToRad(slopeDeg)) * strength;
		this.gravity.z = -Math.cos(degToRad(slopeDeg)) * strength;
	}
}
