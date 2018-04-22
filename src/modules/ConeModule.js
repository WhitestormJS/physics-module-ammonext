import PhysicsModule from './core/PhysicsModule';

export class ConeModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'cone',
      ...PhysicsModule.rigidbody()
    }, params);

    this.updateData((geometry, {data}) => {
      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.radius = data.radius || (geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
    });
  }
}
