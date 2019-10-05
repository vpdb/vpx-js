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

import { Comment, Expression, Identifier, MemberExpression, Program, Statement, Literal, CallExpression } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';
import { exp } from './post-process-expr';

export function nl1(result: [Token, Token, null]): Comment[] {
	const comment = result[0];
	return comment ? [estree.comment('Line', comment.text.substr(comment.text.indexOf("'") + 1))] : [];
}

export function nl2(result: [null, Token, null]): Comment[] {
	return [];
}

export function program(result: [null, Statement[]]): Program {
	let stmts = result[1] || [];
	stmts = stmts.filter(stmt => stmt) as [Statement];
	return estree.program(stmts);
}

export function blockStmt1(result: [Statement, Comment[]]): Statement {
	const stmt = result[0];
	const stmtComments = result[0].trailingComments || [];
	const comments = result[1];
	if (stmtComments.length === 0) {
		stmt.trailingComments = comments;
	}
	return stmt;
}

export function blockStmt2(result: [Comment[]]): Statement | null {
	const comments = result[0];
	return comments.length > 0 ? estree.emptyStatement(comments) : null;
}

export function blockStmtList(result: [Statement[]]) {
	let stmts = result[0] || [];
	stmts = stmts.filter(stmt => stmt) as [Statement];
	return estree.blockStatement(stmts);
}

export function methodStmtList(result: [Statement[]]) {
	let stmts = result[0] || [];
	stmts = stmts.filter(stmt => stmt) as [Statement];
	return estree.blockStatement(stmts);
}

export function exitStmt(result: [Token, null, Token]): Statement {
	const type = result[2].type;
	return type === 'kw_do' || type === 'kw_for' ? estree.breakStatement() : estree.returnStatement(null);
}

export function id(result: [Token]): Identifier {
	let name = result[0].text.trim();

	if (name.endsWith('.')) {
		name = name.slice(0, -1);
	}

	return estree.identifier(name);
}

export function exprList1(result: [Expression, null, Token, null, Expression[]]): Expression[] {
	const firstExpr = result[0];
	const otherExprs = result[4] || [];
	return [firstExpr, ...otherExprs];
}

export function exprList2(result: [Expression]): Expression[] {
	const expr = result[0];
	return [expr];
}

export function arrayRankList1(result: [Literal, null, Token, null, Literal[]]): Literal[] {
	const firstLiteral = result[0];
	const otherLiterals = result[4] || [];
	return [firstLiteral, ...otherLiterals];
}

export function arrayRankList2(result: [Literal]): Literal[] {
	const literal = result[0];
	return [literal];
}

export function argList1(result: [Identifier, null, Token, null, Identifier[]]): Identifier[] {
	const firstId = result[0];
	const otherIds = result[4] || [];
	return [firstId, ...otherIds];
}

export function argList2(result: [Identifier]): Identifier[] {
	const identifier = result[0];
	return [identifier];
}

export function arg1(result: [[], Identifier, null, Token, null, Token]): Identifier {
	const identifier = result[1];
	return identifier;
}

export function arg2(result: [[], Identifier]): Identifier {
	const identifier = result[1];
	return identifier;
}

export function qualifiedId1(result: [Expression, Expression]): Expression {
	const firstId = result[0];
	const secondId = result[1];

	if (secondId.type === 'MemberExpression') {
		return estree.memberExpression(
			estree.memberExpression(firstId, secondId.object as Expression),
			secondId.property,
		);
	} else {
		return estree.memberExpression(firstId, secondId);
	}
}

export function qualifiedId2(result: [Identifier | MemberExpression, Identifier | MemberExpression]): Expression {
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

export function qualifiedIdTail1(result: [Identifier, Identifier]): Expression {
	const firstId = result[0];
	const secondId = result[1];
	return estree.memberExpression(firstId, secondId);
}

export function methodArgList1(result: [Token, null, Identifier[], null, Token]): Identifier[] {
	const args = result[2] || [];
	return args;
}

export function methodArgList2(result: [Token, null, Token]): Identifier[] {
	return [];
}

export function commaExprList1(result: [Token, null, Expression, null, Expression[]]): Expression[] {
	const firstExpr = result[2];
	const otherExprs = result[4];
	return [firstExpr, ...otherExprs];
}

export function commaExprList2(result: [Token, null, Expression[]]): Expression[] {
	const exprs = result[2];
	return [estree.literal(null), ...exprs];
}

export function commaExprList3(result: [Token, null, Expression, null]): Expression[] {
	const expr = result[2];
	return [expr];
}

export function commaExprList4(result: [Token, null]): Expression[] {
	return [estree.literal(null)];
}

export function leftExpr1(result: [Identifier, null, Expression[], Token, Expression]) {
	const identifier = result[0];
	const indexOrParams = result[2];
	const expr = result[4];
	return estree.memberExpression(estree.callExpression(identifier, indexOrParams), expr);
}

export function leftExpr2(result: [Identifier, null, Expression[], Expression]): Expression {
	const identifier = result[0];
	const indexOrParamsDot = result[2];
	const expr = result[3];
	let callExpr = estree.callExpression(identifier, indexOrParamsDot);
	if (expr.type === 'CallExpression') {
		callExpr = estree.callExpression(
			estree.memberExpression(callExpr, expr.callee as Identifier),
			expr.arguments as Expression[],
		);
	}
	return callExpr;
}

export function leftExpr3(result: [Identifier, null, Expression[]]) {
	const identifier = result[0];
	const indexOrParams = result[2];
	return estree.callExpression(identifier, indexOrParams);
}

export function leftExprTail1(result: [Identifier, null, Expression[], Token, Expression]): Expression {
	const identifier = result[0];
	const indexOrParams = result[2];
	const expr = result[4];
	return estree.memberExpression(estree.callExpression(identifier, indexOrParams), expr);
}

export function leftExprTail2(result: [Identifier, null, Expression[], Expression]) {
	const identifier = result[0];
	const indexOrParams = result[2];
	const expr = result[3];
	let callExpr = estree.callExpression(identifier, indexOrParams);
	if (expr.type === 'CallExpression') {
		callExpr = estree.callExpression(
			estree.memberExpression(callExpr, expr.callee as Identifier),
			expr.arguments as Expression[],
		);
	}
	return callExpr;
}

export function leftExprTail3(result: [Identifier, null, Expression[]]) {
	const identifier = result[0];
	const indexOrParams = result[2];
	return estree.callExpression(identifier, indexOrParams);
}

export function indexOrParamsList1(result: [Expression, null, Token, null, Expression[]]): Expression[] {
	const firstExpr = result[0];
	const otherExprs = result[4];
	return [firstExpr, ...otherExprs];
}

export function indexOrParamsList2(result: [Expression[]]): Expression[] {
	const exprs = result[0];
	return exprs;
}

export function indexOrParamsListDot1(result: [Expression, null, Token, null, Expression[]]): Expression[] {
	const firstExpr = result[0];
	const otherExprs = result[4];
	return [firstExpr, ...otherExprs];
}

export function indexOrParamsListDot2(result: [Expression[]]): Expression[] {
	const expr = result[0];
	return expr;
}

export function indexOrParams1(result: [Token, null, Expression, null, Expression[], Token]) {
	const param = result[2];
	const otherParams = result[4];
	return [param, ...otherParams];
}

export function indexOrParams2(result: [Token, null, Expression[], Token]) {
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

export function indexOrParamsDot1(result: [Token, null, Expression, null, Expression[], Token]) {
	const param = result[2];
	const otherParams = result[4];
	return [param, ...otherParams];
}

export function indexOrParamsDot2(result: [Token, null, Expression[], Token]) {
	const otherParams = result[2];
	return [estree.literal(null), ...otherParams];
}

export function indexOrParamsDot3(result: [Token, null, Expression, null, Token]) {
	const param = result[2];
	return [param];
}

export function indexOrParamsDot4(result: [Token, null, Token]) {
	return [];
}
