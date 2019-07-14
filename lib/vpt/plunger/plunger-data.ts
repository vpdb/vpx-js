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
import { Vertex2D } from '../../math/vertex2d';
import { GameItem } from '../game-item';
import { PlungerType } from './plunger';

export class PlungerData extends GameItem {

	public type: PlungerType = PlungerType.Modern;
	public center!: Vertex2D;
	public width: number = 25;
	public height: number = 20;
	public zAdjust: number = this.height * 4;
	public color: number = 0x4c4c4c;
	public stroke?: number;
	public speedPull: number = 0.5;
	public speedFire: number = 80;
	public mechStrength: number = 85;
	public parkPosition: number = 0.5 / 3.0;
	public scatterVelocity: number = 0;
	public momentumXfer: number = 1;
	public mechPlunger: boolean = false;
	public autoPlunger: boolean = false;
	public wzName!: string;
	public animFrames?: number;
	public szMaterial?: string;
	public szImage?: string;
	public fVisible: boolean = true;
	public fReflectionEnabled: boolean = true;
	public szSurface?: string;
	public szTipShape: string = '0 .34; 2 .6; 3 .64; 5 .7; 7 .84; 8 .88; 9 .9; 11 .92; 14 .92; 39 .84';
	public rodDiam: number = 0.6;
	public ringGap: number = 2.0;
	public ringDiam: number = 0.94;
	public ringWidth: number = 3.0;
	public springDiam: number = 0.77;
	public springGauge: number = 1.38;
	public springLoops: number = 8.0;
	public springEndLoops: number = 2.5;

	public static async fromStorage(storage: Storage, itemName: string): Promise<PlungerData> {
		const plungerItem = new PlungerData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(plungerItem.fromTag.bind(plungerItem), {}));
		return plungerItem;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return this.fVisible;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.center = Vertex2D.get(buffer); break;
			case 'WDTH': this.width = this.getFloat(buffer); break;
			case 'ZADJ': this.zAdjust = this.getFloat(buffer); break;
			case 'HIGH': this.height = this.getFloat(buffer); break;
			case 'HPSL': this.stroke = this.getFloat(buffer); break;
			case 'SPDP': this.speedPull = this.getFloat(buffer); break;
			case 'SPDF': this.speedFire = this.getFloat(buffer); break;
			case 'MEST': this.mechStrength = this.getFloat(buffer); break;
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
			case 'RNGD': this.ringDiam = this.getFloat(buffer); break;
			case 'RNGW': this.ringWidth = this.getFloat(buffer); break;
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
