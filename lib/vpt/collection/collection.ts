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
import { IPlayable } from '../../game/iplayable';
import { IScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { Item } from '../item';
import { ItemApi } from '../item-api';
import { ItemData } from '../item-data';
import { Table } from '../table/table';
import { CollectionApi } from './collection-api';
import { CollectionData } from './collection-data';

export class Collection extends Item<CollectionData> implements IPlayable, IScriptable<CollectionApi> {

	public readonly items: Array<ItemApi<ItemData>> = []; // m_visel
	private api?: CollectionApi;

	// public props
	get fireEvents() { return this.data.fireEvents; }
	get stopSingleEvents() { return this.data.stopSingleEvents; }

	public static async fromStorage(storage: Storage, itemName: string): Promise<Collection> {
		const data = await CollectionData.fromStorage(storage, itemName);
		return new Collection(data);
	}

	private constructor(data: CollectionData) {
		super(data);
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.api = CollectionApi.getInstance(this.data, this.items, this.events, player, table);
	}

	public getItemNames() {
		return this.data.itemNames;
	}

	public getEvents(): EventProxy {
		return this.events!;
	}

	public getApi(): CollectionApi {
		return this.api!;
	}

	public getEventNames(): string[] {
		return ['Dropped', 'Hit', 'Init', 'Raised', 'Slingshot', 'Spin', 'Timer', 'Unhit'];
	}
}
