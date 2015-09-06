var p2p = require('./p2p');
var movement = require('./movement');

movement.bindDirectionHandler(p2p.send);
