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
import { CallExpression, Identifier, MemberExpression, Program, Statement } from 'estree';
import { Player } from '../../game/player';
import { logger } from '../../util/logger';
import { apiEnums } from '../../vpt/enums';
import { GlobalApi } from '../../vpt/global-api';
import { Table } from '../../vpt/table/table';
import {
	arrowFunctionExpression,
	assignmentExpression,
	blockStatement,
	expressionStatement,
	identifier,
	memberExpression,
	program,
} from '../estree';
import { Stdlib } from '../stdlib';

/**
 * This wraps the table script into a function where its globals are replaced
 * by locals provided through the function parameters.
 *
 * Example: `BallRelease.CreateBall()` would become `function play(items) { items.BallRelease.CreateBall() }`.
 */
export class ScopeTransformer {

	private readonly table: Table;
	private readonly items: { [p: string]: any };
	private readonly stdlib = new Stdlib();
	private readonly globalApi: GlobalApi;

	constructor(table: Table, player: Player) {
		this.table = table;
		this.items = table.getElementApis();
		this.globalApi = new GlobalApi(table, player);
	}

	public transform(ast: Program, mainFunctionName: string, elementObjectName: string, enumObjectName: string, globalApiObjectName: string, stdlibObjectName: string, globalObjectName?: string): Program {
		this.replaceElementObjectNames(ast, elementObjectName);
		this.replaceEnumObjectNames(ast, enumObjectName);
		this.replaceStdlibNames(ast, stdlibObjectName);
		this.replaceGlobalApiNames(ast, globalApiObjectName);
		return this.wrap(ast, mainFunctionName, elementObjectName, enumObjectName, globalApiObjectName, stdlibObjectName, globalObjectName);
	}

	/**
	 * Replaces global variables that refer to table elements by a member
	 * expression given by an object name.
	 */
	public replaceElementObjectNames(ast: Program, elementObjectName: string): void {
		replace(ast, {
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
		});
	}

	public replaceEnumObjectNames(ast: Program, enumObjectName: string): void {
		replace(ast, {
			enter: (node, parent: any) => {
				const isFunction = parent && parent.type === 'CallExpression';
				const isEnumIdentifier = node.type === 'MemberExpression' && node.object.type === 'Identifier' && node.property.type === 'Identifier' && node.object.name in apiEnums;
				if (isEnumIdentifier && !isFunction) {
					const enumNode = node as MemberExpression;
					const enumObject = enumNode.object as Identifier;
					const enumProperty = enumNode.property as Identifier;
					if (apiEnums[enumObject.name][enumProperty.name] === undefined) {
						logger().warn(`[scripting] Unknown value "${enumProperty.name}" of enum ${enumObject.name}.`);
						return node;
					}
					enumNode.object = memberExpression(
						identifier(enumObjectName),
						identifier(enumObject.name),
					);
				}
				return node;
			},
		});
	}

	public replaceGlobalApiNames(ast: Program, globalApiObjectName: string): void {
		replace(ast, {
			enter: (node, parent: any) => {
				const alreadyReplaced = parent !== node && parent.type === 'MemberExpression' && parent.object.name === globalApiObjectName;
				if (!alreadyReplaced && node.type === 'Identifier' && node.name in this.globalApi) {
					return memberExpression(
						identifier(globalApiObjectName),
						identifier(node.name),
					);
				}
				return node;
			},
		});
	}

	public replaceStdlibNames(ast: Program, stdlibObjectName: string): void {
		replace(ast, {
			enter: (node, parent: any) => {
				const alreadyReplaced = parent !== node && parent.type === 'MemberExpression' && parent.object.name === stdlibObjectName;
				if (!alreadyReplaced && node.type === 'Identifier' && node.name in this.stdlib) {
					return memberExpression(
						identifier(stdlibObjectName),
						identifier(node.name),
					);
				}
				return node;
			},
		});
	}

	/**
	 * Wraps the table script into a function.
	 *
	 * @param ast Original AST
	 * @param mainFunctionName Name of the function to wrap the code into
	 * @param elementObjectName Name of the function parameter containing all table elements
	 * @param enumObjectName Name of the function parameter containing all enums
	 * @param globalApiObjectName Name of the function parameter implementing the global API
	 * @param stdlibObjectName Name of the object that implements VBScript's Standard Library
	 * @param globalObjectName Name of the global object the function will be added too. If not specified it'll be a global function.
	 */
	public wrap(ast: Program, mainFunctionName: string, elementObjectName: string, enumObjectName: string, globalApiObjectName: string, stdlibObjectName: string, globalObjectName?: string): Program {
		return replace(ast, {
			enter: node => {
				if (node.type === 'Program') {
					return program([
						expressionStatement(
							assignmentExpression(
								globalObjectName
									? memberExpression(
										identifier(globalObjectName),
										identifier(mainFunctionName),
									)
									: identifier(mainFunctionName),
								'=',
								arrowFunctionExpression(false,
									blockStatement(node.body as Statement[]),
									[ identifier(elementObjectName), identifier(enumObjectName), identifier(globalApiObjectName), identifier(stdlibObjectName), identifier('vbsHelper') ],
								),
							)),
					]);
				}
			},
		}) as Program;
	}
}
