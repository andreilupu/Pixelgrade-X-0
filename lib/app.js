/**
* Module dependencies.
*/

var express = require('express')
, http = require('http')
, UUID = require('node-uuid')
, path = require('path')
, app = express()
, server = http.createServer(app)
, sio = require('socket.io').listen(server);

app.configure(function(){
	app.set('port', process.env.PORT || 8000 );
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
});

server.listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

game_server = require('./game.server.js');

sio.sockets.on('connection', function(client) {

	client.userid = UUID();
	//tell the player they connected, giving them their id
	client.emit('onconnected', { id: client.userid } );

	//now we can find them a game to play with someone.
	//if no game exists with someone waiting, they create one and wait.
	//game_server.findGame(client);

});


