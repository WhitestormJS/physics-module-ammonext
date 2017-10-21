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

var _class;
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

var _default = (_temp = _class = function (_API) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkuanMiLCIuLi9zcmMvZXZlbnRhYmxlLmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0NvbmVUd2lzdENvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvSGluZ2VDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL1BvaW50Q29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9TbGlkZXJDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0RPRkNvbnN0cmFpbnQuanMiLCIuLi9zcmMvdmVoaWNsZS92ZWhpY2xlLmpzIiwiLi4vYnVuZGxlLXdvcmtlci93b3JrZXJoZWxwZXIuanMiLCIuLi9zcmMvd29ya2VyLmpzIiwiLi4vc3JjL21vZHVsZXMvV29ybGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb3JlL1BoeXNpY3NNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Cb3hNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db21wb3VuZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NhcHN1bGVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db25jYXZlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29uZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbnZleE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0N5bGluZGVyTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvSGVpZ2h0ZmllbGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9QbGFuZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NwaGVyZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NvZnRib2R5TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ2xvdGhNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Sb3BlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29udHJvbHMvRmlyc3RQZXJzb25Nb2R1bGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgVmVjdG9yMyxcbiAgTWF0cml4NCxcbiAgUXVhdGVybmlvblxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IE1FU1NBR0VfVFlQRVMgPSB7XG4gIFdPUkxEUkVQT1JUOiAwLFxuICBDT0xMSVNJT05SRVBPUlQ6IDEsXG4gIFZFSElDTEVSRVBPUlQ6IDIsXG4gIENPTlNUUkFJTlRSRVBPUlQ6IDMsXG4gIFNPRlRSRVBPUlQ6IDRcbn07XG5cbmNvbnN0IFJFUE9SVF9JVEVNU0laRSA9IDE0LFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgPSA1LFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFID0gOSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSA9IDY7XG5cbmNvbnN0IHRlbXAxVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAyVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAxTWF0cml4NCA9IG5ldyBNYXRyaXg0KCksXG4gIHRlbXAxUXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbmNvbnN0IGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24gPSAoeCwgeSwgeiwgdykgPT4ge1xuICByZXR1cm4gbmV3IFZlY3RvcjMoXG4gICAgTWF0aC5hdGFuMigyICogKHggKiB3IC0geSAqIHopLCAodyAqIHcgLSB4ICogeCAtIHkgKiB5ICsgeiAqIHopKSxcbiAgICBNYXRoLmFzaW4oMiAqICh4ICogeiArIHkgKiB3KSksXG4gICAgTWF0aC5hdGFuMigyICogKHogKiB3IC0geCAqIHkpLCAodyAqIHcgKyB4ICogeCAtIHkgKiB5IC0geiAqIHopKVxuICApO1xufTtcblxuY29uc3QgZ2V0UXVhdGVydGlvbkZyb21FdWxlciA9ICh4LCB5LCB6KSA9PiB7XG4gIGNvbnN0IGMxID0gTWF0aC5jb3MoeSk7XG4gIGNvbnN0IHMxID0gTWF0aC5zaW4oeSk7XG4gIGNvbnN0IGMyID0gTWF0aC5jb3MoLXopO1xuICBjb25zdCBzMiA9IE1hdGguc2luKC16KTtcbiAgY29uc3QgYzMgPSBNYXRoLmNvcyh4KTtcbiAgY29uc3QgczMgPSBNYXRoLnNpbih4KTtcbiAgY29uc3QgYzFjMiA9IGMxICogYzI7XG4gIGNvbnN0IHMxczIgPSBzMSAqIHMyO1xuXG4gIHJldHVybiB7XG4gICAgdzogYzFjMiAqIGMzIC0gczFzMiAqIHMzLFxuICAgIHg6IGMxYzIgKiBzMyArIHMxczIgKiBjMyxcbiAgICB5OiBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczMsXG4gICAgejogYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzXG4gIH07XG59O1xuXG5jb25zdCBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0ID0gKHBvc2l0aW9uLCBvYmplY3QpID0+IHtcbiAgdGVtcDFNYXRyaXg0LmlkZW50aXR5KCk7IC8vIHJlc2V0IHRlbXAgbWF0cml4XG5cbiAgLy8gU2V0IHRoZSB0ZW1wIG1hdHJpeCdzIHJvdGF0aW9uIHRvIHRoZSBvYmplY3QncyByb3RhdGlvblxuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKS5tYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihvYmplY3QucXVhdGVybmlvbik7XG5cbiAgLy8gSW52ZXJ0IHJvdGF0aW9uIG1hdHJpeCBpbiBvcmRlciB0byBcInVucm90YXRlXCIgYSBwb2ludCBiYWNrIHRvIG9iamVjdCBzcGFjZVxuICB0ZW1wMU1hdHJpeDQuZ2V0SW52ZXJzZSh0ZW1wMU1hdHJpeDQpO1xuXG4gIC8vIFlheSEgVGVtcCB2YXJzIVxuICB0ZW1wMVZlY3RvcjMuY29weShwb3NpdGlvbik7XG4gIHRlbXAyVmVjdG9yMy5jb3B5KG9iamVjdC5wb3NpdGlvbik7XG5cbiAgLy8gQXBwbHkgdGhlIHJvdGF0aW9uXG4gIHJldHVybiB0ZW1wMVZlY3RvcjMuc3ViKHRlbXAyVmVjdG9yMykuYXBwbHlNYXRyaXg0KHRlbXAxTWF0cml4NCk7XG59O1xuXG5jb25zdCBhZGRPYmplY3RDaGlsZHJlbiA9IGZ1bmN0aW9uIChwYXJlbnQsIG9iamVjdCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG9iamVjdC5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkID0gb2JqZWN0LmNoaWxkcmVuW2ldO1xuICAgIGNvbnN0IHBoeXNpY3MgPSBjaGlsZC5jb21wb25lbnQgPyBjaGlsZC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykgOiBmYWxzZTtcblxuICAgIGlmIChwaHlzaWNzKSB7XG4gICAgICBjb25zdCBkYXRhID0gcGh5c2ljcy5kYXRhO1xuXG4gICAgICBjaGlsZC51cGRhdGVNYXRyaXgoKTtcbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG5cbiAgICAgIHRlbXAxVmVjdG9yMy5zZXRGcm9tTWF0cml4UG9zaXRpb24oY2hpbGQubWF0cml4V29ybGQpO1xuICAgICAgdGVtcDFRdWF0LnNldEZyb21Sb3RhdGlvbk1hdHJpeChjaGlsZC5tYXRyaXhXb3JsZCk7XG5cbiAgICAgIGRhdGEucG9zaXRpb25fb2Zmc2V0ID0ge1xuICAgICAgICB4OiB0ZW1wMVZlY3RvcjMueCxcbiAgICAgICAgeTogdGVtcDFWZWN0b3IzLnksXG4gICAgICAgIHo6IHRlbXAxVmVjdG9yMy56XG4gICAgICB9O1xuXG4gICAgICBkYXRhLnJvdGF0aW9uID0ge1xuICAgICAgICB4OiB0ZW1wMVF1YXQueCxcbiAgICAgICAgeTogdGVtcDFRdWF0LnksXG4gICAgICAgIHo6IHRlbXAxUXVhdC56LFxuICAgICAgICB3OiB0ZW1wMVF1YXQud1xuICAgICAgfTtcblxuICAgICAgcGFyZW50LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhLmNoaWxkcmVuLnB1c2goZGF0YSk7XG4gICAgfVxuXG4gICAgYWRkT2JqZWN0Q2hpbGRyZW4ocGFyZW50LCBjaGlsZCk7XG4gIH1cbn07XG5cbmV4cG9ydCB7XG4gIGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24sXG4gIGdldFF1YXRlcnRpb25Gcm9tRXVsZXIsXG4gIGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QsXG4gIGFkZE9iamVjdENoaWxkcmVuLFxuXG4gIE1FU1NBR0VfVFlQRVMsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFLFxuXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDJWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIHRlbXAxUXVhdFxufTtcbiIsImV4cG9ydCBjbGFzcyBFdmVudGFibGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9ldmVudExpc3RlbmVycyA9IHt9O1xuICB9XG5cbiAgYWRkRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICghdGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpXG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXSA9IFtdO1xuXG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50X25hbWUsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGluZGV4O1xuXG4gICAgaWYgKCF0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKChpbmRleCA9IHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLmluZGV4T2YoY2FsbGJhY2spKSA+PSAwKSB7XG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZGlzcGF0Y2hFdmVudChldmVudF9uYW1lKSB7XG4gICAgbGV0IGk7XG4gICAgY29uc3QgcGFyYW1ldGVycyA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgaWYgKHRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdW2ldLmFwcGx5KHRoaXMsIHBhcmFtZXRlcnMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBtYWtlKG9iaikge1xuICAgIG9iai5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IEV2ZW50YWJsZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcbiAgICBvYmoucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBFdmVudGFibGUucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG4gICAgb2JqLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gRXZlbnRhYmxlLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBDb25lVHdpc3RDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBjb25zdCBvYmplY3RiID0gb2JqYTtcblxuICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKSBjb25zb2xlLmVycm9yKCdCb3RoIG9iamVjdHMgbXVzdCBiZSBkZWZpbmVkIGluIGEgQ29uZVR3aXN0Q29uc3RyYWludC4nKTtcblxuICAgIHRoaXMudHlwZSA9ICdjb25ldHdpc3QnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXNhID0ge3g6IG9iamVjdGEucm90YXRpb24ueCwgeTogb2JqZWN0YS5yb3RhdGlvbi55LCB6OiBvYmplY3RhLnJvdGF0aW9uLnp9O1xuICAgIHRoaXMuYXhpc2IgPSB7eDogb2JqZWN0Yi5yb3RhdGlvbi54LCB5OiBvYmplY3RiLnJvdGF0aW9uLnksIHo6IG9iamVjdGIucm90YXRpb24uen07XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpc2E6IHRoaXMuYXhpc2EsXG4gICAgICBheGlzYjogdGhpcy5heGlzYlxuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdCh4LCB5LCB6KSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TGltaXQnLCB7Y29uc3RyYWludDogdGhpcy5pZCwgeCwgeSwgen0pO1xuICB9XG5cbiAgZW5hYmxlTW90b3IoKSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3RfZW5hYmxlTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG5cbiAgc2V0TWF4TW90b3JJbXB1bHNlKG1heF9pbXB1bHNlKSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlJywge2NvbnN0cmFpbnQ6IHRoaXMuaWQsIG1heF9pbXB1bHNlfSk7XG4gIH1cblxuICBzZXRNb3RvclRhcmdldCh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuVmVjdG9yMylcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKG5ldyBUSFJFRS5FdWxlcih0YXJnZXQueCwgdGFyZ2V0LnksIHRhcmdldC56KSk7XG4gICAgZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuRXVsZXIpXG4gICAgICB0YXJnZXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcih0YXJnZXQpO1xuICAgIGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFRIUkVFLk1hdHJpeDQpXG4gICAgICB0YXJnZXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Sb3RhdGlvbk1hdHJpeCh0YXJnZXQpO1xuXG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TW90b3JUYXJnZXQnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgeDogdGFyZ2V0LngsXG4gICAgICB5OiB0YXJnZXQueSxcbiAgICAgIHo6IHRhcmdldC56LFxuICAgICAgdzogdGFyZ2V0LndcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgSGluZ2VDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24sIGF4aXMpIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoYXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBheGlzID0gcG9zaXRpb247XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdoaW5nZSc7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24uY2xvbmUoKTtcbiAgICB0aGlzLmF4aXMgPSBheGlzO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpczogdGhpcy5heGlzXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0cyhsb3csIGhpZ2gsIGJpYXNfZmFjdG9yLCByZWxheGF0aW9uX2ZhY3Rvcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX3NldExpbWl0cycsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICBsb3csXG4gICAgICBoaWdoLFxuICAgICAgYmlhc19mYWN0b3IsXG4gICAgICByZWxheGF0aW9uX2ZhY3RvclxuICAgIH0pO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yKHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdoaW5nZV9lbmFibGVBbmd1bGFyTW90b3InLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgdmVsb2NpdHksXG4gICAgICBhY2NlbGVyYXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdoaW5nZV9kaXNhYmxlTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBQb2ludENvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdwb2ludCc7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYlxuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIFNsaWRlckNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbiwgYXhpcykge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChheGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF4aXMgPSBwb3NpdGlvbjtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ3NsaWRlcic7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXMgPSBheGlzO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpczogdGhpcy5heGlzXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0cyhsaW5fbG93ZXIsIGxpbl91cHBlciwgYW5nX2xvd2VyLCBhbmdfdXBwZXIpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfc2V0TGltaXRzJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIGxpbl9sb3dlcixcbiAgICAgIGxpbl91cHBlcixcbiAgICAgIGFuZ19sb3dlcixcbiAgICAgIGFuZ191cHBlclxuICAgIH0pO1xuICB9XG5cbiAgc2V0UmVzdGl0dXRpb24obGluZWFyLCBhbmd1bGFyKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZShcbiAgICAgICdzbGlkZXJfc2V0UmVzdGl0dXRpb24nLFxuICAgICAge1xuICAgICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgICBsaW5lYXIsXG4gICAgICAgIGFuZ3VsYXJcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZW5hYmxlTGluZWFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9lbmFibGVMaW5lYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZUxpbmVhck1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9kaXNhYmxlTGluZWFyTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yKHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcbiAgICB0aGlzLnNjZW5lLmV4ZWN1dGUoJ3NsaWRlcl9lbmFibGVBbmd1bGFyTW90b3InLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgdmVsb2NpdHksXG4gICAgICBhY2NlbGVyYXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVBbmd1bGFyTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBET0ZDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoIHBvc2l0aW9uID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdkb2YnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QoIHBvc2l0aW9uLCBvYmplY3RhICkuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXNhID0geyB4OiBvYmplY3RhLnJvdGF0aW9uLngsIHk6IG9iamVjdGEucm90YXRpb24ueSwgejogb2JqZWN0YS5yb3RhdGlvbi56IH07XG5cbiAgICBpZiAoIG9iamVjdGIgKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QoIHBvc2l0aW9uLCBvYmplY3RiICkuY2xvbmUoKTtcbiAgICAgIHRoaXMuYXhpc2IgPSB7IHg6IG9iamVjdGIucm90YXRpb24ueCwgeTogb2JqZWN0Yi5yb3RhdGlvbi55LCB6OiBvYmplY3RiLnJvdGF0aW9uLnogfTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpc2E6IHRoaXMuYXhpc2EsXG4gICAgICBheGlzYjogdGhpcy5heGlzYlxuICAgIH07XG4gIH1cblxuICBzZXRMaW5lYXJMb3dlckxpbWl0KGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRMaW5lYXJMb3dlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIHNldExpbmVhclVwcGVyTGltaXQgKGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRMaW5lYXJVcHBlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJMb3dlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0QW5ndWxhckxvd2VyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0QW5ndWxhclVwcGVyTGltaXQgKGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRBbmd1bGFyVXBwZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IgKHdoaWNoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9lbmFibGVBbmd1bGFyTW90b3InLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHdoaWNoOiB3aGljaCB9ICk7XG4gIH1cblxuICBjb25maWd1cmVBbmd1bGFyTW90b3IgKHdoaWNoLCBsb3dfYW5nbGUsIGhpZ2hfYW5nbGUsIHZlbG9jaXR5LCBtYXhfZm9yY2UgKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9jb25maWd1cmVBbmd1bGFyTW90b3InLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHdoaWNoOiB3aGljaCwgbG93X2FuZ2xlOiBsb3dfYW5nbGUsIGhpZ2hfYW5nbGU6IGhpZ2hfYW5nbGUsIHZlbG9jaXR5OiB2ZWxvY2l0eSwgbWF4X2ZvcmNlOiBtYXhfZm9yY2UgfSApO1xuICB9XG5cbiAgZGlzYWJsZUFuZ3VsYXJNb3RvciAod2hpY2gpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2Rpc2FibGVBbmd1bGFyTW90b3InLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHdoaWNoOiB3aGljaCB9ICk7XG4gIH1cbn1cbiIsImltcG9ydCB7TWVzaH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHtWZWhpY2xlVHVubmluZ30gZnJvbSAnLi90dW5uaW5nJztcblxuZXhwb3J0IGNsYXNzIFZlaGljbGUge1xuICBjb25zdHJ1Y3RvcihtZXNoLCB0dW5pbmcgPSBuZXcgVmVoaWNsZVR1bmluZygpKSB7XG4gICAgdGhpcy5tZXNoID0gbWVzaDtcbiAgICB0aGlzLndoZWVscyA9IFtdO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIGlkOiBnZXRPYmplY3RJZCgpLFxuICAgICAgcmlnaWRCb2R5OiBtZXNoLl9waHlzaWpzLmlkLFxuICAgICAgc3VzcGVuc2lvbl9zdGlmZm5lc3M6IHR1bmluZy5zdXNwZW5zaW9uX3N0aWZmbmVzcyxcbiAgICAgIHN1c3BlbnNpb25fY29tcHJlc3Npb246IHR1bmluZy5zdXNwZW5zaW9uX2NvbXByZXNzaW9uLFxuICAgICAgc3VzcGVuc2lvbl9kYW1waW5nOiB0dW5pbmcuc3VzcGVuc2lvbl9kYW1waW5nLFxuICAgICAgbWF4X3N1c3BlbnNpb25fdHJhdmVsOiB0dW5pbmcubWF4X3N1c3BlbnNpb25fdHJhdmVsLFxuICAgICAgZnJpY3Rpb25fc2xpcDogdHVuaW5nLmZyaWN0aW9uX3NsaXAsXG4gICAgICBtYXhfc3VzcGVuc2lvbl9mb3JjZTogdHVuaW5nLm1heF9zdXNwZW5zaW9uX2ZvcmNlXG4gICAgfTtcbiAgfVxuXG4gIGFkZFdoZWVsKHdoZWVsX2dlb21ldHJ5LCB3aGVlbF9tYXRlcmlhbCwgY29ubmVjdGlvbl9wb2ludCwgd2hlZWxfZGlyZWN0aW9uLCB3aGVlbF9heGxlLCBzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLCB3aGVlbF9yYWRpdXMsIGlzX2Zyb250X3doZWVsLCB0dW5pbmcpIHtcbiAgICBjb25zdCB3aGVlbCA9IG5ldyBNZXNoKHdoZWVsX2dlb21ldHJ5LCB3aGVlbF9tYXRlcmlhbCk7XG5cbiAgICB3aGVlbC5jYXN0U2hhZG93ID0gd2hlZWwucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgd2hlZWwucG9zaXRpb24uY29weSh3aGVlbF9kaXJlY3Rpb24pLm11bHRpcGx5U2NhbGFyKHN1c3BlbnNpb25fcmVzdF9sZW5ndGggLyAxMDApLmFkZChjb25uZWN0aW9uX3BvaW50KTtcblxuICAgIHRoaXMud29ybGQuYWRkKHdoZWVsKTtcbiAgICB0aGlzLndoZWVscy5wdXNoKHdoZWVsKTtcblxuICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnYWRkV2hlZWwnLCB7XG4gICAgICBpZDogdGhpcy5fcGh5c2lqcy5pZCxcbiAgICAgIGNvbm5lY3Rpb25fcG9pbnQ6IHt4OiBjb25uZWN0aW9uX3BvaW50LngsIHk6IGNvbm5lY3Rpb25fcG9pbnQueSwgejogY29ubmVjdGlvbl9wb2ludC56fSxcbiAgICAgIHdoZWVsX2RpcmVjdGlvbjoge3g6IHdoZWVsX2RpcmVjdGlvbi54LCB5OiB3aGVlbF9kaXJlY3Rpb24ueSwgejogd2hlZWxfZGlyZWN0aW9uLnp9LFxuICAgICAgd2hlZWxfYXhsZToge3g6IHdoZWVsX2F4bGUueCwgeTogd2hlZWxfYXhsZS55LCB6OiB3aGVlbF9heGxlLnp9LFxuICAgICAgc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCxcbiAgICAgIHdoZWVsX3JhZGl1cyxcbiAgICAgIGlzX2Zyb250X3doZWVsLFxuICAgICAgdHVuaW5nXG4gICAgfSk7XG4gIH1cblxuICBzZXRTdGVlcmluZyhhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldFN0ZWVyaW5nJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbCwgc3RlZXJpbmc6IGFtb3VudH0pO1xuICAgIGVsc2UgaWYgKHRoaXMud2hlZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aGVlbHMubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0U3RlZXJpbmcnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBzdGVlcmluZzogYW1vdW50fSk7XG4gICAgfVxuICB9XG5cbiAgc2V0QnJha2UoYW1vdW50LCB3aGVlbCkge1xuICAgIGlmICh3aGVlbCAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2hlZWxzW3doZWVsXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRCcmFrZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIGJyYWtlOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldEJyYWtlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgYnJha2U6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5RW5naW5lRm9yY2UoYW1vdW50LCB3aGVlbCkge1xuICAgIGlmICh3aGVlbCAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2hlZWxzW3doZWVsXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdhcHBseUVuZ2luZUZvcmNlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbCwgZm9yY2U6IGFtb3VudH0pO1xuICAgIGVsc2UgaWYgKHRoaXMud2hlZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aGVlbHMubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnYXBwbHlFbmdpbmVGb3JjZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIGZvcmNlOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cbn1cbiIsInZhciBUQVJHRVQgPSB0eXBlb2YgU3ltYm9sID09PSAndW5kZWZpbmVkJyA/ICdfX3RhcmdldCcgOiBTeW1ib2woKSxcbiAgICBTQ1JJUFRfVFlQRSA9ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyxcbiAgICBCbG9iQnVpbGRlciA9IHdpbmRvdy5CbG9iQnVpbGRlciB8fCB3aW5kb3cuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1vekJsb2JCdWlsZGVyIHx8IHdpbmRvdy5NU0Jsb2JCdWlsZGVyLFxuICAgIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCxcbiAgICBXb3JrZXIgPSB3aW5kb3cuV29ya2VyO1xuXG4vKipcbiAqIFJldHVybnMgYSB3cmFwcGVyIGFyb3VuZCBXZWIgV29ya2VyIGNvZGUgdGhhdCBpcyBjb25zdHJ1Y3RpYmxlLlxuICpcbiAqIEBmdW5jdGlvbiBzaGltV29ya2VyXG4gKlxuICogQHBhcmFtIHsgU3RyaW5nIH0gICAgZmlsZW5hbWUgICAgVGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAqIEBwYXJhbSB7IEZ1bmN0aW9uIH0gIGZuICAgICAgICAgIEZ1bmN0aW9uIHdyYXBwaW5nIHRoZSBjb2RlIG9mIHRoZSB3b3JrZXJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2hpbVdvcmtlciAoZmlsZW5hbWUsIGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIFNoaW1Xb3JrZXIgKGZvcmNlRmFsbGJhY2spIHtcbiAgICAgICAgdmFyIG8gPSB0aGlzO1xuXG4gICAgICAgIGlmICghZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgV29ya2VyKGZpbGVuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChXb3JrZXIgJiYgIWZvcmNlRmFsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGZ1bmN0aW9uJ3MgaW5uZXIgY29kZSB0byBhIHN0cmluZyB0byBjb25zdHJ1Y3QgdGhlIHdvcmtlclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGZuLnRvU3RyaW5nKCkucmVwbGFjZSgvXmZ1bmN0aW9uLis/ey8sICcnKS5zbGljZSgwLCAtMSksXG4gICAgICAgICAgICAgICAgb2JqVVJMID0gY3JlYXRlU291cmNlT2JqZWN0KHNvdXJjZSk7XG5cbiAgICAgICAgICAgIHRoaXNbVEFSR0VUXSA9IG5ldyBXb3JrZXIob2JqVVJMKTtcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwob2JqVVJMKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW1RBUkdFVF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc2VsZlNoaW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlOiBmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby5vbm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IG8ub25tZXNzYWdlKHsgZGF0YTogbSwgdGFyZ2V0OiBzZWxmU2hpbSB9KSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZuLmNhbGwoc2VsZlNoaW0pO1xuICAgICAgICAgICAgdGhpcy5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNlbGZTaGltLm9ubWVzc2FnZSh7IGRhdGE6IG0sIHRhcmdldDogbyB9KSB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmlzVGhpc1RocmVhZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLy8gVGVzdCBXb3JrZXIgY2FwYWJpbGl0aWVzXG5pZiAoV29ya2VyKSB7XG4gICAgdmFyIHRlc3RXb3JrZXIsXG4gICAgICAgIG9ialVSTCA9IGNyZWF0ZVNvdXJjZU9iamVjdCgnc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7fScpLFxuICAgICAgICB0ZXN0QXJyYXkgPSBuZXcgVWludDhBcnJheSgxKTtcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIE5vIHdvcmtlcnMgdmlhIGJsb2JzIGluIEVkZ2UgMTIgYW5kIElFIDExIGFuZCBsb3dlciA6KFxuICAgICAgICBpZiAoLyg/OlRyaWRlbnR8RWRnZSlcXC8oPzpbNTY3XXwxMikvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXN0V29ya2VyID0gbmV3IFdvcmtlcihvYmpVUkwpO1xuXG4gICAgICAgIC8vIE5hdGl2ZSBicm93c2VyIG9uIHNvbWUgU2Ftc3VuZyBkZXZpY2VzIHRocm93cyBmb3IgdHJhbnNmZXJhYmxlcywgbGV0J3MgZGV0ZWN0IGl0XG4gICAgICAgIHRlc3RXb3JrZXIucG9zdE1lc3NhZ2UodGVzdEFycmF5LCBbdGVzdEFycmF5LmJ1ZmZlcl0pO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBXb3JrZXIgPSBudWxsO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChvYmpVUkwpO1xuICAgICAgICBpZiAodGVzdFdvcmtlcikge1xuICAgICAgICAgICAgdGVzdFdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU291cmNlT2JqZWN0KHN0cikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtzdHJdLCB7IHR5cGU6IFNDUklQVF9UWVBFIH0pKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYkJ1aWxkZXIoKTtcbiAgICAgICAgYmxvYi5hcHBlbmQoc3RyKTtcbiAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYi5nZXRCbG9iKHR5cGUpKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgc2hpbVdvcmtlciBmcm9tICdyb2xsdXAtcGx1Z2luLWJ1bmRsZS13b3JrZXInO1xuZXhwb3J0IGRlZmF1bHQgbmV3IHNoaW1Xb3JrZXIoXCIuLi93b3JrZXIuanNcIiwgZnVuY3Rpb24gKHdpbmRvdywgZG9jdW1lbnQpIHtcbnZhciBzZWxmID0gdGhpcztcbmNvbnN0IHRyYW5zZmVyYWJsZU1lc3NhZ2UgPSBzZWxmLndlYmtpdFBvc3RNZXNzYWdlIHx8IHNlbGYucG9zdE1lc3NhZ2UsXG5cbi8vIGVudW1cbk1FU1NBR0VfVFlQRVMgPSB7XG4gIFdPUkxEUkVQT1JUOiAwLFxuICBDT0xMSVNJT05SRVBPUlQ6IDEsXG4gIFZFSElDTEVSRVBPUlQ6IDIsXG4gIENPTlNUUkFJTlRSRVBPUlQ6IDMsXG4gIFNPRlRSRVBPUlQ6IDRcbn07XG5cbiAgLy8gdGVtcCB2YXJpYWJsZXNcbmxldCBfb2JqZWN0LFxuICBfdmVjdG9yLFxuICBfdHJhbnNmb3JtLFxuICBfdHJhbnNmb3JtX3BvcyxcbiAgX3NvZnRib2R5X2VuYWJsZWQgPSBmYWxzZSxcbiAgbGFzdF9zaW11bGF0aW9uX2R1cmF0aW9uID0gMCxcblxuICBfbnVtX29iamVjdHMgPSAwLFxuICBfbnVtX3JpZ2lkYm9keV9vYmplY3RzID0gMCxcbiAgX251bV9zb2Z0Ym9keV9vYmplY3RzID0gMCxcbiAgX251bV93aGVlbHMgPSAwLFxuICBfbnVtX2NvbnN0cmFpbnRzID0gMCxcbiAgX3NvZnRib2R5X3JlcG9ydF9zaXplID0gMCxcblxuICAvLyB3b3JsZCB2YXJpYWJsZXNcbiAgZml4ZWRUaW1lU3RlcCwgLy8gdXNlZCB3aGVuIGNhbGxpbmcgc3RlcFNpbXVsYXRpb25cbiAgbGFzdF9zaW11bGF0aW9uX3RpbWUsXG5cbiAgd29ybGQsXG4gIF92ZWMzXzEsXG4gIF92ZWMzXzIsXG4gIF92ZWMzXzMsXG4gIF9xdWF0O1xuXG4gIC8vIHByaXZhdGUgY2FjaGVcbmNvbnN0IHB1YmxpY19mdW5jdGlvbnMgPSB7fSxcbiAgX29iamVjdHMgPSBbXSxcbiAgX3ZlaGljbGVzID0gW10sXG4gIF9jb25zdHJhaW50cyA9IFtdLFxuICBfb2JqZWN0c19hbW1vID0ge30sXG4gIF9vYmplY3Rfc2hhcGVzID0ge30sXG5cbiAgLy8gVGhlIGZvbGxvd2luZyBvYmplY3RzIGFyZSB0byB0cmFjayBvYmplY3RzIHRoYXQgYW1tby5qcyBkb2Vzbid0IGNsZWFuXG4gIC8vIHVwLiBBbGwgYXJlIGNsZWFuZWQgdXAgd2hlbiB0aGV5J3JlIGNvcnJlc3BvbmRpbmcgYm9keSBpcyBkZXN0cm95ZWQuXG4gIC8vIFVuZm9ydHVuYXRlbHksIGl0J3MgdmVyeSBkaWZmaWN1bHQgdG8gZ2V0IGF0IHRoZXNlIG9iamVjdHMgZnJvbSB0aGVcbiAgLy8gYm9keSwgc28gd2UgaGF2ZSB0byB0cmFjayB0aGVtIG91cnNlbHZlcy5cbiAgX21vdGlvbl9zdGF0ZXMgPSB7fSxcbiAgLy8gRG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dCBpdCBmb3IgY2FjaGVkIHNoYXBlcy5cbiAgX25vbmNhY2hlZF9zaGFwZXMgPSB7fSxcbiAgLy8gQSBib2R5IHdpdGggYSBjb21wb3VuZCBzaGFwZSBhbHdheXMgaGFzIGEgcmVndWxhciBzaGFwZSBhcyB3ZWxsLCBzbyB3ZVxuICAvLyBoYXZlIHRyYWNrIHRoZW0gc2VwYXJhdGVseS5cbiAgX2NvbXBvdW5kX3NoYXBlcyA9IHt9O1xuXG4gIC8vIG9iamVjdCByZXBvcnRpbmdcbmxldCBSRVBPUlRfQ0hVTktTSVpFLCAvLyByZXBvcnQgYXJyYXkgaXMgaW5jcmVhc2VkIGluIGluY3JlbWVudHMgb2YgdGhpcyBjaHVuayBzaXplXG4gIHdvcmxkcmVwb3J0LFxuICBzb2Z0cmVwb3J0LFxuICBjb2xsaXNpb25yZXBvcnQsXG4gIHZlaGljbGVyZXBvcnQsXG4gIGNvbnN0cmFpbnRyZXBvcnQ7XG5cbmNvbnN0IFdPUkxEUkVQT1JUX0lURU1TSVpFID0gMTQsIC8vIGhvdyBtYW55IGZsb2F0IHZhbHVlcyBlYWNoIHJlcG9ydGVkIGl0ZW0gbmVlZHNcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFID0gNSwgLy8gb25lIGZsb2F0IGZvciBlYWNoIG9iamVjdCBpZCwgYW5kIGEgVmVjMyBjb250YWN0IG5vcm1hbFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFID0gOSwgLy8gdmVoaWNsZSBpZCwgd2hlZWwgaW5kZXgsIDMgZm9yIHBvc2l0aW9uLCA0IGZvciByb3RhdGlvblxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFID0gNjsgLy8gY29uc3RyYWludCBpZCwgb2Zmc2V0IG9iamVjdCwgb2Zmc2V0LCBhcHBsaWVkIGltcHVsc2VcblxuY29uc3QgYWIgPSBuZXcgQXJyYXlCdWZmZXIoMSk7XG5cbnRyYW5zZmVyYWJsZU1lc3NhZ2UoYWIsIFthYl0pO1xuY29uc3QgU1VQUE9SVF9UUkFOU0ZFUkFCTEUgPSAoYWIuYnl0ZUxlbmd0aCA9PT0gMCk7XG5cbmNvbnN0IGdldFNoYXBlRnJvbUNhY2hlID0gKGNhY2hlX2tleSkgPT4ge1xuICBpZiAoX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XSAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldO1xuXG4gIHJldHVybiBudWxsO1xufTtcblxuY29uc3Qgc2V0U2hhcGVDYWNoZSA9IChjYWNoZV9rZXksIHNoYXBlKSA9PiB7XG4gIF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV0gPSBzaGFwZTtcbn07XG5cbmNvbnN0IGNyZWF0ZVNoYXBlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBzaGFwZTtcblxuICBfdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG4gIHN3aXRjaCAoZGVzY3JpcHRpb24udHlwZSkge1xuICAgIGNhc2UgJ2NvbXBvdW5kJzoge1xuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbXBvdW5kU2hhcGUoKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ3BsYW5lJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYHBsYW5lXyR7ZGVzY3JpcHRpb24ubm9ybWFsLnh9XyR7ZGVzY3JpcHRpb24ubm9ybWFsLnl9XyR7ZGVzY3JpcHRpb24ubm9ybWFsLnp9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5ub3JtYWwueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5ub3JtYWwueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5ub3JtYWwueik7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRTdGF0aWNQbGFuZVNoYXBlKF92ZWMzXzEsIDApO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnYm94Jzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGJveF8ke2Rlc2NyaXB0aW9uLndpZHRofV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1fJHtkZXNjcmlwdGlvbi5kZXB0aH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLndpZHRoIC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5oZWlnaHQgLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLmRlcHRoIC8gMik7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRCb3hTaGFwZShfdmVjM18xKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ3NwaGVyZSc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBzcGhlcmVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRTcGhlcmVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY3lsaW5kZXInOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgY3lsaW5kZXJfJHtkZXNjcmlwdGlvbi53aWR0aH1fJHtkZXNjcmlwdGlvbi5oZWlnaHR9XyR7ZGVzY3JpcHRpb24uZGVwdGh9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi53aWR0aCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uaGVpZ2h0IC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5kZXB0aCAvIDIpO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q3lsaW5kZXJTaGFwZShfdmVjM18xKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2NhcHN1bGUnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgY2Fwc3VsZV8ke2Rlc2NyaXB0aW9uLnJhZGl1c31fJHtkZXNjcmlwdGlvbi5oZWlnaHR9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIC8vIEluIEJ1bGxldCwgY2Fwc3VsZSBoZWlnaHQgZXhjbHVkZXMgdGhlIGVuZCBzcGhlcmVzXG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDYXBzdWxlU2hhcGUoZGVzY3JpcHRpb24ucmFkaXVzLCBkZXNjcmlwdGlvbi5oZWlnaHQgLSAyICogZGVzY3JpcHRpb24ucmFkaXVzKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2NvbmUnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgY29uZV8ke2Rlc2NyaXB0aW9uLnJhZGl1c31fJHtkZXNjcmlwdGlvbi5oZWlnaHR9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb25lU2hhcGUoZGVzY3JpcHRpb24ucmFkaXVzLCBkZXNjcmlwdGlvbi5oZWlnaHQpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY29uY2F2ZSc6IHtcbiAgICAgIGNvbnN0IHRyaWFuZ2xlX21lc2ggPSBuZXcgQW1tby5idFRyaWFuZ2xlTWVzaCgpO1xuICAgICAgaWYgKCFkZXNjcmlwdGlvbi5kYXRhLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3QgZGF0YSA9IGRlc2NyaXB0aW9uLmRhdGE7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGggLyA5OyBpKyspIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRhdGFbaSAqIDldKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRhdGFbaSAqIDkgKyAxXSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkYXRhW2kgKiA5ICsgMl0pO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkYXRhW2kgKiA5ICsgM10pO1xuICAgICAgICBfdmVjM18yLnNldFkoZGF0YVtpICogOSArIDRdKTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRhdGFbaSAqIDkgKyA1XSk7XG5cbiAgICAgICAgX3ZlYzNfMy5zZXRYKGRhdGFbaSAqIDkgKyA2XSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WShkYXRhW2kgKiA5ICsgN10pO1xuICAgICAgICBfdmVjM18zLnNldFooZGF0YVtpICogOSArIDhdKTtcblxuICAgICAgICB0cmlhbmdsZV9tZXNoLmFkZFRyaWFuZ2xlKFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMixcbiAgICAgICAgICBfdmVjM18zLFxuICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRCdmhUcmlhbmdsZU1lc2hTaGFwZShcbiAgICAgICAgdHJpYW5nbGVfbWVzaCxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdHJ1ZVxuICAgICAgKTtcblxuICAgICAgX25vbmNhY2hlZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjb252ZXgnOiB7XG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29udmV4SHVsbFNoYXBlKCk7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aCAvIDM7IGkrKykge1xuICAgICAgICBfdmVjM18xLnNldFgoZGF0YVtpICogMyBdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRhdGFbaSAqIDMgKyAxXSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkYXRhW2kgKiAzICsgMl0pO1xuXG4gICAgICAgIHNoYXBlLmFkZFBvaW50KF92ZWMzXzEpO1xuICAgICAgfVxuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2hlaWdodGZpZWxkJzoge1xuICAgICAgY29uc3QgeHB0cyA9IGRlc2NyaXB0aW9uLnhwdHMsXG4gICAgICAgIHlwdHMgPSBkZXNjcmlwdGlvbi55cHRzLFxuICAgICAgICBwb2ludHMgPSBkZXNjcmlwdGlvbi5wb2ludHMsXG4gICAgICAgIHB0ciA9IEFtbW8uX21hbGxvYyg0ICogeHB0cyAqIHlwdHMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMCwgcCA9IDAsIHAyID0gMDsgaSA8IHhwdHM7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHlwdHM7IGorKykge1xuICAgICAgICAgIEFtbW8uSEVBUEYzMltwdHIgKyBwMiA+PiAyXSA9IHBvaW50c1twXTtcblxuICAgICAgICAgIHArKztcbiAgICAgICAgICBwMiArPSA0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRIZWlnaHRmaWVsZFRlcnJhaW5TaGFwZShcbiAgICAgICAgZGVzY3JpcHRpb24ueHB0cyxcbiAgICAgICAgZGVzY3JpcHRpb24ueXB0cyxcbiAgICAgICAgcHRyLFxuICAgICAgICAxLFxuICAgICAgICAtZGVzY3JpcHRpb24uYWJzTWF4SGVpZ2h0LFxuICAgICAgICBkZXNjcmlwdGlvbi5hYnNNYXhIZWlnaHQsXG4gICAgICAgIDEsXG4gICAgICAgICdQSFlfRkxPQVQnLFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcblxuICAgICAgX25vbmNhY2hlZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIE5vdCByZWNvZ25pemVkXG4gICAgICByZXR1cm47XG4gIH1cblxuICByZXR1cm4gc2hhcGU7XG59O1xuXG5jb25zdCBjcmVhdGVTb2Z0Qm9keSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBsZXQgYm9keTtcblxuICBjb25zdCBzb2Z0Qm9keUhlbHBlcnMgPSBuZXcgQW1tby5idFNvZnRCb2R5SGVscGVycygpO1xuXG4gIHN3aXRjaCAoZGVzY3JpcHRpb24udHlwZSkge1xuICAgIGNhc2UgJ3NvZnRUcmltZXNoJzoge1xuICAgICAgaWYgKCFkZXNjcmlwdGlvbi5hVmVydGljZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIGJvZHkgPSBzb2Z0Qm9keUhlbHBlcnMuQ3JlYXRlRnJvbVRyaU1lc2goXG4gICAgICAgIHdvcmxkLmdldFdvcmxkSW5mbygpLFxuICAgICAgICBkZXNjcmlwdGlvbi5hVmVydGljZXMsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFJbmRpY2VzLFxuICAgICAgICBkZXNjcmlwdGlvbi5hSW5kaWNlcy5sZW5ndGggLyAzLFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ3NvZnRDbG90aE1lc2gnOiB7XG4gICAgICBjb25zdCBjciA9IGRlc2NyaXB0aW9uLmNvcm5lcnM7XG5cbiAgICAgIGJvZHkgPSBzb2Z0Qm9keUhlbHBlcnMuQ3JlYXRlUGF0Y2goXG4gICAgICAgIHdvcmxkLmdldFdvcmxkSW5mbygpLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbMF0sIGNyWzFdLCBjclsyXSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjclszXSwgY3JbNF0sIGNyWzVdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzZdLCBjcls3XSwgY3JbOF0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbOV0sIGNyWzEwXSwgY3JbMTFdKSxcbiAgICAgICAgZGVzY3JpcHRpb24uc2VnbWVudHNbMF0sXG4gICAgICAgIGRlc2NyaXB0aW9uLnNlZ21lbnRzWzFdLFxuICAgICAgICAwLFxuICAgICAgICB0cnVlXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc29mdFJvcGVNZXNoJzoge1xuICAgICAgY29uc3QgZGF0YSA9IGRlc2NyaXB0aW9uLmRhdGE7XG5cbiAgICAgIGJvZHkgPSBzb2Z0Qm9keUhlbHBlcnMuQ3JlYXRlUm9wZShcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhkYXRhWzBdLCBkYXRhWzFdLCBkYXRhWzJdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGRhdGFbM10sIGRhdGFbNF0sIGRhdGFbNV0pLFxuICAgICAgICBkYXRhWzZdIC0gMSxcbiAgICAgICAgMFxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBOb3QgcmVjb2duaXplZFxuICAgICAgcmV0dXJuO1xuICB9XG5cbiAgcmV0dXJuIGJvZHk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmluaXQgPSAocGFyYW1zID0ge30pID0+IHtcbiAgaWYgKHBhcmFtcy53YXNtQnVmZmVyKSB7XG4gICAgaW1wb3J0U2NyaXB0cyhwYXJhbXMuYW1tbyk7XG5cbiAgICBzZWxmLkFtbW8gPSBsb2FkQW1tb0Zyb21CaW5hcnkocGFyYW1zLndhc21CdWZmZXIpO1xuICAgIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoe2NtZDogJ2FtbW9Mb2FkZWQnfSk7XG4gICAgcHVibGljX2Z1bmN0aW9ucy5tYWtlV29ybGQocGFyYW1zKTtcbiAgfSBlbHNlIHtcbiAgICBpbXBvcnRTY3JpcHRzKHBhcmFtcy5hbW1vKTtcbiAgICB0cmFuc2ZlcmFibGVNZXNzYWdlKHtjbWQ6ICdhbW1vTG9hZGVkJ30pO1xuICAgIHB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkKHBhcmFtcyk7XG4gIH1cbn1cblxucHVibGljX2Z1bmN0aW9ucy5tYWtlV29ybGQgPSAocGFyYW1zID0ge30pID0+IHtcbiAgX3RyYW5zZm9ybSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gIF90cmFuc2Zvcm1fcG9zID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgX3ZlYzNfMSA9IG5ldyBBbW1vLmJ0VmVjdG9yMygwLCAwLCAwKTtcbiAgX3ZlYzNfMiA9IG5ldyBBbW1vLmJ0VmVjdG9yMygwLCAwLCAwKTtcbiAgX3ZlYzNfMyA9IG5ldyBBbW1vLmJ0VmVjdG9yMygwLCAwLCAwKTtcbiAgX3F1YXQgPSBuZXcgQW1tby5idFF1YXRlcm5pb24oMCwgMCwgMCwgMCk7XG5cbiAgUkVQT1JUX0NIVU5LU0laRSA9IHBhcmFtcy5yZXBvcnRzaXplIHx8IDUwO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIC8vIFRyYW5zZmVyYWJsZSBtZXNzYWdlcyBhcmUgc3VwcG9ydGVkLCB0YWtlIGFkdmFudGFnZSBvZiB0aGVtIHdpdGggVHlwZWRBcnJheXNcbiAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBXT1JMRFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIG9iamVjdHMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICBjb2xsaXNpb25yZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2YgY29sbGlzaW9ucyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIHZlaGljbGVzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2YgY29uc3RyYWludHMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgfSBlbHNlIHtcbiAgICAvLyBUcmFuc2ZlcmFibGUgbWVzc2FnZXMgYXJlIG5vdCBzdXBwb3J0ZWQsIHNlbmQgZGF0YSBhcyBub3JtYWwgYXJyYXlzXG4gICAgd29ybGRyZXBvcnQgPSBbXTtcbiAgICBjb2xsaXNpb25yZXBvcnQgPSBbXTtcbiAgICB2ZWhpY2xlcmVwb3J0ID0gW107XG4gICAgY29uc3RyYWludHJlcG9ydCA9IFtdO1xuICB9XG5cbiAgd29ybGRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUO1xuICBjb2xsaXNpb25yZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDtcbiAgdmVoaWNsZXJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDtcbiAgY29uc3RyYWludHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDtcblxuICBjb25zdCBjb2xsaXNpb25Db25maWd1cmF0aW9uID0gcGFyYW1zLnNvZnRib2R5XG4gICAgPyBuZXcgQW1tby5idFNvZnRCb2R5UmlnaWRCb2R5Q29sbGlzaW9uQ29uZmlndXJhdGlvbigpXG4gICAgOiBuZXcgQW1tby5idERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uKCksXG4gICAgZGlzcGF0Y2hlciA9IG5ldyBBbW1vLmJ0Q29sbGlzaW9uRGlzcGF0Y2hlcihjb2xsaXNpb25Db25maWd1cmF0aW9uKSxcbiAgICBzb2x2ZXIgPSBuZXcgQW1tby5idFNlcXVlbnRpYWxJbXB1bHNlQ29uc3RyYWludFNvbHZlcigpO1xuXG4gIGxldCBicm9hZHBoYXNlO1xuXG4gIGlmICghcGFyYW1zLmJyb2FkcGhhc2UpIHBhcmFtcy5icm9hZHBoYXNlID0ge3R5cGU6ICdkeW5hbWljJ307XG4gIC8vIFRPRE8hISFcbiAgLyogaWYgKHBhcmFtcy5icm9hZHBoYXNlLnR5cGUgPT09ICdzd2VlcHBydW5lJykge1xuICAgIGV4dGVuZChwYXJhbXMuYnJvYWRwaGFzZSwge1xuICAgICAgYWFiYm1pbjoge1xuICAgICAgICB4OiAtNTAsXG4gICAgICAgIHk6IC01MCxcbiAgICAgICAgejogLTUwXG4gICAgICB9LFxuXG4gICAgICBhYWJibWF4OiB7XG4gICAgICAgIHg6IDUwLFxuICAgICAgICB5OiA1MCxcbiAgICAgICAgejogNTBcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0qL1xuXG4gIHN3aXRjaCAocGFyYW1zLmJyb2FkcGhhc2UudHlwZSkge1xuICAgIGNhc2UgJ3N3ZWVwcHJ1bmUnOlxuICAgICAgX3ZlYzNfMS5zZXRYKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtaW4ueCk7XG4gICAgICBfdmVjM18xLnNldFkocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWluLnopO1xuXG4gICAgICBfdmVjM18yLnNldFgocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1heC54KTtcbiAgICAgIF92ZWMzXzIuc2V0WShwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LnkpO1xuICAgICAgX3ZlYzNfMi5zZXRaKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtYXgueik7XG5cbiAgICAgIGJyb2FkcGhhc2UgPSBuZXcgQW1tby5idEF4aXNTd2VlcDMoXG4gICAgICAgIF92ZWMzXzEsXG4gICAgICAgIF92ZWMzXzJcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2R5bmFtaWMnOlxuICAgIGRlZmF1bHQ6XG4gICAgICBicm9hZHBoYXNlID0gbmV3IEFtbW8uYnREYnZ0QnJvYWRwaGFzZSgpO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICB3b3JsZCA9IHBhcmFtcy5zb2Z0Ym9keVxuICAgID8gbmV3IEFtbW8uYnRTb2Z0UmlnaWREeW5hbWljc1dvcmxkKGRpc3BhdGNoZXIsIGJyb2FkcGhhc2UsIHNvbHZlciwgY29sbGlzaW9uQ29uZmlndXJhdGlvbiwgbmV3IEFtbW8uYnREZWZhdWx0U29mdEJvZHlTb2x2ZXIoKSlcbiAgICA6IG5ldyBBbW1vLmJ0RGlzY3JldGVEeW5hbWljc1dvcmxkKGRpc3BhdGNoZXIsIGJyb2FkcGhhc2UsIHNvbHZlciwgY29sbGlzaW9uQ29uZmlndXJhdGlvbik7XG4gIGZpeGVkVGltZVN0ZXAgPSBwYXJhbXMuZml4ZWRUaW1lU3RlcDtcblxuICBpZiAocGFyYW1zLnNvZnRib2R5KSBfc29mdGJvZHlfZW5hYmxlZCA9IHRydWU7XG5cbiAgdHJhbnNmZXJhYmxlTWVzc2FnZSh7Y21kOiAnd29ybGRSZWFkeSd9KTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0Rml4ZWRUaW1lU3RlcCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBmaXhlZFRpbWVTdGVwID0gZGVzY3JpcHRpb247XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEdyYXZpdHkgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLngpO1xuICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ueSk7XG4gIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi56KTtcbiAgd29ybGQuc2V0R3Jhdml0eShfdmVjM18xKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwZW5kQW5jaG9yID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGNvbnNvbGUubG9nKF9vYmplY3RzW2Rlc2NyaXB0aW9uLm9ial0pO1xuICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5vYmpdXG4gICAgLmFwcGVuZEFuY2hvcihcbiAgICAgIGRlc2NyaXB0aW9uLm5vZGUsXG4gICAgICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5vYmoyXSxcbiAgICAgIGRlc2NyaXB0aW9uLmNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMsXG4gICAgICBkZXNjcmlwdGlvbi5pbmZsdWVuY2VcbiAgICApO1xufVxuXG5wdWJsaWNfZnVuY3Rpb25zLmFkZE9iamVjdCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBsZXQgYm9keSwgbW90aW9uU3RhdGU7XG5cbiAgaWYgKGRlc2NyaXB0aW9uLnR5cGUuaW5kZXhPZignc29mdCcpICE9PSAtMSkge1xuICAgIGJvZHkgPSBjcmVhdGVTb2Z0Qm9keShkZXNjcmlwdGlvbik7XG5cbiAgICBjb25zdCBzYkNvbmZpZyA9IGJvZHkuZ2V0X21fY2ZnKCk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24udml0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF92aXRlcmF0aW9ucyhkZXNjcmlwdGlvbi52aXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnBpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfcGl0ZXJhdGlvbnMoZGVzY3JpcHRpb24ucGl0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5kaXRlcmF0aW9ucykgc2JDb25maWcuc2V0X2RpdGVyYXRpb25zKGRlc2NyaXB0aW9uLmRpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uY2l0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9jaXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5jaXRlcmF0aW9ucyk7XG4gICAgc2JDb25maWcuc2V0X2NvbGxpc2lvbnMoMHgxMSk7XG4gICAgc2JDb25maWcuc2V0X2tERihkZXNjcmlwdGlvbi5mcmljdGlvbik7XG4gICAgc2JDb25maWcuc2V0X2tEUChkZXNjcmlwdGlvbi5kYW1waW5nKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucHJlc3N1cmUpIHNiQ29uZmlnLnNldF9rUFIoZGVzY3JpcHRpb24ucHJlc3N1cmUpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5kcmFnKSBzYkNvbmZpZy5zZXRfa0RHKGRlc2NyaXB0aW9uLmRyYWcpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5saWZ0KSBzYkNvbmZpZy5zZXRfa0xGKGRlc2NyaXB0aW9uLmxpZnQpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5hbmNob3JIYXJkbmVzcykgc2JDb25maWcuc2V0X2tBSFIoZGVzY3JpcHRpb24uYW5jaG9ySGFyZG5lc3MpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5yaWdpZEhhcmRuZXNzKSBzYkNvbmZpZy5zZXRfa0NIUihkZXNjcmlwdGlvbi5yaWdpZEhhcmRuZXNzKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbi5rbHN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tMU1QoZGVzY3JpcHRpb24ua2xzdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmthc3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa0FTVChkZXNjcmlwdGlvbi5rYXN0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24ua3ZzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rVlNUKGRlc2NyaXB0aW9uLmt2c3QpO1xuXG4gICAgQW1tby5jYXN0T2JqZWN0KGJvZHksIEFtbW8uYnRDb2xsaXNpb25PYmplY3QpLmdldENvbGxpc2lvblNoYXBlKCkuc2V0TWFyZ2luKGRlc2NyaXB0aW9uLm1hcmdpbiA/IGRlc2NyaXB0aW9uLm1hcmdpbiA6IDAuMSk7XG5cbiAgICAvLyBBbW1vLmNhc3RPYmplY3QoYm9keSwgQW1tby5idENvbGxpc2lvbk9iamVjdCkuZ2V0Q29sbGlzaW9uU2hhcGUoKS5zZXRMb2NhbFNjYWxpbmcoX3ZlYzNfMSk7XG4gICAgYm9keS5zZXRBY3RpdmF0aW9uU3RhdGUoZGVzY3JpcHRpb24uc3RhdGUgfHwgNCk7XG4gICAgYm9keS50eXBlID0gMDsgLy8gU29mdEJvZHkuXG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Um9wZU1lc2gnKSBib2R5LnJvcGUgPSB0cnVlO1xuICAgIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdENsb3RoTWVzaCcpIGJvZHkuY2xvdGggPSB0cnVlO1xuXG4gICAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnBvc2l0aW9uLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5wb3NpdGlvbi55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ucG9zaXRpb24ueik7XG4gICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICBfcXVhdC5zZXRYKGRlc2NyaXB0aW9uLnJvdGF0aW9uLngpO1xuICAgIF9xdWF0LnNldFkoZGVzY3JpcHRpb24ucm90YXRpb24ueSk7XG4gICAgX3F1YXQuc2V0WihkZXNjcmlwdGlvbi5yb3RhdGlvbi56KTtcbiAgICBfcXVhdC5zZXRXKGRlc2NyaXB0aW9uLnJvdGF0aW9uLncpO1xuICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuXG4gICAgYm9keS50cmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uc2NhbGUueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnNjYWxlLnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5zY2FsZS56KTtcblxuICAgIGJvZHkuc2NhbGUoX3ZlYzNfMSk7XG5cbiAgICBib2R5LnNldFRvdGFsTWFzcyhkZXNjcmlwdGlvbi5tYXNzLCBmYWxzZSk7XG4gICAgd29ybGQuYWRkU29mdEJvZHkoYm9keSwgMSwgLTEpO1xuICAgIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFRyaW1lc2gnKSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9mYWNlcygpLnNpemUoKSAqIDM7XG4gICAgZWxzZSBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRSb3BlTWVzaCcpIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX25vZGVzKCkuc2l6ZSgpO1xuICAgIGVsc2UgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fbm9kZXMoKS5zaXplKCkgKiAzO1xuXG4gICAgX251bV9zb2Z0Ym9keV9vYmplY3RzKys7XG4gIH0gZWxzZSB7XG4gICAgbGV0IHNoYXBlID0gY3JlYXRlU2hhcGUoZGVzY3JpcHRpb24pO1xuXG4gICAgaWYgKCFzaGFwZSkgcmV0dXJuO1xuXG4gICAgLy8gSWYgdGhlcmUgYXJlIGNoaWxkcmVuIHRoZW4gdGhpcyBpcyBhIGNvbXBvdW5kIHNoYXBlXG4gICAgaWYgKGRlc2NyaXB0aW9uLmNoaWxkcmVuKSB7XG4gICAgICBjb25zdCBjb21wb3VuZF9zaGFwZSA9IG5ldyBBbW1vLmJ0Q29tcG91bmRTaGFwZSgpO1xuICAgICAgY29tcG91bmRfc2hhcGUuYWRkQ2hpbGRTaGFwZShfdHJhbnNmb3JtLCBzaGFwZSk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzY3JpcHRpb24uY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgX2NoaWxkID0gZGVzY3JpcHRpb24uY2hpbGRyZW5baV07XG5cbiAgICAgICAgY29uc3QgdHJhbnMgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFucy5zZXRJZGVudGl0eSgpO1xuXG4gICAgICAgIF92ZWMzXzEuc2V0WChfY2hpbGQucG9zaXRpb25fb2Zmc2V0LngpO1xuICAgICAgICBfdmVjM18xLnNldFkoX2NoaWxkLnBvc2l0aW9uX29mZnNldC55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueik7XG4gICAgICAgIHRyYW5zLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgICAgICBfcXVhdC5zZXRYKF9jaGlsZC5yb3RhdGlvbi54KTtcbiAgICAgICAgX3F1YXQuc2V0WShfY2hpbGQucm90YXRpb24ueSk7XG4gICAgICAgIF9xdWF0LnNldFooX2NoaWxkLnJvdGF0aW9uLnopO1xuICAgICAgICBfcXVhdC5zZXRXKF9jaGlsZC5yb3RhdGlvbi53KTtcbiAgICAgICAgdHJhbnMuc2V0Um90YXRpb24oX3F1YXQpO1xuXG4gICAgICAgIHNoYXBlID0gY3JlYXRlU2hhcGUoZGVzY3JpcHRpb24uY2hpbGRyZW5baV0pO1xuICAgICAgICBjb21wb3VuZF9zaGFwZS5hZGRDaGlsZFNoYXBlKHRyYW5zLCBzaGFwZSk7XG4gICAgICAgIEFtbW8uZGVzdHJveSh0cmFucyk7XG4gICAgICB9XG5cbiAgICAgIHNoYXBlID0gY29tcG91bmRfc2hhcGU7XG4gICAgICBfY29tcG91bmRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuICAgIH1cblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5zY2FsZS54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uc2NhbGUueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnNjYWxlLnopO1xuXG4gICAgc2hhcGUuc2V0TG9jYWxTY2FsaW5nKF92ZWMzXzEpO1xuICAgIHNoYXBlLnNldE1hcmdpbihkZXNjcmlwdGlvbi5tYXJnaW4gPyBkZXNjcmlwdGlvbi5tYXJnaW4gOiAwKTtcblxuICAgIF92ZWMzXzEuc2V0WCgwKTtcbiAgICBfdmVjM18xLnNldFkoMCk7XG4gICAgX3ZlYzNfMS5zZXRaKDApO1xuICAgIHNoYXBlLmNhbGN1bGF0ZUxvY2FsSW5lcnRpYShkZXNjcmlwdGlvbi5tYXNzLCBfdmVjM18xKTtcblxuICAgIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcblxuICAgIF92ZWMzXzIuc2V0WChkZXNjcmlwdGlvbi5wb3NpdGlvbi54KTtcbiAgICBfdmVjM18yLnNldFkoZGVzY3JpcHRpb24ucG9zaXRpb24ueSk7XG4gICAgX3ZlYzNfMi5zZXRaKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnopO1xuICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgX3F1YXQuc2V0WChkZXNjcmlwdGlvbi5yb3RhdGlvbi54KTtcbiAgICBfcXVhdC5zZXRZKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnkpO1xuICAgIF9xdWF0LnNldFooZGVzY3JpcHRpb24ucm90YXRpb24ueik7XG4gICAgX3F1YXQuc2V0VyhkZXNjcmlwdGlvbi5yb3RhdGlvbi53KTtcbiAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgIG1vdGlvblN0YXRlID0gbmV3IEFtbW8uYnREZWZhdWx0TW90aW9uU3RhdGUoX3RyYW5zZm9ybSk7IC8vICNUT0RPOiBidERlZmF1bHRNb3Rpb25TdGF0ZSBzdXBwb3J0cyBjZW50ZXIgb2YgbWFzcyBvZmZzZXQgYXMgc2Vjb25kIGFyZ3VtZW50IC0gaW1wbGVtZW50XG4gICAgY29uc3QgcmJJbmZvID0gbmV3IEFtbW8uYnRSaWdpZEJvZHlDb25zdHJ1Y3Rpb25JbmZvKGRlc2NyaXB0aW9uLm1hc3MsIG1vdGlvblN0YXRlLCBzaGFwZSwgX3ZlYzNfMSk7XG5cbiAgICByYkluZm8uc2V0X21fZnJpY3Rpb24oZGVzY3JpcHRpb24uZnJpY3Rpb24pO1xuICAgIHJiSW5mby5zZXRfbV9yZXN0aXR1dGlvbihkZXNjcmlwdGlvbi5yZXN0aXR1dGlvbik7XG4gICAgcmJJbmZvLnNldF9tX2xpbmVhckRhbXBpbmcoZGVzY3JpcHRpb24uZGFtcGluZyk7XG4gICAgcmJJbmZvLnNldF9tX2FuZ3VsYXJEYW1waW5nKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuXG4gICAgYm9keSA9IG5ldyBBbW1vLmJ0UmlnaWRCb2R5KHJiSW5mbyk7XG4gICAgYm9keS5zZXRBY3RpdmF0aW9uU3RhdGUoZGVzY3JpcHRpb24uc3RhdGUgfHwgNCk7XG4gICAgQW1tby5kZXN0cm95KHJiSW5mbyk7XG5cbiAgICBpZiAodHlwZW9mIGRlc2NyaXB0aW9uLmNvbGxpc2lvbl9mbGFncyAhPT0gJ3VuZGVmaW5lZCcpIGJvZHkuc2V0Q29sbGlzaW9uRmxhZ3MoZGVzY3JpcHRpb24uY29sbGlzaW9uX2ZsYWdzKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbi5ncm91cCAmJiBkZXNjcmlwdGlvbi5tYXNrKSB3b3JsZC5hZGRSaWdpZEJvZHkoYm9keSwgZGVzY3JpcHRpb24uZ3JvdXAsIGRlc2NyaXB0aW9uLm1hc2spO1xuICAgIGVsc2Ugd29ybGQuYWRkUmlnaWRCb2R5KGJvZHkpO1xuICAgIGJvZHkudHlwZSA9IDE7IC8vIFJpZ2lkQm9keS5cbiAgICBfbnVtX3JpZ2lkYm9keV9vYmplY3RzKys7XG4gIH1cblxuICBib2R5LmFjdGl2YXRlKCk7XG5cbiAgYm9keS5pZCA9IGRlc2NyaXB0aW9uLmlkO1xuICBfb2JqZWN0c1tib2R5LmlkXSA9IGJvZHk7XG4gIF9tb3Rpb25fc3RhdGVzW2JvZHkuaWRdID0gbW90aW9uU3RhdGU7XG5cbiAgX29iamVjdHNfYW1tb1tib2R5LmEgPT09IHVuZGVmaW5lZCA/IGJvZHkucHRyIDogYm9keS5hXSA9IGJvZHkuaWQ7XG4gIF9udW1fb2JqZWN0cysrO1xuXG4gIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoe2NtZDogJ29iamVjdFJlYWR5JywgcGFyYW1zOiBib2R5LmlkfSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFkZFZlaGljbGUgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgY29uc3QgdmVoaWNsZV90dW5pbmcgPSBuZXcgQW1tby5idFZlaGljbGVUdW5pbmcoKTtcblxuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzKGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fc3RpZmZuZXNzKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uKGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fY29tcHJlc3Npb24pO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9zdXNwZW5zaW9uRGFtcGluZyhkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX2RhbXBpbmcpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20oZGVzY3JpcHRpb24ubWF4X3N1c3BlbnNpb25fdHJhdmVsKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvbkZvcmNlKGRlc2NyaXB0aW9uLm1heF9zdXNwZW5zaW9uX2ZvcmNlKTtcblxuICBjb25zdCB2ZWhpY2xlID0gbmV3IEFtbW8uYnRSYXljYXN0VmVoaWNsZShcbiAgICB2ZWhpY2xlX3R1bmluZyxcbiAgICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5yaWdpZEJvZHldLFxuICAgIG5ldyBBbW1vLmJ0RGVmYXVsdFZlaGljbGVSYXljYXN0ZXIod29ybGQpXG4gICk7XG5cbiAgdmVoaWNsZS50dW5pbmcgPSB2ZWhpY2xlX3R1bmluZztcbiAgX29iamVjdHNbZGVzY3JpcHRpb24ucmlnaWRCb2R5XS5zZXRBY3RpdmF0aW9uU3RhdGUoNCk7XG4gIHZlaGljbGUuc2V0Q29vcmRpbmF0ZVN5c3RlbSgwLCAxLCAyKTtcblxuICB3b3JsZC5hZGRWZWhpY2xlKHZlaGljbGUpO1xuICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdID0gdmVoaWNsZTtcbn07XG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZVZlaGljbGUgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSA9IG51bGw7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFkZFdoZWVsID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICBsZXQgdHVuaW5nID0gX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXS50dW5pbmc7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnR1bmluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0dW5pbmcgPSBuZXcgQW1tby5idFZlaGljbGVUdW5pbmcoKTtcbiAgICAgIHR1bmluZy5zZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzKGRlc2NyaXB0aW9uLnR1bmluZy5zdXNwZW5zaW9uX3N0aWZmbmVzcyk7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uKGRlc2NyaXB0aW9uLnR1bmluZy5zdXNwZW5zaW9uX2NvbXByZXNzaW9uKTtcbiAgICAgIHR1bmluZy5zZXRfbV9zdXNwZW5zaW9uRGFtcGluZyhkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9kYW1waW5nKTtcbiAgICAgIHR1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20oZGVzY3JpcHRpb24udHVuaW5nLm1heF9zdXNwZW5zaW9uX3RyYXZlbCk7XG4gICAgICB0dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvbkZvcmNlKGRlc2NyaXB0aW9uLnR1bmluZy5tYXhfc3VzcGVuc2lvbl9mb3JjZSk7XG4gICAgfVxuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLmNvbm5lY3Rpb25fcG9pbnQueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmNvbm5lY3Rpb25fcG9pbnQueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLmNvbm5lY3Rpb25fcG9pbnQueik7XG5cbiAgICBfdmVjM18yLnNldFgoZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLngpO1xuICAgIF92ZWMzXzIuc2V0WShkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueSk7XG4gICAgX3ZlYzNfMi5zZXRaKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi56KTtcblxuICAgIF92ZWMzXzMuc2V0WChkZXNjcmlwdGlvbi53aGVlbF9heGxlLngpO1xuICAgIF92ZWMzXzMuc2V0WShkZXNjcmlwdGlvbi53aGVlbF9heGxlLnkpO1xuICAgIF92ZWMzXzMuc2V0WihkZXNjcmlwdGlvbi53aGVlbF9heGxlLnopO1xuXG4gICAgX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXS5hZGRXaGVlbChcbiAgICAgIF92ZWMzXzEsXG4gICAgICBfdmVjM18yLFxuICAgICAgX3ZlYzNfMyxcbiAgICAgIGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fcmVzdF9sZW5ndGgsXG4gICAgICBkZXNjcmlwdGlvbi53aGVlbF9yYWRpdXMsXG4gICAgICB0dW5pbmcsXG4gICAgICBkZXNjcmlwdGlvbi5pc19mcm9udF93aGVlbFxuICAgICk7XG4gIH1cblxuICBfbnVtX3doZWVscysrO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDEgKyBfbnVtX3doZWVscyAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICYgKCAjIG9mIG9iamVjdHMgdG8gcmVwb3J0ICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdCApXG4gICAgdmVoaWNsZXJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDtcbiAgfSBlbHNlIHZlaGljbGVyZXBvcnQgPSBbTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUXTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0U3RlZXJpbmcgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5zZXRTdGVlcmluZ1ZhbHVlKGRldGFpbHMuc3RlZXJpbmcsIGRldGFpbHMud2hlZWwpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRCcmFrZSA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLnNldEJyYWtlKGRldGFpbHMuYnJha2UsIGRldGFpbHMud2hlZWwpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUVuZ2luZUZvcmNlID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uYXBwbHlFbmdpbmVGb3JjZShkZXRhaWxzLmZvcmNlLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMucmVtb3ZlT2JqZWN0ID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF9vYmplY3RzW2RldGFpbHMuaWRdLnR5cGUgPT09IDApIHtcbiAgICBfbnVtX3NvZnRib2R5X29iamVjdHMtLTtcbiAgICBfc29mdGJvZHlfcmVwb3J0X3NpemUgLT0gX29iamVjdHNbZGV0YWlscy5pZF0uZ2V0X21fbm9kZXMoKS5zaXplKCk7XG4gICAgd29ybGQucmVtb3ZlU29mdEJvZHkoX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICB9IGVsc2UgaWYgKF9vYmplY3RzW2RldGFpbHMuaWRdLnR5cGUgPT09IDEpIHtcbiAgICBfbnVtX3JpZ2lkYm9keV9vYmplY3RzLS07XG4gICAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KF9vYmplY3RzW2RldGFpbHMuaWRdKTtcbiAgICBBbW1vLmRlc3Ryb3koX21vdGlvbl9zdGF0ZXNbZGV0YWlscy5pZF0pO1xuICB9XG5cbiAgQW1tby5kZXN0cm95KF9vYmplY3RzW2RldGFpbHMuaWRdKTtcbiAgaWYgKF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pIEFtbW8uZGVzdHJveShfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKTtcbiAgaWYgKF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKSBBbW1vLmRlc3Ryb3koX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pO1xuXG4gIF9vYmplY3RzX2FtbW9bX29iamVjdHNbZGV0YWlscy5pZF0uYSA9PT0gdW5kZWZpbmVkID8gX29iamVjdHNbZGV0YWlscy5pZF0uYSA6IF9vYmplY3RzW2RldGFpbHMuaWRdLnB0cl0gPSBudWxsO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gIF9tb3Rpb25fc3RhdGVzW2RldGFpbHMuaWRdID0gbnVsbDtcblxuICBpZiAoX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSkgX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gIGlmIChfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSkgX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBfbnVtX29iamVjdHMtLTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMudXBkYXRlVHJhbnNmb3JtID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdCA9IF9vYmplY3RzW2RldGFpbHMuaWRdO1xuXG4gIGlmIChfb2JqZWN0LnR5cGUgPT09IDEpIHtcbiAgICBfb2JqZWN0LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICBpZiAoZGV0YWlscy5wb3MpIHtcbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvcy54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvcy55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvcy56KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzEpO1xuICAgIH1cblxuICAgIGlmIChkZXRhaWxzLnF1YXQpIHtcbiAgICAgIF9xdWF0LnNldFgoZGV0YWlscy5xdWF0LngpO1xuICAgICAgX3F1YXQuc2V0WShkZXRhaWxzLnF1YXQueSk7XG4gICAgICBfcXVhdC5zZXRaKGRldGFpbHMucXVhdC56KTtcbiAgICAgIF9xdWF0LnNldFcoZGV0YWlscy5xdWF0LncpO1xuICAgICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG4gICAgfVxuXG4gICAgX29iamVjdC5zZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcbiAgICBfb2JqZWN0LmFjdGl2YXRlKCk7XG4gIH0gZWxzZSBpZiAoX29iamVjdC50eXBlID09PSAwKSB7XG4gICAgLy8gX29iamVjdC5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgIGlmIChkZXRhaWxzLnBvcykge1xuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zLnopO1xuICAgICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgfVxuXG4gICAgaWYgKGRldGFpbHMucXVhdCkge1xuICAgICAgX3F1YXQuc2V0WChkZXRhaWxzLnF1YXQueCk7XG4gICAgICBfcXVhdC5zZXRZKGRldGFpbHMucXVhdC55KTtcbiAgICAgIF9xdWF0LnNldFooZGV0YWlscy5xdWF0LnopO1xuICAgICAgX3F1YXQuc2V0VyhkZXRhaWxzLnF1YXQudyk7XG4gICAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcbiAgICB9XG5cbiAgICBfb2JqZWN0LnRyYW5zZm9ybShfdHJhbnNmb3JtKTtcbiAgfVxufTtcblxucHVibGljX2Z1bmN0aW9ucy51cGRhdGVNYXNzID0gKGRldGFpbHMpID0+IHtcbiAgLy8gI1RPRE86IGNoYW5naW5nIGEgc3RhdGljIG9iamVjdCBpbnRvIGR5bmFtaWMgaXMgYnVnZ3lcbiAgX29iamVjdCA9IF9vYmplY3RzW2RldGFpbHMuaWRdO1xuXG4gIC8vIFBlciBodHRwOi8vd3d3LmJ1bGxldHBoeXNpY3Mub3JnL0J1bGxldC9waHBCQjMvdmlld3RvcGljLnBocD9wPSZmPTkmdD0zNjYzI3AxMzgxNlxuICB3b3JsZC5yZW1vdmVSaWdpZEJvZHkoX29iamVjdCk7XG5cbiAgX3ZlYzNfMS5zZXRYKDApO1xuICBfdmVjM18xLnNldFkoMCk7XG4gIF92ZWMzXzEuc2V0WigwKTtcblxuICBfb2JqZWN0LnNldE1hc3NQcm9wcyhkZXRhaWxzLm1hc3MsIF92ZWMzXzEpO1xuICB3b3JsZC5hZGRSaWdpZEJvZHkoX29iamVjdCk7XG4gIF9vYmplY3QuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlDZW50cmFsSW1wdWxzZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlDZW50cmFsSW1wdWxzZShfdmVjM18xKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlJbXB1bHNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMuaW1wdWxzZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMuaW1wdWxzZV95KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMuaW1wdWxzZV96KTtcblxuICBfdmVjM18yLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMi5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzIuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5SW1wdWxzZShcbiAgICBfdmVjM18xLFxuICAgIF92ZWMzXzJcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlUb3JxdWUgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy50b3JxdWVfeCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnRvcnF1ZV95KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMudG9ycXVlX3opO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5VG9ycXVlKFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlDZW50cmFsRm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5Q2VudHJhbEZvcmNlKF92ZWMzXzEpO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUZvcmNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMuZm9yY2VfeCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLmZvcmNlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy5mb3JjZV96KTtcblxuICBfdmVjM18yLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMi5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzIuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5Rm9yY2UoXG4gICAgX3ZlYzNfMSxcbiAgICBfdmVjM18yXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLm9uU2ltdWxhdGlvblJlc3VtZSA9ICgpID0+IHtcbiAgbGFzdF9zaW11bGF0aW9uX3RpbWUgPSBEYXRlLm5vdygpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRBbmd1bGFyVmVsb2NpdHkgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldEFuZ3VsYXJWZWxvY2l0eShcbiAgICBfdmVjM18xXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldExpbmVhclZlbG9jaXR5ID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRMaW5lYXJWZWxvY2l0eShcbiAgICBfdmVjM18xXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEFuZ3VsYXJGYWN0b3IgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldEFuZ3VsYXJGYWN0b3IoXG4gICAgICBfdmVjM18xXG4gICk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldExpbmVhckZhY3RvciA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0TGluZWFyRmFjdG9yKFxuICAgIF92ZWMzXzFcbiAgKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0RGFtcGluZyA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldERhbXBpbmcoZGV0YWlscy5saW5lYXIsIGRldGFpbHMuYW5ndWxhcik7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldENjZE1vdGlvblRocmVzaG9sZCA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldENjZE1vdGlvblRocmVzaG9sZChkZXRhaWxzLnRocmVzaG9sZCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldENjZFN3ZXB0U3BoZXJlUmFkaXVzID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMoZGV0YWlscy5yYWRpdXMpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRDb25zdHJhaW50ID0gKGRldGFpbHMpID0+IHtcbiAgbGV0IGNvbnN0cmFpbnQ7XG5cbiAgc3dpdGNoIChkZXRhaWxzLnR5cGUpIHtcblxuICAgIGNhc2UgJ3BvaW50Jzoge1xuICAgICAgaWYgKGRldGFpbHMub2JqZWN0YiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0UG9pbnQyUG9pbnRDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX3ZlYzNfMVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFBvaW50MlBvaW50Q29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnaGluZ2UnOiB7XG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5heGlzLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5heGlzLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5heGlzLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEhpbmdlQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMlxuICAgICAgICApO1xuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgX3ZlYzNfMy5zZXRYKGRldGFpbHMuYXhpcy54KTtcbiAgICAgICAgX3ZlYzNfMy5zZXRZKGRldGFpbHMuYXhpcy55KTtcbiAgICAgICAgX3ZlYzNfMy5zZXRaKGRldGFpbHMuYXhpcy56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRIaW5nZUNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMixcbiAgICAgICAgICBfdmVjM18zLFxuICAgICAgICAgIF92ZWMzXzNcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdzbGlkZXInOiB7XG4gICAgICBsZXQgdHJhbnNmb3JtYjtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWEgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuXG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgIHRyYW5zZm9ybWEuc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm1hLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlcihkZXRhaWxzLmF4aXMueCwgZGV0YWlscy5heGlzLnksIGRldGFpbHMuYXhpcy56KTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiKSB7XG4gICAgICAgIHRyYW5zZm9ybWIgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgdHJhbnNmb3JtYi5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1iLmdldFJvdGF0aW9uKCk7XG4gICAgICAgIHJvdGF0aW9uLnNldEV1bGVyKGRldGFpbHMuYXhpcy54LCBkZXRhaWxzLmF4aXMueSwgZGV0YWlscy5heGlzLnopO1xuICAgICAgICB0cmFuc2Zvcm1iLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRTbGlkZXJDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRyYW5zZm9ybWIsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0U2xpZGVyQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBpZiAodHJhbnNmb3JtYiAhPT0gdW5kZWZpbmVkKSBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjb25ldHdpc3QnOiB7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgY29uc3QgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1iLnNldElkZW50aXR5KCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm1hLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYS56LCAtZGV0YWlscy5heGlzYS55LCAtZGV0YWlscy5heGlzYS54KTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNiLnosIC1kZXRhaWxzLmF4aXNiLnksIC1kZXRhaWxzLmF4aXNiLngpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idENvbmVUd2lzdENvbnN0cmFpbnQoXG4gICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgIHRyYW5zZm9ybWJcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0cmFpbnQuc2V0TGltaXQoTWF0aC5QSSwgMCwgTWF0aC5QSSk7XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2RvZic6IHtcbiAgICAgIGxldCB0cmFuc2Zvcm1iO1xuXG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2EueiwgLWRldGFpbHMuYXhpc2EueSwgLWRldGFpbHMuYXhpc2EueCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgaWYgKGRldGFpbHMub2JqZWN0Yikge1xuICAgICAgICB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRJZGVudGl0eSgpO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgdHJhbnNmb3JtYi5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1iLmdldFJvdGF0aW9uKCk7XG4gICAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNiLnosIC1kZXRhaWxzLmF4aXNiLnksIC1kZXRhaWxzLmF4aXNiLngpO1xuICAgICAgICB0cmFuc2Zvcm1iLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRHZW5lcmljNkRvZkNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJhbnNmb3JtYixcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRHZW5lcmljNkRvZkNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3RyYWludC50YSA9IHRyYW5zZm9ybWE7XG4gICAgICBjb25zdHJhaW50LnRiID0gdHJhbnNmb3JtYjtcblxuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWEpO1xuICAgICAgaWYgKHRyYW5zZm9ybWIgIT09IHVuZGVmaW5lZCkgQW1tby5kZXN0cm95KHRyYW5zZm9ybWIpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybjtcbiAgfVxuXG4gIHdvcmxkLmFkZENvbnN0cmFpbnQoY29uc3RyYWludCk7XG5cbiAgY29uc3RyYWludC5hID0gX29iamVjdHNbZGV0YWlscy5vYmplY3RhXTtcbiAgY29uc3RyYWludC5iID0gX29iamVjdHNbZGV0YWlscy5vYmplY3RiXTtcblxuICBjb25zdHJhaW50LmVuYWJsZUZlZWRiYWNrKCk7XG4gIF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXSA9IGNvbnN0cmFpbnQ7XG4gIF9udW1fY29uc3RyYWludHMrKztcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgxICsgX251bV9jb25zdHJhaW50cyAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICYgKCAjIG9mIG9iamVjdHMgdG8gcmVwb3J0ICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdCApXG4gICAgY29uc3RyYWludHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDtcbiAgfSBlbHNlIGNvbnN0cmFpbnRyZXBvcnQgPSBbTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUXTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMucmVtb3ZlQ29uc3RyYWludCA9IChkZXRhaWxzKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbZGV0YWlscy5pZF07XG5cbiAgaWYgKGNvbnN0cmFpbnQgIT09IHVuZGVmaW5lZCkge1xuICAgIHdvcmxkLnJlbW92ZUNvbnN0cmFpbnQoY29uc3RyYWludCk7XG4gICAgX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgICBfbnVtX2NvbnN0cmFpbnRzLS07XG4gIH1cbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uc3RyYWludF9zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQgPSAoZGV0YWlscykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdO1xuICBpZiAoY29uc3RyYWludCAhPT0gdW5kZWZpbmQpIGNvbnN0cmFpbnQuc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkKGRldGFpbHMudGhyZXNob2xkKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2ltdWxhdGUgPSAocGFyYW1zID0ge30pID0+IHtcbiAgaWYgKHdvcmxkKSB7XG4gICAgaWYgKHBhcmFtcy50aW1lU3RlcCAmJiBwYXJhbXMudGltZVN0ZXAgPCBmaXhlZFRpbWVTdGVwKVxuICAgICAgcGFyYW1zLnRpbWVTdGVwID0gZml4ZWRUaW1lU3RlcDtcblxuICAgIHBhcmFtcy5tYXhTdWJTdGVwcyA9IHBhcmFtcy5tYXhTdWJTdGVwcyB8fCBNYXRoLmNlaWwocGFyYW1zLnRpbWVTdGVwIC8gZml4ZWRUaW1lU3RlcCk7IC8vIElmIG1heFN1YlN0ZXBzIGlzIG5vdCBkZWZpbmVkLCBrZWVwIHRoZSBzaW11bGF0aW9uIGZ1bGx5IHVwIHRvIGRhdGVcblxuICAgIHdvcmxkLnN0ZXBTaW11bGF0aW9uKHBhcmFtcy50aW1lU3RlcCwgcGFyYW1zLm1heFN1YlN0ZXBzLCBmaXhlZFRpbWVTdGVwKTtcblxuICAgIGlmIChfdmVoaWNsZXMubGVuZ3RoID4gMCkgcmVwb3J0VmVoaWNsZXMoKTtcbiAgICByZXBvcnRDb2xsaXNpb25zKCk7XG4gICAgaWYgKF9jb25zdHJhaW50cy5sZW5ndGggPiAwKSByZXBvcnRDb25zdHJhaW50cygpO1xuICAgIHJlcG9ydFdvcmxkKCk7XG4gICAgaWYgKF9zb2Z0Ym9keV9lbmFibGVkKSByZXBvcnRXb3JsZF9zb2Z0Ym9kaWVzKCk7XG4gIH1cbn07XG5cbi8vIENvbnN0cmFpbnQgZnVuY3Rpb25zXG5wdWJsaWNfZnVuY3Rpb25zLmhpbmdlX3NldExpbWl0cyA9IChwYXJhbXMpID0+IHtcbiAgX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XS5zZXRMaW1pdChwYXJhbXMubG93LCBwYXJhbXMuaGlnaCwgMCwgcGFyYW1zLmJpYXNfZmFjdG9yLCBwYXJhbXMucmVsYXhhdGlvbl9mYWN0b3IpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LmVuYWJsZUFuZ3VsYXJNb3Rvcih0cnVlLCBwYXJhbXMudmVsb2NpdHksIHBhcmFtcy5hY2NlbGVyYXRpb24pO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmhpbmdlX2Rpc2FibGVNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XS5lbmFibGVNb3RvcihmYWxzZSk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfc2V0TGltaXRzID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRMb3dlckxpbkxpbWl0KHBhcmFtcy5saW5fbG93ZXIgfHwgMCk7XG4gIGNvbnN0cmFpbnQuc2V0VXBwZXJMaW5MaW1pdChwYXJhbXMubGluX3VwcGVyIHx8IDApO1xuXG4gIGNvbnN0cmFpbnQuc2V0TG93ZXJBbmdMaW1pdChwYXJhbXMuYW5nX2xvd2VyIHx8IDApO1xuICBjb25zdHJhaW50LnNldFVwcGVyQW5nTGltaXQocGFyYW1zLmFuZ191cHBlciB8fCAwKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX3NldFJlc3RpdHV0aW9uID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRTb2Z0bmVzc0xpbUxpbihwYXJhbXMubGluZWFyIHx8IDApO1xuICBjb25zdHJhaW50LnNldFNvZnRuZXNzTGltQW5nKHBhcmFtcy5hbmd1bGFyIHx8IDApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZW5hYmxlTGluZWFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFRhcmdldExpbk1vdG9yVmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgY29uc3RyYWludC5zZXRNYXhMaW5Nb3RvckZvcmNlKHBhcmFtcy5hY2NlbGVyYXRpb24pO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRMaW5Nb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZGlzYWJsZUxpbmVhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkTGluTW90b3IoZmFsc2UpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0VGFyZ2V0QW5nTW90b3JWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBjb25zdHJhaW50LnNldE1heEFuZ01vdG9yRm9yY2UocGFyYW1zLmFjY2VsZXJhdGlvbik7XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZEFuZ01vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9kaXNhYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkQW5nTW90b3IoZmFsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XS5zZXRMaW1pdChwYXJhbXMueiwgcGFyYW1zLnksIHBhcmFtcy54KTsgLy8gWllYIG9yZGVyXG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9lbmFibGVNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuZW5hYmxlTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X3NldE1heE1vdG9ySW1wdWxzZSA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0TWF4TW90b3JJbXB1bHNlKHBhcmFtcy5tYXhfaW1wdWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X3NldE1vdG9yVGFyZ2V0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfcXVhdC5zZXRYKHBhcmFtcy54KTtcbiAgX3F1YXQuc2V0WShwYXJhbXMueSk7XG4gIF9xdWF0LnNldFoocGFyYW1zLnopO1xuICBfcXVhdC5zZXRXKHBhcmFtcy53KTtcblxuICBjb25zdHJhaW50LnNldE1vdG9yVGFyZ2V0KF9xdWF0KTtcblxuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9kaXNhYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LmVuYWJsZU1vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0TGluZWFyTG93ZXJMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3ZlYzNfMS5zZXRYKHBhcmFtcy54KTtcbiAgX3ZlYzNfMS5zZXRZKHBhcmFtcy55KTtcbiAgX3ZlYzNfMS5zZXRaKHBhcmFtcy56KTtcblxuICBjb25zdHJhaW50LnNldExpbmVhckxvd2VyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0TGluZWFyVXBwZXJMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3ZlYzNfMS5zZXRYKHBhcmFtcy54KTtcbiAgX3ZlYzNfMS5zZXRZKHBhcmFtcy55KTtcbiAgX3ZlYzNfMS5zZXRaKHBhcmFtcy56KTtcblxuICBjb25zdHJhaW50LnNldExpbmVhclVwcGVyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0QW5ndWxhckxvd2VyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRBbmd1bGFyTG93ZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRBbmd1bGFyVXBwZXJMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3ZlYzNfMS5zZXRYKHBhcmFtcy54KTtcbiAgX3ZlYzNfMS5zZXRZKHBhcmFtcy55KTtcbiAgX3ZlYzNfMS5zZXRaKHBhcmFtcy56KTtcblxuICBjb25zdHJhaW50LnNldEFuZ3VsYXJVcHBlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX2VuYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgY29uc3QgbW90b3IgPSBjb25zdHJhaW50LmdldFJvdGF0aW9uYWxMaW1pdE1vdG9yKHBhcmFtcy53aGljaCk7XG4gIG1vdG9yLnNldF9tX2VuYWJsZU1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0sXG4gICAgbW90b3IgPSBjb25zdHJhaW50LmdldFJvdGF0aW9uYWxMaW1pdE1vdG9yKHBhcmFtcy53aGljaCk7XG5cbiAgbW90b3Iuc2V0X21fbG9MaW1pdChwYXJhbXMubG93X2FuZ2xlKTtcbiAgbW90b3Iuc2V0X21faGlMaW1pdChwYXJhbXMuaGlnaF9hbmdsZSk7XG4gIG1vdG9yLnNldF9tX3RhcmdldFZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIG1vdG9yLnNldF9tX21heE1vdG9yRm9yY2UocGFyYW1zLm1heF9mb3JjZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0sXG4gICAgbW90b3IgPSBjb25zdHJhaW50LmdldFJvdGF0aW9uYWxMaW1pdE1vdG9yKHBhcmFtcy53aGljaCk7XG5cbiAgbW90b3Iuc2V0X21fZW5hYmxlTW90b3IoZmFsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbmNvbnN0IHJlcG9ydFdvcmxkID0gKCkgPT4ge1xuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUgJiYgd29ybGRyZXBvcnQubGVuZ3RoIDwgMiArIF9udW1fcmlnaWRib2R5X29iamVjdHMgKiBXT1JMRFJFUE9SVF9JVEVNU0laRSkge1xuICAgIHdvcmxkcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgIDIvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgKyAoTWF0aC5jZWlsKF9udW1fcmlnaWRib2R5X29iamVjdHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogV09STERSRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgKTtcblxuICAgIHdvcmxkcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDtcbiAgfVxuXG4gIHdvcmxkcmVwb3J0WzFdID0gX251bV9yaWdpZGJvZHlfb2JqZWN0czsgLy8gcmVjb3JkIGhvdyBtYW55IG9iamVjdHMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAge1xuICAgIGxldCBpID0gMCxcbiAgICAgIGluZGV4ID0gX29iamVjdHMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IG9iamVjdCA9IF9vYmplY3RzW2luZGV4XTtcblxuICAgICAgaWYgKG9iamVjdCAmJiBvYmplY3QudHlwZSA9PT0gMSkgeyAvLyBSaWdpZEJvZGllcy5cbiAgICAgICAgLy8gI1RPRE86IHdlIGNhbid0IHVzZSBjZW50ZXIgb2YgbWFzcyB0cmFuc2Zvcm0gd2hlbiBjZW50ZXIgb2YgbWFzcyBjYW4gY2hhbmdlLFxuICAgICAgICAvLyAgICAgICAgYnV0IGdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oKSBzY3Jld3MgdXAgb24gb2JqZWN0cyB0aGF0IGhhdmUgYmVlbiBtb3ZlZFxuICAgICAgICAvLyBvYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybSggdHJhbnNmb3JtICk7XG4gICAgICAgIC8vIG9iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IG9iamVjdC5nZXRDZW50ZXJPZk1hc3NUcmFuc2Zvcm0oKTtcbiAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuICAgICAgICBjb25zdCByb3RhdGlvbiA9IHRyYW5zZm9ybS5nZXRSb3RhdGlvbigpO1xuXG4gICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyAoaSsrKSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldF0gPSBvYmplY3QuaWQ7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBvcmlnaW4ueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnooKTtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA0XSA9IHJvdGF0aW9uLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNV0gPSByb3RhdGlvbi55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDZdID0gcm90YXRpb24ueigpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA3XSA9IHJvdGF0aW9uLncoKTtcblxuICAgICAgICBfdmVjdG9yID0gb2JqZWN0LmdldExpbmVhclZlbG9jaXR5KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDhdID0gX3ZlY3Rvci54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDldID0gX3ZlY3Rvci55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEwXSA9IF92ZWN0b3IueigpO1xuXG4gICAgICAgIF92ZWN0b3IgPSBvYmplY3QuZ2V0QW5ndWxhclZlbG9jaXR5KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDExXSA9IF92ZWN0b3IueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMl0gPSBfdmVjdG9yLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTNdID0gX3ZlY3Rvci56KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB0cmFuc2ZlcmFibGVNZXNzYWdlKHdvcmxkcmVwb3J0LmJ1ZmZlciwgW3dvcmxkcmVwb3J0LmJ1ZmZlcl0pO1xuICBlbHNlIHRyYW5zZmVyYWJsZU1lc3NhZ2Uod29ybGRyZXBvcnQpO1xufTtcblxuY29uc3QgcmVwb3J0V29ybGRfc29mdGJvZGllcyA9ICgpID0+IHtcbiAgLy8gVE9ETzogQWRkIFNVUFBPUlRUUkFOU0ZFUkFCTEUuXG5cbiAgc29mdHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICsgX251bV9zb2Z0Ym9keV9vYmplY3RzICogMlxuICAgICsgX3NvZnRib2R5X3JlcG9ydF9zaXplICogNlxuICApO1xuXG4gIHNvZnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlNPRlRSRVBPUlQ7XG4gIHNvZnRyZXBvcnRbMV0gPSBfbnVtX3NvZnRib2R5X29iamVjdHM7IC8vIHJlY29yZCBob3cgbWFueSBvYmplY3RzIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIHtcbiAgICBsZXQgb2Zmc2V0ID0gMixcbiAgICAgIGluZGV4ID0gX29iamVjdHMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IG9iamVjdCA9IF9vYmplY3RzW2luZGV4XTtcblxuICAgICAgaWYgKG9iamVjdCAmJiBvYmplY3QudHlwZSA9PT0gMCkgeyAvLyBTb2Z0Qm9kaWVzLlxuXG4gICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0XSA9IG9iamVjdC5pZDtcblxuICAgICAgICBjb25zdCBvZmZzZXRWZXJ0ID0gb2Zmc2V0ICsgMjtcblxuICAgICAgICBpZiAob2JqZWN0LnJvcGUgPT09IHRydWUpIHtcbiAgICAgICAgICBjb25zdCBub2RlcyA9IG9iamVjdC5nZXRfbV9ub2RlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBub2Rlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzLmF0KGkpO1xuICAgICAgICAgICAgY29uc3QgdmVydCA9IG5vZGUuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiAzO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0LngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMV0gPSB2ZXJ0LnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0LnooKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvZmZzZXQgKz0gc2l6ZSAqIDMgKyAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9iamVjdC5jbG90aCkge1xuICAgICAgICAgIGNvbnN0IG5vZGVzID0gb2JqZWN0LmdldF9tX25vZGVzKCk7XG4gICAgICAgICAgY29uc3Qgc2l6ZSA9IG5vZGVzLnNpemUoKTtcbiAgICAgICAgICBzb2Z0cmVwb3J0W29mZnNldCArIDFdID0gc2l6ZTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXMuYXQoaSk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0ID0gbm9kZS5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwgPSBub2RlLmdldF9tX24oKTtcbiAgICAgICAgICAgIGNvbnN0IG9mZiA9IG9mZnNldFZlcnQgKyBpICogNjtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydC54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydC55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDJdID0gdmVydC56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgM10gPSBub3JtYWwueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA0XSA9IG5vcm1hbC55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDVdID0gbm9ybWFsLnooKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvZmZzZXQgKz0gc2l6ZSAqIDYgKyAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGZhY2VzID0gb2JqZWN0LmdldF9tX2ZhY2VzKCk7XG4gICAgICAgICAgY29uc3Qgc2l6ZSA9IGZhY2VzLnNpemUoKTtcbiAgICAgICAgICBzb2Z0cmVwb3J0W29mZnNldCArIDFdID0gc2l6ZTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBmYWNlID0gZmFjZXMuYXQoaSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUxID0gZmFjZS5nZXRfbV9uKDApO1xuICAgICAgICAgICAgY29uc3Qgbm9kZTIgPSBmYWNlLmdldF9tX24oMSk7XG4gICAgICAgICAgICBjb25zdCBub2RlMyA9IGZhY2UuZ2V0X21fbigyKTtcblxuICAgICAgICAgICAgY29uc3QgdmVydDEgPSBub2RlMS5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0MiA9IG5vZGUyLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQzID0gbm9kZTMuZ2V0X21feCgpO1xuXG4gICAgICAgICAgICBjb25zdCBub3JtYWwxID0gbm9kZTEuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMiA9IG5vZGUyLmdldF9tX24oKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDMgPSBub2RlMy5nZXRfbV9uKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9mZiA9IG9mZnNldFZlcnQgKyBpICogMTg7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQxLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMV0gPSB2ZXJ0MS55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDJdID0gdmVydDEueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDNdID0gbm9ybWFsMS54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDRdID0gbm9ybWFsMS55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDVdID0gbm9ybWFsMS56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNl0gPSB2ZXJ0Mi54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDddID0gdmVydDIueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA4XSA9IHZlcnQyLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA5XSA9IG5vcm1hbDIueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMF0gPSBub3JtYWwyLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTFdID0gbm9ybWFsMi56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTJdID0gdmVydDMueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxM10gPSB2ZXJ0My55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE0XSA9IHZlcnQzLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNV0gPSBub3JtYWwzLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTZdID0gbm9ybWFsMy55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE3XSA9IG5vcm1hbDMueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogMTggKyAyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB0cmFuc2ZlcmFibGVNZXNzYWdlKHNvZnRyZXBvcnQuYnVmZmVyLCBbc29mdHJlcG9ydC5idWZmZXJdKTtcbiAgLy8gZWxzZSB0cmFuc2ZlcmFibGVNZXNzYWdlKHNvZnRyZXBvcnQpO1xuICB0cmFuc2ZlcmFibGVNZXNzYWdlKHNvZnRyZXBvcnQpO1xufTtcblxuY29uc3QgcmVwb3J0Q29sbGlzaW9ucyA9ICgpID0+IHtcbiAgY29uc3QgZHAgPSB3b3JsZC5nZXREaXNwYXRjaGVyKCksXG4gICAgbnVtID0gZHAuZ2V0TnVtTWFuaWZvbGRzKCk7XG4gICAgLy8gX2NvbGxpZGVkID0gZmFsc2U7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgaWYgKGNvbGxpc2lvbnJlcG9ydC5sZW5ndGggPCAyICsgbnVtICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgICBjb2xsaXNpb25yZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICsgKE1hdGguY2VpbChfbnVtX29iamVjdHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIGNvbGxpc2lvbnJlcG9ydFsxXSA9IDA7IC8vIGhvdyBtYW55IGNvbGxpc2lvbnMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW07IGkrKykge1xuICAgIGNvbnN0IG1hbmlmb2xkID0gZHAuZ2V0TWFuaWZvbGRCeUluZGV4SW50ZXJuYWwoaSksXG4gICAgICBudW1fY29udGFjdHMgPSBtYW5pZm9sZC5nZXROdW1Db250YWN0cygpO1xuXG4gICAgaWYgKG51bV9jb250YWN0cyA9PT0gMCkgY29udGludWU7XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG51bV9jb250YWN0czsgaisrKSB7XG4gICAgICBjb25zdCBwdCA9IG1hbmlmb2xkLmdldENvbnRhY3RQb2ludChqKTtcblxuICAgICAgLy8gaWYgKCBwdC5nZXREaXN0YW5jZSgpIDwgMCApIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyAoY29sbGlzaW9ucmVwb3J0WzFdKyspICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldF0gPSBfb2JqZWN0c19hbW1vW21hbmlmb2xkLmdldEJvZHkwKCkucHRyXTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAxXSA9IF9vYmplY3RzX2FtbW9bbWFuaWZvbGQuZ2V0Qm9keTEoKS5wdHJdO1xuXG4gICAgICBfdmVjdG9yID0gcHQuZ2V0X21fbm9ybWFsV29ybGRPbkIoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAyXSA9IF92ZWN0b3IueCgpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDNdID0gX3ZlY3Rvci55KCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgNF0gPSBfdmVjdG9yLnooKTtcbiAgICAgIGJyZWFrO1xuICAgICAgLy8gfVxuICAgICAgLy8gdHJhbnNmZXJhYmxlTWVzc2FnZShfb2JqZWN0c19hbW1vKTtcbiAgICB9XG4gIH1cblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHRyYW5zZmVyYWJsZU1lc3NhZ2UoY29sbGlzaW9ucmVwb3J0LmJ1ZmZlciwgW2NvbGxpc2lvbnJlcG9ydC5idWZmZXJdKTtcbiAgZWxzZSB0cmFuc2ZlcmFibGVNZXNzYWdlKGNvbGxpc2lvbnJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRWZWhpY2xlcyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgaWYgKHZlaGljbGVyZXBvcnQubGVuZ3RoIDwgMiArIF9udW1fd2hlZWxzICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgKyAoTWF0aC5jZWlsKF9udW1fd2hlZWxzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgICApO1xuICAgICAgdmVoaWNsZXJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDtcbiAgICB9XG4gIH1cblxuICB7XG4gICAgbGV0IGkgPSAwLFxuICAgICAgaiA9IDAsXG4gICAgICBpbmRleCA9IF92ZWhpY2xlcy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgaWYgKF92ZWhpY2xlc1tpbmRleF0pIHtcbiAgICAgICAgY29uc3QgdmVoaWNsZSA9IF92ZWhpY2xlc1tpbmRleF07XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHZlaGljbGUuZ2V0TnVtV2hlZWxzKCk7IGorKykge1xuICAgICAgICAgIC8vIHZlaGljbGUudXBkYXRlV2hlZWxUcmFuc2Zvcm0oIGosIHRydWUgKTtcbiAgICAgICAgICAvLyB0cmFuc2Zvcm0gPSB2ZWhpY2xlLmdldFdoZWVsVHJhbnNmb3JtV1MoIGogKTtcbiAgICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB2ZWhpY2xlLmdldFdoZWVsSW5mbyhqKS5nZXRfbV93b3JsZFRyYW5zZm9ybSgpO1xuXG4gICAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuICAgICAgICAgIGNvbnN0IHJvdGF0aW9uID0gdHJhbnNmb3JtLmdldFJvdGF0aW9uKCk7XG5cbiAgICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyAoaSsrKSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldF0gPSBpbmRleDtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDFdID0gajtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueCgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgM10gPSBvcmlnaW4ueSgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNF0gPSBvcmlnaW4ueigpO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA1XSA9IHJvdGF0aW9uLngoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDZdID0gcm90YXRpb24ueSgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgN10gPSByb3RhdGlvbi56KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA4XSA9IHJvdGF0aW9uLncoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSAmJiBqICE9PSAwKSB0cmFuc2ZlcmFibGVNZXNzYWdlKHZlaGljbGVyZXBvcnQuYnVmZmVyLCBbdmVoaWNsZXJlcG9ydC5idWZmZXJdKTtcbiAgICBlbHNlIGlmIChqICE9PSAwKSB0cmFuc2ZlcmFibGVNZXNzYWdlKHZlaGljbGVyZXBvcnQpO1xuICB9XG59O1xuXG5jb25zdCByZXBvcnRDb25zdHJhaW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgaWYgKGNvbnN0cmFpbnRyZXBvcnQubGVuZ3RoIDwgMiArIF9udW1fY29uc3RyYWludHMgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArIChNYXRoLmNlaWwoX251bV9jb25zdHJhaW50cyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAge1xuICAgIGxldCBvZmZzZXQgPSAwLFxuICAgICAgaSA9IDAsXG4gICAgICBpbmRleCA9IF9jb25zdHJhaW50cy5sZW5naHQ7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgaWYgKF9jb25zdHJhaW50c1tpbmRleF0pIHtcbiAgICAgICAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tpbmRleF07XG4gICAgICAgIGNvbnN0IG9mZnNldF9ib2R5ID0gY29uc3RyYWludC5hO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBjb25zdHJhaW50LnRhO1xuICAgICAgICBjb25zdCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XG5cbiAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgb2Zmc2V0ID0gMSArIChpKyspICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldF0gPSBpbmRleDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAxXSA9IG9mZnNldF9ib2R5LmlkO1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLng7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgM10gPSBvcmlnaW4ueTtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyA0XSA9IG9yaWdpbi56O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDVdID0gY29uc3RyYWludC5nZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUgJiYgaSAhPT0gMCkgdHJhbnNmZXJhYmxlTWVzc2FnZShjb25zdHJhaW50cmVwb3J0LmJ1ZmZlciwgW2NvbnN0cmFpbnRyZXBvcnQuYnVmZmVyXSk7XG4gICAgZWxzZSBpZiAoaSAhPT0gMCkgdHJhbnNmZXJhYmxlTWVzc2FnZShjb25zdHJhaW50cmVwb3J0KTtcbiAgfVxufTtcblxuc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgaWYgKGV2ZW50LmRhdGEgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAvLyB0cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgc3dpdGNoIChldmVudC5kYXRhWzBdKSB7XG4gICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ6IHtcbiAgICAgICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ6IHtcbiAgICAgICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDoge1xuICAgICAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDoge1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgIH1cblxuICAgIHJldHVybjtcbiAgfSBlbHNlIGlmIChldmVudC5kYXRhLmNtZCAmJiBwdWJsaWNfZnVuY3Rpb25zW2V2ZW50LmRhdGEuY21kXSkgcHVibGljX2Z1bmN0aW9uc1tldmVudC5kYXRhLmNtZF0oZXZlbnQuZGF0YS5wYXJhbXMpO1xufTtcblxuXG59KTsiLCJpbXBvcnQge1xuICBTY2VuZSBhcyBTY2VuZU5hdGl2ZSxcbiAgTWVzaCxcbiAgU3BoZXJlR2VvbWV0cnksXG4gIE1lc2hOb3JtYWxNYXRlcmlhbCxcbiAgQm94R2VvbWV0cnksXG4gIFZlY3RvcjNcbn0gZnJvbSAndGhyZWUnO1xuXG5pbXBvcnQge0xvb3B9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7VmVoaWNsZX0gZnJvbSAnLi4vdmVoaWNsZS92ZWhpY2xlJztcbmltcG9ydCB7RXZlbnRhYmxlfSBmcm9tICcuLi9ldmVudGFibGUnO1xuXG5pbXBvcnQge1xuICBhZGRPYmplY3RDaGlsZHJlbixcbiAgTUVTU0FHRV9UWVBFUyxcbiAgdGVtcDFWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFXG59IGZyb20gJy4uL2FwaSc7XG5cbmltcG9ydCBQaHlzaWNzV29ya2VyIGZyb20gJ3dvcmtlciEuLi93b3JrZXIuanMnO1xuXG5leHBvcnQgY2xhc3MgV29ybGRNb2R1bGUgZXh0ZW5kcyBFdmVudGFibGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGZpeGVkVGltZVN0ZXA6IDEvNjAsXG4gICAgICByYXRlTGltaXQ6IHRydWUsXG4gICAgICBhbW1vOiBcIlwiLFxuICAgICAgc29mdGJvZHk6IGZhbHNlLFxuICAgICAgZ3Jhdml0eTogbmV3IFZlY3RvcjMoMCwgLTEwMCwgMClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgY29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIHRoaXMud29ya2VyID0gbmV3IFBoeXNpY3NXb3JrZXIoKTtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlID0gdGhpcy53b3JrZXIud2Via2l0UG9zdE1lc3NhZ2UgfHwgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2U7XG5cbiAgICB0aGlzLmlzTG9hZGVkID0gZmFsc2U7XG5cbiAgICB0aGlzLmxvYWRlciA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmIChwYXJhbXMud2FzbSkge1xuICAgICAgICBmZXRjaChwYXJhbXMud2FzbSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5hcnJheUJ1ZmZlcigpKVxuICAgICAgICAgIC50aGVuKGJ1ZmZlciA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhcmFtcy53YXNtQnVmZmVyID0gYnVmZmVyO1xuXG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGUoJ2luaXQnLCB0aGlzLnBhcmFtcyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlBoeXNpY3MgbG9hZGluZyB0aW1lOiBcIiArIChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSArIFwibXNcIik7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2luaXQnLCB0aGlzLnBhcmFtcyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMubG9hZGVyLnRoZW4oKCkgPT4ge3RoaXMuaXNMb2FkZWQgPSB0cnVlfSk7XG5cbiAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50cyA9IHt9O1xuICAgIHRoaXMuX29iamVjdHMgPSB7fTtcbiAgICB0aGlzLl92ZWhpY2xlcyA9IHt9O1xuICAgIHRoaXMuX2NvbnN0cmFpbnRzID0ge307XG4gICAgdGhpcy5faXNfc2ltdWxhdGluZyA9IGZhbHNlO1xuICAgIHRoaXMuZ2V0T2JqZWN0SWQgPSAoKCkgPT4ge1xuICAgICAgbGV0IF9pZCA9IDE7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICByZXR1cm4gX2lkKys7XG4gICAgICB9O1xuICAgIH0pKCk7XG5cbiAgICAvLyBUZXN0IFNVUFBPUlRfVFJBTlNGRVJBQkxFXG5cbiAgICBjb25zdCBhYiA9IG5ldyBBcnJheUJ1ZmZlcigxKTtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGFiLCBbYWJdKTtcbiAgICB0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFID0gKGFiLmJ5dGVMZW5ndGggPT09IDApO1xuXG4gICAgdGhpcy53b3JrZXIub25tZXNzYWdlID0gKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgX3RlbXAsXG4gICAgICAgIGRhdGEgPSBldmVudC5kYXRhO1xuXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyICYmIGRhdGEuYnl0ZUxlbmd0aCAhPT0gMSkvLyBieXRlTGVuZ3RoID09PSAxIGlzIHRoZSB3b3JrZXIgbWFraW5nIGEgU1VQUE9SVF9UUkFOU0ZFUkFCTEUgdGVzdFxuICAgICAgICBkYXRhID0gbmV3IEZsb2F0MzJBcnJheShkYXRhKTtcblxuICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgLy8gdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgICAgICBzd2l0Y2ggKGRhdGFbMF0pIHtcbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNjZW5lKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuU09GVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU29mdGJvZGllcyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sbGlzaW9ucyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZlaGljbGVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29uc3RyYWludHMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGRhdGEuY21kKSB7XG4gICAgICAgIC8vIG5vbi10cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgICAgIHN3aXRjaCAoZGF0YS5jbWQpIHtcbiAgICAgICAgICBjYXNlICdvYmplY3RSZWFkeSc6XG4gICAgICAgICAgICBfdGVtcCA9IGRhdGEucGFyYW1zO1xuICAgICAgICAgICAgaWYgKHRoaXMuX29iamVjdHNbX3RlbXBdKSB0aGlzLl9vYmplY3RzW190ZW1wXS5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd3b3JsZFJlYWR5JzpcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgncmVhZHknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAnYW1tb0xvYWRlZCc6XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2xvYWRlZCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJQaHlzaWNzIGxvYWRpbmcgdGltZTogXCIgKyAocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgKyBcIm1zXCIpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd2ZWhpY2xlJzpcbiAgICAgICAgICAgIHdpbmRvdy50ZXN0ID0gZGF0YTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIERvIG5vdGhpbmcsIGp1c3Qgc2hvdyB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgUmVjZWl2ZWQ6ICR7ZGF0YS5jbWR9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmRpcihkYXRhLnBhcmFtcyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoIChkYXRhWzBdKSB7XG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTY2VuZShkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sbGlzaW9ucyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZlaGljbGVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29uc3RyYWludHMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZVNjZW5lKGluZm8pIHtcbiAgICBsZXQgaW5kZXggPSBpbmZvWzFdO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyBpbmRleCAqIFJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMuX29iamVjdHNbaW5mb1tvZmZzZXRdXTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldChcbiAgICAgICAgICBpbmZvW29mZnNldCArIDFdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgMl0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAzXVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPT09IGZhbHNlKSB7XG4gICAgICAgIG9iamVjdC5xdWF0ZXJuaW9uLnNldChcbiAgICAgICAgICBpbmZvW29mZnNldCArIDRdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNV0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA2XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDddXG4gICAgICAgICk7XG5cbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBkYXRhLmxpbmVhclZlbG9jaXR5LnNldChcbiAgICAgICAgaW5mb1tvZmZzZXQgKyA4XSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyA5XSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMF1cbiAgICAgICk7XG5cbiAgICAgIGRhdGEuYW5ndWxhclZlbG9jaXR5LnNldChcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMV0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTJdLFxuICAgICAgICBpbmZvW29mZnNldCArIDEzXVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoaW5mby5idWZmZXIsIFtpbmZvLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcblxuICAgIHRoaXMuX2lzX3NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3VwZGF0ZScpO1xuICB9XG5cbiAgdXBkYXRlU29mdGJvZGllcyhpbmZvKSB7XG4gICAgbGV0IGluZGV4ID0gaW5mb1sxXSxcbiAgICAgIG9mZnNldCA9IDI7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgc2l6ZSA9IGluZm9bb2Zmc2V0ICsgMV07XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLl9vYmplY3RzW2luZm9bb2Zmc2V0XV07XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBkYXRhID0gb2JqZWN0LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBjb25zdCBhdHRyaWJ1dGVzID0gb2JqZWN0Lmdlb21ldHJ5LmF0dHJpYnV0ZXM7XG4gICAgICBjb25zdCB2b2x1bWVQb3NpdGlvbnMgPSBhdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgICBjb25zdCBvZmZzZXRWZXJ0ID0gb2Zmc2V0ICsgMjtcblxuICAgICAgLy8gY29uc29sZS5sb2coZGF0YS5pZCk7XG4gICAgICBpZiAoIWRhdGEuaXNTb2Z0Qm9keVJlc2V0KSB7XG4gICAgICAgIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIG9iamVjdC5xdWF0ZXJuaW9uLnNldCgwLCAwLCAwLCAwKTtcblxuICAgICAgICBkYXRhLmlzU29mdEJvZHlSZXNldCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLnR5cGUgPT09IFwic29mdFRyaW1lc2hcIikge1xuICAgICAgICBjb25zdCB2b2x1bWVOb3JtYWxzID0gYXR0cmlidXRlcy5ub3JtYWwuYXJyYXk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiAxODtcblxuICAgICAgICAgIGNvbnN0IHgxID0gaW5mb1tvZmZzXTtcbiAgICAgICAgICBjb25zdCB5MSA9IGluZm9bb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHoxID0gaW5mb1tvZmZzICsgMl07XG5cbiAgICAgICAgICBjb25zdCBueDEgPSBpbmZvW29mZnMgKyAzXTtcbiAgICAgICAgICBjb25zdCBueTEgPSBpbmZvW29mZnMgKyA0XTtcbiAgICAgICAgICBjb25zdCBuejEgPSBpbmZvW29mZnMgKyA1XTtcblxuICAgICAgICAgIGNvbnN0IHgyID0gaW5mb1tvZmZzICsgNl07XG4gICAgICAgICAgY29uc3QgeTIgPSBpbmZvW29mZnMgKyA3XTtcbiAgICAgICAgICBjb25zdCB6MiA9IGluZm9bb2ZmcyArIDhdO1xuXG4gICAgICAgICAgY29uc3QgbngyID0gaW5mb1tvZmZzICsgOV07XG4gICAgICAgICAgY29uc3QgbnkyID0gaW5mb1tvZmZzICsgMTBdO1xuICAgICAgICAgIGNvbnN0IG56MiA9IGluZm9bb2ZmcyArIDExXTtcblxuICAgICAgICAgIGNvbnN0IHgzID0gaW5mb1tvZmZzICsgMTJdO1xuICAgICAgICAgIGNvbnN0IHkzID0gaW5mb1tvZmZzICsgMTNdO1xuICAgICAgICAgIGNvbnN0IHozID0gaW5mb1tvZmZzICsgMTRdO1xuXG4gICAgICAgICAgY29uc3QgbngzID0gaW5mb1tvZmZzICsgMTVdO1xuICAgICAgICAgIGNvbnN0IG55MyA9IGluZm9bb2ZmcyArIDE2XTtcbiAgICAgICAgICBjb25zdCBuejMgPSBpbmZvW29mZnMgKyAxN107XG5cbiAgICAgICAgICBjb25zdCBpOSA9IGkgKiA5O1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5XSA9IHgxO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDFdID0geTE7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgMl0gPSB6MTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDNdID0geDI7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNF0gPSB5MjtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA1XSA9IHoyO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNl0gPSB4MztcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA3XSA9IHkzO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDhdID0gejM7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5XSA9IG54MTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgMV0gPSBueTE7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDJdID0gbnoxO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDNdID0gbngyO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA0XSA9IG55MjtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNV0gPSBuejI7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNl0gPSBueDM7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDddID0gbnkzO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA4XSA9IG56MztcbiAgICAgICAgfVxuXG4gICAgICAgIGF0dHJpYnV0ZXMubm9ybWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgb2Zmc2V0ICs9IDIgKyBzaXplICogMTg7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChkYXRhLnR5cGUgPT09IFwic29mdFJvcGVNZXNoXCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiAzO1xuXG4gICAgICAgICAgY29uc3QgeCA9IGluZm9bb2Zmc107XG4gICAgICAgICAgY29uc3QgeSA9IGluZm9bb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHogPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogM10gPSB4O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDFdID0geTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAyXSA9IHo7XG4gICAgICAgIH1cblxuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiAzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgdm9sdW1lTm9ybWFscyA9IGF0dHJpYnV0ZXMubm9ybWFsLmFycmF5O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogNjtcblxuICAgICAgICAgIGNvbnN0IHggPSBpbmZvW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkgPSBpbmZvW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6ID0gaW5mb1tvZmZzICsgMl07XG5cbiAgICAgICAgICBjb25zdCBueCA9IGluZm9bb2ZmcyArIDNdO1xuICAgICAgICAgIGNvbnN0IG55ID0gaW5mb1tvZmZzICsgNF07XG4gICAgICAgICAgY29uc3QgbnogPSBpbmZvW29mZnMgKyA1XTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogM10gPSB4O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDFdID0geTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAyXSA9IHo7XG5cbiAgICAgICAgICAvLyBGSVhNRTogTm9ybWFscyBhcmUgcG9pbnRlZCB0byBsb29rIGluc2lkZTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2kgKiAzXSA9IG54O1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDMgKyAxXSA9IG55O1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDMgKyAyXSA9IG56O1xuICAgICAgICB9XG5cbiAgICAgICAgYXR0cmlidXRlcy5ub3JtYWwubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiA2O1xuICAgICAgfVxuXG4gICAgICBhdHRyaWJ1dGVzLnBvc2l0aW9uLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAvLyAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoaW5mby5idWZmZXIsIFtpbmZvLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcblxuICAgIHRoaXMuX2lzX3NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIHVwZGF0ZVZlaGljbGVzKGRhdGEpIHtcbiAgICBsZXQgdmVoaWNsZSwgd2hlZWw7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IChkYXRhLmxlbmd0aCAtIDEpIC8gVkVISUNMRVJFUE9SVF9JVEVNU0laRTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAxICsgaSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkU7XG4gICAgICB2ZWhpY2xlID0gdGhpcy5fdmVoaWNsZXNbZGF0YVtvZmZzZXRdXTtcblxuICAgICAgaWYgKHZlaGljbGUgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICB3aGVlbCA9IHZlaGljbGUud2hlZWxzW2RhdGFbb2Zmc2V0ICsgMV1dO1xuXG4gICAgICB3aGVlbC5wb3NpdGlvbi5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgMl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgM10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNF1cbiAgICAgICk7XG5cbiAgICAgIHdoZWVsLnF1YXRlcm5pb24uc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDVdLFxuICAgICAgICBkYXRhW29mZnNldCArIDZdLFxuICAgICAgICBkYXRhW29mZnNldCArIDddLFxuICAgICAgICBkYXRhW29mZnNldCArIDhdXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29uc3RyYWludHMoZGF0YSkge1xuICAgIGxldCBjb25zdHJhaW50LCBvYmplY3Q7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IChkYXRhLmxlbmd0aCAtIDEpIC8gQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAxICsgaSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdHJhaW50ID0gdGhpcy5fY29uc3RyYWludHNbZGF0YVtvZmZzZXRdXTtcbiAgICAgIG9iamVjdCA9IHRoaXMuX29iamVjdHNbZGF0YVtvZmZzZXQgKyAxXV07XG5cbiAgICAgIGlmIChjb25zdHJhaW50ID09PSB1bmRlZmluZWQgfHwgb2JqZWN0ID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDJdLFxuICAgICAgICBkYXRhW29mZnNldCArIDNdLFxuICAgICAgICBkYXRhW29mZnNldCArIDRdXG4gICAgICApO1xuXG4gICAgICB0ZW1wMU1hdHJpeDQuZXh0cmFjdFJvdGF0aW9uKG9iamVjdC5tYXRyaXgpO1xuICAgICAgdGVtcDFWZWN0b3IzLmFwcGx5TWF0cml4NCh0ZW1wMU1hdHJpeDQpO1xuXG4gICAgICBjb25zdHJhaW50LnBvc2l0aW9uYS5hZGRWZWN0b3JzKG9iamVjdC5wb3NpdGlvbiwgdGVtcDFWZWN0b3IzKTtcbiAgICAgIGNvbnN0cmFpbnQuYXBwbGllZEltcHVsc2UgPSBkYXRhW29mZnNldCArIDVdO1xuICAgIH1cblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29sbGlzaW9ucyhpbmZvKSB7XG4gICAgLyoqXG4gICAgICogI1RPRE9cbiAgICAgKiBUaGlzIGlzIHByb2JhYmx5IHRoZSB3b3JzdCB3YXkgZXZlciB0byBoYW5kbGUgY29sbGlzaW9ucy4gVGhlIGluaGVyZW50IGV2aWxuZXNzIGlzIGEgcmVzaWR1YWxcbiAgICAgKiBlZmZlY3QgZnJvbSB0aGUgcHJldmlvdXMgdmVyc2lvbidzIGV2aWxuZXNzIHdoaWNoIG11dGF0ZWQgd2hlbiBzd2l0Y2hpbmcgdG8gdHJhbnNmZXJhYmxlIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgZmVlbCBpbmNsaW5lZCB0byBtYWtlIHRoaXMgYmV0dGVyLCBwbGVhc2UgZG8gc28uXG4gICAgICovXG5cbiAgICBjb25zdCBjb2xsaXNpb25zID0ge30sXG4gICAgICBub3JtYWxfb2Zmc2V0cyA9IHt9O1xuXG4gICAgLy8gQnVpbGQgY29sbGlzaW9uIG1hbmlmZXN0XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmZvWzFdOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyBpICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gaW5mb1tvZmZzZXRdO1xuICAgICAgY29uc3Qgb2JqZWN0MiA9IGluZm9bb2Zmc2V0ICsgMV07XG5cbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdH0tJHtvYmplY3QyfWBdID0gb2Zmc2V0ICsgMjtcbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdDJ9LSR7b2JqZWN0fWBdID0gLTEgKiAob2Zmc2V0ICsgMik7XG5cbiAgICAgIC8vIFJlZ2lzdGVyIGNvbGxpc2lvbnMgZm9yIGJvdGggdGhlIG9iamVjdCBjb2xsaWRpbmcgYW5kIHRoZSBvYmplY3QgYmVpbmcgY29sbGlkZWQgd2l0aFxuICAgICAgaWYgKCFjb2xsaXNpb25zW29iamVjdF0pIGNvbGxpc2lvbnNbb2JqZWN0XSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3RdLnB1c2gob2JqZWN0Mik7XG5cbiAgICAgIGlmICghY29sbGlzaW9uc1tvYmplY3QyXSkgY29sbGlzaW9uc1tvYmplY3QyXSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3QyXS5wdXNoKG9iamVjdCk7XG4gICAgfVxuXG4gICAgLy8gRGVhbCB3aXRoIGNvbGxpc2lvbnNcbiAgICBmb3IgKGNvbnN0IGlkMSBpbiB0aGlzLl9vYmplY3RzKSB7XG4gICAgICBpZiAoIXRoaXMuX29iamVjdHMuaGFzT3duUHJvcGVydHkoaWQxKSkgY29udGludWU7XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLl9vYmplY3RzW2lkMV07XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgLy8gSWYgb2JqZWN0IHRvdWNoZXMgYW55dGhpbmcsIC4uLlxuICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXSkge1xuICAgICAgICAvLyBDbGVhbiB1cCB0b3VjaGVzIGFycmF5XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGF0YS50b3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXS5pbmRleE9mKGRhdGEudG91Y2hlc1tqXSkgPT09IC0xKVxuICAgICAgICAgICAgZGF0YS50b3VjaGVzLnNwbGljZShqLS0sIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIGVhY2ggY29sbGlkaW5nIG9iamVjdFxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbGxpc2lvbnNbaWQxXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGlkMiA9IGNvbGxpc2lvbnNbaWQxXVtqXTtcbiAgICAgICAgICBjb25zdCBvYmplY3QyID0gdGhpcy5fb2JqZWN0c1tpZDJdO1xuICAgICAgICAgIGNvbnN0IGNvbXBvbmVudDIgPSBvYmplY3QyLmNvbXBvbmVudDtcbiAgICAgICAgICBjb25zdCBkYXRhMiA9IGNvbXBvbmVudDIudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgICAgIGlmIChvYmplY3QyKSB7XG4gICAgICAgICAgICAvLyBJZiBvYmplY3Qgd2FzIG5vdCBhbHJlYWR5IHRvdWNoaW5nIG9iamVjdDIsIG5vdGlmeSBvYmplY3RcbiAgICAgICAgICAgIGlmIChkYXRhLnRvdWNoZXMuaW5kZXhPZihpZDIpID09PSAtMSkge1xuICAgICAgICAgICAgICBkYXRhLnRvdWNoZXMucHVzaChpZDIpO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHZlbCA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuICAgICAgICAgICAgICBjb25zdCB2ZWwyID0gY29tcG9uZW50Mi51c2UoJ3BoeXNpY3MnKS5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuXG4gICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zdWJWZWN0b3JzKHZlbCwgdmVsMik7XG4gICAgICAgICAgICAgIGNvbnN0IHRlbXAxID0gdGVtcDFWZWN0b3IzLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnN1YlZlY3RvcnModmVsLCB2ZWwyKTtcbiAgICAgICAgICAgICAgY29uc3QgdGVtcDIgPSB0ZW1wMVZlY3RvcjMuY2xvbmUoKTtcblxuICAgICAgICAgICAgICBsZXQgbm9ybWFsX29mZnNldCA9IG5vcm1hbF9vZmZzZXRzW2Ake2RhdGEuaWR9LSR7ZGF0YTIuaWR9YF07XG5cbiAgICAgICAgICAgICAgaWYgKG5vcm1hbF9vZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIC1pbmZvW25vcm1hbF9vZmZzZXRdLFxuICAgICAgICAgICAgICAgICAgLWluZm9bbm9ybWFsX29mZnNldCArIDFdLFxuICAgICAgICAgICAgICAgICAgLWluZm9bbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub3JtYWxfb2Zmc2V0ICo9IC0xO1xuXG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIGluZm9bbm9ybWFsX29mZnNldF0sXG4gICAgICAgICAgICAgICAgICBpbmZvW25vcm1hbF9vZmZzZXQgKyAxXSxcbiAgICAgICAgICAgICAgICAgIGluZm9bbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbXBvbmVudC5lbWl0KCdjb2xsaXNpb24nLCBvYmplY3QyLCB0ZW1wMSwgdGVtcDIsIHRlbXAxVmVjdG9yMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgZGF0YS50b3VjaGVzLmxlbmd0aCA9IDA7IC8vIG5vdCB0b3VjaGluZyBvdGhlciBvYmplY3RzXG4gICAgfVxuXG4gICAgdGhpcy5jb2xsaXNpb25zID0gY29sbGlzaW9ucztcblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShpbmZvLmJ1ZmZlciwgW2luZm8uYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgYWRkQ29uc3RyYWludChjb25zdHJhaW50LCBzaG93X21hcmtlcikge1xuICAgIGNvbnN0cmFpbnQuaWQgPSB0aGlzLmdldE9iamVjdElkKCk7XG4gICAgdGhpcy5fY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gPSBjb25zdHJhaW50O1xuICAgIGNvbnN0cmFpbnQud29ybGRNb2R1bGUgPSB0aGlzO1xuICAgIHRoaXMuZXhlY3V0ZSgnYWRkQ29uc3RyYWludCcsIGNvbnN0cmFpbnQuZ2V0RGVmaW5pdGlvbigpKTtcblxuICAgIGlmIChzaG93X21hcmtlcikge1xuICAgICAgbGV0IG1hcmtlcjtcblxuICAgICAgc3dpdGNoIChjb25zdHJhaW50LnR5cGUpIHtcbiAgICAgICAgY2FzZSAncG9pbnQnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMuX29iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdoaW5nZSc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NsaWRlcic6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgQm94R2VvbWV0cnkoMTAsIDEsIDEpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcblxuICAgICAgICAgIC8vIFRoaXMgcm90YXRpb24gaXNuJ3QgcmlnaHQgaWYgYWxsIHRocmVlIGF4aXMgYXJlIG5vbi0wIHZhbHVlc1xuICAgICAgICAgIC8vIFRPRE86IGNoYW5nZSBtYXJrZXIncyByb3RhdGlvbiBvcmRlciB0byBaWVhcbiAgICAgICAgICBtYXJrZXIucm90YXRpb24uc2V0KFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLnksIC8vIHllcywgeSBhbmRcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy54LCAvLyB4IGF4aXMgYXJlIHN3YXBwZWRcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy56XG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnY29uZXR3aXN0JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnZG9mJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnN0cmFpbnQ7XG4gIH1cblxuICBvblNpbXVsYXRpb25SZXN1bWUoKSB7XG4gICAgdGhpcy5leGVjdXRlKCdvblNpbXVsYXRpb25SZXN1bWUnLCB7fSk7XG4gIH1cblxuICByZW1vdmVDb25zdHJhaW50KGNvbnN0cmFpbnQpIHtcbiAgICBpZiAodGhpcy5fY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVDb25zdHJhaW50Jywge2lkOiBjb25zdHJhaW50LmlkfSk7XG4gICAgICBkZWxldGUgdGhpcy5fY29uc3RyYWludHNbY29uc3RyYWludC5pZF07XG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZShjbWQsIHBhcmFtcykge1xuICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKHtjbWQsIHBhcmFtc30pO1xuICB9XG5cbiAgb25BZGRDYWxsYmFjayhjb21wb25lbnQpIHtcbiAgICBjb25zdCBvYmplY3QgPSBjb21wb25lbnQubmF0aXZlO1xuICAgIGNvbnN0IGRhdGEgPSBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICBpZiAoZGF0YSkge1xuICAgICAgY29tcG9uZW50Lm1hbmFnZXIuc2V0KCdtb2R1bGU6d29ybGQnLCB0aGlzKTtcbiAgICAgIGRhdGEuaWQgPSB0aGlzLmdldE9iamVjdElkKCk7XG4gICAgICBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGEgPSBkYXRhO1xuXG4gICAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVmVoaWNsZSkge1xuICAgICAgICB0aGlzLm9uQWRkQ2FsbGJhY2sob2JqZWN0Lm1lc2gpO1xuICAgICAgICB0aGlzLl92ZWhpY2xlc1tkYXRhLmlkXSA9IG9iamVjdDtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRWZWhpY2xlJywgZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fb2JqZWN0c1tkYXRhLmlkXSA9IG9iamVjdDtcblxuICAgICAgICBpZiAob2JqZWN0LmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgIGRhdGEuY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgICBhZGRPYmplY3RDaGlsZHJlbihvYmplY3QsIG9iamVjdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiAob2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzKSB7XG4gICAgICAgIC8vICAgaWYgKHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzLmhhc093blByb3BlcnR5KG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZCkpXG4gICAgICAgIC8vICAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdKys7XG4gICAgICAgIC8vICAgZWxzZSB7XG4gICAgICAgIC8vICAgICB0aGlzLmV4ZWN1dGUoJ3JlZ2lzdGVyTWF0ZXJpYWwnLCBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMpO1xuICAgICAgICAvLyAgICAgZGF0YS5tYXRlcmlhbElkID0gb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkO1xuICAgICAgICAvLyAgICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXSA9IDE7XG4gICAgICAgIC8vICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gb2JqZWN0LnF1YXRlcm5pb24uc2V0RnJvbUV1bGVyKG9iamVjdC5yb3RhdGlvbik7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdC5jb21wb25lbnQpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhvYmplY3Qucm90YXRpb24pO1xuXG4gICAgICAgIC8vIE9iamVjdCBzdGFydGluZyBwb3NpdGlvbiArIHJvdGF0aW9uXG4gICAgICAgIGRhdGEucG9zaXRpb24gPSB7XG4gICAgICAgICAgeDogb2JqZWN0LnBvc2l0aW9uLngsXG4gICAgICAgICAgeTogb2JqZWN0LnBvc2l0aW9uLnksXG4gICAgICAgICAgejogb2JqZWN0LnBvc2l0aW9uLnpcbiAgICAgICAgfTtcblxuICAgICAgICBkYXRhLnJvdGF0aW9uID0ge1xuICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgeTogb2JqZWN0LnF1YXRlcm5pb24ueSxcbiAgICAgICAgICB6OiBvYmplY3QucXVhdGVybmlvbi56LFxuICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoZGF0YS53aWR0aCkgZGF0YS53aWR0aCAqPSBvYmplY3Quc2NhbGUueDtcbiAgICAgICAgaWYgKGRhdGEuaGVpZ2h0KSBkYXRhLmhlaWdodCAqPSBvYmplY3Quc2NhbGUueTtcbiAgICAgICAgaWYgKGRhdGEuZGVwdGgpIGRhdGEuZGVwdGggKj0gb2JqZWN0LnNjYWxlLno7XG5cbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRPYmplY3QnLCBkYXRhKTtcbiAgICAgIH1cblxuICAgICAgY29tcG9uZW50LmVtaXQoJ3BoeXNpY3M6YWRkZWQnKTtcbiAgICB9XG4gIH1cblxuICBvblJlbW92ZUNhbGxiYWNrKGNvbXBvbmVudCkge1xuICAgIGNvbnN0IG9iamVjdCA9IGNvbXBvbmVudC5uYXRpdmU7XG5cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVmVoaWNsZSkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVWZWhpY2xlJywge2lkOiBvYmplY3QuX3BoeXNpanMuaWR9KTtcbiAgICAgIHdoaWxlIChvYmplY3Qud2hlZWxzLmxlbmd0aCkgdGhpcy5yZW1vdmUob2JqZWN0LndoZWVscy5wb3AoKSk7XG5cbiAgICAgIHRoaXMucmVtb3ZlKG9iamVjdC5tZXNoKTtcbiAgICAgIHRoaXMuX3ZlaGljbGVzW29iamVjdC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNZXNoLnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzLCBvYmplY3QpO1xuXG4gICAgICBpZiAob2JqZWN0Ll9waHlzaWpzKSB7XG4gICAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnJlbW92ZSgnbW9kdWxlOndvcmxkJyk7XG4gICAgICAgIHRoaXMuX29iamVjdHNbb2JqZWN0Ll9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlT2JqZWN0Jywge2lkOiBvYmplY3QuX3BoeXNpanMuaWR9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9iamVjdC5tYXRlcmlhbCAmJiBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMgJiYgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHMuaGFzT3duUHJvcGVydHkob2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkKSkge1xuICAgICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXS0tO1xuXG4gICAgICBpZiAodGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXSA9PT0gMCkge1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ3VuUmVnaXN0ZXJNYXRlcmlhbCcsIG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcyk7XG4gICAgICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRlZmVyKGZ1bmMsIGFyZ3MpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzTG9hZGVkKSB7XG4gICAgICAgIGZ1bmMoLi4uYXJncyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB0aGlzLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICBtYW5hZ2VyLnNldCgncGh5c2ljc1dvcmtlcicsIHRoaXMud29ya2VyKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBvbkFkZChjb21wb25lbnQsIHNlbGYpIHtcbiAgICAgIGlmIChjb21wb25lbnQudXNlKCdwaHlzaWNzJykpIHJldHVybiBzZWxmLmRlZmVyKHNlbGYub25BZGRDYWxsYmFjay5iaW5kKHNlbGYpLCBbY29tcG9uZW50XSk7XG4gICAgICByZXR1cm47XG4gICAgfSxcblxuICAgIG9uUmVtb3ZlKGNvbXBvbmVudCwgc2VsZikge1xuICAgICAgaWYgKGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSkgcmV0dXJuIHNlbGYuZGVmZXIoc2VsZi5vblJlbW92ZUNhbGxiYWNrLmJpbmQoc2VsZiksIFtjb21wb25lbnRdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIC8vIC4uLlxuXG4gICAgdGhpcy5zZXRGaXhlZFRpbWVTdGVwID0gZnVuY3Rpb24oZml4ZWRUaW1lU3RlcCkge1xuICAgICAgaWYgKGZpeGVkVGltZVN0ZXApIHNlbGYuZXhlY3V0ZSgnc2V0Rml4ZWRUaW1lU3RlcCcsIGZpeGVkVGltZVN0ZXApO1xuICAgIH1cblxuICAgIHRoaXMuc2V0R3Jhdml0eSA9IGZ1bmN0aW9uKGdyYXZpdHkpIHtcbiAgICAgIGlmIChncmF2aXR5KSBzZWxmLmV4ZWN1dGUoJ3NldEdyYXZpdHknLCBncmF2aXR5KTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZENvbnN0cmFpbnQgPSBzZWxmLmFkZENvbnN0cmFpbnQuYmluZChzZWxmKTtcblxuICAgIHRoaXMuc2ltdWxhdGUgPSBmdW5jdGlvbih0aW1lU3RlcCwgbWF4U3ViU3RlcHMpIHtcbiAgICAgIGlmIChzZWxmLl9zdGF0cykgc2VsZi5fc3RhdHMuYmVnaW4oKTtcblxuICAgICAgaWYgKHNlbGYuX2lzX3NpbXVsYXRpbmcpIHJldHVybiBmYWxzZTtcblxuICAgICAgc2VsZi5faXNfc2ltdWxhdGluZyA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3Qgb2JqZWN0X2lkIGluIHNlbGYuX29iamVjdHMpIHtcbiAgICAgICAgaWYgKCFzZWxmLl9vYmplY3RzLmhhc093blByb3BlcnR5KG9iamVjdF9pZCkpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHNlbGYuX29iamVjdHNbb2JqZWN0X2lkXTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICAgIGlmIChvYmplY3QgIT09IG51bGwgJiYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gfHwgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikpIHtcbiAgICAgICAgICBjb25zdCB1cGRhdGUgPSB7aWQ6IGRhdGEuaWR9O1xuXG4gICAgICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24pIHtcbiAgICAgICAgICAgIHVwZGF0ZS5wb3MgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICB5OiBvYmplY3QucG9zaXRpb24ueSxcbiAgICAgICAgICAgICAgejogb2JqZWN0LnBvc2l0aW9uLnpcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnF1YXQgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5xdWF0ZXJuaW9uLnksXG4gICAgICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLmV4ZWN1dGUoJ3VwZGF0ZVRyYW5zZm9ybScsIHVwZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5leGVjdXRlKCdzaW11bGF0ZScsIHt0aW1lU3RlcCwgbWF4U3ViU3RlcHN9KTtcblxuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5lbmQoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGNvbnN0IHNpbXVsYXRlUHJvY2VzcyA9ICh0KSA9PiB7XG4gICAgLy8gICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHNpbXVsYXRlUHJvY2Vzcyk7XG5cbiAgICAvLyAgIHRoaXMuc2ltdWxhdGUoMS82MCwgMSk7IC8vIGRlbHRhLCAxXG4gICAgLy8gfVxuXG4gICAgLy8gc2ltdWxhdGVQcm9jZXNzKCk7XG5cbiAgICBzZWxmLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgIHNlbGYuc2ltdWxhdGVMb29wID0gbmV3IExvb3AoKGNsb2NrKSA9PiB7XG4gICAgICAgIHRoaXMuc2ltdWxhdGUoY2xvY2suZ2V0RGVsdGEoKSwgMSk7IC8vIGRlbHRhLCAxXG4gICAgICB9KTtcblxuICAgICAgc2VsZi5zaW11bGF0ZUxvb3Auc3RhcnQodGhpcyk7XG5cbiAgICAgIHRoaXMuc2V0R3Jhdml0eShwYXJhbXMuZ3Jhdml0eSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yMywgUXVhdGVybmlvbn0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBwcm9wZXJ0aWVzID0ge1xuICBwb3NpdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgfSxcblxuICAgIHNldCh2ZWN0b3IzKSB7XG4gICAgICBjb25zdCBwb3MgPSB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgICBjb25zdCBzY29wZSA9IHRoaXM7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHBvcywge1xuICAgICAgICB4OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3g7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh4KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feCA9IHg7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3k7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh5KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feSA9IHk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB6OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3o7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh6KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feiA9IHo7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcblxuICAgICAgcG9zLmNvcHkodmVjdG9yMyk7XG4gICAgfVxuICB9LFxuXG4gIHF1YXRlcm5pb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMubmF0aXZlLnF1YXRlcm5pb247XG4gICAgfSxcblxuICAgIHNldChxdWF0ZXJuaW9uKSB7XG4gICAgICBjb25zdCBxdWF0ID0gdGhpcy5fbmF0aXZlLnF1YXRlcm5pb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgcXVhdC5jb3B5KHF1YXRlcm5pb24pO1xuXG4gICAgICBxdWF0Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIGlmIChuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLl9fY19yb3QgPSBmYWxzZTtcbiAgICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICByb3RhdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHRoaXMuX19jX3JvdCA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnJvdGF0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQoZXVsZXIpIHtcbiAgICAgIGNvbnN0IHJvdCA9IHRoaXMuX25hdGl2ZS5yb3RhdGlvbixcbiAgICAgICAgbmF0aXZlID0gdGhpcy5fbmF0aXZlO1xuXG4gICAgICB0aGlzLnF1YXRlcm5pb24uY29weShuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihldWxlcikpO1xuXG4gICAgICByb3Qub25DaGFuZ2UoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2Nfcm90KSB7XG4gICAgICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIocm90KSk7XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwUGh5c2ljc1Byb3RvdHlwZShzY29wZSkge1xuICBmb3IgKGxldCBrZXkgaW4gcHJvcGVydGllcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzY29wZSwga2V5LCB7XG4gICAgICBnZXQ6IHByb3BlcnRpZXNba2V5XS5nZXQuYmluZChzY29wZSksXG4gICAgICBzZXQ6IHByb3BlcnRpZXNba2V5XS5zZXQuYmluZChzY29wZSksXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25Db3B5KHNvdXJjZSkge1xuICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcblxuICBjb25zdCBwaHlzaWNzID0gdGhpcy51c2UoJ3BoeXNpY3MnKTtcbiAgY29uc3Qgc291cmNlUGh5c2ljcyA9IHNvdXJjZS51c2UoJ3BoeXNpY3MnKTtcblxuICB0aGlzLm1hbmFnZXIubW9kdWxlcy5waHlzaWNzID0gcGh5c2ljcy5jbG9uZSh0aGlzLm1hbmFnZXIpO1xuXG4gIHBoeXNpY3MuZGF0YSA9IHsuLi5zb3VyY2VQaHlzaWNzLmRhdGF9O1xuICBwaHlzaWNzLmRhdGEuaXNTb2Z0Qm9keVJlc2V0ID0gZmFsc2U7XG4gIGlmIChwaHlzaWNzLmRhdGEuaXNTb2Z0Ym9keSkgcGh5c2ljcy5kYXRhLmlzU29mdEJvZHlSZXNldCA9IGZhbHNlO1xuXG4gIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmNsb25lKCk7XG4gIHRoaXMucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uLmNsb25lKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IHRoaXMucXVhdGVybmlvbi5jbG9uZSgpO1xuXG4gIHJldHVybiBzb3VyY2U7XG59XG5cbmZ1bmN0aW9uIG9uV3JhcCgpIHtcbiAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucm90YXRpb24uY2xvbmUoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gdGhpcy5xdWF0ZXJuaW9uLmNsb25lKCk7XG59XG5cbmNsYXNzIEFQSSB7XG4gIGFwcGx5Q2VudHJhbEltcHVsc2UoZm9yY2UpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Q2VudHJhbEltcHVsc2UnLCB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogZm9yY2UueCwgeTogZm9yY2UueSwgejogZm9yY2Uuen0pO1xuICB9XG5cbiAgYXBwbHlJbXB1bHNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5SW1wdWxzZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICBpbXB1bHNlX3g6IGZvcmNlLngsXG4gICAgICBpbXB1bHNlX3k6IGZvcmNlLnksXG4gICAgICBpbXB1bHNlX3o6IGZvcmNlLnosXG4gICAgICB4OiBvZmZzZXQueCxcbiAgICAgIHk6IG9mZnNldC55LFxuICAgICAgejogb2Zmc2V0LnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5VG9ycXVlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseVRvcnF1ZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICB0b3JxdWVfeDogZm9yY2UueCxcbiAgICAgIHRvcnF1ZV95OiBmb3JjZS55LFxuICAgICAgdG9ycXVlX3o6IGZvcmNlLnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5Q2VudHJhbEZvcmNlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUNlbnRyYWxGb3JjZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICB4OiBmb3JjZS54LFxuICAgICAgeTogZm9yY2UueSxcbiAgICAgIHo6IGZvcmNlLnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5Rm9yY2UoZm9yY2UsIG9mZnNldCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlGb3JjZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICBmb3JjZV94OiBmb3JjZS54LFxuICAgICAgZm9yY2VfeTogZm9yY2UueSxcbiAgICAgIGZvcmNlX3o6IGZvcmNlLnosXG4gICAgICB4OiBvZmZzZXQueCxcbiAgICAgIHk6IG9mZnNldC55LFxuICAgICAgejogb2Zmc2V0LnpcbiAgICB9KTtcbiAgfVxuXG4gIGdldEFuZ3VsYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmFuZ3VsYXJWZWxvY2l0eTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRBbmd1bGFyVmVsb2NpdHknLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9XG4gICAgKTtcbiAgfVxuXG4gIGdldExpbmVhclZlbG9jaXR5KCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEubGluZWFyVmVsb2NpdHk7XG4gIH1cblxuICBzZXRMaW5lYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRMaW5lYXJWZWxvY2l0eScsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogdmVsb2NpdHkueCwgeTogdmVsb2NpdHkueSwgejogdmVsb2NpdHkuen1cbiAgICApO1xuICB9XG5cbiAgc2V0QW5ndWxhckZhY3RvcihmYWN0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0QW5ndWxhckZhY3RvcicsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogZmFjdG9yLngsIHk6IGZhY3Rvci55LCB6OiBmYWN0b3Iuen1cbiAgICApO1xuICB9XG5cbiAgc2V0TGluZWFyRmFjdG9yKGZhY3Rvcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRMaW5lYXJGYWN0b3InLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldERhbXBpbmcobGluZWFyLCBhbmd1bGFyKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldERhbXBpbmcnLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIGxpbmVhciwgYW5ndWxhcn1cbiAgICApO1xuICB9XG5cbiAgc2V0Q2NkTW90aW9uVGhyZXNob2xkKHRocmVzaG9sZCkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRDY2RNb3Rpb25UaHJlc2hvbGQnLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHRocmVzaG9sZH1cbiAgICApO1xuICB9XG5cbiAgc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMocmFkaXVzKSB7XG4gICAgdGhpcy5leGVjdXRlKCdzZXRDY2RTd2VwdFNwaGVyZVJhZGl1cycsIHtpZDogdGhpcy5kYXRhLmlkLCByYWRpdXN9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBleHRlbmRzIEFQSSB7XG4gIHN0YXRpYyByaWdpZGJvZHkgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGxpbmVhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICBtYXNzOiAxMCxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIGRhbXBpbmc6IDAsXG4gICAgbWFyZ2luOiAwXG4gIH0pO1xuXG4gIHN0YXRpYyBzb2Z0Ym9keSA9ICgpID0+ICh7XG4gICAgdG91Y2hlczogW10sXG4gICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIGRhbXBpbmc6IDAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIHByZXNzdXJlOiAxMDAsXG4gICAgbWFyZ2luOiAwLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMSxcbiAgICBpc1NvZnRib2R5OiB0cnVlLFxuICAgIGlzU29mdEJvZHlSZXNldDogZmFsc2VcbiAgfSk7XG5cbiAgc3RhdGljIHJvcGUgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIGRhbXBpbmc6IDAsXG4gICAgbWFyZ2luOiAwLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMSxcbiAgICBpc1NvZnRib2R5OiB0cnVlXG4gIH0pO1xuXG4gIHN0YXRpYyBjbG90aCA9ICgpID0+ICh7XG4gICAgdG91Y2hlczogW10sXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAga2xzdDogMC45LFxuICAgIGt2c3Q6IDAuOSxcbiAgICBrYXN0OiAwLjksXG4gICAgcGl0ZXJhdGlvbnM6IDEsXG4gICAgdml0ZXJhdGlvbnM6IDAsXG4gICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgY2l0ZXJhdGlvbnM6IDQsXG4gICAgYW5jaG9ySGFyZG5lc3M6IDAuNyxcbiAgICByaWdpZEhhcmRuZXNzOiAxXG4gIH0pO1xuXG4gIGNvbnN0cnVjdG9yKGRlZmF1bHRzLCBkYXRhKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRzLCBkYXRhKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICBtYW5hZ2VyLmRlZmluZSgncGh5c2ljcycpO1xuXG4gICAgdGhpcy5leGVjdXRlID0gKC4uLmRhdGEpID0+IHtcbiAgICAgIHJldHVybiBtYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJylcbiAgICAgID8gbWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoLi4uZGF0YSlcbiAgICAgIDogKCkgPT4ge307XG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZURhdGEoY2FsbGJhY2spIHtcbiAgICB0aGlzLmJyaWRnZS5nZW9tZXRyeSA9IGZ1bmN0aW9uIChnZW9tZXRyeSwgbW9kdWxlKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrKSByZXR1cm4gZ2VvbWV0cnk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKGdlb21ldHJ5LCBtb2R1bGUpO1xuICAgICAgcmV0dXJuIHJlc3VsdCA/IHJlc3VsdCA6IGdlb21ldHJ5O1xuICAgIH1cbiAgfVxuXG4gIGNsb25lKG1hbmFnZXIpIHtcbiAgICBjb25zdCBjbG9uZSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKCk7XG4gICAgY2xvbmUuZGF0YSA9IHsuLi50aGlzLmRhdGF9O1xuICAgIGNsb25lLmJyaWRnZS5nZW9tZXRyeSA9IHRoaXMuYnJpZGdlLmdlb21ldHJ5O1xuICAgIHRoaXMubWFuYWdlci5hcHBseShjbG9uZSwgW21hbmFnZXJdKTtcblxuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBCb3hNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2JveCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgZGF0YS5oZWlnaHQgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgZGF0YS5kZXB0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbXBvdW5kTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjb21wb3VuZCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG4vLyBUT0RPOiBUZXN0IENhcHN1bGVNb2R1bGUgaW4gYWN0aW9uLlxuZXhwb3J0IGNsYXNzIENhcHN1bGVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NhcHN1bGUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEuZGVwdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb25jYXZlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjb25jYXZlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBkYXRhLmRhdGEgPSB0aGlzLmdlb21ldHJ5UHJvY2Vzc29yKGdlb21ldHJ5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdlb21ldHJ5UHJvY2Vzc29yKGdlb21ldHJ5KSB7XG4gICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICBjb25zdCBkYXRhID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/XG4gICAgICBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDpcbiAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogOSk7XG5cbiAgICBpZiAoIWdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIGNvbnN0IHZlcnRpY2VzID0gZ2VvbWV0cnkudmVydGljZXM7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xuXG4gICAgICAgIGNvbnN0IHZBID0gdmVydGljZXNbZmFjZS5hXTtcbiAgICAgICAgY29uc3QgdkIgPSB2ZXJ0aWNlc1tmYWNlLmJdO1xuICAgICAgICBjb25zdCB2QyA9IHZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICAgICAgY29uc3QgaTkgPSBpICogOTtcblxuICAgICAgICBkYXRhW2k5XSA9IHZBLng7XG4gICAgICAgIGRhdGFbaTkgKyAxXSA9IHZBLnk7XG4gICAgICAgIGRhdGFbaTkgKyAyXSA9IHZBLno7XG5cbiAgICAgICAgZGF0YVtpOSArIDNdID0gdkIueDtcbiAgICAgICAgZGF0YVtpOSArIDRdID0gdkIueTtcbiAgICAgICAgZGF0YVtpOSArIDVdID0gdkIuejtcblxuICAgICAgICBkYXRhW2k5ICsgNl0gPSB2Qy54O1xuICAgICAgICBkYXRhW2k5ICsgN10gPSB2Qy55O1xuICAgICAgICBkYXRhW2k5ICsgOF0gPSB2Qy56O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29uZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEucmFkaXVzID0gKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLngpIC8gMjtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ29udmV4TW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjb252ZXgnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuICAgICAgaWYgKCFnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKS5mcm9tR2VvbWV0cnkoZ2VvbWV0cnkpO1xuXG4gICAgICBkYXRhLmRhdGEgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5ID9cbiAgICAgICAgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6XG4gICAgICAgIGdlb21ldHJ5Ll9idWZmZXJHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDeWxpbmRlck1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY3lsaW5kZXInLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEuZGVwdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5pbXBvcnQge1ZlY3RvcjMsIFZlY3RvcjIsIEJ1ZmZlckdlb21ldHJ5fSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBjbGFzcyBIZWlnaHRmaWVsZE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnaGVpZ2h0ZmllbGQnLFxuICAgICAgc2l6ZTogbmV3IFZlY3RvcjIoMSwgMSksXG4gICAgICBhdXRvQWxpZ246IGZhbHNlLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IHt4OiB4ZGl2LCB5OiB5ZGl2fSA9IGRhdGEuc2l6ZTtcbiAgICAgIGNvbnN0IHZlcnRzID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOiBnZW9tZXRyeS52ZXJ0aWNlcztcbiAgICAgIGxldCBzaXplID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/IHZlcnRzLmxlbmd0aCAvIDMgOiB2ZXJ0cy5sZW5ndGg7XG5cbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBjb25zdCB4c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBjb25zdCB5c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG5cbiAgICAgIGRhdGEueHB0cyA9ICh0eXBlb2YgeGRpdiA9PT0gJ3VuZGVmaW5lZCcpID8gTWF0aC5zcXJ0KHNpemUpIDogeGRpdiArIDE7XG4gICAgICBkYXRhLnlwdHMgPSAodHlwZW9mIHlkaXYgPT09ICd1bmRlZmluZWQnKSA/IE1hdGguc3FydChzaXplKSA6IHlkaXYgKyAxO1xuXG4gICAgICAvLyBub3RlIC0gdGhpcyBhc3N1bWVzIG91ciBwbGFuZSBnZW9tZXRyeSBpcyBzcXVhcmUsIHVubGVzcyB3ZSBwYXNzIGluIHNwZWNpZmljIHhkaXYgYW5kIHlkaXZcbiAgICAgIGRhdGEuYWJzTWF4SGVpZ2h0ID0gTWF0aC5tYXgoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnksIE1hdGguYWJzKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55KSk7XG5cbiAgICAgIGNvbnN0IHBvaW50cyA9IG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSksXG4gICAgICAgIHhwdHMgPSBkYXRhLnhwdHMsXG4gICAgICAgIHlwdHMgPSBkYXRhLnlwdHM7XG5cbiAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgY29uc3Qgdk51bSA9IHNpemUgJSB4cHRzICsgKCh5cHRzIC0gTWF0aC5yb3VuZCgoc2l6ZSAvIHhwdHMpIC0gKChzaXplICUgeHB0cykgLyB4cHRzKSkgLSAxKSAqIHlwdHMpO1xuXG4gICAgICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtICogMyArIDFdO1xuICAgICAgICBlbHNlIHBvaW50c1tzaXplXSA9IHZlcnRzW3ZOdW1dLnk7XG4gICAgICB9XG5cbiAgICAgIGRhdGEucG9pbnRzID0gcG9pbnRzO1xuXG4gICAgICBkYXRhLnNjYWxlLm11bHRpcGx5KFxuICAgICAgICBuZXcgVmVjdG9yMyh4c2l6ZSAvICh4cHRzIC0gMSksIDEsIHlzaXplIC8gKHlwdHMgLSAxKSlcbiAgICAgICk7XG5cbiAgICAgIGlmIChkYXRhLmF1dG9BbGlnbikgZ2VvbWV0cnkudHJhbnNsYXRlKHhzaXplIC8gLTIsIDAsIHlzaXplIC8gLTIpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBQbGFuZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAncGxhbmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEubm9ybWFsID0gZ2VvbWV0cnkuZmFjZXNbMF0ubm9ybWFsLmNsb25lKCk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFNwaGVyZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc3BoZXJlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nU3BoZXJlKSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdTcGhlcmUoKTtcbiAgICAgIGRhdGEucmFkaXVzID0gZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUucmFkaXVzO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGV9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFNvZnRib2R5TW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzb2Z0VHJpbWVzaCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnNvZnRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBjb25zdCBpZHhHZW9tZXRyeSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnlcbiAgICAgICAgPyBnZW9tZXRyeVxuICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgZ2VvbWV0cnkubWVyZ2VWZXJ0aWNlcygpO1xuXG4gICAgICAgICAgY29uc3QgYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5zZXRJbmRleChcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyAoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogMyA+IDY1NTM1ID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheSkoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShnZW9tZXRyeS5mYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBkYXRhLmFWZXJ0aWNlcyA9IGlkeEdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgICBkYXRhLmFJbmRpY2VzID0gaWR4R2VvbWV0cnkuaW5kZXguYXJyYXk7XG5cbiAgICAgIHJldHVybiBuZXcgQnVmZmVyR2VvbWV0cnkoKS5mcm9tR2VvbWV0cnkoZ2VvbWV0cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ2xvdGhNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NvZnRDbG90aE1lc2gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5jbG90aCgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgY29uc3QgZ2VvbVBhcmFtcyA9IGdlb21ldHJ5LnBhcmFtZXRlcnM7XG5cbiAgICAgIGNvbnN0IGdlb20gPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5XG4gICAgICAgID8gZ2VvbWV0cnlcbiAgICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgZ2VvbWV0cnkubWVyZ2VWZXJ0aWNlcygpO1xuXG4gICAgICAgICAgY29uc3QgYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBjb25zdCBmYWNlcyA9IGdlb21ldHJ5LmZhY2VzLCBmYWNlc0xlbmd0aCA9IGZhY2VzLmxlbmd0aDtcbiAgICAgICAgICBjb25zdCBub3JtYWxzQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZhY2VzTGVuZ3RoICogMyk7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY2VzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGkzID0gaSAqIDM7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwgPSBmYWNlc1tpXS5ub3JtYWwgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzXSA9IG5vcm1hbC54O1xuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzICsgMV0gPSBub3JtYWwueTtcbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpMyArIDJdID0gbm9ybWFsLno7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ25vcm1hbCcsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBub3JtYWxzQXJyYXksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuc2V0SW5kZXgoXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgKGZhY2VzTGVuZ3RoICogMyA+IDY1NTM1ID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheSkoZmFjZXNMZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgKS5jb3B5SW5kaWNlc0FycmF5KGZhY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZmVyR2VvbWV0cnk7XG4gICAgICAgIH0pKCk7XG5cbiAgICAgIGNvbnN0IHZlcnRzID0gZ2VvbS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgICBpZiAoIWdlb21QYXJhbXMud2lkdGhTZWdtZW50cykgZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzID0gMTtcbiAgICAgIGlmICghZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cykgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyA9IDE7XG5cbiAgICAgIGNvbnN0IGlkeDAwID0gMDtcbiAgICAgIGNvbnN0IGlkeDAxID0gZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzO1xuICAgICAgY29uc3QgaWR4MTAgPSAoZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDEpICogKGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEpIC0gKGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEpO1xuICAgICAgY29uc3QgaWR4MTEgPSB2ZXJ0cy5sZW5ndGggLyAzIC0gMTtcblxuICAgICAgZGF0YS5jb3JuZXJzID0gW1xuICAgICAgICB2ZXJ0c1tpZHgwMSAqIDNdLCB2ZXJ0c1tpZHgwMSAqIDMgKyAxXSwgdmVydHNbaWR4MDEgKiAzICsgMl0sIC8vICAg4pWXXG4gICAgICAgIHZlcnRzW2lkeDAwICogM10sIHZlcnRzW2lkeDAwICogMyArIDFdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAyXSwgLy8g4pWUXG4gICAgICAgIHZlcnRzW2lkeDExICogM10sIHZlcnRzW2lkeDExICogMyArIDFdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAyXSwgLy8gICAgICAg4pWdXG4gICAgICAgIHZlcnRzW2lkeDEwICogM10sIHZlcnRzW2lkeDEwICogMyArIDFdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAyXSwgLy8gICAgIOKVmlxuICAgICAgXTtcblxuICAgICAgZGF0YS5zZWdtZW50cyA9IFtnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxLCBnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzICsgMV07XG5cbiAgICAgIHJldHVybiBnZW9tO1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSwgVmVjdG9yM30gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgUm9wZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc29mdFJvcGVNZXNoJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucm9wZSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICAgIGdlb21ldHJ5ID0gKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBidWZmID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmLmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZjtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGVuZ3RoID0gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheS5sZW5ndGggLyAzO1xuICAgICAgY29uc3QgdmVydCA9IG4gPT4gbmV3IFZlY3RvcjMoKS5mcm9tQXJyYXkoZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSwgbiozKTtcblxuICAgICAgY29uc3QgdjEgPSB2ZXJ0KDApO1xuICAgICAgY29uc3QgdjIgPSB2ZXJ0KGxlbmd0aCAtIDEpO1xuXG4gICAgICBkYXRhLmRhdGEgPSBbXG4gICAgICAgIHYxLngsIHYxLnksIHYxLnosXG4gICAgICAgIHYyLngsIHYyLnksIHYyLnosXG4gICAgICAgIGxlbmd0aFxuICAgICAgXTtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7TG9vcH0gZnJvbSAnd2hzJztcblxuaW1wb3J0IHtcbiAgT2JqZWN0M0QsXG4gIFF1YXRlcm5pb24sXG4gIFZlY3RvcjMsXG4gIEV1bGVyXG59IGZyb20gJ3RocmVlJztcblxuY29uc3QgUElfMiA9IE1hdGguUEkgLyAyO1xuXG4vLyBUT0RPOiBGaXggRE9NXG5mdW5jdGlvbiBGaXJzdFBlcnNvbkNvbnRyb2xzU29sdmVyKGNhbWVyYSwgbWVzaCwgcGFyYW1zKSB7XG4gIGNvbnN0IHZlbG9jaXR5RmFjdG9yID0gMTtcbiAgbGV0IHJ1blZlbG9jaXR5ID0gMC4yNTtcblxuICBtZXNoLnVzZSgncGh5c2ljcycpLnNldEFuZ3VsYXJGYWN0b3Ioe3g6IDAsIHk6IDAsIHo6IDB9KTtcbiAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcblxuICAvKiBJbml0ICovXG4gIGNvbnN0IHBsYXllciA9IG1lc2gsXG4gICAgcGl0Y2hPYmplY3QgPSBuZXcgT2JqZWN0M0QoKTtcblxuICBwaXRjaE9iamVjdC5hZGQoY2FtZXJhLm5hdGl2ZSk7XG5cbiAgY29uc3QgeWF3T2JqZWN0ID0gbmV3IE9iamVjdDNEKCk7XG5cbiAgeWF3T2JqZWN0LnBvc2l0aW9uLnkgPSBwYXJhbXMueXBvczsgLy8gZXllcyBhcmUgMiBtZXRlcnMgYWJvdmUgdGhlIGdyb3VuZFxuICB5YXdPYmplY3QuYWRkKHBpdGNoT2JqZWN0KTtcblxuICBjb25zdCBxdWF0ID0gbmV3IFF1YXRlcm5pb24oKTtcblxuICBsZXQgY2FuSnVtcCA9IGZhbHNlLFxuICAgIC8vIE1vdmVzLlxuICAgIG1vdmVGb3J3YXJkID0gZmFsc2UsXG4gICAgbW92ZUJhY2t3YXJkID0gZmFsc2UsXG4gICAgbW92ZUxlZnQgPSBmYWxzZSxcbiAgICBtb3ZlUmlnaHQgPSBmYWxzZTtcblxuICBwbGF5ZXIub24oJ2NvbGxpc2lvbicsIChvdGhlck9iamVjdCwgdiwgciwgY29udGFjdE5vcm1hbCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGNvbnRhY3ROb3JtYWwueSk7XG4gICAgaWYgKGNvbnRhY3ROb3JtYWwueSA8IDAuNSkgLy8gVXNlIGEgXCJnb29kXCIgdGhyZXNob2xkIHZhbHVlIGJldHdlZW4gMCBhbmQgMSBoZXJlIVxuICAgICAgY2FuSnVtcCA9IHRydWU7XG4gIH0pO1xuXG4gIGNvbnN0IG9uTW91c2VNb3ZlID0gZXZlbnQgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBjb25zdCBtb3ZlbWVudFggPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WCA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFggPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WCgpIDogMDtcbiAgICBjb25zdCBtb3ZlbWVudFkgPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WSA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFkgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WSgpIDogMDtcblxuICAgIHlhd09iamVjdC5yb3RhdGlvbi55IC09IG1vdmVtZW50WCAqIDAuMDAyO1xuICAgIHBpdGNoT2JqZWN0LnJvdGF0aW9uLnggLT0gbW92ZW1lbnRZICogMC4wMDI7XG5cbiAgICBwaXRjaE9iamVjdC5yb3RhdGlvbi54ID0gTWF0aC5tYXgoLVBJXzIsIE1hdGgubWluKFBJXzIsIHBpdGNoT2JqZWN0LnJvdGF0aW9uLngpKTtcbiAgfTtcblxuICBjb25zdCBwaHlzaWNzID0gcGxheWVyLnVzZSgncGh5c2ljcycpO1xuXG4gIGNvbnN0IG9uS2V5RG93biA9IGV2ZW50ID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgIG1vdmVGb3J3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgbW92ZUxlZnQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgY2FzZSA4MzogLy8gc1xuICAgICAgICBtb3ZlQmFja3dhcmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgbW92ZVJpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzI6IC8vIHNwYWNlXG4gICAgICAgIGNvbnNvbGUubG9nKGNhbkp1bXApO1xuICAgICAgICBpZiAoY2FuSnVtcCA9PT0gdHJ1ZSkgcGh5c2ljcy5hcHBseUNlbnRyYWxJbXB1bHNlKHt4OiAwLCB5OiAzMDAsIHo6IDB9KTtcbiAgICAgICAgY2FuSnVtcCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNjogLy8gc2hpZnRcbiAgICAgICAgcnVuVmVsb2NpdHkgPSAwLjU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfTtcblxuICBjb25zdCBvbktleVVwID0gZXZlbnQgPT4ge1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgbW92ZUZvcndhcmQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgbW92ZUxlZnQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIGFcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICBtb3ZlUmlnaHQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY6IC8vIHNoaWZ0XG4gICAgICAgIHJ1blZlbG9jaXR5ID0gMC4yNTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9O1xuXG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlEb3duLCBmYWxzZSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBvbktleVVwLCBmYWxzZSk7XG5cbiAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gIHRoaXMuZ2V0T2JqZWN0ID0gKCkgPT4geWF3T2JqZWN0O1xuXG4gIHRoaXMuZ2V0RGlyZWN0aW9uID0gdGFyZ2V0VmVjID0+IHtcbiAgICB0YXJnZXRWZWMuc2V0KDAsIDAsIC0xKTtcbiAgICBxdWF0Lm11bHRpcGx5VmVjdG9yMyh0YXJnZXRWZWMpO1xuICB9O1xuXG4gIC8vIE1vdmVzIHRoZSBjYW1lcmEgdG8gdGhlIFBoeXNpLmpzIG9iamVjdCBwb3NpdGlvblxuICAvLyBhbmQgYWRkcyB2ZWxvY2l0eSB0byB0aGUgb2JqZWN0IGlmIHRoZSBydW4ga2V5IGlzIGRvd24uXG4gIGNvbnN0IGlucHV0VmVsb2NpdHkgPSBuZXcgVmVjdG9yMygpLFxuICAgIGV1bGVyID0gbmV3IEV1bGVyKCk7XG5cbiAgdGhpcy51cGRhdGUgPSBkZWx0YSA9PiB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIGRlbHRhID0gZGVsdGEgfHwgMC41O1xuICAgIGRlbHRhID0gTWF0aC5taW4oZGVsdGEsIDAuNSwgZGVsdGEpO1xuXG4gICAgaW5wdXRWZWxvY2l0eS5zZXQoMCwgMCwgMCk7XG5cbiAgICBjb25zdCBzcGVlZCA9IHZlbG9jaXR5RmFjdG9yICogZGVsdGEgKiBwYXJhbXMuc3BlZWQgKiBydW5WZWxvY2l0eTtcblxuICAgIGlmIChtb3ZlRm9yd2FyZCkgaW5wdXRWZWxvY2l0eS56ID0gLXNwZWVkO1xuICAgIGlmIChtb3ZlQmFja3dhcmQpIGlucHV0VmVsb2NpdHkueiA9IHNwZWVkO1xuICAgIGlmIChtb3ZlTGVmdCkgaW5wdXRWZWxvY2l0eS54ID0gLXNwZWVkO1xuICAgIGlmIChtb3ZlUmlnaHQpIGlucHV0VmVsb2NpdHkueCA9IHNwZWVkO1xuXG4gICAgLy8gQ29udmVydCB2ZWxvY2l0eSB0byB3b3JsZCBjb29yZGluYXRlc1xuICAgIGV1bGVyLnggPSBwaXRjaE9iamVjdC5yb3RhdGlvbi54O1xuICAgIGV1bGVyLnkgPSB5YXdPYmplY3Qucm90YXRpb24ueTtcbiAgICBldWxlci5vcmRlciA9ICdYWVonO1xuXG4gICAgcXVhdC5zZXRGcm9tRXVsZXIoZXVsZXIpO1xuXG4gICAgaW5wdXRWZWxvY2l0eS5hcHBseVF1YXRlcm5pb24ocXVhdCk7XG5cbiAgICBwaHlzaWNzLmFwcGx5Q2VudHJhbEltcHVsc2Uoe3g6IGlucHV0VmVsb2NpdHkueCwgeTogMCwgejogaW5wdXRWZWxvY2l0eS56fSk7XG4gICAgcGh5c2ljcy5zZXRBbmd1bGFyVmVsb2NpdHkoe3g6IGlucHV0VmVsb2NpdHkueiwgeTogMCwgejogLWlucHV0VmVsb2NpdHkueH0pO1xuICAgIHBoeXNpY3Muc2V0QW5ndWxhckZhY3Rvcih7eDogMCwgeTogMCwgejogMH0pO1xuICB9O1xuXG4gIHBsYXllci5vbigncGh5c2ljczphZGRlZCcsICgpID0+IHtcbiAgICBwbGF5ZXIubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ3VwZGF0ZScsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICB5YXdPYmplY3QucG9zaXRpb24uY29weShwbGF5ZXIucG9zaXRpb24pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGNsYXNzIEZpcnN0UGVyc29uTW9kdWxlIHtcbiAgc3RhdGljIGRlZmF1bHRzID0ge1xuICAgIGJsb2NrOiBudWxsLFxuICAgIHNwZWVkOiAxLFxuICAgIHlwb3M6IDFcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihvYmplY3QsIHBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG5cbiAgICBpZiAoIXRoaXMucGFyYW1zLmJsb2NrKSB7XG4gICAgICB0aGlzLnBhcmFtcy5ibG9jayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdibG9ja2VyJyk7XG4gICAgfVxuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgdGhpcy5jb250cm9scyA9IG5ldyBGaXJzdFBlcnNvbkNvbnRyb2xzU29sdmVyKG1hbmFnZXIuZ2V0KCdjYW1lcmEnKSwgdGhpcy5vYmplY3QsIHRoaXMucGFyYW1zKTtcblxuICAgIGlmICgncG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudFxuICAgICAgfHwgJ21velBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICd3ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50KSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgY29uc3QgcG9pbnRlcmxvY2tjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGlmIChkb2N1bWVudC5wb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICB8fCBkb2N1bWVudC5tb3pQb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICB8fCBkb2N1bWVudC53ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLmNvbnRyb2xzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5wYXJhbXMuYmxvY2suc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdHBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgY29uc3QgcG9pbnRlcmxvY2tlcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdQb2ludGVyIGxvY2sgZXJyb3IuJyk7XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdHBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG5cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2sgPSBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdFBvaW50ZXJMb2NrXG4gICAgICAgICAgfHwgZWxlbWVudC53ZWJraXRSZXF1ZXN0UG9pbnRlckxvY2s7XG5cbiAgICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbiA9IGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW47XG5cbiAgICAgICAgaWYgKC9GaXJlZm94L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgIGNvbnN0IGZ1bGxzY3JlZW5jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgfHwgZG9jdW1lbnQubW96RnVsbHNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgfHwgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSk7XG5cbiAgICAgICAgICAgICAgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSwgZmFsc2UpO1xuXG4gICAgICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgICAgICB9IGVsc2UgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBjb25zb2xlLndhcm4oJ1lvdXIgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHRoZSBQb2ludGVyTG9jaycpO1xuXG4gICAgbWFuYWdlci5nZXQoJ3NjZW5lJykuYWRkKHRoaXMuY29udHJvbHMuZ2V0T2JqZWN0KCkpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCB1cGRhdGVQcm9jZXNzb3IgPSBjID0+IHtcbiAgICAgIHNlbGYuY29udHJvbHMudXBkYXRlKGMuZ2V0RGVsdGEoKSk7XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlTG9vcCA9IG5ldyBMb29wKHVwZGF0ZVByb2Nlc3Nvcikuc3RhcnQodGhpcyk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJNRVNTQUdFX1RZUEVTIiwiUkVQT1JUX0lURU1TSVpFIiwiQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFIiwiVkVISUNMRVJFUE9SVF9JVEVNU0laRSIsIkNPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUiLCJ0ZW1wMVZlY3RvcjMiLCJWZWN0b3IzIiwidGVtcDJWZWN0b3IzIiwidGVtcDFNYXRyaXg0IiwiTWF0cml4NCIsInRlbXAxUXVhdCIsIlF1YXRlcm5pb24iLCJnZXRFdWxlclhZWkZyb21RdWF0ZXJuaW9uIiwieCIsInkiLCJ6IiwidyIsIk1hdGgiLCJhdGFuMiIsImFzaW4iLCJnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyIiwiYzEiLCJjb3MiLCJzMSIsInNpbiIsImMyIiwiczIiLCJjMyIsInMzIiwiYzFjMiIsInMxczIiLCJjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0IiwicG9zaXRpb24iLCJvYmplY3QiLCJpZGVudGl0eSIsIm1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uIiwicXVhdGVybmlvbiIsImdldEludmVyc2UiLCJjb3B5Iiwic3ViIiwiYXBwbHlNYXRyaXg0IiwiYWRkT2JqZWN0Q2hpbGRyZW4iLCJwYXJlbnQiLCJpIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJjaGlsZCIsInBoeXNpY3MiLCJjb21wb25lbnQiLCJ1c2UiLCJkYXRhIiwidXBkYXRlTWF0cml4IiwidXBkYXRlTWF0cml4V29ybGQiLCJzZXRGcm9tTWF0cml4UG9zaXRpb24iLCJtYXRyaXhXb3JsZCIsInNldEZyb21Sb3RhdGlvbk1hdHJpeCIsInBvc2l0aW9uX29mZnNldCIsInJvdGF0aW9uIiwicHVzaCIsIkV2ZW50YWJsZSIsIl9ldmVudExpc3RlbmVycyIsImV2ZW50X25hbWUiLCJjYWxsYmFjayIsImhhc093blByb3BlcnR5IiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwicGFyYW1ldGVycyIsIkFycmF5IiwicHJvdG90eXBlIiwiY2FsbCIsImFyZ3VtZW50cyIsImFwcGx5Iiwib2JqIiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJkaXNwYXRjaEV2ZW50IiwiQ29uZVR3aXN0Q29uc3RyYWludCIsIm9iamEiLCJvYmpiIiwib2JqZWN0YSIsIm9iamVjdGIiLCJ1bmRlZmluZWQiLCJjb25zb2xlIiwiZXJyb3IiLCJ0eXBlIiwiYXBwbGllZEltcHVsc2UiLCJ3b3JsZE1vZHVsZSIsImlkIiwicG9zaXRpb25hIiwiY2xvbmUiLCJwb3NpdGlvbmIiLCJheGlzYSIsImF4aXNiIiwiZXhlY3V0ZSIsImNvbnN0cmFpbnQiLCJtYXhfaW1wdWxzZSIsInRhcmdldCIsIlRIUkVFIiwic2V0RnJvbUV1bGVyIiwiRXVsZXIiLCJIaW5nZUNvbnN0cmFpbnQiLCJheGlzIiwibG93IiwiaGlnaCIsImJpYXNfZmFjdG9yIiwicmVsYXhhdGlvbl9mYWN0b3IiLCJ2ZWxvY2l0eSIsImFjY2VsZXJhdGlvbiIsIlBvaW50Q29uc3RyYWludCIsIlNsaWRlckNvbnN0cmFpbnQiLCJsaW5fbG93ZXIiLCJsaW5fdXBwZXIiLCJhbmdfbG93ZXIiLCJhbmdfdXBwZXIiLCJsaW5lYXIiLCJhbmd1bGFyIiwic2NlbmUiLCJET0ZDb25zdHJhaW50IiwibGltaXQiLCJ3aGljaCIsImxvd19hbmdsZSIsImhpZ2hfYW5nbGUiLCJtYXhfZm9yY2UiLCJWZWhpY2xlIiwibWVzaCIsInR1bmluZyIsIlZlaGljbGVUdW5pbmciLCJ3aGVlbHMiLCJfcGh5c2lqcyIsImdldE9iamVjdElkIiwic3VzcGVuc2lvbl9zdGlmZm5lc3MiLCJzdXNwZW5zaW9uX2NvbXByZXNzaW9uIiwic3VzcGVuc2lvbl9kYW1waW5nIiwibWF4X3N1c3BlbnNpb25fdHJhdmVsIiwiZnJpY3Rpb25fc2xpcCIsIm1heF9zdXNwZW5zaW9uX2ZvcmNlIiwid2hlZWxfZ2VvbWV0cnkiLCJ3aGVlbF9tYXRlcmlhbCIsImNvbm5lY3Rpb25fcG9pbnQiLCJ3aGVlbF9kaXJlY3Rpb24iLCJ3aGVlbF9heGxlIiwic3VzcGVuc2lvbl9yZXN0X2xlbmd0aCIsIndoZWVsX3JhZGl1cyIsImlzX2Zyb250X3doZWVsIiwid2hlZWwiLCJNZXNoIiwiY2FzdFNoYWRvdyIsInJlY2VpdmVTaGFkb3ciLCJtdWx0aXBseVNjYWxhciIsImFkZCIsIndvcmxkIiwiYW1vdW50Iiwic3RlZXJpbmciLCJicmFrZSIsImZvcmNlIiwiVEFSR0VUIiwiU3ltYm9sIiwiU0NSSVBUX1RZUEUiLCJCbG9iQnVpbGRlciIsIndpbmRvdyIsIldlYktpdEJsb2JCdWlsZGVyIiwiTW96QmxvYkJ1aWxkZXIiLCJNU0Jsb2JCdWlsZGVyIiwiVVJMIiwid2Via2l0VVJMIiwiV29ya2VyIiwic2hpbVdvcmtlciIsImZpbGVuYW1lIiwiZm4iLCJTaGltV29ya2VyIiwiZm9yY2VGYWxsYmFjayIsIm8iLCJzb3VyY2UiLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJzbGljZSIsIm9ialVSTCIsImNyZWF0ZVNvdXJjZU9iamVjdCIsInJldm9rZU9iamVjdFVSTCIsInNlbGZTaGltIiwibSIsIm9ubWVzc2FnZSIsInBvc3RNZXNzYWdlIiwiaXNUaGlzVGhyZWFkIiwidGVzdFdvcmtlciIsInRlc3RBcnJheSIsIlVpbnQ4QXJyYXkiLCJ0ZXN0IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiRXJyb3IiLCJidWZmZXIiLCJlIiwidGVybWluYXRlIiwic3RyIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsImJsb2IiLCJhcHBlbmQiLCJnZXRCbG9iIiwiZG9jdW1lbnQiLCJzZWxmIiwidHJhbnNmZXJhYmxlTWVzc2FnZSIsIndlYmtpdFBvc3RNZXNzYWdlIiwiX29iamVjdCIsIl92ZWN0b3IiLCJfdHJhbnNmb3JtIiwiX3RyYW5zZm9ybV9wb3MiLCJfc29mdGJvZHlfZW5hYmxlZCIsImxhc3Rfc2ltdWxhdGlvbl9kdXJhdGlvbiIsIl9udW1fb2JqZWN0cyIsIl9udW1fcmlnaWRib2R5X29iamVjdHMiLCJfbnVtX3NvZnRib2R5X29iamVjdHMiLCJfbnVtX3doZWVscyIsIl9udW1fY29uc3RyYWludHMiLCJfc29mdGJvZHlfcmVwb3J0X3NpemUiLCJfdmVjM18xIiwiX3ZlYzNfMiIsIl92ZWMzXzMiLCJfcXVhdCIsInB1YmxpY19mdW5jdGlvbnMiLCJfb2JqZWN0cyIsIl92ZWhpY2xlcyIsIl9jb25zdHJhaW50cyIsIl9vYmplY3RzX2FtbW8iLCJfb2JqZWN0X3NoYXBlcyIsIlJFUE9SVF9DSFVOS1NJWkUiLCJzb2Z0cmVwb3J0IiwiY29sbGlzaW9ucmVwb3J0IiwidmVoaWNsZXJlcG9ydCIsImNvbnN0cmFpbnRyZXBvcnQiLCJXT1JMRFJFUE9SVF9JVEVNU0laRSIsImFiIiwiQXJyYXlCdWZmZXIiLCJTVVBQT1JUX1RSQU5TRkVSQUJMRSIsImJ5dGVMZW5ndGgiLCJnZXRTaGFwZUZyb21DYWNoZSIsImNhY2hlX2tleSIsInNldFNoYXBlQ2FjaGUiLCJzaGFwZSIsImNyZWF0ZVNoYXBlIiwiZGVzY3JpcHRpb24iLCJzZXRJZGVudGl0eSIsIkFtbW8iLCJidENvbXBvdW5kU2hhcGUiLCJub3JtYWwiLCJzZXRYIiwic2V0WSIsInNldFoiLCJidFN0YXRpY1BsYW5lU2hhcGUiLCJ3aWR0aCIsImhlaWdodCIsImRlcHRoIiwiYnRCb3hTaGFwZSIsInJhZGl1cyIsImJ0U3BoZXJlU2hhcGUiLCJidEN5bGluZGVyU2hhcGUiLCJidENhcHN1bGVTaGFwZSIsImJ0Q29uZVNoYXBlIiwidHJpYW5nbGVfbWVzaCIsImJ0VHJpYW5nbGVNZXNoIiwiYWRkVHJpYW5nbGUiLCJidEJ2aFRyaWFuZ2xlTWVzaFNoYXBlIiwiYnRDb252ZXhIdWxsU2hhcGUiLCJhZGRQb2ludCIsInhwdHMiLCJ5cHRzIiwicG9pbnRzIiwicHRyIiwiX21hbGxvYyIsInAiLCJwMiIsImoiLCJIRUFQRjMyIiwiYnRIZWlnaHRmaWVsZFRlcnJhaW5TaGFwZSIsImFic01heEhlaWdodCIsImNyZWF0ZVNvZnRCb2R5IiwiYm9keSIsInNvZnRCb2R5SGVscGVycyIsImJ0U29mdEJvZHlIZWxwZXJzIiwiYVZlcnRpY2VzIiwiQ3JlYXRlRnJvbVRyaU1lc2giLCJnZXRXb3JsZEluZm8iLCJhSW5kaWNlcyIsImNyIiwiY29ybmVycyIsIkNyZWF0ZVBhdGNoIiwiYnRWZWN0b3IzIiwic2VnbWVudHMiLCJDcmVhdGVSb3BlIiwiaW5pdCIsInBhcmFtcyIsIndhc21CdWZmZXIiLCJhbW1vIiwibG9hZEFtbW9Gcm9tQmluYXJ5IiwiY21kIiwibWFrZVdvcmxkIiwiYnRUcmFuc2Zvcm0iLCJidFF1YXRlcm5pb24iLCJyZXBvcnRzaXplIiwiRmxvYXQzMkFycmF5IiwiV09STERSRVBPUlQiLCJDT0xMSVNJT05SRVBPUlQiLCJWRUhJQ0xFUkVQT1JUIiwiQ09OU1RSQUlOVFJFUE9SVCIsImNvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJzb2Z0Ym9keSIsImJ0U29mdEJvZHlSaWdpZEJvZHlDb2xsaXNpb25Db25maWd1cmF0aW9uIiwiYnREZWZhdWx0Q29sbGlzaW9uQ29uZmlndXJhdGlvbiIsImRpc3BhdGNoZXIiLCJidENvbGxpc2lvbkRpc3BhdGNoZXIiLCJzb2x2ZXIiLCJidFNlcXVlbnRpYWxJbXB1bHNlQ29uc3RyYWludFNvbHZlciIsImJyb2FkcGhhc2UiLCJhYWJibWluIiwiYWFiYm1heCIsImJ0QXhpc1N3ZWVwMyIsImJ0RGJ2dEJyb2FkcGhhc2UiLCJidFNvZnRSaWdpZER5bmFtaWNzV29ybGQiLCJidERlZmF1bHRTb2Z0Qm9keVNvbHZlciIsImJ0RGlzY3JldGVEeW5hbWljc1dvcmxkIiwiZml4ZWRUaW1lU3RlcCIsInNldEZpeGVkVGltZVN0ZXAiLCJzZXRHcmF2aXR5IiwiYXBwZW5kQW5jaG9yIiwibG9nIiwibm9kZSIsIm9iajIiLCJjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzIiwiaW5mbHVlbmNlIiwiYWRkT2JqZWN0IiwibW90aW9uU3RhdGUiLCJzYkNvbmZpZyIsImdldF9tX2NmZyIsInZpdGVyYXRpb25zIiwic2V0X3ZpdGVyYXRpb25zIiwicGl0ZXJhdGlvbnMiLCJzZXRfcGl0ZXJhdGlvbnMiLCJkaXRlcmF0aW9ucyIsInNldF9kaXRlcmF0aW9ucyIsImNpdGVyYXRpb25zIiwic2V0X2NpdGVyYXRpb25zIiwic2V0X2NvbGxpc2lvbnMiLCJzZXRfa0RGIiwiZnJpY3Rpb24iLCJzZXRfa0RQIiwiZGFtcGluZyIsInByZXNzdXJlIiwic2V0X2tQUiIsImRyYWciLCJzZXRfa0RHIiwibGlmdCIsInNldF9rTEYiLCJhbmNob3JIYXJkbmVzcyIsInNldF9rQUhSIiwicmlnaWRIYXJkbmVzcyIsInNldF9rQ0hSIiwia2xzdCIsImdldF9tX21hdGVyaWFscyIsImF0Iiwic2V0X21fa0xTVCIsImthc3QiLCJzZXRfbV9rQVNUIiwia3ZzdCIsInNldF9tX2tWU1QiLCJjYXN0T2JqZWN0IiwiYnRDb2xsaXNpb25PYmplY3QiLCJnZXRDb2xsaXNpb25TaGFwZSIsInNldE1hcmdpbiIsIm1hcmdpbiIsInNldEFjdGl2YXRpb25TdGF0ZSIsInN0YXRlIiwicm9wZSIsImNsb3RoIiwic2V0T3JpZ2luIiwic2V0VyIsInNldFJvdGF0aW9uIiwidHJhbnNmb3JtIiwic2NhbGUiLCJzZXRUb3RhbE1hc3MiLCJtYXNzIiwiYWRkU29mdEJvZHkiLCJnZXRfbV9mYWNlcyIsInNpemUiLCJnZXRfbV9ub2RlcyIsImNvbXBvdW5kX3NoYXBlIiwiYWRkQ2hpbGRTaGFwZSIsIl9jaGlsZCIsInRyYW5zIiwiZGVzdHJveSIsInNldExvY2FsU2NhbGluZyIsImNhbGN1bGF0ZUxvY2FsSW5lcnRpYSIsImJ0RGVmYXVsdE1vdGlvblN0YXRlIiwicmJJbmZvIiwiYnRSaWdpZEJvZHlDb25zdHJ1Y3Rpb25JbmZvIiwic2V0X21fZnJpY3Rpb24iLCJzZXRfbV9yZXN0aXR1dGlvbiIsInJlc3RpdHV0aW9uIiwic2V0X21fbGluZWFyRGFtcGluZyIsInNldF9tX2FuZ3VsYXJEYW1waW5nIiwiYnRSaWdpZEJvZHkiLCJjb2xsaXNpb25fZmxhZ3MiLCJzZXRDb2xsaXNpb25GbGFncyIsImdyb3VwIiwibWFzayIsImFkZFJpZ2lkQm9keSIsImFjdGl2YXRlIiwiYSIsImFkZFZlaGljbGUiLCJ2ZWhpY2xlX3R1bmluZyIsImJ0VmVoaWNsZVR1bmluZyIsInNldF9tX3N1c3BlbnNpb25TdGlmZm5lc3MiLCJzZXRfbV9zdXNwZW5zaW9uQ29tcHJlc3Npb24iLCJzZXRfbV9zdXNwZW5zaW9uRGFtcGluZyIsInNldF9tX21heFN1c3BlbnNpb25UcmF2ZWxDbSIsInNldF9tX21heFN1c3BlbnNpb25Gb3JjZSIsInZlaGljbGUiLCJidFJheWNhc3RWZWhpY2xlIiwicmlnaWRCb2R5IiwiYnREZWZhdWx0VmVoaWNsZVJheWNhc3RlciIsInNldENvb3JkaW5hdGVTeXN0ZW0iLCJyZW1vdmVWZWhpY2xlIiwiYWRkV2hlZWwiLCJzZXRTdGVlcmluZyIsImRldGFpbHMiLCJzZXRTdGVlcmluZ1ZhbHVlIiwic2V0QnJha2UiLCJhcHBseUVuZ2luZUZvcmNlIiwicmVtb3ZlT2JqZWN0IiwicmVtb3ZlU29mdEJvZHkiLCJyZW1vdmVSaWdpZEJvZHkiLCJfbW90aW9uX3N0YXRlcyIsIl9jb21wb3VuZF9zaGFwZXMiLCJfbm9uY2FjaGVkX3NoYXBlcyIsInVwZGF0ZVRyYW5zZm9ybSIsImdldE1vdGlvblN0YXRlIiwiZ2V0V29ybGRUcmFuc2Zvcm0iLCJwb3MiLCJxdWF0Iiwic2V0V29ybGRUcmFuc2Zvcm0iLCJ1cGRhdGVNYXNzIiwic2V0TWFzc1Byb3BzIiwiYXBwbHlDZW50cmFsSW1wdWxzZSIsImFwcGx5SW1wdWxzZSIsImltcHVsc2VfeCIsImltcHVsc2VfeSIsImltcHVsc2VfeiIsImFwcGx5VG9ycXVlIiwidG9ycXVlX3giLCJ0b3JxdWVfeSIsInRvcnF1ZV96IiwiYXBwbHlDZW50cmFsRm9yY2UiLCJhcHBseUZvcmNlIiwiZm9yY2VfeCIsImZvcmNlX3kiLCJmb3JjZV96Iiwib25TaW11bGF0aW9uUmVzdW1lIiwiRGF0ZSIsIm5vdyIsInNldEFuZ3VsYXJWZWxvY2l0eSIsInNldExpbmVhclZlbG9jaXR5Iiwic2V0QW5ndWxhckZhY3RvciIsInNldExpbmVhckZhY3RvciIsInNldERhbXBpbmciLCJzZXRDY2RNb3Rpb25UaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJzZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyIsImFkZENvbnN0cmFpbnQiLCJidFBvaW50MlBvaW50Q29uc3RyYWludCIsImJ0SGluZ2VDb25zdHJhaW50IiwidHJhbnNmb3JtYiIsInRyYW5zZm9ybWEiLCJnZXRSb3RhdGlvbiIsInNldEV1bGVyIiwiYnRTbGlkZXJDb25zdHJhaW50IiwidGEiLCJ0YiIsInNldEV1bGVyWllYIiwiYnRDb25lVHdpc3RDb25zdHJhaW50Iiwic2V0TGltaXQiLCJQSSIsImJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50IiwiYiIsImVuYWJsZUZlZWRiYWNrIiwicmVtb3ZlQ29uc3RyYWludCIsImNvbnN0cmFpbnRfc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwidW5kZWZpbmQiLCJzZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJzaW11bGF0ZSIsInRpbWVTdGVwIiwibWF4U3ViU3RlcHMiLCJjZWlsIiwic3RlcFNpbXVsYXRpb24iLCJyZXBvcnRWZWhpY2xlcyIsInJlcG9ydENvbnN0cmFpbnRzIiwicmVwb3J0V29ybGRfc29mdGJvZGllcyIsImhpbmdlX3NldExpbWl0cyIsImhpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvciIsImVuYWJsZUFuZ3VsYXJNb3RvciIsImhpbmdlX2Rpc2FibGVNb3RvciIsImVuYWJsZU1vdG9yIiwic2xpZGVyX3NldExpbWl0cyIsInNldExvd2VyTGluTGltaXQiLCJzZXRVcHBlckxpbkxpbWl0Iiwic2V0TG93ZXJBbmdMaW1pdCIsInNldFVwcGVyQW5nTGltaXQiLCJzbGlkZXJfc2V0UmVzdGl0dXRpb24iLCJzZXRTb2Z0bmVzc0xpbUxpbiIsInNldFNvZnRuZXNzTGltQW5nIiwic2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yIiwic2V0VGFyZ2V0TGluTW90b3JWZWxvY2l0eSIsInNldE1heExpbk1vdG9yRm9yY2UiLCJzZXRQb3dlcmVkTGluTW90b3IiLCJzbGlkZXJfZGlzYWJsZUxpbmVhck1vdG9yIiwic2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvciIsInNldFRhcmdldEFuZ01vdG9yVmVsb2NpdHkiLCJzZXRNYXhBbmdNb3RvckZvcmNlIiwic2V0UG93ZXJlZEFuZ01vdG9yIiwic2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3IiLCJjb25ldHdpc3Rfc2V0TGltaXQiLCJjb25ldHdpc3RfZW5hYmxlTW90b3IiLCJjb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlIiwic2V0TWF4TW90b3JJbXB1bHNlIiwiY29uZXR3aXN0X3NldE1vdG9yVGFyZ2V0Iiwic2V0TW90b3JUYXJnZXQiLCJjb25ldHdpc3RfZGlzYWJsZU1vdG9yIiwiZG9mX3NldExpbmVhckxvd2VyTGltaXQiLCJzZXRMaW5lYXJMb3dlckxpbWl0IiwiZG9mX3NldExpbmVhclVwcGVyTGltaXQiLCJzZXRMaW5lYXJVcHBlckxpbWl0IiwiZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0Iiwic2V0QW5ndWxhckxvd2VyTGltaXQiLCJkb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQiLCJzZXRBbmd1bGFyVXBwZXJMaW1pdCIsImRvZl9lbmFibGVBbmd1bGFyTW90b3IiLCJtb3RvciIsImdldFJvdGF0aW9uYWxMaW1pdE1vdG9yIiwic2V0X21fZW5hYmxlTW90b3IiLCJkb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yIiwic2V0X21fbG9MaW1pdCIsInNldF9tX2hpTGltaXQiLCJzZXRfbV90YXJnZXRWZWxvY2l0eSIsInNldF9tX21heE1vdG9yRm9yY2UiLCJkb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvciIsInJlcG9ydFdvcmxkIiwid29ybGRyZXBvcnQiLCJnZXRDZW50ZXJPZk1hc3NUcmFuc2Zvcm0iLCJvcmlnaW4iLCJnZXRPcmlnaW4iLCJvZmZzZXQiLCJnZXRMaW5lYXJWZWxvY2l0eSIsImdldEFuZ3VsYXJWZWxvY2l0eSIsIlNPRlRSRVBPUlQiLCJvZmZzZXRWZXJ0Iiwibm9kZXMiLCJ2ZXJ0IiwiZ2V0X21feCIsIm9mZiIsImdldF9tX24iLCJmYWNlcyIsImZhY2UiLCJub2RlMSIsIm5vZGUyIiwibm9kZTMiLCJ2ZXJ0MSIsInZlcnQyIiwidmVydDMiLCJub3JtYWwxIiwibm9ybWFsMiIsIm5vcm1hbDMiLCJyZXBvcnRDb2xsaXNpb25zIiwiZHAiLCJnZXREaXNwYXRjaGVyIiwibnVtIiwiZ2V0TnVtTWFuaWZvbGRzIiwibWFuaWZvbGQiLCJnZXRNYW5pZm9sZEJ5SW5kZXhJbnRlcm5hbCIsIm51bV9jb250YWN0cyIsImdldE51bUNvbnRhY3RzIiwicHQiLCJnZXRDb250YWN0UG9pbnQiLCJnZXRCb2R5MCIsImdldEJvZHkxIiwiZ2V0X21fbm9ybWFsV29ybGRPbkIiLCJnZXROdW1XaGVlbHMiLCJnZXRXaGVlbEluZm8iLCJnZXRfbV93b3JsZFRyYW5zZm9ybSIsImxlbmdodCIsIm9mZnNldF9ib2R5IiwiZ2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwiZXZlbnQiLCJXb3JsZE1vZHVsZSIsImJyaWRnZSIsImRlZmVyIiwib25BZGRDYWxsYmFjayIsImJpbmQiLCJvblJlbW92ZUNhbGxiYWNrIiwiT2JqZWN0IiwiYXNzaWduIiwic3RhcnQiLCJwZXJmb3JtYW5jZSIsIndvcmtlciIsIlBoeXNpY3NXb3JrZXIiLCJpc0xvYWRlZCIsImxvYWRlciIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwid2FzbSIsInRoZW4iLCJyZXNwb25zZSIsImFycmF5QnVmZmVyIiwiX21hdGVyaWFsc19yZWZfY291bnRzIiwiX2lzX3NpbXVsYXRpbmciLCJfaWQiLCJfdGVtcCIsInVwZGF0ZVNjZW5lIiwidXBkYXRlU29mdGJvZGllcyIsInVwZGF0ZUNvbGxpc2lvbnMiLCJ1cGRhdGVWZWhpY2xlcyIsInVwZGF0ZUNvbnN0cmFpbnRzIiwiZGVidWciLCJkaXIiLCJpbmZvIiwiX19kaXJ0eVBvc2l0aW9uIiwic2V0IiwiX19kaXJ0eVJvdGF0aW9uIiwibGluZWFyVmVsb2NpdHkiLCJhbmd1bGFyVmVsb2NpdHkiLCJhdHRyaWJ1dGVzIiwiZ2VvbWV0cnkiLCJ2b2x1bWVQb3NpdGlvbnMiLCJhcnJheSIsImlzU29mdEJvZHlSZXNldCIsInZvbHVtZU5vcm1hbHMiLCJvZmZzIiwieDEiLCJ5MSIsInoxIiwibngxIiwibnkxIiwibnoxIiwieDIiLCJ5MiIsInoyIiwibngyIiwibnkyIiwibnoyIiwieDMiLCJ5MyIsInozIiwibngzIiwibnkzIiwibnozIiwiaTkiLCJuZWVkc1VwZGF0ZSIsIm54IiwibnkiLCJueiIsImV4dHJhY3RSb3RhdGlvbiIsIm1hdHJpeCIsImFkZFZlY3RvcnMiLCJjb2xsaXNpb25zIiwibm9ybWFsX29mZnNldHMiLCJvYmplY3QyIiwiaWQxIiwidG91Y2hlcyIsImlkMiIsImNvbXBvbmVudDIiLCJkYXRhMiIsInZlbCIsInZlbDIiLCJzdWJWZWN0b3JzIiwidGVtcDEiLCJ0ZW1wMiIsIm5vcm1hbF9vZmZzZXQiLCJlbWl0Iiwic2hvd19tYXJrZXIiLCJnZXREZWZpbml0aW9uIiwibWFya2VyIiwiU3BoZXJlR2VvbWV0cnkiLCJNZXNoTm9ybWFsTWF0ZXJpYWwiLCJCb3hHZW9tZXRyeSIsIm5hdGl2ZSIsIm1hbmFnZXIiLCJyZW1vdmUiLCJwb3AiLCJtYXRlcmlhbCIsImZ1bmMiLCJhcmdzIiwiZ3Jhdml0eSIsIl9zdGF0cyIsImJlZ2luIiwib2JqZWN0X2lkIiwidXBkYXRlIiwiaXNTb2Z0Ym9keSIsImVuZCIsInNpbXVsYXRlTG9vcCIsIkxvb3AiLCJjbG9jayIsImdldERlbHRhIiwicHJvcGVydGllcyIsIl9uYXRpdmUiLCJ2ZWN0b3IzIiwic2NvcGUiLCJkZWZpbmVQcm9wZXJ0aWVzIiwiX3giLCJfeSIsIl96IiwiX19jX3JvdCIsIm9uQ2hhbmdlIiwiZXVsZXIiLCJyb3QiLCJ3cmFwUGh5c2ljc1Byb3RvdHlwZSIsImtleSIsImRlZmluZVByb3BlcnR5IiwiZ2V0Iiwib25Db3B5Iiwic291cmNlUGh5c2ljcyIsIm1vZHVsZXMiLCJvbldyYXAiLCJBUEkiLCJmYWN0b3IiLCJkZWZhdWx0cyIsImRlZmluZSIsImhhcyIsIm1vZHVsZSIsInJlc3VsdCIsImNvbnN0cnVjdG9yIiwicmlnaWRib2R5IiwiQm94TW9kdWxlIiwiUGh5c2ljc01vZHVsZSIsInVwZGF0ZURhdGEiLCJib3VuZGluZ0JveCIsImNvbXB1dGVCb3VuZGluZ0JveCIsIm1heCIsIm1pbiIsIkNvbXBvdW5kTW9kdWxlIiwiQ2Fwc3VsZU1vZHVsZSIsIkNvbmNhdmVNb2R1bGUiLCJnZW9tZXRyeVByb2Nlc3NvciIsImlzQnVmZmVyR2VvbWV0cnkiLCJ2ZXJ0aWNlcyIsInZBIiwidkIiLCJ2QyIsImMiLCJDb25lTW9kdWxlIiwiQ29udmV4TW9kdWxlIiwiX2J1ZmZlckdlb21ldHJ5IiwiQnVmZmVyR2VvbWV0cnkiLCJmcm9tR2VvbWV0cnkiLCJDeWxpbmRlck1vZHVsZSIsIkhlaWdodGZpZWxkTW9kdWxlIiwiVmVjdG9yMiIsInhkaXYiLCJ5ZGl2IiwidmVydHMiLCJ4c2l6ZSIsInlzaXplIiwic3FydCIsImFicyIsInZOdW0iLCJyb3VuZCIsIm11bHRpcGx5IiwiYXV0b0FsaWduIiwidHJhbnNsYXRlIiwiUGxhbmVNb2R1bGUiLCJTcGhlcmVNb2R1bGUiLCJib3VuZGluZ1NwaGVyZSIsImNvbXB1dGVCb3VuZGluZ1NwaGVyZSIsIlNvZnRib2R5TW9kdWxlIiwiaWR4R2VvbWV0cnkiLCJtZXJnZVZlcnRpY2VzIiwiYnVmZmVyR2VvbWV0cnkiLCJhZGRBdHRyaWJ1dGUiLCJCdWZmZXJBdHRyaWJ1dGUiLCJjb3B5VmVjdG9yM3NBcnJheSIsInNldEluZGV4IiwiVWludDMyQXJyYXkiLCJVaW50MTZBcnJheSIsImNvcHlJbmRpY2VzQXJyYXkiLCJvMSIsIm8yIiwiQ2xvdGhNb2R1bGUiLCJnZW9tUGFyYW1zIiwiZ2VvbSIsImZhY2VzTGVuZ3RoIiwibm9ybWFsc0FycmF5IiwiaTMiLCJ3aWR0aFNlZ21lbnRzIiwiaGVpZ2h0U2VnbWVudHMiLCJpZHgwMCIsImlkeDAxIiwiaWR4MTAiLCJpZHgxMSIsIlJvcGVNb2R1bGUiLCJidWZmIiwiZnJvbUFycmF5IiwibiIsInYxIiwidjIiLCJQSV8yIiwiRmlyc3RQZXJzb25Db250cm9sc1NvbHZlciIsImNhbWVyYSIsInZlbG9jaXR5RmFjdG9yIiwicnVuVmVsb2NpdHkiLCJwbGF5ZXIiLCJwaXRjaE9iamVjdCIsIk9iamVjdDNEIiwieWF3T2JqZWN0IiwieXBvcyIsImNhbkp1bXAiLCJtb3ZlQmFja3dhcmQiLCJtb3ZlTGVmdCIsIm1vdmVSaWdodCIsIm9uIiwib3RoZXJPYmplY3QiLCJ2IiwiciIsImNvbnRhY3ROb3JtYWwiLCJvbk1vdXNlTW92ZSIsImVuYWJsZWQiLCJtb3ZlbWVudFgiLCJtb3pNb3ZlbWVudFgiLCJnZXRNb3ZlbWVudFgiLCJtb3ZlbWVudFkiLCJtb3pNb3ZlbWVudFkiLCJnZXRNb3ZlbWVudFkiLCJvbktleURvd24iLCJrZXlDb2RlIiwib25LZXlVcCIsImdldE9iamVjdCIsImdldERpcmVjdGlvbiIsIm11bHRpcGx5VmVjdG9yMyIsInRhcmdldFZlYyIsImlucHV0VmVsb2NpdHkiLCJkZWx0YSIsInNwZWVkIiwibW92ZUZvcndhcmQiLCJvcmRlciIsImFwcGx5UXVhdGVybmlvbiIsIkZpcnN0UGVyc29uTW9kdWxlIiwiYmxvY2siLCJnZXRFbGVtZW50QnlJZCIsImNvbnRyb2xzIiwiZWxlbWVudCIsInBvaW50ZXJsb2NrY2hhbmdlIiwicG9pbnRlckxvY2tFbGVtZW50IiwibW96UG9pbnRlckxvY2tFbGVtZW50Iiwid2Via2l0UG9pbnRlckxvY2tFbGVtZW50Iiwic3R5bGUiLCJkaXNwbGF5IiwicG9pbnRlcmxvY2tlcnJvciIsIndhcm4iLCJxdWVyeVNlbGVjdG9yIiwicmVxdWVzdFBvaW50ZXJMb2NrIiwibW96UmVxdWVzdFBvaW50ZXJMb2NrIiwid2Via2l0UmVxdWVzdFBvaW50ZXJMb2NrIiwicmVxdWVzdEZ1bGxzY3JlZW4iLCJtb3pSZXF1ZXN0RnVsbHNjcmVlbiIsIm1velJlcXVlc3RGdWxsU2NyZWVuIiwid2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4iLCJmdWxsc2NyZWVuY2hhbmdlIiwiZnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsc2NyZWVuRWxlbWVudCIsIm1vekZ1bGxTY3JlZW5FbGVtZW50IiwidXBkYXRlUHJvY2Vzc29yIiwidXBkYXRlTG9vcCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQU1BLElBQU1BLGdCQUFnQjtlQUNQLENBRE87bUJBRUgsQ0FGRztpQkFHTCxDQUhLO29CQUlGLENBSkU7Y0FLUjtDQUxkOztBQVFBLElBQU1DLGtCQUFrQixFQUF4QjtJQUNFQywyQkFBMkIsQ0FEN0I7SUFFRUMseUJBQXlCLENBRjNCO0lBR0VDLDRCQUE0QixDQUg5Qjs7QUFLQSxJQUFNQyxlQUFlLElBQUlDLGFBQUosRUFBckI7SUFDRUMsZUFBZSxJQUFJRCxhQUFKLEVBRGpCO0lBRUVFLGVBQWUsSUFBSUMsYUFBSixFQUZqQjtJQUdFQyxZQUFZLElBQUlDLGdCQUFKLEVBSGQ7O0FBS0EsSUFBTUMsNEJBQTRCLFNBQTVCQSx5QkFBNEIsQ0FBQ0MsQ0FBRCxFQUFJQyxDQUFKLEVBQU9DLENBQVAsRUFBVUMsQ0FBVixFQUFnQjtTQUN6QyxJQUFJVixhQUFKLENBQ0xXLEtBQUtDLEtBQUwsQ0FBVyxLQUFLTCxJQUFJRyxDQUFKLEdBQVFGLElBQUlDLENBQWpCLENBQVgsRUFBaUNDLElBQUlBLENBQUosR0FBUUgsSUFBSUEsQ0FBWixHQUFnQkMsSUFBSUEsQ0FBcEIsR0FBd0JDLElBQUlBLENBQTdELENBREssRUFFTEUsS0FBS0UsSUFBTCxDQUFVLEtBQUtOLElBQUlFLENBQUosR0FBUUQsSUFBSUUsQ0FBakIsQ0FBVixDQUZLLEVBR0xDLEtBQUtDLEtBQUwsQ0FBVyxLQUFLSCxJQUFJQyxDQUFKLEdBQVFILElBQUlDLENBQWpCLENBQVgsRUFBaUNFLElBQUlBLENBQUosR0FBUUgsSUFBSUEsQ0FBWixHQUFnQkMsSUFBSUEsQ0FBcEIsR0FBd0JDLElBQUlBLENBQTdELENBSEssQ0FBUDtDQURGOztBQVFBLElBQU1LLHlCQUF5QixTQUF6QkEs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
