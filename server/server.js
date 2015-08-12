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

  socket.broadcast.emit('newPeer', id);
  socket.emit('initialConnection', socketIds);

  socket.on('offer', function(event){
    sockets[event.id].emit('offer', {id: id, description: event.description});
  });

  socket.on('answer', function(event){
    sockets[event.id].emit('answer', {id: id, description: event.description});
  });

  socket.on('iceCandidate', function(event){
    sockets[event.id].emit('iceCandidate', {id: id, candidate: event.candidate});
  });

  sockets[id] = socket;
  socketIds.push(id);
});



http.listen(1337, function(){
  console.log('Listening on 1337');
});
