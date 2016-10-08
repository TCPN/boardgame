route = function(pathname){
	var hardRoute = {
		"/poker" 				: "/onlineTest.html",
		"/style.css"			: "/style.css",
		"/GUIstyle.css"			: "/GUIstyle.css",
		"/parseURLQuery.js"		: "/parseURLQuery.js",
		"/GUIDisplay.js"		: "/GUIDisplay.js",
		"/connectServer.js"		: "/connectServer.js",
		"/ObjectDisplayer.js"	: "/ObjectDisplayer.js",
		
		"/favicon.ico" 			: "/resistance icon.png",
		"/socket.io.test" 		: "/socketiotest.html",
		"/uitest" 				: "/UItest.html",
		"/resistance/rule" 		: "/Rule.html",
		"/resistance/legend" 	: "/Legend.html",
		"/resistance/flow" 		: "/flow.png",
		
		"/test/LoveLetter" 		: "/LoveLetterCoreTest.html",
		"/test/LoveLetter.js" 	: "/LoveLetterCore.js",
		"/test/Coup" 			: "/CoupCoreTest.html",
		"/test/Coup.js" 		: "/CoupCore.js",
		
		"/" 		: "/index.html",
	};
	if(pathname in hardRoute)
		return hardRoute[pathname];
	else if(pathname.startsWith('/pic/') && !pathname.endsWith('/'))
		return pathname;
	else if(pathname.endsWith('Ext.js'))
		return pathname;
};
module.exports = route;