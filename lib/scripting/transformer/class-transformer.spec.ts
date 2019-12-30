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
import { ScriptHelper } from '../../../test/script.helper';
import { ClassTransformer } from './class-transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting class transformer', () => {

	it('should return the proxy in the constructor', () => {
		const vbs = `Class Foo\nEnd Class\n`;
		const js = transform(vbs);
		expect(js).to.equal(`class Foo {\n    constructor() {\n        return new Proxy(this, { get: (t, p, r) => Reflect.get(t, p.toLowerCase(), r) });\n    }\n}`);
	});

	it('should convert member properties to lower case', () => {
		const vbs = `Class Foo\nPublic LagCompensation\nEnd Class\n`;
		const js = transform(vbs);
		expect(js).to.equal(`class Foo {\n    constructor() {\n        this.lagcompensation = undefined;\n        return new Proxy(this, { get: (t, p, r) => Reflect.get(t, p.toLowerCase(), r) });\n    }\n}`);
	});

	it.skip('should convert getters to lower case', () => {
		const vbs = `Class Foo\nPublic Property Get Bar : Bar = 1 : End Property\nEnd Class\n`;
		const js = transform(vbs);
		expect(js).to.equal(``);
		//expect(js).to.equal(`class Foo {\n    constructor() {\n        return new Proxy(this, { get: (t, p, r) => Reflect.get(t, p.toLowerCase(), r) });\n    }\n    bar() {\n        let Bar = undefined;\n        Bar = 1;\n        return Bar;\n    }\n}`);
	});

	it('should convert methods to lower case', () => {
		const vbs = `Class Foo\nPublic Sub Bar()\nEnd Sub\nEnd Class\n`;
		const js = transform(vbs);
		expect(js).to.equal(`class Foo {\n    constructor() {\n        return new Proxy(this, { get: (t, p, r) => Reflect.get(t, p.toLowerCase(), r) });\n    }\n    bar() {\n    }\n}`);
	});

});

function transform(vbs: string): string {
	const scriptHelper = new ScriptHelper();
	let ast = scriptHelper.vbsToAst(vbs);
	ast = new ClassTransformer(ast).transform();
	return scriptHelper.astToVbs(ast);
}
