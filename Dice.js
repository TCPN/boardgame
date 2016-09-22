function Dice(params)
{
	Token.apply(this);
	var fs;
	if (params instanceof Object && 'faces' in params)
		fs = params.faces;
	else if (params instanceof Array)
		fs = params;
	else if(parseInt(params))
	{
		let fn = Math.abs(parseInt(params)) || 6;
		fs = new Array(fn).fill(0).map((v,i)=>(i+1));
	}
	var faces = fs || [1,2,3,4,5,6];
	this.toss = function()
	{
		return faces[Math.randomi(faces.length)];
	}
}