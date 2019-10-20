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
import { logger } from '../util/logger';
import { apiEnums } from '../vpt/enums';
import { Table } from '../vpt/table/table';
import { EventTransformer } from './event-transformer';
import { ScopeTransformer } from './scope-transformer';
import vbsGrammar from './vbscript';

// the table script function
declare function play(table: { [key: string]: any }, enums: any): void;

export class Transpiler {

	private readonly table: Table;

	constructor(table: Table) {
		this.table = table;
	}

	public transpile(vbs: string, globalFunction: string, globalObject?: string) {
		logger().debug(vbs);
		let ast = this.parse(vbs + '\n');
		const scopeTransformer = new ScopeTransformer(this.table);
		const eventTransformer = new EventTransformer(this.table);

		ast = eventTransformer.transform(ast);
		ast = scopeTransformer.transform(ast, globalFunction, 'items', 'enums', globalObject);
		logger().debug('AST:', ast);

		const js = '//@ sourceURL=tablescript.js\n' + this.generate(ast);
		logger().debug(js);

		return js;
	}

	public execute(vbs: string, globalObject?: string) {

		globalObject = globalObject || (typeof window !== 'undefined' ? 'window' : (typeof self !== 'undefined' ? 'self' : 'global'));
		const js = this.transpile(vbs, 'play', globalObject);

		// tslint:disable-next-line:no-eval
		eval(js);
		play(this.table.getElementApis(), apiEnums);
	}

	private parse(vbs: string): Program {

		const parser = new Parser(Grammar.fromCompiled(vbsGrammar));
		parser.feed(vbs);
		/* istanbul ignore if */
		if (parser.results.length === 0) {
			throw new Error('Parser returned no results.');
		}
		return parser.results[0];
	}

	private generate(ast: Program): string {
		return generate(ast);
	}
}
