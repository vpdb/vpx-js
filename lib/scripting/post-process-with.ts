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

import { BlockStatement, Expression } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt(result: [Token, null, Expression, null, BlockStatement, null, null, null, null]): BlockStatement {
	const identifier = result[2];
	const body = result[4];
	body.body.forEach(statement => {
		if (statement.type === 'ExpressionStatement') {
			if (statement.expression.type === 'AssignmentExpression') {
				if (statement.expression.left.type === 'Identifier') {
					if (statement.expression.left.name.startsWith('.')) {
						statement.expression.left.name = statement.expression.left.name.substr(1);
						statement.expression.left = estree.memberExpression(identifier, statement.expression.left);
					}
				}
			}
		}
	});
	return body;
}
