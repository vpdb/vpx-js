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

import { Table } from '../..';
import { Player } from '../../game/player';
import { degToRad } from '../../math/float';
import { FRect3D } from '../../math/frect3d';
import { clamp } from '../../math/functions';
import { Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
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
	private lastHitTime: number = 0;

	public static getInstance(data: FlipperData, state: FlipperState, player: Player, table: Table): FlipperHit {
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
			player,
			table.data!,
		);
	}

	constructor(config: FlipperConfig, data: FlipperData, state: FlipperState, player: Player, tableData: TableData) {
		super();
		this.mover = new FlipperMover(config, data, state, player, tableData);
		this.mover.isEnabled = data.fEnabled;
		this.data = data;
		this.state = state;
		this.tableData = tableData;
		this.UpdatePhysicsFromFlipper();
	}

	public getType(): CollisionType {
		return CollisionType.Flipper;
	}

	public calcHitBBox(): void {
		// Allow roundoff
		this.hitBBox = new FRect3D();
		this.hitBBox.left = this.mover.hitCircleBase.center.x - this.mover.flipperRadius - this.mover.endRadius - 0.1;
		this.hitBBox.right = this.mover.hitCircleBase.center.x + this.mover.flipperRadius + this.mover.endRadius + 0.1;
		this.hitBBox.top = this.mover.hitCircleBase.center.y - this.mover.flipperRadius - this.mover.endRadius - 0.1;
		this.hitBBox.bottom = this.mover.hitCircleBase.center.y + this.mover.flipperRadius + this.mover.endRadius + 0.1;
		this.hitBBox.zlow = this.mover.hitCircleBase.hitBBox.zlow;
		this.hitBBox.zhigh = this.mover.hitCircleBase.hitBBox.zhigh;
	}

	public contact(coll: CollisionEvent, dtime: number, player: Player): void {
		const ball = coll.ball;
		const normal = coll.hitNormal!;

//#ifdef C_EMBEDDED
		if (coll.hitDistance < -C_EMBEDDED) {
			// magic to avoid balls being pushed by each other through resting flippers!
			ball.hit.vel.add(normal.clone().multiplyScalar(0.1));
		}
//#endif

		const rB = normal.clone().multiplyScalar(-ball.data.radius);
		const hitPos = ball.state.pos.clone().add(rB);

		const cF = new Vertex3D(
			this.mover.hitCircleBase.center.x,
			this.mover.hitCircleBase.center.y,
			ball.state.pos.z,                              // make sure collision happens in same z plane where ball is
		);

		const rF = hitPos.clone().sub(cF);                 // displacement relative to flipper center
		const vB = ball.hit.surfaceVelocity(rB);
		const vF = this.mover.surfaceVelocity(rF);
		const vrel = vB.clone().sub(vF);

		const normVel = vrel.dot(normal);   // this should be zero, but only up to +/- C_CONTACTVEL

		// If some collision has changed the ball's velocity, we may not have to do anything.
		if (normVel <= C_CONTACTVEL) {

			// compute accelerations of point on ball and flipper
			const aB = ball.hit.surfaceAcceleration(rB, player);
			const aF = this.mover.surfaceAcceleration(rF);
			const arel = aB.clone().sub(aF);

			// time derivative of the normal vector
			const normalDeriv = Vertex3D.crossZ(this.mover.angleSpeed, normal);

			// relative acceleration in the normal direction
			const normAcc = arel.dot(normal) + 2.0 * normalDeriv.dot(vrel);

			if (normAcc >= 0) {
				return;     // objects accelerating away from each other, nothing to do
			}

			// hypothetical accelerations arising from a unit contact force in normal direction
			const aBc = normal.clone().multiplyScalar(ball.hit.invMass);
			const cross = Vertex3D.crossProduct(rF, normal.clone().multiplyScalar(-1));
			const aFc = Vertex3D.crossProduct(cross.clone().divideScalar(this.mover.inertia), rF);
			const contactForceAcc = normal.dot(aBc.clone().sub(aFc));

			// find j >= 0 such that normAcc + j * contactForceAcc >= 0  (bodies should not accelerate towards each other)
			const j = -normAcc / contactForceAcc;

			// kill any existing normal velocity
			ball.hit.vel.add(normal.clone().multiplyScalar(j * dtime * ball.hit.invMass - coll.hitOrgNormalVelocity));
			this.mover.applyImpulse(cross.clone().multiplyScalar(j * dtime));

			// apply friction

			// first check for slippage
			const slip = vrel.sub(normal.clone().multiplyScalar(normVel));       // calc the tangential slip velocity
			const maxFric = j * this.friction;
			const slipspeed = slip.length();
			let slipDir: Vertex3D;
			let crossF: Vertex3D;
			let numer: number;
			let denomF: number;

			if (slipspeed < C_PRECISION) {
				// slip speed zero - static friction case
				const slipAcc = arel.sub(normal.clone().multiplyScalar(arel.dot(normal)));       // calc the tangential slip acceleration

				// neither slip velocity nor slip acceleration? nothing to do here
				if (slipAcc.lengthSq() < 1e-6) {
					return;
				}

				slipDir = slipAcc;
				slipDir.normalize();

				numer = -slipDir.dot(arel);
				crossF = Vertex3D.crossProduct(rF, slipDir);
				denomF = slipDir.dot(Vertex3D.crossProduct(crossF.clone().divideScalar(-this.mover.inertia), rF));

			} else {
				// nonzero slip speed - dynamic friction case
				slipDir = slip.clone().divideScalar(slipspeed);

				numer = -slipDir.dot(vrel);
				crossF = Vertex3D.crossProduct(rF, slipDir);
				denomF = slipDir.dot(Vertex3D.crossProduct(crossF.clone().divideScalar(this.mover.inertia), rF));
			}

			const crossB = Vertex3D.crossProduct(rB, slipDir);
			const denomB = ball.hit.invMass + slipDir.dot(Vertex3D.crossProduct(crossB.clone().divideScalar(ball.hit.inertia), rB));
			const fric = clamp(numer / (denomB + denomF), -maxFric, maxFric);

			ball.hit.applySurfaceImpulse(crossB.clone().multiplyScalar(dtime * fric), slipDir.clone().multiplyScalar(dtime * fric));
			this.mover.applyImpulse(crossF.clone().multiplyScalar(-dtime * fric));
		}
	}

	public collide(coll: CollisionEvent, player: Player): void {
		const pball = coll.ball;
		const normal = coll.hitNormal!;

		const rB = normal.clone().multiplyScalar(-pball.data.radius);
		const hitPos = pball.state.pos.clone().add(rB);

		const cF = new Vertex3D(
			this.mover.hitCircleBase.center.x,
			this.mover.hitCircleBase.center.y,
			pball.state.pos.z);     // make sure collision happens in same z plane where ball is

		const rF = hitPos.clone().sub(cF);       // displacement relative to flipper center

		const vB = pball.hit.surfaceVelocity(rB);
		const vF = this.mover.surfaceVelocity(rF);
		const vrel = vB.clone().sub(vF);
		let bnv = normal.dot(vrel);       // relative normal velocity

		if (bnv >= -C_LOWNORMVEL) {                        // nearly receding ... make sure of conditions
			if (bnv > C_LOWNORMVEL) {                      // otherwise if clearly approaching .. process the collision
				return;                                    // is this velocity clearly receding (i.e must > a minimum)
			}
//#ifdef C_EMBEDDED
			if (coll.hitDistance < -C_EMBEDDED) {
				bnv = -C_EMBEDSHOT;                        // has ball become embedded???, give it a kick
			} else {
				return;
			}
//#endif
		}
		player.pactiveballBC = pball; // Ball control most recently collided with flipper

//#ifdef C_DISP_GAIN
		// correct displacements, mostly from low velocity blindness, an alternative to true acceleration processing
		let hdist = -C_DISP_GAIN * coll.hitDistance;		// distance found in hit detection
		if (hdist > 1.0e-4) {
			if (hdist > C_DISP_LIMIT) {
				hdist = C_DISP_LIMIT; // crossing ramps, delta noise
			}
			pball.state.pos.add(coll.hitNormal!.clone().multiplyScalar(hdist));	// push along norm, back to free area; use the norm, but is not correct
		}
//#endif

		// angular response to impulse in normal direction
		const angResp = Vertex3D.crossProduct(rF, normal);

		/*
		 * Check if flipper is in contact with its stopper and the collision impulse
		 * would push it beyond the stopper. In that case, don't allow any transfer
		 * of kinetic energy from ball to flipper. This avoids overly dead bounces
		 * in that case.
		 */
		const angImp = -angResp.z;     // minus because impulse will apply in -normal direction
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

		let impulse = -(1.0 + epsilon) * bnv / (pball.hit.invMass + normal.dot(Vertex3D.crossProduct(angResp.clone().divideScalar(this.mover.inertia), rF)));
		const flipperImp = normal.clone().multiplyScalar(-(impulse * flipperResponseScaling));

		const rotI = Vertex3D.crossProduct(rF, flipperImp);
		if (this.mover.isInContact) {
			if (rotI.z * this.mover.contactTorque < 0) {    // pushing against the solenoid?

				// Get a bound on the time the flipper needs to return to static conditions.
				// If it's too short, we treat the flipper as static during the whole collision.
				const recoilTime = -rotI.z / this.mover.contactTorque; // time flipper needs to eliminate this impulse, in 10ms

				// Check ball normal velocity after collision. If the ball rebounded
				// off the flipper, we need to make sure it does so with full
				// reflection, i.e., treat the flipper as static, otherwise
				// we get overly dead bounces.
				const bnvAfter = bnv + impulse * pball.hit.invMass;

				if (recoilTime <= 0.5 || bnvAfter > 0.) {
					// treat flipper as static for this impact
					impulse = -(1.0 + epsilon) * bnv * pball.data.mass;
					flipperImp.setZero();
					rotI.setZero();
				}
			}
		}

		pball.hit.vel.add(normal.clone().multiplyScalar(impulse * pball.hit.invMass));      // new velocity for ball after impact
		this.mover.applyImpulse(rotI);

		// apply friction
		const tangent = vrel.clone().sub(normal.clone().multiplyScalar(vrel.dot(normal)));       // calc the tangential velocity

		const tangentSpSq = tangent.lengthSq();
		if (tangentSpSq > 1e-6) {
			tangent.divideScalar(Math.sqrt(tangentSpSq));            // normalize to get tangent direction
			const vt = vrel.dot(tangent);   // get speed in tangential direction

			// compute friction impulse
			const crossB = Vertex3D.crossProduct(rB, tangent);
			let kt = pball.hit.invMass + tangent.dot(Vertex3D.crossProduct(crossB.clone().divideScalar(pball.hit.inertia), rB));

			const crossF = Vertex3D.crossProduct(rF, tangent);
			kt += tangent.dot(Vertex3D.crossProduct(crossF.clone().divideScalar(this.mover.inertia), rF));    // flipper only has angular response

			// friction impulse can't be greater than coefficient of friction times collision impulse (Coulomb friction cone)
			const maxFric = this.friction * impulse;
			const jt = clamp(-vt / kt, -maxFric, maxFric);

			pball.hit.applySurfaceImpulse(crossB.clone().multiplyScalar(jt), tangent.clone().multiplyScalar(jt));
			this.mover.applyImpulse(crossF.clone().multiplyScalar(-jt));
		}

		// fixme event
		// if ((bnv < -0.25) && (g_pplayer->m_time_msec - m_last_hittime) > 250) // limit rate to 250 milliseconds per event
		// {
		// 	//!! unused const float distance = coll.m_hitmoment;                     // moment .... and the flipper response
		// 	const flipperHit = /*(distance == 0.0f)*/ coll.m_hitmoment_bit ? -1.0f : -bnv; // move event processing to end of collision handler...
		// 	if (flipperHit < 0.f)
		// 	this.flipperMover.pflipper->FireGroupEvent(DISPID_HitEvents_Hit);        // simple hit event
		// else
		// 	this.flipperMover.pflipper->FireVoidEventParm(DISPID_FlipperEvents_Collide, flipperHit); // collision velocity (normal to face)
		// }

		this.lastHitTime = player.timeMsec; // keep resetting until idle for 250 milliseconds
	}

	public hitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
		if (!this.mover.isEnabled) {
			return -1;
		}

		const lastface = this.mover.lastHitFace;

		// for effective computing, adding a last face hit value to speed calculations
		// a ball can only hit one face never two
		// also if a ball hits a face then it can not hit either radius
		// so only check these if a face is not hit
		// endRadius is more likely than baseRadius ... so check it first

		let hittime = this.hitTestFlipperFace(pball, dtime, coll, lastface); // first face
		if (hittime >= 0) {
			return hittime;
		}

		hittime = this.hitTestFlipperFace(pball, dtime, coll, !lastface); //second face
		if (hittime >= 0) {
			this.mover.lastHitFace = !lastface; // change this face to check first // HACK
			return hittime;
		}

		hittime = this.hitTestFlipperEnd(pball, dtime, coll); // end radius
		if (hittime >= 0) {
			return hittime;
		}

		hittime = this.mover.hitCircleBase.hitTest(pball, dtime, coll);
		if (hittime >= 0) {

			coll.hitVel = new Vertex2D();
			coll.hitVel.x = 0;		//Tangent velocity of contact point (rotate Normal right)
			coll.hitVel.y = 0;		//units: rad*d/t (Radians*diameter/time
			coll.hitMomentBit = true;

			return hittime;
		} else {
			return -1.0;	// no hits
		}
	}

	public getMoverObject(): FlipperMover {
		return this.mover;
	}

	public UpdatePhysicsFromFlipper(): void {
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

	public hitTestFlipperFace(pball: Ball, dtime: number, coll: CollisionEvent, face1: boolean): number {
		const angleCur = this.state.angle;
		let anglespeed = this.mover.angleSpeed;    // rotation rate

		const flipperbase = this.mover.hitCircleBase.center;
		const feRadius = this.mover.endRadius;

		const angleMin = Math.min(this.mover.angleStart, this.mover.angleEnd);
		const angleMax = Math.max(this.mover.angleStart, this.mover.angleEnd);

		const ballr  = pball.data.radius;
		const ballvx = pball.hit.vel.x;
		const ballvy = pball.hit.vel.y;

		// flipper positions at zero degrees rotation

		let ffnx = this.mover.zeroAngNorm.x;       // flipper face normal vector //Face2
		if (face1) {                           // negative for face1 (left face)
			ffnx = -ffnx;
		}
		const ffny = this.mover.zeroAngNorm.y; // norm y component same for either face
		const vp = new Vertex2D(                                 // face segment V1 point
			this.mover.hitCircleBase.radius * ffnx,     // face endpoint of line segment on base radius
			this.mover.hitCircleBase.radius * ffny,
		);

		const F = new Vertex2D();				// flipper face normal

		let bffnd: number = 0;				// ball flipper face normal distance (negative for normal side)
		let ballvtx: number = 0;	// new ball position at time t in flipper face coordinate
		let ballvty: number = 0;
		let contactAng: number = 0;

		// Modified False Position control
		let t: number = 0;
		let t0: number = 0;
		let t1: number = 0;
		let d0: number = 0;
		let d1: number = 0;
		let dp: number = 0;

		//start first interval ++++++++++++++++++++++++++
		let k: number;
		for (k = 1; k <= C_INTERATIONS; ++k) {
			// determine flipper rotation direction, limits and parking

			contactAng = angleCur + anglespeed * t;					// angle at time t

			if (contactAng >= angleMax) {			// stop here
				contactAng = angleMax;

			} else if (contactAng <= angleMin) {		// stop here
				contactAng = angleMin;
			}

			const radsin = Math.sin(contactAng); //  Green's transform matrix... rotate angle delta
			const radcos = Math.cos(contactAng); //  rotational transform from current position to position at time t

			F.x = ffnx * radcos - ffny * radsin;  // rotate to time t, norm and face offset point
			F.y = ffny * radcos + ffnx * radsin;

			const vt = new Vertex2D(
				vp.x * radcos - vp.y * radsin + flipperbase.x, //rotate and translate to world position
				vp.y * radcos + vp.x * radsin + flipperbase.y,
			);

			ballvtx = pball.state.pos.x + ballvx * t - vt.x;	// new ball position relative to rotated line segment endpoint
			ballvty = pball.state.pos.y + ballvy * t - vt.y;

			bffnd = ballvtx * F.x + ballvty * F.y - ballr; // normal distance to segment

			if (Math.abs(bffnd) <= C_PRECISION) {
				break;
			}

			// loop control, boundary checks, next estimate, etc.

			if (k === 1) {   // end of pass one ... set full interval pass, t = dtime
				// test for already inside flipper plane, either embedded or beyond the face endpoints
				if (bffnd < -(pball.data.radius + feRadius)) {
					return -1.0; // wrong side of face, or too deeply embedded
				}
				if (bffnd <= PHYS_TOUCH) {
					break; // inside the clearance limits, go check face endpoints
				}
				t0 = t1 = dtime;
				d0 = 0;
				d1 = bffnd; // set for second pass, so t=dtime

			} else if (k === 2) { // end pass two, check if zero crossing on initial interval, exit
				if (dp * bffnd > 0.0) {
					return -1.0; // no solution ... no obvious zero crossing
				}
				t0 = 0;
				t1 = dtime;
				d0 = dp;
				d1 = bffnd; // testing MFP estimates
			} else { // (k >= 3) // MFP root search +++++++++++++++++++++++++++++++++++++++++
				if (bffnd * d0 <= 0.0) {									// zero crossing
					t1 = t;
					d1 = bffnd;
					if (dp * bffnd > 0.0) {
						d0 *= 0.5;
					}

				} else { // 	move right limits
					t0 = t;
					d0 = bffnd;
					if (dp * bffnd > 0.0) {
						d1 *= 0.5;
					}
				} // move left limits
			}

			t = t0 - d0 * (t1 - t0) / (d1 - d0);					// next estimate
			dp = bffnd;	// remember
		} //for loop

		//+++ End time interation loop found time t soultion ++++++

		if (!isFinite(t)
			|| t < 0
			|| t > dtime								// time is outside this frame ... no collision
			|| ((k > C_INTERATIONS)
				&& (Math.abs(bffnd) > pball.data.radius * 0.25))) { // last ditch effort to accept a near solution
			return -1.0; // no solution
		}

		// here ball and flipper face are in contact... past the endpoints, also, don't forget embedded and near solution

		const T = new Vertex2D();          // flipper face tangent
		if (face1) {           // left face?
			T.x = -F.y;
			T.y = F.x;
		} else { // rotate to form Tangent vector
			T.x = F.y;
			T.y = -F.x;
		}

		const bfftd = ballvtx * T.x + ballvty * T.y;			// ball to flipper face tanget distance

		const len = this.mover.flipperRadius * this.mover.zeroAngNorm.x; // face segment length ... e.g. same on either face
		if (bfftd < -C_TOL_ENDPNTS || bfftd > len + C_TOL_ENDPNTS) {
			return -1.0; // not in range of touching
		}

		const hitz = pball.state.pos.z + pball.hit.vel.z * t;	// check for a hole, relative to ball rolling point at hittime

		//check limits of object's height and depth
		if ((hitz + ballr * 0.5) < this.hitBBox.zlow || (hitz - ballr * 0.5) > this.hitBBox.zhigh) {
			return -1.0;
		}

		// ok we have a confirmed contact, calc the stats, remember there are "near" solution, so all
		// parameters need to be calculated from the actual configuration, i.e contact radius must be calc'ed

		coll.hitNormal!.x = F.x;	// hit normal is same as line segment normal
		coll.hitNormal!.y = F.y;
		coll.hitNormal!.z = 0.0;

		const dist = new Vertex2D( // calculate moment from flipper base center
			pball.state.pos.x + ballvx * t - ballr * F.x - this.mover.hitCircleBase.center.x, // center of ball + projected radius to contact point
			pball.state.pos.y + ballvy * t - ballr * F.y - this.mover.hitCircleBase.center.y, // all at time t
		);

		const distance = Math.sqrt(dist.x * dist.x + dist.y * dist.y);	// distance from base center to contact point

		const invDist = 1.0 / distance;
		coll.hitVel!.x = -dist.y * invDist;		//Unit Tangent velocity of contact point(rotate Normal clockwise)
		coll.hitVel!.y = dist.x * invDist;
		//coll.hitvelocity.z = 0.0f; // used as normal velocity so far, only if isContact is set, see below

		if (contactAng >= angleMax && anglespeed > 0 || contactAng <= angleMin && anglespeed < 0) { // hit limits ???
			anglespeed = 0.0;							// rotation stopped
		}

		//!! unused coll.m_hitmoment = distance;				//moment arm diameter
		coll.hitMomentBit = (distance === 0);
		//!! unused coll.m_hitangularrate = anglespeed;		//radians/time at collison

		const dv = new Vertex2D(
			ballvx - coll.hitVel!.x * anglespeed * distance,
			ballvy - coll.hitVel!.y * anglespeed * distance,
		); //delta velocity ball to face

		const bnv = dv.x * coll.hitNormal!.x + dv.y * coll.hitNormal!.y;  //dot Normal to delta v

		if (Math.abs(bnv) <= C_CONTACTVEL && bffnd <= PHYS_TOUCH) {
			coll.isContact = true;
			coll.hitOrgNormalVelocity = bnv;
		} else if (bnv > C_LOWNORMVEL) {
			return -1.0; // not hit ... ball is receding from endradius already, must have been embedded
		}

		coll.hitDistance = bffnd;			//normal ...actual contact distance ...
		//coll.m_hitRigid = true;				// collision type

		return t;
	}

	private hitTestFlipperEnd(pball: Ball, dtime: number, coll: CollisionEvent): number {

		const angleCur = this.state.angle;
		let anglespeed = this.mover.angleSpeed;		// rotation rate

		const flipperbase = this.mover.hitCircleBase.center;

		const angleMin = Math.min(this.mover.angleStart, this.mover.angleEnd);
		const angleMax = Math.max(this.mover.angleStart, this.mover.angleEnd);

		const ballr = pball.data.radius;
		const feRadius = this.mover.endRadius;

		const ballrEndr = feRadius + ballr; // magnititude of (ball - flipperEnd)

		const ballx = pball.state.pos.x;
		const bally = pball.state.pos.y;

		const ballvx = pball.hit.vel.x;
		const ballvy = pball.hit.vel.y;

		const vp = new Vertex2D(
			0.0,                           // m_flipperradius * sin(0);
			-this.mover.flipperRadius, // m_flipperradius * (-cos(0));
		);

		let ballvtx = 0;
		let ballvty = 0;	// new ball position at time t in flipper face coordinate
		let contactAng = 0;
		let bfend = 0;
		let cbcedist = 0;
		let t0 = 0;
		let t1 = 0;
		let d0 = 0;
		let d1 = 0;
		let dp = 0;

		let t = 0; //start first interval ++++++++++++++++++++++++++
		let k: number;
		for (k = 1; k <= C_INTERATIONS; ++k) {

			// determine flipper rotation direction, limits and parking
			contactAng = angleCur + anglespeed * t; // angle at time t

			if (contactAng >= angleMax) {
				contactAng = angleMax; // stop here
			} else if (contactAng <= angleMin) {
				contactAng = angleMin; // stop here
			}

			const radsin = Math.sin(contactAng); // Green's transform matrix... rotate angle delta
			const radcos = Math.cos(contactAng); // rotational transform from zero position to position at time t

			// rotate angle delta unit vector, rotates system according to flipper face angle
			const vt = new Vertex2D(
				vp.x * radcos - vp.y * radsin + flipperbase.x, //rotate and translate to world position
				vp.y * radcos + vp.x * radsin + flipperbase.y,
			);

			ballvtx = ballx + ballvx * t - vt.x; // new ball position relative to flipper end radius
			ballvty = bally + ballvy * t - vt.y;

			cbcedist = Math.sqrt(ballvtx * ballvtx + ballvty * ballvty); // center ball to center end radius distance

			bfend = cbcedist - ballrEndr; // ball face-to-radius surface distance

			if (Math.abs(bfend) <= C_PRECISION) {
				break;
			}

			if (k === 1) {                                 // end of pass one ... set full interval pass, t = dtime
				// test for extreme conditions
				if (bfend < -(pball.data.radius + feRadius)) {
					// too deeply embedded, ambigious position
					return -1.0;
				}
				if (bfend <= PHYS_TOUCH) {
					// inside the clearance limits
					break;
				}
				// set for second pass, force t=dtime
				t0 = t1 = dtime; d0 = 0; d1 = bfend;

			} else if (k === 2) {                          // end pass two, check if zero crossing on initial interval, exit if none
				if (dp * bfend > 0.0) {
					// no solution ... no obvious zero crossing
					return -1.0;
				}

				t0 = 0;
				t1 = dtime;
				d0 = dp;
				d1 = bfend; // set initial boundaries

			} else {                                       // (k >= 3) // MFP root search
				if (bfend * d0 <= 0.0) {// zero crossing
					t1 = t;
					d1 = bfend;
					if (dp * bfend > 0) {
						d0 *= 0.5;
					}
				} else {
					t0 = t;
					d0 = bfend;
					if (dp * bfend > 0) {
						d1 *= 0.5;
					}
				}	// 	move left interval limit
			}

			t = t0 - d0 * (t1 - t0) / (d1 - d0); // estimate next t
			dp = bfend; // remember

		} //for loop
		//+++ End time interation loop found time t soultion ++++++

		// time is outside this frame ... no collision
		if (!isFinite(t) || t < 0 || t > dtime || ((k > C_INTERATIONS) && (Math.abs(bfend) > pball.data.radius * 0.25))) { // last ditch effort to accept a solution
			return -1.0; // no solution
		}

		// here ball and flipper end are in contact .. well in most cases, near and embedded solutions need calculations
		const hitz = pball.state.pos.z + pball.hit.vel.z * t; // check for a hole, relative to ball rolling point at hittime

		if ((hitz + ballr * 0.5) < this.hitBBox.zlow		//check limits of object's height and depth
			|| (hitz - ballr * 0.5) > this.hitBBox.zhigh) {
			return -1.0;
		}

		// ok we have a confirmed contact, calc the stats, remember there are "near" solution, so all
		// parameters need to be calculated from the actual configuration, i.e. contact radius must be calc'ed
		const invCbcedist = 1.0 / cbcedist;
		coll.hitNormal = new Vertex3D();
		coll.hitNormal.x = ballvtx * invCbcedist;				// normal vector from flipper end to ball
		coll.hitNormal.y = ballvty * invCbcedist;
		coll.hitNormal.z = 0.0;

		const dist = new Vertex2D(
			pball.state.pos.x + ballvx * t - ballr * coll.hitNormal.x - this.mover.hitCircleBase.center.x, // vector from base to flipperEnd plus the projected End radius
			pball.state.pos.y + ballvy * t - ballr * coll.hitNormal.y - this.mover.hitCircleBase.center.y);

		const distance = Math.sqrt(dist.x * dist.x + dist.y * dist.y); // distance from base center to contact point

		if ((contactAng >= angleMax && anglespeed > 0) || (contactAng <= angleMin && anglespeed < 0)) { // hit limits ???
			anglespeed = 0; // rotation stopped
		}

		const invDistance = 1.0 / distance;
		coll.hitVel = new Vertex2D();
		coll.hitVel.x = -dist.y * invDistance; //Unit Tangent vector velocity of contact point(rotate normal right)
		coll.hitVel.y = dist.x * invDistance;

		coll.hitMomentBit = (distance === 0);

		// recheck using actual contact angle of velocity direction
		const dv = new Vertex2D(
			ballvx - coll.hitVel.x * anglespeed * distance,
			ballvy - coll.hitVel.y * anglespeed * distance); //delta velocity ball to face

		const bnv = dv.x * coll.hitNormal.x + dv.y * coll.hitNormal.y;  //dot Normal to delta v

		if (bnv >= 0) {
			return -1.0; // not hit ... ball is receding from face already, must have been embedded or shallow angled
		}

		if (Math.abs(bnv) <= C_CONTACTVEL && bfend <= PHYS_TOUCH) {
			coll.isContact = true;
			coll.hitOrgNormalVelocity = bnv;
		}

		coll.hitDistance = bfend;			//actual contact distance ..

		return t;
	}

	public getHitTime(): number {
		return this.mover.getHitTime();
	}
}
