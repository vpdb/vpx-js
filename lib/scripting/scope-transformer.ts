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
import { Program, Statement } from 'estree';
import { Table } from '../vpt/table/table';
import {
	arrowFunctionExpressionBlock,
	assignmentExpressionStatement,
	identifier,
	memberExpression,
	program,
} from './estree';

/**
 * This wraps the table script into a function where its globals are replaced
 * by locals provided through the function parameters.
 *
 * Example: `BallRelease.CreateBall()` would become `function play(items) { items.BallRelease.CreateBall() }`.
 */
export class ScopeTransformer {

	private readonly table: Table;
	private readonly items: { [p: string]: any };

	constructor(table: Table) {
		this.table = table;
		this.items = table.getElementApis();
	}

	public transform(ast: Program, mainFunctionName: string, elementObjectName: string, globalObjectName?: string): Program {
		return this.wrap(this.replaceElementObjectNames(ast, elementObjectName), mainFunctionName, elementObjectName, globalObjectName);
	}

	/**
	 * Replaces global variables that refer to table elements by a member
	 * expression given by an object name.
	 *
	 * @param ast Original AST
	 * @param elementObjectName The name of the object that contains all table elements.
	 */
	public replaceElementObjectNames(ast: Program, elementObjectName: string): Program {
		return replace(ast, {
			enter: (node, parent: any) => {
				const alreadyReplaced = parent !== node && parent.type === 'MemberExpression' && parent.object.name === elementObjectName;
				if (!alreadyReplaced && node.type === 'Identifier' && node.name in this.items) {
					return memberExpression(
						identifier(elementObjectName),
						identifier(node.name),
					);
				}
				return node;
			},
		}) as Program;
	}

	/**
	 * Wraps the table script into a function.
	 *
	 * @param ast Original AST
	 * @param mainFunctionName Name of the function to wrap the code into
	 * @param elementObjectName Name of the function parameter containing all table elements
	 * @param globalObjectName Name of the global object the function will be added too. If not specified it'll be a global function.
	 */
	public wrap(ast: Program, mainFunctionName: string, elementObjectName: string, globalObjectName?: string): Program {
		return replace(ast, {
			enter: node => {
				if (node.type === 'Program') {
					return program([
						assignmentExpressionStatement(
							globalObjectName
								? memberExpression(
										identifier(globalObjectName),
										identifier(mainFunctionName),
									)
								: identifier(mainFunctionName),
							'=',
							arrowFunctionExpressionBlock(
								node.body as Statement[],
								[ identifier(elementObjectName) ],
							),
						),
					]);
				}
			},
		}) as Program;
	}
}
