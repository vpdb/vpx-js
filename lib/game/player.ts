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

import { EventEmitter } from 'events';
import { Table } from '..';
import { degToRad } from '../math/float';
import { Matrix2D } from '../math/matrix2d';
import { Vertex2D } from '../math/vertex2d';
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
import { Hit3DPoly } from '../physics/hit-3dpoly';
import { HitKD } from '../physics/hit-kd';
import { HitObject } from '../physics/hit-object';
import { HitPlane } from '../physics/hit-plane';
import { HitQuadtree } from '../physics/hit-quadtree';
import { LineSeg } from '../physics/line-seg';
import { MoverObject } from '../physics/mover-object';
import { now } from '../refs.node';
import { logger } from '../util/logger';
import { Ball } from '../vpt/ball/ball';
import { BallData } from '../vpt/ball/ball-data';
import { BallState } from '../vpt/ball/ball-state';
import { FlipperMover } from '../vpt/flipper/flipper-mover';
import { ItemState } from '../vpt/item-state';

export class Player extends EventEmitter {

	public gravity = new Vertex3D();
	private readonly table: Table;
	public readonly balls: Ball[] = [];
	private readonly movers: MoverObject[] = [];
	private readonly flipperMovers: FlipperMover[] = [];
	private readonly hitObjects: HitObject[] = [];
	private readonly hitObjectsDynamic: HitObject[] = [];

	private minPhysLoopTime: number = 0;
	private lastFlipTime: number = 0;
	private lastTimeUsec: number = 0;
	private lastFrameDuration: number = 0;
	private cFrames: number = 0;
	public timeMsec: number = 0;
	private lastFpsTime: number = 0;
	private fps: number = 0;
	private fpsAvg: number = 0;
	private fpsCount: number = 0;
	private physIterations: number = 0;
	private curPhysicsFrameTime: number = 0;
	private nextPhysicsFrameTime: number = 0;
	private startTimeUsec: number = 0;
	private physPeriod: number = 0;

	private hitPlayfield!: HitPlane; // HitPlanes cannot be part of octree (infinite size)
	private hitTopGlass!: HitPlane;
	public recordContacts: boolean = false;
	public contacts: CollisionEvent[] = [];

	private meshAsPlayfield: boolean = false;
	private hitOcTreeDynamic: HitKD = new HitKD();
	private hitOcTree: HitQuadtree = new HitQuadtree();
	private pactiveball?: Ball;
	public pactiveballBC?: Ball;
	private pactiveballDebug?: Ball;
	public swapBallCcollisionHandling: boolean = false;
	public lastPlungerHit: number = 0;
	public ballControl = false;
	public pBCTarget?: Vertex3D;

	private previousStates: { [key: string]: ItemState } = {};
	private currentStates: { [key: string]: ItemState } = {};

	// ball the script user can get with ActiveBall

	constructor(table: Table) {
		super();
		this.table = table;
		this.addTableElements(table);
		this.addCabinetBoundingHitShapes();
		this.initOcTree(table);
		this.initPhysics(table);
	}

	public popState(): ItemState[] {
		const changedStates: ItemState[] = [];
		for (const name of Object.keys(this.currentStates)) {
			const currentState = this.currentStates[name];
			const previousState = this.previousStates[name];
			if (!currentState.equals(previousState)) {
				changedStates.push(currentState);
				this.previousStates[name] = currentState.clone();
			}
		}
		return changedStates;
	}

	private addTableElements(table: Table): void {

		// setup table elements with player
		for (const playable of table.getPlayables()) {
			playable.setupPlayer(this, table);
		}

		// link movables to player
		for (const movable of table.getMovables()) {
			this.movers.push(movable.getMover());
			const state = movable.getState();
			this.currentStates[state.getName()] = state;
			this.previousStates[state.getName()] = state.clone();
		}

		// link hittables to player
		for (const hittable of table.getHittables()) {
			for (const hitObject of hittable.getHitShapes()) {
				this.hitObjects.push(hitObject);
				hitObject.calcHitBBox();
			}
		}

		// flippers are a special case
		for (const flipper of Object.values(table.flippers)) {
			this.flipperMovers.push(flipper.getMover());
		}
	}

	private addCabinetBoundingHitShapes(): void {

		// simple outer borders:
		let lineSeg: LineSeg;

		lineSeg = new LineSeg(new Vertex2D(this.table.data!.right, this.table.data!.top), new Vertex2D(this.table.data!.right, this.table.data!.bottom), this.table.getTableHeight(), this.table.data!.glassheight);
		this.hitObjects.push(lineSeg);

		lineSeg = new LineSeg(new Vertex2D(this.table.data!.left, this.table.data!.bottom), new Vertex2D(this.table.data!.left, this.table.data!.top), this.table.getTableHeight(), this.table.data!.glassheight);
		this.hitObjects.push(lineSeg);

		lineSeg = new LineSeg(new Vertex2D(this.table.data!.right, this.table.data!.bottom), new Vertex2D(this.table.data!.left, this.table.data!.bottom), this.table.getTableHeight(), this.table.data!.glassheight);
		this.hitObjects.push(lineSeg);

		lineSeg = new LineSeg(new Vertex2D(this.table.data!.left, this.table.data!.top), new Vertex2D(this.table.data!.right, this.table.data!.top), this.table.getTableHeight(), this.table.data!.glassheight);
		this.hitObjects.push(lineSeg);

		// glass:
		const rgv3D: Vertex3D[] = [
			new Vertex3D(this.table.data!.left, this.table.data!.top, this.table.data!.glassheight),
			new Vertex3D(this.table.data!.right, this.table.data!.top, this.table.data!.glassheight),
			new Vertex3D(this.table.data!.right, this.table.data!.bottom, this.table.data!.glassheight),
			new Vertex3D(this.table.data!.left, this.table.data!.bottom, this.table.data!.glassheight),
		];
		const ph3dpoly = new Hit3DPoly(rgv3D);
		ph3dpoly.calcHitBBox();
		this.hitObjects.push(ph3dpoly);

		// playfield
		this.hitPlayfield = new HitPlane(new Vertex3D(0, 0, 1), this.table.getTableHeight())
			.setFriction(this.getFriction())
			.setElasticity(this.getElasticity(), this.getElasticityFalloff())
			.setScatter(degToRad(this.getScatter()));

		// glass
		this.hitTopGlass = new HitPlane(new Vertex3D(0, 0, -1), this.table.data!.glassheight)
			.setElasticity(0.2);

		logger().info('[Player] Playfield hit objects set.', this.hitObjects);
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

	private getFriction(): number {
		return this.table.data!.overridePhysics
			? this.table.data!.overrideContactFriction
			: this.table.data!.friction!;
	}

	private getElasticity(): number {
		return this.table.data!.overridePhysics
			? this.table.data!.overrideElasticity
			: this.table.data!.elasticity!;
	}

	private getElasticityFalloff(): number {
		return this.table.data!.overridePhysics
			? this.table.data!.overrideElasticityFalloff
			: this.table.data!.elasticityFalloff!;
	}

	private getScatter(): number {
		return this.table.data!.overridePhysics
			? this.table.data!.overrideScatterAngle
			: this.table.data!.scatter!;
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
			this.contacts = [];

			for (const ball of this.balls) {
				const ballHit = ball.hit;

				if (!ballHit.isFrozen) {                   // don't play with frozen balls

					ballHit.coll.hitTime = hitTime;        // search upto current hit time
					ballHit.coll.obj = undefined;

					// always check for playfield and top glass
					if (!this.meshAsPlayfield) {
						ball.setCollision(this.hitPlayfield.doHitTest(ball, ball.getCollision(), this));
					}
					ball.setCollision(this.hitTopGlass.doHitTest(ball, ball.getCollision(), this));

					// swap order of dynamic and static obj checks randomly
					if (Math.random() < 0.5) {
						ball.setCollision(this.hitOcTreeDynamic.hitTestBall(ball, ball.getCollision(), this));  // dynamic objects
						ball.setCollision(this.hitOcTree.hitTestBall(ball, ball.getCollision(), this));         // find the hit objects and hit times
					} else {
						ball.setCollision(this.hitOcTree.hitTestBall(ball, ball.getCollision(), this));         // find the hit objects and hit times
						ball.setCollision(this.hitOcTreeDynamic.hitTestBall(ball, ball.getCollision(), this));  // dynamic objects
					}

					const htz = ball.getCollision().hitTime;                                 // this ball's hit time

					if (htz < 0) {                         // no negative time allowed
						ball.getCollision().clear();
					}

					if (ball.getCollision().obj) {
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
				const pho = ball.getCollision().obj; // object that ball hit in trials

				// find balls with hit objects and minimum time
				if (pho && ball.getCollision().hitTime <= hitTime) {
					// now collision, contact and script reactions on active ball (object)+++++++++

					this.pactiveball = ball;                         // For script that wants the ball doing the collision
					pho.collide(ball.getCollision(), this);          // !!!!! 3) collision on active ball
					ball.getCollision().obj = undefined;             // remove trial hit object pointer

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
			this.contacts = [];

			// fixme ballspinhack

			dTime -= hitTime;
			this.swapBallCcollisionHandling = !this.swapBallCcollisionHandling; // swap order of ball-ball collisions
		}
	}

	/**
	 * Updates the physics engine.
	 *
	 * Call this before rendering each frame.
	 *
	 * @param time Absolute time in microseconds
	 * @return Absolute time in microseconds
	 */
	public updatePhysics(time?: number): number {

		const initialTimeUsec = time || Math.floor(now() * 1000);

		// DJRobX's crazy latency-reduction code
		const deltaFrame = 0;
		// if (this.minPhysLoopTime > 0 && this.lastFlipTime > 0) {
		//
		// 	// We want the physics loops to sync up to the the frames, not
		// 	// the post-render period, as that can cause some judder.
		// 	deltaFrame = initialTimeUsec - this.lastFlipTime;
		// 	initialTimeUsec -= deltaFrame;
		// }

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

			//primary physics loop
			this.physicsSimulateCycle(physicsDiffTime); // main simulator call

			this.curPhysicsFrameTime = this.nextPhysicsFrameTime; // new cycle, on physics frame boundary
			this.nextPhysicsFrameTime += PHYSICS_STEPTIME;     // advance physics position

			firstCycle = false;
		} // end while (m_curPhysicsFrameTime < initial_time_usec)

		this.physPeriod = (Math.floor(now() * 1000) - deltaFrame) - initialTimeUsec;
		return initialTimeUsec;
	}

	public updateVelocities() {
		for (const mover of this.movers) {
			mover.updateVelocities(this); // always on integral physics frame boundary (spinner, gate, flipper, plunger, ball)
		}
	}

	public createBall(ballCreator: IBallCreationPosition, radius = 25, mass = 1): Ball {

		const data = new BallData(radius, mass, this.table.data!.defaultBulbIntensityScaleOnBall);
		const state = new BallState(`Ball${Ball.idCounter}`, ballCreator.getBallCreationPosition(this.table), new Matrix2D());
		state.pos.z += data.radius;

		const ball = new Ball(data, state, ballCreator.getBallCreationVelocity(this.table), this.table.data!);

		this.balls.push(ball);
		this.movers.push(ball.getMover()); // balls are always added separately to this list!
		this.currentStates[ball.getName()] = state;

		this.hitObjectsDynamic.push(ball.hit);
		this.hitOcTreeDynamic.fillFromVector(this.hitObjectsDynamic);
		this.emit('ballCreated', ball.getName());

		return ball;
	}

	public destroyBall(pball: Ball) {
		if (!pball) {
			return;
		}

		let activeball: boolean;
		if (this.pactiveballBC === pball) {
			activeball = true;
			this.pactiveball = undefined;
		} else {
			activeball = false;
		}

		let debugball: boolean;
		if (this.pactiveballDebug === pball) {
			debugball = true;
			this.pactiveballDebug = undefined;
		} else {
			debugball = false;
		}

		if (this.pactiveballBC === pball) {
			this.pactiveballBC = undefined;
		}

		this.balls.splice(this.balls.indexOf(pball), 1);
		this.movers.splice(this.movers.indexOf(pball.getMover()), 1);
		this.hitObjectsDynamic.splice(this.hitObjectsDynamic.indexOf(pball.hit), 1);

		this.hitOcTreeDynamic.fillFromVector(this.hitObjectsDynamic);

		//m_vballDelete.push_back(pball);

		if (debugball && this.balls.length > 0) {
			this.pactiveballDebug = this.balls[0];
		}
		if (activeball && this.balls.length > 0) {
			this.pactiveball = this.balls[0];
		}

		this.emit('ballDestroyed', pball.getName());
	}

	// public setGravity(slopeDeg: number, strength: number): void {
	// 	this.gravity.x = 0;
	// 	this.gravity.y = Math.sin(degToRad(slopeDeg)) * strength;
	// 	this.gravity.z = -Math.cos(degToRad(slopeDeg)) * strength;
	// }

	private initPhysics(table: Table) {
		const minSlope = table.data!.overridePhysics ? DEFAULT_TABLE_MIN_SLOPE : table.data!.angletiltMin!;
		const maxSlope = table.data!.overridePhysics ? DEFAULT_TABLE_MAX_SLOPE : table.data!.angletiltMax!;
		const slope = minSlope + (maxSlope - minSlope) * table.data!.globalDifficulty!;

		this.gravity.x = 0;
		this.gravity.y = Math.sin(degToRad(slope)) * (table.data!.overridePhysics ? DEFAULT_TABLE_GRAVITY : table.data!.Gravity);
		this.gravity.z = -Math.cos(degToRad(slope)) * (table.data!.overridePhysics ? DEFAULT_TABLE_GRAVITY : table.data!.Gravity);
	}
}

export interface IBallCreationPosition {
	getBallCreationPosition(table: Table): Vertex3D;
	getBallCreationVelocity(table: Table): Vertex3D;
	onBallCreated(player: Player, ball: Ball): void;
}
