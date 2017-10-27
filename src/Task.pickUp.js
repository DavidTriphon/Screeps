/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.pickUp');
 * mod.thing == 'a thing'; // true
 */

MoveToPos = require('Task.moveToPos');

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskPickUp(resource)
{
    this.resource = resource;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskPickUp.fromMemory = function(taskData)
{
    let resource = Game.getObjectById(taskData.id);
    
    if (resource === undefined && Game.rooms[taskData.pos.roomName] === undefined)
    {
        return MoveToPos.fromMemory(taskData, 1);
    }
    else
    {
        return new TaskPickUp(resource);
    }
}

TaskPickUp.prototype.toMemory = function()
{
    let data =
    {
        type: 'pickUp',
        id: this.resource.id,
        pos: this.resource.pos
    };
    
    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskPickUp.prototype.execute = function(creep)
{
    // the resource is gone or completely picked up.
    if (this.resource === undefined || this.resource === null)
    {
        return taskResults.DONE;
    }
    
    // get whether it successfully picked it up
    let result = creep.pickup(this.resource);
    
    if (result === ERR_NOT_IN_RANGE)
    {
        creep.moveTo(this.resource);
    }
    else if (result !== OK)
    {
        return taskResults.INCAPABLE;
    }
    
    if (creep.isFull() || (result === OK))
    {
        return taskResults.DONE;
    }
    else
    {
        return taskResults.NOT_DONE;
    }
}

module.exports = TaskPickUp;