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
import { Player } from '../game/player';
import { FRect3D } from '../math/frect3d';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { HitKD } from './hit-kd';

export class HitKDNode {

	private hitOct: HitKD; //!! meh, stupid

	public rectBounds: FRect3D = new FRect3D();
	public start: number = 0;
	public items: number = 0; // contains the 2 bits for axis (bits 30/31)

	private children: HitKDNode[] = []; // if NULL, is a leaf; otherwise keeps the 2 children

	constructor(hitOct: HitKD) {
		this.hitOct = hitOct;
	}

	public reset(hitOct: HitKD) {
		this.children = [];
		this.hitOct = hitOct;
		this.start = 0;
		this.items = 0;
	}

	public hitTestBall(ball: Ball, coll: CollisionEvent, player: Player): CollisionEvent {

		const orgItems = this.items & 0x3FFFFFFF;
		const axis = this.items >> 30;

		for (let i = this.start; i < this.start + orgItems; i++) {
			const pho = this.hitOct.getItemAt(i);
			if (ball.hit !== pho && pho.hitBBox.intersectSphere(ball.state.pos, ball.hit.rcHitRadiusSqr)) {
				coll = pho.doHitTest(ball, coll, player);
			}
		}

		if (this.children && this.children.length) { // not a leaf
			if (axis === 0) {
				const vCenter = (this.rectBounds.left + this.rectBounds.right) * 0.5;
				if (ball.hit.hitBBox.left <= vCenter) {
					coll = this.children[0].hitTestBall(ball, coll, player);
				}
				if (ball.hit.hitBBox.right >= vCenter) {
					coll = this.children[1].hitTestBall(ball, coll, player);
				}

			} else if (axis === 1) {
				const vCenter = (this.rectBounds.top + this.rectBounds.bottom) * 0.5;
				if (ball.hit.hitBBox.top <= vCenter) {
					coll = this.children[0].hitTestBall(ball, coll, player);
				}
				if (ball.hit.hitBBox.bottom >= vCenter) {
					coll = this.children[1].hitTestBall(ball, coll, player);
				}

			} else {
				const vCenter = (this.rectBounds.zlow + this.rectBounds.zhigh) * 0.5;
				if (ball.hit.hitBBox.zlow <= vCenter) {
					coll = this.children[0].hitTestBall(ball, coll, player);
				}
				if (ball.hit.hitBBox.zhigh >= vCenter) {
					coll = this.children[1].hitTestBall(ball, coll, player);
				}
			}
		}
		return coll;
	}

	public createNextLevel(level: number, levelEmpty: number): void {
		const orgItems = (this.items & 0x3FFFFFFF);

		//!! magic
		if (orgItems <= 4 || level >= 128 / 2) {
			return;
		}

		const vDiag = new Vertex3D(
			this.rectBounds.right - this.rectBounds.left,
			this.rectBounds.bottom - this.rectBounds.top,
			this.rectBounds.zhigh - this.rectBounds.zlow,
		);

		let axis: number;
		if (vDiag.x > vDiag.y && vDiag.x > vDiag.z) {
			if (vDiag.x < 0.0001) { //!! magic
				return;
			}
			axis = 0;

		} else if (vDiag.y > vDiag.z) {
			if (vDiag.y < 0.0001) { //!!
				return;
			}
			axis = 1;

		} else {
			if (vDiag.z < 0.0001) { //!!
				return;
			}
			axis = 2;
		}

		//!! weight this with ratio of elements going to middle vs left&right! (avoids volume split that goes directly through object)

		// create children, calc bboxes
		this.children = this.hitOct.allocTwoNodes();
		if (this.children.length === 0) {
			// ran out of nodes - abort
			return;
		}
		this.children[0].rectBounds = this.rectBounds;
		this.children[1].rectBounds = this.rectBounds;

		const vCenter = new Vertex3D(
			(this.rectBounds.left + this.rectBounds.right) * 0.5,
			(this.rectBounds.top + this.rectBounds.bottom) * 0.5,
			(this.rectBounds.zlow + this.rectBounds.zhigh) * 0.5,
		);
		if (axis === 0) {
			this.children[0].rectBounds.right = vCenter.x;
			this.children[1].rectBounds.left = vCenter.x;

		} else if (axis === 1) {
			this.children[0].rectBounds.bottom = vCenter.y;
			this.children[1].rectBounds.top = vCenter.y;

		} else {
			this.children[0].rectBounds.zhigh = vCenter.z;
			this.children[1].rectBounds.zlow = vCenter.z;
		}

		this.children[0].hitOct = this.hitOct; //!! meh
		this.children[0].items = 0;
		this.children[0].children = [];
		this.children[1].hitOct = this.hitOct; //!! meh
		this.children[1].items = 0;
		this.children[1].children = [];

		// determine amount of items that cross splitplane, or are passed on to the children
		if (axis === 0) {
			for (let i = this.start; i < this.start + orgItems; ++i) {
				const pho = this.hitOct.getItemAt(i);

				if (pho.hitBBox.right < vCenter.x) {
					this.children[0].items++;

				} else if (pho.hitBBox.left > vCenter.x) {
					this.children[1].items++;
				}
			}

		} else if (axis === 1) {
			for (let i = this.start; i < this.start + orgItems; ++i) {
				const pho = this.hitOct.getItemAt(i);

				if (pho.hitBBox.bottom < vCenter.y) {
					this.children[0].items++;

				} else if (pho.hitBBox.top > vCenter.y) {
					this.children[1].items++;
				}
			}

		} else { // axis == 2
			for (let i = this.start; i < this.start + orgItems; ++i) {
				const pho = this.hitOct.getItemAt(i);

				if (pho.hitBBox.zhigh < vCenter.z) {
					this.children[0].items++;

				} else if (pho.hitBBox.zlow > vCenter.z) {
					this.children[1].items++;
				}
			}
		}

		// check if at least two nodes feature objects, otherwise don't bother subdividing further
		let countEmpty = 0;
		if (this.children[0].items === 0) {
			countEmpty = 1;
		}
		if (this.children[1].items === 0) {
			++countEmpty;
		}
		if (orgItems - this.children[0].items - this.children[1].items === 0) {
			++countEmpty;
		}

		if (countEmpty >= 2) {
			++levelEmpty;

		} else {
			levelEmpty = 0;
		}

		if (levelEmpty > 8) {// If 8 levels were all just subdividing the same objects without luck, exit & Free the nodes again (but at least empty space was cut off)
			this.hitOct.numNodes -= 2;
			this.children = [];
			return;
		}

		this.children[0].start = this.start + orgItems - this.children[0].items - this.children[1].items;
		this.children[1].start = this.children[0].start + this.children[0].items;

		let items = 0;
		this.children[0].items = 0;
		this.children[1].items = 0;

		// sort items that cross splitplane in-place, the others are sorted into a temporary
		if (axis === 0) {
			for (let i = this.start; i < this.start + orgItems; ++i) {
				const pho = this.hitOct.getItemAt(i);

				if (pho.hitBBox.right < vCenter.x) {
					this.hitOct.tmp[this.children[0].start + (this.children[0].items++)] = this.hitOct.orgIdx[i];
				} else if (pho.hitBBox.left > vCenter.x) {
					this.hitOct.tmp[this.children[1].start + (this.children[1].items++)] = this.hitOct.orgIdx[i];
				} else {
					this.hitOct.orgIdx[this.start + (items++)] = this.hitOct.orgIdx[i];
				}
			}
		} else if (axis === 1) {
			for (let i = this.start; i < this.start + orgItems; ++i) {
				const pho = this.hitOct.getItemAt(i);

				if (pho.hitBBox.bottom < vCenter.y) {
					this.hitOct.tmp[this.children[0].start + (this.children[0].items++)] = this.hitOct.orgIdx[i];
				} else if (pho.hitBBox.top > vCenter.y) {
					this.hitOct.tmp[this.children[1].start + (this.children[1].items++)] = this.hitOct.orgIdx[i];
				} else {
					this.hitOct.orgIdx[this.start + (items++)] = this.hitOct.orgIdx[i];
				}
			}

		} else { // axis == 2
			for (let i = this.start; i < this.start + orgItems; ++i) {
				const pho = this.hitOct.getItemAt(i);

				if (pho.hitBBox.zhigh < vCenter.z) {
					this.hitOct.tmp[this.children[0].start + (this.children[0].items++)] = this.hitOct.orgIdx[i];
				} else if (pho.hitBBox.zlow > vCenter.z) {
					this.hitOct.tmp[this.children[1].start + (this.children[1].items++)] = this.hitOct.orgIdx[i];
				} else {
					this.hitOct.orgIdx[this.start + (items++)] = this.hitOct.orgIdx[i];
				}
			}
		}
		// The following assertions hold after this step:
		//assert( this.start + items == this.children[0].this.start );
		//assert( this.children[0].this.start + this.children[0].this.items == this.children[1].this.start );
		//assert( this.children[1].this.start + this.children[1].this.items == this.start + org_items );
		//assert( this.start + org_items <= this.hitOct->tmp.size() );

		this.items = items | (axis << 30);

		// copy temporary back //!! could omit this by doing everything inplace
		for (let i = 0; i < this.children[0].items; i++) {
			this.hitOct.orgIdx[this.children[0].start + i] = this.hitOct.tmp[this.children[0].start + i];
		}
		for (let i = 0; i < this.children[1].items; i++) {
			this.hitOct.orgIdx[this.children[1].start + i] = this.hitOct.tmp[this.children[1].start + i];
		}
		//memcpy(&this.hitOct->m_org_idx[this.children[0].start], &this.hitOct->tmp[this.children[0].start], this.children[0].items*sizeof(unsigned int));
		//memcpy(&this.hitOct->m_org_idx[this.children[1].start], &this.hitOct->tmp[this.children[1].start], this.children[1].this.items*sizeof(unsigned int));

		this.children[0].createNextLevel(level + 1, levelEmpty);
		this.children[1].createNextLevel(level + 1, levelEmpty);
	}

	// public hitTestXRay(ball: Ball, vhoHit: Array<HitObject<FireEvents>>, coll: CollisionEvent, player: Player): void {
	// 	const orgItems = this.items & 0x3FFFFFFF;
	// 	const axis = this.items >> 30;
	//
	// 	for (let i = this.start; i < this.start + orgItems; i++) {
	// 		const pho = this.hitOct.getItemAt(i);
	// 		if ((ball.hit !== pho) && pho.hitBBox.intersectSphere(ball.state.pos, ball.hit.rcHitRadiusSqr)) {
	// 			const newTime = pho.hitTest(ball, coll.hitTime, coll, player);
	// 			if (newTime >= 0) {
	// 				vhoHit.push(pho);
	// 			}
	// 		}
	// 	}
	//
	// 	if (this.children && this.children.length) {// not a leaf
	// 		if (axis === 0) {
	// 			const vCenter = (this.rectBounds.left + this.rectBounds.right) * 0.5;
	// 			if (ball.hit.hitBBox.left <= vCenter) {
	// 				this.children[0].hitTestXRay(ball, vhoHit, coll, player);
	// 			}
	// 			if (ball.hit.hitBBox.right >= vCenter) {
	// 				this.children[1].hitTestXRay(ball, vhoHit, coll, player);
	// 			}
	//
	// 		} else if (axis === 1) {
	// 			const vCenter = (this.rectBounds.top + this.rectBounds.bottom) * 0.5;
	// 			if (ball.hit.hitBBox.top <= vCenter) {
	// 				this.children[0].hitTestXRay(ball, vhoHit, coll, player);
	// 			}
	// 			if (ball.hit.hitBBox.bottom >= vCenter) {
	// 				this.children[1].hitTestXRay(ball, vhoHit, coll, player);
	// 			}
	//
	// 		} else {
	// 			const vCenter = (this.rectBounds.zlow + this.rectBounds.zhigh) * 0.5;
	// 			if (ball.hit.hitBBox.zlow <= vCenter) {
	// 				this.children[0].hitTestXRay(ball, vhoHit, coll, player);
	// 			}
	// 			if (ball.hit.hitBBox.zhigh >= vCenter) {
	// 				this.children[1].hitTestXRay(ball, vhoHit, coll, player);
	// 			}
	// 		}
	// 	}
	// }

}
