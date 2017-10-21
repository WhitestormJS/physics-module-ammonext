import PhysicsModule from './core/PhysicsModule';

export class ConcaveModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'concave',
      ...PhysicsModule.rigidbody()
    }, params);

    this.updateData((geometry, {data}) => {
      data.data = this.geometryProcessor(geometry);
    });
  }

  geometryProcessor(geometry) {
    if (!geometry.boundingBox) geometry.computeBoundingBox();

    const data = geometry.isBufferGeometry ?
      geometry.attributes.position.array :
      new Float32Array(geometry.faces.length * 9);

    if (!geometry.isBufferGeometry) {
      const vertices = geometry.vertices;

      for (let i = 0; i < geometry.faces.length; i++) {
        const face = geometry.faces[i];

        const vA = vertices[face.a];
        const vB = vertices[face.b];
        const vC = vertices[face.c];

        const i9 = i * 9;

        data[i9] = vA.x;
        data[i9 + 1] = vA.y;
        data[i9 + 2] = vA.z;

        data[i9 + 3] = vB.x;
        data[i9 + 4] = vB.y;
        data[i9 + 5] = vB.z;

        data[i9 + 6] = vC.x;
        data[i9 + 7] = vC.y;
        data[i9 + 8] = vC.z;
      }
    }

    return data;
  };
}
