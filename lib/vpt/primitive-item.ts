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

import { BiffParser } from '../io/biff-parser';
import { Storage } from '../io/ole-doc';
import { degToRad } from '../math/float';
import { Matrix3D } from '../math/matrix3d';
import { Vertex3DNoTex2 } from '../math/vertex';
import { Vertex3D } from '../math/vertex3d';
import { FrameData } from './animation';
import { IRenderable, ItemData, Meshes } from './item-data';
import { FLT_MAX, Mesh } from './mesh';
import { Table } from './table';

/**
 * VPinball's primitive.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/primitive.cpp
 */
export class PrimitiveItem extends ItemData implements IRenderable {

	private data: PrimitiveData = new PrimitiveData();
	private mesh: Mesh = new Mesh();

	public numVertices!: number;
	public compressedAnimationVertices?: number;
	public compressedVertices?: number;
	private wzName!: string;
	private numIndices!: number;
	public compressedIndices?: number;

	public static async fromStorage(storage: Storage, itemName: string): Promise<PrimitiveItem> {
		const primitiveItem = new PrimitiveItem(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser
			.stream((buffer, tag, offset, len) => primitiveItem.fromTag(buffer, tag, offset, len, storage, itemName)));
		return primitiveItem;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName() {
		return this.wzName;
	}
	public isVisible(): boolean {
		return this.data.fVisible;
	}

	public getMeshes(vpTable: Table): Meshes {
		const mesh = this.data.use3DMesh
			? this.mesh.clone(`primitive-${this.getName()}`)
			: this.calculateBuiltinOriginal();

		const matrix = this.getMatrix(vpTable);
		return {
			primitive: {
				mesh: mesh.transform(matrix.toRightHanded()),
				map: vpTable.getTexture(this.data.szImage),
				normalMap: vpTable.getTexture(this.data.szNormalMap),
				material: vpTable.getMaterial(this.data.szMaterial),
			},
		};
	}

	private calculateBuiltinOriginal(): Mesh {

		const mesh = new Mesh(`primitive-${this.getName()}`);

		// this recalculates the Original Vertices -> should be only called, when sides are altered.
		const outerRadius = -0.5 / (Math.cos(Math.PI / this.data.Sides));
		const addAngle = 2.0 * Math.PI / this.data.Sides;
		const offsAngle = Math.PI / this.data.Sides;
		let minX = FLT_MAX;
		let minY = FLT_MAX;
		let maxX = -FLT_MAX;
		let maxY = -FLT_MAX;

		mesh.vertices = [];

		let middle = new Vertex3DNoTex2();
		mesh.vertices.push(middle);
		middle.x = 0.0;
		middle.y = 0.0;
		middle.z = 0.5;

		middle = new Vertex3DNoTex2();
		mesh.vertices[this.data.Sides + 1] = middle;
		middle.x = 0.0;
		middle.y = 0.0;
		middle.z = -0.5;
		for (let i = 0; i < this.data.Sides; ++i) {

			// calculate Top
			const topVert = new Vertex3DNoTex2(); // top point at side
			mesh.vertices[i + 1] = topVert;

			const currentAngle = addAngle * i + offsAngle;
			topVert.x = Math.sin(currentAngle) * outerRadius;
			topVert.y = Math.cos(currentAngle) * outerRadius;
			topVert.z = 0.5;

			// calculate bottom
			const bottomVert = new Vertex3DNoTex2(); // bottompoint at side
			mesh.vertices[i + 1 + this.data.Sides + 1] = bottomVert;
			bottomVert.x = topVert.x;
			bottomVert.y = topVert.y;
			bottomVert.z = -0.5;

			// calculate sides
			mesh.vertices[this.data.Sides * 2 + 2 + i] = topVert.clone(); // sideTopVert
			mesh.vertices[this.data.Sides * 3 + 2 + i] = bottomVert.clone(); // sideBottomVert

			// calculate bounds for X and Y
			if (topVert.x < minX) {
				minX = topVert.x;
			}
			if (topVert.x > maxX) {
				maxX = topVert.x;
			}
			if (topVert.y < minY) {
				minY = topVert.y;
			}
			if (topVert.y > maxY) {
				maxY = topVert.y;
			}
		}

		// these have to be replaced for image mapping
		middle = mesh.vertices[0]; // middle point top
		middle.tu = 0.25;   // /4
		middle.tv = 0.25;   // /4
		middle = mesh.vertices[this.data.Sides + 1]; // middle point bottom
		middle.tu = 0.25 * 3.0; // /4*3
		middle.tv = 0.25;   // /4
		const invx = 0.5 / (maxX - minX);
		const invy = 0.5 / (maxY - minY);
		const invs = 1.0 / this.data.Sides;

		for (let i = 0; i < this.data.Sides; i++) {
			const topVert = mesh.vertices[i + 1]; // top point at side
			topVert.tu = (topVert.x - minX) * invx;
			topVert.tv = (topVert.y - minY) * invy;

			const bottomVert = mesh.vertices[i + 1 + this.data.Sides + 1]; // bottompoint at side
			bottomVert.tu = topVert.tu + 0.5;
			bottomVert.tv = topVert.tv;

			const sideTopVert = mesh.vertices[this.data.Sides * 2 + 2 + i];
			const sideBottomVert = mesh.vertices[this.data.Sides * 3 + 2 + i];

			sideTopVert.tu = i * invs;
			sideTopVert.tv = 0.5;
			sideBottomVert.tu = sideTopVert.tu;
			sideBottomVert.tv = 1.0;
		}

		// So how many indices are needed?
		// 3 per Triangle top - we have m_sides triangles -> 0, 1, 2, 0, 2, 3, 0, 3, 4, ...
		// 3 per Triangle bottom - we have m_sides triangles
		// 6 per Side at the side (two triangles form a rectangle) - we have m_sides sides
		// == 12 * m_sides
		// * 2 for both cullings (m_DrawTexturesInside == true)
		// == 24 * m_sides
		// this will also be the initial sorting, when depths, Vertices and Indices are recreated, because calculateRealTimeOriginal is called.

		// 2 restore indices
		//   check if anti culling is enabled:
		if (this.data.DrawTexturesInside) {
			mesh.indices = [];
			// yes: draw everything twice
			// restore indices
			for (let i = 0; i < this.data.Sides; i++) {

				const tmp = (i === this.data.Sides - 1) ? 1 : (i + 2); // wrapping around
				// top
				mesh.indices[i * 6] = 0;
				mesh.indices[i * 6 + 1] = i + 1;
				mesh.indices[i * 6 + 2] = tmp;
				mesh.indices[i * 6 + 3] = 0;
				mesh.indices[i * 6 + 4] = tmp;
				mesh.indices[i * 6 + 5] = i + 1;

				const tmp2 = tmp + 1;
				// bottom
				mesh.indices[6 * (i + this.data.Sides)] = this.data.Sides + 1;
				mesh.indices[6 * (i + this.data.Sides) + 1] = this.data.Sides + tmp2;
				mesh.indices[6 * (i + this.data.Sides) + 2] = this.data.Sides + 2 + i;
				mesh.indices[6 * (i + this.data.Sides) + 3] = this.data.Sides + 1;
				mesh.indices[6 * (i + this.data.Sides) + 4] = this.data.Sides + 2 + i;
				mesh.indices[6 * (i + this.data.Sides) + 5] = this.data.Sides + tmp2;

				// sides
				mesh.indices[12 * (i + this.data.Sides)] = this.data.Sides * 2 + tmp2;
				mesh.indices[12 * (i + this.data.Sides) + 1] = this.data.Sides * 2 + 2 + i;
				mesh.indices[12 * (i + this.data.Sides) + 2] = this.data.Sides * 3 + 2 + i;
				mesh.indices[12 * (i + this.data.Sides) + 3] = this.data.Sides * 2 + tmp2;
				mesh.indices[12 * (i + this.data.Sides) + 4] = this.data.Sides * 3 + 2 + i;
				mesh.indices[12 * (i + this.data.Sides) + 5] = this.data.Sides * 3 + tmp2;
				mesh.indices[12 * (i + this.data.Sides) + 6] = this.data.Sides * 2 + tmp2;
				mesh.indices[12 * (i + this.data.Sides) + 7] = this.data.Sides * 3 + 2 + i;
				mesh.indices[12 * (i + this.data.Sides) + 8] = this.data.Sides * 2 + 2 + i;
				mesh.indices[12 * (i + this.data.Sides) + 9] = this.data.Sides * 2 + tmp2;
				mesh.indices[12 * (i + this.data.Sides) + 10] = this.data.Sides * 3 + tmp2;
				mesh.indices[12 * (i + this.data.Sides) + 11] = this.data.Sides * 3 + 2 + i;
			}

		} else {
			// no: only out-facing polygons
			// restore indices
			mesh.indices = [];
			for (let i = 0; i < this.data.Sides; i++) {

				const tmp = (i === this.data.Sides - 1) ? 1 : (i + 2); // wrapping around
				// top
				mesh.indices[i * 3] = 0;
				mesh.indices[i * 3 + 2] = i + 1;
				mesh.indices[i * 3 + 1] = tmp;

				//SetNormal(mesh.vertices[0], &mesh.indices[i+3], 3); // see below

				const tmp2 = tmp + 1;
				// bottom
				mesh.indices[3 * (i + this.data.Sides)] = this.data.Sides + 1;
				mesh.indices[3 * (i + this.data.Sides) + 1] = this.data.Sides + 2 + i;
				mesh.indices[3 * (i + this.data.Sides) + 2] = this.data.Sides + tmp2;

				//SetNormal(mesh.vertices[0], &mesh.indices[3*(i+this.data.Sides)], 3); // see below

				// sides
				mesh.indices[6 * (i + this.data.Sides)] = this.data.Sides * 2 + tmp2;
				mesh.indices[6 * (i + this.data.Sides) + 1] = this.data.Sides * 3 + 2 + i;
				mesh.indices[6 * (i + this.data.Sides) + 2] = this.data.Sides * 2 + 2 + i;
				mesh.indices[6 * (i + this.data.Sides) + 3] = this.data.Sides * 2 + tmp2;
				mesh.indices[6 * (i + this.data.Sides) + 4] = this.data.Sides * 3 + tmp2;
				mesh.indices[6 * (i + this.data.Sides) + 5] = this.data.Sides * 3 + 2 + i;
			}
		}

		//SetNormal(mesh.vertices[0], &mesh.indices[0], m_mesh.NumIndices()); // SetNormal only works for plane polygons
		Mesh.computeNormals(mesh.vertices, mesh.vertices.length, mesh.indices, mesh.indices.length);

		return mesh;
	}

	private getMatrix(table: Table): Matrix3D {

		// scale matrix
		const scaleMatrix = new Matrix3D();
		scaleMatrix.setScaling(this.data.vSize.x, this.data.vSize.y, this.data.vSize.z);

		// translation matrix
		const transMatrix = new Matrix3D();
		transMatrix.setTranslation(this.data.vPosition.x, this.data.vPosition.y, this.data.vPosition.z);

		// translation + rotation matrix
		const rotTransMatrix = new Matrix3D();
		rotTransMatrix.setTranslation(this.data.aRotAndTra[3], this.data.aRotAndTra[4], this.data.aRotAndTra[5]);

		const tempMatrix = new Matrix3D();
		tempMatrix.rotateZMatrix(degToRad(this.data.aRotAndTra[2]));
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateYMatrix(degToRad(this.data.aRotAndTra[1]));
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateXMatrix(degToRad(this.data.aRotAndTra[0]));
		rotTransMatrix.multiply(tempMatrix);

		tempMatrix.rotateZMatrix(degToRad(this.data.aRotAndTra[8]));
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateYMatrix(degToRad(this.data.aRotAndTra[7]));
		rotTransMatrix.multiply(tempMatrix);
		tempMatrix.rotateXMatrix(degToRad(this.data.aRotAndTra[6]));
		rotTransMatrix.multiply(tempMatrix);

		const fullMatrix = scaleMatrix.clone();
		fullMatrix.multiply(rotTransMatrix);
		fullMatrix.multiply(transMatrix);        // fullMatrix = Smatrix * RTmatrix * Tmatrix
		scaleMatrix.setScaling(1.0, 1.0, table.getScaleZ());
		fullMatrix.multiply(scaleMatrix);

		return fullMatrix;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number, storage: Storage, itemName: string): Promise<number> {
		switch (tag) {
			case 'VPOS': this.data.vPosition = Vertex3D.get(buffer); break;
			case 'VSIZ': this.data.vSize = Vertex3D.get(buffer); break;
			case 'RTV0': this.data.aRotAndTra[0] = this.getFloat(buffer); break;
			case 'RTV1': this.data.aRotAndTra[1] = this.getFloat(buffer); break;
			case 'RTV2': this.data.aRotAndTra[2] = this.getFloat(buffer); break;
			case 'RTV3': this.data.aRotAndTra[3] = this.getFloat(buffer); break;
			case 'RTV4': this.data.aRotAndTra[4] = this.getFloat(buffer); break;
			case 'RTV5': this.data.aRotAndTra[5] = this.getFloat(buffer); break;
			case 'RTV6': this.data.aRotAndTra[6] = this.getFloat(buffer); break;
			case 'RTV7': this.data.aRotAndTra[7] = this.getFloat(buffer); break;
			case 'RTV8': this.data.aRotAndTra[8] = this.getFloat(buffer); break;
			case 'IMAG': this.data.szImage = this.getString(buffer, len); break;
			case 'NRMA': this.data.szNormalMap = this.getString(buffer, len); break;
			case 'SIDS': this.data.Sides = this.getInt(buffer); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'MATR': this.data.szMaterial = this.getString(buffer, len); break;
			case 'SCOL': this.data.SideColor = this.getInt(buffer); break;
			case 'TVIS': this.data.fVisible = this.getBool(buffer); break;
			case 'REEN': this.data.fReflectionEnabled = this.getBool(buffer); break;
			case 'DTXI': this.data.DrawTexturesInside = this.getBool(buffer); break;
			case 'HTEV': this.data.fHitEvent = this.getBool(buffer); break;
			case 'THRS': this.data.threshold = this.getFloat(buffer); break;
			case 'ELAS': this.data.elasticity = this.getFloat(buffer); break;
			case 'ELFO': this.data.elasticityFalloff = this.getFloat(buffer); break;
			case 'RFCT': this.data.friction = this.getFloat(buffer); break;
			case 'RSCT': this.data.scatter = this.getFloat(buffer); break;
			case 'EFUI': this.data.edgeFactorUI = this.getFloat(buffer); break;
			case 'CORF': this.data.collisionReductionFactor = this.getFloat(buffer); break;
			case 'CLDR': this.data.fCollidable = this.getBool(buffer); break; // originally "CLDRP"
			case 'ISTO': this.data.fToy = this.getBool(buffer); break;
			case 'MAPH': this.data.szPhysicsMaterial = this.getString(buffer, len); break;
			case 'OVPH': this.data.fOverwritePhysics = this.getBool(buffer); break;
			case 'STRE': this.data.staticRendering = this.getBool(buffer); break;
			case 'DILI': this.data.fDisableLightingTop = this.getFloat(buffer); break; // m_d.m_fDisableLightingTop = (tmp == 1) ? 1.f : dequantizeUnsigned<8>(tmp); // backwards compatible hacky loading!
			case 'DILB': this.data.fDisableLightingBelow = this.getFloat(buffer); break;
			case 'U3DM': this.data.use3DMesh = this.getBool(buffer); break;
			case 'EBFC': this.data.fBackfacesEnabled = this.getBool(buffer); break;
			case 'DIPT': this.data.fDisplayTexture = this.getBool(buffer); break;
			case 'M3DN': this.data.meshFileName = this.getWideString(buffer, len); break;
			case 'M3VN':
				this.numVertices = this.getInt(buffer);
				this.mesh.animationFrames = [];
				break;
			case 'M3DX': this.mesh.vertices = this.getVertices(buffer, this.numVertices); break;
			case 'M3AY': this.compressedAnimationVertices = this.getInt(buffer); break;
			case 'M3AX': this.mesh.animationFrames.push(await this.getAnimatedVertices(await BiffParser.decompress(await this.getData(storage, itemName, offset, len)), this.numVertices)); break;
			case 'M3CY': this.compressedVertices = this.getInt(buffer); break;
			case 'M3CX': this.mesh.vertices = this.getVertices(await BiffParser.decompress(await this.getData(storage, itemName, offset, len)), this.numVertices); break;
			case 'M3FN': this.numIndices = this.getInt(buffer); break;
			case 'M3DI':
				if (this.numVertices > 65535) {
					this.mesh.indices = this.getUnsignedInt4s(buffer, this.numIndices);
				} else {
					this.mesh.indices = this.getUnsignedInt2s(buffer, this.numIndices);
				}
				break;
			case 'M3CJ': this.compressedIndices = this.getInt(buffer); break;
			case 'M3CI':
				if (this.numVertices > 65535) {
					this.mesh.indices = this.getUnsignedInt4s(await BiffParser.decompress(await this.getData(storage, itemName, offset, len)), this.numIndices);
				} else {
					this.mesh.indices = this.getUnsignedInt2s(await BiffParser.decompress(await this.getData(storage, itemName, offset, len)), this.numIndices);
				}
				break;
			case 'PIDB': this.data.depthBias = this.getFloat(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}

	private getVertices(decompressedBuffer: Buffer, num: number): Vertex3DNoTex2[] {
		const vertices: Vertex3DNoTex2[] = [];
		if (decompressedBuffer.length < num * Vertex3DNoTex2.size) {
			throw new Error(`Tried to read ${num} vertices for primitive item "${this.getName()}" (${this.itemName}), but only ${decompressedBuffer.length} bytes available.`);
		}
		for (let i = 0; i < num; i++) {
			vertices.push(Vertex3DNoTex2.get(decompressedBuffer, i));
		}
		return vertices;
	}

	private async getAnimatedVertices(buffer: Buffer, num: number): Promise<FrameData> {
		return FrameData.get(buffer, num);
	}

}

class PrimitiveData {

	public vPosition!: Vertex3D;
	public vSize: Vertex3D = new Vertex3D(100, 100, 100);
	public aRotAndTra: number[] = [ 0, 0, 0, 0, 0, 0, 0, 0, 0];
	public szImage?: string;
	public szNormalMap?: string;
	public Sides!: number;
	public szMaterial?: string;
	public SideColor: number = 0x969696;
	public fVisible: boolean = false;
	public fReflectionEnabled: boolean = true;
	public DrawTexturesInside: boolean = false;
	public fHitEvent: boolean = false;
	public threshold?: number;
	public elasticity?: number;
	public elasticityFalloff?: number;
	public friction?: number;
	public scatter?: number;
	public edgeFactorUI: number = 0.25;
	public collisionReductionFactor?: number;
	public fCollidable: boolean = true;
	public fToy: boolean = false;
	public szPhysicsMaterial?: string;
	public fOverwritePhysics: boolean = false;
	public staticRendering: boolean = true;
	public fDisableLightingTop?: number;
	public fDisableLightingBelow?: number;
	public use3DMesh: boolean = false;
	public fBackfacesEnabled: boolean = false;
	public fDisplayTexture: boolean = false;
	public meshFileName?: string;
	public depthBias?: number;

}
