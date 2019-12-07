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

import { identifier, literal, newExpression } from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppLiteral(node: ESIToken): any {
	switch (node.type) {
		case 'BooleanLiteral':
			return ppBooleanLiteral(node);
		case 'FloatingPointLiteral':
			return ppFloatingPointLiteral(node);
		case 'IntLiteral':
			return ppIntLiteral(node);
		case 'HexLiteral':
			return ppHexLiteral(node);
		case 'OctalLiteral':
			return ppOctalLiteral(node);
		case 'StringLiteral':
			return ppStringLiteral(node);
		case 'DateLiteral':
			return ppDateLiteral(node);
		case 'NothingLiteral':
			return ppNothingLiteral(node);
		case 'EmptyLiteral':
			return ppEmptyLiteral(node);
		case 'NullLiteral':
			return ppNullLiteral(node);
	}
	return null;
}

function ppBooleanLiteral(node: ESIToken): any {
	const value = node.text;
	return literal(value === 'True');
}

function ppFloatingPointLiteral(node: ESIToken): any {
	const value = node.text;
	return literal(parseFloat(value));
}

function ppIntLiteral(node: ESIToken): any {
	const value = node.text;
	return literal(parseInt(value, 10));
}

function ppHexLiteral(node: ESIToken): any {
	let value = node.text;
	value = '0x' + value.substr(2);
	return literal(parseInt(value, 16), value);
}

function ppOctalLiteral(node: ESIToken): any {
	let value = node.text;
	value = '0' + value.substr(2);
	return literal(parseInt(value, 8), value);
}

function ppStringLiteral(node: ESIToken): any {
	const value = node.text
		.slice(1, -1)
		.replace(/""/g, '"')
		.replace(/\\/g, '\\\\')
		.replace(/\t/g, '\\t');
	return literal(value);
}

function ppDateLiteral(node: ESIToken): any {
	const value = node.text.slice(1, -1);
	return newExpression(identifier('Date'), [literal(value)]);
}

function ppNothingLiteral(node: ESIToken): any {
	return identifier('undefined');
}

function ppEmptyLiteral(node: ESIToken): any {
	return literal(null);
}

function ppNullLiteral(node: ESIToken): any {
	return literal(null);
}
