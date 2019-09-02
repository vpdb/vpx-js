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
import { FRect3D } from '../math/frect3d';
import { solveQuadraticEq } from '../math/functions';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { C_CONTACTVEL, PHYS_TOUCH } from './constants';
import { HitObject } from './hit-object';

export class HitPoint extends HitObject {

	private readonly p: Vertex3D;

	constructor(p: Vertex3D) {
		super();
		this.p = p;
	}

	public calcHitBBox(): void {
		this.hitBBox = new FRect3D(this.p.x, this.p.x, this.p.y, this.p.y, this.p.z, this.p.z);
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent, physics: PlayerPhysics): number {
		if (!this.isEnabled) {
			return -1.0;
		}

		// relative ball position
		const dist = ball.state.pos.clone(true).sub(this.p);

		const bcddsq = dist.lengthSq();                    // ball center to line distance squared
		const bcdd = Math.sqrt(bcddsq);                    // distance ball to line
		if (bcdd <= 1.0e-6) {
			Vertex3D.release(dist);
			return -1.0;                // no hit on exact center
		}

		const b = dist.dot(ball.hit.vel);
		const bnv = b / bcdd;                              // ball normal velocity
		Vertex3D.release(dist);

		if (bnv > C_CONTACTVEL) {
			return -1.0;                // clearly receding from radius
		}

		const bnd = bcdd - ball.data.radius;               // ball distance to line
		const a = ball.hit.vel.lengthSq();

		let hitTime = 0;
		let isContact = false;

		if (bnd < PHYS_TOUCH) {                            // already in collision distance?
			if (Math.abs(bnv) <= C_CONTACTVEL) {
				isContact = true;
				hitTime = 0;
			} else {                                       // estimate based on distance and speed along distance
				hitTime = Math.max(0.0, -bnd / bnv);
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
			return -1.0;                // contact out of physics frame
		}

		const hitVel = ball.hit.vel.clone(true).multiplyScalar(hitTime);
		const hitNormal = ball.state.pos.clone(true)
			.add(hitVel)
			.sub(this.p)
			.normalize();
		coll.hitNormal.set(hitNormal);
		Vertex3D.release(hitVel, hitNormal);

		coll.isContact = isContact;
		if (isContact) {
			coll.hitOrgNormalVelocity = bnv;
		}

		coll.hitDistance = bnd;                            // actual contact distance
		//coll.m_hitRigid = true;

		return hitTime;
	}

	public collide(coll: CollisionEvent): void {
		const dot = coll.hitNormal!.dot(coll.ball.hit.vel);
		coll.ball.hit.collide3DWall(coll.hitNormal!, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (dot <= -this.threshold) {
			this.fireHitEvent(coll.ball);
		}
	}
}
