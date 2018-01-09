import { convertWorldPositionToObject } from '../api';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

export class ConeTwistConstraint {
  constructor(obja, objb, position) {
    const objecta = obja;
    const objectb = obja;

    if (position === undefined) console.error('Both objects must be defined in a ConeTwistConstraint.');

    this.type = 'conetwist';
    this.appliedImpulse = 0;
    this.worldModule = null; // Will be redefined by .addConstraint
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.objectb = objectb.use('physics').data.id;
    this.positionb = convertWorldPositionToObject(position, objectb).clone();
    this.axisa = {x: objecta.rotation.x, y: objecta.rotation.y, z: objecta.rotation.z};
    this.axisb = {x: objectb.rotation.x, y: objectb.rotation.y, z: objectb.rotation.z};
  }

  getDefinition() {
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

  setLimit(x, y, z) {
    if(this.worldModule) this.worldModule.execute('conetwist_setLimit', {constraint: this.id, x, y, z});
  }

  enableMotor() {
    if(this.worldModule) this.worldModule.execute('conetwist_enableMotor', {constraint: this.id});
  }

  setMaxMotorImpulse(max_impulse) {
    if(this.worldModule) this.worldModule.execute('conetwist_setMaxMotorImpulse', {constraint: this.id, max_impulse});
  }

  setMotorTarget(target) {
    if (target instanceof Vector3)
      target = new Quaternion().setFromEuler(new Euler(target.x, target.y, target.z));
    else if (target instanceof Euler)
      target = new Quaternion().setFromEuler(target);
    else if (target instanceof Matrix4)
      target = new Quaternion().setFromRotationMatrix(target);

    if(this.worldModule) this.worldModule.execute('conetwist_setMotorTarget', {
      constraint: this.id,
      x: target.x,
      y: target.y,
      z: target.z,
      w: target.w
    });
  }
}
