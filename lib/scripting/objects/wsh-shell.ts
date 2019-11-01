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

import { globalEnvironment, WshEnvironment } from './wsh-environment';
import { VbsNotImplementedError } from '../vbs-api';
import { registry } from '../../io/global-registry';

/**
 * Provides access to the native Windows shell.
 *
 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/aew9yb99(v=vs.84)?redirectedfrom=MSDN
 */
export class WshShell {

	/**
	 * Retrieves or changes the current active directory.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/3cc5edzd%28v%3dvs.84%29
	 */
	public CurrentDirectory: string = '.';

	/**
	 * Returns the WshEnvironment object (a collection of environment variables).
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/fd7hxfdd%28v%3dvs.84%29
	 */
	public Environment: WshEnvironment = globalEnvironment;

	/**
	 * Returns a SpecialFolders object (a collection of special folders).
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/0ea7b5xe%28v%3dvs.84%29
	 * @ignore
	 */
	public SpecialFolders: {} = {};

	/**
	 * Activates an application window.
	 *
	 * @param id Specifies which application to activate. This can be a string containing the title of the application (as it appears in the title bar) or the application's Process ID.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/wzcddbek%28v%3dvs.84%29
	 */
	public AppActivate(id: string | number): void {
		// only used in ultradmd which we currently ignore
		throw new VbsNotImplementedError();
	}

	/**
	 * Creates a new shortcut, or opens an existing shortcut.
	 * @param strPathname String value indicating the pathname of the shortcut to create
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/xsy6k3ys%28v%3dvs.84%29
	 */
	public CreateShortcut(strPathname: string): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Runs an application in a child command-shell, providing access to the StdIn/StdOut/StdErr streams.
	 * @param strCommand String value indicating the command line used to run the script. The command line should appear exactly as it would if you typed it at the command prompt.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/ateytk4a%28v%3dvs.84%29
	 */
	public Exec(strCommand: string): void {
		// no usages found (fortunately!)
		throw new VbsNotImplementedError();
	}

	/**
	 * Returns an environment variable's expanded value.
	 * @param strString String value indicating the name of the environment variable you want to expand.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/dy8116cf%28v%3dvs.84%29
	 */
	public ExpandEnvironmentStrings(strString: string): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Adds an event entry to a log file.
	 * @param intType Integer value representing the event type.
	 * @param strMessage String value containing the log entry text.
	 * @param strTarget String value indicating the name of the computer system where the event log is stored (the default is the local computer system). Applies to Windows NT/2000 only.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/b4ce6by3%28v%3dvs.84%29
	 */
	public LogEvent(intType: number, strMessage: string, strTarget?: string): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Displays text in a pop-up message box.
	 * @param strText String value that contains the text you want to appear in the pop-up message box.
	 * @param nSecondsToWait Numeric value indicating the maximum number of seconds you want the pop-up message box displayed. If nSecondsToWait is zero (the default), the pop-up message box remains visible until closed by the user.
	 * @param strTitle String value that contains the text you want to appear as the title of the pop-up message box.
	 * @param nType Numeric value indicating the type of buttons and icons you want in the pop-up message box. These determine how the message box is used.
	 * @param intButton Integer value indicating the number of the button the user clicked to dismiss the message box. This is the value returned by the Popup method.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/x83z1d9f%28v%3dvs.84%29
	 */
	public Popup(strText: string, nSecondsToWait?: number, strTitle?: string, nType?: number, intButton?: number): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Deletes a key or one of its values from the registry.
	 * @param strName String value indicating the name of the registry key or key value you want to delete.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/293bt9hh%28v%3dvs.84%29
	 */
	public RegDelete(strName: string): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Returns the value of a key or value-name from the registry.
	 * @param strName String value indicating the key or value-name whose value you want.
	 * @return Read value
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/x05fawxd%28v%3dvs.84%29
	 */
	public RegRead(strName: string): any {
		return registry.regRead(strName);
	}

	/**
	 * Creates a new key, adds another value-name to an existing key (and assigns it a value), or changes the value of an existing value-name.
	 * @param strName String value indicating the key-name, value-name, or value you want to create, add, or change.
	 * @param anyValue The name of the new key you want to create, the name of the value you want to add to an existing key, or the new value you want to assign to an existing value-name.
	 * @param strType String value indicating the value's data type.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/yfdfhz1b%28v%3dvs.84%29
	 */
	public RegWrite(strName: string, anyValue: any, strType?: string): void {
		registry.regWrite(strName, anyValue);
	}

	/**
	 * Runs a program in a new process.
	 * @param strCommand String value indicating the command line you want to run. You must include any parameters you want to pass to the executable file.
	 * @param intWindowStyle Integer value indicating the appearance of the program's window. Note that not all programs make use of this information.
	 * @param bWaitOnReturn Boolean value indicating whether the script should wait for the program to finish executing before continuing to the next statement in your script. If set to true, script execution halts until the program finishes, and Run returns any error code returned by the program. If set to false (the default), the Run method returns immediately after starting the program, automatically returning 0 (not to be interpreted as an error code).
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/d5fk67ky%28v%3dvs.84%29
	 */
	public Run(strCommand: string, intWindowStyle?: number, bWaitOnReturn?: boolean): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Sends one or more keystrokes to the active window (as if typed on the keyboard).
	 * @param s String value indicating the keystroke(s) you want to send.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/8c6yea83%28v%3dvs.84%29#arguments
	 */
	public SendKeys(s: string): void {
		// no usages found
		throw new VbsNotImplementedError();
	}
}
