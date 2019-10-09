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

export class HitTargetState extends ItemState {

	public static readonly POOL = new Pool(HitTargetState);

	public zOffset: number = 0;
	public xRotation: number = 0;

	public constructor() {
		super();
	}

	public static claim(name: string, zOffset: number = 0, xRotation = 0): HitTargetState {
		const state = HitTargetState.POOL.get();
		state.name = name;
		state.zOffset = zOffset;
		state.xRotation = xRotation;
		return state;
	}

	public clone(): HitTargetState {
		return HitTargetState.claim(this.name, this.zOffset, this.xRotation);
	}

	public diff(state: HitTargetState): HitTargetState {
		const diff = this.clone();
		if (diff.zOffset === state.zOffset) {
			delete diff.zOffset;
		}
		if (diff.xRotation === state.xRotation) {
			delete diff.xRotation;
		}
		return diff;
	}

	public release(): void {
		HitTargetState.POOL.release(this);
	}

	public equals(state: HitTargetState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return state.zOffset === this.zOffset && state.xRotation === this.xRotation;
	}
}
