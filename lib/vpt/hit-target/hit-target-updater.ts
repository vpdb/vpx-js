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
import { HitTargetData } from './hit-target-data';
import { HitTargetState } from './hit-target-state';

export class HitTargetUpdater extends ItemUpdater<HitTargetState> {

	private readonly data: HitTargetData;

	constructor(data: HitTargetData, state: HitTargetState) {
		super(state);
		this.data = data;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: HitTargetState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		// update local state
		Object.assign(this.state, state);

		this.applyVisibility(obj, state, renderApi);
		this.applyMaterial(obj, state.name, state.material, state.texture, renderApi, table);

		// animation
		if (state.zOffset !== undefined || state.xRotation !== undefined) {
			this.applyAnimation(obj, state, renderApi);
		}
	}

	private applyAnimation<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: HitTargetState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>): void {

		const matTransToOrigin = Matrix3D.claim().setTranslation(-this.data.vPosition.x, -this.data.vPosition.y, -this.data.vPosition.z);
		const matRotateToOrigin = Matrix3D.claim().rotateZMatrix(degToRad(-this.data.rotZ));
		const matTransFromOrigin = Matrix3D.claim().setTranslation(this.data.vPosition.x, this.data.vPosition.y, this.data.vPosition.z);
		const matRotateFromOrigin = Matrix3D.claim().rotateZMatrix(degToRad(this.data.rotZ));
		const matRotateX = Matrix3D.claim().rotateXMatrix(degToRad(state.xRotation));
		const matTranslateZ = Matrix3D.claim().setTranslation(0, 0, -state.zOffset);
		const matrix = matTransToOrigin
			.multiply(matRotateToOrigin)
			.multiply(matRotateX)
			.multiply(matTranslateZ)
			.multiply(matRotateFromOrigin)
			.multiply(matTransFromOrigin);

		renderApi.applyMatrixToNode(matrix, obj);
		Matrix3D.release(matTransToOrigin, matRotateToOrigin, matTransFromOrigin, matRotateFromOrigin, matRotateX, matTranslateZ);
	}

}
