/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Enum');
 * mod.thing == 'a thing'; // true
 */

// copied from https://github.com/tolgaek/node-enum/blob/master/lib/micro-enum-DOCUMENTED.js

var Enum = function() // this is what the arguments are passed to
{
	var values = arguments; // get the varargs and save them to a 'values' variable.
	var self = { // prepare a 'self' object to return, so we work with an object instead of a function
		all : [],     // prepare a list of all indices
		keys : values // create the list of all keys
	};

	for(var i = 0; i < values.length; i++) // for all enum names given
	{
		self[values[i]] = i; // add the variable to this object
		self.all[i] = i;     // add the index to the list of all indices
	}

	return Object.freeze(self); // return the 'self' object, instead of this function
}

module.exports = Enum;
