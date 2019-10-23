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
import { Player } from '../game/player';
import { logger } from '../util/logger';
import { apiEnums } from '../vpt/enums';
import { GlobalApi } from '../vpt/global-api';
import { Table } from '../vpt/table/table';
import { Stdlib } from './stdlib';
import { EventTransformer } from './transformer/event-transformer';
import { ScopeTransformer } from './transformer/scope-transformer';
import { VBSHelper } from './vbs-helper';
import vbsGrammar from './vbscript';

// the table script function
declare function play(table: { [key: string]: any }, enums: any, globalApi: GlobalApi, stdlib: Stdlib, vbsHelper: VBSHelper): void;

export class Transpiler {

	private readonly table: Table;
	private readonly player: Player;

	constructor(table: Table, player: Player) {
		this.table = table;
		this.player = player;
	}

	public transpile(vbs: string, globalFunction: string, globalObject?: string) {
		logger().debug(vbs);
		let ast = this.parse(vbs + '\n');
		const scopeTransformer = new ScopeTransformer(this.table, this.player);
		const eventTransformer = new EventTransformer(this.table);

		ast = eventTransformer.transform(ast);
		ast = scopeTransformer.transform(ast, globalFunction, globalObject);
		logger().debug('AST:', ast);

		const js = this.generate(ast);
		logger().debug(js);

		return js;
	}

	public execute(vbs: string, globalObject?: string) {

		globalObject = globalObject || (typeof window !== 'undefined' ? 'window' : (typeof self !== 'undefined' ? 'self' : 'global'));
		const js = this.transpile(vbs, 'play', globalObject);

		// tslint:disable-next-line:no-eval
		eval('//@ sourceURL=tablescript.js\n' + js);
		play(this.table.getElementApis(), apiEnums, new GlobalApi(this.table, this.player), new Stdlib(), new VBSHelper());
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
