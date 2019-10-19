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

import { BlockStatement, Comment, Expression, SwitchCase, SwitchStatement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function selectStmt(
	result: [Token, null, Token, null, Expression, Comment[], SwitchCase[], Token, null, Token, Comment[]],
): SwitchStatement {
	const discriminant = result[4];
	const caseStatements = result[6];
	const leadingComments = result[5] || [];
	const trailingComments = result[10] || [];
	return estree.switchStatement(discriminant, caseStatements, leadingComments, trailingComments);
}

export function caseStmtList1(
	result: [Token, null, Expression[], null, Comment[], BlockStatement, SwitchCase[]],
): SwitchCase[] {
	const exprs = result[2];
	const comments = result[4] || [];
	const blockStmt = result[5];
	const prevSwitchCases = result[6] || [];
	const switchCases = [];
	for (let index = 0; index < exprs.length; index++) {
		const stmts = [];
		if (index === exprs.length - 1) {
			if (blockStmt != null) {
				stmts.push(...blockStmt.body);
			}
			stmts.push(estree.breakStatement());
		}
		switchCases.push(estree.switchCase(exprs[index], stmts, comments, []));
	}
	return switchCases.concat(prevSwitchCases);
}

export function caseStmtList2(result: [Token, null, Token, null, Comment[], BlockStatement]): SwitchCase[] {
	const comments = result[4] || [];
	const blockStmt = result[5];
	return [estree.switchCase(null, blockStmt != null ? blockStmt.body : [], comments, [])];
}
