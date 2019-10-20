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
import { Vertex2D } from '../../math/vertex2d';
import { DecalType, SizingType } from '../enums';
import { ItemData } from '../item-data';

export class DecalData extends ItemData {

	public center!: Vertex2D;
	public width: number = 100.0;
	public height: number = 100.0;
	public rotation: number = 0.0;
	public szImage?: string;
	public szSurface?: string;
	public text?: string;
	public decalType: number = DecalType.DecalImage;
	public sizingType: number = SizingType.ManualSize;
	public color: number = 0x000000;
	public szMaterial?: string;
	public verticalText: boolean = false;
	private backglass: boolean = false;

	public font: string = '';

	public static async fromStorage(storage: Storage, itemName: string): Promise<DecalData> {
		const decalData = new DecalData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(decalData.fromTag.bind(decalData), {
			streamedTags: [ 'FONT' ],
		}));
		return decalData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.center = Vertex2D.get(buffer); break;
			case 'WDTH': this.width = this.getFloat(buffer); break;
			case 'HIGH': this.height = this.getFloat(buffer); break;
			case 'ROTA': this.rotation = this.getFloat(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'TEXT': this.text = this.getString(buffer, len); break;
			case 'TYPE': this.decalType = this.getInt(buffer); break;
			case 'SIZE': this.sizingType = this.getInt(buffer); break;
			case 'COLR': this.color = BiffParser.bgrToRgb(this.getInt(buffer)); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'VERT': this.verticalText = this.getBool(buffer); break;
			case 'BGLS': this.backglass = this.getBool(buffer); break;
			case 'FONT': break; // don't care for now
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
