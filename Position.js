if(require != undefined)
{
	ArrayExt = require('./ArrayExt').ArrayExt;
	MathExt = require('./MathExt').MathExt;
	ObjectExt = require('./ObjectExt').ObjectExt;
	// Card = require('./Card').Card;
	// Deck = require('./Deck').Deck;
	// Dice = require('./Dice').Dice;
	// Player = require('./Player').Player;
	// Position = require('./Position').Position;
	// Token = require('./Token').Token;
	// Game = require('./Game').Game;
}
if(exports != undefined) exports.Position = Position;

function Position(params)
{
	this.items = [];
	this.add = function(item)
	{
		if(item.parent)item.parent.remove(item);
		this.items.add(item);
		item.parent = this;
		return this;
	};
	this.remove = function(item)
	{
		this.items.remove(item);
		item.parent = null;
		return this;
	};
	for(k in params)
	{
		this[k] = params[k];
	}
	this.parent = null;
	
	return this;
}