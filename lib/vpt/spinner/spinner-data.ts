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
import { ItemData } from '../item-data';

export class SpinnerData extends ItemData {

	public vCenter!: Vertex2D;
	public rotation: number = 0;
	public szMaterial?: string;
	public showBracket: boolean = true;
	public height: number = 60;
	public length: number = 80;
	public damping?: number;
	public angleMax: number = 0;
	public angleMin: number = 0;
	public elasticity?: number;
	public isVisible: boolean = true;
	public szImage?: string;
	public szSurface?: string;
	private wzName!: string;

	public static async fromStorage(storage: Storage, itemName: string): Promise<SpinnerData> {
		const spinnerData = new SpinnerData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(spinnerData.fromTag.bind(spinnerData), {}));
		return spinnerData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'ROTA': this.rotation = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'SSUP': this.showBracket = this.getBool(buffer); break;
			case 'HIGH': this.height = this.getFloat(buffer); break;
			case 'LGTH': this.length = this.getFloat(buffer); break;
			case 'AFRC': this.damping = this.getFloat(buffer); break;
			case 'SMAX': this.angleMax = this.getFloat(buffer); break;
			case 'SMIN': this.angleMin = this.getFloat(buffer); break;
			case 'SELA': this.elasticity = this.getFloat(buffer); break;
			case 'SVIS': this.isVisible = this.getBool(buffer); break;
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
