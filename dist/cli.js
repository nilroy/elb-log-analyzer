#! /usr/bin/env node

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

require('babel-polyfill');

var _lib = require('./lib.js');

var _lib2 = _interopRequireDefault(_lib);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _safe = require('colors/safe');

var _safe2 = _interopRequireDefault(_safe);

var _progress = require('progress');

var _progress2 = _interopRequireDefault(_progress);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VERSION = 'v1.0.0',
    USEFUL_COLORS = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'];

var options = require('optimist').argv,
    files = options._;

if (options.version || options.v) {
  console.log(VERSION);
  process.exit();
}

if (files == 0) {
  handler(new Error('No argument or file specified'));
  process.exit();
}

if (options.start) {
  options.start = String(options.start);

  if (new Date(options.start).toString() === 'Invalid Date') {
    handler(new Error('Start date is invalid'));
    process.exit();
  } else {
    options.start = new Date(options.start);
  }
}

if (options.end) {
  options.end = String(options.end);

  if (new Date(options.end).toString() === 'Invalid Date') {
    handler(new Error('End date is invalid'));
    process.exit();
  } else {
    options.end = new Date(options.end);
  }
}

options.sortBy = options.sortBy || options.s || 1;

if (typeof options.sortBy !== 'number') {
  handler(new Error('--sortBy must be a number'));
  process.exit();
}

// Assign default columns
options.cols = ['count', 'requested_resource'];
options.prefixes = [];
options.sortBy = options.sortBy - 1; // lib.js accepts sortBy starting with 0 while cli accepts starting with 1
options.limit = options.limit || 10;
options.ascending = options.a;

// Parse prefixes and column choices
_underscore2.default.each(options, function (arg, key) {
  var match = key.match(/^p(refix){0,1}([0-9]+)$/);

  if (match) {
    return options.prefixes[match[2] - 1] = arg;
  }

  match = key.match(/^c(ol){0,1}([0-9]+)$/);

  if (match) {
    options.cols[match[2] - 1] = arg;
  }
});

// If files array consists of only one value it could
// be either a single file or a directory of files
// to be processed.
if (files.length == 1) {
  _async2.default.auto({
    // Check if the file is a directory

    directory: function directory(next) {
      (0, _glob2.default)(files[0] + '/*', next);
    },


    // If it's not directory, pass single file
    singleFile: ['directory', function (next, results) {
      if (results.directory && !!results.directory.length) {
        return next(null, results.directory);
      }

      (0, _glob2.default)(files[0], next);
    }]
  }, function (err, results) {
    if (err) return handler(err);
    if (!results.singleFile.length) return handler(new Error('No file found.'));

    files = results.singleFile;
    exec();
  });
} else exec();

function exec() {
  var bar = new _progress2.default(' processing [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 30,
    total: files.length
  });

  (0, _lib2.default)(_extends({
    files: files
  }, options, {
    progressFunc: function progressFunc() {
      bar.tick();
    }
  })).then(function (logs) {
    _underscore2.default.each(logs, function (log, i) {
      console.log(_safe2.default.white(i + 1) + ' - ' + _underscore2.default.map(log, function (l, index) {
        return _safe2.default[USEFUL_COLORS[index % USEFUL_COLORS.length]](l);
      }).join(_safe2.default.white(' - ')));
    });
  }).catch(handler);
}

function handler(err) {
  console.log(_safe2.default.red('An error occured') + ': ', _safe2.default.cyan(err));
}