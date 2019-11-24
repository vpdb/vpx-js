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
import { CollectionData } from './collection-data';

/* tslint:disable:no-unused-expression */
import * as sinonChai from 'sinon-chai';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball collection data', () => {

	it('should correctly read the data from the .vpx file', async () => {
		const table = await Table.load(new NodeBinaryReader(three.fixturePath('table-collection.vpx')));

		const dataA = (table.collections.CollectionA as any).data as CollectionData;
		expect(table.collections.CollectionA).to.be.ok;
		expect(dataA.fireEvents).to.equal(false);
		expect(dataA.stopSingleEvents).to.equal(false);
		expect(dataA.groupElements).to.equal(true);
		expect(dataA.itemNames).to.have.lengthOf(2);
		expect(dataA.itemNames[0]).to.equal('TimerA');
		expect(dataA.itemNames[1]).to.equal('TimerAB');

		const dataB = (table.collections.CollectionB as any).data as CollectionData;
		expect(table.collections.CollectionB).to.be.ok;
		expect(dataB.fireEvents).to.equal(true);
		expect(dataB.stopSingleEvents).to.equal(true);
		expect(dataB.groupElements).to.equal(false);
		expect(dataB.itemNames).to.have.lengthOf(2);
		expect(dataB.itemNames[0]).to.equal('TimerB');
		expect(dataB.itemNames[1]).to.equal('TimerAB');
	});
});
