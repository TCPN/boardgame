#!/bin/env node
var server = require("http").createServer(handler);
var io = require("socket.io")(server);
var fs = require("fs");
var url = require("url");
var createUser = require("./WaitForGame").createUser;
var route = require("./route");

var port = 80;
if(process.argv.length >= 3)
	port = parseInt(process.argv[2]);
if(process.env.OPENSHIFT_NODEJS_PORT == null)
{
	server.listen(port);
}
else
{
	server.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP);
}

function handler (req, res) {
	var pathname = url.parse(req.url).pathname;
	var returnPage = route(pathname);
	if(returnPage == undefined) console.log("cannot find " + pathname);
	if(returnPage == undefined)
	{
		res.writeHead(404);
		res.end("Page not found");
		return;
	}
	fs.readFile(__dirname + returnPage,
	function (err, data) {
		if (err) {
			console.log(err);
			res.writeHead(500);
			return res.end("Error loading " + pathname);
		}
		res.statusCode = 200;
		if(pathname.endsWith(".css"))
			res.setHeader("Content-Type", "text/css");
		else
			res.setHeader("Content-Type", "text/html");
		res.end(data);
	});
}

io.on('connection', createUser);
