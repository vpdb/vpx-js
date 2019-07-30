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
import { HitObject } from './hit-object';

export class HitTriangle extends HitObject {

	private readonly rgv: Vertex3D[];
	private readonly normal: Vertex3D;

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

	public collide(coll: CollisionEvent, player: Player): void {
		const pball = coll.ball;
		const hitnormal = coll.hitNormal!;

		const dot = -(hitnormal.dot(pball.state.vel));

		pball.hit.collide3DWall(this.normal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (this.obj && this.fe && dot >= this.threshold) {
			if (this.objType === CollisionType.Primitive) {
				this.obj.currentHitThreshold = dot;
				this.fireHitEvent(pball);

			} else if (this.objType === CollisionType.HitTarget /*FIXME && ((HitTarget*)m_obj)->m_d.m_isDropped == false*/) {
				//((HitTarget*)m_obj)->m_hitEvent = true;
				this.obj.currentHitThreshold = dot;
				this.fireHitEvent(pball);
			}
		}
	}

	public getType(): CollisionType {
		return CollisionType.Triangle;
	}

	public hitTest(pball: Ball, dtime: number, coll: CollisionEvent, player: Player): number {
		if (!this.isEnabled) {
			return -1.0;
		}

		const bnv = this.normal.dot(pball.state.vel);     // speed in Normal-vector direction

		if (bnv > C_CONTACTVEL) {						// return if clearly ball is receding from object
			return -1.0;
		}

		// Point on the ball that will hit the polygon, if it hits at all
		const hitPos = pball.state.pos.clone().sub(this.normal.multiplyScalar(pball.data.radius)); // nearest point on ball ... projected radius along norm

		const bnd = this.normal.dot(hitPos.clone().sub(this.rgv[0]));  // distance from plane to ball

		if (bnd < -pball.data.radius) {
			return -1.0;	// (ball normal distance) excessive pentratration of object skin ... no collision HACK
		}

		let isContact = false;
		let hittime: number;

		if (bnd <= PHYS_TOUCH) {
			if (Math.abs(bnv) <= C_CONTACTVEL) {
				hittime = 0;
				isContact = true;
			} else if (bnd <= 0) {
				hittime = 0;                            // zero time for rigid fast bodies
			} else {
				hittime = bnd / -bnv;
			}
		} else if (Math.abs(bnv) > C_LOWNORMVEL) {			// not velocity low?
			hittime = bnd / -bnv;						// rate ok for safe divide
		} else {
			return -1.0;								// wait for touching
		}

		if (!isFinite(hittime) || hittime < 0 || hittime > dtime) {
			return -1.0;	// time is outside this frame ... no collision
		}

		hitPos.add(pball.state.vel.clone().multiplyScalar(hittime));	// advance hit point to contact

		// check if hitPos is within the triangle

		// Compute vectors
		const v0 = this.rgv[2].clone().sub(this.rgv[0]);
		const v1 = this.rgv[1].clone().sub(this.rgv[0]);
		const v2 = hitPos.clone().sub(this.rgv[0]);

		// Compute dot products
		const dot00 = v0.dot(v0);
		const dot01 = v0.dot(v1);
		const dot02 = v0.dot(v2);
		const dot11 = v1.dot(v1);
		const dot12 = v1.dot(v2);

		// Compute barycentric coordinates
		const invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
		const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
		const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

		// Check if point is in triangle
		const pointInTri = (u >= 0) && (v >= 0) && (u + v <= 1);

		if (pointInTri) {
			coll.hitNormal = this.normal;

			coll.hitDistance = bnd;				// 3dhit actual contact distance ...
			//coll.m_hitRigid = true;				// collision type

			if (isContact) {
				coll.isContact = true;
				coll.hitOrgNormalVelocity = bnv;
			}
			return hittime;
		} else {
			return -1.0;
		}
	}

	public isDegenerate(): boolean {
		return this.normal.isZero();
	}
}
