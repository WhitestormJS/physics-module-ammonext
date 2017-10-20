/* Physics module AmmoNext v0.1.2 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('whs')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three', 'whs'], factory) :
	(factory((global.WHS = global.WHS || {}),global.THREE,global.WHS));
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
    var _physijs = child.component._physijs;

    if (_physijs) {
      child.updateMatrix();
      child.updateMatrixWorld();

      temp1Vector3.setFromMatrixPosition(child.matrixWorld);
      temp1Quat.setFromRotationMatrix(child.matrixWorld);

      _physijs.position_offset = {
        x: temp1Vector3.x,
        y: temp1Vector3.y,
        z: temp1Vector3.z
      };

      _physijs.rotation = {
        x: temp1Quat.x,
        y: temp1Quat.y,
        z: temp1Quat.z,
        w: temp1Quat.w
      };

      parent.component._physijs.children.push(_physijs);
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





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

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
    this.objecta = objecta._physijs.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.objectb = objectb._physijs.id;
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
    this.objecta = objecta._physijs.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.position = position.clone();
    this.axis = axis;

    if (objectb) {
      this.objectb = objectb._physijs.id;
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
    this.objecta = objecta._physijs.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();

    if (objectb) {
      this.objectb = objectb._physijs.id;
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
    this.objecta = objecta._physijs.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.axis = axis;

    if (objectb) {
      this.objectb = objectb._physijs.id;
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
    this.objecta = objecta._physijs.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.axisa = { x: objecta.rotation.x, y: objecta.rotation.y, z: objecta.rotation.z };

    if (objectb) {
      this.objectb = objectb._physijs.id;
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

var WorldModule = function (_Eventable) {
  inherits(WorldModule, _Eventable);

  function WorldModule(params) {
    classCallCheck(this, WorldModule);

    var _this = possibleConstructorReturn(this, (WorldModule.__proto__ || Object.getPrototypeOf(WorldModule)).call(this));

    _this.bridge = {
      onAdd: function onAdd(component, self) {
        if (component._physijs) return self.defer(self.onAddCallback.bind(self), [component]);
        return;
      },
      onRemove: function onRemove(component, self) {
        if (component._physijs) return self.defer(self.onRemoveCallback.bind(self), [component]);
        return;
      }
    };


    _this.params = Object.assign({
      fixedTimeStep: 1 / 60,
      rateLimit: true,
      ammo: "",
      softbody: false,
      gravity: new three.Vector3(0, -100, 0)
    }, params);

    var start = performance.now();

    _this.worker = new (require('worker-loader?inline,name=worker.js!../worker.js'))();
    _this.worker.transferableMessage = _this.worker.webkitPostMessage || _this.worker.postMessage;

    _this.isLoaded = false;

    _this.loader = new Promise(function (resolve, reject) {
      if (params.wasm) {
        fetch(params.wasm).then(function (response) {
          return response.arrayBuffer();
        }).then(function (buffer) {
          _this.params.wasmBuffer = buffer;

          _this.execute('init', _this.params);
          // console.log("Physics loading time: " + (performance.now() - start) + "ms");
          resolve();
        });
      } else {
        _this.execute('init', _this.params);
        resolve();
      }
    });

    _this.loader.then(function () {
      _this.isLoaded = true;
    });

    _this._materials_ref_counts = {};
    _this._objects = {};
    _this._vehicles = {};
    _this._constraints = {};
    _this._is_simulating = false;
    _this.getObjectId = function () {
      var _id = 1;
      return function () {
        return _id++;
      };
    }();

    // Test SUPPORT_TRANSFERABLE

    var ab = new ArrayBuffer(1);
    _this.worker.transferableMessage(ab, [ab]);
    _this.SUPPORT_TRANSFERABLE = ab.byteLength === 0;

    _this.worker.onmessage = function (event) {
      var _temp = void 0,
          data = event.data;

      if (data instanceof ArrayBuffer && data.byteLength !== 1) // byteLength === 1 is the worker making a SUPPORT_TRANSFERABLE test
        data = new Float32Array(data);

      if (data instanceof Float32Array) {
        // transferable object
        switch (data[0]) {
          case MESSAGE_TYPES.WORLDREPORT:
            _this.updateScene(data);
            break;

          case MESSAGE_TYPES.SOFTREPORT:
            _this.updateSoftbodies(data);
            break;

          case MESSAGE_TYPES.COLLISIONREPORT:
            _this.updateCollisions(data);
            break;

          case MESSAGE_TYPES.VEHICLEREPORT:
            _this.updateVehicles(data);
            break;

          case MESSAGE_TYPES.CONSTRAINTREPORT:
            _this.updateConstraints(data);
            break;
          default:
        }
      } else if (data.cmd) {
        // non-transferable object
        switch (data.cmd) {
          case 'objectReady':
            _temp = data.params;
            if (_this._objects[_temp]) _this._objects[_temp].dispatchEvent('ready');
            break;

          case 'worldReady':
            _this.dispatchEvent('ready');
            break;

          case 'ammoLoaded':
            _this.dispatchEvent('loaded');
            console.log("Physics loading time: " + (performance.now() - start) + "ms");
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
            _this.updateScene(data);
            break;

          case MESSAGE_TYPES.COLLISIONREPORT:
            _this.updateCollisions(data);
            break;

          case MESSAGE_TYPES.VEHICLEREPORT:
            _this.updateVehicles(data);
            break;

          case MESSAGE_TYPES.CONSTRAINTREPORT:
            _this.updateConstraints(data);
            break;
          default:
        }
      }
    };
    return _this;
  }

  createClass(WorldModule, [{
    key: 'updateScene',
    value: function updateScene(data) {
      var index = data[1];

      while (index--) {
        var offset = 2 + index * REPORT_ITEMSIZE;
        var object = this._objects[data[offset]];
        var component = object.component;
        var _physijs = component._physijs;

        if (object === null) continue;

        if (component.__dirtyPosition === false) {
          object.position.set(data[offset + 1], data[offset + 2], data[offset + 3]);

          component.__dirtyPosition = false;
        }

        if (component.__dirtyRotation === false) {
          object.quaternion.set(data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]);

          component.__dirtyRotation = false;
        }

        _physijs.linearVelocity.set(data[offset + 8], data[offset + 9], data[offset + 10]);

        _physijs.angularVelocity.set(data[offset + 11], data[offset + 12], data[offset + 13]);
      }

      if (this.SUPPORT_TRANSFERABLE) this.worker.transferableMessage(data.buffer, [data.buffer]); // Give the typed array back to the worker

      this._is_simulating = false;
      this.dispatchEvent('update');
    }
  }, {
    key: 'updateSoftbodies',
    value: function updateSoftbodies(data) {
      var index = data[1],
          offset = 2;

      while (index--) {
        var size = data[offset + 1];
        var object = this._objects[data[offset]];

        if (object === null) continue;

        var _physijs = object.component._physijs;

        var attributes = object.geometry.attributes;
        var volumePositions = attributes.position.array;

        var offsetVert = offset + 2;

        if (!_physijs.isSoftBodyReset) {
          object.position.set(0, 0, 0);
          object.quaternion.set(0, 0, 0, 0);

          _physijs.isSoftBodyReset = true;
        }

        if (_physijs.type === "softTrimesh") {
          var volumeNormals = attributes.normal.array;

          for (var i = 0; i < size; i++) {
            var offs = offsetVert + i * 18;

            var x1 = data[offs];
            var y1 = data[offs + 1];
            var z1 = data[offs + 2];

            var nx1 = data[offs + 3];
            var ny1 = data[offs + 4];
            var nz1 = data[offs + 5];

            var x2 = data[offs + 6];
            var y2 = data[offs + 7];
            var z2 = data[offs + 8];

            var nx2 = data[offs + 9];
            var ny2 = data[offs + 10];
            var nz2 = data[offs + 11];

            var x3 = data[offs + 12];
            var y3 = data[offs + 13];
            var z3 = data[offs + 14];

            var nx3 = data[offs + 15];
            var ny3 = data[offs + 16];
            var nz3 = data[offs + 17];

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
        } else if (_physijs.type === "softRopeMesh") {
          for (var _i = 0; _i < size; _i++) {
            var _offs = offsetVert + _i * 3;

            var x = data[_offs];
            var y = data[_offs + 1];
            var z = data[_offs + 2];

            volumePositions[_i * 3] = x;
            volumePositions[_i * 3 + 1] = y;
            volumePositions[_i * 3 + 2] = z;
          }

          offset += 2 + size * 3;
        } else {
          var _volumeNormals = attributes.normal.array;

          for (var _i2 = 0; _i2 < size; _i2++) {
            var _offs2 = offsetVert + _i2 * 6;

            var _x = data[_offs2];
            var _y = data[_offs2 + 1];
            var _z = data[_offs2 + 2];

            var nx = data[_offs2 + 3];
            var ny = data[_offs2 + 4];
            var nz = data[_offs2 + 5];

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
      //   this.worker.transferableMessage(data.buffer, [data.buffer]); // Give the typed array back to the worker

      this._is_simulating = false;
    }
  }, {
    key: 'updateVehicles',
    value: function updateVehicles(data) {
      var vehicle = void 0,
          wheel = void 0;

      for (var i = 0; i < (data.length - 1) / VEHICLEREPORT_ITEMSIZE; i++) {
        var offset = 1 + i * VEHICLEREPORT_ITEMSIZE;
        vehicle = this._vehicles[data[offset]];

        if (vehicle === null) continue;

        wheel = vehicle.wheels[data[offset + 1]];

        wheel.position.set(data[offset + 2], data[offset + 3], data[offset + 4]);

        wheel.quaternion.set(data[offset + 5], data[offset + 6], data[offset + 7], data[offset + 8]);
      }

      if (this.SUPPORT_TRANSFERABLE) this.worker.transferableMessage(data.buffer, [data.buffer]); // Give the typed array back to the worker
    }
  }, {
    key: 'updateConstraints',
    value: function updateConstraints(data) {
      var constraint = void 0,
          object = void 0;

      for (var i = 0; i < (data.length - 1) / CONSTRAINTREPORT_ITEMSIZE; i++) {
        var offset = 1 + i * CONSTRAINTREPORT_ITEMSIZE;
        constraint = this._constraints[data[offset]];
        object = this._objects[data[offset + 1]];

        if (constraint === undefined || object === undefined) continue;

        temp1Vector3.set(data[offset + 2], data[offset + 3], data[offset + 4]);

        temp1Matrix4.extractRotation(object.matrix);
        temp1Vector3.applyMatrix4(temp1Matrix4);

        constraint.positiona.addVectors(object.position, temp1Vector3);
        constraint.appliedImpulse = data[offset + 5];
      }

      if (this.SUPPORT_TRANSFERABLE) this.worker.transferableMessage(data.buffer, [data.buffer]); // Give the typed array back to the worker
    }
  }, {
    key: 'updateCollisions',
    value: function updateCollisions(data) {
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
      for (var i = 0; i < data[1]; i++) {
        var offset = 2 + i * COLLISIONREPORT_ITEMSIZE;
        var object = data[offset];
        var object2 = data[offset + 1];

        normal_offsets[object + '-' + object2] = offset + 2;
        normal_offsets[object2 + '-' + object] = -1 * (offset + 2);

        // Register collisions for both the object colliding and the object being collided with
        if (!collisions[object]) collisions[object] = [];
        collisions[object].push(object2);

        if (!collisions[object2]) collisions[object2] = [];
        collisions[object2].push(object);
      }

      // Deal with collisions
      for (var id1 in this._objects) {
        if (!this._objects.hasOwnProperty(id1)) continue;
        var _object = this._objects[id1];
        var component = _object.component;
        var _physijs = component._physijs;
        if (_object === null) continue;

        // If object touches anything, ...
        if (collisions[id1]) {
          // Clean up touches array
          for (var j = 0; j < _physijs.touches.length; j++) {
            if (collisions[id1].indexOf(_physijs.touches[j]) === -1) _physijs.touches.splice(j--, 1);
          }

          // Handle each colliding object
          for (var _j = 0; _j < collisions[id1].length; _j++) {
            var id2 = collisions[id1][_j];
            var _object2 = this._objects[id2];
            var component2 = _object2.component;
            var _physijs2 = component2._physijs;

            if (_object2) {
              // If object was not already touching object2, notify object
              if (_physijs.touches.indexOf(id2) === -1) {
                _physijs.touches.push(id2);

                temp1Vector3.subVectors(component.getLinearVelocity(), component2.getLinearVelocity());
                var temp1 = temp1Vector3.clone();

                temp1Vector3.subVectors(component.getAngularVelocity(), component2.getAngularVelocity());
                var temp2 = temp1Vector3.clone();

                var normal_offset = normal_offsets[_physijs.id + '-' + _physijs2.id];

                if (normal_offset > 0) {
                  temp1Vector3.set(-data[normal_offset], -data[normal_offset + 1], -data[normal_offset + 2]);
                } else {
                  normal_offset *= -1;

                  temp1Vector3.set(data[normal_offset], data[normal_offset + 1], data[normal_offset + 2]);
                }

                component.emit('collision', _object2, temp1, temp2, temp1Vector3);
              }
            }
          }
        } else _physijs.touches.length = 0; // not touching other objects
      }

      this.collisions = collisions;

      if (this.SUPPORT_TRANSFERABLE) this.worker.transferableMessage(data.buffer, [data.buffer]); // Give the typed array back to the worker
    }
  }, {
    key: 'addConstraint',
    value: function addConstraint(constraint, show_marker) {
      constraint.id = this.getObjectId();
      this._constraints[constraint.id] = constraint;
      constraint.worldModule = this;
      this.execute('addConstraint', constraint.getDefinition());

      if (show_marker) {
        var marker = void 0;

        switch (constraint.type) {
          case 'point':
            marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this._objects[constraint.objecta].add(marker);
            break;

          case 'hinge':
            marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this._objects[constraint.objecta].add(marker);
            break;

          case 'slider':
            marker = new three.Mesh(new three.BoxGeometry(10, 1, 1), new three.MeshNormalMaterial());

            marker.position.copy(constraint.positiona);

            // This rotation isn't right if all three axis are non-0 values
            // TODO: change marker's rotation order to ZYX
            marker.rotation.set(constraint.axis.y, // yes, y and
            constraint.axis.x, // x axis are swapped
            constraint.axis.z);
            this._objects[constraint.objecta].add(marker);
            break;

          case 'conetwist':
            marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this._objects[constraint.objecta].add(marker);
            break;

          case 'dof':
            marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this._objects[constraint.objecta].add(marker);
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
      if (this._constraints[constraint.id] !== undefined) {
        this.execute('removeConstraint', { id: constraint.id });
        delete this._constraints[constraint.id];
      }
    }
  }, {
    key: 'execute',
    value: function execute(cmd, params) {
      this.worker.postMessage({ cmd: cmd, params: params });
    }
  }, {
    key: 'onAddCallback',
    value: function onAddCallback(component) {
      var object = component.native;
      var _physijs = object._physijs || object.component._physijs;

      if (_physijs) {
        component.manager.set('module:world', this);
        _physijs.id = this.getObjectId();

        if (object instanceof Vehicle) {
          this.onAddCallback(object.mesh);
          this._vehicles[_physijs.id] = object;
          this.execute('addVehicle', _physijs);
        } else {
          component.__dirtyPosition = false;
          component.__dirtyRotation = false;
          this._objects[_physijs.id] = object;

          if (object.children.length) {
            _physijs.children = [];
            addObjectChildren(object, object);
          }

          if (object.material._physijs) {
            if (this._materials_ref_counts.hasOwnProperty(object.material._physijs.id)) this._materials_ref_counts[object.material._physijs.id]++;else {
              this.execute('registerMaterial', object.material._physijs);
              _physijs.materialId = object.material._physijs.id;
              this._materials_ref_counts[object.material._physijs.id] = 1;
            }
          }

          // object.quaternion.setFromEuler(object.rotation);
          //
          // console.log(object.component);
          // console.log(object.rotation);

          // Object starting position + rotation
          _physijs.position = {
            x: object.position.x,
            y: object.position.y,
            z: object.position.z
          };

          _physijs.rotation = {
            x: object.quaternion.x,
            y: object.quaternion.y,
            z: object.quaternion.z,
            w: object.quaternion.w
          };

          if (_physijs.width) _physijs.width *= object.scale.x;
          if (_physijs.height) _physijs.height *= object.scale.y;
          if (_physijs.depth) _physijs.depth *= object.scale.z;

          this.execute('addObject', _physijs);
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
        this._vehicles[object._physijs.id] = null;
      } else {
        // Mesh.prototype.remove.call(this, object);

        if (object._physijs) {
          component.manager.remove('module:world');
          this._objects[object._physijs.id] = null;
          this.execute('removeObject', { id: object._physijs.id });
        }
      }
      if (object.material && object.material._physijs && this._materials_ref_counts.hasOwnProperty(object.material._physijs.id)) {
        this._materials_ref_counts[object.material._physijs.id]--;

        if (this._materials_ref_counts[object.material._physijs.id] === 0) {
          this.execute('unRegisterMaterial', object.material._physijs);
          this._materials_ref_counts[object.material._physijs.id] = null;
        }
      }
    }
  }, {
    key: 'defer',
    value: function defer(func, args) {
      var _this2 = this;

      return new Promise(function (resolve) {
        if (_this2.isLoaded) {
          func.apply(undefined, toConsumableArray(args));
          resolve();
        } else _this2.loader.then(function () {
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
      var _this3 = this;

      var params = self.params;

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

        if (self._is_simulating) return false;

        self._is_simulating = true;

        for (var object_id in self._objects) {
          if (!self._objects.hasOwnProperty(object_id)) continue;

          var object = self._objects[object_id];
          var component = object.component;
          var _physijs = component._physijs;

          if (object !== null && (component.__dirtyPosition || component.__dirtyRotation)) {
            var update = { id: _physijs.id };

            if (component.__dirtyPosition) {
              update.pos = {
                x: object.position.x,
                y: object.position.y,
                z: object.position.z
              };

              if (_physijs.isSoftbody) object.position.set(0, 0, 0);

              component.__dirtyPosition = false;
            }

            if (component.__dirtyRotation) {
              update.quat = {
                x: object.quaternion.x,
                y: object.quaternion.y,
                z: object.quaternion.z,
                w: object.quaternion.w
              };

              if (_physijs.isSoftbody) object.rotation.set(0, 0, 0);

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
          _this3.simulate(clock.getDelta(), 1); // delta, 1
        });

        self.simulateLoop.start(_this3);

        _this3.setGravity(params.gravity);
      });
    }
  }]);
  return WorldModule;
}(Eventable);

var api = {
  // get mass() {
  //   return this._physijs.mass;
  // }

  // set mass(mass) {
  //   this._physijs.mass = mass;
  //   if (this.manager.get('module:world')) this.manager.get('module:world').execute('updateMass', {id: this._physijs.id, mass});
  // }

  applyCentralImpulse: function applyCentralImpulse(force) {
    if (this.manager.has('module:world')) this.manager.get('module:world').execute('applyCentralImpulse', { id: this._physijs.id, x: force.x, y: force.y, z: force.z });
  },
  applyImpulse: function applyImpulse(force, offset) {
    if (this.manager.has('module:world')) {
      this.manager.get('module:world').execute('applyImpulse', {
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
  applyTorque: function applyTorque(force) {
    if (this.manager.has('module:world')) {
      this.manager.get('module:world').execute('applyTorque', {
        id: this._physijs.id,
        torque_x: force.x,
        torque_y: force.y,
        torque_z: force.z
      });
    }
  },
  applyCentralForce: function applyCentralForce(force) {
    if (this.manager.has('module:world')) this.manager.get('module:world').execute('applyCentralForce', { id: this._physijs.id, x: force.x, y: force.y, z: force.z });
  },
  applyForce: function applyForce(force, offset) {
    if (this.manager.has('module:world')) {
      this.manager.get('module:world').execute('applyForce', {
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
  getAngularVelocity: function getAngularVelocity() {
    return this._physijs.angularVelocity;
  },
  setAngularVelocity: function setAngularVelocity(velocity) {
    if (this.manager.has('module:world')) this.manager.get('module:world').execute('setAngularVelocity', { id: this._physijs.id, x: velocity.x, y: velocity.y, z: velocity.z });
  },
  getLinearVelocity: function getLinearVelocity() {
    return this._physijs.linearVelocity;
  },
  setLinearVelocity: function setLinearVelocity(velocity) {
    if (this.manager.has('module:world')) this.manager.get('module:world').execute('setLinearVelocity', { id: this._physijs.id, x: velocity.x, y: velocity.y, z: velocity.z });
  },
  setAngularFactor: function setAngularFactor(factor) {
    if (this.manager.has('module:world')) this.manager.get('module:world').execute('setAngularFactor', { id: this._physijs.id, x: factor.x, y: factor.y, z: factor.z });
  },
  setLinearFactor: function setLinearFactor(factor) {
    if (this.manager.has('module:world')) this.manager.get('module:world').execute('setLinearFactor', { id: this._physijs.id, x: factor.x, y: factor.y, z: factor.z });
  },
  setDamping: function setDamping(linear, angular) {
    if (this.manager.has('module:world')) this.manager.get('module:world').execute('setDamping', { id: this._physijs.id, linear: linear, angular: angular });
  },
  setCcdMotionThreshold: function setCcdMotionThreshold(threshold) {
    if (this.manager.has('module:world')) this.manager.get('module:world').execute('setCcdMotionThreshold', { id: this._physijs.id, threshold: threshold });
  },
  setCcdSweptSphereRadius: function setCcdSweptSphereRadius(radius) {
    if (this.manager.has('module:world')) this.manager.get('module:world').execute('setCcdSweptSphereRadius', { id: this._physijs.id, radius: radius });
  }
};

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
  for (var key in api) {
    scope[key] = api[key].bind(scope);
  }

  for (var _key in properties) {
    Object.defineProperty(scope, _key, {
      get: properties[_key].get.bind(scope),
      set: properties[_key].set.bind(scope),
      configurable: true,
      enumerable: true
    });
  }
}

function onCopy(source) {
  wrapPhysicsPrototype(this);
  this._physijs = _extends({}, source._physijs);
  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();
}

function onWrap() {
  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();
}

var BoxModule = function () {
  function BoxModule(params) {
    classCallCheck(this, BoxModule);
    this.bridge = {
      geometry: function geometry(_geometry) {
        if (!_geometry.boundingBox) _geometry.computeBoundingBox();

        this._physijs.width = _geometry.boundingBox.max.x - _geometry.boundingBox.min.x;
        this._physijs.height = _geometry.boundingBox.max.y - _geometry.boundingBox.min.y;
        this._physijs.depth = _geometry.boundingBox.max.z - _geometry.boundingBox.min.z;

        return _geometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      scale: new three.Vector3(1, 1, 1),
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0
    }, params);
  }

  createClass(BoxModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'box',
        mass: params.mass,
        touches: [],
        linearVelocity: new three.Vector3(),
        angularVelocity: new three.Vector3(),
        group: params.group,
        mask: params.mask,
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        scale: params.scale,
        margin: params.margin
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return BoxModule;
}();

var CompoundModule = function () {
  function CompoundModule(params) {
    classCallCheck(this, CompoundModule);
    this.bridge = {
      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      scale: new three.Vector3(1, 1, 1),
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0
    }, params);
  }

  createClass(CompoundModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'compound',
        mass: params.mass,
        touches: [],
        linearVelocity: new three.Vector3(),
        angularVelocity: new three.Vector3(),
        group: params.group,
        mask: params.mask,
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        scale: params.scale,
        margin: params.margin
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return CompoundModule;
}();

var CapsuleModule = function () {
  function CapsuleModule(params) {
    classCallCheck(this, CapsuleModule);
    this.bridge = {
      geometry: function geometry(_geometry) {
        if (!_geometry.boundingBox) _geometry.computeBoundingBox();

        this._physijs.width = _geometry.boundingBox.max.x - _geometry.boundingBox.min.x;
        this._physijs.height = _geometry.boundingBox.max.y - _geometry.boundingBox.min.y;
        this._physijs.depth = _geometry.boundingBox.max.z - _geometry.boundingBox.min.z;

        return _geometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      height: 3,
      scale: new three.Vector3(1, 1, 1),
      radius: 3,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0
    }, params);
  }

  createClass(CapsuleModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'capsule',
        radius: Math.max(params.width / 2, params.depth / 2),
        height: params.height,
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        margin: params.margin,
        scale: params.scale,
        mass: params.mass
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return CapsuleModule;
}();

var ConcaveModule = function () {
  function ConcaveModule(params) {
    var _this2 = this;

    classCallCheck(this, ConcaveModule);
    this.bridge = {
      geometry: function geometry(_geometry, self) {
        var _this = this;

        if (self.params.path) {
          this.wait(self.geometryLoader);

          self.geometryLoader.then(function (geom) {
            _this._physijs.data = self.geometryProcessor(geom);
          });
        } else {
          this._physijs.data = self.geometryProcessor(_geometry);
        }

        return _geometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      scale: new three.Vector3(1, 1, 1),
      margin: 0,
      loader: new three.JSONLoader()
    }, params);

    if (this.params.path && this.params.loader) {
      this.geometryLoader = new Promise(function (resolve, reject) {
        _this2.params.loader.load(_this2.params.path, resolve, function () {}, reject);
      });
    }
  }

  createClass(ConcaveModule, [{
    key: 'geometryProcessor',
    value: function geometryProcessor(geometry) {
      var isBuffer = geometry.type === 'BufferGeometry';

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      var data = isBuffer ? geometry.attributes.position.array : new Float32Array(geometry.faces.length * 9);

      if (!isBuffer) {
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
  }, {
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'concave',
        mass: params.mass,
        touches: [],
        linearVelocity: new three.Vector3(),
        angularVelocity: new three.Vector3(),
        group: params.group,
        mask: params.mask,
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        margin: params.margin,
        scale: params.scale
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return ConcaveModule;
}();

var ConeModule = function () {
  function ConeModule(params) {
    classCallCheck(this, ConeModule);
    this.bridge = {
      geometry: function geometry(_geometry) {
        if (!_geometry.boundingBox) _geometry.computeBoundingBox();

        this._physijs.radius = (_geometry.boundingBox.max.x - _geometry.boundingBox.min.x) / 2;
        this._physijs.height = _geometry.boundingBox.max.y - _geometry.boundingBox.min.y;

        return _geometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      scale: new three.Vector3(1, 1, 1),
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0
    }, params);
  }

  createClass(ConeModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'cone',
        mass: params.mass,
        touches: [],
        linearVelocity: new three.Vector3(),
        angularVelocity: new three.Vector3(),
        group: params.group,
        mask: params.mask,
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        scale: params.scale,
        margin: params.margin
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return ConeModule;
}();

var ConvexModule = function () {
  function ConvexModule(params) {
    classCallCheck(this, ConvexModule);
    this.bridge = {
      mesh: function mesh(_mesh) {
        var geometry = _mesh.geometry;

        if (!geometry.boundingBox) geometry.computeBoundingBox();

        var isBuffer = geometry.type === 'BufferGeometry';

        if (!isBuffer) geometry._bufferGeometry = new three.BufferGeometry().fromGeometry(geometry);

        var data = isBuffer ? geometry.attributes.position.array : geometry._bufferGeometry.attributes.position.array;

        this._physijs.data = data;

        return _mesh;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0,
      scale: new three.Vector3(1, 1, 1)
    }, params);
  }

  createClass(ConvexModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'convex',
        mass: params.mass,
        touches: [],
        linearVelocity: new three.Vector3(),
        angularVelocity: new three.Vector3(),
        group: params.group,
        mask: params.mask,
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        margin: params.margin,
        scale: params.scale
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return ConvexModule;
}();

var CylinderModule = function () {
  function CylinderModule(params) {
    classCallCheck(this, CylinderModule);
    this.bridge = {
      geometry: function geometry(_geometry) {
        if (!_geometry.boundingBox) _geometry.computeBoundingBox();

        this._physijs.width = _geometry.boundingBox.max.x - _geometry.boundingBox.min.x;
        this._physijs.height = _geometry.boundingBox.max.y - _geometry.boundingBox.min.y;
        this._physijs.depth = _geometry.boundingBox.max.z - _geometry.boundingBox.min.z;

        return _geometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0,
      scale: new three.Vector3(1, 1, 1)
    }, params);
  }

  createClass(CylinderModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'cylinder',
        width: params.width,
        height: params.height,
        depth: params.depth,
        touches: [],
        linearVelocity: new three.Vector3(),
        angularVelocity: new three.Vector3(),
        group: params.group,
        mask: params.mask,
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        margin: params.margin,
        mass: params.mass,
        scale: params.scale
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return CylinderModule;
}();

var HeightfieldModule = function () {
  function HeightfieldModule(params) {
    classCallCheck(this, HeightfieldModule);
    this.bridge = {
      geometry: function geometry(_geometry, self) {
        var isBuffer = _geometry instanceof three.BufferGeometry;
        var verts = isBuffer ? _geometry.attributes.position.array : _geometry.vertices;

        var size = isBuffer ? verts.length / 3 : verts.length;

        if (!_geometry.boundingBox) _geometry.computeBoundingBox();

        var xdiv = self.params.size.x;
        var ydiv = self.params.size.y;

        var xsize = _geometry.boundingBox.max.x - _geometry.boundingBox.min.x;
        var ysize = _geometry.boundingBox.max.z - _geometry.boundingBox.min.z;

        this._physijs.xpts = typeof xdiv === 'undefined' ? Math.sqrt(size) : xdiv + 1;
        this._physijs.ypts = typeof ydiv === 'undefined' ? Math.sqrt(size) : ydiv + 1;

        // note - this assumes our plane geometry is square, unless we pass in specific xdiv and ydiv
        this._physijs.absMaxHeight = Math.max(_geometry.boundingBox.max.y, Math.abs(_geometry.boundingBox.min.y));

        var points = new Float32Array(size),
            xpts = this._physijs.xpts,
            ypts = this._physijs.ypts;

        while (size--) {
          var vNum = size % xpts + (ypts - Math.round(size / xpts - size % xpts / xpts) - 1) * ypts;

          if (isBuffer) points[size] = verts[vNum * 3 + 1];else points[size] = verts[vNum].y;
        }

        this._physijs.points = points;

        this._physijs.scale.multiply(new THREE.Vector3(xsize / (xpts - 1), 1, ysize / (ypts - 1)));

        if (self.params.autoAlign) _geometry.translate(xsize / -2, 0, ysize / -2);

        return _geometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      scale: new three.Vector3(1, 1, 1),
      size: new three.Vector2(1, 1),
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0,
      autoAlign: false
    }, params);
  }

  createClass(HeightfieldModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

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
        linearVelocity: new three.Vector3(),
        angularVelocity: new three.Vector3(),
        group: params.group,
        mask: params.mask
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return HeightfieldModule;
}();

var PlaneModule = function () {
  function PlaneModule(params) {
    classCallCheck(this, PlaneModule);
    this.bridge = {
      geometry: function geometry(_geometry) {
        if (!_geometry.boundingBox) _geometry.computeBoundingBox();

        this._physijs.width = _geometry.boundingBox.max.x - _geometry.boundingBox.min.x;
        this._physijs.height = _geometry.boundingBox.max.y - _geometry.boundingBox.min.y;
        this._physijs.normal = _geometry.faces[0].normal.clone();

        return _geometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      margin: 0,
      scale: new three.Vector3(1, 1, 1)
    }, params);
  }

  createClass(PlaneModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'plane',
        touches: [],
        linearVelocity: new three.Vector3(),
        angularVelocity: new three.Vector3(),
        group: params.group,
        mask: params.mask,
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        margin: params.margin,
        scale: params.scale,
        mass: params.mass
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return PlaneModule;
}();

var SphereModule = function () {
  function SphereModule(params) {
    classCallCheck(this, SphereModule);
    this.bridge = {
      geometry: function geometry(_geometry) {
        if (!_geometry.boundingSphere) _geometry.computeBoundingSphere();
        this._physijs.radius = _geometry.boundingSphere.radius;
        return _geometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      mass: 10,
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      pressure: 100,
      margin: 0,
      klst: 0.9,
      kvst: 0.9,
      kast: 0.9,
      scale: new three.Vector3(1, 1, 1)
    }, params);
  }

  createClass(SphereModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'sphere',
        touches: [],
        linearVelocity: new three.Vector3(),
        angularVelocity: new three.Vector3(),
        group: params.group,
        mask: params.mask,
        friction: params.friction,
        restitution: params.restitution,
        damping: params.damping,
        margin: params.margin,
        scale: params.scale,
        mass: params.mass
      };

      wrapPhysicsPrototype(this);
    }
  }]);
  return SphereModule;
}();

var SoftbodyModule = function () {
  function SoftbodyModule(params) {
    classCallCheck(this, SoftbodyModule);
    this.bridge = {
      geometry: function geometry(_geometry, self) {
        var idxGeometry = _geometry instanceof three.BufferGeometry ? _geometry : function () {
          _geometry.mergeVertices();

          var bufferGeometry = new three.BufferGeometry();

          bufferGeometry.addAttribute('position', new three.BufferAttribute(new Float32Array(_geometry.vertices.length * 3), 3).copyVector3sArray(_geometry.vertices));

          bufferGeometry.setIndex(new three.BufferAttribute(new (_geometry.faces.length * 3 > 65535 ? Uint32Array : Uint16Array)(_geometry.faces.length * 3), 1).copyIndicesArray(_geometry.faces));

          return bufferGeometry;
        }();

        var aVertices = idxGeometry.attributes.position.array;
        var aIndices = idxGeometry.index.array;

        this._physijs.aVertices = aVertices;
        this._physijs.aIndices = aIndices;

        var ndxGeometry = new three.BufferGeometry().fromGeometry(_geometry);

        return ndxGeometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
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
      rigidHardness: 1
    }, params);
  }

  createClass(SoftbodyModule, [{
    key: 'appendAnchor',
    value: function appendAnchor(object, node, influence) {
      var collisionBetweenLinkedBodies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var o1 = this._physijs.id;
      var o2 = object._physijs.id;

      if (this.manager.has('module:world')) this.manager.get('module:world').execute('appendAnchor', {
        obj: o1,
        obj2: o2,
        node: node,
        influence: influence,
        collisionBetweenLinkedBodies: collisionBetweenLinkedBodies
      });
    }
  }, {
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

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
  }]);
  return SoftbodyModule;
}();

var ClothModule = function () {
  function ClothModule() {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, ClothModule);
    this.bridge = {
      geometry: function geometry(_geometry, self) {
        var geomParams = _geometry.parameters;

        var geom = _geometry instanceof three.BufferGeometry ? _geometry : function () {
          _geometry.mergeVertices();

          var bufferGeometry = new three.BufferGeometry();

          bufferGeometry.addAttribute('position', new three.BufferAttribute(new Float32Array(_geometry.vertices.length * 3), 3).copyVector3sArray(_geometry.vertices));

          var faces = _geometry.faces,
              facesLength = faces.length;
          var normalsArray = new Float32Array(facesLength * 3);

          for (var i = 0; i < facesLength; i++) {
            var i3 = i * 3;
            var normal = faces[i].normal || new three.Vector3();

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

        this._physijs.corners = [verts[idx01 * 3], verts[idx01 * 3 + 1], verts[idx01 * 3 + 2], //   ╗
        verts[idx00 * 3], verts[idx00 * 3 + 1], verts[idx00 * 3 + 2], // ╔
        verts[idx11 * 3], verts[idx11 * 3 + 1], verts[idx11 * 3 + 2], //       ╝
        verts[idx10 * 3], verts[idx10 * 3 + 1], verts[idx10 * 3 + 2]];

        this._physijs.segments = [geomParams.widthSegments + 1, geomParams.heightSegments + 1];

        return geom;
      },

      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
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
    }, params);
  }

  createClass(ClothModule, [{
    key: 'appendAnchor',
    value: function appendAnchor(object, node, influence) {
      var collisionBetweenLinkedBodies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var o1 = this._physijs.id;
      var o2 = object._physijs.id;

      if (this.manager.has('module:world')) this.manager.get('module:world').execute('appendAnchor', {
        obj: o1,
        obj2: o2,
        node: node,
        influence: influence,
        collisionBetweenLinkedBodies: collisionBetweenLinkedBodies
      });
    }
  }, {
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = defineProperty({
        type: 'softClothMesh',
        mass: params.mass,
        touches: [],
        isSoftbody: true,
        scale: params.scale,
        friction: params.friction,
        damping: params.damping,
        margin: params.margin,
        klst: params.klst,
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
      }, 'scale', params.scale);

      this.appendAnchor = self.appendAnchor.bind(this);

      wrapPhysicsPrototype(this);
    }
  }]);
  return ClothModule;
}();

var RopeModule = function () {
  function RopeModule(params) {
    classCallCheck(this, RopeModule);
    this.bridge = {
      geometry: function geometry(_geometry) {
        if (!(_geometry instanceof three.BufferGeometry)) {
          _geometry = function () {
            var buff = new three.BufferGeometry();

            buff.addAttribute('position', new three.BufferAttribute(new Float32Array(_geometry.vertices.length * 3), 3).copyVector3sArray(_geometry.vertices));

            return buff;
          }();
        }

        var length = _geometry.attributes.position.array.length / 3;
        var vert = function vert(n) {
          return new three.Vector3().fromArray(_geometry.attributes.position.array, n * 3);
        };

        var v1 = vert(0);
        var v2 = vert(length - 1);

        this._physijs.data = [v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, length];

        return _geometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

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

  createClass(RopeModule, [{
    key: 'appendAnchor',
    value: function appendAnchor(object, node, influence) {
      var collisionBetweenLinkedBodies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var o1 = this._physijs.id;
      var o2 = object._physijs.id;

      if (this.manager.has('module:world')) this.manager.get('module:world').execute('appendAnchor', {
        obj: o1,
        obj2: o2,
        node: node,
        influence: influence,
        collisionBetweenLinkedBodies: collisionBetweenLinkedBodies
      });
    }
  }, {
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

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
  }]);
  return RopeModule;
}();

var _class;
var _temp;

var PI_2 = Math.PI / 2;

function FirstPersonControlsSolver(camera, mesh, params) {
  var _this = this;

  var velocityFactor = 1;
  var runVelocity = 0.25;

  mesh.setAngularFactor({ x: 0, y: 0, z: 0 });
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
        if (canJump === true) player.applyCentralImpulse({ x: 0, y: 300, z: 0 });
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

    player.applyCentralImpulse({ x: inputVelocity.x, y: 0, z: inputVelocity.z });
    player.setAngularVelocity({ x: inputVelocity.z, y: 0, z: -inputVelocity.x });
    player.setAngularFactor({ x: 0, y: 0, z: 0 });
  };

  player.on('physics:added', function () {
    player.manager.get('module:world').addEventListener('update', function () {
      if (_this.enabled === false) return;
      yawObject.position.copy(player.position);
    });
  });
}

var FirstPersonModule = (_temp = _class = function () {
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
      } else console.warn('Your browser does not support the PointerLock WHS.API.');

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
}(), _class.defaults = {
  block: null,
  speed: 1,
  ypos: 1
}, _temp);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2hzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvYXBpLmpzIiwiLi4vc3JjL2V2ZW50YWJsZS5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Db25lVHdpc3RDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0hpbmdlQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Qb2ludENvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvU2xpZGVyQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9ET0ZDb25zdHJhaW50LmpzIiwiLi4vc3JjL3ZlaGljbGUvdmVoaWNsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1dvcmxkTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvcGh5c2ljc1Byb3RvdHlwZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0JveE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbXBvdW5kTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ2Fwc3VsZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbmNhdmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db25lTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29udmV4TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ3lsaW5kZXJNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9IZWlnaHRmaWVsZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1BsYW5lTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvU3BoZXJlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvU29mdGJvZHlNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DbG90aE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1JvcGVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb250cm9scy9GaXJzdFBlcnNvbk1vZHVsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBWZWN0b3IzLFxuICBNYXRyaXg0LFxuICBRdWF0ZXJuaW9uXG59IGZyb20gJ3RocmVlJztcblxuY29uc3QgTUVTU0FHRV9UWVBFUyA9IHtcbiAgV09STERSRVBPUlQ6IDAsXG4gIENPTExJU0lPTlJFUE9SVDogMSxcbiAgVkVISUNMRVJFUE9SVDogMixcbiAgQ09OU1RSQUlOVFJFUE9SVDogMyxcbiAgU09GVFJFUE9SVDogNFxufTtcblxuY29uc3QgUkVQT1JUX0lURU1TSVpFID0gMTQsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSA9IDUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgPSA5LFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFID0gNjtcblxuY29uc3QgdGVtcDFWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDJWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDFNYXRyaXg0ID0gbmV3IE1hdHJpeDQoKSxcbiAgdGVtcDFRdWF0ID0gbmV3IFF1YXRlcm5pb24oKTtcblxuY29uc3QgZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiA9ICh4LCB5LCB6LCB3KSA9PiB7XG4gIHJldHVybiBuZXcgVmVjdG9yMyhcbiAgICBNYXRoLmF0YW4yKDIgKiAoeCAqIHcgLSB5ICogeiksICh3ICogdyAtIHggKiB4IC0geSAqIHkgKyB6ICogeikpLFxuICAgIE1hdGguYXNpbigyICogKHggKiB6ICsgeSAqIHcpKSxcbiAgICBNYXRoLmF0YW4yKDIgKiAoeiAqIHcgLSB4ICogeSksICh3ICogdyArIHggKiB4IC0geSAqIHkgLSB6ICogeikpXG4gICk7XG59O1xuXG5jb25zdCBnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyID0gKHgsIHksIHopID0+IHtcbiAgY29uc3QgYzEgPSBNYXRoLmNvcyh5KTtcbiAgY29uc3QgczEgPSBNYXRoLnNpbih5KTtcbiAgY29uc3QgYzIgPSBNYXRoLmNvcygteik7XG4gIGNvbnN0IHMyID0gTWF0aC5zaW4oLXopO1xuICBjb25zdCBjMyA9IE1hdGguY29zKHgpO1xuICBjb25zdCBzMyA9IE1hdGguc2luKHgpO1xuICBjb25zdCBjMWMyID0gYzEgKiBjMjtcbiAgY29uc3QgczFzMiA9IHMxICogczI7XG5cbiAgcmV0dXJuIHtcbiAgICB3OiBjMWMyICogYzMgLSBzMXMyICogczMsXG4gICAgeDogYzFjMiAqIHMzICsgczFzMiAqIGMzLFxuICAgIHk6IHMxICogYzIgKiBjMyArIGMxICogczIgKiBzMyxcbiAgICB6OiBjMSAqIHMyICogYzMgLSBzMSAqIGMyICogczNcbiAgfTtcbn07XG5cbmNvbnN0IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QgPSAocG9zaXRpb24sIG9iamVjdCkgPT4ge1xuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKTsgLy8gcmVzZXQgdGVtcCBtYXRyaXhcblxuICAvLyBTZXQgdGhlIHRlbXAgbWF0cml4J3Mgcm90YXRpb24gdG8gdGhlIG9iamVjdCdzIHJvdGF0aW9uXG4gIHRlbXAxTWF0cml4NC5pZGVudGl0eSgpLm1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKG9iamVjdC5xdWF0ZXJuaW9uKTtcblxuICAvLyBJbnZlcnQgcm90YXRpb24gbWF0cml4IGluIG9yZGVyIHRvIFwidW5yb3RhdGVcIiBhIHBvaW50IGJhY2sgdG8gb2JqZWN0IHNwYWNlXG4gIHRlbXAxTWF0cml4NC5nZXRJbnZlcnNlKHRlbXAxTWF0cml4NCk7XG5cbiAgLy8gWWF5ISBUZW1wIHZhcnMhXG4gIHRlbXAxVmVjdG9yMy5jb3B5KHBvc2l0aW9uKTtcbiAgdGVtcDJWZWN0b3IzLmNvcHkob2JqZWN0LnBvc2l0aW9uKTtcblxuICAvLyBBcHBseSB0aGUgcm90YXRpb25cbiAgcmV0dXJuIHRlbXAxVmVjdG9yMy5zdWIodGVtcDJWZWN0b3IzKS5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcbn07XG5cbmNvbnN0IGFkZE9iamVjdENoaWxkcmVuID0gZnVuY3Rpb24gKHBhcmVudCwgb2JqZWN0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGQgPSBvYmplY3QuY2hpbGRyZW5baV07XG4gICAgY29uc3QgX3BoeXNpanMgPSBjaGlsZC5jb21wb25lbnQuX3BoeXNpanM7XG5cbiAgICBpZiAoX3BoeXNpanMpIHtcbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgY2hpbGQudXBkYXRlTWF0cml4V29ybGQoKTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldEZyb21NYXRyaXhQb3NpdGlvbihjaGlsZC5tYXRyaXhXb3JsZCk7XG4gICAgICB0ZW1wMVF1YXQuc2V0RnJvbVJvdGF0aW9uTWF0cml4KGNoaWxkLm1hdHJpeFdvcmxkKTtcblxuICAgICAgX3BoeXNpanMucG9zaXRpb25fb2Zmc2V0ID0ge1xuICAgICAgICB4OiB0ZW1wMVZlY3RvcjMueCxcbiAgICAgICAgeTogdGVtcDFWZWN0b3IzLnksXG4gICAgICAgIHo6IHRlbXAxVmVjdG9yMy56XG4gICAgICB9O1xuXG4gICAgICBfcGh5c2lqcy5yb3RhdGlvbiA9IHtcbiAgICAgICAgeDogdGVtcDFRdWF0LngsXG4gICAgICAgIHk6IHRlbXAxUXVhdC55LFxuICAgICAgICB6OiB0ZW1wMVF1YXQueixcbiAgICAgICAgdzogdGVtcDFRdWF0LndcbiAgICAgIH07XG5cbiAgICAgIHBhcmVudC5jb21wb25lbnQuX3BoeXNpanMuY2hpbGRyZW4ucHVzaChfcGh5c2lqcyk7XG4gICAgfVxuXG4gICAgYWRkT2JqZWN0Q2hpbGRyZW4ocGFyZW50LCBjaGlsZCk7XG4gIH1cbn07XG5cbmV4cG9ydCB7XG4gIGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24sXG4gIGdldFF1YXRlcnRpb25Gcm9tRXVsZXIsXG4gIGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QsXG4gIGFkZE9iamVjdENoaWxkcmVuLFxuXG4gIE1FU1NBR0VfVFlQRVMsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFLFxuXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDJWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIHRlbXAxUXVhdFxufTtcbiIsImV4cG9ydCBjbGFzcyBFdmVudGFibGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9ldmVudExpc3RlbmVycyA9IHt9O1xuICB9XG5cbiAgYWRkRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICghdGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpXG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXSA9IFtdO1xuXG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50X25hbWUsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGluZGV4O1xuXG4gICAgaWYgKCF0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKChpbmRleCA9IHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLmluZGV4T2YoY2FsbGJhY2spKSA+PSAwKSB7XG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZGlzcGF0Y2hFdmVudChldmVudF9uYW1lKSB7XG4gICAgbGV0IGk7XG4gICAgY29uc3QgcGFyYW1ldGVycyA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgaWYgKHRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdW2ldLmFwcGx5KHRoaXMsIHBhcmFtZXRlcnMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBtYWtlKG9iaikge1xuICAgIG9iai5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IEV2ZW50YWJsZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcbiAgICBvYmoucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBFdmVudGFibGUucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG4gICAgb2JqLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gRXZlbnRhYmxlLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBDb25lVHdpc3RDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBjb25zdCBvYmplY3RiID0gb2JqYTtcblxuICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKSBjb25zb2xlLmVycm9yKCdCb3RoIG9iamVjdHMgbXVzdCBiZSBkZWZpbmVkIGluIGEgQ29uZVR3aXN0Q29uc3RyYWludC4nKTtcblxuICAgIHRoaXMudHlwZSA9ICdjb25ldHdpc3QnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpc2EgPSB7eDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24uen07XG4gICAgdGhpcy5heGlzYiA9IHt4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56fTtcbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0KHgsIHksIHopIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRMaW1pdCcsIHtjb25zdHJhaW50OiB0aGlzLmlkLCB4LCB5LCB6fSk7XG4gIH1cblxuICBlbmFibGVNb3RvcigpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9lbmFibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBzZXRNYXhNb3RvckltcHVsc2UobWF4X2ltcHVsc2UpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UnLCB7Y29uc3RyYWludDogdGhpcy5pZCwgbWF4X2ltcHVsc2V9KTtcbiAgfVxuXG4gIHNldE1vdG9yVGFyZ2V0KHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBUSFJFRS5WZWN0b3IzKVxuICAgICAgdGFyZ2V0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIobmV3IFRIUkVFLkV1bGVyKHRhcmdldC54LCB0YXJnZXQueSwgdGFyZ2V0LnopKTtcbiAgICBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBUSFJFRS5FdWxlcilcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHRhcmdldCk7XG4gICAgZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuTWF0cml4NClcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbVJvdGF0aW9uTWF0cml4KHRhcmdldCk7XG5cbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNb3RvclRhcmdldCcsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB4OiB0YXJnZXQueCxcbiAgICAgIHk6IHRhcmdldC55LFxuICAgICAgejogdGFyZ2V0LnosXG4gICAgICB3OiB0YXJnZXQud1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBIaW5nZUNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbiwgYXhpcykge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChheGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF4aXMgPSBwb3NpdGlvbjtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2hpbmdlJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLl9waHlzaWpzLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24uY2xvbmUoKTtcbiAgICB0aGlzLmF4aXMgPSBheGlzO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIuX3BoeXNpanMuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXM6IHRoaXMuYXhpc1xuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdHMobG93LCBoaWdoLCBiaWFzX2ZhY3RvciwgcmVsYXhhdGlvbl9mYWN0b3IpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdoaW5nZV9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbG93LFxuICAgICAgaGlnaCxcbiAgICAgIGJpYXNfZmFjdG9yLFxuICAgICAgcmVsYXhhdGlvbl9mYWN0b3JcbiAgICB9KTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZGlzYWJsZU1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgUG9pbnRDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAncG9pbnQnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIuX3BoeXNpanMuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYlxuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIFNsaWRlckNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbiwgYXhpcykge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChheGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF4aXMgPSBwb3NpdGlvbjtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ3NsaWRlcic7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS5fcGh5c2lqcy5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxpbl9sb3dlciwgbGluX3VwcGVyLCBhbmdfbG93ZXIsIGFuZ191cHBlcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbGluX2xvd2VyLFxuICAgICAgbGluX3VwcGVyLFxuICAgICAgYW5nX2xvd2VyLFxuICAgICAgYW5nX3VwcGVyXG4gICAgfSk7XG4gIH1cblxuICBzZXRSZXN0aXR1dGlvbihsaW5lYXIsIGFuZ3VsYXIpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKFxuICAgICAgJ3NsaWRlcl9zZXRSZXN0aXR1dGlvbicsXG4gICAgICB7XG4gICAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICAgIGxpbmVhcixcbiAgICAgICAgYW5ndWxhclxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBlbmFibGVMaW5lYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTGluZWFyTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIHRoaXMuc2NlbmUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZUFuZ3VsYXJNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIERPRkNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmICggcG9zaXRpb24gPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RvZic7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS5fcGh5c2lqcy5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QoIHBvc2l0aW9uLCBvYmplY3RhICkuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXNhID0geyB4OiBvYmplY3RhLnJvdGF0aW9uLngsIHk6IG9iamVjdGEucm90YXRpb24ueSwgejogb2JqZWN0YS5yb3RhdGlvbi56IH07XG5cbiAgICBpZiAoIG9iamVjdGIgKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YiApLmNsb25lKCk7XG4gICAgICB0aGlzLmF4aXNiID0geyB4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56IH07XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXNhOiB0aGlzLmF4aXNhLFxuICAgICAgYXhpc2I6IHRoaXMuYXhpc2JcbiAgICB9O1xuICB9XG5cbiAgc2V0TGluZWFyTG93ZXJMaW1pdChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRMaW5lYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyVXBwZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyTG93ZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZW5hYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG5cbiAgY29uZmlndXJlQW5ndWxhck1vdG9yICh3aGljaCwgbG93X2FuZ2xlLCBoaWdoX2FuZ2xlLCB2ZWxvY2l0eSwgbWF4X2ZvcmNlICkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2gsIGxvd19hbmdsZTogbG93X2FuZ2xlLCBoaWdoX2FuZ2xlOiBoaWdoX2FuZ2xlLCB2ZWxvY2l0eTogdmVsb2NpdHksIG1heF9mb3JjZTogbWF4X2ZvcmNlIH0gKTtcbiAgfVxuXG4gIGRpc2FibGVBbmd1bGFyTW90b3IgKHdoaWNoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9kaXNhYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG59XG4iLCJpbXBvcnQge01lc2h9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7VmVoaWNsZVR1bm5pbmd9IGZyb20gJy4vdHVubmluZyc7XG5cbmV4cG9ydCBjbGFzcyBWZWhpY2xlIHtcbiAgY29uc3RydWN0b3IobWVzaCwgdHVuaW5nID0gbmV3IFZlaGljbGVUdW5pbmcoKSkge1xuICAgIHRoaXMubWVzaCA9IG1lc2g7XG4gICAgdGhpcy53aGVlbHMgPSBbXTtcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICBpZDogZ2V0T2JqZWN0SWQoKSxcbiAgICAgIHJpZ2lkQm9keTogbWVzaC5fcGh5c2lqcy5pZCxcbiAgICAgIHN1c3BlbnNpb25fc3RpZmZuZXNzOiB0dW5pbmcuc3VzcGVuc2lvbl9zdGlmZm5lc3MsXG4gICAgICBzdXNwZW5zaW9uX2NvbXByZXNzaW9uOiB0dW5pbmcuc3VzcGVuc2lvbl9jb21wcmVzc2lvbixcbiAgICAgIHN1c3BlbnNpb25fZGFtcGluZzogdHVuaW5nLnN1c3BlbnNpb25fZGFtcGluZyxcbiAgICAgIG1heF9zdXNwZW5zaW9uX3RyYXZlbDogdHVuaW5nLm1heF9zdXNwZW5zaW9uX3RyYXZlbCxcbiAgICAgIGZyaWN0aW9uX3NsaXA6IHR1bmluZy5mcmljdGlvbl9zbGlwLFxuICAgICAgbWF4X3N1c3BlbnNpb25fZm9yY2U6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl9mb3JjZVxuICAgIH07XG4gIH1cblxuICBhZGRXaGVlbCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwsIGNvbm5lY3Rpb25fcG9pbnQsIHdoZWVsX2RpcmVjdGlvbiwgd2hlZWxfYXhsZSwgc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCwgd2hlZWxfcmFkaXVzLCBpc19mcm9udF93aGVlbCwgdHVuaW5nKSB7XG4gICAgY29uc3Qgd2hlZWwgPSBuZXcgTWVzaCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwpO1xuXG4gICAgd2hlZWwuY2FzdFNoYWRvdyA9IHdoZWVsLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgIHdoZWVsLnBvc2l0aW9uLmNvcHkod2hlZWxfZGlyZWN0aW9uKS5tdWx0aXBseVNjYWxhcihzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoIC8gMTAwKS5hZGQoY29ubmVjdGlvbl9wb2ludCk7XG5cbiAgICB0aGlzLndvcmxkLmFkZCh3aGVlbCk7XG4gICAgdGhpcy53aGVlbHMucHVzaCh3aGVlbCk7XG5cbiAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FkZFdoZWVsJywge1xuICAgICAgaWQ6IHRoaXMuX3BoeXNpanMuaWQsXG4gICAgICBjb25uZWN0aW9uX3BvaW50OiB7eDogY29ubmVjdGlvbl9wb2ludC54LCB5OiBjb25uZWN0aW9uX3BvaW50LnksIHo6IGNvbm5lY3Rpb25fcG9pbnQuen0sXG4gICAgICB3aGVlbF9kaXJlY3Rpb246IHt4OiB3aGVlbF9kaXJlY3Rpb24ueCwgeTogd2hlZWxfZGlyZWN0aW9uLnksIHo6IHdoZWVsX2RpcmVjdGlvbi56fSxcbiAgICAgIHdoZWVsX2F4bGU6IHt4OiB3aGVlbF9heGxlLngsIHk6IHdoZWVsX2F4bGUueSwgejogd2hlZWxfYXhsZS56fSxcbiAgICAgIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsXG4gICAgICB3aGVlbF9yYWRpdXMsXG4gICAgICBpc19mcm9udF93aGVlbCxcbiAgICAgIHR1bmluZ1xuICAgIH0pO1xuICB9XG5cbiAgc2V0U3RlZXJpbmcoYW1vdW50LCB3aGVlbCkge1xuICAgIGlmICh3aGVlbCAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2hlZWxzW3doZWVsXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldFN0ZWVyaW5nJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgc3RlZXJpbmc6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxuXG4gIHNldEJyYWtlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBicmFrZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRCcmFrZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIGJyYWtlOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBhcHBseUVuZ2luZUZvcmNlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnYXBwbHlFbmdpbmVGb3JjZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIGZvcmNlOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBmb3JjZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQge1xuICBTY2VuZSBhcyBTY2VuZU5hdGl2ZSxcbiAgTWVzaCxcbiAgU3BoZXJlR2VvbWV0cnksXG4gIE1lc2hOb3JtYWxNYXRlcmlhbCxcbiAgQm94R2VvbWV0cnksXG4gIFZlY3RvcjNcbn0gZnJvbSAndGhyZWUnO1xuXG5pbXBvcnQge0xvb3B9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7VmVoaWNsZX0gZnJvbSAnLi4vdmVoaWNsZS92ZWhpY2xlJztcbmltcG9ydCB7RXZlbnRhYmxlfSBmcm9tICcuLi9ldmVudGFibGUnO1xuXG5pbXBvcnQge1xuICBhZGRPYmplY3RDaGlsZHJlbixcbiAgTUVTU0FHRV9UWVBFUyxcbiAgdGVtcDFWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFXG59IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBXb3JsZE1vZHVsZSBleHRlbmRzIEV2ZW50YWJsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgZml4ZWRUaW1lU3RlcDogMS82MCxcbiAgICAgIHJhdGVMaW1pdDogdHJ1ZSxcbiAgICAgIGFtbW86IFwiXCIsXG4gICAgICBzb2Z0Ym9keTogZmFsc2UsXG4gICAgICBncmF2aXR5OiBuZXcgVmVjdG9yMygwLCAtMTAwLCAwKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgdGhpcy53b3JrZXIgPSBuZXcgKHJlcXVpcmUoJ3dvcmtlci1sb2FkZXI/aW5saW5lLG5hbWU9d29ya2VyLmpzIS4uL3dvcmtlci5qcycpKSgpO1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UgPSB0aGlzLndvcmtlci53ZWJraXRQb3N0TWVzc2FnZSB8fCB0aGlzLndvcmtlci5wb3N0TWVzc2FnZTtcblxuICAgIHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcblxuICAgIHRoaXMubG9hZGVyID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHBhcmFtcy53YXNtKSB7XG4gICAgICAgIGZldGNoKHBhcmFtcy53YXNtKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmFycmF5QnVmZmVyKCkpXG4gICAgICAgICAgLnRoZW4oYnVmZmVyID0+IHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1zLndhc21CdWZmZXIgPSBidWZmZXI7XG5cbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZSgnaW5pdCcsIHRoaXMucGFyYW1zKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUGh5c2ljcyBsb2FkaW5nIHRpbWU6IFwiICsgKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpICsgXCJtc1wiKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgnaW5pdCcsIHRoaXMucGFyYW1zKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2FkZXIudGhlbigoKSA9PiB7dGhpcy5pc0xvYWRlZCA9IHRydWV9KTtcblxuICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzID0ge307XG4gICAgdGhpcy5fb2JqZWN0cyA9IHt9O1xuICAgIHRoaXMuX3ZlaGljbGVzID0ge307XG4gICAgdGhpcy5fY29uc3RyYWludHMgPSB7fTtcbiAgICB0aGlzLl9pc19zaW11bGF0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5nZXRPYmplY3RJZCA9ICgoKSA9PiB7XG4gICAgICBsZXQgX2lkID0gMTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBfaWQrKztcbiAgICAgIH07XG4gICAgfSkoKTtcblxuICAgIC8vIFRlc3QgU1VQUE9SVF9UUkFOU0ZFUkFCTEVcblxuICAgIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKDEpO1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoYWIsIFthYl0pO1xuICAgIHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUgPSAoYWIuYnl0ZUxlbmd0aCA9PT0gMCk7XG5cbiAgICB0aGlzLndvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgIGxldCBfdGVtcCxcbiAgICAgICAgZGF0YSA9IGV2ZW50LmRhdGE7XG5cbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgJiYgZGF0YS5ieXRlTGVuZ3RoICE9PSAxKS8vIGJ5dGVMZW5ndGggPT09IDEgaXMgdGhlIHdvcmtlciBtYWtpbmcgYSBTVVBQT1JUX1RSQU5TRkVSQUJMRSB0ZXN0XG4gICAgICAgIGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICAvLyB0cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgICAgIHN3aXRjaCAoZGF0YVswXSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2NlbmUoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTb2Z0Ym9kaWVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5jbWQpIHtcbiAgICAgICAgLy8gbm9uLXRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICAgICAgc3dpdGNoIChkYXRhLmNtZCkge1xuICAgICAgICAgIGNhc2UgJ29iamVjdFJlYWR5JzpcbiAgICAgICAgICAgIF90ZW1wID0gZGF0YS5wYXJhbXM7XG4gICAgICAgICAgICBpZiAodGhpcy5fb2JqZWN0c1tfdGVtcF0pIHRoaXMuX29iamVjdHNbX3RlbXBdLmRpc3BhdGNoRXZlbnQoJ3JlYWR5Jyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ3dvcmxkUmVhZHknOlxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICdhbW1vTG9hZGVkJzpcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnbG9hZGVkJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBoeXNpY3MgbG9hZGluZyB0aW1lOiBcIiArIChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSArIFwibXNcIik7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ3ZlaGljbGUnOlxuICAgICAgICAgICAgd2luZG93LnRlc3QgPSBkYXRhO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gRG8gbm90aGluZywganVzdCBzaG93IHRoZSBtZXNzYWdlXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBSZWNlaXZlZDogJHtkYXRhLmNtZH1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKGRhdGEucGFyYW1zKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzd2l0Y2ggKGRhdGFbMF0pIHtcbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNjZW5lKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgdXBkYXRlU2NlbmUoZGF0YSkge1xuICAgIGxldCBpbmRleCA9IGRhdGFbMV07XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIGluZGV4ICogUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tkYXRhW29mZnNldF1dO1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgIGNvbnN0IF9waHlzaWpzID0gY29tcG9uZW50Ll9waHlzaWpzO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPT09IGZhbHNlKSB7XG4gICAgICAgIG9iamVjdC5wb3NpdGlvbi5zZXQoXG4gICAgICAgICAgZGF0YVtvZmZzZXQgKyAxXSxcbiAgICAgICAgICBkYXRhW29mZnNldCArIDJdLFxuICAgICAgICAgIGRhdGFbb2Zmc2V0ICsgM11cbiAgICAgICAgKTtcblxuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID09PSBmYWxzZSkge1xuICAgICAgICBvYmplY3QucXVhdGVybmlvbi5zZXQoXG4gICAgICAgICAgZGF0YVtvZmZzZXQgKyA0XSxcbiAgICAgICAgICBkYXRhW29mZnNldCArIDVdLFxuICAgICAgICAgIGRhdGFbb2Zmc2V0ICsgNl0sXG4gICAgICAgICAgZGF0YVtvZmZzZXQgKyA3XVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgX3BoeXNpanMubGluZWFyVmVsb2NpdHkuc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDhdLFxuICAgICAgICBkYXRhW29mZnNldCArIDldLFxuICAgICAgICBkYXRhW29mZnNldCArIDEwXVxuICAgICAgKTtcblxuICAgICAgX3BoeXNpanMuYW5ndWxhclZlbG9jaXR5LnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAxMV0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgMTJdLFxuICAgICAgICBkYXRhW29mZnNldCArIDEzXVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcblxuICAgIHRoaXMuX2lzX3NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3VwZGF0ZScpO1xuICB9XG5cbiAgdXBkYXRlU29mdGJvZGllcyhkYXRhKSB7XG4gICAgbGV0IGluZGV4ID0gZGF0YVsxXSxcbiAgICAgIG9mZnNldCA9IDI7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgc2l6ZSA9IGRhdGFbb2Zmc2V0ICsgMV07XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLl9vYmplY3RzW2RhdGFbb2Zmc2V0XV07XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBfcGh5c2lqcyA9IG9iamVjdC5jb21wb25lbnQuX3BoeXNpanM7XG5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBvYmplY3QuZ2VvbWV0cnkuYXR0cmlidXRlcztcbiAgICAgIGNvbnN0IHZvbHVtZVBvc2l0aW9ucyA9IGF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIGNvbnN0IG9mZnNldFZlcnQgPSBvZmZzZXQgKyAyO1xuXG4gICAgICBpZiAoIV9waHlzaWpzLmlzU29mdEJvZHlSZXNldCkge1xuICAgICAgICBvYmplY3QucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICBvYmplY3QucXVhdGVybmlvbi5zZXQoMCwgMCwgMCwgMCk7XG5cbiAgICAgICAgX3BoeXNpanMuaXNTb2Z0Qm9keVJlc2V0ID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKF9waHlzaWpzLnR5cGUgPT09IFwic29mdFRyaW1lc2hcIikge1xuICAgICAgICBjb25zdCB2b2x1bWVOb3JtYWxzID0gYXR0cmlidXRlcy5ub3JtYWwuYXJyYXk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiAxODtcblxuICAgICAgICAgIGNvbnN0IHgxID0gZGF0YVtvZmZzXTtcbiAgICAgICAgICBjb25zdCB5MSA9IGRhdGFbb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHoxID0gZGF0YVtvZmZzICsgMl07XG5cbiAgICAgICAgICBjb25zdCBueDEgPSBkYXRhW29mZnMgKyAzXTtcbiAgICAgICAgICBjb25zdCBueTEgPSBkYXRhW29mZnMgKyA0XTtcbiAgICAgICAgICBjb25zdCBuejEgPSBkYXRhW29mZnMgKyA1XTtcblxuICAgICAgICAgIGNvbnN0IHgyID0gZGF0YVtvZmZzICsgNl07XG4gICAgICAgICAgY29uc3QgeTIgPSBkYXRhW29mZnMgKyA3XTtcbiAgICAgICAgICBjb25zdCB6MiA9IGRhdGFbb2ZmcyArIDhdO1xuXG4gICAgICAgICAgY29uc3QgbngyID0gZGF0YVtvZmZzICsgOV07XG4gICAgICAgICAgY29uc3QgbnkyID0gZGF0YVtvZmZzICsgMTBdO1xuICAgICAgICAgIGNvbnN0IG56MiA9IGRhdGFbb2ZmcyArIDExXTtcblxuICAgICAgICAgIGNvbnN0IHgzID0gZGF0YVtvZmZzICsgMTJdO1xuICAgICAgICAgIGNvbnN0IHkzID0gZGF0YVtvZmZzICsgMTNdO1xuICAgICAgICAgIGNvbnN0IHozID0gZGF0YVtvZmZzICsgMTRdO1xuXG4gICAgICAgICAgY29uc3QgbngzID0gZGF0YVtvZmZzICsgMTVdO1xuICAgICAgICAgIGNvbnN0IG55MyA9IGRhdGFbb2ZmcyArIDE2XTtcbiAgICAgICAgICBjb25zdCBuejMgPSBkYXRhW29mZnMgKyAxN107XG5cbiAgICAgICAgICBjb25zdCBpOSA9IGkgKiA5O1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5XSA9IHgxO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDFdID0geTE7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgMl0gPSB6MTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDNdID0geDI7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNF0gPSB5MjtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA1XSA9IHoyO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNl0gPSB4MztcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA3XSA9IHkzO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDhdID0gejM7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5XSA9IG54MTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgMV0gPSBueTE7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDJdID0gbnoxO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDNdID0gbngyO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA0XSA9IG55MjtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNV0gPSBuejI7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNl0gPSBueDM7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDddID0gbnkzO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA4XSA9IG56MztcbiAgICAgICAgfVxuXG4gICAgICAgIGF0dHJpYnV0ZXMubm9ybWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgb2Zmc2V0ICs9IDIgKyBzaXplICogMTg7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChfcGh5c2lqcy50eXBlID09PSBcInNvZnRSb3BlTWVzaFwiKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogMztcblxuICAgICAgICAgIGNvbnN0IHggPSBkYXRhW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkgPSBkYXRhW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6ID0gZGF0YVtvZmZzICsgMl07XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDNdID0geDtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAxXSA9IHk7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMl0gPSB6O1xuICAgICAgICB9XG5cbiAgICAgICAgb2Zmc2V0ICs9IDIgKyBzaXplICogMztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZvbHVtZU5vcm1hbHMgPSBhdHRyaWJ1dGVzLm5vcm1hbC5hcnJheTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDY7XG5cbiAgICAgICAgICBjb25zdCB4ID0gZGF0YVtvZmZzXTtcbiAgICAgICAgICBjb25zdCB5ID0gZGF0YVtvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgeiA9IGRhdGFbb2ZmcyArIDJdO1xuXG4gICAgICAgICAgY29uc3QgbnggPSBkYXRhW29mZnMgKyAzXTtcbiAgICAgICAgICBjb25zdCBueSA9IGRhdGFbb2ZmcyArIDRdO1xuICAgICAgICAgIGNvbnN0IG56ID0gZGF0YVtvZmZzICsgNV07XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDNdID0geDtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAxXSA9IHk7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMl0gPSB6O1xuXG4gICAgICAgICAgLy8gRklYTUU6IE5vcm1hbHMgYXJlIHBvaW50ZWQgdG8gbG9vayBpbnNpZGU7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogM10gPSBueDtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2kgKiAzICsgMV0gPSBueTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2kgKiAzICsgMl0gPSBuejtcbiAgICAgICAgfVxuXG4gICAgICAgIGF0dHJpYnV0ZXMubm9ybWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgb2Zmc2V0ICs9IDIgKyBzaXplICogNjtcbiAgICAgIH1cblxuICAgICAgYXR0cmlidXRlcy5wb3NpdGlvbi5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgLy8gICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG5cbiAgICB0aGlzLl9pc19zaW11bGF0aW5nID0gZmFsc2U7XG4gIH1cblxuICB1cGRhdGVWZWhpY2xlcyhkYXRhKSB7XG4gICAgbGV0IHZlaGljbGUsIHdoZWVsO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZGF0YS5sZW5ndGggLSAxKSAvIFZFSElDTEVSRVBPUlRfSVRFTVNJWkU7IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMSArIGkgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFO1xuICAgICAgdmVoaWNsZSA9IHRoaXMuX3ZlaGljbGVzW2RhdGFbb2Zmc2V0XV07XG5cbiAgICAgIGlmICh2ZWhpY2xlID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgd2hlZWwgPSB2ZWhpY2xlLndoZWVsc1tkYXRhW29mZnNldCArIDFdXTtcblxuICAgICAgd2hlZWwucG9zaXRpb24uc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDJdLFxuICAgICAgICBkYXRhW29mZnNldCArIDNdLFxuICAgICAgICBkYXRhW29mZnNldCArIDRdXG4gICAgICApO1xuXG4gICAgICB3aGVlbC5xdWF0ZXJuaW9uLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA1XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA2XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA3XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA4XVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIHVwZGF0ZUNvbnN0cmFpbnRzKGRhdGEpIHtcbiAgICBsZXQgY29uc3RyYWludCwgb2JqZWN0O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZGF0YS5sZW5ndGggLSAxKSAvIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMSArIGkgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3RyYWludCA9IHRoaXMuX2NvbnN0cmFpbnRzW2RhdGFbb2Zmc2V0XV07XG4gICAgICBvYmplY3QgPSB0aGlzLl9vYmplY3RzW2RhdGFbb2Zmc2V0ICsgMV1dO1xuXG4gICAgICBpZiAoY29uc3RyYWludCA9PT0gdW5kZWZpbmVkIHx8IG9iamVjdCA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAzXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA0XVxuICAgICAgKTtcblxuICAgICAgdGVtcDFNYXRyaXg0LmV4dHJhY3RSb3RhdGlvbihvYmplY3QubWF0cml4KTtcbiAgICAgIHRlbXAxVmVjdG9yMy5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcblxuICAgICAgY29uc3RyYWludC5wb3NpdGlvbmEuYWRkVmVjdG9ycyhvYmplY3QucG9zaXRpb24sIHRlbXAxVmVjdG9yMyk7XG4gICAgICBjb25zdHJhaW50LmFwcGxpZWRJbXB1bHNlID0gZGF0YVtvZmZzZXQgKyA1XTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIHVwZGF0ZUNvbGxpc2lvbnMoZGF0YSkge1xuICAgIC8qKlxuICAgICAqICNUT0RPXG4gICAgICogVGhpcyBpcyBwcm9iYWJseSB0aGUgd29yc3Qgd2F5IGV2ZXIgdG8gaGFuZGxlIGNvbGxpc2lvbnMuIFRoZSBpbmhlcmVudCBldmlsbmVzcyBpcyBhIHJlc2lkdWFsXG4gICAgICogZWZmZWN0IGZyb20gdGhlIHByZXZpb3VzIHZlcnNpb24ncyBldmlsbmVzcyB3aGljaCBtdXRhdGVkIHdoZW4gc3dpdGNoaW5nIHRvIHRyYW5zZmVyYWJsZSBvYmplY3RzLlxuICAgICAqXG4gICAgICogSWYgeW91IGZlZWwgaW5jbGluZWQgdG8gbWFrZSB0aGlzIGJldHRlciwgcGxlYXNlIGRvIHNvLlxuICAgICAqL1xuXG4gICAgY29uc3QgY29sbGlzaW9ucyA9IHt9LFxuICAgICAgbm9ybWFsX29mZnNldHMgPSB7fTtcblxuICAgIC8vIEJ1aWxkIGNvbGxpc2lvbiBtYW5pZmVzdFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVsxXTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgaSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IGRhdGFbb2Zmc2V0XTtcbiAgICAgIGNvbnN0IG9iamVjdDIgPSBkYXRhW29mZnNldCArIDFdO1xuXG4gICAgICBub3JtYWxfb2Zmc2V0c1tgJHtvYmplY3R9LSR7b2JqZWN0Mn1gXSA9IG9mZnNldCArIDI7XG4gICAgICBub3JtYWxfb2Zmc2V0c1tgJHtvYmplY3QyfS0ke29iamVjdH1gXSA9IC0xICogKG9mZnNldCArIDIpO1xuXG4gICAgICAvLyBSZWdpc3RlciBjb2xsaXNpb25zIGZvciBib3RoIHRoZSBvYmplY3QgY29sbGlkaW5nIGFuZCB0aGUgb2JqZWN0IGJlaW5nIGNvbGxpZGVkIHdpdGhcbiAgICAgIGlmICghY29sbGlzaW9uc1tvYmplY3RdKSBjb2xsaXNpb25zW29iamVjdF0gPSBbXTtcbiAgICAgIGNvbGxpc2lvbnNbb2JqZWN0XS5wdXNoKG9iamVjdDIpO1xuXG4gICAgICBpZiAoIWNvbGxpc2lvbnNbb2JqZWN0Ml0pIGNvbGxpc2lvbnNbb2JqZWN0Ml0gPSBbXTtcbiAgICAgIGNvbGxpc2lvbnNbb2JqZWN0Ml0ucHVzaChvYmplY3QpO1xuICAgIH1cblxuICAgIC8vIERlYWwgd2l0aCBjb2xsaXNpb25zXG4gICAgZm9yIChjb25zdCBpZDEgaW4gdGhpcy5fb2JqZWN0cykge1xuICAgICAgaWYgKCF0aGlzLl9vYmplY3RzLmhhc093blByb3BlcnR5KGlkMSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tpZDFdO1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgIGNvbnN0IF9waHlzaWpzID0gY29tcG9uZW50Ll9waHlzaWpzO1xuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIC8vIElmIG9iamVjdCB0b3VjaGVzIGFueXRoaW5nLCAuLi5cbiAgICAgIGlmIChjb2xsaXNpb25zW2lkMV0pIHtcbiAgICAgICAgLy8gQ2xlYW4gdXAgdG91Y2hlcyBhcnJheVxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IF9waHlzaWpzLnRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAoY29sbGlzaW9uc1tpZDFdLmluZGV4T2YoX3BoeXNpanMudG91Y2hlc1tqXSkgPT09IC0xKVxuICAgICAgICAgICAgX3BoeXNpanMudG91Y2hlcy5zcGxpY2Uoai0tLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBlYWNoIGNvbGxpZGluZyBvYmplY3RcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb2xsaXNpb25zW2lkMV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBpZDIgPSBjb2xsaXNpb25zW2lkMV1bal07XG4gICAgICAgICAgY29uc3Qgb2JqZWN0MiA9IHRoaXMuX29iamVjdHNbaWQyXTtcbiAgICAgICAgICBjb25zdCBjb21wb25lbnQyID0gb2JqZWN0Mi5jb21wb25lbnQ7XG4gICAgICAgICAgY29uc3QgX3BoeXNpanMyID0gY29tcG9uZW50Mi5fcGh5c2lqcztcblxuICAgICAgICAgIGlmIChvYmplY3QyKSB7XG4gICAgICAgICAgICAvLyBJZiBvYmplY3Qgd2FzIG5vdCBhbHJlYWR5IHRvdWNoaW5nIG9iamVjdDIsIG5vdGlmeSBvYmplY3RcbiAgICAgICAgICAgIGlmIChfcGh5c2lqcy50b3VjaGVzLmluZGV4T2YoaWQyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgX3BoeXNpanMudG91Y2hlcy5wdXNoKGlkMik7XG5cbiAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnN1YlZlY3RvcnMoY29tcG9uZW50LmdldExpbmVhclZlbG9jaXR5KCksIGNvbXBvbmVudDIuZ2V0TGluZWFyVmVsb2NpdHkoKSk7XG4gICAgICAgICAgICAgIGNvbnN0IHRlbXAxID0gdGVtcDFWZWN0b3IzLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnN1YlZlY3RvcnMoY29tcG9uZW50LmdldEFuZ3VsYXJWZWxvY2l0eSgpLCBjb21wb25lbnQyLmdldEFuZ3VsYXJWZWxvY2l0eSgpKTtcbiAgICAgICAgICAgICAgY29uc3QgdGVtcDIgPSB0ZW1wMVZlY3RvcjMuY2xvbmUoKTtcblxuICAgICAgICAgICAgICBsZXQgbm9ybWFsX29mZnNldCA9IG5vcm1hbF9vZmZzZXRzW2Ake19waHlzaWpzLmlkfS0ke19waHlzaWpzMi5pZH1gXTtcblxuICAgICAgICAgICAgICBpZiAobm9ybWFsX29mZnNldCA+IDApIHtcbiAgICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICAgICAgICAgICAgLWRhdGFbbm9ybWFsX29mZnNldF0sXG4gICAgICAgICAgICAgICAgICAtZGF0YVtub3JtYWxfb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgICAgICAgICAtZGF0YVtub3JtYWxfb2Zmc2V0ICsgMl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vcm1hbF9vZmZzZXQgKj0gLTE7XG5cbiAgICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICAgICAgICAgICAgZGF0YVtub3JtYWxfb2Zmc2V0XSxcbiAgICAgICAgICAgICAgICAgIGRhdGFbbm9ybWFsX29mZnNldCArIDFdLFxuICAgICAgICAgICAgICAgICAgZGF0YVtub3JtYWxfb2Zmc2V0ICsgMl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29tcG9uZW50LmVtaXQoJ2NvbGxpc2lvbicsIG9iamVjdDIsIHRlbXAxLCB0ZW1wMiwgdGVtcDFWZWN0b3IzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBfcGh5c2lqcy50b3VjaGVzLmxlbmd0aCA9IDA7IC8vIG5vdCB0b3VjaGluZyBvdGhlciBvYmplY3RzXG4gICAgfVxuXG4gICAgdGhpcy5jb2xsaXNpb25zID0gY29sbGlzaW9ucztcblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgYWRkQ29uc3RyYWludChjb25zdHJhaW50LCBzaG93X21hcmtlcikge1xuICAgIGNvbnN0cmFpbnQuaWQgPSB0aGlzLmdldE9iamVjdElkKCk7XG4gICAgdGhpcy5fY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gPSBjb25zdHJhaW50O1xuICAgIGNvbnN0cmFpbnQud29ybGRNb2R1bGUgPSB0aGlzO1xuICAgIHRoaXMuZXhlY3V0ZSgnYWRkQ29uc3RyYWludCcsIGNvbnN0cmFpbnQuZ2V0RGVmaW5pdGlvbigpKTtcblxuICAgIGlmIChzaG93X21hcmtlcikge1xuICAgICAgbGV0IG1hcmtlcjtcblxuICAgICAgc3dpdGNoIChjb25zdHJhaW50LnR5cGUpIHtcbiAgICAgICAgY2FzZSAncG9pbnQnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMuX29iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdoaW5nZSc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NsaWRlcic6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgQm94R2VvbWV0cnkoMTAsIDEsIDEpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcblxuICAgICAgICAgIC8vIFRoaXMgcm90YXRpb24gaXNuJ3QgcmlnaHQgaWYgYWxsIHRocmVlIGF4aXMgYXJlIG5vbi0wIHZhbHVlc1xuICAgICAgICAgIC8vIFRPRE86IGNoYW5nZSBtYXJrZXIncyByb3RhdGlvbiBvcmRlciB0byBaWVhcbiAgICAgICAgICBtYXJrZXIucm90YXRpb24uc2V0KFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLnksIC8vIHllcywgeSBhbmRcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy54LCAvLyB4IGF4aXMgYXJlIHN3YXBwZWRcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy56XG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnY29uZXR3aXN0JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnZG9mJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnN0cmFpbnQ7XG4gIH1cblxuICBvblNpbXVsYXRpb25SZXN1bWUoKSB7XG4gICAgdGhpcy5leGVjdXRlKCdvblNpbXVsYXRpb25SZXN1bWUnLCB7fSk7XG4gIH1cblxuICByZW1vdmVDb25zdHJhaW50KGNvbnN0cmFpbnQpIHtcbiAgICBpZiAodGhpcy5fY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVDb25zdHJhaW50Jywge2lkOiBjb25zdHJhaW50LmlkfSk7XG4gICAgICBkZWxldGUgdGhpcy5fY29uc3RyYWludHNbY29uc3RyYWludC5pZF07XG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZShjbWQsIHBhcmFtcykge1xuICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKHtjbWQsIHBhcmFtc30pO1xuICB9XG5cbiAgb25BZGRDYWxsYmFjayhjb21wb25lbnQpIHtcbiAgICBjb25zdCBvYmplY3QgPSBjb21wb25lbnQubmF0aXZlO1xuICAgIGNvbnN0IF9waHlzaWpzID0gb2JqZWN0Ll9waHlzaWpzIHx8IG9iamVjdC5jb21wb25lbnQuX3BoeXNpanM7XG5cbiAgICBpZiAoX3BoeXNpanMpIHtcbiAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnNldCgnbW9kdWxlOndvcmxkJywgdGhpcyk7XG4gICAgICBfcGh5c2lqcy5pZCA9IHRoaXMuZ2V0T2JqZWN0SWQoKTtcblxuICAgICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFZlaGljbGUpIHtcbiAgICAgICAgdGhpcy5vbkFkZENhbGxiYWNrKG9iamVjdC5tZXNoKTtcbiAgICAgICAgdGhpcy5fdmVoaWNsZXNbX3BoeXNpanMuaWRdID0gb2JqZWN0O1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2FkZFZlaGljbGUnLCBfcGh5c2lqcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fb2JqZWN0c1tfcGh5c2lqcy5pZF0gPSBvYmplY3Q7XG5cbiAgICAgICAgaWYgKG9iamVjdC5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICBfcGh5c2lqcy5jaGlsZHJlbiA9IFtdO1xuICAgICAgICAgIGFkZE9iamVjdENoaWxkcmVuKG9iamVjdCwgb2JqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMpIHtcbiAgICAgICAgICBpZiAodGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHMuaGFzT3duUHJvcGVydHkob2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkKSlcbiAgICAgICAgICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0rKztcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZSgncmVnaXN0ZXJNYXRlcmlhbCcsIG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcyk7XG4gICAgICAgICAgICBfcGh5c2lqcy5tYXRlcmlhbElkID0gb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkO1xuICAgICAgICAgICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXSA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gb2JqZWN0LnF1YXRlcm5pb24uc2V0RnJvbUV1bGVyKG9iamVjdC5yb3RhdGlvbik7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdC5jb21wb25lbnQpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhvYmplY3Qucm90YXRpb24pO1xuXG4gICAgICAgIC8vIE9iamVjdCBzdGFydGluZyBwb3NpdGlvbiArIHJvdGF0aW9uXG4gICAgICAgIF9waHlzaWpzLnBvc2l0aW9uID0ge1xuICAgICAgICAgIHg6IG9iamVjdC5wb3NpdGlvbi54LFxuICAgICAgICAgIHk6IG9iamVjdC5wb3NpdGlvbi55LFxuICAgICAgICAgIHo6IG9iamVjdC5wb3NpdGlvbi56XG4gICAgICAgIH07XG5cbiAgICAgICAgX3BoeXNpanMucm90YXRpb24gPSB7XG4gICAgICAgICAgeDogb2JqZWN0LnF1YXRlcm5pb24ueCxcbiAgICAgICAgICB5OiBvYmplY3QucXVhdGVybmlvbi55LFxuICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgdzogb2JqZWN0LnF1YXRlcm5pb24ud1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChfcGh5c2lqcy53aWR0aCkgX3BoeXNpanMud2lkdGggKj0gb2JqZWN0LnNjYWxlLng7XG4gICAgICAgIGlmIChfcGh5c2lqcy5oZWlnaHQpIF9waHlzaWpzLmhlaWdodCAqPSBvYmplY3Quc2NhbGUueTtcbiAgICAgICAgaWYgKF9waHlzaWpzLmRlcHRoKSBfcGh5c2lqcy5kZXB0aCAqPSBvYmplY3Quc2NhbGUuejtcblxuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2FkZE9iamVjdCcsIF9waHlzaWpzKTtcbiAgICAgIH1cblxuICAgICAgY29tcG9uZW50LmVtaXQoJ3BoeXNpY3M6YWRkZWQnKTtcbiAgICB9XG4gIH1cblxuICBvblJlbW92ZUNhbGxiYWNrKGNvbXBvbmVudCkge1xuICAgIGNvbnN0IG9iamVjdCA9IGNvbXBvbmVudC5uYXRpdmU7XG5cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVmVoaWNsZSkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVWZWhpY2xlJywge2lkOiBvYmplY3QuX3BoeXNpanMuaWR9KTtcbiAgICAgIHdoaWxlIChvYmplY3Qud2hlZWxzLmxlbmd0aCkgdGhpcy5yZW1vdmUob2JqZWN0LndoZWVscy5wb3AoKSk7XG5cbiAgICAgIHRoaXMucmVtb3ZlKG9iamVjdC5tZXNoKTtcbiAgICAgIHRoaXMuX3ZlaGljbGVzW29iamVjdC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNZXNoLnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzLCBvYmplY3QpO1xuXG4gICAgICBpZiAob2JqZWN0Ll9waHlzaWpzKSB7XG4gICAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnJlbW92ZSgnbW9kdWxlOndvcmxkJyk7XG4gICAgICAgIHRoaXMuX29iamVjdHNbb2JqZWN0Ll9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlT2JqZWN0Jywge2lkOiBvYmplY3QuX3BoeXNpanMuaWR9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9iamVjdC5tYXRlcmlhbCAmJiBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMgJiYgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHMuaGFzT3duUHJvcGVydHkob2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkKSkge1xuICAgICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXS0tO1xuXG4gICAgICBpZiAodGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXSA9PT0gMCkge1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ3VuUmVnaXN0ZXJNYXRlcmlhbCcsIG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcyk7XG4gICAgICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRlZmVyKGZ1bmMsIGFyZ3MpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzTG9hZGVkKSB7XG4gICAgICAgIGZ1bmMoLi4uYXJncyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB0aGlzLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICBtYW5hZ2VyLnNldCgncGh5c2ljc1dvcmtlcicsIHRoaXMud29ya2VyKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBvbkFkZChjb21wb25lbnQsIHNlbGYpIHtcbiAgICAgIGlmIChjb21wb25lbnQuX3BoeXNpanMpIHJldHVybiBzZWxmLmRlZmVyKHNlbGYub25BZGRDYWxsYmFjay5iaW5kKHNlbGYpLCBbY29tcG9uZW50XSk7XG4gICAgICByZXR1cm47XG4gICAgfSxcbiAgICBcbiAgICBvblJlbW92ZShjb21wb25lbnQsIHNlbGYpIHtcbiAgICAgIGlmIChjb21wb25lbnQuX3BoeXNpanMpIHJldHVybiBzZWxmLmRlZmVyKHNlbGYub25SZW1vdmVDYWxsYmFjay5iaW5kKHNlbGYpLCBbY29tcG9uZW50XSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICAvLyAuLi5cblxuICAgIHRoaXMuc2V0Rml4ZWRUaW1lU3RlcCA9IGZ1bmN0aW9uKGZpeGVkVGltZVN0ZXApIHtcbiAgICAgIGlmIChmaXhlZFRpbWVTdGVwKSBzZWxmLmV4ZWN1dGUoJ3NldEZpeGVkVGltZVN0ZXAnLCBmaXhlZFRpbWVTdGVwKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldEdyYXZpdHkgPSBmdW5jdGlvbihncmF2aXR5KSB7XG4gICAgICBpZiAoZ3Jhdml0eSkgc2VsZi5leGVjdXRlKCdzZXRHcmF2aXR5JywgZ3Jhdml0eSk7XG4gICAgfVxuXG4gICAgdGhpcy5hZGRDb25zdHJhaW50ID0gc2VsZi5hZGRDb25zdHJhaW50LmJpbmQoc2VsZik7XG5cbiAgICB0aGlzLnNpbXVsYXRlID0gZnVuY3Rpb24odGltZVN0ZXAsIG1heFN1YlN0ZXBzKSB7XG4gICAgICBpZiAoc2VsZi5fc3RhdHMpIHNlbGYuX3N0YXRzLmJlZ2luKCk7XG5cbiAgICAgIGlmIChzZWxmLl9pc19zaW11bGF0aW5nKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHNlbGYuX2lzX3NpbXVsYXRpbmcgPSB0cnVlO1xuXG4gICAgICBmb3IgKGNvbnN0IG9iamVjdF9pZCBpbiBzZWxmLl9vYmplY3RzKSB7XG4gICAgICAgIGlmICghc2VsZi5fb2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShvYmplY3RfaWQpKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCBvYmplY3QgPSBzZWxmLl9vYmplY3RzW29iamVjdF9pZF07XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0IF9waHlzaWpzID0gY29tcG9uZW50Ll9waHlzaWpzO1xuXG4gICAgICAgIGlmIChvYmplY3QgIT09IG51bGwgJiYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gfHwgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikpIHtcbiAgICAgICAgICBjb25zdCB1cGRhdGUgPSB7aWQ6IF9waHlzaWpzLmlkfTtcblxuICAgICAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uKSB7XG4gICAgICAgICAgICB1cGRhdGUucG9zID0ge1xuICAgICAgICAgICAgICB4OiBvYmplY3QucG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgeTogb2JqZWN0LnBvc2l0aW9uLnksXG4gICAgICAgICAgICAgIHo6IG9iamVjdC5wb3NpdGlvbi56XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoX3BoeXNpanMuaXNTb2Z0Ym9keSkgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcblxuICAgICAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uKSB7XG4gICAgICAgICAgICB1cGRhdGUucXVhdCA9IHtcbiAgICAgICAgICAgICAgeDogb2JqZWN0LnF1YXRlcm5pb24ueCxcbiAgICAgICAgICAgICAgeTogb2JqZWN0LnF1YXRlcm5pb24ueSxcbiAgICAgICAgICAgICAgejogb2JqZWN0LnF1YXRlcm5pb24ueixcbiAgICAgICAgICAgICAgdzogb2JqZWN0LnF1YXRlcm5pb24ud1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKF9waHlzaWpzLmlzU29mdGJvZHkpIG9iamVjdC5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLmV4ZWN1dGUoJ3VwZGF0ZVRyYW5zZm9ybScsIHVwZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5leGVjdXRlKCdzaW11bGF0ZScsIHt0aW1lU3RlcCwgbWF4U3ViU3RlcHN9KTtcblxuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5lbmQoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGNvbnN0IHNpbXVsYXRlUHJvY2VzcyA9ICh0KSA9PiB7XG4gICAgLy8gICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHNpbXVsYXRlUHJvY2Vzcyk7XG5cbiAgICAvLyAgIHRoaXMuc2ltdWxhdGUoMS82MCwgMSk7IC8vIGRlbHRhLCAxXG4gICAgLy8gfVxuXG4gICAgLy8gc2ltdWxhdGVQcm9jZXNzKCk7XG5cbiAgICBzZWxmLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgIHNlbGYuc2ltdWxhdGVMb29wID0gbmV3IExvb3AoKGNsb2NrKSA9PiB7XG4gICAgICAgIHRoaXMuc2ltdWxhdGUoY2xvY2suZ2V0RGVsdGEoKSwgMSk7IC8vIGRlbHRhLCAxXG4gICAgICB9KTtcblxuICAgICAgc2VsZi5zaW11bGF0ZUxvb3Auc3RhcnQodGhpcyk7XG5cbiAgICAgIHRoaXMuc2V0R3Jhdml0eShwYXJhbXMuZ3Jhdml0eSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7UXVhdGVybmlvbn0gZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgY29uc3QgYXBpID0ge1xuICAvLyBnZXQgbWFzcygpIHtcbiAgLy8gICByZXR1cm4gdGhpcy5fcGh5c2lqcy5tYXNzO1xuICAvLyB9XG5cbiAgLy8gc2V0IG1hc3MobWFzcykge1xuICAvLyAgIHRoaXMuX3BoeXNpanMubWFzcyA9IG1hc3M7XG4gIC8vICAgaWYgKHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCd1cGRhdGVNYXNzJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCBtYXNzfSk7XG4gIC8vIH1cblxuICBhcHBseUNlbnRyYWxJbXB1bHNlKGZvcmNlKSB7XG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdhcHBseUNlbnRyYWxJbXB1bHNlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB4OiBmb3JjZS54LCB5OiBmb3JjZS55LCB6OiBmb3JjZS56fSk7XG4gIH0sXG5cbiAgYXBwbHlJbXB1bHNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHtcbiAgICAgIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ2FwcGx5SW1wdWxzZScsIHtcbiAgICAgICAgaWQ6IHRoaXMuX3BoeXNpanMuaWQsXG4gICAgICAgIGltcHVsc2VfeDogZm9yY2UueCxcbiAgICAgICAgaW1wdWxzZV95OiBmb3JjZS55LFxuICAgICAgICBpbXB1bHNlX3o6IGZvcmNlLnosXG4gICAgICAgIHg6IG9mZnNldC54LFxuICAgICAgICB5OiBvZmZzZXQueSxcbiAgICAgICAgejogb2Zmc2V0LnpcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBhcHBseVRvcnF1ZShmb3JjZSkge1xuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkge1xuICAgICAgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnYXBwbHlUb3JxdWUnLCB7XG4gICAgICAgIGlkOiB0aGlzLl9waHlzaWpzLmlkLFxuICAgICAgICB0b3JxdWVfeDogZm9yY2UueCxcbiAgICAgICAgdG9ycXVlX3k6IGZvcmNlLnksXG4gICAgICAgIHRvcnF1ZV96OiBmb3JjZS56XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgYXBwbHlDZW50cmFsRm9yY2UoZm9yY2UpIHtcbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ2FwcGx5Q2VudHJhbEZvcmNlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB4OiBmb3JjZS54LCB5OiBmb3JjZS55LCB6OiBmb3JjZS56fSk7XG4gIH0sXG5cbiAgYXBwbHlGb3JjZShmb3JjZSwgb2Zmc2V0KSB7XG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB7XG4gICAgICB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdhcHBseUZvcmNlJywge1xuICAgICAgICBpZDogdGhpcy5fcGh5c2lqcy5pZCxcbiAgICAgICAgZm9yY2VfeDogZm9yY2UueCxcbiAgICAgICAgZm9yY2VfeTogZm9yY2UueSxcbiAgICAgICAgZm9yY2VfejogZm9yY2UueixcbiAgICAgICAgeDogb2Zmc2V0LngsXG4gICAgICAgIHk6IG9mZnNldC55LFxuICAgICAgICB6OiBvZmZzZXQuelxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIGdldEFuZ3VsYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGh5c2lqcy5hbmd1bGFyVmVsb2NpdHk7XG4gIH0sXG5cbiAgc2V0QW5ndWxhclZlbG9jaXR5KHZlbG9jaXR5KSB7XG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdzZXRBbmd1bGFyVmVsb2NpdHknLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9KTtcbiAgfSxcblxuICBnZXRMaW5lYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGh5c2lqcy5saW5lYXJWZWxvY2l0eTtcbiAgfSxcblxuICBzZXRMaW5lYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnc2V0TGluZWFyVmVsb2NpdHknLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9KTtcbiAgfSxcblxuICBzZXRBbmd1bGFyRmFjdG9yKGZhY3Rvcikge1xuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnc2V0QW5ndWxhckZhY3RvcicsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgeDogZmFjdG9yLngsIHk6IGZhY3Rvci55LCB6OiBmYWN0b3Iuen0pO1xuICB9LFxuXG4gIHNldExpbmVhckZhY3RvcihmYWN0b3IpIHtcbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ3NldExpbmVhckZhY3RvcicsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgeDogZmFjdG9yLngsIHk6IGZhY3Rvci55LCB6OiBmYWN0b3Iuen0pO1xuICB9LFxuXG4gIHNldERhbXBpbmcobGluZWFyLCBhbmd1bGFyKSB7XG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdzZXREYW1waW5nJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCBsaW5lYXIsIGFuZ3VsYXJ9KTtcbiAgfSxcblxuICBzZXRDY2RNb3Rpb25UaHJlc2hvbGQodGhyZXNob2xkKSB7XG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdzZXRDY2RNb3Rpb25UaHJlc2hvbGQnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHRocmVzaG9sZH0pO1xuICB9LFxuXG4gIHNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKHJhZGl1cykge1xuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHJhZGl1c30pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBwcm9wZXJ0aWVzID0ge1xuICBwb3NpdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgfSxcblxuICAgIHNldCh2ZWN0b3IzKSB7XG4gICAgICBjb25zdCBwb3MgPSB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgICBjb25zdCBzY29wZSA9IHRoaXM7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHBvcywge1xuICAgICAgICB4OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3g7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh4KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feCA9IHg7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3k7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh5KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feSA9IHk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB6OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3o7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh6KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feiA9IHo7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcblxuICAgICAgcG9zLmNvcHkodmVjdG9yMyk7XG4gICAgfVxuICB9LFxuXG4gIHF1YXRlcm5pb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMubmF0aXZlLnF1YXRlcm5pb247XG4gICAgfSxcblxuICAgIHNldChxdWF0ZXJuaW9uKSB7XG4gICAgICBjb25zdCBxdWF0ID0gdGhpcy5fbmF0aXZlLnF1YXRlcm5pb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgcXVhdC5jb3B5KHF1YXRlcm5pb24pO1xuXG4gICAgICBxdWF0Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIGlmIChuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLl9fY19yb3QgPSBmYWxzZTtcbiAgICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICByb3RhdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHRoaXMuX19jX3JvdCA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnJvdGF0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQoZXVsZXIpIHtcbiAgICAgIGNvbnN0IHJvdCA9IHRoaXMuX25hdGl2ZS5yb3RhdGlvbixcbiAgICAgICAgbmF0aXZlID0gdGhpcy5fbmF0aXZlO1xuXG4gICAgICB0aGlzLnF1YXRlcm5pb24uY29weShuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihldWxlcikpO1xuXG4gICAgICByb3Qub25DaGFuZ2UoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2Nfcm90KSB7XG4gICAgICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIocm90KSk7XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JhcFBoeXNpY3NQcm90b3R5cGUoc2NvcGUpIHtcbiAgZm9yIChsZXQga2V5IGluIGFwaSkge1xuICAgIHNjb3BlW2tleV0gPSBhcGlba2V5XS5iaW5kKHNjb3BlKTtcbiAgfVxuXG4gIGZvciAobGV0IGtleSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNjb3BlLCBrZXksIHtcbiAgICAgIGdldDogcHJvcGVydGllc1trZXldLmdldC5iaW5kKHNjb3BlKSxcbiAgICAgIHNldDogcHJvcGVydGllc1trZXldLnNldC5iaW5kKHNjb3BlKSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb25Db3B5KHNvdXJjZSkge1xuICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgdGhpcy5fcGh5c2lqcyA9IHsuLi5zb3VyY2UuX3BoeXNpanN9O1xuICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5jbG9uZSgpO1xuICB0aGlzLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbi5jbG9uZSgpO1xuICB0aGlzLnF1YXRlcm5pb24gPSB0aGlzLnF1YXRlcm5pb24uY2xvbmUoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uV3JhcCgpIHtcbiAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucm90YXRpb24uY2xvbmUoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gdGhpcy5xdWF0ZXJuaW9uLmNsb25lKCk7XG59XG4iLCJpbXBvcnQge1ZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgQm94TW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ2JveCcsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpblxuICAgIH07XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSkge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMud2lkdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgdGhpcy5fcGh5c2lqcy5oZWlnaHQgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgdGhpcy5fcGh5c2lqcy5kZXB0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIENvbXBvdW5kTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ2NvbXBvdW5kJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfTtcbn1cbiIsImltcG9ydCB7VmVjdG9yM30gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDYXBzdWxlTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgaGVpZ2h0OiAzLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgICAgcmFkaXVzOiAzLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ2NhcHN1bGUnLFxuICAgICAgcmFkaXVzOiBNYXRoLm1heChwYXJhbXMud2lkdGggLyAyLCBwYXJhbXMuZGVwdGggLyAyKSxcbiAgICAgIGhlaWdodDogcGFyYW1zLmhlaWdodCxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3NcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIHRoaXMuX3BoeXNpanMuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIHRoaXMuX3BoeXNpanMuZGVwdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfTtcbn1cbiIsImltcG9ydCB7VmVjdG9yMywgTXVsdGlNYXRlcmlhbCwgTWVzaCwgSlNPTkxvYWRlcn0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDb25jYXZlTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgbG9hZGVyOiBuZXcgSlNPTkxvYWRlcigpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIGlmICh0aGlzLnBhcmFtcy5wYXRoICYmIHRoaXMucGFyYW1zLmxvYWRlcikge1xuICAgICAgdGhpcy5nZW9tZXRyeUxvYWRlciA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5wYXJhbXMubG9hZGVyLmxvYWQoXG4gICAgICAgICAgdGhpcy5wYXJhbXMucGF0aCxcbiAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICgpID0+IHt9LFxuICAgICAgICAgIHJlamVjdFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpIHtcbiAgICBjb25zdCBpc0J1ZmZlciA9IGdlb21ldHJ5LnR5cGUgPT09ICdCdWZmZXJHZW9tZXRyeSc7XG5cbiAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgIGNvbnN0IGRhdGEgPSBpc0J1ZmZlciA/XG4gICAgICBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDpcbiAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogOSk7XG5cbiAgICBpZiAoIWlzQnVmZmVyKSB7XG4gICAgICBjb25zdCB2ZXJ0aWNlcyA9IGdlb21ldHJ5LnZlcnRpY2VzO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgICBjb25zdCB2QSA9IHZlcnRpY2VzW2ZhY2UuYV07XG4gICAgICAgIGNvbnN0IHZCID0gdmVydGljZXNbZmFjZS5iXTtcbiAgICAgICAgY29uc3QgdkMgPSB2ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgZGF0YVtpOV0gPSB2QS54O1xuICAgICAgICBkYXRhW2k5ICsgMV0gPSB2QS55O1xuICAgICAgICBkYXRhW2k5ICsgMl0gPSB2QS56O1xuXG4gICAgICAgIGRhdGFbaTkgKyAzXSA9IHZCLng7XG4gICAgICAgIGRhdGFbaTkgKyA0XSA9IHZCLnk7XG4gICAgICAgIGRhdGFbaTkgKyA1XSA9IHZCLno7XG5cbiAgICAgICAgZGF0YVtpOSArIDZdID0gdkMueDtcbiAgICAgICAgZGF0YVtpOSArIDddID0gdkMueTtcbiAgICAgICAgZGF0YVtpOSArIDhdID0gdkMuejtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfTtcblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjb25jYXZlJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5LCBzZWxmKSB7XG4gICAgICBpZiAoc2VsZi5wYXJhbXMucGF0aCkge1xuICAgICAgICB0aGlzLndhaXQoc2VsZi5nZW9tZXRyeUxvYWRlcik7XG5cbiAgICAgICAgc2VsZi5nZW9tZXRyeUxvYWRlclxuICAgICAgICAgIC50aGVuKGdlb20gPT4ge1xuICAgICAgICAgICAgdGhpcy5fcGh5c2lqcy5kYXRhID0gc2VsZi5nZW9tZXRyeVByb2Nlc3NvcihnZW9tKVxuICAgICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcGh5c2lqcy5kYXRhID0gc2VsZi5nZW9tZXRyeVByb2Nlc3NvcihnZW9tZXRyeSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9XG59XG4iLCJpbXBvcnQge1ZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uZU1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMFxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjb25lJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgIH07XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSkge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMucmFkaXVzID0gKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLngpIC8gMjtcbiAgICAgIHRoaXMuX3BoeXNpanMuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQge1ZlY3RvcjMsIEJ1ZmZlckdlb21ldHJ5fSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIENvbnZleE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjb252ZXgnLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICB0b3VjaGVzOiBbXSxcbiAgICAgIGxpbmVhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgICAgYW5ndWxhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgICAgZ3JvdXA6IHBhcmFtcy5ncm91cCxcbiAgICAgIG1hc2s6IHBhcmFtcy5tYXNrLFxuICAgICAgZnJpY3Rpb246IHBhcmFtcy5mcmljdGlvbixcbiAgICAgIHJlc3RpdHV0aW9uOiBwYXJhbXMucmVzdGl0dXRpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICAgIHNjYWxlOiBwYXJhbXMuc2NhbGVcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgbWVzaChtZXNoKSB7XG4gICAgICBjb25zdCBnZW9tZXRyeSA9IG1lc2guZ2VvbWV0cnk7XG5cbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBjb25zdCBpc0J1ZmZlciA9IGdlb21ldHJ5LnR5cGUgPT09ICdCdWZmZXJHZW9tZXRyeSc7XG5cbiAgICAgIGlmICghaXNCdWZmZXIpIGdlb21ldHJ5Ll9idWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpLmZyb21HZW9tZXRyeShnZW9tZXRyeSk7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBpc0J1ZmZlciA/XG4gICAgICAgIGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOlxuICAgICAgICBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy5kYXRhID0gZGF0YTtcblxuICAgICAgcmV0dXJuIG1lc2g7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIEN5bGluZGVyTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ2N5bGluZGVyJyxcbiAgICAgIHdpZHRoOiBwYXJhbXMud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhcmFtcy5oZWlnaHQsXG4gICAgICBkZXB0aDogcGFyYW1zLmRlcHRoLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHNjYWxlOiBwYXJhbXMuc2NhbGVcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIHRoaXMuX3BoeXNpanMuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIHRoaXMuX3BoeXNpanMuZGVwdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IyLCBWZWN0b3IzLCBCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBIZWlnaHRmaWVsZE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHNpemU6IG5ldyBWZWN0b3IyKDEsIDEpLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgYXV0b0FsaWduOiBmYWxzZVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdoZWlnaHRmaWVsZCcsXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgcG9pbnRzOiBwYXJhbXMucG9pbnRzLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnksIHNlbGYpIHtcbiAgICAgIGNvbnN0IGlzQnVmZmVyID0gZ2VvbWV0cnkgaW5zdGFuY2VvZiBCdWZmZXJHZW9tZXRyeTtcbiAgICAgIGNvbnN0IHZlcnRzID0gaXNCdWZmZXIgPyBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDogZ2VvbWV0cnkudmVydGljZXM7XG5cbiAgICAgIGxldCBzaXplID0gaXNCdWZmZXIgPyB2ZXJ0cy5sZW5ndGggLyAzIDogdmVydHMubGVuZ3RoO1xuXG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgY29uc3QgeGRpdiA9IHNlbGYucGFyYW1zLnNpemUueDtcbiAgICAgIGNvbnN0IHlkaXYgPSBzZWxmLnBhcmFtcy5zaXplLnk7XG5cbiAgICAgIGNvbnN0IHhzaXplID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGNvbnN0IHlzaXplID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcblxuICAgICAgdGhpcy5fcGh5c2lqcy54cHRzID0gKHR5cGVvZiB4ZGl2ID09PSAndW5kZWZpbmVkJykgPyBNYXRoLnNxcnQoc2l6ZSkgOiB4ZGl2ICsgMTtcbiAgICAgIHRoaXMuX3BoeXNpanMueXB0cyA9ICh0eXBlb2YgeWRpdiA9PT0gJ3VuZGVmaW5lZCcpID8gTWF0aC5zcXJ0KHNpemUpIDogeWRpdiArIDE7XG5cbiAgICAgIC8vIG5vdGUgLSB0aGlzIGFzc3VtZXMgb3VyIHBsYW5lIGdlb21ldHJ5IGlzIHNxdWFyZSwgdW5sZXNzIHdlIHBhc3MgaW4gc3BlY2lmaWMgeGRpdiBhbmQgeWRpdlxuICAgICAgdGhpcy5fcGh5c2lqcy5hYnNNYXhIZWlnaHQgPSBNYXRoLm1heChnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSwgTWF0aC5hYnMoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnkpKTtcblxuICAgICAgY29uc3QgcG9pbnRzID0gbmV3IEZsb2F0MzJBcnJheShzaXplKSxcbiAgICAgICAgeHB0cyA9IHRoaXMuX3BoeXNpanMueHB0cyxcbiAgICAgICAgeXB0cyA9IHRoaXMuX3BoeXNpanMueXB0cztcblxuICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICBjb25zdCB2TnVtID0gc2l6ZSAlIHhwdHMgKyAoKHlwdHMgLSBNYXRoLnJvdW5kKChzaXplIC8geHB0cykgLSAoKHNpemUgJSB4cHRzKSAvIHhwdHMpKSAtIDEpICogeXB0cyk7XG5cbiAgICAgICAgaWYgKGlzQnVmZmVyKSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtICogMyArIDFdO1xuICAgICAgICBlbHNlIHBvaW50c1tzaXplXSA9IHZlcnRzW3ZOdW1dLnk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BoeXNpanMucG9pbnRzID0gcG9pbnRzO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLnNjYWxlLm11bHRpcGx5KFxuICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh4c2l6ZSAvICh4cHRzIC0gMSksIDEsIHlzaXplIC8gKHlwdHMgLSAxKSlcbiAgICAgICk7XG5cbiAgICAgIGlmIChzZWxmLnBhcmFtcy5hdXRvQWxpZ24pIGdlb21ldHJ5LnRyYW5zbGF0ZSh4c2l6ZSAvIC0yLCAwLCB5c2l6ZSAvIC0yKTtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQge1ZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgUGxhbmVNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbWFzczogMTAsXG4gICAgICByZXN0aXR1dGlvbjogMC4zLFxuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAncGxhbmUnLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3NcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIHRoaXMuX3BoeXNpanMuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIHRoaXMuX3BoeXNpanMubm9ybWFsID0gZ2VvbWV0cnkuZmFjZXNbMF0ubm9ybWFsLmNsb25lKCk7XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9XG59XG4iLCJpbXBvcnQge1ZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgU3BoZXJlTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgcHJlc3N1cmU6IDEwMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGtsc3Q6IDAuOSxcbiAgICAgIGt2c3Q6IDAuOSxcbiAgICAgIGthc3Q6IDAuOSxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdzcGhlcmUnLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3NcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ1NwaGVyZSgpO1xuICAgICAgdGhpcy5fcGh5c2lqcy5yYWRpdXMgPSBnZW9tZXRyeS5ib3VuZGluZ1NwaGVyZS5yYWRpdXM7XG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzLCBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIFNvZnRib2R5TW9kdWxle1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgICAgcHJlc3N1cmU6IDEwMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGtsc3Q6IDAuOSxcbiAgICAgIGt2c3Q6IDAuOSxcbiAgICAgIGthc3Q6IDAuOSxcbiAgICAgIHBpdGVyYXRpb25zOiAxLFxuICAgICAgdml0ZXJhdGlvbnM6IDAsXG4gICAgICBkaXRlcmF0aW9uczogMCxcbiAgICAgIGNpdGVyYXRpb25zOiA0LFxuICAgICAgYW5jaG9ySGFyZG5lc3M6IDAuNyxcbiAgICAgIHJpZ2lkSGFyZG5lc3M6IDFcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5fcGh5c2lqcy5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC5fcGh5c2lqcy5pZDtcblxuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnYXBwZW5kQW5jaG9yJywge1xuICAgICAgb2JqOiBvMSxcbiAgICAgIG9iajI6IG8yLFxuICAgICAgbm9kZSxcbiAgICAgIGluZmx1ZW5jZSxcbiAgICAgIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXNcbiAgICB9KTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ3NvZnRUcmltZXNoJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgZnJpY3Rpb246IHBhcmFtcy5mcmljdGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgcHJlc3N1cmU6IHBhcmFtcy5wcmVzc3VyZSxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICAgIGtsc3Q6IHBhcmFtcy5rbHN0LFxuICAgICAgaXNTb2Z0Ym9keTogdHJ1ZSxcbiAgICAgIGthc3Q6IHBhcmFtcy5rYXN0LFxuICAgICAga3ZzdDogcGFyYW1zLmt2c3QsXG4gICAgICBkcmFnOiBwYXJhbXMuZHJhZyxcbiAgICAgIGxpZnQ6IHBhcmFtcy5saWZ0LFxuICAgICAgcGl0ZXJhdGlvbnM6IHBhcmFtcy5waXRlcmF0aW9ucyxcbiAgICAgIHZpdGVyYXRpb25zOiBwYXJhbXMudml0ZXJhdGlvbnMsXG4gICAgICBkaXRlcmF0aW9uczogcGFyYW1zLmRpdGVyYXRpb25zLFxuICAgICAgY2l0ZXJhdGlvbnM6IHBhcmFtcy5jaXRlcmF0aW9ucyxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiBwYXJhbXMuYW5jaG9ySGFyZG5lc3MsXG4gICAgICByaWdpZEhhcmRuZXNzOiBwYXJhbXMucmlnaWRIYXJkbmVzc1xuICAgIH07XG5cbiAgICB0aGlzLmFwcGVuZEFuY2hvciA9IHNlbGYuYXBwZW5kQW5jaG9yLmJpbmQodGhpcyk7XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSwgc2VsZikge1xuICAgICAgY29uc3QgaWR4R2VvbWV0cnkgPSBnZW9tZXRyeSBpbnN0YW5jZW9mIEJ1ZmZlckdlb21ldHJ5XG4gICAgICAgID8gZ2VvbWV0cnlcbiAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgIGdlb21ldHJ5Lm1lcmdlVmVydGljZXMoKTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuc2V0SW5kZXgoXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgKGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAxXG4gICAgICAgICAgICApLmNvcHlJbmRpY2VzQXJyYXkoZ2VvbWV0cnkuZmFjZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmZXJHZW9tZXRyeTtcbiAgICAgICAgfSkoKTtcblxuICAgICAgY29uc3QgYVZlcnRpY2VzID0gaWR4R2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICAgIGNvbnN0IGFJbmRpY2VzID0gaWR4R2VvbWV0cnkuaW5kZXguYXJyYXk7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMuYVZlcnRpY2VzID0gYVZlcnRpY2VzO1xuICAgICAgdGhpcy5fcGh5c2lqcy5hSW5kaWNlcyA9IGFJbmRpY2VzO1xuXG4gICAgICBjb25zdCBuZHhHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpLmZyb21HZW9tZXRyeShnZW9tZXRyeSk7XG5cbiAgICAgIHJldHVybiBuZHhHZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9XG59XG4iLCJpbXBvcnQge1ZlY3RvcjMsIEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGV9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgQ2xvdGhNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMgPSB7fSkge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIGtsc3Q6IDAuOSxcbiAgICAgIGt2c3Q6IDAuOSxcbiAgICAgIGthc3Q6IDAuOSxcbiAgICAgIHBpdGVyYXRpb25zOiAxLFxuICAgICAgdml0ZXJhdGlvbnM6IDAsXG4gICAgICBkaXRlcmF0aW9uczogMCxcbiAgICAgIGNpdGVyYXRpb25zOiA0LFxuICAgICAgYW5jaG9ySGFyZG5lc3M6IDAuNyxcbiAgICAgIHJpZ2lkSGFyZG5lc3M6IDFcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5fcGh5c2lqcy5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC5fcGh5c2lqcy5pZDtcblxuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnYXBwZW5kQW5jaG9yJywge1xuICAgICAgb2JqOiBvMSxcbiAgICAgIG9iajI6IG8yLFxuICAgICAgbm9kZSxcbiAgICAgIGluZmx1ZW5jZSxcbiAgICAgIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXNcbiAgICB9KTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ3NvZnRDbG90aE1lc2gnLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICB0b3VjaGVzOiBbXSxcbiAgICAgIGlzU29mdGJvZHk6IHRydWUsXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgZnJpY3Rpb246IHBhcmFtcy5mcmljdGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAga2xzdDogcGFyYW1zLmtsc3QsXG4gICAgICBrYXN0OiBwYXJhbXMua2FzdCxcbiAgICAgIGt2c3Q6IHBhcmFtcy5rdnN0LFxuICAgICAgZHJhZzogcGFyYW1zLmRyYWcsXG4gICAgICBsaWZ0OiBwYXJhbXMubGlmdCxcbiAgICAgIHBpdGVyYXRpb25zOiBwYXJhbXMucGl0ZXJhdGlvbnMsXG4gICAgICB2aXRlcmF0aW9uczogcGFyYW1zLnZpdGVyYXRpb25zLFxuICAgICAgZGl0ZXJhdGlvbnM6IHBhcmFtcy5kaXRlcmF0aW9ucyxcbiAgICAgIGNpdGVyYXRpb25zOiBwYXJhbXMuY2l0ZXJhdGlvbnMsXG4gICAgICBhbmNob3JIYXJkbmVzczogcGFyYW1zLmFuY2hvckhhcmRuZXNzLFxuICAgICAgcmlnaWRIYXJkbmVzczogcGFyYW1zLnJpZ2lkSGFyZG5lc3MsXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlXG4gICAgfTtcblxuICAgIHRoaXMuYXBwZW5kQW5jaG9yID0gc2VsZi5hcHBlbmRBbmNob3IuYmluZCh0aGlzKTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5LCBzZWxmKSB7XG4gICAgICBjb25zdCBnZW9tUGFyYW1zID0gZ2VvbWV0cnkucGFyYW1ldGVycztcblxuICAgICAgY29uc3QgZ2VvbSA9IGdlb21ldHJ5IGluc3RhbmNlb2YgQnVmZmVyR2VvbWV0cnlcbiAgICAgICAgPyBnZW9tZXRyeVxuICAgICAgICAgIDogKCgpID0+IHtcbiAgICAgICAgICBnZW9tZXRyeS5tZXJnZVZlcnRpY2VzKCk7XG5cbiAgICAgICAgICBjb25zdCBidWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IGZhY2VzID0gZ2VvbWV0cnkuZmFjZXMsIGZhY2VzTGVuZ3RoID0gZmFjZXMubGVuZ3RoO1xuICAgICAgICAgIGNvbnN0IG5vcm1hbHNBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZmFjZXNMZW5ndGggKiAzKTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmFjZXNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaTMgPSBpICogMztcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbCA9IGZhY2VzW2ldLm5vcm1hbCB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTNdID0gbm9ybWFsLng7XG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTMgKyAxXSA9IG5vcm1hbC55O1xuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzICsgMl0gPSBub3JtYWwuejtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAnbm9ybWFsJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5vcm1hbHNBcnJheSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5zZXRJbmRleChcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyAoZmFjZXNMZW5ndGggKiAzID4gNjU1MzUgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5KShmYWNlc0xlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAxXG4gICAgICAgICAgICApLmNvcHlJbmRpY2VzQXJyYXkoZmFjZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmZXJHZW9tZXRyeTtcbiAgICAgICAgfSkoKTtcblxuICAgICAgY29uc3QgdmVydHMgPSBnZW9tLmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIGlmICghZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzKSBnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgPSAxO1xuICAgICAgaWYgKCFnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzKSBnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzID0gMTtcblxuICAgICAgY29uc3QgaWR4MDAgPSAwO1xuICAgICAgY29uc3QgaWR4MDEgPSBnZW9tUGFyYW1zLndpZHRoU2VnbWVudHM7XG4gICAgICBjb25zdCBpZHgxMCA9IChnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzICsgMSkgKiAoZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSkgLSAoZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSk7XG4gICAgICBjb25zdCBpZHgxMSA9IHZlcnRzLmxlbmd0aCAvIDMgLSAxO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLmNvcm5lcnMgPSBbXG4gICAgICAgIHZlcnRzW2lkeDAxICogM10sIHZlcnRzW2lkeDAxICogMyArIDFdLCB2ZXJ0c1tpZHgwMSAqIDMgKyAyXSwgLy8gICDilZdcbiAgICAgICAgdmVydHNbaWR4MDAgKiAzXSwgdmVydHNbaWR4MDAgKiAzICsgMV0sIHZlcnRzW2lkeDAwICogMyArIDJdLCAvLyDilZRcbiAgICAgICAgdmVydHNbaWR4MTEgKiAzXSwgdmVydHNbaWR4MTEgKiAzICsgMV0sIHZlcnRzW2lkeDExICogMyArIDJdLCAvLyAgICAgICDilZ1cbiAgICAgICAgdmVydHNbaWR4MTAgKiAzXSwgdmVydHNbaWR4MTAgKiAzICsgMV0sIHZlcnRzW2lkeDEwICogMyArIDJdLCAvLyAgICAg4pWaXG4gICAgICBdO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLnNlZ21lbnRzID0gW2dlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEsIGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgKyAxXTtcblxuICAgICAgcmV0dXJuIGdlb207XG4gICAgfSxcbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH1cbn07XG4iLCJpbXBvcnQge1ZlY3RvcjMsIEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGV9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgUm9wZU1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGtsc3Q6IDAuOSxcbiAgICAgIGt2c3Q6IDAuOSxcbiAgICAgIGthc3Q6IDAuOSxcbiAgICAgIHBpdGVyYXRpb25zOiAxLFxuICAgICAgdml0ZXJhdGlvbnM6IDAsXG4gICAgICBkaXRlcmF0aW9uczogMCxcbiAgICAgIGNpdGVyYXRpb25zOiA0LFxuICAgICAgYW5jaG9ySGFyZG5lc3M6IDAuNyxcbiAgICAgIHJpZ2lkSGFyZG5lc3M6IDFcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5fcGh5c2lqcy5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC5fcGh5c2lqcy5pZDtcblxuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnYXBwZW5kQW5jaG9yJywge1xuICAgICAgb2JqOiBvMSxcbiAgICAgIG9iajI6IG8yLFxuICAgICAgbm9kZSxcbiAgICAgIGluZmx1ZW5jZSxcbiAgICAgIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXNcbiAgICB9KTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ3NvZnRSb3BlTWVzaCcsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgZnJpY3Rpb246IHBhcmFtcy5mcmljdGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAga2xzdDogcGFyYW1zLmtsc3QsXG4gICAgICBpc1NvZnRib2R5OiB0cnVlLFxuICAgICAga2FzdDogcGFyYW1zLmthc3QsXG4gICAgICBrdnN0OiBwYXJhbXMua3ZzdCxcbiAgICAgIGRyYWc6IHBhcmFtcy5kcmFnLFxuICAgICAgbGlmdDogcGFyYW1zLmxpZnQsXG4gICAgICBwaXRlcmF0aW9uczogcGFyYW1zLnBpdGVyYXRpb25zLFxuICAgICAgdml0ZXJhdGlvbnM6IHBhcmFtcy52aXRlcmF0aW9ucyxcbiAgICAgIGRpdGVyYXRpb25zOiBwYXJhbXMuZGl0ZXJhdGlvbnMsXG4gICAgICBjaXRlcmF0aW9uczogcGFyYW1zLmNpdGVyYXRpb25zLFxuICAgICAgYW5jaG9ySGFyZG5lc3M6IHBhcmFtcy5hbmNob3JIYXJkbmVzcyxcbiAgICAgIHJpZ2lkSGFyZG5lc3M6IHBhcmFtcy5yaWdpZEhhcmRuZXNzXG4gICAgfTtcblxuICAgIHRoaXMuYXBwZW5kQW5jaG9yID0gc2VsZi5hcHBlbmRBbmNob3IuYmluZCh0aGlzKTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgICBpZiAoIShnZW9tZXRyeSBpbnN0YW5jZW9mIEJ1ZmZlckdlb21ldHJ5KSkge1xuICAgICAgICBnZW9tZXRyeSA9ICgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYnVmZiA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZi5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmY7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxlbmd0aCA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkubGVuZ3RoIC8gMztcbiAgICAgIGNvbnN0IHZlcnQgPSBuID0+IG5ldyBWZWN0b3IzKCkuZnJvbUFycmF5KGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXksIG4qMyk7XG5cbiAgICAgIGNvbnN0IHYxID0gdmVydCgwKTtcbiAgICAgIGNvbnN0IHYyID0gdmVydChsZW5ndGggLSAxKTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy5kYXRhID0gW1xuICAgICAgICB2MS54LCB2MS55LCB2MS56LFxuICAgICAgICB2Mi54LCB2Mi55LCB2Mi56LFxuICAgICAgICBsZW5ndGhcbiAgICAgIF07XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9XG59XG4iLCJpbXBvcnQge0xvb3B9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7XG4gIE9iamVjdDNELFxuICBRdWF0ZXJuaW9uLFxuICBWZWN0b3IzLFxuICBFdWxlclxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFBJXzIgPSBNYXRoLlBJIC8gMjtcblxuZnVuY3Rpb24gRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihjYW1lcmEsIG1lc2gsIHBhcmFtcykge1xuICBjb25zdCB2ZWxvY2l0eUZhY3RvciA9IDE7XG4gIGxldCBydW5WZWxvY2l0eSA9IDAuMjU7XG5cbiAgbWVzaC5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgLyogSW5pdCAqL1xuICBjb25zdCBwbGF5ZXIgPSBtZXNoLFxuICAgIHBpdGNoT2JqZWN0ID0gbmV3IE9iamVjdDNEKCk7XG5cbiAgcGl0Y2hPYmplY3QuYWRkKGNhbWVyYS5uYXRpdmUpO1xuXG4gIGNvbnN0IHlhd09iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHlhd09iamVjdC5wb3NpdGlvbi55ID0gcGFyYW1zLnlwb3M7IC8vIGV5ZXMgYXJlIDIgbWV0ZXJzIGFib3ZlIHRoZSBncm91bmRcbiAgeWF3T2JqZWN0LmFkZChwaXRjaE9iamVjdCk7XG5cbiAgY29uc3QgcXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbiAgbGV0IGNhbkp1bXAgPSBmYWxzZSxcbiAgICAvLyBNb3Zlcy5cbiAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVMZWZ0ID0gZmFsc2UsXG4gICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG5cbiAgcGxheWVyLm9uKCdjb2xsaXNpb24nLCAob3RoZXJPYmplY3QsIHYsIHIsIGNvbnRhY3ROb3JtYWwpID0+IHtcbiAgICBpZiAoY29udGFjdE5vcm1hbC55IDwgMC41KSAvLyBVc2UgYSBcImdvb2RcIiB0aHJlc2hvbGQgdmFsdWUgYmV0d2VlbiAwIGFuZCAxIGhlcmUhXG4gICAgICBjYW5KdW1wID0gdHJ1ZTtcbiAgfSk7XG5cbiAgY29uc3Qgb25Nb3VzZU1vdmUgPSBldmVudCA9PiB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIGNvbnN0IG1vdmVtZW50WCA9IHR5cGVvZiBldmVudC5tb3ZlbWVudFggPT09ICdudW1iZXInXG4gICAgICA/IGV2ZW50Lm1vdmVtZW50WCA6IHR5cGVvZiBldmVudC5tb3pNb3ZlbWVudFggPT09ICdudW1iZXInXG4gICAgICAgID8gZXZlbnQubW96TW92ZW1lbnRYIDogdHlwZW9mIGV2ZW50LmdldE1vdmVtZW50WCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgID8gZXZlbnQuZ2V0TW92ZW1lbnRYKCkgOiAwO1xuICAgIGNvbnN0IG1vdmVtZW50WSA9IHR5cGVvZiBldmVudC5tb3ZlbWVudFkgPT09ICdudW1iZXInXG4gICAgICA/IGV2ZW50Lm1vdmVtZW50WSA6IHR5cGVvZiBldmVudC5tb3pNb3ZlbWVudFkgPT09ICdudW1iZXInXG4gICAgICAgID8gZXZlbnQubW96TW92ZW1lbnRZIDogdHlwZW9mIGV2ZW50LmdldE1vdmVtZW50WSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgID8gZXZlbnQuZ2V0TW92ZW1lbnRZKCkgOiAwO1xuXG4gICAgeWF3T2JqZWN0LnJvdGF0aW9uLnkgLT0gbW92ZW1lbnRYICogMC4wMDI7XG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCAtPSBtb3ZlbWVudFkgKiAwLjAwMjtcblxuICAgIHBpdGNoT2JqZWN0LnJvdGF0aW9uLnggPSBNYXRoLm1heCgtUElfMiwgTWF0aC5taW4oUElfMiwgcGl0Y2hPYmplY3Qucm90YXRpb24ueCkpO1xuICB9O1xuXG4gIGNvbnN0IG9uS2V5RG93biA9IGV2ZW50ID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgIG1vdmVGb3J3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgbW92ZUxlZnQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgY2FzZSA4MzogLy8gc1xuICAgICAgICBtb3ZlQmFja3dhcmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgbW92ZVJpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzI6IC8vIHNwYWNlXG4gICAgICAgIGlmIChjYW5KdW1wID09PSB0cnVlKSBwbGF5ZXIuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogMCwgeTogMzAwLCB6OiAwfSk7XG4gICAgICAgIGNhbkp1bXAgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY6IC8vIHNoaWZ0XG4gICAgICAgIHJ1blZlbG9jaXR5ID0gMC41O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgb25LZXlVcCA9IGV2ZW50ID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgIG1vdmVGb3J3YXJkID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBhXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuMjU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfTtcblxuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCBmYWxzZSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93biwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCwgZmFsc2UpO1xuXG4gIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICB0aGlzLmdldE9iamVjdCA9ICgpID0+IHlhd09iamVjdDtcblxuICB0aGlzLmdldERpcmVjdGlvbiA9IHRhcmdldFZlYyA9PiB7XG4gICAgdGFyZ2V0VmVjLnNldCgwLCAwLCAtMSk7XG4gICAgcXVhdC5tdWx0aXBseVZlY3RvcjModGFyZ2V0VmVjKTtcbiAgfTtcblxuICAvLyBNb3ZlcyB0aGUgY2FtZXJhIHRvIHRoZSBQaHlzaS5qcyBvYmplY3QgcG9zaXRpb25cbiAgLy8gYW5kIGFkZHMgdmVsb2NpdHkgdG8gdGhlIG9iamVjdCBpZiB0aGUgcnVuIGtleSBpcyBkb3duLlxuICBjb25zdCBpbnB1dFZlbG9jaXR5ID0gbmV3IFZlY3RvcjMoKSxcbiAgICBldWxlciA9IG5ldyBFdWxlcigpO1xuXG4gIHRoaXMudXBkYXRlID0gZGVsdGEgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBkZWx0YSA9IGRlbHRhIHx8IDAuNTtcbiAgICBkZWx0YSA9IE1hdGgubWluKGRlbHRhLCAwLjUsIGRlbHRhKTtcblxuICAgIGlucHV0VmVsb2NpdHkuc2V0KDAsIDAsIDApO1xuXG4gICAgY29uc3Qgc3BlZWQgPSB2ZWxvY2l0eUZhY3RvciAqIGRlbHRhICogcGFyYW1zLnNwZWVkICogcnVuVmVsb2NpdHk7XG5cbiAgICBpZiAobW92ZUZvcndhcmQpIGlucHV0VmVsb2NpdHkueiA9IC1zcGVlZDtcbiAgICBpZiAobW92ZUJhY2t3YXJkKSBpbnB1dFZlbG9jaXR5LnogPSBzcGVlZDtcbiAgICBpZiAobW92ZUxlZnQpIGlucHV0VmVsb2NpdHkueCA9IC1zcGVlZDtcbiAgICBpZiAobW92ZVJpZ2h0KSBpbnB1dFZlbG9jaXR5LnggPSBzcGVlZDtcblxuICAgIC8vIENvbnZlcnQgdmVsb2NpdHkgdG8gd29ybGQgY29vcmRpbmF0ZXNcbiAgICBldWxlci54ID0gcGl0Y2hPYmplY3Qucm90YXRpb24ueDtcbiAgICBldWxlci55ID0geWF3T2JqZWN0LnJvdGF0aW9uLnk7XG4gICAgZXVsZXIub3JkZXIgPSAnWFlaJztcblxuICAgIHF1YXQuc2V0RnJvbUV1bGVyKGV1bGVyKTtcblxuICAgIGlucHV0VmVsb2NpdHkuYXBwbHlRdWF0ZXJuaW9uKHF1YXQpO1xuXG4gICAgcGxheWVyLmFwcGx5Q2VudHJhbEltcHVsc2Uoe3g6IGlucHV0VmVsb2NpdHkueCwgeTogMCwgejogaW5wdXRWZWxvY2l0eS56fSk7XG4gICAgcGxheWVyLnNldEFuZ3VsYXJWZWxvY2l0eSh7eDogaW5wdXRWZWxvY2l0eS56LCB5OiAwLCB6OiAtaW5wdXRWZWxvY2l0eS54fSk7XG4gICAgcGxheWVyLnNldEFuZ3VsYXJGYWN0b3Ioe3g6IDAsIHk6IDAsIHo6IDB9KTtcbiAgfTtcblxuICBwbGF5ZXIub24oJ3BoeXNpY3M6YWRkZWQnLCAoKSA9PiB7XG4gICAgcGxheWVyLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGUnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuICAgICAgeWF3T2JqZWN0LnBvc2l0aW9uLmNvcHkocGxheWVyLnBvc2l0aW9uKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBGaXJzdFBlcnNvbk1vZHVsZSB7XG4gIHN0YXRpYyBkZWZhdWx0cyA9IHtcbiAgICBibG9jazogbnVsbCxcbiAgICBzcGVlZDogMSxcbiAgICB5cG9zOiAxXG4gIH07XG5cbiAgY29uc3RydWN0b3Iob2JqZWN0LCBwYXJhbXMgPSB7fSkge1xuICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgaWYgKCF0aGlzLnBhcmFtcy5ibG9jaykge1xuICAgICAgdGhpcy5wYXJhbXMuYmxvY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmxvY2tlcicpO1xuICAgIH1cbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIHRoaXMuY29udHJvbHMgPSBuZXcgRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihtYW5hZ2VyLmdldCgnY2FtZXJhJyksIHRoaXMub2JqZWN0LCB0aGlzLnBhcmFtcyk7XG5cbiAgICBpZiAoJ3BvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICdtb3pQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnd2Via2l0UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBpZiAoZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQubW96UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQud2Via2l0UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignUG9pbnRlciBsb2NrIGVycm9yLicpO1xuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrID0gZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdFBvaW50ZXJMb2NrO1xuXG4gICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4gPSBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuO1xuXG4gICAgICAgIGlmICgvRmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICBjb25zdCBmdWxsc2NyZWVuY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuXG4gICAgICAgICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfSBlbHNlIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgY29uc29sZS53YXJuKCdZb3VyIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0aGUgUG9pbnRlckxvY2sgV0hTLkFQSS4nKTtcblxuICAgIG1hbmFnZXIuZ2V0KCdzY2VuZScpLmFkZCh0aGlzLmNvbnRyb2xzLmdldE9iamVjdCgpKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgdXBkYXRlUHJvY2Vzc29yID0gYyA9PiB7XG4gICAgICBzZWxmLmNvbnRyb2xzLnVwZGF0ZShjLmdldERlbHRhKCkpO1xuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZUxvb3AgPSBuZXcgTG9vcCh1cGRhdGVQcm9jZXNzb3IpLnN0YXJ0KHRoaXMpO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTUVTU0FHRV9UWVBFUyIsIlJFUE9SVF9JVEVNU0laRSIsIkNPTExJU0lPTlJFUE9SVF9JVEVNU0laRSIsIlZFSElDTEVSRVBPUlRfSVRFTVNJWkUiLCJDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFIiwidGVtcDFWZWN0b3IzIiwiVmVjdG9yMyIsInRlbXAyVmVjdG9yMyIsInRlbXAxTWF0cml4NCIsIk1hdHJpeDQiLCJ0ZW1wMVF1YXQiLCJRdWF0ZXJuaW9uIiwiZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiIsIngiLCJ5IiwieiIsInciLCJNYXRoIiwiYXRhbjIiLCJhc2luIiwiZ2V0UXVhdGVydGlvbkZyb21FdWxlciIsImMxIiwiY29zIiwiczEiLCJzaW4iLCJjMiIsInMyIiwiYzMiLCJzMyIsImMxYzIiLCJzMXMyIiwiY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCIsInBvc2l0aW9uIiwib2JqZWN0IiwiaWRlbnRpdHkiLCJtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbiIsInF1YXRlcm5pb24iLCJnZXRJbnZlcnNlIiwiY29weSIsInN1YiIsImFwcGx5TWF0cml4NCIsImFkZE9iamVjdENoaWxkcmVuIiwicGFyZW50IiwiaSIsImNoaWxkcmVuIiwibGVuZ3RoIiwiY2hpbGQiLCJfcGh5c2lqcyIsImNvbXBvbmVudCIsInVwZGF0ZU1hdHJpeCIsInVwZGF0ZU1hdHJpeFdvcmxkIiwic2V0RnJvbU1hdHJpeFBvc2l0aW9uIiwibWF0cml4V29ybGQiLCJzZXRGcm9tUm90YXRpb25NYXRyaXgiLCJwb3NpdGlvbl9vZmZzZXQiLCJyb3RhdGlvbiIsInB1c2giLCJFdmVudGFibGUiLCJfZXZlbnRMaXN0ZW5lcnMiLCJldmVudF9uYW1lIiwiY2FsbGJhY2siLCJoYXNPd25Qcm9wZXJ0eSIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInBhcmFtZXRlcnMiLCJBcnJheSIsInByb3RvdHlwZSIsImNhbGwiLCJhcmd1bWVudHMiLCJhcHBseSIsIm9iaiIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZGlzcGF0Y2hFdmVudCIsIkNvbmVUd2lzdENvbnN0cmFpbnQiLCJvYmphIiwib2JqYiIsIm9iamVjdGEiLCJvYmplY3RiIiwidW5kZWZpbmVkIiwiY29uc29sZSIsImVycm9yIiwidHlwZSIsImFwcGxpZWRJbXB1bHNlIiwid29ybGRNb2R1bGUiLCJpZCIsInBvc2l0aW9uYSIsImNsb25lIiwicG9zaXRpb25iIiwiYXhpc2EiLCJheGlzYiIsImV4ZWN1dGUiLCJjb25zdHJhaW50IiwibWF4X2ltcHVsc2UiLCJ0YXJnZXQiLCJUSFJFRSIsInNldEZyb21FdWxlciIsIkV1bGVyIiwiSGluZ2VDb25zdHJhaW50IiwiYXhpcyIsImxvdyIsImhpZ2giLCJiaWFzX2ZhY3RvciIsInJlbGF4YXRpb25fZmFjdG9yIiwidmVsb2NpdHkiLCJhY2NlbGVyYXRpb24iLCJQb2ludENvbnN0cmFpbnQiLCJTbGlkZXJDb25zdHJhaW50IiwibGluX2xvd2VyIiwibGluX3VwcGVyIiwiYW5nX2xvd2VyIiwiYW5nX3VwcGVyIiwibGluZWFyIiwiYW5ndWxhciIsInNjZW5lIiwiRE9GQ29uc3RyYWludCIsImxpbWl0Iiwid2hpY2giLCJsb3dfYW5nbGUiLCJoaWdoX2FuZ2xlIiwibWF4X2ZvcmNlIiwiVmVoaWNsZSIsIm1lc2giLCJ0dW5pbmciLCJWZWhpY2xlVHVuaW5nIiwid2hlZWxzIiwiZ2V0T2JqZWN0SWQiLCJzdXNwZW5zaW9uX3N0aWZmbmVzcyIsInN1c3BlbnNpb25fY29tcHJlc3Npb24iLCJzdXNwZW5zaW9uX2RhbXBpbmciLCJtYXhfc3VzcGVuc2lvbl90cmF2ZWwiLCJmcmljdGlvbl9zbGlwIiwibWF4X3N1c3BlbnNpb25fZm9yY2UiLCJ3aGVlbF9nZW9tZXRyeSIsIndoZWVsX21hdGVyaWFsIiwiY29ubmVjdGlvbl9wb2ludCIsIndoZWVsX2RpcmVjdGlvbiIsIndoZWVsX2F4bGUiLCJzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoIiwid2hlZWxfcmFkaXVzIiwiaXNfZnJvbnRfd2hlZWwiLCJ3aGVlbCIsIk1lc2giLCJjYXN0U2hhZG93IiwicmVjZWl2ZVNoYWRvdyIsIm11bHRpcGx5U2NhbGFyIiwiYWRkIiwid29ybGQiLCJhbW91bnQiLCJzdGVlcmluZyIsImJyYWtlIiwiZm9yY2UiLCJXb3JsZE1vZHVsZSIsInBhcmFtcyIsImJyaWRnZSIsInNlbGYiLCJkZWZlciIsIm9uQWRkQ2FsbGJhY2siLCJiaW5kIiwib25SZW1vdmVDYWxsYmFjayIsIk9iamVjdCIsImFzc2lnbiIsInN0YXJ0IiwicGVyZm9ybWFuY2UiLCJub3ciLCJ3b3JrZXIiLCJyZXF1aXJlIiwidHJhbnNmZXJhYmxlTWVzc2FnZSIsIndlYmtpdFBvc3RNZXNzYWdlIiwicG9zdE1lc3NhZ2UiLCJpc0xvYWRlZCIsImxvYWRlciIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwid2FzbSIsInRoZW4iLCJyZXNwb25zZSIsImFycmF5QnVmZmVyIiwid2FzbUJ1ZmZlciIsImJ1ZmZlciIsIl9tYXRlcmlhbHNfcmVmX2NvdW50cyIsIl9vYmplY3RzIiwiX3ZlaGljbGVzIiwiX2NvbnN0cmFpbnRzIiwiX2lzX3NpbXVsYXRpbmciLCJfaWQiLCJhYiIsIkFycmF5QnVmZmVyIiwiU1VQUE9SVF9UUkFOU0ZFUkFCTEUiLCJieXRlTGVuZ3RoIiwib25tZXNzYWdlIiwiZXZlbnQiLCJfdGVtcCIsImRhdGEiLCJGbG9hdDMyQXJyYXkiLCJXT1JMRFJFUE9SVCIsInVwZGF0ZVNjZW5lIiwiU09GVFJFUE9SVCIsInVwZGF0ZVNvZnRib2RpZXMiLCJDT0xMSVNJT05SRVBPUlQiLCJ1cGRhdGVDb2xsaXNpb25zIiwiVkVISUNMRVJFUE9SVCIsInVwZGF0ZVZlaGljbGVzIiwiQ09OU1RSQUlOVFJFUE9SVCIsInVwZGF0ZUNvbnN0cmFpbnRzIiwiY21kIiwibG9nIiwidGVzdCIsImRlYnVnIiwiZGlyIiwib2Zmc2V0IiwiX19kaXJ0eVBvc2l0aW9uIiwic2V0IiwiX19kaXJ0eVJvdGF0aW9uIiwibGluZWFyVmVsb2NpdHkiLCJhbmd1bGFyVmVsb2NpdHkiLCJzaXplIiwiYXR0cmlidXRlcyIsImdlb21ldHJ5Iiwidm9sdW1lUG9zaXRpb25zIiwiYXJyYXkiLCJvZmZzZXRWZXJ0IiwiaXNTb2Z0Qm9keVJlc2V0Iiwidm9sdW1lTm9ybWFscyIsIm5vcm1hbCIsIm9mZnMiLCJ4MSIsInkxIiwiejEiLCJueDEiLCJueTEiLCJuejEiLCJ4MiIsInkyIiwiejIiLCJueDIiLCJueTIiLCJuejIiLCJ4MyIsInkzIiwiejMiLCJueDMiLCJueTMiLCJuejMiLCJpOSIsIm5lZWRzVXBkYXRlIiwibngiLCJueSIsIm56IiwidmVoaWNsZSIsImV4dHJhY3RSb3RhdGlvbiIsIm1hdHJpeCIsImFkZFZlY3RvcnMiLCJjb2xsaXNpb25zIiwibm9ybWFsX29mZnNldHMiLCJvYmplY3QyIiwiaWQxIiwiaiIsInRvdWNoZXMiLCJpZDIiLCJjb21wb25lbnQyIiwiX3BoeXNpanMyIiwic3ViVmVjdG9ycyIsImdldExpbmVhclZlbG9jaXR5IiwidGVtcDEiLCJnZXRBbmd1bGFyVmVsb2NpdHkiLCJ0ZW1wMiIsIm5vcm1hbF9vZmZzZXQiLCJlbWl0Iiwic2hvd19tYXJrZXIiLCJnZXREZWZpbml0aW9uIiwibWFya2VyIiwiU3BoZXJlR2VvbWV0cnkiLCJNZXNoTm9ybWFsTWF0ZXJpYWwiLCJCb3hHZW9tZXRyeSIsIm5hdGl2ZSIsIm1hbmFnZXIiLCJtYXRlcmlhbCIsIm1hdGVyaWFsSWQiLCJ3aWR0aCIsInNjYWxlIiwiaGVpZ2h0IiwiZGVwdGgiLCJyZW1vdmUiLCJwb3AiLCJmdW5jIiwiYXJncyIsInNldEZpeGVkVGltZVN0ZXAiLCJmaXhlZFRpbWVTdGVwIiwic2V0R3Jhdml0eSIsImdyYXZpdHkiLCJhZGRDb25zdHJhaW50Iiwic2ltdWxhdGUiLCJ0aW1lU3RlcCIsIm1heFN1YlN0ZXBzIiwiX3N0YXRzIiwiYmVnaW4iLCJvYmplY3RfaWQiLCJ1cGRhdGUiLCJwb3MiLCJpc1NvZnRib2R5IiwicXVhdCIsImVuZCIsInNpbXVsYXRlTG9vcCIsIkxvb3AiLCJjbG9jayIsImdldERlbHRhIiwiYXBpIiwiaGFzIiwiZ2V0IiwiZmFjdG9yIiwidGhyZXNob2xkIiwicmFkaXVzIiwicHJvcGVydGllcyIsIl9uYXRpdmUiLCJ2ZWN0b3IzIiwic2NvcGUiLCJkZWZpbmVQcm9wZXJ0aWVzIiwiX3giLCJfeSIsIl96IiwiX19jX3JvdCIsIm9uQ2hhbmdlIiwiZXVsZXIiLCJyb3QiLCJ3cmFwUGh5c2ljc1Byb3RvdHlwZSIsImtleSIsImRlZmluZVByb3BlcnR5Iiwib25Db3B5Iiwic291cmNlIiwib25XcmFwIiwiQm94TW9kdWxlIiwiYm91bmRpbmdCb3giLCJjb21wdXRlQm91bmRpbmdCb3giLCJtYXgiLCJtaW4iLCJtYXNzIiwiZ3JvdXAiLCJtYXNrIiwiZnJpY3Rpb24iLCJyZXN0aXR1dGlvbiIsImRhbXBpbmciLCJtYXJnaW4iLCJDb21wb3VuZE1vZHVsZSIsIkNhcHN1bGVNb2R1bGUiLCJDb25jYXZlTW9kdWxlIiwicGF0aCIsIndhaXQiLCJnZW9tZXRyeUxvYWRlciIsImdlb21ldHJ5UHJvY2Vzc29yIiwiZ2VvbSIsIkpTT05Mb2FkZXIiLCJsb2FkIiwiaXNCdWZmZXIiLCJmYWNlcyIsInZlcnRpY2VzIiwiZmFjZSIsInZBIiwiYSIsInZCIiwiYiIsInZDIiwiYyIsIkNvbmVNb2R1bGUiLCJDb252ZXhNb2R1bGUiLCJfYnVmZmVyR2VvbWV0cnkiLCJCdWZmZXJHZW9tZXRyeSIsImZyb21HZW9tZXRyeSIsIkN5bGluZGVyTW9kdWxlIiwiSGVpZ2h0ZmllbGRNb2R1bGUiLCJ2ZXJ0cyIsInhkaXYiLCJ5ZGl2IiwieHNpemUiLCJ5c2l6ZSIsInhwdHMiLCJzcXJ0IiwieXB0cyIsImFic01heEhlaWdodCIsImFicyIsInBvaW50cyIsInZOdW0iLCJyb3VuZCIsIm11bHRpcGx5IiwiYXV0b0FsaWduIiwidHJhbnNsYXRlIiwiVmVjdG9yMiIsIlBsYW5lTW9kdWxlIiwiU3BoZXJlTW9kdWxlIiwiYm91bmRpbmdTcGhlcmUiLCJjb21wdXRlQm91bmRpbmdTcGhlcmUiLCJTb2Z0Ym9keU1vZHVsZSIsImlkeEdlb21ldHJ5IiwibWVyZ2VWZXJ0aWNlcyIsImJ1ZmZlckdlb21ldHJ5IiwiYWRkQXR0cmlidXRlIiwiQnVmZmVyQXR0cmlidXRlIiwiY29weVZlY3RvcjNzQXJyYXkiLCJzZXRJbmRleCIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJjb3B5SW5kaWNlc0FycmF5IiwiYVZlcnRpY2VzIiwiYUluZGljZXMiLCJuZHhHZW9tZXRyeSIsIm5vZGUiLCJpbmZsdWVuY2UiLCJjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzIiwibzEiLCJvMiIsInByZXNzdXJlIiwia2xzdCIsImthc3QiLCJrdnN0IiwiZHJhZyIsImxpZnQiLCJwaXRlcmF0aW9ucyIsInZpdGVyYXRpb25zIiwiZGl0ZXJhdGlvbnMiLCJjaXRlcmF0aW9ucyIsImFuY2hvckhhcmRuZXNzIiwicmlnaWRIYXJkbmVzcyIsImFwcGVuZEFuY2hvciIsIkNsb3RoTW9kdWxlIiwiZ2VvbVBhcmFtcyIsImZhY2VzTGVuZ3RoIiwibm9ybWFsc0FycmF5IiwiaTMiLCJ3aWR0aFNlZ21lbnRzIiwiaGVpZ2h0U2VnbWVudHMiLCJpZHgwMCIsImlkeDAxIiwiaWR4MTAiLCJpZHgxMSIsImNvcm5lcnMiLCJzZWdtZW50cyIsIlJvcGVNb2R1bGUiLCJidWZmIiwidmVydCIsImZyb21BcnJheSIsIm4iLCJ2MSIsInYyIiwiUElfMiIsIlBJIiwiRmlyc3RQZXJzb25Db250cm9sc1NvbHZlciIsImNhbWVyYSIsInZlbG9jaXR5RmFjdG9yIiwicnVuVmVsb2NpdHkiLCJzZXRBbmd1bGFyRmFjdG9yIiwicGxheWVyIiwicGl0Y2hPYmplY3QiLCJPYmplY3QzRCIsInlhd09iamVjdCIsInlwb3MiLCJjYW5KdW1wIiwibW92ZUJhY2t3YXJkIiwibW92ZUxlZnQiLCJtb3ZlUmlnaHQiLCJvbiIsIm90aGVyT2JqZWN0IiwidiIsInIiLCJjb250YWN0Tm9ybWFsIiwib25Nb3VzZU1vdmUiLCJlbmFibGVkIiwibW92ZW1lbnRYIiwibW96TW92ZW1lbnRYIiwiZ2V0TW92ZW1lbnRYIiwibW92ZW1lbnRZIiwibW96TW92ZW1lbnRZIiwiZ2V0TW92ZW1lbnRZIiwib25LZXlEb3duIiwia2V5Q29kZSIsImFwcGx5Q2VudHJhbEltcHVsc2UiLCJvbktleVVwIiwiYm9keSIsImdldE9iamVjdCIsImdldERpcmVjdGlvbiIsIm11bHRpcGx5VmVjdG9yMyIsInRhcmdldFZlYyIsImlucHV0VmVsb2NpdHkiLCJkZWx0YSIsInNwZWVkIiwibW92ZUZvcndhcmQiLCJvcmRlciIsImFwcGx5UXVhdGVybmlvbiIsInNldEFuZ3VsYXJWZWxvY2l0eSIsIkZpcnN0UGVyc29uTW9kdWxlIiwiYmxvY2siLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiY29udHJvbHMiLCJlbGVtZW50IiwicG9pbnRlcmxvY2tjaGFuZ2UiLCJwb2ludGVyTG9ja0VsZW1lbnQiLCJtb3pQb2ludGVyTG9ja0VsZW1lbnQiLCJ3ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQiLCJzdHlsZSIsImRpc3BsYXkiLCJwb2ludGVybG9ja2Vycm9yIiwid2FybiIsInF1ZXJ5U2VsZWN0b3IiLCJyZXF1ZXN0UG9pbnRlckxvY2siLCJtb3pSZXF1ZXN0UG9pbnRlckxvY2siLCJ3ZWJraXRSZXF1ZXN0UG9pbnRlckxvY2siLCJyZXF1ZXN0RnVsbHNjcmVlbiIsIm1velJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxTY3JlZW4iLCJ3ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbiIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsImZ1bGxzY3JlZW5jaGFuZ2UiLCJmdWxsc2NyZWVuRWxlbWVudCIsIm1vekZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbFNjcmVlbkVsZW1lbnQiLCJ1cGRhdGVQcm9jZXNzb3IiLCJ1cGRhdGVMb29wIiwiZGVmYXVsdHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFNQSxJQUFNQSxnQkFBZ0I7ZUFDUCxDQURPO21CQUVILENBRkc7aUJBR0wsQ0FISztvQkFJRixDQUpFO2NBS1I7Q0FMZDs7QUFRQSxJQUFNQyxrQkFBa0IsRUFBeEI7SUFDRUMsMkJBQTJCLENBRDdCO0lBRUVDLHlCQUF5QixDQUYzQjtJQUdFQyw0QkFBNEIsQ0FIOUI7O0FBS0EsSUFBTUMsZUFBZSxJQUFJQyxhQUFKLEVBQXJCO0lBQ0VDLGVBQWUsSUFBSUQsYUFBSixFQURqQjtJQUVFRSxl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
