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
import { f4 } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { HitObject } from '../../physics/hit-object';
import { Ball } from '../ball/ball';
import { Item } from '../item';
import { Table } from '../table/table';
import { HitTargetAnimation } from './hit-target-animation';
import { HitTargetApi } from './hit-target-api';
import { HitTargetData } from './hit-target-data';
import { HitTargetHitGenerator } from './hit-target-hit-generator';
import { HitTargetMeshGenerator } from './hit-target-mesh-generator';
import { HitTargetState } from './hit-target-state';
import { HitTargetUpdater } from './hit-target-updater';

/**
 * VPinball's hit- and drop targets.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/hittarget.cpp
 */
export class HitTarget extends Item<HitTargetData> implements IRenderable<HitTargetState>, IHittable, IAnimatable, IScriptable<HitTargetApi> {

	public static DROP_TARGET_LIMIT = f4(52.0);

	private readonly state: HitTargetState;
	private readonly meshGenerator: HitTargetMeshGenerator;
	private readonly hitGenerator: HitTargetHitGenerator;
	private readonly updater: HitTargetUpdater;
	private animation?: HitTargetAnimation;
	private hits?: HitObject[];
	private api?: HitTargetApi;

	public static async fromStorage(storage: Storage, itemName: string): Promise<HitTarget> {
		const data = await HitTargetData.fromStorage(storage, itemName);
		return new HitTarget(data);
	}

	public constructor(data: HitTargetData) {
		super(data);
		this.state = HitTargetState.claim(this.data.getName(),  0.0, 0.0, data.szMaterial, data.szImage, data.isVisible);
		this.meshGenerator = new HitTargetMeshGenerator(data);
		this.hitGenerator = new HitTargetHitGenerator(data, this.meshGenerator);
		this.updater = new HitTargetUpdater(this.data, this.state);
	}

	public isCollidable(): boolean {
		return this.data.isCollidable;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		return {
			hitTarget: {
				isVisible: this.data.isVisible,
				mesh: this.meshGenerator.getMesh(table).transform(Matrix3D.RIGHT_HANDED),
				map: table.getTexture(this.data.szImage),
				material: table.getMaterial(this.data.szMaterial),
			},
		};
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.events.onCollision = (obj: HitObject, ball: Ball, dot: number) => {
			if (!this.data.isDropped) {
				this.animation!.hitEvent = true;
				this.events!.currentHitThreshold = dot;
				obj.fireHitEvent(ball);
			}
		};
		this.events.abortHitTest = () => {
			return this.data.isDropped;
		};
		this.animation = new HitTargetAnimation(this.data, this.state, this.events);
		this.hits = this.hitGenerator.generateHitObjects(this.events, table);
		this.api = new HitTargetApi(this.state, this.data, this.hits, this.animation, this.events, player, table);
	}

	public getState(): HitTargetState {
		return this.state;
	}

	public getApi(): HitTargetApi {
		return this.api!;
	}

	public getHitShapes(): HitObject[] {
		return this.hits!;
	}

	public getAnimation(): IAnimation {
		return this.animation!;
	}

	public getUpdater(): HitTargetUpdater {
		return this.updater;
	}

	public getEventNames(): string[] {
		return [ 'Dropped', 'Hit', 'Init', 'Raised', 'Timer' ];
	}
}
