import { Howl, Howler } from 'howler';
import { logger } from '../../util/logger';
import { ISoundAdapter, PlaybackSettings } from '../sound-adapter';

export class HowlerSoundAdapter implements ISoundAdapter<string> {

	private readonly sounds: { [key: string]: string } = {};

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

	public loadSound(name: string, data: Buffer): Promise<string> {
		this.sounds[name] = URL.createObjectURL(new Blob([data.buffer], {type: 'audio/wave'}));
		logger().debug('loaded sample %s', this.sounds[name]);
		return Promise.resolve(this.sounds[name]);
	}
}
