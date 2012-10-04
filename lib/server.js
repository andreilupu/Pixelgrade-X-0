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
	users = {first_user: "" , second_user: "" };

sio.sockets.on('connection', function(socket){

	socket.userid = UUID();

	socket.emit('start-connection',{ id: socket.userid });

	console.log('**** \t socket.io:: player ' + socket.userid + ' connected ****');

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
			console.log("User : "+ name + " clicked on : "+ data.cellID );
			sio.sockets.emit("board-rebuild", { by: name, on: data.cellID });
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
