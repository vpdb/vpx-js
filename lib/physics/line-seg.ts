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
import { HitObject } from './hit-object';

export class LineSeg extends HitObject {

	private readonly v1: Vertex2D;
	private readonly v2: Vertex2D;
	private normal!: Vertex2D;
	private length!: number;

	constructor(p1: Vertex2D, p2: Vertex2D, zlow?: number, zhigh?: number) {
		super();
		this.v1 = p1;
		this.v2 = p2;
		if (typeof zlow !== 'undefined') {
			this.hitBBox.zlow = zlow;
		}
		if (typeof zhigh !== 'undefined') {
			this.hitBBox.zhigh = zhigh;
		}
		this.calcNormal();
	}

	private calcNormal() {
		const vT = new Vertex2D(this.v1.x - this.v2.x, this.v1.y - this.v2.y);

		// Set up line normal
		this.length = vT.length();
		const invLength = 1.0 / this.length;
		this.normal = new Vertex2D(vT.y * invLength, -vT.x * invLength);
	}
}
