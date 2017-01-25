import {Vector3} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class CapsuleModule {
  constructor(params) {
    this.params = Object.assign({
      mass: 10,
      height: 3,
      scale: new Vector3(1, 1, 1),
      radius: 3,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0
    }, params);
  }

  integrate(self) {
    const params = self.params;

    this._physijs = {
      type: 'capsule',
      radius: Math.max(params.width / 2, params.depth / 2),
      height: params.height,
      friction: params.friction,
      restitution: params.restitution,
      damping: params.damping,
      margin: params.margin,
      scale: params.scale,
      mass: params.mass
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
  };
}
