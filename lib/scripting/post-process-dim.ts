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

import { Comment, Expression, Identifier, VariableDeclaration, VariableDeclarator } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt(result: [Token, null, VariableDeclarator, VariableDeclarator[], Comment[]]): VariableDeclaration {
	const firstVar = result[2];
	const otherVars = result[3] || [];
	const declarators = [firstVar, ...otherVars];
	const comments = result[4];
	return estree.variableDeclaration('let', declarators, comments);
}

export function varName(result: [Identifier, null, Token, null, Expression[], null, Token]): VariableDeclarator {
	const name = result[0];
	const literals = result[4];
	let expression: Expression | null = null;
	literals.reverse().forEach(literal => {
		const callExpression = estree.callExpression(
			estree.memberExpression(
				estree.callExpression(estree.identifier('Array'), [
					estree.binaryExpression('+', literal, estree.literal(1)),
				]),
				estree.identifier('fill'),
			),
			[],
		);
		expression =
			expression == null
				? callExpression
				: estree.callExpression(estree.memberExpression(callExpression, estree.identifier('map')), [
						estree.arrowFunctionExpression(true, expression),
				  ]);
	});
	return estree.variableDeclarator(name, expression);
}
