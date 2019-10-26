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
import { IBallCreationPosition, Player } from '../../game/player';
import { PlayerPhysics } from '../../game/player-physics';
import { Storage } from '../../io/ole-doc';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex3D } from '../../math/vertex3d';
import { HitObject } from '../../physics/hit-object';
import { Ball } from '../ball/ball';
import { Enums } from '../enums';
import { Item } from '../item';
import { FLT_MAX } from '../mesh';
import { Table } from '../table/table';
import { Texture } from '../texture';
import { KickerApi } from './kicker-api';
import { KickerData } from './kicker-data';
import { KickerHit } from './kicker-hit';
import { KickerMeshGenerator } from './kicker-mesh-generator';
import { KickerState } from './kicker-state';
import { KickerUpdater } from './kicker-updater';

/**
 * VPinball's kickers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/kicker.cpp
 */
export class Kicker extends Item<KickerData> implements IRenderable<KickerState>, IHittable, IBallCreationPosition, IScriptable<KickerApi> {

	private readonly meshGenerator: KickerMeshGenerator;
	private readonly state: KickerState;
	private readonly updater: KickerUpdater;
	private hit?: KickerHit;
	private api?: KickerApi;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Kicker> {
		const data = await KickerData.fromStorage(storage, itemName);
		return new Kicker(data);
	}

	public constructor(data: KickerData) {
		super(data);
		this.state = KickerState.claim(data.getName(), data.kickerType, data.szMaterial);
		this.meshGenerator = new KickerMeshGenerator(data);
		this.updater = new KickerUpdater(this.state);
	}

	public isCollidable(): boolean {
		return true;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		return {
			kicker: {
				isVisible: this.data.kickerType !== Enums.KickerType.KickerInvisible,
				mesh: this.meshGenerator.getMesh(table).transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
				map: this.getTexture(),
			},
		};
	}

	public setupPlayer(player: Player, table: Table): void {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y) * table.getScaleZ();

		// reduce the hit circle radius because only the inner circle of the kicker should start a hit event
		const radius = this.data.radius * (this.data.legacyMode ? (this.data.fallThrough ? 0.75 : 0.6) : 1);

		this.events = new EventProxy(this);
		this.hit = new KickerHit(this.data, this.events, table, radius, height); // height of kicker hit cylinder
		this.api = new KickerApi(this.state, this.data, this.hit, this.events, this, player, table);
	}

	public getApi(): KickerApi {
		return this.api!;
	}

	public getState(): KickerState {
		return this.state;
	}

	public getUpdater(): KickerUpdater {
		return this.updater;
	}

	public getHitShapes(): HitObject[] {
		return [ this.hit! ];
	}

	public getBallCreationPosition(table: Table): Vertex3D {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y);
		return new Vertex3D(this.hit!.center.x, this.hit!.center.y, height);
	}

	public getBallCreationVelocity(table: Table): Vertex3D {
		return new Vertex3D(0.1, 0, 0);
	}

	public onBallCreated(physics: PlayerPhysics, ball: Ball): void {
		ball.coll.hitFlag = true;                        // HACK: avoid capture leaving kicker
		const hitNormal = new Vertex3D(FLT_MAX, FLT_MAX, FLT_MAX); // unused due to newBall being true
		this.hit!.doCollide(physics, ball, hitNormal, false, true);
	}

	private getTexture(): Texture {
		switch (this.data.kickerType) {
			case Enums.KickerType.KickerCup: return Texture.fromFilesystem('kickerCup.png');
			case Enums.KickerType.KickerWilliams: return Texture.fromFilesystem('kickerWilliams.png');
			case Enums.KickerType.KickerGottlieb: return Texture.fromFilesystem('kickerGottlieb.png');
			case Enums.KickerType.KickerCup2: return Texture.fromFilesystem('kickerT1.png');
			case Enums.KickerType.KickerHole: return Texture.fromFilesystem('kickerHoleWood.png');
			case Enums.KickerType.KickerHoleSimple:
			default:
				return Texture.fromFilesystem('kickerHoleWood.png');
		}
	}

	public getEventNames(): string[] {
		return [ 'Init', 'Hit', 'Unhit', 'Timer' ];
	}
}
