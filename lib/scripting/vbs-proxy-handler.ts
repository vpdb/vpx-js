/* tslint:disable:variable-name */

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

	private readonly __names: { [key: string]: string | number | symbol } = {};
	private readonly __isEngineApi: boolean;

	/**
	 * Creates the handler. Pass in prototype and object instance if available.
	 *
	 * Object instance will index all currently set properties, while the
	 * prototype also includes method names.
	 *
	 * @param obj Object instance
	 * @param proto Prototype of object instance
	 * @param isEngineApi If set to true, this proxy is marked as a known API class, and function params won't be passed as an array.
	 */
	constructor(obj?: any, proto?: any, isEngineApi: boolean = false) {
		this.__isEngineApi = isEngineApi;
		if (proto) {
			for (const name of Object.getOwnPropertyNames(proto)) {
				this.__names[name.toLowerCase()] = name;
			}
		}
		if (obj) {
			for (const name of Object.getOwnPropertyNames(obj)) {
				if (!this.__names[name.toLowerCase()]) {
					this.__names[name.toLowerCase()] = name;
				}
			}
		}
	}

	public get(target: any, name: string | number | symbol, receiver: any): any {
		if (name === '__isEngineApi') {
			return this.__isEngineApi;
		}
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
