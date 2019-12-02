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

import { CallExpression, Expression, VariableDeclarator } from 'estree';
import {
	arrayExpression,
	assignmentExpression,
	callExpression,
	expressionStatement,
	identifier,
	literal,
	memberExpression,
	variableDeclaration,
	variableDeclarator,
} from '../estree';
import { ESIToken } from '../grammar/grammar';
import { Transformer } from '../transformer/transformer';

export function ppArray(node: ESIToken): any {
	let estree = null;
	if (node.type === 'RedimStatement') {
		estree = ppRedimStatement(node);
	} else if (node.type === 'RedimClauses') {
		estree = ppRedimClauses(node);
	} else if (node.type === 'RedimClause') {
		estree = ppRedimClause(node);
	} else if (node.type === 'EraseStatement') {
		estree = ppEraseStatement(node);
	} else if (node.type === 'EraseExpressions') {
		estree = ppEraseExpressions(node);
	}
	return estree;
}

function ppRedimStatement(node: ESIToken): any {
	const varDecls = node.children[0].estree as VariableDeclarator[];
	if (node.text.startsWith('ReDim Preserve ')) {
		for (const varDecl of varDecls) {
			(varDecl.init as CallExpression).arguments.push(literal(true));
		}
	}
	return variableDeclaration('let', varDecls);
}

function ppRedimClauses(node: ESIToken): any {
	const estree = [];
	for (const child of node.children) {
		if (child.type === 'RedimClause') {
			estree.push(child.estree);
		}
	}
	return estree;
}

function ppRedimClause(node: ESIToken): any {
	const id = node.children[0].estree;
	const args = node.children[1].estree;
	return variableDeclarator(
		id,
		callExpression(memberExpression(identifier(Transformer.VBSHELPER_NAME), identifier('redim')), [
			id,
			arrayExpression(args),
		]),
	);
}

function ppEraseStatement(node: ESIToken): any {
	const estree = [];
	const exprs = node.children[0].estree as Expression[];
	for (const expr of exprs) {
		estree.push(expressionStatement(expr));
	}
	return estree;
}

function ppEraseExpressions(node: ESIToken): any {
	const estree = [];
	for (const child of node.children) {
		if (child.type === 'Expression') {
			estree.push(
				assignmentExpression(
					child.estree,
					'=',
					callExpression(memberExpression(identifier(Transformer.VBSHELPER_NAME), identifier('erase')), [
						child.estree,
					]),
				),
			);
		}
	}
	return estree;
}
