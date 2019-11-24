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

import { ERR, VbsError } from './stdlib/err';

export class VbsUndefined implements ProxyHandler<any> {

	// tslint:disable-next-line:variable-name
	private readonly __errSet: VbsError;
	// tslint:disable-next-line:variable-name
	private readonly __errGet: VbsError;

	constructor(errSet: VbsError, errGet: VbsError) {
		this.__errSet = errSet;
		this.__errGet = errGet;
		return new Proxy(this, this);
	}

	public get(target: any, p: string | number | symbol, receiver: any): any {
		ERR.Raise(this.__errGet);
		return this;
	}

	public set(target: any, p: string | number | symbol, value: any, receiver: any): boolean {
		ERR.Raise(this.__errSet);
		return true;
	}
}
