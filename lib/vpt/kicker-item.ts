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

import { kickerCupMesh } from '../../res/meshes/kicker-cup-mesh';
import { kickerGottliebMesh } from '../../res/meshes/kicker-gottlieb-mesh';
import { kickerHoleMesh } from '../../res/meshes/kicker-hole-mesh';
import { kickerSimpleHoleMesh } from '../../res/meshes/kicker-simple-hole-mesh';
import { kickerT1Mesh } from '../../res/meshes/kicker-t1-mesh';
import { kickerWilliamsMesh } from '../../res/meshes/kicker-williams-mesh';
import { BiffParser } from '../io/biff-parser';
import { Storage } from '../io/ole-doc';
import { degToRad, f4 } from '../math/float';
import { Matrix3D } from '../math/matrix3d';
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { IRenderable, ItemData, Meshes } from './item-data';
import { Mesh } from './mesh';
import { Table } from './table';
import { Texture } from './texture';

/**
 * VPinball's kickers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/kicker.cpp
 */
export class KickerItem extends ItemData implements IRenderable {

	public static TypeKickerInvisible = 0;
	public static TypeKickerHole = 1;
	public static TypeKickerCup = 2;
	public static TypeKickerHoleSimple = 3;
	public static TypeKickerWilliams = 4;
	public static TypeKickerGottlieb = 5;
	public static TypeKickerCup2 = 6;

	private kickerType: number = KickerItem.TypeKickerHole;
	private vCenter!: Vertex2D;
	private radius: number = 25;
	private scatter?: number;
	private hitAccuracy: number = 0.7;
	private hitHeight: number = 40;
	private orientation: number = 0;
	private szMaterial?: string;
	private fTimerEnabled: boolean = false;
	private fEnabled: boolean = true;
	private TimerInterval?: number;
	private szSurface?: string;
	private wzName!: string;
	private fFallThrough: boolean = false;
	private legacyMode: boolean = false;

	public static async fromStorage(storage: Storage, itemName: string): Promise<KickerItem> {
		const kickerItem = new KickerItem(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(kickerItem.fromTag.bind(kickerItem), {}));
		return kickerItem;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return this.kickerType !== KickerItem.TypeKickerInvisible;
	}

	public getMeshes(table: Table): Meshes {
		const baseHeight = table.getSurfaceHeight(this.szSurface, this.vCenter.x, this.vCenter.y) * table.getScaleZ();
		const kickerMesh = this.generateMesh(table, baseHeight);
		return {
			kicker: {
				mesh: kickerMesh.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.szMaterial),
				map: this.getTexture(),
			},
		};
	}

	private generateMesh(table: Table, baseHeight: number): Mesh {
		let zOffset = 0.0;
		let zRot = this.orientation;
		switch (this.kickerType) {
			case KickerItem.TypeKickerCup:
				zOffset = f4(-0.18);
				break;
			case KickerItem.TypeKickerWilliams:
				zRot = f4(this.orientation + 90.0);
				break;
			case KickerItem.TypeKickerHole:
				zRot = 0.0;
				break;
			case KickerItem.TypeKickerHoleSimple:
			default:
				zRot = 0.0;
				break;
		}
		const fullMatrix = new Matrix3D();
		fullMatrix.rotateZMatrix(degToRad(zRot));

		const mesh = this.getBaseMesh();
		for (const vertex of mesh.vertices) {
			let vert = new Vertex3D(vertex.x, vertex.y, vertex.z + zOffset);
			vert = fullMatrix.multiplyVector(vert);

			vertex.x = f4(vert.x * this.radius) + this.vCenter.x;
			vertex.y = f4(vert.y * this.radius) + this.vCenter.y;
			vertex.z = f4(f4(vert.z * this.radius) * table.getScaleZ()) + baseHeight;

			vert = new Vertex3D(vertex.nx, vertex.ny, vertex.nz);
			vert = fullMatrix.multiplyVectorNoTranslate(vert);
			vertex.nx = vert.x;
			vertex.ny = vert.y;
			vertex.nz = vert.z;
		}
		return mesh;
	}

	private getBaseMesh(): Mesh {
		const name = `kicker-${this.getName()}`;
		switch (this.kickerType) {
			case KickerItem.TypeKickerCup: return kickerCupMesh.clone(name);
			case KickerItem.TypeKickerWilliams: return kickerWilliamsMesh.clone(name);
			case KickerItem.TypeKickerGottlieb: return kickerGottliebMesh.clone(name);
			case KickerItem.TypeKickerCup2: return kickerT1Mesh.clone(name);
			case KickerItem.TypeKickerHole: return kickerHoleMesh.clone(name);
			case KickerItem.TypeKickerHoleSimple:
			default:
				return kickerSimpleHoleMesh.clone(name);
		}
	}

	private getTexture(): Texture {
		switch (this.kickerType) {
			case KickerItem.TypeKickerCup: return Texture.fromFilesystem('kickerCup.bmp');
			case KickerItem.TypeKickerWilliams: return Texture.fromFilesystem('kickerWilliams.bmp');
			case KickerItem.TypeKickerGottlieb: return Texture.fromFilesystem('kickerGottlieb.bmp');
			case KickerItem.TypeKickerCup2: return Texture.fromFilesystem('kickerT1.bmp');
			case KickerItem.TypeKickerHole: return Texture.fromFilesystem('kickerHoleWood.bmp');
			case KickerItem.TypeKickerHoleSimple:
			default:
				return Texture.fromFilesystem('kickerHoleWood.bmp');
		}
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'RADI': this.radius = this.getFloat(buffer); break;
			case 'KSCT': this.scatter = this.getFloat(buffer); break;
			case 'KHAC': this.hitAccuracy = this.getFloat(buffer); break;
			case 'KHHI': this.hitHeight = this.getFloat(buffer); break;
			case 'KORI': this.orientation = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'EBLD': this.fEnabled = this.getBool(buffer); break;
			case 'TYPE':
				this.kickerType = this.getInt(buffer);
				/* istanbul ignore if: legacy handling */
				if (this.kickerType > KickerItem.TypeKickerCup2) {
					this.kickerType = KickerItem.TypeKickerInvisible;
				}
				break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'FATH': this.fFallThrough = this.getBool(buffer); break;
			case 'LEMO': this.legacyMode = this.getBool(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
