# Passport-mock

[![NPM version](https://img.shields.io/npm/v/@passport-next/passport-mocked.svg)](https://www.npmjs.com/package/@passport-next/passport-mocked)
[![Build Status](https://travis-ci.org/passport-next/passport-mocked.svg?branch=master)](https://travis-ci.org/passport-next/passport-mocked)
[![Coverage Status](https://coveralls.io/repos/github/passport-next/passport-mocked/badge.svg?branch=master)](https://coveralls.io/github/passport-next/passport-mocked?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/ad14c75df09e29752eee/maintainability)](https://codeclimate.com/github/passport-next/passport-mocked/maintainability)
[![Dependencies](https://david-dm.org/passport-next/passport-mocked.png)](https://david-dm.org/passport-next/passport-mocked)
<!--[![SAST](https://gitlab.com/passport-next/passport-mocked/badges/master/build.svg)](https://gitlab.com/passport-next/passport-mocked/badges/master/build.svg)-->

Designed as a drop in replacement for any passport auth strategy for integration tests.

#### How to use in your code

```javascript
var express = require('express');
var app = express();
var Strategy;

if (process.env.NODE_ENV == 'test' ) {
  Strategy = require('@passport-next/passport-mocked').Strategy;
} else {
  Strategy = require('@passport-next/passport-facebook').Strategy;
}

passport.use(new Strategy({
    name: 'facebook',
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function (accessToken, refreshToken, profile, done) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return done(err, user);
    });
  });
);
```

#### How to use in your test

```javascript
// app is loaded and running in the same process
// using the testing framework of your choice
// probably something like selenium, since you'll most likely need a browser

var passport = require('@passport-next/passport');

this.When(^/I log in to (.+) as:$/, function (provider, table, next) {
  var strategy = passport._strategies[provider];

  strategy._token_response = {
    access_token: 'at-1234',
    expires_in: 3600
  };

  strategy._profile = {
    id: 1234,
    provider: provider,
    displayName: 'Jon Smith',
    emails: [ { value: 'jon.smith@example.com' } ]
  };

  browser.get('/auth/facebook', next);
});

this.Then(^/I should see Jon Smith on the page:$/, function (next) {
  driver.findElement(webdriver.By.css("body")).catch(next).then(function(element){
    element.getText().catch(next).then(function(text){
      console.assert(!!~text.indexOf("Jon Smith"), text + ' should have contained "Jon Smith"');
      next();
    });
  });
});

```
