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

import { Vertex2D } from '../math/vertex2d';
import { CollisionType } from './collision-type';
import { HitObject } from './hit-object';

export class HitLineZ extends HitObject {

	private readonly xy: Vertex2D;

	constructor(xy: Vertex2D, zlow?: number, zhigh?: number) {
		super();
		this.xy = xy;
		if (typeof zlow !== 'undefined') {
			this.hitBBox.zlow = zlow;
		}
		if (typeof zhigh !== 'undefined') {
			this.hitBBox.zhigh = zhigh;
		}
	}

	public set(x: number, y: number): this {
		this.xy.x = x;
		this.xy.y = y;
		return this;
	}

	public calcHitBBox(): void {
		this.hitBBox.left = this.xy.x;
		this.hitBBox.right = this.xy.x;
		this.hitBBox.top = this.xy.y;
		this.hitBBox.bottom = this.xy.y;

		// zlow and zhigh set in ctor
	}

	public getType(): CollisionType {
		return CollisionType.Joint;
	}
}
