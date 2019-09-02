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

export class Pool<T> {

	private readonly pool: T[];
	private readonly poolable: IPoolable<T>;

	constructor(poolable: IPoolable<T>) {
		this.pool = [];
		this.poolable = poolable;
	}

	public get(): T {
		if (this.pool.length) {
			return this.pool.splice(0, 1)[0];
		}
		return new this.poolable();
	}

	public release(obj: T): void {
		if (this.poolable.reset) {
			this.poolable.reset(obj);
		}
		this.pool.push(obj);
	}
}

export interface IPoolable<T> {

	// constructor
	new(): T;

	// static
	reset?(obj: T): void;
}
