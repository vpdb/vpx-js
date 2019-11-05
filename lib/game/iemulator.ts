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

import { Vertex2D } from '../math/vertex2d';

export interface IEmulator {

	/**
	 * Executes an emulator cycle.
	 *
	 * This method is called *after* key presses and hit events have been
	 * processed (so the ROM gets the latest state), and *before* the physics
	 * cycle (so the physics cycle can react on changes from the emulator).
	 *
	 * Cycles get executed at around 1000 frames per second.
	 *
	 * @param dTime Time passed since last cycle in milliseconds (as double)
	 */
	emuSimulateCycle(dTime: number): void;

	/**
	 * Returns the frame buffer of the DMD.
	 *
	 * Top-right to bottom-left array, one byte per pixel, with values from 0 to 3
	 *
	 * TODO will probably change to use bit planes and cut size by four.
	 */
	getDmdFrame(): Uint8Array;

	/**
	 * Returns the current DMD dimensions.
	 *
	 * @return Vector where `x` is the width and `y` the height.
	 */
	getDmdDimensions(): Vertex2D;
}
