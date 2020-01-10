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

import { Player } from '../../game/player';
import { f4 } from '../../math/float';
import { logger } from '../../util/logger';
import { getObject } from '../objects';
import { VbsApi } from '../vbs-api';
import { ERR } from './err';
import { VbsMath } from './math';

export class Stdlib extends VbsApi {

	private readonly math = new VbsMath();

	get Empty() { return undefined; }
	get Nothing() { return undefined; }
	get Null() { return null; }

	get Err() { return ERR; }
	get Math() { return this.math; }

	/**
	 * String Constants
	 */
	get vbCr() { return '\x0d'; }
	get vbCrLf() { return '\x0a\x0d'; }
	get vbFormFeed() { return '\x0c'; }
	get vbLf() { return '\x0a'; }
	get vbNewLine() { return '\n'; }
	get vbNullChar() { return '\x00'; }
	get vbNullString() { return null; }
	get vbTab() { return '\x09'; }
	get vbVerticalTab() { return '\x0b'; }

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

	public IsObject(v: any): boolean {
		return (typeof v === 'object');
	}

	public Randomize(): void {
		// Initializes the random-number generator in VBScript. Nothing to initialize here.
	}

	public GetRef(proc: string, scope: any): any {
		return scope[proc];
	}

	/**
	 * The InStrRev function returns the position of the first occurrence of one string within another. The search begins from the end of string, but the position returned counts from the beginning of the string.
	 *
	 * The InStrRev function can return the following values:
	 *   - If string1 is "" - InStrRev returns 0
	 *   - If string1 is Null - InStrRev returns Null
	 *   - If string2 is "" - InStrRev returns start
	 *   - If string2 is Null - InStrRev returns Null
	 *   - If string2 is not found - InStrRev returns 0
	 *   - If string2 is found within string1 - InStrRev returns the position at which match is found
	 *   - If start > Len(string1) - InStrRev returns 0
	 *
	 * @param string1 The string to be searched
	 * @param string2 The string expression to search for
	 * @param start Specifies the starting position for each search. The search begins at the last character position by default (-1)
	 * @see https://docs.microsoft.com/en-us/dotnet/api/microsoft.visualbasic.strings.instrrev?view=netframework-4.8
	 */
	public InStrRev(string1: string, string2: string, start: number = -1): any {
		if (string1 === '') {
			return 0;
		}
		if (string1 === null) {
			return null;
		}
		if (string2 === '') {
			return start;
		}
		if (string2 === null) {
			return null;
		}
		if (start > string1.length) {
			return 0;
		}
		return string1.indexOf(string2, start + 1) + 1;
	}

	/**
	 * The Left function returns a specified number of characters from the left side of a string.
	 *
	 * @param str The string to return characters from
	 * @param length Specifies how many characters to return. If set to 0, an empty string ("") is returned. If set to greater than or equal to the length of the string, the entire string is returned
	 */
	public Left(str: string, length: number): string {
		if (length > str.length) {
			return str;
		}
		return str.substr(0, length);
	}

	public CreateObject(name: string, player: Player): any {
		return getObject(name, player);
	}

	public MsgBox(msg: string): void {
		logger().warn(`[MsgBox] ${msg}`);
	}

	protected _getPropertyNames(): string[] {
		return Object.getOwnPropertyNames(Stdlib.prototype);
	}
}
