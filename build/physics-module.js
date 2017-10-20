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
        var _data = component.use('physics').data;

        if (_object === null) continue;

        // If object touches anything, ...
        if (collisions[id1]) {
          // Clean up touches array
          for (var j = 0; j < _data.touches.length; j++) {
            if (collisions[id1].indexOf(_data.touches[j]) === -1) _data.touches.splice(j--, 1);
          }

          // Handle each colliding object
          for (var _j = 0; _j < collisions[id1].length; _j++) {
            var id2 = collisions[id1][_j];
            var _object2 = this._objects[id2];
            var component2 = _object2.component;
            var data2 = component2.use('physics').data;

            if (_object2) {
              // If object was not already touching object2, notify object
              if (_data.touches.indexOf(id2) === -1) {
                _data.touches.push(id2);

                var vel = component.use('physics').getLinearVelocity();
                var vel2 = component2.use('physics').getLinearVelocity();

                temp1Vector3.subVectors(vel, vel2);
                var temp1 = temp1Vector3.clone();
                var temp2 = temp1Vector3.clone();

                var normal_offset = normal_offsets[_data.id + '-' + data2.id];

                if (normal_offset > 0) {
                  temp1Vector3.set(-_data[normal_offset], -_data[normal_offset + 1], -_data[normal_offset + 2]);
                } else {
                  normal_offset *= -1;

                  temp1Vector3.set(_data[normal_offset], _data[normal_offset + 1], _data[normal_offset + 2]);
                }

                component.emit('collision', _object2, temp1, temp2, temp1Vector3);
              }
            }
          }
        } else _data.touches.length = 0; // not touching other objects
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
      var data = object.component.use('physics').data;

      if (data) {
        component.manager.set('module:world', this);
        data.id = this.getObjectId();

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

          if (object.material._physijs) {
            if (this._materials_ref_counts.hasOwnProperty(object.material._physijs.id)) this._materials_ref_counts[object.material._physijs.id]++;else {
              this.execute('registerMaterial', object.material._physijs);
              data.materialId = object.material._physijs.id;
              this._materials_ref_counts[object.material._physijs.id] = 1;
            }
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
        callback(geometry, module);
        return geometry;
      };
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

var _class$1;
var _temp$1;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkuanMiLCIuLi9zcmMvZXZlbnRhYmxlLmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0NvbmVUd2lzdENvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvSGluZ2VDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL1BvaW50Q29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9TbGlkZXJDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0RPRkNvbnN0cmFpbnQuanMiLCIuLi9zcmMvdmVoaWNsZS92ZWhpY2xlLmpzIiwiLi4vYnVuZGxlLXdvcmtlci93b3JrZXJoZWxwZXIuanMiLCIuLi9zcmMvd29ya2VyLmpzIiwiLi4vc3JjL21vZHVsZXMvV29ybGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9waHlzaWNzUHJvdG90eXBlLmpzIiwiLi4vc3JjL21vZHVsZXMvUGh5c2ljc01vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0JveE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbXBvdW5kTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ2Fwc3VsZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbmNhdmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db25lTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29udmV4TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ3lsaW5kZXJNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9IZWlnaHRmaWVsZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1BsYW5lTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvU3BoZXJlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvU29mdGJvZHlNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DbG90aE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1JvcGVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb250cm9scy9GaXJzdFBlcnNvbk1vZHVsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBWZWN0b3IzLFxuICBNYXRyaXg0LFxuICBRdWF0ZXJuaW9uXG59IGZyb20gJ3RocmVlJztcblxuY29uc3QgTUVTU0FHRV9UWVBFUyA9IHtcbiAgV09STERSRVBPUlQ6IDAsXG4gIENPTExJU0lPTlJFUE9SVDogMSxcbiAgVkVISUNMRVJFUE9SVDogMixcbiAgQ09OU1RSQUlOVFJFUE9SVDogMyxcbiAgU09GVFJFUE9SVDogNFxufTtcblxuY29uc3QgUkVQT1JUX0lURU1TSVpFID0gMTQsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSA9IDUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgPSA5LFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFID0gNjtcblxuY29uc3QgdGVtcDFWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDJWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDFNYXRyaXg0ID0gbmV3IE1hdHJpeDQoKSxcbiAgdGVtcDFRdWF0ID0gbmV3IFF1YXRlcm5pb24oKTtcblxuY29uc3QgZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiA9ICh4LCB5LCB6LCB3KSA9PiB7XG4gIHJldHVybiBuZXcgVmVjdG9yMyhcbiAgICBNYXRoLmF0YW4yKDIgKiAoeCAqIHcgLSB5ICogeiksICh3ICogdyAtIHggKiB4IC0geSAqIHkgKyB6ICogeikpLFxuICAgIE1hdGguYXNpbigyICogKHggKiB6ICsgeSAqIHcpKSxcbiAgICBNYXRoLmF0YW4yKDIgKiAoeiAqIHcgLSB4ICogeSksICh3ICogdyArIHggKiB4IC0geSAqIHkgLSB6ICogeikpXG4gICk7XG59O1xuXG5jb25zdCBnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyID0gKHgsIHksIHopID0+IHtcbiAgY29uc3QgYzEgPSBNYXRoLmNvcyh5KTtcbiAgY29uc3QgczEgPSBNYXRoLnNpbih5KTtcbiAgY29uc3QgYzIgPSBNYXRoLmNvcygteik7XG4gIGNvbnN0IHMyID0gTWF0aC5zaW4oLXopO1xuICBjb25zdCBjMyA9IE1hdGguY29zKHgpO1xuICBjb25zdCBzMyA9IE1hdGguc2luKHgpO1xuICBjb25zdCBjMWMyID0gYzEgKiBjMjtcbiAgY29uc3QgczFzMiA9IHMxICogczI7XG5cbiAgcmV0dXJuIHtcbiAgICB3OiBjMWMyICogYzMgLSBzMXMyICogczMsXG4gICAgeDogYzFjMiAqIHMzICsgczFzMiAqIGMzLFxuICAgIHk6IHMxICogYzIgKiBjMyArIGMxICogczIgKiBzMyxcbiAgICB6OiBjMSAqIHMyICogYzMgLSBzMSAqIGMyICogczNcbiAgfTtcbn07XG5cbmNvbnN0IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QgPSAocG9zaXRpb24sIG9iamVjdCkgPT4ge1xuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKTsgLy8gcmVzZXQgdGVtcCBtYXRyaXhcblxuICAvLyBTZXQgdGhlIHRlbXAgbWF0cml4J3Mgcm90YXRpb24gdG8gdGhlIG9iamVjdCdzIHJvdGF0aW9uXG4gIHRlbXAxTWF0cml4NC5pZGVudGl0eSgpLm1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKG9iamVjdC5xdWF0ZXJuaW9uKTtcblxuICAvLyBJbnZlcnQgcm90YXRpb24gbWF0cml4IGluIG9yZGVyIHRvIFwidW5yb3RhdGVcIiBhIHBvaW50IGJhY2sgdG8gb2JqZWN0IHNwYWNlXG4gIHRlbXAxTWF0cml4NC5nZXRJbnZlcnNlKHRlbXAxTWF0cml4NCk7XG5cbiAgLy8gWWF5ISBUZW1wIHZhcnMhXG4gIHRlbXAxVmVjdG9yMy5jb3B5KHBvc2l0aW9uKTtcbiAgdGVtcDJWZWN0b3IzLmNvcHkob2JqZWN0LnBvc2l0aW9uKTtcblxuICAvLyBBcHBseSB0aGUgcm90YXRpb25cbiAgcmV0dXJuIHRlbXAxVmVjdG9yMy5zdWIodGVtcDJWZWN0b3IzKS5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcbn07XG5cbmNvbnN0IGFkZE9iamVjdENoaWxkcmVuID0gZnVuY3Rpb24gKHBhcmVudCwgb2JqZWN0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGQgPSBvYmplY3QuY2hpbGRyZW5baV07XG4gICAgY29uc3QgX3BoeXNpanMgPSBjaGlsZC5jb21wb25lbnQuX3BoeXNpanM7XG5cbiAgICBpZiAoX3BoeXNpanMpIHtcbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgY2hpbGQudXBkYXRlTWF0cml4V29ybGQoKTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldEZyb21NYXRyaXhQb3NpdGlvbihjaGlsZC5tYXRyaXhXb3JsZCk7XG4gICAgICB0ZW1wMVF1YXQuc2V0RnJvbVJvdGF0aW9uTWF0cml4KGNoaWxkLm1hdHJpeFdvcmxkKTtcblxuICAgICAgX3BoeXNpanMucG9zaXRpb25fb2Zmc2V0ID0ge1xuICAgICAgICB4OiB0ZW1wMVZlY3RvcjMueCxcbiAgICAgICAgeTogdGVtcDFWZWN0b3IzLnksXG4gICAgICAgIHo6IHRlbXAxVmVjdG9yMy56XG4gICAgICB9O1xuXG4gICAgICBfcGh5c2lqcy5yb3RhdGlvbiA9IHtcbiAgICAgICAgeDogdGVtcDFRdWF0LngsXG4gICAgICAgIHk6IHRlbXAxUXVhdC55LFxuICAgICAgICB6OiB0ZW1wMVF1YXQueixcbiAgICAgICAgdzogdGVtcDFRdWF0LndcbiAgICAgIH07XG5cbiAgICAgIHBhcmVudC5jb21wb25lbnQuX3BoeXNpanMuY2hpbGRyZW4ucHVzaChfcGh5c2lqcyk7XG4gICAgfVxuXG4gICAgYWRkT2JqZWN0Q2hpbGRyZW4ocGFyZW50LCBjaGlsZCk7XG4gIH1cbn07XG5cbmV4cG9ydCB7XG4gIGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24sXG4gIGdldFF1YXRlcnRpb25Gcm9tRXVsZXIsXG4gIGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QsXG4gIGFkZE9iamVjdENoaWxkcmVuLFxuXG4gIE1FU1NBR0VfVFlQRVMsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFLFxuXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDJWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIHRlbXAxUXVhdFxufTtcbiIsImV4cG9ydCBjbGFzcyBFdmVudGFibGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9ldmVudExpc3RlbmVycyA9IHt9O1xuICB9XG5cbiAgYWRkRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICghdGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpXG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXSA9IFtdO1xuXG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50X25hbWUsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGluZGV4O1xuXG4gICAgaWYgKCF0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKChpbmRleCA9IHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLmluZGV4T2YoY2FsbGJhY2spKSA+PSAwKSB7XG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZGlzcGF0Y2hFdmVudChldmVudF9uYW1lKSB7XG4gICAgbGV0IGk7XG4gICAgY29uc3QgcGFyYW1ldGVycyA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgaWYgKHRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdW2ldLmFwcGx5KHRoaXMsIHBhcmFtZXRlcnMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBtYWtlKG9iaikge1xuICAgIG9iai5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IEV2ZW50YWJsZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcbiAgICBvYmoucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBFdmVudGFibGUucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG4gICAgb2JqLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gRXZlbnRhYmxlLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBDb25lVHdpc3RDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBjb25zdCBvYmplY3RiID0gb2JqYTtcblxuICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKSBjb25zb2xlLmVycm9yKCdCb3RoIG9iamVjdHMgbXVzdCBiZSBkZWZpbmVkIGluIGEgQ29uZVR3aXN0Q29uc3RyYWludC4nKTtcblxuICAgIHRoaXMudHlwZSA9ICdjb25ldHdpc3QnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpc2EgPSB7eDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24uen07XG4gICAgdGhpcy5heGlzYiA9IHt4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56fTtcbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0KHgsIHksIHopIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRMaW1pdCcsIHtjb25zdHJhaW50OiB0aGlzLmlkLCB4LCB5LCB6fSk7XG4gIH1cblxuICBlbmFibGVNb3RvcigpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9lbmFibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBzZXRNYXhNb3RvckltcHVsc2UobWF4X2ltcHVsc2UpIHtcbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UnLCB7Y29uc3RyYWludDogdGhpcy5pZCwgbWF4X2ltcHVsc2V9KTtcbiAgfVxuXG4gIHNldE1vdG9yVGFyZ2V0KHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBUSFJFRS5WZWN0b3IzKVxuICAgICAgdGFyZ2V0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIobmV3IFRIUkVFLkV1bGVyKHRhcmdldC54LCB0YXJnZXQueSwgdGFyZ2V0LnopKTtcbiAgICBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBUSFJFRS5FdWxlcilcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHRhcmdldCk7XG4gICAgZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuTWF0cml4NClcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbVJvdGF0aW9uTWF0cml4KHRhcmdldCk7XG5cbiAgICBpZih0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2NvbmV0d2lzdF9zZXRNb3RvclRhcmdldCcsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB4OiB0YXJnZXQueCxcbiAgICAgIHk6IHRhcmdldC55LFxuICAgICAgejogdGFyZ2V0LnosXG4gICAgICB3OiB0YXJnZXQud1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBIaW5nZUNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbiwgYXhpcykge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChheGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF4aXMgPSBwb3NpdGlvbjtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2hpbmdlJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLl9waHlzaWpzLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24uY2xvbmUoKTtcbiAgICB0aGlzLmF4aXMgPSBheGlzO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIuX3BoeXNpanMuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXM6IHRoaXMuYXhpc1xuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdHMobG93LCBoaWdoLCBiaWFzX2ZhY3RvciwgcmVsYXhhdGlvbl9mYWN0b3IpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdoaW5nZV9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbG93LFxuICAgICAgaGlnaCxcbiAgICAgIGJpYXNfZmFjdG9yLFxuICAgICAgcmVsYXhhdGlvbl9mYWN0b3JcbiAgICB9KTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZGlzYWJsZU1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgUG9pbnRDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAncG9pbnQnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIuX3BoeXNpanMuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYlxuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIFNsaWRlckNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbiwgYXhpcykge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChheGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF4aXMgPSBwb3NpdGlvbjtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ3NsaWRlcic7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS5fcGh5c2lqcy5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxpbl9sb3dlciwgbGluX3VwcGVyLCBhbmdfbG93ZXIsIGFuZ191cHBlcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbGluX2xvd2VyLFxuICAgICAgbGluX3VwcGVyLFxuICAgICAgYW5nX2xvd2VyLFxuICAgICAgYW5nX3VwcGVyXG4gICAgfSk7XG4gIH1cblxuICBzZXRSZXN0aXR1dGlvbihsaW5lYXIsIGFuZ3VsYXIpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKFxuICAgICAgJ3NsaWRlcl9zZXRSZXN0aXR1dGlvbicsXG4gICAgICB7XG4gICAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICAgIGxpbmVhcixcbiAgICAgICAgYW5ndWxhclxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBlbmFibGVMaW5lYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTGluZWFyTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIHRoaXMuc2NlbmUuZXhlY3V0ZSgnc2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZUFuZ3VsYXJNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIERPRkNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmICggcG9zaXRpb24gPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RvZic7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS5fcGh5c2lqcy5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QoIHBvc2l0aW9uLCBvYmplY3RhICkuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXNhID0geyB4OiBvYmplY3RhLnJvdGF0aW9uLngsIHk6IG9iamVjdGEucm90YXRpb24ueSwgejogb2JqZWN0YS5yb3RhdGlvbi56IH07XG5cbiAgICBpZiAoIG9iamVjdGIgKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YiApLmNsb25lKCk7XG4gICAgICB0aGlzLmF4aXNiID0geyB4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56IH07XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXNhOiB0aGlzLmF4aXNhLFxuICAgICAgYXhpc2I6IHRoaXMuYXhpc2JcbiAgICB9O1xuICB9XG5cbiAgc2V0TGluZWFyTG93ZXJMaW1pdChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRMaW5lYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyVXBwZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyTG93ZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZW5hYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG5cbiAgY29uZmlndXJlQW5ndWxhck1vdG9yICh3aGljaCwgbG93X2FuZ2xlLCBoaWdoX2FuZ2xlLCB2ZWxvY2l0eSwgbWF4X2ZvcmNlICkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2gsIGxvd19hbmdsZTogbG93X2FuZ2xlLCBoaWdoX2FuZ2xlOiBoaWdoX2FuZ2xlLCB2ZWxvY2l0eTogdmVsb2NpdHksIG1heF9mb3JjZTogbWF4X2ZvcmNlIH0gKTtcbiAgfVxuXG4gIGRpc2FibGVBbmd1bGFyTW90b3IgKHdoaWNoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9kaXNhYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG59XG4iLCJpbXBvcnQge01lc2h9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7VmVoaWNsZVR1bm5pbmd9IGZyb20gJy4vdHVubmluZyc7XG5cbmV4cG9ydCBjbGFzcyBWZWhpY2xlIHtcbiAgY29uc3RydWN0b3IobWVzaCwgdHVuaW5nID0gbmV3IFZlaGljbGVUdW5pbmcoKSkge1xuICAgIHRoaXMubWVzaCA9IG1lc2g7XG4gICAgdGhpcy53aGVlbHMgPSBbXTtcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICBpZDogZ2V0T2JqZWN0SWQoKSxcbiAgICAgIHJpZ2lkQm9keTogbWVzaC5fcGh5c2lqcy5pZCxcbiAgICAgIHN1c3BlbnNpb25fc3RpZmZuZXNzOiB0dW5pbmcuc3VzcGVuc2lvbl9zdGlmZm5lc3MsXG4gICAgICBzdXNwZW5zaW9uX2NvbXByZXNzaW9uOiB0dW5pbmcuc3VzcGVuc2lvbl9jb21wcmVzc2lvbixcbiAgICAgIHN1c3BlbnNpb25fZGFtcGluZzogdHVuaW5nLnN1c3BlbnNpb25fZGFtcGluZyxcbiAgICAgIG1heF9zdXNwZW5zaW9uX3RyYXZlbDogdHVuaW5nLm1heF9zdXNwZW5zaW9uX3RyYXZlbCxcbiAgICAgIGZyaWN0aW9uX3NsaXA6IHR1bmluZy5mcmljdGlvbl9zbGlwLFxuICAgICAgbWF4X3N1c3BlbnNpb25fZm9yY2U6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl9mb3JjZVxuICAgIH07XG4gIH1cblxuICBhZGRXaGVlbCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwsIGNvbm5lY3Rpb25fcG9pbnQsIHdoZWVsX2RpcmVjdGlvbiwgd2hlZWxfYXhsZSwgc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCwgd2hlZWxfcmFkaXVzLCBpc19mcm9udF93aGVlbCwgdHVuaW5nKSB7XG4gICAgY29uc3Qgd2hlZWwgPSBuZXcgTWVzaCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwpO1xuXG4gICAgd2hlZWwuY2FzdFNoYWRvdyA9IHdoZWVsLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgIHdoZWVsLnBvc2l0aW9uLmNvcHkod2hlZWxfZGlyZWN0aW9uKS5tdWx0aXBseVNjYWxhcihzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoIC8gMTAwKS5hZGQoY29ubmVjdGlvbl9wb2ludCk7XG5cbiAgICB0aGlzLndvcmxkLmFkZCh3aGVlbCk7XG4gICAgdGhpcy53aGVlbHMucHVzaCh3aGVlbCk7XG5cbiAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FkZFdoZWVsJywge1xuICAgICAgaWQ6IHRoaXMuX3BoeXNpanMuaWQsXG4gICAgICBjb25uZWN0aW9uX3BvaW50OiB7eDogY29ubmVjdGlvbl9wb2ludC54LCB5OiBjb25uZWN0aW9uX3BvaW50LnksIHo6IGNvbm5lY3Rpb25fcG9pbnQuen0sXG4gICAgICB3aGVlbF9kaXJlY3Rpb246IHt4OiB3aGVlbF9kaXJlY3Rpb24ueCwgeTogd2hlZWxfZGlyZWN0aW9uLnksIHo6IHdoZWVsX2RpcmVjdGlvbi56fSxcbiAgICAgIHdoZWVsX2F4bGU6IHt4OiB3aGVlbF9heGxlLngsIHk6IHdoZWVsX2F4bGUueSwgejogd2hlZWxfYXhsZS56fSxcbiAgICAgIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsXG4gICAgICB3aGVlbF9yYWRpdXMsXG4gICAgICBpc19mcm9udF93aGVlbCxcbiAgICAgIHR1bmluZ1xuICAgIH0pO1xuICB9XG5cbiAgc2V0U3RlZXJpbmcoYW1vdW50LCB3aGVlbCkge1xuICAgIGlmICh3aGVlbCAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2hlZWxzW3doZWVsXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldFN0ZWVyaW5nJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgc3RlZXJpbmc6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxuXG4gIHNldEJyYWtlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBicmFrZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRCcmFrZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIGJyYWtlOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBhcHBseUVuZ2luZUZvcmNlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnYXBwbHlFbmdpbmVGb3JjZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIGZvcmNlOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBmb3JjZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG59XG4iLCJ2YXIgVEFSR0VUID0gdHlwZW9mIFN5bWJvbCA9PT0gJ3VuZGVmaW5lZCcgPyAnX190YXJnZXQnIDogU3ltYm9sKCksXG4gICAgU0NSSVBUX1RZUEUgPSAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcsXG4gICAgQmxvYkJ1aWxkZXIgPSB3aW5kb3cuQmxvYkJ1aWxkZXIgfHwgd2luZG93LldlYktpdEJsb2JCdWlsZGVyIHx8IHdpbmRvdy5Nb3pCbG9iQnVpbGRlciB8fCB3aW5kb3cuTVNCbG9iQnVpbGRlcixcbiAgICBVUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwsXG4gICAgV29ya2VyID0gd2luZG93LldvcmtlcjtcblxuLyoqXG4gKiBSZXR1cm5zIGEgd3JhcHBlciBhcm91bmQgV2ViIFdvcmtlciBjb2RlIHRoYXQgaXMgY29uc3RydWN0aWJsZS5cbiAqXG4gKiBAZnVuY3Rpb24gc2hpbVdvcmtlclxuICpcbiAqIEBwYXJhbSB7IFN0cmluZyB9ICAgIGZpbGVuYW1lICAgIFRoZSBuYW1lIG9mIHRoZSBmaWxlXG4gKiBAcGFyYW0geyBGdW5jdGlvbiB9ICBmbiAgICAgICAgICBGdW5jdGlvbiB3cmFwcGluZyB0aGUgY29kZSBvZiB0aGUgd29ya2VyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNoaW1Xb3JrZXIgKGZpbGVuYW1lLCBmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiBTaGltV29ya2VyIChmb3JjZUZhbGxiYWNrKSB7XG4gICAgICAgIHZhciBvID0gdGhpcztcblxuICAgICAgICBpZiAoIWZuKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFdvcmtlcihmaWxlbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoV29ya2VyICYmICFmb3JjZUZhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBmdW5jdGlvbidzIGlubmVyIGNvZGUgdG8gYSBzdHJpbmcgdG8gY29uc3RydWN0IHRoZSB3b3JrZXJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBmbi50b1N0cmluZygpLnJlcGxhY2UoL15mdW5jdGlvbi4rP3svLCAnJykuc2xpY2UoMCwgLTEpLFxuICAgICAgICAgICAgICAgIG9ialVSTCA9IGNyZWF0ZVNvdXJjZU9iamVjdChzb3VyY2UpO1xuXG4gICAgICAgICAgICB0aGlzW1RBUkdFVF0gPSBuZXcgV29ya2VyKG9ialVSTCk7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKG9ialVSTCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tUQVJHRVRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNlbGZTaGltID0ge1xuICAgICAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZTogZnVuY3Rpb24obSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8ub25tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBvLm9ubWVzc2FnZSh7IGRhdGE6IG0sIHRhcmdldDogc2VsZlNoaW0gfSkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmbi5jYWxsKHNlbGZTaGltKTtcbiAgICAgICAgICAgIHRoaXMucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBzZWxmU2hpbS5vbm1lc3NhZ2UoeyBkYXRhOiBtLCB0YXJnZXQ6IG8gfSkgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5pc1RoaXNUaHJlYWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8vIFRlc3QgV29ya2VyIGNhcGFiaWxpdGllc1xuaWYgKFdvcmtlcikge1xuICAgIHZhciB0ZXN0V29ya2VyLFxuICAgICAgICBvYmpVUkwgPSBjcmVhdGVTb3VyY2VPYmplY3QoJ3NlbGYub25tZXNzYWdlID0gZnVuY3Rpb24gKCkge30nKSxcbiAgICAgICAgdGVzdEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoMSk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBObyB3b3JrZXJzIHZpYSBibG9icyBpbiBFZGdlIDEyIGFuZCBJRSAxMSBhbmQgbG93ZXIgOihcbiAgICAgICAgaWYgKC8oPzpUcmlkZW50fEVkZ2UpXFwvKD86WzU2N118MTIpL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYXZhaWxhYmxlJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGVzdFdvcmtlciA9IG5ldyBXb3JrZXIob2JqVVJMKTtcblxuICAgICAgICAvLyBOYXRpdmUgYnJvd3NlciBvbiBzb21lIFNhbXN1bmcgZGV2aWNlcyB0aHJvd3MgZm9yIHRyYW5zZmVyYWJsZXMsIGxldCdzIGRldGVjdCBpdFxuICAgICAgICB0ZXN0V29ya2VyLnBvc3RNZXNzYWdlKHRlc3RBcnJheSwgW3Rlc3RBcnJheS5idWZmZXJdKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgV29ya2VyID0gbnVsbDtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwob2JqVVJMKTtcbiAgICAgICAgaWYgKHRlc3RXb3JrZXIpIHtcbiAgICAgICAgICAgIHRlc3RXb3JrZXIudGVybWluYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNvdXJjZU9iamVjdChzdHIpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbc3RyXSwgeyB0eXBlOiBTQ1JJUFRfVFlQRSB9KSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBibG9iID0gbmV3IEJsb2JCdWlsZGVyKCk7XG4gICAgICAgIGJsb2IuYXBwZW5kKHN0cik7XG4gICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IuZ2V0QmxvYih0eXBlKSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHNoaW1Xb3JrZXIgZnJvbSAncm9sbHVwLXBsdWdpbi1idW5kbGUtd29ya2VyJztcbmV4cG9ydCBkZWZhdWx0IG5ldyBzaGltV29ya2VyKFwiLi4vd29ya2VyLmpzXCIsIGZ1bmN0aW9uICh3aW5kb3csIGRvY3VtZW50KSB7XG52YXIgc2VsZiA9IHRoaXM7XG5jb25zdCB0cmFuc2ZlcmFibGVNZXNzYWdlID0gc2VsZi53ZWJraXRQb3N0TWVzc2FnZSB8fCBzZWxmLnBvc3RNZXNzYWdlLFxuXG4vLyBlbnVtXG5NRVNTQUdFX1RZUEVTID0ge1xuICBXT1JMRFJFUE9SVDogMCxcbiAgQ09MTElTSU9OUkVQT1JUOiAxLFxuICBWRUhJQ0xFUkVQT1JUOiAyLFxuICBDT05TVFJBSU5UUkVQT1JUOiAzLFxuICBTT0ZUUkVQT1JUOiA0XG59O1xuXG4gIC8vIHRlbXAgdmFyaWFibGVzXG5sZXQgX29iamVjdCxcbiAgX3ZlY3RvcixcbiAgX3RyYW5zZm9ybSxcbiAgX3RyYW5zZm9ybV9wb3MsXG4gIF9zb2Z0Ym9keV9lbmFibGVkID0gZmFsc2UsXG4gIGxhc3Rfc2ltdWxhdGlvbl9kdXJhdGlvbiA9IDAsXG5cbiAgX251bV9vYmplY3RzID0gMCxcbiAgX251bV9yaWdpZGJvZHlfb2JqZWN0cyA9IDAsXG4gIF9udW1fc29mdGJvZHlfb2JqZWN0cyA9IDAsXG4gIF9udW1fd2hlZWxzID0gMCxcbiAgX251bV9jb25zdHJhaW50cyA9IDAsXG4gIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSA9IDAsXG5cbiAgLy8gd29ybGQgdmFyaWFibGVzXG4gIGZpeGVkVGltZVN0ZXAsIC8vIHVzZWQgd2hlbiBjYWxsaW5nIHN0ZXBTaW11bGF0aW9uXG4gIGxhc3Rfc2ltdWxhdGlvbl90aW1lLFxuXG4gIHdvcmxkLFxuICBfdmVjM18xLFxuICBfdmVjM18yLFxuICBfdmVjM18zLFxuICBfcXVhdDtcblxuICAvLyBwcml2YXRlIGNhY2hlXG5jb25zdCBwdWJsaWNfZnVuY3Rpb25zID0ge30sXG4gIF9vYmplY3RzID0gW10sXG4gIF92ZWhpY2xlcyA9IFtdLFxuICBfY29uc3RyYWludHMgPSBbXSxcbiAgX29iamVjdHNfYW1tbyA9IHt9LFxuICBfb2JqZWN0X3NoYXBlcyA9IHt9LFxuXG4gIC8vIFRoZSBmb2xsb3dpbmcgb2JqZWN0cyBhcmUgdG8gdHJhY2sgb2JqZWN0cyB0aGF0IGFtbW8uanMgZG9lc24ndCBjbGVhblxuICAvLyB1cC4gQWxsIGFyZSBjbGVhbmVkIHVwIHdoZW4gdGhleSdyZSBjb3JyZXNwb25kaW5nIGJvZHkgaXMgZGVzdHJveWVkLlxuICAvLyBVbmZvcnR1bmF0ZWx5LCBpdCdzIHZlcnkgZGlmZmljdWx0IHRvIGdldCBhdCB0aGVzZSBvYmplY3RzIGZyb20gdGhlXG4gIC8vIGJvZHksIHNvIHdlIGhhdmUgdG8gdHJhY2sgdGhlbSBvdXJzZWx2ZXMuXG4gIF9tb3Rpb25fc3RhdGVzID0ge30sXG4gIC8vIERvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgaXQgZm9yIGNhY2hlZCBzaGFwZXMuXG4gIF9ub25jYWNoZWRfc2hhcGVzID0ge30sXG4gIC8vIEEgYm9keSB3aXRoIGEgY29tcG91bmQgc2hhcGUgYWx3YXlzIGhhcyBhIHJlZ3VsYXIgc2hhcGUgYXMgd2VsbCwgc28gd2VcbiAgLy8gaGF2ZSB0cmFjayB0aGVtIHNlcGFyYXRlbHkuXG4gIF9jb21wb3VuZF9zaGFwZXMgPSB7fTtcblxuICAvLyBvYmplY3QgcmVwb3J0aW5nXG5sZXQgUkVQT1JUX0NIVU5LU0laRSwgLy8gcmVwb3J0IGFycmF5IGlzIGluY3JlYXNlZCBpbiBpbmNyZW1lbnRzIG9mIHRoaXMgY2h1bmsgc2l6ZVxuICB3b3JsZHJlcG9ydCxcbiAgc29mdHJlcG9ydCxcbiAgY29sbGlzaW9ucmVwb3J0LFxuICB2ZWhpY2xlcmVwb3J0LFxuICBjb25zdHJhaW50cmVwb3J0O1xuXG5jb25zdCBXT1JMRFJFUE9SVF9JVEVNU0laRSA9IDE0LCAvLyBob3cgbWFueSBmbG9hdCB2YWx1ZXMgZWFjaCByZXBvcnRlZCBpdGVtIG5lZWRzXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSA9IDUsIC8vIG9uZSBmbG9hdCBmb3IgZWFjaCBvYmplY3QgaWQsIGFuZCBhIFZlYzMgY29udGFjdCBub3JtYWxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSA9IDksIC8vIHZlaGljbGUgaWQsIHdoZWVsIGluZGV4LCAzIGZvciBwb3NpdGlvbiwgNCBmb3Igcm90YXRpb25cbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSA9IDY7IC8vIGNvbnN0cmFpbnQgaWQsIG9mZnNldCBvYmplY3QsIG9mZnNldCwgYXBwbGllZCBpbXB1bHNlXG5cbmNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKDEpO1xuXG50cmFuc2ZlcmFibGVNZXNzYWdlKGFiLCBbYWJdKTtcbmNvbnN0IFNVUFBPUlRfVFJBTlNGRVJBQkxFID0gKGFiLmJ5dGVMZW5ndGggPT09IDApO1xuXG5jb25zdCBnZXRTaGFwZUZyb21DYWNoZSA9IChjYWNoZV9rZXkpID0+IHtcbiAgaWYgKF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV0gIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XTtcblxuICByZXR1cm4gbnVsbDtcbn07XG5cbmNvbnN0IHNldFNoYXBlQ2FjaGUgPSAoY2FjaGVfa2V5LCBzaGFwZSkgPT4ge1xuICBfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldID0gc2hhcGU7XG59O1xuXG5jb25zdCBjcmVhdGVTaGFwZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBsZXQgc2hhcGU7XG5cbiAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuICBzd2l0Y2ggKGRlc2NyaXB0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdjb21wb3VuZCc6IHtcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb21wb3VuZFNoYXBlKCk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdwbGFuZSc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBwbGFuZV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC54fV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC55fV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC56fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ubm9ybWFsLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ubm9ybWFsLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ubm9ybWFsLnopO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0U3RhdGljUGxhbmVTaGFwZShfdmVjM18xLCAwKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2JveCc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBib3hfJHtkZXNjcmlwdGlvbi53aWR0aH1fJHtkZXNjcmlwdGlvbi5oZWlnaHR9XyR7ZGVzY3JpcHRpb24uZGVwdGh9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi53aWR0aCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uaGVpZ2h0IC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5kZXB0aCAvIDIpO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Qm94U2hhcGUoX3ZlYzNfMSk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdzcGhlcmUnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgc3BoZXJlXyR7ZGVzY3JpcHRpb24ucmFkaXVzfWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0U3BoZXJlU2hhcGUoZGVzY3JpcHRpb24ucmFkaXVzKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2N5bGluZGVyJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGN5bGluZGVyXyR7ZGVzY3JpcHRpb24ud2lkdGh9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fV8ke2Rlc2NyaXB0aW9uLmRlcHRofWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ud2lkdGggLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmhlaWdodCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uZGVwdGggLyAyKTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEN5bGluZGVyU2hhcGUoX3ZlYzNfMSk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjYXBzdWxlJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGNhcHN1bGVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICAvLyBJbiBCdWxsZXQsIGNhcHN1bGUgaGVpZ2h0IGV4Y2x1ZGVzIHRoZSBlbmQgc3BoZXJlc1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q2Fwc3VsZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cywgZGVzY3JpcHRpb24uaGVpZ2h0IC0gMiAqIGRlc2NyaXB0aW9uLnJhZGl1cyk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjb25lJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGNvbmVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29uZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cywgZGVzY3JpcHRpb24uaGVpZ2h0KTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2NvbmNhdmUnOiB7XG4gICAgICBjb25zdCB0cmlhbmdsZV9tZXNoID0gbmV3IEFtbW8uYnRUcmlhbmdsZU1lc2goKTtcbiAgICAgIGlmICghZGVzY3JpcHRpb24uZGF0YS5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoIC8gOTsgaSsrKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkYXRhW2kgKiA5XSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkYXRhW2kgKiA5ICsgMV0pO1xuICAgICAgICBfdmVjM18xLnNldFooZGF0YVtpICogOSArIDJdKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGF0YVtpICogOSArIDNdKTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRhdGFbaSAqIDkgKyA0XSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkYXRhW2kgKiA5ICsgNV0pO1xuXG4gICAgICAgIF92ZWMzXzMuc2V0WChkYXRhW2kgKiA5ICsgNl0pO1xuICAgICAgICBfdmVjM18zLnNldFkoZGF0YVtpICogOSArIDddKTtcbiAgICAgICAgX3ZlYzNfMy5zZXRaKGRhdGFbaSAqIDkgKyA4XSk7XG5cbiAgICAgICAgdHJpYW5nbGVfbWVzaC5hZGRUcmlhbmdsZShcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzIsXG4gICAgICAgICAgX3ZlYzNfMyxcbiAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0QnZoVHJpYW5nbGVNZXNoU2hhcGUoXG4gICAgICAgIHRyaWFuZ2xlX21lc2gsXG4gICAgICAgIHRydWUsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY29udmV4Jzoge1xuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbnZleEh1bGxTaGFwZSgpO1xuICAgICAgY29uc3QgZGF0YSA9IGRlc2NyaXB0aW9uLmRhdGE7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGggLyAzOyBpKyspIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRhdGFbaSAqIDMgXSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkYXRhW2kgKiAzICsgMV0pO1xuICAgICAgICBfdmVjM18xLnNldFooZGF0YVtpICogMyArIDJdKTtcblxuICAgICAgICBzaGFwZS5hZGRQb2ludChfdmVjM18xKTtcbiAgICAgIH1cblxuICAgICAgX25vbmNhY2hlZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdoZWlnaHRmaWVsZCc6IHtcbiAgICAgIGNvbnN0IHhwdHMgPSBkZXNjcmlwdGlvbi54cHRzLFxuICAgICAgICB5cHRzID0gZGVzY3JpcHRpb24ueXB0cyxcbiAgICAgICAgcG9pbnRzID0gZGVzY3JpcHRpb24ucG9pbnRzLFxuICAgICAgICBwdHIgPSBBbW1vLl9tYWxsb2MoNCAqIHhwdHMgKiB5cHRzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDAsIHAgPSAwLCBwMiA9IDA7IGkgPCB4cHRzOyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB5cHRzOyBqKyspIHtcbiAgICAgICAgICBBbW1vLkhFQVBGMzJbcHRyICsgcDIgPj4gMl0gPSBwb2ludHNbcF07XG5cbiAgICAgICAgICBwKys7XG4gICAgICAgICAgcDIgKz0gNDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0SGVpZ2h0ZmllbGRUZXJyYWluU2hhcGUoXG4gICAgICAgIGRlc2NyaXB0aW9uLnhwdHMsXG4gICAgICAgIGRlc2NyaXB0aW9uLnlwdHMsXG4gICAgICAgIHB0cixcbiAgICAgICAgMSxcbiAgICAgICAgLWRlc2NyaXB0aW9uLmFic01heEhlaWdodCxcbiAgICAgICAgZGVzY3JpcHRpb24uYWJzTWF4SGVpZ2h0LFxuICAgICAgICAxLFxuICAgICAgICAnUEhZX0ZMT0FUJyxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBOb3QgcmVjb2duaXplZFxuICAgICAgcmV0dXJuO1xuICB9XG5cbiAgcmV0dXJuIHNoYXBlO1xufTtcblxuY29uc3QgY3JlYXRlU29mdEJvZHkgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IGJvZHk7XG5cbiAgY29uc3Qgc29mdEJvZHlIZWxwZXJzID0gbmV3IEFtbW8uYnRTb2Z0Qm9keUhlbHBlcnMoKTtcblxuICBzd2l0Y2ggKGRlc2NyaXB0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdzb2Z0VHJpbWVzaCc6IHtcbiAgICAgIGlmICghZGVzY3JpcHRpb24uYVZlcnRpY2VzLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBib2R5ID0gc29mdEJvZHlIZWxwZXJzLkNyZWF0ZUZyb21UcmlNZXNoKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgZGVzY3JpcHRpb24uYVZlcnRpY2VzLFxuICAgICAgICBkZXNjcmlwdGlvbi5hSW5kaWNlcyxcbiAgICAgICAgZGVzY3JpcHRpb24uYUluZGljZXMubGVuZ3RoIC8gMyxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdzb2Z0Q2xvdGhNZXNoJzoge1xuICAgICAgY29uc3QgY3IgPSBkZXNjcmlwdGlvbi5jb3JuZXJzO1xuXG4gICAgICBib2R5ID0gc29mdEJvZHlIZWxwZXJzLkNyZWF0ZVBhdGNoKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzBdLCBjclsxXSwgY3JbMl0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbM10sIGNyWzRdLCBjcls1XSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjcls2XSwgY3JbN10sIGNyWzhdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzldLCBjclsxMF0sIGNyWzExXSksXG4gICAgICAgIGRlc2NyaXB0aW9uLnNlZ21lbnRzWzBdLFxuICAgICAgICBkZXNjcmlwdGlvbi5zZWdtZW50c1sxXSxcbiAgICAgICAgMCxcbiAgICAgICAgdHJ1ZVxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ3NvZnRSb3BlTWVzaCc6IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBib2R5ID0gc29mdEJvZHlIZWxwZXJzLkNyZWF0ZVJvcGUoXG4gICAgICAgIHdvcmxkLmdldFdvcmxkSW5mbygpLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoZGF0YVswXSwgZGF0YVsxXSwgZGF0YVsyXSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhkYXRhWzNdLCBkYXRhWzRdLCBkYXRhWzVdKSxcbiAgICAgICAgZGF0YVs2XSAtIDEsXG4gICAgICAgIDBcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgLy8gTm90IHJlY29nbml6ZWRcbiAgICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBib2R5O1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5pbml0ID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIGlmIChwYXJhbXMud2FzbUJ1ZmZlcikge1xuICAgIGltcG9ydFNjcmlwdHMocGFyYW1zLmFtbW8pO1xuXG4gICAgc2VsZi5BbW1vID0gbG9hZEFtbW9Gcm9tQmluYXJ5KHBhcmFtcy53YXNtQnVmZmVyKTtcbiAgICB0cmFuc2ZlcmFibGVNZXNzYWdlKHtjbWQ6ICdhbW1vTG9hZGVkJ30pO1xuICAgIHB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkKHBhcmFtcyk7XG4gIH0gZWxzZSB7XG4gICAgaW1wb3J0U2NyaXB0cyhwYXJhbXMuYW1tbyk7XG4gICAgdHJhbnNmZXJhYmxlTWVzc2FnZSh7Y21kOiAnYW1tb0xvYWRlZCd9KTtcbiAgICBwdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZChwYXJhbXMpO1xuICB9XG59XG5cbnB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIF90cmFuc2Zvcm0gPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICBfdHJhbnNmb3JtX3BvcyA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gIF92ZWMzXzEgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzIgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzMgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF9xdWF0ID0gbmV3IEFtbW8uYnRRdWF0ZXJuaW9uKDAsIDAsIDAsIDApO1xuXG4gIFJFUE9SVF9DSFVOS1NJWkUgPSBwYXJhbXMucmVwb3J0c2l6ZSB8fCA1MDtcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICAvLyBUcmFuc2ZlcmFibGUgbWVzc2FnZXMgYXJlIHN1cHBvcnRlZCwgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlbSB3aXRoIFR5cGVkQXJyYXlzXG4gICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogV09STERSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBvYmplY3RzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbGxpc2lvbnMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiB2ZWhpY2xlcyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbnN0cmFpbnRzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gIH0gZWxzZSB7XG4gICAgLy8gVHJhbnNmZXJhYmxlIG1lc3NhZ2VzIGFyZSBub3Qgc3VwcG9ydGVkLCBzZW5kIGRhdGEgYXMgbm9ybWFsIGFycmF5c1xuICAgIHdvcmxkcmVwb3J0ID0gW107XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gW107XG4gICAgdmVoaWNsZXJlcG9ydCA9IFtdO1xuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBbXTtcbiAgfVxuXG4gIHdvcmxkcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDtcbiAgY29sbGlzaW9ucmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ7XG4gIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG5cbiAgY29uc3QgY29sbGlzaW9uQ29uZmlndXJhdGlvbiA9IHBhcmFtcy5zb2Z0Ym9keVxuICAgID8gbmV3IEFtbW8uYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24oKVxuICAgIDogbmV3IEFtbW8uYnREZWZhdWx0Q29sbGlzaW9uQ29uZmlndXJhdGlvbigpLFxuICAgIGRpc3BhdGNoZXIgPSBuZXcgQW1tby5idENvbGxpc2lvbkRpc3BhdGNoZXIoY29sbGlzaW9uQ29uZmlndXJhdGlvbiksXG4gICAgc29sdmVyID0gbmV3IEFtbW8uYnRTZXF1ZW50aWFsSW1wdWxzZUNvbnN0cmFpbnRTb2x2ZXIoKTtcblxuICBsZXQgYnJvYWRwaGFzZTtcblxuICBpZiAoIXBhcmFtcy5icm9hZHBoYXNlKSBwYXJhbXMuYnJvYWRwaGFzZSA9IHt0eXBlOiAnZHluYW1pYyd9O1xuICAvLyBUT0RPISEhXG4gIC8qIGlmIChwYXJhbXMuYnJvYWRwaGFzZS50eXBlID09PSAnc3dlZXBwcnVuZScpIHtcbiAgICBleHRlbmQocGFyYW1zLmJyb2FkcGhhc2UsIHtcbiAgICAgIGFhYmJtaW46IHtcbiAgICAgICAgeDogLTUwLFxuICAgICAgICB5OiAtNTAsXG4gICAgICAgIHo6IC01MFxuICAgICAgfSxcblxuICAgICAgYWFiYm1heDoge1xuICAgICAgICB4OiA1MCxcbiAgICAgICAgeTogNTAsXG4gICAgICAgIHo6IDUwXG4gICAgICB9LFxuICAgIH0pO1xuICB9Ki9cblxuICBzd2l0Y2ggKHBhcmFtcy5icm9hZHBoYXNlLnR5cGUpIHtcbiAgICBjYXNlICdzd2VlcHBydW5lJzpcbiAgICAgIF92ZWMzXzEuc2V0WChwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWluLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtaW4ueSk7XG4gICAgICBfdmVjM18xLnNldFoocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi56KTtcblxuICAgICAgX3ZlYzNfMi5zZXRYKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtYXgueCk7XG4gICAgICBfdmVjM18yLnNldFkocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1heC55KTtcbiAgICAgIF92ZWMzXzIuc2V0WihwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LnopO1xuXG4gICAgICBicm9hZHBoYXNlID0gbmV3IEFtbW8uYnRBeGlzU3dlZXAzKFxuICAgICAgICBfdmVjM18xLFxuICAgICAgICBfdmVjM18yXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICBjYXNlICdkeW5hbWljJzpcbiAgICBkZWZhdWx0OlxuICAgICAgYnJvYWRwaGFzZSA9IG5ldyBBbW1vLmJ0RGJ2dEJyb2FkcGhhc2UoKTtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgd29ybGQgPSBwYXJhbXMuc29mdGJvZHlcbiAgICA/IG5ldyBBbW1vLmJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24sIG5ldyBBbW1vLmJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyKCkpXG4gICAgOiBuZXcgQW1tby5idERpc2NyZXRlRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pO1xuICBmaXhlZFRpbWVTdGVwID0gcGFyYW1zLmZpeGVkVGltZVN0ZXA7XG5cbiAgaWYgKHBhcmFtcy5zb2Z0Ym9keSkgX3NvZnRib2R5X2VuYWJsZWQgPSB0cnVlO1xuXG4gIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoe2NtZDogJ3dvcmxkUmVhZHknfSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEZpeGVkVGltZVN0ZXAgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgZml4ZWRUaW1lU3RlcCA9IGRlc2NyaXB0aW9uO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRHcmF2aXR5ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi54KTtcbiAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnkpO1xuICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ueik7XG4gIHdvcmxkLnNldEdyYXZpdHkoX3ZlYzNfMSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGVuZEFuY2hvciA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBjb25zb2xlLmxvZyhfb2JqZWN0c1tkZXNjcmlwdGlvbi5vYmpdKTtcbiAgX29iamVjdHNbZGVzY3JpcHRpb24ub2JqXVxuICAgIC5hcHBlbmRBbmNob3IoXG4gICAgICBkZXNjcmlwdGlvbi5ub2RlLFxuICAgICAgX29iamVjdHNbZGVzY3JpcHRpb24ub2JqMl0sXG4gICAgICBkZXNjcmlwdGlvbi5jb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzLFxuICAgICAgZGVzY3JpcHRpb24uaW5mbHVlbmNlXG4gICAgKTtcbn1cblxucHVibGljX2Z1bmN0aW9ucy5hZGRPYmplY3QgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IGJvZHksIG1vdGlvblN0YXRlO1xuXG4gIGlmIChkZXNjcmlwdGlvbi50eXBlLmluZGV4T2YoJ3NvZnQnKSAhPT0gLTEpIHtcbiAgICBib2R5ID0gY3JlYXRlU29mdEJvZHkoZGVzY3JpcHRpb24pO1xuXG4gICAgY29uc3Qgc2JDb25maWcgPSBib2R5LmdldF9tX2NmZygpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLnZpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfdml0ZXJhdGlvbnMoZGVzY3JpcHRpb24udml0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5waXRlcmF0aW9ucykgc2JDb25maWcuc2V0X3BpdGVyYXRpb25zKGRlc2NyaXB0aW9uLnBpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uZGl0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9kaXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5kaXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmNpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfY2l0ZXJhdGlvbnMoZGVzY3JpcHRpb24uY2l0ZXJhdGlvbnMpO1xuICAgIHNiQ29uZmlnLnNldF9jb2xsaXNpb25zKDB4MTEpO1xuICAgIHNiQ29uZmlnLnNldF9rREYoZGVzY3JpcHRpb24uZnJpY3Rpb24pO1xuICAgIHNiQ29uZmlnLnNldF9rRFAoZGVzY3JpcHRpb24uZGFtcGluZyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnByZXNzdXJlKSBzYkNvbmZpZy5zZXRfa1BSKGRlc2NyaXB0aW9uLnByZXNzdXJlKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uZHJhZykgc2JDb25maWcuc2V0X2tERyhkZXNjcmlwdGlvbi5kcmFnKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ubGlmdCkgc2JDb25maWcuc2V0X2tMRihkZXNjcmlwdGlvbi5saWZ0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24uYW5jaG9ySGFyZG5lc3MpIHNiQ29uZmlnLnNldF9rQUhSKGRlc2NyaXB0aW9uLmFuY2hvckhhcmRuZXNzKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucmlnaWRIYXJkbmVzcykgc2JDb25maWcuc2V0X2tDSFIoZGVzY3JpcHRpb24ucmlnaWRIYXJkbmVzcyk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24ua2xzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rTFNUKGRlc2NyaXB0aW9uLmtsc3QpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5rYXN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tBU1QoZGVzY3JpcHRpb24ua2FzdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmt2c3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa1ZTVChkZXNjcmlwdGlvbi5rdnN0KTtcblxuICAgIEFtbW8uY2FzdE9iamVjdChib2R5LCBBbW1vLmJ0Q29sbGlzaW9uT2JqZWN0KS5nZXRDb2xsaXNpb25TaGFwZSgpLnNldE1hcmdpbihkZXNjcmlwdGlvbi5tYXJnaW4gPyBkZXNjcmlwdGlvbi5tYXJnaW4gOiAwLjEpO1xuXG4gICAgLy8gQW1tby5jYXN0T2JqZWN0KGJvZHksIEFtbW8uYnRDb2xsaXNpb25PYmplY3QpLmdldENvbGxpc2lvblNoYXBlKCkuc2V0TG9jYWxTY2FsaW5nKF92ZWMzXzEpO1xuICAgIGJvZHkuc2V0QWN0aXZhdGlvblN0YXRlKGRlc2NyaXB0aW9uLnN0YXRlIHx8IDQpO1xuICAgIGJvZHkudHlwZSA9IDA7IC8vIFNvZnRCb2R5LlxuICAgIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFJvcGVNZXNoJykgYm9keS5yb3BlID0gdHJ1ZTtcbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRDbG90aE1lc2gnKSBib2R5LmNsb3RoID0gdHJ1ZTtcblxuICAgIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5wb3NpdGlvbi54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ucG9zaXRpb24ueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnopO1xuICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgX3F1YXQuc2V0WChkZXNjcmlwdGlvbi5yb3RhdGlvbi54KTtcbiAgICBfcXVhdC5zZXRZKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnkpO1xuICAgIF9xdWF0LnNldFooZGVzY3JpcHRpb24ucm90YXRpb24ueik7XG4gICAgX3F1YXQuc2V0VyhkZXNjcmlwdGlvbi5yb3RhdGlvbi53KTtcbiAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgIGJvZHkudHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnNjYWxlLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5zY2FsZS55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uc2NhbGUueik7XG5cbiAgICBib2R5LnNjYWxlKF92ZWMzXzEpO1xuXG4gICAgYm9keS5zZXRUb3RhbE1hc3MoZGVzY3JpcHRpb24ubWFzcywgZmFsc2UpO1xuICAgIHdvcmxkLmFkZFNvZnRCb2R5KGJvZHksIDEsIC0xKTtcbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRUcmltZXNoJykgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fZmFjZXMoKS5zaXplKCkgKiAzO1xuICAgIGVsc2UgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Um9wZU1lc2gnKSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9ub2RlcygpLnNpemUoKTtcbiAgICBlbHNlIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX25vZGVzKCkuc2l6ZSgpICogMztcblxuICAgIF9udW1fc29mdGJvZHlfb2JqZWN0cysrO1xuICB9IGVsc2Uge1xuICAgIGxldCBzaGFwZSA9IGNyZWF0ZVNoYXBlKGRlc2NyaXB0aW9uKTtcblxuICAgIGlmICghc2hhcGUpIHJldHVybjtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBjaGlsZHJlbiB0aGVuIHRoaXMgaXMgYSBjb21wb3VuZCBzaGFwZVxuICAgIGlmIChkZXNjcmlwdGlvbi5jaGlsZHJlbikge1xuICAgICAgY29uc3QgY29tcG91bmRfc2hhcGUgPSBuZXcgQW1tby5idENvbXBvdW5kU2hhcGUoKTtcbiAgICAgIGNvbXBvdW5kX3NoYXBlLmFkZENoaWxkU2hhcGUoX3RyYW5zZm9ybSwgc2hhcGUpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IF9jaGlsZCA9IGRlc2NyaXB0aW9uLmNoaWxkcmVuW2ldO1xuXG4gICAgICAgIGNvbnN0IHRyYW5zID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnMuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgICBfdmVjM18xLnNldFgoX2NoaWxkLnBvc2l0aW9uX29mZnNldC54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihfY2hpbGQucG9zaXRpb25fb2Zmc2V0LnopO1xuICAgICAgICB0cmFucy5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgICAgX3F1YXQuc2V0WChfY2hpbGQucm90YXRpb24ueCk7XG4gICAgICAgIF9xdWF0LnNldFkoX2NoaWxkLnJvdGF0aW9uLnkpO1xuICAgICAgICBfcXVhdC5zZXRaKF9jaGlsZC5yb3RhdGlvbi56KTtcbiAgICAgICAgX3F1YXQuc2V0VyhfY2hpbGQucm90YXRpb24udyk7XG4gICAgICAgIHRyYW5zLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgICAgICBzaGFwZSA9IGNyZWF0ZVNoYXBlKGRlc2NyaXB0aW9uLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgY29tcG91bmRfc2hhcGUuYWRkQ2hpbGRTaGFwZSh0cmFucywgc2hhcGUpO1xuICAgICAgICBBbW1vLmRlc3Ryb3kodHJhbnMpO1xuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IGNvbXBvdW5kX3NoYXBlO1xuICAgICAgX2NvbXBvdW5kX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcbiAgICB9XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uc2NhbGUueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnNjYWxlLnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5zY2FsZS56KTtcblxuICAgIHNoYXBlLnNldExvY2FsU2NhbGluZyhfdmVjM18xKTtcbiAgICBzaGFwZS5zZXRNYXJnaW4oZGVzY3JpcHRpb24ubWFyZ2luID8gZGVzY3JpcHRpb24ubWFyZ2luIDogMCk7XG5cbiAgICBfdmVjM18xLnNldFgoMCk7XG4gICAgX3ZlYzNfMS5zZXRZKDApO1xuICAgIF92ZWMzXzEuc2V0WigwKTtcbiAgICBzaGFwZS5jYWxjdWxhdGVMb2NhbEluZXJ0aWEoZGVzY3JpcHRpb24ubWFzcywgX3ZlYzNfMSk7XG5cbiAgICBfdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG5cbiAgICBfdmVjM18yLnNldFgoZGVzY3JpcHRpb24ucG9zaXRpb24ueCk7XG4gICAgX3ZlYzNfMi5zZXRZKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnkpO1xuICAgIF92ZWMzXzIuc2V0WihkZXNjcmlwdGlvbi5wb3NpdGlvbi56KTtcbiAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgIF9xdWF0LnNldFgoZGVzY3JpcHRpb24ucm90YXRpb24ueCk7XG4gICAgX3F1YXQuc2V0WShkZXNjcmlwdGlvbi5yb3RhdGlvbi55KTtcbiAgICBfcXVhdC5zZXRaKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnopO1xuICAgIF9xdWF0LnNldFcoZGVzY3JpcHRpb24ucm90YXRpb24udyk7XG4gICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICBtb3Rpb25TdGF0ZSA9IG5ldyBBbW1vLmJ0RGVmYXVsdE1vdGlvblN0YXRlKF90cmFuc2Zvcm0pOyAvLyAjVE9ETzogYnREZWZhdWx0TW90aW9uU3RhdGUgc3VwcG9ydHMgY2VudGVyIG9mIG1hc3Mgb2Zmc2V0IGFzIHNlY29uZCBhcmd1bWVudCAtIGltcGxlbWVudFxuICAgIGNvbnN0IHJiSW5mbyA9IG5ldyBBbW1vLmJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyhkZXNjcmlwdGlvbi5tYXNzLCBtb3Rpb25TdGF0ZSwgc2hhcGUsIF92ZWMzXzEpO1xuXG4gICAgcmJJbmZvLnNldF9tX2ZyaWN0aW9uKGRlc2NyaXB0aW9uLmZyaWN0aW9uKTtcbiAgICByYkluZm8uc2V0X21fcmVzdGl0dXRpb24oZGVzY3JpcHRpb24ucmVzdGl0dXRpb24pO1xuICAgIHJiSW5mby5zZXRfbV9saW5lYXJEYW1waW5nKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuICAgIHJiSW5mby5zZXRfbV9hbmd1bGFyRGFtcGluZyhkZXNjcmlwdGlvbi5kYW1waW5nKTtcblxuICAgIGJvZHkgPSBuZXcgQW1tby5idFJpZ2lkQm9keShyYkluZm8pO1xuICAgIGJvZHkuc2V0QWN0aXZhdGlvblN0YXRlKGRlc2NyaXB0aW9uLnN0YXRlIHx8IDQpO1xuICAgIEFtbW8uZGVzdHJveShyYkluZm8pO1xuXG4gICAgaWYgKHR5cGVvZiBkZXNjcmlwdGlvbi5jb2xsaXNpb25fZmxhZ3MgIT09ICd1bmRlZmluZWQnKSBib2R5LnNldENvbGxpc2lvbkZsYWdzKGRlc2NyaXB0aW9uLmNvbGxpc2lvbl9mbGFncyk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24uZ3JvdXAgJiYgZGVzY3JpcHRpb24ubWFzaykgd29ybGQuYWRkUmlnaWRCb2R5KGJvZHksIGRlc2NyaXB0aW9uLmdyb3VwLCBkZXNjcmlwdGlvbi5tYXNrKTtcbiAgICBlbHNlIHdvcmxkLmFkZFJpZ2lkQm9keShib2R5KTtcbiAgICBib2R5LnR5cGUgPSAxOyAvLyBSaWdpZEJvZHkuXG4gICAgX251bV9yaWdpZGJvZHlfb2JqZWN0cysrO1xuICB9XG5cbiAgYm9keS5hY3RpdmF0ZSgpO1xuXG4gIGJvZHkuaWQgPSBkZXNjcmlwdGlvbi5pZDtcbiAgX29iamVjdHNbYm9keS5pZF0gPSBib2R5O1xuICBfbW90aW9uX3N0YXRlc1tib2R5LmlkXSA9IG1vdGlvblN0YXRlO1xuXG4gIF9vYmplY3RzX2FtbW9bYm9keS5hID09PSB1bmRlZmluZWQgPyBib2R5LnB0ciA6IGJvZHkuYV0gPSBib2R5LmlkO1xuICBfbnVtX29iamVjdHMrKztcblxuICB0cmFuc2ZlcmFibGVNZXNzYWdlKHtjbWQ6ICdvYmplY3RSZWFkeScsIHBhcmFtczogYm9keS5pZH0pO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRWZWhpY2xlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGNvbnN0IHZlaGljbGVfdHVuaW5nID0gbmV3IEFtbW8uYnRWZWhpY2xlVHVuaW5nKCk7XG5cbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyhkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX3N0aWZmbmVzcyk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbihkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX2NvbXByZXNzaW9uKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvbkRhbXBpbmcoZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9kYW1waW5nKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtKGRlc2NyaXB0aW9uLm1heF9zdXNwZW5zaW9uX3RyYXZlbCk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25Gb3JjZShkZXNjcmlwdGlvbi5tYXhfc3VzcGVuc2lvbl9mb3JjZSk7XG5cbiAgY29uc3QgdmVoaWNsZSA9IG5ldyBBbW1vLmJ0UmF5Y2FzdFZlaGljbGUoXG4gICAgdmVoaWNsZV90dW5pbmcsXG4gICAgX29iamVjdHNbZGVzY3JpcHRpb24ucmlnaWRCb2R5XSxcbiAgICBuZXcgQW1tby5idERlZmF1bHRWZWhpY2xlUmF5Y2FzdGVyKHdvcmxkKVxuICApO1xuXG4gIHZlaGljbGUudHVuaW5nID0gdmVoaWNsZV90dW5pbmc7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnJpZ2lkQm9keV0uc2V0QWN0aXZhdGlvblN0YXRlKDQpO1xuICB2ZWhpY2xlLnNldENvb3JkaW5hdGVTeXN0ZW0oMCwgMSwgMik7XG5cbiAgd29ybGQuYWRkVmVoaWNsZSh2ZWhpY2xlKTtcbiAgX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHZlaGljbGU7XG59O1xucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVWZWhpY2xlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gPSBudWxsO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRXaGVlbCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbGV0IHR1bmluZyA9IF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0udHVuaW5nO1xuICAgIGlmIChkZXNjcmlwdGlvbi50dW5pbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdHVuaW5nID0gbmV3IEFtbW8uYnRWZWhpY2xlVHVuaW5nKCk7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyhkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9zdGlmZm5lc3MpO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbihkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9jb21wcmVzc2lvbik7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvbkRhbXBpbmcoZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fZGFtcGluZyk7XG4gICAgICB0dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtKGRlc2NyaXB0aW9uLnR1bmluZy5tYXhfc3VzcGVuc2lvbl90cmF2ZWwpO1xuICAgICAgdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25Gb3JjZShkZXNjcmlwdGlvbi50dW5pbmcubWF4X3N1c3BlbnNpb25fZm9yY2UpO1xuICAgIH1cblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LnopO1xuXG4gICAgX3ZlYzNfMi5zZXRYKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi54KTtcbiAgICBfdmVjM18yLnNldFkoZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLnkpO1xuICAgIF92ZWMzXzIuc2V0WihkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueik7XG5cbiAgICBfdmVjM18zLnNldFgoZGVzY3JpcHRpb24ud2hlZWxfYXhsZS54KTtcbiAgICBfdmVjM18zLnNldFkoZGVzY3JpcHRpb24ud2hlZWxfYXhsZS55KTtcbiAgICBfdmVjM18zLnNldFooZGVzY3JpcHRpb24ud2hlZWxfYXhsZS56KTtcblxuICAgIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0uYWRkV2hlZWwoXG4gICAgICBfdmVjM18xLFxuICAgICAgX3ZlYzNfMixcbiAgICAgIF92ZWMzXzMsXG4gICAgICBkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLFxuICAgICAgZGVzY3JpcHRpb24ud2hlZWxfcmFkaXVzLFxuICAgICAgdHVuaW5nLFxuICAgICAgZGVzY3JpcHRpb24uaXNfZnJvbnRfd2hlZWxcbiAgICApO1xuICB9XG5cbiAgX251bV93aGVlbHMrKztcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgxICsgX251bV93aGVlbHMgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCAmICggIyBvZiBvYmplY3RzIHRvIHJlcG9ydCAqICMgb2YgdmFsdWVzIHBlciBvYmplY3QgKVxuICAgIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gIH0gZWxzZSB2ZWhpY2xlcmVwb3J0ID0gW01FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVF07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldFN0ZWVyaW5nID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uc2V0U3RlZXJpbmdWYWx1ZShkZXRhaWxzLnN0ZWVyaW5nLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QnJha2UgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5zZXRCcmFrZShkZXRhaWxzLmJyYWtlLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlFbmdpbmVGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLmFwcGx5RW5naW5lRm9yY2UoZGV0YWlscy5mb3JjZSwgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZU9iamVjdCA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfb2JqZWN0c1tkZXRhaWxzLmlkXS50eXBlID09PSAwKSB7XG4gICAgX251bV9zb2Z0Ym9keV9vYmplY3RzLS07XG4gICAgX3NvZnRib2R5X3JlcG9ydF9zaXplIC09IF9vYmplY3RzW2RldGFpbHMuaWRdLmdldF9tX25vZGVzKCkuc2l6ZSgpO1xuICAgIHdvcmxkLnJlbW92ZVNvZnRCb2R5KF9vYmplY3RzW2RldGFpbHMuaWRdKTtcbiAgfSBlbHNlIGlmIChfb2JqZWN0c1tkZXRhaWxzLmlkXS50eXBlID09PSAxKSB7XG4gICAgX251bV9yaWdpZGJvZHlfb2JqZWN0cy0tO1xuICAgIHdvcmxkLnJlbW92ZVJpZ2lkQm9keShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gICAgQW1tby5kZXN0cm95KF9tb3Rpb25fc3RhdGVzW2RldGFpbHMuaWRdKTtcbiAgfVxuXG4gIEFtbW8uZGVzdHJveShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gIGlmIChfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKSBBbW1vLmRlc3Ryb3koX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSk7XG4gIGlmIChfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSkgQW1tby5kZXN0cm95KF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKTtcblxuICBfb2JqZWN0c19hbW1vW19vYmplY3RzW2RldGFpbHMuaWRdLmEgPT09IHVuZGVmaW5lZCA/IF9vYmplY3RzW2RldGFpbHMuaWRdLmEgOiBfb2JqZWN0c1tkZXRhaWxzLmlkXS5wdHJdID0gbnVsbDtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBfbW90aW9uX3N0YXRlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG5cbiAgaWYgKF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pIF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBpZiAoX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pIF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgX251bV9vYmplY3RzLS07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnVwZGF0ZVRyYW5zZm9ybSA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3QgPSBfb2JqZWN0c1tkZXRhaWxzLmlkXTtcblxuICBpZiAoX29iamVjdC50eXBlID09PSAxKSB7XG4gICAgX29iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgaWYgKGRldGFpbHMucG9zKSB7XG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3MueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3MueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3Mueik7XG4gICAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICB9XG5cbiAgICBpZiAoZGV0YWlscy5xdWF0KSB7XG4gICAgICBfcXVhdC5zZXRYKGRldGFpbHMucXVhdC54KTtcbiAgICAgIF9xdWF0LnNldFkoZGV0YWlscy5xdWF0LnkpO1xuICAgICAgX3F1YXQuc2V0WihkZXRhaWxzLnF1YXQueik7XG4gICAgICBfcXVhdC5zZXRXKGRldGFpbHMucXVhdC53KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuICAgIH1cblxuICAgIF9vYmplY3Quc2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG4gICAgX29iamVjdC5hY3RpdmF0ZSgpO1xuICB9IGVsc2UgaWYgKF9vYmplY3QudHlwZSA9PT0gMCkge1xuICAgIC8vIF9vYmplY3QuZ2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICBpZiAoZGV0YWlscy5wb3MpIHtcbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvcy54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvcy55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvcy56KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzEpO1xuICAgIH1cblxuICAgIGlmIChkZXRhaWxzLnF1YXQpIHtcbiAgICAgIF9xdWF0LnNldFgoZGV0YWlscy5xdWF0LngpO1xuICAgICAgX3F1YXQuc2V0WShkZXRhaWxzLnF1YXQueSk7XG4gICAgICBfcXVhdC5zZXRaKGRldGFpbHMucXVhdC56KTtcbiAgICAgIF9xdWF0LnNldFcoZGV0YWlscy5xdWF0LncpO1xuICAgICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG4gICAgfVxuXG4gICAgX29iamVjdC50cmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG4gIH1cbn07XG5cbnB1YmxpY19mdW5jdGlvbnMudXBkYXRlTWFzcyA9IChkZXRhaWxzKSA9PiB7XG4gIC8vICNUT0RPOiBjaGFuZ2luZyBhIHN0YXRpYyBvYmplY3QgaW50byBkeW5hbWljIGlzIGJ1Z2d5XG4gIF9vYmplY3QgPSBfb2JqZWN0c1tkZXRhaWxzLmlkXTtcblxuICAvLyBQZXIgaHR0cDovL3d3dy5idWxsZXRwaHlzaWNzLm9yZy9CdWxsZXQvcGhwQkIzL3ZpZXd0b3BpYy5waHA/cD0mZj05JnQ9MzY2MyNwMTM4MTZcbiAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KF9vYmplY3QpO1xuXG4gIF92ZWMzXzEuc2V0WCgwKTtcbiAgX3ZlYzNfMS5zZXRZKDApO1xuICBfdmVjM18xLnNldFooMCk7XG5cbiAgX29iamVjdC5zZXRNYXNzUHJvcHMoZGV0YWlscy5tYXNzLCBfdmVjM18xKTtcbiAgd29ybGQuYWRkUmlnaWRCb2R5KF9vYmplY3QpO1xuICBfb2JqZWN0LmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Q2VudHJhbEltcHVsc2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5Q2VudHJhbEltcHVsc2UoX3ZlYzNfMSk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5SW1wdWxzZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLmltcHVsc2VfeCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLmltcHVsc2VfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLmltcHVsc2Vfeik7XG5cbiAgX3ZlYzNfMi5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzIuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18yLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUltcHVsc2UoXG4gICAgX3ZlYzNfMSxcbiAgICBfdmVjM18yXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5VG9ycXVlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMudG9ycXVlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy50b3JxdWVfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnRvcnF1ZV96KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseVRvcnF1ZShcbiAgICBfdmVjM18xXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Q2VudHJhbEZvcmNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUNlbnRyYWxGb3JjZShfdmVjM18xKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLmZvcmNlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy5mb3JjZV95KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMuZm9yY2Vfeik7XG5cbiAgX3ZlYzNfMi5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzIuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18yLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUZvcmNlKFxuICAgIF92ZWMzXzEsXG4gICAgX3ZlYzNfMlxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5vblNpbXVsYXRpb25SZXN1bWUgPSAoKSA9PiB7XG4gIGxhc3Rfc2ltdWxhdGlvbl90aW1lID0gRGF0ZS5ub3coKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QW5ndWxhclZlbG9jaXR5ID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRBbmd1bGFyVmVsb2NpdHkoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRMaW5lYXJWZWxvY2l0eSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0TGluZWFyVmVsb2NpdHkoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRBbmd1bGFyRmFjdG9yID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRBbmd1bGFyRmFjdG9yKFxuICAgICAgX3ZlYzNfMVxuICApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRMaW5lYXJGYWN0b3IgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldExpbmVhckZhY3RvcihcbiAgICBfdmVjM18xXG4gICk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldERhbXBpbmcgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXREYW1waW5nKGRldGFpbHMubGluZWFyLCBkZXRhaWxzLmFuZ3VsYXIpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRDY2RNb3Rpb25UaHJlc2hvbGQgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRDY2RNb3Rpb25UaHJlc2hvbGQoZGV0YWlscy50aHJlc2hvbGQpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKGRldGFpbHMucmFkaXVzKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkQ29uc3RyYWludCA9IChkZXRhaWxzKSA9PiB7XG4gIGxldCBjb25zdHJhaW50O1xuXG4gIHN3aXRjaCAoZGV0YWlscy50eXBlKSB7XG5cbiAgICBjYXNlICdwb2ludCc6IHtcbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFBvaW50MlBvaW50Q29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF92ZWMzXzFcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRQb2ludDJQb2ludENvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2hpbmdlJzoge1xuICAgICAgaWYgKGRldGFpbHMub2JqZWN0YiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMuYXhpcy54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMuYXhpcy55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMuYXhpcy56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRIaW5nZUNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzJcbiAgICAgICAgKTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIF92ZWMzXzMuc2V0WChkZXRhaWxzLmF4aXMueCk7XG4gICAgICAgIF92ZWMzXzMuc2V0WShkZXRhaWxzLmF4aXMueSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WihkZXRhaWxzLmF4aXMueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0SGluZ2VDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzIsXG4gICAgICAgICAgX3ZlYzNfMyxcbiAgICAgICAgICBfdmVjM18zXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc2xpZGVyJzoge1xuICAgICAgbGV0IHRyYW5zZm9ybWI7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXIoZGV0YWlscy5heGlzLngsIGRldGFpbHMuYXhpcy55LCBkZXRhaWxzLmF4aXMueik7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgaWYgKGRldGFpbHMub2JqZWN0Yikge1xuICAgICAgICB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgICByb3RhdGlvbi5zZXRFdWxlcihkZXRhaWxzLmF4aXMueCwgZGV0YWlscy5heGlzLnksIGRldGFpbHMuYXhpcy56KTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0U2xpZGVyQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cmFuc2Zvcm1iLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFNsaWRlckNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3RyYWludC50YSA9IHRyYW5zZm9ybWE7XG4gICAgICBjb25zdHJhaW50LnRiID0gdHJhbnNmb3JtYjtcblxuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWEpO1xuICAgICAgaWYgKHRyYW5zZm9ybWIgIT09IHVuZGVmaW5lZCkgQW1tby5kZXN0cm95KHRyYW5zZm9ybWIpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY29uZXR3aXN0Jzoge1xuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldElkZW50aXR5KCk7XG5cbiAgICAgIGNvbnN0IHRyYW5zZm9ybWIgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2EueiwgLWRldGFpbHMuYXhpc2EueSwgLWRldGFpbHMuYXhpc2EueCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1iLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYi56LCAtZGV0YWlscy5heGlzYi55LCAtZGV0YWlscy5heGlzYi54KTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRDb25lVHdpc3RDb25zdHJhaW50KFxuICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICB0cmFuc2Zvcm1iXG4gICAgICApO1xuXG4gICAgICBjb25zdHJhaW50LnNldExpbWl0KE1hdGguUEksIDAsIE1hdGguUEkpO1xuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdkb2YnOiB7XG4gICAgICBsZXQgdHJhbnNmb3JtYjtcblxuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldElkZW50aXR5KCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNhLnosIC1kZXRhaWxzLmF4aXNhLnksIC1kZXRhaWxzLmF4aXNhLngpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIpIHtcbiAgICAgICAgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYi56LCAtZGV0YWlscy5heGlzYi55LCAtZGV0YWlscy5heGlzYi54KTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRyYW5zZm9ybWIsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIGlmICh0cmFuc2Zvcm1iICE9PSB1bmRlZmluZWQpIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm47XG4gIH1cblxuICB3b3JsZC5hZGRDb25zdHJhaW50KGNvbnN0cmFpbnQpO1xuXG4gIGNvbnN0cmFpbnQuYSA9IF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV07XG4gIGNvbnN0cmFpbnQuYiA9IF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl07XG5cbiAgY29uc3RyYWludC5lbmFibGVGZWVkYmFjaygpO1xuICBfY29uc3RyYWludHNbZGV0YWlscy5pZF0gPSBjb25zdHJhaW50O1xuICBfbnVtX2NvbnN0cmFpbnRzKys7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMSArIF9udW1fY29uc3RyYWludHMgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCAmICggIyBvZiBvYmplY3RzIHRvIHJlcG9ydCAqICMgb2YgdmFsdWVzIHBlciBvYmplY3QgKVxuICAgIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG4gIH0gZWxzZSBjb25zdHJhaW50cmVwb3J0ID0gW01FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVF07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZUNvbnN0cmFpbnQgPSAoZGV0YWlscykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdO1xuXG4gIGlmIChjb25zdHJhaW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICB3b3JsZC5yZW1vdmVDb25zdHJhaW50KGNvbnN0cmFpbnQpO1xuICAgIF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gICAgX251bV9jb25zdHJhaW50cy0tO1xuICB9XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbnN0cmFpbnRfc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkID0gKGRldGFpbHMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXTtcbiAgaWYgKGNvbnN0cmFpbnQgIT09IHVuZGVmaW5kKSBjb25zdHJhaW50LnNldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZChkZXRhaWxzLnRocmVzaG9sZCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNpbXVsYXRlID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIGlmICh3b3JsZCkge1xuICAgIGlmIChwYXJhbXMudGltZVN0ZXAgJiYgcGFyYW1zLnRpbWVTdGVwIDwgZml4ZWRUaW1lU3RlcClcbiAgICAgIHBhcmFtcy50aW1lU3RlcCA9IGZpeGVkVGltZVN0ZXA7XG5cbiAgICBwYXJhbXMubWF4U3ViU3RlcHMgPSBwYXJhbXMubWF4U3ViU3RlcHMgfHwgTWF0aC5jZWlsKHBhcmFtcy50aW1lU3RlcCAvIGZpeGVkVGltZVN0ZXApOyAvLyBJZiBtYXhTdWJTdGVwcyBpcyBub3QgZGVmaW5lZCwga2VlcCB0aGUgc2ltdWxhdGlvbiBmdWxseSB1cCB0byBkYXRlXG5cbiAgICB3b3JsZC5zdGVwU2ltdWxhdGlvbihwYXJhbXMudGltZVN0ZXAsIHBhcmFtcy5tYXhTdWJTdGVwcywgZml4ZWRUaW1lU3RlcCk7XG5cbiAgICBpZiAoX3ZlaGljbGVzLmxlbmd0aCA+IDApIHJlcG9ydFZlaGljbGVzKCk7XG4gICAgcmVwb3J0Q29sbGlzaW9ucygpO1xuICAgIGlmIChfY29uc3RyYWludHMubGVuZ3RoID4gMCkgcmVwb3J0Q29uc3RyYWludHMoKTtcbiAgICByZXBvcnRXb3JsZCgpO1xuICAgIGlmIChfc29mdGJvZHlfZW5hYmxlZCkgcmVwb3J0V29ybGRfc29mdGJvZGllcygpO1xuICB9XG59O1xuXG4vLyBDb25zdHJhaW50IGZ1bmN0aW9uc1xucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9zZXRMaW1pdHMgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLmxvdywgcGFyYW1zLmhpZ2gsIDAsIHBhcmFtcy5iaWFzX2ZhY3RvciwgcGFyYW1zLnJlbGF4YXRpb25fZmFjdG9yKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVBbmd1bGFyTW90b3IodHJ1ZSwgcGFyYW1zLnZlbG9jaXR5LCBwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9kaXNhYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uZW5hYmxlTW90b3IoZmFsc2UpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX3NldExpbWl0cyA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0TG93ZXJMaW5MaW1pdChwYXJhbXMubGluX2xvd2VyIHx8IDApO1xuICBjb25zdHJhaW50LnNldFVwcGVyTGluTGltaXQocGFyYW1zLmxpbl91cHBlciB8fCAwKTtcblxuICBjb25zdHJhaW50LnNldExvd2VyQW5nTGltaXQocGFyYW1zLmFuZ19sb3dlciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRVcHBlckFuZ0xpbWl0KHBhcmFtcy5hbmdfdXBwZXIgfHwgMCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9zZXRSZXN0aXR1dGlvbiA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0U29mdG5lc3NMaW1MaW4ocGFyYW1zLmxpbmVhciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRTb2Z0bmVzc0xpbUFuZyhwYXJhbXMuYW5ndWxhciB8fCAwKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRUYXJnZXRMaW5Nb3RvclZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIGNvbnN0cmFpbnQuc2V0TWF4TGluTW90b3JGb3JjZShwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkTGluTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZExpbk1vdG9yKGZhbHNlKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFRhcmdldEFuZ01vdG9yVmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgY29uc3RyYWludC5zZXRNYXhBbmdNb3RvckZvcmNlKHBhcmFtcy5hY2NlbGVyYXRpb24pO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRBbmdNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZEFuZ01vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLnosIHBhcmFtcy55LCBwYXJhbXMueCk7IC8vIFpZWCBvcmRlclxufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZW5hYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LmVuYWJsZU1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldE1heE1vdG9ySW1wdWxzZShwYXJhbXMubWF4X2ltcHVsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNb3RvclRhcmdldCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3F1YXQuc2V0WChwYXJhbXMueCk7XG4gIF9xdWF0LnNldFkocGFyYW1zLnkpO1xuICBfcXVhdC5zZXRaKHBhcmFtcy56KTtcbiAgX3F1YXQuc2V0VyhwYXJhbXMudyk7XG5cbiAgY29uc3RyYWludC5zZXRNb3RvclRhcmdldChfcXVhdCk7XG5cbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZGlzYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhckxvd2VyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJMb3dlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJVcHBlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0QW5ndWxhckxvd2VyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRBbmd1bGFyVXBwZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIGNvbnN0IG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuICBtb3Rvci5zZXRfbV9lbmFibGVNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9jb25maWd1cmVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2xvTGltaXQocGFyYW1zLmxvd19hbmdsZSk7XG4gIG1vdG9yLnNldF9tX2hpTGltaXQocGFyYW1zLmhpZ2hfYW5nbGUpO1xuICBtb3Rvci5zZXRfbV90YXJnZXRWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBtb3Rvci5zZXRfbV9tYXhNb3RvckZvcmNlKHBhcmFtcy5tYXhfZm9yY2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX2Rpc2FibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2VuYWJsZU1vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5jb25zdCByZXBvcnRXb3JsZCA9ICgpID0+IHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIHdvcmxkcmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX3JpZ2lkYm9keV9vYmplY3RzICogV09STERSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAyLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICsgKE1hdGguY2VpbChfbnVtX3JpZ2lkYm9keV9vYmplY3RzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICk7XG5cbiAgICB3b3JsZHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ7XG4gIH1cblxuICB3b3JsZHJlcG9ydFsxXSA9IF9udW1fcmlnaWRib2R5X29iamVjdHM7IC8vIHJlY29yZCBob3cgbWFueSBvYmplY3RzIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIHtcbiAgICBsZXQgaSA9IDAsXG4gICAgICBpbmRleCA9IF9vYmplY3RzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvYmplY3QgPSBfb2JqZWN0c1tpbmRleF07XG5cbiAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LnR5cGUgPT09IDEpIHsgLy8gUmlnaWRCb2RpZXMuXG4gICAgICAgIC8vICNUT0RPOiB3ZSBjYW4ndCB1c2UgY2VudGVyIG9mIG1hc3MgdHJhbnNmb3JtIHdoZW4gY2VudGVyIG9mIG1hc3MgY2FuIGNoYW5nZSxcbiAgICAgICAgLy8gICAgICAgIGJ1dCBnZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKCkgc2NyZXdzIHVwIG9uIG9iamVjdHMgdGhhdCBoYXZlIGJlZW4gbW92ZWRcbiAgICAgICAgLy8gb2JqZWN0LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oIHRyYW5zZm9ybSApO1xuICAgICAgICAvLyBvYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBvYmplY3QuZ2V0Q2VudGVyT2ZNYXNzVHJhbnNmb3JtKCk7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSB0cmFuc2Zvcm0uZ2V0Um90YXRpb24oKTtcblxuICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICBjb25zdCBvZmZzZXQgPSAyICsgKGkrKykgKiBXT1JMRFJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXRdID0gb2JqZWN0LmlkO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDFdID0gb3JpZ2luLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi56KCk7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNF0gPSByb3RhdGlvbi54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDVdID0gcm90YXRpb24ueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA2XSA9IHJvdGF0aW9uLnooKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgN10gPSByb3RhdGlvbi53KCk7XG5cbiAgICAgICAgX3ZlY3RvciA9IG9iamVjdC5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA4XSA9IF92ZWN0b3IueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA5XSA9IF92ZWN0b3IueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMF0gPSBfdmVjdG9yLnooKTtcblxuICAgICAgICBfdmVjdG9yID0gb2JqZWN0LmdldEFuZ3VsYXJWZWxvY2l0eSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMV0gPSBfdmVjdG9yLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTJdID0gX3ZlY3Rvci55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEzXSA9IF92ZWN0b3IueigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgdHJhbnNmZXJhYmxlTWVzc2FnZSh3b3JsZHJlcG9ydC5idWZmZXIsIFt3b3JsZHJlcG9ydC5idWZmZXJdKTtcbiAgZWxzZSB0cmFuc2ZlcmFibGVNZXNzYWdlKHdvcmxkcmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydFdvcmxkX3NvZnRib2RpZXMgPSAoKSA9PiB7XG4gIC8vIFRPRE86IEFkZCBTVVBQT1JUVFJBTlNGRVJBQkxFLlxuXG4gIHNvZnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICArIF9udW1fc29mdGJvZHlfb2JqZWN0cyAqIDJcbiAgICArIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSAqIDZcbiAgKTtcblxuICBzb2Z0cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUO1xuICBzb2Z0cmVwb3J0WzFdID0gX251bV9zb2Z0Ym9keV9vYmplY3RzOyAvLyByZWNvcmQgaG93IG1hbnkgb2JqZWN0cyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICB7XG4gICAgbGV0IG9mZnNldCA9IDIsXG4gICAgICBpbmRleCA9IF9vYmplY3RzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvYmplY3QgPSBfb2JqZWN0c1tpbmRleF07XG5cbiAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LnR5cGUgPT09IDApIHsgLy8gU29mdEJvZGllcy5cblxuICAgICAgICBzb2Z0cmVwb3J0W29mZnNldF0gPSBvYmplY3QuaWQ7XG5cbiAgICAgICAgY29uc3Qgb2Zmc2V0VmVydCA9IG9mZnNldCArIDI7XG5cbiAgICAgICAgaWYgKG9iamVjdC5yb3BlID09PSB0cnVlKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZXMgPSBvYmplY3QuZ2V0X21fbm9kZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gbm9kZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5hdChpKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQgPSBub2RlLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IG9mZiA9IG9mZnNldFZlcnQgKyBpICogMztcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydC54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydC55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDJdID0gdmVydC56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiAzICsgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmplY3QuY2xvdGgpIHtcbiAgICAgICAgICBjb25zdCBub2RlcyA9IG9iamVjdC5nZXRfbV9ub2RlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBub2Rlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzLmF0KGkpO1xuICAgICAgICAgICAgY29uc3QgdmVydCA9IG5vZGUuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gbm9kZS5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDY7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDNdID0gbm9ybWFsLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNF0gPSBub3JtYWwueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA1XSA9IG5vcm1hbC56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiA2ICsgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb25zdCBmYWNlcyA9IG9iamVjdC5nZXRfbV9mYWNlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBmYWNlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZmFjZSA9IGZhY2VzLmF0KGkpO1xuXG4gICAgICAgICAgICBjb25zdCBub2RlMSA9IGZhY2UuZ2V0X21fbigwKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUyID0gZmFjZS5nZXRfbV9uKDEpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZTMgPSBmYWNlLmdldF9tX24oMik7XG5cbiAgICAgICAgICAgIGNvbnN0IHZlcnQxID0gbm9kZTEuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3QgdmVydDIgPSBub2RlMi5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0MyA9IG5vZGUzLmdldF9tX3goKTtcblxuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMSA9IG5vZGUxLmdldF9tX24oKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDIgPSBub2RlMi5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwzID0gbm9kZTMuZ2V0X21fbigpO1xuXG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDE4O1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0MS54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydDEueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQxLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAzXSA9IG5vcm1hbDEueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA0XSA9IG5vcm1hbDEueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA1XSA9IG5vcm1hbDEueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDZdID0gdmVydDIueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA3XSA9IHZlcnQyLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgOF0gPSB2ZXJ0Mi56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgOV0gPSBub3JtYWwyLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTBdID0gbm9ybWFsMi55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDExXSA9IG5vcm1hbDIueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEyXSA9IHZlcnQzLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTNdID0gdmVydDMueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNF0gPSB2ZXJ0My56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTVdID0gbm9ybWFsMy54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE2XSA9IG5vcm1hbDMueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxN10gPSBub3JtYWwzLnooKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvZmZzZXQgKz0gc2l6ZSAqIDE4ICsgMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgdHJhbnNmZXJhYmxlTWVzc2FnZShzb2Z0cmVwb3J0LmJ1ZmZlciwgW3NvZnRyZXBvcnQuYnVmZmVyXSk7XG4gIC8vIGVsc2UgdHJhbnNmZXJhYmxlTWVzc2FnZShzb2Z0cmVwb3J0KTtcbiAgdHJhbnNmZXJhYmxlTWVzc2FnZShzb2Z0cmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydENvbGxpc2lvbnMgPSAoKSA9PiB7XG4gIGNvbnN0IGRwID0gd29ybGQuZ2V0RGlzcGF0Y2hlcigpLFxuICAgIG51bSA9IGRwLmdldE51bU1hbmlmb2xkcygpO1xuICAgIC8vIF9jb2xsaWRlZCA9IGZhbHNlO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmIChjb2xsaXNpb25yZXBvcnQubGVuZ3RoIDwgMiArIG51bSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArIChNYXRoLmNlaWwoX251bV9vYmplY3RzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDtcbiAgICB9XG4gIH1cblxuICBjb2xsaXNpb25yZXBvcnRbMV0gPSAwOyAvLyBob3cgbWFueSBjb2xsaXNpb25zIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICBjb25zdCBtYW5pZm9sZCA9IGRwLmdldE1hbmlmb2xkQnlJbmRleEludGVybmFsKGkpLFxuICAgICAgbnVtX2NvbnRhY3RzID0gbWFuaWZvbGQuZ2V0TnVtQ29udGFjdHMoKTtcblxuICAgIGlmIChudW1fY29udGFjdHMgPT09IDApIGNvbnRpbnVlO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBudW1fY29udGFjdHM7IGorKykge1xuICAgICAgY29uc3QgcHQgPSBtYW5pZm9sZC5nZXRDb250YWN0UG9pbnQoaik7XG5cbiAgICAgIC8vIGlmICggcHQuZ2V0RGlzdGFuY2UoKSA8IDAgKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgKGNvbGxpc2lvbnJlcG9ydFsxXSsrKSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXRdID0gX29iamVjdHNfYW1tb1ttYW5pZm9sZC5nZXRCb2R5MCgpLnB0cl07XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgMV0gPSBfb2JqZWN0c19hbW1vW21hbmlmb2xkLmdldEJvZHkxKCkucHRyXTtcblxuICAgICAgX3ZlY3RvciA9IHB0LmdldF9tX25vcm1hbFdvcmxkT25CKCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgMl0gPSBfdmVjdG9yLngoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAzXSA9IF92ZWN0b3IueSgpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDRdID0gX3ZlY3Rvci56KCk7XG4gICAgICBicmVhaztcbiAgICAgIC8vIH1cbiAgICAgIC8vIHRyYW5zZmVyYWJsZU1lc3NhZ2UoX29iamVjdHNfYW1tbyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB0cmFuc2ZlcmFibGVNZXNzYWdlKGNvbGxpc2lvbnJlcG9ydC5idWZmZXIsIFtjb2xsaXNpb25yZXBvcnQuYnVmZmVyXSk7XG4gIGVsc2UgdHJhbnNmZXJhYmxlTWVzc2FnZShjb2xsaXNpb25yZXBvcnQpO1xufTtcblxuY29uc3QgcmVwb3J0VmVoaWNsZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmICh2ZWhpY2xlcmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX3doZWVscyAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICsgKE1hdGguY2VpbChfbnVtX3doZWVscyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAge1xuICAgIGxldCBpID0gMCxcbiAgICAgIGogPSAwLFxuICAgICAgaW5kZXggPSBfdmVoaWNsZXMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGlmIChfdmVoaWNsZXNbaW5kZXhdKSB7XG4gICAgICAgIGNvbnN0IHZlaGljbGUgPSBfdmVoaWNsZXNbaW5kZXhdO1xuXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCB2ZWhpY2xlLmdldE51bVdoZWVscygpOyBqKyspIHtcbiAgICAgICAgICAvLyB2ZWhpY2xlLnVwZGF0ZVdoZWVsVHJhbnNmb3JtKCBqLCB0cnVlICk7XG4gICAgICAgICAgLy8gdHJhbnNmb3JtID0gdmVoaWNsZS5nZXRXaGVlbFRyYW5zZm9ybVdTKCBqICk7XG4gICAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdmVoaWNsZS5nZXRXaGVlbEluZm8oaikuZ2V0X21fd29ybGRUcmFuc2Zvcm0oKTtcblxuICAgICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcbiAgICAgICAgICBjb25zdCByb3RhdGlvbiA9IHRyYW5zZm9ybS5nZXRSb3RhdGlvbigpO1xuXG4gICAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSAxICsgKGkrKykgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXRdID0gaW5kZXg7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAxXSA9IGo7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLngoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnkoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDRdID0gb3JpZ2luLnooKTtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNV0gPSByb3RhdGlvbi54KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA2XSA9IHJvdGF0aW9uLnkoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDddID0gcm90YXRpb24ueigpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgOF0gPSByb3RhdGlvbi53KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUgJiYgaiAhPT0gMCkgdHJhbnNmZXJhYmxlTWVzc2FnZSh2ZWhpY2xlcmVwb3J0LmJ1ZmZlciwgW3ZlaGljbGVyZXBvcnQuYnVmZmVyXSk7XG4gICAgZWxzZSBpZiAoaiAhPT0gMCkgdHJhbnNmZXJhYmxlTWVzc2FnZSh2ZWhpY2xlcmVwb3J0KTtcbiAgfVxufTtcblxuY29uc3QgcmVwb3J0Q29uc3RyYWludHMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmIChjb25zdHJhaW50cmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX2NvbnN0cmFpbnRzICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgKyAoTWF0aC5jZWlsKF9udW1fY29uc3RyYWludHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIHtcbiAgICBsZXQgb2Zmc2V0ID0gMCxcbiAgICAgIGkgPSAwLFxuICAgICAgaW5kZXggPSBfY29uc3RyYWludHMubGVuZ2h0O1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGlmIChfY29uc3RyYWludHNbaW5kZXhdKSB7XG4gICAgICAgIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbaW5kZXhdO1xuICAgICAgICBjb25zdCBvZmZzZXRfYm9keSA9IGNvbnN0cmFpbnQuYTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gY29uc3RyYWludC50YTtcbiAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuXG4gICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgIG9mZnNldCA9IDEgKyAoaSsrKSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXRdID0gaW5kZXg7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBvZmZzZXRfYm9keS5pZDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi54O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnk7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgNF0gPSBvcmlnaW4uejtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyA1XSA9IGNvbnN0cmFpbnQuZ2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIGkgIT09IDApIHRyYW5zZmVyYWJsZU1lc3NhZ2UoY29uc3RyYWludHJlcG9ydC5idWZmZXIsIFtjb25zdHJhaW50cmVwb3J0LmJ1ZmZlcl0pO1xuICAgIGVsc2UgaWYgKGkgIT09IDApIHRyYW5zZmVyYWJsZU1lc3NhZ2UoY29uc3RyYWludHJlcG9ydCk7XG4gIH1cbn07XG5cbnNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIGlmIChldmVudC5kYXRhIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgLy8gdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgIHN3aXRjaCAoZXZlbnQuZGF0YVswXSkge1xuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOiB7XG4gICAgICAgIHdvcmxkcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOiB7XG4gICAgICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6IHtcbiAgICAgICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6IHtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICB9XG5cbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAoZXZlbnQuZGF0YS5jbWQgJiYgcHVibGljX2Z1bmN0aW9uc1tldmVudC5kYXRhLmNtZF0pIHB1YmxpY19mdW5jdGlvbnNbZXZlbnQuZGF0YS5jbWRdKGV2ZW50LmRhdGEucGFyYW1zKTtcbn07XG5cblxufSk7IiwiaW1wb3J0IHtcbiAgU2NlbmUgYXMgU2NlbmVOYXRpdmUsXG4gIE1lc2gsXG4gIFNwaGVyZUdlb21ldHJ5LFxuICBNZXNoTm9ybWFsTWF0ZXJpYWwsXG4gIEJveEdlb21ldHJ5LFxuICBWZWN0b3IzXG59IGZyb20gJ3RocmVlJztcblxuaW1wb3J0IHtMb29wfSBmcm9tICd3aHMnO1xuXG5pbXBvcnQge1ZlaGljbGV9IGZyb20gJy4uL3ZlaGljbGUvdmVoaWNsZSc7XG5pbXBvcnQge0V2ZW50YWJsZX0gZnJvbSAnLi4vZXZlbnRhYmxlJztcblxuaW1wb3J0IHtcbiAgYWRkT2JqZWN0Q2hpbGRyZW4sXG4gIE1FU1NBR0VfVFlQRVMsXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRVxufSBmcm9tICcuLi9hcGknO1xuXG5pbXBvcnQgUGh5c2ljc1dvcmtlciBmcm9tICd3b3JrZXIhLi4vd29ya2VyLmpzJztcblxuZXhwb3J0IGNsYXNzIFdvcmxkTW9kdWxlIGV4dGVuZHMgRXZlbnRhYmxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBmaXhlZFRpbWVTdGVwOiAxLzYwLFxuICAgICAgcmF0ZUxpbWl0OiB0cnVlLFxuICAgICAgYW1tbzogXCJcIixcbiAgICAgIHNvZnRib2R5OiBmYWxzZSxcbiAgICAgIGdyYXZpdHk6IG5ldyBWZWN0b3IzKDAsIC0xMDAsIDApXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICB0aGlzLndvcmtlciA9IG5ldyBQaHlzaWNzV29ya2VyKCk7XG4gICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZSA9IHRoaXMud29ya2VyLndlYmtpdFBvc3RNZXNzYWdlIHx8IHRoaXMud29ya2VyLnBvc3RNZXNzYWdlO1xuXG4gICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5sb2FkZXIgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAocGFyYW1zLndhc20pIHtcbiAgICAgICAgZmV0Y2gocGFyYW1zLndhc20pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSlcbiAgICAgICAgICAudGhlbihidWZmZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYXJhbXMud2FzbUJ1ZmZlciA9IGJ1ZmZlcjtcblxuICAgICAgICAgICAgdGhpcy5leGVjdXRlKCdpbml0JywgdGhpcy5wYXJhbXMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJQaHlzaWNzIGxvYWRpbmcgdGltZTogXCIgKyAocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgKyBcIm1zXCIpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdpbml0JywgdGhpcy5wYXJhbXMpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmxvYWRlci50aGVuKCgpID0+IHt0aGlzLmlzTG9hZGVkID0gdHJ1ZX0pO1xuXG4gICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHMgPSB7fTtcbiAgICB0aGlzLl9vYmplY3RzID0ge307XG4gICAgdGhpcy5fdmVoaWNsZXMgPSB7fTtcbiAgICB0aGlzLl9jb25zdHJhaW50cyA9IHt9O1xuICAgIHRoaXMuX2lzX3NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmdldE9iamVjdElkID0gKCgpID0+IHtcbiAgICAgIGxldCBfaWQgPSAxO1xuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgcmV0dXJuIF9pZCsrO1xuICAgICAgfTtcbiAgICB9KSgpO1xuXG4gICAgLy8gVGVzdCBTVVBQT1JUX1RSQU5TRkVSQUJMRVxuXG4gICAgY29uc3QgYWIgPSBuZXcgQXJyYXlCdWZmZXIoMSk7XG4gICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShhYiwgW2FiXSk7XG4gICAgdGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSA9IChhYi5ieXRlTGVuZ3RoID09PSAwKTtcblxuICAgIHRoaXMud29ya2VyLm9ubWVzc2FnZSA9IChldmVudCkgPT4ge1xuICAgICAgbGV0IF90ZW1wLFxuICAgICAgICBkYXRhID0gZXZlbnQuZGF0YTtcblxuICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciAmJiBkYXRhLmJ5dGVMZW5ndGggIT09IDEpLy8gYnl0ZUxlbmd0aCA9PT0gMSBpcyB0aGUgd29ya2VyIG1ha2luZyBhIFNVUFBPUlRfVFJBTlNGRVJBQkxFIHRlc3RcbiAgICAgICAgZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSk7XG5cbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICAgIC8vIHRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICAgICAgc3dpdGNoIChkYXRhWzBdKSB7XG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTY2VuZShkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlNPRlRSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNvZnRib2RpZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbGxpc2lvbnMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVWZWhpY2xlcyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnN0cmFpbnRzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChkYXRhLmNtZCkge1xuICAgICAgICAvLyBub24tdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgICAgICBzd2l0Y2ggKGRhdGEuY21kKSB7XG4gICAgICAgICAgY2FzZSAnb2JqZWN0UmVhZHknOlxuICAgICAgICAgICAgX3RlbXAgPSBkYXRhLnBhcmFtcztcbiAgICAgICAgICAgIGlmICh0aGlzLl9vYmplY3RzW190ZW1wXSkgdGhpcy5fb2JqZWN0c1tfdGVtcF0uZGlzcGF0Y2hFdmVudCgncmVhZHknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAnd29ybGRSZWFkeSc6XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3JlYWR5Jyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ2FtbW9Mb2FkZWQnOlxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdsb2FkZWQnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUGh5c2ljcyBsb2FkaW5nIHRpbWU6IFwiICsgKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpICsgXCJtc1wiKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAndmVoaWNsZSc6XG4gICAgICAgICAgICB3aW5kb3cudGVzdCA9IGRhdGE7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBEbyBub3RoaW5nLCBqdXN0IHNob3cgdGhlIG1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFJlY2VpdmVkOiAke2RhdGEuY21kfWApO1xuICAgICAgICAgICAgY29uc29sZS5kaXIoZGF0YS5wYXJhbXMpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN3aXRjaCAoZGF0YVswXSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2NlbmUoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbGxpc2lvbnMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVWZWhpY2xlcyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnN0cmFpbnRzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICB1cGRhdGVTY2VuZShpbmZvKSB7XG4gICAgbGV0IGluZGV4ID0gaW5mb1sxXTtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgaW5kZXggKiBSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLl9vYmplY3RzW2luZm9bb2Zmc2V0XV07XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPT09IGZhbHNlKSB7XG4gICAgICAgIG9iamVjdC5wb3NpdGlvbi5zZXQoXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAxXSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDJdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgM11cbiAgICAgICAgKTtcblxuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID09PSBmYWxzZSkge1xuICAgICAgICBvYmplY3QucXVhdGVybmlvbi5zZXQoXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA0XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDVdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNl0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA3XVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZGF0YS5saW5lYXJWZWxvY2l0eS5zZXQoXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgOF0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgOV0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTBdXG4gICAgICApO1xuXG4gICAgICBkYXRhLmFuZ3VsYXJWZWxvY2l0eS5zZXQoXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTFdLFxuICAgICAgICBpbmZvW29mZnNldCArIDEyXSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxM11cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG5cbiAgICB0aGlzLl9pc19zaW11bGF0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCd1cGRhdGUnKTtcbiAgfVxuXG4gIHVwZGF0ZVNvZnRib2RpZXMoZGF0YSkge1xuICAgIGxldCBpbmRleCA9IGRhdGFbMV0sXG4gICAgICBvZmZzZXQgPSAyO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IHNpemUgPSBkYXRhW29mZnNldCArIDFdO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tkYXRhW29mZnNldF1dO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgX3BoeXNpanMgPSBvYmplY3QuY29tcG9uZW50Ll9waHlzaWpzO1xuXG4gICAgICBjb25zdCBhdHRyaWJ1dGVzID0gb2JqZWN0Lmdlb21ldHJ5LmF0dHJpYnV0ZXM7XG4gICAgICBjb25zdCB2b2x1bWVQb3NpdGlvbnMgPSBhdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgICBjb25zdCBvZmZzZXRWZXJ0ID0gb2Zmc2V0ICsgMjtcblxuICAgICAgaWYgKCFfcGh5c2lqcy5pc1NvZnRCb2R5UmVzZXQpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KDAsIDAsIDAsIDApO1xuXG4gICAgICAgIF9waHlzaWpzLmlzU29mdEJvZHlSZXNldCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChfcGh5c2lqcy50eXBlID09PSBcInNvZnRUcmltZXNoXCIpIHtcbiAgICAgICAgY29uc3Qgdm9sdW1lTm9ybWFscyA9IGF0dHJpYnV0ZXMubm9ybWFsLmFycmF5O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogMTg7XG5cbiAgICAgICAgICBjb25zdCB4MSA9IGRhdGFbb2Zmc107XG4gICAgICAgICAgY29uc3QgeTEgPSBkYXRhW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6MSA9IGRhdGFbb2ZmcyArIDJdO1xuXG4gICAgICAgICAgY29uc3QgbngxID0gZGF0YVtvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkxID0gZGF0YVtvZmZzICsgNF07XG4gICAgICAgICAgY29uc3QgbnoxID0gZGF0YVtvZmZzICsgNV07XG5cbiAgICAgICAgICBjb25zdCB4MiA9IGRhdGFbb2ZmcyArIDZdO1xuICAgICAgICAgIGNvbnN0IHkyID0gZGF0YVtvZmZzICsgN107XG4gICAgICAgICAgY29uc3QgejIgPSBkYXRhW29mZnMgKyA4XTtcblxuICAgICAgICAgIGNvbnN0IG54MiA9IGRhdGFbb2ZmcyArIDldO1xuICAgICAgICAgIGNvbnN0IG55MiA9IGRhdGFbb2ZmcyArIDEwXTtcbiAgICAgICAgICBjb25zdCBuejIgPSBkYXRhW29mZnMgKyAxMV07XG5cbiAgICAgICAgICBjb25zdCB4MyA9IGRhdGFbb2ZmcyArIDEyXTtcbiAgICAgICAgICBjb25zdCB5MyA9IGRhdGFbb2ZmcyArIDEzXTtcbiAgICAgICAgICBjb25zdCB6MyA9IGRhdGFbb2ZmcyArIDE0XTtcblxuICAgICAgICAgIGNvbnN0IG54MyA9IGRhdGFbb2ZmcyArIDE1XTtcbiAgICAgICAgICBjb25zdCBueTMgPSBkYXRhW29mZnMgKyAxNl07XG4gICAgICAgICAgY29uc3QgbnozID0gZGF0YVtvZmZzICsgMTddO1xuXG4gICAgICAgICAgY29uc3QgaTkgPSBpICogOTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOV0gPSB4MTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAxXSA9IHkxO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDJdID0gejE7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAzXSA9IHgyO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDRdID0geTI7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNV0gPSB6MjtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDZdID0geDM7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgN10gPSB5MztcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA4XSA9IHozO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOV0gPSBueDE7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDFdID0gbnkxO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAyXSA9IG56MTtcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAzXSA9IG54MjtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNF0gPSBueTI7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDVdID0gbnoyO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDZdID0gbngzO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA3XSA9IG55MztcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgOF0gPSBuejM7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDE4O1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoX3BoeXNpanMudHlwZSA9PT0gXCJzb2Z0Um9wZU1lc2hcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICBjb25zdCB4ID0gZGF0YVtvZmZzXTtcbiAgICAgICAgICBjb25zdCB5ID0gZGF0YVtvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgeiA9IGRhdGFbb2ZmcyArIDJdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2b2x1bWVOb3JtYWxzID0gYXR0cmlidXRlcy5ub3JtYWwuYXJyYXk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgY29uc3QgeCA9IGRhdGFbb2Zmc107XG4gICAgICAgICAgY29uc3QgeSA9IGRhdGFbb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHogPSBkYXRhW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54ID0gZGF0YVtvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkgPSBkYXRhW29mZnMgKyA0XTtcbiAgICAgICAgICBjb25zdCBueiA9IGRhdGFbb2ZmcyArIDVdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcblxuICAgICAgICAgIC8vIEZJWE1FOiBOb3JtYWxzIGFyZSBwb2ludGVkIHRvIGxvb2sgaW5zaWRlO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDNdID0gbng7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDFdID0gbnk7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDJdID0gbno7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDY7XG4gICAgICB9XG5cbiAgICAgIGF0dHJpYnV0ZXMucG9zaXRpb24ubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgIC8vICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuXG4gICAgdGhpcy5faXNfc2ltdWxhdGluZyA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVmVoaWNsZXMoZGF0YSkge1xuICAgIGxldCB2ZWhpY2xlLCB3aGVlbDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogVkVISUNMRVJFUE9SVF9JVEVNU0laRTtcbiAgICAgIHZlaGljbGUgPSB0aGlzLl92ZWhpY2xlc1tkYXRhW29mZnNldF1dO1xuXG4gICAgICBpZiAodmVoaWNsZSA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIHdoZWVsID0gdmVoaWNsZS53aGVlbHNbZGF0YVtvZmZzZXQgKyAxXV07XG5cbiAgICAgIHdoZWVsLnBvc2l0aW9uLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAzXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA0XVxuICAgICAgKTtcblxuICAgICAgd2hlZWwucXVhdGVybmlvbi5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNV0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgN10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgOF1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICB1cGRhdGVDb25zdHJhaW50cyhkYXRhKSB7XG4gICAgbGV0IGNvbnN0cmFpbnQsIG9iamVjdDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0cmFpbnQgPSB0aGlzLl9jb25zdHJhaW50c1tkYXRhW29mZnNldF1dO1xuICAgICAgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tkYXRhW29mZnNldCArIDFdXTtcblxuICAgICAgaWYgKGNvbnN0cmFpbnQgPT09IHVuZGVmaW5lZCB8fCBvYmplY3QgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cbiAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgMl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgM10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNF1cbiAgICAgICk7XG5cbiAgICAgIHRlbXAxTWF0cml4NC5leHRyYWN0Um90YXRpb24ob2JqZWN0Lm1hdHJpeCk7XG4gICAgICB0ZW1wMVZlY3RvcjMuYXBwbHlNYXRyaXg0KHRlbXAxTWF0cml4NCk7XG5cbiAgICAgIGNvbnN0cmFpbnQucG9zaXRpb25hLmFkZFZlY3RvcnMob2JqZWN0LnBvc2l0aW9uLCB0ZW1wMVZlY3RvcjMpO1xuICAgICAgY29uc3RyYWludC5hcHBsaWVkSW1wdWxzZSA9IGRhdGFbb2Zmc2V0ICsgNV07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICB1cGRhdGVDb2xsaXNpb25zKGRhdGEpIHtcbiAgICAvKipcbiAgICAgKiAjVE9ET1xuICAgICAqIFRoaXMgaXMgcHJvYmFibHkgdGhlIHdvcnN0IHdheSBldmVyIHRvIGhhbmRsZSBjb2xsaXNpb25zLiBUaGUgaW5oZXJlbnQgZXZpbG5lc3MgaXMgYSByZXNpZHVhbFxuICAgICAqIGVmZmVjdCBmcm9tIHRoZSBwcmV2aW91cyB2ZXJzaW9uJ3MgZXZpbG5lc3Mgd2hpY2ggbXV0YXRlZCB3aGVuIHN3aXRjaGluZyB0byB0cmFuc2ZlcmFibGUgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIElmIHlvdSBmZWVsIGluY2xpbmVkIHRvIG1ha2UgdGhpcyBiZXR0ZXIsIHBsZWFzZSBkbyBzby5cbiAgICAgKi9cblxuICAgIGNvbnN0IGNvbGxpc2lvbnMgPSB7fSxcbiAgICAgIG5vcm1hbF9vZmZzZXRzID0ge307XG5cbiAgICAvLyBCdWlsZCBjb2xsaXNpb24gbWFuaWZlc3RcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFbMV07IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIGkgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdCBvYmplY3QgPSBkYXRhW29mZnNldF07XG4gICAgICBjb25zdCBvYmplY3QyID0gZGF0YVtvZmZzZXQgKyAxXTtcblxuICAgICAgbm9ybWFsX29mZnNldHNbYCR7b2JqZWN0fS0ke29iamVjdDJ9YF0gPSBvZmZzZXQgKyAyO1xuICAgICAgbm9ybWFsX29mZnNldHNbYCR7b2JqZWN0Mn0tJHtvYmplY3R9YF0gPSAtMSAqIChvZmZzZXQgKyAyKTtcblxuICAgICAgLy8gUmVnaXN0ZXIgY29sbGlzaW9ucyBmb3IgYm90aCB0aGUgb2JqZWN0IGNvbGxpZGluZyBhbmQgdGhlIG9iamVjdCBiZWluZyBjb2xsaWRlZCB3aXRoXG4gICAgICBpZiAoIWNvbGxpc2lvbnNbb2JqZWN0XSkgY29sbGlzaW9uc1tvYmplY3RdID0gW107XG4gICAgICBjb2xsaXNpb25zW29iamVjdF0ucHVzaChvYmplY3QyKTtcblxuICAgICAgaWYgKCFjb2xsaXNpb25zW29iamVjdDJdKSBjb2xsaXNpb25zW29iamVjdDJdID0gW107XG4gICAgICBjb2xsaXNpb25zW29iamVjdDJdLnB1c2gob2JqZWN0KTtcbiAgICB9XG5cbiAgICAvLyBEZWFsIHdpdGggY29sbGlzaW9uc1xuICAgIGZvciAoY29uc3QgaWQxIGluIHRoaXMuX29iamVjdHMpIHtcbiAgICAgIGlmICghdGhpcy5fb2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShpZDEpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMuX29iamVjdHNbaWQxXTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICAvLyBJZiBvYmplY3QgdG91Y2hlcyBhbnl0aGluZywgLi4uXG4gICAgICBpZiAoY29sbGlzaW9uc1tpZDFdKSB7XG4gICAgICAgIC8vIENsZWFuIHVwIHRvdWNoZXMgYXJyYXlcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkYXRhLnRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAoY29sbGlzaW9uc1tpZDFdLmluZGV4T2YoZGF0YS50b3VjaGVzW2pdKSA9PT0gLTEpXG4gICAgICAgICAgICBkYXRhLnRvdWNoZXMuc3BsaWNlKGotLSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgZWFjaCBjb2xsaWRpbmcgb2JqZWN0XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29sbGlzaW9uc1tpZDFdLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgaWQyID0gY29sbGlzaW9uc1tpZDFdW2pdO1xuICAgICAgICAgIGNvbnN0IG9iamVjdDIgPSB0aGlzLl9vYmplY3RzW2lkMl07XG4gICAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IG9iamVjdDIuY29tcG9uZW50O1xuICAgICAgICAgIGNvbnN0IGRhdGEyID0gY29tcG9uZW50Mi51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICAgICAgaWYgKG9iamVjdDIpIHtcbiAgICAgICAgICAgIC8vIElmIG9iamVjdCB3YXMgbm90IGFscmVhZHkgdG91Y2hpbmcgb2JqZWN0Miwgbm90aWZ5IG9iamVjdFxuICAgICAgICAgICAgaWYgKGRhdGEudG91Y2hlcy5pbmRleE9mKGlkMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgIGRhdGEudG91Y2hlcy5wdXNoKGlkMik7XG5cbiAgICAgICAgICAgICAgY29uc3QgdmVsID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmdldExpbmVhclZlbG9jaXR5KCk7XG4gICAgICAgICAgICAgIGNvbnN0IHZlbDIgPSBjb21wb25lbnQyLnVzZSgncGh5c2ljcycpLmdldExpbmVhclZlbG9jaXR5KCk7XG5cbiAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnN1YlZlY3RvcnModmVsLCB2ZWwyKTtcbiAgICAgICAgICAgICAgY29uc3QgdGVtcDEgPSB0ZW1wMVZlY3RvcjMuY2xvbmUoKTtcbiAgICAgICAgICAgICAgY29uc3QgdGVtcDIgPSB0ZW1wMVZlY3RvcjMuY2xvbmUoKTtcblxuICAgICAgICAgICAgICBsZXQgbm9ybWFsX29mZnNldCA9IG5vcm1hbF9vZmZzZXRzW2Ake2RhdGEuaWR9LSR7ZGF0YTIuaWR9YF07XG5cbiAgICAgICAgICAgICAgaWYgKG5vcm1hbF9vZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIC1kYXRhW25vcm1hbF9vZmZzZXRdLFxuICAgICAgICAgICAgICAgICAgLWRhdGFbbm9ybWFsX29mZnNldCArIDFdLFxuICAgICAgICAgICAgICAgICAgLWRhdGFbbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub3JtYWxfb2Zmc2V0ICo9IC0xO1xuXG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIGRhdGFbbm9ybWFsX29mZnNldF0sXG4gICAgICAgICAgICAgICAgICBkYXRhW25vcm1hbF9vZmZzZXQgKyAxXSxcbiAgICAgICAgICAgICAgICAgIGRhdGFbbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbXBvbmVudC5lbWl0KCdjb2xsaXNpb24nLCBvYmplY3QyLCB0ZW1wMSwgdGVtcDIsIHRlbXAxVmVjdG9yMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgZGF0YS50b3VjaGVzLmxlbmd0aCA9IDA7IC8vIG5vdCB0b3VjaGluZyBvdGhlciBvYmplY3RzXG4gICAgfVxuXG4gICAgdGhpcy5jb2xsaXNpb25zID0gY29sbGlzaW9ucztcblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgYWRkQ29uc3RyYWludChjb25zdHJhaW50LCBzaG93X21hcmtlcikge1xuICAgIGNvbnN0cmFpbnQuaWQgPSB0aGlzLmdldE9iamVjdElkKCk7XG4gICAgdGhpcy5fY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gPSBjb25zdHJhaW50O1xuICAgIGNvbnN0cmFpbnQud29ybGRNb2R1bGUgPSB0aGlzO1xuICAgIHRoaXMuZXhlY3V0ZSgnYWRkQ29uc3RyYWludCcsIGNvbnN0cmFpbnQuZ2V0RGVmaW5pdGlvbigpKTtcblxuICAgIGlmIChzaG93X21hcmtlcikge1xuICAgICAgbGV0IG1hcmtlcjtcblxuICAgICAgc3dpdGNoIChjb25zdHJhaW50LnR5cGUpIHtcbiAgICAgICAgY2FzZSAncG9pbnQnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMuX29iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdoaW5nZSc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NsaWRlcic6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgQm94R2VvbWV0cnkoMTAsIDEsIDEpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcblxuICAgICAgICAgIC8vIFRoaXMgcm90YXRpb24gaXNuJ3QgcmlnaHQgaWYgYWxsIHRocmVlIGF4aXMgYXJlIG5vbi0wIHZhbHVlc1xuICAgICAgICAgIC8vIFRPRE86IGNoYW5nZSBtYXJrZXIncyByb3RhdGlvbiBvcmRlciB0byBaWVhcbiAgICAgICAgICBtYXJrZXIucm90YXRpb24uc2V0KFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLnksIC8vIHllcywgeSBhbmRcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy54LCAvLyB4IGF4aXMgYXJlIHN3YXBwZWRcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy56XG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnY29uZXR3aXN0JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnZG9mJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnN0cmFpbnQ7XG4gIH1cblxuICBvblNpbXVsYXRpb25SZXN1bWUoKSB7XG4gICAgdGhpcy5leGVjdXRlKCdvblNpbXVsYXRpb25SZXN1bWUnLCB7fSk7XG4gIH1cblxuICByZW1vdmVDb25zdHJhaW50KGNvbnN0cmFpbnQpIHtcbiAgICBpZiAodGhpcy5fY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVDb25zdHJhaW50Jywge2lkOiBjb25zdHJhaW50LmlkfSk7XG4gICAgICBkZWxldGUgdGhpcy5fY29uc3RyYWludHNbY29uc3RyYWludC5pZF07XG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZShjbWQsIHBhcmFtcykge1xuICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKHtjbWQsIHBhcmFtc30pO1xuICB9XG5cbiAgb25BZGRDYWxsYmFjayhjb21wb25lbnQpIHtcbiAgICBjb25zdCBvYmplY3QgPSBjb21wb25lbnQubmF0aXZlO1xuICAgIGNvbnN0IGRhdGEgPSBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICBpZiAoZGF0YSkge1xuICAgICAgY29tcG9uZW50Lm1hbmFnZXIuc2V0KCdtb2R1bGU6d29ybGQnLCB0aGlzKTtcbiAgICAgIGRhdGEuaWQgPSB0aGlzLmdldE9iamVjdElkKCk7XG5cbiAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBWZWhpY2xlKSB7XG4gICAgICAgIHRoaXMub25BZGRDYWxsYmFjayhvYmplY3QubWVzaCk7XG4gICAgICAgIHRoaXMuX3ZlaGljbGVzW2RhdGEuaWRdID0gb2JqZWN0O1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2FkZFZlaGljbGUnLCBkYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9vYmplY3RzW2RhdGEuaWRdID0gb2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmplY3QuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgZGF0YS5jaGlsZHJlbiA9IFtdO1xuICAgICAgICAgIGFkZE9iamVjdENoaWxkcmVuKG9iamVjdCwgb2JqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMpIHtcbiAgICAgICAgICBpZiAodGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHMuaGFzT3duUHJvcGVydHkob2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkKSlcbiAgICAgICAgICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0rKztcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZSgncmVnaXN0ZXJNYXRlcmlhbCcsIG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcyk7XG4gICAgICAgICAgICBkYXRhLm1hdGVyaWFsSWQgPSBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWQ7XG4gICAgICAgICAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBvYmplY3QucXVhdGVybmlvbi5zZXRGcm9tRXVsZXIob2JqZWN0LnJvdGF0aW9uKTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gY29uc29sZS5sb2cob2JqZWN0LmNvbXBvbmVudCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdC5yb3RhdGlvbik7XG5cbiAgICAgICAgLy8gT2JqZWN0IHN0YXJ0aW5nIHBvc2l0aW9uICsgcm90YXRpb25cbiAgICAgICAgZGF0YS5wb3NpdGlvbiA9IHtcbiAgICAgICAgICB4OiBvYmplY3QucG9zaXRpb24ueCxcbiAgICAgICAgICB5OiBvYmplY3QucG9zaXRpb24ueSxcbiAgICAgICAgICB6OiBvYmplY3QucG9zaXRpb24uelxuICAgICAgICB9O1xuXG4gICAgICAgIGRhdGEucm90YXRpb24gPSB7XG4gICAgICAgICAgeDogb2JqZWN0LnF1YXRlcm5pb24ueCxcbiAgICAgICAgICB5OiBvYmplY3QucXVhdGVybmlvbi55LFxuICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgdzogb2JqZWN0LnF1YXRlcm5pb24ud1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChkYXRhLndpZHRoKSBkYXRhLndpZHRoICo9IG9iamVjdC5zY2FsZS54O1xuICAgICAgICBpZiAoZGF0YS5oZWlnaHQpIGRhdGEuaGVpZ2h0ICo9IG9iamVjdC5zY2FsZS55O1xuICAgICAgICBpZiAoZGF0YS5kZXB0aCkgZGF0YS5kZXB0aCAqPSBvYmplY3Quc2NhbGUuejtcblxuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2FkZE9iamVjdCcsIGRhdGEpO1xuICAgICAgfVxuXG4gICAgICBjb21wb25lbnQuZW1pdCgncGh5c2ljczphZGRlZCcpO1xuICAgIH1cbiAgfVxuXG4gIG9uUmVtb3ZlQ2FsbGJhY2soY29tcG9uZW50KSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gY29tcG9uZW50Lm5hdGl2ZTtcblxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBWZWhpY2xlKSB7XG4gICAgICB0aGlzLmV4ZWN1dGUoJ3JlbW92ZVZlaGljbGUnLCB7aWQ6IG9iamVjdC5fcGh5c2lqcy5pZH0pO1xuICAgICAgd2hpbGUgKG9iamVjdC53aGVlbHMubGVuZ3RoKSB0aGlzLnJlbW92ZShvYmplY3Qud2hlZWxzLnBvcCgpKTtcblxuICAgICAgdGhpcy5yZW1vdmUob2JqZWN0Lm1lc2gpO1xuICAgICAgdGhpcy5fdmVoaWNsZXNbb2JqZWN0Ll9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1lc2gucHJvdG90eXBlLnJlbW92ZS5jYWxsKHRoaXMsIG9iamVjdCk7XG5cbiAgICAgIGlmIChvYmplY3QuX3BoeXNpanMpIHtcbiAgICAgICAgY29tcG9uZW50Lm1hbmFnZXIucmVtb3ZlKCdtb2R1bGU6d29ybGQnKTtcbiAgICAgICAgdGhpcy5fb2JqZWN0c1tvYmplY3QuX3BoeXNpanMuaWRdID0gbnVsbDtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVPYmplY3QnLCB7aWQ6IG9iamVjdC5fcGh5c2lqcy5pZH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob2JqZWN0Lm1hdGVyaWFsICYmIG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcyAmJiB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50cy5oYXNPd25Qcm9wZXJ0eShvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWQpKSB7XG4gICAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdLS07XG5cbiAgICAgIGlmICh0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdID09PSAwKSB7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgndW5SZWdpc3Rlck1hdGVyaWFsJywgb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzKTtcbiAgICAgICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZGVmZXIoZnVuYywgYXJncykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNMb2FkZWQpIHtcbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIHRoaXMubG9hZGVyLnRoZW4oKCkgPT4ge1xuICAgICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIG1hbmFnZXIuc2V0KCdwaHlzaWNzV29ya2VyJywgdGhpcy53b3JrZXIpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG9uQWRkKGNvbXBvbmVudCwgc2VsZikge1xuICAgICAgaWYgKGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSkgcmV0dXJuIHNlbGYuZGVmZXIoc2VsZi5vbkFkZENhbGxiYWNrLmJpbmQoc2VsZiksIFtjb21wb25lbnRdKTtcbiAgICAgIHJldHVybjtcbiAgICB9LFxuXG4gICAgb25SZW1vdmUoY29tcG9uZW50LCBzZWxmKSB7XG4gICAgICBpZiAoY29tcG9uZW50LnVzZSgncGh5c2ljcycpKSByZXR1cm4gc2VsZi5kZWZlcihzZWxmLm9uUmVtb3ZlQ2FsbGJhY2suYmluZChzZWxmKSwgW2NvbXBvbmVudF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgLy8gLi4uXG5cbiAgICB0aGlzLnNldEZpeGVkVGltZVN0ZXAgPSBmdW5jdGlvbihmaXhlZFRpbWVTdGVwKSB7XG4gICAgICBpZiAoZml4ZWRUaW1lU3RlcCkgc2VsZi5leGVjdXRlKCdzZXRGaXhlZFRpbWVTdGVwJywgZml4ZWRUaW1lU3RlcCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRHcmF2aXR5ID0gZnVuY3Rpb24oZ3Jhdml0eSkge1xuICAgICAgaWYgKGdyYXZpdHkpIHNlbGYuZXhlY3V0ZSgnc2V0R3Jhdml0eScsIGdyYXZpdHkpO1xuICAgIH1cblxuICAgIHRoaXMuYWRkQ29uc3RyYWludCA9IHNlbGYuYWRkQ29uc3RyYWludC5iaW5kKHNlbGYpO1xuXG4gICAgdGhpcy5zaW11bGF0ZSA9IGZ1bmN0aW9uKHRpbWVTdGVwLCBtYXhTdWJTdGVwcykge1xuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5iZWdpbigpO1xuXG4gICAgICBpZiAoc2VsZi5faXNfc2ltdWxhdGluZykgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBzZWxmLl9pc19zaW11bGF0aW5nID0gdHJ1ZTtcblxuICAgICAgZm9yIChjb25zdCBvYmplY3RfaWQgaW4gc2VsZi5fb2JqZWN0cykge1xuICAgICAgICBpZiAoIXNlbGYuX29iamVjdHMuaGFzT3duUHJvcGVydHkob2JqZWN0X2lkKSkgY29udGludWU7XG5cbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gc2VsZi5fb2JqZWN0c1tvYmplY3RfaWRdO1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgICAgaWYgKG9iamVjdCAhPT0gbnVsbCAmJiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiB8fCBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uKSkge1xuICAgICAgICAgIGNvbnN0IHVwZGF0ZSA9IHtpZDogZGF0YS5pZH07XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnBvcyA9IHtcbiAgICAgICAgICAgICAgeDogb2JqZWN0LnBvc2l0aW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5wb3NpdGlvbi55LFxuICAgICAgICAgICAgICB6OiBvYmplY3QucG9zaXRpb24uelxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGRhdGEuaXNTb2Z0Ym9keSkgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcblxuICAgICAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uKSB7XG4gICAgICAgICAgICB1cGRhdGUucXVhdCA9IHtcbiAgICAgICAgICAgICAgeDogb2JqZWN0LnF1YXRlcm5pb24ueCxcbiAgICAgICAgICAgICAgeTogb2JqZWN0LnF1YXRlcm5pb24ueSxcbiAgICAgICAgICAgICAgejogb2JqZWN0LnF1YXRlcm5pb24ueixcbiAgICAgICAgICAgICAgdzogb2JqZWN0LnF1YXRlcm5pb24ud1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGRhdGEuaXNTb2Z0Ym9keSkgb2JqZWN0LnJvdGF0aW9uLnNldCgwLCAwLCAwKTtcblxuICAgICAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuZXhlY3V0ZSgndXBkYXRlVHJhbnNmb3JtJywgdXBkYXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZWxmLmV4ZWN1dGUoJ3NpbXVsYXRlJywge3RpbWVTdGVwLCBtYXhTdWJTdGVwc30pO1xuXG4gICAgICBpZiAoc2VsZi5fc3RhdHMpIHNlbGYuX3N0YXRzLmVuZCgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gY29uc3Qgc2ltdWxhdGVQcm9jZXNzID0gKHQpID0+IHtcbiAgICAvLyAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoc2ltdWxhdGVQcm9jZXNzKTtcblxuICAgIC8vICAgdGhpcy5zaW11bGF0ZSgxLzYwLCAxKTsgLy8gZGVsdGEsIDFcbiAgICAvLyB9XG5cbiAgICAvLyBzaW11bGF0ZVByb2Nlc3MoKTtcblxuICAgIHNlbGYubG9hZGVyLnRoZW4oKCkgPT4ge1xuICAgICAgc2VsZi5zaW11bGF0ZUxvb3AgPSBuZXcgTG9vcCgoY2xvY2spID0+IHtcbiAgICAgICAgdGhpcy5zaW11bGF0ZShjbG9jay5nZXREZWx0YSgpLCAxKTsgLy8gZGVsdGEsIDFcbiAgICAgIH0pO1xuXG4gICAgICBzZWxmLnNpbXVsYXRlTG9vcC5zdGFydCh0aGlzKTtcblxuICAgICAgdGhpcy5zZXRHcmF2aXR5KHBhcmFtcy5ncmF2aXR5KTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtRdWF0ZXJuaW9ufSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBjb25zdCBwcm9wZXJ0aWVzID0ge1xuICBwb3NpdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgfSxcblxuICAgIHNldCh2ZWN0b3IzKSB7XG4gICAgICBjb25zdCBwb3MgPSB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgICBjb25zdCBzY29wZSA9IHRoaXM7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHBvcywge1xuICAgICAgICB4OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3g7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh4KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feCA9IHg7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3k7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh5KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feSA9IHk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB6OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3o7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh6KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feiA9IHo7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcblxuICAgICAgcG9zLmNvcHkodmVjdG9yMyk7XG4gICAgfVxuICB9LFxuXG4gIHF1YXRlcm5pb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMubmF0aXZlLnF1YXRlcm5pb247XG4gICAgfSxcblxuICAgIHNldChxdWF0ZXJuaW9uKSB7XG4gICAgICBjb25zdCBxdWF0ID0gdGhpcy5fbmF0aXZlLnF1YXRlcm5pb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgcXVhdC5jb3B5KHF1YXRlcm5pb24pO1xuXG4gICAgICBxdWF0Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIGlmIChuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLl9fY19yb3QgPSBmYWxzZTtcbiAgICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICByb3RhdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHRoaXMuX19jX3JvdCA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnJvdGF0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQoZXVsZXIpIHtcbiAgICAgIGNvbnN0IHJvdCA9IHRoaXMuX25hdGl2ZS5yb3RhdGlvbixcbiAgICAgICAgbmF0aXZlID0gdGhpcy5fbmF0aXZlO1xuXG4gICAgICB0aGlzLnF1YXRlcm5pb24uY29weShuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihldWxlcikpO1xuXG4gICAgICByb3Qub25DaGFuZ2UoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2Nfcm90KSB7XG4gICAgICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIocm90KSk7XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JhcFBoeXNpY3NQcm90b3R5cGUoc2NvcGUpIHtcbiAgZm9yIChsZXQga2V5IGluIHByb3BlcnRpZXMpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NvcGUsIGtleSwge1xuICAgICAgZ2V0OiBwcm9wZXJ0aWVzW2tleV0uZ2V0LmJpbmQoc2NvcGUpLFxuICAgICAgc2V0OiBwcm9wZXJ0aWVzW2tleV0uc2V0LmJpbmQoc2NvcGUpLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbkNvcHkoc291cmNlKSB7XG4gIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB0aGlzLl9waHlzaWpzID0gey4uLnNvdXJjZS5fcGh5c2lqc307XG4gIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmNsb25lKCk7XG4gIHRoaXMucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uLmNsb25lKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IHRoaXMucXVhdGVybmlvbi5jbG9uZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb25XcmFwKCkge1xuICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5jbG9uZSgpO1xuICB0aGlzLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbi5jbG9uZSgpO1xuICB0aGlzLnF1YXRlcm5pb24gPSB0aGlzLnF1YXRlcm5pb24uY2xvbmUoKTtcbn1cbiIsImltcG9ydCB7VmVjdG9yM30gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmNsYXNzIEFQSSB7XG4gIGFwcGx5Q2VudHJhbEltcHVsc2UoZm9yY2UpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Q2VudHJhbEltcHVsc2UnLCB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogZm9yY2UueCwgeTogZm9yY2UueSwgejogZm9yY2Uuen0pO1xuICB9XG5cbiAgYXBwbHlJbXB1bHNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5SW1wdWxzZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICBpbXB1bHNlX3g6IGZvcmNlLngsXG4gICAgICBpbXB1bHNlX3k6IGZvcmNlLnksXG4gICAgICBpbXB1bHNlX3o6IGZvcmNlLnosXG4gICAgICB4OiBvZmZzZXQueCxcbiAgICAgIHk6IG9mZnNldC55LFxuICAgICAgejogb2Zmc2V0LnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5VG9ycXVlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseVRvcnF1ZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICB0b3JxdWVfeDogZm9yY2UueCxcbiAgICAgIHRvcnF1ZV95OiBmb3JjZS55LFxuICAgICAgdG9ycXVlX3o6IGZvcmNlLnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5Q2VudHJhbEZvcmNlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUNlbnRyYWxGb3JjZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICB4OiBmb3JjZS54LFxuICAgICAgeTogZm9yY2UueSxcbiAgICAgIHo6IGZvcmNlLnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5Rm9yY2UoZm9yY2UsIG9mZnNldCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlGb3JjZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICBmb3JjZV94OiBmb3JjZS54LFxuICAgICAgZm9yY2VfeTogZm9yY2UueSxcbiAgICAgIGZvcmNlX3o6IGZvcmNlLnosXG4gICAgICB4OiBvZmZzZXQueCxcbiAgICAgIHk6IG9mZnNldC55LFxuICAgICAgejogb2Zmc2V0LnpcbiAgICB9KTtcbiAgfVxuXG4gIGdldEFuZ3VsYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmFuZ3VsYXJWZWxvY2l0eTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRBbmd1bGFyVmVsb2NpdHknLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9XG4gICAgKTtcbiAgfVxuXG4gIGdldExpbmVhclZlbG9jaXR5KCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEubGluZWFyVmVsb2NpdHk7XG4gIH1cblxuICBzZXRMaW5lYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRMaW5lYXJWZWxvY2l0eScsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogdmVsb2NpdHkueCwgeTogdmVsb2NpdHkueSwgejogdmVsb2NpdHkuen1cbiAgICApO1xuICB9XG5cbiAgc2V0QW5ndWxhckZhY3RvcihmYWN0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0QW5ndWxhckZhY3RvcicsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogZmFjdG9yLngsIHk6IGZhY3Rvci55LCB6OiBmYWN0b3Iuen1cbiAgICApO1xuICB9XG5cbiAgc2V0TGluZWFyRmFjdG9yKGZhY3Rvcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRMaW5lYXJGYWN0b3InLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldERhbXBpbmcobGluZWFyLCBhbmd1bGFyKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldERhbXBpbmcnLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIGxpbmVhciwgYW5ndWxhcn1cbiAgICApO1xuICB9XG5cbiAgc2V0Q2NkTW90aW9uVGhyZXNob2xkKHRocmVzaG9sZCkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRDY2RNb3Rpb25UaHJlc2hvbGQnLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHRocmVzaG9sZH1cbiAgICApO1xuICB9XG5cbiAgc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMocmFkaXVzKSB7XG4gICAgdGhpcy5leGVjdXRlKCdzZXRDY2RTd2VwdFNwaGVyZVJhZGl1cycsIHtpZDogdGhpcy5kYXRhLmlkLCByYWRpdXN9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBleHRlbmRzIEFQSSB7XG4gIHN0YXRpYyByaWdpZGJvZHkgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGxpbmVhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICBtYXNzOiAxMCxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIGRhbXBpbmc6IDAsXG4gICAgbWFyZ2luOiAwXG4gIH0pO1xuXG4gIGNvbnN0cnVjdG9yKGRlZmF1bHRzLCBkYXRhKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRzLCBkYXRhKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICBtYW5hZ2VyLmRlZmluZSgncGh5c2ljcycpO1xuXG4gICAgdGhpcy5leGVjdXRlID0gKC4uLmRhdGEpID0+IHtcbiAgICAgIHJldHVybiBtYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJylcbiAgICAgID8gbWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoLi4uZGF0YSlcbiAgICAgIDogKCkgPT4ge307XG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZURhdGEoY2FsbGJhY2spIHtcbiAgICB0aGlzLmJyaWRnZS5nZW9tZXRyeSA9IGZ1bmN0aW9uIChnZW9tZXRyeSwgbW9kdWxlKSB7XG4gICAgICBjYWxsYmFjayhnZW9tZXRyeSwgbW9kdWxlKTtcbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIEJveE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnYm94JyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIENvbXBvdW5kTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ2NvbXBvdW5kJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfTtcbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vUGh5c2ljc01vZHVsZSc7XG5cbi8vIFRPRE86IFRlc3QgQ2Fwc3VsZU1vZHVsZSBpbiBhY3Rpb24uXG5leHBvcnQgY2xhc3MgQ2Fwc3VsZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY2Fwc3VsZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgZGF0YS5oZWlnaHQgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgZGF0YS5kZXB0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yMywgTXVsdGlNYXRlcmlhbCwgTWVzaCwgSlNPTkxvYWRlcn0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDb25jYXZlTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgbG9hZGVyOiBuZXcgSlNPTkxvYWRlcigpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIGlmICh0aGlzLnBhcmFtcy5wYXRoICYmIHRoaXMucGFyYW1zLmxvYWRlcikge1xuICAgICAgdGhpcy5nZW9tZXRyeUxvYWRlciA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5wYXJhbXMubG9hZGVyLmxvYWQoXG4gICAgICAgICAgdGhpcy5wYXJhbXMucGF0aCxcbiAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICgpID0+IHt9LFxuICAgICAgICAgIHJlamVjdFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpIHtcbiAgICBjb25zdCBpc0J1ZmZlciA9IGdlb21ldHJ5LnR5cGUgPT09ICdCdWZmZXJHZW9tZXRyeSc7XG5cbiAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgIGNvbnN0IGRhdGEgPSBpc0J1ZmZlciA/XG4gICAgICBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDpcbiAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogOSk7XG5cbiAgICBpZiAoIWlzQnVmZmVyKSB7XG4gICAgICBjb25zdCB2ZXJ0aWNlcyA9IGdlb21ldHJ5LnZlcnRpY2VzO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgICBjb25zdCB2QSA9IHZlcnRpY2VzW2ZhY2UuYV07XG4gICAgICAgIGNvbnN0IHZCID0gdmVydGljZXNbZmFjZS5iXTtcbiAgICAgICAgY29uc3QgdkMgPSB2ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgZGF0YVtpOV0gPSB2QS54O1xuICAgICAgICBkYXRhW2k5ICsgMV0gPSB2QS55O1xuICAgICAgICBkYXRhW2k5ICsgMl0gPSB2QS56O1xuXG4gICAgICAgIGRhdGFbaTkgKyAzXSA9IHZCLng7XG4gICAgICAgIGRhdGFbaTkgKyA0XSA9IHZCLnk7XG4gICAgICAgIGRhdGFbaTkgKyA1XSA9IHZCLno7XG5cbiAgICAgICAgZGF0YVtpOSArIDZdID0gdkMueDtcbiAgICAgICAgZGF0YVtpOSArIDddID0gdkMueTtcbiAgICAgICAgZGF0YVtpOSArIDhdID0gdkMuejtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfTtcblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjb25jYXZlJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5LCBzZWxmKSB7XG4gICAgICBpZiAoc2VsZi5wYXJhbXMucGF0aCkge1xuICAgICAgICB0aGlzLndhaXQoc2VsZi5nZW9tZXRyeUxvYWRlcik7XG5cbiAgICAgICAgc2VsZi5nZW9tZXRyeUxvYWRlclxuICAgICAgICAgIC50aGVuKGdlb20gPT4ge1xuICAgICAgICAgICAgdGhpcy5fcGh5c2lqcy5kYXRhID0gc2VsZi5nZW9tZXRyeVByb2Nlc3NvcihnZW9tKVxuICAgICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcGh5c2lqcy5kYXRhID0gc2VsZi5nZW9tZXRyeVByb2Nlc3NvcihnZW9tZXRyeSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9XG59XG4iLCJpbXBvcnQge1ZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uZU1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMFxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjb25lJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgIH07XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSkge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMucmFkaXVzID0gKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLngpIC8gMjtcbiAgICAgIHRoaXMuX3BoeXNpanMuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQge1ZlY3RvcjMsIEJ1ZmZlckdlb21ldHJ5fSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIENvbnZleE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjb252ZXgnLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICB0b3VjaGVzOiBbXSxcbiAgICAgIGxpbmVhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgICAgYW5ndWxhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgICAgZ3JvdXA6IHBhcmFtcy5ncm91cCxcbiAgICAgIG1hc2s6IHBhcmFtcy5tYXNrLFxuICAgICAgZnJpY3Rpb246IHBhcmFtcy5mcmljdGlvbixcbiAgICAgIHJlc3RpdHV0aW9uOiBwYXJhbXMucmVzdGl0dXRpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICAgIHNjYWxlOiBwYXJhbXMuc2NhbGVcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgbWVzaChtZXNoKSB7XG4gICAgICBjb25zdCBnZW9tZXRyeSA9IG1lc2guZ2VvbWV0cnk7XG5cbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBjb25zdCBpc0J1ZmZlciA9IGdlb21ldHJ5LnR5cGUgPT09ICdCdWZmZXJHZW9tZXRyeSc7XG5cbiAgICAgIGlmICghaXNCdWZmZXIpIGdlb21ldHJ5Ll9idWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpLmZyb21HZW9tZXRyeShnZW9tZXRyeSk7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBpc0J1ZmZlciA/XG4gICAgICAgIGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOlxuICAgICAgICBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy5kYXRhID0gZGF0YTtcblxuICAgICAgcmV0dXJuIG1lc2g7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIEN5bGluZGVyTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ2N5bGluZGVyJyxcbiAgICAgIHdpZHRoOiBwYXJhbXMud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhcmFtcy5oZWlnaHQsXG4gICAgICBkZXB0aDogcGFyYW1zLmRlcHRoLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHNjYWxlOiBwYXJhbXMuc2NhbGVcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIHRoaXMuX3BoeXNpanMuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIHRoaXMuX3BoeXNpanMuZGVwdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IyLCBWZWN0b3IzLCBCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBIZWlnaHRmaWVsZE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHNpemU6IG5ldyBWZWN0b3IyKDEsIDEpLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgYXV0b0FsaWduOiBmYWxzZVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdoZWlnaHRmaWVsZCcsXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgcG9pbnRzOiBwYXJhbXMucG9pbnRzLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnksIHNlbGYpIHtcbiAgICAgIGNvbnN0IGlzQnVmZmVyID0gZ2VvbWV0cnkgaW5zdGFuY2VvZiBCdWZmZXJHZW9tZXRyeTtcbiAgICAgIGNvbnN0IHZlcnRzID0gaXNCdWZmZXIgPyBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDogZ2VvbWV0cnkudmVydGljZXM7XG5cbiAgICAgIGxldCBzaXplID0gaXNCdWZmZXIgPyB2ZXJ0cy5sZW5ndGggLyAzIDogdmVydHMubGVuZ3RoO1xuXG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgY29uc3QgeGRpdiA9IHNlbGYucGFyYW1zLnNpemUueDtcbiAgICAgIGNvbnN0IHlkaXYgPSBzZWxmLnBhcmFtcy5zaXplLnk7XG5cbiAgICAgIGNvbnN0IHhzaXplID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGNvbnN0IHlzaXplID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcblxuICAgICAgdGhpcy5fcGh5c2lqcy54cHRzID0gKHR5cGVvZiB4ZGl2ID09PSAndW5kZWZpbmVkJykgPyBNYXRoLnNxcnQoc2l6ZSkgOiB4ZGl2ICsgMTtcbiAgICAgIHRoaXMuX3BoeXNpanMueXB0cyA9ICh0eXBlb2YgeWRpdiA9PT0gJ3VuZGVmaW5lZCcpID8gTWF0aC5zcXJ0KHNpemUpIDogeWRpdiArIDE7XG5cbiAgICAgIC8vIG5vdGUgLSB0aGlzIGFzc3VtZXMgb3VyIHBsYW5lIGdlb21ldHJ5IGlzIHNxdWFyZSwgdW5sZXNzIHdlIHBhc3MgaW4gc3BlY2lmaWMgeGRpdiBhbmQgeWRpdlxuICAgICAgdGhpcy5fcGh5c2lqcy5hYnNNYXhIZWlnaHQgPSBNYXRoLm1heChnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSwgTWF0aC5hYnMoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnkpKTtcblxuICAgICAgY29uc3QgcG9pbnRzID0gbmV3IEZsb2F0MzJBcnJheShzaXplKSxcbiAgICAgICAgeHB0cyA9IHRoaXMuX3BoeXNpanMueHB0cyxcbiAgICAgICAgeXB0cyA9IHRoaXMuX3BoeXNpanMueXB0cztcblxuICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICBjb25zdCB2TnVtID0gc2l6ZSAlIHhwdHMgKyAoKHlwdHMgLSBNYXRoLnJvdW5kKChzaXplIC8geHB0cykgLSAoKHNpemUgJSB4cHRzKSAvIHhwdHMpKSAtIDEpICogeXB0cyk7XG5cbiAgICAgICAgaWYgKGlzQnVmZmVyKSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtICogMyArIDFdO1xuICAgICAgICBlbHNlIHBvaW50c1tzaXplXSA9IHZlcnRzW3ZOdW1dLnk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BoeXNpanMucG9pbnRzID0gcG9pbnRzO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLnNjYWxlLm11bHRpcGx5KFxuICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh4c2l6ZSAvICh4cHRzIC0gMSksIDEsIHlzaXplIC8gKHlwdHMgLSAxKSlcbiAgICAgICk7XG5cbiAgICAgIGlmIChzZWxmLnBhcmFtcy5hdXRvQWxpZ24pIGdlb21ldHJ5LnRyYW5zbGF0ZSh4c2l6ZSAvIC0yLCAwLCB5c2l6ZSAvIC0yKTtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQge1ZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgUGxhbmVNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbWFzczogMTAsXG4gICAgICByZXN0aXR1dGlvbjogMC4zLFxuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAncGxhbmUnLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3NcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIHRoaXMuX3BoeXNpanMuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIHRoaXMuX3BoeXNpanMubm9ybWFsID0gZ2VvbWV0cnkuZmFjZXNbMF0ubm9ybWFsLmNsb25lKCk7XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgU3BoZXJlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzcGhlcmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ1NwaGVyZSgpO1xuICAgICAgZGF0YS5yYWRpdXMgPSBnZW9tZXRyeS5ib3VuZGluZ1NwaGVyZS5yYWRpdXM7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yMywgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBTb2Z0Ym9keU1vZHVsZXtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHByZXNzdXJlOiAxMDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBrbHN0OiAwLjksXG4gICAgICBrdnN0OiAwLjksXG4gICAgICBrYXN0OiAwLjksXG4gICAgICBwaXRlcmF0aW9uczogMSxcbiAgICAgIHZpdGVyYXRpb25zOiAwLFxuICAgICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgICBjaXRlcmF0aW9uczogNCxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgICByaWdpZEhhcmRuZXNzOiAxXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuX3BoeXNpanMuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QuX3BoeXNpanMuaWQ7XG5cbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdzb2Z0VHJpbWVzaCcsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHNjYWxlOiBwYXJhbXMuc2NhbGUsXG4gICAgICB0b3VjaGVzOiBbXSxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIHByZXNzdXJlOiBwYXJhbXMucHJlc3N1cmUsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBrbHN0OiBwYXJhbXMua2xzdCxcbiAgICAgIGlzU29mdGJvZHk6IHRydWUsXG4gICAgICBrYXN0OiBwYXJhbXMua2FzdCxcbiAgICAgIGt2c3Q6IHBhcmFtcy5rdnN0LFxuICAgICAgZHJhZzogcGFyYW1zLmRyYWcsXG4gICAgICBsaWZ0OiBwYXJhbXMubGlmdCxcbiAgICAgIHBpdGVyYXRpb25zOiBwYXJhbXMucGl0ZXJhdGlvbnMsXG4gICAgICB2aXRlcmF0aW9uczogcGFyYW1zLnZpdGVyYXRpb25zLFxuICAgICAgZGl0ZXJhdGlvbnM6IHBhcmFtcy5kaXRlcmF0aW9ucyxcbiAgICAgIGNpdGVyYXRpb25zOiBwYXJhbXMuY2l0ZXJhdGlvbnMsXG4gICAgICBhbmNob3JIYXJkbmVzczogcGFyYW1zLmFuY2hvckhhcmRuZXNzLFxuICAgICAgcmlnaWRIYXJkbmVzczogcGFyYW1zLnJpZ2lkSGFyZG5lc3NcbiAgICB9O1xuXG4gICAgdGhpcy5hcHBlbmRBbmNob3IgPSBzZWxmLmFwcGVuZEFuY2hvci5iaW5kKHRoaXMpO1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnksIHNlbGYpIHtcbiAgICAgIGNvbnN0IGlkeEdlb21ldHJ5ID0gZ2VvbWV0cnkgaW5zdGFuY2VvZiBCdWZmZXJHZW9tZXRyeVxuICAgICAgICA/IGdlb21ldHJ5XG4gICAgICAgIDogKCgpID0+IHtcbiAgICAgICAgICBnZW9tZXRyeS5tZXJnZVZlcnRpY2VzKCk7XG5cbiAgICAgICAgICBjb25zdCBidWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IChnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAzID4gNjU1MzUgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5KShnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgKS5jb3B5SW5kaWNlc0FycmF5KGdlb21ldHJ5LmZhY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZmVyR2VvbWV0cnk7XG4gICAgICAgIH0pKCk7XG5cbiAgICAgIGNvbnN0IGFWZXJ0aWNlcyA9IGlkeEdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgICBjb25zdCBhSW5kaWNlcyA9IGlkeEdlb21ldHJ5LmluZGV4LmFycmF5O1xuXG4gICAgICB0aGlzLl9waHlzaWpzLmFWZXJ0aWNlcyA9IGFWZXJ0aWNlcztcbiAgICAgIHRoaXMuX3BoeXNpanMuYUluZGljZXMgPSBhSW5kaWNlcztcblxuICAgICAgY29uc3QgbmR4R2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKS5mcm9tR2VvbWV0cnkoZ2VvbWV0cnkpO1xuXG4gICAgICByZXR1cm4gbmR4R2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzLCBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIENsb3RoTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zID0ge30pIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgICBrbHN0OiAwLjksXG4gICAgICBrdnN0OiAwLjksXG4gICAgICBrYXN0OiAwLjksXG4gICAgICBwaXRlcmF0aW9uczogMSxcbiAgICAgIHZpdGVyYXRpb25zOiAwLFxuICAgICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgICBjaXRlcmF0aW9uczogNCxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgICByaWdpZEhhcmRuZXNzOiAxXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuX3BoeXNpanMuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QuX3BoeXNpanMuaWQ7XG5cbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdzb2Z0Q2xvdGhNZXNoJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBpc1NvZnRib2R5OiB0cnVlLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICAgIGtsc3Q6IHBhcmFtcy5rbHN0LFxuICAgICAga2FzdDogcGFyYW1zLmthc3QsXG4gICAgICBrdnN0OiBwYXJhbXMua3ZzdCxcbiAgICAgIGRyYWc6IHBhcmFtcy5kcmFnLFxuICAgICAgbGlmdDogcGFyYW1zLmxpZnQsXG4gICAgICBwaXRlcmF0aW9uczogcGFyYW1zLnBpdGVyYXRpb25zLFxuICAgICAgdml0ZXJhdGlvbnM6IHBhcmFtcy52aXRlcmF0aW9ucyxcbiAgICAgIGRpdGVyYXRpb25zOiBwYXJhbXMuZGl0ZXJhdGlvbnMsXG4gICAgICBjaXRlcmF0aW9uczogcGFyYW1zLmNpdGVyYXRpb25zLFxuICAgICAgYW5jaG9ySGFyZG5lc3M6IHBhcmFtcy5hbmNob3JIYXJkbmVzcyxcbiAgICAgIHJpZ2lkSGFyZG5lc3M6IHBhcmFtcy5yaWdpZEhhcmRuZXNzLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZVxuICAgIH07XG5cbiAgICB0aGlzLmFwcGVuZEFuY2hvciA9IHNlbGYuYXBwZW5kQW5jaG9yLmJpbmQodGhpcyk7XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSwgc2VsZikge1xuICAgICAgY29uc3QgZ2VvbVBhcmFtcyA9IGdlb21ldHJ5LnBhcmFtZXRlcnM7XG5cbiAgICAgIGNvbnN0IGdlb20gPSBnZW9tZXRyeSBpbnN0YW5jZW9mIEJ1ZmZlckdlb21ldHJ5XG4gICAgICAgID8gZ2VvbWV0cnlcbiAgICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgZ2VvbWV0cnkubWVyZ2VWZXJ0aWNlcygpO1xuXG4gICAgICAgICAgY29uc3QgYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBjb25zdCBmYWNlcyA9IGdlb21ldHJ5LmZhY2VzLCBmYWNlc0xlbmd0aCA9IGZhY2VzLmxlbmd0aDtcbiAgICAgICAgICBjb25zdCBub3JtYWxzQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZhY2VzTGVuZ3RoICogMyk7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY2VzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGkzID0gaSAqIDM7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwgPSBmYWNlc1tpXS5ub3JtYWwgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzXSA9IG5vcm1hbC54O1xuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzICsgMV0gPSBub3JtYWwueTtcbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpMyArIDJdID0gbm9ybWFsLno7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ25vcm1hbCcsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBub3JtYWxzQXJyYXksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuc2V0SW5kZXgoXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgKGZhY2VzTGVuZ3RoICogMyA+IDY1NTM1ID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheSkoZmFjZXNMZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgKS5jb3B5SW5kaWNlc0FycmF5KGZhY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZmVyR2VvbWV0cnk7XG4gICAgICAgIH0pKCk7XG5cbiAgICAgIGNvbnN0IHZlcnRzID0gZ2VvbS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgICBpZiAoIWdlb21QYXJhbXMud2lkdGhTZWdtZW50cykgZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzID0gMTtcbiAgICAgIGlmICghZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cykgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyA9IDE7XG5cbiAgICAgIGNvbnN0IGlkeDAwID0gMDtcbiAgICAgIGNvbnN0IGlkeDAxID0gZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzO1xuICAgICAgY29uc3QgaWR4MTAgPSAoZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDEpICogKGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEpIC0gKGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEpO1xuICAgICAgY29uc3QgaWR4MTEgPSB2ZXJ0cy5sZW5ndGggLyAzIC0gMTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy5jb3JuZXJzID0gW1xuICAgICAgICB2ZXJ0c1tpZHgwMSAqIDNdLCB2ZXJ0c1tpZHgwMSAqIDMgKyAxXSwgdmVydHNbaWR4MDEgKiAzICsgMl0sIC8vICAg4pWXXG4gICAgICAgIHZlcnRzW2lkeDAwICogM10sIHZlcnRzW2lkeDAwICogMyArIDFdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAyXSwgLy8g4pWUXG4gICAgICAgIHZlcnRzW2lkeDExICogM10sIHZlcnRzW2lkeDExICogMyArIDFdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAyXSwgLy8gICAgICAg4pWdXG4gICAgICAgIHZlcnRzW2lkeDEwICogM10sIHZlcnRzW2lkeDEwICogMyArIDFdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAyXSwgLy8gICAgIOKVmlxuICAgICAgXTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy5zZWdtZW50cyA9IFtnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxLCBnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzICsgMV07XG5cbiAgICAgIHJldHVybiBnZW9tO1xuICAgIH0sXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9XG59O1xuIiwiaW1wb3J0IHtWZWN0b3IzLCBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIFJvcGVNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBrbHN0OiAwLjksXG4gICAgICBrdnN0OiAwLjksXG4gICAgICBrYXN0OiAwLjksXG4gICAgICBwaXRlcmF0aW9uczogMSxcbiAgICAgIHZpdGVyYXRpb25zOiAwLFxuICAgICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgICBjaXRlcmF0aW9uczogNCxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgICByaWdpZEhhcmRuZXNzOiAxXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuX3BoeXNpanMuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QuX3BoeXNpanMuaWQ7XG5cbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdzb2Z0Um9wZU1lc2gnLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICB0b3VjaGVzOiBbXSxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICAgIGtsc3Q6IHBhcmFtcy5rbHN0LFxuICAgICAgaXNTb2Z0Ym9keTogdHJ1ZSxcbiAgICAgIGthc3Q6IHBhcmFtcy5rYXN0LFxuICAgICAga3ZzdDogcGFyYW1zLmt2c3QsXG4gICAgICBkcmFnOiBwYXJhbXMuZHJhZyxcbiAgICAgIGxpZnQ6IHBhcmFtcy5saWZ0LFxuICAgICAgcGl0ZXJhdGlvbnM6IHBhcmFtcy5waXRlcmF0aW9ucyxcbiAgICAgIHZpdGVyYXRpb25zOiBwYXJhbXMudml0ZXJhdGlvbnMsXG4gICAgICBkaXRlcmF0aW9uczogcGFyYW1zLmRpdGVyYXRpb25zLFxuICAgICAgY2l0ZXJhdGlvbnM6IHBhcmFtcy5jaXRlcmF0aW9ucyxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiBwYXJhbXMuYW5jaG9ySGFyZG5lc3MsXG4gICAgICByaWdpZEhhcmRuZXNzOiBwYXJhbXMucmlnaWRIYXJkbmVzc1xuICAgIH07XG5cbiAgICB0aGlzLmFwcGVuZEFuY2hvciA9IHNlbGYuYXBwZW5kQW5jaG9yLmJpbmQodGhpcyk7XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSkge1xuICAgICAgaWYgKCEoZ2VvbWV0cnkgaW5zdGFuY2VvZiBCdWZmZXJHZW9tZXRyeSkpIHtcbiAgICAgICAgZ2VvbWV0cnkgPSAoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGJ1ZmYgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmYuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsZW5ndGggPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5Lmxlbmd0aCAvIDM7XG4gICAgICBjb25zdCB2ZXJ0ID0gbiA9PiBuZXcgVmVjdG9yMygpLmZyb21BcnJheShnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5LCBuKjMpO1xuXG4gICAgICBjb25zdCB2MSA9IHZlcnQoMCk7XG4gICAgICBjb25zdCB2MiA9IHZlcnQobGVuZ3RoIC0gMSk7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMuZGF0YSA9IFtcbiAgICAgICAgdjEueCwgdjEueSwgdjEueixcbiAgICAgICAgdjIueCwgdjIueSwgdjIueixcbiAgICAgICAgbGVuZ3RoXG4gICAgICBdO1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtMb29wfSBmcm9tICd3aHMnO1xuXG5pbXBvcnQge1xuICBPYmplY3QzRCxcbiAgUXVhdGVybmlvbixcbiAgVmVjdG9yMyxcbiAgRXVsZXJcbn0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBQSV8yID0gTWF0aC5QSSAvIDI7XG5cbmZ1bmN0aW9uIEZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIoY2FtZXJhLCBtZXNoLCBwYXJhbXMpIHtcbiAgY29uc3QgdmVsb2NpdHlGYWN0b3IgPSAxO1xuICBsZXQgcnVuVmVsb2NpdHkgPSAwLjI1O1xuXG4gIG1lc2guc2V0QW5ndWxhckZhY3Rvcih7eDogMCwgeTogMCwgejogMH0pO1xuICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuXG4gIC8qIEluaXQgKi9cbiAgY29uc3QgcGxheWVyID0gbWVzaCxcbiAgICBwaXRjaE9iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHBpdGNoT2JqZWN0LmFkZChjYW1lcmEubmF0aXZlKTtcblxuICBjb25zdCB5YXdPYmplY3QgPSBuZXcgT2JqZWN0M0QoKTtcblxuICB5YXdPYmplY3QucG9zaXRpb24ueSA9IHBhcmFtcy55cG9zOyAvLyBleWVzIGFyZSAyIG1ldGVycyBhYm92ZSB0aGUgZ3JvdW5kXG4gIHlhd09iamVjdC5hZGQocGl0Y2hPYmplY3QpO1xuXG4gIGNvbnN0IHF1YXQgPSBuZXcgUXVhdGVybmlvbigpO1xuXG4gIGxldCBjYW5KdW1wID0gZmFsc2UsXG4gICAgLy8gTW92ZXMuXG4gICAgbW92ZUZvcndhcmQgPSBmYWxzZSxcbiAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZSxcbiAgICBtb3ZlTGVmdCA9IGZhbHNlLFxuICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuXG4gIHBsYXllci5vbignY29sbGlzaW9uJywgKG90aGVyT2JqZWN0LCB2LCByLCBjb250YWN0Tm9ybWFsKSA9PiB7XG4gICAgaWYgKGNvbnRhY3ROb3JtYWwueSA8IDAuNSkgLy8gVXNlIGEgXCJnb29kXCIgdGhyZXNob2xkIHZhbHVlIGJldHdlZW4gMCBhbmQgMSBoZXJlIVxuICAgICAgY2FuSnVtcCA9IHRydWU7XG4gIH0pO1xuXG4gIGNvbnN0IG9uTW91c2VNb3ZlID0gZXZlbnQgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBjb25zdCBtb3ZlbWVudFggPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WCA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFggPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WCgpIDogMDtcbiAgICBjb25zdCBtb3ZlbWVudFkgPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WSA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFkgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WSgpIDogMDtcblxuICAgIHlhd09iamVjdC5yb3RhdGlvbi55IC09IG1vdmVtZW50WCAqIDAuMDAyO1xuICAgIHBpdGNoT2JqZWN0LnJvdGF0aW9uLnggLT0gbW92ZW1lbnRZICogMC4wMDI7XG5cbiAgICBwaXRjaE9iamVjdC5yb3RhdGlvbi54ID0gTWF0aC5tYXgoLVBJXzIsIE1hdGgubWluKFBJXzIsIHBpdGNoT2JqZWN0LnJvdGF0aW9uLngpKTtcbiAgfTtcblxuICBjb25zdCBvbktleURvd24gPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDMyOiAvLyBzcGFjZVxuICAgICAgICBpZiAoY2FuSnVtcCA9PT0gdHJ1ZSkgcGxheWVyLmFwcGx5Q2VudHJhbEltcHVsc2Uoe3g6IDAsIHk6IDMwMCwgejogMH0pO1xuICAgICAgICBjYW5KdW1wID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuNTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IG9uS2V5VXAgPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICBtb3ZlTGVmdCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgY2FzZSA4MzogLy8gYVxuICAgICAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNjogLy8gc2hpZnRcbiAgICAgICAgcnVuVmVsb2NpdHkgPSAwLjI1O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24sIGZhbHNlKTtcbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIG9uS2V5VXAsIGZhbHNlKTtcblxuICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgdGhpcy5nZXRPYmplY3QgPSAoKSA9PiB5YXdPYmplY3Q7XG5cbiAgdGhpcy5nZXREaXJlY3Rpb24gPSB0YXJnZXRWZWMgPT4ge1xuICAgIHRhcmdldFZlYy5zZXQoMCwgMCwgLTEpO1xuICAgIHF1YXQubXVsdGlwbHlWZWN0b3IzKHRhcmdldFZlYyk7XG4gIH07XG5cbiAgLy8gTW92ZXMgdGhlIGNhbWVyYSB0byB0aGUgUGh5c2kuanMgb2JqZWN0IHBvc2l0aW9uXG4gIC8vIGFuZCBhZGRzIHZlbG9jaXR5IHRvIHRoZSBvYmplY3QgaWYgdGhlIHJ1biBrZXkgaXMgZG93bi5cbiAgY29uc3QgaW5wdXRWZWxvY2l0eSA9IG5ldyBWZWN0b3IzKCksXG4gICAgZXVsZXIgPSBuZXcgRXVsZXIoKTtcblxuICB0aGlzLnVwZGF0ZSA9IGRlbHRhID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgZGVsdGEgPSBkZWx0YSB8fCAwLjU7XG4gICAgZGVsdGEgPSBNYXRoLm1pbihkZWx0YSwgMC41LCBkZWx0YSk7XG5cbiAgICBpbnB1dFZlbG9jaXR5LnNldCgwLCAwLCAwKTtcblxuICAgIGNvbnN0IHNwZWVkID0gdmVsb2NpdHlGYWN0b3IgKiBkZWx0YSAqIHBhcmFtcy5zcGVlZCAqIHJ1blZlbG9jaXR5O1xuXG4gICAgaWYgKG1vdmVGb3J3YXJkKSBpbnB1dFZlbG9jaXR5LnogPSAtc3BlZWQ7XG4gICAgaWYgKG1vdmVCYWNrd2FyZCkgaW5wdXRWZWxvY2l0eS56ID0gc3BlZWQ7XG4gICAgaWYgKG1vdmVMZWZ0KSBpbnB1dFZlbG9jaXR5LnggPSAtc3BlZWQ7XG4gICAgaWYgKG1vdmVSaWdodCkgaW5wdXRWZWxvY2l0eS54ID0gc3BlZWQ7XG5cbiAgICAvLyBDb252ZXJ0IHZlbG9jaXR5IHRvIHdvcmxkIGNvb3JkaW5hdGVzXG4gICAgZXVsZXIueCA9IHBpdGNoT2JqZWN0LnJvdGF0aW9uLng7XG4gICAgZXVsZXIueSA9IHlhd09iamVjdC5yb3RhdGlvbi55O1xuICAgIGV1bGVyLm9yZGVyID0gJ1hZWic7XG5cbiAgICBxdWF0LnNldEZyb21FdWxlcihldWxlcik7XG5cbiAgICBpbnB1dFZlbG9jaXR5LmFwcGx5UXVhdGVybmlvbihxdWF0KTtcblxuICAgIHBsYXllci5hcHBseUNlbnRyYWxJbXB1bHNlKHt4OiBpbnB1dFZlbG9jaXR5LngsIHk6IDAsIHo6IGlucHV0VmVsb2NpdHkuen0pO1xuICAgIHBsYXllci5zZXRBbmd1bGFyVmVsb2NpdHkoe3g6IGlucHV0VmVsb2NpdHkueiwgeTogMCwgejogLWlucHV0VmVsb2NpdHkueH0pO1xuICAgIHBsYXllci5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIH07XG5cbiAgcGxheWVyLm9uKCdwaHlzaWNzOmFkZGVkJywgKCkgPT4ge1xuICAgIHBsYXllci5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuYWRkRXZlbnRMaXN0ZW5lcigndXBkYXRlJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgIHlhd09iamVjdC5wb3NpdGlvbi5jb3B5KHBsYXllci5wb3NpdGlvbik7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgRmlyc3RQZXJzb25Nb2R1bGUge1xuICBzdGF0aWMgZGVmYXVsdHMgPSB7XG4gICAgYmxvY2s6IG51bGwsXG4gICAgc3BlZWQ6IDEsXG4gICAgeXBvczogMVxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKG9iamVjdCwgcGFyYW1zID0ge30pIHtcbiAgICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcblxuICAgIGlmICghdGhpcy5wYXJhbXMuYmxvY2spIHtcbiAgICAgIHRoaXMucGFyYW1zLmJsb2NrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jsb2NrZXInKTtcbiAgICB9XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICB0aGlzLmNvbnRyb2xzID0gbmV3IEZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIobWFuYWdlci5nZXQoJ2NhbWVyYScpLCB0aGlzLm9iamVjdCwgdGhpcy5wYXJhbXMpO1xuXG4gICAgaWYgKCdwb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnbW96UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudFxuICAgICAgfHwgJ3dlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuXG4gICAgICBjb25zdCBwb2ludGVybG9ja2NoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKGRvY3VtZW50LnBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgIHx8IGRvY3VtZW50Lm1velBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgIHx8IGRvY3VtZW50LndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5wYXJhbXMuYmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnRyb2xzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuXG4gICAgICBjb25zdCBwb2ludGVybG9ja2Vycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1BvaW50ZXIgbG9jayBlcnJvci4nKTtcbiAgICAgIH07XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcblxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jayA9IGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RQb2ludGVyTG9jaztcblxuICAgICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuID0gZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxzY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbjtcblxuICAgICAgICBpZiAoL0ZpcmVmb3gvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgY29uc3QgZnVsbHNjcmVlbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICB8fCBkb2N1bWVudC5tb3pGdWxsc2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICB8fCBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSk7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcblxuICAgICAgICAgICAgICBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSwgZmFsc2UpO1xuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgICAgIH0gZWxzZSBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jaygpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGNvbnNvbGUud2FybignWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdGhlIFBvaW50ZXJMb2NrIFdIUy5BUEkuJyk7XG5cbiAgICBtYW5hZ2VyLmdldCgnc2NlbmUnKS5hZGQodGhpcy5jb250cm9scy5nZXRPYmplY3QoKSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHVwZGF0ZVByb2Nlc3NvciA9IGMgPT4ge1xuICAgICAgc2VsZi5jb250cm9scy51cGRhdGUoYy5nZXREZWx0YSgpKTtcbiAgICB9O1xuXG4gICAgc2VsZi51cGRhdGVMb29wID0gbmV3IExvb3AodXBkYXRlUHJvY2Vzc29yKS5zdGFydCh0aGlzKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIk1FU1NBR0VfVFlQRVMiLCJSRVBPUlRfSVRFTVNJWkUiLCJDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUiLCJWRUhJQ0xFUkVQT1JUX0lURU1TSVpFIiwiQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSIsInRlbXAxVmVjdG9yMyIsIlZlY3RvcjMiLCJ0ZW1wMlZlY3RvcjMiLCJ0ZW1wMU1hdHJpeDQiLCJNYXRyaXg0IiwidGVtcDFRdWF0IiwiUXVhdGVybmlvbiIsImdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24iLCJ4IiwieSIsInoiLCJ3IiwiTWF0aCIsImF0YW4yIiwiYXNpbiIsImdldFF1YXRlcnRpb25Gcm9tRXVsZXIiLCJjMSIsImNvcyIsInMxIiwic2luIiwiYzIiLCJzMiIsImMzIiwiczMiLCJjMWMyIiwiczFzMiIsImNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QiLCJwb3NpdGlvbiIsIm9iamVjdCIsImlkZW50aXR5IiwibWFrZVJvdGF0aW9uRnJvbVF1YXRlcm5pb24iLCJxdWF0ZXJuaW9uIiwiZ2V0SW52ZXJzZSIsImNvcHkiLCJzdWIiLCJhcHBseU1hdHJpeDQiLCJhZGRPYmplY3RDaGlsZHJlbiIsInBhcmVudCIsImkiLCJjaGlsZHJlbiIsImxlbmd0aCIsImNoaWxkIiwiX3BoeXNpanMiLCJjb21wb25lbnQiLCJ1cGRhdGVNYXRyaXgiLCJ1cGRhdGVNYXRyaXhXb3JsZCIsInNldEZyb21NYXRyaXhQb3NpdGlvbiIsIm1hdHJpeFdvcmxkIiwic2V0RnJvbVJvdGF0aW9uTWF0cml4IiwicG9zaXRpb25fb2Zmc2V0Iiwicm90YXRpb24iLCJwdXNoIiwiRXZlbnRhYmxlIiwiX2V2ZW50TGlzdGVuZXJzIiwiZXZlbnRfbmFtZSIsImNhbGxiYWNrIiwiaGFzT3duUHJvcGVydHkiLCJpbmRleCIsImluZGV4T2YiLCJzcGxpY2UiLCJwYXJhbWV0ZXJzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJvYmoiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImRpc3BhdGNoRXZlbnQiLCJDb25lVHdpc3RDb25zdHJhaW50Iiwib2JqYSIsIm9iamIiLCJvYmplY3RhIiwib2JqZWN0YiIsInVuZGVmaW5lZCIsImNvbnNvbGUiLCJlcnJvciIsInR5cGUiLCJhcHBsaWVkSW1wdWxzZSIsIndvcmxkTW9kdWxlIiwiaWQiLCJwb3NpdGlvbmEiLCJjbG9uZSIsInBvc2l0aW9uYiIsImF4aXNhIiwiYXhpc2IiLCJleGVjdXRlIiwiY29uc3RyYWludCIsIm1heF9pbXB1bHNlIiwidGFyZ2V0IiwiVEhSRUUiLCJzZXRGcm9tRXVsZXIiLCJFdWxlciIsIkhpbmdlQ29uc3RyYWludCIsImF4aXMiLCJsb3ciLCJoaWdoIiwiYmlhc19mYWN0b3IiLCJyZWxheGF0aW9uX2ZhY3RvciIsInZlbG9jaXR5IiwiYWNjZWxlcmF0aW9uIiwiUG9pbnRDb25zdHJhaW50IiwiU2xpZGVyQ29uc3RyYWludCIsImxpbl9sb3dlciIsImxpbl91cHBlciIsImFuZ19sb3dlciIsImFuZ191cHBlciIsImxpbmVhciIsImFuZ3VsYXIiLCJzY2VuZSIsIkRPRkNvbnN0cmFpbnQiLCJsaW1pdCIsIndoaWNoIiwibG93X2FuZ2xlIiwiaGlnaF9hbmdsZSIsIm1heF9mb3JjZSIsIlZlaGljbGUiLCJtZXNoIiwidHVuaW5nIiwiVmVoaWNsZVR1bmluZyIsIndoZWVscyIsImdldE9iamVjdElkIiwic3VzcGVuc2lvbl9zdGlmZm5lc3MiLCJzdXNwZW5zaW9uX2NvbXByZXNzaW9uIiwic3VzcGVuc2lvbl9kYW1waW5nIiwibWF4X3N1c3BlbnNpb25fdHJhdmVsIiwiZnJpY3Rpb25fc2xpcCIsIm1heF9zdXNwZW5zaW9uX2ZvcmNlIiwid2hlZWxfZ2VvbWV0cnkiLCJ3aGVlbF9tYXRlcmlhbCIsImNvbm5lY3Rpb25fcG9pbnQiLCJ3aGVlbF9kaXJlY3Rpb24iLCJ3aGVlbF9heGxlIiwic3VzcGVuc2lvbl9yZXN0X2xlbmd0aCIsIndoZWVsX3JhZGl1cyIsImlzX2Zyb250X3doZWVsIiwid2hlZWwiLCJNZXNoIiwiY2FzdFNoYWRvdyIsInJlY2VpdmVTaGFkb3ciLCJtdWx0aXBseVNjYWxhciIsImFkZCIsIndvcmxkIiwiYW1vdW50Iiwic3RlZXJpbmciLCJicmFrZSIsImZvcmNlIiwiVEFSR0VUIiwiU3ltYm9sIiwiU0NSSVBUX1RZUEUiLCJCbG9iQnVpbGRlciIsIndpbmRvdyIsIldlYktpdEJsb2JCdWlsZGVyIiwiTW96QmxvYkJ1aWxkZXIiLCJNU0Jsb2JCdWlsZGVyIiwiVVJMIiwid2Via2l0VVJMIiwiV29ya2VyIiwic2hpbVdvcmtlciIsImZpbGVuYW1lIiwiZm4iLCJTaGltV29ya2VyIiwiZm9yY2VGYWxsYmFjayIsIm8iLCJzb3VyY2UiLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJzbGljZSIsIm9ialVSTCIsImNyZWF0ZVNvdXJjZU9iamVjdCIsInJldm9rZU9iamVjdFVSTCIsInNlbGZTaGltIiwibSIsIm9ubWVzc2FnZSIsImRhdGEiLCJwb3N0TWVzc2FnZSIsImlzVGhpc1RocmVhZCIsInRlc3RXb3JrZXIiLCJ0ZXN0QXJyYXkiLCJVaW50OEFycmF5IiwidGVzdCIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIkVycm9yIiwiYnVmZmVyIiwiZSIsInRlcm1pbmF0ZSIsInN0ciIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJibG9iIiwiYXBwZW5kIiwiZ2V0QmxvYiIsImRvY3VtZW50Iiwic2VsZiIsInRyYW5zZmVyYWJsZU1lc3NhZ2UiLCJ3ZWJraXRQb3N0TWVzc2FnZSIsIl9vYmplY3QiLCJfdmVjdG9yIiwiX3RyYW5zZm9ybSIsIl90cmFuc2Zvcm1fcG9zIiwiX3NvZnRib2R5X2VuYWJsZWQiLCJsYXN0X3NpbXVsYXRpb25fZHVyYXRpb24iLCJfbnVtX29iamVjdHMiLCJfbnVtX3JpZ2lkYm9keV9vYmplY3RzIiwiX251bV9zb2Z0Ym9keV9vYmplY3RzIiwiX251bV93aGVlbHMiLCJfbnVtX2NvbnN0cmFpbnRzIiwiX3NvZnRib2R5X3JlcG9ydF9zaXplIiwiX3ZlYzNfMSIsIl92ZWMzXzIiLCJfdmVjM18zIiwiX3F1YXQiLCJwdWJsaWNfZnVuY3Rpb25zIiwiX29iamVjdHMiLCJfdmVoaWNsZXMiLCJfY29uc3RyYWludHMiLCJfb2JqZWN0c19hbW1vIiwiX29iamVjdF9zaGFwZXMiLCJSRVBPUlRfQ0hVTktTSVpFIiwic29mdHJlcG9ydCIsImNvbGxpc2lvbnJlcG9ydCIsInZlaGljbGVyZXBvcnQiLCJjb25zdHJhaW50cmVwb3J0IiwiV09STERSRVBPUlRfSVRFTVNJWkUiLCJhYiIsIkFycmF5QnVmZmVyIiwiU1VQUE9SVF9UUkFOU0ZFUkFCTEUiLCJieXRlTGVuZ3RoIiwiZ2V0U2hhcGVGcm9tQ2FjaGUiLCJjYWNoZV9rZXkiLCJzZXRTaGFwZUNhY2hlIiwic2hhcGUiLCJjcmVhdGVTaGFwZSIsImRlc2NyaXB0aW9uIiwic2V0SWRlbnRpdHkiLCJBbW1vIiwiYnRDb21wb3VuZFNoYXBlIiwibm9ybWFsIiwic2V0WCIsInNldFkiLCJzZXRaIiwiYnRTdGF0aWNQbGFuZVNoYXBlIiwid2lkdGgiLCJoZWlnaHQiLCJkZXB0aCIsImJ0Qm94U2hhcGUiLCJyYWRpdXMiLCJidFNwaGVyZVNoYXBlIiwiYnRDeWxpbmRlclNoYXBlIiwiYnRDYXBzdWxlU2hhcGUiLCJidENvbmVTaGFwZSIsInRyaWFuZ2xlX21lc2giLCJidFRyaWFuZ2xlTWVzaCIsImFkZFRyaWFuZ2xlIiwiYnRCdmhUcmlhbmdsZU1lc2hTaGFwZSIsImJ0Q29udmV4SHVsbFNoYXBlIiwiYWRkUG9pbnQiLCJ4cHRzIiwieXB0cyIsInBvaW50cyIsInB0ciIsIl9tYWxsb2MiLCJwIiwicDIiLCJqIiwiSEVBUEYzMiIsImJ0SGVpZ2h0ZmllbGRUZXJyYWluU2hhcGUiLCJhYnNNYXhIZWlnaHQiLCJjcmVhdGVTb2Z0Qm9keSIsImJvZHkiLCJzb2Z0Qm9keUhlbHBlcnMiLCJidFNvZnRCb2R5SGVscGVycyIsImFWZXJ0aWNlcyIsIkNyZWF0ZUZyb21UcmlNZXNoIiwiZ2V0V29ybGRJbmZvIiwiYUluZGljZXMiLCJjciIsImNvcm5lcnMiLCJDcmVhdGVQYXRjaCIsImJ0VmVjdG9yMyIsInNlZ21lbnRzIiwiQ3JlYXRlUm9wZSIsImluaXQiLCJwYXJhbXMiLCJ3YXNtQnVmZmVyIiwiYW1tbyIsImxvYWRBbW1vRnJvbUJpbmFyeSIsImNtZCIsIm1ha2VXb3JsZCIsImJ0VHJhbnNmb3JtIiwiYnRRdWF0ZXJuaW9uIiwicmVwb3J0c2l6ZSIsIkZsb2F0MzJBcnJheSIsIldPUkxEUkVQT1JUIiwiQ09MTElTSU9OUkVQT1JUIiwiVkVISUNMRVJFUE9SVCIsIkNPTlNUUkFJTlRSRVBPUlQiLCJjb2xsaXNpb25Db25maWd1cmF0aW9uIiwic29mdGJvZHkiLCJidFNvZnRCb2R5UmlnaWRCb2R5Q29sbGlzaW9uQ29uZmlndXJhdGlvbiIsImJ0RGVmYXVsdENvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJkaXNwYXRjaGVyIiwiYnRDb2xsaXNpb25EaXNwYXRjaGVyIiwic29sdmVyIiwiYnRTZXF1ZW50aWFsSW1wdWxzZUNvbnN0cmFpbnRTb2x2ZXIiLCJicm9hZHBoYXNlIiwiYWFiYm1pbiIsImFhYmJtYXgiLCJidEF4aXNTd2VlcDMiLCJidERidnRCcm9hZHBoYXNlIiwiYnRTb2Z0UmlnaWREeW5hbWljc1dvcmxkIiwiYnREZWZhdWx0U29mdEJvZHlTb2x2ZXIiLCJidERpc2NyZXRlRHluYW1pY3NXb3JsZCIsImZpeGVkVGltZVN0ZXAiLCJzZXRGaXhlZFRpbWVTdGVwIiwic2V0R3Jhdml0eSIsImFwcGVuZEFuY2hvciIsImxvZyIsIm5vZGUiLCJvYmoyIiwiY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyIsImluZmx1ZW5jZSIsImFkZE9iamVjdCIsIm1vdGlvblN0YXRlIiwic2JDb25maWciLCJnZXRfbV9jZmciLCJ2aXRlcmF0aW9ucyIsInNldF92aXRlcmF0aW9ucyIsInBpdGVyYXRpb25zIiwic2V0X3BpdGVyYXRpb25zIiwiZGl0ZXJhdGlvbnMiLCJzZXRfZGl0ZXJhdGlvbnMiLCJjaXRlcmF0aW9ucyIsInNldF9jaXRlcmF0aW9ucyIsInNldF9jb2xsaXNpb25zIiwic2V0X2tERiIsImZyaWN0aW9uIiwic2V0X2tEUCIsImRhbXBpbmciLCJwcmVzc3VyZSIsInNldF9rUFIiLCJkcmFnIiwic2V0X2tERyIsImxpZnQiLCJzZXRfa0xGIiwiYW5jaG9ySGFyZG5lc3MiLCJzZXRfa0FIUiIsInJpZ2lkSGFyZG5lc3MiLCJzZXRfa0NIUiIsImtsc3QiLCJnZXRfbV9tYXRlcmlhbHMiLCJhdCIsInNldF9tX2tMU1QiLCJrYXN0Iiwic2V0X21fa0FTVCIsImt2c3QiLCJzZXRfbV9rVlNUIiwiY2FzdE9iamVjdCIsImJ0Q29sbGlzaW9uT2JqZWN0IiwiZ2V0Q29sbGlzaW9uU2hhcGUiLCJzZXRNYXJnaW4iLCJtYXJnaW4iLCJzZXRBY3RpdmF0aW9uU3RhdGUiLCJzdGF0ZSIsInJvcGUiLCJjbG90aCIsInNldE9yaWdpbiIsInNldFciLCJzZXRSb3RhdGlvbiIsInRyYW5zZm9ybSIsInNjYWxlIiwic2V0VG90YWxNYXNzIiwibWFzcyIsImFkZFNvZnRCb2R5IiwiZ2V0X21fZmFjZXMiLCJzaXplIiwiZ2V0X21fbm9kZXMiLCJjb21wb3VuZF9zaGFwZSIsImFkZENoaWxkU2hhcGUiLCJfY2hpbGQiLCJ0cmFucyIsImRlc3Ryb3kiLCJzZXRMb2NhbFNjYWxpbmciLCJjYWxjdWxhdGVMb2NhbEluZXJ0aWEiLCJidERlZmF1bHRNb3Rpb25TdGF0ZSIsInJiSW5mbyIsImJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyIsInNldF9tX2ZyaWN0aW9uIiwic2V0X21fcmVzdGl0dXRpb24iLCJyZXN0aXR1dGlvbiIsInNldF9tX2xpbmVhckRhbXBpbmciLCJzZXRfbV9hbmd1bGFyRGFtcGluZyIsImJ0UmlnaWRCb2R5IiwiY29sbGlzaW9uX2ZsYWdzIiwic2V0Q29sbGlzaW9uRmxhZ3MiLCJncm91cCIsIm1hc2siLCJhZGRSaWdpZEJvZHkiLCJhY3RpdmF0ZSIsImEiLCJhZGRWZWhpY2xlIiwidmVoaWNsZV90dW5pbmciLCJidFZlaGljbGVUdW5pbmciLCJzZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzIiwic2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uIiwic2V0X21fc3VzcGVuc2lvbkRhbXBpbmciLCJzZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20iLCJzZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UiLCJ2ZWhpY2xlIiwiYnRSYXljYXN0VmVoaWNsZSIsInJpZ2lkQm9keSIsImJ0RGVmYXVsdFZlaGljbGVSYXljYXN0ZXIiLCJzZXRDb29yZGluYXRlU3lzdGVtIiwicmVtb3ZlVmVoaWNsZSIsImFkZFdoZWVsIiwic2V0U3RlZXJpbmciLCJkZXRhaWxzIiwic2V0U3RlZXJpbmdWYWx1ZSIsInNldEJyYWtlIiwiYXBwbHlFbmdpbmVGb3JjZSIsInJlbW92ZU9iamVjdCIsInJlbW92ZVNvZnRCb2R5IiwicmVtb3ZlUmlnaWRCb2R5IiwiX21vdGlvbl9zdGF0ZXMiLCJfY29tcG91bmRfc2hhcGVzIiwiX25vbmNhY2hlZF9zaGFwZXMiLCJ1cGRhdGVUcmFuc2Zvcm0iLCJnZXRNb3Rpb25TdGF0ZSIsImdldFdvcmxkVHJhbnNmb3JtIiwicG9zIiwicXVhdCIsInNldFdvcmxkVHJhbnNmb3JtIiwidXBkYXRlTWFzcyIsInNldE1hc3NQcm9wcyIsImFwcGx5Q2VudHJhbEltcHVsc2UiLCJhcHBseUltcHVsc2UiLCJpbXB1bHNlX3giLCJpbXB1bHNlX3kiLCJpbXB1bHNlX3oiLCJhcHBseVRvcnF1ZSIsInRvcnF1ZV94IiwidG9ycXVlX3kiLCJ0b3JxdWVfeiIsImFwcGx5Q2VudHJhbEZvcmNlIiwiYXBwbHlGb3JjZSIsImZvcmNlX3giLCJmb3JjZV95IiwiZm9yY2VfeiIsIm9uU2ltdWxhdGlvblJlc3VtZSIsIkRhdGUiLCJub3ciLCJzZXRBbmd1bGFyVmVsb2NpdHkiLCJzZXRMaW5lYXJWZWxvY2l0eSIsInNldEFuZ3VsYXJGYWN0b3IiLCJzZXRMaW5lYXJGYWN0b3IiLCJzZXREYW1waW5nIiwic2V0Q2NkTW90aW9uVGhyZXNob2xkIiwidGhyZXNob2xkIiwic2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMiLCJhZGRDb25zdHJhaW50IiwiYnRQb2ludDJQb2ludENvbnN0cmFpbnQiLCJidEhpbmdlQ29uc3RyYWludCIsInRyYW5zZm9ybWIiLCJ0cmFuc2Zvcm1hIiwiZ2V0Um90YXRpb24iLCJzZXRFdWxlciIsImJ0U2xpZGVyQ29uc3RyYWludCIsInRhIiwidGIiLCJzZXRFdWxlclpZWCIsImJ0Q29uZVR3aXN0Q29uc3RyYWludCIsInNldExpbWl0IiwiUEkiLCJidEdlbmVyaWM2RG9mQ29uc3RyYWludCIsImIiLCJlbmFibGVGZWVkYmFjayIsInJlbW92ZUNvbnN0cmFpbnQiLCJjb25zdHJhaW50X3NldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCIsInVuZGVmaW5kIiwic2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwic2ltdWxhdGUiLCJ0aW1lU3RlcCIsIm1heFN1YlN0ZXBzIiwiY2VpbCIsInN0ZXBTaW11bGF0aW9uIiwicmVwb3J0VmVoaWNsZXMiLCJyZXBvcnRDb25zdHJhaW50cyIsInJlcG9ydFdvcmxkX3NvZnRib2RpZXMiLCJoaW5nZV9zZXRMaW1pdHMiLCJoaW5nZV9lbmFibGVBbmd1bGFyTW90b3IiLCJlbmFibGVBbmd1bGFyTW90b3IiLCJoaW5nZV9kaXNhYmxlTW90b3IiLCJlbmFibGVNb3RvciIsInNsaWRlcl9zZXRMaW1pdHMiLCJzZXRMb3dlckxpbkxpbWl0Iiwic2V0VXBwZXJMaW5MaW1pdCIsInNldExvd2VyQW5nTGltaXQiLCJzZXRVcHBlckFuZ0xpbWl0Iiwic2xpZGVyX3NldFJlc3RpdHV0aW9uIiwic2V0U29mdG5lc3NMaW1MaW4iLCJzZXRTb2Z0bmVzc0xpbUFuZyIsInNsaWRlcl9lbmFibGVMaW5lYXJNb3RvciIsInNldFRhcmdldExpbk1vdG9yVmVsb2NpdHkiLCJzZXRNYXhMaW5Nb3RvckZvcmNlIiwic2V0UG93ZXJlZExpbk1vdG9yIiwic2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvciIsInNsaWRlcl9lbmFibGVBbmd1bGFyTW90b3IiLCJzZXRUYXJnZXRBbmdNb3RvclZlbG9jaXR5Iiwic2V0TWF4QW5nTW90b3JGb3JjZSIsInNldFBvd2VyZWRBbmdNb3RvciIsInNsaWRlcl9kaXNhYmxlQW5ndWxhck1vdG9yIiwiY29uZXR3aXN0X3NldExpbWl0IiwiY29uZXR3aXN0X2VuYWJsZU1vdG9yIiwiY29uZXR3aXN0X3NldE1heE1vdG9ySW1wdWxzZSIsInNldE1heE1vdG9ySW1wdWxzZSIsImNvbmV0d2lzdF9zZXRNb3RvclRhcmdldCIsInNldE1vdG9yVGFyZ2V0IiwiY29uZXR3aXN0X2Rpc2FibGVNb3RvciIsImRvZl9zZXRMaW5lYXJMb3dlckxpbWl0Iiwic2V0TGluZWFyTG93ZXJMaW1pdCIsImRvZl9zZXRMaW5lYXJVcHBlckxpbWl0Iiwic2V0TGluZWFyVXBwZXJMaW1pdCIsImRvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCIsInNldEFuZ3VsYXJMb3dlckxpbWl0IiwiZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0Iiwic2V0QW5ndWxhclVwcGVyTGltaXQiLCJkb2ZfZW5hYmxlQW5ndWxhck1vdG9yIiwibW90b3IiLCJnZXRSb3RhdGlvbmFsTGltaXRNb3RvciIsInNldF9tX2VuYWJsZU1vdG9yIiwiZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvciIsInNldF9tX2xvTGltaXQiLCJzZXRfbV9oaUxpbWl0Iiwic2V0X21fdGFyZ2V0VmVsb2NpdHkiLCJzZXRfbV9tYXhNb3RvckZvcmNlIiwiZG9mX2Rpc2FibGVBbmd1bGFyTW90b3IiLCJyZXBvcnRXb3JsZCIsIndvcmxkcmVwb3J0IiwiZ2V0Q2VudGVyT2ZNYXNzVHJhbnNmb3JtIiwib3JpZ2luIiwiZ2V0T3JpZ2luIiwib2Zmc2V0IiwiZ2V0TGluZWFyVmVsb2NpdHkiLCJnZXRBbmd1bGFyVmVsb2NpdHkiLCJTT0ZUUkVQT1JUIiwib2Zmc2V0VmVydCIsIm5vZGVzIiwidmVydCIsImdldF9tX3giLCJvZmYiLCJnZXRfbV9uIiwiZmFjZXMiLCJmYWNlIiwibm9kZTEiLCJub2RlMiIsIm5vZGUzIiwidmVydDEiLCJ2ZXJ0MiIsInZlcnQzIiwibm9ybWFsMSIsIm5vcm1hbDIiLCJub3JtYWwzIiwicmVwb3J0Q29sbGlzaW9ucyIsImRwIiwiZ2V0RGlzcGF0Y2hlciIsIm51bSIsImdldE51bU1hbmlmb2xkcyIsIm1hbmlmb2xkIiwiZ2V0TWFuaWZvbGRCeUluZGV4SW50ZXJuYWwiLCJudW1fY29udGFjdHMiLCJnZXROdW1Db250YWN0cyIsInB0IiwiZ2V0Q29udGFjdFBvaW50IiwiZ2V0Qm9keTAiLCJnZXRCb2R5MSIsImdldF9tX25vcm1hbFdvcmxkT25CIiwiZ2V0TnVtV2hlZWxzIiwiZ2V0V2hlZWxJbmZvIiwiZ2V0X21fd29ybGRUcmFuc2Zvcm0iLCJsZW5naHQiLCJvZmZzZXRfYm9keSIsImdldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCIsImV2ZW50IiwiV29ybGRNb2R1bGUiLCJicmlkZ2UiLCJ1c2UiLCJkZWZlciIsIm9uQWRkQ2FsbGJhY2siLCJiaW5kIiwib25SZW1vdmVDYWxsYmFjayIsIk9iamVjdCIsImFzc2lnbiIsInN0YXJ0IiwicGVyZm9ybWFuY2UiLCJ3b3JrZXIiLCJQaHlzaWNzV29ya2VyIiwiaXNMb2FkZWQiLCJsb2FkZXIiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIndhc20iLCJ0aGVuIiwicmVzcG9uc2UiLCJhcnJheUJ1ZmZlciIsIl9tYXRlcmlhbHNfcmVmX2NvdW50cyIsIl9pc19zaW11bGF0aW5nIiwiX2lkIiwiX3RlbXAiLCJ1cGRhdGVTY2VuZSIsInVwZGF0ZVNvZnRib2RpZXMiLCJ1cGRhdGVDb2xsaXNpb25zIiwidXBkYXRlVmVoaWNsZXMiLCJ1cGRhdGVDb25zdHJhaW50cyIsImRlYnVnIiwiZGlyIiwiaW5mbyIsIl9fZGlydHlQb3NpdGlvbiIsInNldCIsIl9fZGlydHlSb3RhdGlvbiIsImxpbmVhclZlbG9jaXR5IiwiYW5ndWxhclZlbG9jaXR5IiwiYXR0cmlidXRlcyIsImdlb21ldHJ5Iiwidm9sdW1lUG9zaXRpb25zIiwiYXJyYXkiLCJpc1NvZnRCb2R5UmVzZXQiLCJ2b2x1bWVOb3JtYWxzIiwib2ZmcyIsIngxIiwieTEiLCJ6MSIsIm54MSIsIm55MSIsIm56MSIsIngyIiwieTIiLCJ6MiIsIm54MiIsIm55MiIsIm56MiIsIngzIiwieTMiLCJ6MyIsIm54MyIsIm55MyIsIm56MyIsImk5IiwibmVlZHNVcGRhdGUiLCJueCIsIm55IiwibnoiLCJleHRyYWN0Um90YXRpb24iLCJtYXRyaXgiLCJhZGRWZWN0b3JzIiwiY29sbGlzaW9ucyIsIm5vcm1hbF9vZmZzZXRzIiwib2JqZWN0MiIsImlkMSIsInRvdWNoZXMiLCJpZDIiLCJjb21wb25lbnQyIiwiZGF0YTIiLCJ2ZWwiLCJ2ZWwyIiwic3ViVmVjdG9ycyIsInRlbXAxIiwidGVtcDIiLCJub3JtYWxfb2Zmc2V0IiwiZW1pdCIsInNob3dfbWFya2VyIiwiZ2V0RGVmaW5pdGlvbiIsIm1hcmtlciIsIlNwaGVyZUdlb21ldHJ5IiwiTWVzaE5vcm1hbE1hdGVyaWFsIiwiQm94R2VvbWV0cnkiLCJuYXRpdmUiLCJtYW5hZ2VyIiwibWF0ZXJpYWwiLCJtYXRlcmlhbElkIiwicmVtb3ZlIiwicG9wIiwiZnVuYyIsImFyZ3MiLCJncmF2aXR5IiwiX3N0YXRzIiwiYmVnaW4iLCJvYmplY3RfaWQiLCJ1cGRhdGUiLCJpc1NvZnRib2R5IiwiZW5kIiwic2ltdWxhdGVMb29wIiwiTG9vcCIsImNsb2NrIiwiZ2V0RGVsdGEiLCJwcm9wZXJ0aWVzIiwiX25hdGl2ZSIsInZlY3RvcjMiLCJzY29wZSIsImRlZmluZVByb3BlcnRpZXMiLCJfeCIsIl95IiwiX3oiLCJfX2Nfcm90Iiwib25DaGFuZ2UiLCJldWxlciIsInJvdCIsIndyYXBQaHlzaWNzUHJvdG90eXBlIiwia2V5IiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJvbkNvcHkiLCJvbldyYXAiLCJBUEkiLCJmYWN0b3IiLCJkZWZhdWx0cyIsImRlZmluZSIsImhhcyIsIm1vZHVsZSIsInJpZ2lkYm9keSIsIkJveE1vZHVsZSIsIlBoeXNpY3NNb2R1bGUiLCJ1cGRhdGVEYXRhIiwiYm91bmRpbmdCb3giLCJjb21wdXRlQm91bmRpbmdCb3giLCJtYXgiLCJtaW4iLCJDb21wb3VuZE1vZHVsZSIsIkNhcHN1bGVNb2R1bGUiLCJDb25jYXZlTW9kdWxlIiwicGF0aCIsIndhaXQiLCJnZW9tZXRyeUxvYWRlciIsImdlb21ldHJ5UHJvY2Vzc29yIiwiZ2VvbSIsIkpTT05Mb2FkZXIiLCJsb2FkIiwiaXNCdWZmZXIiLCJ2ZXJ0aWNlcyIsInZBIiwidkIiLCJ2QyIsImMiLCJDb25lTW9kdWxlIiwiQ29udmV4TW9kdWxlIiwiX2J1ZmZlckdlb21ldHJ5IiwiQnVmZmVyR2VvbWV0cnkiLCJmcm9tR2VvbWV0cnkiLCJDeWxpbmRlck1vZHVsZSIsIkhlaWdodGZpZWxkTW9kdWxlIiwidmVydHMiLCJ4ZGl2IiwieWRpdiIsInhzaXplIiwieXNpemUiLCJzcXJ0IiwiYWJzIiwidk51bSIsInJvdW5kIiwibXVsdGlwbHkiLCJhdXRvQWxpZ24iLCJ0cmFuc2xhdGUiLCJWZWN0b3IyIiwiUGxhbmVNb2R1bGUiLCJTcGhlcmVNb2R1bGUiLCJib3VuZGluZ1NwaGVyZSIsImNvbXB1dGVCb3VuZGluZ1NwaGVyZSIsIlNvZnRib2R5TW9kdWxlIiwiaWR4R2VvbWV0cnkiLCJtZXJnZVZlcnRpY2VzIiwiYnVmZmVyR2VvbWV0cnkiLCJhZGRBdHRyaWJ1dGUiLCJCdWZmZXJBdHRyaWJ1dGUiLCJjb3B5VmVjdG9yM3NBcnJheSIsInNldEluZGV4IiwiVWludDMyQXJyYXkiLCJVaW50MTZBcnJheSIsImNvcHlJbmRpY2VzQXJyYXkiLCJuZHhHZW9tZXRyeSIsIm8xIiwibzIiLCJDbG90aE1vZHVsZSIsImdlb21QYXJhbXMiLCJmYWNlc0xlbmd0aCIsIm5vcm1hbHNBcnJheSIsImkzIiwid2lkdGhTZWdtZW50cyIsImhlaWdodFNlZ21lbnRzIiwiaWR4MDAiLCJpZHgwMSIsImlkeDEwIiwiaWR4MTEiLCJSb3BlTW9kdWxlIiwiYnVmZiIsImZyb21BcnJheSIsIm4iLCJ2MSIsInYyIiwiUElfMiIsIkZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIiLCJjYW1lcmEiLCJ2ZWxvY2l0eUZhY3RvciIsInJ1blZlbG9jaXR5IiwicGxheWVyIiwicGl0Y2hPYmplY3QiLCJPYmplY3QzRCIsInlhd09iamVjdCIsInlwb3MiLCJjYW5KdW1wIiwibW92ZUJhY2t3YXJkIiwibW92ZUxlZnQiLCJtb3ZlUmlnaHQiLCJvbiIsIm90aGVyT2JqZWN0IiwidiIsInIiLCJjb250YWN0Tm9ybWFsIiwib25Nb3VzZU1vdmUiLCJlbmFibGVkIiwibW92ZW1lbnRYIiwibW96TW92ZW1lbnRYIiwiZ2V0TW92ZW1lbnRYIiwibW92ZW1lbnRZIiwibW96TW92ZW1lbnRZIiwiZ2V0TW92ZW1lbnRZIiwib25LZXlEb3duIiwia2V5Q29kZSIsIm9uS2V5VXAiLCJnZXRPYmplY3QiLCJnZXREaXJlY3Rpb24iLCJtdWx0aXBseVZlY3RvcjMiLCJ0YXJnZXRWZWMiLCJpbnB1dFZlbG9jaXR5IiwiZGVsdGEiLCJzcGVlZCIsIm1vdmVGb3J3YXJkIiwib3JkZXIiLCJhcHBseVF1YXRlcm5pb24iLCJGaXJzdFBlcnNvbk1vZHVsZSIsImJsb2NrIiwiZ2V0RWxlbWVudEJ5SWQiLCJjb250cm9scyIsImVsZW1lbnQiLCJwb2ludGVybG9ja2NoYW5nZSIsInBvaW50ZXJMb2NrRWxlbWVudCIsIm1velBvaW50ZXJMb2NrRWxlbWVudCIsIndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCIsInN0eWxlIiwiZGlzcGxheSIsInBvaW50ZXJsb2NrZXJyb3IiLCJ3YXJuIiwicXVlcnlTZWxlY3RvciIsInJlcXVlc3RQb2ludGVyTG9jayIsIm1velJlcXVlc3RQb2ludGVyTG9jayIsIndlYmtpdFJlcXVlc3RQb2ludGVyTG9jayIsInJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxzY3JlZW4iLCJtb3pSZXF1ZXN0RnVsbFNjcmVlbiIsIndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIiwiZnVsbHNjcmVlbmNoYW5nZSIsImZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsInVwZGF0ZVByb2Nlc3NvciIsInVwZGF0ZUxvb3AiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFNQSxJQUFNQSxnQkFBZ0I7ZUFDUCxDQURPO21CQUVILENBRkc7aUJBR0wsQ0FISztvQkFJRixDQUpFO2NBS1I7Q0FMZDs7QUFRQSxJQUFNQyxrQkFBa0IsRUFBeEI7SUFDRUMsMkJBQTJCLENBRDdCO0lBRUVDLHlCQUF5QixDQUYzQjtJQUdFQyw0QkFBNEIsQ0FIOUI7O0FBS0EsSUFBTUMsZUFBZSxJQUFJQyxhQUFKLEVBQXJCO0lBQ0VDLGVBQWUsSUFBSUQsYUFBSixFQURqQjtJQUVFRSxlQUFlLElBQUlDLGFBQUosRUFGakI7SUFHRUMsWUFBWSxJQUFJQyxnQkFBSixFQUhkOztBQUtBLElBQU1DLDRCQUE0QixTQUE1QkEseUJBQTRCLENBQUNDLENBQUQsRUFBSUMsQ0FBSixFQUFPQyxDQUFQLEVBQVVDLENBQVYsRUFBZ0I7U0FDekMsSUFBSVYsYUFBSixDQUNMVyxLQUFLQyxLQUFMLENBQVcsS0FBS0wsSUFBSUcsQ0FBSixHQUFRRixJQUFJQyxDQUFqQixDQUFYLEVBQWlDQyxJQUFJQSxDQUFKLEdBQVFILElBQUlBLENBQVosR0FBZ0JDLElBQUlBLENBQXBCLEdBQXdCQyxJQUFJQSxDQUE3RCxDQURLLEVBRUxFLEtBQUtFLElBQUwsQ0FBVSxLQUFLTixJQUFJRSxDQUFKLEdBQVFELElBQUlFLENBQWpCLENBQVYsQ0FGSyxFQUdM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
