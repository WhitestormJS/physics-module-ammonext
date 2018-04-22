import {BufferGeometry, BufferAttribute} from 'three';
import PhysicsModule from './core/PhysicsModule';

function arrayMax(array) {
	if (array.length === 0) return - Infinity;

	var max = array[0];

	for (let i = 1, l = array.length; i < l; ++ i ) {
		if (array[ i ] > max) max = array[i];
	}

	return max;
}

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

					const faces = geometry.faces, facesLength = faces.length, uvs = geometry.faceVertexUvs[0];

          const normalsArray = new Float32Array(facesLength * 3);
          // const uvsArray = new Array(geometry.vertices.length * 2);
          const uvsArray = new Float32Array(facesLength * 2);
          const uvsReplacedArray = new Float32Array(facesLength * 6);
					const faceArray = new Uint32Array(facesLength * 3);

          for (let i = 0; i < facesLength; i++) {
            const i3 = i * 3;
            const i6 = i * 6;
            const normal = faces[i].normal || new Vector3();

						faceArray[i3] = faces[i].a;
            faceArray[i3 + 1] = faces[i].b;
            faceArray[i3 + 2] = faces[i].c;

            normalsArray[i3] = normal.x;
            normalsArray[i3 + 1] = normal.y;
            normalsArray[i3 + 2] = normal.z;

            uvsArray[faces[i].a * 2 + 0] = uvs[i][0].x; // a
            uvsArray[faces[i].a * 2 + 1] = uvs[i][0].y;

            uvsArray[faces[i].b * 2 + 0] = uvs[i][1].x; // b
            uvsArray[faces[i].b * 2 + 1] = uvs[i][1].y;

            uvsArray[faces[i].c * 2 + 0] = uvs[i][2].x; // c
            uvsArray[faces[i].c * 2 + 1] = uvs[i][2].y;
          }

          bufferGeometry.addAttribute(
            'normal',
            new BufferAttribute(
              normalsArray,
              3
            )
          );

          bufferGeometry.addAttribute(
            'uv',
            new BufferAttribute(
              uvsArray,
              2
            )
          );

					bufferGeometry.setIndex(
            new BufferAttribute(
              new (arrayMax(faces) * 3 > 65535 ? Uint32Array : Uint16Array)(facesLength * 3),
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

	linkNodes(object, n1, n2, modifier) {
    const self = this.data.id;
    const body = object.use('physics').data.id;

    this.execute('linkNodes', {
      self,
			body,
      n1, // self node
      n2, // body node
			modifier
    });
  }

  appendLinearJoint(object, specs) {
    const self = this.data.id;
    const body = object.use('physics').data.id;

    this.execute('appendLinearJoint', {
      self,
      body,
      specs
    });
  }
}
