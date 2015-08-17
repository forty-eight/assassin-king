var p2p = require('./p2p');
var movement = require('./movement');

movement.setDirectionHandler(p2p.send);
