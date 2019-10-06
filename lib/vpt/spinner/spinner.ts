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
import { HitCircle } from '../../physics/hit-circle';
import { HitObject } from '../../physics/hit-object';
import { MoverObject } from '../../physics/mover-object';
import { IRenderApi } from '../../render/irender-api';
import { FlipperState } from '../flipper/flipper-state';
import { Item } from '../item';
import { Table } from '../table/table';
import { SpinnerApi } from './spinner-api';
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
export class Spinner extends Item<SpinnerData> implements IRenderable, IPlayable, IMovable<FlipperState>, IHittable, IScriptable<SpinnerApi> {

	private readonly meshGenerator: SpinnerMeshGenerator;
	private readonly state: SpinnerState;
	private readonly hitGenerator: SpinnerHitGenerator;
	private hit?: SpinnerHit;
	private hitCircles: HitCircle[] = [];
	private api?: SpinnerApi;

	// public props
	get angleMin() { return this.data.angleMin; }
	get angleMax() { return this.data.angleMax; }

	public static async fromStorage(storage: Storage, itemName: string): Promise<Spinner> {
		const data = await SpinnerData.fromStorage(storage, itemName);
		return new Spinner(data);
	}

	constructor(data: SpinnerData) {
		super(data);
		this.state = SpinnerState.claim(this.data.getName(), 0);
		this.meshGenerator = new SpinnerMeshGenerator(data);
		this.hitGenerator = new SpinnerHitGenerator(data);
	}

	public isVisible(): boolean {
		return this.data.isVisible;
	}

	public isCollidable(): boolean {
		return true;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		const spinner = this.meshGenerator.generateMeshes(table);
		const meshes: Meshes<GEOMETRY> = {};

		meshes.plate = {
			mesh: spinner.plate.transform(Matrix3D.RIGHT_HANDED),
			map: table.getTexture(this.data.szImage),
			material: table.getMaterial(this.data.szMaterial),
		};
		if (spinner.bracket) {
			meshes.bracket = {
				mesh: spinner.bracket.transform(Matrix3D.RIGHT_HANDED),
				map: table.getTexture(this.data.szImage),
				material: table.getMaterial(this.data.szMaterial),
			};
		}
		return meshes;
	}

	public setupPlayer(player: Player, table: Table): void {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y);
		this.events = new EventProxy(this);
		this.hit = new SpinnerHit(this.data, this.state, this.events, height);
		this.hitCircles = this.hitGenerator.getHitShapes(this.state, height);
		this.api = new SpinnerApi(this.state, this.hit.getMoverObject(), this.data, this.events, player, table);
	}

	public getApi(): SpinnerApi {
		return this.api!;
	}

	public getEventNames(): string[] {
		throw [ 'Init', 'LimitBOS', 'LimitEOS', 'Spin', 'Timer' ];
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

	/* istanbul ignore next */
	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: SpinnerState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {

		const posZ = this.meshGenerator.getZ(table);
		const matTransToOrigin = Matrix3D.claim().setTranslation(-this.data.center.x, -this.data.center.y, posZ);
		const matRotateToOrigin = Matrix3D.claim().rotateZMatrix(degToRad(-this.data.rotation));
		const matTransFromOrigin = Matrix3D.claim().setTranslation(this.data.center.x, this.data.center.y, -posZ);
		const matRotateFromOrigin = Matrix3D.claim().rotateZMatrix(degToRad(this.data.rotation));
		const matRotateX = Matrix3D.claim().rotateXMatrix(state.angle - degToRad(this.data.angleMin));

		const matrix = matTransToOrigin
			.multiply(matRotateToOrigin)
			.multiply(matRotateX)
			.multiply(matRotateFromOrigin)
			.multiply(matTransFromOrigin);

		const plateObj = renderApi.findInGroup(obj, `spinner.plate-${this.getName()}`);
		renderApi.applyMatrixToNode(matrix, plateObj!);

		Matrix3D.release(matTransToOrigin, matRotateToOrigin, matTransFromOrigin, matRotateFromOrigin, matRotateX);
	}
}
