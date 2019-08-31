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

import { PlayerPhysics } from '../game/player-physics';
import { solveQuadraticEq } from '../math/functions';
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { C_CONTACTVEL, C_LOWNORMVEL, PHYS_TOUCH } from './constants';
import { HitObject, HitTestResult } from './hit-object';

export class HitCircle extends HitObject {

	public center: Vertex2D;
	public readonly radius: number;

	constructor(center: Vertex2D, radius: number, zLow: number, zHigh: number) {
		super();
		this.center = center;
		this.radius = radius;
		this.hitBBox.zlow = zLow;
		this.hitBBox.zhigh = zHigh;
	}

	public collide(coll: CollisionEvent, player: PlayerPhysics): void {
		coll.ball.hit.collide3DWall(coll.hitNormal!, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);
	}

	public calcHitBBox(): void {
		// Allow roundoff
		this.hitBBox.left = this.center.x - this.radius;
		this.hitBBox.right = this.center.x + this.radius;
		this.hitBBox.top = this.center.y - this.radius;
		this.hitBBox.bottom = this.center.y + this.radius;
		// zlow & zhigh already set in ctor
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): HitTestResult {
		// normal face, lateral, rigid
		return this.hitTestBasicRadius(ball, dTime, coll, true, true, true);
	}

	protected hitTestBasicRadius(ball: Ball, dTime: number, coll: CollisionEvent, direction: boolean, lateral: boolean, rigid: boolean): HitTestResult {
		if (!this.isEnabled || ball.hit.isFrozen) {
			return { hitTime: -1.0, coll };
		}

		const c = new Vertex3D(this.center.x, this.center.y, 0.0);
		const dist = ball.state.pos.clone().sub(c);    // relative ball position
		const dv = ball.hit.vel.clone();

		const capsule3D = !lateral && ball.state.pos.z > this.hitBBox.zhigh;
		const isKicker = this.objType === CollisionType.Kicker;
		const isKickerOrTrigger = this.objType === CollisionType.Trigger || this.objType === CollisionType.Kicker;

		let targetRadius: number;
		if (capsule3D) {
			targetRadius = this.radius * (13.0 / 5.0);
			c.z = this.hitBBox.zhigh - this.radius * (12.0 / 5.0);
			dist.z = ball.state.pos.z - c.z;                          // ball rolling point - capsule center height

		} else {
			targetRadius = this.radius;
			if (lateral) {
				targetRadius += ball.data.radius;
			}
			dist.z = 0.0;
			dv.z = 0.0;
		}

		const bcddsq = dist.lengthSq();             // ball center to circle center distance ... squared
		const bcdd = Math.sqrt(bcddsq);             // distance center to center
		if (bcdd <= 1.0e-6) {
			return { hitTime: -1.0, coll };         // no hit on exact center
		}

		const b = dist.dot(dv);
		const bnv = b / bcdd;                       // ball normal velocity

		if (direction && bnv > C_LOWNORMVEL) {
			return { hitTime: -1.0, coll };         // clearly receding from radius
		}

		const bnd = bcdd - targetRadius;            // ball normal distance to

		const a = dv.lengthSq();

		let hitTime = 0;
		let isUnhit = false;
		let isContact = false;

		// Kicker is special.. handle ball stalled on kicker, commonly hit while receding, knocking back into kicker pocket
		if (isKicker && bnd <= 0 && bnd >= -this.radius && a < C_CONTACTVEL * C_CONTACTVEL && ball.hit.isRealBall()) {
			if (ball.hit.vpVolObjs.indexOf(this.obj!) > -1) {
				ball.hit.vpVolObjs.splice(ball.hit.vpVolObjs.indexOf(this.obj!), 1); // cause capture
			}
		}

		// positive: contact possible in future ... Negative: objects in contact now
		if (rigid && bnd < PHYS_TOUCH) {
			if (bnd < -ball.data.radius) {
				return { hitTime: -1.0, coll };

			} else if (Math.abs(bnv) <= C_CONTACTVEL) {
				isContact = true;

			} else {
				// estimate based on distance and speed along distance
				// the ball can be that fast that in the next hit cycle the ball will be inside the hit shape of a bumper or other element.
				// if that happens bnd is negative and greater than the negative bnv value that results in a negative hittime
				// below the "if (infNan(hittime) || hittime <0.f...)" will then be true and the hit function will return -1.0f = no hit
				hitTime = Math.max(0.0, -bnd / bnv);
			}

		} else if (isKickerOrTrigger && ball.hit.isRealBall() && (bnd < 0 === ball.hit.vpVolObjs.indexOf(this.obj!) < 0)) { // triggers & kickers

			// here if ... ball inside and no hit set .... or ... ball outside and hit set
			if (Math.abs(bnd - this.radius) < 0.05) {   // if ball appears in center of trigger, then assumed it was gen'ed there
				ball.hit.vpVolObjs.push(this.obj!);        // special case for trigger overlaying a kicker

			} else {                                       // this will add the ball to the trigger space without a Hit
				isUnhit = (bnd > 0);                       // ball on outside is UnHit, otherwise it's a Hit
			}

		} else {
			if ((!rigid && bnd * bnv > 0) || (a < 1.0e-8)) { // (outside and receding) or (inside and approaching)
				// no hit ... ball not moving relative to object
				return { hitTime: -1.0, coll };
			}

			const sol = solveQuadraticEq(a, 2.0 * b, bcddsq - targetRadius * targetRadius);
			if (!sol) {
				return { hitTime: -1.0, coll };
			}
			const [time1, time2] = sol;
			isUnhit = (time1 * time2 < 0);
			hitTime = isUnhit ? Math.max(time1, time2) : Math.min(time1, time2); // ball is inside the circle
		}

		if (!isFinite(hitTime) || hitTime < 0 || hitTime > dTime) {
			// contact out of physics frame
			return { hitTime: -1.0, coll };
		}

		const hitZ = ball.state.pos.z + ball.hit.vel.z * hitTime; // rolling point
		if (hitZ + ball.data.radius * 0.5 < this.hitBBox.zlow
			|| !capsule3D && (hitZ - ball.data.radius * 0.5) > this.hitBBox.zhigh
			|| capsule3D && hitZ < this.hitBBox.zhigh) {
			return { hitTime: -1.0, coll };
		}

		const hitX = ball.state.pos.x + ball.hit.vel.x * hitTime;
		const hitY = ball.state.pos.y + ball.hit.vel.y * hitTime;
		const sqrLen = (hitX - c.x) * (hitX - c.x) + (hitY - c.y) * (hitY - c.y);

		coll.hitNormal = new Vertex3D();

		// over center?
		if (sqrLen > 1.0e-8) {                             // no
			const invLen = 1.0 / Math.sqrt(sqrLen);
			coll.hitNormal.x = (hitX - c.x) * invLen;
			coll.hitNormal.y = (hitY - c.y) * invLen;

		} else {                                           // yes, over center
			coll.hitNormal.x = 0.0;                        // make up a value, any direction is ok
			coll.hitNormal.y = 1.0;
			coll.hitNormal.z = 0.0;
		}

		if (!rigid) {                                      // non rigid body collision? return direction
			coll.hitFlag = isUnhit;                        // UnHit signal is receding from target
		}

		coll.isContact = isContact;
		if (isContact) {
			coll.hitOrgNormalVelocity = bnv;
		}

		coll.hitDistance = bnd;                            // actual contact distance ...
		//coll.m_hitRigid = rigid;                         // collision type

		return { hitTime, coll };
	}
}
