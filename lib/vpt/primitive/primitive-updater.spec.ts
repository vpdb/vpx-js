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
import { Vertex3D } from '../../math/vertex3d';
import { Table } from '../table/table';
import { PrimitiveState } from './primitive-state';

/* tslint:disable:no-unused-expression */
chai.use(require('sinon-chai'));

describe('The VPinball primitive updater', () => {

	let table: Table;
	let player: Player;

	beforeEach(() => {

		table = new TableBuilder()
			.addMaterial('mat')
			.addPrimitive('pStatic', { staticRendering: true })
			.addPrimitive('pDynamic', { staticRendering: false })
			.build();

		// init player
		player = new Player(table).init();
	});

	it('should not update visibility when static rendering is enabled', () => {
		table.primitives.pStatic.getApi().Visible = false;
		const states = player.popStates();
		expect(states.getState<PrimitiveState>('pStatic')).not.to.be.ok;
	});

	it('should update visibility when static rendering is disabled', () => {
		table.primitives.pDynamic.getApi().Visible = false;
		const states = player.popStates();
		expect(states.getState<PrimitiveState>('pDynamic').isVisible).to.equal(false);
		states.getState<PrimitiveState>('pDynamic').release();
	});

	it('should update the material', () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyMaterial');
		table.primitives.pDynamic.getUpdater().applyState(null, { material: 'mat' } as PrimitiveState, renderApi, table);
		expect(renderApi.applyMaterial).to.have.been.calledOnce;
	});

	it('should update the transformation matrix', () => {
		const renderApi = new TestRenderApi();
		spy(renderApi, 'applyMatrixToNode');
		table.primitives.pDynamic.getUpdater().applyState(null, { size : new Vertex3D(1.5, 1, 1) } as PrimitiveState, renderApi, table);
		table.primitives.pDynamic.getUpdater().applyState(null, { rotation: new Vertex3D(45, 0, 0) } as PrimitiveState, renderApi, table);
		table.primitives.pDynamic.getUpdater().applyState(null, { translation : new Vertex3D(50, 10, 0) } as PrimitiveState, renderApi, table);
		table.primitives.pDynamic.getUpdater().applyState(null, { objectRotation: new Vertex3D(0, 45, 0) } as PrimitiveState, renderApi, table);
		expect(renderApi.applyMatrixToNode).to.have.been.callCount(4);
	});

});
