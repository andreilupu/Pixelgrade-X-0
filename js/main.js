var config = {
	url: "http://77.81.241.142",
	port: "8000"
}
, socketUrl = config.url+":"+config.port+'/socket.io/lib/socket.io'
, x0local = JSON.parse(localStorage.getItem( 'pixelgradeX0'));

console.log(x0local);

requirejs.config({
	paths: {
		jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min',
		font_alexa_std: 'http://use.edgefonts.net/alexa-std',
		lusitana: 'http://use.edgefonts.net/lusitana',
		socketio: socketUrl
	}
});

requirejs([ 'jquery', 'crafty', 'font_alexa_std', 'lusitana'], function() {
;(function($){
$(document).ready(function(){
	requirejs([ 'socketio', 'jquery.avgrund' , 'jquery.countdown' ], function(){

		var socket = io.connect( config.url+":"+config.port+'/pixelgradeX&0'),
			client_board = new Array(),
			clientPlayer = {id:0, host: 0, name: "", gameid: "", activeOnServer: false };

		Crafty.init(670, 580);
		Crafty.canvas.init();

		Crafty.c("Button", {
			_buttonEvent: "event",
			_buttonData: {},
			_buttonLabel: "click",
			_buttonIcon: "icon",
			init: function() {
				this.addComponent('HTML, 2D, DOM, Mouse');
				this.origin("top left");  
			},
			emit: function(event, data, label, icon) {
				this.replace('<a class="button"><i class="'+icon+'"></i> '+label+'</a>');
				this.bind("Click", function() {
					socket.emit(event, data);
				});
			},
			positionate: function(x,y,w,h) {
				this.z = 1000;
				this.x = x;
				this.y = y;
				this.w = w;
				this.h = h;
			}
		});

		Crafty.scene("world", function () { // game world
			Crafty.viewport.reload();
			$('#overlay').fadeOut(2600,function(){}); // loader
			Crafty.background("url('./media/static/Pixelgrade-X-0/css/images/main_table.png') 50% 23% no-repeat transparent");
			var notice = Crafty.e("HTML, 2D, DOM, Persist")
				.replace("<div class=\"notice\"> <i class=\"icon-info-sign\"></i> Bine ai venit ! </div>" )
				.attr({x: 0, y: 0, w:Crafty.viewport.width, h: 30})
			sidebar = Crafty.e("2D, DOM, Image") // the right sidebar
				.image("./media/static/Pixelgrade-X-0/css/images/sidebar-bg.png")
				.attr({x: 525, y: 72, w: 118, h:395});
			Crafty.e('HTML, DOM')
				.replace('<h3>Online</h3>')
				.attr({x: 525, y: 66, w: 118, h:80})
				.css({textAlign: 'center' });
			Crafty.e('HTML, DOM, Persist') // the modal trigger
				.replace('<a id="modal"></a>')
				.css({display: 'none' });
			Crafty.e("HTML, 2D, DOM")
				.replace("<h2 class='title'>Joaca <b>X & 0</b> !</h2>")
				.attr({x: 0, y: 220, w: Crafty.viewport.width/1.25, h: 80})
				.css({fontSize:"42px", fontWeight: "bold"});

			Crafty.e("HTML, 2D, DOM")
				.replace("<h3 class=\"username\">"+ x0local.name +"</h3>")
				.attr({x: 330, y: 40, w: 116, h: 40});

			Crafty.e("2D, DOM, Image") // avatar holder
				.image("./media/static/Pixelgrade-X-0/css/images/avatar-holder.png")
				.attr({x: 330, y: 90, w: 116, h: 120});
			Crafty.e("2D, DOM, Image, avatar") // avatar 
				//.image(x0local.avatar)
				.attr({x: 332, y: 92, w: 109, h: 109});

			var btn_cauta = Crafty.e("Button");
			btn_cauta.positionate(60,80,160,40);
			btn_cauta.emit('find:game', clientPlayer, 'Cauta', 'icon-arrow-right');

			// var btn_creaza = Crafty.e("Button");
			// btn_creaza.positionate(0,110,100,40);
			// btn_creaza.emit('create:game', clientPlayer, 'Creaza', 'icon-arrow-right');
		});

		// If the player wants to create a custom game
		Crafty.scene("createGame", function () {

			Crafty.e("HTML, 2D, DOM")
				.replace("<h2 class='title'>Creaza un joc !</h2>")
				.attr({x: 0, y: 60, w: Crafty.viewport.width/1.25, h: 80})
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
				.image("./media/static/Pixelgrade-X-0/css/images/board.png")
				.attr({x: 45, y: 40, w: 458, h:461}),
			status = Crafty.e("HTML, 2D, DOM")
				.replace("<p>Asteapta un adversar !</p>")
				.attr({x: 140, y: 200, w: Crafty.viewport.width, h:Crafty.viewport.height})
				.css({color: "#512210",fontSize:"22px", fontWeight: "bold"}),
			loader = Crafty.e("Image, 2D, DOM")
				.image("./media/static/Pixelgrade-X-0/css/images/ajax-loader.gif")
				.attr({x: 245, y: 270}),
			sidebar = Crafty.e("2D, DOM, Image, Persist")
				.image("./media/static/Pixelgrade-X-0/css/images/sidebar-bg.png")
				.attr({x: 525, y: 72, w: 118, h:395});

				Crafty.e("HTML, 2D, DOM, Persist")
					.replace("<h3 class=\"username\">"+ x0local.name +"</h3>")
					.attr({x: 527, y: 20, w: 116, h: 40});
				Crafty.e("2D, DOM, Image, Persist") // top avatar holder
					.image("./media/static/Pixelgrade-X-0/css/images/avatar-holder.png")
					.attr({x: 527, y: 75, w: 116, h: 120});
				Crafty.e("2D, DOM, Image, avatar, Persist") // my avatar 
					//.image(x0local.avatar)
					.attr({x: 529, y: 77, w: 109, h: 109});

				Crafty.e("2D, DOM, Image, Persist") // botom avatar holder
					.image("./media/static/Pixelgrade-X-0/css/images/avatar-holder.png")
					.attr({x: 527, y: 346, w: 116, h: 120});
				Crafty.e("2D, DOM, Image, avatar, Persist") // ???? 
					//.image(x0local.avatar)
					.attr({x: 529, y: 348, w: 109, h: 109});

			var btn_cauta = Crafty.e("Button");
			btn_cauta.positionate(60,80,160,40);
			btn_cauta.emit('distroy:game', clientPlayer, 'Inapoi', 'icon-arrow-left');
		});

		Crafty.scene("game", function () {
			var board = Crafty.e("2D, DOM, Image, Persist, board")
				.image("./media/static/Pixelgrade-X-0/css/images/board-ready.png")
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
					this.image("./media/static/Pixelgrade-X-0/css/images/0.png", "no-repeat");
					this.origin("center");
					this.css({ cursor: "crosshair", margin: "16px 25px" });
					this.unbind("Click");
					return this;
				}
			});

			Crafty.c("host", {
				init: function(){
					this.requires("Mouse, Image, Persist");
					this.image("./media/static/Pixelgrade-X-0/css/images/x.png", "no-repeat");
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
						socket.emit('user:click', {gameid: clientPlayer.gameid, host: clientPlayer.host, cellID: this.cellID } );
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
				showCloseText: 'Continua jocul',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				template: "<h3> Egalitate! <i class=\"icon-legal\"></i></h3>"+
							"<div class=\"modal-conent\" ><p>Runda fara castigator.</p></div>"
			});
			$('#modal').click();
		});

		Crafty.scene("win", function () {
			$('#modal').avgrund({
				height: 200,
				holderClass: 'custom',
				showClose: true,
				showCloseText: 'Continua jocul',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				template: "<h3> Felicitari ! <i class=\"icon-thumbs-up\"></i></h3>"+
							"<div class=\"modal-conent\" ><p>Ai castigat runda.</p></div>"
			});
			$('#modal').click();

		});

		Crafty.scene("lose", function () {
			$('#modal').avgrund({
				height: 200,
				holderClass: 'custom',
				showClose: true,
				showCloseText: 'Continua jocul',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				template: "<h3> Ne pare rau ! <i class=\"icon-thumbs-down \"></i></h3>"+
							"<div class=\"modal-conent\" ><p>Ai pierdut runda.</p></div>"
			});
			$('#modal').click();
		});

		socket
			.on('player:init', function(data){

/*				if ( x0local.name ) {
					//console.log(x0local.name );
					// $('#setNickname').hide(0); // hide the form
					// socket.emit('setLocalUser', x0local );
				}*/

				clientPlayer.id = data.id;
				Crafty.scene("world");
				socket.emit('get:users');
			})
			.on('nicknameReady', function(data){ // getting the nickname from server and create a cookie
				// we store to name locally
				var storage = {};
				storage.name = data.name;
				localStorage.setItem( 'pixelgradeX0', JSON.stringify(storage) );
				// setup our name
				clientPlayer.name = data.name;

			})
			.on('getPlayers', function(data){
				console.log(data.players);
			})
			.on('setMeHost', function(){
				clientPlayer.host = 1;
			})
			.on('create:game', function(data){
				clientPlayer.gameid = data.gameid;
				Crafty.scene("preload");
			})
			.on('start:game', function(data){
				if ( data ) { clientPlayer.gameid = data.gameid; }
				Crafty.scene("game");
			})
			.on('updateUserlist', function(data){
				console.log(data);
			})
			.on('board:rebuild', function(data){
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
										socket.emit('user:click', {gameid: clientPlayer.gameid, host: clientPlayer.host, cellID: this.cellID } );
									});
							}
							if ( (data.x == i) && (data.y ==j) ) {
								client_board[data.x][data.y].addComponent(data.component);
							}
						}
					}
				}
			})
			.on('game:over', function(data){
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
	}, function(err){ // socket is down
			Crafty.init(600, 500);
			Crafty.canvas.init();
			Crafty.background('#ebebeb');
			//score display
			Crafty.e("HTML, 2D, DOM")
				.replace(" Serverul nu este disponibil momentan !")
				.attr({x: Crafty.viewport.width/4, y: Crafty.viewport.height/2, w: Crafty.viewport.width, h:Crafty.viewport.height})
				.css({color: "#345",fontSize:"22px", fontWeight: "bold"});
	}); // require socketIo
});
})(jQuery);
}); //require jQuery and crafty
