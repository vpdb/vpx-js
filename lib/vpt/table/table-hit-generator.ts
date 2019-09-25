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

import { Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { Hit3DPoly } from '../../physics/hit-3dpoly';
import { HitObject } from '../../physics/hit-object';
import { LineSeg } from '../../physics/line-seg';
import { logger } from '../../util/logger';
import { TableData } from './table-data';

export class TableHitGenerator {

	private readonly data: TableData;

	constructor(data: TableData) {
		this.data = data;
	}

	public generateHitObjects(): HitObject[] {

		const hitObjects: HitObject[] = [];

		// simple outer borders:
		hitObjects.push(new LineSeg(
			new Vertex2D(this.data.right, this.data.top),
			new Vertex2D(this.data.right, this.data.bottom),
			this.data.tableHeight,
			this.data.glassHeight,
		));

		hitObjects.push(new LineSeg(
			new Vertex2D(this.data.left, this.data.bottom),
			new Vertex2D(this.data.left, this.data.top),
			this.data.tableHeight,
			this.data.glassHeight,
		));

		hitObjects.push(new LineSeg(
			new Vertex2D(this.data.right, this.data.bottom),
			new Vertex2D(this.data.left, this.data.bottom),
			this.data.tableHeight,
			this.data.glassHeight,
		));

		hitObjects.push(new LineSeg(
			new Vertex2D(this.data.left, this.data.top),
			new Vertex2D(this.data.right, this.data.top),
			this.data.tableHeight,
			this.data.glassHeight,
		));

		// glass
		const rgv3D: Vertex3D[] = [
			new Vertex3D(this.data.left, this.data.top, this.data.glassHeight),
			new Vertex3D(this.data.right, this.data.top, this.data.glassHeight),
			new Vertex3D(this.data.right, this.data.bottom, this.data.glassHeight),
			new Vertex3D(this.data.left, this.data.bottom, this.data.glassHeight),
		];
		const ph3dpoly = new Hit3DPoly(rgv3D);
		ph3dpoly.calcHitBBox();
		hitObjects.push(ph3dpoly);

		logger().info('[Player] Playfield hit objects set.', hitObjects);
		return hitObjects;
	}
}
