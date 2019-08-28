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

import { Identifier, Literal, MemberExpression, Statement, UnaryExpression, VariableDeclarator } from 'estree';
import { inspect } from 'util';

import * as estree from './estree'; // use the namespace to avoid clashes

/**
 * Grammar:
 * ```
 * OptionExplicit -> "Option" __ "Explicit" NL
 * ```
 * Example: `Option Explicit\n`
 * Result:
 * ```
 * ["Option", null, "Explicit", [[["\n"]]]]
 * ```
 */

export function optionExplicit(result: [string, null, string]) {
	const option = result[0];
	const explicit = result[2];
	return estree.emptyStatement(
		[],
		[estree.comment('Block', ' ' + option + ' ' + explicit + ' ')],
	);
}

/**
 * Grammar:
 * ```
 * DimDecl -> "Dim" __ DimVarList NL
 * ```
 * Example: `Dim test1, test2, test3\n`
 * Result:
 * ```
 * [
 *   "Dim",
 *   null,
 *   [
 *     { "type": "VariableDeclarator", "id": { "type": "Identifier", "name": "test1" }, "init": null },
 *     { "type": "VariableDeclarator", "id": { "type": "Identifier", "name": "test2" }, "init": null },
 *     { "type": "VariableDeclarator", "id": { "type": "Identifier", "name": "test3" }, "init": null }
 *   ],
 *   [[["\n"]]]
 * ]
 * ```
 */

export function dimDecl(result: [string, null, VariableDeclarator[]]) {
	const declarations = result[2];
	return estree.variableDeclaration(
		'let',
		declarations,
	);
}

/**
 * Grammar:
 * ```
 * DimVarList -> DimVarName DimOtherVars:*
 * ```
 * Result:
 * ```
 * [
 *   { "type": "Identifier", "name": "test1" },
 *   [{ "type": "Identifier", "name": "test2" }, { "type": "Identifier", "name": "test3" }]
 * ]
 * ```
 */

export function dimVarList(result: [ DimVarListResult, DimVarListResult[] ]) {
	const firstVar = result[0];
	const otherVars = result[1] || [];

	return [firstVar, ...otherVars].map(declaration => {
		return estree.variableDeclarator(declaration, null);  // can't assign values with Dim
	});
}
type DimVarListResult = Identifier;

/**
 * Grammar:
 * ```
 * ConstDecl -> "Const" __ ConstVarList:+ NL
 * ```
 * Example: `Const test1 = 3.14, test2 = 4, test3 = "TEST", test4 = -5.2\n`
 * Result:
 * ```
 * [
 *   "Const",
 *   null,
 *   [
 *     {
 *       "type": "VariableDeclarator",
 *       "id": { "type": "Identifier", "name": "test1" },
 *       "init": { "type": "Literal", "value": 3.14 }
 *     },
 *     {
 *       "type": "VariableDeclarator",
 *       "id": { "type": "Identifier", "name": "test2" },
 *       "init": { "type": "Literal", "value": 4 }
 *     },
 *     {
 *       "type": "VariableDeclarator",
 *       "id": { "type": "Identifier", "name": "test3" },
 *       "init": { "type": "Literal", "value": "TEST" }
 *     },
 *     {
 *       "type": "VariableDeclarator",
 *       "id": { "type": "Identifier", "name": "test4" },
 *       "init": { "type": "Literal", "value": -5.2 }
 *     }
 *   ],
 *   [[["\n"]]]
 * ]
 * ```
 */

export function constDecl(result: [string, null, VariableDeclarator[]]) {
	const declarations = result[2];
	return estree.variableDeclaration(
		'const',
		declarations,
	);
}

/**
 * Grammar:
 * ```
 * ConstVarList -> ConstVarNameValue ConstOtherVars:*
 * ```
 * Result:
 * ```
 * [
 *   [{ "type": "Identifier", "name": "test1" }, null, "=", null, { "type": "Literal", "value": 3.14 }],
 *   [
 *     [{ "type": "Identifier", "name": "test2" }, null, "=", null, { "type": "Literal", "value": 4 }],
 *     [{ "type": "Identifier", "name": "test3" }, null, "=", null, { "type": "Literal", "value": "TEST" }],
 *     [
 *       { "type": "Identifier", "name": "test4" },
 *       null,
 *       "=",
 *       null,
 *       {
 *         "type": "UnaryExpression",
 *         "operator": "-",
 *         "prefix": true,
 *         "argument": { "type": "Literal", "value": 5.2 }
 *       }
 *     ]
 *   ]
 * ]
 * ```
 */

export function constVarList(result: [ ConstVarListResult, ConstVarListResult[] ]) {
	const firstVar = result[0];
	const otherVars = result[1] || [];

	return [firstVar, ...otherVars].map((declaration) => {
		return estree.variableDeclarator(declaration[0], declaration[4]);
	});
}
type ConstVarListResult = [Identifier, null, string, null, Literal | UnaryExpression];

/**
 * Grammar:
 * ```
 * SubCallStmt -> QualifiedID __ SubSafeExprOpt _ CommaExprList:*
 * ```
 * Example: `BallRelease.KickBall 0, -2\n`
 * Result:
 * ```
 * [
 *   {
 *     "type": "MemberExpression",
 *     "object": { "type": "Identifier", "name": "BallRelease" },
 *     "property": { "type": "Identifier", "name": "KickBall" },
 *     "computed": false
 *   },
 *   null,
 *   { "type": "Literal", "value": 0 },
 *   null,
 *   [
 *     {
 *       "type": "UnaryExpression",
 *       "operator": "-",
 *       "prefix": true,
 *       "argument": { "type": "Literal", "value": 2 }
 *     }
 *   ]
 * ]
 * ```
 * @todo Literal and UnaryExpression will be more generic in the future!
 */

export function subCallStmt(result: [MemberExpression, null, Literal?, null?, UnaryExpression[]?]) {
	const callee = result[0];
	const firstArg = result[2] ? [result[2]] : []; // array, so we can easily spread below
	const otherArgs = result[4] || [];
	return estree.callExpressionStatement(callee, [...firstArg, ...otherArgs]);
}

/**
 * Grammar:
 * ```
 * SubDecl -> "Sub" __ ExtendedID MethodArg:* NL MethodStmt:* _ "End" __ "Sub" NL
 * ```
 * Example: `Sub BallRelease_Hit(value1, value2, value3)\n    BallRelease.CreateBall\nEnd Sub\n`
 * Result:
 * ```
 * [
 *   "Sub",
 *   null,
 *   { "type": "Identifier", "name": "BallRelease_Hit" },
 *   [
 *     { "type": "Identifier", "name": "value1" },
 *     { "type": "Identifier", "name": "value2" },
 *     { "type": "Identifier", "name": "value3" }
 *   ],
 *   [[["\n"]]],
 *   [
 *     {
 *       "type": "ExpressionStatement",
 *       "expression": {
 *         "type": "CallExpression",
 *         "callee": {
 *           "type": "MemberExpression",
 *           "object": { "type": "Identifier", "name": "BallRelease" },
 *           "property": { "type": "Identifier", "name": "CreateBall" },
 *           "computed": false
 *         },
 *         "arguments": [ ]
 *       }
 *     }
 *   ],
 *   null,
 *   "End",
 *   null,
 *   "Sub",
 *   [[["\n"]]]
 * ]
 * ```
 */

export function subDecl(result: [string, null, Identifier, MethodArgListResult[], null, Statement[]?]) {
	const name = result[2];
	const params = result[3];
	const statements = result[5] || [];

	return estree.functionDeclaration(name, params, statements);
}
type MethodArgListResult = Identifier;

/**
 * Grammar:
 * ```
 * MethodArgList -> "(" _ Arg OtherArgsOpt:* _ ")
 *                | "(" ")"
 * ```
 * Result:
 * ```
 * [
 *   "(",
 *   null,
 *   { "type": "Identifier", "name": "value1" },
 *   [{ "type": "Identifier", "name": "value2" }, { "type": "Identifier", "name": "value3" }],
 *   null,
 *   ")"
 * ]
 * ```
 */

export function methodArgList(result: [string, null | string, Identifier, Identifier[], null, string]) {
	const firstArg = result[2] ? [result[2]] : []; // array, so we can easily spread below
	const otherArgs = result[3] || [];

	return [...firstArg, ...otherArgs];
}

/**
 * Grammar:
 * ```
 * AssignStmt -> LeftExpr _ "=" _ Expr
 * ```
 * Result:
 * ```
 * [
 *   { "type": "Identifier", "name": "EnableBallControl" },
 *   null,
 *   "=",
 *   null,
 *   { "type": "Literal", "value": 0 }
 * ]
 * ```
 */

export function assignStmt(result: [Identifier, null, '=', null, Literal | UnaryExpression]) {
	const left = result[0];
	const operator = result[2];
	const right = result[4];

	return estree.assignmentExpressionStatement(left, operator, right);
}

/**
 * This just prints out what's given.
 * @example `debug(arguments);`
 * @param x anything
 */
function debug(x: any) {
	// tslint:disable-next-line:no-console
	return console.log(inspect(x, { depth: null, colors: true }));
}
