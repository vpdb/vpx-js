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

import { BlockStatement, Comment, DoWhileStatement, Expression, Statement, WhileStatement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(
	result: [Token, null, Token, null, Expression, Comment[], BlockStatement, Token, Comment[]],
): WhileStatement | DoWhileStatement {
	const type = result[2].type;
	const test = result[4];
	const body = result[6];
	const leadingComments = result[5];
	const trailingComments = result[8];
	if (type === 'kw_while') {
		return estree.whileStatement(test, body, leadingComments, trailingComments);
	} else {
		return estree.doWhileStatement(
			estree.blockStatement([estree.ifStatement(test, estree.breakStatement(), null), ...body.body]),
			estree.literal(true),
			leadingComments,
			trailingComments,
		);
	}
}

export function stmt2(result: [Token, Comment[], BlockStatement, Token, null, Token, null, Expression, Comment[]]) {
	const body = result[2];
	const type = result[5].type;
	const test = result[7];
	const leadingComments = result[1];
	const trailingComments = result[8];
	if (type === 'kw_while') {
		return estree.doWhileStatement(body, test, leadingComments, trailingComments);
	} else {
		return estree.doWhileStatement(
			estree.blockStatement([...body.body, estree.ifStatement(test, estree.breakStatement(), null)]),
			estree.literal(true),
			leadingComments,
			trailingComments,
		);
	}
}

export function stmt3(result: [Token, Comment[], BlockStatement, Token, Comment[]]): DoWhileStatement {
	const body = result[2];
	const leadingComments = result[1];
	const trailingComments = result[4];
	return estree.doWhileStatement(body, estree.literal(true), leadingComments, trailingComments);
}

export function stmt4(result: [Token, null, Expression, Comment[], BlockStatement, Token, Comment[]]): WhileStatement {
	const test = result[2];
	const body = result[4];
	const leadingComments = result[3];
	const trailingComments = result[6];
	return estree.whileStatement(test, body, leadingComments, trailingComments);
}
