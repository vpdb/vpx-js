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
import { ThreeHelper } from '../../../test/three.helper';
import { Table } from '../../vpt/table/table';
import { EventTransformer } from './event-transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting event transformer', () => {

	const three = new ThreeHelper();
	let table: Table;

	before(() => {
		table = new TableBuilder()
			.addGate('WireRectangle')
			.addGate('Wire_Rectangle')
			.build();
	});

	it('should transform a valid event on a valid item', () => {
		const vbs = `Sub WireRectangle_Init()\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`WireRectangle.on('Init', () => {\n    BallRelease.CreateBall();\n});`);
	});

	it('should transform a an item with an underscore in its name', () => {
		const vbs = `Sub Wire_Rectangle_Init()\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`Wire_Rectangle.on('Init', () => {\n    BallRelease.CreateBall();\n});`);
	});

	it('should not transform an invalid event on a valid item', () => {
		const vbs = `Sub WireRectangle_DuhDah()\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`function WireRectangle_DuhDah() {\n    BallRelease.CreateBall();\n}`);
	});

	it('should not transform a valid event on an invalid item', () => {
		const vbs = `Sub DoesntExist_Init()\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`function DoesntExist_Init() {\n    BallRelease.CreateBall();\n}`);
	});

	it('should not transform a non-event sub', () => {
		const vbs = `Sub MySub()\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = transform(vbs, table);
		expect(js).to.equal(`function MySub() {\n    BallRelease.CreateBall();\n}`);
	});

});

function transform(vbs: string, table: Table): string {
	const ast = vbsToAst(vbs);
	const eventTransformer = new EventTransformer(ast, table.getElements());
	const eventAst = eventTransformer.transform();
	return astToVbs(eventAst);
}
