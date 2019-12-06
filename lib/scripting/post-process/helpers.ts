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

import { CallExpression, Expression, Statement } from 'estree';
import { blockStatement, callExpression, identifier, memberExpression } from '../estree';
import { ESIToken } from '../grammar/grammar';
import { Transformer } from '../transformer/transformer';

export function ppHelpers(node: ESIToken): any {
	let estree = null;
	if (node.type === 'Statements' || node.type === 'StatementsInline') {
		estree = ppStatements(node);
	} else if (node.type === 'Block') {
		estree = ppBlock(node);
	} else if (node.type === 'VariableIdentifiers') {
		estree = ppVariableIdentifiers(node);
	} else if (node.type === 'ArrayTypeModifiers') {
		estree = ppArrayTypeModifiers(node);
	} else if (node.type === 'ArraySizeInitializationModifier') {
		estree = ppArraySizeInitializationModifier(node);
	} else if (node.type === 'BoundList') {
		estree = ppBoundList(node);
	} else if (node.type === 'Identifier' || node.type === 'IdentifierOrKeyword') {
		estree = ppIdentifier(node);
	} else if (node.type === 'ArgumentList') {
		estree = ppArgumentList(node);
	}
	return estree;
}

function ppStatements(node: ESIToken): any {
	let stmts: Statement[] = [];
	for (const child of node.children) {
		if (!Array.isArray(child.estree)) {
			stmts.push(child.estree);
		} else {
			stmts = stmts.concat(...child.estree);
		}
	}
	return stmts;
}

function ppBlock(node: ESIToken): any {
	let stmts: Statement[] = [];
	for (const child of node.children) {
		if (!Array.isArray(child.estree)) {
			stmts.push(child.estree);
		} else {
			stmts = stmts.concat(...child.estree);
		}
	}
	return blockStatement(stmts);
}

function ppIdentifier(node: ESIToken): any {
	return identifier(node.text);
}

function ppVariableIdentifiers(node: ESIToken): any {
	const estree = [];
	for (const child of node.children) {
		if (child.type === 'VariableIdentifier') {
			estree.push(child.estree);
		}
	}
	return estree;
}

function ppArgumentList(node: ESIToken): any {
	const estree = [];
	if (node.children.length > 0) {
		let prevArgument: ESIToken | null = null;
		for (const child of node.children) {
			if (child.type === 'Expression') {
				estree.push(child.estree);
			} else if (child.type === 'ArgumentList') {
				estree.push(...child.estree);
			} else if (child.type === 'Comma') {
				if (prevArgument === null || prevArgument.type === 'Comma') {
					estree.push(identifier('undefined'));
				}
			}
			prevArgument = child;
		}
		if (node.children[node.children.length - 1].type === 'Comma') {
			estree.push(identifier('undefined'));
		}
	}
	return estree;
}

function ppArrayTypeModifiers(node: ESIToken): any {
	return [];
}

function ppArraySizeInitializationModifier(node: ESIToken): any {
	return node.children[1].estree;
}

function ppBoundList(node: ESIToken): any {
	const exprs: Expression[] = [];
	for (const expr of node.children) {
		if (expr.type === 'Bound') {
			exprs.push(expr.estree);
		}
	}
	return exprs;
}

export function getOrCall(callee: Expression, arg?: Expression): CallExpression {
	return callExpression(
		memberExpression(identifier(Transformer.VBSHELPER_NAME), identifier('getOrCall')),
		arg ? [callee, arg] : [callee],
	);
}
