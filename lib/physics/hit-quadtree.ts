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
import { Player } from '../game/player';
import { FRect3D } from '../math/frect3d';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { PrimitiveItem } from '../vpt/primitive-item';
import { CollisionEvent } from './collision-event';
import { HitObject } from './hit-object';

export class HitQuadtree {

	private unique?: PrimitiveItem; // everything below/including this node shares the same original primitive object (just for early outs if not collidable)

	private vho: HitObject[] = [];
	private children: HitQuadtree[] = [];
	private vCenter: Vertex3D = new Vertex3D();
	private isLeaf: boolean = true;

	public addElement(pho: HitObject): void {
		this.vho.push(pho);
	}

	public initialize(bounds?: FRect3D): void {

		if (!bounds) {
			bounds = new FRect3D();
			for (const vho of this.vho) {
				bounds.extend(vho.hitBBox);
			}
		}
		this.createNextLevel(bounds, 0, 0);
	}

	public hitTestBall(pball: Ball, coll: CollisionEvent, player: Player): void {
		for (const vho of this.vho) {
			if ((pball.getHitObject() !== vho)
				&& pball.getHitObject().hitBBox.intersectRect(vho.hitBBox)
				&& vho.hitBBox.intersectSphere(pball.state.pos, pball.getHitObject().rcHitRadiusSqr)) {
				vho.doHitTest(pball, coll, player);
			}
		}

		if (!this.isLeaf) {
			const fLeft = pball.getHitObject().hitBBox.left <= this.vCenter.x;
			const fRight = pball.getHitObject().hitBBox.right >= this.vCenter.x;

			if (pball.getHitObject().hitBBox.top <= this.vCenter.y) { // Top
				if (fLeft) {
					this.children[0].hitTestBall(pball, coll, player);
				}
				if (fRight) {
					this.children[1].hitTestBall(pball, coll, player);
				}
			}
			if (pball.getHitObject().hitBBox.bottom >= this.vCenter.y) { // Bottom
				if (fLeft) {
					this.children[2].hitTestBall(pball, coll, player);
				}
				if (fRight) {
					this.children[3].hitTestBall(pball, coll, player);
				}
			}
		}
	}

	public hitTestXRay(pball: Ball, pvhoHit: HitObject[], coll: CollisionEvent, player: Player): void {
		for (const pho of this.vho) {
			if (pball.getHitObject() !== pho
				&& pball.getHitObject().hitBBox.intersectRect(pho.hitBBox)
				&& pho.hitBBox.intersectSphere(pball.state.pos, pball.getHitObject().rcHitRadiusSqr)) {
				const newTime = pho.hitTest(pball, coll.hitTime, coll, player);
				if (newTime >= 0) {
					pvhoHit.push(pho);
				}
			}
		}

		if (!this.isLeaf) {
			const fLeft = (pball.getHitObject().hitBBox.left <= this.vCenter.x);
			const fRight = (pball.getHitObject().hitBBox.right >= this.vCenter.x);

			if (pball.getHitObject().hitBBox.top <= this.vCenter.y) { // Top
				if (fLeft) {
					this.children[0].hitTestXRay(pball, pvhoHit, coll, player);
				}
				if (fRight) {
					this.children[1].hitTestXRay(pball, pvhoHit, coll, player);
				}
			}
			if (pball.getHitObject().hitBBox.bottom >= this.vCenter.y) { // Bottom
				if (fLeft) {
					this.children[2].hitTestXRay(pball, pvhoHit, coll, player);
				}
				if (fRight) {
					this.children[3].hitTestXRay(pball, pvhoHit, coll, player);
				}
			}
		}
	}

	private createNextLevel(bounds: FRect3D, level: number, levelEmpty: number): void {
		if (this.vho.length <= 4) { //!! magic
			return;
		}

		this.isLeaf = false;

		this.vCenter.x = (bounds.left + bounds.right) * 0.5;
		this.vCenter.y = (bounds.top + bounds.bottom) * 0.5;
		this.vCenter.z = (bounds.zlow + bounds.zhigh) * 0.5;

		for (let i = 0; i < 4; i++) {
			this.children[i] = new HitQuadtree();
		}

		const vRemain: HitObject[] = []; // hit objects which did not go to a quadrant

		this.unique = this.vho[0].e ? this.vho[0].obj as PrimitiveItem : undefined;

		// sort items into appropriate child nodes
		for (const pho of this.vho) {
			let oct: number;

			if ((pho.e ? (pho.obj as PrimitiveItem) : undefined) !== this.unique) { // are all objects in current node unique/belong to the same primitive?
				this.unique = undefined;
			}

			if (pho.hitBBox.right < this.vCenter.x) {
				oct = 0;
			} else if (pho.hitBBox.left > this.vCenter.x) {
				oct = 1;
			} else {
				oct = 128;
			}

			if (pho.hitBBox.bottom < this.vCenter.y) {
				oct |= 0;
			} else if (pho.hitBBox.top > this.vCenter.y) {
				oct |= 2;
			} else {
				oct |= 128;
			}

			if ((oct & 128) === 0) {
				this.children[oct].vho.push(pho);
			} else {
				vRemain.push(pho);
			}
		}

		// originally: m_vho.swap(vRemain);
		this.vho.splice(0, this.vho.length); // clear array
		this.vho.push(...vRemain);                  // fill array

		// check if at least two nodes feature objects, otherwise don't bother subdividing further
		let countEmpty = (this.vho.length === 0) ? 1 : 0;
		for (let i = 0; i < 4; ++i) {
			if (this.children[i].vho.length === 0) {
				++countEmpty;
			}
		}

		if (countEmpty >= 4) {
			++levelEmpty;
		} else {
			levelEmpty = 0;
		}

		if (this.vCenter.x - bounds.left > 0.0001  //!! magic
			&& levelEmpty <= 8 // If 8 levels were all just subdividing the same objects without luck, exit & Free the nodes again (but at least empty space was cut off)
			&& level + 1 < 128 / 3) {
			for (let i = 0; i < 4; ++i) {
				const childBounds = new FRect3D();

				childBounds.left = (i & 1) ? this.vCenter.x : bounds.left;
				childBounds.top = (i & 2) ? this.vCenter.y : bounds.top;
				childBounds.zlow = bounds.zlow;

				childBounds.right = (i & 1) ? bounds.right : this.vCenter.x;
				childBounds.bottom = (i & 2) ? bounds.bottom : this.vCenter.y;
				childBounds.zhigh = bounds.zhigh;

				this.children[i].createNextLevel(childBounds, level + 1, levelEmpty);
			}
		}
	}

}
