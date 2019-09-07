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

const solution: [number, number] = [0, 0];

/**
 * Solves an quadratic equation.
 *
 * Note that the result is recycled, meaning running it twice will make the second
 * run update the first run's result, so retrieve the result before running it a
 * second time in a row!
 */
export function solveQuadraticEq(a: number, b: number, c: number): [number, number] | undefined {
	let discr = b * b - 4.0 * a * c;

	if (discr < 0) {
		return undefined;
	}

	discr = Math.sqrt(discr);

	const invA = (-0.5) / a;
	solution[0] = (b + discr) * invA;
	solution[1] = (b - discr) * invA;

	return solution;
}

export function clamp(x: number, min: number, max: number) {
	if (x < min) {
		return min;
	} else if (x > max) {
		return max;
	} else {
		return x;
	}
}
