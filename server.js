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

//This is when you don't have the playerData and you only have the player Id.
//This returns the whole player data when only the playerId is available
function findOtherPlayer(playerId){
	for (var room in gameRooms){
		for (var i = 0; i < gameRooms[room].length; i++){
			gameRooms[room][i].id
			if (playerId == gameRooms[room][i].id){
				return gameRooms[room][i]
			}
		}
	}
}

//This is when you have the playerData
function getOtherPlayer(player){
	var playerData = gameRooms[player.roomId]
	var otherPlayer;
	
	if (playerData[0].playerNumber == player.playerNumber){
		otherPlayer = playerData[1]
	}else if (playerData[1].playerNumber == player.playerNumber){
		otherPlayer = playerData[0]
	}
	
	return otherPlayer
}

function findPlayerRoom(playerId){
	for (var room in gameRooms){
		for (var i = 0; i < gameRooms[room].length; i++){
			gameRooms[room][i].id
			if (playerId == gameRooms[room][i].id){
				return room
			}
		}
	}
	
	//This means the player does not have a room
	return false
}

//This is used to switch who starts the game at every new game
function randomizePlayerTurn(playerData){
	turn = assignTurn()
	
	playerData[0].turn = turn[0]
	playerData[1].turn = turn[1]
	
	return playerData
}

function getRoomId(){
	return getRandomInt(1, 10000)
}

function initStartValues(){
	letters = assignLetter()
	turn = assignTurn()
	playerData = []
	usersOn = 1
	roomId = getRoomId()
}

function removePlayerFromRoom(playerId){
	for (var i = 0; i < playerData.length; i++){
		if (playerId == playerData[i].id){
			playerData.splice(i, 1)
			return
		}
	}
}

initStartValues()

gameRooms = {}

io.on('connection', function(socket){
	console.log("\nConnection")
	
	joinInfo = {}
 	
	joinInfo = {
		id: socket.id,
		roomId: roomId,
		playerNumber: usersOn,
		letter: letters[(usersOn - 1)],
		turn: turn[usersOn - 1],
	}
	
	playerData.push(joinInfo)
	
	usersOn ++
		
	socket.emit("playersJoined", joinInfo)
	
	//if (Object.keys(gameRooms).length == 0){}
	
    if (usersOn > 2){
		gameRooms[roomId] = playerData
		io.to(playerData[0].id).emit("gameStart")
		io.to(playerData[1].id).emit("gameStart")
		initStartValues()
    }
	
	socket.on("winner", function(player){
		var otherPlayer = getOtherPlayer(player)
		
		io.to(player.id).emit("winnerDetermined", {youWon: true, winningLetter: player.letter})
		io.to(otherPlayer.id).emit("winnerDetermined", {youWon: false, winningLetter: player.letter})
	})
	
	////////////////////////////////////////////////////////////////////////////////
	//CHANGE THIS WHEN YOU HAVE THE CHANCE IT EMITS TO ALL PLAYERS WHEN IT SHOULDN'T
	////////////////////////////////////////////////////////////////////////////////
	socket.on("tie", function(roomId){
		io.to(gameRooms[roomId][0].id).emit("tie")
		io.to(gameRooms[roomId][1].id).emit("tie")
	})
	
	socket.on("playedMove", function(movePlayed){
		var otherPlayer = getOtherPlayer(movePlayed.player)
		
		var playerRoom = movePlayed.player.roomId
		
		info = {
			boxPlayed: movePlayed.box,
			letter: movePlayed.player.letter
		}
		io.to(otherPlayer.id).emit("yourTurn", info)
		io.to(movePlayed.player.id).emit("otherTurn")
	})
	
	playersRematch = 0
	
	socket.on("restartGame", function(roomId){
		playersRematch ++
		if (playersRematch == 2){
			newPlayerData = randomizePlayerTurn(gameRooms[roomId])
			io.to(gameRooms[roomId][0].id).emit("gameRestarted", newPlayerData[0])
			io.to(gameRooms[roomId][1].id).emit("gameRestarted", newPlayerData[1])
			playersRematch = 0
		}
	})
	
	//////////////
    //DISCONNECT//
    //////////////
	socket.on('disconnect', function(){
        console.log("\nDisconnect")
		
		removePlayerFromRoom(socket.id)
		
		//This means the player is along as he does not have a room
		if (!findPlayerRoom(socket.id)){
			initStartValues()
		}else{
			var otherPlayerInfo = findOtherPlayer(socket.id)
			
			console.log(otherPlayerInfo)
			
			if (otherPlayerInfo != null){
				var otherPlayer = getOtherPlayer(otherPlayerInfo)
				
				console.log("\nGame Rooms:")
				console.log(gameRooms)
				
				console.log("\nPlayer that left ID:")
				console.log(socket.id)
				
				console.log("\nRemaining Player ID:")
				console.log(otherPlayer.id)
				
				io.to(otherPlayer.id).emit("playerDisconnect")
			}
		}
	})	
})

//This is for openshift deployment
/*var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

http.listen(port, ipaddress, function(){
	console.log('listening on *:4000')
})*/

//This is for testing
http.listen(4000, function(){
	console.log('listening on *:4000')
})
