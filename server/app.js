
// Dependencies
var express = require('express');
var path = require('path');
var session = require('express-session');
var r = require('rethinkdb');

//routes
var auth = require('./routes/auth');


var app = express();

// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });

app.use(express.static(path.join(__dirname, '../public')));

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('ReactAuth app running on' + port);

});
