/* globals window, document*/

var maxY = document.body.clientHeight;
var maxX = document.body.clientWidth;
var page = document.getElementById('page');
var directionHandler = function(){};

var activeKeys = {37: 0, 38: 0, 39: 0, 40: 0, 65: 0, 68: 0, 83: 0, 87: 0};
var movementKeys = {37: 1, 38: 1, 39: 1, 40: 1, 65: 1, 68: 1, 83: 1, 87: 1}

var sprites = [];
var spriteObj = {};
var nodeObj = {};
var localSprite = null;



var keyDownListener = eventFactory(1);
var keyUpListener = eventFactory(0);

document.addEventListener('keydown', keyDownListener);
document.addEventListener('keyup', keyUpListener);

tick();



function addSprite(sprite){
  var node = document.createElement('div');
  node.className = 'sprite';
  setCoords(sprite);
  page.appendChild(node);

  sprites.push(sprite);
  spriteObj[sprite.id] = sprite;
  return sprite;
}


function makeSprite(id, x, y){
  return addSprite({
    x: x || Math.random() * maxX- 20,
    y: y || Math.random() * maxY - 20,
    xdir: 0,
    ydir: 0,
    velocity: 5,
    id: id
  });
}


function makeLocalSprite(id, x, y){
  if(localSprite) return localSprite;
  return localSprite = makeSprite(id, x, y);
}


function eventFactory(isKeyDown){
  return function(event){
    var key = event.keyCode;
    if(movementKeys[key]){
      var lastState = activeKeys[key];
      if(isKeyDown !== lastState){
        activeKeys[key] = isKeyDown;
        if(!localSprite) return;
        setDirection(localSprite.id);
        directionHandler(localSprite);
      }
    }
  }
}


function setDirection(id){
  var sprite = spriteObj[id];
  sprite.xdir = (activeKeys[39] || activeKeys[68]) - (activeKeys[37] || activeKeys[65]);
  sprite.ydir = (activeKeys[40] || activeKeys[83]) - (activeKeys[38] || activeKeys[87]);
  return sprite;
}


function tick(){
  for(var i=0; i<sprites.length; i++){
    var sprite = sprites[i];
    var node = nodeObj[sprite.id];

    sprite.x = (sprite.x + sprite.xdir * sprite.velocity)%maxX;
    sprite.y = (sprite.y + sprite.ydir * sprite.velocity);

    if(sprite.x < 0) sprite.x = maxX + sprite.x;
    if(sprite.y < 0) sprite.y = 0;
    if(sprite.y > maxY - sprite.height) sprite.y = maxY - sprite.height;

    setCoords(node, sprite.x, sprite.y);
  }

  window.requestAnimationFrame(tick);
}


function setCoords(node, x, y){
  return node.style.transform = 'translate(' + x + 'px,' + y + 'px)';
}


function bindDirectionHandler(fn){
  return directionHandler = fn;
}



module.exports = {
  bindDirectionHandler: bindDirectionHandler,
  makeSprite: makeSprite,
  makeLocalSprite: makeLocalSprite,
  setDirection: setDirection
};
