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

import { Comment, Expression, Identifier, UnaryOperator, VariableDeclaration, VariableDeclarator } from 'estree';
import { Token } from 'moo';
import * as estree from '../estree';

export function constDecl(result: [Token, Token, null, VariableDeclarator[], Comment[]]): VariableDeclaration {
	const declarators = result[3];
	const comments = result[4] || [];
	return estree.variableDeclaration('const', declarators, comments);
}

export function constList1(
	result: [Identifier, null, Token, null, Expression, null, Token, null, VariableDeclarator[]],
): VariableDeclarator[] {
	const identifier = result[0];
	const expression = result[4];
	const otherVarDecl = result[8] || [];
	return [estree.variableDeclarator(identifier, expression), ...otherVarDecl];
}

export function constList2(result: [Identifier, null, Token, null, Expression]): VariableDeclarator[] {
	const identifier = result[0];
	const expression = result[4];
	return [estree.variableDeclarator(identifier, expression)];
}

export function constExprDef1(result: [Token, null, Expression, null, Token]): Expression {
	const expr = result[2];
	return expr;
}

export function constExprDef2(result: [Token, null, Expression]): Expression {
	const operator = result[0].text as UnaryOperator;
	const expr = result[2];
	return estree.unaryExpression(operator, expr);
}
