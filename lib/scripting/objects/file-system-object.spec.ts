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
import { FS } from './file-system';
import { FileSystemObject } from './file-system-object';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The VBScript file system object', () => {

	beforeEach(() => {
		FS.clearAll();
	});

	it('should build a path', () => {
		const fso = new FileSystemObject();
		const path1 = fso.BuildPath('C:\\folder', 'file.txt');
		const path2 = fso.BuildPath('C:\\folder\\', 'file.txt');
		expect(path1).to.equal('C:\\folder\\file.txt');
		expect(path2).to.equal('C:\\folder\\file.txt');
	});

	it('should create a new text file', () => {
		const fso = new FileSystemObject();
		const textFile = fso.CreateTextFile('test.txt');
		expect(textFile).to.be.ok;
		expect(FS.fileExists('TEST.txt')).to.equal(true);
	});

	it('should fail creating a new text file if already exists', () => {
		const fso = new FileSystemObject();
		fso.CreateTextFile('test.txt');
		expect(() => fso.CreateTextFile('test.txt', false)).to.throw('Error 58: File already exists');
	});

	it('should delete a file', () => {
		const fso = new FileSystemObject();
		fso.CreateTextFile('test.txt');
		fso.DeleteFile('test.txt');
		expect(FS.fileExists('TEST.txt')).to.equal(false);
	});

	it('should fail deleting a non-existent file', () => {
		const fso = new FileSystemObject();
		expect(() => fso.DeleteFile('test.txt')).to.throw('Error 53: File not found');
	});

	it('should check if a file exists', () => {
		const fso = new FileSystemObject();
		fso.CreateTextFile('test.txt');
		expect(fso.FileExists('TEST.txt')).to.equal(true);
		expect(fso.FileExists('TEST2.txt')).to.equal(false);
	});

	it('should check if a folder exists', () => {
		const fso = new FileSystemObject();
		fso.CreateTextFile('c:\\test\\test.txt');
		expect(fso.FolderExists('c:\\test')).to.equal(true);
		expect(fso.FolderExists('c:\\test2')).to.equal(false);
	});

	it('should return something as absolute path', () => {
		const fso = new FileSystemObject();
		expect(fso.GetAbsolutePathName('.')).to.equal('.');
	});

	it('should return the base name of a path', () => {
		const fso = new FileSystemObject();
		expect(fso.GetBaseName('c:\\a\\folder\\file.a.ext')).to.equal('file.a');
		expect(fso.GetBaseName('c:\\a\\folder\\file.ext')).to.equal('file');
		expect(fso.GetBaseName('c:\\a\\folder\\file')).to.equal('file');
		expect(fso.GetBaseName('c:\\a\\folder\\')).to.equal('folder');
	});

	it('should return the extension name of a path', () => {
		const fso = new FileSystemObject();
		expect(fso.GetExtensionName('c:\\a\\folder\\file.a.ext')).to.equal('ext');
		expect(fso.GetExtensionName('c:\\a\\folder\\file.ext')).to.equal('ext');
		expect(fso.GetExtensionName('c:\\a\\folder\\file')).to.equal('');
		expect(fso.GetExtensionName('c:\\a\\folder\\')).to.equal('');
	});

	it('should return an existing file', () => {
		const fso = new FileSystemObject();
		fso.CreateTextFile('c:\\test\\test.txt');
		expect(fso.GetFile('c:\\test\\test.txt')).to.be.ok;
	});

	it('should fail returning a non-existent file', () => {
		const fso = new FileSystemObject();
		expect(() => fso.GetFile('c:\\test\\test.txt')).to.throw('Error 53: File not found');
	});

	it('should return the file name of a path', () => {
		const fso = new FileSystemObject();
		expect(fso.GetFileName('c:\\a\\folder\\file.a.ext')).to.equal('file.a.ext');
		expect(fso.GetFileName('c:\\a\\folder\\file.ext')).to.equal('file.ext');
		expect(fso.GetFileName('c:\\a\\folder\\file')).to.equal('file');
		expect(fso.GetFileName('c:\\a\\folder\\')).to.equal('folder');
	});

	it.skip('should open a bundled text file', () => {
		const fso = new FileSystemObject();
		expect(fso.OpenTextFile('controller.vbs')).to.be.ok;
	});

	it.skip('should open an existing file', () => {
		const fso = new FileSystemObject();
		fso.CreateTextFile('test.txt');
		expect(fso.OpenTextFile('test.txt')).to.be.ok;
	});

	it.skip('should open an non-existent file', () => {
		const fso = new FileSystemObject();
		expect(fso.OpenTextFile('test.txt', 1, true)).to.be.ok;
	});

	it('should throw an exception when using non-implemented APIs', () => {
		const fso = new FileSystemObject();
		expect(() => fso.Drives).to.throw(VbsNotImplementedError);
		expect(() => fso.CopyFile('a', 'b')).to.throw(VbsNotImplementedError);
		expect(() => fso.CopyFolder('a', 'b')).to.throw(VbsNotImplementedError);
		expect(() => fso.CreateFolder('a')).to.throw(VbsNotImplementedError);
		expect(() => fso.DeleteFolder('a')).to.throw(VbsNotImplementedError);
		expect(() => fso.DriveExists('a')).to.throw(VbsNotImplementedError);
		expect(() => fso.GetDrive('a')).to.throw(VbsNotImplementedError);
		expect(() => fso.GetDriveName('a')).to.throw(VbsNotImplementedError);
		expect(() => fso.GetFolder('a')).to.throw(VbsNotImplementedError);
		expect(() => fso.GetParentFolderName('a')).to.throw(VbsNotImplementedError);
		expect(() => fso.GetSpecialFolder(0)).to.throw(VbsNotImplementedError);
		expect(() => fso.GetTempName()).to.throw(VbsNotImplementedError);
		expect(() => fso.MoveFile('a', 'b')).to.throw(VbsNotImplementedError);
		expect(() => fso.MoveFolder('a', 'b')).to.throw(VbsNotImplementedError);
	});

});
