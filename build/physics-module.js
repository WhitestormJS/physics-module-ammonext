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

  var REPORT_ITEMSIZE = 14,
      COLLISIONREPORT_ITEMSIZE = 5,
      VEHICLEREPORT_ITEMSIZE = 9,
      CONSTRAINTREPORT_ITEMSIZE = 6;

  var temp1Vector3 = new three.Vector3(),
      temp2Vector3 = new three.Vector3(),
      temp1Matrix4 = new three.Matrix4(),
      temp1Quat = new three.Quaternion();

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
        if (target instanceof three.Vector3) target = new three.Quaternion().setFromEuler(new three.Euler(target.x, target.y, target.z));else if (target instanceof three.Euler) target = new three.Quaternion().setFromEuler(target);else if (target instanceof three.Matrix4) target = new three.Quaternion().setFromRotationMatrix(target);

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
          self.simulateLoop = new whs.Loop(function (clock) {
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
    gravity: new three.Vector3(0, -100, 0)
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

          var bufferGeometry = new three.BufferGeometry();

          bufferGeometry.addAttribute('position', new three.BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

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

          bufferGeometry.addAttribute('normal', new three.BufferAttribute(normalsArray, 3));

          bufferGeometry.addAttribute('uv', new three.BufferAttribute(uvsArray, 2));

          bufferGeometry.setIndex(new three.BufferAttribute(new (arrayMax(faces) * 3 > 65535 ? Uint32Array : Uint16Array)(facesLength * 3), 1).copyIndicesArray(faces));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUuanMubWFwIiwic291cmNlcyI6WyIuLi9zcmMvYXBpLmpzIiwiLi4vc3JjL2V2ZW50YWJsZS5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Db25lVHdpc3RDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0hpbmdlQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Qb2ludENvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvU2xpZGVyQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9ET0ZDb25zdHJhaW50LmpzIiwiLi4vc3JjL3ZlaGljbGUvdmVoaWNsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL2NvcmUvV29ybGRNb2R1bGVCYXNlLmpzIiwiLi4vYnVuZGxlLXdvcmtlci93b3JrZXJoZWxwZXIuanMiLCIuLi9zcmMvd29ya2VyLmpzIiwiLi4vc3JjL21vZHVsZXMvV29ybGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb3JlL1BoeXNpY3NNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Cb3hNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db21wb3VuZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NhcHN1bGVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db25jYXZlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29uZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbnZleE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0N5bGluZGVyTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvSGVpZ2h0ZmllbGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9QbGFuZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NwaGVyZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NvZnRib2R5TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ2xvdGhNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Sb3BlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29udHJvbHMvRmlyc3RQZXJzb25Nb2R1bGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgVmVjdG9yMyxcbiAgTWF0cml4NCxcbiAgUXVhdGVybmlvblxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IE1FU1NBR0VfVFlQRVMgPSB7XG4gIFdPUkxEUkVQT1JUOiAwLFxuICBDT0xMSVNJT05SRVBPUlQ6IDEsXG4gIFZFSElDTEVSRVBPUlQ6IDIsXG4gIENPTlNUUkFJTlRSRVBPUlQ6IDMsXG4gIFNPRlRSRVBPUlQ6IDRcbn07XG5cbmNvbnN0IFJFUE9SVF9JVEVNU0laRSA9IDE0LFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgPSA1LFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFID0gOSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSA9IDY7XG5cbmNvbnN0IHRlbXAxVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAyVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAxTWF0cml4NCA9IG5ldyBNYXRyaXg0KCksXG4gIHRlbXAxUXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbmNvbnN0IGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24gPSAoeCwgeSwgeiwgdykgPT4ge1xuICByZXR1cm4gbmV3IFZlY3RvcjMoXG4gICAgTWF0aC5hdGFuMigyICogKHggKiB3IC0geSAqIHopLCAodyAqIHcgLSB4ICogeCAtIHkgKiB5ICsgeiAqIHopKSxcbiAgICBNYXRoLmFzaW4oMiAqICh4ICogeiArIHkgKiB3KSksXG4gICAgTWF0aC5hdGFuMigyICogKHogKiB3IC0geCAqIHkpLCAodyAqIHcgKyB4ICogeCAtIHkgKiB5IC0geiAqIHopKVxuICApO1xufTtcblxuY29uc3QgZ2V0UXVhdGVydGlvbkZyb21FdWxlciA9ICh4LCB5LCB6KSA9PiB7XG4gIGNvbnN0IGMxID0gTWF0aC5jb3MoeSk7XG4gIGNvbnN0IHMxID0gTWF0aC5zaW4oeSk7XG4gIGNvbnN0IGMyID0gTWF0aC5jb3MoLXopO1xuICBjb25zdCBzMiA9IE1hdGguc2luKC16KTtcbiAgY29uc3QgYzMgPSBNYXRoLmNvcyh4KTtcbiAgY29uc3QgczMgPSBNYXRoLnNpbih4KTtcbiAgY29uc3QgYzFjMiA9IGMxICogYzI7XG4gIGNvbnN0IHMxczIgPSBzMSAqIHMyO1xuXG4gIHJldHVybiB7XG4gICAgdzogYzFjMiAqIGMzIC0gczFzMiAqIHMzLFxuICAgIHg6IGMxYzIgKiBzMyArIHMxczIgKiBjMyxcbiAgICB5OiBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczMsXG4gICAgejogYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzXG4gIH07XG59O1xuXG5jb25zdCBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0ID0gKHBvc2l0aW9uLCBvYmplY3QpID0+IHtcbiAgdGVtcDFNYXRyaXg0LmlkZW50aXR5KCk7IC8vIHJlc2V0IHRlbXAgbWF0cml4XG5cbiAgLy8gU2V0IHRoZSB0ZW1wIG1hdHJpeCdzIHJvdGF0aW9uIHRvIHRoZSBvYmplY3QncyByb3RhdGlvblxuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKS5tYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihvYmplY3QucXVhdGVybmlvbik7XG5cbiAgLy8gSW52ZXJ0IHJvdGF0aW9uIG1hdHJpeCBpbiBvcmRlciB0byBcInVucm90YXRlXCIgYSBwb2ludCBiYWNrIHRvIG9iamVjdCBzcGFjZVxuICB0ZW1wMU1hdHJpeDQuZ2V0SW52ZXJzZSh0ZW1wMU1hdHJpeDQpO1xuXG4gIC8vIFlheSEgVGVtcCB2YXJzIVxuICB0ZW1wMVZlY3RvcjMuY29weShwb3NpdGlvbik7XG4gIHRlbXAyVmVjdG9yMy5jb3B5KG9iamVjdC5wb3NpdGlvbik7XG5cbiAgLy8gQXBwbHkgdGhlIHJvdGF0aW9uXG4gIHJldHVybiB0ZW1wMVZlY3RvcjMuc3ViKHRlbXAyVmVjdG9yMykuYXBwbHlNYXRyaXg0KHRlbXAxTWF0cml4NCk7XG59O1xuXG5jb25zdCBhZGRPYmplY3RDaGlsZHJlbiA9IGZ1bmN0aW9uIChwYXJlbnQsIG9iamVjdCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG9iamVjdC5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkID0gb2JqZWN0LmNoaWxkcmVuW2ldO1xuICAgIGNvbnN0IHBoeXNpY3MgPSBjaGlsZC5jb21wb25lbnQgPyBjaGlsZC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykgOiBmYWxzZTtcblxuICAgIGlmIChwaHlzaWNzKSB7XG4gICAgICBjb25zdCBkYXRhID0gcGh5c2ljcy5kYXRhO1xuXG4gICAgICBjaGlsZC51cGRhdGVNYXRyaXgoKTtcbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG5cbiAgICAgIHRlbXAxVmVjdG9yMy5zZXRGcm9tTWF0cml4UG9zaXRpb24oY2hpbGQubWF0cml4V29ybGQpO1xuICAgICAgdGVtcDFRdWF0LnNldEZyb21Sb3RhdGlvbk1hdHJpeChjaGlsZC5tYXRyaXhXb3JsZCk7XG5cbiAgICAgIGRhdGEucG9zaXRpb25fb2Zmc2V0ID0ge1xuICAgICAgICB4OiB0ZW1wMVZlY3RvcjMueCxcbiAgICAgICAgeTogdGVtcDFWZWN0b3IzLnksXG4gICAgICAgIHo6IHRlbXAxVmVjdG9yMy56XG4gICAgICB9O1xuXG4gICAgICBkYXRhLnJvdGF0aW9uID0ge1xuICAgICAgICB4OiB0ZW1wMVF1YXQueCxcbiAgICAgICAgeTogdGVtcDFRdWF0LnksXG4gICAgICAgIHo6IHRlbXAxUXVhdC56LFxuICAgICAgICB3OiB0ZW1wMVF1YXQud1xuICAgICAgfTtcblxuICAgICAgcGFyZW50LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhLmNoaWxkcmVuLnB1c2goZGF0YSk7XG4gICAgfVxuXG4gICAgYWRkT2JqZWN0Q2hpbGRyZW4ocGFyZW50LCBjaGlsZCk7XG4gIH1cbn07XG5cbmV4cG9ydCB7XG4gIGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24sXG4gIGdldFF1YXRlcnRpb25Gcm9tRXVsZXIsXG4gIGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QsXG4gIGFkZE9iamVjdENoaWxkcmVuLFxuXG4gIE1FU1NBR0VfVFlQRVMsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFLFxuXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDJWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIHRlbXAxUXVhdFxufTtcbiIsImV4cG9ydCBjbGFzcyBFdmVudGFibGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9ldmVudExpc3RlbmVycyA9IHt9O1xuICB9XG5cbiAgYWRkRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICghdGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpXG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXSA9IFtdO1xuXG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50X25hbWUsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGluZGV4O1xuXG4gICAgaWYgKCF0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKChpbmRleCA9IHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLmluZGV4T2YoY2FsbGJhY2spKSA+PSAwKSB7XG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZGlzcGF0Y2hFdmVudChldmVudF9uYW1lKSB7XG4gICAgbGV0IGk7XG4gICAgY29uc3QgcGFyYW1ldGVycyA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgaWYgKHRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdW2ldLmFwcGx5KHRoaXMsIHBhcmFtZXRlcnMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBtYWtlKG9iaikge1xuICAgIG9iai5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IEV2ZW50YWJsZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcbiAgICBvYmoucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBFdmVudGFibGUucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG4gICAgb2JqLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gRXZlbnRhYmxlLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuICB9XG59XG4iLCJpbXBvcnQgeyBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0IH0gZnJvbSAnLi4vYXBpJztcbmltcG9ydCB7IEV1bGVyLCBNYXRyaXg0LCBRdWF0ZXJuaW9uLCBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgY2xhc3MgQ29uZVR3aXN0Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgY29uc3Qgb2JqZWN0YiA9IG9iamE7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkgY29uc29sZS5lcnJvcignQm90aCBvYmplY3RzIG11c3QgYmUgZGVmaW5lZCBpbiBhIENvbmVUd2lzdENvbnN0cmFpbnQuJyk7XG5cbiAgICB0aGlzLnR5cGUgPSAnY29uZXR3aXN0JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgdGhpcy5heGlzYSA9IHt4OiBvYmplY3RhLnJvdGF0aW9uLngsIHk6IG9iamVjdGEucm90YXRpb24ueSwgejogb2JqZWN0YS5yb3RhdGlvbi56fTtcbiAgICB0aGlzLmF4aXNiID0ge3g6IG9iamVjdGIucm90YXRpb24ueCwgeTogb2JqZWN0Yi5yb3RhdGlvbi55LCB6OiBvYmplY3RiLnJvdGF0aW9uLnp9O1xuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXNhOiB0aGlzLmF4aXNhLFxuICAgICAgYXhpc2I6IHRoaXMuYXhpc2JcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXQoeCwgeSwgeikge1xuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X3NldExpbWl0Jywge2NvbnN0cmFpbnQ6IHRoaXMuaWQsIHgsIHksIHp9KTtcbiAgfVxuXG4gIGVuYWJsZU1vdG9yKCkge1xuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X2VuYWJsZU1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxuXG4gIHNldE1heE1vdG9ySW1wdWxzZShtYXhfaW1wdWxzZSkge1xuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X3NldE1heE1vdG9ySW1wdWxzZScsIHtjb25zdHJhaW50OiB0aGlzLmlkLCBtYXhfaW1wdWxzZX0pO1xuICB9XG5cbiAgc2V0TW90b3JUYXJnZXQodGFyZ2V0KSB7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFZlY3RvcjMpXG4gICAgICB0YXJnZXQgPSBuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihuZXcgRXVsZXIodGFyZ2V0LngsIHRhcmdldC55LCB0YXJnZXQueikpO1xuICAgIGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEV1bGVyKVxuICAgICAgdGFyZ2V0ID0gbmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIodGFyZ2V0KTtcbiAgICBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBNYXRyaXg0KVxuICAgICAgdGFyZ2V0ID0gbmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tUm90YXRpb25NYXRyaXgodGFyZ2V0KTtcblxuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X3NldE1vdG9yVGFyZ2V0Jywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHg6IHRhcmdldC54LFxuICAgICAgeTogdGFyZ2V0LnksXG4gICAgICB6OiB0YXJnZXQueixcbiAgICAgIHc6IHRhcmdldC53XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIEhpbmdlQ29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uLCBheGlzKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKGF4aXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXhpcyA9IHBvc2l0aW9uO1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnaGluZ2UnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXM6IHRoaXMuYXhpc1xuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdHMobG93LCBoaWdoLCBiaWFzX2ZhY3RvciwgcmVsYXhhdGlvbl9mYWN0b3IpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdoaW5nZV9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbG93LFxuICAgICAgaGlnaCxcbiAgICAgIGJpYXNfZmFjdG9yLFxuICAgICAgcmVsYXhhdGlvbl9mYWN0b3JcbiAgICB9KTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZGlzYWJsZU1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgUG9pbnRDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAncG9pbnQnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmJcbiAgICB9O1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBTbGlkZXJDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24sIGF4aXMpIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoYXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBheGlzID0gcG9zaXRpb247XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdzbGlkZXInO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXM6IHRoaXMuYXhpc1xuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdHMobGluX2xvd2VyLCBsaW5fdXBwZXIsIGFuZ19sb3dlciwgYW5nX3VwcGVyKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX3NldExpbWl0cycsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICBsaW5fbG93ZXIsXG4gICAgICBsaW5fdXBwZXIsXG4gICAgICBhbmdfbG93ZXIsXG4gICAgICBhbmdfdXBwZXJcbiAgICB9KTtcbiAgfVxuXG4gIHNldFJlc3RpdHV0aW9uKGxpbmVhciwgYW5ndWxhcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoXG4gICAgICAnc2xpZGVyX3NldFJlc3RpdHV0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgICAgbGluZWFyLFxuICAgICAgICBhbmd1bGFyXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGVuYWJsZUxpbmVhck1vdG9yKHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZW5hYmxlTGluZWFyTW90b3InLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgdmVsb2NpdHksXG4gICAgICBhY2NlbGVyYXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVMaW5lYXJNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZGlzYWJsZUxpbmVhck1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgdGhpcy5zY2VuZS5leGVjdXRlKCdzbGlkZXJfZW5hYmxlQW5ndWxhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlQW5ndWxhck1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9kaXNhYmxlQW5ndWxhck1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgRE9GQ29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKCBwb3NpdGlvbiA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnZG9mJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YSApLmNsb25lKCk7XG4gICAgdGhpcy5heGlzYSA9IHsgeDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24ueiB9O1xuXG4gICAgaWYgKCBvYmplY3RiICkge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YiApLmNsb25lKCk7XG4gICAgICB0aGlzLmF4aXNiID0geyB4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56IH07XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXNhOiB0aGlzLmF4aXNhLFxuICAgICAgYXhpc2I6IHRoaXMuYXhpc2JcbiAgICB9O1xuICB9XG5cbiAgc2V0TGluZWFyTG93ZXJMaW1pdChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRMaW5lYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyVXBwZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyTG93ZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZW5hYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG5cbiAgY29uZmlndXJlQW5ndWxhck1vdG9yICh3aGljaCwgbG93X2FuZ2xlLCBoaWdoX2FuZ2xlLCB2ZWxvY2l0eSwgbWF4X2ZvcmNlICkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2gsIGxvd19hbmdsZTogbG93X2FuZ2xlLCBoaWdoX2FuZ2xlOiBoaWdoX2FuZ2xlLCB2ZWxvY2l0eTogdmVsb2NpdHksIG1heF9mb3JjZTogbWF4X2ZvcmNlIH0gKTtcbiAgfVxuXG4gIGRpc2FibGVBbmd1bGFyTW90b3IgKHdoaWNoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9kaXNhYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG59XG4iLCJpbXBvcnQge01lc2h9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7VmVoaWNsZVR1bm5pbmd9IGZyb20gJy4vdHVubmluZyc7XG5cbmV4cG9ydCBjbGFzcyBWZWhpY2xlIHtcbiAgY29uc3RydWN0b3IobWVzaCwgdHVuaW5nID0gbmV3IFZlaGljbGVUdW5pbmcoKSkge1xuICAgIHRoaXMubWVzaCA9IG1lc2g7XG4gICAgdGhpcy53aGVlbHMgPSBbXTtcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICBpZDogZ2V0T2JqZWN0SWQoKSxcbiAgICAgIHJpZ2lkQm9keTogbWVzaC5fcGh5c2lqcy5pZCxcbiAgICAgIHN1c3BlbnNpb25fc3RpZmZuZXNzOiB0dW5pbmcuc3VzcGVuc2lvbl9zdGlmZm5lc3MsXG4gICAgICBzdXNwZW5zaW9uX2NvbXByZXNzaW9uOiB0dW5pbmcuc3VzcGVuc2lvbl9jb21wcmVzc2lvbixcbiAgICAgIHN1c3BlbnNpb25fZGFtcGluZzogdHVuaW5nLnN1c3BlbnNpb25fZGFtcGluZyxcbiAgICAgIG1heF9zdXNwZW5zaW9uX3RyYXZlbDogdHVuaW5nLm1heF9zdXNwZW5zaW9uX3RyYXZlbCxcbiAgICAgIGZyaWN0aW9uX3NsaXA6IHR1bmluZy5mcmljdGlvbl9zbGlwLFxuICAgICAgbWF4X3N1c3BlbnNpb25fZm9yY2U6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl9mb3JjZVxuICAgIH07XG4gIH1cblxuICBhZGRXaGVlbCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwsIGNvbm5lY3Rpb25fcG9pbnQsIHdoZWVsX2RpcmVjdGlvbiwgd2hlZWxfYXhsZSwgc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCwgd2hlZWxfcmFkaXVzLCBpc19mcm9udF93aGVlbCwgdHVuaW5nKSB7XG4gICAgY29uc3Qgd2hlZWwgPSBuZXcgTWVzaCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwpO1xuXG4gICAgd2hlZWwuY2FzdFNoYWRvdyA9IHdoZWVsLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgIHdoZWVsLnBvc2l0aW9uLmNvcHkod2hlZWxfZGlyZWN0aW9uKS5tdWx0aXBseVNjYWxhcihzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoIC8gMTAwKS5hZGQoY29ubmVjdGlvbl9wb2ludCk7XG5cbiAgICB0aGlzLndvcmxkLmFkZCh3aGVlbCk7XG4gICAgdGhpcy53aGVlbHMucHVzaCh3aGVlbCk7XG5cbiAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FkZFdoZWVsJywge1xuICAgICAgaWQ6IHRoaXMuX3BoeXNpanMuaWQsXG4gICAgICBjb25uZWN0aW9uX3BvaW50OiB7eDogY29ubmVjdGlvbl9wb2ludC54LCB5OiBjb25uZWN0aW9uX3BvaW50LnksIHo6IGNvbm5lY3Rpb25fcG9pbnQuen0sXG4gICAgICB3aGVlbF9kaXJlY3Rpb246IHt4OiB3aGVlbF9kaXJlY3Rpb24ueCwgeTogd2hlZWxfZGlyZWN0aW9uLnksIHo6IHdoZWVsX2RpcmVjdGlvbi56fSxcbiAgICAgIHdoZWVsX2F4bGU6IHt4OiB3aGVlbF9heGxlLngsIHk6IHdoZWVsX2F4bGUueSwgejogd2hlZWxfYXhsZS56fSxcbiAgICAgIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsXG4gICAgICB3aGVlbF9yYWRpdXMsXG4gICAgICBpc19mcm9udF93aGVlbCxcbiAgICAgIHR1bmluZ1xuICAgIH0pO1xuICB9XG5cbiAgc2V0U3RlZXJpbmcoYW1vdW50LCB3aGVlbCkge1xuICAgIGlmICh3aGVlbCAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2hlZWxzW3doZWVsXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldFN0ZWVyaW5nJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgc3RlZXJpbmc6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxuXG4gIHNldEJyYWtlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBicmFrZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRCcmFrZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIGJyYWtlOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBhcHBseUVuZ2luZUZvcmNlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnYXBwbHlFbmdpbmVGb3JjZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIGZvcmNlOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBmb3JjZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQge1xuICBTY2VuZSBhcyBTY2VuZU5hdGl2ZSxcbiAgTWVzaCxcbiAgU3BoZXJlR2VvbWV0cnksXG4gIE1lc2hOb3JtYWxNYXRlcmlhbCxcbiAgQm94R2VvbWV0cnksXG4gIFZlY3RvcjNcbn0gZnJvbSAndGhyZWUnO1xuXG5pbXBvcnQge0xvb3B9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7VmVoaWNsZX0gZnJvbSAnLi4vLi4vdmVoaWNsZS92ZWhpY2xlJztcbmltcG9ydCB7RXZlbnRhYmxlfSBmcm9tICcuLi8uLi9ldmVudGFibGUnO1xuXG5pbXBvcnQge1xuICBhZGRPYmplY3RDaGlsZHJlbixcbiAgTUVTU0FHRV9UWVBFUyxcbiAgdGVtcDFWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFXG59IGZyb20gJy4uLy4uL2FwaSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdvcmxkTW9kdWxlQmFzZSBleHRlbmRzIEV2ZW50YWJsZSB7XG4gIHN0YXRpYyBkZWZhdWx0cyA9IHtcbiAgICBmaXhlZFRpbWVTdGVwOiAxLzYwLFxuICAgIHJhdGVMaW1pdDogdHJ1ZSxcbiAgICBhbW1vOiBcIlwiLFxuICAgIHNvZnRib2R5OiBmYWxzZSxcbiAgICBncmF2aXR5OiBuZXcgVmVjdG9yMygwLCAtMTAwLCAwKVxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbihXb3JsZE1vZHVsZUJhc2UuZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5vYmplY3RzID0ge307XG4gICAgdGhpcy52ZWhpY2xlcyA9IHt9O1xuICAgIHRoaXMuY29uc3RyYWludHMgPSB7fTtcbiAgICB0aGlzLmlzU2ltdWxhdGluZyA9IGZhbHNlO1xuXG4gICAgdGhpcy5nZXRPYmplY3RJZCA9ICgoKSA9PiB7XG4gICAgICBsZXQgaWQgPSAxO1xuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGlkKys7XG4gICAgICB9O1xuICAgIH0pKCk7XG4gIH1cblxuICBzZXR1cCgpIHtcbiAgICB0aGlzLnJlY2VpdmUoZXZlbnQgPT4ge1xuICAgICAgbGV0IF90ZW1wLFxuICAgICAgICBkYXRhID0gZXZlbnQuZGF0YTtcblxuICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciAmJiBkYXRhLmJ5dGVMZW5ndGggIT09IDEpLy8gYnl0ZUxlbmd0aCA9PT0gMSBpcyB0aGUgd29ya2VyIG1ha2luZyBhIFNVUFBPUlRfVFJBTlNGRVJBQkxFIHRlc3RcbiAgICAgICAgZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSk7XG5cbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICAgIC8vIHRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICAgICAgc3dpdGNoIChkYXRhWzBdKSB7XG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTY2VuZShkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlNPRlRSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNvZnRib2RpZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbGxpc2lvbnMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVWZWhpY2xlcyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnN0cmFpbnRzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChkYXRhLmNtZCkge1xuICAgICAgICAvLyBub24tdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgICAgICBzd2l0Y2ggKGRhdGEuY21kKSB7XG4gICAgICAgICAgY2FzZSAnb2JqZWN0UmVhZHknOlxuICAgICAgICAgICAgX3RlbXAgPSBkYXRhLnBhcmFtcztcbiAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdHNbX3RlbXBdKSB0aGlzLm9iamVjdHNbX3RlbXBdLmRpc3BhdGNoRXZlbnQoJ3JlYWR5Jyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ3dvcmxkUmVhZHknOlxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICdhbW1vTG9hZGVkJzpcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnbG9hZGVkJyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlBoeXNpY3MgbG9hZGluZyB0aW1lOiBcIiArIChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0KSArIFwibXNcIik7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ3ZlaGljbGUnOlxuICAgICAgICAgICAgd2luZG93LnRlc3QgPSBkYXRhO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gRG8gbm90aGluZywganVzdCBzaG93IHRoZSBtZXNzYWdlXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBSZWNlaXZlZDogJHtkYXRhLmNtZH1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKGRhdGEucGFyYW1zKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzd2l0Y2ggKGRhdGFbMF0pIHtcbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNjZW5lKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHVwZGF0ZVNjZW5lKGluZm8pIHtcbiAgICBsZXQgaW5kZXggPSBpbmZvWzFdO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyBpbmRleCAqIFJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMub2JqZWN0c1tpbmZvW29mZnNldF1dO1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgIGNvbnN0IGRhdGEgPSBjb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID09PSBmYWxzZSkge1xuICAgICAgICBvYmplY3QucG9zaXRpb24uc2V0KFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAyXSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDNdXG4gICAgICAgICk7XG5cbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNF0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA1XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDZdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgN11cbiAgICAgICAgKTtcblxuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGRhdGEubGluZWFyVmVsb2NpdHkuc2V0KFxuICAgICAgICBpbmZvW29mZnNldCArIDhdLFxuICAgICAgICBpbmZvW29mZnNldCArIDldLFxuICAgICAgICBpbmZvW29mZnNldCArIDEwXVxuICAgICAgKTtcblxuICAgICAgZGF0YS5hbmd1bGFyVmVsb2NpdHkuc2V0KFxuICAgICAgICBpbmZvW29mZnNldCArIDExXSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMl0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTNdXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy5zZW5kKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG5cbiAgICB0aGlzLmlzU2ltdWxhdGluZyA9IGZhbHNlO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgndXBkYXRlJyk7XG4gIH1cblxuICB1cGRhdGVTb2Z0Ym9kaWVzKGluZm8pIHtcbiAgICBsZXQgaW5kZXggPSBpbmZvWzFdLFxuICAgICAgb2Zmc2V0ID0gMjtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBzaXplID0gaW5mb1tvZmZzZXQgKyAxXTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMub2JqZWN0c1tpbmZvW29mZnNldF1dO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgZGF0YSA9IG9iamVjdC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IG9iamVjdC5nZW9tZXRyeS5hdHRyaWJ1dGVzO1xuICAgICAgY29uc3Qgdm9sdW1lUG9zaXRpb25zID0gYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgY29uc3Qgb2Zmc2V0VmVydCA9IG9mZnNldCArIDI7XG5cbiAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEuaWQpO1xuICAgICAgaWYgKCFkYXRhLmlzU29mdEJvZHlSZXNldCkge1xuICAgICAgICBvYmplY3QucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICBvYmplY3QucXVhdGVybmlvbi5zZXQoMCwgMCwgMCwgMCk7XG5cbiAgICAgICAgZGF0YS5pc1NvZnRCb2R5UmVzZXQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS50eXBlID09PSBcInNvZnRUcmltZXNoXCIpIHtcbiAgICAgICAgY29uc3Qgdm9sdW1lTm9ybWFscyA9IGF0dHJpYnV0ZXMubm9ybWFsLmFycmF5O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogMTg7XG5cbiAgICAgICAgICBjb25zdCB4MSA9IGluZm9bb2Zmc107XG4gICAgICAgICAgY29uc3QgeTEgPSBpbmZvW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6MSA9IGluZm9bb2ZmcyArIDJdO1xuXG4gICAgICAgICAgY29uc3QgbngxID0gaW5mb1tvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkxID0gaW5mb1tvZmZzICsgNF07XG4gICAgICAgICAgY29uc3QgbnoxID0gaW5mb1tvZmZzICsgNV07XG5cbiAgICAgICAgICBjb25zdCB4MiA9IGluZm9bb2ZmcyArIDZdO1xuICAgICAgICAgIGNvbnN0IHkyID0gaW5mb1tvZmZzICsgN107XG4gICAgICAgICAgY29uc3QgejIgPSBpbmZvW29mZnMgKyA4XTtcblxuICAgICAgICAgIGNvbnN0IG54MiA9IGluZm9bb2ZmcyArIDldO1xuICAgICAgICAgIGNvbnN0IG55MiA9IGluZm9bb2ZmcyArIDEwXTtcbiAgICAgICAgICBjb25zdCBuejIgPSBpbmZvW29mZnMgKyAxMV07XG5cbiAgICAgICAgICBjb25zdCB4MyA9IGluZm9bb2ZmcyArIDEyXTtcbiAgICAgICAgICBjb25zdCB5MyA9IGluZm9bb2ZmcyArIDEzXTtcbiAgICAgICAgICBjb25zdCB6MyA9IGluZm9bb2ZmcyArIDE0XTtcblxuICAgICAgICAgIGNvbnN0IG54MyA9IGluZm9bb2ZmcyArIDE1XTtcbiAgICAgICAgICBjb25zdCBueTMgPSBpbmZvW29mZnMgKyAxNl07XG4gICAgICAgICAgY29uc3QgbnozID0gaW5mb1tvZmZzICsgMTddO1xuXG4gICAgICAgICAgY29uc3QgaTkgPSBpICogOTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOV0gPSB4MTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAxXSA9IHkxO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDJdID0gejE7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAzXSA9IHgyO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDRdID0geTI7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNV0gPSB6MjtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDZdID0geDM7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgN10gPSB5MztcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA4XSA9IHozO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOV0gPSBueDE7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDFdID0gbnkxO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAyXSA9IG56MTtcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAzXSA9IG54MjtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNF0gPSBueTI7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDVdID0gbnoyO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDZdID0gbngzO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA3XSA9IG55MztcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgOF0gPSBuejM7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDE4O1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoZGF0YS50eXBlID09PSBcInNvZnRSb3BlTWVzaFwiKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogMztcblxuICAgICAgICAgIGNvbnN0IHggPSBpbmZvW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkgPSBpbmZvW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6ID0gaW5mb1tvZmZzICsgMl07XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDNdID0geDtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAxXSA9IHk7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMl0gPSB6O1xuICAgICAgICB9XG5cbiAgICAgICAgb2Zmc2V0ICs9IDIgKyBzaXplICogMztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZvbHVtZU5vcm1hbHMgPSBhdHRyaWJ1dGVzLm5vcm1hbC5hcnJheTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDY7XG5cbiAgICAgICAgICBjb25zdCB4ID0gaW5mb1tvZmZzXTtcbiAgICAgICAgICBjb25zdCB5ID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgeiA9IGluZm9bb2ZmcyArIDJdO1xuXG4gICAgICAgICAgY29uc3QgbnggPSBpbmZvW29mZnMgKyAzXTtcbiAgICAgICAgICBjb25zdCBueSA9IGluZm9bb2ZmcyArIDRdO1xuICAgICAgICAgIGNvbnN0IG56ID0gaW5mb1tvZmZzICsgNV07XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDNdID0geDtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAxXSA9IHk7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMl0gPSB6O1xuXG4gICAgICAgICAgLy8gRklYTUU6IE5vcm1hbHMgYXJlIHBvaW50ZWQgdG8gbG9vayBpbnNpZGU7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogM10gPSBueDtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2kgKiAzICsgMV0gPSBueTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2kgKiAzICsgMl0gPSBuejtcbiAgICAgICAgfVxuXG4gICAgICAgIGF0dHJpYnV0ZXMubm9ybWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgb2Zmc2V0ICs9IDIgKyBzaXplICogNjtcbiAgICAgIH1cblxuICAgICAgYXR0cmlidXRlcy5wb3NpdGlvbi5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgLy8gICB0aGlzLnNlbmQoaW5mby5idWZmZXIsIFtpbmZvLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcblxuICAgIHRoaXMuaXNTaW11bGF0aW5nID0gZmFsc2U7XG4gIH1cblxuICB1cGRhdGVWZWhpY2xlcyhkYXRhKSB7XG4gICAgbGV0IHZlaGljbGUsIHdoZWVsO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZGF0YS5sZW5ndGggLSAxKSAvIFZFSElDTEVSRVBPUlRfSVRFTVNJWkU7IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMSArIGkgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFO1xuICAgICAgdmVoaWNsZSA9IHRoaXMudmVoaWNsZXNbZGF0YVtvZmZzZXRdXTtcblxuICAgICAgaWYgKHZlaGljbGUgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICB3aGVlbCA9IHZlaGljbGUud2hlZWxzW2RhdGFbb2Zmc2V0ICsgMV1dO1xuXG4gICAgICB3aGVlbC5wb3NpdGlvbi5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgMl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgM10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNF1cbiAgICAgICk7XG5cbiAgICAgIHdoZWVsLnF1YXRlcm5pb24uc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDVdLFxuICAgICAgICBkYXRhW29mZnNldCArIDZdLFxuICAgICAgICBkYXRhW29mZnNldCArIDddLFxuICAgICAgICBkYXRhW29mZnNldCArIDhdXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy5zZW5kKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICB1cGRhdGVDb25zdHJhaW50cyhkYXRhKSB7XG4gICAgbGV0IGNvbnN0cmFpbnQsIG9iamVjdDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0cmFpbnQgPSB0aGlzLmNvbnN0cmFpbnRzW2RhdGFbb2Zmc2V0XV07XG4gICAgICBvYmplY3QgPSB0aGlzLm9iamVjdHNbZGF0YVtvZmZzZXQgKyAxXV07XG5cbiAgICAgIGlmIChjb25zdHJhaW50ID09PSB1bmRlZmluZWQgfHwgb2JqZWN0ID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDJdLFxuICAgICAgICBkYXRhW29mZnNldCArIDNdLFxuICAgICAgICBkYXRhW29mZnNldCArIDRdXG4gICAgICApO1xuXG4gICAgICB0ZW1wMU1hdHJpeDQuZXh0cmFjdFJvdGF0aW9uKG9iamVjdC5tYXRyaXgpO1xuICAgICAgdGVtcDFWZWN0b3IzLmFwcGx5TWF0cml4NCh0ZW1wMU1hdHJpeDQpO1xuXG4gICAgICBjb25zdHJhaW50LnBvc2l0aW9uYS5hZGRWZWN0b3JzKG9iamVjdC5wb3NpdGlvbiwgdGVtcDFWZWN0b3IzKTtcbiAgICAgIGNvbnN0cmFpbnQuYXBwbGllZEltcHVsc2UgPSBkYXRhW29mZnNldCArIDVdO1xuICAgIH1cblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy5zZW5kKGRhdGEuYnVmZmVyLCBbZGF0YS5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICB1cGRhdGVDb2xsaXNpb25zKGluZm8pIHtcbiAgICAvKipcbiAgICAgKiAjVE9ET1xuICAgICAqIFRoaXMgaXMgcHJvYmFibHkgdGhlIHdvcnN0IHdheSBldmVyIHRvIGhhbmRsZSBjb2xsaXNpb25zLiBUaGUgaW5oZXJlbnQgZXZpbG5lc3MgaXMgYSByZXNpZHVhbFxuICAgICAqIGVmZmVjdCBmcm9tIHRoZSBwcmV2aW91cyB2ZXJzaW9uJ3MgZXZpbG5lc3Mgd2hpY2ggbXV0YXRlZCB3aGVuIHN3aXRjaGluZyB0byB0cmFuc2ZlcmFibGUgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIElmIHlvdSBmZWVsIGluY2xpbmVkIHRvIG1ha2UgdGhpcyBiZXR0ZXIsIHBsZWFzZSBkbyBzby5cbiAgICAgKi9cblxuICAgIGNvbnN0IGNvbGxpc2lvbnMgPSB7fSxcbiAgICAgIG5vcm1hbF9vZmZzZXRzID0ge307XG5cbiAgICAvLyBCdWlsZCBjb2xsaXNpb24gbWFuaWZlc3RcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZm9bMV07IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIGkgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdCBvYmplY3QgPSBpbmZvW29mZnNldF07XG4gICAgICBjb25zdCBvYmplY3QyID0gaW5mb1tvZmZzZXQgKyAxXTtcblxuICAgICAgbm9ybWFsX29mZnNldHNbYCR7b2JqZWN0fS0ke29iamVjdDJ9YF0gPSBvZmZzZXQgKyAyO1xuICAgICAgbm9ybWFsX29mZnNldHNbYCR7b2JqZWN0Mn0tJHtvYmplY3R9YF0gPSAtMSAqIChvZmZzZXQgKyAyKTtcblxuICAgICAgLy8gUmVnaXN0ZXIgY29sbGlzaW9ucyBmb3IgYm90aCB0aGUgb2JqZWN0IGNvbGxpZGluZyBhbmQgdGhlIG9iamVjdCBiZWluZyBjb2xsaWRlZCB3aXRoXG4gICAgICBpZiAoIWNvbGxpc2lvbnNbb2JqZWN0XSkgY29sbGlzaW9uc1tvYmplY3RdID0gW107XG4gICAgICBjb2xsaXNpb25zW29iamVjdF0ucHVzaChvYmplY3QyKTtcblxuICAgICAgaWYgKCFjb2xsaXNpb25zW29iamVjdDJdKSBjb2xsaXNpb25zW29iamVjdDJdID0gW107XG4gICAgICBjb2xsaXNpb25zW29iamVjdDJdLnB1c2gob2JqZWN0KTtcbiAgICB9XG5cbiAgICAvLyBEZWFsIHdpdGggY29sbGlzaW9uc1xuICAgIGZvciAoY29uc3QgaWQxIGluIHRoaXMub2JqZWN0cykge1xuICAgICAgaWYgKCF0aGlzLm9iamVjdHMuaGFzT3duUHJvcGVydHkoaWQxKSkgY29udGludWU7XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLm9iamVjdHNbaWQxXTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICAvLyBJZiBvYmplY3QgdG91Y2hlcyBhbnl0aGluZywgLi4uXG4gICAgICBpZiAoY29sbGlzaW9uc1tpZDFdKSB7XG4gICAgICAgIC8vIENsZWFuIHVwIHRvdWNoZXMgYXJyYXlcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkYXRhLnRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAoY29sbGlzaW9uc1tpZDFdLmluZGV4T2YoZGF0YS50b3VjaGVzW2pdKSA9PT0gLTEpXG4gICAgICAgICAgICBkYXRhLnRvdWNoZXMuc3BsaWNlKGotLSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgZWFjaCBjb2xsaWRpbmcgb2JqZWN0XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29sbGlzaW9uc1tpZDFdLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgaWQyID0gY29sbGlzaW9uc1tpZDFdW2pdO1xuICAgICAgICAgIGNvbnN0IG9iamVjdDIgPSB0aGlzLm9iamVjdHNbaWQyXTtcblxuICAgICAgICAgIGlmIChvYmplY3QyKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQyID0gb2JqZWN0Mi5jb21wb25lbnQ7XG4gICAgICAgICAgICBjb25zdCBkYXRhMiA9IGNvbXBvbmVudDIudXNlKCdwaHlzaWNzJykuZGF0YTtcbiAgICAgICAgICAgIC8vIElmIG9iamVjdCB3YXMgbm90IGFscmVhZHkgdG91Y2hpbmcgb2JqZWN0Miwgbm90aWZ5IG9iamVjdFxuICAgICAgICAgICAgaWYgKGRhdGEudG91Y2hlcy5pbmRleE9mKGlkMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgIGRhdGEudG91Y2hlcy5wdXNoKGlkMik7XG5cbiAgICAgICAgICAgICAgY29uc3QgdmVsID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmdldExpbmVhclZlbG9jaXR5KCk7XG4gICAgICAgICAgICAgIGNvbnN0IHZlbDIgPSBjb21wb25lbnQyLnVzZSgncGh5c2ljcycpLmdldExpbmVhclZlbG9jaXR5KCk7XG5cbiAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnN1YlZlY3RvcnModmVsLCB2ZWwyKTtcbiAgICAgICAgICAgICAgY29uc3QgdGVtcDEgPSB0ZW1wMVZlY3RvcjMuY2xvbmUoKTtcblxuICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc3ViVmVjdG9ycyh2ZWwsIHZlbDIpO1xuICAgICAgICAgICAgICBjb25zdCB0ZW1wMiA9IHRlbXAxVmVjdG9yMy5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgIGxldCBub3JtYWxfb2Zmc2V0ID0gbm9ybWFsX29mZnNldHNbYCR7ZGF0YS5pZH0tJHtkYXRhMi5pZH1gXTtcblxuICAgICAgICAgICAgICBpZiAobm9ybWFsX29mZnNldCA+IDApIHtcbiAgICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICAgICAgICAgICAgLWluZm9bbm9ybWFsX29mZnNldF0sXG4gICAgICAgICAgICAgICAgICAtaW5mb1tub3JtYWxfb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgICAgICAgICAtaW5mb1tub3JtYWxfb2Zmc2V0ICsgMl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vcm1hbF9vZmZzZXQgKj0gLTE7XG5cbiAgICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc2V0KFxuICAgICAgICAgICAgICAgICAgaW5mb1tub3JtYWxfb2Zmc2V0XSxcbiAgICAgICAgICAgICAgICAgIGluZm9bbm9ybWFsX29mZnNldCArIDFdLFxuICAgICAgICAgICAgICAgICAgaW5mb1tub3JtYWxfb2Zmc2V0ICsgMl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29tcG9uZW50LmVtaXQoJ2NvbGxpc2lvbicsIG9iamVjdDIsIHRlbXAxLCB0ZW1wMiwgdGVtcDFWZWN0b3IzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBkYXRhLnRvdWNoZXMubGVuZ3RoID0gMDsgLy8gbm90IHRvdWNoaW5nIG90aGVyIG9iamVjdHNcbiAgICB9XG5cbiAgICB0aGlzLmNvbGxpc2lvbnMgPSBjb2xsaXNpb25zO1xuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLnNlbmQoaW5mby5idWZmZXIsIFtpbmZvLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIGFkZENvbnN0cmFpbnQoY29uc3RyYWludCwgc2hvd19tYXJrZXIpIHtcbiAgICBjb25zdHJhaW50LmlkID0gdGhpcy5nZXRPYmplY3RJZCgpO1xuICAgIHRoaXMuY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gPSBjb25zdHJhaW50O1xuICAgIGNvbnN0cmFpbnQud29ybGRNb2R1bGUgPSB0aGlzO1xuICAgIHRoaXMuZXhlY3V0ZSgnYWRkQ29uc3RyYWludCcsIGNvbnN0cmFpbnQuZ2V0RGVmaW5pdGlvbigpKTtcblxuICAgIGlmIChzaG93X21hcmtlcikge1xuICAgICAgbGV0IG1hcmtlcjtcblxuICAgICAgc3dpdGNoIChjb25zdHJhaW50LnR5cGUpIHtcbiAgICAgICAgY2FzZSAncG9pbnQnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMub2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2hpbmdlJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLm9iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzbGlkZXInOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IEJveEdlb21ldHJ5KDEwLCAxLCAxKSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG5cbiAgICAgICAgICAvLyBUaGlzIHJvdGF0aW9uIGlzbid0IHJpZ2h0IGlmIGFsbCB0aHJlZSBheGlzIGFyZSBub24tMCB2YWx1ZXNcbiAgICAgICAgICAvLyBUT0RPOiBjaGFuZ2UgbWFya2VyJ3Mgcm90YXRpb24gb3JkZXIgdG8gWllYXG4gICAgICAgICAgbWFya2VyLnJvdGF0aW9uLnNldChcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy55LCAvLyB5ZXMsIHkgYW5kXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMueCwgLy8geCBheGlzIGFyZSBzd2FwcGVkXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMuelxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnY29uZXR3aXN0JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLm9iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdkb2YnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMub2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb25zdHJhaW50O1xuICB9XG5cbiAgb25TaW11bGF0aW9uUmVzdW1lKCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnb25TaW11bGF0aW9uUmVzdW1lJywge30pO1xuICB9XG5cbiAgcmVtb3ZlQ29uc3RyYWludChjb25zdHJhaW50KSB7XG4gICAgaWYgKHRoaXMuY29uc3RyYWludHNbY29uc3RyYWludC5pZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVDb25zdHJhaW50Jywge2lkOiBjb25zdHJhaW50LmlkfSk7XG4gICAgICBkZWxldGUgdGhpcy5jb25zdHJhaW50c1tjb25zdHJhaW50LmlkXTtcbiAgICB9XG4gIH1cblxuICBleGVjdXRlKGNtZCwgcGFyYW1zKSB7XG4gICAgdGhpcy5zZW5kKHtjbWQsIHBhcmFtc30pO1xuICB9XG5cbiAgb25BZGRDYWxsYmFjayhjb21wb25lbnQpIHtcbiAgICBjb25zdCBvYmplY3QgPSBjb21wb25lbnQubmF0aXZlO1xuICAgIGNvbnN0IGRhdGEgPSBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICBpZiAoZGF0YSkge1xuICAgICAgY29tcG9uZW50Lm1hbmFnZXIuc2V0KCdtb2R1bGU6d29ybGQnLCB0aGlzKTtcbiAgICAgIGRhdGEuaWQgPSB0aGlzLmdldE9iamVjdElkKCk7XG4gICAgICBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGEgPSBkYXRhO1xuXG4gICAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVmVoaWNsZSkge1xuICAgICAgICB0aGlzLm9uQWRkQ2FsbGJhY2sob2JqZWN0Lm1lc2gpO1xuICAgICAgICB0aGlzLnZlaGljbGVzW2RhdGEuaWRdID0gb2JqZWN0O1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2FkZFZlaGljbGUnLCBkYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9iamVjdHNbZGF0YS5pZF0gPSBvYmplY3Q7XG5cbiAgICAgICAgaWYgKG9iamVjdC5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICBkYXRhLmNoaWxkcmVuID0gW107XG4gICAgICAgICAgYWRkT2JqZWN0Q2hpbGRyZW4ob2JqZWN0LCBvYmplY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gb2JqZWN0LnF1YXRlcm5pb24uc2V0RnJvbUV1bGVyKG9iamVjdC5yb3RhdGlvbik7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdC5jb21wb25lbnQpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhvYmplY3Qucm90YXRpb24pO1xuXG4gICAgICAgIC8vIE9iamVjdCBzdGFydGluZyBwb3NpdGlvbiArIHJvdGF0aW9uXG4gICAgICAgIGRhdGEucG9zaXRpb24gPSB7XG4gICAgICAgICAgeDogb2JqZWN0LnBvc2l0aW9uLngsXG4gICAgICAgICAgeTogb2JqZWN0LnBvc2l0aW9uLnksXG4gICAgICAgICAgejogb2JqZWN0LnBvc2l0aW9uLnpcbiAgICAgICAgfTtcblxuICAgICAgICBkYXRhLnJvdGF0aW9uID0ge1xuICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgeTogb2JqZWN0LnF1YXRlcm5pb24ueSxcbiAgICAgICAgICB6OiBvYmplY3QucXVhdGVybmlvbi56LFxuICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoZGF0YS53aWR0aCkgZGF0YS53aWR0aCAqPSBvYmplY3Quc2NhbGUueDtcbiAgICAgICAgaWYgKGRhdGEuaGVpZ2h0KSBkYXRhLmhlaWdodCAqPSBvYmplY3Quc2NhbGUueTtcbiAgICAgICAgaWYgKGRhdGEuZGVwdGgpIGRhdGEuZGVwdGggKj0gb2JqZWN0LnNjYWxlLno7XG5cbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRPYmplY3QnLCBkYXRhKTtcbiAgICAgIH1cblxuICAgICAgY29tcG9uZW50LmVtaXQoJ3BoeXNpY3M6YWRkZWQnKTtcbiAgICB9XG4gIH1cblxuICBvblJlbW92ZUNhbGxiYWNrKGNvbXBvbmVudCkge1xuICAgIGNvbnN0IG9iamVjdCA9IGNvbXBvbmVudC5uYXRpdmU7XG5cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVmVoaWNsZSkge1xuICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVWZWhpY2xlJywge2lkOiBvYmplY3QuX3BoeXNpanMuaWR9KTtcbiAgICAgIHdoaWxlIChvYmplY3Qud2hlZWxzLmxlbmd0aCkgdGhpcy5yZW1vdmUob2JqZWN0LndoZWVscy5wb3AoKSk7XG5cbiAgICAgIHRoaXMucmVtb3ZlKG9iamVjdC5tZXNoKTtcbiAgICAgIHRoaXMudmVoaWNsZXNbb2JqZWN0Ll9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1lc2gucHJvdG90eXBlLnJlbW92ZS5jYWxsKHRoaXMsIG9iamVjdCk7XG5cbiAgICAgIGlmIChvYmplY3QuX3BoeXNpanMpIHtcbiAgICAgICAgY29tcG9uZW50Lm1hbmFnZXIucmVtb3ZlKCdtb2R1bGU6d29ybGQnKTtcbiAgICAgICAgdGhpcy5vYmplY3RzW29iamVjdC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ3JlbW92ZU9iamVjdCcsIHtpZDogb2JqZWN0Ll9waHlzaWpzLmlkfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZGVmZXIoZnVuYywgYXJncykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNMb2FkZWQpIHtcbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIHRoaXMubG9hZGVyLnRoZW4oKCkgPT4ge1xuICAgICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIG1hbmFnZXIuZGVmaW5lKCdwaHlzaWNzJyk7XG4gICAgbWFuYWdlci5zZXQoJ3BoeXNpY3NXb3JrZXInLCB0aGlzLndvcmtlcik7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgb25BZGQoY29tcG9uZW50LCBzZWxmKSB7XG4gICAgICBpZiAoY29tcG9uZW50LnVzZSgncGh5c2ljcycpKSByZXR1cm4gc2VsZi5kZWZlcihzZWxmLm9uQWRkQ2FsbGJhY2suYmluZChzZWxmKSwgW2NvbXBvbmVudF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH0sXG5cbiAgICBvblJlbW92ZShjb21wb25lbnQsIHNlbGYpIHtcbiAgICAgIGlmIChjb21wb25lbnQudXNlKCdwaHlzaWNzJykpIHJldHVybiBzZWxmLmRlZmVyKHNlbGYub25SZW1vdmVDYWxsYmFjay5iaW5kKHNlbGYpLCBbY29tcG9uZW50XSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgLy8gLi4uXG5cbiAgICB0aGlzLnNldEZpeGVkVGltZVN0ZXAgPSBmdW5jdGlvbihmaXhlZFRpbWVTdGVwKSB7XG4gICAgICBpZiAoZml4ZWRUaW1lU3RlcCkgc2VsZi5leGVjdXRlKCdzZXRGaXhlZFRpbWVTdGVwJywgZml4ZWRUaW1lU3RlcCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRHcmF2aXR5ID0gZnVuY3Rpb24oZ3Jhdml0eSkge1xuICAgICAgaWYgKGdyYXZpdHkpIHNlbGYuZXhlY3V0ZSgnc2V0R3Jhdml0eScsIGdyYXZpdHkpO1xuICAgIH1cblxuICAgIHRoaXMuYWRkQ29uc3RyYWludCA9IHNlbGYuYWRkQ29uc3RyYWludC5iaW5kKHNlbGYpO1xuXG4gICAgdGhpcy5zaW11bGF0ZSA9IGZ1bmN0aW9uKHRpbWVTdGVwLCBtYXhTdWJTdGVwcykge1xuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5iZWdpbigpO1xuXG4gICAgICBpZiAoc2VsZi5pc1NpbXVsYXRpbmcpIHJldHVybiBmYWxzZTtcbiAgICAgIHNlbGYuaXNTaW11bGF0aW5nID0gdHJ1ZTtcblxuICAgICAgZm9yIChjb25zdCBvYmplY3RfaWQgaW4gc2VsZi5vYmplY3RzKSB7XG4gICAgICAgIGlmICghc2VsZi5vYmplY3RzLmhhc093blByb3BlcnR5KG9iamVjdF9pZCkpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IG9iamVjdCA9IHNlbGYub2JqZWN0c1tvYmplY3RfaWRdO1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgICAgaWYgKG9iamVjdCAhPT0gbnVsbCAmJiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiB8fCBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uKSkge1xuICAgICAgICAgIGNvbnN0IHVwZGF0ZSA9IHtpZDogZGF0YS5pZH07XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnBvcyA9IHtcbiAgICAgICAgICAgICAgeDogb2JqZWN0LnBvc2l0aW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5wb3NpdGlvbi55LFxuICAgICAgICAgICAgICB6OiBvYmplY3QucG9zaXRpb24uelxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGRhdGEuaXNTb2Z0Ym9keSkgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcblxuICAgICAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uKSB7XG4gICAgICAgICAgICB1cGRhdGUucXVhdCA9IHtcbiAgICAgICAgICAgICAgeDogb2JqZWN0LnF1YXRlcm5pb24ueCxcbiAgICAgICAgICAgICAgeTogb2JqZWN0LnF1YXRlcm5pb24ueSxcbiAgICAgICAgICAgICAgejogb2JqZWN0LnF1YXRlcm5pb24ueixcbiAgICAgICAgICAgICAgdzogb2JqZWN0LnF1YXRlcm5pb24ud1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGRhdGEuaXNTb2Z0Ym9keSkgb2JqZWN0LnJvdGF0aW9uLnNldCgwLCAwLCAwKTtcblxuICAgICAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuZXhlY3V0ZSgndXBkYXRlVHJhbnNmb3JtJywgdXBkYXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZWxmLmV4ZWN1dGUoJ3NpbXVsYXRlJywge3RpbWVTdGVwLCBtYXhTdWJTdGVwc30pO1xuXG4gICAgICBpZiAoc2VsZi5fc3RhdHMpIHNlbGYuX3N0YXRzLmVuZCgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gY29uc3Qgc2ltdWxhdGVQcm9jZXNzID0gKHQpID0+IHtcbiAgICAvLyAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoc2ltdWxhdGVQcm9jZXNzKTtcblxuICAgIC8vICAgdGhpcy5zaW11bGF0ZSgxLzYwLCAxKTsgLy8gZGVsdGEsIDFcbiAgICAvLyB9XG5cbiAgICAvLyBzaW11bGF0ZVByb2Nlc3MoKTtcblxuICAgIHNlbGYubG9hZGVyLnRoZW4oKCkgPT4ge1xuICAgICAgc2VsZi5zaW11bGF0ZUxvb3AgPSBuZXcgTG9vcCgoY2xvY2spID0+IHtcbiAgICAgICAgdGhpcy5zaW11bGF0ZShjbG9jay5nZXREZWx0YSgpLCAxKTsgLy8gZGVsdGEsIDFcbiAgICAgIH0pO1xuXG4gICAgICBzZWxmLnNpbXVsYXRlTG9vcC5zdGFydCh0aGlzKTtcblxuICAgICAgY29uc29sZS5sb2coc2VsZi5vcHRpb25zLmdyYXZpdHkpO1xuICAgICAgdGhpcy5zZXRHcmF2aXR5KHNlbGYub3B0aW9ucy5ncmF2aXR5KTtcbiAgICB9KTtcbiAgfVxufVxuIiwidmFyIFRBUkdFVCA9IHR5cGVvZiBTeW1ib2wgPT09ICd1bmRlZmluZWQnID8gJ19fdGFyZ2V0JyA6IFN5bWJvbCgpLFxuICAgIFNDUklQVF9UWVBFID0gJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnLFxuICAgIEJsb2JCdWlsZGVyID0gd2luZG93LkJsb2JCdWlsZGVyIHx8IHdpbmRvdy5XZWJLaXRCbG9iQnVpbGRlciB8fCB3aW5kb3cuTW96QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1TQmxvYkJ1aWxkZXIsXG4gICAgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMLFxuICAgIFdvcmtlciA9IHdpbmRvdy5Xb3JrZXI7XG5cbi8qKlxuICogUmV0dXJucyBhIHdyYXBwZXIgYXJvdW5kIFdlYiBXb3JrZXIgY29kZSB0aGF0IGlzIGNvbnN0cnVjdGlibGUuXG4gKlxuICogQGZ1bmN0aW9uIHNoaW1Xb3JrZXJcbiAqXG4gKiBAcGFyYW0geyBTdHJpbmcgfSAgICBmaWxlbmFtZSAgICBUaGUgbmFtZSBvZiB0aGUgZmlsZVxuICogQHBhcmFtIHsgRnVuY3Rpb24gfSAgZm4gICAgICAgICAgRnVuY3Rpb24gd3JhcHBpbmcgdGhlIGNvZGUgb2YgdGhlIHdvcmtlclxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzaGltV29ya2VyIChmaWxlbmFtZSwgZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gU2hpbVdvcmtlciAoZm9yY2VGYWxsYmFjaykge1xuICAgICAgICB2YXIgbyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBXb3JrZXIoZmlsZW5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKFdvcmtlciAmJiAhZm9yY2VGYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgZnVuY3Rpb24ncyBpbm5lciBjb2RlIHRvIGEgc3RyaW5nIHRvIGNvbnN0cnVjdCB0aGUgd29ya2VyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gZm4udG9TdHJpbmcoKS5yZXBsYWNlKC9eZnVuY3Rpb24uKz97LywgJycpLnNsaWNlKDAsIC0xKSxcbiAgICAgICAgICAgICAgICBvYmpVUkwgPSBjcmVhdGVTb3VyY2VPYmplY3Qoc291cmNlKTtcblxuICAgICAgICAgICAgdGhpc1tUQVJHRVRdID0gbmV3IFdvcmtlcihvYmpVUkwpO1xuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChvYmpVUkwpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbVEFSR0VUXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzZWxmU2hpbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2U6IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLm9ubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgby5vbm1lc3NhZ2UoeyBkYXRhOiBtLCB0YXJnZXQ6IHNlbGZTaGltIH0pIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm4uY2FsbChzZWxmU2hpbSk7XG4gICAgICAgICAgICB0aGlzLnBvc3RNZXNzYWdlID0gZnVuY3Rpb24obSkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgc2VsZlNoaW0ub25tZXNzYWdlKHsgZGF0YTogbSwgdGFyZ2V0OiBvIH0pIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuaXNUaGlzVGhyZWFkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vLyBUZXN0IFdvcmtlciBjYXBhYmlsaXRpZXNcbmlmIChXb3JrZXIpIHtcbiAgICB2YXIgdGVzdFdvcmtlcixcbiAgICAgICAgb2JqVVJMID0gY3JlYXRlU291cmNlT2JqZWN0KCdzZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uICgpIHt9JyksXG4gICAgICAgIHRlc3RBcnJheSA9IG5ldyBVaW50OEFycmF5KDEpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gTm8gd29ya2VycyB2aWEgYmxvYnMgaW4gRWRnZSAxMiBhbmQgSUUgMTEgYW5kIGxvd2VyIDooXG4gICAgICAgIGlmICgvKD86VHJpZGVudHxFZGdlKVxcLyg/Ols1NjddfDEyKS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGF2YWlsYWJsZScpO1xuICAgICAgICB9XG4gICAgICAgIHRlc3RXb3JrZXIgPSBuZXcgV29ya2VyKG9ialVSTCk7XG5cbiAgICAgICAgLy8gTmF0aXZlIGJyb3dzZXIgb24gc29tZSBTYW1zdW5nIGRldmljZXMgdGhyb3dzIGZvciB0cmFuc2ZlcmFibGVzLCBsZXQncyBkZXRlY3QgaXRcbiAgICAgICAgdGVzdFdvcmtlci5wb3N0TWVzc2FnZSh0ZXN0QXJyYXksIFt0ZXN0QXJyYXkuYnVmZmVyXSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIFdvcmtlciA9IG51bGw7XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKG9ialVSTCk7XG4gICAgICAgIGlmICh0ZXN0V29ya2VyKSB7XG4gICAgICAgICAgICB0ZXN0V29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTb3VyY2VPYmplY3Qoc3RyKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW3N0cl0sIHsgdHlwZTogU0NSSVBUX1RZUEUgfSkpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iQnVpbGRlcigpO1xuICAgICAgICBibG9iLmFwcGVuZChzdHIpO1xuICAgICAgICByZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iLmdldEJsb2IodHlwZSkpO1xuICAgIH1cbn1cbiIsImltcG9ydCBzaGltV29ya2VyIGZyb20gJ3JvbGx1cC1wbHVnaW4tYnVuZGxlLXdvcmtlcic7XG5leHBvcnQgZGVmYXVsdCBuZXcgc2hpbVdvcmtlcihcIi4uL3dvcmtlci5qc1wiLCBmdW5jdGlvbiAod2luZG93LCBkb2N1bWVudCkge1xudmFyIHNlbGYgPSB0aGlzO1xuZnVuY3Rpb24gRXZlbnRzKHRhcmdldCkge1xuICB2YXIgZXZlbnRzID0ge30sXG4gICAgZW1wdHkgPSBbXTtcbiAgdGFyZ2V0ID0gdGFyZ2V0IHx8IHRoaXNcbiAgLyoqXG4gICAqICBPbjogbGlzdGVuIHRvIGV2ZW50c1xuICAgKi9cbiAgdGFyZ2V0Lm9uID0gZnVuY3Rpb24gKHR5cGUsIGZ1bmMsIGN0eCkge1xuICAgIChldmVudHNbdHlwZV0gPSBldmVudHNbdHlwZV0gfHwgW10pLnB1c2goW2Z1bmMsIGN0eF0pXG4gICAgcmV0dXJuIHRhcmdldFxuICB9XG4gIC8qKlxuICAgKiAgT2ZmOiBzdG9wIGxpc3RlbmluZyB0byBldmVudCAvIHNwZWNpZmljIGNhbGxiYWNrXG4gICAqL1xuICB0YXJnZXQub2ZmID0gZnVuY3Rpb24gKHR5cGUsIGZ1bmMpIHtcbiAgICB0eXBlIHx8IChldmVudHMgPSB7fSlcbiAgICB2YXIgbGlzdCA9IGV2ZW50c1t0eXBlXSB8fCBlbXB0eSxcbiAgICAgIGkgPSBsaXN0Lmxlbmd0aCA9IGZ1bmMgPyBsaXN0Lmxlbmd0aCA6IDA7XG4gICAgd2hpbGUgKGktLSkgZnVuYyA9PSBsaXN0W2ldWzBdICYmIGxpc3Quc3BsaWNlKGksIDEpXG4gICAgcmV0dXJuIHRhcmdldFxuICB9XG4gIC8qKlxuICAgKiBFbWl0OiBzZW5kIGV2ZW50LCBjYWxsYmFja3Mgd2lsbCBiZSB0cmlnZ2VyZWRcbiAgICovXG4gIHRhcmdldC5lbWl0ID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICB2YXIgZSA9IGV2ZW50c1t0eXBlXSB8fCBlbXB0eSxcbiAgICAgIGxpc3QgPSBlLmxlbmd0aCA+IDAgPyBlLnNsaWNlKDAsIGUubGVuZ3RoKSA6IGUsXG4gICAgICBpID0gMCxcbiAgICAgIGo7XG4gICAgd2hpbGUgKGogPSBsaXN0W2krK10pIGpbMF0uYXBwbHkoalsxXSwgZW1wdHkuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKVxuICAgIHJldHVybiB0YXJnZXRcbiAgfTtcbn07XG5cbmNvbnN0IGluc2lkZVdvcmtlciA9ICFzZWxmLmRvY3VtZW50O1xuaWYgKCFpbnNpZGVXb3JrZXIpIHNlbGYgPSBuZXcgRXZlbnRzKCk7XG5cbmxldCBzZW5kID0gaW5zaWRlV29ya2VyID8gKHNlbGYud2Via2l0UG9zdE1lc3NhZ2UgfHwgc2VsZi5wb3N0TWVzc2FnZSkgOiBmdW5jdGlvbiAoZGF0YSkge1xuICBzZWxmLmVtaXQoJ21lc3NhZ2UnLCB7IGRhdGEgfSk7XG59O1xuXG5zZWxmLnNlbmQgPSBzZW5kO1xuXG5sZXQgU1VQUE9SVF9UUkFOU0ZFUkFCTEU7XG5cbmlmIChpbnNpZGVXb3JrZXIpIHtcbiAgY29uc3QgYWIgPSBuZXcgQXJyYXlCdWZmZXIoMSk7XG5cbiAgc2VuZChhYiwgW2FiXSk7XG4gIFNVUFBPUlRfVFJBTlNGRVJBQkxFID0gKGFiLmJ5dGVMZW5ndGggPT09IDApO1xufVxuXG5jb25zdCBNRVNTQUdFX1RZUEVTID0ge1xuICBXT1JMRFJFUE9SVDogMCxcbiAgQ09MTElTSU9OUkVQT1JUOiAxLFxuICBWRUhJQ0xFUkVQT1JUOiAyLFxuICBDT05TVFJBSU5UUkVQT1JUOiAzLFxuICBTT0ZUUkVQT1JUOiA0XG59O1xuXG4vLyB0ZW1wIHZhcmlhYmxlc1xubGV0IF9vYmplY3QsXG4gIF92ZWN0b3IsXG4gIF90cmFuc2Zvcm0sXG4gIF90cmFuc2Zvcm1fcG9zLFxuICBfc29mdGJvZHlfZW5hYmxlZCA9IGZhbHNlLFxuICBsYXN0X3NpbXVsYXRpb25fZHVyYXRpb24gPSAwLFxuXG4gIF9udW1fb2JqZWN0cyA9IDAsXG4gIF9udW1fcmlnaWRib2R5X29iamVjdHMgPSAwLFxuICBfbnVtX3NvZnRib2R5X29iamVjdHMgPSAwLFxuICBfbnVtX3doZWVscyA9IDAsXG4gIF9udW1fY29uc3RyYWludHMgPSAwLFxuICBfc29mdGJvZHlfcmVwb3J0X3NpemUgPSAwLFxuXG4gIC8vIHdvcmxkIHZhcmlhYmxlc1xuICBmaXhlZFRpbWVTdGVwLCAvLyB1c2VkIHdoZW4gY2FsbGluZyBzdGVwU2ltdWxhdGlvblxuICBsYXN0X3NpbXVsYXRpb25fdGltZSxcblxuICB3b3JsZCxcbiAgX3ZlYzNfMSxcbiAgX3ZlYzNfMixcbiAgX3ZlYzNfMyxcbiAgX3F1YXQ7XG5cbi8vIHByaXZhdGUgY2FjaGVcbmNvbnN0IHB1YmxpY19mdW5jdGlvbnMgPSB7fSxcbiAgX29iamVjdHMgPSBbXSxcbiAgX3ZlaGljbGVzID0gW10sXG4gIF9jb25zdHJhaW50cyA9IFtdLFxuICBfb2JqZWN0c19hbW1vID0ge30sXG4gIF9vYmplY3Rfc2hhcGVzID0ge30sXG5cbiAgLy8gVGhlIGZvbGxvd2luZyBvYmplY3RzIGFyZSB0byB0cmFjayBvYmplY3RzIHRoYXQgYW1tby5qcyBkb2Vzbid0IGNsZWFuXG4gIC8vIHVwLiBBbGwgYXJlIGNsZWFuZWQgdXAgd2hlbiB0aGV5J3JlIGNvcnJlc3BvbmRpbmcgYm9keSBpcyBkZXN0cm95ZWQuXG4gIC8vIFVuZm9ydHVuYXRlbHksIGl0J3MgdmVyeSBkaWZmaWN1bHQgdG8gZ2V0IGF0IHRoZXNlIG9iamVjdHMgZnJvbSB0aGVcbiAgLy8gYm9keSwgc28gd2UgaGF2ZSB0byB0cmFjayB0aGVtIG91cnNlbHZlcy5cbiAgX21vdGlvbl9zdGF0ZXMgPSB7fSxcbiAgLy8gRG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dCBpdCBmb3IgY2FjaGVkIHNoYXBlcy5cbiAgX25vbmNhY2hlZF9zaGFwZXMgPSB7fSxcbiAgLy8gQSBib2R5IHdpdGggYSBjb21wb3VuZCBzaGFwZSBhbHdheXMgaGFzIGEgcmVndWxhciBzaGFwZSBhcyB3ZWxsLCBzbyB3ZVxuICAvLyBoYXZlIHRyYWNrIHRoZW0gc2VwYXJhdGVseS5cbiAgX2NvbXBvdW5kX3NoYXBlcyA9IHt9O1xuXG4vLyBvYmplY3QgcmVwb3J0aW5nXG5sZXQgUkVQT1JUX0NIVU5LU0laRSwgLy8gcmVwb3J0IGFycmF5IGlzIGluY3JlYXNlZCBpbiBpbmNyZW1lbnRzIG9mIHRoaXMgY2h1bmsgc2l6ZVxuICB3b3JsZHJlcG9ydCxcbiAgc29mdHJlcG9ydCxcbiAgY29sbGlzaW9ucmVwb3J0LFxuICB2ZWhpY2xlcmVwb3J0LFxuICBjb25zdHJhaW50cmVwb3J0O1xuXG5jb25zdCBXT1JMRFJFUE9SVF9JVEVNU0laRSA9IDE0LCAvLyBob3cgbWFueSBmbG9hdCB2YWx1ZXMgZWFjaCByZXBvcnRlZCBpdGVtIG5lZWRzXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSA9IDUsIC8vIG9uZSBmbG9hdCBmb3IgZWFjaCBvYmplY3QgaWQsIGFuZCBhIFZlYzMgY29udGFjdCBub3JtYWxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSA9IDksIC8vIHZlaGljbGUgaWQsIHdoZWVsIGluZGV4LCAzIGZvciBwb3NpdGlvbiwgNCBmb3Igcm90YXRpb25cbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSA9IDY7IC8vIGNvbnN0cmFpbnQgaWQsIG9mZnNldCBvYmplY3QsIG9mZnNldCwgYXBwbGllZCBpbXB1bHNlXG5cbmNvbnN0IGdldFNoYXBlRnJvbUNhY2hlID0gKGNhY2hlX2tleSkgPT4ge1xuICBpZiAoX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XSAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldO1xuXG4gIHJldHVybiBudWxsO1xufTtcblxuY29uc3Qgc2V0U2hhcGVDYWNoZSA9IChjYWNoZV9rZXksIHNoYXBlKSA9PiB7XG4gIF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV0gPSBzaGFwZTtcbn07XG5cbmNvbnN0IGNyZWF0ZVNoYXBlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBzaGFwZTtcblxuICBfdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG4gIHN3aXRjaCAoZGVzY3JpcHRpb24udHlwZSkge1xuICBjYXNlICdjb21wb3VuZCc6XG4gICAge1xuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbXBvdW5kU2hhcGUoKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdwbGFuZSc6XG4gICAge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYHBsYW5lXyR7ZGVzY3JpcHRpb24ubm9ybWFsLnh9XyR7ZGVzY3JpcHRpb24ubm9ybWFsLnl9XyR7ZGVzY3JpcHRpb24ubm9ybWFsLnp9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5ub3JtYWwueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5ub3JtYWwueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5ub3JtYWwueik7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRTdGF0aWNQbGFuZVNoYXBlKF92ZWMzXzEsIDApO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2JveCc6XG4gICAge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGJveF8ke2Rlc2NyaXB0aW9uLndpZHRofV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1fJHtkZXNjcmlwdGlvbi5kZXB0aH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLndpZHRoIC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5oZWlnaHQgLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLmRlcHRoIC8gMik7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRCb3hTaGFwZShfdmVjM18xKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdzcGhlcmUnOlxuICAgIHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBzcGhlcmVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRTcGhlcmVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2N5bGluZGVyJzpcbiAgICB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgY3lsaW5kZXJfJHtkZXNjcmlwdGlvbi53aWR0aH1fJHtkZXNjcmlwdGlvbi5oZWlnaHR9XyR7ZGVzY3JpcHRpb24uZGVwdGh9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi53aWR0aCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uaGVpZ2h0IC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5kZXB0aCAvIDIpO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q3lsaW5kZXJTaGFwZShfdmVjM18xKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdjYXBzdWxlJzpcbiAgICB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgY2Fwc3VsZV8ke2Rlc2NyaXB0aW9uLnJhZGl1c31fJHtkZXNjcmlwdGlvbi5oZWlnaHR9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIC8vIEluIEJ1bGxldCwgY2Fwc3VsZSBoZWlnaHQgZXhjbHVkZXMgdGhlIGVuZCBzcGhlcmVzXG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDYXBzdWxlU2hhcGUoZGVzY3JpcHRpb24ucmFkaXVzLCBkZXNjcmlwdGlvbi5oZWlnaHQgLSAyICogZGVzY3JpcHRpb24ucmFkaXVzKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdjb25lJzpcbiAgICB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgY29uZV8ke2Rlc2NyaXB0aW9uLnJhZGl1c31fJHtkZXNjcmlwdGlvbi5oZWlnaHR9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb25lU2hhcGUoZGVzY3JpcHRpb24ucmFkaXVzLCBkZXNjcmlwdGlvbi5oZWlnaHQpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2NvbmNhdmUnOlxuICAgIHtcbiAgICAgIGNvbnN0IHRyaWFuZ2xlX21lc2ggPSBuZXcgQW1tby5idFRyaWFuZ2xlTWVzaCgpO1xuICAgICAgaWYgKCFkZXNjcmlwdGlvbi5kYXRhLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3QgZGF0YSA9IGRlc2NyaXB0aW9uLmRhdGE7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGggLyA5OyBpKyspIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRhdGFbaSAqIDldKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRhdGFbaSAqIDkgKyAxXSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkYXRhW2kgKiA5ICsgMl0pO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkYXRhW2kgKiA5ICsgM10pO1xuICAgICAgICBfdmVjM18yLnNldFkoZGF0YVtpICogOSArIDRdKTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRhdGFbaSAqIDkgKyA1XSk7XG5cbiAgICAgICAgX3ZlYzNfMy5zZXRYKGRhdGFbaSAqIDkgKyA2XSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WShkYXRhW2kgKiA5ICsgN10pO1xuICAgICAgICBfdmVjM18zLnNldFooZGF0YVtpICogOSArIDhdKTtcblxuICAgICAgICB0cmlhbmdsZV9tZXNoLmFkZFRyaWFuZ2xlKFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMixcbiAgICAgICAgICBfdmVjM18zLFxuICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRCdmhUcmlhbmdsZU1lc2hTaGFwZShcbiAgICAgICAgdHJpYW5nbGVfbWVzaCxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdHJ1ZVxuICAgICAgKTtcblxuICAgICAgX25vbmNhY2hlZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnY29udmV4JzpcbiAgICB7XG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29udmV4SHVsbFNoYXBlKCk7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aCAvIDM7IGkrKykge1xuICAgICAgICBfdmVjM18xLnNldFgoZGF0YVtpICogM10pO1xuICAgICAgICBfdmVjM18xLnNldFkoZGF0YVtpICogMyArIDFdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRhdGFbaSAqIDMgKyAyXSk7XG5cbiAgICAgICAgc2hhcGUuYWRkUG9pbnQoX3ZlYzNfMSk7XG4gICAgICB9XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2hlaWdodGZpZWxkJzpcbiAgICB7XG4gICAgICBjb25zdCB4cHRzID0gZGVzY3JpcHRpb24ueHB0cyxcbiAgICAgICAgeXB0cyA9IGRlc2NyaXB0aW9uLnlwdHMsXG4gICAgICAgIHBvaW50cyA9IGRlc2NyaXB0aW9uLnBvaW50cyxcbiAgICAgICAgcHRyID0gQW1tby5fbWFsbG9jKDQgKiB4cHRzICogeXB0cyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwLCBwID0gMCwgcDIgPSAwOyBpIDwgeHB0czsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgeXB0czsgaisrKSB7XG4gICAgICAgICAgQW1tby5IRUFQRjMyW3B0ciArIHAyID4+IDJdID0gcG9pbnRzW3BdO1xuXG4gICAgICAgICAgcCsrO1xuICAgICAgICAgIHAyICs9IDQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEhlaWdodGZpZWxkVGVycmFpblNoYXBlKFxuICAgICAgICBkZXNjcmlwdGlvbi54cHRzLFxuICAgICAgICBkZXNjcmlwdGlvbi55cHRzLFxuICAgICAgICBwdHIsXG4gICAgICAgIDEsIC1kZXNjcmlwdGlvbi5hYnNNYXhIZWlnaHQsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFic01heEhlaWdodCxcbiAgICAgICAgMSxcbiAgICAgICAgJ1BIWV9GTE9BVCcsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgZGVmYXVsdDpcbiAgICAvLyBOb3QgcmVjb2duaXplZFxuICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBzaGFwZTtcbn07XG5cbmNvbnN0IGNyZWF0ZVNvZnRCb2R5ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBib2R5O1xuXG4gIGNvbnN0IHNvZnRCb2R5SGVscGVycyA9IG5ldyBBbW1vLmJ0U29mdEJvZHlIZWxwZXJzKCk7XG5cbiAgc3dpdGNoIChkZXNjcmlwdGlvbi50eXBlKSB7XG4gIGNhc2UgJ3NvZnRUcmltZXNoJzpcbiAgICB7XG4gICAgICBpZiAoIWRlc2NyaXB0aW9uLmFWZXJ0aWNlcy5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVGcm9tVHJpTWVzaChcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIGRlc2NyaXB0aW9uLmFWZXJ0aWNlcyxcbiAgICAgICAgZGVzY3JpcHRpb24uYUluZGljZXMsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFJbmRpY2VzLmxlbmd0aCAvIDMsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ3NvZnRDbG90aE1lc2gnOlxuICAgIHtcbiAgICAgIGNvbnN0IGNyID0gZGVzY3JpcHRpb24uY29ybmVycztcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVQYXRjaChcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjclswXSwgY3JbMV0sIGNyWzJdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzNdLCBjcls0XSwgY3JbNV0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbNl0sIGNyWzddLCBjcls4XSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjcls5XSwgY3JbMTBdLCBjclsxMV0pLFxuICAgICAgICBkZXNjcmlwdGlvbi5zZWdtZW50c1swXSxcbiAgICAgICAgZGVzY3JpcHRpb24uc2VnbWVudHNbMV0sXG4gICAgICAgIDAsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnc29mdFJvcGVNZXNoJzpcbiAgICB7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgYm9keSA9IHNvZnRCb2R5SGVscGVycy5DcmVhdGVSb3BlKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGRhdGFbMF0sIGRhdGFbMV0sIGRhdGFbMl0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoZGF0YVszXSwgZGF0YVs0XSwgZGF0YVs1XSksXG4gICAgICAgIGRhdGFbNl0gLSAxLFxuICAgICAgICAwXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGRlZmF1bHQ6XG4gICAgLy8gTm90IHJlY29nbml6ZWRcbiAgICByZXR1cm47XG4gIH1cblxuICByZXR1cm4gYm9keTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaW5pdCA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBpZiAocGFyYW1zLm5vV29ya2VyKSB7XG4gICAgd2luZG93LkFtbW8gPSBuZXcgcGFyYW1zLmFtbW8oKTtcbiAgICBwdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZChwYXJhbXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChwYXJhbXMud2FzbUJ1ZmZlcikge1xuICAgIGltcG9ydFNjcmlwdHMocGFyYW1zLmFtbW8pO1xuXG4gICAgc2VsZi5BbW1vID0gbmV3IGxvYWRBbW1vRnJvbUJpbmFyeShwYXJhbXMud2FzbUJ1ZmZlcikoKTtcbiAgICBzZW5kKHsgY21kOiAnYW1tb0xvYWRlZCcgfSk7XG4gICAgcHVibGljX2Z1bmN0aW9ucy5tYWtlV29ybGQocGFyYW1zKTtcbiAgfVxuICBlbHNlIHtcbiAgICBpbXBvcnRTY3JpcHRzKHBhcmFtcy5hbW1vKTtcbiAgICBzZW5kKHsgY21kOiAnYW1tb0xvYWRlZCcgfSk7XG5cbiAgICBzZWxmLkFtbW8gPSBuZXcgQW1tbygpO1xuICAgIHB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkKHBhcmFtcyk7XG4gIH1cbn1cblxucHVibGljX2Z1bmN0aW9ucy5tYWtlV29ybGQgPSAocGFyYW1zID0ge30pID0+IHtcbiAgX3RyYW5zZm9ybSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gIF90cmFuc2Zvcm1fcG9zID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgX3ZlYzNfMSA9IG5ldyBBbW1vLmJ0VmVjdG9yMygwLCAwLCAwKTtcbiAgX3ZlYzNfMiA9IG5ldyBBbW1vLmJ0VmVjdG9yMygwLCAwLCAwKTtcbiAgX3ZlYzNfMyA9IG5ldyBBbW1vLmJ0VmVjdG9yMygwLCAwLCAwKTtcbiAgX3F1YXQgPSBuZXcgQW1tby5idFF1YXRlcm5pb24oMCwgMCwgMCwgMCk7XG5cbiAgUkVQT1JUX0NIVU5LU0laRSA9IHBhcmFtcy5yZXBvcnRzaXplIHx8IDUwO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIC8vIFRyYW5zZmVyYWJsZSBtZXNzYWdlcyBhcmUgc3VwcG9ydGVkLCB0YWtlIGFkdmFudGFnZSBvZiB0aGVtIHdpdGggVHlwZWRBcnJheXNcbiAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBXT1JMRFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIG9iamVjdHMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICBjb2xsaXNpb25yZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2YgY29sbGlzaW9ucyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIHZlaGljbGVzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2YgY29uc3RyYWludHMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBUcmFuc2ZlcmFibGUgbWVzc2FnZXMgYXJlIG5vdCBzdXBwb3J0ZWQsIHNlbmQgZGF0YSBhcyBub3JtYWwgYXJyYXlzXG4gICAgd29ybGRyZXBvcnQgPSBbXTtcbiAgICBjb2xsaXNpb25yZXBvcnQgPSBbXTtcbiAgICB2ZWhpY2xlcmVwb3J0ID0gW107XG4gICAgY29uc3RyYWludHJlcG9ydCA9IFtdO1xuICB9XG5cbiAgd29ybGRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUO1xuICBjb2xsaXNpb25yZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDtcbiAgdmVoaWNsZXJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDtcbiAgY29uc3RyYWludHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDtcblxuICBjb25zdCBjb2xsaXNpb25Db25maWd1cmF0aW9uID0gcGFyYW1zLnNvZnRib2R5ID9cbiAgICBuZXcgQW1tby5idFNvZnRCb2R5UmlnaWRCb2R5Q29sbGlzaW9uQ29uZmlndXJhdGlvbigpIDpcbiAgICBuZXcgQW1tby5idERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uKCksXG4gICAgZGlzcGF0Y2hlciA9IG5ldyBBbW1vLmJ0Q29sbGlzaW9uRGlzcGF0Y2hlcihjb2xsaXNpb25Db25maWd1cmF0aW9uKSxcbiAgICBzb2x2ZXIgPSBuZXcgQW1tby5idFNlcXVlbnRpYWxJbXB1bHNlQ29uc3RyYWludFNvbHZlcigpO1xuXG4gIGxldCBicm9hZHBoYXNlO1xuXG4gIGlmICghcGFyYW1zLmJyb2FkcGhhc2UpIHBhcmFtcy5icm9hZHBoYXNlID0geyB0eXBlOiAnZHluYW1pYycgfTtcbiAgLy8gVE9ETyEhIVxuICAvKiBpZiAocGFyYW1zLmJyb2FkcGhhc2UudHlwZSA9PT0gJ3N3ZWVwcHJ1bmUnKSB7XG4gICAgZXh0ZW5kKHBhcmFtcy5icm9hZHBoYXNlLCB7XG4gICAgICBhYWJibWluOiB7XG4gICAgICAgIHg6IC01MCxcbiAgICAgICAgeTogLTUwLFxuICAgICAgICB6OiAtNTBcbiAgICAgIH0sXG5cbiAgICAgIGFhYmJtYXg6IHtcbiAgICAgICAgeDogNTAsXG4gICAgICAgIHk6IDUwLFxuICAgICAgICB6OiA1MFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSovXG5cbiAgc3dpdGNoIChwYXJhbXMuYnJvYWRwaGFzZS50eXBlKSB7XG4gIGNhc2UgJ3N3ZWVwcHJ1bmUnOlxuICAgIF92ZWMzXzEuc2V0WChwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWluLngpO1xuICAgIF92ZWMzXzEuc2V0WShwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWluLnkpO1xuICAgIF92ZWMzXzEuc2V0WihwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWluLnopO1xuXG4gICAgX3ZlYzNfMi5zZXRYKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtYXgueCk7XG4gICAgX3ZlYzNfMi5zZXRZKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtYXgueSk7XG4gICAgX3ZlYzNfMi5zZXRaKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtYXgueik7XG5cbiAgICBicm9hZHBoYXNlID0gbmV3IEFtbW8uYnRBeGlzU3dlZXAzKFxuICAgICAgX3ZlYzNfMSxcbiAgICAgIF92ZWMzXzJcbiAgICApO1xuXG4gICAgYnJlYWs7XG4gIGNhc2UgJ2R5bmFtaWMnOlxuICBkZWZhdWx0OlxuICAgIGJyb2FkcGhhc2UgPSBuZXcgQW1tby5idERidnRCcm9hZHBoYXNlKCk7XG4gICAgYnJlYWs7XG4gIH1cblxuICB3b3JsZCA9IHBhcmFtcy5zb2Z0Ym9keSA/XG4gICAgbmV3IEFtbW8uYnRTb2Z0UmlnaWREeW5hbWljc1dvcmxkKGRpc3BhdGNoZXIsIGJyb2FkcGhhc2UsIHNvbHZlciwgY29sbGlzaW9uQ29uZmlndXJhdGlvbiwgbmV3IEFtbW8uYnREZWZhdWx0U29mdEJvZHlTb2x2ZXIoKSkgOlxuICAgIG5ldyBBbW1vLmJ0RGlzY3JldGVEeW5hbWljc1dvcmxkKGRpc3BhdGNoZXIsIGJyb2FkcGhhc2UsIHNvbHZlciwgY29sbGlzaW9uQ29uZmlndXJhdGlvbik7XG4gIGZpeGVkVGltZVN0ZXAgPSBwYXJhbXMuZml4ZWRUaW1lU3RlcDtcblxuICBpZiAocGFyYW1zLnNvZnRib2R5KSBfc29mdGJvZHlfZW5hYmxlZCA9IHRydWU7XG5cbiAgc2VuZCh7IGNtZDogJ3dvcmxkUmVhZHknIH0pO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRGaXhlZFRpbWVTdGVwID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGZpeGVkVGltZVN0ZXAgPSBkZXNjcmlwdGlvbjtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0R3Jhdml0eSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ueCk7XG4gIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi55KTtcbiAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnopO1xuICB3b3JsZC5zZXRHcmF2aXR5KF92ZWMzXzEpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBlbmRBbmNob3IgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgX29iamVjdHNbZGVzY3JpcHRpb24ub2JqXVxuICAgIC5hcHBlbmRBbmNob3IoXG4gICAgICBkZXNjcmlwdGlvbi5ub2RlLFxuICAgICAgX29iamVjdHNbZGVzY3JpcHRpb24ub2JqMl0sXG4gICAgICBkZXNjcmlwdGlvbi5jb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzLFxuICAgICAgZGVzY3JpcHRpb24uaW5mbHVlbmNlXG4gICAgKTtcbn1cblxucHVibGljX2Z1bmN0aW9ucy5saW5rTm9kZXMgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgdmFyIHNlbGZfYm9keSA9IF9vYmplY3RzW2Rlc2NyaXB0aW9uLnNlbGZdO1xuICB2YXIgb3RoZXJfYm9keSA9IF9vYmplY3RzW2Rlc2NyaXB0aW9uLmJvZHldO1xuXG4gIHZhciBzZWxmX25vZGUgPSBzZWxmX2JvZHkuZ2V0X21fbm9kZXMoKS5hdChkZXNjcmlwdGlvbi5uMSk7XG4gIHZhciBvdGhlcl9ub2RlID0gb3RoZXJfYm9keS5nZXRfbV9ub2RlcygpLmF0KGRlc2NyaXB0aW9uLm4yKTtcblxuICB2YXIgc2VsZl92ZWMgPSBzZWxmX25vZGUuZ2V0X21feCgpO1xuICB2YXIgb3RoZXJfdmVjID0gb3RoZXJfbm9kZS5nZXRfbV94KCk7XG5cbiAgdmFyIGZvcmNlX3ggPSBvdGhlcl92ZWMueCgpIC0gc2VsZl92ZWMueCgpO1xuICB2YXIgZm9yY2VfeSA9IG90aGVyX3ZlYy55KCkgLSBzZWxmX3ZlYy55KCk7XG4gIHZhciBmb3JjZV96ID0gb3RoZXJfdmVjLnooKSAtIHNlbGZfdmVjLnooKTtcblxuXG4gIC8vIHZhciBtb2RpZmllciA9IDMwO1xuXG4gIGxldCBjYWNoZWRfZGlzdGFuY2UsIGxpbmtlZCA9IGZhbHNlO1xuXG4gIGNvbnN0IF9sb29wID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIGZvcmNlX3ggPSBvdGhlcl92ZWMueCgpIC0gc2VsZl92ZWMueCgpO1xuICAgIGZvcmNlX3kgPSBvdGhlcl92ZWMueSgpIC0gc2VsZl92ZWMueSgpO1xuICAgIGZvcmNlX3ogPSBvdGhlcl92ZWMueigpIC0gc2VsZl92ZWMueigpO1xuXG4gICAgbGV0IGRpc3RhbmNlID0gTWF0aC5zcXJ0KGZvcmNlX3ggKiBmb3JjZV94ICsgZm9yY2VfeSAqIGZvcmNlX3kgKyBmb3JjZV96ICogZm9yY2Vfeik7XG5cbiAgICBpZiAoY2FjaGVkX2Rpc3RhbmNlICYmICFsaW5rZWQgJiYgY2FjaGVkX2Rpc3RhbmNlIDwgZGlzdGFuY2UpIHsgLy8gY2FjaGVkX2Rpc3RhbmNlICYmICFsaW5rZWQgJiYgY2FjaGVkX2Rpc3RhbmNlIDwgZGlzdGFuY2VcblxuICAgICAgbGlua2VkID0gdHJ1ZTtcblxuICAgICAgLy8gbGV0IHNlbGZfdmVsID0gc2VsZl9ub2RlLmdldF9tX3YoKTtcbiAgICAgIC8vXG4gICAgICAvLyBfdmVjM18xLnNldFgoLXNlbGZfdmVsLngoKSk7XG4gICAgICAvLyBfdmVjM18xLnNldFkoLXNlbGZfdmVsLnkoKSk7XG4gICAgICAvLyBfdmVjM18xLnNldFooLXNlbGZfdmVsLnooKSk7XG4gICAgICAvL1xuICAgICAgLy8gbGV0IG90aGVyX3ZlbCA9IG90aGVyX25vZGUuZ2V0X21fdigpO1xuICAgICAgLy9cbiAgICAgIC8vIF92ZWMzXzIuc2V0WCgtb3RoZXJfdmVsLngoKSk7XG4gICAgICAvLyBfdmVjM18yLnNldFkoLW90aGVyX3ZlbC55KCkpO1xuICAgICAgLy8gX3ZlYzNfMi5zZXRaKC1vdGhlcl92ZWwueigpKTtcblxuICAgICAgY29uc29sZS5sb2coJ2xpbmshJyk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WCgwKTtcbiAgICAgIF92ZWMzXzEuc2V0WSgwKTtcbiAgICAgIF92ZWMzXzEuc2V0WigwKTtcblxuICAgICAgc2VsZl9ib2R5LnNldFZlbG9jaXR5KFxuICAgICAgICBfdmVjM18xXG4gICAgICApO1xuXG4gICAgICBvdGhlcl9ib2R5LnNldFZlbG9jaXR5KFxuICAgICAgICBfdmVjM18xXG4gICAgICApO1xuXG5cblxuICAgICAgLy8gc2VsZl9ib2R5LmFkZFZlbG9jaXR5KF92ZWMzXzEpO1xuICAgICAgLy8gb3RoZXJfYm9keS5hZGRWZWxvY2l0eShfdmVjM18yKTtcblxuICAgICAgLy8gc2VsZl9yZWxhdGl2ZV94ID0gc2VsZl9ub2RlLngoKTtcbiAgICAgIC8vIHNlbGZfcmVsYXRpdmVfeSA9IHNlbGZfbm9kZS55KCk7XG4gICAgICAvLyBzZWxmX3JlbGF0aXZlX3ogPSBzZWxmX25vZGUueigpO1xuICAgICAgLy9cbiAgICAgIC8vIG90aGVyX3JlbGF0aXZlX3ggPSBvdGhlcl9ub2RlLngoKTtcbiAgICAgIC8vIG90aGVyX3JlbGF0aXZlX3kgPSBvdGhlcl9ub2RlLnkoKTtcbiAgICAgIC8vIG90aGVyX3JlbGF0aXZlX3ogPSBvdGhlcl9ub2RlLnooKTtcblxuICAgICAgLy8gc2VsZl9yZWxhdGl2ZSA9IG5ldyBBbW1vLmJ0VmVjdG9yMygpO1xuICAgICAgLy8gc2VsZl9yZWxhdGl2ZS5zZXRYKCk7XG5cbiAgICAgIC8vIGNvbnNvbGUubG9nKCdsaW5rIScpO1xuICAgICAgLy8gc2VsZl9ib2R5LmFwcGVuZEFuY2hvcihkZXNjcmlwdGlvbi5uMSwgY29ubmVjdG9yLCB0cnVlLCAwLjUpO1xuICAgICAgLy8gb3RoZXJfYm9keS5hcHBlbmRBbmNob3IoZGVzY3JpcHRpb24ubjIsIGNvbm5lY3RvciwgdHJ1ZSwgMC41KTtcbiAgICAgIC8vIGNsZWFySW50ZXJ2YWwoX2xvb3ApO1xuXG4gICAgICAvLyBfdmVjM18xLnNldFgoMCk7XG4gICAgICAvLyBfdmVjM18xLnNldFkoMCk7XG4gICAgICAvLyBfdmVjM18xLnNldFooMCk7XG5cbiAgICAgIC8vIHNlbGZfYm9keS5zZXRWZWxvY2l0eShfdmVjM18xKTtcbiAgICAgIC8vIG90aGVyX2JvZHkuc2V0VmVsb2NpdHkoX3ZlYzNfMSk7XG5cbiAgICAgIC8vIG90aGVyX2JvZHkuYWRkRm9yY2UoXG4gICAgICAvLyAgIF92ZWMzXzIsXG4gICAgICAvLyAgIGRlc2NyaXB0aW9uLm4yXG4gICAgICAvLyApO1xuXG4gICAgICAvLyBkZXNjcmlwdGlvbi5tb2RpZmllciAqPSAxLjY7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kaWZlcjIgPSBsaW5rZWQgPyA0MCA6IDE7XG5cbiAgICBmb3JjZV94ICo9IE1hdGgubWF4KGRpc3RhbmNlLCAxKSAqIGRlc2NyaXB0aW9uLm1vZGlmaWVyICogbW9kaWZlcjI7XG4gICAgZm9yY2VfeSAqPSBNYXRoLm1heChkaXN0YW5jZSwgMSkgKiBkZXNjcmlwdGlvbi5tb2RpZmllciAqIG1vZGlmZXIyO1xuICAgIGZvcmNlX3ogKj0gTWF0aC5tYXgoZGlzdGFuY2UsIDEpICogZGVzY3JpcHRpb24ubW9kaWZpZXIgKiBtb2RpZmVyMjtcblxuICAgIF92ZWMzXzEuc2V0WChmb3JjZV94KTtcbiAgICBfdmVjM18xLnNldFkoZm9yY2VfeSk7XG4gICAgX3ZlYzNfMS5zZXRaKGZvcmNlX3opO1xuXG4gICAgX3ZlYzNfMi5zZXRYKC1mb3JjZV94KTtcbiAgICBfdmVjM18yLnNldFkoLWZvcmNlX3kpO1xuICAgIF92ZWMzXzIuc2V0WigtZm9yY2Vfeik7XG5cbiAgICBzZWxmX2JvZHkuYWRkVmVsb2NpdHkoXG4gICAgICBfdmVjM18xLFxuICAgICAgZGVzY3JpcHRpb24ubjFcbiAgICApO1xuXG4gICAgb3RoZXJfYm9keS5hZGRWZWxvY2l0eShcbiAgICAgIF92ZWMzXzIsXG4gICAgICBkZXNjcmlwdGlvbi5uMlxuICAgICk7XG5cbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgLy8gc2VsZl9yZWxhdGl2ZV94ID0gbnVsbDtcbiAgICAvLyB9XG5cblxuXG4gICAgLy8gaWYgKHNlbGZfcmVsYXRpdmVfeCkge1xuICAgIC8vICAgX3ZlYzNfMS5zZXRYKHNlbGZfcmVsYXRpdmVfeCAtIHNlbGZfbm9kZS54KCkpO1xuICAgIC8vICAgX3ZlYzNfMS5zZXRZKHNlbGZfcmVsYXRpdmVfeSAtIHNlbGZfbm9kZS55KCkpO1xuICAgIC8vICAgX3ZlYzNfMS5zZXRaKHNlbGZfcmVsYXRpdmVfeiAtIHNlbGZfbm9kZS56KCkpO1xuICAgIC8vXG4gICAgLy8gICBfdmVjM18yLnNldFgob3RoZXJfcmVsYXRpdmVfeCAtIG90aGVyX25vZGUueCgpKTtcbiAgICAvLyAgIF92ZWMzXzIuc2V0WShvdGhlcl9yZWxhdGl2ZV95IC0gb3RoZXJfbm9kZS55KCkpO1xuICAgIC8vICAgX3ZlYzNfMi5zZXRaKG90aGVyX3JlbGF0aXZlX3ogLSBvdGhlcl9ub2RlLnooKSk7XG4gICAgLy8gfSBlbHNlIHtcblxuICAgIC8vIH1cblxuXG5cblxuICAgIGNhY2hlZF9kaXN0YW5jZSA9IGRpc3RhbmNlO1xuICB9LCAxMCk7XG59XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwZW5kTGluayA9IChkZXNjcmlwdGlvbikgPT4ge1xuICAvLyBjb25zb2xlLmxvZyhBbW1vKTtcbiAgLy8gY29uc29sZS5sb2cobmV3IEFtbW8uTWF0ZXJpYWwoKSk7XG5cbiAgLy8gdmFyIF9tYXQgPSBuZXcgQW1tby5NYXRlcmlhbCgpO1xuICAvL1xuICAvLyBfbWF0LnNldF9tX2tBU1QoMCk7XG4gIC8vIF9tYXQuc2V0X21fa0xTVCgwKTtcbiAgLy8gX21hdC5zZXRfbV9rVlNUKDApO1xuICAvL1xuICAvLyBfb2JqZWN0c1tkZXNjcmlwdGlvbi5zZWxmXS5hcHBlbmRMaW5rKFxuICAvLyAgIGRlc2NyaXB0aW9uLm4xLFxuICAvLyAgIGRlc2NyaXB0aW9uLm4yLFxuICAvLyAgIF9tYXQsXG4gIC8vICAgZmFsc2VcbiAgLy8gKTtcblxuICBfdmVjM18xLnNldFgoMTAwMCk7XG4gIF92ZWMzXzEuc2V0WSgwKTtcbiAgX3ZlYzNfMS5zZXRaKDApO1xuXG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnNlbGZdLmFkZEZvcmNlKFxuICAgIF92ZWMzXzEsXG4gICAgZGVzY3JpcHRpb24ubjFcbiAgKTtcbn1cblxucHVibGljX2Z1bmN0aW9ucy5hcHBlbmRMaW5lYXJKb2ludCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICAvLyBjb25zb2xlLmxvZygnQW1tbycsIEFtbW8pO1xuICB2YXIgc3BlY3MgPSBuZXcgQW1tby5TcGVjcygpO1xuICB2YXIgX3BvcyA9IGRlc2NyaXB0aW9uLnNwZWNzLnBvc2l0aW9uO1xuXG4gIHNwZWNzLnNldF9wb3NpdGlvbihuZXcgQW1tby5idFZlY3RvcjMoX3Bvc1swXSwgX3Bvc1sxXSwgX3Bvc1syXSkpO1xuICBpZiAoZGVzY3JpcHRpb24uc3BlY3MuZXJwKSBzcGVjcy5zZXRfZXJwKGRlc2NyaXB0aW9uLnNwZWNzLmVycCk7XG4gIGlmIChkZXNjcmlwdGlvbi5zcGVjcy5jZm0pIHNwZWNzLnNldF9jZm0oZGVzY3JpcHRpb24uc3BlY3MuY2ZtKTtcbiAgaWYgKGRlc2NyaXB0aW9uLnNwZWNzLnNwbGl0KSBzcGVjcy5zZXRfc3BsaXQoZGVzY3JpcHRpb24uc3BlY3Muc3BsaXQpO1xuXG4gIC8vIGNvbnNvbGUubG9nKHNwZWNzKTtcbiAgLy9cbiAgLy8gLy8gbGpvaW50LnNldF9tX3Jwb3MoXG4gIC8vIC8vICAgbmV3IEFtbW8uYnRWZWN0b3IzKF9wb3MxWzBdLCBfcG9zMVsxXSwgX3BvczFbMl0pLFxuICAvLyAvLyAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhfcG9zMlswXSwgX3BvczJbMV0sIF9wb3MyWzJdKVxuICAvLyAvLyApO1xuICAvL1xuICAvLyAvLyBjb25zb2xlLmxvZygnbGpvaW50JywgbGpvaW50KTtcbiAgLy9cblxuICAvLyBjb25zb2xlLmxvZygnYm9keScsIF9vYmplY3RzW2Rlc2NyaXB0aW9uLmJvZHldKTtcbiAgX29iamVjdHNbZGVzY3JpcHRpb24uc2VsZl1cbiAgICAuYXBwZW5kTGluZWFySm9pbnQoXG4gICAgICBzcGVjcyxcbiAgICAgIF9vYmplY3RzW2Rlc2NyaXB0aW9uLmJvZHldXG4gICAgKTtcbn1cblxucHVibGljX2Z1bmN0aW9ucy5hZGRPYmplY3QgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IGJvZHksIG1vdGlvblN0YXRlO1xuXG4gIGlmIChkZXNjcmlwdGlvbi50eXBlLmluZGV4T2YoJ3NvZnQnKSAhPT0gLTEpIHtcbiAgICBib2R5ID0gY3JlYXRlU29mdEJvZHkoZGVzY3JpcHRpb24pO1xuXG4gICAgY29uc3Qgc2JDb25maWcgPSBib2R5LmdldF9tX2NmZygpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLnZpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfdml0ZXJhdGlvbnMoZGVzY3JpcHRpb24udml0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5waXRlcmF0aW9ucykgc2JDb25maWcuc2V0X3BpdGVyYXRpb25zKGRlc2NyaXB0aW9uLnBpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uZGl0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9kaXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5kaXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmNpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfY2l0ZXJhdGlvbnMoZGVzY3JpcHRpb24uY2l0ZXJhdGlvbnMpO1xuICAgIHNiQ29uZmlnLnNldF9jb2xsaXNpb25zKDB4MTEpO1xuICAgIHNiQ29uZmlnLnNldF9rREYoZGVzY3JpcHRpb24uZnJpY3Rpb24pO1xuICAgIHNiQ29uZmlnLnNldF9rRFAoZGVzY3JpcHRpb24uZGFtcGluZyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnByZXNzdXJlKSBzYkNvbmZpZy5zZXRfa1BSKGRlc2NyaXB0aW9uLnByZXNzdXJlKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uZHJhZykgc2JDb25maWcuc2V0X2tERyhkZXNjcmlwdGlvbi5kcmFnKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ubGlmdCkgc2JDb25maWcuc2V0X2tMRihkZXNjcmlwdGlvbi5saWZ0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24uYW5jaG9ySGFyZG5lc3MpIHNiQ29uZmlnLnNldF9rQUhSKGRlc2NyaXB0aW9uLmFuY2hvckhhcmRuZXNzKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucmlnaWRIYXJkbmVzcykgc2JDb25maWcuc2V0X2tDSFIoZGVzY3JpcHRpb24ucmlnaWRIYXJkbmVzcyk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24ua2xzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rTFNUKGRlc2NyaXB0aW9uLmtsc3QpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5rYXN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tBU1QoZGVzY3JpcHRpb24ua2FzdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmt2c3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa1ZTVChkZXNjcmlwdGlvbi5rdnN0KTtcblxuICAgIEFtbW8uY2FzdE9iamVjdChib2R5LCBBbW1vLmJ0Q29sbGlzaW9uT2JqZWN0KS5nZXRDb2xsaXNpb25TaGFwZSgpLnNldE1hcmdpbihcbiAgICAgIHR5cGVvZiBkZXNjcmlwdGlvbi5tYXJnaW4gIT09ICd1bmRlZmluZWQnID8gZGVzY3JpcHRpb24ubWFyZ2luIDogMC4xXG4gICAgKTtcblxuICAgIC8vIEFtbW8uY2FzdE9iamVjdChib2R5LCBBbW1vLmJ0Q29sbGlzaW9uT2JqZWN0KS5nZXRDb2xsaXNpb25TaGFwZSgpLnNldE1hcmdpbigwKTtcblxuICAgIC8vIEFtbW8uY2FzdE9iamVjdChib2R5LCBBbW1vLmJ0Q29sbGlzaW9uT2JqZWN0KS5nZXRDb2xsaXNpb25TaGFwZSgpLnNldExvY2FsU2NhbGluZyhfdmVjM18xKTtcbiAgICBib2R5LnNldEFjdGl2YXRpb25TdGF0ZShkZXNjcmlwdGlvbi5zdGF0ZSB8fCA0KTtcbiAgICBib2R5LnR5cGUgPSAwOyAvLyBTb2Z0Qm9keS5cbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRSb3BlTWVzaCcpIGJvZHkucm9wZSA9IHRydWU7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Q2xvdGhNZXNoJykgYm9keS5jbG90aCA9IHRydWU7XG5cbiAgICBfdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG5cbiAgICAvLyBAdGVzdFxuICAgIF9xdWF0LnNldFgoZGVzY3JpcHRpb24ucm90YXRpb24ueCk7XG4gICAgX3F1YXQuc2V0WShkZXNjcmlwdGlvbi5yb3RhdGlvbi55KTtcbiAgICBfcXVhdC5zZXRaKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnopO1xuICAgIF9xdWF0LnNldFcoZGVzY3JpcHRpb24ucm90YXRpb24udyk7XG4gICAgYm9keS5yb3RhdGUoX3F1YXQpO1xuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnBvc2l0aW9uLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5wb3NpdGlvbi55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ucG9zaXRpb24ueik7XG4gICAgYm9keS50cmFuc2xhdGUoX3ZlYzNfMSk7XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uc2NhbGUueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnNjYWxlLnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5zY2FsZS56KTtcbiAgICBib2R5LnNjYWxlKF92ZWMzXzEpO1xuXG4gICAgYm9keS5zZXRUb3RhbE1hc3MoZGVzY3JpcHRpb24ubWFzcywgZmFsc2UpO1xuICAgIHdvcmxkLmFkZFNvZnRCb2R5KGJvZHksIDEsIC0xKTtcbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRUcmltZXNoJykgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fZmFjZXMoKS5zaXplKCkgKiAzO1xuICAgIGVsc2UgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Um9wZU1lc2gnKSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9ub2RlcygpLnNpemUoKTtcbiAgICBlbHNlIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX25vZGVzKCkuc2l6ZSgpICogMztcblxuICAgIF9udW1fc29mdGJvZHlfb2JqZWN0cysrO1xuICB9XG4gIGVsc2Uge1xuICAgIGxldCBzaGFwZSA9IGNyZWF0ZVNoYXBlKGRlc2NyaXB0aW9uKTtcblxuICAgIGlmICghc2hhcGUpIHJldHVybjtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBjaGlsZHJlbiB0aGVuIHRoaXMgaXMgYSBjb21wb3VuZCBzaGFwZVxuICAgIGlmIChkZXNjcmlwdGlvbi5jaGlsZHJlbikge1xuICAgICAgY29uc3QgY29tcG91bmRfc2hhcGUgPSBuZXcgQW1tby5idENvbXBvdW5kU2hhcGUoKTtcbiAgICAgIGNvbXBvdW5kX3NoYXBlLmFkZENoaWxkU2hhcGUoX3RyYW5zZm9ybSwgc2hhcGUpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IF9jaGlsZCA9IGRlc2NyaXB0aW9uLmNoaWxkcmVuW2ldO1xuXG4gICAgICAgIGNvbnN0IHRyYW5zID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnMuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgICBfdmVjM18xLnNldFgoX2NoaWxkLnBvc2l0aW9uX29mZnNldC54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihfY2hpbGQucG9zaXRpb25fb2Zmc2V0LnopO1xuICAgICAgICB0cmFucy5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgICAgX3F1YXQuc2V0WChfY2hpbGQucm90YXRpb24ueCk7XG4gICAgICAgIF9xdWF0LnNldFkoX2NoaWxkLnJvdGF0aW9uLnkpO1xuICAgICAgICBfcXVhdC5zZXRaKF9jaGlsZC5yb3RhdGlvbi56KTtcbiAgICAgICAgX3F1YXQuc2V0VyhfY2hpbGQucm90YXRpb24udyk7XG4gICAgICAgIHRyYW5zLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgICAgICBzaGFwZSA9IGNyZWF0ZVNoYXBlKGRlc2NyaXB0aW9uLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgY29tcG91bmRfc2hhcGUuYWRkQ2hpbGRTaGFwZSh0cmFucywgc2hhcGUpO1xuICAgICAgICBBbW1vLmRlc3Ryb3kodHJhbnMpO1xuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IGNvbXBvdW5kX3NoYXBlO1xuICAgICAgX2NvbXBvdW5kX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcbiAgICB9XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uc2NhbGUueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnNjYWxlLnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5zY2FsZS56KTtcblxuICAgIHNoYXBlLnNldExvY2FsU2NhbGluZyhfdmVjM18xKTtcbiAgICBzaGFwZS5zZXRNYXJnaW4oXG4gICAgICB0eXBlb2YgZGVzY3JpcHRpb24ubWFyZ2luICE9PSAndW5kZWZpbmVkJyA/IGRlc2NyaXB0aW9uLm1hcmdpbiA6IDBcbiAgICApO1xuXG4gICAgX3ZlYzNfMS5zZXRYKDApO1xuICAgIF92ZWMzXzEuc2V0WSgwKTtcbiAgICBfdmVjM18xLnNldFooMCk7XG4gICAgc2hhcGUuY2FsY3VsYXRlTG9jYWxJbmVydGlhKGRlc2NyaXB0aW9uLm1hc3MsIF92ZWMzXzEpO1xuXG4gICAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuXG4gICAgX3ZlYzNfMi5zZXRYKGRlc2NyaXB0aW9uLnBvc2l0aW9uLngpO1xuICAgIF92ZWMzXzIuc2V0WShkZXNjcmlwdGlvbi5wb3NpdGlvbi55KTtcbiAgICBfdmVjM18yLnNldFooZGVzY3JpcHRpb24ucG9zaXRpb24ueik7XG4gICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICBfcXVhdC5zZXRYKGRlc2NyaXB0aW9uLnJvdGF0aW9uLngpO1xuICAgIF9xdWF0LnNldFkoZGVzY3JpcHRpb24ucm90YXRpb24ueSk7XG4gICAgX3F1YXQuc2V0WihkZXNjcmlwdGlvbi5yb3RhdGlvbi56KTtcbiAgICBfcXVhdC5zZXRXKGRlc2NyaXB0aW9uLnJvdGF0aW9uLncpO1xuICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuXG4gICAgbW90aW9uU3RhdGUgPSBuZXcgQW1tby5idERlZmF1bHRNb3Rpb25TdGF0ZShfdHJhbnNmb3JtKTsgLy8gI1RPRE86IGJ0RGVmYXVsdE1vdGlvblN0YXRlIHN1cHBvcnRzIGNlbnRlciBvZiBtYXNzIG9mZnNldCBhcyBzZWNvbmQgYXJndW1lbnQgLSBpbXBsZW1lbnRcbiAgICBjb25zdCByYkluZm8gPSBuZXcgQW1tby5idFJpZ2lkQm9keUNvbnN0cnVjdGlvbkluZm8oZGVzY3JpcHRpb24ubWFzcywgbW90aW9uU3RhdGUsIHNoYXBlLCBfdmVjM18xKTtcblxuICAgIHJiSW5mby5zZXRfbV9mcmljdGlvbihkZXNjcmlwdGlvbi5mcmljdGlvbik7XG4gICAgcmJJbmZvLnNldF9tX3Jlc3RpdHV0aW9uKGRlc2NyaXB0aW9uLnJlc3RpdHV0aW9uKTtcbiAgICByYkluZm8uc2V0X21fbGluZWFyRGFtcGluZyhkZXNjcmlwdGlvbi5kYW1waW5nKTtcbiAgICByYkluZm8uc2V0X21fYW5ndWxhckRhbXBpbmcoZGVzY3JpcHRpb24uZGFtcGluZyk7XG5cbiAgICBib2R5ID0gbmV3IEFtbW8uYnRSaWdpZEJvZHkocmJJbmZvKTtcbiAgICBib2R5LnNldEFjdGl2YXRpb25TdGF0ZShkZXNjcmlwdGlvbi5zdGF0ZSB8fCA0KTtcbiAgICBBbW1vLmRlc3Ryb3kocmJJbmZvKTtcblxuICAgIGlmICh0eXBlb2YgZGVzY3JpcHRpb24uY29sbGlzaW9uX2ZsYWdzICE9PSAndW5kZWZpbmVkJykgYm9keS5zZXRDb2xsaXNpb25GbGFncyhkZXNjcmlwdGlvbi5jb2xsaXNpb25fZmxhZ3MpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLmdyb3VwICYmIGRlc2NyaXB0aW9uLm1hc2spIHdvcmxkLmFkZFJpZ2lkQm9keShib2R5LCBkZXNjcmlwdGlvbi5ncm91cCwgZGVzY3JpcHRpb24ubWFzayk7XG4gICAgZWxzZSB3b3JsZC5hZGRSaWdpZEJvZHkoYm9keSk7XG4gICAgYm9keS50eXBlID0gMTsgLy8gUmlnaWRCb2R5LlxuICAgIF9udW1fcmlnaWRib2R5X29iamVjdHMrKztcbiAgfVxuXG4gIGJvZHkuYWN0aXZhdGUoKTtcblxuICBib2R5LmlkID0gZGVzY3JpcHRpb24uaWQ7XG4gIF9vYmplY3RzW2JvZHkuaWRdID0gYm9keTtcbiAgX21vdGlvbl9zdGF0ZXNbYm9keS5pZF0gPSBtb3Rpb25TdGF0ZTtcblxuICBfb2JqZWN0c19hbW1vW2JvZHkuYSA9PT0gdW5kZWZpbmVkID8gYm9keS5wdHIgOiBib2R5LmFdID0gYm9keS5pZDtcbiAgX251bV9vYmplY3RzKys7XG5cbiAgc2VuZCh7IGNtZDogJ29iamVjdFJlYWR5JywgcGFyYW1zOiBib2R5LmlkIH0pO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRWZWhpY2xlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGNvbnN0IHZlaGljbGVfdHVuaW5nID0gbmV3IEFtbW8uYnRWZWhpY2xlVHVuaW5nKCk7XG5cbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyhkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX3N0aWZmbmVzcyk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbihkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX2NvbXByZXNzaW9uKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvbkRhbXBpbmcoZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9kYW1waW5nKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtKGRlc2NyaXB0aW9uLm1heF9zdXNwZW5zaW9uX3RyYXZlbCk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25Gb3JjZShkZXNjcmlwdGlvbi5tYXhfc3VzcGVuc2lvbl9mb3JjZSk7XG5cbiAgY29uc3QgdmVoaWNsZSA9IG5ldyBBbW1vLmJ0UmF5Y2FzdFZlaGljbGUoXG4gICAgdmVoaWNsZV90dW5pbmcsXG4gICAgX29iamVjdHNbZGVzY3JpcHRpb24ucmlnaWRCb2R5XSxcbiAgICBuZXcgQW1tby5idERlZmF1bHRWZWhpY2xlUmF5Y2FzdGVyKHdvcmxkKVxuICApO1xuXG4gIHZlaGljbGUudHVuaW5nID0gdmVoaWNsZV90dW5pbmc7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnJpZ2lkQm9keV0uc2V0QWN0aXZhdGlvblN0YXRlKDQpO1xuICB2ZWhpY2xlLnNldENvb3JkaW5hdGVTeXN0ZW0oMCwgMSwgMik7XG5cbiAgd29ybGQuYWRkVmVoaWNsZSh2ZWhpY2xlKTtcbiAgX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHZlaGljbGU7XG59O1xucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVWZWhpY2xlID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gPSBudWxsO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRXaGVlbCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbGV0IHR1bmluZyA9IF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0udHVuaW5nO1xuICAgIGlmIChkZXNjcmlwdGlvbi50dW5pbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdHVuaW5nID0gbmV3IEFtbW8uYnRWZWhpY2xlVHVuaW5nKCk7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvblN0aWZmbmVzcyhkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9zdGlmZm5lc3MpO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25Db21wcmVzc2lvbihkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9jb21wcmVzc2lvbik7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvbkRhbXBpbmcoZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fZGFtcGluZyk7XG4gICAgICB0dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvblRyYXZlbENtKGRlc2NyaXB0aW9uLnR1bmluZy5tYXhfc3VzcGVuc2lvbl90cmF2ZWwpO1xuICAgICAgdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25Gb3JjZShkZXNjcmlwdGlvbi50dW5pbmcubWF4X3N1c3BlbnNpb25fZm9yY2UpO1xuICAgIH1cblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5jb25uZWN0aW9uX3BvaW50LnopO1xuXG4gICAgX3ZlYzNfMi5zZXRYKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi54KTtcbiAgICBfdmVjM18yLnNldFkoZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLnkpO1xuICAgIF92ZWMzXzIuc2V0WihkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueik7XG5cbiAgICBfdmVjM18zLnNldFgoZGVzY3JpcHRpb24ud2hlZWxfYXhsZS54KTtcbiAgICBfdmVjM18zLnNldFkoZGVzY3JpcHRpb24ud2hlZWxfYXhsZS55KTtcbiAgICBfdmVjM18zLnNldFooZGVzY3JpcHRpb24ud2hlZWxfYXhsZS56KTtcblxuICAgIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0uYWRkV2hlZWwoXG4gICAgICBfdmVjM18xLFxuICAgICAgX3ZlYzNfMixcbiAgICAgIF92ZWMzXzMsXG4gICAgICBkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLFxuICAgICAgZGVzY3JpcHRpb24ud2hlZWxfcmFkaXVzLFxuICAgICAgdHVuaW5nLFxuICAgICAgZGVzY3JpcHRpb24uaXNfZnJvbnRfd2hlZWxcbiAgICApO1xuICB9XG5cbiAgX251bV93aGVlbHMrKztcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgxICsgX251bV93aGVlbHMgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCAmICggIyBvZiBvYmplY3RzIHRvIHJlcG9ydCAqICMgb2YgdmFsdWVzIHBlciBvYmplY3QgKVxuICAgIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gIH1cbiAgZWxzZSB2ZWhpY2xlcmVwb3J0ID0gW01FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVF07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldFN0ZWVyaW5nID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uc2V0U3RlZXJpbmdWYWx1ZShkZXRhaWxzLnN0ZWVyaW5nLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QnJha2UgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5zZXRCcmFrZShkZXRhaWxzLmJyYWtlLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlFbmdpbmVGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLmFwcGx5RW5naW5lRm9yY2UoZGV0YWlscy5mb3JjZSwgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZU9iamVjdCA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfb2JqZWN0c1tkZXRhaWxzLmlkXS50eXBlID09PSAwKSB7XG4gICAgX251bV9zb2Z0Ym9keV9vYmplY3RzLS07XG4gICAgX3NvZnRib2R5X3JlcG9ydF9zaXplIC09IF9vYmplY3RzW2RldGFpbHMuaWRdLmdldF9tX25vZGVzKCkuc2l6ZSgpO1xuICAgIHdvcmxkLnJlbW92ZVNvZnRCb2R5KF9vYmplY3RzW2RldGFpbHMuaWRdKTtcbiAgfVxuICBlbHNlIGlmIChfb2JqZWN0c1tkZXRhaWxzLmlkXS50eXBlID09PSAxKSB7XG4gICAgX251bV9yaWdpZGJvZHlfb2JqZWN0cy0tO1xuICAgIHdvcmxkLnJlbW92ZVJpZ2lkQm9keShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gICAgQW1tby5kZXN0cm95KF9tb3Rpb25fc3RhdGVzW2RldGFpbHMuaWRdKTtcbiAgfVxuXG4gIEFtbW8uZGVzdHJveShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gIGlmIChfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKSBBbW1vLmRlc3Ryb3koX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSk7XG4gIGlmIChfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSkgQW1tby5kZXN0cm95KF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKTtcblxuICBfb2JqZWN0c19hbW1vW19vYmplY3RzW2RldGFpbHMuaWRdLmEgPT09IHVuZGVmaW5lZCA/IF9vYmplY3RzW2RldGFpbHMuaWRdLmEgOiBfb2JqZWN0c1tkZXRhaWxzLmlkXS5wdHJdID0gbnVsbDtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBfbW90aW9uX3N0YXRlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG5cbiAgaWYgKF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pIF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBpZiAoX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pIF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgX251bV9vYmplY3RzLS07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnVwZGF0ZVRyYW5zZm9ybSA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3QgPSBfb2JqZWN0c1tkZXRhaWxzLmlkXTtcblxuICBpZiAoX29iamVjdC50eXBlID09PSAxKSB7XG4gICAgX29iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgaWYgKGRldGFpbHMucG9zKSB7XG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3MueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3MueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3Mueik7XG4gICAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICB9XG5cbiAgICBpZiAoZGV0YWlscy5xdWF0KSB7XG4gICAgICBfcXVhdC5zZXRYKGRldGFpbHMucXVhdC54KTtcbiAgICAgIF9xdWF0LnNldFkoZGV0YWlscy5xdWF0LnkpO1xuICAgICAgX3F1YXQuc2V0WihkZXRhaWxzLnF1YXQueik7XG4gICAgICBfcXVhdC5zZXRXKGRldGFpbHMucXVhdC53KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuICAgIH1cblxuICAgIF9vYmplY3Quc2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG4gICAgX29iamVjdC5hY3RpdmF0ZSgpO1xuICB9XG4gIGVsc2UgaWYgKF9vYmplY3QudHlwZSA9PT0gMCkge1xuICAgIC8vIF9vYmplY3QuZ2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICBpZiAoZGV0YWlscy5wb3MpIHtcbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvcy54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvcy55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvcy56KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzEpO1xuICAgIH1cblxuICAgIGlmIChkZXRhaWxzLnF1YXQpIHtcbiAgICAgIF9xdWF0LnNldFgoZGV0YWlscy5xdWF0LngpO1xuICAgICAgX3F1YXQuc2V0WShkZXRhaWxzLnF1YXQueSk7XG4gICAgICBfcXVhdC5zZXRaKGRldGFpbHMucXVhdC56KTtcbiAgICAgIF9xdWF0LnNldFcoZGV0YWlscy5xdWF0LncpO1xuICAgICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG4gICAgfVxuXG4gICAgX29iamVjdC50cmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG4gIH1cbn07XG5cbnB1YmxpY19mdW5jdGlvbnMudXBkYXRlTWFzcyA9IChkZXRhaWxzKSA9PiB7XG4gIC8vICNUT0RPOiBjaGFuZ2luZyBhIHN0YXRpYyBvYmplY3QgaW50byBkeW5hbWljIGlzIGJ1Z2d5XG4gIF9vYmplY3QgPSBfb2JqZWN0c1tkZXRhaWxzLmlkXTtcblxuICAvLyBQZXIgaHR0cDovL3d3dy5idWxsZXRwaHlzaWNzLm9yZy9CdWxsZXQvcGhwQkIzL3ZpZXd0b3BpYy5waHA/cD0mZj05JnQ9MzY2MyNwMTM4MTZcbiAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KF9vYmplY3QpO1xuXG4gIF92ZWMzXzEuc2V0WCgwKTtcbiAgX3ZlYzNfMS5zZXRZKDApO1xuICBfdmVjM18xLnNldFooMCk7XG5cbiAgX29iamVjdC5zZXRNYXNzUHJvcHMoZGV0YWlscy5tYXNzLCBfdmVjM18xKTtcbiAgd29ybGQuYWRkUmlnaWRCb2R5KF9vYmplY3QpO1xuICBfb2JqZWN0LmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Q2VudHJhbEltcHVsc2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5Q2VudHJhbEltcHVsc2UoX3ZlYzNfMSk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5SW1wdWxzZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLmltcHVsc2VfeCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLmltcHVsc2VfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLmltcHVsc2Vfeik7XG5cbiAgX3ZlYzNfMi5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzIuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18yLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUltcHVsc2UoXG4gICAgX3ZlYzNfMSxcbiAgICBfdmVjM18yXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5VG9ycXVlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMudG9ycXVlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy50b3JxdWVfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnRvcnF1ZV96KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseVRvcnF1ZShcbiAgICBfdmVjM18xXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Q2VudHJhbEZvcmNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUNlbnRyYWxGb3JjZShfdmVjM18xKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLmZvcmNlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy5mb3JjZV95KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMuZm9yY2Vfeik7XG5cbiAgX3ZlYzNfMi5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzIuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18yLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUZvcmNlKFxuICAgIF92ZWMzXzEsXG4gICAgX3ZlYzNfMlxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5vblNpbXVsYXRpb25SZXN1bWUgPSAoKSA9PiB7XG4gIGxhc3Rfc2ltdWxhdGlvbl90aW1lID0gRGF0ZS5ub3coKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QW5ndWxhclZlbG9jaXR5ID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRBbmd1bGFyVmVsb2NpdHkoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRMaW5lYXJWZWxvY2l0eSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0TGluZWFyVmVsb2NpdHkoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRBbmd1bGFyRmFjdG9yID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRBbmd1bGFyRmFjdG9yKFxuICAgIF92ZWMzXzFcbiAgKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0TGluZWFyRmFjdG9yID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRMaW5lYXJGYWN0b3IoXG4gICAgX3ZlYzNfMVxuICApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXREYW1waW5nID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0RGFtcGluZyhkZXRhaWxzLmxpbmVhciwgZGV0YWlscy5hbmd1bGFyKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0Q2NkTW90aW9uVGhyZXNob2xkID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0Q2NkTW90aW9uVGhyZXNob2xkKGRldGFpbHMudGhyZXNob2xkKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyhkZXRhaWxzLnJhZGl1cyk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFkZENvbnN0cmFpbnQgPSAoZGV0YWlscykgPT4ge1xuICBsZXQgY29uc3RyYWludDtcblxuICBzd2l0Y2ggKGRldGFpbHMudHlwZSkge1xuXG4gIGNhc2UgJ3BvaW50JzpcbiAgICB7XG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRQb2ludDJQb2ludENvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfdmVjM18xXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFBvaW50MlBvaW50Q29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2hpbmdlJzpcbiAgICB7XG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5heGlzLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5heGlzLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5heGlzLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEhpbmdlQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMlxuICAgICAgICApO1xuXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIF92ZWMzXzMuc2V0WChkZXRhaWxzLmF4aXMueCk7XG4gICAgICAgIF92ZWMzXzMuc2V0WShkZXRhaWxzLmF4aXMueSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WihkZXRhaWxzLmF4aXMueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0SGluZ2VDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzIsXG4gICAgICAgICAgX3ZlYzNfMyxcbiAgICAgICAgICBfdmVjM18zXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ3NsaWRlcic6XG4gICAge1xuICAgICAgbGV0IHRyYW5zZm9ybWI7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXIoZGV0YWlscy5heGlzLngsIGRldGFpbHMuYXhpcy55LCBkZXRhaWxzLmF4aXMueik7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgaWYgKGRldGFpbHMub2JqZWN0Yikge1xuICAgICAgICB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgICByb3RhdGlvbi5zZXRFdWxlcihkZXRhaWxzLmF4aXMueCwgZGV0YWlscy5heGlzLnksIGRldGFpbHMuYXhpcy56KTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0U2xpZGVyQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cmFuc2Zvcm1iLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRTbGlkZXJDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIGlmICh0cmFuc2Zvcm1iICE9PSB1bmRlZmluZWQpIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdjb25ldHdpc3QnOlxuICAgIHtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWEgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBjb25zdCB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgIHRyYW5zZm9ybWEuc2V0T3JpZ2luKF92ZWMzXzEpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNhLnosIC1kZXRhaWxzLmF4aXNhLnksIC1kZXRhaWxzLmF4aXNhLngpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2IueiwgLWRldGFpbHMuYXhpc2IueSwgLWRldGFpbHMuYXhpc2IueCk7XG4gICAgICB0cmFuc2Zvcm1iLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0Q29uZVR3aXN0Q29uc3RyYWludChcbiAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgdHJhbnNmb3JtYlxuICAgICAgKTtcblxuICAgICAgY29uc3RyYWludC5zZXRMaW1pdChNYXRoLlBJLCAwLCBNYXRoLlBJKTtcblxuICAgICAgY29uc3RyYWludC50YSA9IHRyYW5zZm9ybWE7XG4gICAgICBjb25zdHJhaW50LnRiID0gdHJhbnNmb3JtYjtcblxuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWEpO1xuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWIpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2RvZic6XG4gICAge1xuICAgICAgbGV0IHRyYW5zZm9ybWI7XG5cbiAgICAgIGNvbnN0IHRyYW5zZm9ybWEgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgIHRyYW5zZm9ybWEuc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm1hLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYS56LCAtZGV0YWlscy5heGlzYS55LCAtZGV0YWlscy5heGlzYS54KTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiKSB7XG4gICAgICAgIHRyYW5zZm9ybWIgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm1iLnNldElkZW50aXR5KCk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2IueiwgLWRldGFpbHMuYXhpc2IueSwgLWRldGFpbHMuYXhpc2IueCk7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEdlbmVyaWM2RG9mQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cmFuc2Zvcm1iLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRHZW5lcmljNkRvZkNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3RyYWludC50YSA9IHRyYW5zZm9ybWE7XG4gICAgICBjb25zdHJhaW50LnRiID0gdHJhbnNmb3JtYjtcblxuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWEpO1xuICAgICAgaWYgKHRyYW5zZm9ybWIgIT09IHVuZGVmaW5lZCkgQW1tby5kZXN0cm95KHRyYW5zZm9ybWIpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGRlZmF1bHQ6XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgd29ybGQuYWRkQ29uc3RyYWludChjb25zdHJhaW50KTtcblxuICBjb25zdHJhaW50LmEgPSBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdO1xuICBjb25zdHJhaW50LmIgPSBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdO1xuXG4gIGNvbnN0cmFpbnQuZW5hYmxlRmVlZGJhY2soKTtcbiAgX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdID0gY29uc3RyYWludDtcbiAgX251bV9jb25zdHJhaW50cysrO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDEgKyBfbnVtX2NvbnN0cmFpbnRzICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgJiAoICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0IClcbiAgICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuICB9XG4gIGVsc2UgY29uc3RyYWludHJlcG9ydCA9IFtNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlRdO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVDb25zdHJhaW50ID0gKGRldGFpbHMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXTtcblxuICBpZiAoY29uc3RyYWludCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgd29ybGQucmVtb3ZlQ29uc3RyYWludChjb25zdHJhaW50KTtcbiAgICBfY29uc3RyYWludHNbZGV0YWlscy5pZF0gPSBudWxsO1xuICAgIF9udW1fY29uc3RyYWludHMtLTtcbiAgfVxufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25zdHJhaW50X3NldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCA9IChkZXRhaWxzKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbZGV0YWlscy5pZF07XG4gIGlmIChjb25zdHJhaW50ICE9PSB1bmRlZmluZWQpIGNvbnN0cmFpbnQuc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkKGRldGFpbHMudGhyZXNob2xkKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2ltdWxhdGUgPSAocGFyYW1zID0ge30pID0+IHtcbiAgaWYgKHdvcmxkKSB7XG4gICAgaWYgKHBhcmFtcy50aW1lU3RlcCAmJiBwYXJhbXMudGltZVN0ZXAgPCBmaXhlZFRpbWVTdGVwKVxuICAgICAgcGFyYW1zLnRpbWVTdGVwID0gZml4ZWRUaW1lU3RlcDtcblxuICAgIHBhcmFtcy5tYXhTdWJTdGVwcyA9IHBhcmFtcy5tYXhTdWJTdGVwcyB8fCBNYXRoLmNlaWwocGFyYW1zLnRpbWVTdGVwIC8gZml4ZWRUaW1lU3RlcCk7IC8vIElmIG1heFN1YlN0ZXBzIGlzIG5vdCBkZWZpbmVkLCBrZWVwIHRoZSBzaW11bGF0aW9uIGZ1bGx5IHVwIHRvIGRhdGVcblxuICAgIHdvcmxkLnN0ZXBTaW11bGF0aW9uKHBhcmFtcy50aW1lU3RlcCwgcGFyYW1zLm1heFN1YlN0ZXBzLCBmaXhlZFRpbWVTdGVwKTtcblxuICAgIGlmIChfdmVoaWNsZXMubGVuZ3RoID4gMCkgcmVwb3J0VmVoaWNsZXMoKTtcbiAgICByZXBvcnRDb2xsaXNpb25zKCk7XG4gICAgaWYgKF9jb25zdHJhaW50cy5sZW5ndGggPiAwKSByZXBvcnRDb25zdHJhaW50cygpO1xuICAgIHJlcG9ydFdvcmxkKCk7XG4gICAgaWYgKF9zb2Z0Ym9keV9lbmFibGVkKSByZXBvcnRXb3JsZF9zb2Z0Ym9kaWVzKCk7XG4gIH1cbn07XG5cbi8vIENvbnN0cmFpbnQgZnVuY3Rpb25zXG5wdWJsaWNfZnVuY3Rpb25zLmhpbmdlX3NldExpbWl0cyA9IChwYXJhbXMpID0+IHtcbiAgX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XS5zZXRMaW1pdChwYXJhbXMubG93LCBwYXJhbXMuaGlnaCwgMCwgcGFyYW1zLmJpYXNfZmFjdG9yLCBwYXJhbXMucmVsYXhhdGlvbl9mYWN0b3IpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LmVuYWJsZUFuZ3VsYXJNb3Rvcih0cnVlLCBwYXJhbXMudmVsb2NpdHksIHBhcmFtcy5hY2NlbGVyYXRpb24pO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmhpbmdlX2Rpc2FibGVNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XS5lbmFibGVNb3RvcihmYWxzZSk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfc2V0TGltaXRzID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRMb3dlckxpbkxpbWl0KHBhcmFtcy5saW5fbG93ZXIgfHwgMCk7XG4gIGNvbnN0cmFpbnQuc2V0VXBwZXJMaW5MaW1pdChwYXJhbXMubGluX3VwcGVyIHx8IDApO1xuXG4gIGNvbnN0cmFpbnQuc2V0TG93ZXJBbmdMaW1pdChwYXJhbXMuYW5nX2xvd2VyIHx8IDApO1xuICBjb25zdHJhaW50LnNldFVwcGVyQW5nTGltaXQocGFyYW1zLmFuZ191cHBlciB8fCAwKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX3NldFJlc3RpdHV0aW9uID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRTb2Z0bmVzc0xpbUxpbihwYXJhbXMubGluZWFyIHx8IDApO1xuICBjb25zdHJhaW50LnNldFNvZnRuZXNzTGltQW5nKHBhcmFtcy5hbmd1bGFyIHx8IDApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZW5hYmxlTGluZWFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFRhcmdldExpbk1vdG9yVmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgY29uc3RyYWludC5zZXRNYXhMaW5Nb3RvckZvcmNlKHBhcmFtcy5hY2NlbGVyYXRpb24pO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRMaW5Nb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZGlzYWJsZUxpbmVhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkTGluTW90b3IoZmFsc2UpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0VGFyZ2V0QW5nTW90b3JWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBjb25zdHJhaW50LnNldE1heEFuZ01vdG9yRm9yY2UocGFyYW1zLmFjY2VsZXJhdGlvbik7XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZEFuZ01vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9kaXNhYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkQW5nTW90b3IoZmFsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XS5zZXRMaW1pdChwYXJhbXMueiwgcGFyYW1zLnksIHBhcmFtcy54KTsgLy8gWllYIG9yZGVyXG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9lbmFibGVNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuZW5hYmxlTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X3NldE1heE1vdG9ySW1wdWxzZSA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0TWF4TW90b3JJbXB1bHNlKHBhcmFtcy5tYXhfaW1wdWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X3NldE1vdG9yVGFyZ2V0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfcXVhdC5zZXRYKHBhcmFtcy54KTtcbiAgX3F1YXQuc2V0WShwYXJhbXMueSk7XG4gIF9xdWF0LnNldFoocGFyYW1zLnopO1xuICBfcXVhdC5zZXRXKHBhcmFtcy53KTtcblxuICBjb25zdHJhaW50LnNldE1vdG9yVGFyZ2V0KF9xdWF0KTtcblxuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9kaXNhYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LmVuYWJsZU1vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0TGluZWFyTG93ZXJMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3ZlYzNfMS5zZXRYKHBhcmFtcy54KTtcbiAgX3ZlYzNfMS5zZXRZKHBhcmFtcy55KTtcbiAgX3ZlYzNfMS5zZXRaKHBhcmFtcy56KTtcblxuICBjb25zdHJhaW50LnNldExpbmVhckxvd2VyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0TGluZWFyVXBwZXJMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3ZlYzNfMS5zZXRYKHBhcmFtcy54KTtcbiAgX3ZlYzNfMS5zZXRZKHBhcmFtcy55KTtcbiAgX3ZlYzNfMS5zZXRaKHBhcmFtcy56KTtcblxuICBjb25zdHJhaW50LnNldExpbmVhclVwcGVyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0QW5ndWxhckxvd2VyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRBbmd1bGFyTG93ZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRBbmd1bGFyVXBwZXJMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3ZlYzNfMS5zZXRYKHBhcmFtcy54KTtcbiAgX3ZlYzNfMS5zZXRZKHBhcmFtcy55KTtcbiAgX3ZlYzNfMS5zZXRaKHBhcmFtcy56KTtcblxuICBjb25zdHJhaW50LnNldEFuZ3VsYXJVcHBlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX2VuYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgY29uc3QgbW90b3IgPSBjb25zdHJhaW50LmdldFJvdGF0aW9uYWxMaW1pdE1vdG9yKHBhcmFtcy53aGljaCk7XG4gIG1vdG9yLnNldF9tX2VuYWJsZU1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0sXG4gICAgbW90b3IgPSBjb25zdHJhaW50LmdldFJvdGF0aW9uYWxMaW1pdE1vdG9yKHBhcmFtcy53aGljaCk7XG5cbiAgbW90b3Iuc2V0X21fbG9MaW1pdChwYXJhbXMubG93X2FuZ2xlKTtcbiAgbW90b3Iuc2V0X21faGlMaW1pdChwYXJhbXMuaGlnaF9hbmdsZSk7XG4gIG1vdG9yLnNldF9tX3RhcmdldFZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIG1vdG9yLnNldF9tX21heE1vdG9yRm9yY2UocGFyYW1zLm1heF9mb3JjZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0sXG4gICAgbW90b3IgPSBjb25zdHJhaW50LmdldFJvdGF0aW9uYWxMaW1pdE1vdG9yKHBhcmFtcy53aGljaCk7XG5cbiAgbW90b3Iuc2V0X21fZW5hYmxlTW90b3IoZmFsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbmNvbnN0IHJlcG9ydFdvcmxkID0gKCkgPT4ge1xuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUgJiYgd29ybGRyZXBvcnQubGVuZ3RoIDwgMiArIF9udW1fcmlnaWRib2R5X29iamVjdHMgKiBXT1JMRFJFUE9SVF9JVEVNU0laRSkge1xuICAgIHdvcmxkcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICtcbiAgICAgIChNYXRoLmNlaWwoX251bV9yaWdpZGJvZHlfb2JqZWN0cyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBXT1JMRFJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICApO1xuXG4gICAgd29ybGRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUO1xuICB9XG5cbiAgd29ybGRyZXBvcnRbMV0gPSBfbnVtX3JpZ2lkYm9keV9vYmplY3RzOyAvLyByZWNvcmQgaG93IG1hbnkgb2JqZWN0cyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICB7XG4gICAgbGV0IGkgPSAwLFxuICAgICAgaW5kZXggPSBfb2JqZWN0cy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2JqZWN0ID0gX29iamVjdHNbaW5kZXhdO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIG9iamVjdC50eXBlID09PSAxKSB7IC8vIFJpZ2lkQm9kaWVzLlxuICAgICAgICAvLyAjVE9ETzogd2UgY2FuJ3QgdXNlIGNlbnRlciBvZiBtYXNzIHRyYW5zZm9ybSB3aGVuIGNlbnRlciBvZiBtYXNzIGNhbiBjaGFuZ2UsXG4gICAgICAgIC8vICAgICAgICBidXQgZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybSgpIHNjcmV3cyB1cCBvbiBvYmplY3RzIHRoYXQgaGF2ZSBiZWVuIG1vdmVkXG4gICAgICAgIC8vIG9iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKCB0cmFuc2Zvcm0gKTtcbiAgICAgICAgLy8gb2JqZWN0LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gb2JqZWN0LmdldENlbnRlck9mTWFzc1RyYW5zZm9ybSgpO1xuICAgICAgICBjb25zdCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XG4gICAgICAgIGNvbnN0IHJvdGF0aW9uID0gdHJhbnNmb3JtLmdldFJvdGF0aW9uKCk7XG5cbiAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIChpKyspICogV09STERSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0XSA9IG9iamVjdC5pZDtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxXSA9IG9yaWdpbi54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgM10gPSBvcmlnaW4ueigpO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDRdID0gcm90YXRpb24ueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA1XSA9IHJvdGF0aW9uLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNl0gPSByb3RhdGlvbi56KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDddID0gcm90YXRpb24udygpO1xuXG4gICAgICAgIF92ZWN0b3IgPSBvYmplY3QuZ2V0TGluZWFyVmVsb2NpdHkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgOF0gPSBfdmVjdG9yLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgOV0gPSBfdmVjdG9yLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTBdID0gX3ZlY3Rvci56KCk7XG5cbiAgICAgICAgX3ZlY3RvciA9IG9iamVjdC5nZXRBbmd1bGFyVmVsb2NpdHkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTFdID0gX3ZlY3Rvci54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEyXSA9IF92ZWN0b3IueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxM10gPSBfdmVjdG9yLnooKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHNlbmQod29ybGRyZXBvcnQuYnVmZmVyLCBbd29ybGRyZXBvcnQuYnVmZmVyXSk7XG4gIGVsc2Ugc2VuZCh3b3JsZHJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRXb3JsZF9zb2Z0Ym9kaWVzID0gKCkgPT4ge1xuICAvLyBUT0RPOiBBZGQgU1VQUE9SVFRSQU5TRkVSQUJMRS5cblxuICBzb2Z0cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgK1xuICAgIF9udW1fc29mdGJvZHlfb2JqZWN0cyAqIDIgK1xuICAgIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSAqIDZcbiAgKTtcblxuICBzb2Z0cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUO1xuICBzb2Z0cmVwb3J0WzFdID0gX251bV9zb2Z0Ym9keV9vYmplY3RzOyAvLyByZWNvcmQgaG93IG1hbnkgb2JqZWN0cyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICB7XG4gICAgbGV0IG9mZnNldCA9IDIsXG4gICAgICBpbmRleCA9IF9vYmplY3RzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvYmplY3QgPSBfb2JqZWN0c1tpbmRleF07XG5cbiAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LnR5cGUgPT09IDApIHsgLy8gU29mdEJvZGllcy5cblxuICAgICAgICBzb2Z0cmVwb3J0W29mZnNldF0gPSBvYmplY3QuaWQ7XG5cbiAgICAgICAgY29uc3Qgb2Zmc2V0VmVydCA9IG9mZnNldCArIDI7XG5cbiAgICAgICAgaWYgKG9iamVjdC5yb3BlID09PSB0cnVlKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZXMgPSBvYmplY3QuZ2V0X21fbm9kZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gbm9kZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5hdChpKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQgPSBub2RlLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IG9mZiA9IG9mZnNldFZlcnQgKyBpICogMztcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydC54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydC55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDJdID0gdmVydC56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiAzICsgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmplY3QuY2xvdGgpIHtcbiAgICAgICAgICBjb25zdCBub2RlcyA9IG9iamVjdC5nZXRfbV9ub2RlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBub2Rlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzLmF0KGkpO1xuICAgICAgICAgICAgY29uc3QgdmVydCA9IG5vZGUuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gbm9kZS5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDY7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDNdID0gLW5vcm1hbC54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDRdID0gLW5vcm1hbC55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDVdID0gLW5vcm1hbC56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiA2ICsgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb25zdCBmYWNlcyA9IG9iamVjdC5nZXRfbV9mYWNlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBmYWNlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZmFjZSA9IGZhY2VzLmF0KGkpO1xuXG4gICAgICAgICAgICBjb25zdCBub2RlMSA9IGZhY2UuZ2V0X21fbigwKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUyID0gZmFjZS5nZXRfbV9uKDEpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZTMgPSBmYWNlLmdldF9tX24oMik7XG5cbiAgICAgICAgICAgIGNvbnN0IHZlcnQxID0gbm9kZTEuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3QgdmVydDIgPSBub2RlMi5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0MyA9IG5vZGUzLmdldF9tX3goKTtcblxuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMSA9IG5vZGUxLmdldF9tX24oKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDIgPSBub2RlMi5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwzID0gbm9kZTMuZ2V0X21fbigpO1xuXG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDE4O1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0MS54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydDEueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQxLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAzXSA9IG5vcm1hbDEueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA0XSA9IG5vcm1hbDEueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA1XSA9IG5vcm1hbDEueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDZdID0gdmVydDIueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA3XSA9IHZlcnQyLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgOF0gPSB2ZXJ0Mi56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgOV0gPSBub3JtYWwyLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTBdID0gbm9ybWFsMi55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDExXSA9IG5vcm1hbDIueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEyXSA9IHZlcnQzLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTNdID0gdmVydDMueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNF0gPSB2ZXJ0My56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTVdID0gbm9ybWFsMy54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE2XSA9IG5vcm1hbDMueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxN10gPSBub3JtYWwzLnooKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvZmZzZXQgKz0gc2l6ZSAqIDE4ICsgMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgc2VuZChzb2Z0cmVwb3J0LmJ1ZmZlciwgW3NvZnRyZXBvcnQuYnVmZmVyXSk7XG4gIC8vIGVsc2Ugc2VuZChzb2Z0cmVwb3J0KTtcbiAgc2VuZChzb2Z0cmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydENvbGxpc2lvbnMgPSAoKSA9PiB7XG4gIGNvbnN0IGRwID0gd29ybGQuZ2V0RGlzcGF0Y2hlcigpLFxuICAgIG51bSA9IGRwLmdldE51bU1hbmlmb2xkcygpO1xuICAvLyBfY29sbGlkZWQgPSBmYWxzZTtcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBpZiAoY29sbGlzaW9ucmVwb3J0Lmxlbmd0aCA8IDIgKyBudW0gKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgK1xuICAgICAgICAoTWF0aC5jZWlsKF9udW1fb2JqZWN0cyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgICApO1xuICAgICAgY29sbGlzaW9ucmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAgY29sbGlzaW9ucmVwb3J0WzFdID0gMDsgLy8gaG93IG1hbnkgY29sbGlzaW9ucyB3ZSdyZSByZXBvcnRpbmcgb25cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgY29uc3QgbWFuaWZvbGQgPSBkcC5nZXRNYW5pZm9sZEJ5SW5kZXhJbnRlcm5hbChpKSxcbiAgICAgIG51bV9jb250YWN0cyA9IG1hbmlmb2xkLmdldE51bUNvbnRhY3RzKCk7XG5cbiAgICBpZiAobnVtX2NvbnRhY3RzID09PSAwKSBjb250aW51ZTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnVtX2NvbnRhY3RzOyBqKyspIHtcbiAgICAgIGNvbnN0IHB0ID0gbWFuaWZvbGQuZ2V0Q29udGFjdFBvaW50KGopO1xuXG4gICAgICAvLyBpZiAoIHB0LmdldERpc3RhbmNlKCkgPCAwICkge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIChjb2xsaXNpb25yZXBvcnRbMV0rKykgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0XSA9IF9vYmplY3RzX2FtbW9bbWFuaWZvbGQuZ2V0Qm9keTAoKS5wdHJdO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDFdID0gX29iamVjdHNfYW1tb1ttYW5pZm9sZC5nZXRCb2R5MSgpLnB0cl07XG5cbiAgICAgIF92ZWN0b3IgPSBwdC5nZXRfbV9ub3JtYWxXb3JsZE9uQigpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDJdID0gX3ZlY3Rvci54KCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgM10gPSBfdmVjdG9yLnkoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyA0XSA9IF92ZWN0b3IueigpO1xuICAgICAgYnJlYWs7XG4gICAgICAvLyB9XG4gICAgICAvLyBzZW5kKF9vYmplY3RzX2FtbW8pO1xuICAgIH1cbiAgfVxuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgc2VuZChjb2xsaXNpb25yZXBvcnQuYnVmZmVyLCBbY29sbGlzaW9ucmVwb3J0LmJ1ZmZlcl0pO1xuICBlbHNlIHNlbmQoY29sbGlzaW9ucmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydFZlaGljbGVzID0gZnVuY3Rpb24gKCkge1xuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBpZiAodmVoaWNsZXJlcG9ydC5sZW5ndGggPCAyICsgX251bV93aGVlbHMgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArXG4gICAgICAgIChNYXRoLmNlaWwoX251bV93aGVlbHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIHtcbiAgICBsZXQgaSA9IDAsXG4gICAgICBqID0gMCxcbiAgICAgIGluZGV4ID0gX3ZlaGljbGVzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBpZiAoX3ZlaGljbGVzW2luZGV4XSkge1xuICAgICAgICBjb25zdCB2ZWhpY2xlID0gX3ZlaGljbGVzW2luZGV4XTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgdmVoaWNsZS5nZXROdW1XaGVlbHMoKTsgaisrKSB7XG4gICAgICAgICAgLy8gdmVoaWNsZS51cGRhdGVXaGVlbFRyYW5zZm9ybSggaiwgdHJ1ZSApO1xuICAgICAgICAgIC8vIHRyYW5zZm9ybSA9IHZlaGljbGUuZ2V0V2hlZWxUcmFuc2Zvcm1XUyggaiApO1xuICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHZlaGljbGUuZ2V0V2hlZWxJbmZvKGopLmdldF9tX3dvcmxkVHJhbnNmb3JtKCk7XG5cbiAgICAgICAgICBjb25zdCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XG4gICAgICAgICAgY29uc3Qgcm90YXRpb24gPSB0cmFuc2Zvcm0uZ2V0Um90YXRpb24oKTtcblxuICAgICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSArIChpKyspICogVkVISUNMRVJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0XSA9IGluZGV4O1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgMV0gPSBqO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi54KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi55KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA0XSA9IG9yaWdpbi56KCk7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDVdID0gcm90YXRpb24ueCgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNl0gPSByb3RhdGlvbi55KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA3XSA9IHJvdGF0aW9uLnooKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDhdID0gcm90YXRpb24udygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIGogIT09IDApIHNlbmQodmVoaWNsZXJlcG9ydC5idWZmZXIsIFt2ZWhpY2xlcmVwb3J0LmJ1ZmZlcl0pO1xuICAgIGVsc2UgaWYgKGogIT09IDApIHNlbmQodmVoaWNsZXJlcG9ydCk7XG4gIH1cbn07XG5cbmNvbnN0IHJlcG9ydENvbnN0cmFpbnRzID0gZnVuY3Rpb24gKCkge1xuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBpZiAoY29uc3RyYWludHJlcG9ydC5sZW5ndGggPCAyICsgX251bV9jb25zdHJhaW50cyAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICtcbiAgICAgICAgKE1hdGguY2VpbChfbnVtX2NvbnN0cmFpbnRzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgICApO1xuICAgICAgY29uc3RyYWludHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDtcbiAgICB9XG4gIH1cblxuICB7XG4gICAgbGV0IG9mZnNldCA9IDAsXG4gICAgICBpID0gMCxcbiAgICAgIGluZGV4ID0gX2NvbnN0cmFpbnRzLmxlbmdodDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBpZiAoX2NvbnN0cmFpbnRzW2luZGV4XSkge1xuICAgICAgICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2luZGV4XTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0X2JvZHkgPSBjb25zdHJhaW50LmE7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IGNvbnN0cmFpbnQudGE7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcblxuICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICBvZmZzZXQgPSAxICsgKGkrKykgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0XSA9IGluZGV4O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDFdID0gb2Zmc2V0X2JvZHkuaWQ7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi55O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDRdID0gb3JpZ2luLno7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgNV0gPSBjb25zdHJhaW50LmdldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSAmJiBpICE9PSAwKSBzZW5kKGNvbnN0cmFpbnRyZXBvcnQuYnVmZmVyLCBbY29uc3RyYWludHJlcG9ydC5idWZmZXJdKTtcbiAgICBlbHNlIGlmIChpICE9PSAwKSBzZW5kKGNvbnN0cmFpbnRyZXBvcnQpO1xuICB9XG59O1xuXG5zZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICBpZiAoZXZlbnQuZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgIC8vIHRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICBzd2l0Y2ggKGV2ZW50LmRhdGFbMF0pIHtcbiAgICBjYXNlIE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ6XG4gICAgICB7XG4gICAgICAgIHdvcmxkcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDpcbiAgICAgIHtcbiAgICAgICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6XG4gICAgICB7XG4gICAgICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDpcbiAgICAgIHtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG4gIGVsc2UgaWYgKGV2ZW50LmRhdGEuY21kICYmIHB1YmxpY19mdW5jdGlvbnNbZXZlbnQuZGF0YS5jbWRdKSBwdWJsaWNfZnVuY3Rpb25zW2V2ZW50LmRhdGEuY21kXShldmVudC5kYXRhLnBhcmFtcyk7XG59O1xuXG5zZWxmLnJlY2VpdmUgPSBzZWxmLm9ubWVzc2FnZTtcblxuXG5cblxufSk7IiwiaW1wb3J0IFdvcmxkTW9kdWxlQmFzZSBmcm9tICcuL2NvcmUvV29ybGRNb2R1bGVCYXNlJztcblxuaW1wb3J0IHtcbiAgYWRkT2JqZWN0Q2hpbGRyZW4sXG4gIE1FU1NBR0VfVFlQRVMsXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDFNYXRyaXg0LFxuICBSRVBPUlRfSVRFTVNJWkUsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSxcbiAgVkVISUNMRVJFUE9SVF9JVEVNU0laRSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRVxufSBmcm9tICcuLi9hcGknO1xuXG5pbXBvcnQgUGh5c2ljc1dvcmtlciBmcm9tICd3b3JrZXIhLi4vd29ya2VyLmpzJztcblxuZXhwb3J0IGNsYXNzIFdvcmxkTW9kdWxlIGV4dGVuZHMgV29ybGRNb2R1bGVCYXNlIHtcbiAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgIHN1cGVyKC4uLmFyZ3MpO1xuXG4gICAgdGhpcy53b3JrZXIgPSBuZXcgUGh5c2ljc1dvcmtlcigpO1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UgPSB0aGlzLndvcmtlci53ZWJraXRQb3N0TWVzc2FnZSB8fCB0aGlzLndvcmtlci5wb3N0TWVzc2FnZTtcblxuICAgIHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICB0aGlzLmxvYWRlciA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIC8vIGlmIChvcHRpb25zLndhc20pIHtcbiAgICAgIC8vICAgZmV0Y2gob3B0aW9ucy53YXNtKVxuICAgICAgLy8gICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmFycmF5QnVmZmVyKCkpXG4gICAgICAvLyAgICAgLnRoZW4oYnVmZmVyID0+IHtcbiAgICAgIC8vICAgICAgIG9wdGlvbnMud2FzbUJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgIC8vXG4gICAgICAvLyAgICAgICB0aGlzLmV4ZWN1dGUoJ2luaXQnLCBvcHRpb25zKTtcbiAgICAgIC8vICAgICAgIHJlc29sdmUoKTtcbiAgICAgIC8vICAgICB9KTtcbiAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgnaW5pdCcsIG9wdGlvbnMpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICAvLyB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmxvYWRlci50aGVuKCgpID0+IHt0aGlzLmlzTG9hZGVkID0gdHJ1ZX0pO1xuXG4gICAgLy8gVGVzdCBTVVBQT1JUX1RSQU5TRkVSQUJMRVxuXG4gICAgY29uc3QgYWIgPSBuZXcgQXJyYXlCdWZmZXIoMSk7XG4gICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZShhYiwgW2FiXSk7XG4gICAgdGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSA9IChhYi5ieXRlTGVuZ3RoID09PSAwKTtcblxuICAgIHRoaXMuc2V0dXAoKTtcbiAgfVxuXG4gIHNlbmQoLi4uYXJncykge1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoLi4uYXJncyk7XG4gIH1cblxuICByZWNlaXZlKGNhbGxiYWNrKSB7XG4gICAgdGhpcy53b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGNhbGxiYWNrKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtWZWN0b3IzLCBRdWF0ZXJuaW9ufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IHByb3BlcnRpZXMgPSB7XG4gIHBvc2l0aW9uOiB7XG4gICAgZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX25hdGl2ZS5wb3NpdGlvbjtcbiAgICB9LFxuXG4gICAgc2V0KHZlY3RvcjMpIHtcbiAgICAgIGNvbnN0IHBvcyA9IHRoaXMuX25hdGl2ZS5wb3NpdGlvbjtcbiAgICAgIGNvbnN0IHNjb3BlID0gdGhpcztcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMocG9zLCB7XG4gICAgICAgIHg6IHtcbiAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5feDtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgc2V0KHgpIHtcbiAgICAgICAgICAgIHNjb3BlLl9fZGlydHlQb3NpdGlvbiA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl94ID0geDtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHk6IHtcbiAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5feTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgc2V0KHkpIHtcbiAgICAgICAgICAgIHNjb3BlLl9fZGlydHlQb3NpdGlvbiA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl95ID0geTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHo6IHtcbiAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fejtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgc2V0KHopIHtcbiAgICAgICAgICAgIHNjb3BlLl9fZGlydHlQb3NpdGlvbiA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl96ID0gejtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuXG4gICAgICBwb3MuY29weSh2ZWN0b3IzKTtcbiAgICB9XG4gIH0sXG5cbiAgcXVhdGVybmlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHRoaXMuX19jX3JvdCA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5uYXRpdmUucXVhdGVybmlvbjtcbiAgICB9LFxuXG4gICAgc2V0KHF1YXRlcm5pb24pIHtcbiAgICAgIGNvbnN0IHF1YXQgPSB0aGlzLl9uYXRpdmUucXVhdGVybmlvbixcbiAgICAgICAgbmF0aXZlID0gdGhpcy5fbmF0aXZlO1xuXG4gICAgICBxdWF0LmNvcHkocXVhdGVybmlvbik7XG5cbiAgICAgIHF1YXQub25DaGFuZ2UoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2Nfcm90KSB7XG4gICAgICAgICAgaWYgKG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMuX19jX3JvdCA9IGZhbHNlO1xuICAgICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIHJvdGF0aW9uOiB7XG4gICAgZ2V0KCkge1xuICAgICAgdGhpcy5fX2Nfcm90ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLl9uYXRpdmUucm90YXRpb247XG4gICAgfSxcblxuICAgIHNldChldWxlcikge1xuICAgICAgY29uc3Qgcm90ID0gdGhpcy5fbmF0aXZlLnJvdGF0aW9uLFxuICAgICAgICBuYXRpdmUgPSB0aGlzLl9uYXRpdmU7XG5cbiAgICAgIHRoaXMucXVhdGVybmlvbi5jb3B5KG5ldyBRdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKGV1bGVyKSk7XG5cbiAgICAgIHJvdC5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9fY19yb3QpIHtcbiAgICAgICAgICB0aGlzLnF1YXRlcm5pb24uY29weShuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihyb3QpKTtcbiAgICAgICAgICBuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBQaHlzaWNzUHJvdG90eXBlKHNjb3BlKSB7XG4gIGZvciAobGV0IGtleSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNjb3BlLCBrZXksIHtcbiAgICAgIGdldDogcHJvcGVydGllc1trZXldLmdldC5iaW5kKHNjb3BlKSxcbiAgICAgIHNldDogcHJvcGVydGllc1trZXldLnNldC5iaW5kKHNjb3BlKSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvbkNvcHkoc291cmNlKSB7XG4gIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuXG4gIGNvbnN0IHBoeXNpY3MgPSB0aGlzLnVzZSgncGh5c2ljcycpO1xuICBjb25zdCBzb3VyY2VQaHlzaWNzID0gc291cmNlLnVzZSgncGh5c2ljcycpO1xuXG4gIHRoaXMubWFuYWdlci5tb2R1bGVzLnBoeXNpY3MgPSBwaHlzaWNzLmNsb25lKHRoaXMubWFuYWdlcik7XG5cbiAgcGh5c2ljcy5kYXRhID0gey4uLnNvdXJjZVBoeXNpY3MuZGF0YX07XG4gIHBoeXNpY3MuZGF0YS5pc1NvZnRCb2R5UmVzZXQgPSBmYWxzZTtcbiAgaWYgKHBoeXNpY3MuZGF0YS5pc1NvZnRib2R5KSBwaHlzaWNzLmRhdGEuaXNTb2Z0Qm9keVJlc2V0ID0gZmFsc2U7XG5cbiAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucm90YXRpb24uY2xvbmUoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gdGhpcy5xdWF0ZXJuaW9uLmNsb25lKCk7XG5cbiAgcmV0dXJuIHNvdXJjZTtcbn1cblxuZnVuY3Rpb24gb25XcmFwKCkge1xuICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5jbG9uZSgpO1xuICB0aGlzLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbi5jbG9uZSgpO1xuICB0aGlzLnF1YXRlcm5pb24gPSB0aGlzLnF1YXRlcm5pb24uY2xvbmUoKTtcbn1cblxuY2xhc3MgQVBJIHtcbiAgYXBwbHlDZW50cmFsSW1wdWxzZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlDZW50cmFsSW1wdWxzZScsIHtpZDogdGhpcy5kYXRhLmlkLCB4OiBmb3JjZS54LCB5OiBmb3JjZS55LCB6OiBmb3JjZS56fSk7XG4gIH1cblxuICBhcHBseUltcHVsc2UoZm9yY2UsIG9mZnNldCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlJbXB1bHNlJywge1xuICAgICAgaWQ6IHRoaXMuZGF0YS5pZCxcbiAgICAgIGltcHVsc2VfeDogZm9yY2UueCxcbiAgICAgIGltcHVsc2VfeTogZm9yY2UueSxcbiAgICAgIGltcHVsc2VfejogZm9yY2UueixcbiAgICAgIHg6IG9mZnNldC54LFxuICAgICAgeTogb2Zmc2V0LnksXG4gICAgICB6OiBvZmZzZXQuelxuICAgIH0pO1xuICB9XG5cbiAgYXBwbHlUb3JxdWUoZm9yY2UpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5VG9ycXVlJywge1xuICAgICAgaWQ6IHRoaXMuZGF0YS5pZCxcbiAgICAgIHRvcnF1ZV94OiBmb3JjZS54LFxuICAgICAgdG9ycXVlX3k6IGZvcmNlLnksXG4gICAgICB0b3JxdWVfejogZm9yY2UuelxuICAgIH0pO1xuICB9XG5cbiAgYXBwbHlDZW50cmFsRm9yY2UoZm9yY2UpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Q2VudHJhbEZvcmNlJywge1xuICAgICAgaWQ6IHRoaXMuZGF0YS5pZCxcbiAgICAgIHg6IGZvcmNlLngsXG4gICAgICB5OiBmb3JjZS55LFxuICAgICAgejogZm9yY2UuelxuICAgIH0pO1xuICB9XG5cbiAgYXBwbHlGb3JjZShmb3JjZSwgb2Zmc2V0KSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUZvcmNlJywge1xuICAgICAgaWQ6IHRoaXMuZGF0YS5pZCxcbiAgICAgIGZvcmNlX3g6IGZvcmNlLngsXG4gICAgICBmb3JjZV95OiBmb3JjZS55LFxuICAgICAgZm9yY2VfejogZm9yY2UueixcbiAgICAgIHg6IG9mZnNldC54LFxuICAgICAgeTogb2Zmc2V0LnksXG4gICAgICB6OiBvZmZzZXQuelxuICAgIH0pO1xuICB9XG5cbiAgZ2V0QW5ndWxhclZlbG9jaXR5KCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuYW5ndWxhclZlbG9jaXR5O1xuICB9XG5cbiAgc2V0QW5ndWxhclZlbG9jaXR5KHZlbG9jaXR5KSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldEFuZ3VsYXJWZWxvY2l0eScsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogdmVsb2NpdHkueCwgeTogdmVsb2NpdHkueSwgejogdmVsb2NpdHkuen1cbiAgICApO1xuICB9XG5cbiAgZ2V0TGluZWFyVmVsb2NpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5saW5lYXJWZWxvY2l0eTtcbiAgfVxuXG4gIHNldExpbmVhclZlbG9jaXR5KHZlbG9jaXR5KSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldExpbmVhclZlbG9jaXR5JyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiB2ZWxvY2l0eS54LCB5OiB2ZWxvY2l0eS55LCB6OiB2ZWxvY2l0eS56fVxuICAgICk7XG4gIH1cblxuICBzZXRBbmd1bGFyRmFjdG9yKGZhY3Rvcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRBbmd1bGFyRmFjdG9yJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiBmYWN0b3IueCwgeTogZmFjdG9yLnksIHo6IGZhY3Rvci56fVxuICAgICk7XG4gIH1cblxuICBzZXRMaW5lYXJGYWN0b3IoZmFjdG9yKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldExpbmVhckZhY3RvcicsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogZmFjdG9yLngsIHk6IGZhY3Rvci55LCB6OiBmYWN0b3Iuen1cbiAgICApO1xuICB9XG5cbiAgc2V0RGFtcGluZyhsaW5lYXIsIGFuZ3VsYXIpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0RGFtcGluZycsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgbGluZWFyLCBhbmd1bGFyfVxuICAgICk7XG4gIH1cblxuICBzZXRDY2RNb3Rpb25UaHJlc2hvbGQodGhyZXNob2xkKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldENjZE1vdGlvblRocmVzaG9sZCcsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgdGhyZXNob2xkfVxuICAgICk7XG4gIH1cblxuICBzZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyhyYWRpdXMpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ3NldENjZFN3ZXB0U3BoZXJlUmFkaXVzJywge2lkOiB0aGlzLmRhdGEuaWQsIHJhZGl1c30pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGV4dGVuZHMgQVBJIHtcbiAgc3RhdGljIHJpZ2lkYm9keSA9ICgpID0+ICh7XG4gICAgdG91Y2hlczogW10sXG4gICAgbGluZWFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgYW5ndWxhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgIG1hc3M6IDEwLFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICByZXN0aXR1dGlvbjogMC4zLFxuICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgZGFtcGluZzogMCxcbiAgICBtYXJnaW46IDBcbiAgfSk7XG5cbiAgc3RhdGljIHNvZnRib2R5ID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICByZXN0aXR1dGlvbjogMC4zLFxuICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgZGFtcGluZzogMCxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgcHJlc3N1cmU6IDEwMCxcbiAgICBtYXJnaW46IDAsXG4gICAga2xzdDogMC45LFxuICAgIGt2c3Q6IDAuOSxcbiAgICBrYXN0OiAwLjksXG4gICAgcGl0ZXJhdGlvbnM6IDEsXG4gICAgdml0ZXJhdGlvbnM6IDAsXG4gICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgY2l0ZXJhdGlvbnM6IDQsXG4gICAgYW5jaG9ySGFyZG5lc3M6IDAuNyxcbiAgICByaWdpZEhhcmRuZXNzOiAxLFxuICAgIGlzU29mdGJvZHk6IHRydWUsXG4gICAgaXNTb2Z0Qm9keVJlc2V0OiBmYWxzZVxuICB9KTtcblxuICBzdGF0aWMgcm9wZSA9ICgpID0+ICh7XG4gICAgdG91Y2hlczogW10sXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgZGFtcGluZzogMCxcbiAgICBtYXJnaW46IDAsXG4gICAga2xzdDogMC45LFxuICAgIGt2c3Q6IDAuOSxcbiAgICBrYXN0OiAwLjksXG4gICAgcGl0ZXJhdGlvbnM6IDEsXG4gICAgdml0ZXJhdGlvbnM6IDAsXG4gICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgY2l0ZXJhdGlvbnM6IDQsXG4gICAgYW5jaG9ySGFyZG5lc3M6IDAuNyxcbiAgICByaWdpZEhhcmRuZXNzOiAxLFxuICAgIGlzU29mdGJvZHk6IHRydWVcbiAgfSk7XG5cbiAgc3RhdGljIGNsb3RoID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIGRhbXBpbmc6IDAsXG4gICAgbWFyZ2luOiAwLFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICBrbHN0OiAwLjksXG4gICAga3ZzdDogMC45LFxuICAgIGthc3Q6IDAuOSxcbiAgICBwaXRlcmF0aW9uczogMSxcbiAgICB2aXRlcmF0aW9uczogMCxcbiAgICBkaXRlcmF0aW9uczogMCxcbiAgICBjaXRlcmF0aW9uczogNCxcbiAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgIHJpZ2lkSGFyZG5lc3M6IDFcbiAgfSk7XG5cbiAgY29uc3RydWN0b3IoZGVmYXVsdHMsIGRhdGEpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24oZGVmYXVsdHMsIGRhdGEpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIG1hbmFnZXIuZGVmaW5lKCdwaHlzaWNzJyk7XG5cbiAgICB0aGlzLmV4ZWN1dGUgPSAoLi4uZGF0YSkgPT4ge1xuICAgICAgcmV0dXJuIG1hbmFnZXIuaGFzKCdtb2R1bGU6d29ybGQnKVxuICAgICAgPyBtYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuZXhlY3V0ZSguLi5kYXRhKVxuICAgICAgOiAoKSA9PiB7fTtcbiAgICB9O1xuICB9XG5cbiAgdXBkYXRlRGF0YShjYWxsYmFjaykge1xuICAgIHRoaXMuYnJpZGdlLmdlb21ldHJ5ID0gZnVuY3Rpb24gKGdlb21ldHJ5LCBtb2R1bGUpIHtcbiAgICAgIGlmICghY2FsbGJhY2spIHJldHVybiBnZW9tZXRyeTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gY2FsbGJhY2soZ2VvbWV0cnksIG1vZHVsZSk7XG4gICAgICByZXR1cm4gcmVzdWx0ID8gcmVzdWx0IDogZ2VvbWV0cnk7XG4gICAgfVxuICB9XG5cbiAgY2xvbmUobWFuYWdlcikge1xuICAgIGNvbnN0IGNsb25lID0gbmV3IHRoaXMuY29uc3RydWN0b3IoKTtcbiAgICBjbG9uZS5kYXRhID0gey4uLnRoaXMuZGF0YX07XG4gICAgY2xvbmUuYnJpZGdlLmdlb21ldHJ5ID0gdGhpcy5icmlkZ2UuZ2VvbWV0cnk7XG4gICAgdGhpcy5tYW5hZ2VyLmFwcGx5KGNsb25lLCBbbWFuYWdlcl0pO1xuXG4gICAgcmV0dXJuIGNsb25lO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG9uQ29weSxcbiAgICBvbldyYXBcbiAgfTtcbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIEJveE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnYm94JyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGRhdGEud2lkdGggfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZGF0YS5oZWlnaHQgfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEuZGVwdGggPSBkYXRhLmRlcHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbXBvdW5kTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjb21wb3VuZCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG4vLyBUT0RPOiBUZXN0IENhcHN1bGVNb2R1bGUgaW4gYWN0aW9uLlxuZXhwb3J0IGNsYXNzIENhcHN1bGVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NhcHN1bGUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZGF0YS53aWR0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgZGF0YS5oZWlnaHQgPSBkYXRhLmhlaWdodCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgZGF0YS5kZXB0aCA9IGRhdGEuZGVwdGggfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uY2F2ZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29uY2F2ZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgZGF0YS5kYXRhID0gdGhpcy5nZW9tZXRyeVByb2Nlc3NvcihnZW9tZXRyeSk7XG4gICAgfSk7XG4gIH1cblxuICBnZW9tZXRyeVByb2Nlc3NvcihnZW9tZXRyeSkge1xuICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgY29uc3QgZGF0YSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgP1xuICAgICAgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6XG4gICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDkpO1xuXG4gICAgaWYgKCFnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBjb25zdCB2ZXJ0aWNlcyA9IGdlb21ldHJ5LnZlcnRpY2VzO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgICBjb25zdCB2QSA9IHZlcnRpY2VzW2ZhY2UuYV07XG4gICAgICAgIGNvbnN0IHZCID0gdmVydGljZXNbZmFjZS5iXTtcbiAgICAgICAgY29uc3QgdkMgPSB2ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgZGF0YVtpOV0gPSB2QS54O1xuICAgICAgICBkYXRhW2k5ICsgMV0gPSB2QS55O1xuICAgICAgICBkYXRhW2k5ICsgMl0gPSB2QS56O1xuXG4gICAgICAgIGRhdGFbaTkgKyAzXSA9IHZCLng7XG4gICAgICAgIGRhdGFbaTkgKyA0XSA9IHZCLnk7XG4gICAgICAgIGRhdGFbaTkgKyA1XSA9IHZCLno7XG5cbiAgICAgICAgZGF0YVtpOSArIDZdID0gdkMueDtcbiAgICAgICAgZGF0YVtpOSArIDddID0gdkMueTtcbiAgICAgICAgZGF0YVtpOSArIDhdID0gdkMuejtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfTtcbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NvbmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLnJhZGl1cyA9IGRhdGEucmFkaXVzIHx8IChnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54KSAvIDI7XG4gICAgICBkYXRhLmhlaWdodCA9IGRhdGEuaGVpZ2h0IHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnl9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbnZleE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29udmV4JyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcbiAgICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkgZ2VvbWV0cnkuX2J1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCkuZnJvbUdlb21ldHJ5KGdlb21ldHJ5KTtcblxuICAgICAgZGF0YS5kYXRhID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/XG4gICAgICAgIGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOlxuICAgICAgICBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ3lsaW5kZXJNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2N5bGluZGVyJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGRhdGEud2lkdGggfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZGF0YS5oZWlnaHQgfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEuZGVwdGggPSBkYXRhLmRlcHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcbmltcG9ydCB7VmVjdG9yMywgVmVjdG9yMiwgQnVmZmVyR2VvbWV0cnl9IGZyb20gJ3RocmVlJztcblxuZXhwb3J0IGNsYXNzIEhlaWdodGZpZWxkTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdoZWlnaHRmaWVsZCcsXG4gICAgICBzaXplOiBuZXcgVmVjdG9yMigxLCAxKSxcbiAgICAgIGF1dG9BbGlnbjogZmFsc2UsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgY29uc3Qge3g6IHhkaXYsIHk6IHlkaXZ9ID0gZGF0YS5zaXplO1xuICAgICAgY29uc3QgdmVydHMgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5ID8gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6IGdlb21ldHJ5LnZlcnRpY2VzO1xuICAgICAgbGV0IHNpemUgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5ID8gdmVydHMubGVuZ3RoIC8gMyA6IHZlcnRzLmxlbmd0aDtcblxuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGNvbnN0IHhzaXplID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGNvbnN0IHlzaXplID0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcblxuICAgICAgZGF0YS54cHRzID0gKHR5cGVvZiB4ZGl2ID09PSAndW5kZWZpbmVkJykgPyBNYXRoLnNxcnQoc2l6ZSkgOiB4ZGl2ICsgMTtcbiAgICAgIGRhdGEueXB0cyA9ICh0eXBlb2YgeWRpdiA9PT0gJ3VuZGVmaW5lZCcpID8gTWF0aC5zcXJ0KHNpemUpIDogeWRpdiArIDE7XG5cbiAgICAgIC8vIG5vdGUgLSB0aGlzIGFzc3VtZXMgb3VyIHBsYW5lIGdlb21ldHJ5IGlzIHNxdWFyZSwgdW5sZXNzIHdlIHBhc3MgaW4gc3BlY2lmaWMgeGRpdiBhbmQgeWRpdlxuICAgICAgZGF0YS5hYnNNYXhIZWlnaHQgPSBNYXRoLm1heChnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSwgTWF0aC5hYnMoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnkpKTtcblxuICAgICAgY29uc3QgcG9pbnRzID0gbmV3IEZsb2F0MzJBcnJheShzaXplKSxcbiAgICAgICAgeHB0cyA9IGRhdGEueHB0cyxcbiAgICAgICAgeXB0cyA9IGRhdGEueXB0cztcblxuICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICBjb25zdCB2TnVtID0gc2l6ZSAlIHhwdHMgKyAoKHlwdHMgLSBNYXRoLnJvdW5kKChzaXplIC8geHB0cykgLSAoKHNpemUgJSB4cHRzKSAvIHhwdHMpKSAtIDEpICogeXB0cyk7XG5cbiAgICAgICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHBvaW50c1tzaXplXSA9IHZlcnRzW3ZOdW0gKiAzICsgMV07XG4gICAgICAgIGVsc2UgcG9pbnRzW3NpemVdID0gdmVydHNbdk51bV0ueTtcbiAgICAgIH1cblxuICAgICAgZGF0YS5wb2ludHMgPSBwb2ludHM7XG5cbiAgICAgIGRhdGEuc2NhbGUubXVsdGlwbHkoXG4gICAgICAgIG5ldyBWZWN0b3IzKHhzaXplIC8gKHhwdHMgLSAxKSwgMSwgeXNpemUgLyAoeXB0cyAtIDEpKVxuICAgICAgKTtcblxuICAgICAgaWYgKGRhdGEuYXV0b0FsaWduKSBnZW9tZXRyeS50cmFuc2xhdGUoeHNpemUgLyAtMiwgMCwgeXNpemUgLyAtMik7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFBsYW5lTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdwbGFuZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBkYXRhLndpZHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGRhdGEuaGVpZ2h0IHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLm5vcm1hbCA9IGRhdGEubm9ybWFsIHx8IGdlb21ldHJ5LmZhY2VzWzBdLm5vcm1hbC5jbG9uZSgpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBTcGhlcmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NwaGVyZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ1NwaGVyZSkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICBkYXRhLnJhZGl1cyA9IGRhdGEucmFkaXVzIHx8IGdlb21ldHJ5LmJvdW5kaW5nU3BoZXJlLnJhZGl1cztcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBTb2Z0Ym9keU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc29mdFRyaW1lc2gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5zb2Z0Ym9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgY29uc3QgaWR4R2VvbWV0cnkgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5XG4gICAgICAgID8gZ2VvbWV0cnlcbiAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgIGdlb21ldHJ5Lm1lcmdlVmVydGljZXMoKTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuc2V0SW5kZXgoXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgKGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGdlb21ldHJ5LmZhY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAxXG4gICAgICAgICAgICApLmNvcHlJbmRpY2VzQXJyYXkoZ2VvbWV0cnkuZmFjZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmZXJHZW9tZXRyeTtcbiAgICAgICAgfSkoKTtcblxuICAgICAgZGF0YS5hVmVydGljZXMgPSBpZHhHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuICAgICAgZGF0YS5hSW5kaWNlcyA9IGlkeEdlb21ldHJ5LmluZGV4LmFycmF5O1xuXG4gICAgICByZXR1cm4gbmV3IEJ1ZmZlckdlb21ldHJ5KCkuZnJvbUdlb21ldHJ5KGdlb21ldHJ5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSA9IDEsIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMgPSB0cnVlKSB7XG4gICAgY29uc3QgbzEgPSB0aGlzLmRhdGEuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcblxuICAgIHRoaXMuZXhlY3V0ZSgnYXBwZW5kQW5jaG9yJywge1xuICAgICAgb2JqOiBvMSxcbiAgICAgIG9iajI6IG8yLFxuICAgICAgbm9kZSxcbiAgICAgIGluZmx1ZW5jZSxcbiAgICAgIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXNcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmZ1bmN0aW9uIGFycmF5TWF4KGFycmF5KSB7XG5cdGlmIChhcnJheS5sZW5ndGggPT09IDApIHJldHVybiAtIEluZmluaXR5O1xuXG5cdHZhciBtYXggPSBhcnJheVswXTtcblxuXHRmb3IgKGxldCBpID0gMSwgbCA9IGFycmF5Lmxlbmd0aDsgaSA8IGw7ICsrIGkgKSB7XG5cdFx0aWYgKGFycmF5WyBpIF0gPiBtYXgpIG1heCA9IGFycmF5W2ldO1xuXHR9XG5cblx0cmV0dXJuIG1heDtcbn1cblxuZXhwb3J0IGNsYXNzIENsb3RoTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzb2Z0Q2xvdGhNZXNoJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUuY2xvdGgoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IGdlb21QYXJhbXMgPSBnZW9tZXRyeS5wYXJhbWV0ZXJzO1xuXG4gICAgICBjb25zdCBnZW9tID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeVxuICAgICAgICA/IGdlb21ldHJ5XG4gICAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgIGdlb21ldHJ5Lm1lcmdlVmVydGljZXMoKTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlckdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG5cdFx0XHRcdFx0Y29uc3QgZmFjZXMgPSBnZW9tZXRyeS5mYWNlcywgZmFjZXNMZW5ndGggPSBmYWNlcy5sZW5ndGgsIHV2cyA9IGdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF07XG5cbiAgICAgICAgICBjb25zdCBub3JtYWxzQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZhY2VzTGVuZ3RoICogMyk7XG4gICAgICAgICAgLy8gY29uc3QgdXZzQXJyYXkgPSBuZXcgQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMik7XG4gICAgICAgICAgY29uc3QgdXZzQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZhY2VzTGVuZ3RoICogMik7XG4gICAgICAgICAgY29uc3QgdXZzUmVwbGFjZWRBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZmFjZXNMZW5ndGggKiA2KTtcblx0XHRcdFx0XHRjb25zdCBmYWNlQXJyYXkgPSBuZXcgVWludDMyQXJyYXkoZmFjZXNMZW5ndGggKiAzKTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmFjZXNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaTMgPSBpICogMztcbiAgICAgICAgICAgIGNvbnN0IGk2ID0gaSAqIDY7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwgPSBmYWNlc1tpXS5ub3JtYWwgfHwgbmV3IFZlY3RvcjMoKTtcblxuXHRcdFx0XHRcdFx0ZmFjZUFycmF5W2kzXSA9IGZhY2VzW2ldLmE7XG4gICAgICAgICAgICBmYWNlQXJyYXlbaTMgKyAxXSA9IGZhY2VzW2ldLmI7XG4gICAgICAgICAgICBmYWNlQXJyYXlbaTMgKyAyXSA9IGZhY2VzW2ldLmM7XG5cbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpM10gPSBub3JtYWwueDtcbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpMyArIDFdID0gbm9ybWFsLnk7XG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTMgKyAyXSA9IG5vcm1hbC56O1xuXG4gICAgICAgICAgICB1dnNBcnJheVtmYWNlc1tpXS5hICogMiArIDBdID0gdXZzW2ldWzBdLng7IC8vIGFcbiAgICAgICAgICAgIHV2c0FycmF5W2ZhY2VzW2ldLmEgKiAyICsgMV0gPSB1dnNbaV1bMF0ueTtcblxuICAgICAgICAgICAgdXZzQXJyYXlbZmFjZXNbaV0uYiAqIDIgKyAwXSA9IHV2c1tpXVsxXS54OyAvLyBiXG4gICAgICAgICAgICB1dnNBcnJheVtmYWNlc1tpXS5iICogMiArIDFdID0gdXZzW2ldWzFdLnk7XG5cbiAgICAgICAgICAgIHV2c0FycmF5W2ZhY2VzW2ldLmMgKiAyICsgMF0gPSB1dnNbaV1bMl0ueDsgLy8gY1xuICAgICAgICAgICAgdXZzQXJyYXlbZmFjZXNbaV0uYyAqIDIgKyAxXSA9IHV2c1tpXVsyXS55O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdub3JtYWwnLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbm9ybWFsc0FycmF5LFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICd1dicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICB1dnNBcnJheSxcbiAgICAgICAgICAgICAgMlxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG5cblx0XHRcdFx0XHRidWZmZXJHZW9tZXRyeS5zZXRJbmRleChcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyAoYXJyYXlNYXgoZmFjZXMpICogMyA+IDY1NTM1ID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheSkoZmFjZXNMZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgKS5jb3B5SW5kaWNlc0FycmF5KGZhY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZmVyR2VvbWV0cnk7XG4gICAgICAgIH0pKCk7XG5cbiAgICAgIGNvbnN0IHZlcnRzID0gZ2VvbS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgICBpZiAoIWdlb21QYXJhbXMud2lkdGhTZWdtZW50cykgZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzID0gMTtcbiAgICAgIGlmICghZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cykgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyA9IDE7XG5cbiAgICAgIGNvbnN0IGlkeDAwID0gMDtcbiAgICAgIGNvbnN0IGlkeDAxID0gZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzO1xuICAgICAgY29uc3QgaWR4MTAgPSAoZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDEpICogKGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEpIC0gKGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEpO1xuICAgICAgY29uc3QgaWR4MTEgPSB2ZXJ0cy5sZW5ndGggLyAzIC0gMTtcblxuICAgICAgZGF0YS5jb3JuZXJzID0gW1xuICAgICAgICB2ZXJ0c1tpZHgwMSAqIDNdLCB2ZXJ0c1tpZHgwMSAqIDMgKyAxXSwgdmVydHNbaWR4MDEgKiAzICsgMl0sIC8vICAg4pWXXG4gICAgICAgIHZlcnRzW2lkeDAwICogM10sIHZlcnRzW2lkeDAwICogMyArIDFdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAyXSwgLy8g4pWUXG4gICAgICAgIHZlcnRzW2lkeDExICogM10sIHZlcnRzW2lkeDExICogMyArIDFdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAyXSwgLy8gICAgICAg4pWdXG4gICAgICAgIHZlcnRzW2lkeDEwICogM10sIHZlcnRzW2lkeDEwICogMyArIDFdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAyXSwgLy8gICAgIOKVmlxuICAgICAgXTtcblxuICAgICAgZGF0YS5zZWdtZW50cyA9IFtnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxLCBnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzICsgMV07XG5cbiAgICAgIHJldHVybiBnZW9tO1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cblxuXHRsaW5rTm9kZXMob2JqZWN0LCBuMSwgbjIsIG1vZGlmaWVyKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBib2R5ID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2xpbmtOb2RlcycsIHtcbiAgICAgIHNlbGYsXG5cdFx0XHRib2R5LFxuICAgICAgbjEsIC8vIHNlbGYgbm9kZVxuICAgICAgbjIsIC8vIGJvZHkgbm9kZVxuXHRcdFx0bW9kaWZpZXJcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZExpbmVhckpvaW50KG9iamVjdCwgc3BlY3MpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IGJvZHkgPSBvYmplY3QudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcblxuICAgIHRoaXMuZXhlY3V0ZSgnYXBwZW5kTGluZWFySm9pbnQnLCB7XG4gICAgICBzZWxmLFxuICAgICAgYm9keSxcbiAgICAgIHNwZWNzXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSwgVmVjdG9yM30gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgUm9wZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc29mdFJvcGVNZXNoJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucm9wZSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICAgIGdlb21ldHJ5ID0gKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBidWZmID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG5cbiAgICAgICAgICBidWZmLmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZjtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGVuZ3RoID0gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheS5sZW5ndGggLyAzO1xuICAgICAgY29uc3QgdmVydCA9IG4gPT4gbmV3IFZlY3RvcjMoKS5mcm9tQXJyYXkoZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSwgbiozKTtcblxuICAgICAgY29uc3QgdjEgPSB2ZXJ0KDApO1xuICAgICAgY29uc3QgdjIgPSB2ZXJ0KGxlbmd0aCAtIDEpO1xuXG4gICAgICBkYXRhLmRhdGEgPSBbXG4gICAgICAgIHYxLngsIHYxLnksIHYxLnosXG4gICAgICAgIHYyLngsIHYyLnksIHYyLnosXG4gICAgICAgIGxlbmd0aFxuICAgICAgXTtcblxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7TG9vcH0gZnJvbSAnd2hzJztcblxuaW1wb3J0IHtcbiAgT2JqZWN0M0QsXG4gIFF1YXRlcm5pb24sXG4gIFZlY3RvcjMsXG4gIEV1bGVyXG59IGZyb20gJ3RocmVlJztcblxuY29uc3QgUElfMiA9IE1hdGguUEkgLyAyO1xuXG4vLyBUT0RPOiBGaXggRE9NXG5mdW5jdGlvbiBGaXJzdFBlcnNvbkNvbnRyb2xzU29sdmVyKGNhbWVyYSwgbWVzaCwgcGFyYW1zKSB7XG4gIGNvbnN0IHZlbG9jaXR5RmFjdG9yID0gMTtcbiAgbGV0IHJ1blZlbG9jaXR5ID0gMC4yNTtcblxuICBtZXNoLnVzZSgncGh5c2ljcycpLnNldEFuZ3VsYXJGYWN0b3Ioe3g6IDAsIHk6IDAsIHo6IDB9KTtcbiAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcblxuICAvKiBJbml0ICovXG4gIGNvbnN0IHBsYXllciA9IG1lc2gsXG4gICAgcGl0Y2hPYmplY3QgPSBuZXcgT2JqZWN0M0QoKTtcblxuICBwaXRjaE9iamVjdC5hZGQoY2FtZXJhLm5hdGl2ZSk7XG5cbiAgY29uc3QgeWF3T2JqZWN0ID0gbmV3IE9iamVjdDNEKCk7XG5cbiAgeWF3T2JqZWN0LnBvc2l0aW9uLnkgPSBwYXJhbXMueXBvczsgLy8gZXllcyBhcmUgMiBtZXRlcnMgYWJvdmUgdGhlIGdyb3VuZFxuICB5YXdPYmplY3QuYWRkKHBpdGNoT2JqZWN0KTtcblxuICBjb25zdCBxdWF0ID0gbmV3IFF1YXRlcm5pb24oKTtcblxuICBsZXQgY2FuSnVtcCA9IGZhbHNlLFxuICAgIC8vIE1vdmVzLlxuICAgIG1vdmVGb3J3YXJkID0gZmFsc2UsXG4gICAgbW92ZUJhY2t3YXJkID0gZmFsc2UsXG4gICAgbW92ZUxlZnQgPSBmYWxzZSxcbiAgICBtb3ZlUmlnaHQgPSBmYWxzZTtcblxuICBwbGF5ZXIub24oJ2NvbGxpc2lvbicsIChvdGhlck9iamVjdCwgdiwgciwgY29udGFjdE5vcm1hbCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGNvbnRhY3ROb3JtYWwueSk7XG4gICAgaWYgKGNvbnRhY3ROb3JtYWwueSA8IDAuNSkgLy8gVXNlIGEgXCJnb29kXCIgdGhyZXNob2xkIHZhbHVlIGJldHdlZW4gMCBhbmQgMSBoZXJlIVxuICAgICAgY2FuSnVtcCA9IHRydWU7XG4gIH0pO1xuXG4gIGNvbnN0IG9uTW91c2VNb3ZlID0gZXZlbnQgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBjb25zdCBtb3ZlbWVudFggPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WCA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFggPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WCgpIDogMDtcbiAgICBjb25zdCBtb3ZlbWVudFkgPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WSA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFkgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WSgpIDogMDtcblxuICAgIHlhd09iamVjdC5yb3RhdGlvbi55IC09IG1vdmVtZW50WCAqIDAuMDAyO1xuICAgIHBpdGNoT2JqZWN0LnJvdGF0aW9uLnggLT0gbW92ZW1lbnRZICogMC4wMDI7XG5cbiAgICBwaXRjaE9iamVjdC5yb3RhdGlvbi54ID0gTWF0aC5tYXgoLVBJXzIsIE1hdGgubWluKFBJXzIsIHBpdGNoT2JqZWN0LnJvdGF0aW9uLngpKTtcbiAgfTtcblxuICBjb25zdCBwaHlzaWNzID0gcGxheWVyLnVzZSgncGh5c2ljcycpO1xuXG4gIGNvbnN0IG9uS2V5RG93biA9IGV2ZW50ID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgIG1vdmVGb3J3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgbW92ZUxlZnQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgY2FzZSA4MzogLy8gc1xuICAgICAgICBtb3ZlQmFja3dhcmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgbW92ZVJpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzI6IC8vIHNwYWNlXG4gICAgICAgIGNvbnNvbGUubG9nKGNhbkp1bXApO1xuICAgICAgICBpZiAoY2FuSnVtcCA9PT0gdHJ1ZSkgcGh5c2ljcy5hcHBseUNlbnRyYWxJbXB1bHNlKHt4OiAwLCB5OiAzMDAsIHo6IDB9KTtcbiAgICAgICAgY2FuSnVtcCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNjogLy8gc2hpZnRcbiAgICAgICAgcnVuVmVsb2NpdHkgPSAwLjU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfTtcblxuICBjb25zdCBvbktleVVwID0gZXZlbnQgPT4ge1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgbW92ZUZvcndhcmQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgbW92ZUxlZnQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIGFcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICBtb3ZlUmlnaHQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY6IC8vIHNoaWZ0XG4gICAgICAgIHJ1blZlbG9jaXR5ID0gMC4yNTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9O1xuXG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlEb3duLCBmYWxzZSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBvbktleVVwLCBmYWxzZSk7XG5cbiAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gIHRoaXMuZ2V0T2JqZWN0ID0gKCkgPT4geWF3T2JqZWN0O1xuXG4gIHRoaXMuZ2V0RGlyZWN0aW9uID0gdGFyZ2V0VmVjID0+IHtcbiAgICB0YXJnZXRWZWMuc2V0KDAsIDAsIC0xKTtcbiAgICBxdWF0Lm11bHRpcGx5VmVjdG9yMyh0YXJnZXRWZWMpO1xuICB9O1xuXG4gIC8vIE1vdmVzIHRoZSBjYW1lcmEgdG8gdGhlIFBoeXNpLmpzIG9iamVjdCBwb3NpdGlvblxuICAvLyBhbmQgYWRkcyB2ZWxvY2l0eSB0byB0aGUgb2JqZWN0IGlmIHRoZSBydW4ga2V5IGlzIGRvd24uXG4gIGNvbnN0IGlucHV0VmVsb2NpdHkgPSBuZXcgVmVjdG9yMygpLFxuICAgIGV1bGVyID0gbmV3IEV1bGVyKCk7XG5cbiAgdGhpcy51cGRhdGUgPSBkZWx0YSA9PiB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIGRlbHRhID0gZGVsdGEgfHwgMC41O1xuICAgIGRlbHRhID0gTWF0aC5taW4oZGVsdGEsIDAuNSwgZGVsdGEpO1xuXG4gICAgaW5wdXRWZWxvY2l0eS5zZXQoMCwgMCwgMCk7XG5cbiAgICBjb25zdCBzcGVlZCA9IHZlbG9jaXR5RmFjdG9yICogZGVsdGEgKiBwYXJhbXMuc3BlZWQgKiBydW5WZWxvY2l0eTtcblxuICAgIGlmIChtb3ZlRm9yd2FyZCkgaW5wdXRWZWxvY2l0eS56ID0gLXNwZWVkO1xuICAgIGlmIChtb3ZlQmFja3dhcmQpIGlucHV0VmVsb2NpdHkueiA9IHNwZWVkO1xuICAgIGlmIChtb3ZlTGVmdCkgaW5wdXRWZWxvY2l0eS54ID0gLXNwZWVkO1xuICAgIGlmIChtb3ZlUmlnaHQpIGlucHV0VmVsb2NpdHkueCA9IHNwZWVkO1xuXG4gICAgLy8gQ29udmVydCB2ZWxvY2l0eSB0byB3b3JsZCBjb29yZGluYXRlc1xuICAgIGV1bGVyLnggPSBwaXRjaE9iamVjdC5yb3RhdGlvbi54O1xuICAgIGV1bGVyLnkgPSB5YXdPYmplY3Qucm90YXRpb24ueTtcbiAgICBldWxlci5vcmRlciA9ICdYWVonO1xuXG4gICAgcXVhdC5zZXRGcm9tRXVsZXIoZXVsZXIpO1xuXG4gICAgaW5wdXRWZWxvY2l0eS5hcHBseVF1YXRlcm5pb24ocXVhdCk7XG5cbiAgICBwaHlzaWNzLmFwcGx5Q2VudHJhbEltcHVsc2Uoe3g6IGlucHV0VmVsb2NpdHkueCwgeTogMCwgejogaW5wdXRWZWxvY2l0eS56fSk7XG4gICAgcGh5c2ljcy5zZXRBbmd1bGFyVmVsb2NpdHkoe3g6IGlucHV0VmVsb2NpdHkueiwgeTogMCwgejogLWlucHV0VmVsb2NpdHkueH0pO1xuICAgIHBoeXNpY3Muc2V0QW5ndWxhckZhY3Rvcih7eDogMCwgeTogMCwgejogMH0pO1xuICB9O1xuXG4gIHBsYXllci5vbigncGh5c2ljczphZGRlZCcsICgpID0+IHtcbiAgICBwbGF5ZXIubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ3VwZGF0ZScsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICB5YXdPYmplY3QucG9zaXRpb24uY29weShwbGF5ZXIucG9zaXRpb24pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGNsYXNzIEZpcnN0UGVyc29uTW9kdWxlIHtcbiAgc3RhdGljIGRlZmF1bHRzID0ge1xuICAgIGJsb2NrOiBudWxsLFxuICAgIHNwZWVkOiAxLFxuICAgIHlwb3M6IDFcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihvYmplY3QsIHBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG5cbiAgICBpZiAoIXRoaXMucGFyYW1zLmJsb2NrKSB7XG4gICAgICB0aGlzLnBhcmFtcy5ibG9jayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdibG9ja2VyJyk7XG4gICAgfVxuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgdGhpcy5jb250cm9scyA9IG5ldyBGaXJzdFBlcnNvbkNvbnRyb2xzU29sdmVyKG1hbmFnZXIuZ2V0KCdjYW1lcmEnKSwgdGhpcy5vYmplY3QsIHRoaXMucGFyYW1zKTtcblxuICAgIGlmICgncG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudFxuICAgICAgfHwgJ21velBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICd3ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50KSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgY29uc3QgcG9pbnRlcmxvY2tjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGlmIChkb2N1bWVudC5wb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICB8fCBkb2N1bWVudC5tb3pQb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICB8fCBkb2N1bWVudC53ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLmNvbnRyb2xzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5wYXJhbXMuYmxvY2suc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdHBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgY29uc3QgcG9pbnRlcmxvY2tlcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdQb2ludGVyIGxvY2sgZXJyb3IuJyk7XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdHBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG5cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2sgPSBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdFBvaW50ZXJMb2NrXG4gICAgICAgICAgfHwgZWxlbWVudC53ZWJraXRSZXF1ZXN0UG9pbnRlckxvY2s7XG5cbiAgICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbiA9IGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW47XG5cbiAgICAgICAgaWYgKC9GaXJlZm94L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgIGNvbnN0IGZ1bGxzY3JlZW5jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgfHwgZG9jdW1lbnQubW96RnVsbHNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgfHwgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSk7XG5cbiAgICAgICAgICAgICAgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSwgZmFsc2UpO1xuXG4gICAgICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgICAgICB9IGVsc2UgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBjb25zb2xlLndhcm4oJ1lvdXIgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHRoZSBQb2ludGVyTG9jaycpO1xuXG4gICAgbWFuYWdlci5nZXQoJ3NjZW5lJykuYWRkKHRoaXMuY29udHJvbHMuZ2V0T2JqZWN0KCkpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCB1cGRhdGVQcm9jZXNzb3IgPSBjID0+IHtcbiAgICAgIHNlbGYuY29udHJvbHMudXBkYXRlKGMuZ2V0RGVsdGEoKSk7XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlTG9vcCA9IG5ldyBMb29wKHVwZGF0ZVByb2Nlc3Nvcikuc3RhcnQodGhpcyk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJNRVNTQUdFX1RZUEVTIiwiV09STERSRVBPUlQiLCJDT0xMSVNJT05SRVBPUlQiLCJWRUhJQ0xFUkVQT1JUIiwiQ09OU1RSQUlOVFJFUE9SVCIsIlNPRlRSRVBPUlQiLCJSRVBPUlRfSVRFTVNJWkUiLCJDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUiLCJWRUhJQ0xFUkVQT1JUX0lURU1TSVpFIiwiQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSIsInRlbXAxVmVjdG9yMyIsIlZlY3RvcjMiLCJ0ZW1wMlZlY3RvcjMiLCJ0ZW1wMU1hdHJpeDQiLCJNYXRyaXg0IiwidGVtcDFRdWF0IiwiUXVhdGVybmlvbiIsImdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24iLCJ4IiwieSIsInoiLCJ3IiwiTWF0aCIsImF0YW4yIiwiYXNpbiIsImdldFF1YXRlcnRpb25Gcm9tRXVsZXIiLCJjMSIsImNvcyIsInMxIiwic2luIiwiYzIiLCJzMiIsImMzIiwiczMiLCJjMWMyIiwiczFzMiIsImNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QiLCJwb3NpdGlvbiIsIm9iamVjdCIsImlkZW50aXR5IiwibWFrZVJvdGF0aW9uRnJvbVF1YXRlcm5pb24iLCJxdWF0ZXJuaW9uIiwiZ2V0SW52ZXJzZSIsImNvcHkiLCJzdWIiLCJhcHBseU1hdHJpeDQiLCJhZGRPYmplY3RDaGlsZHJlbiIsInBhcmVudCIsImkiLCJjaGlsZHJlbiIsImxlbmd0aCIsImNoaWxkIiwicGh5c2ljcyIsImNvbXBvbmVudCIsInVzZSIsImRhdGEiLCJ1cGRhdGVNYXRyaXgiLCJ1cGRhdGVNYXRyaXhXb3JsZCIsInNldEZyb21NYXRyaXhQb3NpdGlvbiIsIm1hdHJpeFdvcmxkIiwic2V0RnJvbVJvdGF0aW9uTWF0cml4IiwicG9zaXRpb25fb2Zmc2V0Iiwicm90YXRpb24iLCJwdXNoIiwiRXZlbnRhYmxlIiwiX2V2ZW50TGlzdGVuZXJzIiwiZXZlbnRfbmFtZSIsImNhbGxiYWNrIiwiaGFzT3duUHJvcGVydHkiLCJpbmRleCIsImluZGV4T2YiLCJzcGxpY2UiLCJwYXJhbWV0ZXJzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJvYmoiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImRpc3BhdGNoRXZlbnQiLCJDb25lVHdpc3RDb25zdHJhaW50Iiwib2JqYSIsIm9iamIiLCJvYmplY3RhIiwib2JqZWN0YiIsInVuZGVmaW5lZCIsImNvbnNvbGUiLCJlcnJvciIsInR5cGUiLCJhcHBsaWVkSW1wdWxzZSIsIndvcmxkTW9kdWxlIiwiaWQiLCJwb3NpdGlvbmEiLCJjbG9uZSIsInBvc2l0aW9uYiIsImF4aXNhIiwiYXhpc2IiLCJleGVjdXRlIiwiY29uc3RyYWludCIsIm1heF9pbXB1bHNlIiwidGFyZ2V0Iiwic2V0RnJvbUV1bGVyIiwiRXVsZXIiLCJIaW5nZUNvbnN0cmFpbnQiLCJheGlzIiwibG93IiwiaGlnaCIsImJpYXNfZmFjdG9yIiwicmVsYXhhdGlvbl9mYWN0b3IiLCJ2ZWxvY2l0eSIsImFjY2VsZXJhdGlvbiIsIlBvaW50Q29uc3RyYWludCIsIlNsaWRlckNvbnN0cmFpbnQiLCJsaW5fbG93ZXIiLCJsaW5fdXBwZXIiLCJhbmdfbG93ZXIiLCJhbmdfdXBwZXIiLCJsaW5lYXIiLCJhbmd1bGFyIiwic2NlbmUiLCJET0ZDb25zdHJhaW50IiwibGltaXQiLCJ3aGljaCIsImxvd19hbmdsZSIsImhpZ2hfYW5nbGUiLCJtYXhfZm9yY2UiLCJWZWhpY2xlIiwibWVzaCIsInR1bmluZyIsIlZlaGljbGVUdW5pbmciLCJ3aGVlbHMiLCJfcGh5c2lqcyIsImdldE9iamVjdElkIiwicmlnaWRCb2R5Iiwic3VzcGVuc2lvbl9zdGlmZm5lc3MiLCJzdXNwZW5zaW9uX2NvbXByZXNzaW9uIiwic3VzcGVuc2lvbl9kYW1waW5nIiwibWF4X3N1c3BlbnNpb25fdHJhdmVsIiwiZnJpY3Rpb25fc2xpcCIsIm1heF9zdXNwZW5zaW9uX2ZvcmNlIiwid2hlZWxfZ2VvbWV0cnkiLCJ3aGVlbF9tYXRlcmlhbCIsImNvbm5lY3Rpb25fcG9pbnQiLCJ3aGVlbF9kaXJlY3Rpb24iLCJ3aGVlbF9heGxlIiwic3VzcGVuc2lvbl9yZXN0X2xlbmd0aCIsIndoZWVsX3JhZGl1cyIsImlzX2Zyb250X3doZWVsIiwid2hlZWwiLCJNZXNoIiwiY2FzdFNoYWRvdyIsInJlY2VpdmVTaGFkb3ciLCJtdWx0aXBseVNjYWxhciIsImFkZCIsIndvcmxkIiwiYW1vdW50Iiwic3RlZXJpbmciLCJicmFrZSIsImZvcmNlIiwiV29ybGRNb2R1bGVCYXNlIiwib3B0aW9ucyIsImJyaWRnZSIsIm9uQWRkIiwic2VsZiIsImRlZmVyIiwib25BZGRDYWxsYmFjayIsImJpbmQiLCJvblJlbW92ZSIsIm9uUmVtb3ZlQ2FsbGJhY2siLCJPYmplY3QiLCJhc3NpZ24iLCJkZWZhdWx0cyIsIm9iamVjdHMiLCJ2ZWhpY2xlcyIsImNvbnN0cmFpbnRzIiwiaXNTaW11bGF0aW5nIiwicmVjZWl2ZSIsIl90ZW1wIiwiZXZlbnQiLCJBcnJheUJ1ZmZlciIsImJ5dGVMZW5ndGgiLCJGbG9hdDMyQXJyYXkiLCJ1cGRhdGVTY2VuZSIsInVwZGF0ZVNvZnRib2RpZXMiLCJ1cGRhdGVDb2xsaXNpb25zIiwidXBkYXRlVmVoaWNsZXMiLCJ1cGRhdGVDb25zdHJhaW50cyIsImNtZCIsInBhcmFtcyIsIndpbmRvdyIsInRlc3QiLCJkZWJ1ZyIsImRpciIsImluZm8iLCJvZmZzZXQiLCJfX2RpcnR5UG9zaXRpb24iLCJzZXQiLCJfX2RpcnR5Um90YXRpb24iLCJsaW5lYXJWZWxvY2l0eSIsImFuZ3VsYXJWZWxvY2l0eSIsIlNVUFBPUlRfVFJBTlNGRVJBQkxFIiwic2VuZCIsImJ1ZmZlciIsInNpemUiLCJhdHRyaWJ1dGVzIiwiZ2VvbWV0cnkiLCJ2b2x1bWVQb3NpdGlvbnMiLCJhcnJheSIsIm9mZnNldFZlcnQiLCJpc1NvZnRCb2R5UmVzZXQiLCJ2b2x1bWVOb3JtYWxzIiwibm9ybWFsIiwib2ZmcyIsIngxIiwieTEiLCJ6MSIsIm54MSIsIm55MSIsIm56MSIsIngyIiwieTIiLCJ6MiIsIm54MiIsIm55MiIsIm56MiIsIngzIiwieTMiLCJ6MyIsIm54MyIsIm55MyIsIm56MyIsImk5IiwibmVlZHNVcGRhdGUiLCJueCIsIm55IiwibnoiLCJ2ZWhpY2xlIiwiZXh0cmFjdFJvdGF0aW9uIiwibWF0cml4IiwiYWRkVmVjdG9ycyIsImNvbGxpc2lvbnMiLCJub3JtYWxfb2Zmc2V0cyIsIm9iamVjdDIiLCJpZDEiLCJqIiwidG91Y2hlcyIsImlkMiIsImNvbXBvbmVudDIiLCJkYXRhMiIsInZlbCIsImdldExpbmVhclZlbG9jaXR5IiwidmVsMiIsInN1YlZlY3RvcnMiLCJ0ZW1wMSIsInRlbXAyIiwibm9ybWFsX29mZnNldCIsImVtaXQiLCJzaG93X21hcmtlciIsImdldERlZmluaXRpb24iLCJtYXJrZXIiLCJTcGhlcmVHZW9tZXRyeSIsIk1lc2hOb3JtYWxNYXRlcmlhbCIsIkJveEdlb21ldHJ5IiwibmF0aXZlIiwibWFuYWdlciIsIndpZHRoIiwic2NhbGUiLCJoZWlnaHQiLCJkZXB0aCIsInJlbW92ZSIsInBvcCIsImZ1bmMiLCJhcmdzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJpc0xvYWRlZCIsImxvYWRlciIsInRoZW4iLCJkZWZpbmUiLCJ3b3JrZXIiLCJzZXRGaXhlZFRpbWVTdGVwIiwiZml4ZWRUaW1lU3RlcCIsInNldEdyYXZpdHkiLCJncmF2aXR5IiwiYWRkQ29uc3RyYWludCIsInNpbXVsYXRlIiwidGltZVN0ZXAiLCJtYXhTdWJTdGVwcyIsIl9zdGF0cyIsImJlZ2luIiwib2JqZWN0X2lkIiwidXBkYXRlIiwicG9zIiwiaXNTb2Z0Ym9keSIsInF1YXQiLCJlbmQiLCJzaW11bGF0ZUxvb3AiLCJMb29wIiwiY2xvY2siLCJnZXREZWx0YSIsInN0YXJ0IiwibG9nIiwicmF0ZUxpbWl0IiwiYW1tbyIsInNvZnRib2R5IiwiVEFSR0VUIiwiU3ltYm9sIiwiU0NSSVBUX1RZUEUiLCJCbG9iQnVpbGRlciIsIldlYktpdEJsb2JCdWlsZGVyIiwiTW96QmxvYkJ1aWxkZXIiLCJNU0Jsb2JCdWlsZGVyIiwiVVJMIiwid2Via2l0VVJMIiwiV29ya2VyIiwic2hpbVdvcmtlciIsImZpbGVuYW1lIiwiZm4iLCJTaGltV29ya2VyIiwiZm9yY2VGYWxsYmFjayIsIm8iLCJzb3VyY2UiLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJzbGljZSIsIm9ialVSTCIsImNyZWF0ZVNvdXJjZU9iamVjdCIsInJldm9rZU9iamVjdFVSTCIsInNlbGZTaGltIiwicG9zdE1lc3NhZ2UiLCJtIiwib25tZXNzYWdlIiwic2V0VGltZW91dCIsImlzVGhpc1RocmVhZCIsInRlc3RXb3JrZXIiLCJ0ZXN0QXJyYXkiLCJVaW50OEFycmF5IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiRXJyb3IiLCJlIiwidGVybWluYXRlIiwic3RyIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsImJsb2IiLCJhcHBlbmQiLCJnZXRCbG9iIiwiZG9jdW1lbnQiLCJFdmVudHMiLCJldmVudHMiLCJlbXB0eSIsIm9uIiwiY3R4Iiwib2ZmIiwibGlzdCIsImluc2lkZVdvcmtlciIsIndlYmtpdFBvc3RNZXNzYWdlIiwiYWIiLCJfb2JqZWN0IiwiX3ZlY3RvciIsIl90cmFuc2Zvcm0iLCJfdHJhbnNmb3JtX3BvcyIsIl9zb2Z0Ym9keV9lbmFibGVkIiwibGFzdF9zaW11bGF0aW9uX2R1cmF0aW9uIiwiX251bV9vYmplY3RzIiwiX251bV9yaWdpZGJvZHlfb2JqZWN0cyIsIl9udW1fc29mdGJvZHlfb2JqZWN0cyIsIl9udW1fd2hlZWxzIiwiX251bV9jb25zdHJhaW50cyIsIl9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSIsIl92ZWMzXzEiLCJfdmVjM18yIiwiX3ZlYzNfMyIsIl9xdWF0IiwicHVibGljX2Z1bmN0aW9ucyIsIl9vYmplY3RzIiwiX3ZlaGljbGVzIiwiX2NvbnN0cmFpbnRzIiwiX29iamVjdHNfYW1tbyIsIl9vYmplY3Rfc2hhcGVzIiwiX21vdGlvbl9zdGF0ZXMiLCJfbm9uY2FjaGVkX3NoYXBlcyIsIl9jb21wb3VuZF9zaGFwZXMiLCJSRVBPUlRfQ0hVTktTSVpFIiwid29ybGRyZXBvcnQiLCJzb2Z0cmVwb3J0IiwiY29sbGlzaW9ucmVwb3J0IiwidmVoaWNsZXJlcG9ydCIsImNvbnN0cmFpbnRyZXBvcnQiLCJXT1JMRFJFUE9SVF9JVEVNU0laRSIsImdldFNoYXBlRnJvbUNhY2hlIiwiY2FjaGVfa2V5Iiwic2V0U2hhcGVDYWNoZSIsInNoYXBlIiwiY3JlYXRlU2hhcGUiLCJkZXNjcmlwdGlvbiIsInNldElkZW50aXR5IiwiQW1tbyIsImJ0Q29tcG91bmRTaGFwZSIsInNldFgiLCJzZXRZIiwic2V0WiIsImJ0U3RhdGljUGxhbmVTaGFwZSIsImJ0Qm94U2hhcGUiLCJyYWRpdXMiLCJidFNwaGVyZVNoYXBlIiwiYnRDeWxpbmRlclNoYXBlIiwiYnRDYXBzdWxlU2hhcGUiLCJidENvbmVTaGFwZSIsInRyaWFuZ2xlX21lc2giLCJidFRyaWFuZ2xlTWVzaCIsImFkZFRyaWFuZ2xlIiwiYnRCdmhUcmlhbmdsZU1lc2hTaGFwZSIsImJ0Q29udmV4SHVsbFNoYXBlIiwiYWRkUG9pbnQiLCJ4cHRzIiwieXB0cyIsInBvaW50cyIsInB0ciIsIl9tYWxsb2MiLCJwIiwicDIiLCJIRUFQRjMyIiwiYnRIZWlnaHRmaWVsZFRlcnJhaW5TaGFwZSIsImFic01heEhlaWdodCIsImNyZWF0ZVNvZnRCb2R5IiwiYm9keSIsInNvZnRCb2R5SGVscGVycyIsImJ0U29mdEJvZHlIZWxwZXJzIiwiYVZlcnRpY2VzIiwiQ3JlYXRlRnJvbVRyaU1lc2giLCJnZXRXb3JsZEluZm8iLCJhSW5kaWNlcyIsImNyIiwiY29ybmVycyIsIkNyZWF0ZVBhdGNoIiwiYnRWZWN0b3IzIiwic2VnbWVudHMiLCJDcmVhdGVSb3BlIiwiaW5pdCIsIm5vV29ya2VyIiwibWFrZVdvcmxkIiwid2FzbUJ1ZmZlciIsImltcG9ydFNjcmlwdHMiLCJsb2FkQW1tb0Zyb21CaW5hcnkiLCJidFRyYW5zZm9ybSIsImJ0UXVhdGVybmlvbiIsInJlcG9ydHNpemUiLCJjb2xsaXNpb25Db25maWd1cmF0aW9uIiwiYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJidERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uIiwiZGlzcGF0Y2hlciIsImJ0Q29sbGlzaW9uRGlzcGF0Y2hlciIsInNvbHZlciIsImJ0U2VxdWVudGlhbEltcHVsc2VDb25zdHJhaW50U29sdmVyIiwiYnJvYWRwaGFzZSIsImFhYmJtaW4iLCJhYWJibWF4IiwiYnRBeGlzU3dlZXAzIiwiYnREYnZ0QnJvYWRwaGFzZSIsImJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZCIsImJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyIiwiYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQiLCJhcHBlbmRBbmNob3IiLCJub2RlIiwib2JqMiIsImNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMiLCJpbmZsdWVuY2UiLCJsaW5rTm9kZXMiLCJzZWxmX2JvZHkiLCJvdGhlcl9ib2R5Iiwic2VsZl9ub2RlIiwiZ2V0X21fbm9kZXMiLCJhdCIsIm4xIiwib3RoZXJfbm9kZSIsIm4yIiwic2VsZl92ZWMiLCJnZXRfbV94Iiwib3RoZXJfdmVjIiwiZm9yY2VfeCIsImZvcmNlX3kiLCJmb3JjZV96IiwiY2FjaGVkX2Rpc3RhbmNlIiwibGlua2VkIiwiX2xvb3AiLCJzZXRJbnRlcnZhbCIsImRpc3RhbmNlIiwic3FydCIsInNldFZlbG9jaXR5IiwibW9kaWZlcjIiLCJtYXgiLCJtb2RpZmllciIsImFkZFZlbG9jaXR5IiwiYXBwZW5kTGluayIsImFkZEZvcmNlIiwiYXBwZW5kTGluZWFySm9pbnQiLCJzcGVjcyIsIlNwZWNzIiwiX3BvcyIsInNldF9wb3NpdGlvbiIsImVycCIsInNldF9lcnAiLCJjZm0iLCJzZXRfY2ZtIiwic3BsaXQiLCJzZXRfc3BsaXQiLCJhZGRPYmplY3QiLCJtb3Rpb25TdGF0ZSIsInNiQ29uZmlnIiwiZ2V0X21fY2ZnIiwidml0ZXJhdGlvbnMiLCJzZXRfdml0ZXJhdGlvbnMiLCJwaXRlcmF0aW9ucyIsInNldF9waXRlcmF0aW9ucyIsImRpdGVyYXRpb25zIiwic2V0X2RpdGVyYXRpb25zIiwiY2l0ZXJhdGlvbnMiLCJzZXRfY2l0ZXJhdGlvbnMiLCJzZXRfY29sbGlzaW9ucyIsInNldF9rREYiLCJmcmljdGlvbiIsInNldF9rRFAiLCJkYW1waW5nIiwicHJlc3N1cmUiLCJzZXRfa1BSIiwiZHJhZyIsInNldF9rREciLCJsaWZ0Iiwic2V0X2tMRiIsImFuY2hvckhhcmRuZXNzIiwic2V0X2tBSFIiLCJyaWdpZEhhcmRuZXNzIiwic2V0X2tDSFIiLCJrbHN0IiwiZ2V0X21fbWF0ZXJpYWxzIiwic2V0X21fa0xTVCIsImthc3QiLCJzZXRfbV9rQVNUIiwia3ZzdCIsInNldF9tX2tWU1QiLCJjYXN0T2JqZWN0IiwiYnRDb2xsaXNpb25PYmplY3QiLCJnZXRDb2xsaXNpb25TaGFwZSIsInNldE1hcmdpbiIsIm1hcmdpbiIsInNldEFjdGl2YXRpb25TdGF0ZSIsInN0YXRlIiwicm9wZSIsImNsb3RoIiwic2V0VyIsInJvdGF0ZSIsInRyYW5zbGF0ZSIsInNldFRvdGFsTWFzcyIsIm1hc3MiLCJhZGRTb2Z0Qm9keSIsImdldF9tX2ZhY2VzIiwiY29tcG91bmRfc2hhcGUiLCJhZGRDaGlsZFNoYXBlIiwiX2NoaWxkIiwidHJhbnMiLCJzZXRPcmlnaW4iLCJzZXRSb3RhdGlvbiIsImRlc3Ryb3kiLCJzZXRMb2NhbFNjYWxpbmciLCJjYWxjdWxhdGVMb2NhbEluZXJ0aWEiLCJidERlZmF1bHRNb3Rpb25TdGF0ZSIsInJiSW5mbyIsImJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyIsInNldF9tX2ZyaWN0aW9uIiwic2V0X21fcmVzdGl0dXRpb24iLCJyZXN0aXR1dGlvbiIsInNldF9tX2xpbmVhckRhbXBpbmciLCJzZXRfbV9hbmd1bGFyRGFtcGluZyIsImJ0UmlnaWRCb2R5IiwiY29sbGlzaW9uX2ZsYWdzIiwic2V0Q29sbGlzaW9uRmxhZ3MiLCJncm91cCIsIm1hc2siLCJhZGRSaWdpZEJvZHkiLCJhY3RpdmF0ZSIsImEiLCJhZGRWZWhpY2xlIiwidmVoaWNsZV90dW5pbmciLCJidFZlaGljbGVUdW5pbmciLCJzZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzIiwic2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uIiwic2V0X21fc3VzcGVuc2lvbkRhbXBpbmciLCJzZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20iLCJzZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UiLCJidFJheWNhc3RWZWhpY2xlIiwiYnREZWZhdWx0VmVoaWNsZVJheWNhc3RlciIsInNldENvb3JkaW5hdGVTeXN0ZW0iLCJyZW1vdmVWZWhpY2xlIiwiYWRkV2hlZWwiLCJzZXRTdGVlcmluZyIsImRldGFpbHMiLCJzZXRTdGVlcmluZ1ZhbHVlIiwic2V0QnJha2UiLCJhcHBseUVuZ2luZUZvcmNlIiwicmVtb3ZlT2JqZWN0IiwicmVtb3ZlU29mdEJvZHkiLCJyZW1vdmVSaWdpZEJvZHkiLCJ1cGRhdGVUcmFuc2Zvcm0iLCJnZXRNb3Rpb25TdGF0ZSIsImdldFdvcmxkVHJhbnNmb3JtIiwic2V0V29ybGRUcmFuc2Zvcm0iLCJ0cmFuc2Zvcm0iLCJ1cGRhdGVNYXNzIiwic2V0TWFzc1Byb3BzIiwiYXBwbHlDZW50cmFsSW1wdWxzZSIsImFwcGx5SW1wdWxzZSIsImltcHVsc2VfeCIsImltcHVsc2VfeSIsImltcHVsc2VfeiIsImFwcGx5VG9ycXVlIiwidG9ycXVlX3giLCJ0b3JxdWVfeSIsInRvcnF1ZV96IiwiYXBwbHlDZW50cmFsRm9yY2UiLCJhcHBseUZvcmNlIiwib25TaW11bGF0aW9uUmVzdW1lIiwibGFzdF9zaW11bGF0aW9uX3RpbWUiLCJzZXRBbmd1bGFyVmVsb2NpdHkiLCJzZXRMaW5lYXJWZWxvY2l0eSIsInNldEFuZ3VsYXJGYWN0b3IiLCJzZXRMaW5lYXJGYWN0b3IiLCJzZXREYW1waW5nIiwic2V0Q2NkTW90aW9uVGhyZXNob2xkIiwidGhyZXNob2xkIiwic2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMiLCJidFBvaW50MlBvaW50Q29uc3RyYWludCIsImJ0SGluZ2VDb25zdHJhaW50IiwidHJhbnNmb3JtYiIsInRyYW5zZm9ybWEiLCJnZXRSb3RhdGlvbiIsInNldEV1bGVyIiwiYnRTbGlkZXJDb25zdHJhaW50IiwidGEiLCJ0YiIsInNldEV1bGVyWllYIiwiYnRDb25lVHdpc3RDb25zdHJhaW50Iiwic2V0TGltaXQiLCJQSSIsImJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50IiwiYiIsImVuYWJsZUZlZWRiYWNrIiwicmVtb3ZlQ29uc3RyYWludCIsImNvbnN0cmFpbnRfc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwic2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwiY2VpbCIsInN0ZXBTaW11bGF0aW9uIiwicmVwb3J0VmVoaWNsZXMiLCJyZXBvcnRDb2xsaXNpb25zIiwicmVwb3J0Q29uc3RyYWludHMiLCJyZXBvcnRXb3JsZCIsInJlcG9ydFdvcmxkX3NvZnRib2RpZXMiLCJoaW5nZV9zZXRMaW1pdHMiLCJoaW5nZV9lbmFibGVBbmd1bGFyTW90b3IiLCJlbmFibGVBbmd1bGFyTW90b3IiLCJoaW5nZV9kaXNhYmxlTW90b3IiLCJlbmFibGVNb3RvciIsInNsaWRlcl9zZXRMaW1pdHMiLCJzZXRMb3dlckxpbkxpbWl0Iiwic2V0VXBwZXJMaW5MaW1pdCIsInNldExvd2VyQW5nTGltaXQiLCJzZXRVcHBlckFuZ0xpbWl0Iiwic2xpZGVyX3NldFJlc3RpdHV0aW9uIiwic2V0U29mdG5lc3NMaW1MaW4iLCJzZXRTb2Z0bmVzc0xpbUFuZyIsInNsaWRlcl9lbmFibGVMaW5lYXJNb3RvciIsInNldFRhcmdldExpbk1vdG9yVmVsb2NpdHkiLCJzZXRNYXhMaW5Nb3RvckZvcmNlIiwic2V0UG93ZXJlZExpbk1vdG9yIiwic2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvciIsInNsaWRlcl9lbmFibGVBbmd1bGFyTW90b3IiLCJzZXRUYXJnZXRBbmdNb3RvclZlbG9jaXR5Iiwic2V0TWF4QW5nTW90b3JGb3JjZSIsInNldFBvd2VyZWRBbmdNb3RvciIsInNsaWRlcl9kaXNhYmxlQW5ndWxhck1vdG9yIiwiY29uZXR3aXN0X3NldExpbWl0IiwiY29uZXR3aXN0X2VuYWJsZU1vdG9yIiwiY29uZXR3aXN0X3NldE1heE1vdG9ySW1wdWxzZSIsInNldE1heE1vdG9ySW1wdWxzZSIsImNvbmV0d2lzdF9zZXRNb3RvclRhcmdldCIsInNldE1vdG9yVGFyZ2V0IiwiY29uZXR3aXN0X2Rpc2FibGVNb3RvciIsImRvZl9zZXRMaW5lYXJMb3dlckxpbWl0Iiwic2V0TGluZWFyTG93ZXJMaW1pdCIsImRvZl9zZXRMaW5lYXJVcHBlckxpbWl0Iiwic2V0TGluZWFyVXBwZXJMaW1pdCIsImRvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCIsInNldEFuZ3VsYXJMb3dlckxpbWl0IiwiZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0Iiwic2V0QW5ndWxhclVwcGVyTGltaXQiLCJkb2ZfZW5hYmxlQW5ndWxhck1vdG9yIiwibW90b3IiLCJnZXRSb3RhdGlvbmFsTGltaXRNb3RvciIsInNldF9tX2VuYWJsZU1vdG9yIiwiZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvciIsInNldF9tX2xvTGltaXQiLCJzZXRfbV9oaUxpbWl0Iiwic2V0X21fdGFyZ2V0VmVsb2NpdHkiLCJzZXRfbV9tYXhNb3RvckZvcmNlIiwiZG9mX2Rpc2FibGVBbmd1bGFyTW90b3IiLCJnZXRDZW50ZXJPZk1hc3NUcmFuc2Zvcm0iLCJvcmlnaW4iLCJnZXRPcmlnaW4iLCJnZXRBbmd1bGFyVmVsb2NpdHkiLCJub2RlcyIsInZlcnQiLCJnZXRfbV9uIiwiZmFjZXMiLCJmYWNlIiwibm9kZTEiLCJub2RlMiIsIm5vZGUzIiwidmVydDEiLCJ2ZXJ0MiIsInZlcnQzIiwibm9ybWFsMSIsIm5vcm1hbDIiLCJub3JtYWwzIiwiZHAiLCJnZXREaXNwYXRjaGVyIiwibnVtIiwiZ2V0TnVtTWFuaWZvbGRzIiwibWFuaWZvbGQiLCJnZXRNYW5pZm9sZEJ5SW5kZXhJbnRlcm5hbCIsIm51bV9jb250YWN0cyIsImdldE51bUNvbnRhY3RzIiwicHQiLCJnZXRDb250YWN0UG9pbnQiLCJnZXRCb2R5MCIsImdldEJvZHkxIiwiZ2V0X21fbm9ybWFsV29ybGRPbkIiLCJnZXROdW1XaGVlbHMiLCJnZXRXaGVlbEluZm8iLCJnZXRfbV93b3JsZFRyYW5zZm9ybSIsImxlbmdodCIsIm9mZnNldF9ib2R5IiwiZ2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwiV29ybGRNb2R1bGUiLCJQaHlzaWNzV29ya2VyIiwidHJhbnNmZXJhYmxlTWVzc2FnZSIsInJlamVjdCIsInNldHVwIiwicHJvcGVydGllcyIsImdldCIsIl9uYXRpdmUiLCJ2ZWN0b3IzIiwic2NvcGUiLCJkZWZpbmVQcm9wZXJ0aWVzIiwiX3giLCJfeSIsIl96IiwiX19jX3JvdCIsIm9uQ2hhbmdlIiwiZXVsZXIiLCJyb3QiLCJ3cmFwUGh5c2ljc1Byb3RvdHlwZSIsImtleSIsImRlZmluZVByb3BlcnR5IiwiY29uZmlndXJhYmxlIiwiZW51bWVyYWJsZSIsIm9uQ29weSIsInNvdXJjZVBoeXNpY3MiLCJtb2R1bGVzIiwib25XcmFwIiwiQVBJIiwiZmFjdG9yIiwiaGFzIiwibW9kdWxlIiwicmVzdWx0IiwiY29uc3RydWN0b3IiLCJyaWdpZGJvZHkiLCJCb3hNb2R1bGUiLCJQaHlzaWNzTW9kdWxlIiwidXBkYXRlRGF0YSIsImJvdW5kaW5nQm94IiwiY29tcHV0ZUJvdW5kaW5nQm94IiwibWluIiwiQ29tcG91bmRNb2R1bGUiLCJDYXBzdWxlTW9kdWxlIiwiQ29uY2F2ZU1vZHVsZSIsImdlb21ldHJ5UHJvY2Vzc29yIiwiaXNCdWZmZXJHZW9tZXRyeSIsInZlcnRpY2VzIiwidkEiLCJ2QiIsInZDIiwiYyIsIkNvbmVNb2R1bGUiLCJDb252ZXhNb2R1bGUiLCJfYnVmZmVyR2VvbWV0cnkiLCJCdWZmZXJHZW9tZXRyeSIsImZyb21HZW9tZXRyeSIsIkN5bGluZGVyTW9kdWxlIiwiSGVpZ2h0ZmllbGRNb2R1bGUiLCJWZWN0b3IyIiwiYXV0b0FsaWduIiwieGRpdiIsInlkaXYiLCJ2ZXJ0cyIsInhzaXplIiwieXNpemUiLCJhYnMiLCJ2TnVtIiwicm91bmQiLCJtdWx0aXBseSIsIlBsYW5lTW9kdWxlIiwiU3BoZXJlTW9kdWxlIiwiYm91bmRpbmdTcGhlcmUiLCJjb21wdXRlQm91bmRpbmdTcGhlcmUiLCJTb2Z0Ym9keU1vZHVsZSIsImlkeEdlb21ldHJ5IiwibWVyZ2VWZXJ0aWNlcyIsImJ1ZmZlckdlb21ldHJ5IiwiYWRkQXR0cmlidXRlIiwiQnVmZmVyQXR0cmlidXRlIiwiY29weVZlY3RvcjNzQXJyYXkiLCJzZXRJbmRleCIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJjb3B5SW5kaWNlc0FycmF5IiwibzEiLCJvMiIsImFycmF5TWF4IiwiSW5maW5pdHkiLCJsIiwiQ2xvdGhNb2R1bGUiLCJnZW9tUGFyYW1zIiwiZ2VvbSIsImZhY2VzTGVuZ3RoIiwidXZzIiwiZmFjZVZlcnRleFV2cyIsIm5vcm1hbHNBcnJheSIsInV2c0FycmF5IiwiZmFjZUFycmF5IiwiaTMiLCJ3aWR0aFNlZ21lbnRzIiwiaGVpZ2h0U2VnbWVudHMiLCJpZHgwMCIsImlkeDAxIiwiaWR4MTAiLCJpZHgxMSIsIlJvcGVNb2R1bGUiLCJidWZmIiwiZnJvbUFycmF5IiwibiIsInYxIiwidjIiLCJQSV8yIiwiRmlyc3RQZXJzb25Db250cm9sc1NvbHZlciIsImNhbWVyYSIsInZlbG9jaXR5RmFjdG9yIiwicnVuVmVsb2NpdHkiLCJwbGF5ZXIiLCJwaXRjaE9iamVjdCIsIk9iamVjdDNEIiwieWF3T2JqZWN0IiwieXBvcyIsImNhbkp1bXAiLCJtb3ZlRm9yd2FyZCIsIm1vdmVCYWNrd2FyZCIsIm1vdmVMZWZ0IiwibW92ZVJpZ2h0Iiwib3RoZXJPYmplY3QiLCJ2IiwiciIsImNvbnRhY3ROb3JtYWwiLCJvbk1vdXNlTW92ZSIsImVuYWJsZWQiLCJtb3ZlbWVudFgiLCJtb3pNb3ZlbWVudFgiLCJnZXRNb3ZlbWVudFgiLCJtb3ZlbWVudFkiLCJtb3pNb3ZlbWVudFkiLCJnZXRNb3ZlbWVudFkiLCJvbktleURvd24iLCJrZXlDb2RlIiwib25LZXlVcCIsImdldE9iamVjdCIsImdldERpcmVjdGlvbiIsInRhcmdldFZlYyIsIm11bHRpcGx5VmVjdG9yMyIsImlucHV0VmVsb2NpdHkiLCJkZWx0YSIsInNwZWVkIiwib3JkZXIiLCJhcHBseVF1YXRlcm5pb24iLCJGaXJzdFBlcnNvbk1vZHVsZSIsImJsb2NrIiwiZ2V0RWxlbWVudEJ5SWQiLCJjb250cm9scyIsImVsZW1lbnQiLCJwb2ludGVybG9ja2NoYW5nZSIsInBvaW50ZXJMb2NrRWxlbWVudCIsIm1velBvaW50ZXJMb2NrRWxlbWVudCIsIndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCIsInN0eWxlIiwiZGlzcGxheSIsInBvaW50ZXJsb2NrZXJyb3IiLCJ3YXJuIiwicXVlcnlTZWxlY3RvciIsInJlcXVlc3RQb2ludGVyTG9jayIsIm1velJlcXVlc3RQb2ludGVyTG9jayIsIndlYmtpdFJlcXVlc3RQb2ludGVyTG9jayIsInJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxzY3JlZW4iLCJtb3pSZXF1ZXN0RnVsbFNjcmVlbiIsIndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIiwiZnVsbHNjcmVlbmNoYW5nZSIsImZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsInVwZGF0ZVByb2Nlc3NvciIsInVwZGF0ZUxvb3AiXSwibWFwcGluZ3MiOiI7Ozs7OztNQU1NQSxnQkFBZ0I7RUFDcEJDLGVBQWEsQ0FETztFQUVwQkMsbUJBQWlCLENBRkc7RUFHcEJDLGlCQUFlLENBSEs7RUFJcEJDLG9CQUFrQixDQUpFO0VBS3BCQyxjQUFZO0VBTFEsQ0FBdEI7O0FBUUEsTUFBTUMsa0JBQWtCLEVBQXhCO0VBQUEsSUFDRUMsMkJBQTJCLENBRDdCO0VBQUEsSUFFRUMseUJBQXlCLENBRjNCO0VBQUEsSUFHRUMsNEJBQTRCLENBSDlCOztBQUtBLE1BQU1DLGVBQWUsSUFBSUMsYUFBSixFQUFyQjtFQUFBLElBQ0VDLGVBQWUsSUFBSUQsYUFBSixFQURqQjtFQUFBLElBRUVFLGVBQWUsSUFBSUMsYUFBSixFQUZqQjtFQUFBLElBR0VDLFlBQVksSUFBSUMsZ0JBQUosRUFIZDs7QUFLQSxNQUFNQyw0QkFBNEIsU0FBNUJBLHlCQUE0QixDQUFDQyxDQUFELEVBQUlDLENBQUosRUFBT0MsQ0FBUCxFQUFVQyxDQUFWLEVBQWdCO0VBQ2hELFNBQU8sSUFBSVYsYUFBSixDQUNMVyxLQUFLQyxLQUFMLENBQVcsS0FBS0wsSUFBSUcsQ0FBSixHQUFRRixJQUFJQyxD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
