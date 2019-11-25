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

import { EmptyStatement, ExpressionStatement, Literal } from 'estree';
import { Token } from 'moo';
import * as estree from '../estree';
import { Transformer } from '../transformer/transformer';

export function stmt1(result: [Token, null, Token, null, Token, null, Token]): ExpressionStatement {
	return estree.expressionStatement(
		estree.callExpression(
			estree.memberExpression(
				estree.identifier(Transformer.VBSHELPER_NAME),
				estree.identifier('onErrorResumeNext'),
			),
			[],
		),
	);
}

export function stmt2(result: [Token, null, Token, null, Token, null, Literal]): ExpressionStatement {
	const arg = result[6];
	return estree.expressionStatement(
		estree.callExpression(
			estree.memberExpression(
				estree.identifier(Transformer.VBSHELPER_NAME),
				estree.identifier('onErrorGoto'),
			),
			[ arg ],
		),
	);
}
