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
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { C_CONTACTVEL, C_LOWNORMVEL, C_TOL_ENDPNTS, C_TOL_RADIUS, PHYS_TOUCH } from './constants';
import { HitObject } from './hit-object';

export class LineSeg extends HitObject {

	private readonly v1: Vertex2D;
	private readonly v2: Vertex2D;
	private normal!: Vertex2D;
	private length!: number;

	constructor(p1: Vertex2D, p2: Vertex2D, zLow: number, zHigh: number) {
		super();
		this.v1 = p1;
		this.v2 = p2;
		this.hitBBox.zlow = zLow;
		this.hitBBox.zhigh = zHigh;
		this.calcNormal();
	}

	public setSeg(x1: number, y1: number, x2: number, y2: number): this {
		this.v1.x = x1;
		this.v1.y = y1;
		this.v2.x = x2;
		this.v2.y = y2;
		return this.calcNormal();
	}

	public calcHitBBox(): void {
		// Allow roundoff
		this.hitBBox.left = Math.min(this.v1.x, this.v2.x);
		this.hitBBox.right = Math.max(this.v1.x, this.v2.x);
		this.hitBBox.top = Math.min(this.v1.y, this.v2.y);
		this.hitBBox.bottom = Math.max(this.v1.y, this.v2.y);

		// zlow and zhigh were already set in ctor
	}

	public collide(coll: CollisionEvent): void {
		const dot = coll.hitNormal!.dot(coll.ball.state.vel);
		coll.ball.hit.collide3DWall(coll.hitNormal!, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (dot <= -this.threshold) {
			this.fireHitEvent(coll.ball);
		}
	}

	public hitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
		return this.hitTestBasic(pball, dtime, coll, true, true, true); // normal face, lateral, rigid
	}

	private calcNormal(): this {
		const vT = new Vertex2D(this.v1.x - this.v2.x, this.v1.y - this.v2.y);

		// Set up line normal
		this.length = vT.length();
		const invLength = 1.0 / this.length;
		this.normal = new Vertex2D(vT.y * invLength, -vT.x * invLength);
		return this;
	}

	public getType(): CollisionType {
		return CollisionType.LineSeg;
	}

	private hitTestBasic(pball: Ball, dtime: number, coll: CollisionEvent, direction: boolean, lateral: boolean, rigid: boolean) {

		if (!this.isEnabled || pball.hit.isFrozen) {
			return -1.0;
		}

		const ballvx = pball.state.vel.x;						// ball velocity
		const ballvy = pball.state.vel.y;

		const bnv = ballvx * this.normal.x + ballvy * this.normal.y;		// ball velocity normal to segment, positive if receding, zero=parallel
		let bUnHit = (bnv > C_LOWNORMVEL);

		if (direction && (bnv > C_LOWNORMVEL)) {					// direction true and clearly receding from normal face
			return -1.0;
		}

		const ballx = pball.state.pos.x;						// ball position
		const bally = pball.state.pos.y;

		// ball normal distance: contact distance normal to segment. lateral contact subtract the ball radius
		const rollingRadius = lateral ? pball.data.radius : C_TOL_RADIUS; //lateral or rolling point
		const bcpd = (ballx - this.v1.x) * this.normal.x + (bally - this.v1.y) * this.normal.y; // ball center to plane distance
		let bnd = bcpd - rollingRadius;

		// for a spinner add the ball radius otherwise the ball goes half through the spinner until it moves
		if (this.objType === CollisionType.Spinner || this.objType === CollisionType.Gate) {
			bnd = bcpd + rollingRadius;
		}

		const inside = (bnd <= 0);						// in ball inside object volume

		let hittime;
		if (rigid) {
			if ((bnd < -pball.data.radius) || (lateral && bcpd < 0)) {
				return -1.0;	// (ball normal distance) excessive pentratration of object skin ... no collision HACK //!! *2 necessary?
			}
			if (lateral && (bnd <= PHYS_TOUCH)) {
				if (inside
					|| (Math.abs(bnv) > C_CONTACTVEL)			// fast velocity, return zero time
					// zero time for rigid fast bodies
					|| (bnd <= (-PHYS_TOUCH))) {
					hittime = 0;									// slow moving but embedded

				} else {
					hittime = bnd * (1.0 / (2.0 * PHYS_TOUCH)) + 0;	        // don't compete for fast zero time events
				}

			} else if (Math.abs(bnv) > C_LOWNORMVEL) {                  // not velocity low ????
				hittime = bnd / -bnv;                              // rate ok for safe divide

			} else {
				return -1.0;                                      // wait for touching
			}
		} else { //non-rigid ... target hits
			if (bnv * bnd >= 0) {                                // outside-receding || inside-approaching
				if (this.objType !== CollisionType.Trigger                     // not a trigger
					|| !pball.hit.vpVolObjs.length   // is a trigger, so test:
					|| (Math.abs(bnd) >= pball.data.radius * 0.5)        // not too close ... nor too far away
					|| (inside !== (pball.hit.vpVolObjs.indexOf(this.obj!) < 0))) { // ...ball outside and hit set or ball inside and no hit set
					return -1.0;
				}
				hittime = 0;
				bUnHit = !inside;	// ball on outside is UnHit, otherwise it's a Hit
			} else {
				hittime = bnd / -bnv;
			}
		}

		if (!isFinite(hittime) || hittime < 0 || hittime > dtime) {
			return -1.0; // time is outside this frame ... no collision
		}
		const btv = ballvx * this.normal.y - ballvy * this.normal.x;      // ball velocity tangent to segment with respect to direction from V1 to V2
		const btd = (ballx - this.v1.x) * this.normal.y - (bally - this.v1.y) * this.normal.x // ball tangent distance
			+ btv * hittime;                                       // ball tangent distance (projection) (initial position + velocity * hitime)

		if (btd < -C_TOL_ENDPNTS || btd > length + C_TOL_ENDPNTS) { // is the contact off the line segment???
			return -1.0;
		}
		if (!rigid) {                                               // non rigid body collision? return direction
			coll.hitFlag = bUnHit;                               // UnHit signal is receding from outside target
		}

		const ballr = pball.data.radius;
		const hitz = pball.state.pos.z + pball.state.vel.z * hittime;  // check too high or low relative to ball rolling point at hittime

		if (hitz + ballr * 0.5 < this.hitBBox.zlow                  // check limits of object's height and depth
		|| hitz - ballr * 0.5 > this.hitBBox.zhigh) {
			return -1.0;
		}
		coll.hitNormal!.x = this.normal.x; // hit normal is same as line segment normal
		coll.hitNormal!.y = this.normal.y;
		coll.hitNormal!.z = 0.0;

		coll.hitDistance = bnd;      // actual contact distance ...
		//coll.m_hitRigid = rigid;     // collision type

		// check for contact
		if (Math.abs(bnv) <= C_CONTACTVEL && Math.abs(bnd) <= PHYS_TOUCH) {
			coll.isContact = true;
			coll.hitOrgNormalVelocity = bnv;
		}

		return hittime;
	}
}
