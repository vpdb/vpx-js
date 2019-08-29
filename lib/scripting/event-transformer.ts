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
import { ExpressionStatement, FunctionDeclaration, Program } from 'estree';
import { IScriptable } from '../game/iscriptable';
import { Table } from '../vpt/table/table';

/**
 * This wraps event callbacks into proper JavaScript event listeners.
 *
 * Example: `function Plunger_Init() {}` would become: `Plunger.on('Init', () => {})`.
 */
export class EventTransformer {

	private readonly table: Table;
	private readonly items: { [p: string]: IScriptable<any> };

	constructor(table: Table) {
		this.table = table;
		this.items = table.getElements();
	}

	public transform(ast: Program): Program {
		return replace(ast, {
			enter: (node, parent: any) => {
				if (node.type !== 'FunctionDeclaration') {
					return node;
				}
				const fct = (node as FunctionDeclaration);
				// must have an id (duh.)
				if (!fct.id) {
					return node;
				}

				// must have a _Event suffix
				const [objName, eventName] = fct.id.name.split('_');
				if (!eventName) {
					return node;
				}

				// table item must exist
				if (!this.items[objName]) {
					return node;
				}

				// table item must support given event
				if (!this.items[objName].getEventNames().includes(eventName)) {
					return node;
				}

				return {
					type: 'ExpressionStatement',
					expression: {
						type: 'CallExpression',
						callee: {
							type: 'MemberExpression',
							object: {
								type: 'Identifier',
								name: objName,
							},
							property: {
								type: 'Identifier',
								name: 'on',
							},
							computed: false,
						},
						arguments: [
							{
								type: 'Literal',
								value: eventName,
								raw: `'${eventName}'`,
							},
							{
								type: 'ArrowFunctionExpression',
								id: null,
								expression: false,
								generator: false,
								params: fct.params,
								body: fct.body,
							},
						],
					},
				};
			},
		}) as Program;
	}
}
