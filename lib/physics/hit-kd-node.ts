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

import { FRect3D } from '../math/frect3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { HitKD } from './hit-kd';
import { HitObject } from './hit-object';

export class HitKDNode {

	private m_hitoct: HitKD; //!! meh, stupid

	public m_rectbounds: FRect3D;
	public m_start: number;
	public m_items: number; // contains the 2 bits for axis (bits 30/31)

	private m_children: HitKDNode[]; // if NULL, is a leaf; otherwise keeps the 2 children

	constructor(hitOct: HitKD) {
		this.m_hitoct = hitOct;
	}

	public reset(hitOct: HitKD) {
		this.m_children = [];
		this.m_hitoct = hitOct;
		this.m_start = 0;
		this.m_items = 0;
	}

	private hitTestBall(pball: Ball, coll: CollisionEvent): void {

		const org_items = this.m_items & 0x3FFFFFFF;
		const axis = this.m_items >> 30;

		for (let i = this.m_start; i < this.m_start + org_items; i++) {
			const pho = this.m_hitoct.getItemAt(i);
			if (pball !== pho && pho.hitBBox.intersect3D(pball.state.pos, pball.getHitObject().rcHitRadiusSqr)) {
				pho.doHitTest(pball, coll);
			}
		}

		if (this.m_children. && this.m_children.length) { // not a leaf
			if (axis === 0) {
				const vcenter = (this.m_rectbounds.left + this.m_rectbounds.right) * 0.5;
				if (pball.getHitObject().hitBBox.left <= vcenter) {
					this.m_children[0].hitTestBall(pball, coll);
				}
				if (pball.getHitObject().hitBBox.right >= vcenter) {
					this.m_children[1].hitTestBall(pball, coll);
				}

			} else if (axis === 1) {
				const vcenter = (this.m_rectbounds.top + this.m_rectbounds.bottom) * 0.5;
				if (pball.getHitObject().hitBBox.top <= vcenter) {
					this.m_children[0].hitTestBall(pball, coll);
				}
				if (pball.getHitObject().hitBBox.bottom >= vcenter) {
					this.m_children[1].hitTestBall(pball, coll);
				}

			} else {
				const vcenter = (this.m_rectbounds.zlow + this.m_rectbounds.zhigh) * 0.5;
				if (pball.getHitObject().hitBBox.zlow <= vcenter) {
					this.m_children[0].hitTestBall(pball, coll);
				}
				if (pball.getHitObject().hitBBox.zhigh >= vcenter) {
					this.m_children[1].hitTestBall(pball, coll);
				}
			}
		}
	}

	public hitTestXRay(pball: Ball, pvhoHit: HitObject[], coll: CollisionEvent): void {

	}

	public createNextLevel(level: number, level_empty: number): void {

	}
}
