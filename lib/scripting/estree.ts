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
	ArrayExpression,
	ArrowFunctionExpression,
	AssignmentExpression,
	AssignmentOperator,
	BinaryExpression,
	BinaryOperator,
	BlockStatement,
	BreakStatement,
	CallExpression,
	Comment,
	ConditionalExpression,
	DoWhileStatement,
	EmptyStatement,
	Expression,
	ExpressionStatement,
	ForOfStatement,
	ForStatement,
	FunctionDeclaration,
	FunctionExpression,
	Identifier,
	IfStatement,
	Literal,
	MemberExpression,
	NewExpression,
	Pattern,
	Program,
	ReturnStatement,
	SpreadElement,
	Statement,
	Super,
	SwitchCase,
	SwitchStatement,
	UnaryExpression,
	UnaryOperator,
	VariableDeclaration,
	VariableDeclarator,
	WhileStatement,
} from 'estree';

export function program(data: Statement[]): Program {
	return {
		type: 'Program',
		sourceType: 'script',
		body: data,
	};
}

export function comment(type: 'Line' | 'Block', value: string): Comment {
	return {
		type,
		value,
	};
}

export function identifier(name: string): Identifier {
	return {
		type: 'Identifier',
		name,
	};
}

export function literal(value: string | boolean | number | null, raw?: string | undefined): Literal {
	return {
		type: 'Literal',
		value,
		raw,
	};
}

export function variableDeclarator(id: Identifier, init: Expression | null): VariableDeclarator {
	return {
		type: 'VariableDeclarator',
		id,
		init,
	};
}

export function functionDeclaration(id: Identifier, params: Identifier[], body: BlockStatement, leadingComments: Comment[], trailingComments: Comment[]): FunctionDeclaration {
	return {
		type: 'FunctionDeclaration',
		id,
		generator: false,
		params,
		body,
		leadingComments,
		trailingComments,
	};
}

export function variableDeclaration(kind: 'var' | 'let' | 'const', declarations: VariableDeclarator[], trailingComments: Comment[]): VariableDeclaration {
	return {
		type: 'VariableDeclaration',
		kind,
		declarations,
		trailingComments,
	};
}

export function arrayExpression(elements: Expression[] | SpreadElement[]): ArrayExpression {
	return {
		type: 'ArrayExpression',
		elements,
	};
}

export function arrowFunctionExpression(expression: boolean, body: BlockStatement | Expression, params: Pattern[] = []): ArrowFunctionExpression {
	return {
		type: 'ArrowFunctionExpression',
		expression,
		body,
		params,
	};
}

export function assignmentExpression(
	left: Pattern | MemberExpression,
	operator: AssignmentOperator,
	right: Expression,
): AssignmentExpression {
	return {
		type: 'AssignmentExpression',
		left,
		operator,
		right,
	};
}

export function binaryExpression(operator: BinaryOperator, left: Expression, right: Expression): BinaryExpression {
	return {
		type: 'BinaryExpression',
		operator,
		left,
		right,
	};
}

export function callExpression(callee: Expression, args: Expression[] | SpreadElement[]): CallExpression {
	return {
		type: 'CallExpression',
		callee,
		arguments: args,
	};
}

export function conditionalExpression(test: Expression, consequent: Expression, alternate: Expression): ConditionalExpression {
	return {
		type: 'ConditionalExpression',
		test,
		alternate,
		consequent,
	};
}

export function functionExpression(body: BlockStatement, params: Pattern[]): FunctionExpression {
	return {
		type: 'FunctionExpression',
		body,
		params,
	};
}

export function memberExpression(object: Expression | Super, property: Expression): MemberExpression {
	return {
		type: 'MemberExpression',
		object,
		property,
		computed: false,
	};
}

export function newExpression(callee: Expression | Super, args: Expression[] | SpreadElement[]): NewExpression {
	return {
		type: 'NewExpression',
		callee,
		arguments: args,
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

export function blockStatement(body: Statement[]): BlockStatement {
	return {
		type: 'BlockStatement',
		body,
	};
}

export function breakStatement(): BreakStatement {
	return {
		type: 'BreakStatement',
	};
}

export function doWhileStatement(body: Statement, test: Expression, leadingComments: Comment[], trailingComments: Comment[]): DoWhileStatement {
	return {
		type: 'DoWhileStatement',
		body,
		test,
		leadingComments,
		trailingComments,
	};
}

export function emptyStatement(trailingComments: Comment[] = []): EmptyStatement {
	return {
		type: 'EmptyStatement',
		trailingComments,
	};
}

export function expressionStatement(expression: Expression, leadingComments: Comment[] = [], trailingComments: Comment[] = []): ExpressionStatement {
	return {
		type: 'ExpressionStatement',
		expression,
		leadingComments,
		trailingComments,
	};
}

export function forOfStatement(left: VariableDeclaration | Pattern, right: Expression, body: Statement, leadingComments: Comment[] = [], trailingComments: Comment[] = []): ForOfStatement {
	return {
		type: 'ForOfStatement',
		left,
		right,
		body,
		leadingComments,
		trailingComments,
	};
}

export function forStatement(init: Expression | null, test: Expression | null, update: Expression | null, body: Statement, leadingComments: Comment[] = [], trailingComments: Comment[] = []): ForStatement {
	return {
		type: 'ForStatement',
		init,
		test,
		update,
		body,
		leadingComments,
		trailingComments,
	};
}

export function ifStatement(test: Expression, consequent: Statement, alternate: Statement | null, leadingComments: Comment[] = [], trailingComments: Comment[] = []): IfStatement {
	return {
		type: 'IfStatement',
		test,
		consequent,
		alternate,
		leadingComments,
		trailingComments,
	};
}

export function returnStatement(argument: Expression | null): ReturnStatement {
	return {
		type: 'ReturnStatement',
		argument,
	};
}

export function switchStatement(discriminant: Expression, cases: SwitchCase[], leadingComments: Comment[] = [], trailingComments: Comment[] = []): SwitchStatement {
	return {
		type: 'SwitchStatement',
		discriminant,
		cases,
		leadingComments,
		trailingComments,
	};
}

export function switchCase(test: Expression | null, consequent: Statement[], leadingComments: Comment[] = [], trailingComments: Comment[] = []): SwitchCase {
	return {
		type: 'SwitchCase',
		test,
		consequent,
		leadingComments,
		trailingComments,
	};
}

export function whileStatement(test: Expression, body: Statement, leadingComments: Comment[] = [], trailingComments: Comment[] = []): WhileStatement {
	return {
		type: 'WhileStatement',
		test,
		body,
		leadingComments,
		trailingComments,
	};
}
