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

import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { C_CONTACTVEL, C_LOWNORMVEL, C_TOL_ENDPNTS, C_TOL_RADIUS, PHYS_TOUCH } from './constants';
import { HitObject, HitTestResult } from './hit-object';

export class LineSeg extends HitObject {

	public readonly v1: Vertex2D;
	public readonly v2: Vertex2D;
	protected normal: Vertex2D = new Vertex2D();
	protected length!: number;

	constructor(p1: Vertex2D, p2: Vertex2D, zLow: number, zHigh: number, objType?: CollisionType) {
		super();
		this.v1 = p1;
		this.v2 = p2;
		this.hitBBox.zlow = zLow;
		this.hitBBox.zhigh = zHigh;
		this.calcNormal();
		this.calcHitBBox();

		if (objType) {
			this.objType = objType;
		}
	}

	public setSeg(x1: number, y1: number, x2: number, y2: number): this {
		this.v1.x = x1;
		this.v1.y = y1;
		this.v2.x = x2;
		this.v2.y = y2;
		return this.calcNormal().calcHitBBox();
	}

	public calcHitBBox(): this {
		// Allow roundoff
		this.hitBBox.left = Math.min(this.v1.x, this.v2.x);
		this.hitBBox.right = Math.max(this.v1.x, this.v2.x);
		this.hitBBox.top = Math.min(this.v1.y, this.v2.y);
		this.hitBBox.bottom = Math.max(this.v1.y, this.v2.y);

		// zlow and zhigh were already set in constructor
		return this;
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): HitTestResult {
		return this.hitTestBasic(ball, dTime, coll, true, true, true); // normal face, lateral, rigid
	}

	public hitTestBasic(ball: Ball, dTime: number, coll: CollisionEvent, direction: boolean, lateral: boolean, rigid: boolean): HitTestResult {

		if (!this.isEnabled || ball.hit.isFrozen) {
			return { hitTime: -1.0, coll };
		}

		// ball velocity
		const ballVx = ball.hit.vel.x;
		const ballVy = ball.hit.vel.y;

		// ball velocity normal to segment, positive if receding, zero=parallel
		const bnv = ballVx * this.normal.x + ballVy * this.normal.y;
		let isUnHit = bnv > C_LOWNORMVEL;

		// direction true and clearly receding from normal face
		if (direction && bnv > C_LOWNORMVEL) {
			return { hitTime: -1.0, coll };
		}

		// ball position
		const ballX = ball.state.pos.x;
		const ballY = ball.state.pos.y;

		// ball normal distance: contact distance normal to segment. lateral contact subtract the ball radius
		const rollingRadius = lateral ? ball.data.radius : C_TOL_RADIUS;       // lateral or rolling point
		const bcpd = (ballX - this.v1.x) * this.normal.x + (ballY - this.v1.y) * this.normal.y; // ball center to plane distance
		let bnd = bcpd - rollingRadius;

		// for a spinner add the ball radius otherwise the ball goes half through the spinner until it moves
		if (this.objType === CollisionType.Spinner || this.objType === CollisionType.Gate) {
			bnd = bcpd + rollingRadius;
		}

		const inside = bnd <= 0;                                     // in ball inside object volume
		let hitTime;
		if (rigid) {
			if (bnd < -ball.data.radius || lateral && bcpd < 0) {
				// (ball normal distance) excessive penetration of object skin ... no collision HACK
				return { hitTime: -1.0, coll };
			}
			if (lateral && bnd <= PHYS_TOUCH) {
				if (inside
					|| Math.abs(bnv) > C_CONTACTVEL                  // fast velocity, return zero time
					|| bnd <= -PHYS_TOUCH) {                         // zero time for rigid fast bodies
					hitTime = 0;                                     // slow moving but embedded

				} else {
					hitTime = bnd * (1.0 / (2.0 * PHYS_TOUCH)) + 0.5; // don't compete for fast zero time events
				}

			} else if (Math.abs(bnv) > C_LOWNORMVEL) {               // not velocity low ????
				hitTime = bnd / -bnv;                                // rate ok for safe divide

			} else {
				return { hitTime: -1.0, coll };                      // wait for touching
			}
		} else { //non-rigid ... target hits
			if (bnv * bnd >= 0) {                                                 // outside-receding || inside-approaching
				if (this.objType !== CollisionType.Trigger                        // not a trigger
					|| !ball.hit.isRealBall()                                     // is a trigger, so test:
					|| Math.abs(bnd) >= ball.data.radius * 0.5                    // not too close ... nor too far away
					|| inside !== (ball.hit.vpVolObjs.indexOf(this.obj!) < 0)) {  // ...ball outside and hit set or ball inside and no hit set
					return { hitTime: -1.0, coll };
				}
				hitTime = 0;
				isUnHit = !inside;                                    // ball on outside is UnHit, otherwise it's a Hit
			} else {
				hitTime = bnd / -bnv;
			}
		}

		if (!isFinite(hitTime) || hitTime < 0 || hitTime > dTime) {
			return { hitTime: -1.0, coll };                          // time is outside this frame ... no collision
		}
		const btv = ballVx * this.normal.y - ballVy * this.normal.x; // ball velocity tangent to segment with respect to direction from V1 to V2
		const btd = (ballX - this.v1.x) * this.normal.y
			- (ballY - this.v1.y) * this.normal.x                    // ball tangent distance
			+ btv * hitTime;                                         // ball tangent distance (projection) (initial position + velocity * hitime)

		if (btd < -C_TOL_ENDPNTS || btd > this.length + C_TOL_ENDPNTS) {  // is the contact off the line segment???
			return { hitTime: -1.0, coll };
		}
		if (!rigid) {                                                // non rigid body collision? return direction
			coll.hitFlag = isUnHit;                                  // UnHit signal is receding from outside target
		}

		const ballRadius = ball.data.radius;
		const hitZ = ball.state.pos.z + ball.hit.vel.z * hitTime;    // check too high or low relative to ball rolling point at hittime

		if (hitZ + ballRadius * 0.5 < this.hitBBox.zlow              // check limits of object's height and depth
			|| hitZ - ballRadius * 0.5 > this.hitBBox.zhigh) {
			return { hitTime: -1.0, coll };
		}

		// hit normal is same as line segment normal
		coll.hitNormal.set(this.normal.x, this.normal.y, 0.0);
		coll.hitDistance = bnd;        // actual contact distance ...
		//coll.m_hitRigid = rigid;     // collision type

		// check for contact
		if (Math.abs(bnv) <= C_CONTACTVEL && Math.abs(bnd) <= PHYS_TOUCH) {
			coll.isContact = true;
			coll.hitOrgNormalVelocity = bnv;
		}
		return { hitTime, coll };
	}

	public collide(coll: CollisionEvent): void {
		const dot = coll.hitNormal!.dot(coll.ball.hit.vel);
		coll.ball.hit.collide3DWall(coll.hitNormal!, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (dot <= -this.threshold) {
			this.fireHitEvent(coll.ball);
		}
	}

	private calcNormal(): this {
		const vT = Vertex2D.claim(this.v1.x - this.v2.x, this.v1.y - this.v2.y);

		// Set up line normal
		this.length = vT.length();
		const invLength = 1.0 / this.length;
		this.normal.set(vT.y * invLength, -vT.x * invLength);
		vT.release();
		return this;
	}
}
