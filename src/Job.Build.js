/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Build');
 * mod.thing == 'a thing'; // true
 */

require('Job.Hire');
require('Task');
require('UserException');
require('API.RoomPosition');

class JobBuild extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobBuild');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - pickUp
    //   - id : string
    //   - pos : posData
    // - site
    //   - id : string
    //   - pos : posData
    //   - type : STRUCTURE_*
    // - isDone : boolean
    // - creepNames : []
    
    static create(site, pickUpStructure)
    {
        // make sure the main directory exists.
        if (Memory.JobBuild == undefined)
            Memory.JobBuild = {};
        
        // make sure site is a site
        if (!(site instanceof ConstructionSite))
            throw new UserException('The site is not a construction site:\n- site: ' + JSON.stringify(site));
        
        // make sure dropOffStructure is a structure
        if (!(pickUpStructure instanceof Structure))
            throw new UserException('The pick up structure is not a structure:\n- structure: ' + JSON.stringify(pickUpStructure));
        
        // set the id by using the site id.
        let id = site.id;
        
        // make sure that the build job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The builder for this site is already defined.');
        
        // set up local object
        Memory.JobBuild[id] = {};
        
        // set site position and id
        Memory.JobBuild[id].site = {id: site.id, pos: site.pos.serialize(), type: site.structureType};
        
        // set pick up structure position and id
        Memory.JobBuild[id].pickUp = {id: pickUpStructure.id, pos: pickUpStructure.pos.serialize()};
        
        // set default build completeness to false
        Memory.JobBuild[id].isDone = false;
        
        // set up creep employee array
        Memory.JobBuild[id].creepNames = [];
        
        // return the new object.
        return new JobBuild(id);
    }
    
    static remove(id)
    {
        delete Memory.JobBuild[id];
    }
    
    static isJob(id)
    {
        return (Memory.JobBuild[id] !== undefined);
    }
    
    // =============================================================================
    //  EXECUTE METHOD
    // =============================================================================
    
    execute()
    {
        for (let creep of this.getCreeps())
        {
            if (!this.isDone())
            {
                try
                {
                    // creep.say('I\'m a builder!');
                    
                    let result = creep.doTask();
                    
                    if (result !== taskResults.NOT_DONE)
                    {
                        // get the work task or refill task based on whether it's over or under half full
                        let task = ((creep.carry[RESOURCE_ENERGY] >= creep.carryCapacity/2) ?
                            (this.getWorkTask()) :
                            (this.getRefillTask()));
                        
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
    }
    
    getWorkTask()
    {
        if (this.workTask === undefined)
        {
            let siteData = this.getSiteData();
            let sitePos = RoomPosition.deserialize(siteData.pos); // to know where to look for the site or go when it's not visible
            let siteRoom = Game.rooms[sitePos.roomName]; // to know whether the site should be visible or not
            let site = Game.getObjectById(siteData.id); // the actual site instance
            
            let task = null;
            
            if (site === undefined || site === null)
            {
                // the site is not visible
                
                if (siteRoom === undefined)
                {
                    // the room is not visible
                    
                    // just go to the room of the site by heading to the site
                    task = new Task.moveToPos(sitePos, 3);
                }
                else
                {
                    // the room is visible
                    
                    // the site might be done, check to see if the structure is done
                    
                    let structures = siteRoom.lookForAt(LOOK_STRUCTURES, sitePos);
                    let completedSite = _.find(structures, (structure) => (structure.structureType === siteData.type));
                    
                    if (completedSite !== undefined)
                    {
                        // we're done here.
                        
                        Memory.JobBuild[this.id].isDone = true;
                    }
                    else
                    {
                        // has the site gotten reset?
                        
                        let sites = siteRoom.lookForAt(LOOK_CONSTRUCTION_SITES, sitePos);
                        let newSite = _.find(sites, (siteI) => (siteI.structureType === siteData.type));
                        
                        if (newSite !== undefined)
                        {
                            // reset the id so it's identifiable in future ticks
                            Memory.JobBuild[this.id].site.id = newSite.id;
                            
                            // get the build task for this newly identified
                            task = new Task.build(newSite);
                        }
                        else
                        {
                            // the site must have gotten destroyed! (this might mean there's a pile of resources there now....)
                            // let's rebuild it.
                            
                            siteRoom.createConstructionSite(sitePos, siteData.type);
                            
                            // we'll wait a tick to set the site, since we can't get the id yet
                        }
                    }
                }
            }
            else
            {
                // the site is visible
                
                task = new Task.build(site);
            }
            
            this.workTask = task;
        }
        
        return this.workTask;
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
                    
                    throw new UserException('The structure to pick up from for JobBuild[' + this.id + '] is no longer visible!');
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
    //  SITE / COMPLETENESS METHODS
    // =============================================================================
    
    getSiteData()
    {
        return Memory.JobBuild[this.id].site;
    }
    
    isDone()
    {
        return Memory.JobBuild[this.id].isDone;
    }
    
    // =============================================================================
    //  PICKUP METHODS
    // =============================================================================
    
    getPickUpData()
    {
        return Memory.JobBuild[this.id].pickUp;
    }
    
    setPickUpStructure(structure)
    {
        if (!(structure instanceof Structure))
            throw new UserException('The pick up structure is not a structure:\n- structure: ' + JSON.stringify(structure));
        
        Memory.JobBuild[this.id].pickUp = {id: structure.id, pos: structure.pos.serialize()};
    }
}

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobBuild;