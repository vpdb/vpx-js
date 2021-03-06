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
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { C_CONTACTVEL, PHYS_TOUCH } from './constants';
import { HitObject } from './hit-object';

export class HitLineZ extends HitObject {

	protected xy: Vertex2D;

	constructor(xy: Vertex2D, zlow?: number, zhigh?: number) {
		super();
		this.xy = xy;
		if (typeof zlow !== 'undefined') {
			this.hitBBox.zlow = zlow;
		}
		if (typeof zhigh !== 'undefined') {
			this.hitBBox.zhigh = zhigh;
		}
	}

	public set(x: number, y: number): this {
		this.xy.x = x;
		this.xy.y = y;
		return this;
	}

	public calcHitBBox(): void {
		this.hitBBox.left = this.xy.x;
		this.hitBBox.right = this.xy.x;
		this.hitBBox.top = this.xy.y;
		this.hitBBox.bottom = this.xy.y;

		// zlow and zhigh set in ctor
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): number {
		if (!this.isEnabled) {
			return -1.0;
		}

		const bp2d = Vertex2D.claim(ball.state.pos.x, ball.state.pos.y);
		const dist = bp2d.clone(true).sub(this.xy);            // relative ball position
		const dv = Vertex2D.claim(ball.hit.vel.x, ball.hit.vel.y);
		Vertex2D.release(bp2d);

		const bcddsq = dist.lengthSq();                    // ball center to line distance squared
		const bcdd = Math.sqrt(bcddsq);                    // distance ball to line
		if (bcdd <= 1.0e-6) {
			Vertex2D.release(dv, dist);
			return -1.0;                // no hit on exact center
		}

		const b = dist.dot(dv);
		const bnv = b / bcdd;                              // ball normal velocity
		Vertex2D.release(dist);

		if (bnv > C_CONTACTVEL) {
			Vertex2D.release(dv);
			return -1.0;                // clearly receding from radius
		}

		const bnd = bcdd - ball.data.radius;               // ball distance to line
		const a = dv.lengthSq();
		Vertex2D.release(dv);

		let hitTime = 0;
		let isContact = false;

		if (bnd < PHYS_TOUCH) {                            // already in collision distance?
			if (Math.abs(bnv) <= C_CONTACTVEL) {
				isContact = true;
				hitTime = 0;

			} else {
				hitTime = -bnd / bnv;                      // estimate based on distance and speed along distance
			}
		} else {
			if (a < 1.0e-8) {
				return -1.0;            // no hit - ball not moving relative to object
			}
			const sol = solveQuadraticEq(a, 2.0 * b, bcddsq - ball.data.radius * ball.data.radius);
			if (!sol) {
				return -1.0;
			}
			const time1 = sol[0];
			const time2 = sol[1];

			// find smallest non-negative solution
			hitTime = (time1 * time2 < 0) ? Math.max(time1, time2) : Math.min(time1, time2);
		}

		if (!isFinite(hitTime) || hitTime < 0 || hitTime > dTime) {
			return -1.0;                                    // contact out of physics frame
		}

		const hitZ = ball.state.pos.z + hitTime * ball.hit.vel.z;              // ball z position at hit time

		if (hitZ < this.hitBBox.zlow || hitZ > this.hitBBox.zhigh) {           // check z coordinate
			return -1.0;
		}

		const hitX = ball.state.pos.x + hitTime * ball.hit.vel.x;              // ball x position at hit time
		const hitY = ball.state.pos.y + hitTime * ball.hit.vel.y;              // ball y position at hit time

		const norm = Vertex2D.claim(hitX - this.xy.x, hitY - this.xy.y).normalize();
		coll.hitNormal.set(norm.x, norm.y, 0.0);
		Vertex2D.release(norm);

		coll.isContact = isContact;
		if (isContact) {
			coll.hitOrgNormalVelocity = bnv;
		}

		coll.hitDistance = bnd;                                                // actual contact distance
		//coll.m_hitRigid = true;

		return hitTime;
	}

	public collide(coll: CollisionEvent): void {
		const dot = coll.hitNormal.dot(coll.ball.hit.vel);
		coll.ball.hit.collide3DWall(coll.hitNormal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (dot <= -this.threshold) {
			this.fireHitEvent(coll.ball);
		}
	}
}
