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

import { EventProxy } from '../../game/event-proxy';
import { IAnimatable, IAnimation } from '../../game/ianimatable';
import { IRenderable, Meshes } from '../../game/irenderable';
import { IScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { Matrix3D } from '../../math/matrix3d';
import { IRenderApi } from '../../render/irender-api';
import { Item } from '../item';
import { Material } from '../material';
import { Table } from '../table/table';
import { LightAnimation } from './light-animation';
import { LightApi } from './light-api';
import { LightData } from './light-data';
import { LightMeshGenerator } from './light-mesh-generator';
import { LightState } from './light-state';
import { LightUpdater } from './light-updater';

/**
 * VPinball's lights.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/light.cpp
 */
export class Light extends Item<LightData> implements IRenderable<LightState>, IAnimatable, IScriptable<LightApi> {

	// public getters
	get color() { return this.data.color; }
	get intensity() { return this.data.intensity; }
	get falloff() { return this.data.falloff; }
	get vCenter() { return this.data.center; }
	get offImage() { return this.data.szOffImage; }

	public readonly data: LightData;
	private readonly state: LightState;
	private readonly meshGenerator: LightMeshGenerator;
	private readonly updater: LightUpdater;
	private api?: LightApi;
	private animation?: LightAnimation;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Light> {
		const data = await LightData.fromStorage(storage, itemName);
		return new Light(data);
	}

	private constructor(data: LightData) {
		super(data);
		this.state = LightState.claim(this.getName(), 0);
		this.data = data;
		this.meshGenerator = new LightMeshGenerator(data);
		this.updater = new LightUpdater(this.state);
	}

	public isVisible(table: Table): boolean {
		return this.data.isVisible; // we filter by bulb/playfield light
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.animation = new LightAnimation(this.data, this.state);
		this.api = new LightApi(this.animation, this.data, this.events, player, table);
	}

	public getApi(): LightApi {
		return this.api!;
	}

	public getAnimation(): IAnimation {
		return this.animation!;
	}

	public getState(): LightState {
		return this.state!;
	}

	public getUpdater(): LightUpdater {
		return this.updater;
	}

	public getEventNames(): string[] {
		return [ 'Init', 'Timer' ];
	}

	public getMeshes<NODE, GEOMETRY, POINT_LIGHT>(table: Table, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>): Meshes<GEOMETRY> {
		const light = this.meshGenerator.getMeshes(table, renderApi);
		if (light.surfaceLight) {
			return {
				surfaceLight: {
					isVisible: this.data.isVisible,
					geometry: light.surfaceLight,
					map: table.getTexture(this.data.szOffImage),
					material: this.getSurfaceMaterial(table),
				},
			};
		}
		const meshes: Meshes<GEOMETRY> = {};
		if (light.light) {
			const lightMaterial = new Material();
			lightMaterial.baseColor = 0;
			lightMaterial.wrapLighting = 0.5;
			lightMaterial.isOpacityActive = true;
			lightMaterial.opacity = 0.2;
			lightMaterial.glossiness = 0xFFFFFF;
			lightMaterial.isMetal = false;
			lightMaterial.edge = 1.0;
			lightMaterial.edgeAlpha = 1.0;
			lightMaterial.roughness = 0.9;
			lightMaterial.glossyImageLerp = 1.0;
			lightMaterial.thickness = 0.05;
			lightMaterial.clearCoat = 0xFFFFFF;
			lightMaterial.emissiveColor = this.data.color;
			lightMaterial.emissiveIntensity = 1;

			meshes.light = {
				isVisible: this.data.isVisible,
				mesh: light.light.transform(Matrix3D.RIGHT_HANDED),
				material: lightMaterial,
			};
		}

		if (light.socket) {
			const socketMaterial = new Material();
			socketMaterial.baseColor = 0x181818;
			socketMaterial.wrapLighting = 0.5;
			socketMaterial.isOpacityActive = false;
			socketMaterial.opacity = 1.0;
			socketMaterial.glossiness = 0xB4B4B4;
			socketMaterial.isMetal = false;
			socketMaterial.edge = 1.0;
			socketMaterial.edgeAlpha = 1.0;
			socketMaterial.roughness = 0.9;
			socketMaterial.glossyImageLerp = 1.0;
			socketMaterial.thickness = 0.05;
			socketMaterial.clearCoat = 0;

			meshes.socket = {
				isVisible: this.data.isVisible,
				mesh: light.socket.transform(Matrix3D.RIGHT_HANDED),
				material: socketMaterial,
			};
		}
		return meshes;
	}

	public getSurfaceMaterial(table: Table): Material {
		const material = new Material();
		material.emissiveMap = table.getTexture(this.data.szOffImage);
		material.emissiveIntensity = 0;
		material.emissiveColor =  0x808080;
		material.opacity = 1;
		return material;
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
}
