
// Dependencies
var async           = require('async');
var express         = require('express');
var path            = require('path');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var bCrypt          = require('bcrypt-nodejs');
var session         = require('express-session');
var passport        = require('passport');
var thinky          = require('thinky')();
var type            = thinky.type;
var config          = require('./config.js');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Authentication
var LocalStrategy = require('passport-local').Strategy;

//setup rethinkDB driver and ORM
var r = thinky.r;
var Query = thinky.Query;

// Initiate passport and passport session
app.use(passport.initialize());
app.use(passport.session());

// Express-session settings
app.use(session({
  secret: 'keyboard ninja',
  resave: false,
  saveUninitialized: false
}));


// routing for login 
app.post('/login', function (req, res) {
  // console.log("xxxx", req.body);
  res.end();
});


passport.use(new LocalStrategy(function(username, password, done) {
    // get the username and password from the input arguments of the function
    // query the user from the database
    User.filter({username: 'kenkang'}).run().then(function(user) {
      // if the user is not exist
      if (!user) {
        return done (null, false, {message: "The user is not exist"});
      } 
      else if (!hashing.compare(password, user.password)) {
        // if password does not match
        return done (null, false, {message: "Wrong password"});
      } 
      else {
        // if everything is OK, return null as the error
        // and the authenticated user
        return done (null, user);
      }
    })
    .error(function(err){
      // if command executed with error
      return done(err);
    });
  }
));


// instantiate rethinkDB user model
var User = thinky.createModel("User", {
    id: type.string(),
    firstName: type.string(),
    lastName: type.string(),
    username: type.string(),
    password: type.string()
}); 

// function that hashes provided string 
function createHash (password) {
  return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

// initialize the database with pre-defined user
function createUser() {
  // check if user already exists 
  User.filter({username: 'kenkang'}).run().then(function(result) {
    // if the user doesn't exist, save the default user
    if (!result) {
      User.save([
        {firstName: "Ken", lastName: "Kang", username:"kenkang", password: createHash("bloomsky")}
      ]).then(function(result) {
          console.log(result);
      }).error(function(error) {
          throw error; 
      });
    }
  });
}

// start the express app
function startExpress(connection) {
  app._rdbConn = connection;
  app.listen(config.express.port);
  console.log('Listening on port ' + config.express.port);
}


async.waterfall([
  function connect(callback) {
    r.connect(config.rethinkdb, callback);
  }
], function(err, connection) {
  if(err) {
    console.error(err);
    process.exit(1);
    return;
  }
  createUser(connection);
  startExpress(connection);
});
