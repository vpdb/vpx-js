import { Scene } from 'three';
import { GLTFExporter } from './gltf-exporter';
import { ParseOptions, VpTableExporterOptions } from './table-exporter';

export function exportGltf(scene: Scene, opts: VpTableExporterOptions, gltfOpts?: ParseOptions) {
	const gltfExporter = new GLTFExporter(Object.assign({}, { embedImages: true, optimizeImages: opts.optimizeTextures }, gltfOpts));
	return gltfExporter.parse(scene);
}
