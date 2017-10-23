const fs = require('fs');
const path = require('path');

const ammoFile = fs.readFileSync(path.resolve(__dirname, '../vendor/ammo.js'), 'utf8');

const ammoEs6 = ammoFile.replace(
`if (typeof module === "object" && module.exports) {
  module['exports'] = Ammo;
};`,
  'export default Ammo;'
);

fs.writeFileSync(path.resolve(__dirname, '../vendor/build/ammo.module.js'), ammoEs6);
process.exit(0);
