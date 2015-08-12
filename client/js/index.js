/* globals io, window, document*/

var maxY = document.body.clientHeight;
var maxX = document.body.clientWidth;
var screen = document.getElementById('screen');

var activeKeys = {37: 0, 38: 0, 39: 0, 40: 0, 65: 0, 68: 0, 83: 0, 87: 0};
var movementKeys = {37: 1, 38: 1, 39: 1, 40: 1, 65: 1, 68: 1, 83: 1, 87: 1}

var sprites = [];
var spriteObj = {};

var sprite = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  width: 20,
  height: 20,
  velocity: 5,
  key: Math.random() * 1e18,
  node: null
};

addSprite(sprite);
//socket.on('sprite', addSprite);
//socket.on('direction-change', updateDirection);


var keyDownListener = eventFactory(1);
var keyUpListener = eventFactory(0);

document.addEventListener('keydown', keyDownListener);
document.addEventListener('keyup', keyUpListener);

tick();



function addSprite(sprite){
  sprite.node = document.createElement('div');
  sprite.node.className = 'sprite';
  setCoords(sprite);
  screen.appendChild(sprite.node);

  sprites.push(sprite);
  spriteObj[sprite.key] = sprite;
}


function updateDirection(sprite){
  var oldSprite = spriteObj[sprite.key];
  oldSprite.dx = sprite.dx;
  oldSprite.dy = sprite.dy;
}



function eventFactory(isKeyDown){
  return function(event){
    var key = event.keyCode;
    if(movementKeys[key]){
      var lastState = activeKeys[key];
      if(isKeyDown !== lastState){
        activeKeys[key] = isKeyDown;
        setDirection();
      }
    }
  }
}


function setDirection(){
  sprite.dx = (activeKeys[39] || activeKeys[68]) - (activeKeys[37] || activeKeys[65]);
  sprite.dy = (activeKeys[40] || activeKeys[83]) - (activeKeys[38] || activeKeys[87]);
//  socket.emit('direction-change', sprite);
}

function tick(){
  for(var i=0; i<sprites.length; i++){
    var sprite = sprites[i];

    sprite.x = (sprite.x + sprite.dx * sprite.velocity)%maxX;
    sprite.y = (sprite.y + sprite.dy * sprite.velocity);

    if(sprite.x < 0) sprite.x = maxX + sprite.x;
    if(sprite.y < 0) sprite.y = 0;
    if(sprite.y > maxY - sprite.height) sprite.y = maxY - sprite.height;

    setCoords(sprite);
  }

  window.requestAnimationFrame(tick);
}



function setCoords(sprite){
  sprite.node.style.transform = 'translate(' + sprite.x + 'px,' + sprite.y + 'px)';
}


/*globals io RTCPeerConnection*/


var socket = io('http://localhost:1337');
var connections = {};
var channelArr = [];


//new peer makes connections for every other peer
socket.on('initialConnection', makeConnections);

socket.on('newPeer', makeRecipricolConnection);

//hook in to connections created by a peer
socket.on('iceCandidate', setIceCandidate);
socket.on('offer', setRemoteDescriptionFromOffer);
socket.on('answer', setRemoteDescriptionFromAnswer);


function makeConnections(peerIds) {
  peerIds.forEach(function(id, i){
    var connection = new RTCPeerConnection(null, {optional: [{RtpDataChannels: true}]});
    var channel = connection.createDataChannel('channel' + i, {reliable: false});

    connections[id] = connection;
    channelArr.push(channel);

    channel.onmessage = handleMessage;
    connection.onicecandidate = iceCandidateEmitter(id);
    connection.createOffer(localDescriptionFromOfferSetter(id), handleError);
  });

}


function makeRecipricolConnection(id){
  var connection = new RTCPeerConnection(null, {optional: [{RtpDataChannels: true}]});
  connections[id] = {connection: connection, channel: null};

  connection.onicecandidate = iceCandidateEmitter(id);

  connection.ondatachannel = function(event){
    channelArr.push(event.channel);
    event.channel.onmessage = handleMessage;
  };
}


function localDescriptionFromOfferSetter(id){
  return function(desc){
    connections[id].setLocalDescription(desc);
    socket.emit('offer', {id: id, description: desc});
  }
}


function setRemoteDescriptionFromOffer(event){
  var connection = connections[event.id];
  connection.setRemoteDescription(event.description);
  connection.createAnswer(localDescriptionFromAnswerSetter(event.id), handleError);
}


function localDescriptionFromAnswerSetter(id){
  return function(desc){
    connections[id].setLocalDescription(desc);
    socket.emit('answer', {id: id, description: desc});
  }
}


function setRemoteDescriptionFromAnswer(event){
  connections[event.id].setRemoteDescription(event.description);
}


//emit ice candidate to peer
function iceCandidateEmitter(id){
  return function(event){
    if(event.candidate) {
      socket.emit('iceCandidate', {id: id, candidate: event.candidate});
    }else{
      throw new Error('No Ice Candidate for ' + JSON.stringify(event));
    }
  }
}


//Apply ice candidate after emitted from peer
function setIceCandidate(event){
  connections[event.id].addIceCandidate(event.candidate);
}


function handleMessage(event) {
  console.log(event);
}


function handleError(err){console.log(err)}


function sendMessage(data){
 for(var i=0; i<channelArr.length; i++){
   channelArr[i].send(data);
 }
}
