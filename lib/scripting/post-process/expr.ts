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
	let estree = null;
	if (node.children.length > 1) {
		if (node.type === 'LogicalOperatorExpression') {
			estree = ppLogicalExpression(node);
		} else if (node.type === 'RelationalOperatorExpression') {
			estree = ppRelationalExpression(node);
		} else if (node.type === 'AdditionOperatorExpression') {
			estree = ppBinaryExpression(node);
		} else if (node.type === 'ModuloOperatorExpression') {
			estree = ppModuloExpression(node);
		} else if (node.type === 'MultiplicationOperatorExpression') {
			estree = ppBinaryExpression(node);
		} else if (node.type === 'IntegerDivisionOperatorExpression') {
			estree = ppIntegerDivisionExpression(node);
		} else if (node.type === 'ExponentOperatorExpression') {
			estree = ppExponentExpression(node);
		} else if (node.type === 'ConcatenationOperatorExpression') {
			estree = ppConcatExpression(node);
		} else if (node.type === 'TypeExpression') {
			estree = ppTypeExpression(node);
		} else if (node.type === 'SubExpression') {
			estree = ppSubExpression(node);
		}
	}
	if (estree === null) {
		if (node.type === 'InvocationExpression') {
			estree = ppInvocationExpression(node);
		} else if (node.type === 'LogicalNotOperatorExpression') {
			estree = ppLogicalNotExpression(node);
		} else if (node.type === 'UnaryExpression') {
			estree = ppUnaryExpression(node);
		} else if (node.type === 'ParenthesizedExpression') {
			estree = ppParenthesizedExpression(node);
		} else if (node.type === 'MemberAccessExpression') {
			estree = ppMemberAccessExpression(node);
		} else if (node.type === 'NewExpression') {
			estree = ppNewExpression(node);
		}
	}
	return estree;
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
