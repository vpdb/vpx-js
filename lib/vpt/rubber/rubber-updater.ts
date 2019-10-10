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
import { IRenderApi } from '../../render/irender-api';
import { Table } from '../table/table';
import { RubberData } from './rubber-data';
import { RubberState } from './rubber-state';

export class RubberUpdater {

	private readonly data: RubberData;
	private readonly state: RubberState;
	private readonly middlePoint: Vertex3D;

	constructor(data: RubberData, state: RubberState, middlePoint: Vertex3D) {
		this.data = data;
		this.state = state;
		this.middlePoint = middlePoint;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: RubberState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		console.error(state);

		// update local state
		Object.assign(this.state, state);

		// visibility
		if (state.isVisible !== undefined) {
			renderApi.applyVisibility(this.state.isVisible, obj);
		}

		// transformations
		if (state.rotX !== undefined || state.rotY !== undefined || state.rotZ !== undefined) {
			this.applyTransformation(obj, renderApi, table);
		}

		// material
		if (state.material || state.texture) {
			renderApi.applyMaterial(
				renderApi.findInGroup(obj, `rubber-${state.name}`)!,
				state.material ? table.getMaterial(state.material) : undefined,
				state.texture,
			);
		}
	}

	private applyTransformation<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		const diffRotX = this.data.rotX - this.state.rotX;
		const diffRotY = this.data.rotY - this.state.rotY;
		const diffRotZ = -(this.data.rotZ - this.state.rotZ);

		const rotMatrix = Matrix3D.claim();
		const tempMat = Matrix3D.claim();
		rotMatrix.rotateZMatrix(degToRad(diffRotZ));
		tempMat.rotateYMatrix(degToRad(diffRotY));
		rotMatrix.multiply(tempMat);
		tempMat.rotateXMatrix(degToRad(diffRotX));
		rotMatrix.multiply(tempMat);

		const matrix = Matrix3D.claim();
		tempMat.setTranslation(-this.middlePoint.x, -this.middlePoint.y, -this.middlePoint.z);
		matrix.multiply(tempMat, rotMatrix);
		tempMat.setTranslation(this.middlePoint.x, this.middlePoint.y, this.middlePoint.z);
		matrix.multiply(tempMat);

		renderApi.applyMatrixToNode(matrix, obj);
		Matrix3D.release(rotMatrix, tempMat, matrix);
	}
}
