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

import { RenderInfo } from '../../game/irenderable';
import { Matrix3D } from '../../math/matrix3d';
import { IRenderApi } from '../../render/irender-api';
import { ItemUpdater } from '../item-updater';
import { Table } from '../table/table';
import { RampMeshGenerator } from './ramp-mesh-generator';
import { RampState } from './ramp-state';

export class RampUpdater extends ItemUpdater<RampState> {

	private meshGenerator: RampMeshGenerator;

	constructor(state: RampState, meshGenerator: RampMeshGenerator) {
		super(state);
		this.meshGenerator = meshGenerator;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: RampState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		// update local state
		Object.assign(this.state, state);

		const material = table.getMaterial(this.state.material);
		if (!material || !material.isOpacityActive) {
			return;
		}

		this.applyVisibility(obj, state, renderApi);
		this.applyMaterial(obj, state.material, state.texture, renderApi, table);

		if (this.mustUpdateGeometry(state)) {
			if (state.type === undefined) {
				this.updateMeshes(obj, renderApi, table);
			} else {
				this.replaceMeshes(obj, renderApi, table);
			}
		}
	}

	private updateMeshes<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {
		const ramp = this.meshGenerator.generateMeshes(table);
		if (ramp.wire1) {
			const node = renderApi.findInGroup(obj, `ramp.wire1-${this.state.getName()}`);
			renderApi.applyMeshToNode(ramp.wire1.transform(Matrix3D.RIGHT_HANDED), node);
		}
		if (ramp.wire2) {
			const node = renderApi.findInGroup(obj, `ramp.wire2-${this.state.getName()}`);
			renderApi.applyMeshToNode(ramp.wire2.transform(Matrix3D.RIGHT_HANDED), node);
		}
		if (ramp.wire3) {
			const node = renderApi.findInGroup(obj, `ramp.wire3-${this.state.getName()}`);
			renderApi.applyMeshToNode(ramp.wire3.transform(Matrix3D.RIGHT_HANDED), node);
		}
		if (ramp.wire4) {
			const node = renderApi.findInGroup(obj, `ramp.wire4-${this.state.getName()}`);
			renderApi.applyMeshToNode(ramp.wire4.transform(Matrix3D.RIGHT_HANDED), node);
		}
		if (ramp.floor) {
			const node = renderApi.findInGroup(obj, `ramp.floor-${this.state.getName()}`);
			renderApi.applyMeshToNode(ramp.floor.transform(Matrix3D.RIGHT_HANDED), node);
		}
		if (ramp.left) {
			const node = renderApi.findInGroup(obj, `ramp.left-${this.state.getName()}`);
			renderApi.applyMeshToNode(ramp.left.transform(Matrix3D.RIGHT_HANDED), node);
		}
		if (ramp.right) {
			const node = renderApi.findInGroup(obj, `ramp.right-${this.state.getName()}`);
			renderApi.applyMeshToNode(ramp.right.transform(Matrix3D.RIGHT_HANDED), node);
		}
	}

	private replaceMeshes<NODE, GEOMETRY, POINT_LIGHT>(itemGroup: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {
		const material = table.getMaterial(this.state.material);
		const objects = this.meshGenerator.getMeshes<GEOMETRY>(!material || material.isOpacityActive, table);
		renderApi.removeChildren(itemGroup);
		let obj: RenderInfo<GEOMETRY>;
		for (obj of Object.values<RenderInfo<GEOMETRY>>(objects)) {
			const mesh = renderApi.createMesh(obj);
			renderApi.addChildToParent(itemGroup, mesh);
		}
	}

	private mustUpdateGeometry(state: RampState): boolean {
		return state.type !== undefined
			|| state.leftWallHeightVisible !== undefined
			|| state.rightWallHeightVisible !== undefined
			|| state.heightBottom !== undefined
			|| state.heightTop !== undefined
			|| state.widthTop !== undefined
			|| state.widthBottom !== undefined
			|| state.leftWallHeight !== undefined
			|| state.rightWallHeight !== undefined
			|| state.textureAlignment !== undefined;
	}
}
