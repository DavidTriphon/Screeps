/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('creep');
 * mod.thing == 'a thing'; // true
 */

Task = require('Task');

module.exports = {};

// =============================================================================
//  TASK HANDLERS
// =============================================================================

Creep.prototype.setTask = function(task)
{
    if (task === undefined || task === null)
        this.memory.task = null;
    else
        this.memory.task = task.toMemory();
}

Creep.prototype.getTask = function()
{
    let taskData = this.memory.task;

    if (taskData === undefined || taskData === null)
    {
        return null;
    }
    else
    {
        return Task[taskData.type].fromMemory(taskData);
    }
}

Creep.prototype.getTaskType = function()
{
    return this.memory.task.type;
}

Creep.prototype.doTask = function()
{
    let task = this.getTask();

    if (task === null)
    {
        return taskResults.NONE;
    }
    else
    {
        return task.execute(this);
    }
}

// =============================================================================
//  MOVE METHODS
// =============================================================================

Creep.prototype.moveToRoom = function(room)
{
    roomName = (room.name === undefined ? room : room.name);

    return this.moveTo(new RoomPosition(25, 25, roomName), {range: 23});
}

// =============================================================================
//  CAPABILITY METHODS
// =============================================================================

Creep.prototype.getUnladenMoveSpeed = function()
{
    if (this.memory.unladenSpeed === undefined)
    {
        let heavyParts = 0;
        let moveParts = 0;

        for (let index in this.body)
        {

        }
    }

    return this.memory.unladenSpeed;
}

// =============================================================================
//  CARRY ABSTRACTION METHODS
// =============================================================================

Creep.prototype.filledSpace = function()
{
    // jump out if broke
    if (this === Room.prototype || this == undefined)
        return;

    // if the 1 tick variable isn't set, set it
    if (this._filledSpace === undefined)
        this._filledSpace = _.sum(this.carry);

    // return the result
    return this._filledSpace;
}

Creep.prototype.emptySpace = function()
{
    // jump out if broke
    if (this === Room.prototype || this == undefined)
        return;

    // if the 1 tick variable isn't set, set it
    if (this._emptySpace === undefined)
        this._emptySpace = this.carryCapacity - this.filledSpace();

    // return the result
    return (this._emptySpace);
}

Creep.prototype.isFull = function()
{
    // jump out if broke
    if (this === Room.prototype || this == undefined)
        return;

    // if the 1 tick variable isn't set, set it
    if (this._isFull === undefined)
        this._isFull = (this.emptySpace() === 0);

    // return the result
    return (this._isFull);
}

Creep.prototype.isFullOf = function(resource)
{
    // jump out if broke
    if (this === Room.prototype || this == undefined)
        return;

    // make sure the isFullOf is already labelled.
    if (this._isFullOf === undefined)
        this._isFullOf = {};

    // if the 1 tick variable isn't set, set it
    if (this._isFullOf[resource] === undefined)
        this._isFullOf[resource] = (this.carry[resource] === creep.carryCapacity);

    // return the result
    return (this._isFullOf[resource]);
}

Creep.prototype.isEmpty = function()
{
    // jump out if broke
    if (this === Room.prototype || this == undefined)
        return;

    // if the 1 tick variable isn't set, set it
    if (this._filledSpace === undefined)
        this._filledSpace = (this.filledSpace() === 0);

    // return the result
    return (this._filledSpace);
}

Creep.prototype.isEmptyOf = function(resource)
{
    // jump out if broke
    if (this === Room.prototype || this == undefined)
        return;

    // make sure the isFullOf is already labelled.
    if (this._isEmptyOf === undefined)
        this._isEmptyOf = {};

    // if the 1 tick variable isn't set, set it
    if (this._isEmptyOf[resource] === undefined)
        this._isEmptyOf[resource] = (this.carry[resource] === 0);

    // return the result
    return (this._isEmptyOf[resource]);
}
