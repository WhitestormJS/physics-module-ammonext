import {Vector3} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class ConeModule {
  constructor(params) {
    this.params = Object.assign({
      mass: 10,
      scale: new Vector3(1, 1, 1),
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0
    }, params);
  }

  integrate(self) {
    const params = self.params;

    this._physijs = {
      type: 'cone',
      radius: params.width / 2,
      mass: params.mass,
      touches: [],
      linearVelocity: new Vector3(),
      angularVelocity: new Vector3(),
      group: params.group,
      mask: params.mask,
      friction: params.friction,
      restitution: params.restitution,
      damping: params.damping,
      scale: params.scale,
      margin: params.margin,
    };

    wrapPhysicsPrototype(this);
  }

  bridge = {
    geometry(geometry) {
      if (!geometry.boundingBox) geometry.computeBoundingBox();

      this._physijs.width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      this._physijs.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;

      return geometry;
    },

    onCopy,
    onWrap
  };
}
