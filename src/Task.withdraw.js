/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task.withdraw');
 * mod.thing == 'a thing'; // true
 */

var MoveToPos = require('Task.moveToPos');

// =============================================================================
//  CONSTRUCTOR
// =============================================================================

function TaskWithdraw(structure, resource) {
    this.resource = (resource === undefined ? RESOURCE_ENERGY : resource);
    this.structure = structure;
}

// =============================================================================
//  MEMORY METHODS
// =============================================================================

TaskWithdraw.fromMemory = function(taskData) {
    let structure = Game.getObjectById(taskData.id);

    if (structure === undefined) {
        return MoveToPos.fromMemory(taskData, 1);
    } else {
        return new TaskWithdraw(structure, taskData.resource);
    }
}

TaskWithdraw.prototype.toMemory = function() {
    let data = {
        type: 'withdraw',
        resource: this.resource,
        id: (this.structure ? this.structure.id : null),
        pos: (this.structure ? this.structure.pos : null)
    };

    return data;
}

// =============================================================================
//  INSTANCE METHODS
// =============================================================================

TaskWithdraw.prototype.execute = function(creep) {
    if (this.structure == undefined)
        return taskResults.INCAPABLE;

    if (this.resource === RESOURCE_ENERGY) {
        if ((this.structure.energy !== undefined && this.structure.energy === 0) ||
            this.structure.store !== undefined && this.structure.store[this.resource] === 0) {
            return taskResults.DONE;
        }
    } else {
        if (this.structure.store !== undefined && this.structure.store[this.resource] === 0) {
            return taskResults.DONE;
        }
    }

    let result = creep.withdraw(this.structure, this.resource);

    if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.structure);
    } else if (result !== OK) {
        return taskResults.INCAPABLE;
    }

    if (creep.isFull() || (result === OK)) {
        return taskResults.DONE;
    } else {
        return taskResults.NOT_DONE;
    }
}

module.exports = TaskWithdraw;
