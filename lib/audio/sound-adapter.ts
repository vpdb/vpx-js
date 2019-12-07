export interface ISoundAdapter<T> {

	/**
	 * Loads the sound in order to play it later
	 * @param name Name of the sound
	 * @param data Binary data of the sound
	 */
	loadSound(name: string, data: Buffer): Promise<T>;

	/**
	 * signals the loader that all sounds are loaded using the loadSound function
	 * TODO: merge initialize sound with load sound?
	 */
	initializeSound(): Promise<any>;

	/**
	 * Play an audio sample OR modify an already playing sample (increase/decrease the frequency of an already playing samples)
	 * @param sample
	 */
	playSound(sample: PlaybackSettings): void;

	/**
	 * stop playing sample
	 * @param sampleName
	 */
	stopSound(sampleName: string): void;

	// playMusic(params: { music: string, volume: number }): void;
	// endMusic(params: { music: string }): void;
	//MusicVolume(float volume) - 0..1
}

export interface PlaybackSettings {

	/**
	 * the reference to the audio sample to play
	 */
	sampleName: string;

	/**
	 * Options:
	 * - 0 no loop (play once)
	 * - -1 continuous loop
	 * - n number of loops
	 * TODO split this up?
	 */
	loopCount?: number;

	/**
	 * pan audio left/right
	 * ranges from  -1.0 (left), 0.0 (both) to 1.0 (right)
	 */
	pan?: number;

	/**
	 * pitch audio
	 * can be positive or negative and directly adds onto the standard sample frequency
	 */
	pitch?: number;

	/**
	 * define audio volume between 0.0 and 1.0
	 */
	volume?: number;

	/**
	 * TODO: i don't have a clue yet
	 */
	randomPitch?: number;

	/**
	 * sample would reuse the same channel if it is already playing
	 * TODO: i don't have a clue yet
	 */
	useExisting?: boolean;

	/**
	 * useful if useExisting is set to true - restart the sample from beginning
	 */
	restart?: boolean;

	/**
	 * similar to pan but fades between the front and rear speakers
	 * TODO: i don't have a clue yet
	 */
	frontRearFade?: number;
}
