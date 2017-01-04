import {Vector3} from 'three';
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

  createIndexedBufferGeometryFromGeometry(geometry) {
    const numVertices = geometry.vertices.length;
    const numFaces = geometry.faces.length;
    const bufferGeom = new THREE.BufferGeometry();
    const vertices = new Float32Array(numVertices * 3);
    const indices = new (numFaces * 3 > 65535 ? Uint32Array : Uint16Array)(numFaces * 3);

    for (let i = 0; i < numVertices; i++) {
      const p = geometry.vertices[i];
      const i3 = i * 3;

      vertices[i3] = p.x;
      vertices[i3 + 1] = p.y;
      vertices[i3 + 2] = p.z;
    }

    for (let i = 0; i < numFaces; i++) {
      const f = geometry.faces[i];
      const i3 = i * 3;

      indices[i3] = f.a;
      indices[i3 + 1] = f.b;
      indices[i3 + 2] = f.c;
    }

    bufferGeom.setIndex(new THREE.BufferAttribute(indices, 1));
    bufferGeom.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

    return bufferGeom;
  }

  isEqual(x1, y1, z1, x2, y2, z2) {
    const delta = 0.000001;

    return Math.abs(x2 - x1) < delta
      && Math.abs(y2 - y1) < delta
      && Math.abs(z2 - z1) < delta;
  }

  appendAnchor(world, object, node, influence, collisionBetweenLinkedBodies = true) {
    const o1 = this._physijs.id;
    const o2 = object._physijs.id;

    world.execute('appendAnchor', {
      obj: o1,
      obj2: o2,
      node,
      influence,
      collisionBetweenLinkedBodies
    });
  }

  integrate(params) {
    this._physijs = {
      type: 'softTrimesh',
      aVertices: params.aVertices,
      aIndices: params.aIndices,
      aIdxAssoc: params.aIdxAssoc,
      mass: params.mass,
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
    geometry(geometry) {
      if (!(geometry instanceof THREE.BufferGeometry)) // Converts to BufferGeometry.
        geometry = new THREE.BufferGeometry().fromGeometry(geometry);

      // console.log(tempGeometry.mergeVertices);
      tempGeometry.mergeVertices();
      const idxGeometry = this.createIndexedBufferGeometryFromGeometry(tempGeometry);
      this.tempGeometry = tempGeometry;

      const aVertices = idxGeometry.attributes.position.array;
      const aIndices = idxGeometry.index.array;
      const aIdxAssoc = [];
      const vertices = geometry.attributes.position.array;

      const numIdxVertices = aVertices.length / 3;
      const numVertices = vertices.length / 3;

      for (let i = 0; i < numIdxVertices; i++) {
        const association = [];
        aIdxAssoc.push(association);

        const i3 = i * 3;

        for (let j = 0; j < numVertices; j++) {
          const j3 = j * 3;

          if (this.isEqual(aVertices[i3], aVertices[i3 + 1], aVertices[i3 + 2], vertices[j3], vertices[j3 + 1], vertices[j3 + 2]))
            association.push(j3);
        }
      }


      if (!geometry.boundingBox) geometry.computeBoundingBox();

      this._physijs.width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      this._physijs.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      this._physijs.normal = geometry.faces[0].normal.clone();

      return geometry;
    }
  }
}
