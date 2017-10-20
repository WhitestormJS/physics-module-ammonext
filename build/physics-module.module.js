/* Physics module AmmoNext v0.1.2 */
import { BoxGeometry, BufferAttribute, BufferGeometry, Euler, JSONLoader, Matrix4, Mesh, MeshNormalMaterial, Object3D, Quaternion, SphereGeometry, Vector2, Vector3 } from 'three';
import { Loop } from 'whs';

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

var temp1Vector3 = new Vector3();
var temp2Vector3 = new Vector3();
var temp1Matrix4 = new Matrix4();
var temp1Quat = new Quaternion();

var getEulerXYZFromQuaternion = function getEulerXYZFromQuaternion(x, y, z, w) {
  return new Vector3(Math.atan2(2 * (x * w - y * z), w * w - x * x - y * y + z * z), Math.asin(2 * (x * z + y * w)), Math.atan2(2 * (z * w - x * y), w * w + x * x - y * y - z * z));
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
      gravity: new Vector3(0, -100, 0)
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
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this._objects[constraint.objecta].add(marker);
            break;

          case 'hinge':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this._objects[constraint.objecta].add(marker);
            break;

          case 'slider':
            marker = new Mesh(new BoxGeometry(10, 1, 1), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);

            // This rotation isn't right if all three axis are non-0 values
            // TODO: change marker's rotation order to ZYX
            marker.rotation.set(constraint.axis.y, // yes, y and
            constraint.axis.x, // x axis are swapped
            constraint.axis.z);
            this._objects[constraint.objecta].add(marker);
            break;

          case 'conetwist':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this._objects[constraint.objecta].add(marker);
            break;

          case 'dof':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

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
        self.simulateLoop = new Loop(function (clock) {
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
    linearVelocity: new Vector3(),
    angularVelocity: new Vector3(),
    mass: 10,
    scale: new Vector3(1, 1, 1),
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
      scale: new Vector3(1, 1, 1),
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
        linearVelocity: new Vector3(),
        angularVelocity: new Vector3(),
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
      scale: new Vector3(1, 1, 1),
      margin: 0,
      loader: new JSONLoader()
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
        linearVelocity: new Vector3(),
        angularVelocity: new Vector3(),
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
      scale: new Vector3(1, 1, 1),
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
        linearVelocity: new Vector3(),
        angularVelocity: new Vector3(),
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

        if (!isBuffer) geometry._bufferGeometry = new BufferGeometry().fromGeometry(geometry);

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
      scale: new Vector3(1, 1, 1)
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
        linearVelocity: new Vector3(),
        angularVelocity: new Vector3(),
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
      scale: new Vector3(1, 1, 1)
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
        linearVelocity: new Vector3(),
        angularVelocity: new Vector3(),
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
        var isBuffer = _geometry instanceof BufferGeometry;
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
      scale: new Vector3(1, 1, 1),
      size: new Vector2(1, 1),
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
        linearVelocity: new Vector3(),
        angularVelocity: new Vector3(),
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
      scale: new Vector3(1, 1, 1)
    }, params);
  }

  createClass(PlaneModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'plane',
        touches: [],
        linearVelocity: new Vector3(),
        angularVelocity: new Vector3(),
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
        var idxGeometry = _geometry instanceof BufferGeometry ? _geometry : function () {
          _geometry.mergeVertices();

          var bufferGeometry = new BufferGeometry();

          bufferGeometry.addAttribute('position', new BufferAttribute(new Float32Array(_geometry.vertices.length * 3), 3).copyVector3sArray(_geometry.vertices));

          bufferGeometry.setIndex(new BufferAttribute(new (_geometry.faces.length * 3 > 65535 ? Uint32Array : Uint16Array)(_geometry.faces.length * 3), 1).copyIndicesArray(_geometry.faces));

          return bufferGeometry;
        }();

        var aVertices = idxGeometry.attributes.position.array;
        var aIndices = idxGeometry.index.array;

        this._physijs.aVertices = aVertices;
        this._physijs.aIndices = aIndices;

        var ndxGeometry = new BufferGeometry().fromGeometry(_geometry);

        return ndxGeometry;
      },


      onCopy: onCopy,
      onWrap: onWrap
    };

    this.params = Object.assign({
      restitution: 0.3,
      friction: 0.8,
      damping: 0,
      scale: new Vector3(1, 1, 1),
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

        var geom = _geometry instanceof BufferGeometry ? _geometry : function () {
          _geometry.mergeVertices();

          var bufferGeometry = new BufferGeometry();

          bufferGeometry.addAttribute('position', new BufferAttribute(new Float32Array(_geometry.vertices.length * 3), 3).copyVector3sArray(_geometry.vertices));

          var faces = _geometry.faces,
              facesLength = faces.length;
          var normalsArray = new Float32Array(facesLength * 3);

          for (var i = 0; i < facesLength; i++) {
            var i3 = i * 3;
            var normal = faces[i].normal || new Vector3();

            normalsArray[i3] = normal.x;
            normalsArray[i3 + 1] = normal.y;
            normalsArray[i3 + 2] = normal.z;
          }

          bufferGeometry.addAttribute('normal', new BufferAttribute(normalsArray, 3));

          bufferGeometry.setIndex(new BufferAttribute(new (facesLength * 3 > 65535 ? Uint32Array : Uint16Array)(facesLength * 3), 1).copyIndicesArray(faces));

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
      scale: new Vector3(1, 1, 1),
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
        if (!(_geometry instanceof BufferGeometry)) {
          _geometry = function () {
            var buff = new BufferGeometry();

            buff.addAttribute('position', new BufferAttribute(new Float32Array(_geometry.vertices.length * 3), 3).copyVector3sArray(_geometry.vertices));

            return buff;
          }();
        }

        var length = _geometry.attributes.position.array.length / 3;
        var vert = function vert(n) {
          return new Vector3().fromArray(_geometry.attributes.position.array, n * 3);
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
  var inputVelocity = new Vector3(),
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

      self.updateLoop = new Loop(updateProcessor).start(this);
    }
  }]);
  return FirstPersonModule;
}(), _class$1.defaults = {
  block: null,
  speed: 1,
  ypos: 1
}, _temp$1);

export { getEulerXYZFromQuaternion, getQuatertionFromEuler, convertWorldPositionToObject, addObjectChildren, MESSAGE_TYPES, REPORT_ITEMSIZE, COLLISIONREPORT_ITEMSIZE, VEHICLEREPORT_ITEMSIZE, CONSTRAINTREPORT_ITEMSIZE, temp1Vector3, temp2Vector3, temp1Matrix4, temp1Quat, Eventable, ConeTwistConstraint, HingeConstraint, PointConstraint, SliderConstraint, DOFConstraint, WorldModule, BoxModule, CompoundModule, CapsuleModule, ConcaveModule, ConeModule, ConvexModule, CylinderModule, HeightfieldModule, PlaneModule, SphereModule, SoftbodyModule, ClothModule, RopeModule, FirstPersonModule };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvYXBpLmpzIiwiLi4vc3JjL2V2ZW50YWJsZS5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Db25lVHdpc3RDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0hpbmdlQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Qb2ludENvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvU2xpZGVyQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9ET0ZDb25zdHJhaW50LmpzIiwiLi4vc3JjL3ZlaGljbGUvdmVoaWNsZS5qcyIsIi4uL2J1bmRsZS13b3JrZXIvd29ya2VyaGVscGVyLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9tb2R1bGVzL1dvcmxkTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvcGh5c2ljc1Byb3RvdHlwZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1BoeXNpY3NNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Cb3hNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db21wb3VuZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NhcHN1bGVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db25jYXZlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29uZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbnZleE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0N5bGluZGVyTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvSGVpZ2h0ZmllbGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9QbGFuZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NwaGVyZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NvZnRib2R5TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ2xvdGhNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Sb3BlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29udHJvbHMvRmlyc3RQZXJzb25Nb2R1bGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgVmVjdG9yMyxcbiAgTWF0cml4NCxcbiAgUXVhdGVybmlvblxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IE1FU1NBR0VfVFlQRVMgPSB7XG4gIFdPUkxEUkVQT1JUOiAwLFxuICBDT0xMSVNJT05SRVBPUlQ6IDEsXG4gIFZFSElDTEVSRVBPUlQ6IDIsXG4gIENPTlNUUkFJTlRSRVBPUlQ6IDMsXG4gIFNPRlRSRVBPUlQ6IDRcbn07XG5cbmNvbnN0IFJFUE9SVF9JVEVNU0laRSA9IDE0LFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgPSA1LFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFID0gOSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSA9IDY7XG5cbmNvbnN0IHRlbXAxVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAyVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAxTWF0cml4NCA9IG5ldyBNYXRyaXg0KCksXG4gIHRlbXAxUXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbmNvbnN0IGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24gPSAoeCwgeSwgeiwgdykgPT4ge1xuICByZXR1cm4gbmV3IFZlY3RvcjMoXG4gICAgTWF0aC5hdGFuMigyICogKHggKiB3IC0geSAqIHopLCAodyAqIHcgLSB4ICogeCAtIHkgKiB5ICsgeiAqIHopKSxcbiAgICBNYXRoLmFzaW4oMiAqICh4ICogeiArIHkgKiB3KSksXG4gICAgTWF0aC5hdGFuMigyICogKHogKiB3IC0geCAqIHkpLCAodyAqIHcgKyB4ICogeCAtIHkgKiB5IC0geiAqIHopKVxuICApO1xufTtcblxuY29uc3QgZ2V0UXVhdGVydGlvbkZyb21FdWxlciA9ICh4LCB5LCB6KSA9PiB7XG4gIGNvbnN0IGMxID0gTWF0aC5jb3MoeSk7XG4gIGNvbnN0IHMxID0gTWF0aC5zaW4oeSk7XG4gIGNvbnN0IGMyID0gTWF0aC5jb3MoLXopO1xuICBjb25zdCBzMiA9IE1hdGguc2luKC16KTtcbiAgY29uc3QgYzMgPSBNYXRoLmNvcyh4KTtcbiAgY29uc3QgczMgPSBNYXRoLnNpbih4KTtcbiAgY29uc3QgYzFjMiA9IGMxICogYzI7XG4gIGNvbnN0IHMxczIgPSBzMSAqIHMyO1xuXG4gIHJldHVybiB7XG4gICAgdzogYzFjMiAqIGMzIC0gczFzMiAqIHMzLFxuICAgIHg6IGMxYzIgKiBzMyArIHMxczIgKiBjMyxcbiAgICB5OiBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczMsXG4gICAgejogYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzXG4gIH07XG59O1xuXG5jb25zdCBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0ID0gKHBvc2l0aW9uLCBvYmplY3QpID0+IHtcbiAgdGVtcDFNYXRyaXg0LmlkZW50aXR5KCk7IC8vIHJlc2V0IHRlbXAgbWF0cml4XG5cbiAgLy8gU2V0IHRoZSB0ZW1wIG1hdHJpeCdzIHJvdGF0aW9uIHRvIHRoZSBvYmplY3QncyByb3RhdGlvblxuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKS5tYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihvYmplY3QucXVhdGVybmlvbik7XG5cbiAgLy8gSW52ZXJ0IHJvdGF0aW9uIG1hdHJpeCBpbiBvcmRlciB0byBcInVucm90YXRlXCIgYSBwb2ludCBiYWNrIHRvIG9iamVjdCBzcGFjZVxuICB0ZW1wMU1hdHJpeDQuZ2V0SW52ZXJzZSh0ZW1wMU1hdHJpeDQpO1xuXG4gIC8vIFlheSEgVGVtcCB2YXJzIVxuICB0ZW1wMVZlY3RvcjMuY29weShwb3NpdGlvbik7XG4gIHRlbXAyVmVjdG9yMy5jb3B5KG9iamVjdC5wb3NpdGlvbik7XG5cbiAgLy8gQXBwbHkgdGhlIHJvdGF0aW9uXG4gIHJldHVybiB0ZW1wMVZlY3RvcjMuc3ViKHRlbXAyVmVjdG9yMykuYXBwbHlNYXRyaXg0KHRlbXAxTWF0cml4NCk7XG59O1xuXG5jb25zdCBhZGRPYmplY3RDaGlsZHJlbiA9IGZ1bmN0aW9uIChwYXJlbnQsIG9iamVjdCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG9iamVjdC5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkID0gb2JqZWN0LmNoaWxkcmVuW2ldO1xuICAgIGNvbnN0IF9waHlzaWpzID0gY2hpbGQuY29tcG9uZW50Ll9waHlzaWpzO1xuXG4gICAgaWYgKF9waHlzaWpzKSB7XG4gICAgICBjaGlsZC51cGRhdGVNYXRyaXgoKTtcbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG5cbiAgICAgIHRlbXAxVmVjdG9yMy5zZXRGcm9tTWF0cml4UG9zaXRpb24oY2hpbGQubWF0cml4V29ybGQpO1xuICAgICAgdGVtcDFRdWF0LnNldEZyb21Sb3RhdGlvbk1hdHJpeChjaGlsZC5tYXRyaXhXb3JsZCk7XG5cbiAgICAgIF9waHlzaWpzLnBvc2l0aW9uX29mZnNldCA9IHtcbiAgICAgICAgeDogdGVtcDFWZWN0b3IzLngsXG4gICAgICAgIHk6IHRlbXAxVmVjdG9yMy55LFxuICAgICAgICB6OiB0ZW1wMVZlY3RvcjMuelxuICAgICAgfTtcblxuICAgICAgX3BoeXNpanMucm90YXRpb24gPSB7XG4gICAgICAgIHg6IHRlbXAxUXVhdC54LFxuICAgICAgICB5OiB0ZW1wMVF1YXQueSxcbiAgICAgICAgejogdGVtcDFRdWF0LnosXG4gICAgICAgIHc6IHRlbXAxUXVhdC53XG4gICAgICB9O1xuXG4gICAgICBwYXJlbnQuY29tcG9uZW50Ll9waHlzaWpzLmNoaWxkcmVuLnB1c2goX3BoeXNpanMpO1xuICAgIH1cblxuICAgIGFkZE9iamVjdENoaWxkcmVuKHBhcmVudCwgY2hpbGQpO1xuICB9XG59O1xuXG5leHBvcnQge1xuICBnZXRFdWxlclhZWkZyb21RdWF0ZXJuaW9uLFxuICBnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyLFxuICBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0LFxuICBhZGRPYmplY3RDaGlsZHJlbixcblxuICBNRVNTQUdFX1RZUEVTLFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSxcblxuICB0ZW1wMVZlY3RvcjMsXG4gIHRlbXAyVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICB0ZW1wMVF1YXRcbn07XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRhYmxlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnMgPSB7fTtcbiAgfVxuXG4gIGFkZEV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKVxuICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0gPSBbXTtcblxuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjYWxsYmFjaykge1xuICAgIGxldCBpbmRleDtcblxuICAgIGlmICghdGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpIHJldHVybiBmYWxzZTtcblxuICAgIGlmICgoaW5kZXggPSB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5pbmRleE9mKGNhbGxiYWNrKSkgPj0gMCkge1xuICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGRpc3BhdGNoRXZlbnQoZXZlbnRfbmFtZSkge1xuICAgIGxldCBpO1xuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIGlmICh0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXVtpXS5hcHBseSh0aGlzLCBwYXJhbWV0ZXJzKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbWFrZShvYmopIHtcbiAgICBvYmoucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBFdmVudGFibGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG4gICAgb2JqLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gRXZlbnRhYmxlLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuICAgIG9iai5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IEV2ZW50YWJsZS5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudDtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgQ29uZVR3aXN0Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgY29uc3Qgb2JqZWN0YiA9IG9iamE7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkgY29uc29sZS5lcnJvcignQm90aCBvYmplY3RzIG11c3QgYmUgZGVmaW5lZCBpbiBhIENvbmVUd2lzdENvbnN0cmFpbnQuJyk7XG5cbiAgICB0aGlzLnR5cGUgPSAnY29uZXR3aXN0JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLl9waHlzaWpzLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXNhID0ge3g6IG9iamVjdGEucm90YXRpb24ueCwgeTogb2JqZWN0YS5yb3RhdGlvbi55LCB6OiBvYmplY3RhLnJvdGF0aW9uLnp9O1xuICAgIHRoaXMuYXhpc2IgPSB7eDogb2JqZWN0Yi5yb3RhdGlvbi54LCB5OiBvYmplY3RiLnJvdGF0aW9uLnksIHo6IG9iamVjdGIucm90YXRpb24uen07XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpc2E6IHRoaXMuYXhpc2EsXG4gICAgICBheGlzYjogdGhpcy5heGlzYlxuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdCh4LCB5LCB6KSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TGltaXQnLCB7Y29uc3RyYWludDogdGhpcy5pZCwgeCwgeSwgen0pO1xuICB9XG5cbiAgZW5hYmxlTW90b3IoKSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3RfZW5hYmxlTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG5cbiAgc2V0TWF4TW90b3JJbXB1bHNlKG1heF9pbXB1bHNlKSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlJywge2NvbnN0cmFpbnQ6IHRoaXMuaWQsIG1heF9pbXB1bHNlfSk7XG4gIH1cblxuICBzZXRNb3RvclRhcmdldCh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuVmVjdG9yMylcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKG5ldyBUSFJFRS5FdWxlcih0YXJnZXQueCwgdGFyZ2V0LnksIHRhcmdldC56KSk7XG4gICAgZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuRXVsZXIpXG4gICAgICB0YXJnZXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcih0YXJnZXQpO1xuICAgIGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFRIUkVFLk1hdHJpeDQpXG4gICAgICB0YXJnZXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Sb3RhdGlvbk1hdHJpeCh0YXJnZXQpO1xuXG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TW90b3JUYXJnZXQnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgeDogdGFyZ2V0LngsXG4gICAgICB5OiB0YXJnZXQueSxcbiAgICAgIHo6IHRhcmdldC56LFxuICAgICAgdzogdGFyZ2V0LndcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgSGluZ2VDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24sIGF4aXMpIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoYXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBheGlzID0gcG9zaXRpb247XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdoaW5nZSc7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS5fcGh5c2lqcy5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxvdywgaGlnaCwgYmlhc19mYWN0b3IsIHJlbGF4YXRpb25fZmFjdG9yKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2Vfc2V0TGltaXRzJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIGxvdyxcbiAgICAgIGhpZ2gsXG4gICAgICBiaWFzX2ZhY3RvcixcbiAgICAgIHJlbGF4YXRpb25fZmFjdG9yXG4gICAgfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZU1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2Rpc2FibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIFBvaW50Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ3BvaW50JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLl9waHlzaWpzLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmJcbiAgICB9O1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBTbGlkZXJDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24sIGF4aXMpIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoYXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBheGlzID0gcG9zaXRpb247XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdzbGlkZXInO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpcyA9IGF4aXM7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi5fcGh5c2lqcy5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpczogdGhpcy5heGlzXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0cyhsaW5fbG93ZXIsIGxpbl91cHBlciwgYW5nX2xvd2VyLCBhbmdfdXBwZXIpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfc2V0TGltaXRzJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIGxpbl9sb3dlcixcbiAgICAgIGxpbl91cHBlcixcbiAgICAgIGFuZ19sb3dlcixcbiAgICAgIGFuZ191cHBlclxuICAgIH0pO1xuICB9XG5cbiAgc2V0UmVzdGl0dXRpb24obGluZWFyLCBhbmd1bGFyKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZShcbiAgICAgICdzbGlkZXJfc2V0UmVzdGl0dXRpb24nLFxuICAgICAge1xuICAgICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgICBsaW5lYXIsXG4gICAgICAgIGFuZ3VsYXJcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZW5hYmxlTGluZWFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9lbmFibGVMaW5lYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZUxpbmVhck1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9kaXNhYmxlTGluZWFyTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yKHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcbiAgICB0aGlzLnNjZW5lLmV4ZWN1dGUoJ3NsaWRlcl9lbmFibGVBbmd1bGFyTW90b3InLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgdmVsb2NpdHksXG4gICAgICBhY2NlbGVyYXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVBbmd1bGFyTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBET0ZDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoIHBvc2l0aW9uID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdkb2YnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YSApLmNsb25lKCk7XG4gICAgdGhpcy5heGlzYSA9IHsgeDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24ueiB9O1xuXG4gICAgaWYgKCBvYmplY3RiICkge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi5fcGh5c2lqcy5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCggcG9zaXRpb24sIG9iamVjdGIgKS5jbG9uZSgpO1xuICAgICAgdGhpcy5heGlzYiA9IHsgeDogb2JqZWN0Yi5yb3RhdGlvbi54LCB5OiBvYmplY3RiLnJvdGF0aW9uLnksIHo6IG9iamVjdGIucm90YXRpb24ueiB9O1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbmVhckxvd2VyTGltaXQobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhckxvd2VyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0TGluZWFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0QW5ndWxhckxvd2VyTGltaXQgKGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3RvciAod2hpY2gpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZUFuZ3VsYXJNb3RvciAod2hpY2gsIGxvd19hbmdsZSwgaGlnaF9hbmdsZSwgdmVsb2NpdHksIG1heF9mb3JjZSApIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoLCBsb3dfYW5nbGU6IGxvd19hbmdsZSwgaGlnaF9hbmdsZTogaGlnaF9hbmdsZSwgdmVsb2NpdHk6IHZlbG9jaXR5LCBtYXhfZm9yY2U6IG1heF9mb3JjZSB9ICk7XG4gIH1cblxuICBkaXNhYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtNZXNofSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge1ZlaGljbGVUdW5uaW5nfSBmcm9tICcuL3R1bm5pbmcnO1xuXG5leHBvcnQgY2xhc3MgVmVoaWNsZSB7XG4gIGNvbnN0cnVjdG9yKG1lc2gsIHR1bmluZyA9IG5ldyBWZWhpY2xlVHVuaW5nKCkpIHtcbiAgICB0aGlzLm1lc2ggPSBtZXNoO1xuICAgIHRoaXMud2hlZWxzID0gW107XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgaWQ6IGdldE9iamVjdElkKCksXG4gICAgICByaWdpZEJvZHk6IG1lc2guX3BoeXNpanMuaWQsXG4gICAgICBzdXNwZW5zaW9uX3N0aWZmbmVzczogdHVuaW5nLnN1c3BlbnNpb25fc3RpZmZuZXNzLFxuICAgICAgc3VzcGVuc2lvbl9jb21wcmVzc2lvbjogdHVuaW5nLnN1c3BlbnNpb25fY29tcHJlc3Npb24sXG4gICAgICBzdXNwZW5zaW9uX2RhbXBpbmc6IHR1bmluZy5zdXNwZW5zaW9uX2RhbXBpbmcsXG4gICAgICBtYXhfc3VzcGVuc2lvbl90cmF2ZWw6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl90cmF2ZWwsXG4gICAgICBmcmljdGlvbl9zbGlwOiB0dW5pbmcuZnJpY3Rpb25fc2xpcCxcbiAgICAgIG1heF9zdXNwZW5zaW9uX2ZvcmNlOiB0dW5pbmcubWF4X3N1c3BlbnNpb25fZm9yY2VcbiAgICB9O1xuICB9XG5cbiAgYWRkV2hlZWwod2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsLCBjb25uZWN0aW9uX3BvaW50LCB3aGVlbF9kaXJlY3Rpb24sIHdoZWVsX2F4bGUsIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsIHdoZWVsX3JhZGl1cywgaXNfZnJvbnRfd2hlZWwsIHR1bmluZykge1xuICAgIGNvbnN0IHdoZWVsID0gbmV3IE1lc2god2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsKTtcblxuICAgIHdoZWVsLmNhc3RTaGFkb3cgPSB3aGVlbC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICB3aGVlbC5wb3NpdGlvbi5jb3B5KHdoZWVsX2RpcmVjdGlvbikubXVsdGlwbHlTY2FsYXIoc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCAvIDEwMCkuYWRkKGNvbm5lY3Rpb25fcG9pbnQpO1xuXG4gICAgdGhpcy53b3JsZC5hZGQod2hlZWwpO1xuICAgIHRoaXMud2hlZWxzLnB1c2god2hlZWwpO1xuXG4gICAgdGhpcy53b3JsZC5leGVjdXRlKCdhZGRXaGVlbCcsIHtcbiAgICAgIGlkOiB0aGlzLl9waHlzaWpzLmlkLFxuICAgICAgY29ubmVjdGlvbl9wb2ludDoge3g6IGNvbm5lY3Rpb25fcG9pbnQueCwgeTogY29ubmVjdGlvbl9wb2ludC55LCB6OiBjb25uZWN0aW9uX3BvaW50Lnp9LFxuICAgICAgd2hlZWxfZGlyZWN0aW9uOiB7eDogd2hlZWxfZGlyZWN0aW9uLngsIHk6IHdoZWVsX2RpcmVjdGlvbi55LCB6OiB3aGVlbF9kaXJlY3Rpb24uen0sXG4gICAgICB3aGVlbF9heGxlOiB7eDogd2hlZWxfYXhsZS54LCB5OiB3aGVlbF9heGxlLnksIHo6IHdoZWVsX2F4bGUuen0sXG4gICAgICBzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLFxuICAgICAgd2hlZWxfcmFkaXVzLFxuICAgICAgaXNfZnJvbnRfd2hlZWwsXG4gICAgICB0dW5pbmdcbiAgICB9KTtcbiAgfVxuXG4gIHNldFN0ZWVyaW5nKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0U3RlZXJpbmcnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBzdGVlcmluZzogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBzZXRCcmFrZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldEJyYWtlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbCwgYnJha2U6IGFtb3VudH0pO1xuICAgIGVsc2UgaWYgKHRoaXMud2hlZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aGVlbHMubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBicmFrZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG5cbiAgYXBwbHlFbmdpbmVGb3JjZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBmb3JjZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdhcHBseUVuZ2luZUZvcmNlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgZm9yY2U6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxufVxuIiwidmFyIFRBUkdFVCA9IHR5cGVvZiBTeW1ib2wgPT09ICd1bmRlZmluZWQnID8gJ19fdGFyZ2V0JyA6IFN5bWJvbCgpLFxuICAgIFNDUklQVF9UWVBFID0gJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnLFxuICAgIEJsb2JCdWlsZGVyID0gd2luZG93LkJsb2JCdWlsZGVyIHx8IHdpbmRvdy5XZWJLaXRCbG9iQnVpbGRlciB8fCB3aW5kb3cuTW96QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1TQmxvYkJ1aWxkZXIsXG4gICAgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMLFxuICAgIFdvcmtlciA9IHdpbmRvdy5Xb3JrZXI7XG5cbi8qKlxuICogUmV0dXJucyBhIHdyYXBwZXIgYXJvdW5kIFdlYiBXb3JrZXIgY29kZSB0aGF0IGlzIGNvbnN0cnVjdGlibGUuXG4gKlxuICogQGZ1bmN0aW9uIHNoaW1Xb3JrZXJcbiAqXG4gKiBAcGFyYW0geyBTdHJpbmcgfSAgICBmaWxlbmFtZSAgICBUaGUgbmFtZSBvZiB0aGUgZmlsZVxuICogQHBhcmFtIHsgRnVuY3Rpb24gfSAgZm4gICAgICAgICAgRnVuY3Rpb24gd3JhcHBpbmcgdGhlIGNvZGUgb2YgdGhlIHdvcmtlclxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzaGltV29ya2VyIChmaWxlbmFtZSwgZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gU2hpbVdvcmtlciAoZm9yY2VGYWxsYmFjaykge1xuICAgICAgICB2YXIgbyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBXb3JrZXIoZmlsZW5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKFdvcmtlciAmJiAhZm9yY2VGYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgZnVuY3Rpb24ncyBpbm5lciBjb2RlIHRvIGEgc3RyaW5nIHRvIGNvbnN0cnVjdCB0aGUgd29ya2VyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gZm4udG9TdHJpbmcoKS5yZXBsYWNlKC9eZnVuY3Rpb24uKz97LywgJycpLnNsaWNlKDAsIC0xKSxcbiAgICAgICAgICAgICAgICBvYmpVUkwgPSBjcmVhdGVTb3VyY2VPYmplY3Qoc291cmNlKTtcblxuICAgICAgICAgICAgdGhpc1tUQVJHRVRdID0gbmV3IFdvcmtlcihvYmpVUkwpO1xuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChvYmpVUkwpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbVEFSR0VUXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzZWxmU2hpbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2U6IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLm9ubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgby5vbm1lc3NhZ2UoeyBkYXRhOiBtLCB0YXJnZXQ6IHNlbGZTaGltIH0pIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm4uY2FsbChzZWxmU2hpbSk7XG4gICAgICAgICAgICB0aGlzLnBvc3RNZXNzYWdlID0gZnVuY3Rpb24obSkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgc2VsZlNoaW0ub25tZXNzYWdlKHsgZGF0YTogbSwgdGFyZ2V0OiBvIH0pIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuaXNUaGlzVGhyZWFkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vLyBUZXN0IFdvcmtlciBjYXBhYmlsaXRpZXNcbmlmIChXb3JrZXIpIHtcbiAgICB2YXIgdGVzdFdvcmtlcixcbiAgICAgICAgb2JqVVJMID0gY3JlYXRlU291cmNlT2JqZWN0KCdzZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uICgpIHt9JyksXG4gICAgICAgIHRlc3RBcnJheSA9IG5ldyBVaW50OEFycmF5KDEpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gTm8gd29ya2VycyB2aWEgYmxvYnMgaW4gRWRnZSAxMiBhbmQgSUUgMTEgYW5kIGxvd2VyIDooXG4gICAgICAgIGlmICgvKD86VHJpZGVudHxFZGdlKVxcLyg/Ols1NjddfDEyKS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGF2YWlsYWJsZScpO1xuICAgICAgICB9XG4gICAgICAgIHRlc3RXb3JrZXIgPSBuZXcgV29ya2VyKG9ialVSTCk7XG5cbiAgICAgICAgLy8gTmF0aXZlIGJyb3dzZXIgb24gc29tZSBTYW1zdW5nIGRldmljZXMgdGhyb3dzIGZvciB0cmFuc2ZlcmFibGVzLCBsZXQncyBkZXRlY3QgaXRcbiAgICAgICAgdGVzdFdvcmtlci5wb3N0TWVzc2FnZSh0ZXN0QXJyYXksIFt0ZXN0QXJyYXkuYnVmZmVyXSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIFdvcmtlciA9IG51bGw7XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKG9ialVSTCk7XG4gICAgICAgIGlmICh0ZXN0V29ya2VyKSB7XG4gICAgICAgICAgICB0ZXN0V29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTb3VyY2VPYmplY3Qoc3RyKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW3N0cl0sIHsgdHlwZTogU0NSSVBUX1RZUEUgfSkpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iQnVpbGRlcigpO1xuICAgICAgICBibG9iLmFwcGVuZChzdHIpO1xuICAgICAgICByZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iLmdldEJsb2IodHlwZSkpO1xuICAgIH1cbn1cbiIsImltcG9ydCBzaGltV29ya2VyIGZyb20gJ3JvbGx1cC1wbHVnaW4tYnVuZGxlLXdvcmtlcic7XG5leHBvcnQgZGVmYXVsdCBuZXcgc2hpbVdvcmtlcihcIi4uL3dvcmtlci5qc1wiLCBmdW5jdGlvbiAod2luZG93LCBkb2N1bWVudCkge1xudmFyIHNlbGYgPSB0aGlzO1xuY29uc3QgdHJhbnNmZXJhYmxlTWVzc2FnZSA9IHNlbGYud2Via2l0UG9zdE1lc3NhZ2UgfHwgc2VsZi5wb3N0TWVzc2FnZSxcblxuLy8gZW51bVxuTUVTU0FHRV9UWVBFUyA9IHtcbiAgV09STERSRVBPUlQ6IDAsXG4gIENPTExJU0lPTlJFUE9SVDogMSxcbiAgVkVISUNMRVJFUE9SVDogMixcbiAgQ09OU1RSQUlOVFJFUE9SVDogMyxcbiAgU09GVFJFUE9SVDogNFxufTtcblxuICAvLyB0ZW1wIHZhcmlhYmxlc1xubGV0IF9vYmplY3QsXG4gIF92ZWN0b3IsXG4gIF90cmFuc2Zvcm0sXG4gIF90cmFuc2Zvcm1fcG9zLFxuICBfc29mdGJvZHlfZW5hYmxlZCA9IGZhbHNlLFxuICBsYXN0X3NpbXVsYXRpb25fZHVyYXRpb24gPSAwLFxuXG4gIF9udW1fb2JqZWN0cyA9IDAsXG4gIF9udW1fcmlnaWRib2R5X29iamVjdHMgPSAwLFxuICBfbnVtX3NvZnRib2R5X29iamVjdHMgPSAwLFxuICBfbnVtX3doZWVscyA9IDAsXG4gIF9udW1fY29uc3RyYWludHMgPSAwLFxuICBfc29mdGJvZHlfcmVwb3J0X3NpemUgPSAwLFxuXG4gIC8vIHdvcmxkIHZhcmlhYmxlc1xuICBmaXhlZFRpbWVTdGVwLCAvLyB1c2VkIHdoZW4gY2FsbGluZyBzdGVwU2ltdWxhdGlvblxuICBsYXN0X3NpbXVsYXRpb25fdGltZSxcblxuICB3b3JsZCxcbiAgX3ZlYzNfMSxcbiAgX3ZlYzNfMixcbiAgX3ZlYzNfMyxcbiAgX3F1YXQ7XG5cbiAgLy8gcHJpdmF0ZSBjYWNoZVxuY29uc3QgcHVibGljX2Z1bmN0aW9ucyA9IHt9LFxuICBfb2JqZWN0cyA9IFtdLFxuICBfdmVoaWNsZXMgPSBbXSxcbiAgX2NvbnN0cmFpbnRzID0gW10sXG4gIF9vYmplY3RzX2FtbW8gPSB7fSxcbiAgX29iamVjdF9zaGFwZXMgPSB7fSxcblxuICAvLyBUaGUgZm9sbG93aW5nIG9iamVjdHMgYXJlIHRvIHRyYWNrIG9iamVjdHMgdGhhdCBhbW1vLmpzIGRvZXNuJ3QgY2xlYW5cbiAgLy8gdXAuIEFsbCBhcmUgY2xlYW5lZCB1cCB3aGVuIHRoZXkncmUgY29ycmVzcG9uZGluZyBib2R5IGlzIGRlc3Ryb3llZC5cbiAgLy8gVW5mb3J0dW5hdGVseSwgaXQncyB2ZXJ5IGRpZmZpY3VsdCB0byBnZXQgYXQgdGhlc2Ugb2JqZWN0cyBmcm9tIHRoZVxuICAvLyBib2R5LCBzbyB3ZSBoYXZlIHRvIHRyYWNrIHRoZW0gb3Vyc2VsdmVzLlxuICBfbW90aW9uX3N0YXRlcyA9IHt9LFxuICAvLyBEb24ndCBuZWVkIHRvIHdvcnJ5IGFib3V0IGl0IGZvciBjYWNoZWQgc2hhcGVzLlxuICBfbm9uY2FjaGVkX3NoYXBlcyA9IHt9LFxuICAvLyBBIGJvZHkgd2l0aCBhIGNvbXBvdW5kIHNoYXBlIGFsd2F5cyBoYXMgYSByZWd1bGFyIHNoYXBlIGFzIHdlbGwsIHNvIHdlXG4gIC8vIGhhdmUgdHJhY2sgdGhlbSBzZXBhcmF0ZWx5LlxuICBfY29tcG91bmRfc2hhcGVzID0ge307XG5cbiAgLy8gb2JqZWN0IHJlcG9ydGluZ1xubGV0IFJFUE9SVF9DSFVOS1NJWkUsIC8vIHJlcG9ydCBhcnJheSBpcyBpbmNyZWFzZWQgaW4gaW5jcmVtZW50cyBvZiB0aGlzIGNodW5rIHNpemVcbiAgd29ybGRyZXBvcnQsXG4gIHNvZnRyZXBvcnQsXG4gIGNvbGxpc2lvbnJlcG9ydCxcbiAgdmVoaWNsZXJlcG9ydCxcbiAgY29uc3RyYWludHJlcG9ydDtcblxuY29uc3QgV09STERSRVBPUlRfSVRFTVNJWkUgPSAxNCwgLy8gaG93IG1hbnkgZmxvYXQgdmFsdWVzIGVhY2ggcmVwb3J0ZWQgaXRlbSBuZWVkc1xuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgPSA1LCAvLyBvbmUgZmxvYXQgZm9yIGVhY2ggb2JqZWN0IGlkLCBhbmQgYSBWZWMzIGNvbnRhY3Qgbm9ybWFsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgPSA5LCAvLyB2ZWhpY2xlIGlkLCB3aGVlbCBpbmRleCwgMyBmb3IgcG9zaXRpb24sIDQgZm9yIHJvdGF0aW9uXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUgPSA2OyAvLyBjb25zdHJhaW50IGlkLCBvZmZzZXQgb2JqZWN0LCBvZmZzZXQsIGFwcGxpZWQgaW1wdWxzZVxuXG5jb25zdCBhYiA9IG5ldyBBcnJheUJ1ZmZlcigxKTtcblxudHJhbnNmZXJhYmxlTWVzc2FnZShhYiwgW2FiXSk7XG5jb25zdCBTVVBQT1JUX1RSQU5TRkVSQUJMRSA9IChhYi5ieXRlTGVuZ3RoID09PSAwKTtcblxuY29uc3QgZ2V0U2hhcGVGcm9tQ2FjaGUgPSAoY2FjaGVfa2V5KSA9PiB7XG4gIGlmIChfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV07XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5jb25zdCBzZXRTaGFwZUNhY2hlID0gKGNhY2hlX2tleSwgc2hhcGUpID0+IHtcbiAgX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XSA9IHNoYXBlO1xufTtcblxuY29uc3QgY3JlYXRlU2hhcGUgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IHNoYXBlO1xuXG4gIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcbiAgc3dpdGNoIChkZXNjcmlwdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnY29tcG91bmQnOiB7XG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29tcG91bmRTaGFwZSgpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAncGxhbmUnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgcGxhbmVfJHtkZXNjcmlwdGlvbi5ub3JtYWwueH1fJHtkZXNjcmlwdGlvbi5ub3JtYWwueX1fJHtkZXNjcmlwdGlvbi5ub3JtYWwuen1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLm5vcm1hbC54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLm5vcm1hbC55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLm5vcm1hbC56KTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idFN0YXRpY1BsYW5lU2hhcGUoX3ZlYzNfMSwgMCk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdib3gnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgYm94XyR7ZGVzY3JpcHRpb24ud2lkdGh9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fV8ke2Rlc2NyaXB0aW9uLmRlcHRofWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ud2lkdGggLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmhlaWdodCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uZGVwdGggLyAyKTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEJveFNoYXBlKF92ZWMzXzEpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc3BoZXJlJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYHNwaGVyZV8ke2Rlc2NyaXB0aW9uLnJhZGl1c31gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idFNwaGVyZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cyk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjeWxpbmRlcic6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjeWxpbmRlcl8ke2Rlc2NyaXB0aW9uLndpZHRofV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1fJHtkZXNjcmlwdGlvbi5kZXB0aH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLndpZHRoIC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5oZWlnaHQgLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLmRlcHRoIC8gMik7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDeWxpbmRlclNoYXBlKF92ZWMzXzEpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY2Fwc3VsZSc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjYXBzdWxlXyR7ZGVzY3JpcHRpb24ucmFkaXVzfV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgLy8gSW4gQnVsbGV0LCBjYXBzdWxlIGhlaWdodCBleGNsdWRlcyB0aGUgZW5kIHNwaGVyZXNcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENhcHN1bGVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMsIGRlc2NyaXB0aW9uLmhlaWdodCAtIDIgKiBkZXNjcmlwdGlvbi5yYWRpdXMpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY29uZSc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjb25lXyR7ZGVzY3JpcHRpb24ucmFkaXVzfV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbmVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMsIGRlc2NyaXB0aW9uLmhlaWdodCk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjb25jYXZlJzoge1xuICAgICAgY29uc3QgdHJpYW5nbGVfbWVzaCA9IG5ldyBBbW1vLmJ0VHJpYW5nbGVNZXNoKCk7XG4gICAgICBpZiAoIWRlc2NyaXB0aW9uLmRhdGEubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aCAvIDk7IGkrKykge1xuICAgICAgICBfdmVjM18xLnNldFgoZGF0YVtpICogOV0pO1xuICAgICAgICBfdmVjM18xLnNldFkoZGF0YVtpICogOSArIDFdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRhdGFbaSAqIDkgKyAyXSk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRhdGFbaSAqIDkgKyAzXSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkYXRhW2kgKiA5ICsgNF0pO1xuICAgICAgICBfdmVjM18yLnNldFooZGF0YVtpICogOSArIDVdKTtcblxuICAgICAgICBfdmVjM18zLnNldFgoZGF0YVtpICogOSArIDZdKTtcbiAgICAgICAgX3ZlYzNfMy5zZXRZKGRhdGFbaSAqIDkgKyA3XSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WihkYXRhW2kgKiA5ICsgOF0pO1xuXG4gICAgICAgIHRyaWFuZ2xlX21lc2guYWRkVHJpYW5nbGUoXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yLFxuICAgICAgICAgIF92ZWMzXzMsXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEJ2aFRyaWFuZ2xlTWVzaFNoYXBlKFxuICAgICAgICB0cmlhbmdsZV9tZXNoLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlXG4gICAgICApO1xuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2NvbnZleCc6IHtcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb252ZXhIdWxsU2hhcGUoKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoIC8gMzsgaSsrKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkYXRhW2kgKiAzIF0pO1xuICAgICAgICBfdmVjM18xLnNldFkoZGF0YVtpICogMyArIDFdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRhdGFbaSAqIDMgKyAyXSk7XG5cbiAgICAgICAgc2hhcGUuYWRkUG9pbnQoX3ZlYzNfMSk7XG4gICAgICB9XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnaGVpZ2h0ZmllbGQnOiB7XG4gICAgICBjb25zdCB4cHRzID0gZGVzY3JpcHRpb24ueHB0cyxcbiAgICAgICAgeXB0cyA9IGRlc2NyaXB0aW9uLnlwdHMsXG4gICAgICAgIHBvaW50cyA9IGRlc2NyaXB0aW9uLnBvaW50cyxcbiAgICAgICAgcHRyID0gQW1tby5fbWFsbG9jKDQgKiB4cHRzICogeXB0cyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwLCBwID0gMCwgcDIgPSAwOyBpIDwgeHB0czsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgeXB0czsgaisrKSB7XG4gICAgICAgICAgQW1tby5IRUFQRjMyW3B0ciArIHAyID4+IDJdID0gcG9pbnRzW3BdO1xuXG4gICAgICAgICAgcCsrO1xuICAgICAgICAgIHAyICs9IDQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEhlaWdodGZpZWxkVGVycmFpblNoYXBlKFxuICAgICAgICBkZXNjcmlwdGlvbi54cHRzLFxuICAgICAgICBkZXNjcmlwdGlvbi55cHRzLFxuICAgICAgICBwdHIsXG4gICAgICAgIDEsXG4gICAgICAgIC1kZXNjcmlwdGlvbi5hYnNNYXhIZWlnaHQsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFic01heEhlaWdodCxcbiAgICAgICAgMSxcbiAgICAgICAgJ1BIWV9GTE9BVCcsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgLy8gTm90IHJlY29nbml6ZWRcbiAgICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBzaGFwZTtcbn07XG5cbmNvbnN0IGNyZWF0ZVNvZnRCb2R5ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBib2R5O1xuXG4gIGNvbnN0IHNvZnRCb2R5SGVscGVycyA9IG5ldyBBbW1vLmJ0U29mdEJvZHlIZWxwZXJzKCk7XG5cbiAgc3dpdGNoIChkZXNjcmlwdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnc29mdFRyaW1lc2gnOiB7XG4gICAgICBpZiAoIWRlc2NyaXB0aW9uLmFWZXJ0aWNlcy5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVGcm9tVHJpTWVzaChcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIGRlc2NyaXB0aW9uLmFWZXJ0aWNlcyxcbiAgICAgICAgZGVzY3JpcHRpb24uYUluZGljZXMsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFJbmRpY2VzLmxlbmd0aCAvIDMsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc29mdENsb3RoTWVzaCc6IHtcbiAgICAgIGNvbnN0IGNyID0gZGVzY3JpcHRpb24uY29ybmVycztcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVQYXRjaChcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjclswXSwgY3JbMV0sIGNyWzJdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzNdLCBjcls0XSwgY3JbNV0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbNl0sIGNyWzddLCBjcls4XSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjcls5XSwgY3JbMTBdLCBjclsxMV0pLFxuICAgICAgICBkZXNjcmlwdGlvbi5zZWdtZW50c1swXSxcbiAgICAgICAgZGVzY3JpcHRpb24uc2VnbWVudHNbMV0sXG4gICAgICAgIDAsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdzb2Z0Um9wZU1lc2gnOiB7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVSb3BlKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGRhdGFbMF0sIGRhdGFbMV0sIGRhdGFbMl0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoZGF0YVszXSwgZGF0YVs0XSwgZGF0YVs1XSksXG4gICAgICAgIGRhdGFbNl0gLSAxLFxuICAgICAgICAwXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIE5vdCByZWNvZ25pemVkXG4gICAgICByZXR1cm47XG4gIH1cblxuICByZXR1cm4gYm9keTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaW5pdCA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBpZiAocGFyYW1zLndhc21CdWZmZXIpIHtcbiAgICBpbXBvcnRTY3JpcHRzKHBhcmFtcy5hbW1vKTtcblxuICAgIHNlbGYuQW1tbyA9IGxvYWRBbW1vRnJvbUJpbmFyeShwYXJhbXMud2FzbUJ1ZmZlcik7XG4gICAgdHJhbnNmZXJhYmxlTWVzc2FnZSh7Y21kOiAnYW1tb0xvYWRlZCd9KTtcbiAgICBwdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZChwYXJhbXMpO1xuICB9IGVsc2Uge1xuICAgIGltcG9ydFNjcmlwdHMocGFyYW1zLmFtbW8pO1xuICAgIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoe2NtZDogJ2FtbW9Mb2FkZWQnfSk7XG4gICAgcHVibGljX2Z1bmN0aW9ucy5tYWtlV29ybGQocGFyYW1zKTtcbiAgfVxufVxuXG5wdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZCA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBfdHJhbnNmb3JtID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgX3RyYW5zZm9ybV9wb3MgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICBfdmVjM18xID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xuICBfdmVjM18yID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xuICBfdmVjM18zID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xuICBfcXVhdCA9IG5ldyBBbW1vLmJ0UXVhdGVybmlvbigwLCAwLCAwLCAwKTtcblxuICBSRVBPUlRfQ0hVTktTSVpFID0gcGFyYW1zLnJlcG9ydHNpemUgfHwgNTA7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgLy8gVHJhbnNmZXJhYmxlIG1lc3NhZ2VzIGFyZSBzdXBwb3J0ZWQsIHRha2UgYWR2YW50YWdlIG9mIHRoZW0gd2l0aCBUeXBlZEFycmF5c1xuICAgIHdvcmxkcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBjb2xsaXNpb25zIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2YgdmVoaWNsZXMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBjb25zdHJhaW50cyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICB9IGVsc2Uge1xuICAgIC8vIFRyYW5zZmVyYWJsZSBtZXNzYWdlcyBhcmUgbm90IHN1cHBvcnRlZCwgc2VuZCBkYXRhIGFzIG5vcm1hbCBhcnJheXNcbiAgICB3b3JsZHJlcG9ydCA9IFtdO1xuICAgIGNvbGxpc2lvbnJlcG9ydCA9IFtdO1xuICAgIHZlaGljbGVyZXBvcnQgPSBbXTtcbiAgICBjb25zdHJhaW50cmVwb3J0ID0gW107XG4gIH1cblxuICB3b3JsZHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ7XG4gIGNvbGxpc2lvbnJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUO1xuICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuXG4gIGNvbnN0IGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24gPSBwYXJhbXMuc29mdGJvZHlcbiAgICA/IG5ldyBBbW1vLmJ0U29mdEJvZHlSaWdpZEJvZHlDb2xsaXNpb25Db25maWd1cmF0aW9uKClcbiAgICA6IG5ldyBBbW1vLmJ0RGVmYXVsdENvbGxpc2lvbkNvbmZpZ3VyYXRpb24oKSxcbiAgICBkaXNwYXRjaGVyID0gbmV3IEFtbW8uYnRDb2xsaXNpb25EaXNwYXRjaGVyKGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pLFxuICAgIHNvbHZlciA9IG5ldyBBbW1vLmJ0U2VxdWVudGlhbEltcHVsc2VDb25zdHJhaW50U29sdmVyKCk7XG5cbiAgbGV0IGJyb2FkcGhhc2U7XG5cbiAgaWYgKCFwYXJhbXMuYnJvYWRwaGFzZSkgcGFyYW1zLmJyb2FkcGhhc2UgPSB7dHlwZTogJ2R5bmFtaWMnfTtcbiAgLy8gVE9ETyEhIVxuICAvKiBpZiAocGFyYW1zLmJyb2FkcGhhc2UudHlwZSA9PT0gJ3N3ZWVwcHJ1bmUnKSB7XG4gICAgZXh0ZW5kKHBhcmFtcy5icm9hZHBoYXNlLCB7XG4gICAgICBhYWJibWluOiB7XG4gICAgICAgIHg6IC01MCxcbiAgICAgICAgeTogLTUwLFxuICAgICAgICB6OiAtNTBcbiAgICAgIH0sXG5cbiAgICAgIGFhYmJtYXg6IHtcbiAgICAgICAgeDogNTAsXG4gICAgICAgIHk6IDUwLFxuICAgICAgICB6OiA1MFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSovXG5cbiAgc3dpdGNoIChwYXJhbXMuYnJvYWRwaGFzZS50eXBlKSB7XG4gICAgY2FzZSAnc3dlZXBwcnVuZSc6XG4gICAgICBfdmVjM18xLnNldFgocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWluLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtaW4ueik7XG5cbiAgICAgIF92ZWMzXzIuc2V0WChwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LngpO1xuICAgICAgX3ZlYzNfMi5zZXRZKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtYXgueSk7XG4gICAgICBfdmVjM18yLnNldFoocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1heC56KTtcblxuICAgICAgYnJvYWRwaGFzZSA9IG5ldyBBbW1vLmJ0QXhpc1N3ZWVwMyhcbiAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgX3ZlYzNfMlxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnZHluYW1pYyc6XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyb2FkcGhhc2UgPSBuZXcgQW1tby5idERidnRCcm9hZHBoYXNlKCk7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIHdvcmxkID0gcGFyYW1zLnNvZnRib2R5XG4gICAgPyBuZXcgQW1tby5idFNvZnRSaWdpZER5bmFtaWNzV29ybGQoZGlzcGF0Y2hlciwgYnJvYWRwaGFzZSwgc29sdmVyLCBjb2xsaXNpb25Db25maWd1cmF0aW9uLCBuZXcgQW1tby5idERlZmF1bHRTb2Z0Qm9keVNvbHZlcigpKVxuICAgIDogbmV3IEFtbW8uYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQoZGlzcGF0Y2hlciwgYnJvYWRwaGFzZSwgc29sdmVyLCBjb2xsaXNpb25Db25maWd1cmF0aW9uKTtcbiAgZml4ZWRUaW1lU3RlcCA9IHBhcmFtcy5maXhlZFRpbWVTdGVwO1xuXG4gIGlmIChwYXJhbXMuc29mdGJvZHkpIF9zb2Z0Ym9keV9lbmFibGVkID0gdHJ1ZTtcblxuICB0cmFuc2ZlcmFibGVNZXNzYWdlKHtjbWQ6ICd3b3JsZFJlYWR5J30pO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRGaXhlZFRpbWVTdGVwID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGZpeGVkVGltZVN0ZXAgPSBkZXNjcmlwdGlvbjtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0R3Jhdml0eSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ueCk7XG4gIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi55KTtcbiAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnopO1xuICB3b3JsZC5zZXRHcmF2aXR5KF92ZWMzXzEpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBlbmRBbmNob3IgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgY29uc29sZS5sb2coX29iamVjdHNbZGVzY3JpcHRpb24ub2JqXSk7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLm9ial1cbiAgICAuYXBwZW5kQW5jaG9yKFxuICAgICAgZGVzY3JpcHRpb24ubm9kZSxcbiAgICAgIF9vYmplY3RzW2Rlc2NyaXB0aW9uLm9iajJdLFxuICAgICAgZGVzY3JpcHRpb24uY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyxcbiAgICAgIGRlc2NyaXB0aW9uLmluZmx1ZW5jZVxuICAgICk7XG59XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkT2JqZWN0ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBib2R5LCBtb3Rpb25TdGF0ZTtcblxuICBpZiAoZGVzY3JpcHRpb24udHlwZS5pbmRleE9mKCdzb2Z0JykgIT09IC0xKSB7XG4gICAgYm9keSA9IGNyZWF0ZVNvZnRCb2R5KGRlc2NyaXB0aW9uKTtcblxuICAgIGNvbnN0IHNiQ29uZmlnID0gYm9keS5nZXRfbV9jZmcoKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbi52aXRlcmF0aW9ucykgc2JDb25maWcuc2V0X3ZpdGVyYXRpb25zKGRlc2NyaXB0aW9uLnZpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucGl0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9waXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5waXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmRpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfZGl0ZXJhdGlvbnMoZGVzY3JpcHRpb24uZGl0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5jaXRlcmF0aW9ucykgc2JDb25maWcuc2V0X2NpdGVyYXRpb25zKGRlc2NyaXB0aW9uLmNpdGVyYXRpb25zKTtcbiAgICBzYkNvbmZpZy5zZXRfY29sbGlzaW9ucygweDExKTtcbiAgICBzYkNvbmZpZy5zZXRfa0RGKGRlc2NyaXB0aW9uLmZyaWN0aW9uKTtcbiAgICBzYkNvbmZpZy5zZXRfa0RQKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5wcmVzc3VyZSkgc2JDb25maWcuc2V0X2tQUihkZXNjcmlwdGlvbi5wcmVzc3VyZSk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmRyYWcpIHNiQ29uZmlnLnNldF9rREcoZGVzY3JpcHRpb24uZHJhZyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmxpZnQpIHNiQ29uZmlnLnNldF9rTEYoZGVzY3JpcHRpb24ubGlmdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmFuY2hvckhhcmRuZXNzKSBzYkNvbmZpZy5zZXRfa0FIUihkZXNjcmlwdGlvbi5hbmNob3JIYXJkbmVzcyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnJpZ2lkSGFyZG5lc3MpIHNiQ29uZmlnLnNldF9rQ0hSKGRlc2NyaXB0aW9uLnJpZ2lkSGFyZG5lc3MpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLmtsc3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa0xTVChkZXNjcmlwdGlvbi5rbHN0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24ua2FzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rQVNUKGRlc2NyaXB0aW9uLmthc3QpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5rdnN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tWU1QoZGVzY3JpcHRpb24ua3ZzdCk7XG5cbiAgICBBbW1vLmNhc3RPYmplY3QoYm9keSwgQW1tby5idENvbGxpc2lvbk9iamVjdCkuZ2V0Q29sbGlzaW9uU2hhcGUoKS5zZXRNYXJnaW4oZGVzY3JpcHRpb24ubWFyZ2luID8gZGVzY3JpcHRpb24ubWFyZ2luIDogMC4xKTtcblxuICAgIC8vIEFtbW8uY2FzdE9iamVjdChib2R5LCBBbW1vLmJ0Q29sbGlzaW9uT2JqZWN0KS5nZXRDb2xsaXNpb25TaGFwZSgpLnNldExvY2FsU2NhbGluZyhfdmVjM18xKTtcbiAgICBib2R5LnNldEFjdGl2YXRpb25TdGF0ZShkZXNjcmlwdGlvbi5zdGF0ZSB8fCA0KTtcbiAgICBib2R5LnR5cGUgPSAwOyAvLyBTb2Z0Qm9keS5cbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRSb3BlTWVzaCcpIGJvZHkucm9wZSA9IHRydWU7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Q2xvdGhNZXNoJykgYm9keS5jbG90aCA9IHRydWU7XG5cbiAgICBfdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ucG9zaXRpb24ueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5wb3NpdGlvbi56KTtcbiAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgIF9xdWF0LnNldFgoZGVzY3JpcHRpb24ucm90YXRpb24ueCk7XG4gICAgX3F1YXQuc2V0WShkZXNjcmlwdGlvbi5yb3RhdGlvbi55KTtcbiAgICBfcXVhdC5zZXRaKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnopO1xuICAgIF9xdWF0LnNldFcoZGVzY3JpcHRpb24ucm90YXRpb24udyk7XG4gICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICBib2R5LnRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5zY2FsZS54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uc2NhbGUueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnNjYWxlLnopO1xuXG4gICAgYm9keS5zY2FsZShfdmVjM18xKTtcblxuICAgIGJvZHkuc2V0VG90YWxNYXNzKGRlc2NyaXB0aW9uLm1hc3MsIGZhbHNlKTtcbiAgICB3b3JsZC5hZGRTb2Z0Qm9keShib2R5LCAxLCAtMSk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0VHJpbWVzaCcpIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX2ZhY2VzKCkuc2l6ZSgpICogMztcbiAgICBlbHNlIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFJvcGVNZXNoJykgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fbm9kZXMoKS5zaXplKCk7XG4gICAgZWxzZSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9ub2RlcygpLnNpemUoKSAqIDM7XG5cbiAgICBfbnVtX3NvZnRib2R5X29iamVjdHMrKztcbiAgfSBlbHNlIHtcbiAgICBsZXQgc2hhcGUgPSBjcmVhdGVTaGFwZShkZXNjcmlwdGlvbik7XG5cbiAgICBpZiAoIXNoYXBlKSByZXR1cm47XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgY2hpbGRyZW4gdGhlbiB0aGlzIGlzIGEgY29tcG91bmQgc2hhcGVcbiAgICBpZiAoZGVzY3JpcHRpb24uY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGNvbXBvdW5kX3NoYXBlID0gbmV3IEFtbW8uYnRDb21wb3VuZFNoYXBlKCk7XG4gICAgICBjb21wb3VuZF9zaGFwZS5hZGRDaGlsZFNoYXBlKF90cmFuc2Zvcm0sIHNoYXBlKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBfY2hpbGQgPSBkZXNjcmlwdGlvbi5jaGlsZHJlbltpXTtcblxuICAgICAgICBjb25zdCB0cmFucyA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICAgIHRyYW5zLnNldElkZW50aXR5KCk7XG5cbiAgICAgICAgX3ZlYzNfMS5zZXRYKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShfY2hpbGQucG9zaXRpb25fb2Zmc2V0LnkpO1xuICAgICAgICBfdmVjM18xLnNldFooX2NoaWxkLnBvc2l0aW9uX29mZnNldC56KTtcbiAgICAgICAgdHJhbnMuc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgICAgIF9xdWF0LnNldFgoX2NoaWxkLnJvdGF0aW9uLngpO1xuICAgICAgICBfcXVhdC5zZXRZKF9jaGlsZC5yb3RhdGlvbi55KTtcbiAgICAgICAgX3F1YXQuc2V0WihfY2hpbGQucm90YXRpb24ueik7XG4gICAgICAgIF9xdWF0LnNldFcoX2NoaWxkLnJvdGF0aW9uLncpO1xuICAgICAgICB0cmFucy5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICAgICAgc2hhcGUgPSBjcmVhdGVTaGFwZShkZXNjcmlwdGlvbi5jaGlsZHJlbltpXSk7XG4gICAgICAgIGNvbXBvdW5kX3NoYXBlLmFkZENoaWxkU2hhcGUodHJhbnMsIHNoYXBlKTtcbiAgICAgICAgQW1tby5kZXN0cm95KHRyYW5zKTtcbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBjb21wb3VuZF9zaGFwZTtcbiAgICAgIF9jb21wb3VuZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG4gICAgfVxuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnNjYWxlLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5zY2FsZS55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uc2NhbGUueik7XG5cbiAgICBzaGFwZS5zZXRMb2NhbFNjYWxpbmcoX3ZlYzNfMSk7XG4gICAgc2hhcGUuc2V0TWFyZ2luKGRlc2NyaXB0aW9uLm1hcmdpbiA/IGRlc2NyaXB0aW9uLm1hcmdpbiA6IDApO1xuXG4gICAgX3ZlYzNfMS5zZXRYKDApO1xuICAgIF92ZWMzXzEuc2V0WSgwKTtcbiAgICBfdmVjM18xLnNldFooMCk7XG4gICAgc2hhcGUuY2FsY3VsYXRlTG9jYWxJbmVydGlhKGRlc2NyaXB0aW9uLm1hc3MsIF92ZWMzXzEpO1xuXG4gICAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuXG4gICAgX3ZlYzNfMi5zZXRYKGRlc2NyaXB0aW9uLnBvc2l0aW9uLngpO1xuICAgIF92ZWMzXzIuc2V0WShkZXNjcmlwdGlvbi5wb3NpdGlvbi55KTtcbiAgICBfdmVjM18yLnNldFooZGVzY3JpcHRpb24ucG9zaXRpb24ueik7XG4gICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICBfcXVhdC5zZXRYKGRlc2NyaXB0aW9uLnJvdGF0aW9uLngpO1xuICAgIF9xdWF0LnNldFkoZGVzY3JpcHRpb24ucm90YXRpb24ueSk7XG4gICAgX3F1YXQuc2V0WihkZXNjcmlwdGlvbi5yb3RhdGlvbi56KTtcbiAgICBfcXVhdC5zZXRXKGRlc2NyaXB0aW9uLnJvdGF0aW9uLncpO1xuICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuXG4gICAgbW90aW9uU3RhdGUgPSBuZXcgQW1tby5idERlZmF1bHRNb3Rpb25TdGF0ZShfdHJhbnNmb3JtKTsgLy8gI1RPRE86IGJ0RGVmYXVsdE1vdGlvblN0YXRlIHN1cHBvcnRzIGNlbnRlciBvZiBtYXNzIG9mZnNldCBhcyBzZWNvbmQgYXJndW1lbnQgLSBpbXBsZW1lbnRcbiAgICBjb25zdCByYkluZm8gPSBuZXcgQW1tby5idFJpZ2lkQm9keUNvbnN0cnVjdGlvbkluZm8oZGVzY3JpcHRpb24ubWFzcywgbW90aW9uU3RhdGUsIHNoYXBlLCBfdmVjM18xKTtcblxuICAgIHJiSW5mby5zZXRfbV9mcmljdGlvbihkZXNjcmlwdGlvbi5mcmljdGlvbik7XG4gICAgcmJJbmZvLnNldF9tX3Jlc3RpdHV0aW9uKGRlc2NyaXB0aW9uLnJlc3RpdHV0aW9uKTtcbiAgICByYkluZm8uc2V0X21fbGluZWFyRGFtcGluZyhkZXNjcmlwdGlvbi5kYW1waW5nKTtcbiAgICByYkluZm8uc2V0X21fYW5ndWxhckRhbXBpbmcoZGVzY3JpcHRpb24uZGFtcGluZyk7XG5cbiAgICBib2R5ID0gbmV3IEFtbW8uYnRSaWdpZEJvZHkocmJJbmZvKTtcbiAgICBib2R5LnNldEFjdGl2YXRpb25TdGF0ZShkZXNjcmlwdGlvbi5zdGF0ZSB8fCA0KTtcbiAgICBBbW1vLmRlc3Ryb3kocmJJbmZvKTtcblxuICAgIGlmICh0eXBlb2YgZGVzY3JpcHRpb24uY29sbGlzaW9uX2ZsYWdzICE9PSAndW5kZWZpbmVkJykgYm9keS5zZXRDb2xsaXNpb25GbGFncyhkZXNjcmlwdGlvbi5jb2xsaXNpb25fZmxhZ3MpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLmdyb3VwICYmIGRlc2NyaXB0aW9uLm1hc2spIHdvcmxkLmFkZFJpZ2lkQm9keShib2R5LCBkZXNjcmlwdGlvbi5ncm91cCwgZGVzY3JpcHRpb24ubWFzayk7XG4gICAgZWxzZSB3b3JsZC5hZGRSaWdpZEJvZHkoYm9keSk7XG4gICAgYm9keS50eXBlID0gMTsgLy8gUmlnaWRCb2R5LlxuICAgIF9udW1fcmlnaWRib2R5X29iamVjdHMrKztcbiAgfVxuXG4gIGJvZHkuYWN0aXZhdGUoKTtcblxuICBib2R5LmlkID0gZGVzY3JpcHRpb24uaWQ7XG4gIF9vYmplY3RzW2JvZHkuaWRdID0gYm9keTtcbiAgX21vdGlvbl9zdGF0ZXNbYm9keS5pZF0gPSBtb3Rpb25TdGF0ZTtcblxuICBfb2JqZWN0c19hbW1vW2JvZHkuYSA9PT0gdW5kZWZpbmVkID8gYm9keS5wdHIgOiBib2R5LmFdID0gYm9keS5pZDtcbiAgX251bV9vYmplY3RzKys7XG5cbiAgdHJhbnNmZXJhYmxlTWVzc2FnZSh7Y21kOiAnb2JqZWN0UmVhZHknLCBwYXJhbXM6IGJvZHkuaWR9KTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkVmVoaWNsZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBjb25zdCB2ZWhpY2xlX3R1bmluZyA9IG5ldyBBbW1vLmJ0VmVoaWNsZVR1bmluZygpO1xuXG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25TdGlmZm5lc3MoZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9zdGlmZm5lc3MpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9zdXNwZW5zaW9uQ29tcHJlc3Npb24oZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9jb21wcmVzc2lvbik7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25EYW1waW5nKGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fZGFtcGluZyk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25UcmF2ZWxDbShkZXNjcmlwdGlvbi5tYXhfc3VzcGVuc2lvbl90cmF2ZWwpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UoZGVzY3JpcHRpb24ubWF4X3N1c3BlbnNpb25fZm9yY2UpO1xuXG4gIGNvbnN0IHZlaGljbGUgPSBuZXcgQW1tby5idFJheWNhc3RWZWhpY2xlKFxuICAgIHZlaGljbGVfdHVuaW5nLFxuICAgIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnJpZ2lkQm9keV0sXG4gICAgbmV3IEFtbW8uYnREZWZhdWx0VmVoaWNsZVJheWNhc3Rlcih3b3JsZClcbiAgKTtcblxuICB2ZWhpY2xlLnR1bmluZyA9IHZlaGljbGVfdHVuaW5nO1xuICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5yaWdpZEJvZHldLnNldEFjdGl2YXRpb25TdGF0ZSg0KTtcbiAgdmVoaWNsZS5zZXRDb29yZGluYXRlU3lzdGVtKDAsIDEsIDIpO1xuXG4gIHdvcmxkLmFkZFZlaGljbGUodmVoaWNsZSk7XG4gIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gPSB2ZWhpY2xlO1xufTtcbnB1YmxpY19mdW5jdGlvbnMucmVtb3ZlVmVoaWNsZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdID0gbnVsbDtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkV2hlZWwgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gIT09IHVuZGVmaW5lZCkge1xuICAgIGxldCB0dW5pbmcgPSBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdLnR1bmluZztcbiAgICBpZiAoZGVzY3JpcHRpb24udHVuaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHR1bmluZyA9IG5ldyBBbW1vLmJ0VmVoaWNsZVR1bmluZygpO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25TdGlmZm5lc3MoZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fc3RpZmZuZXNzKTtcbiAgICAgIHR1bmluZy5zZXRfbV9zdXNwZW5zaW9uQ29tcHJlc3Npb24oZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fY29tcHJlc3Npb24pO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25EYW1waW5nKGRlc2NyaXB0aW9uLnR1bmluZy5zdXNwZW5zaW9uX2RhbXBpbmcpO1xuICAgICAgdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25UcmF2ZWxDbShkZXNjcmlwdGlvbi50dW5pbmcubWF4X3N1c3BlbnNpb25fdHJhdmVsKTtcbiAgICAgIHR1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UoZGVzY3JpcHRpb24udHVuaW5nLm1heF9zdXNwZW5zaW9uX2ZvcmNlKTtcbiAgICB9XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC56KTtcblxuICAgIF92ZWMzXzIuc2V0WChkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueCk7XG4gICAgX3ZlYzNfMi5zZXRZKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi55KTtcbiAgICBfdmVjM18yLnNldFooZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLnopO1xuXG4gICAgX3ZlYzNfMy5zZXRYKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueCk7XG4gICAgX3ZlYzNfMy5zZXRZKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueSk7XG4gICAgX3ZlYzNfMy5zZXRaKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueik7XG5cbiAgICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdLmFkZFdoZWVsKFxuICAgICAgX3ZlYzNfMSxcbiAgICAgIF92ZWMzXzIsXG4gICAgICBfdmVjM18zLFxuICAgICAgZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCxcbiAgICAgIGRlc2NyaXB0aW9uLndoZWVsX3JhZGl1cyxcbiAgICAgIHR1bmluZyxcbiAgICAgIGRlc2NyaXB0aW9uLmlzX2Zyb250X3doZWVsXG4gICAgKTtcbiAgfVxuXG4gIF9udW1fd2hlZWxzKys7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMSArIF9udW1fd2hlZWxzICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgJiAoICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0IClcbiAgICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICB9IGVsc2UgdmVoaWNsZXJlcG9ydCA9IFtNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlRdO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRTdGVlcmluZyA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLnNldFN0ZWVyaW5nVmFsdWUoZGV0YWlscy5zdGVlcmluZywgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEJyYWtlID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uc2V0QnJha2UoZGV0YWlscy5icmFrZSwgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5RW5naW5lRm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5hcHBseUVuZ2luZUZvcmNlKGRldGFpbHMuZm9yY2UsIGRldGFpbHMud2hlZWwpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVPYmplY3QgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX29iamVjdHNbZGV0YWlscy5pZF0udHlwZSA9PT0gMCkge1xuICAgIF9udW1fc29mdGJvZHlfb2JqZWN0cy0tO1xuICAgIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSAtPSBfb2JqZWN0c1tkZXRhaWxzLmlkXS5nZXRfbV9ub2RlcygpLnNpemUoKTtcbiAgICB3b3JsZC5yZW1vdmVTb2Z0Qm9keShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gIH0gZWxzZSBpZiAoX29iamVjdHNbZGV0YWlscy5pZF0udHlwZSA9PT0gMSkge1xuICAgIF9udW1fcmlnaWRib2R5X29iamVjdHMtLTtcbiAgICB3b3JsZC5yZW1vdmVSaWdpZEJvZHkoX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICAgIEFtbW8uZGVzdHJveShfbW90aW9uX3N0YXRlc1tkZXRhaWxzLmlkXSk7XG4gIH1cblxuICBBbW1vLmRlc3Ryb3koX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICBpZiAoX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSkgQW1tby5kZXN0cm95KF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pO1xuICBpZiAoX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pIEFtbW8uZGVzdHJveShfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSk7XG5cbiAgX29iamVjdHNfYW1tb1tfb2JqZWN0c1tkZXRhaWxzLmlkXS5hID09PSB1bmRlZmluZWQgPyBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hIDogX29iamVjdHNbZGV0YWlscy5pZF0ucHRyXSA9IG51bGw7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgX21vdGlvbl9zdGF0ZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuXG4gIGlmIChfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKSBfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgaWYgKF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKSBfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gIF9udW1fb2JqZWN0cy0tO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy51cGRhdGVUcmFuc2Zvcm0gPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0ID0gX29iamVjdHNbZGV0YWlscy5pZF07XG5cbiAgaWYgKF9vYmplY3QudHlwZSA9PT0gMSkge1xuICAgIF9vYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgIGlmIChkZXRhaWxzLnBvcykge1xuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zLnopO1xuICAgICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgfVxuXG4gICAgaWYgKGRldGFpbHMucXVhdCkge1xuICAgICAgX3F1YXQuc2V0WChkZXRhaWxzLnF1YXQueCk7XG4gICAgICBfcXVhdC5zZXRZKGRldGFpbHMucXVhdC55KTtcbiAgICAgIF9xdWF0LnNldFooZGV0YWlscy5xdWF0LnopO1xuICAgICAgX3F1YXQuc2V0VyhkZXRhaWxzLnF1YXQudyk7XG4gICAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcbiAgICB9XG5cbiAgICBfb2JqZWN0LnNldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuICAgIF9vYmplY3QuYWN0aXZhdGUoKTtcbiAgfSBlbHNlIGlmIChfb2JqZWN0LnR5cGUgPT09IDApIHtcbiAgICAvLyBfb2JqZWN0LmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgaWYgKGRldGFpbHMucG9zKSB7XG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3MueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3MueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3Mueik7XG4gICAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICB9XG5cbiAgICBpZiAoZGV0YWlscy5xdWF0KSB7XG4gICAgICBfcXVhdC5zZXRYKGRldGFpbHMucXVhdC54KTtcbiAgICAgIF9xdWF0LnNldFkoZGV0YWlscy5xdWF0LnkpO1xuICAgICAgX3F1YXQuc2V0WihkZXRhaWxzLnF1YXQueik7XG4gICAgICBfcXVhdC5zZXRXKGRldGFpbHMucXVhdC53KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuICAgIH1cblxuICAgIF9vYmplY3QudHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuICB9XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnVwZGF0ZU1hc3MgPSAoZGV0YWlscykgPT4ge1xuICAvLyAjVE9ETzogY2hhbmdpbmcgYSBzdGF0aWMgb2JqZWN0IGludG8gZHluYW1pYyBpcyBidWdneVxuICBfb2JqZWN0ID0gX29iamVjdHNbZGV0YWlscy5pZF07XG5cbiAgLy8gUGVyIGh0dHA6Ly93d3cuYnVsbGV0cGh5c2ljcy5vcmcvQnVsbGV0L3BocEJCMy92aWV3dG9waWMucGhwP3A9JmY9OSZ0PTM2NjMjcDEzODE2XG4gIHdvcmxkLnJlbW92ZVJpZ2lkQm9keShfb2JqZWN0KTtcblxuICBfdmVjM18xLnNldFgoMCk7XG4gIF92ZWMzXzEuc2V0WSgwKTtcbiAgX3ZlYzNfMS5zZXRaKDApO1xuXG4gIF9vYmplY3Quc2V0TWFzc1Byb3BzKGRldGFpbHMubWFzcywgX3ZlYzNfMSk7XG4gIHdvcmxkLmFkZFJpZ2lkQm9keShfb2JqZWN0KTtcbiAgX29iamVjdC5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUNlbnRyYWxJbXB1bHNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUNlbnRyYWxJbXB1bHNlKF92ZWMzXzEpO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUltcHVsc2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy5pbXB1bHNlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy5pbXB1bHNlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy5pbXB1bHNlX3opO1xuXG4gIF92ZWMzXzIuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18yLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMi5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlJbXB1bHNlKFxuICAgIF92ZWMzXzEsXG4gICAgX3ZlYzNfMlxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseVRvcnF1ZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLnRvcnF1ZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMudG9ycXVlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy50b3JxdWVfeik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlUb3JxdWUoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUNlbnRyYWxGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlDZW50cmFsRm9yY2UoX3ZlYzNfMSk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Rm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy5mb3JjZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMuZm9yY2VfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLmZvcmNlX3opO1xuXG4gIF92ZWMzXzIuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18yLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMi5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlGb3JjZShcbiAgICBfdmVjM18xLFxuICAgIF92ZWMzXzJcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMub25TaW11bGF0aW9uUmVzdW1lID0gKCkgPT4ge1xuICBsYXN0X3NpbXVsYXRpb25fdGltZSA9IERhdGUubm93KCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEFuZ3VsYXJWZWxvY2l0eSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0QW5ndWxhclZlbG9jaXR5KFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0TGluZWFyVmVsb2NpdHkgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldExpbmVhclZlbG9jaXR5KFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QW5ndWxhckZhY3RvciA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0QW5ndWxhckZhY3RvcihcbiAgICAgIF92ZWMzXzFcbiAgKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0TGluZWFyRmFjdG9yID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRMaW5lYXJGYWN0b3IoXG4gICAgX3ZlYzNfMVxuICApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXREYW1waW5nID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0RGFtcGluZyhkZXRhaWxzLmxpbmVhciwgZGV0YWlscy5hbmd1bGFyKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0Q2NkTW90aW9uVGhyZXNob2xkID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0Q2NkTW90aW9uVGhyZXNob2xkKGRldGFpbHMudGhyZXNob2xkKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyhkZXRhaWxzLnJhZGl1cyk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFkZENvbnN0cmFpbnQgPSAoZGV0YWlscykgPT4ge1xuICBsZXQgY29uc3RyYWludDtcblxuICBzd2l0Y2ggKGRldGFpbHMudHlwZSkge1xuXG4gICAgY2FzZSAncG9pbnQnOiB7XG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRQb2ludDJQb2ludENvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfdmVjM18xXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0UG9pbnQyUG9pbnRDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdoaW5nZSc6IHtcbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLmF4aXMueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLmF4aXMueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLmF4aXMueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0SGluZ2VDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yXG4gICAgICAgICk7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICBfdmVjM18zLnNldFgoZGV0YWlscy5heGlzLngpO1xuICAgICAgICBfdmVjM18zLnNldFkoZGV0YWlscy5heGlzLnkpO1xuICAgICAgICBfdmVjM18zLnNldFooZGV0YWlscy5heGlzLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEhpbmdlQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yLFxuICAgICAgICAgIF92ZWMzXzMsXG4gICAgICAgICAgX3ZlYzNfM1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ3NsaWRlcic6IHtcbiAgICAgIGxldCB0cmFuc2Zvcm1iO1xuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyKGRldGFpbHMuYXhpcy54LCBkZXRhaWxzLmF4aXMueSwgZGV0YWlscy5heGlzLnopO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIpIHtcbiAgICAgICAgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgICAgcm90YXRpb24uc2V0RXVsZXIoZGV0YWlscy5heGlzLngsIGRldGFpbHMuYXhpcy55LCBkZXRhaWxzLmF4aXMueik7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFNsaWRlckNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJhbnNmb3JtYixcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRTbGlkZXJDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIGlmICh0cmFuc2Zvcm1iICE9PSB1bmRlZmluZWQpIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2NvbmV0d2lzdCc6IHtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWEgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBjb25zdCB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgIHRyYW5zZm9ybWEuc2V0T3JpZ2luKF92ZWMzXzEpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNhLnosIC1kZXRhaWxzLmF4aXNhLnksIC1kZXRhaWxzLmF4aXNhLngpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2IueiwgLWRldGFpbHMuYXhpc2IueSwgLWRldGFpbHMuYXhpc2IueCk7XG4gICAgICB0cmFuc2Zvcm1iLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0Q29uZVR3aXN0Q29uc3RyYWludChcbiAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgdHJhbnNmb3JtYlxuICAgICAgKTtcblxuICAgICAgY29uc3RyYWludC5zZXRMaW1pdChNYXRoLlBJLCAwLCBNYXRoLlBJKTtcblxuICAgICAgY29uc3RyYWludC50YSA9IHRyYW5zZm9ybWE7XG4gICAgICBjb25zdHJhaW50LnRiID0gdHJhbnNmb3JtYjtcblxuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWEpO1xuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWIpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnZG9mJzoge1xuICAgICAgbGV0IHRyYW5zZm9ybWI7XG5cbiAgICAgIGNvbnN0IHRyYW5zZm9ybWEgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgIHRyYW5zZm9ybWEuc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm1hLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYS56LCAtZGV0YWlscy5heGlzYS55LCAtZGV0YWlscy5heGlzYS54KTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiKSB7XG4gICAgICAgIHRyYW5zZm9ybWIgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm1iLnNldElkZW50aXR5KCk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2IueiwgLWRldGFpbHMuYXhpc2IueSwgLWRldGFpbHMuYXhpc2IueCk7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEdlbmVyaWM2RG9mQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cmFuc2Zvcm1iLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEdlbmVyaWM2RG9mQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBpZiAodHJhbnNmb3JtYiAhPT0gdW5kZWZpbmVkKSBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuO1xuICB9XG5cbiAgd29ybGQuYWRkQ29uc3RyYWludChjb25zdHJhaW50KTtcblxuICBjb25zdHJhaW50LmEgPSBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdO1xuICBjb25zdHJhaW50LmIgPSBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdO1xuXG4gIGNvbnN0cmFpbnQuZW5hYmxlRmVlZGJhY2soKTtcbiAgX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdID0gY29uc3RyYWludDtcbiAgX251bV9jb25zdHJhaW50cysrO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDEgKyBfbnVtX2NvbnN0cmFpbnRzICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgJiAoICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0IClcbiAgICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuICB9IGVsc2UgY29uc3RyYWludHJlcG9ydCA9IFtNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlRdO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVDb25zdHJhaW50ID0gKGRldGFpbHMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXTtcblxuICBpZiAoY29uc3RyYWludCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgd29ybGQucmVtb3ZlQ29uc3RyYWludChjb25zdHJhaW50KTtcbiAgICBfY29uc3RyYWludHNbZGV0YWlscy5pZF0gPSBudWxsO1xuICAgIF9udW1fY29uc3RyYWludHMtLTtcbiAgfVxufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25zdHJhaW50X3NldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCA9IChkZXRhaWxzKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbZGV0YWlscy5pZF07XG4gIGlmIChjb25zdHJhaW50ICE9PSB1bmRlZmluZCkgY29uc3RyYWludC5zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQoZGV0YWlscy50aHJlc2hvbGQpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zaW11bGF0ZSA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBpZiAod29ybGQpIHtcbiAgICBpZiAocGFyYW1zLnRpbWVTdGVwICYmIHBhcmFtcy50aW1lU3RlcCA8IGZpeGVkVGltZVN0ZXApXG4gICAgICBwYXJhbXMudGltZVN0ZXAgPSBmaXhlZFRpbWVTdGVwO1xuXG4gICAgcGFyYW1zLm1heFN1YlN0ZXBzID0gcGFyYW1zLm1heFN1YlN0ZXBzIHx8IE1hdGguY2VpbChwYXJhbXMudGltZVN0ZXAgLyBmaXhlZFRpbWVTdGVwKTsgLy8gSWYgbWF4U3ViU3RlcHMgaXMgbm90IGRlZmluZWQsIGtlZXAgdGhlIHNpbXVsYXRpb24gZnVsbHkgdXAgdG8gZGF0ZVxuXG4gICAgd29ybGQuc3RlcFNpbXVsYXRpb24ocGFyYW1zLnRpbWVTdGVwLCBwYXJhbXMubWF4U3ViU3RlcHMsIGZpeGVkVGltZVN0ZXApO1xuXG4gICAgaWYgKF92ZWhpY2xlcy5sZW5ndGggPiAwKSByZXBvcnRWZWhpY2xlcygpO1xuICAgIHJlcG9ydENvbGxpc2lvbnMoKTtcbiAgICBpZiAoX2NvbnN0cmFpbnRzLmxlbmd0aCA+IDApIHJlcG9ydENvbnN0cmFpbnRzKCk7XG4gICAgcmVwb3J0V29ybGQoKTtcbiAgICBpZiAoX3NvZnRib2R5X2VuYWJsZWQpIHJlcG9ydFdvcmxkX3NvZnRib2RpZXMoKTtcbiAgfVxufTtcblxuLy8gQ29uc3RyYWludCBmdW5jdGlvbnNcbnB1YmxpY19mdW5jdGlvbnMuaGluZ2Vfc2V0TGltaXRzID0gKHBhcmFtcykgPT4ge1xuICBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLnNldExpbWl0KHBhcmFtcy5sb3csIHBhcmFtcy5oaWdoLCAwLCBwYXJhbXMuYmlhc19mYWN0b3IsIHBhcmFtcy5yZWxheGF0aW9uX2ZhY3Rvcik7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmhpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuZW5hYmxlQW5ndWxhck1vdG9yKHRydWUsIHBhcmFtcy52ZWxvY2l0eSwgcGFyYW1zLmFjY2VsZXJhdGlvbik7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaGluZ2VfZGlzYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLmVuYWJsZU1vdG9yKGZhbHNlKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9zZXRMaW1pdHMgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldExvd2VyTGluTGltaXQocGFyYW1zLmxpbl9sb3dlciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRVcHBlckxpbkxpbWl0KHBhcmFtcy5saW5fdXBwZXIgfHwgMCk7XG5cbiAgY29uc3RyYWludC5zZXRMb3dlckFuZ0xpbWl0KHBhcmFtcy5hbmdfbG93ZXIgfHwgMCk7XG4gIGNvbnN0cmFpbnQuc2V0VXBwZXJBbmdMaW1pdChwYXJhbXMuYW5nX3VwcGVyIHx8IDApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfc2V0UmVzdGl0dXRpb24gPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFNvZnRuZXNzTGltTGluKHBhcmFtcy5saW5lYXIgfHwgMCk7XG4gIGNvbnN0cmFpbnQuc2V0U29mdG5lc3NMaW1BbmcocGFyYW1zLmFuZ3VsYXIgfHwgMCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9lbmFibGVMaW5lYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0VGFyZ2V0TGluTW90b3JWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBjb25zdHJhaW50LnNldE1heExpbk1vdG9yRm9yY2UocGFyYW1zLmFjY2VsZXJhdGlvbik7XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZExpbk1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9kaXNhYmxlTGluZWFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRMaW5Nb3RvcihmYWxzZSk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRUYXJnZXRBbmdNb3RvclZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIGNvbnN0cmFpbnQuc2V0TWF4QW5nTW90b3JGb3JjZShwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkQW5nTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRBbmdNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X3NldExpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLnNldExpbWl0KHBhcmFtcy56LCBwYXJhbXMueSwgcGFyYW1zLngpOyAvLyBaWVggb3JkZXJcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X2VuYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRNYXhNb3RvckltcHVsc2UocGFyYW1zLm1heF9pbXB1bHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TW90b3JUYXJnZXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF9xdWF0LnNldFgocGFyYW1zLngpO1xuICBfcXVhdC5zZXRZKHBhcmFtcy55KTtcbiAgX3F1YXQuc2V0WihwYXJhbXMueik7XG4gIF9xdWF0LnNldFcocGFyYW1zLncpO1xuXG4gIGNvbnN0cmFpbnQuc2V0TW90b3JUYXJnZXQoX3F1YXQpO1xuXG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X2Rpc2FibGVNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuZW5hYmxlTW90b3IoZmFsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRMaW5lYXJMb3dlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0TGluZWFyTG93ZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRMaW5lYXJVcHBlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0TGluZWFyVXBwZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3ZlYzNfMS5zZXRYKHBhcmFtcy54KTtcbiAgX3ZlYzNfMS5zZXRZKHBhcmFtcy55KTtcbiAgX3ZlYzNfMS5zZXRaKHBhcmFtcy56KTtcblxuICBjb25zdHJhaW50LnNldEFuZ3VsYXJMb3dlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0QW5ndWxhclVwcGVyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2ZfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBjb25zdCBtb3RvciA9IGNvbnN0cmFpbnQuZ2V0Um90YXRpb25hbExpbWl0TW90b3IocGFyYW1zLndoaWNoKTtcbiAgbW90b3Iuc2V0X21fZW5hYmxlTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XSxcbiAgICBtb3RvciA9IGNvbnN0cmFpbnQuZ2V0Um90YXRpb25hbExpbWl0TW90b3IocGFyYW1zLndoaWNoKTtcblxuICBtb3Rvci5zZXRfbV9sb0xpbWl0KHBhcmFtcy5sb3dfYW5nbGUpO1xuICBtb3Rvci5zZXRfbV9oaUxpbWl0KHBhcmFtcy5oaWdoX2FuZ2xlKTtcbiAgbW90b3Iuc2V0X21fdGFyZ2V0VmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgbW90b3Iuc2V0X21fbWF4TW90b3JGb3JjZShwYXJhbXMubWF4X2ZvcmNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9kaXNhYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XSxcbiAgICBtb3RvciA9IGNvbnN0cmFpbnQuZ2V0Um90YXRpb25hbExpbWl0TW90b3IocGFyYW1zLndoaWNoKTtcblxuICBtb3Rvci5zZXRfbV9lbmFibGVNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxuY29uc3QgcmVwb3J0V29ybGQgPSAoKSA9PiB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSAmJiB3b3JsZHJlcG9ydC5sZW5ndGggPCAyICsgX251bV9yaWdpZGJvZHlfb2JqZWN0cyAqIFdPUkxEUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgMi8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICArIChNYXRoLmNlaWwoX251bV9yaWdpZGJvZHlfb2JqZWN0cyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBXT1JMRFJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICApO1xuXG4gICAgd29ybGRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUO1xuICB9XG5cbiAgd29ybGRyZXBvcnRbMV0gPSBfbnVtX3JpZ2lkYm9keV9vYmplY3RzOyAvLyByZWNvcmQgaG93IG1hbnkgb2JqZWN0cyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICB7XG4gICAgbGV0IGkgPSAwLFxuICAgICAgaW5kZXggPSBfb2JqZWN0cy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2JqZWN0ID0gX29iamVjdHNbaW5kZXhdO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIG9iamVjdC50eXBlID09PSAxKSB7IC8vIFJpZ2lkQm9kaWVzLlxuICAgICAgICAvLyAjVE9ETzogd2UgY2FuJ3QgdXNlIGNlbnRlciBvZiBtYXNzIHRyYW5zZm9ybSB3aGVuIGNlbnRlciBvZiBtYXNzIGNhbiBjaGFuZ2UsXG4gICAgICAgIC8vICAgICAgICBidXQgZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybSgpIHNjcmV3cyB1cCBvbiBvYmplY3RzIHRoYXQgaGF2ZSBiZWVuIG1vdmVkXG4gICAgICAgIC8vIG9iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKCB0cmFuc2Zvcm0gKTtcbiAgICAgICAgLy8gb2JqZWN0LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gb2JqZWN0LmdldENlbnRlck9mTWFzc1RyYW5zZm9ybSgpO1xuICAgICAgICBjb25zdCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XG4gICAgICAgIGNvbnN0IHJvdGF0aW9uID0gdHJhbnNmb3JtLmdldFJvdGF0aW9uKCk7XG5cbiAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIChpKyspICogV09STERSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0XSA9IG9iamVjdC5pZDtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxXSA9IG9yaWdpbi54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgM10gPSBvcmlnaW4ueigpO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDRdID0gcm90YXRpb24ueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA1XSA9IHJvdGF0aW9uLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNl0gPSByb3RhdGlvbi56KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDddID0gcm90YXRpb24udygpO1xuXG4gICAgICAgIF92ZWN0b3IgPSBvYmplY3QuZ2V0TGluZWFyVmVsb2NpdHkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgOF0gPSBfdmVjdG9yLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgOV0gPSBfdmVjdG9yLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTBdID0gX3ZlY3Rvci56KCk7XG5cbiAgICAgICAgX3ZlY3RvciA9IG9iamVjdC5nZXRBbmd1bGFyVmVsb2NpdHkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTFdID0gX3ZlY3Rvci54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEyXSA9IF92ZWN0b3IueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxM10gPSBfdmVjdG9yLnooKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHRyYW5zZmVyYWJsZU1lc3NhZ2Uod29ybGRyZXBvcnQuYnVmZmVyLCBbd29ybGRyZXBvcnQuYnVmZmVyXSk7XG4gIGVsc2UgdHJhbnNmZXJhYmxlTWVzc2FnZSh3b3JsZHJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRXb3JsZF9zb2Z0Ym9kaWVzID0gKCkgPT4ge1xuICAvLyBUT0RPOiBBZGQgU1VQUE9SVFRSQU5TRkVSQUJMRS5cblxuICBzb2Z0cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgKyBfbnVtX3NvZnRib2R5X29iamVjdHMgKiAyXG4gICAgKyBfc29mdGJvZHlfcmVwb3J0X3NpemUgKiA2XG4gICk7XG5cbiAgc29mdHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuU09GVFJFUE9SVDtcbiAgc29mdHJlcG9ydFsxXSA9IF9udW1fc29mdGJvZHlfb2JqZWN0czsgLy8gcmVjb3JkIGhvdyBtYW55IG9iamVjdHMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAge1xuICAgIGxldCBvZmZzZXQgPSAyLFxuICAgICAgaW5kZXggPSBfb2JqZWN0cy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2JqZWN0ID0gX29iamVjdHNbaW5kZXhdO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIG9iamVjdC50eXBlID09PSAwKSB7IC8vIFNvZnRCb2RpZXMuXG5cbiAgICAgICAgc29mdHJlcG9ydFtvZmZzZXRdID0gb2JqZWN0LmlkO1xuXG4gICAgICAgIGNvbnN0IG9mZnNldFZlcnQgPSBvZmZzZXQgKyAyO1xuXG4gICAgICAgIGlmIChvYmplY3Qucm9wZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGNvbnN0IG5vZGVzID0gb2JqZWN0LmdldF9tX25vZGVzKCk7XG4gICAgICAgICAgY29uc3Qgc2l6ZSA9IG5vZGVzLnNpemUoKTtcbiAgICAgICAgICBzb2Z0cmVwb3J0W29mZnNldCArIDFdID0gc2l6ZTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXMuYXQoaSk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0ID0gbm9kZS5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogMyArIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqZWN0LmNsb3RoKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZXMgPSBvYmplY3QuZ2V0X21fbm9kZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gbm9kZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5hdChpKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQgPSBub2RlLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbCA9IG5vZGUuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0LngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMV0gPSB2ZXJ0LnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0LnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAzXSA9IG5vcm1hbC54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDRdID0gbm9ybWFsLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNV0gPSBub3JtYWwueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogNiArIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29uc3QgZmFjZXMgPSBvYmplY3QuZ2V0X21fZmFjZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gZmFjZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGZhY2UgPSBmYWNlcy5hdChpKTtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZTEgPSBmYWNlLmdldF9tX24oMCk7XG4gICAgICAgICAgICBjb25zdCBub2RlMiA9IGZhY2UuZ2V0X21fbigxKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUzID0gZmFjZS5nZXRfbV9uKDIpO1xuXG4gICAgICAgICAgICBjb25zdCB2ZXJ0MSA9IG5vZGUxLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQyID0gbm9kZTIuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3QgdmVydDMgPSBub2RlMy5nZXRfbV94KCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDEgPSBub2RlMS5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwyID0gbm9kZTIuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMyA9IG5vZGUzLmdldF9tX24oKTtcblxuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiAxODtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydDEueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQxLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0MS56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgM10gPSBub3JtYWwxLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNF0gPSBub3JtYWwxLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNV0gPSBub3JtYWwxLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA2XSA9IHZlcnQyLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgN10gPSB2ZXJ0Mi55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDhdID0gdmVydDIueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDldID0gbm9ybWFsMi54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEwXSA9IG5vcm1hbDIueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMV0gPSBub3JtYWwyLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMl0gPSB2ZXJ0My54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEzXSA9IHZlcnQzLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTRdID0gdmVydDMueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE1XSA9IG5vcm1hbDMueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNl0gPSBub3JtYWwzLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTddID0gbm9ybWFsMy56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiAxOCArIDI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoc29mdHJlcG9ydC5idWZmZXIsIFtzb2Z0cmVwb3J0LmJ1ZmZlcl0pO1xuICAvLyBlbHNlIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoc29mdHJlcG9ydCk7XG4gIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoc29mdHJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRDb2xsaXNpb25zID0gKCkgPT4ge1xuICBjb25zdCBkcCA9IHdvcmxkLmdldERpc3BhdGNoZXIoKSxcbiAgICBudW0gPSBkcC5nZXROdW1NYW5pZm9sZHMoKTtcbiAgICAvLyBfY29sbGlkZWQgPSBmYWxzZTtcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBpZiAoY29sbGlzaW9ucmVwb3J0Lmxlbmd0aCA8IDIgKyBudW0gKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgKyAoTWF0aC5jZWlsKF9udW1fb2JqZWN0cyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgICApO1xuICAgICAgY29sbGlzaW9ucmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAgY29sbGlzaW9ucmVwb3J0WzFdID0gMDsgLy8gaG93IG1hbnkgY29sbGlzaW9ucyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgY29uc3QgbWFuaWZvbGQgPSBkcC5nZXRNYW5pZm9sZEJ5SW5kZXhJbnRlcm5hbChpKSxcbiAgICAgIG51bV9jb250YWN0cyA9IG1hbmlmb2xkLmdldE51bUNvbnRhY3RzKCk7XG5cbiAgICBpZiAobnVtX2NvbnRhY3RzID09PSAwKSBjb250aW51ZTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnVtX2NvbnRhY3RzOyBqKyspIHtcbiAgICAgIGNvbnN0IHB0ID0gbWFuaWZvbGQuZ2V0Q29udGFjdFBvaW50KGopO1xuXG4gICAgICAvLyBpZiAoIHB0LmdldERpc3RhbmNlKCkgPCAwICkge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIChjb2xsaXNpb25yZXBvcnRbMV0rKykgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0XSA9IF9vYmplY3RzX2FtbW9bbWFuaWZvbGQuZ2V0Qm9keTAoKS5wdHJdO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDFdID0gX29iamVjdHNfYW1tb1ttYW5pZm9sZC5nZXRCb2R5MSgpLnB0cl07XG5cbiAgICAgIF92ZWN0b3IgPSBwdC5nZXRfbV9ub3JtYWxXb3JsZE9uQigpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDJdID0gX3ZlY3Rvci54KCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgM10gPSBfdmVjdG9yLnkoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyA0XSA9IF92ZWN0b3IueigpO1xuICAgICAgYnJlYWs7XG4gICAgICAvLyB9XG4gICAgICAvLyB0cmFuc2ZlcmFibGVNZXNzYWdlKF9vYmplY3RzX2FtbW8pO1xuICAgIH1cbiAgfVxuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgdHJhbnNmZXJhYmxlTWVzc2FnZShjb2xsaXNpb25yZXBvcnQuYnVmZmVyLCBbY29sbGlzaW9ucmVwb3J0LmJ1ZmZlcl0pO1xuICBlbHNlIHRyYW5zZmVyYWJsZU1lc3NhZ2UoY29sbGlzaW9ucmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydFZlaGljbGVzID0gZnVuY3Rpb24gKCkge1xuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBpZiAodmVoaWNsZXJlcG9ydC5sZW5ndGggPCAyICsgX251bV93aGVlbHMgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArIChNYXRoLmNlaWwoX251bV93aGVlbHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIHtcbiAgICBsZXQgaSA9IDAsXG4gICAgICBqID0gMCxcbiAgICAgIGluZGV4ID0gX3ZlaGljbGVzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBpZiAoX3ZlaGljbGVzW2luZGV4XSkge1xuICAgICAgICBjb25zdCB2ZWhpY2xlID0gX3ZlaGljbGVzW2luZGV4XTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgdmVoaWNsZS5nZXROdW1XaGVlbHMoKTsgaisrKSB7XG4gICAgICAgICAgLy8gdmVoaWNsZS51cGRhdGVXaGVlbFRyYW5zZm9ybSggaiwgdHJ1ZSApO1xuICAgICAgICAgIC8vIHRyYW5zZm9ybSA9IHZlaGljbGUuZ2V0V2hlZWxUcmFuc2Zvcm1XUyggaiApO1xuICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHZlaGljbGUuZ2V0V2hlZWxJbmZvKGopLmdldF9tX3dvcmxkVHJhbnNmb3JtKCk7XG5cbiAgICAgICAgICBjb25zdCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XG4gICAgICAgICAgY29uc3Qgcm90YXRpb24gPSB0cmFuc2Zvcm0uZ2V0Um90YXRpb24oKTtcblxuICAgICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSArIChpKyspICogVkVISUNMRVJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0XSA9IGluZGV4O1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgMV0gPSBqO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi54KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi55KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA0XSA9IG9yaWdpbi56KCk7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDVdID0gcm90YXRpb24ueCgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNl0gPSByb3RhdGlvbi55KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA3XSA9IHJvdGF0aW9uLnooKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDhdID0gcm90YXRpb24udygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIGogIT09IDApIHRyYW5zZmVyYWJsZU1lc3NhZ2UodmVoaWNsZXJlcG9ydC5idWZmZXIsIFt2ZWhpY2xlcmVwb3J0LmJ1ZmZlcl0pO1xuICAgIGVsc2UgaWYgKGogIT09IDApIHRyYW5zZmVyYWJsZU1lc3NhZ2UodmVoaWNsZXJlcG9ydCk7XG4gIH1cbn07XG5cbmNvbnN0IHJlcG9ydENvbnN0cmFpbnRzID0gZnVuY3Rpb24gKCkge1xuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBpZiAoY29uc3RyYWludHJlcG9ydC5sZW5ndGggPCAyICsgX251bV9jb25zdHJhaW50cyAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICsgKE1hdGguY2VpbChfbnVtX2NvbnN0cmFpbnRzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgICApO1xuICAgICAgY29uc3RyYWludHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDtcbiAgICB9XG4gIH1cblxuICB7XG4gICAgbGV0IG9mZnNldCA9IDAsXG4gICAgICBpID0gMCxcbiAgICAgIGluZGV4ID0gX2NvbnN0cmFpbnRzLmxlbmdodDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBpZiAoX2NvbnN0cmFpbnRzW2luZGV4XSkge1xuICAgICAgICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2luZGV4XTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0X2JvZHkgPSBjb25zdHJhaW50LmE7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IGNvbnN0cmFpbnQudGE7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcblxuICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICBvZmZzZXQgPSAxICsgKGkrKykgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0XSA9IGluZGV4O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDFdID0gb2Zmc2V0X2JvZHkuaWQ7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi55O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDRdID0gb3JpZ2luLno7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgNV0gPSBjb25zdHJhaW50LmdldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSAmJiBpICE9PSAwKSB0cmFuc2ZlcmFibGVNZXNzYWdlKGNvbnN0cmFpbnRyZXBvcnQuYnVmZmVyLCBbY29uc3RyYWludHJlcG9ydC5idWZmZXJdKTtcbiAgICBlbHNlIGlmIChpICE9PSAwKSB0cmFuc2ZlcmFibGVNZXNzYWdlKGNvbnN0cmFpbnRyZXBvcnQpO1xuICB9XG59O1xuXG5zZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICBpZiAoZXZlbnQuZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgIC8vIHRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICBzd2l0Y2ggKGV2ZW50LmRhdGFbMF0pIHtcbiAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDoge1xuICAgICAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDoge1xuICAgICAgICBjb2xsaXNpb25yZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOiB7XG4gICAgICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOiB7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9IGVsc2UgaWYgKGV2ZW50LmRhdGEuY21kICYmIHB1YmxpY19mdW5jdGlvbnNbZXZlbnQuZGF0YS5jbWRdKSBwdWJsaWNfZnVuY3Rpb25zW2V2ZW50LmRhdGEuY21kXShldmVudC5kYXRhLnBhcmFtcyk7XG59O1xuXG5cbn0pOyIsImltcG9ydCB7XG4gIFNjZW5lIGFzIFNjZW5lTmF0aXZlLFxuICBNZXNoLFxuICBTcGhlcmVHZW9tZXRyeSxcbiAgTWVzaE5vcm1hbE1hdGVyaWFsLFxuICBCb3hHZW9tZXRyeSxcbiAgVmVjdG9yM1xufSBmcm9tICd0aHJlZSc7XG5cbmltcG9ydCB7TG9vcH0gZnJvbSAnd2hzJztcblxuaW1wb3J0IHtWZWhpY2xlfSBmcm9tICcuLi92ZWhpY2xlL3ZlaGljbGUnO1xuaW1wb3J0IHtFdmVudGFibGV9IGZyb20gJy4uL2V2ZW50YWJsZSc7XG5cbmltcG9ydCB7XG4gIGFkZE9iamVjdENoaWxkcmVuLFxuICBNRVNTQUdFX1RZUEVTLFxuICB0ZW1wMVZlY3RvcjMsXG4gIHRlbXAxTWF0cml4NCxcbiAgUkVQT1JUX0lURU1TSVpFLFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUsXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkVcbn0gZnJvbSAnLi4vYXBpJztcblxuaW1wb3J0IFBoeXNpY3NXb3JrZXIgZnJvbSAnd29ya2VyIS4uL3dvcmtlci5qcyc7XG5cbmV4cG9ydCBjbGFzcyBXb3JsZE1vZHVsZSBleHRlbmRzIEV2ZW50YWJsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgZml4ZWRUaW1lU3RlcDogMS82MCxcbiAgICAgIHJhdGVMaW1pdDogdHJ1ZSxcbiAgICAgIGFtbW86IFwiXCIsXG4gICAgICBzb2Z0Ym9keTogZmFsc2UsXG4gICAgICBncmF2aXR5OiBuZXcgVmVjdG9yMygwLCAtMTAwLCAwKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgdGhpcy53b3JrZXIgPSBuZXcgUGh5c2ljc1dvcmtlcigpO1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UgPSB0aGlzLndvcmtlci53ZWJraXRQb3N0TWVzc2FnZSB8fCB0aGlzLndvcmtlci5wb3N0TWVzc2FnZTtcblxuICAgIHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcblxuICAgIHRoaXMubG9hZGVyID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHBhcmFtcy53YXNtKSB7XG4gICAgICAgIGZldGNoKHBhcmFtcy53YXNtKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmFycmF5QnVmZmVyKCkpXG4gICAgICAgICAgLnRoZW4oYnVmZmVyID0+IHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1zLndhc21CdWZmZXIgPSBidWZmZXI7XG5cbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZSgnaW5pdCcsIHRoaXMucGFyYW1zKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUGh5c2ljcyBsb2FkaW5nIHRpbWU6IFwiICsgKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpICsgXCJtc1wiKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgnaW5pdCcsIHRoaXMucGFyYW1zKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2FkZXIudGhlbigoKSA9PiB7dGhpcy5pc0xvYWRlZCA9IHRydWV9KTtcblxuICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzID0ge307XG4gICAgdGhpcy5fb2JqZWN0cyA9IHt9O1xuICAgIHRoaXMuX3ZlaGljbGVzID0ge307XG4gICAgdGhpcy5fY29uc3RyYWludHMgPSB7fTtcbiAgICB0aGlzLl9pc19zaW11bGF0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5nZXRPYmplY3RJZCA9ICgoKSA9PiB7XG4gICAgICBsZXQgX2lkID0gMTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBfaWQrKztcbiAgICAgIH07XG4gICAgfSkoKTtcblxuICAgIC8vIFRlc3QgU1VQUE9SVF9UUkFOU0ZFUkFCTEVcblxuICAgIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKDEpO1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoYWIsIFthYl0pO1xuICAgIHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUgPSAoYWIuYnl0ZUxlbmd0aCA9PT0gMCk7XG5cbiAgICB0aGlzLndvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgIGxldCBfdGVtcCxcbiAgICAgICAgZGF0YSA9IGV2ZW50LmRhdGE7XG5cbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgJiYgZGF0YS5ieXRlTGVuZ3RoICE9PSAxKS8vIGJ5dGVMZW5ndGggPT09IDEgaXMgdGhlIHdvcmtlciBtYWtpbmcgYSBTVVBQT1JUX1RSQU5TRkVSQUJMRSB0ZXN0XG4gICAgICAgIGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICAvLyB0cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgICAgIHN3aXRjaCAoZGF0YVswXSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2NlbmUoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTb2Z0Ym9kaWVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5jbWQpIHtcbiAgICAgICAgLy8gbm9uLXRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICAgICAgc3dpdGNoIChkYXRhLmNtZCkge1xuICAgICAgICAgIGNhc2UgJ29iamVjdFJlYWR5JzpcbiAgICAgICAgICAgIF90ZW1wID0gZGF0YS5wYXJhbXM7XG4gICAgICAgICAgICBpZiAodGhpcy5fb2JqZWN0c1tfdGVtcF0pIHRoaXMuX29iamVjdHNbX3RlbXBdLmRpc3BhdGNoRXZlbnQoJ3JlYWR5Jyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ3dvcmxkUmVhZHknOlxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICdhbW1vTG9hZGVkJzpcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnbG9hZGVkJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBoeXNpY3MgbG9hZGluZyB0aW1lOiBcIiArIChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSArIFwibXNcIik7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ3ZlaGljbGUnOlxuICAgICAgICAgICAgd2luZG93LnRlc3QgPSBkYXRhO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gRG8gbm90aGluZywganVzdCBzaG93IHRoZSBtZXNzYWdlXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBSZWNlaXZlZDogJHtkYXRhLmNtZH1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKGRhdGEucGFyYW1zKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzd2l0Y2ggKGRhdGFbMF0pIHtcbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNjZW5lKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgdXBkYXRlU2NlbmUoaW5mbykge1xuICAgIGxldCBpbmRleCA9IGluZm9bMV07XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIGluZGV4ICogUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tpbmZvW29mZnNldF1dO1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgIGNvbnN0IGRhdGEgPSBjb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID09PSBmYWxzZSkge1xuICAgICAgICBvYmplY3QucG9zaXRpb24uc2V0KFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAyXSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDNdXG4gICAgICAgICk7XG5cbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNF0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA1XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDZdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgN11cbiAgICAgICAgKTtcblxuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGRhdGEubGluZWFyVmVsb2NpdHkuc2V0KFxuICAgICAgICBpbmZvW29mZnNldCArIDhdLFxuICAgICAgICBpbmZvW29mZnNldCArIDldLFxuICAgICAgICBpbmZvW29mZnNldCArIDEwXVxuICAgICAgKTtcblxuICAgICAgZGF0YS5hbmd1bGFyVmVsb2NpdHkuc2V0KFxuICAgICAgICBpbmZvW29mZnNldCArIDExXSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMl0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTNdXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShpbmZvLmJ1ZmZlciwgW2luZm8uYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuXG4gICAgdGhpcy5faXNfc2ltdWxhdGluZyA9IGZhbHNlO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgndXBkYXRlJyk7XG4gIH1cblxuICB1cGRhdGVTb2Z0Ym9kaWVzKGRhdGEpIHtcbiAgICBsZXQgaW5kZXggPSBkYXRhWzFdLFxuICAgICAgb2Zmc2V0ID0gMjtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBzaXplID0gZGF0YVtvZmZzZXQgKyAxXTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMuX29iamVjdHNbZGF0YVtvZmZzZXRdXTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IF9waHlzaWpzID0gb2JqZWN0LmNvbXBvbmVudC5fcGh5c2lqcztcblxuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IG9iamVjdC5nZW9tZXRyeS5hdHRyaWJ1dGVzO1xuICAgICAgY29uc3Qgdm9sdW1lUG9zaXRpb25zID0gYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgY29uc3Qgb2Zmc2V0VmVydCA9IG9mZnNldCArIDI7XG5cbiAgICAgIGlmICghX3BoeXNpanMuaXNTb2Z0Qm9keVJlc2V0KSB7XG4gICAgICAgIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIG9iamVjdC5xdWF0ZXJuaW9uLnNldCgwLCAwLCAwLCAwKTtcblxuICAgICAgICBfcGh5c2lqcy5pc1NvZnRCb2R5UmVzZXQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoX3BoeXNpanMudHlwZSA9PT0gXCJzb2Z0VHJpbWVzaFwiKSB7XG4gICAgICAgIGNvbnN0IHZvbHVtZU5vcm1hbHMgPSBhdHRyaWJ1dGVzLm5vcm1hbC5hcnJheTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDE4O1xuXG4gICAgICAgICAgY29uc3QgeDEgPSBkYXRhW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkxID0gZGF0YVtvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgejEgPSBkYXRhW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54MSA9IGRhdGFbb2ZmcyArIDNdO1xuICAgICAgICAgIGNvbnN0IG55MSA9IGRhdGFbb2ZmcyArIDRdO1xuICAgICAgICAgIGNvbnN0IG56MSA9IGRhdGFbb2ZmcyArIDVdO1xuXG4gICAgICAgICAgY29uc3QgeDIgPSBkYXRhW29mZnMgKyA2XTtcbiAgICAgICAgICBjb25zdCB5MiA9IGRhdGFbb2ZmcyArIDddO1xuICAgICAgICAgIGNvbnN0IHoyID0gZGF0YVtvZmZzICsgOF07XG5cbiAgICAgICAgICBjb25zdCBueDIgPSBkYXRhW29mZnMgKyA5XTtcbiAgICAgICAgICBjb25zdCBueTIgPSBkYXRhW29mZnMgKyAxMF07XG4gICAgICAgICAgY29uc3QgbnoyID0gZGF0YVtvZmZzICsgMTFdO1xuXG4gICAgICAgICAgY29uc3QgeDMgPSBkYXRhW29mZnMgKyAxMl07XG4gICAgICAgICAgY29uc3QgeTMgPSBkYXRhW29mZnMgKyAxM107XG4gICAgICAgICAgY29uc3QgejMgPSBkYXRhW29mZnMgKyAxNF07XG5cbiAgICAgICAgICBjb25zdCBueDMgPSBkYXRhW29mZnMgKyAxNV07XG4gICAgICAgICAgY29uc3QgbnkzID0gZGF0YVtvZmZzICsgMTZdO1xuICAgICAgICAgIGNvbnN0IG56MyA9IGRhdGFbb2ZmcyArIDE3XTtcblxuICAgICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTldID0geDE7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgMV0gPSB5MTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAyXSA9IHoxO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgM10gPSB4MjtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA0XSA9IHkyO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDVdID0gejI7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA2XSA9IHgzO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDddID0geTM7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgOF0gPSB6MztcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTldID0gbngxO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAxXSA9IG55MTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgMl0gPSBuejE7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgM10gPSBueDI7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDRdID0gbnkyO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA1XSA9IG56MjtcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA2XSA9IG54MztcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgN10gPSBueTM7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDhdID0gbnozO1xuICAgICAgICB9XG5cbiAgICAgICAgYXR0cmlidXRlcy5ub3JtYWwubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiAxODtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKF9waHlzaWpzLnR5cGUgPT09IFwic29mdFJvcGVNZXNoXCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiAzO1xuXG4gICAgICAgICAgY29uc3QgeCA9IGRhdGFbb2Zmc107XG4gICAgICAgICAgY29uc3QgeSA9IGRhdGFbb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHogPSBkYXRhW29mZnMgKyAyXTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogM10gPSB4O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDFdID0geTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAyXSA9IHo7XG4gICAgICAgIH1cblxuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiAzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgdm9sdW1lTm9ybWFscyA9IGF0dHJpYnV0ZXMubm9ybWFsLmFycmF5O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogNjtcblxuICAgICAgICAgIGNvbnN0IHggPSBkYXRhW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkgPSBkYXRhW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6ID0gZGF0YVtvZmZzICsgMl07XG5cbiAgICAgICAgICBjb25zdCBueCA9IGRhdGFbb2ZmcyArIDNdO1xuICAgICAgICAgIGNvbnN0IG55ID0gZGF0YVtvZmZzICsgNF07XG4gICAgICAgICAgY29uc3QgbnogPSBkYXRhW29mZnMgKyA1XTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogM10gPSB4O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDFdID0geTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAyXSA9IHo7XG5cbiAgICAgICAgICAvLyBGSVhNRTogTm9ybWFscyBhcmUgcG9pbnRlZCB0byBsb29rIGluc2lkZTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2kgKiAzXSA9IG54O1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDMgKyAxXSA9IG55O1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDMgKyAyXSA9IG56O1xuICAgICAgICB9XG5cbiAgICAgICAgYXR0cmlidXRlcy5ub3JtYWwubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiA2O1xuICAgICAgfVxuXG4gICAgICBhdHRyaWJ1dGVzLnBvc2l0aW9uLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAvLyAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcblxuICAgIHRoaXMuX2lzX3NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIHVwZGF0ZVZlaGljbGVzKGRhdGEpIHtcbiAgICBsZXQgdmVoaWNsZSwgd2hlZWw7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IChkYXRhLmxlbmd0aCAtIDEpIC8gVkVISUNMRVJFUE9SVF9JVEVNU0laRTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAxICsgaSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkU7XG4gICAgICB2ZWhpY2xlID0gdGhpcy5fdmVoaWNsZXNbZGF0YVtvZmZzZXRdXTtcblxuICAgICAgaWYgKHZlaGljbGUgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICB3aGVlbCA9IHZlaGljbGUud2hlZWxzW2RhdGFbb2Zmc2V0ICsgMV1dO1xuXG4gICAgICB3aGVlbC5wb3NpdGlvbi5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgMl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgM10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNF1cbiAgICAgICk7XG5cbiAgICAgIHdoZWVsLnF1YXRlcm5pb24uc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDVdLFxuICAgICAgICBkYXRhW29mZnNldCArIDZdLFxuICAgICAgICBkYXRhW29mZnNldCArIDddLFxuICAgICAgICBkYXRhW29mZnNldCArIDhdXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29uc3RyYWludHMoZGF0YSkge1xuICAgIGxldCBjb25zdHJhaW50LCBvYmplY3Q7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IChkYXRhLmxlbmd0aCAtIDEpIC8gQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAxICsgaSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdHJhaW50ID0gdGhpcy5fY29uc3RyYWludHNbZGF0YVtvZmZzZXRdXTtcbiAgICAgIG9iamVjdCA9IHRoaXMuX29iamVjdHNbZGF0YVtvZmZzZXQgKyAxXV07XG5cbiAgICAgIGlmIChjb25zdHJhaW50ID09PSB1bmRlZmluZWQgfHwgb2JqZWN0ID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDJdLFxuICAgICAgICBkYXRhW29mZnNldCArIDNdLFxuICAgICAgICBkYXRhW29mZnNldCArIDRdXG4gICAgICApO1xuXG4gICAgICB0ZW1wMU1hdHJpeDQuZXh0cmFjdFJvdGF0aW9uKG9iamVjdC5tYXRyaXgpO1xuICAgICAgdGVtcDFWZWN0b3IzLmFwcGx5TWF0cml4NCh0ZW1wMU1hdHJpeDQpO1xuXG4gICAgICBjb25zdHJhaW50LnBvc2l0aW9uYS5hZGRWZWN0b3JzKG9iamVjdC5wb3NpdGlvbiwgdGVtcDFWZWN0b3IzKTtcbiAgICAgIGNvbnN0cmFpbnQuYXBwbGllZEltcHVsc2UgPSBkYXRhW29mZnNldCArIDVdO1xuICAgIH1cblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29sbGlzaW9ucyhkYXRhKSB7XG4gICAgLyoqXG4gICAgICogI1RPRE9cbiAgICAgKiBUaGlzIGlzIHByb2JhYmx5IHRoZSB3b3JzdCB3YXkgZXZlciB0byBoYW5kbGUgY29sbGlzaW9ucy4gVGhlIGluaGVyZW50IGV2aWxuZXNzIGlzIGEgcmVzaWR1YWxcbiAgICAgKiBlZmZlY3QgZnJvbSB0aGUgcHJldmlvdXMgdmVyc2lvbidzIGV2aWxuZXNzIHdoaWNoIG11dGF0ZWQgd2hlbiBzd2l0Y2hpbmcgdG8gdHJhbnNmZXJhYmxlIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgZmVlbCBpbmNsaW5lZCB0byBtYWtlIHRoaXMgYmV0dGVyLCBwbGVhc2UgZG8gc28uXG4gICAgICovXG5cbiAgICBjb25zdCBjb2xsaXNpb25zID0ge30sXG4gICAgICBub3JtYWxfb2Zmc2V0cyA9IHt9O1xuXG4gICAgLy8gQnVpbGQgY29sbGlzaW9uIG1hbmlmZXN0XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhWzFdOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyBpICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gZGF0YVtvZmZzZXRdO1xuICAgICAgY29uc3Qgb2JqZWN0MiA9IGRhdGFbb2Zmc2V0ICsgMV07XG5cbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdH0tJHtvYmplY3QyfWBdID0gb2Zmc2V0ICsgMjtcbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdDJ9LSR7b2JqZWN0fWBdID0gLTEgKiAob2Zmc2V0ICsgMik7XG5cbiAgICAgIC8vIFJlZ2lzdGVyIGNvbGxpc2lvbnMgZm9yIGJvdGggdGhlIG9iamVjdCBjb2xsaWRpbmcgYW5kIHRoZSBvYmplY3QgYmVpbmcgY29sbGlkZWQgd2l0aFxuICAgICAgaWYgKCFjb2xsaXNpb25zW29iamVjdF0pIGNvbGxpc2lvbnNbb2JqZWN0XSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3RdLnB1c2gob2JqZWN0Mik7XG5cbiAgICAgIGlmICghY29sbGlzaW9uc1tvYmplY3QyXSkgY29sbGlzaW9uc1tvYmplY3QyXSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3QyXS5wdXNoKG9iamVjdCk7XG4gICAgfVxuXG4gICAgLy8gRGVhbCB3aXRoIGNvbGxpc2lvbnNcbiAgICBmb3IgKGNvbnN0IGlkMSBpbiB0aGlzLl9vYmplY3RzKSB7XG4gICAgICBpZiAoIXRoaXMuX29iamVjdHMuaGFzT3duUHJvcGVydHkoaWQxKSkgY29udGludWU7XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLl9vYmplY3RzW2lkMV07XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgLy8gSWYgb2JqZWN0IHRvdWNoZXMgYW55dGhpbmcsIC4uLlxuICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXSkge1xuICAgICAgICAvLyBDbGVhbiB1cCB0b3VjaGVzIGFycmF5XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGF0YS50b3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXS5pbmRleE9mKGRhdGEudG91Y2hlc1tqXSkgPT09IC0xKVxuICAgICAgICAgICAgZGF0YS50b3VjaGVzLnNwbGljZShqLS0sIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIGVhY2ggY29sbGlkaW5nIG9iamVjdFxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbGxpc2lvbnNbaWQxXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGlkMiA9IGNvbGxpc2lvbnNbaWQxXVtqXTtcbiAgICAgICAgICBjb25zdCBvYmplY3QyID0gdGhpcy5fb2JqZWN0c1tpZDJdO1xuICAgICAgICAgIGNvbnN0IGNvbXBvbmVudDIgPSBvYmplY3QyLmNvbXBvbmVudDtcbiAgICAgICAgICBjb25zdCBkYXRhMiA9IGNvbXBvbmVudDIudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgICAgIGlmIChvYmplY3QyKSB7XG4gICAgICAgICAgICAvLyBJZiBvYmplY3Qgd2FzIG5vdCBhbHJlYWR5IHRvdWNoaW5nIG9iamVjdDIsIG5vdGlmeSBvYmplY3RcbiAgICAgICAgICAgIGlmIChkYXRhLnRvdWNoZXMuaW5kZXhPZihpZDIpID09PSAtMSkge1xuICAgICAgICAgICAgICBkYXRhLnRvdWNoZXMucHVzaChpZDIpO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHZlbCA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuICAgICAgICAgICAgICBjb25zdCB2ZWwyID0gY29tcG9uZW50Mi51c2UoJ3BoeXNpY3MnKS5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuXG4gICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zdWJWZWN0b3JzKHZlbCwgdmVsMik7XG4gICAgICAgICAgICAgIGNvbnN0IHRlbXAxID0gdGVtcDFWZWN0b3IzLmNsb25lKCk7XG4gICAgICAgICAgICAgIGNvbnN0IHRlbXAyID0gdGVtcDFWZWN0b3IzLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgbGV0IG5vcm1hbF9vZmZzZXQgPSBub3JtYWxfb2Zmc2V0c1tgJHtkYXRhLmlkfS0ke2RhdGEyLmlkfWBdO1xuXG4gICAgICAgICAgICAgIGlmIChub3JtYWxfb2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgICAgICAgICAgICAtZGF0YVtub3JtYWxfb2Zmc2V0XSxcbiAgICAgICAgICAgICAgICAgIC1kYXRhW25vcm1hbF9vZmZzZXQgKyAxXSxcbiAgICAgICAgICAgICAgICAgIC1kYXRhW25vcm1hbF9vZmZzZXQgKyAyXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9ybWFsX29mZnNldCAqPSAtMTtcblxuICAgICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgICAgICAgICAgICBkYXRhW25vcm1hbF9vZmZzZXRdLFxuICAgICAgICAgICAgICAgICAgZGF0YVtub3JtYWxfb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgICAgICAgICBkYXRhW25vcm1hbF9vZmZzZXQgKyAyXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb21wb25lbnQuZW1pdCgnY29sbGlzaW9uJywgb2JqZWN0MiwgdGVtcDEsIHRlbXAyLCB0ZW1wMVZlY3RvcjMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGRhdGEudG91Y2hlcy5sZW5ndGggPSAwOyAvLyBub3QgdG91Y2hpbmcgb3RoZXIgb2JqZWN0c1xuICAgIH1cblxuICAgIHRoaXMuY29sbGlzaW9ucyA9IGNvbGxpc2lvbnM7XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIGFkZENvbnN0cmFpbnQoY29uc3RyYWludCwgc2hvd19tYXJrZXIpIHtcbiAgICBjb25zdHJhaW50LmlkID0gdGhpcy5nZXRPYmplY3RJZCgpO1xuICAgIHRoaXMuX2NvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdID0gY29uc3RyYWludDtcbiAgICBjb25zdHJhaW50LndvcmxkTW9kdWxlID0gdGhpcztcbiAgICB0aGlzLmV4ZWN1dGUoJ2FkZENvbnN0cmFpbnQnLCBjb25zdHJhaW50LmdldERlZmluaXRpb24oKSk7XG5cbiAgICBpZiAoc2hvd19tYXJrZXIpIHtcbiAgICAgIGxldCBtYXJrZXI7XG5cbiAgICAgIHN3aXRjaCAoY29uc3RyYWludC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ3BvaW50JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnaGluZ2UnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMuX29iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzbGlkZXInOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IEJveEdlb21ldHJ5KDEwLCAxLCAxKSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG5cbiAgICAgICAgICAvLyBUaGlzIHJvdGF0aW9uIGlzbid0IHJpZ2h0IGlmIGFsbCB0aHJlZSBheGlzIGFyZSBub24tMCB2YWx1ZXNcbiAgICAgICAgICAvLyBUT0RPOiBjaGFuZ2UgbWFya2VyJ3Mgcm90YXRpb24gb3JkZXIgdG8gWllYXG4gICAgICAgICAgbWFya2VyLnJvdGF0aW9uLnNldChcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy55LCAvLyB5ZXMsIHkgYW5kXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMueCwgLy8geCBheGlzIGFyZSBzd2FwcGVkXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMuelxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2NvbmV0d2lzdCc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2RvZic6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb25zdHJhaW50O1xuICB9XG5cbiAgb25TaW11bGF0aW9uUmVzdW1lKCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnb25TaW11bGF0aW9uUmVzdW1lJywge30pO1xuICB9XG5cbiAgcmVtb3ZlQ29uc3RyYWludChjb25zdHJhaW50KSB7XG4gICAgaWYgKHRoaXMuX2NvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlQ29uc3RyYWludCcsIHtpZDogY29uc3RyYWludC5pZH0pO1xuICAgICAgZGVsZXRlIHRoaXMuX2NvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdO1xuICAgIH1cbiAgfVxuXG4gIGV4ZWN1dGUoY21kLCBwYXJhbXMpIHtcbiAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZSh7Y21kLCBwYXJhbXN9KTtcbiAgfVxuXG4gIG9uQWRkQ2FsbGJhY2soY29tcG9uZW50KSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gY29tcG9uZW50Lm5hdGl2ZTtcbiAgICBjb25zdCBkYXRhID0gb2JqZWN0LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnNldCgnbW9kdWxlOndvcmxkJywgdGhpcyk7XG4gICAgICBkYXRhLmlkID0gdGhpcy5nZXRPYmplY3RJZCgpO1xuXG4gICAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVmVoaWNsZSkge1xuICAgICAgICB0aGlzLm9uQWRkQ2FsbGJhY2sob2JqZWN0Lm1lc2gpO1xuICAgICAgICB0aGlzLl92ZWhpY2xlc1tkYXRhLmlkXSA9IG9iamVjdDtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRWZWhpY2xlJywgZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fb2JqZWN0c1tkYXRhLmlkXSA9IG9iamVjdDtcblxuICAgICAgICBpZiAob2JqZWN0LmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgIGRhdGEuY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgICBhZGRPYmplY3RDaGlsZHJlbihvYmplY3QsIG9iamVjdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzLmhhc093blByb3BlcnR5KG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZCkpXG4gICAgICAgICAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdKys7XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGUoJ3JlZ2lzdGVyTWF0ZXJpYWwnLCBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMpO1xuICAgICAgICAgICAgZGF0YS5tYXRlcmlhbElkID0gb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkO1xuICAgICAgICAgICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXSA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gb2JqZWN0LnF1YXRlcm5pb24uc2V0RnJvbUV1bGVyKG9iamVjdC5yb3RhdGlvbik7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdC5jb21wb25lbnQpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhvYmplY3Qucm90YXRpb24pO1xuXG4gICAgICAgIC8vIE9iamVjdCBzdGFydGluZyBwb3NpdGlvbiArIHJvdGF0aW9uXG4gICAgICAgIGRhdGEucG9zaXRpb24gPSB7XG4gICAgICAgICAgeDogb2JqZWN0LnBvc2l0aW9uLngsXG4gICAgICAgICAgeTogb2JqZWN0LnBvc2l0aW9uLnksXG4gICAgICAgICAgejogb2JqZWN0LnBvc2l0aW9uLnpcbiAgICAgICAgfTtcblxuICAgICAgICBkYXRhLnJvdGF0aW9uID0ge1xuICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgeTogb2JqZWN0LnF1YXRlcm5pb24ueSxcbiAgICAgICAgICB6OiBvYmplY3QucXVhdGVybmlvbi56LFxuICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoZGF0YS53aWR0aCkgZGF0YS53aWR0aCAqPSBvYmplY3Quc2NhbGUueDtcbiAgICAgICAgaWYgKGRhdGEuaGVpZ2h0KSBkYXRhLmhlaWdodCAqPSBvYmplY3Quc2NhbGUueTtcbiAgICAgICAgaWYgKGRhdGEuZGVwdGgpIGRhdGEuZGVwdGggKj0gb2JqZWN0LnNjYWxlLno7XG5cbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRPYmplY3QnLCBkYXRhKTtcbiAgICAgIH1cblxuICAgICAgY29tcG9uZW50LmVtaXQoJ3BoeXNpY3M6YWRkZWQnKTtcbiAgICB9XG4gIH1cblxuICBvblJlbW92ZUNhbGxiYWNrKGNvbXBvbmVudCkge1xuICAgIGNvbnN0IG9iamVjdCA9IGNvbXBvbmVudC5uYXRpdmU7XG5cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVmVoaWNsZSkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVWZWhpY2xlJywge2lkOiBvYmplY3QuX3BoeXNpanMuaWR9KTtcbiAgICAgIHdoaWxlIChvYmplY3Qud2hlZWxzLmxlbmd0aCkgdGhpcy5yZW1vdmUob2JqZWN0LndoZWVscy5wb3AoKSk7XG5cbiAgICAgIHRoaXMucmVtb3ZlKG9iamVjdC5tZXNoKTtcbiAgICAgIHRoaXMuX3ZlaGljbGVzW29iamVjdC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNZXNoLnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzLCBvYmplY3QpO1xuXG4gICAgICBpZiAob2JqZWN0Ll9waHlzaWpzKSB7XG4gICAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnJlbW92ZSgnbW9kdWxlOndvcmxkJyk7XG4gICAgICAgIHRoaXMuX29iamVjdHNbb2JqZWN0Ll9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlT2JqZWN0Jywge2lkOiBvYmplY3QuX3BoeXNpanMuaWR9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9iamVjdC5tYXRlcmlhbCAmJiBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMgJiYgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHMuaGFzT3duUHJvcGVydHkob2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkKSkge1xuICAgICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXS0tO1xuXG4gICAgICBpZiAodGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXSA9PT0gMCkge1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ3VuUmVnaXN0ZXJNYXRlcmlhbCcsIG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcyk7XG4gICAgICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRlZmVyKGZ1bmMsIGFyZ3MpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzTG9hZGVkKSB7XG4gICAgICAgIGZ1bmMoLi4uYXJncyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB0aGlzLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICBtYW5hZ2VyLnNldCgncGh5c2ljc1dvcmtlcicsIHRoaXMud29ya2VyKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBvbkFkZChjb21wb25lbnQsIHNlbGYpIHtcbiAgICAgIGlmIChjb21wb25lbnQudXNlKCdwaHlzaWNzJykpIHJldHVybiBzZWxmLmRlZmVyKHNlbGYub25BZGRDYWxsYmFjay5iaW5kKHNlbGYpLCBbY29tcG9uZW50XSk7XG4gICAgICByZXR1cm47XG4gICAgfSxcblxuICAgIG9uUmVtb3ZlKGNvbXBvbmVudCwgc2VsZikge1xuICAgICAgaWYgKGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSkgcmV0dXJuIHNlbGYuZGVmZXIoc2VsZi5vblJlbW92ZUNhbGxiYWNrLmJpbmQoc2VsZiksIFtjb21wb25lbnRdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIC8vIC4uLlxuXG4gICAgdGhpcy5zZXRGaXhlZFRpbWVTdGVwID0gZnVuY3Rpb24oZml4ZWRUaW1lU3RlcCkge1xuICAgICAgaWYgKGZpeGVkVGltZVN0ZXApIHNlbGYuZXhlY3V0ZSgnc2V0Rml4ZWRUaW1lU3RlcCcsIGZpeGVkVGltZVN0ZXApO1xuICAgIH1cblxuICAgIHRoaXMuc2V0R3Jhdml0eSA9IGZ1bmN0aW9uKGdyYXZpdHkpIHtcbiAgICAgIGlmIChncmF2aXR5KSBzZWxmLmV4ZWN1dGUoJ3NldEdyYXZpdHknLCBncmF2aXR5KTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZENvbnN0cmFpbnQgPSBzZWxmLmFkZENvbnN0cmFpbnQuYmluZChzZWxmKTtcblxuICAgIHRoaXMuc2ltdWxhdGUgPSBmdW5jdGlvbih0aW1lU3RlcCwgbWF4U3ViU3RlcHMpIHtcbiAgICAgIGlmIChzZWxmLl9zdGF0cykgc2VsZi5fc3RhdHMuYmVnaW4oKTtcblxuICAgICAgaWYgKHNlbGYuX2lzX3NpbXVsYXRpbmcpIHJldHVybiBmYWxzZTtcblxuICAgICAgc2VsZi5faXNfc2ltdWxhdGluZyA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3Qgb2JqZWN0X2lkIGluIHNlbGYuX29iamVjdHMpIHtcbiAgICAgICAgaWYgKCFzZWxmLl9vYmplY3RzLmhhc093blByb3BlcnR5KG9iamVjdF9pZCkpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHNlbGYuX29iamVjdHNbb2JqZWN0X2lkXTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICAgIGlmIChvYmplY3QgIT09IG51bGwgJiYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gfHwgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikpIHtcbiAgICAgICAgICBjb25zdCB1cGRhdGUgPSB7aWQ6IGRhdGEuaWR9O1xuXG4gICAgICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24pIHtcbiAgICAgICAgICAgIHVwZGF0ZS5wb3MgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICB5OiBvYmplY3QucG9zaXRpb24ueSxcbiAgICAgICAgICAgICAgejogb2JqZWN0LnBvc2l0aW9uLnpcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnF1YXQgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5xdWF0ZXJuaW9uLnksXG4gICAgICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLmV4ZWN1dGUoJ3VwZGF0ZVRyYW5zZm9ybScsIHVwZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5leGVjdXRlKCdzaW11bGF0ZScsIHt0aW1lU3RlcCwgbWF4U3ViU3RlcHN9KTtcblxuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5lbmQoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGNvbnN0IHNpbXVsYXRlUHJvY2VzcyA9ICh0KSA9PiB7XG4gICAgLy8gICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHNpbXVsYXRlUHJvY2Vzcyk7XG5cbiAgICAvLyAgIHRoaXMuc2ltdWxhdGUoMS82MCwgMSk7IC8vIGRlbHRhLCAxXG4gICAgLy8gfVxuXG4gICAgLy8gc2ltdWxhdGVQcm9jZXNzKCk7XG5cbiAgICBzZWxmLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgIHNlbGYuc2ltdWxhdGVMb29wID0gbmV3IExvb3AoKGNsb2NrKSA9PiB7XG4gICAgICAgIHRoaXMuc2ltdWxhdGUoY2xvY2suZ2V0RGVsdGEoKSwgMSk7IC8vIGRlbHRhLCAxXG4gICAgICB9KTtcblxuICAgICAgc2VsZi5zaW11bGF0ZUxvb3Auc3RhcnQodGhpcyk7XG5cbiAgICAgIHRoaXMuc2V0R3Jhdml0eShwYXJhbXMuZ3Jhdml0eSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7UXVhdGVybmlvbn0gZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgY29uc3QgcHJvcGVydGllcyA9IHtcbiAgcG9zaXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQodmVjdG9yMykge1xuICAgICAgY29uc3QgcG9zID0gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzO1xuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhwb3MsIHtcbiAgICAgICAgeDoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl94O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeCkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ggPSB4O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgeToge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl95O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeSkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3kgPSB5O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgejoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl96O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeikge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ogPSB6O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHNjb3BlLl9fZGlydHlQb3NpdGlvbiA9IHRydWU7XG5cbiAgICAgIHBvcy5jb3B5KHZlY3RvcjMpO1xuICAgIH1cbiAgfSxcblxuICBxdWF0ZXJuaW9uOiB7XG4gICAgZ2V0KCkge1xuICAgICAgdGhpcy5fX2Nfcm90ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLm5hdGl2ZS5xdWF0ZXJuaW9uO1xuICAgIH0sXG5cbiAgICBzZXQocXVhdGVybmlvbikge1xuICAgICAgY29uc3QgcXVhdCA9IHRoaXMuX25hdGl2ZS5xdWF0ZXJuaW9uLFxuICAgICAgICBuYXRpdmUgPSB0aGlzLl9uYXRpdmU7XG5cbiAgICAgIHF1YXQuY29weShxdWF0ZXJuaW9uKTtcblxuICAgICAgcXVhdC5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9fY19yb3QpIHtcbiAgICAgICAgICBpZiAobmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5fX2Nfcm90ID0gZmFsc2U7XG4gICAgICAgICAgICBuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgcm90YXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMuX25hdGl2ZS5yb3RhdGlvbjtcbiAgICB9LFxuXG4gICAgc2V0KGV1bGVyKSB7XG4gICAgICBjb25zdCByb3QgPSB0aGlzLl9uYXRpdmUucm90YXRpb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoZXVsZXIpKTtcblxuICAgICAgcm90Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIHRoaXMucXVhdGVybmlvbi5jb3B5KG5ldyBRdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHJvdCkpO1xuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyYXBQaHlzaWNzUHJvdG90eXBlKHNjb3BlKSB7XG4gIGZvciAobGV0IGtleSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNjb3BlLCBrZXksIHtcbiAgICAgIGdldDogcHJvcGVydGllc1trZXldLmdldC5iaW5kKHNjb3BlKSxcbiAgICAgIHNldDogcHJvcGVydGllc1trZXldLnNldC5iaW5kKHNjb3BlKSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb25Db3B5KHNvdXJjZSkge1xuICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgdGhpcy5fcGh5c2lqcyA9IHsuLi5zb3VyY2UuX3BoeXNpanN9O1xuICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5jbG9uZSgpO1xuICB0aGlzLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbi5jbG9uZSgpO1xuICB0aGlzLnF1YXRlcm5pb24gPSB0aGlzLnF1YXRlcm5pb24uY2xvbmUoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uV3JhcCgpIHtcbiAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucm90YXRpb24uY2xvbmUoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gdGhpcy5xdWF0ZXJuaW9uLmNsb25lKCk7XG59XG4iLCJpbXBvcnQge1ZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5jbGFzcyBBUEkge1xuICBhcHBseUNlbnRyYWxJbXB1bHNlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUNlbnRyYWxJbXB1bHNlJywge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZvcmNlLngsIHk6IGZvcmNlLnksIHo6IGZvcmNlLnp9KTtcbiAgfVxuXG4gIGFwcGx5SW1wdWxzZShmb3JjZSwgb2Zmc2V0KSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUltcHVsc2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgaW1wdWxzZV94OiBmb3JjZS54LFxuICAgICAgaW1wdWxzZV95OiBmb3JjZS55LFxuICAgICAgaW1wdWxzZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseVRvcnF1ZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlUb3JxdWUnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgdG9ycXVlX3g6IGZvcmNlLngsXG4gICAgICB0b3JxdWVfeTogZm9yY2UueSxcbiAgICAgIHRvcnF1ZV96OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUNlbnRyYWxGb3JjZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlDZW50cmFsRm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgeDogZm9yY2UueCxcbiAgICAgIHk6IGZvcmNlLnksXG4gICAgICB6OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUZvcmNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Rm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgZm9yY2VfeDogZm9yY2UueCxcbiAgICAgIGZvcmNlX3k6IGZvcmNlLnksXG4gICAgICBmb3JjZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBnZXRBbmd1bGFyVmVsb2NpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5hbmd1bGFyVmVsb2NpdHk7XG4gIH1cblxuICBzZXRBbmd1bGFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0QW5ndWxhclZlbG9jaXR5JyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiB2ZWxvY2l0eS54LCB5OiB2ZWxvY2l0eS55LCB6OiB2ZWxvY2l0eS56fVxuICAgICk7XG4gIH1cblxuICBnZXRMaW5lYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmxpbmVhclZlbG9jaXR5O1xuICB9XG5cbiAgc2V0TGluZWFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyVmVsb2NpdHknLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJGYWN0b3IoZmFjdG9yKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldEFuZ3VsYXJGYWN0b3InLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldExpbmVhckZhY3RvcihmYWN0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyRmFjdG9yJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiBmYWN0b3IueCwgeTogZmFjdG9yLnksIHo6IGZhY3Rvci56fVxuICAgICk7XG4gIH1cblxuICBzZXREYW1waW5nKGxpbmVhciwgYW5ndWxhcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXREYW1waW5nJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCBsaW5lYXIsIGFuZ3VsYXJ9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZE1vdGlvblRocmVzaG9sZCh0aHJlc2hvbGQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0Q2NkTW90aW9uVGhyZXNob2xkJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB0aHJlc2hvbGR9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKHJhZGl1cykge1xuICAgIHRoaXMuZXhlY3V0ZSgnc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMnLCB7aWQ6IHRoaXMuZGF0YS5pZCwgcmFkaXVzfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgZXh0ZW5kcyBBUEkge1xuICBzdGF0aWMgcmlnaWRib2R5ID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgbWFzczogMTAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMFxuICB9KTtcblxuICBjb25zdHJ1Y3RvcihkZWZhdWx0cywgZGF0YSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbihkZWZhdWx0cywgZGF0YSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgbWFuYWdlci5kZWZpbmUoJ3BoeXNpY3MnKTtcblxuICAgIHRoaXMuZXhlY3V0ZSA9ICguLi5kYXRhKSA9PiB7XG4gICAgICByZXR1cm4gbWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpXG4gICAgICA/IG1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKC4uLmRhdGEpXG4gICAgICA6ICgpID0+IHt9O1xuICAgIH07XG4gIH1cblxuICB1cGRhdGVEYXRhKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5icmlkZ2UuZ2VvbWV0cnkgPSBmdW5jdGlvbiAoZ2VvbWV0cnksIG1vZHVsZSkge1xuICAgICAgY2FsbGJhY2soZ2VvbWV0cnksIG1vZHVsZSk7XG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfVxuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfTtcbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBCb3hNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2JveCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgZGF0YS5oZWlnaHQgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgZGF0YS5kZXB0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yM30gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb3VuZE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMFxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjb21wb3VuZCcsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpblxuICAgIH07XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL1BoeXNpY3NNb2R1bGUnO1xuXG4vLyBUT0RPOiBUZXN0IENhcHN1bGVNb2R1bGUgaW4gYWN0aW9uLlxuZXhwb3J0IGNsYXNzIENhcHN1bGVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NhcHN1bGUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEuZGVwdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge1ZlY3RvcjMsIE11bHRpTWF0ZXJpYWwsIE1lc2gsIEpTT05Mb2FkZXJ9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uY2F2ZU1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGxvYWRlcjogbmV3IEpTT05Mb2FkZXIoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICBpZiAodGhpcy5wYXJhbXMucGF0aCAmJiB0aGlzLnBhcmFtcy5sb2FkZXIpIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnlMb2FkZXIgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMucGFyYW1zLmxvYWRlci5sb2FkKFxuICAgICAgICAgIHRoaXMucGFyYW1zLnBhdGgsXG4gICAgICAgICAgcmVzb2x2ZSxcbiAgICAgICAgICAoKSA9PiB7fSxcbiAgICAgICAgICByZWplY3RcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGdlb21ldHJ5UHJvY2Vzc29yKGdlb21ldHJ5KSB7XG4gICAgY29uc3QgaXNCdWZmZXIgPSBnZW9tZXRyeS50eXBlID09PSAnQnVmZmVyR2VvbWV0cnknO1xuXG4gICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICBjb25zdCBkYXRhID0gaXNCdWZmZXIgP1xuICAgICAgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6XG4gICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDkpO1xuXG4gICAgaWYgKCFpc0J1ZmZlcikge1xuICAgICAgY29uc3QgdmVydGljZXMgPSBnZW9tZXRyeS52ZXJ0aWNlcztcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICAgICAgY29uc3QgdkEgPSB2ZXJ0aWNlc1tmYWNlLmFdO1xuICAgICAgICBjb25zdCB2QiA9IHZlcnRpY2VzW2ZhY2UuYl07XG4gICAgICAgIGNvbnN0IHZDID0gdmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgICBjb25zdCBpOSA9IGkgKiA5O1xuXG4gICAgICAgIGRhdGFbaTldID0gdkEueDtcbiAgICAgICAgZGF0YVtpOSArIDFdID0gdkEueTtcbiAgICAgICAgZGF0YVtpOSArIDJdID0gdkEuejtcblxuICAgICAgICBkYXRhW2k5ICsgM10gPSB2Qi54O1xuICAgICAgICBkYXRhW2k5ICsgNF0gPSB2Qi55O1xuICAgICAgICBkYXRhW2k5ICsgNV0gPSB2Qi56O1xuXG4gICAgICAgIGRhdGFbaTkgKyA2XSA9IHZDLng7XG4gICAgICAgIGRhdGFbaTkgKyA3XSA9IHZDLnk7XG4gICAgICAgIGRhdGFbaTkgKyA4XSA9IHZDLno7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnY29uY2F2ZScsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZVxuICAgIH07XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSwgc2VsZikge1xuICAgICAgaWYgKHNlbGYucGFyYW1zLnBhdGgpIHtcbiAgICAgICAgdGhpcy53YWl0KHNlbGYuZ2VvbWV0cnlMb2FkZXIpO1xuXG4gICAgICAgIHNlbGYuZ2VvbWV0cnlMb2FkZXJcbiAgICAgICAgICAudGhlbihnZW9tID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3BoeXNpanMuZGF0YSA9IHNlbGYuZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbSlcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3BoeXNpanMuZGF0YSA9IHNlbGYuZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIENvbmVNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbWFzczogMTAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgICByZXN0aXR1dGlvbjogMC4zLFxuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDBcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnY29uZScsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLnJhZGl1cyA9IChnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54KSAvIDI7XG4gICAgICB0aGlzLl9waHlzaWpzLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IHtWZWN0b3IzLCBCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDb252ZXhNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbWFzczogMTAsXG4gICAgICByZXN0aXR1dGlvbjogMC4zLFxuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnY29udmV4JyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG1lc2gobWVzaCkge1xuICAgICAgY29uc3QgZ2VvbWV0cnkgPSBtZXNoLmdlb21ldHJ5O1xuXG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgY29uc3QgaXNCdWZmZXIgPSBnZW9tZXRyeS50eXBlID09PSAnQnVmZmVyR2VvbWV0cnknO1xuXG4gICAgICBpZiAoIWlzQnVmZmVyKSBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKS5mcm9tR2VvbWV0cnkoZ2VvbWV0cnkpO1xuXG4gICAgICBjb25zdCBkYXRhID0gaXNCdWZmZXIgP1xuICAgICAgICBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDpcbiAgICAgICAgZ2VvbWV0cnkuX2J1ZmZlckdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMuZGF0YSA9IGRhdGE7XG5cbiAgICAgIHJldHVybiBtZXNoO1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yM30gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDeWxpbmRlck1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjeWxpbmRlcicsXG4gICAgICB3aWR0aDogcGFyYW1zLndpZHRoLFxuICAgICAgaGVpZ2h0OiBwYXJhbXMuaGVpZ2h0LFxuICAgICAgZGVwdGg6IHBhcmFtcy5kZXB0aCxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICB0aGlzLl9waHlzaWpzLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICB0aGlzLl9waHlzaWpzLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yMiwgVmVjdG9yMywgQnVmZmVyR2VvbWV0cnl9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgSGVpZ2h0ZmllbGRNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbWFzczogMTAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgICBzaXplOiBuZXcgVmVjdG9yMigxLCAxKSxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGF1dG9BbGlnbjogZmFsc2VcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnaGVpZ2h0ZmllbGQnLFxuICAgICAgZnJpY3Rpb246IHBhcmFtcy5mcmljdGlvbixcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIHJlc3RpdHV0aW9uOiBwYXJhbXMucmVzdGl0dXRpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICAgIHBvaW50czogcGFyYW1zLnBvaW50cyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5LCBzZWxmKSB7XG4gICAgICBjb25zdCBpc0J1ZmZlciA9IGdlb21ldHJ5IGluc3RhbmNlb2YgQnVmZmVyR2VvbWV0cnk7XG4gICAgICBjb25zdCB2ZXJ0cyA9IGlzQnVmZmVyID8gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6IGdlb21ldHJ5LnZlcnRpY2VzO1xuXG4gICAgICBsZXQgc2l6ZSA9IGlzQnVmZmVyID8gdmVydHMubGVuZ3RoIC8gMyA6IHZlcnRzLmxlbmd0aDtcblxuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGNvbnN0IHhkaXYgPSBzZWxmLnBhcmFtcy5zaXplLng7XG4gICAgICBjb25zdCB5ZGl2ID0gc2VsZi5wYXJhbXMuc2l6ZS55O1xuXG4gICAgICBjb25zdCB4c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBjb25zdCB5c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMueHB0cyA9ICh0eXBlb2YgeGRpdiA9PT0gJ3VuZGVmaW5lZCcpID8gTWF0aC5zcXJ0KHNpemUpIDogeGRpdiArIDE7XG4gICAgICB0aGlzLl9waHlzaWpzLnlwdHMgPSAodHlwZW9mIHlkaXYgPT09ICd1bmRlZmluZWQnKSA/IE1hdGguc3FydChzaXplKSA6IHlkaXYgKyAxO1xuXG4gICAgICAvLyBub3RlIC0gdGhpcyBhc3N1bWVzIG91ciBwbGFuZSBnZW9tZXRyeSBpcyBzcXVhcmUsIHVubGVzcyB3ZSBwYXNzIGluIHNwZWNpZmljIHhkaXYgYW5kIHlkaXZcbiAgICAgIHRoaXMuX3BoeXNpanMuYWJzTWF4SGVpZ2h0ID0gTWF0aC5tYXgoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnksIE1hdGguYWJzKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55KSk7XG5cbiAgICAgIGNvbnN0IHBvaW50cyA9IG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSksXG4gICAgICAgIHhwdHMgPSB0aGlzLl9waHlzaWpzLnhwdHMsXG4gICAgICAgIHlwdHMgPSB0aGlzLl9waHlzaWpzLnlwdHM7XG5cbiAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgY29uc3Qgdk51bSA9IHNpemUgJSB4cHRzICsgKCh5cHRzIC0gTWF0aC5yb3VuZCgoc2l6ZSAvIHhwdHMpIC0gKChzaXplICUgeHB0cykgLyB4cHRzKSkgLSAxKSAqIHlwdHMpO1xuXG4gICAgICAgIGlmIChpc0J1ZmZlcikgcG9pbnRzW3NpemVdID0gdmVydHNbdk51bSAqIDMgKyAxXTtcbiAgICAgICAgZWxzZSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtXS55O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9waHlzaWpzLnBvaW50cyA9IHBvaW50cztcblxuICAgICAgdGhpcy5fcGh5c2lqcy5zY2FsZS5tdWx0aXBseShcbiAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoeHNpemUgLyAoeHB0cyAtIDEpLCAxLCB5c2l6ZSAvICh5cHRzIC0gMSkpXG4gICAgICApO1xuXG4gICAgICBpZiAoc2VsZi5wYXJhbXMuYXV0b0FsaWduKSBnZW9tZXRyeS50cmFuc2xhdGUoeHNpemUgLyAtMiwgMCwgeXNpemUgLyAtMik7XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIFBsYW5lTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ3BsYW5lJyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICB0aGlzLl9waHlzaWpzLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICB0aGlzLl9waHlzaWpzLm5vcm1hbCA9IGdlb21ldHJ5LmZhY2VzWzBdLm5vcm1hbC5jbG9uZSgpO1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFNwaGVyZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc3BoZXJlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nU3BoZXJlKSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdTcGhlcmUoKTtcbiAgICAgIGRhdGEucmFkaXVzID0gZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUucmFkaXVzO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge1ZlY3RvcjMsIEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGV9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgU29mdGJvZHlNb2R1bGV7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICByZXN0aXR1dGlvbjogMC4zLFxuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgICBwcmVzc3VyZTogMTAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAga2xzdDogMC45LFxuICAgICAga3ZzdDogMC45LFxuICAgICAga2FzdDogMC45LFxuICAgICAgcGl0ZXJhdGlvbnM6IDEsXG4gICAgICB2aXRlcmF0aW9uczogMCxcbiAgICAgIGRpdGVyYXRpb25zOiAwLFxuICAgICAgY2l0ZXJhdGlvbnM6IDQsXG4gICAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgICAgcmlnaWRIYXJkbmVzczogMVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBhcHBlbmRBbmNob3Iob2JqZWN0LCBub2RlLCBpbmZsdWVuY2UsIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMgPSB0cnVlKSB7XG4gICAgY29uc3QgbzEgPSB0aGlzLl9waHlzaWpzLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0Ll9waHlzaWpzLmlkO1xuXG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnc29mdFRyaW1lc2gnLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBwcmVzc3VyZTogcGFyYW1zLnByZXNzdXJlLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAga2xzdDogcGFyYW1zLmtsc3QsXG4gICAgICBpc1NvZnRib2R5OiB0cnVlLFxuICAgICAga2FzdDogcGFyYW1zLmthc3QsXG4gICAgICBrdnN0OiBwYXJhbXMua3ZzdCxcbiAgICAgIGRyYWc6IHBhcmFtcy5kcmFnLFxuICAgICAgbGlmdDogcGFyYW1zLmxpZnQsXG4gICAgICBwaXRlcmF0aW9uczogcGFyYW1zLnBpdGVyYXRpb25zLFxuICAgICAgdml0ZXJhdGlvbnM6IHBhcmFtcy52aXRlcmF0aW9ucyxcbiAgICAgIGRpdGVyYXRpb25zOiBwYXJhbXMuZGl0ZXJhdGlvbnMsXG4gICAgICBjaXRlcmF0aW9uczogcGFyYW1zLmNpdGVyYXRpb25zLFxuICAgICAgYW5jaG9ySGFyZG5lc3M6IHBhcmFtcy5hbmNob3JIYXJkbmVzcyxcbiAgICAgIHJpZ2lkSGFyZG5lc3M6IHBhcmFtcy5yaWdpZEhhcmRuZXNzXG4gICAgfTtcblxuICAgIHRoaXMuYXBwZW5kQW5jaG9yID0gc2VsZi5hcHBlbmRBbmNob3IuYmluZCh0aGlzKTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5LCBzZWxmKSB7XG4gICAgICBjb25zdCBpZHhHZW9tZXRyeSA9IGdlb21ldHJ5IGluc3RhbmNlb2YgQnVmZmVyR2VvbWV0cnlcbiAgICAgICAgPyBnZW9tZXRyeVxuICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgZ2VvbWV0cnkubWVyZ2VWZXJ0aWNlcygpO1xuXG4gICAgICAgICAgY29uc3QgYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5zZXRJbmRleChcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyAoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogMyA+IDY1NTM1ID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheSkoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShnZW9tZXRyeS5mYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBjb25zdCBhVmVydGljZXMgPSBpZHhHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuICAgICAgY29uc3QgYUluZGljZXMgPSBpZHhHZW9tZXRyeS5pbmRleC5hcnJheTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy5hVmVydGljZXMgPSBhVmVydGljZXM7XG4gICAgICB0aGlzLl9waHlzaWpzLmFJbmRpY2VzID0gYUluZGljZXM7XG5cbiAgICAgIGNvbnN0IG5keEdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCkuZnJvbUdlb21ldHJ5KGdlb21ldHJ5KTtcblxuICAgICAgcmV0dXJuIG5keEdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yMywgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDbG90aE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgICAga2xzdDogMC45LFxuICAgICAga3ZzdDogMC45LFxuICAgICAga2FzdDogMC45LFxuICAgICAgcGl0ZXJhdGlvbnM6IDEsXG4gICAgICB2aXRlcmF0aW9uczogMCxcbiAgICAgIGRpdGVyYXRpb25zOiAwLFxuICAgICAgY2l0ZXJhdGlvbnM6IDQsXG4gICAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgICAgcmlnaWRIYXJkbmVzczogMVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBhcHBlbmRBbmNob3Iob2JqZWN0LCBub2RlLCBpbmZsdWVuY2UsIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMgPSB0cnVlKSB7XG4gICAgY29uc3QgbzEgPSB0aGlzLl9waHlzaWpzLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0Ll9waHlzaWpzLmlkO1xuXG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnc29mdENsb3RoTWVzaCcsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgaXNTb2Z0Ym9keTogdHJ1ZSxcbiAgICAgIHNjYWxlOiBwYXJhbXMuc2NhbGUsXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBrbHN0OiBwYXJhbXMua2xzdCxcbiAgICAgIGthc3Q6IHBhcmFtcy5rYXN0LFxuICAgICAga3ZzdDogcGFyYW1zLmt2c3QsXG4gICAgICBkcmFnOiBwYXJhbXMuZHJhZyxcbiAgICAgIGxpZnQ6IHBhcmFtcy5saWZ0LFxuICAgICAgcGl0ZXJhdGlvbnM6IHBhcmFtcy5waXRlcmF0aW9ucyxcbiAgICAgIHZpdGVyYXRpb25zOiBwYXJhbXMudml0ZXJhdGlvbnMsXG4gICAgICBkaXRlcmF0aW9uczogcGFyYW1zLmRpdGVyYXRpb25zLFxuICAgICAgY2l0ZXJhdGlvbnM6IHBhcmFtcy5jaXRlcmF0aW9ucyxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiBwYXJhbXMuYW5jaG9ySGFyZG5lc3MsXG4gICAgICByaWdpZEhhcmRuZXNzOiBwYXJhbXMucmlnaWRIYXJkbmVzcyxcbiAgICAgIHNjYWxlOiBwYXJhbXMuc2NhbGVcbiAgICB9O1xuXG4gICAgdGhpcy5hcHBlbmRBbmNob3IgPSBzZWxmLmFwcGVuZEFuY2hvci5iaW5kKHRoaXMpO1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnksIHNlbGYpIHtcbiAgICAgIGNvbnN0IGdlb21QYXJhbXMgPSBnZW9tZXRyeS5wYXJhbWV0ZXJzO1xuXG4gICAgICBjb25zdCBnZW9tID0gZ2VvbWV0cnkgaW5zdGFuY2VvZiBCdWZmZXJHZW9tZXRyeVxuICAgICAgICA/IGdlb21ldHJ5XG4gICAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgIGdlb21ldHJ5Lm1lcmdlVmVydGljZXMoKTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3QgZmFjZXMgPSBnZW9tZXRyeS5mYWNlcywgZmFjZXNMZW5ndGggPSBmYWNlcy5sZW5ndGg7XG4gICAgICAgICAgY29uc3Qgbm9ybWFsc0FycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmYWNlc0xlbmd0aCAqIDMpO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmYWNlc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpMyA9IGkgKiAzO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gZmFjZXNbaV0ubm9ybWFsIHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpM10gPSBub3JtYWwueDtcbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpMyArIDFdID0gbm9ybWFsLnk7XG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTMgKyAyXSA9IG5vcm1hbC56O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdub3JtYWwnLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbm9ybWFsc0FycmF5LFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IChmYWNlc0xlbmd0aCAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGZhY2VzTGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShmYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBjb25zdCB2ZXJ0cyA9IGdlb20uYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgaWYgKCFnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMpIGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyA9IDE7XG4gICAgICBpZiAoIWdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMpIGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgPSAxO1xuXG4gICAgICBjb25zdCBpZHgwMCA9IDA7XG4gICAgICBjb25zdCBpZHgwMSA9IGdlb21QYXJhbXMud2lkdGhTZWdtZW50cztcbiAgICAgIGNvbnN0IGlkeDEwID0gKGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgKyAxKSAqIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKSAtIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKTtcbiAgICAgIGNvbnN0IGlkeDExID0gdmVydHMubGVuZ3RoIC8gMyAtIDE7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMuY29ybmVycyA9IFtcbiAgICAgICAgdmVydHNbaWR4MDEgKiAzXSwgdmVydHNbaWR4MDEgKiAzICsgMV0sIHZlcnRzW2lkeDAxICogMyArIDJdLCAvLyAgIOKVl1xuICAgICAgICB2ZXJ0c1tpZHgwMCAqIDNdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAxXSwgdmVydHNbaWR4MDAgKiAzICsgMl0sIC8vIOKVlFxuICAgICAgICB2ZXJ0c1tpZHgxMSAqIDNdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAxXSwgdmVydHNbaWR4MTEgKiAzICsgMl0sIC8vICAgICAgIOKVnVxuICAgICAgICB2ZXJ0c1tpZHgxMCAqIDNdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAxXSwgdmVydHNbaWR4MTAgKiAzICsgMl0sIC8vICAgICDilZpcbiAgICAgIF07XG5cbiAgICAgIHRoaXMuX3BoeXNpanMuc2VnbWVudHMgPSBbZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSwgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDFdO1xuXG4gICAgICByZXR1cm4gZ2VvbTtcbiAgICB9LFxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufTtcbiIsImltcG9ydCB7VmVjdG9yMywgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBSb3BlTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAga2xzdDogMC45LFxuICAgICAga3ZzdDogMC45LFxuICAgICAga2FzdDogMC45LFxuICAgICAgcGl0ZXJhdGlvbnM6IDEsXG4gICAgICB2aXRlcmF0aW9uczogMCxcbiAgICAgIGRpdGVyYXRpb25zOiAwLFxuICAgICAgY2l0ZXJhdGlvbnM6IDQsXG4gICAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgICAgcmlnaWRIYXJkbmVzczogMVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBhcHBlbmRBbmNob3Iob2JqZWN0LCBub2RlLCBpbmZsdWVuY2UsIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMgPSB0cnVlKSB7XG4gICAgY29uc3QgbzEgPSB0aGlzLl9waHlzaWpzLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0Ll9waHlzaWpzLmlkO1xuXG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnc29mdFJvcGVNZXNoJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBrbHN0OiBwYXJhbXMua2xzdCxcbiAgICAgIGlzU29mdGJvZHk6IHRydWUsXG4gICAgICBrYXN0OiBwYXJhbXMua2FzdCxcbiAgICAgIGt2c3Q6IHBhcmFtcy5rdnN0LFxuICAgICAgZHJhZzogcGFyYW1zLmRyYWcsXG4gICAgICBsaWZ0OiBwYXJhbXMubGlmdCxcbiAgICAgIHBpdGVyYXRpb25zOiBwYXJhbXMucGl0ZXJhdGlvbnMsXG4gICAgICB2aXRlcmF0aW9uczogcGFyYW1zLnZpdGVyYXRpb25zLFxuICAgICAgZGl0ZXJhdGlvbnM6IHBhcmFtcy5kaXRlcmF0aW9ucyxcbiAgICAgIGNpdGVyYXRpb25zOiBwYXJhbXMuY2l0ZXJhdGlvbnMsXG4gICAgICBhbmNob3JIYXJkbmVzczogcGFyYW1zLmFuY2hvckhhcmRuZXNzLFxuICAgICAgcmlnaWRIYXJkbmVzczogcGFyYW1zLnJpZ2lkSGFyZG5lc3NcbiAgICB9O1xuXG4gICAgdGhpcy5hcHBlbmRBbmNob3IgPSBzZWxmLmFwcGVuZEFuY2hvci5iaW5kKHRoaXMpO1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghKGdlb21ldHJ5IGluc3RhbmNlb2YgQnVmZmVyR2VvbWV0cnkpKSB7XG4gICAgICAgIGdlb21ldHJ5ID0gKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBidWZmID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmLmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZjtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGVuZ3RoID0gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheS5sZW5ndGggLyAzO1xuICAgICAgY29uc3QgdmVydCA9IG4gPT4gbmV3IFZlY3RvcjMoKS5mcm9tQXJyYXkoZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSwgbiozKTtcblxuICAgICAgY29uc3QgdjEgPSB2ZXJ0KDApO1xuICAgICAgY29uc3QgdjIgPSB2ZXJ0KGxlbmd0aCAtIDEpO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLmRhdGEgPSBbXG4gICAgICAgIHYxLngsIHYxLnksIHYxLnosXG4gICAgICAgIHYyLngsIHYyLnksIHYyLnosXG4gICAgICAgIGxlbmd0aFxuICAgICAgXTtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH1cbn1cbiIsImltcG9ydCB7TG9vcH0gZnJvbSAnd2hzJztcblxuaW1wb3J0IHtcbiAgT2JqZWN0M0QsXG4gIFF1YXRlcm5pb24sXG4gIFZlY3RvcjMsXG4gIEV1bGVyXG59IGZyb20gJ3RocmVlJztcblxuY29uc3QgUElfMiA9IE1hdGguUEkgLyAyO1xuXG5mdW5jdGlvbiBGaXJzdFBlcnNvbkNvbnRyb2xzU29sdmVyKGNhbWVyYSwgbWVzaCwgcGFyYW1zKSB7XG4gIGNvbnN0IHZlbG9jaXR5RmFjdG9yID0gMTtcbiAgbGV0IHJ1blZlbG9jaXR5ID0gMC4yNTtcblxuICBtZXNoLnNldEFuZ3VsYXJGYWN0b3Ioe3g6IDAsIHk6IDAsIHo6IDB9KTtcbiAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcblxuICAvKiBJbml0ICovXG4gIGNvbnN0IHBsYXllciA9IG1lc2gsXG4gICAgcGl0Y2hPYmplY3QgPSBuZXcgT2JqZWN0M0QoKTtcblxuICBwaXRjaE9iamVjdC5hZGQoY2FtZXJhLm5hdGl2ZSk7XG5cbiAgY29uc3QgeWF3T2JqZWN0ID0gbmV3IE9iamVjdDNEKCk7XG5cbiAgeWF3T2JqZWN0LnBvc2l0aW9uLnkgPSBwYXJhbXMueXBvczsgLy8gZXllcyBhcmUgMiBtZXRlcnMgYWJvdmUgdGhlIGdyb3VuZFxuICB5YXdPYmplY3QuYWRkKHBpdGNoT2JqZWN0KTtcblxuICBjb25zdCBxdWF0ID0gbmV3IFF1YXRlcm5pb24oKTtcblxuICBsZXQgY2FuSnVtcCA9IGZhbHNlLFxuICAgIC8vIE1vdmVzLlxuICAgIG1vdmVGb3J3YXJkID0gZmFsc2UsXG4gICAgbW92ZUJhY2t3YXJkID0gZmFsc2UsXG4gICAgbW92ZUxlZnQgPSBmYWxzZSxcbiAgICBtb3ZlUmlnaHQgPSBmYWxzZTtcblxuICBwbGF5ZXIub24oJ2NvbGxpc2lvbicsIChvdGhlck9iamVjdCwgdiwgciwgY29udGFjdE5vcm1hbCkgPT4ge1xuICAgIGlmIChjb250YWN0Tm9ybWFsLnkgPCAwLjUpIC8vIFVzZSBhIFwiZ29vZFwiIHRocmVzaG9sZCB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDEgaGVyZSFcbiAgICAgIGNhbkp1bXAgPSB0cnVlO1xuICB9KTtcblxuICBjb25zdCBvbk1vdXNlTW92ZSA9IGV2ZW50ID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgY29uc3QgbW92ZW1lbnRYID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRYIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRYID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFgoKSA6IDA7XG4gICAgY29uc3QgbW92ZW1lbnRZID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRZIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRZID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFkoKSA6IDA7XG5cbiAgICB5YXdPYmplY3Qucm90YXRpb24ueSAtPSBtb3ZlbWVudFggKiAwLjAwMjtcbiAgICBwaXRjaE9iamVjdC5yb3RhdGlvbi54IC09IG1vdmVtZW50WSAqIDAuMDAyO1xuXG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCA9IE1hdGgubWF4KC1QSV8yLCBNYXRoLm1pbihQSV8yLCBwaXRjaE9iamVjdC5yb3RhdGlvbi54KSk7XG4gIH07XG5cbiAgY29uc3Qgb25LZXlEb3duID0gZXZlbnQgPT4ge1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgbW92ZUZvcndhcmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICBtb3ZlTGVmdCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBzXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICBtb3ZlUmlnaHQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzMjogLy8gc3BhY2VcbiAgICAgICAgaWYgKGNhbkp1bXAgPT09IHRydWUpIHBsYXllci5hcHBseUNlbnRyYWxJbXB1bHNlKHt4OiAwLCB5OiAzMDAsIHo6IDB9KTtcbiAgICAgICAgY2FuSnVtcCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNjogLy8gc2hpZnRcbiAgICAgICAgcnVuVmVsb2NpdHkgPSAwLjU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfTtcblxuICBjb25zdCBvbktleVVwID0gZXZlbnQgPT4ge1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgbW92ZUZvcndhcmQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgbW92ZUxlZnQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIGFcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICBtb3ZlUmlnaHQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY6IC8vIHNoaWZ0XG4gICAgICAgIHJ1blZlbG9jaXR5ID0gMC4yNTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9O1xuXG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlEb3duLCBmYWxzZSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBvbktleVVwLCBmYWxzZSk7XG5cbiAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gIHRoaXMuZ2V0T2JqZWN0ID0gKCkgPT4geWF3T2JqZWN0O1xuXG4gIHRoaXMuZ2V0RGlyZWN0aW9uID0gdGFyZ2V0VmVjID0+IHtcbiAgICB0YXJnZXRWZWMuc2V0KDAsIDAsIC0xKTtcbiAgICBxdWF0Lm11bHRpcGx5VmVjdG9yMyh0YXJnZXRWZWMpO1xuICB9O1xuXG4gIC8vIE1vdmVzIHRoZSBjYW1lcmEgdG8gdGhlIFBoeXNpLmpzIG9iamVjdCBwb3NpdGlvblxuICAvLyBhbmQgYWRkcyB2ZWxvY2l0eSB0byB0aGUgb2JqZWN0IGlmIHRoZSBydW4ga2V5IGlzIGRvd24uXG4gIGNvbnN0IGlucHV0VmVsb2NpdHkgPSBuZXcgVmVjdG9yMygpLFxuICAgIGV1bGVyID0gbmV3IEV1bGVyKCk7XG5cbiAgdGhpcy51cGRhdGUgPSBkZWx0YSA9PiB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIGRlbHRhID0gZGVsdGEgfHwgMC41O1xuICAgIGRlbHRhID0gTWF0aC5taW4oZGVsdGEsIDAuNSwgZGVsdGEpO1xuXG4gICAgaW5wdXRWZWxvY2l0eS5zZXQoMCwgMCwgMCk7XG5cbiAgICBjb25zdCBzcGVlZCA9IHZlbG9jaXR5RmFjdG9yICogZGVsdGEgKiBwYXJhbXMuc3BlZWQgKiBydW5WZWxvY2l0eTtcblxuICAgIGlmIChtb3ZlRm9yd2FyZCkgaW5wdXRWZWxvY2l0eS56ID0gLXNwZWVkO1xuICAgIGlmIChtb3ZlQmFja3dhcmQpIGlucHV0VmVsb2NpdHkueiA9IHNwZWVkO1xuICAgIGlmIChtb3ZlTGVmdCkgaW5wdXRWZWxvY2l0eS54ID0gLXNwZWVkO1xuICAgIGlmIChtb3ZlUmlnaHQpIGlucHV0VmVsb2NpdHkueCA9IHNwZWVkO1xuXG4gICAgLy8gQ29udmVydCB2ZWxvY2l0eSB0byB3b3JsZCBjb29yZGluYXRlc1xuICAgIGV1bGVyLnggPSBwaXRjaE9iamVjdC5yb3RhdGlvbi54O1xuICAgIGV1bGVyLnkgPSB5YXdPYmplY3Qucm90YXRpb24ueTtcbiAgICBldWxlci5vcmRlciA9ICdYWVonO1xuXG4gICAgcXVhdC5zZXRGcm9tRXVsZXIoZXVsZXIpO1xuXG4gICAgaW5wdXRWZWxvY2l0eS5hcHBseVF1YXRlcm5pb24ocXVhdCk7XG5cbiAgICBwbGF5ZXIuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogaW5wdXRWZWxvY2l0eS54LCB5OiAwLCB6OiBpbnB1dFZlbG9jaXR5Lnp9KTtcbiAgICBwbGF5ZXIuc2V0QW5ndWxhclZlbG9jaXR5KHt4OiBpbnB1dFZlbG9jaXR5LnosIHk6IDAsIHo6IC1pbnB1dFZlbG9jaXR5Lnh9KTtcbiAgICBwbGF5ZXIuc2V0QW5ndWxhckZhY3Rvcih7eDogMCwgeTogMCwgejogMH0pO1xuICB9O1xuXG4gIHBsYXllci5vbigncGh5c2ljczphZGRlZCcsICgpID0+IHtcbiAgICBwbGF5ZXIubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ3VwZGF0ZScsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICB5YXdPYmplY3QucG9zaXRpb24uY29weShwbGF5ZXIucG9zaXRpb24pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGNsYXNzIEZpcnN0UGVyc29uTW9kdWxlIHtcbiAgc3RhdGljIGRlZmF1bHRzID0ge1xuICAgIGJsb2NrOiBudWxsLFxuICAgIHNwZWVkOiAxLFxuICAgIHlwb3M6IDFcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihvYmplY3QsIHBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG5cbiAgICBpZiAoIXRoaXMucGFyYW1zLmJsb2NrKSB7XG4gICAgICB0aGlzLnBhcmFtcy5ibG9jayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdibG9ja2VyJyk7XG4gICAgfVxuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgdGhpcy5jb250cm9scyA9IG5ldyBGaXJzdFBlcnNvbkNvbnRyb2xzU29sdmVyKG1hbmFnZXIuZ2V0KCdjYW1lcmEnKSwgdGhpcy5vYmplY3QsIHRoaXMucGFyYW1zKTtcblxuICAgIGlmICgncG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudFxuICAgICAgfHwgJ21velBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICd3ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50KSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgY29uc3QgcG9pbnRlcmxvY2tjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGlmIChkb2N1bWVudC5wb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICB8fCBkb2N1bWVudC5tb3pQb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICB8fCBkb2N1bWVudC53ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLmNvbnRyb2xzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5wYXJhbXMuYmxvY2suc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdHBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgY29uc3QgcG9pbnRlcmxvY2tlcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdQb2ludGVyIGxvY2sgZXJyb3IuJyk7XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdHBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG5cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2sgPSBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdFBvaW50ZXJMb2NrXG4gICAgICAgICAgfHwgZWxlbWVudC53ZWJraXRSZXF1ZXN0UG9pbnRlckxvY2s7XG5cbiAgICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbiA9IGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW47XG5cbiAgICAgICAgaWYgKC9GaXJlZm94L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgIGNvbnN0IGZ1bGxzY3JlZW5jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgfHwgZG9jdW1lbnQubW96RnVsbHNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgfHwgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSk7XG5cbiAgICAgICAgICAgICAgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSwgZmFsc2UpO1xuXG4gICAgICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgICAgICB9IGVsc2UgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBjb25zb2xlLndhcm4oJ1lvdXIgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHRoZSBQb2ludGVyTG9jayBXSFMuQVBJLicpO1xuXG4gICAgbWFuYWdlci5nZXQoJ3NjZW5lJykuYWRkKHRoaXMuY29udHJvbHMuZ2V0T2JqZWN0KCkpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCB1cGRhdGVQcm9jZXNzb3IgPSBjID0+IHtcbiAgICAgIHNlbGYuY29udHJvbHMudXBkYXRlKGMuZ2V0RGVsdGEoKSk7XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlTG9vcCA9IG5ldyBMb29wKHVwZGF0ZVByb2Nlc3Nvcikuc3RhcnQodGhpcyk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJNRVNTQUdFX1RZUEVTIiwiUkVQT1JUX0lURU1TSVpFIiwiQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFIiwiVkVISUNMRVJFUE9SVF9JVEVNU0laRSIsIkNPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUiLCJ0ZW1wMVZlY3RvcjMiLCJWZWN0b3IzIiwidGVtcDJWZWN0b3IzIiwidGVtcDFNYXRyaXg0IiwiTWF0cml4NCIsInRlbXAxUXVhdCIsIlF1YXRlcm5pb24iLCJnZXRFdWxlclhZWkZyb21RdWF0ZXJuaW9uIiwieCIsInkiLCJ6IiwidyIsIk1hdGgiLCJhdGFuMiIsImFzaW4iLCJnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyIiwiYzEiLCJjb3MiLCJzMSIsInNpbiIsImMyIiwiczIiLCJjMyIsInMzIiwiYzFjMiIsInMxczIiLCJjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0IiwicG9zaXRpb24iLCJvYmplY3QiLCJpZGVudGl0eSIsIm1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uIiwicXVhdGVybmlvbiIsImdldEludmVyc2UiLCJjb3B5Iiwic3ViIiwiYXBwbHlNYXRyaXg0IiwiYWRkT2JqZWN0Q2hpbGRyZW4iLCJwYXJlbnQiLCJpIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJjaGlsZCIsIl9waHlzaWpzIiwiY29tcG9uZW50IiwidXBkYXRlTWF0cml4IiwidXBkYXRlTWF0cml4V29ybGQiLCJzZXRGcm9tTWF0cml4UG9zaXRpb24iLCJtYXRyaXhXb3JsZCIsInNldEZyb21Sb3RhdGlvbk1hdHJpeCIsInBvc2l0aW9uX29mZnNldCIsInJvdGF0aW9uIiwicHVzaCIsIkV2ZW50YWJsZSIsIl9ldmVudExpc3RlbmVycyIsImV2ZW50X25hbWUiLCJjYWxsYmFjayIsImhhc093blByb3BlcnR5IiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwicGFyYW1ldGVycyIsIkFycmF5IiwicHJvdG90eXBlIiwiY2FsbCIsImFyZ3VtZW50cyIsImFwcGx5Iiwib2JqIiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJkaXNwYXRjaEV2ZW50IiwiQ29uZVR3aXN0Q29uc3RyYWludCIsIm9iamEiLCJvYmpiIiwib2JqZWN0YSIsIm9iamVjdGIiLCJ1bmRlZmluZWQiLCJjb25zb2xlIiwiZXJyb3IiLCJ0eXBlIiwiYXBwbGllZEltcHVsc2UiLCJ3b3JsZE1vZHVsZSIsImlkIiwicG9zaXRpb25hIiwiY2xvbmUiLCJwb3NpdGlvbmIiLCJheGlzYSIsImF4aXNiIiwiZXhlY3V0ZSIsImNvbnN0cmFpbnQiLCJtYXhfaW1wdWxzZSIsInRhcmdldCIsIlRIUkVFIiwic2V0RnJvbUV1bGVyIiwiRXVsZXIiLCJIaW5nZUNvbnN0cmFpbnQiLCJheGlzIiwibG93IiwiaGlnaCIsImJpYXNfZmFjdG9yIiwicmVsYXhhdGlvbl9mYWN0b3IiLCJ2ZWxvY2l0eSIsImFjY2VsZXJhdGlvbiIsIlBvaW50Q29uc3RyYWludCIsIlNsaWRlckNvbnN0cmFpbnQiLCJsaW5fbG93ZXIiLCJsaW5fdXBwZXIiLCJhbmdfbG93ZXIiLCJhbmdfdXBwZXIiLCJsaW5lYXIiLCJhbmd1bGFyIiwic2NlbmUiLCJET0ZDb25zdHJhaW50IiwibGltaXQiLCJ3aGljaCIsImxvd19hbmdsZSIsImhpZ2hfYW5nbGUiLCJtYXhfZm9yY2UiLCJWZWhpY2xlIiwibWVzaCIsInR1bmluZyIsIlZlaGljbGVUdW5pbmciLCJ3aGVlbHMiLCJnZXRPYmplY3RJZCIsInN1c3BlbnNpb25fc3RpZmZuZXNzIiwic3VzcGVuc2lvbl9jb21wcmVzc2lvbiIsInN1c3BlbnNpb25fZGFtcGluZyIsIm1heF9zdXNwZW5zaW9uX3RyYXZlbCIsImZyaWN0aW9uX3NsaXAiLCJtYXhfc3VzcGVuc2lvbl9mb3JjZSIsIndoZWVsX2dlb21ldHJ5Iiwid2hlZWxfbWF0ZXJpYWwiLCJjb25uZWN0aW9uX3BvaW50Iiwid2hlZWxfZGlyZWN0aW9uIiwid2hlZWxfYXhsZSIsInN1c3BlbnNpb25fcmVzdF9sZW5ndGgiLCJ3aGVlbF9yYWRpdXMiLCJpc19mcm9udF93aGVlbCIsIndoZWVsIiwiTWVzaCIsImNhc3RTaGFkb3ciLCJyZWNlaXZlU2hhZG93IiwibXVsdGlwbHlTY2FsYXIiLCJhZGQiLCJ3b3JsZCIsImFtb3VudCIsInN0ZWVyaW5nIiwiYnJha2UiLCJmb3JjZSIsIlRBUkdFVCIsIlN5bWJvbCIsIlNDUklQVF9UWVBFIiwiQmxvYkJ1aWxkZXIiLCJ3aW5kb3ciLCJXZWJLaXRCbG9iQnVpbGRlciIsIk1vekJsb2JCdWlsZGVyIiwiTVNCbG9iQnVpbGRlciIsIlVSTCIsIndlYmtpdFVSTCIsIldvcmtlciIsInNoaW1Xb3JrZXIiLCJmaWxlbmFtZSIsImZuIiwiU2hpbVdvcmtlciIsImZvcmNlRmFsbGJhY2siLCJvIiwic291cmNlIiwidG9TdHJpbmciLCJyZXBsYWNlIiwic2xpY2UiLCJvYmpVUkwiLCJjcmVhdGVTb3VyY2VPYmplY3QiLCJyZXZva2VPYmplY3RVUkwiLCJzZWxmU2hpbSIsIm0iLCJvbm1lc3NhZ2UiLCJkYXRhIiwicG9zdE1lc3NhZ2UiLCJpc1RoaXNUaHJlYWQiLCJ0ZXN0V29ya2VyIiwidGVzdEFycmF5IiwiVWludDhBcnJheSIsInRlc3QiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJFcnJvciIsImJ1ZmZlciIsImUiLCJ0ZXJtaW5hdGUiLCJzdHIiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwiYmxvYiIsImFwcGVuZCIsImdldEJsb2IiLCJkb2N1bWVudCIsInNlbGYiLCJ0cmFuc2ZlcmFibGVNZXNzYWdlIiwid2Via2l0UG9zdE1lc3NhZ2UiLCJfb2JqZWN0IiwiX3ZlY3RvciIsIl90cmFuc2Zvcm0iLCJfdHJhbnNmb3JtX3BvcyIsIl9zb2Z0Ym9keV9lbmFibGVkIiwibGFzdF9zaW11bGF0aW9uX2R1cmF0aW9uIiwiX251bV9vYmplY3RzIiwiX251bV9yaWdpZGJvZHlfb2JqZWN0cyIsIl9udW1fc29mdGJvZHlfb2JqZWN0cyIsIl9udW1fd2hlZWxzIiwiX251bV9jb25zdHJhaW50cyIsIl9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSIsIl92ZWMzXzEiLCJfdmVjM18yIiwiX3ZlYzNfMyIsIl9xdWF0IiwicHVibGljX2Z1bmN0aW9ucyIsIl9vYmplY3RzIiwiX3ZlaGljbGVzIiwiX2NvbnN0cmFpbnRzIiwiX29iamVjdHNfYW1tbyIsIl9vYmplY3Rfc2hhcGVzIiwiUkVQT1JUX0NIVU5LU0laRSIsInNvZnRyZXBvcnQiLCJjb2xsaXNpb25yZXBvcnQiLCJ2ZWhpY2xlcmVwb3J0IiwiY29uc3RyYWludHJlcG9ydCIsIldPUkxEUkVQT1JUX0lURU1TSVpFIiwiYWIiLCJBcnJheUJ1ZmZlciIsIlNVUFBPUlRfVFJBTlNGRVJBQkxFIiwiYnl0ZUxlbmd0aCIsImdldFNoYXBlRnJvbUNhY2hlIiwiY2FjaGVfa2V5Iiwic2V0U2hhcGVDYWNoZSIsInNoYXBlIiwiY3JlYXRlU2hhcGUiLCJkZXNjcmlwdGlvbiIsInNldElkZW50aXR5IiwiQW1tbyIsImJ0Q29tcG91bmRTaGFwZSIsIm5vcm1hbCIsInNldFgiLCJzZXRZIiwic2V0WiIsImJ0U3RhdGljUGxhbmVTaGFwZSIsIndpZHRoIiwiaGVpZ2h0IiwiZGVwdGgiLCJidEJveFNoYXBlIiwicmFkaXVzIiwiYnRTcGhlcmVTaGFwZSIsImJ0Q3lsaW5kZXJTaGFwZSIsImJ0Q2Fwc3VsZVNoYXBlIiwiYnRDb25lU2hhcGUiLCJ0cmlhbmdsZV9tZXNoIiwiYnRUcmlhbmdsZU1lc2giLCJhZGRUcmlhbmdsZSIsImJ0QnZoVHJpYW5nbGVNZXNoU2hhcGUiLCJidENvbnZleEh1bGxTaGFwZSIsImFkZFBvaW50IiwieHB0cyIsInlwdHMiLCJwb2ludHMiLCJwdHIiLCJfbWFsbG9jIiwicCIsInAyIiwiaiIsIkhFQVBGMzIiLCJidEhlaWdodGZpZWxkVGVycmFpblNoYXBlIiwiYWJzTWF4SGVpZ2h0IiwiY3JlYXRlU29mdEJvZHkiLCJib2R5Iiwic29mdEJvZHlIZWxwZXJzIiwiYnRTb2Z0Qm9keUhlbHBlcnMiLCJhVmVydGljZXMiLCJDcmVhdGVGcm9tVHJpTWVzaCIsImdldFdvcmxkSW5mbyIsImFJbmRpY2VzIiwiY3IiLCJjb3JuZXJzIiwiQ3JlYXRlUGF0Y2giLCJidFZlY3RvcjMiLCJzZWdtZW50cyIsIkNyZWF0ZVJvcGUiLCJpbml0IiwicGFyYW1zIiwid2FzbUJ1ZmZlciIsImFtbW8iLCJsb2FkQW1tb0Zyb21CaW5hcnkiLCJjbWQiLCJtYWtlV29ybGQiLCJidFRyYW5zZm9ybSIsImJ0UXVhdGVybmlvbiIsInJlcG9ydHNpemUiLCJGbG9hdDMyQXJyYXkiLCJXT1JMRFJFUE9SVCIsIkNPTExJU0lPTlJFUE9SVCIsIlZFSElDTEVSRVBPUlQiLCJDT05TVFJBSU5UUkVQT1JUIiwiY29sbGlzaW9uQ29uZmlndXJhdGlvbiIsInNvZnRib2R5IiwiYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJidERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uIiwiZGlzcGF0Y2hlciIsImJ0Q29sbGlzaW9uRGlzcGF0Y2hlciIsInNvbHZlciIsImJ0U2VxdWVudGlhbEltcHVsc2VDb25zdHJhaW50U29sdmVyIiwiYnJvYWRwaGFzZSIsImFhYmJtaW4iLCJhYWJibWF4IiwiYnRBeGlzU3dlZXAzIiwiYnREYnZ0QnJvYWRwaGFzZSIsImJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZCIsImJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyIiwiYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQiLCJmaXhlZFRpbWVTdGVwIiwic2V0Rml4ZWRUaW1lU3RlcCIsInNldEdyYXZpdHkiLCJhcHBlbmRBbmNob3IiLCJsb2ciLCJub2RlIiwib2JqMiIsImNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMiLCJpbmZsdWVuY2UiLCJhZGRPYmplY3QiLCJtb3Rpb25TdGF0ZSIsInNiQ29uZmlnIiwiZ2V0X21fY2ZnIiwidml0ZXJhdGlvbnMiLCJzZXRfdml0ZXJhdGlvbnMiLCJwaXRlcmF0aW9ucyIsInNldF9waXRlcmF0aW9ucyIsImRpdGVyYXRpb25zIiwic2V0X2RpdGVyYXRpb25zIiwiY2l0ZXJhdGlvbnMiLCJzZXRfY2l0ZXJhdGlvbnMiLCJzZXRfY29sbGlzaW9ucyIsInNldF9rREYiLCJmcmljdGlvbiIsInNldF9rRFAiLCJkYW1waW5nIiwicHJlc3N1cmUiLCJzZXRfa1BSIiwiZHJhZyIsInNldF9rREciLCJsaWZ0Iiwic2V0X2tMRiIsImFuY2hvckhhcmRuZXNzIiwic2V0X2tBSFIiLCJyaWdpZEhhcmRuZXNzIiwic2V0X2tDSFIiLCJrbHN0IiwiZ2V0X21fbWF0ZXJpYWxzIiwiYXQiLCJzZXRfbV9rTFNUIiwia2FzdCIsInNldF9tX2tBU1QiLCJrdnN0Iiwic2V0X21fa1ZTVCIsImNhc3RPYmplY3QiLCJidENvbGxpc2lvbk9iamVjdCIsImdldENvbGxpc2lvblNoYXBlIiwic2V0TWFyZ2luIiwibWFyZ2luIiwic2V0QWN0aXZhdGlvblN0YXRlIiwic3RhdGUiLCJyb3BlIiwiY2xvdGgiLCJzZXRPcmlnaW4iLCJzZXRXIiwic2V0Um90YXRpb24iLCJ0cmFuc2Zvcm0iLCJzY2FsZSIsInNldFRvdGFsTWFzcyIsIm1hc3MiLCJhZGRTb2Z0Qm9keSIsImdldF9tX2ZhY2VzIiwic2l6ZSIsImdldF9tX25vZGVzIiwiY29tcG91bmRfc2hhcGUiLCJhZGRDaGlsZFNoYXBlIiwiX2NoaWxkIiwidHJhbnMiLCJkZXN0cm95Iiwic2V0TG9jYWxTY2FsaW5nIiwiY2FsY3VsYXRlTG9jYWxJbmVydGlhIiwiYnREZWZhdWx0TW90aW9uU3RhdGUiLCJyYkluZm8iLCJidFJpZ2lkQm9keUNvbnN0cnVjdGlvbkluZm8iLCJzZXRfbV9mcmljdGlvbiIsInNldF9tX3Jlc3RpdHV0aW9uIiwicmVzdGl0dXRpb24iLCJzZXRfbV9saW5lYXJEYW1waW5nIiwic2V0X21fYW5ndWxhckRhbXBpbmciLCJidFJpZ2lkQm9keSIsImNvbGxpc2lvbl9mbGFncyIsInNldENvbGxpc2lvbkZsYWdzIiwiZ3JvdXAiLCJtYXNrIiwiYWRkUmlnaWRCb2R5IiwiYWN0aXZhdGUiLCJhIiwiYWRkVmVoaWNsZSIsInZlaGljbGVfdHVuaW5nIiwiYnRWZWhpY2xlVHVuaW5nIiwic2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyIsInNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbiIsInNldF9tX3N1c3BlbnNpb25EYW1waW5nIiwic2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtIiwic2V0X21fbWF4U3VzcGVuc2lvbkZvcmNlIiwidmVoaWNsZSIsImJ0UmF5Y2FzdFZlaGljbGUiLCJyaWdpZEJvZHkiLCJidERlZmF1bHRWZWhpY2xlUmF5Y2FzdGVyIiwic2V0Q29vcmRpbmF0ZVN5c3RlbSIsInJlbW92ZVZlaGljbGUiLCJhZGRXaGVlbCIsInNldFN0ZWVyaW5nIiwiZGV0YWlscyIsInNldFN0ZWVyaW5nVmFsdWUiLCJzZXRCcmFrZSIsImFwcGx5RW5naW5lRm9yY2UiLCJyZW1vdmVPYmplY3QiLCJyZW1vdmVTb2Z0Qm9keSIsInJlbW92ZVJpZ2lkQm9keSIsIl9tb3Rpb25fc3RhdGVzIiwiX2NvbXBvdW5kX3NoYXBlcyIsIl9ub25jYWNoZWRfc2hhcGVzIiwidXBkYXRlVHJhbnNmb3JtIiwiZ2V0TW90aW9uU3RhdGUiLCJnZXRXb3JsZFRyYW5zZm9ybSIsInBvcyIsInF1YXQiLCJzZXRXb3JsZFRyYW5zZm9ybSIsInVwZGF0ZU1hc3MiLCJzZXRNYXNzUHJvcHMiLCJhcHBseUNlbnRyYWxJbXB1bHNlIiwiYXBwbHlJbXB1bHNlIiwiaW1wdWxzZV94IiwiaW1wdWxzZV95IiwiaW1wdWxzZV96IiwiYXBwbHlUb3JxdWUiLCJ0b3JxdWVfeCIsInRvcnF1ZV95IiwidG9ycXVlX3oiLCJhcHBseUNlbnRyYWxGb3JjZSIsImFwcGx5Rm9yY2UiLCJmb3JjZV94IiwiZm9yY2VfeSIsImZvcmNlX3oiLCJvblNpbXVsYXRpb25SZXN1bWUiLCJEYXRlIiwibm93Iiwic2V0QW5ndWxhclZlbG9jaXR5Iiwic2V0TGluZWFyVmVsb2NpdHkiLCJzZXRBbmd1bGFyRmFjdG9yIiwic2V0TGluZWFyRmFjdG9yIiwic2V0RGFtcGluZyIsInNldENjZE1vdGlvblRocmVzaG9sZCIsInRocmVzaG9sZCIsInNldENjZFN3ZXB0U3BoZXJlUmFkaXVzIiwiYWRkQ29uc3RyYWludCIsImJ0UG9pbnQyUG9pbnRDb25zdHJhaW50IiwiYnRIaW5nZUNvbnN0cmFpbnQiLCJ0cmFuc2Zvcm1iIiwidHJhbnNmb3JtYSIsImdldFJvdGF0aW9uIiwic2V0RXVsZXIiLCJidFNsaWRlckNvbnN0cmFpbnQiLCJ0YSIsInRiIiwic2V0RXVsZXJaWVgiLCJidENvbmVUd2lzdENvbnN0cmFpbnQiLCJzZXRMaW1pdCIsIlBJIiwiYnRHZW5lcmljNkRvZkNvbnN0cmFpbnQiLCJiIiwiZW5hYmxlRmVlZGJhY2siLCJyZW1vdmVDb25zdHJhaW50IiwiY29uc3RyYWludF9zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJ1bmRlZmluZCIsInNldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCIsInNpbXVsYXRlIiwidGltZVN0ZXAiLCJtYXhTdWJTdGVwcyIsImNlaWwiLCJzdGVwU2ltdWxhdGlvbiIsInJlcG9ydFZlaGljbGVzIiwicmVwb3J0Q29uc3RyYWludHMiLCJyZXBvcnRXb3JsZF9zb2Z0Ym9kaWVzIiwiaGluZ2Vfc2V0TGltaXRzIiwiaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yIiwiZW5hYmxlQW5ndWxhck1vdG9yIiwiaGluZ2VfZGlzYWJsZU1vdG9yIiwiZW5hYmxlTW90b3IiLCJzbGlkZXJfc2V0TGltaXRzIiwic2V0TG93ZXJMaW5MaW1pdCIsInNldFVwcGVyTGluTGltaXQiLCJzZXRMb3dlckFuZ0xpbWl0Iiwic2V0VXBwZXJBbmdMaW1pdCIsInNsaWRlcl9zZXRSZXN0aXR1dGlvbiIsInNldFNvZnRuZXNzTGltTGluIiwic2V0U29mdG5lc3NMaW1BbmciLCJzbGlkZXJfZW5hYmxlTGluZWFyTW90b3IiLCJzZXRUYXJnZXRMaW5Nb3RvclZlbG9jaXR5Iiwic2V0TWF4TGluTW90b3JGb3JjZSIsInNldFBvd2VyZWRMaW5Nb3RvciIsInNsaWRlcl9kaXNhYmxlTGluZWFyTW90b3IiLCJzbGlkZXJfZW5hYmxlQW5ndWxhck1vdG9yIiwic2V0VGFyZ2V0QW5nTW90b3JWZWxvY2l0eSIsInNldE1heEFuZ01vdG9yRm9yY2UiLCJzZXRQb3dlcmVkQW5nTW90b3IiLCJzbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvciIsImNvbmV0d2lzdF9zZXRMaW1pdCIsImNvbmV0d2lzdF9lbmFibGVNb3RvciIsImNvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UiLCJzZXRNYXhNb3RvckltcHVsc2UiLCJjb25ldHdpc3Rfc2V0TW90b3JUYXJnZXQiLCJzZXRNb3RvclRhcmdldCIsImNvbmV0d2lzdF9kaXNhYmxlTW90b3IiLCJkb2Zfc2V0TGluZWFyTG93ZXJMaW1pdCIsInNldExpbmVhckxvd2VyTGltaXQiLCJkb2Zfc2V0TGluZWFyVXBwZXJMaW1pdCIsInNldExpbmVhclVwcGVyTGltaXQiLCJkb2Zfc2V0QW5ndWxhckxvd2VyTGltaXQiLCJzZXRBbmd1bGFyTG93ZXJMaW1pdCIsImRvZl9zZXRBbmd1bGFyVXBwZXJMaW1pdCIsInNldEFuZ3VsYXJVcHBlckxpbWl0IiwiZG9mX2VuYWJsZUFuZ3VsYXJNb3RvciIsIm1vdG9yIiwiZ2V0Um90YXRpb25hbExpbWl0TW90b3IiLCJzZXRfbV9lbmFibGVNb3RvciIsImRvZl9jb25maWd1cmVBbmd1bGFyTW90b3IiLCJzZXRfbV9sb0xpbWl0Iiwic2V0X21faGlMaW1pdCIsInNldF9tX3RhcmdldFZlbG9jaXR5Iiwic2V0X21fbWF4TW90b3JGb3JjZSIsImRvZl9kaXNhYmxlQW5ndWxhck1vdG9yIiwicmVwb3J0V29ybGQiLCJ3b3JsZHJlcG9ydCIsImdldENlbnRlck9mTWFzc1RyYW5zZm9ybSIsIm9yaWdpbiIsImdldE9yaWdpbiIsIm9mZnNldCIsImdldExpbmVhclZlbG9jaXR5IiwiZ2V0QW5ndWxhclZlbG9jaXR5IiwiU09GVFJFUE9SVCIsIm9mZnNldFZlcnQiLCJub2RlcyIsInZlcnQiLCJnZXRfbV94Iiwib2ZmIiwiZ2V0X21fbiIsImZhY2VzIiwiZmFjZSIsIm5vZGUxIiwibm9kZTIiLCJub2RlMyIsInZlcnQxIiwidmVydDIiLCJ2ZXJ0MyIsIm5vcm1hbDEiLCJub3JtYWwyIiwibm9ybWFsMyIsInJlcG9ydENvbGxpc2lvbnMiLCJkcCIsImdldERpc3BhdGNoZXIiLCJudW0iLCJnZXROdW1NYW5pZm9sZHMiLCJtYW5pZm9sZCIsImdldE1hbmlmb2xkQnlJbmRleEludGVybmFsIiwibnVtX2NvbnRhY3RzIiwiZ2V0TnVtQ29udGFjdHMiLCJwdCIsImdldENvbnRhY3RQb2ludCIsImdldEJvZHkwIiwiZ2V0Qm9keTEiLCJnZXRfbV9ub3JtYWxXb3JsZE9uQiIsImdldE51bVdoZWVscyIsImdldFdoZWVsSW5mbyIsImdldF9tX3dvcmxkVHJhbnNmb3JtIiwibGVuZ2h0Iiwib2Zmc2V0X2JvZHkiLCJnZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJldmVudCIsIldvcmxkTW9kdWxlIiwiYnJpZGdlIiwidXNlIiwiZGVmZXIiLCJvbkFkZENhbGxiYWNrIiwiYmluZCIsIm9uUmVtb3ZlQ2FsbGJhY2siLCJPYmplY3QiLCJhc3NpZ24iLCJzdGFydCIsInBlcmZvcm1hbmNlIiwid29ya2VyIiwiUGh5c2ljc1dvcmtlciIsImlzTG9hZGVkIiwibG9hZGVyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ3YXNtIiwidGhlbiIsInJlc3BvbnNlIiwiYXJyYXlCdWZmZXIiLCJfbWF0ZXJpYWxzX3JlZl9jb3VudHMiLCJfaXNfc2ltdWxhdGluZyIsIl9pZCIsIl90ZW1wIiwidXBkYXRlU2NlbmUiLCJ1cGRhdGVTb2Z0Ym9kaWVzIiwidXBkYXRlQ29sbGlzaW9ucyIsInVwZGF0ZVZlaGljbGVzIiwidXBkYXRlQ29uc3RyYWludHMiLCJkZWJ1ZyIsImRpciIsImluZm8iLCJfX2RpcnR5UG9zaXRpb24iLCJzZXQiLCJfX2RpcnR5Um90YXRpb24iLCJsaW5lYXJWZWxvY2l0eSIsImFuZ3VsYXJWZWxvY2l0eSIsImF0dHJpYnV0ZXMiLCJnZW9tZXRyeSIsInZvbHVtZVBvc2l0aW9ucyIsImFycmF5IiwiaXNTb2Z0Qm9keVJlc2V0Iiwidm9sdW1lTm9ybWFscyIsIm9mZnMiLCJ4MSIsInkxIiwiejEiLCJueDEiLCJueTEiLCJuejEiLCJ4MiIsInkyIiwiejIiLCJueDIiLCJueTIiLCJuejIiLCJ4MyIsInkzIiwiejMiLCJueDMiLCJueTMiLCJuejMiLCJpOSIsIm5lZWRzVXBkYXRlIiwibngiLCJueSIsIm56IiwiZXh0cmFjdFJvdGF0aW9uIiwibWF0cml4IiwiYWRkVmVjdG9ycyIsImNvbGxpc2lvbnMiLCJub3JtYWxfb2Zmc2V0cyIsIm9iamVjdDIiLCJpZDEiLCJ0b3VjaGVzIiwiaWQyIiwiY29tcG9uZW50MiIsImRhdGEyIiwidmVsIiwidmVsMiIsInN1YlZlY3RvcnMiLCJ0ZW1wMSIsInRlbXAyIiwibm9ybWFsX29mZnNldCIsImVtaXQiLCJzaG93X21hcmtlciIsImdldERlZmluaXRpb24iLCJtYXJrZXIiLCJTcGhlcmVHZW9tZXRyeSIsIk1lc2hOb3JtYWxNYXRlcmlhbCIsIkJveEdlb21ldHJ5IiwibmF0aXZlIiwibWFuYWdlciIsIm1hdGVyaWFsIiwibWF0ZXJpYWxJZCIsInJlbW92ZSIsInBvcCIsImZ1bmMiLCJhcmdzIiwiZ3Jhdml0eSIsIl9zdGF0cyIsImJlZ2luIiwib2JqZWN0X2lkIiwidXBkYXRlIiwiaXNTb2Z0Ym9keSIsImVuZCIsInNpbXVsYXRlTG9vcCIsIkxvb3AiLCJjbG9jayIsImdldERlbHRhIiwicHJvcGVydGllcyIsIl9uYXRpdmUiLCJ2ZWN0b3IzIiwic2NvcGUiLCJkZWZpbmVQcm9wZXJ0aWVzIiwiX3giLCJfeSIsIl96IiwiX19jX3JvdCIsIm9uQ2hhbmdlIiwiZXVsZXIiLCJyb3QiLCJ3cmFwUGh5c2ljc1Byb3RvdHlwZSIsImtleSIsImRlZmluZVByb3BlcnR5IiwiZ2V0Iiwib25Db3B5Iiwib25XcmFwIiwiQVBJIiwiZmFjdG9yIiwiZGVmYXVsdHMiLCJkZWZpbmUiLCJoYXMiLCJtb2R1bGUiLCJyaWdpZGJvZHkiLCJCb3hNb2R1bGUiLCJQaHlzaWNzTW9kdWxlIiwidXBkYXRlRGF0YSIsImJvdW5kaW5nQm94IiwiY29tcHV0ZUJvdW5kaW5nQm94IiwibWF4IiwibWluIiwiQ29tcG91bmRNb2R1bGUiLCJDYXBzdWxlTW9kdWxlIiwiQ29uY2F2ZU1vZHVsZSIsInBhdGgiLCJ3YWl0IiwiZ2VvbWV0cnlMb2FkZXIiLCJnZW9tZXRyeVByb2Nlc3NvciIsImdlb20iLCJKU09OTG9hZGVyIiwibG9hZCIsImlzQnVmZmVyIiwidmVydGljZXMiLCJ2QSIsInZCIiwidkMiLCJjIiwiQ29uZU1vZHVsZSIsIkNvbnZleE1vZHVsZSIsIl9idWZmZXJHZW9tZXRyeSIsIkJ1ZmZlckdlb21ldHJ5IiwiZnJvbUdlb21ldHJ5IiwiQ3lsaW5kZXJNb2R1bGUiLCJIZWlnaHRmaWVsZE1vZHVsZSIsInZlcnRzIiwieGRpdiIsInlkaXYiLCJ4c2l6ZSIsInlzaXplIiwic3FydCIsImFicyIsInZOdW0iLCJyb3VuZCIsIm11bHRpcGx5IiwiYXV0b0FsaWduIiwidHJhbnNsYXRlIiwiVmVjdG9yMiIsIlBsYW5lTW9kdWxlIiwiU3BoZXJlTW9kdWxlIiwiYm91bmRpbmdTcGhlcmUiLCJjb21wdXRlQm91bmRpbmdTcGhlcmUiLCJTb2Z0Ym9keU1vZHVsZSIsImlkeEdlb21ldHJ5IiwibWVyZ2VWZXJ0aWNlcyIsImJ1ZmZlckdlb21ldHJ5IiwiYWRkQXR0cmlidXRlIiwiQnVmZmVyQXR0cmlidXRlIiwiY29weVZlY3RvcjNzQXJyYXkiLCJzZXRJbmRleCIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJjb3B5SW5kaWNlc0FycmF5IiwibmR4R2VvbWV0cnkiLCJvMSIsIm8yIiwiQ2xvdGhNb2R1bGUiLCJnZW9tUGFyYW1zIiwiZmFjZXNMZW5ndGgiLCJub3JtYWxzQXJyYXkiLCJpMyIsIndpZHRoU2VnbWVudHMiLCJoZWlnaHRTZWdtZW50cyIsImlkeDAwIiwiaWR4MDEiLCJpZHgxMCIsImlkeDExIiwiUm9wZU1vZHVsZSIsImJ1ZmYiLCJmcm9tQXJyYXkiLCJuIiwidjEiLCJ2MiIsIlBJXzIiLCJGaXJzdFBlcnNvbkNvbnRyb2xzU29sdmVyIiwiY2FtZXJhIiwidmVsb2NpdHlGYWN0b3IiLCJydW5WZWxvY2l0eSIsInBsYXllciIsInBpdGNoT2JqZWN0IiwiT2JqZWN0M0QiLCJ5YXdPYmplY3QiLCJ5cG9zIiwiY2FuSnVtcCIsIm1vdmVCYWNrd2FyZCIsIm1vdmVMZWZ0IiwibW92ZVJpZ2h0Iiwib24iLCJvdGhlck9iamVjdCIsInYiLCJyIiwiY29udGFjdE5vcm1hbCIsIm9uTW91c2VNb3ZlIiwiZW5hYmxlZCIsIm1vdmVtZW50WCIsIm1vek1vdmVtZW50WCIsImdldE1vdmVtZW50WCIsIm1vdmVtZW50WSIsIm1vek1vdmVtZW50WSIsImdldE1vdmVtZW50WSIsIm9uS2V5RG93biIsImtleUNvZGUiLCJvbktleVVwIiwiZ2V0T2JqZWN0IiwiZ2V0RGlyZWN0aW9uIiwibXVsdGlwbHlWZWN0b3IzIiwidGFyZ2V0VmVjIiwiaW5wdXRWZWxvY2l0eSIsImRlbHRhIiwic3BlZWQiLCJtb3ZlRm9yd2FyZCIsIm9yZGVyIiwiYXBwbHlRdWF0ZXJuaW9uIiwiRmlyc3RQZXJzb25Nb2R1bGUiLCJibG9jayIsImdldEVsZW1lbnRCeUlkIiwiY29udHJvbHMiLCJlbGVtZW50IiwicG9pbnRlcmxvY2tjaGFuZ2UiLCJwb2ludGVyTG9ja0VsZW1lbnQiLCJtb3pQb2ludGVyTG9ja0VsZW1lbnQiLCJ3ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQiLCJzdHlsZSIsImRpc3BsYXkiLCJwb2ludGVybG9ja2Vycm9yIiwid2FybiIsInF1ZXJ5U2VsZWN0b3IiLCJyZXF1ZXN0UG9pbnRlckxvY2siLCJtb3pSZXF1ZXN0UG9pbnRlckxvY2siLCJ3ZWJraXRSZXF1ZXN0UG9pbnRlckxvY2siLCJyZXF1ZXN0RnVsbHNjcmVlbiIsIm1velJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxTY3JlZW4iLCJ3ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbiIsImZ1bGxzY3JlZW5jaGFuZ2UiLCJmdWxsc2NyZWVuRWxlbWVudCIsIm1vekZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbFNjcmVlbkVsZW1lbnQiLCJ1cGRhdGVQcm9jZXNzb3IiLCJ1cGRhdGVMb29wIl0sIm1hcHBpbmdzIjoiOzs7O0FBTUEsSUFBTUEsZ0JBQWdCO2VBQ1AsQ0FETzttQkFFSCxDQUZHO2lCQUdMLENBSEs7b0JBSUYsQ0FKRTtjQUtSO0NBTGQ7O0FBUUEsSUFBTUMsa0JBQWtCLEVBQXhCO0lBQ0VDLDJCQUEyQixDQUQ3QjtJQUVFQyx5QkFBeUIsQ0FGM0I7SUFHRUMsNEJBQTRCLENBSDlCOztBQUtBLElBQU1DLGVBQWUsSUFBSUMsT0FBSixFQUFyQjtJQUNFQyxlQUFlLElBQUlELE9BQUosRUFEakI7SUFFRUUsZUFBZSxJQUFJQyxPQUFKLEVBRmpCO0lBR0VDLFlBQVksSUFBSUMsVUFBSixFQUhkOztBQUtBLElBQU1DLDRCQUE0QixTQUE1QkEseUJBQTRCLENBQUNDLENBQUQsRUFBSUMsQ0FBSixFQUFPQyxDQUFQLEVBQVVDLENBQVYsRUFBZ0I7U0FDekMsSUFBSVYsT0FBSixDQUNMVyxLQUFLQyxLQUFMLENBQVcsS0FBS0wsSUFBSUcsQ0FBSixHQUFRRixJQUFJQyxDQUFqQixDQUFYLEVBQWlDQyxJQUFJQSxDQUFKLEdBQVFILElBQUlBLENBQVosR0FBZ0JDLElBQUlBLENBQXBCLEdBQXdCQyxJQUFJQSxDQUE3RCxDQURLLEVBRUxFLEtBQUtFLElBQUwsQ0FBVSxLQUFLTixJQUFJRSxDQUFKLEdBQVFELElBQUlFLENBQWpCLENBQVYsQ0FGSyxF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
