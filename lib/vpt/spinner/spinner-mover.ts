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
import { degToRad, radToDeg } from '../../math/float';
import { PHYS_FACTOR } from '../../physics/constants';
import { MoverObject } from '../../physics/mover-object';
import { SpinnerData } from './spinner-data';
import { SpinnerState } from './spinner-state';

export class SpinnerMover implements MoverObject {

	private readonly data: SpinnerData;
	private readonly state: SpinnerState;
	private readonly events: EventProxy;

	public angleSpeed: number = 0;
	public angleMax: number;
	public angleMin: number;
	public elasticity: number;
	public damping: number;
	public isVisible: boolean;

	constructor(data: SpinnerData, state: SpinnerState, events: EventProxy) {
		this.data = data;
		this.state = state;
		this.events = events;

		this.angleMax = degToRad(data.angleMax);
		this.angleMin = degToRad(data.angleMin);

		// compute proper damping factor for physics framerate
		this.damping = Math.pow(data.damping, PHYS_FACTOR);

		this.elasticity = data.elasticity;
		this.isVisible = data.isVisible;
	}

	public updateDisplacements(dTime: number): void {
		if (this.data.angleMin !== this.data.angleMax) {   // blocked spinner, limited motion spinner

			this.state.angle += this.angleSpeed * dTime;

			if (this.state.angle > this.angleMax) {
				this.state.angle = this.angleMax;
				this.events.fireVoidEventParm(Event.LimitEventsEOS, Math.abs(radToDeg(this.angleSpeed))); // send EOS event

				if (this.angleSpeed > 0) {
					this.angleSpeed *= -0.005 - this.elasticity;
				}
			}
			if (this.state.angle < this.angleMin) {
				this.state.angle = this.angleMin;
				this.events.fireVoidEventParm(Event.LimitEventsBOS, Math.abs(radToDeg(this.angleSpeed))); // send Park event

				if (this.angleSpeed < 0) {
					this.angleSpeed *= -0.005 - this.elasticity;
				}
			}

		} else {                                           // "normal" 360° spinner
			const target = this.angleSpeed > 0
				? (this.state.angle < Math.PI ? Math.PI : 3.0 * Math.PI)
				: (this.state.angle < Math.PI ? -Math.PI : Math.PI);

			this.state.angle += this.angleSpeed * dTime;

			if (this.angleSpeed > 0) {
				if (this.state.angle > target) {
					this.events.fireGroupEvent(Event.SpinnerEventsSpin);
				}
			} else {
				if (this.state.angle < target) {
					this.events.fireGroupEvent(Event.SpinnerEventsSpin);
				}
			}

			// clamp angle between 0 and 2π
			while (this.state.angle > 2.0 * Math.PI) {
				this.state.angle -= 2.0 * Math.PI;
			}
			while (this.state.angle < 0.0) {
				this.state.angle += 2.0 * Math.PI;
			}
		}
	}

	public updateVelocities(): void {
		this.angleSpeed -= Math.sin(this.state.angle) * (0.0025 * PHYS_FACTOR); // Center of gravity towards bottom of object, makes it stop vertical
		this.angleSpeed *= this.damping;
	}
}
