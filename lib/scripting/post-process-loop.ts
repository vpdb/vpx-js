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
	const comments = [...result[5], ...result[8]];
	if (type === 'kw_while') {
		return estree.whileStatement(test, body, comments);
	} else {
		body.body.unshift(estree.ifStatement(test, estree.breakStatement(), null, []));
		return estree.doWhileStatement(body, estree.literal(true), comments);
	}
}

export function stmt2(result: [Token, Comment[], BlockStatement, Token, null, Token, null, Expression, Comment[]]) {
	const body = result[2];
	const type = result[5].type;
	const test = result[7];
	const comments = [...result[1], ...result[8]];
	if (type === 'kw_while') {
		return estree.doWhileStatement(body, test, comments);
	} else {
		body.body.push(estree.ifStatement(test, estree.breakStatement(), null, []));
		return estree.doWhileStatement(body, estree.literal(true), comments);
	}
}

export function stmt3(result: [Token, Comment[], BlockStatement, Token, Comment[]]): DoWhileStatement {
	const body = result[2];
	const comments = [...result[1], ...result[4]];
	return estree.doWhileStatement(body, estree.literal(true), comments);
}

export function stmt4(result: [Token, null, Expression, Comment[], BlockStatement, Token, Comment[]]): WhileStatement {
	const test = result[2];
	const body = result[4];
	const comments = [...result[3], ...result[6]];
	return estree.whileStatement(test, body, comments);
}
