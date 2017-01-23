import {Vector3} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class CompoundModule {
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

  integrate(params) {
    this._physijs = {
      type: 'compound',
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
      margin: params.margin
    };

    wrapPhysicsPrototype(this);
  }

  bridge = {
    onCopy,
    onWrap
  };
}
