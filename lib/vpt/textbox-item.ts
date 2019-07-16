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
import { ItemData } from './item-data';

/**
 * VPinball's timers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/timer.cpp
 */
export class TextBoxItem extends ItemData {

	public v1!: Vertex2D;
	public v2!: Vertex2D;
	public backColor!: number;
	public fontColor!: number;
	public intensityScale!: number;
	public text?: string;
	public align?: number;
	public isTransparent: boolean = false;
	public isDMD: boolean = false;
	private wzName!: string;

	public static async fromStorage(storage: Storage, itemName: string): Promise<TextBoxItem> {
		const textBoxItem = new TextBoxItem(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(textBoxItem.fromTag.bind(textBoxItem), {
			streamedTags: [ 'FONT' ],
		}));
		return textBoxItem;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return false;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VER1': this.v1 = Vertex2D.get(buffer); break;
			case 'VER2': this.v2 = Vertex2D.get(buffer); break;
			case 'CLRB': this.backColor = BiffParser.bgrToRgb(this.getInt(buffer)); break;
			case 'CLRF': this.fontColor = BiffParser.bgrToRgb(this.getInt(buffer)); break;
			case 'INSC': this.intensityScale = this.getFloat(buffer); break;
			case 'TEXT': this.text = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'ALGN': this.align = this.getInt(buffer); break;
			case 'TRNS': this.isTransparent = this.getBool(buffer); break;
			case 'IDMD': this.isDMD = this.getBool(buffer); break;
			case 'FONT': break; // ignore for now, see BiffParser#L62, it's currently treated as end of storage
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
