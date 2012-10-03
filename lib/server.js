/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , UUID = require('node-uuid')
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

var game={userleft: 0, userright: 0, full: 0 };

sio.sockets.on('connection', function(socket){

  socket.userid = UUID();

  socket.emit('start-connection',{ id: socket.userid });

  console.log('**** \t socket.io:: player ' + socket.userid + ' connected ****');

  socket.on('set-nickname', function (user) {

    socket.set('nickname', user.id, function () {
  
        if ( game.userleft == 0 ) {

          game.userleft = user.id;
          userpos = 0;

        } else if ( game.userright == 0) {

          game.userright = user.id;
          userpos = 1;

        };

      socket.emit('user-ready', {userid: user.id, turn: userpos });

    });
  });

  socket.on('win', function(data){

    console.log(data);

    socket.emit('show-winner');

  });

});


/* Start server */
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
