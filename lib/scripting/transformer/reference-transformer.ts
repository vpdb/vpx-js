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
import { CallExpression, Expression, Identifier, Literal, MemberExpression, Program } from 'estree';
import { logger } from '../../util/logger';
import { EnumsApi } from '../../vpt/enums';
import { GlobalApi } from '../../vpt/global-api';
import { Table } from '../../vpt/table/table';
import { callExpression, identifier, memberExpression } from '../estree';
import { Stdlib } from '../stdlib';
import { Transformer } from './transformer';

/**
 * In the Visual Pinball table script, everything is global. In JavaScript we
 * decided to properly manage the scope in order not to pollute the global
 * namespace.
 *
 * This transformer goes through all variables and determines to which of the
 * following name spaces it belongs to (in that order):
 *   - items: table elements
 *   - enums: enum values exposed in Visual Pinball's VBScript API
 *   - stdlib: the VBScript Standard Library implemented in JavaScript
 *   - global: reference to Visual Pinball's global API
 *   - eval: `ExecuteGlobal()` calls are directly handled here because they
 *     cannot be wrapped into another method without losing the current
 *     execution context.
 *
 * To match a namespace, the transformer looks at the actual values of each
 * name space. That's possible because at compile time, the table and the
 * player are already set up and thus accessible.
 *
 * To match an object or property, the transformer uses a special API that
 * allows matching in a case-insensitive way. When matched, the resulting
 * identifier is properly cased.
 *
 * Examples:
 *   - `BallRelease.CreateBall()` would become `__items.BallRelease.CreateBall()`.
 *   - `ImageAlignment.ImageAlignWorld` would become `__enums.ImageAlignment.ImageAlignWorld`.
 *   - `PlaySound()` would become `__global.PlaySound()`.
 */
export class ReferenceTransformer extends Transformer {

	private readonly table: Table;
	private readonly itemApis: { [p: string]: any };
	private readonly enumApis: EnumsApi;
	private readonly globalApi: GlobalApi;
	private readonly stdlib: Stdlib;

	constructor(ast: Program, table: Table, itemApis: { [p: string]: any }, enumApis: EnumsApi, globalApi: GlobalApi, stdlib: Stdlib) {
		super(ast, true);
		this.table = table;
		this.itemApis = itemApis;
		this.enumApis = enumApis;
		this.globalApi = globalApi;
		this.stdlib = stdlib;
	}

	public transform(): Program {
		this.addScope();
		this.replaceElementObjectNames(this.ast);
		this.replaceEnumObjectNames(this.ast);
		this.replaceStdlibNames(this.ast);
		this.replaceGlobalApiNames(this.ast);
		this.replaceExecuteGlobal(this.ast);
		return this.ast;
	}

	/**
	 * Replaces global variables that refer to table elements by a member
	 * expression given by an object name.
	 */
	public replaceElementObjectNames(ast: Program): void {
		let ignoreClass = false;
		replace(ast, {
			enter: (node, parent: any) => {
				if (!ignoreClass) {
					if (node.type === 'ClassDeclaration') {
						ignoreClass = true;
					} else {
						const isFunctionDeclaration = parent && parent.type === 'FunctionDeclaration';
						const alreadyReplaced = parent !== node && parent.type === 'MemberExpression' && parent.object.name === Transformer.ITEMS_NAME;
						if (!alreadyReplaced && !isFunctionDeclaration && node.type === 'Identifier') {
							const elementName = this.table.getElementApiName(node.name);
							const isLocalVariable = this.isLocalVariable(node);
							if (elementName && !isLocalVariable) {
								// patch property
								if (parent.property && parent.property.name) {
									const propName = this.itemApis[elementName]._getPropertyName(parent.property.name);
									if (propName) {
										parent.property.name = propName;
									}
								}
								return memberExpression(
									identifier(Transformer.ITEMS_NAME),
									identifier(elementName),
								);
							}
						}
						return node;
					}
				}
			},
			leave: (node, parent: any) => {
				if (node.type === 'ClassDeclaration') {
					ignoreClass = false;
				}
			},
		});
	}

	public replaceEnumObjectNames(ast: Program): void {
		let ignoreClass = false;
		replace(ast, {
			enter: (node, parent: any) => {
				if (!ignoreClass) {
					if (node.type === 'ClassDeclaration') {
						ignoreClass = true;
					} else {
						const isFunction = parent && parent.type === 'CallExpression';
						const isIdentifier = node.type === 'MemberExpression' && node.object.type === 'Identifier' && node.property.type === 'Identifier';
						if (isIdentifier && !isFunction) {
							const enumNode = node as MemberExpression;
							const enumObject = enumNode.object as Identifier;
							const enumProperty = enumNode.property as Identifier;
							const enumName = this.enumApis._getPropertyName(enumObject.name);
							let propName: string | undefined;
							if (enumName) {
								propName = (this.enumApis as any)[enumName]._getPropertyName(enumProperty.name);
								if (propName) {
									enumNode.object = memberExpression(
										identifier(Transformer.ENUMS_NAME),
										identifier(enumName),
									);
									enumProperty.name = propName;

								} else {
									logger().warn(`[scripting] Unknown value "${enumProperty.name}" of enum ${enumName}.`);
								}
							}
						}
						return node;
					}
				}
			},
			leave: (node, parent: any) => {
				if (node.type === 'ClassDeclaration') {
					ignoreClass = false;
				}
			},
		});
	}

	public replaceGlobalApiNames(ast: Program): void {
		let ignoreClass = false;
		replace(ast, {
			enter: (node, parent: any) => {
				if (!ignoreClass) {
					if (node.type === 'ClassDeclaration') {
						ignoreClass = true;
					} else {
						const isFunctionDeclaration = parent && parent.type === 'FunctionDeclaration';
						if (!this.isKnown(node, parent) && node.type === 'Identifier') {
							const name =  this.globalApi._getPropertyName(node.name);
							const isLocalVariable = this.isLocalVariable(node);
							if (name && !isLocalVariable) {
								return memberExpression(
									identifier(Transformer.GLOBAL_NAME),
									identifier(name),
								);
							}
						}
						return node;
					}
				}
			},
			leave: (node, parent: any) => {
				if (node.type === 'ClassDeclaration') {
					ignoreClass = false;
				}
			},
		});
	}

	public replaceStdlibNames(ast: Program): void {
		let ignoreClass = false;
		replace(ast, {
			enter: (node, parent: any) => {
				if (!ignoreClass) {
					if (node.type === 'ClassDeclaration') {
						ignoreClass = true;
					} else {
						if (!this.isKnown(node, parent) && node.type === 'Identifier') {
							const name = this.stdlib._getPropertyName(node.name);
							if (name) {
								// patch property
								if (parent.property && parent.property.name && (this.stdlib as any)[name]) {
									const propName = (this.stdlib as any)[name]._getPropertyName(parent.property.name);
									if (propName) {
										parent.property.name = propName;
									}
								}
								// add player object to activeX instantiation
								if (name === 'CreateObject') {
									parent.arguments.push(identifier(Transformer.PLAYER_NAME));
								}
								return memberExpression(
									identifier(Transformer.STDLIB_NAME),
									identifier(name),
								);
							}
						}
						return node;
					}
				}
			},
			leave: (node, parent: any) => {
				if (node.type === 'ClassDeclaration') {
					ignoreClass = false;
				}
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
		let ignoreClass = false;
		replace(ast, {
			enter: (node, parent: any) => {
				if (!ignoreClass) {
					if (node.type === 'ClassDeclaration') {
						ignoreClass = true;
					} else {
						if (node.type === 'CallExpression') {
							if (node.callee.type === 'Identifier' && ['executeglobal', 'execute', 'eval'].includes(node.callee.name.toLowerCase())) {
								node.callee.name = 'eval';
								const args =  [ node.arguments[0] as Expression ];

								// if it's a "getTextFile", we want to know which and pass it to the transpiler
								if (isCallToGetTextFile(node)) {
									args.push((node as any).arguments[0].arguments[0]);
								}
								node.arguments[0] = callExpression(
									memberExpression(
										identifier(Transformer.VBSHELPER_NAME),
										identifier('transpileInline'),
									),
									args,
								);
							}
						}
						return node;
					}
				}
			},
			leave: (node, parent: any) => {
				if (node.type === 'ClassDeclaration') {
					ignoreClass = false;
				}
			},
		});
	}
}

function isCallToGetTextFile(node: any): boolean {
	return node.arguments.length > 0
		&& node.arguments[0].type === 'CallExpression'
		&& node.arguments[0].callee.property
		&& node.arguments[0].callee.property.type === 'Identifier'
		&& node.arguments[0].callee.property.name === 'GetTextFile'
		&& node.arguments[0].arguments.length > 0
		&& node.arguments[0].arguments[0].type === 'Literal';
}
