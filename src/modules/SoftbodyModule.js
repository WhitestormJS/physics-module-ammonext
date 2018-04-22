import {BufferGeometry, BufferAttribute} from 'three';
import PhysicsModule from './core/PhysicsModule';

export class SoftbodyModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'softTrimesh',
      ...PhysicsModule.softbody()
    }, params);

    this.updateData((geometry, {data}) => {
      const idxGeometry = geometry.isBufferGeometry
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

          bufferGeometry.setIndex(
            new BufferAttribute(
              new (geometry.faces.length * 3 > 65535 ? Uint32Array : Uint16Array)(geometry.faces.length * 3),
              1
            ).copyIndicesArray(geometry.faces)
          );

          return bufferGeometry;
        })();

      data.aVertices = idxGeometry.attributes.position.array;
      data.aIndices = idxGeometry.index.array;

      return new BufferGeometry().fromGeometry(geometry);
    });
  }

  appendAnchor(object, node, influence = 1, collisionBetweenLinkedBodies = true) {
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
