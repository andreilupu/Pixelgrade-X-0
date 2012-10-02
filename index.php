<!DOCTYPE html>

<html>

<head>
	<meta charset="utf-8">
	<title> Demo </title>
	<link rel="stylesheet" href="lib/css/style.css">
	<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"></script>
	<script src="http://code.angularjs.org/1.0.2/angular.js"></script>
	<script src="http://192.168.0.101:8000/socket.io/lib/socket.io.js"></script>
	<script type="text/javascript" src="lib/js/angular/app.js" ></script>
	<script type="text/javascript" src="lib/js/angular/controllers.js" ></script>
	<script type="text/javascript" src="lib/js/angular/directives.js" ></script>
	<script type="text/javascript" src="lib/js/angular/filters.js" ></script>
	<script type="text/javascript" src="lib/js/angular/services.js" ></script>
</head>

<body>

	<div ng-app="MyApp" ng-controller="AppCtrl" >

		<span draggable>Drag ME</span>
		<p><input type="integer" min="0" ng-model="qty" required ></p>
		<p><input type="number" ng-model="cost" required ></p>
		<b>Total:</b> {{qty * cost | currency}}

		<span draggable>Drag ME</span>
		<span draggable>Drag ME</span>
		<span draggable>Drag ME</span>
		
	</div>


</body>
</html>