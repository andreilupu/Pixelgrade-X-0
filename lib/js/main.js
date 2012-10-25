var config = {
	url: "http://192.168.2.2",
	port: "8000"
};

var socketUrl = config.url+":"+config.port+'/socket.io/lib/socket.io';

requirejs.config({
	paths: {
		jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min',
		socketio: socketUrl
	}
});

requirejs([ 'jquery', 'crafty' ], function($) {

		requirejs([ 'socketio' ], function(){

			var socket = io.connect( config.url+":"+config.port),
				client_board = new Array(),
				me = {id:0, type: "" };

				// Create stages

				// First stage is the main world. Here we have lists with users, games and a findGame button.

				Crafty.scene("world", function () {

					Crafty.init(600, 500);
					Crafty.canvas.init();
					Crafty.background('#fff');

					var msg = Crafty.e("2D, DOM, Text")
							.text("Welcome!")
							.attr({x: Crafty.viewport.width/4, y: Crafty.viewport.height/4, w: Crafty.viewport.width, h:Crafty.viewport.height})
							.css({color: "#345",fontSize:"22px", fontWeight: "bold"}),
						findGame = Crafty.e("2D, DOM, Text, Mouse")
							.text('Find A Game')
							.attr({x: Crafty.viewport.width/4, y: Crafty.viewport.height/2, w: 160, h:30 })
							.css({color: "#345",fontSize:"22px", fontWeight: "bold", cursor: "pointer"});

						findGame.bind('Click', function(){
								socket.emit('findGame', me.id);
								console.log('click??????');
							});
				});

				// Preload Game stage. Preparing players || count down time before start.

				Crafty.scene("game", function () {
					
					Crafty.init(600, 500);
					Crafty.canvas.init();
					Crafty.background('#fff');

					var msg = Crafty.e("2D, DOM, Text")
						.text("Start!")
						.attr({x: Crafty.viewport.width/4, y: Crafty.viewport.height/4, w: Crafty.viewport.width, h:Crafty.viewport.height})
						.css({color: "#345",fontSize:"22px", fontWeight: "bold"});
				});

				// Game || maintain score.

				// Game Over || Result || Update score.

			socket.on('onconnected', function(data){
				// get my id

				me.id = data.id;

				Crafty.scene("world");

				// Get data from server (users & games)

				// First Stage load

			});

		}, function(err){ // socket is down

				Crafty.init(600, 200);
				Crafty.canvas.init();
				Crafty.background('#ebebeb');

				//score display
				var msg = Crafty.e("2D, DOM, Text")
					.text("The server is currently down !")
					.attr({x: Crafty.viewport.width/4, y: Crafty.viewport.height/2, w: Crafty.viewport.width, h:Crafty.viewport.height})
					.css({color: "#345",fontSize:"22px", fontWeight: "bold"});

		}); // require socketIo


}); //require jQuery and crafty
