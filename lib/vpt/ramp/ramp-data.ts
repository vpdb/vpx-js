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

import { BiffParser } from '../../io/biff-parser';
import { Storage } from '../../io/ole-doc';
import { DragPoint } from '../../math/dragpoint';
import { f4 } from '../../math/float';
import { Enums } from '../enums';
import { IPhysicalData, ItemData } from '../item-data';

export class RampData extends ItemData implements IPhysicalData {

	public depthBias: number = 0;
	public dragPoints: DragPoint[] = [];
	public elasticity!: number;
	public friction!: number;
	public hitEvent: boolean = false;
	public heightBottom: number = 0;
	public heightTop: number = f4(50);
	public imageAlignment: number = Enums.RampImageAlignment.ImageModeWorld;
	public imageWalls: boolean = true;
	public isCollidable: boolean = true;
	public isReflectionEnabled: boolean = true;
	public isVisible: boolean = true;
	public leftWallHeight: number = f4(62);
	public leftWallHeightVisible: number = f4(30);
	public overwritePhysics: boolean = true;
	public rampType: number = Enums.RampType.RampTypeFlat;
	public rightWallHeight: number = f4(62);
	public rightWallHeightVisible: number = f4(30);
	public scatter!: number;
	public szImage?: string;
	public szMaterial?: string;
	public szPhysicsMaterial?: string;
	public threshold?: number;
	public widthBottom: number = f4(75);
	public widthTop: number = f4(60);
	public wireDiameter: number = f4(8);
	public wireDistanceX: number = f4(38);
	public wireDistanceY: number = f4(88);

	public static async fromStorage(storage: Storage, itemName: string): Promise<RampData> {
		const rampData = new RampData(itemName);
		await storage.streamFiltered(itemName, 4, RampData.createStreamHandler(rampData));
		if (rampData.widthTop === 0 && rampData.widthBottom > 0) {
			rampData.widthTop = 0.1;
		}
		if (rampData.widthBottom === 0 && rampData.widthTop > 0) {
			rampData.widthBottom = 0.1;
		}
		return rampData;
	}

	private static createStreamHandler(rampData: RampData) {
		rampData.dragPoints = [];
		return BiffParser.stream(rampData.fromTag.bind(rampData), {
			nestedTags: {
				DPNT: {
					onStart: () => new DragPoint(),
					onTag: dragPoint => dragPoint.fromTag.bind(dragPoint),
					onEnd: dragPoint => rampData.dragPoints.push(dragPoint),
				},
			},
		});
	}

	public constructor(itemName: string) {
		super(itemName);
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'HTBT': this.heightBottom = this.getFloat(buffer); break;
			case 'HTTP': this.heightTop = this.getFloat(buffer); break;
			case 'WDBT': this.widthBottom = this.getFloat(buffer); break;
			case 'WDTP': this.widthTop = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'TYPE': this.rampType = this.getInt(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'ALGN': this.imageAlignment = this.getInt(buffer); break;
			case 'IMGW': this.imageWalls = this.getBool(buffer); break;
			case 'WLHL': this.leftWallHeight = this.getFloat(buffer); break;
			case 'WLHR': this.rightWallHeight = this.getFloat(buffer); break;
			case 'WVHL': this.leftWallHeightVisible = this.getFloat(buffer); break;
			case 'WVHR': this.rightWallHeightVisible = this.getFloat(buffer); break;
			case 'HTEV': this.hitEvent = this.getBool(buffer); break;
			case 'THRS': this.threshold = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'RFCT': this.friction = this.getFloat(buffer); break;
			case 'RSCT': this.scatter = this.getFloat(buffer); break;
			case 'CLDR': this.isCollidable = this.getBool(buffer); break;
			case 'RVIS': this.isVisible = this.getBool(buffer); break;
			case 'REEN': this.isReflectionEnabled = this.getBool(buffer); break;
			case 'RADB': this.depthBias = this.getFloat(buffer); break;
			case 'RADI': this.wireDiameter = this.getFloat(buffer); break;
			case 'RADX': this.wireDistanceX = this.getFloat(buffer); break;
			case 'RADY': this.wireDistanceY = this.getFloat(buffer); break;
			case 'MAPH': this.szPhysicsMaterial = this.getString(buffer, len); break;
			case 'OVPH': this.overwritePhysics = this.getBool(buffer); break;
			case 'PNTS': break;
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
