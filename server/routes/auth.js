var express      = require('express');
var router       = express.Router();
var passport     = require('passport');
var path         = require('path');
// var DBQuery = require('../utils/dbQueries.js')
// var db = require('../app/config.js');

/**
 * handleAuth creates a session object, which we then store the username as a user
 * property under the req.session object
 */
function handleAuth(req, res, username, id) {
  req.session.regenerate(function() {
    req.session.user = username;
    req.session.user_id = id.toString();
    console.log("SESSION!!! " + req.session.user + "ID!!! " + req.session.user_id);
    // res.redirect('/dashboard');
    res.end();
  });
};

// Local Auth Sign-in
router.post('/login', passport.authenticate('local'), function(req, res) {
  var username = req.body.username;
  console.log('gets to login page');
  // need to check if user is a student or an instructor by doing a db query.
  new Instructor({username: username})
    .fetch()
    .then(function(model){
      if (!model){
        // login is not an instructor
        new Student({username: username})
        .fetch()
        .then(function(model) {
          handleAuth(req, res, username, model.attributes.id);
        });
      } else {
        // login is an instructor
         handleAuth(req, res, username, model.attributes.id);
      }
    })
});

/**
 * Logout... console logs are for checking the req.session object before and after it's
 * destroyed to ensure it's working.
 */

router.get('/logout', function(req, res, next) {

  console.log("Before destroy session... " + JSON.stringify(req.session));
  req.session.destroy(function() {
    console.log("Destroying express-session object for this session... ");
    res.redirect('/');
    // res.json({isAuthed: false});
  });
});


router.get('/checkauth', function(req, res, next) {
  if (req.session.user) {
    console.log('user is logged in')
    res.json({isAuthed:true, username:req.session.user})
  } else {
    console.log('user is NOT logged in')
    res.json({isAuthed:false})
  }
});




module.exports = router;


