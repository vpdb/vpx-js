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
import { TableBuilder } from '../../test/table-builder';
import { Table } from '../vpt/table/table';
import { AssignKey } from './key-code';
import { Player } from './player';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The VPinball input handler', () => {
	let table: Table;
	let player: Player;
	let scope: any;

	beforeEach(() => {
		scope = {};
		// this just writes the key code to the scope so we can assert it later
		const vbs = `Sub Table1_KeyDown(ByVal keycode)\nkeyDown = keycode\nEnd Sub\nSub Table1_KeyUp(ByVal keycode)\nkeyUp = keycode\nEnd Sub\n`;
		table = new TableBuilder().withTableScript(vbs).build('Table1');
		player = new Player(table).init(scope);
	});

	it('should react on left flipper key down', () => {
		player.onKeyDown({ code: 'ControlLeft', key: 'Control', ts: Date.now() });
		player.updatePhysics(20);
		expect(scope.keyDown).to.be.equal(player.getKey(AssignKey.LeftFlipperKey));
	});

	it('should react on plunger key down', () => {
		player.onKeyDown({ code: 'Enter', key: 'Enter', ts: Date.now() });
		player.updatePhysics(20);
		expect(scope.keyDown).to.be.equal(player.getKey(AssignKey.PlungerKey));
	});

	it('should react on some other key down', () => {
		player.onKeyDown({ code: 'KeyG', key: 'g', ts: Date.now() });
		player.updatePhysics(20);
		expect(scope.keyDown).to.be.equal(0x22);
	});

	it('should react on a key up', () => {
		player.onKeyUp({ code: 'ControlRight', key: 'Control', ts: Date.now() });
		player.updatePhysics(20);
		expect(scope.keyUp).to.be.equal(player.getKey(AssignKey.RightFlipperKey));
	});
});
