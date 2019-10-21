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
import { IMovable } from '../../game/imovable';
import { IPlayable } from '../../game/iplayable';
import { IRenderable, Meshes } from '../../game/irenderable';
import { IScriptable } from '../../game/iscriptable';
import { IBallCreationPosition, Player } from '../../game/player';
import { PlayerPhysics } from '../../game/player-physics';
import { Storage } from '../../io/ole-doc';
import { Vertex3D } from '../../math/vertex3d';
import { HitObject } from '../../physics/hit-object';
import { Ball } from '../ball/ball';
import { Item } from '../item';
import { Table } from '../table/table';
import { PlungerApi } from './plunger-api';
import { PlungerData } from './plunger-data';
import { PlungerHit } from './plunger-hit';
import { PlungerMeshGenerator } from './plunger-mesh-generator';
import { PlungerMover } from './plunger-mover';
import { PlungerState } from './plunger-state';
import { PlungerUpdater } from './plunger-updater';

/**
 * VPinball's plunger.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/plunger.cpp
 */
export class Plunger extends Item<PlungerData> implements IRenderable<PlungerState>, IPlayable, IMovable, IHittable, IBallCreationPosition, IScriptable<PlungerApi> {

	public static PLUNGER_HEIGHT = 50.0;

	private readonly meshGenerator: PlungerMeshGenerator;
	private readonly state: PlungerState;
	private readonly updater: PlungerUpdater;
	private api?: PlungerApi;
	private hit?: PlungerHit;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Plunger> {
		const data = await PlungerData.fromStorage(storage, itemName);
		return new Plunger(itemName, data);
	}

	public constructor(itemName: string, data: PlungerData) {
		super(data);
		this.meshGenerator = new PlungerMeshGenerator(data);
		this.state = PlungerState.claim(this.getName(), 0);
		this.updater = new PlungerUpdater(this.state, this.meshGenerator);
	}

	public getState(): PlungerState {
		return this.state!;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		const plunger = this.meshGenerator.generateMeshes(0, table);
		const meshes: Meshes<GEOMETRY> = {};
		const material = table.getMaterial(this.data.szMaterial);
		const map = table.getTexture(this.data.szImage);

		if (plunger.rod) {
			meshes.rod = { isVisible: this.data.isVisible, mesh: plunger.rod, material, map };
		}
		if (plunger.spring) {
			meshes.spring = { isVisible: this.data.isVisible, mesh: plunger.spring, material, map };
		}
		if (plunger.flat) {
			meshes.flat = { isVisible: this.data.isVisible, mesh: plunger.flat, material, map };
		}
		return meshes;
	}

	public isCollidable(): boolean {
		return true;
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.hit = new PlungerHit(this.data, this.state, this.events, this.meshGenerator.cFrames, player, table);
		this.api = new PlungerApi(this.data, this.hit, this.events, this, player, table);
	}

	public getApi(): PlungerApi {
		return this.api!;
	}

	public getMover(): PlungerMover {
		return this.hit!.getMoverObject();
	}

	public getHitShapes(): HitObject[] {
		return [ this.hit! ];
	}

	public getEventProxy(): EventProxy {
		return this.events!;
	}

	public pullBack(): void {
		this.getMover().pullBack(this.data.speedPull);
	}

	public fire(): void {
		// check for an auto plunger
		if (this.data.autoPlunger) {
			// Auto Plunger - this models a "Launch Ball" button or a
			// ROM-controlled launcher, rather than a player-operated
			// spring plunger.  In a physical machine, this would be
			// implemented as a solenoid kicker, so the amount of force
			// is constant (modulo some mechanical randomness).  Simulate
			// this by triggering a release from the maximum retracted
			// position.
			this.getMover().fire(1.0);

		} else {
			// Regular plunger - trigger a release from the current
			// position, using the keyboard firing strength.
			this.getMover().fire();
		}
	}

	public getUpdater(): PlungerUpdater {
		return this.updater;
	}

	public getBallCreationPosition(table: Table): Vertex3D {
		const x = (this.getMover().x + this.getMover().x2) * 0.5;
		const y = this.getMover().pos - (25.0 + 0.01); //!! assumes ball radius 25
		const height = table.getSurfaceHeight(this.data.szSurface, x, y);
		return new Vertex3D(x, y, height);
	}

	public getBallCreationVelocity(table: Table): Vertex3D {
		return new Vertex3D(0, 0, 0);
	}

	public onBallCreated(physics: PlayerPhysics, ball: Ball): void {
		// nothing to be done
	}

	public getEventNames(): string[] {
		return [ 'Init', 'Timer', 'LimitEOS', 'LimitBOS' ];
	}
}

export interface PlungerConfig {
	x: number;
	y: number;
	x2: number;
	zHeight: number;
	frameTop: number;
	frameBottom: number;
	cFrames: number;
}
