/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Haul');
 * mod.thing == 'a thing'; // true
 */

var JobHire = require('Job.Hire');
var Task = require('Task');
require('UserException');
require('API.RoomPosition');

class JobHaul extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobHaul');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - resource : RESOURCE_*
    // - rate : number
    // - path : [posData]
    // - pickUp
    //   - id : string
    //   - pos : posData
    // - dropOff
    //   - id : string
    //   - pos : posData
    // - creepNames : [string]
    
    static create(pickUpStructure, dropOffStructure, resource, rate)
    {
        // make sure pickUpStructure is a structure
        if (!(pickUpStructure instanceof Structure))
            throw new UserException('The pick up structure is not a structure:\n- structure: ' + JSON.stringify(pickUpStructure));
        
        // make sure dropOffStructure is a structure
        if (!(dropOffStructure instanceof Structure))
            throw new UserException('The drop off structure is not a structure:\n- structure: ' + JSON.stringify(dropOffStructure));
        
        // make sure the resource is a defined resource type, defaults to energy
        if (resource === undefined)
            resource = RESOURCE_ENERGY;
        else if (!(RESOURCES_ALL.includes(resource)))
            throw new UserException('The resource supplied was not a specified resource constant:\n- resource: ' + JSON.stringify(resource));
        
        // make sure rate is a number, or if it is undefined, define it as Infinity.
        // this means you can hire as many creeps as possible, and they will
        // just haul as fast as they can.
        if (rate === undefined)
            rate = Infinity;
        else if ((typeof rate) !== 'number' || rate < 0)
            throw new UserException('The rate must be a positive number:\n- rate: ' + JSON.stringify(rate));
        
        // set the id by using the pickUp id.
        let id = pickUpStructure.id + dropOffStructure.id;
        
        // make sure the directory exists.
        if (Memory.JobHaul == undefined)
            Memory.JobHaul = {};
        
        // make sure that the haul job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The hauler for this pickUp and dropOff is already defined.');
        
        // set up local object
        Memory.JobHaul[id] = {};
        
        // set the pick up and drop off memory
        Memory.JobHaul[id].pickUp = {id: pickUpStructure.id, pos: pickUpStructure.pos.serialize()};
        Memory.JobHaul[id].dropOff = {id: dropOffStructure.id, pos: dropOffStructure.pos.serialize()};
        
        // set the max rate that the resource can flow, and the resource type
        Memory.JobHaul[id].rate = rate;
        Memory.JobHaul[id].resource = resource;
        
        // set up creep employee array
        Memory.JobHaul[id].creepNames = [];
        
        // return the new object.
        return new JobHaul(id);
    }
    
    static remove(id)
    {
        delete Memory.JobHaul[id];
    }
    
    static isJob(id)
    {
        return (Memory.JobHaul[id] !== undefined);
    }
    
    reassign(pickUpStructure, dropOffStructure, resource, rate)
    {
        let newJob = this.create(pickUpStructure, dropOffStructure, resource, rate);
        
        for (let creep of this.getCreeps())
        {
            newJob.hire(creep);
        }
        
        this.remove(this.id);
        
        return newJob;
    }
    
    // =============================================================================
    //  EXECUTE METHOD
    // =============================================================================
    
    execute()
    {
        for (let creep of this.getCreeps())
        {
            // creep.say('I\'m a hauler!');
            
            let result = creep.doTask();
            
            if (result !== taskResults.NOT_DONE)
            {
                let task = null;
                
                if (creep.carry[this.getResourceType()] >= creep.carryCapacity/2)
                {
                    let dropOffData = this.getDropOffData();
                    
                    let dropOff = Game.getObjectById(dropOffData.id);
                    
                    if (dropOff !== undefined)
                    {
                        // if the structure is visible
                        // try to transfer to it
                        task = new Task.transfer(dropOff, this.getResourceType());
                    }
                    else
                    {
                        //else give it a move task
                        task = new Task.moveToPos(RoomPosition.deserialize(dropOffData.pos), 2);
                    }
                }
                else
                {
                    let pickUpData = this.getPickUpData();
                    
                    let pickUp = Game.getObjectById(pickUpData.id);
                    
                    if (pickUp != undefined)
                    {
                        // if the structure is visible
                        // try to transfer to it
                        task = new Task.withdraw(pickUp, this.getResourceType());
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
    //  PICKUP / DROPOFF METHODS
    // =============================================================================
    
    getResourceType()
    {
        return Memory.JobHaul[this.id].resource;
    }
    
    getDropOffData()
    {
        return Memory.JobHaul[this.id].dropOff;
    }
    
    getPickUpData()
    {
        return Memory.JobHaul[this.id].pickUp;
    }
    
    getPathPositions()
    {
        if (Memory.JobHaul[this.id].path === undefined)
        {
            let dropOffPosition = RoomPosition.deserialize(this.getDropOffData().pos);
            let pickUpPosition = RoomPosition.deserialize(this.getPickUpData().pos);
            
            let options =
            {
                roomCallback: function(roomName)
                {
                    let costMatrix = new PathFinder.CostMatrix;
                    
                    
                    
                    let room = Game.rooms[roomName];
                    
                    
                }
            };
            
            let path = PathFinder.search(pickUpPosition, {pos: dropOffPosition, range: 3}, options);
            
            Memory.JobHaul[this.id].path = path;
        }
        
        return Memory.JobHaul[this.id].path;
    }
    
    getPathToDropOff()
    {
        
    }
    
    getPathToPickUp()
    {
        
    }
    
    // probably shouldn't use these methods since the id of the job is determined
    // by the locations, and changing ids is probably not ideal right now.
    _setDropOffStructure(structure)
    {
        Memory.JobHaul[this.id].dropOff = {id: structure.id, pos: structure.pos.serialize()};
    }
    
    // probably shouldn't use these methods since the id of the job is determined
    // by the locations, and changing ids is probably not ideal right now.
    _setPickUpStructure(structure)
    {
        Memory.JobHaul[this.id].pickUp = {id: structure.id, pos: structure.pos.serialize()};
    }
    
    
}

module.exports = JobHaul;