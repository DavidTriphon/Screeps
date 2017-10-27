/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Hire');
 * mod.thing == 'a thing'; // true
 */

require('API.RoomPosition');

class JobHire
{
    // =============================================================================
    //  CONSTRUCTOR
    // =============================================================================
    
    constructor(id, jobType)
    {
        if (Memory[jobType] === undefined)
            Memory[jobType] = {};
        
        if (Memory[jobType][id] === undefined)
            throw new UserException('No ' + jobType + ' exists with the id: ' + id);
        
        this.id = id;
        this.jobType = jobType;
    }
    
    // =============================================================================
    //  EMPLOYEE METHODS
    // =============================================================================
    
    getCreeps()
    {
        if (this.creeps === undefined)
        {
            // make an array of creeps
            let creeps = [];
            
            // iterate over all the creep names
            for (let index in Memory[this.jobType][this.id].creepNames)
            {
                // get the name
                let name = Memory[this.jobType][this.id].creepNames[index];
                
                // get the creep by name
                let creep = Game.creeps[name];
                
                // if the creep is gone
                if (creep === undefined)
                {
                    // fire it from the list
                    Memory[this.jobType][this.id].creepNames.splice(index, 1);
                }
                else
                {
                    // otherwise, add it to the creep array
                    creeps.push(creep);
                }
            }
            
            this.creeps = creeps;
        }
        
        // return the array of creeps.
        return this.creeps;
    }
    
    hire(creepArg)
    {
        let creepName;
        let creep;
        
        if (creepArg instanceof Creep)
        {
            creep = creepArg;
            creepName = creepArg.name;
        }
        else if (typeof creepArg === 'string')
        {
            creep = Game.creeps[creepArg];
            creepName = creepArg;
            
            if (creep === undefined)
                throw new UserException('There is no creep with the name "' + creepName + '".');
        }
        else
        {
            throw new UserException('The creep arg supplied for fire() was neither a creep or a creep name.');
        }
        
        // check to make sure it isn't already on the employee roster
        if (this.isHired(creepName))
            throw new UserException('The creep "' + creepName + '" is already hired');
        
        // erase whatever old task it had.
        creep.memory.task = undefined;
        
        // push the name onto the list
        Memory[this.jobType][this.id].creepNames.push(creepName);
        
        // if the creep array is already defined, put it on the array.
        if (this.creeps !== undefined)
        {
            this.creeps.push(creep);
        }
    }
    
    fire(creep)
    {
        let creepName;
        
        if (creep instanceof Creep)
        {
            creepName = creep.name;
        }
        else if (typeof creep === 'string')
        {
            creepName = creep;
        }
        else
        {
            throw new UserException('The creep arg supplied for fire() was neither a creep nor a string.');
        }
        
        // make sure that it is already hired before trying to fire it.
        let index = Memory[this.jobType][this.id].creepNames.indexOf(creepName)
        
        // if the index isn't -1, it is in the array.
        if (index > -1)
        {
            // splice out that one position from the array.
            Memory[this.jobType][this.id].creepNames.splice(index, 1);
            
            // if the creep array is already defined, remove it from the array.
            if (this.creeps !== undefined)
            {
                this.creeps.splice(this.creeps.indexOf(creep), 1);
            }
        }
        
        
    }
    
    isHired(creep)
    {
        let creepName;
        
        if (creep instanceof Creep)
        {
            creepName = creep.name;
        }
        else if (typeof creep === 'string')
        {
            creepName = creep;
        }
        else
        {
            throw new UserException('The creep arg supplied for isHired() was neither a creep nor a string.');
        }
        
        return Memory[this.jobType][this.id].creepNames.includes(creepName);
    }
    
    // =============================================================================
    //  PART COUNT METHODS
    // =============================================================================
    
    
    
    // =============================================================================
    //  OBJECT METHODS
    // =============================================================================
    
    toString()
    {
        return '[' + this.jobType + ' : ' + this.id + ']';
    }
}

module.exports = JobHire;