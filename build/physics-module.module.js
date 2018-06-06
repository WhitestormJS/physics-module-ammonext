import { Vector3 as Vector3$1, Matrix4, Quaternion, Euler, Mesh, SphereGeometry, MeshNormalMaterial, BoxGeometry, BufferGeometry, Vector2, BufferAttribute, Object3D } from 'three';
import { Loop } from 'whs';

var MESSAGE_TYPES = {
  WORLDREPORT: 0,
  COLLISIONREPORT: 1,
  VEHICLEREPORT: 2,
  CONSTRAINTREPORT: 3,
  SOFTREPORT: 4
};

var REPORT_ITEMSIZE = 14,
    COLLISIONREPORT_ITEMSIZE = 5,
    VEHICLEREPORT_ITEMSIZE = 9,
    CONSTRAINTREPORT_ITEMSIZE = 6;

var temp1Vector3 = new Vector3$1(),
    temp2Vector3 = new Vector3$1(),
    temp1Matrix4 = new Matrix4(),
    temp1Quat = new Quaternion();

var getEulerXYZFromQuaternion = function getEulerXYZFromQuaternion(x, y, z, w) {
  return new Vector3$1(Math.atan2(2 * (x * w - y * z), w * w - x * x - y * y + z * z), Math.asin(2 * (x * z + y * w)), Math.atan2(2 * (z * w - x * y), w * w + x * x - y * y - z * z));
};

var getQuatertionFromEuler = function getQuatertionFromEuler(x, y, z) {
  var c1 = Math.cos(y);
  var s1 = Math.sin(y);
  var c2 = Math.cos(-z);
  var s2 = Math.sin(-z);
  var c3 = Math.cos(x);
  var s3 = Math.sin(x);
  var c1c2 = c1 * c2;
  var s1s2 = s1 * s2;

  return {
    w: c1c2 * c3 - s1s2 * s3,
    x: c1c2 * s3 + s1s2 * c3,
    y: s1 * c2 * c3 + c1 * s2 * s3,
    z: c1 * s2 * c3 - s1 * c2 * s3
  };
};

var convertWorldPositionToObject = function convertWorldPositionToObject(position, object) {
  temp1Matrix4.identity(); // reset temp matrix

  // Set the temp matrix's rotation to the object's rotation
  temp1Matrix4.identity().makeRotationFromQuaternion(object.quaternion);

  // Invert rotation matrix in order to "unrotate" a point back to object space
  temp1Matrix4.getInverse(temp1Matrix4);

  // Yay! Temp vars!
  temp1Vector3.copy(position);
  temp2Vector3.copy(object.position);

  // Apply the rotation
  return temp1Vector3.sub(temp2Vector3).applyMatrix4(temp1Matrix4);
};

var addObjectChildren = function addObjectChildren(parent, object) {
  for (var i = 0; i < object.children.length; i++) {
    var child = object.children[i];
    var physics = child.component ? child.component.use('physics') : false;

    if (physics) {
      var data = physics.data;

      child.updateMatrix();
      child.updateMatrixWorld();

      temp1Vector3.setFromMatrixPosition(child.matrixWorld);
      temp1Quat.setFromRotationMatrix(child.matrixWorld);

      data.position_offset = {
        x: temp1Vector3.x,
        y: temp1Vector3.y,
        z: temp1Vector3.z
      };

      data.rotation = {
        x: temp1Quat.x,
        y: temp1Quat.y,
        z: temp1Quat.z,
        w: temp1Quat.w
      };

      parent.component.use('physics').data.children.push(data);
    }

    addObjectChildren(parent, child);
  }
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var Eventable = function () {
  function Eventable() {
    classCallCheck(this, Eventable);

    this._eventListeners = {};
  }

  createClass(Eventable, [{
    key: "addEventListener",
    value: function addEventListener(event_name, callback) {
      if (!this._eventListeners.hasOwnProperty(event_name)) this._eventListeners[event_name] = [];

      this._eventListeners[event_name].push(callback);
    }
  }, {
    key: "removeEventListener",
    value: function removeEventListener(event_name, callback) {
      var index = void 0;

      if (!this._eventListeners.hasOwnProperty(event_name)) return false;

      if ((index = this._eventListeners[event_name].indexOf(callback)) >= 0) {
        this._eventListeners[event_name].splice(index, 1);
        return true;
      }

      return false;
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent(event_name) {
      var i = void 0;
      var parameters = Array.prototype.splice.call(arguments, 1);

      if (this._eventListeners.hasOwnProperty(event_name)) {
        for (i = 0; i < this._eventListeners[event_name].length; i++) {
          this._eventListeners[event_name][i].apply(this, parameters);
        }
      }
    }
  }], [{
    key: "make",
    value: function make(obj) {
      obj.prototype.addEventListener = Eventable.prototype.addEventListener;
      obj.prototype.removeEventListener = Eventable.prototype.removeEventListener;
      obj.prototype.dispatchEvent = Eventable.prototype.dispatchEvent;
    }
  }]);
  return Eventable;
}();

var ConeTwistConstraint = function () {
  function ConeTwistConstraint(obja, objb, position) {
    classCallCheck(this, ConeTwistConstraint);

    var objecta = obja;
    var objectb = obja;

    if (position === undefined) console.error('Both objects must be defined in a ConeTwistConstraint.');

    this.type = 'conetwist';
    this.appliedImpulse = 0;
    this.worldModule = null; // Will be redefined by .addConstraint
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.objectb = objectb.use('physics').data.id;
    this.positionb = convertWorldPositionToObject(position, objectb).clone();
    this.axisa = { x: objecta.rotation.x, y: objecta.rotation.y, z: objecta.rotation.z };
    this.axisb = { x: objectb.rotation.x, y: objectb.rotation.y, z: objectb.rotation.z };
  }

  createClass(ConeTwistConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb,
        axisa: this.axisa,
        axisb: this.axisb
      };
    }
  }, {
    key: 'setLimit',
    value: function setLimit(x, y, z) {
      if (this.worldModule) this.worldModule.execute('conetwist_setLimit', { constraint: this.id, x: x, y: y, z: z });
    }
  }, {
    key: 'enableMotor',
    value: function enableMotor() {
      if (this.worldModule) this.worldModule.execute('conetwist_enableMotor', { constraint: this.id });
    }
  }, {
    key: 'setMaxMotorImpulse',
    value: function setMaxMotorImpulse(max_impulse) {
      if (this.worldModule) this.worldModule.execute('conetwist_setMaxMotorImpulse', { constraint: this.id, max_impulse: max_impulse });
    }
  }, {
    key: 'setMotorTarget',
    value: function setMotorTarget(target) {
      if (target instanceof Vector3$1) target = new Quaternion().setFromEuler(new Euler(target.x, target.y, target.z));else if (target instanceof Euler) target = new Quaternion().setFromEuler(target);else if (target instanceof Matrix4) target = new Quaternion().setFromRotationMatrix(target);

      if (this.worldModule) this.worldModule.execute('conetwist_setMotorTarget', {
        constraint: this.id,
        x: target.x,
        y: target.y,
        z: target.z,
        w: target.w
      });
    }
  }]);
  return ConeTwistConstraint;
}();

var HingeConstraint = function () {
  function HingeConstraint(obja, objb, position, axis) {
    classCallCheck(this, HingeConstraint);

    var objecta = obja;
    var objectb = objb;

    if (axis === undefined) {
      axis = position;
      position = objectb;
      objectb = undefined;
    }

    this.type = 'hinge';
    this.appliedImpulse = 0;
    this.worldModule = null; // Will be redefined by .addConstraint
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.position = position.clone();
    this.axis = axis;

    if (objectb) {
      this.objectb = objectb.use('physics').data.id;
      this.positionb = convertWorldPositionToObject(position, objectb).clone();
    }
  }

  createClass(HingeConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb,
        axis: this.axis
      };
    }
  }, {
    key: 'setLimits',
    value: function setLimits(low, high, bias_factor, relaxation_factor) {
      if (this.worldModule) this.worldModule.execute('hinge_setLimits', {
        constraint: this.id,
        low: low,
        high: high,
        bias_factor: bias_factor,
        relaxation_factor: relaxation_factor
      });
    }
  }, {
    key: 'enableAngularMotor',
    value: function enableAngularMotor(velocity, acceleration) {
      if (this.worldModule) this.worldModule.execute('hinge_enableAngularMotor', {
        constraint: this.id,
        velocity: velocity,
        acceleration: acceleration
      });
    }
  }, {
    key: 'disableMotor',
    value: function disableMotor() {
      if (this.worldModule) this.worldModule.execute('hinge_disableMotor', { constraint: this.id });
    }
  }]);
  return HingeConstraint;
}();

var PointConstraint = function () {
  function PointConstraint(obja, objb, position) {
    classCallCheck(this, PointConstraint);

    var objecta = obja;
    var objectb = objb;

    if (position === undefined) {
      position = objectb;
      objectb = undefined;
    }

    this.type = 'point';
    this.appliedImpulse = 0;
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();

    if (objectb) {
      this.objectb = objectb.use('physics').data.id;
      this.positionb = convertWorldPositionToObject(position, objectb).clone();
    }
  }

  createClass(PointConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb
      };
    }
  }]);
  return PointConstraint;
}();

var SliderConstraint = function () {
  function SliderConstraint(obja, objb, position, axis) {
    classCallCheck(this, SliderConstraint);

    var objecta = obja;
    var objectb = objb;

    if (axis === undefined) {
      axis = position;
      position = objectb;
      objectb = undefined;
    }

    this.type = 'slider';
    this.appliedImpulse = 0;
    this.worldModule = null; // Will be redefined by .addConstraint
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.axis = axis;

    if (objectb) {
      this.objectb = objectb.use('physics').data.id;
      this.positionb = convertWorldPositionToObject(position, objectb).clone();
    }
  }

  createClass(SliderConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb,
        axis: this.axis
      };
    }
  }, {
    key: 'setLimits',
    value: function setLimits(lin_lower, lin_upper, ang_lower, ang_upper) {
      if (this.worldModule) this.worldModule.execute('slider_setLimits', {
        constraint: this.id,
        lin_lower: lin_lower,
        lin_upper: lin_upper,
        ang_lower: ang_lower,
        ang_upper: ang_upper
      });
    }
  }, {
    key: 'setRestitution',
    value: function setRestitution(linear, angular) {
      if (this.worldModule) this.worldModule.execute('slider_setRestitution', {
        constraint: this.id,
        linear: linear,
        angular: angular
      });
    }
  }, {
    key: 'enableLinearMotor',
    value: function enableLinearMotor(velocity, acceleration) {
      if (this.worldModule) this.worldModule.execute('slider_enableLinearMotor', {
        constraint: this.id,
        velocity: velocity,
        acceleration: acceleration
      });
    }
  }, {
    key: 'disableLinearMotor',
    value: function disableLinearMotor() {
      if (this.worldModule) this.worldModule.execute('slider_disableLinearMotor', { constraint: this.id });
    }
  }, {
    key: 'enableAngularMotor',
    value: function enableAngularMotor(velocity, acceleration) {
      this.scene.execute('slider_enableAngularMotor', {
        constraint: this.id,
        velocity: velocity,
        acceleration: acceleration
      });
    }
  }, {
    key: 'disableAngularMotor',
    value: function disableAngularMotor() {
      if (this.worldModule) this.worldModule.execute('slider_disableAngularMotor', { constraint: this.id });
    }
  }]);
  return SliderConstraint;
}();

var DOFConstraint = function () {
  function DOFConstraint(obja, objb, position) {
    classCallCheck(this, DOFConstraint);

    var objecta = obja;
    var objectb = objb;

    if (position === undefined) {
      position = objectb;
      objectb = undefined;
    }

    this.type = 'dof';
    this.appliedImpulse = 0;
    this.worldModule = null; // Will be redefined by .addConstraint
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.axisa = { x: objecta.rotation.x, y: objecta.rotation.y, z: objecta.rotation.z };

    if (objectb) {
      this.objectb = objectb.use('physics').data.id;
      this.positionb = convertWorldPositionToObject(position, objectb).clone();
      this.axisb = { x: objectb.rotation.x, y: objectb.rotation.y, z: objectb.rotation.z };
    }
  }

  createClass(DOFConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb,
        axisa: this.axisa,
        axisb: this.axisb
      };
    }
  }, {
    key: 'setLinearLowerLimit',
    value: function setLinearLowerLimit(limit) {
      if (this.worldModule) this.worldModule.execute('dof_setLinearLowerLimit', { constraint: this.id, x: limit.x, y: limit.y, z: limit.z });
    }
  }, {
    key: 'setLinearUpperLimit',
    value: function setLinearUpperLimit(limit) {
      if (this.worldModule) this.worldModule.execute('dof_setLinearUpperLimit', { constraint: this.id, x: limit.x, y: limit.y, z: limit.z });
    }
  }, {
    key: 'setAngularLowerLimit',
    value: function setAngularLowerLimit(limit) {
      if (this.worldModule) this.worldModule.execute('dof_setAngularLowerLimit', { constraint: this.id, x: limit.x, y: limit.y, z: limit.z });
    }
  }, {
    key: 'setAngularUpperLimit',
    value: function setAngularUpperLimit(limit) {
      if (this.worldModule) this.worldModule.execute('dof_setAngularUpperLimit', { constraint: this.id, x: limit.x, y: limit.y, z: limit.z });
    }
  }, {
    key: 'enableAngularMotor',
    value: function enableAngularMotor(which) {
      if (this.worldModule) this.worldModule.execute('dof_enableAngularMotor', { constraint: this.id, which: which });
    }
  }, {
    key: 'configureAngularMotor',
    value: function configureAngularMotor(which, low_angle, high_angle, velocity, max_force) {
      if (this.worldModule) this.worldModule.execute('dof_configureAngularMotor', { constraint: this.id, which: which, low_angle: low_angle, high_angle: high_angle, velocity: velocity, max_force: max_force });
    }
  }, {
    key: 'disableAngularMotor',
    value: function disableAngularMotor(which) {
      if (this.worldModule) this.worldModule.execute('dof_disableAngularMotor', { constraint: this.id, which: which });
    }
  }]);
  return DOFConstraint;
}();

var Vehicle = function () {
  function Vehicle(mesh) {
    var tuning = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new VehicleTuning();
    classCallCheck(this, Vehicle);

    this.mesh = mesh;
    this.wheels = [];

    this._physijs = {
      id: getObjectId(),
      rigidBody: mesh._physijs.id,
      suspension_stiffness: tuning.suspension_stiffness,
      suspension_compression: tuning.suspension_compression,
      suspension_damping: tuning.suspension_damping,
      max_suspension_travel: tuning.max_suspension_travel,
      friction_slip: tuning.friction_slip,
      max_suspension_force: tuning.max_suspension_force
    };
  }

  createClass(Vehicle, [{
    key: 'addWheel',
    value: function addWheel(wheel_geometry, wheel_material, connection_point, wheel_direction, wheel_axle, suspension_rest_length, wheel_radius, is_front_wheel, tuning) {
      var wheel = new Mesh(wheel_geometry, wheel_material);

      wheel.castShadow = wheel.receiveShadow = true;
      wheel.position.copy(wheel_direction).multiplyScalar(suspension_rest_length / 100).add(connection_point);

      this.world.add(wheel);
      this.wheels.push(wheel);

      this.world.execute('addWheel', {
        id: this._physijs.id,
        connection_point: { x: connection_point.x, y: connection_point.y, z: connection_point.z },
        wheel_direction: { x: wheel_direction.x, y: wheel_direction.y, z: wheel_direction.z },
        wheel_axle: { x: wheel_axle.x, y: wheel_axle.y, z: wheel_axle.z },
        suspension_rest_length: suspension_rest_length,
        wheel_radius: wheel_radius,
        is_front_wheel: is_front_wheel,
        tuning: tuning
      });
    }
  }, {
    key: 'setSteering',
    value: function setSteering(amount, wheel) {
      if (wheel !== undefined && this.wheels[wheel] !== undefined) this.world.execute('setSteering', { id: this._physijs.id, wheel: wheel, steering: amount });else if (this.wheels.length > 0) {
        for (var i = 0; i < this.wheels.length; i++) {
          this.world.execute('setSteering', { id: this._physijs.id, wheel: i, steering: amount });
        }
      }
    }
  }, {
    key: 'setBrake',
    value: function setBrake(amount, wheel) {
      if (wheel !== undefined && this.wheels[wheel] !== undefined) this.world.execute('setBrake', { id: this._physijs.id, wheel: wheel, brake: amount });else if (this.wheels.length > 0) {
        for (var i = 0; i < this.wheels.length; i++) {
          this.world.execute('setBrake', { id: this._physijs.id, wheel: i, brake: amount });
        }
      }
    }
  }, {
    key: 'applyEngineForce',
    value: function applyEngineForce(amount, wheel) {
      if (wheel !== undefined && this.wheels[wheel] !== undefined) this.world.execute('applyEngineForce', { id: this._physijs.id, wheel: wheel, force: amount });else if (this.wheels.length > 0) {
        for (var i = 0; i < this.wheels.length; i++) {
          this.world.execute('applyEngineForce', { id: this._physijs.id, wheel: i, force: amount });
        }
      }
    }
  }]);
  return Vehicle;
}();

var _class, _temp2;

var WorldModuleBase = (_temp2 = _class = function (_Eventable) {
  inherits(WorldModuleBase, _Eventable);

  function WorldModuleBase(options) {
    classCallCheck(this, WorldModuleBase);

    var _this = possibleConstructorReturn(this, (WorldModuleBase.__proto__ || Object.getPrototypeOf(WorldModuleBase)).call(this));

    _this.bridge = {
      onAdd: function onAdd(component, self) {
        if (component.use('physics')) return self.defer(self.onAddCallback.bind(self), [component]);
        return;
      },
      onRemove: function onRemove(component, self) {
        if (component.use('physics')) return self.defer(self.onRemoveCallback.bind(self), [component]);
        return;
      }
    };


    _this.options = Object.assign(WorldModuleBase.defaults, options);

    _this.objects = {};
    _this.vehicles = {};
    _this.constraints = {};
    _this.isSimulating = false;

    _this.getObjectId = function () {
      var id = 1;
      return function () {
        return id++;
      };
    }();
    return _this;
  }

  createClass(WorldModuleBase, [{
    key: 'setup',
    value: function setup() {
      var _this2 = this;

      this.receive(function (event) {
        var _temp = void 0,
            data = event.data;

        if (data instanceof ArrayBuffer && data.byteLength !== 1) // byteLength === 1 is the worker making a SUPPORT_TRANSFERABLE test
          data = new Float32Array(data);

        if (data instanceof Float32Array) {
          // transferable object
          switch (data[0]) {
            case MESSAGE_TYPES.WORLDREPORT:
              _this2.updateScene(data);
              break;

            case MESSAGE_TYPES.SOFTREPORT:
              _this2.updateSoftbodies(data);
              break;

            case MESSAGE_TYPES.COLLISIONREPORT:
              _this2.updateCollisions(data);
              break;

            case MESSAGE_TYPES.VEHICLEREPORT:
              _this2.updateVehicles(data);
              break;

            case MESSAGE_TYPES.CONSTRAINTREPORT:
              _this2.updateConstraints(data);
              break;
            default:
          }
        } else if (data.cmd) {
          // non-transferable object
          switch (data.cmd) {
            case 'objectReady':
              _temp = data.params;
              if (_this2.objects[_temp]) _this2.objects[_temp].dispatchEvent('ready');
              break;

            case 'worldReady':
              _this2.dispatchEvent('ready');
              break;

            case 'ammoLoaded':
              _this2.dispatchEvent('loaded');
              // console.log("Physics loading time: " + (performance.now() - start) + "ms");
              break;

            case 'vehicle':
              window.test = data;
              break;

            default:
              // Do nothing, just show the message
              console.debug('Received: ' + data.cmd);
              console.dir(data.params);
              break;
          }
        } else {
          switch (data[0]) {
            case MESSAGE_TYPES.WORLDREPORT:
              _this2.updateScene(data);
              break;

            case MESSAGE_TYPES.COLLISIONREPORT:
              _this2.updateCollisions(data);
              break;

            case MESSAGE_TYPES.VEHICLEREPORT:
              _this2.updateVehicles(data);
              break;

            case MESSAGE_TYPES.CONSTRAINTREPORT:
              _this2.updateConstraints(data);
              break;
            default:
          }
        }
      });
    }
  }, {
    key: 'updateScene',
    value: function updateScene(info) {
      var index = info[1];

      while (index--) {
        var offset = 2 + index * REPORT_ITEMSIZE;
        var object = this.objects[info[offset]];
        var component = object.component;
        var data = component.use('physics').data;

        if (object === null) continue;

        if (component.__dirtyPosition === false) {
          object.position.set(info[offset + 1], info[offset + 2], info[offset + 3]);

          component.__dirtyPosition = false;
        }

        if (component.__dirtyRotation === false) {
          object.quaternion.set(info[offset + 4], info[offset + 5], info[offset + 6], info[offset + 7]);

          component.__dirtyRotation = false;
        }

        data.linearVelocity.set(info[offset + 8], info[offset + 9], info[offset + 10]);

        data.angularVelocity.set(info[offset + 11], info[offset + 12], info[offset + 13]);
      }

      if (this.SUPPORT_TRANSFERABLE) this.send(info.buffer, [info.buffer]); // Give the typed array back to the worker

      this.isSimulating = false;
      this.dispatchEvent('update');
    }
  }, {
    key: 'updateSoftbodies',
    value: function updateSoftbodies(info) {
      var index = info[1],
          offset = 2;

      while (index--) {
        var size = info[offset + 1];
        var object = this.objects[info[offset]];

        if (object === null) continue;

        var data = object.component.use('physics').data;

        var attributes = object.geometry.attributes;
        var volumePositions = attributes.position.array;

        var offsetVert = offset + 2;

        // console.log(data.id);
        if (!data.isSoftBodyReset) {
          object.position.set(0, 0, 0);
          object.quaternion.set(0, 0, 0, 0);

          data.isSoftBodyReset = true;
        }

        if (data.type === "softTrimesh") {
          var volumeNormals = attributes.normal.array;

          for (var i = 0; i < size; i++) {
            var offs = offsetVert + i * 18;

            var x1 = info[offs];
            var y1 = info[offs + 1];
            var z1 = info[offs + 2];

            var nx1 = info[offs + 3];
            var ny1 = info[offs + 4];
            var nz1 = info[offs + 5];

            var x2 = info[offs + 6];
            var y2 = info[offs + 7];
            var z2 = info[offs + 8];

            var nx2 = info[offs + 9];
            var ny2 = info[offs + 10];
            var nz2 = info[offs + 11];

            var x3 = info[offs + 12];
            var y3 = info[offs + 13];
            var z3 = info[offs + 14];

            var nx3 = info[offs + 15];
            var ny3 = info[offs + 16];
            var nz3 = info[offs + 17];

            var i9 = i * 9;

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
        } else if (data.type === "softRopeMesh") {
          for (var _i = 0; _i < size; _i++) {
            var _offs = offsetVert + _i * 3;

            var x = info[_offs];
            var y = info[_offs + 1];
            var z = info[_offs + 2];

            volumePositions[_i * 3] = x;
            volumePositions[_i * 3 + 1] = y;
            volumePositions[_i * 3 + 2] = z;
          }

          offset += 2 + size * 3;
        } else {
          var _volumeNormals = attributes.normal.array;

          for (var _i2 = 0; _i2 < size; _i2++) {
            var _offs2 = offsetVert + _i2 * 6;

            var _x = info[_offs2];
            var _y = info[_offs2 + 1];
            var _z = info[_offs2 + 2];

            var nx = info[_offs2 + 3];
            var ny = info[_offs2 + 4];
            var nz = info[_offs2 + 5];

            volumePositions[_i2 * 3] = _x;
            volumePositions[_i2 * 3 + 1] = _y;
            volumePositions[_i2 * 3 + 2] = _z;

            // FIXME: Normals are pointed to look inside;
            _volumeNormals[_i2 * 3] = nx;
            _volumeNormals[_i2 * 3 + 1] = ny;
            _volumeNormals[_i2 * 3 + 2] = nz;
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
  }, {
    key: 'updateVehicles',
    value: function updateVehicles(data) {
      var vehicle = void 0,
          wheel = void 0;

      for (var i = 0; i < (data.length - 1) / VEHICLEREPORT_ITEMSIZE; i++) {
        var offset = 1 + i * VEHICLEREPORT_ITEMSIZE;
        vehicle = this.vehicles[data[offset]];

        if (vehicle === null) continue;

        wheel = vehicle.wheels[data[offset + 1]];

        wheel.position.set(data[offset + 2], data[offset + 3], data[offset + 4]);

        wheel.quaternion.set(data[offset + 5], data[offset + 6], data[offset + 7], data[offset + 8]);
      }

      if (this.SUPPORT_TRANSFERABLE) this.send(data.buffer, [data.buffer]); // Give the typed array back to the worker
    }
  }, {
    key: 'updateConstraints',
    value: function updateConstraints(data) {
      var constraint = void 0,
          object = void 0;

      for (var i = 0; i < (data.length - 1) / CONSTRAINTREPORT_ITEMSIZE; i++) {
        var offset = 1 + i * CONSTRAINTREPORT_ITEMSIZE;
        constraint = this.constraints[data[offset]];
        object = this.objects[data[offset + 1]];

        if (constraint === undefined || object === undefined) continue;

        temp1Vector3.set(data[offset + 2], data[offset + 3], data[offset + 4]);

        temp1Matrix4.extractRotation(object.matrix);
        temp1Vector3.applyMatrix4(temp1Matrix4);

        constraint.positiona.addVectors(object.position, temp1Vector3);
        constraint.appliedImpulse = data[offset + 5];
      }

      if (this.SUPPORT_TRANSFERABLE) this.send(data.buffer, [data.buffer]); // Give the typed array back to the worker
    }
  }, {
    key: 'updateCollisions',
    value: function updateCollisions(info) {
      /**
       * #TODO
       * This is probably the worst way ever to handle collisions. The inherent evilness is a residual
       * effect from the previous version's evilness which mutated when switching to transferable objects.
       *
       * If you feel inclined to make this better, please do so.
       */

      var collisions = {},
          normal_offsets = {};

      // Build collision manifest
      for (var i = 0; i < info[1]; i++) {
        var offset = 2 + i * COLLISIONREPORT_ITEMSIZE;
        var object = info[offset];
        var object2 = info[offset + 1];

        normal_offsets[object + '-' + object2] = offset + 2;
        normal_offsets[object2 + '-' + object] = -1 * (offset + 2);

        // Register collisions for both the object colliding and the object being collided with
        if (!collisions[object]) collisions[object] = [];
        collisions[object].push(object2);

        if (!collisions[object2]) collisions[object2] = [];
        collisions[object2].push(object);
      }

      // Deal with collisions
      for (var id1 in this.objects) {
        if (!this.objects.hasOwnProperty(id1)) continue;
        var _object = this.objects[id1];
        var component = _object.component;
        var data = component.use('physics').data;

        if (_object === null) continue;

        // If object touches anything, ...
        if (collisions[id1]) {
          // Clean up touches array
          for (var j = 0; j < data.touches.length; j++) {
            if (collisions[id1].indexOf(data.touches[j]) === -1) data.touches.splice(j--, 1);
          }

          // Handle each colliding object
          for (var _j = 0; _j < collisions[id1].length; _j++) {
            var id2 = collisions[id1][_j];
            var _object2 = this.objects[id2];

            if (_object2) {
              var component2 = _object2.component;
              var data2 = component2.use('physics').data;
              // If object was not already touching object2, notify object
              if (data.touches.indexOf(id2) === -1) {
                data.touches.push(id2);

                var vel = component.use('physics').getLinearVelocity();
                var vel2 = component2.use('physics').getLinearVelocity();

                temp1Vector3.subVectors(vel, vel2);
                var temp1 = temp1Vector3.clone();

                temp1Vector3.subVectors(vel, vel2);
                var temp2 = temp1Vector3.clone();

                var normal_offset = normal_offsets[data.id + '-' + data2.id];

                if (normal_offset > 0) {
                  temp1Vector3.set(-info[normal_offset], -info[normal_offset + 1], -info[normal_offset + 2]);
                } else {
                  normal_offset *= -1;

                  temp1Vector3.set(info[normal_offset], info[normal_offset + 1], info[normal_offset + 2]);
                }

                component.emit('collision', _object2, temp1, temp2, temp1Vector3);
              }
            }
          }
        } else data.touches.length = 0; // not touching other objects
      }

      this.collisions = collisions;

      if (this.SUPPORT_TRANSFERABLE) this.send(info.buffer, [info.buffer]); // Give the typed array back to the worker
    }
  }, {
    key: 'addConstraint',
    value: function addConstraint(constraint, show_marker) {
      constraint.id = this.getObjectId();
      this.constraints[constraint.id] = constraint;
      constraint.worldModule = this;
      this.execute('addConstraint', constraint.getDefinition());

      if (show_marker) {
        var marker = void 0;

        switch (constraint.type) {
          case 'point':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'hinge':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'slider':
            marker = new Mesh(new BoxGeometry(10, 1, 1), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);

            // This rotation isn't right if all three axis are non-0 values
            // TODO: change marker's rotation order to ZYX
            marker.rotation.set(constraint.axis.y, // yes, y and
            constraint.axis.x, // x axis are swapped
            constraint.axis.z);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'conetwist':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'dof':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;
          default:
        }
      }

      return constraint;
    }
  }, {
    key: 'onSimulationResume',
    value: function onSimulationResume() {
      this.execute('onSimulationResume', {});
    }
  }, {
    key: 'removeConstraint',
    value: function removeConstraint(constraint) {
      if (this.constraints[constraint.id] !== undefined) {
        this.execute('removeConstraint', { id: constraint.id });
        delete this.constraints[constraint.id];
      }
    }
  }, {
    key: 'execute',
    value: function execute(cmd, params) {
      this.send({ cmd: cmd, params: params });
    }
  }, {
    key: 'onAddCallback',
    value: function onAddCallback(component) {
      var object = component.native;
      var data = object.component.use('physics').data;

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
  }, {
    key: 'onRemoveCallback',
    value: function onRemoveCallback(component) {
      var object = component.native;

      if (object instanceof Vehicle) {
        this.execute('removeVehicle', { id: object._physijs.id });
        while (object.wheels.length) {
          this.remove(object.wheels.pop());
        }this.remove(object.mesh);
        this.vehicles[object._physijs.id] = null;
      } else {
        // Mesh.prototype.remove.call(this, object);

        if (object._physijs) {
          component.manager.remove('module:world');
          this.objects[object._physijs.id] = null;
          this.execute('removeObject', { id: object._physijs.id });
        }
      }
    }
  }, {
    key: 'defer',
    value: function defer(func, args) {
      var _this3 = this;

      return new Promise(function (resolve) {
        if (_this3.isLoaded) {
          func.apply(undefined, toConsumableArray(args));
          resolve();
        } else _this3.loader.then(function () {
          func.apply(undefined, toConsumableArray(args));
          resolve();
        });
      });
    }
  }, {
    key: 'manager',
    value: function manager(_manager) {
      _manager.define('physics');
      _manager.set('physicsWorker', this.worker);
    }
  }, {
    key: 'integrate',
    value: function integrate(self) {
      var _this4 = this;

      // ...

      this.setFixedTimeStep = function (fixedTimeStep) {
        if (fixedTimeStep) self.execute('setFixedTimeStep', fixedTimeStep);
      };

      this.setGravity = function (gravity) {
        if (gravity) self.execute('setGravity', gravity);
      };

      this.addConstraint = self.addConstraint.bind(self);

      this.simulate = function (timeStep, maxSubSteps) {
        if (self._stats) self._stats.begin();

        if (self.isSimulating) return false;
        self.isSimulating = true;

        for (var object_id in self.objects) {
          if (!self.objects.hasOwnProperty(object_id)) continue;

          var object = self.objects[object_id];
          var component = object.component;
          var data = component.use('physics').data;

          if (object !== null && (component.__dirtyPosition || component.__dirtyRotation)) {
            var update = { id: data.id };

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

        self.execute('simulate', { timeStep: timeStep, maxSubSteps: maxSubSteps });

        if (self._stats) self._stats.end();
        return true;
      };

      // const simulateProcess = (t) => {
      //   window.requestAnimationFrame(simulateProcess);

      //   this.simulate(1/60, 1); // delta, 1
      // }

      // simulateProcess();

      self.loader.then(function () {
        self.simulateLoop = new Loop(function (clock) {
          _this4.simulate(clock.getDelta(), 1); // delta, 1
        });

        self.simulateLoop.start(_this4);

        console.log(self.options.gravity);
        _this4.setGravity(self.options.gravity);
      });
    }
  }]);
  return WorldModuleBase;
}(Eventable), _class.defaults = {
  fixedTimeStep: 1 / 60,
  rateLimit: true,
  ammo: "",
  softbody: false,
  gravity: new Vector3$1(0, -100, 0)
}, _temp2);

var TARGET = typeof Symbol === 'undefined' ? '__target' : Symbol(),
    SCRIPT_TYPE = 'application/javascript',
    BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder,
    URL = window.URL || window.webkitURL,
    Worker = window.Worker;

/**
 * Returns a wrapper around Web Worker code that is constructible.
 *
 * @function shimWorker
 *
 * @param { String }    filename    The name of the file
 * @param { Function }  fn          Function wrapping the code of the worker
 */
function shimWorker(filename, fn) {
    return function ShimWorker(forceFallback) {
        var o = this;

        if (!fn) {
            return new Worker(filename);
        } else if (Worker && !forceFallback) {
            // Convert the function's inner code to a string to construct the worker
            var source = fn.toString().replace(/^function.+?{/, '').slice(0, -1),
                objURL = createSourceObject(source);

            this[TARGET] = new Worker(objURL);
            URL.revokeObjectURL(objURL);
            return this[TARGET];
        } else {
            var selfShim = {
                postMessage: function postMessage(m) {
                    if (o.onmessage) {
                        setTimeout(function () {
                            o.onmessage({ data: m, target: selfShim });
                        });
                    }
                }
            };

            fn.call(selfShim);
            this.postMessage = function (m) {
                setTimeout(function () {
                    selfShim.onmessage({ data: m, target: o });
                });
            };
            this.isThisThread = true;
        }
    };
}
// Test Worker capabilities
if (Worker) {
    var testWorker,
        objURL = createSourceObject('self.onmessage = function () {}'),
        testArray = new Uint8Array(1);

    try {
        // No workers via blobs in Edge 12 and IE 11 and lower :(
        if (/(?:Trident|Edge)\/(?:[567]|12)/i.test(navigator.userAgent)) {
            throw new Error('Not available');
        }
        testWorker = new Worker(objURL);

        // Native browser on some Samsung devices throws for transferables, let's detect it
        testWorker.postMessage(testArray, [testArray.buffer]);
    } catch (e) {
        Worker = null;
    } finally {
        URL.revokeObjectURL(objURL);
        if (testWorker) {
            testWorker.terminate();
        }
    }
}

function createSourceObject(str) {
    try {
        return URL.createObjectURL(new Blob([str], { type: SCRIPT_TYPE }));
    } catch (e) {
        var blob = new BlobBuilder();
        blob.append(str);
        return URL.createObjectURL(blob.getBlob(type));
    }
}

var PhysicsWorker = new shimWorker("../worker.js", function (window, document) {
  var self = this;
  function Events(target) {
    var events = {},
        empty = [];
    target = target || this;
    /**
     *  On: listen to events
     */
    target.on = function (type, func, ctx) {
      (events[type] = events[type] || []).push([func, ctx]);
      return target;
    };
    /**
     *  Off: stop listening to event / specific callback
     */
    target.off = function (type, func) {
      type || (events = {});
      var list = events[type] || empty,
          i = list.length = func ? list.length : 0;
      while (i--) {
        func == list[i][0] && list.splice(i, 1);
      }return target;
    };
    /**
     * Emit: send event, callbacks will be triggered
     */
    target.emit = function (type) {
      var e = events[type] || empty,
          list = e.length > 0 ? e.slice(0, e.length) : e,
          i = 0,
          j;
      while (j = list[i++]) {
        j[0].apply(j[1], empty.slice.call(arguments, 1));
      }return target;
    };
  }
  var insideWorker = !self.document;
  if (!insideWorker) self = new Events();

  var send = insideWorker ? self.webkitPostMessage || self.postMessage : function (data) {
    self.emit('message', { data: data });
  };

  self.send = send;

  var SUPPORT_TRANSFERABLE = void 0;

  if (insideWorker) {
    var ab = new ArrayBuffer(1);

    send(ab, [ab]);
    SUPPORT_TRANSFERABLE = ab.byteLength === 0;
  }

  var MESSAGE_TYPES = {
    WORLDREPORT: 0,
    COLLISIONREPORT: 1,
    VEHICLEREPORT: 2,
    CONSTRAINTREPORT: 3,
    SOFTREPORT: 4
  };

  // temp variables
  var _object = void 0,
      _vector = void 0,
      _transform = void 0,
      _transform_pos = void 0,
      _softbody_enabled = false,
      _num_objects = 0,
      _num_rigidbody_objects = 0,
      _num_softbody_objects = 0,
      _num_wheels = 0,
      _num_constraints = 0,
      _softbody_report_size = 0,


  // world variables
  fixedTimeStep = void 0,
      world = void 0,
      _vec3_1 = void 0,
      _vec3_2 = void 0,
      _vec3_3 = void 0,
      _quat = void 0;

  // private cache
  var public_functions = {},
      _objects = [],
      _vehicles = [],
      _constraints = [],
      _objects_ammo = {},
      _object_shapes = {},


  // The following objects are to track objects that ammo.js doesn't clean
  // up. All are cleaned up when they're corresponding body is destroyed.
  // Unfortunately, it's very difficult to get at these objects from the
  // body, so we have to track them ourselves.
  _motion_states = {},

  // Don't need to worry about it for cached shapes.
  _noncached_shapes = {},

  // A body with a compound shape always has a regular shape as well, so we
  // have track them separately.
  _compound_shapes = {};

  // object reporting
  var REPORT_CHUNKSIZE = void 0,
      // report array is increased in increments of this chunk size
  worldreport = void 0,
      softreport = void 0,
      collisionreport = void 0,
      vehiclereport = void 0,
      constraintreport = void 0;

  var WORLDREPORT_ITEMSIZE = 14,
      // how many float values each reported item needs
  COLLISIONREPORT_ITEMSIZE = 5,
      // one float for each object id, and a Vec3 contact normal
  VEHICLEREPORT_ITEMSIZE = 9,
      // vehicle id, wheel index, 3 for position, 4 for rotation
  CONSTRAINTREPORT_ITEMSIZE = 6; // constraint id, offset object, offset, applied impulse

  var getShapeFromCache = function getShapeFromCache(cache_key) {
    if (_object_shapes[cache_key] !== undefined) return _object_shapes[cache_key];

    return null;
  };

  var setShapeCache = function setShapeCache(cache_key, shape) {
    _object_shapes[cache_key] = shape;
  };

  var createShape = function createShape(description) {
    var shape = void 0;

    _transform.setIdentity();
    switch (description.type) {
      case 'compound':
        {
          shape = new Ammo.btCompoundShape();

          break;
        }
      case 'plane':
        {
          var cache_key = 'plane_' + description.normal.x + '_' + description.normal.y + '_' + description.normal.z;

          if ((shape = getShapeFromCache(cache_key)) === null) {
            _vec3_1.setX(description.normal.x);
            _vec3_1.setY(description.normal.y);
            _vec3_1.setZ(description.normal.z);
            shape = new Ammo.btStaticPlaneShape(_vec3_1, 0);
            setShapeCache(cache_key, shape);
          }

          break;
        }
      case 'box':
        {
          var _cache_key = 'box_' + description.width + '_' + description.height + '_' + description.depth;

          if ((shape = getShapeFromCache(_cache_key)) === null) {
            _vec3_1.setX(description.width / 2);
            _vec3_1.setY(description.height / 2);
            _vec3_1.setZ(description.depth / 2);
            shape = new Ammo.btBoxShape(_vec3_1);
            setShapeCache(_cache_key, shape);
          }

          break;
        }
      case 'sphere':
        {
          var _cache_key2 = 'sphere_' + description.radius;

          if ((shape = getShapeFromCache(_cache_key2)) === null) {
            shape = new Ammo.btSphereShape(description.radius);
            setShapeCache(_cache_key2, shape);
          }

          break;
        }
      case 'cylinder':
        {
          var _cache_key3 = 'cylinder_' + description.width + '_' + description.height + '_' + description.depth;

          if ((shape = getShapeFromCache(_cache_key3)) === null) {
            _vec3_1.setX(description.width / 2);
            _vec3_1.setY(description.height / 2);
            _vec3_1.setZ(description.depth / 2);
            shape = new Ammo.btCylinderShape(_vec3_1);
            setShapeCache(_cache_key3, shape);
          }

          break;
        }
      case 'capsule':
        {
          var _cache_key4 = 'capsule_' + description.radius + '_' + description.height;

          if ((shape = getShapeFromCache(_cache_key4)) === null) {
            // In Bullet, capsule height excludes the end spheres
            shape = new Ammo.btCapsuleShape(description.radius, description.height - 2 * description.radius);
            setShapeCache(_cache_key4, shape);
          }

          break;
        }
      case 'cone':
        {
          var _cache_key5 = 'cone_' + description.radius + '_' + description.height;

          if ((shape = getShapeFromCache(_cache_key5)) === null) {
            shape = new Ammo.btConeShape(description.radius, description.height);
            setShapeCache(_cache_key5, shape);
          }

          break;
        }
      case 'concave':
        {
          var triangle_mesh = new Ammo.btTriangleMesh();
          if (!description.data.length) return false;
          var data = description.data;

          for (var i = 0; i < data.length / 9; i++) {
            _vec3_1.setX(data[i * 9]);
            _vec3_1.setY(data[i * 9 + 1]);
            _vec3_1.setZ(data[i * 9 + 2]);

            _vec3_2.setX(data[i * 9 + 3]);
            _vec3_2.setY(data[i * 9 + 4]);
            _vec3_2.setZ(data[i * 9 + 5]);

            _vec3_3.setX(data[i * 9 + 6]);
            _vec3_3.setY(data[i * 9 + 7]);
            _vec3_3.setZ(data[i * 9 + 8]);

            triangle_mesh.addTriangle(_vec3_1, _vec3_2, _vec3_3, false);
          }

          shape = new Ammo.btBvhTriangleMeshShape(triangle_mesh, true, true);

          _noncached_shapes[description.id] = shape;

          break;
        }
      case 'convex':
        {
          shape = new Ammo.btConvexHullShape();
          var _data = description.data;

          for (var _i = 0; _i < _data.length / 3; _i++) {
            _vec3_1.setX(_data[_i * 3]);
            _vec3_1.setY(_data[_i * 3 + 1]);
            _vec3_1.setZ(_data[_i * 3 + 2]);

            shape.addPoint(_vec3_1);
          }

          _noncached_shapes[description.id] = shape;

          break;
        }
      case 'heightfield':
        {
          var xpts = description.xpts,
              ypts = description.ypts,
              points = description.points,
              ptr = Ammo._malloc(4 * xpts * ypts);

          for (var _i2 = 0, p = 0, p2 = 0; _i2 < xpts; _i2++) {
            for (var j = 0; j < ypts; j++) {
              Ammo.HEAPF32[ptr + p2 >> 2] = points[p];

              p++;
              p2 += 4;
            }
          }

          shape = new Ammo.btHeightfieldTerrainShape(description.xpts, description.ypts, ptr, 1, -description.absMaxHeight, description.absMaxHeight, 1, 'PHY_FLOAT', false);

          _noncached_shapes[description.id] = shape;
          break;
        }
      default:
        // Not recognized
        return;
    }

    return shape;
  };

  var createSoftBody = function createSoftBody(description) {
    var body = void 0;

    var softBodyHelpers = new Ammo.btSoftBodyHelpers();

    switch (description.type) {
      case 'softTrimesh':
        {
          if (!description.aVertices.length) return false;

          body = softBodyHelpers.CreateFromTriMesh(world.getWorldInfo(), description.aVertices, description.aIndices, description.aIndices.length / 3, false);

          break;
        }
      case 'softClothMesh':
        {
          var cr = description.corners;

          body = softBodyHelpers.CreatePatch(world.getWorldInfo(), new Ammo.btVector3(cr[0], cr[1], cr[2]), new Ammo.btVector3(cr[3], cr[4], cr[5]), new Ammo.btVector3(cr[6], cr[7], cr[8]), new Ammo.btVector3(cr[9], cr[10], cr[11]), description.segments[0], description.segments[1], 0, true);

          break;
        }
      case 'softRopeMesh':
        {
          var data = description.data;

          body = softBodyHelpers.CreateRope(world.getWorldInfo(), new Ammo.btVector3(data[0], data[1], data[2]), new Ammo.btVector3(data[3], data[4], data[5]), data[6] - 1, 0);

          break;
        }
      default:
        // Not recognized
        return;
    }

    return body;
  };

  public_functions.init = function () {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (params.noWorker) {
      window.Ammo = new params.ammo();
      public_functions.makeWorld(params);
      return;
    }

    if (params.wasmBuffer) {
      importScripts(params.ammo);

      self.Ammo = new loadAmmoFromBinary(params.wasmBuffer)();
      send({ cmd: 'ammoLoaded' });
      public_functions.makeWorld(params);
    } else {
      importScripts(params.ammo);
      send({ cmd: 'ammoLoaded' });

      self.Ammo = new Ammo();
      public_functions.makeWorld(params);
    }
  };

  public_functions.makeWorld = function () {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _transform = new Ammo.btTransform();
    _transform_pos = new Ammo.btTransform();
    _vec3_1 = new Ammo.btVector3(0, 0, 0);
    _vec3_2 = new Ammo.btVector3(0, 0, 0);
    _vec3_3 = new Ammo.btVector3(0, 0, 0);
    _quat = new Ammo.btQuaternion(0, 0, 0, 0);

    REPORT_CHUNKSIZE = params.reportsize || 50;

    if (SUPPORT_TRANSFERABLE) {
      // Transferable messages are supported, take advantage of them with TypedArrays
      worldreport = new Float32Array(2 + REPORT_CHUNKSIZE * WORLDREPORT_ITEMSIZE); // message id + # of objects to report + chunk size * # of values per object
      collisionreport = new Float32Array(2 + REPORT_CHUNKSIZE * COLLISIONREPORT_ITEMSIZE); // message id + # of collisions to report + chunk size * # of values per object
      vehiclereport = new Float32Array(2 + REPORT_CHUNKSIZE * VEHICLEREPORT_ITEMSIZE); // message id + # of vehicles to report + chunk size * # of values per object
      constraintreport = new Float32Array(2 + REPORT_CHUNKSIZE * CONSTRAINTREPORT_ITEMSIZE); // message id + # of constraints to report + chunk size * # of values per object
    } else {
      // Transferable messages are not supported, send data as normal arrays
      worldreport = [];
      collisionreport = [];
      vehiclereport = [];
      constraintreport = [];
    }

    worldreport[0] = MESSAGE_TYPES.WORLDREPORT;
    collisionreport[0] = MESSAGE_TYPES.COLLISIONREPORT;
    vehiclereport[0] = MESSAGE_TYPES.VEHICLEREPORT;
    constraintreport[0] = MESSAGE_TYPES.CONSTRAINTREPORT;

    var collisionConfiguration = params.softbody ? new Ammo.btSoftBodyRigidBodyCollisionConfiguration() : new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        solver = new Ammo.btSequentialImpulseConstraintSolver();

    var broadphase = void 0;

    if (!params.broadphase) params.broadphase = { type: 'dynamic' };
    // TODO!!!
    /* if (params.broadphase.type === 'sweepprune') {
      extend(params.broadphase, {
        aabbmin: {
          x: -50,
          y: -50,
          z: -50
        },
         aabbmax: {
          x: 50,
          y: 50,
          z: 50
        },
      });
    }*/

    switch (params.broadphase.type) {
      case 'sweepprune':
        _vec3_1.setX(params.broadphase.aabbmin.x);
        _vec3_1.setY(params.broadphase.aabbmin.y);
        _vec3_1.setZ(params.broadphase.aabbmin.z);

        _vec3_2.setX(params.broadphase.aabbmax.x);
        _vec3_2.setY(params.broadphase.aabbmax.y);
        _vec3_2.setZ(params.broadphase.aabbmax.z);

        broadphase = new Ammo.btAxisSweep3(_vec3_1, _vec3_2);

        break;
      case 'dynamic':
      default:
        broadphase = new Ammo.btDbvtBroadphase();
        break;
    }

    world = params.softbody ? new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, new Ammo.btDefaultSoftBodySolver()) : new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    fixedTimeStep = params.fixedTimeStep;

    if (params.softbody) _softbody_enabled = true;

    send({ cmd: 'worldReady' });
  };

  public_functions.setFixedTimeStep = function (description) {
    fixedTimeStep = description;
  };

  public_functions.setGravity = function (description) {
    _vec3_1.setX(description.x);
    _vec3_1.setY(description.y);
    _vec3_1.setZ(description.z);
    world.setGravity(_vec3_1);
  };

  public_functions.appendAnchor = function (description) {
    _objects[description.obj].appendAnchor(description.node, _objects[description.obj2], description.collisionBetweenLinkedBodies, description.influence);
  };

  public_functions.linkNodes = function (description) {
    var self_body = _objects[description.self];
    var other_body = _objects[description.body];

    var self_node = self_body.get_m_nodes().at(description.n1);
    var other_node = other_body.get_m_nodes().at(description.n2);

    var self_vec = self_node.get_m_x();
    var other_vec = other_node.get_m_x();

    var force_x = other_vec.x() - self_vec.x();
    var force_y = other_vec.y() - self_vec.y();
    var force_z = other_vec.z() - self_vec.z();

    // var modifier = 30;

    var cached_distance = void 0,
        linked = false;

    var _loop = setInterval(function () {
      force_x = other_vec.x() - self_vec.x();
      force_y = other_vec.y() - self_vec.y();
      force_z = other_vec.z() - self_vec.z();

      var distance = Math.sqrt(force_x * force_x + force_y * force_y + force_z * force_z);

      if (cached_distance && !linked && cached_distance < distance) {
        // cached_distance && !linked && cached_distance < distance

        linked = true;

        // let self_vel = self_node.get_m_v();
        //
        // _vec3_1.setX(-self_vel.x());
        // _vec3_1.setY(-self_vel.y());
        // _vec3_1.setZ(-self_vel.z());
        //
        // let other_vel = other_node.get_m_v();
        //
        // _vec3_2.setX(-other_vel.x());
        // _vec3_2.setY(-other_vel.y());
        // _vec3_2.setZ(-other_vel.z());

        console.log('link!');

        _vec3_1.setX(0);
        _vec3_1.setY(0);
        _vec3_1.setZ(0);

        self_body.setVelocity(_vec3_1);

        other_body.setVelocity(_vec3_1);

        // self_body.addVelocity(_vec3_1);
        // other_body.addVelocity(_vec3_2);

        // self_relative_x = self_node.x();
        // self_relative_y = self_node.y();
        // self_relative_z = self_node.z();
        //
        // other_relative_x = other_node.x();
        // other_relative_y = other_node.y();
        // other_relative_z = other_node.z();

        // self_relative = new Ammo.btVector3();
        // self_relative.setX();

        // console.log('link!');
        // self_body.appendAnchor(description.n1, connector, true, 0.5);
        // other_body.appendAnchor(description.n2, connector, true, 0.5);
        // clearInterval(_loop);

        // _vec3_1.setX(0);
        // _vec3_1.setY(0);
        // _vec3_1.setZ(0);

        // self_body.setVelocity(_vec3_1);
        // other_body.setVelocity(_vec3_1);

        // other_body.addForce(
        //   _vec3_2,
        //   description.n2
        // );

        // description.modifier *= 1.6;
      }

      var modifer2 = linked ? 40 : 1;

      force_x *= Math.max(distance, 1) * description.modifier * modifer2;
      force_y *= Math.max(distance, 1) * description.modifier * modifer2;
      force_z *= Math.max(distance, 1) * description.modifier * modifer2;

      _vec3_1.setX(force_x);
      _vec3_1.setY(force_y);
      _vec3_1.setZ(force_z);

      _vec3_2.setX(-force_x);
      _vec3_2.setY(-force_y);
      _vec3_2.setZ(-force_z);

      self_body.addVelocity(_vec3_1, description.n1);

      other_body.addVelocity(_vec3_2, description.n2);

      // } else {
      //   // self_relative_x = null;
      // }


      // if (self_relative_x) {
      //   _vec3_1.setX(self_relative_x - self_node.x());
      //   _vec3_1.setY(self_relative_y - self_node.y());
      //   _vec3_1.setZ(self_relative_z - self_node.z());
      //
      //   _vec3_2.setX(other_relative_x - other_node.x());
      //   _vec3_2.setY(other_relative_y - other_node.y());
      //   _vec3_2.setZ(other_relative_z - other_node.z());
      // } else {

      // }


      cached_distance = distance;
    }, 10);
  };

  public_functions.appendLink = function (description) {
    // console.log(Ammo);
    // console.log(new Ammo.Material());

    // var _mat = new Ammo.Material();
    //
    // _mat.set_m_kAST(0);
    // _mat.set_m_kLST(0);
    // _mat.set_m_kVST(0);
    //
    // _objects[description.self].appendLink(
    //   description.n1,
    //   description.n2,
    //   _mat,
    //   false
    // );

    _vec3_1.setX(1000);
    _vec3_1.setY(0);
    _vec3_1.setZ(0);

    _objects[description.self].addForce(_vec3_1, description.n1);
  };

  public_functions.appendLinearJoint = function (description) {
    // console.log('Ammo', Ammo);
    var specs = new Ammo.Specs();
    var _pos = description.specs.position;

    specs.set_position(new Ammo.btVector3(_pos[0], _pos[1], _pos[2]));
    if (description.specs.erp) specs.set_erp(description.specs.erp);
    if (description.specs.cfm) specs.set_cfm(description.specs.cfm);
    if (description.specs.split) specs.set_split(description.specs.split);

    // console.log(specs);
    //
    // // ljoint.set_m_rpos(
    // //   new Ammo.btVector3(_pos1[0], _pos1[1], _pos1[2]),
    // //   new Ammo.btVector3(_pos2[0], _pos2[1], _pos2[2])
    // // );
    //
    // // console.log('ljoint', ljoint);
    //

    // console.log('body', _objects[description.body]);
    _objects[description.self].appendLinearJoint(specs, _objects[description.body]);
  };

  public_functions.addObject = function (description) {
    var body = void 0,
        motionState = void 0;

    if (description.type.indexOf('soft') !== -1) {
      body = createSoftBody(description);

      var sbConfig = body.get_m_cfg();

      if (description.viterations) sbConfig.set_viterations(description.viterations);
      if (description.piterations) sbConfig.set_piterations(description.piterations);
      if (description.diterations) sbConfig.set_diterations(description.diterations);
      if (description.citerations) sbConfig.set_citerations(description.citerations);
      sbConfig.set_collisions(0x11);
      sbConfig.set_kDF(description.friction);
      sbConfig.set_kDP(description.damping);
      if (description.pressure) sbConfig.set_kPR(description.pressure);
      if (description.drag) sbConfig.set_kDG(description.drag);
      if (description.lift) sbConfig.set_kLF(description.lift);
      if (description.anchorHardness) sbConfig.set_kAHR(description.anchorHardness);
      if (description.rigidHardness) sbConfig.set_kCHR(description.rigidHardness);

      if (description.klst) body.get_m_materials().at(0).set_m_kLST(description.klst);
      if (description.kast) body.get_m_materials().at(0).set_m_kAST(description.kast);
      if (description.kvst) body.get_m_materials().at(0).set_m_kVST(description.kvst);

      Ammo.castObject(body, Ammo.btCollisionObject).getCollisionShape().setMargin(typeof description.margin !== 'undefined' ? description.margin : 0.1);

      // Ammo.castObject(body, Ammo.btCollisionObject).getCollisionShape().setMargin(0);

      // Ammo.castObject(body, Ammo.btCollisionObject).getCollisionShape().setLocalScaling(_vec3_1);
      body.setActivationState(description.state || 4);
      body.type = 0; // SoftBody.
      if (description.type === 'softRopeMesh') body.rope = true;
      if (description.type === 'softClothMesh') body.cloth = true;

      _transform.setIdentity();

      // @test
      _quat.setX(description.rotation.x);
      _quat.setY(description.rotation.y);
      _quat.setZ(description.rotation.z);
      _quat.setW(description.rotation.w);
      body.rotate(_quat);

      _vec3_1.setX(description.position.x);
      _vec3_1.setY(description.position.y);
      _vec3_1.setZ(description.position.z);
      body.translate(_vec3_1);

      _vec3_1.setX(description.scale.x);
      _vec3_1.setY(description.scale.y);
      _vec3_1.setZ(description.scale.z);
      body.scale(_vec3_1);

      body.setTotalMass(description.mass, false);
      world.addSoftBody(body, 1, -1);
      if (description.type === 'softTrimesh') _softbody_report_size += body.get_m_faces().size() * 3;else if (description.type === 'softRopeMesh') _softbody_report_size += body.get_m_nodes().size();else _softbody_report_size += body.get_m_nodes().size() * 3;

      _num_softbody_objects++;
    } else {
      var shape = createShape(description);

      if (!shape) return;

      // If there are children then this is a compound shape
      if (description.children) {
        var compound_shape = new Ammo.btCompoundShape();
        compound_shape.addChildShape(_transform, shape);

        for (var i = 0; i < description.children.length; i++) {
          var _child = description.children[i];

          var trans = new Ammo.btTransform();
          trans.setIdentity();

          _vec3_1.setX(_child.position_offset.x);
          _vec3_1.setY(_child.position_offset.y);
          _vec3_1.setZ(_child.position_offset.z);
          trans.setOrigin(_vec3_1);

          _quat.setX(_child.rotation.x);
          _quat.setY(_child.rotation.y);
          _quat.setZ(_child.rotation.z);
          _quat.setW(_child.rotation.w);
          trans.setRotation(_quat);

          shape = createShape(description.children[i]);
          compound_shape.addChildShape(trans, shape);
          Ammo.destroy(trans);
        }

        shape = compound_shape;
        _compound_shapes[description.id] = shape;
      }

      _vec3_1.setX(description.scale.x);
      _vec3_1.setY(description.scale.y);
      _vec3_1.setZ(description.scale.z);

      shape.setLocalScaling(_vec3_1);
      shape.setMargin(typeof description.margin !== 'undefined' ? description.margin : 0);

      _vec3_1.setX(0);
      _vec3_1.setY(0);
      _vec3_1.setZ(0);
      shape.calculateLocalInertia(description.mass, _vec3_1);

      _transform.setIdentity();

      _vec3_2.setX(description.position.x);
      _vec3_2.setY(description.position.y);
      _vec3_2.setZ(description.position.z);
      _transform.setOrigin(_vec3_2);

      _quat.setX(description.rotation.x);
      _quat.setY(description.rotation.y);
      _quat.setZ(description.rotation.z);
      _quat.setW(description.rotation.w);
      _transform.setRotation(_quat);

      motionState = new Ammo.btDefaultMotionState(_transform); // #TODO: btDefaultMotionState supports center of mass offset as second argument - implement
      var rbInfo = new Ammo.btRigidBodyConstructionInfo(description.mass, motionState, shape, _vec3_1);

      rbInfo.set_m_friction(description.friction);
      rbInfo.set_m_restitution(description.restitution);
      rbInfo.set_m_linearDamping(description.damping);
      rbInfo.set_m_angularDamping(description.damping);

      body = new Ammo.btRigidBody(rbInfo);
      body.setActivationState(description.state || 4);
      Ammo.destroy(rbInfo);

      if (typeof description.collision_flags !== 'undefined') body.setCollisionFlags(description.collision_flags);

      if (description.group && description.mask) world.addRigidBody(body, description.group, description.mask);else world.addRigidBody(body);
      body.type = 1; // RigidBody.
      _num_rigidbody_objects++;
    }

    body.activate();

    body.id = description.id;
    _objects[body.id] = body;
    _motion_states[body.id] = motionState;

    _objects_ammo[body.a === undefined ? body.ptr : body.a] = body.id;
    _num_objects++;

    send({ cmd: 'objectReady', params: body.id });
  };

  public_functions.addVehicle = function (description) {
    var vehicle_tuning = new Ammo.btVehicleTuning();

    vehicle_tuning.set_m_suspensionStiffness(description.suspension_stiffness);
    vehicle_tuning.set_m_suspensionCompression(description.suspension_compression);
    vehicle_tuning.set_m_suspensionDamping(description.suspension_damping);
    vehicle_tuning.set_m_maxSuspensionTravelCm(description.max_suspension_travel);
    vehicle_tuning.set_m_maxSuspensionForce(description.max_suspension_force);

    var vehicle = new Ammo.btRaycastVehicle(vehicle_tuning, _objects[description.rigidBody], new Ammo.btDefaultVehicleRaycaster(world));

    vehicle.tuning = vehicle_tuning;
    _objects[description.rigidBody].setActivationState(4);
    vehicle.setCoordinateSystem(0, 1, 2);

    world.addVehicle(vehicle);
    _vehicles[description.id] = vehicle;
  };
  public_functions.removeVehicle = function (description) {
    _vehicles[description.id] = null;
  };

  public_functions.addWheel = function (description) {
    if (_vehicles[description.id] !== undefined) {
      var tuning = _vehicles[description.id].tuning;
      if (description.tuning !== undefined) {
        tuning = new Ammo.btVehicleTuning();
        tuning.set_m_suspensionStiffness(description.tuning.suspension_stiffness);
        tuning.set_m_suspensionCompression(description.tuning.suspension_compression);
        tuning.set_m_suspensionDamping(description.tuning.suspension_damping);
        tuning.set_m_maxSuspensionTravelCm(description.tuning.max_suspension_travel);
        tuning.set_m_maxSuspensionForce(description.tuning.max_suspension_force);
      }

      _vec3_1.setX(description.connection_point.x);
      _vec3_1.setY(description.connection_point.y);
      _vec3_1.setZ(description.connection_point.z);

      _vec3_2.setX(description.wheel_direction.x);
      _vec3_2.setY(description.wheel_direction.y);
      _vec3_2.setZ(description.wheel_direction.z);

      _vec3_3.setX(description.wheel_axle.x);
      _vec3_3.setY(description.wheel_axle.y);
      _vec3_3.setZ(description.wheel_axle.z);

      _vehicles[description.id].addWheel(_vec3_1, _vec3_2, _vec3_3, description.suspension_rest_length, description.wheel_radius, tuning, description.is_front_wheel);
    }

    _num_wheels++;

    if (SUPPORT_TRANSFERABLE) {
      vehiclereport = new Float32Array(1 + _num_wheels * VEHICLEREPORT_ITEMSIZE); // message id & ( # of objects to report * # of values per object )
      vehiclereport[0] = MESSAGE_TYPES.VEHICLEREPORT;
    } else vehiclereport = [MESSAGE_TYPES.VEHICLEREPORT];
  };

  public_functions.setSteering = function (details) {
    if (_vehicles[details.id] !== undefined) _vehicles[details.id].setSteeringValue(details.steering, details.wheel);
  };

  public_functions.setBrake = function (details) {
    if (_vehicles[details.id] !== undefined) _vehicles[details.id].setBrake(details.brake, details.wheel);
  };

  public_functions.applyEngineForce = function (details) {
    if (_vehicles[details.id] !== undefined) _vehicles[details.id].applyEngineForce(details.force, details.wheel);
  };

  public_functions.removeObject = function (details) {
    if (_objects[details.id].type === 0) {
      _num_softbody_objects--;
      _softbody_report_size -= _objects[details.id].get_m_nodes().size();
      world.removeSoftBody(_objects[details.id]);
    } else if (_objects[details.id].type === 1) {
      _num_rigidbody_objects--;
      world.removeRigidBody(_objects[details.id]);
      Ammo.destroy(_motion_states[details.id]);
    }

    Ammo.destroy(_objects[details.id]);
    if (_compound_shapes[details.id]) Ammo.destroy(_compound_shapes[details.id]);
    if (_noncached_shapes[details.id]) Ammo.destroy(_noncached_shapes[details.id]);

    _objects_ammo[_objects[details.id].a === undefined ? _objects[details.id].a : _objects[details.id].ptr] = null;
    _objects[details.id] = null;
    _motion_states[details.id] = null;

    if (_compound_shapes[details.id]) _compound_shapes[details.id] = null;
    if (_noncached_shapes[details.id]) _noncached_shapes[details.id] = null;
    _num_objects--;
  };

  public_functions.updateTransform = function (details) {
    _object = _objects[details.id];

    if (_object.type === 1) {
      _object.getMotionState().getWorldTransform(_transform);

      if (details.pos) {
        _vec3_1.setX(details.pos.x);
        _vec3_1.setY(details.pos.y);
        _vec3_1.setZ(details.pos.z);
        _transform.setOrigin(_vec3_1);
      }

      if (details.quat) {
        _quat.setX(details.quat.x);
        _quat.setY(details.quat.y);
        _quat.setZ(details.quat.z);
        _quat.setW(details.quat.w);
        _transform.setRotation(_quat);
      }

      _object.setWorldTransform(_transform);
      _object.activate();
    } else if (_object.type === 0) {
      // _object.getWorldTransform(_transform);

      if (details.pos) {
        _vec3_1.setX(details.pos.x);
        _vec3_1.setY(details.pos.y);
        _vec3_1.setZ(details.pos.z);
        _transform.setOrigin(_vec3_1);
      }

      if (details.quat) {
        _quat.setX(details.quat.x);
        _quat.setY(details.quat.y);
        _quat.setZ(details.quat.z);
        _quat.setW(details.quat.w);
        _transform.setRotation(_quat);
      }

      _object.transform(_transform);
    }
  };

  public_functions.updateMass = function (details) {
    // #TODO: changing a static object into dynamic is buggy
    _object = _objects[details.id];

    // Per http://www.bulletphysics.org/Bullet/phpBB3/viewtopic.php?p=&f=9&t=3663#p13816
    world.removeRigidBody(_object);

    _vec3_1.setX(0);
    _vec3_1.setY(0);
    _vec3_1.setZ(0);

    _object.setMassProps(details.mass, _vec3_1);
    world.addRigidBody(_object);
    _object.activate();
  };

  public_functions.applyCentralImpulse = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].applyCentralImpulse(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.applyImpulse = function (details) {
    _vec3_1.setX(details.impulse_x);
    _vec3_1.setY(details.impulse_y);
    _vec3_1.setZ(details.impulse_z);

    _vec3_2.setX(details.x);
    _vec3_2.setY(details.y);
    _vec3_2.setZ(details.z);

    _objects[details.id].applyImpulse(_vec3_1, _vec3_2);
    _objects[details.id].activate();
  };

  public_functions.applyTorque = function (details) {
    _vec3_1.setX(details.torque_x);
    _vec3_1.setY(details.torque_y);
    _vec3_1.setZ(details.torque_z);

    _objects[details.id].applyTorque(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.applyCentralForce = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].applyCentralForce(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.applyForce = function (details) {
    _vec3_1.setX(details.force_x);
    _vec3_1.setY(details.force_y);
    _vec3_1.setZ(details.force_z);

    _vec3_2.setX(details.x);
    _vec3_2.setY(details.y);
    _vec3_2.setZ(details.z);

    _objects[details.id].applyForce(_vec3_1, _vec3_2);
    _objects[details.id].activate();
  };

  public_functions.onSimulationResume = function () {
  };

  public_functions.setAngularVelocity = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].setAngularVelocity(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.setLinearVelocity = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].setLinearVelocity(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.setAngularFactor = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].setAngularFactor(_vec3_1);
  };

  public_functions.setLinearFactor = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].setLinearFactor(_vec3_1);
  };

  public_functions.setDamping = function (details) {
    _objects[details.id].setDamping(details.linear, details.angular);
  };

  public_functions.setCcdMotionThreshold = function (details) {
    _objects[details.id].setCcdMotionThreshold(details.threshold);
  };

  public_functions.setCcdSweptSphereRadius = function (details) {
    _objects[details.id].setCcdSweptSphereRadius(details.radius);
  };

  public_functions.addConstraint = function (details) {
    var constraint = void 0;

    switch (details.type) {

      case 'point':
        {
          if (details.objectb === undefined) {
            _vec3_1.setX(details.positiona.x);
            _vec3_1.setY(details.positiona.y);
            _vec3_1.setZ(details.positiona.z);

            constraint = new Ammo.btPoint2PointConstraint(_objects[details.objecta], _vec3_1);
          } else {
            _vec3_1.setX(details.positiona.x);
            _vec3_1.setY(details.positiona.y);
            _vec3_1.setZ(details.positiona.z);

            _vec3_2.setX(details.positionb.x);
            _vec3_2.setY(details.positionb.y);
            _vec3_2.setZ(details.positionb.z);

            constraint = new Ammo.btPoint2PointConstraint(_objects[details.objecta], _objects[details.objectb], _vec3_1, _vec3_2);
          }
          break;
        }
      case 'hinge':
        {
          if (details.objectb === undefined) {
            _vec3_1.setX(details.positiona.x);
            _vec3_1.setY(details.positiona.y);
            _vec3_1.setZ(details.positiona.z);

            _vec3_2.setX(details.axis.x);
            _vec3_2.setY(details.axis.y);
            _vec3_2.setZ(details.axis.z);

            constraint = new Ammo.btHingeConstraint(_objects[details.objecta], _vec3_1, _vec3_2);
          } else {
            _vec3_1.setX(details.positiona.x);
            _vec3_1.setY(details.positiona.y);
            _vec3_1.setZ(details.positiona.z);

            _vec3_2.setX(details.positionb.x);
            _vec3_2.setY(details.positionb.y);
            _vec3_2.setZ(details.positionb.z);

            _vec3_3.setX(details.axis.x);
            _vec3_3.setY(details.axis.y);
            _vec3_3.setZ(details.axis.z);

            constraint = new Ammo.btHingeConstraint(_objects[details.objecta], _objects[details.objectb], _vec3_1, _vec3_2, _vec3_3, _vec3_3);
          }
          break;
        }
      case 'slider':
        {
          var transformb = void 0;
          var transforma = new Ammo.btTransform();

          _vec3_1.setX(details.positiona.x);
          _vec3_1.setY(details.positiona.y);
          _vec3_1.setZ(details.positiona.z);

          transforma.setOrigin(_vec3_1);

          var rotation = transforma.getRotation();
          rotation.setEuler(details.axis.x, details.axis.y, details.axis.z);
          transforma.setRotation(rotation);

          if (details.objectb) {
            transformb = new Ammo.btTransform();

            _vec3_2.setX(details.positionb.x);
            _vec3_2.setY(details.positionb.y);
            _vec3_2.setZ(details.positionb.z);

            transformb.setOrigin(_vec3_2);

            rotation = transformb.getRotation();
            rotation.setEuler(details.axis.x, details.axis.y, details.axis.z);
            transformb.setRotation(rotation);

            constraint = new Ammo.btSliderConstraint(_objects[details.objecta], _objects[details.objectb], transforma, transformb, true);
          } else {
            constraint = new Ammo.btSliderConstraint(_objects[details.objecta], transforma, true);
          }

          constraint.ta = transforma;
          constraint.tb = transformb;

          Ammo.destroy(transforma);
          if (transformb !== undefined) Ammo.destroy(transformb);

          break;
        }
      case 'conetwist':
        {
          var _transforma = new Ammo.btTransform();
          _transforma.setIdentity();

          var _transformb = new Ammo.btTransform();
          _transformb.setIdentity();

          _vec3_1.setX(details.positiona.x);
          _vec3_1.setY(details.positiona.y);
          _vec3_1.setZ(details.positiona.z);

          _vec3_2.setX(details.positionb.x);
          _vec3_2.setY(details.positionb.y);
          _vec3_2.setZ(details.positionb.z);

          _transforma.setOrigin(_vec3_1);
          _transformb.setOrigin(_vec3_2);

          var _rotation = _transforma.getRotation();
          _rotation.setEulerZYX(-details.axisa.z, -details.axisa.y, -details.axisa.x);
          _transforma.setRotation(_rotation);

          _rotation = _transformb.getRotation();
          _rotation.setEulerZYX(-details.axisb.z, -details.axisb.y, -details.axisb.x);
          _transformb.setRotation(_rotation);

          constraint = new Ammo.btConeTwistConstraint(_objects[details.objecta], _objects[details.objectb], _transforma, _transformb);

          constraint.setLimit(Math.PI, 0, Math.PI);

          constraint.ta = _transforma;
          constraint.tb = _transformb;

          Ammo.destroy(_transforma);
          Ammo.destroy(_transformb);

          break;
        }
      case 'dof':
        {
          var _transformb2 = void 0;

          var _transforma2 = new Ammo.btTransform();
          _transforma2.setIdentity();

          _vec3_1.setX(details.positiona.x);
          _vec3_1.setY(details.positiona.y);
          _vec3_1.setZ(details.positiona.z);

          _transforma2.setOrigin(_vec3_1);

          var _rotation2 = _transforma2.getRotation();
          _rotation2.setEulerZYX(-details.axisa.z, -details.axisa.y, -details.axisa.x);
          _transforma2.setRotation(_rotation2);

          if (details.objectb) {
            _transformb2 = new Ammo.btTransform();
            _transformb2.setIdentity();

            _vec3_2.setX(details.positionb.x);
            _vec3_2.setY(details.positionb.y);
            _vec3_2.setZ(details.positionb.z);

            _transformb2.setOrigin(_vec3_2);

            _rotation2 = _transformb2.getRotation();
            _rotation2.setEulerZYX(-details.axisb.z, -details.axisb.y, -details.axisb.x);
            _transformb2.setRotation(_rotation2);

            constraint = new Ammo.btGeneric6DofConstraint(_objects[details.objecta], _objects[details.objectb], _transforma2, _transformb2, true);
          } else {
            constraint = new Ammo.btGeneric6DofConstraint(_objects[details.objecta], _transforma2, true);
          }

          constraint.ta = _transforma2;
          constraint.tb = _transformb2;

          Ammo.destroy(_transforma2);
          if (_transformb2 !== undefined) Ammo.destroy(_transformb2);

          break;
        }
      default:
        return;
    }

    world.addConstraint(constraint);

    constraint.a = _objects[details.objecta];
    constraint.b = _objects[details.objectb];

    constraint.enableFeedback();
    _constraints[details.id] = constraint;
    _num_constraints++;

    if (SUPPORT_TRANSFERABLE) {
      constraintreport = new Float32Array(1 + _num_constraints * CONSTRAINTREPORT_ITEMSIZE); // message id & ( # of objects to report * # of values per object )
      constraintreport[0] = MESSAGE_TYPES.CONSTRAINTREPORT;
    } else constraintreport = [MESSAGE_TYPES.CONSTRAINTREPORT];
  };

  public_functions.removeConstraint = function (details) {
    var constraint = _constraints[details.id];

    if (constraint !== undefined) {
      world.removeConstraint(constraint);
      _constraints[details.id] = null;
      _num_constraints--;
    }
  };

  public_functions.constraint_setBreakingImpulseThreshold = function (details) {
    var constraint = _constraints[details.id];
    if (constraint !== undefined) constraint.setBreakingImpulseThreshold(details.threshold);
  };

  public_functions.simulate = function () {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (world) {
      if (params.timeStep && params.timeStep < fixedTimeStep) params.timeStep = fixedTimeStep;

      params.maxSubSteps = params.maxSubSteps || Math.ceil(params.timeStep / fixedTimeStep); // If maxSubSteps is not defined, keep the simulation fully up to date

      world.stepSimulation(params.timeStep, params.maxSubSteps, fixedTimeStep);

      if (_vehicles.length > 0) reportVehicles();
      reportCollisions();
      if (_constraints.length > 0) reportConstraints();
      reportWorld();
      if (_softbody_enabled) reportWorld_softbodies();
    }
  };

  // Constraint functions
  public_functions.hinge_setLimits = function (params) {
    _constraints[params.constraint].setLimit(params.low, params.high, 0, params.bias_factor, params.relaxation_factor);
  };

  public_functions.hinge_enableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.enableAngularMotor(true, params.velocity, params.acceleration);
    constraint.a.activate();
    if (constraint.b) constraint.b.activate();
  };

  public_functions.hinge_disableMotor = function (params) {
    _constraints[params.constraint].enableMotor(false);
    if (constraint.b) constraint.b.activate();
  };

  public_functions.slider_setLimits = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setLowerLinLimit(params.lin_lower || 0);
    constraint.setUpperLinLimit(params.lin_upper || 0);

    constraint.setLowerAngLimit(params.ang_lower || 0);
    constraint.setUpperAngLimit(params.ang_upper || 0);
  };

  public_functions.slider_setRestitution = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setSoftnessLimLin(params.linear || 0);
    constraint.setSoftnessLimAng(params.angular || 0);
  };

  public_functions.slider_enableLinearMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setTargetLinMotorVelocity(params.velocity);
    constraint.setMaxLinMotorForce(params.acceleration);
    constraint.setPoweredLinMotor(true);
    constraint.a.activate();
    if (constraint.b) constraint.b.activate();
  };

  public_functions.slider_disableLinearMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setPoweredLinMotor(false);
    if (constraint.b) constraint.b.activate();
  };

  public_functions.slider_enableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setTargetAngMotorVelocity(params.velocity);
    constraint.setMaxAngMotorForce(params.acceleration);
    constraint.setPoweredAngMotor(true);
    constraint.a.activate();
    if (constraint.b) constraint.b.activate();
  };

  public_functions.slider_disableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setPoweredAngMotor(false);
    constraint.a.activate();
    if (constraint.b) constraint.b.activate();
  };

  public_functions.conetwist_setLimit = function (params) {
    _constraints[params.constraint].setLimit(params.z, params.y, params.x); // ZYX order
  };

  public_functions.conetwist_enableMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.enableMotor(true);
    constraint.a.activate();
    constraint.b.activate();
  };

  public_functions.conetwist_setMaxMotorImpulse = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setMaxMotorImpulse(params.max_impulse);
    constraint.a.activate();
    constraint.b.activate();
  };

  public_functions.conetwist_setMotorTarget = function (params) {
    var constraint = _constraints[params.constraint];

    _quat.setX(params.x);
    _quat.setY(params.y);
    _quat.setZ(params.z);
    _quat.setW(params.w);

    constraint.setMotorTarget(_quat);

    constraint.a.activate();
    constraint.b.activate();
  };

  public_functions.conetwist_disableMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.enableMotor(false);
    constraint.a.activate();
    constraint.b.activate();
  };

  public_functions.dof_setLinearLowerLimit = function (params) {
    var constraint = _constraints[params.constraint];

    _vec3_1.setX(params.x);
    _vec3_1.setY(params.y);
    _vec3_1.setZ(params.z);

    constraint.setLinearLowerLimit(_vec3_1);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_setLinearUpperLimit = function (params) {
    var constraint = _constraints[params.constraint];

    _vec3_1.setX(params.x);
    _vec3_1.setY(params.y);
    _vec3_1.setZ(params.z);

    constraint.setLinearUpperLimit(_vec3_1);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_setAngularLowerLimit = function (params) {
    var constraint = _constraints[params.constraint];

    _vec3_1.setX(params.x);
    _vec3_1.setY(params.y);
    _vec3_1.setZ(params.z);

    constraint.setAngularLowerLimit(_vec3_1);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_setAngularUpperLimit = function (params) {
    var constraint = _constraints[params.constraint];

    _vec3_1.setX(params.x);
    _vec3_1.setY(params.y);
    _vec3_1.setZ(params.z);

    constraint.setAngularUpperLimit(_vec3_1);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_enableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint];

    var motor = constraint.getRotationalLimitMotor(params.which);
    motor.set_m_enableMotor(true);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_configureAngularMotor = function (params) {
    var constraint = _constraints[params.constraint],
        motor = constraint.getRotationalLimitMotor(params.which);

    motor.set_m_loLimit(params.low_angle);
    motor.set_m_hiLimit(params.high_angle);
    motor.set_m_targetVelocity(params.velocity);
    motor.set_m_maxMotorForce(params.max_force);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_disableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint],
        motor = constraint.getRotationalLimitMotor(params.which);

    motor.set_m_enableMotor(false);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  var reportWorld = function reportWorld() {
    if (SUPPORT_TRANSFERABLE && worldreport.length < 2 + _num_rigidbody_objects * WORLDREPORT_ITEMSIZE) {
      worldreport = new Float32Array(2 // message id & # objects in report
      + Math.ceil(_num_rigidbody_objects / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE * WORLDREPORT_ITEMSIZE // # of values needed * item size
      );

      worldreport[0] = MESSAGE_TYPES.WORLDREPORT;
    }

    worldreport[1] = _num_rigidbody_objects; // record how many objects we're reporting on

    {
      var i = 0,
          index = _objects.length;

      while (index--) {
        var object = _objects[index];

        if (object && object.type === 1) {
          // RigidBodies.
          // #TODO: we can't use center of mass transform when center of mass can change,
          //        but getMotionState().getWorldTransform() screws up on objects that have been moved
          // object.getMotionState().getWorldTransform( transform );
          // object.getMotionState().getWorldTransform(_transform);

          var transform = object.getCenterOfMassTransform();
          var origin = transform.getOrigin();
          var rotation = transform.getRotation();

          // add values to report
          var offset = 2 + i++ * WORLDREPORT_ITEMSIZE;

          worldreport[offset] = object.id;

          worldreport[offset + 1] = origin.x();
          worldreport[offset + 2] = origin.y();
          worldreport[offset + 3] = origin.z();

          worldreport[offset + 4] = rotation.x();
          worldreport[offset + 5] = rotation.y();
          worldreport[offset + 6] = rotation.z();
          worldreport[offset + 7] = rotation.w();

          _vector = object.getLinearVelocity();
          worldreport[offset + 8] = _vector.x();
          worldreport[offset + 9] = _vector.y();
          worldreport[offset + 10] = _vector.z();

          _vector = object.getAngularVelocity();
          worldreport[offset + 11] = _vector.x();
          worldreport[offset + 12] = _vector.y();
          worldreport[offset + 13] = _vector.z();
        }
      }
    }

    if (SUPPORT_TRANSFERABLE) send(worldreport.buffer, [worldreport.buffer]);else send(worldreport);
  };

  var reportWorld_softbodies = function reportWorld_softbodies() {
    // TODO: Add SUPPORTTRANSFERABLE.

    softreport = new Float32Array(2 // message id & # objects in report
    + _num_softbody_objects * 2 + _softbody_report_size * 6);

    softreport[0] = MESSAGE_TYPES.SOFTREPORT;
    softreport[1] = _num_softbody_objects; // record how many objects we're reporting on

    {
      var offset = 2,
          index = _objects.length;

      while (index--) {
        var object = _objects[index];

        if (object && object.type === 0) {
          // SoftBodies.

          softreport[offset] = object.id;

          var offsetVert = offset + 2;

          if (object.rope === true) {
            var nodes = object.get_m_nodes();
            var size = nodes.size();
            softreport[offset + 1] = size;

            for (var i = 0; i < size; i++) {
              var node = nodes.at(i);
              var vert = node.get_m_x();
              var off = offsetVert + i * 3;

              softreport[off] = vert.x();
              softreport[off + 1] = vert.y();
              softreport[off + 2] = vert.z();
            }

            offset += size * 3 + 2;
          } else if (object.cloth) {
            var _nodes = object.get_m_nodes();
            var _size = _nodes.size();
            softreport[offset + 1] = _size;

            for (var _i3 = 0; _i3 < _size; _i3++) {
              var _node = _nodes.at(_i3);
              var _vert = _node.get_m_x();
              var normal = _node.get_m_n();
              var _off = offsetVert + _i3 * 6;

              softreport[_off] = _vert.x();
              softreport[_off + 1] = _vert.y();
              softreport[_off + 2] = _vert.z();

              softreport[_off + 3] = -normal.x();
              softreport[_off + 4] = -normal.y();
              softreport[_off + 5] = -normal.z();
            }

            offset += _size * 6 + 2;
          } else {
            var faces = object.get_m_faces();
            var _size2 = faces.size();
            softreport[offset + 1] = _size2;

            for (var _i4 = 0; _i4 < _size2; _i4++) {
              var face = faces.at(_i4);

              var node1 = face.get_m_n(0);
              var node2 = face.get_m_n(1);
              var node3 = face.get_m_n(2);

              var vert1 = node1.get_m_x();
              var vert2 = node2.get_m_x();
              var vert3 = node3.get_m_x();

              var normal1 = node1.get_m_n();
              var normal2 = node2.get_m_n();
              var normal3 = node3.get_m_n();

              var _off2 = offsetVert + _i4 * 18;

              softreport[_off2] = vert1.x();
              softreport[_off2 + 1] = vert1.y();
              softreport[_off2 + 2] = vert1.z();

              softreport[_off2 + 3] = normal1.x();
              softreport[_off2 + 4] = normal1.y();
              softreport[_off2 + 5] = normal1.z();

              softreport[_off2 + 6] = vert2.x();
              softreport[_off2 + 7] = vert2.y();
              softreport[_off2 + 8] = vert2.z();

              softreport[_off2 + 9] = normal2.x();
              softreport[_off2 + 10] = normal2.y();
              softreport[_off2 + 11] = normal2.z();

              softreport[_off2 + 12] = vert3.x();
              softreport[_off2 + 13] = vert3.y();
              softreport[_off2 + 14] = vert3.z();

              softreport[_off2 + 15] = normal3.x();
              softreport[_off2 + 16] = normal3.y();
              softreport[_off2 + 17] = normal3.z();
            }

            offset += _size2 * 18 + 2;
          }
        }
      }
    }

    // if (SUPPORT_TRANSFERABLE) send(softreport.buffer, [softreport.buffer]);
    // else send(softreport);
    send(softreport);
  };

  var reportCollisions = function reportCollisions() {
    var dp = world.getDispatcher(),
        num = dp.getNumManifolds();
    // _collided = false;

    if (SUPPORT_TRANSFERABLE) {
      if (collisionreport.length < 2 + num * COLLISIONREPORT_ITEMSIZE) {
        collisionreport = new Float32Array(2 // message id & # objects in report
        + Math.ceil(_num_objects / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE * COLLISIONREPORT_ITEMSIZE // # of values needed * item size
        );
        collisionreport[0] = MESSAGE_TYPES.COLLISIONREPORT;
      }
    }

    collisionreport[1] = 0; // how many collisions we're reporting on

    for (var i = 0; i < num; i++) {
      var manifold = dp.getManifoldByIndexInternal(i),
          num_contacts = manifold.getNumContacts();

      if (num_contacts === 0) continue;

      for (var j = 0; j < num_contacts; j++) {
        var pt = manifold.getContactPoint(j);

        // if ( pt.getDistance() < 0 ) {
        var offset = 2 + collisionreport[1]++ * COLLISIONREPORT_ITEMSIZE;
        collisionreport[offset] = _objects_ammo[manifold.getBody0().ptr];
        collisionreport[offset + 1] = _objects_ammo[manifold.getBody1().ptr];

        _vector = pt.get_m_normalWorldOnB();
        collisionreport[offset + 2] = _vector.x();
        collisionreport[offset + 3] = _vector.y();
        collisionreport[offset + 4] = _vector.z();
        break;
        // }
        // send(_objects_ammo);
      }
    }

    if (SUPPORT_TRANSFERABLE) send(collisionreport.buffer, [collisionreport.buffer]);else send(collisionreport);
  };

  var reportVehicles = function reportVehicles() {
    if (SUPPORT_TRANSFERABLE) {
      if (vehiclereport.length < 2 + _num_wheels * VEHICLEREPORT_ITEMSIZE) {
        vehiclereport = new Float32Array(2 // message id & # objects in report
        + Math.ceil(_num_wheels / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE * VEHICLEREPORT_ITEMSIZE // # of values needed * item size
        );
        vehiclereport[0] = MESSAGE_TYPES.VEHICLEREPORT;
      }
    }

    {
      var i = 0,
          j = 0,
          index = _vehicles.length;

      while (index--) {
        if (_vehicles[index]) {
          var vehicle = _vehicles[index];

          for (j = 0; j < vehicle.getNumWheels(); j++) {
            // vehicle.updateWheelTransform( j, true );
            // transform = vehicle.getWheelTransformWS( j );
            var transform = vehicle.getWheelInfo(j).get_m_worldTransform();

            var origin = transform.getOrigin();
            var rotation = transform.getRotation();

            // add values to report
            var offset = 1 + i++ * VEHICLEREPORT_ITEMSIZE;

            vehiclereport[offset] = index;
            vehiclereport[offset + 1] = j;

            vehiclereport[offset + 2] = origin.x();
            vehiclereport[offset + 3] = origin.y();
            vehiclereport[offset + 4] = origin.z();

            vehiclereport[offset + 5] = rotation.x();
            vehiclereport[offset + 6] = rotation.y();
            vehiclereport[offset + 7] = rotation.z();
            vehiclereport[offset + 8] = rotation.w();
          }
        }
      }

      if (SUPPORT_TRANSFERABLE && j !== 0) send(vehiclereport.buffer, [vehiclereport.buffer]);else if (j !== 0) send(vehiclereport);
    }
  };

  var reportConstraints = function reportConstraints() {
    if (SUPPORT_TRANSFERABLE) {
      if (constraintreport.length < 2 + _num_constraints * CONSTRAINTREPORT_ITEMSIZE) {
        constraintreport = new Float32Array(2 // message id & # objects in report
        + Math.ceil(_num_constraints / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE * CONSTRAINTREPORT_ITEMSIZE // # of values needed * item size
        );
        constraintreport[0] = MESSAGE_TYPES.CONSTRAINTREPORT;
      }
    }

    {
      var offset = 0,
          i = 0,
          index = _constraints.lenght;

      while (index--) {
        if (_constraints[index]) {
          var _constraint = _constraints[index];
          var offset_body = _constraint.a;
          var transform = _constraint.ta;
          var origin = transform.getOrigin();

          // add values to report
          offset = 1 + i++ * CONSTRAINTREPORT_ITEMSIZE;

          constraintreport[offset] = index;
          constraintreport[offset + 1] = offset_body.id;
          constraintreport[offset + 2] = origin.x;
          constraintreport[offset + 3] = origin.y;
          constraintreport[offset + 4] = origin.z;
          constraintreport[offset + 5] = _constraint.getBreakingImpulseThreshold();
        }
      }

      if (SUPPORT_TRANSFERABLE && i !== 0) send(constraintreport.buffer, [constraintreport.buffer]);else if (i !== 0) send(constraintreport);
    }
  };

  self.onmessage = function (event) {
    if (event.data instanceof Float32Array) {
      // transferable object
      switch (event.data[0]) {
        case MESSAGE_TYPES.WORLDREPORT:
          {
            worldreport = new Float32Array(event.data);
            break;
          }
        case MESSAGE_TYPES.COLLISIONREPORT:
          {
            collisionreport = new Float32Array(event.data);
            break;
          }
        case MESSAGE_TYPES.VEHICLEREPORT:
          {
            vehiclereport = new Float32Array(event.data);
            break;
          }
        case MESSAGE_TYPES.CONSTRAINTREPORT:
          {
            constraintreport = new Float32Array(event.data);
            break;
          }
        default:
      }

      return;
    } else if (event.data.cmd && public_functions[event.data.cmd]) public_functions[event.data.cmd](event.data.params);
  };

  self.receive = self.onmessage;
});

var WorldModule = function (_WorldModuleBase) {
  inherits(WorldModule, _WorldModuleBase);

  function WorldModule() {
    var _ref;

    classCallCheck(this, WorldModule);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = possibleConstructorReturn(this, (_ref = WorldModule.__proto__ || Object.getPrototypeOf(WorldModule)).call.apply(_ref, [this].concat(args)));

    _this.worker = new PhysicsWorker();
    _this.worker.transferableMessage = _this.worker.webkitPostMessage || _this.worker.postMessage;

    _this.isLoaded = false;

    var options = _this.options;

    _this.loader = new Promise(function (resolve, reject) {
      // if (options.wasm) {
      //   fetch(options.wasm)
      //     .then(response => response.arrayBuffer())
      //     .then(buffer => {
      //       options.wasmBuffer = buffer;
      //
      //       this.execute('init', options);
      //       resolve();
      //     });
      // } else {
      _this.execute('init', options);
      resolve();
      // }
    });

    _this.loader.then(function () {
      _this.isLoaded = true;
    });

    // Test SUPPORT_TRANSFERABLE

    var ab = new ArrayBuffer(1);
    _this.worker.transferableMessage(ab, [ab]);
    _this.SUPPORT_TRANSFERABLE = ab.byteLength === 0;

    _this.setup();
    return _this;
  }

  createClass(WorldModule, [{
    key: 'send',
    value: function send() {
      var _worker;

      (_worker = this.worker).transferableMessage.apply(_worker, arguments);
    }
  }, {
    key: 'receive',
    value: function receive(callback) {
      this.worker.addEventListener('message', callback);
    }
  }]);
  return WorldModule;
}(WorldModuleBase);

var _class$1, _temp;

var properties = {
  position: {
    get: function get$$1() {
      return this._native.position;
    },
    set: function set$$1(vector3) {
      var pos = this._native.position;
      var scope = this;

      Object.defineProperties(pos, {
        x: {
          get: function get$$1() {
            return this._x;
          },
          set: function set$$1(x) {
            scope.__dirtyPosition = true;
            this._x = x;
          }
        },
        y: {
          get: function get$$1() {
            return this._y;
          },
          set: function set$$1(y) {
            scope.__dirtyPosition = true;
            this._y = y;
          }
        },
        z: {
          get: function get$$1() {
            return this._z;
          },
          set: function set$$1(z) {
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
    get: function get$$1() {
      this.__c_rot = true;
      return this.native.quaternion;
    },
    set: function set$$1(quaternion) {
      var _this = this;

      var quat = this._native.quaternion,
          native = this._native;

      quat.copy(quaternion);

      quat.onChange(function () {
        if (_this.__c_rot) {
          if (native.__dirtyRotation === true) {
            _this.__c_rot = false;
            native.__dirtyRotation = false;
          }
          native.__dirtyRotation = true;
        }
      });
    }
  },

  rotation: {
    get: function get$$1() {
      this.__c_rot = true;
      return this._native.rotation;
    },
    set: function set$$1(euler) {
      var _this2 = this;

      var rot = this._native.rotation,
          native = this._native;

      this.quaternion.copy(new Quaternion().setFromEuler(euler));

      rot.onChange(function () {
        if (_this2.__c_rot) {
          _this2.quaternion.copy(new Quaternion().setFromEuler(rot));
          native.__dirtyRotation = true;
        }
      });
    }
  }
};

function wrapPhysicsPrototype(scope) {
  for (var key in properties) {
    Object.defineProperty(scope, key, {
      get: properties[key].get.bind(scope),
      set: properties[key].set.bind(scope),
      configurable: true,
      enumerable: true
    });
  }
}

function onCopy(source) {
  wrapPhysicsPrototype(this);

  var physics = this.use('physics');
  var sourcePhysics = source.use('physics');

  this.manager.modules.physics = physics.clone(this.manager);

  physics.data = _extends({}, sourcePhysics.data);
  physics.data.isSoftBodyReset = false;
  if (physics.data.isSoftbody) physics.data.isSoftBodyReset = false;

  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();

  return source;
}

function onWrap() {
  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();
}

var API = function () {
  function API() {
    classCallCheck(this, API);
  }

  createClass(API, [{
    key: 'applyCentralImpulse',
    value: function applyCentralImpulse(force) {
      this.execute('applyCentralImpulse', { id: this.data.id, x: force.x, y: force.y, z: force.z });
    }
  }, {
    key: 'applyImpulse',
    value: function applyImpulse(force, offset) {
      this.execute('applyImpulse', {
        id: this.data.id,
        impulse_x: force.x,
        impulse_y: force.y,
        impulse_z: force.z,
        x: offset.x,
        y: offset.y,
        z: offset.z
      });
    }
  }, {
    key: 'applyTorque',
    value: function applyTorque(force) {
      this.execute('applyTorque', {
        id: this.data.id,
        torque_x: force.x,
        torque_y: force.y,
        torque_z: force.z
      });
    }
  }, {
    key: 'applyCentralForce',
    value: function applyCentralForce(force) {
      this.execute('applyCentralForce', {
        id: this.data.id,
        x: force.x,
        y: force.y,
        z: force.z
      });
    }
  }, {
    key: 'applyForce',
    value: function applyForce(force, offset) {
      this.execute('applyForce', {
        id: this.data.id,
        force_x: force.x,
        force_y: force.y,
        force_z: force.z,
        x: offset.x,
        y: offset.y,
        z: offset.z
      });
    }
  }, {
    key: 'getAngularVelocity',
    value: function getAngularVelocity() {
      return this.data.angularVelocity;
    }
  }, {
    key: 'setAngularVelocity',
    value: function setAngularVelocity(velocity) {
      this.execute('setAngularVelocity', { id: this.data.id, x: velocity.x, y: velocity.y, z: velocity.z });
    }
  }, {
    key: 'getLinearVelocity',
    value: function getLinearVelocity() {
      return this.data.linearVelocity;
    }
  }, {
    key: 'setLinearVelocity',
    value: function setLinearVelocity(velocity) {
      this.execute('setLinearVelocity', { id: this.data.id, x: velocity.x, y: velocity.y, z: velocity.z });
    }
  }, {
    key: 'setAngularFactor',
    value: function setAngularFactor(factor) {
      this.execute('setAngularFactor', { id: this.data.id, x: factor.x, y: factor.y, z: factor.z });
    }
  }, {
    key: 'setLinearFactor',
    value: function setLinearFactor(factor) {
      this.execute('setLinearFactor', { id: this.data.id, x: factor.x, y: factor.y, z: factor.z });
    }
  }, {
    key: 'setDamping',
    value: function setDamping(linear, angular) {
      this.execute('setDamping', { id: this.data.id, linear: linear, angular: angular });
    }
  }, {
    key: 'setCcdMotionThreshold',
    value: function setCcdMotionThreshold(threshold) {
      this.execute('setCcdMotionThreshold', { id: this.data.id, threshold: threshold });
    }
  }, {
    key: 'setCcdSweptSphereRadius',
    value: function setCcdSweptSphereRadius(radius) {
      this.execute('setCcdSweptSphereRadius', { id: this.data.id, radius: radius });
    }
  }]);
  return API;
}();

var _default = (_temp = _class$1 = function (_API) {
  inherits(_default, _API);

  function _default(defaults$$1, data) {
    classCallCheck(this, _default);

    var _this3 = possibleConstructorReturn(this, (_default.__proto__ || Object.getPrototypeOf(_default)).call(this));

    _this3.bridge = {
      onCopy: onCopy,
      onWrap: onWrap
    };

    _this3.data = Object.assign(defaults$$1, data);
    return _this3;
  }

  createClass(_default, [{
    key: 'integrate',
    value: function integrate(self) {
      wrapPhysicsPrototype(this);
    }
  }, {
    key: 'manager',
    value: function manager(_manager) {
      _manager.define('physics');

      this.execute = function () {
        var _manager$get;

        return _manager.has('module:world') ? (_manager$get = _manager.get('module:world')).execute.apply(_manager$get, arguments) : function () {};
      };
    }
  }, {
    key: 'updateData',
    value: function updateData(callback) {
      this.bridge.geometry = function (geometry, module) {
        if (!callback) return geometry;

        var result = callback(geometry, module);
        return result ? result : geometry;
      };
    }
  }, {
    key: 'clone',
    value: function clone(manager) {
      var clone = new this.constructor();
      clone.data = _extends({}, this.data);
      clone.bridge.geometry = this.bridge.geometry;
      this.manager.apply(clone, [manager]);

      return clone;
    }
  }]);
  return _default;
}(API), _class$1.rigidbody = function () {
  return {
    touches: [],
    linearVelocity: new Vector3$1(),
    angularVelocity: new Vector3$1(),
    mass: 10,
    scale: new Vector3$1(1, 1, 1),
    restitution: 0.3,
    friction: 0.8,
    damping: 0,
    margin: 0
  };
}, _class$1.softbody = function () {
  return {
    touches: [],
    restitution: 0.3,
    friction: 0.8,
    damping: 0,
    scale: new Vector3$1(1, 1, 1),
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
    rigidHardness: 1,
    isSoftbody: true,
    isSoftBodyReset: false
  };
}, _class$1.rope = function () {
  return {
    touches: [],
    friction: 0.8,
    scale: new Vector3$1(1, 1, 1),
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
    rigidHardness: 1,
    isSoftbody: true
  };
}, _class$1.cloth = function () {
  return {
    touches: [],
    friction: 0.8,
    damping: 0,
    margin: 0,
    scale: new Vector3$1(1, 1, 1),
    klst: 0.9,
    kvst: 0.9,
    kast: 0.9,
    piterations: 1,
    viterations: 0,
    diterations: 0,
    citerations: 4,
    anchorHardness: 0.7,
    rigidHardness: 1
  };
}, _temp);

var BoxModule = function (_PhysicsModule) {
  inherits(BoxModule, _PhysicsModule);

  function BoxModule(params) {
    classCallCheck(this, BoxModule);

    var _this = possibleConstructorReturn(this, (BoxModule.__proto__ || Object.getPrototypeOf(BoxModule)).call(this, _extends({
      type: 'box'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = data.depth || geometry.boundingBox.max.z - geometry.boundingBox.min.z;
    });
    return _this;
  }

  return BoxModule;
}(_default);

var CompoundModule = function (_PhysicsModule) {
  inherits(CompoundModule, _PhysicsModule);

  function CompoundModule(params) {
    classCallCheck(this, CompoundModule);
    return possibleConstructorReturn(this, (CompoundModule.__proto__ || Object.getPrototypeOf(CompoundModule)).call(this, _extends({
      type: 'compound'
    }, _default.rigidbody()), params));
  }

  return CompoundModule;
}(_default);

// TODO: Test CapsuleModule in action.
var CapsuleModule = function (_PhysicsModule) {
  inherits(CapsuleModule, _PhysicsModule);

  function CapsuleModule(params) {
    classCallCheck(this, CapsuleModule);

    var _this = possibleConstructorReturn(this, (CapsuleModule.__proto__ || Object.getPrototypeOf(CapsuleModule)).call(this, _extends({
      type: 'capsule'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = data.depth || geometry.boundingBox.max.z - geometry.boundingBox.min.z;
    });
    return _this;
  }

  return CapsuleModule;
}(_default);

var ConcaveModule = function (_PhysicsModule) {
  inherits(ConcaveModule, _PhysicsModule);

  function ConcaveModule(params) {
    classCallCheck(this, ConcaveModule);

    var _this = possibleConstructorReturn(this, (ConcaveModule.__proto__ || Object.getPrototypeOf(ConcaveModule)).call(this, _extends({
      type: 'concave'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      data.data = _this.geometryProcessor(geometry);
    });
    return _this;
  }

  createClass(ConcaveModule, [{
    key: 'geometryProcessor',
    value: function geometryProcessor(geometry) {
      if (!geometry.boundingBox) geometry.computeBoundingBox();

      var data = geometry.isBufferGeometry ? geometry.attributes.position.array : new Float32Array(geometry.faces.length * 9);

      if (!geometry.isBufferGeometry) {
        var vertices = geometry.vertices;

        for (var i = 0; i < geometry.faces.length; i++) {
          var face = geometry.faces[i];

          var vA = vertices[face.a];
          var vB = vertices[face.b];
          var vC = vertices[face.c];

          var i9 = i * 9;

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
    }
  }]);
  return ConcaveModule;
}(_default);

var ConeModule = function (_PhysicsModule) {
  inherits(ConeModule, _PhysicsModule);

  function ConeModule(params) {
    classCallCheck(this, ConeModule);

    var _this = possibleConstructorReturn(this, (ConeModule.__proto__ || Object.getPrototypeOf(ConeModule)).call(this, _extends({
      type: 'cone'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.radius = data.radius || (geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
    });
    return _this;
  }

  return ConeModule;
}(_default);

var ConvexModule = function (_PhysicsModule) {
  inherits(ConvexModule, _PhysicsModule);

  function ConvexModule(params) {
    classCallCheck(this, ConvexModule);

    var _this = possibleConstructorReturn(this, (ConvexModule.__proto__ || Object.getPrototypeOf(ConvexModule)).call(this, _extends({
      type: 'convex'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (!geometry.isBufferGeometry) geometry._bufferGeometry = new BufferGeometry().fromGeometry(geometry);

      data.data = geometry.isBufferGeometry ? geometry.attributes.position.array : geometry._bufferGeometry.attributes.position.array;
    });
    return _this;
  }

  return ConvexModule;
}(_default);

var CylinderModule = function (_PhysicsModule) {
  inherits(CylinderModule, _PhysicsModule);

  function CylinderModule(params) {
    classCallCheck(this, CylinderModule);

    var _this = possibleConstructorReturn(this, (CylinderModule.__proto__ || Object.getPrototypeOf(CylinderModule)).call(this, _extends({
      type: 'cylinder'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = data.depth || geometry.boundingBox.max.z - geometry.boundingBox.min.z;
    });
    return _this;
  }

  return CylinderModule;
}(_default);

var HeightfieldModule = function (_PhysicsModule) {
  inherits(HeightfieldModule, _PhysicsModule);

  function HeightfieldModule(params) {
    classCallCheck(this, HeightfieldModule);

    var _this = possibleConstructorReturn(this, (HeightfieldModule.__proto__ || Object.getPrototypeOf(HeightfieldModule)).call(this, _extends({
      type: 'heightfield',
      size: new Vector2(1, 1),
      autoAlign: false
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;
      var _data$size = data.size,
          xdiv = _data$size.x,
          ydiv = _data$size.y;

      var verts = geometry.isBufferGeometry ? geometry.attributes.position.array : geometry.vertices;
      var size = geometry.isBufferGeometry ? verts.length / 3 : verts.length;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      var xsize = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      var ysize = geometry.boundingBox.max.z - geometry.boundingBox.min.z;

      data.xpts = typeof xdiv === 'undefined' ? Math.sqrt(size) : xdiv + 1;
      data.ypts = typeof ydiv === 'undefined' ? Math.sqrt(size) : ydiv + 1;

      // note - this assumes our plane geometry is square, unless we pass in specific xdiv and ydiv
      data.absMaxHeight = Math.max(geometry.boundingBox.max.y, Math.abs(geometry.boundingBox.min.y));

      var points = new Float32Array(size),
          xpts = data.xpts,
          ypts = data.ypts;

      while (size--) {
        var vNum = size % xpts + (ypts - Math.round(size / xpts - size % xpts / xpts) - 1) * ypts;

        if (geometry.isBufferGeometry) points[size] = verts[vNum * 3 + 1];else points[size] = verts[vNum].y;
      }

      data.points = points;

      data.scale.multiply(new Vector3$1(xsize / (xpts - 1), 1, ysize / (ypts - 1)));

      if (data.autoAlign) geometry.translate(xsize / -2, 0, ysize / -2);
    });
    return _this;
  }

  return HeightfieldModule;
}(_default);

var PlaneModule = function (_PhysicsModule) {
  inherits(PlaneModule, _PhysicsModule);

  function PlaneModule(params) {
    classCallCheck(this, PlaneModule);

    var _this = possibleConstructorReturn(this, (PlaneModule.__proto__ || Object.getPrototypeOf(PlaneModule)).call(this, _extends({
      type: 'plane'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.normal = data.normal || geometry.faces[0].normal.clone();
    });
    return _this;
  }

  return PlaneModule;
}(_default);

var SphereModule = function (_PhysicsModule) {
  inherits(SphereModule, _PhysicsModule);

  function SphereModule(params) {
    classCallCheck(this, SphereModule);

    var _this = possibleConstructorReturn(this, (SphereModule.__proto__ || Object.getPrototypeOf(SphereModule)).call(this, _extends({
      type: 'sphere'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      data.radius = data.radius || geometry.boundingSphere.radius;
    });
    return _this;
  }

  return SphereModule;
}(_default);

var SoftbodyModule = function (_PhysicsModule) {
  inherits(SoftbodyModule, _PhysicsModule);

  function SoftbodyModule(params) {
    classCallCheck(this, SoftbodyModule);

    var _this = possibleConstructorReturn(this, (SoftbodyModule.__proto__ || Object.getPrototypeOf(SoftbodyModule)).call(this, _extends({
      type: 'softTrimesh'
    }, _default.softbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      var idxGeometry = geometry.isBufferGeometry ? geometry : function () {
        geometry.mergeVertices();

        var bufferGeometry = new BufferGeometry();

        bufferGeometry.addAttribute('position', new BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

        bufferGeometry.setIndex(new BufferAttribute(new (geometry.faces.length * 3 > 65535 ? Uint32Array : Uint16Array)(geometry.faces.length * 3), 1).copyIndicesArray(geometry.faces));

        return bufferGeometry;
      }();

      data.aVertices = idxGeometry.attributes.position.array;
      data.aIndices = idxGeometry.index.array;

      return new BufferGeometry().fromGeometry(geometry);
    });
    return _this;
  }

  createClass(SoftbodyModule, [{
    key: 'appendAnchor',
    value: function appendAnchor(object, node) {
      var influence = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      var collisionBetweenLinkedBodies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var o1 = this.data.id;
      var o2 = object.use('physics').data.id;

      this.execute('appendAnchor', {
        obj: o1,
        obj2: o2,
        node: node,
        influence: influence,
        collisionBetweenLinkedBodies: collisionBetweenLinkedBodies
      });
    }
  }]);
  return SoftbodyModule;
}(_default);

function arrayMax(array) {
  if (array.length === 0) return -Infinity;

  var max = array[0];

  for (var i = 1, l = array.length; i < l; ++i) {
    if (array[i] > max) max = array[i];
  }

  return max;
}

var ClothModule = function (_PhysicsModule) {
  inherits(ClothModule, _PhysicsModule);

  function ClothModule(params) {
    classCallCheck(this, ClothModule);

    var _this = possibleConstructorReturn(this, (ClothModule.__proto__ || Object.getPrototypeOf(ClothModule)).call(this, _extends({
      type: 'softClothMesh'
    }, _default.cloth()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      var geomParams = geometry.parameters;

      var geom = geometry.isBufferGeometry ? geometry : function () {
        geometry.mergeVertices();

        var bufferGeometry = new BufferGeometry();

        bufferGeometry.addAttribute('position', new BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

        var faces = geometry.faces,
            facesLength = faces.length,
            uvs = geometry.faceVertexUvs[0];

        var normalsArray = new Float32Array(facesLength * 3);
        // const uvsArray = new Array(geometry.vertices.length * 2);
        var uvsArray = new Float32Array(facesLength * 2);
        var faceArray = new Uint32Array(facesLength * 3);

        for (var i = 0; i < facesLength; i++) {
          var i3 = i * 3;
          var normal = faces[i].normal || new Vector3();

          faceArray[i3] = faces[i].a;
          faceArray[i3 + 1] = faces[i].b;
          faceArray[i3 + 2] = faces[i].c;

          normalsArray[i3] = normal.x;
          normalsArray[i3 + 1] = normal.y;
          normalsArray[i3 + 2] = normal.z;

          uvsArray[faces[i].a * 2 + 0] = uvs[i][0].x; // a
          uvsArray[faces[i].a * 2 + 1] = uvs[i][0].y;

          uvsArray[faces[i].b * 2 + 0] = uvs[i][1].x; // b
          uvsArray[faces[i].b * 2 + 1] = uvs[i][1].y;

          uvsArray[faces[i].c * 2 + 0] = uvs[i][2].x; // c
          uvsArray[faces[i].c * 2 + 1] = uvs[i][2].y;
        }

        bufferGeometry.addAttribute('normal', new BufferAttribute(normalsArray, 3));

        bufferGeometry.addAttribute('uv', new BufferAttribute(uvsArray, 2));

        bufferGeometry.setIndex(new BufferAttribute(new (arrayMax(faces) * 3 > 65535 ? Uint32Array : Uint16Array)(facesLength * 3), 1).copyIndicesArray(faces));

        return bufferGeometry;
      }();

      var verts = geom.attributes.position.array;

      if (!geomParams.widthSegments) geomParams.widthSegments = 1;
      if (!geomParams.heightSegments) geomParams.heightSegments = 1;

      var idx00 = 0;
      var idx01 = geomParams.widthSegments;
      var idx10 = (geomParams.heightSegments + 1) * (geomParams.widthSegments + 1) - (geomParams.widthSegments + 1);
      var idx11 = verts.length / 3 - 1;

      data.corners = [verts[idx01 * 3], verts[idx01 * 3 + 1], verts[idx01 * 3 + 2], //   ╗
      verts[idx00 * 3], verts[idx00 * 3 + 1], verts[idx00 * 3 + 2], // ╔
      verts[idx11 * 3], verts[idx11 * 3 + 1], verts[idx11 * 3 + 2], //       ╝
      verts[idx10 * 3], verts[idx10 * 3 + 1], verts[idx10 * 3 + 2]];

      data.segments = [geomParams.widthSegments + 1, geomParams.heightSegments + 1];

      return geom;
    });
    return _this;
  }

  createClass(ClothModule, [{
    key: 'appendAnchor',
    value: function appendAnchor(object, node, influence) {
      var collisionBetweenLinkedBodies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var o1 = this.data.id;
      var o2 = object.use('physics').data.id;

      this.execute('appendAnchor', {
        obj: o1,
        obj2: o2,
        node: node,
        influence: influence,
        collisionBetweenLinkedBodies: collisionBetweenLinkedBodies
      });
    }
  }, {
    key: 'linkNodes',
    value: function linkNodes(object, n1, n2, modifier) {
      var self = this.data.id;
      var body = object.use('physics').data.id;

      this.execute('linkNodes', {
        self: self,
        body: body,
        n1: n1, // self node
        n2: n2, // body node
        modifier: modifier
      });
    }
  }, {
    key: 'appendLinearJoint',
    value: function appendLinearJoint(object, specs) {
      var self = this.data.id;
      var body = object.use('physics').data.id;

      this.execute('appendLinearJoint', {
        self: self,
        body: body,
        specs: specs
      });
    }
  }]);
  return ClothModule;
}(_default);

var RopeModule = function (_PhysicsModule) {
  inherits(RopeModule, _PhysicsModule);

  function RopeModule(params) {
    classCallCheck(this, RopeModule);

    var _this = possibleConstructorReturn(this, (RopeModule.__proto__ || Object.getPrototypeOf(RopeModule)).call(this, _extends({
      type: 'softRopeMesh'
    }, _default.rope()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.isBufferGeometry) {
        geometry = function () {
          var buff = new BufferGeometry();

          buff.addAttribute('position', new BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

          return buff;
        }();
      }

      var length = geometry.attributes.position.array.length / 3;
      var vert = function vert(n) {
        return new Vector3$1().fromArray(geometry.attributes.position.array, n * 3);
      };

      var v1 = vert(0);
      var v2 = vert(length - 1);

      data.data = [v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, length];

      return geometry;
    });
    return _this;
  }

  createClass(RopeModule, [{
    key: 'appendAnchor',
    value: function appendAnchor(object, node, influence) {
      var collisionBetweenLinkedBodies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var o1 = this.data.id;
      var o2 = object.use('physics').data.id;

      this.execute('appendAnchor', {
        obj: o1,
        obj2: o2,
        node: node,
        influence: influence,
        collisionBetweenLinkedBodies: collisionBetweenLinkedBodies
      });
    }
  }]);
  return RopeModule;
}(_default);

var _class$2, _temp$1;

var PI_2 = Math.PI / 2;

// TODO: Fix DOM
function FirstPersonControlsSolver(camera, mesh, params) {
  var _this = this;

  var velocityFactor = 1;
  var runVelocity = 0.25;

  mesh.use('physics').setAngularFactor({ x: 0, y: 0, z: 0 });
  camera.position.set(0, 0, 0);

  /* Init */
  var player = mesh,
      pitchObject = new Object3D();

  pitchObject.add(camera.native);

  var yawObject = new Object3D();

  yawObject.position.y = params.ypos; // eyes are 2 meters above the ground
  yawObject.add(pitchObject);

  var quat = new Quaternion();

  var canJump = false,

  // Moves.
  moveForward = false,
      moveBackward = false,
      moveLeft = false,
      moveRight = false;

  player.on('collision', function (otherObject, v, r, contactNormal) {
    console.log(contactNormal.y);
    if (contactNormal.y < 0.5) // Use a "good" threshold value between 0 and 1 here!
      canJump = true;
  });

  var onMouseMove = function onMouseMove(event) {
    if (_this.enabled === false) return;

    var movementX = typeof event.movementX === 'number' ? event.movementX : typeof event.mozMovementX === 'number' ? event.mozMovementX : typeof event.getMovementX === 'function' ? event.getMovementX() : 0;
    var movementY = typeof event.movementY === 'number' ? event.movementY : typeof event.mozMovementY === 'number' ? event.mozMovementY : typeof event.getMovementY === 'function' ? event.getMovementY() : 0;

    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;

    pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
  };

  var physics = player.use('physics');

  var onKeyDown = function onKeyDown(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87:
        // w
        moveForward = true;
        break;

      case 37: // left
      case 65:
        // a
        moveLeft = true;
        break;

      case 40: // down
      case 83:
        // s
        moveBackward = true;
        break;

      case 39: // right
      case 68:
        // d
        moveRight = true;
        break;

      case 32:
        // space
        console.log(canJump);
        if (canJump === true) physics.applyCentralImpulse({ x: 0, y: 300, z: 0 });
        canJump = false;
        break;

      case 16:
        // shift
        runVelocity = 0.5;
        break;

      default:
    }
  };

  var onKeyUp = function onKeyUp(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87:
        // w
        moveForward = false;
        break;

      case 37: // left
      case 65:
        // a
        moveLeft = false;
        break;

      case 40: // down
      case 83:
        // a
        moveBackward = false;
        break;

      case 39: // right
      case 68:
        // d
        moveRight = false;
        break;

      case 16:
        // shift
        runVelocity = 0.25;
        break;

      default:
    }
  };

  document.body.addEventListener('mousemove', onMouseMove, false);
  document.body.addEventListener('keydown', onKeyDown, false);
  document.body.addEventListener('keyup', onKeyUp, false);

  this.enabled = false;
  this.getObject = function () {
    return yawObject;
  };

  this.getDirection = function (targetVec) {
    targetVec.set(0, 0, -1);
    quat.multiplyVector3(targetVec);
  };

  // Moves the camera to the Physi.js object position
  // and adds velocity to the object if the run key is down.
  var inputVelocity = new Vector3$1(),
      euler = new Euler();

  this.update = function (delta) {
    if (_this.enabled === false) return;

    delta = delta || 0.5;
    delta = Math.min(delta, 0.5, delta);

    inputVelocity.set(0, 0, 0);

    var speed = velocityFactor * delta * params.speed * runVelocity;

    if (moveForward) inputVelocity.z = -speed;
    if (moveBackward) inputVelocity.z = speed;
    if (moveLeft) inputVelocity.x = -speed;
    if (moveRight) inputVelocity.x = speed;

    // Convert velocity to world coordinates
    euler.x = pitchObject.rotation.x;
    euler.y = yawObject.rotation.y;
    euler.order = 'XYZ';

    quat.setFromEuler(euler);

    inputVelocity.applyQuaternion(quat);

    physics.applyCentralImpulse({ x: inputVelocity.x, y: 0, z: inputVelocity.z });
    physics.setAngularVelocity({ x: inputVelocity.z, y: 0, z: -inputVelocity.x });
    physics.setAngularFactor({ x: 0, y: 0, z: 0 });
  };

  player.on('physics:added', function () {
    player.manager.get('module:world').addEventListener('update', function () {
      if (_this.enabled === false) return;
      yawObject.position.copy(player.position);
    });
  });
}

var FirstPersonModule = (_temp$1 = _class$2 = function () {
  function FirstPersonModule(object) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, FirstPersonModule);

    this.object = object;
    this.params = params;

    if (!this.params.block) {
      this.params.block = document.getElementById('blocker');
    }
  }

  createClass(FirstPersonModule, [{
    key: 'manager',
    value: function manager(_manager) {
      var _this2 = this;

      this.controls = new FirstPersonControlsSolver(_manager.get('camera'), this.object, this.params);

      if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
        var element = document.body;

        var pointerlockchange = function pointerlockchange() {
          if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            _this2.controls.enabled = true;
            _this2.params.block.style.display = 'none';
          } else {
            _this2.controls.enabled = false;
            _this2.params.block.style.display = 'block';
          }
        };

        document.addEventListener('pointerlockchange', pointerlockchange, false);
        document.addEventListener('mozpointerlockchange', pointerlockchange, false);
        document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

        var pointerlockerror = function pointerlockerror() {
          console.warn('Pointer lock error.');
        };

        document.addEventListener('pointerlockerror', pointerlockerror, false);
        document.addEventListener('mozpointerlockerror', pointerlockerror, false);
        document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

        document.querySelector('body').addEventListener('click', function () {
          element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

          element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

          if (/Firefox/i.test(navigator.userAgent)) {
            var fullscreenchange = function fullscreenchange() {
              if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
                document.removeEventListener('fullscreenchange', fullscreenchange);
                document.removeEventListener('mozfullscreenchange', fullscreenchange);

                element.requestPointerLock();
              }
            };

            document.addEventListener('fullscreenchange', fullscreenchange, false);
            document.addEventListener('mozfullscreenchange', fullscreenchange, false);

            element.requestFullscreen();
          } else element.requestPointerLock();
        });
      } else console.warn('Your browser does not support the PointerLock');

      _manager.get('scene').add(this.controls.getObject());
    }
  }, {
    key: 'integrate',
    value: function integrate(self) {
      var updateProcessor = function updateProcessor(c) {
        self.controls.update(c.getDelta());
      };

      self.updateLoop = new Loop(updateProcessor).start(this);
    }
  }]);
  return FirstPersonModule;
}(), _class$2.defaults = {
  block: null,
  speed: 1,
  ypos: 1
}, _temp$1);

export { getEulerXYZFromQuaternion, getQuatertionFromEuler, convertWorldPositionToObject, addObjectChildren, MESSAGE_TYPES, REPORT_ITEMSIZE, COLLISIONREPORT_ITEMSIZE, VEHICLEREPORT_ITEMSIZE, CONSTRAINTREPORT_ITEMSIZE, temp1Vector3, temp2Vector3, temp1Matrix4, temp1Quat, Eventable, ConeTwistConstraint, HingeConstraint, PointConstraint, SliderConstraint, DOFConstraint, WorldModule, BoxModule, CompoundModule, CapsuleModule, ConcaveModule, ConeModule, ConvexModule, CylinderModule, HeightfieldModule, PlaneModule, SphereModule, SoftbodyModule, ClothModule, RopeModule, FirstPersonModule };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUubW9kdWxlLmpzLm1hcCIsInNvdXJjZXMiOlsiLi4vc3JjL2FwaS5qcyIsIi4uL3NyYy9ldmVudGFibGUuanMiLCIuLi9zcmMvY29uc3RyYWludHMvQ29uZVR3aXN0Q29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9IaW5nZUNvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvUG9pbnRDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL1NsaWRlckNvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvRE9GQ29uc3RyYWludC5qcyIsIi4uL3NyYy92ZWhpY2xlL3ZlaGljbGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb3JlL1dvcmxkTW9kdWxlQmFzZS5qcyIsIi4uL2J1bmRsZS13b3JrZXIvd29ya2VyaGVscGVyLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9tb2R1bGVzL1dvcmxkTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29yZS9QaHlzaWNzTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQm94TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29tcG91bmRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DYXBzdWxlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29uY2F2ZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db252ZXhNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DeWxpbmRlck1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0hlaWdodGZpZWxkTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvUGxhbmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9TcGhlcmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Tb2Z0Ym9keU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0Nsb3RoTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvUm9wZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL2NvbnRyb2xzL0ZpcnN0UGVyc29uTW9kdWxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFZlY3RvcjMsXG4gIE1hdHJpeDQsXG4gIFF1YXRlcm5pb25cbn0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBNRVNTQUdFX1RZUEVTID0ge1xuICBXT1JMRFJFUE9SVDogMCxcbiAgQ09MTElTSU9OUkVQT1JUOiAxLFxuICBWRUhJQ0xFUkVQT1JUOiAyLFxuICBDT05TVFJBSU5UUkVQT1JUOiAzLFxuICBTT0ZUUkVQT1JUOiA0XG59O1xuXG5jb25zdCBSRVBPUlRfSVRFTVNJWkUgPSAxNCxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFID0gNSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSA9IDksXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUgPSA2O1xuXG5jb25zdCB0ZW1wMVZlY3RvcjMgPSBuZXcgVmVjdG9yMygpLFxuICB0ZW1wMlZlY3RvcjMgPSBuZXcgVmVjdG9yMygpLFxuICB0ZW1wMU1hdHJpeDQgPSBuZXcgTWF0cml4NCgpLFxuICB0ZW1wMVF1YXQgPSBuZXcgUXVhdGVybmlvbigpO1xuXG5jb25zdCBnZXRFdWxlclhZWkZyb21RdWF0ZXJuaW9uID0gKHgsIHksIHosIHcpID0+IHtcbiAgcmV0dXJuIG5ldyBWZWN0b3IzKFxuICAgIE1hdGguYXRhbjIoMiAqICh4ICogdyAtIHkgKiB6KSwgKHcgKiB3IC0geCAqIHggLSB5ICogeSArIHogKiB6KSksXG4gICAgTWF0aC5hc2luKDIgKiAoeCAqIHogKyB5ICogdykpLFxuICAgIE1hdGguYXRhbjIoMiAqICh6ICogdyAtIHggKiB5KSwgKHcgKiB3ICsgeCAqIHggLSB5ICogeSAtIHogKiB6KSlcbiAgKTtcbn07XG5cbmNvbnN0IGdldFF1YXRlcnRpb25Gcm9tRXVsZXIgPSAoeCwgeSwgeikgPT4ge1xuICBjb25zdCBjMSA9IE1hdGguY29zKHkpO1xuICBjb25zdCBzMSA9IE1hdGguc2luKHkpO1xuICBjb25zdCBjMiA9IE1hdGguY29zKC16KTtcbiAgY29uc3QgczIgPSBNYXRoLnNpbigteik7XG4gIGNvbnN0IGMzID0gTWF0aC5jb3MoeCk7XG4gIGNvbnN0IHMzID0gTWF0aC5zaW4oeCk7XG4gIGNvbnN0IGMxYzIgPSBjMSAqIGMyO1xuICBjb25zdCBzMXMyID0gczEgKiBzMjtcblxuICByZXR1cm4ge1xuICAgIHc6IGMxYzIgKiBjMyAtIHMxczIgKiBzMyxcbiAgICB4OiBjMWMyICogczMgKyBzMXMyICogYzMsXG4gICAgeTogczEgKiBjMiAqIGMzICsgYzEgKiBzMiAqIHMzLFxuICAgIHo6IGMxICogczIgKiBjMyAtIHMxICogYzIgKiBzM1xuICB9O1xufTtcblxuY29uc3QgY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCA9IChwb3NpdGlvbiwgb2JqZWN0KSA9PiB7XG4gIHRlbXAxTWF0cml4NC5pZGVudGl0eSgpOyAvLyByZXNldCB0ZW1wIG1hdHJpeFxuXG4gIC8vIFNldCB0aGUgdGVtcCBtYXRyaXgncyByb3RhdGlvbiB0byB0aGUgb2JqZWN0J3Mgcm90YXRpb25cbiAgdGVtcDFNYXRyaXg0LmlkZW50aXR5KCkubWFrZVJvdGF0aW9uRnJvbVF1YXRlcm5pb24ob2JqZWN0LnF1YXRlcm5pb24pO1xuXG4gIC8vIEludmVydCByb3RhdGlvbiBtYXRyaXggaW4gb3JkZXIgdG8gXCJ1bnJvdGF0ZVwiIGEgcG9pbnQgYmFjayB0byBvYmplY3Qgc3BhY2VcbiAgdGVtcDFNYXRyaXg0LmdldEludmVyc2UodGVtcDFNYXRyaXg0KTtcblxuICAvLyBZYXkhIFRlbXAgdmFycyFcbiAgdGVtcDFWZWN0b3IzLmNvcHkocG9zaXRpb24pO1xuICB0ZW1wMlZlY3RvcjMuY29weShvYmplY3QucG9zaXRpb24pO1xuXG4gIC8vIEFwcGx5IHRoZSByb3RhdGlvblxuICByZXR1cm4gdGVtcDFWZWN0b3IzLnN1Yih0ZW1wMlZlY3RvcjMpLmFwcGx5TWF0cml4NCh0ZW1wMU1hdHJpeDQpO1xufTtcblxuY29uc3QgYWRkT2JqZWN0Q2hpbGRyZW4gPSBmdW5jdGlvbiAocGFyZW50LCBvYmplY3QpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmplY3QuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZCA9IG9iamVjdC5jaGlsZHJlbltpXTtcbiAgICBjb25zdCBwaHlzaWNzID0gY2hpbGQuY29tcG9uZW50ID8gY2hpbGQuY29tcG9uZW50LnVzZSgncGh5c2ljcycpIDogZmFsc2U7XG5cbiAgICBpZiAocGh5c2ljcykge1xuICAgICAgY29uc3QgZGF0YSA9IHBoeXNpY3MuZGF0YTtcblxuICAgICAgY2hpbGQudXBkYXRlTWF0cml4KCk7XG4gICAgICBjaGlsZC51cGRhdGVNYXRyaXhXb3JsZCgpO1xuXG4gICAgICB0ZW1wMVZlY3RvcjMuc2V0RnJvbU1hdHJpeFBvc2l0aW9uKGNoaWxkLm1hdHJpeFdvcmxkKTtcbiAgICAgIHRlbXAxUXVhdC5zZXRGcm9tUm90YXRpb25NYXRyaXgoY2hpbGQubWF0cml4V29ybGQpO1xuXG4gICAgICBkYXRhLnBvc2l0aW9uX29mZnNldCA9IHtcbiAgICAgICAgeDogdGVtcDFWZWN0b3IzLngsXG4gICAgICAgIHk6IHRlbXAxVmVjdG9yMy55LFxuICAgICAgICB6OiB0ZW1wMVZlY3RvcjMuelxuICAgICAgfTtcblxuICAgICAgZGF0YS5yb3RhdGlvbiA9IHtcbiAgICAgICAgeDogdGVtcDFRdWF0LngsXG4gICAgICAgIHk6IHRlbXAxUXVhdC55LFxuICAgICAgICB6OiB0ZW1wMVF1YXQueixcbiAgICAgICAgdzogdGVtcDFRdWF0LndcbiAgICAgIH07XG5cbiAgICAgIHBhcmVudC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YS5jaGlsZHJlbi5wdXNoKGRhdGEpO1xuICAgIH1cblxuICAgIGFkZE9iamVjdENoaWxkcmVuKHBhcmVudCwgY2hpbGQpO1xuICB9XG59O1xuXG5leHBvcnQge1xuICBnZXRFdWxlclhZWkZyb21RdWF0ZXJuaW9uLFxuICBnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyLFxuICBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0LFxuICBhZGRPYmplY3RDaGlsZHJlbixcblxuICBNRVNTQUdFX1RZUEVTLFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSxcblxuICB0ZW1wMVZlY3RvcjMsXG4gIHRlbXAyVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICB0ZW1wMVF1YXRcbn07XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRhYmxlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnMgPSB7fTtcbiAgfVxuXG4gIGFkZEV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKVxuICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0gPSBbXTtcblxuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjYWxsYmFjaykge1xuICAgIGxldCBpbmRleDtcblxuICAgIGlmICghdGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpIHJldHVybiBmYWxzZTtcblxuICAgIGlmICgoaW5kZXggPSB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5pbmRleE9mKGNhbGxiYWNrKSkgPj0gMCkge1xuICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGRpc3BhdGNoRXZlbnQoZXZlbnRfbmFtZSkge1xuICAgIGxldCBpO1xuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIGlmICh0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXVtpXS5hcHBseSh0aGlzLCBwYXJhbWV0ZXJzKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbWFrZShvYmopIHtcbiAgICBvYmoucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBFdmVudGFibGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG4gICAgb2JqLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gRXZlbnRhYmxlLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuICAgIG9iai5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IEV2ZW50YWJsZS5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudDtcbiAgfVxufVxuIiwiaW1wb3J0IHsgY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCB9IGZyb20gJy4uL2FwaSc7XG5pbXBvcnQgeyBFdWxlciwgTWF0cml4NCwgUXVhdGVybmlvbiwgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcblxuZXhwb3J0IGNsYXNzIENvbmVUd2lzdENvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGNvbnN0IG9iamVjdGIgPSBvYmphO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIGNvbnNvbGUuZXJyb3IoJ0JvdGggb2JqZWN0cyBtdXN0IGJlIGRlZmluZWQgaW4gYSBDb25lVHdpc3RDb25zdHJhaW50LicpO1xuXG4gICAgdGhpcy50eXBlID0gJ2NvbmV0d2lzdCc7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpc2EgPSB7eDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24uen07XG4gICAgdGhpcy5heGlzYiA9IHt4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56fTtcbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0KHgsIHksIHopIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRMaW1pdCcsIHtjb25zdHJhaW50OiB0aGlzLmlkLCB4LCB5LCB6fSk7XG4gIH1cblxuICBlbmFibGVNb3RvcigpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9lbmFibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBzZXRNYXhNb3RvckltcHVsc2UobWF4X2ltcHVsc2UpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UnLCB7Y29uc3RyYWludDogdGhpcy5pZCwgbWF4X2ltcHVsc2V9KTtcbiAgfVxuXG4gIHNldE1vdG9yVGFyZ2V0KHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBWZWN0b3IzKVxuICAgICAgdGFyZ2V0ID0gbmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIobmV3IEV1bGVyKHRhcmdldC54LCB0YXJnZXQueSwgdGFyZ2V0LnopKTtcbiAgICBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBFdWxlcilcbiAgICAgIHRhcmdldCA9IG5ldyBRdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHRhcmdldCk7XG4gICAgZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgTWF0cml4NClcbiAgICAgIHRhcmdldCA9IG5ldyBRdWF0ZXJuaW9uKCkuc2V0RnJvbVJvdGF0aW9uTWF0cml4KHRhcmdldCk7XG5cbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNb3RvclRhcmdldCcsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB4OiB0YXJnZXQueCxcbiAgICAgIHk6IHRhcmdldC55LFxuICAgICAgejogdGFyZ2V0LnosXG4gICAgICB3OiB0YXJnZXQud1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBIaW5nZUNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbiwgYXhpcykge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChheGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF4aXMgPSBwb3NpdGlvbjtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2hpbmdlJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbi5jbG9uZSgpO1xuICAgIHRoaXMuYXhpcyA9IGF4aXM7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxvdywgaGlnaCwgYmlhc19mYWN0b3IsIHJlbGF4YXRpb25fZmFjdG9yKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2Vfc2V0TGltaXRzJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIGxvdyxcbiAgICAgIGhpZ2gsXG4gICAgICBiaWFzX2ZhY3RvcixcbiAgICAgIHJlbGF4YXRpb25fZmFjdG9yXG4gICAgfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZU1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2Rpc2FibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIFBvaW50Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ3BvaW50JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iXG4gICAgfTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgU2xpZGVyQ29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uLCBheGlzKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKGF4aXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXhpcyA9IHBvc2l0aW9uO1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnc2xpZGVyJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpcyA9IGF4aXM7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxpbl9sb3dlciwgbGluX3VwcGVyLCBhbmdfbG93ZXIsIGFuZ191cHBlcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbGluX2xvd2VyLFxuICAgICAgbGluX3VwcGVyLFxuICAgICAgYW5nX2xvd2VyLFxuICAgICAgYW5nX3VwcGVyXG4gICAgfSk7XG4gIH1cblxuICBzZXRSZXN0aXR1dGlvbihsaW5lYXIsIGFuZ3VsYXIpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKFxuICAgICAgJ3NsaWRlcl9zZXRSZXN0aXR1dGlvbicsXG4gICAgICB7XG4gICAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICAgIGxpbmVhcixcbiAgICAgICAgYW5ndWxhclxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBlbmFibGVMaW5lYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTGluZWFyTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIHRoaXMuc2NlbmUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZUFuZ3VsYXJNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIERPRkNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmICggcG9zaXRpb24gPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RvZic7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCggcG9zaXRpb24sIG9iamVjdGEgKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpc2EgPSB7IHg6IG9iamVjdGEucm90YXRpb24ueCwgeTogb2JqZWN0YS5yb3RhdGlvbi55LCB6OiBvYmplY3RhLnJvdGF0aW9uLnogfTtcblxuICAgIGlmICggb2JqZWN0YiApIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCggcG9zaXRpb24sIG9iamVjdGIgKS5jbG9uZSgpO1xuICAgICAgdGhpcy5heGlzYiA9IHsgeDogb2JqZWN0Yi5yb3RhdGlvbi54LCB5OiBvYmplY3RiLnJvdGF0aW9uLnksIHo6IG9iamVjdGIucm90YXRpb24ueiB9O1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbmVhckxvd2VyTGltaXQobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhckxvd2VyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0TGluZWFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0QW5ndWxhckxvd2VyTGltaXQgKGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3RvciAod2hpY2gpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZUFuZ3VsYXJNb3RvciAod2hpY2gsIGxvd19hbmdsZSwgaGlnaF9hbmdsZSwgdmVsb2NpdHksIG1heF9mb3JjZSApIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoLCBsb3dfYW5nbGU6IGxvd19hbmdsZSwgaGlnaF9hbmdsZTogaGlnaF9hbmdsZSwgdmVsb2NpdHk6IHZlbG9jaXR5LCBtYXhfZm9yY2U6IG1heF9mb3JjZSB9ICk7XG4gIH1cblxuICBkaXNhYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtNZXNofSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge1ZlaGljbGVUdW5uaW5nfSBmcm9tICcuL3R1bm5pbmcnO1xuXG5leHBvcnQgY2xhc3MgVmVoaWNsZSB7XG4gIGNvbnN0cnVjdG9yKG1lc2gsIHR1bmluZyA9IG5ldyBWZWhpY2xlVHVuaW5nKCkpIHtcbiAgICB0aGlzLm1lc2ggPSBtZXNoO1xuICAgIHRoaXMud2hlZWxzID0gW107XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgaWQ6IGdldE9iamVjdElkKCksXG4gICAgICByaWdpZEJvZHk6IG1lc2guX3BoeXNpanMuaWQsXG4gICAgICBzdXNwZW5zaW9uX3N0aWZmbmVzczogdHVuaW5nLnN1c3BlbnNpb25fc3RpZmZuZXNzLFxuICAgICAgc3VzcGVuc2lvbl9jb21wcmVzc2lvbjogdHVuaW5nLnN1c3BlbnNpb25fY29tcHJlc3Npb24sXG4gICAgICBzdXNwZW5zaW9uX2RhbXBpbmc6IHR1bmluZy5zdXNwZW5zaW9uX2RhbXBpbmcsXG4gICAgICBtYXhfc3VzcGVuc2lvbl90cmF2ZWw6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl90cmF2ZWwsXG4gICAgICBmcmljdGlvbl9zbGlwOiB0dW5pbmcuZnJpY3Rpb25fc2xpcCxcbiAgICAgIG1heF9zdXNwZW5zaW9uX2ZvcmNlOiB0dW5pbmcubWF4X3N1c3BlbnNpb25fZm9yY2VcbiAgICB9O1xuICB9XG5cbiAgYWRkV2hlZWwod2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsLCBjb25uZWN0aW9uX3BvaW50LCB3aGVlbF9kaXJlY3Rpb24sIHdoZWVsX2F4bGUsIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsIHdoZWVsX3JhZGl1cywgaXNfZnJvbnRfd2hlZWwsIHR1bmluZykge1xuICAgIGNvbnN0IHdoZWVsID0gbmV3IE1lc2god2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsKTtcblxuICAgIHdoZWVsLmNhc3RTaGFkb3cgPSB3aGVlbC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICB3aGVlbC5wb3NpdGlvbi5jb3B5KHdoZWVsX2RpcmVjdGlvbikubXVsdGlwbHlTY2FsYXIoc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCAvIDEwMCkuYWRkKGNvbm5lY3Rpb25fcG9pbnQpO1xuXG4gICAgdGhpcy53b3JsZC5hZGQod2hlZWwpO1xuICAgIHRoaXMud2hlZWxzLnB1c2god2hlZWwpO1xuXG4gICAgdGhpcy53b3JsZC5leGVjdXRlKCdhZGRXaGVlbCcsIHtcbiAgICAgIGlkOiB0aGlzLl9waHlzaWpzLmlkLFxuICAgICAgY29ubmVjdGlvbl9wb2ludDoge3g6IGNvbm5lY3Rpb25fcG9pbnQueCwgeTogY29ubmVjdGlvbl9wb2ludC55LCB6OiBjb25uZWN0aW9uX3BvaW50Lnp9LFxuICAgICAgd2hlZWxfZGlyZWN0aW9uOiB7eDogd2hlZWxfZGlyZWN0aW9uLngsIHk6IHdoZWVsX2RpcmVjdGlvbi55LCB6OiB3aGVlbF9kaXJlY3Rpb24uen0sXG4gICAgICB3aGVlbF9heGxlOiB7eDogd2hlZWxfYXhsZS54LCB5OiB3aGVlbF9heGxlLnksIHo6IHdoZWVsX2F4bGUuen0sXG4gICAgICBzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLFxuICAgICAgd2hlZWxfcmFkaXVzLFxuICAgICAgaXNfZnJvbnRfd2hlZWwsXG4gICAgICB0dW5pbmdcbiAgICB9KTtcbiAgfVxuXG4gIHNldFN0ZWVyaW5nKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0U3RlZXJpbmcnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBzdGVlcmluZzogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBzZXRCcmFrZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldEJyYWtlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbCwgYnJha2U6IGFtb3VudH0pO1xuICAgIGVsc2UgaWYgKHRoaXMud2hlZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aGVlbHMubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBicmFrZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG5cbiAgYXBwbHlFbmdpbmVGb3JjZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBmb3JjZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdhcHBseUVuZ2luZUZvcmNlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgZm9yY2U6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHtcbiAgU2NlbmUgYXMgU2NlbmVOYXRpdmUsXG4gIE1lc2gsXG4gIFNwaGVyZUdlb21ldHJ5LFxuICBNZXNoTm9ybWFsTWF0ZXJpYWwsXG4gIEJveEdlb21ldHJ5LFxuICBWZWN0b3IzXG59IGZyb20gJ3RocmVlJztcblxuaW1wb3J0IHtMb29wfSBmcm9tICd3aHMnO1xuXG5pbXBvcnQge1ZlaGljbGV9IGZyb20gJy4uLy4uL3ZlaGljbGUvdmVoaWNsZSc7XG5pbXBvcnQge0V2ZW50YWJsZX0gZnJvbSAnLi4vLi4vZXZlbnRhYmxlJztcblxuaW1wb3J0IHtcbiAgYWRkT2JqZWN0Q2hpbGRyZW4sXG4gIE1FU1NBR0VfVFlQRVMsXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRVxufSBmcm9tICcuLi8uLi9hcGknO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXb3JsZE1vZHVsZUJhc2UgZXh0ZW5kcyBFdmVudGFibGUge1xuICBzdGF0aWMgZGVmYXVsdHMgPSB7XG4gICAgZml4ZWRUaW1lU3RlcDogMS82MCxcbiAgICByYXRlTGltaXQ6IHRydWUsXG4gICAgYW1tbzogXCJcIixcbiAgICBzb2Z0Ym9keTogZmFsc2UsXG4gICAgZ3Jhdml0eTogbmV3IFZlY3RvcjMoMCwgLTEwMCwgMClcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oV29ybGRNb2R1bGVCYXNlLmRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgIHRoaXMub2JqZWN0cyA9IHt9O1xuICAgIHRoaXMudmVoaWNsZXMgPSB7fTtcbiAgICB0aGlzLmNvbnN0cmFpbnRzID0ge307XG4gICAgdGhpcy5pc1NpbXVsYXRpbmcgPSBmYWxzZTtcblxuICAgIHRoaXMuZ2V0T2JqZWN0SWQgPSAoKCkgPT4ge1xuICAgICAgbGV0IGlkID0gMTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBpZCsrO1xuICAgICAgfTtcbiAgICB9KSgpO1xuICB9XG5cbiAgc2V0dXAoKSB7XG4gICAgdGhpcy5yZWNlaXZlKGV2ZW50ID0+IHtcbiAgICAgIGxldCBfdGVtcCxcbiAgICAgICAgZGF0YSA9IGV2ZW50LmRhdGE7XG5cbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgJiYgZGF0YS5ieXRlTGVuZ3RoICE9PSAxKS8vIGJ5dGVMZW5ndGggPT09IDEgaXMgdGhlIHdvcmtlciBtYWtpbmcgYSBTVVBQT1JUX1RSQU5TRkVSQUJMRSB0ZXN0XG4gICAgICAgIGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICAvLyB0cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgICAgIHN3aXRjaCAoZGF0YVswXSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2NlbmUoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTb2Z0Ym9kaWVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5jbWQpIHtcbiAgICAgICAgLy8gbm9uLXRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICAgICAgc3dpdGNoIChkYXRhLmNtZCkge1xuICAgICAgICAgIGNhc2UgJ29iamVjdFJlYWR5JzpcbiAgICAgICAgICAgIF90ZW1wID0gZGF0YS5wYXJhbXM7XG4gICAgICAgICAgICBpZiAodGhpcy5vYmplY3RzW190ZW1wXSkgdGhpcy5vYmplY3RzW190ZW1wXS5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd3b3JsZFJlYWR5JzpcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgncmVhZHknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAnYW1tb0xvYWRlZCc6XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2xvYWRlZCcpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJQaHlzaWNzIGxvYWRpbmcgdGltZTogXCIgKyAocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgKyBcIm1zXCIpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd2ZWhpY2xlJzpcbiAgICAgICAgICAgIHdpbmRvdy50ZXN0ID0gZGF0YTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIERvIG5vdGhpbmcsIGp1c3Qgc2hvdyB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgUmVjZWl2ZWQ6ICR7ZGF0YS5jbWR9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmRpcihkYXRhLnBhcmFtcyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoIChkYXRhWzBdKSB7XG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTY2VuZShkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sbGlzaW9ucyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZlaGljbGVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29uc3RyYWludHMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVTY2VuZShpbmZvKSB7XG4gICAgbGV0IGluZGV4ID0gaW5mb1sxXTtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgaW5kZXggKiBSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLm9iamVjdHNbaW5mb1tvZmZzZXRdXTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldChcbiAgICAgICAgICBpbmZvW29mZnNldCArIDFdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgMl0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAzXVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPT09IGZhbHNlKSB7XG4gICAgICAgIG9iamVjdC5xdWF0ZXJuaW9uLnNldChcbiAgICAgICAgICBpbmZvW29mZnNldCArIDRdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNV0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA2XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDddXG4gICAgICAgICk7XG5cbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBkYXRhLmxpbmVhclZlbG9jaXR5LnNldChcbiAgICAgICAgaW5mb1tvZmZzZXQgKyA4XSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyA5XSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMF1cbiAgICAgICk7XG5cbiAgICAgIGRhdGEuYW5ndWxhclZlbG9jaXR5LnNldChcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMV0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTJdLFxuICAgICAgICBpbmZvW29mZnNldCArIDEzXVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChpbmZvLmJ1ZmZlciwgW2luZm8uYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuXG4gICAgdGhpcy5pc1NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3VwZGF0ZScpO1xuICB9XG5cbiAgdXBkYXRlU29mdGJvZGllcyhpbmZvKSB7XG4gICAgbGV0IGluZGV4ID0gaW5mb1sxXSxcbiAgICAgIG9mZnNldCA9IDI7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgc2l6ZSA9IGluZm9bb2Zmc2V0ICsgMV07XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLm9iamVjdHNbaW5mb1tvZmZzZXRdXTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBvYmplY3QuZ2VvbWV0cnkuYXR0cmlidXRlcztcbiAgICAgIGNvbnN0IHZvbHVtZVBvc2l0aW9ucyA9IGF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIGNvbnN0IG9mZnNldFZlcnQgPSBvZmZzZXQgKyAyO1xuXG4gICAgICAvLyBjb25zb2xlLmxvZyhkYXRhLmlkKTtcbiAgICAgIGlmICghZGF0YS5pc1NvZnRCb2R5UmVzZXQpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KDAsIDAsIDAsIDApO1xuXG4gICAgICAgIGRhdGEuaXNTb2Z0Qm9keVJlc2V0ID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudHlwZSA9PT0gXCJzb2Z0VHJpbWVzaFwiKSB7XG4gICAgICAgIGNvbnN0IHZvbHVtZU5vcm1hbHMgPSBhdHRyaWJ1dGVzLm5vcm1hbC5hcnJheTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDE4O1xuXG4gICAgICAgICAgY29uc3QgeDEgPSBpbmZvW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkxID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgejEgPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54MSA9IGluZm9bb2ZmcyArIDNdO1xuICAgICAgICAgIGNvbnN0IG55MSA9IGluZm9bb2ZmcyArIDRdO1xuICAgICAgICAgIGNvbnN0IG56MSA9IGluZm9bb2ZmcyArIDVdO1xuXG4gICAgICAgICAgY29uc3QgeDIgPSBpbmZvW29mZnMgKyA2XTtcbiAgICAgICAgICBjb25zdCB5MiA9IGluZm9bb2ZmcyArIDddO1xuICAgICAgICAgIGNvbnN0IHoyID0gaW5mb1tvZmZzICsgOF07XG5cbiAgICAgICAgICBjb25zdCBueDIgPSBpbmZvW29mZnMgKyA5XTtcbiAgICAgICAgICBjb25zdCBueTIgPSBpbmZvW29mZnMgKyAxMF07XG4gICAgICAgICAgY29uc3QgbnoyID0gaW5mb1tvZmZzICsgMTFdO1xuXG4gICAgICAgICAgY29uc3QgeDMgPSBpbmZvW29mZnMgKyAxMl07XG4gICAgICAgICAgY29uc3QgeTMgPSBpbmZvW29mZnMgKyAxM107XG4gICAgICAgICAgY29uc3QgejMgPSBpbmZvW29mZnMgKyAxNF07XG5cbiAgICAgICAgICBjb25zdCBueDMgPSBpbmZvW29mZnMgKyAxNV07XG4gICAgICAgICAgY29uc3QgbnkzID0gaW5mb1tvZmZzICsgMTZdO1xuICAgICAgICAgIGNvbnN0IG56MyA9IGluZm9bb2ZmcyArIDE3XTtcblxuICAgICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTldID0geDE7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgMV0gPSB5MTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAyXSA9IHoxO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgM10gPSB4MjtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA0XSA9IHkyO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDVdID0gejI7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA2XSA9IHgzO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDddID0geTM7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgOF0gPSB6MztcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTldID0gbngxO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAxXSA9IG55MTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgMl0gPSBuejE7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgM10gPSBueDI7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDRdID0gbnkyO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA1XSA9IG56MjtcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA2XSA9IG54MztcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgN10gPSBueTM7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDhdID0gbnozO1xuICAgICAgICB9XG5cbiAgICAgICAgYXR0cmlidXRlcy5ub3JtYWwubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiAxODtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGRhdGEudHlwZSA9PT0gXCJzb2Z0Um9wZU1lc2hcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICBjb25zdCB4ID0gaW5mb1tvZmZzXTtcbiAgICAgICAgICBjb25zdCB5ID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgeiA9IGluZm9bb2ZmcyArIDJdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2b2x1bWVOb3JtYWxzID0gYXR0cmlidXRlcy5ub3JtYWwuYXJyYXk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgY29uc3QgeCA9IGluZm9bb2Zmc107XG4gICAgICAgICAgY29uc3QgeSA9IGluZm9bb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHogPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54ID0gaW5mb1tvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkgPSBpbmZvW29mZnMgKyA0XTtcbiAgICAgICAgICBjb25zdCBueiA9IGluZm9bb2ZmcyArIDVdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcblxuICAgICAgICAgIC8vIEZJWE1FOiBOb3JtYWxzIGFyZSBwb2ludGVkIHRvIGxvb2sgaW5zaWRlO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDNdID0gbng7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDFdID0gbnk7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDJdID0gbno7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDY7XG4gICAgICB9XG5cbiAgICAgIGF0dHJpYnV0ZXMucG9zaXRpb24ubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgIC8vICAgdGhpcy5zZW5kKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG5cbiAgICB0aGlzLmlzU2ltdWxhdGluZyA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVmVoaWNsZXMoZGF0YSkge1xuICAgIGxldCB2ZWhpY2xlLCB3aGVlbDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogVkVISUNMRVJFUE9SVF9JVEVNU0laRTtcbiAgICAgIHZlaGljbGUgPSB0aGlzLnZlaGljbGVzW2RhdGFbb2Zmc2V0XV07XG5cbiAgICAgIGlmICh2ZWhpY2xlID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgd2hlZWwgPSB2ZWhpY2xlLndoZWVsc1tkYXRhW29mZnNldCArIDFdXTtcblxuICAgICAgd2hlZWwucG9zaXRpb24uc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDJdLFxuICAgICAgICBkYXRhW29mZnNldCArIDNdLFxuICAgICAgICBkYXRhW29mZnNldCArIDRdXG4gICAgICApO1xuXG4gICAgICB3aGVlbC5xdWF0ZXJuaW9uLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA1XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA2XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA3XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA4XVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29uc3RyYWludHMoZGF0YSkge1xuICAgIGxldCBjb25zdHJhaW50LCBvYmplY3Q7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IChkYXRhLmxlbmd0aCAtIDEpIC8gQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAxICsgaSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdHJhaW50ID0gdGhpcy5jb25zdHJhaW50c1tkYXRhW29mZnNldF1dO1xuICAgICAgb2JqZWN0ID0gdGhpcy5vYmplY3RzW2RhdGFbb2Zmc2V0ICsgMV1dO1xuXG4gICAgICBpZiAoY29uc3RyYWludCA9PT0gdW5kZWZpbmVkIHx8IG9iamVjdCA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAzXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA0XVxuICAgICAgKTtcblxuICAgICAgdGVtcDFNYXRyaXg0LmV4dHJhY3RSb3RhdGlvbihvYmplY3QubWF0cml4KTtcbiAgICAgIHRlbXAxVmVjdG9yMy5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcblxuICAgICAgY29uc3RyYWludC5wb3NpdGlvbmEuYWRkVmVjdG9ycyhvYmplY3QucG9zaXRpb24sIHRlbXAxVmVjdG9yMyk7XG4gICAgICBjb25zdHJhaW50LmFwcGxpZWRJbXB1bHNlID0gZGF0YVtvZmZzZXQgKyA1XTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29sbGlzaW9ucyhpbmZvKSB7XG4gICAgLyoqXG4gICAgICogI1RPRE9cbiAgICAgKiBUaGlzIGlzIHByb2JhYmx5IHRoZSB3b3JzdCB3YXkgZXZlciB0byBoYW5kbGUgY29sbGlzaW9ucy4gVGhlIGluaGVyZW50IGV2aWxuZXNzIGlzIGEgcmVzaWR1YWxcbiAgICAgKiBlZmZlY3QgZnJvbSB0aGUgcHJldmlvdXMgdmVyc2lvbidzIGV2aWxuZXNzIHdoaWNoIG11dGF0ZWQgd2hlbiBzd2l0Y2hpbmcgdG8gdHJhbnNmZXJhYmxlIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgZmVlbCBpbmNsaW5lZCB0byBtYWtlIHRoaXMgYmV0dGVyLCBwbGVhc2UgZG8gc28uXG4gICAgICovXG5cbiAgICBjb25zdCBjb2xsaXNpb25zID0ge30sXG4gICAgICBub3JtYWxfb2Zmc2V0cyA9IHt9O1xuXG4gICAgLy8gQnVpbGQgY29sbGlzaW9uIG1hbmlmZXN0XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmZvWzFdOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyBpICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gaW5mb1tvZmZzZXRdO1xuICAgICAgY29uc3Qgb2JqZWN0MiA9IGluZm9bb2Zmc2V0ICsgMV07XG5cbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdH0tJHtvYmplY3QyfWBdID0gb2Zmc2V0ICsgMjtcbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdDJ9LSR7b2JqZWN0fWBdID0gLTEgKiAob2Zmc2V0ICsgMik7XG5cbiAgICAgIC8vIFJlZ2lzdGVyIGNvbGxpc2lvbnMgZm9yIGJvdGggdGhlIG9iamVjdCBjb2xsaWRpbmcgYW5kIHRoZSBvYmplY3QgYmVpbmcgY29sbGlkZWQgd2l0aFxuICAgICAgaWYgKCFjb2xsaXNpb25zW29iamVjdF0pIGNvbGxpc2lvbnNbb2JqZWN0XSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3RdLnB1c2gob2JqZWN0Mik7XG5cbiAgICAgIGlmICghY29sbGlzaW9uc1tvYmplY3QyXSkgY29sbGlzaW9uc1tvYmplY3QyXSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3QyXS5wdXNoKG9iamVjdCk7XG4gICAgfVxuXG4gICAgLy8gRGVhbCB3aXRoIGNvbGxpc2lvbnNcbiAgICBmb3IgKGNvbnN0IGlkMSBpbiB0aGlzLm9iamVjdHMpIHtcbiAgICAgIGlmICghdGhpcy5vYmplY3RzLmhhc093blByb3BlcnR5KGlkMSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5vYmplY3RzW2lkMV07XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgLy8gSWYgb2JqZWN0IHRvdWNoZXMgYW55dGhpbmcsIC4uLlxuICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXSkge1xuICAgICAgICAvLyBDbGVhbiB1cCB0b3VjaGVzIGFycmF5XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGF0YS50b3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXS5pbmRleE9mKGRhdGEudG91Y2hlc1tqXSkgPT09IC0xKVxuICAgICAgICAgICAgZGF0YS50b3VjaGVzLnNwbGljZShqLS0sIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIGVhY2ggY29sbGlkaW5nIG9iamVjdFxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbGxpc2lvbnNbaWQxXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGlkMiA9IGNvbGxpc2lvbnNbaWQxXVtqXTtcbiAgICAgICAgICBjb25zdCBvYmplY3QyID0gdGhpcy5vYmplY3RzW2lkMl07XG5cbiAgICAgICAgICBpZiAob2JqZWN0Mikge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IG9iamVjdDIuY29tcG9uZW50O1xuICAgICAgICAgICAgY29uc3QgZGF0YTIgPSBjb21wb25lbnQyLnVzZSgncGh5c2ljcycpLmRhdGE7XG4gICAgICAgICAgICAvLyBJZiBvYmplY3Qgd2FzIG5vdCBhbHJlYWR5IHRvdWNoaW5nIG9iamVjdDIsIG5vdGlmeSBvYmplY3RcbiAgICAgICAgICAgIGlmIChkYXRhLnRvdWNoZXMuaW5kZXhPZihpZDIpID09PSAtMSkge1xuICAgICAgICAgICAgICBkYXRhLnRvdWNoZXMucHVzaChpZDIpO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHZlbCA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuICAgICAgICAgICAgICBjb25zdCB2ZWwyID0gY29tcG9uZW50Mi51c2UoJ3BoeXNpY3MnKS5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuXG4gICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zdWJWZWN0b3JzKHZlbCwgdmVsMik7XG4gICAgICAgICAgICAgIGNvbnN0IHRlbXAxID0gdGVtcDFWZWN0b3IzLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnN1YlZlY3RvcnModmVsLCB2ZWwyKTtcbiAgICAgICAgICAgICAgY29uc3QgdGVtcDIgPSB0ZW1wMVZlY3RvcjMuY2xvbmUoKTtcblxuICAgICAgICAgICAgICBsZXQgbm9ybWFsX29mZnNldCA9IG5vcm1hbF9vZmZzZXRzW2Ake2RhdGEuaWR9LSR7ZGF0YTIuaWR9YF07XG5cbiAgICAgICAgICAgICAgaWYgKG5vcm1hbF9vZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIC1pbmZvW25vcm1hbF9vZmZzZXRdLFxuICAgICAgICAgICAgICAgICAgLWluZm9bbm9ybWFsX29mZnNldCArIDFdLFxuICAgICAgICAgICAgICAgICAgLWluZm9bbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub3JtYWxfb2Zmc2V0ICo9IC0xO1xuXG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIGluZm9bbm9ybWFsX29mZnNldF0sXG4gICAgICAgICAgICAgICAgICBpbmZvW25vcm1hbF9vZmZzZXQgKyAxXSxcbiAgICAgICAgICAgICAgICAgIGluZm9bbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbXBvbmVudC5lbWl0KCdjb2xsaXNpb24nLCBvYmplY3QyLCB0ZW1wMSwgdGVtcDIsIHRlbXAxVmVjdG9yMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgZGF0YS50b3VjaGVzLmxlbmd0aCA9IDA7IC8vIG5vdCB0b3VjaGluZyBvdGhlciBvYmplY3RzXG4gICAgfVxuXG4gICAgdGhpcy5jb2xsaXNpb25zID0gY29sbGlzaW9ucztcblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy5zZW5kKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICBhZGRDb25zdHJhaW50KGNvbnN0cmFpbnQsIHNob3dfbWFya2VyKSB7XG4gICAgY29uc3RyYWludC5pZCA9IHRoaXMuZ2V0T2JqZWN0SWQoKTtcbiAgICB0aGlzLmNvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdID0gY29uc3RyYWludDtcbiAgICBjb25zdHJhaW50LndvcmxkTW9kdWxlID0gdGhpcztcbiAgICB0aGlzLmV4ZWN1dGUoJ2FkZENvbnN0cmFpbnQnLCBjb25zdHJhaW50LmdldERlZmluaXRpb24oKSk7XG5cbiAgICBpZiAoc2hvd19tYXJrZXIpIHtcbiAgICAgIGxldCBtYXJrZXI7XG5cbiAgICAgIHN3aXRjaCAoY29uc3RyYWludC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ3BvaW50JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLm9iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdoaW5nZSc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc2xpZGVyJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBCb3hHZW9tZXRyeSgxMCwgMSwgMSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuXG4gICAgICAgICAgLy8gVGhpcyByb3RhdGlvbiBpc24ndCByaWdodCBpZiBhbGwgdGhyZWUgYXhpcyBhcmUgbm9uLTAgdmFsdWVzXG4gICAgICAgICAgLy8gVE9ETzogY2hhbmdlIG1hcmtlcidzIHJvdGF0aW9uIG9yZGVyIHRvIFpZWFxuICAgICAgICAgIG1hcmtlci5yb3RhdGlvbi5zZXQoXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMueSwgLy8geWVzLCB5IGFuZFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLngsIC8vIHggYXhpcyBhcmUgc3dhcHBlZFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLnpcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMub2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2NvbmV0d2lzdCc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnZG9mJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLm9iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29uc3RyYWludDtcbiAgfVxuXG4gIG9uU2ltdWxhdGlvblJlc3VtZSgpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ29uU2ltdWxhdGlvblJlc3VtZScsIHt9KTtcbiAgfVxuXG4gIHJlbW92ZUNvbnN0cmFpbnQoY29uc3RyYWludCkge1xuICAgIGlmICh0aGlzLmNvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlQ29uc3RyYWludCcsIHtpZDogY29uc3RyYWludC5pZH0pO1xuICAgICAgZGVsZXRlIHRoaXMuY29uc3RyYWludHNbY29uc3RyYWludC5pZF07XG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZShjbWQsIHBhcmFtcykge1xuICAgIHRoaXMuc2VuZCh7Y21kLCBwYXJhbXN9KTtcbiAgfVxuXG4gIG9uQWRkQ2FsbGJhY2soY29tcG9uZW50KSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gY29tcG9uZW50Lm5hdGl2ZTtcbiAgICBjb25zdCBkYXRhID0gb2JqZWN0LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnNldCgnbW9kdWxlOndvcmxkJywgdGhpcyk7XG4gICAgICBkYXRhLmlkID0gdGhpcy5nZXRPYmplY3RJZCgpO1xuICAgICAgb2JqZWN0LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhID0gZGF0YTtcblxuICAgICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFZlaGljbGUpIHtcbiAgICAgICAgdGhpcy5vbkFkZENhbGxiYWNrKG9iamVjdC5tZXNoKTtcbiAgICAgICAgdGhpcy52ZWhpY2xlc1tkYXRhLmlkXSA9IG9iamVjdDtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRWZWhpY2xlJywgZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vYmplY3RzW2RhdGEuaWRdID0gb2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmplY3QuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgZGF0YS5jaGlsZHJlbiA9IFtdO1xuICAgICAgICAgIGFkZE9iamVjdENoaWxkcmVuKG9iamVjdCwgb2JqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG9iamVjdC5xdWF0ZXJuaW9uLnNldEZyb21FdWxlcihvYmplY3Qucm90YXRpb24pO1xuICAgICAgICAvL1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhvYmplY3QuY29tcG9uZW50KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2cob2JqZWN0LnJvdGF0aW9uKTtcblxuICAgICAgICAvLyBPYmplY3Qgc3RhcnRpbmcgcG9zaXRpb24gKyByb3RhdGlvblxuICAgICAgICBkYXRhLnBvc2l0aW9uID0ge1xuICAgICAgICAgIHg6IG9iamVjdC5wb3NpdGlvbi54LFxuICAgICAgICAgIHk6IG9iamVjdC5wb3NpdGlvbi55LFxuICAgICAgICAgIHo6IG9iamVjdC5wb3NpdGlvbi56XG4gICAgICAgIH07XG5cbiAgICAgICAgZGF0YS5yb3RhdGlvbiA9IHtcbiAgICAgICAgICB4OiBvYmplY3QucXVhdGVybmlvbi54LFxuICAgICAgICAgIHk6IG9iamVjdC5xdWF0ZXJuaW9uLnksXG4gICAgICAgICAgejogb2JqZWN0LnF1YXRlcm5pb24ueixcbiAgICAgICAgICB3OiBvYmplY3QucXVhdGVybmlvbi53XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGRhdGEud2lkdGgpIGRhdGEud2lkdGggKj0gb2JqZWN0LnNjYWxlLng7XG4gICAgICAgIGlmIChkYXRhLmhlaWdodCkgZGF0YS5oZWlnaHQgKj0gb2JqZWN0LnNjYWxlLnk7XG4gICAgICAgIGlmIChkYXRhLmRlcHRoKSBkYXRhLmRlcHRoICo9IG9iamVjdC5zY2FsZS56O1xuXG4gICAgICAgIHRoaXMuZXhlY3V0ZSgnYWRkT2JqZWN0JywgZGF0YSk7XG4gICAgICB9XG5cbiAgICAgIGNvbXBvbmVudC5lbWl0KCdwaHlzaWNzOmFkZGVkJyk7XG4gICAgfVxuICB9XG5cbiAgb25SZW1vdmVDYWxsYmFjayhjb21wb25lbnQpIHtcbiAgICBjb25zdCBvYmplY3QgPSBjb21wb25lbnQubmF0aXZlO1xuXG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFZlaGljbGUpIHtcbiAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlVmVoaWNsZScsIHtpZDogb2JqZWN0Ll9waHlzaWpzLmlkfSk7XG4gICAgICB3aGlsZSAob2JqZWN0LndoZWVscy5sZW5ndGgpIHRoaXMucmVtb3ZlKG9iamVjdC53aGVlbHMucG9wKCkpO1xuXG4gICAgICB0aGlzLnJlbW92ZShvYmplY3QubWVzaCk7XG4gICAgICB0aGlzLnZlaGljbGVzW29iamVjdC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNZXNoLnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzLCBvYmplY3QpO1xuXG4gICAgICBpZiAob2JqZWN0Ll9waHlzaWpzKSB7XG4gICAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnJlbW92ZSgnbW9kdWxlOndvcmxkJyk7XG4gICAgICAgIHRoaXMub2JqZWN0c1tvYmplY3QuX3BoeXNpanMuaWRdID0gbnVsbDtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVPYmplY3QnLCB7aWQ6IG9iamVjdC5fcGh5c2lqcy5pZH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRlZmVyKGZ1bmMsIGFyZ3MpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzTG9hZGVkKSB7XG4gICAgICAgIGZ1bmMoLi4uYXJncyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB0aGlzLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICBtYW5hZ2VyLmRlZmluZSgncGh5c2ljcycpO1xuICAgIG1hbmFnZXIuc2V0KCdwaHlzaWNzV29ya2VyJywgdGhpcy53b3JrZXIpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG9uQWRkKGNvbXBvbmVudCwgc2VsZikge1xuICAgICAgaWYgKGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSkgcmV0dXJuIHNlbGYuZGVmZXIoc2VsZi5vbkFkZENhbGxiYWNrLmJpbmQoc2VsZiksIFtjb21wb25lbnRdKTtcbiAgICAgIHJldHVybjtcbiAgICB9LFxuXG4gICAgb25SZW1vdmUoY29tcG9uZW50LCBzZWxmKSB7XG4gICAgICBpZiAoY29tcG9uZW50LnVzZSgncGh5c2ljcycpKSByZXR1cm4gc2VsZi5kZWZlcihzZWxmLm9uUmVtb3ZlQ2FsbGJhY2suYmluZChzZWxmKSwgW2NvbXBvbmVudF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIC8vIC4uLlxuXG4gICAgdGhpcy5zZXRGaXhlZFRpbWVTdGVwID0gZnVuY3Rpb24oZml4ZWRUaW1lU3RlcCkge1xuICAgICAgaWYgKGZpeGVkVGltZVN0ZXApIHNlbGYuZXhlY3V0ZSgnc2V0Rml4ZWRUaW1lU3RlcCcsIGZpeGVkVGltZVN0ZXApO1xuICAgIH1cblxuICAgIHRoaXMuc2V0R3Jhdml0eSA9IGZ1bmN0aW9uKGdyYXZpdHkpIHtcbiAgICAgIGlmIChncmF2aXR5KSBzZWxmLmV4ZWN1dGUoJ3NldEdyYXZpdHknLCBncmF2aXR5KTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZENvbnN0cmFpbnQgPSBzZWxmLmFkZENvbnN0cmFpbnQuYmluZChzZWxmKTtcblxuICAgIHRoaXMuc2ltdWxhdGUgPSBmdW5jdGlvbih0aW1lU3RlcCwgbWF4U3ViU3RlcHMpIHtcbiAgICAgIGlmIChzZWxmLl9zdGF0cykgc2VsZi5fc3RhdHMuYmVnaW4oKTtcblxuICAgICAgaWYgKHNlbGYuaXNTaW11bGF0aW5nKSByZXR1cm4gZmFsc2U7XG4gICAgICBzZWxmLmlzU2ltdWxhdGluZyA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3Qgb2JqZWN0X2lkIGluIHNlbGYub2JqZWN0cykge1xuICAgICAgICBpZiAoIXNlbGYub2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShvYmplY3RfaWQpKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCBvYmplY3QgPSBzZWxmLm9iamVjdHNbb2JqZWN0X2lkXTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICAgIGlmIChvYmplY3QgIT09IG51bGwgJiYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gfHwgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikpIHtcbiAgICAgICAgICBjb25zdCB1cGRhdGUgPSB7aWQ6IGRhdGEuaWR9O1xuXG4gICAgICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24pIHtcbiAgICAgICAgICAgIHVwZGF0ZS5wb3MgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICB5OiBvYmplY3QucG9zaXRpb24ueSxcbiAgICAgICAgICAgICAgejogb2JqZWN0LnBvc2l0aW9uLnpcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnF1YXQgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5xdWF0ZXJuaW9uLnksXG4gICAgICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLmV4ZWN1dGUoJ3VwZGF0ZVRyYW5zZm9ybScsIHVwZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5leGVjdXRlKCdzaW11bGF0ZScsIHt0aW1lU3RlcCwgbWF4U3ViU3RlcHN9KTtcblxuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5lbmQoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGNvbnN0IHNpbXVsYXRlUHJvY2VzcyA9ICh0KSA9PiB7XG4gICAgLy8gICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHNpbXVsYXRlUHJvY2Vzcyk7XG5cbiAgICAvLyAgIHRoaXMuc2ltdWxhdGUoMS82MCwgMSk7IC8vIGRlbHRhLCAxXG4gICAgLy8gfVxuXG4gICAgLy8gc2ltdWxhdGVQcm9jZXNzKCk7XG5cbiAgICBzZWxmLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgIHNlbGYuc2ltdWxhdGVMb29wID0gbmV3IExvb3AoKGNsb2NrKSA9PiB7XG4gICAgICAgIHRoaXMuc2ltdWxhdGUoY2xvY2suZ2V0RGVsdGEoKSwgMSk7IC8vIGRlbHRhLCAxXG4gICAgICB9KTtcblxuICAgICAgc2VsZi5zaW11bGF0ZUxvb3Auc3RhcnQodGhpcyk7XG5cbiAgICAgIGNvbnNvbGUubG9nKHNlbGYub3B0aW9ucy5ncmF2aXR5KTtcbiAgICAgIHRoaXMuc2V0R3Jhdml0eShzZWxmLm9wdGlvbnMuZ3Jhdml0eSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsInZhciBUQVJHRVQgPSB0eXBlb2YgU3ltYm9sID09PSAndW5kZWZpbmVkJyA/ICdfX3RhcmdldCcgOiBTeW1ib2woKSxcbiAgICBTQ1JJUFRfVFlQRSA9ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyxcbiAgICBCbG9iQnVpbGRlciA9IHdpbmRvdy5CbG9iQnVpbGRlciB8fCB3aW5kb3cuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1vekJsb2JCdWlsZGVyIHx8IHdpbmRvdy5NU0Jsb2JCdWlsZGVyLFxuICAgIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCxcbiAgICBXb3JrZXIgPSB3aW5kb3cuV29ya2VyO1xuXG4vKipcbiAqIFJldHVybnMgYSB3cmFwcGVyIGFyb3VuZCBXZWIgV29ya2VyIGNvZGUgdGhhdCBpcyBjb25zdHJ1Y3RpYmxlLlxuICpcbiAqIEBmdW5jdGlvbiBzaGltV29ya2VyXG4gKlxuICogQHBhcmFtIHsgU3RyaW5nIH0gICAgZmlsZW5hbWUgICAgVGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAqIEBwYXJhbSB7IEZ1bmN0aW9uIH0gIGZuICAgICAgICAgIEZ1bmN0aW9uIHdyYXBwaW5nIHRoZSBjb2RlIG9mIHRoZSB3b3JrZXJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2hpbVdvcmtlciAoZmlsZW5hbWUsIGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIFNoaW1Xb3JrZXIgKGZvcmNlRmFsbGJhY2spIHtcbiAgICAgICAgdmFyIG8gPSB0aGlzO1xuXG4gICAgICAgIGlmICghZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgV29ya2VyKGZpbGVuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChXb3JrZXIgJiYgIWZvcmNlRmFsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGZ1bmN0aW9uJ3MgaW5uZXIgY29kZSB0byBhIHN0cmluZyB0byBjb25zdHJ1Y3QgdGhlIHdvcmtlclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGZuLnRvU3RyaW5nKCkucmVwbGFjZSgvXmZ1bmN0aW9uLis/ey8sICcnKS5zbGljZSgwLCAtMSksXG4gICAgICAgICAgICAgICAgb2JqVVJMID0gY3JlYXRlU291cmNlT2JqZWN0KHNvdXJjZSk7XG5cbiAgICAgICAgICAgIHRoaXNbVEFSR0VUXSA9IG5ldyBXb3JrZXIob2JqVVJMKTtcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwob2JqVVJMKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW1RBUkdFVF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc2VsZlNoaW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlOiBmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby5vbm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IG8ub25tZXNzYWdlKHsgZGF0YTogbSwgdGFyZ2V0OiBzZWxmU2hpbSB9KSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZuLmNhbGwoc2VsZlNoaW0pO1xuICAgICAgICAgICAgdGhpcy5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNlbGZTaGltLm9ubWVzc2FnZSh7IGRhdGE6IG0sIHRhcmdldDogbyB9KSB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmlzVGhpc1RocmVhZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLy8gVGVzdCBXb3JrZXIgY2FwYWJpbGl0aWVzXG5pZiAoV29ya2VyKSB7XG4gICAgdmFyIHRlc3RXb3JrZXIsXG4gICAgICAgIG9ialVSTCA9IGNyZWF0ZVNvdXJjZU9iamVjdCgnc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7fScpLFxuICAgICAgICB0ZXN0QXJyYXkgPSBuZXcgVWludDhBcnJheSgxKTtcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIE5vIHdvcmtlcnMgdmlhIGJsb2JzIGluIEVkZ2UgMTIgYW5kIElFIDExIGFuZCBsb3dlciA6KFxuICAgICAgICBpZiAoLyg/OlRyaWRlbnR8RWRnZSlcXC8oPzpbNTY3XXwxMikvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXN0V29ya2VyID0gbmV3IFdvcmtlcihvYmpVUkwpO1xuXG4gICAgICAgIC8vIE5hdGl2ZSBicm93c2VyIG9uIHNvbWUgU2Ftc3VuZyBkZXZpY2VzIHRocm93cyBmb3IgdHJhbnNmZXJhYmxlcywgbGV0J3MgZGV0ZWN0IGl0XG4gICAgICAgIHRlc3RXb3JrZXIucG9zdE1lc3NhZ2UodGVzdEFycmF5LCBbdGVzdEFycmF5LmJ1ZmZlcl0pO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBXb3JrZXIgPSBudWxsO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChvYmpVUkwpO1xuICAgICAgICBpZiAodGVzdFdvcmtlcikge1xuICAgICAgICAgICAgdGVzdFdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU291cmNlT2JqZWN0KHN0cikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtzdHJdLCB7IHR5cGU6IFNDUklQVF9UWVBFIH0pKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYkJ1aWxkZXIoKTtcbiAgICAgICAgYmxvYi5hcHBlbmQoc3RyKTtcbiAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYi5nZXRCbG9iKHR5cGUpKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgc2hpbVdvcmtlciBmcm9tICdyb2xsdXAtcGx1Z2luLWJ1bmRsZS13b3JrZXInO1xuZXhwb3J0IGRlZmF1bHQgbmV3IHNoaW1Xb3JrZXIoXCIuLi93b3JrZXIuanNcIiwgZnVuY3Rpb24gKHdpbmRvdywgZG9jdW1lbnQpIHtcbnZhciBzZWxmID0gdGhpcztcbmZ1bmN0aW9uIEV2ZW50cyh0YXJnZXQpIHtcbiAgdmFyIGV2ZW50cyA9IHt9LFxuICAgIGVtcHR5ID0gW107XG4gIHRhcmdldCA9IHRhcmdldCB8fCB0aGlzXG4gIC8qKlxuICAgKiAgT246IGxpc3RlbiB0byBldmVudHNcbiAgICovXG4gIHRhcmdldC5vbiA9IGZ1bmN0aW9uICh0eXBlLCBmdW5jLCBjdHgpIHtcbiAgICAoZXZlbnRzW3R5cGVdID0gZXZlbnRzW3R5cGVdIHx8IFtdKS5wdXNoKFtmdW5jLCBjdHhdKVxuICAgIHJldHVybiB0YXJnZXRcbiAgfVxuICAvKipcbiAgICogIE9mZjogc3RvcCBsaXN0ZW5pbmcgdG8gZXZlbnQgLyBzcGVjaWZpYyBjYWxsYmFja1xuICAgKi9cbiAgdGFyZ2V0Lm9mZiA9IGZ1bmN0aW9uICh0eXBlLCBmdW5jKSB7XG4gICAgdHlwZSB8fCAoZXZlbnRzID0ge30pXG4gICAgdmFyIGxpc3QgPSBldmVudHNbdHlwZV0gfHwgZW1wdHksXG4gICAgICBpID0gbGlzdC5sZW5ndGggPSBmdW5jID8gbGlzdC5sZW5ndGggOiAwO1xuICAgIHdoaWxlIChpLS0pIGZ1bmMgPT0gbGlzdFtpXVswXSAmJiBsaXN0LnNwbGljZShpLCAxKVxuICAgIHJldHVybiB0YXJnZXRcbiAgfVxuICAvKipcbiAgICogRW1pdDogc2VuZCBldmVudCwgY2FsbGJhY2tzIHdpbGwgYmUgdHJpZ2dlcmVkXG4gICAqL1xuICB0YXJnZXQuZW1pdCA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgdmFyIGUgPSBldmVudHNbdHlwZV0gfHwgZW1wdHksXG4gICAgICBsaXN0ID0gZS5sZW5ndGggPiAwID8gZS5zbGljZSgwLCBlLmxlbmd0aCkgOiBlLFxuICAgICAgaSA9IDAsXG4gICAgICBqO1xuICAgIHdoaWxlIChqID0gbGlzdFtpKytdKSBqWzBdLmFwcGx5KGpbMV0sIGVtcHR5LnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSlcbiAgICByZXR1cm4gdGFyZ2V0XG4gIH07XG59O1xuXG5jb25zdCBpbnNpZGVXb3JrZXIgPSAhc2VsZi5kb2N1bWVudDtcbmlmICghaW5zaWRlV29ya2VyKSBzZWxmID0gbmV3IEV2ZW50cygpO1xuXG5sZXQgc2VuZCA9IGluc2lkZVdvcmtlciA/IChzZWxmLndlYmtpdFBvc3RNZXNzYWdlIHx8IHNlbGYucG9zdE1lc3NhZ2UpIDogZnVuY3Rpb24gKGRhdGEpIHtcbiAgc2VsZi5lbWl0KCdtZXNzYWdlJywgeyBkYXRhIH0pO1xufTtcblxuc2VsZi5zZW5kID0gc2VuZDtcblxubGV0IFNVUFBPUlRfVFJBTlNGRVJBQkxFO1xuXG5pZiAoaW5zaWRlV29ya2VyKSB7XG4gIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKDEpO1xuXG4gIHNlbmQoYWIsIFthYl0pO1xuICBTVVBQT1JUX1RSQU5TRkVSQUJMRSA9IChhYi5ieXRlTGVuZ3RoID09PSAwKTtcbn1cblxuY29uc3QgTUVTU0FHRV9UWVBFUyA9IHtcbiAgV09STERSRVBPUlQ6IDAsXG4gIENPTExJU0lPTlJFUE9SVDogMSxcbiAgVkVISUNMRVJFUE9SVDogMixcbiAgQ09OU1RSQUlOVFJFUE9SVDogMyxcbiAgU09GVFJFUE9SVDogNFxufTtcblxuLy8gdGVtcCB2YXJpYWJsZXNcbmxldCBfb2JqZWN0LFxuICBfdmVjdG9yLFxuICBfdHJhbnNmb3JtLFxuICBfdHJhbnNmb3JtX3BvcyxcbiAgX3NvZnRib2R5X2VuYWJsZWQgPSBmYWxzZSxcbiAgbGFzdF9zaW11bGF0aW9uX2R1cmF0aW9uID0gMCxcblxuICBfbnVtX29iamVjdHMgPSAwLFxuICBfbnVtX3JpZ2lkYm9keV9vYmplY3RzID0gMCxcbiAgX251bV9zb2Z0Ym9keV9vYmplY3RzID0gMCxcbiAgX251bV93aGVlbHMgPSAwLFxuICBfbnVtX2NvbnN0cmFpbnRzID0gMCxcbiAgX3NvZnRib2R5X3JlcG9ydF9zaXplID0gMCxcblxuICAvLyB3b3JsZCB2YXJpYWJsZXNcbiAgZml4ZWRUaW1lU3RlcCwgLy8gdXNlZCB3aGVuIGNhbGxpbmcgc3RlcFNpbXVsYXRpb25cbiAgbGFzdF9zaW11bGF0aW9uX3RpbWUsXG5cbiAgd29ybGQsXG4gIF92ZWMzXzEsXG4gIF92ZWMzXzIsXG4gIF92ZWMzXzMsXG4gIF9xdWF0O1xuXG4vLyBwcml2YXRlIGNhY2hlXG5jb25zdCBwdWJsaWNfZnVuY3Rpb25zID0ge30sXG4gIF9vYmplY3RzID0gW10sXG4gIF92ZWhpY2xlcyA9IFtdLFxuICBfY29uc3RyYWludHMgPSBbXSxcbiAgX29iamVjdHNfYW1tbyA9IHt9LFxuICBfb2JqZWN0X3NoYXBlcyA9IHt9LFxuXG4gIC8vIFRoZSBmb2xsb3dpbmcgb2JqZWN0cyBhcmUgdG8gdHJhY2sgb2JqZWN0cyB0aGF0IGFtbW8uanMgZG9lc24ndCBjbGVhblxuICAvLyB1cC4gQWxsIGFyZSBjbGVhbmVkIHVwIHdoZW4gdGhleSdyZSBjb3JyZXNwb25kaW5nIGJvZHkgaXMgZGVzdHJveWVkLlxuICAvLyBVbmZvcnR1bmF0ZWx5LCBpdCdzIHZlcnkgZGlmZmljdWx0IHRvIGdldCBhdCB0aGVzZSBvYmplY3RzIGZyb20gdGhlXG4gIC8vIGJvZHksIHNvIHdlIGhhdmUgdG8gdHJhY2sgdGhlbSBvdXJzZWx2ZXMuXG4gIF9tb3Rpb25fc3RhdGVzID0ge30sXG4gIC8vIERvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgaXQgZm9yIGNhY2hlZCBzaGFwZXMuXG4gIF9ub25jYWNoZWRfc2hhcGVzID0ge30sXG4gIC8vIEEgYm9keSB3aXRoIGEgY29tcG91bmQgc2hhcGUgYWx3YXlzIGhhcyBhIHJlZ3VsYXIgc2hhcGUgYXMgd2VsbCwgc28gd2VcbiAgLy8gaGF2ZSB0cmFjayB0aGVtIHNlcGFyYXRlbHkuXG4gIF9jb21wb3VuZF9zaGFwZXMgPSB7fTtcblxuLy8gb2JqZWN0IHJlcG9ydGluZ1xubGV0IFJFUE9SVF9DSFVOS1NJWkUsIC8vIHJlcG9ydCBhcnJheSBpcyBpbmNyZWFzZWQgaW4gaW5jcmVtZW50cyBvZiB0aGlzIGNodW5rIHNpemVcbiAgd29ybGRyZXBvcnQsXG4gIHNvZnRyZXBvcnQsXG4gIGNvbGxpc2lvbnJlcG9ydCxcbiAgdmVoaWNsZXJlcG9ydCxcbiAgY29uc3RyYWludHJlcG9ydDtcblxuY29uc3QgV09STERSRVBPUlRfSVRFTVNJWkUgPSAxNCwgLy8gaG93IG1hbnkgZmxvYXQgdmFsdWVzIGVhY2ggcmVwb3J0ZWQgaXRlbSBuZWVkc1xuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgPSA1LCAvLyBvbmUgZmxvYXQgZm9yIGVhY2ggb2JqZWN0IGlkLCBhbmQgYSBWZWMzIGNvbnRhY3Qgbm9ybWFsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgPSA5LCAvLyB2ZWhpY2xlIGlkLCB3aGVlbCBpbmRleCwgMyBmb3IgcG9zaXRpb24sIDQgZm9yIHJvdGF0aW9uXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUgPSA2OyAvLyBjb25zdHJhaW50IGlkLCBvZmZzZXQgb2JqZWN0LCBvZmZzZXQsIGFwcGxpZWQgaW1wdWxzZVxuXG5jb25zdCBnZXRTaGFwZUZyb21DYWNoZSA9IChjYWNoZV9rZXkpID0+IHtcbiAgaWYgKF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV0gIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XTtcblxuICByZXR1cm4gbnVsbDtcbn07XG5cbmNvbnN0IHNldFNoYXBlQ2FjaGUgPSAoY2FjaGVfa2V5LCBzaGFwZSkgPT4ge1xuICBfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldID0gc2hhcGU7XG59O1xuXG5jb25zdCBjcmVhdGVTaGFwZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBsZXQgc2hhcGU7XG5cbiAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuICBzd2l0Y2ggKGRlc2NyaXB0aW9uLnR5cGUpIHtcbiAgY2FzZSAnY29tcG91bmQnOlxuICAgIHtcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb21wb3VuZFNoYXBlKCk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAncGxhbmUnOlxuICAgIHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBwbGFuZV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC54fV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC55fV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC56fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ubm9ybWFsLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ubm9ybWFsLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ubm9ybWFsLnopO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0U3RhdGljUGxhbmVTaGFwZShfdmVjM18xLCAwKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdib3gnOlxuICAgIHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBib3hfJHtkZXNjcmlwdGlvbi53aWR0aH1fJHtkZXNjcmlwdGlvbi5oZWlnaHR9XyR7ZGVzY3JpcHRpb24uZGVwdGh9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi53aWR0aCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uaGVpZ2h0IC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5kZXB0aCAvIDIpO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Qm94U2hhcGUoX3ZlYzNfMSk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnc3BoZXJlJzpcbiAgICB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgc3BoZXJlXyR7ZGVzY3JpcHRpb24ucmFkaXVzfWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0U3BoZXJlU2hhcGUoZGVzY3JpcHRpb24ucmFkaXVzKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdjeWxpbmRlcic6XG4gICAge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGN5bGluZGVyXyR7ZGVzY3JpcHRpb24ud2lkdGh9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fV8ke2Rlc2NyaXB0aW9uLmRlcHRofWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ud2lkdGggLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmhlaWdodCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uZGVwdGggLyAyKTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEN5bGluZGVyU2hhcGUoX3ZlYzNfMSk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnY2Fwc3VsZSc6XG4gICAge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGNhcHN1bGVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICAvLyBJbiBCdWxsZXQsIGNhcHN1bGUgaGVpZ2h0IGV4Y2x1ZGVzIHRoZSBlbmQgc3BoZXJlc1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q2Fwc3VsZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cywgZGVzY3JpcHRpb24uaGVpZ2h0IC0gMiAqIGRlc2NyaXB0aW9uLnJhZGl1cyk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnY29uZSc6XG4gICAge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGNvbmVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29uZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cywgZGVzY3JpcHRpb24uaGVpZ2h0KTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdjb25jYXZlJzpcbiAgICB7XG4gICAgICBjb25zdCB0cmlhbmdsZV9tZXNoID0gbmV3IEFtbW8uYnRUcmlhbmdsZU1lc2goKTtcbiAgICAgIGlmICghZGVzY3JpcHRpb24uZGF0YS5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoIC8gOTsgaSsrKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkYXRhW2kgKiA5XSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkYXRhW2kgKiA5ICsgMV0pO1xuICAgICAgICBfdmVjM18xLnNldFooZGF0YVtpICogOSArIDJdKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGF0YVtpICogOSArIDNdKTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRhdGFbaSAqIDkgKyA0XSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkYXRhW2kgKiA5ICsgNV0pO1xuXG4gICAgICAgIF92ZWMzXzMuc2V0WChkYXRhW2kgKiA5ICsgNl0pO1xuICAgICAgICBfdmVjM18zLnNldFkoZGF0YVtpICogOSArIDddKTtcbiAgICAgICAgX3ZlYzNfMy5zZXRaKGRhdGFbaSAqIDkgKyA4XSk7XG5cbiAgICAgICAgdHJpYW5nbGVfbWVzaC5hZGRUcmlhbmdsZShcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzIsXG4gICAgICAgICAgX3ZlYzNfMyxcbiAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0QnZoVHJpYW5nbGVNZXNoU2hhcGUoXG4gICAgICAgIHRyaWFuZ2xlX21lc2gsXG4gICAgICAgIHRydWUsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2NvbnZleCc6XG4gICAge1xuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbnZleEh1bGxTaGFwZSgpO1xuICAgICAgY29uc3QgZGF0YSA9IGRlc2NyaXB0aW9uLmRhdGE7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGggLyAzOyBpKyspIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRhdGFbaSAqIDNdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRhdGFbaSAqIDMgKyAxXSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkYXRhW2kgKiAzICsgMl0pO1xuXG4gICAgICAgIHNoYXBlLmFkZFBvaW50KF92ZWMzXzEpO1xuICAgICAgfVxuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdoZWlnaHRmaWVsZCc6XG4gICAge1xuICAgICAgY29uc3QgeHB0cyA9IGRlc2NyaXB0aW9uLnhwdHMsXG4gICAgICAgIHlwdHMgPSBkZXNjcmlwdGlvbi55cHRzLFxuICAgICAgICBwb2ludHMgPSBkZXNjcmlwdGlvbi5wb2ludHMsXG4gICAgICAgIHB0ciA9IEFtbW8uX21hbGxvYyg0ICogeHB0cyAqIHlwdHMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMCwgcCA9IDAsIHAyID0gMDsgaSA8IHhwdHM7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHlwdHM7IGorKykge1xuICAgICAgICAgIEFtbW8uSEVBUEYzMltwdHIgKyBwMiA+PiAyXSA9IHBvaW50c1twXTtcblxuICAgICAgICAgIHArKztcbiAgICAgICAgICBwMiArPSA0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRIZWlnaHRmaWVsZFRlcnJhaW5TaGFwZShcbiAgICAgICAgZGVzY3JpcHRpb24ueHB0cyxcbiAgICAgICAgZGVzY3JpcHRpb24ueXB0cyxcbiAgICAgICAgcHRyLFxuICAgICAgICAxLCAtZGVzY3JpcHRpb24uYWJzTWF4SGVpZ2h0LFxuICAgICAgICBkZXNjcmlwdGlvbi5hYnNNYXhIZWlnaHQsXG4gICAgICAgIDEsXG4gICAgICAgICdQSFlfRkxPQVQnLFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcblxuICAgICAgX25vbmNhY2hlZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIGRlZmF1bHQ6XG4gICAgLy8gTm90IHJlY29nbml6ZWRcbiAgICByZXR1cm47XG4gIH1cblxuICByZXR1cm4gc2hhcGU7XG59O1xuXG5jb25zdCBjcmVhdGVTb2Z0Qm9keSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBsZXQgYm9keTtcblxuICBjb25zdCBzb2Z0Qm9keUhlbHBlcnMgPSBuZXcgQW1tby5idFNvZnRCb2R5SGVscGVycygpO1xuXG4gIHN3aXRjaCAoZGVzY3JpcHRpb24udHlwZSkge1xuICBjYXNlICdzb2Z0VHJpbWVzaCc6XG4gICAge1xuICAgICAgaWYgKCFkZXNjcmlwdGlvbi5hVmVydGljZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIGJvZHkgPSBzb2Z0Qm9keUhlbHBlcnMuQ3JlYXRlRnJvbVRyaU1lc2goXG4gICAgICAgIHdvcmxkLmdldFdvcmxkSW5mbygpLFxuICAgICAgICBkZXNjcmlwdGlvbi5hVmVydGljZXMsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFJbmRpY2VzLFxuICAgICAgICBkZXNjcmlwdGlvbi5hSW5kaWNlcy5sZW5ndGggLyAzLFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdzb2Z0Q2xvdGhNZXNoJzpcbiAgICB7XG4gICAgICBjb25zdCBjciA9IGRlc2NyaXB0aW9uLmNvcm5lcnM7XG5cbiAgICAgIGJvZHkgPSBzb2Z0Qm9keUhlbHBlcnMuQ3JlYXRlUGF0Y2goXG4gICAgICAgIHdvcmxkLmdldFdvcmxkSW5mbygpLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbMF0sIGNyWzFdLCBjclsyXSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjclszXSwgY3JbNF0sIGNyWzVdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzZdLCBjcls3XSwgY3JbOF0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbOV0sIGNyWzEwXSwgY3JbMTFdKSxcbiAgICAgICAgZGVzY3JpcHRpb24uc2VnbWVudHNbMF0sXG4gICAgICAgIGRlc2NyaXB0aW9uLnNlZ21lbnRzWzFdLFxuICAgICAgICAwLFxuICAgICAgICB0cnVlXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ3NvZnRSb3BlTWVzaCc6XG4gICAge1xuICAgICAgY29uc3QgZGF0YSA9IGRlc2NyaXB0aW9uLmRhdGE7XG5cbiAgICAgIGJvZHkgPSBzb2Z0Qm9keUhlbHBlcnMuQ3JlYXRlUm9wZShcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhkYXRhWzBdLCBkYXRhWzFdLCBkYXRhWzJdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGRhdGFbM10sIGRhdGFbNF0sIGRhdGFbNV0pLFxuICAgICAgICBkYXRhWzZdIC0gMSxcbiAgICAgICAgMFxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBkZWZhdWx0OlxuICAgIC8vIE5vdCByZWNvZ25pemVkXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcmV0dXJuIGJvZHk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmluaXQgPSAocGFyYW1zID0ge30pID0+IHtcbiAgaWYgKHBhcmFtcy5ub1dvcmtlcikge1xuICAgIHdpbmRvdy5BbW1vID0gbmV3IHBhcmFtcy5hbW1vKCk7XG4gICAgcHVibGljX2Z1bmN0aW9ucy5tYWtlV29ybGQocGFyYW1zKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAocGFyYW1zLndhc21CdWZmZXIpIHtcbiAgICBpbXBvcnRTY3JpcHRzKHBhcmFtcy5hbW1vKTtcblxuICAgIHNlbGYuQW1tbyA9IG5ldyBsb2FkQW1tb0Zyb21CaW5hcnkocGFyYW1zLndhc21CdWZmZXIpKCk7XG4gICAgc2VuZCh7IGNtZDogJ2FtbW9Mb2FkZWQnIH0pO1xuICAgIHB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkKHBhcmFtcyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgaW1wb3J0U2NyaXB0cyhwYXJhbXMuYW1tbyk7XG4gICAgc2VuZCh7IGNtZDogJ2FtbW9Mb2FkZWQnIH0pO1xuXG4gICAgc2VsZi5BbW1vID0gbmV3IEFtbW8oKTtcbiAgICBwdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZChwYXJhbXMpO1xuICB9XG59XG5cbnB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIF90cmFuc2Zvcm0gPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICBfdHJhbnNmb3JtX3BvcyA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gIF92ZWMzXzEgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzIgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzMgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF9xdWF0ID0gbmV3IEFtbW8uYnRRdWF0ZXJuaW9uKDAsIDAsIDAsIDApO1xuXG4gIFJFUE9SVF9DSFVOS1NJWkUgPSBwYXJhbXMucmVwb3J0c2l6ZSB8fCA1MDtcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICAvLyBUcmFuc2ZlcmFibGUgbWVzc2FnZXMgYXJlIHN1cHBvcnRlZCwgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlbSB3aXRoIFR5cGVkQXJyYXlzXG4gICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogV09STERSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBvYmplY3RzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbGxpc2lvbnMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiB2ZWhpY2xlcyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbnN0cmFpbnRzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gVHJhbnNmZXJhYmxlIG1lc3NhZ2VzIGFyZSBub3Qgc3VwcG9ydGVkLCBzZW5kIGRhdGEgYXMgbm9ybWFsIGFycmF5c1xuICAgIHdvcmxkcmVwb3J0ID0gW107XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gW107XG4gICAgdmVoaWNsZXJlcG9ydCA9IFtdO1xuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBbXTtcbiAgfVxuXG4gIHdvcmxkcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDtcbiAgY29sbGlzaW9ucmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ7XG4gIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG5cbiAgY29uc3QgY29sbGlzaW9uQ29uZmlndXJhdGlvbiA9IHBhcmFtcy5zb2Z0Ym9keSA/XG4gICAgbmV3IEFtbW8uYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24oKSA6XG4gICAgbmV3IEFtbW8uYnREZWZhdWx0Q29sbGlzaW9uQ29uZmlndXJhdGlvbigpLFxuICAgIGRpc3BhdGNoZXIgPSBuZXcgQW1tby5idENvbGxpc2lvbkRpc3BhdGNoZXIoY29sbGlzaW9uQ29uZmlndXJhdGlvbiksXG4gICAgc29sdmVyID0gbmV3IEFtbW8uYnRTZXF1ZW50aWFsSW1wdWxzZUNvbnN0cmFpbnRTb2x2ZXIoKTtcblxuICBsZXQgYnJvYWRwaGFzZTtcblxuICBpZiAoIXBhcmFtcy5icm9hZHBoYXNlKSBwYXJhbXMuYnJvYWRwaGFzZSA9IHsgdHlwZTogJ2R5bmFtaWMnIH07XG4gIC8vIFRPRE8hISFcbiAgLyogaWYgKHBhcmFtcy5icm9hZHBoYXNlLnR5cGUgPT09ICdzd2VlcHBydW5lJykge1xuICAgIGV4dGVuZChwYXJhbXMuYnJvYWRwaGFzZSwge1xuICAgICAgYWFiYm1pbjoge1xuICAgICAgICB4OiAtNTAsXG4gICAgICAgIHk6IC01MCxcbiAgICAgICAgejogLTUwXG4gICAgICB9LFxuXG4gICAgICBhYWJibWF4OiB7XG4gICAgICAgIHg6IDUwLFxuICAgICAgICB5OiA1MCxcbiAgICAgICAgejogNTBcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0qL1xuXG4gIHN3aXRjaCAocGFyYW1zLmJyb2FkcGhhc2UudHlwZSkge1xuICBjYXNlICdzd2VlcHBydW5lJzpcbiAgICBfdmVjM18xLnNldFgocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi54KTtcbiAgICBfdmVjM18xLnNldFkocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi55KTtcbiAgICBfdmVjM18xLnNldFoocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi56KTtcblxuICAgIF92ZWMzXzIuc2V0WChwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LngpO1xuICAgIF92ZWMzXzIuc2V0WShwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LnkpO1xuICAgIF92ZWMzXzIuc2V0WihwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LnopO1xuXG4gICAgYnJvYWRwaGFzZSA9IG5ldyBBbW1vLmJ0QXhpc1N3ZWVwMyhcbiAgICAgIF92ZWMzXzEsXG4gICAgICBfdmVjM18yXG4gICAgKTtcblxuICAgIGJyZWFrO1xuICBjYXNlICdkeW5hbWljJzpcbiAgZGVmYXVsdDpcbiAgICBicm9hZHBoYXNlID0gbmV3IEFtbW8uYnREYnZ0QnJvYWRwaGFzZSgpO1xuICAgIGJyZWFrO1xuICB9XG5cbiAgd29ybGQgPSBwYXJhbXMuc29mdGJvZHkgP1xuICAgIG5ldyBBbW1vLmJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24sIG5ldyBBbW1vLmJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyKCkpIDpcbiAgICBuZXcgQW1tby5idERpc2NyZXRlRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pO1xuICBmaXhlZFRpbWVTdGVwID0gcGFyYW1zLmZpeGVkVGltZVN0ZXA7XG5cbiAgaWYgKHBhcmFtcy5zb2Z0Ym9keSkgX3NvZnRib2R5X2VuYWJsZWQgPSB0cnVlO1xuXG4gIHNlbmQoeyBjbWQ6ICd3b3JsZFJlYWR5JyB9KTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0Rml4ZWRUaW1lU3RlcCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBmaXhlZFRpbWVTdGVwID0gZGVzY3JpcHRpb247XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEdyYXZpdHkgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLngpO1xuICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ueSk7XG4gIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi56KTtcbiAgd29ybGQuc2V0R3Jhdml0eShfdmVjM18xKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwZW5kQW5jaG9yID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLm9ial1cbiAgICAuYXBwZW5kQW5jaG9yKFxuICAgICAgZGVzY3JpcHRpb24ubm9kZSxcbiAgICAgIF9vYmplY3RzW2Rlc2NyaXB0aW9uLm9iajJdLFxuICAgICAgZGVzY3JpcHRpb24uY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyxcbiAgICAgIGRlc2NyaXB0aW9uLmluZmx1ZW5jZVxuICAgICk7XG59XG5cbnB1YmxpY19mdW5jdGlvbnMubGlua05vZGVzID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIHZhciBzZWxmX2JvZHkgPSBfb2JqZWN0c1tkZXNjcmlwdGlvbi5zZWxmXTtcbiAgdmFyIG90aGVyX2JvZHkgPSBfb2JqZWN0c1tkZXNjcmlwdGlvbi5ib2R5XTtcblxuICB2YXIgc2VsZl9ub2RlID0gc2VsZl9ib2R5LmdldF9tX25vZGVzKCkuYXQoZGVzY3JpcHRpb24ubjEpO1xuICB2YXIgb3RoZXJfbm9kZSA9IG90aGVyX2JvZHkuZ2V0X21fbm9kZXMoKS5hdChkZXNjcmlwdGlvbi5uMik7XG5cbiAgdmFyIHNlbGZfdmVjID0gc2VsZl9ub2RlLmdldF9tX3goKTtcbiAgdmFyIG90aGVyX3ZlYyA9IG90aGVyX25vZGUuZ2V0X21feCgpO1xuXG4gIHZhciBmb3JjZV94ID0gb3RoZXJfdmVjLngoKSAtIHNlbGZfdmVjLngoKTtcbiAgdmFyIGZvcmNlX3kgPSBvdGhlcl92ZWMueSgpIC0gc2VsZl92ZWMueSgpO1xuICB2YXIgZm9yY2VfeiA9IG90aGVyX3ZlYy56KCkgLSBzZWxmX3ZlYy56KCk7XG5cblxuICAvLyB2YXIgbW9kaWZpZXIgPSAzMDtcblxuICBsZXQgY2FjaGVkX2Rpc3RhbmNlLCBsaW5rZWQgPSBmYWxzZTtcblxuICBjb25zdCBfbG9vcCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICBmb3JjZV94ID0gb3RoZXJfdmVjLngoKSAtIHNlbGZfdmVjLngoKTtcbiAgICBmb3JjZV95ID0gb3RoZXJfdmVjLnkoKSAtIHNlbGZfdmVjLnkoKTtcbiAgICBmb3JjZV96ID0gb3RoZXJfdmVjLnooKSAtIHNlbGZfdmVjLnooKTtcblxuICAgIGxldCBkaXN0YW5jZSA9IE1hdGguc3FydChmb3JjZV94ICogZm9yY2VfeCArIGZvcmNlX3kgKiBmb3JjZV95ICsgZm9yY2VfeiAqIGZvcmNlX3opO1xuXG4gICAgaWYgKGNhY2hlZF9kaXN0YW5jZSAmJiAhbGlua2VkICYmIGNhY2hlZF9kaXN0YW5jZSA8IGRpc3RhbmNlKSB7IC8vIGNhY2hlZF9kaXN0YW5jZSAmJiAhbGlua2VkICYmIGNhY2hlZF9kaXN0YW5jZSA8IGRpc3RhbmNlXG5cbiAgICAgIGxpbmtlZCA9IHRydWU7XG5cbiAgICAgIC8vIGxldCBzZWxmX3ZlbCA9IHNlbGZfbm9kZS5nZXRfbV92KCk7XG4gICAgICAvL1xuICAgICAgLy8gX3ZlYzNfMS5zZXRYKC1zZWxmX3ZlbC54KCkpO1xuICAgICAgLy8gX3ZlYzNfMS5zZXRZKC1zZWxmX3ZlbC55KCkpO1xuICAgICAgLy8gX3ZlYzNfMS5zZXRaKC1zZWxmX3ZlbC56KCkpO1xuICAgICAgLy9cbiAgICAgIC8vIGxldCBvdGhlcl92ZWwgPSBvdGhlcl9ub2RlLmdldF9tX3YoKTtcbiAgICAgIC8vXG4gICAgICAvLyBfdmVjM18yLnNldFgoLW90aGVyX3ZlbC54KCkpO1xuICAgICAgLy8gX3ZlYzNfMi5zZXRZKC1vdGhlcl92ZWwueSgpKTtcbiAgICAgIC8vIF92ZWMzXzIuc2V0Wigtb3RoZXJfdmVsLnooKSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCdsaW5rIScpO1xuXG4gICAgICBfdmVjM18xLnNldFgoMCk7XG4gICAgICBfdmVjM18xLnNldFkoMCk7XG4gICAgICBfdmVjM18xLnNldFooMCk7XG5cbiAgICAgIHNlbGZfYm9keS5zZXRWZWxvY2l0eShcbiAgICAgICAgX3ZlYzNfMVxuICAgICAgKTtcblxuICAgICAgb3RoZXJfYm9keS5zZXRWZWxvY2l0eShcbiAgICAgICAgX3ZlYzNfMVxuICAgICAgKTtcblxuXG5cbiAgICAgIC8vIHNlbGZfYm9keS5hZGRWZWxvY2l0eShfdmVjM18xKTtcbiAgICAgIC8vIG90aGVyX2JvZHkuYWRkVmVsb2NpdHkoX3ZlYzNfMik7XG5cbiAgICAgIC8vIHNlbGZfcmVsYXRpdmVfeCA9IHNlbGZfbm9kZS54KCk7XG4gICAgICAvLyBzZWxmX3JlbGF0aXZlX3kgPSBzZWxmX25vZGUueSgpO1xuICAgICAgLy8gc2VsZl9yZWxhdGl2ZV96ID0gc2VsZl9ub2RlLnooKTtcbiAgICAgIC8vXG4gICAgICAvLyBvdGhlcl9yZWxhdGl2ZV94ID0gb3RoZXJfbm9kZS54KCk7XG4gICAgICAvLyBvdGhlcl9yZWxhdGl2ZV95ID0gb3RoZXJfbm9kZS55KCk7XG4gICAgICAvLyBvdGhlcl9yZWxhdGl2ZV96ID0gb3RoZXJfbm9kZS56KCk7XG5cbiAgICAgIC8vIHNlbGZfcmVsYXRpdmUgPSBuZXcgQW1tby5idFZlY3RvcjMoKTtcbiAgICAgIC8vIHNlbGZfcmVsYXRpdmUuc2V0WCgpO1xuXG4gICAgICAvLyBjb25zb2xlLmxvZygnbGluayEnKTtcbiAgICAgIC8vIHNlbGZfYm9keS5hcHBlbmRBbmNob3IoZGVzY3JpcHRpb24ubjEsIGNvbm5lY3RvciwgdHJ1ZSwgMC41KTtcbiAgICAgIC8vIG90aGVyX2JvZHkuYXBwZW5kQW5jaG9yKGRlc2NyaXB0aW9uLm4yLCBjb25uZWN0b3IsIHRydWUsIDAuNSk7XG4gICAgICAvLyBjbGVhckludGVydmFsKF9sb29wKTtcblxuICAgICAgLy8gX3ZlYzNfMS5zZXRYKDApO1xuICAgICAgLy8gX3ZlYzNfMS5zZXRZKDApO1xuICAgICAgLy8gX3ZlYzNfMS5zZXRaKDApO1xuXG4gICAgICAvLyBzZWxmX2JvZHkuc2V0VmVsb2NpdHkoX3ZlYzNfMSk7XG4gICAgICAvLyBvdGhlcl9ib2R5LnNldFZlbG9jaXR5KF92ZWMzXzEpO1xuXG4gICAgICAvLyBvdGhlcl9ib2R5LmFkZEZvcmNlKFxuICAgICAgLy8gICBfdmVjM18yLFxuICAgICAgLy8gICBkZXNjcmlwdGlvbi5uMlxuICAgICAgLy8gKTtcblxuICAgICAgLy8gZGVzY3JpcHRpb24ubW9kaWZpZXIgKj0gMS42O1xuICAgIH1cblxuICAgIGNvbnN0IG1vZGlmZXIyID0gbGlua2VkID8gNDAgOiAxO1xuXG4gICAgZm9yY2VfeCAqPSBNYXRoLm1heChkaXN0YW5jZSwgMSkgKiBkZXNjcmlwdGlvbi5tb2RpZmllciAqIG1vZGlmZXIyO1xuICAgIGZvcmNlX3kgKj0gTWF0aC5tYXgoZGlzdGFuY2UsIDEpICogZGVzY3JpcHRpb24ubW9kaWZpZXIgKiBtb2RpZmVyMjtcbiAgICBmb3JjZV96ICo9IE1hdGgubWF4KGRpc3RhbmNlLCAxKSAqIGRlc2NyaXB0aW9uLm1vZGlmaWVyICogbW9kaWZlcjI7XG5cbiAgICBfdmVjM18xLnNldFgoZm9yY2VfeCk7XG4gICAgX3ZlYzNfMS5zZXRZKGZvcmNlX3kpO1xuICAgIF92ZWMzXzEuc2V0Wihmb3JjZV96KTtcblxuICAgIF92ZWMzXzIuc2V0WCgtZm9yY2VfeCk7XG4gICAgX3ZlYzNfMi5zZXRZKC1mb3JjZV95KTtcbiAgICBfdmVjM18yLnNldFooLWZvcmNlX3opO1xuXG4gICAgc2VsZl9ib2R5LmFkZFZlbG9jaXR5KFxuICAgICAgX3ZlYzNfMSxcbiAgICAgIGRlc2NyaXB0aW9uLm4xXG4gICAgKTtcblxuICAgIG90aGVyX2JvZHkuYWRkVmVsb2NpdHkoXG4gICAgICBfdmVjM18yLFxuICAgICAgZGVzY3JpcHRpb24ubjJcbiAgICApO1xuXG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIC8vIHNlbGZfcmVsYXRpdmVfeCA9IG51bGw7XG4gICAgLy8gfVxuXG5cblxuICAgIC8vIGlmIChzZWxmX3JlbGF0aXZlX3gpIHtcbiAgICAvLyAgIF92ZWMzXzEuc2V0WChzZWxmX3JlbGF0aXZlX3ggLSBzZWxmX25vZGUueCgpKTtcbiAgICAvLyAgIF92ZWMzXzEuc2V0WShzZWxmX3JlbGF0aXZlX3kgLSBzZWxmX25vZGUueSgpKTtcbiAgICAvLyAgIF92ZWMzXzEuc2V0WihzZWxmX3JlbGF0aXZlX3ogLSBzZWxmX25vZGUueigpKTtcbiAgICAvL1xuICAgIC8vICAgX3ZlYzNfMi5zZXRYKG90aGVyX3JlbGF0aXZlX3ggLSBvdGhlcl9ub2RlLngoKSk7XG4gICAgLy8gICBfdmVjM18yLnNldFkob3RoZXJfcmVsYXRpdmVfeSAtIG90aGVyX25vZGUueSgpKTtcbiAgICAvLyAgIF92ZWMzXzIuc2V0WihvdGhlcl9yZWxhdGl2ZV96IC0gb3RoZXJfbm9kZS56KCkpO1xuICAgIC8vIH0gZWxzZSB7XG5cbiAgICAvLyB9XG5cblxuXG5cbiAgICBjYWNoZWRfZGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgfSwgMTApO1xufVxuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGVuZExpbmsgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgLy8gY29uc29sZS5sb2coQW1tbyk7XG4gIC8vIGNvbnNvbGUubG9nKG5ldyBBbW1vLk1hdGVyaWFsKCkpO1xuXG4gIC8vIHZhciBfbWF0ID0gbmV3IEFtbW8uTWF0ZXJpYWwoKTtcbiAgLy9cbiAgLy8gX21hdC5zZXRfbV9rQVNUKDApO1xuICAvLyBfbWF0LnNldF9tX2tMU1QoMCk7XG4gIC8vIF9tYXQuc2V0X21fa1ZTVCgwKTtcbiAgLy9cbiAgLy8gX29iamVjdHNbZGVzY3JpcHRpb24uc2VsZl0uYXBwZW5kTGluayhcbiAgLy8gICBkZXNjcmlwdGlvbi5uMSxcbiAgLy8gICBkZXNjcmlwdGlvbi5uMixcbiAgLy8gICBfbWF0LFxuICAvLyAgIGZhbHNlXG4gIC8vICk7XG5cbiAgX3ZlYzNfMS5zZXRYKDEwMDApO1xuICBfdmVjM18xLnNldFkoMCk7XG4gIF92ZWMzXzEuc2V0WigwKTtcblxuICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5zZWxmXS5hZGRGb3JjZShcbiAgICBfdmVjM18xLFxuICAgIGRlc2NyaXB0aW9uLm4xXG4gICk7XG59XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwZW5kTGluZWFySm9pbnQgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgLy8gY29uc29sZS5sb2coJ0FtbW8nLCBBbW1vKTtcbiAgdmFyIHNwZWNzID0gbmV3IEFtbW8uU3BlY3MoKTtcbiAgdmFyIF9wb3MgPSBkZXNjcmlwdGlvbi5zcGVjcy5wb3NpdGlvbjtcblxuICBzcGVjcy5zZXRfcG9zaXRpb24obmV3IEFtbW8uYnRWZWN0b3IzKF9wb3NbMF0sIF9wb3NbMV0sIF9wb3NbMl0pKTtcbiAgaWYgKGRlc2NyaXB0aW9uLnNwZWNzLmVycCkgc3BlY3Muc2V0X2VycChkZXNjcmlwdGlvbi5zcGVjcy5lcnApO1xuICBpZiAoZGVzY3JpcHRpb24uc3BlY3MuY2ZtKSBzcGVjcy5zZXRfY2ZtKGRlc2NyaXB0aW9uLnNwZWNzLmNmbSk7XG4gIGlmIChkZXNjcmlwdGlvbi5zcGVjcy5zcGxpdCkgc3BlY3Muc2V0X3NwbGl0KGRlc2NyaXB0aW9uLnNwZWNzLnNwbGl0KTtcblxuICAvLyBjb25zb2xlLmxvZyhzcGVjcyk7XG4gIC8vXG4gIC8vIC8vIGxqb2ludC5zZXRfbV9ycG9zKFxuICAvLyAvLyAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhfcG9zMVswXSwgX3BvczFbMV0sIF9wb3MxWzJdKSxcbiAgLy8gLy8gICBuZXcgQW1tby5idFZlY3RvcjMoX3BvczJbMF0sIF9wb3MyWzFdLCBfcG9zMlsyXSlcbiAgLy8gLy8gKTtcbiAgLy9cbiAgLy8gLy8gY29uc29sZS5sb2coJ2xqb2ludCcsIGxqb2ludCk7XG4gIC8vXG5cbiAgLy8gY29uc29sZS5sb2coJ2JvZHknLCBfb2JqZWN0c1tkZXNjcmlwdGlvbi5ib2R5XSk7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnNlbGZdXG4gICAgLmFwcGVuZExpbmVhckpvaW50KFxuICAgICAgc3BlY3MsXG4gICAgICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5ib2R5XVxuICAgICk7XG59XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkT2JqZWN0ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBib2R5LCBtb3Rpb25TdGF0ZTtcblxuICBpZiAoZGVzY3JpcHRpb24udHlwZS5pbmRleE9mKCdzb2Z0JykgIT09IC0xKSB7XG4gICAgYm9keSA9IGNyZWF0ZVNvZnRCb2R5KGRlc2NyaXB0aW9uKTtcblxuICAgIGNvbnN0IHNiQ29uZmlnID0gYm9keS5nZXRfbV9jZmcoKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbi52aXRlcmF0aW9ucykgc2JDb25maWcuc2V0X3ZpdGVyYXRpb25zKGRlc2NyaXB0aW9uLnZpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucGl0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9waXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5waXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmRpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfZGl0ZXJhdGlvbnMoZGVzY3JpcHRpb24uZGl0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5jaXRlcmF0aW9ucykgc2JDb25maWcuc2V0X2NpdGVyYXRpb25zKGRlc2NyaXB0aW9uLmNpdGVyYXRpb25zKTtcbiAgICBzYkNvbmZpZy5zZXRfY29sbGlzaW9ucygweDExKTtcbiAgICBzYkNvbmZpZy5zZXRfa0RGKGRlc2NyaXB0aW9uLmZyaWN0aW9uKTtcbiAgICBzYkNvbmZpZy5zZXRfa0RQKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5wcmVzc3VyZSkgc2JDb25maWcuc2V0X2tQUihkZXNjcmlwdGlvbi5wcmVzc3VyZSk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmRyYWcpIHNiQ29uZmlnLnNldF9rREcoZGVzY3JpcHRpb24uZHJhZyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmxpZnQpIHNiQ29uZmlnLnNldF9rTEYoZGVzY3JpcHRpb24ubGlmdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmFuY2hvckhhcmRuZXNzKSBzYkNvbmZpZy5zZXRfa0FIUihkZXNjcmlwdGlvbi5hbmNob3JIYXJkbmVzcyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnJpZ2lkSGFyZG5lc3MpIHNiQ29uZmlnLnNldF9rQ0hSKGRlc2NyaXB0aW9uLnJpZ2lkSGFyZG5lc3MpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLmtsc3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa0xTVChkZXNjcmlwdGlvbi5rbHN0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24ua2FzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rQVNUKGRlc2NyaXB0aW9uLmthc3QpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5rdnN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tWU1QoZGVzY3JpcHRpb24ua3ZzdCk7XG5cbiAgICBBbW1vLmNhc3RPYmplY3QoYm9keSwgQW1tby5idENvbGxpc2lvbk9iamVjdCkuZ2V0Q29sbGlzaW9uU2hhcGUoKS5zZXRNYXJnaW4oXG4gICAgICB0eXBlb2YgZGVzY3JpcHRpb24ubWFyZ2luICE9PSAndW5kZWZpbmVkJyA/IGRlc2NyaXB0aW9uLm1hcmdpbiA6IDAuMVxuICAgICk7XG5cbiAgICAvLyBBbW1vLmNhc3RPYmplY3QoYm9keSwgQW1tby5idENvbGxpc2lvbk9iamVjdCkuZ2V0Q29sbGlzaW9uU2hhcGUoKS5zZXRNYXJnaW4oMCk7XG5cbiAgICAvLyBBbW1vLmNhc3RPYmplY3QoYm9keSwgQW1tby5idENvbGxpc2lvbk9iamVjdCkuZ2V0Q29sbGlzaW9uU2hhcGUoKS5zZXRMb2NhbFNjYWxpbmcoX3ZlYzNfMSk7XG4gICAgYm9keS5zZXRBY3RpdmF0aW9uU3RhdGUoZGVzY3JpcHRpb24uc3RhdGUgfHwgNCk7XG4gICAgYm9keS50eXBlID0gMDsgLy8gU29mdEJvZHkuXG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Um9wZU1lc2gnKSBib2R5LnJvcGUgPSB0cnVlO1xuICAgIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdENsb3RoTWVzaCcpIGJvZHkuY2xvdGggPSB0cnVlO1xuXG4gICAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuXG4gICAgLy8gQHRlc3RcbiAgICBfcXVhdC5zZXRYKGRlc2NyaXB0aW9uLnJvdGF0aW9uLngpO1xuICAgIF9xdWF0LnNldFkoZGVzY3JpcHRpb24ucm90YXRpb24ueSk7XG4gICAgX3F1YXQuc2V0WihkZXNjcmlwdGlvbi5yb3RhdGlvbi56KTtcbiAgICBfcXVhdC5zZXRXKGRlc2NyaXB0aW9uLnJvdGF0aW9uLncpO1xuICAgIGJvZHkucm90YXRlKF9xdWF0KTtcblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5wb3NpdGlvbi54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ucG9zaXRpb24ueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnopO1xuICAgIGJvZHkudHJhbnNsYXRlKF92ZWMzXzEpO1xuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnNjYWxlLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5zY2FsZS55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uc2NhbGUueik7XG4gICAgYm9keS5zY2FsZShfdmVjM18xKTtcblxuICAgIGJvZHkuc2V0VG90YWxNYXNzKGRlc2NyaXB0aW9uLm1hc3MsIGZhbHNlKTtcbiAgICB3b3JsZC5hZGRTb2Z0Qm9keShib2R5LCAxLCAtMSk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0VHJpbWVzaCcpIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX2ZhY2VzKCkuc2l6ZSgpICogMztcbiAgICBlbHNlIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFJvcGVNZXNoJykgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fbm9kZXMoKS5zaXplKCk7XG4gICAgZWxzZSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9ub2RlcygpLnNpemUoKSAqIDM7XG5cbiAgICBfbnVtX3NvZnRib2R5X29iamVjdHMrKztcbiAgfVxuICBlbHNlIHtcbiAgICBsZXQgc2hhcGUgPSBjcmVhdGVTaGFwZShkZXNjcmlwdGlvbik7XG5cbiAgICBpZiAoIXNoYXBlKSByZXR1cm47XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgY2hpbGRyZW4gdGhlbiB0aGlzIGlzIGEgY29tcG91bmQgc2hhcGVcbiAgICBpZiAoZGVzY3JpcHRpb24uY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGNvbXBvdW5kX3NoYXBlID0gbmV3IEFtbW8uYnRDb21wb3VuZFNoYXBlKCk7XG4gICAgICBjb21wb3VuZF9zaGFwZS5hZGRDaGlsZFNoYXBlKF90cmFuc2Zvcm0sIHNoYXBlKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBfY2hpbGQgPSBkZXNjcmlwdGlvbi5jaGlsZHJlbltpXTtcblxuICAgICAgICBjb25zdCB0cmFucyA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICAgIHRyYW5zLnNldElkZW50aXR5KCk7XG5cbiAgICAgICAgX3ZlYzNfMS5zZXRYKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShfY2hpbGQucG9zaXRpb25fb2Zmc2V0LnkpO1xuICAgICAgICBfdmVjM18xLnNldFooX2NoaWxkLnBvc2l0aW9uX29mZnNldC56KTtcbiAgICAgICAgdHJhbnMuc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgICAgIF9xdWF0LnNldFgoX2NoaWxkLnJvdGF0aW9uLngpO1xuICAgICAgICBfcXVhdC5zZXRZKF9jaGlsZC5yb3RhdGlvbi55KTtcbiAgICAgICAgX3F1YXQuc2V0WihfY2hpbGQucm90YXRpb24ueik7XG4gICAgICAgIF9xdWF0LnNldFcoX2NoaWxkLnJvdGF0aW9uLncpO1xuICAgICAgICB0cmFucy5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICAgICAgc2hhcGUgPSBjcmVhdGVTaGFwZShkZXNjcmlwdGlvbi5jaGlsZHJlbltpXSk7XG4gICAgICAgIGNvbXBvdW5kX3NoYXBlLmFkZENoaWxkU2hhcGUodHJhbnMsIHNoYXBlKTtcbiAgICAgICAgQW1tby5kZXN0cm95KHRyYW5zKTtcbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBjb21wb3VuZF9zaGFwZTtcbiAgICAgIF9jb21wb3VuZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG4gICAgfVxuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnNjYWxlLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5zY2FsZS55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uc2NhbGUueik7XG5cbiAgICBzaGFwZS5zZXRMb2NhbFNjYWxpbmcoX3ZlYzNfMSk7XG4gICAgc2hhcGUuc2V0TWFyZ2luKFxuICAgICAgdHlwZW9mIGRlc2NyaXB0aW9uLm1hcmdpbiAhPT0gJ3VuZGVmaW5lZCcgPyBkZXNjcmlwdGlvbi5tYXJnaW4gOiAwXG4gICAgKTtcblxuICAgIF92ZWMzXzEuc2V0WCgwKTtcbiAgICBfdmVjM18xLnNldFkoMCk7XG4gICAgX3ZlYzNfMS5zZXRaKDApO1xuICAgIHNoYXBlLmNhbGN1bGF0ZUxvY2FsSW5lcnRpYShkZXNjcmlwdGlvbi5tYXNzLCBfdmVjM18xKTtcblxuICAgIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcblxuICAgIF92ZWMzXzIuc2V0WChkZXNjcmlwdGlvbi5wb3NpdGlvbi54KTtcbiAgICBfdmVjM18yLnNldFkoZGVzY3JpcHRpb24ucG9zaXRpb24ueSk7XG4gICAgX3ZlYzNfMi5zZXRaKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnopO1xuICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgX3F1YXQuc2V0WChkZXNjcmlwdGlvbi5yb3RhdGlvbi54KTtcbiAgICBfcXVhdC5zZXRZKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnkpO1xuICAgIF9xdWF0LnNldFooZGVzY3JpcHRpb24ucm90YXRpb24ueik7XG4gICAgX3F1YXQuc2V0VyhkZXNjcmlwdGlvbi5yb3RhdGlvbi53KTtcbiAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgIG1vdGlvblN0YXRlID0gbmV3IEFtbW8uYnREZWZhdWx0TW90aW9uU3RhdGUoX3RyYW5zZm9ybSk7IC8vICNUT0RPOiBidERlZmF1bHRNb3Rpb25TdGF0ZSBzdXBwb3J0cyBjZW50ZXIgb2YgbWFzcyBvZmZzZXQgYXMgc2Vjb25kIGFyZ3VtZW50IC0gaW1wbGVtZW50XG4gICAgY29uc3QgcmJJbmZvID0gbmV3IEFtbW8uYnRSaWdpZEJvZHlDb25zdHJ1Y3Rpb25JbmZvKGRlc2NyaXB0aW9uLm1hc3MsIG1vdGlvblN0YXRlLCBzaGFwZSwgX3ZlYzNfMSk7XG5cbiAgICByYkluZm8uc2V0X21fZnJpY3Rpb24oZGVzY3JpcHRpb24uZnJpY3Rpb24pO1xuICAgIHJiSW5mby5zZXRfbV9yZXN0aXR1dGlvbihkZXNjcmlwdGlvbi5yZXN0aXR1dGlvbik7XG4gICAgcmJJbmZvLnNldF9tX2xpbmVhckRhbXBpbmcoZGVzY3JpcHRpb24uZGFtcGluZyk7XG4gICAgcmJJbmZvLnNldF9tX2FuZ3VsYXJEYW1waW5nKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuXG4gICAgYm9keSA9IG5ldyBBbW1vLmJ0UmlnaWRCb2R5KHJiSW5mbyk7XG4gICAgYm9keS5zZXRBY3RpdmF0aW9uU3RhdGUoZGVzY3JpcHRpb24uc3RhdGUgfHwgNCk7XG4gICAgQW1tby5kZXN0cm95KHJiSW5mbyk7XG5cbiAgICBpZiAodHlwZW9mIGRlc2NyaXB0aW9uLmNvbGxpc2lvbl9mbGFncyAhPT0gJ3VuZGVmaW5lZCcpIGJvZHkuc2V0Q29sbGlzaW9uRmxhZ3MoZGVzY3JpcHRpb24uY29sbGlzaW9uX2ZsYWdzKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbi5ncm91cCAmJiBkZXNjcmlwdGlvbi5tYXNrKSB3b3JsZC5hZGRSaWdpZEJvZHkoYm9keSwgZGVzY3JpcHRpb24uZ3JvdXAsIGRlc2NyaXB0aW9uLm1hc2spO1xuICAgIGVsc2Ugd29ybGQuYWRkUmlnaWRCb2R5KGJvZHkpO1xuICAgIGJvZHkudHlwZSA9IDE7IC8vIFJpZ2lkQm9keS5cbiAgICBfbnVtX3JpZ2lkYm9keV9vYmplY3RzKys7XG4gIH1cblxuICBib2R5LmFjdGl2YXRlKCk7XG5cbiAgYm9keS5pZCA9IGRlc2NyaXB0aW9uLmlkO1xuICBfb2JqZWN0c1tib2R5LmlkXSA9IGJvZHk7XG4gIF9tb3Rpb25fc3RhdGVzW2JvZHkuaWRdID0gbW90aW9uU3RhdGU7XG5cbiAgX29iamVjdHNfYW1tb1tib2R5LmEgPT09IHVuZGVmaW5lZCA/IGJvZHkucHRyIDogYm9keS5hXSA9IGJvZHkuaWQ7XG4gIF9udW1fb2JqZWN0cysrO1xuXG4gIHNlbmQoeyBjbWQ6ICdvYmplY3RSZWFkeScsIHBhcmFtczogYm9keS5pZCB9KTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkVmVoaWNsZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBjb25zdCB2ZWhpY2xlX3R1bmluZyA9IG5ldyBBbW1vLmJ0VmVoaWNsZVR1bmluZygpO1xuXG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25TdGlmZm5lc3MoZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9zdGlmZm5lc3MpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9zdXNwZW5zaW9uQ29tcHJlc3Npb24oZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9jb21wcmVzc2lvbik7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25EYW1waW5nKGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fZGFtcGluZyk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25UcmF2ZWxDbShkZXNjcmlwdGlvbi5tYXhfc3VzcGVuc2lvbl90cmF2ZWwpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UoZGVzY3JpcHRpb24ubWF4X3N1c3BlbnNpb25fZm9yY2UpO1xuXG4gIGNvbnN0IHZlaGljbGUgPSBuZXcgQW1tby5idFJheWNhc3RWZWhpY2xlKFxuICAgIHZlaGljbGVfdHVuaW5nLFxuICAgIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnJpZ2lkQm9keV0sXG4gICAgbmV3IEFtbW8uYnREZWZhdWx0VmVoaWNsZVJheWNhc3Rlcih3b3JsZClcbiAgKTtcblxuICB2ZWhpY2xlLnR1bmluZyA9IHZlaGljbGVfdHVuaW5nO1xuICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5yaWdpZEJvZHldLnNldEFjdGl2YXRpb25TdGF0ZSg0KTtcbiAgdmVoaWNsZS5zZXRDb29yZGluYXRlU3lzdGVtKDAsIDEsIDIpO1xuXG4gIHdvcmxkLmFkZFZlaGljbGUodmVoaWNsZSk7XG4gIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gPSB2ZWhpY2xlO1xufTtcbnB1YmxpY19mdW5jdGlvbnMucmVtb3ZlVmVoaWNsZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdID0gbnVsbDtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkV2hlZWwgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gIT09IHVuZGVmaW5lZCkge1xuICAgIGxldCB0dW5pbmcgPSBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdLnR1bmluZztcbiAgICBpZiAoZGVzY3JpcHRpb24udHVuaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHR1bmluZyA9IG5ldyBBbW1vLmJ0VmVoaWNsZVR1bmluZygpO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25TdGlmZm5lc3MoZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fc3RpZmZuZXNzKTtcbiAgICAgIHR1bmluZy5zZXRfbV9zdXNwZW5zaW9uQ29tcHJlc3Npb24oZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fY29tcHJlc3Npb24pO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25EYW1waW5nKGRlc2NyaXB0aW9uLnR1bmluZy5zdXNwZW5zaW9uX2RhbXBpbmcpO1xuICAgICAgdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25UcmF2ZWxDbShkZXNjcmlwdGlvbi50dW5pbmcubWF4X3N1c3BlbnNpb25fdHJhdmVsKTtcbiAgICAgIHR1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UoZGVzY3JpcHRpb24udHVuaW5nLm1heF9zdXNwZW5zaW9uX2ZvcmNlKTtcbiAgICB9XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC56KTtcblxuICAgIF92ZWMzXzIuc2V0WChkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueCk7XG4gICAgX3ZlYzNfMi5zZXRZKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi55KTtcbiAgICBfdmVjM18yLnNldFooZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLnopO1xuXG4gICAgX3ZlYzNfMy5zZXRYKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueCk7XG4gICAgX3ZlYzNfMy5zZXRZKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueSk7XG4gICAgX3ZlYzNfMy5zZXRaKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueik7XG5cbiAgICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdLmFkZFdoZWVsKFxuICAgICAgX3ZlYzNfMSxcbiAgICAgIF92ZWMzXzIsXG4gICAgICBfdmVjM18zLFxuICAgICAgZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCxcbiAgICAgIGRlc2NyaXB0aW9uLndoZWVsX3JhZGl1cyxcbiAgICAgIHR1bmluZyxcbiAgICAgIGRlc2NyaXB0aW9uLmlzX2Zyb250X3doZWVsXG4gICAgKTtcbiAgfVxuXG4gIF9udW1fd2hlZWxzKys7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMSArIF9udW1fd2hlZWxzICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgJiAoICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0IClcbiAgICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICB9XG4gIGVsc2UgdmVoaWNsZXJlcG9ydCA9IFtNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlRdO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRTdGVlcmluZyA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLnNldFN0ZWVyaW5nVmFsdWUoZGV0YWlscy5zdGVlcmluZywgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEJyYWtlID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uc2V0QnJha2UoZGV0YWlscy5icmFrZSwgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5RW5naW5lRm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5hcHBseUVuZ2luZUZvcmNlKGRldGFpbHMuZm9yY2UsIGRldGFpbHMud2hlZWwpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVPYmplY3QgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX29iamVjdHNbZGV0YWlscy5pZF0udHlwZSA9PT0gMCkge1xuICAgIF9udW1fc29mdGJvZHlfb2JqZWN0cy0tO1xuICAgIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSAtPSBfb2JqZWN0c1tkZXRhaWxzLmlkXS5nZXRfbV9ub2RlcygpLnNpemUoKTtcbiAgICB3b3JsZC5yZW1vdmVTb2Z0Qm9keShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gIH1cbiAgZWxzZSBpZiAoX29iamVjdHNbZGV0YWlscy5pZF0udHlwZSA9PT0gMSkge1xuICAgIF9udW1fcmlnaWRib2R5X29iamVjdHMtLTtcbiAgICB3b3JsZC5yZW1vdmVSaWdpZEJvZHkoX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICAgIEFtbW8uZGVzdHJveShfbW90aW9uX3N0YXRlc1tkZXRhaWxzLmlkXSk7XG4gIH1cblxuICBBbW1vLmRlc3Ryb3koX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICBpZiAoX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSkgQW1tby5kZXN0cm95KF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pO1xuICBpZiAoX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pIEFtbW8uZGVzdHJveShfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSk7XG5cbiAgX29iamVjdHNfYW1tb1tfb2JqZWN0c1tkZXRhaWxzLmlkXS5hID09PSB1bmRlZmluZWQgPyBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hIDogX29iamVjdHNbZGV0YWlscy5pZF0ucHRyXSA9IG51bGw7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgX21vdGlvbl9zdGF0ZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuXG4gIGlmIChfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKSBfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgaWYgKF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKSBfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gIF9udW1fb2JqZWN0cy0tO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy51cGRhdGVUcmFuc2Zvcm0gPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0ID0gX29iamVjdHNbZGV0YWlscy5pZF07XG5cbiAgaWYgKF9vYmplY3QudHlwZSA9PT0gMSkge1xuICAgIF9vYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgIGlmIChkZXRhaWxzLnBvcykge1xuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zLnopO1xuICAgICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgfVxuXG4gICAgaWYgKGRldGFpbHMucXVhdCkge1xuICAgICAgX3F1YXQuc2V0WChkZXRhaWxzLnF1YXQueCk7XG4gICAgICBfcXVhdC5zZXRZKGRldGFpbHMucXVhdC55KTtcbiAgICAgIF9xdWF0LnNldFooZGV0YWlscy5xdWF0LnopO1xuICAgICAgX3F1YXQuc2V0VyhkZXRhaWxzLnF1YXQudyk7XG4gICAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcbiAgICB9XG5cbiAgICBfb2JqZWN0LnNldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuICAgIF9vYmplY3QuYWN0aXZhdGUoKTtcbiAgfVxuICBlbHNlIGlmIChfb2JqZWN0LnR5cGUgPT09IDApIHtcbiAgICAvLyBfb2JqZWN0LmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgaWYgKGRldGFpbHMucG9zKSB7XG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3MueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3MueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3Mueik7XG4gICAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICB9XG5cbiAgICBpZiAoZGV0YWlscy5xdWF0KSB7XG4gICAgICBfcXVhdC5zZXRYKGRldGFpbHMucXVhdC54KTtcbiAgICAgIF9xdWF0LnNldFkoZGV0YWlscy5xdWF0LnkpO1xuICAgICAgX3F1YXQuc2V0WihkZXRhaWxzLnF1YXQueik7XG4gICAgICBfcXVhdC5zZXRXKGRldGFpbHMucXVhdC53KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuICAgIH1cblxuICAgIF9vYmplY3QudHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuICB9XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnVwZGF0ZU1hc3MgPSAoZGV0YWlscykgPT4ge1xuICAvLyAjVE9ETzogY2hhbmdpbmcgYSBzdGF0aWMgb2JqZWN0IGludG8gZHluYW1pYyBpcyBidWdneVxuICBfb2JqZWN0ID0gX29iamVjdHNbZGV0YWlscy5pZF07XG5cbiAgLy8gUGVyIGh0dHA6Ly93d3cuYnVsbGV0cGh5c2ljcy5vcmcvQnVsbGV0L3BocEJCMy92aWV3dG9waWMucGhwP3A9JmY9OSZ0PTM2NjMjcDEzODE2XG4gIHdvcmxkLnJlbW92ZVJpZ2lkQm9keShfb2JqZWN0KTtcblxuICBfdmVjM18xLnNldFgoMCk7XG4gIF92ZWMzXzEuc2V0WSgwKTtcbiAgX3ZlYzNfMS5zZXRaKDApO1xuXG4gIF9vYmplY3Quc2V0TWFzc1Byb3BzKGRldGFpbHMubWFzcywgX3ZlYzNfMSk7XG4gIHdvcmxkLmFkZFJpZ2lkQm9keShfb2JqZWN0KTtcbiAgX29iamVjdC5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUNlbnRyYWxJbXB1bHNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUNlbnRyYWxJbXB1bHNlKF92ZWMzXzEpO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUltcHVsc2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy5pbXB1bHNlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy5pbXB1bHNlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy5pbXB1bHNlX3opO1xuXG4gIF92ZWMzXzIuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18yLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMi5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlJbXB1bHNlKFxuICAgIF92ZWMzXzEsXG4gICAgX3ZlYzNfMlxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseVRvcnF1ZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLnRvcnF1ZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMudG9ycXVlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy50b3JxdWVfeik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlUb3JxdWUoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUNlbnRyYWxGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlDZW50cmFsRm9yY2UoX3ZlYzNfMSk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Rm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy5mb3JjZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMuZm9yY2VfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLmZvcmNlX3opO1xuXG4gIF92ZWMzXzIuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18yLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMi5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlGb3JjZShcbiAgICBfdmVjM18xLFxuICAgIF92ZWMzXzJcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMub25TaW11bGF0aW9uUmVzdW1lID0gKCkgPT4ge1xuICBsYXN0X3NpbXVsYXRpb25fdGltZSA9IERhdGUubm93KCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEFuZ3VsYXJWZWxvY2l0eSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0QW5ndWxhclZlbG9jaXR5KFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0TGluZWFyVmVsb2NpdHkgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldExpbmVhclZlbG9jaXR5KFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QW5ndWxhckZhY3RvciA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0QW5ndWxhckZhY3RvcihcbiAgICBfdmVjM18xXG4gICk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldExpbmVhckZhY3RvciA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0TGluZWFyRmFjdG9yKFxuICAgIF92ZWMzXzFcbiAgKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0RGFtcGluZyA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldERhbXBpbmcoZGV0YWlscy5saW5lYXIsIGRldGFpbHMuYW5ndWxhcik7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldENjZE1vdGlvblRocmVzaG9sZCA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldENjZE1vdGlvblRocmVzaG9sZChkZXRhaWxzLnRocmVzaG9sZCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldENjZFN3ZXB0U3BoZXJlUmFkaXVzID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMoZGV0YWlscy5yYWRpdXMpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRDb25zdHJhaW50ID0gKGRldGFpbHMpID0+IHtcbiAgbGV0IGNvbnN0cmFpbnQ7XG5cbiAgc3dpdGNoIChkZXRhaWxzLnR5cGUpIHtcblxuICBjYXNlICdwb2ludCc6XG4gICAge1xuICAgICAgaWYgKGRldGFpbHMub2JqZWN0YiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0UG9pbnQyUG9pbnRDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX3ZlYzNfMVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRQb2ludDJQb2ludENvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdoaW5nZSc6XG4gICAge1xuICAgICAgaWYgKGRldGFpbHMub2JqZWN0YiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMuYXhpcy54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMuYXhpcy55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMuYXhpcy56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRIaW5nZUNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzJcbiAgICAgICAgKTtcblxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICBfdmVjM18zLnNldFgoZGV0YWlscy5heGlzLngpO1xuICAgICAgICBfdmVjM18zLnNldFkoZGV0YWlscy5heGlzLnkpO1xuICAgICAgICBfdmVjM18zLnNldFooZGV0YWlscy5heGlzLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEhpbmdlQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yLFxuICAgICAgICAgIF92ZWMzXzMsXG4gICAgICAgICAgX3ZlYzNfM1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdzbGlkZXInOlxuICAgIHtcbiAgICAgIGxldCB0cmFuc2Zvcm1iO1xuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyKGRldGFpbHMuYXhpcy54LCBkZXRhaWxzLmF4aXMueSwgZGV0YWlscy5heGlzLnopO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIpIHtcbiAgICAgICAgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgICAgcm90YXRpb24uc2V0RXVsZXIoZGV0YWlscy5heGlzLngsIGRldGFpbHMuYXhpcy55LCBkZXRhaWxzLmF4aXMueik7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFNsaWRlckNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJhbnNmb3JtYixcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0U2xpZGVyQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBpZiAodHJhbnNmb3JtYiAhPT0gdW5kZWZpbmVkKSBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnY29uZXR3aXN0JzpcbiAgICB7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgY29uc3QgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1iLnNldElkZW50aXR5KCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm1hLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYS56LCAtZGV0YWlscy5heGlzYS55LCAtZGV0YWlscy5heGlzYS54KTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNiLnosIC1kZXRhaWxzLmF4aXNiLnksIC1kZXRhaWxzLmF4aXNiLngpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idENvbmVUd2lzdENvbnN0cmFpbnQoXG4gICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgIHRyYW5zZm9ybWJcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0cmFpbnQuc2V0TGltaXQoTWF0aC5QSSwgMCwgTWF0aC5QSSk7XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdkb2YnOlxuICAgIHtcbiAgICAgIGxldCB0cmFuc2Zvcm1iO1xuXG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2EueiwgLWRldGFpbHMuYXhpc2EueSwgLWRldGFpbHMuYXhpc2EueCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgaWYgKGRldGFpbHMub2JqZWN0Yikge1xuICAgICAgICB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRJZGVudGl0eSgpO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgdHJhbnNmb3JtYi5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1iLmdldFJvdGF0aW9uKCk7XG4gICAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNiLnosIC1kZXRhaWxzLmF4aXNiLnksIC1kZXRhaWxzLmF4aXNiLngpO1xuICAgICAgICB0cmFuc2Zvcm1iLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRHZW5lcmljNkRvZkNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJhbnNmb3JtYixcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIGlmICh0cmFuc2Zvcm1iICE9PSB1bmRlZmluZWQpIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBkZWZhdWx0OlxuICAgIHJldHVybjtcbiAgfVxuXG4gIHdvcmxkLmFkZENvbnN0cmFpbnQoY29uc3RyYWludCk7XG5cbiAgY29uc3RyYWludC5hID0gX29iamVjdHNbZGV0YWlscy5vYmplY3RhXTtcbiAgY29uc3RyYWludC5iID0gX29iamVjdHNbZGV0YWlscy5vYmplY3RiXTtcblxuICBjb25zdHJhaW50LmVuYWJsZUZlZWRiYWNrKCk7XG4gIF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXSA9IGNvbnN0cmFpbnQ7XG4gIF9udW1fY29uc3RyYWludHMrKztcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgxICsgX251bV9jb25zdHJhaW50cyAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICYgKCAjIG9mIG9iamVjdHMgdG8gcmVwb3J0ICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdCApXG4gICAgY29uc3RyYWludHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDtcbiAgfVxuICBlbHNlIGNvbnN0cmFpbnRyZXBvcnQgPSBbTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUXTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMucmVtb3ZlQ29uc3RyYWludCA9IChkZXRhaWxzKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbZGV0YWlscy5pZF07XG5cbiAgaWYgKGNvbnN0cmFpbnQgIT09IHVuZGVmaW5lZCkge1xuICAgIHdvcmxkLnJlbW92ZUNvbnN0cmFpbnQoY29uc3RyYWludCk7XG4gICAgX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgICBfbnVtX2NvbnN0cmFpbnRzLS07XG4gIH1cbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uc3RyYWludF9zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQgPSAoZGV0YWlscykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdO1xuICBpZiAoY29uc3RyYWludCAhPT0gdW5kZWZpbmVkKSBjb25zdHJhaW50LnNldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZChkZXRhaWxzLnRocmVzaG9sZCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNpbXVsYXRlID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIGlmICh3b3JsZCkge1xuICAgIGlmIChwYXJhbXMudGltZVN0ZXAgJiYgcGFyYW1zLnRpbWVTdGVwIDwgZml4ZWRUaW1lU3RlcClcbiAgICAgIHBhcmFtcy50aW1lU3RlcCA9IGZpeGVkVGltZVN0ZXA7XG5cbiAgICBwYXJhbXMubWF4U3ViU3RlcHMgPSBwYXJhbXMubWF4U3ViU3RlcHMgfHwgTWF0aC5jZWlsKHBhcmFtcy50aW1lU3RlcCAvIGZpeGVkVGltZVN0ZXApOyAvLyBJZiBtYXhTdWJTdGVwcyBpcyBub3QgZGVmaW5lZCwga2VlcCB0aGUgc2ltdWxhdGlvbiBmdWxseSB1cCB0byBkYXRlXG5cbiAgICB3b3JsZC5zdGVwU2ltdWxhdGlvbihwYXJhbXMudGltZVN0ZXAsIHBhcmFtcy5tYXhTdWJTdGVwcywgZml4ZWRUaW1lU3RlcCk7XG5cbiAgICBpZiAoX3ZlaGljbGVzLmxlbmd0aCA+IDApIHJlcG9ydFZlaGljbGVzKCk7XG4gICAgcmVwb3J0Q29sbGlzaW9ucygpO1xuICAgIGlmIChfY29uc3RyYWludHMubGVuZ3RoID4gMCkgcmVwb3J0Q29uc3RyYWludHMoKTtcbiAgICByZXBvcnRXb3JsZCgpO1xuICAgIGlmIChfc29mdGJvZHlfZW5hYmxlZCkgcmVwb3J0V29ybGRfc29mdGJvZGllcygpO1xuICB9XG59O1xuXG4vLyBDb25zdHJhaW50IGZ1bmN0aW9uc1xucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9zZXRMaW1pdHMgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLmxvdywgcGFyYW1zLmhpZ2gsIDAsIHBhcmFtcy5iaWFzX2ZhY3RvciwgcGFyYW1zLnJlbGF4YXRpb25fZmFjdG9yKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVBbmd1bGFyTW90b3IodHJ1ZSwgcGFyYW1zLnZlbG9jaXR5LCBwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9kaXNhYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uZW5hYmxlTW90b3IoZmFsc2UpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX3NldExpbWl0cyA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0TG93ZXJMaW5MaW1pdChwYXJhbXMubGluX2xvd2VyIHx8IDApO1xuICBjb25zdHJhaW50LnNldFVwcGVyTGluTGltaXQocGFyYW1zLmxpbl91cHBlciB8fCAwKTtcblxuICBjb25zdHJhaW50LnNldExvd2VyQW5nTGltaXQocGFyYW1zLmFuZ19sb3dlciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRVcHBlckFuZ0xpbWl0KHBhcmFtcy5hbmdfdXBwZXIgfHwgMCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9zZXRSZXN0aXR1dGlvbiA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0U29mdG5lc3NMaW1MaW4ocGFyYW1zLmxpbmVhciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRTb2Z0bmVzc0xpbUFuZyhwYXJhbXMuYW5ndWxhciB8fCAwKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRUYXJnZXRMaW5Nb3RvclZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIGNvbnN0cmFpbnQuc2V0TWF4TGluTW90b3JGb3JjZShwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkTGluTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZExpbk1vdG9yKGZhbHNlKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFRhcmdldEFuZ01vdG9yVmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgY29uc3RyYWludC5zZXRNYXhBbmdNb3RvckZvcmNlKHBhcmFtcy5hY2NlbGVyYXRpb24pO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRBbmdNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZEFuZ01vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLnosIHBhcmFtcy55LCBwYXJhbXMueCk7IC8vIFpZWCBvcmRlclxufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZW5hYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LmVuYWJsZU1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldE1heE1vdG9ySW1wdWxzZShwYXJhbXMubWF4X2ltcHVsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNb3RvclRhcmdldCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3F1YXQuc2V0WChwYXJhbXMueCk7XG4gIF9xdWF0LnNldFkocGFyYW1zLnkpO1xuICBfcXVhdC5zZXRaKHBhcmFtcy56KTtcbiAgX3F1YXQuc2V0VyhwYXJhbXMudyk7XG5cbiAgY29uc3RyYWludC5zZXRNb3RvclRhcmdldChfcXVhdCk7XG5cbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZGlzYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhckxvd2VyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJMb3dlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJVcHBlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0QW5ndWxhckxvd2VyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRBbmd1bGFyVXBwZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIGNvbnN0IG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuICBtb3Rvci5zZXRfbV9lbmFibGVNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9jb25maWd1cmVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2xvTGltaXQocGFyYW1zLmxvd19hbmdsZSk7XG4gIG1vdG9yLnNldF9tX2hpTGltaXQocGFyYW1zLmhpZ2hfYW5nbGUpO1xuICBtb3Rvci5zZXRfbV90YXJnZXRWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBtb3Rvci5zZXRfbV9tYXhNb3RvckZvcmNlKHBhcmFtcy5tYXhfZm9yY2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX2Rpc2FibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2VuYWJsZU1vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5jb25zdCByZXBvcnRXb3JsZCA9ICgpID0+IHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIHdvcmxkcmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX3JpZ2lkYm9keV9vYmplY3RzICogV09STERSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICArXG4gICAgICAoTWF0aC5jZWlsKF9udW1fcmlnaWRib2R5X29iamVjdHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogV09STERSRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgKTtcblxuICAgIHdvcmxkcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDtcbiAgfVxuXG4gIHdvcmxkcmVwb3J0WzFdID0gX251bV9yaWdpZGJvZHlfb2JqZWN0czsgLy8gcmVjb3JkIGhvdyBtYW55IG9iamVjdHMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAge1xuICAgIGxldCBpID0gMCxcbiAgICAgIGluZGV4ID0gX29iamVjdHMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IG9iamVjdCA9IF9vYmplY3RzW2luZGV4XTtcblxuICAgICAgaWYgKG9iamVjdCAmJiBvYmplY3QudHlwZSA9PT0gMSkgeyAvLyBSaWdpZEJvZGllcy5cbiAgICAgICAgLy8gI1RPRE86IHdlIGNhbid0IHVzZSBjZW50ZXIgb2YgbWFzcyB0cmFuc2Zvcm0gd2hlbiBjZW50ZXIgb2YgbWFzcyBjYW4gY2hhbmdlLFxuICAgICAgICAvLyAgICAgICAgYnV0IGdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oKSBzY3Jld3MgdXAgb24gb2JqZWN0cyB0aGF0IGhhdmUgYmVlbiBtb3ZlZFxuICAgICAgICAvLyBvYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybSggdHJhbnNmb3JtICk7XG4gICAgICAgIC8vIG9iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IG9iamVjdC5nZXRDZW50ZXJPZk1hc3NUcmFuc2Zvcm0oKTtcbiAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuICAgICAgICBjb25zdCByb3RhdGlvbiA9IHRyYW5zZm9ybS5nZXRSb3RhdGlvbigpO1xuXG4gICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyAoaSsrKSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldF0gPSBvYmplY3QuaWQ7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBvcmlnaW4ueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnooKTtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA0XSA9IHJvdGF0aW9uLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNV0gPSByb3RhdGlvbi55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDZdID0gcm90YXRpb24ueigpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA3XSA9IHJvdGF0aW9uLncoKTtcblxuICAgICAgICBfdmVjdG9yID0gb2JqZWN0LmdldExpbmVhclZlbG9jaXR5KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDhdID0gX3ZlY3Rvci54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDldID0gX3ZlY3Rvci55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEwXSA9IF92ZWN0b3IueigpO1xuXG4gICAgICAgIF92ZWN0b3IgPSBvYmplY3QuZ2V0QW5ndWxhclZlbG9jaXR5KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDExXSA9IF92ZWN0b3IueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMl0gPSBfdmVjdG9yLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTNdID0gX3ZlY3Rvci56KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSBzZW5kKHdvcmxkcmVwb3J0LmJ1ZmZlciwgW3dvcmxkcmVwb3J0LmJ1ZmZlcl0pO1xuICBlbHNlIHNlbmQod29ybGRyZXBvcnQpO1xufTtcblxuY29uc3QgcmVwb3J0V29ybGRfc29mdGJvZGllcyA9ICgpID0+IHtcbiAgLy8gVE9ETzogQWRkIFNVUFBPUlRUUkFOU0ZFUkFCTEUuXG5cbiAgc29mdHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICtcbiAgICBfbnVtX3NvZnRib2R5X29iamVjdHMgKiAyICtcbiAgICBfc29mdGJvZHlfcmVwb3J0X3NpemUgKiA2XG4gICk7XG5cbiAgc29mdHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuU09GVFJFUE9SVDtcbiAgc29mdHJlcG9ydFsxXSA9IF9udW1fc29mdGJvZHlfb2JqZWN0czsgLy8gcmVjb3JkIGhvdyBtYW55IG9iamVjdHMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAge1xuICAgIGxldCBvZmZzZXQgPSAyLFxuICAgICAgaW5kZXggPSBfb2JqZWN0cy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2JqZWN0ID0gX29iamVjdHNbaW5kZXhdO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIG9iamVjdC50eXBlID09PSAwKSB7IC8vIFNvZnRCb2RpZXMuXG5cbiAgICAgICAgc29mdHJlcG9ydFtvZmZzZXRdID0gb2JqZWN0LmlkO1xuXG4gICAgICAgIGNvbnN0IG9mZnNldFZlcnQgPSBvZmZzZXQgKyAyO1xuXG4gICAgICAgIGlmIChvYmplY3Qucm9wZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGNvbnN0IG5vZGVzID0gb2JqZWN0LmdldF9tX25vZGVzKCk7XG4gICAgICAgICAgY29uc3Qgc2l6ZSA9IG5vZGVzLnNpemUoKTtcbiAgICAgICAgICBzb2Z0cmVwb3J0W29mZnNldCArIDFdID0gc2l6ZTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXMuYXQoaSk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0ID0gbm9kZS5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogMyArIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqZWN0LmNsb3RoKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZXMgPSBvYmplY3QuZ2V0X21fbm9kZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gbm9kZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5hdChpKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQgPSBub2RlLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbCA9IG5vZGUuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0LngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMV0gPSB2ZXJ0LnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0LnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAzXSA9IC1ub3JtYWwueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA0XSA9IC1ub3JtYWwueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA1XSA9IC1ub3JtYWwueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogNiArIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29uc3QgZmFjZXMgPSBvYmplY3QuZ2V0X21fZmFjZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gZmFjZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGZhY2UgPSBmYWNlcy5hdChpKTtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZTEgPSBmYWNlLmdldF9tX24oMCk7XG4gICAgICAgICAgICBjb25zdCBub2RlMiA9IGZhY2UuZ2V0X21fbigxKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUzID0gZmFjZS5nZXRfbV9uKDIpO1xuXG4gICAgICAgICAgICBjb25zdCB2ZXJ0MSA9IG5vZGUxLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQyID0gbm9kZTIuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3QgdmVydDMgPSBub2RlMy5nZXRfbV94KCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDEgPSBub2RlMS5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwyID0gbm9kZTIuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMyA9IG5vZGUzLmdldF9tX24oKTtcblxuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiAxODtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydDEueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQxLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0MS56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgM10gPSBub3JtYWwxLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNF0gPSBub3JtYWwxLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNV0gPSBub3JtYWwxLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA2XSA9IHZlcnQyLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgN10gPSB2ZXJ0Mi55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDhdID0gdmVydDIueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDldID0gbm9ybWFsMi54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEwXSA9IG5vcm1hbDIueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMV0gPSBub3JtYWwyLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMl0gPSB2ZXJ0My54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEzXSA9IHZlcnQzLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTRdID0gdmVydDMueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE1XSA9IG5vcm1hbDMueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNl0gPSBub3JtYWwzLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTddID0gbm9ybWFsMy56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiAxOCArIDI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHNlbmQoc29mdHJlcG9ydC5idWZmZXIsIFtzb2Z0cmVwb3J0LmJ1ZmZlcl0pO1xuICAvLyBlbHNlIHNlbmQoc29mdHJlcG9ydCk7XG4gIHNlbmQoc29mdHJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRDb2xsaXNpb25zID0gKCkgPT4ge1xuICBjb25zdCBkcCA9IHdvcmxkLmdldERpc3BhdGNoZXIoKSxcbiAgICBudW0gPSBkcC5nZXROdW1NYW5pZm9sZHMoKTtcbiAgLy8gX2NvbGxpZGVkID0gZmFsc2U7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgaWYgKGNvbGxpc2lvbnJlcG9ydC5sZW5ndGggPCAyICsgbnVtICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgICBjb2xsaXNpb25yZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICtcbiAgICAgICAgKE1hdGguY2VpbChfbnVtX29iamVjdHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIGNvbGxpc2lvbnJlcG9ydFsxXSA9IDA7IC8vIGhvdyBtYW55IGNvbGxpc2lvbnMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW07IGkrKykge1xuICAgIGNvbnN0IG1hbmlmb2xkID0gZHAuZ2V0TWFuaWZvbGRCeUluZGV4SW50ZXJuYWwoaSksXG4gICAgICBudW1fY29udGFjdHMgPSBtYW5pZm9sZC5nZXROdW1Db250YWN0cygpO1xuXG4gICAgaWYgKG51bV9jb250YWN0cyA9PT0gMCkgY29udGludWU7XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG51bV9jb250YWN0czsgaisrKSB7XG4gICAgICBjb25zdCBwdCA9IG1hbmlmb2xkLmdldENvbnRhY3RQb2ludChqKTtcblxuICAgICAgLy8gaWYgKCBwdC5nZXREaXN0YW5jZSgpIDwgMCApIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyAoY29sbGlzaW9ucmVwb3J0WzFdKyspICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldF0gPSBfb2JqZWN0c19hbW1vW21hbmlmb2xkLmdldEJvZHkwKCkucHRyXTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAxXSA9IF9vYmplY3RzX2FtbW9bbWFuaWZvbGQuZ2V0Qm9keTEoKS5wdHJdO1xuXG4gICAgICBfdmVjdG9yID0gcHQuZ2V0X21fbm9ybWFsV29ybGRPbkIoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAyXSA9IF92ZWN0b3IueCgpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDNdID0gX3ZlY3Rvci55KCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgNF0gPSBfdmVjdG9yLnooKTtcbiAgICAgIGJyZWFrO1xuICAgICAgLy8gfVxuICAgICAgLy8gc2VuZChfb2JqZWN0c19hbW1vKTtcbiAgICB9XG4gIH1cblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHNlbmQoY29sbGlzaW9ucmVwb3J0LmJ1ZmZlciwgW2NvbGxpc2lvbnJlcG9ydC5idWZmZXJdKTtcbiAgZWxzZSBzZW5kKGNvbGxpc2lvbnJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRWZWhpY2xlcyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgaWYgKHZlaGljbGVyZXBvcnQubGVuZ3RoIDwgMiArIF9udW1fd2hlZWxzICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgK1xuICAgICAgICAoTWF0aC5jZWlsKF9udW1fd2hlZWxzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgICApO1xuICAgICAgdmVoaWNsZXJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDtcbiAgICB9XG4gIH1cblxuICB7XG4gICAgbGV0IGkgPSAwLFxuICAgICAgaiA9IDAsXG4gICAgICBpbmRleCA9IF92ZWhpY2xlcy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgaWYgKF92ZWhpY2xlc1tpbmRleF0pIHtcbiAgICAgICAgY29uc3QgdmVoaWNsZSA9IF92ZWhpY2xlc1tpbmRleF07XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHZlaGljbGUuZ2V0TnVtV2hlZWxzKCk7IGorKykge1xuICAgICAgICAgIC8vIHZlaGljbGUudXBkYXRlV2hlZWxUcmFuc2Zvcm0oIGosIHRydWUgKTtcbiAgICAgICAgICAvLyB0cmFuc2Zvcm0gPSB2ZWhpY2xlLmdldFdoZWVsVHJhbnNmb3JtV1MoIGogKTtcbiAgICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB2ZWhpY2xlLmdldFdoZWVsSW5mbyhqKS5nZXRfbV93b3JsZFRyYW5zZm9ybSgpO1xuXG4gICAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuICAgICAgICAgIGNvbnN0IHJvdGF0aW9uID0gdHJhbnNmb3JtLmdldFJvdGF0aW9uKCk7XG5cbiAgICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyAoaSsrKSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldF0gPSBpbmRleDtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDFdID0gajtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueCgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgM10gPSBvcmlnaW4ueSgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNF0gPSBvcmlnaW4ueigpO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA1XSA9IHJvdGF0aW9uLngoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDZdID0gcm90YXRpb24ueSgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgN10gPSByb3RhdGlvbi56KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA4XSA9IHJvdGF0aW9uLncoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSAmJiBqICE9PSAwKSBzZW5kKHZlaGljbGVyZXBvcnQuYnVmZmVyLCBbdmVoaWNsZXJlcG9ydC5idWZmZXJdKTtcbiAgICBlbHNlIGlmIChqICE9PSAwKSBzZW5kKHZlaGljbGVyZXBvcnQpO1xuICB9XG59O1xuXG5jb25zdCByZXBvcnRDb25zdHJhaW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgaWYgKGNvbnN0cmFpbnRyZXBvcnQubGVuZ3RoIDwgMiArIF9udW1fY29uc3RyYWludHMgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArXG4gICAgICAgIChNYXRoLmNlaWwoX251bV9jb25zdHJhaW50cyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAge1xuICAgIGxldCBvZmZzZXQgPSAwLFxuICAgICAgaSA9IDAsXG4gICAgICBpbmRleCA9IF9jb25zdHJhaW50cy5sZW5naHQ7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgaWYgKF9jb25zdHJhaW50c1tpbmRleF0pIHtcbiAgICAgICAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tpbmRleF07XG4gICAgICAgIGNvbnN0IG9mZnNldF9ib2R5ID0gY29uc3RyYWludC5hO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBjb25zdHJhaW50LnRhO1xuICAgICAgICBjb25zdCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XG5cbiAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgb2Zmc2V0ID0gMSArIChpKyspICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldF0gPSBpbmRleDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAxXSA9IG9mZnNldF9ib2R5LmlkO1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLng7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgM10gPSBvcmlnaW4ueTtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyA0XSA9IG9yaWdpbi56O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDVdID0gY29uc3RyYWludC5nZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUgJiYgaSAhPT0gMCkgc2VuZChjb25zdHJhaW50cmVwb3J0LmJ1ZmZlciwgW2NvbnN0cmFpbnRyZXBvcnQuYnVmZmVyXSk7XG4gICAgZWxzZSBpZiAoaSAhPT0gMCkgc2VuZChjb25zdHJhaW50cmVwb3J0KTtcbiAgfVxufTtcblxuc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgaWYgKGV2ZW50LmRhdGEgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAvLyB0cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgc3dpdGNoIChldmVudC5kYXRhWzBdKSB7XG4gICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAge1xuICAgICAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ6XG4gICAgICB7XG4gICAgICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOlxuICAgICAge1xuICAgICAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6XG4gICAgICB7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBkZWZhdWx0OlxuICAgIH1cblxuICAgIHJldHVybjtcbiAgfVxuICBlbHNlIGlmIChldmVudC5kYXRhLmNtZCAmJiBwdWJsaWNfZnVuY3Rpb25zW2V2ZW50LmRhdGEuY21kXSkgcHVibGljX2Z1bmN0aW9uc1tldmVudC5kYXRhLmNtZF0oZXZlbnQuZGF0YS5wYXJhbXMpO1xufTtcblxuc2VsZi5yZWNlaXZlID0gc2VsZi5vbm1lc3NhZ2U7XG5cblxuXG5cbn0pOyIsImltcG9ydCBXb3JsZE1vZHVsZUJhc2UgZnJvbSAnLi9jb3JlL1dvcmxkTW9kdWxlQmFzZSc7XG5cbmltcG9ydCB7XG4gIGFkZE9iamVjdENoaWxkcmVuLFxuICBNRVNTQUdFX1RZUEVTLFxuICB0ZW1wMVZlY3RvcjMsXG4gIHRlbXAxTWF0cml4NCxcbiAgUkVQT1JUX0lURU1TSVpFLFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUsXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkVcbn0gZnJvbSAnLi4vYXBpJztcblxuaW1wb3J0IFBoeXNpY3NXb3JrZXIgZnJvbSAnd29ya2VyIS4uL3dvcmtlci5qcyc7XG5cbmV4cG9ydCBjbGFzcyBXb3JsZE1vZHVsZSBleHRlbmRzIFdvcmxkTW9kdWxlQmFzZSB7XG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICBzdXBlciguLi5hcmdzKTtcblxuICAgIHRoaXMud29ya2VyID0gbmV3IFBoeXNpY3NXb3JrZXIoKTtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlID0gdGhpcy53b3JrZXIud2Via2l0UG9zdE1lc3NhZ2UgfHwgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2U7XG5cbiAgICB0aGlzLmlzTG9hZGVkID0gZmFsc2U7XG5cbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG4gICAgdGhpcy5sb2FkZXIgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAvLyBpZiAob3B0aW9ucy53YXNtKSB7XG4gICAgICAvLyAgIGZldGNoKG9wdGlvbnMud2FzbSlcbiAgICAgIC8vICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5hcnJheUJ1ZmZlcigpKVxuICAgICAgLy8gICAgIC50aGVuKGJ1ZmZlciA9PiB7XG4gICAgICAvLyAgICAgICBvcHRpb25zLndhc21CdWZmZXIgPSBidWZmZXI7XG4gICAgICAvL1xuICAgICAgLy8gICAgICAgdGhpcy5leGVjdXRlKCdpbml0Jywgb3B0aW9ucyk7XG4gICAgICAvLyAgICAgICByZXNvbHZlKCk7XG4gICAgICAvLyAgICAgfSk7XG4gICAgICAvLyB9IGVsc2Uge1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2luaXQnLCBvcHRpb25zKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgLy8gfVxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2FkZXIudGhlbigoKSA9PiB7dGhpcy5pc0xvYWRlZCA9IHRydWV9KTtcblxuICAgIC8vIFRlc3QgU1VQUE9SVF9UUkFOU0ZFUkFCTEVcblxuICAgIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKDEpO1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoYWIsIFthYl0pO1xuICAgIHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUgPSAoYWIuYnl0ZUxlbmd0aCA9PT0gMCk7XG5cbiAgICB0aGlzLnNldHVwKCk7XG4gIH1cblxuICBzZW5kKC4uLmFyZ3MpIHtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKC4uLmFyZ3MpO1xuICB9XG5cbiAgcmVjZWl2ZShjYWxsYmFjaykge1xuICAgIHRoaXMud29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBjYWxsYmFjayk7XG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yMywgUXVhdGVybmlvbn0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBwcm9wZXJ0aWVzID0ge1xuICBwb3NpdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgfSxcblxuICAgIHNldCh2ZWN0b3IzKSB7XG4gICAgICBjb25zdCBwb3MgPSB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgICBjb25zdCBzY29wZSA9IHRoaXM7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHBvcywge1xuICAgICAgICB4OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3g7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh4KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feCA9IHg7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3k7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh5KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feSA9IHk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB6OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3o7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh6KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feiA9IHo7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcblxuICAgICAgcG9zLmNvcHkodmVjdG9yMyk7XG4gICAgfVxuICB9LFxuXG4gIHF1YXRlcm5pb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMubmF0aXZlLnF1YXRlcm5pb247XG4gICAgfSxcblxuICAgIHNldChxdWF0ZXJuaW9uKSB7XG4gICAgICBjb25zdCBxdWF0ID0gdGhpcy5fbmF0aXZlLnF1YXRlcm5pb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgcXVhdC5jb3B5KHF1YXRlcm5pb24pO1xuXG4gICAgICBxdWF0Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIGlmIChuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLl9fY19yb3QgPSBmYWxzZTtcbiAgICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICByb3RhdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHRoaXMuX19jX3JvdCA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnJvdGF0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQoZXVsZXIpIHtcbiAgICAgIGNvbnN0IHJvdCA9IHRoaXMuX25hdGl2ZS5yb3RhdGlvbixcbiAgICAgICAgbmF0aXZlID0gdGhpcy5fbmF0aXZlO1xuXG4gICAgICB0aGlzLnF1YXRlcm5pb24uY29weShuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihldWxlcikpO1xuXG4gICAgICByb3Qub25DaGFuZ2UoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2Nfcm90KSB7XG4gICAgICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIocm90KSk7XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwUGh5c2ljc1Byb3RvdHlwZShzY29wZSkge1xuICBmb3IgKGxldCBrZXkgaW4gcHJvcGVydGllcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzY29wZSwga2V5LCB7XG4gICAgICBnZXQ6IHByb3BlcnRpZXNba2V5XS5nZXQuYmluZChzY29wZSksXG4gICAgICBzZXQ6IHByb3BlcnRpZXNba2V5XS5zZXQuYmluZChzY29wZSksXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25Db3B5KHNvdXJjZSkge1xuICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcblxuICBjb25zdCBwaHlzaWNzID0gdGhpcy51c2UoJ3BoeXNpY3MnKTtcbiAgY29uc3Qgc291cmNlUGh5c2ljcyA9IHNvdXJjZS51c2UoJ3BoeXNpY3MnKTtcblxuICB0aGlzLm1hbmFnZXIubW9kdWxlcy5waHlzaWNzID0gcGh5c2ljcy5jbG9uZSh0aGlzLm1hbmFnZXIpO1xuXG4gIHBoeXNpY3MuZGF0YSA9IHsuLi5zb3VyY2VQaHlzaWNzLmRhdGF9O1xuICBwaHlzaWNzLmRhdGEuaXNTb2Z0Qm9keVJlc2V0ID0gZmFsc2U7XG4gIGlmIChwaHlzaWNzLmRhdGEuaXNTb2Z0Ym9keSkgcGh5c2ljcy5kYXRhLmlzU29mdEJvZHlSZXNldCA9IGZhbHNlO1xuXG4gIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmNsb25lKCk7XG4gIHRoaXMucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uLmNsb25lKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IHRoaXMucXVhdGVybmlvbi5jbG9uZSgpO1xuXG4gIHJldHVybiBzb3VyY2U7XG59XG5cbmZ1bmN0aW9uIG9uV3JhcCgpIHtcbiAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucm90YXRpb24uY2xvbmUoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gdGhpcy5xdWF0ZXJuaW9uLmNsb25lKCk7XG59XG5cbmNsYXNzIEFQSSB7XG4gIGFwcGx5Q2VudHJhbEltcHVsc2UoZm9yY2UpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Q2VudHJhbEltcHVsc2UnLCB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogZm9yY2UueCwgeTogZm9yY2UueSwgejogZm9yY2Uuen0pO1xuICB9XG5cbiAgYXBwbHlJbXB1bHNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5SW1wdWxzZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICBpbXB1bHNlX3g6IGZvcmNlLngsXG4gICAgICBpbXB1bHNlX3k6IGZvcmNlLnksXG4gICAgICBpbXB1bHNlX3o6IGZvcmNlLnosXG4gICAgICB4OiBvZmZzZXQueCxcbiAgICAgIHk6IG9mZnNldC55LFxuICAgICAgejogb2Zmc2V0LnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5VG9ycXVlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseVRvcnF1ZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICB0b3JxdWVfeDogZm9yY2UueCxcbiAgICAgIHRvcnF1ZV95OiBmb3JjZS55LFxuICAgICAgdG9ycXVlX3o6IGZvcmNlLnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5Q2VudHJhbEZvcmNlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUNlbnRyYWxGb3JjZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICB4OiBmb3JjZS54LFxuICAgICAgeTogZm9yY2UueSxcbiAgICAgIHo6IGZvcmNlLnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5Rm9yY2UoZm9yY2UsIG9mZnNldCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlGb3JjZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICBmb3JjZV94OiBmb3JjZS54LFxuICAgICAgZm9yY2VfeTogZm9yY2UueSxcbiAgICAgIGZvcmNlX3o6IGZvcmNlLnosXG4gICAgICB4OiBvZmZzZXQueCxcbiAgICAgIHk6IG9mZnNldC55LFxuICAgICAgejogb2Zmc2V0LnpcbiAgICB9KTtcbiAgfVxuXG4gIGdldEFuZ3VsYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmFuZ3VsYXJWZWxvY2l0eTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRBbmd1bGFyVmVsb2NpdHknLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9XG4gICAgKTtcbiAgfVxuXG4gIGdldExpbmVhclZlbG9jaXR5KCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEubGluZWFyVmVsb2NpdHk7XG4gIH1cblxuICBzZXRMaW5lYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRMaW5lYXJWZWxvY2l0eScsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogdmVsb2NpdHkueCwgeTogdmVsb2NpdHkueSwgejogdmVsb2NpdHkuen1cbiAgICApO1xuICB9XG5cbiAgc2V0QW5ndWxhckZhY3RvcihmYWN0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0QW5ndWxhckZhY3RvcicsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogZmFjdG9yLngsIHk6IGZhY3Rvci55LCB6OiBmYWN0b3Iuen1cbiAgICApO1xuICB9XG5cbiAgc2V0TGluZWFyRmFjdG9yKGZhY3Rvcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRMaW5lYXJGYWN0b3InLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldERhbXBpbmcobGluZWFyLCBhbmd1bGFyKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldERhbXBpbmcnLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIGxpbmVhciwgYW5ndWxhcn1cbiAgICApO1xuICB9XG5cbiAgc2V0Q2NkTW90aW9uVGhyZXNob2xkKHRocmVzaG9sZCkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRDY2RNb3Rpb25UaHJlc2hvbGQnLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHRocmVzaG9sZH1cbiAgICApO1xuICB9XG5cbiAgc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMocmFkaXVzKSB7XG4gICAgdGhpcy5leGVjdXRlKCdzZXRDY2RTd2VwdFNwaGVyZVJhZGl1cycsIHtpZDogdGhpcy5kYXRhLmlkLCByYWRpdXN9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBleHRlbmRzIEFQSSB7XG4gIHN0YXRpYyByaWdpZGJvZHkgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGxpbmVhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICBtYXNzOiAxMCxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIGRhbXBpbmc6IDAsXG4gICAgbWFyZ2luOiAwXG4gIH0pO1xuXG4gIHN0YXRpYyBzb2Z0Ym9keSA9ICgpID0+ICh7XG4gICAgdG91Y2hlczogW10sXG4gICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIGRhbXBpbmc6IDAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIHByZXNzdXJlOiAxMDAsXG4gICAgbWFyZ2luOiAwLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMSxcbiAgICBpc1NvZnRib2R5OiB0cnVlLFxuICAgIGlzU29mdEJvZHlSZXNldDogZmFsc2VcbiAgfSk7XG5cbiAgc3RhdGljIHJvcGUgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIGRhbXBpbmc6IDAsXG4gICAgbWFyZ2luOiAwLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMSxcbiAgICBpc1NvZnRib2R5OiB0cnVlXG4gIH0pO1xuXG4gIHN0YXRpYyBjbG90aCA9ICgpID0+ICh7XG4gICAgdG91Y2hlczogW10sXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAga2xzdDogMC45LFxuICAgIGt2c3Q6IDAuOSxcbiAgICBrYXN0OiAwLjksXG4gICAgcGl0ZXJhdGlvbnM6IDEsXG4gICAgdml0ZXJhdGlvbnM6IDAsXG4gICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgY2l0ZXJhdGlvbnM6IDQsXG4gICAgYW5jaG9ySGFyZG5lc3M6IDAuNyxcbiAgICByaWdpZEhhcmRuZXNzOiAxXG4gIH0pO1xuXG4gIGNvbnN0cnVjdG9yKGRlZmF1bHRzLCBkYXRhKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRzLCBkYXRhKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICBtYW5hZ2VyLmRlZmluZSgncGh5c2ljcycpO1xuXG4gICAgdGhpcy5leGVjdXRlID0gKC4uLmRhdGEpID0+IHtcbiAgICAgIHJldHVybiBtYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJylcbiAgICAgID8gbWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoLi4uZGF0YSlcbiAgICAgIDogKCkgPT4ge307XG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZURhdGEoY2FsbGJhY2spIHtcbiAgICB0aGlzLmJyaWRnZS5nZW9tZXRyeSA9IGZ1bmN0aW9uIChnZW9tZXRyeSwgbW9kdWxlKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrKSByZXR1cm4gZ2VvbWV0cnk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKGdlb21ldHJ5LCBtb2R1bGUpO1xuICAgICAgcmV0dXJuIHJlc3VsdCA/IHJlc3VsdCA6IGdlb21ldHJ5O1xuICAgIH1cbiAgfVxuXG4gIGNsb25lKG1hbmFnZXIpIHtcbiAgICBjb25zdCBjbG9uZSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKCk7XG4gICAgY2xvbmUuZGF0YSA9IHsuLi50aGlzLmRhdGF9O1xuICAgIGNsb25lLmJyaWRnZS5nZW9tZXRyeSA9IHRoaXMuYnJpZGdlLmdlb21ldHJ5O1xuICAgIHRoaXMubWFuYWdlci5hcHBseShjbG9uZSwgW21hbmFnZXJdKTtcblxuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBCb3hNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2JveCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBkYXRhLndpZHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGRhdGEuaGVpZ2h0IHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZGF0YS5kZXB0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb3VuZE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29tcG91bmQnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuLy8gVE9ETzogVGVzdCBDYXBzdWxlTW9kdWxlIGluIGFjdGlvbi5cbmV4cG9ydCBjbGFzcyBDYXBzdWxlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjYXBzdWxlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGRhdGEud2lkdGggfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZGF0YS5oZWlnaHQgfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEuZGVwdGggPSBkYXRhLmRlcHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbmNhdmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NvbmNhdmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGRhdGEuZGF0YSA9IHRoaXMuZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpIHtcbiAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgIGNvbnN0IGRhdGEgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5ID9cbiAgICAgIGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOlxuICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiA5KTtcblxuICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgY29uc3QgdmVydGljZXMgPSBnZW9tZXRyeS52ZXJ0aWNlcztcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICAgICAgY29uc3QgdkEgPSB2ZXJ0aWNlc1tmYWNlLmFdO1xuICAgICAgICBjb25zdCB2QiA9IHZlcnRpY2VzW2ZhY2UuYl07XG4gICAgICAgIGNvbnN0IHZDID0gdmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgICBjb25zdCBpOSA9IGkgKiA5O1xuXG4gICAgICAgIGRhdGFbaTldID0gdkEueDtcbiAgICAgICAgZGF0YVtpOSArIDFdID0gdkEueTtcbiAgICAgICAgZGF0YVtpOSArIDJdID0gdkEuejtcblxuICAgICAgICBkYXRhW2k5ICsgM10gPSB2Qi54O1xuICAgICAgICBkYXRhW2k5ICsgNF0gPSB2Qi55O1xuICAgICAgICBkYXRhW2k5ICsgNV0gPSB2Qi56O1xuXG4gICAgICAgIGRhdGFbaTkgKyA2XSA9IHZDLng7XG4gICAgICAgIGRhdGFbaTkgKyA3XSA9IHZDLnk7XG4gICAgICAgIGRhdGFbaTkgKyA4XSA9IHZDLno7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb25lTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjb25lJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS5yYWRpdXMgPSBkYXRhLnJhZGl1cyB8fCAoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueCkgLyAyO1xuICAgICAgZGF0YS5oZWlnaHQgPSBkYXRhLmhlaWdodCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5fSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb252ZXhNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NvbnZleCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG4gICAgICBpZiAoIWdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIGdlb21ldHJ5Ll9idWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpLmZyb21HZW9tZXRyeShnZW9tZXRyeSk7XG5cbiAgICAgIGRhdGEuZGF0YSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgP1xuICAgICAgICBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDpcbiAgICAgICAgZ2VvbWV0cnkuX2J1ZmZlckdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIEN5bGluZGVyTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjeWxpbmRlcicsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBkYXRhLndpZHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGRhdGEuaGVpZ2h0IHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZGF0YS5kZXB0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5pbXBvcnQge1ZlY3RvcjMsIFZlY3RvcjIsIEJ1ZmZlckdlb21ldHJ5fSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBjbGFzcyBIZWlnaHRmaWVsZE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnaGVpZ2h0ZmllbGQnLFxuICAgICAgc2l6ZTogbmV3IFZlY3RvcjIoMSwgMSksXG4gICAgICBhdXRvQWxpZ246IGZhbHNlLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IHt4OiB4ZGl2LCB5OiB5ZGl2fSA9IGRhdGEuc2l6ZTtcbiAgICAgIGNvbnN0IHZlcnRzID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOiBnZW9tZXRyeS52ZXJ0aWNlcztcbiAgICAgIGxldCBzaXplID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/IHZlcnRzLmxlbmd0aCAvIDMgOiB2ZXJ0cy5sZW5ndGg7XG5cbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBjb25zdCB4c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBjb25zdCB5c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG5cbiAgICAgIGRhdGEueHB0cyA9ICh0eXBlb2YgeGRpdiA9PT0gJ3VuZGVmaW5lZCcpID8gTWF0aC5zcXJ0KHNpemUpIDogeGRpdiArIDE7XG4gICAgICBkYXRhLnlwdHMgPSAodHlwZW9mIHlkaXYgPT09ICd1bmRlZmluZWQnKSA/IE1hdGguc3FydChzaXplKSA6IHlkaXYgKyAxO1xuXG4gICAgICAvLyBub3RlIC0gdGhpcyBhc3N1bWVzIG91ciBwbGFuZSBnZW9tZXRyeSBpcyBzcXVhcmUsIHVubGVzcyB3ZSBwYXNzIGluIHNwZWNpZmljIHhkaXYgYW5kIHlkaXZcbiAgICAgIGRhdGEuYWJzTWF4SGVpZ2h0ID0gTWF0aC5tYXgoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnksIE1hdGguYWJzKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55KSk7XG5cbiAgICAgIGNvbnN0IHBvaW50cyA9IG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSksXG4gICAgICAgIHhwdHMgPSBkYXRhLnhwdHMsXG4gICAgICAgIHlwdHMgPSBkYXRhLnlwdHM7XG5cbiAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgY29uc3Qgdk51bSA9IHNpemUgJSB4cHRzICsgKCh5cHRzIC0gTWF0aC5yb3VuZCgoc2l6ZSAvIHhwdHMpIC0gKChzaXplICUgeHB0cykgLyB4cHRzKSkgLSAxKSAqIHlwdHMpO1xuXG4gICAgICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtICogMyArIDFdO1xuICAgICAgICBlbHNlIHBvaW50c1tzaXplXSA9IHZlcnRzW3ZOdW1dLnk7XG4gICAgICB9XG5cbiAgICAgIGRhdGEucG9pbnRzID0gcG9pbnRzO1xuXG4gICAgICBkYXRhLnNjYWxlLm11bHRpcGx5KFxuICAgICAgICBuZXcgVmVjdG9yMyh4c2l6ZSAvICh4cHRzIC0gMSksIDEsIHlzaXplIC8gKHlwdHMgLSAxKSlcbiAgICAgICk7XG5cbiAgICAgIGlmIChkYXRhLmF1dG9BbGlnbikgZ2VvbWV0cnkudHJhbnNsYXRlKHhzaXplIC8gLTIsIDAsIHlzaXplIC8gLTIpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBQbGFuZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAncGxhbmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZGF0YS53aWR0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgZGF0YS5oZWlnaHQgPSBkYXRhLmhlaWdodCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgZGF0YS5ub3JtYWwgPSBkYXRhLm5vcm1hbCB8fCBnZW9tZXRyeS5mYWNlc1swXS5ub3JtYWwuY2xvbmUoKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgU3BoZXJlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzcGhlcmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ1NwaGVyZSgpO1xuICAgICAgZGF0YS5yYWRpdXMgPSBkYXRhLnJhZGl1cyB8fCBnZW9tZXRyeS5ib3VuZGluZ1NwaGVyZS5yYWRpdXM7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgU29mdGJvZHlNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NvZnRUcmltZXNoJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUuc29mdGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IGlkeEdlb21ldHJ5ID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeVxuICAgICAgICA/IGdlb21ldHJ5XG4gICAgICAgIDogKCgpID0+IHtcbiAgICAgICAgICBnZW9tZXRyeS5tZXJnZVZlcnRpY2VzKCk7XG5cbiAgICAgICAgICBjb25zdCBidWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IChnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAzID4gNjU1MzUgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5KShnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgKS5jb3B5SW5kaWNlc0FycmF5KGdlb21ldHJ5LmZhY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZmVyR2VvbWV0cnk7XG4gICAgICAgIH0pKCk7XG5cbiAgICAgIGRhdGEuYVZlcnRpY2VzID0gaWR4R2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICAgIGRhdGEuYUluZGljZXMgPSBpZHhHZW9tZXRyeS5pbmRleC5hcnJheTtcblxuICAgICAgcmV0dXJuIG5ldyBCdWZmZXJHZW9tZXRyeSgpLmZyb21HZW9tZXRyeShnZW9tZXRyeSk7XG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRBbmNob3Iob2JqZWN0LCBub2RlLCBpbmZsdWVuY2UgPSAxLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5mdW5jdGlvbiBhcnJheU1heChhcnJheSkge1xuXHRpZiAoYXJyYXkubGVuZ3RoID09PSAwKSByZXR1cm4gLSBJbmZpbml0eTtcblxuXHR2YXIgbWF4ID0gYXJyYXlbMF07XG5cblx0Zm9yIChsZXQgaSA9IDEsIGwgPSBhcnJheS5sZW5ndGg7IGkgPCBsOyArKyBpICkge1xuXHRcdGlmIChhcnJheVsgaSBdID4gbWF4KSBtYXggPSBhcnJheVtpXTtcblx0fVxuXG5cdHJldHVybiBtYXg7XG59XG5cbmV4cG9ydCBjbGFzcyBDbG90aE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc29mdENsb3RoTWVzaCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLmNsb3RoKClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBjb25zdCBnZW9tUGFyYW1zID0gZ2VvbWV0cnkucGFyYW1ldGVycztcblxuICAgICAgY29uc3QgZ2VvbSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnlcbiAgICAgICAgPyBnZW9tZXRyeVxuICAgICAgICAgIDogKCgpID0+IHtcbiAgICAgICAgICBnZW9tZXRyeS5tZXJnZVZlcnRpY2VzKCk7XG5cbiAgICAgICAgICBjb25zdCBidWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuXHRcdFx0XHRcdGNvbnN0IGZhY2VzID0gZ2VvbWV0cnkuZmFjZXMsIGZhY2VzTGVuZ3RoID0gZmFjZXMubGVuZ3RoLCB1dnMgPSBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdO1xuXG4gICAgICAgICAgY29uc3Qgbm9ybWFsc0FycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmYWNlc0xlbmd0aCAqIDMpO1xuICAgICAgICAgIC8vIGNvbnN0IHV2c0FycmF5ID0gbmV3IEFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDIpO1xuICAgICAgICAgIGNvbnN0IHV2c0FycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmYWNlc0xlbmd0aCAqIDIpO1xuICAgICAgICAgIGNvbnN0IHV2c1JlcGxhY2VkQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZhY2VzTGVuZ3RoICogNik7XG5cdFx0XHRcdFx0Y29uc3QgZmFjZUFycmF5ID0gbmV3IFVpbnQzMkFycmF5KGZhY2VzTGVuZ3RoICogMyk7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY2VzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGkzID0gaSAqIDM7XG4gICAgICAgICAgICBjb25zdCBpNiA9IGkgKiA2O1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gZmFjZXNbaV0ubm9ybWFsIHx8IG5ldyBWZWN0b3IzKCk7XG5cblx0XHRcdFx0XHRcdGZhY2VBcnJheVtpM10gPSBmYWNlc1tpXS5hO1xuICAgICAgICAgICAgZmFjZUFycmF5W2kzICsgMV0gPSBmYWNlc1tpXS5iO1xuICAgICAgICAgICAgZmFjZUFycmF5W2kzICsgMl0gPSBmYWNlc1tpXS5jO1xuXG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTNdID0gbm9ybWFsLng7XG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTMgKyAxXSA9IG5vcm1hbC55O1xuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzICsgMl0gPSBub3JtYWwuejtcblxuICAgICAgICAgICAgdXZzQXJyYXlbZmFjZXNbaV0uYSAqIDIgKyAwXSA9IHV2c1tpXVswXS54OyAvLyBhXG4gICAgICAgICAgICB1dnNBcnJheVtmYWNlc1tpXS5hICogMiArIDFdID0gdXZzW2ldWzBdLnk7XG5cbiAgICAgICAgICAgIHV2c0FycmF5W2ZhY2VzW2ldLmIgKiAyICsgMF0gPSB1dnNbaV1bMV0ueDsgLy8gYlxuICAgICAgICAgICAgdXZzQXJyYXlbZmFjZXNbaV0uYiAqIDIgKyAxXSA9IHV2c1tpXVsxXS55O1xuXG4gICAgICAgICAgICB1dnNBcnJheVtmYWNlc1tpXS5jICogMiArIDBdID0gdXZzW2ldWzJdLng7IC8vIGNcbiAgICAgICAgICAgIHV2c0FycmF5W2ZhY2VzW2ldLmMgKiAyICsgMV0gPSB1dnNbaV1bMl0ueTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAnbm9ybWFsJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5vcm1hbHNBcnJheSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAndXYnLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgdXZzQXJyYXksXG4gICAgICAgICAgICAgIDJcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuXG5cdFx0XHRcdFx0YnVmZmVyR2VvbWV0cnkuc2V0SW5kZXgoXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgKGFycmF5TWF4KGZhY2VzKSAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGZhY2VzTGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShmYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBjb25zdCB2ZXJ0cyA9IGdlb20uYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgaWYgKCFnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMpIGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyA9IDE7XG4gICAgICBpZiAoIWdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMpIGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgPSAxO1xuXG4gICAgICBjb25zdCBpZHgwMCA9IDA7XG4gICAgICBjb25zdCBpZHgwMSA9IGdlb21QYXJhbXMud2lkdGhTZWdtZW50cztcbiAgICAgIGNvbnN0IGlkeDEwID0gKGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgKyAxKSAqIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKSAtIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKTtcbiAgICAgIGNvbnN0IGlkeDExID0gdmVydHMubGVuZ3RoIC8gMyAtIDE7XG5cbiAgICAgIGRhdGEuY29ybmVycyA9IFtcbiAgICAgICAgdmVydHNbaWR4MDEgKiAzXSwgdmVydHNbaWR4MDEgKiAzICsgMV0sIHZlcnRzW2lkeDAxICogMyArIDJdLCAvLyAgIOKVl1xuICAgICAgICB2ZXJ0c1tpZHgwMCAqIDNdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAxXSwgdmVydHNbaWR4MDAgKiAzICsgMl0sIC8vIOKVlFxuICAgICAgICB2ZXJ0c1tpZHgxMSAqIDNdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAxXSwgdmVydHNbaWR4MTEgKiAzICsgMl0sIC8vICAgICAgIOKVnVxuICAgICAgICB2ZXJ0c1tpZHgxMCAqIDNdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAxXSwgdmVydHNbaWR4MTAgKiAzICsgMl0sIC8vICAgICDilZpcbiAgICAgIF07XG5cbiAgICAgIGRhdGEuc2VnbWVudHMgPSBbZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSwgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDFdO1xuXG4gICAgICByZXR1cm4gZ2VvbTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG5cblx0bGlua05vZGVzKG9iamVjdCwgbjEsIG4yLCBtb2RpZmllcikge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLmRhdGEuaWQ7XG4gICAgY29uc3QgYm9keSA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdsaW5rTm9kZXMnLCB7XG4gICAgICBzZWxmLFxuXHRcdFx0Ym9keSxcbiAgICAgIG4xLCAvLyBzZWxmIG5vZGVcbiAgICAgIG4yLCAvLyBib2R5IG5vZGVcblx0XHRcdG1vZGlmaWVyXG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRMaW5lYXJKb2ludChvYmplY3QsIHNwZWNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBib2R5ID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZExpbmVhckpvaW50Jywge1xuICAgICAgc2VsZixcbiAgICAgIGJvZHksXG4gICAgICBzcGVjc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUsIFZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFJvcGVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NvZnRSb3BlTWVzaCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJvcGUoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgICBnZW9tZXRyeSA9ICgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYnVmZiA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZi5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmY7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxlbmd0aCA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkubGVuZ3RoIC8gMztcbiAgICAgIGNvbnN0IHZlcnQgPSBuID0+IG5ldyBWZWN0b3IzKCkuZnJvbUFycmF5KGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXksIG4qMyk7XG5cbiAgICAgIGNvbnN0IHYxID0gdmVydCgwKTtcbiAgICAgIGNvbnN0IHYyID0gdmVydChsZW5ndGggLSAxKTtcblxuICAgICAgZGF0YS5kYXRhID0gW1xuICAgICAgICB2MS54LCB2MS55LCB2MS56LFxuICAgICAgICB2Mi54LCB2Mi55LCB2Mi56LFxuICAgICAgICBsZW5ndGhcbiAgICAgIF07XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0xvb3B9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7XG4gIE9iamVjdDNELFxuICBRdWF0ZXJuaW9uLFxuICBWZWN0b3IzLFxuICBFdWxlclxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFBJXzIgPSBNYXRoLlBJIC8gMjtcblxuLy8gVE9ETzogRml4IERPTVxuZnVuY3Rpb24gRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihjYW1lcmEsIG1lc2gsIHBhcmFtcykge1xuICBjb25zdCB2ZWxvY2l0eUZhY3RvciA9IDE7XG4gIGxldCBydW5WZWxvY2l0eSA9IDAuMjU7XG5cbiAgbWVzaC51c2UoJ3BoeXNpY3MnKS5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgLyogSW5pdCAqL1xuICBjb25zdCBwbGF5ZXIgPSBtZXNoLFxuICAgIHBpdGNoT2JqZWN0ID0gbmV3IE9iamVjdDNEKCk7XG5cbiAgcGl0Y2hPYmplY3QuYWRkKGNhbWVyYS5uYXRpdmUpO1xuXG4gIGNvbnN0IHlhd09iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHlhd09iamVjdC5wb3NpdGlvbi55ID0gcGFyYW1zLnlwb3M7IC8vIGV5ZXMgYXJlIDIgbWV0ZXJzIGFib3ZlIHRoZSBncm91bmRcbiAgeWF3T2JqZWN0LmFkZChwaXRjaE9iamVjdCk7XG5cbiAgY29uc3QgcXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbiAgbGV0IGNhbkp1bXAgPSBmYWxzZSxcbiAgICAvLyBNb3Zlcy5cbiAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVMZWZ0ID0gZmFsc2UsXG4gICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG5cbiAgcGxheWVyLm9uKCdjb2xsaXNpb24nLCAob3RoZXJPYmplY3QsIHYsIHIsIGNvbnRhY3ROb3JtYWwpID0+IHtcbiAgICBjb25zb2xlLmxvZyhjb250YWN0Tm9ybWFsLnkpO1xuICAgIGlmIChjb250YWN0Tm9ybWFsLnkgPCAwLjUpIC8vIFVzZSBhIFwiZ29vZFwiIHRocmVzaG9sZCB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDEgaGVyZSFcbiAgICAgIGNhbkp1bXAgPSB0cnVlO1xuICB9KTtcblxuICBjb25zdCBvbk1vdXNlTW92ZSA9IGV2ZW50ID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgY29uc3QgbW92ZW1lbnRYID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRYIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRYID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFgoKSA6IDA7XG4gICAgY29uc3QgbW92ZW1lbnRZID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRZIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRZID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFkoKSA6IDA7XG5cbiAgICB5YXdPYmplY3Qucm90YXRpb24ueSAtPSBtb3ZlbWVudFggKiAwLjAwMjtcbiAgICBwaXRjaE9iamVjdC5yb3RhdGlvbi54IC09IG1vdmVtZW50WSAqIDAuMDAyO1xuXG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCA9IE1hdGgubWF4KC1QSV8yLCBNYXRoLm1pbihQSV8yLCBwaXRjaE9iamVjdC5yb3RhdGlvbi54KSk7XG4gIH07XG5cbiAgY29uc3QgcGh5c2ljcyA9IHBsYXllci51c2UoJ3BoeXNpY3MnKTtcblxuICBjb25zdCBvbktleURvd24gPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDMyOiAvLyBzcGFjZVxuICAgICAgICBjb25zb2xlLmxvZyhjYW5KdW1wKTtcbiAgICAgICAgaWYgKGNhbkp1bXAgPT09IHRydWUpIHBoeXNpY3MuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogMCwgeTogMzAwLCB6OiAwfSk7XG4gICAgICAgIGNhbkp1bXAgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY6IC8vIHNoaWZ0XG4gICAgICAgIHJ1blZlbG9jaXR5ID0gMC41O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgb25LZXlVcCA9IGV2ZW50ID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgIG1vdmVGb3J3YXJkID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBhXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuMjU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfTtcblxuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCBmYWxzZSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93biwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCwgZmFsc2UpO1xuXG4gIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICB0aGlzLmdldE9iamVjdCA9ICgpID0+IHlhd09iamVjdDtcblxuICB0aGlzLmdldERpcmVjdGlvbiA9IHRhcmdldFZlYyA9PiB7XG4gICAgdGFyZ2V0VmVjLnNldCgwLCAwLCAtMSk7XG4gICAgcXVhdC5tdWx0aXBseVZlY3RvcjModGFyZ2V0VmVjKTtcbiAgfTtcblxuICAvLyBNb3ZlcyB0aGUgY2FtZXJhIHRvIHRoZSBQaHlzaS5qcyBvYmplY3QgcG9zaXRpb25cbiAgLy8gYW5kIGFkZHMgdmVsb2NpdHkgdG8gdGhlIG9iamVjdCBpZiB0aGUgcnVuIGtleSBpcyBkb3duLlxuICBjb25zdCBpbnB1dFZlbG9jaXR5ID0gbmV3IFZlY3RvcjMoKSxcbiAgICBldWxlciA9IG5ldyBFdWxlcigpO1xuXG4gIHRoaXMudXBkYXRlID0gZGVsdGEgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBkZWx0YSA9IGRlbHRhIHx8IDAuNTtcbiAgICBkZWx0YSA9IE1hdGgubWluKGRlbHRhLCAwLjUsIGRlbHRhKTtcblxuICAgIGlucHV0VmVsb2NpdHkuc2V0KDAsIDAsIDApO1xuXG4gICAgY29uc3Qgc3BlZWQgPSB2ZWxvY2l0eUZhY3RvciAqIGRlbHRhICogcGFyYW1zLnNwZWVkICogcnVuVmVsb2NpdHk7XG5cbiAgICBpZiAobW92ZUZvcndhcmQpIGlucHV0VmVsb2NpdHkueiA9IC1zcGVlZDtcbiAgICBpZiAobW92ZUJhY2t3YXJkKSBpbnB1dFZlbG9jaXR5LnogPSBzcGVlZDtcbiAgICBpZiAobW92ZUxlZnQpIGlucHV0VmVsb2NpdHkueCA9IC1zcGVlZDtcbiAgICBpZiAobW92ZVJpZ2h0KSBpbnB1dFZlbG9jaXR5LnggPSBzcGVlZDtcblxuICAgIC8vIENvbnZlcnQgdmVsb2NpdHkgdG8gd29ybGQgY29vcmRpbmF0ZXNcbiAgICBldWxlci54ID0gcGl0Y2hPYmplY3Qucm90YXRpb24ueDtcbiAgICBldWxlci55ID0geWF3T2JqZWN0LnJvdGF0aW9uLnk7XG4gICAgZXVsZXIub3JkZXIgPSAnWFlaJztcblxuICAgIHF1YXQuc2V0RnJvbUV1bGVyKGV1bGVyKTtcblxuICAgIGlucHV0VmVsb2NpdHkuYXBwbHlRdWF0ZXJuaW9uKHF1YXQpO1xuXG4gICAgcGh5c2ljcy5hcHBseUNlbnRyYWxJbXB1bHNlKHt4OiBpbnB1dFZlbG9jaXR5LngsIHk6IDAsIHo6IGlucHV0VmVsb2NpdHkuen0pO1xuICAgIHBoeXNpY3Muc2V0QW5ndWxhclZlbG9jaXR5KHt4OiBpbnB1dFZlbG9jaXR5LnosIHk6IDAsIHo6IC1pbnB1dFZlbG9jaXR5Lnh9KTtcbiAgICBwaHlzaWNzLnNldEFuZ3VsYXJGYWN0b3Ioe3g6IDAsIHk6IDAsIHo6IDB9KTtcbiAgfTtcblxuICBwbGF5ZXIub24oJ3BoeXNpY3M6YWRkZWQnLCAoKSA9PiB7XG4gICAgcGxheWVyLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGUnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuICAgICAgeWF3T2JqZWN0LnBvc2l0aW9uLmNvcHkocGxheWVyLnBvc2l0aW9uKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBGaXJzdFBlcnNvbk1vZHVsZSB7XG4gIHN0YXRpYyBkZWZhdWx0cyA9IHtcbiAgICBibG9jazogbnVsbCxcbiAgICBzcGVlZDogMSxcbiAgICB5cG9zOiAxXG4gIH07XG5cbiAgY29uc3RydWN0b3Iob2JqZWN0LCBwYXJhbXMgPSB7fSkge1xuICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgaWYgKCF0aGlzLnBhcmFtcy5ibG9jaykge1xuICAgICAgdGhpcy5wYXJhbXMuYmxvY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmxvY2tlcicpO1xuICAgIH1cbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIHRoaXMuY29udHJvbHMgPSBuZXcgRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihtYW5hZ2VyLmdldCgnY2FtZXJhJyksIHRoaXMub2JqZWN0LCB0aGlzLnBhcmFtcyk7XG5cbiAgICBpZiAoJ3BvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICdtb3pQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnd2Via2l0UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBpZiAoZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQubW96UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQud2Via2l0UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignUG9pbnRlciBsb2NrIGVycm9yLicpO1xuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrID0gZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdFBvaW50ZXJMb2NrO1xuXG4gICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4gPSBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuO1xuXG4gICAgICAgIGlmICgvRmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICBjb25zdCBmdWxsc2NyZWVuY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuXG4gICAgICAgICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfSBlbHNlIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgY29uc29sZS53YXJuKCdZb3VyIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0aGUgUG9pbnRlckxvY2snKTtcblxuICAgIG1hbmFnZXIuZ2V0KCdzY2VuZScpLmFkZCh0aGlzLmNvbnRyb2xzLmdldE9iamVjdCgpKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgdXBkYXRlUHJvY2Vzc29yID0gYyA9PiB7XG4gICAgICBzZWxmLmNvbnRyb2xzLnVwZGF0ZShjLmdldERlbHRhKCkpO1xuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZUxvb3AgPSBuZXcgTG9vcCh1cGRhdGVQcm9jZXNzb3IpLnN0YXJ0KHRoaXMpO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTUVTU0FHRV9UWVBFUyIsIlJFUE9SVF9JVEVNU0laRSIsIkNPTExJU0lPTlJFUE9SVF9JVEVNU0laRSIsIlZFSElDTEVSRVBPUlRfSVRFTVNJWkUiLCJDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFIiwidGVtcDFWZWN0b3IzIiwiVmVjdG9yMyIsInRlbXAyVmVjdG9yMyIsInRlbXAxTWF0cml4NCIsIk1hdHJpeDQiLCJ0ZW1wMVF1YXQiLCJRdWF0ZXJuaW9uIiwiZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiIsIngiLCJ5IiwieiIsInciLCJNYXRoIiwiYXRhbjIiLCJhc2luIiwiZ2V0UXVhdGVydGlvbkZyb21FdWxlciIsImMxIiwiY29zIiwiczEiLCJzaW4iLCJjMiIsInMyIiwiYzMiLCJzMyIsImMxYzIiLCJzMXMyIiwiY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCIsInBvc2l0aW9uIiwib2JqZWN0IiwiaWRlbnRpdHkiLCJtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbiIsInF1YXRlcm5pb24iLCJnZXRJbnZlcnNlIiwiY29weSIsInN1YiIsImFwcGx5TWF0cml4NCIsImFkZE9iamVjdENoaWxkcmVuIiwicGFyZW50IiwiaSIsImNoaWxkcmVuIiwibGVuZ3RoIiwiY2hpbGQiLCJwaHlzaWNzIiwiY29tcG9uZW50IiwidXNlIiwiZGF0YSIsInVwZGF0ZU1hdHJpeCIsInVwZGF0ZU1hdHJpeFdvcmxkIiwic2V0RnJvbU1hdHJpeFBvc2l0aW9uIiwibWF0cml4V29ybGQiLCJzZXRGcm9tUm90YXRpb25NYXRyaXgiLCJwb3NpdGlvbl9vZmZzZXQiLCJyb3RhdGlvbiIsInB1c2giLCJFdmVudGFibGUiLCJfZXZlbnRMaXN0ZW5lcnMiLCJldmVudF9uYW1lIiwiY2FsbGJhY2siLCJoYXNPd25Qcm9wZXJ0eSIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInBhcmFtZXRlcnMiLCJBcnJheSIsInByb3RvdHlwZSIsImNhbGwiLCJhcmd1bWVudHMiLCJhcHBseSIsIm9iaiIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZGlzcGF0Y2hFdmVudCIsIkNvbmVUd2lzdENvbnN0cmFpbnQiLCJvYmphIiwib2JqYiIsIm9iamVjdGEiLCJvYmplY3RiIiwidW5kZWZpbmVkIiwiY29uc29sZSIsImVycm9yIiwidHlwZSIsImFwcGxpZWRJbXB1bHNlIiwid29ybGRNb2R1bGUiLCJpZCIsInBvc2l0aW9uYSIsImNsb25lIiwicG9zaXRpb25iIiwiYXhpc2EiLCJheGlzYiIsImV4ZWN1dGUiLCJjb25zdHJhaW50IiwibWF4X2ltcHVsc2UiLCJ0YXJnZXQiLCJzZXRGcm9tRXVsZXIiLCJFdWxlciIsIkhpbmdlQ29uc3RyYWludCIsImF4aXMiLCJsb3ciLCJoaWdoIiwiYmlhc19mYWN0b3IiLCJyZWxheGF0aW9uX2ZhY3RvciIsInZlbG9jaXR5IiwiYWNjZWxlcmF0aW9uIiwiUG9pbnRDb25zdHJhaW50IiwiU2xpZGVyQ29uc3RyYWludCIsImxpbl9sb3dlciIsImxpbl91cHBlciIsImFuZ19sb3dlciIsImFuZ191cHBlciIsImxpbmVhciIsImFuZ3VsYXIiLCJzY2VuZSIsIkRPRkNvbnN0cmFpbnQiLCJsaW1pdCIsIndoaWNoIiwibG93X2FuZ2xlIiwiaGlnaF9hbmdsZSIsIm1heF9mb3JjZSIsIlZlaGljbGUiLCJtZXNoIiwidHVuaW5nIiwiVmVoaWNsZVR1bmluZyIsIndoZWVscyIsIl9waHlzaWpzIiwiZ2V0T2JqZWN0SWQiLCJzdXNwZW5zaW9uX3N0aWZmbmVzcyIsInN1c3BlbnNpb25fY29tcHJlc3Npb24iLCJzdXNwZW5zaW9uX2RhbXBpbmciLCJtYXhfc3VzcGVuc2lvbl90cmF2ZWwiLCJmcmljdGlvbl9zbGlwIiwibWF4X3N1c3BlbnNpb25fZm9yY2UiLCJ3aGVlbF9nZW9tZXRyeSIsIndoZWVsX21hdGVyaWFsIiwiY29ubmVjdGlvbl9wb2ludCIsIndoZWVsX2RpcmVjdGlvbiIsIndoZWVsX2F4bGUiLCJzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoIiwid2hlZWxfcmFkaXVzIiwiaXNfZnJvbnRfd2hlZWwiLCJ3aGVlbCIsIk1lc2giLCJjYXN0U2hhZG93IiwicmVjZWl2ZVNoYWRvdyIsIm11bHRpcGx5U2NhbGFyIiwiYWRkIiwid29ybGQiLCJhbW91bnQiLCJzdGVlcmluZyIsImJyYWtlIiwiZm9yY2UiLCJXb3JsZE1vZHVsZUJhc2UiLCJvcHRpb25zIiwiYnJpZGdlIiwic2VsZiIsImRlZmVyIiwib25BZGRDYWxsYmFjayIsImJpbmQiLCJvblJlbW92ZUNhbGxiYWNrIiwiT2JqZWN0IiwiYXNzaWduIiwiZGVmYXVsdHMiLCJvYmplY3RzIiwidmVoaWNsZXMiLCJjb25zdHJhaW50cyIsImlzU2ltdWxhdGluZyIsInJlY2VpdmUiLCJfdGVtcCIsImV2ZW50IiwiQXJyYXlCdWZmZXIiLCJieXRlTGVuZ3RoIiwiRmxvYXQzMkFycmF5IiwiV09STERSRVBPUlQiLCJ1cGRhdGVTY2VuZSIsIlNPRlRSRVBPUlQiLCJ1cGRhdGVTb2Z0Ym9kaWVzIiwiQ09MTElTSU9OUkVQT1JUIiwidXBkYXRlQ29sbGlzaW9ucyIsIlZFSElDTEVSRVBPUlQiLCJ1cGRhdGVWZWhpY2xlcyIsIkNPTlNUUkFJTlRSRVBPUlQiLCJ1cGRhdGVDb25zdHJhaW50cyIsImNtZCIsInBhcmFtcyIsInRlc3QiLCJkZWJ1ZyIsImRpciIsImluZm8iLCJvZmZzZXQiLCJfX2RpcnR5UG9zaXRpb24iLCJzZXQiLCJfX2RpcnR5Um90YXRpb24iLCJsaW5lYXJWZWxvY2l0eSIsImFuZ3VsYXJWZWxvY2l0eSIsIlNVUFBPUlRfVFJBTlNGRVJBQkxFIiwic2VuZCIsImJ1ZmZlciIsInNpemUiLCJhdHRyaWJ1dGVzIiwiZ2VvbWV0cnkiLCJ2b2x1bWVQb3NpdGlvbnMiLCJhcnJheSIsIm9mZnNldFZlcnQiLCJpc1NvZnRCb2R5UmVzZXQiLCJ2b2x1bWVOb3JtYWxzIiwibm9ybWFsIiwib2ZmcyIsIngxIiwieTEiLCJ6MSIsIm54MSIsIm55MSIsIm56MSIsIngyIiwieTIiLCJ6MiIsIm54MiIsIm55MiIsIm56MiIsIngzIiwieTMiLCJ6MyIsIm54MyIsIm55MyIsIm56MyIsImk5IiwibmVlZHNVcGRhdGUiLCJueCIsIm55IiwibnoiLCJ2ZWhpY2xlIiwiZXh0cmFjdFJvdGF0aW9uIiwibWF0cml4IiwiYWRkVmVjdG9ycyIsImNvbGxpc2lvbnMiLCJub3JtYWxfb2Zmc2V0cyIsIm9iamVjdDIiLCJpZDEiLCJqIiwidG91Y2hlcyIsImlkMiIsImNvbXBvbmVudDIiLCJkYXRhMiIsInZlbCIsImdldExpbmVhclZlbG9jaXR5IiwidmVsMiIsInN1YlZlY3RvcnMiLCJ0ZW1wMSIsInRlbXAyIiwibm9ybWFsX29mZnNldCIsImVtaXQiLCJzaG93X21hcmtlciIsImdldERlZmluaXRpb24iLCJtYXJrZXIiLCJTcGhlcmVHZW9tZXRyeSIsIk1lc2hOb3JtYWxNYXRlcmlhbCIsIkJveEdlb21ldHJ5IiwibmF0aXZlIiwibWFuYWdlciIsIndpZHRoIiwic2NhbGUiLCJoZWlnaHQiLCJkZXB0aCIsInJlbW92ZSIsInBvcCIsImZ1bmMiLCJhcmdzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJpc0xvYWRlZCIsImxvYWRlciIsInRoZW4iLCJkZWZpbmUiLCJ3b3JrZXIiLCJzZXRGaXhlZFRpbWVTdGVwIiwiZml4ZWRUaW1lU3RlcCIsInNldEdyYXZpdHkiLCJncmF2aXR5IiwiYWRkQ29uc3RyYWludCIsInNpbXVsYXRlIiwidGltZVN0ZXAiLCJtYXhTdWJTdGVwcyIsIl9zdGF0cyIsImJlZ2luIiwib2JqZWN0X2lkIiwidXBkYXRlIiwicG9zIiwiaXNTb2Z0Ym9keSIsInF1YXQiLCJlbmQiLCJzaW11bGF0ZUxvb3AiLCJMb29wIiwiY2xvY2siLCJnZXREZWx0YSIsInN0YXJ0IiwibG9nIiwiVEFSR0VUIiwiU3ltYm9sIiwiU0NSSVBUX1RZUEUiLCJCbG9iQnVpbGRlciIsIndpbmRvdyIsIldlYktpdEJsb2JCdWlsZGVyIiwiTW96QmxvYkJ1aWxkZXIiLCJNU0Jsb2JCdWlsZGVyIiwiVVJMIiwid2Via2l0VVJMIiwiV29ya2VyIiwic2hpbVdvcmtlciIsImZpbGVuYW1lIiwiZm4iLCJTaGltV29ya2VyIiwiZm9yY2VGYWxsYmFjayIsIm8iLCJzb3VyY2UiLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJzbGljZSIsIm9ialVSTCIsImNyZWF0ZVNvdXJjZU9iamVjdCIsInJldm9rZU9iamVjdFVSTCIsInNlbGZTaGltIiwibSIsIm9ubWVzc2FnZSIsInBvc3RNZXNzYWdlIiwiaXNUaGlzVGhyZWFkIiwidGVzdFdvcmtlciIsInRlc3RBcnJheSIsIlVpbnQ4QXJyYXkiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJFcnJvciIsImUiLCJ0ZXJtaW5hdGUiLCJzdHIiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwiYmxvYiIsImFwcGVuZCIsImdldEJsb2IiLCJkb2N1bWVudCIsIkV2ZW50cyIsImV2ZW50cyIsImVtcHR5Iiwib24iLCJjdHgiLCJvZmYiLCJsaXN0IiwiaW5zaWRlV29ya2VyIiwid2Via2l0UG9zdE1lc3NhZ2UiLCJhYiIsIl9vYmplY3QiLCJfdmVjdG9yIiwiX3RyYW5zZm9ybSIsIl90cmFuc2Zvcm1fcG9zIiwiX3NvZnRib2R5X2VuYWJsZWQiLCJsYXN0X3NpbXVsYXRpb25fZHVyYXRpb24iLCJfbnVtX29iamVjdHMiLCJfbnVtX3JpZ2lkYm9keV9vYmplY3RzIiwiX251bV9zb2Z0Ym9keV9vYmplY3RzIiwiX251bV93aGVlbHMiLCJfbnVtX2NvbnN0cmFpbnRzIiwiX3NvZnRib2R5X3JlcG9ydF9zaXplIiwiX3ZlYzNfMSIsIl92ZWMzXzIiLCJfdmVjM18zIiwiX3F1YXQiLCJwdWJsaWNfZnVuY3Rpb25zIiwiX29iamVjdHMiLCJfdmVoaWNsZXMiLCJfY29uc3RyYWludHMiLCJfb2JqZWN0c19hbW1vIiwiX29iamVjdF9zaGFwZXMiLCJSRVBPUlRfQ0hVTktTSVpFIiwic29mdHJlcG9ydCIsImNvbGxpc2lvbnJlcG9ydCIsInZlaGljbGVyZXBvcnQiLCJjb25zdHJhaW50cmVwb3J0IiwiV09STERSRVBPUlRfSVRFTVNJWkUiLCJnZXRTaGFwZUZyb21DYWNoZSIsImNhY2hlX2tleSIsInNldFNoYXBlQ2FjaGUiLCJzaGFwZSIsImNyZWF0ZVNoYXBlIiwiZGVzY3JpcHRpb24iLCJzZXRJZGVudGl0eSIsIkFtbW8iLCJidENvbXBvdW5kU2hhcGUiLCJzZXRYIiwic2V0WSIsInNldFoiLCJidFN0YXRpY1BsYW5lU2hhcGUiLCJidEJveFNoYXBlIiwicmFkaXVzIiwiYnRTcGhlcmVTaGFwZSIsImJ0Q3lsaW5kZXJTaGFwZSIsImJ0Q2Fwc3VsZVNoYXBlIiwiYnRDb25lU2hhcGUiLCJ0cmlhbmdsZV9tZXNoIiwiYnRUcmlhbmdsZU1lc2giLCJhZGRUcmlhbmdsZSIsImJ0QnZoVHJpYW5nbGVNZXNoU2hhcGUiLCJidENvbnZleEh1bGxTaGFwZSIsImFkZFBvaW50IiwieHB0cyIsInlwdHMiLCJwb2ludHMiLCJwdHIiLCJfbWFsbG9jIiwicCIsInAyIiwiSEVBUEYzMiIsImJ0SGVpZ2h0ZmllbGRUZXJyYWluU2hhcGUiLCJhYnNNYXhIZWlnaHQiLCJjcmVhdGVTb2Z0Qm9keSIsImJvZHkiLCJzb2Z0Qm9keUhlbHBlcnMiLCJidFNvZnRCb2R5SGVscGVycyIsImFWZXJ0aWNlcyIsIkNyZWF0ZUZyb21UcmlNZXNoIiwiZ2V0V29ybGRJbmZvIiwiYUluZGljZXMiLCJjciIsImNvcm5lcnMiLCJDcmVhdGVQYXRjaCIsImJ0VmVjdG9yMyIsInNlZ21lbnRzIiwiQ3JlYXRlUm9wZSIsImluaXQiLCJub1dvcmtlciIsImFtbW8iLCJtYWtlV29ybGQiLCJ3YXNtQnVmZmVyIiwibG9hZEFtbW9Gcm9tQmluYXJ5IiwiYnRUcmFuc2Zvcm0iLCJidFF1YXRlcm5pb24iLCJyZXBvcnRzaXplIiwiY29sbGlzaW9uQ29uZmlndXJhdGlvbiIsInNvZnRib2R5IiwiYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJidERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uIiwiZGlzcGF0Y2hlciIsImJ0Q29sbGlzaW9uRGlzcGF0Y2hlciIsInNvbHZlciIsImJ0U2VxdWVudGlhbEltcHVsc2VDb25zdHJhaW50U29sdmVyIiwiYnJvYWRwaGFzZSIsImFhYmJtaW4iLCJhYWJibWF4IiwiYnRBeGlzU3dlZXAzIiwiYnREYnZ0QnJvYWRwaGFzZSIsImJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZCIsImJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyIiwiYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQiLCJhcHBlbmRBbmNob3IiLCJub2RlIiwib2JqMiIsImNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMiLCJpbmZsdWVuY2UiLCJsaW5rTm9kZXMiLCJzZWxmX2JvZHkiLCJvdGhlcl9ib2R5Iiwic2VsZl9ub2RlIiwiZ2V0X21fbm9kZXMiLCJhdCIsIm4xIiwib3RoZXJfbm9kZSIsIm4yIiwic2VsZl92ZWMiLCJnZXRfbV94Iiwib3RoZXJfdmVjIiwiZm9yY2VfeCIsImZvcmNlX3kiLCJmb3JjZV96IiwiY2FjaGVkX2Rpc3RhbmNlIiwibGlua2VkIiwiX2xvb3AiLCJzZXRJbnRlcnZhbCIsImRpc3RhbmNlIiwic3FydCIsInNldFZlbG9jaXR5IiwibW9kaWZlcjIiLCJtYXgiLCJtb2RpZmllciIsImFkZFZlbG9jaXR5IiwiYXBwZW5kTGluayIsImFkZEZvcmNlIiwiYXBwZW5kTGluZWFySm9pbnQiLCJzcGVjcyIsIlNwZWNzIiwiX3BvcyIsInNldF9wb3NpdGlvbiIsImVycCIsInNldF9lcnAiLCJjZm0iLCJzZXRfY2ZtIiwic3BsaXQiLCJzZXRfc3BsaXQiLCJhZGRPYmplY3QiLCJtb3Rpb25TdGF0ZSIsInNiQ29uZmlnIiwiZ2V0X21fY2ZnIiwidml0ZXJhdGlvbnMiLCJzZXRfdml0ZXJhdGlvbnMiLCJwaXRlcmF0aW9ucyIsInNldF9waXRlcmF0aW9ucyIsImRpdGVyYXRpb25zIiwic2V0X2RpdGVyYXRpb25zIiwiY2l0ZXJhdGlvbnMiLCJzZXRfY2l0ZXJhdGlvbnMiLCJzZXRfY29sbGlzaW9ucyIsInNldF9rREYiLCJmcmljdGlvbiIsInNldF9rRFAiLCJkYW1waW5nIiwicHJlc3N1cmUiLCJzZXRfa1BSIiwiZHJhZyIsInNldF9rREciLCJsaWZ0Iiwic2V0X2tMRiIsImFuY2hvckhhcmRuZXNzIiwic2V0X2tBSFIiLCJyaWdpZEhhcmRuZXNzIiwic2V0X2tDSFIiLCJrbHN0IiwiZ2V0X21fbWF0ZXJpYWxzIiwic2V0X21fa0xTVCIsImthc3QiLCJzZXRfbV9rQVNUIiwia3ZzdCIsInNldF9tX2tWU1QiLCJjYXN0T2JqZWN0IiwiYnRDb2xsaXNpb25PYmplY3QiLCJnZXRDb2xsaXNpb25TaGFwZSIsInNldE1hcmdpbiIsIm1hcmdpbiIsInNldEFjdGl2YXRpb25TdGF0ZSIsInN0YXRlIiwicm9wZSIsImNsb3RoIiwic2V0VyIsInJvdGF0ZSIsInRyYW5zbGF0ZSIsInNldFRvdGFsTWFzcyIsIm1hc3MiLCJhZGRTb2Z0Qm9keSIsImdldF9tX2ZhY2VzIiwiY29tcG91bmRfc2hhcGUiLCJhZGRDaGlsZFNoYXBlIiwiX2NoaWxkIiwidHJhbnMiLCJzZXRPcmlnaW4iLCJzZXRSb3RhdGlvbiIsImRlc3Ryb3kiLCJzZXRMb2NhbFNjYWxpbmciLCJjYWxjdWxhdGVMb2NhbEluZXJ0aWEiLCJidERlZmF1bHRNb3Rpb25TdGF0ZSIsInJiSW5mbyIsImJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyIsInNldF9tX2ZyaWN0aW9uIiwic2V0X21fcmVzdGl0dXRpb24iLCJyZXN0aXR1dGlvbiIsInNldF9tX2xpbmVhckRhbXBpbmciLCJzZXRfbV9hbmd1bGFyRGFtcGluZyIsImJ0UmlnaWRCb2R5IiwiY29sbGlzaW9uX2ZsYWdzIiwic2V0Q29sbGlzaW9uRmxhZ3MiLCJncm91cCIsIm1hc2siLCJhZGRSaWdpZEJvZHkiLCJhY3RpdmF0ZSIsImEiLCJhZGRWZWhpY2xlIiwidmVoaWNsZV90dW5pbmciLCJidFZlaGljbGVUdW5pbmciLCJzZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzIiwic2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uIiwic2V0X21fc3VzcGVuc2lvbkRhbXBpbmciLCJzZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20iLCJzZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UiLCJidFJheWNhc3RWZWhpY2xlIiwicmlnaWRCb2R5IiwiYnREZWZhdWx0VmVoaWNsZVJheWNhc3RlciIsInNldENvb3JkaW5hdGVTeXN0ZW0iLCJyZW1vdmVWZWhpY2xlIiwiYWRkV2hlZWwiLCJzZXRTdGVlcmluZyIsImRldGFpbHMiLCJzZXRTdGVlcmluZ1ZhbHVlIiwic2V0QnJha2UiLCJhcHBseUVuZ2luZUZvcmNlIiwicmVtb3ZlT2JqZWN0IiwicmVtb3ZlU29mdEJvZHkiLCJyZW1vdmVSaWdpZEJvZHkiLCJfbW90aW9uX3N0YXRlcyIsIl9jb21wb3VuZF9zaGFwZXMiLCJfbm9uY2FjaGVkX3NoYXBlcyIsInVwZGF0ZVRyYW5zZm9ybSIsImdldE1vdGlvblN0YXRlIiwiZ2V0V29ybGRUcmFuc2Zvcm0iLCJzZXRXb3JsZFRyYW5zZm9ybSIsInRyYW5zZm9ybSIsInVwZGF0ZU1hc3MiLCJzZXRNYXNzUHJvcHMiLCJhcHBseUNlbnRyYWxJbXB1bHNlIiwiYXBwbHlJbXB1bHNlIiwiaW1wdWxzZV94IiwiaW1wdWxzZV95IiwiaW1wdWxzZV96IiwiYXBwbHlUb3JxdWUiLCJ0b3JxdWVfeCIsInRvcnF1ZV95IiwidG9ycXVlX3oiLCJhcHBseUNlbnRyYWxGb3JjZSIsImFwcGx5Rm9yY2UiLCJvblNpbXVsYXRpb25SZXN1bWUiLCJsYXN0X3NpbXVsYXRpb25fdGltZSIsInNldEFuZ3VsYXJWZWxvY2l0eSIsInNldExpbmVhclZlbG9jaXR5Iiwic2V0QW5ndWxhckZhY3RvciIsInNldExpbmVhckZhY3RvciIsInNldERhbXBpbmciLCJzZXRDY2RNb3Rpb25UaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJzZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyIsImJ0UG9pbnQyUG9pbnRDb25zdHJhaW50IiwiYnRIaW5nZUNvbnN0cmFpbnQiLCJ0cmFuc2Zvcm1iIiwidHJhbnNmb3JtYSIsImdldFJvdGF0aW9uIiwic2V0RXVsZXIiLCJidFNsaWRlckNvbnN0cmFpbnQiLCJ0YSIsInRiIiwic2V0RXVsZXJaWVgiLCJidENvbmVUd2lzdENvbnN0cmFpbnQiLCJzZXRMaW1pdCIsIlBJIiwiYnRHZW5lcmljNkRvZkNvbnN0cmFpbnQiLCJiIiwiZW5hYmxlRmVlZGJhY2siLCJyZW1vdmVDb25zdHJhaW50IiwiY29uc3RyYWludF9zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJzZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJjZWlsIiwic3RlcFNpbXVsYXRpb24iLCJyZXBvcnRWZWhpY2xlcyIsInJlcG9ydENvbnN0cmFpbnRzIiwicmVwb3J0V29ybGRfc29mdGJvZGllcyIsImhpbmdlX3NldExpbWl0cyIsImhpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvciIsImVuYWJsZUFuZ3VsYXJNb3RvciIsImhpbmdlX2Rpc2FibGVNb3RvciIsImVuYWJsZU1vdG9yIiwic2xpZGVyX3NldExpbWl0cyIsInNldExvd2VyTGluTGltaXQiLCJzZXRVcHBlckxpbkxpbWl0Iiwic2V0TG93ZXJBbmdMaW1pdCIsInNldFVwcGVyQW5nTGltaXQiLCJzbGlkZXJfc2V0UmVzdGl0dXRpb24iLCJzZXRTb2Z0bmVzc0xpbUxpbiIsInNldFNvZnRuZXNzTGltQW5nIiwic2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yIiwic2V0VGFyZ2V0TGluTW90b3JWZWxvY2l0eSIsInNldE1heExpbk1vdG9yRm9yY2UiLCJzZXRQb3dlcmVkTGluTW90b3IiLCJzbGlkZXJfZGlzYWJsZUxpbmVhck1vdG9yIiwic2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvciIsInNldFRhcmdldEFuZ01vdG9yVmVsb2NpdHkiLCJzZXRNYXhBbmdNb3RvckZvcmNlIiwic2V0UG93ZXJlZEFuZ01vdG9yIiwic2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3IiLCJjb25ldHdpc3Rfc2V0TGltaXQiLCJjb25ldHdpc3RfZW5hYmxlTW90b3IiLCJjb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlIiwic2V0TWF4TW90b3JJbXB1bHNlIiwiY29uZXR3aXN0X3NldE1vdG9yVGFyZ2V0Iiwic2V0TW90b3JUYXJnZXQiLCJjb25ldHdpc3RfZGlzYWJsZU1vdG9yIiwiZG9mX3NldExpbmVhckxvd2VyTGltaXQiLCJzZXRMaW5lYXJMb3dlckxpbWl0IiwiZG9mX3NldExpbmVhclVwcGVyTGltaXQiLCJzZXRMaW5lYXJVcHBlckxpbWl0IiwiZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0Iiwic2V0QW5ndWxhckxvd2VyTGltaXQiLCJkb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQiLCJzZXRBbmd1bGFyVXBwZXJMaW1pdCIsImRvZl9lbmFibGVBbmd1bGFyTW90b3IiLCJtb3RvciIsImdldFJvdGF0aW9uYWxMaW1pdE1vdG9yIiwic2V0X21fZW5hYmxlTW90b3IiLCJkb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yIiwic2V0X21fbG9MaW1pdCIsInNldF9tX2hpTGltaXQiLCJzZXRfbV90YXJnZXRWZWxvY2l0eSIsInNldF9tX21heE1vdG9yRm9yY2UiLCJkb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvciIsInJlcG9ydFdvcmxkIiwid29ybGRyZXBvcnQiLCJnZXRDZW50ZXJPZk1hc3NUcmFuc2Zvcm0iLCJvcmlnaW4iLCJnZXRPcmlnaW4iLCJnZXRBbmd1bGFyVmVsb2NpdHkiLCJub2RlcyIsInZlcnQiLCJnZXRfbV9uIiwiZmFjZXMiLCJmYWNlIiwibm9kZTEiLCJub2RlMiIsIm5vZGUzIiwidmVydDEiLCJ2ZXJ0MiIsInZlcnQzIiwibm9ybWFsMSIsIm5vcm1hbDIiLCJub3JtYWwzIiwicmVwb3J0Q29sbGlzaW9ucyIsImRwIiwiZ2V0RGlzcGF0Y2hlciIsIm51bSIsImdldE51bU1hbmlmb2xkcyIsIm1hbmlmb2xkIiwiZ2V0TWFuaWZvbGRCeUluZGV4SW50ZXJuYWwiLCJudW1fY29udGFjdHMiLCJnZXROdW1Db250YWN0cyIsInB0IiwiZ2V0Q29udGFjdFBvaW50IiwiZ2V0Qm9keTAiLCJnZXRCb2R5MSIsImdldF9tX25vcm1hbFdvcmxkT25CIiwiZ2V0TnVtV2hlZWxzIiwiZ2V0V2hlZWxJbmZvIiwiZ2V0X21fd29ybGRUcmFuc2Zvcm0iLCJsZW5naHQiLCJvZmZzZXRfYm9keSIsImdldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCIsIldvcmxkTW9kdWxlIiwiUGh5c2ljc1dvcmtlciIsInRyYW5zZmVyYWJsZU1lc3NhZ2UiLCJyZWplY3QiLCJzZXR1cCIsInByb3BlcnRpZXMiLCJfbmF0aXZlIiwidmVjdG9yMyIsInNjb3BlIiwiZGVmaW5lUHJvcGVydGllcyIsIl94IiwiX3kiLCJfeiIsIl9fY19yb3QiLCJvbkNoYW5nZSIsImV1bGVyIiwicm90Iiwid3JhcFBoeXNpY3NQcm90b3R5cGUiLCJrZXkiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsIm9uQ29weSIsInNvdXJjZVBoeXNpY3MiLCJtb2R1bGVzIiwib25XcmFwIiwiQVBJIiwiZmFjdG9yIiwiaGFzIiwibW9kdWxlIiwicmVzdWx0IiwiY29uc3RydWN0b3IiLCJyaWdpZGJvZHkiLCJCb3hNb2R1bGUiLCJQaHlzaWNzTW9kdWxlIiwidXBkYXRlRGF0YSIsImJvdW5kaW5nQm94IiwiY29tcHV0ZUJvdW5kaW5nQm94IiwibWluIiwiQ29tcG91bmRNb2R1bGUiLCJDYXBzdWxlTW9kdWxlIiwiQ29uY2F2ZU1vZHVsZSIsImdlb21ldHJ5UHJvY2Vzc29yIiwiaXNCdWZmZXJHZW9tZXRyeSIsInZlcnRpY2VzIiwidkEiLCJ2QiIsInZDIiwiYyIsIkNvbmVNb2R1bGUiLCJDb252ZXhNb2R1bGUiLCJfYnVmZmVyR2VvbWV0cnkiLCJCdWZmZXJHZW9tZXRyeSIsImZyb21HZW9tZXRyeSIsIkN5bGluZGVyTW9kdWxlIiwiSGVpZ2h0ZmllbGRNb2R1bGUiLCJWZWN0b3IyIiwieGRpdiIsInlkaXYiLCJ2ZXJ0cyIsInhzaXplIiwieXNpemUiLCJhYnMiLCJ2TnVtIiwicm91bmQiLCJtdWx0aXBseSIsImF1dG9BbGlnbiIsIlBsYW5lTW9kdWxlIiwiU3BoZXJlTW9kdWxlIiwiYm91bmRpbmdTcGhlcmUiLCJjb21wdXRlQm91bmRpbmdTcGhlcmUiLCJTb2Z0Ym9keU1vZHVsZSIsImlkeEdlb21ldHJ5IiwibWVyZ2VWZXJ0aWNlcyIsImJ1ZmZlckdlb21ldHJ5IiwiYWRkQXR0cmlidXRlIiwiQnVmZmVyQXR0cmlidXRlIiwiY29weVZlY3RvcjNzQXJyYXkiLCJzZXRJbmRleCIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJjb3B5SW5kaWNlc0FycmF5IiwibzEiLCJvMiIsImFycmF5TWF4IiwiSW5maW5pdHkiLCJsIiwiQ2xvdGhNb2R1bGUiLCJnZW9tUGFyYW1zIiwiZ2VvbSIsImZhY2VzTGVuZ3RoIiwidXZzIiwiZmFjZVZlcnRleFV2cyIsIm5vcm1hbHNBcnJheSIsInV2c0FycmF5IiwiZmFjZUFycmF5IiwiaTMiLCJ3aWR0aFNlZ21lbnRzIiwiaGVpZ2h0U2VnbWVudHMiLCJpZHgwMCIsImlkeDAxIiwiaWR4MTAiLCJpZHgxMSIsIlJvcGVNb2R1bGUiLCJidWZmIiwiZnJvbUFycmF5IiwibiIsInYxIiwidjIiLCJQSV8yIiwiRmlyc3RQZXJzb25Db250cm9sc1NvbHZlciIsImNhbWVyYSIsInZlbG9jaXR5RmFjdG9yIiwicnVuVmVsb2NpdHkiLCJwbGF5ZXIiLCJwaXRjaE9iamVjdCIsIk9iamVjdDNEIiwieWF3T2JqZWN0IiwieXBvcyIsImNhbkp1bXAiLCJtb3ZlQmFja3dhcmQiLCJtb3ZlTGVmdCIsIm1vdmVSaWdodCIsIm90aGVyT2JqZWN0IiwidiIsInIiLCJjb250YWN0Tm9ybWFsIiwib25Nb3VzZU1vdmUiLCJlbmFibGVkIiwibW92ZW1lbnRYIiwibW96TW92ZW1lbnRYIiwiZ2V0TW92ZW1lbnRYIiwibW92ZW1lbnRZIiwibW96TW92ZW1lbnRZIiwiZ2V0TW92ZW1lbnRZIiwib25LZXlEb3duIiwia2V5Q29kZSIsIm9uS2V5VXAiLCJnZXRPYmplY3QiLCJnZXREaXJlY3Rpb24iLCJtdWx0aXBseVZlY3RvcjMiLCJ0YXJnZXRWZWMiLCJpbnB1dFZlbG9jaXR5IiwiZGVsdGEiLCJzcGVlZCIsIm1vdmVGb3J3YXJkIiwib3JkZXIiLCJhcHBseVF1YXRlcm5pb24iLCJGaXJzdFBlcnNvbk1vZHVsZSIsImJsb2NrIiwiZ2V0RWxlbWVudEJ5SWQiLCJjb250cm9scyIsImVsZW1lbnQiLCJwb2ludGVybG9ja2NoYW5nZSIsInBvaW50ZXJMb2NrRWxlbWVudCIsIm1velBvaW50ZXJMb2NrRWxlbWVudCIsIndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCIsInN0eWxlIiwiZGlzcGxheSIsInBvaW50ZXJsb2NrZXJyb3IiLCJ3YXJuIiwicXVlcnlTZWxlY3RvciIsInJlcXVlc3RQb2ludGVyTG9jayIsIm1velJlcXVlc3RQb2ludGVyTG9jayIsIndlYmtpdFJlcXVlc3RQb2ludGVyTG9jayIsInJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxzY3JlZW4iLCJtb3pSZXF1ZXN0RnVsbFNjcmVlbiIsIndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIiwiZnVsbHNjcmVlbmNoYW5nZSIsImZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsInVwZGF0ZVByb2Nlc3NvciIsInVwZGF0ZUxvb3AiXSwibWFwcGluZ3MiOiI7OztJQU1NQSxnQkFBZ0I7ZUFDUCxDQURPO21CQUVILENBRkc7aUJBR0wsQ0FISztvQkFJRixDQUpFO2NBS1I7Q0FMZDs7QUFRQSxJQUFNQyxrQkFBa0IsRUFBeEI7SUFDRUMsMkJBQTJCLENBRDdCO0lBRUVDLHlCQUF5QixDQUYzQjtJQUdFQyw0QkFBNEIsQ0FIOUI7O0FBS0EsSUFBTUMsZUFBZSxJQUFJQyxTQUFKLEVBQXJCO0lBQ0VDLGVBQWUsSUFBSUQsU0FBSixFQURqQjtJQUVFRSxlQUFlLElBQUlDLE9BQUosRUFGakI7SUFHRUMsWUFBWSxJQUFJQyxVQUFKLEVBSGQ7O0FBS0EsSUFBTUMsNEJBQTRCLFNBQTVCQSx5QkFBNEIsQ0FBQ0MsQ0FBRCxFQUFJQyxDQUFKLEVBQU9DLENBQVAsRUFBVUMsQ0FBVixFQUFnQjtTQUN6QyxJQUFJVixTQUFKLENBQ0xXLEtBQUtDLEtBQUwsQ0FBVyxLQUFLTCxJQUFJRyxDQUFKLEdBQVFGLElBQUlDLENBQWpCLENBQVgsRUFBaUNDLElBQUlBLENBQUosR0FBUUgsSUFBSUEsQ0FBWixHQUFnQkMsSUFBSUEsQ0FBcEIsR0FBd0JDLElBQUlBLENBQTdELENBREssRUFFTEUsS0FBS0UsSUFBTCxDQUFVLEtBQUtOLElBQUlFLENBQUosR0FBUUQsSUFBSUUsQ0FBakIsQ0FBVixDQUZLLEVBR0xDLEtBQUtDLEtBQUwsQ0FBVyxLQUFLSCxJQUFJQyxDQUFKLEdBQVFILElBQUlDLENBQWpCLENBQVgsRUFBaUNFLElBQUlBLENBQUosR0FBUUgsSUFBSUEsQ0FBWixHQUFnQkMsSUFBSUEsQ0FBcEIsR0FBd0JDLElBQUlBLENBQTdELENBSEssQ0FBUDtDQURGOztBQVFBLElBQU1LLHlCQUF5QixTQUF6QkEsc0JBQXlCLENBQUNQLENBQUQsRUFBSUMsQ0FBSixFQUFPQyxDQUFQLEVBQWE7TUFDcENNLEtBQUtKLEtBQUtLLEdBQUwsQ0FBU1IsQ0FBVCxDQUFYO01BQ01TLEtBQUtOLEtBQUtPLEdBQUwsQ0FBU1YsQ0FBVCxDQUFYO01BQ01XLEtBQUtSLEtBQUtLLEdBQUwsQ0FBUyxDQUFDUCxDQUFWLENBQVg7TUFDTVcsS0FBS1QsS0FBS08sR0FBTCxDQUFTLENBQUNULENBQVYsQ0FBWDtNQUNNWSxLQUFLVixLQUFLSyxHQUFMLENBQVNULENBQVQsQ0FBWDtNQUNNZSxLQUFLWCxLQUFLTyxHQUFMLENBQVNYLENBQVQsQ0FBWDtNQUNNZ0IsT0FBT1IsS0FBS0ksRUFBbEI7TUFDTUssT0FBT1AsS0FBS0csRUFBbEI7O1NBRU87T0FDRkcsT0FBT0YsRUFBUCxHQUFZRyxPQUFPRixFQURqQjtPQUVGQyxPQUFPRCxFQUFQLEdBQVlFLE9BQU9ILEVBRmpCO09BR0ZKLEtBQUtFLEVBQUwsR0FBVUUsRUFBVixHQUFlTixLQUFLSyxFQUFMLEdBQVVFLEVBSHZCO09BSUZQLEtBQUtLLEVBQUwsR0FBVUMsRUFBVixHQUFlSixLQUFLRSxFQUFMLEdBQVVHO0dBSjlCO0NBVkY7O0FBa0JBLElBQU1HLCtCQUErQixTQUEvQkEsNEJBQStCLENBQUNDLFFBQUQsRUFBV0MsTUFBWCxFQUFzQjtlQUM1Q0MsUUFBYixHQUR5RDs7O2VBSTVDQSxRQUFiLEdBQXdCQywwQkFBeEIsQ0FBbURGLE9BQU9HLFVBQTFEOzs7ZUFHYUMsVUFBYixDQUF3QjdCLFlBQXhCOzs7ZUFHYThCLElBQWIsQ0FBa0JOLFFBQWxCO2VBQ2FNLElBQWIsQ0FBa0JMLE9BQU9ELFFBQXpCOzs7U0FHTzNCLGFBQWFrQyxHQUFiLENBQWlCaEMsWUFBakIsRUFBK0JpQyxZQUEvQixDQUE0Q2hDLFlBQTVDLENBQVA7Q0FkRjs7QUFpQkEsSUFBTWlDLG9CQUFvQixTQUFwQkEsaUJBQW9CLENBQVVDLE1BQVYsRUFBa0JULE1BQWxCLEVBQTBCO09BQzdDLElBQUlVLElBQUksQ0FBYixFQUFnQkEsSUFBSVYsT0FBT1csUUFBUCxDQUFnQkMsTUFBcEMsRUFBNENGLEdBQTVDLEVBQWlEO1FBQ3pDRyxRQUFRYixPQUFPVyxRQUFQLENBQWdCRCxDQUFoQixDQUFkO1FBQ01JLFVBQVVELE1BQU1FLFNBQU4sR0FBa0JGLE1BQU1FLFNBQU4sQ0FBZ0JDLEdBQWhCLENBQW9CLFNBQXBCLENBQWxCLEdBQW1ELEtBQW5FOztRQUVJRixPQUFKLEVBQWE7VUFDTEcsT0FBT0gsUUFBUUcsSUFBckI7O1lBRU1DLFlBQU47WUFDTUMsaUJBQU47O21CQUVhQyxxQkFBYixDQUFtQ1AsTUFBTVEsV0FBekM7Z0JBQ1VDLHFCQUFWLENBQWdDVCxNQUFNUSxXQUF0Qzs7V0FFS0UsZUFBTCxHQUF1QjtXQUNsQm5ELGFBQWFRLENBREs7V0FFbEJSLGFBQWFTLENBRks7V0FHbEJULGFBQWFVO09BSGxCOztXQU1LMEMsUUFBTCxHQUFnQjtXQUNYL0MsVUFBVUcsQ0FEQztXQUVYSCxVQUFVSSxDQUZDO1dBR1hKLFVBQVVLLENBSEM7V0FJWEwsVUFBVU07T0FKZjs7YUFPT2dDLFNBQVAsQ0FBaUJDLEdBQWpCLENBQXFCLFNBQXJCLEVBQWdDQyxJQUFoQyxDQUFxQ04sUUFBckMsQ0FBOENjLElBQTlDLENBQW1EUixJQUFuRDs7O3NCQUdnQlIsTUFBbEIsRUFBMEJJLEtBQTFCOztDQTlCSjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNuRWFhLFNBQWI7dUJBQ2dCOzs7U0FDUEMsZUFBTCxHQUF1QixFQUF2Qjs7Ozs7cUNBR2VDLFVBTG5CLEVBSytCQyxRQUwvQixFQUt5QztVQUNqQyxDQUFDLEtBQUtGLGVBQUwsQ0FBcUJHLGNBQXJCLENBQW9DRixVQUFwQyxDQUFMLEVBQ0UsS0FBS0QsZUFBTCxDQUFxQkMsVUFBckIsSUFBbUMsRUFBbkM7O1dBRUdELGVBQUwsQ0FBcUJDLFVBQXJCLEVBQWlDSCxJQUFqQyxDQUFzQ0ksUUFBdEM7Ozs7d0NBR2tCRCxVQVp0QixFQVlrQ0MsUUFabEMsRUFZNEM7VUFDcENFLGNBQUo7O1VBRUksQ0FBQyxLQUFLSixlQUFMLENBQXFCRyxjQUFyQixDQUFvQ0YsVUFBcEMsQ0FBTCxFQUFzRCxPQUFPLEtBQVA7O1VBRWxELENBQUNHLFFBQVEsS0FBS0osZUFBTCxDQUFxQkMsVUFBckIsRUFBaUNJLE9BQWpDLENBQXlDSCxRQUF6QyxDQUFULEtBQWdFLENBQXBFLEVBQXVFO2FBQ2hFRixlQUFMLENBQXFCQyxVQUFyQixFQUFpQ0ssTUFBakMsQ0FBd0NGLEtBQXhDLEVBQStDLENBQS9DO2VBQ08sSUFBUDs7O2FBR0ssS0FBUDs7OztrQ0FHWUgsVUF6QmhCLEVBeUI0QjtVQUNwQmxCLFVBQUo7VUFDTXdCLGFBQWFDLE1BQU1DLFNBQU4sQ0FBZ0JILE1BQWhCLENBQXVCSSxJQUF2QixDQUE0QkMsU0FBNUIsRUFBdUMsQ0FBdkMsQ0FBbkI7O1VBRUksS0FBS1gsZUFBTCxDQUFxQkcsY0FBckIsQ0FBb0NGLFVBQXBDLENBQUosRUFBcUQ7YUFDOUNsQixJQUFJLENBQVQsRUFBWUEsSUFBSSxLQUFLaUIsZUFBTCxDQUFxQkMsVUFBckIsRUFBaUNoQixNQUFqRCxFQUF5REYsR0FBekQ7ZUFDT2lCLGVBQUwsQ0FBcUJDLFVBQXJCLEVBQWlDbEIsQ0FBakMsRUFBb0M2QixLQUFwQyxDQUEwQyxJQUExQyxFQUFnREwsVUFBaEQ7Ozs7Ozt5QkFJTU0sR0FuQ2QsRUFtQ21CO1VBQ1hKLFNBQUosQ0FBY0ssZ0JBQWQsR0FBaUNmLFVBQVVVLFNBQVYsQ0FBb0JLLGdCQUFyRDtVQUNJTCxTQUFKLENBQWNNLG1CQUFkLEdBQW9DaEIsVUFBVVUsU0FBVixDQUFvQk0sbUJBQXhEO1VBQ0lOLFNBQUosQ0FBY08sYUFBZCxHQUE4QmpCLFVBQVVVLFNBQVYsQ0FBb0JPLGFBQWxEOzs7Ozs7SUNuQ1NDLG1CQUFiOytCQUNjQyxJQUFaLEVBQWtCQyxJQUFsQixFQUF3Qi9DLFFBQXhCLEVBQWtDOzs7UUFDMUJnRCxVQUFVRixJQUFoQjtRQUNNRyxVQUFVSCxJQUFoQjs7UUFFSTlDLGFBQWFrRCxTQUFqQixFQUE0QkMsUUFBUUMsS0FBUixDQUFjLHdEQUFkOztTQUV2QkMsSUFBTCxHQUFZLFdBQVo7U0FDS0MsY0FBTCxHQUFzQixDQUF0QjtTQUNLQyxXQUFMLEdBQW1CLElBQW5CLENBUmdDO1NBUzNCUCxPQUFMLEdBQWVBLFFBQVEvQixHQUFSLENBQVksU0FBWixFQUF1QkMsSUFBdkIsQ0FBNEJzQyxFQUEzQztTQUNLQyxTQUFMLEdBQWlCMUQsNkJBQTZCQyxRQUE3QixFQUF1Q2dELE9BQXZDLEVBQWdEVSxLQUFoRCxFQUFqQjtTQUNLVCxPQUFMLEdBQWVBLFFBQVFoQyxHQUFSLENBQVksU0FBWixFQUF1QkMsSUFBdkIsQ0FBNEJzQyxFQUEzQztTQUNLRyxTQUFMLEdBQWlCNUQsNkJBQTZCQyxRQUE3QixFQUF1Q2lELE9BQXZDLEVBQWdEUyxLQUFoRCxFQUFqQjtTQUNLRSxLQUFMLEdBQWEsRUFBQy9FLEdBQUdtRSxRQUFRdkIsUUFBUixDQUFpQjVDLENBQXJCLEVBQXdCQyxHQUFHa0UsUUFBUXZCLFFBQVIsQ0FBaUIzQyxDQUE1QyxFQUErQ0MsR0FBR2lFLFFBQVF2QixRQUFSLENBQWlCMUMsQ0FBbkUsRUFBYjtTQUNLOEUsS0FBTCxHQUFhLEVBQUNoRixHQUFHb0UsUUFBUXhCLFFBQVIsQ0FBaUI1QyxDQUFyQixFQUF3QkMsR0FBR21FLFFBQVF4QixRQUFSLENBQWlCM0MsQ0FBNUMsRUFBK0NDLEdBQUdrRSxRQUFReEIsUUFBUixDQUFpQjFDLENBQW5FLEVBQWI7Ozs7O29DQUdjO2FBQ1A7Y0FDQyxLQUFLc0UsSUFETjtZQUVELEtBQUtHLEVBRko7aUJBR0ksS0FBS1IsT0FIVDtpQkFJSSxLQUFLQyxPQUpUO21CQUtNLEtBQUtRLFNBTFg7bUJBTU0sS0FBS0UsU0FOWDtlQU9FLEtBQUtDLEtBUFA7ZUFRRSxLQUFLQztPQVJkOzs7OzZCQVlPaEYsQ0EvQlgsRUErQmNDLENBL0JkLEVBK0JpQkMsQ0EvQmpCLEVBK0JvQjtVQUNiLEtBQUt3RSxXQUFSLEVBQXFCLEtBQUtBLFdBQUwsQ0FBaUJPLE9BQWpCLENBQXlCLG9CQUF6QixFQUErQyxFQUFDQyxZQUFZLEtBQUtQLEVBQWxCLEVBQXNCM0UsSUFBdEIsRUFBeUJDLElBQXpCLEVBQTRCQyxJQUE1QixFQUEvQzs7OztrQ0FHVDtVQUNULEtBQUt3RSxXQUFSLEVBQXFCLEtBQUtBLFdBQUwsQ0FBaUJPLE9BQWpCLENBQXlCLHVCQUF6QixFQUFrRCxFQUFDQyxZQUFZLEtBQUtQLEVBQWxCLEVBQWxEOzs7O3VDQUdKUSxXQXZDckIsRUF1Q2tDO1VBQzNCLEtBQUtULFdBQVIsRUFBcUIsS0FBS0EsV0FBTCxDQUFpQk8sT0FBakIsQ0FBeUIsOEJBQXpCLEVBQXlELEVBQUNDLFlBQVksS0FBS1AsRUFBbEIsRUFBc0JRLHdCQUF0QixFQUF6RDs7OzttQ0FHUkMsTUEzQ2pCLEVBMkN5QjtVQUNqQkEsa0JBQWtCM0YsU0FBdEIsRUFDRTJGLFNBQVMsSUFBSXRGLFVBQUosR0FBaUJ1RixZQUFqQixDQUE4QixJQUFJQyxLQUFKLENBQVVGLE9BQU9wRixDQUFqQixFQUFvQm9GLE9BQU9uRixDQUEzQixFQUE4Qm1GLE9BQU9sRixDQUFyQyxDQUE5QixDQUFULENBREYsS0FFSyxJQUFJa0Ysa0JBQWtCRSxLQUF0QixFQUNIRixTQUFTLElBQUl0RixVQUFKLEdBQWlCdUYsWUFBakIsQ0FBOEJELE1BQTlCLENBQVQsQ0FERyxLQUVBLElBQUlBLGtCQUFrQnhGLE9BQXRCLEVBQ0h3RixTQUFTLElBQUl0RixVQUFKLEdBQWlCNEMscUJBQWpCLENBQXVDMEMsTUFBdkMsQ0FBVDs7VUFFQyxLQUFLVixXQUFSLEVBQXFCLEtBQUtBLFdBQUwsQ0FBaUJPLE9BQWpCLENBQXlCLDBCQUF6QixFQUFxRDtvQkFDNUQsS0FBS04sRUFEdUQ7V0FFckVTLE9BQU9wRixDQUY4RDtXQUdyRW9GLE9BQU9uRixDQUg4RDtXQUlyRW1GLE9BQU9sRixDQUo4RDtXQUtyRWtGLE9BQU9qRjtPQUxTOzs7Ozs7SUNwRFpvRixlQUFiOzJCQUNjdEIsSUFBWixFQUFrQkMsSUFBbEIsRUFBd0IvQyxRQUF4QixFQUFrQ3FFLElBQWxDLEVBQXdDOzs7UUFDaENyQixVQUFVRixJQUFoQjtRQUNJRyxVQUFVRixJQUFkOztRQUVJc0IsU0FBU25CLFNBQWIsRUFBd0I7YUFDZmxELFFBQVA7aUJBQ1dpRCxPQUFYO2dCQUNVQyxTQUFWOzs7U0FHR0csSUFBTCxHQUFZLE9BQVo7U0FDS0MsY0FBTCxHQUFzQixDQUF0QjtTQUNLQyxXQUFMLEdBQW1CLElBQW5CLENBWnNDO1NBYWpDUCxPQUFMLEdBQWVBLFFBQVEvQixHQUFSLENBQVksU0FBWixFQUF1QkMsSUFBdkIsQ0FBNEJzQyxFQUEzQztTQUNLQyxTQUFMLEdBQWlCMUQsNkJBQTZCQyxRQUE3QixFQUF1Q2dELE9BQXZDLEVBQWdEVSxLQUFoRCxFQUFqQjtTQUNLMUQsUUFBTCxHQUFnQkEsU0FBUzBELEtBQVQsRUFBaEI7U0FDS1csSUFBTCxHQUFZQSxJQUFaOztRQUVJcEIsT0FBSixFQUFhO1dBQ05BLE9BQUwsR0FBZUEsUUFBUWhDLEdBQVIsQ0FBWSxTQUFaLEVBQXVCQyxJQUF2QixDQUE0QnNDLEVBQTNDO1dBQ0tHLFNBQUwsR0FBaUI1RCw2QkFBNkJDLFFBQTdCLEVBQXVDaUQsT0FBdkMsRUFBZ0RTLEtBQWhELEVBQWpCOzs7Ozs7b0NBSVk7YUFDUDtjQUNDLEtBQUtMLElBRE47WUFFRCxLQUFLRyxFQUZKO2lCQUdJLEtBQUtSLE9BSFQ7aUJBSUksS0FBS0MsT0FKVDttQkFLTSxLQUFLUSxTQUxYO21CQU1NLEtBQUtFLFNBTlg7Y0FPQyxLQUFLVTtPQVBiOzs7OzhCQVdRQyxHQXJDWixFQXFDaUJDLElBckNqQixFQXFDdUJDLFdBckN2QixFQXFDb0NDLGlCQXJDcEMsRUFxQ3VEO1VBQy9DLEtBQUtsQixXQUFULEVBQXNCLEtBQUtBLFdBQUwsQ0FBaUJPLE9BQWpCLENBQXlCLGlCQUF6QixFQUE0QztvQkFDcEQsS0FBS04sRUFEK0M7Z0JBQUE7a0JBQUE7Z0NBQUE7O09BQTVDOzs7O3VDQVNMa0IsUUEvQ3JCLEVBK0MrQkMsWUEvQy9CLEVBK0M2QztVQUNyQyxLQUFLcEIsV0FBVCxFQUFzQixLQUFLQSxXQUFMLENBQWlCTyxPQUFqQixDQUF5QiwwQkFBekIsRUFBcUQ7b0JBQzdELEtBQUtOLEVBRHdEOzBCQUFBOztPQUFyRDs7OzttQ0FPVDtVQUNULEtBQUtELFdBQVQsRUFBc0IsS0FBS0EsV0FBTCxDQUFpQk8sT0FBakIsQ0FBeUIsb0JBQXpCLEVBQStDLEVBQUNDLFlBQVksS0FBS1AsRUFBbEIsRUFBL0M7Ozs7OztJQ3hEYm9CLGVBQWI7MkJBQ2M5QixJQUFaLEVBQWtCQyxJQUFsQixFQUF3Qi9DLFFBQXhCLEVBQWtDOzs7UUFDMUJnRCxVQUFVRixJQUFoQjtRQUNJRyxVQUFVRixJQUFkOztRQUVJL0MsYUFBYWtELFNBQWpCLEVBQTRCO2lCQUNmRCxPQUFYO2dCQUNVQyxTQUFWOzs7U0FHR0csSUFBTCxHQUFZLE9BQVo7U0FDS0MsY0FBTCxHQUFzQixDQUF0QjtTQUNLTixPQUFMLEdBQWVBLFFBQVEvQixHQUFSLENBQVksU0FBWixFQUF1QkMsSUFBdkIsQ0FBNEJzQyxFQUEzQztTQUNLQyxTQUFMLEdBQWlCMUQsNkJBQTZCQyxRQUE3QixFQUF1Q2dELE9BQXZDLEVBQWdEVSxLQUFoRCxFQUFqQjs7UUFFSVQsT0FBSixFQUFhO1dBQ05BLE9BQUwsR0FBZUEsUUFBUWhDLEdBQVIsQ0FBWSxTQUFaLEVBQXVCQyxJQUF2QixDQUE0QnNDLEVBQTNDO1dBQ0tHLFNBQUwsR0FBaUI1RCw2QkFBNkJDLFFBQTdCLEVBQXVDaUQsT0FBdkMsRUFBZ0RTLEtBQWhELEVBQWpCOzs7Ozs7b0NBSVk7YUFDUDtjQUNDLEtBQUtMLElBRE47WUFFRCxLQUFLRyxFQUZKO2lCQUdJLEtBQUtSLE9BSFQ7aUJBSUksS0FBS0MsT0FKVDttQkFLTSxLQUFLUSxTQUxYO21CQU1NLEtBQUtFO09BTmxCOzs7Ozs7SUN0QlNrQixnQkFBYjs0QkFDYy9CLElBQVosRUFBa0JDLElBQWxCLEVBQXdCL0MsUUFBeEIsRUFBa0NxRSxJQUFsQyxFQUF3Qzs7O1FBQ2hDckIsVUFBVUYsSUFBaEI7UUFDSUcsVUFBVUYsSUFBZDs7UUFFSXNCLFNBQVNuQixTQUFiLEVBQXdCO2FBQ2ZsRCxRQUFQO2lCQUNXaUQsT0FBWDtnQkFDVUMsU0FBVjs7O1NBR0dHLElBQUwsR0FBWSxRQUFaO1NBQ0tDLGNBQUwsR0FBc0IsQ0FBdEI7U0FDS0MsV0FBTCxHQUFtQixJQUFuQixDQVpzQztTQWFqQ1AsT0FBTCxHQUFlQSxRQUFRL0IsR0FBUixDQUFZLFNBQVosRUFBdUJDLElBQXZCLENBQTRCc0MsRUFBM0M7U0FDS0MsU0FBTCxHQUFpQjFELDZCQUE2QkMsUUFBN0IsRUFBdUNnRCxPQUF2QyxFQUFnRFUsS0FBaEQsRUFBakI7U0FDS1csSUFBTCxHQUFZQSxJQUFaOztRQUVJcEIsT0FBSixFQUFhO1dBQ05BLE9BQUwsR0FBZUEsUUFBUWhDLEdBQVIsQ0FBWSxTQUFaLEVBQXVCQyxJQUF2QixDQUE0QnNDLEVBQTNDO1dBQ0tHLFNBQUwsR0FBaUI1RCw2QkFBNkJDLFFBQTdCLEVBQXVDaUQsT0FBdkMsRUFBZ0RTLEtBQWhELEVBQWpCOzs7Ozs7b0NBSVk7YUFDUDtjQUNDLEtBQUtMLElBRE47WUFFRCxLQUFLRyxFQUZKO2lCQUdJLEtBQUtSLE9BSFQ7aUJBSUksS0FBS0MsT0FKVDttQkFLTSxLQUFLUSxTQUxYO21CQU1NLEtBQUtFLFNBTlg7Y0FPQyxLQUFLVTtPQVBiOzs7OzhCQVdRUyxTQXBDWixFQW9DdUJDLFNBcEN2QixFQW9Da0NDLFNBcENsQyxFQW9DNkNDLFNBcEM3QyxFQW9Dd0Q7VUFDaEQsS0FBSzFCLFdBQVQsRUFBc0IsS0FBS0EsV0FBTCxDQUFpQk8sT0FBakIsQ0FBeUIsa0JBQXpCLEVBQTZDO29CQUNyRCxLQUFLTixFQURnRDs0QkFBQTs0QkFBQTs0QkFBQTs7T0FBN0M7Ozs7bUNBU1QwQixNQTlDakIsRUE4Q3lCQyxPQTlDekIsRUE4Q2tDO1VBQzFCLEtBQUs1QixXQUFULEVBQXNCLEtBQUtBLFdBQUwsQ0FBaUJPLE9BQWpCLENBQ3BCLHVCQURvQixFQUVwQjtvQkFDYyxLQUFLTixFQURuQjtzQkFBQTs7T0FGb0I7Ozs7c0NBVU5rQixRQXpEcEIsRUF5RDhCQyxZQXpEOUIsRUF5RDRDO1VBQ3BDLEtBQUtwQixXQUFULEVBQXNCLEtBQUtBLFdBQUwsQ0FBaUJPLE9BQWpCLENBQXlCLDBCQUF6QixFQUFxRDtvQkFDN0QsS0FBS04sRUFEd0Q7MEJBQUE7O09BQXJEOzs7O3lDQU9IO1VBQ2YsS0FBS0QsV0FBVCxFQUFzQixLQUFLQSxXQUFMLENBQWlCTyxPQUFqQixDQUF5QiwyQkFBekIsRUFBc0QsRUFBQ0MsWUFBWSxLQUFLUCxFQUFsQixFQUF0RDs7Ozt1Q0FHTGtCLFFBckVyQixFQXFFK0JDLFlBckUvQixFQXFFNkM7V0FDcENTLEtBQUwsQ0FBV3RCLE9BQVgsQ0FBbUIsMkJBQW5CLEVBQWdEO29CQUNsQyxLQUFLTixFQUQ2QjswQkFBQTs7T0FBaEQ7Ozs7MENBT29CO1VBQ2hCLEtBQUtELFdBQVQsRUFBc0IsS0FBS0EsV0FBTCxDQUFpQk8sT0FBakIsQ0FBeUIsNEJBQXpCLEVBQXVELEVBQUNDLFlBQVksS0FBS1AsRUFBbEIsRUFBdkQ7Ozs7OztJQzlFYjZCLGFBQWI7eUJBQ2N2QyxJQUFaLEVBQWtCQyxJQUFsQixFQUF3Qi9DLFFBQXhCLEVBQWtDOzs7UUFDMUJnRCxVQUFVRixJQUFoQjtRQUNJRyxVQUFVRixJQUFkOztRQUVLL0MsYUFBYWtELFNBQWxCLEVBQThCO2lCQUNqQkQsT0FBWDtnQkFDVUMsU0FBVjs7O1NBR0dHLElBQUwsR0FBWSxLQUFaO1NBQ0tDLGNBQUwsR0FBc0IsQ0FBdEI7U0FDS0MsV0FBTCxHQUFtQixJQUFuQixDQVhnQztTQVkzQlAsT0FBTCxHQUFlQSxRQUFRL0IsR0FBUixDQUFZLFNBQVosRUFBdUJDLElBQXZCLENBQTRCc0MsRUFBM0M7U0FDS0MsU0FBTCxHQUFpQjFELDZCQUE4QkMsUUFBOUIsRUFBd0NnRCxPQUF4QyxFQUFrRFUsS0FBbEQsRUFBakI7U0FDS0UsS0FBTCxHQUFhLEVBQUUvRSxHQUFHbUUsUUFBUXZCLFFBQVIsQ0FBaUI1QyxDQUF0QixFQUF5QkMsR0FBR2tFLFFBQVF2QixRQUFSLENBQWlCM0MsQ0FBN0MsRUFBZ0RDLEdBQUdpRSxRQUFRdkIsUUFBUixDQUFpQjFDLENBQXBFLEVBQWI7O1FBRUtrRSxPQUFMLEVBQWU7V0FDUkEsT0FBTCxHQUFlQSxRQUFRaEMsR0FBUixDQUFZLFNBQVosRUFBdUJDLElBQXZCLENBQTRCc0MsRUFBM0M7V0FDS0csU0FBTCxHQUFpQjVELDZCQUE4QkMsUUFBOUIsRUFBd0NpRCxPQUF4QyxFQUFrRFMsS0FBbEQsRUFBakI7V0FDS0csS0FBTCxHQUFhLEVBQUVoRixHQUFHb0UsUUFBUXhCLFFBQVIsQ0FBaUI1QyxDQUF0QixFQUF5QkMsR0FBR21FLFFBQVF4QixRQUFSLENBQWlCM0MsQ0FBN0MsRUFBZ0RDLEdBQUdrRSxRQUFReEIsUUFBUixDQUFpQjFDLENBQXBFLEVBQWI7Ozs7OztvQ0FJWTthQUNQO2NBQ0MsS0FBS3NFLElBRE47WUFFRCxLQUFLRyxFQUZKO2lCQUdJLEtBQUtSLE9BSFQ7aUJBSUksS0FBS0MsT0FKVDttQkFLTSxLQUFLUSxTQUxYO21CQU1NLEtBQUtFLFNBTlg7ZUFPRSxLQUFLQyxLQVBQO2VBUUUsS0FBS0M7T0FSZDs7Ozt3Q0FZa0J5QixLQXJDdEIsRUFxQzZCO1VBQ3JCLEtBQUsvQixXQUFULEVBQXNCLEtBQUtBLFdBQUwsQ0FBaUJPLE9BQWpCLENBQTBCLHlCQUExQixFQUFxRCxFQUFFQyxZQUFZLEtBQUtQLEVBQW5CLEVBQXVCM0UsR0FBR3lHLE1BQU16RyxDQUFoQyxFQUFtQ0MsR0FBR3dHLE1BQU14RyxDQUE1QyxFQUErQ0MsR0FBR3VHLE1BQU12RyxDQUF4RCxFQUFyRDs7Ozt3Q0FHSHVHLEtBekN2QixFQXlDOEI7VUFDdEIsS0FBSy9CLFdBQVQsRUFBc0IsS0FBS0EsV0FBTCxDQUFpQk8sT0FBakIsQ0FBMEIseUJBQTFCLEVBQXFELEVBQUVDLFlBQVksS0FBS1AsRUFBbkIsRUFBdUIzRSxHQUFHeUcsTUFBTXpHLENBQWhDLEVBQW1DQyxHQUFHd0csTUFBTXhHLENBQTVDLEVBQStDQyxHQUFHdUcsTUFBTXZHLENBQXhELEVBQXJEOzs7O3lDQUdGdUcsS0E3Q3hCLEVBNkMrQjtVQUN2QixLQUFLL0IsV0FBVCxFQUFzQixLQUFLQSxXQUFMLENBQWlCTyxPQUFqQixDQUEwQiwwQkFBMUIsRUFBc0QsRUFBRUMsWUFBWSxLQUFLUCxFQUFuQixFQUF1QjNFLEdBQUd5RyxNQUFNekcsQ0FBaEMsRUFBbUNDLEdBQUd3RyxNQUFNeEcsQ0FBNUMsRUFBK0NDLEdBQUd1RyxNQUFNdkcsQ0FBeEQsRUFBdEQ7Ozs7eUNBR0Z1RyxLQWpEeEIsRUFpRCtCO1VBQ3ZCLEtBQUsvQixXQUFULEVBQXNCLEtBQUtBLFdBQUwsQ0FBaUJPLE9BQWpCLENBQTBCLDBCQUExQixFQUFzRCxFQUFFQyxZQUFZLEtBQUtQLEVBQW5CLEVBQXVCM0UsR0FBR3lHLE1BQU16RyxDQUFoQyxFQUFtQ0MsR0FBR3dHLE1BQU14RyxDQUE1QyxFQUErQ0MsR0FBR3VHLE1BQU12RyxDQUF4RCxFQUF0RDs7Ozt1Q0FHSndHLEtBckR0QixFQXFENkI7VUFDckIsS0FBS2hDLFdBQVQsRUFBc0IsS0FBS0EsV0FBTCxDQUFpQk8sT0FBakIsQ0FBMEIsd0JBQTFCLEVBQW9ELEVBQUVDLFlBQVksS0FBS1AsRUFBbkIsRUFBdUIrQixPQUFPQSxLQUE5QixFQUFwRDs7OzswQ0FHREEsS0F6RHpCLEVBeURnQ0MsU0F6RGhDLEVBeUQyQ0MsVUF6RDNDLEVBeUR1RGYsUUF6RHZELEVBeURpRWdCLFNBekRqRSxFQXlENkU7VUFDckUsS0FBS25DLFdBQVQsRUFBc0IsS0FBS0EsV0FBTCxDQUFpQk8sT0FBakIsQ0FBMEIsMkJBQTFCLEVBQXVELEVBQUVDLFlBQVksS0FBS1AsRUFBbkIsRUFBdUIrQixPQUFPQSxLQUE5QixFQUFxQ0MsV0FBV0EsU0FBaEQsRUFBMkRDLFlBQVlBLFVBQXZFLEVBQW1GZixVQUFVQSxRQUE3RixFQUF1R2dCLFdBQVdBLFNBQWxILEVBQXZEOzs7O3dDQUdISCxLQTdEdkIsRUE2RDhCO1VBQ3RCLEtBQUtoQyxXQUFULEVBQXNCLEtBQUtBLFdBQUwsQ0FBaUJPLE9BQWpCLENBQTBCLHlCQUExQixFQUFxRCxFQUFFQyxZQUFZLEtBQUtQLEVBQW5CLEVBQXVCK0IsT0FBT0EsS0FBOUIsRUFBckQ7Ozs7OztJQzdEYkksT0FBYjttQkFDY0MsSUFBWixFQUFnRDtRQUE5QkMsTUFBOEIsdUVBQXJCLElBQUlDLGFBQUosRUFBcUI7OztTQUN6Q0YsSUFBTCxHQUFZQSxJQUFaO1NBQ0tHLE1BQUwsR0FBYyxFQUFkOztTQUVLQyxRQUFMLEdBQWdCO1VBQ1ZDLGFBRFU7aUJBRUhMLEtBQUtJLFFBQUwsQ0FBY3hDLEVBRlg7NEJBR1FxQyxPQUFPSyxvQkFIZjs4QkFJVUwsT0FBT00sc0JBSmpCOzBCQUtNTixPQUFPTyxrQkFMYjs2QkFNU1AsT0FBT1EscUJBTmhCO3FCQU9DUixPQUFPUyxhQVBSOzRCQVFRVCxPQUFPVTtLQVIvQjs7Ozs7NkJBWU9DLGNBakJYLEVBaUIyQkMsY0FqQjNCLEVBaUIyQ0MsZ0JBakIzQyxFQWlCNkRDLGVBakI3RCxFQWlCOEVDLFVBakI5RSxFQWlCMEZDLHNCQWpCMUYsRUFpQmtIQyxZQWpCbEgsRUFpQmdJQyxjQWpCaEksRUFpQmdKbEIsTUFqQmhKLEVBaUJ3SjtVQUM5SW1CLFFBQVEsSUFBSUMsSUFBSixDQUFTVCxjQUFULEVBQXlCQyxjQUF6QixDQUFkOztZQUVNUyxVQUFOLEdBQW1CRixNQUFNRyxhQUFOLEdBQXNCLElBQXpDO1lBQ01uSCxRQUFOLENBQWVNLElBQWYsQ0FBb0JxRyxlQUFwQixFQUFxQ1MsY0FBckMsQ0FBb0RQLHlCQUF5QixHQUE3RSxFQUFrRlEsR0FBbEYsQ0FBc0ZYLGdCQUF0Rjs7V0FFS1ksS0FBTCxDQUFXRCxHQUFYLENBQWVMLEtBQWY7V0FDS2pCLE1BQUwsQ0FBWXJFLElBQVosQ0FBaUJzRixLQUFqQjs7V0FFS00sS0FBTCxDQUFXeEQsT0FBWCxDQUFtQixVQUFuQixFQUErQjtZQUN6QixLQUFLa0MsUUFBTCxDQUFjeEMsRUFEVzswQkFFWCxFQUFDM0UsR0FBRzZILGlCQUFpQjdILENBQXJCLEVBQXdCQyxHQUFHNEgsaUJBQWlCNUgsQ0FBNUMsRUFBK0NDLEdBQUcySCxpQkFBaUIzSCxDQUFuRSxFQUZXO3lCQUdaLEVBQUNGLEdBQUc4SCxnQkFBZ0I5SCxDQUFwQixFQUF1QkMsR0FBRzZILGdCQUFnQjdILENBQTFDLEVBQTZDQyxHQUFHNEgsZ0JBQWdCNUgsQ0FBaEUsRUFIWTtvQkFJakIsRUFBQ0YsR0FBRytILFdBQVcvSCxDQUFmLEVBQWtCQyxHQUFHOEgsV0FBVzlILENBQWhDLEVBQW1DQyxHQUFHNkgsV0FBVzdILENBQWpELEVBSmlCO3NEQUFBO2tDQUFBO3NDQUFBOztPQUEvQjs7OztnQ0FZVXdJLE1BdENkLEVBc0NzQlAsS0F0Q3RCLEVBc0M2QjtVQUNyQkEsVUFBVTlELFNBQVYsSUFBdUIsS0FBSzZDLE1BQUwsQ0FBWWlCLEtBQVosTUFBdUI5RCxTQUFsRCxFQUNFLEtBQUtvRSxLQUFMLENBQVd4RCxPQUFYLENBQW1CLGFBQW5CLEVBQWtDLEVBQUNOLElBQUksS0FBS3dDLFFBQUwsQ0FBY3hDLEVBQW5CLEVBQXVCd0QsWUFBdkIsRUFBOEJRLFVBQVVELE1BQXhDLEVBQWxDLEVBREYsS0FFSyxJQUFJLEtBQUt4QixNQUFMLENBQVlsRixNQUFaLEdBQXFCLENBQXpCLEVBQTRCO2FBQzFCLElBQUlGLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLb0YsTUFBTCxDQUFZbEYsTUFBaEMsRUFBd0NGLEdBQXhDO2VBQ08yRyxLQUFMLENBQVd4RCxPQUFYLENBQW1CLGFBQW5CLEVBQWtDLEVBQUNOLElBQUksS0FBS3dDLFFBQUwsQ0FBY3hDLEVBQW5CLEVBQXVCd0QsT0FBT3JHLENBQTlCLEVBQWlDNkcsVUFBVUQsTUFBM0MsRUFBbEM7Ozs7Ozs2QkFJR0EsTUEvQ1gsRUErQ21CUCxLQS9DbkIsRUErQzBCO1VBQ2xCQSxVQUFVOUQsU0FBVixJQUF1QixLQUFLNkMsTUFBTCxDQUFZaUIsS0FBWixNQUF1QjlELFNBQWxELEVBQ0UsS0FBS29FLEtBQUwsQ0FBV3hELE9BQVgsQ0FBbUIsVUFBbkIsRUFBK0IsRUFBQ04sSUFBSSxLQUFLd0MsUUFBTCxDQUFjeEMsRUFBbkIsRUFBdUJ3RCxZQUF2QixFQUE4QlMsT0FBT0YsTUFBckMsRUFBL0IsRUFERixLQUVLLElBQUksS0FBS3hCLE1BQUwsQ0FBWWxGLE1BQVosR0FBcUIsQ0FBekIsRUFBNEI7YUFDMUIsSUFBSUYsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtvRixNQUFMLENBQVlsRixNQUFoQyxFQUF3Q0YsR0FBeEM7ZUFDTzJHLEtBQUwsQ0FBV3hELE9BQVgsQ0FBbUIsVUFBbkIsRUFBK0IsRUFBQ04sSUFBSSxLQUFLd0MsUUFBTCxDQUFjeEMsRUFBbkIsRUFBdUJ3RCxPQUFPckcsQ0FBOUIsRUFBaUM4RyxPQUFPRixNQUF4QyxFQUEvQjs7Ozs7O3FDQUlXQSxNQXhEbkIsRUF3RDJCUCxLQXhEM0IsRUF3RGtDO1VBQzFCQSxVQUFVOUQsU0FBVixJQUF1QixLQUFLNkMsTUFBTCxDQUFZaUIsS0FBWixNQUF1QjlELFNBQWxELEVBQ0UsS0FBS29FLEtBQUwsQ0FBV3hELE9BQVgsQ0FBbUIsa0JBQW5CLEVBQXVDLEVBQUNOLElBQUksS0FBS3dDLFFBQUwsQ0FBY3hDLEVBQW5CLEVBQXVCd0QsWUFBdkIsRUFBOEJVLE9BQU9ILE1BQXJDLEVBQXZDLEVBREYsS0FFSyxJQUFJLEtBQUt4QixNQUFMLENBQVlsRixNQUFaLEdBQXFCLENBQXpCLEVBQTRCO2FBQzFCLElBQUlGLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLb0YsTUFBTCxDQUFZbEYsTUFBaEMsRUFBd0NGLEdBQXhDO2VBQ08yRyxLQUFMLENBQVd4RCxPQUFYLENBQW1CLGtCQUFuQixFQUF1QyxFQUFDTixJQUFJLEtBQUt3QyxRQUFMLENBQWN4QyxFQUFuQixFQUF1QndELE9BQU9yRyxDQUE5QixFQUFpQytHLE9BQU9ILE1BQXhDLEVBQXZDOzs7Ozs7Ozs7O0lDdkNhSTs7OzJCQVNQQyxPQUFaLEVBQXFCOzs7OztVQTZtQnJCQyxNQTdtQnFCLEdBNm1CWjtXQUFBLGlCQUNEN0csU0FEQyxFQUNVOEcsSUFEVixFQUNnQjtZQUNqQjlHLFVBQVVDLEdBQVYsQ0FBYyxTQUFkLENBQUosRUFBOEIsT0FBTzZHLEtBQUtDLEtBQUwsQ0FBV0QsS0FBS0UsYUFBTCxDQUFtQkMsSUFBbkIsQ0FBd0JILElBQXhCLENBQVgsRUFBMEMsQ0FBQzlHLFNBQUQsQ0FBMUMsQ0FBUDs7T0FGekI7Y0FBQSxvQkFNRUEsU0FORixFQU1hOEcsSUFOYixFQU1tQjtZQUNwQjlHLFVBQVVDLEdBQVYsQ0FBYyxTQUFkLENBQUosRUFBOEIsT0FBTzZHLEtBQUtDLEtBQUwsQ0FBV0QsS0FBS0ksZ0JBQUwsQ0FBc0JELElBQXRCLENBQTJCSCxJQUEzQixDQUFYLEVBQTZDLENBQUM5RyxTQUFELENBQTdDLENBQVA7OztLQXBuQmI7OztVQUdkNEcsT0FBTCxHQUFlTyxPQUFPQyxNQUFQLENBQWNULGdCQUFnQlUsUUFBOUIsRUFBd0NULE9BQXhDLENBQWY7O1VBRUtVLE9BQUwsR0FBZSxFQUFmO1VBQ0tDLFFBQUwsR0FBZ0IsRUFBaEI7VUFDS0MsV0FBTCxHQUFtQixFQUFuQjtVQUNLQyxZQUFMLEdBQW9CLEtBQXBCOztVQUVLeEMsV0FBTCxHQUFvQixZQUFNO1VBQ3BCekMsS0FBSyxDQUFUO2FBQ08sWUFBTTtlQUNKQSxJQUFQO09BREY7S0FGaUIsRUFBbkI7Ozs7Ozs0QkFRTTs7O1dBQ0RrRixPQUFMLENBQWEsaUJBQVM7WUFDaEJDLGNBQUo7WUFDRXpILE9BQU8wSCxNQUFNMUgsSUFEZjs7WUFHSUEsZ0JBQWdCMkgsV0FBaEIsSUFBK0IzSCxLQUFLNEgsVUFBTCxLQUFvQixDQUF2RDtpQkFDUyxJQUFJQyxZQUFKLENBQWlCN0gsSUFBakIsQ0FBUDs7WUFFRUEsZ0JBQWdCNkgsWUFBcEIsRUFBa0M7O2tCQUV4QjdILEtBQUssQ0FBTCxDQUFSO2lCQUNPbEQsY0FBY2dMLFdBQW5CO3FCQUNPQyxXQUFMLENBQWlCL0gsSUFBakI7OztpQkFHR2xELGNBQWNrTCxVQUFuQjtxQkFDT0MsZ0JBQUwsQ0FBc0JqSSxJQUF0Qjs7O2lCQUdHbEQsY0FBY29MLGVBQW5CO3FCQUNPQyxnQkFBTCxDQUFzQm5JLElBQXRCOzs7aUJBR0dsRCxjQUFjc0wsYUFBbkI7cUJBQ09DLGNBQUwsQ0FBb0JySSxJQUFwQjs7O2lCQUdHbEQsY0FBY3dMLGdCQUFuQjtxQkFDT0MsaUJBQUwsQ0FBdUJ2SSxJQUF2Qjs7OztTQXBCTixNQXdCTyxJQUFJQSxLQUFLd0ksR0FBVCxFQUFjOztrQkFFWHhJLEtBQUt3SSxHQUFiO2lCQUNPLGFBQUw7c0JBQ1V4SSxLQUFLeUksTUFBYjtrQkFDSSxPQUFLckIsT0FBTCxDQUFhSyxLQUFiLENBQUosRUFBeUIsT0FBS0wsT0FBTCxDQUFhSyxLQUFiLEVBQW9CL0YsYUFBcEIsQ0FBa0MsT0FBbEM7OztpQkFHdEIsWUFBTDtxQkFDT0EsYUFBTCxDQUFtQixPQUFuQjs7O2lCQUdHLFlBQUw7cUJBQ09BLGFBQUwsQ0FBbUIsUUFBbkI7Ozs7aUJBSUcsU0FBTDtxQkFDU2dILElBQVAsR0FBYzFJLElBQWQ7Ozs7O3NCQUtRMkksS0FBUixnQkFBMkIzSSxLQUFLd0ksR0FBaEM7c0JBQ1FJLEdBQVIsQ0FBWTVJLEtBQUt5SSxNQUFqQjs7O1NBeEJDLE1BMkJBO2tCQUNHekksS0FBSyxDQUFMLENBQVI7aUJBQ09sRCxjQUFjZ0wsV0FBbkI7cUJBQ09DLFdBQUwsQ0FBaUIvSCxJQUFqQjs7O2lCQUdHbEQsY0FBY29MLGVBQW5CO3FCQUNPQyxnQkFBTCxDQUFzQm5JLElBQXRCOzs7aUJBR0dsRCxjQUFjc0wsYUFBbkI7cUJBQ09DLGNBQUwsQ0FBb0JySSxJQUFwQjs7O2lCQUdHbEQsY0FBY3dMLGdCQUFuQjtxQkFDT0MsaUJBQUwsQ0FBdUJ2SSxJQUF2Qjs7Ozs7T0F6RVI7Ozs7Z0NBaUZVNkksTUFBTTtVQUNaL0gsUUFBUStILEtBQUssQ0FBTCxDQUFaOzthQUVPL0gsT0FBUCxFQUFnQjtZQUNSZ0ksU0FBUyxJQUFJaEksUUFBUS9ELGVBQTNCO1lBQ01nQyxTQUFTLEtBQUtxSSxPQUFMLENBQWF5QixLQUFLQyxNQUFMLENBQWIsQ0FBZjtZQUNNaEosWUFBWWYsT0FBT2UsU0FBekI7WUFDTUUsT0FBT0YsVUFBVUMsR0FBVixDQUFjLFNBQWQsRUFBeUJDLElBQXRDOztZQUVJakIsV0FBVyxJQUFmLEVBQXFCOztZQUVqQmUsVUFBVWlKLGVBQVYsS0FBOEIsS0FBbEMsRUFBeUM7aUJBQ2hDakssUUFBUCxDQUFnQmtLLEdBQWhCLENBQ0VILEtBQUtDLFNBQVMsQ0FBZCxDQURGLEVBRUVELEtBQUtDLFNBQVMsQ0FBZCxDQUZGLEVBR0VELEtBQUtDLFNBQVMsQ0FBZCxDQUhGOztvQkFNVUMsZUFBVixHQUE0QixLQUE1Qjs7O1lBR0VqSixVQUFVbUosZUFBVixLQUE4QixLQUFsQyxFQUF5QztpQkFDaEMvSixVQUFQLENBQWtCOEosR0FBbEIsQ0FDRUgsS0FBS0MsU0FBUyxDQUFkLENBREYsRUFFRUQsS0FBS0MsU0FBUyxDQUFkLENBRkYsRUFHRUQsS0FBS0MsU0FBUyxDQUFkLENBSEYsRUFJRUQsS0FBS0MsU0FBUyxDQUFkLENBSkY7O29CQU9VRyxlQUFWLEdBQTRCLEtBQTVCOzs7YUFHR0MsY0FBTCxDQUFvQkYsR0FBcEIsQ0FDRUgsS0FBS0MsU0FBUyxDQUFkLENBREYsRUFFRUQsS0FBS0MsU0FBUyxDQUFkLENBRkYsRUFHRUQsS0FBS0MsU0FBUyxFQUFkLENBSEY7O2FBTUtLLGVBQUwsQ0FBcUJILEdBQXJCLENBQ0VILEtBQUtDLFNBQVMsRUFBZCxDQURGLEVBRUVELEtBQUtDLFNBQVMsRUFBZCxDQUZGLEVBR0VELEtBQUtDLFNBQVMsRUFBZCxDQUhGOzs7VUFPRSxLQUFLTSxvQkFBVCxFQUNFLEtBQUtDLElBQUwsQ0FBVVIsS0FBS1MsTUFBZixFQUF1QixDQUFDVCxLQUFLUyxNQUFOLENBQXZCLEVBOUNjOztXQWdEWC9CLFlBQUwsR0FBb0IsS0FBcEI7V0FDSzdGLGFBQUwsQ0FBbUIsUUFBbkI7Ozs7cUNBR2VtSCxNQUFNO1VBQ2pCL0gsUUFBUStILEtBQUssQ0FBTCxDQUFaO1VBQ0VDLFNBQVMsQ0FEWDs7YUFHT2hJLE9BQVAsRUFBZ0I7WUFDUnlJLE9BQU9WLEtBQUtDLFNBQVMsQ0FBZCxDQUFiO1lBQ00vSixTQUFTLEtBQUtxSSxPQUFMLENBQWF5QixLQUFLQyxNQUFMLENBQWIsQ0FBZjs7WUFFSS9KLFdBQVcsSUFBZixFQUFxQjs7WUFFZmlCLE9BQU9qQixPQUFPZSxTQUFQLENBQWlCQyxHQUFqQixDQUFxQixTQUFyQixFQUFnQ0MsSUFBN0M7O1lBRU13SixhQUFhekssT0FBTzBLLFFBQVAsQ0FBZ0JELFVBQW5DO1lBQ01FLGtCQUFrQkYsV0FBVzFLLFFBQVgsQ0FBb0I2SyxLQUE1Qzs7WUFFTUMsYUFBYWQsU0FBUyxDQUE1Qjs7O1lBR0ksQ0FBQzlJLEtBQUs2SixlQUFWLEVBQTJCO2lCQUNsQi9LLFFBQVAsQ0FBZ0JrSyxHQUFoQixDQUFvQixDQUFwQixFQUF1QixDQUF2QixFQUEwQixDQUExQjtpQkFDTzlKLFVBQVAsQ0FBa0I4SixHQUFsQixDQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixFQUErQixDQUEvQjs7ZUFFS2EsZUFBTCxHQUF1QixJQUF2Qjs7O1lBR0U3SixLQUFLbUMsSUFBTCxLQUFjLGFBQWxCLEVBQWlDO2NBQ3pCMkgsZ0JBQWdCTixXQUFXTyxNQUFYLENBQWtCSixLQUF4Qzs7ZUFFSyxJQUFJbEssSUFBSSxDQUFiLEVBQWdCQSxJQUFJOEosSUFBcEIsRUFBMEI5SixHQUExQixFQUErQjtnQkFDdkJ1SyxPQUFPSixhQUFhbkssSUFBSSxFQUE5Qjs7Z0JBRU13SyxLQUFLcEIsS0FBS21CLElBQUwsQ0FBWDtnQkFDTUUsS0FBS3JCLEtBQUttQixPQUFPLENBQVosQ0FBWDtnQkFDTUcsS0FBS3RCLEtBQUttQixPQUFPLENBQVosQ0FBWDs7Z0JBRU1JLE1BQU12QixLQUFLbUIsT0FBTyxDQUFaLENBQVo7Z0JBQ01LLE1BQU14QixLQUFLbUIsT0FBTyxDQUFaLENBQVo7Z0JBQ01NLE1BQU16QixLQUFLbUIsT0FBTyxDQUFaLENBQVo7O2dCQUVNTyxLQUFLMUIsS0FBS21CLE9BQU8sQ0FBWixDQUFYO2dCQUNNUSxLQUFLM0IsS0FBS21CLE9BQU8sQ0FBWixDQUFYO2dCQUNNUyxLQUFLNUIsS0FBS21CLE9BQU8sQ0FBWixDQUFYOztnQkFFTVUsTUFBTTdCLEtBQUttQixPQUFPLENBQVosQ0FBWjtnQkFDTVcsTUFBTTlCLEtBQUttQixPQUFPLEVBQVosQ0FBWjtnQkFDTVksTUFBTS9CLEtBQUttQixPQUFPLEVBQVosQ0FBWjs7Z0JBRU1hLEtBQUtoQyxLQUFLbUIsT0FBTyxFQUFaLENBQVg7Z0JBQ01jLEtBQUtqQyxLQUFLbUIsT0FBTyxFQUFaLENBQVg7Z0JBQ01lLEtBQUtsQyxLQUFLbUIsT0FBTyxFQUFaLENBQVg7O2dCQUVNZ0IsTUFBTW5DLEtBQUttQixPQUFPLEVBQVosQ0FBWjtnQkFDTWlCLE1BQU1wQyxLQUFLbUIsT0FBTyxFQUFaLENBQVo7Z0JBQ01rQixNQUFNckMsS0FBS21CLE9BQU8sRUFBWixDQUFaOztnQkFFTW1CLEtBQUsxTCxJQUFJLENBQWY7OzRCQUVnQjBMLEVBQWhCLElBQXNCbEIsRUFBdEI7NEJBQ2dCa0IsS0FBSyxDQUFyQixJQUEwQmpCLEVBQTFCOzRCQUNnQmlCLEtBQUssQ0FBckIsSUFBMEJoQixFQUExQjs7NEJBRWdCZ0IsS0FBSyxDQUFyQixJQUEwQlosRUFBMUI7NEJBQ2dCWSxLQUFLLENBQXJCLElBQTBCWCxFQUExQjs0QkFDZ0JXLEtBQUssQ0FBckIsSUFBMEJWLEVBQTFCOzs0QkFFZ0JVLEtBQUssQ0FBckIsSUFBMEJOLEVBQTFCOzRCQUNnQk0sS0FBSyxDQUFyQixJQUEwQkwsRUFBMUI7NEJBQ2dCSyxLQUFLLENBQXJCLElBQTBCSixFQUExQjs7MEJBRWNJLEVBQWQsSUFBb0JmLEdBQXBCOzBCQUNjZSxLQUFLLENBQW5CLElBQXdCZCxHQUF4QjswQkFDY2MsS0FBSyxDQUFuQixJQUF3QmIsR0FBeEI7OzBCQUVjYSxLQUFLLENBQW5CLElBQXdCVCxHQUF4QjswQkFDY1MsS0FBSyxDQUFuQixJQUF3QlIsR0FBeEI7MEJBQ2NRLEtBQUssQ0FBbkIsSUFBd0JQLEdBQXhCOzswQkFFY08sS0FBSyxDQUFuQixJQUF3QkgsR0FBeEI7MEJBQ2NHLEtBQUssQ0FBbkIsSUFBd0JGLEdBQXhCOzBCQUNjRSxLQUFLLENBQW5CLElBQXdCRCxHQUF4Qjs7O3FCQUdTbkIsTUFBWCxDQUFrQnFCLFdBQWxCLEdBQWdDLElBQWhDO29CQUNVLElBQUk3QixPQUFPLEVBQXJCO1NBMURGLE1BNERLLElBQUl2SixLQUFLbUMsSUFBTCxLQUFjLGNBQWxCLEVBQWtDO2VBQ2hDLElBQUkxQyxLQUFJLENBQWIsRUFBZ0JBLEtBQUk4SixJQUFwQixFQUEwQjlKLElBQTFCLEVBQStCO2dCQUN2QnVLLFFBQU9KLGFBQWFuSyxLQUFJLENBQTlCOztnQkFFTTlCLElBQUlrTCxLQUFLbUIsS0FBTCxDQUFWO2dCQUNNcE0sSUFBSWlMLEtBQUttQixRQUFPLENBQVosQ0FBVjtnQkFDTW5NLElBQUlnTCxLQUFLbUIsUUFBTyxDQUFaLENBQVY7OzRCQUVnQnZLLEtBQUksQ0FBcEIsSUFBeUI5QixDQUF6Qjs0QkFDZ0I4QixLQUFJLENBQUosR0FBUSxDQUF4QixJQUE2QjdCLENBQTdCOzRCQUNnQjZCLEtBQUksQ0FBSixHQUFRLENBQXhCLElBQTZCNUIsQ0FBN0I7OztvQkFHUSxJQUFJMEwsT0FBTyxDQUFyQjtTQWJHLE1BY0U7Y0FDQ08saUJBQWdCTixXQUFXTyxNQUFYLENBQWtCSixLQUF4Qzs7ZUFFSyxJQUFJbEssTUFBSSxDQUFiLEVBQWdCQSxNQUFJOEosSUFBcEIsRUFBMEI5SixLQUExQixFQUErQjtnQkFDdkJ1SyxTQUFPSixhQUFhbkssTUFBSSxDQUE5Qjs7Z0JBRU05QixLQUFJa0wsS0FBS21CLE1BQUwsQ0FBVjtnQkFDTXBNLEtBQUlpTCxLQUFLbUIsU0FBTyxDQUFaLENBQVY7Z0JBQ01uTSxLQUFJZ0wsS0FBS21CLFNBQU8sQ0FBWixDQUFWOztnQkFFTXFCLEtBQUt4QyxLQUFLbUIsU0FBTyxDQUFaLENBQVg7Z0JBQ01zQixLQUFLekMsS0FBS21CLFNBQU8sQ0FBWixDQUFYO2dCQUNNdUIsS0FBSzFDLEtBQUttQixTQUFPLENBQVosQ0FBWDs7NEJBRWdCdkssTUFBSSxDQUFwQixJQUF5QjlCLEVBQXpCOzRCQUNnQjhCLE1BQUksQ0FBSixHQUFRLENBQXhCLElBQTZCN0IsRUFBN0I7NEJBQ2dCNkIsTUFBSSxDQUFKLEdBQVEsQ0FBeEIsSUFBNkI1QixFQUE3Qjs7OzJCQUdjNEIsTUFBSSxDQUFsQixJQUF1QjRMLEVBQXZCOzJCQUNjNUwsTUFBSSxDQUFKLEdBQVEsQ0FBdEIsSUFBMkI2TCxFQUEzQjsyQkFDYzdMLE1BQUksQ0FBSixHQUFRLENBQXRCLElBQTJCOEwsRUFBM0I7OztxQkFHU3hCLE1BQVgsQ0FBa0JxQixXQUFsQixHQUFnQyxJQUFoQztvQkFDVSxJQUFJN0IsT0FBTyxDQUFyQjs7O21CQUdTekssUUFBWCxDQUFvQnNNLFdBQXBCLEdBQWtDLElBQWxDOzs7Ozs7V0FNRzdELFlBQUwsR0FBb0IsS0FBcEI7Ozs7bUNBR2F2SCxNQUFNO1VBQ2Z3TCxnQkFBSjtVQUFhMUYsY0FBYjs7V0FFSyxJQUFJckcsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLENBQUNPLEtBQUtMLE1BQUwsR0FBYyxDQUFmLElBQW9CMUMsc0JBQXhDLEVBQWdFd0MsR0FBaEUsRUFBcUU7WUFDN0RxSixTQUFTLElBQUlySixJQUFJeEMsc0JBQXZCO2tCQUNVLEtBQUtvSyxRQUFMLENBQWNySCxLQUFLOEksTUFBTCxDQUFkLENBQVY7O1lBRUkwQyxZQUFZLElBQWhCLEVBQXNCOztnQkFFZEEsUUFBUTNHLE1BQVIsQ0FBZTdFLEtBQUs4SSxTQUFTLENBQWQsQ0FBZixDQUFSOztjQUVNaEssUUFBTixDQUFla0ssR0FBZixDQUNFaEosS0FBSzhJLFNBQVMsQ0FBZCxDQURGLEVBRUU5SSxLQUFLOEksU0FBUyxDQUFkLENBRkYsRUFHRTlJLEtBQUs4SSxTQUFTLENBQWQsQ0FIRjs7Y0FNTTVKLFVBQU4sQ0FBaUI4SixHQUFqQixDQUNFaEosS0FBSzhJLFNBQVMsQ0FBZCxDQURGLEVBRUU5SSxLQUFLOEksU0FBUyxDQUFkLENBRkYsRUFHRTlJLEtBQUs4SSxTQUFTLENBQWQsQ0FIRixFQUlFOUksS0FBSzhJLFNBQVMsQ0FBZCxDQUpGOzs7VUFRRSxLQUFLTSxvQkFBVCxFQUNFLEtBQUtDLElBQUwsQ0FBVXJKLEtBQUtzSixNQUFmLEVBQXVCLENBQUN0SixLQUFLc0osTUFBTixDQUF2QixFQTFCaUI7Ozs7c0NBNkJIdEosTUFBTTtVQUNsQjZDLG1CQUFKO1VBQWdCOUQsZUFBaEI7O1dBRUssSUFBSVUsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLENBQUNPLEtBQUtMLE1BQUwsR0FBYyxDQUFmLElBQW9CekMseUJBQXhDLEVBQW1FdUMsR0FBbkUsRUFBd0U7WUFDaEVxSixTQUFTLElBQUlySixJQUFJdkMseUJBQXZCO3FCQUNhLEtBQUtvSyxXQUFMLENBQWlCdEgsS0FBSzhJLE1BQUwsQ0FBakIsQ0FBYjtpQkFDUyxLQUFLMUIsT0FBTCxDQUFhcEgsS0FBSzhJLFNBQVMsQ0FBZCxDQUFiLENBQVQ7O1lBRUlqRyxlQUFlYixTQUFmLElBQTRCakQsV0FBV2lELFNBQTNDLEVBQXNEOztxQkFFekNnSCxHQUFiLENBQ0VoSixLQUFLOEksU0FBUyxDQUFkLENBREYsRUFFRTlJLEtBQUs4SSxTQUFTLENBQWQsQ0FGRixFQUdFOUksS0FBSzhJLFNBQVMsQ0FBZCxDQUhGOztxQkFNYTJDLGVBQWIsQ0FBNkIxTSxPQUFPMk0sTUFBcEM7cUJBQ2FwTSxZQUFiLENBQTBCaEMsWUFBMUI7O21CQUVXaUYsU0FBWCxDQUFxQm9KLFVBQXJCLENBQWdDNU0sT0FBT0QsUUFBdkMsRUFBaUQzQixZQUFqRDttQkFDV2lGLGNBQVgsR0FBNEJwQyxLQUFLOEksU0FBUyxDQUFkLENBQTVCOzs7VUFHRSxLQUFLTSxvQkFBVCxFQUNFLEtBQUtDLElBQUwsQ0FBVXJKLEtBQUtzSixNQUFmLEVBQXVCLENBQUN0SixLQUFLc0osTUFBTixDQUF2QixFQXhCb0I7Ozs7cUNBMkJQVCxNQUFNOzs7Ozs7Ozs7VUFTZitDLGFBQWEsRUFBbkI7VUFDRUMsaUJBQWlCLEVBRG5COzs7V0FJSyxJQUFJcE0sSUFBSSxDQUFiLEVBQWdCQSxJQUFJb0osS0FBSyxDQUFMLENBQXBCLEVBQTZCcEosR0FBN0IsRUFBa0M7WUFDMUJxSixTQUFTLElBQUlySixJQUFJekMsd0JBQXZCO1lBQ00rQixTQUFTOEosS0FBS0MsTUFBTCxDQUFmO1lBQ01nRCxVQUFVakQsS0FBS0MsU0FBUyxDQUFkLENBQWhCOzt1QkFFa0IvSixNQUFsQixTQUE0QitNLE9BQTVCLElBQXlDaEQsU0FBUyxDQUFsRDt1QkFDa0JnRCxPQUFsQixTQUE2Qi9NLE1BQTdCLElBQXlDLENBQUMsQ0FBRCxJQUFNK0osU0FBUyxDQUFmLENBQXpDOzs7WUFHSSxDQUFDOEMsV0FBVzdNLE1BQVgsQ0FBTCxFQUF5QjZNLFdBQVc3TSxNQUFYLElBQXFCLEVBQXJCO21CQUNkQSxNQUFYLEVBQW1CeUIsSUFBbkIsQ0FBd0JzTCxPQUF4Qjs7WUFFSSxDQUFDRixXQUFXRSxPQUFYLENBQUwsRUFBMEJGLFdBQVdFLE9BQVgsSUFBc0IsRUFBdEI7bUJBQ2ZBLE9BQVgsRUFBb0J0TCxJQUFwQixDQUF5QnpCLE1BQXpCOzs7O1dBSUcsSUFBTWdOLEdBQVgsSUFBa0IsS0FBSzNFLE9BQXZCLEVBQWdDO1lBQzFCLENBQUMsS0FBS0EsT0FBTCxDQUFhdkcsY0FBYixDQUE0QmtMLEdBQTVCLENBQUwsRUFBdUM7WUFDakNoTixVQUFTLEtBQUtxSSxPQUFMLENBQWEyRSxHQUFiLENBQWY7WUFDTWpNLFlBQVlmLFFBQU9lLFNBQXpCO1lBQ01FLE9BQU9GLFVBQVVDLEdBQVYsQ0FBYyxTQUFkLEVBQXlCQyxJQUF0Qzs7WUFFSWpCLFlBQVcsSUFBZixFQUFxQjs7O1lBR2pCNk0sV0FBV0csR0FBWCxDQUFKLEVBQXFCOztlQUVkLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSWhNLEtBQUtpTSxPQUFMLENBQWF0TSxNQUFqQyxFQUF5Q3FNLEdBQXpDLEVBQThDO2dCQUN4Q0osV0FBV0csR0FBWCxFQUFnQmhMLE9BQWhCLENBQXdCZixLQUFLaU0sT0FBTCxDQUFhRCxDQUFiLENBQXhCLE1BQTZDLENBQUMsQ0FBbEQsRUFDRWhNLEtBQUtpTSxPQUFMLENBQWFqTCxNQUFiLENBQW9CZ0wsR0FBcEIsRUFBeUIsQ0FBekI7Ozs7ZUFJQyxJQUFJQSxLQUFJLENBQWIsRUFBZ0JBLEtBQUlKLFdBQVdHLEdBQVgsRUFBZ0JwTSxNQUFwQyxFQUE0Q3FNLElBQTVDLEVBQWlEO2dCQUN6Q0UsTUFBTU4sV0FBV0csR0FBWCxFQUFnQkMsRUFBaEIsQ0FBWjtnQkFDTUYsV0FBVSxLQUFLMUUsT0FBTCxDQUFhOEUsR0FBYixDQUFoQjs7Z0JBRUlKLFFBQUosRUFBYTtrQkFDTEssYUFBYUwsU0FBUWhNLFNBQTNCO2tCQUNNc00sUUFBUUQsV0FBV3BNLEdBQVgsQ0FBZSxTQUFmLEVBQTBCQyxJQUF4Qzs7a0JBRUlBLEtBQUtpTSxPQUFMLENBQWFsTCxPQUFiLENBQXFCbUwsR0FBckIsTUFBOEIsQ0FBQyxDQUFuQyxFQUFzQztxQkFDL0JELE9BQUwsQ0FBYXpMLElBQWIsQ0FBa0IwTCxHQUFsQjs7b0JBRU1HLE1BQU12TSxVQUFVQyxHQUFWLENBQWMsU0FBZCxFQUF5QnVNLGlCQUF6QixFQUFaO29CQUNNQyxPQUFPSixXQUFXcE0sR0FBWCxDQUFlLFNBQWYsRUFBMEJ1TSxpQkFBMUIsRUFBYjs7NkJBRWFFLFVBQWIsQ0FBd0JILEdBQXhCLEVBQTZCRSxJQUE3QjtvQkFDTUUsUUFBUXRQLGFBQWFxRixLQUFiLEVBQWQ7OzZCQUVhZ0ssVUFBYixDQUF3QkgsR0FBeEIsRUFBNkJFLElBQTdCO29CQUNNRyxRQUFRdlAsYUFBYXFGLEtBQWIsRUFBZDs7b0JBRUltSyxnQkFBZ0JkLGVBQWtCN0wsS0FBS3NDLEVBQXZCLFNBQTZCOEosTUFBTTlKLEVBQW5DLENBQXBCOztvQkFFSXFLLGdCQUFnQixDQUFwQixFQUF1QjsrQkFDUjNELEdBQWIsQ0FDRSxDQUFDSCxLQUFLOEQsYUFBTCxDQURILEVBRUUsQ0FBQzlELEtBQUs4RCxnQkFBZ0IsQ0FBckIsQ0FGSCxFQUdFLENBQUM5RCxLQUFLOEQsZ0JBQWdCLENBQXJCLENBSEg7aUJBREYsTUFNTzttQ0FDWSxDQUFDLENBQWxCOzsrQkFFYTNELEdBQWIsQ0FDRUgsS0FBSzhELGFBQUwsQ0FERixFQUVFOUQsS0FBSzhELGdCQUFnQixDQUFyQixDQUZGLEVBR0U5RCxLQUFLOEQsZ0JBQWdCLENBQXJCLENBSEY7OzswQkFPUUMsSUFBVixDQUFlLFdBQWYsRUFBNEJkLFFBQTVCLEVBQXFDVyxLQUFyQyxFQUE0Q0MsS0FBNUMsRUFBbUR2UCxZQUFuRDs7OztTQTlDUixNQWtETzZDLEtBQUtpTSxPQUFMLENBQWF0TSxNQUFiLEdBQXNCLENBQXRCLENBM0R1Qjs7O1dBOEQzQmlNLFVBQUwsR0FBa0JBLFVBQWxCOztVQUVJLEtBQUt4QyxvQkFBVCxFQUNFLEtBQUtDLElBQUwsQ0FBVVIsS0FBS1MsTUFBZixFQUF1QixDQUFDVCxLQUFLUyxNQUFOLENBQXZCLEVBL0ZtQjs7OztrQ0FrR1R6RyxZQUFZZ0ssYUFBYTtpQkFDMUJ2SyxFQUFYLEdBQWdCLEtBQUt5QyxXQUFMLEVBQWhCO1dBQ0t1QyxXQUFMLENBQWlCekUsV0FBV1AsRUFBNUIsSUFBa0NPLFVBQWxDO2lCQUNXUixXQUFYLEdBQXlCLElBQXpCO1dBQ0tPLE9BQUwsQ0FBYSxlQUFiLEVBQThCQyxXQUFXaUssYUFBWCxFQUE5Qjs7VUFFSUQsV0FBSixFQUFpQjtZQUNYRSxlQUFKOztnQkFFUWxLLFdBQVdWLElBQW5CO2VBQ08sT0FBTDtxQkFDVyxJQUFJNEQsSUFBSixDQUNQLElBQUlpSCxjQUFKLENBQW1CLEdBQW5CLENBRE8sRUFFUCxJQUFJQyxrQkFBSixFQUZPLENBQVQ7O21CQUtPbk8sUUFBUCxDQUFnQk0sSUFBaEIsQ0FBcUJ5RCxXQUFXTixTQUFoQztpQkFDSzZFLE9BQUwsQ0FBYXZFLFdBQVdmLE9BQXhCLEVBQWlDcUUsR0FBakMsQ0FBcUM0RyxNQUFyQzs7O2VBR0csT0FBTDtxQkFDVyxJQUFJaEgsSUFBSixDQUNQLElBQUlpSCxjQUFKLENBQW1CLEdBQW5CLENBRE8sRUFFUCxJQUFJQyxrQkFBSixFQUZPLENBQVQ7O21CQUtPbk8sUUFBUCxDQUFnQk0sSUFBaEIsQ0FBcUJ5RCxXQUFXTixTQUFoQztpQkFDSzZFLE9BQUwsQ0FBYXZFLFdBQVdmLE9BQXhCLEVBQWlDcUUsR0FBakMsQ0FBcUM0RyxNQUFyQzs7O2VBR0csUUFBTDtxQkFDVyxJQUFJaEgsSUFBSixDQUNQLElBQUltSCxXQUFKLENBQWdCLEVBQWhCLEVBQW9CLENBQXBCLEVBQXVCLENBQXZCLENBRE8sRUFFUCxJQUFJRCxrQkFBSixFQUZPLENBQVQ7O21CQUtPbk8sUUFBUCxDQUFnQk0sSUFBaEIsQ0FBcUJ5RCxXQUFXTixTQUFoQzs7OzttQkFJT2hDLFFBQVAsQ0FBZ0J5SSxHQUFoQixDQUNFbkcsV0FBV00sSUFBWCxDQUFnQnZGLENBRGxCO3VCQUVhdUYsSUFBWCxDQUFnQnhGLENBRmxCO3VCQUdhd0YsSUFBWCxDQUFnQnRGLENBSGxCO2lCQUtLdUosT0FBTCxDQUFhdkUsV0FBV2YsT0FBeEIsRUFBaUNxRSxHQUFqQyxDQUFxQzRHLE1BQXJDOzs7ZUFHRyxXQUFMO3FCQUNXLElBQUloSCxJQUFKLENBQ1AsSUFBSWlILGNBQUosQ0FBbUIsR0FBbkIsQ0FETyxFQUVQLElBQUlDLGtCQUFKLEVBRk8sQ0FBVDs7bUJBS09uTyxRQUFQLENBQWdCTSxJQUFoQixDQUFxQnlELFdBQVdOLFNBQWhDO2lCQUNLNkUsT0FBTCxDQUFhdkUsV0FBV2YsT0FBeEIsRUFBaUNxRSxHQUFqQyxDQUFxQzRHLE1BQXJDOzs7ZUFHRyxLQUFMO3FCQUNXLElBQUloSCxJQUFKLENBQ1AsSUFBSWlILGNBQUosQ0FBbUIsR0FBbkIsQ0FETyxFQUVQLElBQUlDLGtCQUFKLEVBRk8sQ0FBVDs7bUJBS09uTyxRQUFQLENBQWdCTSxJQUFoQixDQUFxQnlELFdBQVdOLFNBQWhDO2lCQUNLNkUsT0FBTCxDQUFhdkUsV0FBV2YsT0FBeEIsRUFBaUNxRSxHQUFqQyxDQUFxQzRHLE1BQXJDOzs7Ozs7YUFNQ2xLLFVBQVA7Ozs7eUNBR21CO1dBQ2RELE9BQUwsQ0FBYSxvQkFBYixFQUFtQyxFQUFuQzs7OztxQ0FHZUMsWUFBWTtVQUN2QixLQUFLeUUsV0FBTCxDQUFpQnpFLFdBQVdQLEVBQTVCLE1BQW9DTixTQUF4QyxFQUFtRDthQUM1Q1ksT0FBTCxDQUFhLGtCQUFiLEVBQWlDLEVBQUNOLElBQUlPLFdBQVdQLEVBQWhCLEVBQWpDO2VBQ08sS0FBS2dGLFdBQUwsQ0FBaUJ6RSxXQUFXUCxFQUE1QixDQUFQOzs7Ozs0QkFJSWtHLEtBQUtDLFFBQVE7V0FDZFksSUFBTCxDQUFVLEVBQUNiLFFBQUQsRUFBTUMsY0FBTixFQUFWOzs7O2tDQUdZM0ksV0FBVztVQUNqQmYsU0FBU2UsVUFBVXFOLE1BQXpCO1VBQ01uTixPQUFPakIsT0FBT2UsU0FBUCxDQUFpQkMsR0FBakIsQ0FBcUIsU0FBckIsRUFBZ0NDLElBQTdDOztVQUVJQSxJQUFKLEVBQVU7a0JBQ0VvTixPQUFWLENBQWtCcEUsR0FBbEIsQ0FBc0IsY0FBdEIsRUFBc0MsSUFBdEM7YUFDSzFHLEVBQUwsR0FBVSxLQUFLeUMsV0FBTCxFQUFWO2VBQ09qRixTQUFQLENBQWlCQyxHQUFqQixDQUFxQixTQUFyQixFQUFnQ0MsSUFBaEMsR0FBdUNBLElBQXZDOztZQUVJakIsa0JBQWtCMEYsT0FBdEIsRUFBK0I7ZUFDeEJxQyxhQUFMLENBQW1CL0gsT0FBTzJGLElBQTFCO2VBQ0syQyxRQUFMLENBQWNySCxLQUFLc0MsRUFBbkIsSUFBeUJ2RCxNQUF6QjtlQUNLNkQsT0FBTCxDQUFhLFlBQWIsRUFBMkI1QyxJQUEzQjtTQUhGLE1BSU87b0JBQ0srSSxlQUFWLEdBQTRCLEtBQTVCO29CQUNVRSxlQUFWLEdBQTRCLEtBQTVCO2VBQ0s3QixPQUFMLENBQWFwSCxLQUFLc0MsRUFBbEIsSUFBd0J2RCxNQUF4Qjs7Y0FFSUEsT0FBT1csUUFBUCxDQUFnQkMsTUFBcEIsRUFBNEI7aUJBQ3JCRCxRQUFMLEdBQWdCLEVBQWhCOzhCQUNrQlgsTUFBbEIsRUFBMEJBLE1BQTFCOzs7Ozs7Ozs7ZUFTR0QsUUFBTCxHQUFnQjtlQUNYQyxPQUFPRCxRQUFQLENBQWdCbkIsQ0FETDtlQUVYb0IsT0FBT0QsUUFBUCxDQUFnQmxCLENBRkw7ZUFHWG1CLE9BQU9ELFFBQVAsQ0FBZ0JqQjtXQUhyQjs7ZUFNSzBDLFFBQUwsR0FBZ0I7ZUFDWHhCLE9BQU9HLFVBQVAsQ0FBa0J2QixDQURQO2VBRVhvQixPQUFPRyxVQUFQLENBQWtCdEIsQ0FGUDtlQUdYbUIsT0FBT0csVUFBUCxDQUFrQnJCLENBSFA7ZUFJWGtCLE9BQU9HLFVBQVAsQ0FBa0JwQjtXQUp2Qjs7Y0FPSWtDLEtBQUtxTixLQUFULEVBQWdCck4sS0FBS3FOLEtBQUwsSUFBY3RPLE9BQU91TyxLQUFQLENBQWEzUCxDQUEzQjtjQUNacUMsS0FBS3VOLE1BQVQsRUFBaUJ2TixLQUFLdU4sTUFBTCxJQUFleE8sT0FBT3VPLEtBQVAsQ0FBYTFQLENBQTVCO2NBQ2JvQyxLQUFLd04sS0FBVCxFQUFnQnhOLEtBQUt3TixLQUFMLElBQWN6TyxPQUFPdU8sS0FBUCxDQUFhelAsQ0FBM0I7O2VBRVgrRSxPQUFMLENBQWEsV0FBYixFQUEwQjVDLElBQTFCOzs7a0JBR1E0TSxJQUFWLENBQWUsZUFBZjs7Ozs7cUNBSWE5TSxXQUFXO1VBQ3BCZixTQUFTZSxVQUFVcU4sTUFBekI7O1VBRUlwTyxrQkFBa0IwRixPQUF0QixFQUErQjthQUN4QjdCLE9BQUwsQ0FBYSxlQUFiLEVBQThCLEVBQUNOLElBQUl2RCxPQUFPK0YsUUFBUCxDQUFnQnhDLEVBQXJCLEVBQTlCO2VBQ092RCxPQUFPOEYsTUFBUCxDQUFjbEYsTUFBckI7ZUFBa0M4TixNQUFMLENBQVkxTyxPQUFPOEYsTUFBUCxDQUFjNkksR0FBZCxFQUFaO1NBRTdCLEtBQUtELE1BQUwsQ0FBWTFPLE9BQU8yRixJQUFuQjthQUNLMkMsUUFBTCxDQUFjdEksT0FBTytGLFFBQVAsQ0FBZ0J4QyxFQUE5QixJQUFvQyxJQUFwQztPQUxGLE1BTU87OztZQUdEdkQsT0FBTytGLFFBQVgsRUFBcUI7b0JBQ1RzSSxPQUFWLENBQWtCSyxNQUFsQixDQUF5QixjQUF6QjtlQUNLckcsT0FBTCxDQUFhckksT0FBTytGLFFBQVAsQ0FBZ0J4QyxFQUE3QixJQUFtQyxJQUFuQztlQUNLTSxPQUFMLENBQWEsY0FBYixFQUE2QixFQUFDTixJQUFJdkQsT0FBTytGLFFBQVAsQ0FBZ0J4QyxFQUFyQixFQUE3Qjs7Ozs7OzBCQUtBcUwsTUFBTUMsTUFBTTs7O2FBQ1QsSUFBSUMsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBYTtZQUMxQixPQUFLQyxRQUFULEVBQW1CO2tEQUNUSCxJQUFSOztTQURGLE1BR08sT0FBS0ksTUFBTCxDQUFZQyxJQUFaLENBQWlCLFlBQU07a0RBQ3BCTCxJQUFSOztTQURLO09BSkYsQ0FBUDs7Ozs0QkFXTVIsVUFBUztlQUNQYyxNQUFSLENBQWUsU0FBZjtlQUNRbEYsR0FBUixDQUFZLGVBQVosRUFBNkIsS0FBS21GLE1BQWxDOzs7OzhCQWVRdkgsTUFBTTs7Ozs7V0FHVHdILGdCQUFMLEdBQXdCLFVBQVNDLGFBQVQsRUFBd0I7WUFDMUNBLGFBQUosRUFBbUJ6SCxLQUFLaEUsT0FBTCxDQUFhLGtCQUFiLEVBQWlDeUwsYUFBakM7T0FEckI7O1dBSUtDLFVBQUwsR0FBa0IsVUFBU0MsT0FBVCxFQUFrQjtZQUM5QkEsT0FBSixFQUFhM0gsS0FBS2hFLE9BQUwsQ0FBYSxZQUFiLEVBQTJCMkwsT0FBM0I7T0FEZjs7V0FJS0MsYUFBTCxHQUFxQjVILEtBQUs0SCxhQUFMLENBQW1CekgsSUFBbkIsQ0FBd0JILElBQXhCLENBQXJCOztXQUVLNkgsUUFBTCxHQUFnQixVQUFTQyxRQUFULEVBQW1CQyxXQUFuQixFQUFnQztZQUMxQy9ILEtBQUtnSSxNQUFULEVBQWlCaEksS0FBS2dJLE1BQUwsQ0FBWUMsS0FBWjs7WUFFYmpJLEtBQUtXLFlBQVQsRUFBdUIsT0FBTyxLQUFQO2FBQ2xCQSxZQUFMLEdBQW9CLElBQXBCOzthQUVLLElBQU11SCxTQUFYLElBQXdCbEksS0FBS1EsT0FBN0IsRUFBc0M7Y0FDaEMsQ0FBQ1IsS0FBS1EsT0FBTCxDQUFhdkcsY0FBYixDQUE0QmlPLFNBQTVCLENBQUwsRUFBNkM7O2NBRXZDL1AsU0FBUzZILEtBQUtRLE9BQUwsQ0FBYTBILFNBQWIsQ0FBZjtjQUNNaFAsWUFBWWYsT0FBT2UsU0FBekI7Y0FDTUUsT0FBT0YsVUFBVUMsR0FBVixDQUFjLFNBQWQsRUFBeUJDLElBQXRDOztjQUVJakIsV0FBVyxJQUFYLEtBQW9CZSxVQUFVaUosZUFBVixJQUE2QmpKLFVBQVVtSixlQUEzRCxDQUFKLEVBQWlGO2dCQUN6RThGLFNBQVMsRUFBQ3pNLElBQUl0QyxLQUFLc0MsRUFBVixFQUFmOztnQkFFSXhDLFVBQVVpSixlQUFkLEVBQStCO3FCQUN0QmlHLEdBQVAsR0FBYTttQkFDUmpRLE9BQU9ELFFBQVAsQ0FBZ0JuQixDQURSO21CQUVSb0IsT0FBT0QsUUFBUCxDQUFnQmxCLENBRlI7bUJBR1JtQixPQUFPRCxRQUFQLENBQWdCakI7ZUFIckI7O2tCQU1JbUMsS0FBS2lQLFVBQVQsRUFBcUJsUSxPQUFPRCxRQUFQLENBQWdCa0ssR0FBaEIsQ0FBb0IsQ0FBcEIsRUFBdUIsQ0FBdkIsRUFBMEIsQ0FBMUI7O3dCQUVYRCxlQUFWLEdBQTRCLEtBQTVCOzs7Z0JBR0VqSixVQUFVbUosZUFBZCxFQUErQjtxQkFDdEJpRyxJQUFQLEdBQWM7bUJBQ1RuUSxPQUFPRyxVQUFQLENBQWtCdkIsQ0FEVDttQkFFVG9CLE9BQU9HLFVBQVAsQ0FBa0J0QixDQUZUO21CQUdUbUIsT0FBT0csVUFBUCxDQUFrQnJCLENBSFQ7bUJBSVRrQixPQUFPRyxVQUFQLENBQWtCcEI7ZUFKdkI7O2tCQU9Ja0MsS0FBS2lQLFVBQVQsRUFBcUJsUSxPQUFPd0IsUUFBUCxDQUFnQnlJLEdBQWhCLENBQW9CLENBQXBCLEVBQXVCLENBQXZCLEVBQTBCLENBQTFCOzt3QkFFWEMsZUFBVixHQUE0QixLQUE1Qjs7O2lCQUdHckcsT0FBTCxDQUFhLGlCQUFiLEVBQWdDbU0sTUFBaEM7Ozs7YUFJQ25NLE9BQUwsQ0FBYSxVQUFiLEVBQXlCLEVBQUM4TCxrQkFBRCxFQUFXQyx3QkFBWCxFQUF6Qjs7WUFFSS9ILEtBQUtnSSxNQUFULEVBQWlCaEksS0FBS2dJLE1BQUwsQ0FBWU8sR0FBWjtlQUNWLElBQVA7T0FoREY7Ozs7Ozs7Ozs7V0EyREtuQixNQUFMLENBQVlDLElBQVosQ0FBaUIsWUFBTTthQUNoQm1CLFlBQUwsR0FBb0IsSUFBSUMsSUFBSixDQUFTLFVBQUNDLEtBQUQsRUFBVztpQkFDakNiLFFBQUwsQ0FBY2EsTUFBTUMsUUFBTixFQUFkLEVBQWdDLENBQWhDLEVBRHNDO1NBQXBCLENBQXBCOzthQUlLSCxZQUFMLENBQWtCSSxLQUFsQjs7Z0JBRVFDLEdBQVIsQ0FBWTdJLEtBQUtGLE9BQUwsQ0FBYTZILE9BQXpCO2VBQ0tELFVBQUwsQ0FBZ0IxSCxLQUFLRixPQUFMLENBQWE2SCxPQUE3QjtPQVJGOzs7O0VBMXNCeUM5TixtQkFDcEMwRyxXQUFXO2lCQUNELElBQUUsRUFERDthQUVMLElBRks7UUFHVixFQUhVO1lBSU4sS0FKTTtXQUtQLElBQUkvSixTQUFKLENBQVksQ0FBWixFQUFlLENBQUMsR0FBaEIsRUFBcUIsQ0FBckI7OztBQy9CYixJQUFJc1MsU0FBUyxPQUFPQyxNQUFQLEtBQWtCLFdBQWxCLEdBQWdDLFVBQWhDLEdBQTZDQSxRQUExRDtJQUNJQyxjQUFjLHdCQURsQjtJQUVJQyxjQUFjQyxPQUFPRCxXQUFQLElBQXNCQyxPQUFPQyxpQkFBN0IsSUFBa0RELE9BQU9FLGNBQXpELElBQTJFRixPQUFPRyxhQUZwRztJQUdJQyxNQUFNSixPQUFPSSxHQUFQLElBQWNKLE9BQU9LLFNBSC9CO0lBSUlDLFNBQVNOLE9BQU9NLE1BSnBCOzs7Ozs7Ozs7O0FBY0EsQUFBZSxTQUFTQyxVQUFULENBQXFCQyxRQUFyQixFQUErQkMsRUFBL0IsRUFBbUM7V0FDdkMsU0FBU0MsVUFBVCxDQUFxQkMsYUFBckIsRUFBb0M7WUFDbkNDLElBQUksSUFBUjs7WUFFSSxDQUFDSCxFQUFMLEVBQVM7bUJBQ0UsSUFBSUgsTUFBSixDQUFXRSxRQUFYLENBQVA7U0FESixNQUdLLElBQUlGLFVBQVUsQ0FBQ0ssYUFBZixFQUE4Qjs7Z0JBRTNCRSxTQUFTSixHQUFHSyxRQUFILEdBQWNDLE9BQWQsQ0FBc0IsZUFBdEIsRUFBdUMsRUFBdkMsRUFBMkNDLEtBQTNDLENBQWlELENBQWpELEVBQW9ELENBQUMsQ0FBckQsQ0FBYjtnQkFDSUMsU0FBU0MsbUJBQW1CTCxNQUFuQixDQURiOztpQkFHS2pCLE1BQUwsSUFBZSxJQUFJVSxNQUFKLENBQVdXLE1BQVgsQ0FBZjtnQkFDSUUsZUFBSixDQUFvQkYsTUFBcEI7bUJBQ08sS0FBS3JCLE1BQUwsQ0FBUDtTQVBDLE1BU0E7Z0JBQ0d3QixXQUFXOzZCQUNNLHFCQUFTQyxDQUFULEVBQVk7d0JBQ2pCVCxFQUFFVSxTQUFOLEVBQWlCO21DQUNGLFlBQVU7OEJBQUlBLFNBQUYsQ0FBWSxFQUFFcFIsTUFBTW1SLENBQVIsRUFBV3BPLFFBQVFtTyxRQUFuQixFQUFaO3lCQUF2Qjs7O2FBSGhCOztlQVFHOVAsSUFBSCxDQUFROFAsUUFBUjtpQkFDS0csV0FBTCxHQUFtQixVQUFTRixDQUFULEVBQVk7MkJBQ2hCLFlBQVU7NkJBQVdDLFNBQVQsQ0FBbUIsRUFBRXBSLE1BQU1tUixDQUFSLEVBQVdwTyxRQUFRMk4sQ0FBbkIsRUFBbkI7aUJBQXZCO2FBREo7aUJBR0tZLFlBQUwsR0FBb0IsSUFBcEI7O0tBNUJSOzs7QUFrQ0osSUFBSWxCLE1BQUosRUFBWTtRQUNKbUIsVUFBSjtRQUNJUixTQUFTQyxtQkFBbUIsaUNBQW5CLENBRGI7UUFFSVEsWUFBWSxJQUFJQyxVQUFKLENBQWUsQ0FBZixDQUZoQjs7UUFJSTs7WUFFSSxrQ0FBa0MvSSxJQUFsQyxDQUF1Q2dKLFVBQVVDLFNBQWpELENBQUosRUFBaUU7a0JBQ3ZELElBQUlDLEtBQUosQ0FBVSxlQUFWLENBQU47O3FCQUVTLElBQUl4QixNQUFKLENBQVdXLE1BQVgsQ0FBYjs7O21CQUdXTSxXQUFYLENBQXVCRyxTQUF2QixFQUFrQyxDQUFDQSxVQUFVbEksTUFBWCxDQUFsQztLQVJKLENBVUEsT0FBT3VJLENBQVAsRUFBVTtpQkFDRyxJQUFUO0tBWEosU0FhUTtZQUNBWixlQUFKLENBQW9CRixNQUFwQjtZQUNJUSxVQUFKLEVBQWdCO3VCQUNETyxTQUFYOzs7OztBQUtaLFNBQVNkLGtCQUFULENBQTRCZSxHQUE1QixFQUFpQztRQUN6QjtlQUNPN0IsSUFBSThCLGVBQUosQ0FBb0IsSUFBSUMsSUFBSixDQUFTLENBQUNGLEdBQUQsQ0FBVCxFQUFnQixFQUFFNVAsTUFBTXlOLFdBQVIsRUFBaEIsQ0FBcEIsQ0FBUDtLQURKLENBR0EsT0FBT2lDLENBQVAsRUFBVTtZQUNGSyxPQUFPLElBQUlyQyxXQUFKLEVBQVg7YUFDS3NDLE1BQUwsQ0FBWUosR0FBWjtlQUNPN0IsSUFBSThCLGVBQUosQ0FBb0JFLEtBQUtFLE9BQUwsQ0FBYWpRLElBQWIsQ0FBcEIsQ0FBUDs7OztBQ2pGUixvQkFBZSxJQUFJa08sVUFBSixDQUFlLGNBQWYsRUFBK0IsVUFBVVAsTUFBVixFQUFrQnVDLFFBQWxCLEVBQTRCO01BQ3RFekwsT0FBTyxJQUFYO1dBQ1MwTCxNQUFULENBQWdCdlAsTUFBaEIsRUFBd0I7UUFDbEJ3UCxTQUFTLEVBQWI7UUFDRUMsUUFBUSxFQURWO2FBRVN6UCxVQUFVLElBQW5COzs7O1dBSU8wUCxFQUFQLEdBQVksVUFBVXRRLElBQVYsRUFBZ0J3TCxJQUFoQixFQUFzQitFLEdBQXRCLEVBQTJCO09BQ3BDSCxPQUFPcFEsSUFBUCxJQUFlb1EsT0FBT3BRLElBQVAsS0FBZ0IsRUFBaEMsRUFBb0MzQixJQUFwQyxDQUF5QyxDQUFDbU4sSUFBRCxFQUFPK0UsR0FBUCxDQUF6QzthQUNPM1AsTUFBUDtLQUZGOzs7O1dBT080UCxHQUFQLEdBQWEsVUFBVXhRLElBQVYsRUFBZ0J3TCxJQUFoQixFQUFzQjtlQUN4QjRFLFNBQVMsRUFBbEI7VUFDSUssT0FBT0wsT0FBT3BRLElBQVAsS0FBZ0JxUSxLQUEzQjtVQUNFL1MsSUFBSW1ULEtBQUtqVCxNQUFMLEdBQWNnTyxPQUFPaUYsS0FBS2pULE1BQVosR0FBcUIsQ0FEekM7YUFFT0YsR0FBUDtnQkFBb0JtVCxLQUFLblQsQ0FBTCxFQUFRLENBQVIsQ0FBUixJQUFzQm1ULEtBQUs1UixNQUFMLENBQVl2QixDQUFaLEVBQWUsQ0FBZixDQUF0QjtPQUNaLE9BQU9zRCxNQUFQO0tBTEY7Ozs7V0FVTzZKLElBQVAsR0FBYyxVQUFVekssSUFBVixFQUFnQjtVQUN4QjBQLElBQUlVLE9BQU9wUSxJQUFQLEtBQWdCcVEsS0FBeEI7VUFDRUksT0FBT2YsRUFBRWxTLE1BQUYsR0FBVyxDQUFYLEdBQWVrUyxFQUFFZixLQUFGLENBQVEsQ0FBUixFQUFXZSxFQUFFbFMsTUFBYixDQUFmLEdBQXNDa1MsQ0FEL0M7VUFFRXBTLElBQUksQ0FGTjtVQUdFdU0sQ0FIRjthQUlPQSxJQUFJNEcsS0FBS25ULEdBQUwsQ0FBWDtVQUF3QixDQUFGLEVBQUs2QixLQUFMLENBQVcwSyxFQUFFLENBQUYsQ0FBWCxFQUFpQndHLE1BQU0xQixLQUFOLENBQVkxUCxJQUFaLENBQWlCQyxTQUFqQixFQUE0QixDQUE1QixDQUFqQjtPQUN0QixPQUFPMEIsTUFBUDtLQU5GOztNQVVJOFAsZUFBZSxDQUFDak0sS0FBS3lMLFFBQTNCO01BQ0ksQ0FBQ1EsWUFBTCxFQUFtQmpNLE9BQU8sSUFBSTBMLE1BQUosRUFBUDs7TUFFZmpKLE9BQU93SixlQUFnQmpNLEtBQUtrTSxpQkFBTCxJQUEwQmxNLEtBQUt5SyxXQUEvQyxHQUE4RCxVQUFVclIsSUFBVixFQUFnQjtTQUNsRjRNLElBQUwsQ0FBVSxTQUFWLEVBQXFCLEVBQUU1TSxVQUFGLEVBQXJCO0dBREY7O09BSUtxSixJQUFMLEdBQVlBLElBQVo7O01BRUlELDZCQUFKOztNQUVJeUosWUFBSixFQUFrQjtRQUNWRSxLQUFLLElBQUlwTCxXQUFKLENBQWdCLENBQWhCLENBQVg7O1NBRUtvTCxFQUFMLEVBQVMsQ0FBQ0EsRUFBRCxDQUFUOzJCQUN3QkEsR0FBR25MLFVBQUgsS0FBa0IsQ0FBMUM7OztNQUdJOUssZ0JBQWdCO2lCQUNQLENBRE87cUJBRUgsQ0FGRzttQkFHTCxDQUhLO3NCQUlGLENBSkU7Z0JBS1I7R0FMZDs7O01BU0lrVyxnQkFBSjtNQUNFQyxnQkFERjtNQUVFQyxtQkFGRjtNQUdFQyx1QkFIRjtNQUlFQyxvQkFBb0IsS0FKdEI7TUFLRUMsQUFFQUMsZUFBZSxDQVBqQjtNQVFFQyx5QkFBeUIsQ0FSM0I7TUFTRUMsd0JBQXdCLENBVDFCO01BVUVDLGNBQWMsQ0FWaEI7TUFXRUMsbUJBQW1CLENBWHJCO01BWUVDLHdCQUF3QixDQVoxQjs7Ozt3QkFBQTtNQWVpQixBQUdmdk4sY0FsQkY7TUFtQkV3TixnQkFuQkY7TUFvQkVDLGdCQXBCRjtNQXFCRUMsZ0JBckJGO01Bc0JFQyxjQXRCRjs7O01BeUJNQyxtQkFBbUIsRUFBekI7TUFDRUMsV0FBVyxFQURiO01BRUVDLFlBQVksRUFGZDtNQUdFQyxlQUFlLEVBSGpCO01BSUVDLGdCQUFnQixFQUpsQjtNQUtFQyxpQkFBaUIsRUFMbkI7Ozs7Ozs7bUJBV21CLEVBWG5COzs7c0JBYXNCLEVBYnRCOzs7O3FCQWdCcUIsRUFoQnJCOzs7TUFtQklDLHlCQUFKOztzQkFBQTtNQUVFQyxtQkFGRjtNQUdFQyx3QkFIRjtNQUlFQyxzQkFKRjtNQUtFQyx5QkFMRjs7TUFPTUMsdUJBQXVCLEVBQTdCOzs2QkFDNkIsQ0FEN0I7OzJCQUUyQixDQUYzQjs7OEJBRzhCLENBSDlCLENBbEgwRTs7TUF1SHBFQyxvQkFBb0IsU0FBcEJBLGlCQUFvQixDQUFDQyxTQUFELEVBQWU7UUFDbkNSLGVBQWVRLFNBQWYsTUFBOEI3UyxTQUFsQyxFQUNFLE9BQU9xUyxlQUFlUSxTQUFmLENBQVA7O1dBRUssSUFBUDtHQUpGOztNQU9NQyxnQkFBZ0IsU0FBaEJBLGFBQWdCLENBQUNELFNBQUQsRUFBWUUsS0FBWixFQUFzQjttQkFDM0JGLFNBQWYsSUFBNEJFLEtBQTVCO0dBREY7O01BSU1DLGNBQWMsU0FBZEEsV0FBYyxDQUFDQyxXQUFELEVBQWlCO1FBQy9CRixjQUFKOztlQUVXRyxXQUFYO1lBQ1FELFlBQVk5UyxJQUFwQjtXQUNLLFVBQUw7O2tCQUVZLElBQUlnVCxLQUFLQyxlQUFULEVBQVI7Ozs7V0FJQyxPQUFMOztjQUVVUCx1QkFBcUJJLFlBQVlsTCxNQUFaLENBQW1CcE0sQ0FBeEMsU0FBNkNzWCxZQUFZbEwsTUFBWixDQUFtQm5NLENBQWhFLFNBQXFFcVgsWUFBWWxMLE1BQVosQ0FBbUJsTSxDQUE5Rjs7Y0FFSSxDQUFDa1gsUUFBUUgsa0JBQWtCQyxTQUFsQixDQUFULE1BQTJDLElBQS9DLEVBQXFEO29CQUMzQ1EsSUFBUixDQUFhSixZQUFZbEwsTUFBWixDQUFtQnBNLENBQWhDO29CQUNRMlgsSUFBUixDQUFhTCxZQUFZbEwsTUFBWixDQUFtQm5NLENBQWhDO29CQUNRMlgsSUFBUixDQUFhTixZQUFZbEwsTUFBWixDQUFtQmxNLENBQWhDO29CQUNRLElBQUlzWCxLQUFLSyxrQkFBVCxDQUE0QjVCLE9BQTVCLEVBQXFDLENBQXJDLENBQVI7MEJBQ2NpQixTQUFkLEVBQXlCRSxLQUF6Qjs7Ozs7V0FLRCxLQUFMOztjQUVVRixzQkFBbUJJLFlBQVk1SCxLQUEvQixTQUF3QzRILFlBQVkxSCxNQUFwRCxTQUE4RDBILFlBQVl6SCxLQUFoRjs7Y0FFSSxDQUFDdUgsUUFBUUgsa0JBQWtCQyxVQUFsQixDQUFULE1BQTJDLElBQS9DLEVBQXFEO29CQUMzQ1EsSUFBUixDQUFhSixZQUFZNUgsS0FBWixHQUFvQixDQUFqQztvQkFDUWlJLElBQVIsQ0FBYUwsWUFBWTFILE1BQVosR0FBcUIsQ0FBbEM7b0JBQ1FnSSxJQUFSLENBQWFOLFlBQVl6SCxLQUFaLEdBQW9CLENBQWpDO29CQUNRLElBQUkySCxLQUFLTSxVQUFULENBQW9CN0IsT0FBcEIsQ0FBUjswQkFDY2lCLFVBQWQsRUFBeUJFLEtBQXpCOzs7OztXQUtELFFBQUw7O2NBRVVGLDBCQUFzQkksWUFBWVMsTUFBeEM7O2NBRUksQ0FBQ1gsUUFBUUgsa0JBQWtCQyxXQUFsQixDQUFULE1BQTJDLElBQS9DLEVBQXFEO29CQUMzQyxJQUFJTSxLQUFLUSxhQUFULENBQXVCVixZQUFZUyxNQUFuQyxDQUFSOzBCQUNjYixXQUFkLEVBQXlCRSxLQUF6Qjs7Ozs7V0FLRCxVQUFMOztjQUVVRiw0QkFBd0JJLFlBQVk1SCxLQUFwQyxTQUE2QzRILFlBQVkxSCxNQUF6RCxTQUFtRTBILFlBQVl6SCxLQUFyRjs7Y0FFSSxDQUFDdUgsUUFBUUgsa0JBQWtCQyxXQUFsQixDQUFULE1BQTJDLElBQS9DLEVBQXFEO29CQUMzQ1EsSUFBUixDQUFhSixZQUFZNUgsS0FBWixHQUFvQixDQUFqQztvQkFDUWlJLElBQVIsQ0FBYUwsWUFBWTFILE1BQVosR0FBcUIsQ0FBbEM7b0JBQ1FnSSxJQUFSLENBQWFOLFlBQVl6SCxLQUFaLEdBQW9CLENBQWpDO29CQUNRLElBQUkySCxLQUFLUyxlQUFULENBQXlCaEMsT0FBekIsQ0FBUjswQkFDY2lCLFdBQWQsRUFBeUJFLEtBQXpCOzs7OztXQUtELFNBQUw7O2NBRVVGLDJCQUF1QkksWUFBWVMsTUFBbkMsU0FBNkNULFlBQVkxSCxNQUEvRDs7Y0FFSSxDQUFDd0gsUUFBUUgsa0JBQWtCQyxXQUFsQixDQUFULE1BQTJDLElBQS9DLEVBQXFEOztvQkFFM0MsSUFBSU0sS0FBS1UsY0FBVCxDQUF3QlosWUFBWVMsTUFBcEMsRUFBNENULFlBQVkxSCxNQUFaLEdBQXFCLElBQUkwSCxZQUFZUyxNQUFqRixDQUFSOzBCQUNjYixXQUFkLEVBQXlCRSxLQUF6Qjs7Ozs7V0FLRCxNQUFMOztjQUVVRix3QkFBb0JJLFlBQVlTLE1BQWhDLFNBQTBDVCxZQUFZMUgsTUFBNUQ7O2NBRUksQ0FBQ3dILFFBQVFILGtCQUFrQkMsV0FBbEIsQ0FBVCxNQUEyQyxJQUEvQyxFQUFxRDtvQkFDM0MsSUFBSU0sS0FBS1csV0FBVCxDQUFxQmIsWUFBWVMsTUFBakMsRUFBeUNULFlBQVkxSCxNQUFyRCxDQUFSOzBCQUNjc0gsV0FBZCxFQUF5QkUsS0FBekI7Ozs7O1dBS0QsU0FBTDs7Y0FFVWdCLGdCQUFnQixJQUFJWixLQUFLYSxjQUFULEVBQXRCO2NBQ0ksQ0FBQ2YsWUFBWWpWLElBQVosQ0FBaUJMLE1BQXRCLEVBQThCLE9BQU8sS0FBUDtjQUN4QkssT0FBT2lWLFlBQVlqVixJQUF6Qjs7ZUFFSyxJQUFJUCxJQUFJLENBQWIsRUFBZ0JBLElBQUlPLEtBQUtMLE1BQUwsR0FBYyxDQUFsQyxFQUFxQ0YsR0FBckMsRUFBMEM7b0JBQ2hDNFYsSUFBUixDQUFhclYsS0FBS1AsSUFBSSxDQUFULENBQWI7b0JBQ1E2VixJQUFSLENBQWF0VixLQUFLUCxJQUFJLENBQUosR0FBUSxDQUFiLENBQWI7b0JBQ1E4VixJQUFSLENBQWF2VixLQUFLUCxJQUFJLENBQUosR0FBUSxDQUFiLENBQWI7O29CQUVRNFYsSUFBUixDQUFhclYsS0FBS1AsSUFBSSxDQUFKLEdBQVEsQ0FBYixDQUFiO29CQUNRNlYsSUFBUixDQUFhdFYsS0FBS1AsSUFBSSxDQUFKLEdBQVEsQ0FBYixDQUFiO29CQUNROFYsSUFBUixDQUFhdlYsS0FBS1AsSUFBSSxDQUFKLEdBQVEsQ0FBYixDQUFiOztvQkFFUTRWLElBQVIsQ0FBYXJWLEtBQUtQLElBQUksQ0FBSixHQUFRLENBQWIsQ0FBYjtvQkFDUTZWLElBQVIsQ0FBYXRWLEtBQUtQLElBQUksQ0FBSixHQUFRLENBQWIsQ0FBYjtvQkFDUThWLElBQVIsQ0FBYXZWLEtBQUtQLElBQUksQ0FBSixHQUFRLENBQWIsQ0FBYjs7MEJBRWN3VyxXQUFkLENBQ0VyQyxPQURGLEVBRUVDLE9BRkYsRUFHRUMsT0FIRixFQUlFLEtBSkY7OztrQkFRTSxJQUFJcUIsS0FBS2Usc0JBQVQsQ0FDTkgsYUFETSxFQUVOLElBRk0sRUFHTixJQUhNLENBQVI7OzRCQU1rQmQsWUFBWTNTLEVBQTlCLElBQW9DeVMsS0FBcEM7Ozs7V0FJQyxRQUFMOztrQkFFWSxJQUFJSSxLQUFLZ0IsaUJBQVQsRUFBUjtjQUNNblcsUUFBT2lWLFlBQVlqVixJQUF6Qjs7ZUFFSyxJQUFJUCxLQUFJLENBQWIsRUFBZ0JBLEtBQUlPLE1BQUtMLE1BQUwsR0FBYyxDQUFsQyxFQUFxQ0YsSUFBckMsRUFBMEM7b0JBQ2hDNFYsSUFBUixDQUFhclYsTUFBS1AsS0FBSSxDQUFULENBQWI7b0JBQ1E2VixJQUFSLENBQWF0VixNQUFLUCxLQUFJLENBQUosR0FBUSxDQUFiLENBQWI7b0JBQ1E4VixJQUFSLENBQWF2VixNQUFLUCxLQUFJLENBQUosR0FBUSxDQUFiLENBQWI7O2tCQUVNMlcsUUFBTixDQUFleEMsT0FBZjs7OzRCQUdnQnFCLFlBQVkzUyxFQUE5QixJQUFvQ3lTLEtBQXBDOzs7O1dBSUMsYUFBTDs7Y0FFVXNCLE9BQU9wQixZQUFZb0IsSUFBekI7Y0FDRUMsT0FBT3JCLFlBQVlxQixJQURyQjtjQUVFQyxTQUFTdEIsWUFBWXNCLE1BRnZCO2NBR0VDLE1BQU1yQixLQUFLc0IsT0FBTCxDQUFhLElBQUlKLElBQUosR0FBV0MsSUFBeEIsQ0FIUjs7ZUFLSyxJQUFJN1csTUFBSSxDQUFSLEVBQVdpWCxJQUFJLENBQWYsRUFBa0JDLEtBQUssQ0FBNUIsRUFBK0JsWCxNQUFJNFcsSUFBbkMsRUFBeUM1VyxLQUF6QyxFQUE4QztpQkFDdkMsSUFBSXVNLElBQUksQ0FBYixFQUFnQkEsSUFBSXNLLElBQXBCLEVBQTBCdEssR0FBMUIsRUFBK0I7bUJBQ3hCNEssT0FBTCxDQUFhSixNQUFNRyxFQUFOLElBQVksQ0FBekIsSUFBOEJKLE9BQU9HLENBQVAsQ0FBOUI7OztvQkFHTSxDQUFOOzs7O2tCQUlJLElBQUl2QixLQUFLMEIseUJBQVQsQ0FDTjVCLFlBQVlvQixJQUROLEVBRU5wQixZQUFZcUIsSUFGTixFQUdORSxHQUhNLEVBSU4sQ0FKTSxFQUlILENBQUN2QixZQUFZNkIsWUFKVixFQUtON0IsWUFBWTZCLFlBTE4sRUFNTixDQU5NLEVBT04sV0FQTSxFQVFOLEtBUk0sQ0FBUjs7NEJBV2tCN0IsWUFBWTNTLEVBQTlCLElBQW9DeVMsS0FBcEM7Ozs7Ozs7O1dBUUdBLEtBQVA7R0FoTEY7O01BbUxNZ0MsaUJBQWlCLFNBQWpCQSxjQUFpQixDQUFDOUIsV0FBRCxFQUFpQjtRQUNsQytCLGFBQUo7O1FBRU1DLGtCQUFrQixJQUFJOUIsS0FBSytCLGlCQUFULEVBQXhCOztZQUVRakMsWUFBWTlTLElBQXBCO1dBQ0ssYUFBTDs7Y0FFUSxDQUFDOFMsWUFBWWtDLFNBQVosQ0FBc0J4WCxNQUEzQixFQUFtQyxPQUFPLEtBQVA7O2lCQUU1QnNYLGdCQUFnQkcsaUJBQWhCLENBQ0xoUixNQUFNaVIsWUFBTixFQURLLEVBRUxwQyxZQUFZa0MsU0FGUCxFQUdMbEMsWUFBWXFDLFFBSFAsRUFJTHJDLFlBQVlxQyxRQUFaLENBQXFCM1gsTUFBckIsR0FBOEIsQ0FKekIsRUFLTCxLQUxLLENBQVA7Ozs7V0FVQyxlQUFMOztjQUVVNFgsS0FBS3RDLFlBQVl1QyxPQUF2Qjs7aUJBRU9QLGdCQUFnQlEsV0FBaEIsQ0FDTHJSLE1BQU1pUixZQUFOLEVBREssRUFFTCxJQUFJbEMsS0FBS3VDLFNBQVQsQ0FBbUJILEdBQUcsQ0FBSCxDQUFuQixFQUEwQkEsR0FBRyxDQUFILENBQTFCLEVBQWlDQSxHQUFHLENBQUgsQ0FBakMsQ0FGSyxFQUdMLElBQUlwQyxLQUFLdUMsU0FBVCxDQUFtQkgsR0FBRyxDQUFILENBQW5CLEVBQTBCQSxHQUFHLENBQUgsQ0FBMUIsRUFBaUNBLEdBQUcsQ0FBSCxDQUFqQyxDQUhLLEVBSUwsSUFBSXBDLEtBQUt1QyxTQUFULENBQW1CSCxHQUFHLENBQUgsQ0FBbkIsRUFBMEJBLEdBQUcsQ0FBSCxDQUExQixFQUFpQ0EsR0FBRyxDQUFILENBQWpDLENBSkssRUFLTCxJQUFJcEMsS0FBS3VDLFNBQVQsQ0FBbUJILEdBQUcsQ0FBSCxDQUFuQixFQUEwQkEsR0FBRyxFQUFILENBQTFCLEVBQWtDQSxHQUFHLEVBQUgsQ0FBbEMsQ0FMSyxFQU1MdEMsWUFBWTBDLFFBQVosQ0FBcUIsQ0FBckIsQ0FOSyxFQU9MMUMsWUFBWTBDLFFBQVosQ0FBcUIsQ0FBckIsQ0FQSyxFQVFMLENBUkssRUFTTCxJQVRLLENBQVA7Ozs7V0FjQyxjQUFMOztjQUVVM1gsT0FBT2lWLFlBQVlqVixJQUF6Qjs7aUJBRU9pWCxnQkFBZ0JXLFVBQWhCLENBQ0x4UixNQUFNaVIsWUFBTixFQURLLEVBRUwsSUFBSWxDLEtBQUt1QyxTQUFULENBQW1CMVgsS0FBSyxDQUFMLENBQW5CLEVBQTRCQSxLQUFLLENBQUwsQ0FBNUIsRUFBcUNBLEtBQUssQ0FBTCxDQUFyQyxDQUZLLEVBR0wsSUFBSW1WLEtBQUt1QyxTQUFULENBQW1CMVgsS0FBSyxDQUFMLENBQW5CLEVBQTRCQSxLQUFLLENBQUwsQ0FBNUIsRUFBcUNBLEtBQUssQ0FBTCxDQUFyQyxDQUhLLEVBSUxBLEtBQUssQ0FBTCxJQUFVLENBSkwsRUFLTCxDQUxLLENBQVA7Ozs7Ozs7OztXQWVHZ1gsSUFBUDtHQXpERjs7bUJBNERpQmEsSUFBakIsR0FBd0IsWUFBaUI7UUFBaEJwUCxNQUFnQix1RUFBUCxFQUFPOztRQUNuQ0EsT0FBT3FQLFFBQVgsRUFBcUI7YUFDWjNDLElBQVAsR0FBYyxJQUFJMU0sT0FBT3NQLElBQVgsRUFBZDt1QkFDaUJDLFNBQWpCLENBQTJCdlAsTUFBM0I7Ozs7UUFJRUEsT0FBT3dQLFVBQVgsRUFBdUI7b0JBQ1B4UCxPQUFPc1AsSUFBckI7O1dBRUs1QyxJQUFMLEdBQVksSUFBSStDLGtCQUFKLENBQXVCelAsT0FBT3dQLFVBQTlCLEdBQVo7V0FDSyxFQUFFelAsS0FBSyxZQUFQLEVBQUw7dUJBQ2lCd1AsU0FBakIsQ0FBMkJ2UCxNQUEzQjtLQUxGLE1BT0s7b0JBQ1dBLE9BQU9zUCxJQUFyQjtXQUNLLEVBQUV2UCxLQUFLLFlBQVAsRUFBTDs7V0FFSzJNLElBQUwsR0FBWSxJQUFJQSxJQUFKLEVBQVo7dUJBQ2lCNkMsU0FBakIsQ0FBMkJ2UCxNQUEzQjs7R0FuQko7O21CQXVCaUJ1UCxTQUFqQixHQUE2QixZQUFpQjtRQUFoQnZQLE1BQWdCLHVFQUFQLEVBQU87O2lCQUMvQixJQUFJME0sS0FBS2dELFdBQVQsRUFBYjtxQkFDaUIsSUFBSWhELEtBQUtnRCxXQUFULEVBQWpCO2NBQ1UsSUFBSWhELEtBQUt1QyxTQUFULENBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLENBQVY7Y0FDVSxJQUFJdkMsS0FBS3VDLFNBQVQsQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsQ0FBVjtjQUNVLElBQUl2QyxLQUFLdUMsU0FBVCxDQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixDQUFWO1lBQ1EsSUFBSXZDLEtBQUtpRCxZQUFULENBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLEVBQStCLENBQS9CLENBQVI7O3VCQUVtQjNQLE9BQU80UCxVQUFQLElBQXFCLEVBQXhDOztRQUVJalAsb0JBQUosRUFBMEI7O29CQUVWLElBQUl2QixZQUFKLENBQWlCLElBQUl5TSxtQkFBbUJLLG9CQUF4QyxDQUFkLENBRndCO3dCQUdOLElBQUk5TSxZQUFKLENBQWlCLElBQUl5TSxtQkFBbUJ0WCx3QkFBeEMsQ0FBbEIsQ0FId0I7c0JBSVIsSUFBSTZLLFlBQUosQ0FBaUIsSUFBSXlNLG1CQUFtQnJYLHNCQUF4QyxDQUFoQixDQUp3Qjt5QkFLTCxJQUFJNEssWUFBSixDQUFpQixJQUFJeU0sbUJBQW1CcFgseUJBQXhDLENBQW5CLENBTHdCO0tBQTFCLE1BT0s7O29CQUVXLEVBQWQ7d0JBQ2tCLEVBQWxCO3NCQUNnQixFQUFoQjt5QkFDbUIsRUFBbkI7OztnQkFHVSxDQUFaLElBQWlCSixjQUFjZ0wsV0FBL0I7b0JBQ2dCLENBQWhCLElBQXFCaEwsY0FBY29MLGVBQW5DO2tCQUNjLENBQWQsSUFBbUJwTCxjQUFjc0wsYUFBakM7cUJBQ2lCLENBQWpCLElBQXNCdEwsY0FBY3dMLGdCQUFwQzs7UUFFTWdRLHlCQUF5QjdQLE9BQU84UCxRQUFQLEdBQzdCLElBQUlwRCxLQUFLcUQseUNBQVQsRUFENkIsR0FFN0IsSUFBSXJELEtBQUtzRCwrQkFBVCxFQUZGO1FBR0VDLGFBQWEsSUFBSXZELEtBQUt3RCxxQkFBVCxDQUErQkwsc0JBQS9CLENBSGY7UUFJRU0sU0FBUyxJQUFJekQsS0FBSzBELG1DQUFULEVBSlg7O1FBTUlDLG1CQUFKOztRQUVJLENBQUNyUSxPQUFPcVEsVUFBWixFQUF3QnJRLE9BQU9xUSxVQUFQLEdBQW9CLEVBQUUzVyxNQUFNLFNBQVIsRUFBcEI7Ozs7Ozs7Ozs7Ozs7Ozs7O1lBa0JoQnNHLE9BQU9xUSxVQUFQLENBQWtCM1csSUFBMUI7V0FDSyxZQUFMO2dCQUNVa1QsSUFBUixDQUFhNU0sT0FBT3FRLFVBQVAsQ0FBa0JDLE9BQWxCLENBQTBCcGIsQ0FBdkM7Z0JBQ1EyWCxJQUFSLENBQWE3TSxPQUFPcVEsVUFBUCxDQUFrQkMsT0FBbEIsQ0FBMEJuYixDQUF2QztnQkFDUTJYLElBQVIsQ0FBYTlNLE9BQU9xUSxVQUFQLENBQWtCQyxPQUFsQixDQUEwQmxiLENBQXZDOztnQkFFUXdYLElBQVIsQ0FBYTVNLE9BQU9xUSxVQUFQLENBQWtCRSxPQUFsQixDQUEwQnJiLENBQXZDO2dCQUNRMlgsSUFBUixDQUFhN00sT0FBT3FRLFVBQVAsQ0FBa0JFLE9BQWxCLENBQTBCcGIsQ0FBdkM7Z0JBQ1EyWCxJQUFSLENBQWE5TSxPQUFPcVEsVUFBUCxDQUFrQkUsT0FBbEIsQ0FBMEJuYixDQUF2Qzs7cUJBRWEsSUFBSXNYLEtBQUs4RCxZQUFULENBQ1hyRixPQURXLEVBRVhDLE9BRlcsQ0FBYjs7O1dBTUcsU0FBTDs7cUJBRWUsSUFBSXNCLEtBQUsrRCxnQkFBVCxFQUFiOzs7O1lBSU16USxPQUFPOFAsUUFBUCxHQUNOLElBQUlwRCxLQUFLZ0Usd0JBQVQsQ0FBa0NULFVBQWxDLEVBQThDSSxVQUE5QyxFQUEwREYsTUFBMUQsRUFBa0VOLHNCQUFsRSxFQUEwRixJQUFJbkQsS0FBS2lFLHVCQUFULEVBQTFGLENBRE0sR0FFTixJQUFJakUsS0FBS2tFLHVCQUFULENBQWlDWCxVQUFqQyxFQUE2Q0ksVUFBN0MsRUFBeURGLE1BQXpELEVBQWlFTixzQkFBakUsQ0FGRjtvQkFHZ0I3UCxPQUFPNEYsYUFBdkI7O1FBRUk1RixPQUFPOFAsUUFBWCxFQUFxQm5GLG9CQUFvQixJQUFwQjs7U0FFaEIsRUFBRTVLLEtBQUssWUFBUCxFQUFMO0dBckZGOzttQkF3RmlCNEYsZ0JBQWpCLEdBQW9DLFVBQUM2RyxXQUFELEVBQWlCO29CQUNuQ0EsV0FBaEI7R0FERjs7bUJBSWlCM0csVUFBakIsR0FBOEIsVUFBQzJHLFdBQUQsRUFBaUI7WUFDckNJLElBQVIsQ0FBYUosWUFBWXRYLENBQXpCO1lBQ1EyWCxJQUFSLENBQWFMLFlBQVlyWCxDQUF6QjtZQUNRMlgsSUFBUixDQUFhTixZQUFZcFgsQ0FBekI7VUFDTXlRLFVBQU4sQ0FBaUJzRixPQUFqQjtHQUpGOzttQkFPaUIwRixZQUFqQixHQUFnQyxVQUFDckUsV0FBRCxFQUFpQjthQUN0Q0EsWUFBWTFULEdBQXJCLEVBQ0crWCxZQURILENBRUlyRSxZQUFZc0UsSUFGaEIsRUFHSXRGLFNBQVNnQixZQUFZdUUsSUFBckIsQ0FISixFQUlJdkUsWUFBWXdFLDRCQUpoQixFQUtJeEUsWUFBWXlFLFNBTGhCO0dBREY7O21CQVVpQkMsU0FBakIsR0FBNkIsVUFBQzFFLFdBQUQsRUFBaUI7UUFDeEMyRSxZQUFZM0YsU0FBU2dCLFlBQVlyTyxJQUFyQixDQUFoQjtRQUNJaVQsYUFBYTVGLFNBQVNnQixZQUFZK0IsSUFBckIsQ0FBakI7O1FBRUk4QyxZQUFZRixVQUFVRyxXQUFWLEdBQXdCQyxFQUF4QixDQUEyQi9FLFlBQVlnRixFQUF2QyxDQUFoQjtRQUNJQyxhQUFhTCxXQUFXRSxXQUFYLEdBQXlCQyxFQUF6QixDQUE0Qi9FLFlBQVlrRixFQUF4QyxDQUFqQjs7UUFFSUMsV0FBV04sVUFBVU8sT0FBVixFQUFmO1FBQ0lDLFlBQVlKLFdBQVdHLE9BQVgsRUFBaEI7O1FBRUlFLFVBQVVELFVBQVUzYyxDQUFWLEtBQWdCeWMsU0FBU3pjLENBQVQsRUFBOUI7UUFDSTZjLFVBQVVGLFVBQVUxYyxDQUFWLEtBQWdCd2MsU0FBU3hjLENBQVQsRUFBOUI7UUFDSTZjLFVBQVVILFVBQVV6YyxDQUFWLEtBQWdCdWMsU0FBU3ZjLENBQVQsRUFBOUI7Ozs7UUFLSTZjLHdCQUFKO1FBQXFCQyxTQUFTLEtBQTlCOztRQUVNQyxRQUFRQyxZQUFZLFlBQU07Z0JBQ3BCUCxVQUFVM2MsQ0FBVixLQUFnQnljLFNBQVN6YyxDQUFULEVBQTFCO2dCQUNVMmMsVUFBVTFjLENBQVYsS0FBZ0J3YyxTQUFTeGMsQ0FBVCxFQUExQjtnQkFDVTBjLFVBQVV6YyxDQUFWLEtBQWdCdWMsU0FBU3ZjLENBQVQsRUFBMUI7O1VBRUlpZCxXQUFXL2MsS0FBS2dkLElBQUwsQ0FBVVIsVUFBVUEsT0FBVixHQUFvQkMsVUFBVUEsT0FBOUIsR0FBd0NDLFVBQVVBLE9BQTVELENBQWY7O1VBRUlDLG1CQUFtQixDQUFDQyxNQUFwQixJQUE4QkQsa0JBQWtCSSxRQUFwRCxFQUE4RDs7O2lCQUVuRCxJQUFUOzs7Ozs7Ozs7Ozs7OztnQkFjUXJMLEdBQVIsQ0FBWSxPQUFaOztnQkFFUTRGLElBQVIsQ0FBYSxDQUFiO2dCQUNRQyxJQUFSLENBQWEsQ0FBYjtnQkFDUUMsSUFBUixDQUFhLENBQWI7O2tCQUVVeUYsV0FBVixDQUNFcEgsT0FERjs7bUJBSVdvSCxXQUFYLENBQ0VwSCxPQURGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7VUF3Q0lxSCxXQUFXTixTQUFTLEVBQVQsR0FBYyxDQUEvQjs7aUJBRVc1YyxLQUFLbWQsR0FBTCxDQUFTSixRQUFULEVBQW1CLENBQW5CLElBQXdCN0YsWUFBWWtHLFFBQXBDLEdBQStDRixRQUExRDtpQkFDV2xkLEtBQUttZCxHQUFMLENBQVNKLFFBQVQsRUFBbUIsQ0FBbkIsSUFBd0I3RixZQUFZa0csUUFBcEMsR0FBK0NGLFFBQTFEO2lCQUNXbGQsS0FBS21kLEdBQUwsQ0FBU0osUUFBVCxFQUFtQixDQUFuQixJQUF3QjdGLFlBQVlrRyxRQUFwQyxHQUErQ0YsUUFBMUQ7O2NBRVE1RixJQUFSLENBQWFrRixPQUFiO2NBQ1FqRixJQUFSLENBQWFrRixPQUFiO2NBQ1FqRixJQUFSLENBQWFrRixPQUFiOztjQUVRcEYsSUFBUixDQUFhLENBQUNrRixPQUFkO2NBQ1FqRixJQUFSLENBQWEsQ0FBQ2tGLE9BQWQ7Y0FDUWpGLElBQVIsQ0FBYSxDQUFDa0YsT0FBZDs7Z0JBRVVXLFdBQVYsQ0FDRXhILE9BREYsRUFFRXFCLFlBQVlnRixFQUZkOztpQkFLV21CLFdBQVgsQ0FDRXZILE9BREYsRUFFRW9CLFlBQVlrRixFQUZkOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkEwQmtCVyxRQUFsQjtLQXRIWSxFQXVIWCxFQXZIVyxDQUFkO0dBbkJGOzttQkE2SWlCTyxVQUFqQixHQUE4QixVQUFDcEcsV0FBRCxFQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFpQnJDSSxJQUFSLENBQWEsSUFBYjtZQUNRQyxJQUFSLENBQWEsQ0FBYjtZQUNRQyxJQUFSLENBQWEsQ0FBYjs7YUFFU04sWUFBWXJPLElBQXJCLEVBQTJCMFUsUUFBM0IsQ0FDRTFILE9BREYsRUFFRXFCLFlBQVlnRixFQUZkO0dBckJGOzttQkEyQmlCc0IsaUJBQWpCLEdBQXFDLFVBQUN0RyxXQUFELEVBQWlCOztRQUVoRHVHLFFBQVEsSUFBSXJHLEtBQUtzRyxLQUFULEVBQVo7UUFDSUMsT0FBT3pHLFlBQVl1RyxLQUFaLENBQWtCMWMsUUFBN0I7O1VBRU02YyxZQUFOLENBQW1CLElBQUl4RyxLQUFLdUMsU0FBVCxDQUFtQmdFLEtBQUssQ0FBTCxDQUFuQixFQUE0QkEsS0FBSyxDQUFMLENBQTVCLEVBQXFDQSxLQUFLLENBQUwsQ0FBckMsQ0FBbkI7UUFDSXpHLFlBQVl1RyxLQUFaLENBQWtCSSxHQUF0QixFQUEyQkosTUFBTUssT0FBTixDQUFjNUcsWUFBWXVHLEtBQVosQ0FBa0JJLEdBQWhDO1FBQ3ZCM0csWUFBWXVHLEtBQVosQ0FBa0JNLEdBQXRCLEVBQTJCTixNQUFNTyxPQUFOLENBQWM5RyxZQUFZdUcsS0FBWixDQUFrQk0sR0FBaEM7UUFDdkI3RyxZQUFZdUcsS0FBWixDQUFrQlEsS0FBdEIsRUFBNkJSLE1BQU1TLFNBQU4sQ0FBZ0JoSCxZQUFZdUcsS0FBWixDQUFrQlEsS0FBbEM7Ozs7Ozs7Ozs7Ozs7YUFhcEIvRyxZQUFZck8sSUFBckIsRUFDRzJVLGlCQURILENBRUlDLEtBRkosRUFHSXZILFNBQVNnQixZQUFZK0IsSUFBckIsQ0FISjtHQXJCRjs7bUJBNEJpQmtGLFNBQWpCLEdBQTZCLFVBQUNqSCxXQUFELEVBQWlCO1FBQ3hDK0IsYUFBSjtRQUFVbUYsb0JBQVY7O1FBRUlsSCxZQUFZOVMsSUFBWixDQUFpQnBCLE9BQWpCLENBQXlCLE1BQXpCLE1BQXFDLENBQUMsQ0FBMUMsRUFBNkM7YUFDcENnVyxlQUFlOUIsV0FBZixDQUFQOztVQUVNbUgsV0FBV3BGLEtBQUtxRixTQUFMLEVBQWpCOztVQUVJcEgsWUFBWXFILFdBQWhCLEVBQTZCRixTQUFTRyxlQUFULENBQXlCdEgsWUFBWXFILFdBQXJDO1VBQ3pCckgsWUFBWXVILFdBQWhCLEVBQTZCSixTQUFTSyxlQUFULENBQXlCeEgsWUFBWXVILFdBQXJDO1VBQ3pCdkgsWUFBWXlILFdBQWhCLEVBQTZCTixTQUFTTyxlQUFULENBQXlCMUgsWUFBWXlILFdBQXJDO1VBQ3pCekgsWUFBWTJILFdBQWhCLEVBQTZCUixTQUFTUyxlQUFULENBQXlCNUgsWUFBWTJILFdBQXJDO2VBQ3BCRSxjQUFULENBQXdCLElBQXhCO2VBQ1NDLE9BQVQsQ0FBaUI5SCxZQUFZK0gsUUFBN0I7ZUFDU0MsT0FBVCxDQUFpQmhJLFlBQVlpSSxPQUE3QjtVQUNJakksWUFBWWtJLFFBQWhCLEVBQTBCZixTQUFTZ0IsT0FBVCxDQUFpQm5JLFlBQVlrSSxRQUE3QjtVQUN0QmxJLFlBQVlvSSxJQUFoQixFQUFzQmpCLFNBQVNrQixPQUFULENBQWlCckksWUFBWW9JLElBQTdCO1VBQ2xCcEksWUFBWXNJLElBQWhCLEVBQXNCbkIsU0FBU29CLE9BQVQsQ0FBaUJ2SSxZQUFZc0ksSUFBN0I7VUFDbEJ0SSxZQUFZd0ksY0FBaEIsRUFBZ0NyQixTQUFTc0IsUUFBVCxDQUFrQnpJLFlBQVl3SSxjQUE5QjtVQUM1QnhJLFlBQVkwSSxhQUFoQixFQUErQnZCLFNBQVN3QixRQUFULENBQWtCM0ksWUFBWTBJLGFBQTlCOztVQUUzQjFJLFlBQVk0SSxJQUFoQixFQUFzQjdHLEtBQUs4RyxlQUFMLEdBQXVCOUQsRUFBdkIsQ0FBMEIsQ0FBMUIsRUFBNkIrRCxVQUE3QixDQUF3QzlJLFlBQVk0SSxJQUFwRDtVQUNsQjVJLFlBQVkrSSxJQUFoQixFQUFzQmhILEtBQUs4RyxlQUFMLEdBQXVCOUQsRUFBdkIsQ0FBMEIsQ0FBMUIsRUFBNkJpRSxVQUE3QixDQUF3Q2hKLFlBQVkrSSxJQUFwRDtVQUNsQi9JLFlBQVlpSixJQUFoQixFQUFzQmxILEtBQUs4RyxlQUFMLEdBQXVCOUQsRUFBdkIsQ0FBMEIsQ0FBMUIsRUFBNkJtRSxVQUE3QixDQUF3Q2xKLFlBQVlpSixJQUFwRDs7V0FFakJFLFVBQUwsQ0FBZ0JwSCxJQUFoQixFQUFzQjdCLEtBQUtrSixpQkFBM0IsRUFBOENDLGlCQUE5QyxHQUFrRUMsU0FBbEUsQ0FDRSxPQUFPdEosWUFBWXVKLE1BQW5CLEtBQThCLFdBQTlCLEdBQTRDdkosWUFBWXVKLE1BQXhELEdBQWlFLEdBRG5FOzs7OztXQU9LQyxrQkFBTCxDQUF3QnhKLFlBQVl5SixLQUFaLElBQXFCLENBQTdDO1dBQ0t2YyxJQUFMLEdBQVksQ0FBWixDQTlCMkM7VUErQnZDOFMsWUFBWTlTLElBQVosS0FBcUIsY0FBekIsRUFBeUM2VSxLQUFLMkgsSUFBTCxHQUFZLElBQVo7VUFDckMxSixZQUFZOVMsSUFBWixLQUFxQixlQUF6QixFQUEwQzZVLEtBQUs0SCxLQUFMLEdBQWEsSUFBYjs7aUJBRS9CMUosV0FBWDs7O1lBR01HLElBQU4sQ0FBV0osWUFBWTFVLFFBQVosQ0FBcUI1QyxDQUFoQztZQUNNMlgsSUFBTixDQUFXTCxZQUFZMVUsUUFBWixDQUFxQjNDLENBQWhDO1lBQ00yWCxJQUFOLENBQVdOLFlBQVkxVSxRQUFaLENBQXFCMUMsQ0FBaEM7WUFDTWdoQixJQUFOLENBQVc1SixZQUFZMVUsUUFBWixDQUFxQnpDLENBQWhDO1dBQ0tnaEIsTUFBTCxDQUFZL0ssS0FBWjs7Y0FFUXNCLElBQVIsQ0FBYUosWUFBWW5XLFFBQVosQ0FBcUJuQixDQUFsQztjQUNRMlgsSUFBUixDQUFhTCxZQUFZblcsUUFBWixDQUFxQmxCLENBQWxDO2NBQ1EyWCxJQUFSLENBQWFOLFlBQVluVyxRQUFaLENBQXFCakIsQ0FBbEM7V0FDS2toQixTQUFMLENBQWVuTCxPQUFmOztjQUVReUIsSUFBUixDQUFhSixZQUFZM0gsS0FBWixDQUFrQjNQLENBQS9CO2NBQ1EyWCxJQUFSLENBQWFMLFlBQVkzSCxLQUFaLENBQWtCMVAsQ0FBL0I7Y0FDUTJYLElBQVIsQ0FBYU4sWUFBWTNILEtBQVosQ0FBa0J6UCxDQUEvQjtXQUNLeVAsS0FBTCxDQUFXc0csT0FBWDs7V0FFS29MLFlBQUwsQ0FBa0IvSixZQUFZZ0ssSUFBOUIsRUFBb0MsS0FBcEM7WUFDTUMsV0FBTixDQUFrQmxJLElBQWxCLEVBQXdCLENBQXhCLEVBQTJCLENBQUMsQ0FBNUI7VUFDSS9CLFlBQVk5UyxJQUFaLEtBQXFCLGFBQXpCLEVBQXdDd1IseUJBQXlCcUQsS0FBS21JLFdBQUwsR0FBbUI1VixJQUFuQixLQUE0QixDQUFyRCxDQUF4QyxLQUNLLElBQUkwTCxZQUFZOVMsSUFBWixLQUFxQixjQUF6QixFQUF5Q3dSLHlCQUF5QnFELEtBQUsrQyxXQUFMLEdBQW1CeFEsSUFBbkIsRUFBekIsQ0FBekMsS0FDQW9LLHlCQUF5QnFELEtBQUsrQyxXQUFMLEdBQW1CeFEsSUFBbkIsS0FBNEIsQ0FBckQ7OztLQXpEUCxNQTZESztVQUNDd0wsUUFBUUMsWUFBWUMsV0FBWixDQUFaOztVQUVJLENBQUNGLEtBQUwsRUFBWTs7O1VBR1JFLFlBQVl2VixRQUFoQixFQUEwQjtZQUNsQjBmLGlCQUFpQixJQUFJakssS0FBS0MsZUFBVCxFQUF2Qjt1QkFDZWlLLGFBQWYsQ0FBNkJuTSxVQUE3QixFQUF5QzZCLEtBQXpDOzthQUVLLElBQUl0VixJQUFJLENBQWIsRUFBZ0JBLElBQUl3VixZQUFZdlYsUUFBWixDQUFxQkMsTUFBekMsRUFBaURGLEdBQWpELEVBQXNEO2NBQzlDNmYsU0FBU3JLLFlBQVl2VixRQUFaLENBQXFCRCxDQUFyQixDQUFmOztjQUVNOGYsUUFBUSxJQUFJcEssS0FBS2dELFdBQVQsRUFBZDtnQkFDTWpELFdBQU47O2tCQUVRRyxJQUFSLENBQWFpSyxPQUFPaGYsZUFBUCxDQUF1QjNDLENBQXBDO2tCQUNRMlgsSUFBUixDQUFhZ0ssT0FBT2hmLGVBQVAsQ0FBdUIxQyxDQUFwQztrQkFDUTJYLElBQVIsQ0FBYStKLE9BQU9oZixlQUFQLENBQXVCekMsQ0FBcEM7Z0JBQ00yaEIsU0FBTixDQUFnQjVMLE9BQWhCOztnQkFFTXlCLElBQU4sQ0FBV2lLLE9BQU8vZSxRQUFQLENBQWdCNUMsQ0FBM0I7Z0JBQ00yWCxJQUFOLENBQVdnSyxPQUFPL2UsUUFBUCxDQUFnQjNDLENBQTNCO2dCQUNNMlgsSUFBTixDQUFXK0osT0FBTy9lLFFBQVAsQ0FBZ0IxQyxDQUEzQjtnQkFDTWdoQixJQUFOLENBQVdTLE9BQU8vZSxRQUFQLENBQWdCekMsQ0FBM0I7Z0JBQ00yaEIsV0FBTixDQUFrQjFMLEtBQWxCOztrQkFFUWlCLFlBQVlDLFlBQVl2VixRQUFaLENBQXFCRCxDQUFyQixDQUFaLENBQVI7eUJBQ2U0ZixhQUFmLENBQTZCRSxLQUE3QixFQUFvQ3hLLEtBQXBDO2VBQ0sySyxPQUFMLENBQWFILEtBQWI7OztnQkFHTUgsY0FBUjt5QkFDaUJuSyxZQUFZM1MsRUFBN0IsSUFBbUN5UyxLQUFuQzs7O2NBR01NLElBQVIsQ0FBYUosWUFBWTNILEtBQVosQ0FBa0IzUCxDQUEvQjtjQUNRMlgsSUFBUixDQUFhTCxZQUFZM0gsS0FBWixDQUFrQjFQLENBQS9CO2NBQ1EyWCxJQUFSLENBQWFOLFlBQVkzSCxLQUFaLENBQWtCelAsQ0FBL0I7O1lBRU04aEIsZUFBTixDQUFzQi9MLE9BQXRCO1lBQ00ySyxTQUFOLENBQ0UsT0FBT3RKLFlBQVl1SixNQUFuQixLQUE4QixXQUE5QixHQUE0Q3ZKLFlBQVl1SixNQUF4RCxHQUFpRSxDQURuRTs7Y0FJUW5KLElBQVIsQ0FBYSxDQUFiO2NBQ1FDLElBQVIsQ0FBYSxDQUFiO2NBQ1FDLElBQVIsQ0FBYSxDQUFiO1lBQ01xSyxxQkFBTixDQUE0QjNLLFlBQVlnSyxJQUF4QyxFQUE4Q3JMLE9BQTlDOztpQkFFV3NCLFdBQVg7O2NBRVFHLElBQVIsQ0FBYUosWUFBWW5XLFFBQVosQ0FBcUJuQixDQUFsQztjQUNRMlgsSUFBUixDQUFhTCxZQUFZblcsUUFBWixDQUFxQmxCLENBQWxDO2NBQ1EyWCxJQUFSLENBQWFOLFlBQVluVyxRQUFaLENBQXFCakIsQ0FBbEM7aUJBQ1cyaEIsU0FBWCxDQUFxQjNMLE9BQXJCOztZQUVNd0IsSUFBTixDQUFXSixZQUFZMVUsUUFBWixDQUFxQjVDLENBQWhDO1lBQ00yWCxJQUFOLENBQVdMLFlBQVkxVSxRQUFaLENBQXFCM0MsQ0FBaEM7WUFDTTJYLElBQU4sQ0FBV04sWUFBWTFVLFFBQVosQ0FBcUIxQyxDQUFoQztZQUNNZ2hCLElBQU4sQ0FBVzVKLFlBQVkxVSxRQUFaLENBQXFCekMsQ0FBaEM7aUJBQ1cyaEIsV0FBWCxDQUF1QjFMLEtBQXZCOztvQkFFYyxJQUFJb0IsS0FBSzBLLG9CQUFULENBQThCM00sVUFBOUIsQ0FBZCxDQS9ERztVQWdFRzRNLFNBQVMsSUFBSTNLLEtBQUs0SywyQkFBVCxDQUFxQzlLLFlBQVlnSyxJQUFqRCxFQUF1RDlDLFdBQXZELEVBQW9FcEgsS0FBcEUsRUFBMkVuQixPQUEzRSxDQUFmOzthQUVPb00sY0FBUCxDQUFzQi9LLFlBQVkrSCxRQUFsQzthQUNPaUQsaUJBQVAsQ0FBeUJoTCxZQUFZaUwsV0FBckM7YUFDT0MsbUJBQVAsQ0FBMkJsTCxZQUFZaUksT0FBdkM7YUFDT2tELG9CQUFQLENBQTRCbkwsWUFBWWlJLE9BQXhDOzthQUVPLElBQUkvSCxLQUFLa0wsV0FBVCxDQUFxQlAsTUFBckIsQ0FBUDtXQUNLckIsa0JBQUwsQ0FBd0J4SixZQUFZeUosS0FBWixJQUFxQixDQUE3QztXQUNLZ0IsT0FBTCxDQUFhSSxNQUFiOztVQUVJLE9BQU83SyxZQUFZcUwsZUFBbkIsS0FBdUMsV0FBM0MsRUFBd0R0SixLQUFLdUosaUJBQUwsQ0FBdUJ0TCxZQUFZcUwsZUFBbkM7O1VBRXBEckwsWUFBWXVMLEtBQVosSUFBcUJ2TCxZQUFZd0wsSUFBckMsRUFBMkNyYSxNQUFNc2EsWUFBTixDQUFtQjFKLElBQW5CLEVBQXlCL0IsWUFBWXVMLEtBQXJDLEVBQTRDdkwsWUFBWXdMLElBQXhELEVBQTNDLEtBQ0tyYSxNQUFNc2EsWUFBTixDQUFtQjFKLElBQW5CO1dBQ0E3VSxJQUFMLEdBQVksQ0FBWixDQS9FRzs7OztTQW1GQXdlLFFBQUw7O1NBRUtyZSxFQUFMLEdBQVUyUyxZQUFZM1MsRUFBdEI7YUFDUzBVLEtBQUsxVSxFQUFkLElBQW9CMFUsSUFBcEI7bUJBQ2VBLEtBQUsxVSxFQUFwQixJQUEwQjZaLFdBQTFCOztrQkFFY25GLEtBQUs0SixDQUFMLEtBQVc1ZSxTQUFYLEdBQXVCZ1YsS0FBS1IsR0FBNUIsR0FBa0NRLEtBQUs0SixDQUFyRCxJQUEwRDVKLEtBQUsxVSxFQUEvRDs7O1NBR0ssRUFBRWtHLEtBQUssYUFBUCxFQUFzQkMsUUFBUXVPLEtBQUsxVSxFQUFuQyxFQUFMO0dBNUpGOzttQkErSmlCdWUsVUFBakIsR0FBOEIsVUFBQzVMLFdBQUQsRUFBaUI7UUFDdkM2TCxpQkFBaUIsSUFBSTNMLEtBQUs0TCxlQUFULEVBQXZCOzttQkFFZUMseUJBQWYsQ0FBeUMvTCxZQUFZalEsb0JBQXJEO21CQUNlaWMsMkJBQWYsQ0FBMkNoTSxZQUFZaFEsc0JBQXZEO21CQUNlaWMsdUJBQWYsQ0FBdUNqTSxZQUFZL1Asa0JBQW5EO21CQUNlaWMsMkJBQWYsQ0FBMkNsTSxZQUFZOVAscUJBQXZEO21CQUNlaWMsd0JBQWYsQ0FBd0NuTSxZQUFZNVAsb0JBQXBEOztRQUVNbUcsVUFBVSxJQUFJMkosS0FBS2tNLGdCQUFULENBQ2RQLGNBRGMsRUFFZDdNLFNBQVNnQixZQUFZcU0sU0FBckIsQ0FGYyxFQUdkLElBQUluTSxLQUFLb00seUJBQVQsQ0FBbUNuYixLQUFuQyxDQUhjLENBQWhCOztZQU1RekIsTUFBUixHQUFpQm1jLGNBQWpCO2FBQ1M3TCxZQUFZcU0sU0FBckIsRUFBZ0M3QyxrQkFBaEMsQ0FBbUQsQ0FBbkQ7WUFDUStDLG1CQUFSLENBQTRCLENBQTVCLEVBQStCLENBQS9CLEVBQWtDLENBQWxDOztVQUVNWCxVQUFOLENBQWlCclYsT0FBakI7Y0FDVXlKLFlBQVkzUyxFQUF0QixJQUE0QmtKLE9BQTVCO0dBcEJGO21CQXNCaUJpVyxhQUFqQixHQUFpQyxVQUFDeE0sV0FBRCxFQUFpQjtjQUN0Q0EsWUFBWTNTLEVBQXRCLElBQTRCLElBQTVCO0dBREY7O21CQUlpQm9mLFFBQWpCLEdBQTRCLFVBQUN6TSxXQUFELEVBQWlCO1FBQ3ZDZixVQUFVZSxZQUFZM1MsRUFBdEIsTUFBOEJOLFNBQWxDLEVBQTZDO1VBQ3ZDMkMsU0FBU3VQLFVBQVVlLFlBQVkzUyxFQUF0QixFQUEwQnFDLE1BQXZDO1VBQ0lzUSxZQUFZdFEsTUFBWixLQUF1QjNDLFNBQTNCLEVBQXNDO2lCQUMzQixJQUFJbVQsS0FBSzRMLGVBQVQsRUFBVDtlQUNPQyx5QkFBUCxDQUFpQy9MLFlBQVl0USxNQUFaLENBQW1CSyxvQkFBcEQ7ZUFDT2ljLDJCQUFQLENBQW1DaE0sWUFBWXRRLE1BQVosQ0FBbUJNLHNCQUF0RDtlQUNPaWMsdUJBQVAsQ0FBK0JqTSxZQUFZdFEsTUFBWixDQUFtQk8sa0JBQWxEO2VBQ09pYywyQkFBUCxDQUFtQ2xNLFlBQVl0USxNQUFaLENBQW1CUSxxQkFBdEQ7ZUFDT2ljLHdCQUFQLENBQWdDbk0sWUFBWXRRLE1BQVosQ0FBbUJVLG9CQUFuRDs7O2NBR01nUSxJQUFSLENBQWFKLFlBQVl6UCxnQkFBWixDQUE2QjdILENBQTFDO2NBQ1EyWCxJQUFSLENBQWFMLFlBQVl6UCxnQkFBWixDQUE2QjVILENBQTFDO2NBQ1EyWCxJQUFSLENBQWFOLFlBQVl6UCxnQkFBWixDQUE2QjNILENBQTFDOztjQUVRd1gsSUFBUixDQUFhSixZQUFZeFAsZUFBWixDQUE0QjlILENBQXpDO2NBQ1EyWCxJQUFSLENBQWFMLFlBQVl4UCxlQUFaLENBQTRCN0gsQ0FBekM7Y0FDUTJYLElBQVIsQ0FBYU4sWUFBWXhQLGVBQVosQ0FBNEI1SCxDQUF6Qzs7Y0FFUXdYLElBQVIsQ0FBYUosWUFBWXZQLFVBQVosQ0FBdUIvSCxDQUFwQztjQUNRMlgsSUFBUixDQUFhTCxZQUFZdlAsVUFBWixDQUF1QjlILENBQXBDO2NBQ1EyWCxJQUFSLENBQWFOLFlBQVl2UCxVQUFaLENBQXVCN0gsQ0FBcEM7O2dCQUVVb1gsWUFBWTNTLEVBQXRCLEVBQTBCb2YsUUFBMUIsQ0FDRTlOLE9BREYsRUFFRUMsT0FGRixFQUdFQyxPQUhGLEVBSUVtQixZQUFZdFAsc0JBSmQsRUFLRXNQLFlBQVlyUCxZQUxkLEVBTUVqQixNQU5GLEVBT0VzUSxZQUFZcFAsY0FQZDs7Ozs7UUFhRXVELG9CQUFKLEVBQTBCO3NCQUNSLElBQUl2QixZQUFKLENBQWlCLElBQUk0TCxjQUFjeFcsc0JBQW5DLENBQWhCLENBRHdCO29CQUVWLENBQWQsSUFBbUJILGNBQWNzTCxhQUFqQztLQUZGLE1BSUtxTSxnQkFBZ0IsQ0FBQzNYLGNBQWNzTCxhQUFmLENBQWhCO0dBekNQOzttQkE0Q2lCdVosV0FBakIsR0FBK0IsVUFBQ0MsT0FBRCxFQUFhO1FBQ3RDMU4sVUFBVTBOLFFBQVF0ZixFQUFsQixNQUEwQk4sU0FBOUIsRUFBeUNrUyxVQUFVME4sUUFBUXRmLEVBQWxCLEVBQXNCdWYsZ0JBQXRCLENBQXVDRCxRQUFRdGIsUUFBL0MsRUFBeURzYixRQUFROWIsS0FBakU7R0FEM0M7O21CQUlpQmdjLFFBQWpCLEdBQTRCLFVBQUNGLE9BQUQsRUFBYTtRQUNuQzFOLFVBQVUwTixRQUFRdGYsRUFBbEIsTUFBMEJOLFNBQTlCLEVBQXlDa1MsVUFBVTBOLFFBQVF0ZixFQUFsQixFQUFzQndmLFFBQXRCLENBQStCRixRQUFRcmIsS0FBdkMsRUFBOENxYixRQUFROWIsS0FBdEQ7R0FEM0M7O21CQUlpQmljLGdCQUFqQixHQUFvQyxVQUFDSCxPQUFELEVBQWE7UUFDM0MxTixVQUFVME4sUUFBUXRmLEVBQWxCLE1BQTBCTixTQUE5QixFQUF5Q2tTLFVBQVUwTixRQUFRdGYsRUFBbEIsRUFBc0J5ZixnQkFBdEIsQ0FBdUNILFFBQVFwYixLQUEvQyxFQUFzRG9iLFFBQVE5YixLQUE5RDtHQUQzQzs7bUJBSWlCa2MsWUFBakIsR0FBZ0MsVUFBQ0osT0FBRCxFQUFhO1FBQ3ZDM04sU0FBUzJOLFFBQVF0ZixFQUFqQixFQUFxQkgsSUFBckIsS0FBOEIsQ0FBbEMsRUFBcUM7OytCQUVWOFIsU0FBUzJOLFFBQVF0ZixFQUFqQixFQUFxQnlYLFdBQXJCLEdBQW1DeFEsSUFBbkMsRUFBekI7WUFDTTBZLGNBQU4sQ0FBcUJoTyxTQUFTMk4sUUFBUXRmLEVBQWpCLENBQXJCO0tBSEYsTUFLSyxJQUFJMlIsU0FBUzJOLFFBQVF0ZixFQUFqQixFQUFxQkgsSUFBckIsS0FBOEIsQ0FBbEMsRUFBcUM7O1lBRWxDK2YsZUFBTixDQUFzQmpPLFNBQVMyTixRQUFRdGYsRUFBakIsQ0FBdEI7V0FDS29kLE9BQUwsQ0FBYXlDLGVBQWVQLFFBQVF0ZixFQUF2QixDQUFiOzs7U0FHR29kLE9BQUwsQ0FBYXpMLFNBQVMyTixRQUFRdGYsRUFBakIsQ0FBYjtRQUNJOGYsaUJBQWlCUixRQUFRdGYsRUFBekIsQ0FBSixFQUFrQzZTLEtBQUt1SyxPQUFMLENBQWEwQyxpQkFBaUJSLFFBQVF0ZixFQUF6QixDQUFiO1FBQzlCK2Ysa0JBQWtCVCxRQUFRdGYsRUFBMUIsQ0FBSixFQUFtQzZTLEtBQUt1SyxPQUFMLENBQWEyQyxrQkFBa0JULFFBQVF0ZixFQUExQixDQUFiOztrQkFFckIyUixTQUFTMk4sUUFBUXRmLEVBQWpCLEVBQXFCc2UsQ0FBckIsS0FBMkI1ZSxTQUEzQixHQUF1Q2lTLFNBQVMyTixRQUFRdGYsRUFBakIsRUFBcUJzZSxDQUE1RCxHQUFnRTNNLFNBQVMyTixRQUFRdGYsRUFBakIsRUFBcUJrVSxHQUFuRyxJQUEwRyxJQUExRzthQUNTb0wsUUFBUXRmLEVBQWpCLElBQXVCLElBQXZCO21CQUNlc2YsUUFBUXRmLEVBQXZCLElBQTZCLElBQTdCOztRQUVJOGYsaUJBQWlCUixRQUFRdGYsRUFBekIsQ0FBSixFQUFrQzhmLGlCQUFpQlIsUUFBUXRmLEVBQXpCLElBQStCLElBQS9CO1FBQzlCK2Ysa0JBQWtCVCxRQUFRdGYsRUFBMUIsQ0FBSixFQUFtQytmLGtCQUFrQlQsUUFBUXRmLEVBQTFCLElBQWdDLElBQWhDOztHQXJCckM7O21CQXlCaUJnZ0IsZUFBakIsR0FBbUMsVUFBQ1YsT0FBRCxFQUFhO2NBQ3BDM04sU0FBUzJOLFFBQVF0ZixFQUFqQixDQUFWOztRQUVJMFEsUUFBUTdRLElBQVIsS0FBaUIsQ0FBckIsRUFBd0I7Y0FDZG9nQixjQUFSLEdBQXlCQyxpQkFBekIsQ0FBMkN0UCxVQUEzQzs7VUFFSTBPLFFBQVE1UyxHQUFaLEVBQWlCO2dCQUNQcUcsSUFBUixDQUFhdU0sUUFBUTVTLEdBQVIsQ0FBWXJSLENBQXpCO2dCQUNRMlgsSUFBUixDQUFhc00sUUFBUTVTLEdBQVIsQ0FBWXBSLENBQXpCO2dCQUNRMlgsSUFBUixDQUFhcU0sUUFBUTVTLEdBQVIsQ0FBWW5SLENBQXpCO21CQUNXMmhCLFNBQVgsQ0FBcUI1TCxPQUFyQjs7O1VBR0VnTyxRQUFRMVMsSUFBWixFQUFrQjtjQUNWbUcsSUFBTixDQUFXdU0sUUFBUTFTLElBQVIsQ0FBYXZSLENBQXhCO2NBQ00yWCxJQUFOLENBQVdzTSxRQUFRMVMsSUFBUixDQUFhdFIsQ0FBeEI7Y0FDTTJYLElBQU4sQ0FBV3FNLFFBQVExUyxJQUFSLENBQWFyUixDQUF4QjtjQUNNZ2hCLElBQU4sQ0FBVytDLFFBQVExUyxJQUFSLENBQWFwUixDQUF4QjttQkFDVzJoQixXQUFYLENBQXVCMUwsS0FBdkI7OztjQUdNME8saUJBQVIsQ0FBMEJ2UCxVQUExQjtjQUNReU4sUUFBUjtLQW5CRixNQXFCSyxJQUFJM04sUUFBUTdRLElBQVIsS0FBaUIsQ0FBckIsRUFBd0I7OztVQUd2QnlmLFFBQVE1UyxHQUFaLEVBQWlCO2dCQUNQcUcsSUFBUixDQUFhdU0sUUFBUTVTLEdBQVIsQ0FBWXJSLENBQXpCO2dCQUNRMlgsSUFBUixDQUFhc00sUUFBUTVTLEdBQVIsQ0FBWXBSLENBQXpCO2dCQUNRMlgsSUFBUixDQUFhcU0sUUFBUTVTLEdBQVIsQ0FBWW5SLENBQXpCO21CQUNXMmhCLFNBQVgsQ0FBcUI1TCxPQUFyQjs7O1VBR0VnTyxRQUFRMVMsSUFBWixFQUFrQjtjQUNWbUcsSUFBTixDQUFXdU0sUUFBUTFTLElBQVIsQ0FBYXZSLENBQXhCO2NBQ00yWCxJQUFOLENBQVdzTSxRQUFRMVMsSUFBUixDQUFhdFIsQ0FBeEI7Y0FDTTJYLElBQU4sQ0FBV3FNLFFBQVExUyxJQUFSLENBQWFyUixDQUF4QjtjQUNNZ2hCLElBQU4sQ0FBVytDLFFBQVExUyxJQUFSLENBQWFwUixDQUF4QjttQkFDVzJoQixXQUFYLENBQXVCMUwsS0FBdkI7OztjQUdNMk8sU0FBUixDQUFrQnhQLFVBQWxCOztHQTFDSjs7bUJBOENpQnlQLFVBQWpCLEdBQThCLFVBQUNmLE9BQUQsRUFBYTs7Y0FFL0IzTixTQUFTMk4sUUFBUXRmLEVBQWpCLENBQVY7OztVQUdNNGYsZUFBTixDQUFzQmxQLE9BQXRCOztZQUVRcUMsSUFBUixDQUFhLENBQWI7WUFDUUMsSUFBUixDQUFhLENBQWI7WUFDUUMsSUFBUixDQUFhLENBQWI7O1lBRVFxTixZQUFSLENBQXFCaEIsUUFBUTNDLElBQTdCLEVBQW1DckwsT0FBbkM7VUFDTThNLFlBQU4sQ0FBbUIxTixPQUFuQjtZQUNRMk4sUUFBUjtHQWJGOzttQkFnQmlCa0MsbUJBQWpCLEdBQXVDLFVBQUNqQixPQUFELEVBQWE7WUFDMUN2TSxJQUFSLENBQWF1TSxRQUFRamtCLENBQXJCO1lBQ1EyWCxJQUFSLENBQWFzTSxRQUFRaGtCLENBQXJCO1lBQ1EyWCxJQUFSLENBQWFxTSxRQUFRL2pCLENBQXJCOzthQUVTK2pCLFFBQVF0ZixFQUFqQixFQUFxQnVnQixtQkFBckIsQ0FBeUNqUCxPQUF6QzthQUNTZ08sUUFBUXRmLEVBQWpCLEVBQXFCcWUsUUFBckI7R0FORjs7bUJBU2lCbUMsWUFBakIsR0FBZ0MsVUFBQ2xCLE9BQUQsRUFBYTtZQUNuQ3ZNLElBQVIsQ0FBYXVNLFFBQVFtQixTQUFyQjtZQUNRek4sSUFBUixDQUFhc00sUUFBUW9CLFNBQXJCO1lBQ1F6TixJQUFSLENBQWFxTSxRQUFRcUIsU0FBckI7O1lBRVE1TixJQUFSLENBQWF1TSxRQUFRamtCLENBQXJCO1lBQ1EyWCxJQUFSLENBQWFzTSxRQUFRaGtCLENBQXJCO1lBQ1EyWCxJQUFSLENBQWFxTSxRQUFRL2pCLENBQXJCOzthQUVTK2pCLFFBQVF0ZixFQUFqQixFQUFxQndnQixZQUFyQixDQUNFbFAsT0FERixFQUVFQyxPQUZGO2FBSVMrTixRQUFRdGYsRUFBakIsRUFBcUJxZSxRQUFyQjtHQWJGOzttQkFnQmlCdUMsV0FBakIsR0FBK0IsVUFBQ3RCLE9BQUQsRUFBYTtZQUNsQ3ZNLElBQVIsQ0FBYXVNLFFBQVF1QixRQUFyQjtZQUNRN04sSUFBUixDQUFhc00sUUFBUXdCLFFBQXJCO1lBQ1E3TixJQUFSLENBQWFxTSxRQUFReUIsUUFBckI7O2FBRVN6QixRQUFRdGYsRUFBakIsRUFBcUI0Z0IsV0FBckIsQ0FDRXRQLE9BREY7YUFHU2dPLFFBQVF0ZixFQUFqQixFQUFxQnFlLFFBQXJCO0dBUkY7O21CQVdpQjJDLGlCQUFqQixHQUFxQyxVQUFDMUIsT0FBRCxFQUFhO1lBQ3hDdk0sSUFBUixDQUFhdU0sUUFBUWprQixDQUFyQjtZQUNRMlgsSUFBUixDQUFhc00sUUFBUWhrQixDQUFyQjtZQUNRMlgsSUFBUixDQUFhcU0sUUFBUS9qQixDQUFyQjs7YUFFUytqQixRQUFRdGYsRUFBakIsRUFBcUJnaEIsaUJBQXJCLENBQXVDMVAsT0FBdkM7YUFDU2dPLFFBQVF0ZixFQUFqQixFQUFxQnFlLFFBQXJCO0dBTkY7O21CQVNpQjRDLFVBQWpCLEdBQThCLFVBQUMzQixPQUFELEVBQWE7WUFDakN2TSxJQUFSLENBQWF1TSxRQUFRckgsT0FBckI7WUFDUWpGLElBQVIsQ0FBYXNNLFFBQVFwSCxPQUFyQjtZQUNRakYsSUFBUixDQUFhcU0sUUFBUW5ILE9BQXJCOztZQUVRcEYsSUFBUixDQUFhdU0sUUFBUWprQixDQUFyQjtZQUNRMlgsSUFBUixDQUFhc00sUUFBUWhrQixDQUFyQjtZQUNRMlgsSUFBUixDQUFhcU0sUUFBUS9qQixDQUFyQjs7YUFFUytqQixRQUFRdGYsRUFBakIsRUFBcUJpaEIsVUFBckIsQ0FDRTNQLE9BREYsRUFFRUMsT0FGRjthQUlTK04sUUFBUXRmLEVBQWpCLEVBQXFCcWUsUUFBckI7R0FiRjs7bUJBZ0JpQjZDLGtCQUFqQixHQUFzQyxZQUFNO0FBQzFDQyxBQUNELEdBRkQ7O21CQUlpQkMsa0JBQWpCLEdBQXNDLFVBQUM5QixPQUFELEVBQWE7WUFDekN2TSxJQUFSLENBQWF1TSxRQUFRamtCLENBQXJCO1lBQ1EyWCxJQUFSLENBQWFzTSxRQUFRaGtCLENBQXJCO1lBQ1EyWCxJQUFSLENBQWFxTSxRQUFRL2pCLENBQXJCOzthQUVTK2pCLFFBQVF0ZixFQUFqQixFQUFxQm9oQixrQkFBckIsQ0FDRTlQLE9BREY7YUFHU2dPLFFBQVF0ZixFQUFqQixFQUFxQnFlLFFBQXJCO0dBUkY7O21CQVdpQmdELGlCQUFqQixHQUFxQyxVQUFDL0IsT0FBRCxFQUFhO1lBQ3hDdk0sSUFBUixDQUFhdU0sUUFBUWprQixDQUFyQjtZQUNRMlgsSUFBUixDQUFhc00sUUFBUWhrQixDQUFyQjtZQUNRMlgsSUFBUixDQUFhcU0sUUFBUS9qQixDQUFyQjs7YUFFUytqQixRQUFRdGYsRUFBakIsRUFBcUJxaEIsaUJBQXJCLENBQ0UvUCxPQURGO2FBR1NnTyxRQUFRdGYsRUFBakIsRUFBcUJxZSxRQUFyQjtHQVJGOzttQkFXaUJpRCxnQkFBakIsR0FBb0MsVUFBQ2hDLE9BQUQsRUFBYTtZQUN2Q3ZNLElBQVIsQ0FBYXVNLFFBQVFqa0IsQ0FBckI7WUFDUTJYLElBQVIsQ0FBYXNNLFFBQVFoa0IsQ0FBckI7WUFDUTJYLElBQVIsQ0FBYXFNLFFBQVEvakIsQ0FBckI7O2FBRVMrakIsUUFBUXRmLEVBQWpCLEVBQXFCc2hCLGdCQUFyQixDQUNFaFEsT0FERjtHQUxGOzttQkFVaUJpUSxlQUFqQixHQUFtQyxVQUFDakMsT0FBRCxFQUFhO1lBQ3RDdk0sSUFBUixDQUFhdU0sUUFBUWprQixDQUFyQjtZQUNRMlgsSUFBUixDQUFhc00sUUFBUWhrQixDQUFyQjtZQUNRMlgsSUFBUixDQUFhcU0sUUFBUS9qQixDQUFyQjs7YUFFUytqQixRQUFRdGYsRUFBakIsRUFBcUJ1aEIsZUFBckIsQ0FDRWpRLE9BREY7R0FMRjs7bUJBVWlCa1EsVUFBakIsR0FBOEIsVUFBQ2xDLE9BQUQsRUFBYTthQUNoQ0EsUUFBUXRmLEVBQWpCLEVBQXFCd2hCLFVBQXJCLENBQWdDbEMsUUFBUTVkLE1BQXhDLEVBQWdENGQsUUFBUTNkLE9BQXhEO0dBREY7O21CQUlpQjhmLHFCQUFqQixHQUF5QyxVQUFDbkMsT0FBRCxFQUFhO2FBQzNDQSxRQUFRdGYsRUFBakIsRUFBcUJ5aEIscUJBQXJCLENBQTJDbkMsUUFBUW9DLFNBQW5EO0dBREY7O21CQUlpQkMsdUJBQWpCLEdBQTJDLFVBQUNyQyxPQUFELEVBQWE7YUFDN0NBLFFBQVF0ZixFQUFqQixFQUFxQjJoQix1QkFBckIsQ0FBNkNyQyxRQUFRbE0sTUFBckQ7R0FERjs7bUJBSWlCbEgsYUFBakIsR0FBaUMsVUFBQ29ULE9BQUQsRUFBYTtRQUN4Qy9lLG1CQUFKOztZQUVRK2UsUUFBUXpmLElBQWhCOztXQUVLLE9BQUw7O2NBRVF5ZixRQUFRN2YsT0FBUixLQUFvQkMsU0FBeEIsRUFBbUM7b0JBQ3pCcVQsSUFBUixDQUFhdU0sUUFBUXJmLFNBQVIsQ0FBa0I1RSxDQUEvQjtvQkFDUTJYLElBQVIsQ0FBYXNNLFFBQVFyZixTQUFSLENBQWtCM0UsQ0FBL0I7b0JBQ1EyWCxJQUFSLENBQWFxTSxRQUFRcmYsU0FBUixDQUFrQjFFLENBQS9COzt5QkFFYSxJQUFJc1gsS0FBSytPLHVCQUFULENBQ1hqUSxTQUFTMk4sUUFBUTlmLE9BQWpCLENBRFcsRUFFWDhSLE9BRlcsQ0FBYjtXQUxGLE1BVUs7b0JBQ0t5QixJQUFSLENBQWF1TSxRQUFRcmYsU0FBUixDQUFrQjVFLENBQS9CO29CQUNRMlgsSUFBUixDQUFhc00sUUFBUXJmLFNBQVIsQ0FBa0IzRSxDQUEvQjtvQkFDUTJYLElBQVIsQ0FBYXFNLFFBQVFyZixTQUFSLENBQWtCMUUsQ0FBL0I7O29CQUVRd1gsSUFBUixDQUFhdU0sUUFBUW5mLFNBQVIsQ0FBa0I5RSxDQUEvQjtvQkFDUTJYLElBQVIsQ0FBYXNNLFFBQVFuZixTQUFSLENBQWtCN0UsQ0FBL0I7b0JBQ1EyWCxJQUFSLENBQWFxTSxRQUFRbmYsU0FBUixDQUFrQjVFLENBQS9COzt5QkFFYSxJQUFJc1gsS0FBSytPLHVCQUFULENBQ1hqUSxTQUFTMk4sUUFBUTlmLE9BQWpCLENBRFcsRUFFWG1TLFNBQVMyTixRQUFRN2YsT0FBakIsQ0FGVyxFQUdYNlIsT0FIVyxFQUlYQyxPQUpXLENBQWI7Ozs7V0FTRCxPQUFMOztjQUVRK04sUUFBUTdmLE9BQVIsS0FBb0JDLFNBQXhCLEVBQW1DO29CQUN6QnFULElBQVIsQ0FBYXVNLFFBQVFyZixTQUFSLENBQWtCNUUsQ0FBL0I7b0JBQ1EyWCxJQUFSLENBQWFzTSxRQUFRcmYsU0FBUixDQUFrQjNFLENBQS9CO29CQUNRMlgsSUFBUixDQUFhcU0sUUFBUXJmLFNBQVIsQ0FBa0IxRSxDQUEvQjs7b0JBRVF3WCxJQUFSLENBQWF1TSxRQUFRemUsSUFBUixDQUFheEYsQ0FBMUI7b0JBQ1EyWCxJQUFSLENBQWFzTSxRQUFRemUsSUFBUixDQUFhdkYsQ0FBMUI7b0JBQ1EyWCxJQUFSLENBQWFxTSxRQUFRemUsSUFBUixDQUFhdEYsQ0FBMUI7O3lCQUVhLElBQUlzWCxLQUFLZ1AsaUJBQVQsQ0FDWGxRLFNBQVMyTixRQUFROWYsT0FBakIsQ0FEVyxFQUVYOFIsT0FGVyxFQUdYQyxPQUhXLENBQWI7V0FURixNQWdCSztvQkFDS3dCLElBQVIsQ0FBYXVNLFFBQVFyZixTQUFSLENBQWtCNUUsQ0FBL0I7b0JBQ1EyWCxJQUFSLENBQWFzTSxRQUFRcmYsU0FBUixDQUFrQjNFLENBQS9CO29CQUNRMlgsSUFBUixDQUFhcU0sUUFBUXJmLFNBQVIsQ0FBa0IxRSxDQUEvQjs7b0JBRVF3WCxJQUFSLENBQWF1TSxRQUFRbmYsU0FBUixDQUFrQjlFLENBQS9CO29CQUNRMlgsSUFBUixDQUFhc00sUUFBUW5mLFNBQVIsQ0FBa0I3RSxDQUEvQjtvQkFDUTJYLElBQVIsQ0FBYXFNLFFBQVFuZixTQUFSLENBQWtCNUUsQ0FBL0I7O29CQUVRd1gsSUFBUixDQUFhdU0sUUFBUXplLElBQVIsQ0FBYXhGLENBQTFCO29CQUNRMlgsSUFBUixDQUFhc00sUUFBUXplLElBQVIsQ0FBYXZGLENBQTFCO29CQUNRMlgsSUFBUixDQUFhcU0sUUFBUXplLElBQVIsQ0FBYXRGLENBQTFCOzt5QkFFYSxJQUFJc1gsS0FBS2dQLGlCQUFULENBQ1hsUSxTQUFTMk4sUUFBUTlmLE9BQWpCLENBRFcsRUFFWG1TLFNBQVMyTixRQUFRN2YsT0FBakIsQ0FGVyxFQUdYNlIsT0FIVyxFQUlYQyxPQUpXLEVBS1hDLE9BTFcsRUFNWEEsT0FOVyxDQUFiOzs7O1dBV0QsUUFBTDs7Y0FFUXNRLG1CQUFKO2NBQ01DLGFBQWEsSUFBSWxQLEtBQUtnRCxXQUFULEVBQW5COztrQkFFUTlDLElBQVIsQ0FBYXVNLFFBQVFyZixTQUFSLENBQWtCNUUsQ0FBL0I7a0JBQ1EyWCxJQUFSLENBQWFzTSxRQUFRcmYsU0FBUixDQUFrQjNFLENBQS9CO2tCQUNRMlgsSUFBUixDQUFhcU0sUUFBUXJmLFNBQVIsQ0FBa0IxRSxDQUEvQjs7cUJBRVcyaEIsU0FBWCxDQUFxQjVMLE9BQXJCOztjQUVJclQsV0FBVzhqQixXQUFXQyxXQUFYLEVBQWY7bUJBQ1NDLFFBQVQsQ0FBa0IzQyxRQUFRemUsSUFBUixDQUFheEYsQ0FBL0IsRUFBa0Npa0IsUUFBUXplLElBQVIsQ0FBYXZGLENBQS9DLEVBQWtEZ2tCLFFBQVF6ZSxJQUFSLENBQWF0RixDQUEvRDtxQkFDVzRoQixXQUFYLENBQXVCbGYsUUFBdkI7O2NBRUlxaEIsUUFBUTdmLE9BQVosRUFBcUI7eUJBQ04sSUFBSW9ULEtBQUtnRCxXQUFULEVBQWI7O29CQUVROUMsSUFBUixDQUFhdU0sUUFBUW5mLFNBQVIsQ0FBa0I5RSxDQUEvQjtvQkFDUTJYLElBQVIsQ0FBYXNNLFFBQVFuZixTQUFSLENBQWtCN0UsQ0FBL0I7b0JBQ1EyWCxJQUFSLENBQWFxTSxRQUFRbmYsU0FBUixDQUFrQjVFLENBQS9COzt1QkFFVzJoQixTQUFYLENBQXFCM0wsT0FBckI7O3VCQUVXdVEsV0FBV0UsV0FBWCxFQUFYO3FCQUNTQyxRQUFULENBQWtCM0MsUUFBUXplLElBQVIsQ0FBYXhGLENBQS9CLEVBQWtDaWtCLFFBQVF6ZSxJQUFSLENBQWF2RixDQUEvQyxFQUFrRGdrQixRQUFRemUsSUFBUixDQUFhdEYsQ0FBL0Q7dUJBQ1c0aEIsV0FBWCxDQUF1QmxmLFFBQXZCOzt5QkFFYSxJQUFJNFUsS0FBS3FQLGtCQUFULENBQ1h2USxTQUFTMk4sUUFBUTlmLE9BQWpCLENBRFcsRUFFWG1TLFNBQVMyTixRQUFRN2YsT0FBakIsQ0FGVyxFQUdYc2lCLFVBSFcsRUFJWEQsVUFKVyxFQUtYLElBTFcsQ0FBYjtXQWJGLE1BcUJLO3lCQUNVLElBQUlqUCxLQUFLcVAsa0JBQVQsQ0FDWHZRLFNBQVMyTixRQUFROWYsT0FBakIsQ0FEVyxFQUVYdWlCLFVBRlcsRUFHWCxJQUhXLENBQWI7OztxQkFPU0ksRUFBWCxHQUFnQkosVUFBaEI7cUJBQ1dLLEVBQVgsR0FBZ0JOLFVBQWhCOztlQUVLMUUsT0FBTCxDQUFhMkUsVUFBYjtjQUNJRCxlQUFlcGlCLFNBQW5CLEVBQThCbVQsS0FBS3VLLE9BQUwsQ0FBYTBFLFVBQWI7Ozs7V0FJN0IsV0FBTDs7Y0FFVUMsY0FBYSxJQUFJbFAsS0FBS2dELFdBQVQsRUFBbkI7c0JBQ1dqRCxXQUFYOztjQUVNa1AsY0FBYSxJQUFJalAsS0FBS2dELFdBQVQsRUFBbkI7c0JBQ1dqRCxXQUFYOztrQkFFUUcsSUFBUixDQUFhdU0sUUFBUXJmLFNBQVIsQ0FBa0I1RSxDQUEvQjtrQkFDUTJYLElBQVIsQ0FBYXNNLFFBQVFyZixTQUFSLENBQWtCM0UsQ0FBL0I7a0JBQ1EyWCxJQUFSLENBQWFxTSxRQUFRcmYsU0FBUixDQUFrQjFFLENBQS9COztrQkFFUXdYLElBQVIsQ0FBYXVNLFFBQVFuZixTQUFSLENBQWtCOUUsQ0FBL0I7a0JBQ1EyWCxJQUFSLENBQWFzTSxRQUFRbmYsU0FBUixDQUFrQjdFLENBQS9CO2tCQUNRMlgsSUFBUixDQUFhcU0sUUFBUW5mLFNBQVIsQ0FBa0I1RSxDQUEvQjs7c0JBRVcyaEIsU0FBWCxDQUFxQjVMLE9BQXJCO3NCQUNXNEwsU0FBWCxDQUFxQjNMLE9BQXJCOztjQUVJdFQsWUFBVzhqQixZQUFXQyxXQUFYLEVBQWY7b0JBQ1NLLFdBQVQsQ0FBcUIsQ0FBQy9DLFFBQVFsZixLQUFSLENBQWM3RSxDQUFwQyxFQUF1QyxDQUFDK2pCLFFBQVFsZixLQUFSLENBQWM5RSxDQUF0RCxFQUF5RCxDQUFDZ2tCLFFBQVFsZixLQUFSLENBQWMvRSxDQUF4RTtzQkFDVzhoQixXQUFYLENBQXVCbGYsU0FBdkI7O3NCQUVXNmpCLFlBQVdFLFdBQVgsRUFBWDtvQkFDU0ssV0FBVCxDQUFxQixDQUFDL0MsUUFBUWpmLEtBQVIsQ0FBYzlFLENBQXBDLEVBQXVDLENBQUMrakIsUUFBUWpmLEtBQVIsQ0FBYy9FLENBQXRELEVBQXlELENBQUNna0IsUUFBUWpmLEtBQVIsQ0FBY2hGLENBQXhFO3NCQUNXOGhCLFdBQVgsQ0FBdUJsZixTQUF2Qjs7dUJBRWEsSUFBSTRVLEtBQUt5UCxxQkFBVCxDQUNYM1EsU0FBUzJOLFFBQVE5ZixPQUFqQixDQURXLEVBRVhtUyxTQUFTMk4sUUFBUTdmLE9BQWpCLENBRlcsRUFHWHNpQixXQUhXLEVBSVhELFdBSlcsQ0FBYjs7cUJBT1dTLFFBQVgsQ0FBb0I5bUIsS0FBSyttQixFQUF6QixFQUE2QixDQUE3QixFQUFnQy9tQixLQUFLK21CLEVBQXJDOztxQkFFV0wsRUFBWCxHQUFnQkosV0FBaEI7cUJBQ1dLLEVBQVgsR0FBZ0JOLFdBQWhCOztlQUVLMUUsT0FBTCxDQUFhMkUsV0FBYjtlQUNLM0UsT0FBTCxDQUFhMEUsV0FBYjs7OztXQUlDLEtBQUw7O2NBRVFBLHFCQUFKOztjQUVNQyxlQUFhLElBQUlsUCxLQUFLZ0QsV0FBVCxFQUFuQjt1QkFDV2pELFdBQVg7O2tCQUVRRyxJQUFSLENBQWF1TSxRQUFRcmYsU0FBUixDQUFrQjVFLENBQS9CO2tCQUNRMlgsSUFBUixDQUFhc00sUUFBUXJmLFNBQVIsQ0FBa0IzRSxDQUEvQjtrQkFDUTJYLElBQVIsQ0FBYXFNLFFBQVFyZixTQUFSLENBQWtCMUUsQ0FBL0I7O3VCQUVXMmhCLFNBQVgsQ0FBcUI1TCxPQUFyQjs7Y0FFSXJULGFBQVc4akIsYUFBV0MsV0FBWCxFQUFmO3FCQUNTSyxXQUFULENBQXFCLENBQUMvQyxRQUFRbGYsS0FBUixDQUFjN0UsQ0FBcEMsRUFBdUMsQ0FBQytqQixRQUFRbGYsS0FBUixDQUFjOUUsQ0FBdEQsRUFBeUQsQ0FBQ2drQixRQUFRbGYsS0FBUixDQUFjL0UsQ0FBeEU7dUJBQ1c4aEIsV0FBWCxDQUF1QmxmLFVBQXZCOztjQUVJcWhCLFFBQVE3ZixPQUFaLEVBQXFCOzJCQUNOLElBQUlvVCxLQUFLZ0QsV0FBVCxFQUFiO3lCQUNXakQsV0FBWDs7b0JBRVFHLElBQVIsQ0FBYXVNLFFBQVFuZixTQUFSLENBQWtCOUUsQ0FBL0I7b0JBQ1EyWCxJQUFSLENBQWFzTSxRQUFRbmYsU0FBUixDQUFrQjdFLENBQS9CO29CQUNRMlgsSUFBUixDQUFhcU0sUUFBUW5mLFNBQVIsQ0FBa0I1RSxDQUEvQjs7eUJBRVcyaEIsU0FBWCxDQUFxQjNMLE9BQXJCOzt5QkFFV3VRLGFBQVdFLFdBQVgsRUFBWDt1QkFDU0ssV0FBVCxDQUFxQixDQUFDL0MsUUFBUWpmLEtBQVIsQ0FBYzlFLENBQXBDLEVBQXVDLENBQUMrakIsUUFBUWpmLEtBQVIsQ0FBYy9FLENBQXRELEVBQXlELENBQUNna0IsUUFBUWpmLEtBQVIsQ0FBY2hGLENBQXhFO3lCQUNXOGhCLFdBQVgsQ0FBdUJsZixVQUF2Qjs7eUJBRWEsSUFBSTRVLEtBQUs0UCx1QkFBVCxDQUNYOVEsU0FBUzJOLFFBQVE5ZixPQUFqQixDQURXLEVBRVhtUyxTQUFTMk4sUUFBUTdmLE9BQWpCLENBRlcsRUFHWHNpQixZQUhXLEVBSVhELFlBSlcsRUFLWCxJQUxXLENBQWI7V0FkRixNQXNCSzt5QkFDVSxJQUFJalAsS0FBSzRQLHVCQUFULENBQ1g5USxTQUFTMk4sUUFBUTlmLE9BQWpCLENBRFcsRUFFWHVpQixZQUZXLEVBR1gsSUFIVyxDQUFiOzs7cUJBT1NJLEVBQVgsR0FBZ0JKLFlBQWhCO3FCQUNXSyxFQUFYLEdBQWdCTixZQUFoQjs7ZUFFSzFFLE9BQUwsQ0FBYTJFLFlBQWI7Y0FDSUQsaUJBQWVwaUIsU0FBbkIsRUFBOEJtVCxLQUFLdUssT0FBTCxDQUFhMEUsWUFBYjs7Ozs7Ozs7VUFRNUI1VixhQUFOLENBQW9CM0wsVUFBcEI7O2VBRVcrZCxDQUFYLEdBQWUzTSxTQUFTMk4sUUFBUTlmLE9BQWpCLENBQWY7ZUFDV2tqQixDQUFYLEdBQWUvUSxTQUFTMk4sUUFBUTdmLE9BQWpCLENBQWY7O2VBRVdrakIsY0FBWDtpQkFDYXJELFFBQVF0ZixFQUFyQixJQUEyQk8sVUFBM0I7OztRQUdJdUcsb0JBQUosRUFBMEI7eUJBQ0wsSUFBSXZCLFlBQUosQ0FBaUIsSUFBSTZMLG1CQUFtQnhXLHlCQUF4QyxDQUFuQixDQUR3Qjt1QkFFUCxDQUFqQixJQUFzQkosY0FBY3dMLGdCQUFwQztLQUZGLE1BSUtvTSxtQkFBbUIsQ0FBQzVYLGNBQWN3TCxnQkFBZixDQUFuQjtHQXJQUDs7bUJBd1BpQjRjLGdCQUFqQixHQUFvQyxVQUFDdEQsT0FBRCxFQUFhO1FBQ3pDL2UsYUFBYXNSLGFBQWF5TixRQUFRdGYsRUFBckIsQ0FBbkI7O1FBRUlPLGVBQWViLFNBQW5CLEVBQThCO1lBQ3RCa2pCLGdCQUFOLENBQXVCcmlCLFVBQXZCO21CQUNhK2UsUUFBUXRmLEVBQXJCLElBQTJCLElBQTNCOzs7R0FMSjs7bUJBVWlCNmlCLHNDQUFqQixHQUEwRCxVQUFDdkQsT0FBRCxFQUFhO1FBQy9EL2UsYUFBYXNSLGFBQWF5TixRQUFRdGYsRUFBckIsQ0FBbkI7UUFDSU8sZUFBZWIsU0FBbkIsRUFBOEJhLFdBQVd1aUIsMkJBQVgsQ0FBdUN4RCxRQUFRb0MsU0FBL0M7R0FGaEM7O21CQUtpQnZWLFFBQWpCLEdBQTRCLFlBQWlCO1FBQWhCaEcsTUFBZ0IsdUVBQVAsRUFBTzs7UUFDdkNyQyxLQUFKLEVBQVc7VUFDTHFDLE9BQU9pRyxRQUFQLElBQW1CakcsT0FBT2lHLFFBQVAsR0FBa0JMLGFBQXpDLEVBQ0U1RixPQUFPaUcsUUFBUCxHQUFrQkwsYUFBbEI7O2FBRUtNLFdBQVAsR0FBcUJsRyxPQUFPa0csV0FBUCxJQUFzQjVRLEtBQUtzbkIsSUFBTCxDQUFVNWMsT0FBT2lHLFFBQVAsR0FBa0JMLGFBQTVCLENBQTNDLENBSlM7O1lBTUhpWCxjQUFOLENBQXFCN2MsT0FBT2lHLFFBQTVCLEVBQXNDakcsT0FBT2tHLFdBQTdDLEVBQTBETixhQUExRDs7VUFFSTZGLFVBQVV2VSxNQUFWLEdBQW1CLENBQXZCLEVBQTBCNGxCOztVQUV0QnBSLGFBQWF4VSxNQUFiLEdBQXNCLENBQTFCLEVBQTZCNmxCOztVQUV6QnBTLGlCQUFKLEVBQXVCcVM7O0dBYjNCOzs7bUJBa0JpQkMsZUFBakIsR0FBbUMsVUFBQ2pkLE1BQUQsRUFBWTtpQkFDaENBLE9BQU81RixVQUFwQixFQUFnQ2dpQixRQUFoQyxDQUF5Q3BjLE9BQU9yRixHQUFoRCxFQUFxRHFGLE9BQU9wRixJQUE1RCxFQUFrRSxDQUFsRSxFQUFxRW9GLE9BQU9uRixXQUE1RSxFQUF5Rm1GLE9BQU9sRixpQkFBaEc7R0FERjs7bUJBSWlCb2lCLHdCQUFqQixHQUE0QyxVQUFDbGQsTUFBRCxFQUFZO1FBQ2hENUYsYUFBYXNSLGFBQWExTCxPQUFPNUYsVUFBcEIsQ0FBbkI7ZUFDVytpQixrQkFBWCxDQUE4QixJQUE5QixFQUFvQ25kLE9BQU9qRixRQUEzQyxFQUFxRGlGLE9BQU9oRixZQUE1RDtlQUNXbWQsQ0FBWCxDQUFhRCxRQUFiO1FBQ0k5ZCxXQUFXbWlCLENBQWYsRUFBa0JuaUIsV0FBV21pQixDQUFYLENBQWFyRSxRQUFiO0dBSnBCOzttQkFPaUJrRixrQkFBakIsR0FBc0MsVUFBQ3BkLE1BQUQsRUFBWTtpQkFDbkNBLE9BQU81RixVQUFwQixFQUFnQ2lqQixXQUFoQyxDQUE0QyxLQUE1QztRQUNJampCLFdBQVdtaUIsQ0FBZixFQUFrQm5pQixXQUFXbWlCLENBQVgsQ0FBYXJFLFFBQWI7R0FGcEI7O21CQUtpQm9GLGdCQUFqQixHQUFvQyxVQUFDdGQsTUFBRCxFQUFZO1FBQ3hDNUYsYUFBYXNSLGFBQWExTCxPQUFPNUYsVUFBcEIsQ0FBbkI7ZUFDV21qQixnQkFBWCxDQUE0QnZkLE9BQU83RSxTQUFQLElBQW9CLENBQWhEO2VBQ1dxaUIsZ0JBQVgsQ0FBNEJ4ZCxPQUFPNUUsU0FBUCxJQUFvQixDQUFoRDs7ZUFFV3FpQixnQkFBWCxDQUE0QnpkLE9BQU8zRSxTQUFQLElBQW9CLENBQWhEO2VBQ1dxaUIsZ0JBQVgsQ0FBNEIxZCxPQUFPMUUsU0FBUCxJQUFvQixDQUFoRDtHQU5GOzttQkFTaUJxaUIscUJBQWpCLEdBQXlDLFVBQUMzZCxNQUFELEVBQVk7UUFDN0M1RixhQUFhc1IsYUFBYTFMLE9BQU81RixVQUFwQixDQUFuQjtlQUNXd2pCLGlCQUFYLENBQTZCNWQsT0FBT3pFLE1BQVAsSUFBaUIsQ0FBOUM7ZUFDV3NpQixpQkFBWCxDQUE2QjdkLE9BQU94RSxPQUFQLElBQWtCLENBQS9DO0dBSEY7O21CQU1pQnNpQix3QkFBakIsR0FBNEMsVUFBQzlkLE1BQUQsRUFBWTtRQUNoRDVGLGFBQWFzUixhQUFhMUwsT0FBTzVGLFVBQXBCLENBQW5CO2VBQ1cyakIseUJBQVgsQ0FBcUMvZCxPQUFPakYsUUFBNUM7ZUFDV2lqQixtQkFBWCxDQUErQmhlLE9BQU9oRixZQUF0QztlQUNXaWpCLGtCQUFYLENBQThCLElBQTlCO2VBQ1c5RixDQUFYLENBQWFELFFBQWI7UUFDSTlkLFdBQVdtaUIsQ0FBZixFQUFrQm5pQixXQUFXbWlCLENBQVgsQ0FBYXJFLFFBQWI7R0FOcEI7O21CQVNpQmdHLHlCQUFqQixHQUE2QyxVQUFDbGUsTUFBRCxFQUFZO1FBQ2pENUYsYUFBYXNSLGFBQWExTCxPQUFPNUYsVUFBcEIsQ0FBbkI7ZUFDVzZqQixrQkFBWCxDQUE4QixLQUE5QjtRQUNJN2pCLFdBQVdtaUIsQ0FBZixFQUFrQm5pQixXQUFXbWlCLENBQVgsQ0FBYXJFLFFBQWI7R0FIcEI7O21CQU1pQmlHLHlCQUFqQixHQUE2QyxVQUFDbmUsTUFBRCxFQUFZO1FBQ2pENUYsYUFBYXNSLGFBQWExTCxPQUFPNUYsVUFBcEIsQ0FBbkI7ZUFDV2drQix5QkFBWCxDQUFxQ3BlLE9BQU9qRixRQUE1QztlQUNXc2pCLG1CQUFYLENBQStCcmUsT0FBT2hGLFlBQXRDO2VBQ1dzakIsa0JBQVgsQ0FBOEIsSUFBOUI7ZUFDV25HLENBQVgsQ0FBYUQsUUFBYjtRQUNJOWQsV0FBV21pQixDQUFmLEVBQWtCbmlCLFdBQVdtaUIsQ0FBWCxDQUFhckUsUUFBYjtHQU5wQjs7bUJBU2lCcUcsMEJBQWpCLEdBQThDLFVBQUN2ZSxNQUFELEVBQVk7UUFDbEQ1RixhQUFhc1IsYUFBYTFMLE9BQU81RixVQUFwQixDQUFuQjtlQUNXa2tCLGtCQUFYLENBQThCLEtBQTlCO2VBQ1duRyxDQUFYLENBQWFELFFBQWI7UUFDSTlkLFdBQVdtaUIsQ0FBZixFQUFrQm5pQixXQUFXbWlCLENBQVgsQ0FBYXJFLFFBQWI7R0FKcEI7O21CQU9pQnNHLGtCQUFqQixHQUFzQyxVQUFDeGUsTUFBRCxFQUFZO2lCQUNuQ0EsT0FBTzVGLFVBQXBCLEVBQWdDZ2lCLFFBQWhDLENBQXlDcGMsT0FBTzVLLENBQWhELEVBQW1ENEssT0FBTzdLLENBQTFELEVBQTZENkssT0FBTzlLLENBQXBFLEVBRGdEO0dBQWxEOzttQkFJaUJ1cEIscUJBQWpCLEdBQXlDLFVBQUN6ZSxNQUFELEVBQVk7UUFDN0M1RixhQUFhc1IsYUFBYTFMLE9BQU81RixVQUFwQixDQUFuQjtlQUNXaWpCLFdBQVgsQ0FBdUIsSUFBdkI7ZUFDV2xGLENBQVgsQ0FBYUQsUUFBYjtlQUNXcUUsQ0FBWCxDQUFhckUsUUFBYjtHQUpGOzttQkFPaUJ3Ryw0QkFBakIsR0FBZ0QsVUFBQzFlLE1BQUQsRUFBWTtRQUNwRDVGLGFBQWFzUixhQUFhMUwsT0FBTzVGLFVBQXBCLENBQW5CO2VBQ1d1a0Isa0JBQVgsQ0FBOEIzZSxPQUFPM0YsV0FBckM7ZUFDVzhkLENBQVgsQ0FBYUQsUUFBYjtlQUNXcUUsQ0FBWCxDQUFhckUsUUFBYjtHQUpGOzttQkFPaUIwRyx3QkFBakIsR0FBNEMsVUFBQzVlLE1BQUQsRUFBWTtRQUNoRDVGLGFBQWFzUixhQUFhMUwsT0FBTzVGLFVBQXBCLENBQW5COztVQUVNd1MsSUFBTixDQUFXNU0sT0FBTzlLLENBQWxCO1VBQ00yWCxJQUFOLENBQVc3TSxPQUFPN0ssQ0FBbEI7VUFDTTJYLElBQU4sQ0FBVzlNLE9BQU81SyxDQUFsQjtVQUNNZ2hCLElBQU4sQ0FBV3BXLE9BQU8zSyxDQUFsQjs7ZUFFV3dwQixjQUFYLENBQTBCdlQsS0FBMUI7O2VBRVc2TSxDQUFYLENBQWFELFFBQWI7ZUFDV3FFLENBQVgsQ0FBYXJFLFFBQWI7R0FYRjs7bUJBY2lCNEcsc0JBQWpCLEdBQTBDLFVBQUM5ZSxNQUFELEVBQVk7UUFDOUM1RixhQUFhc1IsYUFBYTFMLE9BQU81RixVQUFwQixDQUFuQjtlQUNXaWpCLFdBQVgsQ0FBdUIsS0FBdkI7ZUFDV2xGLENBQVgsQ0FBYUQsUUFBYjtlQUNXcUUsQ0FBWCxDQUFhckUsUUFBYjtHQUpGOzttQkFPaUI2Ryx1QkFBakIsR0FBMkMsVUFBQy9lLE1BQUQsRUFBWTtRQUMvQzVGLGFBQWFzUixhQUFhMUwsT0FBTzVGLFVBQXBCLENBQW5COztZQUVRd1MsSUFBUixDQUFhNU0sT0FBTzlLLENBQXBCO1lBQ1EyWCxJQUFSLENBQWE3TSxPQUFPN0ssQ0FBcEI7WUFDUTJYLElBQVIsQ0FBYTlNLE9BQU81SyxDQUFwQjs7ZUFFVzRwQixtQkFBWCxDQUErQjdULE9BQS9CO2VBQ1dnTixDQUFYLENBQWFELFFBQWI7O1FBRUk5ZCxXQUFXbWlCLENBQWYsRUFBa0JuaUIsV0FBV21pQixDQUFYLENBQWFyRSxRQUFiO0dBVnBCOzttQkFhaUIrRyx1QkFBakIsR0FBMkMsVUFBQ2pmLE1BQUQsRUFBWTtRQUMvQzVGLGFBQWFzUixhQUFhMUwsT0FBTzVGLFVBQXBCLENBQW5COztZQUVRd1MsSUFBUixDQUFhNU0sT0FBTzlLLENBQXBCO1lBQ1EyWCxJQUFSLENBQWE3TSxPQUFPN0ssQ0FBcEI7WUFDUTJYLElBQVIsQ0FBYTlNLE9BQU81SyxDQUFwQjs7ZUFFVzhwQixtQkFBWCxDQUErQi9ULE9BQS9CO2VBQ1dnTixDQUFYLENBQWFELFFBQWI7O1FBRUk5ZCxXQUFXbWlCLENBQWYsRUFBa0JuaUIsV0FBV21pQixDQUFYLENBQWFyRSxRQUFiO0dBVnBCOzttQkFhaUJpSCx3QkFBakIsR0FBNEMsVUFBQ25mLE1BQUQsRUFBWTtRQUNoRDVGLGFBQWFzUixhQUFhMUwsT0FBTzVGLFVBQXBCLENBQW5COztZQUVRd1MsSUFBUixDQUFhNU0sT0FBTzlLLENBQXBCO1lBQ1EyWCxJQUFSLENBQWE3TSxPQUFPN0ssQ0FBcEI7WUFDUTJYLElBQVIsQ0FBYTlNLE9BQU81SyxDQUFwQjs7ZUFFV2dxQixvQkFBWCxDQUFnQ2pVLE9BQWhDO2VBQ1dnTixDQUFYLENBQWFELFFBQWI7O1FBRUk5ZCxXQUFXbWlCLENBQWYsRUFBa0JuaUIsV0FBV21pQixDQUFYLENBQWFyRSxRQUFiO0dBVnBCOzttQkFhaUJtSCx3QkFBakIsR0FBNEMsVUFBQ3JmLE1BQUQsRUFBWTtRQUNoRDVGLGFBQWFzUixhQUFhMUwsT0FBTzVGLFVBQXBCLENBQW5COztZQUVRd1MsSUFBUixDQUFhNU0sT0FBTzlLLENBQXBCO1lBQ1EyWCxJQUFSLENBQWE3TSxPQUFPN0ssQ0FBcEI7WUFDUTJYLElBQVIsQ0FBYTlNLE9BQU81SyxDQUFwQjs7ZUFFV2txQixvQkFBWCxDQUFnQ25VLE9BQWhDO2VBQ1dnTixDQUFYLENBQWFELFFBQWI7O1FBRUk5ZCxXQUFXbWlCLENBQWYsRUFBa0JuaUIsV0FBV21pQixDQUFYLENBQWFyRSxRQUFiO0dBVnBCOzttQkFhaUJxSCxzQkFBakIsR0FBMEMsVUFBQ3ZmLE1BQUQsRUFBWTtRQUM5QzVGLGFBQWFzUixhQUFhMUwsT0FBTzVGLFVBQXBCLENBQW5COztRQUVNb2xCLFFBQVFwbEIsV0FBV3FsQix1QkFBWCxDQUFtQ3pmLE9BQU9wRSxLQUExQyxDQUFkO1VBQ004akIsaUJBQU4sQ0FBd0IsSUFBeEI7ZUFDV3ZILENBQVgsQ0FBYUQsUUFBYjs7UUFFSTlkLFdBQVdtaUIsQ0FBZixFQUFrQm5pQixXQUFXbWlCLENBQVgsQ0FBYXJFLFFBQWI7R0FQcEI7O21CQVVpQnlILHlCQUFqQixHQUE2QyxVQUFDM2YsTUFBRCxFQUFZO1FBQ2pENUYsYUFBYXNSLGFBQWExTCxPQUFPNUYsVUFBcEIsQ0FBbkI7UUFDRW9sQixRQUFRcGxCLFdBQVdxbEIsdUJBQVgsQ0FBbUN6ZixPQUFPcEUsS0FBMUMsQ0FEVjs7VUFHTWdrQixhQUFOLENBQW9CNWYsT0FBT25FLFNBQTNCO1VBQ01na0IsYUFBTixDQUFvQjdmLE9BQU9sRSxVQUEzQjtVQUNNZ2tCLG9CQUFOLENBQTJCOWYsT0FBT2pGLFFBQWxDO1VBQ01nbEIsbUJBQU4sQ0FBMEIvZixPQUFPakUsU0FBakM7ZUFDV29jLENBQVgsQ0FBYUQsUUFBYjs7UUFFSTlkLFdBQVdtaUIsQ0FBZixFQUFrQm5pQixXQUFXbWlCLENBQVgsQ0FBYXJFLFFBQWI7R0FWcEI7O21CQWFpQjhILHVCQUFqQixHQUEyQyxVQUFDaGdCLE1BQUQsRUFBWTtRQUMvQzVGLGFBQWFzUixhQUFhMUwsT0FBTzVGLFVBQXBCLENBQW5CO1FBQ0VvbEIsUUFBUXBsQixXQUFXcWxCLHVCQUFYLENBQW1DemYsT0FBT3BFLEtBQTFDLENBRFY7O1VBR004akIsaUJBQU4sQ0FBd0IsS0FBeEI7ZUFDV3ZILENBQVgsQ0FBYUQsUUFBYjs7UUFFSTlkLFdBQVdtaUIsQ0FBZixFQUFrQm5pQixXQUFXbWlCLENBQVgsQ0FBYXJFLFFBQWI7R0FQcEI7O01BVU0rSCxjQUFjLFNBQWRBLFdBQWMsR0FBTTtRQUNwQnRmLHdCQUF3QnVmLFlBQVlocEIsTUFBWixHQUFxQixJQUFJNFQseUJBQXlCb0Isb0JBQTlFLEVBQW9HO29CQUNwRixJQUFJOU0sWUFBSixDQUNaO1FBRUM5SixLQUFLc25CLElBQUwsQ0FBVTlSLHlCQUF5QmUsZ0JBQW5DLElBQXVEQSxnQkFBeEQsR0FBNEVLLG9CQUhoRTtPQUFkOztrQkFNWSxDQUFaLElBQWlCN1gsY0FBY2dMLFdBQS9COzs7Z0JBR1UsQ0FBWixJQUFpQnlMLHNCQUFqQixDQVh3Qjs7O1VBY2xCOVQsSUFBSSxDQUFSO1VBQ0VxQixRQUFRbVQsU0FBU3RVLE1BRG5COzthQUdPbUIsT0FBUCxFQUFnQjtZQUNSL0IsU0FBU2tWLFNBQVNuVCxLQUFULENBQWY7O1lBRUkvQixVQUFVQSxPQUFPb0QsSUFBUCxLQUFnQixDQUE5QixFQUFpQzs7Ozs7OztjQU16QnVnQixZQUFZM2pCLE9BQU82cEIsd0JBQVAsRUFBbEI7Y0FDTUMsU0FBU25HLFVBQVVvRyxTQUFWLEVBQWY7Y0FDTXZvQixXQUFXbWlCLFVBQVU0QixXQUFWLEVBQWpCOzs7Y0FHTXhiLFNBQVMsSUFBS3JKLEdBQUQsR0FBUWtWLG9CQUEzQjs7c0JBRVk3TCxNQUFaLElBQXNCL0osT0FBT3VELEVBQTdCOztzQkFFWXdHLFNBQVMsQ0FBckIsSUFBMEIrZixPQUFPbHJCLENBQVAsRUFBMUI7c0JBQ1ltTCxTQUFTLENBQXJCLElBQTBCK2YsT0FBT2pyQixDQUFQLEVBQTFCO3NCQUNZa0wsU0FBUyxDQUFyQixJQUEwQitmLE9BQU9ockIsQ0FBUCxFQUExQjs7c0JBRVlpTCxTQUFTLENBQXJCLElBQTBCdkksU0FBUzVDLENBQVQsRUFBMUI7c0JBQ1ltTCxTQUFTLENBQXJCLElBQTBCdkksU0FBUzNDLENBQVQsRUFBMUI7c0JBQ1lrTCxTQUFTLENBQXJCLElBQTBCdkksU0FBUzFDLENBQVQsRUFBMUI7c0JBQ1lpTCxTQUFTLENBQXJCLElBQTBCdkksU0FBU3pDLENBQVQsRUFBMUI7O29CQUVVaUIsT0FBT3VOLGlCQUFQLEVBQVY7c0JBQ1l4RCxTQUFTLENBQXJCLElBQTBCbUssUUFBUXRWLENBQVIsRUFBMUI7c0JBQ1ltTCxTQUFTLENBQXJCLElBQTBCbUssUUFBUXJWLENBQVIsRUFBMUI7c0JBQ1lrTCxTQUFTLEVBQXJCLElBQTJCbUssUUFBUXBWLENBQVIsRUFBM0I7O29CQUVVa0IsT0FBT2dxQixrQkFBUCxFQUFWO3NCQUNZamdCLFNBQVMsRUFBckIsSUFBMkJtSyxRQUFRdFYsQ0FBUixFQUEzQjtzQkFDWW1MLFNBQVMsRUFBckIsSUFBMkJtSyxRQUFRclYsQ0FBUixFQUEzQjtzQkFDWWtMLFNBQVMsRUFBckIsSUFBMkJtSyxRQUFRcFYsQ0FBUixFQUEzQjs7Ozs7UUFLRnVMLG9CQUFKLEVBQTBCQyxLQUFLc2YsWUFBWXJmLE1BQWpCLEVBQXlCLENBQUNxZixZQUFZcmYsTUFBYixDQUF6QixFQUExQixLQUNLRCxLQUFLc2YsV0FBTDtHQTFEUDs7TUE2RE1sRCx5QkFBeUIsU0FBekJBLHNCQUF5QixHQUFNOzs7aUJBR3RCLElBQUk1ZCxZQUFKLENBQ1g7TUFFQTJMLHdCQUF3QixDQUZ4QixHQUdBRyx3QkFBd0IsQ0FKYixDQUFiOztlQU9XLENBQVgsSUFBZ0I3VyxjQUFja0wsVUFBOUI7ZUFDVyxDQUFYLElBQWdCd0wscUJBQWhCLENBWG1DOzs7VUFjN0IxSyxTQUFTLENBQWI7VUFDRWhJLFFBQVFtVCxTQUFTdFUsTUFEbkI7O2FBR09tQixPQUFQLEVBQWdCO1lBQ1IvQixTQUFTa1YsU0FBU25ULEtBQVQsQ0FBZjs7WUFFSS9CLFVBQVVBLE9BQU9vRCxJQUFQLEtBQWdCLENBQTlCLEVBQWlDOzs7cUJBRXBCMkcsTUFBWCxJQUFxQi9KLE9BQU91RCxFQUE1Qjs7Y0FFTXNILGFBQWFkLFNBQVMsQ0FBNUI7O2NBRUkvSixPQUFPNGYsSUFBUCxLQUFnQixJQUFwQixFQUEwQjtnQkFDbEJxSyxRQUFRanFCLE9BQU9nYixXQUFQLEVBQWQ7Z0JBQ014USxPQUFPeWYsTUFBTXpmLElBQU4sRUFBYjt1QkFDV1QsU0FBUyxDQUFwQixJQUF5QlMsSUFBekI7O2lCQUVLLElBQUk5SixJQUFJLENBQWIsRUFBZ0JBLElBQUk4SixJQUFwQixFQUEwQjlKLEdBQTFCLEVBQStCO2tCQUN2QjhaLE9BQU95UCxNQUFNaFAsRUFBTixDQUFTdmEsQ0FBVCxDQUFiO2tCQUNNd3BCLE9BQU8xUCxLQUFLYyxPQUFMLEVBQWI7a0JBQ00xSCxNQUFNL0ksYUFBYW5LLElBQUksQ0FBN0I7O3lCQUVXa1QsR0FBWCxJQUFrQnNXLEtBQUt0ckIsQ0FBTCxFQUFsQjt5QkFDV2dWLE1BQU0sQ0FBakIsSUFBc0JzVyxLQUFLcnJCLENBQUwsRUFBdEI7eUJBQ1crVSxNQUFNLENBQWpCLElBQXNCc1csS0FBS3ByQixDQUFMLEVBQXRCOzs7c0JBR1EwTCxPQUFPLENBQVAsR0FBVyxDQUFyQjtXQWZGLE1BaUJLLElBQUl4SyxPQUFPNmYsS0FBWCxFQUFrQjtnQkFDZm9LLFNBQVFqcUIsT0FBT2diLFdBQVAsRUFBZDtnQkFDTXhRLFFBQU95ZixPQUFNemYsSUFBTixFQUFiO3VCQUNXVCxTQUFTLENBQXBCLElBQXlCUyxLQUF6Qjs7aUJBRUssSUFBSTlKLE1BQUksQ0FBYixFQUFnQkEsTUFBSThKLEtBQXBCLEVBQTBCOUosS0FBMUIsRUFBK0I7a0JBQ3ZCOFosUUFBT3lQLE9BQU1oUCxFQUFOLENBQVN2YSxHQUFULENBQWI7a0JBQ013cEIsUUFBTzFQLE1BQUtjLE9BQUwsRUFBYjtrQkFDTXRRLFNBQVN3UCxNQUFLMlAsT0FBTCxFQUFmO2tCQUNNdlcsT0FBTS9JLGFBQWFuSyxNQUFJLENBQTdCOzt5QkFFV2tULElBQVgsSUFBa0JzVyxNQUFLdHJCLENBQUwsRUFBbEI7eUJBQ1dnVixPQUFNLENBQWpCLElBQXNCc1csTUFBS3JyQixDQUFMLEVBQXRCO3lCQUNXK1UsT0FBTSxDQUFqQixJQUFzQnNXLE1BQUtwckIsQ0FBTCxFQUF0Qjs7eUJBRVc4VSxPQUFNLENBQWpCLElBQXNCLENBQUM1SSxPQUFPcE0sQ0FBUCxFQUF2Qjt5QkFDV2dWLE9BQU0sQ0FBakIsSUFBc0IsQ0FBQzVJLE9BQU9uTSxDQUFQLEVBQXZCO3lCQUNXK1UsT0FBTSxDQUFqQixJQUFzQixDQUFDNUksT0FBT2xNLENBQVAsRUFBdkI7OztzQkFHUTBMLFFBQU8sQ0FBUCxHQUFXLENBQXJCO1dBcEJHLE1Bc0JBO2dCQUNHNGYsUUFBUXBxQixPQUFPb2dCLFdBQVAsRUFBZDtnQkFDTTVWLFNBQU80ZixNQUFNNWYsSUFBTixFQUFiO3VCQUNXVCxTQUFTLENBQXBCLElBQXlCUyxNQUF6Qjs7aUJBRUssSUFBSTlKLE1BQUksQ0FBYixFQUFnQkEsTUFBSThKLE1BQXBCLEVBQTBCOUosS0FBMUIsRUFBK0I7a0JBQ3ZCMnBCLE9BQU9ELE1BQU1uUCxFQUFOLENBQVN2YSxHQUFULENBQWI7O2tCQUVNNHBCLFFBQVFELEtBQUtGLE9BQUwsQ0FBYSxDQUFiLENBQWQ7a0JBQ01JLFFBQVFGLEtBQUtGLE9BQUwsQ0FBYSxDQUFiLENBQWQ7a0JBQ01LLFFBQVFILEtBQUtGLE9BQUwsQ0FBYSxDQUFiLENBQWQ7O2tCQUVNTSxRQUFRSCxNQUFNaFAsT0FBTixFQUFkO2tCQUNNb1AsUUFBUUgsTUFBTWpQLE9BQU4sRUFBZDtrQkFDTXFQLFFBQVFILE1BQU1sUCxPQUFOLEVBQWQ7O2tCQUVNc1AsVUFBVU4sTUFBTUgsT0FBTixFQUFoQjtrQkFDTVUsVUFBVU4sTUFBTUosT0FBTixFQUFoQjtrQkFDTVcsVUFBVU4sTUFBTUwsT0FBTixFQUFoQjs7a0JBRU12VyxRQUFNL0ksYUFBYW5LLE1BQUksRUFBN0I7O3lCQUVXa1QsS0FBWCxJQUFrQjZXLE1BQU03ckIsQ0FBTixFQUFsQjt5QkFDV2dWLFFBQU0sQ0FBakIsSUFBc0I2VyxNQUFNNXJCLENBQU4sRUFBdEI7eUJBQ1crVSxRQUFNLENBQWpCLElBQXNCNlcsTUFBTTNyQixDQUFOLEVBQXRCOzt5QkFFVzhVLFFBQU0sQ0FBakIsSUFBc0JnWCxRQUFRaHNCLENBQVIsRUFBdEI7eUJBQ1dnVixRQUFNLENBQWpCLElBQXNCZ1gsUUFBUS9yQixDQUFSLEVBQXRCO3lCQUNXK1UsUUFBTSxDQUFqQixJQUFzQmdYLFFBQVE5ckIsQ0FBUixFQUF0Qjs7eUJBRVc4VSxRQUFNLENBQWpCLElBQXNCOFcsTUFBTTlyQixDQUFOLEVBQXRCO3lCQUNXZ1YsUUFBTSxDQUFqQixJQUFzQjhXLE1BQU03ckIsQ0FBTixFQUF0Qjt5QkFDVytVLFFBQU0sQ0FBakIsSUFBc0I4VyxNQUFNNXJCLENBQU4sRUFBdEI7O3lCQUVXOFUsUUFBTSxDQUFqQixJQUFzQmlYLFFBQVFqc0IsQ0FBUixFQUF0Qjt5QkFDV2dWLFFBQU0sRUFBakIsSUFBdUJpWCxRQUFRaHNCLENBQVIsRUFBdkI7eUJBQ1crVSxRQUFNLEVBQWpCLElBQXVCaVgsUUFBUS9yQixDQUFSLEVBQXZCOzt5QkFFVzhVLFFBQU0sRUFBakIsSUFBdUIrVyxNQUFNL3JCLENBQU4sRUFBdkI7eUJBQ1dnVixRQUFNLEVBQWpCLElBQXVCK1csTUFBTTlyQixDQUFOLEVBQXZCO3lCQUNXK1UsUUFBTSxFQUFqQixJQUF1QitXLE1BQU03ckIsQ0FBTixFQUF2Qjs7eUJBRVc4VSxRQUFNLEVBQWpCLElBQXVCa1gsUUFBUWxzQixDQUFSLEVBQXZCO3lCQUNXZ1YsUUFBTSxFQUFqQixJQUF1QmtYLFFBQVFqc0IsQ0FBUixFQUF2Qjt5QkFDVytVLFFBQU0sRUFBakIsSUFBdUJrWCxRQUFRaHNCLENBQVIsRUFBdkI7OztzQkFHUTBMLFNBQU8sRUFBUCxHQUFZLENBQXRCOzs7Ozs7OztTQVFIZ0wsVUFBTDtHQXhIRjs7TUEySE11VixtQkFBbUIsU0FBbkJBLGdCQUFtQixHQUFNO1FBQ3ZCQyxLQUFLM2pCLE1BQU00akIsYUFBTixFQUFYO1FBQ0VDLE1BQU1GLEdBQUdHLGVBQUgsRUFEUjs7O1FBSUk5Z0Isb0JBQUosRUFBMEI7VUFDcEJvTCxnQkFBZ0I3VSxNQUFoQixHQUF5QixJQUFJc3FCLE1BQU1qdEIsd0JBQXZDLEVBQWlFOzBCQUM3QyxJQUFJNkssWUFBSixDQUNoQjtVQUVDOUosS0FBS3NuQixJQUFMLENBQVUvUixlQUFlZ0IsZ0JBQXpCLElBQTZDQSxnQkFBOUMsR0FBa0V0WCx3QkFIbEQ7U0FBbEI7d0JBS2dCLENBQWhCLElBQXFCRixjQUFjb0wsZUFBbkM7Ozs7b0JBSVksQ0FBaEIsSUFBcUIsQ0FBckIsQ0FoQjZCOztTQWtCeEIsSUFBSXpJLElBQUksQ0FBYixFQUFnQkEsSUFBSXdxQixHQUFwQixFQUF5QnhxQixHQUF6QixFQUE4QjtVQUN0QjBxQixXQUFXSixHQUFHSywwQkFBSCxDQUE4QjNxQixDQUE5QixDQUFqQjtVQUNFNHFCLGVBQWVGLFNBQVNHLGNBQVQsRUFEakI7O1VBR0lELGlCQUFpQixDQUFyQixFQUF3Qjs7V0FFbkIsSUFBSXJlLElBQUksQ0FBYixFQUFnQkEsSUFBSXFlLFlBQXBCLEVBQWtDcmUsR0FBbEMsRUFBdUM7WUFDL0J1ZSxLQUFLSixTQUFTSyxlQUFULENBQXlCeGUsQ0FBekIsQ0FBWDs7O1lBR01sRCxTQUFTLElBQUswTCxnQkFBZ0IsQ0FBaEIsR0FBRCxHQUF5QnhYLHdCQUE1Qzt3QkFDZ0I4TCxNQUFoQixJQUEwQnNMLGNBQWMrVixTQUFTTSxRQUFULEdBQW9CalUsR0FBbEMsQ0FBMUI7d0JBQ2dCMU4sU0FBUyxDQUF6QixJQUE4QnNMLGNBQWMrVixTQUFTTyxRQUFULEdBQW9CbFUsR0FBbEMsQ0FBOUI7O2tCQUVVK1QsR0FBR0ksb0JBQUgsRUFBVjt3QkFDZ0I3aEIsU0FBUyxDQUF6QixJQUE4Qm1LLFFBQVF0VixDQUFSLEVBQTlCO3dCQUNnQm1MLFNBQVMsQ0FBekIsSUFBOEJtSyxRQUFRclYsQ0FBUixFQUE5Qjt3QkFDZ0JrTCxTQUFTLENBQXpCLElBQThCbUssUUFBUXBWLENBQVIsRUFBOUI7Ozs7Ozs7UUFPQXVMLG9CQUFKLEVBQTBCQyxLQUFLbUwsZ0JBQWdCbEwsTUFBckIsRUFBNkIsQ0FBQ2tMLGdCQUFnQmxMLE1BQWpCLENBQTdCLEVBQTFCLEtBQ0tELEtBQUttTCxlQUFMO0dBM0NQOztNQThDTStRLGlCQUFpQixTQUFqQkEsY0FBaUIsR0FBWTtRQUM3Qm5jLG9CQUFKLEVBQTBCO1VBQ3BCcUwsY0FBYzlVLE1BQWQsR0FBdUIsSUFBSThULGNBQWN4VyxzQkFBN0MsRUFBcUU7d0JBQ25ELElBQUk0SyxZQUFKLENBQ2Q7VUFFQzlKLEtBQUtzbkIsSUFBTCxDQUFVNVIsY0FBY2EsZ0JBQXhCLElBQTRDQSxnQkFBN0MsR0FBaUVyWCxzQkFIbkQ7U0FBaEI7c0JBS2MsQ0FBZCxJQUFtQkgsY0FBY3NMLGFBQWpDOzs7OztVQUtFM0ksSUFBSSxDQUFSO1VBQ0V1TSxJQUFJLENBRE47VUFFRWxMLFFBQVFvVCxVQUFVdlUsTUFGcEI7O2FBSU9tQixPQUFQLEVBQWdCO1lBQ1ZvVCxVQUFVcFQsS0FBVixDQUFKLEVBQXNCO2NBQ2QwSyxVQUFVMEksVUFBVXBULEtBQVYsQ0FBaEI7O2VBRUtrTCxJQUFJLENBQVQsRUFBWUEsSUFBSVIsUUFBUW9mLFlBQVIsRUFBaEIsRUFBd0M1ZSxHQUF4QyxFQUE2Qzs7O2dCQUdyQzBXLFlBQVlsWCxRQUFRcWYsWUFBUixDQUFxQjdlLENBQXJCLEVBQXdCOGUsb0JBQXhCLEVBQWxCOztnQkFFTWpDLFNBQVNuRyxVQUFVb0csU0FBVixFQUFmO2dCQUNNdm9CLFdBQVdtaUIsVUFBVTRCLFdBQVYsRUFBakI7OztnQkFHTXhiLFNBQVMsSUFBS3JKLEdBQUQsR0FBUXhDLHNCQUEzQjs7MEJBRWM2TCxNQUFkLElBQXdCaEksS0FBeEI7MEJBQ2NnSSxTQUFTLENBQXZCLElBQTRCa0QsQ0FBNUI7OzBCQUVjbEQsU0FBUyxDQUF2QixJQUE0QitmLE9BQU9sckIsQ0FBUCxFQUE1QjswQkFDY21MLFNBQVMsQ0FBdkIsSUFBNEIrZixPQUFPanJCLENBQVAsRUFBNUI7MEJBQ2NrTCxTQUFTLENBQXZCLElBQTRCK2YsT0FBT2hyQixDQUFQLEVBQTVCOzswQkFFY2lMLFNBQVMsQ0FBdkIsSUFBNEJ2SSxTQUFTNUMsQ0FBVCxFQUE1QjswQkFDY21MLFNBQVMsQ0FBdkIsSUFBNEJ2SSxTQUFTM0MsQ0FBVCxFQUE1QjswQkFDY2tMLFNBQVMsQ0FBdkIsSUFBNEJ2SSxTQUFTMUMsQ0FBVCxFQUE1QjswQkFDY2lMLFNBQVMsQ0FBdkIsSUFBNEJ2SSxTQUFTekMsQ0FBVCxFQUE1Qjs7Ozs7VUFLRnNMLHdCQUF3QjRDLE1BQU0sQ0FBbEMsRUFBcUMzQyxLQUFLb0wsY0FBY25MLE1BQW5CLEVBQTJCLENBQUNtTCxjQUFjbkwsTUFBZixDQUEzQixFQUFyQyxLQUNLLElBQUkwQyxNQUFNLENBQVYsRUFBYTNDLEtBQUtvTCxhQUFMOztHQWhEdEI7O01Bb0RNK1Esb0JBQW9CLFNBQXBCQSxpQkFBb0IsR0FBWTtRQUNoQ3BjLG9CQUFKLEVBQTBCO1VBQ3BCc0wsaUJBQWlCL1UsTUFBakIsR0FBMEIsSUFBSStULG1CQUFtQnhXLHlCQUFyRCxFQUFnRjsyQkFDM0QsSUFBSTJLLFlBQUosQ0FDakI7VUFFQzlKLEtBQUtzbkIsSUFBTCxDQUFVM1IsbUJBQW1CWSxnQkFBN0IsSUFBaURBLGdCQUFsRCxHQUFzRXBYLHlCQUhyRDtTQUFuQjt5QkFLaUIsQ0FBakIsSUFBc0JKLGNBQWN3TCxnQkFBcEM7Ozs7O1VBS0VRLFNBQVMsQ0FBYjtVQUNFckosSUFBSSxDQUROO1VBRUVxQixRQUFRcVQsYUFBYTRXLE1BRnZCOzthQUlPanFCLE9BQVAsRUFBZ0I7WUFDVnFULGFBQWFyVCxLQUFiLENBQUosRUFBeUI7Y0FDakIrQixjQUFhc1IsYUFBYXJULEtBQWIsQ0FBbkI7Y0FDTWtxQixjQUFjbm9CLFlBQVcrZCxDQUEvQjtjQUNNOEIsWUFBWTdmLFlBQVc0aEIsRUFBN0I7Y0FDTW9FLFNBQVNuRyxVQUFVb0csU0FBVixFQUFmOzs7bUJBR1MsSUFBS3JwQixHQUFELEdBQVF2Qyx5QkFBckI7OzJCQUVpQjRMLE1BQWpCLElBQTJCaEksS0FBM0I7MkJBQ2lCZ0ksU0FBUyxDQUExQixJQUErQmtpQixZQUFZMW9CLEVBQTNDOzJCQUNpQndHLFNBQVMsQ0FBMUIsSUFBK0IrZixPQUFPbHJCLENBQXRDOzJCQUNpQm1MLFNBQVMsQ0FBMUIsSUFBK0IrZixPQUFPanJCLENBQXRDOzJCQUNpQmtMLFNBQVMsQ0FBMUIsSUFBK0IrZixPQUFPaHJCLENBQXRDOzJCQUNpQmlMLFNBQVMsQ0FBMUIsSUFBK0JqRyxZQUFXb29CLDJCQUFYLEVBQS9COzs7O1VBSUE3aEIsd0JBQXdCM0osTUFBTSxDQUFsQyxFQUFxQzRKLEtBQUtxTCxpQkFBaUJwTCxNQUF0QixFQUE4QixDQUFDb0wsaUJBQWlCcEwsTUFBbEIsQ0FBOUIsRUFBckMsS0FDSyxJQUFJN0osTUFBTSxDQUFWLEVBQWE0SixLQUFLcUwsZ0JBQUw7O0dBckN0Qjs7T0F5Q0t0RCxTQUFMLEdBQWlCLFVBQVUxSixLQUFWLEVBQWlCO1FBQzVCQSxNQUFNMUgsSUFBTixZQUFzQjZILFlBQTFCLEVBQXdDOztjQUU5QkgsTUFBTTFILElBQU4sQ0FBVyxDQUFYLENBQVI7YUFDS2xELGNBQWNnTCxXQUFuQjs7MEJBRWtCLElBQUlELFlBQUosQ0FBaUJILE1BQU0xSCxJQUF2QixDQUFkOzs7YUFHQ2xELGNBQWNvTCxlQUFuQjs7OEJBRXNCLElBQUlMLFlBQUosQ0FBaUJILE1BQU0xSCxJQUF2QixDQUFsQjs7O2FBR0NsRCxjQUFjc0wsYUFBbkI7OzRCQUVvQixJQUFJUCxZQUFKLENBQWlCSCxNQUFNMUgsSUFBdkIsQ0FBaEI7OzthQUdDbEQsY0FBY3dMLGdCQUFuQjs7K0JBRXVCLElBQUlULFlBQUosQ0FBaUJILE1BQU0xSCxJQUF2QixDQUFuQjs7Ozs7OztLQXBCTixNQTRCSyxJQUFJMEgsTUFBTTFILElBQU4sQ0FBV3dJLEdBQVgsSUFBa0J3TCxpQkFBaUJ0TSxNQUFNMUgsSUFBTixDQUFXd0ksR0FBNUIsQ0FBdEIsRUFBd0R3TCxpQkFBaUJ0TSxNQUFNMUgsSUFBTixDQUFXd0ksR0FBNUIsRUFBaUNkLE1BQU0xSCxJQUFOLENBQVd5SSxNQUE1QztHQTdCL0Q7O09BZ0NLakIsT0FBTCxHQUFlWixLQUFLd0ssU0FBcEI7Q0E5NkRlLENBQWY7O0lDY2E4WixXQUFiOzs7eUJBQ3VCOzs7OztzQ0FBTnRkLElBQU07VUFBQTs7O29KQUNWQSxJQURVOztVQUdkTyxNQUFMLEdBQWMsSUFBSWdkLGFBQUosRUFBZDtVQUNLaGQsTUFBTCxDQUFZaWQsbUJBQVosR0FBa0MsTUFBS2pkLE1BQUwsQ0FBWTJFLGlCQUFaLElBQWlDLE1BQUszRSxNQUFMLENBQVlrRCxXQUEvRTs7VUFFS3RELFFBQUwsR0FBZ0IsS0FBaEI7O1FBRU1ySCxVQUFVLE1BQUtBLE9BQXJCOztVQUVLc0gsTUFBTCxHQUFjLElBQUlILE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVV1ZCxNQUFWLEVBQXFCOzs7Ozs7Ozs7OztZQVd0Q3pvQixPQUFMLENBQWEsTUFBYixFQUFxQjhELE9BQXJCOzs7S0FYVSxDQUFkOztVQWdCS3NILE1BQUwsQ0FBWUMsSUFBWixDQUFpQixZQUFNO1lBQU1GLFFBQUwsR0FBZ0IsSUFBaEI7S0FBeEI7Ozs7UUFJTWdGLEtBQUssSUFBSXBMLFdBQUosQ0FBZ0IsQ0FBaEIsQ0FBWDtVQUNLd0csTUFBTCxDQUFZaWQsbUJBQVosQ0FBZ0NyWSxFQUFoQyxFQUFvQyxDQUFDQSxFQUFELENBQXBDO1VBQ0szSixvQkFBTCxHQUE2QjJKLEdBQUduTCxVQUFILEtBQWtCLENBQS9DOztVQUVLMGpCLEtBQUw7Ozs7OzsyQkFHWTs7O3NCQUNQbmQsTUFBTCxFQUFZaWQsbUJBQVo7Ozs7NEJBR014cUIsUUExQ1YsRUEwQ29CO1dBQ1h1TixNQUFMLENBQVkzTSxnQkFBWixDQUE2QixTQUE3QixFQUF3Q1osUUFBeEM7Ozs7RUEzQzZCNkYsZUFBakM7Ozs7QUNiQSxJQUFNOGtCLGFBQWE7WUFDUDtPQUFBLG9CQUNGO2FBQ0csS0FBS0MsT0FBTCxDQUFhMXNCLFFBQXBCO0tBRk07T0FBQSxrQkFLSjJzQixPQUxJLEVBS0s7VUFDTHpjLE1BQU0sS0FBS3djLE9BQUwsQ0FBYTFzQixRQUF6QjtVQUNNNHNCLFFBQVEsSUFBZDs7YUFFT0MsZ0JBQVAsQ0FBd0IzYyxHQUF4QixFQUE2QjtXQUN4QjthQUFBLG9CQUNLO21CQUNHLEtBQUs0YyxFQUFaO1dBRkQ7YUFBQSxrQkFLR2p1QixDQUxILEVBS007a0JBQ0NvTCxlQUFOLEdBQXdCLElBQXhCO2lCQUNLNmlCLEVBQUwsR0FBVWp1QixDQUFWOztTQVJ1QjtXQVd4QjthQUFBLG9CQUNLO21CQUNHLEtBQUtrdUIsRUFBWjtXQUZEO2FBQUEsa0JBS0dqdUIsQ0FMSCxFQUtNO2tCQUNDbUwsZUFBTixHQUF3QixJQUF4QjtpQkFDSzhpQixFQUFMLEdBQVVqdUIsQ0FBVjs7U0FsQnVCO1dBcUJ4QjthQUFBLG9CQUNLO21CQUNHLEtBQUtrdUIsRUFBWjtXQUZEO2FBQUEsa0JBS0dqdUIsQ0FMSCxFQUtNO2tCQUNDa0wsZUFBTixHQUF3QixJQUF4QjtpQkFDSytpQixFQUFMLEdBQVVqdUIsQ0FBVjs7O09BNUJOOztZQWlDTWtMLGVBQU4sR0FBd0IsSUFBeEI7O1VBRUkzSixJQUFKLENBQVNxc0IsT0FBVDs7R0E3Q2E7O2NBaURMO09BQUEsb0JBQ0o7V0FDQ00sT0FBTCxHQUFlLElBQWY7YUFDTyxLQUFLNWUsTUFBTCxDQUFZak8sVUFBbkI7S0FIUTtPQUFBLGtCQU1OQSxVQU5NLEVBTU07OztVQUNSZ1EsT0FBTyxLQUFLc2MsT0FBTCxDQUFhdHNCLFVBQTFCO1VBQ0VpTyxTQUFTLEtBQUtxZSxPQURoQjs7V0FHS3BzQixJQUFMLENBQVVGLFVBQVY7O1dBRUs4c0IsUUFBTCxDQUFjLFlBQU07WUFDZCxNQUFLRCxPQUFULEVBQWtCO2NBQ1o1ZSxPQUFPbEUsZUFBUCxLQUEyQixJQUEvQixFQUFxQztrQkFDOUI4aUIsT0FBTCxHQUFlLEtBQWY7bUJBQ085aUIsZUFBUCxHQUF5QixLQUF6Qjs7aUJBRUtBLGVBQVAsR0FBeUIsSUFBekI7O09BTko7O0dBN0RhOztZQXlFUDtPQUFBLG9CQUNGO1dBQ0M4aUIsT0FBTCxHQUFlLElBQWY7YUFDTyxLQUFLUCxPQUFMLENBQWFqckIsUUFBcEI7S0FITTtPQUFBLGtCQU1KMHJCLEtBTkksRUFNRzs7O1VBQ0hDLE1BQU0sS0FBS1YsT0FBTCxDQUFhanJCLFFBQXpCO1VBQ0U0TSxTQUFTLEtBQUtxZSxPQURoQjs7V0FHS3RzQixVQUFMLENBQWdCRSxJQUFoQixDQUFxQixJQUFJM0IsVUFBSixHQUFpQnVGLFlBQWpCLENBQThCaXBCLEtBQTlCLENBQXJCOztVQUVJRCxRQUFKLENBQWEsWUFBTTtZQUNiLE9BQUtELE9BQVQsRUFBa0I7aUJBQ1g3c0IsVUFBTCxDQUFnQkUsSUFBaEIsQ0FBcUIsSUFBSTNCLFVBQUosR0FBaUJ1RixZQUFqQixDQUE4QmtwQixHQUE5QixDQUFyQjtpQkFDT2pqQixlQUFQLEdBQXlCLElBQXpCOztPQUhKOzs7Q0FyRk47O0FBK0ZBLFNBQVNrakIsb0JBQVQsQ0FBOEJULEtBQTlCLEVBQXFDO09BQzlCLElBQUlVLEdBQVQsSUFBZ0JiLFVBQWhCLEVBQTRCO1dBQ25CYyxjQUFQLENBQXNCWCxLQUF0QixFQUE2QlUsR0FBN0IsRUFBa0M7V0FDM0JiLFdBQVdhLEdBQVgsRUFBZ0JFLEdBQWhCLENBQW9CdmxCLElBQXBCLENBQXlCMmtCLEtBQXpCLENBRDJCO1dBRTNCSCxXQUFXYSxHQUFYLEVBQWdCcGpCLEdBQWhCLENBQW9CakMsSUFBcEIsQ0FBeUIya0IsS0FBekIsQ0FGMkI7b0JBR2xCLElBSGtCO2tCQUlwQjtLQUpkOzs7O0FBU0osU0FBU2EsTUFBVCxDQUFnQjViLE1BQWhCLEVBQXdCO3VCQUNELElBQXJCOztNQUVNOVEsVUFBVSxLQUFLRSxHQUFMLENBQVMsU0FBVCxDQUFoQjtNQUNNeXNCLGdCQUFnQjdiLE9BQU81USxHQUFQLENBQVcsU0FBWCxDQUF0Qjs7T0FFS3FOLE9BQUwsQ0FBYXFmLE9BQWIsQ0FBcUI1c0IsT0FBckIsR0FBK0JBLFFBQVEyQyxLQUFSLENBQWMsS0FBSzRLLE9BQW5CLENBQS9COztVQUVRcE4sSUFBUixnQkFBbUJ3c0IsY0FBY3hzQixJQUFqQztVQUNRQSxJQUFSLENBQWE2SixlQUFiLEdBQStCLEtBQS9CO01BQ0loSyxRQUFRRyxJQUFSLENBQWFpUCxVQUFqQixFQUE2QnBQLFFBQVFHLElBQVIsQ0FBYTZKLGVBQWIsR0FBK0IsS0FBL0I7O09BRXhCL0ssUUFBTCxHQUFnQixLQUFLQSxRQUFMLENBQWMwRCxLQUFkLEVBQWhCO09BQ0tqQyxRQUFMLEdBQWdCLEtBQUtBLFFBQUwsQ0FBY2lDLEtBQWQsRUFBaEI7T0FDS3RELFVBQUwsR0FBa0IsS0FBS0EsVUFBTCxDQUFnQnNELEtBQWhCLEVBQWxCOztTQUVPbU8sTUFBUDs7O0FBR0YsU0FBUytiLE1BQVQsR0FBa0I7T0FDWDV0QixRQUFMLEdBQWdCLEtBQUtBLFFBQUwsQ0FBYzBELEtBQWQsRUFBaEI7T0FDS2pDLFFBQUwsR0FBZ0IsS0FBS0EsUUFBTCxDQUFjaUMsS0FBZCxFQUFoQjtPQUNLdEQsVUFBTCxHQUFrQixLQUFLQSxVQUFMLENBQWdCc0QsS0FBaEIsRUFBbEI7OztJQUdJbXFCOzs7Ozs7O3dDQUNnQm5tQixPQUFPO1dBQ3BCNUQsT0FBTCxDQUFhLHFCQUFiLEVBQW9DLEVBQUNOLElBQUksS0FBS3RDLElBQUwsQ0FBVXNDLEVBQWYsRUFBbUIzRSxHQUFHNkksTUFBTTdJLENBQTVCLEVBQStCQyxHQUFHNEksTUFBTTVJLENBQXhDLEVBQTJDQyxHQUFHMkksTUFBTTNJLENBQXBELEVBQXBDOzs7O2lDQUdXMkksT0FBT3NDLFFBQVE7V0FDckJsRyxPQUFMLENBQWEsY0FBYixFQUE2QjtZQUN2QixLQUFLNUMsSUFBTCxDQUFVc0MsRUFEYTttQkFFaEJrRSxNQUFNN0ksQ0FGVTttQkFHaEI2SSxNQUFNNUksQ0FIVTttQkFJaEI0SSxNQUFNM0ksQ0FKVTtXQUt4QmlMLE9BQU9uTCxDQUxpQjtXQU14Qm1MLE9BQU9sTCxDQU5pQjtXQU94QmtMLE9BQU9qTDtPQVBaOzs7O2dDQVdVMkksT0FBTztXQUNaNUQsT0FBTCxDQUFhLGFBQWIsRUFBNEI7WUFDdEIsS0FBSzVDLElBQUwsQ0FBVXNDLEVBRFk7a0JBRWhCa0UsTUFBTTdJLENBRlU7a0JBR2hCNkksTUFBTTVJLENBSFU7a0JBSWhCNEksTUFBTTNJO09BSmxCOzs7O3NDQVFnQjJJLE9BQU87V0FDbEI1RCxPQUFMLENBQWEsbUJBQWIsRUFBa0M7WUFDNUIsS0FBSzVDLElBQUwsQ0FBVXNDLEVBRGtCO1dBRTdCa0UsTUFBTTdJLENBRnVCO1dBRzdCNkksTUFBTTVJLENBSHVCO1dBSTdCNEksTUFBTTNJO09BSlg7Ozs7K0JBUVMySSxPQUFPc0MsUUFBUTtXQUNuQmxHLE9BQUwsQ0FBYSxZQUFiLEVBQTJCO1lBQ3JCLEtBQUs1QyxJQUFMLENBQVVzQyxFQURXO2lCQUVoQmtFLE1BQU03SSxDQUZVO2lCQUdoQjZJLE1BQU01SSxDQUhVO2lCQUloQjRJLE1BQU0zSSxDQUpVO1dBS3RCaUwsT0FBT25MLENBTGU7V0FNdEJtTCxPQUFPbEwsQ0FOZTtXQU90QmtMLE9BQU9qTDtPQVBaOzs7O3lDQVdtQjthQUNaLEtBQUttQyxJQUFMLENBQVVtSixlQUFqQjs7Ozt1Q0FHaUIzRixVQUFVO1dBQ3RCWixPQUFMLENBQ0Usb0JBREYsRUFFRSxFQUFDTixJQUFJLEtBQUt0QyxJQUFMLENBQVVzQyxFQUFmLEVBQW1CM0UsR0FBRzZGLFNBQVM3RixDQUEvQixFQUFrQ0MsR0FBRzRGLFNBQVM1RixDQUE5QyxFQUFpREMsR0FBRzJGLFNBQVMzRixDQUE3RCxFQUZGOzs7O3dDQU1rQjthQUNYLEtBQUttQyxJQUFMLENBQVVrSixjQUFqQjs7OztzQ0FHZ0IxRixVQUFVO1dBQ3JCWixPQUFMLENBQ0UsbUJBREYsRUFFRSxFQUFDTixJQUFJLEtBQUt0QyxJQUFMLENBQVVzQyxFQUFmLEVBQW1CM0UsR0FBRzZGLFNBQVM3RixDQUEvQixFQUFrQ0MsR0FBRzRGLFNBQVM1RixDQUE5QyxFQUFpREMsR0FBRzJGLFNBQVMzRixDQUE3RCxFQUZGOzs7O3FDQU1lK3VCLFFBQVE7V0FDbEJocUIsT0FBTCxDQUNFLGtCQURGLEVBRUUsRUFBQ04sSUFBSSxLQUFLdEMsSUFBTCxDQUFVc0MsRUFBZixFQUFtQjNFLEdBQUdpdkIsT0FBT2p2QixDQUE3QixFQUFnQ0MsR0FBR2d2QixPQUFPaHZCLENBQTFDLEVBQTZDQyxHQUFHK3VCLE9BQU8vdUIsQ0FBdkQsRUFGRjs7OztvQ0FNYyt1QixRQUFRO1dBQ2pCaHFCLE9BQUwsQ0FDRSxpQkFERixFQUVFLEVBQUNOLElBQUksS0FBS3RDLElBQUwsQ0FBVXNDLEVBQWYsRUFBbUIzRSxHQUFHaXZCLE9BQU9qdkIsQ0FBN0IsRUFBZ0NDLEdBQUdndkIsT0FBT2h2QixDQUExQyxFQUE2Q0MsR0FBRyt1QixPQUFPL3VCLENBQXZELEVBRkY7Ozs7K0JBTVNtRyxRQUFRQyxTQUFTO1dBQ3JCckIsT0FBTCxDQUNFLFlBREYsRUFFRSxFQUFDTixJQUFJLEtBQUt0QyxJQUFMLENBQVVzQyxFQUFmLEVBQW1CMEIsY0FBbkIsRUFBMkJDLGdCQUEzQixFQUZGOzs7OzBDQU1vQitmLFdBQVc7V0FDMUJwaEIsT0FBTCxDQUNFLHVCQURGLEVBRUUsRUFBQ04sSUFBSSxLQUFLdEMsSUFBTCxDQUFVc0MsRUFBZixFQUFtQjBoQixvQkFBbkIsRUFGRjs7Ozs0Q0FNc0J0TyxRQUFRO1dBQ3pCOVMsT0FBTCxDQUFhLHlCQUFiLEVBQXdDLEVBQUNOLElBQUksS0FBS3RDLElBQUwsQ0FBVXNDLEVBQWYsRUFBbUJvVCxjQUFuQixFQUF4Qzs7Ozs7Ozs7O29CQXlFVXZPLFdBQVosRUFBc0JuSCxJQUF0QixFQUE0Qjs7Ozs7V0FxQzVCMkcsTUFyQzRCLEdBcUNuQjtvQkFBQTs7S0FyQ21COztXQUVyQjNHLElBQUwsR0FBWWlILE9BQU9DLE1BQVAsQ0FBY0MsV0FBZCxFQUF3Qm5ILElBQXhCLENBQVo7Ozs7Ozs4QkFHUTRHLE1BQU07MkJBQ08sSUFBckI7Ozs7NEJBR013RyxVQUFTO2VBQ1BjLE1BQVIsQ0FBZSxTQUFmOztXQUVLdEwsT0FBTCxHQUFlLFlBQWE7OztlQUNuQndLLFNBQVF5ZixHQUFSLENBQVksY0FBWixJQUNMLHlCQUFRUCxHQUFSLENBQVksY0FBWixHQUE0QjFwQixPQUE1QiwrQkFESyxHQUVMLFlBQU0sRUFGUjtPQURGOzs7OytCQU9TaEMsVUFBVTtXQUNkK0YsTUFBTCxDQUFZOEMsUUFBWixHQUF1QixVQUFVQSxRQUFWLEVBQW9CcWpCLE1BQXBCLEVBQTRCO1lBQzdDLENBQUNsc0IsUUFBTCxFQUFlLE9BQU82SSxRQUFQOztZQUVUc2pCLFNBQVNuc0IsU0FBUzZJLFFBQVQsRUFBbUJxakIsTUFBbkIsQ0FBZjtlQUNPQyxTQUFTQSxNQUFULEdBQWtCdGpCLFFBQXpCO09BSkY7Ozs7MEJBUUkyRCxTQUFTO1VBQ1A1SyxRQUFRLElBQUksS0FBS3dxQixXQUFULEVBQWQ7WUFDTWh0QixJQUFOLGdCQUFpQixLQUFLQSxJQUF0QjtZQUNNMkcsTUFBTixDQUFhOEMsUUFBYixHQUF3QixLQUFLOUMsTUFBTCxDQUFZOEMsUUFBcEM7V0FDSzJELE9BQUwsQ0FBYTlMLEtBQWIsQ0FBbUJrQixLQUFuQixFQUEwQixDQUFDNEssT0FBRCxDQUExQjs7YUFFTzVLLEtBQVA7Ozs7RUF2R3lCbXFCLGVBQ3BCTSxZQUFZO1NBQU87YUFDZixFQURlO29CQUVSLElBQUk3dkIsU0FBSixFQUZRO3FCQUdQLElBQUlBLFNBQUosRUFITztVQUlsQixFQUprQjtXQUtqQixJQUFJQSxTQUFKLENBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsQ0FBbEIsQ0FMaUI7aUJBTVgsR0FOVztjQU9kLEdBUGM7YUFRZixDQVJlO1lBU2hCO0dBVFM7WUFZWm1iLFdBQVc7U0FBTzthQUNkLEVBRGM7aUJBRVYsR0FGVTtjQUdiLEdBSGE7YUFJZCxDQUpjO1dBS2hCLElBQUluYixTQUFKLENBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsQ0FBbEIsQ0FMZ0I7Y0FNYixHQU5hO1lBT2YsQ0FQZTtVQVFqQixHQVJpQjtVQVNqQixHQVRpQjtVQVVqQixHQVZpQjtpQkFXVixDQVhVO2lCQVlWLENBWlU7aUJBYVYsQ0FiVTtpQkFjVixDQWRVO29CQWVQLEdBZk87bUJBZ0JSLENBaEJRO2dCQWlCWCxJQWpCVztxQkFrQk47R0FsQkQ7WUFxQlh1aEIsT0FBTztTQUFPO2FBQ1YsRUFEVTtjQUVULEdBRlM7V0FHWixJQUFJdmhCLFNBQUosQ0FBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixDQUFsQixDQUhZO2FBSVYsQ0FKVTtZQUtYLENBTFc7VUFNYixHQU5hO1VBT2IsR0FQYTtVQVFiLEdBUmE7aUJBU04sQ0FUTTtpQkFVTixDQVZNO2lCQVdOLENBWE07aUJBWU4sQ0FaTTtvQkFhSCxHQWJHO21CQWNKLENBZEk7Z0JBZVA7R0FmQTtZQWtCUHdoQixRQUFRO1NBQU87YUFDWCxFQURXO2NBRVYsR0FGVTthQUdYLENBSFc7WUFJWixDQUpZO1dBS2IsSUFBSXhoQixTQUFKLENBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsQ0FBbEIsQ0FMYTtVQU1kLEdBTmM7VUFPZCxHQVBjO1VBUWQsR0FSYztpQkFTUCxDQVRPO2lCQVVQLENBVk87aUJBV1AsQ0FYTztpQkFZUCxDQVpPO29CQWFKLEdBYkk7bUJBY0w7R0FkRjs7O0lDN1JKOHZCLFNBQWI7OztxQkFDY3prQixNQUFaLEVBQW9COzs7O1lBRVY7T0FDSDBrQixTQUFjRixTQUFkLEVBSGEsR0FJZnhrQixNQUplOztVQU1iMmtCLFVBQUwsQ0FBZ0IsVUFBQzNqQixRQUFELFFBQXNCO1VBQVZ6SixJQUFVLFFBQVZBLElBQVU7O1VBQ2hDLENBQUN5SixTQUFTNGpCLFdBQWQsRUFBMkI1akIsU0FBUzZqQixrQkFBVDs7V0FFdEJqZ0IsS0FBTCxHQUFhck4sS0FBS3FOLEtBQUwsSUFBYzVELFNBQVM0akIsV0FBVCxDQUFxQm5TLEdBQXJCLENBQXlCdmQsQ0FBekIsR0FBNkI4TCxTQUFTNGpCLFdBQVQsQ0FBcUJFLEdBQXJCLENBQXlCNXZCLENBQWpGO1dBQ0s0UCxNQUFMLEdBQWN2TixLQUFLdU4sTUFBTCxJQUFlOUQsU0FBUzRqQixXQUFULENBQXFCblMsR0FBckIsQ0FBeUJ0ZCxDQUF6QixHQUE2QjZMLFNBQVM0akIsV0FBVCxDQUFxQkUsR0FBckIsQ0FBeUIzdkIsQ0FBbkY7V0FDSzRQLEtBQUwsR0FBYXhOLEtBQUt3TixLQUFMLElBQWMvRCxTQUFTNGpCLFdBQVQsQ0FBcUJuUyxHQUFyQixDQUF5QnJkLENBQXpCLEdBQTZCNEwsU0FBUzRqQixXQUFULENBQXFCRSxHQUFyQixDQUF5QjF2QixDQUFqRjtLQUxGOzs7OztFQVAyQnN2QixRQUEvQjs7SUNBYUssY0FBYjs7OzBCQUNjL2tCLE1BQVosRUFBb0I7OztZQUVWO09BQ0gwa0IsU0FBY0YsU0FBZCxFQUhhLEdBSWZ4a0IsTUFKZTs7OztFQURjMGtCLFFBQXBDOztBQ0FBO0FBQ0EsSUFBYU0sYUFBYjs7O3lCQUNjaGxCLE1BQVosRUFBb0I7Ozs7WUFFVjtPQUNIMGtCLFNBQWNGLFNBQWQsRUFIYSxHQUlmeGtCLE1BSmU7O1VBTWIya0IsVUFBTCxDQUFnQixVQUFDM2pCLFFBQUQsUUFBc0I7VUFBVnpKLElBQVUsUUFBVkEsSUFBVTs7VUFDaEMsQ0FBQ3lKLFNBQVM0akIsV0FBZCxFQUEyQjVqQixTQUFTNmpCLGtCQUFUOztXQUV0QmpnQixLQUFMLEdBQWFyTixLQUFLcU4sS0FBTCxJQUFjNUQsU0FBUzRqQixXQUFULENBQXFCblMsR0FBckIsQ0FBeUJ2ZCxDQUF6QixHQUE2QjhMLFNBQVM0akIsV0FBVCxDQUFxQkUsR0FBckIsQ0FBeUI1dkIsQ0FBakY7V0FDSzRQLE1BQUwsR0FBY3ZOLEtBQUt1TixNQUFMLElBQWU5RCxTQUFTNGpCLFdBQVQsQ0FBcUJuUyxHQUFyQixDQUF5QnRkLENBQXpCLEdBQTZCNkwsU0FBUzRqQixXQUFULENBQXFCRSxHQUFyQixDQUF5QjN2QixDQUFuRjtXQUNLNFAsS0FBTCxHQUFheE4sS0FBS3dOLEtBQUwsSUFBYy9ELFNBQVM0akIsV0FBVCxDQUFxQm5TLEdBQXJCLENBQXlCcmQsQ0FBekIsR0FBNkI0TCxTQUFTNGpCLFdBQVQsQ0FBcUJFLEdBQXJCLENBQXlCMXZCLENBQWpGO0tBTEY7Ozs7O0VBUCtCc3ZCLFFBQW5DOztJQ0RhTyxhQUFiOzs7eUJBQ2NqbEIsTUFBWixFQUFvQjs7OztZQUVWO09BQ0gwa0IsU0FBY0YsU0FBZCxFQUhhLEdBSWZ4a0IsTUFKZTs7VUFNYjJrQixVQUFMLENBQWdCLFVBQUMzakIsUUFBRCxRQUFzQjtVQUFWekosSUFBVSxRQUFWQSxJQUFVOztXQUMvQkEsSUFBTCxHQUFZLE1BQUsydEIsaUJBQUwsQ0FBdUJsa0IsUUFBdkIsQ0FBWjtLQURGOzs7Ozs7c0NBS2dCQSxRQVpwQixFQVk4QjtVQUN0QixDQUFDQSxTQUFTNGpCLFdBQWQsRUFBMkI1akIsU0FBUzZqQixrQkFBVDs7VUFFckJ0dEIsT0FBT3lKLFNBQVNta0IsZ0JBQVQsR0FDWG5rQixTQUFTRCxVQUFULENBQW9CMUssUUFBcEIsQ0FBNkI2SyxLQURsQixHQUVYLElBQUk5QixZQUFKLENBQWlCNEIsU0FBUzBmLEtBQVQsQ0FBZXhwQixNQUFmLEdBQXdCLENBQXpDLENBRkY7O1VBSUksQ0FBQzhKLFNBQVNta0IsZ0JBQWQsRUFBZ0M7WUFDeEJDLFdBQVdwa0IsU0FBU29rQixRQUExQjs7YUFFSyxJQUFJcHVCLElBQUksQ0FBYixFQUFnQkEsSUFBSWdLLFNBQVMwZixLQUFULENBQWV4cEIsTUFBbkMsRUFBMkNGLEdBQTNDLEVBQWdEO2NBQ3hDMnBCLE9BQU8zZixTQUFTMGYsS0FBVCxDQUFlMXBCLENBQWYsQ0FBYjs7Y0FFTXF1QixLQUFLRCxTQUFTekUsS0FBS3hJLENBQWQsQ0FBWDtjQUNNbU4sS0FBS0YsU0FBU3pFLEtBQUtwRSxDQUFkLENBQVg7Y0FDTWdKLEtBQUtILFNBQVN6RSxLQUFLNkUsQ0FBZCxDQUFYOztjQUVNOWlCLEtBQUsxTCxJQUFJLENBQWY7O2VBRUswTCxFQUFMLElBQVcyaUIsR0FBR253QixDQUFkO2VBQ0t3TixLQUFLLENBQVYsSUFBZTJpQixHQUFHbHdCLENBQWxCO2VBQ0t1TixLQUFLLENBQVYsSUFBZTJpQixHQUFHandCLENBQWxCOztlQUVLc04sS0FBSyxDQUFWLElBQWU0aUIsR0FBR3B3QixDQUFsQjtlQUNLd04sS0FBSyxDQUFWLElBQWU0aUIsR0FBR253QixDQUFsQjtlQUNLdU4sS0FBSyxDQUFWLElBQWU0aUIsR0FBR2x3QixDQUFsQjs7ZUFFS3NOLEtBQUssQ0FBVixJQUFlNmlCLEdBQUdyd0IsQ0FBbEI7ZUFDS3dOLEtBQUssQ0FBVixJQUFlNmlCLEdBQUdwd0IsQ0FBbEI7ZUFDS3VOLEtBQUssQ0FBVixJQUFlNmlCLEdBQUdud0IsQ0FBbEI7Ozs7YUFJR21DLElBQVA7Ozs7RUE3QytCbXRCLFFBQW5DOztJQ0FhZSxVQUFiOzs7c0JBQ2N6bEIsTUFBWixFQUFvQjs7OztZQUVWO09BQ0gwa0IsU0FBY0YsU0FBZCxFQUhhLEdBSWZ4a0IsTUFKZTs7VUFNYjJrQixVQUFMLENBQWdCLFVBQUMzakIsUUFBRCxRQUFzQjtVQUFWekosSUFBVSxRQUFWQSxJQUFVOztVQUNoQyxDQUFDeUosU0FBUzRqQixXQUFkLEVBQTJCNWpCLFNBQVM2akIsa0JBQVQ7O1dBRXRCNVgsTUFBTCxHQUFjMVYsS0FBSzBWLE1BQUwsSUFBZSxDQUFDak0sU0FBUzRqQixXQUFULENBQXFCblMsR0FBckIsQ0FBeUJ2ZCxDQUF6QixHQUE2QjhMLFNBQVM0akIsV0FBVCxDQUFxQkUsR0FBckIsQ0FBeUI1dkIsQ0FBdkQsSUFBNEQsQ0FBekY7V0FDSzRQLE1BQUwsR0FBY3ZOLEtBQUt1TixNQUFMLElBQWU5RCxTQUFTNGpCLFdBQVQsQ0FBcUJuUyxHQUFyQixDQUF5QnRkLENBQXpCLEdBQTZCNkwsU0FBUzRqQixXQUFULENBQXFCRSxHQUFyQixDQUF5QjN2QixDQUFuRjtLQUpGOzs7OztFQVA0QnV2QixRQUFoQzs7SUNDYWdCLFlBQWI7Ozt3QkFDYzFsQixNQUFaLEVBQW9COzs7O1lBRVY7T0FDSDBrQixTQUFjRixTQUFkLEVBSGEsR0FJZnhrQixNQUplOztVQU1iMmtCLFVBQUwsQ0FBZ0IsVUFBQzNqQixRQUFELFFBQXNCO1VBQVZ6SixJQUFVLFFBQVZBLElBQVU7O1VBQ2hDLENBQUN5SixTQUFTNGpCLFdBQWQsRUFBMkI1akIsU0FBUzZqQixrQkFBVDtVQUN2QixDQUFDN2pCLFNBQVNta0IsZ0JBQWQsRUFBZ0Nua0IsU0FBUzJrQixlQUFULEdBQTJCLElBQUlDLGNBQUosR0FBcUJDLFlBQXJCLENBQWtDN2tCLFFBQWxDLENBQTNCOztXQUUzQnpKLElBQUwsR0FBWXlKLFNBQVNta0IsZ0JBQVQsR0FDVm5rQixTQUFTRCxVQUFULENBQW9CMUssUUFBcEIsQ0FBNkI2SyxLQURuQixHQUVWRixTQUFTMmtCLGVBQVQsQ0FBeUI1a0IsVUFBekIsQ0FBb0MxSyxRQUFwQyxDQUE2QzZLLEtBRi9DO0tBSkY7Ozs7O0VBUDhCd2pCLFFBQWxDOztJQ0Rhb0IsY0FBYjs7OzBCQUNjOWxCLE1BQVosRUFBb0I7Ozs7WUFFVjtPQUNIMGtCLFNBQWNGLFNBQWQsRUFIYSxHQUlmeGtCLE1BSmU7O1VBTWIya0IsVUFBTCxDQUFnQixVQUFDM2pCLFFBQUQsUUFBc0I7VUFBVnpKLElBQVUsUUFBVkEsSUFBVTs7VUFDaEMsQ0FBQ3lKLFNBQVM0akIsV0FBZCxFQUEyQjVqQixTQUFTNmpCLGtCQUFUOztXQUV0QmpnQixLQUFMLEdBQWFyTixLQUFLcU4sS0FBTCxJQUFjNUQsU0FBUzRqQixXQUFULENBQXFCblMsR0FBckIsQ0FBeUJ2ZCxDQUF6QixHQUE2QjhMLFNBQVM0akIsV0FBVCxDQUFxQkUsR0FBckIsQ0FBeUI1dkIsQ0FBakY7V0FDSzRQLE1BQUwsR0FBY3ZOLEtBQUt1TixNQUFMLElBQWU5RCxTQUFTNGpCLFdBQVQsQ0FBcUJuUyxHQUFyQixDQUF5QnRkLENBQXpCLEdBQTZCNkwsU0FBUzRqQixXQUFULENBQXFCRSxHQUFyQixDQUF5QjN2QixDQUFuRjtXQUNLNFAsS0FBTCxHQUFheE4sS0FBS3dOLEtBQUwsSUFBYy9ELFNBQVM0akIsV0FBVCxDQUFxQm5TLEdBQXJCLENBQXlCcmQsQ0FBekIsR0FBNkI0TCxTQUFTNGpCLFdBQVQsQ0FBcUJFLEdBQXJCLENBQXlCMXZCLENBQWpGO0tBTEY7Ozs7O0VBUGdDc3ZCLFFBQXBDOztJQ0NhcUIsaUJBQWI7Ozs2QkFDYy9sQixNQUFaLEVBQW9COzs7O1lBRVYsYUFGVTtZQUdWLElBQUlnbUIsT0FBSixDQUFZLENBQVosRUFBZSxDQUFmLENBSFU7aUJBSUw7T0FDUnRCLFNBQWNGLFNBQWQsRUFMYSxHQU1meGtCLE1BTmU7O1VBUWIya0IsVUFBTCxDQUFnQixVQUFDM2pCLFFBQUQsUUFBc0I7VUFBVnpKLElBQVUsUUFBVkEsSUFBVTt1QkFDVEEsS0FBS3VKLElBREk7VUFDMUJtbEIsSUFEMEIsY0FDN0Ivd0IsQ0FENkI7VUFDakJneEIsSUFEaUIsY0FDcEIvd0IsQ0FEb0I7O1VBRTlCZ3hCLFFBQVFubEIsU0FBU21rQixnQkFBVCxHQUE0Qm5rQixTQUFTRCxVQUFULENBQW9CMUssUUFBcEIsQ0FBNkI2SyxLQUF6RCxHQUFpRUYsU0FBU29rQixRQUF4RjtVQUNJdGtCLE9BQU9FLFNBQVNta0IsZ0JBQVQsR0FBNEJnQixNQUFNanZCLE1BQU4sR0FBZSxDQUEzQyxHQUErQ2l2QixNQUFNanZCLE1BQWhFOztVQUVJLENBQUM4SixTQUFTNGpCLFdBQWQsRUFBMkI1akIsU0FBUzZqQixrQkFBVDs7VUFFckJ1QixRQUFRcGxCLFNBQVM0akIsV0FBVCxDQUFxQm5TLEdBQXJCLENBQXlCdmQsQ0FBekIsR0FBNkI4TCxTQUFTNGpCLFdBQVQsQ0FBcUJFLEdBQXJCLENBQXlCNXZCLENBQXBFO1VBQ01teEIsUUFBUXJsQixTQUFTNGpCLFdBQVQsQ0FBcUJuUyxHQUFyQixDQUF5QnJkLENBQXpCLEdBQTZCNEwsU0FBUzRqQixXQUFULENBQXFCRSxHQUFyQixDQUF5QjF2QixDQUFwRTs7V0FFS3dZLElBQUwsR0FBYSxPQUFPcVksSUFBUCxLQUFnQixXQUFqQixHQUFnQzN3QixLQUFLZ2QsSUFBTCxDQUFVeFIsSUFBVixDQUFoQyxHQUFrRG1sQixPQUFPLENBQXJFO1dBQ0twWSxJQUFMLEdBQWEsT0FBT3FZLElBQVAsS0FBZ0IsV0FBakIsR0FBZ0M1d0IsS0FBS2dkLElBQUwsQ0FBVXhSLElBQVYsQ0FBaEMsR0FBa0RvbEIsT0FBTyxDQUFyRTs7O1dBR0s3WCxZQUFMLEdBQW9CL1ksS0FBS21kLEdBQUwsQ0FBU3pSLFNBQVM0akIsV0FBVCxDQUFxQm5TLEdBQXJCLENBQXlCdGQsQ0FBbEMsRUFBcUNHLEtBQUtneEIsR0FBTCxDQUFTdGxCLFNBQVM0akIsV0FBVCxDQUFxQkUsR0FBckIsQ0FBeUIzdkIsQ0FBbEMsQ0FBckMsQ0FBcEI7O1VBRU0yWSxTQUFTLElBQUkxTyxZQUFKLENBQWlCMEIsSUFBakIsQ0FBZjtVQUNFOE0sT0FBT3JXLEtBQUtxVyxJQURkO1VBRUVDLE9BQU90VyxLQUFLc1csSUFGZDs7YUFJTy9NLE1BQVAsRUFBZTtZQUNQeWxCLE9BQU96bEIsT0FBTzhNLElBQVAsR0FBZSxDQUFDQyxPQUFPdlksS0FBS2t4QixLQUFMLENBQVkxbEIsT0FBTzhNLElBQVIsR0FBa0I5TSxPQUFPOE0sSUFBUixHQUFnQkEsSUFBNUMsQ0FBUCxHQUE0RCxDQUE3RCxJQUFrRUMsSUFBOUY7O1lBRUk3TSxTQUFTbWtCLGdCQUFiLEVBQStCclgsT0FBT2hOLElBQVAsSUFBZXFsQixNQUFNSSxPQUFPLENBQVAsR0FBVyxDQUFqQixDQUFmLENBQS9CLEtBQ0t6WSxPQUFPaE4sSUFBUCxJQUFlcWxCLE1BQU1JLElBQU4sRUFBWXB4QixDQUEzQjs7O1dBR0YyWSxNQUFMLEdBQWNBLE1BQWQ7O1dBRUtqSixLQUFMLENBQVc0aEIsUUFBWCxDQUNFLElBQUk5eEIsU0FBSixDQUFZeXhCLFNBQVN4WSxPQUFPLENBQWhCLENBQVosRUFBZ0MsQ0FBaEMsRUFBbUN5WSxTQUFTeFksT0FBTyxDQUFoQixDQUFuQyxDQURGOztVQUlJdFcsS0FBS212QixTQUFULEVBQW9CMWxCLFNBQVNzVixTQUFULENBQW1COFAsUUFBUSxDQUFDLENBQTVCLEVBQStCLENBQS9CLEVBQWtDQyxRQUFRLENBQUMsQ0FBM0M7S0FqQ3RCOzs7OztFQVRtQzNCLFFBQXZDOztJQ0RhaUMsV0FBYjs7O3VCQUNjM21CLE1BQVosRUFBb0I7Ozs7WUFFVjtPQUNIMGtCLFNBQWNGLFNBQWQsRUFIYSxHQUlmeGtCLE1BSmU7O1VBTWIya0IsVUFBTCxDQUFnQixVQUFDM2pCLFFBQUQsUUFBc0I7VUFBVnpKLElBQVUsUUFBVkEsSUFBVTs7VUFDaEMsQ0FBQ3lKLFNBQVM0akIsV0FBZCxFQUEyQjVqQixTQUFTNmpCLGtCQUFUOztXQUV0QmpnQixLQUFMLEdBQWFyTixLQUFLcU4sS0FBTCxJQUFjNUQsU0FBUzRqQixXQUFULENBQXFCblMsR0FBckIsQ0FBeUJ2ZCxDQUF6QixHQUE2QjhMLFNBQVM0akIsV0FBVCxDQUFxQkUsR0FBckIsQ0FBeUI1dkIsQ0FBakY7V0FDSzRQLE1BQUwsR0FBY3ZOLEtBQUt1TixNQUFMLElBQWU5RCxTQUFTNGpCLFdBQVQsQ0FBcUJuUyxHQUFyQixDQUF5QnRkLENBQXpCLEdBQTZCNkwsU0FBUzRqQixXQUFULENBQXFCRSxHQUFyQixDQUF5QjN2QixDQUFuRjtXQUNLbU0sTUFBTCxHQUFjL0osS0FBSytKLE1BQUwsSUFBZU4sU0FBUzBmLEtBQVQsQ0FBZSxDQUFmLEVBQWtCcGYsTUFBbEIsQ0FBeUJ2SCxLQUF6QixFQUE3QjtLQUxGOzs7OztFQVA2QjJxQixRQUFqQzs7SUNBYWtDLFlBQWI7Ozt3QkFDYzVtQixNQUFaLEVBQW9COzs7O1lBRVY7T0FDSDBrQixTQUFjRixTQUFkLEVBSGEsR0FJZnhrQixNQUplOztVQU1iMmtCLFVBQUwsQ0FBZ0IsVUFBQzNqQixRQUFELFFBQXNCO1VBQVZ6SixJQUFVLFFBQVZBLElBQVU7O1VBQ2hDLENBQUN5SixTQUFTNmxCLGNBQWQsRUFBOEI3bEIsU0FBUzhsQixxQkFBVDtXQUN6QjdaLE1BQUwsR0FBYzFWLEtBQUswVixNQUFMLElBQWVqTSxTQUFTNmxCLGNBQVQsQ0FBd0I1WixNQUFyRDtLQUZGOzs7OztFQVA4QnlYLFFBQWxDOztJQ0NhcUMsY0FBYjs7OzBCQUNjL21CLE1BQVosRUFBb0I7Ozs7WUFFVjtPQUNIMGtCLFNBQWM1VSxRQUFkLEVBSGEsR0FJZjlQLE1BSmU7O1VBTWIya0IsVUFBTCxDQUFnQixVQUFDM2pCLFFBQUQsUUFBc0I7VUFBVnpKLElBQVUsUUFBVkEsSUFBVTs7VUFDOUJ5dkIsY0FBY2htQixTQUFTbWtCLGdCQUFULEdBQ2hCbmtCLFFBRGdCLEdBRWYsWUFBTTtpQkFDRWltQixhQUFUOztZQUVNQyxpQkFBaUIsSUFBSXRCLGNBQUosRUFBdkI7O3VCQUVldUIsWUFBZixDQUNFLFVBREYsRUFFRSxJQUFJQyxlQUFKLENBQ0UsSUFBSWhvQixZQUFKLENBQWlCNEIsU0FBU29rQixRQUFULENBQWtCbHVCLE1BQWxCLEdBQTJCLENBQTVDLENBREYsRUFFRSxDQUZGLEVBR0Vtd0IsaUJBSEYsQ0FHb0JybUIsU0FBU29rQixRQUg3QixDQUZGOzt1QkFRZWtDLFFBQWYsQ0FDRSxJQUFJRixlQUFKLENBQ0UsS0FBS3BtQixTQUFTMGYsS0FBVCxDQUFleHBCLE1BQWYsR0FBd0IsQ0FBeEIsR0FBNEIsS0FBNUIsR0FBb0Nxd0IsV0FBcEMsR0FBa0RDLFdBQXZELEVBQW9FeG1CLFNBQVMwZixLQUFULENBQWV4cEIsTUFBZixHQUF3QixDQUE1RixDQURGLEVBRUUsQ0FGRixFQUdFdXdCLGdCQUhGLENBR21Cem1CLFNBQVMwZixLQUg1QixDQURGOztlQU9Pd0csY0FBUDtPQXBCQSxFQUZKOztXQXlCS3hZLFNBQUwsR0FBaUJzWSxZQUFZam1CLFVBQVosQ0FBdUIxSyxRQUF2QixDQUFnQzZLLEtBQWpEO1dBQ0syTixRQUFMLEdBQWdCbVksWUFBWTN1QixLQUFaLENBQWtCNkksS0FBbEM7O2FBRU8sSUFBSTBrQixjQUFKLEdBQXFCQyxZQUFyQixDQUFrQzdrQixRQUFsQyxDQUFQO0tBN0JGOzs7Ozs7aUNBaUNXMUssTUF4Q2YsRUF3Q3VCd2EsSUF4Q3ZCLEVBd0NpRjtVQUFwREcsU0FBb0QsdUVBQXhDLENBQXdDO1VBQXJDRCw0QkFBcUMsdUVBQU4sSUFBTTs7VUFDdkUwVyxLQUFLLEtBQUtud0IsSUFBTCxDQUFVc0MsRUFBckI7VUFDTTh0QixLQUFLcnhCLE9BQU9nQixHQUFQLENBQVcsU0FBWCxFQUFzQkMsSUFBdEIsQ0FBMkJzQyxFQUF0Qzs7V0FFS00sT0FBTCxDQUFhLGNBQWIsRUFBNkI7YUFDdEJ1dEIsRUFEc0I7Y0FFckJDLEVBRnFCO2tCQUFBOzRCQUFBOztPQUE3Qjs7OztFQTVDZ0NqRCxRQUFwQzs7QUNBQSxTQUFTa0QsUUFBVCxDQUFrQjFtQixLQUFsQixFQUF5QjtNQUNwQkEsTUFBTWhLLE1BQU4sS0FBaUIsQ0FBckIsRUFBd0IsT0FBTyxDQUFFMndCLFFBQVQ7O01BRXBCcFYsTUFBTXZSLE1BQU0sQ0FBTixDQUFWOztPQUVLLElBQUlsSyxJQUFJLENBQVIsRUFBVzh3QixJQUFJNW1CLE1BQU1oSyxNQUExQixFQUFrQ0YsSUFBSTh3QixDQUF0QyxFQUF5QyxFQUFHOXdCLENBQTVDLEVBQWdEO1FBQzNDa0ssTUFBT2xLLENBQVAsSUFBYXliLEdBQWpCLEVBQXNCQSxNQUFNdlIsTUFBTWxLLENBQU4sQ0FBTjs7O1NBR2hCeWIsR0FBUDs7O0FBR0QsSUFBYXNWLFdBQWI7Ozt1QkFDYy9uQixNQUFaLEVBQW9COzs7O1lBRVY7T0FDSDBrQixTQUFjdk8sS0FBZCxFQUhhLEdBSWZuVyxNQUplOztVQU1iMmtCLFVBQUwsQ0FBZ0IsVUFBQzNqQixRQUFELFFBQXNCO1VBQVZ6SixJQUFVLFFBQVZBLElBQVU7O1VBQzlCeXdCLGFBQWFobkIsU0FBU3hJLFVBQTVCOztVQUVNeXZCLE9BQU9qbkIsU0FBU21rQixnQkFBVCxHQUNUbmtCLFFBRFMsR0FFTixZQUFNO2lCQUNBaW1CLGFBQVQ7O1lBRU1DLGlCQUFpQixJQUFJdEIsY0FBSixFQUF2Qjs7dUJBRWV1QixZQUFmLENBQ0UsVUFERixFQUVFLElBQUlDLGVBQUosQ0FDRSxJQUFJaG9CLFlBQUosQ0FBaUI0QixTQUFTb2tCLFFBQVQsQ0FBa0JsdUIsTUFBbEIsR0FBMkIsQ0FBNUMsQ0FERixFQUVFLENBRkYsRUFHRW13QixpQkFIRixDQUdvQnJtQixTQUFTb2tCLFFBSDdCLENBRkY7O1lBUUMxRSxRQUFRMWYsU0FBUzBmLEtBQXZCO1lBQThCd0gsY0FBY3hILE1BQU14cEIsTUFBbEQ7WUFBMERpeEIsTUFBTW5uQixTQUFTb25CLGFBQVQsQ0FBdUIsQ0FBdkIsQ0FBaEU7O1lBRVdDLGVBQWUsSUFBSWpwQixZQUFKLENBQWlCOG9CLGNBQWMsQ0FBL0IsQ0FBckI7O1lBRU1JLFdBQVcsSUFBSWxwQixZQUFKLENBQWlCOG9CLGNBQWMsQ0FBL0IsQ0FBakI7QUFDQSxBQUNMLFlBQU1LLFlBQVksSUFBSWhCLFdBQUosQ0FBZ0JXLGNBQWMsQ0FBOUIsQ0FBbEI7O2FBRVUsSUFBSWx4QixJQUFJLENBQWIsRUFBZ0JBLElBQUlreEIsV0FBcEIsRUFBaUNseEIsR0FBakMsRUFBc0M7Y0FDOUJ3eEIsS0FBS3h4QixJQUFJLENBQWY7QUFDQSxBQUNBLGNBQU1zSyxTQUFTb2YsTUFBTTFwQixDQUFOLEVBQVNzSyxNQUFULElBQW1CLElBQUkzTSxPQUFKLEVBQWxDOztvQkFFSTZ6QixFQUFWLElBQWdCOUgsTUFBTTFwQixDQUFOLEVBQVNtaEIsQ0FBekI7b0JBQ2dCcVEsS0FBSyxDQUFmLElBQW9COUgsTUFBTTFwQixDQUFOLEVBQVN1bEIsQ0FBN0I7b0JBQ1VpTSxLQUFLLENBQWYsSUFBb0I5SCxNQUFNMXBCLENBQU4sRUFBU3d1QixDQUE3Qjs7dUJBRWFnRCxFQUFiLElBQW1CbG5CLE9BQU9wTSxDQUExQjt1QkFDYXN6QixLQUFLLENBQWxCLElBQXVCbG5CLE9BQU9uTSxDQUE5Qjt1QkFDYXF6QixLQUFLLENBQWxCLElBQXVCbG5CLE9BQU9sTSxDQUE5Qjs7bUJBRVNzckIsTUFBTTFwQixDQUFOLEVBQVNtaEIsQ0FBVCxHQUFhLENBQWIsR0FBaUIsQ0FBMUIsSUFBK0JnUSxJQUFJbnhCLENBQUosRUFBTyxDQUFQLEVBQVU5QixDQUF6QyxDQWJvQzttQkFjM0J3ckIsTUFBTTFwQixDQUFOLEVBQVNtaEIsQ0FBVCxHQUFhLENBQWIsR0FBaUIsQ0FBMUIsSUFBK0JnUSxJQUFJbnhCLENBQUosRUFBTyxDQUFQLEVBQVU3QixDQUF6Qzs7bUJBRVN1ckIsTUFBTTFwQixDQUFOLEVBQVN1bEIsQ0FBVCxHQUFhLENBQWIsR0FBaUIsQ0FBMUIsSUFBK0I0TCxJQUFJbnhCLENBQUosRUFBTyxDQUFQLEVBQVU5QixDQUF6QyxDQWhCb0M7bUJBaUIzQndyQixNQUFNMXBCLENBQU4sRUFBU3VsQixDQUFULEdBQWEsQ0FBYixHQUFpQixDQUExQixJQUErQjRMLElBQUlueEIsQ0FBSixFQUFPLENBQVAsRUFBVTdCLENBQXpDOzttQkFFU3VyQixNQUFNMXBCLENBQU4sRUFBU3d1QixDQUFULEdBQWEsQ0FBYixHQUFpQixDQUExQixJQUErQjJDLElBQUlueEIsQ0FBSixFQUFPLENBQVAsRUFBVTlCLENBQXpDLENBbkJvQzttQkFvQjNCd3JCLE1BQU0xcEIsQ0FBTixFQUFTd3VCLENBQVQsR0FBYSxDQUFiLEdBQWlCLENBQTFCLElBQStCMkMsSUFBSW54QixDQUFKLEVBQU8sQ0FBUCxFQUFVN0IsQ0FBekM7Ozt1QkFHYWd5QixZQUFmLENBQ0UsUUFERixFQUVFLElBQUlDLGVBQUosQ0FDRWlCLFlBREYsRUFFRSxDQUZGLENBRkY7O3VCQVFlbEIsWUFBZixDQUNFLElBREYsRUFFRSxJQUFJQyxlQUFKLENBQ0VrQixRQURGLEVBRUUsQ0FGRixDQUZGOzt1QkFRVWhCLFFBQWYsQ0FDTyxJQUFJRixlQUFKLENBQ0UsS0FBS1EsU0FBU2xILEtBQVQsSUFBa0IsQ0FBbEIsR0FBc0IsS0FBdEIsR0FBOEI2RyxXQUE5QixHQUE0Q0MsV0FBakQsRUFBOERVLGNBQWMsQ0FBNUUsQ0FERixFQUVFLENBRkYsRUFHRVQsZ0JBSEYsQ0FHbUIvRyxLQUhuQixDQURQOztlQU9Zd0csY0FBUDtPQW5FRSxFQUZOOztVQXdFTWYsUUFBUThCLEtBQUtsbkIsVUFBTCxDQUFnQjFLLFFBQWhCLENBQXlCNkssS0FBdkM7O1VBRUksQ0FBQzhtQixXQUFXUyxhQUFoQixFQUErQlQsV0FBV1MsYUFBWCxHQUEyQixDQUEzQjtVQUMzQixDQUFDVCxXQUFXVSxjQUFoQixFQUFnQ1YsV0FBV1UsY0FBWCxHQUE0QixDQUE1Qjs7VUFFMUJDLFFBQVEsQ0FBZDtVQUNNQyxRQUFRWixXQUFXUyxhQUF6QjtVQUNNSSxRQUFRLENBQUNiLFdBQVdVLGNBQVgsR0FBNEIsQ0FBN0IsS0FBbUNWLFdBQVdTLGFBQVgsR0FBMkIsQ0FBOUQsS0FBb0VULFdBQVdTLGFBQVgsR0FBMkIsQ0FBL0YsQ0FBZDtVQUNNSyxRQUFRM0MsTUFBTWp2QixNQUFOLEdBQWUsQ0FBZixHQUFtQixDQUFqQzs7V0FFSzZYLE9BQUwsR0FBZSxDQUNib1gsTUFBTXlDLFFBQVEsQ0FBZCxDQURhLEVBQ0t6QyxNQUFNeUMsUUFBUSxDQUFSLEdBQVksQ0FBbEIsQ0FETCxFQUMyQnpDLE1BQU15QyxRQUFRLENBQVIsR0FBWSxDQUFsQixDQUQzQjtZQUVQRCxRQUFRLENBQWQsQ0FGYSxFQUVLeEMsTUFBTXdDLFFBQVEsQ0FBUixHQUFZLENBQWxCLENBRkwsRUFFMkJ4QyxNQUFNd0MsUUFBUSxDQUFSLEdBQVksQ0FBbEIsQ0FGM0I7WUFHUEcsUUFBUSxDQUFkLENBSGEsRUFHSzNDLE1BQU0yQyxRQUFRLENBQVIsR0FBWSxDQUFsQixDQUhMLEVBRzJCM0MsTUFBTTJDLFFBQVEsQ0FBUixHQUFZLENBQWxCLENBSDNCO1lBSVBELFFBQVEsQ0FBZCxDQUphLEVBSUsxQyxNQUFNMEMsUUFBUSxDQUFSLEdBQVksQ0FBbEIsQ0FKTCxFQUkyQjFDLE1BQU0wQyxRQUFRLENBQVIsR0FBWSxDQUFsQixDQUozQixDQUFmOztXQU9LM1osUUFBTCxHQUFnQixDQUFDOFksV0FBV1MsYUFBWCxHQUEyQixDQUE1QixFQUErQlQsV0FBV1UsY0FBWCxHQUE0QixDQUEzRCxDQUFoQjs7YUFFT1QsSUFBUDtLQTlGRjs7Ozs7O2lDQWtHVzN4QixNQXpHZixFQXlHdUJ3YSxJQXpHdkIsRUF5RzZCRyxTQXpHN0IsRUF5RzZFO1VBQXJDRCw0QkFBcUMsdUVBQU4sSUFBTTs7VUFDbkUwVyxLQUFLLEtBQUtud0IsSUFBTCxDQUFVc0MsRUFBckI7VUFDTTh0QixLQUFLcnhCLE9BQU9nQixHQUFQLENBQVcsU0FBWCxFQUFzQkMsSUFBdEIsQ0FBMkJzQyxFQUF0Qzs7V0FFS00sT0FBTCxDQUFhLGNBQWIsRUFBNkI7YUFDdEJ1dEIsRUFEc0I7Y0FFckJDLEVBRnFCO2tCQUFBOzRCQUFBOztPQUE3Qjs7Ozs4QkFTT3J4QixNQXRIWCxFQXNIbUJrYixFQXRIbkIsRUFzSHVCRSxFQXRIdkIsRUFzSDJCZ0IsUUF0SDNCLEVBc0hxQztVQUMzQnZVLE9BQU8sS0FBSzVHLElBQUwsQ0FBVXNDLEVBQXZCO1VBQ00wVSxPQUFPalksT0FBT2dCLEdBQVAsQ0FBVyxTQUFYLEVBQXNCQyxJQUF0QixDQUEyQnNDLEVBQXhDOztXQUVLTSxPQUFMLENBQWEsV0FBYixFQUEwQjtrQkFBQTtrQkFBQTtjQUFBO2NBQUE7O09BQTFCOzs7O3NDQVNnQjdELE1BbklwQixFQW1JNEJ5YyxLQW5JNUIsRUFtSW1DO1VBQ3pCNVUsT0FBTyxLQUFLNUcsSUFBTCxDQUFVc0MsRUFBdkI7VUFDTTBVLE9BQU9qWSxPQUFPZ0IsR0FBUCxDQUFXLFNBQVgsRUFBc0JDLElBQXRCLENBQTJCc0MsRUFBeEM7O1dBRUtNLE9BQUwsQ0FBYSxtQkFBYixFQUFrQztrQkFBQTtrQkFBQTs7T0FBbEM7Ozs7RUF2STZCdXFCLFFBQWpDOztJQ1phcUUsVUFBYjs7O3NCQUNjL29CLE1BQVosRUFBb0I7Ozs7WUFFVjtPQUNIMGtCLFNBQWN4TyxJQUFkLEVBSGEsR0FJZmxXLE1BSmU7O1VBTWIya0IsVUFBTCxDQUFnQixVQUFDM2pCLFFBQUQsUUFBc0I7VUFBVnpKLElBQVUsUUFBVkEsSUFBVTs7VUFDaEMsQ0FBQ3lKLFNBQVNta0IsZ0JBQWQsRUFBZ0M7bUJBQ2xCLFlBQU07Y0FDVjZELE9BQU8sSUFBSXBELGNBQUosRUFBYjs7ZUFFS3VCLFlBQUwsQ0FDRSxVQURGLEVBRUUsSUFBSUMsZUFBSixDQUNFLElBQUlob0IsWUFBSixDQUFpQjRCLFNBQVNva0IsUUFBVCxDQUFrQmx1QixNQUFsQixHQUEyQixDQUE1QyxDQURGLEVBRUUsQ0FGRixFQUdFbXdCLGlCQUhGLENBR29Ccm1CLFNBQVNva0IsUUFIN0IsQ0FGRjs7aUJBUU80RCxJQUFQO1NBWFMsRUFBWDs7O1VBZUk5eEIsU0FBUzhKLFNBQVNELFVBQVQsQ0FBb0IxSyxRQUFwQixDQUE2QjZLLEtBQTdCLENBQW1DaEssTUFBbkMsR0FBNEMsQ0FBM0Q7VUFDTXNwQixPQUFPLFNBQVBBLElBQU87ZUFBSyxJQUFJN3JCLFNBQUosR0FBY3MwQixTQUFkLENBQXdCam9CLFNBQVNELFVBQVQsQ0FBb0IxSyxRQUFwQixDQUE2QjZLLEtBQXJELEVBQTREZ29CLElBQUUsQ0FBOUQsQ0FBTDtPQUFiOztVQUVNQyxLQUFLM0ksS0FBSyxDQUFMLENBQVg7VUFDTTRJLEtBQUs1SSxLQUFLdHBCLFNBQVMsQ0FBZCxDQUFYOztXQUVLSyxJQUFMLEdBQVksQ0FDVjR4QixHQUFHajBCLENBRE8sRUFDSmkwQixHQUFHaDBCLENBREMsRUFDRWcwQixHQUFHL3pCLENBREwsRUFFVmcwQixHQUFHbDBCLENBRk8sRUFFSmswQixHQUFHajBCLENBRkMsRUFFRWkwQixHQUFHaDBCLENBRkwsRUFHVjhCLE1BSFUsQ0FBWjs7YUFNTzhKLFFBQVA7S0E3QkY7Ozs7OztpQ0FpQ1cxSyxNQXhDZixFQXdDdUJ3YSxJQXhDdkIsRUF3QzZCRyxTQXhDN0IsRUF3QzZFO1VBQXJDRCw0QkFBcUMsdUVBQU4sSUFBTTs7VUFDbkUwVyxLQUFLLEtBQUtud0IsSUFBTCxDQUFVc0MsRUFBckI7VUFDTTh0QixLQUFLcnhCLE9BQU9nQixHQUFQLENBQVcsU0FBWCxFQUFzQkMsSUFBdEIsQ0FBMkJzQyxFQUF0Qzs7V0FFS00sT0FBTCxDQUFhLGNBQWIsRUFBNkI7YUFDdEJ1dEIsRUFEc0I7Y0FFckJDLEVBRnFCO2tCQUFBOzRCQUFBOztPQUE3Qjs7OztFQTVDNEJqRCxRQUFoQzs7OztBQ01BLElBQU0yRSxPQUFPL3pCLEtBQUsrbUIsRUFBTCxHQUFVLENBQXZCOzs7QUFHQSxTQUFTaU4seUJBQVQsQ0FBbUNDLE1BQW5DLEVBQTJDdHRCLElBQTNDLEVBQWlEK0QsTUFBakQsRUFBeUQ7OztNQUNqRHdwQixpQkFBaUIsQ0FBdkI7TUFDSUMsY0FBYyxJQUFsQjs7T0FFS255QixHQUFMLENBQVMsU0FBVCxFQUFvQjZqQixnQkFBcEIsQ0FBcUMsRUFBQ2ptQixHQUFHLENBQUosRUFBT0MsR0FBRyxDQUFWLEVBQWFDLEdBQUcsQ0FBaEIsRUFBckM7U0FDT2lCLFFBQVAsQ0FBZ0JrSyxHQUFoQixDQUFvQixDQUFwQixFQUF1QixDQUF2QixFQUEwQixDQUExQjs7O01BR01tcEIsU0FBU3p0QixJQUFmO01BQ0UwdEIsY0FBYyxJQUFJQyxRQUFKLEVBRGhCOztjQUdZbHNCLEdBQVosQ0FBZ0I2ckIsT0FBTzdrQixNQUF2Qjs7TUFFTW1sQixZQUFZLElBQUlELFFBQUosRUFBbEI7O1lBRVV2ekIsUUFBVixDQUFtQmxCLENBQW5CLEdBQXVCNkssT0FBTzhwQixJQUE5QixDQWZ1RDtZQWdCN0Nwc0IsR0FBVixDQUFjaXNCLFdBQWQ7O01BRU1sakIsT0FBTyxJQUFJelIsVUFBSixFQUFiOztNQUVJKzBCLFVBQVUsS0FBZDs7O2dCQUVnQixLQUZoQjtNQUdFQyxlQUFlLEtBSGpCO01BSUVDLFdBQVcsS0FKYjtNQUtFQyxZQUFZLEtBTGQ7O1NBT09sZ0IsRUFBUCxDQUFVLFdBQVYsRUFBdUIsVUFBQ21nQixXQUFELEVBQWNDLENBQWQsRUFBaUJDLENBQWpCLEVBQW9CQyxhQUFwQixFQUFzQztZQUNuRHRqQixHQUFSLENBQVlzakIsY0FBY24xQixDQUExQjtRQUNJbTFCLGNBQWNuMUIsQ0FBZCxHQUFrQixHQUF0QjtnQkFDWSxJQUFWO0dBSEo7O01BTU1vMUIsY0FBYyxTQUFkQSxXQUFjLFFBQVM7UUFDdkIsTUFBS0MsT0FBTCxLQUFpQixLQUFyQixFQUE0Qjs7UUFFdEJDLFlBQVksT0FBT3hyQixNQUFNd3JCLFNBQWIsS0FBMkIsUUFBM0IsR0FDZHhyQixNQUFNd3JCLFNBRFEsR0FDSSxPQUFPeHJCLE1BQU15ckIsWUFBYixLQUE4QixRQUE5QixHQUNoQnpyQixNQUFNeXJCLFlBRFUsR0FDSyxPQUFPenJCLE1BQU0wckIsWUFBYixLQUE4QixVQUE5QixHQUNuQjFyQixNQUFNMHJCLFlBQU4sRUFEbUIsR0FDSSxDQUgvQjtRQUlNQyxZQUFZLE9BQU8zckIsTUFBTTJyQixTQUFiLEtBQTJCLFFBQTNCLEdBQ2QzckIsTUFBTTJyQixTQURRLEdBQ0ksT0FBTzNyQixNQUFNNHJCLFlBQWIsS0FBOEIsUUFBOUIsR0FDaEI1ckIsTUFBTTRyQixZQURVLEdBQ0ssT0FBTzVyQixNQUFNNnJCLFlBQWIsS0FBOEIsVUFBOUIsR0FDbkI3ckIsTUFBTTZyQixZQUFOLEVBRG1CLEdBQ0ksQ0FIL0I7O2NBS1VoekIsUUFBVixDQUFtQjNDLENBQW5CLElBQXdCczFCLFlBQVksS0FBcEM7Z0JBQ1kzeUIsUUFBWixDQUFxQjVDLENBQXJCLElBQTBCMDFCLFlBQVksS0FBdEM7O2dCQUVZOXlCLFFBQVosQ0FBcUI1QyxDQUFyQixHQUF5QkksS0FBS21kLEdBQUwsQ0FBUyxDQUFDNFcsSUFBVixFQUFnQi96QixLQUFLd3ZCLEdBQUwsQ0FBU3VFLElBQVQsRUFBZU0sWUFBWTd4QixRQUFaLENBQXFCNUMsQ0FBcEMsQ0FBaEIsQ0FBekI7R0FmRjs7TUFrQk1rQyxVQUFVc3lCLE9BQU9weUIsR0FBUCxDQUFXLFNBQVgsQ0FBaEI7O01BRU15ekIsWUFBWSxTQUFaQSxTQUFZLFFBQVM7WUFDakI5ckIsTUFBTStyQixPQUFkO1dBQ08sRUFBTCxDQURGO1dBRU8sRUFBTDs7c0JBQ2dCLElBQWQ7OztXQUdHLEVBQUwsQ0FORjtXQU9PLEVBQUw7O21CQUNhLElBQVg7OztXQUdHLEVBQUwsQ0FYRjtXQVlPLEVBQUw7O3VCQUNpQixJQUFmOzs7V0FHRyxFQUFMLENBaEJGO1dBaUJPLEVBQUw7O29CQUNjLElBQVo7OztXQUdHLEVBQUw7O2dCQUNVaGtCLEdBQVIsQ0FBWStpQixPQUFaO1lBQ0lBLFlBQVksSUFBaEIsRUFBc0IzeUIsUUFBUWdqQixtQkFBUixDQUE0QixFQUFDbGxCLEdBQUcsQ0FBSixFQUFPQyxHQUFHLEdBQVYsRUFBZUMsR0FBRyxDQUFsQixFQUE1QjtrQkFDWixLQUFWOzs7V0FHRyxFQUFMOztzQkFDZ0IsR0FBZDs7Ozs7R0E3Qk47O01Bb0NNNjFCLFVBQVUsU0FBVkEsT0FBVSxRQUFTO1lBQ2Zoc0IsTUFBTStyQixPQUFkO1dBQ08sRUFBTCxDQURGO1dBRU8sRUFBTDs7c0JBQ2dCLEtBQWQ7OztXQUdHLEVBQUwsQ0FORjtXQU9PLEVBQUw7O21CQUNhLEtBQVg7OztXQUdHLEVBQUwsQ0FYRjtXQVlPLEVBQUw7O3VCQUNpQixLQUFmOzs7V0FHRyxFQUFMLENBaEJGO1dBaUJPLEVBQUw7O29CQUNjLEtBQVo7OztXQUdHLEVBQUw7O3NCQUNnQixJQUFkOzs7OztHQXZCTjs7V0E4QlN6YyxJQUFULENBQWN4VixnQkFBZCxDQUErQixXQUEvQixFQUE0Q3d4QixXQUE1QyxFQUF5RCxLQUF6RDtXQUNTaGMsSUFBVCxDQUFjeFYsZ0JBQWQsQ0FBK0IsU0FBL0IsRUFBMENneUIsU0FBMUMsRUFBcUQsS0FBckQ7V0FDU3hjLElBQVQsQ0FBY3hWLGdCQUFkLENBQStCLE9BQS9CLEVBQXdDa3lCLE9BQXhDLEVBQWlELEtBQWpEOztPQUVLVCxPQUFMLEdBQWUsS0FBZjtPQUNLVSxTQUFMLEdBQWlCO1dBQU1yQixTQUFOO0dBQWpCOztPQUVLc0IsWUFBTCxHQUFvQixxQkFBYTtjQUNyQjVxQixHQUFWLENBQWMsQ0FBZCxFQUFpQixDQUFqQixFQUFvQixDQUFDLENBQXJCO1NBQ0s2cUIsZUFBTCxDQUFxQkMsU0FBckI7R0FGRjs7OztNQU9NQyxnQkFBZ0IsSUFBSTMyQixTQUFKLEVBQXRCO01BQ0U2dUIsUUFBUSxJQUFJaHBCLEtBQUosRUFEVjs7T0FHSzhMLE1BQUwsR0FBYyxpQkFBUztRQUNqQixNQUFLa2tCLE9BQUwsS0FBaUIsS0FBckIsRUFBNEI7O1lBRXBCZSxTQUFTLEdBQWpCO1lBQ1FqMkIsS0FBS3d2QixHQUFMLENBQVN5RyxLQUFULEVBQWdCLEdBQWhCLEVBQXFCQSxLQUFyQixDQUFSOztrQkFFY2hyQixHQUFkLENBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLENBQXhCOztRQUVNaXJCLFFBQVFoQyxpQkFBaUIrQixLQUFqQixHQUF5QnZyQixPQUFPd3JCLEtBQWhDLEdBQXdDL0IsV0FBdEQ7O1FBRUlnQyxXQUFKLEVBQWlCSCxjQUFjbDJCLENBQWQsR0FBa0IsQ0FBQ28yQixLQUFuQjtRQUNieEIsWUFBSixFQUFrQnNCLGNBQWNsMkIsQ0FBZCxHQUFrQm8yQixLQUFsQjtRQUNkdkIsUUFBSixFQUFjcUIsY0FBY3AyQixDQUFkLEdBQWtCLENBQUNzMkIsS0FBbkI7UUFDVnRCLFNBQUosRUFBZW9CLGNBQWNwMkIsQ0FBZCxHQUFrQnMyQixLQUFsQjs7O1VBR1R0MkIsQ0FBTixHQUFVeTBCLFlBQVk3eEIsUUFBWixDQUFxQjVDLENBQS9CO1VBQ01DLENBQU4sR0FBVTAwQixVQUFVL3hCLFFBQVYsQ0FBbUIzQyxDQUE3QjtVQUNNdTJCLEtBQU4sR0FBYyxLQUFkOztTQUVLbnhCLFlBQUwsQ0FBa0JpcEIsS0FBbEI7O2tCQUVjbUksZUFBZCxDQUE4QmxsQixJQUE5Qjs7WUFFUTJULG1CQUFSLENBQTRCLEVBQUNsbEIsR0FBR28yQixjQUFjcDJCLENBQWxCLEVBQXFCQyxHQUFHLENBQXhCLEVBQTJCQyxHQUFHazJCLGNBQWNsMkIsQ0FBNUMsRUFBNUI7WUFDUTZsQixrQkFBUixDQUEyQixFQUFDL2xCLEdBQUdvMkIsY0FBY2wyQixDQUFsQixFQUFxQkQsR0FBRyxDQUF4QixFQUEyQkMsR0FBRyxDQUFDazJCLGNBQWNwMkIsQ0FBN0MsRUFBM0I7WUFDUWltQixnQkFBUixDQUF5QixFQUFDam1CLEdBQUcsQ0FBSixFQUFPQyxHQUFHLENBQVYsRUFBYUMsR0FBRyxDQUFoQixFQUF6QjtHQTFCRjs7U0E2Qk80VSxFQUFQLENBQVUsZUFBVixFQUEyQixZQUFNO1dBQ3hCckYsT0FBUCxDQUFla2YsR0FBZixDQUFtQixjQUFuQixFQUFtQzlxQixnQkFBbkMsQ0FBb0QsUUFBcEQsRUFBOEQsWUFBTTtVQUM5RCxNQUFLeXhCLE9BQUwsS0FBaUIsS0FBckIsRUFBNEI7Z0JBQ2xCbjBCLFFBQVYsQ0FBbUJNLElBQW5CLENBQXdCK3lCLE9BQU9yekIsUUFBL0I7S0FGRjtHQURGOzs7SUFRV3UxQjs2QkFPQ3QxQixNQUFaLEVBQWlDO1FBQWIwSixNQUFhLHVFQUFKLEVBQUk7OztTQUMxQjFKLE1BQUwsR0FBY0EsTUFBZDtTQUNLMEosTUFBTCxHQUFjQSxNQUFkOztRQUVJLENBQUMsS0FBS0EsTUFBTCxDQUFZNnJCLEtBQWpCLEVBQXdCO1dBQ2pCN3JCLE1BQUwsQ0FBWTZyQixLQUFaLEdBQW9CamlCLFNBQVNraUIsY0FBVCxDQUF3QixTQUF4QixDQUFwQjs7Ozs7OzRCQUlJbm5CLFVBQVM7OztXQUNWb25CLFFBQUwsR0FBZ0IsSUFBSXpDLHlCQUFKLENBQThCM2tCLFNBQVFrZixHQUFSLENBQVksUUFBWixDQUE5QixFQUFxRCxLQUFLdnRCLE1BQTFELEVBQWtFLEtBQUswSixNQUF2RSxDQUFoQjs7VUFFSSx3QkFBd0I0SixRQUF4QixJQUNDLDJCQUEyQkEsUUFENUIsSUFFQyw4QkFBOEJBLFFBRm5DLEVBRTZDO1lBQ3JDb2lCLFVBQVVwaUIsU0FBUzJFLElBQXpCOztZQUVNMGQsb0JBQW9CLFNBQXBCQSxpQkFBb0IsR0FBTTtjQUMxQnJpQixTQUFTc2lCLGtCQUFULEtBQWdDRixPQUFoQyxJQUNDcGlCLFNBQVN1aUIscUJBQVQsS0FBbUNILE9BRHBDLElBRUNwaUIsU0FBU3dpQix3QkFBVCxLQUFzQ0osT0FGM0MsRUFFb0Q7bUJBQzdDRCxRQUFMLENBQWN2QixPQUFkLEdBQXdCLElBQXhCO21CQUNLeHFCLE1BQUwsQ0FBWTZyQixLQUFaLENBQWtCUSxLQUFsQixDQUF3QkMsT0FBeEIsR0FBa0MsTUFBbEM7V0FKRixNQUtPO21CQUNBUCxRQUFMLENBQWN2QixPQUFkLEdBQXdCLEtBQXhCO21CQUNLeHFCLE1BQUwsQ0FBWTZyQixLQUFaLENBQWtCUSxLQUFsQixDQUF3QkMsT0FBeEIsR0FBa0MsT0FBbEM7O1NBUko7O2lCQVlTdnpCLGdCQUFULENBQTBCLG1CQUExQixFQUErQ2t6QixpQkFBL0MsRUFBa0UsS0FBbEU7aUJBQ1NsekIsZ0JBQVQsQ0FBMEIsc0JBQTFCLEVBQWtEa3pCLGlCQUFsRCxFQUFxRSxLQUFyRTtpQkFDU2x6QixnQkFBVCxDQUEwQix5QkFBMUIsRUFBcURrekIsaUJBQXJELEVBQXdFLEtBQXhFOztZQUVNTSxtQkFBbUIsU0FBbkJBLGdCQUFtQixHQUFZO2tCQUMzQkMsSUFBUixDQUFhLHFCQUFiO1NBREY7O2lCQUlTenpCLGdCQUFULENBQTBCLGtCQUExQixFQUE4Q3d6QixnQkFBOUMsRUFBZ0UsS0FBaEU7aUJBQ1N4ekIsZ0JBQVQsQ0FBMEIscUJBQTFCLEVBQWlEd3pCLGdCQUFqRCxFQUFtRSxLQUFuRTtpQkFDU3h6QixnQkFBVCxDQUEwQix3QkFBMUIsRUFBb0R3ekIsZ0JBQXBELEVBQXNFLEtBQXRFOztpQkFFU0UsYUFBVCxDQUF1QixNQUF2QixFQUErQjF6QixnQkFBL0IsQ0FBZ0QsT0FBaEQsRUFBeUQsWUFBTTtrQkFDckQyekIsa0JBQVIsR0FBNkJWLFFBQVFVLGtCQUFSLElBQ3hCVixRQUFRVyxxQkFEZ0IsSUFFeEJYLFFBQVFZLHdCQUZiOztrQkFJUUMsaUJBQVIsR0FBNEJiLFFBQVFhLGlCQUFSLElBQ3ZCYixRQUFRYyxvQkFEZSxJQUV2QmQsUUFBUWUsb0JBRmUsSUFHdkJmLFFBQVFnQix1QkFIYjs7Y0FLSSxXQUFXL3NCLElBQVgsQ0FBZ0JnSixVQUFVQyxTQUExQixDQUFKLEVBQTBDO2dCQUNsQytqQixtQkFBbUIsU0FBbkJBLGdCQUFtQixHQUFNO2tCQUN6QnJqQixTQUFTc2pCLGlCQUFULEtBQStCbEIsT0FBL0IsSUFDQ3BpQixTQUFTdWpCLG9CQUFULEtBQWtDbkIsT0FEbkMsSUFFQ3BpQixTQUFTd2pCLG9CQUFULEtBQWtDcEIsT0FGdkMsRUFFZ0Q7eUJBQ3JDaHpCLG1CQUFULENBQTZCLGtCQUE3QixFQUFpRGkwQixnQkFBakQ7eUJBQ1NqMEIsbUJBQVQsQ0FBNkIscUJBQTdCLEVBQW9EaTBCLGdCQUFwRDs7d0JBRVFQLGtCQUFSOzthQVBKOztxQkFXUzN6QixnQkFBVCxDQUEwQixrQkFBMUIsRUFBOENrMEIsZ0JBQTlDLEVBQWdFLEtBQWhFO3FCQUNTbDBCLGdCQUFULENBQTBCLHFCQUExQixFQUFpRGswQixnQkFBakQsRUFBbUUsS0FBbkU7O29CQUVRSixpQkFBUjtXQWZGLE1BZ0JPYixRQUFRVSxrQkFBUjtTQTFCVDtPQTdCRixNQXlET2x6QixRQUFRZ3pCLElBQVIsQ0FBYSwrQ0FBYjs7ZUFFQzNJLEdBQVIsQ0FBWSxPQUFaLEVBQXFCbm1CLEdBQXJCLENBQXlCLEtBQUtxdUIsUUFBTCxDQUFjYixTQUFkLEVBQXpCOzs7OzhCQUdRL3NCLE1BQU07VUFDUmt2QixrQkFBa0IsU0FBbEJBLGVBQWtCLElBQUs7YUFDdEJ0QixRQUFMLENBQWN6bEIsTUFBZCxDQUFxQmtmLEVBQUUxZSxRQUFGLEVBQXJCO09BREY7O1dBSUt3bUIsVUFBTCxHQUFrQixJQUFJMW1CLElBQUosQ0FBU3ltQixlQUFULEVBQTBCdG1CLEtBQTFCLENBQWdDLElBQWhDLENBQWxCOzs7O2NBckZLckksV0FBVztTQUNULElBRFM7U0FFVCxDQUZTO1FBR1Y7Ozs7OyJ9
