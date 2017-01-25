import {Vector3} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class CylinderModule {
  constructor(params) {
    this.params = Object.assign({
      mass: 10,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0,
      scale: new Vector3(1, 1, 1)
    }, params);
  }

  integrate(self) {
    const params = self.params;

    this._physijs = {
      type: 'cylinder',
      width: params.width,
      height: params.height,
      depth: params.depth,
      touches: [],
      linearVelocity: new Vector3(),
      angularVelocity: new Vector3(),
      group: params.group,
      mask: params.mask,
      friction: params.friction,
      restitution: params.restitution,
      damping: params.damping,
      margin: params.margin,
      mass: params.mass,
      scale: params.scale
    };

    wrapPhysicsPrototype(this);
  }

  bridge = {
    geometry(geometry) {
      if (!geometry.boundingBox) geometry.computeBoundingBox();

      this._physijs.width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      this._physijs.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      this._physijs.depth = geometry.boundingBox.max.z - geometry.boundingBox.min.z;

      return geometry;
    },

    onCopy,
    onWrap
  }
}
