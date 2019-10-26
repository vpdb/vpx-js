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

import { Matrix3D } from '../../math/matrix3d';
import { IRenderApi } from '../../render/irender-api';
import { ItemUpdater } from '../item-updater';
import { Table } from '../table/table';
import { BallData } from './ball-data';
import { BallState } from './ball-state';

export class BallUpdater extends ItemUpdater<BallState> {

	private readonly data: BallData;

	constructor(state: BallState, data: BallData) {
		super(state);
		this.data = data;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BallState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {
		// update local state
		Object.assign(this.state, state);

		const pos: { _x: number, _y: number, _z: number} = this.state.pos as any;
		const zHeight = !this.state.isFrozen ? pos._z : pos._z - this.data.radius;
		const orientation = Matrix3D.claim().setEach(
			this.state.orientation.matrix[0][0], this.state.orientation.matrix[1][0], this.state.orientation.matrix[2][0], 0.0,
			this.state.orientation.matrix[0][1], this.state.orientation.matrix[1][1], this.state.orientation.matrix[2][1], 0.0,
			this.state.orientation.matrix[0][2], this.state.orientation.matrix[1][2], this.state.orientation.matrix[2][2], 0.0,
			0, 0, 0, 1,
		);
		const trans = Matrix3D.claim().setTranslation(pos._x, pos._y, zHeight);
		const matrix = Matrix3D.claim()
			.setScaling(this.data.radius, this.data.radius, this.data.radius)
			.preMultiply(orientation)
			.multiply(trans)
			.toRightHanded();

		renderApi.applyMatrixToNode(matrix, obj);
		Matrix3D.release(orientation, trans, matrix);
	}
}
