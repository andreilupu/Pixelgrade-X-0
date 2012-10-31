/**
* Module dependencies.
*/

var express = require('express')
, http = require('http')
, UUID = require('node-uuid')
, app = express()
, server = http.createServer(app)
, underscore = require('underscore')
, sio = require('socket.io').listen(server);

app.configure(function(){
	app.set('port', process.env.PORT || 8000 );
	app.use(express.favicon());
});

server.listen(app.get('port'), function(req, res){
	console.log("Express server listening on port " + app.get('port'));
});

game_server = require('./game.server.js');

sio.of('/pixelgradeX&0')
	.on('connection', function(client) {

	client.userid = UUID();
	game_server.createPlayer(client);

	client.on('findGame',function(data){
		client.get('nickname', function (err, name) {
			game_server.findGame(client);
		});
	});

	client
		.on('setNickname', function(data){ // only for development
			client.set('nickname', data.name, function(){
				client.emit('nicknameReady', {name: data.name});
			});
		})
		.on('user-click', function(data){
			client.get('nickname', function (err, name) {
				game_server.proccessTurn( data.gameid, data.host,  data.cellID );
			});
		})
		.on('disconnect', function(){
			game_server.playerDisconnect(client.userid);
		})
		.on('distroyGame', function(){
			game_server.distroyGame(client.userid);
		});
});



