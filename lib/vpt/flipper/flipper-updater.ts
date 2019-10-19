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
import { FlipperData } from './flipper-data';
import { FlipperState } from './flipper-state';

export class FlipperUpdater extends ItemUpdater<FlipperState> {

	private readonly data: FlipperData;

	constructor(data: FlipperData, state: FlipperState) {
		super(state);
		this.data = data;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: FlipperState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		// update local state
		Object.assign(this.state, state);

		this.applyVisibility(obj, state, renderApi);
		this.applyMaterial(obj, state.name, state.material, state.texture, renderApi, table);

		// transformations
		if (state.center || state.angle) {
			this.applyTransformation(obj, renderApi, table);
		}
	}

	private applyTransformation<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		const diffX = (this.state.center as any)._x - this.data.center.x;
		const diffY = (this.state.center as any)._y - this.data.center.y;

		const height = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y) * table.getScaleZ();

		const matToOrigin = Matrix3D.claim().setTranslation(-this.data.center.x, -this.data.center.y, height);
		const matFromOrigin = Matrix3D.claim().setTranslation(this.data.center.x, this.data.center.y, -height);
		const matRotate = Matrix3D.claim().rotateZMatrix(this.state.angle - degToRad(this.data.startAngle));
		const matTrans = Matrix3D.claim().setTranslation(diffX, diffY, 0);
		const matrix = matToOrigin.multiply(matRotate).multiply(matFromOrigin).multiply(matTrans);

		renderApi.applyMatrixToNode(matrix, obj);
		Matrix3D.release(matToOrigin, matFromOrigin, matRotate, matTrans); // matrix and matToOrigin are the same instance
	}
}
