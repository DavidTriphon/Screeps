/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Loot');
 * mod.thing == 'a thing'; // true
 */

JobHire = require('Job.Hire');
Task = require('Task');
require('UserException');
require('API.RoomPosition');

class JobLoot extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobLoot');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - resource
    //   - id : string
    //   - pos : posData
    // - dropOff
    //   - id : string
    //   - pos : posData
    // - isGone : boolean
    // - creepNames : []
    
    static create(resource, dropOffStructure)
    {
        // make sure the main directory exists.
        if (Memory.JobLoot == undefined)
            Memory.JobLoot = {};
        
        // make sure resource is a source
        if (!(resource instanceof ConstructionSite))
            throw new UserException('The resource is not a resource:\n- resource: ' + JSON.stringify(resource));
        
        // make sure dropOffStructure is a structure
        if (!(dropOffStructure instanceof Structure))
            throw new UserException('The drop off structure is not a structure:\n- structure: ' + JSON.stringify(dropOffStructure));
        
        // set the id by using the resource id.
        let id = resource.id;
        
        // make sure that the loot job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The looter for this resource is already defined.');
        
        // set up local object
        Memory.JobLoot[id] = {};
        
        // set resource position and id
        Memory.JobLoot[id].resource = {id: resource.id, pos: resource.pos.serialize()};
        
        // set drop off structure position and id
        Memory.JobLoot[id].dropOff = {id: dropOffStructure.id, pos: dropOffStructure.pos.serialize()};
        
        // set default loot completeness to false
        Memory.JobLoot[id].isGone = false;
        
        // set up creep employee array
        Memory.JobLoot[id].creepNames = [];
        
        // return the new object.
        return new JobLoot(id);
    }
    
    static remove(id)
    {
        delete Memory.JobLoot[id];
    }
    
    static isJob(id)
    {
        return (Memory.JobLoot[id] !== undefined);
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
                // creep.say('I\'m a looter!');
                
                let result = creep.doTask();
                
                if (result !== taskResults.NOT_DONE)
                {
                    let task = null;
                    
                    if (this.isGone())
                    {
                        // the resource is gone, send this creep back home.
                        task = this.getDropOffTask();
                    }
                    else
                    {
                        // get the task based on whether the creep is empty or not.
                        task = ((creep.isEmpty()) ?
                            (this.getWorkTask()) :
                            (this.getDropOffTask()));
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
        
        if (this.isGone())
        {
            let unDoneCreep = _.find(this.getCreeps(), (creep) => (creep.getTask().type === ''))
        }
    }
    
    getWorkTask()
    {
        if (this.workTask === undefined)
        {
            let resourceData = this.getResourceData();
            let resourcePos = RoomPosition.deserialize(resourceData.pos); // to know where to look for the resource or go when it's not visible
            let resourceRoom = Game.rooms[resourcePos.roomName]; // to know whether the resource should be visible or not
            let resource = Game.getObjectById(resourceData.id); // the actual resource instance
            
            let task = null;
            
            if (resource === undefined || resource === null)
            {
                // the resource is not visible
                
                if (resourceRoom === undefined)
                {
                    // the room is not visible
                    
                    // just go to the room of the resource by heading to the resource
                    task = new Task.moveToPos(resourcePos, 1);
                }
                else
                {
                    // the room is visible
                    // the resource is gone
                    
                    // also, the code should have prevented getWorktask from getting called if there is no longer a resource...
                    
                    // TODO: <===
                    
                    // task = new 
                }
            }
            else
            {
                // the resource is visible
                
                task = new Task.build(resource);
            }
            
            this.workTask = task;
        }
        
        return this.workTask;
    }
    
    getDropOffTask()
    {
        if (this.refillTask === undefined)
        {
            let dropOffData = this.getdropOffData();
            let dropOffPos = RoomPosition.deserialize(dropOffData.pos);
            let dropOffRoom = Game.rooms[dropOffPos.roomName];
            let dropOff = Game.getObjectById(dropOffData.id);
            
            let task = null;
            
            if (dropOff === undefined || dropOff === null)
            {
                // the dropOff is not visible
                
                if (dropOffRoom === undefined)
                {
                    // the room is not visible
                    
                    // just go to the room by heading to the dropOff
                    task = new Task.moveToPos(dropOffPos, 1);
                }
                else
                {
                    // the room is visible
                    
                    // Well apparently the structure to pick up from is gone, this is not good.
                    
                    throw new UserException('The structure to drop off at for JobLoot[' + this.id + '] is no longer there!');
                }
            }
            else
            {
                // the dropOff is visible
                
                task = new Task.transfer(dropOff);
            }
            
            this.refillTask = task;
        }
        
        return this.refillTask;
    }
    
    // =============================================================================
    //  RESOURCE / COMPLETENESS METHODS
    // =============================================================================
    
    getResourceData()
    {
        return Memory.JobLoot[this.id].resource;
    }
    
    isGone()
    {
        if (!Memory.JobLoot[this.id].isGone)
        {
            
            
            Memory.JobLoot[this.id].isGone
        }
        
        return (Memory.JobLoot[this.id].isGone);
    }
    
    // =============================================================================
    //  PICKUP METHODS
    // =============================================================================
    
    getDropOffData()
    {
        return Memory.JobLoot[this.id].dropOff;
    }
    
    setDropOffStructure(structure)
    {
        if (!(structure instanceof Structure))
            throw new UserException('The pick up structure is not a structure:\n- structure: ' + JSON.stringify(structure));
        
        Memory.JobLoot[this.id].dropOff = {id: structure.id, pos: structure.pos.serialize()};
    }
}

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobLoot;