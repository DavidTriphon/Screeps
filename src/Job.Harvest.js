/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Harvest');
 * mod.thing == 'a thing'; // true
 */

var JobHire = require('Job.Hire');
var Task = require('Task');
var UserException = require('UserException');

class JobHarvest extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobHarvest');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - source
    //   - id : string
    //   - pos : posData
    // - container
    //   - pos : posData
    // - dropOff
    //   - id : string
    //   - pos : posData
    //   - type : structureType
    //   - isIdeal : bool
    //   - isBuilding : bool (undefined for false)
    // - creepNames : []
    // - openSpaces : number
    
    static create(source, dropOffStructure)
    {
        // make sure the main directory exists.
        if (Memory.JobHarvest == undefined)
            Memory.JobHarvest = {};
        
        // make sure source is a source
        if (!(source instanceof Source))
            throw new UserException('The source is not a source:\n- source: ' + JSON.stringify(source));
        
        // make sure dropOffStructure is a structure
        if (!(dropOffStructure instanceof Structure))
            throw new UserException('The drop off structure is not a structure:\n- structure: ' + JSON.stringify(dropOffStructure));
        
        // set the id by using the source id.
        let id = source.id;
        
        // make sure that the harvest job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The harvester for this source is already defined.');
        
        // set up local object
        Memory.JobHarvest[id] = {};
        
        // set source position and id
        Memory.JobHarvest[id].source = {id: source.id, pos: source.pos.serialize()};
        
        // get adjacent spaces
        let openSpaces = source.pos.adjacentSpaces(1, (pos) => (pos.isWalkable()));
        
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
        Memory.JobHarvest[id].idealPos = idealSpace.serialize();
        
        // set the number of open spaces, determining the max number of harvesters
        Memory.JobHarvest[id].openSpaces = openSpaces.length;
        
        // set drop off structure position and id
        Memory.JobHarvest[id].dropOff = {id: dropOffStructure.id, pos: dropOffStructure.pos.serialize(), type: dropOffStructure.structureType};
        
        Memory.JobHarvest[id].creepNames = [];
        
        // return the new object.
        return new JobHarvest(id);
    }
    
    static remove(id)
    {
        delete Memory.JobHarvest[id];
    }
    
    static isJob(id)
    {
        return (Memory.JobHarvest[id] !== undefined);
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
                // creep.say('I\'m a harvester!');
                
                let result = creep.doTask();
                
                if (result !== taskResults.NOT_DONE)
                {
                    let task = null;
                    
                    if (creep.carry[RESOURCE_ENERGY] >= creep.carryCapacity/2)
                    {
                        let dropOffData = this.getDropOffData();
                        let sitePos = RoomPosition.deserialize(dropOffData.pos);
                        
                        if (dropOffData.id === undefined)
                        {
                            // the only case in which the id is not specified is when the ideal container site has recently been created.
                            // search for it and assign it's id.
                            
                            let room = Game.rooms[sitePos.roomName];
                            
                            if (room !== undefined)
                            {
                                let sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, sitePos);
                                
                                if (sites.length === 0)
                                    throw new UserException('There is no dropOff id specified and there is not a construction site at the ideal location.');
                                
                                // get the site at that position
                                let site = sites[0];
                                // assign it's id
                                Memory.JobHarvest[this.id].dropOff.id = site.id;
                            }
                        }
                        
                        // get the dropOff if the id is specified
                        let dropOff;
                        
                        if (dropOffData.id !== undefined)
                            dropOff = Game.getObjectById(dropOffData.id);
                        
                        // if the dropOff could not be specified, go towards the position
                        
                        if (dropOff !== undefined && dropOff !== null)
                        {
                            // if the structure is visible
                            
                            if (dropOffData.isBuilding)
                            {
                                // is being constructed
                                
                                task = new Task.build(dropOff);
                            }
                            else
                            {
                                // is already built
                                
                                if (dropOff.hits < dropOff.hitsMax)
                                {
                                    // if the dump structure is damaged
                                    // try to repair it
                                    task = new Task.repair(dropOff);
                                }
                                else
                                {
                                    // try to transfer to it
                                    task = new Task.transfer(dropOff);
                                }
                            }
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
                        let sourceData = this.getSourceData();
                        
                        let source = Game.getObjectById(sourceData.id);
                        
                        if (source !== undefined)
                        {
                            // if the source is visible
                            // try to harvest it
                            task = new Task.harvest(source);
                        }
                        else
                        {
                            //else give it a move task
                            task = new Task.moveToPos(RoomPosition.deserialize(sourceData.pos), 2);
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
        return Memory.JobHarvest[this.id].openSpaces;
    }
    
    // =============================================================================
    //  SOURCE / HARVESTER METHODS
    // =============================================================================
    
    getSourceData()
    {
        return Memory.JobHarvest[this.id].source;
    }
    
    // =============================================================================
    //  CONTAINER / DROPOFF METHODS
    // =============================================================================
    
    getIdealDropPosition()
    {
        return RoomPosition.deserialize(Memory.JobHarvest[this.id].idealPos);
    }
    
    getDropOffData()
    {
        return Memory.JobHarvest[this.id].dropOff;
    }
    
    setDropOffStructure(structure)
    {
        if (!(structure instanceof Structure))
            throw new UserException('The drop off structure is not a structure:\n- structure: ' + JSON.stringify(structure));
        
        Memory.JobHarvest[this.id].dropOff = {id: structure.id, pos: structure.pos.serialize(), type: structure.structureType};
    }
    
    isDropOffIdeal()
    {
        // set the ideal variable if it hasn't been calculated yet
        // (we don't want to have to repeatedly calculate it)
        if (Memory.JobHarvest[this.id].dropOff.isIdeal === undefined)
        {
            // get position data
            let idealPos = Memory.JobHarvest[this.id].idealPos;
            let dropOffPos = Memory.JobHarvest[this.id].dropOff.pos;
            
            // set isIdeal to if the container position is the same as the dropOff position
            Memory.JobHarvest[this.id].dropOff.isIdeal = (
                (idealPos == dropOffPos) &&
                (Memory.JobHarvest[this.id].dropOff.type === STRUCTURE_CONTAINER)
            );
        }
        
        // return whether the drop off point is at the ideal position
        return Memory.JobHarvest[this.id].dropOff.isIdeal;
    }
    
    setIdealDropOff()
    {
        // get the ideal container position and room
        let idealPos = RoomPosition.deserialize(Memory.JobHarvest[this.id].idealPos);
        let room = Game.rooms[idealPos.roomName];
        
        // make sure the room is visible before proceeding.
        if (room === undefined)
            throw new UserException('The ideal container cannot be created because the room is not visible.');
        
        // get the result from creating the construction site.
        let result = room.createConstructionSite(idealPos, STRUCTURE_CONTAINER);
        
        // based on which error was recieved or if it succeeded, set the dropOffContainer and build flags
        switch(result)
        {
            case ERR_INVALID_TARGET:
                if (idealPos.isWalkable())
                {
                    // there is another construction site or building here that is blocking the way.
                    // hopefully it's not a building and just a path or an already placed container.
                    
                    // try to find any construction sites at that position
                    let sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, idealPos);
                    
                    if (sites.length > 0)
                    {
                        // there is a site in the way here
                        
                        // check if the site is a container or a road
                        let site = sites[0];
                        
                        if (site.structureType === STRUCTURE_ROAD || site.structureType === STRUCTURE_CONTAINER)
                        {
                            // a road is fine, just keep working on that, and then build the container
                            Memory.JobHarvest[this.id].dropOff = {id: site.id, pos: site.pos.serialize(), type: site.structureType, isBuilding: true};
                        }
                        else
                        {
                            // it isn't fine to build anything else here. There must have been a really bad screw up.
                            throw new UserException('There is an obstructing building being built at the ideal position');
                        }
                    }
                    else
                    {
                        // there is not a site, there is a building here in the way.
                        
                        // check if the building is a container, we might be done!
                        let structures = room.lookForAt(LOOK_STRUCTURES, idealPos);
                        
                        let container = _.find(structures, (struct) => (struct.structureType === STRUCTURE_CONTAINER));
                        
                        // check the structures for a structure that is a container
                        if (container !== undefined)
                        {
                            // there is a container here! we've already built it (or someone else did ;) )
                            Memory.JobHarvest[this.id].dropOff = {id: container.id, pos: Memory.JobHarvest[this.id].idealPos, type: STRUCTURE_CONTAINER};
                        }
                        else
                        {
                            // there is not a container here, and a structure blocks it being built
                            throw new UserException('There is a building in the way of the ideal container position.')
                        }
                    }
                }
                else
                {
                    // the ideal position for a container is corrupt, because there is a solid unbreakable wall here.
                    throw new UserException('The ideal position for the container is corrupt. There is a solid wall here.');
                }
                break;
            case ERR_FULL:
                // there are too many construction sites right now.
                throw new UserException('There are too many construction sites to be able to place a new one.');
                break;
            case ERR_INVALID_ARGS:
                // the location is not a location, I don't think this should happen.
                throw new UserException('Somehow the ideal position is not a position object.');
                break;
            case ERR_RCL_NOT_ENOUGH:
                // there are too many containers in this room already. How did this happen?
                throw new UserException('There are too many containers in this room for the current RCL.');
                break;
            case OK:
                // set the drop off point without the id specified, we can check that next tick.
                Memory.JobHarvest[this.id].dropOff = {pos: Memory.JobHarvest[this.id].idealPos, type: STRUCTURE_CONTAINER, isBuilding: true};
                break;
        }
    }
}

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobHarvest;