

var game_core = function(game_instance) {
	this.instance = game_instance;
	//Store a flag if we are the server .... WUT ????
	this.server = this.instance !== undefined;

	//We create a player set, passing them
	//the game that is running them, as well
	if(this.server) {

		this.players = {
			self : new game_player(this,this.instance.player_host),
			other : new game_player(this,this.instance.player_client)
		};

	} else {

		this.players = {
			self : new game_player(this),
			other : new game_player(this)
		};
	}

}

module.exports = global.game_core = game_core;
/*
    The player class

        A simple class to maintain state of a player on screen,
        as well as to draw that state when required.
*/

var game_player = function( game_instance, player_instance ) {
	//Store the instance, if any
	this.instance = player_instance;
	this.game = game_instance;

	//The 'host' of a game gets created with a player instance since
	//the server already knows who they are. If the server starts a game
	//with only a host, the other player is set up in the 'else' below
	if(player_instance) {
		this.color = "red";
	} else {
		this.color = "green";
	}
}