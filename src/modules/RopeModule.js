import {Vector3, BufferGeometry, BufferAttribute} from 'three';
import {wrapPhysicsPrototype, onCopy, onWrap} from './physicsPrototype';

export class RopeModule {
  constructor(params) {
    this.params = Object.assign({
      friction: 0.8,
      damping: 0,
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
      type: 'softRopeMesh',
      mass: params.mass,
      touches: [],
      friction: params.friction,
      damping: params.damping,
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
    geometry(geometry) {
      if (!(geometry instanceof BufferGeometry)) {
        geometry = (() => {
          const buff = new BufferGeometry();

          buff.addAttribute(
            'position',
            new BufferAttribute(
              new Float32Array(geometry.vertices.length * 3),
              3
            ).copyVector3sArray(geometry.vertices)
          );

          return buff;
        })();
      }

      const length = geometry.attributes.position.array.length / 3;
      const vert = n => new Vector3().fromArray(geometry.attributes.position.array, n*3);

      const v1 = vert(0);
      const v2 = vert(length - 1);

      this._physijs.data = [
        v1.x, v1.y, v1.z,
        v2.x, v2.y, v2.z,
        length
      ];

      return geometry;
    },

    onCopy,
    onWrap
  }
}
