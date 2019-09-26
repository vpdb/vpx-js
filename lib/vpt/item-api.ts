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

import { EventEmitter } from 'events';
import { Event } from '../game/event';
import { EventProxy } from '../game/event-proxy';
import { Player } from '../game/player';
import { Collection } from './collection/collection';
import { ItemData } from './item-data';
import { Table } from './table/table';
import { MAX_TIMER_MSEC_INTERVAL } from './timer/timer-const';
import { TimerHit } from './timer/timer-hit';
import { TimerOnOff } from './timer/timer-on-off';

export abstract class ItemApi<DATA extends ItemData> extends EventEmitter {

	protected readonly table: Table;
	protected readonly player: Player;

	protected readonly data: DATA;
	protected readonly events: EventProxy;
	protected readonly collections: Collection[] = [];
	protected readonly collectionsItemPos: number[] = [];

	private hitTimer?: TimerHit;

	get Name() { return this.data.getName(); }
	set Name(v) { this.data.name = v; }
	get TimerInterval() { return this.data.timer.interval; }
	set TimerInterval(v) { this._setTimerInterval(v); }
	get TimerEnabled() { return this.data.timer.enabled; }
	set TimerEnabled(v) { this._setTimerEnabled(v); }
	public UserValue: any;

	protected constructor(data: DATA, events: EventProxy, player: Player, table: Table) {
		super();
		this.data = data;
		this.events = events;
		this.player = player;
		this.table = table;
	}

	public fireKeyEvent(event: Event, ...args: any[]) {
		this.events.fireVoidEventParm(event, ...args);
	}

	public _getTimers(): TimerHit[] {
		this._beginPlay();
		const interval = this.data.timer.interval >= 0 ? Math.max(this.data.timer.interval, MAX_TIMER_MSEC_INTERVAL) : -1;
		this.hitTimer = new TimerHit(
			this.events,
			interval,
			interval,
		);
		return this.data.timer.enabled ? [this.hitTimer] : [];
	}

	public _addCollection(collection: Collection, pos: number) {
		this.collections.push(collection);
		this.collectionsItemPos.push(pos);
	}

	protected _beginPlay(): void {
		this.events.eventCollection.length = 0;
		this.events.eventCollectionItemPos.length = 0;
		this.events.singleEvents = true;
		for (let i = 0; i < this.collections.length; i++) {
			const col = this.collections[i];
			if (col.fireEvents) {
				this.events.eventCollection.push(col.getEvents());
				this.events.eventCollectionItemPos.push(this.collectionsItemPos[i]);
			}
			if (col.stopSingleEvents) {
				this.events.singleEvents = false;
			}
		}
	}

	protected _assertNonHdrImage(imageName?: string) {
		const tex = this.table.getTexture(imageName);
		if (!tex) {
			throw new Error(`Texture "${imageName}" not found.`);
		}
		if (tex.isHdr()) {
			throw new Error(`Cannot use a HDR image (.exr/.hdr) here`);
		}
	}

	protected _ballCountOver(events: EventProxy): number {
		let cnt = 0;
		for (const ball of this.player.balls) {
			if (ball.hit.isRealBall() && ball.hit.vpVolObjs.indexOf(events) >= 0) {
				++cnt;
				this.player.getPhysics().activeBall = ball; // set active ball for scriptor
			}
		}
		return cnt;
	}

	protected _setTimerEnabled(isEnabled: boolean): void {
		if (isEnabled !== this.data.timer.enabled && this.hitTimer) {

			// to avoid problems with timers dis/enabling themselves, store all the changes in a list
			let found = false;
			for (const changedHitTimer of this.player.getPhysics().changedHitTimers) {
				if (changedHitTimer.timer === this.hitTimer) {
					changedHitTimer.enabled = isEnabled;
					found = true;
					break;
				}
			}

			if (!found) {
				const too = new TimerOnOff(isEnabled, this.hitTimer);
				this.player.getPhysics().changedHitTimers.push(too);
			}

			if (isEnabled) {
				this.hitTimer.nextFire = this.player.getPhysics().timeMsec + this.hitTimer.interval;
			} else {
				this.hitTimer.nextFire = 0xFFFFFFFF;
			} // fakes the disabling of the timer, until it will be catched by the cleanup via m_changed_vht
		}
		this.data.timer.enabled = isEnabled;
	}

	protected _setTimerInterval(interval: number): void {
		this.data.timer.interval = interval;
		if (this.hitTimer) {
			this.hitTimer.interval = interval >= 0 ? Math.max(interval, MAX_TIMER_MSEC_INTERVAL) : -1;
			this.hitTimer.nextFire = this.player.getPhysics().timeMsec + this.hitTimer.interval;
		}
	}
}

export function dequantizeUnsignedPercent(i: number) {
	/* originally:
	 *
	 * enum { N = 100 };
	 * return precise_divide((float)i, (float)N);
	 */
	return Math.min(i / 100, 1);
}

export function quantizeUnsignedPercent(x: number) {
	/* originally:
	 *
	 * enum { N = 100, Np1 = 101 };
	 * assert(x >= 0.f);
	 * return min((unsigned int)(x * (float)Np1), (unsigned int)N);
	 */
	return Math.min(Math.max(0, x) * 100, 100);
}
