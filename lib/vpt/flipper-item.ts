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

import { Storage } from '..';
import { flipperBaseMesh } from '../../res/meshes/flipper-base-mesh';
import { degToRad, f4 } from '../math/float';
import { Matrix3D } from '../math/matrix3d';
import { Vertex3D } from '../math/vertex3d';
import { FlipperData } from './flipper/flipper-data';
import { GameItem, IRenderable, Meshes } from './game-item';
import { Mesh } from './mesh';
import { Table } from './table';
import { FlipperMover } from './flipper/flipper-mover';

/**
 * VPinball's flippers
 *
 * @see https://github.com/vpinball/vpinball/blob/master/flipper.cpp
 */
export class FlipperItem extends GameItem implements IRenderable {

	private readonly data: FlipperData;
	//private readonly mover: FlipperMover;

	public static async fromStorage(storage: Storage, itemName: string): Promise<FlipperItem> {
		const flipperData = await FlipperData.fromStorage(storage, itemName);
		return new FlipperItem(itemName, flipperData);
	}

	private constructor(itemName: string, data: FlipperData) {
		super(itemName);
		this.data = data;
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
		const flipper = this.generateMeshes(table);

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

	private getMatrix(): Matrix3D {
		const trafoMatrix = new Matrix3D();
		const tempMatrix = new Matrix3D();
		trafoMatrix.setTranslation(this.data.center.x, this.data.center.y, 0);
		tempMatrix.rotateZMatrix(degToRad(this.data.startAngle));
		trafoMatrix.preMultiply(tempMatrix);
		return trafoMatrix;
	}

	private generateMeshes(table: Table): { base: Mesh, rubber?: Mesh } {

		const fullMatrix = new Matrix3D();
		fullMatrix.rotateZMatrix(degToRad(180.0));

		const height = table.getSurfaceHeight(this.data.szSurface, this.data.center.x, this.data.center.y);
		const baseScale = f4(10.0);
		const tipScale = f4(10.0);
		const baseRadius = f4(this.data.baseRadius - this.data.rubberThickness);
		const endRadius = f4(this.data.endRadius - this.data.rubberThickness);

		// base and tip
		const baseMesh = flipperBaseMesh.clone(`flipper.base-${this.getName()}`);
		for (let t = 0; t < 13; t++) {
			for (const v of baseMesh.vertices) {
				if (v.x === FlipperItem.vertsBaseBottom[t].x && v.y === FlipperItem.vertsBaseBottom[t].y && v.z === FlipperItem.vertsBaseBottom[t].z) {
					v.x *= f4( baseRadius * baseScale);
					v.y *= f4(baseRadius * baseScale);
				}
				if (v.x === FlipperItem.vertsTipBottom[t].x && v.y === FlipperItem.vertsTipBottom[t].y && v.z === FlipperItem.vertsTipBottom[t].z) {
					v.x *= f4(endRadius * tipScale);
					v.y *= f4(endRadius * tipScale);
					v.y += this.data.flipperRadius - f4(endRadius * f4(7.9));
				}
				if (v.x === FlipperItem.vertsBaseTop[t].x && v.y === FlipperItem.vertsBaseTop[t].y && v.z === FlipperItem.vertsBaseTop[t].z) {
					v.x *= f4(baseRadius * baseScale);
					v.y *= f4(baseRadius * baseScale);
				}
				if (v.x === FlipperItem.vertsTipTop[t].x && v.y === FlipperItem.vertsTipTop[t].y && v.z === FlipperItem.vertsTipTop[t].z) {
					v.x *= f4(endRadius * tipScale);
					v.y *= f4(endRadius * tipScale);
					v.y += this.data.flipperRadius - f4(endRadius * f4(7.9));
				}
			}
		}
		baseMesh.transform(fullMatrix, undefined,
			(z: number) => f4(f4(z * this.data.height) * table.getScaleZ()) + height);

		// rubber
		if (this.data.rubberThickness > 0.0) {
			const rubberBaseScale = f4(10.0);
			const rubberTipScale = f4(10.0);
			const rubberMesh = flipperBaseMesh.clone(`flipper.rubber-${this.getName()}`);
			for (let t = 0; t < 13; t++) {
				for (const v of rubberMesh.vertices) {
					if (v.x === FlipperItem.vertsBaseBottom[t].x && v.y === FlipperItem.vertsBaseBottom[t].y && v.z === FlipperItem.vertsBaseBottom[t].z) {
						v.x = f4(v.x * this.data.baseRadius) * rubberBaseScale;
						v.y = f4(v.y * this.data.baseRadius) * rubberBaseScale;
					}
					if (v.x === FlipperItem.vertsTipBottom[t].x && v.y === FlipperItem.vertsTipBottom[t].y && v.z === FlipperItem.vertsTipBottom[t].z) {
						v.x = f4(v.x * this.data.endRadius) * rubberTipScale;
						v.y = f4(v.y * this.data.endRadius) * rubberTipScale;
						v.y = f4(v.y + this.data.flipperRadius) - f4(this.data.endRadius * f4(7.9));
					}
					if (v.x === FlipperItem.vertsBaseTop[t].x && v.y === FlipperItem.vertsBaseTop[t].y && v.z === FlipperItem.vertsBaseTop[t].z) {
						v.x = f4(v.x * this.data.baseRadius) * rubberBaseScale;
						v.y = f4(v.y * this.data.baseRadius) * rubberBaseScale;
					}
					if (v.x === FlipperItem.vertsTipTop[t].x && v.y === FlipperItem.vertsTipTop[t].y && v.z === FlipperItem.vertsTipTop[t].z) {
						v.x = f4(v.x * this.data.endRadius) * rubberTipScale;
						v.y = f4(v.y * this.data.endRadius) * rubberTipScale;
						v.y = f4(v.y + this.data.flipperRadius) - f4(this.data.endRadius * f4(7.9));
					}
				}
			}
			rubberMesh.transform(fullMatrix, undefined,
				(z: number) => f4(f4(z * this.data.rubberWidth) * table.getScaleZ()) + f4(height + this.data.rubberHeight));
			return { base: baseMesh, rubber: rubberMesh };
		}
		return { base: baseMesh };
	}

	private static vertsTipBottom = [
		new Vertex3D(-0.101425, 0.786319, 0.003753),
		new Vertex3D(-0.097969, 0.812569, 0.003753),
		new Vertex3D(-0.087837, 0.837031, 0.003753),
		new Vertex3D(-0.071718, 0.858037, 0.003753),
		new Vertex3D(-0.050713, 0.874155, 0.003753),
		new Vertex3D(-0.026251, 0.884288, 0.003753),
		new Vertex3D(-0.000000, 0.887744, 0.003753),
		new Vertex3D(0.026251, 0.884288, 0.003753),
		new Vertex3D(0.050713, 0.874155, 0.003753),
		new Vertex3D(0.071718, 0.858037, 0.003753),
		new Vertex3D(0.087837, 0.837031, 0.003753),
		new Vertex3D(0.097969, 0.812569, 0.003753),
		new Vertex3D(0.101425, 0.786319, 0.003753),
	];

	private static vertsTipTop = [
		new Vertex3D(-0.101425, 0.786319, 1.004253),
		new Vertex3D(-0.097969, 0.812569, 1.004253),
		new Vertex3D(-0.087837, 0.837031, 1.004253),
		new Vertex3D(-0.071718, 0.858037, 1.004253),
		new Vertex3D(-0.050713, 0.874155, 1.004253),
		new Vertex3D(-0.026251, 0.884288, 1.004253),
		new Vertex3D(-0.000000, 0.887744, 1.004253),
		new Vertex3D(0.026251, 0.884288, 1.004253),
		new Vertex3D(0.050713, 0.874155, 1.004253),
		new Vertex3D(0.071718, 0.858037, 1.004253),
		new Vertex3D(0.087837, 0.837031, 1.004253),
		new Vertex3D(0.097969, 0.812569, 1.004253),
		new Vertex3D(0.101425, 0.786319, 1.004253),
	];

	private static vertsBaseBottom = [
		new Vertex3D(-0.100762, -0.000000, 0.003753),
		new Vertex3D(-0.097329, -0.026079, 0.003753),
		new Vertex3D(-0.087263, -0.050381, 0.003753),
		new Vertex3D(-0.071250, -0.071250, 0.003753),
		new Vertex3D(-0.050381, -0.087263, 0.003753),
		new Vertex3D(-0.026079, -0.097329, 0.003753),
		new Vertex3D(-0.000000, -0.100762, 0.003753),
		new Vertex3D(0.026079, -0.097329, 0.003753),
		new Vertex3D(0.050381, -0.087263, 0.003753),
		new Vertex3D(0.071250, -0.071250, 0.003753),
		new Vertex3D(0.087263, -0.050381, 0.003753),
		new Vertex3D(0.097329, -0.026079, 0.003753),
		new Vertex3D(0.100762, -0.000000, 0.003753),
	];

	private static vertsBaseTop = [
		new Vertex3D(-0.100762, 0.000000, 1.004253),
		new Vertex3D(-0.097329, -0.026079, 1.004253),
		new Vertex3D(-0.087263, -0.050381, 1.004253),
		new Vertex3D(-0.071250, -0.071250, 1.004253),
		new Vertex3D(-0.050381, -0.087263, 1.004253),
		new Vertex3D(-0.026079, -0.097329, 1.004253),
		new Vertex3D(-0.000000, -0.100762, 1.004253),
		new Vertex3D(0.026079, -0.097329, 1.004253),
		new Vertex3D(0.050381, -0.087263, 1.004253),
		new Vertex3D(0.071250, -0.071250, 1.004253),
		new Vertex3D(0.087263, -0.050381, 1.004253),
		new Vertex3D(0.097329, -0.026079, 1.004253),
		new Vertex3D(0.100762, -0.000000, 1.004253),
	];
}
