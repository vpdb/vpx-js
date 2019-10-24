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
import { CallExpression, Expression, Identifier, MemberExpression, Program, Statement } from 'estree';
import { logger } from '../../util/logger';
import { apiEnums } from '../../vpt/enums';
import { GlobalApi } from '../../vpt/global-api';
import { Table } from '../../vpt/table/table';
import {
	arrowFunctionExpression,
	assignmentExpression,
	blockStatement, callExpression,
	expressionStatement,
	identifier,
	memberExpression,
	program,
} from '../estree';
import { Stdlib } from '../stdlib';

/**
 * In the Visual Pinball table script, everything is global. In JavaScript we
 * decided to properly manage the scope in order not to pollute the global
 * namespace.
 *
 * This transformer wraps the table script into a function, and provides
 * reference to the following objects:
 *   - items: all table elements, key is name, value is the API implementation
 *   - enums: enum values used in Visual Pinball
 *   - global: reference to the global API
 *   - stdlib: the VBScript Standard Library implemented in JavaScript
 *   - vbsHelper: a bunch of utils for VBScript syntax not available in JavaScript
 * The transformer then goes through all identifiers and changes the reference to
 * the provided objects if available.
 *
 * Examples:
 *   - `BallRelease.CreateBall()` would become `__items.BallRelease.CreateBall()`.
 *   - `ImageAlignment.ImageAlignWorld` would become `__enums.ImageAlignment.ImageAlignWorld`.
 *   - `PlaySound()` would become `__global.PlaySound()`.
 */
export class ReferenceTransformer {

	private readonly table: Table;
	private readonly items: { [p: string]: any };
	public static ITEMS_NAME = '__items';
	public static ENUMS_NAME = '__enums';
	public static GLOBAL_NAME = '__global';
	public static STDLIB_NAME = '__stdlib';
	public static VBSHELPER_NAME = '__vbsHelper';

	constructor(table: Table) {
		this.table = table;
		this.items = table.getElementApis();
	}

	public transform(ast: Program, mainFunctionName?: string, globalObjectName?: string): Program {
		this.replaceElementObjectNames(ast);
		this.replaceEnumObjectNames(ast);
		this.replaceStdlibNames(ast);
		this.replaceGlobalApiNames(ast);
		this.replaceExecuteGlobal(ast);
		return this.wrap(ast, mainFunctionName, globalObjectName);
	}

	/**
	 * Replaces global variables that refer to table elements by a member
	 * expression given by an object name.
	 */
	public replaceElementObjectNames(ast: Program): void {
		replace(ast, {
			enter: (node, parent: any) => {
				const alreadyReplaced = parent !== node && parent.type === 'MemberExpression' && parent.object.name === ReferenceTransformer.ITEMS_NAME;
				if (!alreadyReplaced && node.type === 'Identifier' && node.name in this.items) {
					return memberExpression(
						identifier(ReferenceTransformer.ITEMS_NAME),
						identifier(node.name),
					);
				}
				return node;
			},
		});
	}

	public replaceEnumObjectNames(ast: Program): void {
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
						identifier(ReferenceTransformer.ENUMS_NAME),
						identifier(enumObject.name),
					);
				}
				return node;
			},
		});
	}

	public replaceGlobalApiNames(ast: Program): void {
		replace(ast, {
			enter: (node, parent: any) => {
				const alreadyReplaced = parent !== node && parent.type === 'MemberExpression' && parent.object.name === ReferenceTransformer.GLOBAL_NAME;
				if (!alreadyReplaced && node.type === 'Identifier' && node.name in GlobalApi.prototype) {
					return memberExpression(
						identifier(ReferenceTransformer.GLOBAL_NAME),
						identifier(node.name),
					);
				}
				return node;
			},
		});
	}

	public replaceStdlibNames(ast: Program): void {
		replace(ast, {
			enter: (node, parent: any) => {
				const alreadyReplaced = parent !== node && parent.type === 'MemberExpression' && parent.object.name === ReferenceTransformer.STDLIB_NAME;
				if (!alreadyReplaced && node.type === 'Identifier' && node.name in Stdlib.prototype) {
					return memberExpression(
						identifier(ReferenceTransformer.STDLIB_NAME),
						identifier(node.name),
					);
				}
				return node;
			},
		});
	}

	/**
	 * The `eval()` command can't be wrapped into a function, because it messes
	 * up the execution context. So we transpile and execute directly.
	 *
	 * Example:
	 *    ExecuteGlobal GetTextFile("controller.vbs")
	 * becomes:
	 *    eval(__vbsHelper.transpileInline(__global.GetTextFile('controller.vbs')));
	 *
	 * @param ast
	 */
	public replaceExecuteGlobal(ast: Program): void {
		replace(ast, {
			enter: (node, parent: any) => {
				if (node.type === 'CallExpression') {
					if (node.callee.type === 'Identifier' && node.callee.name === 'ExecuteGlobal') {
						node.callee.name = 'eval';
						node.arguments[0] = callExpression(
							memberExpression(
								identifier(ReferenceTransformer.VBSHELPER_NAME),
								identifier('transpileInline'),
							),
							[ node.arguments[0] as Expression ],
						);
					}
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
	 * @param globalObjectName Name of the global object the function will be added too. If not specified it'll be a global function.
	 */
	public wrap(ast: Program, mainFunctionName?: string, globalObjectName?: string): Program {
		if (!mainFunctionName) {
			return ast;
		}
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
									[ identifier(ReferenceTransformer.ITEMS_NAME), identifier(ReferenceTransformer.ENUMS_NAME), identifier(ReferenceTransformer.GLOBAL_NAME), identifier(ReferenceTransformer.STDLIB_NAME), identifier(ReferenceTransformer.VBSHELPER_NAME) ],
								),
							)),
					]);
				}
			},
		}) as Program;
	}
}
