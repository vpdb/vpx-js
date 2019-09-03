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

/* tslint:disable:variable-name adjacent-overload-signatures */
import { Pool } from '../util/object-pool';
import { FLT_MIN } from '../vpt/mesh';
import { f4 } from './float';
import { Matrix2D } from './matrix2d';
import { IRenderVertex, Vertex } from './vertex';
import { Vertex2D } from './vertex2d';

export class Vertex3D implements Vertex {

	private static POOL = new Pool(Vertex3D);

	public readonly isVector2 = false;
	public readonly isVector3 = true;

	set x(_x: number) { this._x = f4(_x); }
	set y(_y: number) { this._y = f4(_y); }
	set z(_z: number) { this._z = f4(_z); }

	get x(): number { return this._x; }
	get y(): number { return this._y; }
	get z(): number { return this._z; }

	private _x!: number;
	private _y!: number;
	private _z!: number;

	public static get(buffer: Buffer) {
		const v3 = new Vertex3D();
		v3.x = buffer.readFloatLE(0);
		v3.y = buffer.readFloatLE(4);
		if (buffer.length >= 12) {
			v3.z = buffer.readFloatLE(8);
		}
		return v3;
	}

	public static from(data: any): Vertex3D {
		return Object.assign(new Vertex3D(), data);
	}

	public static claim(x?: number, y?: number, z?: number): Vertex3D {
		return Vertex3D.POOL.get().set(x || 0, y || 0, z || 0);
	}

	public static release(...vertices: Vertex3D[]) {
		for (const vertex of vertices) {
			Vertex3D.POOL.release(vertex);
		}
	}

	public static reset(v: Vertex3D): void {
		v.set(0, 0, 0);
	}

	constructor(x?: number, y?: number, z?: number) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
	}

	public set(v: Vertex3D): this;
	public set(x: number, y: number, z?: number): this;
	public set(xOrV: number | Vertex3D, y?: number, z?: number): this {
		if (typeof xOrV === 'number') {
			this.x = xOrV;
			this.y = y!;
			this.z = z || 0;

		} else {
			this.x = xOrV.x;
			this.y = xOrV.y;
			this.z = xOrV.z;
		}
		return this;
	}

	public clone(recycle = false): Vertex3D {
		if (recycle) {
			Vertex3D.POOL.get().set(this._x, this._y, this._z);
		}
		return new Vertex3D(this._x, this._y, this._z);
	}

	public normalize(): this {
		return this.divideScalar( this.length() || 1 );
	}

	public normalizeSafe() {
		if (!this.isZero()) {
			this.normalize();
		}
	}

	public length(): number {
		return f4(Math.sqrt( f4(f4(f4(this.x * this.x) + f4(this.y * this.y)) + f4(this.z * this.z))));
	}

	public lengthSq(): number {
		return f4(f4(this.x * this.x) + f4(this.y * this.y)) + f4(this.z * this.z);
	}

	public divideScalar(scalar: number): this {
		return this.multiplyScalar(f4(1 / scalar));
	}

	public multiplyScalar(scalar: number) {
		this.x *= f4(scalar);
		this.y *= f4(scalar);
		this.z *= f4(scalar);
		return this;
	}

	public applyMatrix2D(matrix: Matrix2D): this {
		const x = matrix.matrix[0][0] * this.x + matrix.matrix[0][1] * this.y + matrix.matrix[0][2] * this.z;
		const y = matrix.matrix[1][0] * this.x + matrix.matrix[1][1] * this.y + matrix.matrix[1][2] * this.z;
		const z = matrix.matrix[2][0] * this.x + matrix.matrix[2][1] * this.y + matrix.matrix[2][2] * this.z;
		this.x = x;
		this.y = y;
		this.z = z;
		return this;
	}

	public dot(v: Vertex3D): number {
		return f4(f4(this.x * v.x) + f4(this.y * v.y)) + f4(this.z * v.z);
	}

	public dotAndRelease(v: Vertex3D): number {
		const dot = this.dot(v);
		Vertex3D.release(v);
		return dot;
	}

	public sub(v: Vertex3D): this {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		return this;
	}

	public subAndRelease(v: Vertex3D): this {
		this.sub(v);
		Vertex3D.release(v);
		return this;
	}

	public add(v: Vertex3D): this {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this;
	}

	public addAndRelease(v: Vertex3D): this {
		this.add(v);
		Vertex3D.release(v);
		return this;
	}

	public cross(v: Vertex3D): this {
		return this.crossVectors(this, v);
	}

	public crossVectors(a: Vertex3D, b: Vertex3D) {

		const ax = a.x;
		const ay = a.y;
		const az = a.z;
		const bx = b.x;
		const by = b.y;
		const bz = b.z;

		this.x = f4(ay * bz) - f4(az * by);
		this.y = f4(az * bx) - f4(ax * bz);
		this.z = f4(ax * by) - f4(ay * bx);

		return this;
	}

	public xy(): Vertex2D {
		return new Vertex2D(this.x, this.y);
	}

	public setZero(): this {
		return this.set(0, 0, 0);
	}

	public isZero() {
		return Math.abs(this.x) < FLT_MIN && Math.abs(this.y) < FLT_MIN && Math.abs(this.z) < FLT_MIN;
	}

	public equals(v: Vertex3D) {
		return v.x === this.x && v.y === this.y && v.z === this.z;
	}

	public static crossProduct(pv1: Vertex3D, pv2: Vertex3D, recycle = false): Vertex3D {
		return recycle
			? Vertex3D.claim(
				pv1.y * pv2.z - pv1.z * pv2.y,
				pv1.z * pv2.x - pv1.x * pv2.z,
				pv1.x * pv2.y - pv1.y * pv2.x,
			)
			: new Vertex3D(
				pv1.y * pv2.z - pv1.z * pv2.y,
				pv1.z * pv2.x - pv1.x * pv2.z,
				pv1.x * pv2.y - pv1.y * pv2.x,
			);
	}

	public static crossZ(rz: number, v: Vertex3D, recycle = false) {
		return recycle
			? Vertex3D.claim(-rz * v.y, rz * v.x, 0)
			: new Vertex3D(-rz * v.y, rz * v.x, 0);
	}

	public static getRotatedAxis(angle: number, axis: Vertex3D, temp: Vertex3D): Vertex3D {
		const u = axis.clone();
		u.normalize();

		const sinAngle = f4(Math.sin(f4(f4(Math.PI / 180.0) * angle)));
		const cosAngle = f4(Math.cos(f4(f4(Math.PI / 180.0) * angle)));
		const oneMinusCosAngle = f4(1.0 - cosAngle);

		const rotMatrixRow0 = new Vertex3D();
		const rotMatrixRow1 = new Vertex3D();
		const rotMatrixRow2 = new Vertex3D();

		rotMatrixRow0.x = f4(u.x * u.x) + f4(cosAngle * f4(1.0 - f4(u.x * u.x)));
		rotMatrixRow0.y = f4(f4(u.x * u.y) * oneMinusCosAngle) - f4(sinAngle * u.z);
		rotMatrixRow0.z = f4(f4(u.x * u.z) * oneMinusCosAngle) + f4(sinAngle * u.y);

		rotMatrixRow1.x = f4(f4(u.x * u.y) * oneMinusCosAngle) + f4(sinAngle * u.z);
		rotMatrixRow1.y = f4(u.y * u.y) + f4(cosAngle * (1.0 - f4(u.y * u.y)));
		rotMatrixRow1.z = f4(f4(u.y * u.z) * oneMinusCosAngle) - f4(sinAngle * u.x);

		rotMatrixRow2.x = f4(f4(u.x * u.z) * oneMinusCosAngle) - f4(sinAngle * u.y);
		rotMatrixRow2.y = f4(f4(u.y * u.z) * oneMinusCosAngle) + f4(sinAngle * u.x);
		rotMatrixRow2.z = f4(u.z * u.z) + f4(cosAngle * f4(1.0 - f4(u.z * u.z)));

		return new Vertex3D(temp.dot(rotMatrixRow0), temp.dot(rotMatrixRow1), temp.dot(rotMatrixRow2));
	}
}

export class RenderVertex3D extends Vertex3D implements IRenderVertex {
	public fSmooth: boolean = false;
	public fSlingshot: boolean = false;
	public fControlPoint: boolean = false; // Whether this point was a control point on the curve

	constructor(x?: number, y?: number, z?: number) {
		super(x, y, z);
	}
}
