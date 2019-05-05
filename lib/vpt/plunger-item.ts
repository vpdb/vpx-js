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
import { Vertex2D } from '../math/vertex2d';
import { GameItem } from './game-item';

/**
 * VPinball's plungers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/plunger.cpp
 */
export class PlungerItem extends GameItem {

	public static TypePlungerTypeModern = 1;
	public static TypePlungerTypeFlat = 2;
	public static TypePlungerTypeCustom = 3;

	public vCenter!: Vertex2D;
	public width?: number;
	public height?: number;
	public zAdjust?: number;
	public stroke?: number;
	public speedPull?: number;
	public speedFire?: number;
	public mechStrength?: number;
	public parkPosition?: number;
	public scatterVelocity?: number;
	public momentumXfer?: number;
	public mechPlunger?: boolean;
	public autoPlunger?: boolean;
	public wzName!: string;
	public type?: number;
	public animFrames?: number;
	public szMaterial?: string;
	public szImage?: string;
	public fVisible!: boolean;
	public fReflectionEnabled?: boolean;
	public szSurface?: string;
	public szTipShape?: string;
	public rodDiam?: number;
	public ringGap?: number;
	public ringWidth?: number;
	public springDiam?: number;
	public springGauge?: number;
	public springLoops?: number;
	public springEndLoops?: number;

	public static async fromStorage(storage: Storage, itemName: string): Promise<PlungerItem> {
		const plungerItem = new PlungerItem();
		await storage.streamFiltered(itemName, 4, BiffParser.stream(plungerItem.fromTag.bind(plungerItem), {}));
		return plungerItem;
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return this.fVisible;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'WDTH': this.width = this.getFloat(buffer); break;
			case 'ZADJ': this.zAdjust = this.getFloat(buffer); break;
			case 'HIGH': this.height = this.getFloat(buffer); break;
			case 'HPSL': this.stroke = this.getFloat(buffer); break;
			case 'SPDP': this.speedPull = this.getFloat(buffer); break;
			case 'SPDF': this.speedFire = this.getFloat(buffer); break;
			case 'MESTH': this.mechStrength = this.getFloat(buffer); break;
			case 'MPRK': this.parkPosition = this.getFloat(buffer); break;
			case 'PSCV': this.scatterVelocity = this.getFloat(buffer); break;
			case 'MOMX': this.momentumXfer = this.getFloat(buffer); break;
			case 'MECH': this.mechPlunger = this.getBool(buffer); break;
			case 'APLG': this.autoPlunger = this.getBool(buffer); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'TYPE': this.type = this.getInt(buffer); break;
			case 'ANFR': this.animFrames = this.getInt(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'VSBL': this.fVisible = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'TIPS': this.szTipShape = this.getString(buffer, len); break;
			case 'RODD': this.rodDiam = this.getFloat(buffer); break;
			case 'RNGG': this.ringGap = this.getFloat(buffer); break;
			case 'RNGD': this.ringWidth = this.getFloat(buffer); break;
			case 'SPRD': this.springDiam = this.getFloat(buffer); break;
			case 'SPRG': this.springGauge = this.getFloat(buffer); break;
			case 'SPRL': this.springLoops = this.getFloat(buffer); break;
			case 'SPRE': this.springEndLoops = this.getFloat(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
