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

import { replace, traverse } from 'estraverse';
import { Expression, ExpressionStatement, Identifier, Program, VariableDeclaration } from 'estree';
import {
	assignmentExpression,
	expressionStatement,
	functionExpression,
	identifier,
	literal,
	memberExpression,
} from '../estree';
import { Transformer } from './transformer';

const { analyze } = require('escope');

export class ScopeTransformer extends Transformer {

	private readonly scopeManager: any;
	private readonly rootScope: any;

	constructor(ast: Program) {
		super(ast);
		this.scopeManager = analyze(ast);
		this.rootScope = this.scopeManager.acquire(ast);
	}

	public transform(): Program {
		this.addScope();
		this.replaceDeclarations();
		this.replaceUsages();
		return this.ast;
	}

	private addScope(): void {
		let currentScope = this.rootScope;
		traverse(this.ast, {
			enter: node => {
				(node as any).__scope = currentScope;
				if (/Function/.test(node.type)) {
					currentScope = this.scopeManager.acquire(node);
				}
			},
			leave: node => {
				if (/Function/.test(node.type)) {
					currentScope = currentScope.upper;
				}
			},
		});
	}

	private replaceDeclarations(): void {
		replace(this.ast, {
			enter: (node, parent) => {
				const isLoopVarDecl = parent && /^For.*Statement$/.test(parent.type);
				const isRootScope = (node as any).__scope === this.rootScope;
				if (isRootScope) {

					// variables
					if (node.type === 'VariableDeclaration' && !isLoopVarDecl) {
						const declarationNode = node as VariableDeclaration;
						const nodes = [];
						for (const declaration of declarationNode.declarations as any[]) {
							nodes.push(this.wrapAssignment(
								identifier(declaration.id ? declaration.id.name : declaration.name), // fixme
								declaration.init || literal(null),
							));
						}
						return {
							type: 'Program',
							body: nodes,
						} as Program;
					}

					// function declarations
					if (node.type === 'FunctionDeclaration') {
						return this.wrapAssignment(
							node.id!,
							functionExpression(
								node.body,
								node.params,
							),
						);
					}
				}
				return node;
			},
		});
	}

	private replaceUsages() {
		replace(this.ast, {
			enter: (node, parent: any) => {

				if (node.type === 'Identifier') {
					const varScope = this.findScope(node.name, (node as any).__scope);
					const inRootScope = !varScope || varScope === this.rootScope; // !varScope because we can't find the declaration, in which case it's part of an external file, where we assume it was declared in the root scope.
					if (!this.isKnown(node, parent) && inRootScope) {
						if (parent && !['FunctionDeclaration', 'ClassDeclaration'].includes(parent.type)) {
							return memberExpression(
								identifier(Transformer.SCOPE_NAME),
								identifier(node.name),
							);
						}
					}
				}
				return node;
			},
		});
	}

	private wrapAssignment(left: Expression, right: Expression): ExpressionStatement {
		return expressionStatement(
			assignmentExpression(
				memberExpression(
					identifier(Transformer.SCOPE_NAME),
					left,
				),
				'=',
				right,
			),
		);
	}

	private findScope(name: string, currentScope: any): any {
		if (!currentScope) {
			return null;
		}
		const variable = currentScope.variables.find((v: any) => v.name === name);
		return variable ? currentScope : this.findScope(name, currentScope.upper);
	}
}
