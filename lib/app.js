/**
* Module dependencies.
*/

var express = require('express')
, http = require('http')
, UUID = require('node-uuid')
, app = express()
, server = http.createServer(app)
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

	// app.set('title', 'My Site');
	// console.log(app.get('title') );

	client.userid = UUID();
	game_server.createPlayer(client);
	
	app.get(client.handshake.headers.referer , function(req, res){
		console.log('ura')
	});

	client.on('findGame',function(data){
		client.get('nickname', function (err, name) {
			game_server.findGame(client);
		});
	});

	client.on('setNickname', function(data){ // only for development
		client.set('nickname', data.name, function(){
			client.emit('nicknameReady', {name: data.name});
		});
	});

	client.on('user-click', function(data){
		client.get('nickname', function (err, name) {
			game_server.proccessTurn( data.gameid, data.host,  data.cellID );
		});
	});

	client.on('disconnect', function(){
		game_server.playerDisconnect(client.userid);
	});
});



