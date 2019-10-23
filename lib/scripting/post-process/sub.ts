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

import { Comment, FunctionDeclaration, Identifier, Statement } from 'estree';
import { Token } from 'moo';
import * as estree from '../estree';

export function subDecl1(
	result: [
		Token[],
		Token,
		null,
		Identifier,
		null,
		Identifier[],
		Comment[],
		Statement[],
		Token,
		null,
		Token,
		Comment[],
	],
): FunctionDeclaration {
	const name = result[3];
	const params = result[5] || [];
	const leadingComments = result[6] || [];
	const stmts = result[7];
	const trailingComments = result[11] || [];
	return estree.functionDeclaration(name, params, estree.blockStatement(stmts), leadingComments, trailingComments);
}

export function subDecl2(
	result: [
		Token[],
		Token,
		null,
		Identifier,
		null,
		Identifier[],
		null,
		Statement,
		null,
		Token,
		null,
		Token,
		Comment[],
	],
): FunctionDeclaration {
	const name = result[3];
	const params = result[5] || [];
	const stmt = result[7];
	const trailingComments = result[12] || [];
	return estree.functionDeclaration(name, params, estree.blockStatement([stmt]), [], trailingComments);
}
