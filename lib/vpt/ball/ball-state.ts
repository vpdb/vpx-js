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

import { Matrix2D } from '../../math/matrix2d';
import { Vertex3D } from '../../math/vertex3d';
import { Pool } from '../../util/object-pool';
import { ItemState } from '../item-state';

/**
 * The dynamic ball state.
 *
 * This is the data we need to properly position the ball on the playfield.
 */
export class BallState extends ItemState {

	public static readonly POOL = new Pool(BallState);

	public pos: Vertex3D = Vertex3D.claim();
	public orientation = Matrix2D.claim();
	public isFrozen: boolean = false;

	public constructor() {
		super();
	}

	public static claim(name: string, pos: Vertex3D): BallState {
		const state = BallState.POOL.get();
		state.name = name;
		state.pos.set(pos);
		state.isFrozen = false;
		return state;
	}

	public clone(): BallState {
		const state = BallState.claim(this.name, this.pos);
		state.orientation.set(this.orientation);
		return state;
	}

	public diff(state: BallState): BallState {
		const diff = this.clone();
		if (diff.pos.equals(state.pos)) {
			Vertex3D.release(diff.pos);
			delete diff.pos;
		}
		if (diff.orientation.equals(state.orientation)) {
			Matrix2D.release(diff.orientation);
			delete diff.orientation;
		}
		if (diff.isFrozen === state.isFrozen) {
			delete diff.isFrozen;
		}
		return diff;
	}

	public release(): void {
		if (!this.pos) {
			this.pos = Vertex3D.claim();
		}
		if (!this.orientation) {
			this.orientation = Matrix2D.claim();
		} else {
			this.orientation.setIdentity();
		}
		BallState.POOL.release(this);
	}

	public equals(state: BallState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return this.pos.equals(state.pos)
			&& this.orientation.equals(state.orientation)
			&& this.isFrozen === state.isFrozen;
	}
}
