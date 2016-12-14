import {ConvexMesh, ConcaveMesh, SoftMesh} from '../../index.js';

export function CUSTOM(params, material, geometry, geometry2 = false) {
  return geometry2 ? new (params.softbody ? SoftMesh :
      params.physics.type === 'concave' ? ConcaveMesh : ConvexMesh
    )(
    geometry,
    material,
    params,
    geometry2
  ) : new (params.softbody ? SoftMesh :
      params.physics.type === 'concave' ? ConcaveMesh : ConvexMesh
    )(
    geometry,
    material,
    params,
    geometry2
  );
}
