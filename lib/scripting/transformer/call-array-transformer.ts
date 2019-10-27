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

import { replace, VisitorOption } from 'estraverse';
import { Expression, Program } from 'estree';
import { Transformer } from './transformer';
import { setOrCall } from '../post-process/helpers';
import { memberExpression } from '../estree';

export class CallArrayTransformer extends Transformer {

	constructor(ast: Program) {
		super(ast);
	}

	public transform(): Program {
		return replace(this.ast, {
			enter: (node, parent: any) => {
				if (node.type === 'CallExpression') {
					if (!node.arguments || node.arguments.length !== 1) {
						return node;
					}
					if (parent && parent.type === 'AssignmentExpression' && node === parent.left) {
						return memberExpression(
							node.callee,
							node.arguments[0] as Expression,
							true,
						);
					}
					if (node.callee.type === 'MemberExpression') {
						if (node.callee.object.type === 'Identifier') {
							if (node.callee.object.name === Transformer.SCOPE_NAME) {
								return setOrCall(node.callee, node.arguments[0] as Expression);
							}
						}
					}
				}
				return node;
			},
		}) as Program;
	}
}
