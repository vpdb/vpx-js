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
import { LightAnimation } from './light-animation';
import { LightData } from './light-data';

export class LightApi extends ItemApi<LightData> {

	private readonly animation: LightAnimation;

	constructor(animation: LightAnimation, data: LightData, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.animation = animation;
	}

	get Falloff() { return this.data.falloff; }
	set Falloff(v) { if (v > 0) { this.data.falloff = v; } }
	get FalloffPower() { return this.data.falloffPower; }
	set FalloffPower(v) { this.data.falloffPower = v; }
	get State() { return this.animation.lockedByLS ? this.data.state : this.animation.realState; }
	set State(v) {
		if (!this.animation.lockedByLS) {
			this.animation.setState(v, this.player.getPhysics());
		}
		this.data.state = v;
	}
	get Color() { return this.data.color; }
	set Color(v) { this.data.color = v; }
	get ColorFull() { return this.data.color2; }
	set ColorFull(v) { this.data.color2 = v; }
	get X() { return this.data.center.x; }
	set X(v) { this.data.center.x = v; }
	get Y() { return this.data.center.y; }
	set Y(v) { this.data.center.y = v; }
	get BlinkPattern() { return this.data.rgBlinkPattern; }
	set BlinkPattern(v) {
		this.data.rgBlinkPattern = v || '0';
		this.animation.restartBlinker(this.player.getPhysics().timeMsec);
	}

}
