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
import { Table } from '../table/table';
import { Texture } from '../texture';
import { BumperData } from './bumper-data';
import { BumperMeshGenerator } from './bumper-mesh-generator';

/**
 * VPinball's bumper item.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/bumper.cpp
 */
export class Bumper implements IRenderable {

	private readonly data: BumperData;
	private readonly meshGenerator: BumperMeshGenerator;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Bumper> {
		const data = await BumperData.fromStorage(storage, itemName);
		return new Bumper(data);
	}

	private constructor(data: BumperData) {
		this.data = data;
		this.meshGenerator = new BumperMeshGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.fBaseVisible || this.data.fRingVisible || this.data.fSkirtVisible || this.data.fCapVisible;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};
		const bumper = this.meshGenerator.getMeshes(table);
		if (bumper.base) {
			meshes.base = {
				mesh: bumper.base.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szBaseMaterial),
				map: Texture.fromFilesystem('bumperbase.bmp'),
			};
		}
		if (bumper.ring) {
			meshes.ring = {
				mesh: bumper.ring.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szRingMaterial),
				map: Texture.fromFilesystem('bumperring.bmp'),
			};
		}
		if (bumper.skirt) {
			meshes.skirt = {
				mesh: bumper.skirt.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szSkirtMaterial),
				map: Texture.fromFilesystem('bumperskirt.bmp'),
			};
		}
		if (bumper.cap) {
			meshes.cap = {
				mesh: bumper.cap.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szCapMaterial),
				map: Texture.fromFilesystem('bumperCap.bmp'),
			};
		}
		return meshes;
	}
}
