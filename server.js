var express = require('express')
var app = express()
var path = require('path')
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
})

function getRandomInt(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

//This sets the combination of what letter each player will get
function assignLetter(){
	number = getRandomInt(0, 1)
	if (number == 0){
		players = ["X", "O"]
	}else if (number == 1){
		players = ["O", "X"]
	}
	return players
}

//This sets the combination of who will start the game
function assignTurn(){
	number = getRandomInt(0, 1)
	if (number == 0){
		turn = [true, false]
	}else if (number == 1){
		turn = [false, true]
	}
	return turn
}

function getOtherPlayer(player){
	var otherPlayer;
	
	if (playerData[0].playerNumber == player.playerNumber){
		otherPlayer = playerData[1]
	}else if (playerData[1].playerNumber == player.playerNumber){
		otherPlayer = playerData[0]
	}
	
	return otherPlayer
}


function removeDisconnectedPlayer(socket){
	for (i = 0; i < playerData.length; i ++){
		var currentSocket = playerData[i]
		if (currentSocket.id == socket.id){
			playerData.splice(i, 1)
			break
		}
	}
}

letters = assignLetter()
turn = assignTurn()
playerData = []

io.on('connection', function(socket){
	console.log("Connection")
	usersOn = socket.conn.server.clientsCount
	
	joinInfo = {}
 	
	joinInfo = {
		id: socket.id,
		playerNumber: usersOn,
		letter: letters[(usersOn - 1)],
		turn: turn[usersOn - 1],
	}
	
	playerData.push(joinInfo)
		
	socket.emit("playersJoined", joinInfo)
        
    if (usersOn == 2){
        io.sockets.emit("gameStart")
    }
    
	socket.on('disconnect', function(){
        console.log("Disconnect")
        		
		removeDisconnectedPlayer(socket)
				
		io.sockets.emit("playerDisconnect")
		
		usersOn -= 1
	})
	
	socket.on("winner", function(player){
		var otherPlayer = getOtherPlayer(player)
		
		io.to(player.id).emit("winnerDetermined", true)
		io.to(otherPlayer.id).emit("winnerDetermined", false)
	})
	
	socket.on("playedMove", function(movePlayed){
		var otherPlayer = getOtherPlayer(movePlayed.player)
		
		info = {
			boxPlayed: movePlayed.box,
			letter: movePlayed.player.letter
		}
		io.to(otherPlayer.id).emit("yourTurn", info)
		io.to(movePlayed.player.id).emit("otherTurn")
	})
	
})

http.listen(4000, function(){
	console.log('listening on *:4000')
})
