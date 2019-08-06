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

import { Player } from '../../game/player';
import { clamp, solveQuadraticEq } from '../../math/functions';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
import {
	C_CONTACTVEL,
	C_DISP_GAIN,
	C_DISP_LIMIT,
	C_EMBEDVELLIMIT,
	C_LOWNORMVEL,
	C_PRECISION,
	PHYS_TOUCH,
} from '../../physics/constants';
import { IFireEvents } from '../../physics/events';
import { elasticityWithFalloff, hardScatter } from '../../physics/functions';
import { HitObject } from '../../physics/hit-object';
import { FLT_MIN } from '../mesh';
import { TableData } from '../table/table-data';
import { Ball } from './ball';
import { BallData } from './ball-data';
import { BallMover } from './ball-mover';
import { BallState } from './ball-state';

/**
 * In the VP source code this is all part of ball.cpp. We'll try
 * to separate this more and see how far we get.
 */
export class BallHit extends HitObject {

	private readonly id: number; // same as ball id
	private readonly data: BallData;
	private readonly state: BallState;
	private readonly mover: BallMover;
	private readonly tableData: TableData;

	public readonly vel: Vertex3D;
	public readonly invMass: number;
	public readonly inertia: number;
	public readonly angularMomentum = new Vertex3D();
	public angularVelocity = new Vertex3D();

	public isFrozen: boolean;
	private playfieldReflectionStrength: number;
	private reflectionEnabled: boolean;
	private forceReflection: boolean;
	private visible: boolean;

	public coll: CollisionEvent;
	public rcHitRadiusSqr: number = 0;
	private defaultZ: number = 25.0;

	public vpVolObjs: IFireEvents[] = [];

	/**
	 * Creates a new ball hit.
	 *
	 * @param ball Reference to ball
	 * @param data Static ball data
	 * @param state Dynamic ball state
	 * @param initialVelocity Initial velocity
	 * @param tableData Table data
	 * @see void Ball::Init(const float mass)
	 */
	constructor(ball: Ball, data: BallData, state: BallState, initialVelocity: Vertex3D, tableData: TableData) {
		super();

		this.id = ball.id;
		this.data = data;
		this.state = state;
		this.tableData = tableData;
		this.vel = initialVelocity;
		this.mover = new BallMover(this.id, data, state, this);

		// Only called by real balls, not temporary objects created for physics/rendering
		this.invMass = 1.0 / data.mass;
		this.inertia = (2.0 / 5.0) * data.radius * data.radius * data.mass;

		this.isFrozen = false;

		this.playfieldReflectionStrength = 1.0;
		this.reflectionEnabled = true;
		this.forceReflection = false;
		this.visible = true;

		this.coll = new CollisionEvent(ball);

		this.calcHitBBox();

		this.defaultZ = this.state.pos.z;
	}

	public calcHitBBox(): void {

		const vl = this.vel.length() + this.data.radius + 0.05; //!! 0.05f = paranoia
		this.hitBBox.left = this.state.pos.x - vl;
		this.hitBBox.right = this.state.pos.x + vl;
		this.hitBBox.top = this.state.pos.y - vl;
		this.hitBBox.bottom = this.state.pos.y + vl;
		this.hitBBox.zlow = this.state.pos.z - vl;
		this.hitBBox.zhigh = this.state.pos.z + vl;

		this.rcHitRadiusSqr = vl * vl;
		//assert(m_rcHitRadiusSqr <= FLT_MAX);

		// update defaultZ for ball reflection
		// if the ball was created by a kicker which is higher than the playfield
		// the defaultZ must be updated if the ball falls onto the playfield that means the Z value is equal to the radius
		if (this.state.pos!.z === this.data.radius + this.tableData.tableheight) {
			this.defaultZ = this.state.pos.z;
		}
	}

	public getMoverObject(): BallMover {
		return this.mover;
	}

	public getType(): CollisionType {
		return CollisionType.Flipper;
	}

	public collide(coll: CollisionEvent, player: Player): void {
		const pball = coll.ball;

		// make sure we process each ball/ball collision only once
		// (but if we are frozen, there won't be a second collision event, so deal with it now!)
		if ((player.swapBallCcollisionHandling && pball.id >= this.id || !player.swapBallCcollisionHandling && pball.id <= this.id) && !this.isFrozen) {
			return;
		}

		// target ball to object ball delta velocity
		const vrel = pball.hit.vel.clone().sub(this.vel);
		const vnormal = coll.hitNormal!;
		const dot = vrel.dot(vnormal);

		// correct displacements, mostly from low velocity, alternative to true acceleration processing
		if (dot >= -C_LOWNORMVEL) {								// nearly receding ... make sure of conditions
																// otherwise if clearly approaching .. process the collision
			if (dot > C_LOWNORMVEL) {						// is this velocity clearly receding (i.e must > a minimum)
				return;
			}
		}

		// fixme send ball/ball collision event to script function
		// if (dot < -0.25f) {   // only collisions with at least some small true impact velocity (no contacts)
		// 	g_pplayer->m_ptable->InvokeBallBallCollisionCallback(this, pball, -dot);
		// }

		if (C_DISP_GAIN) {
			let edist = -C_DISP_GAIN * coll.hitDistance;
			if (edist > 1.0e-4) {
				if (edist > C_DISP_LIMIT) {
					edist = C_DISP_LIMIT;		// crossing ramps, delta noise
				}
				if (!this.isFrozen) {	// if the hitten ball is not frozen
					edist *= 0.5;
				}
				pball.state.pos.add(vnormal.clone().multiplyScalar(edist)); // push along norm, back to free area
				// use the norm, but is not correct, but cheaply handled
			}

			edist = -C_DISP_GAIN * this.coll.hitDistance;	// noisy value .... needs investigation
			if (!this.isFrozen && edist > 1.0e-4) {
				if (edist > C_DISP_LIMIT) {
					edist = C_DISP_LIMIT;		// crossing ramps, delta noise
				}
				edist *= 0.5;
				this.state.pos.sub(vnormal.multiplyScalar(edist));       // pull along norm, back to free area
			}
		}

		const myInvMass = this.isFrozen ? 0.0 : this.invMass; // frozen ball has infinite mass
		const impulse = -(1.0 + 0.8) * dot / (myInvMass + pball.hit.invMass);    // resitution = 0.8

		if (!this.isFrozen) {
			this.vel.sub(vnormal.clone().multiplyScalar(impulse * myInvMass));
		}
		pball.hit.vel.add(vnormal.clone().multiplyScalar(impulse * pball.hit.invMass));
	}

	public hitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
		const d = this.state.pos!.clone().sub(pball.state.pos!);  // delta position
		const dv = this.vel.clone().sub(pball.hit.vel);   // delta velocity

		let bcddsq = d.lengthSq();            // square of ball center's delta distance
		let bcdd = Math.sqrt(bcddsq);         // length of delta

		if (bcdd < 1.0e-8) {                  // two balls center-over-center embedded
			d.z = -1.0;                       // patch up
			pball.state.pos!.z -= d.z;              // lift up

			bcdd = 1.0;                       // patch up
			bcddsq = 1.0;                     // patch up
			dv.z = 0.1;                       // small speed difference
			pball.hit.vel.z -= dv.z;
		}

		const b = dv.dot(d);                               // inner product
		const bnv = b / bcdd;                              // normal speed of balls toward each other

		if (bnv > C_LOWNORMVEL) {                          // dot of delta velocity and delta displacement, positive if receding no collison
			return -1.0;
		}

		const totalradius = pball.data.radius + this.data.radius;
		const bnd = bcdd - totalradius;                    // distance between ball surfaces

		let hittime: number;
//#ifdef BALL_CONTACTS //!! leads to trouble currently, might be due to missing contact handling for -both- balls?!
		let isContact = false;
//#endif
		if (bnd <= PHYS_TOUCH) {                           // in contact?
			if (bnd < pball.data.radius * -2.0) {
				return -1.0;                               // embedded too deep?
			}

			if ((Math.abs(bnv) > C_CONTACTVEL)             // >fast velocity, return zero time
				|| (bnd <= -PHYS_TOUCH)) {                 // zero time for rigid fast bodies
				hittime = 0;                               // slow moving but embedded
			} else {
				hittime = bnd / -bnv;
			}

//#ifdef BALL_CONTACTS
			if (Math.abs(bnv) <= C_CONTACTVEL) {
				isContact = true;
			}
//#endif
		} else {
			// find collision time as solution of quadratic equation
			//   at^2 + bt + c = 0
			//	(length(m_vel - pball->m_vel)*t) ^ 2 + ((m_vel - pball->m_vel).(m_pos - pball->m_pos)) * 2 * t = totalradius*totalradius - length(m_pos - pball->m_pos)^2

			const a = dv.lengthSq();                       // square of differential velocity
			if (a < 1.0e-8) {
				return -1.0;                               // ball moving really slow, then wait for contact
			}

			const sol = solveQuadraticEq(a, 2.0 * b, bcddsq - totalradius * totalradius);
			if (!sol) {
				return -1.0;
			}
			const [time1, time2] = sol;
			hittime = (time1 * time2 < 0) ? Math.max(time1, time2) : Math.min(time1, time2); // find smallest nonnegative solution
		}

		if (!isFinite(hittime) || hittime < 0 || hittime > dtime) {
			return -1.0; // .. was some time previous || beyond the next physics tick
		}

		const hitPos = pball.state.pos!.clone().add(dv.multiplyScalar(hittime)); // new ball position

		//calc unit normal of collision
		const hitnormal = hitPos.clone().sub(this.state.pos);
		if (Math.abs(hitnormal.x) <= FLT_MIN && Math.abs(hitnormal.y) <= FLT_MIN && Math.abs(hitnormal.z) <= FLT_MIN) {
			return -1;
		}
		coll.hitNormal = hitnormal;
		coll.hitNormal.normalize();

		coll.hitDistance = bnd;                            // actual contact distance

//#ifdef BALL_CONTACTS
		coll.isContact = isContact;
		if (isContact) {
			coll.hitOrgNormalVelocity = bnv;
		}
//#endif

		return hittime;
	}

	public collide3DWall(hitNormal: Vertex3D, elasticity: number, elastFalloff: number, friction: number, scatterAngle: number): void {

		//speed normal to wall
		let dot = this.vel.dot(hitNormal);

		if (dot >= -C_LOWNORMVEL) {                        // nearly receding ... make sure of conditions
			// otherwise if clearly approaching .. process the collision
			if (dot > C_LOWNORMVEL) {                      //is this velocity clearly receding (i.e must > a minimum)
				return;
			}
		}

		if (C_DISP_GAIN) { //#ifdef C_DISP_GAIN
			// correct displacements, mostly from low velocity, alternative to acceleration processing
			let hdist = -C_DISP_GAIN * this.coll.hitDistance;        // limit delta noise crossing ramps,
			if (hdist > 1.0e-4) {                                    // when hit detection checked it what was the displacement
				if (hdist > C_DISP_LIMIT) {
					hdist = C_DISP_LIMIT;                            // crossing ramps, delta noise
				}
				this.state.pos!.add(hitNormal.multiplyScalar(hdist));      // push along norm, back to free area
				// use the norm, but this is not correct, reverse time is correct
			}
		} //#endif

		// magnitude of the impulse which is just sufficient to keep the ball from
		// penetrating the wall (needed for friction computations)
		const reactionImpulse = this.data.mass * Math.abs(dot);

		elasticity = elasticityWithFalloff(elasticity, elastFalloff, dot);
		dot *= -(1.0 + elasticity);
		this.vel.add(hitNormal.multiplyScalar(dot));                           // apply collision impulse (along normal, so no torque)

		// compute friction impulse

		const surfP = hitNormal.clone().multiplyScalar(-this.data.radius);          // surface contact point relative to center of mass

		const surfVel = this.surfaceVelocity(surfP);                           // velocity at impact point

		const tangent = surfVel.clone().sub(hitNormal.clone().multiplyScalar(surfVel.dot(hitNormal))); // calc the tangential velocity

		const tangentSpSq = tangent.lengthSq();
		if (tangentSpSq > 1e-6) {
			tangent.divideScalar(Math.sqrt(tangentSpSq));                      // normalize to get tangent direction
			const vt = surfVel.dot(tangent);                                   // get speed in tangential direction

			// compute friction impulse
			const cross = Vertex3D.crossProduct(surfP, tangent);
			const kt = this.invMass + tangent.dot(Vertex3D.crossProduct(cross.divideScalar(this.inertia), surfP));

			// friction impulse can't be greather than coefficient of friction times collision impulse (Coulomb friction cone)
			const maxFric = friction * reactionImpulse;
			const jt = clamp(-vt / kt, -maxFric, maxFric);

			if (isFinite(jt)) {
				this.applySurfaceImpulse(cross.multiplyScalar(jt), tangent.multiplyScalar(jt));
			}
		}

		if (scatterAngle < 0.0) {
			scatterAngle = hardScatter;
		}  // if < 0 use global value
		scatterAngle *= this.tableData.globalDifficulty!; // apply difficulty weighting

		if (dot > 1.0 && scatterAngle > 1.0e-5) {          // no scatter at low velocity
			let scatter = Math.random() * 2 - 1;           // -1.0f..1.0f
			scatter *= (1.0 - scatter * scatter) * 2.59808 * scatterAngle; // shape quadratic distribution and scale
			const radsin = Math.sin(scatter);              // Green's transform matrix... rotate angle delta
			const radcos = Math.cos(scatter);              // rotational transform from current position to position at time t
			const vxt = this.vel.x;
			const vyt = this.vel.y;
			this.vel.x = vxt * radcos - vyt * radsin;      // rotate to random scatter angle
			this.vel.y = vyt * radcos + vxt * radsin;
		}
	}

	public surfaceVelocity(surfP: Vertex3D): Vertex3D {
		return this.vel
			.clone()
			.add(Vertex3D.crossProduct(this.angularVelocity, surfP)); // linear velocity plus tangential velocity due to rotation
	}

	public applySurfaceImpulse(rotI: Vertex3D, impulse: Vertex3D): void {
		this.vel.add(impulse.clone().multiplyScalar(this.invMass));

		this.angularMomentum.add(rotI);
		this.angularVelocity = this.angularMomentum.clone().divideScalar(this.inertia);
	}

	public handleStaticContact(coll: CollisionEvent, friction: number, dtime: number, player: Player): void {
		const normVel = this.vel.dot(coll.hitNormal!);      // this should be zero, but only up to +/- C_CONTACTVEL

		// If some collision has changed the ball's velocity, we may not have to do anything.
		if (normVel <= C_CONTACTVEL) {
			const fe = player.gravity.clone().multiplyScalar(this.data.mass);   // external forces (only gravity for now)
			const dot = fe.dot(coll.hitNormal!);
			const normalForce = Math.max(0.0, -(dot * dtime + coll.hitOrgNormalVelocity!)); // normal force is always nonnegative

			// Add just enough to kill original normal velocity and counteract the external forces.
			this.vel.add(coll.hitNormal!.clone().multiplyScalar(normalForce));

			// #ifdef C_EMBEDVELLIMIT
			if (coll.hitDistance <= PHYS_TOUCH) {
				this.vel.add(coll.hitNormal!.clone().multiplyScalar(Math.max(Math.min(C_EMBEDVELLIMIT, -coll.hitDistance), PHYS_TOUCH)));
			}
			// #endif

			this.applyFriction(coll.hitNormal!, dtime, friction, player);
		}
	}

	public applyFriction(hitnormal: Vertex3D, dtime: number, fricCoeff: number, player: Player): void {

		const surfP = hitnormal.clone().multiplyScalar(-this.data.radius);    // surface contact point relative to center of mass

		const surfVel = this.surfaceVelocity(surfP);
		const slip = surfVel.clone().sub(hitnormal.clone().multiplyScalar(surfVel.dot(hitnormal)));       // calc the tangential slip velocity

		const maxFric = fricCoeff * this.data.mass * - player.gravity.dot(hitnormal);

		const slipspeed = slip.length();
		let slipDir: Vertex3D;
		let numer: number;
		//slintf("Velocity: %.2f Angular velocity: %.2f Surface velocity: %.2f Slippage: %.2f\n", m_vel.Length(), m_angularvelocity.Length(), surfVel.Length(), slipspeed);
		//if (slipspeed > 1e-6f)

//#ifdef C_BALL_SPIN_HACK
		const normVel = this.vel.dot(hitnormal);
		if ((normVel <= 0.025) || (slipspeed < C_PRECISION)) { // check for <=0.025 originated from ball<->rubber collisions pushing the ball upwards, but this is still not enough, some could even use <=0.2
			// slip speed zero - static friction case

			const surfAcc = this.surfaceAcceleration(surfP, player);
			const slipAcc = surfAcc.clone().sub(hitnormal.multiplyScalar(surfAcc.dot(hitnormal))) ; // calc the tangential slip acceleration

			// neither slip velocity nor slip acceleration? nothing to do here
			if (slipAcc.lengthSq() < 1e-6) {
				return;
			}

			slipDir = slipAcc;
			slipDir.normalize();

			numer = -slipDir.dot(surfAcc);

		} else {
			// nonzero slip speed - dynamic friction case
			slipDir = slip.clone().divideScalar(slipspeed);
			numer = -slipDir.dot(surfVel);
		}

		const cp = Vertex3D.crossProduct(surfP, slipDir);
		const denom = this.invMass + slipDir.dot(Vertex3D.crossProduct(cp.clone().divideScalar(this.inertia), surfP));
		const fric = clamp(numer / denom, -maxFric, maxFric);

		if (isFinite(fric)) {
			this.applySurfaceImpulse(cp.clone().multiplyScalar(dtime * fric), slipDir.clone().multiplyScalar(dtime * fric));
		}
	}

	private surfaceAcceleration(surfP: Vertex3D, player: Player): Vertex3D {
		// if we had any external torque, we would have to add "(deriv. of ang.vel.) x surfP" here
		return player.gravity.clone()
			.multiplyScalar(this.invMass)                                                                          // linear acceleration
			.add(Vertex3D.crossProduct(this.angularVelocity, Vertex3D.crossProduct(this.angularVelocity, surfP))); // centripetal acceleration
	}
}
