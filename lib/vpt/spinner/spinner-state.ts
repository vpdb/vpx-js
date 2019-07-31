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

export class SpinnerState {

	/**
	 * Angle in rad
	 */
	public readonly angle: number;

	/**
	 * New spinner state
	 * @param angle Spinner angle in rad
	 */
	constructor(angle: number) {
		this.angle = angle;
	}

	public equals(state: SpinnerState): boolean {
		if (!state) {
			return false;
		}
		if (state.angle === this.angle) {
			return true;
		}
		return Math.abs(this.angle - state.angle) < 1e-6;
	}
}
