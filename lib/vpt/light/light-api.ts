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
		/* istanbul ignore next: No light sequences yet */
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
	get BlinkInterval() { return this.data.blinkInterval; }
	set BlinkInterval(v) {
		this.data.blinkInterval = v;
		this.animation.timeNextBlink = this.player.getPhysics().timeMsec + this.data.blinkInterval;
	}
	get Intensity() { return this.data.intensity; }
	set Intensity(v) { this.data.intensity = Math.max(0, v); this.animation.updateIntensity(); }
	get TransmissionScale() { return this.data.transmissionScale; }
	set TransmissionScale(v) { this.data.transmissionScale = Math.max(0, v); }
	get IntensityScale() { return this.animation.intensityScale; }
	set IntensityScale(v) { this.animation.intensityScale = v; this.animation.updateIntensity(); }
	get Surface() { return this.data.szSurface; }
	set Surface(v) { this.data.szSurface = v; }
	get Image() { return this.data.szOffImage; }
	set Image(v) { this.data.szOffImage = v; }
	get DepthBias() { return this.data.depthBias; }
	set DepthBias(v) { this.data.depthBias = v; }
	get FadeSpeedUp() { return this.data.fadeSpeedUp; }
	set FadeSpeedUp(v) { this.data.fadeSpeedUp = v; }
	get FadeSpeedDown() { return this.data.fadeSpeedDown; }
	set FadeSpeedDown(v) { this.data.fadeSpeedDown = v; }
	get Bulb() { return this.data.bulbLight; }
	set Bulb(v) { this.data.bulbLight = v; }
	get ImageMode() { return this.data.imageMode; }
	set ImageMode(v) { this.data.imageMode = v; }
	get ShowBulbMesh() { return this.data.showBulbMesh; }
	set ShowBulbMesh(v) { this.data.showBulbMesh = v; }
	get StaticBulbMesh() { return this.data.staticBulbMesh; }
	set StaticBulbMesh(v) { this.data.staticBulbMesh = v; }
	get ShowReflectionOnBall() { return this.data.showReflectionOnBall; }
	set ShowReflectionOnBall(v) { this.data.showReflectionOnBall = v; }
	get ScaleBulbMesh() { return this.data.meshRadius; }
	set ScaleBulbMesh(v) { this.data.meshRadius = v; }
	get BulbModulateVsAdd() { return this.data.bulbModulateVsAdd; }
	set BulbModulateVsAdd(v) { this.data.bulbModulateVsAdd = v; }
	get BulbHaloHeight() { return this.data.bulbHaloHeight; }
	set BulbHaloHeight(v) { this.data.bulbHaloHeight = v; }
	get Visible() { return this.data.isVisible; }
	set Visible(v) { this.data.isVisible = v; }

	public Duration(startState: number, duration: number, endState: number) {
		this.animation.setDuration(startState, duration, endState, this.player.getPhysics().timeMsec);
	}

	protected _getPropertyNames(): string[] {
		return Object.getOwnPropertyNames(LightApi.prototype);
	}
}
