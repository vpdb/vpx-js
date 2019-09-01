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
import { IRenderable } from '../../game/irenderable';
import { IScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { Matrix3D } from '../../math/matrix3d';
import { HitObject } from '../../physics/hit-object';
import { Ball } from '../ball/ball';
import { Meshes } from '../item-data';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { PrimitiveApi } from './primitive-api';
import { PrimitiveData } from './primitive-data';
import { PrimitiveHitGenerator } from './primitive-hit-generator';
import { PrimitiveMeshGenerator } from './primitive-mesh-generator';

/**
 * VPinball's primitive.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/primitive.cpp
 */
export class Primitive implements IRenderable, IHittable, IScriptable<PrimitiveApi> {

	private readonly data: PrimitiveData;
	private readonly meshGenerator: PrimitiveMeshGenerator;
	private readonly hitGenerator: PrimitiveHitGenerator;
	private mesh?: Mesh;
	private api?: PrimitiveApi;
	private hits?: HitObject[];
	private events?: EventProxy;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Primitive> {
		const data = await PrimitiveData.fromStorage(storage, itemName);
		return new Primitive(data);
	}

	private constructor(data: PrimitiveData) {
		this.data = data;
		this.meshGenerator = new PrimitiveMeshGenerator(data);
		this.hitGenerator = new PrimitiveHitGenerator(data);
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
		return {
			primitive: {
				mesh: this.getMesh(table).clone().transform(new Matrix3D().toRightHanded()),
				map: table.getTexture(this.data.szImage),
				normalMap: table.getTexture(this.data.szNormalMap),
				material: table.getMaterial(this.data.szMaterial),
			},
		};
	}

	public getEventProxy(): EventProxy {
		return this.events!;
	}

	private getMesh(table: Table): Mesh {
		if (!this.mesh) {
			this.mesh = this.meshGenerator.getMesh(table);
		}
		return this.mesh;
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.events.onCollision = (obj: HitObject, ball: Ball, dot: number) => {
			this.events!.currentHitThreshold = dot;
			obj.fireHitEvent(ball);
		};
		this.hits = this.hitGenerator.generateHitObjects(this.getMesh(table), this.events, table);
		this.api = new PrimitiveApi(this, this.data, this.hits!, this.events, player, table);
	}

	public getApi(): PrimitiveApi {
		return this.api!;
	}

	public getHitShapes(): HitObject[] {
		return this.hits!;
	}

	public setSides(num: number): void {
		this.data.sides = num;
		if (!this.data.use3DMesh) {
			// TODO
			// vertexBufferRegenerate = true;
			// CalculateBuiltinOriginal();
			// RecalculateMatrices();
			// TransformVertices();
		}
	}

	public setCollidable(isCollidable: boolean) {
		if (this.hits!.length > 0 && this.hits![0].isEnabled !== isCollidable) {
			for (const hit of this.hits!) { // !! costly
				hit.isEnabled = isCollidable; //copy to hit-testing on entities composing the object
			}
		}
	}

	public getEventNames(): string[] {
		return [ 'Hit', 'Init' ];
	}
}
