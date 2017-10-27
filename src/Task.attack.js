/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.attack');
 * mod.thing == 'a thing'; // true
 */

MoveToPos = require('Task.moveToPos');

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskAttack(target)
{
    this.target = target;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskAttack.fromMemory = function(taskData)
{
    let target = Game.getObjectById(taskData.id);
    
    return new TaskAttack(target);
}

TaskAttack.prototype.toMemory = function()
{
    let data =
    {
        type: 'attack',
        id: ((this.target == undefined) ? null : this.target.id)
    };
    
    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskAttack.prototype.execute = function(creep)
{
    // check to make sure target is defined
    if (this.target == undefined)
        return taskResults.DONE;
    
    creep.say('attack!');
    
    // try to attack the target
    creep.attack(this.target);
    
    // make sure you chase it if it runs.
    creep.moveTo(this.target);
    
    return taskResults.NOT_DONE;
}

module.exports = TaskAttack;