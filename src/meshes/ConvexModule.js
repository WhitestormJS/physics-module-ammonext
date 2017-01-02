import {Vector3} from 'three';
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
    geometry(geometry) {
      if (!geometry.boundingBox) geometry.computeBoundingBox();

      const isBuffer = geometry.type === 'BufferGeometry';

      const data = isBuffer ?
        geometry.attributes.position.array :
        new Float32Array(geometry.vertices.length * 3);

      if(!isBuffer) {
        for (let i = 0; i < geometry.vertices.length; i++) {
          data[i * 3] = geometry.vertices[i].x;
          data[i * 3 + 1] = geometry.vertices[i].y;
          data[i * 3 + 2] = geometry.vertices[i].z;
        }
      }

      this._physijs.data = data;

      return geometry;
    }
  }

}
