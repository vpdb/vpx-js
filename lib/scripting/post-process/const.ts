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

import { variableDeclaration, variableDeclarator } from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppConst(node: ESIToken): any {
	let estree = null;
	if (node.type === 'ConstDeclarationStatement' || node.type === 'ConstDeclarationStatementInline') {
		estree = ppConstDeclarationStatement(node);
	} else if (node.type === 'ConstVariableDeclarators') {
		estree = ppConstVariableDeclarators(node);
	} else if (node.type === 'ConstVariableDeclarator') {
		estree = ppConstVariableDeclarator(node);
	}
	return estree;
}

function ppConstDeclarationStatement(node: ESIToken): any {
	const varDecls =
		node.children[0].type === 'ConstVariableDeclarators' ? node.children[0].estree : node.children[1].estree;
	return variableDeclaration('const', varDecls);
}

function ppConstVariableDeclarators(node: ESIToken): any {
	const estree = [];
	for (const child of node.children) {
		if (child.type === 'ConstVariableDeclarator') {
			estree.push(child.estree);
		}
	}
	return estree;
}

function ppConstVariableDeclarator(node: ESIToken): any {
	const id = node.children[0].estree;
	const literal = node.children[2].estree;
	return variableDeclarator(id, literal);
}
