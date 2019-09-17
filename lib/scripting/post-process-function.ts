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

import { traverse } from 'estraverse';
import { BlockStatement, Comment, FunctionDeclaration, Identifier } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt(
	result: [
		Token[],
		Token,
		null,
		Identifier,
		null,
		Identifier[],
		Comment[],
		BlockStatement,
		Token,
		null,
		Token,
		Comment[],
	],
): FunctionDeclaration {
	const name = result[3];
	const params = result[5] || [];
	const body = result[7];
	const leadingComments = result[6];
	const trailingComments = result[11];
	traverse(body, {
		enter: node => {
			if (node.type === 'ReturnStatement') {
				node.argument = name;
			}
		},
	});
	body.body.unshift(estree.variableDeclaration('let', [estree.variableDeclarator(name, estree.literal(null))], []));
	if (body.body[body.body.length - 1].type !== 'ReturnStatement') {
		body.body.push(estree.returnStatement(name));
	}
	return estree.functionDeclaration(name, params, body, leadingComments, trailingComments);
}
