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
import { ItemState } from '../item-state';

/**
 * The dynamic ball state.
 *
 * This is the data we need to properly position the ball on the playfield.
 */
export class BallState extends ItemState {

	public readonly pos: Vertex3D;
	public readonly orientation = new Matrix2D();

	constructor(name: string, pos: Vertex3D, orientation: Matrix2D) {
		super(name);
		this.pos = pos;
		this.orientation = orientation;
	}

	public clone(): ItemState {
		return new BallState(this.name, this.pos.clone(), this.orientation.clone());
	}

	public equals(state: BallState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return this.pos.x === state.pos.x && this.pos.y === state.pos.y && this.pos.z === state.pos.z
			&& this.orientation.matrix[0][0] === state.orientation.matrix[0][0] && this.orientation.matrix[0][1] === state.orientation.matrix[0][1] && this.orientation.matrix[0][2] === state.orientation.matrix[0][2]
			&& this.orientation.matrix[1][0] === state.orientation.matrix[1][0] && this.orientation.matrix[1][1] === state.orientation.matrix[1][1] && this.orientation.matrix[1][2] === state.orientation.matrix[1][2]
			&& this.orientation.matrix[2][0] === state.orientation.matrix[2][0] && this.orientation.matrix[2][1] === state.orientation.matrix[2][1] && this.orientation.matrix[2][2] === state.orientation.matrix[2][2];
	}
}
