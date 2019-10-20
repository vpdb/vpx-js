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

export class SurfaceState extends ItemState {

	public static readonly POOL = new Pool(SurfaceState);

	public heightTop!: number;

	public topVisible: boolean = true;
	public topMaterial?: string;
	public topTexture?: string;

	public sideVisible: boolean = true;
	public sideMaterial?: string;
	public sideTexture?: string;

	get isVisible() { return this.topVisible || this.sideVisible; }
	set isVisible(v) { /* not used in abstract */ }

	public constructor() {
		super();
	}

	public static claim(name: string, heightTop: number,
						topVisible: boolean, topMaterial: string | undefined, topTexture: string | undefined,
						sideVisible: boolean, sideMaterial: string | undefined, sideTexture: string | undefined): SurfaceState {

		const state = SurfaceState.POOL.get();
		state.name = name;
		state.heightTop = heightTop;
		state.topVisible = topVisible;
		state.topMaterial = topMaterial;
		state.topTexture = topTexture;
		state.sideVisible = sideVisible;
		state.sideMaterial = sideMaterial;
		state.sideTexture = sideTexture;
		return state;
	}

	public clone(): SurfaceState {
		return SurfaceState.claim(
			this.name,
			this.heightTop,
			this.topVisible,
			this.topMaterial,
			this.topTexture,
			this.sideVisible,
			this.sideMaterial,
			this.sideTexture,
		);
	}

	public diff(state: SurfaceState): SurfaceState {
		const diff = this.clone();
		if (diff.heightTop === state.heightTop) {
			delete diff.heightTop;
		}
		if (diff.topVisible === state.topVisible) {
			delete diff.topVisible;
		}
		if (diff.topMaterial === state.topMaterial) {
			delete diff.topMaterial;
		}
		if (diff.topTexture === state.topTexture) {
			delete diff.topTexture;
		}
		if (diff.sideVisible === state.sideVisible) {
			delete diff.sideVisible;
		}
		if (diff.sideMaterial === state.sideMaterial) {
			delete diff.sideMaterial;
		}
		if (diff.sideTexture === state.sideTexture) {
			delete diff.sideTexture;
		}
		return diff;
	}

	public release(): void {
		SurfaceState.POOL.release(this);
	}

	public equals(state: SurfaceState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return state.heightTop === this.heightTop
			&& state.topVisible === this.topVisible
			&& state.topMaterial === this.topMaterial
			&& state.topTexture === this.topTexture
			&& state.sideVisible === this.sideVisible
			&& state.sideMaterial === this.sideMaterial
			&& state.sideTexture === this.sideTexture;
	}
}
