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
import { spy } from 'sinon';
import { TableBuilder } from '../../../test/table-builder';
import { TestRenderApi } from '../../../test/test-render-api';
import { Player } from '../../game/player';
import { Enums, KickerType } from '../enums';
import { Table } from '../table/table';
import { KickerState } from './kicker-state';

/* tslint:disable:no-unused-expression */
chai.use(require('sinon-chai'));

describe('The VPinball kicker updater', () => {

	let table: Table;
	let player: Player;

	beforeEach(() => {
		table = new TableBuilder()
			.addMaterial('opaque', { isOpacityActive: false })
			.addKicker('kicker')
			.build();

		// init player
		player = new Player(table).init();
	});

	it('should update visibility', async () => {
		table.kickers.kicker.getApi().DrawStyle = Enums.KickerType.KickerInvisible;
		const states = player.popStates();

		expect(states.getState<KickerState>('kicker').isVisible).to.equal(false);
		states.getState<KickerState>('kicker').release();
	});

	it('should apply visibility', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyVisibility');
		table.kickers.kicker.getUpdater().applyState(null, { type: Enums.KickerType.KickerInvisible } as KickerState, renderApi, table);
		expect(renderApi.applyVisibility).to.have.been.calledOnceWith(false);
	});

	it('should apply the material', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyMaterial');
		table.kickers.kicker.getUpdater().applyState(null, { material: 'opaque' } as KickerState, renderApi, table);
		expect(renderApi.applyMaterial).to.have.been.calledOnce;
	});

});
