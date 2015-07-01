
// Dependencies
var async           = require('async');
var express         = require('express');
var path            = require('path');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var session         = require('express-session');
var passport        = require('passport');
var r               = require('rethinkdb');
var config          = require('./config.js');


var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
// Authentication
var LocalStrategy = require('passport-local').Strategy;


// Initiate passport and passport session
app.use(passport.initialize());
app.use(passport.session());

// Express-session settings
app.use(session({
  secret: 'keyboard ninja',
  resave: false,
  saveUninitialized: false
}));

// Routing
app.route('/signup')
  .post(createUser)
  
app.route('/auth')
  .get(handleAuth)

function createUser(connection) {
r.table('user').insert(
      {username: "Ken Kang", id:1 }
    ).run(connection, function(err, result) {
    if (err) throw err;
    console.log(JSON.stringify(result));
  })
}

function handleAuth(err, req, res, next) {
  console.log("handling auth");
  console.log("request", req);
  console.log("response", res);
}

function startExpress(connection) {
  app._rdbConn = connection;
  app.listen(config.express.port);
  console.log('Listening on port ' + config.express.port);
}

async.waterfall([
  function connect(callback) {
    r.connect(config.rethinkdb, callback);
  },
  function createDatabase(connection, callback) {
    //Create the database if needed.
    r.dbList().contains(config.rethinkdb.db).do(function(containsDb) {
      return r.branch(
        containsDb,
        {created: 0},
        r.dbCreate(config.rethinkdb.db)
      );
    }).run(connection, function(err) {
      // console.log("xxxx", connection);
      callback(err, connection);
    });
  },

  function createTable(connection, callback) {
    //Create the table if needed.
    r.tableList().contains('user').do(function(containsTable) {
      return r.branch(
        containsTable,
        {created: 0},
        r.tableCreate('user')
      );
    }).run(connection, function(err) {
      callback(err, connection);
    });
  }
], function(err, connection) {
  if(err) {
    console.error(err);
    process.exit(1);
    return;
  }
  // createUser(connection);
  startExpress(connection);
});
