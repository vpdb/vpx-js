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
import { ItemData } from '../item-data';

export class LightSeqData extends ItemData {

	private v!: Vertex2D;
	private collection?: string;
	private center: Vertex2D = new Vertex2D();
	private updateInterval: number = 25;
	private backglass: boolean = false;

	public static async fromStorage(storage: Storage, itemName: string): Promise<LightSeqData> {
		const lightSeqData = new LightSeqData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(lightSeqData.fromTag.bind(lightSeqData), {
			streamedTags: [ 'FONT' ],
		}));
		return lightSeqData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.v = Vertex2D.get(buffer); break;
			case 'COLC': this.collection = this.getWideString(buffer, len); break;
			case 'CTRX': this.center.x = this.getFloat(buffer); break;
			case 'CTRY': this.center.y = this.getFloat(buffer); break;
			case 'UPTM': this.updateInterval = this.getInt(buffer); break;
			case 'BGLS': this.backglass = this.getBool(buffer); break;
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
