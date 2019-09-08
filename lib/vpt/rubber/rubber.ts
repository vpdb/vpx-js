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
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { Matrix3D } from '../../math/matrix3d';
import { HitObject } from '../../physics/hit-object';
import { Table } from '../table/table';
import { RubberData } from './rubber-data';
import { RubberHitGenerator } from './rubber-hit-generator';
import { RubberMeshGenerator } from './rubber-mesh-generator';

/**
 * VPinball's rubber item.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/rubber.cpp
 */
export class Rubber implements IRenderable, IHittable {

	private readonly data: RubberData;
	private readonly meshGenerator: RubberMeshGenerator;
	private hitGenerator: RubberHitGenerator;
	private hits: HitObject[] = [];
	private events?: EventProxy;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Rubber> {
		const data = await RubberData.fromStorage(storage, itemName);
		return new Rubber(data);
	}

	private constructor(data: RubberData) {
		this.data = data;
		this.meshGenerator = new RubberMeshGenerator(data);
		this.hitGenerator = new RubberHitGenerator(data, this.meshGenerator);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.isVisible;
	}

	public isCollidable(): boolean {
		return this.data.isCollidable;
	}

	public getMeshes(table: Table): Meshes {

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
	}

	public getHitShapes(): HitObject[] {
		return this.hits;
	}

	public getEventProxy(): EventProxy {
		return this.events!;
	}
}
