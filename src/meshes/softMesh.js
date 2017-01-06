import {Vector3, BufferGeometry, BufferAttribute} from 'three';
import {wrapPhysicsPrototype} from './physicsPrototype';

export class SoftbodyModule{
  constructor(params) {
    this.params = Object.assign({
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      pressure: 100,
      margin: 0,
      klst: 0.9,
      kvst: 0.9,
      kast: 0.9,
    }, params);
  }

  // createIndexedBufferGeometryFromGeometry(geometry) {
  //   const numVertices = geometry.vertices.length;
  //   const numFaces = geometry.faces.length;
  //   const bufferGeom = new BufferGeometry();
  //   const vertices = new Float32Array(numVertices * 3);
  //   const indices = new (numFaces * 3 > 65535 ? Uint32Array : Uint16Array)(numFaces * 3);

  //   for (let i = 0; i < numVertices; i++) {
  //     const p = geometry.vertices[i];
  //     const i3 = i * 3;

  //     vertices[i3] = p.x;
  //     vertices[i3 + 1] = p.y;
  //     vertices[i3 + 2] = p.z;
  //   }

  //   for (let i = 0; i < numFaces; i++) {
  //     const f = geometry.faces[i];
  //     const i3 = i * 3;

  //     indices[i3] = f.a;
  //     indices[i3 + 1] = f.b;
  //     indices[i3 + 2] = f.c;
  //   }

  //   bufferGeom.setIndex(new BufferAttribute(indices, 1));
  //   bufferGeom.addAttribute('position', new BufferAttribute(vertices, 3));

  //   return bufferGeom;
  // }

  isEqual(x1, y1, z1, x2, y2, z2) {
    const delta = 0.000001;

    return Math.abs(x2 - x1) < delta
      && Math.abs(y2 - y1) < delta
      && Math.abs(z2 - z1) < delta;
  }

  // appendAnchor(world, object, node, influence, collisionBetweenLinkedBodies = true) {
  //   const o1 = this._physijs.id;
  //   const o2 = object._physijs.id;

  //   world.execute('appendAnchor', {
  //     obj: o1,
  //     obj2: o2,
  //     node,
  //     influence,
  //     collisionBetweenLinkedBodies
  //   });
  // }

  integrate(params) {
    this._physijs = {
      type: 'softTrimesh',
      mass: params.mass,
      touches: [],
      friction: params.friction,
      damping: params.damping,
      pressure: params.pressure,
      margin: params.margin,
      klst: params.klst,
      kast: params.kast,
      kvst: params.kvst,
      drag: params.drag,
      lift: params.lift,
      piterations: params.piterations,
      viterations: params.viterations,
      diterations: params.diterations,
      citerations: params.citerations,
      anchorHardness: params.anchorHardness,
      rigidHardness: params.rigidHardness
    };

    wrapPhysicsPrototype(this);
  }

  bridge = {
    geometry(geometry, self) {
      const idxGeometry = geometry instanceof BufferGeometry
        ? geometry
        : (() => {
          geometry.mergeVertices();

          // console.log(geometry.faces.length);

          const bufferGeometry = new BufferGeometry();

          bufferGeometry.addAttribute(
            'position',
            new BufferAttribute(
              new Float32Array(geometry.vertices.length * 3), 
              3
            ).copyVector3sArray(geometry.vertices)
          );

          bufferGeometry.setIndex(
            new BufferAttribute(
              new Uint16Array(geometry.faces.length * 3), 
              1
            ).copyIndicesArray(geometry.faces)
          );

          // console.log(bufferGeometry.attributes.position.array.length / 3);

          return bufferGeometry;
        })();

      // console.log(idxGeometry.index.array.length);

      const aVertices = idxGeometry.attributes.position.array;
      const aIndices = idxGeometry.index.array;

      this._physijs.aVertices = aVertices;
      this._physijs.aIndices = aIndices;

      const ndxGeometry = new BufferGeometry().fromGeometry(geometry);

      // console.log(ndxGeometry.attributes.position.array.length / 3);

      return ndxGeometry;
    }
  }
}
