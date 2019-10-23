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

import * as chai from 'chai';
import { expect } from 'chai';
import { astToVbs, vbsToAst } from '../../../test/script.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../../vpt/table/table';
import { ScopeTransformer } from './scope-transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting scope transformer', () => {

	const three = new ThreeHelper();
	let table: Table;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-gate.vpx')));
	});

	it('should wrap everything into a function', () => {

		const vbs = `Dim test\n`;
		const js = transform(vbs, 'tableScript', 'items', 'enums', 'api', 'stdlib', table);
		expect(js).to.equal(`window.tableScript = (items, enums, api, stdlib, vbsHelper) => {\n    let test;\n};`);
	});

	it('should convert global to local variable if object exists', () => {

		const vbs = `WireRectangle.SomeFunct\n`;
		const js = transform(vbs, 'tableScript', 'items', 'enums', 'api', 'stdlib', table);
		expect(js).to.equal(`window.tableScript = (items, enums, api, stdlib, vbsHelper) => {\n    items.WireRectangle.SomeFunct();\n};`);
	});

	it('should not convert global to local if object does not exist', () => {

		const vbs = `NoExisto.SomeFunct\n`;
		const js = transform(vbs, 'tableScript', 'items', 'enums', 'api', 'stdlib', table);
		expect(js).to.equal(`window.tableScript = (items, enums, api, stdlib, vbsHelper) => {\n    NoExisto.SomeFunct();\n};`);
	});

	it('should not convert a function into an enum', () => {

		const vbs = `TriggerShape.TriggerButton\n`;
		const js = transform(vbs, 'tableScript', 'items', 'enums', 'api', 'stdlib', table);
		expect(js).to.equal(`window.tableScript = (items, enums, api, stdlib, vbsHelper) => {\n    TriggerShape.TriggerButton();\n};`);
	});

	it('should convert an enum if enum exists', () => {

		const vbs = `x = TriggerShape.TriggerButton\n`;
		const js = transform(vbs, 'tableScript', 'items', 'enums', 'api', 'stdlib', table);
		expect(js).to.equal(`window.tableScript = (items, enums, api, stdlib, vbsHelper) => {\n    x = enums.TriggerShape.TriggerButton;\n};`);
	});

});

function transform(vbs: string, fctName: string, paramName: string, enumName: string, apiName: string, stdlibName: string, table: Table): string {
	const player = new Player(table);
	const ast = vbsToAst(vbs);
	const scopeTransformer = new ScopeTransformer(table, player);
	const eventAst = scopeTransformer.transform(ast, fctName, paramName, enumName, apiName, stdlibName, 'window');
	return astToVbs(eventAst);
}
