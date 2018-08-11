/* eslint-disable no-underscore-dangle, camelcase, no-proto */

module.exports = function passportStrategy(passport, util) {
  const clone = function clone(o) { return JSON.parse(JSON.stringify(o)); };

  function MockStrategy(options, verify) {
    if (!verify) { throw new TypeError('MockStrategy requires a verify callback'); }
    if (!(options.callbackURL || options.client.redirect_uris[0])) { throw new TypeError('MockStrategy requires a callbackURL'); }

    this.name = options.name || 'mocked';
    this.verify = verify;
    this._callbackURL = (options.callbackURL || options.client.redirect_uris[0]);
    this._passReqToCallback = options.passReqToCallback || false;
  }

  util.inherits(MockStrategy, passport.Strategy);

  MockStrategy.prototype.authenticate = function authenticate(req) {
    if (!req.query.__mock_strategy_callback) {
      this.redirect(`${this._callbackURL}?__mock_strategy_callback=true`);
    } else if (this._error) {
      const error = this._error;
      if (this.__proto__) {
        delete this.__proto__._error;
      }
      this.fail(error, 401);
    } else {
      const verified = (e, d) => this.success(d);

      const token_set = clone(this._token_response || {});
      const profile = this._profile || {};
      const token_response = clone(this._token_response || {});
      const { access_token, refresh_token } = token_response;
      delete token_response.refresh_token;

      if (this.__proto__) {
        delete this.__proto__._token_response;
        delete this.__proto__._profile;
      }

      const arity = this.verify.length;
      if (arity === 6) {
        this.verify(req, access_token, refresh_token, token_response, profile, verified);
      } else if (arity === 5) {
        if (this._passReqToCallback) {
          this.verify(req, access_token, refresh_token, profile, verified);
        } else {
          this.verify(access_token, refresh_token, token_response, profile, verified);
        }
      } else if (arity === 4) {
        this.verify(access_token, refresh_token, profile, verified);
      } else if (arity === 2) {
        this.verify(token_set, verified);
      }
    }
  };

  return { Strategy: MockStrategy, OAuth2Strategy: MockStrategy };
};

/* eslint-enable no-underscore-dangle, camelcase, no-proto */
