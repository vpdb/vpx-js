import {
  LoadingManager,
  DataTextureLoader,
  TextureDataType,
  PixelFormat
} from '../../../refs.node';

export interface EXR {
  header: object;
  width: number;
  height: number;
  data: Float32Array;
  format: PixelFormat;
  type: TextureDataType;
}

export class EXRLoader extends DataTextureLoader {
  constructor(manager?: LoadingManager);
  type: TextureDataType;

  _parser(buffer: ArrayBuffer) : EXR;
  setDataType(type: TextureDataType): this;
}
