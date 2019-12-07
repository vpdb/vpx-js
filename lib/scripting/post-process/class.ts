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
import {
	BlockStatement,
	ClassBody,
	FunctionDeclaration,
	Identifier,
	MethodDefinition,
	Statement,
	VariableDeclaration,
} from 'estree';
import {
	assignmentExpression,
	blockStatement,
	classBody,
	classDeclaration,
	expressionStatement,
	functionExpression,
	identifier,
	memberExpression,
	methodDefinition,
	returnStatement,
	thisExpression,
	variableDeclaration,
	variableDeclarator,
} from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppClass(node: ESIToken): any {
	switch (node.type) {
		case 'ClassDeclaration':
			return ppClassDeclaration(node);
		case 'ConstructorMemberDeclaration':
			return ppConstructorMemberDeclaration(node);
		case 'RegularPropertyMemberDeclaration':
			return ppRegularPropertyMemberDeclaration(node);
		case 'PropertyGetDeclaration':
			return ppPropertyGetDeclaration(node);
		case 'PropertyLetDeclaration':
			return ppPropertyLetDeclaration(node);
		case 'PropertySetDeclaration':
			return ppPropertySetDeclaration(node);
	}
	return null;
}

function ppClassDeclaration(node: ESIToken): any {
	let id = identifier('undefined');
	let constructor: MethodDefinition | undefined;
	const methodDefinitions: MethodDefinition[] = [];
	const varStmts: Statement[] = [];
	const ids: string[] = [];
	for (const child of node.children) {
		if (child.type === 'Identifier') {
			id = child.estree;
		} else if (child.type === 'ClassMemberDeclaration') {
			const memberDecl = child.children[0];
			if (memberDecl.type === 'ConstructorMemberDeclaration') {
				constructor = memberDecl.estree;
			} else if (memberDecl.type === 'MethodMemberDeclaration') {
				const functionDecl = memberDecl.estree as FunctionDeclaration;
				const functionId = functionDecl.id as Identifier;
				methodDefinitions.push(
					methodDefinition(functionId, 'method', functionExpression(functionDecl.body, functionDecl.params)),
				);
				ids.push(functionId.name);
			} else if (memberDecl.type === 'PropertyMemberDeclaration') {
				methodDefinitions.push(memberDecl.estree);
			} else if (
				memberDecl.type === 'VariableMemberDeclaration' ||
				memberDecl.type === 'ConstantMemberDeclaration'
			) {
				for (const varDecl of (memberDecl.estree as VariableDeclaration).declarations) {
					const varId = varDecl.id as Identifier;
					varStmts.push(
						expressionStatement(
							assignmentExpression(
								memberExpression(thisExpression(), varId),
								'=',
								varDecl.init ? varDecl.init : identifier('undefined'),
							),
						),
					);
					ids.push(varId.name);
				}
			}
		}
	}
	if (!constructor) {
		constructor = methodDefinition(
			identifier('constructor'),
			'constructor',
			functionExpression(blockStatement([]), []),
		);
	}
	let body: ClassBody = classBody([constructor, ...methodDefinitions]);
	body = replace(body, {
		leave: (bodyNode, parentNode) => {
			if (bodyNode.type === 'Identifier') {
				if (parentNode !== null && parentNode.type !== 'MethodDefinition') {
					if (ids.includes(bodyNode.name)) {
						if (parentNode.type === 'MemberExpression') {
							if (parentNode.object.type === 'Identifier') {
								if (parentNode.object.name === bodyNode.name) {
									return memberExpression(thisExpression(), bodyNode);
								}
							}
						} else {
							return memberExpression(thisExpression(), bodyNode);
						}
					}
				}
			}
		},
	}) as ClassBody;
	body.body[0].value.body.body.unshift(...varStmts);
	return classDeclaration(id, body);
}

function ppConstructorMemberDeclaration(node: ESIToken): any {
	let block: BlockStatement | undefined;
	for (const child of node.children) {
		if (child.type === 'Block') {
			block = child.estree;
		}
	}
	return methodDefinition(
		identifier('constructor'),
		'constructor',
		functionExpression(block ? block : blockStatement([]), []),
	);
}

function ppRegularPropertyMemberDeclaration(node: ESIToken): any {
	return node.children[1].estree;
}

function ppPropertyGetDeclaration(node: ESIToken): any {
	let id: Identifier = identifier('undefined');
	let params: Identifier[] = [];
	let block: BlockStatement | undefined;
	for (const child of node.children) {
		if (child.type === 'Identifier') {
			id = child.estree;
		} else if (child.type === 'ParameterList') {
			params = child.estree;
		} else if (child.type === 'Block') {
			block = child.estree;
		}
	}
	if (block) {
		block = replace(block, {
			enter: blockNode => {
				if (blockNode.type === 'ReturnStatement') {
					blockNode.argument = id;
					return blockNode;
				}
			},
		}) as BlockStatement;
	} else {
		block = blockStatement([]);
	}
	block.body.unshift(variableDeclaration('let', [variableDeclarator(id, identifier('undefined'))]));
	if (block.body[block.body.length - 1].type !== 'ReturnStatement') {
		block.body.push(returnStatement(id));
	}
	return methodDefinition(id, 'get', functionExpression(block, params));
}

function ppPropertyLetDeclaration(node: ESIToken): any {
	let id: Identifier = identifier('undefined');
	let params: Identifier[] = [];
	let block: BlockStatement | undefined;
	for (const child of node.children) {
		if (child.type === 'Identifier') {
			id = child.estree;
		} else if (child.type === 'ParameterList') {
			params = child.estree;
		} else if (child.type === 'Block') {
			block = child.estree;
		}
	}
	return methodDefinition(id, 'set', functionExpression(block ? block : blockStatement([]), params));
}

function ppPropertySetDeclaration(node: ESIToken): any {
	let id: Identifier = identifier('undefined');
	let params: Identifier[] = [];
	let block: BlockStatement | undefined;
	for (const child of node.children) {
		if (child.type === 'Identifier') {
			id = child.estree;
		} else if (child.type === 'ParameterList') {
			params = child.estree;
		} else if (child.type === 'Block') {
			block = child.estree;
		}
	}
	return methodDefinition(id, 'set', functionExpression(block ? block : blockStatement([]), params));
}
