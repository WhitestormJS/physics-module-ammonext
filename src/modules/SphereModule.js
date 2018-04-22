import PhysicsModule from './core/PhysicsModule';

export class SphereModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'sphere',
      ...PhysicsModule.rigidbody()
    }, params);

    this.updateData((geometry, {data}) => {
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      data.radius = data.radius || geometry.boundingSphere.radius;
    });
  }
}
