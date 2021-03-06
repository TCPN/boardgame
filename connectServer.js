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
		return name;
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
		user.socketTimer.push(setTimeout(function(){
			console.log('reconnect...');
			user.socket.disconnect();
			user.socket.connect();
		}, 5000));
	}
	function resetAllSocketTimer()
	{
		user.socketTimer.forEach(clearTimeout);
		user.socketTimer = [];
	}
	// TODO: is this should be here?
	function sendGameAction(data)
	{
		user.socket.emit_t("game", data);
	}
	setUserProfile = function(data)
	{
		user.name = data.name || user.name;
		user.password = data.password || user.password;
		user.imgUrl = data.imgUrl || user.imgUrl;
		
		document.cookie = "username=" + user.name;
		document.cookie = "userpassword=" + (user.password||"");
		document.cookie = "userimgurl=" + (user.imgUrl||"");
		
		user.socket.emit("setUserProfile", data);
	}
	user.socket.on('connect', function(){
		setUserProfile({name: user.name, password: user.password, img: user.imgUrl});
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
				
				iddiff.overlap.forEach(function(id){
					var userListItemDOM = Array.from(ul.children).find(function(u){return u.userId==id;});
					var thisUser = data.userList.find(function(u){return u.id==id;});
					userListItemDOM.textContent = thisUser.name || ('user_'+thisUser.id);
				});
				
				iddiff.lack.forEach(function(id){
					var userListItemDOM = Array.from(ul.children).find(function(u){return u.userId==id;});
					userListItemDOM.remove();
				});
			}
		}
		if(data.gameMeta)
		{
			var gameConsole = document.getElementById('gameConsole');
			if(gameConsole)
			{
				var gn = document.getElementById('gameName');
				if(data.gameMeta.name != gn.textContent)
				{
					var gpn = document.getElementById('gamePlayerNumber');
					var gset = document.getElementById('gameSettings');
					gn.textContent = data.gameMeta.name;
					gpn.textContent = data.gameMeta.playerNumber.join(',');
					function getSettingForm(settings)
					{
						var dom = document.createElement('div');
						if('type' in settings)
						{
							if(settings.type == 'checkbox')
							{
								dom.classList.add('gameSettingsCheckboxSet');
								var b = document.createElement('input');
								b.type = 'checkbox';
								b.checked = settings.default;
								var t = document.createElement('span');
								t.textContent = settings.text || "";
								dom.insertBefore(b,null);
								dom.insertBefore(t,null);
							}
							else
							{
								console.log('unrecognized setting type: '+ settings.type);
								delete(settings.type); // treat as group
								return getSettingForm(settings);
							}
						}
						else // no type means a settings group
						{
							dom.classList.add('gameSettingsGroup');
							for(var k in settings)
							{
								if(k == "text")
								{
									var textLabel = document.createElement('div');
									textLabel.classList.add('gameSettingsGroupTitle');
									textLabel.textContent = settings.text;
									dom.insertBefore(textLabel,dom.firstElementChild);
								}
								else
								{
									var child = getSettingForm(settings[k]);
									child.name = k;
									dom.insertBefore(child,null);
								}
							}
						}
						return dom;
					}
					getSettingsValue = function(settingsGroupDOM)
					{
						if(settingsGroupDOM == undefined)
						{
							var form = document.getElementById('gameSettings');
							form = form && form.firstElementChild; // a gameSettingsGroup
							return getSettingsValue(form);
						}
						else
						{
							var settings = {};
							for( var i=0; i < settingsGroupDOM.children.length; i++)
							{
								var childDOM = settingsGroupDOM.children[i];
								var fieldName = childDOM.name;
								if(childDOM.classList.contains('gameSettingsCheckboxSet'))
									settings[fieldName] = childDOM.firstElementChild.checked;
								else if(childDOM.classList.contains('gameSettingsGroup'))
									settings[fieldName] = getSettingsValue(childDOM);
							}
							return settings;
						}
					}
					gset.innerHTML = '';
					gset.appendChild(getSettingForm(data.gameMeta.settings));
				}
			}
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
		resetAllSocketTimer();
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
			var handlesFunc = { gameAction: sendGameAction, displayMessage: displayMessage};
			var hasAction = GUIDisplay(user.gameView, document.getElementById('gui'), handlesFunc);
			if(hasAction)
			{
				var notiIconsUrl = [
				'https://scontent-tpe1-1.xx.fbcdn.net/t39.1997-6/p128x128/851582_1398251680393015_481386137_n.png',
				'https://scontent-tpe1-1.xx.fbcdn.net/t39.1997-6/p128x128/851578_654446867903727_1544492378_n.png',
				'https://scontent-tpe1-1.xx.fbcdn.net/t39.1997-6/p128x128/10574681_1498876463686817_1148331481_n.png',
				'https://scontent-tpe1-1.xx.fbcdn.net/t39.1997-6/p128x128/10734314_1601168460115072_1201753541_n.png',
				'https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1287660/iphone/main@2x.png',
				'https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1287665/iphone/main@2x.png',
				];
				if(!document.hasFocus())
				{
					var noti = new Notification("It's Your Turn!", {
						icon: notiIconsUrl[Math.randomi(notiIconsUrl.length)],
						body: 'Waiting for you~~',
					});
					var closeNoti = function(){
						window.removeEventListener("focus", closeNoti);
						noti.close();
					};
					window.addEventListener("focus", closeNoti);
					//setTimeout(closeNoti, 5000); // keep the notification, until it's read.
					noti.onclick = function(){window.focus()};
				}
			}
		}
		
		try{
			//ShowProperUI(user.states);
		}catch(e){
			console.log(e.message);
			console.log(e.stack);
		}
	});
	user.socket.on("Error", function(data){
		resetAllSocketTimer();
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
Notification.requestPermission();
