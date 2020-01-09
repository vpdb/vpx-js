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
import { TableBuilder } from '../../../test/table-builder';
import { Player } from '../../game/player';
import { Table } from '../../vpt/table/table';
import { Transpiler } from '../transpiler';
import { Transformer } from './transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting ambiguity transformer', () => {

	let table: Table;
	let player: Player;
	let transpiler: Transpiler;

	before(async () => {
		table = new TableBuilder().addFlipper('Flipper').build();
		player = new Player(table);
		transpiler = new Transpiler(table, player);
	});

	describe('with an ambiguous function call', () => {

		it('should not use the helper for eval', () => {
			const vbs = `ExecuteGlobal "Dim x"\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`eval(${Transformer.VBSHELPER_NAME}.transpileInline('Dim x'));`);
		});

		it('should not use the helper for assignments', () => {
			const vbs = `rolling(0) = False\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.rolling[0] = false;`);
		});

		it('should not use the helper for known calls', () => {
			const vbs = `x = UBound(X)\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.x = ${Transformer.STDLIB_NAME}.UBound(${Transformer.VBSHELPER_NAME}.getOrCallBound(${Transformer.SCOPE_NAME}, 'X'));`);
		});

		it('should not use the helper for known calls of an object', () => {
			const vbs = `result = Math.pow(10, 2)`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.result = __stdlib.Math.pow(10, 2);`);
		});

		it('should not use the helper string parameters', () => {
			const vbs = `LoadController "EM"\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.LoadController('EM');`);
		});

		it('should use the helper to access scope variables', () => {
			const vbs = `x = DOFeffects(Effect)\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(
				`${Transformer.SCOPE_NAME}.x = ${Transformer.VBSHELPER_NAME}.getOrCallBound(${Transformer.SCOPE_NAME}, 'DOFeffects', ${Transformer.SCOPE_NAME}.Effect);`,
			);
		});

		it('should use the helper if already wrapped in a different helper function', () => {
			const vbs = `Sub LoadCore\nDim fso\nSet fso = CreateObject("Scripting.FileSystemObject")\nExecuteGlobal fso.OpenTextFile("core.vbs", 1).ReadAll\nEnd Sub\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.LoadCore = function () {\n    let fso;\n    fso = ${Transformer.STDLIB_NAME}.CreateObject('Scripting.FileSystemObject', ${Transformer.PLAYER_NAME});\n    eval(${Transformer.VBSHELPER_NAME}.transpileInline(${Transformer.VBSHELPER_NAME}.getOrCallBound(fso.OpenTextFile('core.vbs', 1), 'ReadAll')));\n};`);
		});

		it('should handle multi-dim arrays', () => {
			const vbs = `dim result(1, 1, 1)\nresult(0, 0, 0) = 42`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.result = ${Transformer.VBSHELPER_NAME}.dim([\n    1,\n    1,\n    1\n]);\n${Transformer.SCOPE_NAME}.result[0][0][0] = 42;`);
		});

		it('should pass the function and not the name to the helper', () => {
			const vbs = `result = My.Fct(10, 2)`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.result = ${Transformer.VBSHELPER_NAME}.getOrCallBound(${Transformer.SCOPE_NAME}.My, 'Fct', 10, 2);`);
		});
	});

	describe('with an ambiguous property', () => {

		it('should convert to a function for known global members', () => {
			const vbs = `BOT = GetBalls\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.BOT = ${Transformer.GLOBAL_NAME}.GetBalls();`);
		});

		it('should convert to a function for known item members', () => {
			const vbs = `BOT = Flipper.RotateToEnd\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.BOT = ${Transformer.ITEMS_NAME}.Flipper.RotateToEnd();`);
		});

		it('should not use the helper for known members', () => {
			const vbs = `BOT = Name\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.BOT = ${Transformer.GLOBAL_NAME}.Name;`);
		});

		it('should not use the helper for enums', () => {
			const vbs = `shape = TriggerShape.TriggerWireA\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.shape = ${Transformer.ENUMS_NAME}.TriggerShape.TriggerWireA;`);
		});

		it('should not use the helper left-hand side of a loop', () => {
			const vbs = `For each xx in GI:xx.State = 1: Next\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`for (${Transformer.SCOPE_NAME}.xx of ${Transformer.VBSHELPER_NAME}.getOrCallBound(${Transformer.SCOPE_NAME}, 'GI')) {\n    ${Transformer.VBSHELPER_NAME}.getOrCallBound(${Transformer.SCOPE_NAME}, 'xx').State = 1;\n}`);
		});

		it('should not use the helper for a property declared in a local scope', () => {
			const vbs = `sub test\ndim prop\nx = prop\nend sub\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.test = function () {\n    let prop;\n    ${Transformer.SCOPE_NAME}.x = prop;\n};`);
		});

		it('should not use the helper for class instantiations', () => {
			const vbs = `set x = new a`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.x = new ${Transformer.SCOPE_NAME}.a();`);
		});

		it('should not use the helper on a class member', () => {
			const vbs = `Class Foo\nPrivate arr\nPublic Sub Bar(aObj)  : arr.Add aObj, 0 : End Sub\nEnd Class\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.Foo = class {\n    constructor() {\n        this.arr = undefined;\n        return new Proxy(this, { get: (t, p, r) => Reflect.get(t, p.toLowerCase(), r) });\n    }\n    bar(aObj) {\n        ${Transformer.VBSHELPER_NAME}.getOrCallBound(this.arr, 'Add', aObj, 0);\n    }\n};`);
		});

		it('should not use the helper when using redim', () => {
			const vbs = `Dim vpmMultiLights() : ReDim vpmMultiLights(0)\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.vpmMultiLights = ${Transformer.VBSHELPER_NAME}.dim([]);\n${Transformer.SCOPE_NAME}.vpmMultiLights = ${Transformer.VBSHELPER_NAME}.redim(${Transformer.SCOPE_NAME}.vpmMultiLights, [0]);`);
		});

		it.skip('should not use the helper for a property in local scope', () => {
			const vbs = `Dim objShell\nSet objShell = CreateObject("WScript.Shell")\nSub LoadController(TableType)\nobjShell.RegRead("")\nEnd Sub`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.objShell = null;\n${Transformer.SCOPE_NAME}.objShell = ${Transformer.SCOPE_NAME}.CreateObject('WScript.Shell');\n${Transformer.SCOPE_NAME}.LoadController = function (TableType) {\n    ${Transformer.SCOPE_NAME}.objShell.RegRead('');\n};`);
		});
	});
});
