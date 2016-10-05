if(require != undefined)
{
	// ArrayExt = require('./ArrayExt').ArrayExt;
	// MathExt = require('./MathExt').MathExt;
	// ObjectExt = require('./ObjectExt').ObjectExt;
	// Card = require('./Card').Card;
	// Deck = require('./Deck').Deck;
	// Dice = require('./Dice').Dice;
	// Player = require('./Player').Player;
	// Position = require('./Position').Position;
	// Token = require('./Token').Token;
	// Game = require('./Game').Game;
}
if(exports != undefined) exports.Token = Token;

function Token(params)
{
	for(k in params)
	{
		this[k] = params[k];
	}
	this.parent = null;
	
	return this;
}