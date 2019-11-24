export interface ISoundAdapter {

	playSound(sample: PlaybackSettings): void;

	preloadSample(sampleName: string, url: string): Promise<boolean>;

}

export interface PlaybackSettings {

	/**
	 * the reference to the audio sample to play
	 */
	sampleName: string;

	/**
	 * Options:
	 * - 0 no loop
	 * - -1 continious loop
	 * - n number of loops
	 * TODO split this up?
	 */
	loopCount?: number;

	/**
	 * pan audio left/right, 0 means even balanced, -1 is full left, 1 to full right
	 */
	pan?: number;

	/**
	 * pitch audio TODO
	 */
	pitch?: number;

	/**
	 * define audio volume between 0.0 and 1.0
	 * TODO: does the vpinmame use setting between 0.0 .. 3.0 ?
	 */
	volume?: number;

	/**
	 * TODO: i don't have a clue yet
	 */
	randomPitch?: number;

	/**
	 * TODO: i don't have a clue yet
	 */
	restart?: boolean;

	/**
	 * TODO: i don't have a clue yet
	 */
	useSame?: boolean;

	/**
	 * TODO: i don't have a clue yet
	 */
	frontRearFade?: number;
}
