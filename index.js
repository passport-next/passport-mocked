const util = require('util');
const passport = require('@passport-next/passport');

module.exports = require('./strategy')(passport, util);
