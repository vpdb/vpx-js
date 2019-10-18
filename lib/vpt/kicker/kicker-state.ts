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
import { KickerType } from '../enums';
import { ItemState } from '../item-state';

export class KickerState extends ItemState {

	public static readonly POOL = new Pool(KickerState);

	public type!: number;
	public material?: string;

	get isVisible() { return this.type !== KickerType.Invisible; }
	set isVisible(v) { /* not used in abstract */ }

	public constructor() {
		super();
	}

	public static claim(name: string, type: number, material: string | undefined): KickerState {
		const state = KickerState.POOL.get();
		state.name = name;
		state.type = type;
		state.material = material;
		return state;
	}

	public clone(): KickerState {
		return KickerState.claim(
			this.name,
			this.type,
			this.material,
		);
	}

	public diff(state: KickerState): KickerState {
		const diff = this.clone();
		if (diff.type === state.type) {
			delete diff.type;
		}
		if (diff.material === state.material) {
			delete diff.material;
		}
		return diff;
	}

	public release(): void {
		KickerState.POOL.release(this);
	}

	public equals(state: KickerState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return state.type === this.type
			&& state.material === this.material;
	}
}
