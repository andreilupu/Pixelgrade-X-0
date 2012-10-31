var game_server = module.exports = { games : {}, game_count:0, players: {}, players_count:0 }
	, UUID        = require('node-uuid');

// some game core functions
//require('./game.core.js');

game_server.createGame = function(player_socket) {

	var thegame = {
		id : UUID(),                //generate a new id for the game
		player_host:player_socket,         //so we know who initiated the game
		player_client:null,         //nobody else joined yet, since its new
		player_count:1,				//for simple checking of state
		turn: 1,			   		// the frekin turn
		board: new Array(),
		turnCount: 1
	};
	
	//Store it in the list of game
	this.games[ thegame.id ] = thegame;

	//Keep track
	this.game_count++;
	
	//thegame.player_host.gameid =  thegame.id;
	console.log(player_socket);
	this.players[player_socket.userid].gameid = thegame.id;

	thegame.player_host.join(thegame.id);

	thegame.player_host.to(thegame.id).emit('createGame', { gameid: thegame.id} );
	
	thegame.player_host.emit('setMeHost');

	for (var i = 0; i < 3; i++) {
		thegame.board[i] = []; //init board
		for (var j = 0; j < 3; j++) {
			thegame.board[i][j]  = -1 ;
		}
	}

	//return it
	return thegame;

}; //game_server.createGame

//we are requesting to kill a game in progress.
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
	delete this.players[socket_userid];
	this.game_count--;
	this.player_client--;
	console.log('game removed. there are now ' + this.game_count + ' games' );
	}

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
	delete this.players[socket_userid];

	console.log('game removed. there are now ' + this.game_count + ' games' );

	} else {
		console.log('that game was not found!');
	}

}; //game_server.distroyGame

game_server.startGame = function(game) {

	game.player_client.to(game.id).emit('startGame', {gameid: game.id}); // the client doesn't know yet his gameid
	game.player_host.to(game.id).emit('startGame');

	game.active = true;

}; //game_server.startGame

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

	} else { //if there are any games at all
		this.createGame(player_socket); //no games? create one!
	}

}; //game_server.findGame

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

//console.log(checkFour(this.games[gameid].board, x, y,this.games[gameid].turn));

	if ( checkFour(this.games[gameid].board, x, y,this.games[gameid].turn) ) {
		var winner = "";
		console.log('win');
		if ( host ){
			winner = "host";
		} else {
			winner = "client";
		}

		this.games[gameid].player_client.to(gameid).emit('gameOver', {draw: false, winner: winner });
		this.games[gameid].player_host.to(gameid).emit('gameOver', {draw: false, winner: winner });

		return;
	}

	if ( this.games[gameid].turnCount == 9 ) { // it's a draw
		this.games[gameid].player_client.to(gameid).emit('gameOver', { draw: true } );
		this.games[gameid].player_host.to(gameid).emit('gameOver', { draw: true } );
	} else {
		this.games[gameid].turnCount++;
	}

	if ( this.games[gameid].turn ) { // no matter what we change the turn
		this.games[gameid].turn = 0;
		this.games[gameid].player_client.to(gameid).emit('boardRebuild', { x: x, y: y, component: component, turn: 1, turnCount: this.games[gameid].turnCount } );
		this.games[gameid].player_host.to(gameid).emit('boardRebuild', { x: x, y: y, component: component, turn: 0, turnCount: this.games[gameid].turnCount } );
	} else {
		this.games[gameid].turn = 1;
		this.games[gameid].player_client.to(gameid).emit('boardRebuild', { x: x, y: y, component: component, turn: 0, turnCount: this.games[gameid].turnCount } );
		this.games[gameid].player_host.to(gameid).emit('boardRebuild', { x: x, y: y, component: component, turn: 1, turnCount: this.games[gameid].turnCount } );
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

	socket.emit('onconnected', { id: player.id });
}

game_server.getPlayers = function(){

	//console.log(this.players);

	return this.players;
}

game_server.getGames = function(){
	return this.games;
}


function checkFour(board, column, row, turn) {
	//console.log(board);
	if(checkVertical(board,column, row, turn)) return true;
	// if(checkHorizontal(board,column, row, turn)) return true;
	// if(checkLeftDiagonal(board,column, row, turn)) return true;
	// if(checkRightDiagonal(board,column, row, turn)) return true;
	return false;
}

function checkVertical(board,column, row, turn) {

	console.log('Board : '+board);
	console.log('column : '+column);
	console.log('row : '+row);
	console.log('turn : '+turn);
	console.log('board[x][y] : '+board[column][row]);

	if(row < 3) return false;
	for(var i = row; i > row - 4; i--) {
		if(board[column][i] != turn) return false;
	}
	return true;
}

function checkHorizontal(board,column, row, turn) {
	var counter = 1;
	for(var i = column - 1; i >= 0; i--) {
		if(board[i][row] != turn) break;
		counter++;
	}

	for(var j = column + 1; j < 7; j++) {
		if(board[j][row] != turn) break;
		counter++;
	}
	return counter >= 4;
}

function checkLeftDiagonal(board,column, row, turn) {
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

	while(row < 6 && column < 7) {
		if(board[column][row] == turn) {
			counter++;
			row++;
			column++;
		} else { break; }
	}
	return counter >= 4;
}

function checkRightDiagonal(board,column, row, turn) {
	var counter = 1;
	var tmp_row = row + 1;
	var tmp_column = column - 1;

	while(tmp_row < 6 && tmp_column >= 0) {
		if(board[tmp_column][tmp_row] == turn) {
			counter++;
			tmp_row++;
			tmp_column--;
		} else break;
	}

	row -= 1;
	column += 1;

	while(row >= 0 && column < 7) {
		if(board[column][row] == turn) {
			counter++;
			row--;
			column++;
		} else break;
	}
	return counter >= 4;
}