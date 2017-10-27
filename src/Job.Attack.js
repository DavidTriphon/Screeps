/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Attack');
 * mod.thing == 'a thing'; // true
 */

var JobHire = require('Job.Hire');
var Task = require('Task');
var UserException = require('UserException');

class JobAttack extends JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id)
    {
        super(id, 'JobAttack');
    }
    
    // =============================================================================
    //  MEMORY METHODS
    // =============================================================================
    
    // variables saved to memory include:
    // - target
    //   - pos : posData
    //   - id : string
    // - creepNames : []
    
    static create(target)
    {
        // make sure the main directory exists.
        if (Memory.JobAttack == undefined)
            Memory.JobAttack = {};
        
        // make sure target is a room object
        if (!(target instanceof RoomObject))
            throw new UserException('The target is not a room object:\n- target: ' + JSON.stringify(target));
        
        // set the id by using the target id.
        let id = target.id;
        
        // make sure that the attack job doesn't already exist so you don't overwrite it
        if (this.isJob(id))
            throw new UserException('The attacker job for this target is already defined.');
        
        // set up local object
        Memory.JobAttack[id] = {};
        
        // set target position and id
        Memory.JobAttack[id].target = {id: target.id, pos: target.pos.serialize()};
        
        // set up creep employee array
        Memory.JobAttack[id].creepNames = [];
        
        // return the new object.
        return new JobAttack(id);
    }
    
    static remove(id)
    {
        delete Memory.JobAttack[id];
    }
    
    static isJobFor(id)
    {
        return (Memory.JobAttack[id] !== undefined);
    }
    
    // =============================================================================
    //  EXECUTE METHOD
    // =============================================================================
    
    execute()
    {
        let targetData = Memory.JobAttack[this.id].target;
        let targetPos = RoomPosition.deserialize(targetData.pos);
        let targetRoom = Game.rooms[targetPos.roomName];
        let currentTask = null;
        
        // determine what the current assigned task should be.
        
        // check if the room is visible
        if (targetRoom === undefined)
        {
            // the room is not visible
            
            // tell the attacks to go to the position
            let currentTask = new Task.moveToPos(targetPos, 10);
        }
        else
        {
            // the room is visible, the target should be visible
            
            let target = Game.getObjectById(targetData.id);
            
            let currentTask = new Task.attack(target);
        }
        
        for (let creep of this.getCreeps())
        {
            try
            {
                // creep.say('I\'m a attacker!');
                
                let result = creep.doTask();
                
                if (result !== taskResults.NOT_DONE)
                {
                    // set the task and do it once this tick
                    creep.setTask(currentTask);
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

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobAttack;