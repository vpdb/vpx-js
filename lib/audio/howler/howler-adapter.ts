import { Howl, Howler } from 'howler';
import { logger } from '../../util/logger';
import { ISoundAdapter, PlaybackSettings } from '../sound-adapter';

export class HowlerSoundAdapter implements ISoundAdapter<string> {

	private readonly sounds: { [key: string]: string } = {};

	/**
	 * once all audio samples are loaded, soundEnabled should be set to true
	 */
	private soundEnabled: boolean = false;
	private player: Howl | null = null;

	constructor() {
		Howler.unload();
	}

	public playSound(sample: PlaybackSettings): void {
		if (!this.soundEnabled || !this.player) {
			logger().debug('playSound: audio is not enabled!');
			return;
		}
		this.player.play(sample.sampleName);
	}

	public stopSound(sampleName: string): void {
		if (!this.soundEnabled) {
			logger().debug('stopSound: audio is not enabled!');
			return;
		}
	}

	public loadSound(name: string, data: Buffer): Promise<string> {
		this.sounds[name] = URL.createObjectURL(new Blob([data.buffer], {type: 'audio/wave'}));
		logger().debug('loaded sample %s', this.sounds[name]);
		return Promise.resolve('');
	}

	public initializeSound(): Promise<any> {
		logger().debug('initializeSound %s', this.sounds.length);

		return new Promise((resolve, reject) => {
			const startTs: number = Date.now();
			this.player = new Howl({
				src: this.sounds[name],
				format: ['wav', 'mp3' ],
				onplayerror: (soundId, error) => {
				  console.log('SOUND PLAYER ERROR', error, soundId);
				},
				onloaderror: (soundId, error) => {
				  console.log('SOUND PLAYER LOAD ERROR', error, soundId);
				  reject(error);
				},
				onload: () => {
				  this.soundEnabled = true;
				  const loadTimeMs = Date.now() - startTs;
				  console.log('SOUND LOADED', loadTimeMs);
				  resolve();
				},
			});
		});
	}

}
