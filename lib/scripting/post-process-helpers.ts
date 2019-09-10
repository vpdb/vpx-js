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

import { Expression, Identifier, MemberExpression, Program, Statement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function program(result: [null, Statement[]]): Program {
	let statements = result[1] || [];
	statements = statements.filter(statement => statement) as [Statement];
	return estree.program(statements);
}

export function blockStmtList(result: [Statement[]]) {
	let statements = result[0] || [];
	statements = statements.filter(statement => statement) as [Statement];
	return estree.blockStatement(statements);
}

export function methodStmtList(result: [Statement[]]) {
	const statements = result[0] || [];
	return estree.blockStatement(statements);
}

export function id(result: [Token]): Identifier {
	let name = result[0].text.trim();

	if (name.endsWith('.')) {
		name = name.slice(0, -1);
	}

	return estree.identifier(name);
}

export function qualifiedId(result: [Identifier | MemberExpression, Identifier | MemberExpression]): Expression {
	const firstId = result[0];
	const secondId = result[1];

	if (secondId.type === 'Identifier') {
		return estree.memberExpression(firstId, secondId);
	} else {
		const expr = secondId as MemberExpression;
		const object = expr.object as Expression;
		return estree.memberExpression(estree.memberExpression(firstId, object), expr.property);
	}
}

export function methodArgList1(result: [Token, null, Identifier, null, Identifier[], null, Token]): Identifier[] {
	const firstArg = result[2] ? [result[2]] : [];
	const otherArgs = result[4] || [];
	return [...firstArg, ...otherArgs];
}

export function methodArgList2(result: [Token, null, Token]): Identifier[] {
	return [];
}
