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
import { ScopeTransformer } from './scope-transformer';
import { Transformer } from './transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting scope transformer', () => {

	it('should add the scope to a top-level variable declaration', () => {
		const vbs = `Dim x\n`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.x = null;`);
	});

	it('should add the scope to a top-level variable assignment', () => {
		const vbs = `x = 10\n`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.x = 10;`);
	});

	it('should add the scope to a member assignment', () => {
		const vbs = `obj.prop = 10\n`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.obj.prop = 10;`);
	});

	it('should add the scope to a member function call', () => {
		const vbs = `obj.prop.func\n`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.obj.prop.func();`);
	});

	it('should add the scope to a function call', () => {
		const vbs = `func\n`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.func();`);
	});

	it('should add the scope to a function call', () => {
		const vbs = `BallShadow(b).visible = 0\n`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.BallShadow(${Transformer.SCOPE_NAME}.b).visible = 0;`);
	});

	it('should add the scope to a member prop in a loop call', () => {
		const vbs = `For each xx in GI:xx.State = 1: Next\n`;
		const js = transform(vbs);
		expect(js).to.equal(`for (${Transformer.SCOPE_NAME}.xx of ${Transformer.SCOPE_NAME}.GI) {\n    ${Transformer.SCOPE_NAME}.xx.State = 1;\n}`);
	});

	it('should change a function declaration to an expression', () => {
		const vbs = `Sub Foo\nEnd Sub`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.Foo = function () {\n};`);
	});

	it('should change a class declaration to an expression', () => {
		const vbs = `Class Foo\nEnd Class`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.Foo = class {\n    constructor() {\n    }\n};`);
	});

	it('should not the scope to a member call in a function', () => {
		const vbs = `Function AudioPan(tableobj)\nDim tmp\ntmp = tableobj.x * 2 / table1.width-1\nEnd Function`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.AudioPan = function (tableobj) {\n    let AudioPan = undefined;\n    let tmp;\n    tmp = tableobj.x * 2 / ${Transformer.SCOPE_NAME}.table1.width - 1;\n    return AudioPan;\n};`);
	});

	it('should not add the scope to a function-level variable assignment', () => {
		const vbs = `Sub X\n	Dim x\nEnd Sub`;
		const js = transform(vbs);
		expect(js).to.equal(`${Transformer.SCOPE_NAME}.X = function () {\n    let x;\n};`);
	});

});

function transform(vbs: string): string {
	const scriptHelper = new ScriptHelper();
	const ast = scriptHelper.vbsToAst(vbs);
	const eventAst = new ScopeTransformer(ast).transform();
	return scriptHelper.astToVbs(eventAst);
}
