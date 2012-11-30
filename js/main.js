var config = {
	url: "http://192.168.0.101",
	port: "8000"
}

var socketUrl = config.url+":"+config.port+'/socket.io/lib/socket.io';

requirejs.config({
	shim: {
		'jquery.avgrund': {
            deps: ['jquery'],
            exports: 'avgrund'
		},
		'jquery.countdown': {
            deps: ['jquery'],
            exports: 'countdown'
		},
		'crafty':{
            deps: ['jquery.avgrund'],
            exports: 'crafty'
		},
		'socketio':{
            deps: ['jquery.countdown' ],
            exports: 'socketio'
		},
	},
	paths: {
		jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min',
		lusitana: 'http://use.edgefonts.net/lusitana',
		socketio: socketUrl
	}
});


requirejs(['jquery', 'jquery.countdown', 'crafty', 'lusitana', 'socketio', 'jquery.avgrund' ], function($) {
	$(document).ready(function(){

		var socket = io.connect( config.url+":"+config.port+'/pixelgradeX&0'),
			client_board = new Array(),
			x0local = JSON.parse(localStorage.getItem( 'pixelgradeX0'))
			me = { id:0, host: 0, name: "", gameid: "", score: {host: 0, client: 0} };

		Crafty.init(690, 580);
		Crafty.canvas.init();
		Crafty.audio.add("Bg", ["./media/static/Pixelgrade-X-0/js/audio/bg.wav", "./media/static/Pixelgrade-X-0/js/audio/bg.mp3"]);
		Crafty.sprite(120, "./media/static/Pixelgrade-X-0/css/images/sprite120.png", {
			avatarbg: [0, 0],
			x: [0, 1],
			zero: [0, 2]
		});

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
					$('#overlay').fadeIn(10,function(){}); // put the loader
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

		if (x0local.sound) {
			Crafty.audio.unmute();
		} else {
			Crafty.audio.mute();
		}

		Crafty.background("url('./media/static/Pixelgrade-X-0/css/images/main_table.png') 80% 50% no-repeat transparent");
		Crafty.audio.play("Bg", -1);

		Crafty.e('HTML, DOM, modalTriggerContainer') // the modal trigger
			.replace('<a id="modal"></a>')
			.css({display: 'none' });
		$('#modal').avgrund({
				height: 200,
				holderClass: 'custom',
				showClose: true,
				showCloseText: 'Continua jocul',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				onUnload: function(){
					socket.emit('start:round', me );
				},
				template: "<h3> Egalitate! <i class=\"icon-legal\"></i></h3>"+
							"<div class=\"modal-conent\" >"+
								"<span class=\"counter draw counter-analog\" data-format=\"9\" data-direction=\"down\">0:10</span>"+
								"<p>Runda fara castigator.</p>"+
							"</div>"
			});

		Crafty.scene("world", function () { // game world
			Crafty.viewport.reload(); // somehow the view gets fked so i need a reset
			$('#overlay').fadeOut(600,function(){}); // loader
			var notice = Crafty.e("HTML, 2D, DOM")
				.replace("<div class=\"notice\"> <i class=\"icon-info-sign\"></i> Bine ai venit ! </div>" )
				.attr({x: 0, y: 10, w:Crafty.viewport.width, h: 30});
			// var sidebar = Crafty.e("2D, Canvas, DOM, Image, sidebar") // the right sidebar
			// 	.image("./media/static/Pixelgrade-X-0/css/images/sidebar-bg.png")
			// 	.attr({x: 525, y: 72, w: 118, h:395});

			// Crafty.e('HTML, DOM')
			// 	.replace('<h3>Online</h3>')
			// 	.attr({x: 525, y: 75, w: 118, h:80})
			// 	.css({textAlign: 'center' });
			setTimeout(function(){
				notice.replace("<div class=\"sound-notice\"> <i class=\"icon-arrow-left\"> </i> Aici poti controla sunetul ! </div>");
			},7000);

			// Sound buttons
			// mute btn
			Crafty.e("HTML, 2D, DOM, Persist, Mouse")
				.replace("<div class=\"sound-btn\"> <i class=\"icon-music\"></i></div>" )
				.attr({x: 50, y: 10, z:10, w:20, h: 20})
				.bind('Click', function(){
					Crafty.audio.toggleMute();
					if ( x0local.sound ) {
						x0local.sound = 0;
						localStorage.setItem( 'pixelgradeX0', JSON.stringify( x0local ) );
					} else {
						x0local.sound = 1;
						localStorage.setItem( 'pixelgradeX0', JSON.stringify( x0local ) );
					}
					notice.replace("<div class=\"notice\"> <i class=\"icon-info-sign\"></i> Pentru a juca apasa butonul \"Joaca X&0\" ! </div>" );
				});
			// volume+
			Crafty.e("HTML, 2D, DOM, Persist, Mouse")
				.replace("<div class=\"sound-btn\"> <i class=\"icon-plus\"></i></div>" )
				.attr({x: 30, y: 10, z:10, w:20, h: 20})
				.bind('Click', function(){
					if ( (x0local.volume < 1) && (x0local.volume >= 0) ) {
						x0local.volume = x0local.volume + 0.1 ;
						x0local.volume = parseFloat( x0local.volume.toFixed(1) );
						changeVolume(x0local.volume);
						localStorage.setItem( 'pixelgradeX0', JSON.stringify( x0local ) );
						// i need a relooad
					}
				});
			// volume-
			Crafty.e("HTML, 2D, DOM, Persist, Mouse")
				.replace("<div class=\"sound-btn\"> <i class=\"icon-minus\"></i></div>" )
				.attr({x: 10, y: 10, z:10, w:20, h: 20})
				.bind('Click', function(){
					if ( (x0local.volume <= 1) && (x0local.volume >= 0.1) ) {
						x0local.volume = x0local.volume - 0.1 ;
						x0local.volume = parseFloat( x0local.volume.toFixed(1) );
						changeVolume(x0local.volume);
						localStorage.setItem( 'pixelgradeX0', JSON.stringify( x0local ) );
					}
				});

			Crafty.e("HTML, 2D, DOM")
				.replace("<h3 class=\"username\">"+ x0local.name +"</h3>")
				.attr({x: 330, y: 80, w: 116, h: 40});

			Crafty.e("2D, DOM, avatarbg") // avatar holder
				.attr({x: 330, y: 120, w: 120, h: 120});
			Crafty.e("2D, DOM, Image, avatar") // avatar
				.image(x0local.avatar)
				.attr({x: 335, y: 122, w:110, h:110});

			var btn_cauta = Crafty.e("Button");
			btn_cauta.positionate(60,110,160,40);
			btn_cauta.emit('find:game', me, 'Joaca <b>X & 0</b>', 'icon-arrow-right');

			// var btn_creaza = Crafty.e("Button");
			// btn_creaza.positionate(0,110,100,40);
			// btn_creaza.emit('create:game', me, 'Creaza', 'icon-arrow-right');

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

		// Preload Game stage. Preparing players
		Crafty.scene("preload", function () {
			$('#overlay').fadeOut(600,function(){}); // put the loader
			var board = Crafty.e("2D, DOM, Image")
				.image("./media/static/Pixelgrade-X-0/css/images/board.png")
				.attr({x: 45, y: 60, w: 458, h:461}),
			status = Crafty.e("HTML, 2D, DOM")
				.replace("<p>Asteapta un adversar !</p>")
				.attr({x: 170, y: 270, w:230, h:40})
				.css({color: "#512210",fontSize:"22px", fontWeight: "bold"}),
			loader = Crafty.e("Image, 2D, DOM")
				.image("./media/static/Pixelgrade-X-0/css/images/ajax-loader.gif")
				.attr({x: 245, y: 300, w:230, h:40}),
			sidebar = Crafty.e("2D, DOM, Image")
				.image("./media/static/Pixelgrade-X-0/css/images/sidebar-bg.png")
				.attr({x: 525, y: 92, w: 118, h:395});
			Crafty.e("HTML, 2D, DOM")
				.replace("<h3 class=\"username\">"+ x0local.name +"</h3>")
				.attr({x: 527, y: 50, w: 116, h: 40});
			Crafty.e("2D, DOM, avatarbg") // top avatar holder
				.attr({x: 524, y: 95, z:5, w: 116, h: 120});
			Crafty.e("2D, DOM, Image, avatar") // my avatar 
				.image(x0local.avatar)
				.attr({x: 529, y: 97, z:10, w: 109, h: 109});
			Crafty.e("2D, DOM, avatarbg") // botom avatar holder
				.attr({x: 524, y: 366, z:5, w: 116, h: 120});
			var btn_inapoi = Crafty.e("Button");
			btn_inapoi.positionate(60,110,160,40);
			btn_inapoi.emit('distroy:game', me, 'Inapoi', 'icon-arrow-left');
		});

		Crafty.scene("game", function () {
			$('#overlay').fadeOut(600,function(){});
			var board = Crafty.e("2D, DOM, Image, board, Persist")
				.image("./media/static/Pixelgrade-X-0/css/images/board-ready.png")
				.attr({x: 45, y: 60, w: 458, h:461})
				.css({ cursor: "crosshair" }),
			sidebar = Crafty.e("2D, DOM, Image, Persist")
				.image("./media/static/Pixelgrade-X-0/css/images/sidebar-bg.png")
				.attr({x: 525, y: 92, w: 118, h:395});
			Crafty.e("HTML, 2D, DOM, Persist")
				.replace("<h3 class=\"username\">"+ x0local.name +"</h3>")
				.attr({x: 527, y: 50, w: 116, h: 40});
			Crafty.e("2D, DOM, avatarbg, Persist") // top avatar holder
				.attr({x: 524, y: 95, z:5, w: 116, h: 120});

			Crafty.e("2D, DOM, Image, avatar, Persist") // my avatar 
				.image(x0local.avatar)
				.attr({x: 529, y: 97, z:10, w: 109, h: 109});

			Crafty.e("HTML, 2D, DOM") // scores
				.replace("<span class=\"host score\">0</span>")
				.attr({x: 570, y: 220, w: 30, h: 60});
			Crafty.e("HTML, 2D, DOM")
				.replace("<span class=\"client score\">0</span>")
				.attr({x: 570, y: 290, w: 30, h: 60});

			Crafty.e("2D, DOM, avatarbg, Persist") // botom avatar holder
				.attr({x: 524, y: 366, z:5, w: 116, h: 120});

			Crafty.c("cell", {
				init: function(){
					this.x = i * 141 + 60;
					this.y = j * 141 + 82;
					this.z = 9999;
					this.w = 140;
					this.h = 140;
					return this;
				}
			});

			Crafty.c("client", {
				init: function(){
					this.requires("Mouse, Image");
					this.image("./media/static/Pixelgrade-X-0/css/images/0.png", "no-repeat");
					this.origin("center");
					this.css({ cursor: "crosshair", margin: "16px 25px" });
					this.unbind("Click");
					return this;
				}
			});

			Crafty.c("host", {
				init: function(){
					this.requires("Mouse, Image");
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
						socket.emit('user:click', {gameid: me.gameid, host: me.host, cellID: this.cellID } );
					});	
				}
			});

			//generate client_board
			for (var i = 0; i < 3; i++) {
				client_board[i] = []; //init client_board
				for (var j = 0; j < 3; j++) {
					if ( !me.host ) { // if we are the host we init the board with the click permision
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

		Crafty.scene("round:start", function () {

			Crafty.e("HTML, 2D, DOM") // scores
				.replace("<span class=\"host score\">"+me.score.host+"</span>")
				.attr({x: 570, y: 220, w: 30, h: 60});
			Crafty.e("HTML, 2D, DOM")
				.replace("<span class=\"client score\">"+me.score.client+"</span>")
				.attr({x: 570, y: 290, w: 30, h: 60});

			Crafty.c("cell", {
				init: function(){
					this.x = i * 141 + 60;
					this.y = j * 141 + 82;
					this.z = 9999;
					this.w = 140;
					this.h = 140;
					return this;
				}
			});

			Crafty.c("client", {
				init: function(){
					this.requires("Mouse, Image");
					this.image("./media/static/Pixelgrade-X-0/css/images/0.png", "no-repeat");
					this.origin("center");
					this.css({ cursor: "crosshair", margin: "16px 25px" });
					this.unbind("Click");
					return this;
				}
			});

			Crafty.c("host", {
				init: function(){
					this.requires("Mouse, Image");
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
						socket.emit('user:click', {gameid: me.gameid, host: me.host, cellID: this.cellID } );
					});	
				}
			});

			//generate client_board
			for (var i = 0; i < 3; i++) {
				client_board[i] = []; //init client_board
				for (var j = 0; j < 3; j++) {
					if ( !me.host ) { // if we are the host we init the board with the click permision
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

		Crafty.scene("round:draw", function () {
			Crafty.e('HTML, DOM, modalTriggerContainer') // the modal trigger
				.replace('<a id="modal"></a>')
				.css({display: 'none' });
			console.log('draw');
			$('#modal').avgrund({
				height: 200,
				holderClass: '#cr-stage',
				showClose: true,
				showCloseText: 'Continua jocul',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				onUnload: function(){
					console.log('draw unload');
					socket.emit('start:round', me );
					Crafty.viewport.reset();
				},
				template: "<h3> Egalitate! <i class=\"icon-legal\"></i></h3>"+
							"<div class=\"modal-conent\" >"+
								"<span class=\"counter draw counter-analog\" data-format=\"9\" data-direction=\"down\">0:10</span>"+
								"<p>Runda fara castigator.</p>"+
							"</div>"
			});
			console.log('try a click on close the draw ');
			$('#modal').click();
			$(".counter").counter({});
			$('.counter').on('counterStop', function() {
				$('.avgrund-close').click();
			});
		});

		Crafty.scene("round:win", function () {
			Crafty.e('HTML, DOM, modalTriggerContainer') // the modal trigger
				.replace('<a id="modal"></a>')
				.css({display: 'none' });
			console.log('win');
			$('#modal').avgrund({
				height: 200,
				holderClass: '#cr-stage',
				showClose: true,
				showCloseText: 'Continua jocul',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				onUnload: function(){
					socket.emit('start:round', me );
				},
				template: "<h3> Felicitari ! <i class=\"icon-thumbs-up\"></i></h3>"+
							"<div class=\"modal-conent\" >"+
								"<span class=\"counter win counter-analog\" data-format=\"9\" data-direction=\"down\">0:10</span>"+
								"<p>Ai castigat runda.</p>"+
							"</div>"
			});
			$('#modal').click();
			$(".counter").counter({});
			$('.counter').on('counterStop', function() {
				$('.avgrund-close').click();
			});

		});

		Crafty.scene("round:lose", function () {
			Crafty.e('HTML, DOM, modalTriggerContainer') // the modal trigger
				.replace('<a id="modal"></a>')
				.css({display: 'none' });
			console.log('lose');
			$('#modal').avgrund({
				height: 200,
				holderClass: '#cr-stage',
				showClose: true,
				showCloseText: 'Continua jocul',
				enableStackAnimation: true,
				onBlurContainer: '#cr-stage',
				onUnload: function(){
					socket.emit('start:round', me );
				},
				template: "<h3> Ne pare rau ! <i class=\"icon-thumbs-down \"></i></h3>"+
							"<div class=\"modal-conent\" >"+
								"<span class=\"counter lose counter-analog\" data-format=\"9\" data-direction=\"down\">0:10</span>"+
								"<p>Ai pierdut runda.</p>"+
							"</div>"
			});
			$('#modal').click();
			$(".counter").counter({});
			$('.counter').on('counterStop', function() {
				$('.avgrund-close').click();
			});
		});

		socket
			.on('player:init', function(data){
				me.id = data.id;
				Crafty.scene("world");
				socket.emit('set:player', {userid:me.id, ls: x0local});
			})
			.on('nicknameReady', function(data){ // getting the nickname from server and create a local storage
				var storage = {};
				storage.name = data.name;
				localStorage.setItem( 'pixelgradeX0', JSON.stringify(storage) );
				me.name = data.name;
			})
			.on('setMeHost', function(){
				me.host = 1;
			})
			.on('create:game', function(data){
				me.gameid = data.gameid;
				Crafty.scene("preload");
			})
			.on('start:game', function(data){
				if ( data ) { me.gameid = data.gameid; }
				Crafty.scene("game");
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
										socket.emit('user:click', {gameid: me.gameid, host: me.host, cellID: this.cellID } );
									});
							}
							if ( (data.x == i) && (data.y ==j) ) {
								client_board[data.x][data.y].addComponent(data.component);
							}
						}
					}
				}
			})
			.on('round:start', function(data){
				me.score = data.score;
				Crafty.scene("round:start");
			})
			.on('round:over', function(data){
				if ( data.draw ) {
					Crafty.scene("round:draw");
				} else {
					if ( data.winner ) {
						Crafty.scene("round:win");
					} else {
						Crafty.scene("round:lose");
					}
				}
			})
			.on('game:over', function(data){
				if ( data.winner ) {
					Crafty.scene("game:win");
				} else {
					Crafty.scene("game:lose");
				}
			});

	}, function(err){ // socket is down
			Crafty.init(600, 500);
			Crafty.canvas.init();
			Crafty.background('#ebebeb');
			$('#overlay').fadeOut(2600,function(){}); // loader
			//score display
			Crafty.e("HTML, 2D, DOM")
				.replace(" Serverul nu este disponibil momentan !")
				.attr({x: Crafty.viewport.width/4, y: Crafty.viewport.height/2, w: Crafty.viewport.width, h:Crafty.viewport.height})
				.css({color: "#345",fontSize:"22px", fontWeight: "bold"});

	});
}); //require jQuery and crafty

var changeVolume = function(newVolume) {

   if (!Crafty.support.audio)

       return;

   var s;
   for (var i in this.sounds) {
       s = this.sounds[i];
       s.obj.volume = newVolume;
   }
}