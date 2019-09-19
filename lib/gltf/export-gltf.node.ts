import { TableGenerateGltfOptions } from '../vpt/table/table';
import { TableExportOptions } from '../vpt/table/table-exporter';
import { GLTFExporter } from './gltf-exporter';
import { Scene } from '../refs.node';

export function exportGltf(scene: Scene, opts: TableExportOptions, gltfOpts?: TableGenerateGltfOptions) {
	const gltfExporter = new GLTFExporter(Object.assign({}, { embedImages: true, optimizeImages: opts.optimizeTextures }, gltfOpts));
	return gltfExporter.parse(scene);
}
