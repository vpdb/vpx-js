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
import { Comment, Expression, Identifier, Statement, VariableDeclarator } from 'estree';
import { Token } from 'moo';
import * as estree from '../estree';
import { ScopeTransformer } from '../transformer/scope-transformer';

export function stmt1(result: [Token, null, VariableDeclarator[], Comment[]]): Statement {
	const declarators = result[2];
	const comments = result[3] || [];
	return estree.variableDeclaration('let', declarators, comments);
}

export function stmt2(result: [Token, null, Token, null, VariableDeclarator[], Comment[]]): Statement {
	const declarators = result[4];
	const comments = result[5] || [];
	const stmt = estree.variableDeclaration('let', declarators, comments);
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

export function redimDeclList1(result: [Expression, null, Token, null, Expression[]]): Expression[] {
	const firstExpr = result[0];
	const otherExprs = result[4];
	return [firstExpr, ...otherExprs];
}

export function redimDeclList2(result: [Expression]): Expression[] {
	const expr = result[0];
	return [expr];
}

export function redimDecl(result: [Identifier, null, Token, null, Expression[], null, Token]): VariableDeclarator {
	const name = result[0];
	const exprs = result[4];
	return estree.variableDeclarator(
		name,
		estree.callExpression(estree.memberExpression(estree.identifier(ScopeTransformer.VBSHELPER_NAME), estree.identifier('redim')), [
			name,
			estree.arrayExpression(exprs),
		]),
	);
}
