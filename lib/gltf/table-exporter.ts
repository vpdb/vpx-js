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
	Color,
	DoubleSide,
	Group,
	Mesh,
	MeshStandardMaterial,
	PointLight,
	RGBAFormat,
	RGBFormat,
	Scene,
	Texture,
} from 'three';
import { Table } from '..';
import { IRenderable, RenderInfo } from '../game/irenderable';
import { exportGltf } from '../refs.node';
import { logger } from '../util/logger';
import { Bumper } from '../vpt/bumper/bumper';
import { Flipper } from '../vpt/flipper/flipper';
import { Primitive } from '../vpt/primitive/primitive';
import { Ramp } from '../vpt/ramp/ramp';
import { Rubber } from '../vpt/rubber/rubber';
import { Surface } from '../vpt/surface/surface';
import { Texture as VpTexture } from '../vpt/texture';
import { IImage } from './image';

export class TableExporter {

	private static readonly scale = 0.05;
	private readonly table: Table;
	private readonly scene: Scene;
	private readonly opts: VpTableExporterOptions;
	private readonly playfield: Group;
	private readonly images: Map<string, IImage> = new Map();

	constructor(table: Table, opts: VpTableExporterOptions) {
		this.opts = Object.assign({}, defaultOptions, opts);

		const dim = table.getDimensions();
		this.table = table;
		this.scene = new Scene();
		this.scene.name = 'vpdb-table';
		this.playfield = new Group();
		this.playfield.name = 'playfield';
		this.playfield.rotateX(Math.PI / 2);
		this.playfield.translateY(-dim.height * TableExporter.scale / 2);
		this.playfield.translateX(-dim.width * TableExporter.scale / 2);
		this.playfield.scale.set(TableExporter.scale, TableExporter.scale, TableExporter.scale);
	}

	public async exportGltf(): Promise<string> {
		this.opts.gltfOptions!.binary = false;
		return JSON.stringify(await this.export<any>());
	}

	public async exportGlb(): Promise<Buffer> {
		this.opts.gltfOptions!.binary = true;
		return await this.export<Buffer>();
	}

	public async createScene(): Promise<Scene> {

		const renderGroups: IRenderGroup[] = [
			{ name: 'playfield', meshes: [ this.table ], enabled: !!this.opts.exportPlayfield },
			{ name: 'primitives', meshes: Object.values<Primitive>(this.table.primitives), enabled: !!this.opts.exportPrimitives },
			{ name: 'rubbers', meshes: Object.values<Rubber>(this.table.rubbers), enabled: !!this.opts.exportRubbers },
			{ name: 'surfaces', meshes: Object.values<Surface>(this.table.surfaces), enabled: !!this.opts.exportSurfaces},
			{ name: 'flippers', meshes: Object.values<Flipper>(this.table.flippers), enabled: !!this.opts.exportFlippers},
			{ name: 'bumpers', meshes: Object.values<Bumper>(this.table.bumpers), enabled: !!this.opts.exportBumpers },
			{ name: 'ramps', meshes: Object.values<Ramp>(this.table.ramps), enabled: !!this.opts.exportRamps },
			{ name: 'lightBulbs', meshes: this.table.lights.filter(l => l.isBulbLight()), enabled: !!this.opts.exportLightBulbs },
			{ name: 'playfieldLights', meshes: this.table.lights.filter(l => l.isSurfaceLight(this.table)), enabled: !!this.opts.exportPlayfieldLights },
			{ name: 'hitTargets', meshes: this.table.hitTargets, enabled: !!this.opts.exportHitTargets },
			{ name: 'gates', meshes: this.table.gates, enabled: !!this.opts.exportGates },
			{ name: 'kickers', meshes: this.table.kickers, enabled: !!this.opts.exportKickers },
			{ name: 'triggers', meshes: this.table.triggers, enabled: !!this.opts.exportTriggers },
			{ name: 'spinners', meshes: this.table.spinners, enabled: !!this.opts.exportSpinners },
			{ name: 'plungers', meshes: this.table.plungers, enabled: !!this.opts.exportPlungers },
		];

		// meshes
		for (const group of renderGroups) {
			if (!group.enabled) {
				continue;
			}
			const itemTypeGroup = new Group();
			itemTypeGroup.name = group.name;
			for (const renderable of group.meshes.filter(i => i.isVisible(this.table))) {
				const objects = renderable.getMeshes(this.table, this.opts);
				let obj: RenderInfo;
				const itemGroup = new Group();
				itemGroup.name = renderable.getName();
				for (obj of Object.values(objects)) {
					/* istanbul ignore if */
					if (!obj.geometry && !obj.mesh) {
						throw new Error('Mesh export must either provide mesh or geometry.');
					}
					const geometry = obj.geometry || obj.mesh!.getBufferGeometry();
					const material = await this.getMaterial(obj);
					const postProcessedMaterial = renderable.postProcessMaterial ? renderable.postProcessMaterial(this.table, geometry, material) : material;
					const mesh = new Mesh(geometry, postProcessedMaterial);
					mesh.name = (obj.geometry || obj.mesh!).name;
					itemGroup.add(mesh);
				}
				itemTypeGroup.add(itemGroup);
			}
			if (itemTypeGroup.children.length > 0) {
				this.playfield.add(itemTypeGroup);
			}
		}

		const lightGroup = new Group();
		lightGroup.name = 'lights';

		// light bulb lights
		if (this.opts.exportLightBulbLights) {
			for (const lightInfo of this.table.lights.filter(l => l.isBulbLight())) {
				const light = new PointLight(lightInfo.color, lightInfo.intensity, lightInfo.falloff * TableExporter.scale, 2);
				const itemGroup = new Group();
				itemGroup.name = lightInfo.getName();
				light.name = 'light:' + lightInfo.getName();
				light.position.set(lightInfo.vCenter.x, lightInfo.vCenter.y, -17);
				itemGroup.add(light);
				lightGroup.add(itemGroup);
			}
		}

		// playfield lights
		// if (this.opts.exportPlayfieldLights) {
		// 	for (const lightInfo of this.table.lights.filter(l => l.isSurfaceLight(this.table)).slice(0, 10)) {
		// 		const light = new PointLight(lightInfo.color, lightInfo.intensity, lightInfo.falloff * TableExporter.scale, 2);
		// 		light.name = 'light:' + lightInfo.getName();
		// 		light.position.set(lightInfo.vCenter.x, lightInfo.vCenter.y, 10);
		// 		lightGroup.add(light);
		// 	}
		// }

		if (lightGroup.children.length > 0) {
			this.playfield.add(lightGroup);
		}

		// finally, add to scene
		this.scene.add(this.playfield);

		return this.scene;
	}

	private async export<T>(): Promise<T> {

		await this.createScene();

		// now, export to GLTF
		return exportGltf(this.scene, this.opts, this.opts.gltfOptions);
	}

	private async getMaterial(obj: RenderInfo): Promise<MeshStandardMaterial> {
		const material = new MeshStandardMaterial();
		const name = (obj.geometry || obj.mesh!).name;
		material.name = `material:${name}`;
		const materialInfo = obj.material;
		if (materialInfo && this.opts.applyMaterials) {
			material.metalness = materialInfo.bIsMetal ? 1.0 : 0.0;
			material.roughness = Math.max(0, 1 - (materialInfo.fRoughness / 1.5));
			material.color = new Color(materialInfo.cBase);
			material.opacity = materialInfo.bOpacityActive ? Math.min(1, Math.max(0, materialInfo.fOpacity)) : 1;
			material.transparent = materialInfo.bOpacityActive && materialInfo.fOpacity < 0.98;
			material.side = DoubleSide;

			if (materialInfo.emissiveIntensity > 0) {
				material.emissive = new Color(materialInfo.emissiveColor);
				material.emissiveIntensity = materialInfo.emissiveIntensity;
			}
		}

		if (this.opts.applyTextures) {
			if (obj.map) {
				material.map = new Texture();
				material.map.name = 'texture:' + obj.map.getName();
				if (await this.loadMap(name, obj.map, material.map)) {
					if ((material.map.image as IImage).containsTransparency()) {
						material.transparent = true;
					}
					material.needsUpdate = true;
				} else {
					logger().warn('[VpTableExporter.getMaterial] Error getting map.');
					material.map = null;
				}
			}
			if (obj.normalMap) {
				material.normalMap = new Texture();
				material.normalMap.name = 'normal-map:' + obj.normalMap.getName();
				if (await this.loadMap(name, obj.normalMap, material.normalMap)) {
					material.normalMap.anisotropy = 16;
					material.needsUpdate = true;
				} else {
					material.normalMap = null;
				}
			}
		}
		return material;
	}

	private async loadMap(name: string, texture: VpTexture, threeMaterial: Texture): Promise<boolean> {
		try {
			let image: IImage;
			if (this.images.has(texture.getName())) {
				image = this.images.get(texture.getName())!;
			} else {
				image = await texture.getImage(this.table);
				this.images.set(texture.getName(), image);
			}
			threeMaterial.image = image;
			threeMaterial.format = image.hasTransparency() ? RGBAFormat : RGBFormat;
			threeMaterial.needsUpdate = true;
			return true;
		} catch (err) {
			threeMaterial.image = Texture.DEFAULT_IMAGE;
			logger().warn('[VpTableExporter.loadMap] Error loading map %s (%s/%s): %s', name, texture.storageName, texture.getName(), err.message);
			return false;
		}
	}
}

interface IRenderGroup {
	name: string;
	meshes: IRenderable[];
	enabled: boolean;
}

export interface VpTableExporterOptions {
	applyMaterials?: boolean;
	applyTextures?: boolean;
	optimizeTextures?: boolean;
	exportPlayfield?: boolean;
	exportPrimitives?: boolean;
	exportRubbers?: boolean;
	exportSurfaces?: boolean;
	exportFlippers?: boolean;
	exportBumpers?: boolean;
	exportRamps?: boolean;
	exportLightBulbs?: boolean;
	exportPlayfieldLights?: boolean;
	exportLightBulbLights?: boolean;
	exportHitTargets?: boolean;
	exportGates?: boolean;
	exportKickers?: boolean;
	exportTriggers?: boolean;
	exportSpinners?: boolean;
	exportPlungers?: boolean;
	gltfOptions?: ParseOptions;
}

const defaultOptions: VpTableExporterOptions = {
	applyMaterials: true,
	applyTextures: true,
	optimizeTextures: false,
	exportPlayfield: true,
	exportPrimitives: true,
	exportRubbers: true,
	exportSurfaces: true,
	exportFlippers: true,
	exportBumpers: true,
	exportRamps: true,
	exportPlayfieldLights: false,
	exportLightBulbs: true,
	exportLightBulbLights: true,
	exportHitTargets: true,
	exportGates: true,
	exportKickers: true,
	exportTriggers: true,
	exportSpinners: true,
	exportPlungers: true,
	gltfOptions: {},
};

export interface ParseOptions {
	binary?: boolean;
	optimizeImages?: boolean;
	trs?: boolean;
	onlyVisible?: boolean;
	truncateDrawRange?: boolean;
	embedImages?: boolean;
	animations?: any[];
	forceIndices?: boolean;
	forcePowerOfTwoTextures?: boolean;
	compressVertices?: boolean;
	versionString?: string;
	dracoOptions?: {
		compressionLevel?: number;
		quantizePosition?: number;
		quantizeNormal?: number;
		quantizeTexcoord?: number;
		quantizeColor?: number;
		quantizeSkin?: number;
		unifiedQuantization?: boolean;
	};
}
