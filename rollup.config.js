import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import serve from 'rollup-plugin-serve';
// import bundleWorker from 'rollup-plugin-bundle-worker';
import bundleWorker from './bundle-worker/index';
import {argv} from 'yargs';

let served = false;

const globals = {
  three: 'THREE',
  whs: 'WHS'
};

const entryToConfig = (input, dest, native = false) => ({
  input,
  banner: `/* Physics module AmmoNext v${require('./package.json').version} */`,

  external: [
    'three',
    'whs'
  ],

  context: 'window',
  moduleContext: 'window',

  plugins: [
    ...(native ? [] : [bundleWorker()]),
    replace({
      'if (typeof module === \'object\' && module.exports) module.exports = Ammo;': 'export default Ammo;'
    }),
    resolve({
      jsnext: true,
      main: true,
      preferBuiltins: false
    }),

    // babelFix(
      babel({
        exclude: [
          'node_modules',
          'vendor/build/ammo.module.js'
        ]
      }),
    // ),

    commonjs({include: 'node_modules/**'}),

    json({
      preferConst: true
    }),

    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),

    ...(process.env.NODE_ENV == 'production' || served ? [] : [
      (() => {
        served = true;

        return serve({
          contentBase: ['build', './'],
          port: 8001
        })
      })()
    ]),
  ],

  output: [
    {
      format: 'umd',
      name: 'PHYSICS',
      file: `build/${dest}.js`,
      sourcemap: !argv.test,
      sourcemapFile: `build/${dest}.js.map`,
      globals
    },
    {
      format: 'es',
      file: `build/${dest}.module.js`,
      sourcemap: !argv.test,
      sourcemapFile: `build/${dest}.module.js.map`,
      globals
    }
  ]
});

export default [
  entryToConfig('./src/index', 'physics-module'),
  ...(argv.test ? [] : [entryToConfig('./src/native', 'physics-module.native', true)])
];
