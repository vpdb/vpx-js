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

import { assignmentExpression, expressionStatement } from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppAssign(node: ESIToken): any {
	switch (node.type) {
		case 'RegularAssignmentStatement':
		case 'RegularAssignmentStatementInline':
			return ppRegularAssignmentStatement(node);
		case 'SetAssignmentStatement':
		case 'SetAssignmentStatementInline':
			return ppSetAssignmentStatement(node);
	}
	return null;
}

function ppRegularAssignmentStatement(node: ESIToken): any {
	const expr = node.children[0].estree;
	const rightExpr = node.children[2].estree;
	return expressionStatement(assignmentExpression(expr, '=', rightExpr));
}

function ppSetAssignmentStatement(node: ESIToken): any {
	const stmts = [];
	const expr = node.children[0].estree;
	const rightExpr = node.children[2].estree;
	stmts.push(expressionStatement(assignmentExpression(expr, '=', rightExpr)));
	if (rightExpr.type === 'NewExpression' && node.children.length > 3) {
		if (node.children[3].type === 'NothingLiteral') {
			stmts.push(expressionStatement(assignmentExpression(expr, '=', node.children[3].estree)));
		}
	}
	return stmts;
}
