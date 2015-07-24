var http = require('http');
var io = require('socket.io')(http);

var server = http.createServer(function(req, res){
  res.end('GOT IT');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

server.listen(1337, function(){
  console.log('Listening on 1337');
});


