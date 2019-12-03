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

import { Grammars, IToken, Parser } from 'ebnf';
import { generate } from 'escodegen';
import { Program, Statement } from 'estree';
import { readFileSync } from 'fs';
import { program } from '../estree';
import { ppArray } from '../post-process/array';
import { ppAssign } from '../post-process/assign';
import { ppBranch } from '../post-process/branch';
import { ppCall } from '../post-process/call';
import { ppClass } from '../post-process/class';
import { ppConditional } from '../post-process/conditional';
import { ppConst } from '../post-process/const';
import { ppError } from '../post-process/error';
import { ppExpr } from '../post-process/expr';
import { ppHelpers } from '../post-process/helpers';
import { ppLiteral } from '../post-process/literal';
import { ppLoop } from '../post-process/loop';
import { ppMethod } from '../post-process/method';
import { ppVarDecl } from '../post-process/vardecl';
import { ppWith } from '../post-process/with';
const dashAst = require('dash-ast');

export interface ESIToken extends IToken {
	estree: any;
	parent: ESIToken;
	children: ESIToken[];
}

export class Grammar {
	private TOKEN_TERMINAL_KEYWORDS = 'Keywords ::= ';

	private GRAMMAR_TARGET_FORMAT = 'Format';
	private GRAMMAR_TARGET_TRANSPILE = 'Transpile';

	private parser: Parser;
	private keywords: { [index: string]: string } = {};

	private postProcessors = [
		ppHelpers,
		ppLiteral,
		ppExpr,
		ppVarDecl,
		ppConst,
		ppArray,
		ppError,
		ppAssign,
		ppConditional,
		ppLoop,
		ppBranch,
		ppWith,
		ppMethod,
		ppCall,
		ppClass,
	];

	constructor() {
		let grammar = readFileSync('./lib/scripting/grammar/grammar.bnf').toString();

		this.setKeywords(grammar);

		grammar = this.addCaseInsensitiveKeywords(grammar);

		this.parser = new Parser(Grammars.Custom.getRules(grammar), {});
	}

	public transpile(script: string): Program {
		const statements: Statement[] = [];

		const formattedScript = this.format(script);

		const vbsAst = this.parser.getAST(formattedScript, this.GRAMMAR_TARGET_TRANSPILE);

		if (vbsAst === null) {
			throw new Error('Unable to transpile script:\n\n' + formattedScript);
		}

		const postProcessors = this.postProcessors;

		dashAst(vbsAst, {
			leave(node: ESIToken, parent: ESIToken) {
				if (
					(node.type === 'Statement' ||
						node.type === 'StatementInline' ||
						node.type === 'MethodDeclaration' ||
						node.type === 'ClassDecl') &&
					parent.type === 'Transpile'
				) {
					if (node.children[0].estree) {
						if (!Array.isArray(node.children[0].estree)) {
							statements.push(node.children[0].estree as Statement);
						} else {
							for (const statement of node.children[0].estree as Statement[]) {
								statements.push(statement);
							}
						}
					}
				} else {
					let estree: any = null;
					for (const postProcessor of postProcessors) {
						estree = postProcessor(node);
						if (estree) {
							break;
						}
					}
					if (estree !== null) {
						node.estree = estree;
					} else if (node.children[0]) {
						node.estree = node.children[0].estree;
					}
				}
			},
		});

		return program(statements);
	}

	public format(script: string): string {
		let output = '';

		const keywords = this.keywords;

		let tokens: string[];
		let prevToken: IToken | undefined;
		let separator = false;

		const ast = this.parser.getAST(script.trim() + '\n', this.GRAMMAR_TARGET_FORMAT);

		dashAst(ast, {
			enter(node: IToken, parent: IToken) {
				if (node.type === 'LogicalLine') {
					tokens = [];
					prevToken = undefined;
					separator = false;
				} else if (node.type === 'Keyword') {
					node.text = keywords[node.text.toLowerCase()];
				}
			},
			leave(node: IToken, parent: IToken) {
				if (node.type === 'LogicalLine') {
					if (tokens.length > 0) {
						output += tokens.join('') + '\n';
					}
				} else if (node.type === 'LogicalLineElement') {
					if (node.text === ' ') {
						separator = true;
					}
				} else if (node.type === 'Token') {
					const token = node.children[0];
					if (prevToken) {
						if (token.type === 'Keyword') {
							/**
							 * Add spaces for the following:
							 * 1) Keyword Keyword - End Sub
							 * 2) Identifier Keyword - For j=x To 20
							 * 3) Literal Keyword - For j=1 To 20
							 * 4) ) Keyword - Function MyFunction(value) End Function
							 */
							if (
								prevToken.type === 'Keyword' ||
								prevToken.type === 'Identifier' ||
								prevToken.type === 'Literal' ||
								prevToken.text === ')'
							) {
								tokens.push(' ');
							}
						} else if (token.type === 'Identifier') {
							/**
							 * Add spaces for the following:
							 * 1) Keyword Identifier - Sub BallRelease()
							 * 2) Identifier Identifier - PlaySound SoundFX("fx_flipperup", ...
							 * 3) ) Identifier - Sub BallRelease_Hit() BallRelease.CreateBall
							 */
							if (
								prevToken.type === 'Keyword' ||
								prevToken.type === 'Identifier' ||
								prevToken.text === ')'
							) {
								tokens.push(' ');
							}
						} else if (token.type === 'Literal') {
							/**
							 * Add spaces for the following:
							 * 1) Keyword Literal - For j=1 To 20
							 * 2) Identifier Literal - BallRelease 5, -2
							 */
							if (prevToken.type === 'Keyword' || prevToken.type === 'Identifier') {
								tokens.push(' ');
							}
						} else if (token.text === '.') {
							/**
							 * Add space for the following:
							 * 1) <Space>. - case keyReset .Stop
							 * Do not add a space for the following:
							 * 1) :<Space>. - Case keyDown swCopy=swDown: .Switch(swCopy)=False
							 */
							if (separator && prevToken.text !== ':') {
								tokens.push(' ');
							}
						}
					}
					tokens.push(token.text);
					prevToken = token;
					separator = false;
				}
			},
		});

		return output;
	}

	public vbsToJs(script: string): string {
		return generate(this.transpile(script));
	}

	private setKeywords(grammar: string) {
		const startIndex = grammar.indexOf(this.TOKEN_TERMINAL_KEYWORDS) + this.TOKEN_TERMINAL_KEYWORDS.length;
		const endIndex = grammar.indexOf('\n', startIndex);

		for (let keyword of grammar.substr(startIndex, endIndex - startIndex).split('|')) {
			keyword = keyword.trim().slice(1, -1);
			this.keywords[keyword.toLowerCase()] = keyword;
		}
	}

	private addCaseInsensitiveKeywords(grammar: string): string {
		const caseInsensitiveKeywords: string[] = [];

		const startIndex = grammar.indexOf(this.TOKEN_TERMINAL_KEYWORDS) + this.TOKEN_TERMINAL_KEYWORDS.length;
		const endIndex = grammar.indexOf('\n', startIndex);

		for (const key of Object.keys(this.keywords)) {
			let caseInsensitiveKeyword = '';
			for (const letter of key) {
				caseInsensitiveKeyword += "('" + letter.toUpperCase() + "'|'" + letter.toLowerCase() + "')";
			}
			caseInsensitiveKeywords.push(caseInsensitiveKeyword);
		}

		return grammar.substr(0, startIndex) + caseInsensitiveKeywords.join(' | ') + grammar.substr(endIndex);
	}
}
