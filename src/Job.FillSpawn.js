/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.FillSpawn');
 * mod.thing == 'a thing'; // true
 */

JobHire = require('Job.Hire');
Task = require('Task');
require('UserException');
require('API.RoomPosition');

class JobFillSpawn extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobFillSpawn');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - pickUp
    //   - id : string
    //   - pos : posData
    // - creepNames : []
    
    static create(room, pickUpStructure)
    {
        // make sure the main directory exists.
        if (Memory.JobFillSpawn == undefined)
            Memory.JobFillSpawn = {};
        
        // make sure the room is a room
        if (!(room instanceof Room))
            throw new UserException('The main room is not a room:\n- room: ' + JSON.stringify(site));
        
        // make sure the pickUpStructure is a structure
        if (!(pickUpStructure instanceof Structure))
            throw new UserException('The pick up structure is not a structure:\n- structure: ' + JSON.stringify(site));
        
        // set the id by using the room name.
        let id = room.name;
        
        // make sure that the fillSpawn job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The spawn filler for this room is already defined.');
        
        // set up local object
        Memory.JobFillSpawn[id] = {};
        
        // set the pick up structure
        Memory.JobFillSpawn[id].pickUp = {id: structure.id, pos: structure.pos.serialize(), type: structure.structureType};
        
        // set up creep employee array
        Memory.JobFillSpawn[id].creepNames = [];
        
        // return the new object.
        return new JobFillSpawn(id);
    }
    
    static remove(id)
    {
        delete Memory.JobFillSpawn[id];
    }
    
    static isJob(id)
    {
        return (Memory.JobFillSpawn[id] !== undefined);
    }
    
    // =============================================================================
    //  EXECUTE METHOD
    // =============================================================================
    
    execute()
    {
        for (let creep of this.getCreeps())
        {
            try
            {
                // creep.say('I\'m a builder!');
                
                let result = creep.doTask();
                
                if (result !== taskResults.NOT_DONE)
                {
                    // get the work task or refill task based on whether it's empty
                    
                    
                    let task;
                    
                    if (creep.isEmptyOf(RESOURCE_ENERGY))
                    {
                        task = this.getRefillTask();
                    }
                    else
                    {
                        let room = this.getRoom();
                        let structures = room.find(FIND_MY_STRUCTURES);
                        let extensions = _.filter(structures, (structure) => (structure.structureType === STRUCTURE_EXTENSION));
                        let spawns = _.filter(structures, (structure) => (structure.structureType === STRUCTURE_SPAWN));
                        
                        if (this.getPickUpData().type === STRUCTURE_SPAWN)
                        {
                            let index = spawns.indexOf(this.getPickUpStructure());
                            
                            if (index > -1)
                            {
                                // remove the spawn that we fill from, from the list of things to fill.
                                spawns.splice(index, 1);
                            }
                        }
                        
                        let fillers = extensions.concat(spawns);
                        let toFill = _.filter(fillers, (fill) => (fill.energy < fill.energyCapacity));
                        
                        let dropOff = creep.pos.findClosestByRange(toFill);
                        
                        if (dropOff == null)
                        {
                            task = null;
                        }
                        else
                        {
                            task = new Task.transfer(dropOff);
                        }
                    }
                    
                    // set the task and do it once this tick
                    creep.setTask(task);
                    creep.doTask();
                }
            }
            catch (e)
            {
                console.log('The creep ' + creep.name + ' had an issue when trying to execute for the job ' + this.jobType + '.\n' + e.stack);
            }
        }
    }
    
    getRefillTask()
    {
        if (this.refillTask === undefined)
        {
            let pickUpData = this.getPickUpData();
            let pickUpPos = RoomPosition.deserialize(pickUpData.pos);
            let pickUpRoom = Game.rooms[pickUpPos.roomName];
            let pickUp = Game.getObjectById(pickUpData.id);
            
            let task = null;
            
            if (pickUp === undefined || pickUp === null)
            {
                // the pickUp is not visible
                
                if (pickUpRoom === undefined)
                {
                    // the room is not visible
                    
                    // just go to the room by heading to the pickUp
                    task = new Task.moveToPos(pickUpPos, 1);
                }
                else
                {
                    // the room is visible
                    
                    // Well apparently the structure to pick up from is gone, this is not good.
                    
                    throw new UserException('The structure to pick up from for JobFillSpawn[' + this.id + '] is no longer visible!');
                }
            }
            else
            {
                // the pickUp is visible
                
                task = new Task.withdraw(pickUp);
            }
            
            this.refillTask = task;
        }
        
        return this.refillTask;
    }
    
    // =============================================================================
    //  ROOM METHODS
    // =============================================================================
    
    getRoom()
    {
        return Game.rooms[this.id];
    }
    
    // =============================================================================
    //  PICKUP METHODS
    // =============================================================================
    
    getPickUpData()
    {
        return Memory.JobFillSpawn[this.id].pickUp;
    }
    
    getPickUpStructure()
    {
        if (this.pickUp === undefined)
        {
            this.pickUp === Game.getObjectById(this.getPickUpData());
        }
        
        return this.pickUp;
    }
    
    setPickUpStructure(structure)
    {
        if (!(structure instanceof Structure))
            throw new UserException('The pick up structure is not a structure:\n- structure: ' + JSON.stringify(structure));
        
        Memory.JobFillSpawn[this.id].pickUp = {id: structure.id, pos: structure.pos.serialize(), type: structure.structureType};
    }
}

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobFillSpawn;