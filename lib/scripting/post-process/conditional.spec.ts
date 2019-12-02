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
import { Grammar } from '../grammar/grammar';

let grammar: Grammar;

before(async () => {
	grammar = new Grammar();
});

describe('The VBScript transpiler - Conditional', () => {
	it('should transpile an "If/Then...End If" statement', () => {
		const vbs = `If EnableBallControl = 1 Then\nEnableBallControl = 0\nEnd If`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('if (EnableBallControl == 1) {\n    EnableBallControl = 0;\n}');
	});

	it('should transpile an inline "If/Then...End If" statement', () => {
		const vbs = `If EnableBallControl = 1 Then EnableBallControl = 0 End If`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('if (EnableBallControl == 1) {\n    EnableBallControl = 0;\n}');
	});

	it('should transpile an inline "If/Then" statement', () => {
		const vbs = `If EnableBallControl = 1 Then EnableBallControl = 0`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('if (EnableBallControl == 1) {\n    EnableBallControl = 0;\n}');
	});

	it('should transpile an inline "If/Then...Else...End If" statement', () => {
		const vbs = `If EnableBallControl = 1 Then EnableBallControl = 0 Else EnableBallControl = 2 End If`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'if (EnableBallControl == 1) {\n    EnableBallControl = 0;\n} else {\n    EnableBallControl = 2;\n}',
		);
	});

	it('should transpile an inline "If/Then...Else" statement', () => {
		const vbs = `If EnableBallControl = 1 Then EnableBallControl = 0 Else EnableBallControl = 2`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'if (EnableBallControl == 1) {\n    EnableBallControl = 0;\n} else {\n    EnableBallControl = 2;\n}',
		);
	});

	it('should transpile an "If/Then...Else...End If" statement', () => {
		const vbs = `If EnableBallControl = 1 Then\nEnableBallControl = 0\nEnableBallControl = 3\nElse\nEnableBallControl = 1\nEnableBallControl = 2\nEnd If`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'if (EnableBallControl == 1) {\n    EnableBallControl = 0;\n    EnableBallControl = 3;\n} else {\n    EnableBallControl = 1;\n    EnableBallControl = 2;\n}',
		);
	});

	it('should transpile an "If/Then...ElseIf/Then...End If" statement', () => {
		const vbs = `If DayOfWeek = "MON" Then\nDay = 1\nElseIf DayOfWeek = "TUE" Then\nDay = 2\nElseIf DayOfWeek = "WED" Then\nDay=3\nEnd If`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"if (DayOfWeek == 'MON') {\n    Day = 1;\n} else if (DayOfWeek == 'TUE') {\n    Day = 2;\n} else if (DayOfWeek == 'WED') {\n    Day = 3;\n}",
		);
	});

	it('should transpile an "If/Then...ElseIf/Then...ElseIf/Then...Else...End If" statement', () => {
		const vbs = `If DayOfWeek = "MON" Then\nDay = 1\nElseIf DayOfWeek = "TUE" Then\nDay = 2\nElseIf DayOfWeek = "WED" Then\nDay=3\nElse\nDay = 0\nEnd If`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"if (DayOfWeek == 'MON') {\n    Day = 1;\n} else if (DayOfWeek == 'TUE') {\n    Day = 2;\n} else if (DayOfWeek == 'WED') {\n    Day = 3;\n} else {\n    Day = 0;\n}",
		);
	});

	/*it('should transpile a mixed block/inline "If/Then...ElseIf/Then...Else..End If" statement', () => {
		const vbs = `If x = 1 Then\nx = 2\nElseIf x = 3 Then x = 4\nElse x = 5\nEnd If`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('if (x == 1) {\n    x = 2;\n} else if (x == 3)\n    x = 4;\nelse\n    x = 5;');
	});*/

	/*it('should transpile multiple inline "If/Then" statement', () => {
		const vbs = `If VPMver > "" Then If Controller.Version < VPMver Or Err Then MsgBox "VPinMAME ver " & VPMver & " required."`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"if (VPMver > '')\n    if (Controller.Version < VPMver || Err)\n        MsgBox('VPinMAME ver ' + VPMver + ' required.');",
		);
	});*/

	it('should transpile an empty "Select Case...End Select" statement', () => {
		const vbs = `Select Case day\nEnd Select`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('switch (day) {\n}');
	});

	it('should transpile a "Select Case...End Select" statement', () => {
		const vbs = `Select Case text\nCase "Sunday"\nday=0\nCase "Monday"\nday=1\nCase "Tuesday"\nday=2\nCase "Wednesday"\nday=3\nEnd Select`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"switch (text) {\ncase 'Sunday':\n    day = 0;\n    break;\ncase 'Monday':\n    day = 1;\n    break;\ncase 'Tuesday':\n    day = 2;\n    break;\ncase 'Wednesday':\n    day = 3;\n    break;\n}",
		);
	});

	it('should transpile a "Select Case/Case...End Select" statement', () => {
		const vbs = `Select Case text\nCase "Saturday", "Sunday"\nweekend=1\nCase "Monday"\nweekend=0\nEnd Select`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"switch (text) {\ncase 'Saturday':\ncase 'Sunday':\n    weekend = 1;\n    break;\ncase 'Monday':\n    weekend = 0;\n    break;\n}",
		);
	});

	it('should transpile a "Select Case/Case...Else...End Select" statement', () => {
		const vbs = `Select Case text\nCase "Saturday", "Sunday"\nweekend=1\nCase Else\nweekend=0\nEnd Select`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"switch (text) {\ncase 'Saturday':\ncase 'Sunday':\n    weekend = 1;\n    break;\ndefault:\n    weekend = 0;\n}",
		);
	});

	it('should transpile a "Select Case/Case...Else...End Select" statement with inline cases', () => {
		const vbs = `Select Case text\nCase "Saturday", "Sunday" weekend=1\nCase Else weekend=0\nEnd Select`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"switch (text) {\ncase 'Saturday':\ncase 'Sunday':\n    weekend = 1;\n    break;\ndefault:\n    weekend = 0;\n}",
		);
	});
});
