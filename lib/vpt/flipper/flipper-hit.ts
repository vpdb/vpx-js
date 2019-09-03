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

import { Event } from '../../game/event';
import { EventProxy } from '../../game/event-proxy';
import { PlayerPhysics } from '../../game/player-physics';
import { degToRad } from '../../math/float';
import { FRect3D } from '../../math/frect3d';
import { clamp } from '../../math/functions';
import { Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionEvent } from '../../physics/collision-event';
import {
	C_CONTACTVEL,
	C_DISP_GAIN,
	C_DISP_LIMIT,
	C_EMBEDDED,
	C_EMBEDSHOT,
	C_INTERATIONS,
	C_LOWNORMVEL,
	C_PRECISION,
	C_TOL_ENDPNTS,
	PHYS_TOUCH,
} from '../../physics/constants';
import { elasticityWithFalloff } from '../../physics/functions';
import { HitObject } from '../../physics/hit-object';
import { Ball } from '../ball/ball';
import { Table } from '../table/table';
import { TableData } from '../table/table-data';
import { FlipperConfig } from './flipper';
import { FlipperData } from './flipper-data';
import { FlipperMover } from './flipper-mover';
import { FlipperState } from './flipper-state';

export class FlipperHit extends HitObject {

	private readonly mover: FlipperMover;
	private readonly data: FlipperData;
	private readonly state: FlipperState;
	private readonly tableData: TableData;
	private readonly events: EventProxy;
	private lastHitTime: number = 0;

	public static getInstance(data: FlipperData, state: FlipperState, events: EventProxy, physics: PlayerPhysics, table: Table): FlipperHit {
		data.updatePhysicsSettings(table);
		const height = table.getSurfaceHeight(data.szSurface, data.center.x, data.center.y);
		if (data.flipperRadiusMin > 0 && data.flipperRadiusMax > data.flipperRadiusMin) {
			data.flipperRadius = data.flipperRadiusMax - (data.flipperRadiusMax - data.flipperRadiusMin) /* m_ptable->m_globalDifficulty*/;
			data.flipperRadius = Math.max(data.flipperRadius, data.baseRadius - data.endRadius + 0.05);
		} else {
			data.flipperRadius = data.flipperRadiusMax;
		}
		return new FlipperHit({
				center: data.center,
				baseRadius: Math.max(data.baseRadius, 0.01),
				endRadius: Math.max(data.endRadius, 0.01),
				flipperRadius: Math.max(data.flipperRadius, 0.01),
				angleStart: degToRad(data.startAngle),
				angleEnd: degToRad(data.endAngle),
				zLow: height,
				zHigh: height + data.height,
			},
			data,
			state,
			events,
			physics,
			table.data!,
		);
	}

	constructor(config: FlipperConfig, data: FlipperData, state: FlipperState, events: EventProxy, physics: PlayerPhysics, tableData: TableData) {
		super();
		this.events = events;
		this.mover = new FlipperMover(config, data, state, events, physics, tableData);
		this.data = data;
		this.state = state;
		this.tableData = tableData;
		this.updatePhysicsFromFlipper();
	}

	public calcHitBBox(): void {
		// Allow roundoff
		this.hitBBox = new FRect3D(
			this.mover.hitCircleBase.center.x - this.mover.flipperRadius - this.mover.endRadius - 0.1,
			this.mover.hitCircleBase.center.x + this.mover.flipperRadius + this.mover.endRadius + 0.1,
			this.mover.hitCircleBase.center.y - this.mover.flipperRadius - this.mover.endRadius - 0.1,
			this.mover.hitCircleBase.center.y + this.mover.flipperRadius + this.mover.endRadius + 0.1,
			this.mover.hitCircleBase.hitBBox.zlow,
			this.mover.hitCircleBase.hitBBox.zhigh,
		);
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): number {
		if (!this.data.isEnabled) {
			return -1.0;
		}
		const lastFace = this.mover.lastHitFace;

		// for effective computing, adding a last face hit value to speed calculations
		// a ball can only hit one face never two
		// also if a ball hits a face then it can not hit either radius
		// so only check these if a face is not hit
		// endRadius is more likely than baseRadius ... so check it first

		let hitTime = this.hitTestFlipperFace(ball, dTime, coll, lastFace); // first face
		if (hitTime >= 0) {
			return hitTime;
		}

		hitTime = this.hitTestFlipperFace(ball, dTime, coll, !lastFace); //second face
		if (hitTime >= 0) {
			this.mover.lastHitFace = !lastFace;                      // change this face to check first // HACK
			return hitTime;
		}

		hitTime = this.hitTestFlipperEnd(ball, dTime, coll);         // end radius
		if (hitTime >= 0) {
			return hitTime;
		}

		hitTime = this.mover.hitCircleBase.hitTest(ball, dTime, coll);
		if (hitTime >= 0) {
			// Tangent velocity of contact point (rotate Normal right)
			// units: rad*d/t (Radians*diameter/time)
			coll.hitVel = new Vertex2D(0, 0);
			coll.hitMomentBit = true;
			return hitTime;

		} else {
			return -1.0; // no hits
		}
	}

	public contact(coll: CollisionEvent, dTime: number, physics: PlayerPhysics): void {
		const ball = coll.ball;
		const normal = coll.hitNormal!;

//#ifdef C_EMBEDDED
		if (coll.hitDistance < -C_EMBEDDED) {
			// magic to avoid balls being pushed by each other through resting flippers!
			ball.hit.vel.addAndRelease(normal.clone(true).multiplyScalar(0.1));
		}
//#endif

		const [ vRel, rB, rF ] = this.getRelativeVelocity(normal, ball);

		const normVel = vRel.dot(normal);                  // this should be zero, but only up to +/- C_CONTACTVEL

		// If some collision has changed the ball's velocity, we may not have to do anything.
		if (normVel <= C_CONTACTVEL) {

			// compute accelerations of point on ball and flipper
			const aB = ball.hit.surfaceAcceleration(rB, physics);
			const aF = this.mover.surfaceAcceleration(rF, true);
			const aRel = aB.clone(true).sub(aF);

			// time derivative of the normal vector
			const normalDeriv = Vertex3D.crossZ(this.mover.angleSpeed, normal, true);

			// relative acceleration in the normal direction
			const normAcc = aRel.dot(normal) + 2.0 * normalDeriv.dot(vRel);
			Vertex3D.release(normalDeriv, aF);

			if (normAcc >= 0) {
				Vertex3D.release(aRel, vRel, rB, rF);
				return;     // objects accelerating away from each other, nothing to do
			}

			// hypothetical accelerations arising from a unit contact force in normal direction
			const aBc = normal.clone(true).multiplyScalar(ball.hit.invMass);
			const pv2 = normal.clone(true).multiplyScalar(-1);
			const cross = Vertex3D.crossProduct(rF, pv2, true);
			const pv1 = cross.clone(true).divideScalar(this.mover.inertia);
			const aFc = Vertex3D.crossProduct(pv1, rF, true);
			const contactForceAcc = normal.dotAndRelease(aBc.clone(true).sub(aFc));

			// find j >= 0 such that normAcc + j * contactForceAcc >= 0  (bodies should not accelerate towards each other)
			const j = -normAcc / contactForceAcc;

			// kill any existing normal velocity
			ball.hit.vel.addAndRelease(normal.clone(true).multiplyScalar(j * dTime * ball.hit.invMass - coll.hitOrgNormalVelocity));
			this.mover.applyImpulseAndRelease(cross.clone(true).multiplyScalar(j * dTime));

			Vertex3D.release(aBc, aFc, cross, pv1, pv2);
			// apply friction

			// first check for slippage
			const slip = vRel.clone(true).subAndRelease(normal.clone(true).multiplyScalar(normVel));       // calc the tangential slip velocity
			const maxFriction = j * this.friction;
			const slipSpeed = slip.length();
			let slipDir: Vertex3D;
			let crossF: Vertex3D;
			let numer: number;
			let denomF: number;
			let pv13: Vertex3D;

			if (slipSpeed < C_PRECISION) {
				// slip speed zero - static friction case
				const slipAcc = aRel.clone(true).subAndRelease(normal.clone(true).multiplyScalar(aRel.dot(normal)));  // calc the tangential slip acceleration

				// neither slip velocity nor slip acceleration? nothing to do here
				if (slipAcc.lengthSq() < 1e-6) {
					Vertex3D.release(aRel, vRel, rB, rF, slip, slipAcc);
					return;
				}

				slipDir = slipAcc.normalize();
				numer = -slipDir.dot(aRel);
				crossF = Vertex3D.crossProduct(rF, slipDir, true);
				pv13 = crossF.clone(true).divideScalar(-this.mover.inertia);
				denomF = slipDir.dotAndRelease(Vertex3D.crossProduct(pv13, rF, true));

			} else {
				// nonzero slip speed - dynamic friction case
				slipDir = slip.clone(true).divideScalar(slipSpeed);

				numer = -slipDir.dot(vRel);
				crossF = Vertex3D.crossProduct(rF, slipDir, true);
				pv13 = crossF.clone(true).divideScalar(this.mover.inertia);
				denomF = slipDir.dotAndRelease(Vertex3D.crossProduct(pv13, rF, true));
			}
			Vertex3D.release(aRel, vRel, rF, slip, pv13);

			const crossB = Vertex3D.crossProduct(rB, slipDir, true);
			const pv12 = crossB.clone(true).divideScalar(ball.hit.inertia);
			const denomB = ball.hit.invMass + slipDir.dotAndRelease(Vertex3D.crossProduct(pv12, rB, true));
			const friction = clamp(numer / (denomB + denomF), -maxFriction, maxFriction);
			Vertex3D.release(rB, pv12);

			ball.hit.applySurfaceImpulseAndRelease(
				crossB.clone(true).multiplyScalar(dTime * friction),
				slipDir.clone(true).multiplyScalar(dTime * friction),
			);
			this.mover.applyImpulseAndRelease(crossF.clone(true).multiplyScalar(-dTime * friction));
			Vertex3D.release(crossF, slipDir, crossB);
		}
	}

	public collide(coll: CollisionEvent, physics: PlayerPhysics): void {
		const ball = coll.ball;
		const normal = coll.hitNormal!;
		const [ vRel, rB, rF ] = this.getRelativeVelocity(normal, ball);

		let bnv = normal.dot(vRel);                        // relative normal velocity

		if (bnv >= -C_LOWNORMVEL) {                        // nearly receding ... make sure of conditions
			if (bnv > C_LOWNORMVEL) {                      // otherwise if clearly approaching .. process the collision
				Vertex3D.release(vRel, rB, rF);            // is this velocity clearly receding (i.e must > a minimum)
				return;
			}
//#ifdef C_EMBEDDED
			if (coll.hitDistance < -C_EMBEDDED) {
				bnv = -C_EMBEDSHOT;                        // has ball become embedded???, give it a kick
			} else {
				Vertex3D.release(vRel, rB, rF);
				return;
			}
//#endif
		}
		physics.activeBallBC = ball;                       // Ball control most recently collided with flipper

//#ifdef C_DISP_GAIN
		// correct displacements, mostly from low velocity blindness, an alternative to true acceleration processing
		let hdist = -C_DISP_GAIN * coll.hitDistance;       // distance found in hit detection
		if (hdist > 1.0e-4) {
			if (hdist > C_DISP_LIMIT) {
				hdist = C_DISP_LIMIT;                      // crossing ramps, delta noise
			}
			// push along norm, back to free area; use the norm, but is not correct
			ball.state.pos.addAndRelease(coll.hitNormal!.clone(true).multiplyScalar(hdist));
		}
//#endif

		// angular response to impulse in normal direction
		const angResp = Vertex3D.crossProduct(rF, normal, true);

		/*
		 * Check if flipper is in contact with its stopper and the collision impulse
		 * would push it beyond the stopper. In that case, don't allow any transfer
		 * of kinetic energy from ball to flipper. This avoids overly dead bounces
		 * in that case.
		 */
		const angImp = -angResp.z;                         // minus because impulse will apply in -normal direction
		let flipperResponseScaling = 1.0;
		if (this.mover.isInContact && this.mover.contactTorque! * angImp >= 0.) {
			// if impulse pushes against stopper, allow no loss of kinetic energy to flipper
			// (still allow flipper recoil, but a diminished amount)
			angResp.setZero();
			flipperResponseScaling = 0.5;
		}

		/*
		 * Rubber has a coefficient of restitution which decreases with the impact velocity.
		 * We use a heuristic model which decreases the COR according to a falloff parameter:
		 * 0 = no falloff, 1 = half the COR at 1 m/s (18.53 speed units)
		 */
		const epsilon = elasticityWithFalloff(this.elasticity, this.elasticityFalloff, bnv);

		const pv1 = angResp.clone(true).divideScalar(this.mover.inertia);
		let impulse = -(1.0 + epsilon) * bnv / (ball.hit.invMass + normal.dotAndRelease(Vertex3D.crossProduct(pv1, rF, true)));
		const flipperImp = normal.clone(true).multiplyScalar(-(impulse * flipperResponseScaling));
		Vertex3D.release(angResp, pv1);

		const rotI = Vertex3D.crossProduct(rF, flipperImp, true);
		if (this.mover.isInContact) {
			if (rotI.z * this.mover.contactTorque < 0) {   // pushing against the solenoid?

				// Get a bound on the time the flipper needs to return to static conditions.
				// If it's too short, we treat the flipper as static during the whole collision.
				const recoilTime = -rotI.z / this.mover.contactTorque; // time flipper needs to eliminate this impulse, in 10ms

				// Check ball normal velocity after collision. If the ball rebounded
				// off the flipper, we need to make sure it does so with full
				// reflection, i.e., treat the flipper as static, otherwise
				// we get overly dead bounces.
				const bnvAfter = bnv + impulse * ball.hit.invMass;

				if (recoilTime <= 0.5 || bnvAfter > 0.) {
					// treat flipper as static for this impact
					impulse = -(1.0 + epsilon) * bnv * ball.data.mass;
					flipperImp.setZero();
					rotI.setZero();
				}
			}
		}
		Vertex3D.release(flipperImp);

		ball.hit.vel.addAndRelease(normal.clone(true).multiplyScalar(impulse * ball.hit.invMass));      // new velocity for ball after impact
		this.mover.applyImpulseAndRelease(rotI);

		// apply friction
		const tangent = vRel.clone(true).subAndRelease(normal.clone(true).multiplyScalar(vRel.dot(normal)));       // calc the tangential velocity

		const tangentSpSq = tangent.lengthSq();
		if (tangentSpSq > 1e-6) {
			tangent.divideScalar(Math.sqrt(tangentSpSq));                      // normalize to get tangent direction
			const vt = vRel.dot(tangent);                                      // get speed in tangential direction

			// compute friction impulse
			const crossB = Vertex3D.crossProduct(rB, tangent, true);
			const pv12 = crossB.clone(true).divideScalar(ball.hit.inertia);
			let kt = ball.hit.invMass + tangent.dotAndRelease(Vertex3D.crossProduct(pv12, rB, true));

			const crossF = Vertex3D.crossProduct(rF, tangent, true);
			const pv13 = crossF.clone(true).divideScalar(this.mover.inertia);
			kt += tangent.dotAndRelease(Vertex3D.crossProduct(pv13, rF, true));   // flipper only has angular response

			// friction impulse can't be greater than coefficient of friction times collision impulse (Coulomb friction cone)
			const maxFriction = this.friction * impulse;
			const jt = clamp(-vt / kt, -maxFriction, maxFriction);

			ball.hit.applySurfaceImpulseAndRelease(
				crossB.clone(true).multiplyScalar(jt),
				tangent.clone(true).multiplyScalar(jt),
			);
			this.mover.applyImpulseAndRelease(crossF.clone(true).multiplyScalar(-jt));
			Vertex3D.release(crossB, pv12, crossF, pv13);
		}
		Vertex3D.release(vRel, rB, rF, tangent);

		if (bnv < -0.25 && (physics.timeMsec - this.lastHitTime) > 250) {       // limit rate to 250 milliseconds per event
			const flipperHit = coll.hitMomentBit ? -1.0 : -bnv;                // move event processing to end of collision handler...
			if (flipperHit < 0) {
				this.events.fireGroupEvent(Event.HitEventsHit);        // simple hit event

			} else {
				// collision velocity (normal to face)
				this.events.fireVoidEventParm(Event.FlipperEventsCollide, flipperHit);
			}
		}

		this.lastHitTime = physics.timeMsec; // keep resetting until idle for 250 milliseconds
	}

	public getMoverObject(): FlipperMover {
		return this.mover;
	}

	public updatePhysicsFromFlipper(): void {
		this.elasticityFalloff = (this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.data.overrideElasticityFalloff!
			: this.data.elasticityFalloff!;
		this.elasticity = (this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.data.overrideElasticity!
			: this.data.elasticity!;
		this.setFriction((this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.data.overrideFriction!
			: this.data.friction!);
		this.scatter = degToRad((this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.data.overrideScatterAngle!
			: this.data.scatter!);
	}

	public hitTestFlipperFace(ball: Ball, dTime: number, coll: CollisionEvent, face1: boolean): number {
		const angleCur = this.state.angle;
		let angleSpeed = this.mover.angleSpeed;    // rotation rate

		const flipperBase = this.mover.hitCircleBase.center;
		const feRadius = this.mover.endRadius;

		const angleMin = Math.min(this.mover.angleStart, this.mover.angleEnd);
		const angleMax = Math.max(this.mover.angleStart, this.mover.angleEnd);

		const ballRadius  = ball.data.radius;
		const ballVx = ball.hit.vel.x;
		const ballVy = ball.hit.vel.y;

		// flipper positions at zero degrees rotation
		let ffnx = this.mover.zeroAngNorm.x;               // flipper face normal vector //Face2
		if (face1) {                                       // negative for face1 (left face)
			ffnx = -ffnx;
		}
		const ffny = this.mover.zeroAngNorm.y;             // norm y component same for either face
		const vp = new Vertex2D(                           // face segment V1 point
			this.mover.hitCircleBase.radius * ffnx,     // face endpoint of line segment on base radius
			this.mover.hitCircleBase.radius * ffny,
		);

		const faceNormal = Vertex2D.claim();               // flipper face normal

		let bffnd: number = 0;                             // ball flipper face normal distance (negative for normal side)
		let ballVtx: number = 0;                           // new ball position at time t in flipper face coordinate
		let ballVty: number = 0;
		let contactAng: number = 0;

		// Modified False Position control
		let t: number = 0;
		let t0: number = 0;
		let t1: number = 0;
		let d0: number = 0;
		let d1: number = 0;
		let dp: number = 0;

		// start first interval ++++++++++++++++++++++++++
		let k: number;
		for (k = 1; k <= C_INTERATIONS; ++k) {

			// determine flipper rotation direction, limits and parking
			contactAng = angleCur + angleSpeed * t;        // angle at time t

			if (contactAng >= angleMax) {                  // stop here
				contactAng = angleMax;

			} else if (contactAng <= angleMin) {           // stop here
				contactAng = angleMin;
			}

			const radSin = Math.sin(contactAng);           // Green's transform matrix... rotate angle delta
			const radCos = Math.cos(contactAng);           // rotational transform from current position to position at time t

			faceNormal.x = ffnx * radCos - ffny * radSin;  // rotate to time t, norm and face offset point
			faceNormal.y = ffny * radCos + ffnx * radSin;

			const vt = new Vertex2D(
				vp.x * radCos - vp.y * radSin + flipperBase.x,       // rotate and translate to world position
				vp.y * radCos + vp.x * radSin + flipperBase.y,
			);

			ballVtx = ball.state.pos.x + ballVx * t - vt.x;          // new ball position relative to rotated line segment endpoint
			ballVty = ball.state.pos.y + ballVy * t - vt.y;

			bffnd = ballVtx * faceNormal.x + ballVty * faceNormal.y - ballRadius;      // normal distance to segment

			if (Math.abs(bffnd) <= C_PRECISION) {
				break;
			}

			// loop control, boundary checks, next estimate, etc.
			if (k === 1) {                                 // end of pass one ... set full interval pass, t = dtime

				// test for already inside flipper plane, either embedded or beyond the face endpoints
				if (bffnd < -(ball.data.radius + feRadius)) {
					Vertex2D.release(faceNormal);
					return -1.0;                           // wrong side of face, or too deeply embedded
				}
				if (bffnd <= PHYS_TOUCH) {
					break;                                 // inside the clearance limits, go check face endpoints
				}
				t0 = t1 = dTime;
				d0 = 0;
				d1 = bffnd;                                // set for second pass, so t=dtime

			} else if (k === 2) {                          // end pass two, check if zero crossing on initial interval, exit
				if (dp * bffnd > 0.0) {
					Vertex2D.release(faceNormal);
					return -1.0;                           // no solution ... no obvious zero crossing
				}
				t0 = 0;
				t1 = dTime;
				d0 = dp;
				d1 = bffnd; // testing MFP estimates

			} else { // (k >= 3)                           // MFP root search +++++++++++++++++++++++++++++++++++++++++
				if (bffnd * d0 <= 0.0) {                   // zero crossing
					t1 = t;
					d1 = bffnd;
					if (dp * bffnd > 0.0) {
						d0 *= 0.5;
					}

				} else {                                   // move right limits
					t0 = t;
					d0 = bffnd;
					if (dp * bffnd > 0.0) {
						d1 *= 0.5;
					}
				} // move left limits
			}

			t = t0 - d0 * (t1 - t0) / (d1 - d0);           // next estimate
			dp = bffnd;                                    // remember
		}

		// +++ End time iteration loop found time t soultion ++++++
		if (!isFinite(t)
			|| t < 0
			|| t > dTime                                   // time is outside this frame ... no collision
			|| (k > C_INTERATIONS && Math.abs(bffnd) > ball.data.radius * 0.25)) { // last ditch effort to accept a near solution

			Vertex2D.release(faceNormal);
			return -1.0; // no solution
		}

		// here ball and flipper face are in contact... past the endpoints, also, don't forget embedded and near solution
		const faceTangent = Vertex2D.claim();                // flipper face tangent
		if (face1) {                                       // left face?
			faceTangent.x = -faceNormal.y;
			faceTangent.y = faceNormal.x;
		} else {                                           // rotate to form Tangent vector
			faceTangent.x = faceNormal.y;
			faceTangent.y = -faceNormal.x;
		}

		const bfftd = ballVtx * faceTangent.x + ballVty * faceTangent.y;       // ball to flipper face tangent distance
		Vertex2D.release(faceTangent);

		const len = this.mover.flipperRadius * this.mover.zeroAngNorm.x;       // face segment length ... e.g. same on either face
		if (bfftd < -C_TOL_ENDPNTS || bfftd > len + C_TOL_ENDPNTS) {
			Vertex2D.release(faceNormal);
			return -1.0;                                                       // not in range of touching
		}

		const hitz = ball.state.pos.z + ball.hit.vel.z * t;                    // check for a hole, relative to ball rolling point at hittime

		// check limits of object's height and depth
		if ((hitz + ballRadius * 0.5) < this.hitBBox.zlow || (hitz - ballRadius * 0.5) > this.hitBBox.zhigh) {
			Vertex2D.release(faceNormal);
			return -1.0;
		}

		// ok we have a confirmed contact, calc the stats, remember there are "near" solution, so all
		// parameters need to be calculated from the actual configuration, i.e contact radius must be calc'ed

		// hit normal is same as line segment normal
		coll.hitNormal = new Vertex3D(faceNormal.x, faceNormal.y, 0);

		const dist = Vertex2D.claim( // calculate moment from flipper base center
			ball.state.pos.x + ballVx * t - ballRadius * faceNormal.x - this.mover.hitCircleBase.center.x, // center of ball + projected radius to contact point
			ball.state.pos.y + ballVy * t - ballRadius * faceNormal.y - this.mover.hitCircleBase.center.y, // all at time t
		);
		Vertex2D.release(faceNormal);

		const distance = Math.sqrt(dist.x * dist.x + dist.y * dist.y);         // distance from base center to contact point

		const invDist = 1.0 / distance;
		coll.hitVel.set(-dist.y * invDist, dist.x * invDist);       // Unit Tangent velocity of contact point(rotate Normal clockwise)
		Vertex2D.release(dist);
		//coll.hitvelocity.z = 0.0f; // used as normal velocity so far, only if isContact is set, see below

		if (contactAng >= angleMax && angleSpeed > 0 || contactAng <= angleMin && angleSpeed < 0) { // hit limits ???
			angleSpeed = 0.0;                                                  // rotation stopped
		}

		coll.hitMomentBit = (distance === 0);

		const dv = Vertex2D.claim(                                               // delta velocity ball to face
			ballVx - coll.hitVel!.x * angleSpeed * distance,
			ballVy - coll.hitVel!.y * angleSpeed * distance,
		);

		const bnv = dv.x * coll.hitNormal!.x + dv.y * coll.hitNormal!.y;       // dot Normal to delta v
		Vertex2D.release(dv);

		if (Math.abs(bnv) <= C_CONTACTVEL && bffnd <= PHYS_TOUCH) {
			coll.isContact = true;
			coll.hitOrgNormalVelocity = bnv;
		} else if (bnv > C_LOWNORMVEL) {
			return -1.0;                                   // not hit ... ball is receding from endradius already, must have been embedded
		}

		coll.hitDistance = bffnd;                          // normal ...actual contact distance ...
		//coll.m_hitRigid = true;				// collision type

		return t;
	}

	private getRelativeVelocity(normal: Vertex3D, ball: Ball): [ Vertex3D, Vertex3D, Vertex3D] {
		const rB = normal.clone(true).multiplyScalar(-ball.data.radius);
		const hitPos = ball.state.pos.clone(true).add(rB);

		const cF = Vertex3D.claim(
			this.mover.hitCircleBase.center.x,
			this.mover.hitCircleBase.center.y,
			ball.state.pos.z,                              // make sure collision happens in same z plane where ball is
		);

		const rF = hitPos.clone(true).sub(cF);                 // displacement relative to flipper center
		const vB = ball.hit.surfaceVelocity(rB, true);
		const vF = this.mover.surfaceVelocity(rF, true);
		const vRel = vB.clone(true).sub(vF);
		Vertex3D.release(hitPos, cF, vB, vF);

		return [ vRel, rB, rF ];
	}

	private hitTestFlipperEnd(ball: Ball, dTime: number, coll: CollisionEvent): number {

		const angleCur = this.state.angle;
		let angleSpeed = this.mover.angleSpeed;            // rotation rate

		const flipperBase = this.mover.hitCircleBase.center;

		const angleMin = Math.min(this.mover.angleStart, this.mover.angleEnd);
		const angleMax = Math.max(this.mover.angleStart, this.mover.angleEnd);

		const ballRadius = ball.data.radius;
		const feRadius = this.mover.endRadius;

		const ballEndRadius = feRadius + ballRadius;       // magnititude of (ball - flipperEnd)

		const ballX = ball.state.pos.x;
		const ballY = ball.state.pos.y;

		const ballVx = ball.hit.vel.x;
		const ballVy = ball.hit.vel.y;

		const vp = new Vertex2D(
			0.0,                                           // m_flipperradius * sin(0);
			-this.mover.flipperRadius,                     // m_flipperradius * (-cos(0));
		);

		let ballVtx = 0;
		let ballVty = 0;                                   // new ball position at time t in flipper face coordinate
		let contactAng = 0;
		let bFend = 0;
		let cbceDist = 0;
		let t0 = 0;
		let t1 = 0;
		let d0 = 0;
		let d1 = 0;
		let dp = 0;

		// start first interval ++++++++++++++++++++++++++
		let t = 0;
		let k: number;
		for (k = 1; k <= C_INTERATIONS; ++k) {

			// determine flipper rotation direction, limits and parking
			contactAng = angleCur + angleSpeed * t; // angle at time t

			if (contactAng >= angleMax) {
				contactAng = angleMax;                     // stop here
			} else if (contactAng <= angleMin) {
				contactAng = angleMin;                     // stop here
			}

			const radSin = Math.sin(contactAng);           // Green's transform matrix... rotate angle delta
			const radCos = Math.cos(contactAng);           // rotational transform from zero position to position at time t

			// rotate angle delta unit vector, rotates system according to flipper face angle
			const vt = new Vertex2D(
				vp.x * radCos - vp.y * radSin + flipperBase.x,       // rotate and translate to world position
				vp.y * radCos + vp.x * radSin + flipperBase.y,
			);

			ballVtx = ballX + ballVx * t - vt.x;           // new ball position relative to flipper end radius
			ballVty = ballY + ballVy * t - vt.y;

			// center ball to center end radius distance
			cbceDist = Math.sqrt(ballVtx * ballVtx + ballVty * ballVty);

			// ball face-to-radius surface distance
			bFend = cbceDist - ballEndRadius;

			if (Math.abs(bFend) <= C_PRECISION) {
				break;
			}

			if (k === 1) {                                 // end of pass one ... set full interval pass, t = dtime
				// test for extreme conditions
				if (bFend < -(ball.data.radius + feRadius)) {
					// too deeply embedded, ambiguous position
					return -1.0;
				}
				if (bFend <= PHYS_TOUCH) {
					// inside the clearance limits
					break;
				}
				// set for second pass, force t=dtime
				t0 = t1 = dTime;
				d0 = 0;
				d1 = bFend;

			} else if (k === 2) {                          // end pass two, check if zero crossing on initial interval, exit if none
				if (dp * bFend > 0.0) {
					// no solution ... no obvious zero crossing
					return -1.0;
				}

				t0 = 0;
				t1 = dTime;
				d0 = dp;
				d1 = bFend; // set initial boundaries

			} else {                                       // (k >= 3) // MFP root search
				if (bFend * d0 <= 0.0) {                   // zero crossing
					t1 = t;
					d1 = bFend;
					if (dp * bFend > 0) {
						d0 *= 0.5;
					}
				} else {
					t0 = t;
					d0 = bFend;
					if (dp * bFend > 0) {
						d1 *= 0.5;
					}
				}	// 	move left interval limit
			}

			t = t0 - d0 * (t1 - t0) / (d1 - d0); // estimate next t
			dp = bFend; // remember

		}

		//+++ End time interaction loop found time t solution ++++++

		// time is outside this frame ... no collision
		if (!isFinite(t) || t < 0 || t > dTime || ((k > C_INTERATIONS) && (Math.abs(bFend) > ball.data.radius * 0.25))) { // last ditch effort to accept a solution
			return -1.0; // no solution
		}

		// here ball and flipper end are in contact .. well in most cases, near and embedded solutions need calculations
		const hitZ = ball.state.pos.z + ball.hit.vel.z * t; // check for a hole, relative to ball rolling point at hittime

		// check limits of object's height and depth
		if (hitZ + ballRadius * 0.5 < this.hitBBox.zlow || (hitZ - ballRadius * 0.5) > this.hitBBox.zhigh) {
			return -1.0;
		}

		// ok we have a confirmed contact, calc the stats, remember there are "near" solution, so all
		// parameters need to be calculated from the actual configuration, i.e. contact radius must be calc'ed
		const invCbceDist = 1.0 / cbceDist;
		coll.hitNormal = new Vertex3D();
		coll.hitNormal.x = ballVtx * invCbceDist;          // normal vector from flipper end to ball
		coll.hitNormal.y = ballVty * invCbceDist;
		coll.hitNormal.z = 0.0;

		// vector from base to flipperEnd plus the projected End radius
		const dist = Vertex2D.claim(
			ball.state.pos.x + ballVx * t - ballRadius * coll.hitNormal.x - this.mover.hitCircleBase.center.x,
			ball.state.pos.y + ballVy * t - ballRadius * coll.hitNormal.y - this.mover.hitCircleBase.center.y,
		);

		// distance from base center to contact point
		const distance = Math.sqrt(dist.x * dist.x + dist.y * dist.y);

		// hit limits ???
		if (contactAng >= angleMax && angleSpeed > 0 || (contactAng <= angleMin && angleSpeed < 0)) {
			angleSpeed = 0;                                // rotation stopped
		}

		// Unit Tangent vector velocity of contact point(rotate normal right)
		const invDistance = 1.0 / distance;
		coll.hitVel.set(-dist.y * invDistance, dist.x * invDistance);
		coll.hitMomentBit = (distance === 0);
		Vertex2D.release(dist);

		// recheck using actual contact angle of velocity direction
		const dv = Vertex2D.claim(
			ballVx - coll.hitVel.x * angleSpeed * distance,                    // delta velocity ball to face
			ballVy - coll.hitVel.y * angleSpeed * distance,
		);

		const bnv = dv.x * coll.hitNormal.x + dv.y * coll.hitNormal.y;         // dot Normal to delta v
		Vertex2D.release(dv);

		if (bnv >= 0) {
			return -1.0; // not hit ... ball is receding from face already, must have been embedded or shallow angled
		}

		if (Math.abs(bnv) <= C_CONTACTVEL && bFend <= PHYS_TOUCH) {
			coll.isContact = true;
			coll.hitOrgNormalVelocity = bnv;
		}
		coll.hitDistance = bFend;                          // actual contact distance ..

		return t;
	}

	public getHitTime(): number {
		return this.mover.getHitTime();
	}
}
