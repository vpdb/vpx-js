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

import { Comment, Expression, Identifier, MemberExpression, Program, Statement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function nl(result: [null, Token, Token, null]): Comment[] {
	const comment = result[1];
	return comment ? [estree.comment('Line', comment.text.substr(1))] : [];
}

export function program(result: [null, Statement[]]): Program {
	let statements = result[1] || [];
	statements = statements.filter(statement => statement) as [Statement];
	return estree.program(statements);
}

export function blockStmt1(result: [Statement, Comment[]]): Statement {
	const statement = result[0];
	const comments = result[1];
	statement.trailingComments = comments;
	return statement;
}

export function blockStmt2(result: [Comment[]]): Statement | null {
	const comments = result[0];
	return comments.length > 0 ? estree.emptyStatement(comments) : null;
}

export function blockStmtList(result: [Statement[]]) {
	let statements = result[0] || [];
	statements = statements.filter(statement => statement) as [Statement];
	return estree.blockStatement(statements);
}

export function methodStmtList(result: [Statement[]]) {
	let statements = result[0] || [];
	statements = statements.filter(statement => statement) as [Statement];
	return estree.blockStatement(statements);
}

export function id(result: [Token]): Identifier {
	let name = result[0].text.trim();

	if (name.endsWith('.')) {
		name = name.slice(0, -1);
	}

	return estree.identifier(name);
}

export function qualifiedId(result: [Identifier | MemberExpression, Identifier | MemberExpression]): Expression {
	const firstId = result[0];
	const secondId = result[1];

	if (secondId.type === 'Identifier') {
		return estree.memberExpression(firstId, secondId);
	} else {
		const expr = secondId as MemberExpression;
		const object = expr.object as Expression;
		return estree.memberExpression(estree.memberExpression(firstId, object), expr.property);
	}
}

export function methodArgList1(result: [Token, null, Identifier, null, Identifier[], null, Token]): Identifier[] {
	const firstArg = result[2] ? [result[2]] : [];
	const otherArgs = result[4] || [];
	return [...firstArg, ...otherArgs];
}

export function methodArgList2(result: [Token, null, Token]): Identifier[] {
	return [];
}

export function commaExprList1(result: [Token, null, Expression]) {
	const expr = result[2];
	return expr;
}

export function commaExprList2(result: [Token, null]) {
	return estree.literal(null);
}

export function leftExpr1(result: [Identifier, null, Expression[][]]) {
	const identifier = result[0];
	const params = result[2];
	const expressions = ([] as Expression[]).concat(...params);
	return estree.callExpression(identifier, expressions);
}

export function indexOrParams1(result: [Token, null, Expression, null, Expression[], null, Token]) {
	const param = result[2];
	const otherParams = result[4];
	return [param, ...otherParams];
}

export function indexOrParams2(result: [Token, null, Expression[], null, Token]) {
	const otherParams = result[2];
	return [estree.literal(null), ...otherParams];
}

export function indexOrParams3(result: [Token, null, Expression, null, Token]) {
	const param = result[2];
	return [param];
}

export function indexOrParams4(result: [Token, null, Token]) {
	return [];
}
