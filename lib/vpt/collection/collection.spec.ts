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
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { ItemApi } from '../item-api';
import { ItemData } from '../item-data';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
import * as sinon from 'sinon';

chai.use(require('sinon-chai'));
const three = new ThreeHelper();

describe('The VPinball collection', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-collection.vpx')));
		player = new Player(table).init();
	});

	it('should fire events for a collection', async () => {
		const coll = table.collections.CollectionFireEvents.getApi();
		const timer1 = table.timers.CollFireEventsTimer1.getApi();
		const timer2 = table.timers.CollFireEventsTimer2.getApi();

		const collSpy = sinon.spy();
		const timer1Spy = sinon.spy();
		const timer2Spy = sinon.spy();
		coll.on('Timer', collSpy);
		timer1.on('Timer', timer1Spy);
		timer2.on('Timer', timer2Spy);

		player.updatePhysics(50);
		expect(timer1Spy).to.have.been.not.called;
		expect(timer2Spy).to.have.been.not.called;
		expect(collSpy).to.have.been.not.called;

		player.updatePhysics(1001);
		expect(timer1Spy).to.have.been.calledOnce;
		expect(timer2Spy).to.have.been.not.called;
		expect(collSpy).to.have.been.calledOnceWith(0);

		player.updatePhysics(1501);
		expect(timer1Spy).to.have.been.calledOnce;
		expect(timer2Spy).to.have.been.calledOnce;
		expect(collSpy).to.have.been.calledTwice;
		expect(collSpy).to.have.been.calledWith(0);
		expect(collSpy).to.have.been.calledWith(1);
	});

	it('should suppress individual events for each member', async () => {
		const coll = table.collections.FireSurpress.getApi();
		const timer1 = table.timers.FireSurpressTimer1.getApi();
		const timer2 = table.timers.FireSurpressTimer2.getApi();

		const collSpy = sinon.spy();
		const timer1Spy = sinon.spy();
		const timer2Spy = sinon.spy();
		coll.on('Timer', collSpy);
		timer1.on('Timer', timer1Spy);
		timer2.on('Timer', timer2Spy);

		player.updatePhysics(50);
		expect(timer1Spy).to.have.been.not.called;
		expect(timer2Spy).to.have.been.not.called;
		expect(collSpy).to.have.been.not.called;

		player.updatePhysics(1001);
		expect(timer1Spy).to.have.been.not.called;
		expect(timer2Spy).to.have.been.not.called;
		expect(collSpy).to.have.been.calledOnceWith(0);

		player.updatePhysics(1501);
		expect(timer1Spy).to.have.been.not.called;
		expect(timer2Spy).to.have.been.not.called;
		expect(collSpy).to.have.been.calledTwice;
		expect(collSpy).to.have.been.calledWith(0);
		expect(collSpy).to.have.been.calledWith(1);
	});

	it('should suppress individual and collection events', async () => {
		const coll = table.collections.SuppressEvents.getApi();
		const timer1 = table.timers.SuppressEventsTimer1.getApi();
		const timer2 = table.timers.SuppressEventsTimer2.getApi();

		const collSpy = sinon.spy();
		const timer1Spy = sinon.spy();
		const timer2Spy = sinon.spy();
		coll.on('Timer', collSpy);
		timer1.on('Timer', timer1Spy);
		timer2.on('Timer', timer2Spy);

		player.updatePhysics(50);
		expect(timer1Spy).to.have.been.not.called;
		expect(timer2Spy).to.have.been.not.called;
		expect(collSpy).to.have.been.not.called;

		player.updatePhysics(1001);
		expect(timer1Spy).to.have.been.not.called;
		expect(timer2Spy).to.have.been.not.called;
		expect(collSpy).to.have.been.not.called;

		player.updatePhysics(1501);
		expect(timer1Spy).to.have.been.not.called;
		expect(timer2Spy).to.have.been.not.called;
		expect(collSpy).to.have.been.not.called;
	});

	it('should create an iterable API', () => {
		const coll = table.collections.SuppressEvents.getApi();
		let i = 0;
		for (const item of coll) {
			i++;
			expect(item.Name).to.equal('SuppressEventsTimer' + i);
		}
	});

	it('should an API whose elements are accessible by index', () => {
		const coll = table.collections.SuppressEvents.getApi() as unknown as Array<ItemApi<ItemData>>;
		expect(coll.length).to.equal(2);
		expect(coll[0].Name).to.equal('SuppressEventsTimer1');
		expect(coll[1].Name).to.equal('SuppressEventsTimer2');
	});

});
