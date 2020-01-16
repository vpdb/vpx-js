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
import { ErrorTransformer } from './error-transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting error transformer', () => {

	it('should update Err when used in an "If" statement', () => {
		const vbs = `If Err Then MsgBox "Can't start Game" & cGameName & vbNewLine & Err.Description:Exit Sub`;
		const js = transform(vbs);
		expect(js).to.equal(`if (Err.Number) {\n    MsgBox('Can\\'t start Game' + cGameName + vbNewLine + Err.Description);\n    return;\n}`);
	});

	it('should update Err when used in a logical expression', () => {
		const vbs = `If aSw = 0 Or Err Then x = 5 End If`;
		const js = transform(vbs);
		expect(js).to.equal(`if (__vbs.equals(aSw, 0) || Err.Number) {\n    x = 5;\n}`);
	});

});

function transform(vbs: string): string {
	const scriptHelper = new ScriptHelper();
	let ast = scriptHelper.vbsToAst(vbs);
	ast = new ErrorTransformer(ast).transform();
	return scriptHelper.astToVbs(ast);
}
