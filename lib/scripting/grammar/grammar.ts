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
import { getTextFile } from '../../refs.node';
import { logger, progress } from '../../util/logger';
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
	private readonly TOKEN_TERMINAL_KEYWORDS = 'Keywords ::= ';

	private readonly GRAMMAR_TARGET_FORMAT = 'Format';
	private readonly GRAMMAR_TARGET_PROGRAM = 'Program';

	private readonly parser: Parser;
	private readonly keywords: { [index: string]: string } = {};

	private readonly postProcessors = [
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
		let grammar = getTextFile('grammar.bnf');

		this.setKeywords(grammar);

		grammar = this.addCaseInsensitiveKeywords(grammar);

		this.parser = new Parser(Grammars.Custom.getRules(grammar), {});
	}

	public format(script: string): string {
		let output = '';

		const keywords = this.keywords;

		let hasLine: boolean = false;
		let prevToken: IToken | undefined;
		let separator = false;

		let now = Date.now();
		progress().details('formatting');
		const ast = this.parser.getAST(script.trim() + '\n', this.GRAMMAR_TARGET_FORMAT);
		logger().info('[Grammar.format] Parsed in %sms', Date.now() - now);

		/**
		 * Reformat the script by parsing into logical lines and tokens.
		 * This will remove comments and REM statements, case correct keywords,
		 * join lines that use line continuation (_), and remove all unnecessary
		 * whitespace. Removing whitespace significantly improves performance.
		 * Rules for including whitespace are commented inline below.
		 */

		now = Date.now();
		progress().details('standardizing');
		dashAst(ast, {
			enter(node: IToken, parent: IToken) {
				if (node.type === 'LogicalLine') {
					hasLine = false;
					prevToken = undefined;
					separator = false;
				} else if (node.type === 'Keyword') {
					node.text = keywords[node.text.toLowerCase()];
				}
			},
			leave(node: IToken, parent: IToken) {
				if (node.type === 'LogicalLine') {
					if (hasLine) {
						output += '\n';
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
								output += ' ';
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
								output += ' ';
							}
						} else if (token.type === 'Literal') {
							/**
							 * Add spaces for the following:
							 * 1) Keyword Literal - For j=1 To 20
							 * 2) Identifier Literal - BallRelease 5, -2
							 */
							if (prevToken.type === 'Keyword' || prevToken.type === 'Identifier') {
								output += ' ';
							}
						} else if (token.text === '(' || token.text === '-') {
							/**
							 * Add spaces for the following:
							 * 1) Keyword '(' - For ii=(oldSize*2)+1 To(newSize*2):mSlot(ii)=0:Next
							 * 2) Keyword '-' - For ii=UBound(mSlot) To 0 Step -1:str=str&mSlot(ii):Next
							 */
							if (prevToken.type === 'Keyword') {
								output += ' ';
							}
						} else if (token.text === '.') {
							/**
							 * Add space for the following:
							 * 1) <Space>. - case keyReset .Stop
							 * Do not add a space for the following:
							 * 1) :<Space>. - Case keyDown swCopy=swDown: .Switch(swCopy)=False
							 * 2) =<Space>. - If .Exists(aBall) Then .Item(aBall)=.Item(aBall)+1
							 * 3) +<Space>. - dips(0)=.Dip(0)+.Dip(1)*256+ .Dip(2)*65536+(.Dip(3) And &H7f)*&H1000000
							 */
							if (separator && (prevToken.type !== 'Operator' && prevToken.text !== ':')) {
								output += ' ';
							}
						}
					}
					output += token.text;
					hasLine = true;
					prevToken = token;
					separator = false;
				}
			},
		});
		logger().info('[Grammar.format] Standardized in %sms', Date.now() - now);

		return output;
	}

	public transpile(script: string): Program {
		const stmts: Statement[] = [];

		const formattedScript = this.format(script);

		let now = Date.now();

		progress().details('transpiling');
		const vbsAst = this.parser.getAST(formattedScript, this.GRAMMAR_TARGET_PROGRAM);
		logger().info('[Grammar.transpile] Parsed in %sms', Date.now() - now);

		if (vbsAst === null) {
			throw new Error('Unable to transpile script:\n\n' + formattedScript);
		}

		const postProcessors = this.postProcessors;
		now = Date.now();
		progress().details('post-processing');
		dashAst(vbsAst, {
			leave(node: ESIToken, parent: ESIToken) {
				if (node.type === 'Program') {
					for (const child of node.children) {
						if (child.estree) {
							if (!Array.isArray(child.estree)) {
								stmts.push(child.estree);
							} else {
								stmts.push(...child.estree);
							}
						}
					}
				} else {
					let estree: any = null;
					/**
					 * Loop through all registered post processors until an estree
					 * is returned. If no post processors can handle the node, and
					 * the node has a child, copy it's estree. This will allow estrees
					 * to get propagated to parents, and we wont need to have
					 * post-processors for every single rule in the grammar.
					 */
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
		logger().info('[Grammar.transpile] Post-processed in %sms', Date.now() - now);

		return program(stmts);
	}

	public vbsToJs(script: string): string {
		return generate(this.transpile(script));
	}

	/**
	 * To keep the grammar readable, keywords are defined matching the case
	 * from MS documentation. Each keyword is stored in a lookup table, and
	 * then turned into a case insensitive version. For example, 'ByVal' will
	 * become (B|b)(Y|y)(V|v)(A|a)(L|l). During the format process, all
	 * keywords will be standardized using the lookup table.
	 */

	private setKeywords(grammar: string) {
		const startIndex = grammar.indexOf(this.TOKEN_TERMINAL_KEYWORDS) + this.TOKEN_TERMINAL_KEYWORDS.length;
		const endIndex = grammar.indexOf(' {', startIndex);

		for (let keyword of grammar.substr(startIndex, endIndex - startIndex).split('|')) {
			keyword = keyword.trim().slice(1, -1);
			this.keywords[keyword.toLowerCase()] = keyword;
		}
	}

	private addCaseInsensitiveKeywords(grammar: string): string {
		const caseInsensitiveKeywords: string[] = [];

		const startIndex = grammar.indexOf(this.TOKEN_TERMINAL_KEYWORDS) + this.TOKEN_TERMINAL_KEYWORDS.length;
		const endIndex = grammar.indexOf(' {', startIndex);

		for (const key of Object.keys(this.keywords)) {
			let caseInsensitiveKeyword = '';
			for (const letter of key) {
				caseInsensitiveKeyword += '[' + letter.toUpperCase() + letter.toLowerCase() + ']';
			}
			caseInsensitiveKeywords.push(caseInsensitiveKeyword);
		}
		return grammar.substr(0, startIndex) + caseInsensitiveKeywords.join('|') + grammar.substr(endIndex);
	}
}
