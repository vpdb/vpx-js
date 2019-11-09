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

/**
 * handy function to calculate between the 0 based index offset and the wpc 8x8 matrix based index.
 */
export class OffsetIndex {
	public readonly zeroBasedIndex: number;
	public readonly wpcMatrixIndex: number;

	public static fromZeroBased(zeroBasedIndex: number): OffsetIndex {
		const wpcMatrixIndex = OffsetIndex.mapIndexToMatrixIndex(zeroBasedIndex);
		return new OffsetIndex(zeroBasedIndex, wpcMatrixIndex);
	}

	public static fromWpcMatrix(wpcMatrixIndex: number): OffsetIndex {
		const zeroBasedIndex = OffsetIndex.mapMatrixIndexToIndex(wpcMatrixIndex);
		return new OffsetIndex(zeroBasedIndex, wpcMatrixIndex);
	}

 	/**
 	 * convert zero based index to matrix input, 0 -> 11, 8 -> 21
	 */
	public static mapIndexToMatrixIndex(index: number): number {
		const row = Math.floor(index / 8);
		const column = Math.floor(index % 8);
		return 10 * row + 11 + column;
	}

	/**
 	 * convert matrix index to zero based input, 11 -> 0, 21 -> 8
 	 */
	public static mapMatrixIndexToIndex(index: number): number {
		const row = Math.floor((index - 11) / 10);
		const column = Math.floor((index - 11) % 10);
		return 8 * row + column;
	}

	constructor(zeroBasedIndex: number, wpcMatrixIndex: number) {
		this.zeroBasedIndex = zeroBasedIndex;
		this.wpcMatrixIndex = wpcMatrixIndex;
		if (this.zeroBasedIndex < 0 || this.wpcMatrixIndex < 0) {
			throw new Error('NEGATIVE_INDEX_DETECTED');
		}
	}
}
