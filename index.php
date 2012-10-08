<?php
$user = $_SERVER['HTTP_USER_AGENT'];
$ip = $_SERVER['REMOTE_ADDR'];
if ( $_SERVER['HTTP_USER_AGENT'] == 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.79 Safari/537.4') {
	$user = 'Chrome';
} elseif ( $_SERVER['HTTP_USER_AGENT'] ==  'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1' ) {
	$user = 'Firefox';
} elseif ( $_SERVER['HTTP_USER_AGENT'] == 'Opera/9.80 (Windows NT 6.1; WOW64; U; en) Presto/2.10.289 Version/12.01') {
	$user = 'Opera';
}
$user = $ip.': '.$user;

?>
<!DOCTYPE html>

<html>

<head>

	<meta charset="utf-8">
	<title> Demo </title>
	<link rel="stylesheet" href="lib/css/style.css">
	<script type="text/javascript">
		// to lazzy to create a client.js file
		var user = '<?php echo $user ?>';
	</script>
	<script data-main="lib/js/main.js" src="lib/js/require.js"></script>
	
</head>

<body>

	<div>

		<span >You are : <?echo $user; ?> </span>

		<div id="cr-stage" class="game">

		</div>

	</div>


</body>
</html>