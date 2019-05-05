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

import { spinnerBracketMesh } from '../../res/meshes/spinner-bracket-mesh';
import { spinnerPlateMesh } from '../../res/meshes/spinner-plate-mesh';
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
 * VPinball's spinners.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/spinner.cpp
 */
export class SpinnerItem extends GameItem implements IRenderable {

	private vCenter!: Vertex2D;
	private rotation!: number;
	private szMaterial?: string;
	private fTimerEnabled: boolean = false;
	private TimerInterval?: number;
	private fShowBracket: boolean = false;
	private height!: number;
	private length!: number;
	private damping?: number;
	private angleMax?: number;
	private angleMin?: number;
	private elasticity?: number;
	private fVisible: boolean = false;
	private szImage?: string;
	private szSurface?: string;
	private wzName!: string;

	public static async fromStorage(storage: Storage, itemName: string): Promise<SpinnerItem> {
		const spinnerItem = new SpinnerItem();
		await storage.streamFiltered(itemName, 4, BiffParser.stream(spinnerItem.fromTag.bind(spinnerItem), {}));
		return spinnerItem;
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return this.fVisible;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};

		const height = table.getSurfaceHeight(this.szSurface, this.vCenter.x, this.vCenter.y) * table.getScaleZ();
		const posZ = f4(height + this.height);

		meshes.plate = {
			mesh: this.getPlateMesh(table, posZ).transform(new Matrix3D().toRightHanded()),
			map: table.getTexture(this.szImage),
			material: table.getMaterial(this.szMaterial),
		};
		if (this.fShowBracket) {
			meshes.bracket = {
				mesh: this.getBracketMesh(table, posZ).transform(new Matrix3D().toRightHanded()),
				map: table.getTexture(this.szImage),
				material: table.getMaterial(this.szMaterial),
			};
		}
		return meshes;
	}

	private getPlateMesh(table: Table, posZ: number): Mesh {
		const fullMatrix = new Matrix3D();
		fullMatrix.rotateZMatrix(degToRad(this.rotation));
		const mesh = spinnerPlateMesh.clone(`spinner.plate-${this.getName()}`);

		for (const vertex of mesh.vertices) {
			let vert = new Vertex3D(vertex.x, vertex.y, vertex.z);
			vert = fullMatrix.multiplyVector(vert);
			vertex.x = f4(vert.x * this.length) + this.vCenter.x;
			vertex.y = f4(vert.y * this.length) + this.vCenter.y;
			vertex.z = f4(f4(vert.z * this.length) * table.getScaleZ()) + posZ;

			let norm = new Vertex3D(vertex.nx, vertex.ny, vertex.nz);
			norm = fullMatrix.multiplyVectorNoTranslate(norm);
			vertex.nx = vert.x;
			vertex.ny = vert.y;
			vertex.nz = vert.z;
		}
		return mesh;
	}

	private getBracketMesh(table: Table, posZ: number): Mesh {
		const fullMatrix = new Matrix3D();
		fullMatrix.rotateZMatrix(degToRad(this.rotation));
		const bracketMesh = spinnerBracketMesh.clone(`spinner.bracket-${this.getName()}`);
		for (const vertex of bracketMesh.vertices) {
			let vert = new Vertex3D(vertex.x, vertex.y, vertex.z);
			vert = fullMatrix.multiplyVector(vert);
			vertex.x = f4(vert.x * this.length) + this.vCenter.x;
			vertex.y = f4(vert.y * this.length) + this.vCenter.y;
			vertex.z = f4(f4(vert.z * this.length) * table.getScaleZ()) + posZ;

			let norm = new Vertex3D(vertex.nx, vertex.ny, vertex.nz);
			norm = fullMatrix.multiplyVectorNoTranslate(vert);
			vertex.nx = norm.x;
			vertex.ny = norm.y;
			vertex.nz = norm.z;
		}
		return bracketMesh;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'ROTA': this.rotation = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'SSUP': this.fShowBracket = this.getBool(buffer); break;
			case 'HIGH': this.height = this.getFloat(buffer); break;
			case 'LGTH': this.length = this.getFloat(buffer); break;
			case 'AFRC': this.damping = this.getFloat(buffer); break;
			case 'SMAX': this.angleMax = this.getFloat(buffer); break;
			case 'SMIN': this.angleMin = this.getFloat(buffer); break;
			case 'SELA': this.elasticity = this.getFloat(buffer); break;
			case 'SVIS': this.fVisible = this.getBool(buffer); break;
			case 'IMGF': this.szImage = this.getString(buffer, len); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
