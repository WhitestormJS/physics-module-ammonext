import {
  Scene as SceneNative,
  Mesh,
  SphereGeometry,
  MeshNormalMaterial,
  BoxGeometry,
  Vector3
} from 'three';

import {Loop} from 'whs';

import {Vehicle} from '../../vehicle/vehicle';
import {Eventable} from '../../eventable';

import {
  addObjectChildren,
  MESSAGE_TYPES,
  temp1Vector3,
  temp1Matrix4,
  REPORT_ITEMSIZE,
  COLLISIONREPORT_ITEMSIZE,
  VEHICLEREPORT_ITEMSIZE,
  CONSTRAINTREPORT_ITEMSIZE
} from '../../api';

export default class WorldModuleBase extends Eventable {
  static defaults = {
    fixedTimeStep: 1/60,
    rateLimit: true,
    ammo: "",
    softbody: false,
    gravity: new Vector3(0, -100, 0)
  };

  constructor(options) {
    super();

    this.options = Object.assign(WorldModuleBase.defaults, options);

    this.objects = {};
    this.vehicles = {};
    this.constraints = {};
    this.isSimulating = false;

    this.getObjectId = (() => {
      let id = 1;
      return () => {
        return id++;
      };
    })();
  }

  setup() {
    this.receive(event => {
      let _temp,
        data = event.data;

      if (data instanceof ArrayBuffer && data.byteLength !== 1)// byteLength === 1 is the worker making a SUPPORT_TRANSFERABLE test
        data = new Float32Array(data);

      if (data instanceof Float32Array) {
        // transferable object
        switch (data[0]) {
          case MESSAGE_TYPES.WORLDREPORT:
            this.updateScene(data);
            break;

          case MESSAGE_TYPES.SOFTREPORT:
            this.updateSoftbodies(data);
            break;

          case MESSAGE_TYPES.COLLISIONREPORT:
            this.updateCollisions(data);
            break;

          case MESSAGE_TYPES.VEHICLEREPORT:
            this.updateVehicles(data);
            break;

          case MESSAGE_TYPES.CONSTRAINTREPORT:
            this.updateConstraints(data);
            break;
          default:
        }
      } else if (data.cmd) {
        // non-transferable object
        switch (data.cmd) {
          case 'objectReady':
            _temp = data.params;
            if (this.objects[_temp]) this.objects[_temp].dispatchEvent('ready');
            break;

          case 'worldReady':
            this.dispatchEvent('ready');
            break;

          case 'ammoLoaded':
            this.dispatchEvent('loaded');
            // console.log("Physics loading time: " + (performance.now() - start) + "ms");
            break;

          case 'vehicle':
            window.test = data;
            break;

          default:
            // Do nothing, just show the message
            console.debug(`Received: ${data.cmd}`);
            console.dir(data.params);
            break;
        }
      } else {
        switch (data[0]) {
          case MESSAGE_TYPES.WORLDREPORT:
            this.updateScene(data);
            break;

          case MESSAGE_TYPES.COLLISIONREPORT:
            this.updateCollisions(data);
            break;

          case MESSAGE_TYPES.VEHICLEREPORT:
            this.updateVehicles(data);
            break;

          case MESSAGE_TYPES.CONSTRAINTREPORT:
            this.updateConstraints(data);
            break;
          default:
        }
      }
    });
  }

  updateScene(info) {
    let index = info[1];

    while (index--) {
      const offset = 2 + index * REPORT_ITEMSIZE;
      const object = this.objects[info[offset]];

      if (!object) continue;

      const component = object.component;
      const data = component.use('physics').data;


      if (component.__dirtyPosition === false) {
        object.position.set(
          info[offset + 1],
          info[offset + 2],
          info[offset + 3]
        );

        component.__dirtyPosition = false;
      }

      if (component.__dirtyRotation === false) {
        object.quaternion.set(
          info[offset + 4],
          info[offset + 5],
          info[offset + 6],
          info[offset + 7]
        );

        component.__dirtyRotation = false;
      }

      data.linearVelocity.set(
        info[offset + 8],
        info[offset + 9],
        info[offset + 10]
      );

      data.angularVelocity.set(
        info[offset + 11],
        info[offset + 12],
        info[offset + 13]
      );
    }

    if (this.SUPPORT_TRANSFERABLE)
      this.send(info.buffer, [info.buffer]); // Give the typed array back to the worker

    this.isSimulating = false;
    this.dispatchEvent('update');
  }

  updateSoftbodies(info) {
    let index = info[1],
      offset = 2;

    while (index--) {
      const size = info[offset + 1];
      const object = this.objects[info[offset]];

      if (!object) continue;

      const data = object.component.use('physics').data;

      const attributes = object.geometry.attributes;
      const volumePositions = attributes.position.array;

      const offsetVert = offset + 2;

      // console.log(data.id);
      if (!data.isSoftBodyReset) {
        object.position.set(0, 0, 0);
        object.quaternion.set(0, 0, 0, 0);

        data.isSoftBodyReset = true;
      }

      if (data.type === "softTrimesh") {
        const volumeNormals = attributes.normal.array;

        for (let i = 0; i < size; i++) {
          const offs = offsetVert + i * 18;

          const x1 = info[offs];
          const y1 = info[offs + 1];
          const z1 = info[offs + 2];

          const nx1 = info[offs + 3];
          const ny1 = info[offs + 4];
          const nz1 = info[offs + 5];

          const x2 = info[offs + 6];
          const y2 = info[offs + 7];
          const z2 = info[offs + 8];

          const nx2 = info[offs + 9];
          const ny2 = info[offs + 10];
          const nz2 = info[offs + 11];

          const x3 = info[offs + 12];
          const y3 = info[offs + 13];
          const z3 = info[offs + 14];

          const nx3 = info[offs + 15];
          const ny3 = info[offs + 16];
          const nz3 = info[offs + 17];

          const i9 = i * 9;

          volumePositions[i9] = x1;
          volumePositions[i9 + 1] = y1;
          volumePositions[i9 + 2] = z1;

          volumePositions[i9 + 3] = x2;
          volumePositions[i9 + 4] = y2;
          volumePositions[i9 + 5] = z2;

          volumePositions[i9 + 6] = x3;
          volumePositions[i9 + 7] = y3;
          volumePositions[i9 + 8] = z3;

          volumeNormals[i9] = nx1;
          volumeNormals[i9 + 1] = ny1;
          volumeNormals[i9 + 2] = nz1;

          volumeNormals[i9 + 3] = nx2;
          volumeNormals[i9 + 4] = ny2;
          volumeNormals[i9 + 5] = nz2;

          volumeNormals[i9 + 6] = nx3;
          volumeNormals[i9 + 7] = ny3;
          volumeNormals[i9 + 8] = nz3;
        }

        attributes.normal.needsUpdate = true;
        offset += 2 + size * 18;
      }
      else if (data.type === "softRopeMesh") {
        for (let i = 0; i < size; i++) {
          const offs = offsetVert + i * 3;

          const x = info[offs];
          const y = info[offs + 1];
          const z = info[offs + 2];

          volumePositions[i * 3] = x;
          volumePositions[i * 3 + 1] = y;
          volumePositions[i * 3 + 2] = z;
        }

        offset += 2 + size * 3;
      } else {
        const volumeNormals = attributes.normal.array;

        for (let i = 0; i < size; i++) {
          const offs = offsetVert + i * 6;

          const x = info[offs];
          const y = info[offs + 1];
          const z = info[offs + 2];

          const nx = info[offs + 3];
          const ny = info[offs + 4];
          const nz = info[offs + 5];

          volumePositions[i * 3] = x;
          volumePositions[i * 3 + 1] = y;
          volumePositions[i * 3 + 2] = z;

          // FIXME: Normals are pointed to look inside;
          volumeNormals[i * 3] = nx;
          volumeNormals[i * 3 + 1] = ny;
          volumeNormals[i * 3 + 2] = nz;
        }

        attributes.normal.needsUpdate = true;
        offset += 2 + size * 6;
      }

      attributes.position.needsUpdate = true;
    }

    // if (this.SUPPORT_TRANSFERABLE)
    //   this.send(info.buffer, [info.buffer]); // Give the typed array back to the worker

    this.isSimulating = false;
  }

  updateVehicles(data) {
    let vehicle, wheel;

    for (let i = 0; i < (data.length - 1) / VEHICLEREPORT_ITEMSIZE; i++) {
      const offset = 1 + i * VEHICLEREPORT_ITEMSIZE;
      vehicle = this.vehicles[data[offset]];

      if (vehicle === null) continue;

      wheel = vehicle.wheels[data[offset + 1]];

      wheel.position.set(
        data[offset + 2],
        data[offset + 3],
        data[offset + 4]
      );

      wheel.quaternion.set(
        data[offset + 5],
        data[offset + 6],
        data[offset + 7],
        data[offset + 8]
      );
    }

    if (this.SUPPORT_TRANSFERABLE)
      this.send(data.buffer, [data.buffer]); // Give the typed array back to the worker
  }

  updateConstraints(data) {
    let constraint, object;

    for (let i = 0; i < (data.length - 1) / CONSTRAINTREPORT_ITEMSIZE; i++) {
      const offset = 1 + i * CONSTRAINTREPORT_ITEMSIZE;
      constraint = this.constraints[data[offset]];
      object = this.objects[data[offset + 1]];

      if (constraint === undefined || object === undefined) continue;

      temp1Vector3.set(
        data[offset + 2],
        data[offset + 3],
        data[offset + 4]
      );

      temp1Matrix4.extractRotation(object.matrix);
      temp1Vector3.applyMatrix4(temp1Matrix4);

      constraint.positiona.addVectors(object.position, temp1Vector3);
      constraint.appliedImpulse = data[offset + 5];
    }

    if (this.SUPPORT_TRANSFERABLE)
      this.send(data.buffer, [data.buffer]); // Give the typed array back to the worker
  }

  updateCollisions(info) {
    /**
     * #TODO
     * This is probably the worst way ever to handle collisions. The inherent evilness is a residual
     * effect from the previous version's evilness which mutated when switching to transferable objects.
     *
     * If you feel inclined to make this better, please do so.
     */

    const collisions = {},
      normal_offsets = {};

    // Build collision manifest
    for (let i = 0; i < info[1]; i++) {
      const offset = 2 + i * COLLISIONREPORT_ITEMSIZE;
      const object = info[offset];
      const object2 = info[offset + 1];

      normal_offsets[`${object}-${object2}`] = offset + 2;
      normal_offsets[`${object2}-${object}`] = -1 * (offset + 2);

      // Register collisions for both the object colliding and the object being collided with
      if (!collisions[object]) collisions[object] = [];
      collisions[object].push(object2);

      if (!collisions[object2]) collisions[object2] = [];
      collisions[object2].push(object);
    }

    // Deal with collisions
    for (const id1 in this.objects) {
      if (!this.objects.hasOwnProperty(id1)) continue;
      const object = this.objects[id1];
      const component = object.component;
      const data = component.use('physics').data;

      // If object touches anything, ...
      if (collisions[id1]) {
        // Clean up touches array
        for (let j = 0; j < data.touches.length; j++) {
          if (collisions[id1].indexOf(data.touches[j]) === -1)
            data.touches.splice(j--, 1);
        }

        // Handle each colliding object
        for (let j = 0; j < collisions[id1].length; j++) {
          const id2 = collisions[id1][j];
          const object2 = this.objects[id2];

          if (object2) {
            const component2 = object2.component;
            const data2 = component2.use('physics').data;
            // If object was not already touching object2, notify object
            if (data.touches.indexOf(id2) === -1) {
              data.touches.push(id2);

              const vel = component.use('physics').getLinearVelocity();
              const vel2 = component2.use('physics').getLinearVelocity();

              temp1Vector3.subVectors(vel, vel2);
              const temp1 = temp1Vector3.clone();

              temp1Vector3.subVectors(vel, vel2);
              const temp2 = temp1Vector3.clone();

              let normal_offset = normal_offsets[`${data.id}-${data2.id}`];

              if (normal_offset > 0) {
                temp1Vector3.set(
                  -info[normal_offset],
                  -info[normal_offset + 1],
                  -info[normal_offset + 2]
                );
              } else {
                normal_offset *= -1;

                temp1Vector3.set(
                  info[normal_offset],
                  info[normal_offset + 1],
                  info[normal_offset + 2]
                );
              }

              component.emit('collision', object2, temp1, temp2, temp1Vector3);
            }
          }
        }
      } else data.touches.length = 0; // not touching other objects
    }

    this.collisions = collisions;

    if (this.SUPPORT_TRANSFERABLE)
      this.send(info.buffer, [info.buffer]); // Give the typed array back to the worker
  }

  addConstraint(constraint, show_marker) {
    constraint.id = this.getObjectId();
    this.constraints[constraint.id] = constraint;
    constraint.worldModule = this;
    this.execute('addConstraint', constraint.getDefinition());

    if (show_marker) {
      let marker;

      switch (constraint.type) {
        case 'point':
          marker = new Mesh(
            new SphereGeometry(1.5),
            new MeshNormalMaterial()
          );

          marker.position.copy(constraint.positiona);
          this.objects[constraint.objecta].add(marker);
          break;

        case 'hinge':
          marker = new Mesh(
            new SphereGeometry(1.5),
            new MeshNormalMaterial()
          );

          marker.position.copy(constraint.positiona);
          this.objects[constraint.objecta].add(marker);
          break;

        case 'slider':
          marker = new Mesh(
            new BoxGeometry(10, 1, 1),
            new MeshNormalMaterial()
          );

          marker.position.copy(constraint.positiona);

          // This rotation isn't right if all three axis are non-0 values
          // TODO: change marker's rotation order to ZYX
          marker.rotation.set(
            constraint.axis.y, // yes, y and
            constraint.axis.x, // x axis are swapped
            constraint.axis.z
          );
          this.objects[constraint.objecta].add(marker);
          break;

        case 'conetwist':
          marker = new Mesh(
            new SphereGeometry(1.5),
            new MeshNormalMaterial()
          );

          marker.position.copy(constraint.positiona);
          this.objects[constraint.objecta].add(marker);
          break;

        case 'dof':
          marker = new Mesh(
            new SphereGeometry(1.5),
            new MeshNormalMaterial()
          );

          marker.position.copy(constraint.positiona);
          this.objects[constraint.objecta].add(marker);
          break;
        default:
      }
    }

    return constraint;
  }

  onSimulationResume() {
    this.execute('onSimulationResume', {});
  }

  removeConstraint(constraint) {
    if (this.constraints[constraint.id] !== undefined) {
      this.execute('removeConstraint', {id: constraint.id});
      delete this.constraints[constraint.id];
    }
  }

  execute(cmd, params) {
    this.send({cmd, params});
  }

  onAddCallback(component) {
    const object = component.native;
    const data = object.component.use('physics').data;

    if (data) {
      component.manager.set('module:world', this);
      data.id = this.getObjectId();
      object.component.use('physics').data = data;

      if (object instanceof Vehicle) {
        this.onAddCallback(object.mesh);
        this.vehicles[data.id] = object;
        this.execute('addVehicle', data);
      } else {
        component.__dirtyPosition = false;
        component.__dirtyRotation = false;
        this.objects[data.id] = object;

        if (object.children.length) {
          data.children = [];
          addObjectChildren(object, object);
        }

        // object.quaternion.setFromEuler(object.rotation);
        //
        // console.log(object.component);
        // console.log(object.rotation);

        // Object starting position + rotation
        data.position = {
          x: object.position.x,
          y: object.position.y,
          z: object.position.z
        };

        data.rotation = {
          x: object.quaternion.x,
          y: object.quaternion.y,
          z: object.quaternion.z,
          w: object.quaternion.w
        };

        if (data.width) data.width *= object.scale.x;
        if (data.height) data.height *= object.scale.y;
        if (data.depth) data.depth *= object.scale.z;

        this.execute('addObject', data);
      }

      component.emit('physics:added');
    }
  }

  onRemoveCallback(component) {
    const object = component.native;
    const physics = component.use('physics')
    const objectID = physics.data.id;

    if (object instanceof Vehicle) {
      this.execute('removeVehicle', {id: objectID});
      while (object.wheels.length) this.remove(object.wheels.pop());

      this.remove(object.mesh);
      delete this.vehicles[objectID];
    } else {
      // Mesh.prototype.remove.call(this, object);

      if (physics) {
        // component.manager.remove('module:world');
        this.execute('removeObject', {id: objectID});
        delete this.objects[objectID];
      }
    }
  }

  defer(func, args) {
    return new Promise((resolve) => {
      if (this.isLoaded) {
        func(...args);
        resolve();
      } else this.loader.then(() => {
        func(...args);
        resolve();
      });
    });
  }

  manager(manager) {
    manager.define('physics');
    manager.set('physicsWorker', this.worker);
  }

  bridge = {
    onAdd(component, self) {
      if (component.use('physics')) return self.defer(self.onAddCallback.bind(self), [component]);
      return;
    },

    onRemove(component, self) {
      if (component.use('physics')) return self.defer(self.onRemoveCallback.bind(self), [component]);
      return;
    }
  };

  integrate(self) {
    // ...

    this.setFixedTimeStep = function(fixedTimeStep) {
      if (fixedTimeStep) self.execute('setFixedTimeStep', fixedTimeStep);
    }

    this.setGravity = function(gravity) {
      if (gravity) self.execute('setGravity', gravity);
    }

    this.addConstraint = self.addConstraint.bind(self);

    this.simulate = function(timeStep, maxSubSteps) {
      if (self._stats) self._stats.begin();

      if (self.isSimulating) return false;
      self.isSimulating = true;

      for (const object_id in self.objects) {
        if (!self.objects.hasOwnProperty(object_id)) continue;

        const object = self.objects[object_id];
        const component = object.component;
        const data = component.use('physics').data;

        if (object !== null && (component.__dirtyPosition || component.__dirtyRotation)) {
          const update = {id: data.id};

          if (component.__dirtyPosition) {
            update.pos = {
              x: object.position.x,
              y: object.position.y,
              z: object.position.z
            };

            if (data.isSoftbody) object.position.set(0, 0, 0);

            component.__dirtyPosition = false;
          }

          if (component.__dirtyRotation) {
            update.quat = {
              x: object.quaternion.x,
              y: object.quaternion.y,
              z: object.quaternion.z,
              w: object.quaternion.w
            };

            if (data.isSoftbody) object.rotation.set(0, 0, 0);

            component.__dirtyRotation = false;
          }

          self.execute('updateTransform', update);
        }
      }

      self.execute('simulate', {timeStep, maxSubSteps});

      if (self._stats) self._stats.end();
      return true;
    }

    // const simulateProcess = (t) => {
    //   window.requestAnimationFrame(simulateProcess);

    //   this.simulate(1/60, 1); // delta, 1
    // }

    // simulateProcess();

    self.loader.then(() => {
      self.simulateLoop = new Loop((clock) => {
        this.simulate(clock.getDelta(), 1); // delta, 1
      });

      self.simulateLoop.start(this);

      console.log(self.options.gravity);
      this.setGravity(self.options.gravity);
    });
  }
}
