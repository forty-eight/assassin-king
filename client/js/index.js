var socket = io();

var height = document.body.clientHeight;
var width = document.body.clientWidth;

var velo = 5;

var sprite = {
  x: 0,
  y: 0,
  width: 20,
  height: 20,
  node: document.getElementById('player')
}

var activeKeys = {37: 0, 38: 0, 39: 0, 40: 0, 65: 0, 68: 0, 83: 0, 87: 0};
var movementKeys = {37: 1, 38: 1, 39: 1, 40: 1, 65: 1, 68: 1, 83: 1, 87: 1}

function eventFactory(keyDown){
  return function(event){
    var key = event.keyCode;
    if(movementKeys[key]){
      var lastState = activeKeys[key];
      if(keyDown !== lastState){
        activeKeys[key] = keyDown;
      }
    }
  }
}

var keyDownListener = eventFactory(1);
var keyUpListener = eventFactory(0);

document.addEventListener('keydown', keyDownListener);
document.addEventListener('keyup', keyUpListener);

function moveSprite(){
  var dx = (activeKeys[39] || activeKeys[68]) - (activeKeys[37] || activeKeys[65]);
  var dy = (activeKeys[40] || activeKeys[83]) - (activeKeys[38] || activeKeys[87]);

  sprite.x += dx*velo;
  sprite.y += dy*velo;

  sprite.node.style.transform = 'translate(' + sprite.x + 'px,' + sprite.y + 'px)';

  window.requestAnimationFrame(moveSprite);
}

moveSprite();
