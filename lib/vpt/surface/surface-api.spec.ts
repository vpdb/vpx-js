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
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball surface API', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-surface.vpx')));
	});

	beforeEach(async () => {
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {

		const surface = table.surfaces.Wall.getApi();

		surface.HasHitEvent = false; expect(surface.HasHitEvent).to.equal(false);
		surface.HasHitEvent = true;
		surface.Threshold = 2.332;
		surface.Image = 'imgzz';
		surface.SideMaterial = 'sidemat';
		surface.SlingshotMaterial = 'slingmat';
		surface.ImageAlignment = 'duh';
		surface.HeightBottom = 332.128;
		surface.HeightTop = 554.96598;
		surface.TopMaterial = 'topmat';
		surface.PhysicsMaterial = 'pmat';
		surface.OverwritePhysics = false; expect(surface.OverwritePhysics).to.equal(false);
		surface.OverwritePhysics = true;
		surface.CanDrop = false; expect(surface.CanDrop).to.equal(false);
		surface.CanDrop = true;
		surface.FlipbookAnimation = false; expect(surface.FlipbookAnimation).to.equal(false);
		surface.FlipbookAnimation = true;
		surface.IsBottomSolid = false; expect(surface.IsBottomSolid).to.equal(false);
		surface.IsBottomSolid = true;
		surface.IsDropped = false; expect(surface.IsDropped).to.equal(false);
		surface.IsDropped = true;
		surface.DisplayTexture = false; expect(surface.DisplayTexture).to.equal(false);
		surface.DisplayTexture = true;
		surface.SlingshotStrength = 8.6554;
		surface.Elasticity = 1.0043;
		surface.Friction = 3.552056;
		surface.Scatter = 3.14159;
		surface.Visible = false; expect(surface.Visible).to.equal(false);
		surface.Visible = true;
		surface.Disabled = false; expect(surface.Disabled).to.equal(false);
		surface.Disabled = true;
		surface.SideVisible = false; expect(surface.SideVisible).to.equal(false);
		surface.SideVisible = true;
		surface.Collidable = false; expect(surface.Collidable).to.equal(true); // this is weird (same in VP)!
		surface.Collidable = true;
		surface.SlingshotThreshold = 0.239578;
		surface.SlingshotAnimation = false; expect(surface.SlingshotAnimation).to.equal(false);
		surface.SlingshotAnimation = true;
		surface.DisableLighting = false; expect(surface.DisableLighting).to.equal(false);
		surface.DisableLighting = true;
		surface.BlendDisableLighting = 0.3;
		surface.BlendDisableLightingFromBelow = 0.5;
		surface.ReflectionEnabled = false; expect(surface.ReflectionEnabled).to.equal(false);
		surface.ReflectionEnabled = true;

		expect(surface.HasHitEvent).to.equal(true);
		expect(surface.Threshold).to.equal(2.332);
		expect(surface.Image).to.equal('imgzz');
		expect(surface.SideMaterial).to.equal('sidemat');
		expect(surface.SlingshotMaterial).to.equal('slingmat');
		expect(surface.ImageAlignment).to.equal('duh');
		expect(surface.HeightBottom).to.equal(332.128);
		expect(surface.HeightTop).to.equal(554.96598);
		expect(surface.TopMaterial).to.equal('topmat');
		expect(surface.PhysicsMaterial).to.equal('pmat');
		expect(surface.OverwritePhysics).to.equal(true);
		expect(surface.CanDrop).to.equal(true);
		expect(surface.FlipbookAnimation).to.equal(true);
		expect(surface.IsBottomSolid).to.equal(true);
		expect(surface.IsDropped).to.equal(true);
		expect(surface.DisplayTexture).to.equal(true);
		expect(surface.SlingshotStrength).to.equal(8.6554);
		expect(surface.Elasticity).to.equal(1.0043);
		expect(surface.Friction).to.equal(3.552056);
		expect(surface.Scatter).to.equal(3.14159);
		expect(surface.Visible).to.equal(true);
		expect(surface.Disabled).to.equal(true);
		expect(surface.SideVisible).to.equal(true);
		expect(surface.Collidable).to.equal(true);
		expect(surface.SlingshotThreshold).to.equal(0.239578);
		expect(surface.SlingshotAnimation).to.equal(true);
		expect(surface.DisableLighting).to.equal(true);
		expect(surface.BlendDisableLighting).to.equal(0.3);
		expect(surface.BlendDisableLightingFromBelow).to.equal(0.5);
		expect(surface.ReflectionEnabled).to.equal(true);

		surface.Name = 'duh-doh'; expect(surface.Name).to.equal('duh-doh');
		surface.TimerInterval = 5513; expect(surface.TimerInterval).to.equal(5513);
		surface.TimerEnabled = false; expect(surface.TimerEnabled).to.equal(false);
		surface.TimerEnabled = true; expect(surface.TimerEnabled).to.equal(true);
		surface.UserValue = 'wazzup'; expect(surface.UserValue).to.equal('wazzup');

		// reset table for next tests
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-surface.vpx')));
	});

	it('should correctly handle side image attribution', () => {
		const surface = table.surfaces.Wall.getApi();
		expect(() => surface.SideImage = 'some-image').to.throw('Texture "some-image" not found.');
		//expect(() => surface.SideImage = 'hdr').to.throw('Cannot use a HDR image (.exr/.hdr) here');
		surface.SideImage = 'ldr'; expect(surface.SideImage).to.equal('ldr');
	});

	it('should trigger an Init event', () => {
		const surface = table.surfaces.Wall.getApi();
		const eventSpy = sinon.spy();
		surface.on('Init', eventSpy);
		player.init();

		expect(eventSpy).to.have.been.calledOnce;
	});

	it('should throw an error when dropping a non-droppable wall', () => {
		const surface = table.surfaces.Wall.getApi();
		surface.CanDrop = false;
		expect(() => surface.IsDropped = true).to.throw('Surface "Wall" is not droppable.');
	});

});
