import {CylinderMesh, SoftMesh} from '../../index.js';

export function CYLINDER(params, material) {
  return new (params.softbody ? SoftMesh : CylinderMesh)(
    this.buildGeometry(params),
    material,
    params
  );
}
