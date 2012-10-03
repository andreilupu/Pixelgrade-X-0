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
	
		var socket = io.connect("http://192.168.0.101:8000");
		socket.on('start-connection', function(user){
			Crafty.init(600, 500);
			Crafty.canvas.init();
			Crafty.sprite(64, "images/sprite.png", {
				red: [0, 0],
				yellow: [1, 0],
				empty: [2, 0]
			});

			socket.emit('set-nickname', {id: user.id});

			socket.on('user-ready', function(user){
				var me  = {id: user.userid, turn: user.turn}
			});


			var turn = 0, //turn based
				board = [],
				COLUMN_FULL = -2,
				EMPTY = -1,
				YELLOW = 0,
				RED = 1;

			Crafty.scene("game", function () {

				//generate board
				for (var i = 0; i < 7; i++) {
					board[i] = []; //init board
					for (var j = 0; j < 6; j++) {
						Crafty.e("2D, Canvas, empty").attr({ x: i * 64, y: j * 64 + 100, z: 2 });
						board[i][j] = EMPTY; //set it to empty
					}
				}

				Crafty.c("piece", {
					init: function () {
						this.z = 3;
						this.requires("Mouse, Gravity, Draggable, Tween");
						this.bind("StartDrag", function() {

						});

						this.bind("StopDrag", function() {
							var column = Math.round(this._x / 64);
							//this.x = column * 64;
		          			this.tween({x:column * 64}, 20)
							this.gravity("stopper");
							this.unbind("MouseDown");
							reset(column);
						});
					}
				});

				var current;
				function reset(column) {
					var row = findEmptyRow(column);
					if(row !== COLUMN_FULL && column >= 0 && column < 7) {
						board[column][row] = turn;

						if(checkFour(column, row)) {
							socket.emit('win', {winner : turn});
							return;
						}

						turn ^= 1; //alternate turns
						current = Crafty.e("2D, Canvas, piece, stopper," + (turn ? "red" : "yellow")).attr({ x: 495, y: 420 });
					} else {
						//dont' place
						var x=current.x;
						var y=current.y;
						current.destroy();
						current = Crafty.e("2D, Canvas, piece, stopper," + (turn ? "red" : "yellow"))
							.attr({x: x, y: y})
							.tween({x: 495, y: 420}, 20);
					}
				}

				current = Crafty.e("2D, Canvas, piece, stopper, yellow").attr({ x: 495, y: 420 });

				var ground = Crafty.e("2D, stopper").attr({ y: Crafty.viewport.height - 16, w: Crafty.viewport.width, h: 20 });
				var bg = Crafty.background("#aaa");

			});

			Crafty.scene("win", function() {
				var bg = Crafty.background("red");
				Crafty.e("2D, DOM, Text").attr({x: 20, y: 20, w:600}).text("The WInner Is : ").css({
			        "font-family": "Arial"
			        , "font-size": "50pt"
			        , "color": "#000"
			      });
				Crafty.e("2D, DOM, Text").attr({x: 220, y: 140}).text(turn ? "RED" : "YELLOW").css({
			        "font-family": "Arial"
			        , "font-size": "50pt"
			      });
			});

			function findEmptyRow(column) {
				if(!board[column]) return;
				for(var i = 0; i < board[column].length; i++) {
					if(board[column][i] == EMPTY)
						return i;
				}
				return COLUMN_FULL;
			}

			function checkFour(column, row) {
				if(checkVertical(column, row)) return true;
				if(checkHorizontal(column, row)) return true;
				if(checkLeftDiagonal(column, row)) return true;
				if(checkRightDiagonal(column, row)) return true;
				return false;
			}

			function checkVertical(column, row) {
				if(row < 3) return false;
				for(var i = row; i > row - 4; i--) {
					if(board[column][i] != turn) return false;
				}
				return true;
			}

			function checkHorizontal(column, row) {
				var counter = 1;
				for(var i = column - 1; i >= 0; i--) {
					if(board[i][row] != turn) break;
					counter++;
				}

				for(var j = column + 1; j < 7; j++) {
					if(board[j][row] != turn) break;
					counter++;
				}
				return counter >= 4;
			}

			function checkLeftDiagonal(column, row) {
				var counter = 1;
				var tmp_row = row - 1;
				var tmp_column = column - 1;

				while(tmp_row >= 0 && tmp_column >= 0) {
					if(board[tmp_column][tmp_row] == turn) {
						counter++;
						tmp_row--;
						tmp_column--;
					} else break;
				}

				row += 1;
				column += 1;

				while(row < 6 && column < 7) {
					if(board[column][row] == turn) {
						counter++;
						row++;
						column++;
					} else { break; }
				}
				return counter >= 4;
			}

			function checkRightDiagonal(column, row) {
				var counter = 1;
				var tmp_row = row + 1;
				var tmp_column = column - 1;

				while(tmp_row < 6 && tmp_column >= 0) {
					if(board[tmp_column][tmp_row] == turn) {
						counter++;
						tmp_row++;
						tmp_column--;
					} else break;
				}

				row -= 1;
				column += 1;

				while(row >= 0 && column < 7) {
					if(board[column][row] == turn) {
						counter++;
						row--;
						column++;
					} else break;
				}
				return counter >= 4;
			}

			Crafty.scene("game");//start the game
		});

		socket.on('show-winner', function(){

			Crafty.scene("win");

		});


	}); // require
}); //require


