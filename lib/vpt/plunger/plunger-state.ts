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

export class PlungerState extends ItemState {

	public static readonly POOL = new Pool(PlungerState);

	/**
	 * Which frame to render
	 */
	public frame: number = 0;

	public constructor() {
		super();
	}

	public static claim(name: string, frame: number): PlungerState {
		const state = PlungerState.POOL.get();
		state.name = name;
		state.frame = frame;
		return state;
	}

	public clone(): PlungerState {
		return PlungerState.claim(this.name, this.frame);
	}

	public diff(state: PlungerState): PlungerState {
		const diff = this.clone();
		if (diff.frame === state.frame) {
			delete diff.frame;
		}
		return diff;
	}

	public release(): void {
		PlungerState.POOL.release(this);
	}

	public equals(state: PlungerState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return state.frame === this.frame;
	}
}
