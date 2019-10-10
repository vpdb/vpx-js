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
import {
	BufferGeometry,
	Color,
	DoubleSide,
	Group,
	Mesh as ThreeMesh,
	MeshStandardMaterial,
	Object3D,
	PointLight,
} from '../../refs.node';
import { Table, TableGenerateOptions } from '../../vpt/table/table';
import { IRenderApi, MeshConvertOptions } from '../irender-api';
import { ThreeMapGenerator } from './three-map-generator';
import { ThreeMeshGenerator } from './three-mesh-generator';
import { ThreeRenderApi } from './three-render-api';

export class ThreeConverter {

	private readonly meshGenerator: ThreeMeshGenerator;
	private readonly mapGenerator: ThreeMapGenerator;
	private readonly meshConvertOpts: MeshConvertOptions;

	constructor(meshGenerator: ThreeMeshGenerator, mapGenerator: ThreeMapGenerator, opts: MeshConvertOptions) {
		this.meshGenerator = meshGenerator;
		this.mapGenerator = mapGenerator;
		this.meshConvertOpts = opts;
	}

	public async createObject(renderable: IRenderable, table: Table, renderApi: IRenderApi<Object3D, BufferGeometry, PointLight>, opts: TableGenerateOptions): Promise<Group> {
		const objects = renderable.getMeshes(table, renderApi, opts);
		const itemGroup = new Group();
		itemGroup.matrixAutoUpdate = false;
		itemGroup.name = renderable.getName();
		let obj: RenderInfo<BufferGeometry>;
		for (obj of Object.values<RenderInfo<BufferGeometry>>(objects)) {
			const mesh = await this.createMesh(obj, table);
			itemGroup.add(mesh);
		}
		return itemGroup;
	}

	private async createMesh(obj: RenderInfo<BufferGeometry>, table: Table): Promise<ThreeMesh> {
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

		const material = await this.getMaterial(obj, table);
		const mesh = new ThreeMesh(geometry, material);
		mesh.name = (obj.geometry || obj.mesh!).name;
		mesh.matrixAutoUpdate = false;
		if (ThreeRenderApi.SHADOWS) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		return mesh;
	}

	/* istanbul ignore next: These are subject to change and are currently untested. */
	private async getMaterial(obj: RenderInfo<BufferGeometry>, table: Table): Promise<MeshStandardMaterial> {
		const material = new MeshStandardMaterial();
		const name = (obj.geometry || obj.mesh!).name;

		const materialInfo = obj.material;
		if (materialInfo && this.meshConvertOpts.applyMaterials) {
			material.name = `material:${materialInfo!.name}`;
			material.metalness = materialInfo.isMetal ? 1.0 : 0.0;
			material.roughness = Math.max(0, 1 - (materialInfo.roughness / 1.5));
			material.color = new Color(materialInfo.baseColor);
			material.opacity = materialInfo.isOpacityActive ? Math.min(1, Math.max(0, materialInfo.opacity)) : 1;
			material.side = DoubleSide;

			if (materialInfo.emissiveIntensity > 0) {
				material.emissive = new Color(materialInfo.emissiveColor);
				material.emissiveIntensity = materialInfo.emissiveIntensity;
			}
		} else {
			material.name = `material:${name}`;
		}

		if (this.meshConvertOpts.applyTextures) {
			material.transparent = !!obj.isTransparent;

			// texture
			if (obj.map) {
				const map = this.mapGenerator.getTexture(obj.map.getName());
				if (map) {
					map.name = `texture:${obj.map.getName()}`;
					material.map = map;
					material.needsUpdate = true;
				}
			}

			// normal map
			if (obj.normalMap) {
				const normalMap = this.mapGenerator.getTexture(obj.normalMap.getName());
				if (normalMap) {
					normalMap.name = `normal-map:${obj.normalMap.getName()}`;
					material.normalMap = normalMap;
					material.normalMap.anisotropy = 16;
					material.needsUpdate = true;
				}
			}

			// environment map
			if (obj.envMap) {
				const envMap = this.mapGenerator.getTexture(obj.envMap.getName());
				if (envMap) {
					envMap.name = `env-map:${obj.envMap.getName()}`;
					material.envMap = envMap;
					material.envMapIntensity = 1;
					material.needsUpdate = true;
				}
			}

			// emissive map todo TEST!
			if (obj.material && obj.material.emissiveMap) {
				const emissiveMap = this.mapGenerator.getTexture(obj.material.emissiveMap.getName());
				if (emissiveMap) {
					emissiveMap.name = `emissive-map:${obj.material.emissiveMap.getName()}`;
					material.emissiveMap = emissiveMap;
					material.needsUpdate = true;
				}
			}
		}
		return material;
	}
}
