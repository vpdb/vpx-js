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
import { SurfaceState } from './surface-state';

/* tslint:disable:no-unused-expression */
chai.use(require('sinon-chai'));

describe('The VPinball surface updater', () => {

	let table: Table;
	let player: Player;

	beforeEach(() => {
		table = new TableBuilder()
			.addMaterial('static', { isOpacityActive: false })
			.addMaterial('dynamic', { isOpacityActive: true })
			.addSurface('s1', { szTopMaterial: 'static', szSideMaterial: 'dynamic' })
			.addSurface('s2', { szTopMaterial: 'static', szSideMaterial: 'static' })
			.build();

		// init player
		player = new Player(table).init();
	});

	it('should not update visibility when opacity is disabled', () => {
		table.surfaces.s2.getApi().Visible = false;
		table.surfaces.s2.getApi().SideVisible = false;
		const states = player.popStates();
		expect(states.getState<SurfaceState>('s2')).not.to.be.ok;
	});

	it('should update visibility when opacity is active', () => {
		table.surfaces.s1.getApi().SideVisible = false;
		table.surfaces.s1.getApi().Visible = false;
		const states = player.popStates();
		expect(states.getState<SurfaceState>('s1').isTopVisible).to.equal(false);
		expect(states.getState<SurfaceState>('s1').isSideVisible).to.equal(false);
		states.getState<SurfaceState>('s1').release();
	});

	it('should apply visibility', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyVisibility');
		table.surfaces.s1.getUpdater().applyState(null, { isTopVisible: true, isSideVisible: true } as SurfaceState, renderApi, table);
		expect(renderApi.applyVisibility).to.have.been.calledTwice;
	});

	it('should apply the material', () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyMaterial');
		table.surfaces.s1.getUpdater().applyState(null, { topMaterial: 'dynamic', sideMaterial: 'dynamic' } as SurfaceState, renderApi, table);
		expect(renderApi.applyMaterial).to.have.been.calledTwice;
	});

	it('should apply the transformation', async () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyMatrixToNode');
		table.surfaces.s1.getUpdater().applyState(null, { isDropped: true } as SurfaceState, renderApi, table);
		expect(renderApi.applyMatrixToNode).to.have.been.calledOnce;
	});

});
