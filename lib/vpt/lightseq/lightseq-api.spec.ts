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
import * as sinonChai from 'sinon-chai';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball light sequence API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-lightseq.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const lightSeq = table.lightSeqs.LightSeq001.getApi();

		lightSeq.Collection = 'Collection';
		lightSeq.CenterX = 145;
		lightSeq.CenterY = 546;
		lightSeq.UpdateInterval = 122;

		expect(lightSeq.Collection).to.equal('Collection');
		expect(lightSeq.CenterX).to.equal(145);
		expect(lightSeq.CenterY).to.equal(546);
		expect(lightSeq.UpdateInterval).to.equal(122);
	});

});
