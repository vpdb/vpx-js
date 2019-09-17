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

import { BlockStatement, Comment, Expression, IfStatement, Statement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(
	result: [
		Token,
		null,
		Expression,
		null,
		Token,
		Comment[],
		BlockStatement,
		IfStatement[],
		Statement,
		Token,
		null,
		Token,
		Comment[],
	],
): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const elseIfStatements = result[7];
	const elseStatement = result[8] ? [result[8]] : [];
	const leadingComments = result[5];
	const trailingComments = result[12];
	const ifStatement = estree.ifStatement(test, consequent, null, leadingComments, trailingComments);
	let prevStatement: Statement = ifStatement;
	[...elseIfStatements, ...elseStatement].forEach(statement => {
		(prevStatement as IfStatement).alternate = statement;
		prevStatement = statement;
	});
	return ifStatement;
}

export function stmt2(
	result: [
		Token,
		null,
		Expression,
		null,
		Token,
		null,
		Statement,
		null,
		Token,
		null,
		Statement,
		null,
		Token,
		null,
		Token,
		Comment[],
	],
): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const alternate = result[10];
	const comments = result[15];
	return estree.ifStatement(test, consequent, alternate, [], comments);
}

export function stmt3(
	result: [Token, null, Expression, null, Token, null, Statement, null, Token, null, Statement, Comment[]],
): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const alternate = result[10];
	const comments = result[11];
	return estree.ifStatement(test, consequent, alternate, [], comments);
}

export function stmt4(
	result: [Token, null, Expression, null, Token, null, Statement, null, Token, null, Token, Comment[]],
): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const comments = result[11];
	return estree.ifStatement(test, consequent, null, [], comments);
}

export function stmt5(result: [Token, null, Expression, null, Token, null, Statement, Comment[]]): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const comments = result[7];
	return estree.ifStatement(test, consequent, null, [], comments);
}

export function elseIfStmt1(result: [Token, null, Expression, null, Token, Comment[], BlockStatement]): IfStatement {
	const expr = result[2];
	const comments = result[5];
	const consequent = result[6];
	return estree.ifStatement(expr, consequent, null, [], comments);
}

export function elseIfStmt2(result: [Token, null, Expression, null, Token, null, Statement, Comment[]]): IfStatement {
	const expr = result[2];
	const consequent = result[6];
	const comments = result[7];
	return estree.ifStatement(expr, consequent, null, [], comments);
}
export function elseStmt1(result: [Token, null, Statement, Comment[]]): Statement {
	const statement = result[2];
	const comments = result[3];
	statement.trailingComments = comments;
	return statement;
}

export function elseStmt2(result: [Token, Comment[], BlockStatement]): Statement {
	const comments = result[1];
	const statement = result[2];
	statement.trailingComments = comments;
	return statement;
}
