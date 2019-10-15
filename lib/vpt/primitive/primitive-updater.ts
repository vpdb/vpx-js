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

import { degToRad } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { IRenderApi } from '../../render/irender-api';
import { ItemUpdater } from '../item-updater';
import { Table } from '../table/table';
import { PrimitiveData } from './primitive-data';
import { PrimitiveState } from './primitive-state';

export class PrimitiveUpdater extends ItemUpdater<PrimitiveState> {

	private readonly data: PrimitiveData;

	constructor(data: PrimitiveData, state: PrimitiveState) {
		super(state);
		this.data = data;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: PrimitiveState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		Object.assign(this.state, state);

		this.applyVisibility(obj, state, renderApi);
		this.applyMaterial(obj, `flipper-${state.name}`, state.material, state.map, renderApi, table); // TODO normal map

		if (state.position || state.size || state.rotation || state.translation || state.objectRotation) {
			this.applyTransformation(obj, renderApi, table);
		}
	}

	private applyTransformation<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		const matToOrigin = Matrix3D.claim().setTranslation(-this.data.position.x, -this.data.position.y, this.data.position.z);
		const matFromOrigin = Matrix3D.claim().setTranslation(this.data.position.x, this.data.position.y, -this.data.position.z);

		// scale matrix
		const scaleMatrix = Matrix3D.claim().setScaling(
			((this.state.size as any)._x / this.data.size.x),
			((this.state.size as any)._y / this.data.size.y),
			((this.state.size as any)._z / this.data.size.z),
		);
		const scaleMatrixTable = Matrix3D.claim().setScaling(1.0, 1.0, table.getScaleZ());

		// translation matrix
		const transMatrix = Matrix3D.claim().setTranslation(
			((this.state.position as any)._x - this.data.position.x),
			((this.state.position as any)._y - this.data.position.y),
			((this.state.position as any)._z - this.data.position.z),
		);

		// translation + rotation matrix
		const rotTransMatrix = Matrix3D.claim().setTranslation(
			((this.state.translation as any)._x - this.data.rotAndTra[3]), // t
			((this.state.translation as any)._y - this.data.rotAndTra[4]), // z
			((this.state.translation as any)._z - this.data.rotAndTra[5]), // u
		);

		const tempMatrix = Matrix3D.claim();
		tempMatrix.rotateZMatrix(degToRad(this.data.rotAndTra[2] - (this.state.rotation as any)._z)); // r
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateYMatrix(degToRad(this.data.rotAndTra[1] - (this.state.rotation as any)._y)); // e
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateXMatrix(degToRad(this.data.rotAndTra[0] - (this.state.rotation as any)._x)); // w
		rotTransMatrix.multiply(tempMatrix);

		tempMatrix.rotateZMatrix(degToRad((this.state.objectRotation as any)._z - this.data.rotAndTra[8])); // i
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateYMatrix(degToRad((this.state.objectRotation as any)._y - this.data.rotAndTra[7])); // o
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateXMatrix(degToRad((this.state.objectRotation as any)._x - this.data.rotAndTra[6])); // p
		rotTransMatrix.multiply(tempMatrix);

		const matrix = matToOrigin
			.multiply(scaleMatrix)
			.multiply(rotTransMatrix)
			.multiply(transMatrix)
			.multiply(scaleMatrixTable)
			.multiply(matFromOrigin);

		renderApi.applyMatrixToNode(matrix, obj);
		Matrix3D.release(matToOrigin, matFromOrigin, scaleMatrix, transMatrix, rotTransMatrix, tempMatrix); // matrix and matToOrigin are the same instance
	}
}
