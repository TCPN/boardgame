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
	Game = require('./Game').Game;
}

function PokerGame(users, settings)
{
	var cards = [];
	var ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
	var suits = ['Spade', 'Heart', 'Club', 'Diamond'];
	function PokerCardStringify(){	return this.suit + '_' + this.rank; }
	for(let s=0;s<4;s++)
		for(let r=0;r<13;r++)
		{
			let newcard = new Card({point: r+1, rank: ranks[r], suit: suits[s]});
			newcard.toString = PokerCardStringify;
			cards.push(newcard);
		}

	users = users.concat([]); // duplicate it
	if(settings.RandomPlayerOrder)
		users.shuffle();
	if(users.length > 4 && users.length < 2)
		throw new Error("Inproper Number of Players");
	var thisGame = Game.apply(this).setPlayerNumber(users.length);
	// assume users is Array
	if(users != undefined) users.forEach(function(u,i){u.player = thisGame.players[i];u.player.user=u;});
	thisGame.skipFieldWhenView.add('initDeck');
	Object.assign(thisGame, {
		initDeck : cards,
		poolDeck : Object.defineProperties(
			new Deck(), {
				'defaultCanSee': {value: new Set()},
				'showPart': {value: 'top'},
			}),
		outDeck : Object.defineProperties(
			new Deck(), {
				'defaultCanSee': {value: new Set(['all'])},
				'showPart': {value: 'main top'},
			}),
		currentPlayer : null,
		conPass : 0,
		isEnd : false,
	});
	if(settings.drawCardFrom.openPoolDeck)
	{
		Object.assign(thisGame, {
			openPoolDeck : Object.defineProperties(
				new Deck(), {
					'defaultCanSee': {value: new Set(['all'])},
					'showPart': {value: 'all'},
				}),
		});
	}
	thisGame.players.forEach(function(p,i){
		Object.assign(p, {
			index : i,
			handDeck : Object.defineProperties(
				new Deck(), {
					'defaultCanSee': {value: new Set([p])},
					'showPart': {value: 'all'},
				}),
			score : 0,
		});
	});

	function waitForActions(status, actions, timelimit, defaultOpt)
	{
		timelimit = timelimit || Infinity;
		thisGame.status = status;
		if(thisGame.status == "GameEnd")
			thisGame.addMessage('gameEnd','The Game is Ended.');
		thisGame.waitFor = actions;
		return thisGame.waitFor;
	}

	var gameProcess = function* ()
	{
		Game.move(thisGame.initDeck, thisGame.poolDeck);
		thisGame.poolDeck.shuffle();
		for(let p of thisGame.players)
			Game.move(thisGame.poolDeck.topCard(5), p.handDeck);
		Game.move(thisGame.poolDeck.topCard(1), thisGame.outDeck)
		if(settings.drawCardFrom.openPoolDeck)
		{
			Game.move(thisGame.poolDeck.topCard(3), thisGame.openPoolDeck);
		}
		thisGame.currentPlayer = thisGame.players[0];
		
		var outCardVerify = function outCardVerify(player, choice)
		{
			if(player != thisGame.currentPlayer)
				return {isLegal: false, message: 'Not the current player'};
			if(choice == thisGame.poolDeck) //pass
				return {isLegal: true};
			else if(settings.drawCardFrom.openPoolDeck && thisGame.openPoolDeck.cards.indexOf(choice) >= 0) // take a card from openPoolDeck
				return {isLegal: true};
			else if(thisGame.outDeck.cards.indexOf(choice) >= 0)
			{
				if(thisGame.outDeck.length > 1)
					return {isLegal: true};
				else
					return {isLegal: false, message: 'Cannot Take The Initial Out Card'};
			}
			else
			{
				let lastPoint = thisGame.outDeck.bottomCard(1).point;
				var legalPoint = [lastPoint-3, lastPoint, lastPoint+1, lastPoint+2, lastPoint+3].map((v)=>((v+12)%13+1));
				if(choice.suit == thisGame.outDeck.bottomCard(1).suit && choice.point == legalPoint[0])
					return {isLegal: false, message: 'No down when same suit'};
				else if(legalPoint.indexOf(choice.point) > -1)
					return {isLegal: true};
				else
					return {isLegal: false, message: 'Invalid point'};
			}
		}
		
		while(true)
		{
			while(1)
			{
				thisGame.addMessage('instruct', "Wait for (currentPlayer)'s Action.",
					{currentPlayer: thisGame.currentPlayer}
				);
				//var choice = yield AUserChoice(new Set([thisGame.currentPlayer]), new Set(thisGame.currentPlayer.handDeck.cards).add(thisGame.poolDeck));
				var choiceResponse = yield waitForActions(
					"waitForUserAction",
					[{
						actor: thisGame.currentPlayer,
						actions: thisGame.currentPlayer.handDeck.cards
								.concat((settings.drawCardFrom.poolDeck ? thisGame.poolDeck : (settings.drawCardFrom.openPoolDeck && thisGame.openPoolDeck.length <= 0 ? thisGame.poolDeck : [])))
								.concat((settings.drawCardFrom.outDeck && thisGame.outDeck.length > 1) ? thisGame.outDeck.bottomCard(1) : [])
								.concat((settings.drawCardFrom.openPoolDeck) ? thisGame.openPoolDeck.cards : [])
								.filter((v)=>outCardVerify(thisGame.currentPlayer,v).isLegal)
					}]
				);
				thisGame.resetMessage();
				thisGame.addMessage('info', "(actor) make an action of (action).", choiceResponse);
				//verify
				var choice = choiceResponse.action;
				var res = outCardVerify(choiceResponse.actor, choice);
				if(res.isLegal)
					break;
				else
				{
					thisGame.addMessage('info', "But the action is iilegal. Reason: (message).", res);
					continue;
				}
			}
			if(choice != thisGame.poolDeck)
			{
				if(thisGame.outDeck.cards.indexOf(choice) >= 0) // choose the top card in outDeck
				{
					thisGame.conPass = 0;
					Game.move(choice, thisGame.currentPlayer.handDeck);
				}
				else if(settings.drawCardFrom.openPoolDeck && thisGame.openPoolDeck.cards.indexOf(choice) >= 0) // choose one of the cards in openPoolDeck
				{
					thisGame.conPass = 0;
					Game.move(choice, thisGame.currentPlayer.handDeck);
					if(thisGame.poolDeck.length > 0)
						Game.move(thisGame.poolDeck.topCard(1), thisGame.openPoolDeck);
				}
				else
				{
					thisGame.conPass = 0;
					Game.move(choice, thisGame.outDeck);
					if(thisGame.currentPlayer.handDeck.length == 0)
						break; // game end
				}
			}
			else
			{
				if(thisGame.poolDeck.length > 0)
					Game.move(thisGame.poolDeck.topCard(1), thisGame.currentPlayer.handDeck);
				else
					thisGame.conPass += 1;
				if(thisGame.poolDeck.length == 0 && thisGame.conPass == thisGame.players.length)
					break; // game end
			}
			thisGame.currentPlayer = thisGame.players[(thisGame.players.indexOf(thisGame.currentPlayer)+1)%thisGame.players.length];
		}
		thisGame.players.forEach(function(p){
			let s = 0;
			for(c of p.handDeck.cards)
				s += c.point;
			p.point = s;
		});
		thisGame.scores = thisGame.players.map((p)=>({cardNum: p.handDeck.length, cardPointSum: p.point}));
		thisGame.winner = thisGame.players.reduce(
			(bp,cp)=>((cp.handDeck.length < bp.handDeck.length || cp.point < bp.point) ? cp : bp),
			thisGame.currentPlayer
		);
		return waitForActions('GameEnd', []);
	};
	
	 var runningProgress = null;
	 this.run = function(input)
	 {
		if(runningProgress == undefined)
			runningProgress = gameProcess();
		var wa = runningProgress.next(input);
		if(thisGame.status == "waitForUserAction" || thisGame.status == "GameEnd")
		{
			console.log(thisGame.status);
			try{
				thisGame.players.forEach(function(p){
					p.user.takeGameMessage(thisGame.inViewOf(p));
				});
			}catch(e)
			{
				console.log(e);
			}
		}
		//return wa;
		if(thisGame.status == "GameEnd")
			return false; // go on?
		else
			return true; // go on?
	 };
}

if(exports != undefined) exports.PokerGame = PokerGame;
