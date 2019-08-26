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

import { Identifier, Literal, MemberExpression, Statement, UnaryExpression } from 'estree';
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
 * [
 *    "Option",
 *    null,
 *    "Explicit",
 *    [
 *       [
 *          [
 *             "\n"
 *          ]
 *       ]
 *    ]
 * ]
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
 * VarDecl -> "Dim" __ VarName OtherVarsOpt:* NL
 * ```
 * Example: `Dim test1, test2, test3\n`
 * Result:
 * ```
 * [
 *    "Dim",
 *    null,
 *    {
 *       "type":"Identifier",
 *       "name":"test1"
 *    },
 *    [
 *       {
 *          "type":"Identifier",
 *          "name":"test2"
 *       },
 *       {
 *          "type":"Identifier",
 *          "name":"test3"
 *       }
 *    ],
 *    [
 *       [
 *          [
 *             "\n"
 *          ]
 *       ]
 *    ]
 * ]
 * ```
 */

export function varDecl(result: [string, null, Identifier, Identifier[]]) {
	const firstName = result[2];
	const otherNames = result[3];
	return estree.variableDeclaration(
		'let',
		[firstName, ...otherNames].map(name => [name, null]), // can't assign values with Dim
	);
}

/**
 * Grammar:
 * ```
 * ConstDecl -> "Const" __ ConstNameValue OtherConstantsOpt:* NL
 * ```
 * Example: `Const test1 = 3.14, test2 = 4, test3 = "TEST", test4 = -5.2\n`
 * Result:
 * ```
 * [
 *    "Const",
 *    null,
 *    [
 *       {
 *          "type":"Identifier",
 *          "name":"test1"
 *       },
 *       null,
 *       "=",
 *       null,
 *       {
 *          "type":"Literal",
 *          "value":3.14
 *       }
 *    ],
 *    [
 *       [
 *          {
 *             "type":"Identifier",
 *             "name":"test2"
 *          },
 *          null,
 *          "=",
 *          null,
 *          {
 *             "type":"Literal",
 *             "value":4
 *          }
 *       ],
 *       [
 *          {
 *             "type":"Identifier",
 *             "name":"test3"
 *          },
 *          null,
 *          "=",
 *          null,
 *          {
 *             "type":"Literal",
 *             "value":"TEST"
 *          }
 *       ],
 *       [
 *          {
 *             "type":"Identifier",
 *             "name":"test4"
 *          },
 *          null,
 *          "=",
 *          null,
 *          {
 *             "type":"Literal",
 *             "value":-5.2
 *          }
 *       ]
 *    ],
 *    [
 *       [
 *          [
 *             "\n"
 *          ]
 *       ]
 *    ]
 * ]
 * ```
 */

export function constDecl(result: [string, null, ConstDeclResult, ConstDeclResult[]]) {
	const firstDecl = result[2];
	const otherDecls = result[3];
	const decls: ConstDeclResult[] = [firstDecl, ...otherDecls];
	return estree.variableDeclaration(
		'const',
		decls.map((decl: ConstDeclResult) => [decl[0], decl[4]]),
	);
}
type ConstDeclResult = [Identifier, null, string, null, Literal];

/**
 * Grammar:
 * ```
 * SubCallStmt -> QualifiedID __ SubSafeExprOpt _ CommaExprList:*
 * ```
 * Example: `BallRelease.KickBall 0, -2\n`
 * Result:
 * ```
 * [
 *    {
 *       "type":"MemberExpression",
 *       "object":{
 *          "type":"Identifier",
 *          "name":"BallRelease"
 *       },
 *       "property":{
 *          "type":"Identifier",
 *          "name":"KickBall"
 *       },
 *       "computed":false
 *    },
 *    null,
 *    {
 *       "type":"Literal",
 *       "value":0
 *    },
 *    null,
 *    [
 *       {
 *          "type":"UnaryExpression",
 *          "operator":"-",
 *          "prefix":true,
 *          "argument":{
 *             "type":"Literal",
 *             "value":2
 *          }
 *       }
 *    ]
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
 *    "Sub",
 *    null,
 *    {
 *       "type":"Identifier",
 *       "name":"BallRelease_Hit"
 *    },
 *    [
 *       [
 *          {
 *             "type":"Identifier",
 *             "name":"value1"
 *          },
 *          [
 *             {
 *                "type":"Identifier",
 *                "name":"value2"
 *             },
 *             {
 *                "type":"Identifier",
 *                "name":"value3"
 *             }
 *          ]
 *       ]
 *    ],
 *    [
 *       [
 *          [
 *             "\n"
 *          ]
 *       ]
 *    ],
 *    [
 *       {
 *          "type":"ExpressionStatement",
 *          "expression":{
 *             "type":"CallExpression",
 *             "callee":{
 *                "type":"MemberExpression",
 *                "object":{
 *                   "type":"Identifier",
 *                   "name":"BallRelease"
 *                },
 *                "property":{
 *                   "type":"Identifier",
 *                   "name":"CreateBall"
 *                },
 *                "computed":false
 *             },
 *             "arguments":[
 *             ]
 *          }
 *       }
 *    ],
 *    null,
 *    "End",
 *    null,
 *    "Sub",
 *    [
 *       [
 *          [
 *             "\n"
 *          ]
 *       ]
 *    ]
 * ]
 * ```
 */

export function subDecl(result: [null, null, Identifier, [[Identifier, Identifier[]]], null, Statement[]?]) {
	const name = result[2];
	const params = result[3][0];
	const firstParam = params[0] ? [params[0]] : [];
	const otherParams = params[1] || [];
	const statements = result[5] || [];
	return estree.functionDeclaration(name,
		[...firstParam, ...otherParams], statements);
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
