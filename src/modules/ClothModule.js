import {BufferGeometry, BufferAttribute} from 'three';
import PhysicsModule from './core/PhysicsModule';

export class ClothModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'softClothMesh',
      ...PhysicsModule.cloth()
    }, params);

    this.updateData((geometry, {data}) => {
      const geomParams = geometry.parameters;

      const geom = geometry.isBufferGeometry
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

      data.corners = [
        verts[idx01 * 3], verts[idx01 * 3 + 1], verts[idx01 * 3 + 2], //   ╗
        verts[idx00 * 3], verts[idx00 * 3 + 1], verts[idx00 * 3 + 2], // ╔
        verts[idx11 * 3], verts[idx11 * 3 + 1], verts[idx11 * 3 + 2], //       ╝
        verts[idx10 * 3], verts[idx10 * 3 + 1], verts[idx10 * 3 + 2], //     ╚
      ];

      data.segments = [geomParams.widthSegments + 1, geomParams.heightSegments + 1];

      return geom;
    });
  }

  appendAnchor(object, node, influence, collisionBetweenLinkedBodies = true) {
    const o1 = this.data.id;
    const o2 = object.use('physics').data.id;

    this.execute('appendAnchor', {
      obj: o1,
      obj2: o2,
      node,
      influence,
      collisionBetweenLinkedBodies
    });
  }
}
