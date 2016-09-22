function Token(params)
{
	for(k in params)
	{
		this[k] = params[k];
	}
	this.parent = null;
	
	return this;
}