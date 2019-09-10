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

import { DoWhileStatement, Expression, Statement, WhileStatement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(
	result: [Token, null, Token, null, Expression, null, null, Statement[], null, Token, null, null],
): WhileStatement | DoWhileStatement {
	const type = result[2].type;
	const test = result[4];
	const statements = result[7] || [];
	if (type === 'kw_while') {
		return estree.whileStatement(test, estree.blockStatement(statements));
	} else {
		return estree.doWhileStatement(
			estree.blockStatement([estree.ifStatement(test, estree.blockStatement([estree.breakStatement()])), ...statements]),
			estree.literal(true),
		);
	}
}

export function stmt2(result: [Token, null, null, Statement[], null, Token, null, Token, null, Expression, null, null]) {
	const type = result[7].type;
	const statements = result[3] || [];
	const test = result[9];
	if (type === 'kw_while') {
		return estree.doWhileStatement(estree.blockStatement(statements), test);
	} else {
		return estree.doWhileStatement(
			estree.blockStatement([...statements, estree.ifStatement(test, estree.blockStatement([estree.breakStatement()]))]),
			estree.literal(true),
		);
	}
}

export function stmt3(result: [Token, null, null, Statement[], null, Token, null, null]): DoWhileStatement {
	const statements = result[3] || [];
	return estree.doWhileStatement(estree.blockStatement(statements), estree.literal(true));
}

export function stmt4(result: [Token, null, Expression, null, null, Statement[], null, Token, null, null]): WhileStatement {
	const test = result[2];
	const statements = result[5] || [];
	return estree.whileStatement(test, estree.blockStatement(statements));
}
