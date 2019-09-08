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

import { ExtrudeBufferGeometry, Path, Shape, Vector2 } from 'three';
import { SplineVertex } from '../../math/spline-vertex';
import { LightData } from '../../vpt/light/light-data';
import { Table } from '../../vpt/table/table';

export class ThreeLightMeshGenerator {

	public createLight(lightData: LightData, table: Table, depth = 5, bevel = 0.5): ExtrudeBufferGeometry {
		const shape = this.getShape(lightData, table);
		const dim = table.getDimensions();
		const invTableWidth = 1.0 / dim.width;
		const invTableHeight = 1.0 / dim.height;

		const geometry = new ExtrudeBufferGeometry(shape, {
			depth,
			bevelEnabled: bevel > 0,
			bevelSegments: 1,
			steps: 1,
			bevelSize: bevel,
			bevelThickness: bevel,
			UVGenerator: {
				generateSideWallUV(g: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number, indexD: number): Vector2[] {
					return [
						new Vector2( 0, 0),
						new Vector2( 0, 0),
						new Vector2( 0, 0),
						new Vector2( 0, 0),
					];
				},
				generateTopUV(g: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number): Vector2[] {
					const ax = vertices[indexA * 3];
					const ay = vertices[indexA * 3 + 1];
					const bx = vertices[indexB * 3];
					const by = vertices[indexB * 3 + 1];
					const cx = vertices[indexC * 3];
					const cy = vertices[indexC * 3 + 1];
					return [
						new Vector2(ax * invTableWidth, 1 - ay * invTableHeight),
						new Vector2(bx * invTableWidth, 1 - by * invTableHeight),
						new Vector2(cx * invTableWidth, 1 - cy * invTableHeight),
					];
				},
			},
		});
		if (lightData.szSurface) {
			geometry.translate(0, 0, -table.getSurfaceHeight(lightData.szSurface, 0, 0));
		}
		geometry.name = `surface.light-${lightData.getName()}`;
		return geometry;
	}

	public getShape(lightData: LightData, table: Table): Shape {
		const vVertex = SplineVertex.getCentralCurve(lightData.dragPoints, table.getDetailLevel(), -1);
		return this.getPathFromPoints<Shape>(vVertex.map(v => new Vector2(v.x, v.y)), new Shape());
	}

	private getPathFromPoints<T extends Path>(points: Vector2[], path: T): T {
		/* istanbul ignore if */
		if (points.length === 0) {
			throw new Error('Cannot get path from no points.');
		}
		path.moveTo(points[0].x, points[0].y);
		for (const v of points.slice(1)) {
			path.lineTo(v.x, v.y);
		}
		//path.moveTo(points[0].x, points[0].y);
		return path;
	}
}
