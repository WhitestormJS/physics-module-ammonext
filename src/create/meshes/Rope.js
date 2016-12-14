import {RopeMesh} from '../../index.js';

export function ROPE(params, material) {
  return new RopeMesh(
    this.buildGeometry(params),
    material,
    params
  );
}
