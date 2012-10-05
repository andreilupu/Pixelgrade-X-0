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

var 	games = new Array(),
	board = new Array(),
	game_init = 0,
	turn = 0,
	turnCount = 0,
	result = -1;
	users = {first_user: "" , second_user: "" };

sio.sockets.on('connection', function(socket){

	socket.emit('start-connection');

	socket.on('user-init', function (user) {

		socket.set('nickname', user.user, function () {

			if ( (users.first_user == "") || (users.first_user == user.user) ) {
				users.first_user = user.user;
				sio.sockets.emit('user-ready', {userlist: users});
				sio.sockets.emit('start-game');
			} else if( (users.second_user == "") && (users.first_user != user.user) || (users.second_user == user.user) ) {
				users.second_user = user.user;
				sio.sockets.emit('user-ready', {userlist: users});
				sio.sockets.emit('start-game');
			}

		});
	});

	socket.on('game-init', function(){
		
		socket.get('nickname', function (err, name) {
			if ( name == users.first_user ){
				game_init++;
			} else if (name == users.second_user ) {
				game_init++;
			}
		});

		if ( game_init == 2 ) {

			for (var i = 0; i < 3; i++) {
				board[i] = []; //init board
				for (var j = 0; j < 3; j++) {
					board[i][j]  = -1 ;
				}
			}

			sio.sockets.emit('board-ready', board );			
		}

	});

	socket.on('user-click', function(data){
		socket.get('nickname', function (err, name) {

			var x = data.cellID.slice(0,1);
			var y = data.cellID.slice(1,2);

			if (data.user) {
				board[x][y] = 1;
				turn = 1;
			} else {
				board[x][y] = 0;
				turn = 0;
			}
			
			if ( turn ) {turn = 0} else { turn = 1}
			sio.sockets.emit("board-rebuild", { by: name, on: data.cellID, cellX:x, cellY:y, turn: turn});
		
		});

		if ( turnCount == 27 ) {
			sio.sockets.emit('show-winner');
		} else {
			turnCount++;
		}
	})

	socket.on("get-result", function(){
		socket.emit('result', {result: result});
	});

	socket.on('win', function(data){

		socket.emit('show-winner');

	});

});

/* Start server */
server.listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
