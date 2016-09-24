function Card(params)
{
	for(k in params)
	{
		this[k] = params[k];
	}
	this.coverable = true;
	this.canSee = new Set();
	this.parent = null;
	
	return this;
}