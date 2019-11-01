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

import { ERR } from '../stdlib/err';
import { VbsNotImplementedError } from '../vbs-api';
import { Drive } from './drive';
import { File } from './file';
import { FS } from './file-system';
import { TextStream } from './text-stream';

/**
 * Provides access to a computer's file system.
 *
 * Probably gonna use something like https://github.com/jvilk/BrowserFS
 *
 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/filesystemobject-object
 */
export class FileSystemObject {

	private readonly SEP = `\\`;

	/**
	 * Returns a Drives collection consisting of all Drive objects available on the local machine.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/drives-property
	 */
	public get Drives(): Drive[] { throw new VbsNotImplementedError(); }

	/**
	 * Appends a name to an existing path.
	 * @param path Existing path to which name is appended. Path can be absolute or relative and need not specify an existing folder.
	 * @param name Name being appended to the existing path.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/buildpath-method
	 */
	public BuildPath(path: string, name: string): string {
		return `${path}${(path.endsWith(this.SEP) ? '' : this.SEP)}${name}`;
	}

	/**
	 * Copies one or more files from one location to another.
	 * @param source Character string file specification, which can include wildcard characters, for one or more files to be copied.
	 * @param destination Character string destination where the file or files from source are to be copied. Wildcard characters are not allowed.
	 * @param overwrite Boolean value that indicates if existing files are to be overwritten. If True, files are overwritten; if False, they are not. The default is True. Note that CopyFile will fail if destination has the read-only attribute set, regardless of the value of overwrite.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/copyfile-method
	 */
	public CopyFile(source: string, destination: string, overwrite = true): void {
		// only used in NVOffset(), which doesn't seem to be used very often.
		throw new VbsNotImplementedError();
	}

	/**
	 * Recursively copies a folder from one location to another.
	 * @param source Character string folder specification, which can include wildcard characters, for one or more folders to be copied.
	 * @param destination Character string destination where the folder and subfolders from source are to be copied. Wildcard characters are not allowed.
	 * @param overwrite Boolean value that indicates if existing folders are to be overwritten. If True, files are overwritten; if False, they are not. The default is True.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/copyfolder-method
	 */
	public CopyFolder(source: string, destination: string, overwrite = true): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Creates a folder.
	 * @param foldername String expression that identifies the folder to create.
	 * @https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/createfolder-method
	 */
	public CreateFolder(foldername: string): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Creates a specified file name and returns a {@link TextStream} object that can be used to read from or write to the file.
	 *
	 * @param filename String expression that identifies the file to create.
	 * @param overwrite Boolean value that indicates if an existing file can be overwritten. The value is True if the file can be overwritten; False if it can't be overwritten. If omitted, existing files can be overwritten.
	 * @param unicode Boolean value that indicates whether the file is created as a Unicode or ASCII file. The value is True if the file is created as a Unicode file; False if it's created as an ASCII file. If omitted, an ASCII file is assumed.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/createtextfile-method
	 */
	public CreateTextFile(filename: string, overwrite = true, unicode = false): TextStream | void {
		if (FS.fileExists(filename) && !overwrite) {
			return ERR.Raise(58, undefined, 'File already exists');
		}
		const textStream = new TextStream(filename, unicode, TextStream.MODE_APPEND);
		FS.addStream(filename, textStream);
		return textStream;
	}

	/**
	 * Deletes a specified file.
	 * @param filespec The name of the file to delete. The filespec can contain wildcard characters in the last path component.
	 * @param force Boolean value that is True if files with the read-only attribute set are to be deleted; False (default) if they are not.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/deletefile-method
	 */
	public DeleteFile(filespec: string, force = false): void {
		if (!FS.fileExists(filespec)) {
			return ERR.Raise(53, undefined, 'File not found');
		}
		FS.deleteFile(filespec);
	}

	/**
	 * Deletes a specified folder and its contents.
	 * @param folderspec The name of the folder to delete. The folderspec can contain wildcard characters in the last path component.
	 * @param force Boolean value that is True if folders with the read-only attribute set are to be deleted; False (default) if they are not.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/deletefolder-method
	 */
	public DeleteFolder(folderspec: string, force = false): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Returns True if the specified drive exists; False if it does not.
	 * @param drivespec A drive letter or a path specification for the root of the drive.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/driveexists-method
	 */
	public DriveExists(drivespec: string): boolean {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Returns True if a specified file exists; False if it does not.
	 * @param filespec The name of the file whose existence is to be determined. A complete path specification (either absolute or relative) must be provided if the file isn't expected to exist in the current folder.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/fileexists-method
	 */
	public FileExists(filespec: string): boolean {
		return FS.fileExists(filespec);
	}

	/**
	 * Returns True if a specified folder exists; False if it does not.
	 * @param folderspec The name of the folder whose existence is to be determined. A complete path specification (either absolute or relative) must be provided if the folder isn't expected to exist in the current folder.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/folderexists-method
	 */
	public FolderExists(folderspec: string): boolean {
		return FS.folderExists(folderspec);
	}

	/**
	 * Returns a complete and unambiguous path from a provided path specification.
	 * @param pathspec Path specification to change to a complete and unambiguous path.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/getabsolutepathname-method
	 */
	public GetAbsolutePathName(pathspec: string): string {
		// unless we want to read real files like for ultradmd, we don't care about absolute paths.
		return pathspec;
	}

	/**
	 * Returns a string containing the base name of the last component, less any file extension, in a path.
	 * @param path The path specification for the component whose base name is to be returned.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/getbasename-method
	 */
	public GetBaseName(path: string): string {
		const last = path
			.replace(/\\+/g, '/')
			.split('/')
			.filter(p => !!p)
			.reverse()[0];
		if (last.indexOf('.') >= 0) {
			return last.substr(0, last.lastIndexOf('.'));
		}
		return last;
	}

	/**
	 * Returns a {@link Drive} object corresponding to the drive in a specified path.
	 * @param drivespec The drivespec argument can be a drive letter (c), a drive letter with a colon appended (c:), a drive letter with a colon and path separator appended (c:), or any network share specification (\computer2\share1).
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/getdrive-method
	 */
	public GetDrive(drivespec: string): Drive {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Returns a string containing the name of the drive for a specified path.
	 * @param path The path specification for the component whose drive name is to be returned.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/getdrivename-method
	 */
	public GetDriveName(path: string): string {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Returns a string containing the extension name for the last component in a path.
	 * @param path The path specification for the component whose extension name is to be returned.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/getextensionname-method
	 */
	public GetExtensionName(path: string): string {
		const last = path
			.replace(/\\+/g, '/')
			.split('/')
			.filter(p => !!p)
			.reverse()[0];
		if (last.indexOf('.') >= 0) {
			return last.substr(last.lastIndexOf('.') + 1);
		}
		return '';
	}

	/**
	 * Returns a {@link File} object corresponding to the file in a specified path.
	 * @param filespec The filespec is the path (absolute or relative) to a specific file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/getfile-method
	 */
	public GetFile(filespec: string): File | void {
		if (!FS.fileExists(filespec)) {
			return ERR.Raise(53, undefined, 'File not found');
		}
		return new File(filespec);
	}

	/**
	 * Returns the last component of a specified path that is not part of the drive specification.
	 * @param pathspec The path (absolute or relative) to a specific file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/getfilename-method-visual-basic-for-applications
	 */
	public GetFileName(pathspec: string): string {
		const last = pathspec
			.replace(/\\+/g, '/')
			.split('/')
			.filter(p => !!p)
			.reverse()[0];
		return last;
	}

	/**
	 * Returns a Folder object corresponding to the folder in a specified path.
	 * @param folderspec The folderspec is the path (absolute or relative) to a specific folder.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/getfolder-method
	 */
	public GetFolder(folderspec: string): string {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Returns a string containing the name of the parent folder of the last component in a specified path.
	 * @param path The path specification for the component whose parent folder name is to be returned.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/getparentfoldername-method
	 */
	public GetParentFolderName(path: string): string {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Returns the special folder specified.
	 * @param folderspec The name of the special folder to be returned. Can be any of the constants shown in the Settings section.
	 * @constructor
	 */
	public GetSpecialFolder(folderspec: number): {} {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Returns a randomly generated temporary file or folder name that is useful for performing operations that require a temporary file or folder.
	 * @https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/gettempname-method
	 */
	public GetTempName(): string {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Moves one or more files from one location to another.
	 * @param source The path to the file or files to be moved. The source argument string can contain wildcard characters in the last path component only.
	 * @param destination The path where the file or files are to be moved. The destination argument can't contain wildcard characters.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/movefile-method
	 */
	public MoveFile(source: string, destination: string): void {
		// only used in NVOffset(), which doesn't seem to be used very often.
		throw new VbsNotImplementedError();
	}

	/**
	 * Moves one or more folders from one location to another.
	 * @param source The path to the folder or folders to be moved. The source argument string can contain wildcard characters in the last path component only.
	 * @param destination The path where the folder or folders are to be moved. The destination argument can't contain wildcard characters.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/movefolder-method
	 */
	public MoveFolder(source: string, destination: string): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Opens a specified file and returns a {@link TextStream} object that can be used to read from, write to, or append to the file.
	 * @param filename String expression that identifies the file to open.
	 * @param mode Indicates input/output mode. Can be one of three constants: ForReading, ForWriting, or ForAppending.
	 * @param create Boolean value that indicates whether a new file can be created if the specified filename doesn't exist. The value is True if a new file is created; False if it isn't created. The default is False.
	 * @param format One of three Tristate values used to indicate the format of the opened file. If omitted, the file is opened as ASCII.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/opentextfile-method
	 */
	public OpenTextFile(filename: string, mode: number = 1, create = false, format = 0): TextStream | void {
		if (!FS.fileExists(filename) && !create) {
			return ERR.Raise(53, undefined, 'File not found');
		}
		return FS.fileExists(filename) ? FS.getStream(filename) : FS.addStream(filename, new TextStream(filename, false, mode));
	}
}
