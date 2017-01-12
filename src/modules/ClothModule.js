import {Mesh} from '../core/mesh';
import {Vector3, BufferGeometry, BufferAttribute} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class ClothModule {
  constructor(params = {}) {
    this.params = Object.assign({
      friction: 0.8,
      damping: 0,
      margin: 0,
      klst: 0.9,
      kvst: 0.9,
      kast: 0.9,
      piterations: 1,
      viterations: 0,
      diterations: 0,
      citerations: 4,
      anchorHardness: 0.7,
      rigidHardness: 1
    }, params);
  }

  // appendAnchor(world, object, node, influence, collisionBetweenLinkedBodies = true) {
  //   const o1 = this._physijs.id;
  //   const o2 = object._physijs.id;
  //
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
      type: 'softClothMesh',
      mass: params.mass,
      touches: [],
      isSoftbody: true,
      friction: params.friction,
      damping: params.damping,
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
      rigidHardness: params.rigidHardness,
      scale: params.scale
    };

    wrapPhysicsPrototype(this);
  }

  bridge = {
    geometry(geometry, self) {
      const geomParams = geometry.parameters;

      const geom = geometry instanceof BufferGeometry
        ? geometry
          : (() => {
          geometry.mergeVertices();

          const bufferGeometry = new BufferGeometry();

          bufferGeometry.addAttribute(
            'position',
            new BufferAttribute(
              new Float32Array(geometry.vertices.length * 3),
              3
            ).copyVector3sArray(geometry.vertices)
          );

          const faces = geometry.faces, facesLength = faces.length;
          const normalsArray = new Float32Array(facesLength * 3);

          for (let i = 0; i < facesLength; i++) {
            const i3 = i * 3;
            const normal = faces[i].normal || new Vector3();

            normalsArray[i3] = normal.x;
            normalsArray[i3 + 1] = normal.y;
            normalsArray[i3 + 2] = normal.z;
          }

          bufferGeometry.addAttribute(
            'normal',
            new BufferAttribute(
              normalsArray,
              3
            )
          );

          bufferGeometry.setIndex(
            new BufferAttribute(
              new (facesLength * 3 > 65535 ? Uint32Array : Uint16Array)(facesLength * 3),
              1
            ).copyIndicesArray(faces)
          );

          return bufferGeometry;
        })();

      const verts = geom.attributes.position.array;

      if (!geomParams.widthSegments) geomParams.widthSegments = 1;
      if (!geomParams.heightSegments) geomParams.heightSegments = 1;

      const idx00 = 0;
      const idx01 = geomParams.widthSegments;
      const idx10 = (geomParams.heightSegments + 1) * (geomParams.widthSegments + 1) - (geomParams.widthSegments + 1);
      const idx11 = verts.length / 3 - 1;

      this._physijs.corners = [
        verts[idx01 * 3], verts[idx01 * 3 + 1], verts[idx01 * 3 + 2], //   ╗
        verts[idx00 * 3], verts[idx00 * 3 + 1], verts[idx00 * 3 + 2], // ╔
        verts[idx11 * 3], verts[idx11 * 3 + 1], verts[idx11 * 3 + 2], //       ╝
        verts[idx10 * 3], verts[idx10 * 3 + 1], verts[idx10 * 3 + 2], //     ╚
      ];

      this._physijs.segments = [geomParams.widthSegments + 1, geomParams.heightSegments + 1];

      return geom;
    },
    onCopy,
    onWrap
  }
};
