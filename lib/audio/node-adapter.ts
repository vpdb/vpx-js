import { ISoundAdapter, PlaybackSettings } from './sound-adapter';

export class NodeSoundAdapter implements ISoundAdapter<void> {

	public loadSound(name: string, data: Buffer): Promise<void> {
		return Promise.resolve();
	}

	public playSound(sample: PlaybackSettings): void {
		// do nothing
	}

	public stopSound(sampleName: string): void {
		// do nothing
	}
}
