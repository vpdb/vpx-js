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
import { Player } from '../../game/player';
import { Storage } from '../../io/ole-doc';
import { Item } from '../item';
import { Table } from '../table/table';
import { TimerData } from './timer-data';
import { TimerHit } from './timer-hit';

/**
 * Amount of msecs to wait (at least) until same timer can be triggered again
 * (e.g. they can fall behind, if set to > 1, as update cycle is 1000Hz)
 */
export const MAX_TIMER_MSEC_INTERVAL = 1;

/**
 * Amount of msecs that all timers combined can take per frame (e.g. they can
 * fall behind, if set to < somelargevalue)
 */
export const MAX_TIMERS_MSEC_OVERALL = 5;

export class Timer extends Item<TimerData> implements IPlayable {

	public static async fromStorage(storage: Storage, itemName: string): Promise<Timer> {
		const data = await TimerData.fromStorage(storage, itemName);
		return new Timer(data);
	}

	private constructor(data: TimerData) {
		super(data);
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
	}

	public getEventNames(): string[] {
		return [];
	}
}

export class TimerOnOff {
	public enabled: boolean;
	public timer: TimerHit;
	constructor(enabled: boolean, timer: TimerHit) {
		this.enabled = enabled;
		this.timer = timer;
	}
}
