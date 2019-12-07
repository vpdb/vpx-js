import { Howl, Howler } from 'howler';
import { logger } from '../../util/logger';
import { ISoundAdapter, PlaybackSettings } from '../sound-adapter';

export class HowlerSoundAdapter implements ISoundAdapter<string> {

	private readonly sounds: { [key: string]: string } = {};
	private readonly dataUriArray: string[] = [];

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

	private loadBlob(file): Promise<string> {
		return new Promise((resolve) => {
			const fileReader = new FileReader();
			fileReader.onload = () => { resolve(fileReader.result + '')};
			fileReader.readAsDataURL(file);
		});
	}

	public async loadSound(name: string, data: Buffer): Promise<string> {
/*		this.sounds[name] = URL.createObjectURL(new Blob([data.buffer], {type: 'audio/wave'}));
		this.dataUriArray.push(this.sounds[name]);
//		const rawAudio = window.btoa(data.buffer.toString());
//		this.dataUriArray.push('data:audio/wave;base64,' + rawAudio);
		logger().debug('loaded sample %s', this.sounds[name]);
		return Promise.resolve('');*/
		console.log('data.buffer',data.buffer.byteLength);
		const loadedData = await this.loadBlob(new Blob([data.buffer], { type: 'audio/wave' }));
		console.log('loadedData', loadedData.substr(0, 50));
		this.dataUriArray.push(loadedData);
	}

	public initializeSound(): Promise<any> {
		logger().debug('initializeSound %s', this.dataUriArray.length);

		return new Promise((resolve, reject) => {
			const startTs: number = Date.now();
			this.player = new Howl({
				src: this.dataUriArray,
				format: ['wav'],
				html5: false,
				onplayerror: (soundId, error) => {
					logger().error('SOUND PLAYER ERROR', error, soundId);
				},
				onloaderror: (soundId, errorMsg) => {
					logger().error('SOUND LOAD ERROR', errorMsg, soundId);
					reject(new Error(errorMsg));
				},
				onload: () => {
					this.soundEnabled = true;
					const loadTimeMs = Date.now() - startTs;
					logger().debug('SOUND LOADED', loadTimeMs);
					resolve();
				},
			});
		});
	}

}
