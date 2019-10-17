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

import { generate } from 'escodegen';
import { Program } from 'estree';
import { Grammar, Parser } from 'nearley';
import * as vbsGrammar from '../lib/scripting/vbscript';

/**
 * A function that transpiles VBScript to JavaScript.
 */
export function vbsToJs(vbs: string): string {
	return astToVbs(vbsToAst(vbs));
}

export function vbsToAst(vbs: string): Program {
	const parser = new Parser(Grammar.fromCompiled(vbsGrammar));
	parser.feed(vbs.trim() + "\n");
	/* istanbul ignore if */
	if (parser.results.length === 0) {
		throw new Error('Parser returned no results.');
	}
	return parser.results[0] as Program;
}

export function astToVbs(ast: Program): string {
	return generate(ast, {
		comment: true,
	});
}
