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

import { Player } from '../game/player';
import { FRect3D } from '../math/frect3d';
import { solveQuadraticEq } from '../math/functions';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
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

	public collide(coll: CollisionEvent): void {
		const dot = coll.hitNormal!.dot(coll.ball.state.vel);
		coll.ball.hit.collide3DWall(coll.hitNormal!, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (dot <= -this.threshold) {
			this.fireHitEvent(coll.ball);
		}
	}

	public getType(): CollisionType {
		return CollisionType.Point;
	}

	public hitTest(pball: Ball, dtime: number, coll: CollisionEvent, player: Player): number {
		if (!this.isEnabled) {
			return -1.0;
		}

		const dist = pball.state.pos.clone().sub(this.p);  // relative ball position

		const bcddsq = dist.lengthSq();  // ball center to line distance squared
		const bcdd = Math.sqrt(bcddsq);           // distance ball to line
		if (bcdd <= 1.0e-6) {
			return -1.0;                           // no hit on exact center
		}

		const b = dist.dot(pball.state.vel);
		const bnv = b / bcdd;                   // ball normal velocity

		if (bnv > C_CONTACTVEL) {
			return -1.0;
		}                           // clearly receding from radius

		const bnd = bcdd - pball.data.radius;   // ball distance to line

		const a = pball.state.vel.lengthSq();

		let hittime = 0;
		let isContact = false;

		if (bnd < PHYS_TOUCH) {      // already in collision distance?
			if (Math.abs(bnv) <= C_CONTACTVEL) {
				isContact = true;
				hittime = 0;
			} else {   // estimate based on distance and speed along distance
				hittime = Math.max(0.0, -bnd / bnv);
			}
		} else {
			if (a < 1.0e-8) {
				return -1.0;
			}    // no hit - ball not moving relative to object

			const sol = solveQuadraticEq(a, 2.0 * b, bcddsq - pball.data.radius * pball.data.radius);
			if (!sol) {
				return -1.0;
			}
			const time1 = sol[0];
			const time2 = sol[1];

			hittime = (time1 * time2 < 0) ? Math.max(time1, time2) : Math.min(time1, time2); // find smallest nonnegative solution
		}

		if (!isFinite(hittime) || hittime < 0 || hittime > dtime) {
			return -1.0; // contact out of physics frame
		}

		const hitPos = pball.state.pos.clone().add(pball.state.vel.clone().multiplyScalar(hittime));
		coll.hitNormal = hitPos.clone().sub(this.p);
		coll.hitNormal.normalize();

		coll.isContact = isContact;
		if (isContact) {
			coll.hitOrgNormalVelocity = bnv;
		}

		coll.hitDistance = bnd;                    // actual contact distance
		//coll.m_hitRigid = true;

		return hittime;
	}

}
