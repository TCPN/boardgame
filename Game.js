if(require != undefined)
{
	ArrayExt = require('./ArrayExt').ArrayExt;
	MathExt = require('./MathExt').MathExt;
	ObjectExt = require('./ObjectExt').ObjectExt;
	Card = require('./Card').Card;
	Deck = require('./Deck').Deck;
	Dice = require('./Dice').Dice;
	Player = require('./Player').Player;
	Position = require('./Position').Position;
	Token = require('./Token').Token;
	//Game = require('./Game').Game;
}
if(exports != undefined) exports.Game = Game;

function Game()
{
	this.status = "Not Initialized";
	this.message = [{type: "gameStart", text: 'Start A New Game'}];
	this.waitFor = []; // each item is like: {actor: <player> or <timer>, actions: [<unique code>]}
	this.players = [];
	this.setPlayerNumber = function(number)
	{
		for(i=0;i<number;i++) this.players.push(new Player());
		return this;
	}
	this.resetMessage = function(){
		this.message = [];
	};
	this.addMessage = function(type, text, other){
		if(!(this.message instanceof Array))
		{
			this.resetMessage();
			this.addMessage("log", "game message format wrong, reset");
		}
		this.message.push(Object.assign({
			type: type,
			text: text,
		}, other));
	};
	this.skipFieldWhenView = new Set(
		['parent','coverable','canSee','waitFor','status',
		'defaultCanSee','skipFieldWhenView']);
	this.inViewOf = function(player)
	{
		var optable = [];
		if(this.status != "GameEnd")
		{
			//console.log('give options');
			for(let i = 0; i < this.waitFor.length; i ++)
			{
				// for now, only one action set will be properly set by these codes
				if(this.waitFor[i].actor == player)
					optable = this.waitFor[i].actions;
			}
		}
		var view = {inViewOf: player.index};
		if(this.players.indexOf(player) > -1)
		{
			var fieldQueue = [{src: this, dst: view}];
			while(fieldQueue.length > 0)
			{
				let dq = fieldQueue.shift();
				var sourceObj = dq.src;
				var destObj = dq.dst;
				destObj.type = sourceObj.constructor.name;
				destObj.optionIndex = optable.indexOf(sourceObj);
				if(sourceObj.canSee == undefined || sourceObj.canSee.has(player) || sourceObj.canSee.has('all'))
				{
					for(let k in sourceObj)
					{
						if(this.skipFieldWhenView.has(k))
							continue;
						if(destObj.type == 'Deck' && k == 'items') // deck.items == deck.cards, keep only one of them
							continue;
						if(k == 'user')
						{
							destObj['userId'] = sourceObj[k].id || -1;
							destObj['userName'] = sourceObj[k].name || 'user_'+sourceObj[k].id || 'user';
							continue;
						}
						if(k == 'winner' && sourceObj[k] != undefined)
						{
							destObj['myVictory'] = (sourceObj[k] == player);
						}
						switch(typeof sourceObj[k])
						{
							case 'function':
							case 'symbol':
								continue;
							case 'number':
							case 'string':
							case 'boolean':
								destObj[k] = sourceObj[k];
								break;
							case 'object':
								destObj[k] = (sourceObj[k].constructor == Array ? [] : {});
								fieldQueue.push({src: sourceObj[k], dst: destObj[k]});
								break;
						}
					}
				}
			}
		}
		return view;
	}
	return this;
}

Game.move = function(item, dest)
{
	if(item instanceof Array)
	{
		for(i of item)
		{
			Game.move(i, dest);
		}
	}
	else if(item instanceof Deck && dest instanceof Deck)
	{
		Game.move(item.cards, dest);
	}
	else if(item instanceof Card && dest instanceof Deck)
	{
		dest.add(item);
	}
	else if(item instanceof Token && dest instanceof Position)
	{
		dest.add(item);
	}
}