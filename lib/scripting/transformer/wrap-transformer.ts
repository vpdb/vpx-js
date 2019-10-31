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

import { Program, Statement } from 'estree';
import {
	arrowFunctionExpression,
	assignmentExpression,
	blockStatement,
	expressionStatement,
	identifier,
	memberExpression,
	program,
} from '../estree';
import { Transformer } from './transformer';

/**
 * This transformer wraps the program into a function that provides the
 * different name spaces as objects.
 *
 * @see ReferenceTransformer
 * @see ScopeTransformer
 */
export class WrapTransformer extends Transformer {

	constructor(ast: Program) {
		super(ast);
	}

	public transform(mainFunctionName?: string, globalObjectName?: string): Program {
		if (!mainFunctionName) {
			return this.ast;
		}
		return program([
			expressionStatement(
				assignmentExpression(
					globalObjectName
						? memberExpression(identifier(globalObjectName), identifier(mainFunctionName))
						: identifier(mainFunctionName),
					'=',
					arrowFunctionExpression(false,
						blockStatement(this.ast.body as Statement[]),
						[
							identifier(Transformer.SCOPE_NAME),
							identifier(Transformer.ITEMS_NAME),
							identifier(Transformer.ENUMS_NAME),
							identifier(Transformer.GLOBAL_NAME),
							identifier(Transformer.STDLIB_NAME),
							identifier(Transformer.VBSHELPER_NAME),
							identifier(Transformer.PLAYER_NAME),
						],
					),
				)),
		]);
	}
}
