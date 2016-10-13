// TODO: how to display continuous or simultaneous messages
function displayMessage(message, kind, keepTime){
	var msgDOM = document.getElementsByClassName('message')[0];
	function hideMessageDOM(){msgDOM.classList.add('hidden');};
	function showMessageDOM(){msgDOM.classList.remove('hidden');};
	if(msgDOM == undefined)
	{
		msgDOM = document.createElement('div');
		msgDOM.classList.add('message','hidden');
		msgDOM = document.getElementById('mainFrame').insertBefore(msgDOM,null);
		/*
		msgDOM.addEventListener('transitioned', function(){
			if(!msgDOM.classList.contains('hidden') && !msgDOM.classList.contains('noAutoHide'))
				setTimeout(hideMessageDOM, msgDOM.keepTime);
		}, true);*/
		msgDOM.addEventListener('click', hideMessageDOM);
		setTimeout(function(){displayMessage(message, kind, keepTime)}, 100);// run like this, so the message animation will played.
		return;
	}
	msgDOM.innerHTML = message;
	msgDOM.keepTime = (keepTime||5) * 1000;
	showMessageDOM();
	setTimeout(hideMessageDOM, keepTime * 1000);
};
