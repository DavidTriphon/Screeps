/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Mine');
 * mod.thing == 'a thing'; // true
 */

var taskResults = require('')
var JobHire = require('Job.Hire');
var Task = require('Task');
var UserException = require('UserException');

class JobMine extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobMine');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - mineral
    //   - id : string
    //   - pos : posData
    // - resourceType : RESOURCE_*
    // - idealPos : posData
    // - dropOff
    //   - id : string
    //   - pos : posData
    //   - type : structureType
    //   - isIdeal : bool
    // - creepNames : []
    // - openSpaces : number
    
    static create(mineral, dropOffStructure)
    {
        // make sure the main directory exists.
        if (Memory.JobMine == undefined)
            Memory.JobMine = {};
        
        // make sure mineral is a mineral
        if (!(mineral instanceof Mineral))
            throw new UserException('The mineral is not a mineral:\n- mineral: ' + JSON.stringify(mineral));
        
        // make sure dropOffStructure is a structure
        if (!(dropOffStructure instanceof Structure))
            throw new UserException('The drop off structure is not a structure:\n- structure: ' + JSON.stringify(dropOffStructure));
        
        // set the id by using the mineral id.
        let id = mineral.id;
        
        // make sure that the mine job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The miner for this mineral is already defined.');
        
        // set up local object
        Memory.JobMine[id] = {};
        
        // set mineral position, id, and resource type
        Memory.JobMine[id].mineral = {id: mineral.id, pos: mineral.pos.serialize()};
        Memory.JobMine[id].resourceType = mineral.mineralType;
        
        // get adjacent spaces
        let openSpaces = mineral.pos.adjacentSpaces(1, (pos) => (pos.isWalkable()));
        
        // find the space adjacent to the maximum number of spaces
        let idealSpace = _.max(
            openSpaces,
            (checkSpace) =>
            {
                let adjacents = 0;
                
                for (let otherSpace of openSpaces)
                {
                    if (checkSpace.squareDistanceTo(otherSpace) <= 1)
                    {
                        adjacents++;
                    }
                }
                
                return adjacents;
            }
        );
        
        // set the container position
        Memory.JobMine[id].idealPos = idealSpace.serialize();
        
        // set the number of open spaces, determining the max number of miners
        Memory.JobMine[id].openSpaces = openSpaces.length;
        
        // set drop off structure position and id
        Memory.JobMine[id].dropOff = {id: dropOffStructure.id, pos: dropOffStructure.pos.serialize(), type: dropOffStructure.structureType};
        
        Memory.JobMine[id].creepNames = [];
        
        // return the new object.
        return new JobMine(id);
    }
    
    static remove(id)
    {
        delete Memory.JobMine[id];
    }
    
    static isJob(id)
    {
        return (Memory.JobMine[id] !== undefined);
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
                // creep.say('I\'m a miner!');
                
                let result = creep.doTask();
                
                if (result !== taskResults.NOT_DONE)
                {
                    let task = null;
                    
                    if (creep.carry[this.getMineralType()] >= creep.carryCapacity/2)
                    {
                        let dropOffData = this.getDropOffData();
                        let sitePos = RoomPosition.deserialize(dropOffData.pos);
                        
                        // if the id is not specified, this is very bad
                        if (dropOffData.id === undefined)
                            throw new UserException('There is no dropOff id specified.');
                        
                        // get the dropOff by the specified id
                        let dropOff = Game.getObjectById(dropOffData.id);
                        
                        // if the dropOff could not be specified, go towards the position
                        
                        if (dropOff !== undefined && dropOff !== null)
                        {
                            // if the structure is visible
                            // try to transfer to it
                            task = new Task.transfer(dropOff, this.getMineralType());
                        }
                        else
                        {
                            // the item is not visible
                            
                            let room = Game.rooms[sitePos.roomName];
                            
                            if (room === undefined)
                            {
                                // give it a move task
                                task = new Task.moveToPos(sitePos, 2);
                            }
                            else
                            {
                                // it's in the same room and the item is not there, maybe it completed building it?
                                let structures = room.lookForAt(LOOK_STRUCTURES, sitePos);
                                let container = _.find(structures, (struct) => struct.structureType === STRUCTURE_CONTAINER);
                                
                                if (container)
                                    this.setDropOffStructure(container);
                                else
                                    throw new UserException('The structure for the id appears to be gone.');
                            }
                        }
                    }
                    else
                    {
                        let mineralData = this.getMineralData();
                        
                        let mineral = Game.getObjectById(mineralData.id);
                        
                        if (mineral !== undefined)
                        {
                            // if the mineral is visible
                            // try to mine it
                            task = new Task.harvest(mineral);
                        }
                        else
                        {
                            //else give it a move task
                            task = new Task.moveToPos(RoomPosition.deserialize(mineralData.pos), 2);
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
    
    // =============================================================================
    //  EMPLOYEE METHODS
    // =============================================================================
    
    maxCreeps()
    {
        return Memory.JobMine[this.id].openSpaces;
    }
    
    // =============================================================================
    //  SOURCE / HARVESTER METHODS
    // =============================================================================
    
    getMineralData()
    {
        return Memory.JobMine[this.id].mineral;
    }
    
    getMineralType()
    {
        return Memory.JobMine[this.id].resourceType;
    }
    
    // =============================================================================
    //  CONTAINER / DROPOFF METHODS
    // =============================================================================
    
    getIdealDropPosition()
    {
        return RoomPosition.deserialize(Memory.JobMine[this.id].idealPos);
    }
    
    getDropOffData()
    {
        return Memory.JobMine[this.id].dropOff;
    }
    
    setDropOffStructure(structure)
    {
        if (!(structure instanceof Structure))
            throw new UserException('The drop off structure is not a structure:\n- structure: ' + JSON.stringify(structure));
        
        Memory.JobMine[this.id].dropOff = {id: structure.id, pos: structure.pos.serialize(), type: structure.structureType};
    }
    
    isDropOffIdeal()
    {
        // set the ideal variable if it hasn't been calculated yet
        // (we don't want to have to repeatedly calculate it)
        if (Memory.JobMine[this.id].dropOff.isIdeal === undefined)
        {
            // get position data
            let idealPos = Memory.JobMine[this.id].idealPos;
            let dropOffPos = Memory.JobMine[this.id].dropOff.pos;
            
            // set isIdeal to if the container position is the same as the dropOff position
            Memory.JobMine[this.id].dropOff.isIdeal = (
                (idealPos == dropOffPos) &&
                (Memory.JobMine[this.id].dropOff.type === STRUCTURE_CONTAINER)
            );
        }
        
        // return whether the drop off point is at the ideal position
        return Memory.JobMine[this.id].dropOff.isIdeal;
    }
}

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobMine;