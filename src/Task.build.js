/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.build');
 * mod.thing == 'a thing'; // true
 */

MoveToPos = require('Task.moveToPos');

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskBuild(site)
{
    this.site = site;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskBuild.fromMemory = function(taskData)
{
    let site = Game.getObjectById(taskData.id);
    
    if (site === undefined && Game.rooms[taskData.pos.roomName] === undefined)
    {
        return TaskMoveToPos.fromMemory(taskData, 3);
    }
    else
    {
        return new TaskBuild(site);
    }
}

TaskBuild.prototype.toMemory = function()
{
    let data;
    
    if (this.site)
    {
        data =
        {
            type: 'build',
            id: this.site.id,
            pos: this.site.pos
        };
    }
    else
    {
        data =
        {
            type: 'build'
        };
    }
    
    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskBuild.prototype.execute = function(creep)
{
    // if the site is unspecified, say you're done building it.
    if (this.site == undefined)
        return taskResults.DONE;
    
    // get the result from building the site
    let result = creep.build(this.site);
    
    // move if not in range
    if (result === ERR_NOT_IN_RANGE)
        creep.moveTo(this.site);
    
    let used = creep.getActiveBodyparts(WORK) * BUILD_POWER;
    let isEmptyNext = ((creep.carry[RESOURCE_ENERGY] - used) <= 0);
    
    // stop if the creep is empty now
    if (isEmptyNext)
        return taskResults.DONE;
    else
        return taskResults.NOT_DONE;
}

module.exports = TaskBuild;