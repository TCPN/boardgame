var cards = [];
var ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
var suits = ['Spade', 'Heart', 'Club', 'Diamond'];
for(let s=0;s<4;s++)
	for(let r=0;r<13;r++)
	{
		let newcard = new Card({point: r+1, rank: ranks[r], suit: suits[s]});
		newcard.toString = function PokerCardStringify(){	return this.suit + ' ' + this.point; };
		cards.push(newcard);
	}


	
	
game = new Game().setPlayerNumber(2);
Object.assign(game, {
	initDeck : cards,
	poolDeck : Object.defineProperties(
		new Deck(), {
			'defaultCanSee': {value: new Set()},
			'showPart': {value: 'top'},
		}),
	outDeck : Object.defineProperties(
		new Deck(), {
			'defaultCanSee': {value: new Set()},
			'showPart': {value: 'main top'},
		}),
	currentPlayer : null,
	conPass : 0,
	isEnd : false,
});
game.players.forEach(function(p,i){
	Object.assign(p, {
		seq : (i+1),
		handDeck : Object.defineProperties(
			new Deck(), {
				'defaultCanSee': {value: new Set([p])},
				'showPart': {value: 'all'},
			}),
		score : 0,
	});
})

function AUserChoice(message, players, options, timelimit, defaultOpt)
{
	timelimit = timelimit || 60;
	return {
		"message" : message,
		"choosers": players,
		"options" : options,
		"timelimit" : timelimit,
		"default" : defaultOpt,
	};
}

var gameProgress = function* ()
{
	Game.move(game.initDeck, game.poolDeck);
	game.poolDeck.shuffle();
	for(let p of game.players)
		Game.move(game.poolDeck.topCard(5), p.handDeck);
	Game.move(game.poolDeck.topCard(1), game.outDeck)
	game.currentPlayer = game.players[0];
	
	var outCardVerify = function outCardVerify(choice)
	{
		if(choice == "pass")
			return {isLegal: true};
		else
		{
			let lastPoint = game.outDeck.bottomCard(1).point;
			var passPoint = [lastPoint-3, lastPoint, lastPoint+1, lastPoint+2, lastPoint+3].map((v)=>((v+12)%13+1));
			if(choice.suit == game.outDeck.bottomCard(1).suit && choice.point == passPoint[0])
				return {isLegal: false, message: 'No down when same suit'};
			else if(passPoint.indexOf(choice.point) > -1)
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
			//var choice = yield AUserChoice(new Set([game.currentPlayer]), new Set(game.currentPlayer.handDeck.cards).add("pass"));
			var choice = yield AUserChoice(
				msg,
				[].concat(game.currentPlayer),
				[].concat(game.currentPlayer.handDeck.cards).concat("pass").filter((v)=>outCardVerify(v).isLegal)
				);
			msg = "CurrentPlayerPlayed";
			//verify
			var res = outCardVerify(choice);
			if(res.isLegal)
				break;
			else
			{
				msg = msg + ', but ' + res.message;
				continue;
			}
		}
		if(choice != "pass")
		{
			game.conPass = 0;
			Game.move(choice, game.outDeck);
			if(game.currentPlayer.handDeck.length == 0)
				break;
		}
		else
		{
			if(game.poolDeck.length != 0)
				Game.move(game.poolDeck.topCard(1), game.currentPlayer.handDeck);
			game.conPass += 1;
			if(game.poolDeck.length == 0 && game.conPass == 2)
				break;
		}
		game.currentPlayer = game.players[(game.players.indexOf(game.currentPlayer)+1)%game.players.length];
	}
	game.players.forEach(function(p){
		let s = 0;
		for(c of p.handDeck.cards)
			s += c.point;
		p.point = s;
	});
	return {
		message: 'GameEnd',
		points: game.players.map((p)=>p.handDeck.length),
		winner: game.players.reduce((bp,cp)=>(cp.point < bp.point ? cp : bp),game.currentPlayer),
	};
}

