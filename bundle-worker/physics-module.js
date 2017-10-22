/* Physics module AmmoNext v0.1.2 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('whs')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three', 'whs'], factory) :
	(factory((global.PHYSICS = {}),global.THREE,global.WHS));
}(this, (function (exports,three,whs) { 'use strict';

var MESSAGE_TYPES = {
  WORLDREPORT: 0,
  COLLISIONREPORT: 1,
  VEHICLEREPORT: 2,
  CONSTRAINTREPORT: 3,
  SOFTREPORT: 4
};

var REPORT_ITEMSIZE = 14;
var COLLISIONREPORT_ITEMSIZE = 5;
var VEHICLEREPORT_ITEMSIZE = 9;
var CONSTRAINTREPORT_ITEMSIZE = 6;

var temp1Vector3 = new three.Vector3();
var temp2Vector3 = new three.Vector3();
var temp1Matrix4 = new three.Matrix4();
var temp1Quat = new three.Quaternion();

var getEulerXYZFromQuaternion = function getEulerXYZFromQuaternion(x, y, z, w) {
  return new three.Vector3(Math.atan2(2 * (x * w - y * z), w * w - x * x - y * y + z * z), Math.asin(2 * (x * z + y * w)), Math.atan2(2 * (z * w - x * y), w * w + x * x - y * y - z * z));
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

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





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
      if (target instanceof THREE.Vector3) target = new THREE.Quaternion().setFromEuler(new THREE.Euler(target.x, target.y, target.z));else if (target instanceof THREE.Euler) target = new THREE.Quaternion().setFromEuler(target);else if (target instanceof THREE.Matrix4) target = new THREE.Quaternion().setFromRotationMatrix(target);

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
      var wheel = new three.Mesh(wheel_geometry, wheel_material);

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

var _class;
var _temp2;

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


    console.log(options);
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
            var component2 = _object2.component;
            var data2 = component2.use('physics').data;

            if (_object2) {
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
            marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'hinge':
            marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'slider':
            marker = new three.Mesh(new three.BoxGeometry(10, 1, 1), new three.MeshNormalMaterial());

            marker.position.copy(constraint.positiona);

            // This rotation isn't right if all three axis are non-0 values
            // TODO: change marker's rotation order to ZYX
            marker.rotation.set(constraint.axis.y, // yes, y and
            constraint.axis.x, // x axis are swapped
            constraint.axis.z);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'conetwist':
            marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'dof':
            marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

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
        self.simulateLoop = new whs.Loop(function (clock) {
          _this4.simulate(clock.getDelta(), 1); // delta, 1
        });

        self.simulateLoop.start(_this4);

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
  gravity: new three.Vector3(0, -100, 0)
}, _temp2);

var TARGET = typeof Symbol === 'undefined' ? '__target' : Symbol();
var SCRIPT_TYPE = 'application/javascript';
var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
var URL = window.URL || window.webkitURL;
var Worker = window.Worker;

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
    self.emit('message', [data]);
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
      last_simulation_duration = 0,
      _num_objects = 0,
      _num_rigidbody_objects = 0,
      _num_softbody_objects = 0,
      _num_wheels = 0,
      _num_constraints = 0,
      _softbody_report_size = 0,


  // world variables
  fixedTimeStep = void 0,
      // used when calling stepSimulation
  last_simulation_time = void 0,
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
      // console.log(params);
      window.Ammo = params.ammo;
      return;
    }

    if (params.wasmBuffer) {
      importScripts(params.ammo);

      self.Ammo = loadAmmoFromBinary(params.wasmBuffer);
      send({ cmd: 'ammoLoaded' });
      public_functions.makeWorld(params);
    } else {
      importScripts(params.ammo);
      send({ cmd: 'ammoLoaded' });
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
    console.log(_objects[description.obj]);
    _objects[description.obj].appendAnchor(description.node, _objects[description.obj2], description.collisionBetweenLinkedBodies, description.influence);
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

      Ammo.castObject(body, Ammo.btCollisionObject).getCollisionShape().setMargin(description.margin ? description.margin : 0.1);

      // Ammo.castObject(body, Ammo.btCollisionObject).getCollisionShape().setLocalScaling(_vec3_1);
      body.setActivationState(description.state || 4);
      body.type = 0; // SoftBody.
      if (description.type === 'softRopeMesh') body.rope = true;
      if (description.type === 'softClothMesh') body.cloth = true;

      _transform.setIdentity();

      _vec3_1.setX(description.position.x);
      _vec3_1.setY(description.position.y);
      _vec3_1.setZ(description.position.z);
      _transform.setOrigin(_vec3_1);

      _quat.setX(description.rotation.x);
      _quat.setY(description.rotation.y);
      _quat.setZ(description.rotation.z);
      _quat.setW(description.rotation.w);
      _transform.setRotation(_quat);

      body.transform(_transform);

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
      shape.setMargin(description.margin ? description.margin : 0);

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
    if (constraint !== undefind) constraint.setBreakingImpulseThreshold(details.threshold);
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

              softreport[_off + 3] = normal.x();
              softreport[_off + 4] = normal.y();
              softreport[_off + 5] = normal.z();
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

var _class$1;
var _temp;

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

      this.quaternion.copy(new three.Quaternion().setFromEuler(euler));

      rot.onChange(function () {
        if (_this2.__c_rot) {
          _this2.quaternion.copy(new three.Quaternion().setFromEuler(rot));
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
    linearVelocity: new three.Vector3(),
    angularVelocity: new three.Vector3(),
    mass: 10,
    scale: new three.Vector3(1, 1, 1),
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
    scale: new three.Vector3(1, 1, 1),
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
    scale: new three.Vector3(1, 1, 1),
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
    scale: new three.Vector3(1, 1, 1),
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

      data.width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = geometry.boundingBox.max.z - geometry.boundingBox.min.z;
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

      data.width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = geometry.boundingBox.max.z - geometry.boundingBox.min.z;
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

      data.radius = (geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
      data.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
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
      if (!geometry.isBufferGeometry) geometry._bufferGeometry = new three.BufferGeometry().fromGeometry(geometry);

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

      data.width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = geometry.boundingBox.max.z - geometry.boundingBox.min.z;
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
      size: new three.Vector2(1, 1),
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

      data.scale.multiply(new three.Vector3(xsize / (xpts - 1), 1, ysize / (ypts - 1)));

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

      data.width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.normal = geometry.faces[0].normal.clone();
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
      data.radius = geometry.boundingSphere.radius;
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

        var bufferGeometry = new three.BufferGeometry();

        bufferGeometry.addAttribute('position', new three.BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

        bufferGeometry.setIndex(new three.BufferAttribute(new (geometry.faces.length * 3 > 65535 ? Uint32Array : Uint16Array)(geometry.faces.length * 3), 1).copyIndicesArray(geometry.faces));

        return bufferGeometry;
      }();

      data.aVertices = idxGeometry.attributes.position.array;
      data.aIndices = idxGeometry.index.array;

      return new three.BufferGeometry().fromGeometry(geometry);
    });
    return _this;
  }

  createClass(SoftbodyModule, [{
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
  return SoftbodyModule;
}(_default);

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

        var bufferGeometry = new three.BufferGeometry();

        bufferGeometry.addAttribute('position', new three.BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

        var faces = geometry.faces,
            facesLength = faces.length;
        var normalsArray = new Float32Array(facesLength * 3);

        for (var i = 0; i < facesLength; i++) {
          var i3 = i * 3;
          var normal = faces[i].normal || new Vector3();

          normalsArray[i3] = normal.x;
          normalsArray[i3 + 1] = normal.y;
          normalsArray[i3 + 2] = normal.z;
        }

        bufferGeometry.addAttribute('normal', new three.BufferAttribute(normalsArray, 3));

        bufferGeometry.setIndex(new three.BufferAttribute(new (facesLength * 3 > 65535 ? Uint32Array : Uint16Array)(facesLength * 3), 1).copyIndicesArray(faces));

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
          var buff = new three.BufferGeometry();

          buff.addAttribute('position', new three.BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

          return buff;
        }();
      }

      var length = geometry.attributes.position.array.length / 3;
      var vert = function vert(n) {
        return new three.Vector3().fromArray(geometry.attributes.position.array, n * 3);
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

var _class$2;
var _temp$1;

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
      pitchObject = new three.Object3D();

  pitchObject.add(camera.native);

  var yawObject = new three.Object3D();

  yawObject.position.y = params.ypos; // eyes are 2 meters above the ground
  yawObject.add(pitchObject);

  var quat = new three.Quaternion();

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
  var inputVelocity = new three.Vector3(),
      euler = new three.Euler();

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

      self.updateLoop = new whs.Loop(updateProcessor).start(this);
    }
  }]);
  return FirstPersonModule;
}(), _class$2.defaults = {
  block: null,
  speed: 1,
  ypos: 1
}, _temp$1);

exports.getEulerXYZFromQuaternion = getEulerXYZFromQuaternion;
exports.getQuatertionFromEuler = getQuatertionFromEuler;
exports.convertWorldPositionToObject = convertWorldPositionToObject;
exports.addObjectChildren = addObjectChildren;
exports.MESSAGE_TYPES = MESSAGE_TYPES;
exports.REPORT_ITEMSIZE = REPORT_ITEMSIZE;
exports.COLLISIONREPORT_ITEMSIZE = COLLISIONREPORT_ITEMSIZE;
exports.VEHICLEREPORT_ITEMSIZE = VEHICLEREPORT_ITEMSIZE;
exports.CONSTRAINTREPORT_ITEMSIZE = CONSTRAINTREPORT_ITEMSIZE;
exports.temp1Vector3 = temp1Vector3;
exports.temp2Vector3 = temp2Vector3;
exports.temp1Matrix4 = temp1Matrix4;
exports.temp1Quat = temp1Quat;
exports.Eventable = Eventable;
exports.ConeTwistConstraint = ConeTwistConstraint;
exports.HingeConstraint = HingeConstraint;
exports.PointConstraint = PointConstraint;
exports.SliderConstraint = SliderConstraint;
exports.DOFConstraint = DOFConstraint;
exports.WorldModule = WorldModule;
exports.BoxModule = BoxModule;
exports.CompoundModule = CompoundModule;
exports.CapsuleModule = CapsuleModule;
exports.ConcaveModule = ConcaveModule;
exports.ConeModule = ConeModule;
exports.ConvexModule = ConvexModule;
exports.CylinderModule = CylinderModule;
exports.HeightfieldModule = HeightfieldModule;
exports.PlaneModule = PlaneModule;
exports.SphereModule = SphereModule;
exports.SoftbodyModule = SoftbodyModule;
exports.ClothModule = ClothModule;
exports.RopeModule = RopeModule;
exports.FirstPersonModule = FirstPersonModule;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkuanMiLCIuLi9zcmMvZXZlbnRhYmxlLmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0NvbmVUd2lzdENvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvSGluZ2VDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL1BvaW50Q29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9TbGlkZXJDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0RPRkNvbnN0cmFpbnQuanMiLCIuLi9zcmMvdmVoaWNsZS92ZWhpY2xlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29yZS9Xb3JsZE1vZHVsZUJhc2UuanMiLCIuLi9idW5kbGUtd29ya2VyL3dvcmtlcmhlbHBlci5qcyIsIi4uL3NyYy93b3JrZXIuanMiLCIuLi9zcmMvbW9kdWxlcy9Xb3JsZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL2NvcmUvUGh5c2ljc01vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0JveE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbXBvdW5kTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ2Fwc3VsZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbmNhdmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db25lTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29udmV4TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ3lsaW5kZXJNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9IZWlnaHRmaWVsZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1BsYW5lTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvU3BoZXJlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvU29mdGJvZHlNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DbG90aE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1JvcGVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb250cm9scy9GaXJzdFBlcnNvbk1vZHVsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBWZWN0b3IzLFxuICBNYXRyaXg0LFxuICBRdWF0ZXJuaW9uXG59IGZyb20gJ3RocmVlJztcblxuY29uc3QgTUVTU0FHRV9UWVBFUyA9IHtcbiAgV09STERSRVBPUlQ6IDAsXG4gIENPTExJU0lPTlJFUE9SVDogMSxcbiAgVkVISUNMRVJFUE9SVDogMixcbiAgQ09OU1RSQUlOVFJFUE9SVDogMyxcbiAgU09GVFJFUE9SVDogNFxufTtcblxuY29uc3QgUkVQT1JUX0lURU1TSVpFID0gMTQsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSA9IDUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgPSA5LFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFID0gNjtcblxuY29uc3QgdGVtcDFWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDJWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDFNYXRyaXg0ID0gbmV3IE1hdHJpeDQoKSxcbiAgdGVtcDFRdWF0ID0gbmV3IFF1YXRlcm5pb24oKTtcblxuY29uc3QgZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiA9ICh4LCB5LCB6LCB3KSA9PiB7XG4gIHJldHVybiBuZXcgVmVjdG9yMyhcbiAgICBNYXRoLmF0YW4yKDIgKiAoeCAqIHcgLSB5ICogeiksICh3ICogdyAtIHggKiB4IC0geSAqIHkgKyB6ICogeikpLFxuICAgIE1hdGguYXNpbigyICogKHggKiB6ICsgeSAqIHcpKSxcbiAgICBNYXRoLmF0YW4yKDIgKiAoeiAqIHcgLSB4ICogeSksICh3ICogdyArIHggKiB4IC0geSAqIHkgLSB6ICogeikpXG4gICk7XG59O1xuXG5jb25zdCBnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyID0gKHgsIHksIHopID0+IHtcbiAgY29uc3QgYzEgPSBNYXRoLmNvcyh5KTtcbiAgY29uc3QgczEgPSBNYXRoLnNpbih5KTtcbiAgY29uc3QgYzIgPSBNYXRoLmNvcygteik7XG4gIGNvbnN0IHMyID0gTWF0aC5zaW4oLXopO1xuICBjb25zdCBjMyA9IE1hdGguY29zKHgpO1xuICBjb25zdCBzMyA9IE1hdGguc2luKHgpO1xuICBjb25zdCBjMWMyID0gYzEgKiBjMjtcbiAgY29uc3QgczFzMiA9IHMxICogczI7XG5cbiAgcmV0dXJuIHtcbiAgICB3OiBjMWMyICogYzMgLSBzMXMyICogczMsXG4gICAgeDogYzFjMiAqIHMzICsgczFzMiAqIGMzLFxuICAgIHk6IHMxICogYzIgKiBjMyArIGMxICogczIgKiBzMyxcbiAgICB6OiBjMSAqIHMyICogYzMgLSBzMSAqIGMyICogczNcbiAgfTtcbn07XG5cbmNvbnN0IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QgPSAocG9zaXRpb24sIG9iamVjdCkgPT4ge1xuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKTsgLy8gcmVzZXQgdGVtcCBtYXRyaXhcblxuICAvLyBTZXQgdGhlIHRlbXAgbWF0cml4J3Mgcm90YXRpb24gdG8gdGhlIG9iamVjdCdzIHJvdGF0aW9uXG4gIHRlbXAxTWF0cml4NC5pZGVudGl0eSgpLm1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKG9iamVjdC5xdWF0ZXJuaW9uKTtcblxuICAvLyBJbnZlcnQgcm90YXRpb24gbWF0cml4IGluIG9yZGVyIHRvIFwidW5yb3RhdGVcIiBhIHBvaW50IGJhY2sgdG8gb2JqZWN0IHNwYWNlXG4gIHRlbXAxTWF0cml4NC5nZXRJbnZlcnNlKHRlbXAxTWF0cml4NCk7XG5cbiAgLy8gWWF5ISBUZW1wIHZhcnMhXG4gIHRlbXAxVmVjdG9yMy5jb3B5KHBvc2l0aW9uKTtcbiAgdGVtcDJWZWN0b3IzLmNvcHkob2JqZWN0LnBvc2l0aW9uKTtcblxuICAvLyBBcHBseSB0aGUgcm90YXRpb25cbiAgcmV0dXJuIHRlbXAxVmVjdG9yMy5zdWIodGVtcDJWZWN0b3IzKS5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcbn07XG5cbmNvbnN0IGFkZE9iamVjdENoaWxkcmVuID0gZnVuY3Rpb24gKHBhcmVudCwgb2JqZWN0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGQgPSBvYmplY3QuY2hpbGRyZW5baV07XG4gICAgY29uc3QgcGh5c2ljcyA9IGNoaWxkLmNvbXBvbmVudCA/IGNoaWxkLmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSA6IGZhbHNlO1xuXG4gICAgaWYgKHBoeXNpY3MpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBwaHlzaWNzLmRhdGE7XG5cbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgY2hpbGQudXBkYXRlTWF0cml4V29ybGQoKTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldEZyb21NYXRyaXhQb3NpdGlvbihjaGlsZC5tYXRyaXhXb3JsZCk7XG4gICAgICB0ZW1wMVF1YXQuc2V0RnJvbVJvdGF0aW9uTWF0cml4KGNoaWxkLm1hdHJpeFdvcmxkKTtcblxuICAgICAgZGF0YS5wb3NpdGlvbl9vZmZzZXQgPSB7XG4gICAgICAgIHg6IHRlbXAxVmVjdG9yMy54LFxuICAgICAgICB5OiB0ZW1wMVZlY3RvcjMueSxcbiAgICAgICAgejogdGVtcDFWZWN0b3IzLnpcbiAgICAgIH07XG5cbiAgICAgIGRhdGEucm90YXRpb24gPSB7XG4gICAgICAgIHg6IHRlbXAxUXVhdC54LFxuICAgICAgICB5OiB0ZW1wMVF1YXQueSxcbiAgICAgICAgejogdGVtcDFRdWF0LnosXG4gICAgICAgIHc6IHRlbXAxUXVhdC53XG4gICAgICB9O1xuXG4gICAgICBwYXJlbnQuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGEuY2hpbGRyZW4ucHVzaChkYXRhKTtcbiAgICB9XG5cbiAgICBhZGRPYmplY3RDaGlsZHJlbihwYXJlbnQsIGNoaWxkKTtcbiAgfVxufTtcblxuZXhwb3J0IHtcbiAgZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbixcbiAgZ2V0UXVhdGVydGlvbkZyb21FdWxlcixcbiAgY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCxcbiAgYWRkT2JqZWN0Q2hpbGRyZW4sXG5cbiAgTUVTU0FHRV9UWVBFUyxcbiAgUkVQT1JUX0lURU1TSVpFLFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUsXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUsXG5cbiAgdGVtcDFWZWN0b3IzLFxuICB0ZW1wMlZlY3RvcjMsXG4gIHRlbXAxTWF0cml4NCxcbiAgdGVtcDFRdWF0XG59O1xuIiwiZXhwb3J0IGNsYXNzIEV2ZW50YWJsZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzID0ge307XG4gIH1cblxuICBhZGRFdmVudExpc3RlbmVyKGV2ZW50X25hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSlcbiAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdID0gW107XG5cbiAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSwgY2FsbGJhY2spIHtcbiAgICBsZXQgaW5kZXg7XG5cbiAgICBpZiAoIXRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAoKGluZGV4ID0gdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0uaW5kZXhPZihjYWxsYmFjaykpID49IDApIHtcbiAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBkaXNwYXRjaEV2ZW50KGV2ZW50X25hbWUpIHtcbiAgICBsZXQgaTtcbiAgICBjb25zdCBwYXJhbWV0ZXJzID0gQXJyYXkucHJvdG90eXBlLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICBpZiAodGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV1baV0uYXBwbHkodGhpcywgcGFyYW1ldGVycyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG1ha2Uob2JqKSB7XG4gICAgb2JqLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gRXZlbnRhYmxlLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuICAgIG9iai5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IEV2ZW50YWJsZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcbiAgICBvYmoucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBFdmVudGFibGUucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQ7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIENvbmVUd2lzdENvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGNvbnN0IG9iamVjdGIgPSBvYmphO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIGNvbnNvbGUuZXJyb3IoJ0JvdGggb2JqZWN0cyBtdXN0IGJlIGRlZmluZWQgaW4gYSBDb25lVHdpc3RDb25zdHJhaW50LicpO1xuXG4gICAgdGhpcy50eXBlID0gJ2NvbmV0d2lzdCc7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpc2EgPSB7eDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24uen07XG4gICAgdGhpcy5heGlzYiA9IHt4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56fTtcbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0KHgsIHksIHopIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRMaW1pdCcsIHtjb25zdHJhaW50OiB0aGlzLmlkLCB4LCB5LCB6fSk7XG4gIH1cblxuICBlbmFibGVNb3RvcigpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9lbmFibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBzZXRNYXhNb3RvckltcHVsc2UobWF4X2ltcHVsc2UpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UnLCB7Y29uc3RyYWludDogdGhpcy5pZCwgbWF4X2ltcHVsc2V9KTtcbiAgfVxuXG4gIHNldE1vdG9yVGFyZ2V0KHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBUSFJFRS5WZWN0b3IzKVxuICAgICAgdGFyZ2V0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIobmV3IFRIUkVFLkV1bGVyKHRhcmdldC54LCB0YXJnZXQueSwgdGFyZ2V0LnopKTtcbiAgICBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBUSFJFRS5FdWxlcilcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHRhcmdldCk7XG4gICAgZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuTWF0cml4NClcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbVJvdGF0aW9uTWF0cml4KHRhcmdldCk7XG5cbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNb3RvclRhcmdldCcsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB4OiB0YXJnZXQueCxcbiAgICAgIHk6IHRhcmdldC55LFxuICAgICAgejogdGFyZ2V0LnosXG4gICAgICB3OiB0YXJnZXQud1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBIaW5nZUNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbiwgYXhpcykge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChheGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF4aXMgPSBwb3NpdGlvbjtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2hpbmdlJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbi5jbG9uZSgpO1xuICAgIHRoaXMuYXhpcyA9IGF4aXM7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxvdywgaGlnaCwgYmlhc19mYWN0b3IsIHJlbGF4YXRpb25fZmFjdG9yKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2Vfc2V0TGltaXRzJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIGxvdyxcbiAgICAgIGhpZ2gsXG4gICAgICBiaWFzX2ZhY3RvcixcbiAgICAgIHJlbGF4YXRpb25fZmFjdG9yXG4gICAgfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZU1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2Rpc2FibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIFBvaW50Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ3BvaW50JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iXG4gICAgfTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgU2xpZGVyQ29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uLCBheGlzKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKGF4aXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXhpcyA9IHBvc2l0aW9uO1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnc2xpZGVyJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpcyA9IGF4aXM7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxpbl9sb3dlciwgbGluX3VwcGVyLCBhbmdfbG93ZXIsIGFuZ191cHBlcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbGluX2xvd2VyLFxuICAgICAgbGluX3VwcGVyLFxuICAgICAgYW5nX2xvd2VyLFxuICAgICAgYW5nX3VwcGVyXG4gICAgfSk7XG4gIH1cblxuICBzZXRSZXN0aXR1dGlvbihsaW5lYXIsIGFuZ3VsYXIpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKFxuICAgICAgJ3NsaWRlcl9zZXRSZXN0aXR1dGlvbicsXG4gICAgICB7XG4gICAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICAgIGxpbmVhcixcbiAgICAgICAgYW5ndWxhclxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBlbmFibGVMaW5lYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTGluZWFyTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIHRoaXMuc2NlbmUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZUFuZ3VsYXJNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIERPRkNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmICggcG9zaXRpb24gPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RvZic7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCggcG9zaXRpb24sIG9iamVjdGEgKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpc2EgPSB7IHg6IG9iamVjdGEucm90YXRpb24ueCwgeTogb2JqZWN0YS5yb3RhdGlvbi55LCB6OiBvYmplY3RhLnJvdGF0aW9uLnogfTtcblxuICAgIGlmICggb2JqZWN0YiApIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCggcG9zaXRpb24sIG9iamVjdGIgKS5jbG9uZSgpO1xuICAgICAgdGhpcy5heGlzYiA9IHsgeDogb2JqZWN0Yi5yb3RhdGlvbi54LCB5OiBvYmplY3RiLnJvdGF0aW9uLnksIHo6IG9iamVjdGIucm90YXRpb24ueiB9O1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbmVhckxvd2VyTGltaXQobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhckxvd2VyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0TGluZWFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0QW5ndWxhckxvd2VyTGltaXQgKGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3RvciAod2hpY2gpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZUFuZ3VsYXJNb3RvciAod2hpY2gsIGxvd19hbmdsZSwgaGlnaF9hbmdsZSwgdmVsb2NpdHksIG1heF9mb3JjZSApIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoLCBsb3dfYW5nbGU6IGxvd19hbmdsZSwgaGlnaF9hbmdsZTogaGlnaF9hbmdsZSwgdmVsb2NpdHk6IHZlbG9jaXR5LCBtYXhfZm9yY2U6IG1heF9mb3JjZSB9ICk7XG4gIH1cblxuICBkaXNhYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtNZXNofSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge1ZlaGljbGVUdW5uaW5nfSBmcm9tICcuL3R1bm5pbmcnO1xuXG5leHBvcnQgY2xhc3MgVmVoaWNsZSB7XG4gIGNvbnN0cnVjdG9yKG1lc2gsIHR1bmluZyA9IG5ldyBWZWhpY2xlVHVuaW5nKCkpIHtcbiAgICB0aGlzLm1lc2ggPSBtZXNoO1xuICAgIHRoaXMud2hlZWxzID0gW107XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgaWQ6IGdldE9iamVjdElkKCksXG4gICAgICByaWdpZEJvZHk6IG1lc2guX3BoeXNpanMuaWQsXG4gICAgICBzdXNwZW5zaW9uX3N0aWZmbmVzczogdHVuaW5nLnN1c3BlbnNpb25fc3RpZmZuZXNzLFxuICAgICAgc3VzcGVuc2lvbl9jb21wcmVzc2lvbjogdHVuaW5nLnN1c3BlbnNpb25fY29tcHJlc3Npb24sXG4gICAgICBzdXNwZW5zaW9uX2RhbXBpbmc6IHR1bmluZy5zdXNwZW5zaW9uX2RhbXBpbmcsXG4gICAgICBtYXhfc3VzcGVuc2lvbl90cmF2ZWw6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl90cmF2ZWwsXG4gICAgICBmcmljdGlvbl9zbGlwOiB0dW5pbmcuZnJpY3Rpb25fc2xpcCxcbiAgICAgIG1heF9zdXNwZW5zaW9uX2ZvcmNlOiB0dW5pbmcubWF4X3N1c3BlbnNpb25fZm9yY2VcbiAgICB9O1xuICB9XG5cbiAgYWRkV2hlZWwod2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsLCBjb25uZWN0aW9uX3BvaW50LCB3aGVlbF9kaXJlY3Rpb24sIHdoZWVsX2F4bGUsIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsIHdoZWVsX3JhZGl1cywgaXNfZnJvbnRfd2hlZWwsIHR1bmluZykge1xuICAgIGNvbnN0IHdoZWVsID0gbmV3IE1lc2god2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsKTtcblxuICAgIHdoZWVsLmNhc3RTaGFkb3cgPSB3aGVlbC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICB3aGVlbC5wb3NpdGlvbi5jb3B5KHdoZWVsX2RpcmVjdGlvbikubXVsdGlwbHlTY2FsYXIoc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCAvIDEwMCkuYWRkKGNvbm5lY3Rpb25fcG9pbnQpO1xuXG4gICAgdGhpcy53b3JsZC5hZGQod2hlZWwpO1xuICAgIHRoaXMud2hlZWxzLnB1c2god2hlZWwpO1xuXG4gICAgdGhpcy53b3JsZC5leGVjdXRlKCdhZGRXaGVlbCcsIHtcbiAgICAgIGlkOiB0aGlzLl9waHlzaWpzLmlkLFxuICAgICAgY29ubmVjdGlvbl9wb2ludDoge3g6IGNvbm5lY3Rpb25fcG9pbnQueCwgeTogY29ubmVjdGlvbl9wb2ludC55LCB6OiBjb25uZWN0aW9uX3BvaW50Lnp9LFxuICAgICAgd2hlZWxfZGlyZWN0aW9uOiB7eDogd2hlZWxfZGlyZWN0aW9uLngsIHk6IHdoZWVsX2RpcmVjdGlvbi55LCB6OiB3aGVlbF9kaXJlY3Rpb24uen0sXG4gICAgICB3aGVlbF9heGxlOiB7eDogd2hlZWxfYXhsZS54LCB5OiB3aGVlbF9heGxlLnksIHo6IHdoZWVsX2F4bGUuen0sXG4gICAgICBzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLFxuICAgICAgd2hlZWxfcmFkaXVzLFxuICAgICAgaXNfZnJvbnRfd2hlZWwsXG4gICAgICB0dW5pbmdcbiAgICB9KTtcbiAgfVxuXG4gIHNldFN0ZWVyaW5nKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0U3RlZXJpbmcnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBzdGVlcmluZzogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBzZXRCcmFrZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldEJyYWtlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbCwgYnJha2U6IGFtb3VudH0pO1xuICAgIGVsc2UgaWYgKHRoaXMud2hlZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aGVlbHMubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBicmFrZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG5cbiAgYXBwbHlFbmdpbmVGb3JjZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBmb3JjZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdhcHBseUVuZ2luZUZvcmNlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgZm9yY2U6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHtcbiAgU2NlbmUgYXMgU2NlbmVOYXRpdmUsXG4gIE1lc2gsXG4gIFNwaGVyZUdlb21ldHJ5LFxuICBNZXNoTm9ybWFsTWF0ZXJpYWwsXG4gIEJveEdlb21ldHJ5LFxuICBWZWN0b3IzXG59IGZyb20gJ3RocmVlJztcblxuaW1wb3J0IHtMb29wfSBmcm9tICd3aHMnO1xuXG5pbXBvcnQge1ZlaGljbGV9IGZyb20gJy4uLy4uL3ZlaGljbGUvdmVoaWNsZSc7XG5pbXBvcnQge0V2ZW50YWJsZX0gZnJvbSAnLi4vLi4vZXZlbnRhYmxlJztcblxuaW1wb3J0IHtcbiAgYWRkT2JqZWN0Q2hpbGRyZW4sXG4gIE1FU1NBR0VfVFlQRVMsXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRVxufSBmcm9tICcuLi8uLi9hcGknO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXb3JsZE1vZHVsZUJhc2UgZXh0ZW5kcyBFdmVudGFibGUge1xuICBzdGF0aWMgZGVmYXVsdHMgPSB7XG4gICAgZml4ZWRUaW1lU3RlcDogMS82MCxcbiAgICByYXRlTGltaXQ6IHRydWUsXG4gICAgYW1tbzogXCJcIixcbiAgICBzb2Z0Ym9keTogZmFsc2UsXG4gICAgZ3Jhdml0eTogbmV3IFZlY3RvcjMoMCwgLTEwMCwgMClcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIGNvbnNvbGUubG9nKG9wdGlvbnMpO1xuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oV29ybGRNb2R1bGVCYXNlLmRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgIHRoaXMub2JqZWN0cyA9IHt9O1xuICAgIHRoaXMudmVoaWNsZXMgPSB7fTtcbiAgICB0aGlzLmNvbnN0cmFpbnRzID0ge307XG4gICAgdGhpcy5pc1NpbXVsYXRpbmcgPSBmYWxzZTtcblxuICAgIHRoaXMuZ2V0T2JqZWN0SWQgPSAoKCkgPT4ge1xuICAgICAgbGV0IGlkID0gMTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBpZCsrO1xuICAgICAgfTtcbiAgICB9KSgpO1xuICB9XG5cbiAgc2V0dXAoKSB7XG4gICAgdGhpcy5yZWNlaXZlKGV2ZW50ID0+IHtcbiAgICAgIGxldCBfdGVtcCxcbiAgICAgICAgZGF0YSA9IGV2ZW50LmRhdGE7XG5cbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgJiYgZGF0YS5ieXRlTGVuZ3RoICE9PSAxKS8vIGJ5dGVMZW5ndGggPT09IDEgaXMgdGhlIHdvcmtlciBtYWtpbmcgYSBTVVBQT1JUX1RSQU5TRkVSQUJMRSB0ZXN0XG4gICAgICAgIGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICAvLyB0cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgICAgIHN3aXRjaCAoZGF0YVswXSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2NlbmUoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTb2Z0Ym9kaWVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5jbWQpIHtcbiAgICAgICAgLy8gbm9uLXRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICAgICAgc3dpdGNoIChkYXRhLmNtZCkge1xuICAgICAgICAgIGNhc2UgJ29iamVjdFJlYWR5JzpcbiAgICAgICAgICAgIF90ZW1wID0gZGF0YS5wYXJhbXM7XG4gICAgICAgICAgICBpZiAodGhpcy5vYmplY3RzW190ZW1wXSkgdGhpcy5vYmplY3RzW190ZW1wXS5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd3b3JsZFJlYWR5JzpcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgncmVhZHknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAnYW1tb0xvYWRlZCc6XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2xvYWRlZCcpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJQaHlzaWNzIGxvYWRpbmcgdGltZTogXCIgKyAocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgKyBcIm1zXCIpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd2ZWhpY2xlJzpcbiAgICAgICAgICAgIHdpbmRvdy50ZXN0ID0gZGF0YTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIERvIG5vdGhpbmcsIGp1c3Qgc2hvdyB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgUmVjZWl2ZWQ6ICR7ZGF0YS5jbWR9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmRpcihkYXRhLnBhcmFtcyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoIChkYXRhWzBdKSB7XG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTY2VuZShkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sbGlzaW9ucyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZlaGljbGVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29uc3RyYWludHMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVTY2VuZShpbmZvKSB7XG4gICAgbGV0IGluZGV4ID0gaW5mb1sxXTtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgaW5kZXggKiBSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLm9iamVjdHNbaW5mb1tvZmZzZXRdXTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldChcbiAgICAgICAgICBpbmZvW29mZnNldCArIDFdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgMl0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAzXVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPT09IGZhbHNlKSB7XG4gICAgICAgIG9iamVjdC5xdWF0ZXJuaW9uLnNldChcbiAgICAgICAgICBpbmZvW29mZnNldCArIDRdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNV0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA2XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDddXG4gICAgICAgICk7XG5cbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBkYXRhLmxpbmVhclZlbG9jaXR5LnNldChcbiAgICAgICAgaW5mb1tvZmZzZXQgKyA4XSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyA5XSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMF1cbiAgICAgICk7XG5cbiAgICAgIGRhdGEuYW5ndWxhclZlbG9jaXR5LnNldChcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMV0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTJdLFxuICAgICAgICBpbmZvW29mZnNldCArIDEzXVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChpbmZvLmJ1ZmZlciwgW2luZm8uYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuXG4gICAgdGhpcy5pc1NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3VwZGF0ZScpO1xuICB9XG5cbiAgdXBkYXRlU29mdGJvZGllcyhpbmZvKSB7XG4gICAgbGV0IGluZGV4ID0gaW5mb1sxXSxcbiAgICAgIG9mZnNldCA9IDI7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgc2l6ZSA9IGluZm9bb2Zmc2V0ICsgMV07XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLm9iamVjdHNbaW5mb1tvZmZzZXRdXTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBvYmplY3QuZ2VvbWV0cnkuYXR0cmlidXRlcztcbiAgICAgIGNvbnN0IHZvbHVtZVBvc2l0aW9ucyA9IGF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIGNvbnN0IG9mZnNldFZlcnQgPSBvZmZzZXQgKyAyO1xuXG4gICAgICAvLyBjb25zb2xlLmxvZyhkYXRhLmlkKTtcbiAgICAgIGlmICghZGF0YS5pc1NvZnRCb2R5UmVzZXQpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KDAsIDAsIDAsIDApO1xuXG4gICAgICAgIGRhdGEuaXNTb2Z0Qm9keVJlc2V0ID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudHlwZSA9PT0gXCJzb2Z0VHJpbWVzaFwiKSB7XG4gICAgICAgIGNvbnN0IHZvbHVtZU5vcm1hbHMgPSBhdHRyaWJ1dGVzLm5vcm1hbC5hcnJheTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDE4O1xuXG4gICAgICAgICAgY29uc3QgeDEgPSBpbmZvW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkxID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgejEgPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54MSA9IGluZm9bb2ZmcyArIDNdO1xuICAgICAgICAgIGNvbnN0IG55MSA9IGluZm9bb2ZmcyArIDRdO1xuICAgICAgICAgIGNvbnN0IG56MSA9IGluZm9bb2ZmcyArIDVdO1xuXG4gICAgICAgICAgY29uc3QgeDIgPSBpbmZvW29mZnMgKyA2XTtcbiAgICAgICAgICBjb25zdCB5MiA9IGluZm9bb2ZmcyArIDddO1xuICAgICAgICAgIGNvbnN0IHoyID0gaW5mb1tvZmZzICsgOF07XG5cbiAgICAgICAgICBjb25zdCBueDIgPSBpbmZvW29mZnMgKyA5XTtcbiAgICAgICAgICBjb25zdCBueTIgPSBpbmZvW29mZnMgKyAxMF07XG4gICAgICAgICAgY29uc3QgbnoyID0gaW5mb1tvZmZzICsgMTFdO1xuXG4gICAgICAgICAgY29uc3QgeDMgPSBpbmZvW29mZnMgKyAxMl07XG4gICAgICAgICAgY29uc3QgeTMgPSBpbmZvW29mZnMgKyAxM107XG4gICAgICAgICAgY29uc3QgejMgPSBpbmZvW29mZnMgKyAxNF07XG5cbiAgICAgICAgICBjb25zdCBueDMgPSBpbmZvW29mZnMgKyAxNV07XG4gICAgICAgICAgY29uc3QgbnkzID0gaW5mb1tvZmZzICsgMTZdO1xuICAgICAgICAgIGNvbnN0IG56MyA9IGluZm9bb2ZmcyArIDE3XTtcblxuICAgICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTldID0geDE7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgMV0gPSB5MTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAyXSA9IHoxO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgM10gPSB4MjtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA0XSA9IHkyO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDVdID0gejI7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA2XSA9IHgzO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDddID0geTM7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgOF0gPSB6MztcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTldID0gbngxO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAxXSA9IG55MTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgMl0gPSBuejE7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgM10gPSBueDI7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDRdID0gbnkyO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA1XSA9IG56MjtcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA2XSA9IG54MztcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgN10gPSBueTM7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDhdID0gbnozO1xuICAgICAgICB9XG5cbiAgICAgICAgYXR0cmlidXRlcy5ub3JtYWwubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiAxODtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGRhdGEudHlwZSA9PT0gXCJzb2Z0Um9wZU1lc2hcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICBjb25zdCB4ID0gaW5mb1tvZmZzXTtcbiAgICAgICAgICBjb25zdCB5ID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgeiA9IGluZm9bb2ZmcyArIDJdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2b2x1bWVOb3JtYWxzID0gYXR0cmlidXRlcy5ub3JtYWwuYXJyYXk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgY29uc3QgeCA9IGluZm9bb2Zmc107XG4gICAgICAgICAgY29uc3QgeSA9IGluZm9bb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHogPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54ID0gaW5mb1tvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkgPSBpbmZvW29mZnMgKyA0XTtcbiAgICAgICAgICBjb25zdCBueiA9IGluZm9bb2ZmcyArIDVdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcblxuICAgICAgICAgIC8vIEZJWE1FOiBOb3JtYWxzIGFyZSBwb2ludGVkIHRvIGxvb2sgaW5zaWRlO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDNdID0gbng7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDFdID0gbnk7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDJdID0gbno7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDY7XG4gICAgICB9XG5cbiAgICAgIGF0dHJpYnV0ZXMucG9zaXRpb24ubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgIC8vICAgdGhpcy5zZW5kKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG5cbiAgICB0aGlzLmlzU2ltdWxhdGluZyA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVmVoaWNsZXMoZGF0YSkge1xuICAgIGxldCB2ZWhpY2xlLCB3aGVlbDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogVkVISUNMRVJFUE9SVF9JVEVNU0laRTtcbiAgICAgIHZlaGljbGUgPSB0aGlzLnZlaGljbGVzW2RhdGFbb2Zmc2V0XV07XG5cbiAgICAgIGlmICh2ZWhpY2xlID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgd2hlZWwgPSB2ZWhpY2xlLndoZWVsc1tkYXRhW29mZnNldCArIDFdXTtcblxuICAgICAgd2hlZWwucG9zaXRpb24uc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDJdLFxuICAgICAgICBkYXRhW29mZnNldCArIDNdLFxuICAgICAgICBkYXRhW29mZnNldCArIDRdXG4gICAgICApO1xuXG4gICAgICB3aGVlbC5xdWF0ZXJuaW9uLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA1XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA2XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA3XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA4XVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29uc3RyYWludHMoZGF0YSkge1xuICAgIGxldCBjb25zdHJhaW50LCBvYmplY3Q7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IChkYXRhLmxlbmd0aCAtIDEpIC8gQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAxICsgaSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdHJhaW50ID0gdGhpcy5jb25zdHJhaW50c1tkYXRhW29mZnNldF1dO1xuICAgICAgb2JqZWN0ID0gdGhpcy5vYmplY3RzW2RhdGFbb2Zmc2V0ICsgMV1dO1xuXG4gICAgICBpZiAoY29uc3RyYWludCA9PT0gdW5kZWZpbmVkIHx8IG9iamVjdCA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAzXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA0XVxuICAgICAgKTtcblxuICAgICAgdGVtcDFNYXRyaXg0LmV4dHJhY3RSb3RhdGlvbihvYmplY3QubWF0cml4KTtcbiAgICAgIHRlbXAxVmVjdG9yMy5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcblxuICAgICAgY29uc3RyYWludC5wb3NpdGlvbmEuYWRkVmVjdG9ycyhvYmplY3QucG9zaXRpb24sIHRlbXAxVmVjdG9yMyk7XG4gICAgICBjb25zdHJhaW50LmFwcGxpZWRJbXB1bHNlID0gZGF0YVtvZmZzZXQgKyA1XTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29sbGlzaW9ucyhpbmZvKSB7XG4gICAgLyoqXG4gICAgICogI1RPRE9cbiAgICAgKiBUaGlzIGlzIHByb2JhYmx5IHRoZSB3b3JzdCB3YXkgZXZlciB0byBoYW5kbGUgY29sbGlzaW9ucy4gVGhlIGluaGVyZW50IGV2aWxuZXNzIGlzIGEgcmVzaWR1YWxcbiAgICAgKiBlZmZlY3QgZnJvbSB0aGUgcHJldmlvdXMgdmVyc2lvbidzIGV2aWxuZXNzIHdoaWNoIG11dGF0ZWQgd2hlbiBzd2l0Y2hpbmcgdG8gdHJhbnNmZXJhYmxlIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgZmVlbCBpbmNsaW5lZCB0byBtYWtlIHRoaXMgYmV0dGVyLCBwbGVhc2UgZG8gc28uXG4gICAgICovXG5cbiAgICBjb25zdCBjb2xsaXNpb25zID0ge30sXG4gICAgICBub3JtYWxfb2Zmc2V0cyA9IHt9O1xuXG4gICAgLy8gQnVpbGQgY29sbGlzaW9uIG1hbmlmZXN0XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmZvWzFdOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyBpICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gaW5mb1tvZmZzZXRdO1xuICAgICAgY29uc3Qgb2JqZWN0MiA9IGluZm9bb2Zmc2V0ICsgMV07XG5cbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdH0tJHtvYmplY3QyfWBdID0gb2Zmc2V0ICsgMjtcbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdDJ9LSR7b2JqZWN0fWBdID0gLTEgKiAob2Zmc2V0ICsgMik7XG5cbiAgICAgIC8vIFJlZ2lzdGVyIGNvbGxpc2lvbnMgZm9yIGJvdGggdGhlIG9iamVjdCBjb2xsaWRpbmcgYW5kIHRoZSBvYmplY3QgYmVpbmcgY29sbGlkZWQgd2l0aFxuICAgICAgaWYgKCFjb2xsaXNpb25zW29iamVjdF0pIGNvbGxpc2lvbnNbb2JqZWN0XSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3RdLnB1c2gob2JqZWN0Mik7XG5cbiAgICAgIGlmICghY29sbGlzaW9uc1tvYmplY3QyXSkgY29sbGlzaW9uc1tvYmplY3QyXSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3QyXS5wdXNoKG9iamVjdCk7XG4gICAgfVxuXG4gICAgLy8gRGVhbCB3aXRoIGNvbGxpc2lvbnNcbiAgICBmb3IgKGNvbnN0IGlkMSBpbiB0aGlzLm9iamVjdHMpIHtcbiAgICAgIGlmICghdGhpcy5vYmplY3RzLmhhc093blByb3BlcnR5KGlkMSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5vYmplY3RzW2lkMV07XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgLy8gSWYgb2JqZWN0IHRvdWNoZXMgYW55dGhpbmcsIC4uLlxuICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXSkge1xuICAgICAgICAvLyBDbGVhbiB1cCB0b3VjaGVzIGFycmF5XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGF0YS50b3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXS5pbmRleE9mKGRhdGEudG91Y2hlc1tqXSkgPT09IC0xKVxuICAgICAgICAgICAgZGF0YS50b3VjaGVzLnNwbGljZShqLS0sIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIGVhY2ggY29sbGlkaW5nIG9iamVjdFxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbGxpc2lvbnNbaWQxXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGlkMiA9IGNvbGxpc2lvbnNbaWQxXVtqXTtcbiAgICAgICAgICBjb25zdCBvYmplY3QyID0gdGhpcy5vYmplY3RzW2lkMl07XG4gICAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IG9iamVjdDIuY29tcG9uZW50O1xuICAgICAgICAgIGNvbnN0IGRhdGEyID0gY29tcG9uZW50Mi51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICAgICAgaWYgKG9iamVjdDIpIHtcbiAgICAgICAgICAgIC8vIElmIG9iamVjdCB3YXMgbm90IGFscmVhZHkgdG91Y2hpbmcgb2JqZWN0Miwgbm90aWZ5IG9iamVjdFxuICAgICAgICAgICAgaWYgKGRhdGEudG91Y2hlcy5pbmRleE9mKGlkMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgIGRhdGEudG91Y2hlcy5wdXNoKGlkMik7XG5cbiAgICAgICAgICAgICAgY29uc3QgdmVsID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmdldExpbmVhclZlbG9jaXR5KCk7XG4gICAgICAgICAgICAgIGNvbnN0IHZlbDIgPSBjb21wb25lbnQyLnVzZSgncGh5c2ljcycpLmdldExpbmVhclZlbG9jaXR5KCk7XG5cbiAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnN1YlZlY3RvcnModmVsLCB2ZWwyKTtcbiAgICAgICAgICAgICAgY29uc3QgdGVtcDEgPSB0ZW1wMVZlY3RvcjMuY2xvbmUoKTtcblxuICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc3ViVmVjdG9ycyh2ZWwsIHZlbDIpO1xuICAgICAgICAgICAgICBjb25zdCB0ZW1wMiA9IHRlbXAxVmVjdG9yMy5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgIGxldCBub3JtYWxfb2Zmc2V0ID0gbm9ybWFsX29mZnNldHNbYCR7ZGF0YS5pZH0tJHtkYXRhMi5pZH1gXTtcblxuICAgICAgICAgICAgICBpZiAobm9ybWFsX29mZnNldCA+IDApIHtcbiAgICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICAgICAgICAgICAgLWluZm9bbm9ybWFsX29mZnNldF0sXG4gICAgICAgICAgICAgICAgICAtaW5mb1tub3JtYWxfb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgICAgICAgICAtaW5mb1tub3JtYWxfb2Zmc2V0ICsgMl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vcm1hbF9vZmZzZXQgKj0gLTE7XG5cbiAgICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICAgICAgICAgICAgaW5mb1tub3JtYWxfb2Zmc2V0XSxcbiAgICAgICAgICAgICAgICAgIGluZm9bbm9ybWFsX29mZnNldCArIDFdLFxuICAgICAgICAgICAgICAgICAgaW5mb1tub3JtYWxfb2Zmc2V0ICsgMl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29tcG9uZW50LmVtaXQoJ2NvbGxpc2lvbicsIG9iamVjdDIsIHRlbXAxLCB0ZW1wMiwgdGVtcDFWZWN0b3IzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBkYXRhLnRvdWNoZXMubGVuZ3RoID0gMDsgLy8gbm90IHRvdWNoaW5nIG90aGVyIG9iamVjdHNcbiAgICB9XG5cbiAgICB0aGlzLmNvbGxpc2lvbnMgPSBjb2xsaXNpb25zO1xuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLnNlbmQoaW5mby5idWZmZXIsIFtpbmZvLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIGFkZENvbnN0cmFpbnQoY29uc3RyYWludCwgc2hvd19tYXJrZXIpIHtcbiAgICBjb25zdHJhaW50LmlkID0gdGhpcy5nZXRPYmplY3RJZCgpO1xuICAgIHRoaXMuY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gPSBjb25zdHJhaW50O1xuICAgIGNvbnN0cmFpbnQud29ybGRNb2R1bGUgPSB0aGlzO1xuICAgIHRoaXMuZXhlY3V0ZSgnYWRkQ29uc3RyYWludCcsIGNvbnN0cmFpbnQuZ2V0RGVmaW5pdGlvbigpKTtcblxuICAgIGlmIChzaG93X21hcmtlcikge1xuICAgICAgbGV0IG1hcmtlcjtcblxuICAgICAgc3dpdGNoIChjb25zdHJhaW50LnR5cGUpIHtcbiAgICAgICAgY2FzZSAncG9pbnQnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMub2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2hpbmdlJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLm9iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzbGlkZXInOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IEJveEdlb21ldHJ5KDEwLCAxLCAxKSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG5cbiAgICAgICAgICAvLyBUaGlzIHJvdGF0aW9uIGlzbid0IHJpZ2h0IGlmIGFsbCB0aHJlZSBheGlzIGFyZSBub24tMCB2YWx1ZXNcbiAgICAgICAgICAvLyBUT0RPOiBjaGFuZ2UgbWFya2VyJ3Mgcm90YXRpb24gb3JkZXIgdG8gWllYXG4gICAgICAgICAgbWFya2VyLnJvdGF0aW9uLnNldChcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy55LCAvLyB5ZXMsIHkgYW5kXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMueCwgLy8geCBheGlzIGFyZSBzd2FwcGVkXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMuelxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnY29uZXR3aXN0JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLm9iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdkb2YnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMub2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb25zdHJhaW50O1xuICB9XG5cbiAgb25TaW11bGF0aW9uUmVzdW1lKCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnb25TaW11bGF0aW9uUmVzdW1lJywge30pO1xuICB9XG5cbiAgcmVtb3ZlQ29uc3RyYWludChjb25zdHJhaW50KSB7XG4gICAgaWYgKHRoaXMuY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVDb25zdHJhaW50Jywge2lkOiBjb25zdHJhaW50LmlkfSk7XG4gICAgICBkZWxldGUgdGhpcy5jb25zdHJhaW50c1tjb25zdHJhaW50LmlkXTtcbiAgICB9XG4gIH1cblxuICBleGVjdXRlKGNtZCwgcGFyYW1zKSB7XG4gICAgdGhpcy5zZW5kKHtjbWQsIHBhcmFtc30pO1xuICB9XG5cbiAgb25BZGRDYWxsYmFjayhjb21wb25lbnQpIHtcbiAgICBjb25zdCBvYmplY3QgPSBjb21wb25lbnQubmF0aXZlO1xuICAgIGNvbnN0IGRhdGEgPSBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICBpZiAoZGF0YSkge1xuICAgICAgY29tcG9uZW50Lm1hbmFnZXIuc2V0KCdtb2R1bGU6d29ybGQnLCB0aGlzKTtcbiAgICAgIGRhdGEuaWQgPSB0aGlzLmdldE9iamVjdElkKCk7XG4gICAgICBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGEgPSBkYXRhO1xuXG4gICAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVmVoaWNsZSkge1xuICAgICAgICB0aGlzLm9uQWRkQ2FsbGJhY2sob2JqZWN0Lm1lc2gpO1xuICAgICAgICB0aGlzLnZlaGljbGVzW2RhdGEuaWRdID0gb2JqZWN0O1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2FkZFZlaGljbGUnLCBkYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9iamVjdHNbZGF0YS5pZF0gPSBvYmplY3Q7XG5cbiAgICAgICAgaWYgKG9iamVjdC5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICBkYXRhLmNoaWxkcmVuID0gW107XG4gICAgICAgICAgYWRkT2JqZWN0Q2hpbGRyZW4ob2JqZWN0LCBvYmplY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gb2JqZWN0LnF1YXRlcm5pb24uc2V0RnJvbUV1bGVyKG9iamVjdC5yb3RhdGlvbik7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdC5jb21wb25lbnQpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhvYmplY3Qucm90YXRpb24pO1xuXG4gICAgICAgIC8vIE9iamVjdCBzdGFydGluZyBwb3NpdGlvbiArIHJvdGF0aW9uXG4gICAgICAgIGRhdGEucG9zaXRpb24gPSB7XG4gICAgICAgICAgeDogb2JqZWN0LnBvc2l0aW9uLngsXG4gICAgICAgICAgeTogb2JqZWN0LnBvc2l0aW9uLnksXG4gICAgICAgICAgejogb2JqZWN0LnBvc2l0aW9uLnpcbiAgICAgICAgfTtcblxuICAgICAgICBkYXRhLnJvdGF0aW9uID0ge1xuICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgeTogb2JqZWN0LnF1YXRlcm5pb24ueSxcbiAgICAgICAgICB6OiBvYmplY3QucXVhdGVybmlvbi56LFxuICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoZGF0YS53aWR0aCkgZGF0YS53aWR0aCAqPSBvYmplY3Quc2NhbGUueDtcbiAgICAgICAgaWYgKGRhdGEuaGVpZ2h0KSBkYXRhLmhlaWdodCAqPSBvYmplY3Quc2NhbGUueTtcbiAgICAgICAgaWYgKGRhdGEuZGVwdGgpIGRhdGEuZGVwdGggKj0gb2JqZWN0LnNjYWxlLno7XG5cbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRPYmplY3QnLCBkYXRhKTtcbiAgICAgIH1cblxuICAgICAgY29tcG9uZW50LmVtaXQoJ3BoeXNpY3M6YWRkZWQnKTtcbiAgICB9XG4gIH1cblxuICBvblJlbW92ZUNhbGxiYWNrKGNvbXBvbmVudCkge1xuICAgIGNvbnN0IG9iamVjdCA9IGNvbXBvbmVudC5uYXRpdmU7XG5cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVmVoaWNsZSkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVWZWhpY2xlJywge2lkOiBvYmplY3QuX3BoeXNpanMuaWR9KTtcbiAgICAgIHdoaWxlIChvYmplY3Qud2hlZWxzLmxlbmd0aCkgdGhpcy5yZW1vdmUob2JqZWN0LndoZWVscy5wb3AoKSk7XG5cbiAgICAgIHRoaXMucmVtb3ZlKG9iamVjdC5tZXNoKTtcbiAgICAgIHRoaXMudmVoaWNsZXNbb2JqZWN0Ll9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1lc2gucHJvdG90eXBlLnJlbW92ZS5jYWxsKHRoaXMsIG9iamVjdCk7XG5cbiAgICAgIGlmIChvYmplY3QuX3BoeXNpanMpIHtcbiAgICAgICAgY29tcG9uZW50Lm1hbmFnZXIucmVtb3ZlKCdtb2R1bGU6d29ybGQnKTtcbiAgICAgICAgdGhpcy5vYmplY3RzW29iamVjdC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ3JlbW92ZU9iamVjdCcsIHtpZDogb2JqZWN0Ll9waHlzaWpzLmlkfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZGVmZXIoZnVuYywgYXJncykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNMb2FkZWQpIHtcbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIHRoaXMubG9hZGVyLnRoZW4oKCkgPT4ge1xuICAgICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIG1hbmFnZXIuc2V0KCdwaHlzaWNzV29ya2VyJywgdGhpcy53b3JrZXIpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG9uQWRkKGNvbXBvbmVudCwgc2VsZikge1xuICAgICAgaWYgKGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSkgcmV0dXJuIHNlbGYuZGVmZXIoc2VsZi5vbkFkZENhbGxiYWNrLmJpbmQoc2VsZiksIFtjb21wb25lbnRdKTtcbiAgICAgIHJldHVybjtcbiAgICB9LFxuXG4gICAgb25SZW1vdmUoY29tcG9uZW50LCBzZWxmKSB7XG4gICAgICBpZiAoY29tcG9uZW50LnVzZSgncGh5c2ljcycpKSByZXR1cm4gc2VsZi5kZWZlcihzZWxmLm9uUmVtb3ZlQ2FsbGJhY2suYmluZChzZWxmKSwgW2NvbXBvbmVudF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIC8vIC4uLlxuXG4gICAgdGhpcy5zZXRGaXhlZFRpbWVTdGVwID0gZnVuY3Rpb24oZml4ZWRUaW1lU3RlcCkge1xuICAgICAgaWYgKGZpeGVkVGltZVN0ZXApIHNlbGYuZXhlY3V0ZSgnc2V0Rml4ZWRUaW1lU3RlcCcsIGZpeGVkVGltZVN0ZXApO1xuICAgIH1cblxuICAgIHRoaXMuc2V0R3Jhdml0eSA9IGZ1bmN0aW9uKGdyYXZpdHkpIHtcbiAgICAgIGlmIChncmF2aXR5KSBzZWxmLmV4ZWN1dGUoJ3NldEdyYXZpdHknLCBncmF2aXR5KTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZENvbnN0cmFpbnQgPSBzZWxmLmFkZENvbnN0cmFpbnQuYmluZChzZWxmKTtcblxuICAgIHRoaXMuc2ltdWxhdGUgPSBmdW5jdGlvbih0aW1lU3RlcCwgbWF4U3ViU3RlcHMpIHtcbiAgICAgIGlmIChzZWxmLl9zdGF0cykgc2VsZi5fc3RhdHMuYmVnaW4oKTtcblxuICAgICAgaWYgKHNlbGYuaXNTaW11bGF0aW5nKSByZXR1cm4gZmFsc2U7XG4gICAgICBzZWxmLmlzU2ltdWxhdGluZyA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3Qgb2JqZWN0X2lkIGluIHNlbGYub2JqZWN0cykge1xuICAgICAgICBpZiAoIXNlbGYub2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShvYmplY3RfaWQpKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCBvYmplY3QgPSBzZWxmLm9iamVjdHNbb2JqZWN0X2lkXTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICAgIGlmIChvYmplY3QgIT09IG51bGwgJiYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gfHwgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikpIHtcbiAgICAgICAgICBjb25zdCB1cGRhdGUgPSB7aWQ6IGRhdGEuaWR9O1xuXG4gICAgICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24pIHtcbiAgICAgICAgICAgIHVwZGF0ZS5wb3MgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICB5OiBvYmplY3QucG9zaXRpb24ueSxcbiAgICAgICAgICAgICAgejogb2JqZWN0LnBvc2l0aW9uLnpcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnF1YXQgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5xdWF0ZXJuaW9uLnksXG4gICAgICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLmV4ZWN1dGUoJ3VwZGF0ZVRyYW5zZm9ybScsIHVwZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5leGVjdXRlKCdzaW11bGF0ZScsIHt0aW1lU3RlcCwgbWF4U3ViU3RlcHN9KTtcblxuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5lbmQoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGNvbnN0IHNpbXVsYXRlUHJvY2VzcyA9ICh0KSA9PiB7XG4gICAgLy8gICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHNpbXVsYXRlUHJvY2Vzcyk7XG5cbiAgICAvLyAgIHRoaXMuc2ltdWxhdGUoMS82MCwgMSk7IC8vIGRlbHRhLCAxXG4gICAgLy8gfVxuXG4gICAgLy8gc2ltdWxhdGVQcm9jZXNzKCk7XG5cbiAgICBzZWxmLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgIHNlbGYuc2ltdWxhdGVMb29wID0gbmV3IExvb3AoKGNsb2NrKSA9PiB7XG4gICAgICAgIHRoaXMuc2ltdWxhdGUoY2xvY2suZ2V0RGVsdGEoKSwgMSk7IC8vIGRlbHRhLCAxXG4gICAgICB9KTtcblxuICAgICAgc2VsZi5zaW11bGF0ZUxvb3Auc3RhcnQodGhpcyk7XG5cbiAgICAgIHRoaXMuc2V0R3Jhdml0eShzZWxmLm9wdGlvbnMuZ3Jhdml0eSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsInZhciBUQVJHRVQgPSB0eXBlb2YgU3ltYm9sID09PSAndW5kZWZpbmVkJyA/ICdfX3RhcmdldCcgOiBTeW1ib2woKSxcbiAgICBTQ1JJUFRfVFlQRSA9ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyxcbiAgICBCbG9iQnVpbGRlciA9IHdpbmRvdy5CbG9iQnVpbGRlciB8fCB3aW5kb3cuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1vekJsb2JCdWlsZGVyIHx8IHdpbmRvdy5NU0Jsb2JCdWlsZGVyLFxuICAgIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCxcbiAgICBXb3JrZXIgPSB3aW5kb3cuV29ya2VyO1xuXG4vKipcbiAqIFJldHVybnMgYSB3cmFwcGVyIGFyb3VuZCBXZWIgV29ya2VyIGNvZGUgdGhhdCBpcyBjb25zdHJ1Y3RpYmxlLlxuICpcbiAqIEBmdW5jdGlvbiBzaGltV29ya2VyXG4gKlxuICogQHBhcmFtIHsgU3RyaW5nIH0gICAgZmlsZW5hbWUgICAgVGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAqIEBwYXJhbSB7IEZ1bmN0aW9uIH0gIGZuICAgICAgICAgIEZ1bmN0aW9uIHdyYXBwaW5nIHRoZSBjb2RlIG9mIHRoZSB3b3JrZXJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2hpbVdvcmtlciAoZmlsZW5hbWUsIGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIFNoaW1Xb3JrZXIgKGZvcmNlRmFsbGJhY2spIHtcbiAgICAgICAgdmFyIG8gPSB0aGlzO1xuXG4gICAgICAgIGlmICghZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgV29ya2VyKGZpbGVuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChXb3JrZXIgJiYgIWZvcmNlRmFsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGZ1bmN0aW9uJ3MgaW5uZXIgY29kZSB0byBhIHN0cmluZyB0byBjb25zdHJ1Y3QgdGhlIHdvcmtlclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGZuLnRvU3RyaW5nKCkucmVwbGFjZSgvXmZ1bmN0aW9uLis/ey8sICcnKS5zbGljZSgwLCAtMSksXG4gICAgICAgICAgICAgICAgb2JqVVJMID0gY3JlYXRlU291cmNlT2JqZWN0KHNvdXJjZSk7XG5cbiAgICAgICAgICAgIHRoaXNbVEFSR0VUXSA9IG5ldyBXb3JrZXIob2JqVVJMKTtcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwob2JqVVJMKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW1RBUkdFVF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc2VsZlNoaW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlOiBmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby5vbm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IG8ub25tZXNzYWdlKHsgZGF0YTogbSwgdGFyZ2V0OiBzZWxmU2hpbSB9KSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZuLmNhbGwoc2VsZlNoaW0pO1xuICAgICAgICAgICAgdGhpcy5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNlbGZTaGltLm9ubWVzc2FnZSh7IGRhdGE6IG0sIHRhcmdldDogbyB9KSB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmlzVGhpc1RocmVhZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLy8gVGVzdCBXb3JrZXIgY2FwYWJpbGl0aWVzXG5pZiAoV29ya2VyKSB7XG4gICAgdmFyIHRlc3RXb3JrZXIsXG4gICAgICAgIG9ialVSTCA9IGNyZWF0ZVNvdXJjZU9iamVjdCgnc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7fScpLFxuICAgICAgICB0ZXN0QXJyYXkgPSBuZXcgVWludDhBcnJheSgxKTtcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIE5vIHdvcmtlcnMgdmlhIGJsb2JzIGluIEVkZ2UgMTIgYW5kIElFIDExIGFuZCBsb3dlciA6KFxuICAgICAgICBpZiAoLyg/OlRyaWRlbnR8RWRnZSlcXC8oPzpbNTY3XXwxMikvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXN0V29ya2VyID0gbmV3IFdvcmtlcihvYmpVUkwpO1xuXG4gICAgICAgIC8vIE5hdGl2ZSBicm93c2VyIG9uIHNvbWUgU2Ftc3VuZyBkZXZpY2VzIHRocm93cyBmb3IgdHJhbnNmZXJhYmxlcywgbGV0J3MgZGV0ZWN0IGl0XG4gICAgICAgIHRlc3RXb3JrZXIucG9zdE1lc3NhZ2UodGVzdEFycmF5LCBbdGVzdEFycmF5LmJ1ZmZlcl0pO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBXb3JrZXIgPSBudWxsO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChvYmpVUkwpO1xuICAgICAgICBpZiAodGVzdFdvcmtlcikge1xuICAgICAgICAgICAgdGVzdFdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU291cmNlT2JqZWN0KHN0cikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtzdHJdLCB7IHR5cGU6IFNDUklQVF9UWVBFIH0pKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYkJ1aWxkZXIoKTtcbiAgICAgICAgYmxvYi5hcHBlbmQoc3RyKTtcbiAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYi5nZXRCbG9iKHR5cGUpKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgc2hpbVdvcmtlciBmcm9tICdyb2xsdXAtcGx1Z2luLWJ1bmRsZS13b3JrZXInO1xuZXhwb3J0IGRlZmF1bHQgbmV3IHNoaW1Xb3JrZXIoXCIuLi93b3JrZXIuanNcIiwgZnVuY3Rpb24gKHdpbmRvdywgZG9jdW1lbnQpIHtcbnZhciBzZWxmID0gdGhpcztcbmZ1bmN0aW9uIEV2ZW50cyh0YXJnZXQpe1xuICB2YXIgZXZlbnRzID0ge30sIGVtcHR5ID0gW107XG4gIHRhcmdldCA9IHRhcmdldCB8fCB0aGlzXG4gIC8qKlxuICAgKiAgT246IGxpc3RlbiB0byBldmVudHNcbiAgICovXG4gIHRhcmdldC5vbiA9IGZ1bmN0aW9uKHR5cGUsIGZ1bmMsIGN0eCl7XG4gICAgKGV2ZW50c1t0eXBlXSA9IGV2ZW50c1t0eXBlXSB8fCBbXSkucHVzaChbZnVuYywgY3R4XSlcbiAgICByZXR1cm4gdGFyZ2V0XG4gIH1cbiAgLyoqXG4gICAqICBPZmY6IHN0b3AgbGlzdGVuaW5nIHRvIGV2ZW50IC8gc3BlY2lmaWMgY2FsbGJhY2tcbiAgICovXG4gIHRhcmdldC5vZmYgPSBmdW5jdGlvbih0eXBlLCBmdW5jKXtcbiAgICB0eXBlIHx8IChldmVudHMgPSB7fSlcbiAgICB2YXIgbGlzdCA9IGV2ZW50c1t0eXBlXSB8fCBlbXB0eSxcbiAgICAgICAgaSA9IGxpc3QubGVuZ3RoID0gZnVuYyA/IGxpc3QubGVuZ3RoIDogMDtcbiAgICB3aGlsZShpLS0pIGZ1bmMgPT0gbGlzdFtpXVswXSAmJiBsaXN0LnNwbGljZShpLDEpXG4gICAgcmV0dXJuIHRhcmdldFxuICB9XG4gIC8qKlxuICAgKiBFbWl0OiBzZW5kIGV2ZW50LCBjYWxsYmFja3Mgd2lsbCBiZSB0cmlnZ2VyZWRcbiAgICovXG4gIHRhcmdldC5lbWl0ID0gZnVuY3Rpb24odHlwZSl7XG4gICAgdmFyIGUgPSBldmVudHNbdHlwZV0gfHwgZW1wdHksIGxpc3QgPSBlLmxlbmd0aCA+IDAgPyBlLnNsaWNlKDAsIGUubGVuZ3RoKSA6IGUsIGk9MCwgajtcbiAgICB3aGlsZShqPWxpc3RbaSsrXSkgalswXS5hcHBseShqWzFdLCBlbXB0eS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXG4gICAgcmV0dXJuIHRhcmdldFxuICB9O1xufTtcblxuY29uc3QgaW5zaWRlV29ya2VyID0gIXNlbGYuZG9jdW1lbnQ7XG5pZiAoIWluc2lkZVdvcmtlcikgc2VsZiA9IG5ldyBFdmVudHMoKTtcblxubGV0IHNlbmQgPSBpbnNpZGVXb3JrZXIgPyAoc2VsZi53ZWJraXRQb3N0TWVzc2FnZSB8fCBzZWxmLnBvc3RNZXNzYWdlKSA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgc2VsZi5lbWl0KCdtZXNzYWdlJywgW2RhdGFdKTtcbn07XG5cbnNlbGYuc2VuZCA9IHNlbmQ7XG5cbmxldCBTVVBQT1JUX1RSQU5TRkVSQUJMRTtcblxuaWYgKGluc2lkZVdvcmtlcikge1xuICBjb25zdCBhYiA9IG5ldyBBcnJheUJ1ZmZlcigxKTtcblxuICBzZW5kKGFiLCBbYWJdKTtcbiAgU1VQUE9SVF9UUkFOU0ZFUkFCTEUgPSAoYWIuYnl0ZUxlbmd0aCA9PT0gMCk7XG59XG5cbmNvbnN0IE1FU1NBR0VfVFlQRVMgPSB7XG4gIFdPUkxEUkVQT1JUOiAwLFxuICBDT0xMSVNJT05SRVBPUlQ6IDEsXG4gIFZFSElDTEVSRVBPUlQ6IDIsXG4gIENPTlNUUkFJTlRSRVBPUlQ6IDMsXG4gIFNPRlRSRVBPUlQ6IDRcbn07XG5cbiAgLy8gdGVtcCB2YXJpYWJsZXNcbmxldCBfb2JqZWN0LFxuICBfdmVjdG9yLFxuICBfdHJhbnNmb3JtLFxuICBfdHJhbnNmb3JtX3BvcyxcbiAgX3NvZnRib2R5X2VuYWJsZWQgPSBmYWxzZSxcbiAgbGFzdF9zaW11bGF0aW9uX2R1cmF0aW9uID0gMCxcblxuICBfbnVtX29iamVjdHMgPSAwLFxuICBfbnVtX3JpZ2lkYm9keV9vYmplY3RzID0gMCxcbiAgX251bV9zb2Z0Ym9keV9vYmplY3RzID0gMCxcbiAgX251bV93aGVlbHMgPSAwLFxuICBfbnVtX2NvbnN0cmFpbnRzID0gMCxcbiAgX3NvZnRib2R5X3JlcG9ydF9zaXplID0gMCxcblxuICAvLyB3b3JsZCB2YXJpYWJsZXNcbiAgZml4ZWRUaW1lU3RlcCwgLy8gdXNlZCB3aGVuIGNhbGxpbmcgc3RlcFNpbXVsYXRpb25cbiAgbGFzdF9zaW11bGF0aW9uX3RpbWUsXG5cbiAgd29ybGQsXG4gIF92ZWMzXzEsXG4gIF92ZWMzXzIsXG4gIF92ZWMzXzMsXG4gIF9xdWF0O1xuXG4gIC8vIHByaXZhdGUgY2FjaGVcbmNvbnN0IHB1YmxpY19mdW5jdGlvbnMgPSB7fSxcbiAgX29iamVjdHMgPSBbXSxcbiAgX3ZlaGljbGVzID0gW10sXG4gIF9jb25zdHJhaW50cyA9IFtdLFxuICBfb2JqZWN0c19hbW1vID0ge30sXG4gIF9vYmplY3Rfc2hhcGVzID0ge30sXG5cbiAgLy8gVGhlIGZvbGxvd2luZyBvYmplY3RzIGFyZSB0byB0cmFjayBvYmplY3RzIHRoYXQgYW1tby5qcyBkb2Vzbid0IGNsZWFuXG4gIC8vIHVwLiBBbGwgYXJlIGNsZWFuZWQgdXAgd2hlbiB0aGV5J3JlIGNvcnJlc3BvbmRpbmcgYm9keSBpcyBkZXN0cm95ZWQuXG4gIC8vIFVuZm9ydHVuYXRlbHksIGl0J3MgdmVyeSBkaWZmaWN1bHQgdG8gZ2V0IGF0IHRoZXNlIG9iamVjdHMgZnJvbSB0aGVcbiAgLy8gYm9keSwgc28gd2UgaGF2ZSB0byB0cmFjayB0aGVtIG91cnNlbHZlcy5cbiAgX21vdGlvbl9zdGF0ZXMgPSB7fSxcbiAgLy8gRG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dCBpdCBmb3IgY2FjaGVkIHNoYXBlcy5cbiAgX25vbmNhY2hlZF9zaGFwZXMgPSB7fSxcbiAgLy8gQSBib2R5IHdpdGggYSBjb21wb3VuZCBzaGFwZSBhbHdheXMgaGFzIGEgcmVndWxhciBzaGFwZSBhcyB3ZWxsLCBzbyB3ZVxuICAvLyBoYXZlIHRyYWNrIHRoZW0gc2VwYXJhdGVseS5cbiAgX2NvbXBvdW5kX3NoYXBlcyA9IHt9O1xuXG4gIC8vIG9iamVjdCByZXBvcnRpbmdcbmxldCBSRVBPUlRfQ0hVTktTSVpFLCAvLyByZXBvcnQgYXJyYXkgaXMgaW5jcmVhc2VkIGluIGluY3JlbWVudHMgb2YgdGhpcyBjaHVuayBzaXplXG4gIHdvcmxkcmVwb3J0LFxuICBzb2Z0cmVwb3J0LFxuICBjb2xsaXNpb25yZXBvcnQsXG4gIHZlaGljbGVyZXBvcnQsXG4gIGNvbnN0cmFpbnRyZXBvcnQ7XG5cbmNvbnN0IFdPUkxEUkVQT1JUX0lURU1TSVpFID0gMTQsIC8vIGhvdyBtYW55IGZsb2F0IHZhbHVlcyBlYWNoIHJlcG9ydGVkIGl0ZW0gbmVlZHNcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFID0gNSwgLy8gb25lIGZsb2F0IGZvciBlYWNoIG9iamVjdCBpZCwgYW5kIGEgVmVjMyBjb250YWN0IG5vcm1hbFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFID0gOSwgLy8gdmVoaWNsZSBpZCwgd2hlZWwgaW5kZXgsIDMgZm9yIHBvc2l0aW9uLCA0IGZvciByb3RhdGlvblxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFID0gNjsgLy8gY29uc3RyYWludCBpZCwgb2Zmc2V0IG9iamVjdCwgb2Zmc2V0LCBhcHBsaWVkIGltcHVsc2VcblxuY29uc3QgZ2V0U2hhcGVGcm9tQ2FjaGUgPSAoY2FjaGVfa2V5KSA9PiB7XG4gIGlmIChfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV07XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5jb25zdCBzZXRTaGFwZUNhY2hlID0gKGNhY2hlX2tleSwgc2hhcGUpID0+IHtcbiAgX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XSA9IHNoYXBlO1xufTtcblxuY29uc3QgY3JlYXRlU2hhcGUgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IHNoYXBlO1xuXG4gIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcbiAgc3dpdGNoIChkZXNjcmlwdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnY29tcG91bmQnOiB7XG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29tcG91bmRTaGFwZSgpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAncGxhbmUnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgcGxhbmVfJHtkZXNjcmlwdGlvbi5ub3JtYWwueH1fJHtkZXNjcmlwdGlvbi5ub3JtYWwueX1fJHtkZXNjcmlwdGlvbi5ub3JtYWwuen1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLm5vcm1hbC54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLm5vcm1hbC55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLm5vcm1hbC56KTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idFN0YXRpY1BsYW5lU2hhcGUoX3ZlYzNfMSwgMCk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdib3gnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgYm94XyR7ZGVzY3JpcHRpb24ud2lkdGh9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fV8ke2Rlc2NyaXB0aW9uLmRlcHRofWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ud2lkdGggLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmhlaWdodCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uZGVwdGggLyAyKTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEJveFNoYXBlKF92ZWMzXzEpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc3BoZXJlJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYHNwaGVyZV8ke2Rlc2NyaXB0aW9uLnJhZGl1c31gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idFNwaGVyZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cyk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjeWxpbmRlcic6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjeWxpbmRlcl8ke2Rlc2NyaXB0aW9uLndpZHRofV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1fJHtkZXNjcmlwdGlvbi5kZXB0aH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLndpZHRoIC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5oZWlnaHQgLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLmRlcHRoIC8gMik7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDeWxpbmRlclNoYXBlKF92ZWMzXzEpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY2Fwc3VsZSc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjYXBzdWxlXyR7ZGVzY3JpcHRpb24ucmFkaXVzfV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgLy8gSW4gQnVsbGV0LCBjYXBzdWxlIGhlaWdodCBleGNsdWRlcyB0aGUgZW5kIHNwaGVyZXNcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENhcHN1bGVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMsIGRlc2NyaXB0aW9uLmhlaWdodCAtIDIgKiBkZXNjcmlwdGlvbi5yYWRpdXMpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY29uZSc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjb25lXyR7ZGVzY3JpcHRpb24ucmFkaXVzfV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbmVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMsIGRlc2NyaXB0aW9uLmhlaWdodCk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjb25jYXZlJzoge1xuICAgICAgY29uc3QgdHJpYW5nbGVfbWVzaCA9IG5ldyBBbW1vLmJ0VHJpYW5nbGVNZXNoKCk7XG4gICAgICBpZiAoIWRlc2NyaXB0aW9uLmRhdGEubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aCAvIDk7IGkrKykge1xuICAgICAgICBfdmVjM18xLnNldFgoZGF0YVtpICogOV0pO1xuICAgICAgICBfdmVjM18xLnNldFkoZGF0YVtpICogOSArIDFdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRhdGFbaSAqIDkgKyAyXSk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRhdGFbaSAqIDkgKyAzXSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkYXRhW2kgKiA5ICsgNF0pO1xuICAgICAgICBfdmVjM18yLnNldFooZGF0YVtpICogOSArIDVdKTtcblxuICAgICAgICBfdmVjM18zLnNldFgoZGF0YVtpICogOSArIDZdKTtcbiAgICAgICAgX3ZlYzNfMy5zZXRZKGRhdGFbaSAqIDkgKyA3XSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WihkYXRhW2kgKiA5ICsgOF0pO1xuXG4gICAgICAgIHRyaWFuZ2xlX21lc2guYWRkVHJpYW5nbGUoXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yLFxuICAgICAgICAgIF92ZWMzXzMsXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEJ2aFRyaWFuZ2xlTWVzaFNoYXBlKFxuICAgICAgICB0cmlhbmdsZV9tZXNoLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlXG4gICAgICApO1xuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2NvbnZleCc6IHtcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb252ZXhIdWxsU2hhcGUoKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoIC8gMzsgaSsrKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkYXRhW2kgKiAzIF0pO1xuICAgICAgICBfdmVjM18xLnNldFkoZGF0YVtpICogMyArIDFdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRhdGFbaSAqIDMgKyAyXSk7XG5cbiAgICAgICAgc2hhcGUuYWRkUG9pbnQoX3ZlYzNfMSk7XG4gICAgICB9XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnaGVpZ2h0ZmllbGQnOiB7XG4gICAgICBjb25zdCB4cHRzID0gZGVzY3JpcHRpb24ueHB0cyxcbiAgICAgICAgeXB0cyA9IGRlc2NyaXB0aW9uLnlwdHMsXG4gICAgICAgIHBvaW50cyA9IGRlc2NyaXB0aW9uLnBvaW50cyxcbiAgICAgICAgcHRyID0gQW1tby5fbWFsbG9jKDQgKiB4cHRzICogeXB0cyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwLCBwID0gMCwgcDIgPSAwOyBpIDwgeHB0czsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgeXB0czsgaisrKSB7XG4gICAgICAgICAgQW1tby5IRUFQRjMyW3B0ciArIHAyID4+IDJdID0gcG9pbnRzW3BdO1xuXG4gICAgICAgICAgcCsrO1xuICAgICAgICAgIHAyICs9IDQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEhlaWdodGZpZWxkVGVycmFpblNoYXBlKFxuICAgICAgICBkZXNjcmlwdGlvbi54cHRzLFxuICAgICAgICBkZXNjcmlwdGlvbi55cHRzLFxuICAgICAgICBwdHIsXG4gICAgICAgIDEsXG4gICAgICAgIC1kZXNjcmlwdGlvbi5hYnNNYXhIZWlnaHQsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFic01heEhlaWdodCxcbiAgICAgICAgMSxcbiAgICAgICAgJ1BIWV9GTE9BVCcsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgLy8gTm90IHJlY29nbml6ZWRcbiAgICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBzaGFwZTtcbn07XG5cbmNvbnN0IGNyZWF0ZVNvZnRCb2R5ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBib2R5O1xuXG4gIGNvbnN0IHNvZnRCb2R5SGVscGVycyA9IG5ldyBBbW1vLmJ0U29mdEJvZHlIZWxwZXJzKCk7XG5cbiAgc3dpdGNoIChkZXNjcmlwdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnc29mdFRyaW1lc2gnOiB7XG4gICAgICBpZiAoIWRlc2NyaXB0aW9uLmFWZXJ0aWNlcy5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVGcm9tVHJpTWVzaChcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIGRlc2NyaXB0aW9uLmFWZXJ0aWNlcyxcbiAgICAgICAgZGVzY3JpcHRpb24uYUluZGljZXMsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFJbmRpY2VzLmxlbmd0aCAvIDMsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc29mdENsb3RoTWVzaCc6IHtcbiAgICAgIGNvbnN0IGNyID0gZGVzY3JpcHRpb24uY29ybmVycztcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVQYXRjaChcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjclswXSwgY3JbMV0sIGNyWzJdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzNdLCBjcls0XSwgY3JbNV0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbNl0sIGNyWzddLCBjcls4XSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjcls5XSwgY3JbMTBdLCBjclsxMV0pLFxuICAgICAgICBkZXNjcmlwdGlvbi5zZWdtZW50c1swXSxcbiAgICAgICAgZGVzY3JpcHRpb24uc2VnbWVudHNbMV0sXG4gICAgICAgIDAsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdzb2Z0Um9wZU1lc2gnOiB7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVSb3BlKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGRhdGFbMF0sIGRhdGFbMV0sIGRhdGFbMl0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoZGF0YVszXSwgZGF0YVs0XSwgZGF0YVs1XSksXG4gICAgICAgIGRhdGFbNl0gLSAxLFxuICAgICAgICAwXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIE5vdCByZWNvZ25pemVkXG4gICAgICByZXR1cm47XG4gIH1cblxuICByZXR1cm4gYm9keTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaW5pdCA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBpZiAocGFyYW1zLm5vV29ya2VyKSB7XG4gICAgLy8gY29uc29sZS5sb2cocGFyYW1zKTtcbiAgICB3aW5kb3cuQW1tbyA9IHBhcmFtcy5hbW1vO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChwYXJhbXMud2FzbUJ1ZmZlcikge1xuICAgIGltcG9ydFNjcmlwdHMocGFyYW1zLmFtbW8pO1xuXG4gICAgc2VsZi5BbW1vID0gbG9hZEFtbW9Gcm9tQmluYXJ5KHBhcmFtcy53YXNtQnVmZmVyKTtcbiAgICBzZW5kKHtjbWQ6ICdhbW1vTG9hZGVkJ30pO1xuICAgIHB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkKHBhcmFtcyk7XG4gIH0gZWxzZSB7XG4gICAgaW1wb3J0U2NyaXB0cyhwYXJhbXMuYW1tbyk7XG4gICAgc2VuZCh7Y21kOiAnYW1tb0xvYWRlZCd9KTtcbiAgICBwdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZChwYXJhbXMpO1xuICB9XG59XG5cbnB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIF90cmFuc2Zvcm0gPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICBfdHJhbnNmb3JtX3BvcyA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gIF92ZWMzXzEgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzIgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzMgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF9xdWF0ID0gbmV3IEFtbW8uYnRRdWF0ZXJuaW9uKDAsIDAsIDAsIDApO1xuXG4gIFJFUE9SVF9DSFVOS1NJWkUgPSBwYXJhbXMucmVwb3J0c2l6ZSB8fCA1MDtcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICAvLyBUcmFuc2ZlcmFibGUgbWVzc2FnZXMgYXJlIHN1cHBvcnRlZCwgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlbSB3aXRoIFR5cGVkQXJyYXlzXG4gICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogV09STERSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBvYmplY3RzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbGxpc2lvbnMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiB2ZWhpY2xlcyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbnN0cmFpbnRzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gIH0gZWxzZSB7XG4gICAgLy8gVHJhbnNmZXJhYmxlIG1lc3NhZ2VzIGFyZSBub3Qgc3VwcG9ydGVkLCBzZW5kIGRhdGEgYXMgbm9ybWFsIGFycmF5c1xuICAgIHdvcmxkcmVwb3J0ID0gW107XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gW107XG4gICAgdmVoaWNsZXJlcG9ydCA9IFtdO1xuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBbXTtcbiAgfVxuXG4gIHdvcmxkcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDtcbiAgY29sbGlzaW9ucmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ7XG4gIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG5cbiAgY29uc3QgY29sbGlzaW9uQ29uZmlndXJhdGlvbiA9IHBhcmFtcy5zb2Z0Ym9keVxuICAgID8gbmV3IEFtbW8uYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24oKVxuICAgIDogbmV3IEFtbW8uYnREZWZhdWx0Q29sbGlzaW9uQ29uZmlndXJhdGlvbigpLFxuICAgIGRpc3BhdGNoZXIgPSBuZXcgQW1tby5idENvbGxpc2lvbkRpc3BhdGNoZXIoY29sbGlzaW9uQ29uZmlndXJhdGlvbiksXG4gICAgc29sdmVyID0gbmV3IEFtbW8uYnRTZXF1ZW50aWFsSW1wdWxzZUNvbnN0cmFpbnRTb2x2ZXIoKTtcblxuICBsZXQgYnJvYWRwaGFzZTtcblxuICBpZiAoIXBhcmFtcy5icm9hZHBoYXNlKSBwYXJhbXMuYnJvYWRwaGFzZSA9IHt0eXBlOiAnZHluYW1pYyd9O1xuICAvLyBUT0RPISEhXG4gIC8qIGlmIChwYXJhbXMuYnJvYWRwaGFzZS50eXBlID09PSAnc3dlZXBwcnVuZScpIHtcbiAgICBleHRlbmQocGFyYW1zLmJyb2FkcGhhc2UsIHtcbiAgICAgIGFhYmJtaW46IHtcbiAgICAgICAgeDogLTUwLFxuICAgICAgICB5OiAtNTAsXG4gICAgICAgIHo6IC01MFxuICAgICAgfSxcblxuICAgICAgYWFiYm1heDoge1xuICAgICAgICB4OiA1MCxcbiAgICAgICAgeTogNTAsXG4gICAgICAgIHo6IDUwXG4gICAgICB9LFxuICAgIH0pO1xuICB9Ki9cblxuICBzd2l0Y2ggKHBhcmFtcy5icm9hZHBoYXNlLnR5cGUpIHtcbiAgICBjYXNlICdzd2VlcHBydW5lJzpcbiAgICAgIF92ZWMzXzEuc2V0WChwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWluLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtaW4ueSk7XG4gICAgICBfdmVjM18xLnNldFoocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi56KTtcblxuICAgICAgX3ZlYzNfMi5zZXRYKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtYXgueCk7XG4gICAgICBfdmVjM18yLnNldFkocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1heC55KTtcbiAgICAgIF92ZWMzXzIuc2V0WihwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LnopO1xuXG4gICAgICBicm9hZHBoYXNlID0gbmV3IEFtbW8uYnRBeGlzU3dlZXAzKFxuICAgICAgICBfdmVjM18xLFxuICAgICAgICBfdmVjM18yXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICBjYXNlICdkeW5hbWljJzpcbiAgICBkZWZhdWx0OlxuICAgICAgYnJvYWRwaGFzZSA9IG5ldyBBbW1vLmJ0RGJ2dEJyb2FkcGhhc2UoKTtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgd29ybGQgPSBwYXJhbXMuc29mdGJvZHlcbiAgICA/IG5ldyBBbW1vLmJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24sIG5ldyBBbW1vLmJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyKCkpXG4gICAgOiBuZXcgQW1tby5idERpc2NyZXRlRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pO1xuICBmaXhlZFRpbWVTdGVwID0gcGFyYW1zLmZpeGVkVGltZVN0ZXA7XG5cbiAgaWYgKHBhcmFtcy5zb2Z0Ym9keSkgX3NvZnRib2R5X2VuYWJsZWQgPSB0cnVlO1xuXG4gIHNlbmQoe2NtZDogJ3dvcmxkUmVhZHknfSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEZpeGVkVGltZVN0ZXAgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgZml4ZWRUaW1lU3RlcCA9IGRlc2NyaXB0aW9uO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRHcmF2aXR5ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi54KTtcbiAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnkpO1xuICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ueik7XG4gIHdvcmxkLnNldEdyYXZpdHkoX3ZlYzNfMSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGVuZEFuY2hvciA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBjb25zb2xlLmxvZyhfb2JqZWN0c1tkZXNjcmlwdGlvbi5vYmpdKTtcbiAgX29iamVjdHNbZGVzY3JpcHRpb24ub2JqXVxuICAgIC5hcHBlbmRBbmNob3IoXG4gICAgICBkZXNjcmlwdGlvbi5ub2RlLFxuICAgICAgX29iamVjdHNbZGVzY3JpcHRpb24ub2JqMl0sXG4gICAgICBkZXNjcmlwdGlvbi5jb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzLFxuICAgICAgZGVzY3JpcHRpb24uaW5mbHVlbmNlXG4gICAgKTtcbn1cblxucHVibGljX2Z1bmN0aW9ucy5hZGRPYmplY3QgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IGJvZHksIG1vdGlvblN0YXRlO1xuXG4gIGlmIChkZXNjcmlwdGlvbi50eXBlLmluZGV4T2YoJ3NvZnQnKSAhPT0gLTEpIHtcbiAgICBib2R5ID0gY3JlYXRlU29mdEJvZHkoZGVzY3JpcHRpb24pO1xuXG4gICAgY29uc3Qgc2JDb25maWcgPSBib2R5LmdldF9tX2NmZygpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLnZpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfdml0ZXJhdGlvbnMoZGVzY3JpcHRpb24udml0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5waXRlcmF0aW9ucykgc2JDb25maWcuc2V0X3BpdGVyYXRpb25zKGRlc2NyaXB0aW9uLnBpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uZGl0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9kaXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5kaXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmNpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfY2l0ZXJhdGlvbnMoZGVzY3JpcHRpb24uY2l0ZXJhdGlvbnMpO1xuICAgIHNiQ29uZmlnLnNldF9jb2xsaXNpb25zKDB4MTEpO1xuICAgIHNiQ29uZmlnLnNldF9rREYoZGVzY3JpcHRpb24uZnJpY3Rpb24pO1xuICAgIHNiQ29uZmlnLnNldF9rRFAoZGVzY3JpcHRpb24uZGFtcGluZyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnByZXNzdXJlKSBzYkNvbmZpZy5zZXRfa1BSKGRlc2NyaXB0aW9uLnByZXNzdXJlKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uZHJhZykgc2JDb25maWcuc2V0X2tERyhkZXNjcmlwdGlvbi5kcmFnKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ubGlmdCkgc2JDb25maWcuc2V0X2tMRihkZXNjcmlwdGlvbi5saWZ0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24uYW5jaG9ySGFyZG5lc3MpIHNiQ29uZmlnLnNldF9rQUhSKGRlc2NyaXB0aW9uLmFuY2hvckhhcmRuZXNzKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucmlnaWRIYXJkbmVzcykgc2JDb25maWcuc2V0X2tDSFIoZGVzY3JpcHRpb24ucmlnaWRIYXJkbmVzcyk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24ua2xzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rTFNUKGRlc2NyaXB0aW9uLmtsc3QpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5rYXN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tBU1QoZGVzY3JpcHRpb24ua2FzdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmt2c3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa1ZTVChkZXNjcmlwdGlvbi5rdnN0KTtcblxuICAgIEFtbW8uY2FzdE9iamVjdChib2R5LCBBbW1vLmJ0Q29sbGlzaW9uT2JqZWN0KS5nZXRDb2xsaXNpb25TaGFwZSgpLnNldE1hcmdpbihkZXNjcmlwdGlvbi5tYXJnaW4gPyBkZXNjcmlwdGlvbi5tYXJnaW4gOiAwLjEpO1xuXG4gICAgLy8gQW1tby5jYXN0T2JqZWN0KGJvZHksIEFtbW8uYnRDb2xsaXNpb25PYmplY3QpLmdldENvbGxpc2lvblNoYXBlKCkuc2V0TG9jYWxTY2FsaW5nKF92ZWMzXzEpO1xuICAgIGJvZHkuc2V0QWN0aXZhdGlvblN0YXRlKGRlc2NyaXB0aW9uLnN0YXRlIHx8IDQpO1xuICAgIGJvZHkudHlwZSA9IDA7IC8vIFNvZnRCb2R5LlxuICAgIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFJvcGVNZXNoJykgYm9keS5yb3BlID0gdHJ1ZTtcbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRDbG90aE1lc2gnKSBib2R5LmNsb3RoID0gdHJ1ZTtcblxuICAgIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5wb3NpdGlvbi54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ucG9zaXRpb24ueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnopO1xuICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgX3F1YXQuc2V0WChkZXNjcmlwdGlvbi5yb3RhdGlvbi54KTtcbiAgICBfcXVhdC5zZXRZKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnkpO1xuICAgIF9xdWF0LnNldFooZGVzY3JpcHRpb24ucm90YXRpb24ueik7XG4gICAgX3F1YXQuc2V0VyhkZXNjcmlwdGlvbi5yb3RhdGlvbi53KTtcbiAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgIGJvZHkudHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnNjYWxlLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5zY2FsZS55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uc2NhbGUueik7XG5cbiAgICBib2R5LnNjYWxlKF92ZWMzXzEpO1xuXG4gICAgYm9keS5zZXRUb3RhbE1hc3MoZGVzY3JpcHRpb24ubWFzcywgZmFsc2UpO1xuICAgIHdvcmxkLmFkZFNvZnRCb2R5KGJvZHksIDEsIC0xKTtcbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRUcmltZXNoJykgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fZmFjZXMoKS5zaXplKCkgKiAzO1xuICAgIGVsc2UgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Um9wZU1lc2gnKSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9ub2RlcygpLnNpemUoKTtcbiAgICBlbHNlIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX25vZGVzKCkuc2l6ZSgpICogMztcblxuICAgIF9udW1fc29mdGJvZHlfb2JqZWN0cysrO1xuICB9IGVsc2Uge1xuICAgIGxldCBzaGFwZSA9IGNyZWF0ZVNoYXBlKGRlc2NyaXB0aW9uKTtcblxuICAgIGlmICghc2hhcGUpIHJldHVybjtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBjaGlsZHJlbiB0aGVuIHRoaXMgaXMgYSBjb21wb3VuZCBzaGFwZVxuICAgIGlmIChkZXNjcmlwdGlvbi5jaGlsZHJlbikge1xuICAgICAgY29uc3QgY29tcG91bmRfc2hhcGUgPSBuZXcgQW1tby5idENvbXBvdW5kU2hhcGUoKTtcbiAgICAgIGNvbXBvdW5kX3NoYXBlLmFkZENoaWxkU2hhcGUoX3RyYW5zZm9ybSwgc2hhcGUpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IF9jaGlsZCA9IGRlc2NyaXB0aW9uLmNoaWxkcmVuW2ldO1xuXG4gICAgICAgIGNvbnN0IHRyYW5zID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnMuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgICBfdmVjM18xLnNldFgoX2NoaWxkLnBvc2l0aW9uX29mZnNldC54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihfY2hpbGQucG9zaXRpb25fb2Zmc2V0LnopO1xuICAgICAgICB0cmFucy5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgICAgX3F1YXQuc2V0WChfY2hpbGQucm90YXRpb24ueCk7XG4gICAgICAgIF9xdWF0LnNldFkoX2NoaWxkLnJvdGF0aW9uLnkpO1xuICAgICAgICBfcXVhdC5zZXRaKF9jaGlsZC5yb3RhdGlvbi56KTtcbiAgICAgICAgX3F1YXQuc2V0VyhfY2hpbGQucm90YXRpb24udyk7XG4gICAgICAgIHRyYW5zLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgICAgICBzaGFwZSA9IGNyZWF0ZVNoYXBlKGRlc2NyaXB0aW9uLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgY29tcG91bmRfc2hhcGUuYWRkQ2hpbGRTaGFwZSh0cmFucywgc2hhcGUpO1xuICAgICAgICBBbW1vLmRlc3Ryb3kodHJhbnMpO1xuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IGNvbXBvdW5kX3NoYXBlO1xuICAgICAgX2NvbXBvdW5kX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcbiAgICB9XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uc2NhbGUueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnNjYWxlLnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5zY2FsZS56KTtcblxuICAgIHNoYXBlLnNldExvY2FsU2NhbGluZyhfdmVjM18xKTtcbiAgICBzaGFwZS5zZXRNYXJnaW4oZGVzY3JpcHRpb24ubWFyZ2luID8gZGVzY3JpcHRpb24ubWFyZ2luIDogMCk7XG5cbiAgICBfdmVjM18xLnNldFgoMCk7XG4gICAgX3ZlYzNfMS5zZXRZKDApO1xuICAgIF92ZWMzXzEuc2V0WigwKTtcbiAgICBzaGFwZS5jYWxjdWxhdGVMb2NhbEluZXJ0aWEoZGVzY3JpcHRpb24ubWFzcywgX3ZlYzNfMSk7XG5cbiAgICBfdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG5cbiAgICBfdmVjM18yLnNldFgoZGVzY3JpcHRpb24ucG9zaXRpb24ueCk7XG4gICAgX3ZlYzNfMi5zZXRZKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnkpO1xuICAgIF92ZWMzXzIuc2V0WihkZXNjcmlwdGlvbi5wb3NpdGlvbi56KTtcbiAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgIF9xdWF0LnNldFgoZGVzY3JpcHRpb24ucm90YXRpb24ueCk7XG4gICAgX3F1YXQuc2V0WShkZXNjcmlwdGlvbi5yb3RhdGlvbi55KTtcbiAgICBfcXVhdC5zZXRaKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnopO1xuICAgIF9xdWF0LnNldFcoZGVzY3JpcHRpb24ucm90YXRpb24udyk7XG4gICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICBtb3Rpb25TdGF0ZSA9IG5ldyBBbW1vLmJ0RGVmYXVsdE1vdGlvblN0YXRlKF90cmFuc2Zvcm0pOyAvLyAjVE9ETzogYnREZWZhdWx0TW90aW9uU3RhdGUgc3VwcG9ydHMgY2VudGVyIG9mIG1hc3Mgb2Zmc2V0IGFzIHNlY29uZCBhcmd1bWVudCAtIGltcGxlbWVudFxuICAgIGNvbnN0IHJiSW5mbyA9IG5ldyBBbW1vLmJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyhkZXNjcmlwdGlvbi5tYXNzLCBtb3Rpb25TdGF0ZSwgc2hhcGUsIF92ZWMzXzEpO1xuXG4gICAgcmJJbmZvLnNldF9tX2ZyaWN0aW9uKGRlc2NyaXB0aW9uLmZyaWN0aW9uKTtcbiAgICByYkluZm8uc2V0X21fcmVzdGl0dXRpb24oZGVzY3JpcHRpb24ucmVzdGl0dXRpb24pO1xuICAgIHJiSW5mby5zZXRfbV9saW5lYXJEYW1waW5nKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuICAgIHJiSW5mby5zZXRfbV9hbmd1bGFyRGFtcGluZyhkZXNjcmlwdGlvbi5kYW1waW5nKTtcblxuICAgIGJvZHkgPSBuZXcgQW1tby5idFJpZ2lkQm9keShyYkluZm8pO1xuICAgIGJvZHkuc2V0QWN0aXZhdGlvblN0YXRlKGRlc2NyaXB0aW9uLnN0YXRlIHx8IDQpO1xuICAgIEFtbW8uZGVzdHJveShyYkluZm8pO1xuXG4gICAgaWYgKHR5cGVvZiBkZXNjcmlwdGlvbi5jb2xsaXNpb25fZmxhZ3MgIT09ICd1bmRlZmluZWQnKSBib2R5LnNldENvbGxpc2lvbkZsYWdzKGRlc2NyaXB0aW9uLmNvbGxpc2lvbl9mbGFncyk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24uZ3JvdXAgJiYgZGVzY3JpcHRpb24ubWFzaykgd29ybGQuYWRkUmlnaWRCb2R5KGJvZHksIGRlc2NyaXB0aW9uLmdyb3VwLCBkZXNjcmlwdGlvbi5tYXNrKTtcbiAgICBlbHNlIHdvcmxkLmFkZFJpZ2lkQm9keShib2R5KTtcbiAgICBib2R5LnR5cGUgPSAxOyAvLyBSaWdpZEJvZHkuXG4gICAgX251bV9yaWdpZGJvZHlfb2JqZWN0cysrO1xuICB9XG5cbiAgYm9keS5hY3RpdmF0ZSgpO1xuXG4gIGJvZHkuaWQgPSBkZXNjcmlwdGlvbi5pZDtcbiAgX29iamVjdHNbYm9keS5pZF0gPSBib2R5O1xuICBfbW90aW9uX3N0YXRlc1tib2R5LmlkXSA9IG1vdGlvblN0YXRlO1xuXG4gIF9vYmplY3RzX2FtbW9bYm9keS5hID09PSB1bmRlZmluZWQgPyBib2R5LnB0ciA6IGJvZHkuYV0gPSBib2R5LmlkO1xuICBfbnVtX29iamVjdHMrKztcblxuICBzZW5kKHtjbWQ6ICdvYmplY3RSZWFkeScsIHBhcmFtczogYm9keS5pZH0pO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRWZWhpY2xlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGNvbnN0IHZlaGljbGVfdHVuaW5nID0gbmV3IEFtbW8uYnRWZWhpY2xlVHVuaW5nKCk7XG5cbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyhkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX3N0aWZmbmVzcyk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbihkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX2NvbXByZXNzaW9uKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvbkRhbXBpbmcoZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9kYW1waW5nKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtKGRlc2NyaXB0aW9uLm1heF9zdXNwZW5zaW9uX3RyYXZlbCk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25Gb3JjZShkZXNjcmlwdGlvbi5tYXhfc3VzcGVuc2lvbl9mb3JjZSk7XG5cbiAgY29uc3QgdmVoaWNsZSA9IG5ldyBBbW1vLmJ0UmF5Y2FzdFZlaGljbGUoXG4gICAgdmVoaWNsZV90dW5pbmcsXG4gICAgX29iamVjdHNbZGVzY3JpcHRpb24ucmlnaWRCb2R5XSxcbiAgICBuZXcgQW1tby5idERlZmF1bHRWZWhpY2xlUmF5Y2FzdGVyKHdvcmxkKVxuICApO1xuXG4gIHZlaGljbGUudHVuaW5nID0gdmVoaWNsZV90dW5pbmc7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnJpZ2lkQm9keV0uc2V0QWN0aXZhdGlvblN0YXRlKDQpO1xuICB2ZWhpY2xlLnNldENvb3JkaW5hdGVTeXN0ZW0oMCwgMSwgMik7XG5cbiAgd29ybGQuYWRkVmVoaWNsZSh2ZWhpY2xlKTtcbiAgX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHZlaGljbGU7XG59O1xucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVWZWhpY2xlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gPSBudWxsO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRXaGVlbCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbGV0IHR1bmluZyA9IF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0udHVuaW5nO1xuICAgIGlmIChkZXNjcmlwdGlvbi50dW5pbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdHVuaW5nID0gbmV3IEFtbW8uYnRWZWhpY2xlVHVuaW5nKCk7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyhkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9zdGlmZm5lc3MpO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbihkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9jb21wcmVzc2lvbik7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvbkRhbXBpbmcoZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fZGFtcGluZyk7XG4gICAgICB0dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtKGRlc2NyaXB0aW9uLnR1bmluZy5tYXhfc3VzcGVuc2lvbl90cmF2ZWwpO1xuICAgICAgdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25Gb3JjZShkZXNjcmlwdGlvbi50dW5pbmcubWF4X3N1c3BlbnNpb25fZm9yY2UpO1xuICAgIH1cblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LnopO1xuXG4gICAgX3ZlYzNfMi5zZXRYKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi54KTtcbiAgICBfdmVjM18yLnNldFkoZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLnkpO1xuICAgIF92ZWMzXzIuc2V0WihkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueik7XG5cbiAgICBfdmVjM18zLnNldFgoZGVzY3JpcHRpb24ud2hlZWxfYXhsZS54KTtcbiAgICBfdmVjM18zLnNldFkoZGVzY3JpcHRpb24ud2hlZWxfYXhsZS55KTtcbiAgICBfdmVjM18zLnNldFooZGVzY3JpcHRpb24ud2hlZWxfYXhsZS56KTtcblxuICAgIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0uYWRkV2hlZWwoXG4gICAgICBfdmVjM18xLFxuICAgICAgX3ZlYzNfMixcbiAgICAgIF92ZWMzXzMsXG4gICAgICBkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLFxuICAgICAgZGVzY3JpcHRpb24ud2hlZWxfcmFkaXVzLFxuICAgICAgdHVuaW5nLFxuICAgICAgZGVzY3JpcHRpb24uaXNfZnJvbnRfd2hlZWxcbiAgICApO1xuICB9XG5cbiAgX251bV93aGVlbHMrKztcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgxICsgX251bV93aGVlbHMgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCAmICggIyBvZiBvYmplY3RzIHRvIHJlcG9ydCAqICMgb2YgdmFsdWVzIHBlciBvYmplY3QgKVxuICAgIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gIH0gZWxzZSB2ZWhpY2xlcmVwb3J0ID0gW01FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVF07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldFN0ZWVyaW5nID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uc2V0U3RlZXJpbmdWYWx1ZShkZXRhaWxzLnN0ZWVyaW5nLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QnJha2UgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5zZXRCcmFrZShkZXRhaWxzLmJyYWtlLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlFbmdpbmVGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLmFwcGx5RW5naW5lRm9yY2UoZGV0YWlscy5mb3JjZSwgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZU9iamVjdCA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfb2JqZWN0c1tkZXRhaWxzLmlkXS50eXBlID09PSAwKSB7XG4gICAgX251bV9zb2Z0Ym9keV9vYmplY3RzLS07XG4gICAgX3NvZnRib2R5X3JlcG9ydF9zaXplIC09IF9vYmplY3RzW2RldGFpbHMuaWRdLmdldF9tX25vZGVzKCkuc2l6ZSgpO1xuICAgIHdvcmxkLnJlbW92ZVNvZnRCb2R5KF9vYmplY3RzW2RldGFpbHMuaWRdKTtcbiAgfSBlbHNlIGlmIChfb2JqZWN0c1tkZXRhaWxzLmlkXS50eXBlID09PSAxKSB7XG4gICAgX251bV9yaWdpZGJvZHlfb2JqZWN0cy0tO1xuICAgIHdvcmxkLnJlbW92ZVJpZ2lkQm9keShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gICAgQW1tby5kZXN0cm95KF9tb3Rpb25fc3RhdGVzW2RldGFpbHMuaWRdKTtcbiAgfVxuXG4gIEFtbW8uZGVzdHJveShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gIGlmIChfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKSBBbW1vLmRlc3Ryb3koX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSk7XG4gIGlmIChfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSkgQW1tby5kZXN0cm95KF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKTtcblxuICBfb2JqZWN0c19hbW1vW19vYmplY3RzW2RldGFpbHMuaWRdLmEgPT09IHVuZGVmaW5lZCA/IF9vYmplY3RzW2RldGFpbHMuaWRdLmEgOiBfb2JqZWN0c1tkZXRhaWxzLmlkXS5wdHJdID0gbnVsbDtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBfbW90aW9uX3N0YXRlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG5cbiAgaWYgKF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pIF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBpZiAoX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pIF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgX251bV9vYmplY3RzLS07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnVwZGF0ZVRyYW5zZm9ybSA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3QgPSBfb2JqZWN0c1tkZXRhaWxzLmlkXTtcblxuICBpZiAoX29iamVjdC50eXBlID09PSAxKSB7XG4gICAgX29iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgaWYgKGRldGFpbHMucG9zKSB7XG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3MueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3MueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3Mueik7XG4gICAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICB9XG5cbiAgICBpZiAoZGV0YWlscy5xdWF0KSB7XG4gICAgICBfcXVhdC5zZXRYKGRldGFpbHMucXVhdC54KTtcbiAgICAgIF9xdWF0LnNldFkoZGV0YWlscy5xdWF0LnkpO1xuICAgICAgX3F1YXQuc2V0WihkZXRhaWxzLnF1YXQueik7XG4gICAgICBfcXVhdC5zZXRXKGRldGFpbHMucXVhdC53KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuICAgIH1cblxuICAgIF9vYmplY3Quc2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG4gICAgX29iamVjdC5hY3RpdmF0ZSgpO1xuICB9IGVsc2UgaWYgKF9vYmplY3QudHlwZSA9PT0gMCkge1xuICAgIC8vIF9vYmplY3QuZ2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICBpZiAoZGV0YWlscy5wb3MpIHtcbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvcy54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvcy55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvcy56KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzEpO1xuICAgIH1cblxuICAgIGlmIChkZXRhaWxzLnF1YXQpIHtcbiAgICAgIF9xdWF0LnNldFgoZGV0YWlscy5xdWF0LngpO1xuICAgICAgX3F1YXQuc2V0WShkZXRhaWxzLnF1YXQueSk7XG4gICAgICBfcXVhdC5zZXRaKGRldGFpbHMucXVhdC56KTtcbiAgICAgIF9xdWF0LnNldFcoZGV0YWlscy5xdWF0LncpO1xuICAgICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG4gICAgfVxuXG4gICAgX29iamVjdC50cmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG4gIH1cbn07XG5cbnB1YmxpY19mdW5jdGlvbnMudXBkYXRlTWFzcyA9IChkZXRhaWxzKSA9PiB7XG4gIC8vICNUT0RPOiBjaGFuZ2luZyBhIHN0YXRpYyBvYmplY3QgaW50byBkeW5hbWljIGlzIGJ1Z2d5XG4gIF9vYmplY3QgPSBfb2JqZWN0c1tkZXRhaWxzLmlkXTtcblxuICAvLyBQZXIgaHR0cDovL3d3dy5idWxsZXRwaHlzaWNzLm9yZy9CdWxsZXQvcGhwQkIzL3ZpZXd0b3BpYy5waHA/cD0mZj05JnQ9MzY2MyNwMTM4MTZcbiAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KF9vYmplY3QpO1xuXG4gIF92ZWMzXzEuc2V0WCgwKTtcbiAgX3ZlYzNfMS5zZXRZKDApO1xuICBfdmVjM18xLnNldFooMCk7XG5cbiAgX29iamVjdC5zZXRNYXNzUHJvcHMoZGV0YWlscy5tYXNzLCBfdmVjM18xKTtcbiAgd29ybGQuYWRkUmlnaWRCb2R5KF9vYmplY3QpO1xuICBfb2JqZWN0LmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Q2VudHJhbEltcHVsc2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5Q2VudHJhbEltcHVsc2UoX3ZlYzNfMSk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5SW1wdWxzZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLmltcHVsc2VfeCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLmltcHVsc2VfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLmltcHVsc2Vfeik7XG5cbiAgX3ZlYzNfMi5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzIuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18yLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUltcHVsc2UoXG4gICAgX3ZlYzNfMSxcbiAgICBfdmVjM18yXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5VG9ycXVlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMudG9ycXVlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy50b3JxdWVfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnRvcnF1ZV96KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseVRvcnF1ZShcbiAgICBfdmVjM18xXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Q2VudHJhbEZvcmNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUNlbnRyYWxGb3JjZShfdmVjM18xKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLmZvcmNlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy5mb3JjZV95KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMuZm9yY2Vfeik7XG5cbiAgX3ZlYzNfMi5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzIuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18yLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUZvcmNlKFxuICAgIF92ZWMzXzEsXG4gICAgX3ZlYzNfMlxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5vblNpbXVsYXRpb25SZXN1bWUgPSAoKSA9PiB7XG4gIGxhc3Rfc2ltdWxhdGlvbl90aW1lID0gRGF0ZS5ub3coKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QW5ndWxhclZlbG9jaXR5ID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRBbmd1bGFyVmVsb2NpdHkoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRMaW5lYXJWZWxvY2l0eSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0TGluZWFyVmVsb2NpdHkoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRBbmd1bGFyRmFjdG9yID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRBbmd1bGFyRmFjdG9yKFxuICAgICAgX3ZlYzNfMVxuICApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRMaW5lYXJGYWN0b3IgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldExpbmVhckZhY3RvcihcbiAgICBfdmVjM18xXG4gICk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldERhbXBpbmcgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXREYW1waW5nKGRldGFpbHMubGluZWFyLCBkZXRhaWxzLmFuZ3VsYXIpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRDY2RNb3Rpb25UaHJlc2hvbGQgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRDY2RNb3Rpb25UaHJlc2hvbGQoZGV0YWlscy50aHJlc2hvbGQpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKGRldGFpbHMucmFkaXVzKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkQ29uc3RyYWludCA9IChkZXRhaWxzKSA9PiB7XG4gIGxldCBjb25zdHJhaW50O1xuXG4gIHN3aXRjaCAoZGV0YWlscy50eXBlKSB7XG5cbiAgICBjYXNlICdwb2ludCc6IHtcbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFBvaW50MlBvaW50Q29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF92ZWMzXzFcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRQb2ludDJQb2ludENvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2hpbmdlJzoge1xuICAgICAgaWYgKGRldGFpbHMub2JqZWN0YiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMuYXhpcy54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMuYXhpcy55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMuYXhpcy56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRIaW5nZUNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzJcbiAgICAgICAgKTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIF92ZWMzXzMuc2V0WChkZXRhaWxzLmF4aXMueCk7XG4gICAgICAgIF92ZWMzXzMuc2V0WShkZXRhaWxzLmF4aXMueSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WihkZXRhaWxzLmF4aXMueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0SGluZ2VDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzIsXG4gICAgICAgICAgX3ZlYzNfMyxcbiAgICAgICAgICBfdmVjM18zXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc2xpZGVyJzoge1xuICAgICAgbGV0IHRyYW5zZm9ybWI7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXIoZGV0YWlscy5heGlzLngsIGRldGFpbHMuYXhpcy55LCBkZXRhaWxzLmF4aXMueik7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgaWYgKGRldGFpbHMub2JqZWN0Yikge1xuICAgICAgICB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgICByb3RhdGlvbi5zZXRFdWxlcihkZXRhaWxzLmF4aXMueCwgZGV0YWlscy5heGlzLnksIGRldGFpbHMuYXhpcy56KTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0U2xpZGVyQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cmFuc2Zvcm1iLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFNsaWRlckNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3RyYWludC50YSA9IHRyYW5zZm9ybWE7XG4gICAgICBjb25zdHJhaW50LnRiID0gdHJhbnNmb3JtYjtcblxuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWEpO1xuICAgICAgaWYgKHRyYW5zZm9ybWIgIT09IHVuZGVmaW5lZCkgQW1tby5kZXN0cm95KHRyYW5zZm9ybWIpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY29uZXR3aXN0Jzoge1xuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldElkZW50aXR5KCk7XG5cbiAgICAgIGNvbnN0IHRyYW5zZm9ybWIgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2EueiwgLWRldGFpbHMuYXhpc2EueSwgLWRldGFpbHMuYXhpc2EueCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1iLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYi56LCAtZGV0YWlscy5heGlzYi55LCAtZGV0YWlscy5heGlzYi54KTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRDb25lVHdpc3RDb25zdHJhaW50KFxuICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICB0cmFuc2Zvcm1iXG4gICAgICApO1xuXG4gICAgICBjb25zdHJhaW50LnNldExpbWl0KE1hdGguUEksIDAsIE1hdGguUEkpO1xuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdkb2YnOiB7XG4gICAgICBsZXQgdHJhbnNmb3JtYjtcblxuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldElkZW50aXR5KCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNhLnosIC1kZXRhaWxzLmF4aXNhLnksIC1kZXRhaWxzLmF4aXNhLngpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIpIHtcbiAgICAgICAgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYi56LCAtZGV0YWlscy5heGlzYi55LCAtZGV0YWlscy5heGlzYi54KTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRyYW5zZm9ybWIsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIGlmICh0cmFuc2Zvcm1iICE9PSB1bmRlZmluZWQpIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm47XG4gIH1cblxuICB3b3JsZC5hZGRDb25zdHJhaW50KGNvbnN0cmFpbnQpO1xuXG4gIGNvbnN0cmFpbnQuYSA9IF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV07XG4gIGNvbnN0cmFpbnQuYiA9IF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl07XG5cbiAgY29uc3RyYWludC5lbmFibGVGZWVkYmFjaygpO1xuICBfY29uc3RyYWludHNbZGV0YWlscy5pZF0gPSBjb25zdHJhaW50O1xuICBfbnVtX2NvbnN0cmFpbnRzKys7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMSArIF9udW1fY29uc3RyYWludHMgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCAmICggIyBvZiBvYmplY3RzIHRvIHJlcG9ydCAqICMgb2YgdmFsdWVzIHBlciBvYmplY3QgKVxuICAgIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG4gIH0gZWxzZSBjb25zdHJhaW50cmVwb3J0ID0gW01FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVF07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZUNvbnN0cmFpbnQgPSAoZGV0YWlscykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdO1xuXG4gIGlmIChjb25zdHJhaW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICB3b3JsZC5yZW1vdmVDb25zdHJhaW50KGNvbnN0cmFpbnQpO1xuICAgIF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gICAgX251bV9jb25zdHJhaW50cy0tO1xuICB9XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbnN0cmFpbnRfc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkID0gKGRldGFpbHMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXTtcbiAgaWYgKGNvbnN0cmFpbnQgIT09IHVuZGVmaW5kKSBjb25zdHJhaW50LnNldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZChkZXRhaWxzLnRocmVzaG9sZCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNpbXVsYXRlID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIGlmICh3b3JsZCkge1xuICAgIGlmIChwYXJhbXMudGltZVN0ZXAgJiYgcGFyYW1zLnRpbWVTdGVwIDwgZml4ZWRUaW1lU3RlcClcbiAgICAgIHBhcmFtcy50aW1lU3RlcCA9IGZpeGVkVGltZVN0ZXA7XG5cbiAgICBwYXJhbXMubWF4U3ViU3RlcHMgPSBwYXJhbXMubWF4U3ViU3RlcHMgfHwgTWF0aC5jZWlsKHBhcmFtcy50aW1lU3RlcCAvIGZpeGVkVGltZVN0ZXApOyAvLyBJZiBtYXhTdWJTdGVwcyBpcyBub3QgZGVmaW5lZCwga2VlcCB0aGUgc2ltdWxhdGlvbiBmdWxseSB1cCB0byBkYXRlXG5cbiAgICB3b3JsZC5zdGVwU2ltdWxhdGlvbihwYXJhbXMudGltZVN0ZXAsIHBhcmFtcy5tYXhTdWJTdGVwcywgZml4ZWRUaW1lU3RlcCk7XG5cbiAgICBpZiAoX3ZlaGljbGVzLmxlbmd0aCA+IDApIHJlcG9ydFZlaGljbGVzKCk7XG4gICAgcmVwb3J0Q29sbGlzaW9ucygpO1xuICAgIGlmIChfY29uc3RyYWludHMubGVuZ3RoID4gMCkgcmVwb3J0Q29uc3RyYWludHMoKTtcbiAgICByZXBvcnRXb3JsZCgpO1xuICAgIGlmIChfc29mdGJvZHlfZW5hYmxlZCkgcmVwb3J0V29ybGRfc29mdGJvZGllcygpO1xuICB9XG59O1xuXG4vLyBDb25zdHJhaW50IGZ1bmN0aW9uc1xucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9zZXRMaW1pdHMgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLmxvdywgcGFyYW1zLmhpZ2gsIDAsIHBhcmFtcy5iaWFzX2ZhY3RvciwgcGFyYW1zLnJlbGF4YXRpb25fZmFjdG9yKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVBbmd1bGFyTW90b3IodHJ1ZSwgcGFyYW1zLnZlbG9jaXR5LCBwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9kaXNhYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uZW5hYmxlTW90b3IoZmFsc2UpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX3NldExpbWl0cyA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0TG93ZXJMaW5MaW1pdChwYXJhbXMubGluX2xvd2VyIHx8IDApO1xuICBjb25zdHJhaW50LnNldFVwcGVyTGluTGltaXQocGFyYW1zLmxpbl91cHBlciB8fCAwKTtcblxuICBjb25zdHJhaW50LnNldExvd2VyQW5nTGltaXQocGFyYW1zLmFuZ19sb3dlciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRVcHBlckFuZ0xpbWl0KHBhcmFtcy5hbmdfdXBwZXIgfHwgMCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9zZXRSZXN0aXR1dGlvbiA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0U29mdG5lc3NMaW1MaW4ocGFyYW1zLmxpbmVhciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRTb2Z0bmVzc0xpbUFuZyhwYXJhbXMuYW5ndWxhciB8fCAwKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRUYXJnZXRMaW5Nb3RvclZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIGNvbnN0cmFpbnQuc2V0TWF4TGluTW90b3JGb3JjZShwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkTGluTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZExpbk1vdG9yKGZhbHNlKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFRhcmdldEFuZ01vdG9yVmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgY29uc3RyYWludC5zZXRNYXhBbmdNb3RvckZvcmNlKHBhcmFtcy5hY2NlbGVyYXRpb24pO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRBbmdNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZEFuZ01vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLnosIHBhcmFtcy55LCBwYXJhbXMueCk7IC8vIFpZWCBvcmRlclxufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZW5hYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LmVuYWJsZU1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldE1heE1vdG9ySW1wdWxzZShwYXJhbXMubWF4X2ltcHVsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNb3RvclRhcmdldCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3F1YXQuc2V0WChwYXJhbXMueCk7XG4gIF9xdWF0LnNldFkocGFyYW1zLnkpO1xuICBfcXVhdC5zZXRaKHBhcmFtcy56KTtcbiAgX3F1YXQuc2V0VyhwYXJhbXMudyk7XG5cbiAgY29uc3RyYWludC5zZXRNb3RvclRhcmdldChfcXVhdCk7XG5cbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZGlzYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhckxvd2VyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJMb3dlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJVcHBlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0QW5ndWxhckxvd2VyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRBbmd1bGFyVXBwZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIGNvbnN0IG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuICBtb3Rvci5zZXRfbV9lbmFibGVNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9jb25maWd1cmVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2xvTGltaXQocGFyYW1zLmxvd19hbmdsZSk7XG4gIG1vdG9yLnNldF9tX2hpTGltaXQocGFyYW1zLmhpZ2hfYW5nbGUpO1xuICBtb3Rvci5zZXRfbV90YXJnZXRWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBtb3Rvci5zZXRfbV9tYXhNb3RvckZvcmNlKHBhcmFtcy5tYXhfZm9yY2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX2Rpc2FibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2VuYWJsZU1vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5jb25zdCByZXBvcnRXb3JsZCA9ICgpID0+IHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIHdvcmxkcmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX3JpZ2lkYm9keV9vYmplY3RzICogV09STERSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAyLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICsgKE1hdGguY2VpbChfbnVtX3JpZ2lkYm9keV9vYmplY3RzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICk7XG5cbiAgICB3b3JsZHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ7XG4gIH1cblxuICB3b3JsZHJlcG9ydFsxXSA9IF9udW1fcmlnaWRib2R5X29iamVjdHM7IC8vIHJlY29yZCBob3cgbWFueSBvYmplY3RzIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIHtcbiAgICBsZXQgaSA9IDAsXG4gICAgICBpbmRleCA9IF9vYmplY3RzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvYmplY3QgPSBfb2JqZWN0c1tpbmRleF07XG5cbiAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LnR5cGUgPT09IDEpIHsgLy8gUmlnaWRCb2RpZXMuXG4gICAgICAgIC8vICNUT0RPOiB3ZSBjYW4ndCB1c2UgY2VudGVyIG9mIG1hc3MgdHJhbnNmb3JtIHdoZW4gY2VudGVyIG9mIG1hc3MgY2FuIGNoYW5nZSxcbiAgICAgICAgLy8gICAgICAgIGJ1dCBnZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKCkgc2NyZXdzIHVwIG9uIG9iamVjdHMgdGhhdCBoYXZlIGJlZW4gbW92ZWRcbiAgICAgICAgLy8gb2JqZWN0LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oIHRyYW5zZm9ybSApO1xuICAgICAgICAvLyBvYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBvYmplY3QuZ2V0Q2VudGVyT2ZNYXNzVHJhbnNmb3JtKCk7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSB0cmFuc2Zvcm0uZ2V0Um90YXRpb24oKTtcblxuICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICBjb25zdCBvZmZzZXQgPSAyICsgKGkrKykgKiBXT1JMRFJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXRdID0gb2JqZWN0LmlkO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDFdID0gb3JpZ2luLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi56KCk7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNF0gPSByb3RhdGlvbi54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDVdID0gcm90YXRpb24ueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA2XSA9IHJvdGF0aW9uLnooKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgN10gPSByb3RhdGlvbi53KCk7XG5cbiAgICAgICAgX3ZlY3RvciA9IG9iamVjdC5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA4XSA9IF92ZWN0b3IueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA5XSA9IF92ZWN0b3IueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMF0gPSBfdmVjdG9yLnooKTtcblxuICAgICAgICBfdmVjdG9yID0gb2JqZWN0LmdldEFuZ3VsYXJWZWxvY2l0eSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMV0gPSBfdmVjdG9yLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTJdID0gX3ZlY3Rvci55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEzXSA9IF92ZWN0b3IueigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgc2VuZCh3b3JsZHJlcG9ydC5idWZmZXIsIFt3b3JsZHJlcG9ydC5idWZmZXJdKTtcbiAgZWxzZSBzZW5kKHdvcmxkcmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydFdvcmxkX3NvZnRib2RpZXMgPSAoKSA9PiB7XG4gIC8vIFRPRE86IEFkZCBTVVBQT1JUVFJBTlNGRVJBQkxFLlxuXG4gIHNvZnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICArIF9udW1fc29mdGJvZHlfb2JqZWN0cyAqIDJcbiAgICArIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSAqIDZcbiAgKTtcblxuICBzb2Z0cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUO1xuICBzb2Z0cmVwb3J0WzFdID0gX251bV9zb2Z0Ym9keV9vYmplY3RzOyAvLyByZWNvcmQgaG93IG1hbnkgb2JqZWN0cyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICB7XG4gICAgbGV0IG9mZnNldCA9IDIsXG4gICAgICBpbmRleCA9IF9vYmplY3RzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvYmplY3QgPSBfb2JqZWN0c1tpbmRleF07XG5cbiAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LnR5cGUgPT09IDApIHsgLy8gU29mdEJvZGllcy5cblxuICAgICAgICBzb2Z0cmVwb3J0W29mZnNldF0gPSBvYmplY3QuaWQ7XG5cbiAgICAgICAgY29uc3Qgb2Zmc2V0VmVydCA9IG9mZnNldCArIDI7XG5cbiAgICAgICAgaWYgKG9iamVjdC5yb3BlID09PSB0cnVlKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZXMgPSBvYmplY3QuZ2V0X21fbm9kZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gbm9kZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5hdChpKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQgPSBub2RlLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IG9mZiA9IG9mZnNldFZlcnQgKyBpICogMztcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydC54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydC55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDJdID0gdmVydC56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiAzICsgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmplY3QuY2xvdGgpIHtcbiAgICAgICAgICBjb25zdCBub2RlcyA9IG9iamVjdC5nZXRfbV9ub2RlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBub2Rlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzLmF0KGkpO1xuICAgICAgICAgICAgY29uc3QgdmVydCA9IG5vZGUuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gbm9kZS5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDY7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDNdID0gbm9ybWFsLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNF0gPSBub3JtYWwueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA1XSA9IG5vcm1hbC56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiA2ICsgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb25zdCBmYWNlcyA9IG9iamVjdC5nZXRfbV9mYWNlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBmYWNlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZmFjZSA9IGZhY2VzLmF0KGkpO1xuXG4gICAgICAgICAgICBjb25zdCBub2RlMSA9IGZhY2UuZ2V0X21fbigwKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUyID0gZmFjZS5nZXRfbV9uKDEpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZTMgPSBmYWNlLmdldF9tX24oMik7XG5cbiAgICAgICAgICAgIGNvbnN0IHZlcnQxID0gbm9kZTEuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3QgdmVydDIgPSBub2RlMi5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0MyA9IG5vZGUzLmdldF9tX3goKTtcblxuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMSA9IG5vZGUxLmdldF9tX24oKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDIgPSBub2RlMi5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwzID0gbm9kZTMuZ2V0X21fbigpO1xuXG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDE4O1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0MS54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydDEueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQxLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAzXSA9IG5vcm1hbDEueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA0XSA9IG5vcm1hbDEueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA1XSA9IG5vcm1hbDEueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDZdID0gdmVydDIueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA3XSA9IHZlcnQyLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgOF0gPSB2ZXJ0Mi56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgOV0gPSBub3JtYWwyLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTBdID0gbm9ybWFsMi55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDExXSA9IG5vcm1hbDIueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEyXSA9IHZlcnQzLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTNdID0gdmVydDMueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNF0gPSB2ZXJ0My56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTVdID0gbm9ybWFsMy54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE2XSA9IG5vcm1hbDMueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxN10gPSBub3JtYWwzLnooKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvZmZzZXQgKz0gc2l6ZSAqIDE4ICsgMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgc2VuZChzb2Z0cmVwb3J0LmJ1ZmZlciwgW3NvZnRyZXBvcnQuYnVmZmVyXSk7XG4gIC8vIGVsc2Ugc2VuZChzb2Z0cmVwb3J0KTtcbiAgc2VuZChzb2Z0cmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydENvbGxpc2lvbnMgPSAoKSA9PiB7XG4gIGNvbnN0IGRwID0gd29ybGQuZ2V0RGlzcGF0Y2hlcigpLFxuICAgIG51bSA9IGRwLmdldE51bU1hbmlmb2xkcygpO1xuICAgIC8vIF9jb2xsaWRlZCA9IGZhbHNlO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmIChjb2xsaXNpb25yZXBvcnQubGVuZ3RoIDwgMiArIG51bSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArIChNYXRoLmNlaWwoX251bV9vYmplY3RzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDtcbiAgICB9XG4gIH1cblxuICBjb2xsaXNpb25yZXBvcnRbMV0gPSAwOyAvLyBob3cgbWFueSBjb2xsaXNpb25zIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICBjb25zdCBtYW5pZm9sZCA9IGRwLmdldE1hbmlmb2xkQnlJbmRleEludGVybmFsKGkpLFxuICAgICAgbnVtX2NvbnRhY3RzID0gbWFuaWZvbGQuZ2V0TnVtQ29udGFjdHMoKTtcblxuICAgIGlmIChudW1fY29udGFjdHMgPT09IDApIGNvbnRpbnVlO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBudW1fY29udGFjdHM7IGorKykge1xuICAgICAgY29uc3QgcHQgPSBtYW5pZm9sZC5nZXRDb250YWN0UG9pbnQoaik7XG5cbiAgICAgIC8vIGlmICggcHQuZ2V0RGlzdGFuY2UoKSA8IDAgKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgKGNvbGxpc2lvbnJlcG9ydFsxXSsrKSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXRdID0gX29iamVjdHNfYW1tb1ttYW5pZm9sZC5nZXRCb2R5MCgpLnB0cl07XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgMV0gPSBfb2JqZWN0c19hbW1vW21hbmlmb2xkLmdldEJvZHkxKCkucHRyXTtcblxuICAgICAgX3ZlY3RvciA9IHB0LmdldF9tX25vcm1hbFdvcmxkT25CKCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgMl0gPSBfdmVjdG9yLngoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAzXSA9IF92ZWN0b3IueSgpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDRdID0gX3ZlY3Rvci56KCk7XG4gICAgICBicmVhaztcbiAgICAgIC8vIH1cbiAgICAgIC8vIHNlbmQoX29iamVjdHNfYW1tbyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSBzZW5kKGNvbGxpc2lvbnJlcG9ydC5idWZmZXIsIFtjb2xsaXNpb25yZXBvcnQuYnVmZmVyXSk7XG4gIGVsc2Ugc2VuZChjb2xsaXNpb25yZXBvcnQpO1xufTtcblxuY29uc3QgcmVwb3J0VmVoaWNsZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmICh2ZWhpY2xlcmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX3doZWVscyAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICsgKE1hdGguY2VpbChfbnVtX3doZWVscyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAge1xuICAgIGxldCBpID0gMCxcbiAgICAgIGogPSAwLFxuICAgICAgaW5kZXggPSBfdmVoaWNsZXMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGlmIChfdmVoaWNsZXNbaW5kZXhdKSB7XG4gICAgICAgIGNvbnN0IHZlaGljbGUgPSBfdmVoaWNsZXNbaW5kZXhdO1xuXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCB2ZWhpY2xlLmdldE51bVdoZWVscygpOyBqKyspIHtcbiAgICAgICAgICAvLyB2ZWhpY2xlLnVwZGF0ZVdoZWVsVHJhbnNmb3JtKCBqLCB0cnVlICk7XG4gICAgICAgICAgLy8gdHJhbnNmb3JtID0gdmVoaWNsZS5nZXRXaGVlbFRyYW5zZm9ybVdTKCBqICk7XG4gICAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdmVoaWNsZS5nZXRXaGVlbEluZm8oaikuZ2V0X21fd29ybGRUcmFuc2Zvcm0oKTtcblxuICAgICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcbiAgICAgICAgICBjb25zdCByb3RhdGlvbiA9IHRyYW5zZm9ybS5nZXRSb3RhdGlvbigpO1xuXG4gICAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSAxICsgKGkrKykgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXRdID0gaW5kZXg7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAxXSA9IGo7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLngoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnkoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDRdID0gb3JpZ2luLnooKTtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNV0gPSByb3RhdGlvbi54KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA2XSA9IHJvdGF0aW9uLnkoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDddID0gcm90YXRpb24ueigpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgOF0gPSByb3RhdGlvbi53KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUgJiYgaiAhPT0gMCkgc2VuZCh2ZWhpY2xlcmVwb3J0LmJ1ZmZlciwgW3ZlaGljbGVyZXBvcnQuYnVmZmVyXSk7XG4gICAgZWxzZSBpZiAoaiAhPT0gMCkgc2VuZCh2ZWhpY2xlcmVwb3J0KTtcbiAgfVxufTtcblxuY29uc3QgcmVwb3J0Q29uc3RyYWludHMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmIChjb25zdHJhaW50cmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX2NvbnN0cmFpbnRzICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgKyAoTWF0aC5jZWlsKF9udW1fY29uc3RyYWludHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIHtcbiAgICBsZXQgb2Zmc2V0ID0gMCxcbiAgICAgIGkgPSAwLFxuICAgICAgaW5kZXggPSBfY29uc3RyYWludHMubGVuZ2h0O1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGlmIChfY29uc3RyYWludHNbaW5kZXhdKSB7XG4gICAgICAgIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbaW5kZXhdO1xuICAgICAgICBjb25zdCBvZmZzZXRfYm9keSA9IGNvbnN0cmFpbnQuYTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gY29uc3RyYWludC50YTtcbiAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuXG4gICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgIG9mZnNldCA9IDEgKyAoaSsrKSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXRdID0gaW5kZXg7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBvZmZzZXRfYm9keS5pZDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi54O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnk7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgNF0gPSBvcmlnaW4uejtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyA1XSA9IGNvbnN0cmFpbnQuZ2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIGkgIT09IDApIHNlbmQoY29uc3RyYWludHJlcG9ydC5idWZmZXIsIFtjb25zdHJhaW50cmVwb3J0LmJ1ZmZlcl0pO1xuICAgIGVsc2UgaWYgKGkgIT09IDApIHNlbmQoY29uc3RyYWludHJlcG9ydCk7XG4gIH1cbn07XG5cbnNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIGlmIChldmVudC5kYXRhIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgLy8gdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgIHN3aXRjaCAoZXZlbnQuZGF0YVswXSkge1xuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOiB7XG4gICAgICAgIHdvcmxkcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOiB7XG4gICAgICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6IHtcbiAgICAgICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6IHtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICB9XG5cbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAoZXZlbnQuZGF0YS5jbWQgJiYgcHVibGljX2Z1bmN0aW9uc1tldmVudC5kYXRhLmNtZF0pIHB1YmxpY19mdW5jdGlvbnNbZXZlbnQuZGF0YS5jbWRdKGV2ZW50LmRhdGEucGFyYW1zKTtcbn07XG5cbnNlbGYucmVjZWl2ZSA9IHNlbGYub25tZXNzYWdlO1xuXG5cblxuXG59KTsiLCJpbXBvcnQgV29ybGRNb2R1bGVCYXNlIGZyb20gJy4vY29yZS9Xb3JsZE1vZHVsZUJhc2UnO1xuXG5pbXBvcnQge1xuICBhZGRPYmplY3RDaGlsZHJlbixcbiAgTUVTU0FHRV9UWVBFUyxcbiAgdGVtcDFWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFXG59IGZyb20gJy4uL2FwaSc7XG5cbmltcG9ydCBQaHlzaWNzV29ya2VyIGZyb20gJ3dvcmtlciEuLi93b3JrZXIuanMnO1xuXG5leHBvcnQgY2xhc3MgV29ybGRNb2R1bGUgZXh0ZW5kcyBXb3JsZE1vZHVsZUJhc2Uge1xuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG5cbiAgICB0aGlzLndvcmtlciA9IG5ldyBQaHlzaWNzV29ya2VyKCk7XG4gICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZSA9IHRoaXMud29ya2VyLndlYmtpdFBvc3RNZXNzYWdlIHx8IHRoaXMud29ya2VyLnBvc3RNZXNzYWdlO1xuXG4gICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgIHRoaXMubG9hZGVyID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgLy8gaWYgKG9wdGlvbnMud2FzbSkge1xuICAgICAgLy8gICBmZXRjaChvcHRpb25zLndhc20pXG4gICAgICAvLyAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSlcbiAgICAgIC8vICAgICAudGhlbihidWZmZXIgPT4ge1xuICAgICAgLy8gICAgICAgb3B0aW9ucy53YXNtQnVmZmVyID0gYnVmZmVyO1xuICAgICAgLy9cbiAgICAgIC8vICAgICAgIHRoaXMuZXhlY3V0ZSgnaW5pdCcsIG9wdGlvbnMpO1xuICAgICAgLy8gICAgICAgcmVzb2x2ZSgpO1xuICAgICAgLy8gICAgIH0pO1xuICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdpbml0Jywgb3B0aW9ucyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIC8vIH1cbiAgICB9KTtcblxuICAgIHRoaXMubG9hZGVyLnRoZW4oKCkgPT4ge3RoaXMuaXNMb2FkZWQgPSB0cnVlfSk7XG5cbiAgICAvLyBUZXN0IFNVUFBPUlRfVFJBTlNGRVJBQkxFXG5cbiAgICBjb25zdCBhYiA9IG5ldyBBcnJheUJ1ZmZlcigxKTtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGFiLCBbYWJdKTtcbiAgICB0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFID0gKGFiLmJ5dGVMZW5ndGggPT09IDApO1xuXG4gICAgdGhpcy5zZXR1cCgpO1xuICB9XG5cbiAgc2VuZCguLi5hcmdzKSB7XG4gICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZSguLi5hcmdzKTtcbiAgfVxuXG4gIHJlY2VpdmUoY2FsbGJhY2spIHtcbiAgICB0aGlzLndvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgY2FsbGJhY2spO1xuICB9XG59XG4iLCJpbXBvcnQge1ZlY3RvcjMsIFF1YXRlcm5pb259IGZyb20gJ3RocmVlJztcblxuY29uc3QgcHJvcGVydGllcyA9IHtcbiAgcG9zaXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQodmVjdG9yMykge1xuICAgICAgY29uc3QgcG9zID0gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzO1xuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhwb3MsIHtcbiAgICAgICAgeDoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl94O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeCkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ggPSB4O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgeToge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl95O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeSkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3kgPSB5O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgejoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl96O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeikge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ogPSB6O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHNjb3BlLl9fZGlydHlQb3NpdGlvbiA9IHRydWU7XG5cbiAgICAgIHBvcy5jb3B5KHZlY3RvcjMpO1xuICAgIH1cbiAgfSxcblxuICBxdWF0ZXJuaW9uOiB7XG4gICAgZ2V0KCkge1xuICAgICAgdGhpcy5fX2Nfcm90ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLm5hdGl2ZS5xdWF0ZXJuaW9uO1xuICAgIH0sXG5cbiAgICBzZXQocXVhdGVybmlvbikge1xuICAgICAgY29uc3QgcXVhdCA9IHRoaXMuX25hdGl2ZS5xdWF0ZXJuaW9uLFxuICAgICAgICBuYXRpdmUgPSB0aGlzLl9uYXRpdmU7XG5cbiAgICAgIHF1YXQuY29weShxdWF0ZXJuaW9uKTtcblxuICAgICAgcXVhdC5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9fY19yb3QpIHtcbiAgICAgICAgICBpZiAobmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5fX2Nfcm90ID0gZmFsc2U7XG4gICAgICAgICAgICBuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgcm90YXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMuX25hdGl2ZS5yb3RhdGlvbjtcbiAgICB9LFxuXG4gICAgc2V0KGV1bGVyKSB7XG4gICAgICBjb25zdCByb3QgPSB0aGlzLl9uYXRpdmUucm90YXRpb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoZXVsZXIpKTtcblxuICAgICAgcm90Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIHRoaXMucXVhdGVybmlvbi5jb3B5KG5ldyBRdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHJvdCkpO1xuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcFBoeXNpY3NQcm90b3R5cGUoc2NvcGUpIHtcbiAgZm9yIChsZXQga2V5IGluIHByb3BlcnRpZXMpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NvcGUsIGtleSwge1xuICAgICAgZ2V0OiBwcm9wZXJ0aWVzW2tleV0uZ2V0LmJpbmQoc2NvcGUpLFxuICAgICAgc2V0OiBwcm9wZXJ0aWVzW2tleV0uc2V0LmJpbmQoc2NvcGUpLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uQ29weShzb3VyY2UpIHtcbiAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG5cbiAgY29uc3QgcGh5c2ljcyA9IHRoaXMudXNlKCdwaHlzaWNzJyk7XG4gIGNvbnN0IHNvdXJjZVBoeXNpY3MgPSBzb3VyY2UudXNlKCdwaHlzaWNzJyk7XG5cbiAgdGhpcy5tYW5hZ2VyLm1vZHVsZXMucGh5c2ljcyA9IHBoeXNpY3MuY2xvbmUodGhpcy5tYW5hZ2VyKTtcblxuICBwaHlzaWNzLmRhdGEgPSB7Li4uc291cmNlUGh5c2ljcy5kYXRhfTtcbiAgcGh5c2ljcy5kYXRhLmlzU29mdEJvZHlSZXNldCA9IGZhbHNlO1xuICBpZiAocGh5c2ljcy5kYXRhLmlzU29mdGJvZHkpIHBoeXNpY3MuZGF0YS5pc1NvZnRCb2R5UmVzZXQgPSBmYWxzZTtcblxuICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5jbG9uZSgpO1xuICB0aGlzLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbi5jbG9uZSgpO1xuICB0aGlzLnF1YXRlcm5pb24gPSB0aGlzLnF1YXRlcm5pb24uY2xvbmUoKTtcblxuICByZXR1cm4gc291cmNlO1xufVxuXG5mdW5jdGlvbiBvbldyYXAoKSB7XG4gIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmNsb25lKCk7XG4gIHRoaXMucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uLmNsb25lKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IHRoaXMucXVhdGVybmlvbi5jbG9uZSgpO1xufVxuXG5jbGFzcyBBUEkge1xuICBhcHBseUNlbnRyYWxJbXB1bHNlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUNlbnRyYWxJbXB1bHNlJywge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZvcmNlLngsIHk6IGZvcmNlLnksIHo6IGZvcmNlLnp9KTtcbiAgfVxuXG4gIGFwcGx5SW1wdWxzZShmb3JjZSwgb2Zmc2V0KSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUltcHVsc2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgaW1wdWxzZV94OiBmb3JjZS54LFxuICAgICAgaW1wdWxzZV95OiBmb3JjZS55LFxuICAgICAgaW1wdWxzZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseVRvcnF1ZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlUb3JxdWUnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgdG9ycXVlX3g6IGZvcmNlLngsXG4gICAgICB0b3JxdWVfeTogZm9yY2UueSxcbiAgICAgIHRvcnF1ZV96OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUNlbnRyYWxGb3JjZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlDZW50cmFsRm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgeDogZm9yY2UueCxcbiAgICAgIHk6IGZvcmNlLnksXG4gICAgICB6OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUZvcmNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Rm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgZm9yY2VfeDogZm9yY2UueCxcbiAgICAgIGZvcmNlX3k6IGZvcmNlLnksXG4gICAgICBmb3JjZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBnZXRBbmd1bGFyVmVsb2NpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5hbmd1bGFyVmVsb2NpdHk7XG4gIH1cblxuICBzZXRBbmd1bGFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0QW5ndWxhclZlbG9jaXR5JyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiB2ZWxvY2l0eS54LCB5OiB2ZWxvY2l0eS55LCB6OiB2ZWxvY2l0eS56fVxuICAgICk7XG4gIH1cblxuICBnZXRMaW5lYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmxpbmVhclZlbG9jaXR5O1xuICB9XG5cbiAgc2V0TGluZWFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyVmVsb2NpdHknLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJGYWN0b3IoZmFjdG9yKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldEFuZ3VsYXJGYWN0b3InLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldExpbmVhckZhY3RvcihmYWN0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyRmFjdG9yJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiBmYWN0b3IueCwgeTogZmFjdG9yLnksIHo6IGZhY3Rvci56fVxuICAgICk7XG4gIH1cblxuICBzZXREYW1waW5nKGxpbmVhciwgYW5ndWxhcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXREYW1waW5nJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCBsaW5lYXIsIGFuZ3VsYXJ9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZE1vdGlvblRocmVzaG9sZCh0aHJlc2hvbGQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0Q2NkTW90aW9uVGhyZXNob2xkJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB0aHJlc2hvbGR9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKHJhZGl1cykge1xuICAgIHRoaXMuZXhlY3V0ZSgnc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMnLCB7aWQ6IHRoaXMuZGF0YS5pZCwgcmFkaXVzfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgZXh0ZW5kcyBBUEkge1xuICBzdGF0aWMgcmlnaWRib2R5ID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgbWFzczogMTAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMFxuICB9KTtcblxuICBzdGF0aWMgc29mdGJvZHkgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICBwcmVzc3VyZTogMTAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBrbHN0OiAwLjksXG4gICAga3ZzdDogMC45LFxuICAgIGthc3Q6IDAuOSxcbiAgICBwaXRlcmF0aW9uczogMSxcbiAgICB2aXRlcmF0aW9uczogMCxcbiAgICBkaXRlcmF0aW9uczogMCxcbiAgICBjaXRlcmF0aW9uczogNCxcbiAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgIHJpZ2lkSGFyZG5lc3M6IDEsXG4gICAgaXNTb2Z0Ym9keTogdHJ1ZSxcbiAgICBpc1NvZnRCb2R5UmVzZXQ6IGZhbHNlXG4gIH0pO1xuXG4gIHN0YXRpYyByb3BlID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBrbHN0OiAwLjksXG4gICAga3ZzdDogMC45LFxuICAgIGthc3Q6IDAuOSxcbiAgICBwaXRlcmF0aW9uczogMSxcbiAgICB2aXRlcmF0aW9uczogMCxcbiAgICBkaXRlcmF0aW9uczogMCxcbiAgICBjaXRlcmF0aW9uczogNCxcbiAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgIHJpZ2lkSGFyZG5lc3M6IDEsXG4gICAgaXNTb2Z0Ym9keTogdHJ1ZVxuICB9KTtcblxuICBzdGF0aWMgY2xvdGggPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgZGFtcGluZzogMCxcbiAgICBtYXJnaW46IDAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMVxuICB9KTtcblxuICBjb25zdHJ1Y3RvcihkZWZhdWx0cywgZGF0YSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbihkZWZhdWx0cywgZGF0YSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgbWFuYWdlci5kZWZpbmUoJ3BoeXNpY3MnKTtcblxuICAgIHRoaXMuZXhlY3V0ZSA9ICguLi5kYXRhKSA9PiB7XG4gICAgICByZXR1cm4gbWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpXG4gICAgICA/IG1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKC4uLmRhdGEpXG4gICAgICA6ICgpID0+IHt9O1xuICAgIH07XG4gIH1cblxuICB1cGRhdGVEYXRhKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5icmlkZ2UuZ2VvbWV0cnkgPSBmdW5jdGlvbiAoZ2VvbWV0cnksIG1vZHVsZSkge1xuICAgICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuIGdlb21ldHJ5O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjayhnZW9tZXRyeSwgbW9kdWxlKTtcbiAgICAgIHJldHVybiByZXN1bHQgPyByZXN1bHQgOiBnZW9tZXRyeTtcbiAgICB9XG4gIH1cblxuICBjbG9uZShtYW5hZ2VyKSB7XG4gICAgY29uc3QgY2xvbmUgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpO1xuICAgIGNsb25lLmRhdGEgPSB7Li4udGhpcy5kYXRhfTtcbiAgICBjbG9uZS5icmlkZ2UuZ2VvbWV0cnkgPSB0aGlzLmJyaWRnZS5nZW9tZXRyeTtcbiAgICB0aGlzLm1hbmFnZXIuYXBwbHkoY2xvbmUsIFttYW5hZ2VyXSk7XG5cbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQm94TW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdib3gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEuZGVwdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb3VuZE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29tcG91bmQnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuLy8gVE9ETzogVGVzdCBDYXBzdWxlTW9kdWxlIGluIGFjdGlvbi5cbmV4cG9ydCBjbGFzcyBDYXBzdWxlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjYXBzdWxlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uY2F2ZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29uY2F2ZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgZGF0YS5kYXRhID0gdGhpcy5nZW9tZXRyeVByb2Nlc3NvcihnZW9tZXRyeSk7XG4gICAgfSk7XG4gIH1cblxuICBnZW9tZXRyeVByb2Nlc3NvcihnZW9tZXRyeSkge1xuICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgY29uc3QgZGF0YSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgP1xuICAgICAgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6XG4gICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDkpO1xuXG4gICAgaWYgKCFnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBjb25zdCB2ZXJ0aWNlcyA9IGdlb21ldHJ5LnZlcnRpY2VzO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgICBjb25zdCB2QSA9IHZlcnRpY2VzW2ZhY2UuYV07XG4gICAgICAgIGNvbnN0IHZCID0gdmVydGljZXNbZmFjZS5iXTtcbiAgICAgICAgY29uc3QgdkMgPSB2ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgZGF0YVtpOV0gPSB2QS54O1xuICAgICAgICBkYXRhW2k5ICsgMV0gPSB2QS55O1xuICAgICAgICBkYXRhW2k5ICsgMl0gPSB2QS56O1xuXG4gICAgICAgIGRhdGFbaTkgKyAzXSA9IHZCLng7XG4gICAgICAgIGRhdGFbaTkgKyA0XSA9IHZCLnk7XG4gICAgICAgIGRhdGFbaTkgKyA1XSA9IHZCLno7XG5cbiAgICAgICAgZGF0YVtpOSArIDZdID0gdkMueDtcbiAgICAgICAgZGF0YVtpOSArIDddID0gdkMueTtcbiAgICAgICAgZGF0YVtpOSArIDhdID0gdkMuejtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfTtcbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NvbmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLnJhZGl1cyA9IChnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54KSAvIDI7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnl9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbnZleE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29udmV4JyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcbiAgICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkgZ2VvbWV0cnkuX2J1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCkuZnJvbUdlb21ldHJ5KGdlb21ldHJ5KTtcblxuICAgICAgZGF0YS5kYXRhID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/XG4gICAgICAgIGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOlxuICAgICAgICBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ3lsaW5kZXJNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2N5bGluZGVyJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuaW1wb3J0IHtWZWN0b3IzLCBWZWN0b3IyLCBCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgY2xhc3MgSGVpZ2h0ZmllbGRNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2hlaWdodGZpZWxkJyxcbiAgICAgIHNpemU6IG5ldyBWZWN0b3IyKDEsIDEpLFxuICAgICAgYXV0b0FsaWduOiBmYWxzZSxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBjb25zdCB7eDogeGRpdiwgeTogeWRpdn0gPSBkYXRhLnNpemU7XG4gICAgICBjb25zdCB2ZXJ0cyA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgPyBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDogZ2VvbWV0cnkudmVydGljZXM7XG4gICAgICBsZXQgc2l6ZSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgPyB2ZXJ0cy5sZW5ndGggLyAzIDogdmVydHMubGVuZ3RoO1xuXG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgY29uc3QgeHNpemUgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgY29uc3QgeXNpemUgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuXG4gICAgICBkYXRhLnhwdHMgPSAodHlwZW9mIHhkaXYgPT09ICd1bmRlZmluZWQnKSA/IE1hdGguc3FydChzaXplKSA6IHhkaXYgKyAxO1xuICAgICAgZGF0YS55cHRzID0gKHR5cGVvZiB5ZGl2ID09PSAndW5kZWZpbmVkJykgPyBNYXRoLnNxcnQoc2l6ZSkgOiB5ZGl2ICsgMTtcblxuICAgICAgLy8gbm90ZSAtIHRoaXMgYXNzdW1lcyBvdXIgcGxhbmUgZ2VvbWV0cnkgaXMgc3F1YXJlLCB1bmxlc3Mgd2UgcGFzcyBpbiBzcGVjaWZpYyB4ZGl2IGFuZCB5ZGl2XG4gICAgICBkYXRhLmFic01heEhlaWdodCA9IE1hdGgubWF4KGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55LCBNYXRoLmFicyhnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueSkpO1xuXG4gICAgICBjb25zdCBwb2ludHMgPSBuZXcgRmxvYXQzMkFycmF5KHNpemUpLFxuICAgICAgICB4cHRzID0gZGF0YS54cHRzLFxuICAgICAgICB5cHRzID0gZGF0YS55cHRzO1xuXG4gICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgIGNvbnN0IHZOdW0gPSBzaXplICUgeHB0cyArICgoeXB0cyAtIE1hdGgucm91bmQoKHNpemUgLyB4cHRzKSAtICgoc2l6ZSAlIHhwdHMpIC8geHB0cykpIC0gMSkgKiB5cHRzKTtcblxuICAgICAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkgcG9pbnRzW3NpemVdID0gdmVydHNbdk51bSAqIDMgKyAxXTtcbiAgICAgICAgZWxzZSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtXS55O1xuICAgICAgfVxuXG4gICAgICBkYXRhLnBvaW50cyA9IHBvaW50cztcblxuICAgICAgZGF0YS5zY2FsZS5tdWx0aXBseShcbiAgICAgICAgbmV3IFZlY3RvcjMoeHNpemUgLyAoeHB0cyAtIDEpLCAxLCB5c2l6ZSAvICh5cHRzIC0gMSkpXG4gICAgICApO1xuXG4gICAgICBpZiAoZGF0YS5hdXRvQWxpZ24pIGdlb21ldHJ5LnRyYW5zbGF0ZSh4c2l6ZSAvIC0yLCAwLCB5c2l6ZSAvIC0yKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgUGxhbmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3BsYW5lJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLm5vcm1hbCA9IGdlb21ldHJ5LmZhY2VzWzBdLm5vcm1hbC5jbG9uZSgpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBTcGhlcmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NwaGVyZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ1NwaGVyZSkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICBkYXRhLnJhZGl1cyA9IGdlb21ldHJ5LmJvdW5kaW5nU3BoZXJlLnJhZGl1cztcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBTb2Z0Ym9keU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc29mdFRyaW1lc2gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5zb2Z0Ym9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgY29uc3QgaWR4R2VvbWV0cnkgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5XG4gICAgICAgID8gZ2VvbWV0cnlcbiAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgIGdlb21ldHJ5Lm1lcmdlVmVydGljZXMoKTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuc2V0SW5kZXgoXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgKGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAxXG4gICAgICAgICAgICApLmNvcHlJbmRpY2VzQXJyYXkoZ2VvbWV0cnkuZmFjZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmZXJHZW9tZXRyeTtcbiAgICAgICAgfSkoKTtcblxuICAgICAgZGF0YS5hVmVydGljZXMgPSBpZHhHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuICAgICAgZGF0YS5hSW5kaWNlcyA9IGlkeEdlb21ldHJ5LmluZGV4LmFycmF5O1xuXG4gICAgICByZXR1cm4gbmV3IEJ1ZmZlckdlb21ldHJ5KCkuZnJvbUdlb21ldHJ5KGdlb21ldHJ5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGV9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENsb3RoTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzb2Z0Q2xvdGhNZXNoJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUuY2xvdGgoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IGdlb21QYXJhbXMgPSBnZW9tZXRyeS5wYXJhbWV0ZXJzO1xuXG4gICAgICBjb25zdCBnZW9tID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeVxuICAgICAgICA/IGdlb21ldHJ5XG4gICAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgIGdlb21ldHJ5Lm1lcmdlVmVydGljZXMoKTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3QgZmFjZXMgPSBnZW9tZXRyeS5mYWNlcywgZmFjZXNMZW5ndGggPSBmYWNlcy5sZW5ndGg7XG4gICAgICAgICAgY29uc3Qgbm9ybWFsc0FycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmYWNlc0xlbmd0aCAqIDMpO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmYWNlc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpMyA9IGkgKiAzO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gZmFjZXNbaV0ubm9ybWFsIHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpM10gPSBub3JtYWwueDtcbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpMyArIDFdID0gbm9ybWFsLnk7XG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTMgKyAyXSA9IG5vcm1hbC56O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdub3JtYWwnLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbm9ybWFsc0FycmF5LFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IChmYWNlc0xlbmd0aCAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGZhY2VzTGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShmYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBjb25zdCB2ZXJ0cyA9IGdlb20uYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgaWYgKCFnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMpIGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyA9IDE7XG4gICAgICBpZiAoIWdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMpIGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgPSAxO1xuXG4gICAgICBjb25zdCBpZHgwMCA9IDA7XG4gICAgICBjb25zdCBpZHgwMSA9IGdlb21QYXJhbXMud2lkdGhTZWdtZW50cztcbiAgICAgIGNvbnN0IGlkeDEwID0gKGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgKyAxKSAqIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKSAtIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKTtcbiAgICAgIGNvbnN0IGlkeDExID0gdmVydHMubGVuZ3RoIC8gMyAtIDE7XG5cbiAgICAgIGRhdGEuY29ybmVycyA9IFtcbiAgICAgICAgdmVydHNbaWR4MDEgKiAzXSwgdmVydHNbaWR4MDEgKiAzICsgMV0sIHZlcnRzW2lkeDAxICogMyArIDJdLCAvLyAgIOKVl1xuICAgICAgICB2ZXJ0c1tpZHgwMCAqIDNdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAxXSwgdmVydHNbaWR4MDAgKiAzICsgMl0sIC8vIOKVlFxuICAgICAgICB2ZXJ0c1tpZHgxMSAqIDNdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAxXSwgdmVydHNbaWR4MTEgKiAzICsgMl0sIC8vICAgICAgIOKVnVxuICAgICAgICB2ZXJ0c1tpZHgxMCAqIDNdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAxXSwgdmVydHNbaWR4MTAgKiAzICsgMl0sIC8vICAgICDilZpcbiAgICAgIF07XG5cbiAgICAgIGRhdGEuc2VnbWVudHMgPSBbZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSwgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDFdO1xuXG4gICAgICByZXR1cm4gZ2VvbTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUsIFZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFJvcGVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NvZnRSb3BlTWVzaCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJvcGUoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgICBnZW9tZXRyeSA9ICgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYnVmZiA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZi5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmY7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxlbmd0aCA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkubGVuZ3RoIC8gMztcbiAgICAgIGNvbnN0IHZlcnQgPSBuID0+IG5ldyBWZWN0b3IzKCkuZnJvbUFycmF5KGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXksIG4qMyk7XG5cbiAgICAgIGNvbnN0IHYxID0gdmVydCgwKTtcbiAgICAgIGNvbnN0IHYyID0gdmVydChsZW5ndGggLSAxKTtcblxuICAgICAgZGF0YS5kYXRhID0gW1xuICAgICAgICB2MS54LCB2MS55LCB2MS56LFxuICAgICAgICB2Mi54LCB2Mi55LCB2Mi56LFxuICAgICAgICBsZW5ndGhcbiAgICAgIF07XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0xvb3B9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7XG4gIE9iamVjdDNELFxuICBRdWF0ZXJuaW9uLFxuICBWZWN0b3IzLFxuICBFdWxlclxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFBJXzIgPSBNYXRoLlBJIC8gMjtcblxuLy8gVE9ETzogRml4IERPTVxuZnVuY3Rpb24gRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihjYW1lcmEsIG1lc2gsIHBhcmFtcykge1xuICBjb25zdCB2ZWxvY2l0eUZhY3RvciA9IDE7XG4gIGxldCBydW5WZWxvY2l0eSA9IDAuMjU7XG5cbiAgbWVzaC51c2UoJ3BoeXNpY3MnKS5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgLyogSW5pdCAqL1xuICBjb25zdCBwbGF5ZXIgPSBtZXNoLFxuICAgIHBpdGNoT2JqZWN0ID0gbmV3IE9iamVjdDNEKCk7XG5cbiAgcGl0Y2hPYmplY3QuYWRkKGNhbWVyYS5uYXRpdmUpO1xuXG4gIGNvbnN0IHlhd09iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHlhd09iamVjdC5wb3NpdGlvbi55ID0gcGFyYW1zLnlwb3M7IC8vIGV5ZXMgYXJlIDIgbWV0ZXJzIGFib3ZlIHRoZSBncm91bmRcbiAgeWF3T2JqZWN0LmFkZChwaXRjaE9iamVjdCk7XG5cbiAgY29uc3QgcXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbiAgbGV0IGNhbkp1bXAgPSBmYWxzZSxcbiAgICAvLyBNb3Zlcy5cbiAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVMZWZ0ID0gZmFsc2UsXG4gICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG5cbiAgcGxheWVyLm9uKCdjb2xsaXNpb24nLCAob3RoZXJPYmplY3QsIHYsIHIsIGNvbnRhY3ROb3JtYWwpID0+IHtcbiAgICBjb25zb2xlLmxvZyhjb250YWN0Tm9ybWFsLnkpO1xuICAgIGlmIChjb250YWN0Tm9ybWFsLnkgPCAwLjUpIC8vIFVzZSBhIFwiZ29vZFwiIHRocmVzaG9sZCB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDEgaGVyZSFcbiAgICAgIGNhbkp1bXAgPSB0cnVlO1xuICB9KTtcblxuICBjb25zdCBvbk1vdXNlTW92ZSA9IGV2ZW50ID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgY29uc3QgbW92ZW1lbnRYID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRYIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRYID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFgoKSA6IDA7XG4gICAgY29uc3QgbW92ZW1lbnRZID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRZIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRZID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFkoKSA6IDA7XG5cbiAgICB5YXdPYmplY3Qucm90YXRpb24ueSAtPSBtb3ZlbWVudFggKiAwLjAwMjtcbiAgICBwaXRjaE9iamVjdC5yb3RhdGlvbi54IC09IG1vdmVtZW50WSAqIDAuMDAyO1xuXG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCA9IE1hdGgubWF4KC1QSV8yLCBNYXRoLm1pbihQSV8yLCBwaXRjaE9iamVjdC5yb3RhdGlvbi54KSk7XG4gIH07XG5cbiAgY29uc3QgcGh5c2ljcyA9IHBsYXllci51c2UoJ3BoeXNpY3MnKTtcblxuICBjb25zdCBvbktleURvd24gPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDMyOiAvLyBzcGFjZVxuICAgICAgICBjb25zb2xlLmxvZyhjYW5KdW1wKTtcbiAgICAgICAgaWYgKGNhbkp1bXAgPT09IHRydWUpIHBoeXNpY3MuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogMCwgeTogMzAwLCB6OiAwfSk7XG4gICAgICAgIGNhbkp1bXAgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY6IC8vIHNoaWZ0XG4gICAgICAgIHJ1blZlbG9jaXR5ID0gMC41O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgb25LZXlVcCA9IGV2ZW50ID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgIG1vdmVGb3J3YXJkID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBhXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuMjU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfTtcblxuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCBmYWxzZSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93biwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCwgZmFsc2UpO1xuXG4gIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICB0aGlzLmdldE9iamVjdCA9ICgpID0+IHlhd09iamVjdDtcblxuICB0aGlzLmdldERpcmVjdGlvbiA9IHRhcmdldFZlYyA9PiB7XG4gICAgdGFyZ2V0VmVjLnNldCgwLCAwLCAtMSk7XG4gICAgcXVhdC5tdWx0aXBseVZlY3RvcjModGFyZ2V0VmVjKTtcbiAgfTtcblxuICAvLyBNb3ZlcyB0aGUgY2FtZXJhIHRvIHRoZSBQaHlzaS5qcyBvYmplY3QgcG9zaXRpb25cbiAgLy8gYW5kIGFkZHMgdmVsb2NpdHkgdG8gdGhlIG9iamVjdCBpZiB0aGUgcnVuIGtleSBpcyBkb3duLlxuICBjb25zdCBpbnB1dFZlbG9jaXR5ID0gbmV3IFZlY3RvcjMoKSxcbiAgICBldWxlciA9IG5ldyBFdWxlcigpO1xuXG4gIHRoaXMudXBkYXRlID0gZGVsdGEgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBkZWx0YSA9IGRlbHRhIHx8IDAuNTtcbiAgICBkZWx0YSA9IE1hdGgubWluKGRlbHRhLCAwLjUsIGRlbHRhKTtcblxuICAgIGlucHV0VmVsb2NpdHkuc2V0KDAsIDAsIDApO1xuXG4gICAgY29uc3Qgc3BlZWQgPSB2ZWxvY2l0eUZhY3RvciAqIGRlbHRhICogcGFyYW1zLnNwZWVkICogcnVuVmVsb2NpdHk7XG5cbiAgICBpZiAobW92ZUZvcndhcmQpIGlucHV0VmVsb2NpdHkueiA9IC1zcGVlZDtcbiAgICBpZiAobW92ZUJhY2t3YXJkKSBpbnB1dFZlbG9jaXR5LnogPSBzcGVlZDtcbiAgICBpZiAobW92ZUxlZnQpIGlucHV0VmVsb2NpdHkueCA9IC1zcGVlZDtcbiAgICBpZiAobW92ZVJpZ2h0KSBpbnB1dFZlbG9jaXR5LnggPSBzcGVlZDtcblxuICAgIC8vIENvbnZlcnQgdmVsb2NpdHkgdG8gd29ybGQgY29vcmRpbmF0ZXNcbiAgICBldWxlci54ID0gcGl0Y2hPYmplY3Qucm90YXRpb24ueDtcbiAgICBldWxlci55ID0geWF3T2JqZWN0LnJvdGF0aW9uLnk7XG4gICAgZXVsZXIub3JkZXIgPSAnWFlaJztcblxuICAgIHF1YXQuc2V0RnJvbUV1bGVyKGV1bGVyKTtcblxuICAgIGlucHV0VmVsb2NpdHkuYXBwbHlRdWF0ZXJuaW9uKHF1YXQpO1xuXG4gICAgcGh5c2ljcy5hcHBseUNlbnRyYWxJbXB1bHNlKHt4OiBpbnB1dFZlbG9jaXR5LngsIHk6IDAsIHo6IGlucHV0VmVsb2NpdHkuen0pO1xuICAgIHBoeXNpY3Muc2V0QW5ndWxhclZlbG9jaXR5KHt4OiBpbnB1dFZlbG9jaXR5LnosIHk6IDAsIHo6IC1pbnB1dFZlbG9jaXR5Lnh9KTtcbiAgICBwaHlzaWNzLnNldEFuZ3VsYXJGYWN0b3Ioe3g6IDAsIHk6IDAsIHo6IDB9KTtcbiAgfTtcblxuICBwbGF5ZXIub24oJ3BoeXNpY3M6YWRkZWQnLCAoKSA9PiB7XG4gICAgcGxheWVyLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGUnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuICAgICAgeWF3T2JqZWN0LnBvc2l0aW9uLmNvcHkocGxheWVyLnBvc2l0aW9uKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBGaXJzdFBlcnNvbk1vZHVsZSB7XG4gIHN0YXRpYyBkZWZhdWx0cyA9IHtcbiAgICBibG9jazogbnVsbCxcbiAgICBzcGVlZDogMSxcbiAgICB5cG9zOiAxXG4gIH07XG5cbiAgY29uc3RydWN0b3Iob2JqZWN0LCBwYXJhbXMgPSB7fSkge1xuICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgaWYgKCF0aGlzLnBhcmFtcy5ibG9jaykge1xuICAgICAgdGhpcy5wYXJhbXMuYmxvY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmxvY2tlcicpO1xuICAgIH1cbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIHRoaXMuY29udHJvbHMgPSBuZXcgRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihtYW5hZ2VyLmdldCgnY2FtZXJhJyksIHRoaXMub2JqZWN0LCB0aGlzLnBhcmFtcyk7XG5cbiAgICBpZiAoJ3BvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICdtb3pQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnd2Via2l0UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBpZiAoZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQubW96UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQud2Via2l0UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignUG9pbnRlciBsb2NrIGVycm9yLicpO1xuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrID0gZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdFBvaW50ZXJMb2NrO1xuXG4gICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4gPSBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuO1xuXG4gICAgICAgIGlmICgvRmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICBjb25zdCBmdWxsc2NyZWVuY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuXG4gICAgICAgICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfSBlbHNlIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgY29uc29sZS53YXJuKCdZb3VyIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0aGUgUG9pbnRlckxvY2snKTtcblxuICAgIG1hbmFnZXIuZ2V0KCdzY2VuZScpLmFkZCh0aGlzLmNvbnRyb2xzLmdldE9iamVjdCgpKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgdXBkYXRlUHJvY2Vzc29yID0gYyA9PiB7XG4gICAgICBzZWxmLmNvbnRyb2xzLnVwZGF0ZShjLmdldERlbHRhKCkpO1xuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZUxvb3AgPSBuZXcgTG9vcCh1cGRhdGVQcm9jZXNzb3IpLnN0YXJ0KHRoaXMpO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTUVTU0FHRV9UWVBFUyIsIlJFUE9SVF9JVEVNU0laRSIsIkNPTExJU0lPTlJFUE9SVF9JVEVNU0laRSIsIlZFSElDTEVSRVBPUlRfSVRFTVNJWkUiLCJDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFIiwidGVtcDFWZWN0b3IzIiwiVmVjdG9yMyIsInRlbXAyVmVjdG9yMyIsInRlbXAxTWF0cml4NCIsIk1hdHJpeDQiLCJ0ZW1wMVF1YXQiLCJRdWF0ZXJuaW9uIiwiZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiIsIngiLCJ5IiwieiIsInciLCJNYXRoIiwiYXRhbjIiLCJhc2luIiwiZ2V0UXVhdGVydGlvbkZyb21FdWxlciIsImMxIiwiY29zIiwiczEiLCJzaW4iLCJjMiIsInMyIiwiYzMiLCJzMyIsImMxYzIiLCJzMXMyIiwiY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCIsInBvc2l0aW9uIiwib2JqZWN0IiwiaWRlbnRpdHkiLCJtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbiIsInF1YXRlcm5pb24iLCJnZXRJbnZlcnNlIiwiY29weSIsInN1YiIsImFwcGx5TWF0cml4NCIsImFkZE9iamVjdENoaWxkcmVuIiwicGFyZW50IiwiaSIsImNoaWxkcmVuIiwibGVuZ3RoIiwiY2hpbGQiLCJwaHlzaWNzIiwiY29tcG9uZW50IiwidXNlIiwiZGF0YSIsInVwZGF0ZU1hdHJpeCIsInVwZGF0ZU1hdHJpeFdvcmxkIiwic2V0RnJvbU1hdHJpeFBvc2l0aW9uIiwibWF0cml4V29ybGQiLCJzZXRGcm9tUm90YXRpb25NYXRyaXgiLCJwb3NpdGlvbl9vZmZzZXQiLCJyb3RhdGlvbiIsInB1c2giLCJFdmVudGFibGUiLCJfZXZlbnRMaXN0ZW5lcnMiLCJldmVudF9uYW1lIiwiY2FsbGJhY2siLCJoYXNPd25Qcm9wZXJ0eSIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInBhcmFtZXRlcnMiLCJBcnJheSIsInByb3RvdHlwZSIsImNhbGwiLCJhcmd1bWVudHMiLCJhcHBseSIsIm9iaiIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZGlzcGF0Y2hFdmVudCIsIkNvbmVUd2lzdENvbnN0cmFpbnQiLCJvYmphIiwib2JqYiIsIm9iamVjdGEiLCJvYmplY3RiIiwidW5kZWZpbmVkIiwiY29uc29sZSIsImVycm9yIiwidHlwZSIsImFwcGxpZWRJbXB1bHNlIiwid29ybGRNb2R1bGUiLCJpZCIsInBvc2l0aW9uYSIsImNsb25lIiwicG9zaXRpb25iIiwiYXhpc2EiLCJheGlzYiIsImV4ZWN1dGUiLCJjb25zdHJhaW50IiwibWF4X2ltcHVsc2UiLCJ0YXJnZXQiLCJUSFJFRSIsInNldEZyb21FdWxlciIsIkV1bGVyIiwiSGluZ2VDb25zdHJhaW50IiwiYXhpcyIsImxvdyIsImhpZ2giLCJiaWFzX2ZhY3RvciIsInJlbGF4YXRpb25fZmFjdG9yIiwidmVsb2NpdHkiLCJhY2NlbGVyYXRpb24iLCJQb2ludENvbnN0cmFpbnQiLCJTbGlkZXJDb25zdHJhaW50IiwibGluX2xvd2VyIiwibGluX3VwcGVyIiwiYW5nX2xvd2VyIiwiYW5nX3VwcGVyIiwibGluZWFyIiwiYW5ndWxhciIsInNjZW5lIiwiRE9GQ29uc3RyYWludCIsImxpbWl0Iiwid2hpY2giLCJsb3dfYW5nbGUiLCJoaWdoX2FuZ2xlIiwibWF4X2ZvcmNlIiwiVmVoaWNsZSIsIm1lc2giLCJ0dW5pbmciLCJWZWhpY2xlVHVuaW5nIiwid2hlZWxzIiwiX3BoeXNpanMiLCJnZXRPYmplY3RJZCIsInN1c3BlbnNpb25fc3RpZmZuZXNzIiwic3VzcGVuc2lvbl9jb21wcmVzc2lvbiIsInN1c3BlbnNpb25fZGFtcGluZyIsIm1heF9zdXNwZW5zaW9uX3RyYXZlbCIsImZyaWN0aW9uX3NsaXAiLCJtYXhfc3VzcGVuc2lvbl9mb3JjZSIsIndoZWVsX2dlb21ldHJ5Iiwid2hlZWxfbWF0ZXJpYWwiLCJjb25uZWN0aW9uX3BvaW50Iiwid2hlZWxfZGlyZWN0aW9uIiwid2hlZWxfYXhsZSIsInN1c3BlbnNpb25fcmVzdF9sZW5ndGgiLCJ3aGVlbF9yYWRpdXMiLCJpc19mcm9udF93aGVlbCIsIndoZWVsIiwiTWVzaCIsImNhc3RTaGFkb3ciLCJyZWNlaXZlU2hhZG93IiwibXVsdGlwbHlTY2FsYXIiLCJhZGQiLCJ3b3JsZCIsImFtb3VudCIsInN0ZWVyaW5nIiwiYnJha2UiLCJmb3JjZSIsIldvcmxkTW9kdWxlQmFzZSIsIm9wdGlvbnMiLCJicmlkZ2UiLCJzZWxmIiwiZGVmZXIiLCJvbkFkZENhbGxiYWNrIiwiYmluZCIsIm9uUmVtb3ZlQ2FsbGJhY2siLCJsb2ciLCJPYmplY3QiLCJhc3NpZ24iLCJkZWZhdWx0cyIsIm9iamVjdHMiLCJ2ZWhpY2xlcyIsImNvbnN0cmFpbnRzIiwiaXNTaW11bGF0aW5nIiwicmVjZWl2ZSIsIl90ZW1wIiwiZXZlbnQiLCJBcnJheUJ1ZmZlciIsImJ5dGVMZW5ndGgiLCJGbG9hdDMyQXJyYXkiLCJXT1JMRFJFUE9SVCIsInVwZGF0ZVNjZW5lIiwiU09GVFJFUE9SVCIsInVwZGF0ZVNvZnRib2RpZXMiLCJDT0xMSVNJT05SRVBPUlQiLCJ1cGRhdGVDb2xsaXNpb25zIiwiVkVISUNMRVJFUE9SVCIsInVwZGF0ZVZlaGljbGVzIiwiQ09OU1RSQUlOVFJFUE9SVCIsInVwZGF0ZUNvbnN0cmFpbnRzIiwiY21kIiwicGFyYW1zIiwidGVzdCIsImRlYnVnIiwiZGlyIiwiaW5mbyIsIm9mZnNldCIsIl9fZGlydHlQb3NpdGlvbiIsInNldCIsIl9fZGlydHlSb3RhdGlvbiIsImxpbmVhclZlbG9jaXR5IiwiYW5ndWxhclZlbG9jaXR5IiwiU1VQUE9SVF9UUkFOU0ZFUkFCTEUiLCJzZW5kIiwiYnVmZmVyIiwic2l6ZSIsImF0dHJpYnV0ZXMiLCJnZW9tZXRyeSIsInZvbHVtZVBvc2l0aW9ucyIsImFycmF5Iiwib2Zmc2V0VmVydCIsImlzU29mdEJvZHlSZXNldCIsInZvbHVtZU5vcm1hbHMiLCJub3JtYWwiLCJvZmZzIiwieDEiLCJ5MSIsInoxIiwibngxIiwibnkxIiwibnoxIiwieDIiLCJ5MiIsInoyIiwibngyIiwibnkyIiwibnoyIiwieDMiLCJ5MyIsInozIiwibngzIiwibnkzIiwibnozIiwiaTkiLCJuZWVkc1VwZGF0ZSIsIm54IiwibnkiLCJueiIsInZlaGljbGUiLCJleHRyYWN0Um90YXRpb24iLCJtYXRyaXgiLCJhZGRWZWN0b3JzIiwiY29sbGlzaW9ucyIsIm5vcm1hbF9vZmZzZXRzIiwib2JqZWN0MiIsImlkMSIsImoiLCJ0b3VjaGVzIiwiaWQyIiwiY29tcG9uZW50MiIsImRhdGEyIiwidmVsIiwiZ2V0TGluZWFyVmVsb2NpdHkiLCJ2ZWwyIiwic3ViVmVjdG9ycyIsInRlbXAxIiwidGVtcDIiLCJub3JtYWxfb2Zmc2V0IiwiZW1pdCIsInNob3dfbWFya2VyIiwiZ2V0RGVmaW5pdGlvbiIsIm1hcmtlciIsIlNwaGVyZUdlb21ldHJ5IiwiTWVzaE5vcm1hbE1hdGVyaWFsIiwiQm94R2VvbWV0cnkiLCJuYXRpdmUiLCJtYW5hZ2VyIiwid2lkdGgiLCJzY2FsZSIsImhlaWdodCIsImRlcHRoIiwicmVtb3ZlIiwicG9wIiwiZnVuYyIsImFyZ3MiLCJQcm9taXNlIiwicmVzb2x2ZSIsImlzTG9hZGVkIiwibG9hZGVyIiwidGhlbiIsIndvcmtlciIsInNldEZpeGVkVGltZVN0ZXAiLCJmaXhlZFRpbWVTdGVwIiwic2V0R3Jhdml0eSIsImdyYXZpdHkiLCJhZGRDb25zdHJhaW50Iiwic2ltdWxhdGUiLCJ0aW1lU3RlcCIsIm1heFN1YlN0ZXBzIiwiX3N0YXRzIiwiYmVnaW4iLCJvYmplY3RfaWQiLCJ1cGRhdGUiLCJwb3MiLCJpc1NvZnRib2R5IiwicXVhdCIsImVuZCIsInNpbXVsYXRlTG9vcCIsIkxvb3AiLCJjbG9jayIsImdldERlbHRhIiwic3RhcnQiLCJUQVJHRVQiLCJTeW1ib2wiLCJTQ1JJUFRfVFlQRSIsIkJsb2JCdWlsZGVyIiwid2luZG93IiwiV2ViS2l0QmxvYkJ1aWxkZXIiLCJNb3pCbG9iQnVpbGRlciIsIk1TQmxvYkJ1aWxkZXIiLCJVUkwiLCJ3ZWJraXRVUkwiLCJXb3JrZXIiLCJzaGltV29ya2VyIiwiZmlsZW5hbWUiLCJmbiIsIlNoaW1Xb3JrZXIiLCJmb3JjZUZhbGxiYWNrIiwibyIsInNvdXJjZSIsInRvU3RyaW5nIiwicmVwbGFjZSIsInNsaWNlIiwib2JqVVJMIiwiY3JlYXRlU291cmNlT2JqZWN0IiwicmV2b2tlT2JqZWN0VVJMIiwic2VsZlNoaW0iLCJtIiwib25tZXNzYWdlIiwicG9zdE1lc3NhZ2UiLCJpc1RoaXNUaHJlYWQiLCJ0ZXN0V29ya2VyIiwidGVzdEFycmF5IiwiVWludDhBcnJheSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIkVycm9yIiwiZSIsInRlcm1pbmF0ZSIsInN0ciIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJibG9iIiwiYXBwZW5kIiwiZ2V0QmxvYiIsImRvY3VtZW50IiwiRXZlbnRzIiwiZXZlbnRzIiwiZW1wdHkiLCJvbiIsImN0eCIsIm9mZiIsImxpc3QiLCJpbnNpZGVXb3JrZXIiLCJ3ZWJraXRQb3N0TWVzc2FnZSIsImFiIiwiX29iamVjdCIsIl92ZWN0b3IiLCJfdHJhbnNmb3JtIiwiX3RyYW5zZm9ybV9wb3MiLCJfc29mdGJvZHlfZW5hYmxlZCIsImxhc3Rfc2ltdWxhdGlvbl9kdXJhdGlvbiIsIl9udW1fb2JqZWN0cyIsIl9udW1fcmlnaWRib2R5X29iamVjdHMiLCJfbnVtX3NvZnRib2R5X29iamVjdHMiLCJfbnVtX3doZWVscyIsIl9udW1fY29uc3RyYWludHMiLCJfc29mdGJvZHlfcmVwb3J0X3NpemUiLCJfdmVjM18xIiwiX3ZlYzNfMiIsIl92ZWMzXzMiLCJfcXVhdCIsInB1YmxpY19mdW5jdGlvbnMiLCJfb2JqZWN0cyIsIl92ZWhpY2xlcyIsIl9jb25zdHJhaW50cyIsIl9vYmplY3RzX2FtbW8iLCJfb2JqZWN0X3NoYXBlcyIsIlJFUE9SVF9DSFVOS1NJWkUiLCJzb2Z0cmVwb3J0IiwiY29sbGlzaW9ucmVwb3J0IiwidmVoaWNsZXJlcG9ydCIsImNvbnN0cmFpbnRyZXBvcnQiLCJXT1JMRFJFUE9SVF9JVEVNU0laRSIsImdldFNoYXBlRnJvbUNhY2hlIiwiY2FjaGVfa2V5Iiwic2V0U2hhcGVDYWNoZSIsInNoYXBlIiwiY3JlYXRlU2hhcGUiLCJkZXNjcmlwdGlvbiIsInNldElkZW50aXR5IiwiQW1tbyIsImJ0Q29tcG91bmRTaGFwZSIsInNldFgiLCJzZXRZIiwic2V0WiIsImJ0U3RhdGljUGxhbmVTaGFwZSIsImJ0Qm94U2hhcGUiLCJyYWRpdXMiLCJidFNwaGVyZVNoYXBlIiwiYnRDeWxpbmRlclNoYXBlIiwiYnRDYXBzdWxlU2hhcGUiLCJidENvbmVTaGFwZSIsInRyaWFuZ2xlX21lc2giLCJidFRyaWFuZ2xlTWVzaCIsImFkZFRyaWFuZ2xlIiwiYnRCdmhUcmlhbmdsZU1lc2hTaGFwZSIsImJ0Q29udmV4SHVsbFNoYXBlIiwiYWRkUG9pbnQiLCJ4cHRzIiwieXB0cyIsInBvaW50cyIsInB0ciIsIl9tYWxsb2MiLCJwIiwicDIiLCJIRUFQRjMyIiwiYnRIZWlnaHRmaWVsZFRlcnJhaW5TaGFwZSIsImFic01heEhlaWdodCIsImNyZWF0ZVNvZnRCb2R5IiwiYm9keSIsInNvZnRCb2R5SGVscGVycyIsImJ0U29mdEJvZHlIZWxwZXJzIiwiYVZlcnRpY2VzIiwiQ3JlYXRlRnJvbVRyaU1lc2giLCJnZXRXb3JsZEluZm8iLCJhSW5kaWNlcyIsImNyIiwiY29ybmVycyIsIkNyZWF0ZVBhdGNoIiwiYnRWZWN0b3IzIiwic2VnbWVudHMiLCJDcmVhdGVSb3BlIiwiaW5pdCIsIm5vV29ya2VyIiwiYW1tbyIsIndhc21CdWZmZXIiLCJsb2FkQW1tb0Zyb21CaW5hcnkiLCJtYWtlV29ybGQiLCJidFRyYW5zZm9ybSIsImJ0UXVhdGVybmlvbiIsInJlcG9ydHNpemUiLCJjb2xsaXNpb25Db25maWd1cmF0aW9uIiwic29mdGJvZHkiLCJidFNvZnRCb2R5UmlnaWRCb2R5Q29sbGlzaW9uQ29uZmlndXJhdGlvbiIsImJ0RGVmYXVsdENvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJkaXNwYXRjaGVyIiwiYnRDb2xsaXNpb25EaXNwYXRjaGVyIiwic29sdmVyIiwiYnRTZXF1ZW50aWFsSW1wdWxzZUNvbnN0cmFpbnRTb2x2ZXIiLCJicm9hZHBoYXNlIiwiYWFiYm1pbiIsImFhYmJtYXgiLCJidEF4aXNTd2VlcDMiLCJidERidnRCcm9hZHBoYXNlIiwiYnRTb2Z0UmlnaWREeW5hbWljc1dvcmxkIiwiYnREZWZhdWx0U29mdEJvZHlTb2x2ZXIiLCJidERpc2NyZXRlRHluYW1pY3NXb3JsZCIsImFwcGVuZEFuY2hvciIsIm5vZGUiLCJvYmoyIiwiY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyIsImluZmx1ZW5jZSIsImFkZE9iamVjdCIsIm1vdGlvblN0YXRlIiwic2JDb25maWciLCJnZXRfbV9jZmciLCJ2aXRlcmF0aW9ucyIsInNldF92aXRlcmF0aW9ucyIsInBpdGVyYXRpb25zIiwic2V0X3BpdGVyYXRpb25zIiwiZGl0ZXJhdGlvbnMiLCJzZXRfZGl0ZXJhdGlvbnMiLCJjaXRlcmF0aW9ucyIsInNldF9jaXRlcmF0aW9ucyIsInNldF9jb2xsaXNpb25zIiwic2V0X2tERiIsImZyaWN0aW9uIiwic2V0X2tEUCIsImRhbXBpbmciLCJwcmVzc3VyZSIsInNldF9rUFIiLCJkcmFnIiwic2V0X2tERyIsImxpZnQiLCJzZXRfa0xGIiwiYW5jaG9ySGFyZG5lc3MiLCJzZXRfa0FIUiIsInJpZ2lkSGFyZG5lc3MiLCJzZXRfa0NIUiIsImtsc3QiLCJnZXRfbV9tYXRlcmlhbHMiLCJhdCIsInNldF9tX2tMU1QiLCJrYXN0Iiwic2V0X21fa0FTVCIsImt2c3QiLCJzZXRfbV9rVlNUIiwiY2FzdE9iamVjdCIsImJ0Q29sbGlzaW9uT2JqZWN0IiwiZ2V0Q29sbGlzaW9uU2hhcGUiLCJzZXRNYXJnaW4iLCJtYXJnaW4iLCJzZXRBY3RpdmF0aW9uU3RhdGUiLCJzdGF0ZSIsInJvcGUiLCJjbG90aCIsInNldE9yaWdpbiIsInNldFciLCJzZXRSb3RhdGlvbiIsInRyYW5zZm9ybSIsInNldFRvdGFsTWFzcyIsIm1hc3MiLCJhZGRTb2Z0Qm9keSIsImdldF9tX2ZhY2VzIiwiZ2V0X21fbm9kZXMiLCJjb21wb3VuZF9zaGFwZSIsImFkZENoaWxkU2hhcGUiLCJfY2hpbGQiLCJ0cmFucyIsImRlc3Ryb3kiLCJzZXRMb2NhbFNjYWxpbmciLCJjYWxjdWxhdGVMb2NhbEluZXJ0aWEiLCJidERlZmF1bHRNb3Rpb25TdGF0ZSIsInJiSW5mbyIsImJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyIsInNldF9tX2ZyaWN0aW9uIiwic2V0X21fcmVzdGl0dXRpb24iLCJyZXN0aXR1dGlvbiIsInNldF9tX2xpbmVhckRhbXBpbmciLCJzZXRfbV9hbmd1bGFyRGFtcGluZyIsImJ0UmlnaWRCb2R5IiwiY29sbGlzaW9uX2ZsYWdzIiwic2V0Q29sbGlzaW9uRmxhZ3MiLCJncm91cCIsIm1hc2siLCJhZGRSaWdpZEJvZHkiLCJhY3RpdmF0ZSIsImEiLCJhZGRWZWhpY2xlIiwidmVoaWNsZV90dW5pbmciLCJidFZlaGljbGVUdW5pbmciLCJzZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzIiwic2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uIiwic2V0X21fc3VzcGVuc2lvbkRhbXBpbmciLCJzZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20iLCJzZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UiLCJidFJheWNhc3RWZWhpY2xlIiwicmlnaWRCb2R5IiwiYnREZWZhdWx0VmVoaWNsZVJheWNhc3RlciIsInNldENvb3JkaW5hdGVTeXN0ZW0iLCJyZW1vdmVWZWhpY2xlIiwiYWRkV2hlZWwiLCJzZXRTdGVlcmluZyIsImRldGFpbHMiLCJzZXRTdGVlcmluZ1ZhbHVlIiwic2V0QnJha2UiLCJhcHBseUVuZ2luZUZvcmNlIiwicmVtb3ZlT2JqZWN0IiwicmVtb3ZlU29mdEJvZHkiLCJyZW1vdmVSaWdpZEJvZHkiLCJfbW90aW9uX3N0YXRlcyIsIl9jb21wb3VuZF9zaGFwZXMiLCJfbm9uY2FjaGVkX3NoYXBlcyIsInVwZGF0ZVRyYW5zZm9ybSIsImdldE1vdGlvblN0YXRlIiwiZ2V0V29ybGRUcmFuc2Zvcm0iLCJzZXRXb3JsZFRyYW5zZm9ybSIsInVwZGF0ZU1hc3MiLCJzZXRNYXNzUHJvcHMiLCJhcHBseUNlbnRyYWxJbXB1bHNlIiwiYXBwbHlJbXB1bHNlIiwiaW1wdWxzZV94IiwiaW1wdWxzZV95IiwiaW1wdWxzZV96IiwiYXBwbHlUb3JxdWUiLCJ0b3JxdWVfeCIsInRvcnF1ZV95IiwidG9ycXVlX3oiLCJhcHBseUNlbnRyYWxGb3JjZSIsImFwcGx5Rm9yY2UiLCJmb3JjZV94IiwiZm9yY2VfeSIsImZvcmNlX3oiLCJvblNpbXVsYXRpb25SZXN1bWUiLCJzZXRBbmd1bGFyVmVsb2NpdHkiLCJzZXRMaW5lYXJWZWxvY2l0eSIsInNldEFuZ3VsYXJGYWN0b3IiLCJzZXRMaW5lYXJGYWN0b3IiLCJzZXREYW1waW5nIiwic2V0Q2NkTW90aW9uVGhyZXNob2xkIiwidGhyZXNob2xkIiwic2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMiLCJidFBvaW50MlBvaW50Q29uc3RyYWludCIsImJ0SGluZ2VDb25zdHJhaW50IiwidHJhbnNmb3JtYiIsInRyYW5zZm9ybWEiLCJnZXRSb3RhdGlvbiIsInNldEV1bGVyIiwiYnRTbGlkZXJDb25zdHJhaW50IiwidGEiLCJ0YiIsInNldEV1bGVyWllYIiwiYnRDb25lVHdpc3RDb25zdHJhaW50Iiwic2V0TGltaXQiLCJQSSIsImJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50IiwiYiIsImVuYWJsZUZlZWRiYWNrIiwicmVtb3ZlQ29uc3RyYWludCIsImNvbnN0cmFpbnRfc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwidW5kZWZpbmQiLCJzZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJjZWlsIiwic3RlcFNpbXVsYXRpb24iLCJyZXBvcnRWZWhpY2xlcyIsInJlcG9ydENvbnN0cmFpbnRzIiwicmVwb3J0V29ybGRfc29mdGJvZGllcyIsImhpbmdlX3NldExpbWl0cyIsImhpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvciIsImVuYWJsZUFuZ3VsYXJNb3RvciIsImhpbmdlX2Rpc2FibGVNb3RvciIsImVuYWJsZU1vdG9yIiwic2xpZGVyX3NldExpbWl0cyIsInNldExvd2VyTGluTGltaXQiLCJzZXRVcHBlckxpbkxpbWl0Iiwic2V0TG93ZXJBbmdMaW1pdCIsInNldFVwcGVyQW5nTGltaXQiLCJzbGlkZXJfc2V0UmVzdGl0dXRpb24iLCJzZXRTb2Z0bmVzc0xpbUxpbiIsInNldFNvZnRuZXNzTGltQW5nIiwic2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yIiwic2V0VGFyZ2V0TGluTW90b3JWZWxvY2l0eSIsInNldE1heExpbk1vdG9yRm9yY2UiLCJzZXRQb3dlcmVkTGluTW90b3IiLCJzbGlkZXJfZGlzYWJsZUxpbmVhck1vdG9yIiwic2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvciIsInNldFRhcmdldEFuZ01vdG9yVmVsb2NpdHkiLCJzZXRNYXhBbmdNb3RvckZvcmNlIiwic2V0UG93ZXJlZEFuZ01vdG9yIiwic2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3IiLCJjb25ldHdpc3Rfc2V0TGltaXQiLCJjb25ldHdpc3RfZW5hYmxlTW90b3IiLCJjb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlIiwic2V0TWF4TW90b3JJbXB1bHNlIiwiY29uZXR3aXN0X3NldE1vdG9yVGFyZ2V0Iiwic2V0TW90b3JUYXJnZXQiLCJjb25ldHdpc3RfZGlzYWJsZU1vdG9yIiwiZG9mX3NldExpbmVhckxvd2VyTGltaXQiLCJzZXRMaW5lYXJMb3dlckxpbWl0IiwiZG9mX3NldExpbmVhclVwcGVyTGltaXQiLCJzZXRMaW5lYXJVcHBlckxpbWl0IiwiZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0Iiwic2V0QW5ndWxhckxvd2VyTGltaXQiLCJkb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQiLCJzZXRBbmd1bGFyVXBwZXJMaW1pdCIsImRvZl9lbmFibGVBbmd1bGFyTW90b3IiLCJtb3RvciIsImdldFJvdGF0aW9uYWxMaW1pdE1vdG9yIiwic2V0X21fZW5hYmxlTW90b3IiLCJkb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yIiwic2V0X21fbG9MaW1pdCIsInNldF9tX2hpTGltaXQiLCJzZXRfbV90YXJnZXRWZWxvY2l0eSIsInNldF9tX21heE1vdG9yRm9yY2UiLCJkb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvciIsInJlcG9ydFdvcmxkIiwid29ybGRyZXBvcnQiLCJnZXRDZW50ZXJPZk1hc3NUcmFuc2Zvcm0iLCJvcmlnaW4iLCJnZXRPcmlnaW4iLCJnZXRBbmd1bGFyVmVsb2NpdHkiLCJub2RlcyIsInZlcnQiLCJnZXRfbV94IiwiZ2V0X21fbiIsImZhY2VzIiwiZmFjZSIsIm5vZGUxIiwibm9kZTIiLCJub2RlMyIsInZlcnQxIiwidmVydDIiLCJ2ZXJ0MyIsIm5vcm1hbDEiLCJub3JtYWwyIiwibm9ybWFsMyIsInJlcG9ydENvbGxpc2lvbnMiLCJkcCIsImdldERpc3BhdGNoZXIiLCJudW0iLCJnZXROdW1NYW5pZm9sZHMiLCJtYW5pZm9sZCIsImdldE1hbmlmb2xkQnlJbmRleEludGVybmFsIiwibnVtX2NvbnRhY3RzIiwiZ2V0TnVtQ29udGFjdHMiLCJwdCIsImdldENvbnRhY3RQb2ludCIsImdldEJvZHkwIiwiZ2V0Qm9keTEiLCJnZXRfbV9ub3JtYWxXb3JsZE9uQiIsImdldE51bVdoZWVscyIsImdldFdoZWVsSW5mbyIsImdldF9tX3dvcmxkVHJhbnNmb3JtIiwibGVuZ2h0Iiwib2Zmc2V0X2JvZHkiLCJnZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJXb3JsZE1vZHVsZSIsIlBoeXNpY3NXb3JrZXIiLCJ0cmFuc2ZlcmFibGVNZXNzYWdlIiwicmVqZWN0Iiwic2V0dXAiLCJwcm9wZXJ0aWVzIiwiX25hdGl2ZSIsInZlY3RvcjMiLCJzY29wZSIsImRlZmluZVByb3BlcnRpZXMiLCJfeCIsIl95IiwiX3oiLCJfX2Nfcm90Iiwib25DaGFuZ2UiLCJldWxlciIsInJvdCIsIndyYXBQaHlzaWNzUHJvdG90eXBlIiwia2V5IiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJvbkNvcHkiLCJzb3VyY2VQaHlzaWNzIiwibW9kdWxlcyIsIm9uV3JhcCIsIkFQSSIsImZhY3RvciIsImRlZmluZSIsImhhcyIsIm1vZHVsZSIsInJlc3VsdCIsImNvbnN0cnVjdG9yIiwicmlnaWRib2R5IiwiQm94TW9kdWxlIiwiUGh5c2ljc01vZHVsZSIsInVwZGF0ZURhdGEiLCJib3VuZGluZ0JveCIsImNvbXB1dGVCb3VuZGluZ0JveCIsIm1heCIsIm1pbiIsIkNvbXBvdW5kTW9kdWxlIiwiQ2Fwc3VsZU1vZHVsZSIsIkNvbmNhdmVNb2R1bGUiLCJnZW9tZXRyeVByb2Nlc3NvciIsImlzQnVmZmVyR2VvbWV0cnkiLCJ2ZXJ0aWNlcyIsInZBIiwidkIiLCJ2QyIsImMiLCJDb25lTW9kdWxlIiwiQ29udmV4TW9kdWxlIiwiX2J1ZmZlckdlb21ldHJ5IiwiQnVmZmVyR2VvbWV0cnkiLCJmcm9tR2VvbWV0cnkiLCJDeWxpbmRlck1vZHVsZSIsIkhlaWdodGZpZWxkTW9kdWxlIiwiVmVjdG9yMiIsInhkaXYiLCJ5ZGl2IiwidmVydHMiLCJ4c2l6ZSIsInlzaXplIiwic3FydCIsImFicyIsInZOdW0iLCJyb3VuZCIsIm11bHRpcGx5IiwiYXV0b0FsaWduIiwidHJhbnNsYXRlIiwiUGxhbmVNb2R1bGUiLCJTcGhlcmVNb2R1bGUiLCJib3VuZGluZ1NwaGVyZSIsImNvbXB1dGVCb3VuZGluZ1NwaGVyZSIsIlNvZnRib2R5TW9kdWxlIiwiaWR4R2VvbWV0cnkiLCJtZXJnZVZlcnRpY2VzIiwiYnVmZmVyR2VvbWV0cnkiLCJhZGRBdHRyaWJ1dGUiLCJCdWZmZXJBdHRyaWJ1dGUiLCJjb3B5VmVjdG9yM3NBcnJheSIsInNldEluZGV4IiwiVWludDMyQXJyYXkiLCJVaW50MTZBcnJheSIsImNvcHlJbmRpY2VzQXJyYXkiLCJvMSIsIm8yIiwiQ2xvdGhNb2R1bGUiLCJnZW9tUGFyYW1zIiwiZ2VvbSIsImZhY2VzTGVuZ3RoIiwibm9ybWFsc0FycmF5IiwiaTMiLCJ3aWR0aFNlZ21lbnRzIiwiaGVpZ2h0U2VnbWVudHMiLCJpZHgwMCIsImlkeDAxIiwiaWR4MTAiLCJpZHgxMSIsIlJvcGVNb2R1bGUiLCJidWZmIiwiZnJvbUFycmF5IiwibiIsInYxIiwidjIiLCJQSV8yIiwiRmlyc3RQZXJzb25Db250cm9sc1NvbHZlciIsImNhbWVyYSIsInZlbG9jaXR5RmFjdG9yIiwicnVuVmVsb2NpdHkiLCJwbGF5ZXIiLCJwaXRjaE9iamVjdCIsIk9iamVjdDNEIiwieWF3T2JqZWN0IiwieXBvcyIsImNhbkp1bXAiLCJtb3ZlQmFja3dhcmQiLCJtb3ZlTGVmdCIsIm1vdmVSaWdodCIsIm90aGVyT2JqZWN0IiwidiIsInIiLCJjb250YWN0Tm9ybWFsIiwib25Nb3VzZU1vdmUiLCJlbmFibGVkIiwibW92ZW1lbnRYIiwibW96TW92ZW1lbnRYIiwiZ2V0TW92ZW1lbnRYIiwibW92ZW1lbnRZIiwibW96TW92ZW1lbnRZIiwiZ2V0TW92ZW1lbnRZIiwib25LZXlEb3duIiwia2V5Q29kZSIsIm9uS2V5VXAiLCJnZXRPYmplY3QiLCJnZXREaXJlY3Rpb24iLCJtdWx0aXBseVZlY3RvcjMiLCJ0YXJnZXRWZWMiLCJpbnB1dFZlbG9jaXR5IiwiZGVsdGEiLCJzcGVlZCIsIm1vdmVGb3J3YXJkIiwib3JkZXIiLCJhcHBseVF1YXRlcm5pb24iLCJGaXJzdFBlcnNvbk1vZHVsZSIsImJsb2NrIiwiZ2V0RWxlbWVudEJ5SWQiLCJjb250cm9scyIsImVsZW1lbnQiLCJwb2ludGVybG9ja2NoYW5nZSIsInBvaW50ZXJMb2NrRWxlbWVudCIsIm1velBvaW50ZXJMb2NrRWxlbWVudCIsIndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCIsInN0eWxlIiwiZGlzcGxheSIsInBvaW50ZXJsb2NrZXJyb3IiLCJ3YXJuIiwicXVlcnlTZWxlY3RvciIsInJlcXVlc3RQb2ludGVyTG9jayIsIm1velJlcXVlc3RQb2ludGVyTG9jayIsIndlYmtpdFJlcXVlc3RQb2ludGVyTG9jayIsInJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxzY3JlZW4iLCJtb3pSZXF1ZXN0RnVsbFNjcmVlbiIsIndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIiwiZnVsbHNjcmVlbmNoYW5nZSIsImZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsInVwZGF0ZVByb2Nlc3NvciIsInVwZGF0ZUxvb3AiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFNQSxJQUFNQSxnQkFBZ0I7ZUFDUCxDQURPO21CQUVILENBRkc7aUJBR0wsQ0FISztvQkFJRixDQUpFO2NBS1I7Q0FMZDs7QUFRQSxJQUFNQyxrQkFBa0IsRUFBeEI7SUFDRUMsMkJBQTJCLENBRDdCO0lBRUVDLHlCQUF5QixDQUYzQjtJQUdFQyw0QkFBNEIsQ0FIOUI7O0FBS0EsSUFBTUMsZUFBZSxJQUFJQyxhQUFKLEVBQXJCO0lBQ0VDLGVBQWUsSUFBSUQsYUFBSixFQURqQjtJQUVFRSxlQUFlLElBQUlDLGFBQUosRUFGakI7SUFHRUMsWUFBWSxJQUFJQyxnQkFBSixFQUhkOztBQUtB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
