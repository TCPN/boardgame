function Position(params)
{
	this.items = [];
	this.add = function(item)
	{
		if(item.parent)item.parent.remove(item);
		this.items.add(item);
		item.parent = this;
		return this;
	};
	this.remove = function(item)
	{
		this.items.remove(item);
		item.parent = null;
		return this;
	};
	for(k in params)
	{
		this[k] = params[k];
	}
	this.parent = null;
	
	return this;
}