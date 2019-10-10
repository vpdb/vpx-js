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

import { IRenderable, RenderInfo } from '../../game/irenderable';
import { BufferGeometry, Group, Mesh as ThreeMesh, Object3D, PointLight } from '../../refs.node';
import { ItemState } from '../../vpt/item-state';
import { Table, TableGenerateOptions } from '../../vpt/table/table';
import { IRenderApi, MeshConvertOptions } from '../irender-api';
import { ThreeMapGenerator } from './three-map-generator';
import { ThreeMaterialGenerator } from './three-material-generator';
import { ThreeMeshGenerator } from './three-mesh-generator';
import { ThreeRenderApi } from './three-render-api';

export class ThreeConverter {

	private readonly meshGenerator: ThreeMeshGenerator;
	private readonly mapGenerator: ThreeMapGenerator;
	private readonly materialGenerator: ThreeMaterialGenerator;
	private readonly meshConvertOpts: MeshConvertOptions;

	constructor(meshGenerator: ThreeMeshGenerator, mapGenerator: ThreeMapGenerator, materialGenerator: ThreeMaterialGenerator, opts: MeshConvertOptions) {
		this.meshGenerator = meshGenerator;
		this.mapGenerator = mapGenerator;
		this.materialGenerator = materialGenerator;
		this.meshConvertOpts = opts;
	}

	public async createObject(renderable: IRenderable<ItemState>, table: Table, renderApi: IRenderApi<Object3D, BufferGeometry, PointLight>, opts: TableGenerateOptions): Promise<Group> {
		const objects = renderable.getMeshes(table, renderApi, opts);
		const itemGroup = new Group();
		itemGroup.matrixAutoUpdate = false;
		itemGroup.name = renderable.getName();
		itemGroup.visible = renderable.getState().isVisible;
		let obj: RenderInfo<BufferGeometry>;
		for (obj of Object.values<RenderInfo<BufferGeometry>>(objects)) {
			const mesh = await this.createMesh(obj);
			itemGroup.add(mesh);
		}
		return itemGroup;
	}

	private async createMesh(obj: RenderInfo<BufferGeometry>): Promise<ThreeMesh> {
		/* istanbul ignore if */
		if (!obj.geometry && !obj.mesh) {
			throw new Error('Mesh export must either provide mesh or geometry.');
		}
		let geometry: BufferGeometry;
		if (obj.geometry) {
			geometry = obj.geometry;

		} else if (obj.mesh) {
			geometry = this.meshGenerator.convertToBufferGeometry(obj.mesh);

		/* istanbul ignore next: Should not happen. */
		} else {
			throw new Error('Either `geometry` or `mesh` must be defined!');
		}

		const material = this.materialGenerator.getInitialMaterial(obj, this.meshConvertOpts);
		const mesh = new ThreeMesh(geometry, material);
		mesh.name = (obj.geometry || obj.mesh!).name;
		mesh.matrixAutoUpdate = false;
		if (ThreeRenderApi.SHADOWS) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		return mesh;
	}
}
