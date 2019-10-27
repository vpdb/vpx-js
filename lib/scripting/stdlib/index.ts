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

import { f4 } from '../../math/float';
import { VbsApi } from '../vbs-api';
import { VbsMath } from './math';

export class Stdlib extends VbsApi {

	private readonly math = new VbsMath();

	get Err() { return null; }

	get Math() { return this.math; }

	public Csng(n: number): number {
		return f4(n);
	}

	public Int(n: number): number {
		return Math.floor(n);
	}

	public Sqr(n: number): number {
		return Math.sqrt(n);
	}

	public UBound(a: []): number {
		return a.length;
	}

	protected _getPropertyNames(): string[] {
		return Object.getOwnPropertyNames(Stdlib.prototype);
	}
}
