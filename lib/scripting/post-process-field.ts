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

import { Comment, Identifier, Literal, VariableDeclaration, VariableDeclarator } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function fieldDecl1(
	result: [Token, null, VariableDeclarator, null, VariableDeclarator[], Comment[]],
): VariableDeclaration {
	const firstVar = result[2];
	const otherVars = result[4] || [];
	const declarators = [firstVar, ...otherVars];
	const comments = result[5] || [];
	return estree.variableDeclaration('let', declarators, comments);
}

export function fieldDecl2(
	result: [Token, null, VariableDeclarator, null, VariableDeclarator[], Comment[]],
): VariableDeclaration {
	const firstVar = result[2];
	const otherVars = result[4] || [];
	const declarators = [firstVar, ...otherVars];
	const comments = result[5] || [];
	return estree.variableDeclaration('let', declarators, comments);
}

export function fieldName(result: [Identifier, null, Token, null, Literal[], null, Token]): VariableDeclarator {
	const name = result[0];
	const literals = result[4] || [];
	return estree.variableDeclarator(
		name,
		estree.callExpression(estree.memberExpression(estree.identifier('vbsHelper'), estree.identifier('dim')), [
			estree.arrayExpression(literals),
		]),
	);
}
