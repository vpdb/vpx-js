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

import { flipperBaseMesh } from '../../res/meshes/flipper-base-mesh';
import { BiffParser } from '../io/biff-parser';
import { Storage } from '../io/ole-doc';
import { degToRad, f4 } from '../math/float';
import { Matrix3D } from '../math/matrix3d';
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { GameItem, IRenderable, Meshes } from './game-item';
import { Mesh } from './mesh';
import { Table } from './table';

/**
 * VPinball's flippers
 *
 * @see https://github.com/vpinball/vpinball/blob/master/flipper.cpp
 */
export class FlipperItem extends GameItem implements IRenderable {

	public wzName!: string;
	public center!: Vertex2D;
	public baseRadius: number = 21.5;
	public endRadius: number = 13.0;
	public flipperRadiusMax: number = 130.0;
	public flipperRadius: number = 130.0;
	public return?: number;
	public startAngle: number = 121.0;
	public endAngle: number = 70.0;
	public overridePhysics?: number;
	public mass?: number;
	public isTimerEnabled?: boolean;
	public timerInterval?: number;
	public szSurface?: string;
	public szMaterial?: string;
	public szRubberMaterial?: string;
	public rubberThickness: number = 7.0;
	public rubberHeight: number = 19.0;
	public rubberWidth: number = 24.0;
	public height: number = 50.0;
	public strength?: number;
	public elasticity?: number;
	public elasticityFalloff?: number;
	public friction?: number;
	public rampUp?: number;
	public scatter?: number;
	public torqueDamping?: number;
	public torqueDampingAngle?: number;
	public flipperRadiusMin?: number;
	public fVisible: boolean = true;
	public fEnabled: boolean = true;
	public fReflectionEnabled: boolean = true;
	public szImage?: string;

	public static async fromStorage(storage: Storage, itemName: string): Promise<FlipperItem> {
		const flipperItem = new FlipperItem();
		await storage.streamFiltered(itemName, 4, BiffParser.stream(flipperItem.fromTag.bind(flipperItem)));
		return flipperItem;
	}

	private constructor() {
		super();
	}

	public isVisible(): boolean {
		return this.fVisible;
	}

	public getName(): string {
		return this.wzName;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};

		const matrix = this.getMatrix();
		const flipper = this.generateMeshes(table);

		// base mesh
		meshes.base = {
			mesh: flipper.base.transform(matrix.toRightHanded()),
			material: table.getMaterial(this.szMaterial),
			map: table.getTexture(this.szImage),
		};

		// rubber mesh
		if (flipper.rubber) {
			meshes.rubber = {
				mesh: flipper.rubber.transform(matrix.toRightHanded()),
				material: table.getMaterial(this.szRubberMaterial),
			};
		}
		return meshes;
	}

	private getMatrix(): Matrix3D {
		const trafoMatrix = new Matrix3D();
		const tempMatrix = new Matrix3D();
		trafoMatrix.setTranslation(this.center.x, this.center.y, 0);
		tempMatrix.rotateZMatrix(degToRad(this.startAngle));
		trafoMatrix.preMultiply(tempMatrix);
		return trafoMatrix;
	}

	private generateMeshes(table: Table): { base: Mesh, rubber?: Mesh } {

		const fullMatrix = new Matrix3D();
		fullMatrix.rotateZMatrix(degToRad(180.0));

		const height = table.getSurfaceHeight(this.szSurface, this.center.x, this.center.y);
		const baseScale = f4(10.0);
		const tipScale = f4(10.0);
		const baseRadius = f4(this.baseRadius - this.rubberThickness);
		const endRadius = f4(this.endRadius - this.rubberThickness);

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
					v.y += this.flipperRadius - f4(endRadius * f4(7.9));
				}
				if (v.x === FlipperItem.vertsBaseTop[t].x && v.y === FlipperItem.vertsBaseTop[t].y && v.z === FlipperItem.vertsBaseTop[t].z) {
					v.x *= f4(baseRadius * baseScale);
					v.y *= f4(baseRadius * baseScale);
				}
				if (v.x === FlipperItem.vertsTipTop[t].x && v.y === FlipperItem.vertsTipTop[t].y && v.z === FlipperItem.vertsTipTop[t].z) {
					v.x *= f4(endRadius * tipScale);
					v.y *= f4(endRadius * tipScale);
					v.y += this.flipperRadius - f4(endRadius * f4(7.9));
				}
			}
		}
		baseMesh.transform(fullMatrix, undefined,
			(z: number) => f4(f4(z * this.height) * table.getScaleZ()) + height);

		// rubber
		if (this.rubberThickness > 0.0) {
			const rubberBaseScale = f4(10.0);
			const rubberTipScale = f4(10.0);
			const rubberMesh = flipperBaseMesh.clone(`flipper.rubber-${this.getName()}`);
			for (let t = 0; t < 13; t++) {
				for (const v of rubberMesh.vertices) {
					if (v.x === FlipperItem.vertsBaseBottom[t].x && v.y === FlipperItem.vertsBaseBottom[t].y && v.z === FlipperItem.vertsBaseBottom[t].z) {
						v.x = f4(v.x * this.baseRadius) * rubberBaseScale;
						v.y = f4(v.y * this.baseRadius) * rubberBaseScale;
					}
					if (v.x === FlipperItem.vertsTipBottom[t].x && v.y === FlipperItem.vertsTipBottom[t].y && v.z === FlipperItem.vertsTipBottom[t].z) {
						v.x = f4(v.x * this.endRadius) * rubberTipScale;
						v.y = f4(v.y * this.endRadius) * rubberTipScale;
						v.y = f4(v.y + this.flipperRadius) - f4(this.endRadius * f4(7.9));
					}
					if (v.x === FlipperItem.vertsBaseTop[t].x && v.y === FlipperItem.vertsBaseTop[t].y && v.z === FlipperItem.vertsBaseTop[t].z) {
						v.x = f4(v.x * this.baseRadius) * rubberBaseScale;
						v.y = f4(v.y * this.baseRadius) * rubberBaseScale;
					}
					if (v.x === FlipperItem.vertsTipTop[t].x && v.y === FlipperItem.vertsTipTop[t].y && v.z === FlipperItem.vertsTipTop[t].z) {
						v.x = f4(v.x * this.endRadius) * rubberTipScale;
						v.y = f4(v.y * this.endRadius) * rubberTipScale;
						v.y = f4(v.y + this.flipperRadius) - f4(this.endRadius * f4(7.9));
					}
				}
			}
			rubberMesh.transform(fullMatrix, undefined,
				(z: number) => f4(f4(z * this.rubberWidth) * table.getScaleZ()) + f4(height + this.rubberHeight));
			return { base: baseMesh, rubber: rubberMesh };
		}
		return { base: baseMesh };
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.center = Vertex2D.get(buffer); break;
			case 'BASR': this.baseRadius = this.getFloat(buffer); break;
			case 'ENDR': this.endRadius = this.getFloat(buffer); break;
			case 'FLPR':
				this.flipperRadiusMax = this.getFloat(buffer);
				this.flipperRadius = this.flipperRadiusMax;
				break;
			case 'FRTN': this.return = this.getFloat(buffer); break;
			case 'ANGS': this.startAngle = this.getFloat(buffer); break;
			case 'ANGE': this.endAngle = this.getFloat(buffer); break;
			case 'OVRP': this.overridePhysics = this.getInt(buffer); break;
			case 'FORC': this.mass = this.getFloat(buffer); break;
			case 'TMON': this.isTimerEnabled = this.getBool(buffer); break;
			case 'TMIN': this.timerInterval = this.getInt(buffer); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'RUMA': this.szRubberMaterial = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'RTHK': this.rubberThickness = this.getInt(buffer); break;
			case 'RTHF': this.rubberThickness = this.getFloat(buffer); break;
			case 'RHGT': this.rubberHeight = this.getInt(buffer); break;
			case 'RHGF': this.rubberHeight = this.getFloat(buffer); break;
			case 'RWDT': this.rubberWidth = this.getInt(buffer); break;
			case 'RWDF': this.rubberWidth = this.getFloat(buffer); break;
			case 'FHGT': this.height = this.getFloat(buffer); break;
			case 'STRG': this.strength = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'ELFO': this.elasticityFalloff = this.getFloat(buffer); break;
			case 'FRIC': this.friction = this.getFloat(buffer); break;
			case 'RPUP': this.rampUp = this.getFloat(buffer); break;
			case 'SCTR': this.scatter = this.getFloat(buffer); break;
			case 'TODA': this.torqueDamping = this.getFloat(buffer); break;
			case 'TDAA': this.torqueDampingAngle = this.getFloat(buffer); break;
			case 'FRMN': this.flipperRadiusMin = this.getFloat(buffer); break;
			case 'VSBL': this.fVisible = this.getBool(buffer); break;
			case 'ENBL': this.fEnabled = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
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
