import { Scene } from 'three';
import { ParseOptions, VpTableExporterOptions } from '../vpt/table/table-exporter';
import { GLTFExporter } from './gltf-exporter';

export function exportGltf(scene: Scene, opts: VpTableExporterOptions, gltfOpts?: ParseOptions) {
	const gltfExporter = new GLTFExporter(Object.assign({}, { embedImages: true, optimizeImages: opts.optimizeTextures }, gltfOpts));
	return gltfExporter.parse(scene);
}
