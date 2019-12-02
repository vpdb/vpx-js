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

import { CallExpression, VariableDeclarator } from 'estree';
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

export function ppDim(node: ESIToken): any {
	let estree = null;
	if (node.type === 'DimDeclarationStatement' || node.type === 'DimDeclarationStatementInline') {
		estree = ppDimDeclarationStatement(node);
	} else if (node.type === 'DimVariableDeclarators') {
		estree = ppDimVariableDeclarators(node);
	} else if (node.type === 'DimVariableDeclarator') {
		estree = ppDimVariableDeclarator(node);
	}
	return estree;
}

function ppDimDeclarationStatement(node: ESIToken): any {
	const varDecls =
		node.children[0].type === 'DimVariableDeclarators' ? node.children[0].estree : node.children[1].estree;
	return variableDeclaration('let', varDecls);
}

function ppDimVariableDeclarators(node: ESIToken): any {
	const estree = [];
	for (const child of node.children) {
		if (child.type === 'DimVariableDeclarator') {
			estree.push(child.estree);
		}
	}
	return estree;
}

function ppDimVariableDeclarator(node: ESIToken): any {
	const id = node.children[0].estree;
	let expr: CallExpression | null = null;
	if (node.children.length > 1) {
		const args = [];
		for (const child of node.children) {
			if (child.type === 'IntegerLiteral') {
				args.push(child.estree);
			}
		}
		expr = callExpression(memberExpression(identifier(Transformer.VBSHELPER_NAME), identifier('dim')), [
			arrayExpression(args),
		]);
	}
	return variableDeclarator(id, expr);
}
