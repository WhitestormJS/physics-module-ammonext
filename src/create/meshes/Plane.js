import {PlaneMesh, ClothMesh} from '../../index.js';

export function createPlane(params, material) {
  return new (params.softbody ? ClothMesh : PlaneMesh)(
    this.buildGeometry(params),
    material,
    params
  );
}
