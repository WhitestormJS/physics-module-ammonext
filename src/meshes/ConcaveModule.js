import {Vector3, MultiMaterial, Mesh, JSONLoader} from 'three';
import {wrapPhysicsPrototype} from './physicsPrototype';

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

    if (params.path && params.loader) {
      this.geometryLoader = new Promise((resolve, reject) => {
        params.loader.load(
          params.path,
          resolve,
          null,
          reject
        );
      });
    }
  }

  geometryProcessor(geometry) {
    const isBuffer = geometry.type === 'BufferGeometry';

    // geometry.scale(
    //   this.params.scale.x,
    //   this.params.scale.y,
    //   this.params.scale.z
    // );

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
        const {x: xScale, y: yScale, z: zScale} = this.params.scale;

        data[i9] = vA.x * xScale;
        data[i9 + 1] = vA.y * yScale;
        data[i9 + 2] = vA.z * zScale;

        data[i9 + 3] = vB.x * xScale;
        data[i9 + 4] = vB.y * yScale;
        data[i9 + 5] = vB.z * zScale;

        data[i9 + 6] = vC.x * xScale;
        data[i9 + 7] = vC.y * yScale;
        data[i9 + 8] = vC.z * zScale;
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
      margin: params.margin
    };

    wrapPhysicsPrototype(this);
  }

  bridge = {
    geometry(geometry, self) {
      if (self.path) {
        this.wait(self.geometryLoader);

        self.geometryLoader
          .then(self.geometryProcessor)
          .then(data => {
            this._physijs.data = data;
          });
      } else {
        this._physijs.data = self.geometryProcessor(geometry);
      }

      return geometry;
    }
  }
}
