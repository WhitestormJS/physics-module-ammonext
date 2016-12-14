import {ConvexMesh, ConcaveMesh, SoftMesh} from '../../index.js';

export function CONVEX_CONCAVE(params, material) {
  return new (params.softbody ? SoftMesh :
      this.physics.type === 'concave' ? ConcaveMesh : ConvexMesh
    )(
    this.buildGeometry(params),
    material,
    params
  );
}
