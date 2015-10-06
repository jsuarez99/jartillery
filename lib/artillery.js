/*

Copyright (c) 2011 Joshua Suarez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

/* -----------------------------------------------------------------------
   Global Variables
   -----------------------------------------------------------------------  */

var curGameData;  //A GameVars class

/* -----------------------------------------------------------------------
   GameVars class - Stores data about the game
   -----------------------------------------------------------------------  */

function GameVars(){
	this.groundHeight = new Array();

	//Arrays for tank positions, [0] for x, [1] for y
	this.tankAPos = new Array();
	this.tankBPos = new Array();

	//current aiming angle (in radians)
	this.curTheta = 0;

	this.counter = 0;  //counter for the timer
	this.timer = 0;  //timer ID
	this.turn = true; //Which player's turn is it; true for A, false for B

	this.circleExpandedRadius = 25; //radius for the exploding shell
	this.circleCurrentRadius = 2; //current radius of the shell
	this.hitOnce = false; //true if score has been affect on hit; with this
			      //the score will go down as the shell is exploding

	//Player health
	this.playerAHealth = 100;
	this.playerBHealth = 100;
}


/* ------------------------------------------------------------------------
   fire - Sets the interval timer for the fired shell
   ------------------------------------------------------------------------ */

function fire(e){
	$('#artilleryCanvas').unbind();
	curGameData.timer = setInterval("drawFiringArc()",30);
}

/* ------------------------------------------------------------------------
   tankCollision - checks if the shell collides with either tank and subtracts
       from that tank's health
   ------------------------------------------------------------------------ */

function tankCollision(xPos,yPos){

	//Sorry for the huge if statements folks

	if( ( (xPos+curGameData.circleCurrentRadius >= curGameData.tankAPos[0] 
		|| xPos-curGameData.circleCurrentRadius >= curGameData.tankAPos[0]) && 
	      (xPos+curGameData.circleCurrentRadius <= curGameData.tankAPos[0]+15 
		|| xPos-curGameData.circleCurrentRadius <= curGameData.tankAPos[0]+15) )&& 
	    ( (yPos+curGameData.circleCurrentRadius >= curGameData.tankAPos[1] 
                || yPos-curGameData.circleCurrentRadius >= curGameData.tankAPos[1] ) && 
	      (yPos+curGameData.circleCurrentRadius <= curGameData.tankAPos[1]+10 
		|| yPos-curGameData.circleCurrentRadius <= curGameData.tankAPos[1]+10) ) ){
			curGameData.playerAHealth -= 10;
			$("#p1score p").html(curGameData.playerAHealth);
			return true;
	}
	else if( ( (xPos+curGameData.circleCurrentRadius >= curGameData.tankBPos[0] 
		|| xPos-curGameData.circleCurrentRadius >= curGameData.tankBPos[0]) && 
	      (xPos+curGameData.circleCurrentRadius <= curGameData.tankBPos[0]+15 
		|| xPos-curGameData.circleCurrentRadius <= curGameData.tankBPos[0]+15) )&& 
	    ( (yPos+curGameData.circleCurrentRadius >= curGameData.tankBPos[1] 
                || yPos-curGameData.circleCurrentRadius >= curGameData.tankBPos[1] ) && 
	      (yPos+curGameData.circleCurrentRadius <= curGameData.tankBPos[1]+10 
		|| yPos-curGameData.circleCurrentRadius <= curGameData.tankBPos[1]+10) ) ){
			curGameData.playerBHealth -= 10;
			$("#p2score p").html(curGameData.playerBHealth);
			return true;
	}

	return false;
}

/* ------------------------------------------------------------------------
   drawFiringArc - draws the shell that will travel in a fired trajectory
   ------------------------------------------------------------------------ */

function drawFiringArc(){
	var tankCoords;
	var bulletSpeed = 200;
	if(curGameData.turn){
		tankCoords = curGameData.tankAPos;
		bulletSpeed = $("input#p1amount").val();
	}
	else{
		tankCoords = curGameData.tankBPos;
		bulletSpeed = $("input#p2amount").val();
	}

	var xComponent = bulletSpeed * Math.cos(curGameData.curTheta);
	var yComponent = bulletSpeed * Math.sin(curGameData.curTheta);
	var xDisplacement = xComponent * (curGameData.counter/1000) * 2;
	var yDisplacement = (yComponent * curGameData.counter/1000) + 
		(0.5 * Math.pow(-9.8,2) * Math.pow(curGameData.counter/1000,2));

	var ctx = document.getElementById('artilleryCanvas').getContext('2d');
	redrawField(document.getElementById('artilleryCanvas'));

	ctx.save();
	ctx.strokeStyle = "#0000FF";
	ctx.fillStyle = "#0000FF";
	ctx.beginPath();

	var circleX = tankCoords[0] + 7 + xDisplacement;
	var circleY = (tankCoords[1]-5) + yDisplacement;

	ctx.arc(circleX,circleY,curGameData.circleCurrentRadius,0,Math.PI*2,true);
	ctx.fill();
	ctx.stroke();
	ctx.restore();

	curGameData.hitOnce = tankCollision(circleX,circleY);  //Checks for a direct hit at this point
	
	//Check if the shell leaves the screen or hits the floor or a tank
	if(circleY >= curGameData.groundHeight[Math.floor(circleX)] || curGameData.hitOnce){
		clearInterval(curGameData.timer);

		curGameData.counter = 2;  //Set this to be the current radius of the circle
		curGameData.timer = setInterval("expandRadius("+circleX+","+circleY+")",15);
		return;
	}
	else if(circleX >= 640 || circleX <= 0){
		clearInterval(curGameData.timer);
		curGameData.counter = 0;
		curGameData.turn = !curGameData.turn;

		//restore event handlers
		$("#artilleryCanvas").mousemove(function(event){
			getMouseCoords(event);
		});
	
		$("#artilleryCanvas").click(function(event){
			fire(event);
		});

		redrawField(document.getElementById('artilleryCanvas'));
	}
	else
		curGameData.counter += 30;
}


/* ------------------------------------------------------------------------
   expandRadius - Draws the expanding shell by increasing its radius by one
      during each clock tick.  Takes the coordinates of the shell as parameters
   ------------------------------------------------------------------------ */

function expandRadius(circleX,circleY){
	var ctx = document.getElementById('artilleryCanvas').getContext('2d');
	redrawField(document.getElementById('artilleryCanvas'));

	ctx.save();
	ctx.strokeStyle = "#0000FF";
	ctx.fillStyle = "#0000FF";
	ctx.beginPath();

	curGameData.circleCurrentRadius = ++curGameData.counter;

	ctx.arc(circleX,circleY,curGameData.circleCurrentRadius,0,Math.PI*2,true);
	ctx.fill();
	ctx.stroke();
	ctx.restore();

	//Draw a smaller inner black circle
	ctx.save();
	ctx.strokeStyle = "#000000";
	ctx.beginPath();
	ctx.arc(circleX,circleY,curGameData.circleCurrentRadius-5,0,Math.PI*2,true);
	ctx.stroke();
	ctx.restore();

	if(!curGameData.hitOnce) //check for an impact, once detected, don't subtract any more health
		curGameData.hitOnce = tankCollision(circleX,circleY);  //Checks for an indirect hit

	if(curGameData.counter >= curGameData.circleExpandedRadius){
		//Reset game data variables
		clearInterval(curGameData.timer);
		curGameData.counter = 0;
		curGameData.turn = !curGameData.turn;
		curGameData.circleCurrentRadius = 2; //reset to initial value or the circle expands forever
		curGameData.hitOnce = false;
		
		//if the score is 0, end the game
		if(curGameData.playerAHealth == 0 || curGameData.playerBHealth == 0){
			$("body").append("<div id='gameover'><p id='endmsg'>" +
				"Game Over</p><button onclick='javascript:location.reload(true)'" +
				">Restart</button></div>");
		}
		else{
			//restore event handlers
			$("#artilleryCanvas").mousemove(function(event){
				getMouseCoords(event);
			});
	
			$("#artilleryCanvas").click(function(event){
				fire(event);
			});

			redrawField(document.getElementById('artilleryCanvas'));
		}
	}
}


/* ------------------------------------------------------------------------
   getMouseCoords - grabs mouse coordinates over the canvas
   code from:
   http://www.quirksmode.org/js/events_properties.html 
   ------------------------------------------------------------------------ */
function getMouseCoords(e) {
	var canvas=document.getElementById('artilleryCanvas');
	var posx = 0;
	var posy = 0;
	if (!e) var e = window.event;
	if (e.pageX || e.pageY){
		posx = e.pageX;
		posy = e.pageY;
	}
	else if (e.clientX || e.clientY){
		posx = e.clientX + document.body.scrollLeft
			+ document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop
			+ document.documentElement.scrollTop;
	}
	
	posx -= canvas.offsetLeft;
	posy -= canvas.offsetTop;
	
	redrawField(canvas);
	if(curGameData.turn)
		curGameData.curTheta = drawAimLine(curGameData.tankAPos,posx,posy);
	else
		curGameData.curTheta = drawAimLine(curGameData.tankBPos,posx,posy);
	//drawFireArc(aimAngle,curGameData.tankAPos);

	//$("#coords").html("(" + posx + "," + posy + "): " + aimAngle);
	/*if( posy >= curGameData.groundHeight[Math.floor(posx)] ){
		$("#aboveBelow").html("Below");
	}
	else{
		$("#aboveBelow").html("Above");
	}*/
}


/* -----------------------------------------------------------------------
   drawAimLine - draw a line that will help the user when they aim
     tankPos = array from the GameVars object holding a tank's position
     mouseX & mouseY = current mouse positions 
   ----------------------------------------------------------------------- */

function drawAimLine(tankPos,mouseX,mouseY){
	//The tank is now the "origin" so we find what the new x and y
	//values are
	var adjX = mouseX - tankPos[0];
	var adjY = mouseY - tankPos[1];
	var angle = 0;

	//Get the angle between the mouse and the tank's x-position
	if(adjX == 0)
		angle = adjY >= 0 ? Math.PI/2 : -(Math.PI/2);
	else
		angle = Math.atan2(adjY,adjX) ;

	if(angle < 0)
		angle += 2 * Math.PI;

	//Begin drawing the line
	var ctx = document.getElementById('artilleryCanvas').getContext('2d');
	ctx.save();
	ctx.strokeStyle = "green";
	ctx.translate(tankPos[0] + 7, tankPos[1] - 5);
	ctx.rotate(angle-Math.PI/2);
	ctx.moveTo(0,50);
	ctx.lineTo(0,0);
	ctx.stroke();
	ctx.restore();

	return angle;
}


/* -----------------------------------------------------------------------
   redrawField - Draw the field again to clear out any lines drawn.
     Uses the initialized curGameData variable
     cv = canvas element
   ----------------------------------------------------------------------- */

function redrawField(cv){
	
	if(curGameData == undefined)
		return;

	cv.width = cv.width;
	var ctx=cv.getContext('2d');
	//ctx.clearRect(0,0,cv.width,cv.height);  //cant figure out how to get this to work atm

	//Fill the background of the screen to be black
	ctx.save();
	ctx.fillStyle='#000000';
	ctx.fillRect(0,0,cv.width,cv.height);

	ctx.fillStyle = "#567E3A";  //forest green
	//Draw the terrain
	for(var i = 0; i < cv.width; i++){
		ctx.fillRect(i, curGameData.groundHeight[i], 0.5,
			cv.height-curGameData.groundHeight[i]);
	}

	//draw the tanks
	ctx.fillStyle='#FF0000';
	ctx.fillRect(curGameData.tankAPos[0],curGameData.tankAPos[1],15,10);
	ctx.fillStyle='#00FF00';
	ctx.fillRect(curGameData.tankBPos[0],curGameData.tankBPos[1],15,10);
	ctx.restore();
}


/* -----------------------------------------------------------------------
   initField - Paint the background and draw the mountains
      returns a GameVars object 
   ----------------------------------------------------------------------- */

function initField(){
	var canvas=document.getElementById('artilleryCanvas');
	var canvasHeight = canvas.height;
	var canvasWidth = canvas.width;
	var ctx=canvas.getContext('2d');

	var coordData = new GameVars();

	//Fill the background of the screen to be black
	ctx.fillStyle='#000000';
	ctx.fillRect(0,0,canvasWidth,canvasHeight);

	//generate a random number that is at most 50% of the canvas height
	var halfHeight = canvasHeight / 2;
	var rand = Math.floor(Math.random() * halfHeight);
	ctx.fillStyle = "#567E3A";  //forest green

	//Draw the terrain
	for(var i = 0; i < canvasWidth; i++){
		var groundTop = canvasHeight - rand;  //Y coord of the line
		ctx.fillRect(i, groundTop, 0.5, rand); //(x,y,width,height)
		coordData.groundHeight[i] = groundTop;

		//modify the height of the line by random number in the range of 10 to -10
		rand += (Math.random() * 11) - (Math.random() * 11); 
		
		//don't let the ground go too high or below the canvas	
		if(groundTop >= canvasHeight){
			rand = 1;
		}
		else if( groundTop <= halfHeight ){ 
			rand -= (Math.random() * 11)
		}
	}

	//Set the tanks in random positions on each half of the screen
	coordData.tankAPos = initTank(0,canvasWidth/2,coordData.groundHeight);
	ctx.fillStyle='#FF0000';
	ctx.fillRect(coordData.tankAPos[0],coordData.tankAPos[1],15,10);

	coordData.tankBPos = initTank((canvasWidth/2)-15,canvasWidth-15,coordData.groundHeight);
	ctx.fillStyle='#00FF00';
	ctx.fillRect(coordData.tankBPos[0],coordData.tankBPos[1],15,10);

	return coordData;
}


/* -----------------------------------------------------------------------
   initTanks - get a random (x,y) position for a tank above the ground
      minX & maxX = the X range we want the tank to appear in
      coordData = a GameVar object with the groundHeight data populated
   ----------------------------------------------------------------------- */

function initTank(minX, maxX, groundData){
	var tankCoords = new Array();
	
	//Place the tanks somewhere on the each side of the field
	tankCoords[0] = Math.floor(Math.random() * maxX);
	if(tankCoords[0] < minX)
		tankCoords[0] += minX;
	
	/* highest will keep track of the highest point in the range of
	   the tank's width */
	var lowest = 10000;
	for(var i = tankCoords[0]; i < tankCoords[0]+15; i++){
		if(lowest > groundData[i])
			lowest = groundData[i];
	}

	tankCoords[1] = lowest - 10;
	return tankCoords;
}


/* -----------------------------------------------------------------------
   READY FUNCTIONS
   -----------------------------------------------------------------------  */

$(function(){
	$("#artilleryCanvas").mousemove(function(event){
		getMouseCoords(event);
	});
	
	$("#artilleryCanvas").click(function(event){
		fire(event);
	});

	curGameData = initField();
});

//For the sliders
$(function() {
	$( "#p1slider-vertical" ).slider({
		orientation: "vertical",
		range: "min",
		min: 0,
		max: 400,
		value: 200,
		slide: function( event, ui ) {
			$( "#p1amount" ).val( ui.value );
		}
	});
	$( "#p1amount" ).val( $( "#p1slider-vertical" ).slider( "value" ) );
	
	$( "#p2slider-vertical" ).slider({
		orientation: "vertical",
		range: "min",
		min: 0,
		max: 400,
		value: 200,
		slide: function( event, ui ) {
			$( "#p2amount" ).val( ui.value );
		}
	});
	$( "#p2amount" ).val( $( "#p2slider-vertical" ).slider( "value" ) );
});