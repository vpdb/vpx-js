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

import {
	BufferGeometry,
	Color,
	DoubleSide,
	Group,
	Mesh as ThreeMesh,
	MeshStandardMaterial,
	Object3D,
	PointLight,
	RGBAFormat,
	RGBFormat,
	Texture as ThreeTexture,
} from 'three';
import { IRenderable, RenderInfo } from '../../game/irenderable';
import { IImage } from '../../gltf/image';
import { logger } from '../../util/logger';
import { Table, TableGenerateOptions } from '../../vpt/table/table';
import { Texture } from '../../vpt/texture';
import { IRenderApi, MeshConvertOptions } from '../irender-api';
import { ThreeMeshGenerator } from './three-mesh-generator';

export class ThreeConverter {

	private readonly meshConvertOpts: MeshConvertOptions;

	constructor(opts: MeshConvertOptions) {
		this.meshConvertOpts = opts;
	}

	public async createObject(renderable: IRenderable, table: Table, renderApi: IRenderApi<Object3D, BufferGeometry, PointLight>, opts: TableGenerateOptions): Promise<Group> {
		const objects = renderable.getMeshes(table, renderApi, opts);
		const itemGroup = new Group();
		itemGroup.matrixAutoUpdate = false;
		itemGroup.name = renderable.getName();
		let obj: RenderInfo<BufferGeometry>;
		for (obj of Object.values<RenderInfo<BufferGeometry>>(objects)) {
			const mesh = await this.createMesh(renderable, obj, table);
			itemGroup.add(mesh);
		}
		return itemGroup;
	}

	private async createMesh(renderable: IRenderable, obj: RenderInfo<BufferGeometry>, table: Table): Promise<ThreeMesh> {
		/* istanbul ignore if */
		if (!obj.geometry && !obj.mesh) {
			throw new Error('Mesh export must either provide mesh or geometry.');
		}
		let geometry: BufferGeometry;
		if (obj.geometry) {
			geometry = obj.geometry;

		} else if (obj.mesh) {
			const generator = new ThreeMeshGenerator(obj.mesh);
			geometry = generator.convertToBufferGeometry();

		/* istanbul ignore next: Should not happen. */
		} else {
			throw new Error('Either `geometry` or `mesh` must be defined!');
		}

		const material = await this.getMaterial(obj, table);
		const mesh = new ThreeMesh(geometry, material);
		mesh.name = (obj.geometry || obj.mesh!).name;
		mesh.matrixAutoUpdate = false;

		return mesh;
	}

	/* istanbul ignore next: These are subject to change and are currently untested. */
	private async getMaterial(obj: RenderInfo<BufferGeometry>, table: Table): Promise<MeshStandardMaterial> {
		const material = new MeshStandardMaterial();
		const name = (obj.geometry || obj.mesh!).name;
		material.name = `material:${name}`;
		const materialInfo = obj.material;
		if (materialInfo && this.meshConvertOpts.applyMaterials) {
			material.metalness = materialInfo.isMetal ? 1.0 : 0.0;
			material.roughness = Math.max(0, 1 - (materialInfo.roughness / 1.5));
			material.color = new Color(materialInfo.baseColor);
			material.opacity = materialInfo.isOpacityActive ? Math.min(1, Math.max(0, materialInfo.opacity)) : 1;
			material.transparent = materialInfo.isOpacityActive && materialInfo.opacity < 0.98;
			material.side = DoubleSide;

			if (materialInfo.emissiveIntensity > 0) {
				material.emissive = new Color(materialInfo.emissiveColor);
				material.emissiveIntensity = materialInfo.emissiveIntensity;
			}
		}

		if (this.meshConvertOpts.applyTextures) {
			if (obj.map) {
				material.map = new ThreeTexture();
				material.map.name = 'texture:' + obj.map.getName();
				if (await this.loadMap(name, obj.map, material.map, table)) {
					if ((material.map.image as IImage).containsTransparency()) {
						material.transparent = true;
					}
					material.needsUpdate = true;
				} else {
					logger().warn('[ThreeConverter.getMaterial] Error getting map.');
					material.map = null;
				}
			}
			if (obj.normalMap) {
				material.normalMap = new ThreeTexture();
				material.normalMap.name = 'normal-map:' + obj.normalMap.getName();
				if (await this.loadMap(name, obj.normalMap, material.normalMap, table)) {
					material.normalMap.anisotropy = 16;
					material.needsUpdate = true;
				} else {
					material.normalMap = null;
				}
			}
			// todo TEST!
			if (obj.material && obj.material.emissiveMap) {
				material.emissiveMap = new ThreeTexture();
				material.emissiveMap.name = 'emissive-map:' + obj.material.emissiveMap.getName();
				if (await this.loadMap(name, obj.material.emissiveMap, material.emissiveMap, table)) {
					if ((material.emissiveMap.image as IImage).containsTransparency()) {
						material.transparent = true;
					}
					material.needsUpdate = true;
				} else {
					logger().warn('[ThreeConverter.getMaterial] Error getting map.');
					material.map = null;
				}
			}
		}
		return material;
	}

	/* istanbul ignore next: Texture extraction is tested, but applying them to three.js is out of scope. */
	private async loadMap(name: string, texture: Texture, threeMaterial: ThreeTexture, table: Table): Promise<boolean> {
		try {
			const image = await texture.getImage(table);
			threeMaterial.image = image;
			threeMaterial.format = image.hasTransparency() ? RGBAFormat : RGBFormat;
			threeMaterial.needsUpdate = true;
			return true;
		} catch (err) {
			threeMaterial.image = ThreeTexture.DEFAULT_IMAGE;
			logger().warn('[ThreeConverter.loadMap] Error loading map %s (%s/%s): %s', name, texture.storageName, texture.getName(), err.message);
			return false;
		}
	}
}
