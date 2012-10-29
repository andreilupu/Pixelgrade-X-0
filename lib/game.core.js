
game_core = module.exports =  function(game) {

	this.game = game;

	console.log( this.game.player_host );
	
}

game_player = module.exports =  function(socket) {

	this.instance = socket.userid;
	//this.socket = socket;

	players = game_server.getPlayers();
	games = game_server.getGames();
	console.log(games);
	console.log('and');
	console.log(players);

	socket.emit('onconnected', { id:this.instance, games:games });

	// game_server.getGames();

}