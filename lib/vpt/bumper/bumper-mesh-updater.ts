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
import { Table } from '../table/table';
import { BumperData } from './bumper-data';
import { BumperMeshGenerator } from './bumper-mesh-generator';
import { BumperState } from './bumper-state';

export class BumperMeshUpdater {

	private readonly data: BumperData;
	private readonly state: BumperState;
	private readonly meshGenerator: BumperMeshGenerator;

	constructor(data: BumperData, state: BumperState, meshGenerator: BumperMeshGenerator) {
		this.data = data;
		this.state = state;
		this.meshGenerator = meshGenerator;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BumperState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table, oldState: BumperState) {

		if (this.data.isRingVisible && state.ringOffset !== oldState.ringOffset) {
			this.applyRingState(obj, state, renderApi);
		}
		if (this.data.isSkirtVisible && (state.skirtRotX !== oldState.skirtRotX || state.skirtRotY !== oldState.skirtRotY)) {
			this.applySkirtState(obj, state, renderApi, table);
		}
	}

	private applyRingState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BumperState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>) {
		const ringObj = renderApi.findInGroup(obj, `bumper-ring-${this.data.getName()}`);
		if (ringObj) {
			const matrix = Matrix3D.claim().setTranslation(0, 0, -state.ringOffset);
			renderApi.applyMatrixToNode(matrix, ringObj);
			Matrix3D.release(matrix);
		}
	}

	/* istanbul ignore next: this looks weird. test when sure it's the correct "animation" */
	private applySkirtState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BumperState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table) {
		const skirtObj = renderApi.findInGroup(obj, `bumper-socket-${this.data.getName()}`);
		if (skirtObj) {
			const height = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y) * table.getScaleZ();
			const matToOrigin = Matrix3D.claim().setTranslation(-this.data.center.x, -this.data.center.y, -height);
			const matFromOrigin = Matrix3D.claim().setTranslation(this.data.center.x, this.data.center.y, height);
			const matRotX = Matrix3D.claim().rotateXMatrix(degToRad(state.skirtRotX));
			const matRotY = Matrix3D.claim().rotateYMatrix(degToRad(state.skirtRotY));

			const matrix = matToOrigin.multiply(matRotY).multiply(matRotX).multiply(matFromOrigin);

			renderApi.applyMatrixToNode(matrix, skirtObj);
			Matrix3D.release(matToOrigin, matFromOrigin, matRotX, matRotY);
		}
	}
}
