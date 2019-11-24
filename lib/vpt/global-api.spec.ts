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
import { ThreeHelper } from '../../test/three.helper';
import {
	DIK_1,
	DIK_4,
	DIK_5,
	DIK_LALT,
	DIK_LCONTROL,
	DIK_LSHIFT,
	DIK_Q,
	DIK_RCONTROL,
	DIK_RETURN,
	DIK_RSHIFT,
	DIK_SLASH,
	DIK_SPACE,
	DIK_T,
	DIK_Z,
} from '../game/key-code';
import { Player } from '../game/player';
import { NodeBinaryReader } from '../io/binary-reader.node';
import { GlobalApi } from './global-api';
import { Table } from './table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball global API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-kicker.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const api = new GlobalApi(table, player);

		expect(api.Name).to.equal('Global');
		expect(api.PlungerKey).to.equal(DIK_RETURN);
		expect(api.LeftFlipperKey).to.equal(DIK_LCONTROL);
		expect(api.RightFlipperKey).to.equal(DIK_RCONTROL);
		expect(api.LeftTiltKey).to.equal(DIK_Z);
		expect(api.RightTiltKey).to.equal(DIK_SLASH);
		expect(api.CenterTiltKey).to.equal(DIK_SPACE);
		expect(api.AddCreditKey).to.equal(DIK_5);
		expect(api.AddCreditKey2).to.equal(DIK_4);
		expect(api.StartGameKey).to.equal(DIK_1);
		expect(api.MechanicalTilt).to.equal(DIK_T);
		expect(api.RightMagnaSave).to.equal(DIK_RSHIFT);
		expect(api.LeftMagnaSave).to.equal(DIK_LSHIFT);
		expect(api.ExitGame).to.equal(DIK_Q);
		expect(api.RightFlipperKey).to.equal(DIK_RCONTROL);
		expect(api.LockbarKey).to.equal(DIK_LALT);
		expect(api.ActiveBall).to.equal(undefined);
		expect(api.GameTime).to.be.equal(0);
		expect(api.SystemTime).to.be.above(0);
		expect(api.NightDay).to.be.equal(51.99999809265137);
		expect(api.ShowDT).to.be.equal(true);
		expect(api.ShowFSS).to.be.equal(false);
		expect(api.GetPlayerHWnd).to.be.equal(null);
		expect(api.Version).to.equal(10600);
		expect(api.VPBuildVersion).to.equal(10600);
		expect(api.VersionMajor).to.equal(10);
		expect(api.VersionMinor).to.equal(6);
		expect(api.VersionRevision).to.equal(0);
		expect(api.VersionRevision).to.equal(0);
		player.setDimensions(1920, 1080);
		expect(api.WindowWidth).to.equal(1920);
		expect(api.WindowHeight).to.equal(1080);
		expect(api.GetCustomParam()).to.equal('');
	});

	it('should correctly return the balls in play', () => {

		const api = new GlobalApi(table, player);
		const kicker = table.kickers.Williams.getApi();
		expect(api.GetBalls()).to.have.lengthOf(0);

		kicker.CreateBall();
		kicker.Kick(0, 5);
		player.updatePhysics(100);
		expect(api.GetBalls()).to.have.lengthOf(1);

		const ball = kicker.CreateBall();
		expect(api.GetBalls()).to.have.lengthOf(2);

		player.destroyBall(ball);
		expect(api.GetBalls()).to.have.lengthOf(1);
	});

	it('should correctly return the playfield elements', () => {
		const api = new GlobalApi(table, player);
		const elements = api.GetElements();
		expect(elements.find(e => e.getName() === 'Williams')).to.be.ok;
		expect(elements).to.have.lengthOf(13);
	});

	it('should correctly return a playfield element', () => {
		const api = new GlobalApi(table, player);
		const element = api.GetElementByName('Williams');
		expect(element).to.be.ok;
		expect(element!.getName()).to.equal('Williams');
	});

	it('should apply the color of a material', () => {
		const api = new GlobalApi(table, player);
		const material = table.getMaterial('Playfield');
		expect(material).to.be.ok;
		expect(material!.baseColor).to.equal(0xb4b4b4);

		api.MaterialColor('Playfield', 0xff0000);
		expect(material!.baseColor).to.equal(0xff0000);
	});

	it('should correctly save and load values', () => {
		const api = new GlobalApi(table, player);
		api.SaveValue('myTable', 'myValueName', 'myValue');
		expect(api.LoadValue('myTable', 'myValueName')).to.equal('myValue');
	});

});
