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
	AssignmentOperator, BaseNode,
	BinaryExpression,
	BinaryOperator,
	BlockStatement,
	BreakStatement,
	CallExpression,
	ClassBody,
	ClassDeclaration, ClassExpression,
	ConditionalExpression,
	DoWhileStatement,
	Expression,
	ExpressionStatement,
	ForOfStatement,
	ForStatement,
	FunctionDeclaration,
	FunctionExpression,
	Identifier,
	IfStatement,
	Literal,
	LogicalExpression,
	LogicalOperator,
	MemberExpression,
	MethodDefinition,
	NewExpression, ObjectExpression,
	Pattern,
	Program, Property,
	ReturnStatement,
	SpreadElement,
	Statement,
	Super,
	SwitchCase,
	SwitchStatement,
	ThisExpression,
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

export function identifier(name: string, node?: BaseNode): Identifier {
	return addScope({
		type: 'Identifier',
		name,
	}, node);
}

export function literal(value: string | boolean | number | null, raw?: string | undefined, node?: BaseNode): Literal {
	return addScope({
		type: 'Literal',
		value,
		raw,
	}, node);
}

export function classBody(body: MethodDefinition[]): ClassBody {
	return {
		type: 'ClassBody',
		body,
	};
}

export function variableDeclarator(id: Identifier, init: Expression | null): VariableDeclarator {
	return {
		type: 'VariableDeclarator',
		id,
		init,
	};
}

export function classDeclaration(id: Identifier, body: ClassBody): ClassDeclaration {
	return {
		type: 'ClassDeclaration',
		id,
		body,
	};
}

export function classExpression(body: ClassBody, node?: BaseNode): ClassExpression {
	return addScope({
		type: 'ClassExpression',
		body,
	}, node);
}

export function functionDeclaration(id: Identifier, params: Identifier[], body: BlockStatement): FunctionDeclaration {
	return {
		type: 'FunctionDeclaration',
		id,
		generator: false,
		params,
		body,
	};
}

export function variableDeclaration(
	kind: 'var' | 'let' | 'const',
	declarations: VariableDeclarator[],
): VariableDeclaration {
	return {
		type: 'VariableDeclaration',
		kind,
		declarations,
	};
}

export function methodDefinition(
	key: Expression,
	kind: 'constructor' | 'method' | 'get' | 'set',
	value: FunctionExpression,
): MethodDefinition {
	return {
		type: 'MethodDefinition',
		key,
		kind,
		value,
		static: false,
		computed: false,
	};
}

export function arrayExpression(elements: Expression[] | SpreadElement[]): ArrayExpression {
	return {
		type: 'ArrayExpression',
		elements,
	};
}

export function arrowFunctionExpression(
	expression: boolean,
	body: BlockStatement | Expression,
	params: Pattern[] = [],
): ArrowFunctionExpression {
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
	node?: BaseNode,
): AssignmentExpression {
	return addScope({
		type: 'AssignmentExpression',
		left,
		operator,
		right,
	}, node);
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

export function conditionalExpression(
	test: Expression,
	consequent: Expression,
	alternate: Expression,
): ConditionalExpression {
	return {
		type: 'ConditionalExpression',
		test,
		alternate,
		consequent,
	};
}

export function functionExpression(body: BlockStatement, params: Pattern[], node?: BaseNode): FunctionExpression {
	return addScope({
		type: 'FunctionExpression',
		body,
		params,
	}, node);
}

export function logicalExpression(operator: LogicalOperator, left: Expression, right: Expression): LogicalExpression {
	return {
		type: 'LogicalExpression',
		operator,
		left,
		right,
	};
}

export function memberExpression(object: Expression | Super, property: Expression, computed = false, node?: BaseNode): MemberExpression {
	return addScope({
		type: 'MemberExpression',
		object,
		property,
		computed,
	}, node);
}

export function objectExpression(properties: Property[]): ObjectExpression {
	return {
		type: 'ObjectExpression',
		properties,
	};
}

export function property(kind: 'init' | 'get' | 'set', key: Expression, value: Expression | Pattern): Property {
	return {
		type: 'Property',
		kind,
		key,
		value,
		method: false,
		shorthand: false,
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

export function thisExpression(): ThisExpression {
	return {
		type: 'ThisExpression',
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

export function doWhileStatement(body: Statement, test: Expression): DoWhileStatement {
	return {
		type: 'DoWhileStatement',
		body,
		test,
	};
}

export function expressionStatement(expression: Expression, node?: BaseNode): ExpressionStatement {
	return addScope({
		type: 'ExpressionStatement',
		expression,
	}, node);
}

export function forOfStatement(
	left: VariableDeclaration | Pattern,
	right: Expression,
	body: Statement,
): ForOfStatement {
	return {
		type: 'ForOfStatement',
		left,
		right,
		body,
	};
}

export function forStatement(
	init: Expression | null,
	test: Expression | null,
	update: Expression | null,
	body: Statement,
): ForStatement {
	return {
		type: 'ForStatement',
		init,
		test,
		update,
		body,
	};
}

export function ifStatement(test: Expression, consequent: Statement, alternate: Statement | null): IfStatement {
	return {
		type: 'IfStatement',
		test,
		consequent,
		alternate,
	};
}

export function returnStatement(argument: Expression | null): ReturnStatement {
	return {
		type: 'ReturnStatement',
		argument,
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

function addScope<T>(toNode: T, fromNode: any): T {
	if (fromNode && fromNode.__scope) {
		(toNode as any).__scope = fromNode.__scope;
	}
	return toNode;
}
