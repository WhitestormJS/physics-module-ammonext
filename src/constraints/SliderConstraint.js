import {convertWorldPositionToObject} from '../api';

export class SliderConstraint {
  constructor(obja, objb, position, axis) {
    const objecta = obja;
    let objectb = objb;

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

  getDefinition() {
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

  setLimits(lin_lower, lin_upper, ang_lower, ang_upper) {
    if (this.worldModule) this.worldModule.execute('slider_setLimits', {
      constraint: this.id,
      lin_lower,
      lin_upper,
      ang_lower,
      ang_upper
    });
  }

  setRestitution(linear, angular) {
    if (this.worldModule) this.worldModule.execute(
      'slider_setRestitution',
      {
        constraint: this.id,
        linear,
        angular
      }
    );
  }

  enableLinearMotor(velocity, acceleration) {
    if (this.worldModule) this.worldModule.execute('slider_enableLinearMotor', {
      constraint: this.id,
      velocity,
      acceleration
    });
  }

  disableLinearMotor() {
    if (this.worldModule) this.worldModule.execute('slider_disableLinearMotor', {constraint: this.id});
  }

  enableAngularMotor(velocity, acceleration) {
    this.scene.execute('slider_enableAngularMotor', {
      constraint: this.id,
      velocity,
      acceleration
    });
  }

  disableAngularMotor() {
    if (this.worldModule) this.worldModule.execute('slider_disableAngularMotor', {constraint: this.id});
  }
}
