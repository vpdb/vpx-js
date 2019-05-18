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

import { bumperBaseMesh } from '../../res/meshes/bumper-base-mesh';
import { bumperCapMesh } from '../../res/meshes/bumper-cap-mesh';
import { bumperRingMesh } from '../../res/meshes/bumper-ring-mesh';
import { bumperSocketMesh } from '../../res/meshes/bumper-socket-mesh';
import { BiffParser } from '../io/biff-parser';
import { Storage } from '../io/ole-doc';
import { degToRad, f4 } from '../math/float';
import { Matrix3D } from '../math/matrix3d';
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { GameItem, IRenderable, Meshes } from './game-item';
import { Mesh } from './mesh';
import { Table } from './table';
import { Texture } from './texture';

/**
 * VPinball's bumper item.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/bumper.cpp
 */
export class BumperItem extends GameItem implements IRenderable {

	public vCenter!: Vertex2D;
	public radius: number = 1.0;
	public szCapMaterial?: string;
	public szRingMaterial?: string;
	public szBaseMaterial?: string;
	public szSkirtMaterial?: string;
	public TimerInterval?: number;
	public fTimerEnabled: boolean = false;
	public threshold: number = 1.0;
	public force?: number;
	public scatter?: number;
	public heightScale: number = 1.0;
	public ringSpeed: number = 0.5;
	public orientation: number = 0.0;
	public ringDropOffset: number = 0.0;
	public szSurface?: string;
	public wzName!: string;
	public fCapVisible: boolean = true;
	public fBaseVisible: boolean = true;
	public fRingVisible: boolean = true;
	public fSkirtVisible: boolean = true;
	public fHitEvent: boolean = true;
	public fCollidable: boolean = true;
	public fReflectionEnabled: boolean = true;

	public static async fromStorage(storage: Storage, itemName: string): Promise<BumperItem> {
		const bumperItem = new BumperItem(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(bumperItem.fromTag.bind(bumperItem)));
		return bumperItem;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return this.fBaseVisible || this.fRingVisible || this.fSkirtVisible || this.fCapVisible;
	}

	public getMeshes(table: Table): Meshes {
		/* istanbul ignore if */
		if (!this.vCenter) {
			throw new Error(`Cannot export bumper ${this.getName()} without vCenter.`);
		}
		const meshes: Meshes = {};
		const matrix = new Matrix3D();
		matrix.rotateZMatrix(degToRad(this.orientation));
		const height = table.getSurfaceHeight(this.szSurface, this.vCenter.x, this.vCenter.y) * table.getScaleZ();
		if (this.fBaseVisible) {
			meshes.base = {
				mesh: this.generateMesh(`bumper-base-${this.getName()}`, bumperBaseMesh, matrix, z => f4(f4(z * this.heightScale) * table.getScaleZ()) + height).transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.szBaseMaterial),
				map: Texture.fromFilesystem('bumperbase.bmp'),
			};
		}
		if (this.fRingVisible) {
			meshes.ring = {
				mesh: this.generateMesh(`bumper-ring-${this.getName()}`, bumperRingMesh, matrix, z => f4(z * f4(this.heightScale * table.getScaleZ())) + height).transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.szRingMaterial),
				map: Texture.fromFilesystem('bumperring.bmp'),
			};
		}
		if (this.fSkirtVisible) {
			meshes.skirt = {
				mesh: this.generateMesh(`bumper-socket-${this.getName()}`, bumperSocketMesh, matrix, z => f4(z * f4(this.heightScale * table.getScaleZ())) + (height + 5.0)).transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.szSkirtMaterial),
				map: Texture.fromFilesystem('bumperskirt.bmp'),
			};
		}
		if (this.fCapVisible) {
			meshes.cap = {
				mesh: this.generateMesh(`bumper-cap-${this.getName()}`, bumperCapMesh, matrix, z => f4(f4(f4(z * this.heightScale) + this.heightScale) * table.getScaleZ()) + height).transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.szCapMaterial),
				map: Texture.fromFilesystem('bumperCap.bmp'),
			};
		}
		return meshes;
	}

	private generateMesh(name: string, mesh: Mesh, matrix: Matrix3D, zPos: (z: number) => number): Mesh {
		const scalexy = this.radius;
		const generatedMesh = mesh.clone(name);
		for (const vertex of generatedMesh.vertices) {
			let vert = new Vertex3D(vertex.x, vertex.y, vertex.z);
			vert = matrix.multiplyVector(vert);
			vertex.x = f4(vert.x * scalexy) + this.vCenter.x;
			vertex.y = f4(vert.y * scalexy) + this.vCenter.y;
			vertex.z = zPos(vert.z);

			let normal = new Vertex3D(vertex.nx, vertex.ny, vertex.nz);
			normal = matrix.multiplyVectorNoTranslate(normal);
			vertex.nx = normal.x;
			vertex.ny = normal.y;
			vertex.nz = normal.z;
		}
		return generatedMesh;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'RADI': this.radius = this.getFloat(buffer); break;
			case 'MATR': this.szCapMaterial = this.getString(buffer, len); break;
			case 'RIMA': this.szRingMaterial = this.getString(buffer, len); break;
			case 'BAMA': this.szBaseMaterial = this.getString(buffer, len); break;
			case 'SKMA': this.szSkirtMaterial = this.getString(buffer, len); break;
			case 'THRS': this.threshold = this.getFloat(buffer); break;
			case 'FORC': this.force = this.getFloat(buffer); break;
			case 'BSCT': this.scatter = this.getFloat(buffer); break;
			case 'HISC': this.heightScale = this.getFloat(buffer); break;
			case 'RISP': this.ringSpeed = this.getFloat(buffer); break;
			case 'ORIN': this.orientation = this.getFloat(buffer); break;
			case 'RDLI': this.ringDropOffset = this.getFloat(buffer); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			/* istanbul ignore next: legacy */
			case 'BVIS':
				const isVisible = this.getBool(buffer);
				this.fCapVisible = isVisible;
				this.fBaseVisible = isVisible;
				this.fRingVisible = isVisible;
				this.fSkirtVisible = isVisible;
				break;
			case 'CAVI': this.fCapVisible = this.getBool(buffer); break;
			case 'HAHE': this.fHitEvent = this.getBool(buffer); break;
			case 'COLI': this.fCollidable = this.getBool(buffer); break;
			case 'BSVS':
				this.fBaseVisible = this.getBool(buffer);
				this.fRingVisible = this.fBaseVisible;
				this.fSkirtVisible = this.fBaseVisible;
				break;
			case 'RIVS': this.fRingVisible = this.getBool(buffer); break;
			case 'SKVS': this.fSkirtVisible = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
