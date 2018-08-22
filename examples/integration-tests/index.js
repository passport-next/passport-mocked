// eslint-disable-next-line import/no-unresolved
const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const passport = require('@passport-next/passport');

const port = 3445;

passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((user, done) => { done(null, user); });

const providers = ['dropbox', 'google', 'box'];

const configs = providers.map(provider => ({
  name: provider,
  callbackURL: `http://localhost:${port}/auth/${provider}/callback`,
}));

// passport-mock
const { Strategy } = require('../../');

configs.forEach((config) => {
  passport.use(new Strategy(config, ((accessToken, refreshToken, profile, done) => {
    const doneProfile = Object.assign({}, profile, {
      accessToken,
      refreshToken,
    });
    done(null, doneProfile);
  })));
});

const app = express();

app.set('view engine', 'ejs');
app.set('views', `${__dirname}/views`);
// eslint-disable-next-line import/no-unresolved
app.use(require('morgan')('dev'));
// eslint-disable-next-line import/no-unresolved
app.use(require('body-parser')());
// eslint-disable-next-line import/no-unresolved
app.use(require('express-session')({ secret: 'keyboard cat' }));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals = { profile: req.user || {}, providers };
  next();
});

app.use(express.static(`${__dirname}/public`));

let count = 0;
const buildFakeProfile = function buildFakeProfile(provider) {
  return function profileHandler(req, res, next) {
    // eslint-disable-next-line no-underscore-dangle
    const strategy = passport._strategies[provider];
    // eslint-disable-next-line no-underscore-dangle
    strategy._token_response = { access_token: `${provider}-at`, expires_in: 3600 };
    // eslint-disable-next-line no-underscore-dangle, no-plusplus
    strategy._profile = { id: ++count, provider };
    next();
  };
};

providers.forEach((provider) => {
  app.get(`/auth/${provider}`, buildFakeProfile(provider), passport.authenticate(provider));
  app.get(`/auth/${provider}/callback`, passport.authenticate(provider, { successRedirect: '/', failureRedirect: '/' }));
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/', (req, res) => { res.render('index'); });

const server = app.listen(port, () => {
  const host = server.address().address;
  const { port: serverPort } = server.address();
  // eslint-disable-next-line no-console
  console.log('Passport Mock Example listening at http://%s:%s', host, serverPort);
});
