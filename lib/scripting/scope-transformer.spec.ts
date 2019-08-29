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
import { ThreeHelper } from '../../test/three.helper';
import { NodeBinaryReader } from '../io/binary-reader.node';
import { Table } from '../vpt/table/table';
import { astToVbs, vbsToAst } from '../../test/script.helper';
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
		const js = transform(vbs, 'tableScript', 'items', table);
		expect(js).to.equal(`window.tableScript = items => {\n    let test;\n};`);
	});

	it('should convert global to local variable if object exists', () => {

		const vbs = `WireRectangle.SomeFunct\n`;
		const js = transform(vbs, 'tableScript', 'items', table);
		expect(js).to.equal(`window.tableScript = items => {\n    items.WireRectangle.SomeFunct();\n};`);
	});

	it('should not convert global to local if object does not exist', () => {

		const vbs = `NoExisto.SomeFunct\n`;
		const js = transform(vbs, 'tableScript', 'items', table);
		expect(js).to.equal(`window.tableScript = items => {\n    NoExisto.SomeFunct();\n};`);
	});

});

function transform(vbs: string, fctName: string, paramName: string, table: Table): string {
	const ast = vbsToAst(vbs);
	const scopeTransformer = new ScopeTransformer(table);
	const eventAst = scopeTransformer.transform(ast, fctName, paramName);
	return astToVbs(eventAst);
}
