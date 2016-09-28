function GUIDisplay(game, screen)
{
	function display(item, name){
		if(item.constructor == Object)
		{
			if(item.type == 'Deck')
				DisplayDeck(game, screen, item, name);
			else if(item.type == 'Token')
				;
			else if(item.type == 'Card')
				getCardDOM(screen, item);
			else if(item.type == 'Position')
				;
		}
	};
	
	for(var k in game)
	{
		if(game[k] == undefined)
			continue;
		if(k == 'players') // assume 'players' contains all players, assume it's Array
		{
			var p = game.inViewOf;
			var pn = game.players.length;
			var originalStart = p;
			do
			{
				for(var pk in game.players[p])
					display(game.players[p][pk],'view'+((p-originalStart+pn)%pn)+' '+pk);
				p = (p+1)%pn;
			}
			while(p != originalStart);
		}
		else 
			display(game[k],k);
	}
}

function DisplayDeck(game, screen, deck, deckName)
{
	var deckDOM = screen.getElementsByClassName(deckName)[0];
	if(deckDOM == undefined)
	{
		deckDOM = screen.insertBefore(document.createElement('div'),null);
		deckDOM.className = ['deck',deckName, deck.showPart].join(' ');
	}
	// insert card DOMs
	var removedCardDOM = [];
	var oldCardDOMs = Array.from(deckDOM.getElementsByClassName('card'));
	var numChange = deck.length - oldCardDOMs.length;
	var newArrange = [];
	var initCi = 0, endCi = deck.length;
	if(deck.showPart == 'top')
		endCi = 1;
	else if(deck.showPart == 'bottom')
		initCi = deck.length - 1;
	for(var ci = initCi; ci < endCi; ci ++)
	{
		var cardName = guiCardName(deck.cards[ci]);
		var cardDOM = getCardDOM(deckDOM, deck.cards[ci], oldCardDOMs);
		oldCardDOMs.remove(cardDOM);
		newArrange[ci] = cardDOM;
	}
	// remove no-use card DOMs
	oldCardDOMs.forEach((c)=>c.remove());
	// insert card DOMs according to  newArrange
	newArrange.forEach((c)=>deckDOM.insertBefore(c,null));
	return deckDOM;
}

function guiCardName(card)
{
	return ((card.suit && card.rank) ? card.suit + '_' + card.rank : 'covered');
}

function getCardDOM(deckDOM, card, oldCardDOMs)
{
	var cardName = guiCardName(card);
	var cardDOM = oldCardDOMs.find((v)=>v.classList.contains(cardName))
	if(cardDOM == undefined)
	{
		cardDOM = deckDOM.insertBefore(document.createElement('div'),null);
		cardDOM.classList.add('card', cardName);
		cardDOM.insertBefore(document.createElement('img'),null);
	}
	// insert image, TODO: check if image DOM exist
	cardDOM.getElementsByTagName('img')[0].src = 'pic/' + (cardName=='covered'?'Cardback.png':cardName+'.png');
	return cardDOM;
}