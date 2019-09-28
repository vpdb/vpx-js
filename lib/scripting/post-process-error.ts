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

import { EmptyStatement, Literal } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(result: [Token, null, Token, null, Token, null, Token]): EmptyStatement {
	const on = result[0].text;
	const error = result[2].text;
	const resume = result[4].text;
	const next = result[6].text;
	console.log('HERR@');
	return estree.emptyStatement([estree.comment('Line', ' ' + on + ' ' + error + ' ' + resume + ' ' + next)]);
}

export function stmt2(result: [Token, null, Token, null, Token, null, Literal]): EmptyStatement {
	const on = result[0].text;
	const error = result[2].text;
	const goto = result[4].text;
	const literal = result[6].value;
	return estree.emptyStatement([estree.comment('Line', ' ' + on + ' ' + error + ' ' + goto + ' ' + literal)]);
}
