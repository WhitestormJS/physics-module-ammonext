/* Physics module AmmoNext v0.1.2 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('whs')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three', 'whs'], factory) :
	(factory((global.PHYSICS = global.PHYSICS || {}),global.THREE,global.WHS));
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
  var transferableMessage = self.webkitPostMessage || self.postMessage,


  // enum
  MESSAGE_TYPES = {
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

  var ab = new ArrayBuffer(1);

  transferableMessage(ab, [ab]);
  var SUPPORT_TRANSFERABLE = ab.byteLength === 0;

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

    if (params.wasmBuffer) {
      importScripts(params.ammo);

      self.Ammo = loadAmmoFromBinary(params.wasmBuffer);
      transferableMessage({ cmd: 'ammoLoaded' });
      public_functions.makeWorld(params);
    } else {
      importScripts(params.ammo);
      transferableMessage({ cmd: 'ammoLoaded' });
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

    transferableMessage({ cmd: 'worldReady' });
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

    transferableMessage({ cmd: 'objectReady', params: body.id });
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
    last_simulation_time = Date.now();
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

    if (SUPPORT_TRANSFERABLE) transferableMessage(worldreport.buffer, [worldreport.buffer]);else transferableMessage(worldreport);
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

    // if (SUPPORT_TRANSFERABLE) transferableMessage(softreport.buffer, [softreport.buffer]);
    // else transferableMessage(softreport);
    transferableMessage(softreport);
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
        // transferableMessage(_objects_ammo);
      }
    }

    if (SUPPORT_TRANSFERABLE) transferableMessage(collisionreport.buffer, [collisionreport.buffer]);else transferableMessage(collisionreport);
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

      if (SUPPORT_TRANSFERABLE && j !== 0) transferableMessage(vehiclereport.buffer, [vehiclereport.buffer]);else if (j !== 0) transferableMessage(vehiclereport);
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

      if (SUPPORT_TRANSFERABLE && i !== 0) transferableMessage(constraintreport.buffer, [constraintreport.buffer]);else if (i !== 0) transferableMessage(constraintreport);
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
});

var WorldModule = function (_Eventable) {
  inherits(WorldModule, _Eventable);

  function WorldModule(params) {
    classCallCheck(this, WorldModule);

    var _this = possibleConstructorReturn(this, (WorldModule.__proto__ || Object.getPrototypeOf(WorldModule)).call(this));

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


    _this.params = Object.assign({
      fixedTimeStep: 1 / 60,
      rateLimit: true,
      ammo: "",
      softbody: false,
      gravity: new three.Vector3(0, -100, 0)
    }, params);

    var start = performance.now();

    _this.worker = new PhysicsWorker();
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
    value: function updateScene(info) {
      var index = info[1];

      while (index--) {
        var offset = 2 + index * REPORT_ITEMSIZE;
        var object = this._objects[info[offset]];
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

      if (this.SUPPORT_TRANSFERABLE) this.worker.transferableMessage(info.buffer, [info.buffer]); // Give the typed array back to the worker

      this._is_simulating = false;
      this.dispatchEvent('update');
    }
  }, {
    key: 'updateSoftbodies',
    value: function updateSoftbodies(info) {
      var index = info[1],
          offset = 2;

      while (index--) {
        var size = info[offset + 1];
        var object = this._objects[info[offset]];

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
      //   this.worker.transferableMessage(info.buffer, [info.buffer]); // Give the typed array back to the worker

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
      for (var id1 in this._objects) {
        if (!this._objects.hasOwnProperty(id1)) continue;
        var _object = this._objects[id1];
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
            var _object2 = this._objects[id2];
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

      if (this.SUPPORT_TRANSFERABLE) this.worker.transferableMessage(info.buffer, [info.buffer]); // Give the typed array back to the worker
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
      var data = object.component.use('physics').data;

      if (data) {
        component.manager.set('module:world', this);
        data.id = this.getObjectId();
        object.component.use('physics').data = data;

        if (object instanceof Vehicle) {
          this.onAddCallback(object.mesh);
          this._vehicles[data.id] = object;
          this.execute('addVehicle', data);
        } else {
          component.__dirtyPosition = false;
          component.__dirtyRotation = false;
          this._objects[data.id] = object;

          if (object.children.length) {
            data.children = [];
            addObjectChildren(object, object);
          }

          // if (object.material._physijs) {
          //   if (this._materials_ref_counts.hasOwnProperty(object.material._physijs.id))
          //     this._materials_ref_counts[object.material._physijs.id]++;
          //   else {
          //     this.execute('registerMaterial', object.material._physijs);
          //     data.materialId = object.material._physijs.id;
          //     this._materials_ref_counts[object.material._physijs.id] = 1;
          //   }
          // }

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
          _this3.simulate(clock.getDelta(), 1); // delta, 1
        });

        self.simulateLoop.start(_this3);

        _this3.setGravity(params.gravity);
      });
    }
  }]);
  return WorldModule;
}(Eventable);

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

var _class;
var _temp;

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

var _default = (_temp = _class = function (_API) {
  inherits(_default, _API);

  function _default(defaults$$1, data) {
    classCallCheck(this, _default);

    var _this = possibleConstructorReturn(this, (_default.__proto__ || Object.getPrototypeOf(_default)).call(this));

    _this.bridge = {
      onCopy: onCopy,
      onWrap: onWrap
    };

    _this.data = Object.assign(defaults$$1, data);
    return _this;
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
}(API), _class.rigidbody = function () {
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
}, _class.softbody = function () {
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
}, _class.rope = function () {
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
}, _class.cloth = function () {
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

var _class$1;
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

var FirstPersonModule = (_temp$1 = _class$1 = function () {
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
}(), _class$1.defaults = {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkuanMiLCIuLi9zcmMvZXZlbnRhYmxlLmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0NvbmVUd2lzdENvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvSGluZ2VDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL1BvaW50Q29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9TbGlkZXJDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0RPRkNvbnN0cmFpbnQuanMiLCIuLi9zcmMvdmVoaWNsZS92ZWhpY2xlLmpzIiwiLi4vYnVuZGxlLXdvcmtlci93b3JrZXJoZWxwZXIuanMiLCIuLi9zcmMvd29ya2VyLmpzIiwiLi4vc3JjL21vZHVsZXMvV29ybGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9waHlzaWNzUHJvdG90eXBlLmpzIiwiLi4vc3JjL21vZHVsZXMvUGh5c2ljc01vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0JveE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbXBvdW5kTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ2Fwc3VsZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbmNhdmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db25lTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29udmV4TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ3lsaW5kZXJNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9IZWlnaHRmaWVsZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1BsYW5lTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvU3BoZXJlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvU29mdGJvZHlNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DbG90aE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1JvcGVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb250cm9scy9GaXJzdFBlcnNvbk1vZHVsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBWZWN0b3IzLFxuICBNYXRyaXg0LFxuICBRdWF0ZXJuaW9uXG59IGZyb20gJ3RocmVlJztcblxuY29uc3QgTUVTU0FHRV9UWVBFUyA9IHtcbiAgV09STERSRVBPUlQ6IDAsXG4gIENPTExJU0lPTlJFUE9SVDogMSxcbiAgVkVISUNMRVJFUE9SVDogMixcbiAgQ09OU1RSQUlOVFJFUE9SVDogMyxcbiAgU09GVFJFUE9SVDogNFxufTtcblxuY29uc3QgUkVQT1JUX0lURU1TSVpFID0gMTQsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSA9IDUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgPSA5LFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFID0gNjtcblxuY29uc3QgdGVtcDFWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDJWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDFNYXRyaXg0ID0gbmV3IE1hdHJpeDQoKSxcbiAgdGVtcDFRdWF0ID0gbmV3IFF1YXRlcm5pb24oKTtcblxuY29uc3QgZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiA9ICh4LCB5LCB6LCB3KSA9PiB7XG4gIHJldHVybiBuZXcgVmVjdG9yMyhcbiAgICBNYXRoLmF0YW4yKDIgKiAoeCAqIHcgLSB5ICogeiksICh3ICogdyAtIHggKiB4IC0geSAqIHkgKyB6ICogeikpLFxuICAgIE1hdGguYXNpbigyICogKHggKiB6ICsgeSAqIHcpKSxcbiAgICBNYXRoLmF0YW4yKDIgKiAoeiAqIHcgLSB4ICogeSksICh3ICogdyArIHggKiB4IC0geSAqIHkgLSB6ICogeikpXG4gICk7XG59O1xuXG5jb25zdCBnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyID0gKHgsIHksIHopID0+IHtcbiAgY29uc3QgYzEgPSBNYXRoLmNvcyh5KTtcbiAgY29uc3QgczEgPSBNYXRoLnNpbih5KTtcbiAgY29uc3QgYzIgPSBNYXRoLmNvcygteik7XG4gIGNvbnN0IHMyID0gTWF0aC5zaW4oLXopO1xuICBjb25zdCBjMyA9IE1hdGguY29zKHgpO1xuICBjb25zdCBzMyA9IE1hdGguc2luKHgpO1xuICBjb25zdCBjMWMyID0gYzEgKiBjMjtcbiAgY29uc3QgczFzMiA9IHMxICogczI7XG5cbiAgcmV0dXJuIHtcbiAgICB3OiBjMWMyICogYzMgLSBzMXMyICogczMsXG4gICAgeDogYzFjMiAqIHMzICsgczFzMiAqIGMzLFxuICAgIHk6IHMxICogYzIgKiBjMyArIGMxICogczIgKiBzMyxcbiAgICB6OiBjMSAqIHMyICogYzMgLSBzMSAqIGMyICogczNcbiAgfTtcbn07XG5cbmNvbnN0IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QgPSAocG9zaXRpb24sIG9iamVjdCkgPT4ge1xuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKTsgLy8gcmVzZXQgdGVtcCBtYXRyaXhcblxuICAvLyBTZXQgdGhlIHRlbXAgbWF0cml4J3Mgcm90YXRpb24gdG8gdGhlIG9iamVjdCdzIHJvdGF0aW9uXG4gIHRlbXAxTWF0cml4NC5pZGVudGl0eSgpLm1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKG9iamVjdC5xdWF0ZXJuaW9uKTtcblxuICAvLyBJbnZlcnQgcm90YXRpb24gbWF0cml4IGluIG9yZGVyIHRvIFwidW5yb3RhdGVcIiBhIHBvaW50IGJhY2sgdG8gb2JqZWN0IHNwYWNlXG4gIHRlbXAxTWF0cml4NC5nZXRJbnZlcnNlKHRlbXAxTWF0cml4NCk7XG5cbiAgLy8gWWF5ISBUZW1wIHZhcnMhXG4gIHRlbXAxVmVjdG9yMy5jb3B5KHBvc2l0aW9uKTtcbiAgdGVtcDJWZWN0b3IzLmNvcHkob2JqZWN0LnBvc2l0aW9uKTtcblxuICAvLyBBcHBseSB0aGUgcm90YXRpb25cbiAgcmV0dXJuIHRlbXAxVmVjdG9yMy5zdWIodGVtcDJWZWN0b3IzKS5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcbn07XG5cbmNvbnN0IGFkZE9iamVjdENoaWxkcmVuID0gZnVuY3Rpb24gKHBhcmVudCwgb2JqZWN0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGQgPSBvYmplY3QuY2hpbGRyZW5baV07XG4gICAgY29uc3QgcGh5c2ljcyA9IGNoaWxkLmNvbXBvbmVudCA/IGNoaWxkLmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSA6IGZhbHNlO1xuXG4gICAgaWYgKHBoeXNpY3MpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBwaHlzaWNzLmRhdGE7XG5cbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgY2hpbGQudXBkYXRlTWF0cml4V29ybGQoKTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldEZyb21NYXRyaXhQb3NpdGlvbihjaGlsZC5tYXRyaXhXb3JsZCk7XG4gICAgICB0ZW1wMVF1YXQuc2V0RnJvbVJvdGF0aW9uTWF0cml4KGNoaWxkLm1hdHJpeFdvcmxkKTtcblxuICAgICAgZGF0YS5wb3NpdGlvbl9vZmZzZXQgPSB7XG4gICAgICAgIHg6IHRlbXAxVmVjdG9yMy54LFxuICAgICAgICB5OiB0ZW1wMVZlY3RvcjMueSxcbiAgICAgICAgejogdGVtcDFWZWN0b3IzLnpcbiAgICAgIH07XG5cbiAgICAgIGRhdGEucm90YXRpb24gPSB7XG4gICAgICAgIHg6IHRlbXAxUXVhdC54LFxuICAgICAgICB5OiB0ZW1wMVF1YXQueSxcbiAgICAgICAgejogdGVtcDFRdWF0LnosXG4gICAgICAgIHc6IHRlbXAxUXVhdC53XG4gICAgICB9O1xuXG4gICAgICBwYXJlbnQuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGEuY2hpbGRyZW4ucHVzaChkYXRhKTtcbiAgICB9XG5cbiAgICBhZGRPYmplY3RDaGlsZHJlbihwYXJlbnQsIGNoaWxkKTtcbiAgfVxufTtcblxuZXhwb3J0IHtcbiAgZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbixcbiAgZ2V0UXVhdGVydGlvbkZyb21FdWxlcixcbiAgY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCxcbiAgYWRkT2JqZWN0Q2hpbGRyZW4sXG5cbiAgTUVTU0FHRV9UWVBFUyxcbiAgUkVQT1JUX0lURU1TSVpFLFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUsXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUsXG5cbiAgdGVtcDFWZWN0b3IzLFxuICB0ZW1wMlZlY3RvcjMsXG4gIHRlbXAxTWF0cml4NCxcbiAgdGVtcDFRdWF0XG59O1xuIiwiZXhwb3J0IGNsYXNzIEV2ZW50YWJsZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzID0ge307XG4gIH1cblxuICBhZGRFdmVudExpc3RlbmVyKGV2ZW50X25hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSlcbiAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdID0gW107XG5cbiAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSwgY2FsbGJhY2spIHtcbiAgICBsZXQgaW5kZXg7XG5cbiAgICBpZiAoIXRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAoKGluZGV4ID0gdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0uaW5kZXhPZihjYWxsYmFjaykpID49IDApIHtcbiAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBkaXNwYXRjaEV2ZW50KGV2ZW50X25hbWUpIHtcbiAgICBsZXQgaTtcbiAgICBjb25zdCBwYXJhbWV0ZXJzID0gQXJyYXkucHJvdG90eXBlLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICBpZiAodGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV1baV0uYXBwbHkodGhpcywgcGFyYW1ldGVycyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG1ha2Uob2JqKSB7XG4gICAgb2JqLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gRXZlbnRhYmxlLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuICAgIG9iai5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IEV2ZW50YWJsZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcbiAgICBvYmoucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBFdmVudGFibGUucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQ7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIENvbmVUd2lzdENvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGNvbnN0IG9iamVjdGIgPSBvYmphO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIGNvbnNvbGUuZXJyb3IoJ0JvdGggb2JqZWN0cyBtdXN0IGJlIGRlZmluZWQgaW4gYSBDb25lVHdpc3RDb25zdHJhaW50LicpO1xuXG4gICAgdGhpcy50eXBlID0gJ2NvbmV0d2lzdCc7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpc2EgPSB7eDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24uen07XG4gICAgdGhpcy5heGlzYiA9IHt4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56fTtcbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0KHgsIHksIHopIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRMaW1pdCcsIHtjb25zdHJhaW50OiB0aGlzLmlkLCB4LCB5LCB6fSk7XG4gIH1cblxuICBlbmFibGVNb3RvcigpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9lbmFibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBzZXRNYXhNb3RvckltcHVsc2UobWF4X2ltcHVsc2UpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UnLCB7Y29uc3RyYWludDogdGhpcy5pZCwgbWF4X2ltcHVsc2V9KTtcbiAgfVxuXG4gIHNldE1vdG9yVGFyZ2V0KHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBUSFJFRS5WZWN0b3IzKVxuICAgICAgdGFyZ2V0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIobmV3IFRIUkVFLkV1bGVyKHRhcmdldC54LCB0YXJnZXQueSwgdGFyZ2V0LnopKTtcbiAgICBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBUSFJFRS5FdWxlcilcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHRhcmdldCk7XG4gICAgZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuTWF0cml4NClcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbVJvdGF0aW9uTWF0cml4KHRhcmdldCk7XG5cbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNb3RvclRhcmdldCcsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB4OiB0YXJnZXQueCxcbiAgICAgIHk6IHRhcmdldC55LFxuICAgICAgejogdGFyZ2V0LnosXG4gICAgICB3OiB0YXJnZXQud1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBIaW5nZUNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbiwgYXhpcykge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChheGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF4aXMgPSBwb3NpdGlvbjtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2hpbmdlJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbi5jbG9uZSgpO1xuICAgIHRoaXMuYXhpcyA9IGF4aXM7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxvdywgaGlnaCwgYmlhc19mYWN0b3IsIHJlbGF4YXRpb25fZmFjdG9yKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2Vfc2V0TGltaXRzJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIGxvdyxcbiAgICAgIGhpZ2gsXG4gICAgICBiaWFzX2ZhY3RvcixcbiAgICAgIHJlbGF4YXRpb25fZmFjdG9yXG4gICAgfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZU1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2Rpc2FibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIFBvaW50Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ3BvaW50JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iXG4gICAgfTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgU2xpZGVyQ29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uLCBheGlzKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKGF4aXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXhpcyA9IHBvc2l0aW9uO1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnc2xpZGVyJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpcyA9IGF4aXM7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxpbl9sb3dlciwgbGluX3VwcGVyLCBhbmdfbG93ZXIsIGFuZ191cHBlcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbGluX2xvd2VyLFxuICAgICAgbGluX3VwcGVyLFxuICAgICAgYW5nX2xvd2VyLFxuICAgICAgYW5nX3VwcGVyXG4gICAgfSk7XG4gIH1cblxuICBzZXRSZXN0aXR1dGlvbihsaW5lYXIsIGFuZ3VsYXIpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKFxuICAgICAgJ3NsaWRlcl9zZXRSZXN0aXR1dGlvbicsXG4gICAgICB7XG4gICAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICAgIGxpbmVhcixcbiAgICAgICAgYW5ndWxhclxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBlbmFibGVMaW5lYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTGluZWFyTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIHRoaXMuc2NlbmUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZUFuZ3VsYXJNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIERPRkNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmICggcG9zaXRpb24gPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RvZic7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCggcG9zaXRpb24sIG9iamVjdGEgKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpc2EgPSB7IHg6IG9iamVjdGEucm90YXRpb24ueCwgeTogb2JqZWN0YS5yb3RhdGlvbi55LCB6OiBvYmplY3RhLnJvdGF0aW9uLnogfTtcblxuICAgIGlmICggb2JqZWN0YiApIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCggcG9zaXRpb24sIG9iamVjdGIgKS5jbG9uZSgpO1xuICAgICAgdGhpcy5heGlzYiA9IHsgeDogb2JqZWN0Yi5yb3RhdGlvbi54LCB5OiBvYmplY3RiLnJvdGF0aW9uLnksIHo6IG9iamVjdGIucm90YXRpb24ueiB9O1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbmVhckxvd2VyTGltaXQobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhckxvd2VyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0TGluZWFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0QW5ndWxhckxvd2VyTGltaXQgKGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3RvciAod2hpY2gpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZUFuZ3VsYXJNb3RvciAod2hpY2gsIGxvd19hbmdsZSwgaGlnaF9hbmdsZSwgdmVsb2NpdHksIG1heF9mb3JjZSApIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoLCBsb3dfYW5nbGU6IGxvd19hbmdsZSwgaGlnaF9hbmdsZTogaGlnaF9hbmdsZSwgdmVsb2NpdHk6IHZlbG9jaXR5LCBtYXhfZm9yY2U6IG1heF9mb3JjZSB9ICk7XG4gIH1cblxuICBkaXNhYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtNZXNofSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge1ZlaGljbGVUdW5uaW5nfSBmcm9tICcuL3R1bm5pbmcnO1xuXG5leHBvcnQgY2xhc3MgVmVoaWNsZSB7XG4gIGNvbnN0cnVjdG9yKG1lc2gsIHR1bmluZyA9IG5ldyBWZWhpY2xlVHVuaW5nKCkpIHtcbiAgICB0aGlzLm1lc2ggPSBtZXNoO1xuICAgIHRoaXMud2hlZWxzID0gW107XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgaWQ6IGdldE9iamVjdElkKCksXG4gICAgICByaWdpZEJvZHk6IG1lc2guX3BoeXNpanMuaWQsXG4gICAgICBzdXNwZW5zaW9uX3N0aWZmbmVzczogdHVuaW5nLnN1c3BlbnNpb25fc3RpZmZuZXNzLFxuICAgICAgc3VzcGVuc2lvbl9jb21wcmVzc2lvbjogdHVuaW5nLnN1c3BlbnNpb25fY29tcHJlc3Npb24sXG4gICAgICBzdXNwZW5zaW9uX2RhbXBpbmc6IHR1bmluZy5zdXNwZW5zaW9uX2RhbXBpbmcsXG4gICAgICBtYXhfc3VzcGVuc2lvbl90cmF2ZWw6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl90cmF2ZWwsXG4gICAgICBmcmljdGlvbl9zbGlwOiB0dW5pbmcuZnJpY3Rpb25fc2xpcCxcbiAgICAgIG1heF9zdXNwZW5zaW9uX2ZvcmNlOiB0dW5pbmcubWF4X3N1c3BlbnNpb25fZm9yY2VcbiAgICB9O1xuICB9XG5cbiAgYWRkV2hlZWwod2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsLCBjb25uZWN0aW9uX3BvaW50LCB3aGVlbF9kaXJlY3Rpb24sIHdoZWVsX2F4bGUsIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsIHdoZWVsX3JhZGl1cywgaXNfZnJvbnRfd2hlZWwsIHR1bmluZykge1xuICAgIGNvbnN0IHdoZWVsID0gbmV3IE1lc2god2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsKTtcblxuICAgIHdoZWVsLmNhc3RTaGFkb3cgPSB3aGVlbC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICB3aGVlbC5wb3NpdGlvbi5jb3B5KHdoZWVsX2RpcmVjdGlvbikubXVsdGlwbHlTY2FsYXIoc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCAvIDEwMCkuYWRkKGNvbm5lY3Rpb25fcG9pbnQpO1xuXG4gICAgdGhpcy53b3JsZC5hZGQod2hlZWwpO1xuICAgIHRoaXMud2hlZWxzLnB1c2god2hlZWwpO1xuXG4gICAgdGhpcy53b3JsZC5leGVjdXRlKCdhZGRXaGVlbCcsIHtcbiAgICAgIGlkOiB0aGlzLl9waHlzaWpzLmlkLFxuICAgICAgY29ubmVjdGlvbl9wb2ludDoge3g6IGNvbm5lY3Rpb25fcG9pbnQueCwgeTogY29ubmVjdGlvbl9wb2ludC55LCB6OiBjb25uZWN0aW9uX3BvaW50Lnp9LFxuICAgICAgd2hlZWxfZGlyZWN0aW9uOiB7eDogd2hlZWxfZGlyZWN0aW9uLngsIHk6IHdoZWVsX2RpcmVjdGlvbi55LCB6OiB3aGVlbF9kaXJlY3Rpb24uen0sXG4gICAgICB3aGVlbF9heGxlOiB7eDogd2hlZWxfYXhsZS54LCB5OiB3aGVlbF9heGxlLnksIHo6IHdoZWVsX2F4bGUuen0sXG4gICAgICBzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLFxuICAgICAgd2hlZWxfcmFkaXVzLFxuICAgICAgaXNfZnJvbnRfd2hlZWwsXG4gICAgICB0dW5pbmdcbiAgICB9KTtcbiAgfVxuXG4gIHNldFN0ZWVyaW5nKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0U3RlZXJpbmcnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBzdGVlcmluZzogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBzZXRCcmFrZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldEJyYWtlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbCwgYnJha2U6IGFtb3VudH0pO1xuICAgIGVsc2UgaWYgKHRoaXMud2hlZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aGVlbHMubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBicmFrZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG5cbiAgYXBwbHlFbmdpbmVGb3JjZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBmb3JjZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdhcHBseUVuZ2luZUZvcmNlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgZm9yY2U6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxufVxuIiwidmFyIFRBUkdFVCA9IHR5cGVvZiBTeW1ib2wgPT09ICd1bmRlZmluZWQnID8gJ19fdGFyZ2V0JyA6IFN5bWJvbCgpLFxuICAgIFNDUklQVF9UWVBFID0gJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnLFxuICAgIEJsb2JCdWlsZGVyID0gd2luZG93LkJsb2JCdWlsZGVyIHx8IHdpbmRvdy5XZWJLaXRCbG9iQnVpbGRlciB8fCB3aW5kb3cuTW96QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1TQmxvYkJ1aWxkZXIsXG4gICAgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMLFxuICAgIFdvcmtlciA9IHdpbmRvdy5Xb3JrZXI7XG5cbi8qKlxuICogUmV0dXJucyBhIHdyYXBwZXIgYXJvdW5kIFdlYiBXb3JrZXIgY29kZSB0aGF0IGlzIGNvbnN0cnVjdGlibGUuXG4gKlxuICogQGZ1bmN0aW9uIHNoaW1Xb3JrZXJcbiAqXG4gKiBAcGFyYW0geyBTdHJpbmcgfSAgICBmaWxlbmFtZSAgICBUaGUgbmFtZSBvZiB0aGUgZmlsZVxuICogQHBhcmFtIHsgRnVuY3Rpb24gfSAgZm4gICAgICAgICAgRnVuY3Rpb24gd3JhcHBpbmcgdGhlIGNvZGUgb2YgdGhlIHdvcmtlclxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzaGltV29ya2VyIChmaWxlbmFtZSwgZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gU2hpbVdvcmtlciAoZm9yY2VGYWxsYmFjaykge1xuICAgICAgICB2YXIgbyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBXb3JrZXIoZmlsZW5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKFdvcmtlciAmJiAhZm9yY2VGYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgZnVuY3Rpb24ncyBpbm5lciBjb2RlIHRvIGEgc3RyaW5nIHRvIGNvbnN0cnVjdCB0aGUgd29ya2VyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gZm4udG9TdHJpbmcoKS5yZXBsYWNlKC9eZnVuY3Rpb24uKz97LywgJycpLnNsaWNlKDAsIC0xKSxcbiAgICAgICAgICAgICAgICBvYmpVUkwgPSBjcmVhdGVTb3VyY2VPYmplY3Qoc291cmNlKTtcblxuICAgICAgICAgICAgdGhpc1tUQVJHRVRdID0gbmV3IFdvcmtlcihvYmpVUkwpO1xuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChvYmpVUkwpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbVEFSR0VUXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzZWxmU2hpbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2U6IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLm9ubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgby5vbm1lc3NhZ2UoeyBkYXRhOiBtLCB0YXJnZXQ6IHNlbGZTaGltIH0pIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm4uY2FsbChzZWxmU2hpbSk7XG4gICAgICAgICAgICB0aGlzLnBvc3RNZXNzYWdlID0gZnVuY3Rpb24obSkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgc2VsZlNoaW0ub25tZXNzYWdlKHsgZGF0YTogbSwgdGFyZ2V0OiBvIH0pIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuaXNUaGlzVGhyZWFkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vLyBUZXN0IFdvcmtlciBjYXBhYmlsaXRpZXNcbmlmIChXb3JrZXIpIHtcbiAgICB2YXIgdGVzdFdvcmtlcixcbiAgICAgICAgb2JqVVJMID0gY3JlYXRlU291cmNlT2JqZWN0KCdzZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uICgpIHt9JyksXG4gICAgICAgIHRlc3RBcnJheSA9IG5ldyBVaW50OEFycmF5KDEpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gTm8gd29ya2VycyB2aWEgYmxvYnMgaW4gRWRnZSAxMiBhbmQgSUUgMTEgYW5kIGxvd2VyIDooXG4gICAgICAgIGlmICgvKD86VHJpZGVudHxFZGdlKVxcLyg/Ols1NjddfDEyKS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGF2YWlsYWJsZScpO1xuICAgICAgICB9XG4gICAgICAgIHRlc3RXb3JrZXIgPSBuZXcgV29ya2VyKG9ialVSTCk7XG5cbiAgICAgICAgLy8gTmF0aXZlIGJyb3dzZXIgb24gc29tZSBTYW1zdW5nIGRldmljZXMgdGhyb3dzIGZvciB0cmFuc2ZlcmFibGVzLCBsZXQncyBkZXRlY3QgaXRcbiAgICAgICAgdGVzdFdvcmtlci5wb3N0TWVzc2FnZSh0ZXN0QXJyYXksIFt0ZXN0QXJyYXkuYnVmZmVyXSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIFdvcmtlciA9IG51bGw7XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKG9ialVSTCk7XG4gICAgICAgIGlmICh0ZXN0V29ya2VyKSB7XG4gICAgICAgICAgICB0ZXN0V29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTb3VyY2VPYmplY3Qoc3RyKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW3N0cl0sIHsgdHlwZTogU0NSSVBUX1RZUEUgfSkpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iQnVpbGRlcigpO1xuICAgICAgICBibG9iLmFwcGVuZChzdHIpO1xuICAgICAgICByZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iLmdldEJsb2IodHlwZSkpO1xuICAgIH1cbn1cbiIsImltcG9ydCBzaGltV29ya2VyIGZyb20gJ3JvbGx1cC1wbHVnaW4tYnVuZGxlLXdvcmtlcic7XG5leHBvcnQgZGVmYXVsdCBuZXcgc2hpbVdvcmtlcihcIi4uL3dvcmtlci5qc1wiLCBmdW5jdGlvbiAod2luZG93LCBkb2N1bWVudCkge1xudmFyIHNlbGYgPSB0aGlzO1xuY29uc3QgdHJhbnNmZXJhYmxlTWVzc2FnZSA9IHNlbGYud2Via2l0UG9zdE1lc3NhZ2UgfHwgc2VsZi5wb3N0TWVzc2FnZSxcblxuLy8gZW51bVxuTUVTU0FHRV9UWVBFUyA9IHtcbiAgV09STERSRVBPUlQ6IDAsXG4gIENPTExJU0lPTlJFUE9SVDogMSxcbiAgVkVISUNMRVJFUE9SVDogMixcbiAgQ09OU1RSQUlOVFJFUE9SVDogMyxcbiAgU09GVFJFUE9SVDogNFxufTtcblxuICAvLyB0ZW1wIHZhcmlhYmxlc1xubGV0IF9vYmplY3QsXG4gIF92ZWN0b3IsXG4gIF90cmFuc2Zvcm0sXG4gIF90cmFuc2Zvcm1fcG9zLFxuICBfc29mdGJvZHlfZW5hYmxlZCA9IGZhbHNlLFxuICBsYXN0X3NpbXVsYXRpb25fZHVyYXRpb24gPSAwLFxuXG4gIF9udW1fb2JqZWN0cyA9IDAsXG4gIF9udW1fcmlnaWRib2R5X29iamVjdHMgPSAwLFxuICBfbnVtX3NvZnRib2R5X29iamVjdHMgPSAwLFxuICBfbnVtX3doZWVscyA9IDAsXG4gIF9udW1fY29uc3RyYWludHMgPSAwLFxuICBfc29mdGJvZHlfcmVwb3J0X3NpemUgPSAwLFxuXG4gIC8vIHdvcmxkIHZhcmlhYmxlc1xuICBmaXhlZFRpbWVTdGVwLCAvLyB1c2VkIHdoZW4gY2FsbGluZyBzdGVwU2ltdWxhdGlvblxuICBsYXN0X3NpbXVsYXRpb25fdGltZSxcblxuICB3b3JsZCxcbiAgX3ZlYzNfMSxcbiAgX3ZlYzNfMixcbiAgX3ZlYzNfMyxcbiAgX3F1YXQ7XG5cbiAgLy8gcHJpdmF0ZSBjYWNoZVxuY29uc3QgcHVibGljX2Z1bmN0aW9ucyA9IHt9LFxuICBfb2JqZWN0cyA9IFtdLFxuICBfdmVoaWNsZXMgPSBbXSxcbiAgX2NvbnN0cmFpbnRzID0gW10sXG4gIF9vYmplY3RzX2FtbW8gPSB7fSxcbiAgX29iamVjdF9zaGFwZXMgPSB7fSxcblxuICAvLyBUaGUgZm9sbG93aW5nIG9iamVjdHMgYXJlIHRvIHRyYWNrIG9iamVjdHMgdGhhdCBhbW1vLmpzIGRvZXNuJ3QgY2xlYW5cbiAgLy8gdXAuIEFsbCBhcmUgY2xlYW5lZCB1cCB3aGVuIHRoZXkncmUgY29ycmVzcG9uZGluZyBib2R5IGlzIGRlc3Ryb3llZC5cbiAgLy8gVW5mb3J0dW5hdGVseSwgaXQncyB2ZXJ5IGRpZmZpY3VsdCB0byBnZXQgYXQgdGhlc2Ugb2JqZWN0cyBmcm9tIHRoZVxuICAvLyBib2R5LCBzbyB3ZSBoYXZlIHRvIHRyYWNrIHRoZW0gb3Vyc2VsdmVzLlxuICBfbW90aW9uX3N0YXRlcyA9IHt9LFxuICAvLyBEb24ndCBuZWVkIHRvIHdvcnJ5IGFib3V0IGl0IGZvciBjYWNoZWQgc2hhcGVzLlxuICBfbm9uY2FjaGVkX3NoYXBlcyA9IHt9LFxuICAvLyBBIGJvZHkgd2l0aCBhIGNvbXBvdW5kIHNoYXBlIGFsd2F5cyBoYXMgYSByZWd1bGFyIHNoYXBlIGFzIHdlbGwsIHNvIHdlXG4gIC8vIGhhdmUgdHJhY2sgdGhlbSBzZXBhcmF0ZWx5LlxuICBfY29tcG91bmRfc2hhcGVzID0ge307XG5cbiAgLy8gb2JqZWN0IHJlcG9ydGluZ1xubGV0IFJFUE9SVF9DSFVOS1NJWkUsIC8vIHJlcG9ydCBhcnJheSBpcyBpbmNyZWFzZWQgaW4gaW5jcmVtZW50cyBvZiB0aGlzIGNodW5rIHNpemVcbiAgd29ybGRyZXBvcnQsXG4gIHNvZnRyZXBvcnQsXG4gIGNvbGxpc2lvbnJlcG9ydCxcbiAgdmVoaWNsZXJlcG9ydCxcbiAgY29uc3RyYWludHJlcG9ydDtcblxuY29uc3QgV09STERSRVBPUlRfSVRFTVNJWkUgPSAxNCwgLy8gaG93IG1hbnkgZmxvYXQgdmFsdWVzIGVhY2ggcmVwb3J0ZWQgaXRlbSBuZWVkc1xuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgPSA1LCAvLyBvbmUgZmxvYXQgZm9yIGVhY2ggb2JqZWN0IGlkLCBhbmQgYSBWZWMzIGNvbnRhY3Qgbm9ybWFsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgPSA5LCAvLyB2ZWhpY2xlIGlkLCB3aGVlbCBpbmRleCwgMyBmb3IgcG9zaXRpb24sIDQgZm9yIHJvdGF0aW9uXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUgPSA2OyAvLyBjb25zdHJhaW50IGlkLCBvZmZzZXQgb2JqZWN0LCBvZmZzZXQsIGFwcGxpZWQgaW1wdWxzZVxuXG5jb25zdCBhYiA9IG5ldyBBcnJheUJ1ZmZlcigxKTtcblxudHJhbnNmZXJhYmxlTWVzc2FnZShhYiwgW2FiXSk7XG5jb25zdCBTVVBQT1JUX1RSQU5TRkVSQUJMRSA9IChhYi5ieXRlTGVuZ3RoID09PSAwKTtcblxuY29uc3QgZ2V0U2hhcGVGcm9tQ2FjaGUgPSAoY2FjaGVfa2V5KSA9PiB7XG4gIGlmIChfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV07XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5jb25zdCBzZXRTaGFwZUNhY2hlID0gKGNhY2hlX2tleSwgc2hhcGUpID0+IHtcbiAgX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XSA9IHNoYXBlO1xufTtcblxuY29uc3QgY3JlYXRlU2hhcGUgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IHNoYXBlO1xuXG4gIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcbiAgc3dpdGNoIChkZXNjcmlwdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnY29tcG91bmQnOiB7XG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29tcG91bmRTaGFwZSgpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAncGxhbmUnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgcGxhbmVfJHtkZXNjcmlwdGlvbi5ub3JtYWwueH1fJHtkZXNjcmlwdGlvbi5ub3JtYWwueX1fJHtkZXNjcmlwdGlvbi5ub3JtYWwuen1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLm5vcm1hbC54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLm5vcm1hbC55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLm5vcm1hbC56KTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idFN0YXRpY1BsYW5lU2hhcGUoX3ZlYzNfMSwgMCk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdib3gnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgYm94XyR7ZGVzY3JpcHRpb24ud2lkdGh9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fV8ke2Rlc2NyaXB0aW9uLmRlcHRofWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ud2lkdGggLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmhlaWdodCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uZGVwdGggLyAyKTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEJveFNoYXBlKF92ZWMzXzEpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc3BoZXJlJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYHNwaGVyZV8ke2Rlc2NyaXB0aW9uLnJhZGl1c31gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idFNwaGVyZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cyk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjeWxpbmRlcic6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjeWxpbmRlcl8ke2Rlc2NyaXB0aW9uLndpZHRofV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1fJHtkZXNjcmlwdGlvbi5kZXB0aH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLndpZHRoIC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5oZWlnaHQgLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLmRlcHRoIC8gMik7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDeWxpbmRlclNoYXBlKF92ZWMzXzEpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY2Fwc3VsZSc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjYXBzdWxlXyR7ZGVzY3JpcHRpb24ucmFkaXVzfV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgLy8gSW4gQnVsbGV0LCBjYXBzdWxlIGhlaWdodCBleGNsdWRlcyB0aGUgZW5kIHNwaGVyZXNcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENhcHN1bGVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMsIGRlc2NyaXB0aW9uLmhlaWdodCAtIDIgKiBkZXNjcmlwdGlvbi5yYWRpdXMpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY29uZSc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjb25lXyR7ZGVzY3JpcHRpb24ucmFkaXVzfV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbmVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMsIGRlc2NyaXB0aW9uLmhlaWdodCk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjb25jYXZlJzoge1xuICAgICAgY29uc3QgdHJpYW5nbGVfbWVzaCA9IG5ldyBBbW1vLmJ0VHJpYW5nbGVNZXNoKCk7XG4gICAgICBpZiAoIWRlc2NyaXB0aW9uLmRhdGEubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aCAvIDk7IGkrKykge1xuICAgICAgICBfdmVjM18xLnNldFgoZGF0YVtpICogOV0pO1xuICAgICAgICBfdmVjM18xLnNldFkoZGF0YVtpICogOSArIDFdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRhdGFbaSAqIDkgKyAyXSk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRhdGFbaSAqIDkgKyAzXSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkYXRhW2kgKiA5ICsgNF0pO1xuICAgICAgICBfdmVjM18yLnNldFooZGF0YVtpICogOSArIDVdKTtcblxuICAgICAgICBfdmVjM18zLnNldFgoZGF0YVtpICogOSArIDZdKTtcbiAgICAgICAgX3ZlYzNfMy5zZXRZKGRhdGFbaSAqIDkgKyA3XSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WihkYXRhW2kgKiA5ICsgOF0pO1xuXG4gICAgICAgIHRyaWFuZ2xlX21lc2guYWRkVHJpYW5nbGUoXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yLFxuICAgICAgICAgIF92ZWMzXzMsXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEJ2aFRyaWFuZ2xlTWVzaFNoYXBlKFxuICAgICAgICB0cmlhbmdsZV9tZXNoLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlXG4gICAgICApO1xuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2NvbnZleCc6IHtcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb252ZXhIdWxsU2hhcGUoKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoIC8gMzsgaSsrKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkYXRhW2kgKiAzIF0pO1xuICAgICAgICBfdmVjM18xLnNldFkoZGF0YVtpICogMyArIDFdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRhdGFbaSAqIDMgKyAyXSk7XG5cbiAgICAgICAgc2hhcGUuYWRkUG9pbnQoX3ZlYzNfMSk7XG4gICAgICB9XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnaGVpZ2h0ZmllbGQnOiB7XG4gICAgICBjb25zdCB4cHRzID0gZGVzY3JpcHRpb24ueHB0cyxcbiAgICAgICAgeXB0cyA9IGRlc2NyaXB0aW9uLnlwdHMsXG4gICAgICAgIHBvaW50cyA9IGRlc2NyaXB0aW9uLnBvaW50cyxcbiAgICAgICAgcHRyID0gQW1tby5fbWFsbG9jKDQgKiB4cHRzICogeXB0cyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwLCBwID0gMCwgcDIgPSAwOyBpIDwgeHB0czsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgeXB0czsgaisrKSB7XG4gICAgICAgICAgQW1tby5IRUFQRjMyW3B0ciArIHAyID4+IDJdID0gcG9pbnRzW3BdO1xuXG4gICAgICAgICAgcCsrO1xuICAgICAgICAgIHAyICs9IDQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEhlaWdodGZpZWxkVGVycmFpblNoYXBlKFxuICAgICAgICBkZXNjcmlwdGlvbi54cHRzLFxuICAgICAgICBkZXNjcmlwdGlvbi55cHRzLFxuICAgICAgICBwdHIsXG4gICAgICAgIDEsXG4gICAgICAgIC1kZXNjcmlwdGlvbi5hYnNNYXhIZWlnaHQsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFic01heEhlaWdodCxcbiAgICAgICAgMSxcbiAgICAgICAgJ1BIWV9GTE9BVCcsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgLy8gTm90IHJlY29nbml6ZWRcbiAgICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBzaGFwZTtcbn07XG5cbmNvbnN0IGNyZWF0ZVNvZnRCb2R5ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBib2R5O1xuXG4gIGNvbnN0IHNvZnRCb2R5SGVscGVycyA9IG5ldyBBbW1vLmJ0U29mdEJvZHlIZWxwZXJzKCk7XG5cbiAgc3dpdGNoIChkZXNjcmlwdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnc29mdFRyaW1lc2gnOiB7XG4gICAgICBpZiAoIWRlc2NyaXB0aW9uLmFWZXJ0aWNlcy5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVGcm9tVHJpTWVzaChcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIGRlc2NyaXB0aW9uLmFWZXJ0aWNlcyxcbiAgICAgICAgZGVzY3JpcHRpb24uYUluZGljZXMsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFJbmRpY2VzLmxlbmd0aCAvIDMsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc29mdENsb3RoTWVzaCc6IHtcbiAgICAgIGNvbnN0IGNyID0gZGVzY3JpcHRpb24uY29ybmVycztcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVQYXRjaChcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjclswXSwgY3JbMV0sIGNyWzJdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzNdLCBjcls0XSwgY3JbNV0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbNl0sIGNyWzddLCBjcls4XSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjcls5XSwgY3JbMTBdLCBjclsxMV0pLFxuICAgICAgICBkZXNjcmlwdGlvbi5zZWdtZW50c1swXSxcbiAgICAgICAgZGVzY3JpcHRpb24uc2VnbWVudHNbMV0sXG4gICAgICAgIDAsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdzb2Z0Um9wZU1lc2gnOiB7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVSb3BlKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGRhdGFbMF0sIGRhdGFbMV0sIGRhdGFbMl0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoZGF0YVszXSwgZGF0YVs0XSwgZGF0YVs1XSksXG4gICAgICAgIGRhdGFbNl0gLSAxLFxuICAgICAgICAwXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIE5vdCByZWNvZ25pemVkXG4gICAgICByZXR1cm47XG4gIH1cblxuICByZXR1cm4gYm9keTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaW5pdCA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBpZiAocGFyYW1zLndhc21CdWZmZXIpIHtcbiAgICBpbXBvcnRTY3JpcHRzKHBhcmFtcy5hbW1vKTtcblxuICAgIHNlbGYuQW1tbyA9IGxvYWRBbW1vRnJvbUJpbmFyeShwYXJhbXMud2FzbUJ1ZmZlcik7XG4gICAgdHJhbnNmZXJhYmxlTWVzc2FnZSh7Y21kOiAnYW1tb0xvYWRlZCd9KTtcbiAgICBwdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZChwYXJhbXMpO1xuICB9IGVsc2Uge1xuICAgIGltcG9ydFNjcmlwdHMocGFyYW1zLmFtbW8pO1xuICAgIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoe2NtZDogJ2FtbW9Mb2FkZWQnfSk7XG4gICAgcHVibGljX2Z1bmN0aW9ucy5tYWtlV29ybGQocGFyYW1zKTtcbiAgfVxufVxuXG5wdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZCA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBfdHJhbnNmb3JtID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgX3RyYW5zZm9ybV9wb3MgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICBfdmVjM18xID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xuICBfdmVjM18yID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xuICBfdmVjM18zID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xuICBfcXVhdCA9IG5ldyBBbW1vLmJ0UXVhdGVybmlvbigwLCAwLCAwLCAwKTtcblxuICBSRVBPUlRfQ0hVTktTSVpFID0gcGFyYW1zLnJlcG9ydHNpemUgfHwgNTA7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgLy8gVHJhbnNmZXJhYmxlIG1lc3NhZ2VzIGFyZSBzdXBwb3J0ZWQsIHRha2UgYWR2YW50YWdlIG9mIHRoZW0gd2l0aCBUeXBlZEFycmF5c1xuICAgIHdvcmxkcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBjb2xsaXNpb25zIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2YgdmVoaWNsZXMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBjb25zdHJhaW50cyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICB9IGVsc2Uge1xuICAgIC8vIFRyYW5zZmVyYWJsZSBtZXNzYWdlcyBhcmUgbm90IHN1cHBvcnRlZCwgc2VuZCBkYXRhIGFzIG5vcm1hbCBhcnJheXNcbiAgICB3b3JsZHJlcG9ydCA9IFtdO1xuICAgIGNvbGxpc2lvbnJlcG9ydCA9IFtdO1xuICAgIHZlaGljbGVyZXBvcnQgPSBbXTtcbiAgICBjb25zdHJhaW50cmVwb3J0ID0gW107XG4gIH1cblxuICB3b3JsZHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ7XG4gIGNvbGxpc2lvbnJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUO1xuICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuXG4gIGNvbnN0IGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24gPSBwYXJhbXMuc29mdGJvZHlcbiAgICA/IG5ldyBBbW1vLmJ0U29mdEJvZHlSaWdpZEJvZHlDb2xsaXNpb25Db25maWd1cmF0aW9uKClcbiAgICA6IG5ldyBBbW1vLmJ0RGVmYXVsdENvbGxpc2lvbkNvbmZpZ3VyYXRpb24oKSxcbiAgICBkaXNwYXRjaGVyID0gbmV3IEFtbW8uYnRDb2xsaXNpb25EaXNwYXRjaGVyKGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pLFxuICAgIHNvbHZlciA9IG5ldyBBbW1vLmJ0U2VxdWVudGlhbEltcHVsc2VDb25zdHJhaW50U29sdmVyKCk7XG5cbiAgbGV0IGJyb2FkcGhhc2U7XG5cbiAgaWYgKCFwYXJhbXMuYnJvYWRwaGFzZSkgcGFyYW1zLmJyb2FkcGhhc2UgPSB7dHlwZTogJ2R5bmFtaWMnfTtcbiAgLy8gVE9ETyEhIVxuICAvKiBpZiAocGFyYW1zLmJyb2FkcGhhc2UudHlwZSA9PT0gJ3N3ZWVwcHJ1bmUnKSB7XG4gICAgZXh0ZW5kKHBhcmFtcy5icm9hZHBoYXNlLCB7XG4gICAgICBhYWJibWluOiB7XG4gICAgICAgIHg6IC01MCxcbiAgICAgICAgeTogLTUwLFxuICAgICAgICB6OiAtNTBcbiAgICAgIH0sXG5cbiAgICAgIGFhYmJtYXg6IHtcbiAgICAgICAgeDogNTAsXG4gICAgICAgIHk6IDUwLFxuICAgICAgICB6OiA1MFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSovXG5cbiAgc3dpdGNoIChwYXJhbXMuYnJvYWRwaGFzZS50eXBlKSB7XG4gICAgY2FzZSAnc3dlZXBwcnVuZSc6XG4gICAgICBfdmVjM18xLnNldFgocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWluLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtaW4ueik7XG5cbiAgICAgIF92ZWMzXzIuc2V0WChwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LngpO1xuICAgICAgX3ZlYzNfMi5zZXRZKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtYXgueSk7XG4gICAgICBfdmVjM18yLnNldFoocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1heC56KTtcblxuICAgICAgYnJvYWRwaGFzZSA9IG5ldyBBbW1vLmJ0QXhpc1N3ZWVwMyhcbiAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgX3ZlYzNfMlxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnZHluYW1pYyc6XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyb2FkcGhhc2UgPSBuZXcgQW1tby5idERidnRCcm9hZHBoYXNlKCk7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIHdvcmxkID0gcGFyYW1zLnNvZnRib2R5XG4gICAgPyBuZXcgQW1tby5idFNvZnRSaWdpZER5bmFtaWNzV29ybGQoZGlzcGF0Y2hlciwgYnJvYWRwaGFzZSwgc29sdmVyLCBjb2xsaXNpb25Db25maWd1cmF0aW9uLCBuZXcgQW1tby5idERlZmF1bHRTb2Z0Qm9keVNvbHZlcigpKVxuICAgIDogbmV3IEFtbW8uYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQoZGlzcGF0Y2hlciwgYnJvYWRwaGFzZSwgc29sdmVyLCBjb2xsaXNpb25Db25maWd1cmF0aW9uKTtcbiAgZml4ZWRUaW1lU3RlcCA9IHBhcmFtcy5maXhlZFRpbWVTdGVwO1xuXG4gIGlmIChwYXJhbXMuc29mdGJvZHkpIF9zb2Z0Ym9keV9lbmFibGVkID0gdHJ1ZTtcblxuICB0cmFuc2ZlcmFibGVNZXNzYWdlKHtjbWQ6ICd3b3JsZFJlYWR5J30pO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRGaXhlZFRpbWVTdGVwID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGZpeGVkVGltZVN0ZXAgPSBkZXNjcmlwdGlvbjtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0R3Jhdml0eSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ueCk7XG4gIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi55KTtcbiAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnopO1xuICB3b3JsZC5zZXRHcmF2aXR5KF92ZWMzXzEpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBlbmRBbmNob3IgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgY29uc29sZS5sb2coX29iamVjdHNbZGVzY3JpcHRpb24ub2JqXSk7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLm9ial1cbiAgICAuYXBwZW5kQW5jaG9yKFxuICAgICAgZGVzY3JpcHRpb24ubm9kZSxcbiAgICAgIF9vYmplY3RzW2Rlc2NyaXB0aW9uLm9iajJdLFxuICAgICAgZGVzY3JpcHRpb24uY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyxcbiAgICAgIGRlc2NyaXB0aW9uLmluZmx1ZW5jZVxuICAgICk7XG59XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkT2JqZWN0ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBib2R5LCBtb3Rpb25TdGF0ZTtcblxuICBpZiAoZGVzY3JpcHRpb24udHlwZS5pbmRleE9mKCdzb2Z0JykgIT09IC0xKSB7XG4gICAgYm9keSA9IGNyZWF0ZVNvZnRCb2R5KGRlc2NyaXB0aW9uKTtcblxuICAgIGNvbnN0IHNiQ29uZmlnID0gYm9keS5nZXRfbV9jZmcoKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbi52aXRlcmF0aW9ucykgc2JDb25maWcuc2V0X3ZpdGVyYXRpb25zKGRlc2NyaXB0aW9uLnZpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucGl0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9waXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5waXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmRpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfZGl0ZXJhdGlvbnMoZGVzY3JpcHRpb24uZGl0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5jaXRlcmF0aW9ucykgc2JDb25maWcuc2V0X2NpdGVyYXRpb25zKGRlc2NyaXB0aW9uLmNpdGVyYXRpb25zKTtcbiAgICBzYkNvbmZpZy5zZXRfY29sbGlzaW9ucygweDExKTtcbiAgICBzYkNvbmZpZy5zZXRfa0RGKGRlc2NyaXB0aW9uLmZyaWN0aW9uKTtcbiAgICBzYkNvbmZpZy5zZXRfa0RQKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5wcmVzc3VyZSkgc2JDb25maWcuc2V0X2tQUihkZXNjcmlwdGlvbi5wcmVzc3VyZSk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmRyYWcpIHNiQ29uZmlnLnNldF9rREcoZGVzY3JpcHRpb24uZHJhZyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmxpZnQpIHNiQ29uZmlnLnNldF9rTEYoZGVzY3JpcHRpb24ubGlmdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmFuY2hvckhhcmRuZXNzKSBzYkNvbmZpZy5zZXRfa0FIUihkZXNjcmlwdGlvbi5hbmNob3JIYXJkbmVzcyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnJpZ2lkSGFyZG5lc3MpIHNiQ29uZmlnLnNldF9rQ0hSKGRlc2NyaXB0aW9uLnJpZ2lkSGFyZG5lc3MpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLmtsc3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa0xTVChkZXNjcmlwdGlvbi5rbHN0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24ua2FzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rQVNUKGRlc2NyaXB0aW9uLmthc3QpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5rdnN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tWU1QoZGVzY3JpcHRpb24ua3ZzdCk7XG5cbiAgICBBbW1vLmNhc3RPYmplY3QoYm9keSwgQW1tby5idENvbGxpc2lvbk9iamVjdCkuZ2V0Q29sbGlzaW9uU2hhcGUoKS5zZXRNYXJnaW4oZGVzY3JpcHRpb24ubWFyZ2luID8gZGVzY3JpcHRpb24ubWFyZ2luIDogMC4xKTtcblxuICAgIC8vIEFtbW8uY2FzdE9iamVjdChib2R5LCBBbW1vLmJ0Q29sbGlzaW9uT2JqZWN0KS5nZXRDb2xsaXNpb25TaGFwZSgpLnNldExvY2FsU2NhbGluZyhfdmVjM18xKTtcbiAgICBib2R5LnNldEFjdGl2YXRpb25TdGF0ZShkZXNjcmlwdGlvbi5zdGF0ZSB8fCA0KTtcbiAgICBib2R5LnR5cGUgPSAwOyAvLyBTb2Z0Qm9keS5cbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRSb3BlTWVzaCcpIGJvZHkucm9wZSA9IHRydWU7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Q2xvdGhNZXNoJykgYm9keS5jbG90aCA9IHRydWU7XG5cbiAgICBfdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ucG9zaXRpb24ueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5wb3NpdGlvbi56KTtcbiAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgIF9xdWF0LnNldFgoZGVzY3JpcHRpb24ucm90YXRpb24ueCk7XG4gICAgX3F1YXQuc2V0WShkZXNjcmlwdGlvbi5yb3RhdGlvbi55KTtcbiAgICBfcXVhdC5zZXRaKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnopO1xuICAgIF9xdWF0LnNldFcoZGVzY3JpcHRpb24ucm90YXRpb24udyk7XG4gICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICBib2R5LnRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5zY2FsZS54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uc2NhbGUueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnNjYWxlLnopO1xuXG4gICAgYm9keS5zY2FsZShfdmVjM18xKTtcblxuICAgIGJvZHkuc2V0VG90YWxNYXNzKGRlc2NyaXB0aW9uLm1hc3MsIGZhbHNlKTtcbiAgICB3b3JsZC5hZGRTb2Z0Qm9keShib2R5LCAxLCAtMSk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0VHJpbWVzaCcpIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX2ZhY2VzKCkuc2l6ZSgpICogMztcbiAgICBlbHNlIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFJvcGVNZXNoJykgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fbm9kZXMoKS5zaXplKCk7XG4gICAgZWxzZSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9ub2RlcygpLnNpemUoKSAqIDM7XG5cbiAgICBfbnVtX3NvZnRib2R5X29iamVjdHMrKztcbiAgfSBlbHNlIHtcbiAgICBsZXQgc2hhcGUgPSBjcmVhdGVTaGFwZShkZXNjcmlwdGlvbik7XG5cbiAgICBpZiAoIXNoYXBlKSByZXR1cm47XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgY2hpbGRyZW4gdGhlbiB0aGlzIGlzIGEgY29tcG91bmQgc2hhcGVcbiAgICBpZiAoZGVzY3JpcHRpb24uY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGNvbXBvdW5kX3NoYXBlID0gbmV3IEFtbW8uYnRDb21wb3VuZFNoYXBlKCk7XG4gICAgICBjb21wb3VuZF9zaGFwZS5hZGRDaGlsZFNoYXBlKF90cmFuc2Zvcm0sIHNoYXBlKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBfY2hpbGQgPSBkZXNjcmlwdGlvbi5jaGlsZHJlbltpXTtcblxuICAgICAgICBjb25zdCB0cmFucyA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICAgIHRyYW5zLnNldElkZW50aXR5KCk7XG5cbiAgICAgICAgX3ZlYzNfMS5zZXRYKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShfY2hpbGQucG9zaXRpb25fb2Zmc2V0LnkpO1xuICAgICAgICBfdmVjM18xLnNldFooX2NoaWxkLnBvc2l0aW9uX29mZnNldC56KTtcbiAgICAgICAgdHJhbnMuc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgICAgIF9xdWF0LnNldFgoX2NoaWxkLnJvdGF0aW9uLngpO1xuICAgICAgICBfcXVhdC5zZXRZKF9jaGlsZC5yb3RhdGlvbi55KTtcbiAgICAgICAgX3F1YXQuc2V0WihfY2hpbGQucm90YXRpb24ueik7XG4gICAgICAgIF9xdWF0LnNldFcoX2NoaWxkLnJvdGF0aW9uLncpO1xuICAgICAgICB0cmFucy5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICAgICAgc2hhcGUgPSBjcmVhdGVTaGFwZShkZXNjcmlwdGlvbi5jaGlsZHJlbltpXSk7XG4gICAgICAgIGNvbXBvdW5kX3NoYXBlLmFkZENoaWxkU2hhcGUodHJhbnMsIHNoYXBlKTtcbiAgICAgICAgQW1tby5kZXN0cm95KHRyYW5zKTtcbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBjb21wb3VuZF9zaGFwZTtcbiAgICAgIF9jb21wb3VuZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG4gICAgfVxuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnNjYWxlLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5zY2FsZS55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uc2NhbGUueik7XG5cbiAgICBzaGFwZS5zZXRMb2NhbFNjYWxpbmcoX3ZlYzNfMSk7XG4gICAgc2hhcGUuc2V0TWFyZ2luKGRlc2NyaXB0aW9uLm1hcmdpbiA/IGRlc2NyaXB0aW9uLm1hcmdpbiA6IDApO1xuXG4gICAgX3ZlYzNfMS5zZXRYKDApO1xuICAgIF92ZWMzXzEuc2V0WSgwKTtcbiAgICBfdmVjM18xLnNldFooMCk7XG4gICAgc2hhcGUuY2FsY3VsYXRlTG9jYWxJbmVydGlhKGRlc2NyaXB0aW9uLm1hc3MsIF92ZWMzXzEpO1xuXG4gICAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuXG4gICAgX3ZlYzNfMi5zZXRYKGRlc2NyaXB0aW9uLnBvc2l0aW9uLngpO1xuICAgIF92ZWMzXzIuc2V0WShkZXNjcmlwdGlvbi5wb3NpdGlvbi55KTtcbiAgICBfdmVjM18yLnNldFooZGVzY3JpcHRpb24ucG9zaXRpb24ueik7XG4gICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICBfcXVhdC5zZXRYKGRlc2NyaXB0aW9uLnJvdGF0aW9uLngpO1xuICAgIF9xdWF0LnNldFkoZGVzY3JpcHRpb24ucm90YXRpb24ueSk7XG4gICAgX3F1YXQuc2V0WihkZXNjcmlwdGlvbi5yb3RhdGlvbi56KTtcbiAgICBfcXVhdC5zZXRXKGRlc2NyaXB0aW9uLnJvdGF0aW9uLncpO1xuICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuXG4gICAgbW90aW9uU3RhdGUgPSBuZXcgQW1tby5idERlZmF1bHRNb3Rpb25TdGF0ZShfdHJhbnNmb3JtKTsgLy8gI1RPRE86IGJ0RGVmYXVsdE1vdGlvblN0YXRlIHN1cHBvcnRzIGNlbnRlciBvZiBtYXNzIG9mZnNldCBhcyBzZWNvbmQgYXJndW1lbnQgLSBpbXBsZW1lbnRcbiAgICBjb25zdCByYkluZm8gPSBuZXcgQW1tby5idFJpZ2lkQm9keUNvbnN0cnVjdGlvbkluZm8oZGVzY3JpcHRpb24ubWFzcywgbW90aW9uU3RhdGUsIHNoYXBlLCBfdmVjM18xKTtcblxuICAgIHJiSW5mby5zZXRfbV9mcmljdGlvbihkZXNjcmlwdGlvbi5mcmljdGlvbik7XG4gICAgcmJJbmZvLnNldF9tX3Jlc3RpdHV0aW9uKGRlc2NyaXB0aW9uLnJlc3RpdHV0aW9uKTtcbiAgICByYkluZm8uc2V0X21fbGluZWFyRGFtcGluZyhkZXNjcmlwdGlvbi5kYW1waW5nKTtcbiAgICByYkluZm8uc2V0X21fYW5ndWxhckRhbXBpbmcoZGVzY3JpcHRpb24uZGFtcGluZyk7XG5cbiAgICBib2R5ID0gbmV3IEFtbW8uYnRSaWdpZEJvZHkocmJJbmZvKTtcbiAgICBib2R5LnNldEFjdGl2YXRpb25TdGF0ZShkZXNjcmlwdGlvbi5zdGF0ZSB8fCA0KTtcbiAgICBBbW1vLmRlc3Ryb3kocmJJbmZvKTtcblxuICAgIGlmICh0eXBlb2YgZGVzY3JpcHRpb24uY29sbGlzaW9uX2ZsYWdzICE9PSAndW5kZWZpbmVkJykgYm9keS5zZXRDb2xsaXNpb25GbGFncyhkZXNjcmlwdGlvbi5jb2xsaXNpb25fZmxhZ3MpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLmdyb3VwICYmIGRlc2NyaXB0aW9uLm1hc2spIHdvcmxkLmFkZFJpZ2lkQm9keShib2R5LCBkZXNjcmlwdGlvbi5ncm91cCwgZGVzY3JpcHRpb24ubWFzayk7XG4gICAgZWxzZSB3b3JsZC5hZGRSaWdpZEJvZHkoYm9keSk7XG4gICAgYm9keS50eXBlID0gMTsgLy8gUmlnaWRCb2R5LlxuICAgIF9udW1fcmlnaWRib2R5X29iamVjdHMrKztcbiAgfVxuXG4gIGJvZHkuYWN0aXZhdGUoKTtcblxuICBib2R5LmlkID0gZGVzY3JpcHRpb24uaWQ7XG4gIF9vYmplY3RzW2JvZHkuaWRdID0gYm9keTtcbiAgX21vdGlvbl9zdGF0ZXNbYm9keS5pZF0gPSBtb3Rpb25TdGF0ZTtcblxuICBfb2JqZWN0c19hbW1vW2JvZHkuYSA9PT0gdW5kZWZpbmVkID8gYm9keS5wdHIgOiBib2R5LmFdID0gYm9keS5pZDtcbiAgX251bV9vYmplY3RzKys7XG5cbiAgdHJhbnNmZXJhYmxlTWVzc2FnZSh7Y21kOiAnb2JqZWN0UmVhZHknLCBwYXJhbXM6IGJvZHkuaWR9KTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkVmVoaWNsZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBjb25zdCB2ZWhpY2xlX3R1bmluZyA9IG5ldyBBbW1vLmJ0VmVoaWNsZVR1bmluZygpO1xuXG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25TdGlmZm5lc3MoZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9zdGlmZm5lc3MpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9zdXNwZW5zaW9uQ29tcHJlc3Npb24oZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9jb21wcmVzc2lvbik7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25EYW1waW5nKGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fZGFtcGluZyk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25UcmF2ZWxDbShkZXNjcmlwdGlvbi5tYXhfc3VzcGVuc2lvbl90cmF2ZWwpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UoZGVzY3JpcHRpb24ubWF4X3N1c3BlbnNpb25fZm9yY2UpO1xuXG4gIGNvbnN0IHZlaGljbGUgPSBuZXcgQW1tby5idFJheWNhc3RWZWhpY2xlKFxuICAgIHZlaGljbGVfdHVuaW5nLFxuICAgIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnJpZ2lkQm9keV0sXG4gICAgbmV3IEFtbW8uYnREZWZhdWx0VmVoaWNsZVJheWNhc3Rlcih3b3JsZClcbiAgKTtcblxuICB2ZWhpY2xlLnR1bmluZyA9IHZlaGljbGVfdHVuaW5nO1xuICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5yaWdpZEJvZHldLnNldEFjdGl2YXRpb25TdGF0ZSg0KTtcbiAgdmVoaWNsZS5zZXRDb29yZGluYXRlU3lzdGVtKDAsIDEsIDIpO1xuXG4gIHdvcmxkLmFkZFZlaGljbGUodmVoaWNsZSk7XG4gIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gPSB2ZWhpY2xlO1xufTtcbnB1YmxpY19mdW5jdGlvbnMucmVtb3ZlVmVoaWNsZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdID0gbnVsbDtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkV2hlZWwgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gIT09IHVuZGVmaW5lZCkge1xuICAgIGxldCB0dW5pbmcgPSBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdLnR1bmluZztcbiAgICBpZiAoZGVzY3JpcHRpb24udHVuaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHR1bmluZyA9IG5ldyBBbW1vLmJ0VmVoaWNsZVR1bmluZygpO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25TdGlmZm5lc3MoZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fc3RpZmZuZXNzKTtcbiAgICAgIHR1bmluZy5zZXRfbV9zdXNwZW5zaW9uQ29tcHJlc3Npb24oZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fY29tcHJlc3Npb24pO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25EYW1waW5nKGRlc2NyaXB0aW9uLnR1bmluZy5zdXNwZW5zaW9uX2RhbXBpbmcpO1xuICAgICAgdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25UcmF2ZWxDbShkZXNjcmlwdGlvbi50dW5pbmcubWF4X3N1c3BlbnNpb25fdHJhdmVsKTtcbiAgICAgIHR1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UoZGVzY3JpcHRpb24udHVuaW5nLm1heF9zdXNwZW5zaW9uX2ZvcmNlKTtcbiAgICB9XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC56KTtcblxuICAgIF92ZWMzXzIuc2V0WChkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueCk7XG4gICAgX3ZlYzNfMi5zZXRZKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi55KTtcbiAgICBfdmVjM18yLnNldFooZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLnopO1xuXG4gICAgX3ZlYzNfMy5zZXRYKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueCk7XG4gICAgX3ZlYzNfMy5zZXRZKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueSk7XG4gICAgX3ZlYzNfMy5zZXRaKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueik7XG5cbiAgICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdLmFkZFdoZWVsKFxuICAgICAgX3ZlYzNfMSxcbiAgICAgIF92ZWMzXzIsXG4gICAgICBfdmVjM18zLFxuICAgICAgZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCxcbiAgICAgIGRlc2NyaXB0aW9uLndoZWVsX3JhZGl1cyxcbiAgICAgIHR1bmluZyxcbiAgICAgIGRlc2NyaXB0aW9uLmlzX2Zyb250X3doZWVsXG4gICAgKTtcbiAgfVxuXG4gIF9udW1fd2hlZWxzKys7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMSArIF9udW1fd2hlZWxzICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgJiAoICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0IClcbiAgICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICB9IGVsc2UgdmVoaWNsZXJlcG9ydCA9IFtNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlRdO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRTdGVlcmluZyA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLnNldFN0ZWVyaW5nVmFsdWUoZGV0YWlscy5zdGVlcmluZywgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEJyYWtlID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uc2V0QnJha2UoZGV0YWlscy5icmFrZSwgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5RW5naW5lRm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5hcHBseUVuZ2luZUZvcmNlKGRldGFpbHMuZm9yY2UsIGRldGFpbHMud2hlZWwpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVPYmplY3QgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX29iamVjdHNbZGV0YWlscy5pZF0udHlwZSA9PT0gMCkge1xuICAgIF9udW1fc29mdGJvZHlfb2JqZWN0cy0tO1xuICAgIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSAtPSBfb2JqZWN0c1tkZXRhaWxzLmlkXS5nZXRfbV9ub2RlcygpLnNpemUoKTtcbiAgICB3b3JsZC5yZW1vdmVTb2Z0Qm9keShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gIH0gZWxzZSBpZiAoX29iamVjdHNbZGV0YWlscy5pZF0udHlwZSA9PT0gMSkge1xuICAgIF9udW1fcmlnaWRib2R5X29iamVjdHMtLTtcbiAgICB3b3JsZC5yZW1vdmVSaWdpZEJvZHkoX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICAgIEFtbW8uZGVzdHJveShfbW90aW9uX3N0YXRlc1tkZXRhaWxzLmlkXSk7XG4gIH1cblxuICBBbW1vLmRlc3Ryb3koX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICBpZiAoX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSkgQW1tby5kZXN0cm95KF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pO1xuICBpZiAoX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pIEFtbW8uZGVzdHJveShfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSk7XG5cbiAgX29iamVjdHNfYW1tb1tfb2JqZWN0c1tkZXRhaWxzLmlkXS5hID09PSB1bmRlZmluZWQgPyBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hIDogX29iamVjdHNbZGV0YWlscy5pZF0ucHRyXSA9IG51bGw7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgX21vdGlvbl9zdGF0ZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuXG4gIGlmIChfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKSBfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgaWYgKF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKSBfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gIF9udW1fb2JqZWN0cy0tO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy51cGRhdGVUcmFuc2Zvcm0gPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0ID0gX29iamVjdHNbZGV0YWlscy5pZF07XG5cbiAgaWYgKF9vYmplY3QudHlwZSA9PT0gMSkge1xuICAgIF9vYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgIGlmIChkZXRhaWxzLnBvcykge1xuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zLnopO1xuICAgICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgfVxuXG4gICAgaWYgKGRldGFpbHMucXVhdCkge1xuICAgICAgX3F1YXQuc2V0WChkZXRhaWxzLnF1YXQueCk7XG4gICAgICBfcXVhdC5zZXRZKGRldGFpbHMucXVhdC55KTtcbiAgICAgIF9xdWF0LnNldFooZGV0YWlscy5xdWF0LnopO1xuICAgICAgX3F1YXQuc2V0VyhkZXRhaWxzLnF1YXQudyk7XG4gICAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcbiAgICB9XG5cbiAgICBfb2JqZWN0LnNldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuICAgIF9vYmplY3QuYWN0aXZhdGUoKTtcbiAgfSBlbHNlIGlmIChfb2JqZWN0LnR5cGUgPT09IDApIHtcbiAgICAvLyBfb2JqZWN0LmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgaWYgKGRldGFpbHMucG9zKSB7XG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3MueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3MueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3Mueik7XG4gICAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICB9XG5cbiAgICBpZiAoZGV0YWlscy5xdWF0KSB7XG4gICAgICBfcXVhdC5zZXRYKGRldGFpbHMucXVhdC54KTtcbiAgICAgIF9xdWF0LnNldFkoZGV0YWlscy5xdWF0LnkpO1xuICAgICAgX3F1YXQuc2V0WihkZXRhaWxzLnF1YXQueik7XG4gICAgICBfcXVhdC5zZXRXKGRldGFpbHMucXVhdC53KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuICAgIH1cblxuICAgIF9vYmplY3QudHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuICB9XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnVwZGF0ZU1hc3MgPSAoZGV0YWlscykgPT4ge1xuICAvLyAjVE9ETzogY2hhbmdpbmcgYSBzdGF0aWMgb2JqZWN0IGludG8gZHluYW1pYyBpcyBidWdneVxuICBfb2JqZWN0ID0gX29iamVjdHNbZGV0YWlscy5pZF07XG5cbiAgLy8gUGVyIGh0dHA6Ly93d3cuYnVsbGV0cGh5c2ljcy5vcmcvQnVsbGV0L3BocEJCMy92aWV3dG9waWMucGhwP3A9JmY9OSZ0PTM2NjMjcDEzODE2XG4gIHdvcmxkLnJlbW92ZVJpZ2lkQm9keShfb2JqZWN0KTtcblxuICBfdmVjM18xLnNldFgoMCk7XG4gIF92ZWMzXzEuc2V0WSgwKTtcbiAgX3ZlYzNfMS5zZXRaKDApO1xuXG4gIF9vYmplY3Quc2V0TWFzc1Byb3BzKGRldGFpbHMubWFzcywgX3ZlYzNfMSk7XG4gIHdvcmxkLmFkZFJpZ2lkQm9keShfb2JqZWN0KTtcbiAgX29iamVjdC5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUNlbnRyYWxJbXB1bHNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUNlbnRyYWxJbXB1bHNlKF92ZWMzXzEpO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUltcHVsc2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy5pbXB1bHNlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy5pbXB1bHNlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy5pbXB1bHNlX3opO1xuXG4gIF92ZWMzXzIuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18yLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMi5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlJbXB1bHNlKFxuICAgIF92ZWMzXzEsXG4gICAgX3ZlYzNfMlxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseVRvcnF1ZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLnRvcnF1ZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMudG9ycXVlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy50b3JxdWVfeik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlUb3JxdWUoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUNlbnRyYWxGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlDZW50cmFsRm9yY2UoX3ZlYzNfMSk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Rm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy5mb3JjZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMuZm9yY2VfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLmZvcmNlX3opO1xuXG4gIF92ZWMzXzIuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18yLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMi5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlGb3JjZShcbiAgICBfdmVjM18xLFxuICAgIF92ZWMzXzJcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMub25TaW11bGF0aW9uUmVzdW1lID0gKCkgPT4ge1xuICBsYXN0X3NpbXVsYXRpb25fdGltZSA9IERhdGUubm93KCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEFuZ3VsYXJWZWxvY2l0eSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0QW5ndWxhclZlbG9jaXR5KFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0TGluZWFyVmVsb2NpdHkgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldExpbmVhclZlbG9jaXR5KFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QW5ndWxhckZhY3RvciA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0QW5ndWxhckZhY3RvcihcbiAgICAgIF92ZWMzXzFcbiAgKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0TGluZWFyRmFjdG9yID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRMaW5lYXJGYWN0b3IoXG4gICAgX3ZlYzNfMVxuICApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXREYW1waW5nID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0RGFtcGluZyhkZXRhaWxzLmxpbmVhciwgZGV0YWlscy5hbmd1bGFyKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0Q2NkTW90aW9uVGhyZXNob2xkID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0Q2NkTW90aW9uVGhyZXNob2xkKGRldGFpbHMudGhyZXNob2xkKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyhkZXRhaWxzLnJhZGl1cyk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFkZENvbnN0cmFpbnQgPSAoZGV0YWlscykgPT4ge1xuICBsZXQgY29uc3RyYWludDtcblxuICBzd2l0Y2ggKGRldGFpbHMudHlwZSkge1xuXG4gICAgY2FzZSAncG9pbnQnOiB7XG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRQb2ludDJQb2ludENvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfdmVjM18xXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0UG9pbnQyUG9pbnRDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdoaW5nZSc6IHtcbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLmF4aXMueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLmF4aXMueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLmF4aXMueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0SGluZ2VDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yXG4gICAgICAgICk7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICBfdmVjM18zLnNldFgoZGV0YWlscy5heGlzLngpO1xuICAgICAgICBfdmVjM18zLnNldFkoZGV0YWlscy5heGlzLnkpO1xuICAgICAgICBfdmVjM18zLnNldFooZGV0YWlscy5heGlzLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEhpbmdlQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yLFxuICAgICAgICAgIF92ZWMzXzMsXG4gICAgICAgICAgX3ZlYzNfM1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ3NsaWRlcic6IHtcbiAgICAgIGxldCB0cmFuc2Zvcm1iO1xuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyKGRldGFpbHMuYXhpcy54LCBkZXRhaWxzLmF4aXMueSwgZGV0YWlscy5heGlzLnopO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIpIHtcbiAgICAgICAgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgICAgcm90YXRpb24uc2V0RXVsZXIoZGV0YWlscy5heGlzLngsIGRldGFpbHMuYXhpcy55LCBkZXRhaWxzLmF4aXMueik7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFNsaWRlckNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJhbnNmb3JtYixcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRTbGlkZXJDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIGlmICh0cmFuc2Zvcm1iICE9PSB1bmRlZmluZWQpIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2NvbmV0d2lzdCc6IHtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWEgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBjb25zdCB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgIHRyYW5zZm9ybWEuc2V0T3JpZ2luKF92ZWMzXzEpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNhLnosIC1kZXRhaWxzLmF4aXNhLnksIC1kZXRhaWxzLmF4aXNhLngpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2IueiwgLWRldGFpbHMuYXhpc2IueSwgLWRldGFpbHMuYXhpc2IueCk7XG4gICAgICB0cmFuc2Zvcm1iLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0Q29uZVR3aXN0Q29uc3RyYWludChcbiAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgdHJhbnNmb3JtYlxuICAgICAgKTtcblxuICAgICAgY29uc3RyYWludC5zZXRMaW1pdChNYXRoLlBJLCAwLCBNYXRoLlBJKTtcblxuICAgICAgY29uc3RyYWludC50YSA9IHRyYW5zZm9ybWE7XG4gICAgICBjb25zdHJhaW50LnRiID0gdHJhbnNmb3JtYjtcblxuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWEpO1xuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWIpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnZG9mJzoge1xuICAgICAgbGV0IHRyYW5zZm9ybWI7XG5cbiAgICAgIGNvbnN0IHRyYW5zZm9ybWEgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgIHRyYW5zZm9ybWEuc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm1hLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYS56LCAtZGV0YWlscy5heGlzYS55LCAtZGV0YWlscy5heGlzYS54KTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiKSB7XG4gICAgICAgIHRyYW5zZm9ybWIgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm1iLnNldElkZW50aXR5KCk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2IueiwgLWRldGFpbHMuYXhpc2IueSwgLWRldGFpbHMuYXhpc2IueCk7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEdlbmVyaWM2RG9mQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cmFuc2Zvcm1iLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEdlbmVyaWM2RG9mQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBpZiAodHJhbnNmb3JtYiAhPT0gdW5kZWZpbmVkKSBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuO1xuICB9XG5cbiAgd29ybGQuYWRkQ29uc3RyYWludChjb25zdHJhaW50KTtcblxuICBjb25zdHJhaW50LmEgPSBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdO1xuICBjb25zdHJhaW50LmIgPSBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdO1xuXG4gIGNvbnN0cmFpbnQuZW5hYmxlRmVlZGJhY2soKTtcbiAgX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdID0gY29uc3RyYWludDtcbiAgX251bV9jb25zdHJhaW50cysrO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDEgKyBfbnVtX2NvbnN0cmFpbnRzICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgJiAoICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0IClcbiAgICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuICB9IGVsc2UgY29uc3RyYWludHJlcG9ydCA9IFtNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlRdO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVDb25zdHJhaW50ID0gKGRldGFpbHMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXTtcblxuICBpZiAoY29uc3RyYWludCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgd29ybGQucmVtb3ZlQ29uc3RyYWludChjb25zdHJhaW50KTtcbiAgICBfY29uc3RyYWludHNbZGV0YWlscy5pZF0gPSBudWxsO1xuICAgIF9udW1fY29uc3RyYWludHMtLTtcbiAgfVxufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25zdHJhaW50X3NldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCA9IChkZXRhaWxzKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbZGV0YWlscy5pZF07XG4gIGlmIChjb25zdHJhaW50ICE9PSB1bmRlZmluZCkgY29uc3RyYWludC5zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQoZGV0YWlscy50aHJlc2hvbGQpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zaW11bGF0ZSA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBpZiAod29ybGQpIHtcbiAgICBpZiAocGFyYW1zLnRpbWVTdGVwICYmIHBhcmFtcy50aW1lU3RlcCA8IGZpeGVkVGltZVN0ZXApXG4gICAgICBwYXJhbXMudGltZVN0ZXAgPSBmaXhlZFRpbWVTdGVwO1xuXG4gICAgcGFyYW1zLm1heFN1YlN0ZXBzID0gcGFyYW1zLm1heFN1YlN0ZXBzIHx8IE1hdGguY2VpbChwYXJhbXMudGltZVN0ZXAgLyBmaXhlZFRpbWVTdGVwKTsgLy8gSWYgbWF4U3ViU3RlcHMgaXMgbm90IGRlZmluZWQsIGtlZXAgdGhlIHNpbXVsYXRpb24gZnVsbHkgdXAgdG8gZGF0ZVxuXG4gICAgd29ybGQuc3RlcFNpbXVsYXRpb24ocGFyYW1zLnRpbWVTdGVwLCBwYXJhbXMubWF4U3ViU3RlcHMsIGZpeGVkVGltZVN0ZXApO1xuXG4gICAgaWYgKF92ZWhpY2xlcy5sZW5ndGggPiAwKSByZXBvcnRWZWhpY2xlcygpO1xuICAgIHJlcG9ydENvbGxpc2lvbnMoKTtcbiAgICBpZiAoX2NvbnN0cmFpbnRzLmxlbmd0aCA+IDApIHJlcG9ydENvbnN0cmFpbnRzKCk7XG4gICAgcmVwb3J0V29ybGQoKTtcbiAgICBpZiAoX3NvZnRib2R5X2VuYWJsZWQpIHJlcG9ydFdvcmxkX3NvZnRib2RpZXMoKTtcbiAgfVxufTtcblxuLy8gQ29uc3RyYWludCBmdW5jdGlvbnNcbnB1YmxpY19mdW5jdGlvbnMuaGluZ2Vfc2V0TGltaXRzID0gKHBhcmFtcykgPT4ge1xuICBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLnNldExpbWl0KHBhcmFtcy5sb3csIHBhcmFtcy5oaWdoLCAwLCBwYXJhbXMuYmlhc19mYWN0b3IsIHBhcmFtcy5yZWxheGF0aW9uX2ZhY3Rvcik7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmhpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuZW5hYmxlQW5ndWxhck1vdG9yKHRydWUsIHBhcmFtcy52ZWxvY2l0eSwgcGFyYW1zLmFjY2VsZXJhdGlvbik7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaGluZ2VfZGlzYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLmVuYWJsZU1vdG9yKGZhbHNlKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9zZXRMaW1pdHMgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldExvd2VyTGluTGltaXQocGFyYW1zLmxpbl9sb3dlciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRVcHBlckxpbkxpbWl0KHBhcmFtcy5saW5fdXBwZXIgfHwgMCk7XG5cbiAgY29uc3RyYWludC5zZXRMb3dlckFuZ0xpbWl0KHBhcmFtcy5hbmdfbG93ZXIgfHwgMCk7XG4gIGNvbnN0cmFpbnQuc2V0VXBwZXJBbmdMaW1pdChwYXJhbXMuYW5nX3VwcGVyIHx8IDApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfc2V0UmVzdGl0dXRpb24gPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFNvZnRuZXNzTGltTGluKHBhcmFtcy5saW5lYXIgfHwgMCk7XG4gIGNvbnN0cmFpbnQuc2V0U29mdG5lc3NMaW1BbmcocGFyYW1zLmFuZ3VsYXIgfHwgMCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9lbmFibGVMaW5lYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0VGFyZ2V0TGluTW90b3JWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBjb25zdHJhaW50LnNldE1heExpbk1vdG9yRm9yY2UocGFyYW1zLmFjY2VsZXJhdGlvbik7XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZExpbk1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9kaXNhYmxlTGluZWFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRMaW5Nb3RvcihmYWxzZSk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRUYXJnZXRBbmdNb3RvclZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIGNvbnN0cmFpbnQuc2V0TWF4QW5nTW90b3JGb3JjZShwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkQW5nTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRBbmdNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X3NldExpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLnNldExpbWl0KHBhcmFtcy56LCBwYXJhbXMueSwgcGFyYW1zLngpOyAvLyBaWVggb3JkZXJcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X2VuYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRNYXhNb3RvckltcHVsc2UocGFyYW1zLm1heF9pbXB1bHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TW90b3JUYXJnZXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF9xdWF0LnNldFgocGFyYW1zLngpO1xuICBfcXVhdC5zZXRZKHBhcmFtcy55KTtcbiAgX3F1YXQuc2V0WihwYXJhbXMueik7XG4gIF9xdWF0LnNldFcocGFyYW1zLncpO1xuXG4gIGNvbnN0cmFpbnQuc2V0TW90b3JUYXJnZXQoX3F1YXQpO1xuXG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X2Rpc2FibGVNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuZW5hYmxlTW90b3IoZmFsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRMaW5lYXJMb3dlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0TGluZWFyTG93ZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRMaW5lYXJVcHBlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0TGluZWFyVXBwZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3ZlYzNfMS5zZXRYKHBhcmFtcy54KTtcbiAgX3ZlYzNfMS5zZXRZKHBhcmFtcy55KTtcbiAgX3ZlYzNfMS5zZXRaKHBhcmFtcy56KTtcblxuICBjb25zdHJhaW50LnNldEFuZ3VsYXJMb3dlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0QW5ndWxhclVwcGVyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2ZfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBjb25zdCBtb3RvciA9IGNvbnN0cmFpbnQuZ2V0Um90YXRpb25hbExpbWl0TW90b3IocGFyYW1zLndoaWNoKTtcbiAgbW90b3Iuc2V0X21fZW5hYmxlTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XSxcbiAgICBtb3RvciA9IGNvbnN0cmFpbnQuZ2V0Um90YXRpb25hbExpbWl0TW90b3IocGFyYW1zLndoaWNoKTtcblxuICBtb3Rvci5zZXRfbV9sb0xpbWl0KHBhcmFtcy5sb3dfYW5nbGUpO1xuICBtb3Rvci5zZXRfbV9oaUxpbWl0KHBhcmFtcy5oaWdoX2FuZ2xlKTtcbiAgbW90b3Iuc2V0X21fdGFyZ2V0VmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgbW90b3Iuc2V0X21fbWF4TW90b3JGb3JjZShwYXJhbXMubWF4X2ZvcmNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9kaXNhYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XSxcbiAgICBtb3RvciA9IGNvbnN0cmFpbnQuZ2V0Um90YXRpb25hbExpbWl0TW90b3IocGFyYW1zLndoaWNoKTtcblxuICBtb3Rvci5zZXRfbV9lbmFibGVNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxuY29uc3QgcmVwb3J0V29ybGQgPSAoKSA9PiB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSAmJiB3b3JsZHJlcG9ydC5sZW5ndGggPCAyICsgX251bV9yaWdpZGJvZHlfb2JqZWN0cyAqIFdPUkxEUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgMi8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICArIChNYXRoLmNlaWwoX251bV9yaWdpZGJvZHlfb2JqZWN0cyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBXT1JMRFJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICApO1xuXG4gICAgd29ybGRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUO1xuICB9XG5cbiAgd29ybGRyZXBvcnRbMV0gPSBfbnVtX3JpZ2lkYm9keV9vYmplY3RzOyAvLyByZWNvcmQgaG93IG1hbnkgb2JqZWN0cyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICB7XG4gICAgbGV0IGkgPSAwLFxuICAgICAgaW5kZXggPSBfb2JqZWN0cy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2JqZWN0ID0gX29iamVjdHNbaW5kZXhdO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIG9iamVjdC50eXBlID09PSAxKSB7IC8vIFJpZ2lkQm9kaWVzLlxuICAgICAgICAvLyAjVE9ETzogd2UgY2FuJ3QgdXNlIGNlbnRlciBvZiBtYXNzIHRyYW5zZm9ybSB3aGVuIGNlbnRlciBvZiBtYXNzIGNhbiBjaGFuZ2UsXG4gICAgICAgIC8vICAgICAgICBidXQgZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybSgpIHNjcmV3cyB1cCBvbiBvYmplY3RzIHRoYXQgaGF2ZSBiZWVuIG1vdmVkXG4gICAgICAgIC8vIG9iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKCB0cmFuc2Zvcm0gKTtcbiAgICAgICAgLy8gb2JqZWN0LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gb2JqZWN0LmdldENlbnRlck9mTWFzc1RyYW5zZm9ybSgpO1xuICAgICAgICBjb25zdCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XG4gICAgICAgIGNvbnN0IHJvdGF0aW9uID0gdHJhbnNmb3JtLmdldFJvdGF0aW9uKCk7XG5cbiAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIChpKyspICogV09STERSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0XSA9IG9iamVjdC5pZDtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxXSA9IG9yaWdpbi54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgM10gPSBvcmlnaW4ueigpO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDRdID0gcm90YXRpb24ueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA1XSA9IHJvdGF0aW9uLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNl0gPSByb3RhdGlvbi56KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDddID0gcm90YXRpb24udygpO1xuXG4gICAgICAgIF92ZWN0b3IgPSBvYmplY3QuZ2V0TGluZWFyVmVsb2NpdHkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgOF0gPSBfdmVjdG9yLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgOV0gPSBfdmVjdG9yLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTBdID0gX3ZlY3Rvci56KCk7XG5cbiAgICAgICAgX3ZlY3RvciA9IG9iamVjdC5nZXRBbmd1bGFyVmVsb2NpdHkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTFdID0gX3ZlY3Rvci54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEyXSA9IF92ZWN0b3IueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxM10gPSBfdmVjdG9yLnooKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHRyYW5zZmVyYWJsZU1lc3NhZ2Uod29ybGRyZXBvcnQuYnVmZmVyLCBbd29ybGRyZXBvcnQuYnVmZmVyXSk7XG4gIGVsc2UgdHJhbnNmZXJhYmxlTWVzc2FnZSh3b3JsZHJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRXb3JsZF9zb2Z0Ym9kaWVzID0gKCkgPT4ge1xuICAvLyBUT0RPOiBBZGQgU1VQUE9SVFRSQU5TRkVSQUJMRS5cblxuICBzb2Z0cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgKyBfbnVtX3NvZnRib2R5X29iamVjdHMgKiAyXG4gICAgKyBfc29mdGJvZHlfcmVwb3J0X3NpemUgKiA2XG4gICk7XG5cbiAgc29mdHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuU09GVFJFUE9SVDtcbiAgc29mdHJlcG9ydFsxXSA9IF9udW1fc29mdGJvZHlfb2JqZWN0czsgLy8gcmVjb3JkIGhvdyBtYW55IG9iamVjdHMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAge1xuICAgIGxldCBvZmZzZXQgPSAyLFxuICAgICAgaW5kZXggPSBfb2JqZWN0cy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2JqZWN0ID0gX29iamVjdHNbaW5kZXhdO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIG9iamVjdC50eXBlID09PSAwKSB7IC8vIFNvZnRCb2RpZXMuXG5cbiAgICAgICAgc29mdHJlcG9ydFtvZmZzZXRdID0gb2JqZWN0LmlkO1xuXG4gICAgICAgIGNvbnN0IG9mZnNldFZlcnQgPSBvZmZzZXQgKyAyO1xuXG4gICAgICAgIGlmIChvYmplY3Qucm9wZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGNvbnN0IG5vZGVzID0gb2JqZWN0LmdldF9tX25vZGVzKCk7XG4gICAgICAgICAgY29uc3Qgc2l6ZSA9IG5vZGVzLnNpemUoKTtcbiAgICAgICAgICBzb2Z0cmVwb3J0W29mZnNldCArIDFdID0gc2l6ZTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXMuYXQoaSk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0ID0gbm9kZS5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogMyArIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqZWN0LmNsb3RoKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZXMgPSBvYmplY3QuZ2V0X21fbm9kZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gbm9kZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5hdChpKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQgPSBub2RlLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbCA9IG5vZGUuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0LngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMV0gPSB2ZXJ0LnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0LnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAzXSA9IG5vcm1hbC54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDRdID0gbm9ybWFsLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNV0gPSBub3JtYWwueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogNiArIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29uc3QgZmFjZXMgPSBvYmplY3QuZ2V0X21fZmFjZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gZmFjZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGZhY2UgPSBmYWNlcy5hdChpKTtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZTEgPSBmYWNlLmdldF9tX24oMCk7XG4gICAgICAgICAgICBjb25zdCBub2RlMiA9IGZhY2UuZ2V0X21fbigxKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUzID0gZmFjZS5nZXRfbV9uKDIpO1xuXG4gICAgICAgICAgICBjb25zdCB2ZXJ0MSA9IG5vZGUxLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQyID0gbm9kZTIuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3QgdmVydDMgPSBub2RlMy5nZXRfbV94KCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDEgPSBub2RlMS5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwyID0gbm9kZTIuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMyA9IG5vZGUzLmdldF9tX24oKTtcblxuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiAxODtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydDEueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQxLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0MS56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgM10gPSBub3JtYWwxLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNF0gPSBub3JtYWwxLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNV0gPSBub3JtYWwxLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA2XSA9IHZlcnQyLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgN10gPSB2ZXJ0Mi55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDhdID0gdmVydDIueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDldID0gbm9ybWFsMi54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEwXSA9IG5vcm1hbDIueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMV0gPSBub3JtYWwyLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMl0gPSB2ZXJ0My54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEzXSA9IHZlcnQzLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTRdID0gdmVydDMueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE1XSA9IG5vcm1hbDMueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNl0gPSBub3JtYWwzLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTddID0gbm9ybWFsMy56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiAxOCArIDI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoc29mdHJlcG9ydC5idWZmZXIsIFtzb2Z0cmVwb3J0LmJ1ZmZlcl0pO1xuICAvLyBlbHNlIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoc29mdHJlcG9ydCk7XG4gIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoc29mdHJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRDb2xsaXNpb25zID0gKCkgPT4ge1xuICBjb25zdCBkcCA9IHdvcmxkLmdldERpc3BhdGNoZXIoKSxcbiAgICBudW0gPSBkcC5nZXROdW1NYW5pZm9sZHMoKTtcbiAgICAvLyBfY29sbGlkZWQgPSBmYWxzZTtcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBpZiAoY29sbGlzaW9ucmVwb3J0Lmxlbmd0aCA8IDIgKyBudW0gKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgKyAoTWF0aC5jZWlsKF9udW1fb2JqZWN0cyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgICApO1xuICAgICAgY29sbGlzaW9ucmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAgY29sbGlzaW9ucmVwb3J0WzFdID0gMDsgLy8gaG93IG1hbnkgY29sbGlzaW9ucyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgY29uc3QgbWFuaWZvbGQgPSBkcC5nZXRNYW5pZm9sZEJ5SW5kZXhJbnRlcm5hbChpKSxcbiAgICAgIG51bV9jb250YWN0cyA9IG1hbmlmb2xkLmdldE51bUNvbnRhY3RzKCk7XG5cbiAgICBpZiAobnVtX2NvbnRhY3RzID09PSAwKSBjb250aW51ZTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnVtX2NvbnRhY3RzOyBqKyspIHtcbiAgICAgIGNvbnN0IHB0ID0gbWFuaWZvbGQuZ2V0Q29udGFjdFBvaW50KGopO1xuXG4gICAgICAvLyBpZiAoIHB0LmdldERpc3RhbmNlKCkgPCAwICkge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIChjb2xsaXNpb25yZXBvcnRbMV0rKykgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0XSA9IF9vYmplY3RzX2FtbW9bbWFuaWZvbGQuZ2V0Qm9keTAoKS5wdHJdO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDFdID0gX29iamVjdHNfYW1tb1ttYW5pZm9sZC5nZXRCb2R5MSgpLnB0cl07XG5cbiAgICAgIF92ZWN0b3IgPSBwdC5nZXRfbV9ub3JtYWxXb3JsZE9uQigpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDJdID0gX3ZlY3Rvci54KCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgM10gPSBfdmVjdG9yLnkoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyA0XSA9IF92ZWN0b3IueigpO1xuICAgICAgYnJlYWs7XG4gICAgICAvLyB9XG4gICAgICAvLyB0cmFuc2ZlcmFibGVNZXNzYWdlKF9vYmplY3RzX2FtbW8pO1xuICAgIH1cbiAgfVxuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgdHJhbnNmZXJhYmxlTWVzc2FnZShjb2xsaXNpb25yZXBvcnQuYnVmZmVyLCBbY29sbGlzaW9ucmVwb3J0LmJ1ZmZlcl0pO1xuICBlbHNlIHRyYW5zZmVyYWJsZU1lc3NhZ2UoY29sbGlzaW9ucmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydFZlaGljbGVzID0gZnVuY3Rpb24gKCkge1xuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBpZiAodmVoaWNsZXJlcG9ydC5sZW5ndGggPCAyICsgX251bV93aGVlbHMgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArIChNYXRoLmNlaWwoX251bV93aGVlbHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIHtcbiAgICBsZXQgaSA9IDAsXG4gICAgICBqID0gMCxcbiAgICAgIGluZGV4ID0gX3ZlaGljbGVzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBpZiAoX3ZlaGljbGVzW2luZGV4XSkge1xuICAgICAgICBjb25zdCB2ZWhpY2xlID0gX3ZlaGljbGVzW2luZGV4XTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgdmVoaWNsZS5nZXROdW1XaGVlbHMoKTsgaisrKSB7XG4gICAgICAgICAgLy8gdmVoaWNsZS51cGRhdGVXaGVlbFRyYW5zZm9ybSggaiwgdHJ1ZSApO1xuICAgICAgICAgIC8vIHRyYW5zZm9ybSA9IHZlaGljbGUuZ2V0V2hlZWxUcmFuc2Zvcm1XUyggaiApO1xuICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHZlaGljbGUuZ2V0V2hlZWxJbmZvKGopLmdldF9tX3dvcmxkVHJhbnNmb3JtKCk7XG5cbiAgICAgICAgICBjb25zdCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XG4gICAgICAgICAgY29uc3Qgcm90YXRpb24gPSB0cmFuc2Zvcm0uZ2V0Um90YXRpb24oKTtcblxuICAgICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSArIChpKyspICogVkVISUNMRVJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0XSA9IGluZGV4O1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgMV0gPSBqO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi54KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi55KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA0XSA9IG9yaWdpbi56KCk7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDVdID0gcm90YXRpb24ueCgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNl0gPSByb3RhdGlvbi55KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA3XSA9IHJvdGF0aW9uLnooKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDhdID0gcm90YXRpb24udygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIGogIT09IDApIHRyYW5zZmVyYWJsZU1lc3NhZ2UodmVoaWNsZXJlcG9ydC5idWZmZXIsIFt2ZWhpY2xlcmVwb3J0LmJ1ZmZlcl0pO1xuICAgIGVsc2UgaWYgKGogIT09IDApIHRyYW5zZmVyYWJsZU1lc3NhZ2UodmVoaWNsZXJlcG9ydCk7XG4gIH1cbn07XG5cbmNvbnN0IHJlcG9ydENvbnN0cmFpbnRzID0gZnVuY3Rpb24gKCkge1xuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBpZiAoY29uc3RyYWludHJlcG9ydC5sZW5ndGggPCAyICsgX251bV9jb25zdHJhaW50cyAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICsgKE1hdGguY2VpbChfbnVtX2NvbnN0cmFpbnRzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgICApO1xuICAgICAgY29uc3RyYWludHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDtcbiAgICB9XG4gIH1cblxuICB7XG4gICAgbGV0IG9mZnNldCA9IDAsXG4gICAgICBpID0gMCxcbiAgICAgIGluZGV4ID0gX2NvbnN0cmFpbnRzLmxlbmdodDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBpZiAoX2NvbnN0cmFpbnRzW2luZGV4XSkge1xuICAgICAgICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2luZGV4XTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0X2JvZHkgPSBjb25zdHJhaW50LmE7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IGNvbnN0cmFpbnQudGE7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcblxuICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICBvZmZzZXQgPSAxICsgKGkrKykgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0XSA9IGluZGV4O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDFdID0gb2Zmc2V0X2JvZHkuaWQ7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi55O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDRdID0gb3JpZ2luLno7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgNV0gPSBjb25zdHJhaW50LmdldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSAmJiBpICE9PSAwKSB0cmFuc2ZlcmFibGVNZXNzYWdlKGNvbnN0cmFpbnRyZXBvcnQuYnVmZmVyLCBbY29uc3RyYWludHJlcG9ydC5idWZmZXJdKTtcbiAgICBlbHNlIGlmIChpICE9PSAwKSB0cmFuc2ZlcmFibGVNZXNzYWdlKGNvbnN0cmFpbnRyZXBvcnQpO1xuICB9XG59O1xuXG5zZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICBpZiAoZXZlbnQuZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgIC8vIHRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICBzd2l0Y2ggKGV2ZW50LmRhdGFbMF0pIHtcbiAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDoge1xuICAgICAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDoge1xuICAgICAgICBjb2xsaXNpb25yZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOiB7XG4gICAgICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOiB7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9IGVsc2UgaWYgKGV2ZW50LmRhdGEuY21kICYmIHB1YmxpY19mdW5jdGlvbnNbZXZlbnQuZGF0YS5jbWRdKSBwdWJsaWNfZnVuY3Rpb25zW2V2ZW50LmRhdGEuY21kXShldmVudC5kYXRhLnBhcmFtcyk7XG59O1xuXG5cbn0pOyIsImltcG9ydCB7XG4gIFNjZW5lIGFzIFNjZW5lTmF0aXZlLFxuICBNZXNoLFxuICBTcGhlcmVHZW9tZXRyeSxcbiAgTWVzaE5vcm1hbE1hdGVyaWFsLFxuICBCb3hHZW9tZXRyeSxcbiAgVmVjdG9yM1xufSBmcm9tICd0aHJlZSc7XG5cbmltcG9ydCB7TG9vcH0gZnJvbSAnd2hzJztcblxuaW1wb3J0IHtWZWhpY2xlfSBmcm9tICcuLi92ZWhpY2xlL3ZlaGljbGUnO1xuaW1wb3J0IHtFdmVudGFibGV9IGZyb20gJy4uL2V2ZW50YWJsZSc7XG5cbmltcG9ydCB7XG4gIGFkZE9iamVjdENoaWxkcmVuLFxuICBNRVNTQUdFX1RZUEVTLFxuICB0ZW1wMVZlY3RvcjMsXG4gIHRlbXAxTWF0cml4NCxcbiAgUkVQT1JUX0lURU1TSVpFLFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUsXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkVcbn0gZnJvbSAnLi4vYXBpJztcblxuaW1wb3J0IFBoeXNpY3NXb3JrZXIgZnJvbSAnd29ya2VyIS4uL3dvcmtlci5qcyc7XG5cbmV4cG9ydCBjbGFzcyBXb3JsZE1vZHVsZSBleHRlbmRzIEV2ZW50YWJsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgZml4ZWRUaW1lU3RlcDogMS82MCxcbiAgICAgIHJhdGVMaW1pdDogdHJ1ZSxcbiAgICAgIGFtbW86IFwiXCIsXG4gICAgICBzb2Z0Ym9keTogZmFsc2UsXG4gICAgICBncmF2aXR5OiBuZXcgVmVjdG9yMygwLCAtMTAwLCAwKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgdGhpcy53b3JrZXIgPSBuZXcgUGh5c2ljc1dvcmtlcigpO1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UgPSB0aGlzLndvcmtlci53ZWJraXRQb3N0TWVzc2FnZSB8fCB0aGlzLndvcmtlci5wb3N0TWVzc2FnZTtcblxuICAgIHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcblxuICAgIHRoaXMubG9hZGVyID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHBhcmFtcy53YXNtKSB7XG4gICAgICAgIGZldGNoKHBhcmFtcy53YXNtKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmFycmF5QnVmZmVyKCkpXG4gICAgICAgICAgLnRoZW4oYnVmZmVyID0+IHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1zLndhc21CdWZmZXIgPSBidWZmZXI7XG5cbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZSgnaW5pdCcsIHRoaXMucGFyYW1zKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUGh5c2ljcyBsb2FkaW5nIHRpbWU6IFwiICsgKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpICsgXCJtc1wiKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgnaW5pdCcsIHRoaXMucGFyYW1zKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2FkZXIudGhlbigoKSA9PiB7dGhpcy5pc0xvYWRlZCA9IHRydWV9KTtcblxuICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzID0ge307XG4gICAgdGhpcy5fb2JqZWN0cyA9IHt9O1xuICAgIHRoaXMuX3ZlaGljbGVzID0ge307XG4gICAgdGhpcy5fY29uc3RyYWludHMgPSB7fTtcbiAgICB0aGlzLl9pc19zaW11bGF0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5nZXRPYmplY3RJZCA9ICgoKSA9PiB7XG4gICAgICBsZXQgX2lkID0gMTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBfaWQrKztcbiAgICAgIH07XG4gICAgfSkoKTtcblxuICAgIC8vIFRlc3QgU1VQUE9SVF9UUkFOU0ZFUkFCTEVcblxuICAgIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKDEpO1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoYWIsIFthYl0pO1xuICAgIHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUgPSAoYWIuYnl0ZUxlbmd0aCA9PT0gMCk7XG5cbiAgICB0aGlzLndvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgIGxldCBfdGVtcCxcbiAgICAgICAgZGF0YSA9IGV2ZW50LmRhdGE7XG5cbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgJiYgZGF0YS5ieXRlTGVuZ3RoICE9PSAxKS8vIGJ5dGVMZW5ndGggPT09IDEgaXMgdGhlIHdvcmtlciBtYWtpbmcgYSBTVVBQT1JUX1RSQU5TRkVSQUJMRSB0ZXN0XG4gICAgICAgIGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICAvLyB0cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgICAgIHN3aXRjaCAoZGF0YVswXSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2NlbmUoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTb2Z0Ym9kaWVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5jbWQpIHtcbiAgICAgICAgLy8gbm9uLXRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICAgICAgc3dpdGNoIChkYXRhLmNtZCkge1xuICAgICAgICAgIGNhc2UgJ29iamVjdFJlYWR5JzpcbiAgICAgICAgICAgIF90ZW1wID0gZGF0YS5wYXJhbXM7XG4gICAgICAgICAgICBpZiAodGhpcy5fb2JqZWN0c1tfdGVtcF0pIHRoaXMuX29iamVjdHNbX3RlbXBdLmRpc3BhdGNoRXZlbnQoJ3JlYWR5Jyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ3dvcmxkUmVhZHknOlxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICdhbW1vTG9hZGVkJzpcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnbG9hZGVkJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBoeXNpY3MgbG9hZGluZyB0aW1lOiBcIiArIChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSArIFwibXNcIik7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ3ZlaGljbGUnOlxuICAgICAgICAgICAgd2luZG93LnRlc3QgPSBkYXRhO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gRG8gbm90aGluZywganVzdCBzaG93IHRoZSBtZXNzYWdlXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBSZWNlaXZlZDogJHtkYXRhLmNtZH1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKGRhdGEucGFyYW1zKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzd2l0Y2ggKGRhdGFbMF0pIHtcbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNjZW5lKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgdXBkYXRlU2NlbmUoaW5mbykge1xuICAgIGxldCBpbmRleCA9IGluZm9bMV07XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIGluZGV4ICogUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tpbmZvW29mZnNldF1dO1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgIGNvbnN0IGRhdGEgPSBjb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID09PSBmYWxzZSkge1xuICAgICAgICBvYmplY3QucG9zaXRpb24uc2V0KFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAyXSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDNdXG4gICAgICAgICk7XG5cbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNF0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA1XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDZdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgN11cbiAgICAgICAgKTtcblxuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGRhdGEubGluZWFyVmVsb2NpdHkuc2V0KFxuICAgICAgICBpbmZvW29mZnNldCArIDhdLFxuICAgICAgICBpbmZvW29mZnNldCArIDldLFxuICAgICAgICBpbmZvW29mZnNldCArIDEwXVxuICAgICAgKTtcblxuICAgICAgZGF0YS5hbmd1bGFyVmVsb2NpdHkuc2V0KFxuICAgICAgICBpbmZvW29mZnNldCArIDExXSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMl0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTNdXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShpbmZvLmJ1ZmZlciwgW2luZm8uYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuXG4gICAgdGhpcy5faXNfc2ltdWxhdGluZyA9IGZhbHNlO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgndXBkYXRlJyk7XG4gIH1cblxuICB1cGRhdGVTb2Z0Ym9kaWVzKGluZm8pIHtcbiAgICBsZXQgaW5kZXggPSBpbmZvWzFdLFxuICAgICAgb2Zmc2V0ID0gMjtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBzaXplID0gaW5mb1tvZmZzZXQgKyAxXTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMuX29iamVjdHNbaW5mb1tvZmZzZXRdXTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBvYmplY3QuZ2VvbWV0cnkuYXR0cmlidXRlcztcbiAgICAgIGNvbnN0IHZvbHVtZVBvc2l0aW9ucyA9IGF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIGNvbnN0IG9mZnNldFZlcnQgPSBvZmZzZXQgKyAyO1xuXG4gICAgICAvLyBjb25zb2xlLmxvZyhkYXRhLmlkKTtcbiAgICAgIGlmICghZGF0YS5pc1NvZnRCb2R5UmVzZXQpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KDAsIDAsIDAsIDApO1xuXG4gICAgICAgIGRhdGEuaXNTb2Z0Qm9keVJlc2V0ID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudHlwZSA9PT0gXCJzb2Z0VHJpbWVzaFwiKSB7XG4gICAgICAgIGNvbnN0IHZvbHVtZU5vcm1hbHMgPSBhdHRyaWJ1dGVzLm5vcm1hbC5hcnJheTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDE4O1xuXG4gICAgICAgICAgY29uc3QgeDEgPSBpbmZvW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkxID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgejEgPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54MSA9IGluZm9bb2ZmcyArIDNdO1xuICAgICAgICAgIGNvbnN0IG55MSA9IGluZm9bb2ZmcyArIDRdO1xuICAgICAgICAgIGNvbnN0IG56MSA9IGluZm9bb2ZmcyArIDVdO1xuXG4gICAgICAgICAgY29uc3QgeDIgPSBpbmZvW29mZnMgKyA2XTtcbiAgICAgICAgICBjb25zdCB5MiA9IGluZm9bb2ZmcyArIDddO1xuICAgICAgICAgIGNvbnN0IHoyID0gaW5mb1tvZmZzICsgOF07XG5cbiAgICAgICAgICBjb25zdCBueDIgPSBpbmZvW29mZnMgKyA5XTtcbiAgICAgICAgICBjb25zdCBueTIgPSBpbmZvW29mZnMgKyAxMF07XG4gICAgICAgICAgY29uc3QgbnoyID0gaW5mb1tvZmZzICsgMTFdO1xuXG4gICAgICAgICAgY29uc3QgeDMgPSBpbmZvW29mZnMgKyAxMl07XG4gICAgICAgICAgY29uc3QgeTMgPSBpbmZvW29mZnMgKyAxM107XG4gICAgICAgICAgY29uc3QgejMgPSBpbmZvW29mZnMgKyAxNF07XG5cbiAgICAgICAgICBjb25zdCBueDMgPSBpbmZvW29mZnMgKyAxNV07XG4gICAgICAgICAgY29uc3QgbnkzID0gaW5mb1tvZmZzICsgMTZdO1xuICAgICAgICAgIGNvbnN0IG56MyA9IGluZm9bb2ZmcyArIDE3XTtcblxuICAgICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTldID0geDE7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgMV0gPSB5MTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAyXSA9IHoxO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgM10gPSB4MjtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA0XSA9IHkyO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDVdID0gejI7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA2XSA9IHgzO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDddID0geTM7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgOF0gPSB6MztcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTldID0gbngxO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAxXSA9IG55MTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgMl0gPSBuejE7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgM10gPSBueDI7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDRdID0gbnkyO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA1XSA9IG56MjtcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA2XSA9IG54MztcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgN10gPSBueTM7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDhdID0gbnozO1xuICAgICAgICB9XG5cbiAgICAgICAgYXR0cmlidXRlcy5ub3JtYWwubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiAxODtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGRhdGEudHlwZSA9PT0gXCJzb2Z0Um9wZU1lc2hcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICBjb25zdCB4ID0gaW5mb1tvZmZzXTtcbiAgICAgICAgICBjb25zdCB5ID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgeiA9IGluZm9bb2ZmcyArIDJdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2b2x1bWVOb3JtYWxzID0gYXR0cmlidXRlcy5ub3JtYWwuYXJyYXk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgY29uc3QgeCA9IGluZm9bb2Zmc107XG4gICAgICAgICAgY29uc3QgeSA9IGluZm9bb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHogPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54ID0gaW5mb1tvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkgPSBpbmZvW29mZnMgKyA0XTtcbiAgICAgICAgICBjb25zdCBueiA9IGluZm9bb2ZmcyArIDVdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcblxuICAgICAgICAgIC8vIEZJWE1FOiBOb3JtYWxzIGFyZSBwb2ludGVkIHRvIGxvb2sgaW5zaWRlO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDNdID0gbng7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDFdID0gbnk7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDJdID0gbno7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDY7XG4gICAgICB9XG5cbiAgICAgIGF0dHJpYnV0ZXMucG9zaXRpb24ubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgIC8vICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShpbmZvLmJ1ZmZlciwgW2luZm8uYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuXG4gICAgdGhpcy5faXNfc2ltdWxhdGluZyA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVmVoaWNsZXMoZGF0YSkge1xuICAgIGxldCB2ZWhpY2xlLCB3aGVlbDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogVkVISUNMRVJFUE9SVF9JVEVNU0laRTtcbiAgICAgIHZlaGljbGUgPSB0aGlzLl92ZWhpY2xlc1tkYXRhW29mZnNldF1dO1xuXG4gICAgICBpZiAodmVoaWNsZSA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIHdoZWVsID0gdmVoaWNsZS53aGVlbHNbZGF0YVtvZmZzZXQgKyAxXV07XG5cbiAgICAgIHdoZWVsLnBvc2l0aW9uLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAzXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA0XVxuICAgICAgKTtcblxuICAgICAgd2hlZWwucXVhdGVybmlvbi5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNV0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgN10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgOF1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICB1cGRhdGVDb25zdHJhaW50cyhkYXRhKSB7XG4gICAgbGV0IGNvbnN0cmFpbnQsIG9iamVjdDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0cmFpbnQgPSB0aGlzLl9jb25zdHJhaW50c1tkYXRhW29mZnNldF1dO1xuICAgICAgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tkYXRhW29mZnNldCArIDFdXTtcblxuICAgICAgaWYgKGNvbnN0cmFpbnQgPT09IHVuZGVmaW5lZCB8fCBvYmplY3QgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cbiAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgMl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgM10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNF1cbiAgICAgICk7XG5cbiAgICAgIHRlbXAxTWF0cml4NC5leHRyYWN0Um90YXRpb24ob2JqZWN0Lm1hdHJpeCk7XG4gICAgICB0ZW1wMVZlY3RvcjMuYXBwbHlNYXRyaXg0KHRlbXAxTWF0cml4NCk7XG5cbiAgICAgIGNvbnN0cmFpbnQucG9zaXRpb25hLmFkZFZlY3RvcnMob2JqZWN0LnBvc2l0aW9uLCB0ZW1wMVZlY3RvcjMpO1xuICAgICAgY29uc3RyYWludC5hcHBsaWVkSW1wdWxzZSA9IGRhdGFbb2Zmc2V0ICsgNV07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICB1cGRhdGVDb2xsaXNpb25zKGluZm8pIHtcbiAgICAvKipcbiAgICAgKiAjVE9ET1xuICAgICAqIFRoaXMgaXMgcHJvYmFibHkgdGhlIHdvcnN0IHdheSBldmVyIHRvIGhhbmRsZSBjb2xsaXNpb25zLiBUaGUgaW5oZXJlbnQgZXZpbG5lc3MgaXMgYSByZXNpZHVhbFxuICAgICAqIGVmZmVjdCBmcm9tIHRoZSBwcmV2aW91cyB2ZXJzaW9uJ3MgZXZpbG5lc3Mgd2hpY2ggbXV0YXRlZCB3aGVuIHN3aXRjaGluZyB0byB0cmFuc2ZlcmFibGUgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIElmIHlvdSBmZWVsIGluY2xpbmVkIHRvIG1ha2UgdGhpcyBiZXR0ZXIsIHBsZWFzZSBkbyBzby5cbiAgICAgKi9cblxuICAgIGNvbnN0IGNvbGxpc2lvbnMgPSB7fSxcbiAgICAgIG5vcm1hbF9vZmZzZXRzID0ge307XG5cbiAgICAvLyBCdWlsZCBjb2xsaXNpb24gbWFuaWZlc3RcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZm9bMV07IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIGkgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdCBvYmplY3QgPSBpbmZvW29mZnNldF07XG4gICAgICBjb25zdCBvYmplY3QyID0gaW5mb1tvZmZzZXQgKyAxXTtcblxuICAgICAgbm9ybWFsX29mZnNldHNbYCR7b2JqZWN0fS0ke29iamVjdDJ9YF0gPSBvZmZzZXQgKyAyO1xuICAgICAgbm9ybWFsX29mZnNldHNbYCR7b2JqZWN0Mn0tJHtvYmplY3R9YF0gPSAtMSAqIChvZmZzZXQgKyAyKTtcblxuICAgICAgLy8gUmVnaXN0ZXIgY29sbGlzaW9ucyBmb3IgYm90aCB0aGUgb2JqZWN0IGNvbGxpZGluZyBhbmQgdGhlIG9iamVjdCBiZWluZyBjb2xsaWRlZCB3aXRoXG4gICAgICBpZiAoIWNvbGxpc2lvbnNbb2JqZWN0XSkgY29sbGlzaW9uc1tvYmplY3RdID0gW107XG4gICAgICBjb2xsaXNpb25zW29iamVjdF0ucHVzaChvYmplY3QyKTtcblxuICAgICAgaWYgKCFjb2xsaXNpb25zW29iamVjdDJdKSBjb2xsaXNpb25zW29iamVjdDJdID0gW107XG4gICAgICBjb2xsaXNpb25zW29iamVjdDJdLnB1c2gob2JqZWN0KTtcbiAgICB9XG5cbiAgICAvLyBEZWFsIHdpdGggY29sbGlzaW9uc1xuICAgIGZvciAoY29uc3QgaWQxIGluIHRoaXMuX29iamVjdHMpIHtcbiAgICAgIGlmICghdGhpcy5fb2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShpZDEpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMuX29iamVjdHNbaWQxXTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICAvLyBJZiBvYmplY3QgdG91Y2hlcyBhbnl0aGluZywgLi4uXG4gICAgICBpZiAoY29sbGlzaW9uc1tpZDFdKSB7XG4gICAgICAgIC8vIENsZWFuIHVwIHRvdWNoZXMgYXJyYXlcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkYXRhLnRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAoY29sbGlzaW9uc1tpZDFdLmluZGV4T2YoZGF0YS50b3VjaGVzW2pdKSA9PT0gLTEpXG4gICAgICAgICAgICBkYXRhLnRvdWNoZXMuc3BsaWNlKGotLSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgZWFjaCBjb2xsaWRpbmcgb2JqZWN0XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29sbGlzaW9uc1tpZDFdLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgaWQyID0gY29sbGlzaW9uc1tpZDFdW2pdO1xuICAgICAgICAgIGNvbnN0IG9iamVjdDIgPSB0aGlzLl9vYmplY3RzW2lkMl07XG4gICAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IG9iamVjdDIuY29tcG9uZW50O1xuICAgICAgICAgIGNvbnN0IGRhdGEyID0gY29tcG9uZW50Mi51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICAgICAgaWYgKG9iamVjdDIpIHtcbiAgICAgICAgICAgIC8vIElmIG9iamVjdCB3YXMgbm90IGFscmVhZHkgdG91Y2hpbmcgb2JqZWN0Miwgbm90aWZ5IG9iamVjdFxuICAgICAgICAgICAgaWYgKGRhdGEudG91Y2hlcy5pbmRleE9mKGlkMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgIGRhdGEudG91Y2hlcy5wdXNoKGlkMik7XG5cbiAgICAgICAgICAgICAgY29uc3QgdmVsID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmdldExpbmVhclZlbG9jaXR5KCk7XG4gICAgICAgICAgICAgIGNvbnN0IHZlbDIgPSBjb21wb25lbnQyLnVzZSgncGh5c2ljcycpLmdldExpbmVhclZlbG9jaXR5KCk7XG5cbiAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnN1YlZlY3RvcnModmVsLCB2ZWwyKTtcbiAgICAgICAgICAgICAgY29uc3QgdGVtcDEgPSB0ZW1wMVZlY3RvcjMuY2xvbmUoKTtcblxuICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc3ViVmVjdG9ycyh2ZWwsIHZlbDIpO1xuICAgICAgICAgICAgICBjb25zdCB0ZW1wMiA9IHRlbXAxVmVjdG9yMy5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgIGxldCBub3JtYWxfb2Zmc2V0ID0gbm9ybWFsX29mZnNldHNbYCR7ZGF0YS5pZH0tJHtkYXRhMi5pZH1gXTtcblxuICAgICAgICAgICAgICBpZiAobm9ybWFsX29mZnNldCA+IDApIHtcbiAgICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICAgICAgICAgICAgLWluZm9bbm9ybWFsX29mZnNldF0sXG4gICAgICAgICAgICAgICAgICAtaW5mb1tub3JtYWxfb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgICAgICAgICAtaW5mb1tub3JtYWxfb2Zmc2V0ICsgMl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vcm1hbF9vZmZzZXQgKj0gLTE7XG5cbiAgICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICAgICAgICAgICAgaW5mb1tub3JtYWxfb2Zmc2V0XSxcbiAgICAgICAgICAgICAgICAgIGluZm9bbm9ybWFsX29mZnNldCArIDFdLFxuICAgICAgICAgICAgICAgICAgaW5mb1tub3JtYWxfb2Zmc2V0ICsgMl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29tcG9uZW50LmVtaXQoJ2NvbGxpc2lvbicsIG9iamVjdDIsIHRlbXAxLCB0ZW1wMiwgdGVtcDFWZWN0b3IzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBkYXRhLnRvdWNoZXMubGVuZ3RoID0gMDsgLy8gbm90IHRvdWNoaW5nIG90aGVyIG9iamVjdHNcbiAgICB9XG5cbiAgICB0aGlzLmNvbGxpc2lvbnMgPSBjb2xsaXNpb25zO1xuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICBhZGRDb25zdHJhaW50KGNvbnN0cmFpbnQsIHNob3dfbWFya2VyKSB7XG4gICAgY29uc3RyYWludC5pZCA9IHRoaXMuZ2V0T2JqZWN0SWQoKTtcbiAgICB0aGlzLl9jb25zdHJhaW50c1tjb25zdHJhaW50LmlkXSA9IGNvbnN0cmFpbnQ7XG4gICAgY29uc3RyYWludC53b3JsZE1vZHVsZSA9IHRoaXM7XG4gICAgdGhpcy5leGVjdXRlKCdhZGRDb25zdHJhaW50JywgY29uc3RyYWludC5nZXREZWZpbml0aW9uKCkpO1xuXG4gICAgaWYgKHNob3dfbWFya2VyKSB7XG4gICAgICBsZXQgbWFya2VyO1xuXG4gICAgICBzd2l0Y2ggKGNvbnN0cmFpbnQudHlwZSkge1xuICAgICAgICBjYXNlICdwb2ludCc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2hpbmdlJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc2xpZGVyJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBCb3hHZW9tZXRyeSgxMCwgMSwgMSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuXG4gICAgICAgICAgLy8gVGhpcyByb3RhdGlvbiBpc24ndCByaWdodCBpZiBhbGwgdGhyZWUgYXhpcyBhcmUgbm9uLTAgdmFsdWVzXG4gICAgICAgICAgLy8gVE9ETzogY2hhbmdlIG1hcmtlcidzIHJvdGF0aW9uIG9yZGVyIHRvIFpZWFxuICAgICAgICAgIG1hcmtlci5yb3RhdGlvbi5zZXQoXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMueSwgLy8geWVzLCB5IGFuZFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLngsIC8vIHggYXhpcyBhcmUgc3dhcHBlZFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLnpcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuX29iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdjb25ldHdpc3QnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMuX29iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdkb2YnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMuX29iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29uc3RyYWludDtcbiAgfVxuXG4gIG9uU2ltdWxhdGlvblJlc3VtZSgpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ29uU2ltdWxhdGlvblJlc3VtZScsIHt9KTtcbiAgfVxuXG4gIHJlbW92ZUNvbnN0cmFpbnQoY29uc3RyYWludCkge1xuICAgIGlmICh0aGlzLl9jb25zdHJhaW50c1tjb25zdHJhaW50LmlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV4ZWN1dGUoJ3JlbW92ZUNvbnN0cmFpbnQnLCB7aWQ6IGNvbnN0cmFpbnQuaWR9KTtcbiAgICAgIGRlbGV0ZSB0aGlzLl9jb25zdHJhaW50c1tjb25zdHJhaW50LmlkXTtcbiAgICB9XG4gIH1cblxuICBleGVjdXRlKGNtZCwgcGFyYW1zKSB7XG4gICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2Uoe2NtZCwgcGFyYW1zfSk7XG4gIH1cblxuICBvbkFkZENhbGxiYWNrKGNvbXBvbmVudCkge1xuICAgIGNvbnN0IG9iamVjdCA9IGNvbXBvbmVudC5uYXRpdmU7XG4gICAgY29uc3QgZGF0YSA9IG9iamVjdC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgIGlmIChkYXRhKSB7XG4gICAgICBjb21wb25lbnQubWFuYWdlci5zZXQoJ21vZHVsZTp3b3JsZCcsIHRoaXMpO1xuICAgICAgZGF0YS5pZCA9IHRoaXMuZ2V0T2JqZWN0SWQoKTtcbiAgICAgIG9iamVjdC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YSA9IGRhdGE7XG5cbiAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBWZWhpY2xlKSB7XG4gICAgICAgIHRoaXMub25BZGRDYWxsYmFjayhvYmplY3QubWVzaCk7XG4gICAgICAgIHRoaXMuX3ZlaGljbGVzW2RhdGEuaWRdID0gb2JqZWN0O1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2FkZFZlaGljbGUnLCBkYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9vYmplY3RzW2RhdGEuaWRdID0gb2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmplY3QuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgZGF0YS5jaGlsZHJlbiA9IFtdO1xuICAgICAgICAgIGFkZE9iamVjdENoaWxkcmVuKG9iamVjdCwgb2JqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIChvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMpIHtcbiAgICAgICAgLy8gICBpZiAodGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHMuaGFzT3duUHJvcGVydHkob2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkKSlcbiAgICAgICAgLy8gICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0rKztcbiAgICAgICAgLy8gICBlbHNlIHtcbiAgICAgICAgLy8gICAgIHRoaXMuZXhlY3V0ZSgncmVnaXN0ZXJNYXRlcmlhbCcsIG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcyk7XG4gICAgICAgIC8vICAgICBkYXRhLm1hdGVyaWFsSWQgPSBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWQ7XG4gICAgICAgIC8vICAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdID0gMTtcbiAgICAgICAgLy8gICB9XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBvYmplY3QucXVhdGVybmlvbi5zZXRGcm9tRXVsZXIob2JqZWN0LnJvdGF0aW9uKTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gY29uc29sZS5sb2cob2JqZWN0LmNvbXBvbmVudCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdC5yb3RhdGlvbik7XG5cbiAgICAgICAgLy8gT2JqZWN0IHN0YXJ0aW5nIHBvc2l0aW9uICsgcm90YXRpb25cbiAgICAgICAgZGF0YS5wb3NpdGlvbiA9IHtcbiAgICAgICAgICB4OiBvYmplY3QucG9zaXRpb24ueCxcbiAgICAgICAgICB5OiBvYmplY3QucG9zaXRpb24ueSxcbiAgICAgICAgICB6OiBvYmplY3QucG9zaXRpb24uelxuICAgICAgICB9O1xuXG4gICAgICAgIGRhdGEucm90YXRpb24gPSB7XG4gICAgICAgICAgeDogb2JqZWN0LnF1YXRlcm5pb24ueCxcbiAgICAgICAgICB5OiBvYmplY3QucXVhdGVybmlvbi55LFxuICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgdzogb2JqZWN0LnF1YXRlcm5pb24ud1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChkYXRhLndpZHRoKSBkYXRhLndpZHRoICo9IG9iamVjdC5zY2FsZS54O1xuICAgICAgICBpZiAoZGF0YS5oZWlnaHQpIGRhdGEuaGVpZ2h0ICo9IG9iamVjdC5zY2FsZS55O1xuICAgICAgICBpZiAoZGF0YS5kZXB0aCkgZGF0YS5kZXB0aCAqPSBvYmplY3Quc2NhbGUuejtcblxuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2FkZE9iamVjdCcsIGRhdGEpO1xuICAgICAgfVxuXG4gICAgICBjb21wb25lbnQuZW1pdCgncGh5c2ljczphZGRlZCcpO1xuICAgIH1cbiAgfVxuXG4gIG9uUmVtb3ZlQ2FsbGJhY2soY29tcG9uZW50KSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gY29tcG9uZW50Lm5hdGl2ZTtcblxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBWZWhpY2xlKSB7XG4gICAgICB0aGlzLmV4ZWN1dGUoJ3JlbW92ZVZlaGljbGUnLCB7aWQ6IG9iamVjdC5fcGh5c2lqcy5pZH0pO1xuICAgICAgd2hpbGUgKG9iamVjdC53aGVlbHMubGVuZ3RoKSB0aGlzLnJlbW92ZShvYmplY3Qud2hlZWxzLnBvcCgpKTtcblxuICAgICAgdGhpcy5yZW1vdmUob2JqZWN0Lm1lc2gpO1xuICAgICAgdGhpcy5fdmVoaWNsZXNbb2JqZWN0Ll9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1lc2gucHJvdG90eXBlLnJlbW92ZS5jYWxsKHRoaXMsIG9iamVjdCk7XG5cbiAgICAgIGlmIChvYmplY3QuX3BoeXNpanMpIHtcbiAgICAgICAgY29tcG9uZW50Lm1hbmFnZXIucmVtb3ZlKCdtb2R1bGU6d29ybGQnKTtcbiAgICAgICAgdGhpcy5fb2JqZWN0c1tvYmplY3QuX3BoeXNpanMuaWRdID0gbnVsbDtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVPYmplY3QnLCB7aWQ6IG9iamVjdC5fcGh5c2lqcy5pZH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob2JqZWN0Lm1hdGVyaWFsICYmIG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcyAmJiB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50cy5oYXNPd25Qcm9wZXJ0eShvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWQpKSB7XG4gICAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdLS07XG5cbiAgICAgIGlmICh0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdID09PSAwKSB7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgndW5SZWdpc3Rlck1hdGVyaWFsJywgb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzKTtcbiAgICAgICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZGVmZXIoZnVuYywgYXJncykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNMb2FkZWQpIHtcbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIHRoaXMubG9hZGVyLnRoZW4oKCkgPT4ge1xuICAgICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIG1hbmFnZXIuc2V0KCdwaHlzaWNzV29ya2VyJywgdGhpcy53b3JrZXIpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG9uQWRkKGNvbXBvbmVudCwgc2VsZikge1xuICAgICAgaWYgKGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSkgcmV0dXJuIHNlbGYuZGVmZXIoc2VsZi5vbkFkZENhbGxiYWNrLmJpbmQoc2VsZiksIFtjb21wb25lbnRdKTtcbiAgICAgIHJldHVybjtcbiAgICB9LFxuXG4gICAgb25SZW1vdmUoY29tcG9uZW50LCBzZWxmKSB7XG4gICAgICBpZiAoY29tcG9uZW50LnVzZSgncGh5c2ljcycpKSByZXR1cm4gc2VsZi5kZWZlcihzZWxmLm9uUmVtb3ZlQ2FsbGJhY2suYmluZChzZWxmKSwgW2NvbXBvbmVudF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgLy8gLi4uXG5cbiAgICB0aGlzLnNldEZpeGVkVGltZVN0ZXAgPSBmdW5jdGlvbihmaXhlZFRpbWVTdGVwKSB7XG4gICAgICBpZiAoZml4ZWRUaW1lU3RlcCkgc2VsZi5leGVjdXRlKCdzZXRGaXhlZFRpbWVTdGVwJywgZml4ZWRUaW1lU3RlcCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRHcmF2aXR5ID0gZnVuY3Rpb24oZ3Jhdml0eSkge1xuICAgICAgaWYgKGdyYXZpdHkpIHNlbGYuZXhlY3V0ZSgnc2V0R3Jhdml0eScsIGdyYXZpdHkpO1xuICAgIH1cblxuICAgIHRoaXMuYWRkQ29uc3RyYWludCA9IHNlbGYuYWRkQ29uc3RyYWludC5iaW5kKHNlbGYpO1xuXG4gICAgdGhpcy5zaW11bGF0ZSA9IGZ1bmN0aW9uKHRpbWVTdGVwLCBtYXhTdWJTdGVwcykge1xuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5iZWdpbigpO1xuXG4gICAgICBpZiAoc2VsZi5faXNfc2ltdWxhdGluZykgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBzZWxmLl9pc19zaW11bGF0aW5nID0gdHJ1ZTtcblxuICAgICAgZm9yIChjb25zdCBvYmplY3RfaWQgaW4gc2VsZi5fb2JqZWN0cykge1xuICAgICAgICBpZiAoIXNlbGYuX29iamVjdHMuaGFzT3duUHJvcGVydHkob2JqZWN0X2lkKSkgY29udGludWU7XG5cbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gc2VsZi5fb2JqZWN0c1tvYmplY3RfaWRdO1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgICAgaWYgKG9iamVjdCAhPT0gbnVsbCAmJiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiB8fCBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uKSkge1xuICAgICAgICAgIGNvbnN0IHVwZGF0ZSA9IHtpZDogZGF0YS5pZH07XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnBvcyA9IHtcbiAgICAgICAgICAgICAgeDogb2JqZWN0LnBvc2l0aW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5wb3NpdGlvbi55LFxuICAgICAgICAgICAgICB6OiBvYmplY3QucG9zaXRpb24uelxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGRhdGEuaXNTb2Z0Ym9keSkgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcblxuICAgICAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uKSB7XG4gICAgICAgICAgICB1cGRhdGUucXVhdCA9IHtcbiAgICAgICAgICAgICAgeDogb2JqZWN0LnF1YXRlcm5pb24ueCxcbiAgICAgICAgICAgICAgeTogb2JqZWN0LnF1YXRlcm5pb24ueSxcbiAgICAgICAgICAgICAgejogb2JqZWN0LnF1YXRlcm5pb24ueixcbiAgICAgICAgICAgICAgdzogb2JqZWN0LnF1YXRlcm5pb24ud1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGRhdGEuaXNTb2Z0Ym9keSkgb2JqZWN0LnJvdGF0aW9uLnNldCgwLCAwLCAwKTtcblxuICAgICAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuZXhlY3V0ZSgndXBkYXRlVHJhbnNmb3JtJywgdXBkYXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZWxmLmV4ZWN1dGUoJ3NpbXVsYXRlJywge3RpbWVTdGVwLCBtYXhTdWJTdGVwc30pO1xuXG4gICAgICBpZiAoc2VsZi5fc3RhdHMpIHNlbGYuX3N0YXRzLmVuZCgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gY29uc3Qgc2ltdWxhdGVQcm9jZXNzID0gKHQpID0+IHtcbiAgICAvLyAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoc2ltdWxhdGVQcm9jZXNzKTtcblxuICAgIC8vICAgdGhpcy5zaW11bGF0ZSgxLzYwLCAxKTsgLy8gZGVsdGEsIDFcbiAgICAvLyB9XG5cbiAgICAvLyBzaW11bGF0ZVByb2Nlc3MoKTtcblxuICAgIHNlbGYubG9hZGVyLnRoZW4oKCkgPT4ge1xuICAgICAgc2VsZi5zaW11bGF0ZUxvb3AgPSBuZXcgTG9vcCgoY2xvY2spID0+IHtcbiAgICAgICAgdGhpcy5zaW11bGF0ZShjbG9jay5nZXREZWx0YSgpLCAxKTsgLy8gZGVsdGEsIDFcbiAgICAgIH0pO1xuXG4gICAgICBzZWxmLnNpbXVsYXRlTG9vcC5zdGFydCh0aGlzKTtcblxuICAgICAgdGhpcy5zZXRHcmF2aXR5KHBhcmFtcy5ncmF2aXR5KTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtRdWF0ZXJuaW9ufSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBjb25zdCBwcm9wZXJ0aWVzID0ge1xuICBwb3NpdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgfSxcblxuICAgIHNldCh2ZWN0b3IzKSB7XG4gICAgICBjb25zdCBwb3MgPSB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgICBjb25zdCBzY29wZSA9IHRoaXM7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHBvcywge1xuICAgICAgICB4OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3g7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh4KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feCA9IHg7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3k7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh5KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feSA9IHk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB6OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3o7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh6KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feiA9IHo7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcblxuICAgICAgcG9zLmNvcHkodmVjdG9yMyk7XG4gICAgfVxuICB9LFxuXG4gIHF1YXRlcm5pb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMubmF0aXZlLnF1YXRlcm5pb247XG4gICAgfSxcblxuICAgIHNldChxdWF0ZXJuaW9uKSB7XG4gICAgICBjb25zdCBxdWF0ID0gdGhpcy5fbmF0aXZlLnF1YXRlcm5pb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgcXVhdC5jb3B5KHF1YXRlcm5pb24pO1xuXG4gICAgICBxdWF0Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIGlmIChuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLl9fY19yb3QgPSBmYWxzZTtcbiAgICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICByb3RhdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHRoaXMuX19jX3JvdCA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnJvdGF0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQoZXVsZXIpIHtcbiAgICAgIGNvbnN0IHJvdCA9IHRoaXMuX25hdGl2ZS5yb3RhdGlvbixcbiAgICAgICAgbmF0aXZlID0gdGhpcy5fbmF0aXZlO1xuXG4gICAgICB0aGlzLnF1YXRlcm5pb24uY29weShuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihldWxlcikpO1xuXG4gICAgICByb3Qub25DaGFuZ2UoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2Nfcm90KSB7XG4gICAgICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIocm90KSk7XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JhcFBoeXNpY3NQcm90b3R5cGUoc2NvcGUpIHtcbiAgZm9yIChsZXQga2V5IGluIHByb3BlcnRpZXMpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NvcGUsIGtleSwge1xuICAgICAgZ2V0OiBwcm9wZXJ0aWVzW2tleV0uZ2V0LmJpbmQoc2NvcGUpLFxuICAgICAgc2V0OiBwcm9wZXJ0aWVzW2tleV0uc2V0LmJpbmQoc2NvcGUpLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbkNvcHkoc291cmNlKSB7XG4gIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuXG4gIGNvbnN0IHBoeXNpY3MgPSB0aGlzLnVzZSgncGh5c2ljcycpO1xuICBjb25zdCBzb3VyY2VQaHlzaWNzID0gc291cmNlLnVzZSgncGh5c2ljcycpO1xuXG4gIHRoaXMubWFuYWdlci5tb2R1bGVzLnBoeXNpY3MgPSBwaHlzaWNzLmNsb25lKHRoaXMubWFuYWdlcik7XG5cbiAgcGh5c2ljcy5kYXRhID0gey4uLnNvdXJjZVBoeXNpY3MuZGF0YX07XG4gIHBoeXNpY3MuZGF0YS5pc1NvZnRCb2R5UmVzZXQgPSBmYWxzZTtcbiAgaWYgKHBoeXNpY3MuZGF0YS5pc1NvZnRib2R5KSBwaHlzaWNzLmRhdGEuaXNTb2Z0Qm9keVJlc2V0ID0gZmFsc2U7XG5cbiAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucm90YXRpb24uY2xvbmUoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gdGhpcy5xdWF0ZXJuaW9uLmNsb25lKCk7XG5cbiAgcmV0dXJuIHNvdXJjZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uV3JhcCgpIHtcbiAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucm90YXRpb24uY2xvbmUoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gdGhpcy5xdWF0ZXJuaW9uLmNsb25lKCk7XG59XG4iLCJpbXBvcnQge1ZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5jbGFzcyBBUEkge1xuICBhcHBseUNlbnRyYWxJbXB1bHNlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUNlbnRyYWxJbXB1bHNlJywge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZvcmNlLngsIHk6IGZvcmNlLnksIHo6IGZvcmNlLnp9KTtcbiAgfVxuXG4gIGFwcGx5SW1wdWxzZShmb3JjZSwgb2Zmc2V0KSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUltcHVsc2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgaW1wdWxzZV94OiBmb3JjZS54LFxuICAgICAgaW1wdWxzZV95OiBmb3JjZS55LFxuICAgICAgaW1wdWxzZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseVRvcnF1ZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlUb3JxdWUnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgdG9ycXVlX3g6IGZvcmNlLngsXG4gICAgICB0b3JxdWVfeTogZm9yY2UueSxcbiAgICAgIHRvcnF1ZV96OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUNlbnRyYWxGb3JjZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlDZW50cmFsRm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgeDogZm9yY2UueCxcbiAgICAgIHk6IGZvcmNlLnksXG4gICAgICB6OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUZvcmNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Rm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgZm9yY2VfeDogZm9yY2UueCxcbiAgICAgIGZvcmNlX3k6IGZvcmNlLnksXG4gICAgICBmb3JjZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBnZXRBbmd1bGFyVmVsb2NpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5hbmd1bGFyVmVsb2NpdHk7XG4gIH1cblxuICBzZXRBbmd1bGFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0QW5ndWxhclZlbG9jaXR5JyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiB2ZWxvY2l0eS54LCB5OiB2ZWxvY2l0eS55LCB6OiB2ZWxvY2l0eS56fVxuICAgICk7XG4gIH1cblxuICBnZXRMaW5lYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmxpbmVhclZlbG9jaXR5O1xuICB9XG5cbiAgc2V0TGluZWFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyVmVsb2NpdHknLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJGYWN0b3IoZmFjdG9yKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldEFuZ3VsYXJGYWN0b3InLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldExpbmVhckZhY3RvcihmYWN0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyRmFjdG9yJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiBmYWN0b3IueCwgeTogZmFjdG9yLnksIHo6IGZhY3Rvci56fVxuICAgICk7XG4gIH1cblxuICBzZXREYW1waW5nKGxpbmVhciwgYW5ndWxhcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXREYW1waW5nJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCBsaW5lYXIsIGFuZ3VsYXJ9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZE1vdGlvblRocmVzaG9sZCh0aHJlc2hvbGQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0Q2NkTW90aW9uVGhyZXNob2xkJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB0aHJlc2hvbGR9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKHJhZGl1cykge1xuICAgIHRoaXMuZXhlY3V0ZSgnc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMnLCB7aWQ6IHRoaXMuZGF0YS5pZCwgcmFkaXVzfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgZXh0ZW5kcyBBUEkge1xuICBzdGF0aWMgcmlnaWRib2R5ID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgbWFzczogMTAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMFxuICB9KTtcblxuICBzdGF0aWMgc29mdGJvZHkgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICBwcmVzc3VyZTogMTAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBrbHN0OiAwLjksXG4gICAga3ZzdDogMC45LFxuICAgIGthc3Q6IDAuOSxcbiAgICBwaXRlcmF0aW9uczogMSxcbiAgICB2aXRlcmF0aW9uczogMCxcbiAgICBkaXRlcmF0aW9uczogMCxcbiAgICBjaXRlcmF0aW9uczogNCxcbiAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgIHJpZ2lkSGFyZG5lc3M6IDEsXG4gICAgaXNTb2Z0Ym9keTogdHJ1ZSxcbiAgICBpc1NvZnRCb2R5UmVzZXQ6IGZhbHNlXG4gIH0pO1xuXG4gIHN0YXRpYyByb3BlID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBrbHN0OiAwLjksXG4gICAga3ZzdDogMC45LFxuICAgIGthc3Q6IDAuOSxcbiAgICBwaXRlcmF0aW9uczogMSxcbiAgICB2aXRlcmF0aW9uczogMCxcbiAgICBkaXRlcmF0aW9uczogMCxcbiAgICBjaXRlcmF0aW9uczogNCxcbiAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgIHJpZ2lkSGFyZG5lc3M6IDEsXG4gICAgaXNTb2Z0Ym9keTogdHJ1ZVxuICB9KTtcblxuICBzdGF0aWMgY2xvdGggPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgZGFtcGluZzogMCxcbiAgICBtYXJnaW46IDAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMVxuICB9KTtcblxuICBjb25zdHJ1Y3RvcihkZWZhdWx0cywgZGF0YSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbihkZWZhdWx0cywgZGF0YSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgbWFuYWdlci5kZWZpbmUoJ3BoeXNpY3MnKTtcblxuICAgIHRoaXMuZXhlY3V0ZSA9ICguLi5kYXRhKSA9PiB7XG4gICAgICByZXR1cm4gbWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpXG4gICAgICA/IG1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKC4uLmRhdGEpXG4gICAgICA6ICgpID0+IHt9O1xuICAgIH07XG4gIH1cblxuICB1cGRhdGVEYXRhKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5icmlkZ2UuZ2VvbWV0cnkgPSBmdW5jdGlvbiAoZ2VvbWV0cnksIG1vZHVsZSkge1xuICAgICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuIGdlb21ldHJ5O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjayhnZW9tZXRyeSwgbW9kdWxlKTtcbiAgICAgIHJldHVybiByZXN1bHQgPyByZXN1bHQgOiBnZW9tZXRyeTtcbiAgICB9XG4gIH1cblxuICBjbG9uZShtYW5hZ2VyKSB7XG4gICAgY29uc3QgY2xvbmUgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpO1xuICAgIGNsb25lLmRhdGEgPSB7Li4udGhpcy5kYXRhfTtcbiAgICBjbG9uZS5icmlkZ2UuZ2VvbWV0cnkgPSB0aGlzLmJyaWRnZS5nZW9tZXRyeTtcbiAgICB0aGlzLm1hbmFnZXIuYXBwbHkoY2xvbmUsIFttYW5hZ2VyXSk7XG5cbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIEJveE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnYm94JyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbXBvdW5kTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjb21wb3VuZCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuLy8gVE9ETzogVGVzdCBDYXBzdWxlTW9kdWxlIGluIGFjdGlvbi5cbmV4cG9ydCBjbGFzcyBDYXBzdWxlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjYXBzdWxlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbmNhdmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NvbmNhdmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGRhdGEuZGF0YSA9IHRoaXMuZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpIHtcbiAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgIGNvbnN0IGRhdGEgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5ID9cbiAgICAgIGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOlxuICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiA5KTtcblxuICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgY29uc3QgdmVydGljZXMgPSBnZW9tZXRyeS52ZXJ0aWNlcztcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICAgICAgY29uc3QgdkEgPSB2ZXJ0aWNlc1tmYWNlLmFdO1xuICAgICAgICBjb25zdCB2QiA9IHZlcnRpY2VzW2ZhY2UuYl07XG4gICAgICAgIGNvbnN0IHZDID0gdmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgICBjb25zdCBpOSA9IGkgKiA5O1xuXG4gICAgICAgIGRhdGFbaTldID0gdkEueDtcbiAgICAgICAgZGF0YVtpOSArIDFdID0gdkEueTtcbiAgICAgICAgZGF0YVtpOSArIDJdID0gdkEuejtcblxuICAgICAgICBkYXRhW2k5ICsgM10gPSB2Qi54O1xuICAgICAgICBkYXRhW2k5ICsgNF0gPSB2Qi55O1xuICAgICAgICBkYXRhW2k5ICsgNV0gPSB2Qi56O1xuXG4gICAgICAgIGRhdGFbaTkgKyA2XSA9IHZDLng7XG4gICAgICAgIGRhdGFbaTkgKyA3XSA9IHZDLnk7XG4gICAgICAgIGRhdGFbaTkgKyA4XSA9IHZDLno7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29uZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEucmFkaXVzID0gKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLngpIC8gMjtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbnZleE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29udmV4JyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcbiAgICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkgZ2VvbWV0cnkuX2J1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCkuZnJvbUdlb21ldHJ5KGdlb21ldHJ5KTtcblxuICAgICAgZGF0YS5kYXRhID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/XG4gICAgICAgIGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOlxuICAgICAgICBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIEN5bGluZGVyTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjeWxpbmRlcicsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgZGF0YS5oZWlnaHQgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgZGF0YS5kZXB0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vUGh5c2ljc01vZHVsZSc7XG5pbXBvcnQge1ZlY3RvcjMsIFZlY3RvcjIsIEJ1ZmZlckdlb21ldHJ5fSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBjbGFzcyBIZWlnaHRmaWVsZE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnaGVpZ2h0ZmllbGQnLFxuICAgICAgc2l6ZTogbmV3IFZlY3RvcjIoMSwgMSksXG4gICAgICBhdXRvQWxpZ246IGZhbHNlLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IHt4OiB4ZGl2LCB5OiB5ZGl2fSA9IGRhdGEuc2l6ZTtcbiAgICAgIGNvbnN0IHZlcnRzID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOiBnZW9tZXRyeS52ZXJ0aWNlcztcbiAgICAgIGxldCBzaXplID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/IHZlcnRzLmxlbmd0aCAvIDMgOiB2ZXJ0cy5sZW5ndGg7XG5cbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBjb25zdCB4c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBjb25zdCB5c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG5cbiAgICAgIGRhdGEueHB0cyA9ICh0eXBlb2YgeGRpdiA9PT0gJ3VuZGVmaW5lZCcpID8gTWF0aC5zcXJ0KHNpemUpIDogeGRpdiArIDE7XG4gICAgICBkYXRhLnlwdHMgPSAodHlwZW9mIHlkaXYgPT09ICd1bmRlZmluZWQnKSA/IE1hdGguc3FydChzaXplKSA6IHlkaXYgKyAxO1xuXG4gICAgICAvLyBub3RlIC0gdGhpcyBhc3N1bWVzIG91ciBwbGFuZSBnZW9tZXRyeSBpcyBzcXVhcmUsIHVubGVzcyB3ZSBwYXNzIGluIHNwZWNpZmljIHhkaXYgYW5kIHlkaXZcbiAgICAgIGRhdGEuYWJzTWF4SGVpZ2h0ID0gTWF0aC5tYXgoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnksIE1hdGguYWJzKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55KSk7XG5cbiAgICAgIGNvbnN0IHBvaW50cyA9IG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSksXG4gICAgICAgIHhwdHMgPSBkYXRhLnhwdHMsXG4gICAgICAgIHlwdHMgPSBkYXRhLnlwdHM7XG5cbiAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgY29uc3Qgdk51bSA9IHNpemUgJSB4cHRzICsgKCh5cHRzIC0gTWF0aC5yb3VuZCgoc2l6ZSAvIHhwdHMpIC0gKChzaXplICUgeHB0cykgLyB4cHRzKSkgLSAxKSAqIHlwdHMpO1xuXG4gICAgICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtICogMyArIDFdO1xuICAgICAgICBlbHNlIHBvaW50c1tzaXplXSA9IHZlcnRzW3ZOdW1dLnk7XG4gICAgICB9XG5cbiAgICAgIGRhdGEucG9pbnRzID0gcG9pbnRzO1xuXG4gICAgICBkYXRhLnNjYWxlLm11bHRpcGx5KFxuICAgICAgICBuZXcgVmVjdG9yMyh4c2l6ZSAvICh4cHRzIC0gMSksIDEsIHlzaXplIC8gKHlwdHMgLSAxKSlcbiAgICAgICk7XG5cbiAgICAgIGlmIChkYXRhLmF1dG9BbGlnbikgZ2VvbWV0cnkudHJhbnNsYXRlKHhzaXplIC8gLTIsIDAsIHlzaXplIC8gLTIpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgUGxhbmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3BsYW5lJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLm5vcm1hbCA9IGdlb21ldHJ5LmZhY2VzWzBdLm5vcm1hbC5jbG9uZSgpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgU3BoZXJlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzcGhlcmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ1NwaGVyZSgpO1xuICAgICAgZGF0YS5yYWRpdXMgPSBnZW9tZXRyeS5ib3VuZGluZ1NwaGVyZS5yYWRpdXM7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFNvZnRib2R5TW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzb2Z0VHJpbWVzaCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnNvZnRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBjb25zdCBpZHhHZW9tZXRyeSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnlcbiAgICAgICAgPyBnZW9tZXRyeVxuICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgZ2VvbWV0cnkubWVyZ2VWZXJ0aWNlcygpO1xuXG4gICAgICAgICAgY29uc3QgYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5zZXRJbmRleChcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyAoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogMyA+IDY1NTM1ID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheSkoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShnZW9tZXRyeS5mYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBkYXRhLmFWZXJ0aWNlcyA9IGlkeEdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgICBkYXRhLmFJbmRpY2VzID0gaWR4R2VvbWV0cnkuaW5kZXguYXJyYXk7XG5cbiAgICAgIHJldHVybiBuZXcgQnVmZmVyR2VvbWV0cnkoKS5mcm9tR2VvbWV0cnkoZ2VvbWV0cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENsb3RoTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzb2Z0Q2xvdGhNZXNoJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUuY2xvdGgoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IGdlb21QYXJhbXMgPSBnZW9tZXRyeS5wYXJhbWV0ZXJzO1xuXG4gICAgICBjb25zdCBnZW9tID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeVxuICAgICAgICA/IGdlb21ldHJ5XG4gICAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgIGdlb21ldHJ5Lm1lcmdlVmVydGljZXMoKTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3QgZmFjZXMgPSBnZW9tZXRyeS5mYWNlcywgZmFjZXNMZW5ndGggPSBmYWNlcy5sZW5ndGg7XG4gICAgICAgICAgY29uc3Qgbm9ybWFsc0FycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmYWNlc0xlbmd0aCAqIDMpO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmYWNlc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpMyA9IGkgKiAzO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gZmFjZXNbaV0ubm9ybWFsIHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpM10gPSBub3JtYWwueDtcbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpMyArIDFdID0gbm9ybWFsLnk7XG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTMgKyAyXSA9IG5vcm1hbC56O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdub3JtYWwnLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbm9ybWFsc0FycmF5LFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IChmYWNlc0xlbmd0aCAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGZhY2VzTGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShmYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBjb25zdCB2ZXJ0cyA9IGdlb20uYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgaWYgKCFnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMpIGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyA9IDE7XG4gICAgICBpZiAoIWdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMpIGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgPSAxO1xuXG4gICAgICBjb25zdCBpZHgwMCA9IDA7XG4gICAgICBjb25zdCBpZHgwMSA9IGdlb21QYXJhbXMud2lkdGhTZWdtZW50cztcbiAgICAgIGNvbnN0IGlkeDEwID0gKGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgKyAxKSAqIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKSAtIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKTtcbiAgICAgIGNvbnN0IGlkeDExID0gdmVydHMubGVuZ3RoIC8gMyAtIDE7XG5cbiAgICAgIGRhdGEuY29ybmVycyA9IFtcbiAgICAgICAgdmVydHNbaWR4MDEgKiAzXSwgdmVydHNbaWR4MDEgKiAzICsgMV0sIHZlcnRzW2lkeDAxICogMyArIDJdLCAvLyAgIOKVl1xuICAgICAgICB2ZXJ0c1tpZHgwMCAqIDNdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAxXSwgdmVydHNbaWR4MDAgKiAzICsgMl0sIC8vIOKVlFxuICAgICAgICB2ZXJ0c1tpZHgxMSAqIDNdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAxXSwgdmVydHNbaWR4MTEgKiAzICsgMl0sIC8vICAgICAgIOKVnVxuICAgICAgICB2ZXJ0c1tpZHgxMCAqIDNdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAxXSwgdmVydHNbaWR4MTAgKiAzICsgMl0sIC8vICAgICDilZpcbiAgICAgIF07XG5cbiAgICAgIGRhdGEuc2VnbWVudHMgPSBbZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSwgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDFdO1xuXG4gICAgICByZXR1cm4gZ2VvbTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUsIFZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBSb3BlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzb2Z0Um9wZU1lc2gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yb3BlKClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgICAgZ2VvbWV0cnkgPSAoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGJ1ZmYgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmYuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsZW5ndGggPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5Lmxlbmd0aCAvIDM7XG4gICAgICBjb25zdCB2ZXJ0ID0gbiA9PiBuZXcgVmVjdG9yMygpLmZyb21BcnJheShnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5LCBuKjMpO1xuXG4gICAgICBjb25zdCB2MSA9IHZlcnQoMCk7XG4gICAgICBjb25zdCB2MiA9IHZlcnQobGVuZ3RoIC0gMSk7XG5cbiAgICAgIGRhdGEuZGF0YSA9IFtcbiAgICAgICAgdjEueCwgdjEueSwgdjEueixcbiAgICAgICAgdjIueCwgdjIueSwgdjIueixcbiAgICAgICAgbGVuZ3RoXG4gICAgICBdO1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRBbmNob3Iob2JqZWN0LCBub2RlLCBpbmZsdWVuY2UsIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMgPSB0cnVlKSB7XG4gICAgY29uc3QgbzEgPSB0aGlzLmRhdGEuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcblxuICAgIHRoaXMuZXhlY3V0ZSgnYXBwZW5kQW5jaG9yJywge1xuICAgICAgb2JqOiBvMSxcbiAgICAgIG9iajI6IG8yLFxuICAgICAgbm9kZSxcbiAgICAgIGluZmx1ZW5jZSxcbiAgICAgIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXNcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtMb29wfSBmcm9tICd3aHMnO1xuXG5pbXBvcnQge1xuICBPYmplY3QzRCxcbiAgUXVhdGVybmlvbixcbiAgVmVjdG9yMyxcbiAgRXVsZXJcbn0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBQSV8yID0gTWF0aC5QSSAvIDI7XG5cbi8vIFRPRE86IEZpeCBET01cbmZ1bmN0aW9uIEZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIoY2FtZXJhLCBtZXNoLCBwYXJhbXMpIHtcbiAgY29uc3QgdmVsb2NpdHlGYWN0b3IgPSAxO1xuICBsZXQgcnVuVmVsb2NpdHkgPSAwLjI1O1xuXG4gIG1lc2gudXNlKCdwaHlzaWNzJykuc2V0QW5ndWxhckZhY3Rvcih7eDogMCwgeTogMCwgejogMH0pO1xuICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuXG4gIC8qIEluaXQgKi9cbiAgY29uc3QgcGxheWVyID0gbWVzaCxcbiAgICBwaXRjaE9iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHBpdGNoT2JqZWN0LmFkZChjYW1lcmEubmF0aXZlKTtcblxuICBjb25zdCB5YXdPYmplY3QgPSBuZXcgT2JqZWN0M0QoKTtcblxuICB5YXdPYmplY3QucG9zaXRpb24ueSA9IHBhcmFtcy55cG9zOyAvLyBleWVzIGFyZSAyIG1ldGVycyBhYm92ZSB0aGUgZ3JvdW5kXG4gIHlhd09iamVjdC5hZGQocGl0Y2hPYmplY3QpO1xuXG4gIGNvbnN0IHF1YXQgPSBuZXcgUXVhdGVybmlvbigpO1xuXG4gIGxldCBjYW5KdW1wID0gZmFsc2UsXG4gICAgLy8gTW92ZXMuXG4gICAgbW92ZUZvcndhcmQgPSBmYWxzZSxcbiAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZSxcbiAgICBtb3ZlTGVmdCA9IGZhbHNlLFxuICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuXG4gIHBsYXllci5vbignY29sbGlzaW9uJywgKG90aGVyT2JqZWN0LCB2LCByLCBjb250YWN0Tm9ybWFsKSA9PiB7XG4gICAgY29uc29sZS5sb2coY29udGFjdE5vcm1hbC55KTtcbiAgICBpZiAoY29udGFjdE5vcm1hbC55IDwgMC41KSAvLyBVc2UgYSBcImdvb2RcIiB0aHJlc2hvbGQgdmFsdWUgYmV0d2VlbiAwIGFuZCAxIGhlcmUhXG4gICAgICBjYW5KdW1wID0gdHJ1ZTtcbiAgfSk7XG5cbiAgY29uc3Qgb25Nb3VzZU1vdmUgPSBldmVudCA9PiB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIGNvbnN0IG1vdmVtZW50WCA9IHR5cGVvZiBldmVudC5tb3ZlbWVudFggPT09ICdudW1iZXInXG4gICAgICA/IGV2ZW50Lm1vdmVtZW50WCA6IHR5cGVvZiBldmVudC5tb3pNb3ZlbWVudFggPT09ICdudW1iZXInXG4gICAgICAgID8gZXZlbnQubW96TW92ZW1lbnRYIDogdHlwZW9mIGV2ZW50LmdldE1vdmVtZW50WCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgID8gZXZlbnQuZ2V0TW92ZW1lbnRYKCkgOiAwO1xuICAgIGNvbnN0IG1vdmVtZW50WSA9IHR5cGVvZiBldmVudC5tb3ZlbWVudFkgPT09ICdudW1iZXInXG4gICAgICA/IGV2ZW50Lm1vdmVtZW50WSA6IHR5cGVvZiBldmVudC5tb3pNb3ZlbWVudFkgPT09ICdudW1iZXInXG4gICAgICAgID8gZXZlbnQubW96TW92ZW1lbnRZIDogdHlwZW9mIGV2ZW50LmdldE1vdmVtZW50WSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgID8gZXZlbnQuZ2V0TW92ZW1lbnRZKCkgOiAwO1xuXG4gICAgeWF3T2JqZWN0LnJvdGF0aW9uLnkgLT0gbW92ZW1lbnRYICogMC4wMDI7XG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCAtPSBtb3ZlbWVudFkgKiAwLjAwMjtcblxuICAgIHBpdGNoT2JqZWN0LnJvdGF0aW9uLnggPSBNYXRoLm1heCgtUElfMiwgTWF0aC5taW4oUElfMiwgcGl0Y2hPYmplY3Qucm90YXRpb24ueCkpO1xuICB9O1xuXG4gIGNvbnN0IHBoeXNpY3MgPSBwbGF5ZXIudXNlKCdwaHlzaWNzJyk7XG5cbiAgY29uc3Qgb25LZXlEb3duID0gZXZlbnQgPT4ge1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgbW92ZUZvcndhcmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICBtb3ZlTGVmdCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBzXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICBtb3ZlUmlnaHQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzMjogLy8gc3BhY2VcbiAgICAgICAgY29uc29sZS5sb2coY2FuSnVtcCk7XG4gICAgICAgIGlmIChjYW5KdW1wID09PSB0cnVlKSBwaHlzaWNzLmFwcGx5Q2VudHJhbEltcHVsc2Uoe3g6IDAsIHk6IDMwMCwgejogMH0pO1xuICAgICAgICBjYW5KdW1wID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuNTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IG9uS2V5VXAgPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICBtb3ZlTGVmdCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgY2FzZSA4MzogLy8gYVxuICAgICAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNjogLy8gc2hpZnRcbiAgICAgICAgcnVuVmVsb2NpdHkgPSAwLjI1O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24sIGZhbHNlKTtcbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIG9uS2V5VXAsIGZhbHNlKTtcblxuICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgdGhpcy5nZXRPYmplY3QgPSAoKSA9PiB5YXdPYmplY3Q7XG5cbiAgdGhpcy5nZXREaXJlY3Rpb24gPSB0YXJnZXRWZWMgPT4ge1xuICAgIHRhcmdldFZlYy5zZXQoMCwgMCwgLTEpO1xuICAgIHF1YXQubXVsdGlwbHlWZWN0b3IzKHRhcmdldFZlYyk7XG4gIH07XG5cbiAgLy8gTW92ZXMgdGhlIGNhbWVyYSB0byB0aGUgUGh5c2kuanMgb2JqZWN0IHBvc2l0aW9uXG4gIC8vIGFuZCBhZGRzIHZlbG9jaXR5IHRvIHRoZSBvYmplY3QgaWYgdGhlIHJ1biBrZXkgaXMgZG93bi5cbiAgY29uc3QgaW5wdXRWZWxvY2l0eSA9IG5ldyBWZWN0b3IzKCksXG4gICAgZXVsZXIgPSBuZXcgRXVsZXIoKTtcblxuICB0aGlzLnVwZGF0ZSA9IGRlbHRhID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgZGVsdGEgPSBkZWx0YSB8fCAwLjU7XG4gICAgZGVsdGEgPSBNYXRoLm1pbihkZWx0YSwgMC41LCBkZWx0YSk7XG5cbiAgICBpbnB1dFZlbG9jaXR5LnNldCgwLCAwLCAwKTtcblxuICAgIGNvbnN0IHNwZWVkID0gdmVsb2NpdHlGYWN0b3IgKiBkZWx0YSAqIHBhcmFtcy5zcGVlZCAqIHJ1blZlbG9jaXR5O1xuXG4gICAgaWYgKG1vdmVGb3J3YXJkKSBpbnB1dFZlbG9jaXR5LnogPSAtc3BlZWQ7XG4gICAgaWYgKG1vdmVCYWNrd2FyZCkgaW5wdXRWZWxvY2l0eS56ID0gc3BlZWQ7XG4gICAgaWYgKG1vdmVMZWZ0KSBpbnB1dFZlbG9jaXR5LnggPSAtc3BlZWQ7XG4gICAgaWYgKG1vdmVSaWdodCkgaW5wdXRWZWxvY2l0eS54ID0gc3BlZWQ7XG5cbiAgICAvLyBDb252ZXJ0IHZlbG9jaXR5IHRvIHdvcmxkIGNvb3JkaW5hdGVzXG4gICAgZXVsZXIueCA9IHBpdGNoT2JqZWN0LnJvdGF0aW9uLng7XG4gICAgZXVsZXIueSA9IHlhd09iamVjdC5yb3RhdGlvbi55O1xuICAgIGV1bGVyLm9yZGVyID0gJ1hZWic7XG5cbiAgICBxdWF0LnNldEZyb21FdWxlcihldWxlcik7XG5cbiAgICBpbnB1dFZlbG9jaXR5LmFwcGx5UXVhdGVybmlvbihxdWF0KTtcblxuICAgIHBoeXNpY3MuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogaW5wdXRWZWxvY2l0eS54LCB5OiAwLCB6OiBpbnB1dFZlbG9jaXR5Lnp9KTtcbiAgICBwaHlzaWNzLnNldEFuZ3VsYXJWZWxvY2l0eSh7eDogaW5wdXRWZWxvY2l0eS56LCB5OiAwLCB6OiAtaW5wdXRWZWxvY2l0eS54fSk7XG4gICAgcGh5c2ljcy5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIH07XG5cbiAgcGxheWVyLm9uKCdwaHlzaWNzOmFkZGVkJywgKCkgPT4ge1xuICAgIHBsYXllci5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuYWRkRXZlbnRMaXN0ZW5lcigndXBkYXRlJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgIHlhd09iamVjdC5wb3NpdGlvbi5jb3B5KHBsYXllci5wb3NpdGlvbik7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgRmlyc3RQZXJzb25Nb2R1bGUge1xuICBzdGF0aWMgZGVmYXVsdHMgPSB7XG4gICAgYmxvY2s6IG51bGwsXG4gICAgc3BlZWQ6IDEsXG4gICAgeXBvczogMVxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKG9iamVjdCwgcGFyYW1zID0ge30pIHtcbiAgICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcblxuICAgIGlmICghdGhpcy5wYXJhbXMuYmxvY2spIHtcbiAgICAgIHRoaXMucGFyYW1zLmJsb2NrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jsb2NrZXInKTtcbiAgICB9XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICB0aGlzLmNvbnRyb2xzID0gbmV3IEZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIobWFuYWdlci5nZXQoJ2NhbWVyYScpLCB0aGlzLm9iamVjdCwgdGhpcy5wYXJhbXMpO1xuXG4gICAgaWYgKCdwb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnbW96UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudFxuICAgICAgfHwgJ3dlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuXG4gICAgICBjb25zdCBwb2ludGVybG9ja2NoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKGRvY3VtZW50LnBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgIHx8IGRvY3VtZW50Lm1velBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgIHx8IGRvY3VtZW50LndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5wYXJhbXMuYmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnRyb2xzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuXG4gICAgICBjb25zdCBwb2ludGVybG9ja2Vycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1BvaW50ZXIgbG9jayBlcnJvci4nKTtcbiAgICAgIH07XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcblxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jayA9IGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RQb2ludGVyTG9jaztcblxuICAgICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuID0gZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxzY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbjtcblxuICAgICAgICBpZiAoL0ZpcmVmb3gvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgY29uc3QgZnVsbHNjcmVlbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICB8fCBkb2N1bWVudC5tb3pGdWxsc2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICB8fCBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSk7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcblxuICAgICAgICAgICAgICBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSwgZmFsc2UpO1xuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgICAgIH0gZWxzZSBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jaygpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGNvbnNvbGUud2FybignWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdGhlIFBvaW50ZXJMb2NrJyk7XG5cbiAgICBtYW5hZ2VyLmdldCgnc2NlbmUnKS5hZGQodGhpcy5jb250cm9scy5nZXRPYmplY3QoKSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHVwZGF0ZVByb2Nlc3NvciA9IGMgPT4ge1xuICAgICAgc2VsZi5jb250cm9scy51cGRhdGUoYy5nZXREZWx0YSgpKTtcbiAgICB9O1xuXG4gICAgc2VsZi51cGRhdGVMb29wID0gbmV3IExvb3AodXBkYXRlUHJvY2Vzc29yKS5zdGFydCh0aGlzKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIk1FU1NBR0VfVFlQRVMiLCJSRVBPUlRfSVRFTVNJWkUiLCJDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUiLCJWRUhJQ0xFUkVQT1JUX0lURU1TSVpFIiwiQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSIsInRlbXAxVmVjdG9yMyIsIlZlY3RvcjMiLCJ0ZW1wMlZlY3RvcjMiLCJ0ZW1wMU1hdHJpeDQiLCJNYXRyaXg0IiwidGVtcDFRdWF0IiwiUXVhdGVybmlvbiIsImdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24iLCJ4IiwieSIsInoiLCJ3IiwiTWF0aCIsImF0YW4yIiwiYXNpbiIsImdldFF1YXRlcnRpb25Gcm9tRXVsZXIiLCJjMSIsImNvcyIsInMxIiwic2luIiwiYzIiLCJzMiIsImMzIiwiczMiLCJjMWMyIiwiczFzMiIsImNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QiLCJwb3NpdGlvbiIsIm9iamVjdCIsImlkZW50aXR5IiwibWFrZVJvdGF0aW9uRnJvbVF1YXRlcm5pb24iLCJxdWF0ZXJuaW9uIiwiZ2V0SW52ZXJzZSIsImNvcHkiLCJzdWIiLCJhcHBseU1hdHJpeDQiLCJhZGRPYmplY3RDaGlsZHJlbiIsInBhcmVudCIsImkiLCJjaGlsZHJlbiIsImxlbmd0aCIsImNoaWxkIiwicGh5c2ljcyIsImNvbXBvbmVudCIsInVzZSIsImRhdGEiLCJ1cGRhdGVNYXRyaXgiLCJ1cGRhdGVNYXRyaXhXb3JsZCIsInNldEZyb21NYXRyaXhQb3NpdGlvbiIsIm1hdHJpeFdvcmxkIiwic2V0RnJvbVJvdGF0aW9uTWF0cml4IiwicG9zaXRpb25fb2Zmc2V0Iiwicm90YXRpb24iLCJwdXNoIiwiRXZlbnRhYmxlIiwiX2V2ZW50TGlzdGVuZXJzIiwiZXZlbnRfbmFtZSIsImNhbGxiYWNrIiwiaGFzT3duUHJvcGVydHkiLCJpbmRleCIsImluZGV4T2YiLCJzcGxpY2UiLCJwYXJhbWV0ZXJzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJvYmoiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImRpc3BhdGNoRXZlbnQiLCJDb25lVHdpc3RDb25zdHJhaW50Iiwib2JqYSIsIm9iamIiLCJvYmplY3RhIiwib2JqZWN0YiIsInVuZGVmaW5lZCIsImNvbnNvbGUiLCJlcnJvciIsInR5cGUiLCJhcHBsaWVkSW1wdWxzZSIsIndvcmxkTW9kdWxlIiwiaWQiLCJwb3NpdGlvbmEiLCJjbG9uZSIsInBvc2l0aW9uYiIsImF4aXNhIiwiYXhpc2IiLCJleGVjdXRlIiwiY29uc3RyYWludCIsIm1heF9pbXB1bHNlIiwidGFyZ2V0IiwiVEhSRUUiLCJzZXRGcm9tRXVsZXIiLCJFdWxlciIsIkhpbmdlQ29uc3RyYWludCIsImF4aXMiLCJsb3ciLCJoaWdoIiwiYmlhc19mYWN0b3IiLCJyZWxheGF0aW9uX2ZhY3RvciIsInZlbG9jaXR5IiwiYWNjZWxlcmF0aW9uIiwiUG9pbnRDb25zdHJhaW50IiwiU2xpZGVyQ29uc3RyYWludCIsImxpbl9sb3dlciIsImxpbl91cHBlciIsImFuZ19sb3dlciIsImFuZ191cHBlciIsImxpbmVhciIsImFuZ3VsYXIiLCJzY2VuZSIsIkRPRkNvbnN0cmFpbnQiLCJsaW1pdCIsIndoaWNoIiwibG93X2FuZ2xlIiwiaGlnaF9hbmdsZSIsIm1heF9mb3JjZSIsIlZlaGljbGUiLCJtZXNoIiwidHVuaW5nIiwiVmVoaWNsZVR1bmluZyIsIndoZWVscyIsIl9waHlzaWpzIiwiZ2V0T2JqZWN0SWQiLCJzdXNwZW5zaW9uX3N0aWZmbmVzcyIsInN1c3BlbnNpb25fY29tcHJlc3Npb24iLCJzdXNwZW5zaW9uX2RhbXBpbmciLCJtYXhfc3VzcGVuc2lvbl90cmF2ZWwiLCJmcmljdGlvbl9zbGlwIiwibWF4X3N1c3BlbnNpb25fZm9yY2UiLCJ3aGVlbF9nZW9tZXRyeSIsIndoZWVsX21hdGVyaWFsIiwiY29ubmVjdGlvbl9wb2ludCIsIndoZWVsX2RpcmVjdGlvbiIsIndoZWVsX2F4bGUiLCJzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoIiwid2hlZWxfcmFkaXVzIiwiaXNfZnJvbnRfd2hlZWwiLCJ3aGVlbCIsIk1lc2giLCJjYXN0U2hhZG93IiwicmVjZWl2ZVNoYWRvdyIsIm11bHRpcGx5U2NhbGFyIiwiYWRkIiwid29ybGQiLCJhbW91bnQiLCJzdGVlcmluZyIsImJyYWtlIiwiZm9yY2UiLCJUQVJHRVQiLCJTeW1ib2wiLCJTQ1JJUFRfVFlQRSIsIkJsb2JCdWlsZGVyIiwid2luZG93IiwiV2ViS2l0QmxvYkJ1aWxkZXIiLCJNb3pCbG9iQnVpbGRlciIsIk1TQmxvYkJ1aWxkZXIiLCJVUkwiLCJ3ZWJraXRVUkwiLCJXb3JrZXIiLCJzaGltV29ya2VyIiwiZmlsZW5hbWUiLCJmbiIsIlNoaW1Xb3JrZXIiLCJmb3JjZUZhbGxiYWNrIiwibyIsInNvdXJjZSIsInRvU3RyaW5nIiwicmVwbGFjZSIsInNsaWNlIiwib2JqVVJMIiwiY3JlYXRlU291cmNlT2JqZWN0IiwicmV2b2tlT2JqZWN0VVJMIiwic2VsZlNoaW0iLCJtIiwib25tZXNzYWdlIiwicG9zdE1lc3NhZ2UiLCJpc1RoaXNUaHJlYWQiLCJ0ZXN0V29ya2VyIiwidGVzdEFycmF5IiwiVWludDhBcnJheSIsInRlc3QiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJFcnJvciIsImJ1ZmZlciIsImUiLCJ0ZXJtaW5hdGUiLCJzdHIiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwiYmxvYiIsImFwcGVuZCIsImdldEJsb2IiLCJkb2N1bWVudCIsInNlbGYiLCJ0cmFuc2ZlcmFibGVNZXNzYWdlIiwid2Via2l0UG9zdE1lc3NhZ2UiLCJfb2JqZWN0IiwiX3ZlY3RvciIsIl90cmFuc2Zvcm0iLCJfdHJhbnNmb3JtX3BvcyIsIl9zb2Z0Ym9keV9lbmFibGVkIiwibGFzdF9zaW11bGF0aW9uX2R1cmF0aW9uIiwiX251bV9vYmplY3RzIiwiX251bV9yaWdpZGJvZHlfb2JqZWN0cyIsIl9udW1fc29mdGJvZHlfb2JqZWN0cyIsIl9udW1fd2hlZWxzIiwiX251bV9jb25zdHJhaW50cyIsIl9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSIsIl92ZWMzXzEiLCJfdmVjM18yIiwiX3ZlYzNfMyIsIl9xdWF0IiwicHVibGljX2Z1bmN0aW9ucyIsIl9vYmplY3RzIiwiX3ZlaGljbGVzIiwiX2NvbnN0cmFpbnRzIiwiX29iamVjdHNfYW1tbyIsIl9vYmplY3Rfc2hhcGVzIiwiUkVQT1JUX0NIVU5LU0laRSIsInNvZnRyZXBvcnQiLCJjb2xsaXNpb25yZXBvcnQiLCJ2ZWhpY2xlcmVwb3J0IiwiY29uc3RyYWludHJlcG9ydCIsIldPUkxEUkVQT1JUX0lURU1TSVpFIiwiYWIiLCJBcnJheUJ1ZmZlciIsIlNVUFBPUlRfVFJBTlNGRVJBQkxFIiwiYnl0ZUxlbmd0aCIsImdldFNoYXBlRnJvbUNhY2hlIiwiY2FjaGVfa2V5Iiwic2V0U2hhcGVDYWNoZSIsInNoYXBlIiwiY3JlYXRlU2hhcGUiLCJkZXNjcmlwdGlvbiIsInNldElkZW50aXR5IiwiQW1tbyIsImJ0Q29tcG91bmRTaGFwZSIsIm5vcm1hbCIsInNldFgiLCJzZXRZIiwic2V0WiIsImJ0U3RhdGljUGxhbmVTaGFwZSIsIndpZHRoIiwiaGVpZ2h0IiwiZGVwdGgiLCJidEJveFNoYXBlIiwicmFkaXVzIiwiYnRTcGhlcmVTaGFwZSIsImJ0Q3lsaW5kZXJTaGFwZSIsImJ0Q2Fwc3VsZVNoYXBlIiwiYnRDb25lU2hhcGUiLCJ0cmlhbmdsZV9tZXNoIiwiYnRUcmlhbmdsZU1lc2giLCJhZGRUcmlhbmdsZSIsImJ0QnZoVHJpYW5nbGVNZXNoU2hhcGUiLCJidENvbnZleEh1bGxTaGFwZSIsImFkZFBvaW50IiwieHB0cyIsInlwdHMiLCJwb2ludHMiLCJwdHIiLCJfbWFsbG9jIiwicCIsInAyIiwiaiIsIkhFQVBGMzIiLCJidEhlaWdodGZpZWxkVGVycmFpblNoYXBlIiwiYWJzTWF4SGVpZ2h0IiwiY3JlYXRlU29mdEJvZHkiLCJib2R5Iiwic29mdEJvZHlIZWxwZXJzIiwiYnRTb2Z0Qm9keUhlbHBlcnMiLCJhVmVydGljZXMiLCJDcmVhdGVGcm9tVHJpTWVzaCIsImdldFdvcmxkSW5mbyIsImFJbmRpY2VzIiwiY3IiLCJjb3JuZXJzIiwiQ3JlYXRlUGF0Y2giLCJidFZlY3RvcjMiLCJzZWdtZW50cyIsIkNyZWF0ZVJvcGUiLCJpbml0IiwicGFyYW1zIiwid2FzbUJ1ZmZlciIsImFtbW8iLCJsb2FkQW1tb0Zyb21CaW5hcnkiLCJjbWQiLCJtYWtlV29ybGQiLCJidFRyYW5zZm9ybSIsImJ0UXVhdGVybmlvbiIsInJlcG9ydHNpemUiLCJGbG9hdDMyQXJyYXkiLCJXT1JMRFJFUE9SVCIsIkNPTExJU0lPTlJFUE9SVCIsIlZFSElDTEVSRVBPUlQiLCJDT05TVFJBSU5UUkVQT1JUIiwiY29sbGlzaW9uQ29uZmlndXJhdGlvbiIsInNvZnRib2R5IiwiYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJidERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uIiwiZGlzcGF0Y2hlciIsImJ0Q29sbGlzaW9uRGlzcGF0Y2hlciIsInNvbHZlciIsImJ0U2VxdWVudGlhbEltcHVsc2VDb25zdHJhaW50U29sdmVyIiwiYnJvYWRwaGFzZSIsImFhYmJtaW4iLCJhYWJibWF4IiwiYnRBeGlzU3dlZXAzIiwiYnREYnZ0QnJvYWRwaGFzZSIsImJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZCIsImJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyIiwiYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQiLCJmaXhlZFRpbWVTdGVwIiwic2V0Rml4ZWRUaW1lU3RlcCIsInNldEdyYXZpdHkiLCJhcHBlbmRBbmNob3IiLCJsb2ciLCJub2RlIiwib2JqMiIsImNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMiLCJpbmZsdWVuY2UiLCJhZGRPYmplY3QiLCJtb3Rpb25TdGF0ZSIsInNiQ29uZmlnIiwiZ2V0X21fY2ZnIiwidml0ZXJhdGlvbnMiLCJzZXRfdml0ZXJhdGlvbnMiLCJwaXRlcmF0aW9ucyIsInNldF9waXRlcmF0aW9ucyIsImRpdGVyYXRpb25zIiwic2V0X2RpdGVyYXRpb25zIiwiY2l0ZXJhdGlvbnMiLCJzZXRfY2l0ZXJhdGlvbnMiLCJzZXRfY29sbGlzaW9ucyIsInNldF9rREYiLCJmcmljdGlvbiIsInNldF9rRFAiLCJkYW1waW5nIiwicHJlc3N1cmUiLCJzZXRfa1BSIiwiZHJhZyIsInNldF9rREciLCJsaWZ0Iiwic2V0X2tMRiIsImFuY2hvckhhcmRuZXNzIiwic2V0X2tBSFIiLCJyaWdpZEhhcmRuZXNzIiwic2V0X2tDSFIiLCJrbHN0IiwiZ2V0X21fbWF0ZXJpYWxzIiwiYXQiLCJzZXRfbV9rTFNUIiwia2FzdCIsInNldF9tX2tBU1QiLCJrdnN0Iiwic2V0X21fa1ZTVCIsImNhc3RPYmplY3QiLCJidENvbGxpc2lvbk9iamVjdCIsImdldENvbGxpc2lvblNoYXBlIiwic2V0TWFyZ2luIiwibWFyZ2luIiwic2V0QWN0aXZhdGlvblN0YXRlIiwic3RhdGUiLCJyb3BlIiwiY2xvdGgiLCJzZXRPcmlnaW4iLCJzZXRXIiwic2V0Um90YXRpb24iLCJ0cmFuc2Zvcm0iLCJzY2FsZSIsInNldFRvdGFsTWFzcyIsIm1hc3MiLCJhZGRTb2Z0Qm9keSIsImdldF9tX2ZhY2VzIiwic2l6ZSIsImdldF9tX25vZGVzIiwiY29tcG91bmRfc2hhcGUiLCJhZGRDaGlsZFNoYXBlIiwiX2NoaWxkIiwidHJhbnMiLCJkZXN0cm95Iiwic2V0TG9jYWxTY2FsaW5nIiwiY2FsY3VsYXRlTG9jYWxJbmVydGlhIiwiYnREZWZhdWx0TW90aW9uU3RhdGUiLCJyYkluZm8iLCJidFJpZ2lkQm9keUNvbnN0cnVjdGlvbkluZm8iLCJzZXRfbV9mcmljdGlvbiIsInNldF9tX3Jlc3RpdHV0aW9uIiwicmVzdGl0dXRpb24iLCJzZXRfbV9saW5lYXJEYW1waW5nIiwic2V0X21fYW5ndWxhckRhbXBpbmciLCJidFJpZ2lkQm9keSIsImNvbGxpc2lvbl9mbGFncyIsInNldENvbGxpc2lvbkZsYWdzIiwiZ3JvdXAiLCJtYXNrIiwiYWRkUmlnaWRCb2R5IiwiYWN0aXZhdGUiLCJhIiwiYWRkVmVoaWNsZSIsInZlaGljbGVfdHVuaW5nIiwiYnRWZWhpY2xlVHVuaW5nIiwic2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyIsInNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbiIsInNldF9tX3N1c3BlbnNpb25EYW1waW5nIiwic2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtIiwic2V0X21fbWF4U3VzcGVuc2lvbkZvcmNlIiwidmVoaWNsZSIsImJ0UmF5Y2FzdFZlaGljbGUiLCJyaWdpZEJvZHkiLCJidERlZmF1bHRWZWhpY2xlUmF5Y2FzdGVyIiwic2V0Q29vcmRpbmF0ZVN5c3RlbSIsInJlbW92ZVZlaGljbGUiLCJhZGRXaGVlbCIsInNldFN0ZWVyaW5nIiwiZGV0YWlscyIsInNldFN0ZWVyaW5nVmFsdWUiLCJzZXRCcmFrZSIsImFwcGx5RW5naW5lRm9yY2UiLCJyZW1vdmVPYmplY3QiLCJyZW1vdmVTb2Z0Qm9keSIsInJlbW92ZVJpZ2lkQm9keSIsIl9tb3Rpb25fc3RhdGVzIiwiX2NvbXBvdW5kX3NoYXBlcyIsIl9ub25jYWNoZWRfc2hhcGVzIiwidXBkYXRlVHJhbnNmb3JtIiwiZ2V0TW90aW9uU3RhdGUiLCJnZXRXb3JsZFRyYW5zZm9ybSIsInBvcyIsInF1YXQiLCJzZXRXb3JsZFRyYW5zZm9ybSIsInVwZGF0ZU1hc3MiLCJzZXRNYXNzUHJvcHMiLCJhcHBseUNlbnRyYWxJbXB1bHNlIiwiYXBwbHlJbXB1bHNlIiwiaW1wdWxzZV94IiwiaW1wdWxzZV95IiwiaW1wdWxzZV96IiwiYXBwbHlUb3JxdWUiLCJ0b3JxdWVfeCIsInRvcnF1ZV95IiwidG9ycXVlX3oiLCJhcHBseUNlbnRyYWxGb3JjZSIsImFwcGx5Rm9yY2UiLCJmb3JjZV94IiwiZm9yY2VfeSIsImZvcmNlX3oiLCJvblNpbXVsYXRpb25SZXN1bWUiLCJEYXRlIiwibm93Iiwic2V0QW5ndWxhclZlbG9jaXR5Iiwic2V0TGluZWFyVmVsb2NpdHkiLCJzZXRBbmd1bGFyRmFjdG9yIiwic2V0TGluZWFyRmFjdG9yIiwic2V0RGFtcGluZyIsInNldENjZE1vdGlvblRocmVzaG9sZCIsInRocmVzaG9sZCIsInNldENjZFN3ZXB0U3BoZXJlUmFkaXVzIiwiYWRkQ29uc3RyYWludCIsImJ0UG9pbnQyUG9pbnRDb25zdHJhaW50IiwiYnRIaW5nZUNvbnN0cmFpbnQiLCJ0cmFuc2Zvcm1iIiwidHJhbnNmb3JtYSIsImdldFJvdGF0aW9uIiwic2V0RXVsZXIiLCJidFNsaWRlckNvbnN0cmFpbnQiLCJ0YSIsInRiIiwic2V0RXVsZXJaWVgiLCJidENvbmVUd2lzdENvbnN0cmFpbnQiLCJzZXRMaW1pdCIsIlBJIiwiYnRHZW5lcmljNkRvZkNvbnN0cmFpbnQiLCJiIiwiZW5hYmxlRmVlZGJhY2siLCJyZW1vdmVDb25zdHJhaW50IiwiY29uc3RyYWludF9zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJ1bmRlZmluZCIsInNldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCIsInNpbXVsYXRlIiwidGltZVN0ZXAiLCJtYXhTdWJTdGVwcyIsImNlaWwiLCJzdGVwU2ltdWxhdGlvbiIsInJlcG9ydFZlaGljbGVzIiwicmVwb3J0Q29uc3RyYWludHMiLCJyZXBvcnRXb3JsZF9zb2Z0Ym9kaWVzIiwiaGluZ2Vfc2V0TGltaXRzIiwiaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yIiwiZW5hYmxlQW5ndWxhck1vdG9yIiwiaGluZ2VfZGlzYWJsZU1vdG9yIiwiZW5hYmxlTW90b3IiLCJzbGlkZXJfc2V0TGltaXRzIiwic2V0TG93ZXJMaW5MaW1pdCIsInNldFVwcGVyTGluTGltaXQiLCJzZXRMb3dlckFuZ0xpbWl0Iiwic2V0VXBwZXJBbmdMaW1pdCIsInNsaWRlcl9zZXRSZXN0aXR1dGlvbiIsInNldFNvZnRuZXNzTGltTGluIiwic2V0U29mdG5lc3NMaW1BbmciLCJzbGlkZXJfZW5hYmxlTGluZWFyTW90b3IiLCJzZXRUYXJnZXRMaW5Nb3RvclZlbG9jaXR5Iiwic2V0TWF4TGluTW90b3JGb3JjZSIsInNldFBvd2VyZWRMaW5Nb3RvciIsInNsaWRlcl9kaXNhYmxlTGluZWFyTW90b3IiLCJzbGlkZXJfZW5hYmxlQW5ndWxhck1vdG9yIiwic2V0VGFyZ2V0QW5nTW90b3JWZWxvY2l0eSIsInNldE1heEFuZ01vdG9yRm9yY2UiLCJzZXRQb3dlcmVkQW5nTW90b3IiLCJzbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvciIsImNvbmV0d2lzdF9zZXRMaW1pdCIsImNvbmV0d2lzdF9lbmFibGVNb3RvciIsImNvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UiLCJzZXRNYXhNb3RvckltcHVsc2UiLCJjb25ldHdpc3Rfc2V0TW90b3JUYXJnZXQiLCJzZXRNb3RvclRhcmdldCIsImNvbmV0d2lzdF9kaXNhYmxlTW90b3IiLCJkb2Zfc2V0TGluZWFyTG93ZXJMaW1pdCIsInNldExpbmVhckxvd2VyTGltaXQiLCJkb2Zfc2V0TGluZWFyVXBwZXJMaW1pdCIsInNldExpbmVhclVwcGVyTGltaXQiLCJkb2Zfc2V0QW5ndWxhckxvd2VyTGltaXQiLCJzZXRBbmd1bGFyTG93ZXJMaW1pdCIsImRvZl9zZXRBbmd1bGFyVXBwZXJMaW1pdCIsInNldEFuZ3VsYXJVcHBlckxpbWl0IiwiZG9mX2VuYWJsZUFuZ3VsYXJNb3RvciIsIm1vdG9yIiwiZ2V0Um90YXRpb25hbExpbWl0TW90b3IiLCJzZXRfbV9lbmFibGVNb3RvciIsImRvZl9jb25maWd1cmVBbmd1bGFyTW90b3IiLCJzZXRfbV9sb0xpbWl0Iiwic2V0X21faGlMaW1pdCIsInNldF9tX3RhcmdldFZlbG9jaXR5Iiwic2V0X21fbWF4TW90b3JGb3JjZSIsImRvZl9kaXNhYmxlQW5ndWxhck1vdG9yIiwicmVwb3J0V29ybGQiLCJ3b3JsZHJlcG9ydCIsImdldENlbnRlck9mTWFzc1RyYW5zZm9ybSIsIm9yaWdpbiIsImdldE9yaWdpbiIsIm9mZnNldCIsImdldExpbmVhclZlbG9jaXR5IiwiZ2V0QW5ndWxhclZlbG9jaXR5IiwiU09GVFJFUE9SVCIsIm9mZnNldFZlcnQiLCJub2RlcyIsInZlcnQiLCJnZXRfbV94Iiwib2ZmIiwiZ2V0X21fbiIsImZhY2VzIiwiZmFjZSIsIm5vZGUxIiwibm9kZTIiLCJub2RlMyIsInZlcnQxIiwidmVydDIiLCJ2ZXJ0MyIsIm5vcm1hbDEiLCJub3JtYWwyIiwibm9ybWFsMyIsInJlcG9ydENvbGxpc2lvbnMiLCJkcCIsImdldERpc3BhdGNoZXIiLCJudW0iLCJnZXROdW1NYW5pZm9sZHMiLCJtYW5pZm9sZCIsImdldE1hbmlmb2xkQnlJbmRleEludGVybmFsIiwibnVtX2NvbnRhY3RzIiwiZ2V0TnVtQ29udGFjdHMiLCJwdCIsImdldENvbnRhY3RQb2ludCIsImdldEJvZHkwIiwiZ2V0Qm9keTEiLCJnZXRfbV9ub3JtYWxXb3JsZE9uQiIsImdldE51bVdoZWVscyIsImdldFdoZWVsSW5mbyIsImdldF9tX3dvcmxkVHJhbnNmb3JtIiwibGVuZ2h0Iiwib2Zmc2V0X2JvZHkiLCJnZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJldmVudCIsIldvcmxkTW9kdWxlIiwiYnJpZGdlIiwiZGVmZXIiLCJvbkFkZENhbGxiYWNrIiwiYmluZCIsIm9uUmVtb3ZlQ2FsbGJhY2siLCJPYmplY3QiLCJhc3NpZ24iLCJzdGFydCIsInBlcmZvcm1hbmNlIiwid29ya2VyIiwiUGh5c2ljc1dvcmtlciIsImlzTG9hZGVkIiwibG9hZGVyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ3YXNtIiwidGhlbiIsInJlc3BvbnNlIiwiYXJyYXlCdWZmZXIiLCJfbWF0ZXJpYWxzX3JlZl9jb3VudHMiLCJfaXNfc2ltdWxhdGluZyIsIl9pZCIsIl90ZW1wIiwidXBkYXRlU2NlbmUiLCJ1cGRhdGVTb2Z0Ym9kaWVzIiwidXBkYXRlQ29sbGlzaW9ucyIsInVwZGF0ZVZlaGljbGVzIiwidXBkYXRlQ29uc3RyYWludHMiLCJkZWJ1ZyIsImRpciIsImluZm8iLCJfX2RpcnR5UG9zaXRpb24iLCJzZXQiLCJfX2RpcnR5Um90YXRpb24iLCJsaW5lYXJWZWxvY2l0eSIsImFuZ3VsYXJWZWxvY2l0eSIsImF0dHJpYnV0ZXMiLCJnZW9tZXRyeSIsInZvbHVtZVBvc2l0aW9ucyIsImFycmF5IiwiaXNTb2Z0Qm9keVJlc2V0Iiwidm9sdW1lTm9ybWFscyIsIm9mZnMiLCJ4MSIsInkxIiwiejEiLCJueDEiLCJueTEiLCJuejEiLCJ4MiIsInkyIiwiejIiLCJueDIiLCJueTIiLCJuejIiLCJ4MyIsInkzIiwiejMiLCJueDMiLCJueTMiLCJuejMiLCJpOSIsIm5lZWRzVXBkYXRlIiwibngiLCJueSIsIm56IiwiZXh0cmFjdFJvdGF0aW9uIiwibWF0cml4IiwiYWRkVmVjdG9ycyIsImNvbGxpc2lvbnMiLCJub3JtYWxfb2Zmc2V0cyIsIm9iamVjdDIiLCJpZDEiLCJ0b3VjaGVzIiwiaWQyIiwiY29tcG9uZW50MiIsImRhdGEyIiwidmVsIiwidmVsMiIsInN1YlZlY3RvcnMiLCJ0ZW1wMSIsInRlbXAyIiwibm9ybWFsX29mZnNldCIsImVtaXQiLCJzaG93X21hcmtlciIsImdldERlZmluaXRpb24iLCJtYXJrZXIiLCJTcGhlcmVHZW9tZXRyeSIsIk1lc2hOb3JtYWxNYXRlcmlhbCIsIkJveEdlb21ldHJ5IiwibmF0aXZlIiwibWFuYWdlciIsInJlbW92ZSIsInBvcCIsIm1hdGVyaWFsIiwiZnVuYyIsImFyZ3MiLCJncmF2aXR5IiwiX3N0YXRzIiwiYmVnaW4iLCJvYmplY3RfaWQiLCJ1cGRhdGUiLCJpc1NvZnRib2R5IiwiZW5kIiwic2ltdWxhdGVMb29wIiwiTG9vcCIsImNsb2NrIiwiZ2V0RGVsdGEiLCJwcm9wZXJ0aWVzIiwiX25hdGl2ZSIsInZlY3RvcjMiLCJzY29wZSIsImRlZmluZVByb3BlcnRpZXMiLCJfeCIsIl95IiwiX3oiLCJfX2Nfcm90Iiwib25DaGFuZ2UiLCJldWxlciIsInJvdCIsIndyYXBQaHlzaWNzUHJvdG90eXBlIiwia2V5IiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJvbkNvcHkiLCJzb3VyY2VQaHlzaWNzIiwibW9kdWxlcyIsIm9uV3JhcCIsIkFQSSIsImZhY3RvciIsImRlZmF1bHRzIiwiZGVmaW5lIiwiaGFzIiwibW9kdWxlIiwicmVzdWx0IiwiY29uc3RydWN0b3IiLCJyaWdpZGJvZHkiLCJCb3hNb2R1bGUiLCJQaHlzaWNzTW9kdWxlIiwidXBkYXRlRGF0YSIsImJvdW5kaW5nQm94IiwiY29tcHV0ZUJvdW5kaW5nQm94IiwibWF4IiwibWluIiwiQ29tcG91bmRNb2R1bGUiLCJDYXBzdWxlTW9kdWxlIiwiQ29uY2F2ZU1vZHVsZSIsImdlb21ldHJ5UHJvY2Vzc29yIiwiaXNCdWZmZXJHZW9tZXRyeSIsInZlcnRpY2VzIiwidkEiLCJ2QiIsInZDIiwiYyIsIkNvbmVNb2R1bGUiLCJDb252ZXhNb2R1bGUiLCJfYnVmZmVyR2VvbWV0cnkiLCJCdWZmZXJHZW9tZXRyeSIsImZyb21HZW9tZXRyeSIsIkN5bGluZGVyTW9kdWxlIiwiSGVpZ2h0ZmllbGRNb2R1bGUiLCJWZWN0b3IyIiwieGRpdiIsInlkaXYiLCJ2ZXJ0cyIsInhzaXplIiwieXNpemUiLCJzcXJ0IiwiYWJzIiwidk51bSIsInJvdW5kIiwibXVsdGlwbHkiLCJhdXRvQWxpZ24iLCJ0cmFuc2xhdGUiLCJQbGFuZU1vZHVsZSIsIlNwaGVyZU1vZHVsZSIsImJvdW5kaW5nU3BoZXJlIiwiY29tcHV0ZUJvdW5kaW5nU3BoZXJlIiwiU29mdGJvZHlNb2R1bGUiLCJpZHhHZW9tZXRyeSIsIm1lcmdlVmVydGljZXMiLCJidWZmZXJHZW9tZXRyeSIsImFkZEF0dHJpYnV0ZSIsIkJ1ZmZlckF0dHJpYnV0ZSIsImNvcHlWZWN0b3Izc0FycmF5Iiwic2V0SW5kZXgiLCJVaW50MzJBcnJheSIsIlVpbnQxNkFycmF5IiwiY29weUluZGljZXNBcnJheSIsIm8xIiwibzIiLCJDbG90aE1vZHVsZSIsImdlb21QYXJhbXMiLCJnZW9tIiwiZmFjZXNMZW5ndGgiLCJub3JtYWxzQXJyYXkiLCJpMyIsIndpZHRoU2VnbWVudHMiLCJoZWlnaHRTZWdtZW50cyIsImlkeDAwIiwiaWR4MDEiLCJpZHgxMCIsImlkeDExIiwiUm9wZU1vZHVsZSIsImJ1ZmYiLCJmcm9tQXJyYXkiLCJuIiwidjEiLCJ2MiIsIlBJXzIiLCJGaXJzdFBlcnNvbkNvbnRyb2xzU29sdmVyIiwiY2FtZXJhIiwidmVsb2NpdHlGYWN0b3IiLCJydW5WZWxvY2l0eSIsInBsYXllciIsInBpdGNoT2JqZWN0IiwiT2JqZWN0M0QiLCJ5YXdPYmplY3QiLCJ5cG9zIiwiY2FuSnVtcCIsIm1vdmVCYWNrd2FyZCIsIm1vdmVMZWZ0IiwibW92ZVJpZ2h0Iiwib24iLCJvdGhlck9iamVjdCIsInYiLCJyIiwiY29udGFjdE5vcm1hbCIsIm9uTW91c2VNb3ZlIiwiZW5hYmxlZCIsIm1vdmVtZW50WCIsIm1vek1vdmVtZW50WCIsImdldE1vdmVtZW50WCIsIm1vdmVtZW50WSIsIm1vek1vdmVtZW50WSIsImdldE1vdmVtZW50WSIsIm9uS2V5RG93biIsImtleUNvZGUiLCJvbktleVVwIiwiZ2V0T2JqZWN0IiwiZ2V0RGlyZWN0aW9uIiwibXVsdGlwbHlWZWN0b3IzIiwidGFyZ2V0VmVjIiwiaW5wdXRWZWxvY2l0eSIsImRlbHRhIiwic3BlZWQiLCJtb3ZlRm9yd2FyZCIsIm9yZGVyIiwiYXBwbHlRdWF0ZXJuaW9uIiwiRmlyc3RQZXJzb25Nb2R1bGUiLCJibG9jayIsImdldEVsZW1lbnRCeUlkIiwiY29udHJvbHMiLCJlbGVtZW50IiwicG9pbnRlcmxvY2tjaGFuZ2UiLCJwb2ludGVyTG9ja0VsZW1lbnQiLCJtb3pQb2ludGVyTG9ja0VsZW1lbnQiLCJ3ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQiLCJzdHlsZSIsImRpc3BsYXkiLCJwb2ludGVybG9ja2Vycm9yIiwid2FybiIsInF1ZXJ5U2VsZWN0b3IiLCJyZXF1ZXN0UG9pbnRlckxvY2siLCJtb3pSZXF1ZXN0UG9pbnRlckxvY2siLCJ3ZWJraXRSZXF1ZXN0UG9pbnRlckxvY2siLCJyZXF1ZXN0RnVsbHNjcmVlbiIsIm1velJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxTY3JlZW4iLCJ3ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbiIsImZ1bGxzY3JlZW5jaGFuZ2UiLCJmdWxsc2NyZWVuRWxlbWVudCIsIm1vekZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbFNjcmVlbkVsZW1lbnQiLCJ1cGRhdGVQcm9jZXNzb3IiLCJ1cGRhdGVMb29wIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBTUEsSUFBTUEsZ0JBQWdCO2VBQ1AsQ0FETzttQkFFSCxDQUZHO2lCQUdMLENBSEs7b0JBSUYsQ0FKRTtjQUtSO0NBTGQ7O0FBUUEsSUFBTUMsa0JBQWtCLEVBQXhCO0lBQ0VDLDJCQUEyQixDQUQ3QjtJQUVFQyx5QkFBeUIsQ0FGM0I7SUFHRUMsNEJBQTRCLENBSDlCOztBQUtBLElBQU1DLGVBQWUsSUFBSUMsYUFBSixFQUFyQjtJQUNFQyxlQUFlLElBQUlELGFBQUosRUFEakI7SUFFRUUsZUFBZSxJQUFJQyxhQUFKLEVBRmpCO0lBR0VDLFlBQVksSUFBSUMsZ0JBQUosRUFIZDs7QUFLQSxJQUFNQyw0QkFBNEIsU0FBNUJBLHlCQUE0QixDQUFDQyxDQUFELEVBQUlDLENBQUosRUFBT0MsQ0FBUCxFQUFVQyxDQUFWLEVBQWdCO1NBQ3pDLElBQUlWLGFBQUosQ0FDTFcsS0FBS0MsS0FBTCxDQUFXLEtBQUtMLElBQUlHLENBQUosR0FBUUYsSUFBSUMsQ0FBakIsQ0FBWCxFQUFpQ0MsSUFBSUEsQ0FBSixHQUFRSCxJQUFJQSxDQUFaLEdBQWdCQyxJQUFJQSxDQUFwQixHQUF3QkMsSUFBSUEsQ0FBN0QsQ0FESyxFQUVMRSxLQUFLRSxJQUFMLENBQVUsS0FBS04sSUFBSUUsQ0FBSixHQUFRRCxJQUFJRSxDQUFqQixDQUFWLENBRkssRUFHTEMsS0FBS0MsS0FBTCxDQUFXLEtBQUtILElBQUlDLENBQUosR0FBUUgsSUFBSUMsQ0FBakIsQ0FBWCxFQUFpQ0UsSUFBSUEsQ0FBSixH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
