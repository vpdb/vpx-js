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

import { Object3D } from 'three';
import { Storage } from '../..';
import { Player } from '../../game/player';
import { VpTableExporterOptions } from '../../gltf/table-exporter';
import { Matrix3D } from '../../math/matrix3d';
import { MoverObject } from '../../physics/mover-object';
import { IMovable, IRenderable, Meshes } from '../game-item';
import { Table } from '../table';
import { PlungerData } from './plunger-data';
import { PlungerHit } from './plunger-hit';
import { PlungerMesh } from './plunger-mesh';
import { PlungerState } from './plunger-state';

/**
 * VPinball's plunger.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/plunger.cpp
 */
export class Plunger implements IRenderable, IMovable<PlungerState> {

	public static PLUNGER_HEIGHT = 50.0;

	private readonly data: PlungerData;
	private readonly mesh: PlungerMesh;
	private state?: PlungerState;
	private hit?: PlungerHit;

	public static async fromStorage(storage: Storage, itemName: string, table: Table): Promise<Plunger> {
		const data = await PlungerData.fromStorage(storage, itemName);
		return new Plunger(itemName, data, table);
	}

	public constructor(itemName: string, data: PlungerData, table: Table) {
		this.data = data;
		this.mesh = new PlungerMesh(data, table);
	}

	public setupPlayer(player: Player, table: Table) {
		this.hit = new PlungerHit(this.data, this.mesh.cFrames, player, table);
		this.state = this.hit.plungerMover.getState();
	}

	public getName(): string {
		return this.data.getName();
	}

	public getData(): PlungerData {
		return this.data;
	}

	public getMeshes(table: Table, opts: VpTableExporterOptions): Meshes {
		const plunger = this.mesh.generateMeshes(0);
		const meshes: Meshes = {};
		const material = table.getMaterial(this.data.szMaterial);
		const map = table.getTexture(this.data.szImage);

		const matrix = new Matrix3D().toRightHanded();

		if (plunger.rod) {
			meshes.rod = {
				mesh: plunger.rod.transform(matrix),
				material,
				map,
			};
		}
		if (plunger.spring) {
			meshes.spring = {
				mesh: plunger.spring.transform(matrix),
				material,
				map,
			};
		}
		if (plunger.flat) {
			meshes.flat = {
				mesh: plunger.flat.transform(matrix),
				material,
				map,
			};
		}
		return meshes;
	}

	public isVisible(table: Table): boolean {
		return this.data.isVisible();
	}

	public getMover(): MoverObject {
		return this.hit!.plungerMover;
	}

	public getHit(): PlungerHit {
		return this.hit!;
	}

	public pullBack(): void {
		this.hit!.plungerMover.pullBack(this.data.speedPull);
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
			this.hit!.plungerMover.fire(1.0);

		} else {
			// Regular plunger - trigger a release from the current
			// position, using the keyboard firing strength.
			this.hit!.plungerMover.fire();
		}
	}

	public updateState(state: PlungerState, obj: Object3D): void {
		if (state.equals(this.state!)) {
			return;
		}
		const matrix = new Matrix3D().toRightHanded();
		const mesh = this.mesh.generateMeshes(state.frame);

		const rodObj = obj.children.find(o => o.name === 'rod') as any;
		if (rodObj) {
			mesh.rod!.transform(matrix).applyToObject(rodObj);
		}
		const springObj = obj.children.find(o => o.name === 'spring') as any;
		if (springObj) {
			mesh.spring!.transform(matrix).applyToObject(springObj);
		}
		this.state = state;
	}
}

export enum PlungerType {
	Modern = 1,
	Flat = 2,
	Custom = 3,
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
