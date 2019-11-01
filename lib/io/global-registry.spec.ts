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
import { GlobalRegistry } from './global-registry';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The global registry emulator', () => {

	it('should correctly deal with abbreviations', () => {
		const reg = new GlobalRegistry();
		reg.regWrite('HKEY_CLASSES_ROOT\\test1', 'test1');
		reg.regWrite('HKEY_CURRENT_USER\\test2', 'test2');
		reg.regWrite('HKEY_LOCAL_MACHINE\\test3', 'test3');
		reg.regWrite('HKEY_USERS\\test4', 'test4');
		reg.regWrite('HKEY_CURRENT_CONFIG\\test5', 'test5');

		expect(reg.regRead('HKCR\\test1')).to.equal( 'test1');
		expect(reg.regRead('HKCU\\test2')).to.equal( 'test2');
		expect(reg.regRead('HKLM\\test3')).to.equal( 'test3');
		expect(reg.regRead('HKU\\test4')).to.equal( 'test4');
		expect(reg.regRead('HKCC\\test5')).to.equal( 'test5');
	});

	it('should correctly deal with upper / lower case', () => {
		const reg = new GlobalRegistry();
		reg.regWrite('HKEY_CLASSES_ROOT\\TEST\\dUh', 'test1');
		expect(reg.regRead('HKEY_CLASSES_ROOT\\test\\duh')).to.equal( 'test1');
	});

	it('should return all default values', () => {
		const reg = new GlobalRegistry();
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\ForceDisableB2S')).to.equal( 0);
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\DOFContactors')).to.equal( 2);
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\DOFKnocker')).to.equal( 2);
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\DOFChimes')).to.equal( 2);
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\DOFBell')).to.equal( 2);
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\DOFGear')).to.equal( 2);
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\DOFShaker')).to.equal( 2);
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\DOFFlippers')).to.equal( 2);
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\DOFTargets')).to.equal( 2);
		expect(reg.regRead('HKEY_CURRENT_USER\\SOFTWARE\\Visual Pinball\\Controller\\DOFDropTargets')).to.equal( 2);
		expect(reg.regRead('HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\CurrentVersion')).to.equal( 6.3);
		expect(reg.regRead('HKLM\\SYSTEM\\ControlSet001\\Control\\Session Manager\\Environment\\Processor_Architecture')).to.equal( 'AMD64');
	});

});
