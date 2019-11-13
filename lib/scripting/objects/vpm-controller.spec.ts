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
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { TableBuilder } from '../../../test/table-builder';
import { Emulator } from '../../emu/wpc-emu';
import { Player } from '../../game/player';
import { Table } from '../../vpt/table/table';
import { VpmController } from './vpm-controller';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The VpmController - VISUAL PINMAME COM OBJECT', () => {

	const sandbox = sinon.createSandbox();
	let vpmController: VpmController;
	let setSwitchInputSpy: SinonStub<[number, boolean?]>;
	let setFliptronicsInputSpy: SinonStub<[string, boolean?]>;

	beforeEach(() => {
		setSwitchInputSpy = sandbox.stub(Emulator.prototype, 'setSwitchInput').returns(true);
		setFliptronicsInputSpy = sandbox.stub(Emulator.prototype, 'setFliptronicsInput');

		const table: Table = new TableBuilder().build();
		const player: Player = new Player(table);
		vpmController = new VpmController(player);
	});

	afterEach(() => {
		sandbox.restore();
	});

	//TODO this fails due wpc-emu module loader
	it('should set and get GameName', () => {
		const NAME: string = 'foo';
		vpmController.GameName = NAME;
		expect(vpmController.GameName).to.equal(NAME);
	});

	it('should set and get pause state', () => {
		vpmController.Pause = true;
		expect(vpmController.Pause).to.equal(true);
	});

	it('should not run when paused', () => {
		vpmController.Pause = true;
		expect(vpmController.Running).to.equal(false);
	});

	it('should not run when emu is not initialized', () => {
		vpmController.Pause = false;
		expect(vpmController.Running).to.equal(false);
	});

	it('should Stop', () => {
		vpmController.Stop();
		expect(vpmController.Running).to.equal(false);
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

	it('no changed solenoid detected', () => {
		const result = vpmController.ChangedSolenoids;
		expect(result).to.deep.equal([]);
	});

	it('no changed GI detected', () => {
		const result = vpmController.ChangedGI;
		expect(result).to.deep.equal([]);
	});

	it('no changed LEDs detected', () => {
		const result = vpmController.ChangedLEDs;
		expect(result).to.deep.equal([]);
	});

	it('should ignore writes to RO settings', () => {
		vpmController.Solenoid[0] = 1;
		vpmController.Lamp[0] = 1;
		vpmController.GIString[0] = 1;
		vpmController.Switch[0] = 1;
		expect(vpmController.Solenoid[0]).to.equal(0);
	});

	it('should ignore calls to Customization functions', () => {
		vpmController.SetDisplayPosition(1, 2, 3);
		vpmController.ShowOptsDialog(3);
		vpmController.ShowPathesDialog(3);
		const foo = vpmController.ShowAboutDialog(3);
		expect(foo).to.equal(undefined);
	});

	it('get Switch 0 (offset 11)', () => {
		const result = vpmController.Switch[11];
		expect(result).to.deep.equal(0);
	});

	it('validate setSwitchInput is called with the correct settings, using 1 as input', () => {
		vpmController.Switch[11] = 1;
		expect(setSwitchInputSpy.args[0]).to.deep.equal([ 11, true ]);
	});

	it('validate setSwitchInput is called with the correct settings, using 0 as input', () => {
		vpmController.Switch[11] = 0;
		expect(setSwitchInputSpy.args[0]).to.deep.equal([ 11, false ]);
	});

	it('validate setFliptronicsInput is called (F2), using 0 as input', () => {
		vpmController.Switch[112] = 0;
		expect(setFliptronicsInputSpy.args[0]).to.deep.equal([ 'F2', false ]);
	});

	it('validate setFliptronicsInput is called (F6), using 1 as input', () => {
		vpmController.Switch[116] = 1;
		expect(setFliptronicsInputSpy.args[0]).to.deep.equal([ 'F6', true ]);
	});

	it('validate setFliptronicsInput is called (F8), using false as input', () => {
		// @ts-ignore
		vpmController.Switch[118] = false;
		expect(setFliptronicsInputSpy.args[0]).to.deep.equal([ 'F8', false ]);
	});

	it('validate setSwitchInput is called with the correct settings, using true as input', () => {
		// @ts-ignore
		vpmController.Switch[11] = true;
		expect(setSwitchInputSpy.args[0]).to.deep.equal([ 11, true ]);
	});

	it('validate setSwitchInput is called with the correct settings, using false as input', () => {
		// @ts-ignore
		vpmController.Switch[11] = false;
		expect(setSwitchInputSpy.args[0]).to.deep.equal([ 11, false ]);
	});

	it('get Lamp 0 (offset 11)', () => {
		const result = vpmController.Lamp[11];
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

	it('CheckROMS()', () => {
		const result: boolean = vpmController.CheckROMS(1);
		expect(result).to.equal(true);
	});

	it('get Version', () => {
		const result: string = vpmController.Version;
		expect(result).to.equal('00990201');
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
