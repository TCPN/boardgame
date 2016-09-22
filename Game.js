function Game()
{
	this.players = [];
	this.setPlayerNumber = function(number)
	{
		for(i=0;i<number;i++) this.players.push(new Player());
		return this;
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