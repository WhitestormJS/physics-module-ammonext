import {Vector3} from 'three';

export class PlaneModule {
  constructor(params) {
    this.params = Object.assign({
      mass: 10,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0
    }, params);
  }

  integrate(params) {
    this._physijs = {
      type: 'plane',
      mass: params.mass || 0,
      touches: [],
      linearVelocity: new Vector3(),
      angularVelocity: new Vector3(),
      group: params.group,
      mask: params.mask,
      params: {
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        margin: params.margin,
        mass: params.mass
      }
    };
  }

  bridge = {
    geometry(geometry) {
      if (!geometry.boundingBox) geometry.computeBoundingBox();

      this._physijs.width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      this._physijs.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      this._physijs.normal = geometry.faces[0].normal.clone();

      return geometry;
    }
  }
}

