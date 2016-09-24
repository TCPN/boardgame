function Deck()
{
	Position.apply(this);
	Object.defineProperties(this,{
		length: {
			enumerable: true,
			get: function(){ return this.items.length;}
		},
	});
	this.cards = this.items;
	var originalAdd = this.add.bind(this);
	this.add = function(item)
	{
		if(item && item.canSee != undefined && item.canSee != null)
		{
			// change the item.canSee as the Deck.canSee
			item.canSee.clear();
			this.canSee.forEach(item.canSee.add.bind(item.canSee));
		}
		originalAdd(item);
		return this;
	};
	this.shuffle = function()
	{
		this.cards.shuffle();
		return this;
	};
	this.sort = function()
	{
		this.cards.sort();
		return this;
	};
	this.topCard = function(n)
	{
		if(n == 1)
			return this.cards[0];
		else if(n > 1)
			return this.cards.slice(0,n);
	};
	this.bottomCard = function(n)
	{
		if(n == 1)
			return this.cards[this.cards.length-1];
		else if(n > 1)
			return this.cards.slice(this.cards.length-n,n);
	};
	this.randomCard = function(n)
	{
		if(n == 1)
			return this.cards[Math.randomi(this.cards.length)];
		else if(n > 1)
		{
			return new Array(this.cards.length).fill(0).map((d,i)=>i).shuffle().slice(n).map((v)=>this.cards[v]);
		}
	};
	this.canSee = new Set();
	this.showPart = 'all'; // will whole deck shown or the top one only. 'all'|'top'|'bottom'
	/*
	this.add = function(newCard)
	{
		newCard.parent.remove(newCard);
		this.cards.push(newCard);
		newCard.parent = this;
		return this;
	};
	this.remove = function(card)
	{
		this.cards.remove(card);
		card.parent = null;
		return this;
	};
	this.parent = null;
	*/
	
	return this;
}

Deck.prototype = new Position();
Deck.prototype.constructor = Deck;