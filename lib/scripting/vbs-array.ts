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
import { VbsError } from './stdlib/err';
import { VbsUndefined } from './vbs-undefined';

/**
 * An array that always returns something.
 *
 * It's iterable and typed, and if the value at a given index doesn't exist, it
 * returns {@link VbsUndefined}, which will only throw when error handling is
 * enabled.
 */
export class VbsArray<T> implements ProxyHandler<VbsArray<T>> {

	[key: number]: T;

	constructor(items?: T[]) {
		return new Proxy<VbsArray<T>>(items || [] as any, this);
	}

	public get(target: any, key: any): T | VbsUndefined {
		return target[key] ? target[key] : new VbsUndefined(
			new VbsError(`ReferenceError: Cannot set ${String(key)} from undefined.`, 9),
			new VbsError(`ReferenceError: Cannot get ${String(key)} from undefined.`, 9),
		);
	}
}
