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

import { IRenderApi } from '../../render/irender-api';
import { ItemUpdater } from '../item-updater';
import { Table } from '../table/table';
import { PlungerMeshGenerator } from './plunger-mesh-generator';
import { PlungerState } from './plunger-state';

export class PlungerUpdater extends ItemUpdater<PlungerState> {

	private readonly meshGenerator: PlungerMeshGenerator;

	constructor(state: PlungerState, meshGenerator: PlungerMeshGenerator) {
		super(state);
		this.meshGenerator = meshGenerator;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: PlungerState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		const mesh = this.meshGenerator.generateMeshes(state.frame, table);
		const rodObj = renderApi.findInGroup(obj, 'rod');
		if (rodObj) {
			renderApi.applyMeshToNode(mesh.rod!, rodObj);
		}
		const springObj = renderApi.findInGroup(obj, 'spring');
		if (springObj) {
			renderApi.applyMeshToNode(mesh.spring!, springObj);
		}
	}
}
