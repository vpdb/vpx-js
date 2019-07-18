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
import { HitKDNode } from './hit-kd-node';
import { HitObject } from './hit-object';

export class HitKD {

	private m_org_idx: number[];

	private m_rootNode: HitKDNode;

	private m_num_items: number = 0;
	private m_max_items: number = 0;

	private m_org_vho: HitObject[];

	private tmp: number[];

	private m_nodes: HitKDNode[];
	private m_num_nodes: number = 0;

	constructor() {
		this.m_rootNode = new HitKDNode(this);
	}

	public init(vho: HitObject[]) {
		this.m_org_vho = vho;
		this.m_num_items = vho.length;

		if (this.m_num_items > this.m_max_items) {
			this.m_max_items = this.m_num_items;

			this.m_org_idx = [];

			this.tmp = [];
			this.m_nodes = [];
		}
		this.m_num_nodes = 0;
		this.m_rootNode.reset(this);
	}

	public addElementByIndex(i: number): void {
		this.m_org_idx.push(i);
	}

	public fillFromVector(vho: HitObject[]): void {
		this.init(vho);

		this.m_rootNode.m_rectbounds.Clear();

		this.m_rootNode.m_start = 0;
		this.m_rootNode.m_items = this.m_num_items;

		for (let i = 0; i < this.m_num_items; ++i) {
			const pho = vho[i];
			pho.calcHitBBox(); //!! omit, as already calced?!
			this.m_rootNode.m_rectbounds.extend(pho.hitBBox);
			this.m_org_idx[i] = i;
		}

		this.m_rootNode.createNextLevel(0, 0);
		this.initSseArrays();
	}

	public fillFromIndices(initialBounds?: FRect3D): void {
		if (initialBounds) {
			this.m_rootNode.m_rectbounds = initialBounds;

			this.m_rootNode.m_start = 0;
			this.m_rootNode.m_items = this.m_num_items;

			// assume that CalcHitBBox() was already called on the hit objects

			this.m_rootNode.createNextLevel(0, 0);
			this.initSseArrays();
		} else {

			this.m_rootNode.m_rectbounds.Clear();

			this.m_rootNode.m_start = 0;
			this.m_rootNode.m_items = this.m_num_items;

			for (let i = 0; i < this.m_num_items; ++i) {
				const pho = this.getItemAt(i);
				pho.calcHitBBox(); //!! omit, as already calced?!
				this.m_rootNode.m_rectbounds.extend(pho.hitBBox);
			}

			this.m_rootNode.createNextLevel(0, 0);
			this.initSseArrays();
		}
	}

	// call when the bounding boxes of the HitObjects have changed to update the tree
	public update(): void {
		this.fillFromVector(this.m_org_vho);
	}

	// call when finalizing a tree (no dynamic changes planned on it)
	public finalize(): void {
		this.tmp = [];
	}

	public hitTestBall(pball: Ball, coll: CollisionEvent): void {
		this.m_rootNode.hitTestBallSse(pball, coll);
	}

	public hitTestXRay(pball: Ball, pvhoHit: HitObject[], coll: CollisionEvent) {
		this.m_rootNode.hitTestXRay(pball, pvhoHit, coll);
	}

	private initSseArrays() {
		// currently ignoring #ifdef KDTREE_SSE_LEAFTEST
	}

	public getItemAt(i: number): HitObject {
		return this.m_org_vho[ this.m_org_idx[ i ] ];
	}

	private allocTwoNodes(): HitKDNode | null {
		if (this.m_num_nodes + 1 >= this.m_nodes.length) {       // space for two more nodes?
			return null;

		} else {
			this.m_num_nodes += 2;
			return this.m_nodes[this.m_num_nodes - 2];
		}
	}
}
