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
	switch (node.type) {
		case 'ConstantMemberDeclaration':
		case 'ConstantMemberDeclarationInline':
			return ppConstantMemberDeclaration(node);
		case 'ConstantDeclarators':
			return ppConstantDeclarators(node);
		case 'ConstantDeclarator':
			return ppConstantDeclarator(node);
	}
	return null;
}

function ppConstantMemberDeclaration(node: ESIToken): any {
	const constDecls =
		node.children[0].type === 'ConstantDeclarators' ? node.children[0].estree : node.children[1].estree;
	return variableDeclaration('const', constDecls);
}

function ppConstantDeclarators(node: ESIToken): any {
	const estree = [];
	for (const child of node.children) {
		if (child.type === 'ConstantDeclarator') {
			estree.push(child.estree);
		}
	}
	return estree;
}

function ppConstantDeclarator(node: ESIToken): any {
	const id = node.children[0].estree;
	const expr = node.children[2].estree;
	return variableDeclarator(id, expr);
}
