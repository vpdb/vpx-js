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
import { VbsNotImplementedError } from '../vbs-api';
import { WshShell } from './wsh-shell';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The VBScript native windows shell object', () => {

	it('should write and read a value to the registry', () => {
		const ws = new WshShell();
		ws.RegWrite('HKLM\\Whatsup', 'Nothin');
		expect(ws.RegRead('HKLM\\Whatsup')).to.equal( 'Nothin');
	});

	it('should read a default value from the registry', () => {
		const ws = new WshShell();
		expect(ws.RegRead('HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\CurrentVersion')).to.equal( 6.3);
		expect(ws.RegRead('HKLM\\SYSTEM\\ControlSet001\\Control\\Session Manager\\Environment\\Processor_Architecture')).to.equal( 'AMD64');
	});

	it('should throw an exception when using non-implemented APIs', () => {
		const ws = new WshShell();
		expect(() => ws.AppActivate('a')).to.throw(VbsNotImplementedError);
		expect(() => ws.CreateShortcut('a')).to.throw(VbsNotImplementedError);
		expect(() => ws.Exec('a')).to.throw(VbsNotImplementedError);
		expect(() => ws.ExpandEnvironmentStrings('a')).to.throw(VbsNotImplementedError);
		expect(() => ws.LogEvent(1, 'a')).to.throw(VbsNotImplementedError);
		expect(() => ws.Popup('a')).to.throw(VbsNotImplementedError);
		expect(() => ws.RegDelete('a')).to.throw(VbsNotImplementedError);
		expect(() => ws.Run('a')).to.throw(VbsNotImplementedError);
		expect(() => ws.SendKeys('a')).to.throw(VbsNotImplementedError);
	});

});
