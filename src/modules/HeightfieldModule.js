import PhysicsModule from './core/PhysicsModule';
import {Vector3, Vector2, BufferGeometry} from 'three';

export class HeightfieldModule extends PhysicsModule {
  constructor(params) {
    super({
      type: 'heightfield',
      size: new Vector2(1, 1),
      autoAlign: false,
      ...PhysicsModule.rigidbody()
    }, params);

    this.updateData((geometry, {data}) => {
      const {x: xdiv, y: ydiv} = data.size;
      const verts = geometry.isBufferGeometry ? geometry.attributes.position.array : geometry.vertices;
      let size = geometry.isBufferGeometry ? verts.length / 3 : verts.length;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      const xsize = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      const ysize = geometry.boundingBox.max.z - geometry.boundingBox.min.z;

      data.xpts = (typeof xdiv === 'undefined') ? Math.sqrt(size) : xdiv + 1;
      data.ypts = (typeof ydiv === 'undefined') ? Math.sqrt(size) : ydiv + 1;

      // note - this assumes our plane geometry is square, unless we pass in specific xdiv and ydiv
      data.absMaxHeight = Math.max(geometry.boundingBox.max.y, Math.abs(geometry.boundingBox.min.y));

      const points = new Float32Array(size),
        xpts = data.xpts,
        ypts = data.ypts;

      while (size--) {
        const vNum = size % xpts + ((ypts - Math.round((size / xpts) - ((size % xpts) / xpts)) - 1) * ypts);

        if (geometry.isBufferGeometry) points[size] = verts[vNum * 3 + 1];
        else points[size] = verts[vNum].y;
      }

      data.points = points;

      data.scale.multiply(
        new Vector3(xsize / (xpts - 1), 1, ysize / (ypts - 1))
      );

      if (data.autoAlign) geometry.translate(xsize / -2, 0, ysize / -2);
    });
  }
}
