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

import { Table } from '../..';
import { spinnerBracketMesh } from '../../../res/meshes/spinner-bracket-mesh';
import { spinnerPlateMesh } from '../../../res/meshes/spinner-plate-mesh';
import { degToRad, f4 } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex3D } from '../../math/vertex3d';
import { Mesh } from '../mesh';
import { SpinnerData } from './spinner-data';

export class SpinnerMeshGenerator {

	private readonly data: SpinnerData;

	constructor(data: SpinnerData) {
		this.data = data;
	}

	public generateMeshes(table: Table): { plate: Mesh, bracket?: Mesh } {
		const posZ = this.getZ(table);
		if (this.data.showBracket) {
			return {
				plate: this.getPlateMesh(table, posZ),
				bracket: this.getBracketMesh(table, posZ),
			};
		}
		return {
			plate: this.getPlateMesh(table, posZ),
		};
	}

	public getZ(table: Table): number {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y) * table.getScaleZ();
		return f4(height + this.data.height);
	}

	private getPlateMesh(table: Table, posZ: number): Mesh {
		const mesh = spinnerPlateMesh.clone(`spinner.plate-${this.data.getName()}`);
		return this.updateVertices(table, posZ, mesh);
	}

	private getBracketMesh(table: Table, posZ: number): Mesh {
		const bracketMesh = spinnerBracketMesh.clone(`spinner.bracket-${this.data.getName()}`);
		return this.updateVertices(table, posZ, bracketMesh);
	}

	private updateVertices(table: Table, posZ: number, mesh: Mesh): Mesh {
		const matrix = new Matrix3D().rotateZMatrix(degToRad(this.data.rotation));
		for (const vertex of mesh.vertices) {
			let vert = new Vertex3D(vertex.x, vertex.y, vertex.z);
			vert = matrix.multiplyVector(vert);
			vertex.x = f4(vert.x * this.data.length) + this.data.vCenter.x;
			vertex.y = f4(vert.y * this.data.length) + this.data.vCenter.y;
			vertex.z = f4(f4(vert.z * this.data.length) * table.getScaleZ()) + posZ;

			let norm = new Vertex3D(vertex.nx, vertex.ny, vertex.nz);
			norm = matrix.multiplyVectorNoTranslate(norm);
			vertex.nx = norm.x;
			vertex.ny = norm.y;
			vertex.nz = norm.z;
		}
		return mesh;
	}
}
