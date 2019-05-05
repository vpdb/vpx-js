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

import { ThreeHelper } from '../three.helper';
import { Table } from '../../lib';
import { expect } from 'chai';

const three = new ThreeHelper();

describe('The VPinball parser for invisible elements', () => {

	let vpt: Table;

	before(async () => {
		vpt = await Table.load(three.fixturePath('table-invisible.vpx'), { loadInvisibleItems: true });
	});

	it('should parse a timer item', async () => {
		const timer = vpt.timers.find(t => t.getName() === 'Timer')!;
		expect(timer).to.be.an('object');
		expect(timer.timer.interval).to.equal(100);
		expect(timer.vCenter.x).to.equal(-133.5);
		expect(timer.vCenter.y).to.equal(269);
	});

	it('should parse a plunger item', async () => {
		const plunger = vpt.plungers.find(t => t.getName() === 'Plunger1')!;
		expect(plunger).to.be.an('object');
		expect(plunger.width).to.equal(25);
		expect(plunger.vCenter.x).to.equal(877.7000122070312);
		expect(plunger.vCenter.y).to.equal(2009);
		expect(plunger.speedPull).to.equal(5.5);
		expect(plunger.speedFire).to.equal(80.80000305175781);
	});
});
