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

import { BlockStatement, Comment, FunctionDeclaration, Identifier, Statement } from 'estree';
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
	const comments = [...result[6], ...result[11]];
	processReturnStmts(name, body);
	body.body.unshift(estree.variableDeclaration('let', [estree.variableDeclarator(name, estree.literal(null))], []));
	if (body.body[body.body.length - 1].type !== 'ReturnStatement') {
		body.body.push(estree.returnStatement(name));
	}
	return estree.functionDeclaration(name, params, body, comments);
}

function processReturnStmts(argument: Identifier, statement: Statement) {
	if (statement.type === 'ReturnStatement') {
		statement.argument = argument;
	} else if (statement.type === 'BlockStatement') {
		statement.body.forEach(innerStatement => {
			processReturnStmts(argument, innerStatement);
		});
	} else if (statement.type === 'IfStatement') {
		processReturnStmts(argument, statement.consequent);
		if (statement.alternate !== null) {
			processReturnStmts(argument, statement.alternate as Statement);
		}
	} else if (statement.type === 'SwitchStatement') {
		statement.cases.forEach(innerStatement => {
			innerStatement.consequent.forEach(consequent => {
				processReturnStmts(argument, consequent);
			});
		});
	} else if (
		statement.type === 'ForStatement' ||
		statement.type === 'ForOfStatement' ||
		statement.type === 'DoWhileStatement' ||
		statement.type === 'WhileStatement'
	) {
		processReturnStmts(argument, statement.body);
	}
}
