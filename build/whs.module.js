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
      gravity: new Vector3(0, -100, 0)
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
      scale: new Vector3(1, 1, 1),
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
      scale: new Vector3(1, 1, 1),
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
      scale: new Vector3(1, 1, 1)
    }, params);
  }

  createClass(SphereModule, [{
    key: 'integrate',
    value: function integrate(self) {
      var params = self.params;

      this._physijs = {
        type: 'sphere',
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
  return SphereModule;
}();

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

      self.updateLoop = new Loop(updateProcessor).start(this);
    }
  }]);
  return FirstPersonModule;
}(), _class.defaults = {
  block: null,
  speed: 1,
  ypos: 1
}, _temp);

export { getEulerXYZFromQuaternion, getQuatertionFromEuler, convertWorldPositionToObject, addObjectChildren, MESSAGE_TYPES, REPORT_ITEMSIZE, COLLISIONREPORT_ITEMSIZE, VEHICLEREPORT_ITEMSIZE, CONSTRAINTREPORT_ITEMSIZE, temp1Vector3, temp2Vector3, temp1Matrix4, temp1Quat, Eventable, ConeTwistConstraint, HingeConstraint, PointConstraint, SliderConstraint, DOFConstraint, WorldModule, BoxModule, CompoundModule, CapsuleModule, ConcaveModule, ConeModule, ConvexModule, CylinderModule, HeightfieldModule, PlaneModule, SphereModule, SoftbodyModule, ClothModule, RopeModule, FirstPersonModule };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2hzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2FwaS5qcyIsIi4uL3NyYy9ldmVudGFibGUuanMiLCIuLi9zcmMvY29uc3RyYWludHMvQ29uZVR3aXN0Q29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9IaW5nZUNvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvUG9pbnRDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL1NsaWRlckNvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvRE9GQ29uc3RyYWludC5qcyIsIi4uL3NyYy92ZWhpY2xlL3ZlaGljbGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Xb3JsZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL3BoeXNpY3NQcm90b3R5cGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Cb3hNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db21wb3VuZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NhcHN1bGVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db25jYXZlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29uZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbnZleE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0N5bGluZGVyTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvSGVpZ2h0ZmllbGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9QbGFuZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NwaGVyZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NvZnRib2R5TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ2xvdGhNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Sb3BlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29udHJvbHMvRmlyc3RQZXJzb25Nb2R1bGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgVmVjdG9yMyxcbiAgTWF0cml4NCxcbiAgUXVhdGVybmlvblxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IE1FU1NBR0VfVFlQRVMgPSB7XG4gIFdPUkxEUkVQT1JUOiAwLFxuICBDT0xMSVNJT05SRVBPUlQ6IDEsXG4gIFZFSElDTEVSRVBPUlQ6IDIsXG4gIENPTlNUUkFJTlRSRVBPUlQ6IDMsXG4gIFNPRlRSRVBPUlQ6IDRcbn07XG5cbmNvbnN0IFJFUE9SVF9JVEVNU0laRSA9IDE0LFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgPSA1LFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFID0gOSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSA9IDY7XG5cbmNvbnN0IHRlbXAxVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAyVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAxTWF0cml4NCA9IG5ldyBNYXRyaXg0KCksXG4gIHRlbXAxUXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbmNvbnN0IGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24gPSAoeCwgeSwgeiwgdykgPT4ge1xuICByZXR1cm4gbmV3IFZlY3RvcjMoXG4gICAgTWF0aC5hdGFuMigyICogKHggKiB3IC0geSAqIHopLCAodyAqIHcgLSB4ICogeCAtIHkgKiB5ICsgeiAqIHopKSxcbiAgICBNYXRoLmFzaW4oMiAqICh4ICogeiArIHkgKiB3KSksXG4gICAgTWF0aC5hdGFuMigyICogKHogKiB3IC0geCAqIHkpLCAodyAqIHcgKyB4ICogeCAtIHkgKiB5IC0geiAqIHopKVxuICApO1xufTtcblxuY29uc3QgZ2V0UXVhdGVydGlvbkZyb21FdWxlciA9ICh4LCB5LCB6KSA9PiB7XG4gIGNvbnN0IGMxID0gTWF0aC5jb3MoeSk7XG4gIGNvbnN0IHMxID0gTWF0aC5zaW4oeSk7XG4gIGNvbnN0IGMyID0gTWF0aC5jb3MoLXopO1xuICBjb25zdCBzMiA9IE1hdGguc2luKC16KTtcbiAgY29uc3QgYzMgPSBNYXRoLmNvcyh4KTtcbiAgY29uc3QgczMgPSBNYXRoLnNpbih4KTtcbiAgY29uc3QgYzFjMiA9IGMxICogYzI7XG4gIGNvbnN0IHMxczIgPSBzMSAqIHMyO1xuXG4gIHJldHVybiB7XG4gICAgdzogYzFjMiAqIGMzIC0gczFzMiAqIHMzLFxuICAgIHg6IGMxYzIgKiBzMyArIHMxczIgKiBjMyxcbiAgICB5OiBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczMsXG4gICAgejogYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzXG4gIH07XG59O1xuXG5jb25zdCBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0ID0gKHBvc2l0aW9uLCBvYmplY3QpID0+IHtcbiAgdGVtcDFNYXRyaXg0LmlkZW50aXR5KCk7IC8vIHJlc2V0IHRlbXAgbWF0cml4XG5cbiAgLy8gU2V0IHRoZSB0ZW1wIG1hdHJpeCdzIHJvdGF0aW9uIHRvIHRoZSBvYmplY3QncyByb3RhdGlvblxuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKS5tYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihvYmplY3QucXVhdGVybmlvbik7XG5cbiAgLy8gSW52ZXJ0IHJvdGF0aW9uIG1hdHJpeCBpbiBvcmRlciB0byBcInVucm90YXRlXCIgYSBwb2ludCBiYWNrIHRvIG9iamVjdCBzcGFjZVxuICB0ZW1wMU1hdHJpeDQuZ2V0SW52ZXJzZSh0ZW1wMU1hdHJpeDQpO1xuXG4gIC8vIFlheSEgVGVtcCB2YXJzIVxuICB0ZW1wMVZlY3RvcjMuY29weShwb3NpdGlvbik7XG4gIHRlbXAyVmVjdG9yMy5jb3B5KG9iamVjdC5wb3NpdGlvbik7XG5cbiAgLy8gQXBwbHkgdGhlIHJvdGF0aW9uXG4gIHJldHVybiB0ZW1wMVZlY3RvcjMuc3ViKHRlbXAyVmVjdG9yMykuYXBwbHlNYXRyaXg0KHRlbXAxTWF0cml4NCk7XG59O1xuXG5jb25zdCBhZGRPYmplY3RDaGlsZHJlbiA9IGZ1bmN0aW9uIChwYXJlbnQsIG9iamVjdCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG9iamVjdC5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkID0gb2JqZWN0LmNoaWxkcmVuW2ldO1xuICAgIGNvbnN0IF9waHlzaWpzID0gY2hpbGQuY29tcG9uZW50Ll9waHlzaWpzO1xuXG4gICAgaWYgKF9waHlzaWpzKSB7XG4gICAgICBjaGlsZC51cGRhdGVNYXRyaXgoKTtcbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG5cbiAgICAgIHRlbXAxVmVjdG9yMy5zZXRGcm9tTWF0cml4UG9zaXRpb24oY2hpbGQubWF0cml4V29ybGQpO1xuICAgICAgdGVtcDFRdWF0LnNldEZyb21Sb3RhdGlvbk1hdHJpeChjaGlsZC5tYXRyaXhXb3JsZCk7XG5cbiAgICAgIF9waHlzaWpzLnBvc2l0aW9uX29mZnNldCA9IHtcbiAgICAgICAgeDogdGVtcDFWZWN0b3IzLngsXG4gICAgICAgIHk6IHRlbXAxVmVjdG9yMy55LFxuICAgICAgICB6OiB0ZW1wMVZlY3RvcjMuelxuICAgICAgfTtcblxuICAgICAgX3BoeXNpanMucm90YXRpb24gPSB7XG4gICAgICAgIHg6IHRlbXAxUXVhdC54LFxuICAgICAgICB5OiB0ZW1wMVF1YXQueSxcbiAgICAgICAgejogdGVtcDFRdWF0LnosXG4gICAgICAgIHc6IHRlbXAxUXVhdC53XG4gICAgICB9O1xuXG4gICAgICBwYXJlbnQuY29tcG9uZW50Ll9waHlzaWpzLmNoaWxkcmVuLnB1c2goX3BoeXNpanMpO1xuICAgIH1cblxuICAgIGFkZE9iamVjdENoaWxkcmVuKHBhcmVudCwgY2hpbGQpO1xuICB9XG59O1xuXG5leHBvcnQge1xuICBnZXRFdWxlclhZWkZyb21RdWF0ZXJuaW9uLFxuICBnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyLFxuICBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0LFxuICBhZGRPYmplY3RDaGlsZHJlbixcblxuICBNRVNTQUdFX1RZUEVTLFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSxcblxuICB0ZW1wMVZlY3RvcjMsXG4gIHRlbXAyVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICB0ZW1wMVF1YXRcbn07XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRhYmxlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnMgPSB7fTtcbiAgfVxuXG4gIGFkZEV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKVxuICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0gPSBbXTtcblxuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjYWxsYmFjaykge1xuICAgIGxldCBpbmRleDtcblxuICAgIGlmICghdGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpIHJldHVybiBmYWxzZTtcblxuICAgIGlmICgoaW5kZXggPSB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5pbmRleE9mKGNhbGxiYWNrKSkgPj0gMCkge1xuICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGRpc3BhdGNoRXZlbnQoZXZlbnRfbmFtZSkge1xuICAgIGxldCBpO1xuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIGlmICh0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXVtpXS5hcHBseSh0aGlzLCBwYXJhbWV0ZXJzKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbWFrZShvYmopIHtcbiAgICBvYmoucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBFdmVudGFibGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG4gICAgb2JqLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gRXZlbnRhYmxlLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuICAgIG9iai5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IEV2ZW50YWJsZS5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudDtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgQ29uZVR3aXN0Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgY29uc3Qgb2JqZWN0YiA9IG9iamE7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkgY29uc29sZS5lcnJvcignQm90aCBvYmplY3RzIG11c3QgYmUgZGVmaW5lZCBpbiBhIENvbmVUd2lzdENvbnN0cmFpbnQuJyk7XG5cbiAgICB0aGlzLnR5cGUgPSAnY29uZXR3aXN0JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLl9waHlzaWpzLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXNhID0ge3g6IG9iamVjdGEucm90YXRpb24ueCwgeTogb2JqZWN0YS5yb3RhdGlvbi55LCB6OiBvYmplY3RhLnJvdGF0aW9uLnp9O1xuICAgIHRoaXMuYXhpc2IgPSB7eDogb2JqZWN0Yi5yb3RhdGlvbi54LCB5OiBvYmplY3RiLnJvdGF0aW9uLnksIHo6IG9iamVjdGIucm90YXRpb24uen07XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpc2E6IHRoaXMuYXhpc2EsXG4gICAgICBheGlzYjogdGhpcy5heGlzYlxuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdCh4LCB5LCB6KSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TGltaXQnLCB7Y29uc3RyYWludDogdGhpcy5pZCwgeCwgeSwgen0pO1xuICB9XG5cbiAgZW5hYmxlTW90b3IoKSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3RfZW5hYmxlTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG5cbiAgc2V0TWF4TW90b3JJbXB1bHNlKG1heF9pbXB1bHNlKSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlJywge2NvbnN0cmFpbnQ6IHRoaXMuaWQsIG1heF9pbXB1bHNlfSk7XG4gIH1cblxuICBzZXRNb3RvclRhcmdldCh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuVmVjdG9yMylcbiAgICAgIHRhcmdldCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKG5ldyBUSFJFRS5FdWxlcih0YXJnZXQueCwgdGFyZ2V0LnksIHRhcmdldC56KSk7XG4gICAgZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEhSRUUuRXVsZXIpXG4gICAgICB0YXJnZXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcih0YXJnZXQpO1xuICAgIGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFRIUkVFLk1hdHJpeDQpXG4gICAgICB0YXJnZXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Sb3RhdGlvbk1hdHJpeCh0YXJnZXQpO1xuXG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TW90b3JUYXJnZXQnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgeDogdGFyZ2V0LngsXG4gICAgICB5OiB0YXJnZXQueSxcbiAgICAgIHo6IHRhcmdldC56LFxuICAgICAgdzogdGFyZ2V0LndcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgSGluZ2VDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24sIGF4aXMpIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoYXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBheGlzID0gcG9zaXRpb247XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdoaW5nZSc7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS5fcGh5c2lqcy5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXRzKGxvdywgaGlnaCwgYmlhc19mYWN0b3IsIHJlbGF4YXRpb25fZmFjdG9yKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2Vfc2V0TGltaXRzJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIGxvdyxcbiAgICAgIGhpZ2gsXG4gICAgICBiaWFzX2ZhY3RvcixcbiAgICAgIHJlbGF4YXRpb25fZmFjdG9yXG4gICAgfSk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZU1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX2Rpc2FibGVNb3RvcicsIHtjb25zdHJhaW50OiB0aGlzLmlkfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIFBvaW50Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ3BvaW50JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLl9waHlzaWpzLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLl9waHlzaWpzLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmJcbiAgICB9O1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBTbGlkZXJDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24sIGF4aXMpIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoYXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBheGlzID0gcG9zaXRpb247XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdzbGlkZXInO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMuYXhpcyA9IGF4aXM7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi5fcGh5c2lqcy5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpczogdGhpcy5heGlzXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0cyhsaW5fbG93ZXIsIGxpbl91cHBlciwgYW5nX2xvd2VyLCBhbmdfdXBwZXIpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfc2V0TGltaXRzJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIGxpbl9sb3dlcixcbiAgICAgIGxpbl91cHBlcixcbiAgICAgIGFuZ19sb3dlcixcbiAgICAgIGFuZ191cHBlclxuICAgIH0pO1xuICB9XG5cbiAgc2V0UmVzdGl0dXRpb24obGluZWFyLCBhbmd1bGFyKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZShcbiAgICAgICdzbGlkZXJfc2V0UmVzdGl0dXRpb24nLFxuICAgICAge1xuICAgICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgICBsaW5lYXIsXG4gICAgICAgIGFuZ3VsYXJcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZW5hYmxlTGluZWFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9lbmFibGVMaW5lYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZUxpbmVhck1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9kaXNhYmxlTGluZWFyTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yKHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcbiAgICB0aGlzLnNjZW5lLmV4ZWN1dGUoJ3NsaWRlcl9lbmFibGVBbmd1bGFyTW90b3InLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgdmVsb2NpdHksXG4gICAgICBhY2NlbGVyYXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVBbmd1bGFyTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBET0ZDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoIHBvc2l0aW9uID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdkb2YnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEuX3BoeXNpanMuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YSApLmNsb25lKCk7XG4gICAgdGhpcy5heGlzYSA9IHsgeDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24ueiB9O1xuXG4gICAgaWYgKCBvYmplY3RiICkge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi5fcGh5c2lqcy5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCggcG9zaXRpb24sIG9iamVjdGIgKS5jbG9uZSgpO1xuICAgICAgdGhpcy5heGlzYiA9IHsgeDogb2JqZWN0Yi5yb3RhdGlvbi54LCB5OiBvYmplY3RiLnJvdGF0aW9uLnksIHo6IG9iamVjdGIucm90YXRpb24ueiB9O1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmIsXG4gICAgICBheGlzYTogdGhpcy5heGlzYSxcbiAgICAgIGF4aXNiOiB0aGlzLmF4aXNiXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbmVhckxvd2VyTGltaXQobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhckxvd2VyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0TGluZWFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldExpbmVhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0QW5ndWxhckxvd2VyTGltaXQgKGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyVXBwZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3RvciAod2hpY2gpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2VuYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZUFuZ3VsYXJNb3RvciAod2hpY2gsIGxvd19hbmdsZSwgaGlnaF9hbmdsZSwgdmVsb2NpdHksIG1heF9mb3JjZSApIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoLCBsb3dfYW5nbGU6IGxvd19hbmdsZSwgaGlnaF9hbmdsZTogaGlnaF9hbmdsZSwgdmVsb2NpdHk6IHZlbG9jaXR5LCBtYXhfZm9yY2U6IG1heF9mb3JjZSB9ICk7XG4gIH1cblxuICBkaXNhYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvcicsIHsgY29uc3RyYWludDogdGhpcy5pZCwgd2hpY2g6IHdoaWNoIH0gKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtNZXNofSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge1ZlaGljbGVUdW5uaW5nfSBmcm9tICcuL3R1bm5pbmcnO1xuXG5leHBvcnQgY2xhc3MgVmVoaWNsZSB7XG4gIGNvbnN0cnVjdG9yKG1lc2gsIHR1bmluZyA9IG5ldyBWZWhpY2xlVHVuaW5nKCkpIHtcbiAgICB0aGlzLm1lc2ggPSBtZXNoO1xuICAgIHRoaXMud2hlZWxzID0gW107XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgaWQ6IGdldE9iamVjdElkKCksXG4gICAgICByaWdpZEJvZHk6IG1lc2guX3BoeXNpanMuaWQsXG4gICAgICBzdXNwZW5zaW9uX3N0aWZmbmVzczogdHVuaW5nLnN1c3BlbnNpb25fc3RpZmZuZXNzLFxuICAgICAgc3VzcGVuc2lvbl9jb21wcmVzc2lvbjogdHVuaW5nLnN1c3BlbnNpb25fY29tcHJlc3Npb24sXG4gICAgICBzdXNwZW5zaW9uX2RhbXBpbmc6IHR1bmluZy5zdXNwZW5zaW9uX2RhbXBpbmcsXG4gICAgICBtYXhfc3VzcGVuc2lvbl90cmF2ZWw6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl90cmF2ZWwsXG4gICAgICBmcmljdGlvbl9zbGlwOiB0dW5pbmcuZnJpY3Rpb25fc2xpcCxcbiAgICAgIG1heF9zdXNwZW5zaW9uX2ZvcmNlOiB0dW5pbmcubWF4X3N1c3BlbnNpb25fZm9yY2VcbiAgICB9O1xuICB9XG5cbiAgYWRkV2hlZWwod2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsLCBjb25uZWN0aW9uX3BvaW50LCB3aGVlbF9kaXJlY3Rpb24sIHdoZWVsX2F4bGUsIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsIHdoZWVsX3JhZGl1cywgaXNfZnJvbnRfd2hlZWwsIHR1bmluZykge1xuICAgIGNvbnN0IHdoZWVsID0gbmV3IE1lc2god2hlZWxfZ2VvbWV0cnksIHdoZWVsX21hdGVyaWFsKTtcblxuICAgIHdoZWVsLmNhc3RTaGFkb3cgPSB3aGVlbC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICB3aGVlbC5wb3NpdGlvbi5jb3B5KHdoZWVsX2RpcmVjdGlvbikubXVsdGlwbHlTY2FsYXIoc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCAvIDEwMCkuYWRkKGNvbm5lY3Rpb25fcG9pbnQpO1xuXG4gICAgdGhpcy53b3JsZC5hZGQod2hlZWwpO1xuICAgIHRoaXMud2hlZWxzLnB1c2god2hlZWwpO1xuXG4gICAgdGhpcy53b3JsZC5leGVjdXRlKCdhZGRXaGVlbCcsIHtcbiAgICAgIGlkOiB0aGlzLl9waHlzaWpzLmlkLFxuICAgICAgY29ubmVjdGlvbl9wb2ludDoge3g6IGNvbm5lY3Rpb25fcG9pbnQueCwgeTogY29ubmVjdGlvbl9wb2ludC55LCB6OiBjb25uZWN0aW9uX3BvaW50Lnp9LFxuICAgICAgd2hlZWxfZGlyZWN0aW9uOiB7eDogd2hlZWxfZGlyZWN0aW9uLngsIHk6IHdoZWVsX2RpcmVjdGlvbi55LCB6OiB3aGVlbF9kaXJlY3Rpb24uen0sXG4gICAgICB3aGVlbF9heGxlOiB7eDogd2hlZWxfYXhsZS54LCB5OiB3aGVlbF9heGxlLnksIHo6IHdoZWVsX2F4bGUuen0sXG4gICAgICBzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLFxuICAgICAgd2hlZWxfcmFkaXVzLFxuICAgICAgaXNfZnJvbnRfd2hlZWwsXG4gICAgICB0dW5pbmdcbiAgICB9KTtcbiAgfVxuXG4gIHNldFN0ZWVyaW5nKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0U3RlZXJpbmcnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBzdGVlcmluZzogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBzZXRCcmFrZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldEJyYWtlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbCwgYnJha2U6IGFtb3VudH0pO1xuICAgIGVsc2UgaWYgKHRoaXMud2hlZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aGVlbHMubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBicmFrZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG5cbiAgYXBwbHlFbmdpbmVGb3JjZShhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBmb3JjZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdhcHBseUVuZ2luZUZvcmNlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgZm9yY2U6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHtcbiAgU2NlbmUgYXMgU2NlbmVOYXRpdmUsXG4gIE1lc2gsXG4gIFNwaGVyZUdlb21ldHJ5LFxuICBNZXNoTm9ybWFsTWF0ZXJpYWwsXG4gIEJveEdlb21ldHJ5LFxuICBWZWN0b3IzXG59IGZyb20gJ3RocmVlJztcblxuaW1wb3J0IHtMb29wfSBmcm9tICd3aHMnO1xuXG5pbXBvcnQge1ZlaGljbGV9IGZyb20gJy4uL3ZlaGljbGUvdmVoaWNsZSc7XG5pbXBvcnQge0V2ZW50YWJsZX0gZnJvbSAnLi4vZXZlbnRhYmxlJztcblxuaW1wb3J0IHtcbiAgYWRkT2JqZWN0Q2hpbGRyZW4sXG4gIE1FU1NBR0VfVFlQRVMsXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRVxufSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgV29ybGRNb2R1bGUgZXh0ZW5kcyBFdmVudGFibGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGZpeGVkVGltZVN0ZXA6IDEvNjAsXG4gICAgICByYXRlTGltaXQ6IHRydWUsXG4gICAgICBhbW1vOiBcIlwiLFxuICAgICAgc29mdGJvZHk6IGZhbHNlLFxuICAgICAgZ3Jhdml0eTogbmV3IFZlY3RvcjMoMCwgLTEwMCwgMClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgY29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIHRoaXMud29ya2VyID0gbmV3IChyZXF1aXJlKCd3b3JrZXItbG9hZGVyP2lubGluZSxuYW1lPXdvcmtlci5qcyEuLi93b3JrZXIuanMnKSkoKTtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlID0gdGhpcy53b3JrZXIud2Via2l0UG9zdE1lc3NhZ2UgfHwgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2U7XG5cbiAgICB0aGlzLmlzTG9hZGVkID0gZmFsc2U7XG5cbiAgICB0aGlzLmxvYWRlciA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmIChwYXJhbXMud2FzbSkge1xuICAgICAgICBmZXRjaChwYXJhbXMud2FzbSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5hcnJheUJ1ZmZlcigpKVxuICAgICAgICAgIC50aGVuKGJ1ZmZlciA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhcmFtcy53YXNtQnVmZmVyID0gYnVmZmVyO1xuXG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGUoJ2luaXQnLCB0aGlzLnBhcmFtcyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlBoeXNpY3MgbG9hZGluZyB0aW1lOiBcIiArIChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSArIFwibXNcIik7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2luaXQnLCB0aGlzLnBhcmFtcyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMubG9hZGVyLnRoZW4oKCkgPT4ge3RoaXMuaXNMb2FkZWQgPSB0cnVlfSk7XG5cbiAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50cyA9IHt9O1xuICAgIHRoaXMuX29iamVjdHMgPSB7fTtcbiAgICB0aGlzLl92ZWhpY2xlcyA9IHt9O1xuICAgIHRoaXMuX2NvbnN0cmFpbnRzID0ge307XG4gICAgdGhpcy5faXNfc2ltdWxhdGluZyA9IGZhbHNlO1xuICAgIHRoaXMuZ2V0T2JqZWN0SWQgPSAoKCkgPT4ge1xuICAgICAgbGV0IF9pZCA9IDE7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICByZXR1cm4gX2lkKys7XG4gICAgICB9O1xuICAgIH0pKCk7XG5cbiAgICAvLyBUZXN0IFNVUFBPUlRfVFJBTlNGRVJBQkxFXG5cbiAgICBjb25zdCBhYiA9IG5ldyBBcnJheUJ1ZmZlcigxKTtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGFiLCBbYWJdKTtcbiAgICB0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFID0gKGFiLmJ5dGVMZW5ndGggPT09IDApO1xuXG4gICAgdGhpcy53b3JrZXIub25tZXNzYWdlID0gKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgX3RlbXAsXG4gICAgICAgIGRhdGEgPSBldmVudC5kYXRhO1xuXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyICYmIGRhdGEuYnl0ZUxlbmd0aCAhPT0gMSkvLyBieXRlTGVuZ3RoID09PSAxIGlzIHRoZSB3b3JrZXIgbWFraW5nIGEgU1VQUE9SVF9UUkFOU0ZFUkFCTEUgdGVzdFxuICAgICAgICBkYXRhID0gbmV3IEZsb2F0MzJBcnJheShkYXRhKTtcblxuICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgLy8gdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgICAgICBzd2l0Y2ggKGRhdGFbMF0pIHtcbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNjZW5lKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuU09GVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU29mdGJvZGllcyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sbGlzaW9ucyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZlaGljbGVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29uc3RyYWludHMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGRhdGEuY21kKSB7XG4gICAgICAgIC8vIG5vbi10cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgICAgIHN3aXRjaCAoZGF0YS5jbWQpIHtcbiAgICAgICAgICBjYXNlICdvYmplY3RSZWFkeSc6XG4gICAgICAgICAgICBfdGVtcCA9IGRhdGEucGFyYW1zO1xuICAgICAgICAgICAgaWYgKHRoaXMuX29iamVjdHNbX3RlbXBdKSB0aGlzLl9vYmplY3RzW190ZW1wXS5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd3b3JsZFJlYWR5JzpcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgncmVhZHknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAnYW1tb0xvYWRlZCc6XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2xvYWRlZCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJQaHlzaWNzIGxvYWRpbmcgdGltZTogXCIgKyAocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgKyBcIm1zXCIpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd2ZWhpY2xlJzpcbiAgICAgICAgICAgIHdpbmRvdy50ZXN0ID0gZGF0YTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIERvIG5vdGhpbmcsIGp1c3Qgc2hvdyB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgUmVjZWl2ZWQ6ICR7ZGF0YS5jbWR9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmRpcihkYXRhLnBhcmFtcyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoIChkYXRhWzBdKSB7XG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTY2VuZShkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sbGlzaW9ucyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZlaGljbGVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29uc3RyYWludHMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZVNjZW5lKGRhdGEpIHtcbiAgICBsZXQgaW5kZXggPSBkYXRhWzFdO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyBpbmRleCAqIFJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMuX29iamVjdHNbZGF0YVtvZmZzZXRdXTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICBjb25zdCBfcGh5c2lqcyA9IGNvbXBvbmVudC5fcGh5c2lqcztcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID09PSBmYWxzZSkge1xuICAgICAgICBvYmplY3QucG9zaXRpb24uc2V0KFxuICAgICAgICAgIGRhdGFbb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgICBkYXRhW29mZnNldCArIDNdXG4gICAgICAgICk7XG5cbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KFxuICAgICAgICAgIGRhdGFbb2Zmc2V0ICsgNF0sXG4gICAgICAgICAgZGF0YVtvZmZzZXQgKyA1XSxcbiAgICAgICAgICBkYXRhW29mZnNldCArIDZdLFxuICAgICAgICAgIGRhdGFbb2Zmc2V0ICsgN11cbiAgICAgICAgKTtcblxuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIF9waHlzaWpzLmxpbmVhclZlbG9jaXR5LnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA4XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA5XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAxMF1cbiAgICAgICk7XG5cbiAgICAgIF9waHlzaWpzLmFuZ3VsYXJWZWxvY2l0eS5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgMTFdLFxuICAgICAgICBkYXRhW29mZnNldCArIDEyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAxM11cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG5cbiAgICB0aGlzLl9pc19zaW11bGF0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCd1cGRhdGUnKTtcbiAgfVxuXG4gIHVwZGF0ZVNvZnRib2RpZXMoZGF0YSkge1xuICAgIGxldCBpbmRleCA9IGRhdGFbMV0sXG4gICAgICBvZmZzZXQgPSAyO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IHNpemUgPSBkYXRhW29mZnNldCArIDFdO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tkYXRhW29mZnNldF1dO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgX3BoeXNpanMgPSBvYmplY3QuY29tcG9uZW50Ll9waHlzaWpzO1xuXG4gICAgICBjb25zdCBhdHRyaWJ1dGVzID0gb2JqZWN0Lmdlb21ldHJ5LmF0dHJpYnV0ZXM7XG4gICAgICBjb25zdCB2b2x1bWVQb3NpdGlvbnMgPSBhdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgICBjb25zdCBvZmZzZXRWZXJ0ID0gb2Zmc2V0ICsgMjtcblxuICAgICAgaWYgKCFfcGh5c2lqcy5pc1NvZnRCb2R5UmVzZXQpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KDAsIDAsIDAsIDApO1xuXG4gICAgICAgIF9waHlzaWpzLmlzU29mdEJvZHlSZXNldCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChfcGh5c2lqcy50eXBlID09PSBcInNvZnRUcmltZXNoXCIpIHtcbiAgICAgICAgY29uc3Qgdm9sdW1lTm9ybWFscyA9IGF0dHJpYnV0ZXMubm9ybWFsLmFycmF5O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogMTg7XG5cbiAgICAgICAgICBjb25zdCB4MSA9IGRhdGFbb2Zmc107XG4gICAgICAgICAgY29uc3QgeTEgPSBkYXRhW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6MSA9IGRhdGFbb2ZmcyArIDJdO1xuXG4gICAgICAgICAgY29uc3QgbngxID0gZGF0YVtvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkxID0gZGF0YVtvZmZzICsgNF07XG4gICAgICAgICAgY29uc3QgbnoxID0gZGF0YVtvZmZzICsgNV07XG5cbiAgICAgICAgICBjb25zdCB4MiA9IGRhdGFbb2ZmcyArIDZdO1xuICAgICAgICAgIGNvbnN0IHkyID0gZGF0YVtvZmZzICsgN107XG4gICAgICAgICAgY29uc3QgejIgPSBkYXRhW29mZnMgKyA4XTtcblxuICAgICAgICAgIGNvbnN0IG54MiA9IGRhdGFbb2ZmcyArIDldO1xuICAgICAgICAgIGNvbnN0IG55MiA9IGRhdGFbb2ZmcyArIDEwXTtcbiAgICAgICAgICBjb25zdCBuejIgPSBkYXRhW29mZnMgKyAxMV07XG5cbiAgICAgICAgICBjb25zdCB4MyA9IGRhdGFbb2ZmcyArIDEyXTtcbiAgICAgICAgICBjb25zdCB5MyA9IGRhdGFbb2ZmcyArIDEzXTtcbiAgICAgICAgICBjb25zdCB6MyA9IGRhdGFbb2ZmcyArIDE0XTtcblxuICAgICAgICAgIGNvbnN0IG54MyA9IGRhdGFbb2ZmcyArIDE1XTtcbiAgICAgICAgICBjb25zdCBueTMgPSBkYXRhW29mZnMgKyAxNl07XG4gICAgICAgICAgY29uc3QgbnozID0gZGF0YVtvZmZzICsgMTddO1xuXG4gICAgICAgICAgY29uc3QgaTkgPSBpICogOTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOV0gPSB4MTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAxXSA9IHkxO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDJdID0gejE7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAzXSA9IHgyO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDRdID0geTI7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNV0gPSB6MjtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDZdID0geDM7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgN10gPSB5MztcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA4XSA9IHozO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOV0gPSBueDE7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDFdID0gbnkxO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAyXSA9IG56MTtcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAzXSA9IG54MjtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNF0gPSBueTI7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDVdID0gbnoyO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDZdID0gbngzO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA3XSA9IG55MztcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgOF0gPSBuejM7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDE4O1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoX3BoeXNpanMudHlwZSA9PT0gXCJzb2Z0Um9wZU1lc2hcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICBjb25zdCB4ID0gZGF0YVtvZmZzXTtcbiAgICAgICAgICBjb25zdCB5ID0gZGF0YVtvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgeiA9IGRhdGFbb2ZmcyArIDJdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2b2x1bWVOb3JtYWxzID0gYXR0cmlidXRlcy5ub3JtYWwuYXJyYXk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgY29uc3QgeCA9IGRhdGFbb2Zmc107XG4gICAgICAgICAgY29uc3QgeSA9IGRhdGFbb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHogPSBkYXRhW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54ID0gZGF0YVtvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkgPSBkYXRhW29mZnMgKyA0XTtcbiAgICAgICAgICBjb25zdCBueiA9IGRhdGFbb2ZmcyArIDVdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcblxuICAgICAgICAgIC8vIEZJWE1FOiBOb3JtYWxzIGFyZSBwb2ludGVkIHRvIGxvb2sgaW5zaWRlO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDNdID0gbng7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDFdID0gbnk7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDJdID0gbno7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDY7XG4gICAgICB9XG5cbiAgICAgIGF0dHJpYnV0ZXMucG9zaXRpb24ubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgIC8vICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuXG4gICAgdGhpcy5faXNfc2ltdWxhdGluZyA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVmVoaWNsZXMoZGF0YSkge1xuICAgIGxldCB2ZWhpY2xlLCB3aGVlbDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogVkVISUNMRVJFUE9SVF9JVEVNU0laRTtcbiAgICAgIHZlaGljbGUgPSB0aGlzLl92ZWhpY2xlc1tkYXRhW29mZnNldF1dO1xuXG4gICAgICBpZiAodmVoaWNsZSA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIHdoZWVsID0gdmVoaWNsZS53aGVlbHNbZGF0YVtvZmZzZXQgKyAxXV07XG5cbiAgICAgIHdoZWVsLnBvc2l0aW9uLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAzXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA0XVxuICAgICAgKTtcblxuICAgICAgd2hlZWwucXVhdGVybmlvbi5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNV0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgN10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgOF1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICB1cGRhdGVDb25zdHJhaW50cyhkYXRhKSB7XG4gICAgbGV0IGNvbnN0cmFpbnQsIG9iamVjdDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0cmFpbnQgPSB0aGlzLl9jb25zdHJhaW50c1tkYXRhW29mZnNldF1dO1xuICAgICAgb2JqZWN0ID0gdGhpcy5fb2JqZWN0c1tkYXRhW29mZnNldCArIDFdXTtcblxuICAgICAgaWYgKGNvbnN0cmFpbnQgPT09IHVuZGVmaW5lZCB8fCBvYmplY3QgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cbiAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgMl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgM10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNF1cbiAgICAgICk7XG5cbiAgICAgIHRlbXAxTWF0cml4NC5leHRyYWN0Um90YXRpb24ob2JqZWN0Lm1hdHJpeCk7XG4gICAgICB0ZW1wMVZlY3RvcjMuYXBwbHlNYXRyaXg0KHRlbXAxTWF0cml4NCk7XG5cbiAgICAgIGNvbnN0cmFpbnQucG9zaXRpb25hLmFkZFZlY3RvcnMob2JqZWN0LnBvc2l0aW9uLCB0ZW1wMVZlY3RvcjMpO1xuICAgICAgY29uc3RyYWludC5hcHBsaWVkSW1wdWxzZSA9IGRhdGFbb2Zmc2V0ICsgNV07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICB1cGRhdGVDb2xsaXNpb25zKGRhdGEpIHtcbiAgICAvKipcbiAgICAgKiAjVE9ET1xuICAgICAqIFRoaXMgaXMgcHJvYmFibHkgdGhlIHdvcnN0IHdheSBldmVyIHRvIGhhbmRsZSBjb2xsaXNpb25zLiBUaGUgaW5oZXJlbnQgZXZpbG5lc3MgaXMgYSByZXNpZHVhbFxuICAgICAqIGVmZmVjdCBmcm9tIHRoZSBwcmV2aW91cyB2ZXJzaW9uJ3MgZXZpbG5lc3Mgd2hpY2ggbXV0YXRlZCB3aGVuIHN3aXRjaGluZyB0byB0cmFuc2ZlcmFibGUgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIElmIHlvdSBmZWVsIGluY2xpbmVkIHRvIG1ha2UgdGhpcyBiZXR0ZXIsIHBsZWFzZSBkbyBzby5cbiAgICAgKi9cblxuICAgIGNvbnN0IGNvbGxpc2lvbnMgPSB7fSxcbiAgICAgIG5vcm1hbF9vZmZzZXRzID0ge307XG5cbiAgICAvLyBCdWlsZCBjb2xsaXNpb24gbWFuaWZlc3RcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFbMV07IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIGkgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdCBvYmplY3QgPSBkYXRhW29mZnNldF07XG4gICAgICBjb25zdCBvYmplY3QyID0gZGF0YVtvZmZzZXQgKyAxXTtcblxuICAgICAgbm9ybWFsX29mZnNldHNbYCR7b2JqZWN0fS0ke29iamVjdDJ9YF0gPSBvZmZzZXQgKyAyO1xuICAgICAgbm9ybWFsX29mZnNldHNbYCR7b2JqZWN0Mn0tJHtvYmplY3R9YF0gPSAtMSAqIChvZmZzZXQgKyAyKTtcblxuICAgICAgLy8gUmVnaXN0ZXIgY29sbGlzaW9ucyBmb3IgYm90aCB0aGUgb2JqZWN0IGNvbGxpZGluZyBhbmQgdGhlIG9iamVjdCBiZWluZyBjb2xsaWRlZCB3aXRoXG4gICAgICBpZiAoIWNvbGxpc2lvbnNbb2JqZWN0XSkgY29sbGlzaW9uc1tvYmplY3RdID0gW107XG4gICAgICBjb2xsaXNpb25zW29iamVjdF0ucHVzaChvYmplY3QyKTtcblxuICAgICAgaWYgKCFjb2xsaXNpb25zW29iamVjdDJdKSBjb2xsaXNpb25zW29iamVjdDJdID0gW107XG4gICAgICBjb2xsaXNpb25zW29iamVjdDJdLnB1c2gob2JqZWN0KTtcbiAgICB9XG5cbiAgICAvLyBEZWFsIHdpdGggY29sbGlzaW9uc1xuICAgIGZvciAoY29uc3QgaWQxIGluIHRoaXMuX29iamVjdHMpIHtcbiAgICAgIGlmICghdGhpcy5fb2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShpZDEpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMuX29iamVjdHNbaWQxXTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICBjb25zdCBfcGh5c2lqcyA9IGNvbXBvbmVudC5fcGh5c2lqcztcbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICAvLyBJZiBvYmplY3QgdG91Y2hlcyBhbnl0aGluZywgLi4uXG4gICAgICBpZiAoY29sbGlzaW9uc1tpZDFdKSB7XG4gICAgICAgIC8vIENsZWFuIHVwIHRvdWNoZXMgYXJyYXlcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBfcGh5c2lqcy50b3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXS5pbmRleE9mKF9waHlzaWpzLnRvdWNoZXNbal0pID09PSAtMSlcbiAgICAgICAgICAgIF9waHlzaWpzLnRvdWNoZXMuc3BsaWNlKGotLSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgZWFjaCBjb2xsaWRpbmcgb2JqZWN0XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29sbGlzaW9uc1tpZDFdLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgaWQyID0gY29sbGlzaW9uc1tpZDFdW2pdO1xuICAgICAgICAgIGNvbnN0IG9iamVjdDIgPSB0aGlzLl9vYmplY3RzW2lkMl07XG4gICAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IG9iamVjdDIuY29tcG9uZW50O1xuICAgICAgICAgIGNvbnN0IF9waHlzaWpzMiA9IGNvbXBvbmVudDIuX3BoeXNpanM7XG5cbiAgICAgICAgICBpZiAob2JqZWN0Mikge1xuICAgICAgICAgICAgLy8gSWYgb2JqZWN0IHdhcyBub3QgYWxyZWFkeSB0b3VjaGluZyBvYmplY3QyLCBub3RpZnkgb2JqZWN0XG4gICAgICAgICAgICBpZiAoX3BoeXNpanMudG91Y2hlcy5pbmRleE9mKGlkMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgIF9waHlzaWpzLnRvdWNoZXMucHVzaChpZDIpO1xuXG4gICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zdWJWZWN0b3JzKGNvbXBvbmVudC5nZXRMaW5lYXJWZWxvY2l0eSgpLCBjb21wb25lbnQyLmdldExpbmVhclZlbG9jaXR5KCkpO1xuICAgICAgICAgICAgICBjb25zdCB0ZW1wMSA9IHRlbXAxVmVjdG9yMy5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zdWJWZWN0b3JzKGNvbXBvbmVudC5nZXRBbmd1bGFyVmVsb2NpdHkoKSwgY29tcG9uZW50Mi5nZXRBbmd1bGFyVmVsb2NpdHkoKSk7XG4gICAgICAgICAgICAgIGNvbnN0IHRlbXAyID0gdGVtcDFWZWN0b3IzLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgbGV0IG5vcm1hbF9vZmZzZXQgPSBub3JtYWxfb2Zmc2V0c1tgJHtfcGh5c2lqcy5pZH0tJHtfcGh5c2lqczIuaWR9YF07XG5cbiAgICAgICAgICAgICAgaWYgKG5vcm1hbF9vZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIC1kYXRhW25vcm1hbF9vZmZzZXRdLFxuICAgICAgICAgICAgICAgICAgLWRhdGFbbm9ybWFsX29mZnNldCArIDFdLFxuICAgICAgICAgICAgICAgICAgLWRhdGFbbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub3JtYWxfb2Zmc2V0ICo9IC0xO1xuXG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIGRhdGFbbm9ybWFsX29mZnNldF0sXG4gICAgICAgICAgICAgICAgICBkYXRhW25vcm1hbF9vZmZzZXQgKyAxXSxcbiAgICAgICAgICAgICAgICAgIGRhdGFbbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbXBvbmVudC5lbWl0KCdjb2xsaXNpb24nLCBvYmplY3QyLCB0ZW1wMSwgdGVtcDIsIHRlbXAxVmVjdG9yMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgX3BoeXNpanMudG91Y2hlcy5sZW5ndGggPSAwOyAvLyBub3QgdG91Y2hpbmcgb3RoZXIgb2JqZWN0c1xuICAgIH1cblxuICAgIHRoaXMuY29sbGlzaW9ucyA9IGNvbGxpc2lvbnM7XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIGFkZENvbnN0cmFpbnQoY29uc3RyYWludCwgc2hvd19tYXJrZXIpIHtcbiAgICBjb25zdHJhaW50LmlkID0gdGhpcy5nZXRPYmplY3RJZCgpO1xuICAgIHRoaXMuX2NvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdID0gY29uc3RyYWludDtcbiAgICBjb25zdHJhaW50LndvcmxkTW9kdWxlID0gdGhpcztcbiAgICB0aGlzLmV4ZWN1dGUoJ2FkZENvbnN0cmFpbnQnLCBjb25zdHJhaW50LmdldERlZmluaXRpb24oKSk7XG5cbiAgICBpZiAoc2hvd19tYXJrZXIpIHtcbiAgICAgIGxldCBtYXJrZXI7XG5cbiAgICAgIHN3aXRjaCAoY29uc3RyYWludC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ3BvaW50JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLl9vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnaGluZ2UnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMuX29iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzbGlkZXInOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IEJveEdlb21ldHJ5KDEwLCAxLCAxKSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG5cbiAgICAgICAgICAvLyBUaGlzIHJvdGF0aW9uIGlzbid0IHJpZ2h0IGlmIGFsbCB0aHJlZSBheGlzIGFyZSBub24tMCB2YWx1ZXNcbiAgICAgICAgICAvLyBUT0RPOiBjaGFuZ2UgbWFya2VyJ3Mgcm90YXRpb24gb3JkZXIgdG8gWllYXG4gICAgICAgICAgbWFya2VyLnJvdGF0aW9uLnNldChcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy55LCAvLyB5ZXMsIHkgYW5kXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMueCwgLy8geCBheGlzIGFyZSBzd2FwcGVkXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMuelxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2NvbmV0d2lzdCc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2RvZic6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5fb2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb25zdHJhaW50O1xuICB9XG5cbiAgb25TaW11bGF0aW9uUmVzdW1lKCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnb25TaW11bGF0aW9uUmVzdW1lJywge30pO1xuICB9XG5cbiAgcmVtb3ZlQ29uc3RyYWludChjb25zdHJhaW50KSB7XG4gICAgaWYgKHRoaXMuX2NvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlQ29uc3RyYWludCcsIHtpZDogY29uc3RyYWludC5pZH0pO1xuICAgICAgZGVsZXRlIHRoaXMuX2NvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdO1xuICAgIH1cbiAgfVxuXG4gIGV4ZWN1dGUoY21kLCBwYXJhbXMpIHtcbiAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZSh7Y21kLCBwYXJhbXN9KTtcbiAgfVxuXG4gIG9uQWRkQ2FsbGJhY2soY29tcG9uZW50KSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gY29tcG9uZW50Lm5hdGl2ZTtcbiAgICBjb25zdCBfcGh5c2lqcyA9IG9iamVjdC5fcGh5c2lqcyB8fCBvYmplY3QuY29tcG9uZW50Ll9waHlzaWpzO1xuXG4gICAgaWYgKF9waHlzaWpzKSB7XG4gICAgICBjb21wb25lbnQubWFuYWdlci5zZXQoJ21vZHVsZTp3b3JsZCcsIHRoaXMpO1xuICAgICAgX3BoeXNpanMuaWQgPSB0aGlzLmdldE9iamVjdElkKCk7XG5cbiAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBWZWhpY2xlKSB7XG4gICAgICAgIHRoaXMub25BZGRDYWxsYmFjayhvYmplY3QubWVzaCk7XG4gICAgICAgIHRoaXMuX3ZlaGljbGVzW19waHlzaWpzLmlkXSA9IG9iamVjdDtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRWZWhpY2xlJywgX3BoeXNpanMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX29iamVjdHNbX3BoeXNpanMuaWRdID0gb2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmplY3QuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgX3BoeXNpanMuY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgICBhZGRPYmplY3RDaGlsZHJlbihvYmplY3QsIG9iamVjdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzLmhhc093blByb3BlcnR5KG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZCkpXG4gICAgICAgICAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdKys7XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGUoJ3JlZ2lzdGVyTWF0ZXJpYWwnLCBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMpO1xuICAgICAgICAgICAgX3BoeXNpanMubWF0ZXJpYWxJZCA9IG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZDtcbiAgICAgICAgICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0gPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG9iamVjdC5xdWF0ZXJuaW9uLnNldEZyb21FdWxlcihvYmplY3Qucm90YXRpb24pO1xuICAgICAgICAvL1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhvYmplY3QuY29tcG9uZW50KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2cob2JqZWN0LnJvdGF0aW9uKTtcblxuICAgICAgICAvLyBPYmplY3Qgc3RhcnRpbmcgcG9zaXRpb24gKyByb3RhdGlvblxuICAgICAgICBfcGh5c2lqcy5wb3NpdGlvbiA9IHtcbiAgICAgICAgICB4OiBvYmplY3QucG9zaXRpb24ueCxcbiAgICAgICAgICB5OiBvYmplY3QucG9zaXRpb24ueSxcbiAgICAgICAgICB6OiBvYmplY3QucG9zaXRpb24uelxuICAgICAgICB9O1xuXG4gICAgICAgIF9waHlzaWpzLnJvdGF0aW9uID0ge1xuICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgeTogb2JqZWN0LnF1YXRlcm5pb24ueSxcbiAgICAgICAgICB6OiBvYmplY3QucXVhdGVybmlvbi56LFxuICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoX3BoeXNpanMud2lkdGgpIF9waHlzaWpzLndpZHRoICo9IG9iamVjdC5zY2FsZS54O1xuICAgICAgICBpZiAoX3BoeXNpanMuaGVpZ2h0KSBfcGh5c2lqcy5oZWlnaHQgKj0gb2JqZWN0LnNjYWxlLnk7XG4gICAgICAgIGlmIChfcGh5c2lqcy5kZXB0aCkgX3BoeXNpanMuZGVwdGggKj0gb2JqZWN0LnNjYWxlLno7XG5cbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRPYmplY3QnLCBfcGh5c2lqcyk7XG4gICAgICB9XG5cbiAgICAgIGNvbXBvbmVudC5lbWl0KCdwaHlzaWNzOmFkZGVkJyk7XG4gICAgfVxuICB9XG5cbiAgb25SZW1vdmVDYWxsYmFjayhjb21wb25lbnQpIHtcbiAgICBjb25zdCBvYmplY3QgPSBjb21wb25lbnQubmF0aXZlO1xuXG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFZlaGljbGUpIHtcbiAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlVmVoaWNsZScsIHtpZDogb2JqZWN0Ll9waHlzaWpzLmlkfSk7XG4gICAgICB3aGlsZSAob2JqZWN0LndoZWVscy5sZW5ndGgpIHRoaXMucmVtb3ZlKG9iamVjdC53aGVlbHMucG9wKCkpO1xuXG4gICAgICB0aGlzLnJlbW92ZShvYmplY3QubWVzaCk7XG4gICAgICB0aGlzLl92ZWhpY2xlc1tvYmplY3QuX3BoeXNpanMuaWRdID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWVzaC5wcm90b3R5cGUucmVtb3ZlLmNhbGwodGhpcywgb2JqZWN0KTtcblxuICAgICAgaWYgKG9iamVjdC5fcGh5c2lqcykge1xuICAgICAgICBjb21wb25lbnQubWFuYWdlci5yZW1vdmUoJ21vZHVsZTp3b3JsZCcpO1xuICAgICAgICB0aGlzLl9vYmplY3RzW29iamVjdC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ3JlbW92ZU9iamVjdCcsIHtpZDogb2JqZWN0Ll9waHlzaWpzLmlkfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvYmplY3QubWF0ZXJpYWwgJiYgb2JqZWN0Lm1hdGVyaWFsLl9waHlzaWpzICYmIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzLmhhc093blByb3BlcnR5KG9iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZCkpIHtcbiAgICAgIHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0tLTtcblxuICAgICAgaWYgKHRoaXMuX21hdGVyaWFsc19yZWZfY291bnRzW29iamVjdC5tYXRlcmlhbC5fcGh5c2lqcy5pZF0gPT09IDApIHtcbiAgICAgICAgdGhpcy5leGVjdXRlKCd1blJlZ2lzdGVyTWF0ZXJpYWwnLCBvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMpO1xuICAgICAgICB0aGlzLl9tYXRlcmlhbHNfcmVmX2NvdW50c1tvYmplY3QubWF0ZXJpYWwuX3BoeXNpanMuaWRdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBkZWZlcihmdW5jLCBhcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0xvYWRlZCkge1xuICAgICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9IGVsc2UgdGhpcy5sb2FkZXIudGhlbigoKSA9PiB7XG4gICAgICAgIGZ1bmMoLi4uYXJncyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgbWFuYWdlci5zZXQoJ3BoeXNpY3NXb3JrZXInLCB0aGlzLndvcmtlcik7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgb25BZGQoY29tcG9uZW50LCBzZWxmKSB7XG4gICAgICBpZiAoY29tcG9uZW50Ll9waHlzaWpzKSByZXR1cm4gc2VsZi5kZWZlcihzZWxmLm9uQWRkQ2FsbGJhY2suYmluZChzZWxmKSwgW2NvbXBvbmVudF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH0sXG4gICAgXG4gICAgb25SZW1vdmUoY29tcG9uZW50LCBzZWxmKSB7XG4gICAgICBpZiAoY29tcG9uZW50Ll9waHlzaWpzKSByZXR1cm4gc2VsZi5kZWZlcihzZWxmLm9uUmVtb3ZlQ2FsbGJhY2suYmluZChzZWxmKSwgW2NvbXBvbmVudF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgLy8gLi4uXG5cbiAgICB0aGlzLnNldEZpeGVkVGltZVN0ZXAgPSBmdW5jdGlvbihmaXhlZFRpbWVTdGVwKSB7XG4gICAgICBpZiAoZml4ZWRUaW1lU3RlcCkgc2VsZi5leGVjdXRlKCdzZXRGaXhlZFRpbWVTdGVwJywgZml4ZWRUaW1lU3RlcCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRHcmF2aXR5ID0gZnVuY3Rpb24oZ3Jhdml0eSkge1xuICAgICAgaWYgKGdyYXZpdHkpIHNlbGYuZXhlY3V0ZSgnc2V0R3Jhdml0eScsIGdyYXZpdHkpO1xuICAgIH1cblxuICAgIHRoaXMuYWRkQ29uc3RyYWludCA9IHNlbGYuYWRkQ29uc3RyYWludC5iaW5kKHNlbGYpO1xuXG4gICAgdGhpcy5zaW11bGF0ZSA9IGZ1bmN0aW9uKHRpbWVTdGVwLCBtYXhTdWJTdGVwcykge1xuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5iZWdpbigpO1xuXG4gICAgICBpZiAoc2VsZi5faXNfc2ltdWxhdGluZykgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBzZWxmLl9pc19zaW11bGF0aW5nID0gdHJ1ZTtcblxuICAgICAgZm9yIChjb25zdCBvYmplY3RfaWQgaW4gc2VsZi5fb2JqZWN0cykge1xuICAgICAgICBpZiAoIXNlbGYuX29iamVjdHMuaGFzT3duUHJvcGVydHkob2JqZWN0X2lkKSkgY29udGludWU7XG5cbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gc2VsZi5fb2JqZWN0c1tvYmplY3RfaWRdO1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgICBjb25zdCBfcGh5c2lqcyA9IGNvbXBvbmVudC5fcGh5c2lqcztcblxuICAgICAgICBpZiAob2JqZWN0ICE9PSBudWxsICYmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uIHx8IGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24pKSB7XG4gICAgICAgICAgY29uc3QgdXBkYXRlID0ge2lkOiBfcGh5c2lqcy5pZH07XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnBvcyA9IHtcbiAgICAgICAgICAgICAgeDogb2JqZWN0LnBvc2l0aW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5wb3NpdGlvbi55LFxuICAgICAgICAgICAgICB6OiBvYmplY3QucG9zaXRpb24uelxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKF9waHlzaWpzLmlzU29mdGJvZHkpIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnF1YXQgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5xdWF0ZXJuaW9uLnksXG4gICAgICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChfcGh5c2lqcy5pc1NvZnRib2R5KSBvYmplY3Qucm90YXRpb24uc2V0KDAsIDAsIDApO1xuXG4gICAgICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VsZi5leGVjdXRlKCd1cGRhdGVUcmFuc2Zvcm0nLCB1cGRhdGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlbGYuZXhlY3V0ZSgnc2ltdWxhdGUnLCB7dGltZVN0ZXAsIG1heFN1YlN0ZXBzfSk7XG5cbiAgICAgIGlmIChzZWxmLl9zdGF0cykgc2VsZi5fc3RhdHMuZW5kKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBjb25zdCBzaW11bGF0ZVByb2Nlc3MgPSAodCkgPT4ge1xuICAgIC8vICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShzaW11bGF0ZVByb2Nlc3MpO1xuXG4gICAgLy8gICB0aGlzLnNpbXVsYXRlKDEvNjAsIDEpOyAvLyBkZWx0YSwgMVxuICAgIC8vIH1cblxuICAgIC8vIHNpbXVsYXRlUHJvY2VzcygpO1xuXG4gICAgc2VsZi5sb2FkZXIudGhlbigoKSA9PiB7XG4gICAgICBzZWxmLnNpbXVsYXRlTG9vcCA9IG5ldyBMb29wKChjbG9jaykgPT4ge1xuICAgICAgICB0aGlzLnNpbXVsYXRlKGNsb2NrLmdldERlbHRhKCksIDEpOyAvLyBkZWx0YSwgMVxuICAgICAgfSk7XG5cbiAgICAgIHNlbGYuc2ltdWxhdGVMb29wLnN0YXJ0KHRoaXMpO1xuXG4gICAgICB0aGlzLnNldEdyYXZpdHkocGFyYW1zLmdyYXZpdHkpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge1F1YXRlcm5pb259IGZyb20gJ3RocmVlJztcblxuZXhwb3J0IGNvbnN0IGFwaSA9IHtcbiAgLy8gZ2V0IG1hc3MoKSB7XG4gIC8vICAgcmV0dXJuIHRoaXMuX3BoeXNpanMubWFzcztcbiAgLy8gfVxuXG4gIC8vIHNldCBtYXNzKG1hc3MpIHtcbiAgLy8gICB0aGlzLl9waHlzaWpzLm1hc3MgPSBtYXNzO1xuICAvLyAgIGlmICh0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgndXBkYXRlTWFzcycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgbWFzc30pO1xuICAvLyB9XG5cbiAgYXBwbHlDZW50cmFsSW1wdWxzZShmb3JjZSkge1xuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnYXBwbHlDZW50cmFsSW1wdWxzZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgeDogZm9yY2UueCwgeTogZm9yY2UueSwgejogZm9yY2Uuen0pO1xuICB9LFxuXG4gIGFwcGx5SW1wdWxzZShmb3JjZSwgb2Zmc2V0KSB7XG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB7XG4gICAgICB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdhcHBseUltcHVsc2UnLCB7XG4gICAgICAgIGlkOiB0aGlzLl9waHlzaWpzLmlkLFxuICAgICAgICBpbXB1bHNlX3g6IGZvcmNlLngsXG4gICAgICAgIGltcHVsc2VfeTogZm9yY2UueSxcbiAgICAgICAgaW1wdWxzZV96OiBmb3JjZS56LFxuICAgICAgICB4OiBvZmZzZXQueCxcbiAgICAgICAgeTogb2Zmc2V0LnksXG4gICAgICAgIHo6IG9mZnNldC56XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgYXBwbHlUb3JxdWUoZm9yY2UpIHtcbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHtcbiAgICAgIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ2FwcGx5VG9ycXVlJywge1xuICAgICAgICBpZDogdGhpcy5fcGh5c2lqcy5pZCxcbiAgICAgICAgdG9ycXVlX3g6IGZvcmNlLngsXG4gICAgICAgIHRvcnF1ZV95OiBmb3JjZS55LFxuICAgICAgICB0b3JxdWVfejogZm9yY2UuelxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIGFwcGx5Q2VudHJhbEZvcmNlKGZvcmNlKSB7XG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdhcHBseUNlbnRyYWxGb3JjZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgeDogZm9yY2UueCwgeTogZm9yY2UueSwgejogZm9yY2Uuen0pO1xuICB9LFxuXG4gIGFwcGx5Rm9yY2UoZm9yY2UsIG9mZnNldCkge1xuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkge1xuICAgICAgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnYXBwbHlGb3JjZScsIHtcbiAgICAgICAgaWQ6IHRoaXMuX3BoeXNpanMuaWQsXG4gICAgICAgIGZvcmNlX3g6IGZvcmNlLngsXG4gICAgICAgIGZvcmNlX3k6IGZvcmNlLnksXG4gICAgICAgIGZvcmNlX3o6IGZvcmNlLnosXG4gICAgICAgIHg6IG9mZnNldC54LFxuICAgICAgICB5OiBvZmZzZXQueSxcbiAgICAgICAgejogb2Zmc2V0LnpcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBnZXRBbmd1bGFyVmVsb2NpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BoeXNpanMuYW5ndWxhclZlbG9jaXR5O1xuICB9LFxuXG4gIHNldEFuZ3VsYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnc2V0QW5ndWxhclZlbG9jaXR5Jywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB4OiB2ZWxvY2l0eS54LCB5OiB2ZWxvY2l0eS55LCB6OiB2ZWxvY2l0eS56fSk7XG4gIH0sXG5cbiAgZ2V0TGluZWFyVmVsb2NpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BoeXNpanMubGluZWFyVmVsb2NpdHk7XG4gIH0sXG5cbiAgc2V0TGluZWFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ3NldExpbmVhclZlbG9jaXR5Jywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB4OiB2ZWxvY2l0eS54LCB5OiB2ZWxvY2l0eS55LCB6OiB2ZWxvY2l0eS56fSk7XG4gIH0sXG5cbiAgc2V0QW5ndWxhckZhY3RvcihmYWN0b3IpIHtcbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ3NldEFuZ3VsYXJGYWN0b3InLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9KTtcbiAgfSxcblxuICBzZXRMaW5lYXJGYWN0b3IoZmFjdG9yKSB7XG4gICAgaWYgKHRoaXMubWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpKSB0aGlzLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKCdzZXRMaW5lYXJGYWN0b3InLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9KTtcbiAgfSxcblxuICBzZXREYW1waW5nKGxpbmVhciwgYW5ndWxhcikge1xuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnc2V0RGFtcGluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgbGluZWFyLCBhbmd1bGFyfSk7XG4gIH0sXG5cbiAgc2V0Q2NkTW90aW9uVGhyZXNob2xkKHRocmVzaG9sZCkge1xuICAgIGlmICh0aGlzLm1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKSkgdGhpcy5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSgnc2V0Q2NkTW90aW9uVGhyZXNob2xkJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB0aHJlc2hvbGR9KTtcbiAgfSxcblxuICBzZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyhyYWRpdXMpIHtcbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ3NldENjZFN3ZXB0U3BoZXJlUmFkaXVzJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCByYWRpdXN9KTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgcHJvcGVydGllcyA9IHtcbiAgcG9zaXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQodmVjdG9yMykge1xuICAgICAgY29uc3QgcG9zID0gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzO1xuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhwb3MsIHtcbiAgICAgICAgeDoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl94O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeCkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ggPSB4O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgeToge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl95O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeSkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3kgPSB5O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgejoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl96O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeikge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ogPSB6O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHNjb3BlLl9fZGlydHlQb3NpdGlvbiA9IHRydWU7XG5cbiAgICAgIHBvcy5jb3B5KHZlY3RvcjMpO1xuICAgIH1cbiAgfSxcblxuICBxdWF0ZXJuaW9uOiB7XG4gICAgZ2V0KCkge1xuICAgICAgdGhpcy5fX2Nfcm90ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLm5hdGl2ZS5xdWF0ZXJuaW9uO1xuICAgIH0sXG5cbiAgICBzZXQocXVhdGVybmlvbikge1xuICAgICAgY29uc3QgcXVhdCA9IHRoaXMuX25hdGl2ZS5xdWF0ZXJuaW9uLFxuICAgICAgICBuYXRpdmUgPSB0aGlzLl9uYXRpdmU7XG5cbiAgICAgIHF1YXQuY29weShxdWF0ZXJuaW9uKTtcblxuICAgICAgcXVhdC5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9fY19yb3QpIHtcbiAgICAgICAgICBpZiAobmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5fX2Nfcm90ID0gZmFsc2U7XG4gICAgICAgICAgICBuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgcm90YXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMuX25hdGl2ZS5yb3RhdGlvbjtcbiAgICB9LFxuXG4gICAgc2V0KGV1bGVyKSB7XG4gICAgICBjb25zdCByb3QgPSB0aGlzLl9uYXRpdmUucm90YXRpb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoZXVsZXIpKTtcblxuICAgICAgcm90Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIHRoaXMucXVhdGVybmlvbi5jb3B5KG5ldyBRdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHJvdCkpO1xuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyYXBQaHlzaWNzUHJvdG90eXBlKHNjb3BlKSB7XG4gIGZvciAobGV0IGtleSBpbiBhcGkpIHtcbiAgICBzY29wZVtrZXldID0gYXBpW2tleV0uYmluZChzY29wZSk7XG4gIH1cblxuICBmb3IgKGxldCBrZXkgaW4gcHJvcGVydGllcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzY29wZSwga2V5LCB7XG4gICAgICBnZXQ6IHByb3BlcnRpZXNba2V5XS5nZXQuYmluZChzY29wZSksXG4gICAgICBzZXQ6IHByb3BlcnRpZXNba2V5XS5zZXQuYmluZChzY29wZSksXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uQ29weShzb3VyY2UpIHtcbiAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIHRoaXMuX3BoeXNpanMgPSB7Li4uc291cmNlLl9waHlzaWpzfTtcbiAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucm90YXRpb24uY2xvbmUoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gdGhpcy5xdWF0ZXJuaW9uLmNsb25lKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbldyYXAoKSB7XG4gIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmNsb25lKCk7XG4gIHRoaXMucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uLmNsb25lKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IHRoaXMucXVhdGVybmlvbi5jbG9uZSgpO1xufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIEJveE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMFxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdib3gnLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICB0b3VjaGVzOiBbXSxcbiAgICAgIGxpbmVhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgICAgYW5ndWxhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgICAgZ3JvdXA6IHBhcmFtcy5ncm91cCxcbiAgICAgIG1hc2s6IHBhcmFtcy5tYXNrLFxuICAgICAgZnJpY3Rpb246IHBhcmFtcy5mcmljdGlvbixcbiAgICAgIHJlc3RpdHV0aW9uOiBwYXJhbXMucmVzdGl0dXRpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIHNjYWxlOiBwYXJhbXMuc2NhbGUsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW5cbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLndpZHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIHRoaXMuX3BoeXNpanMuaGVpZ2h0ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIHRoaXMuX3BoeXNpanMuZGVwdGggPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfTtcbn1cbiIsImltcG9ydCB7VmVjdG9yM30gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb3VuZE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMFxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjb21wb3VuZCcsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpblxuICAgIH07XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQge1ZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgQ2Fwc3VsZU1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIGhlaWdodDogMyxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHJhZGl1czogMyxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMFxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjYXBzdWxlJyxcbiAgICAgIHJhZGl1czogTWF0aC5tYXgocGFyYW1zLndpZHRoIC8gMiwgcGFyYW1zLmRlcHRoIC8gMiksXG4gICAgICBoZWlnaHQ6IHBhcmFtcy5oZWlnaHQsXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICB0aGlzLl9waHlzaWpzLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICB0aGlzLl9waHlzaWpzLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQge1ZlY3RvcjMsIE11bHRpTWF0ZXJpYWwsIE1lc2gsIEpTT05Mb2FkZXJ9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uY2F2ZU1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGxvYWRlcjogbmV3IEpTT05Mb2FkZXIoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICBpZiAodGhpcy5wYXJhbXMucGF0aCAmJiB0aGlzLnBhcmFtcy5sb2FkZXIpIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnlMb2FkZXIgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMucGFyYW1zLmxvYWRlci5sb2FkKFxuICAgICAgICAgIHRoaXMucGFyYW1zLnBhdGgsXG4gICAgICAgICAgcmVzb2x2ZSxcbiAgICAgICAgICAoKSA9PiB7fSxcbiAgICAgICAgICByZWplY3RcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGdlb21ldHJ5UHJvY2Vzc29yKGdlb21ldHJ5KSB7XG4gICAgY29uc3QgaXNCdWZmZXIgPSBnZW9tZXRyeS50eXBlID09PSAnQnVmZmVyR2VvbWV0cnknO1xuXG4gICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICBjb25zdCBkYXRhID0gaXNCdWZmZXIgP1xuICAgICAgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6XG4gICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDkpO1xuXG4gICAgaWYgKCFpc0J1ZmZlcikge1xuICAgICAgY29uc3QgdmVydGljZXMgPSBnZW9tZXRyeS52ZXJ0aWNlcztcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICAgICAgY29uc3QgdkEgPSB2ZXJ0aWNlc1tmYWNlLmFdO1xuICAgICAgICBjb25zdCB2QiA9IHZlcnRpY2VzW2ZhY2UuYl07XG4gICAgICAgIGNvbnN0IHZDID0gdmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgICBjb25zdCBpOSA9IGkgKiA5O1xuXG4gICAgICAgIGRhdGFbaTldID0gdkEueDtcbiAgICAgICAgZGF0YVtpOSArIDFdID0gdkEueTtcbiAgICAgICAgZGF0YVtpOSArIDJdID0gdkEuejtcblxuICAgICAgICBkYXRhW2k5ICsgM10gPSB2Qi54O1xuICAgICAgICBkYXRhW2k5ICsgNF0gPSB2Qi55O1xuICAgICAgICBkYXRhW2k5ICsgNV0gPSB2Qi56O1xuXG4gICAgICAgIGRhdGFbaTkgKyA2XSA9IHZDLng7XG4gICAgICAgIGRhdGFbaTkgKyA3XSA9IHZDLnk7XG4gICAgICAgIGRhdGFbaTkgKyA4XSA9IHZDLno7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnY29uY2F2ZScsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZVxuICAgIH07XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSwgc2VsZikge1xuICAgICAgaWYgKHNlbGYucGFyYW1zLnBhdGgpIHtcbiAgICAgICAgdGhpcy53YWl0KHNlbGYuZ2VvbWV0cnlMb2FkZXIpO1xuXG4gICAgICAgIHNlbGYuZ2VvbWV0cnlMb2FkZXJcbiAgICAgICAgICAudGhlbihnZW9tID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3BoeXNpanMuZGF0YSA9IHNlbGYuZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbSlcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3BoeXNpanMuZGF0YSA9IHNlbGYuZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIENvbmVNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbWFzczogMTAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgICByZXN0aXR1dGlvbjogMC4zLFxuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDBcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnY29uZScsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICB9O1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICB0aGlzLl9waHlzaWpzLnJhZGl1cyA9IChnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54KSAvIDI7XG4gICAgICB0aGlzLl9waHlzaWpzLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IHtWZWN0b3IzLCBCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDb252ZXhNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbWFzczogMTAsXG4gICAgICByZXN0aXR1dGlvbjogMC4zLFxuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnY29udmV4JyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICAgIGdyb3VwOiBwYXJhbXMuZ3JvdXAsXG4gICAgICBtYXNrOiBwYXJhbXMubWFzayxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICByZXN0aXR1dGlvbjogcGFyYW1zLnJlc3RpdHV0aW9uLFxuICAgICAgZGFtcGluZzogcGFyYW1zLmRhbXBpbmcsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG1lc2gobWVzaCkge1xuICAgICAgY29uc3QgZ2VvbWV0cnkgPSBtZXNoLmdlb21ldHJ5O1xuXG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgY29uc3QgaXNCdWZmZXIgPSBnZW9tZXRyeS50eXBlID09PSAnQnVmZmVyR2VvbWV0cnknO1xuXG4gICAgICBpZiAoIWlzQnVmZmVyKSBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKS5mcm9tR2VvbWV0cnkoZ2VvbWV0cnkpO1xuXG4gICAgICBjb25zdCBkYXRhID0gaXNCdWZmZXIgP1xuICAgICAgICBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDpcbiAgICAgICAgZ2VvbWV0cnkuX2J1ZmZlckdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMuZGF0YSA9IGRhdGE7XG5cbiAgICAgIHJldHVybiBtZXNoO1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yM30gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBDeWxpbmRlck1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdjeWxpbmRlcicsXG4gICAgICB3aWR0aDogcGFyYW1zLndpZHRoLFxuICAgICAgaGVpZ2h0OiBwYXJhbXMuaGVpZ2h0LFxuICAgICAgZGVwdGg6IHBhcmFtcy5kZXB0aCxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICBzY2FsZTogcGFyYW1zLnNjYWxlXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICB0aGlzLl9waHlzaWpzLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICB0aGlzLl9waHlzaWpzLmRlcHRoID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yMiwgVmVjdG9yMywgQnVmZmVyR2VvbWV0cnl9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7d3JhcFBoeXNpY3NQcm90b3R5cGUsIG9uQ29weSwgb25XcmFwfSBmcm9tICcuL3BoeXNpY3NQcm90b3R5cGUnO1xuXG5leHBvcnQgY2xhc3MgSGVpZ2h0ZmllbGRNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbWFzczogMTAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgICBzaXplOiBuZXcgVmVjdG9yMigxLCAxKSxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGF1dG9BbGlnbjogZmFsc2VcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnaGVpZ2h0ZmllbGQnLFxuICAgICAgZnJpY3Rpb246IHBhcmFtcy5mcmljdGlvbixcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIHJlc3RpdHV0aW9uOiBwYXJhbXMucmVzdGl0dXRpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICAgIHBvaW50czogcGFyYW1zLnBvaW50cyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5LCBzZWxmKSB7XG4gICAgICBjb25zdCBpc0J1ZmZlciA9IGdlb21ldHJ5IGluc3RhbmNlb2YgQnVmZmVyR2VvbWV0cnk7XG4gICAgICBjb25zdCB2ZXJ0cyA9IGlzQnVmZmVyID8gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6IGdlb21ldHJ5LnZlcnRpY2VzO1xuXG4gICAgICBsZXQgc2l6ZSA9IGlzQnVmZmVyID8gdmVydHMubGVuZ3RoIC8gMyA6IHZlcnRzLmxlbmd0aDtcblxuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGNvbnN0IHhkaXYgPSBzZWxmLnBhcmFtcy5zaXplLng7XG4gICAgICBjb25zdCB5ZGl2ID0gc2VsZi5wYXJhbXMuc2l6ZS55O1xuXG4gICAgICBjb25zdCB4c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBjb25zdCB5c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMueHB0cyA9ICh0eXBlb2YgeGRpdiA9PT0gJ3VuZGVmaW5lZCcpID8gTWF0aC5zcXJ0KHNpemUpIDogeGRpdiArIDE7XG4gICAgICB0aGlzLl9waHlzaWpzLnlwdHMgPSAodHlwZW9mIHlkaXYgPT09ICd1bmRlZmluZWQnKSA/IE1hdGguc3FydChzaXplKSA6IHlkaXYgKyAxO1xuXG4gICAgICAvLyBub3RlIC0gdGhpcyBhc3N1bWVzIG91ciBwbGFuZSBnZW9tZXRyeSBpcyBzcXVhcmUsIHVubGVzcyB3ZSBwYXNzIGluIHNwZWNpZmljIHhkaXYgYW5kIHlkaXZcbiAgICAgIHRoaXMuX3BoeXNpanMuYWJzTWF4SGVpZ2h0ID0gTWF0aC5tYXgoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnksIE1hdGguYWJzKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55KSk7XG5cbiAgICAgIGNvbnN0IHBvaW50cyA9IG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSksXG4gICAgICAgIHhwdHMgPSB0aGlzLl9waHlzaWpzLnhwdHMsXG4gICAgICAgIHlwdHMgPSB0aGlzLl9waHlzaWpzLnlwdHM7XG5cbiAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgY29uc3Qgdk51bSA9IHNpemUgJSB4cHRzICsgKCh5cHRzIC0gTWF0aC5yb3VuZCgoc2l6ZSAvIHhwdHMpIC0gKChzaXplICUgeHB0cykgLyB4cHRzKSkgLSAxKSAqIHlwdHMpO1xuXG4gICAgICAgIGlmIChpc0J1ZmZlcikgcG9pbnRzW3NpemVdID0gdmVydHNbdk51bSAqIDMgKyAxXTtcbiAgICAgICAgZWxzZSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtXS55O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9waHlzaWpzLnBvaW50cyA9IHBvaW50cztcblxuICAgICAgdGhpcy5fcGh5c2lqcy5zY2FsZS5tdWx0aXBseShcbiAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoeHNpemUgLyAoeHB0cyAtIDEpLCAxLCB5c2l6ZSAvICh5cHRzIC0gMSkpXG4gICAgICApO1xuXG4gICAgICBpZiAoc2VsZi5wYXJhbXMuYXV0b0FsaWduKSBnZW9tZXRyeS50cmFuc2xhdGUoeHNpemUgLyAtMiwgMCwgeXNpemUgLyAtMik7XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9LFxuXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIFBsYW5lTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG1hc3M6IDEwLFxuICAgICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgICBkYW1waW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgcGFyYW1zID0gc2VsZi5wYXJhbXM7XG5cbiAgICB0aGlzLl9waHlzaWpzID0ge1xuICAgICAgdHlwZTogJ3BsYW5lJyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy53aWR0aCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICB0aGlzLl9waHlzaWpzLmhlaWdodCA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICB0aGlzLl9waHlzaWpzLm5vcm1hbCA9IGdlb21ldHJ5LmZhY2VzWzBdLm5vcm1hbC5jbG9uZSgpO1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIFNwaGVyZU1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHRoaXMucGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBtYXNzOiAxMCxcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIHByZXNzdXJlOiAxMDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBrbHN0OiAwLjksXG4gICAgICBrdnN0OiAwLjksXG4gICAgICBrYXN0OiAwLjksXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcbiAgICB9LCBwYXJhbXMpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBzZWxmLnBhcmFtcztcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICB0eXBlOiAnc3BoZXJlJyxcbiAgICAgIHRvdWNoZXM6IFtdLFxuICAgICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgbWFzazogcGFyYW1zLm1hc2ssXG4gICAgICBmcmljdGlvbjogcGFyYW1zLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHBhcmFtcy5yZXN0aXR1dGlvbixcbiAgICAgIGRhbXBpbmc6IHBhcmFtcy5kYW1waW5nLFxuICAgICAgbWFyZ2luOiBwYXJhbXMubWFyZ2luLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzXG4gICAgfTtcblxuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIGdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nU3BoZXJlKSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdTcGhlcmUoKTtcbiAgICAgIHRoaXMuX3BoeXNpanMucmFkaXVzID0gZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUucmFkaXVzO1xuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0sXG5cbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yMywgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHt3cmFwUGh5c2ljc1Byb3RvdHlwZSwgb25Db3B5LCBvbldyYXB9IGZyb20gJy4vcGh5c2ljc1Byb3RvdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBTb2Z0Ym9keU1vZHVsZXtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgdGhpcy5wYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgICBmcmljdGlvbjogMC44LFxuICAgICAgZGFtcGluZzogMCxcbiAgICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICAgIHByZXNzdXJlOiAxMDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBrbHN0OiAwLjksXG4gICAgICBrdnN0OiAwLjksXG4gICAgICBrYXN0OiAwLjksXG4gICAgICBwaXRlcmF0aW9uczogMSxcbiAgICAgIHZpdGVyYXRpb25zOiAwLFxuICAgICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgICBjaXRlcmF0aW9uczogNCxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgICByaWdpZEhhcmRuZXNzOiAxXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuX3BoeXNpanMuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QuX3BoeXNpanMuaWQ7XG5cbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdzb2Z0VHJpbWVzaCcsXG4gICAgICBtYXNzOiBwYXJhbXMubWFzcyxcbiAgICAgIHNjYWxlOiBwYXJhbXMuc2NhbGUsXG4gICAgICB0b3VjaGVzOiBbXSxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIHByZXNzdXJlOiBwYXJhbXMucHJlc3N1cmUsXG4gICAgICBtYXJnaW46IHBhcmFtcy5tYXJnaW4sXG4gICAgICBrbHN0OiBwYXJhbXMua2xzdCxcbiAgICAgIGlzU29mdGJvZHk6IHRydWUsXG4gICAgICBrYXN0OiBwYXJhbXMua2FzdCxcbiAgICAgIGt2c3Q6IHBhcmFtcy5rdnN0LFxuICAgICAgZHJhZzogcGFyYW1zLmRyYWcsXG4gICAgICBsaWZ0OiBwYXJhbXMubGlmdCxcbiAgICAgIHBpdGVyYXRpb25zOiBwYXJhbXMucGl0ZXJhdGlvbnMsXG4gICAgICB2aXRlcmF0aW9uczogcGFyYW1zLnZpdGVyYXRpb25zLFxuICAgICAgZGl0ZXJhdGlvbnM6IHBhcmFtcy5kaXRlcmF0aW9ucyxcbiAgICAgIGNpdGVyYXRpb25zOiBwYXJhbXMuY2l0ZXJhdGlvbnMsXG4gICAgICBhbmNob3JIYXJkbmVzczogcGFyYW1zLmFuY2hvckhhcmRuZXNzLFxuICAgICAgcmlnaWRIYXJkbmVzczogcGFyYW1zLnJpZ2lkSGFyZG5lc3NcbiAgICB9O1xuXG4gICAgdGhpcy5hcHBlbmRBbmNob3IgPSBzZWxmLmFwcGVuZEFuY2hvci5iaW5kKHRoaXMpO1xuXG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgZ2VvbWV0cnkoZ2VvbWV0cnksIHNlbGYpIHtcbiAgICAgIGNvbnN0IGlkeEdlb21ldHJ5ID0gZ2VvbWV0cnkgaW5zdGFuY2VvZiBCdWZmZXJHZW9tZXRyeVxuICAgICAgICA/IGdlb21ldHJ5XG4gICAgICAgIDogKCgpID0+IHtcbiAgICAgICAgICBnZW9tZXRyeS5tZXJnZVZlcnRpY2VzKCk7XG5cbiAgICAgICAgICBjb25zdCBidWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IChnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAzID4gNjU1MzUgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5KShnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgKS5jb3B5SW5kaWNlc0FycmF5KGdlb21ldHJ5LmZhY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZmVyR2VvbWV0cnk7XG4gICAgICAgIH0pKCk7XG5cbiAgICAgIGNvbnN0IGFWZXJ0aWNlcyA9IGlkeEdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgICBjb25zdCBhSW5kaWNlcyA9IGlkeEdlb21ldHJ5LmluZGV4LmFycmF5O1xuXG4gICAgICB0aGlzLl9waHlzaWpzLmFWZXJ0aWNlcyA9IGFWZXJ0aWNlcztcbiAgICAgIHRoaXMuX3BoeXNpanMuYUluZGljZXMgPSBhSW5kaWNlcztcblxuICAgICAgY29uc3QgbmR4R2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKS5mcm9tR2VvbWV0cnkoZ2VvbWV0cnkpO1xuXG4gICAgICByZXR1cm4gbmR4R2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzLCBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIENsb3RoTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zID0ge30pIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgICBrbHN0OiAwLjksXG4gICAgICBrdnN0OiAwLjksXG4gICAgICBrYXN0OiAwLjksXG4gICAgICBwaXRlcmF0aW9uczogMSxcbiAgICAgIHZpdGVyYXRpb25zOiAwLFxuICAgICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgICBjaXRlcmF0aW9uczogNCxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgICByaWdpZEhhcmRuZXNzOiAxXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuX3BoeXNpanMuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QuX3BoeXNpanMuaWQ7XG5cbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdzb2Z0Q2xvdGhNZXNoJyxcbiAgICAgIG1hc3M6IHBhcmFtcy5tYXNzLFxuICAgICAgdG91Y2hlczogW10sXG4gICAgICBpc1NvZnRib2R5OiB0cnVlLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZSxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICAgIGtsc3Q6IHBhcmFtcy5rbHN0LFxuICAgICAga2FzdDogcGFyYW1zLmthc3QsXG4gICAgICBrdnN0OiBwYXJhbXMua3ZzdCxcbiAgICAgIGRyYWc6IHBhcmFtcy5kcmFnLFxuICAgICAgbGlmdDogcGFyYW1zLmxpZnQsXG4gICAgICBwaXRlcmF0aW9uczogcGFyYW1zLnBpdGVyYXRpb25zLFxuICAgICAgdml0ZXJhdGlvbnM6IHBhcmFtcy52aXRlcmF0aW9ucyxcbiAgICAgIGRpdGVyYXRpb25zOiBwYXJhbXMuZGl0ZXJhdGlvbnMsXG4gICAgICBjaXRlcmF0aW9uczogcGFyYW1zLmNpdGVyYXRpb25zLFxuICAgICAgYW5jaG9ySGFyZG5lc3M6IHBhcmFtcy5hbmNob3JIYXJkbmVzcyxcbiAgICAgIHJpZ2lkSGFyZG5lc3M6IHBhcmFtcy5yaWdpZEhhcmRuZXNzLFxuICAgICAgc2NhbGU6IHBhcmFtcy5zY2FsZVxuICAgIH07XG5cbiAgICB0aGlzLmFwcGVuZEFuY2hvciA9IHNlbGYuYXBwZW5kQW5jaG9yLmJpbmQodGhpcyk7XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSwgc2VsZikge1xuICAgICAgY29uc3QgZ2VvbVBhcmFtcyA9IGdlb21ldHJ5LnBhcmFtZXRlcnM7XG5cbiAgICAgIGNvbnN0IGdlb20gPSBnZW9tZXRyeSBpbnN0YW5jZW9mIEJ1ZmZlckdlb21ldHJ5XG4gICAgICAgID8gZ2VvbWV0cnlcbiAgICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgZ2VvbWV0cnkubWVyZ2VWZXJ0aWNlcygpO1xuXG4gICAgICAgICAgY29uc3QgYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBjb25zdCBmYWNlcyA9IGdlb21ldHJ5LmZhY2VzLCBmYWNlc0xlbmd0aCA9IGZhY2VzLmxlbmd0aDtcbiAgICAgICAgICBjb25zdCBub3JtYWxzQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZhY2VzTGVuZ3RoICogMyk7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY2VzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGkzID0gaSAqIDM7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwgPSBmYWNlc1tpXS5ub3JtYWwgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzXSA9IG5vcm1hbC54O1xuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzICsgMV0gPSBub3JtYWwueTtcbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpMyArIDJdID0gbm9ybWFsLno7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ25vcm1hbCcsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBub3JtYWxzQXJyYXksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuc2V0SW5kZXgoXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgKGZhY2VzTGVuZ3RoICogMyA+IDY1NTM1ID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheSkoZmFjZXNMZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgKS5jb3B5SW5kaWNlc0FycmF5KGZhY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZmVyR2VvbWV0cnk7XG4gICAgICAgIH0pKCk7XG5cbiAgICAgIGNvbnN0IHZlcnRzID0gZ2VvbS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgICBpZiAoIWdlb21QYXJhbXMud2lkdGhTZWdtZW50cykgZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzID0gMTtcbiAgICAgIGlmICghZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cykgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyA9IDE7XG5cbiAgICAgIGNvbnN0IGlkeDAwID0gMDtcbiAgICAgIGNvbnN0IGlkeDAxID0gZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzO1xuICAgICAgY29uc3QgaWR4MTAgPSAoZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDEpICogKGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEpIC0gKGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEpO1xuICAgICAgY29uc3QgaWR4MTEgPSB2ZXJ0cy5sZW5ndGggLyAzIC0gMTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy5jb3JuZXJzID0gW1xuICAgICAgICB2ZXJ0c1tpZHgwMSAqIDNdLCB2ZXJ0c1tpZHgwMSAqIDMgKyAxXSwgdmVydHNbaWR4MDEgKiAzICsgMl0sIC8vICAg4pWXXG4gICAgICAgIHZlcnRzW2lkeDAwICogM10sIHZlcnRzW2lkeDAwICogMyArIDFdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAyXSwgLy8g4pWUXG4gICAgICAgIHZlcnRzW2lkeDExICogM10sIHZlcnRzW2lkeDExICogMyArIDFdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAyXSwgLy8gICAgICAg4pWdXG4gICAgICAgIHZlcnRzW2lkeDEwICogM10sIHZlcnRzW2lkeDEwICogMyArIDFdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAyXSwgLy8gICAgIOKVmlxuICAgICAgXTtcblxuICAgICAgdGhpcy5fcGh5c2lqcy5zZWdtZW50cyA9IFtnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxLCBnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzICsgMV07XG5cbiAgICAgIHJldHVybiBnZW9tO1xuICAgIH0sXG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9XG59O1xuIiwiaW1wb3J0IHtWZWN0b3IzLCBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQge3dyYXBQaHlzaWNzUHJvdG90eXBlLCBvbkNvcHksIG9uV3JhcH0gZnJvbSAnLi9waHlzaWNzUHJvdG90eXBlJztcblxuZXhwb3J0IGNsYXNzIFJvcGVNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICB0aGlzLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgZnJpY3Rpb246IDAuOCxcbiAgICAgIGRhbXBpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBrbHN0OiAwLjksXG4gICAgICBrdnN0OiAwLjksXG4gICAgICBrYXN0OiAwLjksXG4gICAgICBwaXRlcmF0aW9uczogMSxcbiAgICAgIHZpdGVyYXRpb25zOiAwLFxuICAgICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgICBjaXRlcmF0aW9uczogNCxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgICByaWdpZEhhcmRuZXNzOiAxXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuX3BoeXNpanMuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QuX3BoeXNpanMuaWQ7XG5cbiAgICBpZiAodGhpcy5tYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJykpIHRoaXMubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHBhcmFtcyA9IHNlbGYucGFyYW1zO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIHR5cGU6ICdzb2Z0Um9wZU1lc2gnLFxuICAgICAgbWFzczogcGFyYW1zLm1hc3MsXG4gICAgICB0b3VjaGVzOiBbXSxcbiAgICAgIGZyaWN0aW9uOiBwYXJhbXMuZnJpY3Rpb24sXG4gICAgICBkYW1waW5nOiBwYXJhbXMuZGFtcGluZyxcbiAgICAgIG1hcmdpbjogcGFyYW1zLm1hcmdpbixcbiAgICAgIGtsc3Q6IHBhcmFtcy5rbHN0LFxuICAgICAgaXNTb2Z0Ym9keTogdHJ1ZSxcbiAgICAgIGthc3Q6IHBhcmFtcy5rYXN0LFxuICAgICAga3ZzdDogcGFyYW1zLmt2c3QsXG4gICAgICBkcmFnOiBwYXJhbXMuZHJhZyxcbiAgICAgIGxpZnQ6IHBhcmFtcy5saWZ0LFxuICAgICAgcGl0ZXJhdGlvbnM6IHBhcmFtcy5waXRlcmF0aW9ucyxcbiAgICAgIHZpdGVyYXRpb25zOiBwYXJhbXMudml0ZXJhdGlvbnMsXG4gICAgICBkaXRlcmF0aW9uczogcGFyYW1zLmRpdGVyYXRpb25zLFxuICAgICAgY2l0ZXJhdGlvbnM6IHBhcmFtcy5jaXRlcmF0aW9ucyxcbiAgICAgIGFuY2hvckhhcmRuZXNzOiBwYXJhbXMuYW5jaG9ySGFyZG5lc3MsXG4gICAgICByaWdpZEhhcmRuZXNzOiBwYXJhbXMucmlnaWRIYXJkbmVzc1xuICAgIH07XG5cbiAgICB0aGlzLmFwcGVuZEFuY2hvciA9IHNlbGYuYXBwZW5kQW5jaG9yLmJpbmQodGhpcyk7XG5cbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBnZW9tZXRyeShnZW9tZXRyeSkge1xuICAgICAgaWYgKCEoZ2VvbWV0cnkgaW5zdGFuY2VvZiBCdWZmZXJHZW9tZXRyeSkpIHtcbiAgICAgICAgZ2VvbWV0cnkgPSAoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGJ1ZmYgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmYuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsZW5ndGggPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5Lmxlbmd0aCAvIDM7XG4gICAgICBjb25zdCB2ZXJ0ID0gbiA9PiBuZXcgVmVjdG9yMygpLmZyb21BcnJheShnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5LCBuKjMpO1xuXG4gICAgICBjb25zdCB2MSA9IHZlcnQoMCk7XG4gICAgICBjb25zdCB2MiA9IHZlcnQobGVuZ3RoIC0gMSk7XG5cbiAgICAgIHRoaXMuX3BoeXNpanMuZGF0YSA9IFtcbiAgICAgICAgdjEueCwgdjEueSwgdjEueixcbiAgICAgICAgdjIueCwgdjIueSwgdjIueixcbiAgICAgICAgbGVuZ3RoXG4gICAgICBdO1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSxcblxuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfVxufVxuIiwiaW1wb3J0IHtMb29wfSBmcm9tICd3aHMnO1xuXG5pbXBvcnQge1xuICBPYmplY3QzRCxcbiAgUXVhdGVybmlvbixcbiAgVmVjdG9yMyxcbiAgRXVsZXJcbn0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBQSV8yID0gTWF0aC5QSSAvIDI7XG5cbmZ1bmN0aW9uIEZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIoY2FtZXJhLCBtZXNoLCBwYXJhbXMpIHtcbiAgY29uc3QgdmVsb2NpdHlGYWN0b3IgPSAxO1xuICBsZXQgcnVuVmVsb2NpdHkgPSAwLjI1O1xuXG4gIG1lc2guc2V0QW5ndWxhckZhY3Rvcih7eDogMCwgeTogMCwgejogMH0pO1xuICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuXG4gIC8qIEluaXQgKi9cbiAgY29uc3QgcGxheWVyID0gbWVzaCxcbiAgICBwaXRjaE9iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHBpdGNoT2JqZWN0LmFkZChjYW1lcmEubmF0aXZlKTtcblxuICBjb25zdCB5YXdPYmplY3QgPSBuZXcgT2JqZWN0M0QoKTtcblxuICB5YXdPYmplY3QucG9zaXRpb24ueSA9IHBhcmFtcy55cG9zOyAvLyBleWVzIGFyZSAyIG1ldGVycyBhYm92ZSB0aGUgZ3JvdW5kXG4gIHlhd09iamVjdC5hZGQocGl0Y2hPYmplY3QpO1xuXG4gIGNvbnN0IHF1YXQgPSBuZXcgUXVhdGVybmlvbigpO1xuXG4gIGxldCBjYW5KdW1wID0gZmFsc2UsXG4gICAgLy8gTW92ZXMuXG4gICAgbW92ZUZvcndhcmQgPSBmYWxzZSxcbiAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZSxcbiAgICBtb3ZlTGVmdCA9IGZhbHNlLFxuICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuXG4gIHBsYXllci5vbignY29sbGlzaW9uJywgKG90aGVyT2JqZWN0LCB2LCByLCBjb250YWN0Tm9ybWFsKSA9PiB7XG4gICAgaWYgKGNvbnRhY3ROb3JtYWwueSA8IDAuNSkgLy8gVXNlIGEgXCJnb29kXCIgdGhyZXNob2xkIHZhbHVlIGJldHdlZW4gMCBhbmQgMSBoZXJlIVxuICAgICAgY2FuSnVtcCA9IHRydWU7XG4gIH0pO1xuXG4gIGNvbnN0IG9uTW91c2VNb3ZlID0gZXZlbnQgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBjb25zdCBtb3ZlbWVudFggPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WCA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFggPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WCgpIDogMDtcbiAgICBjb25zdCBtb3ZlbWVudFkgPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WSA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFkgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WSgpIDogMDtcblxuICAgIHlhd09iamVjdC5yb3RhdGlvbi55IC09IG1vdmVtZW50WCAqIDAuMDAyO1xuICAgIHBpdGNoT2JqZWN0LnJvdGF0aW9uLnggLT0gbW92ZW1lbnRZICogMC4wMDI7XG5cbiAgICBwaXRjaE9iamVjdC5yb3RhdGlvbi54ID0gTWF0aC5tYXgoLVBJXzIsIE1hdGgubWluKFBJXzIsIHBpdGNoT2JqZWN0LnJvdGF0aW9uLngpKTtcbiAgfTtcblxuICBjb25zdCBvbktleURvd24gPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDMyOiAvLyBzcGFjZVxuICAgICAgICBpZiAoY2FuSnVtcCA9PT0gdHJ1ZSkgcGxheWVyLmFwcGx5Q2VudHJhbEltcHVsc2Uoe3g6IDAsIHk6IDMwMCwgejogMH0pO1xuICAgICAgICBjYW5KdW1wID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuNTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IG9uS2V5VXAgPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICBtb3ZlTGVmdCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgY2FzZSA4MzogLy8gYVxuICAgICAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNjogLy8gc2hpZnRcbiAgICAgICAgcnVuVmVsb2NpdHkgPSAwLjI1O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24sIGZhbHNlKTtcbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIG9uS2V5VXAsIGZhbHNlKTtcblxuICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgdGhpcy5nZXRPYmplY3QgPSAoKSA9PiB5YXdPYmplY3Q7XG5cbiAgdGhpcy5nZXREaXJlY3Rpb24gPSB0YXJnZXRWZWMgPT4ge1xuICAgIHRhcmdldFZlYy5zZXQoMCwgMCwgLTEpO1xuICAgIHF1YXQubXVsdGlwbHlWZWN0b3IzKHRhcmdldFZlYyk7XG4gIH07XG5cbiAgLy8gTW92ZXMgdGhlIGNhbWVyYSB0byB0aGUgUGh5c2kuanMgb2JqZWN0IHBvc2l0aW9uXG4gIC8vIGFuZCBhZGRzIHZlbG9jaXR5IHRvIHRoZSBvYmplY3QgaWYgdGhlIHJ1biBrZXkgaXMgZG93bi5cbiAgY29uc3QgaW5wdXRWZWxvY2l0eSA9IG5ldyBWZWN0b3IzKCksXG4gICAgZXVsZXIgPSBuZXcgRXVsZXIoKTtcblxuICB0aGlzLnVwZGF0ZSA9IGRlbHRhID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgZGVsdGEgPSBkZWx0YSB8fCAwLjU7XG4gICAgZGVsdGEgPSBNYXRoLm1pbihkZWx0YSwgMC41LCBkZWx0YSk7XG5cbiAgICBpbnB1dFZlbG9jaXR5LnNldCgwLCAwLCAwKTtcblxuICAgIGNvbnN0IHNwZWVkID0gdmVsb2NpdHlGYWN0b3IgKiBkZWx0YSAqIHBhcmFtcy5zcGVlZCAqIHJ1blZlbG9jaXR5O1xuXG4gICAgaWYgKG1vdmVGb3J3YXJkKSBpbnB1dFZlbG9jaXR5LnogPSAtc3BlZWQ7XG4gICAgaWYgKG1vdmVCYWNrd2FyZCkgaW5wdXRWZWxvY2l0eS56ID0gc3BlZWQ7XG4gICAgaWYgKG1vdmVMZWZ0KSBpbnB1dFZlbG9jaXR5LnggPSAtc3BlZWQ7XG4gICAgaWYgKG1vdmVSaWdodCkgaW5wdXRWZWxvY2l0eS54ID0gc3BlZWQ7XG5cbiAgICAvLyBDb252ZXJ0IHZlbG9jaXR5IHRvIHdvcmxkIGNvb3JkaW5hdGVzXG4gICAgZXVsZXIueCA9IHBpdGNoT2JqZWN0LnJvdGF0aW9uLng7XG4gICAgZXVsZXIueSA9IHlhd09iamVjdC5yb3RhdGlvbi55O1xuICAgIGV1bGVyLm9yZGVyID0gJ1hZWic7XG5cbiAgICBxdWF0LnNldEZyb21FdWxlcihldWxlcik7XG5cbiAgICBpbnB1dFZlbG9jaXR5LmFwcGx5UXVhdGVybmlvbihxdWF0KTtcblxuICAgIHBsYXllci5hcHBseUNlbnRyYWxJbXB1bHNlKHt4OiBpbnB1dFZlbG9jaXR5LngsIHk6IDAsIHo6IGlucHV0VmVsb2NpdHkuen0pO1xuICAgIHBsYXllci5zZXRBbmd1bGFyVmVsb2NpdHkoe3g6IGlucHV0VmVsb2NpdHkueiwgeTogMCwgejogLWlucHV0VmVsb2NpdHkueH0pO1xuICAgIHBsYXllci5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIH07XG5cbiAgcGxheWVyLm9uKCdwaHlzaWNzOmFkZGVkJywgKCkgPT4ge1xuICAgIHBsYXllci5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuYWRkRXZlbnRMaXN0ZW5lcigndXBkYXRlJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgIHlhd09iamVjdC5wb3NpdGlvbi5jb3B5KHBsYXllci5wb3NpdGlvbik7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgRmlyc3RQZXJzb25Nb2R1bGUge1xuICBzdGF0aWMgZGVmYXVsdHMgPSB7XG4gICAgYmxvY2s6IG51bGwsXG4gICAgc3BlZWQ6IDEsXG4gICAgeXBvczogMVxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKG9iamVjdCwgcGFyYW1zID0ge30pIHtcbiAgICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcblxuICAgIGlmICghdGhpcy5wYXJhbXMuYmxvY2spIHtcbiAgICAgIHRoaXMucGFyYW1zLmJsb2NrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jsb2NrZXInKTtcbiAgICB9XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICB0aGlzLmNvbnRyb2xzID0gbmV3IEZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIobWFuYWdlci5nZXQoJ2NhbWVyYScpLCB0aGlzLm9iamVjdCwgdGhpcy5wYXJhbXMpO1xuXG4gICAgaWYgKCdwb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnbW96UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudFxuICAgICAgfHwgJ3dlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuXG4gICAgICBjb25zdCBwb2ludGVybG9ja2NoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKGRvY3VtZW50LnBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgIHx8IGRvY3VtZW50Lm1velBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgIHx8IGRvY3VtZW50LndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5wYXJhbXMuYmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnRyb2xzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuXG4gICAgICBjb25zdCBwb2ludGVybG9ja2Vycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1BvaW50ZXIgbG9jayBlcnJvci4nKTtcbiAgICAgIH07XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcblxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jayA9IGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RQb2ludGVyTG9jaztcblxuICAgICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuID0gZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxzY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbjtcblxuICAgICAgICBpZiAoL0ZpcmVmb3gvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgY29uc3QgZnVsbHNjcmVlbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICB8fCBkb2N1bWVudC5tb3pGdWxsc2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICB8fCBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSk7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcblxuICAgICAgICAgICAgICBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSwgZmFsc2UpO1xuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgICAgIH0gZWxzZSBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jaygpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGNvbnNvbGUud2FybignWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdGhlIFBvaW50ZXJMb2NrIFdIUy5BUEkuJyk7XG5cbiAgICBtYW5hZ2VyLmdldCgnc2NlbmUnKS5hZGQodGhpcy5jb250cm9scy5nZXRPYmplY3QoKSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHVwZGF0ZVByb2Nlc3NvciA9IGMgPT4ge1xuICAgICAgc2VsZi5jb250cm9scy51cGRhdGUoYy5nZXREZWx0YSgpKTtcbiAgICB9O1xuXG4gICAgc2VsZi51cGRhdGVMb29wID0gbmV3IExvb3AodXBkYXRlUHJvY2Vzc29yKS5zdGFydCh0aGlzKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIk1FU1NBR0VfVFlQRVMiLCJSRVBPUlRfSVRFTVNJWkUiLCJDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUiLCJWRUhJQ0xFUkVQT1JUX0lURU1TSVpFIiwiQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSIsInRlbXAxVmVjdG9yMyIsIlZlY3RvcjMiLCJ0ZW1wMlZlY3RvcjMiLCJ0ZW1wMU1hdHJpeDQiLCJNYXRyaXg0IiwidGVtcDFRdWF0IiwiUXVhdGVybmlvbiIsImdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24iLCJ4IiwieSIsInoiLCJ3IiwiTWF0aCIsImF0YW4yIiwiYXNpbiIsImdldFF1YXRlcnRpb25Gcm9tRXVsZXIiLCJjMSIsImNvcyIsInMxIiwic2luIiwiYzIiLCJzMiIsImMzIiwiczMiLCJjMWMyIiwiczFzMiIsImNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QiLCJwb3NpdGlvbiIsIm9iamVjdCIsImlkZW50aXR5IiwibWFrZVJvdGF0aW9uRnJvbVF1YXRlcm5pb24iLCJxdWF0ZXJuaW9uIiwiZ2V0SW52ZXJzZSIsImNvcHkiLCJzdWIiLCJhcHBseU1hdHJpeDQiLCJhZGRPYmplY3RDaGlsZHJlbiIsInBhcmVudCIsImkiLCJjaGlsZHJlbiIsImxlbmd0aCIsImNoaWxkIiwiX3BoeXNpanMiLCJjb21wb25lbnQiLCJ1cGRhdGVNYXRyaXgiLCJ1cGRhdGVNYXRyaXhXb3JsZCIsInNldEZyb21NYXRyaXhQb3NpdGlvbiIsIm1hdHJpeFdvcmxkIiwic2V0RnJvbVJvdGF0aW9uTWF0cml4IiwicG9zaXRpb25fb2Zmc2V0Iiwicm90YXRpb24iLCJwdXNoIiwiRXZlbnRhYmxlIiwiX2V2ZW50TGlzdGVuZXJzIiwiZXZlbnRfbmFtZSIsImNhbGxiYWNrIiwiaGFzT3duUHJvcGVydHkiLCJpbmRleCIsImluZGV4T2YiLCJzcGxpY2UiLCJwYXJhbWV0ZXJzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJvYmoiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImRpc3BhdGNoRXZlbnQiLCJDb25lVHdpc3RDb25zdHJhaW50Iiwib2JqYSIsIm9iamIiLCJvYmplY3RhIiwib2JqZWN0YiIsInVuZGVmaW5lZCIsImNvbnNvbGUiLCJlcnJvciIsInR5cGUiLCJhcHBsaWVkSW1wdWxzZSIsIndvcmxkTW9kdWxlIiwiaWQiLCJwb3NpdGlvbmEiLCJjbG9uZSIsInBvc2l0aW9uYiIsImF4aXNhIiwiYXhpc2IiLCJleGVjdXRlIiwiY29uc3RyYWludCIsIm1heF9pbXB1bHNlIiwidGFyZ2V0IiwiVEhSRUUiLCJzZXRGcm9tRXVsZXIiLCJFdWxlciIsIkhpbmdlQ29uc3RyYWludCIsImF4aXMiLCJsb3ciLCJoaWdoIiwiYmlhc19mYWN0b3IiLCJyZWxheGF0aW9uX2ZhY3RvciIsInZlbG9jaXR5IiwiYWNjZWxlcmF0aW9uIiwiUG9pbnRDb25zdHJhaW50IiwiU2xpZGVyQ29uc3RyYWludCIsImxpbl9sb3dlciIsImxpbl91cHBlciIsImFuZ19sb3dlciIsImFuZ191cHBlciIsImxpbmVhciIsImFuZ3VsYXIiLCJzY2VuZSIsIkRPRkNvbnN0cmFpbnQiLCJsaW1pdCIsIndoaWNoIiwibG93X2FuZ2xlIiwiaGlnaF9hbmdsZSIsIm1heF9mb3JjZSIsIlZlaGljbGUiLCJtZXNoIiwidHVuaW5nIiwiVmVoaWNsZVR1bmluZyIsIndoZWVscyIsImdldE9iamVjdElkIiwic3VzcGVuc2lvbl9zdGlmZm5lc3MiLCJzdXNwZW5zaW9uX2NvbXByZXNzaW9uIiwic3VzcGVuc2lvbl9kYW1waW5nIiwibWF4X3N1c3BlbnNpb25fdHJhdmVsIiwiZnJpY3Rpb25fc2xpcCIsIm1heF9zdXNwZW5zaW9uX2ZvcmNlIiwid2hlZWxfZ2VvbWV0cnkiLCJ3aGVlbF9tYXRlcmlhbCIsImNvbm5lY3Rpb25fcG9pbnQiLCJ3aGVlbF9kaXJlY3Rpb24iLCJ3aGVlbF9heGxlIiwic3VzcGVuc2lvbl9yZXN0X2xlbmd0aCIsIndoZWVsX3JhZGl1cyIsImlzX2Zyb250X3doZWVsIiwid2hlZWwiLCJNZXNoIiwiY2FzdFNoYWRvdyIsInJlY2VpdmVTaGFkb3ciLCJtdWx0aXBseVNjYWxhciIsImFkZCIsIndvcmxkIiwiYW1vdW50Iiwic3RlZXJpbmciLCJicmFrZSIsImZvcmNlIiwiV29ybGRNb2R1bGUiLCJwYXJhbXMiLCJicmlkZ2UiLCJzZWxmIiwiZGVmZXIiLCJvbkFkZENhbGxiYWNrIiwiYmluZCIsIm9uUmVtb3ZlQ2FsbGJhY2siLCJPYmplY3QiLCJhc3NpZ24iLCJzdGFydCIsInBlcmZvcm1hbmNlIiwibm93Iiwid29ya2VyIiwicmVxdWlyZSIsInRyYW5zZmVyYWJsZU1lc3NhZ2UiLCJ3ZWJraXRQb3N0TWVzc2FnZSIsInBvc3RNZXNzYWdlIiwiaXNMb2FkZWQiLCJsb2FkZXIiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIndhc20iLCJ0aGVuIiwicmVzcG9uc2UiLCJhcnJheUJ1ZmZlciIsIndhc21CdWZmZXIiLCJidWZmZXIiLCJfbWF0ZXJpYWxzX3JlZl9jb3VudHMiLCJfb2JqZWN0cyIsIl92ZWhpY2xlcyIsIl9jb25zdHJhaW50cyIsIl9pc19zaW11bGF0aW5nIiwiX2lkIiwiYWIiLCJBcnJheUJ1ZmZlciIsIlNVUFBPUlRfVFJBTlNGRVJBQkxFIiwiYnl0ZUxlbmd0aCIsIm9ubWVzc2FnZSIsImV2ZW50IiwiX3RlbXAiLCJkYXRhIiwiRmxvYXQzMkFycmF5IiwiV09STERSRVBPUlQiLCJ1cGRhdGVTY2VuZSIsIlNPRlRSRVBPUlQiLCJ1cGRhdGVTb2Z0Ym9kaWVzIiwiQ09MTElTSU9OUkVQT1JUIiwidXBkYXRlQ29sbGlzaW9ucyIsIlZFSElDTEVSRVBPUlQiLCJ1cGRhdGVWZWhpY2xlcyIsIkNPTlNUUkFJTlRSRVBPUlQiLCJ1cGRhdGVDb25zdHJhaW50cyIsImNtZCIsImxvZyIsInRlc3QiLCJkZWJ1ZyIsImRpciIsIm9mZnNldCIsIl9fZGlydHlQb3NpdGlvbiIsInNldCIsIl9fZGlydHlSb3RhdGlvbiIsImxpbmVhclZlbG9jaXR5IiwiYW5ndWxhclZlbG9jaXR5Iiwic2l6ZSIsImF0dHJpYnV0ZXMiLCJnZW9tZXRyeSIsInZvbHVtZVBvc2l0aW9ucyIsImFycmF5Iiwib2Zmc2V0VmVydCIsImlzU29mdEJvZHlSZXNldCIsInZvbHVtZU5vcm1hbHMiLCJub3JtYWwiLCJvZmZzIiwieDEiLCJ5MSIsInoxIiwibngxIiwibnkxIiwibnoxIiwieDIiLCJ5MiIsInoyIiwibngyIiwibnkyIiwibnoyIiwieDMiLCJ5MyIsInozIiwibngzIiwibnkzIiwibnozIiwiaTkiLCJuZWVkc1VwZGF0ZSIsIm54IiwibnkiLCJueiIsInZlaGljbGUiLCJleHRyYWN0Um90YXRpb24iLCJtYXRyaXgiLCJhZGRWZWN0b3JzIiwiY29sbGlzaW9ucyIsIm5vcm1hbF9vZmZzZXRzIiwib2JqZWN0MiIsImlkMSIsImoiLCJ0b3VjaGVzIiwiaWQyIiwiY29tcG9uZW50MiIsIl9waHlzaWpzMiIsInN1YlZlY3RvcnMiLCJnZXRMaW5lYXJWZWxvY2l0eSIsInRlbXAxIiwiZ2V0QW5ndWxhclZlbG9jaXR5IiwidGVtcDIiLCJub3JtYWxfb2Zmc2V0IiwiZW1pdCIsInNob3dfbWFya2VyIiwiZ2V0RGVmaW5pdGlvbiIsIm1hcmtlciIsIlNwaGVyZUdlb21ldHJ5IiwiTWVzaE5vcm1hbE1hdGVyaWFsIiwiQm94R2VvbWV0cnkiLCJuYXRpdmUiLCJtYW5hZ2VyIiwibWF0ZXJpYWwiLCJtYXRlcmlhbElkIiwid2lkdGgiLCJzY2FsZSIsImhlaWdodCIsImRlcHRoIiwicmVtb3ZlIiwicG9wIiwiZnVuYyIsImFyZ3MiLCJzZXRGaXhlZFRpbWVTdGVwIiwiZml4ZWRUaW1lU3RlcCIsInNldEdyYXZpdHkiLCJncmF2aXR5IiwiYWRkQ29uc3RyYWludCIsInNpbXVsYXRlIiwidGltZVN0ZXAiLCJtYXhTdWJTdGVwcyIsIl9zdGF0cyIsImJlZ2luIiwib2JqZWN0X2lkIiwidXBkYXRlIiwicG9zIiwiaXNTb2Z0Ym9keSIsInF1YXQiLCJlbmQiLCJzaW11bGF0ZUxvb3AiLCJMb29wIiwiY2xvY2siLCJnZXREZWx0YSIsImFwaSIsImhhcyIsImdldCIsImZhY3RvciIsInRocmVzaG9sZCIsInJhZGl1cyIsInByb3BlcnRpZXMiLCJfbmF0aXZlIiwidmVjdG9yMyIsInNjb3BlIiwiZGVmaW5lUHJvcGVydGllcyIsIl94IiwiX3kiLCJfeiIsIl9fY19yb3QiLCJvbkNoYW5nZSIsImV1bGVyIiwicm90Iiwid3JhcFBoeXNpY3NQcm90b3R5cGUiLCJrZXkiLCJkZWZpbmVQcm9wZXJ0eSIsIm9uQ29weSIsInNvdXJjZSIsIm9uV3JhcCIsIkJveE1vZHVsZSIsImJvdW5kaW5nQm94IiwiY29tcHV0ZUJvdW5kaW5nQm94IiwibWF4IiwibWluIiwibWFzcyIsImdyb3VwIiwibWFzayIsImZyaWN0aW9uIiwicmVzdGl0dXRpb24iLCJkYW1waW5nIiwibWFyZ2luIiwiQ29tcG91bmRNb2R1bGUiLCJDYXBzdWxlTW9kdWxlIiwiQ29uY2F2ZU1vZHVsZSIsInBhdGgiLCJ3YWl0IiwiZ2VvbWV0cnlMb2FkZXIiLCJnZW9tZXRyeVByb2Nlc3NvciIsImdlb20iLCJKU09OTG9hZGVyIiwibG9hZCIsImlzQnVmZmVyIiwiZmFjZXMiLCJ2ZXJ0aWNlcyIsImZhY2UiLCJ2QSIsImEiLCJ2QiIsImIiLCJ2QyIsImMiLCJDb25lTW9kdWxlIiwiQ29udmV4TW9kdWxlIiwiX2J1ZmZlckdlb21ldHJ5IiwiQnVmZmVyR2VvbWV0cnkiLCJmcm9tR2VvbWV0cnkiLCJDeWxpbmRlck1vZHVsZSIsIkhlaWdodGZpZWxkTW9kdWxlIiwidmVydHMiLCJ4ZGl2IiwieWRpdiIsInhzaXplIiwieXNpemUiLCJ4cHRzIiwic3FydCIsInlwdHMiLCJhYnNNYXhIZWlnaHQiLCJhYnMiLCJwb2ludHMiLCJ2TnVtIiwicm91bmQiLCJtdWx0aXBseSIsImF1dG9BbGlnbiIsInRyYW5zbGF0ZSIsIlZlY3RvcjIiLCJQbGFuZU1vZHVsZSIsIlNwaGVyZU1vZHVsZSIsImJvdW5kaW5nU3BoZXJlIiwiY29tcHV0ZUJvdW5kaW5nU3BoZXJlIiwiU29mdGJvZHlNb2R1bGUiLCJpZHhHZW9tZXRyeSIsIm1lcmdlVmVydGljZXMiLCJidWZmZXJHZW9tZXRyeSIsImFkZEF0dHJpYnV0ZSIsIkJ1ZmZlckF0dHJpYnV0ZSIsImNvcHlWZWN0b3Izc0FycmF5Iiwic2V0SW5kZXgiLCJVaW50MzJBcnJheSIsIlVpbnQxNkFycmF5IiwiY29weUluZGljZXNBcnJheSIsImFWZXJ0aWNlcyIsImFJbmRpY2VzIiwibmR4R2VvbWV0cnkiLCJub2RlIiwiaW5mbHVlbmNlIiwiY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyIsIm8xIiwibzIiLCJwcmVzc3VyZSIsImtsc3QiLCJrYXN0Iiwia3ZzdCIsImRyYWciLCJsaWZ0IiwicGl0ZXJhdGlvbnMiLCJ2aXRlcmF0aW9ucyIsImRpdGVyYXRpb25zIiwiY2l0ZXJhdGlvbnMiLCJhbmNob3JIYXJkbmVzcyIsInJpZ2lkSGFyZG5lc3MiLCJhcHBlbmRBbmNob3IiLCJDbG90aE1vZHVsZSIsImdlb21QYXJhbXMiLCJmYWNlc0xlbmd0aCIsIm5vcm1hbHNBcnJheSIsImkzIiwid2lkdGhTZWdtZW50cyIsImhlaWdodFNlZ21lbnRzIiwiaWR4MDAiLCJpZHgwMSIsImlkeDEwIiwiaWR4MTEiLCJjb3JuZXJzIiwic2VnbWVudHMiLCJSb3BlTW9kdWxlIiwiYnVmZiIsInZlcnQiLCJmcm9tQXJyYXkiLCJuIiwidjEiLCJ2MiIsIlBJXzIiLCJQSSIsIkZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIiLCJjYW1lcmEiLCJ2ZWxvY2l0eUZhY3RvciIsInJ1blZlbG9jaXR5Iiwic2V0QW5ndWxhckZhY3RvciIsInBsYXllciIsInBpdGNoT2JqZWN0IiwiT2JqZWN0M0QiLCJ5YXdPYmplY3QiLCJ5cG9zIiwiY2FuSnVtcCIsIm1vdmVCYWNrd2FyZCIsIm1vdmVMZWZ0IiwibW92ZVJpZ2h0Iiwib24iLCJvdGhlck9iamVjdCIsInYiLCJyIiwiY29udGFjdE5vcm1hbCIsIm9uTW91c2VNb3ZlIiwiZW5hYmxlZCIsIm1vdmVtZW50WCIsIm1vek1vdmVtZW50WCIsImdldE1vdmVtZW50WCIsIm1vdmVtZW50WSIsIm1vek1vdmVtZW50WSIsImdldE1vdmVtZW50WSIsIm9uS2V5RG93biIsImtleUNvZGUiLCJhcHBseUNlbnRyYWxJbXB1bHNlIiwib25LZXlVcCIsImJvZHkiLCJnZXRPYmplY3QiLCJnZXREaXJlY3Rpb24iLCJtdWx0aXBseVZlY3RvcjMiLCJ0YXJnZXRWZWMiLCJpbnB1dFZlbG9jaXR5IiwiZGVsdGEiLCJzcGVlZCIsIm1vdmVGb3J3YXJkIiwib3JkZXIiLCJhcHBseVF1YXRlcm5pb24iLCJzZXRBbmd1bGFyVmVsb2NpdHkiLCJGaXJzdFBlcnNvbk1vZHVsZSIsImJsb2NrIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImNvbnRyb2xzIiwiZWxlbWVudCIsInBvaW50ZXJsb2NrY2hhbmdlIiwicG9pbnRlckxvY2tFbGVtZW50IiwibW96UG9pbnRlckxvY2tFbGVtZW50Iiwid2Via2l0UG9pbnRlckxvY2tFbGVtZW50Iiwic3R5bGUiLCJkaXNwbGF5IiwicG9pbnRlcmxvY2tlcnJvciIsIndhcm4iLCJxdWVyeVNlbGVjdG9yIiwicmVxdWVzdFBvaW50ZXJMb2NrIiwibW96UmVxdWVzdFBvaW50ZXJMb2NrIiwid2Via2l0UmVxdWVzdFBvaW50ZXJMb2NrIiwicmVxdWVzdEZ1bGxzY3JlZW4iLCJtb3pSZXF1ZXN0RnVsbHNjcmVlbiIsIm1velJlcXVlc3RGdWxsU2NyZWVuIiwid2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4iLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJmdWxsc2NyZWVuY2hhbmdlIiwiZnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsc2NyZWVuRWxlbWVudCIsIm1vekZ1bGxTY3JlZW5FbGVtZW50IiwidXBkYXRlUHJvY2Vzc29yIiwidXBkYXRlTG9vcCIsImRlZmF1bHRzIl0sIm1hcHBpbmdzIjoiOzs7O0FBTUEsSUFBTUEsZ0JBQWdCO2VBQ1AsQ0FETzttQkFFSCxDQUZHO2lCQUdMLENBSEs7b0JBSUYsQ0FKRTtjQUtSO0NBTGQ7O0FBUUEsSUFBTUMsa0JBQWtCLEVBQXhCO0lBQ0VDLDJCQUEyQixDQUQ3QjtJQUVFQyx5QkFBeUIsQ0FGM0I7SUFHRUMsNEJBQTRCLENBSDlCOztBQUtBLElBQU1DLGVBQWUsSUFBSUMsT0FBSixFQUFyQjtJQUNFQyxlQUFlLElBQUlELE9BQUosRUFEakI7SUFF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
