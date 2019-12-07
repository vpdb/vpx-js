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

import { Expression } from 'estree';
import { callExpression, expressionStatement, identifier, literal, memberExpression } from '../estree';
import { ESIToken } from '../grammar/grammar';
import { Transformer } from '../transformer/transformer';

export function ppError(node: ESIToken): any {
	switch (node.type) {
		case 'OnErrorStatement':
			return ppOnErrorStatement(node);
	}
	return null;
}

function ppOnErrorStatement(node: ESIToken): any {
	let expr: Expression;
	if (node.text.indexOf('GoTo') !== -1) {
		expr = callExpression(memberExpression(identifier(Transformer.VBSHELPER_NAME), identifier('onErrorGoto')), [
			literal(0),
		]);
	} else {
		expr = callExpression(
			memberExpression(identifier(Transformer.VBSHELPER_NAME), identifier('onErrorResumeNext')),
			[],
		);
	}
	return expressionStatement(expr);
}
