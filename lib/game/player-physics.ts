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
import { IBallCreationPosition } from './player';

const SLOW_MO = 1; // the lower, the slower
const ANIM_FPS = 60;
const ANIM_FRAME_USEC = 1 / ANIM_FPS * 1000000;
const ANIM_FRAME_MSEC = Math.floor(1 / ANIM_FPS * 1000);

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

	private readonly table: Table;
	private readonly movers: MoverObject[] = [];
	private readonly flipperMovers: FlipperMover[] = [];

	private readonly hitObjects: HitObject[] = [];
	private readonly hitObjectsDynamic: HitObject[] = [];
	private hitPlayfield!: HitPlane; // HitPlanes cannot be part of octree (infinite size)
	private hitTopGlass!: HitPlane;

	private meshAsPlayfield: boolean = false;
	private hitOcTreeDynamic: HitKD = new HitKD();
	private hitOcTree: HitQuadtree = new HitQuadtree();

	private minPhysLoopTime: number = 0;
	private lastAnimTimeUsec: number = 0;
	private lastFlipTime: number = 0;
	private lastTimeUsec: number = 0;
	private lastFrameDuration: number = 0;
	private cFrames: number = 0;

	private lastFpsTime: number = 0;
	private fps: number = 0;
	private fpsAvg: number = 0;
	private fpsCount: number = 0;
	private physIterations: number = 0;
	private curPhysicsFrameTime: number = 0;
	private nextPhysicsFrameTime: number = 0;
	private startTimeUsec: number = 0;
	private physPeriod: number = 0;

	private activeBallDebug?: Ball;

	/**
	 * Player physics are instantiated in the Player's constructor.
	 * @param table
	 */
	constructor(table: Table) {
		this.table = table;
	}

	/**
	 * This is called in the player's init().
	 */
	public init() {
		const minSlope = this.table.data!.overridePhysics ? DEFAULT_TABLE_MIN_SLOPE : this.table.data!.angletiltMin!;
		const maxSlope = this.table.data!.overridePhysics ? DEFAULT_TABLE_MAX_SLOPE : this.table.data!.angletiltMax!;
		const slope = minSlope + (maxSlope - minSlope) * this.table.data!.globalDifficulty!;

		this.gravity.x = 0;
		this.gravity.y = Math.sin(degToRad(slope)) * (this.table.data!.overridePhysics ? DEFAULT_TABLE_GRAVITY : this.table.data!.Gravity);
		this.gravity.z = -Math.cos(degToRad(slope)) * (this.table.data!.overridePhysics ? DEFAULT_TABLE_GRAVITY : this.table.data!.Gravity);

		// [vpx-js added] init animation timers
		for (const animatable of this.table.getAnimatables()) {
			animatable.getAnimation().init(this);
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

				if (!ballHit.isFrozen) {                   // don't play with frozen balls

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
	 * @return Absolute time in milliseconds
	 */
	public updatePhysics(time?: number): number {

		const initialTimeUsec = time !== undefined ? time * 1000 : Math.floor(this.now() * 1000);

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

		//m_script_period = 0;
		this.physIterations = 0;

		let firstCycle = true;

		// loop here until current (real) time matches the physics (simulated) time
		while (this.curPhysicsFrameTime < initialTimeUsec) {

			// Get time in milliseconds for timers
			this.timeMsec = (this.curPhysicsFrameTime - this.startTimeUsec) / 1000;
			this.physIterations++;

			// Get the time until the next physics tick is done, and get the time
			// until the next frame is done
			// If the frame is the next thing to happen, update physics to that
			// point next update acceleration, and continue loop
			const physicsDiffTime = (this.nextPhysicsFrameTime - this.curPhysicsFrameTime) * (1.0 / DEFAULT_STEPTIME);

			this.updateVelocities();

			// primary physics loop
			this.physicsSimulateCycle(physicsDiffTime); // main simulator call

			// animations
			if (Math.round(this.curPhysicsFrameTime / 1000) % ANIM_FRAME_MSEC === 0 || this.curPhysicsFrameTime - this.lastAnimTimeUsec >= ANIM_FRAME_USEC) {
				//console.log(this.lastAnimTimeUsec)
				for (const animatable of this.table.getAnimatables()) {
					animatable.getAnimation().updateAnimation(this, this.table);
				}
				this.lastAnimTimeUsec = this.curPhysicsFrameTime;
			}

			this.curPhysicsFrameTime = this.nextPhysicsFrameTime; // new cycle, on physics frame boundary
			this.nextPhysicsFrameTime += PHYSICS_STEPTIME;     // advance physics position

			firstCycle = false;
		} // end while (m_curPhysicsFrameTime < initial_time_usec)

		this.physPeriod = Math.floor(this.now() * 1000) - initialTimeUsec;
		return initialTimeUsec;
	}

	public updateVelocities() {
		for (const mover of this.movers) {
			mover.updateVelocities(this); // always on integral physics frame boundary (spinner, gate, flipper, plunger, ball)
		}
	}

	public createBall(ballCreator: IBallCreationPosition, radius = 25, mass = 1): Ball {

		const data = new BallData(radius, mass, this.table.data!.defaultBulbIntensityScaleOnBall);
		const state = BallState.claim(`Ball${Ball.idCounter}`, ballCreator.getBallCreationPosition(this.table));
		state.pos.z += data.radius;

		const ball = new Ball(data, state, ballCreator.getBallCreationVelocity(this.table), this.table.data!);

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

	// public setGravity(slopeDeg: number, strength: number): void {
	// 	this.gravity.x = 0;
	// 	this.gravity.y = Math.sin(degToRad(slopeDeg)) * strength;
	// 	this.gravity.z = -Math.cos(degToRad(slopeDeg)) * strength;
	// }
}
