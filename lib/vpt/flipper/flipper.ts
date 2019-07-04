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
import { degToRad } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { GameItem, IRenderable, Meshes } from '../game-item';
import { Table } from '../table';
import { FlipperData } from './flipper-data';
import { FlipperMesh } from './flipper-mesh';

/**
 * VPinball's flippers
 *
 * @see https://github.com/vpinball/vpinball/blob/master/flipper.cpp
 */
export class Flipper extends GameItem implements IRenderable {

	private readonly data: FlipperData;
	private readonly mesh: FlipperMesh;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Flipper> {
		const data = await FlipperData.fromStorage(storage, itemName);
		return new Flipper(itemName, data);
	}

	public constructor(itemName: string, data: FlipperData) {
		super(itemName);
		this.data = data;
		this.mesh = new FlipperMesh();
	}

	public isVisible(): boolean {
		return this.data.fVisible;
	}

	public getName(): string {
		return this.data.wzName;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};

		const matrix = this.getMatrix();
		const flipper = this.mesh.generateMeshes(this.data, table);

		// base mesh
		meshes.base = {
			mesh: flipper.base.transform(matrix.toRightHanded()),
			material: table.getMaterial(this.data.szMaterial),
			map: table.getTexture(this.data.szImage),
		};

		// rubber mesh
		if (flipper.rubber) {
			meshes.rubber = {
				mesh: flipper.rubber.transform(matrix.toRightHanded()),
				material: table.getMaterial(this.data.szRubberMaterial),
			};
		}
		return meshes;
	}

	public getMatrix(rotation: number = this.data.startAngle): Matrix3D {
		const trafoMatrix = new Matrix3D();
		// const tempMatrix = new Matrix3D();
		trafoMatrix.setTranslation(this.data.center.x, this.data.center.y, 0);
		// tempMatrix.rotateZMatrix(degToRad(rotation));
		// trafoMatrix.preMultiply(tempMatrix);
		return trafoMatrix;
	}

	public getDynamicMatrix(rotation: number = 0) {
		const matTrafo = new Matrix3D();
		matTrafo.setIdentity();
		// matTrafo._41 = this.data.center.x;
		// matTrafo._42 = this.data.center.y;
		const matTemp = new Matrix3D();
		matTemp.rotateZMatrix(rotation);
		matTrafo.multiply(matTemp, matTrafo);
		return matTrafo;
	}
}
