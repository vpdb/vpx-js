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
import { CacheType, EmulatorCachingService } from './caching-service';
import { IEmulator } from '../../../game/iemulator';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('EmulatorCache', () => {

	let emulatorCache: EmulatorCachingService;
	let mockEmulator: IEmulator;
	let cache: object[];

	beforeEach(() => {
		emulatorCache = new EmulatorCachingService();
		cache = [];
		mockEmulator = new MockEmulator(cache);
	});

	it('add switch toggle to cache and apply it', () => {
		const addedToCache = emulatorCache.cacheState(CacheType.ToggleSwitchInput, 42);
		emulatorCache.applyCache(mockEmulator);
		expect(addedToCache).to.equal(true);
		expect(cache).to.deep.equal([{
			optionalEnableSwitch: undefined,
			switchNr: 42
		}]);
	});

	it('add switch set to cache and apply it', () => {
		emulatorCache.cacheState(CacheType.SetSwitchInput, 42);
		emulatorCache.applyCache(mockEmulator);
		expect(cache).to.deep.equal([{
			optionalEnableSwitch: true,
			switchNr: 42
		}]);
	});

	it('add switch clear to cache and apply it', () => {
		emulatorCache.cacheState(CacheType.ClearSwitchInput, 42);
		emulatorCache.applyCache(mockEmulator);
		expect(cache).to.deep.equal([{
			optionalEnableSwitch: false,
			switchNr: 42
		}]);
	});

	it('add cabinet input to cache and apply it', () => {
		emulatorCache.cacheState(CacheType.CabinetInput, 4);
		emulatorCache.applyCache(mockEmulator);
		expect(cache).to.deep.equal([{
			keyNr: 4
		}]);
	});

	it('add execute ticks to cache and apply it', () => {
		emulatorCache.cacheState(CacheType.ExecuteTicks, 4);
		emulatorCache.applyCache(mockEmulator);
		expect(cache).to.deep.equal([{
			dTime: 4
		}]);
	});

	it('should warn when add entries to cache if already consumed', () => {
		emulatorCache.applyCache(mockEmulator);
		const addedToCache = emulatorCache.cacheState(CacheType.SetSwitchInput, 42);
		expect(addedToCache).to.equal(false);
	});
});

class MockEmulator implements IEmulator {
	private cache: object[];
	constructor(cache: object[]) {
		this.cache = cache;
	}
	emuSimulateCycle(dTime: number): void {
		this.cache.push({dTime});
	}
	getDmdFrame(): Uint8Array {
		throw new Error("Method not implemented.");
	}
	getDmdDimensions(): import("../../../math/vertex2d").Vertex2D {
		throw new Error("Method not implemented.");
	}
	setCabinetInput(keyNr: number): void {
		this.cache.push({keyNr});
	}
	setSwitchInput(switchNr: number, optionalEnableSwitch?: boolean): void {
		this.cache.push({switchNr, optionalEnableSwitch});
	}
}
