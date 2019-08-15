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

import { Program, VariableDeclaration, VariableDeclarator } from 'estree';

/**
 * Returns the root node.
 * @param data List of `GlobalStmt` nodes
 */
export function program(data: any): Program {
	return {
		type: 'Program',
		sourceType: 'script',
		body: data,
	};
}

/**
 * Returns a variable declaration.
 * @param data Result of the `"Dim" __ VarName OtherVarsOpt:* NL` rule.
 */
export function varDecl(data: [string, null, string, string[]]): VariableDeclaration {
	return {
		type: 'VariableDeclaration',
		kind: 'let',
		declarations: [ data[2], ...data[3] ].map(variableDeclarator),
	};
}

export function variableDeclarator(name: string): VariableDeclarator {
	return {
		type: 'VariableDeclarator',
		id: { type: 'Identifier', name },
	};
}
