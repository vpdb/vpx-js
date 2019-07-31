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
import { Texture } from '../texture';
import { KickerData } from './kicker-data';
import { KickerMeshGenerator } from './kicker-mesh-generator';

/**
 * VPinball's kickers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/kicker.cpp
 */
export class Kicker implements IRenderable {

	public static TypeKickerInvisible = 0;
	public static TypeKickerHole = 1;
	public static TypeKickerCup = 2;
	public static TypeKickerHoleSimple = 3;
	public static TypeKickerWilliams = 4;
	public static TypeKickerGottlieb = 5;
	public static TypeKickerCup2 = 6;

	private readonly data: KickerData;
	private readonly meshGenerator: KickerMeshGenerator;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Kicker> {
		const data = await KickerData.fromStorage(storage, itemName);
		return new Kicker(data);
	}

	private constructor(data: KickerData) {
		this.data = data;
		this.meshGenerator = new KickerMeshGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.kickerType !== Kicker.TypeKickerInvisible;
	}

	public getMeshes(table: Table): Meshes {
		return {
			kicker: {
				mesh: this.meshGenerator.getMesh(table).transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
				map: this.getTexture(),
			},
		};
	}

	private getTexture(): Texture {
		switch (this.data.kickerType) {
			case Kicker.TypeKickerCup: return Texture.fromFilesystem('kickerCup.bmp');
			case Kicker.TypeKickerWilliams: return Texture.fromFilesystem('kickerWilliams.bmp');
			case Kicker.TypeKickerGottlieb: return Texture.fromFilesystem('kickerGottlieb.bmp');
			case Kicker.TypeKickerCup2: return Texture.fromFilesystem('kickerT1.bmp');
			case Kicker.TypeKickerHole: return Texture.fromFilesystem('kickerHoleWood.bmp');
			case Kicker.TypeKickerHoleSimple:
			default:
				return Texture.fromFilesystem('kickerHoleWood.bmp');
		}
	}
}
