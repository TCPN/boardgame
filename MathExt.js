Math.randomi = function(a,b)
{
	if(b == undefined)
		return Math.floor(Math.random() * a);
	else
		return Math.floor(Math.random() * (b-a))+a;
}