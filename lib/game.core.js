
game_core = module.exports =  function(game_instance) {

	this.instance = game_instance;
	
}

game_player = module.exports =  function(player_instance) {

	this.instance = player_instance;

	this.game = game_instance;

	//The 'host' of a game gets created with a player instance since
	//the server already knows who they are. If the server starts a game
	//with only a host, the other player is set up in the 'else' below
	// if(player_instance) {
	// 	this.color = "red";
	// } else {
	// 	this.color = "green";
	// }

}