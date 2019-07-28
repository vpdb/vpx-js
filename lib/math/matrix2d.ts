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

import { Vertex3D } from './vertex3d';

export class Matrix2D {

	public readonly matrix = [
		[ 1, 0, 0 ],
		[ 0, 1, 0 ],
		[ 0, 0, 1 ],
	];

	public multiplyVectorT(v: Vertex3D): Vertex3D {
		return new Vertex3D(
			this.matrix[0][0] * v.x + this.matrix[1][0] * v.y + this.matrix[2][0] * v.z,
			this.matrix[0][1] * v.x + this.matrix[1][1] * v.y + this.matrix[2][1] * v.z,
			this.matrix[0][2] * v.x + this.matrix[1][2] * v.y + this.matrix[2][2] * v.z);
	}

	public rotationAroundAxis(axis: Vertex3D, rsin: number, rcos: number) {
		this.matrix[0][0] = axis.x * axis.x + rcos * (1.0 - axis.x * axis.x);
		this.matrix[1][0] = axis.x * axis.y * (1.0 - rcos) - axis.z * rsin;
		this.matrix[2][0] = axis.z * axis.x * (1.0 - rcos) + axis.y * rsin;

		this.matrix[0][1] = axis.x * axis.y * (1.0 - rcos) + axis.z * rsin;
		this.matrix[1][1] = axis.y * axis.y + rcos * (1.0 - axis.y * axis.y);
		this.matrix[2][1] = axis.y * axis.z * (1.0 - rcos) - axis.x * rsin;

		this.matrix[0][2] = axis.z * axis.x * (1.0 - rcos) - axis.y * rsin;
		this.matrix[1][2] = axis.y * axis.z * (1.0 - rcos) + axis.x * rsin;
		this.matrix[2][2] = axis.z * axis.z + rcos * (1.0 - axis.z * axis.z);
	}
}
