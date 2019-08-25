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
import { IHittable } from '../../game/ihittable';
import { IMovable } from '../../game/imovable';
import { IPlayable } from '../../game/iplayable';
import { IRenderable } from '../../game/irenderable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { degToRad } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { FireEvents } from '../../physics/fire-events';
import { HitCircle } from '../../physics/hit-circle';
import { HitObject } from '../../physics/hit-object';
import { MoverObject } from '../../physics/mover-object';
import { FlipperState } from '../flipper/flipper-state';
import { Meshes } from '../item-data';
import { Table } from '../table/table';
import { SpinnerData } from './spinner-data';
import { SpinnerHit } from './spinner-hit';
import { SpinnerHitGenerator } from './spinner-hit-generator';
import { SpinnerMeshGenerator } from './spinner-mesh-generator';
import { SpinnerState } from './spinner-state';

/**
 * VPinball's spinners.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/spinner.cpp
 */
export class Spinner implements IRenderable, IPlayable, IMovable<FlipperState>, IHittable {

	private readonly data: SpinnerData;
	private readonly meshGenerator: SpinnerMeshGenerator;
	private readonly state: SpinnerState;
	private readonly hitGenerator: SpinnerHitGenerator;
	private hit?: SpinnerHit;
	private fireEvents?: FireEvents;
	private hitCircles: Array<HitCircle<FireEvents>> = [];

	// public props
	get angleMin() { return this.data.angleMin; }
	get angleMax() { return this.data.angleMax; }

	public static async fromStorage(storage: Storage, itemName: string): Promise<Spinner> {
		const data = await SpinnerData.fromStorage(storage, itemName);
		return new Spinner(data);
	}

	constructor(data: SpinnerData) {
		this.data = data;
		this.state = new SpinnerState(this.data.getName(), 0);
		this.meshGenerator = new SpinnerMeshGenerator(data);
		this.hitGenerator = new SpinnerHitGenerator(data);
	}

	public getName(): string {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.isVisible;
	}

	public isCollidable(): boolean {
		return true;
	}

	public getMeshes(table: Table): Meshes {
		const spinner = this.meshGenerator.generateMeshes(table);
		const meshes: Meshes = {};

		meshes.plate = {
			mesh: spinner.plate.transform(new Matrix3D().toRightHanded()),
			map: table.getTexture(this.data.szImage),
			material: table.getMaterial(this.data.szMaterial),
		};
		if (spinner.bracket) {
			meshes.bracket = {
				mesh: spinner.bracket.transform(new Matrix3D().toRightHanded()),
				map: table.getTexture(this.data.szImage),
				material: table.getMaterial(this.data.szMaterial),
			};
		}
		return meshes;
	}

	public setupPlayer(player: Player, table: Table): void {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y);
		this.fireEvents = new FireEvents(this);
		this.hit = new SpinnerHit(this.data, this.state, this.fireEvents, height);
		this.hitCircles = this.hitGenerator.getHitShapes(this.state, height);
	}

	public getHitShapes(): Array<HitObject<FireEvents>> {
		return [ this.hit!, ...this.hitCircles ];
	}

	public getMover(): MoverObject {
		return this.hit!.getMoverObject();
	}

	public getState(): FlipperState {
		return this.state;
	}

	/* istanbul ignore next */
	public applyState(obj: Object3D, table: Table, player: Player): void {

		const posZ = this.meshGenerator.getZ(table);
		const matTransToOrigin = new Matrix3D().setTranslation(-this.data.vCenter.x, -this.data.vCenter.y, posZ);
		const matRotateToOrigin = new Matrix3D().rotateZMatrix(degToRad(-this.data.rotation));
		const matTransFromOrigin = new Matrix3D().setTranslation(this.data.vCenter.x, this.data.vCenter.y, -posZ);
		const matRotateFromOrigin = new Matrix3D().rotateZMatrix(degToRad(this.data.rotation));
		const matRotateX = new Matrix3D().rotateXMatrix(this.state.angle - degToRad(this.data.angleMin));

		const matrix = matTransToOrigin
			.multiply(matRotateToOrigin)
			.multiply(matRotateX)
			.multiply(matRotateFromOrigin)
			.multiply(matTransFromOrigin);

		const plateObj = obj.children.find(c => c.name === `spinner.plate-${this.getName()}`)!;
		plateObj.matrix = matrix.toThreeMatrix4();
		plateObj.matrixWorldNeedsUpdate = true;

		//console.log('new spinner state: ', degToRad(this.state.angle));
	}

}
