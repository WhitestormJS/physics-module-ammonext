import {Vector3, BufferGeometry} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class HeightfieldModule {
  constructor(params) {
    this.params = Object.assign({
      mass: 10,
      scale: new Vector3(1, 1, 1),
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0
    }, params);
  }

  integrate(params) {
    this._physijs = {
      type: 'heightfield',
      friction: params.friction,
      touches: [],
      scale: params.scale,
      restitution: params.restitution,
      damping: params.damping,
      margin: params.margin,
      points: params.points,
      mass: params.mass,
      linearVelocity: new Vector3(),
      angularVelocity: new Vector3(),
      group: params.group,
      mask: params.mask,
    };

    wrapPhysicsPrototype(this);
  }

  bridge = {
    geometry(geometry) {
      const isBuffer = geometry instanceof BufferGeometry;
      const verts = isBuffer ? geometry.attributes.position.array : geometry.vertices;

      let size = isBuffer ? verts.length / 3 : verts.length;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      this._physijs.xsize = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      this._physijs.ysize = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      this._physijs.xpts = (typeof xdiv === 'undefined') ? Math.sqrt(size) : xdiv + 1;
      this._physijs.ypts = (typeof ydiv === 'undefined') ? Math.sqrt(size) : ydiv + 1;

      // note - this assumes our plane geometry is square, unless we pass in specific xdiv and ydiv
      this._physijs.absMaxHeight = Math.max(geometry.boundingBox.max.z, Math.abs(geometry.boundingBox.min.z));

      const points = new Float32Array(size),
        xpts = this._physijs.xpts,
        ypts = this._physijs.ypts;

      while (size--) {
        const vNum = size % xpts + ((ypts - Math.round((size / xpts) - ((size % xpts) / xpts)) - 1) * ypts);

        if (isBuffer) points[size] = verts[vNum * 3 + 2];
        else points[size] = verts[vNum].z;
      }

      this._physijs.points = points;

      return geometry;
    },

    onCopy,
    onWrap
  };
}
