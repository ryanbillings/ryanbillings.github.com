$(document).ready(function(){

    // Globals
    var keyCodes = { 
                    'LEFT' : 37,
                    'RIGHT' : 39,
                    'w' : 87,
                    'a' : 65,
                    's' : 83,
                    'd' : 68
                    };
    var currSlide = 1;
    var MAX_SLIDES = 4;
    var cellSize = 20;
    var numCells = 20;
    var oppositeDirections = {
        "T" : "B",
        "B" : "T",
        "L"  : "R",
        "R"  : "L"
    };
    var pRow, pCol;
    var mazeListener;
    
    var touchX, touchY = 0;
    
    // Sets for Maze
    var grid;
    var cardinalGrid;
    
    // Canvas
    var canvas = document.getElementById("myCanvas");
    canvas.focus();
    var ctx = canvas.getContext("2d");
    
    // Accelerometer
    var accelerometer;
    
    function Vertex(row,col){
        this.row = row;
        this.col = col;
    }
    
    function Edge(v1,v2){
        this.v1 = v1;
        this.v2 = v2;
    }
    
    // Initialization
    function setupSite(){
        buildMaze();
        attachListeners();
    }

    // Event Listeners
    function attachListeners(){
        slideShowListener();
    }
    
    function tiltGameListener(){
        var lastAccel = accelerometer.getLast();

        if(lastAccel.x < -4 && lastAccel.z > 4){
            moveRight();
            checkWin();
        }else if(lastAccel.x > 4 && lastAccel.z > 4){
            moveLeft();
            checkWin();
        }else if(lastAccel.y < -5 && parseInt(lastAccel.x) == 0){
            moveDown();
            checkWin();
        }else if(lastAccel.y > -2 && parseInt(lastAccel.x) == 0){
            moveUp();
            checkWin();
        }
    }
    
    /** 
     * SLIDE SHOW
    **/
    function slideShowListener(){
        $(document).keydown(function(e){
            var key = e.keyCode;
            if(key == keyCodes.LEFT){
                moveSlide(true);
            }
            else if(key == keyCodes.RIGHT){
                moveSlide(false);
            }
        });
        
        // Swipe Events
        $(document).on('touchstart',function(event){
            var e = event.originalEvent;
            touchX = e.changedTouches[0].pageX;
            touchY = e.changedTouches[0].pageY;
            e.preventDefault();
        });
        $(document).on('touchmove', function(event){
            event.originalEvent.preventDefault();
        });
        $(document).on('touchend',function(event){
            var e = event.originalEvent;
            var xDelta = 0;
            var yDelta = 0;
            var distX = touchX - e.changedTouches[0].pageX;
            var distY = touchY - e.changedTouches[0].pageY;
            if(distX > 0 && Math.abs(distY) < 120){
                moveSlide(false);
            }
            else if(distX < 0 && Math.abs(distY) < 120){
                moveSlide(true);
            }
            e.preventDefault();
        });
    }
    
    function moveSlide(left){
        if(left){
            if(currSlide > 1){
                currSlide -= 1;
                $("#slideContainer").animate({
                    marginLeft: "+=800px"
                }, {duration:458, queue:true}, function(){
                    // End Slide Left
                });
            }
        }else{
            if(currSlide < MAX_SLIDES){
                currSlide += 1;
                $("#slideContainer").animate({
                    marginLeft: "-=800px"
                }, {duration:458, queue:true}, function(){
                   // End Slide Right
                });
            }
        }
    }
    
    /**
    * MAZE
    */
    function buildMaze(){
        // Clear the Maze
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = "#70B2E5";
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.strokeStyle = "gray";
        // Initialize the 2D Array for Maze
        
        grid = new Array(numCells);
        cardinalGrid = new Array(numCells);
        for (var i = 0; i < numCells; i++){
            grid[i] = new Array(numCells);
            cardinalGrid[i] = new Array(numCells);
            for(var j = 0; j < numCells; j++){
                ctx.strokeRect(j*cellSize,i*cellSize,cellSize,cellSize);
                // Initialize this Vertex
                grid[i][j] = false;
                cardinalGrid[i][j] = [];
            }
        }
        chooseStart();
    }
    
    function chooseStart(){
        var randomRow = Math.floor(Math.random() * numCells);
        var randomCol = Math.floor(Math.random() * numCells);
        console.log(randomRow,randomCol);
        ctx.fillStyle = "white";
        ctx.fillRect(randomCol * cellSize, randomRow * cellSize, cellSize, cellSize);
        runPrims(randomRow,randomCol);
    }
    
    function runPrims(row,col){
        grid[row][col] = true;
        var neighbors = generateNeighbors(row,col,[]);
        var mazeInterval = setInterval(function(){
            if(neighbors.length > 0){
            // Get a random neighbor
            var rand = Math.floor(Math.random()*neighbors.length)
            var randomNeighbor = neighbors[rand];
            // Draw this cell and mark it as added
            grid[randomNeighbor.row][randomNeighbor.col] = true;
            ctx.fillStyle = "white";
            ctx.fillRect(randomNeighbor.col*cellSize,randomNeighbor.row*cellSize,cellSize,cellSize);
            // Check what directions this cell connects to
            var directions = getDirections(randomNeighbor.row,randomNeighbor.col);
            if(directions.length > 1){
                drawMazeEdge(randomNeighbor.row,randomNeighbor.col,directions);
            }else{
                addCardinalDirection(randomNeighbor.row,randomNeighbor.col,directions[0]);
            }
            
            // Remove added cell from neighbor set
            connectedCell = neighbors.splice(rand,1);
            
            // Generate new neighbor set
            neighbors = generateNeighbors(randomNeighbor.row,randomNeighbor.col,neighbors);
            }else{
                clearInterval(mazeInterval);
                setupMazeGame();
            }
        },10);
    }
        
    // Returns the directions of the new cell that connect to the maze
    function getDirections(row,col){
        directions = [];
        if(row < numCells - 1 && grid[row+1][col] == true){
            directions.push("B");
        }
        if(row > 0 && grid[row-1][col] == true){
            directions.push("T");
        }
        if(col < numCells - 1 && grid[row][col+1] == true){
            directions.push("R");
        }
        if(col > 0 && grid[row][col-1] == true){
           directions.push("L");
        }
        return directions;
    }
    
    function addCardinalDirection(nRow,nCol,dir){
        var opp = oppositeDirections[dir];
        cardinalGrid[nRow][nCol].push(dir);
        addOppositeDirection(nRow,nCol,dir);
    }
    
    function addOppositeDirection(nRow,nCol,dir){
        if(dir == "B"){
            cardinalGrid[nRow+1][nCol].push("T");
        }else if(dir == "T"){
            cardinalGrid[nRow-1][nCol].push("B");
        }else if(dir == "L"){
            cardinalGrid[nRow][nCol-1].push("R");
        }else if(dir == "R"){
            cardinalGrid[nRow][nCol+1].push("L");
        }
    }
    
    function drawMazeEdge(nRow,nCol,dirs){
        var conn = dirs.splice(Math.floor(Math.random() * dirs.length),1);
        addCardinalDirection(nRow,nCol,conn[0]);
        for(var i = 0; i < dirs.length; i++){
            dir = dirs[i];
            if(dir == "B"){
                drawBottomEdge(nRow,nCol);
            }else if(dir == "T"){
                drawTopEdge(nRow,nCol);
            }else if(dir == "R"){
                drawRightEdge(nRow,nCol);
            }else if(dir == "L"){
                drawLeftEdge(nRow,nCol);
            }
        }
    }
    
    function drawLeftEdge(row,col){
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(col*cellSize,row*cellSize);
        ctx.lineTo(col*cellSize,(row+1)*cellSize);
        ctx.stroke();
        ctx.closePath();
    }
    
    function drawRightEdge(row,col){
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo((col+1)*cellSize,row*cellSize);
        ctx.lineTo((col+1)*cellSize,(row+1)*cellSize);
        ctx.stroke();
        ctx.closePath();
    }
    
    function drawBottomEdge(row,col){
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(col*cellSize,(row+1)*cellSize);
        ctx.lineTo((col+1)*cellSize,(row+1)*cellSize);
        ctx.stroke();
        ctx.closePath();
    }
    
    function drawTopEdge(row,col){
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(col*cellSize,row*cellSize);
        ctx.lineTo((col+1)*cellSize,row*cellSize);
        ctx.stroke();
        ctx.closePath();
    }
    
    function hasVertex(row,col,vertexSet){
        for(var i = 0; i < vertexSet.length; i++){
            var vertex = vertexSet[i];
            if(vertex.row == row && vertex.col == col){
                return true;
            }
        }
        return false;
    }
    
    function mazeFillRect(row,col,size,size){
        ctx.fillRect(col,row,size,size);
    }
    
    function generateNeighbors(row,col,currentNeighbors){
        // Check Left cells
        ctx.fillStyle = "pink";
        if(col > 0){
            if(grid[row][col-1] == false && hasVertex(row,col-1,currentNeighbors) == false){
                currentNeighbors.push(new Vertex(row,col-1));
                ctx.fillRect((col-1)*cellSize,row*cellSize,cellSize,cellSize);
            }
        }
        // Check Right cells
        if (col < cellSize-1){
            if(grid[row][col+1] == false && hasVertex(row,col+1,currentNeighbors) == false){
                currentNeighbors.push(new Vertex(row,col+1));
                ctx.fillRect((col+1)*cellSize,row*cellSize,cellSize,cellSize);
            }
        }
        // Check Bottom cells
        if (row > 0){
            if(grid[row-1][col] == false && hasVertex(row-1,col,currentNeighbors) == false){
                currentNeighbors.push(new Vertex(row-1,col));
                ctx.fillRect(col*cellSize,(row-1)*cellSize,cellSize,cellSize);
            }
        }
        // Check Top cells
        if (row < numCells - 1){
            if(grid[row+1][col] == false && hasVertex(row+1,col,currentNeighbors) == false){
                currentNeighbors.push(new Vertex(row+1,col));
                ctx.fillRect(col*cellSize,(row+1)*cellSize,cellSize,cellSize);
            }
        }
        return currentNeighbors;
    }
    
    /**
    * Listener to display WASD images on hover
    */
    function mazeHoverListener(){
        $("#myCanvas").click(function(e){
            e.stopPropagation();
            $("#wasd").fadeIn().fadeOut();
            return false;
        });
    }
    
    /**
    * PLAY MAZE
    */
    function setupMazeGame(){
        pRow = 0;
        pCol = 0;
       $(document).keydown(function(e){
            var key = e.keyCode;
            if(key == keyCodes.w){
                moveUp();
                checkWin();
            }else if(key == keyCodes.a){
                moveLeft();
                checkWin();
            }else if(key == keyCodes.s){
                moveDown();
                checkWin();
            }else if(key == keyCodes.d){
                moveRight();
                checkWin();
            }
        });
        // Get accelerometer set up
        accelerometer = new Accelerometer();
        accelerometer.startListening();
        
        if(window.util.isIOS() || window.util.isAndroid()){
            drawFn = setInterval(function(){
                tiltGameListener();
            },500);
        }
        
        drawPlayer();
        drawGoal();
    }
    
   
    
    function checkWin(){
        if(pRow == numCells-1 && pCol == numCells-1){
            $(canvas).fadeOut(1000,function(){
                $("#youWin").fadeIn();
                $("#hint").fadeOut();
            });
        }
    }
    
    function drawPlayer(){
        ctx.fillStyle = "#67C452";
        ctx.beginPath();
        ctx.arc(pCol*numCells + cellSize/2,pRow*numCells + cellSize/2,cellSize/3,0, Math.PI*2, true); 
        ctx.closePath();
        ctx.fill();
    }
    
    function drawGoal(){
        ctx.fillStyle = "#EAAE09";
        ctx.save();
        ctx.beginPath();
        ctx.translate((numCells-1) * cellSize + cellSize/2,(numCells-1) * cellSize + cellSize/2);
        ctx.moveTo(0,0-8);
        for (var i = 0; i < 5; i++)
        {
            ctx.rotate(Math.PI / 5);
            ctx.lineTo(0, 0 - (10*0.5));
            ctx.rotate(Math.PI / 5);
            ctx.lineTo(0, 0 - 10);
        }
        ctx.fill();
        ctx.restore();   
    }
    
    function moveUp(){
        if(cardinalGrid[pRow][pCol].indexOf("T") != -1){
            ctx.fillStyle = "white";
            ctx.fillRect(pCol*numCells+2,pRow*numCells+2,cellSize-3,cellSize-3);
            pRow = pRow - 1;
            drawPlayer();
        }
    }
    
    function moveDown(){
        if(cardinalGrid[pRow][pCol].indexOf("B") != -1){
            ctx.fillStyle = "white";
            ctx.fillRect(pCol*numCells+2,pRow*numCells+2,cellSize-3,cellSize-3);
            pRow = pRow + 1;
            drawPlayer();
        }
    }
    
    function moveLeft(){
        if(cardinalGrid[pRow][pCol].indexOf("L") != -1){
            ctx.fillStyle = "white";
            ctx.fillRect(pCol*numCells+2,pRow*numCells+2,cellSize-3,cellSize-3);
            pCol = pCol - 1;
            drawPlayer();
        }
    }
    
    function moveRight(){
        if(cardinalGrid[pRow][pCol].indexOf("R") != -1){
            ctx.fillStyle = "white";
            ctx.fillRect(pCol*numCells+2,pRow*numCells+2,cellSize-3,cellSize-3);
            pCol = pCol + 1;
            drawPlayer();
        }
    }

    setupSite();

});