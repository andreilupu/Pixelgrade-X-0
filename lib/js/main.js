requirejs.config({
    paths: {
        jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min',
        socketio: 'http://192.168.2.2:8000/socket.io/lib/socket.io'
    },
    baseUrl: 'lib/js',
});
// Start the main app logic.
requirejs([ 'jquery' ], function($) {
	requirejs([ 'socketio', 'keyboard', 'crafty' ], function(){
	
		var socket = io.connect("http://192.168.2.2:8000"),
			client_board = new Array(),
			me = {id:0, type: "" };
			
		socket.on('onconnected', function(data){
			// get my id
			me.id = data.id;
		});

	}); // require
}); //require