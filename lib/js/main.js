var config = {
	url: "http://192.168.2.5",
	port: "8000"
};

var socketUrl = config.url+":"+config.port+'/socket.io/lib/socket.io';

requirejs.config({
	paths: {
		jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min',
		font_neuton: 'http://use.edgefonts.net/neuton-cursive',
		font_alexa_std: 'http://use.edgefonts.net/alexa-std',
		hobo_std: 'http://use.edgefonts.net/hobo-std',
		lusitana: 'http://use.edgefonts.net/lusitana',
		socketio: socketUrl
	}
});

requirejs([ 'jquery', 'crafty', 'font_neuton', 'font_alexa_std', 'hobo_std', 'lusitana' ], function($) {

	requirejs([ 'socketio', 'jquery.cookie', 'jquery.countdown', 'jquery.avgrund' ], function(){


		var socket = io.connect( config.url+":"+config.port+'/pixelgradeX&0'),
			client_board = new Array(),
			clientPlayer = {id:0, host: 0, name: "", gameid: "", activeOnServer: false };

		Crafty.scene("world", function () { // game world

			Crafty.init(710, 570);
			Crafty.canvas.init();
			Crafty.background("url('./lib/css/images/main_table.png') center center no-repeat transparent");
			
			var notice = Crafty.e("HTML, 2D, DOM, Persist")
				.replace("<div class=\"notice\">Bine ai venit ! </div>" )
				.attr({x: 35, y: 0, w:400})
				.css({color: "#aaaaaa", fontSize:"25px"}),
			sidebar = Crafty.e("2D, DOM, Image")
				.image("./lib/css/images/sidebar-bg.png")
				.attr({x: 535, y: 72, w: 118, h:395});

			Crafty.e('HTML, DOM')
				.replace('<h3>Online</h3>')
				.attr({x: 535, y: 66, w: 118, h:80})
				.css({textAlign: 'center' });

			Crafty.e("HTML, 2D, DOM")
				.replace("<h2 class='title'>Joaca <b>X & 0</b> !</h2>")
				.attr({x: 0, y: 60, w: Crafty.viewport.width/1.25, h: 30})
				.css({fontSize:"42px", fontWeight: "bold"});

			Crafty.e("HTML, DOM, Mouse")
				.replace('<button class="wood">Cauta</button>')
				.attr({x: 35, y: 140, w: 320, h: 60 })
				.css({fontSize:"28px", fontWeight: "bold", cursor: "pointer"})
				.bind('Click', function(){
					socket.emit('findGame', clientPlayer);
					console.log(' User : '+ ( clientPlayer.name ? clientPlayer.name : clientPlayer.id) +' looks for a game');
				});

			Crafty.e("HTML, DOM, Mouse")
				.replace('<button class="wood">Creaza</button>')
				.attr({x: 25, y: 230, w: 320, h: 60 })
				.css({fontSize:"28px", fontWeight: "bold", cursor: "pointer"})
				.bind('Click', function(){
					socket.emit('createGame', clientPlayer);
					Crafty.scene("createGame");
					console.log(' User : '+ ( clientPlayer.name ? clientPlayer.name : clientPlayer.id) +' will create a game');
				});

		});

		// If the player wants to create a custom game
		Crafty.scene("createGame", function () {

			Crafty.e("HTML, 2D, DOM")
				.replace("<h2>Create A game!</h2>")
				.attr({x: 0, y: 30, w: Crafty.viewport.width, h: 30})
				.css({fontSize:"42px", fontWeight: "bold"});

			Crafty.e("HTML, DOM, Mouse")
				.replace('<button class="wood">Inapoi</button>')
				.attr({x: 350, y: 120, w: 320, h: 60 })
				.css({fontSize:"28px", fontWeight: "bold", cursor: "pointer"})
				.bind('Click', function(){
					Crafty.scene("world");
				});
		});

		// Preload Game stage. Preparing players || count down time before start.
		Crafty.scene("preload", function () {

			var board = Crafty.e("2D, DOM, Image")
				.image("./lib/css/images/board.png")
				.attr({x: 45, y: 40, w: 458, h:461}),
			status = Crafty.e("HTML, 2D, DOM")
				.replace("<p>Asteapta un adversar !</p>")
				.attr({x: 140, y: 200, w: Crafty.viewport.width, h:Crafty.viewport.height})
				.css({color: "#512210",fontSize:"22px", fontWeight: "bold"}),
			loader = Crafty.e("Image, 2D, DOM")
				.image("./lib/css/images/ajax-loader.gif")
				.attr({x: 245, y: 270}),
			sidebar = Crafty.e("2D, DOM, Image")
				.image("./lib/css/images/sidebar-bg.png")
				.attr({x: 535, y: 72, w: 118, h:395});
			Crafty.e("HTML, DOM, Mouse")
				.replace('<button class="wood">Inapoi</button>')
				.attr({x: 0, y: 50, w: 320, h: 60 })
				.css({fontSize:"28px", fontWeight: "bold", cursor: "pointer"})
				.bind('Click', function(){
					socket.emit('distroyGame', clientPlayer);
					Crafty.scene("world");
				});

		});

		// Preload Game stage. Preparing players || count down time before start.
		Crafty.scene("game", function () {
			var board = Crafty.e("2D, DOM, Image, Persist")
				.image("./lib/css/images/board-ready.png")
				.attr({x: 45, y: 40, w: 458, h:461})
				.css({ cursor: "crosshair" });

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
					this.requires("Mouse, Image, Persist");
					this.image("./lib/css/images/0.png", "no-repeat");
					this.origin("center");
					this.css({ cursor: "crosshair", margin: "16px 25px" });
					this.unbind("Click");
					return this;
				}
			});

			Crafty.c("host", {
				init: function(){
					this.requires("Mouse, Image, Persist");
					this.image("./lib/css/images/x.png", "no-repeat");
					this.origin("center");
					this.css({ cursor: "crosshair", margin: "18px 25px" });
					this.unbind("Click");	
					return this;
				}
			});

			Crafty.c("mouseOn", {
				init: function(){
					this.requires("Mouse");
					this.w = 141;
					this.h = 141;
					this.css({cursor: "pointer"});
					this.bind("Click", function(){
						socket.emit('user-click', {gameid: clientPlayer.gameid, host: clientPlayer.host, cellID: this.cellID } );
					});	
				}
			});

			//generate client_board
			for (var i = 0; i < 3; i++) {
				client_board[i] = []; //init client_board
				for (var j = 0; j < 3; j++) {
					if ( !clientPlayer.host ) { // if we are the host we init the board with the click permision
						client_board[i][j] = Crafty.e("2D, DOM, cell")
							.attr({'cellID': i+""+j})
							.css({background: "transparent", border: "none", cursor: "wait"})
							.unbind("Click");
					} else {
						client_board[i][j] = Crafty.e("2D, DOM, cell")
							.attr({'cellID': i+""+j})
							.css({background: "transparent", border: "none"})
							.addComponent('mouseOn');
					}
				}
			}
		});

		Crafty.scene("draw", function () {

			$('#modal').avgrund({
				height: 200,
				holderClass: 'custom',
				showClose: true,
				showCloseText: 'Inchide',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				template: "<p>Egalitate !! </p>"
			});

			$('#modal').click();

			var status = Crafty.e("HTML, 2D, DOM")
				.replace("<div class='modal'>Waiting for your opponenet!</p>")
				.attr({x: 140, y: 200, w: Crafty.viewport.width, h:Crafty.viewport.height})
				.css({color: "#512210",fontSize:"22px", fontWeight: "bold"});

		});

		Crafty.scene("win", function () {

			$('#modal').avgrund({
				height: 200,
				holderClass: 'custom',
				showClose: true,
				showCloseText: 'Inchide',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				template: "<p> Ai castigat !</p>"
			});

			$('#modal').click();

			var status = Crafty.e("HTML, 2D, DOM")
				.replace("<div class='modal'>Waiting for your opponenet!</p>")
				.attr({x: 140, y: 200, w: Crafty.viewport.width, h:Crafty.viewport.height})
				.css({color: "#512210",fontSize:"22px", fontWeight: "bold"});

		});

		Crafty.scene("lose", function () {

			$('#modal').avgrund({
				height: 200,
				holderClass: 'custom',
				showClose: true,
				showCloseText: 'Inchide',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				template: "<p> Ai pierdut !</p>"
			});

			$('#modal').click();

			var status = Crafty.e("HTML, 2D, DOM")
				.replace("<div class='modal'>Waiting for your opponenet!</p>")
				.attr({x: 140, y: 200, w: Crafty.viewport.width, h:Crafty.viewport.height})
				.css({color: "#512210",fontSize:"22px", fontWeight: "bold"});

		});

		socket.on('onconnected', function(data){
			clientPlayer.id = data.id;
			Crafty.scene("world");
		});

		socket.on('setMeHost', function(){
			console.log('you are the host');
			clientPlayer.host = 1;
		});

		socket.on('createGame', function(data){

			clientPlayer.gameid = data.gameid;
			Crafty.scene("preload");

		});

		socket.on('startGame', function(data){

			if ( data ) { clientPlayer.gameid = data.gameid; }

			Crafty.scene("game");
		});

		socket.on('boardRebuild', function(data){
			for (var i = 0; i < 3; i++) {
				for (var j = 0; j < 3; j++) {
					if ( ( !client_board[i][j].has("host") ) || ( !client_board[i][j].has("client") ) ) {

						if ( !data.turn ) {
							
							client_board[i][j].unbind("Click").css({cursor: "wait"});

						} else {

							client_board[i][j]
								.requires("Mouse")
								.css({cursor: "pointer"})
								.bind("Click", function(){
									socket.emit('user-click', {gameid: clientPlayer.gameid, host: clientPlayer.host, cellID: this.cellID } );
								});
						}
	
						if ( (data.x == i) && (data.y ==j) ) {
							client_board[data.x][data.y].addComponent(data.component);
						}
					}
				}
			}
		});

		socket.on('gameOver', function(data){
			if ( data.draw ) {
				Crafty.scene("draw");
			} else {
				if ( data.winner ) {
					Crafty.scene("win");
				} else {
					Crafty.scene("lose");
				}
			}
		});

		// Get the nickname and send it to server
		$('#setNickname button').on('click', this, function(){
			socket.emit('setNickname', { name: $('#setNickname input').val() } );
		});

		// getting the nickname from server and create a cookie
		socket.on('nicknameReady', function(data){
			// we store to name locally
			var storage = {};
			storage.name = data.name;
			localStorage.setItem( 'pixelgradeX0', JSON.stringify(storage) );
			// setup our name
			clientPlayer.name = data.name;

		});
		var x0local = JSON.parse( localStorage.getItem( 'pixelgradeX0'));
		if (x0local.name) {

			$('#setNickname').hide(0);

			socket.emit('setNickname', { name:  x0local.name } );

		}

	}, function(err){ // socket is down

			Crafty.init(600, 200);
			Crafty.canvas.init();
			Crafty.background('#ebebeb');

			//score display
			Crafty.e("HTML, 2D, DOM")
				.replace(" Serverul nu este disponibil momentan !")
				.attr({x: Crafty.viewport.width/4, y: Crafty.viewport.height/2, w: Crafty.viewport.width, h:Crafty.viewport.height})
				.css({color: "#345",fontSize:"22px", fontWeight: "bold"});
	}); // require socketIo
}); //require jQuery and crafty
