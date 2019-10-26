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
import { Enums } from '../enums';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { KickerData } from './kicker-data';

const kickerCupMesh = Mesh.fromJson(require('../../../res/meshes/kicker-cup-mesh'));
const kickerGottliebMesh = Mesh.fromJson(require('../../../res/meshes/kicker-gottlieb-mesh'));
const kickerHoleMesh = Mesh.fromJson(require('../../../res/meshes/kicker-hole-mesh'));
const kickerSimpleHoleMesh = Mesh.fromJson(require('../../../res/meshes/kicker-simple-hole-mesh'));
const kickerT1Mesh = Mesh.fromJson(require('../../../res/meshes/kicker-t1-mesh'));
const kickerWilliamsMesh = Mesh.fromJson(require('../../../res/meshes/kicker-williams-mesh'));

export class KickerMeshGenerator {

	private readonly data: KickerData;

	constructor(data: KickerData) {
		this.data = data;
	}

	public getMesh(table: Table): Mesh {
		const baseHeight = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y) * table.getScaleZ();
		return this.generateMesh(table, baseHeight);
	}

	private generateMesh(table: Table, baseHeight: number): Mesh {
		let zOffset = 0.0;
		let zRot = this.data.orientation;
		switch (this.data.kickerType) {
			case Enums.KickerType.KickerCup:
				zOffset = f4(-0.18);
				break;
			case Enums.KickerType.KickerWilliams:
				zRot = f4(this.data.orientation + 90.0);
				break;
			case Enums.KickerType.KickerHole:
				zRot = 0.0;
				break;
			case Enums.KickerType.KickerHoleSimple:
			default:
				zRot = 0.0;
				break;
		}
		const fullMatrix = new Matrix3D();
		fullMatrix.rotateZMatrix(degToRad(zRot));

		const mesh = this.getBaseMesh();
		for (const vertex of mesh.vertices) {
			const vert = Vertex3D.claim(vertex.x, vertex.y, vertex.z + zOffset).multiplyMatrix(fullMatrix);
			vertex.x = f4(vert.x * this.data.radius) + this.data.center.x;
			vertex.y = f4(vert.y * this.data.radius) + this.data.center.y;
			vertex.z = f4(f4(vert.z * this.data.radius) * table.getScaleZ()) + baseHeight;

			const normal = Vertex3D.claim(vertex.nx, vertex.ny, vertex.nz).multiplyMatrixNoTranslate(fullMatrix);
			vertex.nx = normal.x;
			vertex.ny = normal.y;
			vertex.nz = normal.z;

			Vertex3D.release(vert, normal);
		}
		return mesh;
	}

	private getBaseMesh(): Mesh {
		const name = `kicker-${this.data.getName()}`;
		switch (this.data.kickerType) {
			case Enums.KickerType.KickerCup: return kickerCupMesh.clone(name);
			case Enums.KickerType.KickerWilliams: return kickerWilliamsMesh.clone(name);
			case Enums.KickerType.KickerGottlieb: return kickerGottliebMesh.clone(name);
			case Enums.KickerType.KickerCup2: return kickerT1Mesh.clone(name);
			case Enums.KickerType.KickerHole: return kickerHoleMesh.clone(name);
			case Enums.KickerType.KickerHoleSimple:
			default:
				return kickerSimpleHoleMesh.clone(name);
		}
	}
}
