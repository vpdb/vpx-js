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
import { Table } from '../table/table';
import { FlipperState } from './flipper-state';

/* tslint:disable:no-unused-expression */
chai.use(require('sinon-chai'));

describe('The VPinball flipper updater', () => {

	let table: Table;
	let player: Player;

	beforeEach(() => {

		table = new TableBuilder()
			.addMaterial('opaque', { isOpacityActive: false })
			.addFlipper('flipper')
			.build();

		// init player
		player = new Player(table).init();
	});

	it('should update visibility', async () => {
		table.flippers.flipper.getApi().Visible = false;
		const states = player.popStates();

		expect(states.getState<FlipperState>('flipper').isVisible).to.equal(false);
		states.getState<FlipperState>('flipper').release();
	});

	it('should apply visibility', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyVisibility');
		table.flippers.flipper.getUpdater().applyState(null, { isVisible: true } as FlipperState, renderApi, table);
		expect(renderApi.applyVisibility).to.have.been.calledOnceWith(true);
	});

	it('should apply the material', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyMaterial');
		table.flippers.flipper.getUpdater().applyState(null, { material: 'opaque' } as FlipperState, renderApi, table);
		expect(renderApi.applyMaterial).to.have.been.calledOnce;
	});

	it('should apply the transformation', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyMatrixToNode');
		table.flippers.flipper.getUpdater().applyState(null, { angle: 1 } as FlipperState, renderApi, table);
		expect(renderApi.applyMatrixToNode).to.have.been.calledOnce;
	});

});
