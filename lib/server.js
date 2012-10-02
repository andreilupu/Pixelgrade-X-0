/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express()
  , server = http.createServer(app)
  , sio = require('socket.io').listen(server)

app.configure(function(){
  app.set('port', process.env.PORT || 8000 );
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);

});

/** Socket.IO server */
sio.sockets.on('connection', function(socket){
  socket.emit('init', { hello: 'world' });
});

/* Start server */
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
