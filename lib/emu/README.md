# API

## Visual PinMAME Control

### STATS:

A quick evaluation of 357 VPX VBS files, showed this amount of API Calls

#### Visual Pinball Calls
- .Switch 9473
- .Lamp 374
- .Dip 16
- .Solenoid 204
- .GIString 0
- .GameName 310
- .Running 0
- .Pause 447
- .Version 278
- .Run 359
- .Stop 453
- .HandleMechanics 292
- .WPCNumbering 0
- .SampleRate 0
- .SplashInfoLine 306
- .ShowFrame 308
- .DoubleSize 3
- .Antialias 0
- .BorderSizeX 0
- .BorderSizeY 0
- .WindowPosX 0
- .WindowPosY 0
- .LockDisplay 1
- .Hidden 270
- .SetDisplayPosition 22
- .ShowOptsDialog 1
- .ShowPathesDialog 0
- .ShowAboutDialog 0
- .CheckROMS 0
- .ChangedLamps 247
- .ChangedSolenoids 2
- .ChangedGI 11
- .ChangedLEDs 56
- .ShowDMDOnly 310
- .HandleKeyboard 286
- .ShowTitle 313

#### Non Visual Pinball Calls
- .SolMask 78
- .B2SSetData 505
- .GetMech 38

### STATE
Should be implemented - BASIC

#### PoC

```
const Control = {
	gameName: '',
	running: false,
	pause: false,
	get GameName() {
		return this.gameName;
	},
	set GameName(gameName) {
		this.gameName = gameName;
	},
	get Running() {
		return this.running;
	},
	get Pause() {
		return this.pause;
	},
	set Pause(pause) {
		this.pause = pause;
	},
	get Version() {
		return '1.10.11';
	},
	Run() {
		console.log('BOO HOO');
	},
	Stop() {
		console.log('STOP');
	}
}
```

### Properties

- GameName, Read/Write: Initializes VPinMAME for game "gameName". Example Controller.GameName = "tz_94h"
- Running, Read Only: Returns True if the emulation is running, False otherwise.
- Pause, Read/Write: Setting this property to True will "Pause" the current emulation. Setting it to false will "Resume" a paused emulation.
- Version, Read Only: Returns the version number of Visual PinMAME as an 8-digit string "vvmmbbrr":

### Methods

- Run(parentWindow, minVersion): Starts Visual PinMAME emulation of game specified with .GameName property.
parentWindow: handler of window to put outputin. (Default= 0 -> no parent window)
minVersion: Minimum version of Visual PinMAME (e.g. 100 for 1.00) required to run this game! (Default=any version)
- Stop, Stops Visual PinMAME emulation.

## Game Settings

### STATE
Should be implemented.

#### PoC

```
const GameSetting = {
	get Dip() {
		//TODO unclear
	},
	set Dip(dipBankNumber) {
		//TODO unclear
	},
	get WPCNumbering() {
		return this.pause;
	},
	get SampleRate() {
		return 22050;
	},
}
```

### Properties

- Dip (Dip Bank Number), Read/Write, Sets/Gets the Dip switch settings for the current game. Dip Bank Number: dip 1-8 = bank 0, dip 9-16 = bank 1 ... value: binary value to set the dips 1=On, 0=Off. Example: Controller.Dip(0) = &H55, Controller.Dip(1) = &Haa
- HandleMechanics, Read/Write, If the game has a PinMAME simulator it can be used to simulate hardware "toys". value: # of which Mechanics VPinMAME should handle. Example: For TZ: 1=Clock, 2=Gumball Machine
- WPCNumbering, Read Only, Determine if game uses WPC Numbering of Switches and Lamps, WPCNumbering = Column*10 + Row (11,12,13,14,15,16,17,18,21,22...), non WPCnumbering = 1,2,3,4,..., Example: If WPCNumbering Then firstSwitch = 1 Else firstSwitch = 11
- SampleRate, Read/Write, Sets/Gets the sample rate, Example: Controller.SampleRate = 22050

## Customization

### STATE
Will skip implementation unless we need.

### Properties

- SplashInfoLine, Read/Write, Game credits to display in startup splash screen. Example: Controller.SplashInfoLine = "Game design by ..."
- ShowFrame, Read/Write, Enabled/Disables the window border, Only works if ShowTitle is set to False!
- DoubleSize, Read/Write, Sets Visual PinMAME window to Double Size or Normal Size. Returns whether Window is Double Size or not.
- Antialias, Enables/disables scan lines/coumns between the dots of the DMD. Default value is True. Returns whether the scanlines are enabled or not. Set this property before the emulation starts.
- BorderSizeX and BorderSizeY, Read/Write, Sets & Gets the size of an empty area around the DMD Display, Default value is 4 Pixels
- WindowPosX and WindowPosY, Read/Write, Sets & Gets the position of the Display Window
- LockDisplay, Read/Write, Sets/Gets the lock state of the display. If the display is locked no keyboard events are handled and the display can't be the active window!
- Hidden, Read/Write, VPM 1.32 or higher, Sets or gets the hidden state of the display. Setting Hidden=True makes the VPM display invisible until it is turned back on with Hidden=False or VPM is restarted. This is useful for applications that want to do the display drawing on their own.

### Methods

- SetDisplayPosition(x,y,hWnd), Sets the position of the display to x and y; if hWnd is a valid window handle, x and y are assumed to be relative to the window, so this function calculates the proper screen position of the display
- ShowOptsDialog(hWnd), Shows the options dialog for the current game or set default options if no game name is set. The hWnd is the handle of the parent window, default is 0 (no parent window).
- ShowPathesDialog(hWnd), Shows the pathes dialog where the user can set the diffrent pathes (ROMS, Cfg, Screenshots). The hWnd is the handle of the parent window, default is 0 (no parent window).
- ShowAboutDialog(hWnd), Displays the About dialog of Visual PinMAME. The hWnd is the handle of the parent window, default is 0 (no parent window).
- CheckROMS(nShowOptions,hWnd), Checks the rom set for the current game and displays the results.
```
nShowOptions:
0 = Allways displays the results
1 = Only displays the results if there are errors found
2 = Never displays the results

Return value is true if the roms are good.
The hWnd is the handle for the parent window, default is 0 (no parent window)

Example:
Controller.CheckROMS(0,hWnd) : Displays the results of the ROM check (hWnd = Handle of a Window)
```

## Aggregate Polling Functions


These properties return a matrix with everything that has changed since the last call.
The array contains the following info
Matrix(0,0) Number of first changed item
Matrix(0,1) New status of first item
Matrix(1,0) Number of second changed item

### STATE
Should be implemented - BASIC

#### PoC

```
const AggregatePollingFunctions = {
	get ChangedLamps() {
		return x;
	},
	get ChangedSolenoids() {
		return x;
	},
	get ChangedGI() {
		return x;
	},
	get ChangedLEDs() {
		return '1.10.11';
	},
}
```


### Properties

- ChangedLamps, Read Only, Returns which lamps have changed since last call to this property!
- ChangedSolenoids, Read Only, Same as ChangedLamps but for solenoids
- ChangedGI, Read Only, Same as ChangedLamps but for GI strings
- ChangedLEDs, Read Only, Returns changed display digit segments since last call to this property.

## Game Input/Output

### STATE
Should be implemented - BASIC

#### PoC

```
const GameInputOutput = {
	get Lamp(number) {
		return x;
	},
	get Solenoid(number) {
		return x;
	},
	get GIString(number) {
		return x;
	},
	get Switch(number) {
		return x;
	},
}
```

### Properties

- Lamp(number), Read Only, Get status of a single lamp, return: True = Lamp on, False = Lamp off
- Solenoid(number), Read Only, Get status of a single solenoid, return: True = Solenoid on, False = Solenoid off
- GIString(number), Read Only, return: True = GI String on, False = GI String off
- Switch(number), Read/Write, setting/returning: True = Switch On, False = Switch Off

## Debugging

### STATE
Will skip implementation unless we need.

### Properties

- ShowDMDOnly, Read/Write, Enable/disable VPinMAME status matrices.
- HandleKeyboard, Read/Write, If set to True, VPinMAME will process the keyboard. Standard MAME keys can be used in VPinMAME output window. Also the internal ball simulator is enabled.
- ShowTitle, Read/Write, Show title bar on VPinMAME output window (to move it around)

## Events

### STATE
Will skip implementation unless we need.

May not be supported in all scripting environments!

- OnSolenoid(solenoidNo, isActive), Called whenever a solenoid changes state
- OnStateChange(newState), Called whenever the emulation is started or stopped (not called on Pause)
