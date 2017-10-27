/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.harvest');
 * mod.thing == 'a thing'; // true
 */

MoveToPos = require('Task.moveToPos');

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskHarvest(target)
{
    this.target = target;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskHarvest.fromMemory = function(taskData)
{
    let target = Game.getObjectById(taskData.id);
    
    if (target === undefined)
    {
        return TaskMoveToPos.fromMemory(taskData, 1);
    }
    else
    {
        return new TaskHarvest(target);
    }
}

TaskHarvest.prototype.toMemory = function()
{
    let data =
    {
        type: 'harvest',
        id: this.target.id,
        pos: this.target.pos,
        retarget: (this.isMineral() ? RESOURCE_ENERGY : this.target.mineralType)
    };
    
    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskHarvest.prototype.isMineral = function()
{
    return (this.target instanceof Source);
}

TaskHarvest.prototype.execute = function(creep)
{
    let result = creep.harvest(this.target);
    
    if (result === ERR_NOT_IN_RANGE)
    {
        creep.moveTo(this.target);
    }
    
    let emptySpace = creep.emptySpace();
    let mined = creep.getActiveBodyparts(WORK) * (this.isMineral() ? HARVEST_MINERAL_POWER : HARVEST_POWER);
    let isFullNext = ((emptySpace - mined) <= 0);
    
    if (creep.isFull() || ((result === OK) && isFullNext))
    {
        return taskResults.DONE;
    }
    else
    {
        return taskResults.NOT_DONE;
    }
}

module.exports = TaskHarvest;