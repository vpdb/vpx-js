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
import { TableBuilder } from '../../../test/table-builder';
import { EmulatorState } from '../../emu/emulator-state';
import { Emulator } from '../../emu/wpc-emu';
import { Player } from '../../game/player';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('VpmController integration test', () => {

	const sandbox = sinon.createSandbox();

	afterEach(() => {
		sandbox.restore();
	});

	function setupPlayerTable(vbs: string) {
		const scope = {};
		const table = new TableBuilder().withTableScript(vbs).build('Table1');
		new Player(table).init(scope);
	}

	it('VBS should update switch, Controller.Switch()', () => {
		const setSwitchInputSpy = sandbox.stub(Emulator.prototype, 'setSwitchInput').returns(true);
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.Switch(49) = 0\nController.Switch(51) = 1`;
		setupPlayerTable(vbs);

		expect(setSwitchInputSpy.args.length).to.equal(2);
		expect(setSwitchInputSpy.args[0]).to.deep.equal([ 49, false ]);
		expect(setSwitchInputSpy.args[1]).to.deep.equal([ 51, true ]);
	});

	it('VBS should update language setting, Controller.DIP()', () => {
		const setDipSwitchByteSpy = sandbox.stub(Emulator.prototype, 'setDipSwitchByte');
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.DIP(0) = &H00`;
		setupPlayerTable(vbs);

		expect(setDipSwitchByteSpy.args.length).to.equal(1);
		expect(setDipSwitchByteSpy.args[0]).to.deep.equal([ 0 ]);
	});

	it('VBS should update language setting, Controller.Dip()', () => {
		const setDipSwitchByteSpy = sandbox.stub(Emulator.prototype, 'setDipSwitchByte');
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.Dip(0) = &H70`;
		setupPlayerTable(vbs);

		expect(setDipSwitchByteSpy.args.length).to.equal(1);
		expect(setDipSwitchByteSpy.args[0]).to.deep.equal([ 112 ]);
	});

	it('VBS should read solenoid, Controller.Solenoid()', () => {
		const getSolenoidSpy = sandbox.stub(Emulator.prototype, 'getSolenoidState');
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.Solenoid(4)`;
		setupPlayerTable(vbs);

		expect(getSolenoidSpy.args.length).to.equal(1);
		expect(getSolenoidSpy.args[0]).to.deep.equal([ 4 ]);
	});

	it('VBS should read lamp, Controller.Lamp()', () => {
		const getLampSpy = sandbox.stub(Emulator.prototype, 'getLampState');
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.Lamp(3)`;
		setupPlayerTable(vbs);

		expect(getLampSpy.args.length).to.equal(1);
		expect(getLampSpy.args[0]).to.deep.equal([ 3 ]);
	});

	it('VBS should read changed lamp, Controller.ChangedLamps', () => {
		const getChangedLampsSpy = sandbox.stub(EmulatorState.prototype, 'getChangedLamps');
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.ChangedLamps`;
		setupPlayerTable(vbs);

		expect(getChangedLampsSpy.args.length).to.equal(1);
		expect(getChangedLampsSpy.args[0]).to.deep.equal([  ]);
	});

	it('VBS should read changed lamp, Controller.ChangedGI', () => {
		const getChangedGISpy = sandbox.stub(EmulatorState.prototype, 'getChangedGI');
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.ChangedGI`;
		setupPlayerTable(vbs);

		expect(getChangedGISpy.args.length).to.equal(1);
		expect(getChangedGISpy.args[0]).to.deep.equal([  ]);
	});

	it('VBS should read changed lamp, Controller.ChangedSolenoids', () => {
		const getChangedSolenoidsSpy = sandbox.stub(EmulatorState.prototype, 'getChangedSolenoids');
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.ChangedSolenoids`;
		setupPlayerTable(vbs);

		expect(getChangedSolenoidsSpy.args.length).to.equal(1);
		expect(getChangedSolenoidsSpy.args[0]).to.deep.equal([  ]);
	});

	it('VBS should read changed lamp, Controller.ChangedLEDs', () => {
		const getChangedLEDsSpy = sandbox.stub(EmulatorState.prototype, 'getChangedLEDs');
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.ChangedLEDs`;
		setupPlayerTable(vbs);

		expect(getChangedLEDsSpy.args.length).to.equal(1);
		expect(getChangedLEDsSpy.args[0]).to.deep.equal([  ]);
	});

});
