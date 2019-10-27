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
import { Enums, EnumsApi } from '../vpt/enums';
import { GlobalApi } from '../vpt/global-api';
import { Table } from '../vpt/table/table';
import { Stdlib } from './stdlib';
import { AmbiguityTransformer } from './transformer/ambiguity-transformer';
import { CleanupTransformer } from './transformer/cleanup-transformer';
import { EventTransformer } from './transformer/event-transformer';
import { ReferenceTransformer } from './transformer/reference-transformer';
import { ScopeTransformer } from './transformer/scope-transformer';
import { WrapTransformer } from './transformer/wrap-transformer';
import { VBSHelper } from './vbs-helper';
import vbsGrammar from './vbscript';

//self.escodegen = require('escodegen');

// the table script function
declare function play(scope: any, table: { [key: string]: any }, enums: EnumsApi, globalApi: GlobalApi, stdlib: Stdlib, vbsHelper: VBSHelper): void;

export class Transpiler {

	private readonly table: Table;
	private readonly itemApis: { [p: string]: any };
	private readonly enumApis: EnumsApi;
	private readonly globalApi: GlobalApi;
	private readonly stdlib: Stdlib;

	constructor(table: Table, player: Player) {
		this.table = table;
		this.itemApis = this.table.getElementApis();
		this.enumApis = Enums;
		this.globalApi = new GlobalApi(this.table, player);
		this.stdlib = new Stdlib();
	}

	public transpile(vbs: string, globalFunction?: string, globalObject?: string) {

		logger().debug(vbs);
		let ast = this.parse(vbs + '\n');
		ast = new CleanupTransformer(ast).transform();
		ast = new EventTransformer(ast, this.table.getElements()).transform();
		ast = new ReferenceTransformer(ast, this.table, this.itemApis, this.enumApis, this.globalApi, this.stdlib).transform();
		ast = new ScopeTransformer(ast).transform();
		ast = new AmbiguityTransformer(ast, this.itemApis, this.enumApis, this.globalApi, this.stdlib).transform();
		ast = new WrapTransformer(ast).transform(globalFunction, globalObject);

		logger().debug('AST:', ast);
		const js = this.generate(ast);
		logger().debug(js);

		return js;
	}

	public execute(vbs: string, globalObject?: string, globalScope: any = {}) {

		globalObject = globalObject || (typeof window !== 'undefined' ? 'window' : (typeof self !== 'undefined' ? 'self' : 'global'));
		const js = this.transpile(vbs, 'play', globalObject);

		// tslint:disable-next-line:no-eval
		eval('//@ sourceURL=tablescript.js\n' + js);
		play(new Proxy(globalScope, new ScopeHandler()), this.itemApis, this.enumApis, this.globalApi, this.stdlib, new VBSHelper(this));
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

class ScopeHandler implements ProxyHandler<any> {

	// tslint:disable-next-line:variable-name
	private readonly __props: { [key: string]: string | number | symbol } = {};

	public get(target: any, name: string | number | symbol, receiver: any): any {
		const normName = typeof name === 'string' ? name.toLowerCase() : name.toString();
		let realName = name;
		if (!this.__props[normName]) {
			this.__props[normName] = realName;
		} else {
			realName = this.__props[normName];
		}
		return target[realName];
	}

	public set(target: any, name: string | number | symbol, value: any, receiver: any): boolean {
		const normName = typeof name === 'string' ? name.toLowerCase() : name.toString();
		let realName = name;
		if (!this.__props[normName]) {
			this.__props[normName] = realName;
		} else {
			realName = this.__props[normName];
		}
		target[realName] = value;
		return true;
	}
}
