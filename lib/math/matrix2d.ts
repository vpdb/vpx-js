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

import { Pool } from '../util/object-pool';
import { Vertex3D } from './vertex3d';

export class Matrix2D {

	private static readonly POOL = new Pool(Matrix2D);

	public readonly matrix = [
		[ 1, 0, 0 ],
		[ 0, 1, 0 ],
		[ 0, 0, 1 ],
	];

	public static claim(): Matrix2D {
		return Matrix2D.POOL.get();
	}

	public static release(...matrices: Matrix2D[]) {
		for (const matrix of matrices) {
			Matrix2D.POOL.release(matrix);
		}
	}

	public static reset(m: Matrix2D): void {
		m.setIdentity();
	}

	public setIdentity(): this {
		this.matrix[0][0] = 1;
		this.matrix[0][1] = 0;
		this.matrix[0][2] = 0;
		this.matrix[1][0] = 0;
		this.matrix[1][1] = 1;
		this.matrix[1][2] = 0;
		this.matrix[2][0] = 0;
		this.matrix[2][1] = 0;
		this.matrix[2][2] = 1;
		return this;
	}

	public multiplyVectorT(v: Vertex3D, recycle = false): Vertex3D {
		return recycle
			? Vertex3D.claim(
				this.matrix[0][0] * v.x + this.matrix[1][0] * v.y + this.matrix[2][0] * v.z,
				this.matrix[0][1] * v.x + this.matrix[1][1] * v.y + this.matrix[2][1] * v.z,
				this.matrix[0][2] * v.x + this.matrix[1][2] * v.y + this.matrix[2][2] * v.z)
			: new Vertex3D(
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

	public createSkewSymmetric(pv3D: Vertex3D): this {
		this.matrix[0][0] = 0;
		this.matrix[0][1] = -pv3D.z;
		this.matrix[0][2] = pv3D.y;
		this.matrix[1][0] = pv3D.z;
		this.matrix[1][1] = 0;
		this.matrix[1][2] = -pv3D.x;
		this.matrix[2][0] = -pv3D.y;
		this.matrix[2][1] = pv3D.x;
		this.matrix[2][2] = 0;
		return this;
	}

	public clone(recycle = false): Matrix2D {
		const m = recycle ? Matrix2D.claim() : new Matrix2D();
		for (let i = 0; i < 3; ++i) {
			for (let l = 0; l < 3; ++l) {
				m.matrix[i][l] = this.matrix[i][l];
			}
		}
		return m;
	}

	public set(m: Matrix2D) {
		for (let i = 0; i < 3; ++i) {
			for (let l = 0; l < 3; ++l) {
				this.matrix[i][l] = m.matrix[i][l];
			}
		}
	}

	public multiplyMatrix(m1: Matrix2D, m2: Matrix2D) {
		for (let i = 0; i < 3; ++i) {
			for (let l = 0; l < 3; ++l) {
				this.matrix[i][l] =
					m1.matrix[i][0] * m2.matrix[0][l] +
					m1.matrix[i][1] * m2.matrix[1][l] +
					m1.matrix[i][2] * m2.matrix[2][l];
			}
		}
	}

	public multiplyScalar(scalar: number) {
		for (let i = 0; i < 3; ++i) {
			for (let l = 0; l < 3; ++l) {
				this.matrix[i][l] *= scalar;
			}
		}
	}

	public addMatrix(m1: Matrix2D, m2: Matrix2D) {
		for (let i = 0; i < 3; ++i) {
			for (let l = 0; l < 3; ++l) {
				this.matrix[i][l] = m1.matrix[i][l] + m2.matrix[i][l];
			}
		}
	}

	public orthoNormalize() {
		const vX = Vertex3D.claim(this.matrix[0][0], this.matrix[1][0], this.matrix[2][0]);
		const vY = Vertex3D.claim(this.matrix[0][1], this.matrix[1][1], this.matrix[2][1]);
		const vZ = Vertex3D.crossProduct(vX, vY, true);
		vX.normalize();
		vZ.normalize();
		const vYY = Vertex3D.crossProduct(vZ, vX, true);

		this.matrix[0][0] = vX.x;
		this.matrix[0][1] = vYY.x;
		this.matrix[0][2] = vZ.x;
		this.matrix[1][0] = vX.y;
		this.matrix[1][1] = vYY.y;
		this.matrix[1][2] = vZ.y;
		this.matrix[2][0] = vX.z;
		this.matrix[2][1] = vYY.z;
		this.matrix[2][2] = vZ.z;

		Vertex3D.release(vX, vY, vZ, vYY);
	}

	/* istanbul ignore next: debugging only */
	public toString() {
		return `[${Math.round(this.matrix[0][0] * 1000) / 1000}, ${Math.round(this.matrix[0][1] * 1000) / 1000}, ${Math.round(this.matrix[0][2] * 1000) / 1000}]\n` +
			`[${Math.round(this.matrix[1][0] * 1000) / 1000}, ${Math.round(this.matrix[1][1] * 1000) / 1000}, ${Math.round(this.matrix[1][2] * 1000) / 1000}]\n` +
			`[${Math.round(this.matrix[2][0] * 1000) / 1000}, ${Math.round(this.matrix[2][1] * 1000) / 1000}, ${Math.round(this.matrix[2][2] * 1000) / 1000}]\n`;
	}
}
