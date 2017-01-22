import {Vector2, Vector3, BufferGeometry} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class HeightfieldModule {
  constructor(params) {
    this.params = Object.assign({
      mass: 10,
      scale: new Vector3(1, 1, 1),
      size: new Vector2(1, 1),
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0,
      autoAlign: false
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
    geometry(geometry, self) {
      const isBuffer = geometry instanceof BufferGeometry;
      const verts = isBuffer ? geometry.attributes.position.array : geometry.vertices;

      let size = isBuffer ? verts.length / 3 : verts.length;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      const xdiv = self.params.size.x;
      const ydiv = self.params.size.y;

      const xsize = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      const ysize = geometry.boundingBox.max.z - geometry.boundingBox.min.z;
      
      this._physijs.xpts = (typeof xdiv === 'undefined') ? Math.sqrt(size) : xdiv + 1;
      this._physijs.ypts = (typeof ydiv === 'undefined') ? Math.sqrt(size) : ydiv + 1;

      // note - this assumes our plane geometry is square, unless we pass in specific xdiv and ydiv
      this._physijs.absMaxHeight = Math.max(geometry.boundingBox.max.y, Math.abs(geometry.boundingBox.min.y));

      const points = new Float32Array(size),
        xpts = this._physijs.xpts,
        ypts = this._physijs.ypts;

      while (size--) {
        const vNum = size % xpts + ((ypts - Math.round((size / xpts) - ((size % xpts) / xpts)) - 1) * ypts);

        if (isBuffer) points[size] = verts[vNum * 3 + 1];
        else points[size] = verts[vNum].y;
      }

      this._physijs.points = points;

      this._physijs.scale.multiply(
        new THREE.Vector3(xsize / (xpts - 1), 1, ysize / (ypts - 1))
      );

      if (self.params.autoAlign) geometry.translate(xsize / -2, 0, ysize / -2);

      return geometry;
    },

    onCopy,
    onWrap
  };
}
