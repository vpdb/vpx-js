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

import { Matrix4, Object3D } from 'three';
import { EventProxy } from '../../game/event-proxy';
import { IHittable } from '../../game/ihittable';
import { IMovable } from '../../game/imovable';
import { IPlayable } from '../../game/iplayable';
import { IRenderable } from '../../game/irenderable';
import { IScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { degToRad } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex2D } from '../../math/vertex2d';
import { HitCircle } from '../../physics/hit-circle';
import { HitObject } from '../../physics/hit-object';
import { LineSeg } from '../../physics/line-seg';
import { Meshes } from '../item-data';
import { Table } from '../table/table';
import { GateApi } from './gate-api';
import { GateData } from './gate-data';
import { GateHit } from './gate-hit';
import { GateHitGenerator } from './gate-hit-generator';
import { GateMeshGenerator } from './gate-mesh-generator';
import { GateMover } from './gate-mover';
import { GateState } from './gate-state';

/**
 * VPinball's gates.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/gate.cpp
 */
export class Gate implements IRenderable, IPlayable, IMovable<GateState>, IHittable, IScriptable<GateApi> {

	public static TypeGateWireW = 1;
	public static TypeGateWireRectangle = 2;
	public static TypeGatePlate = 3;
	public static TypeGateLongPlate = 4;

	private readonly data: GateData;
	private readonly meshGenerator: GateMeshGenerator;
	private readonly hitGenerator: GateHitGenerator;
	private readonly state: GateState;
	private events?: EventProxy;
	private api?: GateApi;
	private hitGate?: GateHit;
	private hitLines?: LineSeg[];
	private hitCircles?: HitCircle[];

	public static async fromStorage(storage: Storage, itemName: string): Promise<Gate> {
		const data = await GateData.fromStorage(storage, itemName);
		return new Gate(data);
	}

	private constructor(data: GateData) {
		this.data = data;
		this.state = new GateState(this.getName(), 0);
		this.meshGenerator = new GateMeshGenerator(data);
		this.hitGenerator = new GateHitGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.isVisible;
	}

	public isCollidable(): boolean {
		return this.data.isCollidable;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};
		const gate = this.meshGenerator.getMeshes(table);

		// wire mesh
		meshes.wire = {
			mesh: gate.wire.transform(new Matrix3D().toRightHanded()),
			material: table.getMaterial(this.data.szMaterial),
		};

		// bracket mesh
		if (gate.bracket) {
			meshes.bracket = {
				mesh: gate.bracket.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
			};
		}
		return meshes;
	}

	public setupPlayer(player: Player, table: Table): void {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y);
		const radAngle = degToRad(this.data.rotation);
		const tangent = new Vertex2D(Math.cos(radAngle), Math.sin(radAngle));

		this.events = new EventProxy(this);
		this.hitGate = this.hitGenerator.generateGateHit(this.state, this.events, height);
		this.hitLines = this.hitGenerator.generateLineSegs(this.events, height, tangent);
		this.hitCircles = this.hitGenerator.generateBracketHits(this.state, this.events, height, tangent);
		this.api = new GateApi(this.data, this.state, this.getMover(), this.hitGate, this.hitLines.length ? this.hitLines[0] : null, player, table);
	}

	public getHitShapes(): HitObject[] {
		return [this.hitGate!, ...this.hitLines!, ...this.hitCircles!];
	}

	public getMover(): GateMover {
		return this.hitGate!.getMoverObject();
	}

	public getState(): GateState {
		return this.state;
	}

	public getApi(): GateApi {
		return this.api!;
	}

	/* istanbul ignore next */
	public applyState(obj: Object3D, table: Table, player: Player, oldState: GateState): void {
		const posZ = this.data.height;
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

		const wireObj = obj.children.find(c => c.name === `gate.wire-${this.data.getName()}`)!;
		wireObj.matrix = new Matrix4();
		wireObj.applyMatrix(matrix.toThreeMatrix4());
	}

	public getEventNames(): string[] {
		return [ 'Hit', 'Init', 'LimitBOS', 'LimitEOS', 'Timer' ];
	}
}
