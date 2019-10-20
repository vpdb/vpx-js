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
import { IRenderable, Meshes } from '../../game/irenderable';
import { IScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { f4 } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex2D } from '../../math/vertex2d';
import { HitObject } from '../../physics/hit-object';
import { IRenderApi } from '../../render/irender-api';
import { Item } from '../item';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { RampApi } from './ramp-api';
import { RampData } from './ramp-data';
import { RampHitGenerator } from './ramp-hit-generator';
import { RampMeshGenerator } from './ramp-mesh-generator';
import { RampState } from './ramp-state';
import { RampUpdater } from './ramp-updater';

/**
 * VPinball's ramps.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/ramp.cpp
 */
export class Ramp extends Item<RampData> implements IRenderable<RampState>, IHittable, IScriptable<RampApi> {

	private readonly meshGenerator: RampMeshGenerator;
	private readonly hitGenerator: RampHitGenerator;

	private readonly state: RampState;
	private readonly updater: RampUpdater;
	private hits?: HitObject[];
	private api?: RampApi;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Ramp> {
		const data = await RampData.fromStorage(storage, itemName);
		return new Ramp(data);
	}

	private constructor(data: RampData) {
		super(data);
		this.state = RampState.claim(data.getName(), data.heightBottom,
			data.heightTop, data.widthBottom, data.widthTop, data.leftWallHeight, data.rightWallHeight,
			data.leftWallHeightVisible, data.rightWallHeightVisible, data.rampType,
			data.szMaterial, data.szImage, data.imageAlignment, data.imageWalls,
			data.depthBias, data.isVisible && data.widthTop > 0 && data.widthBottom > 0);
		this.meshGenerator = new RampMeshGenerator(data, this.state);
		this.hitGenerator = new RampHitGenerator(data, this.meshGenerator);
		this.updater = new RampUpdater(this.state, this.meshGenerator);
	}

	public isCollidable(): boolean {
		return this.data.isCollidable;
	}

	public isTransparent(table: Table): boolean {
		const material = table.getMaterial(this.data.szMaterial);
		return !material || material.isOpacityActive;
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.hits = this.hitGenerator.generateHitObjects(table, this.events);
		this.api = new RampApi(this.state, this.hits, this.data, this.events, player, table);
	}

	public getApi(): RampApi {
		return this.api!;
	}

	public getState(): RampState {
		return this.state;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: RampState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table, oldState: RampState): void {
		this.updater.applyState(obj, state, renderApi, table);
	}

	public getEventNames(): string[] {
		return [ 'Init' ];
	}

	public getHitShapes(): HitObject[] {
		return this.hits!;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		const isTransparent = this.isTransparent(table);
		return this.meshGenerator.getMeshes(isTransparent, table);
	}

	public getSurfaceHeight(x: number, y: number, table: Table) {
		const vVertex = this.meshGenerator.getCentralCurve(table);

		let iSeg: number;
		let vOut: Vertex2D;
		[vOut, iSeg] = Mesh.closestPointOnPolygon(vVertex, new Vertex2D(x, y), false);

		if (iSeg === -1) {
			return 0.0; // Object is not on ramp path
		}

		// Go through vertices (including iSeg itself) counting control points until iSeg
		let totalLength = 0.0;
		let startLength = 0.0;

		const cVertex = vVertex.length;
		for (let i2 = 1; i2 < cVertex; i2++) {
			const vDx = f4(vVertex[i2].x - vVertex[i2 - 1].x);
			const vDy = f4(vVertex[i2].y - vVertex[i2 - 1].y);
			const vLen = f4(Math.sqrt(f4(f4(vDx * vDx) + f4(vDy * vDy))));
			if (i2 <= iSeg) {
				startLength = f4(startLength + vLen);
			}
			totalLength = f4(totalLength + vLen);
		}

		const dx = f4(vOut.x - vVertex[iSeg].x);
		const dy = f4(vOut.y - vVertex[iSeg].y);
		const len = f4(Math.sqrt(f4(f4(dx * dx) + f4(dy * dy))));
		startLength = f4(startLength + len); // Add the distance the object is between the two closest polyline segments.  Matters mostly for straight edges. Z does not respect that yet!

		const topHeight = f4(this.data.heightTop + table.getTableHeight());
		const bottomHeight = f4(this.data.heightBottom + table.getTableHeight());

		return f4(f4(vVertex[iSeg].z + f4(f4(startLength / totalLength) * f4(topHeight - bottomHeight))) + bottomHeight);
	}
}
