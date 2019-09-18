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
import { IAnimatable } from '../../game/ianimatable';
import { IHittable } from '../../game/ihittable';
import { IRenderable, Meshes } from '../../game/irenderable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { Matrix3D } from '../../math/matrix3d';
import { HitObject } from '../../physics/hit-object';
import { IRenderApi } from '../../render/irender-api';
import { Item } from '../item';
import { Table } from '../table/table';
import { Texture } from '../texture';
import { BumperAnimation } from './bumper-animation';
import { BumperData } from './bumper-data';
import { BumperHit } from './bumper-hit';
import { BumperMeshGenerator } from './bumper-mesh-generator';
import { BumperMeshUpdater } from './bumper-mesh-updater';
import { BumperState } from './bumper-state';

/**
 * VPinball's bumper item.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/bumper.cpp
 */
export class Bumper extends Item<BumperData> implements IRenderable, IHittable, IAnimatable<BumperState> {

	private readonly meshGenerator: BumperMeshGenerator;
	private readonly meshUpdater: BumperMeshUpdater;
	private readonly state: BumperState;
	private hit?: BumperHit;
	private animation?: BumperAnimation;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Bumper> {
		const data = await BumperData.fromStorage(storage, itemName);
		return new Bumper(data);
	}

	private constructor(data: BumperData) {
		super(data);
		this.state = BumperState.claim(this.getName(), 0, 0, 0);
		this.meshGenerator = new BumperMeshGenerator(data);
		this.meshUpdater = new BumperMeshUpdater(this.data, this.state, this.meshGenerator);
	}

	public getState(): BumperState {
		return this.state;
	}

	public isVisible(): boolean {
		return this.data.isBaseVisible || this.data.isRingVisible || this.data.isSkirtVisible || this.data.isCapVisible;
	}

	public isCollidable(): boolean {
		return this.data.isCollidable;
	}

	public setupPlayer(player: Player, table: Table): void {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y);
		this.events = new EventProxy(this);
		this.animation = new BumperAnimation(this.data, this.state);
		this.hit = new BumperHit(this.data, this.state, this.animation, this.events, height);
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table, player: Player, oldState: BumperState): void {
		this.meshUpdater.applyState(obj, renderApi, table, player, oldState);
	}

	public getHitShapes(): HitObject[] {
		return [ this.hit! ];
	}

	public getAnimation(): BumperAnimation {
		return this.animation!;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		const meshes: Meshes<GEOMETRY> = {};
		const bumper = this.meshGenerator.getMeshes(table);
		if (bumper.base) {
			meshes.base = {
				mesh: bumper.base.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szBaseMaterial),
				map: Texture.fromFilesystem('bumperbase.png'),
			};
		}
		if (bumper.ring) {
			meshes.ring = {
				mesh: bumper.ring.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szRingMaterial),
				map: Texture.fromFilesystem('bumperring.png'),
			};
		}
		if (bumper.skirt) {
			meshes.skirt = {
				mesh: bumper.skirt.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szSkirtMaterial),
				map: Texture.fromFilesystem('bumperskirt.png'),
			};
		}
		if (bumper.cap) {
			meshes.cap = {
				mesh: bumper.cap.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szCapMaterial),
				map: Texture.fromFilesystem('bumperCap.png'),
			};
		}
		return meshes;
	}
}
