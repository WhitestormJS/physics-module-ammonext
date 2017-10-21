import {BufferGeometry, BufferAttribute, Vector3} from 'three';
import PhysicsModule from './core/PhysicsModule';

export class RopeModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'softRopeMesh',
      ...PhysicsModule.rope()
    }, params);

    this.updateData((geometry, {data}) => {
      if (!geometry.isBufferGeometry) {
        geometry = (() => {
          const buff = new BufferGeometry();

          buff.addAttribute(
            'position',
            new BufferAttribute(
              new Float32Array(geometry.vertices.length * 3),
              3
            ).copyVector3sArray(geometry.vertices)
          );

          return buff;
        })();
      }

      const length = geometry.attributes.position.array.length / 3;
      const vert = n => new Vector3().fromArray(geometry.attributes.position.array, n*3);

      const v1 = vert(0);
      const v2 = vert(length - 1);

      data.data = [
        v1.x, v1.y, v1.z,
        v2.x, v2.y, v2.z,
        length
      ];

      return geometry;
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
