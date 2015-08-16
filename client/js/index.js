/* globals io, window, document*/

var maxY = document.body.clientHeight;
var maxX = document.body.clientWidth;
var page = document.getElementById('page');

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
  page.appendChild(sprite.node);

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

socket.on('connectedPeer', makeRecipricolConnection);
socket.on('disconnectedPeer', dropPeer);

//hook in to connections created by a peer
socket.on('iceCandidate', setIceCandidate);
socket.on('offer', setRemoteDescriptionFromOffer);
socket.on('answer', setRemoteDescriptionFromAnswer);


function makeConnections(peerIds) {
  peerIds.forEach(function(id, i){
    var connection = new RTCPeerConnection(null, {optional: [{RtpDataChannels: true}]});
    var channel = connection.createDataChannel('channel' + i, {reliable: false});

    connections[id] = {connection: connection, channel: channel};
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
    console.log('GOT DATA CHANNEL', event);
    connections[id].channel = event.channel;
    channelArr.push(event.channel);
    event.channel.onmessage = handleMessage;
  };
}


function localDescriptionFromOfferSetter(id){
  return function(desc){
    console.log('setting local desc from offer', desc);
    connections[id].connection.setLocalDescription(desc);
    socket.emit('offer', {id: id, description: desc});
  }
}


function setRemoteDescriptionFromOffer(event){
  var connection = connections[event.id].connection;
  console.log('setting remote desc from offer', event.description);
  connection.setRemoteDescription(event.description);
  connection.createAnswer(localDescriptionFromAnswerSetter(event.id), handleError);
}


function localDescriptionFromAnswerSetter(id){
  return function(desc){
    console.log('setting local desc from answer', desc);
    connections[id].connection.setLocalDescription(desc);
    socket.emit('answer', {id: id, description: desc});
  }
}


function setRemoteDescriptionFromAnswer(event){
  console.log('setting remote desc from answer', event.description);
  connections[event.id].connection.setRemoteDescription(event.description);
}


//emit ice candidate to peer
function iceCandidateEmitter(id){
  return function(event){
    console.log(event);
    if(event.candidate) {
      socket.emit('iceCandidate', {id: id, candidate: event.candidate});
    }else{
      console.log('No Ice Candidate for ' + JSON.stringify(event));
    }
  }
}


//Apply ice candidate after emitted from peer
function setIceCandidate(event){
  console.log('setting ice candidate', event.candidate);
  connections[event.id].connection.addIceCandidate(event.candidate);
}

function dropPeer(id){
  console.log('dropping', id);
  var connection = connections[id].connection
  var channel = connections[id].channel;

  connection.close();
  if(channel) channel.close();

  for(var i=0; i<channelArr.length; i++){
    if(channelArr[i] === channel){
      channelArr.splice(i, 1);
      break;
    }
  }

  connections[id] = null;
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
