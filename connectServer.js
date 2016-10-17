﻿
function getRoomIdFromURL()
{
	if(location.pathname == '/')
		return 0;
	return parseURLQuery().roomId;
}

function getName()
{
	if(document.cookie.includes("username="))
		return document.cookie.match(/username=([^;]*)/)[1];
	else
	{
		var name = prompt("Your name:");
		document.cookie = "username="+name;
		return name
	}
}

//assume socket.io is included, and evaluated
function newUserEnter()
{
	user={};
	user.name = getName();
	user.password = "";
	user.chatContent = "";
	user.states = undefined;
	user.socketTimer = [];
	user.socket = io(window.location.origin);
	user.socket.emit_t = function(event, data)
	{
		user.socket.emit(event, data);
		user.socketTimer.push(setTimeout(function(){user.socket.disconnect();user.socket.connect();}, 5000));
	}
	// TODO: is this should be here?
	function sendGameAction(data)
	{
		user.socket.emit_t("game", data);
	}
	user.socket.on('connect', function(){
		user.socket.emit("setUserProfile", {name: user.name, password: user.password, img: user.imgUrl});
	});
	//user.socket.emit("login", {name: user.name, password: user.password});
	user.socket.on("AskForName", function(){
		user.socket.emit("login", {name: user.name, password: user.password});
	});
	user.socket.on("Check", function(){
		user.socket.emit("ReplyCheck");
	});
	user.socket.on("checkRoom", function(){
		user.socket.emit("roomQuery", {roomId: getRoomIdFromURL()});
	});
	user.socket.on("roomInfo", function(data){
		// don't do  this , it refreshes
		//if(getRoomIdFromURL() != data.roomId)
		//	location.search = "?roomId=" + data.roomId;
		if(data.reject)
		{
			alert(data.rejectMessage);
			// go back to game list
			location.href = location.origin+"/";
		}
		if(data.roomId)
		{
			console.log("get roomId: "+data.roomId);
			user.room = {id: data.roomId, name: data.roomName};
		}
		if(data.userList)
		{
			var ul = document.getElementById('userList');
			if(ul)
			{
				var ids = data.userList.map(function(v){return v.id;});
				var oids = Array.from(ul.children).map(function(v){return v.userId});
				
				var iddiff = ids.diffTo(oids);
				
				iddiff.surpass.forEach(function(id){
					var thisUser = data.userList.find(function(u){return u.id==id;});
					var nl = document.createElement('li');
					nl.id = 'userListItem_'+thisUser.id;
					nl.classList.add("userListItem");
					nl.userId = thisUser.id;
					nl.textContent = thisUser.name || ('user_'+thisUser.id);
					ul.appendChild(nl);
				});
				
				iddiff.lack.forEach(function(id){
					var userListItemDOM = Array.from(ul.children).find(function(u){return u.userId==id;});
					userListItemDOM.remove();
				});
			}
		}
		if(data.gameMeta)
		{
			var gn = document.getElementById('gameName');
			if(gn)
				gn.textContent = data.gameMeta.name;
			var gpn = document.getElementById('gamePlayerNumber');
			if(gpn)
				gpn.textContent = data.gameMeta.playerNumber.join(',');
		}
		if(data.gameReady != undefined)
		{
			var gamebtn = document.getElementById('gamePowerSwitch');
			if(data.gameReady)
			{
				displayMessage("You can start a game now!","room","3");
				if(gamebtn) gamebtn.classList.remove('ui-disabled');
			}
			else
			{
				displayMessage("Wait for more players~","room","3");
				if(gamebtn) gamebtn.classList.add('ui-disabled');
			}
		}
	});
	user.socket.on("toClient", function(data){
		user.socketTimer.forEach(clearTimeout);
		user.socketTimer = [];
		console.log(user.name + " received somthing.");
		
		if(data.cmd == "show")
		{
			user.states = data;
		}
		else if(data.cmd == "enter")
		{
			//user.chatContent += ("<i>" + data.user + "進到了房間。</i><br>");
			user.socket.emit_t("toServer", {cmd: "get"});
		}
		else if(data.cmd == "leave")
		{
			//user.chatContent += ("<i>" + data.user + "離開了房間。</i><br>");
			user.socket.emit_t("toServer", {cmd: "get"});
		}
		else if(data.cmd == "MSG")
		{
			//alert(data.user + " say " + data.sentence);
			user.chatContent += (data.user + ": " + data.content + "<br>");
		}
		else if(data.cmd == "notice")
		{
			alert(data.content);
		}
		else if(data.cmd == "waitPlayersJoin")
		{
			alert("No enough players for the game. Try find some.");
		}
		else if(data.cmd == "game")
		{
			user.gameView = data.gameView;
			// this only handle game GUI
			GUIDisplay(user.gameView, document.getElementById('gui'),{ gameAction: sendGameAction, displayMessage: displayMessage});
		}
		
		try{
			//ShowProperUI(user.states);
		}catch(e){
			console.log(e.message);
			console.log(e.stack);
		}
	});
	user.socket.on("Error", function(data){
		alert(data.message);
		console.log(data);
	});
	user.socket.on("error", function(er){
		console.log(er.message);
		console.log(er.stack);
	});
	//user.socket.emit_t("login", {name: user.name});
	user.socket.on("loginSuccess", function(data){
		user.socket.emit_t("toServer", {cmd: "get"});
	});
	user.socket.on("loginFailed", function(data){
		document.body.innerHTML = "登入失敗，請重新整理";
	});
	//document.getElementById("UIArea").style.display = "block";
}

newUserEnter();