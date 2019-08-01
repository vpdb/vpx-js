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

import { BufferGeometry, MeshStandardMaterial } from 'three';
import { Storage } from '../..';
import { IRenderable } from '../../game/irenderable';
import { Matrix3D } from '../../math/matrix3d';
import { Meshes } from '../item-data';
import { Material } from '../material';
import { Table } from '../table/table';
import { LightData } from './light-data';
import { LightMeshGenerator } from './light-mesh-generator';

/**
 * VPinball's lights.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/light.cpp
 */
export class Light implements IRenderable {

	public static readonly StateOff = 0;
	public static readonly StateOn = 1;
	public static readonly StateBlinking = 2;

	// public getters
	get color() { return this.data.color; }
	get intensity() { return this.data.intensity; }
	get falloff() { return this.data.falloff; }
	get vCenter() { return this.data.vCenter; }
	get offImage() { return this.data.szOffImage; }

	private readonly data: LightData;
	private readonly meshGenerator: LightMeshGenerator;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Light> {
		const data = await LightData.fromStorage(storage, itemName);
		return new Light(data);
	}

	private constructor(data: LightData) {
		this.data = data;
		this.meshGenerator = new LightMeshGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(table: Table): boolean {
		return true; // we filter by bulb/playfield light
	}

	public getMeshes(table: Table): Meshes {
		const light = this.meshGenerator.getMeshes(table);
		if (light.surfaceLight) {
			return {
				surfaceLight: {
					geometry: light.surfaceLight,
					map: table.getTexture(this.data.szOffImage),
				},
			};
		}
		const meshes: Meshes = {};
		if (light.light) {
			const lightMaterial = new Material();
			lightMaterial.cBase = 0;
			lightMaterial.fWrapLighting = 0.5;
			lightMaterial.bOpacityActive = true;
			lightMaterial.fOpacity = 0.2;
			lightMaterial.cGlossy = 0xFFFFFF;
			lightMaterial.bIsMetal = false;
			lightMaterial.fEdge = 1.0;
			lightMaterial.fEdgeAlpha = 1.0;
			lightMaterial.fRoughness = 0.9;
			lightMaterial.fGlossyImageLerp = 1.0;
			lightMaterial.fThickness = 0.05;
			lightMaterial.cClearcoat = 0xFFFFFF;
			lightMaterial.emissiveColor = this.data.color;
			lightMaterial.emissiveIntensity = 1;

			meshes.light = {
				mesh: light.light.transform(new Matrix3D().toRightHanded()),
				material: lightMaterial,
			};
		}

		if (light.socket) {
			const socketMaterial = new Material();
			socketMaterial.cBase = 0x181818;
			socketMaterial.fWrapLighting = 0.5;
			socketMaterial.bOpacityActive = false;
			socketMaterial.fOpacity = 1.0;
			socketMaterial.cGlossy = 0xB4B4B4;
			socketMaterial.bIsMetal = false;
			socketMaterial.fEdge = 1.0;
			socketMaterial.fEdgeAlpha = 1.0;
			socketMaterial.fRoughness = 0.9;
			socketMaterial.fGlossyImageLerp = 1.0;
			socketMaterial.fThickness = 0.05;
			socketMaterial.cClearcoat = 0;

			meshes.socket = {
				mesh: light.socket.transform(new Matrix3D().toRightHanded()),
				material: socketMaterial,
			};
		}
		return meshes;
	}

	public isBulbLight() {
		return this.data.isBulbLight();
	}

	public isSurfaceLight(table: Table) {
		return this.data.isSurfaceLight(table);
	}

	public isPlayfieldLight(table: Table) {
		return this.data.isPlayfieldLight(table);
	}

	public getPath(table: Table) {
		return this.meshGenerator.getPath(table);
	}

	public postProcessMaterial(table: Table, geometry: BufferGeometry, material: MeshStandardMaterial): MeshStandardMaterial | MeshStandardMaterial[] {
		if (!this.data.isSurfaceLight(table)) {
			return material;
		}
		material.emissiveMap = material.map;
		material.emissiveIntensity = 0;
		material.emissive.setRGB(50, 50, 50);
		material.opacity = 1;
		return material;
	}
}
