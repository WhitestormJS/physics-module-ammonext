import {BufferGeometry} from 'three';
import PhysicsModule from './core/PhysicsModule';

export class ConvexModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'convex',
      ...PhysicsModule.rigidbody()
    }, params);

    this.updateData((geometry, {data}) => {
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (!geometry.isBufferGeometry) geometry._bufferGeometry = new BufferGeometry().fromGeometry(geometry);

      data.data = geometry.isBufferGeometry ?
        geometry.attributes.position.array :
        geometry._bufferGeometry.attributes.position.array;
    });
  }
}
