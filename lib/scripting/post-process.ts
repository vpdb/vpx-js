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

import {
	EmptyStatement,
	Expression,
	ExpressionStatement,
	ForStatement,
	FunctionDeclaration,
	Identifier,
	IfStatement,
	Literal,
	MemberExpression,
	Statement,
	UnaryExpression,
	VariableDeclaration,
	VariableDeclarator,
} from 'estree';
import { inspect } from 'util';
import * as estree from './estree';

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
export function optionExplicit(result: [string, null, string]): EmptyStatement {
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
export function dimDecl(result: [string, null, VariableDeclarator[]]): VariableDeclaration {
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
export function dimVarList(result: [ DimVarListResult, DimVarListResult[] ]): VariableDeclarator[] {
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
export function constDecl(result: [string, null, VariableDeclarator[]]): VariableDeclaration {
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
export function constVarList(result: [ ConstVarListResult, ConstVarListResult[] ]): VariableDeclarator[] {
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
export function subCallStmt(result: [MemberExpression, null, Literal?, null?, UnaryExpression[]?]): ExpressionStatement {
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
export function subDecl(result: [string, null, Identifier, MethodArgListResult[], null, Statement[]?]): FunctionDeclaration {
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
export function methodArgList(result: [string, null | string, Identifier, Identifier[], null, string]): Identifier[] {
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
export function assignStmt(result: [Identifier, null, '=', null, Literal | UnaryExpression]): ExpressionStatement {
	const left = result[0];
	const operator = result[2];
	const right = result[4];
	return estree.assignmentExpressionStatement(left, operator, right);
}

/**
 * Grammar:
 * ```
 * IfStmt -> "If" _ Expr _ "Then" NL BlockStmt:* ElseStmt:? _ "End" _ "If" NL
 * ```
 * Result:
 * ```
 * [
 *   "If",
 *   null,
 *   {
 *     "type": "BinaryExpression",
 *     "operator": "==",
 *     "left": { "type": "Identifier", "name": "DayOfWeek" },
 *     "right": { "type": "Literal", "value": "MON" }
 *   },
 *   null,
 *   "Then",
 *   [[["\n"]]],
 *   [
 *     {
 *       "type": "ExpressionStatement",
 *       "expression": {
 *         "type": "AssignmentExpression",
 *         "left": { "type": "Identifier", "name": "Day" },
 *         "operator": "=",
 *         "right": { "type": "Literal", "value": 1 }
 *       }
 *     }
 *   ],
 *   {
 *     "type": "IfStatement",
 *     "test": {
 *       "type": "BinaryExpression",
 *       "operator": "==",
 *       "left": { "type": "Identifier", "name": "DayOfWeek" },
 *       "right": { "type": "Literal", "value": "TUE" }
 *     },
 *     "consequent": {
 *       "type": "BlockStatement",
 *       "body": [
 *         {
 *           "type": "ExpressionStatement",
 *           "expression": {
 *             "type": "AssignmentExpression",
 *             "left": { "type": "Identifier", "name": "Day" },
 *             "operator": "=",
 *             "right": { "type": "Literal", "value": 2 }
 *           }
 *         }
 *       ]
 *     },
 *     "alternate": {
 *       "type": "IfStatement",
 *       "test": {
 *         "type": "BinaryExpression",
 *         "operator": "==",
 *         "left": { "type": "Identifier", "name": "DayOfWeek" },
 *         "right": { "type": "Literal", "value": "WED" }
 *       },
 *       "consequent": {
 *         "type": "BlockStatement",
 *         "body": [
 *           {
 *             "type": "ExpressionStatement",
 *             "expression": {
 *               "type": "AssignmentExpression",
 *               "left": { "type": "Identifier", "name": "Day" },
 *               "operator": "=",
 *               "right": { "type": "Literal", "value": 3 }
 *             }
 *           }
 *         ]
 *       },
 *       "alternate": null
 *     }
 *   },
 *   null,
 *   "End",
 *   null,
 *   "If",
 *   [[["\n"]]]
 * ]
 * ```
 */
export function ifStmt(result: [string, null, Expression, null, string, null, [Statement], Statement]): IfStatement {
	const test = result[2];
	const consequent = estree.blockStatement(result[6]);
	const alternate = result[7];
	return estree.ifStatement(test, consequent, alternate);
}

/**
 * Grammar:
 * ```
 * ForStmt -> "For" _ ExtendedID _ "=" _ Expr _ "To" _ Expr _ StepOpt:? NL BlockStmt:* _ "Next" NL
 * ```
 * Result:
 * ```
 * [
 *   "For",
 *   null,
 *   { "type": "Identifier", "name": "j" },
 *   null,
 *   "=",
 *   null,
 *   { "type": "Literal", "value": 2 },
 *   null,
 *   "To",
 *   null,
 *   { "type": "Literal", "value": 10 },
 *   null,
 *   { "type": "Literal", "value": 2 },
 *   [[["\n"]]],
 *   [
 *     {
 *       "type": "ExpressionStatement",
 *       "expression": {
 *         "type": "AssignmentExpression",
 *         "left": { "type": "Identifier", "name": "total" },
 *         "operator": "=",
 *         "right": {
 *           "type": "BinaryExpression",
 *           "operator": "+",
 *           "left": { "type": "Identifier", "name": "total" },
 *           "right": { "type": "Literal", "value": 1 }
 *         }
 *       }
 *     }
 *   ],
 *   null,
 *   "Next",
 *   [[["\n"]]]
 * ]
 * ```
 */
export function forStmt(result: ['For', null, Identifier, null, '=', null, Expression, null, 'To', null, Expression, null, Expression, null, [Statement]]): ForStatement {
	const identifier = result[2];
	const init = result[6];
	const test = result[10];
	const step = result[12] ? result[12] : estree.literal(1);
	const body = result[14] || [];

	return estree.forStatement(
		estree.assignmentExpression(identifier, '=', init),
		null,
		estree.assignmentExpression(identifier, '+=', step),
		estree.blockStatement([...body,
			estree.ifStatement(
				estree.binaryExpression('==', identifier, test),
				estree.blockStatement([estree.breakStatement()]),
			)]),
	);
}

/**
 * Grammar:
 * ```
 * IntDivExpr -> IntDivExpr _ "\\" _ MultExpr
 * ```
 * Result:
 * ```
 * [
 *   { "type": "Identifier", "name": "EnableBallControl" },
 *   null,
 *   "\\",
 *   null,
 *   { "type": "Literal", "value": 2 }
 * ]
 * ```
 */

export function intDivExpr(result: [Expression | Literal, null, '\\', null, Expression | Literal]): ExpressionStatement  {
	const leftExpr = result[0] ? [result[0]] : [];
	const rightExpr = result[4] ? [result[4]] : [];
	const mathFloorExpression = estree.memberExpression(estree.identifier('Math'), estree.identifier('floor'));
	return estree.callExpressionStatement(mathFloorExpression, [
		estree.binaryExpression('/',
			estree.callExpression(mathFloorExpression, leftExpr),
			estree.callExpression(mathFloorExpression, rightExpr)),
	]);
}

/**
 * Grammar:
 * ```
 * EqvExpr -> EqvExpr _ "Eqv" _ XorExpr
 * ```
 * Result:
 * ```
 * [{ "type": "Literal", "value": 10 }, null, "Eqv", null, { "type": "Literal", "value": 8 }]
 * ```
 */

export function eqvExpr(result: [Expression | Literal, null, 'Eqv', null, Expression | Literal]): UnaryExpression {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.unaryExpression('~',
		estree.binaryExpression('^', leftExpr, rightExpr));
}

/**
 * Grammar:
 * ```
 * ExpExpr -> Value _ "^" _ ExpExpr
 * ```
 * Result:
 * ```
 * [
 *   { "type": "Identifier", "name": "EnableBallControl" },
 *   null,
 *   "^",
 *   null,
 *   { "type": "Literal", "value": 2 }
 * ]
 * ```
 */

export function expExpr(result: [Expression | Literal, null, '^', null, Expression | Literal]): ExpressionStatement {
	const leftExpr = result[0];
	const rightExpr = result[4];
	return estree.callExpressionStatement(
		estree.memberExpression(estree.identifier('Math'), estree.identifier('pow')), [
		leftExpr,
		rightExpr,
	]);
}

/* istanbul ignore next */
/**
 * This just prints out what's given.
 * @example `debug(arguments);`
 * @param x anything
 */
function debug(x: any) {
	// tslint:disable-next-line:no-console
	return console.log(inspect(x, { depth: null, colors: true }));
}
