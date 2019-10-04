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

import { IAnimation } from '../../game/ianimatable';
import { PlayerPhysics } from '../../game/player-physics';
import { Table } from '../table/table';
import { Light } from './light';
import { LightData } from './light-data';
import { LightState } from './light-state';

export class LightAnimation implements IAnimation {

	private readonly data: LightData;
	private readonly state: LightState;

	public realState: number = Light.StateOff;
	public finalState: number = Light.StateOff;
	public lockedByLS = false;
	public timeNextBlink: number = 0;
	public intensityScale: number = 1;

	private timeMsec: number = 0;
	private timerDurationEndTime: number = 0;
	private blinkFrame: number = 0;
	private duration: number = 0;
	private iBlinkFrame: number = 0;

	constructor(data: LightData, state: LightState) {
		this.data = data;
		this.state = state;
	}

	public init(physics: PlayerPhysics): void {
		// nothing to init here
	}

	public setState(newVal: number, physics: PlayerPhysics) {
		if (newVal !== this.realState) {
			this.realState = newVal;

			if (this.realState === Light.StateBlinking) {
				this.timeNextBlink = physics.timeMsec;     // Start pattern right away // + m_d.m_blinkinterval;
				this.blinkFrame = 0;                       // reset pattern
			}
			if (this.duration > 0) {
				this.duration = 0;                         // disable duration if a state was set this way
			}
		}
	}

	public restartBlinker(timeMsec: number) {
		this.iBlinkFrame = 0;
		this.timeNextBlink = timeMsec + this.data.blinkInterval;
		this.timerDurationEndTime = timeMsec + this.duration;
	}

	public updateAnimation(physics: PlayerPhysics, table: Table): void {

		const oldTimeMsec = this.timeMsec < physics.timeMsec ? this.timeMsec : physics.timeMsec;
		this.timeMsec = physics.timeMsec;
		const diffTimeMsec = physics.timeMsec - oldTimeMsec;

		if (this.duration > 0 && this.timerDurationEndTime < this.timeMsec) {
			this.realState = this.finalState;
			this.duration = 0;
			if (this.realState === Light.StateBlinking) {
				this.restartBlinker(physics.timeMsec);
			}
		}
		if (this.realState === Light.StateBlinking) {
			this.updateBlinker(physics.timeMsec);
		}

		if (this.isOn()) {
			if (this.state.intensity < this.data.intensity * this.intensityScale) {
				this.state.intensity += this.data.fadeSpeedUp * diffTimeMsec;
				if (this.state.intensity > this.data.intensity * this.intensityScale) {
					this.state.intensity = this.data.intensity * this.intensityScale;
				}
			}
		} else {
			if (this.state.intensity > 0.0) {
				this.state.intensity -= this.data.fadeSpeedDown * diffTimeMsec;
				if (this.state.intensity < 0.0) {
					this.state.intensity = 0.0;
				}
			}
		}
	}

	private updateBlinker(timeMsec: number) {
		if (this.timeNextBlink <= timeMsec) {
			this.iBlinkFrame++;
			if (this.iBlinkFrame >= this.data.rgBlinkPattern.length) {
				this.iBlinkFrame = 0;
			}
			this.timeNextBlink += this.data.blinkInterval;
		}
	}

	public setDuration(startState: number, newVal: number, endState: number, timeMsec: number) {
		this.realState = startState;
		this.duration = newVal;
		this.finalState = endState;
		this.timerDurationEndTime = timeMsec + this.duration;
		if (this.realState === Light.StateBlinking) {
			this.iBlinkFrame = 0;
			this.timeNextBlink = timeMsec + this.data.blinkInterval;
		}
	}

	public updateIntensity() {
		if (this.isOn()) {
			this.state.intensity = this.data.intensity * this.intensityScale;
		}
	}

	private isOn(): boolean {
		return this.realState === Light.StateBlinking
			? this.isBlinkOn()
			: this.realState !== Light.StateOff;
	}

	private isBlinkOn(): boolean {
		return this.data.rgBlinkPattern.substr(this.iBlinkFrame, 1) === '1';
	}
}
