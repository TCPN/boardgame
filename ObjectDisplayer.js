function toggleObjectDiv()
{
	// make the div containing fields under this object show/hide
	if(this.classList.contains('closed'))
		this.classList.remove('closed');
	else
		this.classList.add('closed');
	/* old version
	if(this.nextElementSibling && this.nextElementSibling.classList.contains('object'))
		this.nextElementSibling.style.display = (this.nextElementSibling.style.display=='none' ? 'block' : 'none');
	*/
}
function valueString(a)
{
	// convert value into short string
	if(a === null)return 'null';
	if(a === undefined)return 'undefined';
	if(typeof a != 'object')return a.toString();
	if(a instanceof String || a instanceof Number)return a.toString();
	if(a instanceof Array)return 'Array[' + a.length + ']';
	if(a.toString && a.toString != Object.prototype.toString)return a.toString();
	return a.constructor.name;
}
function ObjectDisplayer(obj, target, skipField)
{
	// capture the DOM to show
	target = target || document.getElementById('ObjectDisplay');
	if(!target)
	{
		// if we cannot find the default DOM to show, create it.
		target =  document.body.insertBefore(document.createElement('div'),null);
		target.id = 'ObjectDisplay';
	}
	// a queue to expand the Object tree in layered traverse
	var objQueue = [{key:'ObjectDisplay', value:obj, dom:target}];
	// counting for number of displayed fields
	var propertyCount = 0;
	
	while(objQueue.length > 0)
	{
		// dequeue one item
		var item = objQueue.shift();
		var targetObj = item.value;
		var targetDOM = item.dom;
		// clean the DOM to show
		targetDOM.innerHTML = '';
		// close too big object in the first
		if(Object.keys(targetObj)
			.filter(function(k){return (skipField.indexOf(k)<0)&&(typeof targetObj[k]!='function');})
			.length > 15 )
			targetDOM.previousElementSibling.classList.add('closed');
		// for all keys in the object
		for(var k in targetObj)
		{
			// not showing if the field is a function
			if(typeof targetObj[k] == 'function')
				continue;
			if(skipField.indexOf(k) >= 0)
				continue;
			
			// create head for the field
			var pdiv = targetDOM.insertBefore(document.createElement('div'),null);
			pdiv.classList.add('field');
			pdiv.style.paddingLeft = '10px';
			pdiv.innerHTML = '' + k + ': ' + valueString(targetObj[k]);
			pdiv.onclick = toggleObjectDiv;
			
			// add bold if has sub-items
			if(targetDOM.previousElementSibling)targetDOM.previousElementSibling.style.fontWeight = 'bold';
			
			// add this field into queue if it is an Object
			if(targetObj[k] instanceof Object)
			{			
				var odiv = targetDOM.insertBefore(document.createElement('div'),null);
				odiv.classList.add('object');
				odiv.style.paddingLeft = '20px';
				odiv.innerHTML = '...';
				objQueue.push({key:k, value:targetObj[k], dom:odiv});
			}
			propertyCount ++;
		}
		if(propertyCount > 1000)
		{
			// this tree is too large.
			// alert('displayObj paused.');
			var pausedMark = target.insertBefore(document.createElement('span'),null);
			pausedMark.innerHTML = 'PAUSED';
			pausedMark.style.color = 'white';
			pausedMark.style.background = 'red';
			// not use for some browser cannot
			//yield propertyCount;
			pausedMark.remove();
		}
	}
	var doneMark = target.insertBefore(document.createElement('span'),null);
	doneMark.innerHTML = 'DONE';
	doneMark.style.color = 'white';
	doneMark.style.background = 'blue';
	// alert('displayObj done.');
}
