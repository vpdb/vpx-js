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
import { DispReelData } from './dispreel-data';
import { IScriptable } from '../../game/iscriptable';
import { DispReelApi } from './dispreel-api';
import { Player } from '../../game/player';
import { Table } from '../table/table';
import { EventProxy } from '../../game/event-proxy';

export class DispReel extends Item<DispReelData> implements IScriptable<DispReelApi> {

	private api?: DispReelApi;

	public static async fromStorage(storage: Storage, itemName: string): Promise<DispReel> {
		const data = await DispReelData.fromStorage(storage, itemName);
		return new DispReel(data);
	}

	private constructor(data: DispReelData) {
		super(data);
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.api = new DispReelApi(this.data, this.events, player, table);
	}

	public getApi(): DispReelApi {
		return this.api!;
	}

	public getEventNames(): string[] {
		return [ 'Init', 'Timer' ];
	}
}
