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

	client.userid = UUID();
	game_server.createPlayer(client);

	client
		.on('set:player', function(data){
			client.set('clientid', data.userid);
			client.get('clientid', function (err,id){
				game_server.setPlayer(id,data.ls); // send the local storage	
			})
		})
		.on('find:game',function(data){
			game_server.findGame(client);
		})
		.on('user:click', function(data){
			game_server.proccessTurn( data.gameid, data.host,  data.cellID );
		})
		.on('start:round', function(data){
			game_server.startRound(data);
		})
		.on('disconnect', function(){
			client.get('clientid', function (err,id){
				game_server.distroyGame(id);
			})
		})
		.on('distroy:game', function(){
			client.get('clientid', function (err,id){
				game_server.distroyGame(id);
			})
			
		});
});



