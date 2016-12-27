import {ConvexMesh, SoftMesh} from '../../index.js';

export function CONVEX(params, material) {
  return new (params.softbody ? SoftMesh : ConvexMesh)(
    this.buildGeometry(params),
    material,
    params
  );
}

export function CONVEX2(params, material, geometry, geometry2) {
  return new (params.softbody ? SoftMesh : ConvexMesh)(
    geometry,
    material,
    params,
    geometry2
  );
}