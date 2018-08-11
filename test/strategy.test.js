/* eslint-disable no-underscore-dangle, camelcase, no-proto */

const { expect } = require('chai');
const passport = require('@passport-next/passport');
const { Strategy } = require('../');

it('inherits from passport', () => {
  expect(Strategy.super_).to.eql(passport.Strategy);
});

describe('init', () => {
  describe('name', () => {
    it('has a default', () => {
      const strategy = Object.create(new Strategy({ callbackURL: '/cb' }, (() => {})));
      expect(strategy.name).to.eql('mocked');
    });

    it('can be set', () => {
      const strategy = Object.create(new Strategy({ name: 'test', callbackURL: '/cb' }, (() => {})));
      expect(strategy.name).to.eql('test');
    });
  });

  describe('verify', () => {
    it('requires a verify function be passed in', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new Strategy({ callbackURL: '/cb' });
      }).to.throw(Error);
    });
  });

  describe('callbackUrl', () => {
    it('requires a callbackUrl', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new Strategy({}, (() => {}));
      }).to.throw(TypeError);
    });

    it('can be set for OAuth 2', () => {
      const strategy = Object.create(new Strategy({ callbackURL: '/here' }, (() => {})));
      expect(strategy._callbackURL).to.eql('/here');
    });

    it('can be set for OpenID Connect', () => {
      const strategy = Object.create(new Strategy({ client: { redirect_uris: ['/here'] } }, (() => {})));
      expect(strategy._callbackURL).to.eql('/here');
    });
  });

  describe('passReqToCallback', () => {
    it('defaults to false', () => {
      const strategy = Object.create(new Strategy({ callbackURL: '/here' }, (() => {})));
      // eslint-disable-next-line no-unused-expressions
      expect(strategy._passReqToCallback).to.be.false;
    });

    it('can be set to true', () => {
      const strategy = Object.create(new Strategy({ passReqToCallback: true, callbackURL: '/here' }, (() => {})));
      // eslint-disable-next-line no-unused-expressions
      expect(strategy._passReqToCallback).to.be.true;
    });
  });
});

describe('#authenticate', () => {
  let req;

  beforeEach(() => {
    req = { query: { } };
  });

  context('when __mock_strategy_callback is not set', () => {
    it('redirects the user to the callbackURL with the correct query param', (done) => {
      const strategy = Object.create(new Strategy({ callbackURL: '/cb' }, (() => {})));
      strategy.redirect = function redirect(path) {
        expect(path).to.eql('/cb?__mock_strategy_callback=true');
        done();
      };
      strategy.authenticate(req, {});
    });
  });

  context('when __mock_strategy_callback is set', () => {
    let strategy;

    beforeEach(() => {
      req.query.__mock_strategy_callback = true;
    });

    describe('#_error', () => {
      it('calls the fail method', (done) => {
        strategy = new Strategy({ callbackURL: '/cb' }, ((access_token, refresh_token, profile, cb) => { cb(); }));
        strategy._error = new Error('test error');
        strategy = Object.create(strategy);

        strategy.fail = function fail(err, statusCode) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.eql('test error');
          expect(statusCode).to.eql(401);
          // eslint-disable-next-line no-unused-expressions
          expect(strategy._error).to.not.exist;
          done();
        };

        strategy.authenticate(req, {});
      });
    });

    context('when the verify arity is 6', () => {
      it('handles a verify method that asks for request, access token, refresh token, token response, and profile', (done) => {
        strategy = new Strategy({ callbackURL: '/cb', passReqToCallback: true }, ((request, access_token, refresh_token, token_response, profile, cb) => {
          cb(null, {
            request,
            profile,
            token_response,
            access_token,
            refresh_token,
          });
        }));
        strategy._token_response = { access_token: 'at', refresh_token: 'rt' };
        strategy._profile = { id: 1 };
        strategy = Object.create(strategy);

        strategy.success = function success(data) {
          expect(data.request).to.eql(req);
          expect(data.access_token).to.eql('at');
          expect(data.refresh_token).to.eql('rt');
          expect(data.profile.id).to.eql(1);
          expect(data.token_response).to.have.keys('access_token');
          expect(data.token_response.access_token).to.eql('at');
          // eslint-disable-next-line no-unused-expressions
          expect(data.token_response.refresh_token).to.not.exist;
          done();
        };

        strategy.authenticate(req, {});
      });
    });

    context('when the verify arity is 5', () => {
      context('when passReqToCallback is false', () => {
        it('handles a verify method that asks for access token, refresh token, token response, and profile', (done) => {
          strategy = new Strategy({ callbackURL: '/cb' }, ((access_token, refresh_token, token_response, profile, cb) => {
            cb(null, {
              profile,
              token_response,
              access_token,
              refresh_token,
            });
          }));

          strategy._token_response = { access_token: 'at', refresh_token: 'rt' };
          strategy._profile = { id: 1 };
          strategy = Object.create(strategy);

          strategy.success = function success(data) {
            expect(data.access_token).to.eql('at');
            expect(data.refresh_token).to.eql('rt');
            expect(data.profile.id).to.eql(1);
            expect(data.token_response).to.have.keys('access_token');
            expect(data.token_response.access_token).to.eql('at');
            // eslint-disable-next-line no-unused-expressions
            expect(data.token_response.refresh_token).to.not.exist;
            done();
          };

          strategy.authenticate(req, {});
        });
      });

      context('when passReqToCallback is true', () => {
        it('handles a verify method that asks for the request, access_token, refresh_token, and profile', (done) => {
          strategy = new Strategy({ callbackURL: '/cb', passReqToCallback: true }, ((request, access_token, refresh_token, profile, cb) => {
            cb(null, {
              request,
              profile,
              access_token,
              refresh_token,
            });
          }));

          strategy._token_response = { access_token: 'at', refresh_token: 'rt' };
          strategy._profile = { id: 1 };
          strategy = Object.create(strategy);

          strategy.success = function success(data) {
            expect(data.access_token).to.eql('at');
            expect(data.refresh_token).to.eql('rt');
            expect(data.profile.id).to.eql(1);
            expect(data.request).to.eql(req);
            done();
          };

          strategy.authenticate(req, {});
        });
      });
    });

    context('when the verify arity is 4', () => {
      it('handles a verify method that asks for accessToken, refreshToken, and profile correctly', (done) => {
        strategy = new Strategy({ callbackURL: '/cb' }, ((access_token, refresh_token, profile, cb) => {
          cb(null, {
            profile,
            access_token,
            refresh_token,
          });
        }));

        strategy._token_response = { access_token: 'at', refresh_token: 'rt' };
        strategy._profile = { id: 1 };
        strategy = Object.create(strategy);

        strategy.success = function success(data) {
          expect(data.access_token).to.eql('at');
          expect(data.refresh_token).to.eql('rt');
          expect(data.profile.id).to.eql(1);
          done();
        };
        strategy.authenticate(req, {});
      });
    });

    context('when the verify arity is 2', () => {
      it('handles a verify method that asks for tokenResponse correctly', (done) => {
        strategy = new Strategy({ callbackURL: '/cb' }, ((token_response, cb) => {
          cb(null, { token_response });
        }));

        strategy._token_response = { what: 'ever' };
        strategy = Object.create(strategy);

        strategy.success = function success(data) {
          expect(data.token_response).to.eql({ what: 'ever' });
          done();
        };
        strategy.authenticate(req, {});
      });
    });
  });
});

/* eslint-enable no-underscore-dangle, camelcase, no-proto */
