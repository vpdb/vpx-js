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
import { IHittable } from '../../game/ihittable';
import { IMovable } from '../../game/imovable';
import { IPlayable } from '../../game/iplayable';
import { IRenderable } from '../../game/irenderable';
import { Player } from '../../game/player';
import { degToRad } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex2D } from '../../math/vertex2d';
import { HitObject } from '../../physics/hit-object';
import { Meshes } from '../item-data';
import { Table } from '../table/table';
import { FlipperData } from './flipper-data';
import { FlipperHit } from './flipper-hit';
import { FlipperMesh } from './flipper-mesh';
import { FlipperMover } from './flipper-mover';
import { FlipperState } from './flipper-state';
import { FireEvent, FireEvents } from '../../physics/fire-events';

/**
 * VPinball's flippers
 *
 * @see https://github.com/vpinball/vpinball/blob/master/flipper.cpp
 */
export class Flipper implements IRenderable, IPlayable, IMovable<FlipperState>, IHittable {

	private readonly data: FlipperData;
	private readonly mesh: FlipperMesh;
	private readonly state: FlipperState;
	private hit?: FlipperHit;
	private fireEvents?: FireEvents;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Flipper> {
		const data = await FlipperData.fromStorage(storage, itemName);
		return new Flipper(itemName, data);
	}

	public constructor(itemName: string, data: FlipperData) {
		this.data = data;
		this.mesh = new FlipperMesh();
		this.state = new FlipperState(this.getName(), this.data.startAngle);
	}

	public setupPlayer(player: Player, table: Table): void {
		this.fireEvents = new FireEvents(this);
		this.hit = FlipperHit.getInstance(this.data, this.state, this.fireEvents, player, table);
	}

	public isVisible(): boolean {
		return this.data.fVisible;
	}

	public isCollidable(): boolean {
		return true;
	}

	public getMover(): FlipperMover {
		return this.hit!.getMoverObject();
	}

	public getState(): FlipperState {
		return this.state;
	}

	public getHitShapes(): HitObject[] {
		return [ this.hit! ];
	}

	public getName(): string {
		return this.data.wzName;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};

		const matrix = this.getMatrix();
		const flipper = this.mesh.generateMeshes(this.data, table);

		// base mesh
		meshes.base = {
			mesh: flipper.base.transform(matrix.toRightHanded()),
			material: table.getMaterial(this.data.szMaterial),
			map: table.getTexture(this.data.szImage),
		};

		// rubber mesh
		if (flipper.rubber) {
			meshes.rubber = {
				mesh: flipper.rubber.transform(matrix.toRightHanded()),
				material: table.getMaterial(this.data.szRubberMaterial),
			};
		}
		return meshes;
	}

	public rotateToEnd(): void { // power stroke to hit ball, key/button down/pressed
		this.getMover().enableRotateEvent = 1;
		this.getMover().setSolenoidState(true);
	}

	public rotateToStart() { // return to park, key/button up/released
		this.getMover().enableRotateEvent = -1;
		this.getMover().setSolenoidState(false);
	}

	public applyState(obj: Object3D): void {
		const matToOrigin = new Matrix3D().setTranslation(-this.data.center.x, -this.data.center.y, 0);
		const matFromOrigin = new Matrix3D().setTranslation(this.data.center.x, this.data.center.y, 0);
		const matRotate = new Matrix3D().rotateZMatrix(this.state.angle - degToRad(this.data.startAngle));
		const matrix = matToOrigin.multiply(matRotate).multiply(matFromOrigin);

		obj.matrix = matrix.toThreeMatrix4();
		obj.matrixWorldNeedsUpdate = true;
	}

	public getFlipperData(): FlipperData {
		return this.data;
	}

	private getMatrix(rotation: number = this.data.startAngle): Matrix3D {
		const trafoMatrix = new Matrix3D();
		const tempMatrix = new Matrix3D();
		trafoMatrix.setTranslation(this.data.center.x, this.data.center.y, 0);
		tempMatrix.rotateZMatrix(degToRad(rotation));
		trafoMatrix.preMultiply(tempMatrix);
		return trafoMatrix;
	}
}

export interface FlipperConfig {
	center: Vertex2D;
	baseRadius: number;
	endRadius: number;
	flipperRadius: number;
	angleStart: number;
	angleEnd: number;
	zLow: number;
	zHigh: number;
}
