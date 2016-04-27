//Initializes variables
var socket = io();

playerData = null;
yourTurn = null;
canPlay = false;

//This function returns text based on if it is your turn
function checkTurn(){
	var turnText;
	if (yourTurn){
		turnText = "Your Turn"
	}else{
		turnText = "Other player is making their move..."
	}
	
	document.getElementById("turn").innerHTML = turnText
}

socket.on("connect", function(){
	console.log(socket.id)
})

//Gets player info and initializes turn, data and letter
socket.on("playersJoined", function(joinInfo){
	playerData = joinInfo
	yourTurn = joinInfo.turn
	document.getElementById("player").innerHTML = "Letter: " + joinInfo.letter

	checkTurn()
})

//Runs once 2 people have joined
socket.on("gameStart", function(){
	document.getElementById("gameState").innerHTML = "Game has started"
	canPlay = true
})

//Runs when player disconnected
socket.on("playerDisconnect", function(){
	document.getElementById("gameState").innerHTML = "The other player left"
	canPlay = false
})

socket.on("winnerDetermined", function(winner){
	if (winner){
		document.getElementById("gameState").innerHTML = "You Won!"
	}else{
		document.getElementById("gameState").innerHTML = "You Lost..."
	}
	
	canPlay = false
})

//Changes class of box based on the letter that is in it
function addClassByLetter(boxId, letter){
	if (letter == "X"){
		document.getElementById(boxId).className += " playerX" 
	}else if (letter == "O"){
		document.getElementById(boxId).className += " playerY"
	}
}

//Switches turns and checks for winner
socket.on("otherTurn", function(){
	if (checkWinner()){
		socket.emit("winner", playerData)
	}else{
		yourTurn = false
		checkTurn()
	}
})

//Switches turn to yours and also updates the board after last move
socket.on("yourTurn", function(info){
	document.getElementById(info.boxPlayed).innerHTML = info.letter
	
	addClassByLetter(info.boxPlayed, info.letter)
	
	yourTurn = true
	checkTurn()
})

//This compares any amount of arguments you inputs
function areEqual(){
	var len = arguments.length;
	for (var i = 1; i< len; i++){
		console.log(arguments[i])
		if (arguments[i] == null || arguments[i] == "" || arguments[i] != arguments[i-1]){
			return false;
		}
	}
	return true;
}

function checkWinner(){
	//Gets values of each box in the game
	box1 = document.getElementById("1").innerHTML
	box2 = document.getElementById("2").innerHTML
	box3 = document.getElementById("3").innerHTML
	
	box4 = document.getElementById("4").innerHTML
	box5 = document.getElementById("5").innerHTML
	box6 = document.getElementById("6").innerHTML
	
	box7 = document.getElementById("7").innerHTML
	box8 = document.getElementById("8").innerHTML
	box9 = document.getElementById("9").innerHTML
	
	isWinner = false
	
	//Checks top 3 boxes
	if (areEqual(box1, box2, box3)){
		isWinner = true
	
	//Checks middle 3 boxes
	}else if (areEqual(box4, box5, box6)){
		isWinner = true
	}
	
	//Checks bottom 3 boxes
	else if (areEqual(box7, box8, box9)){
		isWinner = true
	}
	
	//Checks left vertical 3 boxes
	else if (areEqual(box1, box4, box7)){
		isWinner = true
	}
	
	//Checks middle vertical 3 boxes
	else if (areEqual(box2, box5, box8)){
		isWinner = true
	}
	
	//Checks right vertical 3 boxes
	else if (areEqual(box3, box6, box9)){
		isWinner = true
	}
	
	//Checks downward slope diagnol 3 boxes
	else if (areEqual(box1, box5, box9)){
		isWinner = true
	}
	
	//Checks downward slope diagnol 3 boxes
	else if (areEqual(box3, box5, box7)){
		isWinner = true
	}
	
	return isWinner
}



function boxClick(box){
	if (canPlay){
		if (yourTurn){
			if ( document.getElementById(box.id).innerHTML == ""){
				document.getElementById(box.id).innerHTML = playerData.letter
				
				addClassByLetter(box.id, playerData.letter)
				
				movePlayed = {
					player: playerData,
					box: box.id
				}
				
				socket.emit("playedMove", movePlayed)
			}
		}
	}
}
