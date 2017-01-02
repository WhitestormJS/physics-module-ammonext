import {Vector3, BufferGeometry} from 'three';
import {wrapPhysicsPrototype} from './physicsPrototype';

export class ConvexModule {
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
      margin: params.margin
    };

    wrapPhysicsPrototype(this);
  }

  bridge = {
    mesh(mesh) {
      const geometry = mesh.geometry;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      const isBuffer = geometry.type === 'BufferGeometry';

      if (!isBuffer) geometry._bufferGeometry = new BufferGeometry().fromGeometry(geometry);

      console.log(geometry._bufferGeometry);

      const data = isBuffer ?
        geometry.attributes.position.array :
        geometry._bufferGeometry.attributes.position.array;

      this._physijs.data = data;

      return geometry;
    }
  }
}
