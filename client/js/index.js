/* globals io, window, document*/
var socket = io();

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
socket.on('sprite', addSprite);
socket.on('direction-change', updateDirection);


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
  socket.emit('direction-change', sprite);
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

