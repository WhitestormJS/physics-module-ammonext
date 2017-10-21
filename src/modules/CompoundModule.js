import PhysicsModule from './core/PhysicsModule';

export class CompoundModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'compound',
      ...PhysicsModule.rigidbody()
    }, params);
  }
}
