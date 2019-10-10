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
import { RubberApi } from './rubber-api';
import { RubberData } from './rubber-data';
import { RubberHitGenerator } from './rubber-hit-generator';
import { RubberMeshGenerator } from './rubber-mesh-generator';
import { RubberState } from './rubber-state';
import { RubberUpdater } from './rubber-updater';

/**
 * VPinball's rubber item.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/rubber.cpp
 */
export class Rubber extends Item<RubberData> implements IRenderable<RubberState>, IHittable, IScriptable<RubberApi> {

	private readonly state: RubberState;
	private readonly meshGenerator: RubberMeshGenerator;
	private readonly updater: RubberUpdater;
	private hitGenerator: RubberHitGenerator;
	private hits: HitObject[] = [];
	private api!: RubberApi;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Rubber> {
		const data = await RubberData.fromStorage(storage, itemName);
		return new Rubber(data);
	}

	private constructor(data: RubberData) {
		super(data);
		this.state = RubberState.claim(data.getName(), data.height, data.rotX,  data.rotY, data.rotZ, data.szMaterial!, data.szImage!, data.isVisible);
		this.meshGenerator = new RubberMeshGenerator(data);
		this.hitGenerator = new RubberHitGenerator(data, this.meshGenerator);
		this.updater = new RubberUpdater(this.data, this.state, this.meshGenerator.middlePoint);
	}

	public isCollidable(): boolean {
		return this.data.isCollidable;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		const mesh = this.meshGenerator.getMeshes(table);
		return {
			rubber: {
				mesh: mesh.transform(Matrix3D.RIGHT_HANDED),
				map: table.getTexture(this.data.szImage),
				material: table.getMaterial(this.data.szMaterial),
			},
		};
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.hits = this.hitGenerator.generateHitObjects(this.events, table);
		this.api = new RubberApi(this.state, this.hits, this.data, this.events, player, table);
	}

	public getApi(): RubberApi {
		return this.api!;
	}

	public getHitShapes(): HitObject[] {
		return this.hits;
	}

	public getEventNames(): string[] {
		return [ 'Hit', 'Init', 'Timer' ];
	}

	public getState(): RubberState {
		return this.state;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: RubberState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {
		this.updater.applyState(obj, state, renderApi, table);
	}
}
