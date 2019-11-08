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

import { Mesh as ThreeMesh, MeshStandardMaterial, Object3D, PointLight, Vector2 } from '../../refs.node';
import { Enums } from '../../vpt/enums';
import { LightData } from '../../vpt/light/light-data';
import { LightState } from '../../vpt/light/light-state';
import { ThreeRenderApi } from './three-render-api';

export class ThreeLightGenerator {

	public static readonly EMISSIVE_MAP_FACTOR = 0.1;
	public static readonly BULB_FACTOR = 0.3;

	private readonly hsl: any = {};

	public createPointLight(lightData: LightData): PointLight {
		const light = new PointLight(lightData.color, lightData.state !== Enums.LightStatus.LightStateOff ? lightData.intensity * ThreeLightGenerator.BULB_FACTOR : 0, lightData.falloff * ThreeRenderApi.SCALE, 2);
		light.name = `light`;
		light.color.set(lightData.color);
		light.updateMatrixWorld();
		light.position.set(lightData.center.x, lightData.center.y, -10);
		const isSlingshotLight = ((lightData.center.x > 150 && lightData.center.x < 250) || (lightData.center.x > 600 && lightData.center.x < 750))
			&& (lightData.center.y > 1400 && lightData.center.y < 1650);
		if (ThreeRenderApi.SHADOWS && isSlingshotLight) {
			light.castShadow = true;
			light.shadow.bias = -0.001;
			light.shadow.radius = 12;
			light.shadow.mapSize = new Vector2(512, 512);
		}
		return light;
	}

	public applyLighting(state: LightState, initialIntensity: number, obj: Object3D | undefined): void {
		/* istanbul ignore next */
		if (!obj) {
			return;
		}
		for (const lightObj of obj.children) {
			if (lightObj.name === 'light') {
				const pointLight = lightObj as PointLight;
				pointLight.intensity = state.intensity * ThreeLightGenerator.BULB_FACTOR;
				pointLight.color.set(state.color);
			}
			if (lightObj.name === 'bulb.light') {
				const bulb = lightObj as ThreeMesh;
				const bulbMat = bulb.material as MeshStandardMaterial;
				bulbMat.emissiveIntensity = state.intensity / initialIntensity;
				bulbMat.color.set(state.color);
				bulbMat.emissive.set(state.color);
			}
			if (lightObj.name === 'surface.light') {
				const mat = ((lightObj as ThreeMesh).material as MeshStandardMaterial);
				mat.emissiveIntensity = state.intensity * ThreeLightGenerator.EMISSIVE_MAP_FACTOR;
				mat.emissive.set(state.color);
				mat.emissive.getHSL(this.hsl);
				mat.emissive.setHSL(this.hsl.h, this.hsl.s, this.hsl.l * 1.25);
			}
		}
	}
}
