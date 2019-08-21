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
import { BiffParser } from '../../io/biff-parser';
import { DragPoint } from '../../math/dragpoint';
import { ItemData } from '../item-data';

export class SurfaceData extends ItemData {

	public hitEvent: boolean = false;
	public isDroppable: boolean = false;
	public isFlipbook: boolean = false;
	public isBottomSolid: boolean = false;
	public isCollidable: boolean = true;
	public threshold: number = 2.0;
	public szImage?: string;
	public szSideImage?: string;
	public szSideMaterial?: string;
	public szTopMaterial?: string;
	public szPhysicsMaterial?: string;
	public szSlingShotMaterial?: string;
	public heightBottom: number = 0;
	public heightTop: number = 50;
	/** @deprecated */
	public inner: boolean = true;
	public wzName!: string;
	public displayTexture: boolean = false;
	public slingshotForce: number = 80;
	public slingshotThreshold: number = 0;
	public slingshotAnimation: boolean = true;
	public elasticity!: number;
	public friction!: number;
	public scatter!: number;
	public isTopBottomVisible: boolean = true;
	public overwritePhysics: boolean = true;
	public disableLightingTop?: number;
	public disableLightingBelow?: number;
	public isSideVisible: boolean = true;
	public isReflectionEnabled: boolean = true;
	public dragPoints: DragPoint[] = [];

	public static async fromStorage(storage: Storage, itemName: string): Promise<SurfaceData> {
		const surfaceData = new SurfaceData(itemName);
		await storage.streamFiltered(itemName, 4, SurfaceData.createStreamHandler(surfaceData));
		return surfaceData;
	}

	private static createStreamHandler(surfaceItem: SurfaceData) {
		surfaceItem.dragPoints = [];
		return BiffParser.stream(surfaceItem.fromTag.bind(surfaceItem), {
			nestedTags: {
				DPNT: {
					onStart: () => new DragPoint(),
					onTag: dragPoint => dragPoint.fromTag.bind(dragPoint),
					onEnd: dragPoint => surfaceItem.dragPoints.push(dragPoint),
				},
			},
		});
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'HTEV': this.hitEvent = this.getBool(buffer); break;
			case 'DROP': this.isDroppable = this.getBool(buffer); break;
			case 'FLIP': this.isFlipbook = this.getBool(buffer); break;
			case 'ISBS': this.isBottomSolid = this.getBool(buffer); break;
			case 'CLDW': this.isCollidable = this.getBool(buffer); break;
			case 'THRS': this.threshold = this.getFloat(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'SIMG': this.szSideImage = this.getString(buffer, len); break;
			case 'SIMA': this.szSideMaterial = this.getString(buffer, len, true); break;
			case 'TOMA': this.szTopMaterial = this.getString(buffer, len, true); break;
			case 'MAPH': this.szPhysicsMaterial = this.getString(buffer, len); break;
			case 'SLMA': this.szSlingShotMaterial = this.getString(buffer, len, true); break;
			case 'HTBT': this.heightBottom = this.getFloat(buffer); break;
			case 'HTTP': this.heightTop = this.getFloat(buffer); break;
			case 'INNR': this.inner = this.getBool(buffer); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'DSPT': this.displayTexture = this.getBool(buffer); break;
			case 'SLGF': this.slingshotForce = this.getFloat(buffer); break;
			case 'SLTH': this.slingshotThreshold = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'WFCT': this.friction = this.getFloat(buffer); break;
			case 'WSCT': this.scatter = this.getFloat(buffer); break;
			case 'VSBL': this.isTopBottomVisible = this.getBool(buffer); break;
			case 'OVPH': this.overwritePhysics = this.getBool(buffer); break;
			case 'SLGA': this.slingshotAnimation = this.getBool(buffer); break;
			case 'DILI': this.disableLightingTop = this.getFloat(buffer); break;
			case 'DILB': this.disableLightingBelow = this.getFloat(buffer); break;
			case 'SVBL': this.isSideVisible = this.getBool(buffer); break;
			case 'REEN': this.isReflectionEnabled = this.getBool(buffer); break;
			case 'PNTS': break; // never read in vpinball
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
