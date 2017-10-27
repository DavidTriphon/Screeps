/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.moveToPos');
 * mod.thing == 'a thing'; // true
 */

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskMoveToPos(pos, range)
{
    this.pos = pos;
    this.range = range;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskMoveToPos.fromMemory = function(taskData)
{
    let pos = new RoomPosition(taskData.pos.x, taskData.pos.y, taskData.pos.roomName);
    
    return new TaskMoveToPos(pos, taskData.range);
}

TaskMoveToPos.prototype.toMemory = function()
{
    let data =
    {
        type: 'moveToPos',
        pos: this.pos,
        range: this.range
    };
    
    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskMoveToPos.prototype.execute = function(creep)
{
    let distance = this.pos.squareDistanceTo(creep.pos);
    
    if (distance <= this.range)
        return taskResults.DONE;
    
    creep.moveTo(this.pos);
    
    return taskResults.NOT_DONE;
}

module.exports = TaskMoveToPos;