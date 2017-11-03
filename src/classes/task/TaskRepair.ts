/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.repair');
 * mod.thing == 'a thing'; // true
 */

MoveToPos = require('Task.moveToPos');

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskRepair(structure)
{
    this.structure = structure;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskRepair.fromMemory = function(taskData)
{
    let structure = Game.getObjectById(taskData.id);
    
    if (structure === undefined)
    {
        return TaskMoveToPos.fromMemory(taskData, 3);
    }
    else
    {
        return new TaskRepair(structure);
    }
}

TaskRepair.prototype.toMemory = function()
{
    let data =
    {
        type: 'repair',
        id: this.structure.id,
        pos: this.structure.pos
    };
    
    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskRepair.prototype.execute = function(creep)
{
    let result = creep.repair(this.structure);
    
    if (result === ERR_NOT_IN_RANGE)
    {
        creep.moveTo(this.structure);
    }
    
    if (creep.isEmptyOf(RESOURCE_ENERGY) || this.structure.hits === this.structure.hitsMax)
    {
        return taskResults.DONE;
    }
    else
    {
        return taskResults.NOT_DONE;
    }
}

module.exports = TaskRepair;