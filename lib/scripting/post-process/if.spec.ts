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

describe('The VBScript transpiler - If', () => {
	it('should transpile an "If/Then...End If" statement', () => {
		const vbs = `If EnableBallControl = 1 Then\nEnableBallControl = 0\nEnd If\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('if (EnableBallControl == 1) {\n    EnableBallControl = 0;\n}');
	});

	it('should transpile an inline "If/Then...End If" statement', () => {
		const vbs = `If EnableBallControl = 1 Then EnableBallControl = 0 End If\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('if (EnableBallControl == 1)\n    EnableBallControl = 0;');
	});

	it('should transpile an inline "If/Then" statement', () => {
		const vbs = `If EnableBallControl = 1 Then EnableBallControl = 0\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('if (EnableBallControl == 1)\n    EnableBallControl = 0;');
	});

	it('should transpile an inline "If/Then...Else...End If" statement', () => {
		const vbs = `If EnableBallControl = 1 Then EnableBallControl = 0 Else EnableBallControl = 2 End If\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			'if (EnableBallControl == 1)\n    EnableBallControl = 0;\nelse\n    EnableBallControl = 2;',
		);
	});

	it('should transpile an inline "If/Then...Else" statement', () => {
		const vbs = `If EnableBallControl = 1 Then EnableBallControl = 0 Else EnableBallControl = 2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			'if (EnableBallControl == 1)\n    EnableBallControl = 0;\nelse\n    EnableBallControl = 2;',
		);
	});

	it('should transpile an "If/Then...Else...End If" statement', () => {
		const vbs = `If EnableBallControl = 1 Then\nEnableBallControl = 0\nEnableBallControl = 3\nElse\nEnableBallControl = 1\nEnableBallControl = 2\nEnd If\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			'if (EnableBallControl == 1) {\n    EnableBallControl = 0;\n    EnableBallControl = 3;\n} else {\n    EnableBallControl = 1;\n    EnableBallControl = 2;\n}',
		);
	});

	it('should transpile an "If/Then...ElseIf/Then...End If" statement', () => {
		const vbs = `If DayOfWeek = "MON" Then\nDay = 1\nElseIf DayOfWeek = "TUE" Then\nDay = 2\nElseIf DayOfWeek = "WED" Then\nDay=3\nEnd If\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			"if (DayOfWeek == 'MON') {\n    Day = 1;\n} else if (DayOfWeek == 'TUE') {\n    Day = 2;\n} else if (DayOfWeek == 'WED') {\n    Day = 3;\n}",
		);
	});

	it('should transpile an "If/Then...ElseIf/Then...ElseIf/Then...Else...End If" statement', () => {
		const vbs = `If DayOfWeek = "MON" Then\nDay = 1\nElseIf DayOfWeek = "TUE" Then\nDay = 2\nElseIf DayOfWeek = "WED" Then\nDay=3\nElse\nDay = 0\nEnd If\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			"if (DayOfWeek == 'MON') {\n    Day = 1;\n} else if (DayOfWeek == 'TUE') {\n    Day = 2;\n} else if (DayOfWeek == 'WED') {\n    Day = 3;\n} else {\n    Day = 0;\n}",
		);
	});

	it('should transpile a mixed block/inline "If/Then...ElseIf/Then...Else..End If" statement', () => {
		const vbs = `If x = 1 Then\nx = 2\nElseIf x = 3 Then x = 4\nElse x = 5\nEnd If\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('if (x == 1) {\n    x = 2;\n} else if (x == 3)\n    x = 4;\nelse\n    x = 5;');
	});

	it('should transpile multiple inline "If/Then" statement', () => {
		const vbs = `If VPMver > "" Then If Controller.Version < VPMver Or Err Then MsgBox "VPinMAME ver " & VPMver & " required."\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			"if (VPMver > '')\n    if (Controller.Version < VPMver || Err)\n        MsgBox('VPinMAME ver ' + VPMver + ' required.');",
		);
	});
});
