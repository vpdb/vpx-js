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
import { Player } from '../../game/player';
import { Emulator } from '../../emu/wpc-emu';
import { EmulatorState } from '../../emu/emulator-state';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('VpmController integration test', () => {

	const sandbox = sinon.createSandbox();
	let setSwitchInputSpy: SinonStub<[number, boolean?]>;
	let setDipSwitchByteSpy: SinonStub<[number]>;
	let getSolenoidSpy: SinonStub<[number]>;
	let getLampSpy: SinonStub<[number]>;
	let getChangedLampsSpy: SinonStub<any>;
	let getChangedSolenoidsSpy: SinonStub<any>;
	let getChangedGISpy: SinonStub<any>;
	let getChangedLEDsSpy: SinonStub<any>;

	beforeEach(() => {
		setSwitchInputSpy = sandbox.stub(Emulator.prototype, 'setSwitchInput').returns(true);
		setDipSwitchByteSpy = sandbox.stub(Emulator.prototype, 'setDipSwitchByte');
		getSolenoidSpy = sandbox.stub(Emulator.prototype, 'getSolenoidState');
		getLampSpy = sandbox.stub(Emulator.prototype, 'getLampState');
		getChangedLampsSpy = sandbox.stub(EmulatorState.prototype, 'getChangedLamps');
		getChangedSolenoidsSpy = sandbox.stub(EmulatorState.prototype, 'getChangedSolenoids');
		getChangedGISpy = sandbox.stub(EmulatorState.prototype, 'getChangedGI');
		getChangedLEDsSpy = sandbox.stub(EmulatorState.prototype, 'getChangedLEDs');
	});

	afterEach(() => {
		sandbox.restore();
	});

	function setupPlayerTable(vbs) {
		const scope = {};
		const table = new TableBuilder().withTableScript(vbs).build('Table1');
		new Player(table).init(scope);
	}

	it('VBS should update switch, Controller.Switch()', () => {
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.Switch(49) = 0\nController.Switch(51) = 1`;
		setupPlayerTable(vbs);
		expect(setSwitchInputSpy.args.length).to.equal(2);
		expect(setSwitchInputSpy.args[0]).to.deep.equal([ 49, false ]);
		expect(setSwitchInputSpy.args[1]).to.deep.equal([ 51, true ]);
	});

	it('VBS should update language setting, Controller.DIP()', () => {
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.DIP(0) = &H00`;
		setupPlayerTable(vbs);

		expect(setDipSwitchByteSpy.args.length).to.equal(1);
		expect(setDipSwitchByteSpy.args[0]).to.deep.equal([ 0 ]);
	});

	it('VBS should update language setting, Controller.Dip()', () => {
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.Dip(0) = &H70`;
		setupPlayerTable(vbs);

		expect(setDipSwitchByteSpy.args.length).to.equal(1);
		expect(setDipSwitchByteSpy.args[0]).to.deep.equal([ 112 ]);
	});

	it('VBS should read solenoid, Controller.Solenoid()', () => {
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.Solenoid(4)`;
		setupPlayerTable(vbs);

		expect(getSolenoidSpy.args.length).to.equal(1);
		expect(getSolenoidSpy.args[0]).to.deep.equal([ 4 ]);
	});

	it('VBS should read lamp, Controller.Lamp()', () => {
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.Lamp(3)`;
		setupPlayerTable(vbs);

		expect(getLampSpy.args.length).to.equal(1);
		expect(getLampSpy.args[0]).to.deep.equal([ 3 ]);
	});

	it('VBS should read changed lamp, Controller.ChangedLamps', () => {
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.ChangedLamps`;
		setupPlayerTable(vbs);

		expect(getChangedLampsSpy.args.length).to.equal(1);
		expect(getChangedLampsSpy.args[0]).to.deep.equal([  ]);
	});

	it('VBS should read changed lamp, Controller.ChangedGI', () => {
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.ChangedGI`;
		setupPlayerTable(vbs);

		expect(getChangedGISpy.args.length).to.equal(1);
		expect(getChangedGISpy.args[0]).to.deep.equal([  ]);
	});

	it('VBS should read changed lamp, Controller.ChangedSolenoids', () => {
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.ChangedSolenoids`;
		setupPlayerTable(vbs);

		expect(getChangedSolenoidsSpy.args.length).to.equal(1);
		expect(getChangedSolenoidsSpy.args[0]).to.deep.equal([  ]);
	});

	it('VBS should read changed lamp, Controller.ChangedLEDs', () => {
		const vbs = `Dim Controller\nSet Controller = CreateObject("VPinMAME.Controller")\nController.ChangedLEDs`;
		setupPlayerTable(vbs);

		expect(getChangedLEDsSpy.args.length).to.equal(1);
		expect(getChangedLEDsSpy.args[0]).to.deep.equal([  ]);
	});

});
