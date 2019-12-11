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

const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const { Grammars } = require('ebnf');
const { inspect } = require('util');

const bnfGrammar = readFileSync(resolve(__dirname, '../lib/scripting/grammar/grammar.bnf')).toString();
const fileDest = resolve(__dirname, '../lib/scripting/grammar/rules.ts');
const rules = Grammars.Custom.getRules(addCaseInsensitiveKeywords(bnfGrammar, getKeywords(bnfGrammar)));

//const keywordsRule = rules.find(r => r.name === 'Keywords');
// keywordsRule.bnf = keywordsRule.bnf
// 	.map(r => [ new RegExp(r[0].substr(1, r[0].length - 2), 'i') ]);
// const keywordsBnf = keywordsRule.bnf
// 	.map(r => r[0])
// 	.map(r => r.substr(1, r.length - 2));
//keywordsRule.bnf = [[ new RegExp(keywordsBnf.join('|'), 'i')]];

const rulesExport = `import { IRule } from 'ebnf';
/* tslint:disable */
export const RULES: IRule[] = ${inspect(rules, { depth: 20, maxArrayLength: null })} as IRule[];
`;
writeFileSync(fileDest, rulesExport);

function getKeywords(grammar) {
	const TOKEN_TERMINAL_KEYWORDS = 'Keywords ::= ';
	const startIndex = grammar.indexOf(TOKEN_TERMINAL_KEYWORDS) + TOKEN_TERMINAL_KEYWORDS.length;
	const endIndex = grammar.indexOf(' {', startIndex);
	const keywords = [];
	for (let keyword of grammar.substr(startIndex, endIndex - startIndex).split('|')) {
		keyword = keyword.trim().slice(1, -1);
		keywords.push(keyword.toLowerCase());
	}
	return keywords;
}

function addCaseInsensitiveKeywords(grammar, keywords) {
	const TOKEN_TERMINAL_KEYWORDS = 'Keywords ::= ';
	const caseInsensitiveKeywords = [];
	const startIndex = grammar.indexOf(TOKEN_TERMINAL_KEYWORDS) + TOKEN_TERMINAL_KEYWORDS.length;
	const endIndex = grammar.indexOf(' {', startIndex);

	for (const key of keywords) {
		let caseInsensitiveKeyword = '';
		for (const letter of key) {
			caseInsensitiveKeyword += '[' + letter.toUpperCase() + letter.toLowerCase() + ']';
		}
		caseInsensitiveKeywords.push(caseInsensitiveKeyword);
	}
	return grammar.substr(0, startIndex) + caseInsensitiveKeywords.join('|') + grammar.substr(endIndex);
}
