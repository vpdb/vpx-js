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

import { IRenderable, RenderInfo } from '../lib/game/irenderable';
import { Matrix3D } from '../lib/math/matrix3d';
import { IRenderApi } from '../lib/render/irender-api';
import { ItemState } from '../lib/vpt/item-state';
import { LightData } from '../lib/vpt/light/light-data';
import { LightState } from '../lib/vpt/light/light-state';
import { Material } from '../lib/vpt/material';
import { Mesh } from '../lib/vpt/mesh';
import { Table, TableGenerateOptions } from '../lib/vpt/table/table';
import { Texture } from '../lib/vpt/texture';

export class TestRenderApi implements IRenderApi<any, any, any> {
	public addChildToParent(parent: any, child: any): void {
	}

	public applyLighting(state: LightState, initialIntensity: number, node: any | undefined): void {
	}

	public applyMaterial(node: any | undefined, material?: Material, map?: string, normalMap?: string, envMap?: string, emissiveMap?: string): void {
	}

	public applyMatrixToNode(matrix: Matrix3D, node: any | undefined): void {
	}

	public applyMeshToNode(mesh: Mesh, node: any | undefined): void {
	}

	public applyVisibility(isVisible: boolean, node: any | undefined): void {
	}

	public createLightGeometry(lightData: LightData, table: Table): any {
		return {};
	}

	public createMesh(obj: RenderInfo<any>): any {
		return {};
	}

	public createObjectFromRenderable(renderable: IRenderable<ItemState>, table: Table, opts: TableGenerateOptions): any {
		return {};
	}

	public createParentNode(name: string): any {
		return {};
	}

	public createPlayfieldGeometry(table: Table, opts: TableGenerateOptions): any {
		return {};
	}

	public createPointLight(lightData: LightData): any {
		return undefined;
	}

	public findInGroup(parent: any, name: string): any | undefined {
		return {};
	}

	public preloadTextures(textures: Texture[], table: Table): Promise<void> {
		return Promise.resolve();
	}

	public removeChildren(node: any | undefined): void {
	}

	public removeFromParent(parent: any, child: any | undefined): void {
	}

	public transformScene(scene: any, table: Table): void {
	}
}
