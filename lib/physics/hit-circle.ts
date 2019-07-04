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

import { solveQuadraticEq } from '../math/functions';
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { C_CONTACTVEL, C_LOWNORMVEL, PHYS_TOUCH } from './constants';
import { HitObject } from './hit-object';
import { MoverObject } from './mover-object';

export class HitCircle extends HitObject {

	public center: Vertex2D;
	private readonly radius: number;

	constructor(center: Vertex2D, radius: number, zLow: number, zHigh: number) {
		super();
		this.center = center;
		this.radius = radius;
		this.hitBBox.zlow = zLow;
		this.hitBBox.zhigh = zHigh;
	}

	public HitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
		// normal face, lateral, rigid
		return this.HitTestBasicRadius(pball, dtime, coll, true, true, true);
	}

	public GetType(): CollisionType {
		return CollisionType.Circle;
	}

	public Collide(coll: CollisionEvent): void {
		coll.ball.Collide3DWall(coll.hitNormal!, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);
	}

	public CalcHitBBox(): void {
		// Allow roundoff
		this.hitBBox.left = this.center.x - this.radius;
		this.hitBBox.right = this.center.x + this.radius;
		this.hitBBox.top = this.center.y - this.radius;
		this.hitBBox.bottom = this.center.y + this.radius;

		// zlow & zhigh already set in ctor
	}

	public GetMoverObject(): MoverObject | undefined {
		return undefined;
	}

	private HitTestBasicRadius(pball: Ball, dtime: number, coll: CollisionEvent, direction: boolean, lateral: boolean, rigid: boolean): number {
		if (!this.isEnabled || pball.isFrozen) {
			return -1.0;
		}

		const c = new Vertex3D(this.center.x, this.center.y, 0.0);
		const dist = pball.pos.clone().sub(c);    // relative ball position
		const dv = pball.vel;

		const capsule3D = (!lateral && pball.pos.z > this.hitBBox.zhigh);

		let targetRadius: number;
		if (capsule3D) {
			targetRadius = this.radius * (13.0 / 5.0);
			c.z = this.hitBBox.zhigh - this.radius * (12.0 / 5.0);
			dist.z = pball.pos.z - c.z;                          // ball rolling point - capsule center height

		} else {
			targetRadius = this.radius;
			if (lateral) {
				targetRadius += pball.radius;
			}
			dist.z = dv.z = 0.0;
		}

		const bcddsq = dist.lengthSq();             // ball center to circle center distance ... squared
		const bcdd = Math.sqrt(bcddsq);             // distance center to center
		if (bcdd <= 1.0e-6) {
			return -1.0;                            // no hit on exact center
		}

		const b = dist.dot(dv);
		const bnv = b / bcdd;                       // ball normal velocity

		if (direction && bnv > C_LOWNORMVEL) {
			return -1.0;                            // clearly receding from radius
		}

		const bnd = bcdd - targetRadius;            // ball normal distance to

		const a = dv.lengthSq();

		let hittime = 0;
		let bUnhit = false;
		let isContact = false;

		// Kicker is special.. handle ball stalled on kicker, commonly hit while receding, knocking back into kicker pocket
		if (this.objType === CollisionType.Kicker && bnd <= 0 && bnd >= -this.radius && a < C_CONTACTVEL * C_CONTACTVEL && pball.vpVolObjs) {
			pball.vpVolObjs.splice(pball.vpVolObjs.indexOf(this.obj!), 1); // cause capture
		}

		if (rigid && bnd < PHYS_TOUCH) {        // positive: contact possible in future ... Negative: objects in contact now
			if (bnd < -pball.radius) {
				return -1.0;
			} else if (Math.abs(bnv) <= C_CONTACTVEL) {
				isContact = true;
			} else {
				// estimate based on distance and speed along distance
				// the ball can be that fast that in the next hit cycle the ball will be inside the hit shape of a bumper or other element.
				// if that happens bnd is negative and greater than the negative bnv value that results in a negative hittime
				// below the "if (infNan(hittime) || hittime <0.f...)" will then be true and the hit function will return -1.0f = no hit
				hittime = Math.max(0.0, -bnd / bnv);
			}
		} else if ((this.objType === CollisionType.Trigger || this.objType === CollisionType.Kicker)
			&& pball.vpVolObjs && ((bnd < 0) === pball.vpVolObjs.indexOf(this.obj!) < 0)) { // here if ... ball inside and no hit set .... or ... ball outside and hit set

			if (Math.abs(bnd - this.radius) < 0.05) { // if ball appears in center of trigger, then assumed it was gen'ed there
				pball.vpVolObjs.push(this.obj!); // special case for trigger overlaying a kicker
			} else {                                       // this will add the ball to the trigger space without a Hit
				bUnhit = (bnd > 0);	// ball on outside is UnHit, otherwise it's a Hit
			}
		} else {
			if ((!rigid && bnd * bnv > 0) || (a < 1.0e-8)) { // (outside and receding) or (inside and approaching)
				return -1.0;	    // no hit ... ball not moving relative to object
			}

			const sol = solveQuadraticEq(a, 2.0 * b, bcddsq - targetRadius * targetRadius);
			if (!sol) {
				return -1.0;
			}
			const time1 = sol[0];
			const time2 = sol[1];

			bUnhit = (time1 * time2 < 0);
			hittime = bUnhit ? Math.max(time1, time2) : Math.min(time1, time2); // ball is inside the circle
		}

		if (!isFinite(hittime) || hittime < 0 || hittime > dtime) {
			return -1.0; // contact out of physics frame
		}

		const hitz = pball.pos.z + pball.vel.z * hittime; // rolling point

		if (((hitz + pball.radius * 0.5) < this.hitBBox.zlow)
			|| (!capsule3D && (hitz - pball.radius * 0.5) > this.hitBBox.zhigh)
			|| (capsule3D && hitz < this.hitBBox.zhigh)) {
			return -1.0;
		}

		const hitx = pball.pos.x + pball.vel.x * hittime;
		const hity = pball.pos.y + pball.vel.y * hittime;

		const sqrlen = (hitx - c.x) * (hitx - c.x) + (hity - c.y) * (hity - c.y);

		coll.hitNormal = new Vertex3D();
		if (sqrlen > 1.0e-8) { // over center???
			// no
			const invLen = 1.0 / Math.sqrt(sqrlen);
			coll.hitNormal.x = (hitx - c.x) * invLen;
			coll.hitNormal.y = (hity - c.y) * invLen;

		} else {
			// yes, over center
			coll.hitNormal.x = 0.0; // make up a value, any direction is ok
			coll.hitNormal.y = 1.0;
			coll.hitNormal.z = 0.0;
		}

		if (!rigid) {                 // non rigid body collision? return direction
			coll.hitFlag = bUnhit; // UnHit signal	is receding from target
		}

		coll.isContact = isContact;
		if (isContact) {
			coll.hitOrgNormalVelocity = bnv;
		}

		coll.hitDistance = bnd;   //actual contact distance ...
		//coll.m_hitRigid = rigid;  // collision type

		return hittime;
	}
}
