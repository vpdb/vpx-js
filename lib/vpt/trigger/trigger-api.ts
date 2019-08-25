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

import { Player } from '../../game/player';
import { FireEvents } from '../../physics/fire-events';
import { ItemApi } from '../item-api';
import { Table } from '../table/table';
import { TriggerData } from './trigger-data';

export class TriggerApi extends ItemApi {

	private readonly data: TriggerData;
	private readonly events: FireEvents;

	constructor(data: TriggerData, events: FireEvents, player: Player, table: Table) {
		super(player, table);
		this.data = data;
		this.events = events;
	}

	// from IEditable
	get Name() { return this.data.wzName; }
	set Name(v) { this.data.wzName = v; }
	get TimerInterval() { return this.data.timer.interval; }
	set TimerInterval(v) { this.data.timer.interval = v; }
	get TimerEnabled() { return this.data.timer.enabled; }
	set TimerEnabled(v) { this.data.timer.enabled = v; }
	public UserValue: any;

	// from Trigger
	get X() { return this.data.vCenter.x; }
	set X(v) { this.data.vCenter.x = v; }
	get Y() { return this.data.vCenter.y; }
	set Y(v) { this.data.vCenter.y = v; }
	get Radius() { return this.data.radius; }
	set Radius(v) { this.data.radius = v; }
	get Surface() { return this.data.szSurface; }
	set Surface(v) { this.data.szSurface = v; }
	get Enabled() { return this.data.isEnabled; }
	set Enabled(v) { this.data.isEnabled = v; }
	get Visible() { return this.data.isVisible; }
	set Visible(v) { this.data.isVisible = v; }
	get HitHeight() { return this.data.hitHeight; }
	set HitHeight(v) { this.data.hitHeight = v; }
	get Rotation() { return this.data.rotation; }
	set Rotation(v) { this.data.rotation = v; }
	get WireThickness() { return this.data.wireThickness; }
	set WireThickness(v) { this.data.wireThickness = v; }
	get AnimSpeed() { return this.data.animSpeed; }
	set AnimSpeed(v) { this.data.animSpeed = v; }
	get Material() { return this.data.szMaterial; }
	set Material(v) { this.data.szMaterial = v; }
	get TriggerShape() { return this.data.shape; }
	set TriggerShape(v) { this.data.shape = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }

	public DestroyBall(): number {
		let cnt = 0;
		for (const ball of this.player.balls) {
			const j = ball.hit.isRealBall() ? ball.hit.vpVolObjs.indexOf(this.events) : -1;
			if (j >= 0) {
				++cnt;
				ball.hit.vpVolObjs.splice(j, 1);
				this.player.destroyBall(ball); // inside trigger volume?
			}
		}
		return cnt;
	}

	public BallCntOver(): number {
		return super.BallCntOver(this.events);
	}

	/**
	 * No idea wtf this is supposed to do.
	 */
	public InterfaceSupportsErrorInfo(riid: any): boolean {
		return false;
	}
}
