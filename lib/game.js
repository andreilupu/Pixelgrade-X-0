/**
* Module dependencies.
*/

var express = require('express')
, http = require('http')
, UUID = require('node-uuid')
, path = require('path')
, app = express()
, server = http.createServer(app)
, sio = require('socket.io').listen(server)
, pixelgrade = {};

app.configure(function(){
	app.set('port', process.env.PORT || 8000 );
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
});

/** Socket.IO server */

// keeep track of all the games currently running
pixelgrade.games = function(){
	var games = new Array();

	function addGame(game_instance) {

	}

	function deleteGame(game_instance) {

	}

	return {
		addGame: addGame,
		deleteGame: deleteGame
	}
};

pixelgrade.game_core = function(game_instance){

	//Store the instance, if any
	this.instance = game_instance;
	this.board = new Array();

	//Used in collision etc.
	this.world = {
		width : 720,
		height : 480
	};

}; //game_core.constructor

pixelgrade.game_player = function( game_instance, player_instance ) {

    //Store the instance, if any
    this.instance = player_instance;
    this.game = game_instance;

    //Set up initial values for our state information
    this.state = 'not-connected';
    this.color = 'rgba(255,255,255,0.1)';
    this.id = '';

    //Our local history of inputs
    this.inputs = [];

}; //game_player.constructor

pixelgrade.game_core.prototype.check_cols = function(board){

}

sio.sockets.on('connection', function(client){
	console.log('connect');
	client.uuid = UUID();

});

/* Start server */
server.listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
