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
import { ThreeHelper } from '../../../test/three.helper';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
import sinonChai = require('sinon-chai');

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball collection data', () => {

	it('should correctly read the data from the .vpx file', async () => {
		const table = await Table.load(new NodeBinaryReader(three.fixturePath('table-collection.vpx')));

		expect(table.collections.CollectionA).to.be.ok;
		expect(table.collections.CollectionA.data.fireEvents).to.equal(false);
		expect(table.collections.CollectionA.data.stopSingleEvents).to.equal(false);
		expect(table.collections.CollectionA.data.groupEvents).to.equal(true);
		expect(table.collections.CollectionA.data.itemNames).to.have.lengthOf(2);
		expect(table.collections.CollectionA.data.itemNames[0]).to.equal('TimerA');
		expect(table.collections.CollectionA.data.itemNames[1]).to.equal('TimerAB');

		expect(table.collections.CollectionB).to.be.ok;
		expect(table.collections.CollectionB.data.fireEvents).to.equal(true);
		expect(table.collections.CollectionB.data.stopSingleEvents).to.equal(true);
		expect(table.collections.CollectionB.data.groupEvents).to.equal(false);
		expect(table.collections.CollectionB.data.itemNames).to.have.lengthOf(2);
		expect(table.collections.CollectionB.data.itemNames[0]).to.equal('TimerB');
		expect(table.collections.CollectionB.data.itemNames[1]).to.equal('TimerAB');
	});
});
