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
import { Vertex2D } from '../../../math/vertex2d';
import { Emulator } from './wpc-emu';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('WPC-EMU', () => {

	let emulator: Emulator;

	beforeEach(() => {
		emulator = new Emulator();
	});

	//TODO this fails due wpc-emu module loader
	it.skip('getVersion should be defined', () => {
		const result: string = emulator.getVersion();
		expect(result.length > 4).to.equal(true);
	});

	it('should not be initialized by default', () => {
		const result: boolean = emulator.isInitialized();
		expect(result).to.equal(false);
	});

	it('should get getDmdFrame', () => {
		const result: Uint8Array = emulator.getDmdFrame();
		expect(result.length).to.equal(0);
	});

	it('should ignore registerAudioConsumer when emu is not initialized', () => {
		emulator.registerAudioConsumer((id) => {});
	});

	it('getDmdDimensions should return correct size', () => {
		const result: Vertex2D = emulator.getDmdDimensions();
		expect(result.x).to.equal(128);
		expect(result.y).to.equal(32);
	});

	it('should ignore calls as long as the emu is not initialized', () => {
		emulator.setSwitchInput(4);
		emulator.setSwitchInput(4, true);
		emulator.setSwitchInput(4, false);
		emulator.setCabinetInput(4);
		emulator.setFliptronicsInput('FOO');
		const executedSteps = emulator.emuSimulateCycle(200);
		expect(executedSteps).to.equal(0);
	});

});
