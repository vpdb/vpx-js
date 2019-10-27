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
import { TableBuilder } from '../../../test/table-builder';
import { Player } from '../../game/player';
import { Table } from '../../vpt/table/table';
import { ReferenceTransformer } from './reference-transformer';
import { Transformer } from './transformer';
import { Enums } from '../../vpt/enums';
import { GlobalApi } from '../../vpt/global-api';
import { Stdlib } from '../stdlib';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting reference transformer', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = new TableBuilder().addFlipper('Flipper').build();
		player = new Player(table);
	});

	it('should convert global to local variable if object exists', () => {
		const vbs = `Flipper.SomeFunct\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`${Transformer.ITEMS_NAME}.Flipper.SomeFunct();`);
	});

	it('should not convert global to local if object does not exist', () => {
		const vbs = `NoExisto.SomeFunct\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`NoExisto.SomeFunct();`);
	});

	it('should not convert a function into an enum', () => {
		const vbs = `TriggerShape.TriggerButton\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`TriggerShape.TriggerButton();`);
	});

	it('should convert an enum if enum exists', () => {
		const vbs = `x = TriggerShape.TriggerButton\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`x = ${Transformer.ENUMS_NAME}.TriggerShape.TriggerButton;`);
	});

	it('should convert a global function if exists', () => {
		const vbs = `PlaySound "test"\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`${Transformer.GLOBAL_NAME}.PlaySound('test');`);
	});

	it('should convert a global function to correct case', () => {
		const vbs = `plaYSoUND "test"\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`${Transformer.GLOBAL_NAME}.PlaySound('test');`);
	});

	it('should convert a table element to correct case', () => {
		const vbs = `fliPpeR.Length = 100\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`${Transformer.ITEMS_NAME}.Flipper.Length = 100;`);
	});

	it('should convert a table element property to correct case', () => {
		const vbs = `Flipper.lEnGTh = 100\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`${Transformer.ITEMS_NAME}.Flipper.Length = 100;`);
	});

	it('should convert a stdlib call to correct case', () => {
		const vbs = `x = INT(1.2)\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`x = ${Transformer.STDLIB_NAME}.Int(1.2);`);
	});

	it('should convert a stdlib property call to correct case', () => {
		const vbs = `x = Math.PoW(12)\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`x = ${Transformer.STDLIB_NAME}.Math.pow(12);`);
	});

	it('should convert an enum name to correct case', () => {
		const vbs = `x = gaTEtYPe.GateWireRectangle\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`x = ${Transformer.ENUMS_NAME}.GateType.GateWireRectangle;`);
	});

	it('should convert an enum value to correct case', () => {
		const vbs = `x = GateType.gATeWirERecTAnGlE\n`;
		const js = transform(vbs, table, player);
		expect(js).to.equal(`x = ${Transformer.ENUMS_NAME}.GateType.GateWireRectangle;`);
	});

});

function transform(vbs: string, table: Table, player: Player): string {
	const ast = vbsToAst(vbs);
	const referenceTransformer = new ReferenceTransformer(ast, table, table.getElementApis(), Enums, new GlobalApi(table, player), new Stdlib());
	const eventAst = referenceTransformer.transform();
	return astToVbs(eventAst);
}
