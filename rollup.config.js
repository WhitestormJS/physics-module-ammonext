import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import serve from 'rollup-plugin-serve';
// import bundleWorker from 'rollup-plugin-bundle-worker';
import bundleWorker from './bundle-worker/index';

// Temporary fix.
// const babelFix = babelPlugin => {
//   const oldTransform = babelPlugin.transform;
//
//   babelPlugin.transform = (code, id) => {
//     if (/node_modules/.test(id) || /\.json/.test(id))) {
//       // Fake path to avoid throwing error.
//       if (id.indexOf('node_modules') > 0) id = path.resolve(__dirname, './src/file.js');
//       return oldTransform(code, id);
//     }
//
//     return null;
//   };
//
//   return babelPlugin;
// };

export default {
  entry: 'src/index.js',
  format: 'umd',
  // dest: `build/whs.js`, // equivalent to --output
  moduleName: 'PHYSICS',
  banner: `/* Physics module AmmoNext v${require('./package.json').version} */`,
  sourceMap: true,

  external: [
    'three',
    'whs'
  ],

  globals: {
    three: 'THREE',
    whs: 'WHS'
  },

  plugins: [
    bundleWorker(),
    resolve({
      jsnext: true,
      main: true
    }),

    babel({
      exclude: 'node_modules'
    }),

    commonjs({include: 'node_modules/**'}),

    json({
      preferConst: true
    }),
    replace({'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)}),
    ...(process.env.NODE_ENV == 'production' ? [] : [
      serve({
        contentBase: ['build', './'],
        port: 8001
      })
    ]),
  ],

  targets: [
    {
      dest: 'build/physics-module.js'
    },
    {
      format: 'es',
      dest: 'build/physics-module.module.js'
    }
  ]
};
