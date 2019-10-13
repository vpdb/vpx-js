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

		console.error(state);
		Object.assign(this.state, state);

		this.applyVisibility(obj, state, renderApi);
		this.applyMaterial(obj, state.name, state.material, state.map, renderApi, table); // TODO normal map

		if (state.position || state.size || state.rotation || state.translation || state.objectRotation) {
			this.applyTransformation(obj, renderApi, table);
		}
	}

	private applyTransformation<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		const matToOrigin = Matrix3D.claim().setTranslation(-this.data.position.x, -this.data.position.y, this.data.position.z);
		const matRotateX = Matrix3D.claim().rotateZMatrix(degToRad(this.state.rotation.x - this.data.rotAndTra[0]));
		const matRotateY = Matrix3D.claim().rotateZMatrix(degToRad(this.state.rotation.y - this.data.rotAndTra[1]));
		const matRotateZ = Matrix3D.claim().rotateZMatrix(degToRad(this.state.rotation.z - this.data.rotAndTra[2]));
		const matFromOrigin = Matrix3D.claim().setTranslation(this.data.position.x, this.data.position.y, -this.data.position.z);

		// scale matrix
		/*const scaleMatrix = new Matrix3D();
		scaleMatrix.setScaling(this.data.size.x, this.data.size.y, this.data.size.z);

		// translation matrix
		const transMatrix = new Matrix3D();
		transMatrix.setTranslation(this.data.position.x, this.data.position.y, this.data.position.z);

		// translation + rotation matrix
		const rotTransMatrix = new Matrix3D();
		rotTransMatrix.setTranslation(this.data.rotAndTra[3], this.data.rotAndTra[4], this.data.rotAndTra[5]);

		const tempMatrix = new Matrix3D();
		tempMatrix.rotateZMatrix(degToRad(this.data.rotAndTra[2]));
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateYMatrix(degToRad(this.data.rotAndTra[1]));
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateXMatrix(degToRad(this.data.rotAndTra[0]));
		rotTransMatrix.multiply(tempMatrix);

		tempMatrix.rotateZMatrix(degToRad(this.data.rotAndTra[8]));
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateYMatrix(degToRad(this.data.rotAndTra[7]));
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateXMatrix(degToRad(this.data.rotAndTra[6]));
		rotTransMatrix.multiply(tempMatrix);

		const fullMatrix = scaleMatrix.clone();
		fullMatrix.multiply(rotTransMatrix);
		fullMatrix.multiply(transMatrix);        // fullMatrix = Smatrix * RTmatrix * Tmatrix
		scaleMatrix.setScaling(1.0, 1.0, table.getScaleZ());
		fullMatrix.multiply(scaleMatrix);*/

		const matrix = matToOrigin
			.multiply(matRotateZ)
			.multiply(matRotateY)
			.multiply(matRotateX)
			.multiply(matFromOrigin);

		renderApi.applyMatrixToNode(matrix, obj);
		Matrix3D.release(matToOrigin, matFromOrigin, matRotateX, matRotateY, matRotateZ); // matrix and matToOrigin are the same instance




	}
}
