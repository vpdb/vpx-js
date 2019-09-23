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

import { ArrayExpression, Comment, Expression, Identifier, VariableDeclaration, VariableDeclarator } from 'estree';
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
	const elements = result[4] || [];
	return estree.variableDeclarator(
		name,
		elements.length > 0
			? estree.callExpression(estree.memberExpression(estree.identifier('vbsHelper'), estree.identifier('dim')), [
					estree.arrayExpression(elements),
			  ])
			: null,
	);
}
