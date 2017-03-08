import path from 'path';
import webpack from 'webpack';
import fs from 'fs';
import del from 'del';

del('./build').then(() => {
  fs.mkdirSync('./build');
  console.log('Folder ./build/ cleaned.');
});

process.env.BABEL_ENV = 'browser';

let isProduction = process.env.NODE_ENV === 'production';
if (process.env.CI) isProduction = true;
console.log(isProduction ? 'Production mode' : 'Development mode');
const _version = require('./package.json').version;
console.log(_version);

const bannerText = `Physics module "Ammonext" v${_version}`;

export default {
  devtool: isProduction ? false : 'inline-source-map',
  cache: true,
  entry: [
    './src/index.js'
  ],
  target: 'web',
  output: {
    path: path.join(__dirname, 'build/'),
    filename: 'physics-module.js',
    library: 'PHYSICS',
    libraryTarget: 'umd'
  },
  externals: {
    three : {
      commonjs: 'three',
      commonjs2: 'three',
      amd: 'three',
      root: 'THREE' // indicates global variable
    },
    whs : {
      commonjs: 'whs',
      commonjs2: 'whs',
      amd: 'whs',
      root: 'WHS' // indicates global variable
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          /node_modules/,
          /ammo\.js/
        ],
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
          plugins: [
            ['transform-runtime', {polyfill: false}],
            'transform-class-properties',
            'transform-object-rest-spread'
          ],
          presets: [['es2015', {modules: false}]]
        }
      }
    ]
  },
  plugins: isProduction
    ? [
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          hoist_funs: false, // Turn this off to prevent errors with Ammo.js
          warnings: false,
          dead_code: true
        },
        minimize: true,
        exclude: 'physicsWorker.js'
      }),
      new webpack.BannerPlugin(bannerText)
    ]
    : [
      new webpack.BannerPlugin(bannerText)
    ],
  devServer: {
    publicPath: '/'
  }
}
