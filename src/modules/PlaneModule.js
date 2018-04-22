import PhysicsModule from './core/PhysicsModule';

export class PlaneModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'plane',
      ...PhysicsModule.rigidbody()
    }, params);

    this.updateData((geometry, {data}) => {
      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.normal = data.normal || geometry.faces[0].normal.clone();
    });
  }
}
