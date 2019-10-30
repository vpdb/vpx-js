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
import { Vertex3D } from './vertex3d';

export interface Vertex {
	x: number;
	y: number;
	clone(): Vertex;
	sub(v: Vertex): this;
	length(): number;
}

export interface IRenderVertex {
	x: number;
	y: number;
	fSmooth: boolean;
	fSlingshot: boolean;
	fControlPoint: boolean;
	isVector3: boolean;

	set(x: number, y: number, z?: number): this;
}

export class Vertex3DNoTex2 {
	public static size = 32;

	set x(x: number) {
		this._x = f4(x);
	}
	set y(y: number) {
		this._y = f4(y);
	}
	set z(z: number) {
		this._z = f4(z);
	}

	set nx(nx: number) {
		this._nx = f4(nx);
	}
	set ny(ny: number) {
		this._ny = f4(ny);
	}
	set nz(nz: number) {
		this._nz = f4(nz);
	}

	set tu(tu: number) {
		this._tu = f4(tu);
	}
	set tv(tv: number) {
		this._tv = f4(tv);
	}

	get x() {
		return this._x;
	}
	get y() {
		return this._y;
	}
	get z() {
		return this._z;
	}

	get nx() {
		return this._nx;
	}
	get ny() {
		return this._ny;
	}
	get nz() {
		return this._nz;
	}

	get tu() {
		return this._tu;
	}
	get tv() {
		return this._tv;
	}

	public _x: number = 0;
	public _y: number = 0;
	public _z: number = 0;

	public _nx: number = 0;
	public _ny: number = 0;
	public _nz: number = 0;

	public _tu: number = 0;
	public _tv: number = 0;

	public static get(buffer: Buffer, pos: number): Vertex3DNoTex2 {
		const offset = pos * Vertex3DNoTex2.size;
		const vertex = new Vertex3DNoTex2();
		vertex.x = f4(buffer.readFloatLE(offset));
		vertex.y = f4(buffer.readFloatLE(offset + 4));
		vertex.z = f4(buffer.readFloatLE(offset + 8));
		vertex.nx = f4(buffer.readFloatLE(offset + 12));
		vertex.ny = f4(buffer.readFloatLE(offset + 16));
		vertex.nz = f4(buffer.readFloatLE(offset + 20));
		vertex.tu = f4(buffer.readFloatLE(offset + 24));
		vertex.tv = f4(buffer.readFloatLE(offset + 28));
		return vertex;
	}

	public getVertex(): Vertex3D {
		return new Vertex3D(this._x, this._y, this._z);
	}

	public clone(): Vertex3DNoTex2 {
		const vertex = new Vertex3DNoTex2();
		vertex.x = this.x;
		vertex.y = this.y;
		vertex.z = this.z;
		vertex.nx = this.nx;
		vertex.ny = this.ny;
		vertex.nz = this.nz;
		vertex.tu = this.tu;
		vertex.tv = this.tv;
		return vertex;
	}

	public hasTextureCoordinates(): boolean {
		return this.tu !== undefined && this.tv !== undefined;
	}

	public static from(data: any): Vertex3DNoTex2 {
		return Object.assign(new Vertex3DNoTex2(), data);
	}

	public static fromArray(arr: number[]): Vertex3DNoTex2 {
		const vertex = new Vertex3DNoTex2();
		vertex.x = arr[0];
		vertex.y = arr[1];
		vertex.z = arr[2];
		vertex.nx = arr[3];
		vertex.ny = arr[4];
		vertex.nz = arr[5];
		vertex.tu = arr[6];
		vertex.tv = arr[7];
		return vertex;
	}
}
