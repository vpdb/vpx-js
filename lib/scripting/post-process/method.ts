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
} from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppMethod(node: ESIToken): any {
	let estree = null;
	if (node.type === 'SubDeclaration') {
		estree = ppSubDeclaration(node);
	} else if (node.type === 'SubDeclarationInline') {
		estree = ppSubDeclarationInline(node);
	} else if (node.type === 'FunctionDeclaration') {
		estree = ppFunctionDeclaration(node);
	} else if (node.type === 'FunctionDeclarationInline') {
		estree = ppFunctionDeclarationInline(node);
	} else if (node.type === 'ParameterList') {
		estree = ppParameterList(node);
	}
	return estree;
}

function ppSubDeclaration(node: ESIToken): any {
	let signature: ESIToken;
	let block: BlockStatement;
	if (node.children[0].type === 'AccessModifier') {
		signature = node.children[1];
		block = node.children[3].estree;
	} else {
		signature = node.children[0];
		block = node.children[2].estree;
	}
	const id = signature.children[0].estree;
	let params: Identifier[] = [];
	for (const child of signature.children) {
		if (child.type === 'ParameterList') {
			params = child.estree;
			break;
		}
	}
	return functionDeclaration(id, params, block);
}

function ppSubDeclarationInline(node: ESIToken): any {
	let signature: ESIToken;
	let block: BlockStatement;
	if (node.children[0].type === 'AccessModifier') {
		signature = node.children[1];
		block = blockStatement(node.children[2].estree);
	} else {
		signature = node.children[0];
		block = blockStatement(node.children[1].estree);
	}
	const id = signature.children[0].estree;
	let params: Identifier[] = [];
	for (const child of signature.children) {
		if (child.type === 'ParameterList') {
			params = child.estree;
			break;
		}
	}
	return functionDeclaration(id, params, block);
}

function ppFunctionDeclaration(node: ESIToken): any {
	let signature: ESIToken;
	let block: BlockStatement;
	if (node.children[0].type === 'AccessModifier') {
		signature = node.children[1];
		block = node.children[3].estree;
	} else {
		signature = node.children[0];
		block = node.children[2].estree;
	}
	const id = signature.children[0].estree;
	let params: Identifier[] = [];
	for (const child of signature.children) {
		if (child.type === 'ParameterList') {
			params = child.estree;
			break;
		}
	}
	replace(block, {
		enter: node2 => {
			if (node2.type === 'ReturnStatement') {
				node2.argument = id;
				return node2;
			}
		},
	});
	block.body.unshift(variableDeclaration('let', [variableDeclarator(id, literal(null))]));
	if (block.body[block.body.length - 1].type !== 'ReturnStatement') {
		block.body.push(returnStatement(id));
	}
	return functionDeclaration(id, params, block);
}

function ppFunctionDeclarationInline(node: ESIToken): any {
	let signature: ESIToken;
	let block: BlockStatement;
	if (node.children[0].type === 'AccessModifier') {
		signature = node.children[1];
		block = blockStatement(node.children[2].estree);
	} else {
		signature = node.children[0];
		block = blockStatement(node.children[1].estree);
	}
	const id = signature.children[0].estree;
	let params: Identifier[] = [];
	for (const child of signature.children) {
		if (child.type === 'ParameterList') {
			params = child.estree;
			break;
		}
	}
	replace(block, {
		enter: node2 => {
			if (node2.type === 'ReturnStatement') {
				node2.argument = id;
				return node2;
			}
		},
	});
	block.body.unshift(variableDeclaration('let', [variableDeclarator(id, literal(null))]));
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
