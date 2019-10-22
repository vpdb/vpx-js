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

import { expect } from 'chai';
import { vbsToJs } from '../../test/script.helper';

describe('The VBScript transpiler - Subcall', () => {
	it('should transpile a subcall statement without params', () => {
		const vbs = `BallRelease\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease();');
	});

	it('should transpile a subcall statement with params', () => {
		const vbs = `BallRelease 5, -2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease(5, -2);');
	});

	it('should transpile an object.property subcall statement without params', () => {
		const vbs = `BallRelease.CreateBall\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.CreateBall();');
	});

	it('should transpile an object.property subcall statement without params with parenthesis', () => {
		const vbs = `BallRelease.CreateBall()\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.CreateBall();');
	});

	it('should transpile an object.property subcall statement with params', () => {
		const vbs = `BallRelease.KickBall 0, -2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.KickBall(0, -2);');
	});

	it('should transpile an object.property subcall statement with params', () => {
		const vbs = `BallRelease.KickBall (0), -2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.KickBall(0, -2);');
	});

	it('should transpile an object.property subcall statement with params', () => {
		const vbs = `BallRelease.KickBall 0, (-2)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.KickBall(0, -2);');
	});

	it('should transpile an object.property subcall statement with params', () => {
		const vbs = `BallRelease.KickBall (0), (-2)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.KickBall(0, -2);');
	});

	it('should transpile an object.object.property subcall statement with params', () => {
		const vbs = `BallRelease.Kicker.KickBall (0), (-2)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.Kicker.KickBall(0, -2);');
	});

	it('should transpile an subcall statement with function call params', () => {
		const vbs = `PlaySound SoundFX("fx_flipperup",DOFFlippers), 0, .67, AudioPan(RightFlipper), 0.05,0,0,1,AudioFade(RightFlipper)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			"PlaySound(SoundFX('fx_flipperup', DOFFlippers), 0, 0.67, AudioPan(RightFlipper), 0.05, 0, 0, 1, AudioFade(RightFlipper));",
		);
	});
});
