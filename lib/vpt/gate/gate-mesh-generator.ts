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
import { logger } from '../../util/logger';
import { GateType } from '../enums';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { GateData } from './gate-data';

const hitTargetT3Mesh = Mesh.fromJson(require('../../../res/meshes/drop-target-t3-mesh'));
const gateBracketMesh = Mesh.fromJson(require('../../../res/meshes/gate-bracket-mesh'));
const gateLongPlateMesh = Mesh.fromJson(require('../../../res/meshes/gate-long-plate-mesh'));
const gatePlateMesh = Mesh.fromJson(require('../../../res/meshes/gate-plate-mesh'));
const gateWireMesh = Mesh.fromJson(require('../../../res/meshes/gate-wire-mesh'));
const gateWireRectangleMesh = Mesh.fromJson(require('../../../res/meshes/gate-wire-rectangle-mesh'));

export class GateMeshGenerator {

	private readonly data: GateData;

	constructor(data: GateData) {
		this.data = data;
	}

	public getMeshes(table: Table): GateMesh {
		const baseHeight = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y) * table.getScaleZ();
		return {
			wire: this.positionMesh(this.getBaseMesh(), table, baseHeight),
			bracket: this.positionMesh(gateBracketMesh.clone(`gate.bracket-${this.data.getName()}`), table, baseHeight),
		};
	}

	private getBaseMesh(): Mesh {
		switch (this.data.gateType) {
			case GateType.GateWireW: return gateWireMesh.clone(`gate.wire-${this.data.getName()}`);
			case GateType.GateWireRectangle: return gateWireRectangleMesh.clone(`gate.wire-${this.data.getName()}`);
			case GateType.GatePlate: return gatePlateMesh.clone(`gate.wire-${this.data.getName()}`);
			case GateType.GateLongPlate: return gateLongPlateMesh.clone(`gate.wire-${this.data.getName()}`);
			/* istanbul ignore next */
			default:
				logger().warn('[GateItem.getBaseMesh] Unknown gate type "%s".', this.data.gateType);
				return hitTargetT3Mesh.clone();
		}
	}

	private positionMesh(mesh: Mesh, table: Table, baseHeight: number): Mesh {
		const fullMatrix = new Matrix3D();
		fullMatrix.rotateZMatrix(degToRad(this.data.rotation));
		for (const vertex of mesh.vertices) {

			const vert = Vertex3D.claim(vertex.x, vertex.y, vertex.z).multiplyMatrix(fullMatrix);
			vertex.x = f4(vert.x * this.data.length) + this.data.center.x;
			vertex.y = f4(vert.y * this.data.length) + this.data.center.y;
			vertex.z = f4(f4(f4(vert.z * this.data.length) * table.getScaleZ()) + f4(this.data.height * table.getScaleZ())) + baseHeight;

			const normal = Vertex3D.claim(vertex.nx, vertex.ny, vertex.nz).multiplyMatrixNoTranslate(fullMatrix);
			vertex.nx = normal.x;
			vertex.ny = normal.y;
			vertex.nz = normal.z;

			Vertex3D.release(vert, normal);
		}
		return mesh;
	}
}

export interface GateMesh {
	wire: Mesh;
	bracket: Mesh;
}
