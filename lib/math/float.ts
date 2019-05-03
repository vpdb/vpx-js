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
 * Rounds a 64-bit floating point number (Node.js) to a 32-bit
 * float used in C.
 *
 * When transcribing single precision floats from C to JavaScript,
 * we need to deal with three different conversions:
 *
 * 1. double precision float: this is the standard in JavaScript and every
 *    math operation will return it.
 * 2. single precision float: this is what we should be using when doing math
 *    operations, i.e. every result should be converted into this using
 *    Math.fround() or [[f4]] below before using it in the next operation.
 * 3. rounded single precision float: like 2., but the additional digits are
 *    removed, i.e. the amount is rounded to 9 significant digits.
 *
 * This function does is return case 3.
 *
 * istanbul ignore next: Only used for debugging
 * @param f8 Double-precision float
 * @return Rounded single-precision float
 */
export function fr(f8: number): number {
	if (f8 === 0) {
		return 0;
	}
	const exp = Math.floor(Math.log10(Math.abs(f8)));
	const f = Math.pow(10, 9 - exp);
	return Math.round(f8 * f) / f;
}

/**
 * Converts a double-precision float to a single precision
 * float. Use this before applying math operations.
 * @param f8
 */
export function f4(f8: number): number {
	return Math.fround(f8);
}

/**
 * Converts degree to radian.
 * @param deg Degree (i.e. 0-360)
 * @return Radian angle
 */
export function degToRad(deg: number): number {
	return f4(f4(deg) * f4(Math.PI / 180.0));
}
