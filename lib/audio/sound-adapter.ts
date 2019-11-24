export interface ISoundAdapter {

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

	//TODO unclear if we need to handle play music or if we can reuse sound
	//PlayMusic(string, float volume) - volume 0..1
	//MusicVolume(float volume) - 0..1
	//EndMusic()

	/**
	 * TODO UNCLEAR - but we need to define how to preload audio sample
	 * @param sampleName internal identifier
	 * @param url where to download this data.. TODO might be an iunt8array instead an url too...
	 */
	preloadSample(sampleName: string, url: string): Promise<boolean>;

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
