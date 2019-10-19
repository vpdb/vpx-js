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

export class TableState extends ItemState {

	public static readonly POOL = new Pool(TableState);

	public material?: string;

	public constructor() {
		super();
	}

	public static claim(name: string, material: string | undefined, isVisible: boolean): TableState {
		const state = TableState.POOL.get();
		state.name = name;
		state.material = material;
		state.isVisible = isVisible;
		return state;
	}

	public clone(): TableState {
		return TableState.claim(
			this.name,
			this.material,
			this.isVisible,
		);
	}

	public diff(state: TableState): TableState {
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
		TableState.POOL.release(this);
	}

	public equals(state: TableState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return state.material === this.material
			&& state.isVisible === this.isVisible;
	}
}
