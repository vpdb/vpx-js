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
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../../vpt/table/table';
import { ReferenceTransformer } from './reference-transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting reference transformer', () => {

	const three = new ThreeHelper();
	let table: Table;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-gate.vpx')));
	});

	it('should convert global to local variable if object exists', () => {
		const vbs = `WireRectangle.SomeFunct\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`${ReferenceTransformer.ITEMS_NAME}.WireRectangle.SomeFunct();`);
	});

	it('should not convert global to local if object does not exist', () => {
		const vbs = `NoExisto.SomeFunct\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`NoExisto.SomeFunct();`);
	});

	it('should not convert a function into an enum', () => {
		const vbs = `TriggerShape.TriggerButton\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`TriggerShape.TriggerButton();`);
	});

	it('should convert an enum if enum exists', () => {
		const vbs = `x = TriggerShape.TriggerButton\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`x = ${ReferenceTransformer.ENUMS_NAME}.TriggerShape.TriggerButton;`);
	});

	it('should convert a global function if exists', () => {
		const vbs = `PlaySound "test"\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`${ReferenceTransformer.GLOBAL_NAME}.PlaySound('test');`);
	});

});

function transform(vbs: string, table: Table): string {
	const ast = vbsToAst(vbs);
	const scopeTransformer = new ReferenceTransformer(ast, table);
	const eventAst = scopeTransformer.transform();
	return astToVbs(eventAst);
}
