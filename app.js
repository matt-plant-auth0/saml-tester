var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var samlRouter = require('./routes/saml');
var jwtRouter = require('./routes/jwt');
var userDetailsRouter = require('./routes/userdetails');
var apiRouter = require('./routes/api');

var {
  checkUrl,
  APP_URL,
  API_URL,
  ISSUER_BASE_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  SAML_PK,
  SESSION_SECRET,
  PORT
} = require("./env-config");

var app = express();

app.use(checkUrl());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/saml', samlRouter);
app.use('/jwt', jwtRouter);
app.use('/userdetails', userDetailsRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
