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

import { BlockStatement, Expression, IfStatement, Statement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

//IfStmt               -> %kw_if _ Expr _ %kw_then NL BlockStmtList ElseIfStmt:* ElseStmt:? %kw_end __ %kw_if NL                            {% ppIf.stmt1 %}

export function stmt1(
	result: [
		Token,
		null,
		Expression,
		null,
		Token,
		null,
		BlockStatement,
		IfStatement[],
		Statement,
		Token,
		null,
		Token,
		null,
	],
): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const elseIfStatements = result[7];
	const elseStatement = result[8] ? [result[8]] : [];
	const ifStatement = estree.ifStatement(test, consequent);
	let prevStatement: Statement = ifStatement;
	[...elseIfStatements, ...elseStatement].forEach(statement => {
		(prevStatement as IfStatement).alternate = statement;
		prevStatement = statement;
	});
	return ifStatement;
}

export function stmt2(
	result: [Token, null, Expression, null, Token, null, Statement, null, Token, null, Statement, null, Token, null, Token, null],
): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const alternate = result[10];
	return estree.ifStatement(test, consequent, alternate);
}

export function stmt3(
	result: [Token, null, Expression, null, Token, null, Statement, null, Token, null, Statement, null],
): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const alternate = result[10];
	return estree.ifStatement(test, consequent, alternate);
}

export function stmt4(result: [Token, null, Expression, null, Token, null, Statement, null, Token, null, Token, null]): IfStatement {
	const test = result[2];
	const consequent = result[6];
	return estree.ifStatement(test, consequent);
}

export function stmt5(result: [Token, null, Expression, null, Token, null, Statement, null]): IfStatement {
	const test = result[2];
	const consequent = result[6];
	return estree.ifStatement(test, consequent);
}

export function elseIfStmt1(result: [Token, null, Expression, null, Token, null, BlockStatement]): IfStatement {
	const expr = result[2];
	const consequent = result[6];
	return estree.ifStatement(expr, consequent);
}

export function elseIfStmt2(result: [Token, null, Expression, null, Token, null, Statement, null]): IfStatement {
	const expr = result[2];
	const consequent = result[6];
	return estree.ifStatement(expr, consequent);
}

export function elseStmt1(result: [Token, null, Statement, null]): Statement {
	const statement = result[2];
	return statement;
}

export function elseStmt2(result: [Token, null, BlockStatement]): Statement {
	const statement = result[2];
	return statement;
}
