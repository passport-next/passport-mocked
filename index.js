var util = require('util');
var passport = require('@passport-next/passport');

module.exports = require('./strategy')(passport, util);
