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

import { VbsUndefined } from './vbs-undefined';

/* tslint:disable:variable-name */
export class VbsObject<K extends string | number = string, V = any> implements ProxyHandler<VbsObject> {

	private readonly __names: { [key: string]: string | number | symbol } = {};

	constructor() {
		return new Proxy(this, this);
	}

	public get(target: any, name: string | number | symbol): V {
		const normName = typeof name === 'string' ? name.toLowerCase() : name.toString();
		let realName = name;
		if (!this.__names[normName]) {
			this.__names[normName] = realName;
		} else {
			realName = this.__names[normName];
		}
		return target[realName] || new VbsUndefined(
			new Error(`ReferenceError: Cannot set ${String(realName)} from undefined.`),
			new Error(`ReferenceError: Cannot get ${String(realName)} from undefined.`),
		);
	}

	public set(target: any, name: string | number | symbol, value: any, receiver: any): boolean {
		const normName = typeof name === 'string' ? name.toLowerCase() : name.toString();
		let realName = name;
		if (!this.__names[normName]) {
			this.__names[normName] = realName;
		} else {
			realName = this.__names[normName];
		}
		target[realName] = value;
		return true;
	}

	public ownKeys(target: any): PropertyKey[] {
		return Object.values(this.__names);
	}
}
