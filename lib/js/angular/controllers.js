'use strict';

function AppCtrl($scope, socket) {
	$scope.qty = 1;
	$scope.cost = 19.95;

	socket.on('init', function(){
		console.log('ura');
	});
};