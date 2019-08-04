/*
 * VPDB - Virtual Pinball Database
 * Copyright (C) 2019 freezy <freezy@vpdb.io>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General private License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General private License for more details.
 *
 * You should have received a copy of the GNU General private License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { Storage } from '../..';
import { BiffParser } from '../../io/biff-parser';
import { Vertex3DNoTex2 } from '../../math/vertex';
import { Vertex3D } from '../../math/vertex3d';
import { FrameData } from '../animation';
import { ItemData } from '../item-data';
import { Mesh } from '../mesh';

export class PrimitiveData extends ItemData {

	public numVertices!: number;
	public compressedAnimationVertices?: number;
	public compressedVertices?: number;
	private wzName!: string;
	private numIndices!: number;
	public compressedIndices?: number;
	public mesh: Mesh = new Mesh();

	public vPosition!: Vertex3D;
	public vSize: Vertex3D = new Vertex3D(100, 100, 100);
	public aRotAndTra: number[] = [ 0, 0, 0, 0, 0, 0, 0, 0, 0];
	public szImage?: string;
	public szNormalMap?: string;
	public Sides!: number;
	public szMaterial?: string;
	private SideColor: number = 0x969696;
	public fVisible: boolean = false;
	private fReflectionEnabled: boolean = true;
	public DrawTexturesInside: boolean = false;
	public fHitEvent: boolean = false;
	public threshold!: number;
	public elasticity!: number;
	public elasticityFalloff!: number;
	public friction!: number;
	public scatter!: number;
	private edgeFactorUI: number = 0.25;
	public collisionReductionFactor!: number;
	public fCollidable: boolean = true;
	public isToy: boolean = false;
	public szPhysicsMaterial?: string;
	public fOverwritePhysics: boolean = false;
	private staticRendering: boolean = true;
	private fDisableLightingTop?: number;
	private fDisableLightingBelow?: number;
	public use3DMesh: boolean = false;
	public useAsPlayfield: boolean = false;
	private fBackfacesEnabled: boolean = false;
	private fDisplayTexture: boolean = false;
	private meshFileName?: string;
	private depthBias?: number;

	public static async fromStorage(storage: Storage, itemName: string): Promise<PrimitiveData> {
		const primitiveItem = new PrimitiveData(itemName);
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

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number, storage: Storage, itemName: string): Promise<number> {
		switch (tag) {
			case 'VPOS': this.vPosition = Vertex3D.get(buffer); break;
			case 'VSIZ': this.vSize = Vertex3D.get(buffer); break;
			case 'RTV0': this.aRotAndTra[0] = this.getFloat(buffer); break;
			case 'RTV1': this.aRotAndTra[1] = this.getFloat(buffer); break;
			case 'RTV2': this.aRotAndTra[2] = this.getFloat(buffer); break;
			case 'RTV3': this.aRotAndTra[3] = this.getFloat(buffer); break;
			case 'RTV4': this.aRotAndTra[4] = this.getFloat(buffer); break;
			case 'RTV5': this.aRotAndTra[5] = this.getFloat(buffer); break;
			case 'RTV6': this.aRotAndTra[6] = this.getFloat(buffer); break;
			case 'RTV7': this.aRotAndTra[7] = this.getFloat(buffer); break;
			case 'RTV8': this.aRotAndTra[8] = this.getFloat(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'NRMA': this.szNormalMap = this.getString(buffer, len); break;
			case 'SIDS': this.Sides = this.getInt(buffer); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'SCOL': this.SideColor = this.getInt(buffer); break;
			case 'TVIS': this.fVisible = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'DTXI': this.DrawTexturesInside = this.getBool(buffer); break;
			case 'HTEV': this.fHitEvent = this.getBool(buffer); break;
			case 'THRS': this.threshold = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'ELFO': this.elasticityFalloff = this.getFloat(buffer); break;
			case 'RFCT': this.friction = this.getFloat(buffer); break;
			case 'RSCT': this.scatter = this.getFloat(buffer); break;
			case 'EFUI': this.edgeFactorUI = this.getFloat(buffer); break;
			case 'CORF': this.collisionReductionFactor = this.getFloat(buffer); break;
			case 'CLDR': this.fCollidable = this.getBool(buffer); break; // originally "CLDRP"
			case 'ISTO': this.isToy = this.getBool(buffer); break;
			case 'MAPH': this.szPhysicsMaterial = this.getString(buffer, len); break;
			case 'OVPH': this.fOverwritePhysics = this.getBool(buffer); break;
			case 'STRE': this.staticRendering = this.getBool(buffer); break;
			case 'DILI': this.fDisableLightingTop = this.getFloat(buffer); break; // m_d.m_fDisableLightingTop = (tmp == 1) ? 1.f : dequantizeUnsigned<8>(tmp); // backwards compatible hacky loading!
			case 'DILB': this.fDisableLightingBelow = this.getFloat(buffer); break;
			case 'U3DM': this.use3DMesh = this.getBool(buffer); break;
			case 'EBFC': this.fBackfacesEnabled = this.getBool(buffer); break;
			case 'DIPT': this.fDisplayTexture = this.getBool(buffer); break;
			case 'M3DN': this.meshFileName = this.getWideString(buffer, len); break;
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
			case 'PIDB': this.depthBias = this.getFloat(buffer); break;
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
