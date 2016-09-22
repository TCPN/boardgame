var cards = [];
var ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
var suits = ['Spade', 'Heart', 'Club', 'Diamond'];
for(let s=0;s<4;s++)
	for(let r=0;r<13;r++)
		cards.push(new Card({point: r+1, rank: ranks[r], suit: suits[s]}));

game = new Game().setPlayerNumber(2);
Object.assign(game, {
	initDeck : cards,
	poolDeck : new Deck(),
	outDeck : new Deck(),
	currentPlayer : null,
	conPass : 0,
	isEnd : false,
});
game.players.forEach(function(p,i){
	Object.assign(p, {
		seq : (i+1),
		handDeck : new Deck(),
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
	
	while(true)
	{
		while(1)
		{
			//var choice = yield AUserChoice(new Set([game.currentPlayer]), new Set(game.currentPlayer.handDeck.cards).add("pass"));
			var msg = "CurrentPlayerPlay";
			var choice = yield AUserChoice(
				msg,
				[].concat(game.currentPlayer),
				[].concat(game.currentPlayer.handDeck.cards).concat("pass")
				);
			//verify
			if(choice == "pass")
				break;
			else if(choice.suit == game.outDeck.topCard(1).suit)
			{
				msg = msg + ", suit rule";
				continue;
			}
			else if(choice.point == game.outDeck.topCard(1).point)
				break;
			else
			{
				let s = choice.point + game.outDeck.topCard(1).point;
				let d = Math.abs(choice.point - game.outDeck.topCard(1).point);
				if(game.outDeck.topCard(1).point == 10 || choice.point == 10
					|| s == 10 || s == 7 || d == 10 || d == 7)
					break;
				else
				{
					msg = msg + ", point rule";
					continue;
				}
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
		points: game.players.map((p)=>p.point),
		winner: game.players.reduce((bp,cp)=>(cp.point < bp.point ? cp : bp),game.currentPlayer),
	};
}