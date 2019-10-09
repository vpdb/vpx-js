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
import { IScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { Item } from '../item';
import { Table } from '../table/table';
import { DecalApi } from './decal-api';
import { DecalData } from './decal-data';

export class Decal extends Item<DecalData> implements IScriptable<DecalApi> {

	private api?: DecalApi;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Decal> {
		const data = await DecalData.fromStorage(storage, itemName);
		return new Decal(data);
	}

	private constructor(data: DecalData) {
		super(data);
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.api = new DecalApi(this.data, this.events, player, table);
	}

	public getApi(): DecalApi {
		return this.api!;
	}

	public getEventNames(): string[] {
		return [];
	}
}
