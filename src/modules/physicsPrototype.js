import {Quaternion} from 'three';

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

  const physics = this.use('physics');
  const sourcePhysics = source.use('physics');

  this.manager.modules.physics = physics.clone(this.manager);

  physics.data = {...sourcePhysics.data};
  physics.data.isSoftBodyReset = false;
  if (physics.data.isSoftbody) physics.data.isSoftBodyReset = false;

  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();

  return source;
}

export function onWrap() {
  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();
}
