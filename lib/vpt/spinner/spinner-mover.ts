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

import { PHYS_FACTOR } from '../../physics/constants';
import { MoverObject } from '../../physics/mover-object';
import { SpinnerData } from './spinner-data';
import { SpinnerState } from './spinner-state';

export class SpinnerMover implements MoverObject {

	private readonly data: SpinnerData;
	private readonly state: SpinnerState;

	public anglespeed: number = 0;
	public angleMax: number = 0;
	public angleMin: number = 0;
	public elasticity: number = 0;
	public damping: number = 0;
	public isVisible: boolean = false;

	constructor(data: SpinnerData, state: SpinnerState) {
		this.data = data;
		this.state = state;
	}

	public updateDisplacements(dtime: number): void {
		if (this.data.angleMin !== this.data.angleMax) { // blocked spinner, limited motion spinner

			this.state.angle += this.anglespeed * dtime;

			if (this.state.angle > this.angleMax) {
				this.state.angle = this.angleMax;
				// FIXME event
				//m_pspinner->FireVoidEventParm(DISPID_LimitEvents_EOS, fabsf(RADTOANG(this.anglespeed)));	// send EOS event

				if (this.anglespeed > 0) {
					this.anglespeed *= -0.005 - this.elasticity;
				}
			}
			if (this.state.angle < this.angleMin) {
				this.state.angle = this.angleMin;

				// FIXME event
				//m_pspinner->FireVoidEventParm(DISPID_LimitEvents_BOS, fabsf(RADTOANG(this.anglespeed)));	// send Park event

				if (this.anglespeed < 0) {
					this.anglespeed *= -0.005 - this.elasticity;
				}
			}
		} else {
			const target = (this.anglespeed > 0)
				? (this.state.angle < Math.PI ? Math.PI : 3.0 * Math.PI)
				: (this.state.angle < Math.PI ? -Math.PI : Math.PI);

			this.state.angle += this.anglespeed * dtime;

			if (this.anglespeed > 0) {
				if (this.state.angle > target) {
					// FIXME event
					//m_pspinner->FireGroupEvent(DISPID_SpinnerEvents_Spin);
				}
			} else {
				if (this.state.angle < target) {
					// FIXME event
					//m_pspinner->FireGroupEvent(DISPID_SpinnerEvents_Spin);
				}
			}

			while (this.state.angle > (2.0 * Math.PI)) {
				this.state.angle -= (2.0 * Math.PI);
			}
			while (this.state.angle < 0.0) {
				this.state.angle += (2.0 * Math.PI);
			}
		}
	}

	public updateVelocities(): void {
		this.anglespeed -= Math.sin(this.state.angle) * (0.0025 * PHYS_FACTOR); // Center of gravity towards bottom of object, makes it stop vertical
		this.anglespeed *= this.damping;
	}
}
