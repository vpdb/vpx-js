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
import { File } from './file';
import { FileSystemObject } from './file-system-object';
import { TextStream } from './text-stream';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The VBScript native text stream object', () => {

	it('should write and read a line', () => {
		const fs = new FileSystemObject();
		fs.CreateTextFile('test1.txt');
		const f = fs.GetFile('test1.txt') as File;

		let ts = f.OpenAsTextStream(TextStream.MODE_WRITE, -2);
		ts.Write('Hello World');
		ts.Close();

		ts = f.OpenAsTextStream(TextStream.MODE_READ, -2);
		ts.Skip(3);
		expect(ts.ReadLine()).to.equal('lo World');
	});

	it('should have the cursor at the end of the stream when writing', () => {
		const fs = new FileSystemObject();
		fs.CreateTextFile('test1.txt');
		const f = fs.GetFile('test1.txt') as File;

		let ts = f.OpenAsTextStream(TextStream.MODE_WRITE, -2);
		ts.Write('Hello World');

		expect(ts.AtEndOfStream).to.equal(true);
	});
	
	it('should read a given number of characters', () => {
		const fs = new FileSystemObject();
		fs.CreateTextFile('test1.txt');
		const f = fs.GetFile('test1.txt') as File;

		let ts = f.OpenAsTextStream(TextStream.MODE_WRITE, -2);
		ts.Write('Hello World');

		ts = f.OpenAsTextStream(TextStream.MODE_READ, -2);
		expect(ts.Read(5)).to.equal('Hello');
	});
	
	it('should read a line', () => {
		const fs = new FileSystemObject();
		fs.CreateTextFile('test1.txt');
		const f = fs.GetFile('test1.txt') as File;

		let ts = f.OpenAsTextStream(TextStream.MODE_WRITE, -2);
		ts.WriteLine('Line1');
		ts.WriteLine('Line2');

		ts = f.OpenAsTextStream(TextStream.MODE_READ, -2);
		expect(ts.ReadLine()).to.equal('Line1');
		expect(ts.ReadLine()).to.equal('Line2');
	});

	it('should skip a line while reading', () => {
		const fs = new FileSystemObject();
		fs.CreateTextFile('test1.txt');
		const f = fs.GetFile('test1.txt') as File;

		let ts = f.OpenAsTextStream(TextStream.MODE_WRITE, -2);
		ts.WriteLine('Line1');
		ts.WriteLine('Line2');

		ts = f.OpenAsTextStream(TextStream.MODE_READ, -2);
		ts.SkipLine();
		expect(ts.ReadLine()).to.equal('Line2');
	});
	
	it('should read the entire file', () => {
		const fs = new FileSystemObject();
		fs.CreateTextFile('test1.txt');
		const f = fs.GetFile('test1.txt') as File;

		let ts = f.OpenAsTextStream(TextStream.MODE_WRITE, -2);
		ts.WriteLine('Line1');
		ts.WriteLine('Line2');

		ts = f.OpenAsTextStream(TextStream.MODE_READ, -2);
		ts.SkipLine();
		expect(ts.ReadAll()).to.equal('Line1\r\nLine2\r\n');
	});

	it('should fail reading when mode is write', () => {
		const fs = new FileSystemObject();
		fs.CreateTextFile('test1.txt');
		const f = fs.GetFile('test1.txt') as File;

		let ts = f.OpenAsTextStream(TextStream.MODE_WRITE, -2);
		expect(() => ts.Read(1)).to.throw('Bad file mode');
		expect(() => ts.ReadAll()).to.throw('Bad file mode');
		expect(() => ts.ReadLine()).to.throw('Bad file mode');
		expect(() => ts.Skip(1)).to.throw('Bad file mode');
		expect(() => ts.SkipLine()).to.throw('Bad file mode');
	});

	it('should throw an exception when using non-implemented APIs', () => {
		const ts = new TextStream('test.txt', true, 0);
		expect(() => ts.AtEndOfLine).to.throw(VbsNotImplementedError);
		expect(() => ts.WriteBlankLines(1)).to.throw(VbsNotImplementedError);
		expect(() => ts.Column).to.throw(VbsNotImplementedError);
		expect(() => ts.Line).to.throw(VbsNotImplementedError);
		expect(() => ts.Close()).not.to.throw(VbsNotImplementedError);
	});

});
