/* 15237 Homework 1
 * achayes, khellste, rbilling
 */


var canvas = document.getElementById("myCanvas");
canvas.setAttribute('tabindex', '0');
canvas.focus();
var ctx = canvas.getContext("2d");
var types = {
    "EMPTY": 0,
    "PLAYER": 1,
    "BLOCK": 2,
    "FINISH": 3,
    "PORTAL": 4,
    "BOMB": 5,
    "SLIDE": 6,
    "ARROW": 7
}
var blocks = [types.BLOCK, types.PORTAL, types.SLIDE];
var onBlocks = [types.ARROW, types.BOMB, types.FINISH];


var charToObj = {
    "0": BaseObject,
    "1": PlayerObj,
    "2": BlockObj,
    "3": FinishObj,
    "4": PortalObj,
    "5": BombObj,
    "6": SlideObj,
    "8": PlayerObj,
    "u": ArrowObj,
    "d": ArrowObj,
    "l": ArrowObj,
    "r": ArrowObj
}
var cellSize = 40;
var slideSpeed = 20; //blocks per second
var topbarSize = 50;
var deaths = 0;
var selected;
var editGrid;
var editedLevel;
var iceColor = "rgb(229,244,255)";
var frame = 0;
var animIndex = 0;
var animSpeed = 50;

/*
 * A basic object that stores location and size
 * It also has prototypes for drawing itself and updating its location
 */
function BaseObject(row, col, width, height){
    this.row = row
    this.col = col;
    this.startRow = row;
    this.startCol = col;
    this.x = col*cellSize;
    this.y = row*cellSize;
    this.width = width;
    this.height = height;
    this.dr = 0;
    this.dc = 0;
}
BaseObject.prototype.type = types.EMPTY;
BaseObject.prototype.drawFn = function() {
    ctx.fillStyle = iceColor;
    ctx.fillRect(this.x, this.y + topbarSize, this.width, this.height);
};
BaseObject.prototype.reset = function() {
    this.row = this.startRow;
    this.col = this.startCol;
    this.x = this.col*cellSize;
    this.y = this.row*cellSize;
    this.dc = 0;
    this.dr = 0;
};
/*
 * Update the object's location based on how much time has passed
 * and the speed and direction the object is going.
 */
BaseObject.prototype.update = function(state, tdelt) {
    this.x += this.dc*slideSpeed*cellSize*tdelt/1000;
    this.y += this.dr*slideSpeed*cellSize*tdelt/1000;
    var cornerX = this.x + (this.dc < 0 ? cellSize : 0);
    var cornerY = this.y + (this.dr < 0 ? cellSize : 0);
    var xSign = this.x >= 0 ? 1 : -1;
    var ySign = this.y >= 0 ? 1 : -1;
    var col = Math.floor(cornerX/cellSize);
    var row = Math.floor(cornerY/cellSize);
    this.row = row;
    this.col = col;
    var level = state.levels[state.curLevel];
    var cols = level.map.cols;
    var rows = level.map.rows;
    /* If the object is a player, check if the block it's about to hit is
       a block. If it is, interact with that block */
    if(this instanceof PlayerObj || this instanceof BlockObj){
        // Reset the object if it has gone off the screen
        if (this instanceof PlayerObj && 
            (col >= cols || col < 0 || row >= rows || row < 0)){
            deaths++;
            this.reset();
            level.resetLevel();
        }
        if (this instanceof BlockObj){
            if((this.dr < 0 && row <= 0) || (this.dr > 0 && row >= rows-1) ||
               (this.dc < 0 && col <= 0) || (this.dc > 0 && col >= cols-1))
            {
                this.reset();
            }
        }
        if(this.row >= 0 && this.row < rows && this.col >= 0 && this.col < cols) {
            var nBlock = level.map.grid[this.row][this.col];
            if(nBlock !== undefined && onBlocks.indexOf(nBlock.type) !== -1){
                nBlock.playerInteract(this, state);
                if(nBlock.type === types.FINISH)
                    return;
            }
        }
        var nextRow = this.row + this.dr;
        var nextCol = this.col + this.dc;
        if(nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
            var nBlock = level.map.grid[nextRow][nextCol];
            if(nBlock !== undefined && blocks.indexOf(nBlock.type) !== -1)
                nBlock.playerInteract(this, state);
        }
    }
};

/*
 * The player (inherits from BaseObject)
 * It has a different type and draw function.
 */
function PlayerObj(row, col, width, height, id){
    BaseObject.call(this, row, col, width, height);
	this.imageIndex = 0;
    if(id === "8")
        this.shadow = true;
    else
        this.shadow = false;
};
PlayerObj.prototype = new BaseObject();
PlayerObj.prototype.constructor = PlayerObj;
PlayerObj.prototype.type = types.PLAYER;
PlayerObj.prototype.drawFn = function(){
	var myPlayer = this;
	var yAnimOffset = 0;
	if (animIndex === 0) {
		yAnimOffset = 0;
	} else {
		yAnimOffset = 2;
	}
    var white, black, orange;
    if(this.shadow){
    	white = "rgba(255,255,255,.3)";
        black = "rgba(0,0,0,.3)";
        orange = "rgba(254, 152, 2, .3)";
    }
    else{
        white = "white";
        black = "black";
        orange = "rgba(254, 152, 2)";
    }
    var adjustedY = this.y + topbarSize;
    function body(ctx, cx, cy, radius) {
        ctx.fillStyle = white;
        ctx.strokeStyle = black;
        ctx.beginPath();
        ctx.arc(cx, cy+5 + yAnimOffset, radius, 0, 2*Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    
    function head(ctx, cx, cy, height, width) {        
		ctx.fillStyle = black;
		ctx.beginPath();
		ctx.arc(cx+width/2, cy + 12 + yAnimOffset, height/3, 0, 2*Math.PI, true);
		ctx.stroke();
		ctx.fill();
		ctx.closePath();
    }
    
    function eyes(ctx, cx, cy, width){
        ctx.fillStyle = white;
        // Left Eye
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(.9, 1);
        ctx.translate(-cx, -cy);
        ctx.beginPath();
        ctx.arc(cx+18, cy+10 + yAnimOffset, 4, 0, Math.PI*2, false);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
        
        ctx.fillStyle = black;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(.9, 1);
        ctx.translate(-cx, -cy);
        ctx.beginPath();
        ctx.arc(cx+18, cy+10 + yAnimOffset, 2, 0, Math.PI*2, false);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
        
        ctx.fillStyle = white;
        // Right eye
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(.9, 1);
        ctx.translate(-cx, -cy);
        ctx.beginPath();
        ctx.arc(cx+27, cy+10 + yAnimOffset, 4, 0, Math.PI*2, false);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
        
        ctx.fillStyle = black;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(.9, 1);
        ctx.translate(-cx, -cy);
        ctx.beginPath();
        ctx.arc(cx+27, cy+10 + yAnimOffset, 2, 0, Math.PI*2, false);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
    function nose(ctx, cx, cy){
        ctx.fillStyle = "#FE9802";
        ctx.beginPath();
        ctx.moveTo(cx+10,cy+10 + yAnimOffset);
        ctx.lineTo(cx+15,cy+15 + yAnimOffset);
        ctx.lineTo(cx+20,cy+10 + yAnimOffset);
        ctx.lineTo(cx+10,cy+10 + yAnimOffset);
        ctx.fill();
        ctx.closePath();
    }
    
    function feet(ctx, cx, cy){
        ctx.fillStyle = "#FE9802";
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(.8, 1);
        ctx.translate(-cx, -cy);
        ctx.beginPath();
        ctx.arc(cx+18 - yAnimOffset, cy+35, 5, 0, Math.PI*2, false);
        ctx.fill();
        ctx.arc(cx+30 + yAnimOffset, cy+35, 5, 0, Math.PI*2, false);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
    
    function arms(ctx, cx, cy){
        ctx.fillStyle = black;
        ctx.strokeStyle = white;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(3*(Math.PI/4));
        ctx.scale(.7, 1);
        ctx.translate(-cx, -cy);
        ctx.beginPath();
        ctx.arc(cx-12 - yAnimOffset, cy-40, 7, 0, Math.PI*2, false);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI/4);
        ctx.scale(.7, 1);
        ctx.translate(-cx, -cy);
        ctx.beginPath();
        ctx.arc(cx+30 - yAnimOffset, cy+11, 7, 0, Math.PI*2, false);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
    head(ctx, this.x, adjustedY, this.height, this.width);
    body(ctx, this.x+this.width/2, adjustedY+this.width/2, this.width/2-10);
    
    nose(ctx, this.x+5, adjustedY+5);
    eyes(ctx, this.x, adjustedY);
    feet(ctx, this.x, adjustedY);
    arms(ctx, this.x, adjustedY);
};

/*
 * A generic block (inherits from BaseObject)
 * It has a different type and draw function.
 * Additionally, it has a playerInteract function
 * which is called if a player "hits" it.
 */
function BlockObj(row, col, width, height){
    BaseObject.call(this, row, col, width, height);
    this.i = 0;
}
BlockObj.prototype = new BaseObject();
BlockObj.prototype.constructor = BlockObj;
BlockObj.prototype.type = types.BLOCK;
BlockObj.prototype.drawFn = function() {
    ctx.fillStyle = "#BFBFBF";
    ctx.strokeStyle = "#7F7F7F";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + topbarSize + cellSize);
    ctx.quadraticCurveTo(this.x, this.y + topbarSize + 10,this.x+5, this.y+topbarSize+5);
    ctx.quadraticCurveTo(this.x + cellSize/2, this.y + topbarSize - 10, this.x + cellSize-10, this.y+topbarSize+10);
    ctx.quadraticCurveTo(this.x + cellSize + 5, this.y + topbarSize + 20, this.x + cellSize, this.y+topbarSize + cellSize);
    ctx.lineTo(this.x, this.y + topbarSize + cellSize);    
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
};
/* This stops the player */
BlockObj.prototype.playerInteract = function(player){
    player.dr = 0;
    player.dc = 0;
    player.x = player.col*cellSize;
    player.y = player.row*cellSize;
};
BlockObj.prototype.reset = function() {
    this.x = this.col*cellSize;
    this.y = this.row*cellSize;
    this.dc = 0;
    this.dr = 0;
};

function SlideObj(row, col, width, height) {
    BlockObj.call(this, row, col, width, height);
}
SlideObj.prototype = new BlockObj();
SlideObj.prototype.constructor = SlideObj;
SlideObj.prototype.type = types.SLIDE;
SlideObj.prototype.drawFn = function(){
    ctx.fillStyle = "#C1E4FF";
    ctx.strokeStyle = "#8FBDDE";
    ctx.beginPath();
    ctx.moveTo(this.x,this.y+topbarSize+cellSize);
    ctx.lineTo(this.x, this.y+topbarSize+10);
    ctx.lineTo(this.x+cellSize-10, this.y+topbarSize+10);
    ctx.lineTo(this.x+cellSize-10, this.y+topbarSize+cellSize);
    ctx.lineTo(this.x, this.y+topbarSize+cellSize);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y+topbarSize+10);
    ctx.lineTo(this.x + 10, this.y+topbarSize);
    ctx.lineTo(this.x + cellSize, this.y+topbarSize);
    ctx.lineTo(this.x+cellSize-10, this.y+topbarSize+10);
    ctx.lineTo(this.x, this.y+topbarSize + 10);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(this.x + cellSize, this.y+topbarSize);
    ctx.lineTo(this.x + cellSize, this.y+topbarSize+cellSize-10);
    ctx.lineTo(this.x + cellSize-10, this.y+topbarSize+cellSize);
    ctx.lineTo(this.x + cellSize-10, this.y+topbarSize+10);
    ctx.lineTo(this.x + cellSize, this.y+topbarSize);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
};

/*
 * A pair of portal blocks that, when touched, spits you
 * out at the other portal
 */
function PortalObj(id, row, col, width, height){
    BaseObject.call(this, row, col, width, height);
    this.id = id;
    this.otherRow = 0;
    this.otherCol = 0;
}
PortalObj.prototype = new BaseObject();
PortalObj.prototype.constructor = PortalObj;
PortalObj.prototype.type = types.PORTAL;
PortalObj.prototype.drawFn = function(){	
	var oldWidth = ctx.lineWidth;
	ctx.lineWidth = 6;
	var maxRad = cellSize/1.5;
	var intervalSize = maxRad/5;
	for (var i = 0; i < 5; i++) {		
		var rad = Math.max(0, 
			intervalSize * (i + ((frame % 100)/100))
		);
		var alpha = 1 - ((rad / maxRad) * 1);
        var hexStr = ''
        switch(this.id){
            case "a":
                hexStr = "#B7410E";
                break;
            case "b":
                hexStr = "#FF0000";
                break;
            case "c":
                hexStr = "#0000FF";
                break;
            case "x":
                hexStr = "#00FF00";
                break;
            case "e":
                hexStr = "#00FFFF";
                break;
            case "f":
                hexStr = "#FF00FF";
                break;
            case "g":
                hexStr = "#FFFF00";
                break;
            case "h":
                hexStr = "#000000";
                break;
            default:
                hexStr = "#121212";
                break;
        }
        var r = parseInt(hexStr.substring(1, 3), 16);
        var g = parseInt(hexStr.substring(3, 5), 16);
        var b = parseInt(hexStr.substring(5, 7), 16);
        ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
		ctx.beginPath();
		ctx.arc(this.x + cellSize/2, this.y + topbarSize + cellSize/2,
				rad, 0, 2*Math.PI, true);
		ctx.stroke();
		ctx.closePath();
	}
	ctx.lineWidth = oldWidth;
    
};
/* This stops the player */
PortalObj.prototype.playerInteract = function(player){
    player.row = this.otherRow + player.dr;
    player.col = this.otherCol + player.dc;
    player.x = player.col*cellSize;
    player.y = player.row*cellSize;
};


function ArrowObj(row, col, width, height, dir){
    BaseObject.call(this, row, col, width, height);
    this.dir = dir;
    this.color = "#00ffff";
    this.originalColor = "#00ffff";
    var pdr = 0;
    var pdc = 0;
    switch(dir){
        case "u":
            this.color = "#38D845";
            this.originalColor = "#38D845";
            pdr = -1;
            break;
        case "d":
            this.color = "#00ffff";
            this.originalColor = "#00ffff";
            pdr = 1;
            break;
        case "l":
            this.color = "#38D888";
            this.originalColor = "#38D888";
            pdc = -1;
            break;
        case "r":
            this.color = "#3895D8";
            this.originalColor = "#3895D8";
            pdc = 1;
            break;
    }
    this.pdr = pdr;
    this.pdc = pdc;
}
ArrowObj.prototype = new BaseObject();
ArrowObj.prototype.constructor = ArrowObj;
ArrowObj.prototype.type = types.ARROW;
ArrowObj.prototype.drawArrow = function(angle){
    ctx.save();
    ctx.beginPath();
    ctx.rotate(angle);
    ctx.moveTo(this.x, this.y + topbarSize + cellSize);
    ctx.lineTo(this.x + cellSize/2, this.y + cellSize/2 + topbarSize);
    ctx.lineTo(this.x+cellSize, this.y + topbarSize + cellSize);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + topbarSize + cellSize/2);
    ctx.lineTo(this.x + cellSize/2, this.y + topbarSize);
    ctx.lineTo(this.x + cellSize, this.y+ topbarSize + cellSize/2);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
}
ArrowObj.prototype.drawFn = function(){
    //ctx.strokeStyle = "#0099CC";
    ctx.strokeStyle = "white";
    ctx.fillStyle = this.color;
    switch(this.dir){
        case "u":
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + topbarSize + cellSize);
            ctx.lineTo(this.x + cellSize/2, this.y + cellSize/2 + topbarSize);
            ctx.lineTo(this.x+cellSize, this.y + topbarSize + cellSize);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + topbarSize + cellSize/2);
            ctx.lineTo(this.x + cellSize/2, this.y + topbarSize);
            ctx.lineTo(this.x + cellSize, this.y+ topbarSize + cellSize/2);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            break;
        case "d":
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + topbarSize);
            ctx.lineTo(this.x + cellSize/2, this.y + cellSize/2 + topbarSize);
            ctx.lineTo(this.x+cellSize, this.y+ topbarSize);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + topbarSize + cellSize/2);
            ctx.lineTo(this.x + cellSize/2, this.y + cellSize + topbarSize);
            ctx.lineTo(this.x + cellSize, this.y+ topbarSize + cellSize/2);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            break;
        case "l":
            ctx.beginPath();
            ctx.moveTo(this.x+cellSize, this.y + topbarSize);
            ctx.lineTo(this.x + cellSize/2, this.y + cellSize/2 + topbarSize);
            ctx.lineTo(this.x+cellSize, this.y+ topbarSize + cellSize);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x + cellSize/2, this.y + topbarSize);
            ctx.lineTo(this.x, this.y + cellSize/2 + topbarSize);
            ctx.lineTo(this.x + cellSize/2, this.y+ topbarSize + cellSize);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            break;
        case "r":
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + topbarSize);
            ctx.lineTo(this.x + cellSize/2, this.y + cellSize/2 + topbarSize);
            ctx.lineTo(this.x, this.y+ topbarSize + cellSize);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x + cellSize/2, this.y + topbarSize);
            ctx.lineTo(this.x + cellSize, this.y + cellSize/2 + topbarSize);
            ctx.lineTo(this.x + cellSize/2, this.y+ topbarSize + cellSize);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            break;
    }
};
/* Change the player's direction */
ArrowObj.prototype.playerInteract = function(player){
    setTimeout((function(that){
        return function () {
            that.color = that.originalColor;
           };
          })(this), 250);
    this.color = "yellow";
    if(this.pdr !== 0){
        player.dr = this.pdr;
        player.dc = 0;
        player.col = this.col;
        player.x = player.col*cellSize;
    }
    else{
        player.dc = this.pdc;
        player.dr = 0;
        player.row = this.row;
        player.y = player.row*cellSize;
    }
};


function BombObj(row, col, width, height){
    BaseObject.call(this, row, col, width, height);
}
BombObj.prototype = new BaseObject();
BombObj.prototype.constructor = BombObj;
BombObj.prototype.type = types.BOMB;
BombObj.prototype.drawFn = function(){
    ctx.fillStyle = "#008080";
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(this.x+cellSize/2, this.y+topbarSize+cellSize/2, this.width/2 - 5, 0, 2*Math.PI, true);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(this.x + (3/5) * cellSize, this.y+topbarSize + 7);
    ctx.lineTo(this.x + (3/5) * cellSize + 3, this.y+topbarSize + 2);
    ctx.lineTo(this.x + (3/5) * cellSize + 7, this.y+topbarSize + 4);
    ctx.lineTo(this.x + (3/5) * cellSize + 5, this.y+topbarSize + 7);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "#A24C00";
    ctx.moveTo(this.x + (3/5) * cellSize + 4, this.y+topbarSize + 2);
    ctx.quadraticCurveTo(this.x + cellSize - 5, this.y+topbarSize - 5, this.x + cellSize, this.y+topbarSize)
    ctx.stroke();
    ctx.quadraticCurveTo(this.x + cellSize, this.y+topbarSize + 5, this.x+cellSize + 8, this.y+topbarSize-2);
    ctx.stroke();
    ctx.closePath();    
};
/* This kills the player */
BombObj.prototype.playerInteract = function(player, state){
    if(player.type === types.PLAYER) {
        player.x = player.startCol*cellSize;
        player.y = player.startRow*cellSize;
        player.dr = 0;
        player.dc = 0;
        deaths++;
        this.reset();
        state.levels[state.curLevel].resetLevel();
    }
    else if(player.type === types.SLIDE) {
        this.row = -1;
        this.col = -1;
        this.x = this.col*cellSize;
        this.y = this.row*cellSize;
    }
};


/*
 * A generic block (inherits from BaseObject)
 * It has a different type and draw function.
 * Additionally, it has a playerInteract function
 * which is called if a player "hits" it.
 */
function FinishObj(row, col, width, height){
    BaseObject.call(this, row, col, width, height);
}
FinishObj.prototype = new BaseObject();
FinishObj.prototype.constructor = FinishObj;
FinishObj.prototype.type = types.FINISH;
FinishObj.prototype.drawFn = function(){
    ctx.fillStyle = "#F2F2F2";
    ctx.strokeStyle = "gray";
    ctx.save();
    ctx.lineWidth = '1';
    ctx.beginPath();
    ctx.arc(this.x + cellSize/2, this.y + topbarSize + cellSize/2 + 5, cellSize/2+4, Math.PI-.1, 2*Math.PI+.1, false);
    ctx.closePath();     
    ctx.fill();
    ctx.stroke();
     
    ctx.beginPath();
    ctx.arc(this.x+4, this.y + topbarSize + cellSize/2 + 6, 11, Math.PI-.1, 2*Math.PI+.1, false);
    ctx.closePath();     
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.arc(this.x+4, this.y + topbarSize + cellSize/2 + 6, 6, Math.PI-.1, 2*Math.PI+.1, false);
    ctx.closePath();     
    ctx.fill();
    //ctx.stroke();
    ctx.restore();
};
/* This stops the player */
FinishObj.prototype.playerInteract = function(player){
    if(player.type === types.PLAYER) {
        state.nextLevel();
    }
};


/*
 * A very basic map that stores references to all the objects
 * currently in the game. They are stored in a grid, which is
 * used for interaction logic (even though the player technically
 * "slides" between grid squares, it's always treated as occupying
 * exactly one grid square at a time).
 */
function GameMap(rows, cols){
    this.rows = rows;
    this.cols = cols;
    // Create 2d Array representation of the map
    this.grid = new Array(rows);
    for(var i = 0; i < this.grid.length; i++){
        this.grid[i] = new Array(cols);
        for(var j = 0; j < cols; j++){
            this.grid[i][j] = new BaseObject(i, j, cellSize, cellSize);
        }
    }
    this.update = function(state) {
        var that = this;
        var obj;
        for(var i = 0; i < this.grid.length; i++){
            for(var j = 0; j < cols; j++){
                obj = this.grid[i][j];
                if (obj.type !== types.EMPTY) {
                    this.grid[i][j] = new BaseObject(i, j, cellSize, cellSize);
                }
            }
        }
        var thisLevel = state.levels[state.curLevel];
        thisLevel.blocks.forEach(function(obj){
            var row = obj.row;
            var col = obj.col;
            var rows = that.rows;
            var cols = that.cols;
            if(row >= 0 && col >= 0 && row < rows && col < cols)
                that.grid[row][col] = obj;
        });
    };
}

/*
 * Takes a level and a pattern and creates objects for that level
 * which match the pattern.
 * The pattern is a list of rows, where each row is a string of
 * 1 digit integers. Each integer corresponds to a player, block, or
 * empty space.
 * ex:
 ["1002",    This pattern corresponds to a map with 3 rows and 4 cols.
  "0300",    The player starts at the top left, and there are 2 blocks
  "0020"]    and an exit.
 * Exception: portals are specified with a character (a-z). Each portal
 * should have a matching portal of the same ID (there should be 2 a's, 
 * 2 b's, etc).
 */
function importPattern(level, pattern) {
    var row = 0;
    var col = 0;
    if(pattern.length !== level.map.rows || 
       pattern[0].length !== level.map.cols){
        console.log("Pattern doesn't match grid size");
        return;
    }
    var portalMatches = {};
    for (row = 0; row < pattern.length; row++) {
        rowStr = pattern[row];
        for(col = 0; col < rowStr.length; col++) {
            var cha = rowStr[col];
            if(charToObj[cha] === undefined){
                var id = rowStr[col];
                var obj = new PortalObj(id, row, col, cellSize, cellSize);
                var match = portalMatches[id]
                if(match === undefined) {
                    portalMatches[id] = [row, col];
                }
                else{
                    var otherRow = match[0];
                    var otherCol = match[1]
                    obj.otherRow = otherRow;
                    obj.otherCol = otherCol;
                    level.map.grid[otherRow][otherCol].otherRow = row;
                    level.map.grid[otherRow][otherCol].otherCol = col;
                }
                level.addObject(obj, level);
            }
            else {
                level.addObject(new charToObj[cha](row, col, cellSize, cellSize, cha), level);
            }
        }
    }
}


/*
 * A level which takes a timerDelay, rows, cols,
 * and a pattern which describes the layout of the level.
 * This includes the game map,
 * lists of players and blocks, and some functions for game control.
 * Note that the players/blocks are stored in 2 data types: lists
 * of each respective object and a grid with their locations.
 */
function GameLevel(timerDelay, rows, cols, pattern, title) {
    this.map = new GameMap(rows, cols);
    this.timerDelay = timerDelay;
    this.title = title;
    // The types of objects stored in the game state
    // Used in [redraw,update]All to loop through all objects
    this.objTypes = ["players", "blocks"];
    // Initialize an array of player objects
    this.players = new Array();
    // Initialize an array of block objects
    this.blocks = new Array();
    /* Add an object to the game state by putting it in
       the correct list and adding it to the grid */
    this.addObject = function(object, self) {
        if(self === undefined)
            self = this;
        var otype = object.type;
        if(otype === types.PLAYER) {
            self.players.push(object);
            return;
        }
        else if(blocks.indexOf(otype) !== -1 || onBlocks.indexOf(otype) !== -1){
            self.blocks.push(object);
        }
        else if(otype !== types.EMPTY){
            console.log("Invalid object type " + otype);
            return;
        }
        self.map.grid[object.row][object.col] = object;
    };
    importPattern(this, pattern);
    this.pattern = pattern;
    /* Clears the canvas and redraws all the objects */
    this.redrawAll = function() {
        ctx.clearRect(0, topbarSize, canvas.width, canvas.height-topbarSize);
        ctx.fillStyle = "rgb(229,244,255)";
        ctx.fillRect(0, topbarSize, canvas.width, canvas.height-topbarSize);
        /* SOME FUNCTION THAT DRAWS BG */
        this.blocks.forEach(function(block){
            block.drawFn();
        });
        this.players.forEach(function(player){
            player.drawFn();
        });
    };
    /* Calls the update function on all the objects */
    this.updateAll = function(state) {
        var tdelt = this.timerDelay;
        for(var i = 0; i < this.objTypes.length; i++){
            this[this.objTypes[i]].forEach(function (obj) {
                obj.update(state, tdelt);
            });
        }
        this.map.update(state);
    };
    this.resetLevel = function(){
        this.blocks = [];
        this.players = [];
        var rows = this.map.rows;
        var cols = this.map.cols;
        this.map = new GameMap(rows, cols);
        importPattern(this, this.pattern);
    };
    /* If the player is not moving, change the player's speed/direction */
    this.keyPress = function(code) {
        var lCode = 37;
        var rCode = 39;
        var uCode = 38;
        var dCode = 40;
        var rKeyCode = 82;
        var escCode = 27;
        var dr = 0;
        var dc = 0;
        switch(code) {
            case lCode:
                dc = -1;
                break;
            case rCode:
                dc = 1;
                break;
            case uCode:
                dr = -1;
                break;
            case dCode:
                dr = 1;
                break;
            case rKeyCode:
                for(var i = 0; i < this.players.length; i++){
                    if(this.players[i].dr !== 0 || this.players[i].dc !== 0)
                        return;
                }
                deaths++;
                this.resetLevel();
                return;
            case escCode:
                startScreen();
                return;
        }
        var player;
        for (var i = 0; i < this.players.length; i++){
            player = this.players[i];
            if(player.dr === 0 && player.dc === 0) {
                var nrow, ncol;
                nrow = player.row + dr;
                ncol = player.col + dc;
                if(this.map.grid[nrow][ncol].type === types.SLIDE){
                    this.map.grid[nrow][ncol].dr = dr;
                    this.map.grid[nrow][ncol].dc = dc;
                }
                this.players[i].dr = dr;
                this.players[i].dc = dc;
            }
        }
    };
};


/*
 * Stores the whole of the game state. 
 * This has all the levels and functions to call their timer functions.
 */
function GameState(timerDelay) {
    this.timerDelay = timerDelay;
    this.curLevel = -1;
    this.levels = new Array();
    this.addLevel = function(rows, cols, pattern, title) {
        this.levels.push(new GameLevel(this.timerDelay, rows, cols, pattern, title));
    };
    /* Clears the canvas and redraws all the objects */
    this.redrawAll = function(state) {
        if(this.curLevel === -1)
            return;
        this.levels[this.curLevel].redrawAll(state);
        updateTopbar(this);
    };
    /* Calls the update function on all the objects */
    this.updateAll = function(state) {
		frame++;
		if (frame % animSpeed === 0) {
			animIndex = (animIndex + 1) % 2;
		}
        if(this.curLevel === -1)
            return;
        this.levels[this.curLevel].updateAll(state);
    };
    var state = this;
    /* Starts the game by setting up the update/redraw intervals */
    this.startGame = function(curLevel) {
        this.curLevel = curLevel;
        this.stop();
        this.upInt = setInterval(function(){state.updateAll(state)}, state.timerDelay);
        this.drawInt = setInterval(function(){state.redrawAll(state)}, state.timerDelay);
    };
    this.stop = function(){
        if(this.upInt !== undefined)
            clearInterval(this.upInt);
        if(this.drawInt !== undefined)
            clearInterval(this.drawInt);
    };
    this.keyPress = function(code) {
        if(this.curLevel === -1)
            return;
        var plusCode = 221;
        var minusCode = 219;
        if(code === plusCode && this.curLevel < this.levels.length-1){
            this.startGame(this.curLevel+1);
        }
        else if(code === minusCode && this.curLevel > 0){
            this.startGame(this.curLevel-1);
        }
        else
            this.levels[this.curLevel].keyPress(code);
    };
    this.nextLevel = function(){
        this.levels[this.curLevel].resetLevel();
        this.startGame(this.curLevel+1);
    };
}

/* Updates the top bar with level, and lives left */
function updateTopbar(state){
    var level = state.curLevel;
    var title = state.levels[level].title;
    ctx.fillStyle = "rgb(193,228,255)";
    ctx.clearRect(0,0,canvas.width, topbarSize);
    ctx.fillRect(0,0,canvas.width, topbarSize);
    ctx.fillStyle = "black";
    ctx.font = "26px Segoe UI";
    if(title !== "---winlevel---"){
        var levelMeasure = ctx.measureText("Level " + parseInt(level+1));
        ctx.fillText("Level " + parseInt(level+1), 10, 35);
        ctx.fillText(" - " + title, 10+levelMeasure.width, 35);
        ctx.fillStyle = "rgb(240,121,2)";
        ctx.font = "16px Segoe UI";
        ctx.fillText("Deaths: " + deaths, canvas.width - 90, 20);
    }
    else{
        var str = "You died " + deaths + " times. Hit esc to try again!"; 
        var levelMeasure = ctx.measureText(str);
        ctx.fillText(str, (canvas.width - levelMeasure.width)/2, 35);
    }
}

/* This function draws the start screen and adds click listeners
 * to either start the game or go to the level editor
 */
function startScreen(){
    ctx.fillStyle = "rgb(198,210,216)";
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.save();
    ctx.font = "55px Segoe UI";
    ctx.fillStyle = 'black';
    var centerSpacing = canvas.width/2 - 95;
    ctx.fillText("Pen", centerSpacing, canvas.height/2);
    var pen = ctx.measureText("Pen");
    ctx.fillStyle = 'white';
    var g = ctx.measureText("g");
    ctx.fillText("g", centerSpacing+pen.width, canvas.height/2);
    ctx.fillStyle = 'black';
    ctx.fillText("uin", centerSpacing+pen.width+g.width,canvas.height/2);
    ctx.font = "11px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("a game inspired by Pokemon", canvas.width/2, canvas.height/2 + 50);
    
    // Buttons
    ctx.fillStyle = "rgb(229,244,255)";
    ctx.strokeStyle = "rgb(193,228,255)";
    roundedRect(ctx, canvas.width/2 - 70, canvas.height - 220, 150, 75, 10);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = "rgb(253,128,3)";
    ctx.font = "25px Segoe UI";
    ctx.fillText("Start!", canvas.width/2 + 5, canvas.height - 175);
    
    ctx.fillStyle = "rgb(229,244,255)";
    roundedRect(ctx, canvas.width/2 - 70, canvas.height - 100, 150, 75, 10);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = "rgb(253,128,3)";
    ctx.font = "25px Segoe UI";
    ctx.fillText("Create Level", canvas.width/2 + 5, canvas.height - 55);
    
    ctx.restore();
    canvas.addEventListener('mousedown', chooseMode, false);
    if(window.state !== undefined)
        state.stop();
}

function chooseMode(event){
    var x = event.pageX - canvas.offsetLeft;  // do not use event.x, it's not cross-browser!!!
    var y = event.pageY - canvas.offsetTop;
    if (x > 330 & x < 480){
      if(y > 430 && y < 500){
        canvas.removeEventListener('mousedown', chooseMode);
        canvas.addEventListener('keydown', onKeyDown, false);
        resetAll();
      }else if(y > 550 && y < 625){
        canvas.removeEventListener('mousedown', chooseMode);
        editGame();
      }
    }
}

/* This function is called when a user clicks edit game on the start screen */
function editGame(){
    var panelSize = 50; // Set a side panel where a user can select a block
    topbarSize = 0; // Remove the top score bar
    
    /* Create a grid containing anything placed down in the canvas */
    editGrid = new Array(15);
    for(var i = 0; i < editGrid.length; i++){
        editGrid[i] = new Array(20);
    }
    
    canvas.width += panelSize;
    canvas.height -= topbarSize;
    
    // Reset the canvas to a blank map
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = iceColor;
    ctx.fillRect(0, 0, canvas.width-panelSize, canvas.height);
    drawPanel(panelSize);
    canvas.addEventListener('mousedown', pickBlock, false);
}

/* This function draws the side panel where a user can select
 *  a block while creating a level
 */
function drawPanel(panelSize){
    ctx.fillStyle = "#C1E4FF";
    ctx.fillRect(canvas.width-panelSize, 0, panelSize, canvas.height);
    
    /* Draw blocks */
    var pBlock = new PlayerObj(1.1, 20.1, cellSize, cellSize);
    pBlock.drawFn();
    
    var bBlock = new BlockObj(3.1, 20.1, cellSize, cellSize);
    bBlock.drawFn();
    
    var sBlock = new SlideObj(5.1, 20.1, cellSize, cellSize);
    sBlock.drawFn();
    
    var boBlock = new BombObj(7.1, 20.1, cellSize, cellSize);
    boBlock.drawFn();
    
    var fBlock = new FinishObj(9.1, 20.15, cellSize, cellSize);
    fBlock.drawFn();
    
    var uBlock = new ArrowObj(11.1, 20.1, cellSize, cellSize, "u");
    uBlock.drawFn();
    
    var dBlock = new ArrowObj(13.1, 20.1, cellSize, cellSize, "r");
    dBlock.drawFn();
    
    ctx.fillStyle = "rgb(229,244,255)";
    ctx.strokeStyle = "rgb(193,228,255)";
    roundedRect(ctx, canvas.width - panelSize, 600, 50, 30, 10);
    ctx.fill();
    ctx.stroke();
    ctx.font = "14px Segoe UI";
    ctx.fillStyle = "rgb(240,121,2)";
    ctx.fillText("PLAY", canvas.width - panelSize + 8, 620);
}

// from: https://developer.mozilla.org/en-US/docs/Canvas_tutorial/Drawing_shapes
function roundedRect(ctx,x,y,width,height,radius){
    ctx.beginPath();
    ctx.moveTo(x,y+radius);
    ctx.lineTo(x,y+height-radius);
    ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
    ctx.lineTo(x+width-radius,y+height);
    ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
    ctx.lineTo(x+width,y+radius);
    ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
    ctx.lineTo(x+radius,y);
    ctx.quadraticCurveTo(x,y,x,y+radius);
    ctx.stroke();
}

/* This function allows a user to click on a block
   while in the level creator. The block will highlight
   and they can then place it on the canvas */
function pickBlock(evt){
    /* Get the mouse coordinates */
    var x = evt.pageX - canvas.offsetLeft;
    var y = evt.pageY - canvas.offsetTop;
    var panelSize = 50;
    /* Check if the click was within the side panel */
    if(x > 800 && x < 840){
        if(y > 35 && y < 85){ // Clicked on the penguin
            drawPanel(panelSize);
            ctx.fillStyle = "rgba(128,128,128,0.75)";
            ctx.fillRect(canvas.width - panelSize, 35, panelSize, panelSize);
            selected = 'player';
        }else if(y > 120 && y < 170){ // Block
            drawPanel(panelSize);
            ctx.fillStyle = "rgba(128,128,128,0.75)";
            ctx.fillRect(canvas.width - panelSize, 120, panelSize, panelSize);
            selected = 'block';
        }else if(y > 200 && y < 250){ // Slider
            drawPanel(panelSize);
            ctx.fillStyle = "rgba(128,128,128,0.75)";
            ctx.fillRect(canvas.width - panelSize, 200, panelSize, panelSize);
            selected = 'slide';
        }else if(y > 280 && y < 330){ // Bomb
            drawPanel(panelSize);
            ctx.fillStyle = "rgba(128,128,128,0.75)";
            ctx.fillRect(canvas.width - panelSize, 280, panelSize, panelSize);
            selected = 'bomb';
        }else if (y > 360 && y < 410){ // Finish
            drawPanel(panelSize);
            ctx.fillStyle = "rgba(128,128,128,0.75)";
            ctx.fillRect(canvas.width - panelSize, 360, panelSize, panelSize);
            selected = 'finish';
        }else if (y > 440 && y < 490){ // Up Arrow
            drawPanel(panelSize);
            ctx.fillStyle = "rgba(128,128,128,0.75)";
            ctx.fillRect(canvas.width - panelSize, 440, panelSize, panelSize);
            selected = 'up';
        }else if (y > 520 && y < 570){ // Right Arrow
            drawPanel(panelSize);
            ctx.fillStyle = "rgba(128,128,128,0.75)";
            ctx.fillRect(canvas.width - panelSize, 520, panelSize, panelSize);
            selected = 'right';
        }else if (y > 600 && y < 650){ // Play button
            playEditedGame();
        }
    }
    
    // If the user clicked somewhere in the canvas, place the selected block
    if(x < 800){
        var gridX, gridY;
        if(selected !== null && selected !== undefined){
            gridY = Math.floor(x/cellSize);
            gridX = Math.floor(y/cellSize);
            if(editGrid[gridX][gridY] !== undefined){
                return;
            }
            switch(selected){
                case 'player':{
                    var p = new PlayerObj(gridX, gridY, cellSize, cellSize);
                    p.drawFn();
                    editGrid[gridX][gridY] = types.PLAYER;
                    break;
                }
                case 'block':{
                    var p = new BlockObj(gridX, gridY, cellSize, cellSize);
                    p.drawFn();
                    editGrid[gridX][gridY] = types.BLOCK;
                    break;
                }
                case 'slide':{
                    var p = new SlideObj(gridX, gridY, cellSize, cellSize);
                    p.drawFn();
                    editGrid[gridX][gridY] = types.SLIDE;
                    break;
                }
                case 'bomb':{
                    var p = new BombObj(gridX, gridY, cellSize, cellSize);
                    p.drawFn();
                    editGrid[gridX][gridY] = types.BOMB;
                    break;
                }
                case 'finish':{
                    var p = new FinishObj(gridX, gridY, cellSize, cellSize);
                    p.drawFn();
                    editGrid[gridX][gridY] = types.FINISH;
                    break;
                }
                case 'up':{
                    var p = new ArrowObj(gridX, gridY, cellSize, cellSize, "u");
                    p.drawFn();
                    editGrid[gridX][gridY] = "u";
                    break;
                }
                case 'right':{
                    var p = new ArrowObj(gridX, gridY, cellSize, cellSize, "r");
                    p.drawFn();
                    editGrid[gridX][gridY] = "r";
                    break;
                }
            }
        }
    }
}

/* This function will go through the edited map grid and convert to a pattern
 * The pattern will then be added to a global variable, and run whenever the user
 * starts a new game */
function playEditedGame(){
    canvas.removeEventListener('mousedown',pickBlock);
    canvas.width -= 50;
    topbarSize = 50;
    editedLevel = new Array(15);
    for(var i = 0; i < editGrid.length; i++){
        var patternLevel = "";
        for(var j = 0; j < editGrid[i].length; j++){
            if(editGrid[i][j] === undefined){
                patternLevel += types.EMPTY;
            }else{
                patternLevel += editGrid[i][j];
            }
        }
        editedLevel[i] = patternLevel;
    }
    canvas.addEventListener('keydown', onKeyDown, false);
    resetAll();
}


/* This function ends the game and removes all key listeners */
function endGame(){
    ctx.fillStyle = "rgba(128,128,128,0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("You Lose!", canvas.width/2, canvas.height/2);
    ctx.fillText("Press any key to retry", canvas.width/2, canvas.height/2 + 50);
    ctx.restore();
    canvas.removeEventListener('keydown', onKeyDown);
    canvas.addEventListener('keydown', continueGame, false);
}

/* Function to continue the game after death */
function continueGame(event){
    clearInterval(state.upInt);
    clearInterval(state.drawInt);
    canvas.removeEventListener('keydown', continueGame);
    canvas.addEventListener('keydown', onKeyDown, false);
    resetAll();
}

function onKeyDown(event) {
    state.keyPress(event.keyCode);
}


// Create a new state and add level
function resetAll(){
        state = new GameState(10);
        deaths = 0;
        // Check if an editedLevel was created. If it is, add it to the game
        if(editedLevel !== undefined && editedLevel !== null){
            state.addLevel(15,20,editedLevel, 'Custom Level');
        }
        /* Empty Level 
        state.addLevel(15, 20, ["00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000"],
                                "");
        */
        /* Each new element introduced should have 3-5 levels devoted to it.
           1: (Relatively) trivial introduction level
           2: Puzzle using new element
           3: Tricky puzzle using new element
           4(opt): Integrate element with other elements (med difficulty)
           5: Hard integrated puzzle
           
           Elements should be introduced in this order:
           Basic Blocks
           Bombs
           Sliding Blocks
           Direction Changers
           Portals
           (OPT) Multiple players?

           Key:
           EMPTY  - 0
           PLAYER - 1
           BLOCK  - 2
           FINISH - 3
           PORTAL - 4 (use matching chars for matching portals (a-z)
           BOMB   - 5
           SLIDE  - 6
           ARROW  - 7 (use the chars u, d, l, and r for arrows)
        */
        // Basic Blocks
        state.addLevel(15, 20, ["00000000000000000000",
                                "02222222222222222220",
                                "02000000000000000020",
                                "02010000000000000020",
                                "02000000000000000020",
                                "02000000000000000020",
                                "02000000000000000020",
                                "02000000000000000020",
                                "02000000000000000320",
                                "02000000000000000020",
                                "02000000000000000020",
                                "02000000000000000020",
                                "02000000000000000020",
                                "02222222222222222220",
                                "00000000000000000000"],
                                "Get to the Igloo. Use Thy Arrow Keys.");
        state.addLevel(15, 20, ["00000000000000000000",
                                "02222222222222222220",
                                "02200000000000000020",
                                "02000000000000000020",
                                "02010000000000200020",
                                "02020000000000000020",
                                "02030000000000000020",
                                "02000000000000000020",
                                "02000000000000000020",
                                "02200000000000000020",
                                "02000000000002000020",
                                "02000000000000000020",
                                "02000000000000000020",
                                "02222222222222222220",
                                "00000000000000000000"],
                                "Hit r if you get stuck. Hit esc if you're done.");
        state.addLevel(15, 20, ["00000000000000000000",
                                "00000000300000000000",
                                "00000000000000200000",
                                "00020000000200000200",
                                "00000000000000000000",
                                "00000200000000000000",
                                "00000000000020000200",
                                "00000000000000000000",
                                "00020000020000000000",
                                "00000020000000000020",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000010000020000",
                                "00020000000000000000",
                                "00000000000000000000"],
                                "Watch Your Step");
        // Bombs
        state.addLevel(15, 20, ["00000000006666000000",
                                "00000000555500600000",
                                "00000555555500060000",
                                "00055000005500006000",
                                "00553000000550006000",
                                "00500001000250000000",
                                "05000000000005000000",
                                "05000000000005000000",
                                "05000000000005000000",
                                "05000000000005000000",
                                "05000000000005000000",
                                "00520000000050000000",
                                "00550000002550000000",
                                "00055000005500000000",
                                "00000555550000000000"],
                                "Don't Explode!");
        state.addLevel(15, 20, ["00000000500000000002",
                                "02002500000000200000",
                                "00000000020000000002",
                                "00000000000000000200",
                                "00000000000000000000",
                                "50200000000000000000",
                                "20020000010000000000",
                                "00000000003005000000",
                                "00000000000000002020",
                                "00000005000200000000",
                                "00002000000000000000",
                                "02000000000000020000",
                                "00000000200000500000",
                                "00000005000000000000",
                                "00000000000000000000"],
                                "So Close, Yet So Far");
        state.addLevel(15, 20, ["00000030000200000000", 
                                 "20000000000020000000", 
                                 "00200000000000500000", 
                                 "00000000000000000200", 
                                 "00000005002000000002", 
                                 "20000000000005000000", 
                                 "00000000000000005000", 
                                 "00000000000000000000",
                                 "00000000000200000000", 
                                 "00020000000000210020",
                                 "00050200000050000000",
                                 "02000000002000000000",
                                 "00000000000052000000",
                                 "00000000000000000200",
                                 "00000000000000200000"],
                                 "You Got That Boom Boom Pow.");

        // Sliding Blocks
        state.addLevel(15, 20, ["00000000000000000000",
                                "00000000000000000000",
                                "00001000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00006000000000002000",
                                "00000000300000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000006000000020",
                                "00000000000000000000"],
                                "Give It a Shove");
        state.addLevel(15, 20, ["05000000000000000000",
                                "30000000000020000000",
                                "20000000000000000000",
                                "00000000000000000005",
                                "02000000000000000000",
                                "00000060000000000000",
                                "00000000000000000000",
                                "00000000000000600000",
                                "00002006000000000000",
                                "00000060000000002000",
                                "00000200000000000000",
                                "00000000000000000000",
                                "00000000000600000100",
                                "00000000000000000000",
                                "00000000000000000000"],
                                "To Push or Not To Push?");
        state.addLevel(15, 20, ["00000000000030000000",
                                "00000000002000000000",
                                "00000000000200000000",
                                "00220000060066200000",
                                "00200000060060200000",
                                "00260600000000000000",
                                "00216020000000000000",
                                "20060000000000000500",
                                "00202222220220222222",
                                "05222000060006006000",
                                "00000000002000000000",
                                "00000200006000000000",
                                "00000006000020000000",
                                "00000000000000000000",
                                "00000002000200000000"],
                                "Don't Get Stuck");
        // Introduce Sliding blocks destroying bombs
        state.addLevel(15, 20, ["00000000000000000000",
                                "00000000000000020000",
                                "00000000000020050000",
                                "02000000050000600000",
                                "00210000000000200000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000060000",
                                "00050000000060002000",
                                "00000000000002000000",
                                "00030000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000"],
                                "Rock Paper Scissors Ice Bomb");
        state.addLevel(15, 20, ["05500005500505005000",
                                "00005005000006005502",
                                "05500005500000005050",
                                "00050200550250500000",
                                "00550005000500020000",
                                "00200000500000000000",
                                "55005055655005505055",
                                "55505556165550555525",
                                "00000000655055505205",
                                "02060000500000000002",
                                "00050500500050000002",
                                "00220000055000200050",
                                "00500500500200000050",
                                "05000005500505550553",
                                "00055500500000005000"],
                                "Clear a Path");

        // Direction Changers
        state.addLevel(15, 20, ["00000000000000000000",
                                "00d000000000l0000000",
                                "00000000000000000000",
                                "0000000d0000000l0000",
                                "00000000000000000000",
                                "00000dl0000000000000",
                                "00000r0030d000l00000",
                                "00000000000000000000",
                                "000000u000l000000000",
                                "0000000r000000u00000",
                                "00000000000212000000",
                                "00000000000222000000",
                                "00000000000000000000",
                                "00r000000000000u0000",
                                "00000000000000000000"],
                                "What Do the Arrows Mean?");
        state.addLevel(15, 20, ["00100000000000000000",
                                "0000d000000000000l00",
                                "000d000000000000l000",
                                "000000000200000l0000",
                                "00000000000000000000",
                                "0000300000r000600002",
                                "00052000000000000000",
                                "000000000d0000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00r00200000000000000",
                                "000000000000000u0000",
                                "0000r000020000000000",
                                "00000000r0000000u000"],
                                "Take the Right Path. Or Maybe the Left One.");
        state.addLevel(15, 20, ["00030000000000000000",
                                "d00000000l0r00000020",
                                "0000000000000d006000",
                                "00000000000000000000",
                                "02000000000000000000",
                                "0600d00000000l000000",
                                "62000000000000000000",
                                "00000000002000000000",
                                "00000000000000000r02",
                                "200000000000d0000000",
                                "00000000020000000000",
                                "0000l000000000000000",
                                "00000000000020000000",
                                "00000000000200000000",
                                "000000000u0060010000"],
                                "Block Collector");
        state.addLevel(15, 20, ["00200000000000000000",
                                "02100000000000000000",
                                "0200l00d00l00d00l000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "020l0000000000000000",
                                "00000000000000000000",
                                "0000u00l00u00l000000",
                                "00000000000000006003",
                                "20000000000000000200",
                                "00200000000000000000",
                                "0r0u0000000000000000"],
                                "Timing is Everything. Don't Be Late.");

        // Portals
        state.addLevel(15, 20, ["00000000000000000000",
                                "000100000a0000000000",
                                "00000000000000000000",
                                "00020000000000000000",
                                "000000000000000c0000",
                                "000000c00000000x0000",
                                "000000x00000000e0000",
                                "000000e00000000f0000",
                                "000000f00000000g0000",
                                "000000g0000000030000",
                                "000b0000000000000b00",
                                "00000000000000000000",
                                "00000000000000000000",
                                "000a0000000000000020",
                                "00000000000000000000"],
                                "Now You're Thinking With Portals.");
        state.addLevel(15, 20, ["d0000l00000000000000",
                                "00000600000000000000",
                                "00000000000000000000",
                                "d0060000000000a00000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000a00000000120000",
                                "00000000000000200000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "r0000000000000000020",
                                "00000000000000030000"],
                                "Recycle, Reuse, Reportal.");
        state.addLevel(15, 20, ["00000000000000000000",
                                "00000600000000l00000",
                                "00100000000000b00000",
                                "u0000000000000l00000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "0b000a00000000000200",
                                "00000000000000000000",
                                "000000000a0000000000",
                                "00200000000000000000",
                                "00000000060000000000",
                                "00000000600000000000",
                                "00000000000000002000",
                                "00000000000000000030"],
                                "Direction Matters.");

        // Shadow Player
        state.addLevel(15, 20, ["00000000000000000000",
                                "00222222222222222200",
                                "00210000000000000200",
                                "00222222222222220200",
                                "00000000000000020200",
                                "00000000000000020200",
                                "00000000000000023200",
                                "00000000000000022200",
                                "00000000000000020200",
                                "00000000000000020200",
                                "00000000000000020200",
                                "00222222222222220200",
                                "00280000000000000200",
                                "00222222222222222200",
                                "00000000000000000000"],
                                "Only One Penguin Must Finish...");
        state.addLevel(15, 20, ["00000000000000000000",
                                "00000000000e00000000",
                                "00010000000000002000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000300000000000000",
                                "00000000000000020000",
                                "00000000000000000000",
                                "00008000000200000000",
                                "00000000000000000000",
                                "0000000000e000000000"],
                                "...But Don't Let the Shadow Die");
        state.addLevel(15, 20, ["0200000r000000000002",
                                "210000000000000000x0",
                                "0200000000000000r00d",
                                "00x0000020000000f000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "f0l00000000000000000",
                                "u0000000000000000000",
                                "00000000020000000003",
                                "22222222222222222222",
                                "00rdrdrdrdrdrdrdrdrd",
                                "00000000000000000000",
                                "02000000000000000000",
                                "28u00000000000000000",
                                "020rurururururururu5"],
                                "Get To The Finish. FAST.");
        state.addLevel(15, 20, ["00000000000300000000",
                                "000rd000000000000200",
                                "002000000000000000rd",
                                "000060000000000000ul",
                                "00000000000000000000",
                                "0d000000000000000000",
                                "00200000000000000000",
                                "20000000000002000000",
                                "02002000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00100000000000000800",
                                "00000000000000000000"],
                                "Ramirez! Get Me That Block!");
        state.addLevel(15, 20, ["00000000000000000000",
                                "080000000000000e0000",
                                "00002000000000000000",
                                "000000000000000f0000",
                                "0000000000000d000000",
                                "00000003000000000020",
                                "00e0u200000000000000",
                                "00026000000000060000",
                                "00000000000000000000",
                                "00000000000000000000",
                                "00000006000000000000",
                                "00000006r00002000000",
                                "000000212000000000u0",
                                "00000002000020000000",
                                "000f0000000000002000"],
                                "Rescue Mission");

        // Auto Win
        state.addLevel(15, 20, ["5505350q5r00drdrd000",
                                "rd0555d000l0ruru00fd",
                                "ub0000a1da0000000d00",
                                "5rd05005r0u55dl50000",
                                "xdl55rurd0r00b000l00",
                                "0rd0505u0l055ru00500",
                                "0dlrdul5r0u0550rc500",
                                "0r0u05055055500ul500",
                                "erd0r0u00r00000000u0",
                                "ruc0000d50550r8dl550",
                                "5505555r0u0h00lru050",
                                "55rd5d00000lr0g0000l",
                                "5dle0000500000555050",
                                "500000d00g00f05q50rd",
                                "53xu0lr00u05005550uh"],
                                "A Lot \"Harder\" Than It Looks");


        // Win Screen
        state.addLevel(15, 20, ["a666666666666666666b",
                                "60000000000000000006",
                                "60000000000000001006",
                                "62020rrrd02002000006",
                                "62020u10d02002000006",
                                "60200u00d02002000006",
                                "60200ulll02222000006",
                                "60010000000000000026",
                                "60020002022202002026",
                                "60020002002102202026",
                                "60020302002002022006",
                                "60002020022202002026",
                                "60000000000000000006",
                                "60000000000000000006",
                                "e666666666666666666c"],
                                "---winlevel---");
        state.startGame(0);
}
startScreen();
