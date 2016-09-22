Array.prototype.add = function(items)
{
	if(items instanceof Array)
	{
		for(v of items)
			this.push(v);
	}
	else
		this.push(items);
	return this;
}
Array.prototype.remove = function(item)
{
	var i = this.indexOf(item);
	if(i >= 0) 
		this.splice(i,1);
	return this; 
}
Array.prototype.shuffle = function()
{
	var leftCount = this.length;
	while(leftCount > 0)
	{
		this.push(this.splice(Math.floor(Math.random() * leftCount),1)[0]);
		leftCount --;
	}
	return this;
}