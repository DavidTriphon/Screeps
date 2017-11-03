/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Reserve');
 * mod.thing == 'a thing'; // true
 */

JobHire = require('Job.Hire');
Task = require('Task');
require('UserException');
require('API.RoomPosition');

class JobReserve extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobReserve');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - controller
    //   - id : string
    //   - pos : posData
    // - expireTime : number
    // - creepNames : []
    
    static create(controller)
    {
        // make sure the main directory exists.
        if (Memory.JobReserve == undefined)
            Memory.JobReserve = {};
        
        // make sure controller is a controller
        if (!(controller instanceof StructureController))
            throw new UserException('The controller is not a controller:\n- controller: ' + JSON.stringify(controller));
        
        // set the id by using the controller id.
        let id = controller.id;
        
        // make sure that the reserve job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The reserver for this site is already defined.');
        
        // set up local object
        Memory.JobReserve[id] = {};
        
        // set site position
        Memory.JobReserve[id].controller = {id: controller.id, pos: controller.pos};
        
        // set up creep employee array
        Memory.JobReserve[id].creepNames = [];
        
        // return the new object.
        return new JobReserve(id);
    }
    
    static remove(id)
    {
        // set whether it already exists
        let exists = (Memory.JobReserve[id] === undefined);
        // delete it
        delete Memory.JobReserve[id];
        // return true if it existed and was deleted, false if it wasn't.
        return exists;
    }
    
    static isJob(id)
    {
        return (Memory.JobReserve[id] !== undefined);
    }
    
    // =============================================================================
    //  EXECUTE METHOD
    // =============================================================================
    
    execute()
    {
        let controller = this.getController();
        
        // update the controller expite time if it is visible.
        if ((controller != undefined) && (controller.reservation != undefined))
        {
            Memory.JobReserve[this.id].expireTime = Game.time + controller.reservation.ticksToEnd;
        }
        
        // make the creeps do their thing
        for (let creep of this.getCreeps())
        {
            try
            {
                // creep.say('I\'m a reserver!');
                
                let result = creep.doTask();
                
                if (result !== taskResults.NOT_DONE)
                {
                    if (controller == undefined)
                    {
                        let controllerPos = this.getControllerPosition();
                        creep.setTask(new Task.moveToPos(controllerPos, 1));
                    }
                    else
                    {
                        creep.setTask(new Task.reserve(controller));
                    }
                    
                    
                    creep.doTask();
                }
            }
            catch (e)
            {
                console.log('The creep ' + creep.name + ' had an issue when trying to execute for the job ' + this.jobType + '.\n' + e.stack);
            }
        }
    }
    
    // =============================================================================
    //  CONTROLLER METHODS
    // =============================================================================
    
    getControllerPosition()
    {
        if (this.controllerPos === undefined)
            this.controllerPos = RoomPosition.deserialize(Memory.JobReserve[this.id].controller.pos);
        
        return this.controllerPos;
    }
    
    getController()
    {
        if (this.controller === undefined)
            this.controller = Game.getObjectById(Memory.JobReserve[this.id].controller.id);
        
        return this.controller;
    }
    
    getExpireTime()
    {
        return Memory.JobReserve[this.id].expireTime;
    }
}

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobReserve;