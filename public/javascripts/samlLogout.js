var timer = 0;
var target = parseInt(document.getElementById("countdown").innerText);

var x = setInterval(function() {
	var timeLeft = target - timer;
	document.getElementById("countdown").innerText = timeLeft;
	if (timeLeft === 0) {
	  clearInterval(x);
	  window.location.replace("/");
	}else{
		timer++;
	}
  }, 1000);