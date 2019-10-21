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
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { degToRad } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex2D } from '../../math/vertex2d';
import { HitObject } from '../../physics/hit-object';
import { IRenderApi } from '../../render/irender-api';
import { Item } from '../item';
import { Table } from '../table/table';
import { FlipperApi } from './flipper-api';
import { FlipperData } from './flipper-data';
import { FlipperHit } from './flipper-hit';
import { FlipperMesh } from './flipper-mesh';
import { FlipperMover } from './flipper-mover';
import { FlipperState } from './flipper-state';
import { FlipperUpdater } from './flipper-updater';
import { SpinnerUpdater } from '../spinner/spinner-updater';

/**
 * VPinball's flippers
 *
 * @see https://github.com/vpinball/vpinball/blob/master/flipper.cpp
 */
export class Flipper extends Item<FlipperData> implements IRenderable<FlipperState>, IPlayable, IMovable, IHittable, IScriptable<FlipperApi> {

	private readonly mesh: FlipperMesh;
	private readonly state: FlipperState;
	private readonly updater: FlipperUpdater;
	private hit?: FlipperHit;
	private api?: FlipperApi;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Flipper> {
		const data = await FlipperData.fromStorage(storage, itemName);
		return new Flipper(itemName, data);
	}

	public constructor(itemName: string, data: FlipperData) {
		super(data);
		this.mesh = new FlipperMesh();
		this.state = FlipperState.claim(this.getName(), this.data.startAngle, this.data.center.clone(), this.data.isVisible, this.data.szMaterial!, this.data.szImage!, this.data.szRubberMaterial!);
		this.updater = new FlipperUpdater(this.data, this.state);
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

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.hit = FlipperHit.getInstance(this.data, this.state, this.events, player.getPhysics(), table);
		this.api = new FlipperApi(this.data, this.state, this.hit, this.getMover(), this.events, player, table);
	}

	public getApi(): FlipperApi {
		return this.api!;
	}

	public getHitShapes(): HitObject[] {
		return [ this.hit! ];
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		const meshes: Meshes<GEOMETRY> = {};

		const matrix = this.getMatrix().toRightHanded();
		const flipper = this.mesh.generateMeshes(this.data, table);

		// base mesh
		meshes.base = {
			isVisible: this.data.isVisible,
			mesh: flipper.base.transform(matrix),
			material: table.getMaterial(this.data.szMaterial),
			map: table.getTexture(this.data.szImage),
		};

		// rubber mesh
		if (flipper.rubber) {
			meshes.rubber = {
				isVisible: this.data.isVisible,
				mesh: flipper.rubber.transform(matrix),
				material: table.getMaterial(this.data.szRubberMaterial),
			};
		}
		return meshes;
	}

	public getFlipperData(): FlipperData {
		return this.data;
	}

	private getMatrix(rotation: number = this.data.startAngle): Matrix3D {
		const trafoMatrix = new Matrix3D();
		const tempMatrix = Matrix3D.claim();
		trafoMatrix.setTranslation(this.data.center.x, this.data.center.y, 0);
		tempMatrix.rotateZMatrix(degToRad(rotation));
		trafoMatrix.preMultiply(tempMatrix);

		Matrix3D.release(tempMatrix);
		return trafoMatrix;
	}

	public getEventNames(): string[] {
		return [ 'Init', 'Timer', 'LimitEOS', 'LimitBOS', 'Hit', 'Collide' ];
	}

	public getUpdater(): FlipperUpdater {
		return this.updater;
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
