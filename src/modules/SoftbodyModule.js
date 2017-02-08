import {Vector3, BufferGeometry, BufferAttribute} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class SoftbodyModule{
  constructor(params) {
    this.params = Object.assign({
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      scale: new Vector3(1, 1, 1),
      pressure: 100,
      margin: 0,
      klst: 0.9,
      kvst: 0.9,
      kast: 0.9,
      piterations: 1,
      viterations: 0,
      diterations: 0,
      citerations: 4,
      anchorHardness: 0.7,
      rigidHardness: 1
    }, params);
  }

  appendAnchor(object, node, influence, collisionBetweenLinkedBodies = true) {
    const o1 = this._physijs.id;
    const o2 = object._physijs.id;

    if (this.manager.has('module:world')) this.manager.get('module:world').execute('appendAnchor', {
      obj: o1,
      obj2: o2,
      node,
      influence,
      collisionBetweenLinkedBodies
    });
  }

  integrate(self) {
    const params = self.params;

    this._physijs = {
      type: 'softTrimesh',
      mass: params.mass,
      scale: params.scale,
      touches: [],
      friction: params.friction,
      damping: params.damping,
      pressure: params.pressure,
      margin: params.margin,
      klst: params.klst,
      isSoftbody: true,
      kast: params.kast,
      kvst: params.kvst,
      drag: params.drag,
      lift: params.lift,
      piterations: params.piterations,
      viterations: params.viterations,
      diterations: params.diterations,
      citerations: params.citerations,
      anchorHardness: params.anchorHardness,
      rigidHardness: params.rigidHardness
    };

    this.appendAnchor = self.appendAnchor.bind(this);

    wrapPhysicsPrototype(this);
  }

  bridge = {
    geometry(geometry, self) {
      const idxGeometry = geometry instanceof BufferGeometry
        ? geometry
        : (() => {
          geometry.mergeVertices();

          const bufferGeometry = new BufferGeometry();

          bufferGeometry.addAttribute(
            'position',
            new BufferAttribute(
              new Float32Array(geometry.vertices.length * 3),
              3
            ).copyVector3sArray(geometry.vertices)
          );

          bufferGeometry.setIndex(
            new BufferAttribute(
              new (geometry.faces.length * 3 > 65535 ? Uint32Array : Uint16Array)(geometry.faces.length * 3),
              1
            ).copyIndicesArray(geometry.faces)
          );

          return bufferGeometry;
        })();

      const aVertices = idxGeometry.attributes.position.array;
      const aIndices = idxGeometry.index.array;

      this._physijs.aVertices = aVertices;
      this._physijs.aIndices = aIndices;

      const ndxGeometry = new BufferGeometry().fromGeometry(geometry);

      return ndxGeometry;
    },

    onCopy,
    onWrap
  }
}
