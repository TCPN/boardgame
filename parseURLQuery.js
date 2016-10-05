function parseURLQuery()
{
	var result = {};
	location.search.slice(1) // remove '?'
		.split("&")
		.map( function(q){return q.split("=")})
		.forEach(function(a){result[a[0]]=a[1]});
	// mobile cannot use a => a[0], "arrow function"
	return result;
}