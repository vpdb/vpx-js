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
import { SpinnerData } from './spinner-data';
import { SpinnerMeshGenerator } from './spinner-mesh-generator';

/**
 * VPinball's spinners.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/spinner.cpp
 */
export class Spinner implements IRenderable {

	private readonly data: SpinnerData;
	private readonly meshGenerator: SpinnerMeshGenerator;
	//private state: SpinnerState;
	//private hit?: SpinnerHit;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Spinner> {
		const data = await SpinnerData.fromStorage(storage, itemName);
		return new Spinner(data);
	}

	constructor(data: SpinnerData) {
		this.data = data;
		this.meshGenerator = new SpinnerMeshGenerator(data);
	}

	public getName(): string {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.fVisible;
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
}
