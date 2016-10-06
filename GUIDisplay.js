function GUIDisplay(game, screen, handlers)
{
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
	function displayMessage(message, kind, keepTime){
		var msgDOM = screen.getElementsByClassName('message')[0];
		function hideMessageDOM(){msgDOM.classList.add('hidden')};
		function showMessageDOM(){msgDOM.classList.remove('hidden')};
		if(msgDOM == undefined)
		{
			msgDOM = screen.insertBefore(document.createElement('div'),null);
			msgDOM.classList.add('message','hidden');
			/*
			msgDOM.addEventListener('transitioned', function(){
				if(!msgDOM.classList.contains('hidden') && !msgDOM.classList.contains('noAutoHide'))
					setTimeout(hideMessageDOM, msgDOM.keepTime);
			}, true);*/
			msgDOM.addEventListener('click', hideMessageDOM);
			setTimeout(function(){displayMessage(message, kind, keepTime)}, 1);// run like this, so the message animation will played.
			return;
		}
		msgDOM.innerHTML = message;
		msgDOM.keepTime = keepTime * 1000;
		showMessageDOM();
		setTimeout(hideMessageDOM, keepTime * 1000);
	};
	function updateOptable(obj, objDOM)
	{
		if(obj.optionIndex > -1)
		{
			objDOM.classList.add('option');
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
		if(deck.length <= 0)
			endCi = 0;
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
			displayMessage((game.myVictory ? 'YOU WIN!' : 'You Lose.'), 'regular', 5);
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

