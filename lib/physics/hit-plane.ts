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

import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { C_CONTACTVEL, PHYS_TOUCH } from './constants';
import { HitObject } from './hit-object';

export class HitPlane extends HitObject {

	private readonly normal: Vertex3D;
	private readonly d: number;

	constructor(normal: Vertex3D, d: number) {
		super();
		this.normal = normal;
		this.d = d;
	}

	public calcHitBBox(): void {
		// plane's not a box (i assume)
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): number {
		if (!this.isEnabled) {
			return -1.0;
		}

		const bnv = this.normal.dot(ball.hit.vel);         // speed in normal direction

		if (bnv > C_CONTACTVEL) {                          // return if clearly ball is receding from object
			return -1.0;
		}

		const bnd = this.normal.dot(ball.state.pos) - ball.data.radius - this.d; // distance from plane to ball surface

		//!! solely responsible for ball through playfield?? check other places, too (radius*2??)
		if (bnd < ball.data.radius * -2.0) {
			// excessive penetration of plane ... no collision HACK
			return -1.0;
		}

		let hitTime: number;
		if (Math.abs(bnv) <= C_CONTACTVEL) {
			if (Math.abs(bnd) <= PHYS_TOUCH) {
				coll.isContact = true;
				coll.hitNormal = this.normal;
				coll.hitOrgNormalVelocity = bnv;           // remember original normal velocity
				coll.hitDistance = bnd;
				return 0.0;                                // hit time is ignored for contacts
			} else {
				return -1.0;                               // large distance, small velocity -> no hit
			}
		}

		hitTime = bnd / (-bnv);                            // rate ok for safe divide
		if (hitTime < 0) {
			hitTime = 0.0;                                 // already penetrating? then collide immediately
		}

		if (!isFinite(hitTime) || hitTime < 0 || hitTime > dTime) {
			// time is outside this frame ... no collision
			return -1.0;
		}

		coll.hitNormal = this.normal;
		coll.hitDistance = bnd;                            // actual contact distance

		return hitTime;
	}

	public collide(coll: CollisionEvent): void {
		coll.ball.hit.collide3DWall(coll.hitNormal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		// distance from plane to ball surface
		const bnd = this.normal.dot(coll.ball.state.pos) - coll.ball.data.radius - this.d;
		if (bnd < 0) {
			// if ball has penetrated, push it out of the plane
			const v = this.normal.clone(true).multiplyScalar(bnd);
			coll.ball.state.pos.add(v);
			Vertex3D.release(v);
		}
	}
}
