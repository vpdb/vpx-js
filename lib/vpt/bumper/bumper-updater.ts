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
import { Material } from '../material';
import { Table } from '../table/table';
import { BumperState } from './bumper-state';

export class BumperUpdater extends ItemUpdater<BumperState> {

	constructor(state: BumperState) {
		super(state);
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BumperState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		// update local state
		Object.assign(this.state, state);

		if (state.baseMaterial || state.isBaseVisible !== undefined) {
			const child = renderApi.findInGroup(obj, `bumper-base-${state.name}`)!;
			const material = table.getMaterial(this.state.baseMaterial);
			if (material && material.isOpacityActive) {
				this.applyChild(child, state.isBaseVisible, material, renderApi);
			}
		}
		if (state.capMaterial || state.isCapVisible !== undefined) {
			const child = renderApi.findInGroup(obj, `bumper-cap-${state.name}`)!;
			const material = table.getMaterial(this.state.capMaterial);
			if (material && material.isOpacityActive) {
				this.applyChild(child, state.isCapVisible, material, renderApi);
			}
		}
		if (state.ringMaterial || state.isRingVisible !== undefined) {
			const child = renderApi.findInGroup(obj, `bumper-ring-${state.name}`)!;
			const material = table.getMaterial(this.state.ringMaterial);
			if (material && material.isOpacityActive) {
				this.applyChild(child, state.isRingVisible, material, renderApi);
			}
		}
		if (state.skirtMaterial || state.isSkirtVisible !== undefined) {
			const child = renderApi.findInGroup(obj, `bumper-socket-${state.name}`)!;
			const material = table.getMaterial(this.state.skirtMaterial);
			if (material && material.isOpacityActive) {
				this.applyChild(child, state.isSkirtVisible, material, renderApi);
			}
		}
	}

	private applyChild<NODE, GEOMETRY, POINT_LIGHT>(child: NODE, isVisible: boolean | undefined, material: Material, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>): void {

		// visibility
		if (isVisible !== undefined) {
			renderApi.applyVisibility(isVisible, child);
		}

		// material
		if (material) {
			renderApi.applyMaterial(child, material);
		}
	}

}
