// import {Vector3} from 'three';
// import {wrapPhysicsPrototype} from './physicsPrototype';
//
// export class ConcaveMesh extends Mesh {
//   constructor(geom, material, params = {}, physicsReplacementGeometry) {
//     const physParams = params.physics;
//     const mass = physParams.mass || params.mass;
//     super(geom, material, mass, physParams);
//
//     const geometry = physicsReplacementGeometry ? physicsReplacementGeometry : geom;
//
//     const isBuffer = geometry.type === 'BufferGeometry';
//
//     if (!geometry.boundingBox) geometry.computeBoundingBox();
//
//     const data = isBuffer ?
//       geometry.attributes.position.array :
//       new Float32Array(geometry.faces.length * 9);
//
//     if (params.scale) geometry.scale(
//       params.scale.x,
//       params.scale.y,
//       params.scale.z
//     );
//
//     const vertices = geometry.vertices;
//
//     if (!isBuffer) {
//       for (let i = 0; i < geometry.faces.length; i++) {
//         const face = geometry.faces[i];
//
//         data[i * 9] = vertices[face.a].x;
//         data[i * 9 + 1] = vertices[face.a].y;
//         data[i * 9 + 2] = vertices[face.a].z;
//
//         data[i * 9 + 3] = vertices[face.b].x;
//         data[i * 9 + 4] = vertices[face.b].y;
//         data[i * 9 + 5] = vertices[face.b].z;
//
//         data[i * 9 + 6] = vertices[face.c].x;
//         data[i * 9 + 7] = vertices[face.c].y;
//         data[i * 9 + 8] = vertices[face.c].z;
//       }
//     }
//
//     const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
//     const height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
//     const depth = geometry.boundingBox.max.z - geometry.boundingBox.min.z;
//
//
//   }
// }
//
// export class ConvexModule {
//   constructor(params) {
//     this.params = Object.assign({
//       mass: 10,
//       restitution: 0.3,
//       friction: 0.8,
//       damping: 0,
//       margin: 0
//     }, params);
//   }
//
//   integrate(params) {
//     this._physijs = {
//       type: 'concave',
//       mass: params.mass,
//       touches: [],
//       linearVelocity: new Vector3(),
//       angularVelocity: new Vector3(),
//       group: params.group,
//       mask: params.mask,
//       friction: params.friction,
//       restitution: params.restitution,
//       damping: params.damping,
//       margin: params.margin
//     };
//
//     wrapPhysicsPrototype(this);
//   }
//
//   bridge = {
//     geometry(geometry) {
//       if (!geometry.boundingBox) geometry.computeBoundingBox();
//
//       const isBuffer = geometry.type === 'BufferGeometry';
//
//       const data = isBuffer ?
//         geometry.attributes.position.array :
//         new Float32Array(geometry.vertices.length * 3);
//
//       if(!isBuffer) {
//         for (let i = 0; i < geometry.vertices.length; i++) {
//           data[i * 3] = geometry.vertices[i].x;
//           data[i * 3 + 1] = geometry.vertices[i].y;
//           data[i * 3 + 2] = geometry.vertices[i].z;
//         }
//       }
//
//       this._physijs.data = data;
//
//       return geometry;
//     }
//   }
//
// }
//
