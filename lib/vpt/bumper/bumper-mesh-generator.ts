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

import { degToRad, f4 } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex3D } from '../../math/vertex3d';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { BumperData } from './bumper-data';

const bumperBaseMesh = Mesh.fromJson(require('../../../res/meshes/bumper-base-mesh'));
const bumperCapMesh = Mesh.fromJson(require('../../../res/meshes/bumper-cap-mesh'));
const bumperRingMesh = Mesh.fromJson(require('../../../res/meshes/bumper-ring-mesh'));
const bumperSocketMesh = Mesh.fromJson(require('../../../res/meshes/bumper-socket-mesh'));

export class BumperMeshGenerator {

	private readonly data: BumperData;

	private readonly scaledBashMesh: Mesh;
	private readonly scaledCapMesh: Mesh;
	private readonly scaledRingMesh: Mesh;
	private readonly scaledSocketMesh: Mesh;

	constructor(data: BumperData) {
		this.data = data;
		this.scaledBashMesh = bumperBaseMesh.clone().makeScale(this.data.radius, this.data.radius, this.data.heightScale);
		this.scaledCapMesh = bumperCapMesh.clone().makeScale(this.data.radius * 2, this.data.radius * 2, this.data.heightScale);
		this.scaledRingMesh = bumperRingMesh.clone().makeScale(this.data.radius, this.data.radius, this.data.heightScale);
		this.scaledSocketMesh = bumperSocketMesh.clone().makeScale(this.data.radius, this.data.radius, this.data.heightScale);
	}

	public getMeshes(table: Table): BumperMesh {
		/* istanbul ignore if */
		if (!this.data.center) {
			throw new Error(`Cannot export bumper ${this.data.getName()} without vCenter.`);
		}
		const matrix = new Matrix3D().rotateZMatrix(degToRad(this.data.orientation));
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y) * table.getScaleZ();
		return {
			base: this.generateMesh(
				`bumper-base-${this.data.getName()}`,
				this.scaledBashMesh,
				matrix,
				z => f4(z * table.getScaleZ()) + height,
			),
			ring: this.generateMesh(
				`bumper-ring-${this.data.getName()}`,
				this.scaledRingMesh,
				matrix,
				z => f4(z * table.getScaleZ()) + height,
			),
			skirt: this.generateMesh(
				`bumper-socket-${this.data.getName()}`,
				this.scaledSocketMesh,
				matrix,
				z => f4(z * table.getScaleZ()) + (height + 5.0),
			),
			cap: this.generateMesh(
				`bumper-cap-${this.data.getName()}`,
				this.scaledCapMesh,
				matrix,
				z => f4(f4(z + this.data.heightScale) * table.getScaleZ()) + height,
			),
		};
	}

	private generateMesh(name: string, mesh: Mesh, matrix: Matrix3D, zPos: (z: number) => number): Mesh {
		const generatedMesh = mesh.clone(name);
		for (const vertex of generatedMesh.vertices) {
			const vert = Vertex3D.claim(vertex.x, vertex.y, vertex.z).multiplyMatrix(matrix);
			vertex.x = vert.x + this.data.center.x;
			vertex.y = vert.y + this.data.center.y;
			vertex.z = zPos(vert.z);

			const normal = Vertex3D.claim(vertex.nx, vertex.ny, vertex.nz).multiplyMatrixNoTranslate(matrix);
			vertex.nx = normal.x;
			vertex.ny = normal.y;
			vertex.nz = normal.z;

			Vertex3D.release(vert, normal);
		}
		return generatedMesh;
	}
}

export interface BumperMesh {
	base: Mesh;
	ring: Mesh;
	skirt: Mesh;
	cap: Mesh;
}
