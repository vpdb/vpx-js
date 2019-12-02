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

import { CallExpression, Expression } from 'estree';
import {
	arrayExpression,
	callExpression,
	identifier,
	memberExpression,
	variableDeclaration,
	variableDeclarator,
} from '../estree';
import { ESIToken } from '../grammar/grammar';
import { Transformer } from '../transformer/transformer';

export function ppVarDecl(node: ESIToken): any {
	let estree = null;
	if (node.type === 'VariableMemberDeclaration') {
		estree = ppVariableMemberDeclaration(node);
	} else if (node.type === 'VariableIdentifiers') {
		estree = ppVariableIdentifiers(node);
	} else if (node.type === 'VariableIdentifier') {
		estree = ppVariableIdentifier(node);
	}
	return estree;
}

function ppVariableMemberDeclaration(node: ESIToken): any {
	const varDecls = node.children[1].estree;
	return variableDeclaration('let', varDecls);
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

function ppVariableIdentifier(node: ESIToken): any {
	const id = node.children[0].estree;
	let expr: CallExpression | null = null;
	if (node.children.length > 1) {
		const args: Expression[] = node.children[1].estree;
		expr = callExpression(memberExpression(identifier(Transformer.VBSHELPER_NAME), identifier('dim')), [
			arrayExpression(args),
		]);
	}
	return variableDeclarator(id, expr);
}
