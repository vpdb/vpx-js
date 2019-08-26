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

import {
	CallExpression,
	Comment,
	EmptyStatement,
	Expression,
	ExpressionStatement,
	Literal,
	Program,
	SpreadElement,
	Statement,
	UnaryExpression,
	UnaryOperator,
	VariableDeclaration,
	VariableDeclarator,
} from 'estree';

export function comment(type: 'Line' | 'Block', value: string): Comment {
	return {
		type,
		value,
	};
}

export function emptyStatement(leadingComments: Comment[] = [], trailingComments: Comment[] = []): EmptyStatement {
	return {
		type: 'EmptyStatement',
		leadingComments,
		trailingComments,
	};
}

export function literal(value: string | boolean | number | null): Literal {
	return {
		type: 'Literal',
		value,
	};
}

export function unaryExpression(operator: UnaryOperator, argument: Expression): UnaryExpression {
	return {
		type: 'UnaryExpression',
		operator,
		prefix: true,
		argument,
	};
}

export function program(data: Statement[]): Program {
	return {
		type: 'Program',
		sourceType: 'script',
		body: data,
	};
}

export function memberExpression(obj: string, property: string) {
	return {
		type: 'MemberExpression',
		object: {
			type: 'Identifier',
			name: obj,
		},
		property: {
			type: 'Identifier',
			name: property,
		},
		computed: false,
	};
}

export function variableDeclaration(kind: 'var' | 'let' | 'const', nameValues: Array<[ string, Expression | null ]>): VariableDeclaration {
	return {
		type: 'VariableDeclaration',
		kind,
		declarations: nameValues.map(nameValue => variableDeclarator(nameValue[0], nameValue[1])),
	};
}

export function variableDeclarator(name: string, init: Expression | null): VariableDeclarator {
	return {
		type: 'VariableDeclarator',
		id: { type: 'Identifier', name },
		init,
	};
}

export function callExpressionStatement(callee: Expression, args: Array<Expression | SpreadElement>): ExpressionStatement {
	return {
		type: 'ExpressionStatement',
		expression: callExpression(callee, args),
	};
}

export function callExpression(callee: Expression, args: Array<Expression | SpreadElement>): CallExpression {
	return {
		type: 'CallExpression',
		callee,
		arguments: args,
	};
}
