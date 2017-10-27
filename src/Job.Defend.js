/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Defend');
 * mod.thing == 'a thing'; // true
 */

JobHire = require('Job.Hire');
Task = require('Task');
require('UserException');
require('API.RoomPosition');

class JobDefend extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobDefend');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - site : posData
    // - range : number
    // - creepNames : []
    
    static create(site, range)
    {
        // make sure the main directory exists.
        if (Memory.JobDefend == undefined)
            Memory.JobDefend = {};
        
        // make sure source is a source
        if (!(site instanceof RoomPosition))
            throw new UserException('The site is not a room position:\n- site: ' + JSON.stringify(site));
        
        // make sure the range is a number above 0.
        if (typeof range !== 'number')
            throw new UserException('The range is not a number:\n- range: ' + JSON.stringify(range));
        else if (range <= 0)
            throw new UserException('The range cannot be 0 or less:\n- range: ' + range);
        
        // set the id by using the site serialization.
        let id = site.serialize();
        
        // make sure that the build job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The defender for this site is already defined.');
        
        // set up local object
        Memory.JobDefend[id] = {};
        
        // set site position
        Memory.JobDefend[id].site = site.serialize();
        
        // set the range for attacking enemies.
        Memory.JobDefend[id].range = range;
        
        // set up creep employee array
        Memory.JobDefend[id].creepNames = [];
        
        // return the new object.
        return new JobDefend(id);
    }
    
    static remove(id)
    {
        delete Memory.JobDefend[id];
    }
    
    static isJob(id)
    {
        return (Memory.JobDefend[id] !== undefined);
    }
    
    // =============================================================================
    //  EXECUTE METHOD
    // =============================================================================
    
    execute()
    {
        let sitePos = this.getSite();
        let room = Game.rooms[sitePos.roomName];
        
        let hostiles = [];
        
        if (room !== undefined)
        {
            let roomCreeps = room.find(FIND_HOSTILE_CREEPS);
            let hostileCreeps = _.filter(roomCreeps, (creep) => (IS_FRIENDLY[creep.owner.username]));
            hostiles = _.filter(hostileCreeps, (creep) => (creep.pos.squareDistanceTo(sitePos) <= this.getRange()));
        }
        
        for (let creep of this.getCreeps())
        {
            try
            {
                // creep.say('I\'m a defender!');
                
                if (hostiles.length > 0)
                {
                    let taskType = creep.getTaskType();
                    
                    if (taskType !== 'attack')
                    {
                        let closestHostile = creep.pos.findClosestByRange(hostiles);
                        
                        creep.setTask(new Task.attack(closestHostile));
                    }
                }
                
                let result = creep.doTask();
                
                if (result !== taskResults.NOT_DONE)
                {
                    if (hostiles.length > 0)
                    {
                        let closestHostile = creep.pos.findClosestByRange(hostiles);
                        
                        creep.setTask(new Task.attack(closestHostile));
                    }
                    else
                    {
                        creep.setTask(new Task.moveToPos(this.getSite(), 0));
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
    //  SITE / RANGE METHODS
    // =============================================================================
    
    getSite()
    {
        if (this.site === undefined)
            this.site = RoomPosition.deserialize(Memory.JobDefend[this.id].site);
        
        return this.site;
    }
    
    getRange()
    {
        if (this.range === undefined)
            this.range = Memory.JobDefend[this.id].range;
        
        return this.range;
    }
    
    setRange(range)
    {
        // set memory range
        Memory.JobDefend[this.id].range = range;
        
        // set instance range variable
        this.range = range;
    }
}

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobDefend;