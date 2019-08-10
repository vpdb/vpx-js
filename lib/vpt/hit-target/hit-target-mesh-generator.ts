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

import { hitTargetT2Mesh } from '../../../res/meshes/drop-target-t2-mesh';
import { hitTargetT3Mesh } from '../../../res/meshes/drop-target-t3-mesh';
import { hitTargetT4Mesh } from '../../../res/meshes/drop-target-t4-mesh';
import { hitFatTargetRectangleMesh } from '../../../res/meshes/hit-target-fat-rectangle-mesh';
import { hitFatTargetSquareMesh } from '../../../res/meshes/hit-target-fat-square-mesh';
import { hitTargetRectangleMesh } from '../../../res/meshes/hit-target-rectangle-mesh';
import { hitTargetRoundMesh } from '../../../res/meshes/hit-target-round-mesh';
import { hitTargetT1SlimMesh } from '../../../res/meshes/hit-target-t1-slim-mesh';
import { hitTargetT2SlimMesh } from '../../../res/meshes/hit-target-t2-slim-mesh';
import { degToRad, f4 } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex3D } from '../../math/vertex3d';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { HitTarget } from './hit-target';
import { HitTargetData } from './hit-target-data';

export class HitTargetMeshGenerator {

	private readonly data: HitTargetData;

	constructor(data: HitTargetData) {
		this.data = data;
	}

	public getMesh(table: Table): Mesh {
		const hitTargetMesh = this.getBaseMesh();
		hitTargetMesh.name = `hit.target-${this.data.getName()}`;

		const fullMatrix = new Matrix3D();
		const tempMatrix = new Matrix3D();
		tempMatrix.rotateZMatrix(degToRad(this.data.rotZ));
		fullMatrix.multiply(tempMatrix);

		let dropOffset = 0;
		if (this.data.isDropped && (this.data.targetType === HitTarget.TypeDropTargetBeveled || this.data.targetType === HitTarget.TypeDropTargetSimple || this.data.targetType === HitTarget.TypeDropTargetFlatSimple)) {
			dropOffset = -f4(HitTarget.DROP_TARGET_LIMIT * table.getScaleZ());
		}

		for (const vertex of hitTargetMesh.vertices) {
			let vert = new Vertex3D(vertex.x, vertex.y, vertex.z);
			vert.x *= this.data.vSize.x;
			vert.y *= this.data.vSize.y;
			vert.z *= this.data.vSize.z;
			vert = fullMatrix.multiplyVector(vert);

			vertex.x = vert.x + this.data.vPosition.x;
			vertex.y = vert.y + this.data.vPosition.y;
			vertex.z = f4(f4(f4(vert.z * table.getScaleZ()) + this.data.vPosition.z) + table.getTableHeight())  + dropOffset;

			vert = new Vertex3D(vertex.nx, vertex.ny, vertex.nz);
			vert = fullMatrix.multiplyVectorNoTranslate(vert);
			vertex.nx = vert.x;
			vertex.ny = vert.y;
			vertex.nz = vert.z;
		}

		return hitTargetMesh;
	}

	private getBaseMesh(): Mesh {
		switch (this.data.targetType) {
			case HitTarget.TypeDropTargetBeveled: return hitTargetT2Mesh.clone();
			case HitTarget.TypeDropTargetSimple: return hitTargetT3Mesh.clone();
			case HitTarget.TypeDropTargetFlatSimple: return hitTargetT4Mesh.clone();
			case HitTarget.TypeHitTargetRound: return hitTargetRoundMesh.clone();
			case HitTarget.TypeHitTargetRectangle: return hitTargetRectangleMesh.clone();
			case HitTarget.TypeHitFatTargetRectangle: return hitFatTargetRectangleMesh.clone();
			case HitTarget.TypeHitFatTargetSquare: return hitFatTargetSquareMesh.clone();
			case HitTarget.TypeHitTargetSlim: return hitTargetT1SlimMesh.clone();
			case HitTarget.TypeHitFatTargetSlim: return hitTargetT2SlimMesh.clone();
			/* istanbul ignore next: currently all implemented */
			default: return hitTargetT3Mesh.clone();
		}
	}
}
