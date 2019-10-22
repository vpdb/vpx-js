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
import sinonChai = require('sinon-chai');
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { LightStatus } from '../enums';
import { Table } from '../table/table';
import { LightState } from './light-state';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball light animation', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-light.vpx')));
		player = new Player(table).init();
	});

	it('should turn on correctly', async () => {
		const light = table.lights.Surface;
		const api = light.getApi();

		api.State = LightStatus.LightStateOff;
		api.Intensity = 1;

		player.updatePhysics(0);
		expect(light.getState().intensity).to.equal(0);

		api.State = LightStatus.LightStateOn;
		player.updatePhysics(20);
		expect(light.getState().intensity).to.equal(1);
	});

	it('should turn off correctly', async () => {
		const light = table.lights.Surface;
		const api = light.getApi();

		api.State = LightStatus.LightStateOn;
		api.Intensity = 1;

		player.updatePhysics(0);
		expect(light.getState().intensity).to.equal(1);

		api.State = LightStatus.LightStateOff;
		player.updatePhysics(20);
		expect(light.getState().intensity).to.equal(0);
	});

	it('should go from off to on', () => {

		const light = table.lights.Surface;
		const api = light.getApi();

		api.State = LightStatus.LightStateOff;
		api.Intensity = 1;

		player.updatePhysics(0);
		expect(light.getState().intensity).to.equal(0);

		api.Duration(LightStatus.LightStateOff, 500, LightStatus.LightStateOn);

		player.updatePhysics(520);
		expect(light.getState().intensity).to.equal(1);

		player.updatePhysics(650);
		expect(light.getState().intensity).to.equal(1);
	});

	it('should go from of to blinking', () => {

		const light = table.lights.Surface;
		const api = light.getApi();

		api.State = LightStatus.LightStateOff;
		api.Intensity = 1;

		player.updatePhysics(0);
		expect(light.getState().intensity).to.equal(0);

		api.Duration(LightStatus.LightStateOff, 500, LightStatus.LightStateBlinking);

		// for (let i = 0; i < 3000; i += 10) {
		// 	player.updatePhysics(i);
		// 	console.log('%s %s', i, light.getState().intensity);
		// }

		player.updatePhysics(520);
		expect(light.getState().intensity).to.equal(1);

		player.updatePhysics(650);
		expect(light.getState().intensity).to.equal(0);

		player.updatePhysics(770);
		expect(light.getState().intensity).to.equal(1);
	});

	it('should go from blinking to off', () => {

		const light = table.lights.Surface;
		const api = light.getApi();

		api.State = LightStatus.LightStateOff;
		api.Intensity = 1;

		player.updatePhysics(0);
		expect(light.getState().intensity).to.equal(0);

		api.Duration(LightStatus.LightStateBlinking, 500, LightStatus.LightStateOff);

		player.updatePhysics(20);
		expect(light.getState().intensity).to.equal(1);

		player.updatePhysics(120);
		expect(light.getState().intensity).to.equal(1);

		player.updatePhysics(130);
		expect(light.getState().intensity).to.equal(0);
	});

	it('should blink the correct pattern', async () => {
		const light = table.lights.Surface;
		const api = light.getApi();

		api.BlinkPattern = '100110';
		api.BlinkInterval = 100;
		api.State = LightStatus.LightStateBlinking;
		api.Intensity = 10;
		api.IntensityScale = 1;

		player.updatePhysics(0);
		expect(light.getState().intensity).to.equal(10);

		player.updatePhysics(100);
		expect(light.getState().intensity).to.equal(0);

		player.updatePhysics(200);
		expect(light.getState().intensity).to.equal(0);

		player.updatePhysics(300);
		expect(light.getState().intensity).to.equal(10);

		player.updatePhysics(400);
		expect(light.getState().intensity).to.equal(10);

		player.updatePhysics(500);
		expect(light.getState().intensity).to.equal(0);
	});

	it('should correctly repeat a blink pattern', async () => {
		const light = table.lights.Surface;
		const api = light.getApi();

		api.BlinkPattern = '101';
		api.BlinkInterval = 100;
		api.State = LightStatus.LightStateBlinking;
		api.Intensity = 10;
		api.IntensityScale = 1;

		player.updatePhysics(0);
		expect(light.getState().intensity).to.equal(10);

		player.updatePhysics(100);
		expect(light.getState().intensity).to.equal(0);

		player.updatePhysics(200);
		expect(light.getState().intensity).to.equal(10);

		player.updatePhysics(300);
		expect(light.getState().intensity).to.equal(10);

		player.updatePhysics(400);
		expect(light.getState().intensity).to.equal(0);

		player.updatePhysics(500);
		expect(light.getState().intensity).to.equal(10);

		player.updatePhysics(600);
		expect(light.getState().intensity).to.equal(10);

		player.updatePhysics(700);
		expect(light.getState().intensity).to.equal(0);
	});

	it('should correctly fade in and out', async () => {
		const light = table.lights.Surface;
		const api = light.getApi();

		api.BlinkPattern = '10';
		api.BlinkInterval = 600;
		api.State = LightStatus.LightStateBlinking;
		api.Intensity = 100;
		api.IntensityScale = 1;
		api.FadeSpeedDown = 0.3;
		api.FadeSpeedUp = 0.4;

		player.updatePhysics(0);
		expect(light.getState().intensity).to.equal(100);

		player.updatePhysics(40);
		expect(light.getState().intensity).to.be.within(90, 91);

		player.updatePhysics(170);
		expect(light.getState().intensity).to.be.within(51, 53);

		player.updatePhysics(170);
		expect(light.getState().intensity).to.be.within(51, 53);

		player.updatePhysics(310);
		expect(light.getState().intensity).to.be.within(7, 9);

		player.updatePhysics(340);
		expect(light.getState().intensity).to.equal(0);

		player.updatePhysics(630);
		expect(light.getState().intensity).to.be.within(12, 13);

		player.updatePhysics(730);
		expect(light.getState().intensity).to.be.within(51, 52);

		player.updatePhysics(820);
		expect(light.getState().intensity).to.be.within(89, 91);

		player.updatePhysics(850);
		expect(light.getState().intensity).to.equal(100);
	});

	it('should pop the correct state', () => {
		const light = table.lights.Surface;
		const api = light.getApi();

		api.State = LightStatus.LightStateBlinking;
		player.updatePhysics(200);

		const state = player.popStates().getState<LightState>('Surface');
		expect(state.intensity).to.equal(table.lights.Surface.getState().intensity);
	});

});
