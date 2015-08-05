/********************Requires********************/
var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');

/********************Local Storage********************/
//var initialized = false;

//initialize local storage keys
var topic_name_key = "npr_topic_name";
var topic_id_key = 'npr_topic_id';
//attempt to retrieve local storage value
var topic_id_value = localStorage.getItem(topic_id_key);

//if local storage is not set, automatically set it to 1004 = World News
if (topic_id_value === null) {
  console.log("Value was not set. settings value...");
  //set local storage variable for topic id
  topic_id_value = "1004";
  localStorage.setItem(topic_id_key, topic_id_value);
  //set local storage variable for topic Name
  var topic_name_value = "World";
  localStorage.setItem(topic_name_key, topic_name_value);
} else {
  var topic_name_value = localStorage.getItem(topic_name_key);
}

console.log("Value is set to: " + topic_id_value + " (" + topic_name_value + ")");

/********************Configuration Screen********************/
//initialize options with retrieved topic value
var options = {'topic': topic_id_value, 'name': topic_name_value};

Pebble.addEventListener("ready", function() {
  //initialized = true;
});

Pebble.addEventListener("showConfiguration", function() {
  console.log("showing configuration...");
  Pebble.openURL('http://rawgit.com/dybm/pebble_npr_app/master/src/configuration.html?' + encodeURIComponent(JSON.stringify(options)));
});

Pebble.addEventListener("webviewclosed", function(e) {
  console.log("configuration closed");
  //webview closed
  //using primitive JSON validity and non-empty check
  if (e.response.charAt(0) == "{" && e.response.slice(-1) == "}" && e.response.length > 5) {
    options = JSON.parse(decodeURIComponent(e.response));
    console.log("Options = " + JSON.stringify(options));
    //save new topic id into local storage
    localStorage.setItem(topic_id_key, options.topic);
    //save new topic name
    localStorage.setItem(topic_name_key, options.name);
    
    //reload menu
    reloadData();
  } else {
    console.log("Cancelled");
  }
});

/********************Create the Results Menu********************/
//initialize results menu
var resultsMenu = new UI.Menu();

//set accel event to reload the data
resultsMenu.on('accelTap', function(e) {
  //reload the data
  reloadData();
});

/********************Splash Windows********************/
//Create a splash screen to show when loading
var splashWindow = new UI.Window();

//initalize teaser card
var teaserCard = new UI.Card({
  title: '',
  subtitle: '',
  body: '',
  scrollable: true
});

//Create NPR N padding
var textNpad = new UI.Text({
  position: new Vector2(0,0),
  size: new Vector2(12,60),
  text: '',
  backgroundColor: 'red'
});
//Create NPR N
var textN = new UI.Text({
  position: new Vector2(11,0),
  size: new Vector2(37,60),
  text: 'n',
  font: 'BITHAM_42_BOLD',
  color: 'white',
  textAlign: 'left',
  backgroundColor: 'red'
});

//Create NPR P padding
var textPpad = new UI.Text({
  position: new Vector2(49,0),
  size: new Vector2(12,60),
  text: '',
  backgroundColor: 'black'
});
//Create NPR P
var textP = new UI.Text({
  position: new Vector2(60,0),
  size: new Vector2(37,60),
  text: 'p',
  font: 'BITHAM_42_BOLD',
  color: 'white',
  textAlign: 'left',
  backgroundColor: 'black'
});

//Create NPR R padding
var textRpad = new UI.Text({
  position: new Vector2(100,0),
  size: new Vector2(12,60),
  text: '',
  backgroundColor: 'blue'
});
//Create NPR R
var textR = new UI.Text({
  position: new Vector2(112,0),
  size: new Vector2(37,60),
  text: 'r',
  font: 'BITHAM_42_BOLD',
  color: 'white',
  textAlign: 'left',
  backgroundColor: 'blue'
});
//Create a text element for the splash screen
var textLoading = new UI.Text({
  position: new Vector2(0, 60),
  size: new Vector2(144, 168),
  text:'Downloading Headlines...',
  font:'GOTHIC_28',
  color:'black',
  textOverflow:'wrap',
  textAlign: 'center',
  backgroundColor:'white'
});
//Create a text element for the splash screen
var textRefreshing = new UI.Text({
  position: new Vector2(0, 60),
  size: new Vector2(144, 168),
  text:'Refreshing Headlines...',
  font:'GOTHIC_28',
  color:'black',
  textOverflow:'wrap',
  textAlign: 'center',
  backgroundColor:'white'
});
//Create a text element for the splash screen
var textError = new UI.Text({
  position: new Vector2(0, 60),
  size: new Vector2(144, 168),
  text:'An Error Occured',
  font:'GOTHIC_28',
  color:'black',
  textOverflow:'wrap',
  textAlign: 'center',
  backgroundColor:'white'
});
//Create a text element for the splash screen
var textFailed = new UI.Text({
  position: new Vector2(0, 60),
  size: new Vector2(144, 168),
  text:'Could Not Connect to the Internet',
  font:'GOTHIC_28',
  color:'black',
  textOverflow:'wrap',
  textAlign: 'center',
  backgroundColor:'white'
});

//add text to the splashwindow and display it
splashWindow.add(textNpad);
splashWindow.add(textN);
splashWindow.add(textPpad);
splashWindow.add(textP);
splashWindow.add(textRpad);
splashWindow.add(textR);
splashWindow.add(textLoading);
splashWindow.show();

/********************Main Code********************/
//prepare the accelerometer
Accel.init();

//build NPR api url
var base = 'http://api.npr.org/query?';
var get  = 'id=' + options.topic + '&fields=title,teaser&dateType=story&output=JSON&apiKey=';
var key  = ''; //type your own private NPR API key here
var URL  = base + get + key;

//load the data
makeRequest();

function makeRequest() {
  //make ajax request
  ajax({
      url: URL,
      type: 'json'
    },
    function(data) {
      //verify data size before extracting
      if (data.list.story.length != 10) {
        //data structure is not of the type expected
        console.log('data structure is not of the type expected');
        //display the splash screen with an error message
        splashWindow.add(textError);
        splashWindow.show();
      } else {
        //get menu items from retrieved data
        var items = parseFeed(data);
        
        //construct menu
        var section = {
          title: options.name + ' Headlines',
          items: items
        };
        
        //update section of results Menu
        resultsMenu.section(0, section);
        
        console.log('attempting to show menu and hide splash');
        //show the menu and hide the splash screen
        resultsMenu.show();
        splashWindow.hide();
        
        console.log('splash hidden');
        
        //clear any "on" attributes
        resultsMenu.on('select', function(e) {} );
        
        console.log('results menu select function cleared');
        
        //add an action for SELECT button (short click)
        resultsMenu.on('select', function(e) {
          //create a card for the story
          console.log('trying to add subtitle and body');
          teaserCard.subtitle(data.list.story[e.itemIndex].title['$text']);
          teaserCard.body(data.list.story[e.itemIndex].teaser['$text']);
          
          console.log('subtitle added: ' + data.list.story[e.itemIndex].title['$text']);
          
          /*
          var teaserCard = new UI.Card({
            title: '',
            subtitle: data.list.story[e.itemIndex].title['$text'],
            body: data.list.story[e.itemIndex].teaser['$text'],
            scrollable:  true,
          });
          */
          
          //display the card
          teaserCard.show();
        });
      }
    },
    function(error) {
      //could not retrieve npr data
      console.log('Failed to fetch NPR data: ' + error);
      //display splashwindow with failed internet connection error
      splashWindow.add(textFailed);
      splashWindow.show();
    }
  );
}

/********************Functions********************/

function parseFeed(data) {
  var items = [];
  for (var i in data.list.story) {
    //get the title and teaser info for the retrieved NPR stories
    var title = data.list.story[i].title['$text'];
    var teaser = data.list.story[i].teaser['$text'];
    
    //remove <em> tags from the teaser text
    teaser = teaser.replace(/<em>/g, ' ');
    teaser = teaser.replace(/<\/em>/g, ' ');
    
    //add items to menu array
    items.push({
      title: title,
      subtitle: teaser
    });
  }
  return items;
}

function reloadData() {
  //display an updating window
  splashWindow.add(textRefreshing);
  splashWindow.show();
  
  //vibrate to indicate data is reloading
  Vibe.vibrate('short');
  
  //log status
  console.log("reloading...");
  console.log("new topic: " + options.topic);
  
  //rebuild part of the URL
  var get  = 'id=' + options.topic + '&fields=title,teaser&dateType=story&output=JSON&apiKey=';
  URL  = base + get + key;
  
  //reload the data
  makeRequest();
}
