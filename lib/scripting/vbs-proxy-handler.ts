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

/**
 * A proxy handler that provides case-insensitive access to
 * properties and functions.
 */
export class VbsProxyHandler implements ProxyHandler<any> {

	// tslint:disable-next-line:variable-name
	private readonly __names: { [key: string]: string | number | symbol } = {};

	/**
	 * Creates the handler. Pass in prototype and object instance if available.
	 *
	 * Object instance will index all currently set properties, while the
	 * prototype also includes method names.
	 *
	 * @param obj Object instance
	 * @param proto Prototype of object instance
	 */
	constructor(obj?: any, proto?: any) {
		if (proto) {
			for (const name of Object.getOwnPropertyNames(proto)) {
				this.__names[name.toLowerCase()] = name;
			}
		}
		if (obj) {
			for (const name of Object.getOwnPropertyNames(obj)) {
				this.__names[name.toLowerCase()] = name;
			}
		}
	}

	public get(target: any, name: string | number | symbol, receiver: any): any {
		const normName = typeof name === 'string' ? name.toLowerCase() : name.toString();
		let realName = name;
		if (!this.__names[normName]) {
			this.__names[normName] = realName;
		} else {
			realName = this.__names[normName];
		}
		return target[realName];
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
}
