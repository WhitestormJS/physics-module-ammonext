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

import PhysicsWorker from 'worker!../worker.js';

export class WorldModule extends WorldModuleBase {
  constructor(...args) {
    super(...args);

    this.worker = new PhysicsWorker();
    this.worker.transferableMessage = this.worker.webkitPostMessage || this.worker.postMessage;

    this.isLoaded = false;

    const options = this.options;

    this.loader = new Promise((resolve, reject) => {
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
        this.execute('init', options);
        resolve();
      // }
    });

    this.loader.then(() => {this.isLoaded = true});

    // Test SUPPORT_TRANSFERABLE

    const ab = new ArrayBuffer(1);
    this.worker.transferableMessage(ab, [ab]);
    this.SUPPORT_TRANSFERABLE = (ab.byteLength === 0);

    this.setup();
  }

  send(...args) {
    this.worker.transferableMessage(...args);
  }

  receive(callback) {
    this.worker.addEventListener('message', callback);
  }
}
