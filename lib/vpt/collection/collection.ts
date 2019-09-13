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

import { Storage } from '../../io/ole-doc';
import { Item } from '../item';
import { ItemData } from '../item-data';
import { CollectionData } from './collection-data';

export class Collection {

	public readonly data: CollectionData;
	public readonly items: Array<Item<ItemData>> = [];

	// public props
	get fireEvents() { return this.data.fireEvents; }
	get stopSingleEvents() { return this.data.stopSingleEvents; }

	public static async fromStorage(storage: Storage, itemName: string): Promise<Collection> {
		const data = await CollectionData.fromStorage(storage, itemName);
		return new Collection(data);
	}

	public getName(): string {
		return this.data.getName();
	}

	private constructor(data: CollectionData) {
		this.data = data;
	}

	public getItemNames() {
		return this.data.itemNames;
	}

	public addItem(item: Item<ItemData>) {
		this.items.push(item);
	}
}
