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

// import { Player } from '../../game/player';
// import { clamp, solveQuadraticEq } from '../../math/functions';
// import { Matrix3D } from '../../math/matrix3d';
// import { Vertex3D } from '../../math/vertex3d';
// import { CollisionEvent } from '../../physics/collision-event';
// import { CollisionType } from '../../physics/collision-type';
// import {
// 	C_CONTACTVEL,
// 	C_DISP_GAIN,
// 	C_DISP_LIMIT,
// 	C_EMBEDDED,
// 	C_EMBEDSHOT, C_EMBEDVELLIMIT,
// 	C_LOWNORMVEL, C_PRECISION,
// 	PHYS_TOUCH,
// } from '../../physics/constants';
// import { IFireEvents } from '../../physics/events';
// import { elasticityWithFalloff, hardScatter } from '../../physics/functions';
// import { HitObject } from '../../physics/hit-object';
// import { MoverObject } from '../../physics/mover-object';
// import { GameData } from '../game-data';
// import { FLT_MIN } from '../mesh';
// import { Texture } from '../texture';
// import { BallMover } from './ball-mover';
//
// export class Ball extends HitObject {
//
// 	private readonly player: Player;
// 	private readonly tableData: GameData;
// 	private color = 0xffffff;
//
// 	// Per frame info
// 	//CCO(BallEx) * m_pballex; // Object model version of the ball
//
// 	private szImage: string;
// 	private szImageFront: string;
//
// 	private pinballEnv?: Texture;
// 	private pinballDecal?: Texture;
// 	public vpVolObjs?: IFireEvents[]; // vector of triggers and kickers we are now inside (stored as IFireEvents* though, as HitObject.m_obj stores it like that!)
//
// 	private coll: CollisionEvent;  // collision information, may not be a actual hit if something else happens first
//
// 	private ballMover: BallMover;
//
// 	public pos?: Vertex3D;
// 	private defaultZ = 25.0;       // normal height of the ball //!! remove?
//
// 	private oldpos: Vertex3D[] = []; // for the optional ball trails
// 	private ringCounterOldPos = 0;
//
// 	public vel = new Vertex3D();        // ball velocity
// 	private oldVel?: Vertex3D;
//
// 	public radius = 25;
// 	private mass = 1;
// 	private invMass = 1;
//
// 	private rcHitRadiusSqr?: number; // extended (by m_vel + magic) squared radius, used in collision detection
//
// 	public eventPos = new Vertex3D(-1, -1, -1);  // last hit event position (to filter hit 'equal' hit events)
//
// 	private orientation =  new Matrix3D().setIdentity();
// 	private angularmomentum = new Vertex3D();
// 	private angularvelocity = new Vertex3D();
// 	private inertia: number;
//
// 	private id: number; // unique ID for each ball
//
// 	private bulbIntensityScale = 1; // to dampen/increase contribution of the bulb lights (locally/by script)
//
// 	private playfieldReflectionStrength = 1;
//
// 	public isFrozen = false;
// 	private reflectionEnabled = true;
// 	private forceReflection = false;
// 	private visible = true;
// 	private decalMode?: boolean;
//
// 	private static ballID: number;
//
// 	// increased for each ball created to have an unique ID for scripts for each ball
//
// 	constructor(player: Player, tableData: GameData) {
// 		super();
// 		this.player = player;
// 		this.tableData = tableData;
// 		this.id = Ball.ballID;
// 		Ball.ballID++;
// 		this.coll = new CollisionEvent(this);
// 		this.inertia = (2.0 / 5.0) * this.radius * this.radius * this.mass;
// 		this.ballMover = new BallMover(this);
// 		this.szImage = this.tableData.szBallImage;
// 		this.szImageFront = this.tableData.szBallImageFront;
// 	}
//
// 	public Init(mass: number): void {
//
// 		// Only called by real balls, not temporary objects created for physics/rendering
// 		this.mass = mass;
// 		this.invMass = 1.0 / this.mass;
//
// 		this.orientation.setIdentity();
// 		this.inertia = (2.0 / 5.0) * this.radius * this.radius * this.mass;
// 		this.angularvelocity.setZero();
// 		this.angularmomentum.setZero();
//
// 		this.isFrozen = false;
//
// 		this.playfieldReflectionStrength = 1.0;
// 		this.reflectionEnabled = true;
// 		this.forceReflection = false;
// 		this.visible = true;
//
// 		this.coll.obj = undefined;
//
// 		//this.pballex = NULL;
//
// 		this.vpVolObjs = [];
//
// 		this.color = 0xffffff;
//
// 		// override table ball image with global ball image?
// 		// if (g_pplayer->m_overwriteBallImages && g_pplayer->m_ballImage) {
// 		// 	m_pinballEnv = g_pplayer->m_ballImage;
// 		// } else {
// 		// 	if (g_pplayer->m_ptable->m_szBallImage[0] == '\0') {
// 		// 		m_szImage[0] = '\0';
// 		// 		m_pinballEnv = NULL;
// 		// 	} else {
// 		// 		lstrcpy(m_szImage, g_pplayer->m_ptable->m_szBallImage);
// 		// 		m_pinballEnv = g_pplayer->m_ptable->GetImage(m_szImage);
// 		// 	}
// 		// }
//
// 		// override table ball logo/decal image with global ball logo/decal image?
// 		// if (g_pplayer->m_overwriteBallImages && g_pplayer->m_decalImage) {
// 		// 	m_pinballDecal = g_pplayer->m_decalImage;
// 		// } else {
// 		// 	if (g_pplayer->m_ptable->m_szBallImageFront[0] == '\0') {
// 		// 		m_szImageFront[0] = '\0';
// 		// 		m_pinballDecal = NULL;
// 		// 	} else {
// 		// 		lstrcpy(m_szImageFront, g_pplayer->m_ptable->m_szBallImageFront);
// 		// 		m_pinballDecal = g_pplayer->m_ptable->GetImage(m_szImageFront);
// 		// 	}
// 		// }
//
// 		this.bulbIntensityScale = this.tableData.defaultBulbIntensityScaleOnBall!;
// 	}
//
// 	// public RenderSetup(): void {
// 	// }
//
// 	public UpdateDisplacements(dtime: number): void {
// 		if (!this.isFrozen) {
// 			const ds = this.vel.clone().multiplyScalar(dtime);
// 			this.pos!.add(ds);
//
// 			this.CalcHitBBox();
//
// 			const mat3 = new Matrix3D();
// 			mat3.createSkewSymmetric(this.angularvelocity);
//
// 			const addedorientation = new Matrix3D();
// 			addedorientation.multiply(mat3, this.orientation);
// 			addedorientation.multiplyScalar(dtime);
//
// 			this.orientation.addMatrix(addedorientation, this.orientation);
// 			this.orientation.orthoNormalize();
//
// 			this.angularvelocity = this.angularmomentum.clone().divideScalar(this.inertia);
// 		}
// 	}
//
// 	// tslint:disable-next-line:no-empty
// 	public UpdateVelocities(): void {
// 	}
//
// 	// From HitObject
// 	public HitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
//
// 		const d = this.pos!.clone().sub(pball.pos!);  // delta position
// 		const dv = this.vel.clone().sub(pball.vel);   // delta velocity
//
// 		let bcddsq = d.lengthSq();            // square of ball center's delta distance
// 		let bcdd = Math.sqrt(bcddsq);         // length of delta
//
// 		if (bcdd < 1.0e-8) {                  // two balls center-over-center embedded
// 			d.z = -1.0;                       // patch up
// 			pball.pos!.z -= d.z;              // lift up
//
// 			bcdd = 1.0;                       // patch up
// 			bcddsq = 1.0;                     // patch up
// 			dv.z = 0.1;                       // small speed difference
// 			pball.vel.z -= dv.z;
// 		}
//
// 		const b = dv.dot(d);                               // inner product
// 		const bnv = b / bcdd;                              // normal speed of balls toward each other
//
// 		if (bnv > C_LOWNORMVEL) {                          // dot of delta velocity and delta displacement, positive if receding no collison
// 			return -1.0;
// 		}
//
// 		const totalradius = pball.radius + this.radius;
// 		const bnd = bcdd - totalradius;                    // distance between ball surfaces
//
// 		let hittime: number;
// //#ifdef BALL_CONTACTS //!! leads to trouble currently, might be due to missing contact handling for -both- balls?!
// 		let isContact = false;
// //#endif
// 		if (bnd <= PHYS_TOUCH) {                           // in contact?
// 			if (bnd < pball.radius * -2.0) {
// 				return -1.0;                               // embedded too deep?
// 			}
//
// 			if ((Math.abs(bnv) > C_CONTACTVEL)             // >fast velocity, return zero time
// 				|| (bnd <= -PHYS_TOUCH)) {                 // zero time for rigid fast bodies
// 				hittime = 0;                               // slow moving but embedded
// 			} else {
// 				hittime = bnd / -bnv;
// 			}
//
// //#ifdef BALL_CONTACTS
// 			if (Math.abs(bnv) <= C_CONTACTVEL) {
// 				isContact = true;
// 			}
// //#endif
// 		} else {
// 			// find collision time as solution of quadratic equation
// 			//   at^2 + bt + c = 0
// 			//	(length(m_vel - pball->m_vel)*t) ^ 2 + ((m_vel - pball->m_vel).(m_pos - pball->m_pos)) * 2 * t = totalradius*totalradius - length(m_pos - pball->m_pos)^2
//
// 			const a = dv.lengthSq();                       // square of differential velocity
// 			if (a < 1.0e-8) {
// 				return -1.0;                               // ball moving really slow, then wait for contact
// 			}
//
// 			const sol = solveQuadraticEq(a, 2.0 * b, bcddsq - totalradius * totalradius);
// 			if (!sol) {
// 				return -1.0;
// 			}
// 			const [time1, time2] = sol;
// 			hittime = (time1 * time2 < 0) ? Math.max(time1, time2) : Math.min(time1, time2); // find smallest nonnegative solution
// 		}
//
// 		if (!isFinite(hittime) || hittime < 0 || hittime > dtime) {
// 			return -1.0; // .. was some time previous || beyond the next physics tick
// 		}
//
// 		const hitPos = pball.pos!.clone().add(dv.multiplyScalar(hittime)); // new ball position
//
// 		//calc unit normal of collision
// 		const hitnormal = hitPos.clone().sub(this.pos!);
// 		if (Math.abs(hitnormal.x) <= FLT_MIN && Math.abs(hitnormal.y) <= FLT_MIN && Math.abs(hitnormal.z) <= FLT_MIN) {
// 			return -1;
// 		}
// 		coll.hitNormal = hitnormal;
// 		coll.hitNormal.normalize();
//
// 		coll.hitDistance = bnd;                            // actual contact distance
//
// //#ifdef BALL_CONTACTS
// 		coll.isContact = isContact;
// 		if (isContact) {
// 			coll.hitOrgNormalVelocity = bnv;
// 		}
// //#endif
//
// 		return hittime;
// 	}
//
// 	public GetType(): CollisionType {
// 		return CollisionType.Ball;
// 	}
//
// 	public Collide(coll: CollisionEvent): void {
// 		const pball = coll.ball;
//
// 		// make sure we process each ball/ball collision only once
// 		// (but if we are frozen, there won't be a second collision event, so deal with it now!)
// 		// if (((g_pplayer->m_swap_ball_collision_handling && pball >= this) || (!g_pplayer->m_swap_ball_collision_handling && pball <= this)) && !m_frozen) {
// 		// 	return;
// 		// }
//
// 		// target ball to object ball delta velocity
// 		const vrel = pball.vel.clone().sub(this.vel);
// 		const vnormal = coll.hitNormal!;
// 		let dot = vrel.dot(vnormal);
//
// 		// correct displacements, mostly from low velocity, alternative to true acceleration processing
// 		if (dot >= -C_LOWNORMVEL) {                        // nearly receding ... make sure of conditions
// 			// otherwise if clearly approaching .. process the collision
// 			if (dot > C_LOWNORMVEL) {                      // is this velocity clearly receding (i.e must > a minimum)
// 				return;
// 			}
// //#ifdef C_EMBEDDED
// 			if (coll.hitDistance < -C_EMBEDDED) {
// 				dot = -C_EMBEDSHOT;                        // has ball become embedded???, give it a kick
// 			} else {
// 				return;
// 			}
// //#endif
// 		}
//
// 		// send ball/ball collision event to script function
// 		// if (dot < -0.25) {    // only collisions with at least some small true impact velocity (no contacts)
// 		// 	g_pplayer->m_ptable->InvokeBallBallCollisionCallback(this, pball, -dot);
// 		// }
//
// //#ifdef C_DISP_GAIN
// 		let edist = -C_DISP_GAIN * coll.hitDistance;
// 		if (edist > 1.0e-4) {
// 			if (edist > C_DISP_LIMIT) {
// 				edist = C_DISP_LIMIT;                      // crossing ramps, delta noise
// 			}
// 			if (!this.isFrozen) {                          // if the hitten ball is not frozen
// 				edist *= 0.5;
// 			}
// 			pball.pos!.add(vnormal.clone().multiplyScalar(edist)); // push along norm, back to free area
// 			// use the norm, but is not correct, but cheaply handled
// 		}
//
// 		edist = -C_DISP_GAIN * this.coll.hitDistance;      // noisy value .... needs investigation
// 		if (!this.isFrozen && edist > 1.0e-4) {
// 			if (edist > C_DISP_LIMIT) {
// 				edist = C_DISP_LIMIT;                      // crossing ramps, delta noise
// 			}
// 			edist *= 0.5;
// 			this.pos!.sub(vnormal.clone().multiplyScalar(edist));  // pull along norm, back to free area
// 		}
// //#endif
//
// 		const myInvMass = this.isFrozen ? 0.0 : this.invMass;                  // frozen ball has infinite mass
// 		const impulse = -(1.0 + 0.8) * dot / (myInvMass + pball.invMass);      // resitution = 0.8
//
// 		if (!this.isFrozen) {
// 			this.vel.sub(vnormal.clone().multiplyScalar(impulse * myInvMass));
// 		}
//
// 		pball.vel.add(vnormal.clone().multiplyScalar(impulse * pball.invMass));
// 	}
//
// 	// public Contact(coll: CollisionEvent, dtime: number): void {
// 	// }
//
// 	public CalcHitBBox(): void {
// 		const vl = this.vel.length() + this.radius + 0.05; //!! 0.05f = paranoia
// 		this.hitBBox.left = this.pos!.x - vl;
// 		this.hitBBox.right = this.pos!.x + vl;
// 		this.hitBBox.top = this.pos!.y - vl;
// 		this.hitBBox.bottom = this.pos!.y + vl;
// 		this.hitBBox.zlow = this.pos!.z - vl;
// 		this.hitBBox.zhigh = this.pos!.z + vl;
//
// 		this.rcHitRadiusSqr = vl * vl;
// 		//assert(m_rcHitRadiusSqr <= FLT_MAX);
//
// 		// update defaultZ for ball reflection
// 		// if the ball was created by a kicker which is higher than the playfield
// 		// the defaultZ must be updated if the ball falls onto the playfield that means the Z value is equal to the radius
// 		if (this.pos!.z === this.radius + this.tableData.tableheight) {
// 			this.defaultZ = this.pos!.z;
// 		}
// 	}
//
// 	public Collide3DWall(hitNormal: Vertex3D, elasticity: number, elastFalloff: number, friction: number, scatterAngle: number): void {
//
// 		//speed normal to wall
// 		let dot = this.vel.dot(hitNormal);
//
// 		if (dot >= -C_LOWNORMVEL) {                        // nearly receding ... make sure of conditions
// 			// otherwise if clearly approaching .. process the collision
// 			if (dot > C_LOWNORMVEL) {                      //is this velocity clearly receding (i.e must > a minimum)
// 				return;
// 			}
// //#ifdef C_EMBEDDED
// 			if (this.coll.hitDistance < -C_EMBEDDED) {
// 				dot = -C_EMBEDSHOT;                        // has ball become embedded???, give it a kick
// 			} else {
// 				return;
// 			}
// //#endif
// 		}
//
// 		if (C_DISP_GAIN) { //#ifdef C_DISP_GAIN
// 			// correct displacements, mostly from low velocity, alternative to acceleration processing
// 			let hdist = -C_DISP_GAIN * this.coll.hitDistance;        // limit delta noise crossing ramps,
// 			if (hdist > 1.0e-4) {                                    // when hit detection checked it what was the displacement
// 				if (hdist > C_DISP_LIMIT) {
// 					hdist = C_DISP_LIMIT;                            // crossing ramps, delta noise
// 				}
// 				this.pos!.add(hitNormal.multiplyScalar(hdist));      // push along norm, back to free area
// 				// use the norm, but this is not correct, reverse time is correct
// 			}
// 		} //#endif
//
// 		// magnitude of the impulse which is just sufficient to keep the ball from
// 		// penetrating the wall (needed for friction computations)
// 		const reactionImpulse = this.mass * Math.abs(dot);
//
// 		elasticity = elasticityWithFalloff(elasticity, elastFalloff, dot);
// 		dot *= -(1.0 + elasticity);
// 		this.vel.add(hitNormal.multiplyScalar(dot));                           // apply collision impulse (along normal, so no torque)
//
// 		// compute friction impulse
//
// 		const surfP = hitNormal.clone().multiplyScalar(-this.radius);          // surface contact point relative to center of mass
//
// 		const surfVel = this.SurfaceVelocity(surfP);                           // velocity at impact point
//
// 		const tangent = surfVel.clone().sub(hitNormal.clone().multiplyScalar(surfVel.dot(hitNormal))); // calc the tangential velocity
//
// 		const tangentSpSq = tangent.lengthSq();
// 		if (tangentSpSq > 1e-6) {
// 			tangent.divideScalar(Math.sqrt(tangentSpSq));                      // normalize to get tangent direction
// 			const vt = surfVel.dot(tangent);                                   // get speed in tangential direction
//
// 			// compute friction impulse
// 			const cross = Vertex3D.crossProduct(surfP, tangent);
// 			const kt = this.invMass + tangent.dot(Vertex3D.crossProduct(cross.divideScalar(this.inertia), surfP));
//
// 			// friction impulse can't be greather than coefficient of friction times collision impulse (Coulomb friction cone)
// 			const maxFric = friction * reactionImpulse;
// 			const jt = clamp(-vt / kt, -maxFric, maxFric);
//
// 			if (isFinite(jt)) {
// 				this.ApplySurfaceImpulse(cross.multiplyScalar(jt), tangent.multiplyScalar(jt));
// 			}
// 		}
//
// 		if (scatterAngle < 0.0) {
// 			scatterAngle = hardScatter;
// 		}  // if < 0 use global value
// 		scatterAngle *= this.tableData.globalDifficulty!; // apply difficulty weighting
//
// 		if (dot > 1.0 && scatterAngle > 1.0e-5) {          // no scatter at low velocity
// 			let scatter = Math.random() * 2 - 1;           // -1.0f..1.0f
// 			scatter *= (1.0 - scatter * scatter) * 2.59808 * scatterAngle; // shape quadratic distribution and scale
// 			const radsin = Math.sin(scatter);              // Green's transform matrix... rotate angle delta
// 			const radcos = Math.cos(scatter);              // rotational transform from current position to position at time t
// 			const vxt = this.vel.x;
// 			const vyt = this.vel.y;
// 			this.vel.x = vxt * radcos - vyt * radsin;      // rotate to random scatter angle
// 			this.vel.y = vyt * radcos + vxt * radsin;
// 		}
// 	}
//
// 	public ApplyFriction(hitnormal: Vertex3D, dtime: number, fricCoeff: number): void {
//
// 		const surfP = hitnormal.clone().multiplyScalar(-this.radius);    // surface contact point relative to center of mass
//
// 		const surfVel = this.SurfaceVelocity(surfP);
// 		const slip = surfVel.clone().sub(hitnormal.clone().multiplyScalar(surfVel.dot(hitnormal)));       // calc the tangential slip velocity
//
// 		const maxFric = fricCoeff * this.mass * - this.player.gravity.dot(hitnormal);
//
// 		const slipspeed = slip.length();
// 		let slipDir: Vertex3D;
// 		let numer: number;
// 		//slintf("Velocity: %.2f Angular velocity: %.2f Surface velocity: %.2f Slippage: %.2f\n", m_vel.Length(), m_angularvelocity.Length(), surfVel.Length(), slipspeed);
// 		//if (slipspeed > 1e-6f)
//
// //#ifdef C_BALL_SPIN_HACK
// 		const normVel = this.vel.dot(hitnormal);
// 		if ((normVel <= 0.025) || (slipspeed < C_PRECISION)) { // check for <=0.025 originated from ball<->rubber collisions pushing the ball upwards, but this is still not enough, some could even use <=0.2
// 			// slip speed zero - static friction case
//
// 			const surfAcc = this.SurfaceAcceleration(surfP);
// 			const slipAcc = surfAcc.clone().sub(hitnormal.multiplyScalar(surfAcc.dot(hitnormal))) ; // calc the tangential slip acceleration
//
// 			// neither slip velocity nor slip acceleration? nothing to do here
// 			if (slipAcc.lengthSq() < 1e-6) {
// 				return;
// 			}
//
// 			slipDir = slipAcc;
// 			slipDir.normalize();
//
// 			numer = -slipDir.dot(surfAcc);
//
// 		} else {
// 			// nonzero slip speed - dynamic friction case
// 			slipDir = slip.clone().divideScalar(slipspeed);
// 			numer = -slipDir.dot(surfVel);
// 		}
//
// 		const cp = Vertex3D.crossProduct(surfP, slipDir);
// 		const denom = this.invMass + slipDir.dot(Vertex3D.crossProduct(cp.clone().divideScalar(this.inertia), surfP));
// 		const fric = clamp(numer / denom, -maxFric, maxFric);
//
// 		if (isFinite(fric)) {
// 			this.ApplySurfaceImpulse(cp.clone().multiplyScalar(dtime * fric), slipDir.clone().multiplyScalar(dtime * fric));
// 		}
// 	}
//
// 	public HandleStaticContact(coll: CollisionEvent, friction: number, dtime: number): void {
// 		const normVel = this.vel.dot(coll.hitNormal!);      // this should be zero, but only up to +/- C_CONTACTVEL
//
// 		// If some collision has changed the ball's velocity, we may not have to do anything.
// 		if (normVel <= C_CONTACTVEL) {
// 			const fe = this.player.gravity.clone().multiplyScalar(this.mass);   // external forces (only gravity for now)
// 			const dot = fe.dot(coll.hitNormal!);
// 			const normalForce = Math.max(0.0, -(dot * dtime + coll.hitOrgNormalVelocity!)); // normal force is always nonnegative
//
// 			// Add just enough to kill original normal velocity and counteract the external forces.
// 			this.vel.add(coll.hitNormal!.clone().multiplyScalar(normalForce));
//
// //#ifdef C_EMBEDVELLIMIT
// 			if (coll.hitDistance <= PHYS_TOUCH) {
// 				this.vel.add(coll.hitNormal!.clone().multiplyScalar(Math.max(Math.min(C_EMBEDVELLIMIT, -coll.hitDistance), PHYS_TOUCH)));
// 			}
// //#endif
// 			this.ApplyFriction(coll.hitNormal!, dtime, friction);
// 		}
// 	}
//
// 	public SurfaceVelocity(surfP: Vertex3D): Vertex3D {
// 		// TODO
// 		return new Vertex3D();
// 	}
//
// 	public SurfaceAcceleration(surfP: Vertex3D): Vertex3D {
// 		// TODO
// 		return new Vertex3D();
// 	}
//
// 	public ApplySurfaceImpulse(rotI: Vertex3D, impulse: Vertex3D): void {
// 		this.vel.add(impulse.clone().multiplyScalar(this.invMass));
//
// 		this.angularmomentum.add(rotI);
// 		//const float aml = m_angularmomentum.Length();
// 		//if (aml > m_inertia*135.0f) //!! hack to limit ball spin
// 		//   m_angularmomentum *= (m_inertia*135.0f) / aml;
// 		this.angularvelocity = this.angularmomentum.divideScalar(this.inertia);
// 	}
//
// 	// public EnsureOMObject(): void {
// 	// }
//
// 	public GetMoverObject(): MoverObject | undefined {
// 		return undefined;
// 	}
// }
