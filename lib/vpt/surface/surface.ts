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
import { Item } from '../item';
import { Table } from '../table/table';
import { SurfaceApi } from './surface-api';
import { SurfaceData } from './surface-data';
import { SurfaceHitGenerator } from './surface-hit-generator';
import { SurfaceMeshGenerator } from './surface-mesh-generator';

/**
 * VPinball's surfaces, a.k.a as "walls".
 *
 * @see https://github.com/vpinball/vpinball/blob/master/surface.cpp
 */
export class Surface extends Item<SurfaceData> implements IRenderable, IHittable, IScriptable<SurfaceApi> {

	private readonly itemName: string;
	private readonly meshGenerator: SurfaceMeshGenerator;
	private readonly hitGenerator: SurfaceHitGenerator;
	private hits: HitObject[] = [];
	private drops: HitObject[] = [];
	private api?: SurfaceApi;

	public isDropped: boolean = false;
	public isDisabled: boolean = false;

	// public getters
	get heightTop() { return this.data.heightTop; }
	get image() { return this.data.szImage; }

	public static async fromStorage(storage: Storage, itemName: string): Promise<Surface> {
		const data = await SurfaceData.fromStorage(storage, itemName);
		return new Surface(itemName, data);
	}

	public constructor(itemName: string, data: SurfaceData) {
		super(data);
		this.itemName = itemName;
		this.meshGenerator = new SurfaceMeshGenerator();
		this.hitGenerator = new SurfaceHitGenerator(this, data);
	}

	public isVisible(): boolean {
		return this.data.isSideVisible || this.data.isTopBottomVisible;
	}

	public isCollidable(): boolean {
		return this.data.isCollidable;
	}

	public setDropped(isDropped: boolean): void {
		if (!this.data.isDroppable) {
			throw new Error(`Surface "${this.getName()}" is not droppable.`);
		}
		if (this.isDropped !== isDropped) {
			this.isDropped = isDropped;
			const b = !this.isDropped && this.data.isCollidable;
			if (this.drops.length > 0 && this.drops[0].isEnabled !== b) {
				for (const drop of this.drops) { // !! costly
					drop.setEnabled(b); // disable hit on entities composing the object
				}
			}
		}
	}

	public setCollidable(isCollidable: boolean) {
		const b = this.data.isDroppable ? (isCollidable && !this.isDropped) : isCollidable;
		if (this.hits.length > 0 && this.hits[0].isEnabled !== b) {
			for (const hit of this.hits) { // !! costly
				hit.isEnabled = b; // copy to hit checking on enities composing the object
			}
		}
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		const meshes: Meshes<GEOMETRY> = {};
		const surface = this.meshGenerator.generateMeshes(this.data, table);
		if (surface.top) {
			meshes.top = {
				mesh: surface.top.transform(Matrix3D.RIGHT_HANDED),
				map: table.getTexture(this.data.szImage),
				material: table.getMaterial(this.data.szTopMaterial),
			};
		}

		if (surface.side) {
			meshes.side = {
				mesh: surface.side.transform(Matrix3D.RIGHT_HANDED),
				map: table.getTexture(this.data.szSideImage),
				material: table.getMaterial(this.data.szSideMaterial),
			};
		}
		return meshes;
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.hits = this.hitGenerator.generateHitObjects(this.events, player.getPhysics(), table);
		this.drops = this.data.isCollidable ? this.hits : [];
		this.api = new SurfaceApi(this, this.data, this.hitGenerator, this.events, player, table);
	}

	public getApi(): SurfaceApi {
		return this.api!;
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
