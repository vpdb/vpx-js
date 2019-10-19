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

export class RampState extends ItemState {

	public static readonly POOL = new Pool(RampState);

	public material!: string;

	public constructor() {
		super();
	}

	public static claim(name: string, material: string, isVisible: boolean): RampState {
		const state = RampState.POOL.get();
		state.name = name;
		state.material = material;
		state.isVisible = isVisible;
		return state;
	}

	public clone(): RampState {
		return RampState.claim(
			this.name,
			this.material,
			this.isVisible,
		);
	}

	public diff(state: RampState): RampState {
		const diff = this.clone();
		if (diff.material === state.material) {
			delete diff.material;
		}
		if (diff.isVisible === state.isVisible) {
			delete diff.isVisible;
		}
		return diff;
	}

	public release(): void {
		RampState.POOL.release(this);
	}

	public equals(state: RampState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return state.material === this.material
			&& state.isVisible === this.isVisible;
	}
}
