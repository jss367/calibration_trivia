'use strict';

var _constants = require('./constants.js');

var _initialization = require('./initialization.js');

console.log('App Version:', _constants.appVersion);

document.addEventListener('DOMContentLoaded', _initialization.initialize);