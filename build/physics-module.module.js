/* Physics module AmmoNext v0.1.2 */
import { BoxGeometry, BufferAttribute, BufferGeometry, Euler, Matrix4, Mesh, MeshNormalMaterial, Object3D, Quaternion, SphereGeometry, Vector2, Vector3 as Vector3$1 } from 'three';
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

var temp1Vector3 = new Vector3$1();
var temp2Vector3 = new Vector3$1();
var temp1Matrix4 = new Matrix4();
var temp1Quat = new Quaternion();

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
      gravity: new Vector3$1(0, -100, 0)
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
    linearVelocity: new Vector3$1(),
    angularVelocity: new Vector3$1(),
    mass: 10,
    scale: new Vector3$1(1, 1, 1),
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
}, _class.rope = function () {
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
}, _class.cloth = function () {
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

        var bufferGeometry = new BufferGeometry();

        bufferGeometry.addAttribute('position', new BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvYXBpLmpzIiwiLi4vc3JjL2V2ZW50YWJsZS5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Db25lVHdpc3RDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0hpbmdlQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Qb2ludENvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvU2xpZGVyQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9ET0ZDb25zdHJhaW50LmpzIiwiLi4vc3JjL3ZlaGljbGUvdmVoaWNsZS5qcyIsIi4uL2J1bmRsZS13b3JrZXIvd29ya2VyaGVscGVyLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9tb2R1bGVzL1dvcmxkTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29yZS9QaHlzaWNzTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQm94TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29tcG91bmRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DYXBzdWxlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29uY2F2ZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db252ZXhNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DeWxpbmRlck1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0hlaWdodGZpZWxkTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvUGxhbmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9TcGhlcmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Tb2Z0Ym9keU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0Nsb3RoTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvUm9wZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL2NvbnRyb2xzL0ZpcnN0UGVyc29uTW9kdWxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFZlY3RvcjMsXG4gIE1hdHJpeDQsXG4gIFF1YXRlcm5pb25cbn0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBNRVNTQUdFX1RZUEVTID0ge1xuICBXT1JMRFJFUE9SVDogMCxcbiAgQ09MTElTSU9OUkVQT1JUOiAxLFxuICBWRUhJQ0xFUkVQT1JUOiAyLFxuICBDT05TVFJBSU5UUkVQT1JUOiAzLFxuICBTT0ZUUkVQT1JUOiA0XG59O1xuXG5jb25zdCBSRVBPUlRfSVRFTVNJWkUgPSAxNCxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFID0gNSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSA9IDksXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUgPSA2O1xuXG5jb25zdCB0ZW1wMVZlY3RvcjMgPSBuZXcgVmVjdG9yMygpLFxuICB0ZW1wMlZlY3RvcjMgPSBuZXcgVmVjdG9yMygpLFxuICB0ZW1wMU1hdHJpeDQgPSBuZXcgTWF0cml4NCgpLFxuICB0ZW1wMVF1YXQgPSBuZXcgUXVhdGVybmlvbigpO1xuXG5jb25zdCBnZXRFdWxlclhZWkZyb21RdWF0ZXJuaW9uID0gKHgsIHksIHosIHcpID0+IHtcbiAgcmV0dXJuIG5ldyBWZWN0b3IzKFxuICAgIE1hdGguYXRhbjIoMiAqICh4ICogdyAtIHkgKiB6KSwgKHcgKiB3IC0geCAqIHggLSB5ICogeSArIHogKiB6KSksXG4gICAgTWF0aC5hc2luKDIgKiAoeCAqIHogKyB5ICogdykpLFxuICAgIE1hdGguYXRhbjIoMiAqICh6ICogdyAtIHggKiB5KSwgKHcgKiB3ICsgeCAqIHggLSB5ICogeSAtIHogKiB6KSlcbiAgKTtcbn07XG5cbmNvbnN0IGdldFF1YXRlcnRpb25Gcm9tRXVsZXIgPSAoeCwgeSwgeikgPT4ge1xuICBjb25zdCBjMSA9IE1hdGguY29zKHkpO1xuICBjb25zdCBzMSA9IE1hdGguc2luKHkpO1xuICBjb25zdCBjMiA9IE1hdGguY29zKC16KTtcbiAgY29uc3QgczIgPSBNYXRoLnNpbigteik7XG4gIGNvbnN0IGMzID0gTWF0aC5jb3MoeCk7XG4gIGNvbnN0IHMzID0gTWF0aC5zaW4oeCk7XG4gIGNvbnN0IGMxYzIgPSBjMSAqIGMyO1xuICBjb25zdCBzMXMyID0gczEgKiBzMjtcblxuICByZXR1cm4ge1xuICAgIHc6IGMxYzIgKiBjMyAtIHMxczIgKiBzMyxcbiAgICB4OiBjMWMyICogczMgKyBzMXMyICogYzMsXG4gICAgeTogczEgKiBjMiAqIGMzICsgYzEgKiBzMiAqIHMzLFxuICAgIHo6IGMxICogczIgKiBjMyAtIHMxICogYzIgKiBzM1xuICB9O1xufTtcblxuY29uc3QgY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCA9IChwb3NpdGlvbiwgb2JqZWN0KSA9PiB7XG4gIHRlbXAxTWF0cml4NC5pZGVudGl0eSgpOyAvLyByZXNldCB0ZW1wIG1hdHJpeFxuXG4gIC8vIFNldCB0aGUgdGVtcCBtYXRyaXgncyByb3RhdGlvbiB0byB0aGUgb2JqZWN0J3Mgcm90YXRpb25cbiAgdGVtcDFNYXRyaXg0LmlkZW50aXR5KCkubWFrZVJvdGF0aW9uRnJvbVF1YXRlcm5pb24ob2JqZWN0LnF1YXRlcm5pb24pO1xuXG4gIC8vIEludmVydCByb3RhdGlvbiBtYXRyaXggaW4gb3JkZXIgdG8gXCJ1bnJvdGF0ZVwiIGEgcG9pbnQgYmFjayB0byBvYmplY3Qgc3BhY2VcbiAgdGVtcDFNYXRyaXg0LmdldEludmVyc2UodGVtcDFNYXRyaXg0KTtcblxuICAvLyBZYXkhIFRlbXAgdmFycyFcbiAgdGVtcDFWZWN0b3IzLmNvcHkocG9zaXRpb24pO1xuICB0ZW1wMlZlY3RvcjMuY29weShvYmplY3QucG9zaXRpb24pO1xuXG4gIC8vIEFwcGx5IHRoZSByb3RhdGlvblxuICByZXR1cm4gdGVtcDFWZWN0b3IzLnN1Yih0ZW1wMlZlY3RvcjMpLmFwcGx5TWF0cml4NCh0ZW1wMU1hdHJpeDQpO1xufTtcblxuY29uc3QgYWRkT2JqZWN0Q2hpbGRyZW4gPSBmdW5jdGlvbiAocGFyZW50LCBvYmplY3QpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmplY3QuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZCA9IG9iamVjdC5jaGlsZHJlbltpXTtcbiAgICBjb25zdCBwaHlzaWNzID0gY2hpbGQuY29tcG9uZW50ID8gY2hpbGQuY29tcG9uZW50LnVzZSgncGh5c2ljcycpIDogZmFsc2U7XG5cbiAgICBpZiAocGh5c2ljcykge1xuICAgICAgY29uc3QgZGF0YSA9IHBoeXNpY3MuZGF0YTtcblxuICAgICAgY2hpbGQudXBkYXRlTWF0cml4KCk7XG4gICAgICBjaGlsZC51cGRhdGVNYXRyaXhXb3JsZCgpO1xuXG4gICAgICB0ZW1wMVZlY3RvcjMuc2V0RnJvbU1hdHJpeFBvc2l0aW9uKGNoaWxkLm1hdHJpeFdvcmxkKTtcbiAgICAgIHRlbXAxUXVhdC5zZXRGcm9tUm90YXRpb25NYXRyaXgoY2hpbGQubWF0cml4V29ybGQpO1xuXG4gICAgICBkYXRhLnBvc2l0aW9uX29mZnNldCA9IHtcbiAgICAgICAgeDogdGVtcDFWZWN0b3IzLngsXG4gICAgICAgIHk6IHRlbXAxVmVjdG9yMy55LFxuICAgICAgICB6OiB0ZW1wMVZlY3RvcjMuelxuICAgICAgfTtcblxuICAgICAgZGF0YS5yb3RhdGlvbiA9IHtcbiAgICAgICAgeDogdGVtcDFRdWF0LngsXG4gICAgICAgIHk6IHRlbXAxUXVhdC55LFxuICAgICAgICB6OiB0ZW1wMVF1YXQueixcbiAgICAgICAgdzogdGVtcDFRdWF0LndcbiAgICAgIH07XG5cbiAgICAgIHBhcmVudC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YS5jaGlsZHJlbi5wdXNoKGRhdGEpO1xuICAgIH1cblxuICAgIGFkZE9iamVjdENoaWxkcmVuKHBhcmVudCwgY2hpbGQpO1xuICB9XG59O1xuXG5leHBvcnQge1xuICBnZXRFdWxlclhZWkZyb21RdWF0ZXJuaW9uLFxuICBnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyLFxuICBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0LFxuICBhZGRPYmplY3RDaGlsZHJlbixcblxuICBNRVNTQUdFX1RZUEVTLFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSxcblxuICB0ZW1wMVZlY3RvcjMsXG4gIHRlbXAyVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICB0ZW1wMVF1YXRcbn07XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRhYmxlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnMgPSB7fTtcbiAgfVxuXG4gIGFkZEV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKVxuICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0gPSBbXTtcblxuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjYWxsYmFjaykge1xuICAgIGxldCBpbmRleDtcblxuICAgIGlmICghdGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpIHJldHVybiBmYWxzZTtcblxuICAgIGlmICgoaW5kZXggPSB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5pbmRleE9mKGNhbGxiYWNrKSkgPj0gMCkge1xuICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGRpc3BhdGNoRXZlbnQoZXZlbnRfbmFtZSkge1xuICAgIGxldCBpO1xuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIGlmICh0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXVtpXS5hcHBseSh0aGlzLCBwYXJhbWV0ZXJzKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbWFrZShvYmopIHtcbiAgICBvYmoucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBFdmVudGFibGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG4gICAgb2JqLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gRXZlbnRhYmxlLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuICAgIG9iai5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IEV2ZW50YWJsZS5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudDtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgQ29uZVR3aXN0Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgY29uc3Qgb2JqZWN0YiA9IG9iamE7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkgY29uc29sZS5lcnJvcignQm90aCBvYmplY3RzIG11c3QgYmUgZGVmaW5lZCBpbiBhIENvbmVUd2lzdENvbnN0cmFpbnQuJyk7XG5cbiAgICB0aGlzLnR5cGUgPSAnY29uZXR3aXN0JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgdGhpcy5heGlzYSA9IHt4OiBvYmplY3RhLnJvdGF0aW9uLngsIHk6IG9iamVjdGEucm90YXRpb24ueSwgejogb2JqZWN0YS5yb3RhdGlvbi56fTtcbiAgICB0aGlzLmF4aXNiID0ge3g6IG9iamVjdGIucm90YXRpb24ueCwgeTogb2JqZWN0Yi5yb3RhdGlvbi55LCB6OiBvYmplY3RiLnJvdGF0aW9uLnp9O1xuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXNhOiB0aGlzLmF4aXNhLFxuICAgICAgYXhpc2I6IHRoaXMuYXhpc2JcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXQoeCwgeSwgeikge1xuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X3NldExpbWl0Jywge2NvbnN0cmFpbnQ6IHRoaXMuaWQsIHgsIHksIHp9KTtcbiAgfVxuXG4gIGVuYWJsZU1vdG9yKCkge1xuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X2VuYWJsZU1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxuXG4gIHNldE1heE1vdG9ySW1wdWxzZShtYXhfaW1wdWxzZSkge1xuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X3NldE1heE1vdG9ySW1wdWxzZScsIHtjb25zdHJhaW50OiB0aGlzLmlkLCBtYXhfaW1wdWxzZX0pO1xuICB9XG5cbiAgc2V0TW90b3JUYXJnZXQodGFyZ2V0KSB7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFRIUkVFLlZlY3RvcjMpXG4gICAgICB0YXJnZXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihuZXcgVEhSRUUuRXVsZXIodGFyZ2V0LngsIHRhcmdldC55LCB0YXJnZXQueikpO1xuICAgIGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFRIUkVFLkV1bGVyKVxuICAgICAgdGFyZ2V0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIodGFyZ2V0KTtcbiAgICBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBUSFJFRS5NYXRyaXg0KVxuICAgICAgdGFyZ2V0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tUm90YXRpb25NYXRyaXgodGFyZ2V0KTtcblxuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X3NldE1vdG9yVGFyZ2V0Jywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHg6IHRhcmdldC54LFxuICAgICAgeTogdGFyZ2V0LnksXG4gICAgICB6OiB0YXJnZXQueixcbiAgICAgIHc6IHRhcmdldC53XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIEhpbmdlQ29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uLCBheGlzKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKGF4aXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXhpcyA9IHBvc2l0aW9uO1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnaGluZ2UnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXM6IHRoaXMuYXhpc1xuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdHMobG93LCBoaWdoLCBiaWFzX2ZhY3RvciwgcmVsYXhhdGlvbl9mYWN0b3IpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdoaW5nZV9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbG93LFxuICAgICAgaGlnaCxcbiAgICAgIGJpYXNfZmFjdG9yLFxuICAgICAgcmVsYXhhdGlvbl9mYWN0b3JcbiAgICB9KTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZGlzYWJsZU1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgUG9pbnRDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAncG9pbnQnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmJcbiAgICB9O1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBTbGlkZXJDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24sIGF4aXMpIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoYXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBheGlzID0gcG9zaXRpb247XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdzbGlkZXInO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXM6IHRoaXMuYXhpc1xuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdHMobGluX2xvd2VyLCBsaW5fdXBwZXIsIGFuZ19sb3dlciwgYW5nX3VwcGVyKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX3NldExpbWl0cycsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICBsaW5fbG93ZXIsXG4gICAgICBsaW5fdXBwZXIsXG4gICAgICBhbmdfbG93ZXIsXG4gICAgICBhbmdfdXBwZXJcbiAgICB9KTtcbiAgfVxuXG4gIHNldFJlc3RpdHV0aW9uKGxpbmVhciwgYW5ndWxhcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoXG4gICAgICAnc2xpZGVyX3NldFJlc3RpdHV0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgICAgbGluZWFyLFxuICAgICAgICBhbmd1bGFyXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGVuYWJsZUxpbmVhck1vdG9yKHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZW5hYmxlTGluZWFyTW90b3InLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgdmVsb2NpdHksXG4gICAgICBhY2NlbGVyYXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVMaW5lYXJNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZGlzYWJsZUxpbmVhck1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgdGhpcy5zY2VuZS5leGVjdXRlKCdzbGlkZXJfZW5hYmxlQW5ndWxhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlQW5ndWxhck1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9kaXNhYmxlQW5ndWxhck1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgRE9GQ29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKCBwb3NpdGlvbiA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnZG9mJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YSApLmNsb25lKCk7XG4gICAgdGhpcy5heGlzYSA9IHsgeDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24ueiB9O1xuXG4gICAgaWYgKCBvYmplY3RiICkge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YiApLmNsb25lKCk7XG4gICAgICB0aGlzLmF4aXNiID0geyB4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56IH07XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXNhOiB0aGlzLmF4aXNhLFxuICAgICAgYXhpc2I6IHRoaXMuYXhpc2JcbiAgICB9O1xuICB9XG5cbiAgc2V0TGluZWFyTG93ZXJMaW1pdChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRMaW5lYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyVXBwZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyTG93ZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZW5hYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG5cbiAgY29uZmlndXJlQW5ndWxhck1vdG9yICh3aGljaCwgbG93X2FuZ2xlLCBoaWdoX2FuZ2xlLCB2ZWxvY2l0eSwgbWF4X2ZvcmNlICkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2gsIGxvd19hbmdsZTogbG93X2FuZ2xlLCBoaWdoX2FuZ2xlOiBoaWdoX2FuZ2xlLCB2ZWxvY2l0eTogdmVsb2NpdHksIG1heF9mb3JjZTogbWF4X2ZvcmNlIH0gKTtcbiAgfVxuXG4gIGRpc2FibGVBbmd1bGFyTW90b3IgKHdoaWNoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9kaXNhYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG59XG4iLCJpbXBvcnQge01lc2h9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7VmVoaWNsZVR1bm5pbmd9IGZyb20gJy4vdHVubmluZyc7XG5cbmV4cG9ydCBjbGFzcyBWZWhpY2xlIHtcbiAgY29uc3RydWN0b3IobWVzaCwgdHVuaW5nID0gbmV3IFZlaGljbGVUdW5pbmcoKSkge1xuICAgIHRoaXMubWVzaCA9IG1lc2g7XG4gICAgdGhpcy53aGVlbHMgPSBbXTtcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICBpZDogZ2V0T2JqZWN0SWQoKSxcbiAgICAgIHJpZ2lkQm9keTogbWVzaC5fcGh5c2lqcy5pZCxcbiAgICAgIHN1c3BlbnNpb25fc3RpZmZuZXNzOiB0dW5pbmcuc3VzcGVuc2lvbl9zdGlmZm5lc3MsXG4gICAgICBzdXNwZW5zaW9uX2NvbXByZXNzaW9uOiB0dW5pbmcuc3VzcGVuc2lvbl9jb21wcmVzc2lvbixcbiAgICAgIHN1c3BlbnNpb25fZGFtcGluZzogdHVuaW5nLnN1c3BlbnNpb25fZGFtcGluZyxcbiAgICAgIG1heF9zdXNwZW5zaW9uX3RyYXZlbDogdHVuaW5nLm1heF9zdXNwZW5zaW9uX3RyYXZlbCxcbiAgICAgIGZyaWN0aW9uX3NsaXA6IHR1bmluZy5mcmljdGlvbl9zbGlwLFxuICAgICAgbWF4X3N1c3BlbnNpb25fZm9yY2U6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl9mb3JjZVxuICAgIH07XG4gIH1cblxuICBhZGRXaGVlbCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwsIGNvbm5lY3Rpb25fcG9pbnQsIHdoZWVsX2RpcmVjdGlvbiwgd2hlZWxfYXhsZSwgc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCwgd2hlZWxfcmFkaXVzLCBpc19mcm9udF93aGVlbCwgdHVuaW5nKSB7XG4gICAgY29uc3Qgd2hlZWwgPSBuZXcgTWVzaCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwpO1xuXG4gICAgd2hlZWwuY2FzdFNoYWRvdyA9IHdoZWVsLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgIHdoZWVsLnBvc2l0aW9uLmNvcHkod2hlZWxfZGlyZWN0aW9uKS5tdWx0aXBseVNjYWxhcihzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoIC8gMTAwKS5hZGQoY29ubmVjdGlvbl9wb2ludCk7XG5cbiAgICB0aGlzLndvcmxkLmFkZCh3aGVlbCk7XG4gICAgdGhpcy53aGVlbHMucHVzaCh3aGVlbCk7XG5cbiAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FkZFdoZWVsJywge1xuICAgICAgaWQ6IHRoaXMuX3BoeXNpanMuaWQsXG4gICAgICBjb25uZWN0aW9uX3BvaW50OiB7eDogY29ubmVjdGlvbl9wb2ludC54LCB5OiBjb25uZWN0aW9uX3BvaW50LnksIHo6IGNvbm5lY3Rpb25fcG9pbnQuen0sXG4gICAgICB3aGVlbF9kaXJlY3Rpb246IHt4OiB3aGVlbF9kaXJlY3Rpb24ueCwgeTogd2hlZWxfZGlyZWN0aW9uLnksIHo6IHdoZWVsX2RpcmVjdGlvbi56fSxcbiAgICAgIHdoZWVsX2F4bGU6IHt4OiB3aGVlbF9heGxlLngsIHk6IHdoZWVsX2F4bGUueSwgejogd2hlZWxfYXhsZS56fSxcbiAgICAgIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsXG4gICAgICB3aGVlbF9yYWRpdXMsXG4gICAgICBpc19mcm9udF93aGVlbCxcbiAgICAgIHR1bmluZ1xuICAgIH0pO1xuICB9XG5cbiAgc2V0U3RlZXJpbmcoYW1vdW50LCB3aGVlbCkge1xuICAgIGlmICh3aGVlbCAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2hlZWxzW3doZWVsXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldFN0ZWVyaW5nJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgc3RlZXJpbmc6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxuXG4gIHNldEJyYWtlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBicmFrZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRCcmFrZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIGJyYWtlOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBhcHBseUVuZ2luZUZvcmNlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnYXBwbHlFbmdpbmVGb3JjZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIGZvcmNlOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBmb3JjZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG59XG4iLCJ2YXIgVEFSR0VUID0gdHlwZW9mIFN5bWJvbCA9PT0gJ3VuZGVmaW5lZCcgPyAnX190YXJnZXQnIDogU3ltYm9sKCksXG4gICAgU0NSSVBUX1RZUEUgPSAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcsXG4gICAgQmxvYkJ1aWxkZXIgPSB3aW5kb3cuQmxvYkJ1aWxkZXIgfHwgd2luZG93LldlYktpdEJsb2JCdWlsZGVyIHx8IHdpbmRvdy5Nb3pCbG9iQnVpbGRlciB8fCB3aW5kb3cuTVNCbG9iQnVpbGRlcixcbiAgICBVUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwsXG4gICAgV29ya2VyID0gd2luZG93LldvcmtlcjtcblxuLyoqXG4gKiBSZXR1cm5zIGEgd3JhcHBlciBhcm91bmQgV2ViIFdvcmtlciBjb2RlIHRoYXQgaXMgY29uc3RydWN0aWJsZS5cbiAqXG4gKiBAZnVuY3Rpb24gc2hpbVdvcmtlclxuICpcbiAqIEBwYXJhbSB7IFN0cmluZyB9ICAgIGZpbGVuYW1lICAgIFRoZSBuYW1lIG9mIHRoZSBmaWxlXG4gKiBAcGFyYW0geyBGdW5jdGlvbiB9ICBmbiAgICAgICAgICBGdW5jdGlvbiB3cmFwcGluZyB0aGUgY29kZSBvZiB0aGUgd29ya2VyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNoaW1Xb3JrZXIgKGZpbGVuYW1lLCBmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiBTaGltV29ya2VyIChmb3JjZUZhbGxiYWNrKSB7XG4gICAgICAgIHZhciBvID0gdGhpcztcblxuICAgICAgICBpZiAoIWZuKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFdvcmtlcihmaWxlbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoV29ya2VyICYmICFmb3JjZUZhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBmdW5jdGlvbidzIGlubmVyIGNvZGUgdG8gYSBzdHJpbmcgdG8gY29uc3RydWN0IHRoZSB3b3JrZXJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBmbi50b1N0cmluZygpLnJlcGxhY2UoL15mdW5jdGlvbi4rP3svLCAnJykuc2xpY2UoMCwgLTEpLFxuICAgICAgICAgICAgICAgIG9ialVSTCA9IGNyZWF0ZVNvdXJjZU9iamVjdChzb3VyY2UpO1xuXG4gICAgICAgICAgICB0aGlzW1RBUkdFVF0gPSBuZXcgV29ya2VyKG9ialVSTCk7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKG9ialVSTCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tUQVJHRVRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNlbGZTaGltID0ge1xuICAgICAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZTogZnVuY3Rpb24obSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8ub25tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBvLm9ubWVzc2FnZSh7IGRhdGE6IG0sIHRhcmdldDogc2VsZlNoaW0gfSkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmbi5jYWxsKHNlbGZTaGltKTtcbiAgICAgICAgICAgIHRoaXMucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBzZWxmU2hpbS5vbm1lc3NhZ2UoeyBkYXRhOiBtLCB0YXJnZXQ6IG8gfSkgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5pc1RoaXNUaHJlYWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8vIFRlc3QgV29ya2VyIGNhcGFiaWxpdGllc1xuaWYgKFdvcmtlcikge1xuICAgIHZhciB0ZXN0V29ya2VyLFxuICAgICAgICBvYmpVUkwgPSBjcmVhdGVTb3VyY2VPYmplY3QoJ3NlbGYub25tZXNzYWdlID0gZnVuY3Rpb24gKCkge30nKSxcbiAgICAgICAgdGVzdEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoMSk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBObyB3b3JrZXJzIHZpYSBibG9icyBpbiBFZGdlIDEyIGFuZCBJRSAxMSBhbmQgbG93ZXIgOihcbiAgICAgICAgaWYgKC8oPzpUcmlkZW50fEVkZ2UpXFwvKD86WzU2N118MTIpL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYXZhaWxhYmxlJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGVzdFdvcmtlciA9IG5ldyBXb3JrZXIob2JqVVJMKTtcblxuICAgICAgICAvLyBOYXRpdmUgYnJvd3NlciBvbiBzb21lIFNhbXN1bmcgZGV2aWNlcyB0aHJvd3MgZm9yIHRyYW5zZmVyYWJsZXMsIGxldCdzIGRldGVjdCBpdFxuICAgICAgICB0ZXN0V29ya2VyLnBvc3RNZXNzYWdlKHRlc3RBcnJheSwgW3Rlc3RBcnJheS5idWZmZXJdKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgV29ya2VyID0gbnVsbDtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwob2JqVVJMKTtcbiAgICAgICAgaWYgKHRlc3RXb3JrZXIpIHtcbiAgICAgICAgICAgIHRlc3RXb3JrZXIudGVybWluYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNvdXJjZU9iamVjdChzdHIpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbc3RyXSwgeyB0eXBlOiBTQ1JJUFRfVFlQRSB9KSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBibG9iID0gbmV3IEJsb2JCdWlsZGVyKCk7XG4gICAgICAgIGJsb2IuYXBwZW5kKHN0cik7XG4gICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IuZ2V0QmxvYih0eXBlKSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHNoaW1Xb3JrZXIgZnJvbSAncm9sbHVwLXBsdWdpbi1idW5kbGUtd29ya2VyJztcbmV4cG9ydCBkZWZhdWx0IG5ldyBzaGltV29ya2VyKFwiLi4vd29ya2VyLmpzXCIsIGZ1bmN0aW9uICh3aW5kb3csIGRvY3VtZW50KSB7XG52YXIgc2VsZiA9IHRoaXM7XG5jb25zdCB0cmFuc2ZlcmFibGVNZXNzYWdlID0gc2VsZi53ZWJraXRQb3N0TWVzc2FnZSB8fCBzZWxmLnBvc3RNZXNzYWdlLFxuXG4vLyBlbnVtXG5NRVNTQUdFX1RZUEVTID0ge1xuICBXT1JMRFJFUE9SVDogMCxcbiAgQ09MTElTSU9OUkVQT1JUOiAxLFxuICBWRUhJQ0xFUkVQT1JUOiAyLFxuICBDT05TVFJBSU5UUkVQT1JUOiAzLFxuICBTT0ZUUkVQT1JUOiA0XG59O1xuXG4gIC8vIHRlbXAgdmFyaWFibGVzXG5sZXQgX29iamVjdCxcbiAgX3ZlY3RvcixcbiAgX3RyYW5zZm9ybSxcbiAgX3RyYW5zZm9ybV9wb3MsXG4gIF9zb2Z0Ym9keV9lbmFibGVkID0gZmFsc2UsXG4gIGxhc3Rfc2ltdWxhdGlvbl9kdXJhdGlvbiA9IDAsXG5cbiAgX251bV9vYmplY3RzID0gMCxcbiAgX251bV9yaWdpZGJvZHlfb2JqZWN0cyA9IDAsXG4gIF9udW1fc29mdGJvZHlfb2JqZWN0cyA9IDAsXG4gIF9udW1fd2hlZWxzID0gMCxcbiAgX251bV9jb25zdHJhaW50cyA9IDAsXG4gIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSA9IDAsXG5cbiAgLy8gd29ybGQgdmFyaWFibGVzXG4gIGZpeGVkVGltZVN0ZXAsIC8vIHVzZWQgd2hlbiBjYWxsaW5nIHN0ZXBTaW11bGF0aW9uXG4gIGxhc3Rfc2ltdWxhdGlvbl90aW1lLFxuXG4gIHdvcmxkLFxuICBfdmVjM18xLFxuICBfdmVjM18yLFxuICBfdmVjM18zLFxuICBfcXVhdDtcblxuICAvLyBwcml2YXRlIGNhY2hlXG5jb25zdCBwdWJsaWNfZnVuY3Rpb25zID0ge30sXG4gIF9vYmplY3RzID0gW10sXG4gIF92ZWhpY2xlcyA9IFtdLFxuICBfY29uc3RyYWludHMgPSBbXSxcbiAgX29iamVjdHNfYW1tbyA9IHt9LFxuICBfb2JqZWN0X3NoYXBlcyA9IHt9LFxuXG4gIC8vIFRoZSBmb2xsb3dpbmcgb2JqZWN0cyBhcmUgdG8gdHJhY2sgb2JqZWN0cyB0aGF0IGFtbW8uanMgZG9lc24ndCBjbGVhblxuICAvLyB1cC4gQWxsIGFyZSBjbGVhbmVkIHVwIHdoZW4gdGhleSdyZSBjb3JyZXNwb25kaW5nIGJvZHkgaXMgZGVzdHJveWVkLlxuICAvLyBVbmZvcnR1bmF0ZWx5LCBpdCdzIHZlcnkgZGlmZmljdWx0IHRvIGdldCBhdCB0aGVzZSBvYmplY3RzIGZyb20gdGhlXG4gIC8vIGJvZHksIHNvIHdlIGhhdmUgdG8gdHJhY2sgdGhlbSBvdXJzZWx2ZXMuXG4gIF9tb3Rpb25fc3RhdGVzID0ge30sXG4gIC8vIERvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgaXQgZm9yIGNhY2hlZCBzaGFwZXMuXG4gIF9ub25jYWNoZWRfc2hhcGVzID0ge30sXG4gIC8vIEEgYm9keSB3aXRoIGEgY29tcG91bmQgc2hhcGUgYWx3YXlzIGhhcyBhIHJlZ3VsYXIgc2hhcGUgYXMgd2VsbCwgc28gd2VcbiAgLy8gaGF2ZSB0cmFjayB0aGVtIHNlcGFyYXRlbHkuXG4gIF9jb21wb3VuZF9zaGFwZXMgPSB7fTtcblxuICAvLyBvYmplY3QgcmVwb3J0aW5nXG5sZXQgUkVQT1JUX0NIVU5LU0laRSwgLy8gcmVwb3J0IGFycmF5IGlzIGluY3JlYXNlZCBpbiBpbmNyZW1lbnRzIG9mIHRoaXMgY2h1bmsgc2l6ZVxuICB3b3JsZHJlcG9ydCxcbiAgc29mdHJlcG9ydCxcbiAgY29sbGlzaW9ucmVwb3J0LFxuICB2ZWhpY2xlcmVwb3J0LFxuICBjb25zdHJhaW50cmVwb3J0O1xuXG5jb25zdCBXT1JMRFJFUE9SVF9JVEVNU0laRSA9IDE0LCAvLyBob3cgbWFueSBmbG9hdCB2YWx1ZXMgZWFjaCByZXBvcnRlZCBpdGVtIG5lZWRzXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSA9IDUsIC8vIG9uZSBmbG9hdCBmb3IgZWFjaCBvYmplY3QgaWQsIGFuZCBhIFZlYzMgY29udGFjdCBub3JtYWxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSA9IDksIC8vIHZlaGljbGUgaWQsIHdoZWVsIGluZGV4LCAzIGZvciBwb3NpdGlvbiwgNCBmb3Igcm90YXRpb25cbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSA9IDY7IC8vIGNvbnN0cmFpbnQgaWQsIG9mZnNldCBvYmplY3QsIG9mZnNldCwgYXBwbGllZCBpbXB1bHNlXG5cbmNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKDEpO1xuXG50cmFuc2ZlcmFibGVNZXNzYWdlKGFiLCBbYWJdKTtcbmNvbnN0IFNVUFBPUlRfVFJBTlNGRVJBQkxFID0gKGFiLmJ5dGVMZW5ndGggPT09IDApO1xuXG5jb25zdCBnZXRTaGFwZUZyb21DYWNoZSA9IChjYWNoZV9rZXkpID0+IHtcbiAgaWYgKF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV0gIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XTtcblxuICByZXR1cm4gbnVsbDtcbn07XG5cbmNvbnN0IHNldFNoYXBlQ2FjaGUgPSAoY2FjaGVfa2V5LCBzaGFwZSkgPT4ge1xuICBfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldID0gc2hhcGU7XG59O1xuXG5jb25zdCBjcmVhdGVTaGFwZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBsZXQgc2hhcGU7XG5cbiAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuICBzd2l0Y2ggKGRlc2NyaXB0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdjb21wb3VuZCc6IHtcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb21wb3VuZFNoYXBlKCk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdwbGFuZSc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBwbGFuZV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC54fV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC55fV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC56fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ubm9ybWFsLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ubm9ybWFsLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ubm9ybWFsLnopO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0U3RhdGljUGxhbmVTaGFwZShfdmVjM18xLCAwKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2JveCc6IHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBib3hfJHtkZXNjcmlwdGlvbi53aWR0aH1fJHtkZXNjcmlwdGlvbi5oZWlnaHR9XyR7ZGVzY3JpcHRpb24uZGVwdGh9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi53aWR0aCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uaGVpZ2h0IC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5kZXB0aCAvIDIpO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Qm94U2hhcGUoX3ZlYzNfMSk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdzcGhlcmUnOiB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgc3BoZXJlXyR7ZGVzY3JpcHRpb24ucmFkaXVzfWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0U3BoZXJlU2hhcGUoZGVzY3JpcHRpb24ucmFkaXVzKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2N5bGluZGVyJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGN5bGluZGVyXyR7ZGVzY3JpcHRpb24ud2lkdGh9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fV8ke2Rlc2NyaXB0aW9uLmRlcHRofWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ud2lkdGggLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmhlaWdodCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uZGVwdGggLyAyKTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEN5bGluZGVyU2hhcGUoX3ZlYzNfMSk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjYXBzdWxlJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGNhcHN1bGVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICAvLyBJbiBCdWxsZXQsIGNhcHN1bGUgaGVpZ2h0IGV4Y2x1ZGVzIHRoZSBlbmQgc3BoZXJlc1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q2Fwc3VsZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cywgZGVzY3JpcHRpb24uaGVpZ2h0IC0gMiAqIGRlc2NyaXB0aW9uLnJhZGl1cyk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdjb25lJzoge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGNvbmVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29uZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cywgZGVzY3JpcHRpb24uaGVpZ2h0KTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2NvbmNhdmUnOiB7XG4gICAgICBjb25zdCB0cmlhbmdsZV9tZXNoID0gbmV3IEFtbW8uYnRUcmlhbmdsZU1lc2goKTtcbiAgICAgIGlmICghZGVzY3JpcHRpb24uZGF0YS5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoIC8gOTsgaSsrKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkYXRhW2kgKiA5XSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkYXRhW2kgKiA5ICsgMV0pO1xuICAgICAgICBfdmVjM18xLnNldFooZGF0YVtpICogOSArIDJdKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGF0YVtpICogOSArIDNdKTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRhdGFbaSAqIDkgKyA0XSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkYXRhW2kgKiA5ICsgNV0pO1xuXG4gICAgICAgIF92ZWMzXzMuc2V0WChkYXRhW2kgKiA5ICsgNl0pO1xuICAgICAgICBfdmVjM18zLnNldFkoZGF0YVtpICogOSArIDddKTtcbiAgICAgICAgX3ZlYzNfMy5zZXRaKGRhdGFbaSAqIDkgKyA4XSk7XG5cbiAgICAgICAgdHJpYW5nbGVfbWVzaC5hZGRUcmlhbmdsZShcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzIsXG4gICAgICAgICAgX3ZlYzNfMyxcbiAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0QnZoVHJpYW5nbGVNZXNoU2hhcGUoXG4gICAgICAgIHRyaWFuZ2xlX21lc2gsXG4gICAgICAgIHRydWUsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY29udmV4Jzoge1xuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbnZleEh1bGxTaGFwZSgpO1xuICAgICAgY29uc3QgZGF0YSA9IGRlc2NyaXB0aW9uLmRhdGE7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGggLyAzOyBpKyspIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRhdGFbaSAqIDMgXSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkYXRhW2kgKiAzICsgMV0pO1xuICAgICAgICBfdmVjM18xLnNldFooZGF0YVtpICogMyArIDJdKTtcblxuICAgICAgICBzaGFwZS5hZGRQb2ludChfdmVjM18xKTtcbiAgICAgIH1cblxuICAgICAgX25vbmNhY2hlZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdoZWlnaHRmaWVsZCc6IHtcbiAgICAgIGNvbnN0IHhwdHMgPSBkZXNjcmlwdGlvbi54cHRzLFxuICAgICAgICB5cHRzID0gZGVzY3JpcHRpb24ueXB0cyxcbiAgICAgICAgcG9pbnRzID0gZGVzY3JpcHRpb24ucG9pbnRzLFxuICAgICAgICBwdHIgPSBBbW1vLl9tYWxsb2MoNCAqIHhwdHMgKiB5cHRzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDAsIHAgPSAwLCBwMiA9IDA7IGkgPCB4cHRzOyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB5cHRzOyBqKyspIHtcbiAgICAgICAgICBBbW1vLkhFQVBGMzJbcHRyICsgcDIgPj4gMl0gPSBwb2ludHNbcF07XG5cbiAgICAgICAgICBwKys7XG4gICAgICAgICAgcDIgKz0gNDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0SGVpZ2h0ZmllbGRUZXJyYWluU2hhcGUoXG4gICAgICAgIGRlc2NyaXB0aW9uLnhwdHMsXG4gICAgICAgIGRlc2NyaXB0aW9uLnlwdHMsXG4gICAgICAgIHB0cixcbiAgICAgICAgMSxcbiAgICAgICAgLWRlc2NyaXB0aW9uLmFic01heEhlaWdodCxcbiAgICAgICAgZGVzY3JpcHRpb24uYWJzTWF4SGVpZ2h0LFxuICAgICAgICAxLFxuICAgICAgICAnUEhZX0ZMT0FUJyxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBOb3QgcmVjb2duaXplZFxuICAgICAgcmV0dXJuO1xuICB9XG5cbiAgcmV0dXJuIHNoYXBlO1xufTtcblxuY29uc3QgY3JlYXRlU29mdEJvZHkgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IGJvZHk7XG5cbiAgY29uc3Qgc29mdEJvZHlIZWxwZXJzID0gbmV3IEFtbW8uYnRTb2Z0Qm9keUhlbHBlcnMoKTtcblxuICBzd2l0Y2ggKGRlc2NyaXB0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdzb2Z0VHJpbWVzaCc6IHtcbiAgICAgIGlmICghZGVzY3JpcHRpb24uYVZlcnRpY2VzLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBib2R5ID0gc29mdEJvZHlIZWxwZXJzLkNyZWF0ZUZyb21UcmlNZXNoKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgZGVzY3JpcHRpb24uYVZlcnRpY2VzLFxuICAgICAgICBkZXNjcmlwdGlvbi5hSW5kaWNlcyxcbiAgICAgICAgZGVzY3JpcHRpb24uYUluZGljZXMubGVuZ3RoIC8gMyxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdzb2Z0Q2xvdGhNZXNoJzoge1xuICAgICAgY29uc3QgY3IgPSBkZXNjcmlwdGlvbi5jb3JuZXJzO1xuXG4gICAgICBib2R5ID0gc29mdEJvZHlIZWxwZXJzLkNyZWF0ZVBhdGNoKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzBdLCBjclsxXSwgY3JbMl0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbM10sIGNyWzRdLCBjcls1XSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjcls2XSwgY3JbN10sIGNyWzhdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzldLCBjclsxMF0sIGNyWzExXSksXG4gICAgICAgIGRlc2NyaXB0aW9uLnNlZ21lbnRzWzBdLFxuICAgICAgICBkZXNjcmlwdGlvbi5zZWdtZW50c1sxXSxcbiAgICAgICAgMCxcbiAgICAgICAgdHJ1ZVxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ3NvZnRSb3BlTWVzaCc6IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBib2R5ID0gc29mdEJvZHlIZWxwZXJzLkNyZWF0ZVJvcGUoXG4gICAgICAgIHdvcmxkLmdldFdvcmxkSW5mbygpLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoZGF0YVswXSwgZGF0YVsxXSwgZGF0YVsyXSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhkYXRhWzNdLCBkYXRhWzRdLCBkYXRhWzVdKSxcbiAgICAgICAgZGF0YVs2XSAtIDEsXG4gICAgICAgIDBcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgLy8gTm90IHJlY29nbml6ZWRcbiAgICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBib2R5O1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5pbml0ID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIGlmIChwYXJhbXMud2FzbUJ1ZmZlcikge1xuICAgIGltcG9ydFNjcmlwdHMocGFyYW1zLmFtbW8pO1xuXG4gICAgc2VsZi5BbW1vID0gbG9hZEFtbW9Gcm9tQmluYXJ5KHBhcmFtcy53YXNtQnVmZmVyKTtcbiAgICB0cmFuc2ZlcmFibGVNZXNzYWdlKHtjbWQ6ICdhbW1vTG9hZGVkJ30pO1xuICAgIHB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkKHBhcmFtcyk7XG4gIH0gZWxzZSB7XG4gICAgaW1wb3J0U2NyaXB0cyhwYXJhbXMuYW1tbyk7XG4gICAgdHJhbnNmZXJhYmxlTWVzc2FnZSh7Y21kOiAnYW1tb0xvYWRlZCd9KTtcbiAgICBwdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZChwYXJhbXMpO1xuICB9XG59XG5cbnB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIF90cmFuc2Zvcm0gPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICBfdHJhbnNmb3JtX3BvcyA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gIF92ZWMzXzEgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzIgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzMgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF9xdWF0ID0gbmV3IEFtbW8uYnRRdWF0ZXJuaW9uKDAsIDAsIDAsIDApO1xuXG4gIFJFUE9SVF9DSFVOS1NJWkUgPSBwYXJhbXMucmVwb3J0c2l6ZSB8fCA1MDtcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICAvLyBUcmFuc2ZlcmFibGUgbWVzc2FnZXMgYXJlIHN1cHBvcnRlZCwgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlbSB3aXRoIFR5cGVkQXJyYXlzXG4gICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogV09STERSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBvYmplY3RzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbGxpc2lvbnMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiB2ZWhpY2xlcyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbnN0cmFpbnRzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gIH0gZWxzZSB7XG4gICAgLy8gVHJhbnNmZXJhYmxlIG1lc3NhZ2VzIGFyZSBub3Qgc3VwcG9ydGVkLCBzZW5kIGRhdGEgYXMgbm9ybWFsIGFycmF5c1xuICAgIHdvcmxkcmVwb3J0ID0gW107XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gW107XG4gICAgdmVoaWNsZXJlcG9ydCA9IFtdO1xuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBbXTtcbiAgfVxuXG4gIHdvcmxkcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDtcbiAgY29sbGlzaW9ucmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ7XG4gIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG5cbiAgY29uc3QgY29sbGlzaW9uQ29uZmlndXJhdGlvbiA9IHBhcmFtcy5zb2Z0Ym9keVxuICAgID8gbmV3IEFtbW8uYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24oKVxuICAgIDogbmV3IEFtbW8uYnREZWZhdWx0Q29sbGlzaW9uQ29uZmlndXJhdGlvbigpLFxuICAgIGRpc3BhdGNoZXIgPSBuZXcgQW1tby5idENvbGxpc2lvbkRpc3BhdGNoZXIoY29sbGlzaW9uQ29uZmlndXJhdGlvbiksXG4gICAgc29sdmVyID0gbmV3IEFtbW8uYnRTZXF1ZW50aWFsSW1wdWxzZUNvbnN0cmFpbnRTb2x2ZXIoKTtcblxuICBsZXQgYnJvYWRwaGFzZTtcblxuICBpZiAoIXBhcmFtcy5icm9hZHBoYXNlKSBwYXJhbXMuYnJvYWRwaGFzZSA9IHt0eXBlOiAnZHluYW1pYyd9O1xuICAvLyBUT0RPISEhXG4gIC8qIGlmIChwYXJhbXMuYnJvYWRwaGFzZS50eXBlID09PSAnc3dlZXBwcnVuZScpIHtcbiAgICBleHRlbmQocGFyYW1zLmJyb2FkcGhhc2UsIHtcbiAgICAgIGFhYmJtaW46IHtcbiAgICAgICAgeDogLTUwLFxuICAgICAgICB5OiAtNTAsXG4gICAgICAgIHo6IC01MFxuICAgICAgfSxcblxuICAgICAgYWFiYm1heDoge1xuICAgICAgICB4OiA1MCxcbiAgICAgICAgeTogNTAsXG4gICAgICAgIHo6IDUwXG4gICAgICB9LFxuICAgIH0pO1xuICB9Ki9cblxuICBzd2l0Y2ggKHBhcmFtcy5icm9hZHBoYXNlLnR5cGUpIHtcbiAgICBjYXNlICdzd2VlcHBydW5lJzpcbiAgICAgIF92ZWMzXzEuc2V0WChwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWluLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtaW4ueSk7XG4gICAgICBfdmVjM18xLnNldFoocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi56KTtcblxuICAgICAgX3ZlYzNfMi5zZXRYKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtYXgueCk7XG4gICAgICBfdmVjM18yLnNldFkocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1heC55KTtcbiAgICAgIF92ZWMzXzIuc2V0WihwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LnopO1xuXG4gICAgICBicm9hZHBoYXNlID0gbmV3IEFtbW8uYnRBeGlzU3dlZXAzKFxuICAgICAgICBfdmVjM18xLFxuICAgICAgICBfdmVjM18yXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICBjYXNlICdkeW5hbWljJzpcbiAgICBkZWZhdWx0OlxuICAgICAgYnJvYWRwaGFzZSA9IG5ldyBBbW1vLmJ0RGJ2dEJyb2FkcGhhc2UoKTtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgd29ybGQgPSBwYXJhbXMuc29mdGJvZHlcbiAgICA/IG5ldyBBbW1vLmJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24sIG5ldyBBbW1vLmJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyKCkpXG4gICAgOiBuZXcgQW1tby5idERpc2NyZXRlRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pO1xuICBmaXhlZFRpbWVTdGVwID0gcGFyYW1zLmZpeGVkVGltZVN0ZXA7XG5cbiAgaWYgKHBhcmFtcy5zb2Z0Ym9keSkgX3NvZnRib2R5X2VuYWJsZWQgPSB0cnVlO1xuXG4gIHRyYW5zZmVyYWJsZU1lc3NhZ2Uoe2NtZDogJ3dvcmxkUmVhZHknfSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEZpeGVkVGltZVN0ZXAgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgZml4ZWRUaW1lU3RlcCA9IGRlc2NyaXB0aW9uO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRHcmF2aXR5ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi54KTtcbiAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnkpO1xuICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ueik7XG4gIHdvcmxkLnNldEdyYXZpdHkoX3ZlYzNfMSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGVuZEFuY2hvciA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBjb25zb2xlLmxvZyhfb2JqZWN0c1tkZXNjcmlwdGlvbi5vYmpdKTtcbiAgX29iamVjdHNbZGVzY3JpcHRpb24ub2JqXVxuICAgIC5hcHBlbmRBbmNob3IoXG4gICAgICBkZXNjcmlwdGlvbi5ub2RlLFxuICAgICAgX29iamVjdHNbZGVzY3JpcHRpb24ub2JqMl0sXG4gICAgICBkZXNjcmlwdGlvbi5jb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzLFxuICAgICAgZGVzY3JpcHRpb24uaW5mbHVlbmNlXG4gICAgKTtcbn1cblxucHVibGljX2Z1bmN0aW9ucy5hZGRPYmplY3QgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IGJvZHksIG1vdGlvblN0YXRlO1xuXG4gIGlmIChkZXNjcmlwdGlvbi50eXBlLmluZGV4T2YoJ3NvZnQnKSAhPT0gLTEpIHtcbiAgICBib2R5ID0gY3JlYXRlU29mdEJvZHkoZGVzY3JpcHRpb24pO1xuXG4gICAgY29uc3Qgc2JDb25maWcgPSBib2R5LmdldF9tX2NmZygpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLnZpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfdml0ZXJhdGlvbnMoZGVzY3JpcHRpb24udml0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5waXRlcmF0aW9ucykgc2JDb25maWcuc2V0X3BpdGVyYXRpb25zKGRlc2NyaXB0aW9uLnBpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uZGl0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9kaXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5kaXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmNpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfY2l0ZXJhdGlvbnMoZGVzY3JpcHRpb24uY2l0ZXJhdGlvbnMpO1xuICAgIHNiQ29uZmlnLnNldF9jb2xsaXNpb25zKDB4MTEpO1xuICAgIHNiQ29uZmlnLnNldF9rREYoZGVzY3JpcHRpb24uZnJpY3Rpb24pO1xuICAgIHNiQ29uZmlnLnNldF9rRFAoZGVzY3JpcHRpb24uZGFtcGluZyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnByZXNzdXJlKSBzYkNvbmZpZy5zZXRfa1BSKGRlc2NyaXB0aW9uLnByZXNzdXJlKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uZHJhZykgc2JDb25maWcuc2V0X2tERyhkZXNjcmlwdGlvbi5kcmFnKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ubGlmdCkgc2JDb25maWcuc2V0X2tMRihkZXNjcmlwdGlvbi5saWZ0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24uYW5jaG9ySGFyZG5lc3MpIHNiQ29uZmlnLnNldF9rQUhSKGRlc2NyaXB0aW9uLmFuY2hvckhhcmRuZXNzKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucmlnaWRIYXJkbmVzcykgc2JDb25maWcuc2V0X2tDSFIoZGVzY3JpcHRpb24ucmlnaWRIYXJkbmVzcyk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24ua2xzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rTFNUKGRlc2NyaXB0aW9uLmtsc3QpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5rYXN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tBU1QoZGVzY3JpcHRpb24ua2FzdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmt2c3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa1ZTVChkZXNjcmlwdGlvbi5rdnN0KTtcblxuICAgIEFtbW8uY2FzdE9iamVjdChib2R5LCBBbW1vLmJ0Q29sbGlzaW9uT2JqZWN0KS5nZXRDb2xsaXNpb25TaGFwZSgpLnNldE1hcmdpbihkZXNjcmlwdGlvbi5tYXJnaW4gPyBkZXNjcmlwdGlvbi5tYXJnaW4gOiAwLjEpO1xuXG4gICAgLy8gQW1tby5jYXN0T2JqZWN0KGJvZHksIEFtbW8uYnRDb2xsaXNpb25PYmplY3QpLmdldENvbGxpc2lvblNoYXBlKCkuc2V0TG9jYWxTY2FsaW5nKF92ZWMzXzEpO1xuICAgIGJvZHkuc2V0QWN0aXZhdGlvblN0YXRlKGRlc2NyaXB0aW9uLnN0YXRlIHx8IDQpO1xuICAgIGJvZHkudHlwZSA9IDA7IC8vIFNvZnRCb2R5LlxuICAgIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFJvcGVNZXNoJykgYm9keS5yb3BlID0gdHJ1ZTtcbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRDbG90aE1lc2gnKSBib2R5LmNsb3RoID0gdHJ1ZTtcblxuICAgIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5wb3NpdGlvbi54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ucG9zaXRpb24ueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnopO1xuICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgX3F1YXQuc2V0WChkZXNjcmlwdGlvbi5yb3RhdGlvbi54KTtcbiAgICBfcXVhdC5zZXRZKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnkpO1xuICAgIF9xdWF0LnNldFooZGVzY3JpcHRpb24ucm90YXRpb24ueik7XG4gICAgX3F1YXQuc2V0VyhkZXNjcmlwdGlvbi5yb3RhdGlvbi53KTtcbiAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgIGJvZHkudHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnNjYWxlLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5zY2FsZS55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uc2NhbGUueik7XG5cbiAgICBib2R5LnNjYWxlKF92ZWMzXzEpO1xuXG4gICAgYm9keS5zZXRUb3RhbE1hc3MoZGVzY3JpcHRpb24ubWFzcywgZmFsc2UpO1xuICAgIHdvcmxkLmFkZFNvZnRCb2R5KGJvZHksIDEsIC0xKTtcbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRUcmltZXNoJykgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fZmFjZXMoKS5zaXplKCkgKiAzO1xuICAgIGVsc2UgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Um9wZU1lc2gnKSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9ub2RlcygpLnNpemUoKTtcbiAgICBlbHNlIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX25vZGVzKCkuc2l6ZSgpICogMztcblxuICAgIF9udW1fc29mdGJvZHlfb2JqZWN0cysrO1xuICB9IGVsc2Uge1xuICAgIGxldCBzaGFwZSA9IGNyZWF0ZVNoYXBlKGRlc2NyaXB0aW9uKTtcblxuICAgIGlmICghc2hhcGUpIHJldHVybjtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBjaGlsZHJlbiB0aGVuIHRoaXMgaXMgYSBjb21wb3VuZCBzaGFwZVxuICAgIGlmIChkZXNjcmlwdGlvbi5jaGlsZHJlbikge1xuICAgICAgY29uc3QgY29tcG91bmRfc2hhcGUgPSBuZXcgQW1tby5idENvbXBvdW5kU2hhcGUoKTtcbiAgICAgIGNvbXBvdW5kX3NoYXBlLmFkZENoaWxkU2hhcGUoX3RyYW5zZm9ybSwgc2hhcGUpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IF9jaGlsZCA9IGRlc2NyaXB0aW9uLmNoaWxkcmVuW2ldO1xuXG4gICAgICAgIGNvbnN0IHRyYW5zID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnMuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgICBfdmVjM18xLnNldFgoX2NoaWxkLnBvc2l0aW9uX29mZnNldC54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihfY2hpbGQucG9zaXRpb25fb2Zmc2V0LnopO1xuICAgICAgICB0cmFucy5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgICAgX3F1YXQuc2V0WChfY2hpbGQucm90YXRpb24ueCk7XG4gICAgICAgIF9xdWF0LnNldFkoX2NoaWxkLnJvdGF0aW9uLnkpO1xuICAgICAgICBfcXVhdC5zZXRaKF9jaGlsZC5yb3RhdGlvbi56KTtcbiAgICAgICAgX3F1YXQuc2V0VyhfY2hpbGQucm90YXRpb24udyk7XG4gICAgICAgIHRyYW5zLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgICAgICBzaGFwZSA9IGNyZWF0ZVNoYXBlKGRlc2NyaXB0aW9uLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgY29tcG91bmRfc2hhcGUuYWRkQ2hpbGRTaGFwZSh0cmFucywgc2hhcGUpO1xuICAgICAgICBBbW1vLmRlc3Ryb3kodHJhbnMpO1xuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IGNvbXBvdW5kX3NoYXBlO1xuICAgICAgX2NvbXBvdW5kX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcbiAgICB9XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uc2NhbGUueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnNjYWxlLnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5zY2FsZS56KTtcblxuICAgIHNoYXBlLnNldExvY2FsU2NhbGluZyhfdmVjM18xKTtcbiAgICBzaGFwZS5zZXRNYXJnaW4oZGVzY3JpcHRpb24ubWFyZ2luID8gZGVzY3JpcHRpb24ubWFyZ2luIDogMCk7XG5cbiAgICBfdmVjM18xLnNldFgoMCk7XG4gICAgX3ZlYzNfMS5zZXRZKDApO1xuICAgIF92ZWMzXzEuc2V0WigwKTtcbiAgICBzaGFwZS5jYWxjdWxhdGVMb2NhbEluZXJ0aWEoZGVzY3JpcHRpb24ubWFzcywgX3ZlYzNfMSk7XG5cbiAgICBfdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG5cbiAgICBfdmVjM18yLnNldFgoZGVzY3JpcHRpb24ucG9zaXRpb24ueCk7XG4gICAgX3ZlYzNfMi5zZXRZKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnkpO1xuICAgIF92ZWMzXzIuc2V0WihkZXNjcmlwdGlvbi5wb3NpdGlvbi56KTtcbiAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgIF9xdWF0LnNldFgoZGVzY3JpcHRpb24ucm90YXRpb24ueCk7XG4gICAgX3F1YXQuc2V0WShkZXNjcmlwdGlvbi5yb3RhdGlvbi55KTtcbiAgICBfcXVhdC5zZXRaKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnopO1xuICAgIF9xdWF0LnNldFcoZGVzY3JpcHRpb24ucm90YXRpb24udyk7XG4gICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICBtb3Rpb25TdGF0ZSA9IG5ldyBBbW1vLmJ0RGVmYXVsdE1vdGlvblN0YXRlKF90cmFuc2Zvcm0pOyAvLyAjVE9ETzogYnREZWZhdWx0TW90aW9uU3RhdGUgc3VwcG9ydHMgY2VudGVyIG9mIG1hc3Mgb2Zmc2V0IGFzIHNlY29uZCBhcmd1bWVudCAtIGltcGxlbWVudFxuICAgIGNvbnN0IHJiSW5mbyA9IG5ldyBBbW1vLmJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyhkZXNjcmlwdGlvbi5tYXNzLCBtb3Rpb25TdGF0ZSwgc2hhcGUsIF92ZWMzXzEpO1xuXG4gICAgcmJJbmZvLnNldF9tX2ZyaWN0aW9uKGRlc2NyaXB0aW9uLmZyaWN0aW9uKTtcbiAgICByYkluZm8uc2V0X21fcmVzdGl0dXRpb24oZGVzY3JpcHRpb24ucmVzdGl0dXRpb24pO1xuICAgIHJiSW5mby5zZXRfbV9saW5lYXJEYW1waW5nKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuICAgIHJiSW5mby5zZXRfbV9hbmd1bGFyRGFtcGluZyhkZXNjcmlwdGlvbi5kYW1waW5nKTtcblxuICAgIGJvZHkgPSBuZXcgQW1tby5idFJpZ2lkQm9keShyYkluZm8pO1xuICAgIGJvZHkuc2V0QWN0aXZhdGlvblN0YXRlKGRlc2NyaXB0aW9uLnN0YXRlIHx8IDQpO1xuICAgIEFtbW8uZGVzdHJveShyYkluZm8pO1xuXG4gICAgaWYgKHR5cGVvZiBkZXNjcmlwdGlvbi5jb2xsaXNpb25fZmxhZ3MgIT09ICd1bmRlZmluZWQnKSBib2R5LnNldENvbGxpc2lvbkZsYWdzKGRlc2NyaXB0aW9uLmNvbGxpc2lvbl9mbGFncyk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24uZ3JvdXAgJiYgZGVzY3JpcHRpb24ubWFzaykgd29ybGQuYWRkUmlnaWRCb2R5KGJvZHksIGRlc2NyaXB0aW9uLmdyb3VwLCBkZXNjcmlwdGlvbi5tYXNrKTtcbiAgICBlbHNlIHdvcmxkLmFkZFJpZ2lkQm9keShib2R5KTtcbiAgICBib2R5LnR5cGUgPSAxOyAvLyBSaWdpZEJvZHkuXG4gICAgX251bV9yaWdpZGJvZHlfb2JqZWN0cysrO1xuICB9XG5cbiAgYm9keS5hY3RpdmF0ZSgpO1xuXG4gIGJvZHkuaWQgPSBkZXNjcmlwdGlvbi5pZDtcbiAgX29iamVjdHNbYm9keS5pZF0gPSBib2R5O1xuICBfbW90aW9uX3N0YXRlc1tib2R5LmlkXSA9IG1vdGlvblN0YXRlO1xuXG4gIF9vYmplY3RzX2FtbW9bYm9keS5hID09PSB1bmRlZmluZWQgPyBib2R5LnB0ciA6IGJvZHkuYV0gPSBib2R5LmlkO1xuICBfbnVtX29iamVjdHMrKztcblxuICB0cmFuc2ZlcmFibGVNZXNzYWdlKHtjbWQ6ICdvYmplY3RSZWFkeScsIHBhcmFtczogYm9keS5pZH0pO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRWZWhpY2xlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGNvbnN0IHZlaGljbGVfdHVuaW5nID0gbmV3IEFtbW8uYnRWZWhpY2xlVHVuaW5nKCk7XG5cbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyhkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX3N0aWZmbmVzcyk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbihkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX2NvbXByZXNzaW9uKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvbkRhbXBpbmcoZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9kYW1waW5nKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtKGRlc2NyaXB0aW9uLm1heF9zdXNwZW5zaW9uX3RyYXZlbCk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25Gb3JjZShkZXNjcmlwdGlvbi5tYXhfc3VzcGVuc2lvbl9mb3JjZSk7XG5cbiAgY29uc3QgdmVoaWNsZSA9IG5ldyBBbW1vLmJ0UmF5Y2FzdFZlaGljbGUoXG4gICAgdmVoaWNsZV90dW5pbmcsXG4gICAgX29iamVjdHNbZGVzY3JpcHRpb24ucmlnaWRCb2R5XSxcbiAgICBuZXcgQW1tby5idERlZmF1bHRWZWhpY2xlUmF5Y2FzdGVyKHdvcmxkKVxuICApO1xuXG4gIHZlaGljbGUudHVuaW5nID0gdmVoaWNsZV90dW5pbmc7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnJpZ2lkQm9keV0uc2V0QWN0aXZhdGlvblN0YXRlKDQpO1xuICB2ZWhpY2xlLnNldENvb3JkaW5hdGVTeXN0ZW0oMCwgMSwgMik7XG5cbiAgd29ybGQuYWRkVmVoaWNsZSh2ZWhpY2xlKTtcbiAgX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHZlaGljbGU7XG59O1xucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVWZWhpY2xlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gPSBudWxsO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRXaGVlbCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbGV0IHR1bmluZyA9IF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0udHVuaW5nO1xuICAgIGlmIChkZXNjcmlwdGlvbi50dW5pbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdHVuaW5nID0gbmV3IEFtbW8uYnRWZWhpY2xlVHVuaW5nKCk7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyhkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9zdGlmZm5lc3MpO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbihkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9jb21wcmVzc2lvbik7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvbkRhbXBpbmcoZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fZGFtcGluZyk7XG4gICAgICB0dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtKGRlc2NyaXB0aW9uLnR1bmluZy5tYXhfc3VzcGVuc2lvbl90cmF2ZWwpO1xuICAgICAgdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25Gb3JjZShkZXNjcmlwdGlvbi50dW5pbmcubWF4X3N1c3BlbnNpb25fZm9yY2UpO1xuICAgIH1cblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LnopO1xuXG4gICAgX3ZlYzNfMi5zZXRYKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi54KTtcbiAgICBfdmVjM18yLnNldFkoZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLnkpO1xuICAgIF92ZWMzXzIuc2V0WihkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueik7XG5cbiAgICBfdmVjM18zLnNldFgoZGVzY3JpcHRpb24ud2hlZWxfYXhsZS54KTtcbiAgICBfdmVjM18zLnNldFkoZGVzY3JpcHRpb24ud2hlZWxfYXhsZS55KTtcbiAgICBfdmVjM18zLnNldFooZGVzY3JpcHRpb24ud2hlZWxfYXhsZS56KTtcblxuICAgIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0uYWRkV2hlZWwoXG4gICAgICBfdmVjM18xLFxuICAgICAgX3ZlYzNfMixcbiAgICAgIF92ZWMzXzMsXG4gICAgICBkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLFxuICAgICAgZGVzY3JpcHRpb24ud2hlZWxfcmFkaXVzLFxuICAgICAgdHVuaW5nLFxuICAgICAgZGVzY3JpcHRpb24uaXNfZnJvbnRfd2hlZWxcbiAgICApO1xuICB9XG5cbiAgX251bV93aGVlbHMrKztcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgxICsgX251bV93aGVlbHMgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCAmICggIyBvZiBvYmplY3RzIHRvIHJlcG9ydCAqICMgb2YgdmFsdWVzIHBlciBvYmplY3QgKVxuICAgIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gIH0gZWxzZSB2ZWhpY2xlcmVwb3J0ID0gW01FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVF07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldFN0ZWVyaW5nID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uc2V0U3RlZXJpbmdWYWx1ZShkZXRhaWxzLnN0ZWVyaW5nLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QnJha2UgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5zZXRCcmFrZShkZXRhaWxzLmJyYWtlLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlFbmdpbmVGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLmFwcGx5RW5naW5lRm9yY2UoZGV0YWlscy5mb3JjZSwgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZU9iamVjdCA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfb2JqZWN0c1tkZXRhaWxzLmlkXS50eXBlID09PSAwKSB7XG4gICAgX251bV9zb2Z0Ym9keV9vYmplY3RzLS07XG4gICAgX3NvZnRib2R5X3JlcG9ydF9zaXplIC09IF9vYmplY3RzW2RldGFpbHMuaWRdLmdldF9tX25vZGVzKCkuc2l6ZSgpO1xuICAgIHdvcmxkLnJlbW92ZVNvZnRCb2R5KF9vYmplY3RzW2RldGFpbHMuaWRdKTtcbiAgfSBlbHNlIGlmIChfb2JqZWN0c1tkZXRhaWxzLmlkXS50eXBlID09PSAxKSB7XG4gICAgX251bV9yaWdpZGJvZHlfb2JqZWN0cy0tO1xuICAgIHdvcmxkLnJlbW92ZVJpZ2lkQm9keShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gICAgQW1tby5kZXN0cm95KF9tb3Rpb25fc3RhdGVzW2RldGFpbHMuaWRdKTtcbiAgfVxuXG4gIEFtbW8uZGVzdHJveShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gIGlmIChfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKSBBbW1vLmRlc3Ryb3koX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSk7XG4gIGlmIChfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSkgQW1tby5kZXN0cm95KF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKTtcblxuICBfb2JqZWN0c19hbW1vW19vYmplY3RzW2RldGFpbHMuaWRdLmEgPT09IHVuZGVmaW5lZCA/IF9vYmplY3RzW2RldGFpbHMuaWRdLmEgOiBfb2JqZWN0c1tkZXRhaWxzLmlkXS5wdHJdID0gbnVsbDtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBfbW90aW9uX3N0YXRlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG5cbiAgaWYgKF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pIF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBpZiAoX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pIF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgX251bV9vYmplY3RzLS07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnVwZGF0ZVRyYW5zZm9ybSA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3QgPSBfb2JqZWN0c1tkZXRhaWxzLmlkXTtcblxuICBpZiAoX29iamVjdC50eXBlID09PSAxKSB7XG4gICAgX29iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgaWYgKGRldGFpbHMucG9zKSB7XG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3MueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3MueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3Mueik7XG4gICAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICB9XG5cbiAgICBpZiAoZGV0YWlscy5xdWF0KSB7XG4gICAgICBfcXVhdC5zZXRYKGRldGFpbHMucXVhdC54KTtcbiAgICAgIF9xdWF0LnNldFkoZGV0YWlscy5xdWF0LnkpO1xuICAgICAgX3F1YXQuc2V0WihkZXRhaWxzLnF1YXQueik7XG4gICAgICBfcXVhdC5zZXRXKGRldGFpbHMucXVhdC53KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuICAgIH1cblxuICAgIF9vYmplY3Quc2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG4gICAgX29iamVjdC5hY3RpdmF0ZSgpO1xuICB9IGVsc2UgaWYgKF9vYmplY3QudHlwZSA9PT0gMCkge1xuICAgIC8vIF9vYmplY3QuZ2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICBpZiAoZGV0YWlscy5wb3MpIHtcbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvcy54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvcy55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvcy56KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzEpO1xuICAgIH1cblxuICAgIGlmIChkZXRhaWxzLnF1YXQpIHtcbiAgICAgIF9xdWF0LnNldFgoZGV0YWlscy5xdWF0LngpO1xuICAgICAgX3F1YXQuc2V0WShkZXRhaWxzLnF1YXQueSk7XG4gICAgICBfcXVhdC5zZXRaKGRldGFpbHMucXVhdC56KTtcbiAgICAgIF9xdWF0LnNldFcoZGV0YWlscy5xdWF0LncpO1xuICAgICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG4gICAgfVxuXG4gICAgX29iamVjdC50cmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG4gIH1cbn07XG5cbnB1YmxpY19mdW5jdGlvbnMudXBkYXRlTWFzcyA9IChkZXRhaWxzKSA9PiB7XG4gIC8vICNUT0RPOiBjaGFuZ2luZyBhIHN0YXRpYyBvYmplY3QgaW50byBkeW5hbWljIGlzIGJ1Z2d5XG4gIF9vYmplY3QgPSBfb2JqZWN0c1tkZXRhaWxzLmlkXTtcblxuICAvLyBQZXIgaHR0cDovL3d3dy5idWxsZXRwaHlzaWNzLm9yZy9CdWxsZXQvcGhwQkIzL3ZpZXd0b3BpYy5waHA/cD0mZj05JnQ9MzY2MyNwMTM4MTZcbiAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KF9vYmplY3QpO1xuXG4gIF92ZWMzXzEuc2V0WCgwKTtcbiAgX3ZlYzNfMS5zZXRZKDApO1xuICBfdmVjM18xLnNldFooMCk7XG5cbiAgX29iamVjdC5zZXRNYXNzUHJvcHMoZGV0YWlscy5tYXNzLCBfdmVjM18xKTtcbiAgd29ybGQuYWRkUmlnaWRCb2R5KF9vYmplY3QpO1xuICBfb2JqZWN0LmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Q2VudHJhbEltcHVsc2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5Q2VudHJhbEltcHVsc2UoX3ZlYzNfMSk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5SW1wdWxzZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLmltcHVsc2VfeCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLmltcHVsc2VfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLmltcHVsc2Vfeik7XG5cbiAgX3ZlYzNfMi5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzIuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18yLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUltcHVsc2UoXG4gICAgX3ZlYzNfMSxcbiAgICBfdmVjM18yXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5VG9ycXVlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMudG9ycXVlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy50b3JxdWVfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnRvcnF1ZV96KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseVRvcnF1ZShcbiAgICBfdmVjM18xXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Q2VudHJhbEZvcmNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUNlbnRyYWxGb3JjZShfdmVjM18xKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLmZvcmNlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy5mb3JjZV95KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMuZm9yY2Vfeik7XG5cbiAgX3ZlYzNfMi5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzIuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18yLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUZvcmNlKFxuICAgIF92ZWMzXzEsXG4gICAgX3ZlYzNfMlxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5vblNpbXVsYXRpb25SZXN1bWUgPSAoKSA9PiB7XG4gIGxhc3Rfc2ltdWxhdGlvbl90aW1lID0gRGF0ZS5ub3coKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QW5ndWxhclZlbG9jaXR5ID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRBbmd1bGFyVmVsb2NpdHkoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRMaW5lYXJWZWxvY2l0eSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0TGluZWFyVmVsb2NpdHkoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRBbmd1bGFyRmFjdG9yID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRBbmd1bGFyRmFjdG9yKFxuICAgICAgX3ZlYzNfMVxuICApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRMaW5lYXJGYWN0b3IgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldExpbmVhckZhY3RvcihcbiAgICBfdmVjM18xXG4gICk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldERhbXBpbmcgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXREYW1waW5nKGRldGFpbHMubGluZWFyLCBkZXRhaWxzLmFuZ3VsYXIpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRDY2RNb3Rpb25UaHJlc2hvbGQgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRDY2RNb3Rpb25UaHJlc2hvbGQoZGV0YWlscy50aHJlc2hvbGQpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKGRldGFpbHMucmFkaXVzKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkQ29uc3RyYWludCA9IChkZXRhaWxzKSA9PiB7XG4gIGxldCBjb25zdHJhaW50O1xuXG4gIHN3aXRjaCAoZGV0YWlscy50eXBlKSB7XG5cbiAgICBjYXNlICdwb2ludCc6IHtcbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFBvaW50MlBvaW50Q29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF92ZWMzXzFcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRQb2ludDJQb2ludENvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2hpbmdlJzoge1xuICAgICAgaWYgKGRldGFpbHMub2JqZWN0YiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMuYXhpcy54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMuYXhpcy55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMuYXhpcy56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRIaW5nZUNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzJcbiAgICAgICAgKTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIF92ZWMzXzMuc2V0WChkZXRhaWxzLmF4aXMueCk7XG4gICAgICAgIF92ZWMzXzMuc2V0WShkZXRhaWxzLmF4aXMueSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WihkZXRhaWxzLmF4aXMueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0SGluZ2VDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzIsXG4gICAgICAgICAgX3ZlYzNfMyxcbiAgICAgICAgICBfdmVjM18zXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnc2xpZGVyJzoge1xuICAgICAgbGV0IHRyYW5zZm9ybWI7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXIoZGV0YWlscy5heGlzLngsIGRldGFpbHMuYXhpcy55LCBkZXRhaWxzLmF4aXMueik7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgaWYgKGRldGFpbHMub2JqZWN0Yikge1xuICAgICAgICB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgICByb3RhdGlvbi5zZXRFdWxlcihkZXRhaWxzLmF4aXMueCwgZGV0YWlscy5heGlzLnksIGRldGFpbHMuYXhpcy56KTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0U2xpZGVyQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cmFuc2Zvcm1iLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFNsaWRlckNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3RyYWludC50YSA9IHRyYW5zZm9ybWE7XG4gICAgICBjb25zdHJhaW50LnRiID0gdHJhbnNmb3JtYjtcblxuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWEpO1xuICAgICAgaWYgKHRyYW5zZm9ybWIgIT09IHVuZGVmaW5lZCkgQW1tby5kZXN0cm95KHRyYW5zZm9ybWIpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnY29uZXR3aXN0Jzoge1xuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldElkZW50aXR5KCk7XG5cbiAgICAgIGNvbnN0IHRyYW5zZm9ybWIgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2EueiwgLWRldGFpbHMuYXhpc2EueSwgLWRldGFpbHMuYXhpc2EueCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1iLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYi56LCAtZGV0YWlscy5heGlzYi55LCAtZGV0YWlscy5heGlzYi54KTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRDb25lVHdpc3RDb25zdHJhaW50KFxuICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICB0cmFuc2Zvcm1iXG4gICAgICApO1xuXG4gICAgICBjb25zdHJhaW50LnNldExpbWl0KE1hdGguUEksIDAsIE1hdGguUEkpO1xuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlICdkb2YnOiB7XG4gICAgICBsZXQgdHJhbnNmb3JtYjtcblxuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldElkZW50aXR5KCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNhLnosIC1kZXRhaWxzLmF4aXNhLnksIC1kZXRhaWxzLmF4aXNhLngpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIpIHtcbiAgICAgICAgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYi56LCAtZGV0YWlscy5heGlzYi55LCAtZGV0YWlscy5heGlzYi54KTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRyYW5zZm9ybWIsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIGlmICh0cmFuc2Zvcm1iICE9PSB1bmRlZmluZWQpIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm47XG4gIH1cblxuICB3b3JsZC5hZGRDb25zdHJhaW50KGNvbnN0cmFpbnQpO1xuXG4gIGNvbnN0cmFpbnQuYSA9IF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV07XG4gIGNvbnN0cmFpbnQuYiA9IF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl07XG5cbiAgY29uc3RyYWludC5lbmFibGVGZWVkYmFjaygpO1xuICBfY29uc3RyYWludHNbZGV0YWlscy5pZF0gPSBjb25zdHJhaW50O1xuICBfbnVtX2NvbnN0cmFpbnRzKys7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMSArIF9udW1fY29uc3RyYWludHMgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCAmICggIyBvZiBvYmplY3RzIHRvIHJlcG9ydCAqICMgb2YgdmFsdWVzIHBlciBvYmplY3QgKVxuICAgIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG4gIH0gZWxzZSBjb25zdHJhaW50cmVwb3J0ID0gW01FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVF07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZUNvbnN0cmFpbnQgPSAoZGV0YWlscykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdO1xuXG4gIGlmIChjb25zdHJhaW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICB3b3JsZC5yZW1vdmVDb25zdHJhaW50KGNvbnN0cmFpbnQpO1xuICAgIF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gICAgX251bV9jb25zdHJhaW50cy0tO1xuICB9XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbnN0cmFpbnRfc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkID0gKGRldGFpbHMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXTtcbiAgaWYgKGNvbnN0cmFpbnQgIT09IHVuZGVmaW5kKSBjb25zdHJhaW50LnNldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZChkZXRhaWxzLnRocmVzaG9sZCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNpbXVsYXRlID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIGlmICh3b3JsZCkge1xuICAgIGlmIChwYXJhbXMudGltZVN0ZXAgJiYgcGFyYW1zLnRpbWVTdGVwIDwgZml4ZWRUaW1lU3RlcClcbiAgICAgIHBhcmFtcy50aW1lU3RlcCA9IGZpeGVkVGltZVN0ZXA7XG5cbiAgICBwYXJhbXMubWF4U3ViU3RlcHMgPSBwYXJhbXMubWF4U3ViU3RlcHMgfHwgTWF0aC5jZWlsKHBhcmFtcy50aW1lU3RlcCAvIGZpeGVkVGltZVN0ZXApOyAvLyBJZiBtYXhTdWJTdGVwcyBpcyBub3QgZGVmaW5lZCwga2VlcCB0aGUgc2ltdWxhdGlvbiBmdWxseSB1cCB0byBkYXRlXG5cbiAgICB3b3JsZC5zdGVwU2ltdWxhdGlvbihwYXJhbXMudGltZVN0ZXAsIHBhcmFtcy5tYXhTdWJTdGVwcywgZml4ZWRUaW1lU3RlcCk7XG5cbiAgICBpZiAoX3ZlaGljbGVzLmxlbmd0aCA+IDApIHJlcG9ydFZlaGljbGVzKCk7XG4gICAgcmVwb3J0Q29sbGlzaW9ucygpO1xuICAgIGlmIChfY29uc3RyYWludHMubGVuZ3RoID4gMCkgcmVwb3J0Q29uc3RyYWludHMoKTtcbiAgICByZXBvcnRXb3JsZCgpO1xuICAgIGlmIChfc29mdGJvZHlfZW5hYmxlZCkgcmVwb3J0V29ybGRfc29mdGJvZGllcygpO1xuICB9XG59O1xuXG4vLyBDb25zdHJhaW50IGZ1bmN0aW9uc1xucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9zZXRMaW1pdHMgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLmxvdywgcGFyYW1zLmhpZ2gsIDAsIHBhcmFtcy5iaWFzX2ZhY3RvciwgcGFyYW1zLnJlbGF4YXRpb25fZmFjdG9yKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVBbmd1bGFyTW90b3IodHJ1ZSwgcGFyYW1zLnZlbG9jaXR5LCBwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9kaXNhYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uZW5hYmxlTW90b3IoZmFsc2UpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX3NldExpbWl0cyA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0TG93ZXJMaW5MaW1pdChwYXJhbXMubGluX2xvd2VyIHx8IDApO1xuICBjb25zdHJhaW50LnNldFVwcGVyTGluTGltaXQocGFyYW1zLmxpbl91cHBlciB8fCAwKTtcblxuICBjb25zdHJhaW50LnNldExvd2VyQW5nTGltaXQocGFyYW1zLmFuZ19sb3dlciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRVcHBlckFuZ0xpbWl0KHBhcmFtcy5hbmdfdXBwZXIgfHwgMCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9zZXRSZXN0aXR1dGlvbiA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0U29mdG5lc3NMaW1MaW4ocGFyYW1zLmxpbmVhciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRTb2Z0bmVzc0xpbUFuZyhwYXJhbXMuYW5ndWxhciB8fCAwKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRUYXJnZXRMaW5Nb3RvclZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIGNvbnN0cmFpbnQuc2V0TWF4TGluTW90b3JGb3JjZShwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkTGluTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZExpbk1vdG9yKGZhbHNlKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFRhcmdldEFuZ01vdG9yVmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgY29uc3RyYWludC5zZXRNYXhBbmdNb3RvckZvcmNlKHBhcmFtcy5hY2NlbGVyYXRpb24pO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRBbmdNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZEFuZ01vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLnosIHBhcmFtcy55LCBwYXJhbXMueCk7IC8vIFpZWCBvcmRlclxufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZW5hYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LmVuYWJsZU1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldE1heE1vdG9ySW1wdWxzZShwYXJhbXMubWF4X2ltcHVsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNb3RvclRhcmdldCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3F1YXQuc2V0WChwYXJhbXMueCk7XG4gIF9xdWF0LnNldFkocGFyYW1zLnkpO1xuICBfcXVhdC5zZXRaKHBhcmFtcy56KTtcbiAgX3F1YXQuc2V0VyhwYXJhbXMudyk7XG5cbiAgY29uc3RyYWludC5zZXRNb3RvclRhcmdldChfcXVhdCk7XG5cbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZGlzYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhckxvd2VyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJMb3dlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJVcHBlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0QW5ndWxhckxvd2VyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRBbmd1bGFyVXBwZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIGNvbnN0IG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuICBtb3Rvci5zZXRfbV9lbmFibGVNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9jb25maWd1cmVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2xvTGltaXQocGFyYW1zLmxvd19hbmdsZSk7XG4gIG1vdG9yLnNldF9tX2hpTGltaXQocGFyYW1zLmhpZ2hfYW5nbGUpO1xuICBtb3Rvci5zZXRfbV90YXJnZXRWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBtb3Rvci5zZXRfbV9tYXhNb3RvckZvcmNlKHBhcmFtcy5tYXhfZm9yY2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX2Rpc2FibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2VuYWJsZU1vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5jb25zdCByZXBvcnRXb3JsZCA9ICgpID0+IHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIHdvcmxkcmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX3JpZ2lkYm9keV9vYmplY3RzICogV09STERSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAyLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICsgKE1hdGguY2VpbChfbnVtX3JpZ2lkYm9keV9vYmplY3RzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICk7XG5cbiAgICB3b3JsZHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ7XG4gIH1cblxuICB3b3JsZHJlcG9ydFsxXSA9IF9udW1fcmlnaWRib2R5X29iamVjdHM7IC8vIHJlY29yZCBob3cgbWFueSBvYmplY3RzIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIHtcbiAgICBsZXQgaSA9IDAsXG4gICAgICBpbmRleCA9IF9vYmplY3RzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvYmplY3QgPSBfb2JqZWN0c1tpbmRleF07XG5cbiAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LnR5cGUgPT09IDEpIHsgLy8gUmlnaWRCb2RpZXMuXG4gICAgICAgIC8vICNUT0RPOiB3ZSBjYW4ndCB1c2UgY2VudGVyIG9mIG1hc3MgdHJhbnNmb3JtIHdoZW4gY2VudGVyIG9mIG1hc3MgY2FuIGNoYW5nZSxcbiAgICAgICAgLy8gICAgICAgIGJ1dCBnZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKCkgc2NyZXdzIHVwIG9uIG9iamVjdHMgdGhhdCBoYXZlIGJlZW4gbW92ZWRcbiAgICAgICAgLy8gb2JqZWN0LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oIHRyYW5zZm9ybSApO1xuICAgICAgICAvLyBvYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBvYmplY3QuZ2V0Q2VudGVyT2ZNYXNzVHJhbnNmb3JtKCk7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSB0cmFuc2Zvcm0uZ2V0Um90YXRpb24oKTtcblxuICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICBjb25zdCBvZmZzZXQgPSAyICsgKGkrKykgKiBXT1JMRFJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXRdID0gb2JqZWN0LmlkO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDFdID0gb3JpZ2luLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi56KCk7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNF0gPSByb3RhdGlvbi54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDVdID0gcm90YXRpb24ueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA2XSA9IHJvdGF0aW9uLnooKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgN10gPSByb3RhdGlvbi53KCk7XG5cbiAgICAgICAgX3ZlY3RvciA9IG9iamVjdC5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA4XSA9IF92ZWN0b3IueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA5XSA9IF92ZWN0b3IueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMF0gPSBfdmVjdG9yLnooKTtcblxuICAgICAgICBfdmVjdG9yID0gb2JqZWN0LmdldEFuZ3VsYXJWZWxvY2l0eSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMV0gPSBfdmVjdG9yLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTJdID0gX3ZlY3Rvci55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEzXSA9IF92ZWN0b3IueigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgdHJhbnNmZXJhYmxlTWVzc2FnZSh3b3JsZHJlcG9ydC5idWZmZXIsIFt3b3JsZHJlcG9ydC5idWZmZXJdKTtcbiAgZWxzZSB0cmFuc2ZlcmFibGVNZXNzYWdlKHdvcmxkcmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydFdvcmxkX3NvZnRib2RpZXMgPSAoKSA9PiB7XG4gIC8vIFRPRE86IEFkZCBTVVBQT1JUVFJBTlNGRVJBQkxFLlxuXG4gIHNvZnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICArIF9udW1fc29mdGJvZHlfb2JqZWN0cyAqIDJcbiAgICArIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSAqIDZcbiAgKTtcblxuICBzb2Z0cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUO1xuICBzb2Z0cmVwb3J0WzFdID0gX251bV9zb2Z0Ym9keV9vYmplY3RzOyAvLyByZWNvcmQgaG93IG1hbnkgb2JqZWN0cyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICB7XG4gICAgbGV0IG9mZnNldCA9IDIsXG4gICAgICBpbmRleCA9IF9vYmplY3RzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvYmplY3QgPSBfb2JqZWN0c1tpbmRleF07XG5cbiAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LnR5cGUgPT09IDApIHsgLy8gU29mdEJvZGllcy5cblxuICAgICAgICBzb2Z0cmVwb3J0W29mZnNldF0gPSBvYmplY3QuaWQ7XG5cbiAgICAgICAgY29uc3Qgb2Zmc2V0VmVydCA9IG9mZnNldCArIDI7XG5cbiAgICAgICAgaWYgKG9iamVjdC5yb3BlID09PSB0cnVlKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZXMgPSBvYmplY3QuZ2V0X21fbm9kZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gbm9kZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5hdChpKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQgPSBub2RlLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IG9mZiA9IG9mZnNldFZlcnQgKyBpICogMztcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydC54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydC55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDJdID0gdmVydC56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiAzICsgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmplY3QuY2xvdGgpIHtcbiAgICAgICAgICBjb25zdCBub2RlcyA9IG9iamVjdC5nZXRfbV9ub2RlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBub2Rlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzLmF0KGkpO1xuICAgICAgICAgICAgY29uc3QgdmVydCA9IG5vZGUuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gbm9kZS5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDY7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDNdID0gbm9ybWFsLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNF0gPSBub3JtYWwueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA1XSA9IG5vcm1hbC56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiA2ICsgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb25zdCBmYWNlcyA9IG9iamVjdC5nZXRfbV9mYWNlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBmYWNlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZmFjZSA9IGZhY2VzLmF0KGkpO1xuXG4gICAgICAgICAgICBjb25zdCBub2RlMSA9IGZhY2UuZ2V0X21fbigwKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUyID0gZmFjZS5nZXRfbV9uKDEpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZTMgPSBmYWNlLmdldF9tX24oMik7XG5cbiAgICAgICAgICAgIGNvbnN0IHZlcnQxID0gbm9kZTEuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3QgdmVydDIgPSBub2RlMi5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0MyA9IG5vZGUzLmdldF9tX3goKTtcblxuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMSA9IG5vZGUxLmdldF9tX24oKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDIgPSBub2RlMi5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwzID0gbm9kZTMuZ2V0X21fbigpO1xuXG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDE4O1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0MS54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydDEueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQxLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAzXSA9IG5vcm1hbDEueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA0XSA9IG5vcm1hbDEueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA1XSA9IG5vcm1hbDEueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDZdID0gdmVydDIueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA3XSA9IHZlcnQyLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgOF0gPSB2ZXJ0Mi56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgOV0gPSBub3JtYWwyLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTBdID0gbm9ybWFsMi55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDExXSA9IG5vcm1hbDIueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEyXSA9IHZlcnQzLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTNdID0gdmVydDMueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNF0gPSB2ZXJ0My56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTVdID0gbm9ybWFsMy54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE2XSA9IG5vcm1hbDMueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxN10gPSBub3JtYWwzLnooKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvZmZzZXQgKz0gc2l6ZSAqIDE4ICsgMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgdHJhbnNmZXJhYmxlTWVzc2FnZShzb2Z0cmVwb3J0LmJ1ZmZlciwgW3NvZnRyZXBvcnQuYnVmZmVyXSk7XG4gIC8vIGVsc2UgdHJhbnNmZXJhYmxlTWVzc2FnZShzb2Z0cmVwb3J0KTtcbiAgdHJhbnNmZXJhYmxlTWVzc2FnZShzb2Z0cmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydENvbGxpc2lvbnMgPSAoKSA9PiB7XG4gIGNvbnN0IGRwID0gd29ybGQuZ2V0RGlzcGF0Y2hlcigpLFxuICAgIG51bSA9IGRwLmdldE51bU1hbmlmb2xkcygpO1xuICAgIC8vIF9jb2xsaWRlZCA9IGZhbHNlO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmIChjb2xsaXNpb25yZXBvcnQubGVuZ3RoIDwgMiArIG51bSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArIChNYXRoLmNlaWwoX251bV9vYmplY3RzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDtcbiAgICB9XG4gIH1cblxuICBjb2xsaXNpb25yZXBvcnRbMV0gPSAwOyAvLyBob3cgbWFueSBjb2xsaXNpb25zIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICBjb25zdCBtYW5pZm9sZCA9IGRwLmdldE1hbmlmb2xkQnlJbmRleEludGVybmFsKGkpLFxuICAgICAgbnVtX2NvbnRhY3RzID0gbWFuaWZvbGQuZ2V0TnVtQ29udGFjdHMoKTtcblxuICAgIGlmIChudW1fY29udGFjdHMgPT09IDApIGNvbnRpbnVlO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBudW1fY29udGFjdHM7IGorKykge1xuICAgICAgY29uc3QgcHQgPSBtYW5pZm9sZC5nZXRDb250YWN0UG9pbnQoaik7XG5cbiAgICAgIC8vIGlmICggcHQuZ2V0RGlzdGFuY2UoKSA8IDAgKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgKGNvbGxpc2lvbnJlcG9ydFsxXSsrKSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXRdID0gX29iamVjdHNfYW1tb1ttYW5pZm9sZC5nZXRCb2R5MCgpLnB0cl07XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgMV0gPSBfb2JqZWN0c19hbW1vW21hbmlmb2xkLmdldEJvZHkxKCkucHRyXTtcblxuICAgICAgX3ZlY3RvciA9IHB0LmdldF9tX25vcm1hbFdvcmxkT25CKCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgMl0gPSBfdmVjdG9yLngoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAzXSA9IF92ZWN0b3IueSgpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDRdID0gX3ZlY3Rvci56KCk7XG4gICAgICBicmVhaztcbiAgICAgIC8vIH1cbiAgICAgIC8vIHRyYW5zZmVyYWJsZU1lc3NhZ2UoX29iamVjdHNfYW1tbyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB0cmFuc2ZlcmFibGVNZXNzYWdlKGNvbGxpc2lvbnJlcG9ydC5idWZmZXIsIFtjb2xsaXNpb25yZXBvcnQuYnVmZmVyXSk7XG4gIGVsc2UgdHJhbnNmZXJhYmxlTWVzc2FnZShjb2xsaXNpb25yZXBvcnQpO1xufTtcblxuY29uc3QgcmVwb3J0VmVoaWNsZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmICh2ZWhpY2xlcmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX3doZWVscyAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICsgKE1hdGguY2VpbChfbnVtX3doZWVscyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAge1xuICAgIGxldCBpID0gMCxcbiAgICAgIGogPSAwLFxuICAgICAgaW5kZXggPSBfdmVoaWNsZXMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGlmIChfdmVoaWNsZXNbaW5kZXhdKSB7XG4gICAgICAgIGNvbnN0IHZlaGljbGUgPSBfdmVoaWNsZXNbaW5kZXhdO1xuXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCB2ZWhpY2xlLmdldE51bVdoZWVscygpOyBqKyspIHtcbiAgICAgICAgICAvLyB2ZWhpY2xlLnVwZGF0ZVdoZWVsVHJhbnNmb3JtKCBqLCB0cnVlICk7XG4gICAgICAgICAgLy8gdHJhbnNmb3JtID0gdmVoaWNsZS5nZXRXaGVlbFRyYW5zZm9ybVdTKCBqICk7XG4gICAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdmVoaWNsZS5nZXRXaGVlbEluZm8oaikuZ2V0X21fd29ybGRUcmFuc2Zvcm0oKTtcblxuICAgICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcbiAgICAgICAgICBjb25zdCByb3RhdGlvbiA9IHRyYW5zZm9ybS5nZXRSb3RhdGlvbigpO1xuXG4gICAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSAxICsgKGkrKykgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXRdID0gaW5kZXg7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAxXSA9IGo7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLngoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnkoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDRdID0gb3JpZ2luLnooKTtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNV0gPSByb3RhdGlvbi54KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA2XSA9IHJvdGF0aW9uLnkoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDddID0gcm90YXRpb24ueigpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgOF0gPSByb3RhdGlvbi53KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUgJiYgaiAhPT0gMCkgdHJhbnNmZXJhYmxlTWVzc2FnZSh2ZWhpY2xlcmVwb3J0LmJ1ZmZlciwgW3ZlaGljbGVyZXBvcnQuYnVmZmVyXSk7XG4gICAgZWxzZSBpZiAoaiAhPT0gMCkgdHJhbnNmZXJhYmxlTWVzc2FnZSh2ZWhpY2xlcmVwb3J0KTtcbiAgfVxufTtcblxuY29uc3QgcmVwb3J0Q29uc3RyYWludHMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmIChjb25zdHJhaW50cmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX2NvbnN0cmFpbnRzICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgKyAoTWF0aC5jZWlsKF9udW1fY29uc3RyYWludHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIHtcbiAgICBsZXQgb2Zmc2V0ID0gMCxcbiAgICAgIGkgPSAwLFxuICAgICAgaW5kZXggPSBfY29uc3RyYWludHMubGVuZ2h0O1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGlmIChfY29uc3RyYWludHNbaW5kZXhdKSB7XG4gICAgICAgIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbaW5kZXhdO1xuICAgICAgICBjb25zdCBvZmZzZXRfYm9keSA9IGNvbnN0cmFpbnQuYTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gY29uc3RyYWludC50YTtcbiAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuXG4gICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgIG9mZnNldCA9IDEgKyAoaSsrKSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXRdID0gaW5kZXg7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBvZmZzZXRfYm9keS5pZDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi54O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnk7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgNF0gPSBvcmlnaW4uejtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyA1XSA9IGNvbnN0cmFpbnQuZ2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIGkgIT09IDApIHRyYW5zZmVyYWJsZU1lc3NhZ2UoY29uc3RyYWludHJlcG9ydC5idWZmZXIsIFtjb25zdHJhaW50cmVwb3J0LmJ1ZmZlcl0pO1xuICAgIGVsc2UgaWYgKGkgIT09IDApIHRyYW5zZmVyYWJsZU1lc3NhZ2UoY29uc3RyYWludHJlcG9ydCk7XG4gIH1cbn07XG5cbnNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIGlmIChldmVudC5kYXRhIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgLy8gdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgIHN3aXRjaCAoZXZlbnQuZGF0YVswXSkge1xuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOiB7XG4gICAgICAgIHdvcmxkcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOiB7XG4gICAgICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6IHtcbiAgICAgICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6IHtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICB9XG5cbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAoZXZlbnQuZGF0YS5jbWQgJiYgcHVibGljX2Z1bmN0aW9uc1tldmVudC5kYXRhLmNtZF0pIHB1YmxpY19mdW5jdGlvbnNbZXZlbnQuZGF0YS5jbWRdKGV2ZW50LmRhdGEucGFyYW1zKTtcbn07XG5cblxufSk7IiwiaW1wb3J0IHtcbiAgU2NlbmUgYXMgU2NlbmVOYXRpdmUsXG4gIE1lc2gsXG4gIFNwaGVyZUdlb21ldHJ5LFxuICBNZXNoTm9ybWFsTWF0ZXJpYWwsXG4gIEJveEdlb21ldHJ5LFxuICBWZWN0b3IzXG59IGZyb20gJ3RocmVlJztcblxuaW1wb3J0IHtMb29wfSBmcm9tICd3aHMnO1xuXG5pbXBvcnQge1ZlaGljbGV9IGZyb20gJy4uL3ZlaGljbGUvdmVoaWNsZSc7XG5pbXBvcnQge0V2ZW50YWJsZX0gZnJvbSAnLi4vZXZlbnRhYmxlJztcblxuaW1wb3J0IHtcbiAgYWRkT2JqZWN0Q2hpbGRyZW4sXG4gIE1FU1NBR0VfVFlQRVMsXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRVxufSBmcm9tICcuLi9hcGknO1xuXG5pbXBvcnQgUGh5c2ljc1dvcmtlciBmcm9tICd3b3JrZXIhLi4vd29ya2VyLmpzJztcblxuZXhwb3J0IGNsYXNzIFdvcmxkTW9kdWxlIGV4dGVuZHMgRXZlbnRhYmxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBmaXhlZFRpbWVTdGVwOiAxLzYwLFxuICAgICAgcmF0ZUxpbWl0OiB0cnVlLFxuICAgICAgYW1tbzogXCJcIixcbiAgICAgIHNvZnRib2R5OiBmYWxzZSxcbiAgICAgIGdyYXZpdHk6IG5ldyBWZWN0b3IzKDAsIC0xMDAsIDApXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICB0aGlzLndvcmtlciA9IG5ldyBQaHlzaWNzV29ya2VyKCk7XG4gICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZSA9IHRoaXMud29ya2VyLndlYmtpdFBvc3RNZXNzYWdlIHx8IHRoaXMud29ya2VyLnBvc3RNZXNzYWdlO1xuXG4gICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5sb2FkZXIgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAocGFyYW1zLndhc20pIHtcbiAgICAgICAgZmV0Y2gocGFyYW1zLndhc20pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSlcbiAgICAgICAgICAudGhlbihidWZmZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYXJhbXMud2FzbUJ1ZmZlciA9IGJ1ZmZlcjtcblxuICAgICAgICAgICAgdGhpcy5leGVjdXRlKCdpbml0JywgdGhpcy5wYXJhbXMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJQaHlzaWNzIGxvYWRpbmcgdGltZTogXCIgKyAocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgKyBcIm1zXCIpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdpbml0JywgdGhpcy5wYXJhbXMpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmxvYWRlci50aGVuKCgpID0+IHt0aGlzLmlzTG9hZGVkID0gdHJ1ZX0pO1xuXG4gICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHMgPSB7fTtcbiAgICB0aGlzLl9vYmplY3RzID0ge307XG4gICAgdGhpcy5fdmVoaWNsZXMgPSB7fTtcbiAgICB0aGlzLl9jb25zdHJhaW50cyA9IHt9O1xuICAgIHRoaXMuX2lzX3NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmdldE9iamVjdElkID0gKCgpID0+IHtcbiAgICAgIGxldCBfaWQgPSAxO1xuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgcmV0dXJuIF9pZCsrO1xuICAgICAgfTtcbiAgICB9KSgpO1xuXG4gICAgLy8gVGVzdCBTVVBQT1JUX1RSQU5TRkVSQUJMRVxuXG4gICAgY29uc3QgYWIgPSBuZXcgQXJyYXlCdWZmZXIoMSk7XG4gICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShhYiwgW2FiXSk7XG4gICAgdGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSA9IChhYi5ieXRlTGVuZ3RoID09PSAwKTtcblxuICAgIHRoaXMud29ya2VyLm9ubWVzc2FnZSA9IChldmVudCkgPT4ge1xuICAgICAgbGV0IF90ZW1wLFxuICAgICAgICBkYXRhID0gZXZlbnQuZGF0YTtcblxuICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciAmJiBkYXRhLmJ5dGVMZW5ndGggIT09IDEpLy8gYnl0ZUxlbmd0aCA9PT0gMSBpcyB0aGUgd29ya2VyIG1ha2luZyBhIFNVUFBPUlRfVFJBTlNGRVJBQkxFIHRlc3RcbiAgICAgICAgZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSk7XG5cbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICAgIC8vIHRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICAgICAgc3dpdGNoIChkYXRhWzBdKSB7XG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTY2VuZShkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlNPRlRSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNvZnRib2RpZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbGxpc2lvbnMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVWZWhpY2xlcyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnN0cmFpbnRzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChkYXRhLmNtZCkge1xuICAgICAgICAvLyBub24tdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgICAgICBzd2l0Y2ggKGRhdGEuY21kKSB7XG4gICAgICAgICAgY2FzZSAnb2JqZWN0UmVhZHknOlxuICAgICAgICAgICAgX3RlbXAgPSBkYXRhLnBhcmFtcztcbiAgICAgICAgICAgIGlmICh0aGlzLl9vYmplY3RzW190ZW1wXSkgdGhpcy5fb2JqZWN0c1tfdGVtcF0uZGlzcGF0Y2hFdmVudCgncmVhZHknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAnd29ybGRSZWFkeSc6XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3JlYWR5Jyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ2FtbW9Mb2FkZWQnOlxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdsb2FkZWQnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUGh5c2ljcyBsb2FkaW5nIHRpbWU6IFwiICsgKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpICsgXCJtc1wiKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAndmVoaWNsZSc6XG4gICAgICAgICAgICB3aW5kb3cudGVzdCA9IGRhdGE7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBEbyBub3RoaW5nLCBqdXN0IHNob3cgdGhlIG1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFJlY2VpdmVkOiAke2RhdGEuY21kfWApO1xuICAgICAgICAgICAgY29uc29sZS5kaXIoZGF0YS5wYXJhbXMpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN3aXRjaCAoZGF0YVswXSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2NlbmUoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbGxpc2lvbnMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVWZWhpY2xlcyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnN0cmFpbnRzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICB1cGRhdGVTY2VuZShpbmZvKSB7XG4gICAgbGV0IGluZGV4ID0gaW5mb1sxXTtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgaW5kZXggKiBSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLl9vYmplY3RzW2luZm9bb2Zmc2V0XV07XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPT09IGZhbHNlKSB7XG4gICAgICAgIG9iamVjdC5wb3NpdGlvbi5zZXQoXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAxXSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDJdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgM11cbiAgICAgICAgKTtcblxuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID09PSBmYWxzZSkge1xuICAgICAgICBvYmplY3QucXVhdGVybmlvbi5zZXQoXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA0XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDVdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNl0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA3XVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZGF0YS5saW5lYXJWZWxvY2l0eS5zZXQoXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgOF0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgOV0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTBdXG4gICAgICApO1xuXG4gICAgICBkYXRhLmFuZ3VsYXJWZWxvY2l0eS5zZXQoXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTFdLFxuICAgICAgICBpbmZvW29mZnNldCArIDEyXSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxM11cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG5cbiAgICB0aGlzLl9pc19zaW11bGF0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCd1cGRhdGUnKTtcbiAgfVxuXG4gIHVwZGF0ZVNvZnRib2RpZXMoaW5mbykge1xuICAgIGxldCBpbmRleCA9IGluZm9bMV0sXG4gICAgICBvZmZzZXQgPSAyO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IHNpemUgPSBpbmZvW29mZnNldCArIDFdO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tpbmZvW29mZnNldF1dO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgZGF0YSA9IG9iamVjdC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IG9iamVjdC5nZW9tZXRyeS5hdHRyaWJ1dGVzO1xuICAgICAgY29uc3Qgdm9sdW1lUG9zaXRpb25zID0gYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgY29uc3Qgb2Zmc2V0VmVydCA9IG9mZnNldCArIDI7XG5cbiAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEuaWQpO1xuICAgICAgaWYgKCFkYXRhLmlzU29mdEJvZHlSZXNldCkge1xuICAgICAgICBvYmplY3QucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICBvYmplY3QucXVhdGVybmlvbi5zZXQoMCwgMCwgMCwgMCk7XG5cbiAgICAgICAgZGF0YS5pc1NvZnRCb2R5UmVzZXQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS50eXBlID09PSBcInNvZnRUcmltZXNoXCIpIHtcbiAgICAgICAgY29uc3Qgdm9sdW1lTm9ybWFscyA9IGF0dHJpYnV0ZXMubm9ybWFsLmFycmF5O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogMTg7XG5cbiAgICAgICAgICBjb25zdCB4MSA9IGluZm9bb2Zmc107XG4gICAgICAgICAgY29uc3QgeTEgPSBpbmZvW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6MSA9IGluZm9bb2ZmcyArIDJdO1xuXG4gICAgICAgICAgY29uc3QgbngxID0gaW5mb1tvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkxID0gaW5mb1tvZmZzICsgNF07XG4gICAgICAgICAgY29uc3QgbnoxID0gaW5mb1tvZmZzICsgNV07XG5cbiAgICAgICAgICBjb25zdCB4MiA9IGluZm9bb2ZmcyArIDZdO1xuICAgICAgICAgIGNvbnN0IHkyID0gaW5mb1tvZmZzICsgN107XG4gICAgICAgICAgY29uc3QgejIgPSBpbmZvW29mZnMgKyA4XTtcblxuICAgICAgICAgIGNvbnN0IG54MiA9IGluZm9bb2ZmcyArIDldO1xuICAgICAgICAgIGNvbnN0IG55MiA9IGluZm9bb2ZmcyArIDEwXTtcbiAgICAgICAgICBjb25zdCBuejIgPSBpbmZvW29mZnMgKyAxMV07XG5cbiAgICAgICAgICBjb25zdCB4MyA9IGluZm9bb2ZmcyArIDEyXTtcbiAgICAgICAgICBjb25zdCB5MyA9IGluZm9bb2ZmcyArIDEzXTtcbiAgICAgICAgICBjb25zdCB6MyA9IGluZm9bb2ZmcyArIDE0XTtcblxuICAgICAgICAgIGNvbnN0IG54MyA9IGluZm9bb2ZmcyArIDE1XTtcbiAgICAgICAgICBjb25zdCBueTMgPSBpbmZvW29mZnMgKyAxNl07XG4gICAgICAgICAgY29uc3QgbnozID0gaW5mb1tvZmZzICsgMTddO1xuXG4gICAgICAgICAgY29uc3QgaTkgPSBpICogOTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOV0gPSB4MTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAxXSA9IHkxO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDJdID0gejE7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAzXSA9IHgyO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDRdID0geTI7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNV0gPSB6MjtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDZdID0geDM7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgN10gPSB5MztcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA4XSA9IHozO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOV0gPSBueDE7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDFdID0gbnkxO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAyXSA9IG56MTtcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAzXSA9IG54MjtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNF0gPSBueTI7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDVdID0gbnoyO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDZdID0gbngzO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA3XSA9IG55MztcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgOF0gPSBuejM7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDE4O1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoZGF0YS50eXBlID09PSBcInNvZnRSb3BlTWVzaFwiKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogMztcblxuICAgICAgICAgIGNvbnN0IHggPSBpbmZvW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkgPSBpbmZvW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6ID0gaW5mb1tvZmZzICsgMl07XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDNdID0geDtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAxXSA9IHk7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMl0gPSB6O1xuICAgICAgICB9XG5cbiAgICAgICAgb2Zmc2V0ICs9IDIgKyBzaXplICogMztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZvbHVtZU5vcm1hbHMgPSBhdHRyaWJ1dGVzLm5vcm1hbC5hcnJheTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDY7XG5cbiAgICAgICAgICBjb25zdCB4ID0gaW5mb1tvZmZzXTtcbiAgICAgICAgICBjb25zdCB5ID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgeiA9IGluZm9bb2ZmcyArIDJdO1xuXG4gICAgICAgICAgY29uc3QgbnggPSBpbmZvW29mZnMgKyAzXTtcbiAgICAgICAgICBjb25zdCBueSA9IGluZm9bb2ZmcyArIDRdO1xuICAgICAgICAgIGNvbnN0IG56ID0gaW5mb1tvZmZzICsgNV07XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDNdID0geDtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAxXSA9IHk7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMl0gPSB6O1xuXG4gICAgICAgICAgLy8gRklYTUU6IE5vcm1hbHMgYXJlIHBvaW50ZWQgdG8gbG9vayBpbnNpZGU7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogM10gPSBueDtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2kgKiAzICsgMV0gPSBueTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2kgKiAzICsgMl0gPSBuejtcbiAgICAgICAgfVxuXG4gICAgICAgIGF0dHJpYnV0ZXMubm9ybWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgb2Zmc2V0ICs9IDIgKyBzaXplICogNjtcbiAgICAgIH1cblxuICAgICAgYXR0cmlidXRlcy5wb3NpdGlvbi5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgLy8gICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG5cbiAgICB0aGlzLl9pc19zaW11bGF0aW5nID0gZmFsc2U7XG4gIH1cblxuICB1cGRhdGVWZWhpY2xlcyhkYXRhKSB7XG4gICAgbGV0IHZlaGljbGUsIHdoZWVsO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZGF0YS5sZW5ndGggLSAxKSAvIFZFSElDTEVSRVBPUlRfSVRFTVNJWkU7IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMSArIGkgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFO1xuICAgICAgdmVoaWNsZSA9IHRoaXMuX3ZlaGljbGVzW2RhdGFbb2Zmc2V0XV07XG5cbiAgICAgIGlmICh2ZWhpY2xlID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgd2hlZWwgPSB2ZWhpY2xlLndoZWVsc1tkYXRhW29mZnNldCArIDFdXTtcblxuICAgICAgd2hlZWwucG9zaXRpb24uc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDJdLFxuICAgICAgICBkYXRhW29mZnNldCArIDNdLFxuICAgICAgICBkYXRhW29mZnNldCArIDRdXG4gICAgICApO1xuXG4gICAgICB3aGVlbC5xdWF0ZXJuaW9uLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA1XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA2XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA3XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA4XVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIHVwZGF0ZUNvbnN0cmFpbnRzKGRhdGEpIHtcbiAgICBsZXQgY29uc3RyYWludCwgb2JqZWN0O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZGF0YS5sZW5ndGggLSAxKSAvIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMSArIGkgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3RyYWludCA9IHRoaXMuX2NvbnN0cmFpbnRzW2RhdGFbb2Zmc2V0XV07XG4gICAgICBvYmplY3QgPSB0aGlzLl9vYmplY3RzW2RhdGFbb2Zmc2V0ICsgMV1dO1xuXG4gICAgICBpZiAoY29uc3RyYWludCA9PT0gdW5kZWZpbmVkIHx8IG9iamVjdCA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAzXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA0XVxuICAgICAgKTtcblxuICAgICAgdGVtcDFNYXRyaXg0LmV4dHJhY3RSb3RhdGlvbihvYmplY3QubWF0cml4KTtcbiAgICAgIHRlbXAxVmVjdG9yMy5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcblxuICAgICAgY29uc3RyYWludC5wb3NpdGlvbmEuYWRkVmVjdG9ycyhvYmplY3QucG9zaXRpb24sIHRlbXAxVmVjdG9yMyk7XG4gICAgICBjb25zdHJhaW50LmFwcGxpZWRJbXB1bHNlID0gZGF0YVtvZmZzZXQgKyA1XTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIHVwZGF0ZUNvbGxpc2lvbnMoaW5mbykge1xuICAgIC8qKlxuICAgICAqICNUT0RPXG4gICAgICogVGhpcyBpcyBwcm9iYWJseSB0aGUgd29yc3Qgd2F5IGV2ZXIgdG8gaGFuZGxlIGNvbGxpc2lvbnMuIFRoZSBpbmhlcmVudCBldmlsbmVzcyBpcyBhIHJlc2lkdWFsXG4gICAgICogZWZmZWN0IGZyb20gdGhlIHByZXZpb3VzIHZlcnNpb24ncyBldmlsbmVzcyB3aGljaCBtdXRhdGVkIHdoZW4gc3dpdGNoaW5nIHRvIHRyYW5zZmVyYWJsZSBvYmplY3RzLlxuICAgICAqXG4gICAgICogSWYgeW91IGZlZWwgaW5jbGluZWQgdG8gbWFrZSB0aGlzIGJldHRlciwgcGxlYXNlIGRvIHNvLlxuICAgICAqL1xuXG4gICAgY29uc3QgY29sbGlzaW9ucyA9IHt9LFxuICAgICAgbm9ybWFsX29mZnNldHMgPSB7fTtcblxuICAgIC8vIEJ1aWxkIGNvbGxpc2lvbiBtYW5pZmVzdFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5mb1sxXTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgaSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IGluZm9bb2Zmc2V0XTtcbiAgICAgIGNvbnN0IG9iamVjdDIgPSBpbmZvW29mZnNldCArIDFdO1xuXG4gICAgICBub3JtYWxfb2Zmc2V0c1tgJHtvYmplY3R9LSR7b2JqZWN0Mn1gXSA9IG9mZnNldCArIDI7XG4gICAgICBub3JtYWxfb2Zmc2V0c1tgJHtvYmplY3QyfS0ke29iamVjdH1gXSA9IC0xICogKG9mZnNldCArIDIpO1xuXG4gICAgICAvLyBSZWdpc3RlciBjb2xsaXNpb25zIGZvciBib3RoIHRoZSBvYmplY3QgY29sbGlkaW5nIGFuZCB0aGUgb2JqZWN0IGJlaW5nIGNvbGxpZGVkIHdpdGhcbiAgICAgIGlmICghY29sbGlzaW9uc1tvYmplY3RdKSBjb2xsaXNpb25zW29iamVjdF0gPSBbXTtcbiAgICAgIGNvbGxpc2lvbnNbb2JqZWN0XS5wdXNoKG9iamVjdDIpO1xuXG4gICAgICBpZiAoIWNvbGxpc2lvbnNbb2JqZWN0Ml0pIGNvbGxpc2lvbnNbb2JqZWN0Ml0gPSBbXTtcbiAgICAgIGNvbGxpc2lvbnNbb2JqZWN0Ml0ucHVzaChvYmplY3QpO1xuICAgIH1cblxuICAgIC8vIERlYWwgd2l0aCBjb2xsaXNpb25zXG4gICAgZm9yIChjb25zdCBpZDEgaW4gdGhpcy5fb2JqZWN0cykge1xuICAgICAgaWYgKCF0aGlzLl9vYmplY3RzLmhhc093blByb3BlcnR5KGlkMSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tpZDFdO1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgIGNvbnN0IGRhdGEgPSBjb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIC8vIElmIG9iamVjdCB0b3VjaGVzIGFueXRoaW5nLCAuLi5cbiAgICAgIGlmIChjb2xsaXNpb25zW2lkMV0pIHtcbiAgICAgICAgLy8gQ2xlYW4gdXAgdG91Y2hlcyBhcnJheVxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRhdGEudG91Y2hlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmIChjb2xsaXNpb25zW2lkMV0uaW5kZXhPZihkYXRhLnRvdWNoZXNbal0pID09PSAtMSlcbiAgICAgICAgICAgIGRhdGEudG91Y2hlcy5zcGxpY2Uoai0tLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBlYWNoIGNvbGxpZGluZyBvYmplY3RcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb2xsaXNpb25zW2lkMV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBpZDIgPSBjb2xsaXNpb25zW2lkMV1bal07XG4gICAgICAgICAgY29uc3Qgb2JqZWN0MiA9IHRoaXMuX29iamVjdHNbaWQyXTtcbiAgICAgICAgICBjb25zdCBjb21wb25lbnQyID0gb2JqZWN0Mi5jb21wb25lbnQ7XG4gICAgICAgICAgY29uc3QgZGF0YTIgPSBjb21wb25lbnQyLnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgICAgICBpZiAob2JqZWN0Mikge1xuICAgICAgICAgICAgLy8gSWYgb2JqZWN0IHdhcyBub3QgYWxyZWFkeSB0b3VjaGluZyBvYmplY3QyLCBub3RpZnkgb2JqZWN0XG4gICAgICAgICAgICBpZiAoZGF0YS50b3VjaGVzLmluZGV4T2YoaWQyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgZGF0YS50b3VjaGVzLnB1c2goaWQyKTtcblxuICAgICAgICAgICAgICBjb25zdCB2ZWwgPSBjb21wb25lbnQudXNlKCdwaHlzaWNzJykuZ2V0TGluZWFyVmVsb2NpdHkoKTtcbiAgICAgICAgICAgICAgY29uc3QgdmVsMiA9IGNvbXBvbmVudDIudXNlKCdwaHlzaWNzJykuZ2V0TGluZWFyVmVsb2NpdHkoKTtcblxuICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc3ViVmVjdG9ycyh2ZWwsIHZlbDIpO1xuICAgICAgICAgICAgICBjb25zdCB0ZW1wMSA9IHRlbXAxVmVjdG9yMy5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zdWJWZWN0b3JzKHZlbCwgdmVsMik7XG4gICAgICAgICAgICAgIGNvbnN0IHRlbXAyID0gdGVtcDFWZWN0b3IzLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgbGV0IG5vcm1hbF9vZmZzZXQgPSBub3JtYWxfb2Zmc2V0c1tgJHtkYXRhLmlkfS0ke2RhdGEyLmlkfWBdO1xuXG4gICAgICAgICAgICAgIGlmIChub3JtYWxfb2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgICAgICAgICAgICAtaW5mb1tub3JtYWxfb2Zmc2V0XSxcbiAgICAgICAgICAgICAgICAgIC1pbmZvW25vcm1hbF9vZmZzZXQgKyAxXSxcbiAgICAgICAgICAgICAgICAgIC1pbmZvW25vcm1hbF9vZmZzZXQgKyAyXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9ybWFsX29mZnNldCAqPSAtMTtcblxuICAgICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgICAgICAgICAgICBpbmZvW25vcm1hbF9vZmZzZXRdLFxuICAgICAgICAgICAgICAgICAgaW5mb1tub3JtYWxfb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgICAgICAgICBpbmZvW25vcm1hbF9vZmZzZXQgKyAyXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb21wb25lbnQuZW1pdCgnY29sbGlzaW9uJywgb2JqZWN0MiwgdGVtcDEsIHRlbXAyLCB0ZW1wMVZlY3RvcjMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGRhdGEudG91Y2hlcy5sZW5ndGggPSAwOyAvLyBub3QgdG91Y2hpbmcgb3RoZXIgb2JqZWN0c1xuICAgIH1cblxuICAgIHRoaXMuY29sbGlzaW9ucyA9IGNvbGxpc2lvbnM7XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoaW5mby5idWZmZXIsIFtpbmZvLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIGFkZENvbnN0cmFpbnQoY29uc3RyYWludCwgc2hvd19tYXJrZXIpIHtcbiAgICBjb25zdHJhaW50LmlkID0gdGhpcy5nZXRPYmplY3RJZCgpO1xuICAgIHRoaXMuX2NvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdID0gY29uc3RyYWludDtcbiAgICBjb25zdHJhaW50LndvcmxkTW9kdWxlID0gdGhpcztcbiAgICB0aGlzLmV4ZWN1dGUoJ2FkZENvbnN0cmFpbnQnLCBjb25zdHJhaW50LmdldERlZmluaXRpb24oKSk7XG5cbiAgICBpZiAoc2hvd19tYXJrZXIpIHtcbiAgICAgIGxldCBtYXJrZXI7XG5cbiAgICAgIHN3aXRjaCAoY29uc3RyYWludC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ3BvaW50JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnaGluZ2UnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMuX29iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzbGlkZXInOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IEJveEdlb21ldHJ5KDEwLCAxLCAxKSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG5cbiAgICAgICAgICAvLyBUaGlzIHJvdGF0aW9uIGlzbid0IHJpZ2h0IGlmIGFsbCB0aHJlZSBheGlzIGFyZSBub24tMCB2YWx1ZXNcbiAgICAgICAgICAvLyBUT0RPOiBjaGFuZ2UgbWFya2VyJ3Mgcm90YXRpb24gb3JkZXIgdG8gWllYXG4gICAgICAgICAgbWFya2VyLnJvdGF0aW9uLnNldChcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy55LCAvLyB5ZXMsIHkgYW5kXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMueCwgLy8geCBheGlzIGFyZSBzd2FwcGVkXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMuelxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2NvbmV0d2lzdCc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2RvZic6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb25zdHJhaW50O1xuICB9XG5cbiAgb25TaW11bGF0aW9uUmVzdW1lKCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnb25TaW11bGF0aW9uUmVzdW1lJywge30pO1xuICB9XG5cbiAgcmVtb3ZlQ29uc3RyYWludChjb25zdHJhaW50KSB7XG4gICAgaWYgKHRoaXMuX2NvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlQ29uc3RyYWludCcsIHtpZDogY29uc3RyYWludC5pZH0pO1xuICAgICAgZGVsZXRlIHRoaXMuX2NvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdO1xuICAgIH1cbiAgfVxuXG4gIGV4ZWN1dGUoY21kLCBwYXJhbXMpIHtcbiAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZSh7Y21kLCBwYXJhbXN9KTtcbiAgfVxuXG4gIG9uQWRkQ2FsbGJhY2soY29tcG9uZW50KSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gY29tcG9uZW50Lm5hdGl2ZTtcbiAgICBjb25zdCBkYXRhID0gb2JqZWN0LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnNldCgnbW9kdWxlOndvcmxkJywgdGhpcyk7XG4gICAgICBkYXRhLmlkID0gdGhpcy5nZXRPYmplY3RJZCgpO1xuICAgICAgb2JqZWN0LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhID0gZGF0YTtcblxuICAgICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFZlaGljbGUpIHtcbiAgICAgICAgdGhpcy5vbkFkZENhbGxiYWNrKG9iamVjdC5tZXNoKTtcbiAgICAgICAgdGhpcy5fdmVoaWNsZXNbZGF0YS5pZF0gPSBvYmplY3Q7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgnYWRkVmVoaWNsZScsIGRhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX29iamVjdHNbZGF0YS5pZF0gPSBvYmplY3Q7XG5cbiAgICAgICAgaWYgKG9iamVjdC5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICBkYXRhLmNoaWxkcmVuID0gW107XG4gICAgICAgICAgYWRkT2JqZWN0Q2hpbGRyZW4ob2JqZWN0LCBvYmplY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgKG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcykge1xuICAgICAgICAvLyAgIGlmICh0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50cy5oYXNPd25Qcm9wZXJ0eShvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWQpKVxuICAgICAgICAvLyAgICAgdGhpcy5fbWF0ZXJpYWxzX3JlZl9jb3VudHNbb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzLmlkXSsrO1xuICAgICAgICAvLyAgIGVsc2Uge1xuICAgICAgICAvLyAgICAgdGhpcy5leGVjdXRlKCdyZWdpc3Rlck1hdGVyaWFsJywgb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzKTtcbiAgICAgICAgLy8gICAgIGRhdGEubWF0ZXJpYWxJZCA9IG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZDtcbiAgICAgICAgLy8gICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0gPSAxO1xuICAgICAgICAvLyAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIC8vIG9iamVjdC5xdWF0ZXJuaW9uLnNldEZyb21FdWxlcihvYmplY3Qucm90YXRpb24pO1xuICAgICAgICAvL1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhvYmplY3QuY29tcG9uZW50KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2cob2JqZWN0LnJvdGF0aW9uKTtcblxuICAgICAgICAvLyBPYmplY3Qgc3RhcnRpbmcgcG9zaXRpb24gKyByb3RhdGlvblxuICAgICAgICBkYXRhLnBvc2l0aW9uID0ge1xuICAgICAgICAgIHg6IG9iamVjdC5wb3NpdGlvbi54LFxuICAgICAgICAgIHk6IG9iamVjdC5wb3NpdGlvbi55LFxuICAgICAgICAgIHo6IG9iamVjdC5wb3NpdGlvbi56XG4gICAgICAgIH07XG5cbiAgICAgICAgZGF0YS5yb3RhdGlvbiA9IHtcbiAgICAgICAgICB4OiBvYmplY3QucXVhdGVybmlvbi54LFxuICAgICAgICAgIHk6IG9iamVjdC5xdWF0ZXJuaW9uLnksXG4gICAgICAgICAgejogb2JqZWN0LnF1YXRlcm5pb24ueixcbiAgICAgICAgICB3OiBvYmplY3QucXVhdGVybmlvbi53XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGRhdGEud2lkdGgpIGRhdGEud2lkdGggKj0gb2JqZWN0LnNjYWxlLng7XG4gICAgICAgIGlmIChkYXRhLmhlaWdodCkgZGF0YS5oZWlnaHQgKj0gb2JqZWN0LnNjYWxlLnk7XG4gICAgICAgIGlmIChkYXRhLmRlcHRoKSBkYXRhLmRlcHRoICo9IG9iamVjdC5zY2FsZS56O1xuXG4gICAgICAgIHRoaXMuZXhlY3V0ZSgnYWRkT2JqZWN0JywgZGF0YSk7XG4gICAgICB9XG5cbiAgICAgIGNvbXBvbmVudC5lbWl0KCdwaHlzaWNzOmFkZGVkJyk7XG4gICAgfVxuICB9XG5cbiAgb25SZW1vdmVDYWxsYmFjayhjb21wb25lbnQpIHtcbiAgICBjb25zdCBvYmplY3QgPSBjb21wb25lbnQubmF0aXZlO1xuXG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFZlaGljbGUpIHtcbiAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlVmVoaWNsZScsIHtpZDogb2JqZWN0Ll9waHlzaWpzLmlkfSk7XG4gICAgICB3aGlsZSAob2JqZWN0LndoZWVscy5sZW5ndGgpIHRoaXMucmVtb3ZlKG9iamVjdC53aGVlbHMucG9wKCkpO1xuXG4gICAgICB0aGlzLnJlbW92ZShvYmplY3QubWVzaCk7XG4gICAgICB0aGlzLl92ZWhpY2xlc1tvYmplY3QuX3BoeXNpanMuaWRdID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWVzaC5wcm90b3R5cGUucmVtb3ZlLmNhbGwodGhpcywgb2JqZWN0KTtcblxuICAgICAgaWYgKG9iamVjdC5fcGh5c2lqcykge1xuICAgICAgICBjb21wb25lbnQubWFuYWdlci5yZW1vdmUoJ21vZHVsZTp3b3JsZCcpO1xuICAgICAgICB0aGlzLl9vYmplY3RzW29iamVjdC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ3JlbW92ZU9iamVjdCcsIHtpZDogb2JqZWN0Ll9waHlzaWpzLmlkfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvYmplY3QubWF0ZXJpYWwgJiYgb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzICYmIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzLmhhc093blByb3BlcnR5KG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZCkpIHtcbiAgICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0tLTtcblxuICAgICAgaWYgKHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0gPT09IDApIHtcbiAgICAgICAgdGhpcy5leGVjdXRlKCd1blJlZ2lzdGVyTWF0ZXJpYWwnLCBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMpO1xuICAgICAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBkZWZlcihmdW5jLCBhcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0xvYWRlZCkge1xuICAgICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9IGVsc2UgdGhpcy5sb2FkZXIudGhlbigoKSA9PiB7XG4gICAgICAgIGZ1bmMoLi4uYXJncyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgbWFuYWdlci5zZXQoJ3BoeXNpY3NXb3JrZXInLCB0aGlzLndvcmtlcik7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgb25BZGQoY29tcG9uZW50LCBzZWxmKSB7XG4gICAgICBpZiAoY29tcG9uZW50LnVzZSgncGh5c2ljcycpKSByZXR1cm4gc2VsZi5kZWZlcihzZWxmLm9uQWRkQ2FsbGJhY2suYmluZChzZWxmKSwgW2NvbXBvbmVudF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH0sXG5cbiAgICBvblJlbW92ZShjb21wb25lbnQsIHNlbGYpIHtcbiAgICAgIGlmIChjb21wb25lbnQudXNlKCdwaHlzaWNzJykpIHJldHVybiBzZWxmLmRlZmVyKHNlbGYub25SZW1vdmVDYWxsYmFjay5iaW5kKHNlbGYpLCBbY29tcG9uZW50XSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICAvLyAuLi5cblxuICAgIHRoaXMuc2V0Rml4ZWRUaW1lU3RlcCA9IGZ1bmN0aW9uKGZpeGVkVGltZVN0ZXApIHtcbiAgICAgIGlmIChmaXhlZFRpbWVTdGVwKSBzZWxmLmV4ZWN1dGUoJ3NldEZpeGVkVGltZVN0ZXAnLCBmaXhlZFRpbWVTdGVwKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldEdyYXZpdHkgPSBmdW5jdGlvbihncmF2aXR5KSB7XG4gICAgICBpZiAoZ3Jhdml0eSkgc2VsZi5leGVjdXRlKCdzZXRHcmF2aXR5JywgZ3Jhdml0eSk7XG4gICAgfVxuXG4gICAgdGhpcy5hZGRDb25zdHJhaW50ID0gc2VsZi5hZGRDb25zdHJhaW50LmJpbmQoc2VsZik7XG5cbiAgICB0aGlzLnNpbXVsYXRlID0gZnVuY3Rpb24odGltZVN0ZXAsIG1heFN1YlN0ZXBzKSB7XG4gICAgICBpZiAoc2VsZi5fc3RhdHMpIHNlbGYuX3N0YXRzLmJlZ2luKCk7XG5cbiAgICAgIGlmIChzZWxmLl9pc19zaW11bGF0aW5nKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHNlbGYuX2lzX3NpbXVsYXRpbmcgPSB0cnVlO1xuXG4gICAgICBmb3IgKGNvbnN0IG9iamVjdF9pZCBpbiBzZWxmLl9vYmplY3RzKSB7XG4gICAgICAgIGlmICghc2VsZi5fb2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShvYmplY3RfaWQpKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCBvYmplY3QgPSBzZWxmLl9vYmplY3RzW29iamVjdF9pZF07XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBjb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgICBpZiAob2JqZWN0ICE9PSBudWxsICYmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uIHx8IGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24pKSB7XG4gICAgICAgICAgY29uc3QgdXBkYXRlID0ge2lkOiBkYXRhLmlkfTtcblxuICAgICAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uKSB7XG4gICAgICAgICAgICB1cGRhdGUucG9zID0ge1xuICAgICAgICAgICAgICB4OiBvYmplY3QucG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgeTogb2JqZWN0LnBvc2l0aW9uLnksXG4gICAgICAgICAgICAgIHo6IG9iamVjdC5wb3NpdGlvbi56XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoZGF0YS5pc1NvZnRib2R5KSBvYmplY3QucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuXG4gICAgICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24pIHtcbiAgICAgICAgICAgIHVwZGF0ZS5xdWF0ID0ge1xuICAgICAgICAgICAgICB4OiBvYmplY3QucXVhdGVybmlvbi54LFxuICAgICAgICAgICAgICB5OiBvYmplY3QucXVhdGVybmlvbi55LFxuICAgICAgICAgICAgICB6OiBvYmplY3QucXVhdGVybmlvbi56LFxuICAgICAgICAgICAgICB3OiBvYmplY3QucXVhdGVybmlvbi53XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoZGF0YS5pc1NvZnRib2R5KSBvYmplY3Qucm90YXRpb24uc2V0KDAsIDAsIDApO1xuXG4gICAgICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VsZi5leGVjdXRlKCd1cGRhdGVUcmFuc2Zvcm0nLCB1cGRhdGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlbGYuZXhlY3V0ZSgnc2ltdWxhdGUnLCB7dGltZVN0ZXAsIG1heFN1YlN0ZXBzfSk7XG5cbiAgICAgIGlmIChzZWxmLl9zdGF0cykgc2VsZi5fc3RhdHMuZW5kKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBjb25zdCBzaW11bGF0ZVByb2Nlc3MgPSAodCkgPT4ge1xuICAgIC8vICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShzaW11bGF0ZVByb2Nlc3MpO1xuXG4gICAgLy8gICB0aGlzLnNpbXVsYXRlKDEvNjAsIDEpOyAvLyBkZWx0YSwgMVxuICAgIC8vIH1cblxuICAgIC8vIHNpbXVsYXRlUHJvY2VzcygpO1xuXG4gICAgc2VsZi5sb2FkZXIudGhlbigoKSA9PiB7XG4gICAgICBzZWxmLnNpbXVsYXRlTG9vcCA9IG5ldyBMb29wKChjbG9jaykgPT4ge1xuICAgICAgICB0aGlzLnNpbXVsYXRlKGNsb2NrLmdldERlbHRhKCksIDEpOyAvLyBkZWx0YSwgMVxuICAgICAgfSk7XG5cbiAgICAgIHNlbGYuc2ltdWxhdGVMb29wLnN0YXJ0KHRoaXMpO1xuXG4gICAgICB0aGlzLnNldEdyYXZpdHkocGFyYW1zLmdyYXZpdHkpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge1ZlY3RvcjMsIFF1YXRlcm5pb259IGZyb20gJ3RocmVlJztcblxuY29uc3QgcHJvcGVydGllcyA9IHtcbiAgcG9zaXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQodmVjdG9yMykge1xuICAgICAgY29uc3QgcG9zID0gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzO1xuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhwb3MsIHtcbiAgICAgICAgeDoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl94O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeCkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ggPSB4O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgeToge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl95O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeSkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3kgPSB5O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgejoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl96O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeikge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ogPSB6O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHNjb3BlLl9fZGlydHlQb3NpdGlvbiA9IHRydWU7XG5cbiAgICAgIHBvcy5jb3B5KHZlY3RvcjMpO1xuICAgIH1cbiAgfSxcblxuICBxdWF0ZXJuaW9uOiB7XG4gICAgZ2V0KCkge1xuICAgICAgdGhpcy5fX2Nfcm90ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLm5hdGl2ZS5xdWF0ZXJuaW9uO1xuICAgIH0sXG5cbiAgICBzZXQocXVhdGVybmlvbikge1xuICAgICAgY29uc3QgcXVhdCA9IHRoaXMuX25hdGl2ZS5xdWF0ZXJuaW9uLFxuICAgICAgICBuYXRpdmUgPSB0aGlzLl9uYXRpdmU7XG5cbiAgICAgIHF1YXQuY29weShxdWF0ZXJuaW9uKTtcblxuICAgICAgcXVhdC5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9fY19yb3QpIHtcbiAgICAgICAgICBpZiAobmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5fX2Nfcm90ID0gZmFsc2U7XG4gICAgICAgICAgICBuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgcm90YXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMuX25hdGl2ZS5yb3RhdGlvbjtcbiAgICB9LFxuXG4gICAgc2V0KGV1bGVyKSB7XG4gICAgICBjb25zdCByb3QgPSB0aGlzLl9uYXRpdmUucm90YXRpb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoZXVsZXIpKTtcblxuICAgICAgcm90Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIHRoaXMucXVhdGVybmlvbi5jb3B5KG5ldyBRdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHJvdCkpO1xuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcFBoeXNpY3NQcm90b3R5cGUoc2NvcGUpIHtcbiAgZm9yIChsZXQga2V5IGluIHByb3BlcnRpZXMpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NvcGUsIGtleSwge1xuICAgICAgZ2V0OiBwcm9wZXJ0aWVzW2tleV0uZ2V0LmJpbmQoc2NvcGUpLFxuICAgICAgc2V0OiBwcm9wZXJ0aWVzW2tleV0uc2V0LmJpbmQoc2NvcGUpLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uQ29weShzb3VyY2UpIHtcbiAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG5cbiAgY29uc3QgcGh5c2ljcyA9IHRoaXMudXNlKCdwaHlzaWNzJyk7XG4gIGNvbnN0IHNvdXJjZVBoeXNpY3MgPSBzb3VyY2UudXNlKCdwaHlzaWNzJyk7XG5cbiAgdGhpcy5tYW5hZ2VyLm1vZHVsZXMucGh5c2ljcyA9IHBoeXNpY3MuY2xvbmUodGhpcy5tYW5hZ2VyKTtcblxuICBwaHlzaWNzLmRhdGEgPSB7Li4uc291cmNlUGh5c2ljcy5kYXRhfTtcbiAgcGh5c2ljcy5kYXRhLmlzU29mdEJvZHlSZXNldCA9IGZhbHNlO1xuICBpZiAocGh5c2ljcy5kYXRhLmlzU29mdGJvZHkpIHBoeXNpY3MuZGF0YS5pc1NvZnRCb2R5UmVzZXQgPSBmYWxzZTtcblxuICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5jbG9uZSgpO1xuICB0aGlzLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbi5jbG9uZSgpO1xuICB0aGlzLnF1YXRlcm5pb24gPSB0aGlzLnF1YXRlcm5pb24uY2xvbmUoKTtcblxuICByZXR1cm4gc291cmNlO1xufVxuXG5mdW5jdGlvbiBvbldyYXAoKSB7XG4gIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmNsb25lKCk7XG4gIHRoaXMucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uLmNsb25lKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IHRoaXMucXVhdGVybmlvbi5jbG9uZSgpO1xufVxuXG5jbGFzcyBBUEkge1xuICBhcHBseUNlbnRyYWxJbXB1bHNlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUNlbnRyYWxJbXB1bHNlJywge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZvcmNlLngsIHk6IGZvcmNlLnksIHo6IGZvcmNlLnp9KTtcbiAgfVxuXG4gIGFwcGx5SW1wdWxzZShmb3JjZSwgb2Zmc2V0KSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUltcHVsc2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgaW1wdWxzZV94OiBmb3JjZS54LFxuICAgICAgaW1wdWxzZV95OiBmb3JjZS55LFxuICAgICAgaW1wdWxzZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseVRvcnF1ZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlUb3JxdWUnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgdG9ycXVlX3g6IGZvcmNlLngsXG4gICAgICB0b3JxdWVfeTogZm9yY2UueSxcbiAgICAgIHRvcnF1ZV96OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUNlbnRyYWxGb3JjZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlDZW50cmFsRm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgeDogZm9yY2UueCxcbiAgICAgIHk6IGZvcmNlLnksXG4gICAgICB6OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUZvcmNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Rm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgZm9yY2VfeDogZm9yY2UueCxcbiAgICAgIGZvcmNlX3k6IGZvcmNlLnksXG4gICAgICBmb3JjZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBnZXRBbmd1bGFyVmVsb2NpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5hbmd1bGFyVmVsb2NpdHk7XG4gIH1cblxuICBzZXRBbmd1bGFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0QW5ndWxhclZlbG9jaXR5JyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiB2ZWxvY2l0eS54LCB5OiB2ZWxvY2l0eS55LCB6OiB2ZWxvY2l0eS56fVxuICAgICk7XG4gIH1cblxuICBnZXRMaW5lYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmxpbmVhclZlbG9jaXR5O1xuICB9XG5cbiAgc2V0TGluZWFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyVmVsb2NpdHknLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJGYWN0b3IoZmFjdG9yKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldEFuZ3VsYXJGYWN0b3InLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldExpbmVhckZhY3RvcihmYWN0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyRmFjdG9yJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiBmYWN0b3IueCwgeTogZmFjdG9yLnksIHo6IGZhY3Rvci56fVxuICAgICk7XG4gIH1cblxuICBzZXREYW1waW5nKGxpbmVhciwgYW5ndWxhcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXREYW1waW5nJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCBsaW5lYXIsIGFuZ3VsYXJ9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZE1vdGlvblRocmVzaG9sZCh0aHJlc2hvbGQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0Q2NkTW90aW9uVGhyZXNob2xkJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB0aHJlc2hvbGR9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKHJhZGl1cykge1xuICAgIHRoaXMuZXhlY3V0ZSgnc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMnLCB7aWQ6IHRoaXMuZGF0YS5pZCwgcmFkaXVzfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgZXh0ZW5kcyBBUEkge1xuICBzdGF0aWMgcmlnaWRib2R5ID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgbWFzczogMTAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMFxuICB9KTtcblxuICBzdGF0aWMgc29mdGJvZHkgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICBwcmVzc3VyZTogMTAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBrbHN0OiAwLjksXG4gICAga3ZzdDogMC45LFxuICAgIGthc3Q6IDAuOSxcbiAgICBwaXRlcmF0aW9uczogMSxcbiAgICB2aXRlcmF0aW9uczogMCxcbiAgICBkaXRlcmF0aW9uczogMCxcbiAgICBjaXRlcmF0aW9uczogNCxcbiAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgIHJpZ2lkSGFyZG5lc3M6IDEsXG4gICAgaXNTb2Z0Ym9keTogdHJ1ZSxcbiAgICBpc1NvZnRCb2R5UmVzZXQ6IGZhbHNlXG4gIH0pO1xuXG4gIHN0YXRpYyByb3BlID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBrbHN0OiAwLjksXG4gICAga3ZzdDogMC45LFxuICAgIGthc3Q6IDAuOSxcbiAgICBwaXRlcmF0aW9uczogMSxcbiAgICB2aXRlcmF0aW9uczogMCxcbiAgICBkaXRlcmF0aW9uczogMCxcbiAgICBjaXRlcmF0aW9uczogNCxcbiAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgIHJpZ2lkSGFyZG5lc3M6IDEsXG4gICAgaXNTb2Z0Ym9keTogdHJ1ZVxuICB9KTtcblxuICBzdGF0aWMgY2xvdGggPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgZGFtcGluZzogMCxcbiAgICBtYXJnaW46IDAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMVxuICB9KTtcblxuICBjb25zdHJ1Y3RvcihkZWZhdWx0cywgZGF0YSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbihkZWZhdWx0cywgZGF0YSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgbWFuYWdlci5kZWZpbmUoJ3BoeXNpY3MnKTtcblxuICAgIHRoaXMuZXhlY3V0ZSA9ICguLi5kYXRhKSA9PiB7XG4gICAgICByZXR1cm4gbWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpXG4gICAgICA/IG1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKC4uLmRhdGEpXG4gICAgICA6ICgpID0+IHt9O1xuICAgIH07XG4gIH1cblxuICB1cGRhdGVEYXRhKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5icmlkZ2UuZ2VvbWV0cnkgPSBmdW5jdGlvbiAoZ2VvbWV0cnksIG1vZHVsZSkge1xuICAgICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuIGdlb21ldHJ5O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjayhnZW9tZXRyeSwgbW9kdWxlKTtcbiAgICAgIHJldHVybiByZXN1bHQgPyByZXN1bHQgOiBnZW9tZXRyeTtcbiAgICB9XG4gIH1cblxuICBjbG9uZShtYW5hZ2VyKSB7XG4gICAgY29uc3QgY2xvbmUgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpO1xuICAgIGNsb25lLmRhdGEgPSB7Li4udGhpcy5kYXRhfTtcbiAgICBjbG9uZS5icmlkZ2UuZ2VvbWV0cnkgPSB0aGlzLmJyaWRnZS5nZW9tZXRyeTtcbiAgICB0aGlzLm1hbmFnZXIuYXBwbHkoY2xvbmUsIFttYW5hZ2VyXSk7XG5cbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQm94TW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdib3gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEuZGVwdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb3VuZE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29tcG91bmQnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuLy8gVE9ETzogVGVzdCBDYXBzdWxlTW9kdWxlIGluIGFjdGlvbi5cbmV4cG9ydCBjbGFzcyBDYXBzdWxlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjYXBzdWxlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uY2F2ZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29uY2F2ZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgZGF0YS5kYXRhID0gdGhpcy5nZW9tZXRyeVByb2Nlc3NvcihnZW9tZXRyeSk7XG4gICAgfSk7XG4gIH1cblxuICBnZW9tZXRyeVByb2Nlc3NvcihnZW9tZXRyeSkge1xuICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgY29uc3QgZGF0YSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgP1xuICAgICAgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6XG4gICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDkpO1xuXG4gICAgaWYgKCFnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBjb25zdCB2ZXJ0aWNlcyA9IGdlb21ldHJ5LnZlcnRpY2VzO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgICBjb25zdCB2QSA9IHZlcnRpY2VzW2ZhY2UuYV07XG4gICAgICAgIGNvbnN0IHZCID0gdmVydGljZXNbZmFjZS5iXTtcbiAgICAgICAgY29uc3QgdkMgPSB2ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgZGF0YVtpOV0gPSB2QS54O1xuICAgICAgICBkYXRhW2k5ICsgMV0gPSB2QS55O1xuICAgICAgICBkYXRhW2k5ICsgMl0gPSB2QS56O1xuXG4gICAgICAgIGRhdGFbaTkgKyAzXSA9IHZCLng7XG4gICAgICAgIGRhdGFbaTkgKyA0XSA9IHZCLnk7XG4gICAgICAgIGRhdGFbaTkgKyA1XSA9IHZCLno7XG5cbiAgICAgICAgZGF0YVtpOSArIDZdID0gdkMueDtcbiAgICAgICAgZGF0YVtpOSArIDddID0gdkMueTtcbiAgICAgICAgZGF0YVtpOSArIDhdID0gdkMuejtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfTtcbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NvbmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLnJhZGl1cyA9IChnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54KSAvIDI7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnl9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbnZleE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29udmV4JyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcbiAgICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkgZ2VvbWV0cnkuX2J1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCkuZnJvbUdlb21ldHJ5KGdlb21ldHJ5KTtcblxuICAgICAgZGF0YS5kYXRhID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/XG4gICAgICAgIGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOlxuICAgICAgICBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ3lsaW5kZXJNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2N5bGluZGVyJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuaW1wb3J0IHtWZWN0b3IzLCBWZWN0b3IyLCBCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgY2xhc3MgSGVpZ2h0ZmllbGRNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2hlaWdodGZpZWxkJyxcbiAgICAgIHNpemU6IG5ldyBWZWN0b3IyKDEsIDEpLFxuICAgICAgYXV0b0FsaWduOiBmYWxzZSxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBjb25zdCB7eDogeGRpdiwgeTogeWRpdn0gPSBkYXRhLnNpemU7XG4gICAgICBjb25zdCB2ZXJ0cyA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgPyBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDogZ2VvbWV0cnkudmVydGljZXM7XG4gICAgICBsZXQgc2l6ZSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgPyB2ZXJ0cy5sZW5ndGggLyAzIDogdmVydHMubGVuZ3RoO1xuXG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgY29uc3QgeHNpemUgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgY29uc3QgeXNpemUgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuXG4gICAgICBkYXRhLnhwdHMgPSAodHlwZW9mIHhkaXYgPT09ICd1bmRlZmluZWQnKSA/IE1hdGguc3FydChzaXplKSA6IHhkaXYgKyAxO1xuICAgICAgZGF0YS55cHRzID0gKHR5cGVvZiB5ZGl2ID09PSAndW5kZWZpbmVkJykgPyBNYXRoLnNxcnQoc2l6ZSkgOiB5ZGl2ICsgMTtcblxuICAgICAgLy8gbm90ZSAtIHRoaXMgYXNzdW1lcyBvdXIgcGxhbmUgZ2VvbWV0cnkgaXMgc3F1YXJlLCB1bmxlc3Mgd2UgcGFzcyBpbiBzcGVjaWZpYyB4ZGl2IGFuZCB5ZGl2XG4gICAgICBkYXRhLmFic01heEhlaWdodCA9IE1hdGgubWF4KGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55LCBNYXRoLmFicyhnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueSkpO1xuXG4gICAgICBjb25zdCBwb2ludHMgPSBuZXcgRmxvYXQzMkFycmF5KHNpemUpLFxuICAgICAgICB4cHRzID0gZGF0YS54cHRzLFxuICAgICAgICB5cHRzID0gZGF0YS55cHRzO1xuXG4gICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgIGNvbnN0IHZOdW0gPSBzaXplICUgeHB0cyArICgoeXB0cyAtIE1hdGgucm91bmQoKHNpemUgLyB4cHRzKSAtICgoc2l6ZSAlIHhwdHMpIC8geHB0cykpIC0gMSkgKiB5cHRzKTtcblxuICAgICAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkgcG9pbnRzW3NpemVdID0gdmVydHNbdk51bSAqIDMgKyAxXTtcbiAgICAgICAgZWxzZSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtXS55O1xuICAgICAgfVxuXG4gICAgICBkYXRhLnBvaW50cyA9IHBvaW50cztcblxuICAgICAgZGF0YS5zY2FsZS5tdWx0aXBseShcbiAgICAgICAgbmV3IFZlY3RvcjMoeHNpemUgLyAoeHB0cyAtIDEpLCAxLCB5c2l6ZSAvICh5cHRzIC0gMSkpXG4gICAgICApO1xuXG4gICAgICBpZiAoZGF0YS5hdXRvQWxpZ24pIGdlb21ldHJ5LnRyYW5zbGF0ZSh4c2l6ZSAvIC0yLCAwLCB5c2l6ZSAvIC0yKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgUGxhbmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3BsYW5lJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLm5vcm1hbCA9IGdlb21ldHJ5LmZhY2VzWzBdLm5vcm1hbC5jbG9uZSgpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBTcGhlcmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NwaGVyZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ1NwaGVyZSkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICBkYXRhLnJhZGl1cyA9IGdlb21ldHJ5LmJvdW5kaW5nU3BoZXJlLnJhZGl1cztcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBTb2Z0Ym9keU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc29mdFRyaW1lc2gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5zb2Z0Ym9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgY29uc3QgaWR4R2VvbWV0cnkgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5XG4gICAgICAgID8gZ2VvbWV0cnlcbiAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgIGdlb21ldHJ5Lm1lcmdlVmVydGljZXMoKTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuc2V0SW5kZXgoXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgKGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAxXG4gICAgICAgICAgICApLmNvcHlJbmRpY2VzQXJyYXkoZ2VvbWV0cnkuZmFjZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmZXJHZW9tZXRyeTtcbiAgICAgICAgfSkoKTtcblxuICAgICAgZGF0YS5hVmVydGljZXMgPSBpZHhHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuICAgICAgZGF0YS5hSW5kaWNlcyA9IGlkeEdlb21ldHJ5LmluZGV4LmFycmF5O1xuXG4gICAgICByZXR1cm4gbmV3IEJ1ZmZlckdlb21ldHJ5KCkuZnJvbUdlb21ldHJ5KGdlb21ldHJ5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGV9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENsb3RoTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzb2Z0Q2xvdGhNZXNoJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUuY2xvdGgoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IGdlb21QYXJhbXMgPSBnZW9tZXRyeS5wYXJhbWV0ZXJzO1xuXG4gICAgICBjb25zdCBnZW9tID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeVxuICAgICAgICA/IGdlb21ldHJ5XG4gICAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgIGdlb21ldHJ5Lm1lcmdlVmVydGljZXMoKTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3QgZmFjZXMgPSBnZW9tZXRyeS5mYWNlcywgZmFjZXNMZW5ndGggPSBmYWNlcy5sZW5ndGg7XG4gICAgICAgICAgY29uc3Qgbm9ybWFsc0FycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmYWNlc0xlbmd0aCAqIDMpO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmYWNlc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpMyA9IGkgKiAzO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gZmFjZXNbaV0ubm9ybWFsIHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpM10gPSBub3JtYWwueDtcbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpMyArIDFdID0gbm9ybWFsLnk7XG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTMgKyAyXSA9IG5vcm1hbC56O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdub3JtYWwnLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbm9ybWFsc0FycmF5LFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IChmYWNlc0xlbmd0aCAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGZhY2VzTGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShmYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBjb25zdCB2ZXJ0cyA9IGdlb20uYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgaWYgKCFnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMpIGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyA9IDE7XG4gICAgICBpZiAoIWdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMpIGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgPSAxO1xuXG4gICAgICBjb25zdCBpZHgwMCA9IDA7XG4gICAgICBjb25zdCBpZHgwMSA9IGdlb21QYXJhbXMud2lkdGhTZWdtZW50cztcbiAgICAgIGNvbnN0IGlkeDEwID0gKGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgKyAxKSAqIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKSAtIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKTtcbiAgICAgIGNvbnN0IGlkeDExID0gdmVydHMubGVuZ3RoIC8gMyAtIDE7XG5cbiAgICAgIGRhdGEuY29ybmVycyA9IFtcbiAgICAgICAgdmVydHNbaWR4MDEgKiAzXSwgdmVydHNbaWR4MDEgKiAzICsgMV0sIHZlcnRzW2lkeDAxICogMyArIDJdLCAvLyAgIOKVl1xuICAgICAgICB2ZXJ0c1tpZHgwMCAqIDNdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAxXSwgdmVydHNbaWR4MDAgKiAzICsgMl0sIC8vIOKVlFxuICAgICAgICB2ZXJ0c1tpZHgxMSAqIDNdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAxXSwgdmVydHNbaWR4MTEgKiAzICsgMl0sIC8vICAgICAgIOKVnVxuICAgICAgICB2ZXJ0c1tpZHgxMCAqIDNdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAxXSwgdmVydHNbaWR4MTAgKiAzICsgMl0sIC8vICAgICDilZpcbiAgICAgIF07XG5cbiAgICAgIGRhdGEuc2VnbWVudHMgPSBbZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSwgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDFdO1xuXG4gICAgICByZXR1cm4gZ2VvbTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUsIFZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFJvcGVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NvZnRSb3BlTWVzaCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJvcGUoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgICBnZW9tZXRyeSA9ICgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYnVmZiA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZi5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmY7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxlbmd0aCA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkubGVuZ3RoIC8gMztcbiAgICAgIGNvbnN0IHZlcnQgPSBuID0+IG5ldyBWZWN0b3IzKCkuZnJvbUFycmF5KGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXksIG4qMyk7XG5cbiAgICAgIGNvbnN0IHYxID0gdmVydCgwKTtcbiAgICAgIGNvbnN0IHYyID0gdmVydChsZW5ndGggLSAxKTtcblxuICAgICAgZGF0YS5kYXRhID0gW1xuICAgICAgICB2MS54LCB2MS55LCB2MS56LFxuICAgICAgICB2Mi54LCB2Mi55LCB2Mi56LFxuICAgICAgICBsZW5ndGhcbiAgICAgIF07XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0xvb3B9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7XG4gIE9iamVjdDNELFxuICBRdWF0ZXJuaW9uLFxuICBWZWN0b3IzLFxuICBFdWxlclxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFBJXzIgPSBNYXRoLlBJIC8gMjtcblxuLy8gVE9ETzogRml4IERPTVxuZnVuY3Rpb24gRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihjYW1lcmEsIG1lc2gsIHBhcmFtcykge1xuICBjb25zdCB2ZWxvY2l0eUZhY3RvciA9IDE7XG4gIGxldCBydW5WZWxvY2l0eSA9IDAuMjU7XG5cbiAgbWVzaC51c2UoJ3BoeXNpY3MnKS5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgLyogSW5pdCAqL1xuICBjb25zdCBwbGF5ZXIgPSBtZXNoLFxuICAgIHBpdGNoT2JqZWN0ID0gbmV3IE9iamVjdDNEKCk7XG5cbiAgcGl0Y2hPYmplY3QuYWRkKGNhbWVyYS5uYXRpdmUpO1xuXG4gIGNvbnN0IHlhd09iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHlhd09iamVjdC5wb3NpdGlvbi55ID0gcGFyYW1zLnlwb3M7IC8vIGV5ZXMgYXJlIDIgbWV0ZXJzIGFib3ZlIHRoZSBncm91bmRcbiAgeWF3T2JqZWN0LmFkZChwaXRjaE9iamVjdCk7XG5cbiAgY29uc3QgcXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbiAgbGV0IGNhbkp1bXAgPSBmYWxzZSxcbiAgICAvLyBNb3Zlcy5cbiAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVMZWZ0ID0gZmFsc2UsXG4gICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG5cbiAgcGxheWVyLm9uKCdjb2xsaXNpb24nLCAob3RoZXJPYmplY3QsIHYsIHIsIGNvbnRhY3ROb3JtYWwpID0+IHtcbiAgICBjb25zb2xlLmxvZyhjb250YWN0Tm9ybWFsLnkpO1xuICAgIGlmIChjb250YWN0Tm9ybWFsLnkgPCAwLjUpIC8vIFVzZSBhIFwiZ29vZFwiIHRocmVzaG9sZCB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDEgaGVyZSFcbiAgICAgIGNhbkp1bXAgPSB0cnVlO1xuICB9KTtcblxuICBjb25zdCBvbk1vdXNlTW92ZSA9IGV2ZW50ID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgY29uc3QgbW92ZW1lbnRYID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRYIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRYID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFgoKSA6IDA7XG4gICAgY29uc3QgbW92ZW1lbnRZID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRZIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRZID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFkoKSA6IDA7XG5cbiAgICB5YXdPYmplY3Qucm90YXRpb24ueSAtPSBtb3ZlbWVudFggKiAwLjAwMjtcbiAgICBwaXRjaE9iamVjdC5yb3RhdGlvbi54IC09IG1vdmVtZW50WSAqIDAuMDAyO1xuXG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCA9IE1hdGgubWF4KC1QSV8yLCBNYXRoLm1pbihQSV8yLCBwaXRjaE9iamVjdC5yb3RhdGlvbi54KSk7XG4gIH07XG5cbiAgY29uc3QgcGh5c2ljcyA9IHBsYXllci51c2UoJ3BoeXNpY3MnKTtcblxuICBjb25zdCBvbktleURvd24gPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDMyOiAvLyBzcGFjZVxuICAgICAgICBjb25zb2xlLmxvZyhjYW5KdW1wKTtcbiAgICAgICAgaWYgKGNhbkp1bXAgPT09IHRydWUpIHBoeXNpY3MuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogMCwgeTogMzAwLCB6OiAwfSk7XG4gICAgICAgIGNhbkp1bXAgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY6IC8vIHNoaWZ0XG4gICAgICAgIHJ1blZlbG9jaXR5ID0gMC41O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgb25LZXlVcCA9IGV2ZW50ID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgIG1vdmVGb3J3YXJkID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBhXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuMjU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfTtcblxuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCBmYWxzZSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93biwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCwgZmFsc2UpO1xuXG4gIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICB0aGlzLmdldE9iamVjdCA9ICgpID0+IHlhd09iamVjdDtcblxuICB0aGlzLmdldERpcmVjdGlvbiA9IHRhcmdldFZlYyA9PiB7XG4gICAgdGFyZ2V0VmVjLnNldCgwLCAwLCAtMSk7XG4gICAgcXVhdC5tdWx0aXBseVZlY3RvcjModGFyZ2V0VmVjKTtcbiAgfTtcblxuICAvLyBNb3ZlcyB0aGUgY2FtZXJhIHRvIHRoZSBQaHlzaS5qcyBvYmplY3QgcG9zaXRpb25cbiAgLy8gYW5kIGFkZHMgdmVsb2NpdHkgdG8gdGhlIG9iamVjdCBpZiB0aGUgcnVuIGtleSBpcyBkb3duLlxuICBjb25zdCBpbnB1dFZlbG9jaXR5ID0gbmV3IFZlY3RvcjMoKSxcbiAgICBldWxlciA9IG5ldyBFdWxlcigpO1xuXG4gIHRoaXMudXBkYXRlID0gZGVsdGEgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBkZWx0YSA9IGRlbHRhIHx8IDAuNTtcbiAgICBkZWx0YSA9IE1hdGgubWluKGRlbHRhLCAwLjUsIGRlbHRhKTtcblxuICAgIGlucHV0VmVsb2NpdHkuc2V0KDAsIDAsIDApO1xuXG4gICAgY29uc3Qgc3BlZWQgPSB2ZWxvY2l0eUZhY3RvciAqIGRlbHRhICogcGFyYW1zLnNwZWVkICogcnVuVmVsb2NpdHk7XG5cbiAgICBpZiAobW92ZUZvcndhcmQpIGlucHV0VmVsb2NpdHkueiA9IC1zcGVlZDtcbiAgICBpZiAobW92ZUJhY2t3YXJkKSBpbnB1dFZlbG9jaXR5LnogPSBzcGVlZDtcbiAgICBpZiAobW92ZUxlZnQpIGlucHV0VmVsb2NpdHkueCA9IC1zcGVlZDtcbiAgICBpZiAobW92ZVJpZ2h0KSBpbnB1dFZlbG9jaXR5LnggPSBzcGVlZDtcblxuICAgIC8vIENvbnZlcnQgdmVsb2NpdHkgdG8gd29ybGQgY29vcmRpbmF0ZXNcbiAgICBldWxlci54ID0gcGl0Y2hPYmplY3Qucm90YXRpb24ueDtcbiAgICBldWxlci55ID0geWF3T2JqZWN0LnJvdGF0aW9uLnk7XG4gICAgZXVsZXIub3JkZXIgPSAnWFlaJztcblxuICAgIHF1YXQuc2V0RnJvbUV1bGVyKGV1bGVyKTtcblxuICAgIGlucHV0VmVsb2NpdHkuYXBwbHlRdWF0ZXJuaW9uKHF1YXQpO1xuXG4gICAgcGh5c2ljcy5hcHBseUNlbnRyYWxJbXB1bHNlKHt4OiBpbnB1dFZlbG9jaXR5LngsIHk6IDAsIHo6IGlucHV0VmVsb2NpdHkuen0pO1xuICAgIHBoeXNpY3Muc2V0QW5ndWxhclZlbG9jaXR5KHt4OiBpbnB1dFZlbG9jaXR5LnosIHk6IDAsIHo6IC1pbnB1dFZlbG9jaXR5Lnh9KTtcbiAgICBwaHlzaWNzLnNldEFuZ3VsYXJGYWN0b3Ioe3g6IDAsIHk6IDAsIHo6IDB9KTtcbiAgfTtcblxuICBwbGF5ZXIub24oJ3BoeXNpY3M6YWRkZWQnLCAoKSA9PiB7XG4gICAgcGxheWVyLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGUnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuICAgICAgeWF3T2JqZWN0LnBvc2l0aW9uLmNvcHkocGxheWVyLnBvc2l0aW9uKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBGaXJzdFBlcnNvbk1vZHVsZSB7XG4gIHN0YXRpYyBkZWZhdWx0cyA9IHtcbiAgICBibG9jazogbnVsbCxcbiAgICBzcGVlZDogMSxcbiAgICB5cG9zOiAxXG4gIH07XG5cbiAgY29uc3RydWN0b3Iob2JqZWN0LCBwYXJhbXMgPSB7fSkge1xuICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgaWYgKCF0aGlzLnBhcmFtcy5ibG9jaykge1xuICAgICAgdGhpcy5wYXJhbXMuYmxvY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmxvY2tlcicpO1xuICAgIH1cbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIHRoaXMuY29udHJvbHMgPSBuZXcgRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihtYW5hZ2VyLmdldCgnY2FtZXJhJyksIHRoaXMub2JqZWN0LCB0aGlzLnBhcmFtcyk7XG5cbiAgICBpZiAoJ3BvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICdtb3pQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnd2Via2l0UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBpZiAoZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQubW96UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQud2Via2l0UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignUG9pbnRlciBsb2NrIGVycm9yLicpO1xuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrID0gZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdFBvaW50ZXJMb2NrO1xuXG4gICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4gPSBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuO1xuXG4gICAgICAgIGlmICgvRmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICBjb25zdCBmdWxsc2NyZWVuY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuXG4gICAgICAgICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfSBlbHNlIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgY29uc29sZS53YXJuKCdZb3VyIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0aGUgUG9pbnRlckxvY2snKTtcblxuICAgIG1hbmFnZXIuZ2V0KCdzY2VuZScpLmFkZCh0aGlzLmNvbnRyb2xzLmdldE9iamVjdCgpKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgdXBkYXRlUHJvY2Vzc29yID0gYyA9PiB7XG4gICAgICBzZWxmLmNvbnRyb2xzLnVwZGF0ZShjLmdldERlbHRhKCkpO1xuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZUxvb3AgPSBuZXcgTG9vcCh1cGRhdGVQcm9jZXNzb3IpLnN0YXJ0KHRoaXMpO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTUVTU0FHRV9UWVBFUyIsIlJFUE9SVF9JVEVNU0laRSIsIkNPTExJU0lPTlJFUE9SVF9JVEVNU0laRSIsIlZFSElDTEVSRVBPUlRfSVRFTVNJWkUiLCJDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFIiwidGVtcDFWZWN0b3IzIiwiVmVjdG9yMyIsInRlbXAyVmVjdG9yMyIsInRlbXAxTWF0cml4NCIsIk1hdHJpeDQiLCJ0ZW1wMVF1YXQiLCJRdWF0ZXJuaW9uIiwiZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiIsIngiLCJ5IiwieiIsInciLCJNYXRoIiwiYXRhbjIiLCJhc2luIiwiZ2V0UXVhdGVydGlvbkZyb21FdWxlciIsImMxIiwiY29zIiwiczEiLCJzaW4iLCJjMiIsInMyIiwiYzMiLCJzMyIsImMxYzIiLCJzMXMyIiwiY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCIsInBvc2l0aW9uIiwib2JqZWN0IiwiaWRlbnRpdHkiLCJtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbiIsInF1YXRlcm5pb24iLCJnZXRJbnZlcnNlIiwiY29weSIsInN1YiIsImFwcGx5TWF0cml4NCIsImFkZE9iamVjdENoaWxkcmVuIiwicGFyZW50IiwiaSIsImNoaWxkcmVuIiwibGVuZ3RoIiwiY2hpbGQiLCJwaHlzaWNzIiwiY29tcG9uZW50IiwidXNlIiwiZGF0YSIsInVwZGF0ZU1hdHJpeCIsInVwZGF0ZU1hdHJpeFdvcmxkIiwic2V0RnJvbU1hdHJpeFBvc2l0aW9uIiwibWF0cml4V29ybGQiLCJzZXRGcm9tUm90YXRpb25NYXRyaXgiLCJwb3NpdGlvbl9vZmZzZXQiLCJyb3RhdGlvbiIsInB1c2giLCJFdmVudGFibGUiLCJfZXZlbnRMaXN0ZW5lcnMiLCJldmVudF9uYW1lIiwiY2FsbGJhY2siLCJoYXNPd25Qcm9wZXJ0eSIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInBhcmFtZXRlcnMiLCJBcnJheSIsInByb3RvdHlwZSIsImNhbGwiLCJhcmd1bWVudHMiLCJhcHBseSIsIm9iaiIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZGlzcGF0Y2hFdmVudCIsIkNvbmVUd2lzdENvbnN0cmFpbnQiLCJvYmphIiwib2JqYiIsIm9iamVjdGEiLCJvYmplY3RiIiwidW5kZWZpbmVkIiwiY29uc29sZSIsImVycm9yIiwidHlwZSIsImFwcGxpZWRJbXB1bHNlIiwid29ybGRNb2R1bGUiLCJpZCIsInBvc2l0aW9uYSIsImNsb25lIiwicG9zaXRpb25iIiwiYXhpc2EiLCJheGlzYiIsImV4ZWN1dGUiLCJjb25zdHJhaW50IiwibWF4X2ltcHVsc2UiLCJ0YXJnZXQiLCJUSFJFRSIsInNldEZyb21FdWxlciIsIkV1bGVyIiwiSGluZ2VDb25zdHJhaW50IiwiYXhpcyIsImxvdyIsImhpZ2giLCJiaWFzX2ZhY3RvciIsInJlbGF4YXRpb25fZmFjdG9yIiwidmVsb2NpdHkiLCJhY2NlbGVyYXRpb24iLCJQb2ludENvbnN0cmFpbnQiLCJTbGlkZXJDb25zdHJhaW50IiwibGluX2xvd2VyIiwibGluX3VwcGVyIiwiYW5nX2xvd2VyIiwiYW5nX3VwcGVyIiwibGluZWFyIiwiYW5ndWxhciIsInNjZW5lIiwiRE9GQ29uc3RyYWludCIsImxpbWl0Iiwid2hpY2giLCJsb3dfYW5nbGUiLCJoaWdoX2FuZ2xlIiwibWF4X2ZvcmNlIiwiVmVoaWNsZSIsIm1lc2giLCJ0dW5pbmciLCJWZWhpY2xlVHVuaW5nIiwid2hlZWxzIiwiX3BoeXNpanMiLCJnZXRPYmplY3RJZCIsInN1c3BlbnNpb25fc3RpZmZuZXNzIiwic3VzcGVuc2lvbl9jb21wcmVzc2lvbiIsInN1c3BlbnNpb25fZGFtcGluZyIsIm1heF9zdXNwZW5zaW9uX3RyYXZlbCIsImZyaWN0aW9uX3NsaXAiLCJtYXhfc3VzcGVuc2lvbl9mb3JjZSIsIndoZWVsX2dlb21ldHJ5Iiwid2hlZWxfbWF0ZXJpYWwiLCJjb25uZWN0aW9uX3BvaW50Iiwid2hlZWxfZGlyZWN0aW9uIiwid2hlZWxfYXhsZSIsInN1c3BlbnNpb25fcmVzdF9sZW5ndGgiLCJ3aGVlbF9yYWRpdXMiLCJpc19mcm9udF93aGVlbCIsIndoZWVsIiwiTWVzaCIsImNhc3RTaGFkb3ciLCJyZWNlaXZlU2hhZG93IiwibXVsdGlwbHlTY2FsYXIiLCJhZGQiLCJ3b3JsZCIsImFtb3VudCIsInN0ZWVyaW5nIiwiYnJha2UiLCJmb3JjZSIsIlRBUkdFVCIsIlN5bWJvbCIsIlNDUklQVF9UWVBFIiwiQmxvYkJ1aWxkZXIiLCJ3aW5kb3ciLCJXZWJLaXRCbG9iQnVpbGRlciIsIk1vekJsb2JCdWlsZGVyIiwiTVNCbG9iQnVpbGRlciIsIlVSTCIsIndlYmtpdFVSTCIsIldvcmtlciIsInNoaW1Xb3JrZXIiLCJmaWxlbmFtZSIsImZuIiwiU2hpbVdvcmtlciIsImZvcmNlRmFsbGJhY2siLCJvIiwic291cmNlIiwidG9TdHJpbmciLCJyZXBsYWNlIiwic2xpY2UiLCJvYmpVUkwiLCJjcmVhdGVTb3VyY2VPYmplY3QiLCJyZXZva2VPYmplY3RVUkwiLCJzZWxmU2hpbSIsIm0iLCJvbm1lc3NhZ2UiLCJwb3N0TWVzc2FnZSIsImlzVGhpc1RocmVhZCIsInRlc3RXb3JrZXIiLCJ0ZXN0QXJyYXkiLCJVaW50OEFycmF5IiwidGVzdCIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIkVycm9yIiwiYnVmZmVyIiwiZSIsInRlcm1pbmF0ZSIsInN0ciIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJibG9iIiwiYXBwZW5kIiwiZ2V0QmxvYiIsImRvY3VtZW50Iiwic2VsZiIsInRyYW5zZmVyYWJsZU1lc3NhZ2UiLCJ3ZWJraXRQb3N0TWVzc2FnZSIsIl9vYmplY3QiLCJfdmVjdG9yIiwiX3RyYW5zZm9ybSIsIl90cmFuc2Zvcm1fcG9zIiwiX3NvZnRib2R5X2VuYWJsZWQiLCJsYXN0X3NpbXVsYXRpb25fZHVyYXRpb24iLCJfbnVtX29iamVjdHMiLCJfbnVtX3JpZ2lkYm9keV9vYmplY3RzIiwiX251bV9zb2Z0Ym9keV9vYmplY3RzIiwiX251bV93aGVlbHMiLCJfbnVtX2NvbnN0cmFpbnRzIiwiX3NvZnRib2R5X3JlcG9ydF9zaXplIiwiX3ZlYzNfMSIsIl92ZWMzXzIiLCJfdmVjM18zIiwiX3F1YXQiLCJwdWJsaWNfZnVuY3Rpb25zIiwiX29iamVjdHMiLCJfdmVoaWNsZXMiLCJfY29uc3RyYWludHMiLCJfb2JqZWN0c19hbW1vIiwiX29iamVjdF9zaGFwZXMiLCJSRVBPUlRfQ0hVTktTSVpFIiwic29mdHJlcG9ydCIsImNvbGxpc2lvbnJlcG9ydCIsInZlaGljbGVyZXBvcnQiLCJjb25zdHJhaW50cmVwb3J0IiwiV09STERSRVBPUlRfSVRFTVNJWkUiLCJhYiIsIkFycmF5QnVmZmVyIiwiU1VQUE9SVF9UUkFOU0ZFUkFCTEUiLCJieXRlTGVuZ3RoIiwiZ2V0U2hhcGVGcm9tQ2FjaGUiLCJjYWNoZV9rZXkiLCJzZXRTaGFwZUNhY2hlIiwic2hhcGUiLCJjcmVhdGVTaGFwZSIsImRlc2NyaXB0aW9uIiwic2V0SWRlbnRpdHkiLCJBbW1vIiwiYnRDb21wb3VuZFNoYXBlIiwibm9ybWFsIiwic2V0WCIsInNldFkiLCJzZXRaIiwiYnRTdGF0aWNQbGFuZVNoYXBlIiwid2lkdGgiLCJoZWlnaHQiLCJkZXB0aCIsImJ0Qm94U2hhcGUiLCJyYWRpdXMiLCJidFNwaGVyZVNoYXBlIiwiYnRDeWxpbmRlclNoYXBlIiwiYnRDYXBzdWxlU2hhcGUiLCJidENvbmVTaGFwZSIsInRyaWFuZ2xlX21lc2giLCJidFRyaWFuZ2xlTWVzaCIsImFkZFRyaWFuZ2xlIiwiYnRCdmhUcmlhbmdsZU1lc2hTaGFwZSIsImJ0Q29udmV4SHVsbFNoYXBlIiwiYWRkUG9pbnQiLCJ4cHRzIiwieXB0cyIsInBvaW50cyIsInB0ciIsIl9tYWxsb2MiLCJwIiwicDIiLCJqIiwiSEVBUEYzMiIsImJ0SGVpZ2h0ZmllbGRUZXJyYWluU2hhcGUiLCJhYnNNYXhIZWlnaHQiLCJjcmVhdGVTb2Z0Qm9keSIsImJvZHkiLCJzb2Z0Qm9keUhlbHBlcnMiLCJidFNvZnRCb2R5SGVscGVycyIsImFWZXJ0aWNlcyIsIkNyZWF0ZUZyb21UcmlNZXNoIiwiZ2V0V29ybGRJbmZvIiwiYUluZGljZXMiLCJjciIsImNvcm5lcnMiLCJDcmVhdGVQYXRjaCIsImJ0VmVjdG9yMyIsInNlZ21lbnRzIiwiQ3JlYXRlUm9wZSIsImluaXQiLCJwYXJhbXMiLCJ3YXNtQnVmZmVyIiwiYW1tbyIsImxvYWRBbW1vRnJvbUJpbmFyeSIsImNtZCIsIm1ha2VXb3JsZCIsImJ0VHJhbnNmb3JtIiwiYnRRdWF0ZXJuaW9uIiwicmVwb3J0c2l6ZSIsIkZsb2F0MzJBcnJheSIsIldPUkxEUkVQT1JUIiwiQ09MTElTSU9OUkVQT1JUIiwiVkVISUNMRVJFUE9SVCIsIkNPTlNUUkFJTlRSRVBPUlQiLCJjb2xsaXNpb25Db25maWd1cmF0aW9uIiwic29mdGJvZHkiLCJidFNvZnRCb2R5UmlnaWRCb2R5Q29sbGlzaW9uQ29uZmlndXJhdGlvbiIsImJ0RGVmYXVsdENvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJkaXNwYXRjaGVyIiwiYnRDb2xsaXNpb25EaXNwYXRjaGVyIiwic29sdmVyIiwiYnRTZXF1ZW50aWFsSW1wdWxzZUNvbnN0cmFpbnRTb2x2ZXIiLCJicm9hZHBoYXNlIiwiYWFiYm1pbiIsImFhYmJtYXgiLCJidEF4aXNTd2VlcDMiLCJidERidnRCcm9hZHBoYXNlIiwiYnRTb2Z0UmlnaWREeW5hbWljc1dvcmxkIiwiYnREZWZhdWx0U29mdEJvZHlTb2x2ZXIiLCJidERpc2NyZXRlRHluYW1pY3NXb3JsZCIsImZpeGVkVGltZVN0ZXAiLCJzZXRGaXhlZFRpbWVTdGVwIiwic2V0R3Jhdml0eSIsImFwcGVuZEFuY2hvciIsImxvZyIsIm5vZGUiLCJvYmoyIiwiY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyIsImluZmx1ZW5jZSIsImFkZE9iamVjdCIsIm1vdGlvblN0YXRlIiwic2JDb25maWciLCJnZXRfbV9jZmciLCJ2aXRlcmF0aW9ucyIsInNldF92aXRlcmF0aW9ucyIsInBpdGVyYXRpb25zIiwic2V0X3BpdGVyYXRpb25zIiwiZGl0ZXJhdGlvbnMiLCJzZXRfZGl0ZXJhdGlvbnMiLCJjaXRlcmF0aW9ucyIsInNldF9jaXRlcmF0aW9ucyIsInNldF9jb2xsaXNpb25zIiwic2V0X2tERiIsImZyaWN0aW9uIiwic2V0X2tEUCIsImRhbXBpbmciLCJwcmVzc3VyZSIsInNldF9rUFIiLCJkcmFnIiwic2V0X2tERyIsImxpZnQiLCJzZXRfa0xGIiwiYW5jaG9ySGFyZG5lc3MiLCJzZXRfa0FIUiIsInJpZ2lkSGFyZG5lc3MiLCJzZXRfa0NIUiIsImtsc3QiLCJnZXRfbV9tYXRlcmlhbHMiLCJhdCIsInNldF9tX2tMU1QiLCJrYXN0Iiwic2V0X21fa0FTVCIsImt2c3QiLCJzZXRfbV9rVlNUIiwiY2FzdE9iamVjdCIsImJ0Q29sbGlzaW9uT2JqZWN0IiwiZ2V0Q29sbGlzaW9uU2hhcGUiLCJzZXRNYXJnaW4iLCJtYXJnaW4iLCJzZXRBY3RpdmF0aW9uU3RhdGUiLCJzdGF0ZSIsInJvcGUiLCJjbG90aCIsInNldE9yaWdpbiIsInNldFciLCJzZXRSb3RhdGlvbiIsInRyYW5zZm9ybSIsInNjYWxlIiwic2V0VG90YWxNYXNzIiwibWFzcyIsImFkZFNvZnRCb2R5IiwiZ2V0X21fZmFjZXMiLCJzaXplIiwiZ2V0X21fbm9kZXMiLCJjb21wb3VuZF9zaGFwZSIsImFkZENoaWxkU2hhcGUiLCJfY2hpbGQiLCJ0cmFucyIsImRlc3Ryb3kiLCJzZXRMb2NhbFNjYWxpbmciLCJjYWxjdWxhdGVMb2NhbEluZXJ0aWEiLCJidERlZmF1bHRNb3Rpb25TdGF0ZSIsInJiSW5mbyIsImJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyIsInNldF9tX2ZyaWN0aW9uIiwic2V0X21fcmVzdGl0dXRpb24iLCJyZXN0aXR1dGlvbiIsInNldF9tX2xpbmVhckRhbXBpbmciLCJzZXRfbV9hbmd1bGFyRGFtcGluZyIsImJ0UmlnaWRCb2R5IiwiY29sbGlzaW9uX2ZsYWdzIiwic2V0Q29sbGlzaW9uRmxhZ3MiLCJncm91cCIsIm1hc2siLCJhZGRSaWdpZEJvZHkiLCJhY3RpdmF0ZSIsImEiLCJhZGRWZWhpY2xlIiwidmVoaWNsZV90dW5pbmciLCJidFZlaGljbGVUdW5pbmciLCJzZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzIiwic2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uIiwic2V0X21fc3VzcGVuc2lvbkRhbXBpbmciLCJzZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20iLCJzZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UiLCJ2ZWhpY2xlIiwiYnRSYXljYXN0VmVoaWNsZSIsInJpZ2lkQm9keSIsImJ0RGVmYXVsdFZlaGljbGVSYXljYXN0ZXIiLCJzZXRDb29yZGluYXRlU3lzdGVtIiwicmVtb3ZlVmVoaWNsZSIsImFkZFdoZWVsIiwic2V0U3RlZXJpbmciLCJkZXRhaWxzIiwic2V0U3RlZXJpbmdWYWx1ZSIsInNldEJyYWtlIiwiYXBwbHlFbmdpbmVGb3JjZSIsInJlbW92ZU9iamVjdCIsInJlbW92ZVNvZnRCb2R5IiwicmVtb3ZlUmlnaWRCb2R5IiwiX21vdGlvbl9zdGF0ZXMiLCJfY29tcG91bmRfc2hhcGVzIiwiX25vbmNhY2hlZF9zaGFwZXMiLCJ1cGRhdGVUcmFuc2Zvcm0iLCJnZXRNb3Rpb25TdGF0ZSIsImdldFdvcmxkVHJhbnNmb3JtIiwicG9zIiwicXVhdCIsInNldFdvcmxkVHJhbnNmb3JtIiwidXBkYXRlTWFzcyIsInNldE1hc3NQcm9wcyIsImFwcGx5Q2VudHJhbEltcHVsc2UiLCJhcHBseUltcHVsc2UiLCJpbXB1bHNlX3giLCJpbXB1bHNlX3kiLCJpbXB1bHNlX3oiLCJhcHBseVRvcnF1ZSIsInRvcnF1ZV94IiwidG9ycXVlX3kiLCJ0b3JxdWVfeiIsImFwcGx5Q2VudHJhbEZvcmNlIiwiYXBwbHlGb3JjZSIsImZvcmNlX3giLCJmb3JjZV95IiwiZm9yY2VfeiIsIm9uU2ltdWxhdGlvblJlc3VtZSIsIkRhdGUiLCJub3ciLCJzZXRBbmd1bGFyVmVsb2NpdHkiLCJzZXRMaW5lYXJWZWxvY2l0eSIsInNldEFuZ3VsYXJGYWN0b3IiLCJzZXRMaW5lYXJGYWN0b3IiLCJzZXREYW1waW5nIiwic2V0Q2NkTW90aW9uVGhyZXNob2xkIiwidGhyZXNob2xkIiwic2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMiLCJhZGRDb25zdHJhaW50IiwiYnRQb2ludDJQb2ludENvbnN0cmFpbnQiLCJidEhpbmdlQ29uc3RyYWludCIsInRyYW5zZm9ybWIiLCJ0cmFuc2Zvcm1hIiwiZ2V0Um90YXRpb24iLCJzZXRFdWxlciIsImJ0U2xpZGVyQ29uc3RyYWludCIsInRhIiwidGIiLCJzZXRFdWxlclpZWCIsImJ0Q29uZVR3aXN0Q29uc3RyYWludCIsInNldExpbWl0IiwiUEkiLCJidEdlbmVyaWM2RG9mQ29uc3RyYWludCIsImIiLCJlbmFibGVGZWVkYmFjayIsInJlbW92ZUNvbnN0cmFpbnQiLCJjb25zdHJhaW50X3NldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCIsInVuZGVmaW5kIiwic2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwic2ltdWxhdGUiLCJ0aW1lU3RlcCIsIm1heFN1YlN0ZXBzIiwiY2VpbCIsInN0ZXBTaW11bGF0aW9uIiwicmVwb3J0VmVoaWNsZXMiLCJyZXBvcnRDb25zdHJhaW50cyIsInJlcG9ydFdvcmxkX3NvZnRib2RpZXMiLCJoaW5nZV9zZXRMaW1pdHMiLCJoaW5nZV9lbmFibGVBbmd1bGFyTW90b3IiLCJlbmFibGVBbmd1bGFyTW90b3IiLCJoaW5nZV9kaXNhYmxlTW90b3IiLCJlbmFibGVNb3RvciIsInNsaWRlcl9zZXRMaW1pdHMiLCJzZXRMb3dlckxpbkxpbWl0Iiwic2V0VXBwZXJMaW5MaW1pdCIsInNldExvd2VyQW5nTGltaXQiLCJzZXRVcHBlckFuZ0xpbWl0Iiwic2xpZGVyX3NldFJlc3RpdHV0aW9uIiwic2V0U29mdG5lc3NMaW1MaW4iLCJzZXRTb2Z0bmVzc0xpbUFuZyIsInNsaWRlcl9lbmFibGVMaW5lYXJNb3RvciIsInNldFRhcmdldExpbk1vdG9yVmVsb2NpdHkiLCJzZXRNYXhMaW5Nb3RvckZvcmNlIiwic2V0UG93ZXJlZExpbk1vdG9yIiwic2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvciIsInNsaWRlcl9lbmFibGVBbmd1bGFyTW90b3IiLCJzZXRUYXJnZXRBbmdNb3RvclZlbG9jaXR5Iiwic2V0TWF4QW5nTW90b3JGb3JjZSIsInNldFBvd2VyZWRBbmdNb3RvciIsInNsaWRlcl9kaXNhYmxlQW5ndWxhck1vdG9yIiwiY29uZXR3aXN0X3NldExpbWl0IiwiY29uZXR3aXN0X2VuYWJsZU1vdG9yIiwiY29uZXR3aXN0X3NldE1heE1vdG9ySW1wdWxzZSIsInNldE1heE1vdG9ySW1wdWxzZSIsImNvbmV0d2lzdF9zZXRNb3RvclRhcmdldCIsInNldE1vdG9yVGFyZ2V0IiwiY29uZXR3aXN0X2Rpc2FibGVNb3RvciIsImRvZl9zZXRMaW5lYXJMb3dlckxpbWl0Iiwic2V0TGluZWFyTG93ZXJMaW1pdCIsImRvZl9zZXRMaW5lYXJVcHBlckxpbWl0Iiwic2V0TGluZWFyVXBwZXJMaW1pdCIsImRvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCIsInNldEFuZ3VsYXJMb3dlckxpbWl0IiwiZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0Iiwic2V0QW5ndWxhclVwcGVyTGltaXQiLCJkb2ZfZW5hYmxlQW5ndWxhck1vdG9yIiwibW90b3IiLCJnZXRSb3RhdGlvbmFsTGltaXRNb3RvciIsInNldF9tX2VuYWJsZU1vdG9yIiwiZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvciIsInNldF9tX2xvTGltaXQiLCJzZXRfbV9oaUxpbWl0Iiwic2V0X21fdGFyZ2V0VmVsb2NpdHkiLCJzZXRfbV9tYXhNb3RvckZvcmNlIiwiZG9mX2Rpc2FibGVBbmd1bGFyTW90b3IiLCJyZXBvcnRXb3JsZCIsIndvcmxkcmVwb3J0IiwiZ2V0Q2VudGVyT2ZNYXNzVHJhbnNmb3JtIiwib3JpZ2luIiwiZ2V0T3JpZ2luIiwib2Zmc2V0IiwiZ2V0TGluZWFyVmVsb2NpdHkiLCJnZXRBbmd1bGFyVmVsb2NpdHkiLCJTT0ZUUkVQT1JUIiwib2Zmc2V0VmVydCIsIm5vZGVzIiwidmVydCIsImdldF9tX3giLCJvZmYiLCJnZXRfbV9uIiwiZmFjZXMiLCJmYWNlIiwibm9kZTEiLCJub2RlMiIsIm5vZGUzIiwidmVydDEiLCJ2ZXJ0MiIsInZlcnQzIiwibm9ybWFsMSIsIm5vcm1hbDIiLCJub3JtYWwzIiwicmVwb3J0Q29sbGlzaW9ucyIsImRwIiwiZ2V0RGlzcGF0Y2hlciIsIm51bSIsImdldE51bU1hbmlmb2xkcyIsIm1hbmlmb2xkIiwiZ2V0TWFuaWZvbGRCeUluZGV4SW50ZXJuYWwiLCJudW1fY29udGFjdHMiLCJnZXROdW1Db250YWN0cyIsInB0IiwiZ2V0Q29udGFjdFBvaW50IiwiZ2V0Qm9keTAiLCJnZXRCb2R5MSIsImdldF9tX25vcm1hbFdvcmxkT25CIiwiZ2V0TnVtV2hlZWxzIiwiZ2V0V2hlZWxJbmZvIiwiZ2V0X21fd29ybGRUcmFuc2Zvcm0iLCJsZW5naHQiLCJvZmZzZXRfYm9keSIsImdldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCIsImV2ZW50IiwiV29ybGRNb2R1bGUiLCJicmlkZ2UiLCJkZWZlciIsIm9uQWRkQ2FsbGJhY2siLCJiaW5kIiwib25SZW1vdmVDYWxsYmFjayIsIk9iamVjdCIsImFzc2lnbiIsInN0YXJ0IiwicGVyZm9ybWFuY2UiLCJ3b3JrZXIiLCJQaHlzaWNzV29ya2VyIiwiaXNMb2FkZWQiLCJsb2FkZXIiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIndhc20iLCJ0aGVuIiwicmVzcG9uc2UiLCJhcnJheUJ1ZmZlciIsIl9tYXRlcmlhbHNfcmVmX2NvdW50cyIsIl9pc19zaW11bGF0aW5nIiwiX2lkIiwiX3RlbXAiLCJ1cGRhdGVTY2VuZSIsInVwZGF0ZVNvZnRib2RpZXMiLCJ1cGRhdGVDb2xsaXNpb25zIiwidXBkYXRlVmVoaWNsZXMiLCJ1cGRhdGVDb25zdHJhaW50cyIsImRlYnVnIiwiZGlyIiwiaW5mbyIsIl9fZGlydHlQb3NpdGlvbiIsInNldCIsIl9fZGlydHlSb3RhdGlvbiIsImxpbmVhclZlbG9jaXR5IiwiYW5ndWxhclZlbG9jaXR5IiwiYXR0cmlidXRlcyIsImdlb21ldHJ5Iiwidm9sdW1lUG9zaXRpb25zIiwiYXJyYXkiLCJpc1NvZnRCb2R5UmVzZXQiLCJ2b2x1bWVOb3JtYWxzIiwib2ZmcyIsIngxIiwieTEiLCJ6MSIsIm54MSIsIm55MSIsIm56MSIsIngyIiwieTIiLCJ6MiIsIm54MiIsIm55MiIsIm56MiIsIngzIiwieTMiLCJ6MyIsIm54MyIsIm55MyIsIm56MyIsImk5IiwibmVlZHNVcGRhdGUiLCJueCIsIm55IiwibnoiLCJleHRyYWN0Um90YXRpb24iLCJtYXRyaXgiLCJhZGRWZWN0b3JzIiwiY29sbGlzaW9ucyIsIm5vcm1hbF9vZmZzZXRzIiwib2JqZWN0MiIsImlkMSIsInRvdWNoZXMiLCJpZDIiLCJjb21wb25lbnQyIiwiZGF0YTIiLCJ2ZWwiLCJ2ZWwyIiwic3ViVmVjdG9ycyIsInRlbXAxIiwidGVtcDIiLCJub3JtYWxfb2Zmc2V0IiwiZW1pdCIsInNob3dfbWFya2VyIiwiZ2V0RGVmaW5pdGlvbiIsIm1hcmtlciIsIlNwaGVyZUdlb21ldHJ5IiwiTWVzaE5vcm1hbE1hdGVyaWFsIiwiQm94R2VvbWV0cnkiLCJuYXRpdmUiLCJtYW5hZ2VyIiwicmVtb3ZlIiwicG9wIiwibWF0ZXJpYWwiLCJmdW5jIiwiYXJncyIsImdyYXZpdHkiLCJfc3RhdHMiLCJiZWdpbiIsIm9iamVjdF9pZCIsInVwZGF0ZSIsImlzU29mdGJvZHkiLCJlbmQiLCJzaW11bGF0ZUxvb3AiLCJMb29wIiwiY2xvY2siLCJnZXREZWx0YSIsInByb3BlcnRpZXMiLCJfbmF0aXZlIiwidmVjdG9yMyIsInNjb3BlIiwiZGVmaW5lUHJvcGVydGllcyIsIl94IiwiX3kiLCJfeiIsIl9fY19yb3QiLCJvbkNoYW5nZSIsImV1bGVyIiwicm90Iiwid3JhcFBoeXNpY3NQcm90b3R5cGUiLCJrZXkiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsIm9uQ29weSIsInNvdXJjZVBoeXNpY3MiLCJtb2R1bGVzIiwib25XcmFwIiwiQVBJIiwiZmFjdG9yIiwiZGVmYXVsdHMiLCJkZWZpbmUiLCJoYXMiLCJtb2R1bGUiLCJyZXN1bHQiLCJjb25zdHJ1Y3RvciIsInJpZ2lkYm9keSIsIkJveE1vZHVsZSIsIlBoeXNpY3NNb2R1bGUiLCJ1cGRhdGVEYXRhIiwiYm91bmRpbmdCb3giLCJjb21wdXRlQm91bmRpbmdCb3giLCJtYXgiLCJtaW4iLCJDb21wb3VuZE1vZHVsZSIsIkNhcHN1bGVNb2R1bGUiLCJDb25jYXZlTW9kdWxlIiwiZ2VvbWV0cnlQcm9jZXNzb3IiLCJpc0J1ZmZlckdlb21ldHJ5IiwidmVydGljZXMiLCJ2QSIsInZCIiwidkMiLCJjIiwiQ29uZU1vZHVsZSIsIkNvbnZleE1vZHVsZSIsIl9idWZmZXJHZW9tZXRyeSIsIkJ1ZmZlckdlb21ldHJ5IiwiZnJvbUdlb21ldHJ5IiwiQ3lsaW5kZXJNb2R1bGUiLCJIZWlnaHRmaWVsZE1vZHVsZSIsIlZlY3RvcjIiLCJ4ZGl2IiwieWRpdiIsInZlcnRzIiwieHNpemUiLCJ5c2l6ZSIsInNxcnQiLCJhYnMiLCJ2TnVtIiwicm91bmQiLCJtdWx0aXBseSIsImF1dG9BbGlnbiIsInRyYW5zbGF0ZSIsIlBsYW5lTW9kdWxlIiwiU3BoZXJlTW9kdWxlIiwiYm91bmRpbmdTcGhlcmUiLCJjb21wdXRlQm91bmRpbmdTcGhlcmUiLCJTb2Z0Ym9keU1vZHVsZSIsImlkeEdlb21ldHJ5IiwibWVyZ2VWZXJ0aWNlcyIsImJ1ZmZlckdlb21ldHJ5IiwiYWRkQXR0cmlidXRlIiwiQnVmZmVyQXR0cmlidXRlIiwiY29weVZlY3RvcjNzQXJyYXkiLCJzZXRJbmRleCIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJjb3B5SW5kaWNlc0FycmF5IiwibzEiLCJvMiIsIkNsb3RoTW9kdWxlIiwiZ2VvbVBhcmFtcyIsImdlb20iLCJmYWNlc0xlbmd0aCIsIm5vcm1hbHNBcnJheSIsImkzIiwid2lkdGhTZWdtZW50cyIsImhlaWdodFNlZ21lbnRzIiwiaWR4MDAiLCJpZHgwMSIsImlkeDEwIiwiaWR4MTEiLCJSb3BlTW9kdWxlIiwiYnVmZiIsImZyb21BcnJheSIsIm4iLCJ2MSIsInYyIiwiUElfMiIsIkZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIiLCJjYW1lcmEiLCJ2ZWxvY2l0eUZhY3RvciIsInJ1blZlbG9jaXR5IiwicGxheWVyIiwicGl0Y2hPYmplY3QiLCJPYmplY3QzRCIsInlhd09iamVjdCIsInlwb3MiLCJjYW5KdW1wIiwibW92ZUJhY2t3YXJkIiwibW92ZUxlZnQiLCJtb3ZlUmlnaHQiLCJvbiIsIm90aGVyT2JqZWN0IiwidiIsInIiLCJjb250YWN0Tm9ybWFsIiwib25Nb3VzZU1vdmUiLCJlbmFibGVkIiwibW92ZW1lbnRYIiwibW96TW92ZW1lbnRYIiwiZ2V0TW92ZW1lbnRYIiwibW92ZW1lbnRZIiwibW96TW92ZW1lbnRZIiwiZ2V0TW92ZW1lbnRZIiwib25LZXlEb3duIiwia2V5Q29kZSIsIm9uS2V5VXAiLCJnZXRPYmplY3QiLCJnZXREaXJlY3Rpb24iLCJtdWx0aXBseVZlY3RvcjMiLCJ0YXJnZXRWZWMiLCJpbnB1dFZlbG9jaXR5IiwiZGVsdGEiLCJzcGVlZCIsIm1vdmVGb3J3YXJkIiwib3JkZXIiLCJhcHBseVF1YXRlcm5pb24iLCJGaXJzdFBlcnNvbk1vZHVsZSIsImJsb2NrIiwiZ2V0RWxlbWVudEJ5SWQiLCJjb250cm9scyIsImVsZW1lbnQiLCJwb2ludGVybG9ja2NoYW5nZSIsInBvaW50ZXJMb2NrRWxlbWVudCIsIm1velBvaW50ZXJMb2NrRWxlbWVudCIsIndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCIsInN0eWxlIiwiZGlzcGxheSIsInBvaW50ZXJsb2NrZXJyb3IiLCJ3YXJuIiwicXVlcnlTZWxlY3RvciIsInJlcXVlc3RQb2ludGVyTG9jayIsIm1velJlcXVlc3RQb2ludGVyTG9jayIsIndlYmtpdFJlcXVlc3RQb2ludGVyTG9jayIsInJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxzY3JlZW4iLCJtb3pSZXF1ZXN0RnVsbFNjcmVlbiIsIndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIiwiZnVsbHNjcmVlbmNoYW5nZSIsImZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsInVwZGF0ZVByb2Nlc3NvciIsInVwZGF0ZUxvb3AiXSwibWFwcGluZ3MiOiI7Ozs7QUFNQSxJQUFNQSxnQkFBZ0I7ZUFDUCxDQURPO21CQUVILENBRkc7aUJBR0wsQ0FISztvQkFJRixDQUpFO2NBS1I7Q0FMZDs7QUFRQSxJQUFNQyxrQkFBa0IsRUFBeEI7SUFDRUMsMkJBQTJCLENBRDdCO0lBRUVDLHlCQUF5QixDQUYzQjtJQUdFQyw0QkFBNEIsQ0FIOUI7O0FBS0EsSUFBTUMsZUFBZSxJQUFJQyxTQUFKLEVBQXJCO0lBQ0VDLGVBQWUsSUFBSUQsU0FBSixFQURqQjtJQUVFRSxlQUFlLElBQUlDLE9BQUosRUFGakI7SUFHRUMsWUFBWSxJQUFJQyxVQUFKLEVBSGQ7O0FBS0EsSUFBTUMsNEJBQTRCLFNBQTVCQSx5QkFBNEIsQ0FBQ0MsQ0FBRCxFQUFJQyxDQUFKLEVBQU9DLENBQVAsRUFBVUMsQ0FBVixFQUFnQjtTQUN6QyxJQUFJVixTQUFKLENBQ0xXLEtBQUtDLEtBQUwsQ0FBVyxLQUFLTCxJQUFJRyxDQUFKLEdBQVFGLElBQUlDLENBQWpCLENBQVgsRUFBaUNDLElBQUlBLENBQUosR0FBUUgsSUFBSUEsQ0FBWixHQUFnQkMsSUFBSUEsQ0FBcEIsR0FBd0JDLElBQUlBLENBQTdELENBREssRUFFTEUsS0FBS0UsSUFBTCxDQUFVLEtBQUtOLElBQUlFLENBQUosR0FBUUQsSUFBSUUsQ0FBakIsQ0FBVixDQUZLLEVBR0xDLEtBQUtDLEtBQUwsQ0FBVyxLQUFLSCxJQUFJQyxDQUFKLEdBQVFILElBQUlDLENBQWpCLENBQVgsRUFBaUNFLElBQUlBLENBQUosR0FBUUgsSUFBSUEsQ0FBWixHQUFnQkMsSUFBSUEsQ0FBcEIsR0FBd0JDLElBQUlBLENBQTdELENBSEssQ0FBUDtDQURGOztBQVFBLElBQU1LLHlCQUF5QixTQUF6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
