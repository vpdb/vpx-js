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
import { BaseNode, Expression, ExpressionStatement, Identifier, Program, VariableDeclaration } from 'estree';
import {
	assignmentExpression,
	classExpression,
	expressionStatement,
	functionExpression,
	identifier,
	literal,
	memberExpression,
} from '../estree';
import { Transformer } from './transformer';

/**
 * In VBScript, running `ExecuteGlobal()` is like including code directly where
 * that statement was called. For example, a variable declared in the executed
 * code is persisted into the calling context.
 *
 * In JavaScript when using the `eval()` method, this only applies when strict
 * mode is *not* enabled. However, we would like to support strict mode.
 *
 * This transformer wraps all root execution context variables into an object.
 * Evaluated scripts will use the same object name and thus persist new
 * variables into the calling context.
 *
 * A nice side-effect of this is that in tests, we can supply an existing scope
 * and assert against it afterwards.
 */
export class ScopeTransformer extends Transformer {

	constructor(ast: Program) {
		super(ast, true);
	}

	public transform(): Program {
		this.addScope();
		this.replaceDeclarations();
		this.replaceUsages();
		return this.ast;
	}

	/**
	 * Replaces declarations with member assignments.
	 *
	 * This checks whether the node's scope is the same as the root scope, and
	 * replaces it with a member assignment of the scope object if that's the
	 * case.
	 */
	private replaceDeclarations(): void {
		let i = 0;
		replace(this.ast, {
			enter: (node, parent) => {
				i++;

				//console.log(`%s %s [%s]`, new Array(i).map(v => '').join('  '), node.type,  (node as any).name || '', (node as any).__scope.constructor.name);

				// class declarations
				if (node.type === 'ClassDeclaration') {
					return this.wrapAssignment(
						node.id!,
						classExpression(node.body, node),
						node,
					);
				}

				if (this.isRootScope(node)) {
					// variable declarations
					const isLoopVarDecl = parent && /^For.*Statement$/.test(parent.type);
					if (node.type === 'VariableDeclaration' && !isLoopVarDecl) {
						const declarationNode = node as VariableDeclaration;
						const nodes = [];
						for (const declaration of declarationNode.declarations as any[]) {
							nodes.push(this.wrapAssignment(
								identifier(declaration.id ? declaration.id.name : declaration.name, node), // fixme
								declaration.init || literal(null, undefined, node),
								node,
							));
						}
						return this.replaceMany(nodes, node);
					}

					// function declarations
					if (node.type === 'FunctionDeclaration') {
						return this.wrapAssignment(
							node.id!,
							functionExpression(
								node.body,
								node.params,
								node,
							),
							node,
						);
					}
				}
				return node;
			},
			leave: () => { i--; },
		});
	}

	/**
	 * This replaces usages of root scope identifiers with members of the
	 * scope object.
	 *
	 * Note that we're getting a lot more identifiers than the declarations
	 * we've replaced above, so we need to know what we need to replace. We do
	 * that by looking at the identifier and making sure it's declared in the
	 * root scope.
	 *
	 * However, that won't cut it, because an `ExecuteGlobal`ed script might
	 * have declared it, and we only know that at runtime. So, in order to
	 * assume that an identifier actually *was* declared in such an included
	 * script, we look at the other references and make sure it's not one of
	 * them.
	 *
	 * That's relatively easy, because the other reference are already wrapped
	 * into their respective objects by the {@link ReferenceTransformer}.
	 *
	 * So the condition to replace is:
	 *    1. Is in root scope or has unknown scope
	 *    2. Is *not* part of the "known" objects
	 */
	private replaceUsages() {
		replace(this.ast, {
			enter: (node, parent: any) => {
				if (node.type === 'Identifier' && node.name !== 'undefined') {

					// ignore identifiers we added ourselves
					if ([Transformer.STDLIB_NAME, Transformer.SCOPE_NAME, Transformer.ENUMS_NAME, Transformer.GLOBAL_NAME, Transformer.ITEMS_NAME, Transformer.PLAYER_NAME, Transformer.VBSHELPER_NAME].includes(node.name)) {
						return node;
					}

					// ignore "this"
					if (parent && parent.type === 'MemberExpression' && parent.object.type === 'ThisExpression') {
						return node;
					}

					const varScope = this.findScope(this.getVarName(node, parent), (node as any).__scope);
					const inRootScope = !varScope || varScope === this.rootScope; // !varScope because we can't find the declaration, in which case it's part of an external file, where we assume it was declared in the root scope.
					if (!this.isKnown(node, parent) && inRootScope) {
						if (parent && !['FunctionDeclaration', 'FunctionExpression', 'ClassDeclaration', 'MethodDefinition', 'VariableDeclarator'].includes(parent.type)) {
							return memberExpression(
								identifier(Transformer.SCOPE_NAME, node),
								node,
								false,
								node,
							);
						}
					}
				}
				return node;
			},
		});
	}

	private wrapAssignment(left: Identifier, right: Expression, node?: BaseNode): ExpressionStatement {
		return expressionStatement(
			assignmentExpression(
				memberExpression(
					identifier(Transformer.SCOPE_NAME, node),
					left,
					false,
					node,
				),
				'=',
				right,
				node,
			),
			node,
		);
	}

	private getVarName(node: any, parent: any): string {
		if (parent && parent.type === 'MemberExpression') {
			return this.getTopMemberName(parent);
		}
		return node.name;
	}

	private findScope(name: string, currentScope: any): any {
		if (!currentScope) {
			return null;
		}
		const variable = currentScope.variables.find((v: any) => v.name === name);
		return variable ? currentScope : this.findScope(name, currentScope.upper);
	}
}
