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

export function stmt1(result: [Token, null, Token, null, VariableDeclarator[], Comment[]]): VariableDeclaration {
	const declarations = result[4];
	const comments = result[5];
	return estree.variableDeclaration('const', declarations, comments);
}

export function stmt2(result: [Token, null, VariableDeclarator[], Comment[]]): VariableDeclaration {
	const declarations = result[2];
	const comments = result[3];
	return estree.variableDeclaration('const', declarations, comments);
}

export function constVarList(result: [ConstVarListResult, ConstVarListResult[]]): VariableDeclarator[] {
	const firstVar = result[0];
	const otherVars = result[1] || [];
	return [firstVar, ...otherVars].map(declaration => {
		return estree.variableDeclarator(declaration[0], declaration[4]);
	});
}
type ConstVarListResult = [Identifier, null, Token, null, Expression];
