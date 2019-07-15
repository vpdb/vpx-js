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

export class PlungerState {

	/**
	 * Plunger position (1 = pulled back, 0 = start position)
	 */
	public readonly pos: number;
	public readonly scaleY: number;

	/**
	 * New plunger state
	 * @param pos Plunger position
	 * @param scaleY How much to scale the flexible spring part
	 */
	constructor(pos: number, scaleY: number) {
		this.pos = pos;
		this.scaleY = scaleY;
	}

	public equals(state: PlungerState): boolean {
		if (!state) {
			return false;
		}
		if (state.pos === this.pos && state.scaleY === this.scaleY) {
			return true;
		}
		return Math.abs(this.pos - state.pos) < 1e-6
			&& Math.abs(this.scaleY - state.scaleY) < 1e-6;
	}
}
