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

import { EmptyStatement, Expression, ExpressionStatement, Identifier } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(result: [Expression, null, Expression, null, Expression[]]): ExpressionStatement {
	const callee = result[0];
	const firstArg = result[2] ? [result[2]] : [];
	const otherArgs = result[4] || [];
	const args = [...firstArg, ...otherArgs];
	return estree.expressionStatement(estree.callExpression(callee, args));
}

export function stmt2(result: [Expression, null, Expression]): ExpressionStatement {
	const callee = result[0];
	const arg = result[2] ? [result[2]] : [];
	const args = [...arg];
	return estree.expressionStatement(estree.callExpression(callee, args));
}

export function stmt3(
	result: [Expression, null, Token, null, Expression, null, Token, null, Expression[]],
): ExpressionStatement {
	const callee = result[0];
	const firstArg = result[4];
	const otherArgs = result[8] || [];
	const args = [firstArg, ...otherArgs];
	return estree.expressionStatement(estree.callExpression(callee, args));
}

export function stmt4(result: [Expression, null, Token, null, Expression, null, Token]): ExpressionStatement {
	const callee = result[0];
	const arg = result[4];
	const args = [arg];
	return estree.expressionStatement(estree.callExpression(callee, args));
}

export function stmt5(result: [Expression, null, Token, null, Token]): ExpressionStatement {
	const callee = result[0];
	return estree.expressionStatement(estree.callExpression(callee, []));
}

export function stmt6(result: []): EmptyStatement {
	return estree.emptyStatement();
}

export function stmt7(result: []): EmptyStatement {
	return estree.emptyStatement();
}

export function stmt8(result: []): EmptyStatement {
	return estree.emptyStatement();
}

export function stmt9(result: [Expression, null, Expression[], Expression, null, Expression[]]): ExpressionStatement {
	const callee = result[0];
	const args = result[2];
	const expr = result[3];
	let callExpr = estree.callExpression(callee, args);
	if (expr.type === 'CallExpression') {
		if (expr.callee.type === 'MemberExpression') {
			if (expr.callee.object.type === 'CallExpression') {
				expr.callee.object.callee = estree.memberExpression(callExpr, expr.callee.object.callee as Identifier);
				callExpr = expr;
			}
		}
	}
	return estree.expressionStatement(callExpr);
}
