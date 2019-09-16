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
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
import sinon = require('sinon');
import sinonChai = require('sinon-chai');

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball timer API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-timer.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {

		const timer = table.timers.Timer1.getApi();

		timer.Name = 'timername'; expect(timer.Name).to.equal('timername');
		timer.Interval = 99; expect(timer.Interval).to.equal(99);
		timer.Enabled = false; expect(timer.Enabled).to.equal(false);
		timer.Enabled = true; expect(timer.Enabled).to.equal(true);
		timer.UserValue = '1'; expect(timer.UserValue).to.equal('1');
		timer.X = 2345; expect(timer.X).to.equal(2345);
		timer.Y = 6354; expect(timer.Y).to.equal(6354);
	});

	it('should execute the timer until disabled', async () => {

		const timer = table.timers.Timer1.getApi();

		timer.Enabled = true;
		timer.Interval = 150;
		const eventSpy = sinon.spy();
		timer.on('Timer', eventSpy);

		player.updatePhysics(120);
		expect(eventSpy).to.have.been.not.called;

		player.updatePhysics(151);
		expect(eventSpy).to.have.been.calledOnce;

		player.updatePhysics(451);
		expect(eventSpy).to.have.been.calledThrice;

		timer.Enabled = false;
		player.updatePhysics(601);
		expect(eventSpy).to.have.been.calledThrice; // still 3x
	});

});
