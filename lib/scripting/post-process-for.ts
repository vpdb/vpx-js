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

import { BlockStatement, Expression, ForOfStatement, ForStatement, Identifier } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(
	result: [
		Token,
		null,
		Identifier,
		null,
		Token,
		null,
		Expression,
		null,
		Token,
		null,
		Expression,
		null,
		Token,
		null,
		Expression,
		null,
		BlockStatement,
		null,
		Token,
		null,
	],
): ForStatement {
	const identifier = result[2];
	const init = result[6];
	const test = result[10];
	const step = result[14];
	const body = result[16];
	return estree.forStatement(
		estree.assignmentExpression(identifier, '=', init),
		estree.conditionalExpression(
			estree.binaryExpression('<', step, estree.literal(0)),
			estree.binaryExpression('>=', identifier, test),
			estree.binaryExpression('<=', identifier, test),
		),
		estree.assignmentExpression(identifier, '+=', step),
		body,
	);
}

export function stmt2(
	result: [
		Token,
		null,
		Identifier,
		null,
		Token,
		null,
		Expression,
		null,
		Token,
		null,
		Expression,
		null,
		BlockStatement,
		null,
		Token,
		null,
	],
): ForStatement {
	const identifier = result[2];
	const init = result[6];
	const test = result[10];
	const body = result[12];
	return estree.forStatement(
		estree.assignmentExpression(identifier, '=', init),
		estree.binaryExpression('<=', identifier, test),
		estree.assignmentExpression(identifier, '+=', estree.literal(1)),
		body,
	);
}

export function stmt3(
	result: [Token, null, Token, null, Identifier, null, Token, null, Expression, null, BlockStatement, null, Token, null],
): ForOfStatement {
	const identifier = result[4];
	const expression = result[8];
	const body = result[10];
	return estree.forOfStatement(identifier, expression, body);
}
