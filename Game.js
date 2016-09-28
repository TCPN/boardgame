function Game()
{
	this.players = [];
	this.setPlayerNumber = function(number)
	{
		for(i=0;i<number;i++) this.players.push(new Player());
		return this;
	}
	this.skipFieldWhenView = new Set(['parent','coverable','rank','canSee','defaultCanSee','skipFieldWhenView']);
	this.inViewOf = function(player)
	{
		var view = {};
		if(this.players.indexOf(player) > -1)
		{
			var fieldQueue = [{src: this, dst: view}];
			while(fieldQueue.length > 0)
			{
				let dq = fieldQueue.shift();
				var sourceObj = dq.src;
				var destObj = dq.dst;
				destObj.type = sourceObj.constructor.name
				if(sourceObj.canSee == undefined || sourceObj.canSee.has(player) || sourceObj.canSee.has('all'))
				{
					for(let k in sourceObj)
					{
						if(this.skipFieldWhenView.has(k))
							continue;
						if(destObj.type == 'Deck' && k == 'items') // deck.items == deck.cards, keep only one of them
							continue;
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