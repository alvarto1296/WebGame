const express = require("express");
const passport = require('passport');
const boom = require('@hapi/boom');
const cookieParser = require('cookie-parser');
const axios = require('axios');

require("./utils/auth/strategies/google");

const { config } = require("./config");

const app = express();

// body parser
app.use(express.json());
app.use(cookieParser());

// strategy basic
require('./utils/auth/strategies/basic');

//OAuth strategy
require('./utils/auth/strategies/oauth');

const THIRTY_DAYS_IN_SEC = 2592000;
const TWO_HOURS_IN_SEC = 7200;

app.post('/auth/sign-in', async function(req, res, next) {
  const { rememberMe } = req.body;
  passport.authenticate("basic", function(error, data) {
    try {
      if (error || !data) {
        next(boom.unauthorized());
      }
      const { token, ...user } = data;

      req.login(data, { session: false }, async function(error) {
        if (error) {
          next(error);
        }


        if(!config.dev) {
          res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: rememberMe ? THIRTY_DAYS_IN_SEC : TWO_HOURS_IN_SEC
          });
        } else {
          res.cookie('token', token)
          res.status(200).json(user);
        }
      });

    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

app.post('/auth/sign-up', async function(req, res, next) {
  const { body: user } = req;

  try {
    await axios({
      url: `${config.apiUrl}/api/auth/sign-up`,
      method: 'post',
      data: user,
    });

    res.status(200).json({ message: 'user created'});

  } catch (error) {
    next(error);
  }
});

app.get('/movies', async function(req, res, next) {

});

app.post('/user-movies', async function(req, res, next) {
  try {
    const { body: userMovie } = req;
    const { token } = req.cookies;

    const { data, status } = await axios({
      url: `${config.apiUrl}/api/user-movies`,
      headers: { Authorization: `Bearer ${token}` },
      method: 'post',
      data: userMovie
    });

    if(status !== 201) {
      return next(boom.badImplementation());
    };

    res.status(201).json(data)

  } catch (error) {
    next(error)
  }

});

app.delete("/user-movies/:userMovieId", async function(req, res, next) {
  try {
    const { userMovieId } = req.params;
    const { token } = req.cookies;

    const { data, status } = await axios({
      url: `${config.apiUrl}/api/user-movies/${userMovieId}`,
      headers: { Authorization: `Bearer ${token}` },
      method: 'delete',
    });

    if(status !== 200) {
      return next(boom.badImplementation());
    };

    res.status(200).json(data)

  } catch (error) {
    next(error)
  }
});

app.get(
  "/auth/google-oauth",
  passport.authenticate("google-oauth", {
    scope: ["email", "profile", "openid"]
  })
);

app.get(
  "/auth/google-oauth/callback",
  passport.authenticate("google-oauth", { session: false }),
  function(req, res, next) {
    if (!req.user) {
      next(boom.unauthorized());
    }

    const { token, ...user } = req.user;

    res.cookie("token", token, {
      httpOnly: !config.dev,
      secure: !config.dev
    });

    res.status(200).json(user);
  }
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile", "openid"]
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  function(req, res, next) {
    if (!req.user) {
      next(boom.unauthorized());
    }

    const { token, ...user } = req.user;

    res.cookie("token", token, {
      httpOnly: !config.dev,
      secure: !config.dev
    });

    res.status(200).json(user);
  }
);
app.listen(config.port, function() {
  console.log(`Listening http://localhost:${config.port}`);
});