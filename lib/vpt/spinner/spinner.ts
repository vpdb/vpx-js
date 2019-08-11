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
import { IHittable } from '../../game/ihittable';
import { IMovable } from '../../game/imovable';
import { IPlayable } from '../../game/iplayable';
import { IRenderable } from '../../game/irenderable';
import { Player } from '../../game/player';
import { degToRad } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex2D } from '../../math/vertex2d';
import { FireEvents } from '../../physics/fire-events';
import { HitCircle } from '../../physics/hit-circle';
import { HitObject } from '../../physics/hit-object';
import { MoverObject } from '../../physics/mover-object';
import { FlipperState } from '../flipper/flipper-state';
import { Meshes } from '../item-data';
import { SpinnerData } from './spinner-data';
import { SpinnerHit } from './spinner-hit';
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
	private hit?: SpinnerHit;
	private fireEvents?: FireEvents;
	private hitCircles: HitCircle[] = [];

	public static async fromStorage(storage: Storage, itemName: string): Promise<Spinner> {
		const data = await SpinnerData.fromStorage(storage, itemName);
		return new Spinner(data);
	}

	constructor(data: SpinnerData) {
		this.data = data;
		this.state = new SpinnerState(this.data.getName(), 0);
		this.meshGenerator = new SpinnerMeshGenerator(data);
	}

	public getName(): string {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.fVisible;
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

	public getHitShapes(): HitObject[] {
		return [ this.hit!, ...this.hitCircles ];
	}

	public getMover(): MoverObject {
		return this.hit!.getMoverObject();
	}

	public getState(): FlipperState {
		return this.state;
	}

	public applyState(obj: Object3D, table: Table, player: Player): void {
		// todo
	}

	public setupPlayer(player: Player, table: Table): void {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y);
		const h = this.data.height + 30.0;

		const angleMin = Math.min(this.data.angleMin, this.data.angleMax); // correct angle inversions
		const angleMax = Math.max(this.data.angleMin, this.data.angleMax);

		this.data.angleMin = angleMin;
		this.data.angleMax = angleMax;

		this.fireEvents = new FireEvents(this);
		this.hit = new SpinnerHit(this.data, this.state, this.fireEvents, height);

		if (this.data.showBracket) {
			/*add a hit shape for the bracket if shown, just in case if the bracket spinner height is low enough so the ball can hit it*/
			const halfLength = this.data.length * 0.5 + (this.data.length * 0.1875);
			const radAngle = degToRad(this.data.rotation);
			const sn = Math.sin(radAngle);
			const cs = Math.cos(radAngle);

			this.hitCircles = [
				new HitCircle(
					new Vertex2D(this.data.vCenter.x + cs * halfLength, this.data.vCenter.y + sn * halfLength),
					this.data.length * 0.075,
					height + this.data.height,
					height + h,
				),
				new HitCircle(
					new Vertex2D(this.data.vCenter.x - cs * halfLength, this.data.vCenter.y - sn * halfLength),
					this.data.length * 0.075,
					height + this.data.height,
					height + h,
				),
			];
		}
	}
}
