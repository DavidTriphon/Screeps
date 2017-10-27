/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Base');
 * mod.thing == 'a thing'; // true
 */

require('UserException');

class Base
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(roomName)
    {
        if (Memory.Base[roomName] === undefined)
            throw new UserException('There is no base in room ' + roomName + '.');
        
        this.roomName = roomName;
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // ?
    
    static create(roomName)
    {
        // make sure the main directory exists.
        if (Memory.Base == undefined)
            Memory.Base = {};
            
        if (Memory.Base.isBase(roomName))
            throw new UserException('There is already a base here.');
        
        // return the new object.
        return new Base(roomName);
    }
    
    static remove(roomName)
    {
        delete Memory.Base[roomName];
    }
    
    static isBase(roomName)
    {
        return (Memory.Base[roomName] !== undefined);
    }
    
    // =============================================================================
    //  EXECUTE METHOD
    // =============================================================================
    
    execute()
    {
        
    }
    
    // =============================================================================
    //  METHODS
    // =============================================================================
    
    
}

// =============================================================================
//  EXPORT
// =============================================================================
module.exports = Base;