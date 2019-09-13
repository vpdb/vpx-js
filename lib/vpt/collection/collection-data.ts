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
import { ItemData } from '../item-data';

export class CollectionData extends ItemData {

	public itemNames: string[] = [];
	public fireEvents: boolean = false;
	public groupEvents: boolean = true;
	public stopSingleEvents: boolean = false;

	public static async fromStorage(storage: Storage, itemName: string): Promise<CollectionData> {
		const collectionData = new CollectionData(itemName);
		await storage.streamFiltered(itemName, 0, BiffParser.stream(collectionData.fromTag.bind(collectionData), {}));
		return collectionData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'EVNT': this.fireEvents = this.getBool(buffer); break;
			case 'SSNG': this.stopSingleEvents = this.getBool(buffer); break;
			case 'GREL': this.groupEvents = this.getBool(buffer); break;
			case 'ITEM': this.itemNames.push(this.getWideString(buffer, len)); break;
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
