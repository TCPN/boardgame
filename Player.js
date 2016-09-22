function Player(params)
{
	for(k in params)
	{
		this[k] = params[k];
	}
	this.getUser = function(){};
	
	return this;
}