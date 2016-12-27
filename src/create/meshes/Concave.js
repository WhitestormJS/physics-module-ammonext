import {ConcaveMesh, SoftMesh} from '../../index.js';

export function CONCAVE(params, material) {
  return new (params.softbody ? SoftMesh : ConcaveMesh)(
    this.buildGeometry(params),
    material,
    params
  );
}

export function CONCAVE2(params, material, geometry, geometry2) {
  return new (params.softbody ? SoftMesh : ConcaveMesh)(
    geometry,
    material,
    params,
    geometry2
  );
}
