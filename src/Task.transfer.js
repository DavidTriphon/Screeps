/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.transfer');
 * mod.thing == 'a thing'; // true
 */

MoveToPos = require('Task.moveToPos');

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskTransfer(structure, resource)
{
    this.resource = (resource === undefined ? RESOURCE_ENERGY : resource);
    this.structure = structure;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskTransfer.fromMemory = function(taskData)
{
    let structure = Game.getObjectById(taskData.id);
    
    if (structure === undefined)
    {
        return MoveToPos.fromMemory(taskData, 1);
    }
    else
    {
        return new TaskTransfer(structure, taskData.resource);
    }
}

TaskTransfer.prototype.toMemory = function()
{
    let data =
    {
        type: 'transfer',
        resource: this.resource,
        id: this.structure.id,
        pos: this.structure.pos
    };
    
    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskTransfer.prototype.execute = function(creep)
{
    if (this.structure.energy !== undefined ? 
        (this.structure.energy === this.structure.energyCapacity) :
        (this.structure.store[RESOURCE_ENERGY] === this.structure.storeCapacity)
    )
    {
        return taskResults.DONE;
    }
    
    let result = creep.transfer(this.structure, this.resource);
    
    if (result === ERR_NOT_IN_RANGE)
    {
        creep.moveTo(this.structure);
    }
    else if (result !== OK)
    {
        return taskResults.INCAPABLE;
    }
    
    if (creep.isEmpty() || (result === OK))
    {
        return taskResults.DONE;
    }
    else
    {
        return taskResults.NOT_DONE;
    }
}

module.exports = TaskTransfer;