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
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { C_CONTACTVEL, C_LOWNORMVEL, PHYS_TOUCH } from './constants';
import { HitObject, HitTestResult } from './hit-object';

export class HitTriangle extends HitObject {

	public readonly rgv: Vertex3D[];
	public readonly normal: Vertex3D;

	constructor(rgv: Vertex3D[]) {
		super();
		this.rgv = rgv;
		/* NB: due to the swapping of the order of e0 and e1,
		 * the vertices must be passed in counterclockwise order
		 * (but rendering uses clockwise order!)
		 */
		const e0 = this.rgv[2].clone().sub(this.rgv[0]);
		const e1 = this.rgv[1].clone().sub(this.rgv[0]);
		this.normal = Vertex3D.crossProduct(e0, e1);
		this.normal.normalizeSafe();

		this.elasticity = 0.3;
		this.setFriction(0.3);
		this.scatter = 0;
	}

	public calcHitBBox(): void {
		this.hitBBox.left = Math.min(this.rgv[0].x, Math.min(this.rgv[1].x, this.rgv[2].x));
		this.hitBBox.right = Math.max(this.rgv[0].x, Math.max(this.rgv[1].x, this.rgv[2].x));
		this.hitBBox.top = Math.min(this.rgv[0].y, Math.min(this.rgv[1].y, this.rgv[2].y));
		this.hitBBox.bottom = Math.max(this.rgv[0].y, Math.max(this.rgv[1].y, this.rgv[2].y));
		this.hitBBox.zlow = Math.min(this.rgv[0].z, Math.min(this.rgv[1].z, this.rgv[2].z));
		this.hitBBox.zhigh = Math.max(this.rgv[0].z, Math.max(this.rgv[1].z, this.rgv[2].z));
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent, player: Player): HitTestResult {
		if (!this.isEnabled) {
			return { hitTime: -1.0, coll };
		}

		const bnv = this.normal.dot(ball.hit.vel);         // speed in Normal-vector direction
		if (bnv > C_CONTACTVEL) {                          // return if clearly ball is receding from object
			return { hitTime: -1.0, coll };
		}

		// Point on the ball that will hit the polygon, if it hits at all
		const hitPos = ball.state.pos.clone().sub(this.normal.clone().multiplyScalar(ball.data.radius)); // nearest point on ball ... projected radius along norm
		const bnd = this.normal.dot(hitPos.clone().sub(this.rgv[0]));          // distance from plane to ball

		if (bnd < -ball.data.radius) {
			// (ball normal distance) excessive penetration of object skin ... no collision HACK
			return { hitTime: -1.0, coll };
		}

		let isContact = false;
		let hitTime: number;

		if (bnd <= PHYS_TOUCH) {
			if (Math.abs(bnv) <= C_CONTACTVEL) {
				hitTime = 0;
				isContact = true;

			} else if (bnd <= 0) {
				hitTime = 0;                               // zero time for rigid fast bodies

			} else {
				hitTime = bnd / -bnv;
			}

		} else if (Math.abs(bnv) > C_LOWNORMVEL) {         // not velocity low?
			hitTime = bnd / -bnv;                          // rate ok for safe divide

		} else {
			return { hitTime: -1.0, coll };                // wait for touching
		}

		if (!isFinite(hitTime) || hitTime < 0 || hitTime > dTime) {
			return { hitTime: -1.0, coll };                // time is outside this frame ... no collision
		}

		// advance hit point to contact
		hitPos.add(ball.hit.vel.clone().multiplyScalar(hitTime));

		// Check if hitPos is within the triangle
		// 1. Compute vectors
		const v0 = this.rgv[2].clone().sub(this.rgv[0]);
		const v1 = this.rgv[1].clone().sub(this.rgv[0]);
		const v2 = hitPos.clone().sub(this.rgv[0]);

		// 2. Compute dot products
		const dot00 = v0.dot(v0);
		const dot01 = v0.dot(v1);
		const dot02 = v0.dot(v2);
		const dot11 = v1.dot(v1);
		const dot12 = v1.dot(v2);

		// 3. Compute barycentric coordinates
		const invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
		const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
		const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

		// 4. Check if point is in triangle
		const pointInTriangle = (u >= 0) && (v >= 0) && (u + v <= 1);

		if (pointInTriangle) {
			coll.hitNormal = this.normal;
			coll.hitDistance = bnd;                        // 3dhit actual contact distance ...
			//coll.m_hitRigid = true;                      // collision type

			if (isContact) {
				coll.isContact = true;
				coll.hitOrgNormalVelocity = bnv;
			}
			return { hitTime, coll };

		} else {
			return { hitTime: -1.0, coll };
		}
	}

	public collide(coll: CollisionEvent, player: Player): void {
		const ball = coll.ball;
		const hitNormal = coll.hitNormal!;
		const dot = -(hitNormal.dot(ball.hit.vel));

		ball.hit.collide3DWall(this.normal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (this.obj && this.fe && dot >= this.threshold) {
			if (this.objType === CollisionType.Primitive) {
				this.obj.currentHitThreshold = dot;
				this.fireHitEvent(ball);

			} else if (this.objType === CollisionType.HitTarget /*FIXME && ((HitTarget*)m_obj)->m_d.m_isDropped == false*/) {
				// fixme hittarget
				//((HitTarget*)m_obj)->m_hitEvent = true;
				this.obj.currentHitThreshold = dot;
				this.fireHitEvent(ball);
			}
		}
	}

	public isDegenerate(): boolean {
		return this.normal.isZero();
	}
}
