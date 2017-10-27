/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('UserException');
 * mod.thing == 'a thing'; // true
 */

class UserException
{
    constructor(message, name)
    {
        // defaults for exception object variables
        if (message === undefined)
            message = 'No message was defined.';
        
        if (name === undefined)
            name = 'UserException';
        
        // setting error object properties.
        this.message = message;
        this.name = name;
    }
}

module.exports = UserException;