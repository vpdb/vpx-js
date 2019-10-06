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
import { Item } from '../item';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { RampApi } from './ramp-api';
import { RampData } from './ramp-data';
import { RampHitGenerator } from './ramp-hit-generator';
import { RampMeshGenerator } from './ramp-mesh-generator';

/**
 * VPinball's ramps.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/ramp.cpp
 */
export class Ramp extends Item<RampData> implements IRenderable, IHittable, IScriptable<RampApi> {

	public static RampTypeFlat = 0;
	public static RampType4Wire = 1;
	public static RampType2Wire = 2;
	public static RampType3WireLeft = 3;
	public static RampType3WireRight = 4;
	public static RampType1Wire = 5;

	public static RampImageAlignmentWorld = 0;
	public static RampImageAlignmentWrap = 1;

	private readonly meshGenerator: RampMeshGenerator;
	private readonly hitGenerator: RampHitGenerator;

	private hits?: HitObject[];
	private api?: RampApi;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Ramp> {
		const data = await RampData.fromStorage(storage, itemName);
		return new Ramp(data);
	}

	private constructor(data: RampData) {
		super(data);
		this.meshGenerator = new RampMeshGenerator(data);
		this.hitGenerator = new RampHitGenerator(data, this.meshGenerator);
	}

	public isVisible(): boolean {
		return this.data.isVisible && this.data.widthTop > 0 && this.data.widthBottom > 0;
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
		this.api = new RampApi(this.hits, this.data, this.events, player, table);
	}

	public getApi(): RampApi {
		return this.api!;
	}

	public getEventNames(): string[] {
		return [ 'Init' ];
	}

	public getHitShapes(): HitObject[] {
		return this.hits!;
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		const meshes: Meshes<GEOMETRY> = {};
		const ramp = this.meshGenerator.getMeshes(table);
		const isTransparent = this.isTransparent(table);

		if (ramp.wire1) {
			meshes.wire1 = {
				mesh: ramp.wire1.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
				isTransparent,
			};
		}
		if (ramp.wire2) {
			meshes.wire2 = {
				mesh: ramp.wire2.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
				isTransparent,
			};
		}
		if (ramp.wire3) {
			meshes.wire3 = {
				mesh: ramp.wire3.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
				isTransparent,
			};
		}
		if (ramp.wire4) {
			meshes.wire4 = {
				mesh: ramp.wire4.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
				isTransparent,
			};
		}
		if (ramp.floor) {
			meshes.floor = {
				mesh: ramp.floor.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
				map: table.getTexture(this.data.szImage),
				isTransparent,
			};
		}
		if (ramp.left) {
			meshes.left = {
				mesh: ramp.left.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
				map: table.getTexture(this.data.szImage),
				isTransparent,
			};
		}
		if (ramp.right) {
			meshes.right = {
				mesh: ramp.right.transform(Matrix3D.RIGHT_HANDED),
				material: table.getMaterial(this.data.szMaterial),
				map: table.getTexture(this.data.szImage),
				isTransparent,
			};
		}
		return meshes;
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
