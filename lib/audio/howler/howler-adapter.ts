import { Howl, Howler } from 'howler';
import { logger } from '../../util/logger';
import { ISoundAdapter, PlaybackSettings } from '../sound-adapter';

/* tslint:disable:no-console */
export class HowlerSoundAdapter implements ISoundAdapter<string> {

	private readonly sounds: { [key: string]: string } = {};
	private readonly howls: { [key: string]: Howl } = {};

	/**
	 * once all audio samples are loaded, soundEnabled should be set to true
	 */
	private soundEnabled: boolean = true;
	private player: Howl | null = null;

	constructor() {
		Howler.unload();
	}

	public playSound(sample: PlaybackSettings): void {
		if (!this.soundEnabled) {
			logger().debug('playSound: audio is not enabled!');
			return;
		}
		if (!this.howls[sample.sampleName.toLowerCase()]) {
			logger().warn('[HowlerSoundAdapter.playSound]: No such sound "%s".', sample.sampleName);
			return;
		}
		this.howls[sample.sampleName.toLowerCase()].play();
	}

	public stopSound(sampleName: string): void {
		if (!this.soundEnabled) {
			logger().debug('stopSound: audio is not enabled!');
			return;
		}
	}

	public async loadSound(name: string, data: Buffer): Promise<string> {
		const startTs = Date.now();
		name = name.toLowerCase();
		this.sounds[name] = URL.createObjectURL(new Blob([data.buffer], {type: 'audio/wave'}));
		this.howls[name] = await new Promise<Howl>((resolve, reject) => new Howl({
			src: [ this.sounds[name] ],
			format: ['wav'],
			html5: false,
			onplayerror: (soundId, error) => {
				logger().error('SOUND PLAYER ERROR', error, soundId);
			},
			onloaderror: (soundId, errorMsg) => {
				logger().error('SOUND LOAD ERROR', errorMsg, soundId);
				reject(new Error(errorMsg));
			},
			// tslint:disable-next-line:object-literal-shorthand
			onload: function(this: Howl) {
				const loadTimeMs = Date.now() - startTs;
				logger().debug('SOUND LOADED', loadTimeMs);
				resolve(this);
			},
		}));
		// this.dataUriArray.push(this.sounds[name]);
		// const rawAudio = window.btoa(data.buffer.toString());
		// this.dataUriArray.push('data:audio/wave;base64,' + rawAudio);
		// logger().debug('loaded sample %s', this.sounds[name]);
		// return Promise.resolve('');*/
		// console.log('data.buffer', data.buffer.byteLength);
		// const loadedData = await this.loadBlob(new Blob([data.buffer], { type: 'audio/wave' }));
		// console.log('loadedData', loadedData.substr(0, 50));
		// this.dataUriArray.push(loadedData);
		return this.sounds[name];
	}

	private loadBlob(file: Blob): Promise<string> {
		return new Promise((resolve) => {
			const fileReader = new FileReader();
			fileReader.onload = () => { resolve(fileReader.result + ''); };
			fileReader.readAsDataURL(file);
		});
	}

	public initializeSound(): Promise<any> {
		logger().debug('initializeSound %s', Object.keys(this.howls).length);
		return Promise.resolve();
	}

}
