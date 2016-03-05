var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var auth = require('./routes/auth');
var dashboard = require('./routes/dashboard');
var api = require('./routes/api');
var adunit = require('./routes/adunit');
var card = require('./routes/card');

//database
var db = require('./db.connection.js');
db.connect('mongoose', connectionReady);

function connectionReady() {
    console.log('mongoose connectionReady()');
}

// auth
var cookieSession = require('cookie-session');

var app = express();

//set configuration file to app scope
var config = require('./config');
app.set('config', config);

// set cookie encryption
app.use(cookieSession({
    name: 'dmc_native',
    keys: ['denver', 'sc']
}));

// set momentjs to locals obj
app.locals.moment = require('moment');

// define app locals
if (app.get('env') === 'development') {
    app.locals.domain = app.get('config').local.domain;
} else {
    app.locals.domain = app.get('config').production.domain;
}
app.locals.config = app.get('config');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/auth', auth);
app.use('/dashboard', dashboard);
app.use('/api', api);
app.use('/adunit', adunit);
app.use('/card', card);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;