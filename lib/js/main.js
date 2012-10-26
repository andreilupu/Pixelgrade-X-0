var config = {
	url: "http://192.168.0.101",
	port: "8000"
};

var socketUrl = config.url+":"+config.port+'/socket.io/lib/socket.io';

requirejs.config({
	paths: {
		jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min',
		font_neuton: 'http://use.edgefonts.net/neuton-cursive',
		font_alexa_std: 'http://use.edgefonts.net/alexa-std',
		hobo_std: 'http://use.edgefonts.net/hobo-std',
		socketio: socketUrl
	}
});

requirejs([ 'jquery', 'crafty', 'font_neuton', 'font_alexa_std', 'hobo_std' ], function($) {

		requirejs([ 'socketio', 'jquery.cookie' ], function(){

			var socket = io.connect( config.url+":"+config.port),
				client_board = new Array(),
				me = {id:0, host: 0, name: "", gameid: "" };

				// Create stages

				// First stage is the main world. Here we have lists with users, games and a findGame button.

				Crafty.scene("world", function () {

					Crafty.init(710, 550);
					Crafty.canvas.init();
					Crafty.background("url('./lib/css/images/main_table.png') center center no-repeat transparent");

					Crafty.e("HTML, 2D, DOM")
						.replace("<h2>Welcome to <b>X & 0</b> !</h2>")
						.attr({x: 0, y: 30, w: Crafty.viewport.width, h: 30})
						.css({fontSize:"42px", fontWeight: "bold"});

					Crafty.e("HTML, DOM, Mouse")
						.replace('<button class="wood">Find A Game</button>')
						.attr({x: 35, y: 120, w: 320, h: 60 })
						.css({fontSize:"28px", fontWeight: "bold", cursor: "pointer"})
						.bind('Click', function(){
							socket.emit('findGame', me);
							console.log(' User : '+ ( me.name ? me.name : me.id) +' looks for a game');
						});

					Crafty.e("HTML, DOM, Mouse")
						.replace('<button class="wood">Create Game</button>')
						.attr({x: 350, y: 120, w: 320, h: 60 })
						.css({fontSize:"28px", fontWeight: "bold", cursor: "pointer"})
						.bind('Click', function(){
							socket.emit('createGame', me);
							Crafty.scene("createGame");
							console.log(' User : '+ ( me.name ? me.name : me.id) +' will create a game');
						});

				});

				// If the player wants to create a custom game
				Crafty.scene("createGame", function () {

					Crafty.e("HTML, 2D, DOM")
						.replace("<h2>Create A game!</h2>")
						.attr({x: 0, y: 30, w: Crafty.viewport.width, h: 30})
						.css({fontSize:"42px", fontWeight: "bold"});

					Crafty.e("HTML, DOM, Mouse")
						.replace('<button class="wood">Find A Game</button>')
						.attr({x: 35, y: 120, w: 320, h: 60 })
						.css({fontSize:"28px", fontWeight: "bold", cursor: "pointer"})
						.bind('Click', function(){
							socket.emit('findGame', me);
							console.log(' User : '+ ( me.name ? me.name : me.id) +' looks for a game');
						});

					Crafty.e("HTML, DOM, Mouse")
						.replace('<button class="wood">Cancel</button>')
						.attr({x: 350, y: 120, w: 320, h: 60 })
						.css({fontSize:"28px", fontWeight: "bold", cursor: "pointer"})
						.bind('Click', function(){
							socket.emit('createGame', me);
							Crafty.scene("world");
							console.log(' User : '+ ( me.name ? me.name : me.id) +' will create a game');
						});
				});

				// Preload Game stage. Preparing players || count down time before start.
				Crafty.scene("preload", function () {

					var board = Crafty.e("2D, DOM, Image")
						.image("./lib/css/images/board.png")
						.attr({x: 45, y: 40, w: 458, h:461});

					var sidebar = Crafty.e("2D, DOM, Image")
						.image("./lib/css/images/sidebar-bg.png")
						.attr({x: 535, y: 72, w: 458, h:461});

					var status = Crafty.e("HTML, 2D, DOM")
						.replace("<p>Waiting for your opponenet!</p>")
						.attr({x: 140, y: 200, w: Crafty.viewport.width, h:Crafty.viewport.height})
						.css({color: "#512210",fontSize:"22px", fontWeight: "bold"});

					var loader = Crafty.e("Image, 2D, DOM")
						.image("./lib/css/images/ajax-loader.gif")
						.attr({x: 245, y: 270});

				});

				// Preload Game stage. Preparing players || count down time before start.
				Crafty.scene("game", function () {

					var board = Crafty.e("2D, DOM, Image")
						.image("./lib/css/images/board-ready.png")
						.attr({x: 45, y: 40, w: 458, h:461});

					var sidebar = Crafty.e("2D, DOM, Image")
						.image("./lib/css/images/sidebar-bg.png")
						.attr({x: 535, y: 72, w: 458, h:461});

					Crafty.c("cell", {
						init: function(){
							this.x = i * 141 + 60;
							this.y = j * 141 + 52;
							this.z = 9999;
							this.w = 140;
							this.h = 140;
							return this;
						}
					});

					Crafty.c("client", {
						init: function(){
							this.requires("Mouse, Image");
							this.image("./lib/css/images/0.png");
							this.unbind("Click");	
							return this;
						}
					});

					Crafty.c("host", {
						init: function(){
							this.requires("Mouse, Image");
							this.image("./lib/css/images/x.png");
							this.unbind("Click");	
							return this;
						}
					});

					Crafty.c("mouseOn", {
						init: function(){
							this.requires("Mouse");
							this.css({cursor: "pointer"});
							this.bind("Click", function(){
								socket.emit('user-click', {host: me.host, cellID: this.cellID } );
							});	
						}
					});

					if ( !me.host ) {

						//generate client_board
						for (var i = 0; i < 3; i++) {
							client_board[i] = []; //init client_board
							for (var j = 0; j < 3; j++) {
								client_board[i][j] = Crafty.e("HTML, 2D, DOM, cell")
									.attr({'cellID': i+""+j})
									.css({background: "transparent", border: "none"})
									.unbind("Click");
							}
						}
						
					} else {

						//generate client_board
						for (var i = 0; i < 3; i++) {
							client_board[i] = []; //init client_board
							for (var j = 0; j < 3; j++) {
								client_board[i][j] = Crafty.e("HTML, 2D, DOM, cell")
									.attr({'cellID': i+""+j})
									.css({background: "transparent", border: "none"})
									.addComponent('mouseOn');
							}
						}
						
					}

				});

			socket.on('onconnected', function(data){

				me.id = data.id;
				Crafty.scene("world");

			});

			socket.on('setHost', function(){
				console.log('you are the host');
				me.host = 1;
			});

			socket.on('createGame', function(data){

				me.gameid = data.gameid;
				
				// Create a socket room onl for this game.

				socket.join(data.gameid); 

				Crafty.scene("preload");

			});

			socket.on('startGame', function(data){
				
				Crafty.scene("game");

			});

			// Get the nickname and send it to server
			$('#setNickname button').on('click', this, function(){
				socket.emit('setNickname', { name: $('#setNickname input').val() } );
			});

			// getting the nickname from server and create a cookie
			socket.on('nicknameReady', function(data){

				$.cookie('Nickname', data.name, { expires: 1 });
				me.name = data.name;

				if ( myName ) {
					myName.replace("<p>My name is : " + data.name + "</p>" );

				} else {
					var myName = Crafty.e("HTML, 2D, DOM, Persist")
						.replace("<p>My name is : " + data.name + "</p>" )
						.attr({x: 20, y: -20, w:200})
						.css({color: "#aaaaaa", fontSize:"20px"});
				}
			});

			// if we already have a cookie we inform the server 
			if ( $.cookie('Nickname') ) {
				$('#setNickname').hide(0);
				socket.emit('setNickname', { name:  $.cookie('Nickname') } );
			}

		}, function(err){ // socket is down

				Crafty.init(600, 200);
				Crafty.canvas.init();
				Crafty.background('#ebebeb');

				//score display
				Crafty.e("HTML, 2D, DOM")
					.replace("The server is currently down !")
					.attr({x: Crafty.viewport.width/4, y: Crafty.viewport.height/2, w: Crafty.viewport.width, h:Crafty.viewport.height})
					.css({color: "#345",fontSize:"22px", fontWeight: "bold"});

		}); // require socketIo


}); //require jQuery and crafty
