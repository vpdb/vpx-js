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
import { IRenderable } from '../../game/irenderable';
import { Matrix3D } from '../../math/matrix3d';
import { Meshes } from '../item-data';
import { Table } from '../table';
import { GateData } from './gate-data';
import { GateMeshGenerator } from './gate-mesh-generator';

/**
 * VPinball's gates.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/gate.cpp
 */
export class Gate implements IRenderable {

	public static TypeGateWireW = 1;
	public static TypeGateWireRectangle = 2;
	public static TypeGatePlate = 3;
	public static TypeGateLongPlate = 4;

	private readonly data: GateData;
	private readonly meshGenerator: GateMeshGenerator;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Gate> {
		const data = await GateData.fromStorage(storage, itemName);
		return new Gate(data);
	}

	private constructor(data: GateData) {
		this.data = data;
		this.meshGenerator = new GateMeshGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.fVisible;
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
}
