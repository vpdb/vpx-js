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

import { Expression, ExpressionStatement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(result: [Expression, null, Expression, null, Expression[]]): ExpressionStatement {
	const callee = result[0];
	const firstExpr = result[2] ? [result[2]] : [];
	const otherExpr = result[4] || [];
	return estree.callExpressionStatement(callee, [...firstExpr, ...otherExpr]);
}

export function stmt2(result: [Expression, null, Token, null, Expression, null, Token, null, Expression[]]): ExpressionStatement {
	const callee = result[0];
	const firstExpr = result[4] ? [result[4]] : [];
	const otherExpr = result[8] || [];
	return estree.callExpressionStatement(callee, [...firstExpr, ...otherExpr]);
}

export function stmt3(result: [Expression, null, Token, null, Expression, null, Token]): ExpressionStatement {
	const callee = result[0];
	const firstExpr = result[4] ? [result[4]] : [];
	return estree.callExpressionStatement(callee, [...firstExpr]);
}

export function stmt4(result: [Expression, null, Token, null, Token]): ExpressionStatement {
	const callee = result[0];
	return estree.callExpressionStatement(callee, []);
}
