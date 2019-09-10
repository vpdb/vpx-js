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
	Identifier,
	IfStatement,
	Literal,
	MemberExpression,
	Pattern,
	Program,
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

export function functionDeclaration(id: Identifier, params: Identifier[], statements: Statement[]): FunctionDeclaration {
	return {
		type: 'FunctionDeclaration',
		id,
		generator: false,
		params,
		body: blockStatement(statements),
	};
}

export function variableDeclaration(kind: 'var' | 'let' | 'const', declarations: VariableDeclarator[]): VariableDeclaration {
	return {
		type: 'VariableDeclaration',
		kind,
		declarations,
	};
}

export function arrowFunctionExpressionBlock(body: Statement[], params: Pattern[] = []): ArrowFunctionExpression {
	return arrowFunctionExpression(blockStatement(body), params);
}

export function arrowFunctionExpression(body: BlockStatement | Expression, params: Pattern[] = []): ArrowFunctionExpression {
	return {
		type: 'ArrowFunctionExpression',
		expression: false,
		params,
		body,
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

export function memberExpression(object: Expression | Super, property: Expression): MemberExpression {
	return {
		type: 'MemberExpression',
		object,
		property,
		computed: false,
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

export function assignmentExpressionStatement(
	left: Pattern | MemberExpression,
	operator: AssignmentOperator,
	right: Expression,
): ExpressionStatement {
	return {
		type: 'ExpressionStatement',
		expression: assignmentExpression(left, operator, right),
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

export function callExpressionStatement(callee: Expression, args: Expression[] | SpreadElement[]): ExpressionStatement {
	return {
		type: 'ExpressionStatement',
		expression: callExpression(callee, args),
	};
}

export function doWhileStatement(body: Statement, test: Expression): DoWhileStatement {
	return {
		type: 'DoWhileStatement',
		body,
		test,
	};
}

export function emptyStatement(leadingComments: Comment[] = [], trailingComments: Comment[] = []): EmptyStatement {
	return {
		type: 'EmptyStatement',
		leadingComments,
		trailingComments,
	};
}

export function forOfStatement(left: VariableDeclaration | Pattern, right: Expression, body: Statement): ForOfStatement {
	return {
		type: 'ForOfStatement',
		left,
		right,
		body,
	};
}

export function forStatement(init: Expression | null, test: Expression | null, update: Expression | null, body: Statement): ForStatement {
	return {
		type: 'ForStatement',
		init,
		test,
		update,
		body,
	};
}

export function ifStatement(test: Expression, consequent: Statement, alternate?: Statement | null): IfStatement {
	return {
		type: 'IfStatement',
		test,
		consequent,
		alternate,
	};
}

export function switchStatement(discriminant: Expression, cases: SwitchCase[]): SwitchStatement {
	return {
		type: 'SwitchStatement',
		discriminant,
		cases,
	};
}

export function switchCase(test: Expression | null, consequent: Statement[]): SwitchCase {
	return {
		type: 'SwitchCase',
		test,
		consequent,
	};
}

export function whileStatement(test: Expression, body: Statement): WhileStatement {
	return {
		type: 'WhileStatement',
		test,
		body,
	};
}
