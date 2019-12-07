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

import { replace } from 'estraverse';
import { BlockStatement } from 'estree';
import { identifier, memberExpression } from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppWith(node: ESIToken): any {
	switch (node.type) {
		case 'WithStatement':
			return ppWithStatement(node);
	}
	return null;
}

function ppWithStatement(node: ESIToken): any {
	let estree: any = [];
	const expr = node.children[0].estree;
	for (const child of node.children) {
		if (child.type === 'Block') {
			const block = replace(child.estree, {
				leave: blockNode => {
					if (blockNode.type === 'Identifier') {
						if (blockNode.name.startsWith('.')) {
							return memberExpression(expr, identifier(blockNode.name.substr(1)));
						}
					}
				},
			});
			estree = (block as BlockStatement).body;
		}
	}
	return estree;
}
