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

import { Storage } from '../..';
import { IHittable } from '../../game/ihittable';
import { IRenderable } from '../../game/irenderable';
import { Player } from '../../game/player';
import { VpTableExporterOptions } from '../../gltf/table-exporter';
import { Matrix3D } from '../../math/matrix3d';
import { HitObject } from '../../physics/hit-object';
import { Meshes } from '../item-data';
import { Table } from '../table/table';
import { SurfaceData } from './surface-data';
import { SurfaceHitGenerator } from './surface-hit-generator';
import { SurfaceMesh } from './surface-mesh';

/**
 * VPinball's surfaces, a.k.a as "walls".
 *
 * @see https://github.com/vpinball/vpinball/blob/master/surface.cpp
 */
export class Surface implements IRenderable, IHittable {

	private readonly itemName: string;
	private readonly data: SurfaceData;
	private readonly mesh: SurfaceMesh;
	private hitGenerator: SurfaceHitGenerator;
	private hits: HitObject[] = [];

	// public getters
	get heightTop() { return this.data.heighttop; }
	get image() { return this.data.szImage; }

	public static async fromStorage(storage: Storage, itemName: string): Promise<Surface> {
		const data = await SurfaceData.fromStorage(storage, itemName);
		return new Surface(itemName, data);
	}

	public constructor(itemName: string, data: SurfaceData) {
		this.itemName = itemName;
		this.data = data;
		this.mesh = new SurfaceMesh();
		this.hitGenerator = new SurfaceHitGenerator(data);
	}

	public getName(): string {
		return this.data.wzName;
	}

	public isVisible(): boolean {
		return this.data.fSideVisible || this.data.fTopBottomVisible;
	}

	public getMeshes(table: Table, opts: VpTableExporterOptions): Meshes {
		const meshes: Meshes = {};
		const surface = this.mesh.generateMeshes(this.data, table);
		if (surface.top) {
			meshes.top = {
				mesh: surface.top.transform(new Matrix3D().toRightHanded()),
				map: table.getTexture(this.data.szImage),
				material: table.getMaterial(this.data.szTopMaterial),
			};
		}

		if (surface.side) {
			meshes.side = {
				mesh: surface.side.transform(new Matrix3D().toRightHanded()),
				map: table.getTexture(this.data.szSideImage),
				material: table.getMaterial(this.data.szSideMaterial),
			};
		}

		return meshes;
	}

	public setupPlayer(player: Player, table: Table): void {
		this.hits = this.hitGenerator.generateHitObjects(table);
	}

	public getHitShapes(): HitObject[] {
		return this.hits;
	}
}
