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
import { logger } from '../../util/logger';
import { getObject } from '../objects';
import { VbsApi } from '../vbs-api';
import { Err } from './err';
import { VbsMath } from './math';

export class Stdlib extends VbsApi {

	private readonly math = new VbsMath();
	private readonly err = new Err();

	get Err() { return this.err; }
	get Math() { return this.math; }

	/**
	 * Converts to Single Data Type:
	 *
	 * -3.402823E+38 through -1.401298E-45 for negative values;
	 * 1.401298E-45 through 3.402823E+38 for positive values.
	 *
	 * @param n Number to convert
	 * @see https://docs.microsoft.com/en-us/dotnet/visual-basic/language-reference/functions/type-conversion-functions
	 */
	public Csng(n: number): number {
		return f4(n);
	}

	public Int(n: number): number {
		return Math.floor(n);
	}

	public Sqr(n: number): number {
		return Math.sqrt(n);
	}

	public UBound(a: [], dimension?: number): number { // TODO handle dimension
		return a.length - 1;
	}

	public IsArray(obj: any): boolean {
		return Array.isArray(obj);
	}

	public IsEmpty(v: any): boolean {
		return (typeof v === 'undefined') || v === null;
	}

	public Randomize(): void {
		// Initializes the random-number generator in VBScript. Nothing to initialize here.
	}

	public CreateObject(name: string): any {
		return getObject(name);
	}

	public MsgBox(msg: string): void {
		logger().warn(`[MsgBox] ${msg}`);
	}

	protected _getPropertyNames(): string[] {
		return Object.getOwnPropertyNames(Stdlib.prototype);
	}
}
