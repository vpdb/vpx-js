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

import { Event } from '../../game/event';
import { EventProxy } from '../../game/event-proxy';
import { IAnimation } from '../../game/ianimatable';
import { Player } from '../../game/player';
import { Table } from '../table/table';
import { HitTarget } from './hit-target';
import { HitTargetData } from './hit-target-data';
import { HitTargetState } from './hit-target-state';

export class HitTargetAnimation implements IAnimation {

	private readonly data: HitTargetData;
	private readonly state: HitTargetState;
	private readonly events: EventProxy;

	public timeStamp = 0;
	public hitEvent = false;
	private timeMsec = 0;
	private moveDown = true;
	private moveAnimation = false;

	constructor(data: HitTargetData, state: HitTargetState, events: EventProxy) {
		this.data = data;
		this.state = state;
		this.events = events;
	}

	public init(player: Player): void {
		this.timeMsec = player.timeMsec;
	}

	public updateAnimation(player: Player, table: Table): void {
		const oldTimeMsec = (this.timeMsec < player.timeMsec) ? this.timeMsec : player.timeMsec;
		this.timeMsec = player.timeMsec;
		const diffTimeMsec = player.timeMsec - oldTimeMsec;

		if (this.hitEvent) {
			if (!this.data.isDropped) {
				this.moveDown = true;
			}
			this.moveAnimation = true;
			this.hitEvent = false;
		}
		if (this.data.isDropTarget()) {
			if (this.moveAnimation) {
				let step = this.data.dropSpeed * table.getScaleZ();
				const limit = HitTarget.DROP_TARGET_LIMIT * table.getScaleZ();
				if (this.moveDown) {
					step = -step;

				} else if (this.timeMsec - this.timeStamp < this.data.raiseDelay) {
					step = 0.0;
				}
				this.state.zOffset += step * diffTimeMsec;
				if (this.moveDown) {
					if (this.state.zOffset <= -limit) {
						this.state.zOffset = -limit;
						this.moveDown = false;
						this.data.isDropped = true;
						this.moveAnimation = false;
						this.timeStamp = 0;
						if (this.data.useHitEvent) {
							this.events.fireGroupEvent(Event.TargetEventsDropped);
						}
					}

				} else {
					if (this.state.zOffset >= 0.0) {
						this.state.zOffset = 0.0;
						this.moveAnimation = false;
						this.data.isDropped = false;
						if (this.data.useHitEvent) {
							this.events.fireGroupEvent(Event.TargetEventsRaised);
						}
					}
				}
				//UpdateTarget();
			}
		} else {
			if (this.moveAnimation) {
				let step = this.data.dropSpeed * table.getScaleZ();
				const limit = 13.0 * table.getScaleZ();
				if (!this.moveDown) {
					step = -step;
				}
				this.state.xRotation += step * diffTimeMsec;
				if (this.moveDown) {
					if (this.state.xRotation >= limit) {
						this.state.xRotation = limit;
						this.moveDown = false;
					}

				} else {
					if (this.state.xRotation <= 0.0) {
						this.state.xRotation = 0.0;
						this.moveAnimation = false;
					}
				}
				//UpdateTarget();
			}
		}
	}
}
