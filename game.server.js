var game_server = module.exports = { games : {}, game_count:0, players: {}, players_count:0, guest_count:0 }
	, UUID        = require('node-uuid')
	, underscore = require('underscore')
	, mongo = require('mongoskin');

// var db = mongo.db('192.168.0.101:29070/pixelgradeX0?auto_reconnect', {safe:false});

// Game functions
game_server.findGame = function(player_socket) {
	console.log('looking for a game. We have : ' + this.game_count);
	if(this.game_count) {
		var joined_a_game = false;
		for(var gameid in this.games) { //Check the list of games for an open game
			if(!this.games.hasOwnProperty(gameid)) continue; //only care about our own properties.
			var game_instance = this.games[gameid]; //get the game we are checking against
			if(game_instance.player_count < 2) { //If the game is a player short
				joined_a_game = true; //someone wants us to join!
				player_socket.join(gameid); // join in the socket room
				game_instance.player_client = player_socket; // setup the client
				game_instance.player_count++;
				this.startGame(game_instance);
			} //if less than 2 players
		} //for all games
		if(!joined_a_game) { //now if we didn't join a game, we must create one
			this.createGame(player_socket);
		} //if no join already
	} else { //if there are no games
		this.createGame(player_socket);
	}
}; //game_server.findGame

game_server.createGame = function(player_socket) {
	var thegame = {
		id : UUID(),
		player_host:player_socket,
		player_client:null,
		player_count:1,
		turn: 1,
		board: new Array(),
		turnCount: 1,  
		round: 0,
		score: { host: 0, client: 0 }
	};
	this.games[ thegame.id ] = thegame;
	this.game_count++;
	this.players[player_socket.userid].gameid = thegame.id;
	thegame.player_host.join(thegame.id); // create a socket room by joining the host to it
	thegame.player_host.to(thegame.id).emit('create:game', { gameid: thegame.id} );
	thegame.player_host.emit('setMeHost');

	for (var i = 0; i < 3; i++) {
		thegame.board[i] = []; //init board
		for (var j = 0; j < 3; j++) {
			thegame.board[i][j]  = -1 ;
		}
	}
	console.log("Game created : " + thegame.id);
	//return thegame;

}; //game_server.createGame

game_server.startGame = function(game) {
	game.player_client.to(game.id).emit('start:game', {gameid: game.id}); // the client doesn't know yet his gameid
	game.player_host.to(game.id).emit('start:game');
	game.active = true;
	console.log("Game started : " + game.id);
	// db.collection('games').save({id:game.id , host: game.player_host.userid, client: game.player_client.userid });
}; //game_server.startGame

game_server.startRound = function(data){
	var thegame = this.games[data.gameid];

	if ( data.host ) {
		this.players[ this.games[data.gameid].player_host.userid ].ready = true;
	} else {
		this.players[ this.games[data.gameid].player_client.userid ].ready = true;
	}

	if ( this.players[ this.games[data.gameid].player_host.userid ].ready && this.players[ this.games[data.gameid].player_client.userid ].ready ) {
		
		this.games[data.gameid].turn = 1;
		this.games[data.gameid].turnCount = 1;
		for (var i = 0; i < 3; i++) {
			this.games[data.gameid].board[i] = []; // reinit board
			for (var j = 0; j < 3; j++) {
				this.games[data.gameid].board[i][j]  = -1 ;
			}
		}
		this.games[data.gameid].player_host.to(data.gameid).emit('round:start', { score: this.games[data.gameid].score} );
		this.games[data.gameid].player_client.to(data.gameid).emit('round:start', { score: this.games[data.gameid].score});
		this.players[ this.games[data.gameid].player_host.userid ].ready = false;
		this.players[ this.games[data.gameid].player_client.userid ].ready = false;
	}
}

//we are requesting to kill a game in progress.
game_server.distroyGame = function(socket_userid) {

	player = this.players[socket_userid];
	gameid = player.gameid;
	userid = player.userid;
	var thegame = this.games[gameid];

	if( thegame ) { // if there is such a game
		delete this.games[gameid]; // delete it 
		this.game_count--;
		console.log("Game deleted. Now there are : "+ this.game_count+" games " );

		if(thegame.player_count > 1) {
			if( userid == thegame.player_host.userid) { // if other player is still here send it to the main page.
				if(thegame.player_client) { 
					// this.findGame(thegame.player_client);
					thegame.player_client.to(gameid).emit('player:init', thegame.player_client.userid);
				}
			} else {
				if(thegame.player_host) {
					// this.findGame(thegame.player_host);
					thegame.player_host.to(gameid).emit('player:init', thegame.player_host.userid);
				}
			}
		}

	} else {
		console.log('that game was not found!');
	}

	if (player) { // if there is such a player we say good bye
		delete this.players[socket_userid];
		this.players_count--;
		console.log("Player left. There are now : "+ this.players_count);
	}
}; //game_server.distroyGame

// End game functions
// Player functions

game_server.createPlayer = function(socket){

	var player = {
		name: "",
		id: socket.userid,
		gameid: "",
		socket: socket,
		ready: false,
	}

	this.players[ player.id ] = player;
	socket.emit('player:init', { id: player.id });
	console.log("Player Created ! " + player.id );

}

game_server.setPlayer = function(userid, ls){
	var player = this.players[userid];

	this.players[userid].name = ls.name;
	this.players[userid].avatar = ls.avatar;
	this.players[userid].type = ls.type;

	this.players[userid] = player;
}

// game_server.playerDisconnect = function(socket_userid) {

// 	player = this.players[socket_userid];
// 	gameid = player.gameid;
// 	userid = player.userid;
// 	var thegame = this.games[gameid];
// 	if(thegame) {

// 		//if the game has two players, the one is leaving
// 		if(thegame.player_count > 1) {
// 			if( userid == thegame.player_host.userid) {
// 				if(thegame.player_client) {
// 					this.findGame(thegame.player_client);
// 				}
// 			} else {
// 				if(thegame.player_host) {
// 					this.findGame(thegame.player_host);
// 				}
// 			}
// 		}
// 		delete this.games[gameid];
// 		console.log("Game deleted : " + gameid);
// 		this.game_count--;
// 		console.log('game removed. there are now ' + this.game_count + ' games' );
// 	}

// 	console.log("Player disconnected " + socket_userid);

// 	delete this.players[socket_userid];
// 	this.player_client--;

// }; //game_server.playerDisconnect

// End player functions
// Game loop functions

game_server.proccessTurn = function(gameid, host, cellID) {

	var x = cellID.slice(0,1),
		y = cellID.slice(1,2),
		component = "";

	if (host) { // 
		this.games[gameid].board[x][y] = 1;
		component = "host";
	} else {
		this.games[gameid].board[x][y] = 0;
		component = "client";
	}

	if ( this.games[gameid].turn ) { // no matter what we change the turn and we rebuild the players boards with te new data
		this.games[gameid].turn = 0;
		this.games[gameid].player_client.to(gameid).emit('board:rebuild', { x: x, y: y, component: component, turn: 1, turnCount: this.games[gameid].turnCount } );
		this.games[gameid].player_host.to(gameid).emit('board:rebuild', { x: x, y: y, component: component, turn: 0, turnCount: this.games[gameid].turnCount } );
	} else {
		this.games[gameid].turn = 1;
		this.games[gameid].player_client.to(gameid).emit('board:rebuild', { x: x, y: y, component: component, turn: 0, turnCount: this.games[gameid].turnCount } );
		this.games[gameid].player_host.to(gameid).emit('board:rebuild', { x: x, y: y, component: component, turn: 1, turnCount: this.games[gameid].turnCount } );
	}

	//						the board 		coords
	if ( checkFour(this.games[gameid].board, parseInt(x),parseInt( y)) ){ //checkTurn(this.games[gameid].board, x, y, lineWin = 3 ) ) {
		
		var winner = "";
		
		if ( host ){

			// this.games[gameid].player_host.wins++; // keep wins
			this.games[gameid].score.host++;
			this.games[gameid].player_host.emit('round:over', {draw: false, winner: 1 });
			this.games[gameid].player_client.emit('round:over', {draw: false, winner: 0 });

			console.log("Host Won the round : "+ this.games[gameid].round +" ! " + gameid );

		} else {
			this.games[gameid].score.client++;
			this.games[gameid].player_host.emit('round:over', {draw: false, winner: 0 });
			this.games[gameid].player_client.emit('round:over', {draw: false, winner: 1 });
			console.log("Client Won the round : "+ this.games[gameid].round +" ! " + gameid );

		}

		// reset the players state

		this.players[ this.games[gameid].player_host.userid ].ready = false;
		this.players[ this.games[gameid].player_client.userid ].ready = false;

		return;
	}

	if ( this.games[gameid].turnCount == 9 ) { // it's a draw
		console.log("Draw ! " + gameid );
		this.games[gameid].player_client.to(gameid).emit('round:over', { draw: true } );
		this.games[gameid].player_host.to(gameid).emit('round:over', { draw: true } );
	} else {
		this.games[gameid].turnCount++;
	}
}

function checkFour(board, column, row) {
	var turn = board[column][row];
	if(checkVertical(board, column, row,turn)) return true;
	if(checkHorizontal(board, column, row,turn)) return true;
	if(checkLeftDiagonal(board, column, row,turn)) return true;
	if(checkRightDiagonal(board, column, row,turn)) return true;
	return false;
}

function checkVertical(board, column, row,turn) {
	if(row < 2) return false;
	for(var i = row; i > row - 3; i--) {
		if(board[column][i] != turn) return false;
	}
	return true;
}

function checkHorizontal(board, column, row,turn) {
	var counter = 1;
	for(var i = column - 1; i >= 0; i--) {
		if(board[i][row] != turn) break;
		counter++;
	}

	for(var j = column + 1; j < 3; j++) {
		if(board[j][row] != turn) break;
		counter++;
	}
	return counter >= 3;
}

function checkLeftDiagonal(board, column, row,turn) {
	var counter = 1;
	var tmp_row = row - 1;
	var tmp_column = column - 1;

	while(tmp_row >= 0 && tmp_column >= 0) {
		if(board[tmp_column][tmp_row] == turn) {
			counter++;
			tmp_row--;
			tmp_column--;
		} else break;
	}

	row += 1;
	column += 1;

	while(row < 3 && column < 3) {
		if(board[column][row] == turn) {
			counter++;
			row++;
			column++;
		} else { break; }
	}
	return counter >= 3;
}

function checkRightDiagonal(board, column, row,turn) {
	var counter = 1;
	var tmp_row = row + 1;
	var tmp_column = column - 1;

	while(tmp_row < 3 && tmp_column >= 0) {
		if(board[tmp_column][tmp_row] == turn) {
			counter++;
			tmp_row++;
			tmp_column--;
		} else break;
	}

	row -= 1;
	column += 1;

	while(row >= 0 && column < 3) {
		if(board[column][row] == turn) {
			counter++;
			row--;
			column++;
		} else break;
	}
	return counter >= 3;
}

// End game loop functions