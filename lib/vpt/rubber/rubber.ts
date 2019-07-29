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
import { Meshes } from '../item-data';
import { Table } from '../table';
import { RubberData } from './rubber-data';
import { RubberMeshGenerator } from './rubber-mesh-generator';

/**
 * VPinball's rubber item.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/rubber.cpp
 */
export class Rubber implements IRenderable {

	private readonly data: RubberData;
	private readonly meshGenerator: RubberMeshGenerator;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Rubber> {
		const data = await RubberData.fromStorage(storage, itemName);
		return new Rubber(data);
	}

	private constructor(data: RubberData) {
		this.data = data;
		this.meshGenerator = new RubberMeshGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.fVisible;
	}

	public getMeshes(table: Table): Meshes {

		const mesh = this.meshGenerator.getMeshes(table);
		return {
			rubber: {
				mesh,
				map: table.getTexture(this.data.szImage),
				material: table.getMaterial(this.data.szMaterial),
			},
		};
	}
}
