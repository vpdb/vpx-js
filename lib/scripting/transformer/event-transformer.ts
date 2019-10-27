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
import { FunctionDeclaration, Program } from 'estree';
import { IScriptable } from '../../game/iscriptable';
import { Table } from '../../vpt/table/table';
import {
	arrowFunctionExpression,
	callExpression,
	expressionStatement,
	identifier,
	literal,
	memberExpression,
} from '../estree';
import { Transformer } from './transformer';

/**
 * This transforms event subs into proper JavaScript event listeners.
 *
 * Example: `function Plunger_Init() {}` would become: `Plunger.on('Init', () => {})`.
 */
export class EventTransformer extends Transformer {

	private readonly items: { [p: string]: IScriptable<any> };

	constructor(ast: Program, items: { [p: string]: IScriptable<any> }) {
		super(ast);
		this.items = items;
	}

	public transform(): Program {
		return replace(this.ast, {
			enter: (node, parent: any) => {

				// must be a function
				if (node.type !== 'FunctionDeclaration') {
					return node;
				}
				const functionNode = (node as FunctionDeclaration);

				// must have an id (duh.)
				if (!functionNode.id) {
					return node;
				}

				// must have a _Event suffix
				const [objName, eventName] = functionNode.id.name.split('_');
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

				return expressionStatement(callExpression(
					memberExpression(
						identifier(objName),
						identifier('on'),
					),
					[
						literal(eventName),
						arrowFunctionExpression(false, functionNode.body, functionNode.params),
					],
				));
			},
		}) as Program;
	}
}
