var game_server = module.exports = { games : {}, game_count:0, players: {}, players_count:0 }
	, UUID        = require('node-uuid')
	, underscore = require('underscore')
	, mongo = require('mongoskin');

var db = mongo.db('192.168.0.101:29070/pixelgradeX0?auto_reconnect', {safe:false});

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
		round: 0
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
	return thegame;

}; //game_server.createGame

game_server.startGame = function(game) {

	game.player_client.to(game.id).emit('start:game', {gameid: game.id}); // the client doesn't know yet his gameid
	game.player_host.to(game.id).emit('start:game');

	game.active = true;
	console.log("Game started : " + game.id);
	db.collection('games').save({id:game.id , host: game.player_host.userid, client: game.player_client.userid });
}; //game_server.startGame

game_server.playerDisconnect = function(socket_userid) {

	player = this.players[socket_userid];
	gameid = player.gameid;
	userid = player.userid;
	var thegame = this.games[gameid];
	if(thegame) {

		//if the game has two players, the one is leaving
		if(thegame.player_count > 1) {
			if( userid == thegame.player_host.userid) {
				if(thegame.player_client) {
					this.findGame(thegame.player_client);
				}
			} else {
				if(thegame.player_host) {
					this.findGame(thegame.player_host);
				}
			}
		}
		delete this.games[gameid];
		console.log("Game deleted : " + gameid);
		this.game_count--;
		console.log('game removed. there are now ' + this.game_count + ' games' );
	}

	console.log("Player disconnected " + socket_userid);

	delete this.players[socket_userid];
	this.player_client--;

}; //game_server.playerDisconnect

//we are requesting to kill a game in progress.
game_server.distroyGame = function(socket_userid) {

	player = this.players[socket_userid];
	gameid = player.gameid;
	userid = player.userid;
	var thegame = this.games[gameid];

	if(thegame) {
		//if the game has two players, the one is leaving
		if(thegame.player_count > 1) {
			if( userid == thegame.player_host.userid) {
				if(thegame.player_client) {
					this.findGame(thegame.player_client);
				}
			} else {
				if(thegame.player_host) {
					this.findGame(thegame.player_host);
				}
			}
		}
		delete this.games[gameid];
		this.game_count--;
	} else {
		console.log('that game was not found!');
	}
}; //game_server.distroyGame

game_server.proccessTurn = function(gameid, host, cellID) {

	var x = cellID.slice(0,1),
		y = cellID.slice(1,2),
		component = "";

	if (host) {
		this.games[gameid].board[x][y] = 1;
		component = "host";
	} else {
		this.games[gameid].board[x][y] = 0;
		component = "client";
	}

	if ( this.games[gameid].turn ) { // no matter what we change the turn
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
			this.games[gameid].player_host.to(gameid).emit('game:over', {draw: false, winner: 1 });
			this.games[gameid].player_client.to(gameid).emit('game:over', {draw: false, winner: 0 });
			console.log("Host Winner ! " + gameid );
		} else {

			this.games[gameid].player_host.to(gameid).emit('game:over', {draw: false, winner: 0 });
			this.games[gameid].player_client.to(gameid).emit('game:over', {draw: false, winner: 1 });
			console.log("Client Winner ! " + gameid );
		}

		return;
	}

	if ( this.games[gameid].turnCount == 9 ) { // it's a draw
		console.log("Draw ! " + gameid );
		this.games[gameid].player_client.to(gameid).emit('game:over', { draw: true } );
		this.games[gameid].player_host.to(gameid).emit('game:over', { draw: true } );
	} else {
		this.games[gameid].turnCount++;
	}
}

game_server.createPlayer = function(socket){

	var player = {
		name: "",
		id: socket.userid,
		gameid: "",
		socket: socket
	}

	//Store it in the list of game
	this.players[ player.id ] = player;
	socket.emit('player:init', { id: player.id });
	console.log("Player Created ! " + player.id );
}

game_server.getPlayers = function(userid){

}

game_server.getGames = function(){

	return this.games;
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
			console.log("x" + tmp_column + " y "+ tmp_row);
			console.log(board);
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