var express = require('express');
var crypto = require('crypto');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var sockets = {};
var socketIds = [];

app.use(express.static('../client'));

io.on('connection', function(socket){
  var id = crypto.pseudoRandomBytes(5).toString('hex');
  console.log('a user connected with id: %s', id);

  var position = [Math.random()*800, Math.random()*800];

  socket.broadcast.emit('connectedPeer', {id: id, position: position});
  socket.emit('initialConnection', {id: id, position: position, peers: socketIds});

  socket.on('offer', function(event){
    console.log('offer', event);
    sockets[event.id].emit('offer', {id: id, description: event.description});
  });

  socket.on('answer', function(event){
    console.log('answer', event);
    sockets[event.id].emit('answer', {id: id, description: event.description, position: event.position});
  });

  socket.on('iceCandidate', function(event){
    console.log('iceCandidate', event);
    sockets[event.id].emit('iceCandidate', {id: id, candidate: event.candidate});
  });

  socket.on('disconnect', function(){
    console.log('disconnect', id);
    socket.broadcast.emit('disconnectedPeer', id);
    sockets[id] = null;
    for(var i=0; i<socketIds.length; i++){
      if(id === socketIds[i]){
        socketIds.splice(i, 1);
        break;
      }
    }
  });

  sockets[id] = socket;
  socketIds.push(id);
});



http.listen(1337, function(){
  console.log('Listening on 1337');
});
