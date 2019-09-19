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

import { BlockStatement, Expression, SwitchCase, SwitchStatement } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt(
	result: [
		Token,
		null,
		Token,
		null,
		Expression,
		null,
		null,
		SwitchCase[][],
		null,
		SwitchCase,
		null,
		Token,
		null,
		Token,
		null,
	],
): SwitchStatement {
	const discriminant = result[4];
	const caseStatements = result[7];
	const caseElseStatement = result[9] || [];
	const cases = ([] as SwitchCase[]).concat(...caseStatements, caseElseStatement);
	return estree.switchStatement(discriminant, cases);
}

export function caseStmt1(result: [Token, null, Expression, null, Expression[], null, BlockStatement]): SwitchCase[] {
	const test = [result[2]];
	const otherTests = result[4] || [];
	const tests = [...test, ...otherTests];
	const consequent = result[6].body;
	const switchCases = [] as SwitchCase[];
	tests.forEach((val, key, arr) => {
		if (Object.is(tests.length - 1, key)) {
			switchCases.push(estree.switchCase(val, [...consequent, estree.breakStatement()]));
		} else {
			switchCases.push(estree.switchCase(val, []));
		}
	});
	return switchCases;
}

export function caseStmt2(result: [Token, null, Expression, null, Expression[], BlockStatement]): SwitchCase[] {
	const test = [result[2]];
	const otherTests = result[4] || [];
	const tests = [...test, ...otherTests];
	const consequent = result[5].body;
	const switchCases = [] as SwitchCase[];
	tests.forEach((val, key, arr) => {
		if (Object.is(tests.length - 1, key)) {
			switchCases.push(estree.switchCase(val, [...consequent, estree.breakStatement()]));
		} else {
			switchCases.push(estree.switchCase(val, []));
		}
	});

	return switchCases;
}

export function caseElseStmt1(result: [Token, null, Token, null, BlockStatement]): SwitchCase {
	const consequent = result[4].body;
	return estree.switchCase(null, consequent);
}

export function caseElseStmt2(result: [Token, null, Token, BlockStatement]): SwitchCase {
	const consequent = result[3].body;
	return estree.switchCase(null, consequent);
}
