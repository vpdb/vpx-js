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
import { Comment, Expression, Identifier, Statement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(result: [Token, null, Expression, Expression[], Comment[]]): Statement {
	const firstExpr = result[2];
	const otherExprs = result[3] || [];
	const exprs = [firstExpr, ...otherExprs];
	const comments = result[4];
	return estree.expressionStatement(estree.sequenceExpression(exprs), [], comments);
}

export function stmt2(result: [Token, null, Token, null, Expression, Expression[], Comment[]]): Statement {
	const firstExpr = result[4];
	const otherExprs = result[5] || [];
	const exprs = [firstExpr, ...otherExprs];
	const comments = result[6];
	const stmt = estree.expressionStatement(estree.sequenceExpression(exprs), [], comments);
	traverse(stmt, {
		enter: node => {
			if (node.type === 'CallExpression') {
				if (node.callee.type === 'MemberExpression') {
					if (node.callee.property.type === 'Identifier') {
						if (node.callee.property.name === 'redim') {
							node.arguments.push(estree.literal(true));
						}
					}
				}
			}
		},
	});
	return stmt;
}

export function redimDecl(result: [Identifier, null, Token, null, Expression, null, Expression[], Token]): Expression {
	const name = result[0];
	const firstExpr = result[4];
	const otherExprs = result[6] || [];
	const exprs = [firstExpr, ...otherExprs];
	return estree.assignmentExpression(
		name,
		'=',
		estree.callExpression(estree.memberExpression(estree.identifier('vbsHelper'), estree.identifier('redim')), [
			name,
			estree.arrayExpression(exprs),
		]),
	);
}
