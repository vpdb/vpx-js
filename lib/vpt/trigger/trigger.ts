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
import { TriggerShape } from '../enums';
import { Item } from '../item';
import { Table } from '../table/table';
import { TriggerAnimation } from './trigger-animation';
import { TriggerApi } from './trigger-api';
import { TriggerData } from './trigger-data';
import { TriggerHitCircle } from './trigger-hit-circle';
import { TriggerHitGenerator } from './trigger-hit-generator';
import { TriggerMeshGenerator } from './trigger-mesh-generator';
import { TriggerState } from './trigger-state';
import { TriggerUpdater } from './trigger-updater';

/**
 * VPinball's triggers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/trigger.cpp
 */
export class Trigger extends Item<TriggerData> implements IRenderable<TriggerState>, IHittable, IAnimatable, IScriptable<TriggerApi> {

	private readonly state: TriggerState;
	private readonly meshGenerator: TriggerMeshGenerator;
	private readonly hitGenerator: TriggerHitGenerator;
	private readonly updater: TriggerUpdater;

	private api?: TriggerApi;
	private hits?: HitObject[];
	private animation?: TriggerAnimation;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Trigger> {
		const data = await TriggerData.fromStorage(storage, itemName);
		return new Trigger(data);
	}

	public constructor(data: TriggerData) {
		super(data);
		this.state = TriggerState.claim(data.getName(), 0, data.szMaterial, data.isVisible && data.shape !== TriggerShape.TriggerNone);
		this.meshGenerator = new TriggerMeshGenerator(data);
		this.hitGenerator = new TriggerHitGenerator(data);
		this.updater = new TriggerUpdater(this.state);
	}

	public getState(): TriggerState {
		return this.state;
	}

	public isCollidable(): boolean {
		return true;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		return {
			trigger: {
				isVisible: this.data.isVisible,
				mesh: this.meshGenerator.getMesh(table).transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
			},
		};
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.animation = new TriggerAnimation(this.data, this.state);
		if (this.data.shape === TriggerShape.TriggerStar || this.data.shape === TriggerShape.TriggerButton) {
			this.hits = [ new TriggerHitCircle(this.data, this.animation, this.events, table) ];

		} else {
			this.hits = this.hitGenerator.generateHitObjects(this.animation, this.events, table);
		}
		this.api = new TriggerApi(this.state, this.data, this.events, player, table);
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

	public getUpdater(): TriggerUpdater {
		return this.updater;
	}

	public getEventNames(): string[] {
		return [ 'Init', 'Hit', 'Unhit', 'Timer' ];
	}
}
