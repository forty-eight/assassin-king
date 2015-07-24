var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('../client'));

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(1337, function(){
  console.log('Listening on 1337');
});
