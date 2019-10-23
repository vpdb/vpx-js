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
import { TriggerShape } from '../enums';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { TriggerData } from './trigger-data';

const triggerButtonMesh = Mesh.fromJson(require('../../../res/meshes/trigger-button-mesh'));
const triggerSimpleMesh = Mesh.fromJson(require('../../../res/meshes/trigger-simple-mesh'));
const triggerStarMesh = Mesh.fromJson(require('../../../res/meshes/trigger-star-mesh'));
const triggerDWireMesh = Mesh.fromJson(require('../../../res/meshes/trigger-wire-d-mesh'));

export class TriggerMeshGenerator {

	private readonly data: TriggerData;

	constructor(data: TriggerData) {
		this.data = data;
	}

	public getMesh(table: Table): Mesh {
		const baseHeight = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y) * table.getScaleZ();

		let zOffset = (this.data.shape === TriggerShape.TriggerButton) ? 5.0 : 0.0;
		if (this.data.shape === TriggerShape.TriggerWireC) {
			zOffset = -19.0;
		}

		const fullMatrix = new Matrix3D();
		if (this.data.shape === TriggerShape.TriggerWireB) {
			const tempMatrix = new Matrix3D();
			fullMatrix.rotateXMatrix(degToRad(-23.0));
			tempMatrix.rotateZMatrix(degToRad(this.data.rotation));
			fullMatrix.multiply(tempMatrix);

		} else if (this.data.shape === TriggerShape.TriggerWireC) {
			const tempMatrix = new Matrix3D();
			fullMatrix.rotateXMatrix(degToRad(140.0));
			tempMatrix.rotateZMatrix(degToRad(this.data.rotation));
			fullMatrix.multiply(tempMatrix);

		} else {
			fullMatrix.rotateZMatrix(degToRad(this.data.rotation));
		}

		const mesh = this.getBaseMesh();
		for (const vertex of mesh.vertices) {

			const vert = Vertex3D.claim(vertex.x, vertex.y, vertex.z).multiplyMatrix(fullMatrix);
			//fullMatrix.multiplyVector(vert);

			if (this.data.shape === TriggerShape.TriggerButton || this.data.shape === TriggerShape.TriggerStar) {
				vertex.x = f4(vert.x * this.data.radius) + this.data.center.x;
				vertex.y = f4(vert.y * this.data.radius) + this.data.center.y;
				vertex.z = f4(f4(f4(vert.z * this.data.radius) * table.getScaleZ()) + baseHeight) + zOffset;
			} else {
				vertex.x = f4(vert.x * this.data.scaleX) + this.data.center.x;
				vertex.y = f4(vert.y * this.data.scaleY) + this.data.center.y;
				vertex.z = f4(f4(vert.z * table.getScaleZ()) + baseHeight) + zOffset;
			}

			const normal = Vertex3D.claim(vertex.nx, vertex.ny, vertex.nz).multiplyMatrixNoTranslate(fullMatrix);
			vertex.nx = normal.x;
			vertex.ny = normal.y;
			vertex.nz = normal.z;

			Vertex3D.release(vert, normal);
		}
		return mesh;
	}

	private getBaseMesh(): Mesh {
		const name = `trigger-${this.data.getName()}`;
		switch (this.data.shape) {
			case TriggerShape.TriggerWireA:
			case TriggerShape.TriggerWireB:
			case TriggerShape.TriggerWireC:
				return triggerSimpleMesh.clone(name);
			case TriggerShape.TriggerWireD:
				return triggerDWireMesh.clone(name);
			case TriggerShape.TriggerButton:
				return triggerButtonMesh.clone(name);
			case TriggerShape.TriggerStar:
				return triggerStarMesh.clone(name);
			/* istanbul ignore next */
			default:
				logger().warn('[TriggerItem.getBaseMesh] Unknown shape "%s".', this.data.shape);
				return triggerSimpleMesh.clone(name);
		}
	}
}
