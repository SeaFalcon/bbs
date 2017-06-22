const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const config = require('./config');
const path = require('path');
const sessionStore = new MySQLStore(config.mysql);

// HTTP Server
const app = express();
const port = process.env.PORT || 5000;
app.listen(port);
app.locals.util = require('./util');

// Load mysql
require('./db');

// Setting
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use('/assets', express.static(path.join(__dirname, 'static')));

app.use(session({
    //key: 'session_cookie_name',
    secret: config.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('./middles/locals'));

// Routers
app.use('/user', require('./routers/user'));
app.use('/', require('./routers/bbs'));

// Not Found
app.use(require('./middles/not-found'));

// Error
app.use(require('./middles/error'));
