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

import { BufferGeometry, ExtrudeBufferGeometry, MeshStandardMaterial, Path, Shape, Vector2 } from 'three';
import { Table } from '../..';
import { bulbLightMesh } from '../../../res/meshes/bulb-light-mesh';
import { bulbSocketMesh } from '../../../res/meshes/bulb-socket-mesh';
import { SplineVertex } from '../../math/spline-vertex';
import { Mesh } from '../mesh';
import { LightData } from './light-data';

export class LightMeshGenerator {

	private readonly data: LightData;

	constructor(data: LightData) {
		this.data = data;
	}

	public getMeshes(table: Table): LightMeshes {
		if (this.data.isBulbLight()) {
			return this.getBulbMeshes(table);
		}
		return {
			surfaceLight: this.getSurfaceGeometry(table, Table.playfieldThickness / 2),
		};
	}

	public getShape(table: Table): Shape {
		const vvertex = SplineVertex.getCentralCurve(this.data.dragPoints, table.getDetailLevel(), -1);
		return this.getPathFromPoints<Shape>(vvertex.map(v => new Vector2(v.x, v.y)), new Shape());
	}

	public getPath(table: Table): Path {
		const vvertex = SplineVertex.getCentralCurve(this.data.dragPoints, table.getDetailLevel(), -1);
		return this.getPathFromPoints<Path>(vvertex.map(v => new Vector2(v.x, v.y)), new Path());
	}

	// public getExtendedPath(table: Table, distance: number): Path {
	// 	const path = this.getPath(table);
	// 	let len = 0;
	// 	const points: Vector2[] = [];
	// 	const totalLen = path.getLength();
	// 	let i = 0;
	// 	for (const curveLength of path.getCurveLengths()) {
	// 		const tangent = path.getTangent(i);
	// 		const point = path.getPoint(i);
	// 		const direction = tangent.rotateAround(point, M.degToRad(90));
	// 		point.add(direction.multiplyScalar(distance));
	// 		len += curveLength;
	// 		i++;
	// 		points.push(point);
	// 	}
	// 	return this.getPathFromPoints(points);
	// }

	public getSurfaceGeometry(table: Table, depth = 5, bevel = 0.5): ExtrudeBufferGeometry {

		const shape = this.getShape(table);
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
		if (this.data.szSurface) {
			geometry.translate(0, 0, -table.getSurfaceHeight(this.data.szSurface, 0, 0));
		}
		geometry.name = `surface.light-${this.data.getName()}`;
		return geometry;
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

	private getBulbMeshes(table: Table): LightMeshes {
		const lightMesh = bulbLightMesh.clone(`bulb.light-${this.data.getName()}`);
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y) * table.getScaleZ();
		for (const vertex of lightMesh.vertices) {
			vertex.x = vertex.x * this.data.meshRadius + this.data.vCenter.x;
			vertex.y = vertex.y * this.data.meshRadius + this.data.vCenter.y;
			vertex.z = vertex.z * this.data.meshRadius * table.getScaleZ() + height;
		}

		const socketMesh = bulbSocketMesh.clone(`bulb.socket-${this.data.getName()}`);
		for (const vertex of socketMesh.vertices) {
			vertex.x = vertex.x * this.data.meshRadius + this.data.vCenter.x;
			vertex.y = vertex.y * this.data.meshRadius + this.data.vCenter.y;
			vertex.z = vertex.z * this.data.meshRadius * table.getScaleZ() + height;
		}

		return {
			light: lightMesh,
			socket: socketMesh,
		};
	}
}

export interface LightMeshes {
	light?: Mesh;
	socket?: Mesh;
	surfaceLight?: ExtrudeBufferGeometry;
}
