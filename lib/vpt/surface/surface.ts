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
import { IHittable } from '../../game/ihittable';
import { IRenderable, Meshes } from '../../game/irenderable';
import { IScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { Matrix3D } from '../../math/matrix3d';
import { HitObject } from '../../physics/hit-object';
import { IRenderApi } from '../../render/irender-api';
import { Item } from '../item';
import { Table } from '../table/table';
import { SurfaceApi } from './surface-api';
import { SurfaceData } from './surface-data';
import { SurfaceHitGenerator } from './surface-hit-generator';
import { SurfaceMeshGenerator } from './surface-mesh-generator';
import { SurfaceState } from './surface-state';
import { SurfaceUpdater } from './surface-updater';

/**
 * VPinball's surfaces, a.k.a as "walls".
 *
 * @see https://github.com/vpinball/vpinball/blob/master/surface.cpp
 */
export class Surface extends Item<SurfaceData> implements IRenderable<SurfaceState>, IHittable, IScriptable<SurfaceApi> {

	private readonly state: SurfaceState;
	private readonly itemName: string;
	private readonly meshGenerator: SurfaceMeshGenerator;
	private readonly hitGenerator: SurfaceHitGenerator;
	private hits: HitObject[] = [];
	private drops: HitObject[] = [];
	private api?: SurfaceApi;
	private updater?: SurfaceUpdater;

	// public getters
	get heightTop() { return this.data.heightTop; }
	get image() { return this.data.szImage; }

	public static async fromStorage(storage: Storage, itemName: string): Promise<Surface> {
		const data = await SurfaceData.fromStorage(storage, itemName);
		return new Surface(itemName, data);
	}

	public constructor(itemName: string, data: SurfaceData) {
		super(data);
		this.state = SurfaceState.claim(data.getName(), false,
			data.isTopBottomVisible, data.szTopMaterial, data.szImage,
			data.isSideVisible, data.szSideMaterial, data.szSideImage);
		this.itemName = itemName;
		this.meshGenerator = new SurfaceMeshGenerator();
		this.hitGenerator = new SurfaceHitGenerator(this, data);
	}

	public isCollidable(): boolean {
		return this.data.isCollidable;
	}

	public isTransparent(table: Table): boolean {
		let result = false;
		if (this.data.isSideVisible) {
			const sideMaterial = table.getMaterial(this.data.szSideMaterial);
			result = !sideMaterial || sideMaterial.isOpacityActive;
		}
		if (this.data.isTopBottomVisible) {
			const topMaterial = table.getMaterial(this.data.szSideMaterial);
			result = result || !topMaterial || topMaterial.isOpacityActive;
		}
		return result;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		const meshes: Meshes<GEOMETRY> = {};
		const surface = this.meshGenerator.generateMeshes(this.data, table);
		const isTransparent = this.isTransparent(table);
		if (surface.top) {
			meshes.top = {
				isVisible: this.data.isTopBottomVisible,
				mesh: surface.top.transform(Matrix3D.RIGHT_HANDED),
				map: table.getTexture(this.data.szImage),
				material: table.getMaterial(this.data.szTopMaterial),
				isTransparent,
			};
		}

		if (surface.side) {
			meshes.side = {
				isVisible: this.data.isSideVisible,
				mesh: surface.side.transform(Matrix3D.RIGHT_HANDED),
				map: table.getTexture(this.data.szSideImage),
				material: table.getMaterial(this.data.szSideMaterial),
				isTransparent,
			};
		}
		return meshes;
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.hits = this.hitGenerator.generateHitObjects(this.events, player.getPhysics(), table);
		this.drops = this.data.isCollidable ? this.hits : [];
		this.api = new SurfaceApi(this.state, this.data, this.hits, this.hitGenerator, this.events, player, table);
		this.updater = new SurfaceUpdater(this.state, this.data, table);
	}

	public getApi(): SurfaceApi {
		return this.api!;
	}

	public getState(): SurfaceState {
		return this.state;
	}
	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: SurfaceState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table, oldState: SurfaceState): void {
		this.updater!.applyState(obj, state, renderApi, table);
	}

	public getHitShapes(): HitObject[] {
		return this.hits;
	}

	public getEventProxy(): EventProxy {
		return this.events!;
	}

	public getEventNames(): string[] {
		return [ 'Init', 'Hit', 'Slingshot', 'Timer' ];
	}
}
