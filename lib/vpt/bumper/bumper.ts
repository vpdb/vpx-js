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
import { Table } from '../..';
import { IAnimatable } from '../../game/ianimatable';
import { IHittable } from '../../game/ihittable';
import { IRenderable } from '../../game/irenderable';
import { Player } from '../../game/player';
import { Matrix3D } from '../../math/matrix3d';
import { FireEvents } from '../../physics/fire-events';
import { HitObject } from '../../physics/hit-object';
import { Meshes } from '../item-data';
import { Texture } from '../texture';
import { BumperAnimation } from './bumper-animation';
import { BumperData } from './bumper-data';
import { BumperHit } from './bumper-hit';
import { BumperMeshGenerator } from './bumper-mesh-generator';
import { BumperState } from './bumper-state';

/**
 * VPinball's bumper item.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/bumper.cpp
 */
export class Bumper implements IRenderable, IHittable, IAnimatable<BumperState> {

	private readonly data: BumperData;
	private readonly meshGenerator: BumperMeshGenerator;
	private readonly state: BumperState;
	private hit?: BumperHit;
	private events?: FireEvents;
	private animation?: BumperAnimation;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Bumper> {
		const data = await BumperData.fromStorage(storage, itemName);
		return new Bumper(data);
	}

	private constructor(data: BumperData) {
		this.data = data;
		this.state = new BumperState(this.getName(), 0);
		this.meshGenerator = new BumperMeshGenerator(data);
	}

	public getName() {
		return this.data.getName();
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
		this.events = new FireEvents(this);
		this.hit = new BumperHit(this.data, this.events, height);
		this.animation = new BumperAnimation(this.data, this.state, this.hit);
	}

	public applyState(obj: Object3D, table: Table, player: Player): void {
		const matrix = new Matrix3D().toRightHanded();
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y) * table.getScaleZ();
		const ringMesh = this.meshGenerator.generateRingMesh(table, height + this.state.ringOffset);
		const ringObj = obj.children.find(o => o.name === `bumper-ring-${this.data.getName()}`) as any;
		if (ringObj) {
			ringMesh.transform(matrix).applyToObject(ringObj);
		}
	}

	public getHitShapes(): Array<HitObject<FireEvents>> {
		return [ this.hit! ];
	}

	public getAnimation(): BumperAnimation {
		return this.animation!;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};
		const bumper = this.meshGenerator.getMeshes(table);
		if (bumper.base) {
			meshes.base = {
				mesh: bumper.base.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szBaseMaterial),
				map: Texture.fromFilesystem('bumperbase.bmp'),
			};
		}
		if (bumper.ring) {
			meshes.ring = {
				mesh: bumper.ring.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szRingMaterial),
				map: Texture.fromFilesystem('bumperring.bmp'),
			};
		}
		if (bumper.skirt) {
			meshes.skirt = {
				mesh: bumper.skirt.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szSkirtMaterial),
				map: Texture.fromFilesystem('bumperskirt.bmp'),
			};
		}
		if (bumper.cap) {
			meshes.cap = {
				mesh: bumper.cap.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szCapMaterial),
				map: Texture.fromFilesystem('bumperCap.bmp'),
			};
		}
		return meshes;
	}
}
