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

describe('The VBScript transpiler - Select', () => {
	it('should transpile an empty "Select Case...End Select" statement', () => {
		const vbs = `Select Case day\nEnd Select\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('switch (day) {\n}');
	});

	it('should transpile a "Select Case...End Select" statement', () => {
		const vbs = `Select Case text\nCase "Sunday"\nday=0\nCase "Monday"\nday=1\nCase "Tuesday"\nday=2\nCase "Wednesday"\nday=3\nEnd Select\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			"switch (text) {\ncase 'Sunday':\n    day = 0;\n    break;\ncase 'Monday':\n    day = 1;\n    break;\ncase 'Tuesday':\n    day = 2;\n    break;\ncase 'Wednesday':\n    day = 3;\n    break;\n}",
		);
	});

	it('should transpile a "Select Case/Case...End Select" statement', () => {
		const vbs = `Select Case text\nCase "Saturday", "Sunday"\nweekend=1\nCase "Monday"\nweekend=0\nEnd Select\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			"switch (text) {\ncase 'Saturday':\ncase 'Sunday':\n    weekend = 1;\n    break;\ncase 'Monday':\n    weekend = 0;\n    break;\n}",
		);
	});

	it('should transpile a "Select Case/Case...Else...End Select" statement', () => {
		const vbs = `Select Case text\nCase "Saturday", "Sunday"\nweekend=1\nCase Else\nweekend=0\nEnd Select\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			"switch (text) {\ncase 'Saturday':\ncase 'Sunday':\n    weekend = 1;\n    break;\ndefault:\n    weekend = 0;\n}",
		);
	});

	it('should transpile a "Select Case/Case...Else...End Select" statement with inline cases', () => {
		const vbs = `Select Case text\nCase "Saturday", "Sunday" weekend=1\nCase Else weekend=0\nEnd Select\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			"switch (text) {\ncase 'Saturday':\ncase 'Sunday':\n    weekend = 1;\n    break;\ndefault:\n    weekend = 0;\n}",
		);
	});
});
