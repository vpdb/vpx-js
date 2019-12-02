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
import { BlockStatement, Identifier } from 'estree';
import {
	blockStatement,
	functionDeclaration,
	literal,
	returnStatement,
	variableDeclaration,
	variableDeclarator,
	identifier,
} from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppMethod(node: ESIToken): any {
	let estree = null;
	if (node.type === 'SubDeclaration' || node.type === 'SubDeclarationInline') {
		estree = ppSubDeclaration(node);
	} else if (node.type === 'FunctionDeclaration' || node.type === 'FunctionDeclarationInline') {
		estree = ppFunctionDeclaration(node);
	} else if (node.type === 'ParameterList') {
		estree = ppParameterList(node);
	}
	return estree;
}

function ppSubDeclaration(node: ESIToken): any {
	let id: Identifier | undefined;
	let params: Identifier[] = [];
	let block: BlockStatement | undefined;
	for (const child of node.children) {
		if (child.type === 'SubSignature') {
			id = child.estree;
			for (const subChild of child.children) {
				if (subChild.type === 'ParameterList') {
					params = subChild.estree;
					break;
				}
			}
		} else if (child.type === 'Block') {
			block = child.estree;
		} else if (child.type === 'StatementsInline') {
			block = blockStatement(child.estree);
		}
	}
	if (!id) {
		throw new Error('Missing Identifier');
	}
	return functionDeclaration(id, params, block ? block : blockStatement([]));
}

function ppFunctionDeclaration(node: ESIToken): any {
	let id: Identifier | undefined;
	let params: Identifier[] = [];
	let block: BlockStatement | undefined;
	for (const child of node.children) {
		if (child.type === 'FunctionSignature') {
			id = child.estree;
			for (const subChild of child.children) {
				if (subChild.type === 'ParameterList') {
					params = subChild.estree;
					break;
				}
			}
		} else if (child.type === 'Block') {
			block = child.estree;
		} else if (child.type === 'StatementsInline') {
			block = blockStatement(child.estree);
		}
	}
	if (!id) {
		throw new Error('Missing Identifier');
	}
	if (block) {
		block = replace(block, {
			enter: node2 => {
				if (node2.type === 'ReturnStatement') {
					node2.argument = id;
					return node2;
				}
			},
		}) as BlockStatement;
	} else {
		block = blockStatement([]);
	}
	block.body.unshift(variableDeclaration('let', [variableDeclarator(id, identifier('undefined'))]));
	if (block.body[block.body.length - 1].type !== 'ReturnStatement') {
		block.body.push(returnStatement(id));
	}
	return functionDeclaration(id, params, block);
}

function ppParameterList(node: ESIToken): any {
	const params: Identifier[] = [];
	for (const param of node.children) {
		if (param.type === 'Parameter') {
			if (param.children[0].type === 'ParameterModifier') {
				params.push(param.children[1].estree);
			} else {
				params.push(param.children[0].estree);
			}
		}
	}
	return params;
}
