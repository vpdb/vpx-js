import { Howl, Howler } from 'howler';
import { logger } from '../../util/logger';
import { ISoundAdapter, PlaybackSettings } from '../sound-adapter';

export class HowlerSoundAdapter implements ISoundAdapter {

	/**
	 * once all audio samples are loaded, soundEnabled should be set to true
	 */
	private soundEnabled: boolean = false;

	constructor() {
		Howler.unload();
	}

	public playSound(sample: PlaybackSettings): void {
		if (!this.soundEnabled) {
			logger().debug('audio is not enabled!');
			return;
		}
	}

	public stopSound(sampleName: string): void {
		if (!this.soundEnabled) {
			logger().debug('audio is not enabled!');
			return;
		}
	}

	public preloadSample(sampleName: string, url: string): Promise<boolean> {
		logger().debug('NOT IMPLEMENTED!');
		return Promise.reject();
	}

}
