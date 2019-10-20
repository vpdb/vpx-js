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
import { SurfaceData } from './surface-data';
import { SurfaceState } from './surface-state';

export class SurfaceUpdater extends ItemUpdater<SurfaceState> {

	private readonly data: SurfaceData;
	private isDynamic?: boolean;

	constructor(state: SurfaceState, data: SurfaceData) {
		super(state);
		this.data = data;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: SurfaceState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		if (this.isDynamic === undefined) {
			if (this.data.isSideVisible) {
				const sideMaterial = table.getMaterial(this.data.szSideMaterial);
				if (sideMaterial && sideMaterial.isOpacityActive) {
					this.isDynamic = true;
				}
			}
			if (this.data.isTopBottomVisible) {
				const topMaterial = table.getMaterial(this.data.szTopMaterial);
				if (topMaterial && topMaterial.isOpacityActive) {
					this.isDynamic = true;
				}
			}
		}

		if (this.data.isDroppable || this.isDynamic) {
			this.applyTopState(obj, state, renderApi, table);
			this.applySideState(obj, state, renderApi, table);
		}

		if (state.isDropped !== undefined) {
			const matrix = Matrix3D.claim();
			if (state.isDropped) {
				matrix.setTranslation(0, 0, this.data.heightTop - 0.01);
			}
			renderApi.applyMatrixToNode(matrix, obj);
			Matrix3D.release(matrix);
		}
	}

	public applyTopState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: SurfaceState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {
		const topObj = renderApi.findInGroup(obj, `surface.top-${this.state.getName()}`);
		if (state.isTopVisible !== undefined) {
			renderApi.applyVisibility(state.isTopVisible, topObj);
		}
		this.applyMaterial(topObj, state.topMaterial, state.topTexture, renderApi, table);
	}

	public applySideState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: SurfaceState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {
		const sideObj = renderApi.findInGroup(obj, `surface.side-${this.state.getName()}`);
		if (state.isSideVisible !== undefined) {
			renderApi.applyVisibility(state.isSideVisible, sideObj);
		}
		this.applyMaterial(sideObj, state.sideMaterial, state.sideTexture, renderApi, table);
	}
}
