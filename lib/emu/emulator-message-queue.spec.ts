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
import { IEmulator } from '../game/iemulator';
import { Vertex2D } from '../math/vertex2d';
import { EmulatorMessageQueue, MessageType } from './emulator-message-queue';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The WPC-EMU message queue', () => {

	let messageQueue: EmulatorMessageQueue;
	let mockEmulator: IEmulator;
	let queue: object[];

	beforeEach(() => {
		messageQueue = new EmulatorMessageQueue();
		queue = [];
		mockEmulator = new MockEmulator(queue);
	});

	it('should add switch toggle to queue and replay it', () => {
		const addedToQueue = messageQueue.addMessage(MessageType.ToggleSwitchInput, 42);
		messageQueue.replayMessages(mockEmulator);
		expect(addedToQueue).to.equal(true);
		expect(queue).to.deep.equal([{
			optionalEnableSwitch: undefined,
			switchNr: 42,
		}]);
	});

	it('should add switch set to queue and apply it', () => {
		messageQueue.addMessage(MessageType.SetSwitchInput, 42);
		messageQueue.replayMessages(mockEmulator);
		expect(queue).to.deep.equal([{
			optionalEnableSwitch: true,
			switchNr: 42,
		}]);
	});

	it('should add switch clear to queue and replay it', () => {
		messageQueue.addMessage(MessageType.ClearSwitchInput, 42);
		messageQueue.replayMessages(mockEmulator);
		expect(queue).to.deep.equal([{
			optionalEnableSwitch: false,
			switchNr: 42,
		}]);
	});

	it('should add cabinet input to queue and replay it', () => {
		messageQueue.addMessage(MessageType.CabinetInput, 4);
		messageQueue.replayMessages(mockEmulator);
		expect(queue).to.deep.equal([{
			keyNr: 4,
		}]);
	});

	it('should add execute ticks to queue and replay it', () => {
		messageQueue.addMessage(MessageType.ExecuteTicks, 4);
		messageQueue.replayMessages(mockEmulator);
		expect(queue).to.deep.equal([{
			dTime: 4,
		}]);
	});

	it('should should warn when add entries to queue if already consumed', () => {
		messageQueue.replayMessages(mockEmulator);
		const addedToQueue = messageQueue.addMessage(MessageType.SetSwitchInput, 42);
		expect(addedToQueue).to.equal(false);
	});
});

class MockEmulator implements IEmulator {
	private messages: object[];
	constructor(cache: object[]) {
		this.messages = cache;
	}
	public emuSimulateCycle(dTime: number): void {
		this.messages.push({dTime});
	}
	public getDmdFrame(): Uint8Array {
		throw new Error('Method not implemented.');
	}
	public getDmdDimensions(): Vertex2D {
		throw new Error('Method not implemented.');
	}
	public setCabinetInput(keyNr: number): void {
		this.messages.push({keyNr});
	}
	public setSwitchInput(switchNr: number, optionalEnableSwitch?: boolean): void {
		this.messages.push({switchNr, optionalEnableSwitch});
	}
}
