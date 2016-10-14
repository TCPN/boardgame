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

function PokerGame(users)
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

	function waitForActions(message, actions, timelimit, defaultOpt)
	{
		timelimit = timelimit || Infinity;
		if(message == "GameEnd")
			thisGame.status = message;
		else
			thisGame.status = "waitForUserAction";
		thisGame.message = message;
		thisGame.waitFor = actions;
		return thisGame.waitFor;
	}

	var gameProgress = function* ()
	{
		Game.move(thisGame.initDeck, thisGame.poolDeck);
		thisGame.poolDeck.shuffle();
		for(let p of thisGame.players)
			Game.move(thisGame.poolDeck.topCard(5), p.handDeck);
		Game.move(thisGame.poolDeck.topCard(1), thisGame.outDeck)
		thisGame.currentPlayer = thisGame.players[0];
		
		var outCardVerify = function outCardVerify(player, choice)
		{
			if(player != thisGame.currentPlayer)
				return {isLegal: false, message: 'Not the current player'};
			if(choice == thisGame.poolDeck) //pass
				return {isLegal: true};
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
			var msg = "CurrentPlayerPlay";
			while(1)
			{
				//var choice = yield AUserChoice(new Set([thisGame.currentPlayer]), new Set(thisGame.currentPlayer.handDeck.cards).add(thisGame.poolDeck));
				var choiceResponse = yield waitForActions(
					msg,
					[{
						actor: thisGame.currentPlayer,
						actions: thisGame.currentPlayer.handDeck.cards
								.concat(thisGame.poolDeck.length > 0 ? thisGame.poolDeck : [] )
								.filter((v)=>outCardVerify(thisGame.currentPlayer,v).isLegal)
					}]
					);
				msg = "CurrentPlayerPlayed";
				//verify
				var choice = choiceResponse.action;
				var res = outCardVerify(choiceResponse.actor, choice);
				if(res.isLegal)
					break;
				else
				{
					msg = msg + ', but ' + res.message;
					continue;
				}
			}
			if(choice != thisGame.poolDeck)
			{
				thisGame.conPass = 0;
				Game.move(choice, thisGame.outDeck);
				if(thisGame.currentPlayer.handDeck.length == 0)
					break;
			}
			else
			{
				if(thisGame.poolDeck.length != 0)
					Game.move(thisGame.poolDeck.topCard(1), thisGame.currentPlayer.handDeck);
				thisGame.conPass += 1;
				if(thisGame.poolDeck.length == 0 && thisGame.conPass == 2)
					break;
			}
			thisGame.currentPlayer = thisGame.players[(thisGame.players.indexOf(thisGame.currentPlayer)+1)%thisGame.players.length];
		}
		thisGame.players.forEach(function(p){
			let s = 0;
			for(c of p.handDeck.cards)
				s += c.point;
			p.point = s;
		});
		thisGame.scores = thisGame.players.map((p)=>p.handDeck.length);
		thisGame.winner = thisGame.players.reduce((bp,cp)=>(cp.point < bp.point ? cp : bp),thisGame.currentPlayer);
		return waitForActions('GameEnd', []);
	};
	
	 var runningProgress = null;
	 this.run = function(input)
	 {
		if(runningProgress == undefined)
			runningProgress = gameProgress();
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
		return wa;
	 };
}

if(exports != undefined) exports.PokerGame = PokerGame;
