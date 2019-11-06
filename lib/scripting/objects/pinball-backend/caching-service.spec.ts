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
import { CacheEntry, CacheType, EmulatorCachingService } from './caching-service';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('EmulatorCache', () => {

	let emulatorCache: EmulatorCachingService;

	beforeEach(() => {
		emulatorCache = new EmulatorCachingService();
	});

	it('add switch input to cache and retrieve it', () => {
		const addedToCache = emulatorCache.cacheState(CacheType.SetSwitchInput, 42);
		const result: CacheEntry[] = emulatorCache.getCache();

		expect(addedToCache).to.equal(true);
		expect(result).to.deep.equal([{
				cacheType: CacheType.SetSwitchInput,
				value: 42
			}
		]);
	});


	it('should refuse to add entries to cache if already consumed', () => {
		emulatorCache.getCache();
		const addedToCache = emulatorCache.cacheState(CacheType.SetSwitchInput, 42);
		expect(addedToCache).to.equal(false);
	});
});
