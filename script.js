window.onload = function() {

  document.settings.go.onclick = function() {
  	console.log("Submitted");
  	var location = "pebblejs://close#" + encodeURIComponent(JSON.stringify(saveData()));
  	console.log("Moving to " + location);
  	console.log(location);
  	document.location = location;
  }
		
  document.settings.cancel.onclick = function() {
  	console.log("Canceled");
  	document.location = "pebblejs://close";
  }
}

function saveData() {
  var name = document.settings.name.value;
	var options = {'name': name};
	return options;
}

