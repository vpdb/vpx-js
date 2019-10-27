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
import { Expression, Program } from 'estree';
import { memberExpression } from '../estree';
import { getOrCall } from '../post-process/helpers';
import { Transformer } from './transformer';

export class AmbiguityTransformer extends Transformer {

	constructor(ast: Program) {
		super(ast);
	}

	public transform(): Program {
		this.transformCallExpressions();
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

					// we know what `eval()` is..
					if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
						return node;
						//return VisitorOption.Skip;
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

					// otherwise, we don't know, so use  getOrCall
					return getOrCall(node.callee as Expression, node.arguments[0] as Expression);
				}
				return node;
			},
		}) as Program;
	}

}
