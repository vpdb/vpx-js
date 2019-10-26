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
import { IRenderApi } from '../../render/irender-api';
import { ItemUpdater } from '../item-updater';
import { Table } from '../table/table';
import { GateData } from './gate-data';
import { GateState } from './gate-state';

export class GateUpdater extends ItemUpdater<GateState> {

	private readonly data: GateData;

	constructor(data: GateData, state: GateState) {
		super(state);
		this.data = data;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: GateState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		// update local state
		Object.assign(this.state, state);

		this.applyVisibility(obj, state, renderApi);
		this.applyMaterial(obj, state.material, undefined, renderApi, table);

		if (state.showBracket !== undefined) {
			renderApi.applyVisibility(state.showBracket, renderApi.findInGroup(obj, `gate.bracket-${state.name}`));
		}

		if (state.angle !== undefined) {
			this.applyXRotation(
				obj,
				renderApi,
				this.data.center,
				this.data.height,
				this.data.rotation,
				state.angle - degToRad(this.data.angleMin),
				`gate.wire-${this.state.getName()}`,
			);
		}
	}
}
