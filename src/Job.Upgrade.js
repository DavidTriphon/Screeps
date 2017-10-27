/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Upgrade');
 * mod.thing == 'a thing'; // true
 */

JobHire = require('Job.Hire');
Task = require('Task');
require('UserException');
require('API.RoomPosition');

class JobUpgrade extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobUpgrade');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - controllerRoomName : string
    // - pickUp
    //   - id : string
    //   - pos : posData
    // - creepNames : []
    
    static create(controller, pickUpStructure)
    {
        // make sure the main directory exists.
        if (Memory.JobUpgrade == undefined)
            Memory.JobUpgrade = {};
        
        // make sure controller is a source
        if (!(controller instanceof StructureController))
            throw new UserException('The controller is not a controller:\n- controller: ' + JSON.stringify(controller));
        
        // make sure pickUpStructure is a structure
        if (!(pickUpStructure instanceof Structure))
            throw new UserException('The pick up structure is not a structure:\n- structure: ' + JSON.stringify(pickUpStructure));
        
        // set the id by using the controller id.
        let id = controller.id;
        
        // make sure that the upgrade job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The upgrader for this room is already defined.');
        
        // set up local object
        Memory.JobUpgrade[id] = {};
        
        // set the controller position and id
        Memory.JobUpgrade[id].controller = {id: controller.id, pos: controller.pos.serialize()};
        
        // set pick up structure position and id
        Memory.JobUpgrade[id].pickUp = {id: pickUpStructure.id, pos: pickUpStructure.pos.serialize()};
        
        // set up creep employee array
        Memory.JobUpgrade[id].creepNames = [];
        
        // return the new object.
        return new JobUpgrade(id);
    }
    
    static remove(id)
    {
        delete Memory.JobUpgrade[id];
    }
    
    static isJob(id)
    {
        return (Memory.JobUpgrade[id] !== undefined);
    }
    
    // =============================================================================
    //  EXECUTE METHOD
    // =============================================================================
    
    execute()
    {
        for (let creep of this.getCreeps())
        {
            // creep.say('I\'m a upgrader!');
            
            let result = creep.doTask();
            
            if (result !== taskResults.NOT_DONE)
            {
                let task = null;
                
                if (creep.carry[RESOURCE_ENERGY] >= creep.carryCapacity/2)
                {
                    let controllerData = this.getControllerData();
                    
                    let controller = Game.getObjectById(controllerData.id);
                    
                    if (controller !== undefined)
                    {
                        // if the controller is visible
                        // try to upgrade to it
                        task = new Task.upgrade(controller);
                    }
                    else
                    {
                        //else give it a move task
                        task = new Task.moveToPos(RoomPosition.deserialize(controllerData.pos), 2);
                    }
                }
                else
                {
                    let pickUpData = this.getPickUpData();
                    
                    let pickUp = Game.getObjectById(pickUpData.id);
                    
                    if (pickUp !== undefined)
                    {
                        // if the pickUp is visible
                        // try to withdraw from it
                        task = new Task.withdraw(pickUp);
                    }
                    else
                    {
                        //else give it a move task
                        task = new Task.moveToPos(RoomPosition.deserialize(pickUpData.pos), 2);
                    }
                }
                
                // set the task and do it once this tick
                creep.setTask(task);
                creep.doTask();
            }
        }
    }
    
    // =============================================================================
    //  CONTROLLER METHODS
    // =============================================================================
    
    getControllerData()
    {
        return Memory.JobUpgrade[this.id].controller;
    }
    
    // =============================================================================
    //  PICKUP METHODS
    // =============================================================================
    
    getPickUpData()
    {
        return Memory.JobUpgrade[this.id].pickUp;
    }
    
    setPickUpStructure(structure)
    {
        Memory.JobUpgrade[this.id].pickUp = {id: structure.id, pos: structure.pos.serialize()};
    }
}

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobUpgrade;