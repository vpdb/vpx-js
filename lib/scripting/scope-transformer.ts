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
import { Program } from 'estree';
import { Table } from '../vpt/table/table';

export class ScopeTransformer {

	private readonly table: Table;

	constructor(table: Table) {
		this.table = table;
	}

	public transform(ast: Program, mainFunctionName: string, elementObjectName: string): Program {
		// return replace(ast, {
		// 	enter: node => {
		// 		if (node.type === 'Program') {
		// 			return {
		// 				type: 'Program',
		// 				body: [
		// 					{
		// 						type: 'VariableDeclaration',
		// 						declarations: [
		// 							{
		// 								type: 'VariableDeclarator',
		// 								id: {
		// 									type: 'Identifier',
		// 									name: mainFunctionName,
		// 								},
		// 								init: {
		// 									type: 'FunctionExpression',
		// 									id: null,
		// 									generator: false,
		// 									params: [
		// 										{
		// 											type: 'Identifier',
		// 											name: elementObjectName,
		// 										},
		// 									],
		// 									body: {
		// 										type: 'BlockStatement',
		// 										body: node.body,
		// 									},
		// 								},
		// 							},
		// 						],
		// 						kind: 'const',
		// 					},
		// 				],
		// 				sourceType: 'module',
		// 			} as Program;
		// 		}
		// 	},
		// }) as Program;
		return replace(ast, {
			enter: node => {
				if (node.type === 'Program') {
					return {
						type: 'Program',
						body: [
							{
								type: 'FunctionDeclaration',
								id: {
									type: 'Identifier',
									name: mainFunctionName,
								},
								generator: false,
								params: [
									{
										type: 'Identifier',
										name: elementObjectName,
									},
								],
								body: {
									type: 'BlockStatement',
									body: node.body,
								},
							},
						],
						sourceType: 'module',
					} as Program;
				}
			},
		}) as Program;
	}

}
