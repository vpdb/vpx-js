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

import { Matrix2D } from '../math/matrix2d';
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { HitLineZ } from './hit-line-z';

export class HitLine3D extends HitLineZ {

	private readonly matrix: Matrix2D = new Matrix2D();
	private readonly zlow: number = 0;
	private readonly zhigh: number = 0;

	constructor(v1: Vertex3D, v2: Vertex3D) {
		super(new Vertex2D()); // correct xy is set later below
		const vLine = v2.clone().sub(v1);
		vLine.normalize();

		// Axis of rotation to make 3D cylinder a cylinder along the z-axis
		const transaxis = new Vertex3D(
			vLine.y,
			-vLine.x,
			0,
		);

		const l = transaxis.lengthSq();
		if (l <= 1e-6) {     // line already points in z axis?
			transaxis.set(1, 0, 0);            // choose arbitrary rotation vector
		} else {
			transaxis.divideScalar(Math.sqrt(l));
		}

		// Angle to rotate the line into the z-axis
		const dot = vLine.z; //vLine.Dot(&vup);

		this.matrix.rotationAroundAxis(transaxis, -Math.sqrt(1 - dot * dot), dot);

		const vtrans1 = v1.clone().applyMatrix2D(this.matrix);
		const vtrans2z = v2.clone().applyMatrix2D(this.matrix).z;

		// set up HitLineZ parameters
		this.xy = new Vertex2D(vtrans1.x, vtrans1.y);
		this.zlow = Math.min(vtrans1.z, vtrans2z);
		this.zhigh = Math.max(vtrans1.z, vtrans2z);

		this.hitBBox.left = Math.min(v1.x, v2.x);
		this.hitBBox.right = Math.max(v1.x, v2.x);
		this.hitBBox.top = Math.min(v1.y, v2.y);
		this.hitBBox.bottom = Math.max(v1.y, v2.y);
		this.hitBBox.zlow = Math.min(v1.z, v2.z);
		this.hitBBox.zhigh = Math.max(v1.z, v2.z);
	}

	public collide(coll: CollisionEvent): void {
		const pball = coll.ball;
		const hitnormal = coll.hitNormal!;

		const dot = -hitnormal.dot(pball.state.vel);
		pball.hit.collide3DWall(hitnormal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (this.obj && this.fe && dot >= this.threshold) {
			if (this.objType === CollisionType.Primitive) {
				this.obj.currentHitThreshold = dot;
				// FIXME event
				//FireHitEvent(pball);
			} else if (this.objType === CollisionType.HitTarget /*&& ((HitTarget*)m_obj)->m_d.m_isDropped == false*/) { // FIXME event
				//((HitTarget*)m_obj)->m_hitEvent = true;
				this.obj.currentHitThreshold = dot;
				// FIXME event
				//FireHitEvent(pball);
			}
		}
	}

	public hitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
		if (!this.isEnabled) {
			return -1.0;
		}

		// transform ball to cylinder coordinate system
		const oldPos = pball.state.pos.clone();
		const oldVel = pball.state.vel.clone();
		pball.state.pos.applyMatrix2D(this.matrix);
		pball.state.pos.applyMatrix2D(this.matrix);

		// and update z bounds of LineZ with transformed coordinates
		const oldz = new Vertex2D(this.hitBBox.zlow, this.hitBBox.zhigh);
		this.hitBBox.zlow = this.zlow;   // HACK; needed below // evil cast to non-const, should actually change the stupid HitLineZ to have explicit z coordinates!
		this.hitBBox.zhigh = this.zhigh; // dto.

		const hittime = super.hitTest(pball, dtime, coll);

		pball.state.pos.set(oldPos.x, oldPos.y, oldPos.z); // see above
		pball.state.vel.set(oldVel.x, oldVel.y, oldVel.z);
		this.hitBBox.zlow = oldz.x;   // HACK
		this.hitBBox.zhigh = oldz.y;  // dto.

		if (hittime >= 0) {      // transform hit normal back to world coordinate system
			coll.hitNormal = this.matrix.multiplyVectorT(coll.hitNormal!);
		}

		return hittime;
	}

}
