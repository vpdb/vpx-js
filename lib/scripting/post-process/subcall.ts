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

import { replace, VisitorOption } from 'estraverse';
import { CallExpression, Expression, ExpressionStatement } from 'estree';
import { Token } from 'moo';
import * as estree from '../estree';

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

export function stmt9(result: [Expression, null, Expression[], Expression, null, Expression[]]): ExpressionStatement {
	const callee = result[0];
	const args = result[2];
	const leftExprTail = { ...result[3] };
	const subSafeExpr = result[5];
	const callExpr = estree.callExpression(callee, args) as Expression;
	let stop = false;
	replace(leftExprTail, {
		enter: node => {
			if (stop) {
				return VisitorOption.Break;
			}
		},
		leave: node => {
			if (stop) {
				return VisitorOption.Break;
			}
			if (node.type === 'CallExpression') {
				stop = true;
				node = estree.callExpression(
					estree.memberExpression(callExpr, node.callee as Expression),
					node.arguments as Expression[],
				);
				return node;
			}
		},
	});
	return estree.expressionStatement(leftExprTail);
}
