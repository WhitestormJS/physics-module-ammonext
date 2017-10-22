import WorldModuleBase from './core/WorldModuleBase';

import {
  addObjectChildren,
  MESSAGE_TYPES,
  temp1Vector3,
  temp1Matrix4,
  REPORT_ITEMSIZE,
  COLLISIONREPORT_ITEMSIZE,
  VEHICLEREPORT_ITEMSIZE,
  CONSTRAINTREPORT_ITEMSIZE
} from '../api';

import PhysicsWorker from '../worker.js';
import Ammo from '../../vendor/build/ammo.module.js';

export class WorldModule extends WorldModuleBase {
  constructor(...args) {
    super(...args);

    const options = this.options;

    this.loader = new Promise((resolve, reject) => {
      options.ammo = Ammo;
      options.noWorker = true;
      // console.log(options);
      this.execute('init', options);
      resolve();
    });

    this.setup();
  }

  send(data) {
    PhysicsWorker.receive({data});
  }

  receive(callback) {
    PhysicsWorker.on('message', callback);
  }
}
