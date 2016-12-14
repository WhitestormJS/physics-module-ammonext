import {SphereMesh, SoftMesh} from '../../index.js';

export function SPHERE(params, material) {
  return new (params.softbody ? SoftMesh : SphereMesh)(
    this.buildGeometry(params),
    material,
    params
  );
}
