import {Quaternion} from 'three';

export const api = {
  // get mass() {
  //   return this._physijs.mass;
  // }

  // set mass(mass) {
  //   this._physijs.mass = mass;
  //   if (this.worldModule) this.worldModule.execute('updateMass', {id: this._physijs.id, mass});
  // }

  applyCentralImpulse(force) {
    if (this.worldModule) this.worldModule.execute('applyCentralImpulse', {id: this._physijs.id, x: force.x, y: force.y, z: force.z});
  },

  applyImpulse(force, offset) {
    if (this.worldModule) {
      this.worldModule.execute('applyImpulse', {
        id: this._physijs.id,
        impulse_x: force.x,
        impulse_y: force.y,
        impulse_z: force.z,
        x: offset.x,
        y: offset.y,
        z: offset.z
      });
    }
  },

  applyTorque(force) {
    if (this.worldModule) {
      this.worldModule.execute('applyTorque', {
        id: this._physijs.id,
        torque_x: force.x,
        torque_y: force.y,
        torque_z: force.z
      });
    }
  },

  applyCentralForce(force) {
    if (this.worldModule) this.worldModule.execute('applyCentralForce', {id: this._physijs.id, x: force.x, y: force.y, z: force.z});
  },

  applyForce(force, offset) {
    if (this.worldModule) {
      this.worldModule.execute('applyForce', {
        id: this._physijs.id,
        force_x: force.x,
        force_y: force.y,
        force_z: force.z,
        x: offset.x,
        y: offset.y,
        z: offset.z
      });
    }
  },

  getAngularVelocity() {
    return this._physijs.angularVelocity;
  },

  setAngularVelocity(velocity) {
    if (this.worldModule) this.worldModule.execute('setAngularVelocity', {id: this._physijs.id, x: velocity.x, y: velocity.y, z: velocity.z});
  },

  getLinearVelocity() {
    return this._physijs.linearVelocity;
  },

  setLinearVelocity(velocity) {
    if (this.worldModule) this.worldModule.execute('setLinearVelocity', {id: this._physijs.id, x: velocity.x, y: velocity.y, z: velocity.z});
  },

  setAngularFactor(factor) {
    if (this.worldModule) this.worldModule.execute('setAngularFactor', {id: this._physijs.id, x: factor.x, y: factor.y, z: factor.z});
  },

  setLinearFactor(factor) {
    if (this.worldModule) this.worldModule.execute('setLinearFactor', {id: this._physijs.id, x: factor.x, y: factor.y, z: factor.z});
  },

  setDamping(linear, angular) {
    if (this.worldModule) this.worldModule.execute('setDamping', {id: this._physijs.id, linear, angular});
  },

  setCcdMotionThreshold(threshold) {
    if (this.worldModule) this.worldModule.execute('setCcdMotionThreshold', {id: this._physijs.id, threshold});
  },

  setCcdSweptSphereRadius(radius) {
    if (this.worldModule) this.worldModule.execute('setCcdSweptSphereRadius', {id: this._physijs.id, radius});
  }
}

export const properties = {
  position: {
    get() {
      return this._native.position;
    },

    set(vector3) {
      const pos = this._native.position;
      const scope = this;

      Object.defineProperties(pos, {
        x: {
          get() {
            return this._x;
          },

          set(x) {
            scope.__dirtyPosition = true;
            this._x = x;
          }
        },
        y: {
          get() {
            return this._y;
          },

          set(y) {
            scope.__dirtyPosition = true;
            this._y = y;
          }
        },
        z: {
          get() {
            return this._z;
          },

          set(z) {
            scope.__dirtyPosition = true;
            this._z = z;
          }
        }
      });

      scope.__dirtyPosition = true;

      pos.copy(vector3);
    }
  },

  quaternion: {
    get() {
      this.__c_rot = true;
      return this.native.quaternion;
    },

    set(quaternion) {
      const quat = this._native.quaternion,
        native = this._native;

      quat.copy(quaternion);

      quat.onChange(() => {
        if (this.__c_rot) {
          if (native.__dirtyRotation === true) {
            this.__c_rot = false;
            native.__dirtyRotation = false;
          }
          native.__dirtyRotation = true;
        }
      });
    }
  },

  rotation: {
    get() {
      this.__c_rot = true;
      return this._native.rotation;
    },

    set(euler) {
      const rot = this._native.rotation,
        native = this._native;

      this.quaternion.copy(new Quaternion().setFromEuler(euler));

      rot.onChange(() => {
        if (this.__c_rot) {
          this.quaternion.copy(new Quaternion().setFromEuler(rot));
          native.__dirtyRotation = true;
        }
      });
    }
  }
}

export function wrapPhysicsPrototype(scope) {
  for (let key in api) {
    scope[key] = api[key].bind(scope);
  }

  for (let key in properties) {
    Object.defineProperty(scope, key, {
      get: properties[key].get.bind(scope),
      set: properties[key].set.bind(scope),
      configurable: true,
      enumerable: true
    });
  }
}

export function onCopy(source) {
  wrapPhysicsPrototype(this);
  this._physijs = {...source._physijs};
  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();
}

export function onWrap() {
  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();
}