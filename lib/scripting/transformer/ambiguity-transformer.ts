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
import { Expression, MemberExpression, Program } from 'estree';
import { EnumsApi } from '../../vpt/enums';
import { GlobalApi } from '../../vpt/global-api';
import { callExpression, memberExpression } from '../estree';
import { getOrCall } from '../post-process/helpers';
import { Stdlib } from '../stdlib';
import { Transformer } from './transformer';

export class AmbiguityTransformer extends Transformer {

	private readonly itemApis: { [p: string]: any };
	private readonly enumApis: EnumsApi;
	private readonly globalApi: GlobalApi;
	private readonly stdlib: Stdlib;

	constructor(ast: Program, itemApis: { [p: string]: any }, enumApis: EnumsApi, globalApi: GlobalApi, stdlib: Stdlib) {
		super(ast);
		this.itemApis = itemApis;
		this.enumApis = enumApis;
		this.globalApi = globalApi;
		this.stdlib = stdlib;
	}

	public transform(): Program {
		this.transformCallExpressions();
		this.transformProperty();
		return this.ast;
	}

	private transformCallExpressions(): Program {
		return replace(this.ast, {
			enter: (node, parent: any) => {
				if (node.type === 'CallExpression') {

					// if there's more than one argument, it's definitely for accessing the array
					if (!node.arguments || node.arguments.length !== 1) {
						return node;
					}

					// if the parameter is a string, it's not an array index
					if (node.arguments[0].type === 'Literal' && typeof node.arguments[0].value === 'string') {
						return node;
					}

					// we know what `eval()` is..
					if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
						return node;
					}

					// if it's an assignment where its left is the node, it's definitely not a function call
					if (parent && parent.type === 'AssignmentExpression' && node === parent.left) {
						return memberExpression(
							node.callee,
							node.arguments[0] as Expression,
							true,
						);
					}

					// if it's a member, then check if we exclude objects we know don't contain arrays
					if (node.callee.type === 'MemberExpression') {
						if (node.callee.object.type === 'Identifier') {
							if ([ Transformer.ITEMS_NAME, Transformer.ENUMS_NAME,  Transformer.GLOBAL_NAME,
								Transformer.STDLIB_NAME, Transformer.VBSHELPER_NAME ].includes(node.callee.object.name)) {
								return node;
							}
						}
					}

					// otherwise, we don't know, so use getOrCall
					return getOrCall(node.callee as Expression, node.arguments[0] as Expression);
				}
				return node;
			},
		}) as Program;
	}

	private transformProperty(): Program {
		return replace(this.ast, {
			enter: (node, parent: any) => {
				if (node.type === 'MemberExpression') {

					// if it's already a call, ignore
					if (parent && parent.type === 'CallExpression' && parent.callee === node) {
						return node;
					}

					// if it's an assignment where its left is the node, it's definitely not a function call
					if (parent && (parent.type === 'AssignmentExpression' || parent.type === 'ForOfStatement') && node === parent.left) {
						return node;
					}

					// now, if it's a prop of something we already know, check if it's a function.
					const topMemberName = this.getTopMemberName(node);
					let api: any;
					switch (topMemberName) {
						case Transformer.GLOBAL_NAME:
							api = this.globalApi;
							break;
						case Transformer.ITEMS_NAME:
							api = this.itemApis;
							break;
						case Transformer.STDLIB_NAME:
							api = this.stdlib;
							break;
						case Transformer.ENUMS_NAME: // enums ain't no functions either
							return node;
					}

					const obj = getValue(api, node);
					if (typeof obj === 'function') {
						return callExpression(node, []);
					}

					// already replaced?
					if (parent && parent.type === 'CallExpression' && parent.callee.type === 'MemberExpression' && parent.callee.object.name === Transformer.VBSHELPER_NAME) {
						return node;
					}

					// todo check scope
					// todo check items we now have `__vbsHelper.getOrCall(__items.ScoreText).Visible = false;`

					// otherwise we don't know. so eval runtime
					return getOrCall(node);
				}
				return node;
			},
		}) as Program;
	}
}

/**
 * Reads the value from an object where an AST points to.
 * @param obj Object
 * @param ast AST
 * @param path Recursively populated path
 */
function getValue(obj: any, ast: MemberExpression, path: string[] = []): any {
	if (ast.property.type !== 'Identifier') {
		return undefined;
	}
	if (ast.object.type === 'MemberExpression') {
		return getValue(obj, ast.object, [ ast.property.name, ...path ]);
	}
	if (ast.object.type === 'Identifier') {
		let o = obj;
		path = [ ast.property.name, ...path ];
		for (const name of path) {
			if (!o) {
				return undefined;
			}
			o = o[name];
		}
		return o;
	}
	return undefined;
}
