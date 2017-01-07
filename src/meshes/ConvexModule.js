import {Vector3, BufferGeometry} from 'three';
import {wrapPhysicsPrototype, onCopy} from './physicsPrototype';

export class ConvexModule {
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

  integrate(params) {
    this._physijs = {
      type: 'convex',
      mass: params.mass,
      touches: [],
      linearVelocity: new Vector3(),
      angularVelocity: new Vector3(),
      group: params.group,
      mask: params.mask,
      friction: params.friction,
      restitution: params.restitution,
      damping: params.damping,
      margin: params.margin,
      scale: params.scale
    };

    wrapPhysicsPrototype(this);
  }

  bridge = {
    mesh(mesh) {
      const geometry = mesh.geometry;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      const isBuffer = geometry.type === 'BufferGeometry';

      if (!isBuffer) geometry._bufferGeometry = new BufferGeometry().fromGeometry(geometry);

      const data = isBuffer ?
        geometry.attributes.position.array :
        geometry._bufferGeometry.attributes.position.array;

      this._physijs.data = data;

      return mesh;
    },

    onCopy
  }
}
