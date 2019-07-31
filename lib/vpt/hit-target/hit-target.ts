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
import { f4 } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Meshes } from '../item-data';
import { Table } from '../table';
import { HitTargetData } from './hit-target-data';
import { HitTargetMeshGenerator } from './hit-target-mesh-generator';

/**
 * VPinball's hit- and drop targets.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/hittarget.cpp
 */
export class HitTarget implements IRenderable {

	public static TypeDropTargetBeveled = 1;
	public static TypeDropTargetSimple = 2;
	public static TypeHitTargetRound = 3;
	public static TypeHitTargetRectangle = 4;
	public static TypeHitFatTargetRectangle = 5;
	public static TypeHitFatTargetSquare = 6;
	public static TypeDropTargetFlatSimple = 7;
	public static TypeHitFatTargetSlim = 8;
	public static TypeHitTargetSlim = 9;

	public static DROP_TARGET_LIMIT = f4(52.0);

	private readonly data: HitTargetData;
	private readonly meshGenerator: HitTargetMeshGenerator;

	public static async fromStorage(storage: Storage, itemName: string): Promise<HitTarget> {
		const data = await HitTargetData.fromStorage(storage, itemName);
		return new HitTarget(data);
	}

	private constructor(data: HitTargetData) {
		this.data = data;
		this.meshGenerator = new HitTargetMeshGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.fVisible;
	}

	public getMeshes(table: Table): Meshes {
		return {
			hitTarget: {
				mesh: this.meshGenerator.getMesh(table).transform(new Matrix3D().toRightHanded()),
				map: table.getTexture(this.data.szImage),
				material: table.getMaterial(this.data.szMaterial),
			},
		};
	}
}
