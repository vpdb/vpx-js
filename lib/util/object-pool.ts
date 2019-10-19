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

import { logger } from './logger';

export class Pool<T> {

	private static DEBUG = 0; // globally enable debug prints
	private static TRACE = false;
	private static MAX_POOL_SIZE = 100;

	private readonly pool: T[];
	private readonly poolable: IPoolable<T>;
	private warned = false;

	private debugging?: any;
	private recycled = 0;
	private created = 0;
	private released = 0;
	private skipped = 0;
	private claimed: { [key: string]: number } = {};
	private unclaimed: { [key: string]: number } = {};

	constructor(poolable: IPoolable<T>) {
		this.pool = [];
		this.poolable = poolable;
		/* istanbul ignore next: only needed for debugging */
		if (Pool.DEBUG > 0) {
			this.setupDebug(Pool.DEBUG);
		}
	}

	public get(): T {
		let caller = '';
		let obj: any;
		/* istanbul ignore next: only needed for debugging */
		if (this.debugging && Pool.TRACE) {
			caller = (new Error()).stack!.split('\n')[3].trim();
			if (!this.claimed[caller]) {
				this.claimed[caller] = 0;
			}
			this.claimed[caller]++;
		}

		if (this.pool.length) {                                      // something left in pool?
			this.recycled++;
			obj = this.pool.splice(0, 1)[0];

		} else {                                                     // if not, instantiate.
			if (this.pool.length < Pool.MAX_POOL_SIZE) {
				this.warned = false;
			}
			this.created++;
			obj = new this.poolable() as any;
		}

		/* istanbul ignore next: only set when debugging */
		if (caller) {                                                // update meta props
			obj.__caller = caller;
		} else if (obj._caller) {
			delete obj._caller;
		}
		obj.__pool = true;
		return obj;
	}

	public release(o: T): void {
		const obj = o as any;
		/* istanbul ignore next: only needed for debugging */
		if (obj.__caller) {
			const caller = obj.__caller;
			delete obj.__caller;
			if (!this.claimed[caller]) {
				if (!this.unclaimed[caller]) {
					this.unclaimed[caller] = 0;
				}
				this.unclaimed[caller]++;
			} else {
				this.claimed[caller]--;
				if (this.claimed[caller] === 0) {
					delete this.claimed[caller];
				}
			}
		}
		if (!obj.__pool) {
			this.skipped++;
			logger().warn('Trying to recycle non-claimed %s, aborting.', this.poolable.name);
			return;
		}
		/* istanbul ignore next: not supposed to happen! */
		if (this.pool.length >= Pool.MAX_POOL_SIZE) {
			if (!this.warned) {
				logger().warn('Pool size %s of %s is exhausted, future objects will be garbage-collected.', Pool.MAX_POOL_SIZE, this.poolable.name);
				this.warned = true;
			}
			this.skipped++;
			return;
		}
		if (this.poolable.reset) {
			this.poolable.reset(o);
		}
		this.released++;
		this.pool.push(o);
	}

	/* istanbul ignore next: only needed for debugging */
	public enableDebug(interval = 10000): this {
		if (Pool.DEBUG <= 0 && interval > 0 && !this.debugging) {
			logger().debug('[Pool] %s: Debug enabled.', this.poolable.name);
			this.setupDebug(interval);
		}
		return this;
	}

	/* istanbul ignore next: only needed for debugging */
	private setupDebug(interval: number) {
		this.debugging = setInterval(() => {
			logger().debug('[Pool] %s: %s recycled, %s created, %s released, %s skipped (%s%)',
				this.poolable.name, this.recycled, this.created, this.released, this.skipped,
				Math.floor(this.recycled / (this.recycled + this.created) * 100000) / 1000);

			if (Pool.TRACE) {
				for (const caller of Object.keys(this.claimed)) {
					logger().debug('[Pool] %s: Unreleased: %d %s', this.poolable.name, this.claimed[caller], caller);
				}
				for (const caller of Object.keys(this.unclaimed)) {
					logger().debug('[Pool] %s: Released without claimed: %d %s', this.poolable.name, this.unclaimed[caller], caller);
				}
			}

			this.recycled = 0;
			this.created = 0;
			this.released = 0;
			this.skipped = 0;
			this.claimed = {};
			this.unclaimed = {};
		}, interval);
	}
}

export interface IPoolable<T> {

	// constructor
	new(): T;

	// static
	reset?(obj: T): void;
}
