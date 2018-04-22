import PhysicsModule from './core/PhysicsModule';

export class CylinderModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'cylinder',
      ...PhysicsModule.rigidbody()
    }, params);

    this.updateData((geometry, {data}) => {
      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = data.depth || geometry.boundingBox.max.z - geometry.boundingBox.min.z;
    });
  }
}
