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

import { traverse } from 'estraverse';
import { BlockStatement, Comment, Expression, Statement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt(
	result: [Token, null, Expression, Comment[], BlockStatement, Token, null, Token, Comment[]],
): BlockStatement {
	const identifier = result[2];
	const body = result[4];
	const leadingComments = result[3] || [];
	const trailingComments = result[8] || [];
	traverse(body, {
		enter: (node, parentNode) => {
			if (node.type === 'Identifier' && node.name.startsWith('.')) {
				if (parentNode != null) {
					node.name = node.name.substr(1);
					if (parentNode.type === 'AssignmentExpression') {
						parentNode.left = estree.memberExpression(identifier, parentNode.left as Expression);
					} else if (parentNode.type === 'CallExpression') {
						parentNode.callee = estree.memberExpression(identifier, parentNode.callee as Expression);
					} else if (parentNode.type === 'UnaryExpression') {
						parentNode.argument = estree.memberExpression(identifier, node);
					}
				}
			}
		},
	});
	body.leadingComments = leadingComments;
	body.trailingComments = trailingComments;
	return body;
}
