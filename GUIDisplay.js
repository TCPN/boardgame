function GUIDisplay(game, screen, handlers)
{
	var hasAction = false;
	function display(item, name){
		if(item.constructor == Object)
		{
			if(item.type == 'Deck')
				DisplayDeck(screen, item, name);
			else if(item.type == 'Token')
				;
			else if(item.type == 'Card')
				getCardDOM(screen, item);
			else if(item.type == 'Position')
				;
		}
	};
	function updateOptable(obj, objDOM)
	{
		if(obj.optionIndex > -1)
		{
			objDOM.classList.add('option');
			hasAction = true;
		}
		else
		{
			objDOM.classList.remove('option');
		}
		objDOM.optionIndex = obj.optionIndex;
		// *** should not need in online version
		objDOM.playerIndex = game.inViewOf; // now inViewOf only contains player Index
	}
	
	function DisplayDeck(deckScreen, deck, deckName)
	{
		var deckDOM = deckScreen.getElementsByClassName(deckName)[0];
		if(deckDOM == undefined)
		{
			deckDOM = deckScreen.insertBefore(document.createElement('div'),null);
			deckDOM.className = ['deck',deckName, deck.showPart].join(' ')
			deckDOM.addEventListener('click', objectClick, true);
		}
		updateOptable(deck, deckDOM);
		// insert card DOMs
		var removedCardDOM = [];
		var oldCardDOMs = Array.from(deckDOM.getElementsByClassName('card'));
		var numChange = deck.length - oldCardDOMs.length;
		var newArrange = [];
		var initCi = 0, endCi = deck.length;
		if(deck.length == 0)
			/*endCi = 0*/;
		else if(deck.showPart == 'top')
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
		oldCardDOMs.forEach(function(c){c.remove();});
		// insert card DOMs according to  newArrange
		newArrange.forEach(function(c){deckDOM.insertBefore(c,null);});
		return deckDOM;
	}
	function getPlayerLabelDOM(parentDOM, name)
	{
		var anc = parentDOM.getElementsByClassName('anchor playerLabelAnchor')[0];
		if(anc == undefined)
		{
			anc = document.createElement('div');
			anc.classList.add('anchor','playerLabelAnchor');
			anc.insertBefore(document.createElement('div'),null);
			anc.firstElementChild.classList.add('playerLabel');
		}
		var nlb = anc.getElementsByClassName('playerLabel')[0];
		nlb.textContent = name;
		return anc;
	}

	function guiCardName(card)
	{
		return ((card.suit && card.rank) ? card.suit + '_' + card.rank : 'covered');
	}

	function getCardDOM(deckDOM, card, oldCardDOMs)
	{
		var cardName = guiCardName(card);
		var cardDOM = oldCardDOMs.find(function(v){return v.classList.contains(cardName);});
		if(cardDOM == undefined)
		{
			cardDOM = deckDOM.insertBefore(document.createElement('div'),null);
			cardDOM.classList.add('card', cardName);
			cardDOM.insertBefore(document.createElement('img'),null);
			cardDOM.addEventListener('click', objectClick, true);
		}
		updateOptable(card, cardDOM);
		// insert image, TODO: check if image DOM exist
		cardDOM.getElementsByTagName('img')[0].src = 'pic/' + (cardName=='covered'?'Cardback.png':cardName+'.png');
		return cardDOM;
	}


	function optObjectOfThisDOM(dom)
	{
		var t = dom.optionIndex
		var p = dom.playerIndex;
		return {
			actor: p,
			action: t,
		};
	}
	function objectClick()
	{
		if(this.classList.contains('option'))
		{
			handlers.gameAction(optObjectOfThisDOM(this));
		}
		//console.log(this);
	}
	
	for(var k in game)
	{
		if(game[k] == undefined)
			continue;
		if(k == 'message' && game[k] == 'GameEnd')
			handlers.displayMessage((game.myVictory ? 'YOU WIN!' : 'You Lose.'), 'regular', 5); // this is the only place using displayMessage
		if(k == 'players') // assume 'players' contains all players, assume it's Array
		{
			screen.setAttribute('playerNumber', game.players.length); // give info about player number
			var p = game.inViewOf;
			var pn = game.players.length;
			var originalStart = p;
			do
			{
				for(var pk in game.players[p])
					display(game.players[p][pk],'view'+((p-originalStart+pn)%pn)+' '+pk);
				// TODO: give name label a better position in the DOM tree
				var handdeckDOM = document.getElementsByClassName('view'+((p-originalStart+pn)%pn)+' handDeck')[0];
				var labelDOM = getPlayerLabelDOM(handdeckDOM, game.players[p].userName);
				handdeckDOM.insertBefore(labelDOM, handdeckDOM.firstElementChild);
				p = (p+1)%pn;
			}
			while(p != originalStart);
		}
		else 
			display(game[k],k);
	}
	return hasAction;
}
