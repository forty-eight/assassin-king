/* globals window, document*/

var maxY = document.body.clientHeight;
var maxX = document.body.clientWidth;
var page = document.getElementById('page');
var directionHandler = function(){};

var activeKeys = {37: 0, 38: 0, 39: 0, 40: 0, 65: 0, 68: 0, 83: 0, 87: 0};
var movementKeys = {37: 1, 38: 1, 39: 1, 40: 1, 65: 1, 68: 1, 83: 1, 87: 1}

window.sprites = [];
window.spriteObj = {};
window.nodeObj = {};
window.localSprite = null;



var keyDownListener = eventFactory(1);
var keyUpListener = eventFactory(0);

document.addEventListener('keydown', keyDownListener);
document.addEventListener('keyup', keyUpListener);

tick();



function addSprite(sprite){
  var id = sprite.id;
  var node = document.createElement('div');
  node.className = 'sprite';

  nodeObj[id] = node;
  spriteObj[id] = sprite;
  sprites.push(sprite);

  setCoords(id);
  page.appendChild(node);

  return sprite;
}



function makeSprite(id, x, y){
  console.log('making sprite with id %s', id);
  return addSprite({
    x: x || Math.random() * maxX- 20,
    y: y || Math.random() * maxY - 20,
    xdir: 0,
    ydir: 0,
    velocity: 5,
    height: 20,
    width: 20,
    id: id
  });
}


function removeSprite(id){
  console.log('removing sprite %s', id);
  var node = nodeObj[id];
  page.removeChild(node);

  nodeObj[id] = null;
  spriteObj[id] = null;

  for(var i=0; i<sprites.length; i++){
    if(sprites[i][id] === id){
      sprites.splice(i, 1);
      break;
    }
  }
}


function makeLocalSprite(id, x, y){
  console.log('making localSprite with id %s', id);
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

function setMotion(id, data){
  var sprite = spriteObj[id];
  sprite.x = data.x;
  sprite.y = data.y;
  sprite.xdir = data.xdir;
  sprite.ydir = data.ydir;
  return sprite;
}


function tick(){
  for(var i=0; i<sprites.length; i++){
    var sprite = sprites[i];

    sprite.x = (sprite.x + sprite.xdir * sprite.velocity)%maxX;
    sprite.y = (sprite.y + sprite.ydir * sprite.velocity);

    if(sprite.x < 0) sprite.x = maxX + sprite.x;
    if(sprite.y < 0) sprite.y = 0;
    if(sprite.y > maxY - sprite.height) sprite.y = maxY - sprite.height;

    setCoords(sprite.id, sprite.x, sprite.y);
  }

  window.requestAnimationFrame(tick);
}


function setCoords(id, x, y){
  var node = nodeObj[id];
  return node.style.transform = 'translate(' + x + 'px,' + y + 'px)';
}


function bindDirectionHandler(fn){
  return directionHandler = fn;
}



module.exports = {
  bindDirectionHandler: bindDirectionHandler,
  makeSprite: makeSprite,
  makeLocalSprite: makeLocalSprite,
  removeSprite: removeSprite,
  setMotion: setMotion
};
