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
import { f4 } from './float';
import { IRenderVertex, Vertex } from './vertex';
import { Vertex2D } from './vertex2d';

export class Vertex3D implements Vertex {

	public readonly isVector2 = false;
	public readonly isVector3 = true;

	set x(_x: number) { this._x = f4(_x); }
	set y(_y: number) { this._y = f4(_y); }
	set z(_z: number) { this._z = f4(_z); }

	get x() { return this._x; }
	get y() { return this._y; }
	get z() { return this._z; }

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

	constructor(x?: number, y?: number, z?: number) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
	}

	public set(x: number, y: number, z?: number): this {
		this.x = x;
		this.y = y;
		this.z = z || 0;
		return this;
	}

	public clone(): Vertex3D {
		return new Vertex3D(this._x, this._y, this._z);
	}

	public normalize(): this {
		return this.divideScalar( this.length() || 1 );
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

	public dot(v: Vertex3D): number {
		return f4(f4(this.x * v.x) + f4(this.y * v.y)) + f4(this.z * v.z);
	}

	public sub(v: Vertex3D): this {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		return this;
	}

	public add(v: Vertex3D): this {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
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

	public static crossProduct(pv1: Vertex3D, pv2: Vertex3D): Vertex3D {
		return new Vertex3D(
			pv1.y * pv2.z - pv1.z * pv2.y,
			pv1.z * pv2.x - pv1.x * pv2.z,
			pv1.x * pv2.y - pv1.y * pv2.x,
		);
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
