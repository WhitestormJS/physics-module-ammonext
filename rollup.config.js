import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import serve from 'rollup-plugin-serve';
// import bundleWorker from 'rollup-plugin-bundle-worker';
import bundleWorker from './bundle-worker/index';

let served = false;

const entryToConfig = (input, dest, native = false) => ({
  input,
  name: 'PHYSICS',
  banner: `/* Physics module AmmoNext v${require('./package.json').version} */`,

  external: [
    'three',
    'whs'
  ],

  globals: {
    three: 'THREE',
    whs: 'WHS'
  },

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
      file: `build/${dest}.js`,
      sourcemap: true,
      sourcemapFile: `build/${dest}.js.map`
    },
    {
      format: 'es',
      file: `build/${dest}.module.js`,
      sourcemap: true,
      sourcemapFile: `build/${dest}.module.js.map`
    }
  ]
});

export default [
  entryToConfig('./src/index', 'physics-module'),
  entryToConfig('./src/native', 'physics-module.native', true)
];
