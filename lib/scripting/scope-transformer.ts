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

import { replace, traverse, VisitorOption } from 'estraverse';
import { Program } from 'estree';
import { Table } from '../vpt/table/table';

export class ScopeTransformer {

	private readonly table: Table;
	private items: { [p: string]: any };

	constructor(table: Table) {
		this.table = table;
		this.items = table.getElementApis();
	}

	public transform(ast: Program, mainFunctionName: string, elementObjectName: string): Program {
		traverse(ast, {
			enter: node => {
				if (node.type === 'Identifier' && this.items[node.name]) {
					node.type = 'MemberExpression';
					node.property = {
						type: 'Identifier',
						name: node.name,
					};
					node.name = elementObjectName;
					node.computed = false;
					return VisitorOption.Skip;
				}
			},
		});

		console.log(ast);
		return ast;

		//return this.wrap(ast, mainFunctionName, elementObjectName);
	}

	public wrap(ast: Program, mainFunctionName: string, elementObjectName: string): Program {
		return replace(ast, {
			enter: node => {
				if (node.type === 'Program') {
					return {
						type: 'Program',
						start: 0,
						end: 55,
						body: [
							{
								type: 'ExpressionStatement',
								expression: {
									type: 'AssignmentExpression',
									operator: '=',
									left: {
										type: 'MemberExpression',
										object: {
											type: 'Identifier',
											name: 'window',
										},
										property: {
											type: 'Identifier',
											name: mainFunctionName,
										},
										computed: false,
									},
									right: {
										type: 'ArrowFunctionExpression',
										expression: false,
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
