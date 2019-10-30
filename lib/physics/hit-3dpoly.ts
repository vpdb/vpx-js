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

/* tslint:disable:no-bitwise */
import { Event } from '../game/event';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { C_CONTACTVEL, C_LOWNORMVEL, PHYS_TOUCH, STATICTIME } from './constants';
import { HitObject } from './hit-object';

export class Hit3DPoly extends HitObject {
	private readonly rgv: Vertex3D[];
	private readonly normal: Vertex3D = new Vertex3D();

	constructor(rgv: Vertex3D[], objType?: CollisionType) {
		super();

		this.rgv = rgv;
		if (objType) {
			this.objType = objType;
		}

		// Newell's method for normal computation
		for (let i = 0; i < this.rgv.length; ++i) {
			const m = i < this.rgv.length - 1 ? i + 1 : 0;
			this.normal.x += (this.rgv[i].y - this.rgv[m].y) * (this.rgv[i].z + this.rgv[m].z);
			this.normal.y += (this.rgv[i].z - this.rgv[m].z) * (this.rgv[i].x + this.rgv[m].x);
			this.normal.z += (this.rgv[i].x - this.rgv[m].x) * (this.rgv[i].y + this.rgv[m].y);
		}

		const sqrLen = this.normal.x * this.normal.x + this.normal.y * this.normal.y + this.normal.z * this.normal.z;
		const invLen = sqrLen > 0.0 ? -1.0 / Math.sqrt(sqrLen) : 0.0; // NOTE: normal is flipped! Thus we need vertices in CCW order
		this.normal.x *= invLen;
		this.normal.y *= invLen;
		this.normal.z *= invLen;

		this.elasticity = 0.3;
		this.setFriction(0.3);
		this.scatter = 0;
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
		const ball = coll.ball;
		const hitNormal = coll.hitNormal;

		/* istanbul ignore else: This seems dead code to me. The actual trigger logic is handled in TriggerHitCircle and TriggerHitLine. */
		if (this.objType !== CollisionType.Trigger) {
			const dot = -hitNormal.dot(ball.hit.vel);
			ball.hit.collide3DWall(this.normal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

			// manage item-specific logic
			if (this.obj && this.fe && dot >= this.threshold && this.obj.onCollision) {
				this.obj.onCollision(this, ball, dot);
			}
		} else {
			// trigger (probably unused code)
			if (!ball.hit.isRealBall()) {
				return;
			}
			const i = ball.hit.vpVolObjs.indexOf(this.obj!); // if -1 then not in objects volume set (i.e not already hit)
			if (!coll.hitFlag === i < 0) {
				// Hit == NotAlreadyHit
				const addPos = ball.hit.vel.clone(true).multiplyScalar(STATICTIME);
				ball.state.pos.add(addPos); // move ball slightly forward
				Vertex3D.release(addPos);
				if (i < 0) {
					ball.hit.vpVolObjs.push(this.obj!);
					this.obj!.fireGroupEvent(Event.HitEventsHit);
				} else {
					ball.hit.vpVolObjs.splice(i, 1);
					this.obj!.fireGroupEvent(Event.HitEventsUnhit);
				}
			}
		}
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): number {
		if (!this.isEnabled) {
			return -1.0;
		}

		const bnv = this.normal.dot(ball.hit.vel); // speed in Normal-vector direction

		if (this.objType !== CollisionType.Trigger && bnv > C_LOWNORMVEL) {
			// return if clearly ball is receding from object
			return -1.0;
		}

		// Point on the ball that will hit the polygon, if it hits at all
		const normRadius = this.normal.clone(true).multiplyScalar(ball.data.radius);
		const hitPos = ball.state.pos.clone(true).sub(normRadius); // nearest point on ball ... projected radius along norm
		const planeToBall = hitPos.clone(true).sub(this.rgv[0]);
		const bnd = this.normal.dot(planeToBall); // distance from plane to ball
		Vertex3D.release(normRadius, planeToBall);

		let bUnHit = bnv > C_LOWNORMVEL;
		const inside = bnd <= 0; // in ball inside object volume
		const rigid = this.objType !== CollisionType.Trigger;
		let hitTime: number;

		if (rigid) {
			// rigid polygon
			if (bnd < -ball.data.radius) {
				// (ball normal distance) excessive penetration of object skin ... no collision HACK //!! *2 necessary?
				Vertex3D.release(hitPos);
				return -1.0;
			}

			if (bnd <= PHYS_TOUCH) {
				if (
					inside ||
					Math.abs(bnv) > C_CONTACTVEL || // fast velocity, return zero time
					//zero time for rigid fast bodies
					bnd <= -PHYS_TOUCH
				) {
					// slow moving but embedded
					hitTime = 0;
				} else {
					hitTime = bnd * (1.0 / (2.0 * PHYS_TOUCH)) + 0.5; // don't compete for fast zero time events
				}
			} else if (Math.abs(bnv) > C_LOWNORMVEL) {
				// not velocity low?
				hitTime = bnd / -bnv; // rate ok for safe divide
			} else {
				Vertex3D.release(hitPos);
				return -1.0; // wait for touching
			}
		} else {
			// non-rigid polygon
			if (bnv * bnd >= 0) {
				// outside-receding || inside-approaching
				if (
					!ball.hit.isRealBall() || // temporary ball
					Math.abs(bnd) >= ball.data.radius * 0.5 || // not too close ... nor too far away
					inside !== ball.hit.vpVolObjs.indexOf(this.obj!) < 0
				) {
					// ...ball outside and hit set or ball inside and no hit set
					Vertex3D.release(hitPos);
					return -1.0;
				}
				hitTime = 0;
				bUnHit = !inside; // ball on outside is UnHit, otherwise it's a Hit
			} else {
				hitTime = bnd / -bnv;
			}
		}

		if (!isFinite(hitTime) || hitTime < 0 || hitTime > dTime) {
			// time is outside this frame ... no collision
			Vertex3D.release(hitPos);
			return -1.0;
		}

		const adv = ball.hit.vel.clone(true).multiplyScalar(hitTime);
		hitPos.add(adv); // advance hit point to contact
		Vertex3D.release(adv);

		// Do a point in poly test, using the xy plane, to see if the hit point is inside the polygon
		// this need to be changed to a point in polygon on 3D plane
		let x2 = this.rgv[0].x;
		let y2 = this.rgv[0].y;
		let hx2 = hitPos.x >= x2;
		let hy2 = hitPos.y <= y2;
		let crossCount = 0; // count of lines which the hit point is to the left of
		for (let i = 0; i < this.rgv.length; i++) {
			const x1 = x2;
			const y1 = y2;
			const hx1 = hx2;
			const hy1 = hy2;

			const j = i < this.rgv.length - 1 ? i + 1 : 0;
			x2 = this.rgv[j].x;
			y2 = this.rgv[j].y;
			hx2 = hitPos.x >= x2;
			hy2 = hitPos.y <= y2;

			if (y1 === y2 || (hy1 && hy2) || (!hy1 && !hy2) || (hx1 && hx2)) {
				// Hit point is on the right of the line
				continue;
			}

			if (!hx1 && !hx2) {
				crossCount ^= 1;
				continue;
			}

			if (x2 === x1) {
				if (!hx2) {
					crossCount ^= 1;
				}
				continue;
			}

			// Now the hard part - the hit point is in the line bounding box
			if (x2 - ((y2 - hitPos.y) * (x1 - x2)) / (y1 - y2) > hitPos.x) {
				crossCount ^= 1;
			}
		}
		Vertex3D.release(hitPos);

		if (crossCount & 1) {
			coll.hitNormal.set(this.normal);

			if (!rigid) {
				// non rigid body collision? return direction
				coll.hitFlag = bUnHit; // UnHit signal is receding from outside target
			}

			coll.hitDistance = bnd; // 3dhit actual contact distance ...
			//coll.m_hitRigid = rigid;                                         // collision type

			return hitTime;
		}

		return -1.0;
	}
}
