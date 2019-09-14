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

import { EventProxy } from '../../game/event-proxy';
import { Player } from '../../game/player';
import { Item } from '../item';
import { ItemApi } from '../item-api';
import { ItemData } from '../item-data';
import { Table } from '../table/table';
import { CollectionData } from './collection-data';

export class CollectionApi extends ItemApi<CollectionData> implements IterableIterator<Item<ItemData>> {

	private readonly items: Array<Item<ItemData>>;
	private pointer = 0;

	constructor(data: CollectionData, items: Array<Item<ItemData>>, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.items = items;
	}

	public next(): IteratorResult<Item<ItemData>> {
		if (this.pointer < this.items.length) {
			return {
				done: false,
				value: this.items[this.pointer++],
			};
		} else {
			return {
				done: true,
				value: null,
			};
		}
	}

	public [Symbol.iterator](): IterableIterator<Item<ItemData>> {
		return this;
	}
}
