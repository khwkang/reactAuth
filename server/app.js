
// Dependencies
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
  cookie:{_expires : 6000000},
  resave: false,
  saveUninitialized: false
}));

// instantiate rethinkDB user model
var User = thinky.createModel("User", {
  id: type.string(),
  firstName: type.string(),
  lastName: type.string(),
  username: type.string(),
  password: type.string()
}); 

// serialize user instances to the session
passport.serializeUser(function(user, done) {
  console.log("SS:USER:", user)
  done(null, user.username);
});

// deserialize user instance from the session
passport.deserializeUser(function(username, done) {
  User.filter({username: username}).run().then(function(user) {
    // if the user does not exist
    if (user.length <= 0) {
      return done(null, false, {message: "The user is not exist"});
    } else {
      // if everything is OK, return null as the error
      // and the authenticated user
      return done(null, user[0]);
    }
  })
  .error(function(err){
    // if command executed with error
    return done(err);
  });
});

// instantiate passport local strategy
passport.use(new LocalStrategy(function(username, password, done) {
    // get the username and password from the input arguments of the function
    // query the user from the database
  User.filter({username: username}).run().then(function(user) {
    console.log("#USER#", user);
    
    // if the user does not exist
    if (user.length <= 0) {
      console.log("#### NO USER")
      return done(null, false, {message: "The user is not exist"});
    } 
    else if (!bCrypt.compareSync(password, user[0].password)) {
      console.log("#### wrong password")
      // if password does not match
      return done(null, false, {message: "Wrong password"});
    } 
    else {
      console.log("#### OK")
      // if everything is OK, return null as the error
      // and the authenticated user
      return done(null, user[0]);
    }
  })
  .error(function(err){
    console.log("!!!ERR")
    // if command executed with error
    return done(err);
  });
}));

// setup route for login
app.post('/login', loginPost);

function loginPost(req, res, next) {
  // ask passport to authenticate
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      // handle error
      return next(err);
    }
    if (!user) {
      // authentication failed
      req.session.messages = info.message;
      return res.status(401).end('unauthorized');
    }
    // if everything's OK
    req.logIn(user, function(err) {
      if (err) {
        req.session.messages = "Error";
        return next(err);
      }
      // set the message
      req.session.messages = "Login successfully";
      return res.status(200).send(user.username);
    });
  })(req, res, next);
};



app.get('/auth', authCheck); 

function authCheck(req, res, next) {
  if (req.user) {
    console.log("yaaaaaaa");
    res.end()
    // next();
  } else {
    console.log("nooooooo");
    res.end()
    // res.redirect('/');
  }
}

// function that hashes provided string 
function createHash (password) {
  return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

// initialize the database with pre-defined user
function createUser() {
  // check if user already exists 
  User.filter({username: 'kenkang'}).run().then(function(result) {
    // if the user doesn't exist, save the default user
    if (result.length <= 0) {
      User.save([
        {firstName: "Ken", lastName: "Kang", username:"kenkang", password: createHash("bloomsky")}
      ]).then(function(result) {
          console.log("RESULT", result);
      }).error(function(error) {
          throw error; 
      });
    }
  });
};

// start the express app 
function startExpress(connection) {
  app._rdbConn = connection;
  app.listen(config.express.port);
  console.log('Listening on port ' + config.express.port);
};

// connect the DB and initialize app
r.connect(config.rethinkdb, function(err, connection) {
  if(err) {
    console.error(err);
    process.exit(1);
    return;
  }
  createUser(connection);
  startExpress(connection);
});