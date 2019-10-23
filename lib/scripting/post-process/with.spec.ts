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
import { vbsToJs } from '../../../test/script.helper';

describe('The VBScript transpiler - With', () => {
	it('should transpile a "With...End With" statement with an assignment expression', () => {
		const vbs = `With x\n.value = 5\n.type = \"TEST\"\nEnd With\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal("{\n    x.value = 5;\n    x.type = 'TEST';\n}");
	});

	it('should transpile a "With...End With" statement with a call expression', () => {
		const vbs = `With Controller\nSelect Case keycode\nCase keyReset .Stop\nEnd Select\nEnd With\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			'{\n    switch (keycode) {\n    case keyReset:\n        Controller.Stop();\n        break;\n    }\n}',
		);
	});

	it('should transpile a "With...End With" statement with a unary expression', () => {
		const vbs = `With Controller\nSelect Case keycode\nCase keyFrame .LockDisplay = Not .LockDisplay\nEnd Select\nEnd With\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			'{\n    switch (keycode) {\n    case keyFrame:\n        Controller.LockDisplay = !Controller.LockDisplay;\n        break;\n    }\n}',
		);
	});
});
