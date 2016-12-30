import {Vector3} from 'three';
import {wrapPhysicsPrototype} from './physicsPrototype';

export class SphereModule {
  constructor(params) {
    this.params = Object.assign({
      mass: 10,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      pressure: 100,
      margin: 0,
      klst: 0.9,
      kvst: 0.9,
      kast: 0.9
    }, params);
  }

  integrate(params) {
    this._physijs = {
      type: 'sphere',
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

    wrapPhysicsPrototype(this);
  }

  bridge = {
    geometry(geometry) {
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      this._physijs.radius = geometry.boundingSphere.radius;
      return geometry;
    }
  }
}
