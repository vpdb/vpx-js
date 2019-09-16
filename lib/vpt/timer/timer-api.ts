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
import { ItemApi } from '../item-api';
import { Table } from '../table/table';
import { TimerData } from './timer-data';

export class TimerApi extends ItemApi<TimerData> {

	constructor(data: TimerData, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
	}

	get X() { return this.data.vCenter.x; }
	set X(v) { this.data.vCenter.x = v; }
	get Y() { return this.data.vCenter.y; }
	set Y(v) { this.data.vCenter.y = v; }
	get Interval() { return this.data.timer.interval; }
	set Interval(v) { this._setTimerInterval(v); }
	get Enabled() { return this.data.timer.enabled; }
	set Enabled(v) { this._setTimerEnabled(v); }
}
