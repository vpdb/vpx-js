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
import { TableBuilder } from '../../../test/table-builder';
import { Player } from '../../game/player';
import { Table } from '../../vpt/table/table';
import { VpmController } from './vpm-controller';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe.only('The VpmController - VISUAL PINMAME COM OBJECT', () => {

	let vpmController: VpmController;

	beforeEach(() => {
		const table: Table = new TableBuilder().build();
		const player: Player = new Player(table);
		vpmController = new VpmController(player);
	});

	//TODO this fails due module loader
	it('should set and get GameName', () => {
		const NAME: string = 'foo';
		vpmController.GameName = NAME;
		expect(vpmController.GameName).to.equal(NAME);
	});

	it('should set and get Dip[0]', () => {
		const VALUE: number = 0x55;
		vpmController.Dip[0] = VALUE;
		expect(vpmController.Dip[0]).to.equal(VALUE);
	});

	it('should set and get Dip[40]', () => {
		const VALUE: number = 0x5;
		vpmController.Dip[40] = VALUE;
		expect(vpmController.Dip[40]).to.equal(VALUE);
	});

	it('no changed lamps detected', () => {
		const result = vpmController.ChangedLamps;
		expect(result).to.deep.equal([]);
	});

	it.skip('should return one changed lamp', () => {
		const resultIndex = vpmController.ChangedLamps[0][0];
		const resultValue = vpmController.ChangedLamps[0][1];
		expect(resultIndex).to.equal(42);
		//TODO unclear if uint8 or float type
		expect(resultValue).to.equal(0.5);
	});

	it('get Switch 0', () => {
		const result = vpmController.Switch[0];
		expect(result).to.deep.equal(0);
	});

	it.skip('set Switch 0', () => {
		vpmController.Switch[0] = 5;
		const result = vpmController.Switch[0];
		expect(result).to.deep.equal(5);
	});

	it('get Lamp 0', () => {
		const result = vpmController.Lamp[0];
		expect(result).to.deep.equal(0);
	});

	it('get Solenoid 0', () => {
		const result = vpmController.Solenoid[0];
		expect(result).to.deep.equal(0);
	});

	it('get GIString 0', () => {
		const result = vpmController.GIString[0];
		expect(result).to.deep.equal(0);
	});

	it('is WPCNumbering?', () => {
		const result: number = vpmController.WPCNumbering;
		expect(result).to.equal(1);
	});

	it('get SampleRate', () => {
		const result: number = vpmController.SampleRate;
		expect(result).to.equal(22050);
	});

	it('set and get SplashInfoLine', () => {
		vpmController.SplashInfoLine = 'SPLASH!';
		const result: string = vpmController.SplashInfoLine;
		expect(result).to.equal('SPLASH!');
	});

	it('dummy Debugging function (GET): ShowDMDOnly', () => {
		const result: boolean = vpmController.ShowDMDOnly;
		expect(result).to.equal(false);
	});

	it('dummy Debugging function (GET): HandleKeyboard', () => {
		const result: boolean = vpmController.HandleKeyboard;
		expect(result).to.equal(false);
	});

	it('dummy Debugging function (GET): ShowTitle', () => {
		const result: boolean = vpmController.ShowTitle;
		expect(result).to.equal(false);
	});

	it('set dummy Debugging functions', () => {
		vpmController.ShowDMDOnly = true;
		vpmController.HandleKeyboard = true;
		vpmController.ShowTitle = true;
		expect(vpmController.ShowTitle).to.equal(false);
	});

	it('dummy Customization function (GET): LockDisplay', () => {
		vpmController.LockDisplay = true;
		const result: boolean = vpmController.LockDisplay;
		expect(result).to.equal(false);
	});

	it('dummy Customization function: Hidden', () => {
		vpmController.Hidden = true;
		const result: boolean = vpmController.Hidden;
		expect(result).to.equal(false);
	});

	it('dummy Customization function: DoubleSize', () => {
		vpmController.DoubleSize = true;
		const result: boolean = vpmController.DoubleSize;
		expect(result).to.equal(false);
	});

	it('dummy Customization function: Antialias', () => {
		vpmController.Antialias = true;
		const result: boolean = vpmController.Antialias;
		expect(result).to.equal(false);
	});

	it('dummy Customization function: ShowFrame', () => {
		vpmController.ShowFrame = true;
		const result: boolean = vpmController.ShowFrame;
		expect(result).to.equal(false);
	});

	it('dummy Customization function: DoubleSize', () => {
		vpmController.BorderSizeX = 5;
		const result: number = vpmController.BorderSizeX;
		expect(result).to.equal(0);
	});

	it('dummy Customization function: BorderSizeY', () => {
		vpmController.BorderSizeY = 5;
		const result: number = vpmController.BorderSizeY;
		expect(result).to.equal(0);
	});

	it('dummy Customization function: WindowPosX', () => {
		vpmController.WindowPosX = 5;
		const result: number = vpmController.WindowPosX;
		expect(result).to.equal(0);
	});

	it('dummy Customization function: WindowPosY', () => {
		vpmController.WindowPosY = 5;
		const result: number = vpmController.WindowPosY;
		expect(result).to.equal(0);
	});

	it('dummy GameSetting function: HandleMechanics', () => {
		vpmController.HandleMechanics = 1;
		const result: number = vpmController.HandleMechanics;
		expect(result).to.equal(0);
	});

});
