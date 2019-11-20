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

/* tslint:disable:variable-name no-bitwise */
import { VbsUndefined } from './vbs-undefined';

/**
 * An array that always returns something.
 *
 * It's iterable and typed, and if the value at a given index doesn't exist, it
 * returns {@link VbsUndefined}, which will only throw when error handling is
 * enabled.
 */
export class VbsArray<T> implements IterableIterator<T>, ProxyHandler<VbsArray<T>>, ArrayLike<T> {

	[key: number]: T;
	get length() { return this.__items.length; }

	private readonly __items: T[];
	private __pointer = 0;

	constructor(items?: T[]) {
		this.__items = items || [];
		return new Proxy<VbsArray<T>>(this.__items as any, this);
	}

	public [Symbol.iterator](): IterableIterator<T> {
		return this;
	}

	public next(...args: [] | [ undefined ]): IteratorYieldResult<T> | IteratorReturnResult<T | null> {
		if (this.__pointer < this.__items.length) {
			return {
				done: false,
				value: this.__items[this.__pointer++],
			};
		} else {
			return {
				done: true,
				value: null,
			};
		}
	}

	public get(target: any, key: any): T | VbsUndefined {
		if (typeof key === 'symbol') {
			console.log('Got a symbol: ', String(key));
		}
		return typeof key !== 'symbol' || target[key] ? target[key] : new VbsUndefined(
			new Error(`ReferenceError: Cannot set ${String(key)} from undefined.`),
			new Error(`ReferenceError: Cannot get ${String(key)} from undefined.`),
		);
	}

	// https://stackoverflow.com/questions/366031/implement-array-like-behavior-in-javascript-without-using-array
	public set(target: VbsArray<T>, property: any, value: any): boolean {
		if (property === 'length') {
			const newLen = value >>> 0;
			const numberLen = +value;
			if (newLen !== numberLen) {
				throw RangeError();
			}
			const oldLen = this.__items.length;
			if (newLen >= oldLen) {
				this.__items.length = newLen;
				return true;
			} else {
				// this case gets more complex, so it's left as an exercise to the reader
				return false; // should be changed when implemented!
			}
		} else if (isArrayIndex(property)) {
			const oldLenDesc = Object.getOwnPropertyDescriptor(target, 'length');
			const oldLen = oldLenDesc!.value;
			const index = property >>> 0;
			if (index > oldLen && !oldLenDesc!.writable) {
				return false;
			}
			target[property] = value;
			if (index > oldLen) {
				this.__items.length = index + 1;
			}
			return true;
		} else {
			target[property] = value;
			return true;
		}
	}

	public ownKeys(target: VbsArray<T>): PropertyKey[] {
		return [ 'length', ...Object.keys(target) ];
	}

	public defineProperty(target: VbsArray<T>, p: string | number | symbol, attributes: PropertyDescriptor): boolean {
		return Reflect.defineProperty(this.__items, p, attributes);
	}

	public deleteProperty(target: VbsArray<T>, p: string | number | symbol): boolean {
		return Reflect.deleteProperty(this.__items, p);
	}

	public enumerate(target: VbsArray<T>): PropertyKey[] {
		return Reflect.enumerate(this.__items) as unknown as PropertyKey[];
	}

	public getOwnPropertyDescriptor(target: VbsArray<T>, p: string | number | symbol): PropertyDescriptor | undefined {
		return Reflect.getOwnPropertyDescriptor(this.__items, p);
	}

	public has(target: VbsArray<T>, p: string | number | symbol): boolean {
		return Reflect.has(this.__items, p);
	}

	public isExtensible(target: VbsArray<T>): boolean {
		return Reflect.isExtensible(this.__items);
	}

	public preventExtensions(target: VbsArray<T>): boolean {
		return Reflect.preventExtensions(this.__items);
	}

	public setPrototypeOf(target: VbsArray<T>, v: any): boolean {
		return Reflect.setPrototypeOf(this.__items, v);
	}

}

function isArrayIndex(p: any) {
	if (typeof p === 'symbol') {
		return false;
	}
	/* an array index is a property such that
	   ToString(ToUint32(p)) === p and ToUint(p) !== 2^32 - 1 */
	const uint = p >>> 0;
	const s = uint + '';
	return  p === s && uint !== 0xffffffff;
}
