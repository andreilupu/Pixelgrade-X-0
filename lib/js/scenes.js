//here we define all the stages of the game

Crafty.scene("world", function () {

	Crafty.init(600, 500);
	Crafty.canvas.init();
	Crafty.background('#aaa');

	var first_user = Crafty.e("HTML, user, first_user, Persist")
			.attr({ x: 50, y: 10, w: 210, h:40})
			.replace("<span class=\"label\">User 1: </span>"),
		second_user =  Crafty.e("HTML, user, second_user, Persist")
			.attr({ x: 340, y: 10, w: 210, h:40})
			.replace("<span class=\"label\">User 2: </span>"),
		GameTitle = Crafty.e("HTML")
						.attr({ x: 280, y: 70, w: 210, h:40})
						.replace("<h2 class=\"label\"> Prepare ! </h2>")
						.append("<p>Waiting for your oponnent</p>");

	socket.emit('user-init', {user: user});
	socket.on('user-ready', function(users){
		if ( user == users.userlist.first_user ) { me = 0; }
		if ( user == users.userlist.second_user ) { me = 1; }
		first_user.replace('<span class=\"label host\">User 1: </span><span class="user_name">'+users.userlist.first_user+'</span>');
		second_user.replace('<span class=\"label client\">User 2: </span><span class="user_name">'+users.userlist.second_user+'</span>');

	});
});