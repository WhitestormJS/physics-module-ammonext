import {Vector3, MultiMaterial, Mesh, JSONLoader} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class ConcaveModule {
  constructor(params) {
    this.params = Object.assign({
      mass: 10,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      scale: new Vector3(1, 1, 1),
      margin: 0,
      loader: new JSONLoader()
    }, params);

    if (this.params.path && this.params.loader) {
      this.geometryLoader = new Promise((resolve, reject) => {
        this.params.loader.load(
          this.params.path,
          resolve,
          () => {},
          reject
        );
      });
    }
  }

  geometryProcessor(geometry) {
    const isBuffer = geometry.type === 'BufferGeometry';

    if (!geometry.boundingBox) geometry.computeBoundingBox();

    const data = isBuffer ?
      geometry.attributes.position.array :
      new Float32Array(geometry.faces.length * 9);

    if (!isBuffer) {
      const vertices = geometry.vertices;

      for (let i = 0; i < geometry.faces.length; i++) {
        const face = geometry.faces[i];

        const vA = vertices[face.a];
        const vB = vertices[face.b];
        const vC = vertices[face.c];

        const i9 = i * 9;

        data[i9] = vA.x;
        data[i9 + 1] = vA.y;
        data[i9 + 2] = vA.z;

        data[i9 + 3] = vB.x;
        data[i9 + 4] = vB.y;
        data[i9 + 5] = vB.z;

        data[i9 + 6] = vC.x;
        data[i9 + 7] = vC.y;
        data[i9 + 8] = vC.z;
      }
    }

    return data;
  };

  integrate(params) {
    this._physijs = {
      type: 'concave',
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
    geometry(geometry, self) {
      if (self.params.path) {
        this.wait(self.geometryLoader);

        self.geometryLoader
          .then(geom => {
            this._physijs.data = self.geometryProcessor(geom)
          });
      } else {
        this._physijs.data = self.geometryProcessor(geometry);
      }

      return geometry;
    },

    onCopy,
    onWrap
  }
}
