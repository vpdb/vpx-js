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

	public fHitEvent: boolean = false;
	public fDroppable: boolean = false;
	public fFlipbook: boolean = false;
	public fIsBottomSolid: boolean = false;
	public fCollidable: boolean = true;
	public fTimerEnabled: boolean = false;
	public TimerInterval?: number;
	public threshold?: number;
	public szImage?: string;
	public szSideImage?: string;
	public szSideMaterial?: string;
	public szTopMaterial?: string;
	public szPhysicsMaterial?: string;
	public szSlingShotMaterial?: string;
	public heightbottom: number = 0;
	public heighttop: number = 50;
	public fInner: boolean = false;
	public wzName!: string;
	public fDisplayTexture: boolean = false;
	public slingshotforce: number = 80;
	public slingshotThreshold: number = 0;
	public elasticity?: number;
	public friction?: number;
	public scatter?: number;
	public fTopBottomVisible: boolean = true;
	public fOverwritePhysics: boolean = false;
	public fSlingshotAnimation: boolean = true;
	public fDisableLightingTop?: number;
	public fDisableLightingBelow?: number;
	public fSideVisible: boolean = true;
	public fReflectionEnabled: boolean = true;
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
			case 'HTEV': this.fHitEvent = this.getBool(buffer); break;
			case 'DROP': this.fDroppable = this.getBool(buffer); break;
			case 'FLIP': this.fFlipbook = this.getBool(buffer); break;
			case 'ISBS': this.fIsBottomSolid = this.getBool(buffer); break;
			case 'CLDW': this.fCollidable = this.getBool(buffer); break;
			case 'THRS': this.threshold = this.getFloat(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'SIMG': this.szSideImage = this.getString(buffer, len); break;
			case 'SIMA': this.szSideMaterial = this.getString(buffer, len, true); break;
			case 'TOMA': this.szTopMaterial = this.getString(buffer, len, true); break;
			case 'MAPH': this.szPhysicsMaterial = this.getString(buffer, len); break;
			case 'SLMA': this.szSlingShotMaterial = this.getString(buffer, len, true); break;
			case 'HTBT': this.heightbottom = this.getFloat(buffer); break;
			case 'HTTP': this.heighttop = this.getFloat(buffer); break;
			case 'INNR': this.fInner = this.getBool(buffer); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'DSPT': this.fDisplayTexture = this.getBool(buffer); break;
			case 'SLGF': this.slingshotforce = this.getFloat(buffer); break;
			case 'SLTH': this.slingshotThreshold = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'WFCT': this.friction = this.getFloat(buffer); break;
			case 'WSCT': this.scatter = this.getFloat(buffer); break;
			case 'VSBL': this.fTopBottomVisible = this.getBool(buffer); break;
			case 'OVPH': this.fOverwritePhysics = this.getBool(buffer); break;
			case 'SLGA': this.fSlingshotAnimation = this.getBool(buffer); break;
			case 'DILI': this.fDisableLightingTop = this.getFloat(buffer); break;
			case 'DILB': this.fDisableLightingBelow = this.getFloat(buffer); break;
			case 'SVBL': this.fSideVisible = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'PNTS': break; // never read in vpinball
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
