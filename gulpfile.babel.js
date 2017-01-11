// UTILS
import path from 'path';
import del from 'del';
import {argv} from 'yargs';
import express from 'express';
import serveIndex from 'serve-index';

// GULP
import gulp from 'gulp';

// WEBPACK & KARMA
import webpack from 'webpack';
import WebpackDevMiddleware from 'webpack-dev-middleware';

import config from './webpack.config.babel.js';

const webpackCompiler = webpack(config);

// DEV MODE
gulp.task('dev', () => {
  const server = express();

  server.use(new WebpackDevMiddleware(webpackCompiler, {
    contentBase: '/',
    publicPath: '/',

    stats: {colors: true}
  }));

  server.get('/vendor/ammo.js', (req, res) => {
    res.sendFile(path.resolve(__dirname, './vendor/ammo.js'));
  });

  server.listen(argv.port || 8001, 'localhost', () => {});
});
