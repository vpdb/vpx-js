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

import { IHittable } from '../../game/ihittable';
import { IRenderable } from '../../game/irenderable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { f4 } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex2D } from '../../math/vertex2d';
import { FireEvents } from '../../physics/fire-events';
import { HitObject } from '../../physics/hit-object';
import { Meshes } from '../item-data';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { RampData } from './ramp-data';
import { RampHitGenerator } from './ramp-hit-generator';
import { RampMeshGenerator } from './ramp-mesh-generator';

/**
 * VPinball's ramps.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/ramp.cpp
 */
export class Ramp implements IRenderable, IHittable {

	public static RampTypeFlat = 0;
	public static RampType4Wire = 1;
	public static RampType2Wire = 2;
	public static RampType3WireLeft = 3;
	public static RampType3WireRight = 4;
	public static RampType1Wire = 5;

	public static RampImageAlignmentWorld = 0;
	public static RampImageAlignmentWrap = 1;

	private readonly data: RampData;
	private readonly meshGenerator: RampMeshGenerator;
	private readonly hitGenerator: RampHitGenerator;

	private hits?: Array<HitObject<FireEvents>>;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Ramp> {
		const data = await RampData.fromStorage(storage, itemName);
		return new Ramp(data);
	}

	private constructor(data: RampData) {
		this.data = data;
		this.meshGenerator = new RampMeshGenerator(data);
		this.hitGenerator = new RampHitGenerator(data, this.meshGenerator);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.isVisible && this.data.widthTop > 0 && this.data.widthBottom > 0;
	}

	public isCollidable(): boolean {
		return this.data.isCollidable;
	}

	public setupPlayer(player: Player, table: Table): void {
		this.hits = this.hitGenerator.generateHitObjects(table);
	}

	public getHitShapes(): Array<HitObject<FireEvents>> {
		return this.hits!;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};
		const ramp = this.meshGenerator.getMeshes(table);

		if (ramp.wire1) {
			meshes.wire1 = {
				mesh: ramp.wire1.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
			};
		}
		if (ramp.wire2) {
			meshes.wire2 = {
				mesh: ramp.wire2.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
			};
		}
		if (ramp.wire3) {
			meshes.wire3 = {
				mesh: ramp.wire3.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
			};
		}
		if (ramp.wire4) {
			meshes.wire4 = {
				mesh: ramp.wire4.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
			};
		}
		if (ramp.floor) {
			meshes.floor = {
				mesh: ramp.floor.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
				map: table.getTexture(this.data.szImage),
			};
		}
		if (ramp.left) {
			meshes.left = {
				mesh: ramp.left.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
				map: table.getTexture(this.data.szImage),
			};
		}
		if (ramp.right) {
			meshes.right = {
				mesh: ramp.right.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
				map: table.getTexture(this.data.szImage),
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
