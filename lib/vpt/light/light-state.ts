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

import { Pool } from '../../util/object-pool';
import { ItemState } from '../item-state';

export class LightState extends ItemState {

	public static readonly POOL = new Pool(LightState);

	/**
	 * Intensity, from 0 to 1 (probably)
	 */
	public intensity: number = 0;
	public color: number = 0;
	public colorFull: number = 0;

	public constructor() {
		super();
	}

	public static claim(name: string, intensity: number, color: number, colorFull: number): LightState {
		const state = LightState.POOL.get();
		state.name = name;
		state.intensity = intensity;
		state.color = color;
		state.colorFull = colorFull;
		return state;
	}

	public clone(): LightState {
		return LightState.claim(this.name, this.intensity, this.color, this.colorFull);
	}

	public diff(state: LightState): LightState {
		const diff = this.clone();
		if (diff.intensity === state.intensity) {
			delete diff.intensity;
		}
		if (diff.color === state.color) {
			delete diff.color;
		}
		if (diff.colorFull === state.colorFull) {
			delete diff.colorFull;
		}
		return diff;
	}

	public release(): void {
		LightState.POOL.release(this);
	}

	public equals(state: LightState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return state.intensity === this.intensity
			&& state.color === this.color
			&& state.colorFull === this.colorFull;
	}
}
