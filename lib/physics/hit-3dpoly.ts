/* tslint:disable:no-bitwise */
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
import { CollisionType } from './collision-type';
import { C_CONTACTVEL, C_LOWNORMVEL, PHYS_TOUCH, STATICTIME } from './constants';
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

	public hitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
		if (!this.isEnabled) {
			return -1.0;
		}

		const bnv = this.normal.dot(pball.state.vel);  //speed in Normal-vector direction

		if ((this.objType !== CollisionType.Trigger) && (bnv > C_LOWNORMVEL)) { // return if clearly ball is receding from object
			return -1.0;
		}

		// Point on the ball that will hit the polygon, if it hits at all
		const hitPos = pball.state.pos.clone().sub(this.normal.clone().multiplyScalar(pball.data.radius)); // nearest point on ball ... projected radius along norm

		const bnd = this.normal.dot(hitPos.clone().sub(this.rgv[0])); // distance from plane to ball

		let bUnHit = bnv > C_LOWNORMVEL;
		const inside = bnd <= 0;                // in ball inside object volume

		const rigid = (this.objType !== CollisionType.Trigger);
		let hittime: number;

		if (rigid) { //rigid polygon

			if (bnd < -pball.data.radius) { // (ball normal distance) excessive penetration of object skin ... no collision HACK //!! *2 necessary?
				return -1.0;
			}

			if (bnd <= PHYS_TOUCH) {
				if (inside || (Math.abs(bnv) > C_CONTACTVEL) // fast velocity, return zero time
					//zero time for rigid fast bodies
					|| (bnd <= (-PHYS_TOUCH))) {   // slow moving but embedded
					hittime = 0;

				} else {
					hittime = bnd * (1.0 / (2.0 * PHYS_TOUCH)) + 0.5;	// don't compete for fast zero time events
				}

			} else if (Math.abs(bnv) > C_LOWNORMVEL) {           // not velocity low?
				hittime = bnd / -bnv;                     // rate ok for safe divide

			} else {
				return -1.0;                             // wait for touching
			}

		} else { //non-rigid polygon
			if (bnv * bnd >= 0) {                        // outside-receding || inside-approaching
				if (!pball.getHitObject().vpVolObjs.length                 // temporary ball
					|| Math.abs(bnd) >= pball.data.radius * 0.5 // not too close ... nor too far away
					|| inside !== pball.getHitObject().vpVolObjs.indexOf(this.obj!) < 0) { // ...ball outside and hit set or ball inside and no hit set
					return -1.0;
				}

				hittime = 0;
				bUnHit = !inside;	// ball on outside is UnHit, otherwise it's a Hit
			} else {
				hittime = bnd / (-bnv);
			}
		}

		if (!isFinite(hittime) || hittime < 0 || hittime > dtime) { // time is outside this frame ... no collision
			return -1.0;
		}

		hitPos.add(pball.state.vel.clone().multiplyScalar(hittime));     // advance hit point to contact

		// Do a point in poly test, using the xy plane, to see if the hit point is inside the polygon
		// this need to be changed to a point in polygon on 3D plane

		let x2 = this.rgv[0].x;
		let y2 = this.rgv[0].y;
		let hx2 = (hitPos.x >= x2);
		let hy2 = (hitPos.y <= y2);
		let crosscount = 0;	// count of lines which the hit point is to the left of
		for (let i = 0; i < this.rgv.length; i++) {
			const x1 = x2;
			const y1 = y2;
			const hx1 = hx2;
			const hy1 = hy2;

			const j = (i < this.rgv.length - 1) ? (i + 1) : 0;
			x2 = this.rgv[j].x;
			y2 = this.rgv[j].y;
			hx2 = (hitPos.x >= x2);
			hy2 = (hitPos.y <= y2);

			if ((y1 === y2) || (hy1 && hy2) || (!hy1 && !hy2) || (hx1 && hx2)) { // Hit point is on the right of the line
				continue;
			}

			if (!hx1 && !hx2) {
				crosscount ^= 1;
				continue;
			}

			if (x2 === x1) {
				if (!hx2) {
					crosscount ^= 1;
				}
				continue;
			}

			// Now the hard part - the hit point is in the line bounding box
			if (x2 - (y2 - hitPos.y) * (x1 - x2) / (y1 - y2) > hitPos.x) {
				crosscount ^= 1;
			}
		}

		if (crosscount & 1) {
			coll.hitNormal = this.normal;

			if (!rigid) {                // non rigid body collision? return direction
				coll.hitFlag = bUnHit; // UnHit signal	is receding from outside target
			}

			coll.hitDistance = bnd;   // 3dhit actual contact distance ...
			//coll.m_hitRigid = rigid;  // collision type

			return hittime;
		}
		return -1.0;
	}

	public getType(): CollisionType {
		return CollisionType.Poly;
	}

}
