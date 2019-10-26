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
import { Enums, TextAlignment } from '../enums';
import { ItemData } from '../item-data';

export class TextboxData extends ItemData {

	public v1!: Vertex2D;
	public v2!: Vertex2D;
	public backColor: number = 0x000000;
	public fontColor: number = 0xffffff;
	public intensityScale: number = 1.0;
	public text: string = '0';
	public align: number = Enums.TextAlignment.TextAlignRight;
	public isTransparent: boolean = false;
	public isDMD: boolean = false;

	// non-persisted
	public isVisible: boolean = true;

	public static async fromStorage(storage: Storage, itemName: string): Promise<TextboxData> {
		const textBoxData = new TextboxData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(textBoxData.fromTag.bind(textBoxData), {
			streamedTags: [ 'FONT' ],
		}));
		return textBoxData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VER1': this.v1 = Vertex2D.get(buffer); break;
			case 'VER2': this.v2 = Vertex2D.get(buffer); break;
			case 'CLRB': this.backColor = BiffParser.bgrToRgb(this.getInt(buffer)); break;
			case 'CLRF': this.fontColor = BiffParser.bgrToRgb(this.getInt(buffer)); break;
			case 'INSC': this.intensityScale = this.getFloat(buffer); break;
			case 'TEXT': this.text = this.getString(buffer, len); break;
			case 'ALGN': this.align = this.getInt(buffer); break;
			case 'TRNS': this.isTransparent = this.getBool(buffer); break;
			case 'IDMD': this.isDMD = this.getBool(buffer); break;
			case 'FONT': break; // ignore for now, see BiffParser#L62, it's currently treated as end of storage
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
