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

import { Program } from 'estree';
import { Transformer } from './transformer';

/**
 * Since function declarations are converted to expressions, we need to declare
 * before we use them.
 *
 * This hoists all function declarations of the root body to the top.
 */
export class FunctionHoistTransformer extends Transformer {

	constructor(ast: Program) {
		super(ast);
	}

	public transform(): Program {
		const functions: any[] = [];
		const others: any[] = [];
		for (const node of this.ast.body) {
			if (node.type === 'FunctionDeclaration') {
				functions.push(node);
			} else {
				others.push(node);
			}
		}
		this.ast.body = functions.concat(...others);
		return this.ast;
	}
}
