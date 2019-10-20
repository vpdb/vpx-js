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
import { TriggerState } from './trigger-state';

export class TriggerUpdater extends ItemUpdater<TriggerState> {

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: TriggerState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		// update local state
		Object.assign(this.state, state);

		this.applyVisibility(obj, state, renderApi);
		this.applyMaterial(obj, state.name, state.material, undefined, renderApi, table);
		this.applyAnimation(obj, state, renderApi);
	}

	public applyAnimation<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: TriggerState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>): void {
		if (state.heightOffset !== undefined) {
			const matrix = Matrix3D.claim().setTranslation(0, 0, -state.heightOffset);
			renderApi.applyMatrixToNode(matrix, obj);
			Matrix3D.release(matrix);
		}
	}
}
