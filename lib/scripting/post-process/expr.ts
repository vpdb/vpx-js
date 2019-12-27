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

import { replace } from 'estraverse';
import { BinaryOperator, Expression, Identifier, UnaryOperator } from 'estree';
import {
	binaryExpression,
	callExpression,
	identifier,
	logicalExpression,
	memberExpression,
	newExpression,
	unaryExpression,
} from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppExpr(node: ESIToken): any {
	if (node.children.length > 1) {
		switch (node.type) {
			case 'LogicalOperatorExpression':
				return ppLogicalExpression(node);
			case 'RelationalOperatorExpression':
				return ppRelationalExpression(node);
			case 'AdditionOperatorExpression':
				return ppBinaryExpression(node);
			case 'ModuloOperatorExpression':
				return ppModuloExpression(node);
			case 'MultiplicationOperatorExpression':
				return ppBinaryExpression(node);
			case 'IntegerDivisionOperatorExpression':
				return ppIntegerDivisionExpression(node);
			case 'ExponentOperatorExpression':
				return ppExponentExpression(node);
			case 'ConcatenationOperatorExpression':
				return ppConcatExpression(node);
			case 'TypeExpression':
				return ppTypeExpression(node);
			case 'SubExpression':
				return ppSubExpression(node);
		}
	}
	switch (node.type) {
		case 'InvocationExpression':
			return ppInvocationExpression(node);
		case 'InvocationMemberAccessExpression':
			return ppInvocationMemberAccessExpression(node);
		case 'LogicalNotOperatorExpression':
			return ppLogicalNotExpression(node);
		case 'UnaryExpression':
			return ppUnaryExpression(node);
		case 'ParenthesizedExpression':
			return ppParenthesizedExpression(node);
		case 'MemberAccessExpression':
			return ppMemberAccessExpression(node);
		case 'NewExpression':
			return ppNewExpression(node);
		case 'ExponentOperatorExpression':
			return ppExponentExpression(node);
		case 'ConcatenationOperatorExpression':
			return ppConcatExpression(node);
		case 'TypeExpression':
			return ppTypeExpression(node);
		case 'SubExpression':
			return ppSubExpression(node);
	}
	return null;
}

function ppBinaryExpression(node: ESIToken): any {
	let expr = node.children[0].estree;
	let index = node.children[0].text.length;
	for (const child of node.children.slice(1)) {
		const operator = node.text.charAt(index) as BinaryOperator;
		expr = binaryExpression(operator, expr, child.estree);
		index += child.text.length + 1;
	}
	return expr;
}

function ppIntegerDivisionExpression(node: ESIToken): any {
	let expr = node.children[0].estree;
	const mathFloorExpression = memberExpression(identifier('Math'), identifier('floor'));
	for (const child of node.children.slice(1)) {
		expr = callExpression(mathFloorExpression, [
			binaryExpression(
				'/',
				callExpression(mathFloorExpression, [expr]),
				callExpression(mathFloorExpression, [child.estree]),
			),
		]);
	}
	return expr;
}

export function ppModuloExpression(node: ESIToken): any {
	let expr = node.children[0].estree;
	for (const child of node.children.slice(1)) {
		expr = binaryExpression('%', expr, child.estree);
	}
	return expr;
}

export function ppExponentExpression(node: ESIToken): any {
	let expr = node.children[0].estree;
	for (const child of node.children.slice(1)) {
		expr = callExpression(memberExpression(identifier('Math'), identifier('pow')), [expr, child.estree]);
	}
	return expr;
}

export function ppConcatExpression(node: ESIToken): any {
	let expr = node.children[0].estree;
	for (const child of node.children.slice(1)) {
		expr = binaryExpression('+', expr, child.estree);
	}
	return expr;
}

function ppLogicalExpression(node: ESIToken): any {
	let expr = node.children[0].estree;
	let index = node.children[0].text.length;
	for (const child of node.children.slice(1)) {
		const text = node.text.substr(index);
		if (text.startsWith(' And ')) {
			expr = logicalExpression('&&', expr, child.estree);
			index += child.text.length + 5;
		} else if (text.startsWith(' Or ')) {
			expr = logicalExpression('||', expr, child.estree);
			index += child.text.length + 4;
		} else if (text.startsWith(' Xor ')) {
			expr = logicalExpression(
				'||',
				logicalExpression('&&', expr, unaryExpression('!', child.estree)),
				logicalExpression('&&', unaryExpression('!', expr), child.estree),
			);
			index += child.text.length + 5;
		} else if (text.startsWith(' Eqv ')) {
			expr = unaryExpression('~', binaryExpression('^', expr, child.estree));
			index += child.text.length + 5;
		}
	}
	return expr;
}

function ppRelationalExpression(node: ESIToken): any {
	let expr = node.children[0].estree;
	let index = node.children[0].text.length;
	for (const child of node.children.slice(1)) {
		const text = node.text.substr(index);
		if (text.startsWith('<>')) {
			expr = binaryExpression('!=', expr, child.estree);
			index += child.text.length + 2;
		} else if (text.startsWith('<=') || text.startsWith('=<')) {
			expr = binaryExpression('<=', expr, child.estree);
			index += child.text.length + 2;
		} else if (text.startsWith('>=') || text.startsWith('=>')) {
			expr = binaryExpression('>=', expr, child.estree);
			index += child.text.length + 2;
		} else if (text.startsWith('=')) {
			expr = binaryExpression('==', expr, child.estree);
			index += child.text.length + 1;
		} else if (text.startsWith('<')) {
			expr = binaryExpression('<', expr, child.estree);
			index += child.text.length + 1;
		} else if (text.startsWith('>')) {
			expr = binaryExpression('>', expr, child.estree);
			index += child.text.length + 1;
		}
	}
	return expr;
}

function ppTypeExpression(node: ESIToken): any {
	let expr = node.children[0].estree;
	let index = node.children[0].text.length;
	for (const child of node.children.slice(1)) {
		if (node.text.substr(index).startsWith(' Is ')) {
			expr = binaryExpression('==', expr, child.estree);
			index += child.text.length + 4;
		}
	}
	return expr;
}

function ppUnaryExpression(node: ESIToken): any {
	return unaryExpression(node.text.charAt(0) as UnaryOperator, node.children[0].estree);
}

function ppLogicalNotExpression(node: ESIToken): any {
	return unaryExpression('!', node.children[0].estree);
}

function ppParenthesizedExpression(node: ESIToken): any {
	return node.children[1].estree;
}

function ppMemberAccessExpression(node: ESIToken) {
	return identifier('.' + node.children[1].estree.name);
}

function ppSubExpression(node: ESIToken): any {
	let id: any = null;
	const argLists = [];
	let expr = null;
	let args;
	for (const child of node.children) {
		switch (child.type) {
			case 'MemberAccessExpression':
			case 'SimpleNameExpression':
				id = child.estree;
				break;
			case 'OpenParenthesis':
				args = [];
				break;
			case 'ArgumentList':
				args = child.estree;
				break;
			case 'CloseParenthesis':
				argLists.push(args);
				break;
			case 'SubExpression':
				expr = child.estree;
				break;
		}
	}
	let estree: any;
	if (argLists.length > 0) {
		for (const argList of argLists) {
			estree = callExpression(estree ? estree : id, argList);
		}
	} else {
		estree = id;
	}
	/**
	 * As additional subexpressions are added, only wrap the first found
	 * identifier in a memberExpression. Also, strip the dot from the
	 * identifier, so we don't get a..b .
	 */
	if (expr != null) {
		let found = false;
		estree = replace(expr, {
			enter: astNode => {
				if (!found) {
					if (astNode.type === 'Identifier') {
						found = true;
						return memberExpression(estree, identifier(astNode.name.substr(1)));
					}
				}
			},
		});
	}
	return estree;
}

function ppInvocationExpression(node: ESIToken): any {
	let expr: Expression | undefined;
	for (const child of node.children) {
		switch (child.type) {
			case 'SimpleNameExpression':
				expr = child.estree;
				break;
			case 'EmptyArgument':
				expr = callExpression(expr as Expression, []);
				break;
			case 'ArgumentList':
				expr = callExpression(expr as Expression, child.estree);
				break;
			case 'InvocationMemberAccessExpression':
				expr = expr ? ppPrepend(child.estree, expr) : child.estree;
				break;
		}
	}
	return ppReplaceDots(expr as Expression);
}

function ppInvocationMemberAccessExpression(node: ESIToken): any {
	let expr: Expression | undefined;
	let currentExpr: Expression | undefined;
	for (const child of node.children) {
		switch (child.type) {
			case 'MemberAccessExpression':
				if (currentExpr) {
					expr = ppAppend(expr, currentExpr);
				}
				currentExpr = child.estree;
				break;
			case 'EmptyArgument':
				currentExpr = callExpression(currentExpr as Expression, []);
				break;
			case 'ArgumentList':
				currentExpr = callExpression(currentExpr as Expression, child.estree);
				break;
		}
	}
	return ppAppend(expr, currentExpr as Expression);
}

function ppNewExpression(node: ESIToken): any {
	return newExpression(node.children[0].estree, []);
}

/**
 * Prepend an expression with an expression.
 * Example: `b(1,2)` prepended with `a` would become `a.b(1,2)`
 */
function ppPrepend(source: Expression, node: Expression): any {
	let found = false;
	return replace(source, {
		leave: astNode => {
			if (!found) {
				found = true;
				return memberExpression(node, astNode as Identifier);
			}
		},
	});
}

/**
 * Append an expression with an expression.
 * Example: `b(1,2)` appended with `c(3,4)` would become `b(1,2).c(3,4)`
 */
function ppAppend(source: Expression | undefined, node: Expression): any {
	if (source) {
		if (node.type === 'Identifier') {
			source = memberExpression(source, node);
		} else if (node.type === 'CallExpression') {
			source = callExpression(memberExpression(source, node.callee as Expression), node.arguments as [
				Expression,
			]);
		}
	} else {
		source = node;
	}
	return source;
}

/**
 * Remove any identifiers that begin with a period except for the first one.
 * If an invocation statement is inside a with statement, it can begin with
 * a period.
 */
function ppReplaceDots(source: Expression): any {
	let first = true;
	return replace(source, {
		enter: node => {
			if (node.type === 'Identifier') {
				if (!first) {
					if (node.name.startsWith('.')) {
						return identifier(node.name.substr(1));
					}
				} else {
					first = false;
				}
			}
		},
	});
}
