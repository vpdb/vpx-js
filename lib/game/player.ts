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

import { Table } from '..';
import { degToRad } from '../math/float';
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { CollisionEvent } from '../physics/collision-event';
import { DEFAULT_STEPTIME, PHYSICS_STEPTIME, STATICCNTS, STATICTIME } from '../physics/constants';
import { Hit3DPoly } from '../physics/hit-3dpoly';
import { HitKD } from '../physics/hit-kd';
import { HitObject } from '../physics/hit-object';
import { HitPlane } from '../physics/hit-plane';
import { HitQuadtree } from '../physics/hit-quadtree';
import { LineSeg } from '../physics/line-seg';
import { MoverObject } from '../physics/mover-object';
import { now } from '../refs.node';
import { Ball } from '../vpt/ball/ball';
import { BallData } from '../vpt/ball/ball-data';
import { BallState } from '../vpt/ball/ball-state';
import { FlipperMover } from '../vpt/flipper/flipper-mover';

export class Player {

	public gravity = new Vertex3D();
	private readonly table: Table;
	private readonly balls: Ball[] = [];
	private readonly movers: MoverObject[] = [];
	private readonly flipperMovers: FlipperMover[] = [];
	private readonly hitObjects: HitObject[] = [];
	private stateCallback?: (name: string, state: any) => void;

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
	private state: { [key: string]: any} = {};
	public curMechPlungerPos: number = 0;
	public recordContacts: boolean = false;
	public contacts: CollisionEvent[] = [];

	private meshAsPlayfield: boolean = false;
	private hitOcTreeDynamic: HitKD = new HitKD();
	private hitOcTree: HitQuadtree = new HitQuadtree();
	private pactiveball?: Ball;
	public pactiveballBC?: Ball;
	public swapBallCcollisionHandling: boolean = false;

	// ball the script user can get with ActiveBall

	constructor(table: Table) {
		this.table = table;
		this.table.setupPlayer(this);

		this.addCabinetBoundingHitShapes();
	}

	public setOnStateChanged(callback: StateCallback): void {
		this.stateCallback = callback;
	}

	public changeState(name: string, state: any) {
		if (this.stateCallback && (!this.state[name] || !this.state[name].equals(state))) {
			this.stateCallback(name, state);
		}
		this.state[name] = state;
	}

	public popState() {
		if (Object.keys(this.state).length === 0) {
			return false;
		}
		const state = this.state;
		this.state = {};
		return state;
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
		this.hitObjects.push(ph3dpoly);

		// playfield
		this.hitPlayfield = new HitPlane(new Vertex3D(0, 0, 1), this.table.getTableHeight())
			.setFriction(this.getFriction())
			.setElasticy(this.getElasticity(), this.getElasticityFalloff())
			.setScatter(degToRad(this.getScatter()));

		// glass
		this.hitTopGlass = new HitPlane(new Vertex3D(0, 0, -1), this.table.data!.glassheight)
			.setElasticy(0.2);
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

	public physicsSimulateCycle(dtime: number) {

		let StaticCnts = STATICCNTS;    // maximum number of static counts

		// it's okay to have this code outside of the inner loop, as the ball hitrects already include the maximum distance they can travel in that timespan
		this.hitOcTreeDynamic.update();

		while (dtime > 0) {
			let hitTime = dtime;

			// find earliest time where a flipper collides with its stop
			for (const flipperMover of this.flipperMovers) {
				const flipperHitTime = flipperMover.getHitTime();
				if (flipperHitTime > 0 && flipperHitTime < hitTime) { //!! >= 0.f causes infinite loop
					hitTime = flipperHitTime;
				}
			}

			this.recordContacts = true;
			this.contacts = [];

			for (const pball of this.balls) {
				const ballHit = pball.getHitObject();
				if (!ballHit.isFrozen) { // don't play with frozen balls

					ballHit.coll.hitTime = hitTime;          // search upto current hittime
					ballHit.coll.obj = undefined;

					// always check for playfield and top glass
					if (!this.meshAsPlayfield) {
						this.hitPlayfield.doHitTest(pball, pball.getCollision(), this);
					}

					this.hitTopGlass.doHitTest(pball,  pball.getCollision(), this);

					if (Math.random() < 0.5) { // swap order of dynamic and static obj checks randomly
						this.hitOcTreeDynamic.hitTestBall(pball, pball.getCollision(), this);  // dynamic objects
						this.hitOcTree.HitTestBall(pball, pball.getCollision(), this);         // find the hit objects and hit times
					} else {
						this.hitOcTree.HitTestBall(pball, pball.getCollision(), this);         // find the hit objects and hit times
						this.hitOcTreeDynamic.hitTestBall(pball, pball.getCollision(), this);  // dynamic objects
					}

					const htz = pball.getCollision().hitTime; // this ball's hit time
					if (htz < 0) { // no negative time allowed
						pball.getCollision().clear();
					}

					if (pball.getCollision().obj) {
						///////////////////////////////////////////////////////////////////////////
						if (htz <= hitTime) {
							hitTime = htz;                         // record actual event time

							if (htz < STATICTIME) {
								if (--StaticCnts < 0) {
									StaticCnts = 0;                // keep from wrapping
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

			for (let i = 0; i < this.balls.length; i++) { // use m_vball.size(), in case script deletes a ball

				const pball = this.balls[i];

				const pho = pball.getCollision().obj; // object that ball hit in trials
				if (pho && pball.getCollision().hitTime <= hitTime) { // find balls with hit objects and minimum time
					// now collision, contact and script reactions on active ball (object)+++++++++

					this.pactiveball = pball;                       // For script that wants the ball doing the collision
					pho.collide(pball.getCollision(), this);                 //!!!!! 3) collision on active ball
					pball.getCollision().obj = undefined;                  // remove trial hit object pointer

					// Collide may have changed the velocity of the ball,
					// and therefore the bounding box for the next hit cycle
					if (this.balls[i] !== pball) { // Ball still exists? may have been deleted from list

						// collision script deleted the ball, back up one count
						--i;
						continue;

					} else {
						pball.getHitObject().calcHitBBox(); // do new boundings
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


			dtime -= hitTime;
		}
	}

	public updatePhysics() {

		let initialTimeUsec = Math.floor(now() * 1000);

		// DJRobX's crazy latency-reduction code
		let deltaFrame = 0;
		if (this.minPhysLoopTime > 0 && this.lastFlipTime > 0) {

			// We want the physics loops to sync up to the the frames, not
			// the post-render period, as that can cause some judder.
			deltaFrame = initialTimeUsec - this.lastFlipTime;
			initialTimeUsec -= deltaFrame;
		}

		//if (ShowFPS())
		this.lastFrameDuration = initialTimeUsec - this.lastTimeUsec;
		if (this.lastFrameDuration > 1000000) {
			this.lastFrameDuration = 0;
		}
		this.lastTimeUsec = initialTimeUsec;

		this.cFrames++;
		if ((this.timeMsec - this.lastFpsTime) > 1000) {
			this.fps = this.cFrames * 1000.0 / (this.timeMsec - this.lastFpsTime);
			this.lastFpsTime = this.timeMsec;
			this.fpsAvg += this.fps;
			this.fpsCount++;
			this.cFrames = 0;
		}

		//m_script_period = 0;

		this.physIterations = 0;

		let firstCycle = true;

		while (this.curPhysicsFrameTime < initialTimeUsec) { // loop here until current (real) time matches the physics (simulated) time
			// Get time in milliseconds for timers
			this.timeMsec = (this.curPhysicsFrameTime - this.startTimeUsec) / 1000;

			this.physIterations++;

			// Get the time until the next physics tick is done, and get the time
			// until the next frame is done
			// If the frame is the next thing to happen, update physics to that
			// point next update acceleration, and continue loop

			const physicsDiffTime = (this.nextPhysicsFrameTime - this.curPhysicsFrameTime) * (1.0 / DEFAULT_STEPTIME);

			//if (physics_to_graphic_diff_time < physics_diff_time)          // is graphic frame time next???
			//{
			//      PhysicsSimulateCycle(physics_to_graphic_diff_time);      // advance physics to this time
			//      m_curPhysicsFrameTime = initial_time_usec;               // now current to the wall clock
			//      break;  //this is the common exit from the loop          // exit skipping accelerate
			//}                     // some rare cases will exit from while()

			// DJRobX's crazy latency-reduction code: Artificially lengthen the execution of the physics loop by X usecs, to give more opportunities to read changes from input(s) (try values in the multiple 100s up to maximum 1000 range, in general: the more, the faster the CPU is)
			//                                        Intended mainly to be used if vsync is enabled (e.g. most idle time is shifted from vsync-waiting to here)
			if (this.minPhysLoopTime > 0) {
				const basetime = Math.floor(now() * 1000);
				const targettime = (this.minPhysLoopTime * this.physIterations) + this.lastFlipTime;

				// If we're 3/4 of the way through the loop fire a "frame sync" timer event so VPM can react to input.
				// This will effectively double the "-1" timer rate, but the goal, when this option is enabled, is to reduce latency
				// and those "-1" timer calls should be roughly halfway through the cycle
				if (this.physIterations === 750 / (this.fps + 1)) {
					firstCycle = true; //!! side effects!?!
					//this.m_script_period = 0; // !!!! SIDE EFFECTS?!?!?!
				}
				if (basetime < targettime) {
					//uSleep(targettime - basetime);
				}
			}
			// end DJRobX's crazy code
			const curTimeUsec = Math.floor(now() * 1000) - deltaFrame; //!! one could also do this directly in the while loop condition instead (so that the while loop will really match with the current time), but that leads to some stuttering on some heavy frames

			// hung in the physics loop over 200 milliseconds or the number of physics iterations to catch up on is high (i.e. very low/unplayable FPS)
			// if ((curTimeUsec - initialTimeUsec > 200000) || (this.physIterations > ((this.table.data!.physicsMaxLoops === 0) || (this.table.gameData!.physicsMaxLoops === 0xFFFFFFFF) ? 0xFFFFFFFF : (this.table.gameData!.physicsMaxLoops! * (10000 / PHYSICS_STEPTIME))/*2*/))) {                                                             // can not keep up to real time
			// 	this.curPhysicsFrameTime = initialTimeUsec;                // skip physics forward ... slip-cycles -> 'slowed' down physics
			// 	this.nextPhysicsFrameTime = initialTimeUsec + PHYSICS_STEPTIME;
			// 	break;                                                     // go draw frame
			// }

			//update keys, hid, plumb, nudge, timers, etc
			//const U32 sim_msec = (U32)(m_curPhysicsFrameTime / 1000);
			const curTimeMsec = curTimeUsec / 1000;

			//m_pininput.ProcessKeys(/*sim_msec,*/ cur_time_msec);

			// mixer_update();
			// hid_update(/*sim_msec*/cur_time_msec);
			// plumb_update(/*sim_msec*/cur_time_msec, GetNudgeX(), GetNudgeY());

			// #ifdef ACCURATETIMERS
			// 	// do the en/disable changes for the timers that piled up
			// 	for(size_t i = 0; i < m_changed_vht.size(); ++i)
			// 	if (m_changed_vht[i].m_enabled) // add the timer?
			// 	{
			// 		if (FindIndexOf(m_vht, m_changed_vht[i].m_timer) < 0)
			// 			m_vht.push_back(m_changed_vht[i].m_timer);
			// 	}
			// 	else // delete the timer?
			// 	{
			// 		const int idx = FindIndexOf(m_vht, m_changed_vht[i].m_timer);
			// 		if (idx >= 0)
			// 			m_vht.erase(m_vht.begin() + idx);
			// 	}
			// 	m_changed_vht.clear();
			//
			// 	Ball * const old_pactiveball = m_pactiveball;
			// 	m_pactiveball = NULL; // No ball is the active ball for timers/key events
			//
			// 	if(m_script_period <= 1000*MAX_TIMERS_MSEC_OVERALL) // if overall script time per frame exceeded, skip
			// 	{
			// 		const unsigned int p_timeCur = (unsigned int)((m_curPhysicsFrameTime - m_StartTime_usec) / 1000); // milliseconds
			//
			// 		for (size_t i = 0; i < m_vht.size(); i++)
			// 		{
			// 			HitTimer * const pht = m_vht[i];
			// 			if ((pht->m_interval >= 0 && pht->m_nextfire <= p_timeCur) || (pht->m_interval < 0 && first_cycle))
			// 			{
			// 				const unsigned int curnextfire = pht->m_nextfire;
			// 				pht->m_pfe->FireGroupEvent(DISPID_TimerEvents_Timer);
			// 				// Only add interval if the next fire time hasn't changed since the event was run.
			// 				// Handles corner case:
			// 				//Timer1.Enabled = False
			// 				//Timer1.Interval = 1000
			// 				//Timer1.Enabled = True
			// 				if (curnextfire == pht->m_nextfire)
			// 				pht->m_nextfire += pht->m_interval;
			// 			}
			// 		}
			//
			// 		m_script_period += (unsigned int)(usec() - (cur_time_usec+delta_frame));
			// 	}
			//
			// 	m_pactiveball = old_pactiveball;
			// #endif

			// NudgeUpdate();       // physics_diff_time is the balance of time to move from the graphic frame position to the next
			// MechPlungerUpdate(); // integral physics frame. So the previous graphics frame was (1.0 - physics_diff_time) before
			// this integral physics frame. Accelerations and inputs are always physics frame aligned

			// table movement is modeled as a mass-spring-damper system
			//   u'' = -k u - c u'
			// with a spring constant k and a damping coefficient c
			// const Vertex3Ds force = -m_nudgeSpring * m_tableDisplacement - m_nudgeDamping * m_tableVel;
			// m_tableVel          += (float)PHYS_FACTOR * force;
			// m_tableDisplacement += (float)PHYS_FACTOR * m_tableVel;
			//
			// m_tableVelDelta = m_tableVel - m_tableVelOld;
			// m_tableVelOld = m_tableVel;
			//
			// // legacy/VP9 style keyboard nudging
			// if (m_legacyNudge && m_legacyNudgeTime != 0)
			// {
			// 	--m_legacyNudgeTime;
			//
			// 	if (m_legacyNudgeTime == 95)
			// 	{
			// 		m_NudgeX = -m_legacyNudgeBackX * 2.0f;
			// 		m_NudgeY =  m_legacyNudgeBackY * 2.0f;
			// 	}
			// 	else if (m_legacyNudgeTime == 90)
			// 	{
			// 		m_NudgeX =  m_legacyNudgeBackX;
			// 		m_NudgeY = -m_legacyNudgeBackY;
			// 	}
			//
			// 	if (m_NudgeShake > 0.0f)
			// 	SetScreenOffset(m_NudgeShake * m_legacyNudgeBackX * sqrf((float)m_legacyNudgeTime*0.01f), -m_NudgeShake * m_legacyNudgeBackY * sqrf((float)m_legacyNudgeTime*0.01f));
			// }
			// else
			// if (m_NudgeShake > 0.0f)
			// {
			// 	// NB: in table coordinates, +Y points down, but in screen coordinates, it points up,
			// 	// so we have to flip the y component
			// 	SetScreenOffset(m_NudgeShake * m_tableDisplacement.x, -m_NudgeShake * m_tableDisplacement.y);
			// }
			//
			// // Apply our filter to the nudge data
			// if (m_pininput.m_enable_nudge_filter)
			// 	FilterNudge();

			this.updateVelocities();

			//primary physics loop
			this.physicsSimulateCycle(physicsDiffTime); // main simulator call

			//ball trail, keep old pos of balls
			// for (size_t i = 0; i < m_vball.size(); i++)
			// {
			// 	Ball * const pball = m_vball[i];
			// 	pball->m_oldpos[pball->m_ringcounter_oldpos / (10000 / PHYSICS_STEPTIME)] = pball->m_pos;
			//
			// 	pball->m_ringcounter_oldpos++;
			// 	if (pball->m_ringcounter_oldpos == MAX_BALL_TRAIL_POS*(10000 / PHYSICS_STEPTIME))
			// 		pball->m_ringcounter_oldpos = 0;
			// }

			//slintf( "PT: %f %f %u %u %u\n", physics_diff_time, physics_to_graphic_diff_time, (U32)(m_curPhysicsFrameTime/1000), (U32)(initial_time_usec/1000), cur_time_msec );

			this.curPhysicsFrameTime = this.nextPhysicsFrameTime; // new cycle, on physics frame boundary
			this.nextPhysicsFrameTime += PHYSICS_STEPTIME;     // advance physics position

			firstCycle = false;
		} // end while (m_curPhysicsFrameTime < initial_time_usec)

		this.physPeriod = (Math.floor(now() * 1000) - deltaFrame) - initialTimeUsec;
	}

	public updateVelocities() {
		for (const mover of this.movers) {
			mover.updateVelocities(); // always on integral physics frame boundary (spinner, gate, flipper, plunger, ball)
		}
	}

	public addMover(mover: MoverObject) {
		this.movers.push(mover);
	}

	public addFlipperMover(flipperMover: FlipperMover) {
		this.flipperMovers.push(flipperMover);
	}

	public createBall(ballCreator: IBallCreationPosition, velocity: Vertex3D = new Vertex3D( 0.1, 0, 0), radius = 25, mass = 1): Ball {

		const data = new BallData(radius, mass, this.table.data!.defaultBulbIntensityScaleOnBall);
		const state = new BallState(ballCreator.getBallCreationPosition(this.table), velocity);
		state.pos.z += data.radius;

		const ball = new Ball(data, state, this.table.data!);

		this.balls.push(ball);
		this.movers.push(ball.getMover()); // balls are always added separately to this list!
		this.hitObjects.push(ball.getHitObject());

		//this.hitOcTreeDynamic.fillFromVector(this.m_vho_dynamic);

		return ball;
	}

	// public setGravity(slopeDeg: number, strength: number): void {
	// 	this.gravity.x = 0;
	// 	this.gravity.y = Math.sin(degToRad(slopeDeg)) * strength;
	// 	this.gravity.z = -Math.cos(degToRad(slopeDeg)) * strength;
	// }
}

export type StateCallback = (name: string, state: any) => void;

export interface IBallCreationPosition {
	getBallCreationPosition(table: Table): Vertex3D;
}
