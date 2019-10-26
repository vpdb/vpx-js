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

import { BinaryOperator, Expression, UnaryExpression, UnaryOperator } from 'estree';
import { Token } from 'moo';
import * as estree from '../estree';

export function intDiv(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0] ? [result[0]] : [];
	const rightExpr = result[4] ? [result[4]] : [];
	const mathFloorExpression = estree.memberExpression(estree.identifier('Math'), estree.identifier('floor'));
	return estree.callExpression(mathFloorExpression, [
		estree.binaryExpression(
			'/',
			estree.callExpression(mathFloorExpression, leftExpr),
			estree.callExpression(mathFloorExpression, rightExpr),
		),
	]);
}

export function eqv(result: [Expression, null, Token, null, Expression]): UnaryExpression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.unaryExpression('~', estree.binaryExpression('^', leftExpr, rightExpr));
}

export function exp(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.callExpression(estree.memberExpression(estree.identifier('Math'), estree.identifier('pow')), [
		leftExpr,
		rightExpr,
	]);
}

export function xor(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.binaryExpression('^', leftExpr, rightExpr);
}

export function or(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.logicalExpression('||', leftExpr, rightExpr);
}

export function and(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.logicalExpression('&&', leftExpr, rightExpr);
}

export function not(result: [Token, null, Expression]): Expression {
	const expr = result[2];
	return estree.unaryExpression('!', expr);
}

export function add(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const operator = result[2].text as BinaryOperator;
	const rightExpr = result[4];
	return estree.binaryExpression(operator, leftExpr, rightExpr);
}

export function mod(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.binaryExpression('%', leftExpr, rightExpr);
}

export function mult(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const operator = result[2].text as BinaryOperator;
	const rightExpr = result[4];
	return estree.binaryExpression(operator, leftExpr, rightExpr);
}

export function unary(result: [Token, null, Expression]): Expression {
	const operator = result[0].text as UnaryOperator;
	const expr = result[2];
	return estree.unaryExpression(operator, expr);
}

export function concat(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const operator = result[2].text as BinaryOperator;
	const rightExpr = result[4];
	return estree.binaryExpression('+', leftExpr, rightExpr);
}

export function is(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.binaryExpression('==', leftExpr, rightExpr);
}

export function isNot(result: [Expression, null, Token, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[6];
	return estree.binaryExpression('!=', leftExpr, rightExpr);
}

export function gte(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.binaryExpression('>=', leftExpr, rightExpr);
}

export function lte(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.binaryExpression('<=', leftExpr, rightExpr);
}

export function gt(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.binaryExpression('>', leftExpr, rightExpr);
}

export function lt(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.binaryExpression('<', leftExpr, rightExpr);
}

export function gtlt(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.binaryExpression('!=', leftExpr, rightExpr);
}

export function eq(result: [Expression, null, Token, null, Expression]): Expression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.binaryExpression('==', leftExpr, rightExpr);
}
