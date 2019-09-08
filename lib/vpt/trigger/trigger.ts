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
import { IHittable } from '../../game/ihittable';
import { IRenderable, Meshes } from '../../game/irenderable';
import { IScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { Matrix3D } from '../../math/matrix3d';
import { HitObject } from '../../physics/hit-object';
import { IRenderApi } from '../../render/irender-api';
import { Table } from '../table/table';
import { TriggerAnimation } from './trigger-animation';
import { TriggerApi } from './trigger-api';
import { TriggerData } from './trigger-data';
import { TriggerHitCircle } from './trigger-hit-circle';
import { TriggerHitGenerator } from './trigger-hit-generator';
import { TriggerMeshGenerator } from './trigger-mesh-generator';
import { TriggerState } from './trigger-state';

/**
 * VPinball's triggers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/trigger.cpp
 */
export class Trigger implements IRenderable, IHittable, IAnimatable<TriggerState>, IScriptable<TriggerApi> {

	public static ShapeTriggerNone = 0;
	public static ShapeTriggerWireA = 1;
	public static ShapeTriggerStar = 2;
	public static ShapeTriggerWireB = 3;
	public static ShapeTriggerButton = 4;
	public static ShapeTriggerWireC = 5;
	public static ShapeTriggerWireD = 6;

	private readonly data: TriggerData;
	private readonly state: TriggerState;
	private readonly meshGenerator: TriggerMeshGenerator;
	private readonly hitGenerator: TriggerHitGenerator;

	private api?: TriggerApi;
	private hits?: HitObject[];
	private events?: EventProxy;
	private animation?: TriggerAnimation;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Trigger> {
		const data = await TriggerData.fromStorage(storage, itemName);
		return new Trigger(data);
	}

	private constructor(data: TriggerData) {
		this.data = data;
		this.state = TriggerState.claim(data.getName(), 0);
		this.meshGenerator = new TriggerMeshGenerator(data);
		this.hitGenerator = new TriggerHitGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public getState(): TriggerState {
		return this.state;
	}

	public isVisible(): boolean {
		return this.data.isVisible && this.data.shape !== Trigger.ShapeTriggerNone;
	}

	public isCollidable(): boolean {
		return true;
	}

	public getEventProxy(): EventProxy {
		return this.events!;
	}

	public getMeshes(table: Table): Meshes {
		return {
			trigger: {
				mesh: this.meshGenerator.getMesh(table).transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
			},
		};
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.animation = new TriggerAnimation(this.data, this.state);
		if (this.data.shape === Trigger.ShapeTriggerStar || this.data.shape === Trigger.ShapeTriggerButton) {
			this.hits = [ new TriggerHitCircle(this.data, this.animation, this.events, table) ];

		} else {
			this.hits = this.hitGenerator.generateHitObjects(this.animation, this.events, table);
		}
		this.api = new TriggerApi(this.data, this.events, player, table);
	}

	public getApi(): TriggerApi {
		return this.api!;
	}

	public getHitShapes(): HitObject[] {
		return this.hits!;
	}

	public getAnimation(): IAnimation {
		return this.animation!;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table, player: Player): void {
		const matrix = Matrix3D.claim().setTranslation(0, 0, -this.state.heightOffset);
		renderApi.applyMatrixToObject(matrix, obj);
		Matrix3D.release(matrix);
	}

	public getEventNames(): string[] {
		return [ 'Init', 'Hit', 'Unhit', 'Timer' ];
	}
}
