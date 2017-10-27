/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.upgrade');
 * mod.thing == 'a thing'; // true
 */

MoveToPos = require('Task.moveToPos');

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskUpgrade(controller)
{
    this.controller = controller;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskUpgrade.fromMemory = function(taskData)
{
    let room = Game.rooms[taskData.room];
    
    if (room === undefined)
    {
        return TaskMoveToPos.fromMemory(taskData, 3);
    }
    else
    {
        return new TaskUpgrade(room.controller);
    }
}

TaskUpgrade.prototype.toMemory = function()
{
    let data =
    {
        type: 'upgrade',
        room: this.controller.room.name,
        pos: this.controller.pos
    };
    
    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskUpgrade.prototype.execute = function(creep)
{
    let result = creep.upgradeController(this.controller);
    
    if (result === ERR_NOT_IN_RANGE)
    {
        creep.moveTo(this.controller);
    }
    
    let energy = creep.carry[RESOURCE_ENERGY];
    let workParts = creep.getActiveBodyparts(WORK);
    let nextEnergy = energy - workParts;
    let isEmptyNext = (nextEnergy <= 0);
    
    if (creep.isEmptyOf(RESOURCE_ENERGY) || ((result === OK) && (isEmptyNext)))
    {
        return taskResults.DONE;
    }
    else
    {
        return taskResults.NOT_DONE;
    }
}

module.exports = TaskUpgrade;