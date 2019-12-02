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
import { ppConditional } from '../post-process/conditional';
import { ppConst } from '../post-process/const';
import { ppDim } from '../post-process/dim';
import { ppError } from '../post-process/error';
import { ppExpr } from '../post-process/expr';
import { ppHelpers } from '../post-process/helpers';
import { ppLiteral } from '../post-process/literal';
import { ppLoop } from '../post-process/loop';
import { ppMethod } from '../post-process/method';
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
		ppDim,
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
						node.type === 'MethodDeclaration') &&
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
		const ast = this.parser.getAST(script.trim() + '\n', this.GRAMMAR_TARGET_FORMAT);

		let tokens: string[];
		let prevToken: IToken | null;
		let setToken: IToken;
		let output = '';

		const keywords = this.keywords;

		let separator = false;

		dashAst(ast, {
			enter(node: IToken, parent: IToken) {
				if (node.type === 'LogicalLine') {
					tokens = [];
					prevToken = null;
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
					if (prevToken !== null) {
						let addWhitespace = false;

						if (prevToken.type === 'Identifier') {
							if (setToken.type !== 'Separator' && setToken.type !== 'Operator') {
								addWhitespace = true;
							}
						}

						if (prevToken.type === 'Keyword') {
							if (prevToken.text !== 'True' && prevToken.text !== 'False') {
								addWhitespace = true;
							}
						}

						if (setToken.type === 'Keyword' && prevToken.text !== ':') {
							if (
								setToken.text !== 'True' &&
								setToken.text !== 'False' &&
								setToken.text !== 'Nothing' &&
								setToken.text !== 'Null' &&
								setToken.text !== 'Empty' &&
								setToken.text !== 'Not' &&
								setToken.text !== 'New' &&
								setToken.text !== 'ByVal' &&
								setToken.text !== 'ByRef'
							) {
								addWhitespace = true;
							}
						}

						if (setToken.type === 'Separator') {
							if (setToken.text === '.') {
								if (separator) {
									addWhitespace = true;
								}
							} else if (setToken.text === '(' && prevToken.type === 'Identifier' && separator) {
								addWhitespace = true;
							}
						}

						if (setToken.type === 'Identifier') {
							if (prevToken.text === ')') {
								addWhitespace = true;
							}
						}

						if (addWhitespace === true) {
							if (tokens[tokens.length - 1] !== ' ') {
								tokens.push(' ');
							}
						}
					}

					tokens.push(setToken.text);
					prevToken = setToken;
					separator = false;
				} else if (
					node.type === 'Identifier' ||
					node.type === 'Keyword' ||
					node.type === 'Literal' ||
					node.type === 'Separator' ||
					node.type === 'Operator'
				) {
					setToken = node;
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
