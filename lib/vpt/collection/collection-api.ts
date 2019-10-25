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
import { isScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { Item } from '../item';
import { ItemApi } from '../item-api';
import { ItemData } from '../item-data';
import { Table } from '../table/table';
import { TimerHit } from '../timer/timer-hit';
import { CollectionData } from './collection-data';

export class CollectionApi extends ItemApi<CollectionData> implements IterableIterator<Item<ItemData>> {

	private readonly items: Array<Item<ItemData>>;
	private pointer = 0;

	/**
	 * The goal of the proxy is to mimic an array. Small note, the array
	 * doesn't just contain the collection's items, but their API implementation.
	 * @param data
	 * @param items
	 * @param events
	 * @param player
	 * @param table
	 */
	public static getInstance(data: CollectionData, items: Array<Item<ItemData>>, events: EventProxy, player: Player, table: Table): CollectionApi {
		return new Proxy<CollectionApi>(new CollectionApi(data, items, events, player, table), {
			get: (api, prop) => {
				if (prop === 'length') {
					return api.items[prop];
				}
				try {
					const intProp = parseInt(prop as string, 10);
					if (!isNaN(intProp)) {
						const child = api.items[intProp];
						if (isScriptable(child)) {
							return child.getApi();
						}
						return undefined; // non-scriptable children are not supported
					}
				} catch (err) {
					// do nothing but return prop below.
				}
				return Reflect.get(api, prop);
			},
			set: (api, prop, value) => {
				const intProp = parseInt(prop as string, 10);
				/* istanbul ignore next */
				if (!isNaN(intProp)) {
					throw new Error('Setting a new child of a collection by property is not supported.');
				}
				Reflect.set(api, prop, value);
				return true;
			},
		});
	}

	private constructor(data: CollectionData, items: Array<Item<ItemData>>, events: EventProxy, player: Player, table: Table) {
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

	public _getTimers(): TimerHit[] {
		// collections don't have timers (though they can receive from their children, but that's not what we're doing here)
		return [];
	}

	public [Symbol.iterator](): IterableIterator<Item<ItemData>> {
		return this;
	}

	protected _getPropertyNames(): string[] {
		return Object.getOwnPropertyNames(CollectionApi.prototype);
	}
}
