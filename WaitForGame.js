﻿
var PokerGame = require("./Poker.js").PokerGame;
//var Robot = require("./Robot.js").Robot;
var gameList = require("./gameList");


rooms = [];
lobby = new Room("大廳");

onlineUsers = {};
function newId(name)
{
	// TODO: reuse id, by pooling
	if(newId[name] == undefined || newId[name] >= 100000000000)
	{
		newId[name] = 0;
		console.log("Counter of " + name + " is reset to 0!");
	}
	else
		newId[name] ++;
	return newId[name];
	//return ((new Date()).toISOString().replace(/(T|Z|\:|\.)/g, "-") + "-" + u);
}

createUser = function(socket){
	//console.log('a connection');
	var user;
	function restartTimer()
	{
		if(user.socket.timer)
			clearTimeout(user.socket.timer);
		user.socket.timer = setTimeout(
			function(){
				try{
					user.socket.emit("Check");
					user.socket.timer = setTimeout(
						function(){
							user.leaveSystem();
						},
						30000
					);
				}
				catch(e){
					console.log(e.message);console.log(e.stack);
				}
			},
			60000
		);
	}
	function loginSuccess()
	{
		//console.log(user.name+" login");
		socket.on("toServer", function(data){
			restartTimer();
			try{
				//if(user == undefined)
				//	socket.emit("AskForName");
				user.recv(data);
			}catch(e){
				console.log(e.message);
				console.log(e.stack);
				socket.emit("Error", {"message": e.message});
			}
		});
		socket.emit("loginSuccess");
	}
	function loginFailed()
	{
		console.log("login failed");
		socket.emit("loginFailed");
	}
	socket.on("ReplyCheck", function(){
		restartTimer();
	});
	socket.on("login", function(data){
		if(onlineUsers[data.name] != undefined)
		{
			if(onlineUsers[data.name].password == data.password)
			{
				user = onlineUsers[data.name];
				user.socket.emit("loginFailed");
				user.socket = socket;
				user.getStatus();
				loginSuccess();
			}
			else
			{
				console.log(data.name+"這個名字目前被其他人用了");
				throw new Error("這個名字目前被其他人用了");
			}
		}
		else
		{
			user = new User(data.name.toString(), data.password.toString(), function(data){user.socket.emit("toClient", data);});
			user.socket = socket;
			lobby.accept(user);
			loginSuccess();
		}
	});
	socket.on("error", function(er){ 
		console.log(er.message);
		console.log(er.stack);
		socket.emit("Error", {"message": er.message, "type": 'ServerSocketError'});
	});
	
	// ignore above
	var uid = newId('User'); // TODO: this is temporary
	user = new User(
		"user_"+uid,
		"",
		function takeGameMessage(data){
			user.socket.emit("toClient", {cmd:"game", gameView: data});
		}
	);
	user.id = uid; // TODO: this is temporary
	user.socket = socket;
	console.log(user.name + " connected");
	socket.emit("checkRoom");
	socket.on("askGameList", function(data)
	{
		socket.emit("gameList",gameList); // TODO: remove unsafe info, like filepath
	});
	socket.on("setUserProfile", function setUserName(data){ // TODO: this is kind of split with the other roomInfo emission
		console.log(user.name + ' renamed to '+data.name);
		user.name = data.name;
		user.room.updateUserInfo();
	});
	socket.on("roomQuery", function roomQuery(data)
	{
		var newRoom;
		if(data==undefined || data.roomId == undefined)
		{
			console.log("create new room for "+user.name);
			newRoom = new Room(data && data.roomName);
		}
		else
		{
			console.log(user.name +" query for roomId: "+ data.roomId);
			//TODO check rooms is available, and allow user get in
			if(rooms[data.roomId] == undefined)
			{
				socket.emit("roomInfo", {reject: true, rejectMessage: "Queried room does not exist."});
				return;
			}
			else
			{
				newRoom = rooms[data.roomId];
			}
		}
		console.log(user.name +" join "+ newRoom.name);
		newRoom.users.push(user);
		user.room = newRoom;
		socket.emit("roomInfo", {
			roomId: user.room.id, 
			roomName: user.room.name,
		});
		user.room.updateUserInfo();
		// TODO: change for each game
		// check user number
		//console.log({roomId: user.room.users});
		
		if(user.room.users.length == 2)
		{
			//console.log("Let's Play!");
			// TODO: refactor this
		}
		else
		{
			// socket.emit("waitPlayersJoin", {userNumber:user.room.users.length});
			//console.log("waitPlayersJoin");
		}
	});
	socket.on("startGame", function(data){
		//restartTimer();
		user.room.game = new PokerGame(user.room.users, data.settings);
		user.room.game.run();
	});
	var deleteTheGame = function(){
		user.room.game = null;
		// this is for clean the object, a temporary way
		user.room.users.forEach((u)=>(u.player = null));
	};
	socket.on("game", function(data){
		//restartTimer();
		console.log(data); // not always looks correct, because actor index is relative
		if(!user.room.game)
		{
			socket.emit("Error", {"message": 'There is no running game.', "type": 'OperationError'});
			return;
		}
		var waitForForThisUser = user.room.game.waitFor.find((v)=>(v.actor==user.player));
		var actionsForThisUser = (waitForForThisUser ? waitForForThisUser.actions : []);
		var actionObj = {
			actor: user.player,
			action: actionsForThisUser[data.action],
		};
		var keepTheGame = user.room.game.run(actionObj);
		if(!keepTheGame)
			deleteTheGame();
	});
	socket.on("disconnect", function(){ 
		/*
		if(true || user != undefined)
		{
			//console.log(user.name + " disconnect.");
			//user.leaveSystem();
		}
		else
		{
			//console.log("someone disconnect.");
		}
		*/
		if(user != undefined && user.room != undefined)
		{
			user.room.users.remove(user);
			user.room.updateUserInfo();
			// temporary way: to inform a player leave
			if(user.player != undefined)
			{
				deleteTheGame();
				user.room.users.forEach((u)=>u.takeGameMessage({
					message:[{
						type:'gameBreak',
						text: 'The Game Break Off.',
						reason: 'A Player ('+user.name+') Left.'
					}]
				}));
			}
		}
		console.log(user.name + " disconnect");
	});
}


function User(name, password, sendFunc){
	if(onlineUsers[name] != undefined)
		throw new Error("這個名字目前被其他人用了");
	onlineUsers[name] = this;
	
	
	this.name = name;
	this.password = password;
	this.character = "default";
	this.room = lobby;
	this.gameCtrl = undefined;
	
	var user = this;
	this.gameInformHandler = function(){ user.getStatus(); }
	
	this.takeGameMessage = sendFunc;
	
	this.send = sendFunc;
	this.recv = function(data)
	{
		console.log("received from " + user.name + " : " + JSON.stringify(data));
		
		if(data.cmd == "get")
		{
			user.getStatus();
		}
		else if(data.cmd == "set")
		{
			switch(data.item)
			{
				default:
					break;
			}
		}
		else if(data.cmd == "login")
		{
			//user.account = login(data.account, data.password);
		}
		else if(data.cmd == "move")
		{
			user.move(rooms[data.roomId]);
		}
		else if(data.cmd == "createRoom")
		{
			user.move(new Room(data.name));
			lobby.allRefresh();
		}
		else if(data.cmd == "leave")
		{
			user.leaveSystem();
		}
		else if(data.cmd == "say")
		{
			user.say(data.sentence);
		}
		else if(data.cmd == "startgame")
		{
			user.room.startGame(data.gameName);
		}
		else if(data.cmd == "specgame")
		{
			user.room.spectGame(user);
		}
		else if(data.cmd == "endgame") // TODO: 應該改成"離開遊戲"
		{
			user.room.gameStop();
		}
		else if(data.cmd == "game")
		{
			user.gameCtrl[data.action]((data.param));
		}
		else
		{
			//user.send({"cmd": "Error", "content": "unknown command"});
			throw new Error("Unknown Command");
		}
	}
	
	this.leaveSystem = function(){
		console.log(this.name+' leave');
		// temporarily, somwone leave room destroy the whole game
		this.room.release(this);
		// TODO: make good leaving
		/*
		if(this.gameCtrl)
			this.gameCtrl.leave();
		*/
		delete onlineUsers[this.name];
		for(var i in this)
		{
			delete this[i];
		}
	}
	this.move = function(newRoom){
		if(newRoom.constructor != Room)
			throw new Error("使用者必須待在某個房間內");
			
		this.room.release(this);
		newRoom.accept(this);
		this.getStatus();
	}
		
	this.say = function(sentence){
		this.room.broadcast( {"cmd": "MSG", "user": this.name, "content": sentence} );
	}
	this.getStatus = function()
	{
		this.send( // TODO: retrieve game object with a more general method
			{
				"cmd": "show", 
				"room": getRoomInfo(this.room),
				"game": 
				(this.gameCtrl == undefined ? undefined :
					{
						"view": this.gameCtrl.view(),
						"status": this.gameCtrl.getUserStatus(),
						"isPlaying": this.gameCtrl.isPlaying(),
						"isChairman": this.gameCtrl.isChairmanNow(),
						"isBlue": this.gameCtrl.isBlue(),
						"isDispatched": this.gameCtrl.isDispatched(),
						"history": this.gameCtrl.getGameHistory(),
						"shouldShow": this.gameCtrl.shouldDisplayResult(),
						"lastVote": this.gameCtrl.getLastVoteResult(),
						"lastExecute": this.gameCtrl.getLastExecuteResult(),
						"lastPropose": this.gameCtrl.getLastProposal(),
					}
				),
				"connectTo": (this.room == lobby ? rooms.map(getRoomInfo) : [getRoomInfo(lobby)])
			}
		);
	}
	
	// !!
	this.toString = function()
	{
		return this.name;
	}
	
}

getRoomInfo = function(room){
	return {
		"id": room.getId(),
		"name": room.name,
		"users": room.getUserNames(),
		"playing": room.hasGame(),
	};
}

function Room(name)
{
	var users = [];
	var robots = [];
	var game = undefined;
	
	var id = newId("Room");
	rooms[id] = this;
	
	this.name = name || ("Room "+id);
	this.users = users;
	this.gameClass = PokerGame;
	this.gameMeta = gameList.find((g)=>g.name=='Poker');
	this.game = game;
	Object.defineProperties(this,
		{
			'userNames': {get: function(){ return users.map(function(user){return user.name;});}},
			'id': {get: function(){ return id;}},
		}
	)
	this.indexOf = function(user){ return users.indexOf(user);}
	this.contain = function(user){ return (this.indexOf(user) >= 0);}
	this.updateUserInfo = function updateUserInfo(){
		var emitData = {};
		emitData.userList = this.users.map((u)=>({id: u.id, name:u.name}));
		if(id != 0)
		{
			emitData.gameMeta = this.gameMeta;
			emitData.gameReady = (this.gameMeta!=undefined && this.gameMeta.playerNumber.includes(this.users.length));
			emitData.gameRunning = this.game!=undefined;
		}
		this.users.forEach((u)=>u.socket.emit("roomInfo", emitData));
	}
	
	this.broadcast = function(msg){
		for(var i in users)
		{
			users[i].send( msg );
		}
	}
	this.accept = function(user)
	{
		var index = users.indexOf(user);
		if(index < 0)
		{
			user.room = this;
			users.push(user);
			this.broadcast( {"cmd": "enter", "user": user.name});
			// TODO: should people in Lobby recieve this news? done
			// so they can see correct number of people in room list immediately
			lobby.allRefresh();
			return true;
		}
		else
			return false;
	}
	this.release = function(user)
	{
		var index = users.indexOf(user);
		if(index >= 0)
		{
			if(this.hasGame() && user.gameCtrl != null && user.gameCtrl.isPlaying())
			{
				robots.push(new Robot(this,user.gameCtrl));
				//this.gameStop();
			}
			user.gameCtrl = undefined;
			user.room = undefined;
			users = users.slice(0,index).concat(users.slice(index + 1)); //why not try  users.splice(index,1);
			this.broadcast( {"cmd": "leave", "user": user.name})
			
			if(users.length <= 0 && id != 0)
				this.dissolve();
			
			return true;
		}
		else
			return false;
	}
	this.startGame = function(gameName)
	{
		userNames = this.getUserNames();
		if(gameName == "Resistance")
		{
			game = new ResistanceGame(userNames);
			for(var i in users)
			{
				users[i].gameCtrl = game.getControler(users[i].name, users[i].gameInformHandler);
			}
			this.allRefresh();
		}
	}
	this.spectGame = function(user)
	{
		user.gameCtrl = game.getControler("Spectator", user.gameInformHandler);
		user.getStatus();
	}
	this.gameStop = function()
	{
		game = undefined;
		robots = [];
		for(var i in users)
		{
			users[i].gameCtrl = undefined;
		}
		this.allRefresh();
	}
	this.allRefresh = function()
	{
		for(var i in users)
		{
			users[i].getStatus();
		}
	}
	this.dissolve = function()
	{
		delete rooms[id];
		delete this;
	}
}

exports.createUser = createUser;
