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
import { RampType } from '../enums';
import { Table } from '../table/table';
import { RampState } from './ramp-state';

/* tslint:disable:no-unused-expression */
chai.use(require('sinon-chai'));

describe('The VPinball ramp updater', () => {

	let table: Table;
	let player: Player;

	beforeEach(() => {

		table = new TableBuilder()
			.addMaterial('opaque', { isOpacityActive: false })
			.addMaterial('transparent', { isOpacityActive: true })
			.addRamp('ramp1', { szMaterial: 'opaque', rampType: RampType.RampTypeFlat })
			.addRamp('ramp2', { szMaterial: 'transparent', rampType: RampType.RampTypeFlat })
			.addRamp('ramp3', { szMaterial: 'transparent', rampType: RampType.RampType4Wire })
			.build();

		// init player
		player = new Player(table).init();
	});

	it('should not update visibility when opacity is inactive', async () => {
		table.ramps.ramp1.getApi().Visible = false;
		const states = player.popStates();
		expect(states.getState<RampState>('ramp1')).not.to.be.ok;
	});

	it('should update visibility when opacity is active', async () => {
		table.ramps.ramp2.getApi().Visible = false;
		const states = player.popStates();

		expect(states.getState<RampState>('ramp2').isVisible).to.equal(false);
		states.getState<RampState>('ramp2').release();
	});

	it('should apply visibility', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyVisibility');
		table.ramps.ramp2.getUpdater().applyState(null, { isVisible: true } as RampState, renderApi, table);
		expect(renderApi.applyVisibility).to.have.been.calledOnceWith(true);
	});

	it('should update the flat mesh', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyMeshToNode');
		table.ramps.ramp2.getUpdater().applyState(null, { heightTop: 500 } as RampState, renderApi, table);
		expect(renderApi.applyMeshToNode).to.have.been.callCount(3);
	});

	it('should update the wire mesh', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyMeshToNode');
		table.ramps.ramp3.getUpdater().applyState(null, { heightTop: 500 } as RampState, renderApi, table);
		expect(renderApi.applyMeshToNode).to.have.been.callCount(4);
	});

	it('should replace a mesh', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'removeChildren');
		spy(renderApi, 'addChildToParent');
		table.ramps.ramp2.getUpdater().applyState(null, { type: RampType.RampType2Wire } as RampState, renderApi, table);
		expect(renderApi.removeChildren).to.have.been.calledOnce;
		expect(renderApi.addChildToParent).to.have.been.calledTwice;
	});

});
