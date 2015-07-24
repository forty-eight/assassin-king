var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('../client'));

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('position', function(pos){
    console.log(pos);
  });
});



http.listen(1337, function(){
  console.log('Listening on 1337');
});
