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
import { BinaryOperator, UnaryOperator } from 'estree';
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
	let estree = node.children[0].estree;
	let index = node.children[0].text.length;
	for (let loop = 1; loop < node.children.length; loop++) {
		const operator = node.text.charAt(index) as BinaryOperator;
		estree = binaryExpression(operator, estree, node.children[loop].estree);
		index += node.children[loop].text.length + 1;
	}
	return estree;
}

function ppIntegerDivisionExpression(node: ESIToken): any {
	let estree = node.children[0].estree;
	const mathFloorExpression = memberExpression(identifier('Math'), identifier('floor'));
	for (let loop = 1; loop < node.children.length; loop++) {
		estree = callExpression(mathFloorExpression, [
			binaryExpression(
				'/',
				callExpression(mathFloorExpression, [estree]),
				callExpression(mathFloorExpression, [node.children[loop].estree]),
			),
		]);
	}
	return estree;
}

export function ppModuloExpression(node: ESIToken): any {
	let estree = node.children[0].estree;
	for (let loop = 1; loop < node.children.length; loop++) {
		estree = binaryExpression('%', estree, node.children[loop].estree);
	}
	return estree;
}

export function ppExponentExpression(node: ESIToken): any {
	let estree = node.children[0].estree;
	for (let loop = 1; loop < node.children.length; loop++) {
		estree = callExpression(memberExpression(identifier('Math'), identifier('pow')), [
			estree,
			node.children[loop].estree,
		]);
	}
	return estree;
}

export function ppConcatExpression(node: ESIToken): any {
	let estree = node.children[0].estree;
	for (let loop = 1; loop < node.children.length; loop++) {
		estree = binaryExpression('+', estree, node.children[loop].estree);
	}
	return estree;
}

function ppLogicalExpression(node: ESIToken): any {
	let estree = node.children[0].estree;
	let index = node.children[0].text.length;
	for (let loop = 1; loop < node.children.length; loop++) {
		if (node.text.substr(index).startsWith(' And ')) {
			estree = logicalExpression('&&', estree, node.children[loop].estree);
			index += node.children[loop].text.length + 5;
		} else if (node.text.substr(index).startsWith(' Or ')) {
			estree = logicalExpression('||', estree, node.children[loop].estree);
			index += node.children[loop].text.length + 4;
		} else if (node.text.substr(index).startsWith(' Xor ')) {
			estree = logicalExpression(
				'||',
				logicalExpression('&&', estree, unaryExpression('!', node.children[loop].estree)),
				logicalExpression('&&', unaryExpression('!', estree), node.children[loop].estree),
			);
			index += node.children[loop].text.length + 5;
		} else if (node.text.substr(index).startsWith(' Eqv ')) {
			estree = unaryExpression('~', binaryExpression('^', estree, node.children[loop].estree));
			index += node.children[loop].text.length + 5;
		}
	}
	return estree;
}

function ppRelationalExpression(node: ESIToken): any {
	let estree = node.children[0].estree;
	let index = node.children[0].text.length;
	for (let loop = 1; loop < node.children.length; loop++) {
		if (node.text.substr(index).startsWith('<>')) {
			estree = binaryExpression('!=', estree, node.children[loop].estree);
			index += node.children[loop].text.length + 2;
		} else if (node.text.substr(index).startsWith('<=')) {
			estree = binaryExpression('<=', estree, node.children[loop].estree);
			index += node.children[loop].text.length + 2;
		} else if (node.text.substr(index).startsWith('>=')) {
			estree = binaryExpression('>=', estree, node.children[loop].estree);
			index += node.children[loop].text.length + 2;
		} else if (node.text.substr(index).startsWith('=')) {
			estree = binaryExpression('==', estree, node.children[loop].estree);
			index += node.children[loop].text.length + 1;
		} else {
			estree = binaryExpression(node.text.charAt(index) as BinaryOperator, estree, node.children[loop].estree);
			index += node.children[loop].text.length + 1;
		}
	}
	return estree;
}

function ppTypeExpression(node: ESIToken): any {
	let estree = node.children[0].estree;
	let index = node.children[0].text.length;
	for (let loop = 1; loop < node.children.length; loop++) {
		if (node.text.substr(index).startsWith(' Is ')) {
			estree = binaryExpression('==', estree, node.children[loop].estree);
			index += node.children[loop].text.length + 4;
		}
	}
	return estree;
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
		if (child.type === 'MemberAccessExpression' || child.type === 'SimpleNameExpression') {
			id = child.estree;
		} else if (child.type === 'OpenParenthesis') {
			args = [];
		} else if (child.type === 'ArgumentList') {
			args = child.estree;
		} else if (child.type === 'CloseParenthesis') {
			argLists.push(args);
		} else if (child.type === 'SubExpression') {
			expr = child.estree;
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
	let id: any = null;
	const argLists = [];
	let expr = null;
	for (const child of node.children) {
		if (child.type === 'MemberAccessExpression' || child.type === 'SimpleNameExpression') {
			id = child.estree;
		} else if (child.type === 'ArgumentList') {
			argLists.push(child.estree);
		} else if (child.type === 'EmptyArgument') {
			argLists.push([]);
		} else if (child.type === 'InvocationExpression') {
			expr = child.estree;
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
	 * As additional expressions are added, only wrap the first found
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

function ppNewExpression(node: ESIToken): any {
	return newExpression(node.children[0].estree, []);
}
