/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.reserve');
 * mod.thing == 'a thing'; // true
 */

MoveToPos = require('Task.moveToPos');

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskReserve(controller)
{
    this.controller = controller;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskReserve.fromMemory = function(taskData)
{
    let controller = Game.getObjectById(taskData.id);
    
    if (controller === undefined)
    {
        return TaskMoveToPos.fromMemory(taskData, 1);
    }
    else
    {
        return new TaskReserve(controller);
    }
}

TaskReserve.prototype.toMemory = function()
{
    let data =
    {
        type: 'reserve',
        id: this.controller.id,
        pos: this.controller.pos
    };
    
    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskReserve.prototype.execute = function(creep)
{
    // try to reserve the controller
    let result = creep.reserveController(this.controller);
    
    if (result === ERR_NOT_IN_RANGE)
    {
        creep.moveTo(this.controller);
    }
    
    if (this.controller.reservation &&
        this.controller.reservation.ticksToEnd === 5000 &&
        this.controller.reservation.owner === MY_USERNAME)
    {
        return taskResults.DONE;
    }
    else
    {
        return taskResults.NOT_DONE;
    }
}

module.exports = TaskReserve;