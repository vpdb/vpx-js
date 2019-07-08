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

import { Matrix4 } from 'three';
import { f4, fr } from './float';
import { Vertex3D } from './vertex3d';

/**
 * Three's Matrix4.multiply() gives different results than VPinball's. Duh.
 * Here's an implementation that does the same thing.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/math/matrix.h#L160
 */
export class Matrix3D {

	private readonly matrix = [
		[ 1, 0, 0, 0 ],
		[ 0, 1, 0, 0 ],
		[ 0, 0, 1, 0 ],
		[ 0, 0, 0, 1 ],
	];

	constructor() {
		this.setIdentity();
	}

	public setIdentity(): this {
		this._11 = this._22 = this._33 = this._44 = 1.0;
		this._12 = this._13 = this._14 = this._41 =
		this._21 = this._23 = this._24 = this._42 =
		this._31 = this._32 = this._34 = this._43 = 0.0;
		return this;
	}

	public setTranslation(tx: number, ty: number, tz: number): this {
		this.setIdentity();
		this._41 = tx;
		this._42 = ty;
		this._43 = tz;
		return this;
	}

	public setScaling(sx: number, sy: number, sz: number) {
		this.setIdentity();
		this._11 = sx;
		this._22 = sy;
		this._33 = sz;
	}

	public rotateXMatrix(x: number) {
		this.setIdentity();
		this._22 = this._33 = Math.cos(f4(x));
		this._23 = Math.sin(f4(x));
		this._32 = -this._23;
	}

	public rotateYMatrix(y: number) {
		this.setIdentity();
		this._11 = this._33 = Math.cos(f4(y));
		this._31 = Math.sin(f4(y));
		this._13 = -this._31;
	}

	public rotateZMatrix(z: number): this {
		this.setIdentity();
		this._11 = this._22 = Math.cos(f4(z));
		this._12 = Math.sin(f4(z));
		this._21 = -this._12;
		return this;
	}

	public multiplyVector(v: Vertex3D): Vertex3D {
		// Transform it through the current matrix set
		const xp = f4(f4(f4(f4(this._11 * v.x) + f4(this._21 * v.y)) + f4(this._31 * v.z)) + this._41);
		const yp = f4(f4(f4(f4(this._12 * v.x) + f4(this._22 * v.y)) + f4(this._32 * v.z)) + this._42);
		const zp = f4(f4(f4(f4(this._13 * v.x) + f4(this._23 * v.y)) + f4(this._33 * v.z)) + this._43);
		const wp = f4(f4(f4(f4(this._14 * v.x) + f4(this._24 * v.y)) + f4(this._34 * v.z)) + this._44);
		const invWp = f4(1.0 / wp);
		return new Vertex3D(xp * invWp, yp * invWp, zp * invWp);
	}

	public multiplyVectorNoTranslate(v: Vertex3D): Vertex3D {
		// Transform it through the current matrix set
		const xp = f4(f4(this._11 * v.x) + f4(this._21 * v.y)) + f4(this._31 * v.z);
		const yp = f4(f4(this._12 * v.x) + f4(this._22 * v.y)) + f4(this._32 * v.z);
		const zp = f4(f4(this._13 * v.x) + f4(this._23 * v.y)) + f4(this._33 * v.z);
		return new Vertex3D(xp, yp, zp);
	}

	public multiply(a: Matrix3D, b?: Matrix3D): this {
		if (b) {
			Object.assign(this.matrix, Matrix3D.multiplyMatrices(a, b).matrix);
		} else {
			Object.assign(this.matrix, Matrix3D.multiplyMatrices(this, a).matrix);
		}
		return this;
	}

	public multiplyScalar(scalar: number) {
		for (let i = 0; i < 3; ++i) {
			for (let l = 0; l < 3; ++l) {
				this.matrix[i][l] *= scalar;
			}
		}
	}

	public preMultiply(a: Matrix3D): this {
		Object.assign(this.matrix, Matrix3D.multiplyMatrices(a, this).matrix);
		return this;
	}

	// public invert(): this {
	// 	const ipvt = [0, 1, 2, 3];
	// 	for (let k = 0; k < 4; ++k) {
	// 		let temp = 0;
	// 		let l = k;
	// 		for (let i = k; i < 4; ++i) {
	// 			const dd = Math.abs(this.matrix[k][i]);
	// 			if (dd > temp) {
	// 				temp = dd;
	// 				l = i;
	// 			}
	// 		}
	// 		if (l !== k) {
	// 			const tmp = ipvt[k];
	// 			ipvt[k] = ipvt[l];
	// 			ipvt[l] = tmp;
	// 			for (let j = 0; j < 4; ++j) {
	// 				temp = this.matrix[j][k];
	// 				this.matrix[j][k] = this.matrix[j][l];
	// 				this.matrix[j][l] = temp;
	// 			}
	// 		}
	// 		const d = 1.0 / this.matrix[k][k];
	// 		for (let j = 0; j < k; ++j) {
	// 			const c = this.matrix[j][k] * d;
	// 			for (let i = 0; i < 4; ++i) {
	// 				this.matrix[j][i] -= this.matrix[k][i] * c;
	// 			}
	// 			this.matrix[j][k] = c;
	// 		}
	// 		for (let j = k + 1; j < 4; ++j) {
	// 			const c = this.matrix[j][k] * d;
	// 			for (let i = 0; i < 4; ++i) {
	// 				this.matrix[j][i] -= this.matrix[k][i] * c;
	// 			}
	// 			this.matrix[j][k] = c;
	// 		}
	// 		for (let i = 0; i < 4; ++i) {
	// 			this.matrix[k][i] = -this.matrix[k][i] * d;
	// 		}
	// 		this.matrix[k][k] = d;
	// 	}
	// 	return this;
	// }
	//
	// public transpose(): this {
	// 	const clone = this.clone();
	// 	for (let i = 0; i < 4; ++i) {
	// 		this.matrix[0][i] = clone.matrix[i][0];
	// 		this.matrix[1][i] = clone.matrix[i][1];
	// 		this.matrix[2][i] = clone.matrix[i][2];
	// 		this.matrix[3][i] = clone.matrix[i][3];
	// 	}
	// 	return this;
	// }
	//
	// public createSkewSymmetric(pv3D: Vertex3D) {
	// 	this.matrix[0][0] = 0;
	// 	this.matrix[0][1] = -pv3D.z;
	// 	this.matrix[0][2] = pv3D.y;
	// 	this.matrix[1][0] = pv3D.z;
	// 	this.matrix[1][1] = 0;
	// 	this.matrix[1][2] = -pv3D.x;
	// 	this.matrix[2][0] = -pv3D.y;
	// 	this.matrix[2][1] = pv3D.x;
	// 	this.matrix[2][2] = 0;
	// }
	//
	// public addMatrix(pmat1: Matrix3D, pmat2: Matrix3D) {
	// 	for (let i = 0; i < 3; ++i) {
	// 		for (let l = 0; l < 3; ++l) {
	// 			this.matrix[i][l] = pmat1.matrix[i][l] + pmat2.matrix[i][l];
	// 		}
	// 	}
	// }
	//
	// public orthoNormalize() {
	// 	const vX = new Vertex3D(this.matrix[0][0], this.matrix[1][0], this.matrix[2][0]);
	// 	let vY = new Vertex3D(this.matrix[0][1], this.matrix[1][1], this.matrix[2][1]);
	// 	const vZ = Vertex3D.crossProduct(vX, vY);
	// 	vX.normalize();
	// 	vZ.normalize();
	// 	vY = Vertex3D.crossProduct(vZ, vX);
	// 	//vY.Normalize(); // not needed
	//
	// 	this.matrix[0][0] = vX.x;
	// 	this.matrix[0][1] = vY.x;
	// 	this.matrix[0][2] = vZ.x;
	// 	this.matrix[1][0] = vX.y;
	// 	this.matrix[1][1] = vY.y;
	// 	this.matrix[1][2] = vZ.y;
	// 	this.matrix[2][0] = vX.z;
	// 	this.matrix[2][1] = vY.z;
	// 	this.matrix[2][2] = vZ.z;
	// }

	public toRightHanded(): Matrix3D {
		const tempMat = new Matrix3D();
		tempMat.setScaling(1, 1, -1);
		return this.clone().multiply(tempMat);
	}

	public toThreeMatrix4(): Matrix4 {
		const matrix = new Matrix4();
		matrix.set(
			this._11, this._21, this._31, this._41,
			this._12, this._22, this._32, this._42,
			this._13, this._23, this._33, this._43,
			this._14, this._24, this._34, this._44,
		);
		return matrix;
	}

	private static multiplyMatrices(a: Matrix3D, b: Matrix3D): Matrix3D {
		const result = new Matrix3D();
		for (let i = 0; i < 4; ++i) {
			for (let l = 0; l < 4; ++l) {
				result.matrix[i][l] =
					f4(f4(f4(f4(a.matrix[0][l] * b.matrix[i][0]) +
					f4(a.matrix[1][l] * b.matrix[i][1])) +
					f4(a.matrix[2][l] * b.matrix[i][2])) +
					f4(a.matrix[3][l] * b.matrix[i][3]));
			}
		}
		return result;
	}

	public clone(): Matrix3D {
		const matrix = new Matrix3D();
		Object.assign(matrix.matrix, this.matrix);
		return matrix;
	}

	/** istanbul ignore next */
	public debug(): string[] {
		return [
			`_11: ${fr(this._11)}`,
			`_12: ${fr(this._12)}`,
			`_13: ${fr(this._13)}`,
			`_14: ${fr(this._14)}`,
			`_21: ${fr(this._21)}`,
			`_22: ${fr(this._22)}`,
			`_23: ${fr(this._23)}`,
			`_24: ${fr(this._24)}`,
			`_31: ${fr(this._31)}`,
			`_32: ${fr(this._32)}`,
			`_33: ${fr(this._33)}`,
			`_34: ${fr(this._34)}`,
			`_41: ${fr(this._41)}`,
			`_42: ${fr(this._42)}`,
			`_43: ${fr(this._43)}`,
			`_44: ${fr(this._44)}`,
		];
	}

	get _11() { return this.matrix[0][0]; }
	set _11(v) { this.matrix[0][0] = f4(v); }
	get _12() { return this.matrix[1][0]; }
	set _12(v) { this.matrix[1][0] = f4(v); }
	get _13() { return this.matrix[2][0]; }
	set _13(v) { this.matrix[2][0] = f4(v); }
	get _14() { return this.matrix[3][0]; }
	set _14(v) { this.matrix[3][0] = f4(v); }
	get _21() { return this.matrix[0][1]; }
	set _21(v) { this.matrix[0][1] = f4(v); }
	get _22() { return this.matrix[1][1]; }
	set _22(v) { this.matrix[1][1] = f4(v); }
	get _23() { return this.matrix[2][1]; }
	set _23(v) { this.matrix[2][1] = f4(v); }
	get _24() { return this.matrix[3][1]; }
	set _24(v) { this.matrix[3][1] = f4(v); }
	get _31() { return this.matrix[0][2]; }
	set _31(v) { this.matrix[0][2] = f4(v); }
	get _32() { return this.matrix[1][2]; }
	set _32(v) { this.matrix[1][2] = f4(v); }
	get _33() { return this.matrix[2][2]; }
	set _33(v) { this.matrix[2][2] = f4(v); }
	get _34() { return this.matrix[3][2]; }
	set _34(v) { this.matrix[3][2] = f4(v); }
	get _41() { return this.matrix[0][3]; }
	set _41(v) { this.matrix[0][3] = f4(v); }
	get _42() { return this.matrix[1][3]; }
	set _42(v) { this.matrix[1][3] = f4(v); }
	get _43() { return this.matrix[2][3]; }
	set _43(v) { this.matrix[2][3] = f4(v); }
	get _44() { return this.matrix[3][3]; }
	set _44(v) { this.matrix[3][3] = f4(v); }
}
