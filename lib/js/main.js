requirejs.config({
    paths: {
        jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min',
        socketio: 'http://192.168.0.101:8000/socket.io/lib/socket.io'
    },
    baseUrl: 'lib/js',
});
// Start the main app logic.
requirejs([ 'jquery' ], function($) {
	requirejs([ 'socketio', 'keyboard', 'crafty' ], function(){
	
		var socket = io.connect("http://192.168.0.101:8000"),
			client_board = new Array(),
			me = user;
			

		// Starting the game core

		Crafty.scene("preload", function () {

			Crafty.init(600, 500);
			Crafty.canvas.init();
			Crafty.background('#aaa');

			var first_user = Crafty.e("HTML, user, first_user, Persist")
					.attr({ x: 50, y: 10, w: 210, h:40})
					.replace("<span class=\"label\">User 1: </span>"),
				second_user =  Crafty.e("HTML, user, second_user, Persist")
					.attr({ x: 340, y: 10, w: 210, h:40})
					.replace("<span class=\"label\">User 2: </span>");

			
			socket.emit('user-init', {user: user});
			socket.on('user-ready', function(users){

				first_user.replace('<span class=\"label\">User 1: </span><span class="user_name">'+users.userlist.first_user+'</span>');
				second_user.replace('<span class=\"label\">User 2: </span><span class="user_name">'+users.userlist.second_user+'</span>');

			});
		});

		Crafty.scene("game", function () {

			var turn = 0,
				EMPTY = -1,
				GameTitle = Crafty.e("HTML")
								.attr({ x: 280, y: 70, w: 210, h:40})
								.replace("<h2 class=\"label\">Start! </h2>");

			Crafty.c("cell", {
				init: function(){
					this.x = i * 64;
					this.y = j * 64 + 100;
					this.z = 9999;
					this.w = 64;
					this.h = 64;
					this.requires("Mouse");
					this.bind("Click", function(){

						if ( turn % 2 == 0  ) {
							this.css({ "background": "red" });
						} else {
							this.css({ "background": "green" });
						}

						socket.emit('user-click', {user: me, cellID: this.cellID} );
						
					});
					
					return this;
				},
				display: function(color){

					this.css({ "background":color });
					
					return this;
				},
			})

			//generate client_board
			for (var i = 0; i < 3; i++) {
				client_board[i] = []; //init client_board
				for (var j = 0; j < 3; j++) {
					client_board[i][j] = Crafty.e("HTML, cell")
						.attr({'cellID': i+""+j})
						.display("#"+ i*3 + j*3 + "a");
				}
			}

			socket.on('board-rebuild', function(data) {
				console.log("User : "+ data.by + " clicked on : "+ data.on );
			});
		});

		Crafty.scene("win", function() {});

		socket.on('start-connection', function(user){

			Crafty.scene("preload"); //start the game
			
		});
	
		socket.on('start-game', function(){
			
			console.log('game started');
			socket.emit('game-init');
			socket.on('board-ready', function(board){

				client_board = board ;

				Crafty.scene("game"); //start the game

			});
	
		});

		socket.on('show-winner', function(){

			Crafty.scene("win"); // display the winner

		});


	}); // require
}); //require


