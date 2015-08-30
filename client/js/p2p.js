/*globals io RTCPeerConnection RTCSessionDescription RTCIceCandidate webrtcDetectedBrowser*/
var movement = require('./movement');
var socket = io('http://localhost:1337');
var connections = {};
var channelArr = [];

var pc_config = webrtcDetectedBrowser === 'firefox'
  ? {'iceServers': [{'url': 'stun:23.21.150.121'}]}
  : {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]}
  ;

var pc_constraints = {
  'optional': [
    {'DtlsSrtpKeyAgreement': true},
    {'RtpDataChannels': true}
  ]
};


//new peer makes connections for every other peer
socket.on('initialConnection', makeConnections);

socket.on('connectedPeer', makeRecipricolConnection);
socket.on('disconnectedPeer', dropPeer);

//hook in to connections created by a peer
socket.on('iceCandidate', setIceCandidate);
socket.on('offer', setRemoteDescriptionFromOffer);
socket.on('answer', setRemoteDescriptionFromAnswer);


function makeConnections(idData) {
  var id = idData.id;
  var peerIds = idData.peers;
  console.log('id', id);
  console.log('peerIds', peerIds);

  movement.makeLocalSprite(id);

  peerIds.forEach(function(id){
    var connection = new RTCPeerConnection(pc_config, pc_constraints);
    var channel = connection.createDataChannel(id, {reliable: false});

    connections[id] = {connection: connection, channel: channel};
    channelArr.push(channel);

    channel.onmessage = handleMessage;
    connection.onicecandidate = iceCandidateEmitter(id);
    connection.createOffer(localDescriptionFromOfferSetter(id), handleError);

    movement.makeSprite(id);
  });

}


function makeRecipricolConnection(id){
  console.log("connecting reciprically to: ", id);
  var connection = new RTCPeerConnection(pc_config, pc_constraints);

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
  console.log(connections, event);
  var connection = connections[event.id].connection;
  console.log('setting remote desc from offer', event.description);
  connection.setRemoteDescription(new RTCSessionDescription(event.description));
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
  connections[event.id].connection.setRemoteDescription(new RTCSessionDescription(event.description));
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
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.candidate.label,
    candidate: event.candidate.candidate
  });
  if(connections[event.id]) connections[event.id].connection.addIceCandidate(candidate);
  else console.log('no connection yet');
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

  movement.removeSprite(id);
}


function handleMessage(event){
  var data = JSON.parse(event.data)
  console.log('Got %s from %s.', event.data, data.id);
  movement.setMotion(data.id, data);
}


function handleError(err){console.log(err)}


function sendMessage(data){
 for(var i=0; i<channelArr.length; i++){
   channelArr[i].send(JSON.stringify(data));
 }
}

module.exports = {
  send: sendMessage,
  connections: connections,
  channels: channelArr
}
