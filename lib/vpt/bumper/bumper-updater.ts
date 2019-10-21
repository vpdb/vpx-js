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
import { Material } from '../material';
import { Table } from '../table/table';
import { BumperData } from './bumper-data';
import { BumperState } from './bumper-state';

export class BumperUpdater extends ItemUpdater<BumperState> {

	private readonly data: BumperData;

	constructor(state: BumperState, data: BumperData) {
		super(state);
		this.data = data;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BumperState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		// update local state
		Object.assign(this.state, state);

		this.applyAnimationState(obj, state, renderApi, table);

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

	private applyAnimationState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BumperState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table) {

		if (state.ringOffset !== undefined) {
			this.applyRingState(obj, state, renderApi);
		}
		if (state.skirtRotX !== undefined || state.skirtRotY !== undefined) {
			this.applySkirtState(obj, state, renderApi, table);
		}
	}

	private applyRingState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BumperState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>) {
		const ringObj = renderApi.findInGroup(obj, `bumper-ring-${this.state.getName()}`);
		if (ringObj) {
			const matrix = Matrix3D.claim().setTranslation(0, 0, -state.ringOffset);
			renderApi.applyMatrixToNode(matrix, ringObj);
			Matrix3D.release(matrix);
		}
	}

	/* istanbul ignore next: this looks weird. test when sure it's the correct "animation" */
	private applySkirtState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BumperState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table) {
		const skirtObj = renderApi.findInGroup(obj, `bumper-socket-${this.state.getName()}`);
		if (skirtObj) {
			const height = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y) * table.getScaleZ();
			const matToOrigin = Matrix3D.claim().setTranslation(-this.data.center.x, -this.data.center.y, height);
			const matFromOrigin = Matrix3D.claim().setTranslation(this.data.center.x, this.data.center.y, -height);
			const matRotX = Matrix3D.claim().rotateXMatrix(degToRad(this.state.skirtRotX));
			const matRotY = Matrix3D.claim().rotateYMatrix(degToRad(this.state.skirtRotY));

			const matrix = matToOrigin.multiply(matRotY).multiply(matRotX).multiply(matFromOrigin);

			renderApi.applyMatrixToNode(matrix, skirtObj);
			Matrix3D.release(matToOrigin, matFromOrigin, matRotX, matRotY);
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
