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
import { IFireEvents } from '../../physics/events';
import { Meshes } from '../item-data';
import { Table } from '../table/table';
import { PrimitiveData } from './primitive-data';
import { PrimitiveMeshGenerator } from './primitive-mesh-generator';

/**
 * VPinball's primitive.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/primitive.cpp
 */
export class Primitive implements IRenderable, IFireEvents {

	public currentHitThreshold: number = 0;

	private readonly data: PrimitiveData;
	private readonly meshGenerator: PrimitiveMeshGenerator;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Primitive> {
		const data = await PrimitiveData.fromStorage(storage, itemName);
		return new Primitive(data);
	}

	private constructor(data: PrimitiveData) {
		this.data = data;
		this.meshGenerator = new PrimitiveMeshGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.fVisible;
	}

	public getMeshes(table: Table): Meshes {
		return {
			primitive: {
				mesh: this.meshGenerator.getMesh(table).transform(new Matrix3D().toRightHanded()),
				map: table.getTexture(this.data.szImage),
				normalMap: table.getTexture(this.data.szNormalMap),
				material: table.getMaterial(this.data.szMaterial),
			},
		};
	}
}
