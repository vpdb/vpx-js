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
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { STATICTIME } from './constants';
import { HitObject } from './hit-object';

export class Hit3DPoly extends HitObject {

	private readonly rgv: Vertex3D[];
	private readonly normal: Vertex3D;

	constructor(rgv: Vertex3D[]) {
		super();

		this.rgv = rgv;
		this.normal = new Vertex3D();

		// Newell's method for normal computation
		for (let i = 0; i < this.rgv.length; ++i) {
			const m = (i < this.rgv.length - 1) ? (i + 1) : 0;
			this.normal.x += (this.rgv[i].y - this.rgv[m].y) * (this.rgv[i].z + this.rgv[m].z);
			this.normal.y += (this.rgv[i].z - this.rgv[m].z) * (this.rgv[i].x + this.rgv[m].x);
			this.normal.z += (this.rgv[i].x - this.rgv[m].x) * (this.rgv[i].y + this.rgv[m].y);
		}

		const sqrLen = this.normal.x * this.normal.x + this.normal.y * this.normal.y + this.normal.z * this.normal.z;
		const invLen = (sqrLen > 0.0) ? - 1.0 / Math.sqrt(sqrLen) : 0.0;   // NOTE: normal is flipped! Thus we need vertices in CCW order
		this.normal.x *= invLen;
		this.normal.y *= invLen;
		this.normal.z *= invLen;

		this.elasticity = 0.3;
		this.setFriction(0.3);
		this.scatter = 0.;
	}

	public calcHitBBox(): void {
		this.hitBBox.left = this.rgv[0].x;
		this.hitBBox.right = this.rgv[0].x;
		this.hitBBox.top = this.rgv[0].y;
		this.hitBBox.bottom = this.rgv[0].y;
		this.hitBBox.zlow = this.rgv[0].z;
		this.hitBBox.zhigh = this.rgv[0].z;

		for (let i = 1; i < this.rgv.length; i++) {
			this.hitBBox.left = Math.min(this.rgv[i].x, this.hitBBox.left);
			this.hitBBox.right = Math.max(this.rgv[i].x, this.hitBBox.right);
			this.hitBBox.top = Math.min(this.rgv[i].y, this.hitBBox.top);
			this.hitBBox.bottom = Math.max(this.rgv[i].y, this.hitBBox.bottom);
			this.hitBBox.zlow = Math.min(this.rgv[i].z, this.hitBBox.zlow);
			this.hitBBox.zhigh = Math.max(this.rgv[i].z, this.hitBBox.zhigh);
		}
	}

	public collide(coll: CollisionEvent): void {
		const pball = coll.ball;
		const hitnormal = coll.hitNormal!;

		if (this.objType !== CollisionType.Trigger) {
			const dot = -(hitnormal.dot(pball.state.vel));

			pball.getHitObject().collide3DWall(this.normal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

			if (this.obj && this.fe && dot >= this.threshold) {
				if (this.objType === CollisionType.Primitive) {
					this.obj.currentHitThreshold = dot;
					this.fireHitEvent(pball);

				} else if (this.objType === CollisionType.HitTarget /*&& ((HitTarget*)m_obj)->m_d.m_isDropped == false*/) { // fixme HitTarget.isDropped
					// fixme
					// ((HitTarget*)m_obj)->m_hitEvent = true;
					this.obj.currentHitThreshold = dot;
					this.fireHitEvent(pball);
				}
			}
		} else { // trigger:

			if (pball.getHitObject().vpVolObjs.length === 0) {
				return;
			}

			const i = pball.getHitObject().vpVolObjs.indexOf(this.obj!); // if -1 then not in objects volume set (i.e not already hit)

			if ((!coll.hitFlag) === (i < 0)) { // Hit == NotAlreadyHit

				pball.state.pos.add(pball.state.vel.clone().multiplyScalar(STATICTIME));      //move ball slightly forward

				if (i < 0) {
					pball.getHitObject().vpVolObjs.push(this.obj!);
					// fixme ((Trigger*)m_obj)->FireGroupEvent(DISPID_HitEvents_Hit);
				} else {
					pball.getHitObject().vpVolObjs.splice(i, 1);
					// fixme ((Trigger*)m_obj)->FireGroupEvent(DISPID_HitEvents_Unhit);
				}
			}
		}
	}

	public getType(): CollisionType {
		return CollisionType.Poly;
	}

}
