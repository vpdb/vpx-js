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

import { BlockStatement, DoWhileStatement, Expression, WhileStatement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(
	result: [Token, null, Token, null, Expression, null, BlockStatement, null, Token, null],
): WhileStatement | DoWhileStatement {
	const type = result[2].type;
	const test = result[4];
	const body = result[6];
	if (type === 'kw_while') {
		return estree.whileStatement(test, body);
	} else {
		body.body.unshift(estree.ifStatement(test, estree.breakStatement()));
		return estree.doWhileStatement(body, estree.literal(true));
	}
}

export function stmt2(result: [Token, null, BlockStatement, null, Token, null, Token, null, Expression, null]) {
	const body = result[2];
	const type = result[6].type;
	const test = result[8];
	if (type === 'kw_while') {
		return estree.doWhileStatement(body, test);
	} else {
		body.body.push(estree.ifStatement(test, estree.breakStatement()));
		return estree.doWhileStatement(body, estree.literal(true));
	}
}

export function stmt3(result: [Token, null, BlockStatement, null, Token, null]): DoWhileStatement {
	const body = result[2];
	return estree.doWhileStatement(body, estree.literal(true));
}

export function stmt4(result: [Token, null, Expression, null, BlockStatement, null, Token, null]): WhileStatement {
	const test = result[2];
	const body = result[4];
	return estree.whileStatement(test, body);
}
