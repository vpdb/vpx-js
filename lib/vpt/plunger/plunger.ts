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
import { VpTableExporterOptions } from '../../gltf/table-exporter';
import { IRenderable, Meshes } from '../game-item';
import { Table } from '../table';
import { PlungerData } from './plunger-data';
import { PlungerMesh } from './plunger-mesh';

/**
 * VPinball's plunger.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/plunger.cpp
 */
export class Plunger implements IRenderable {

	private readonly data: PlungerData;
	private readonly mesh: PlungerMesh;

	public static async fromStorage(storage: Storage, itemName: string, table: Table): Promise<Plunger> {
		const data = await PlungerData.fromStorage(storage, itemName);
		return new Plunger(itemName, data, table);
	}

	public constructor(itemName: string, data: PlungerData, table: Table) {
		this.data = data;
		this.mesh = new PlungerMesh(data, table);
	}

	public getName(): string {
		return this.data.getName();
	}

	public getData(): PlungerData {
		return this.data;
	}

	public getMeshes(table: Table, opts: VpTableExporterOptions): Meshes {
		const plunger = this.mesh.generateMeshes();
		const meshes: Meshes = {};

		if (plunger.rod) {
			meshes.rod = {
				mesh: plunger.rod,
			};
		}
		if (plunger.spring) {
			meshes.spring = {
				mesh: plunger.spring,
			};
		}
		if (plunger.flat) {
			meshes.flat = {
				mesh: plunger.flat,
			};
		}
		return meshes;
	}

	public isVisible(table: Table): boolean {
		return this.data.isVisible();
	}

}

export enum PlungerType {
	Modern = 1,
	Flat = 2,
	Custom = 3,
}
