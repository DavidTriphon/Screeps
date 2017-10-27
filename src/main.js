

// constants

global.MY_USERNAME = 'DavidTriphon';

global.IS_FRIENDLY =
{
    Dfett: true,
    EngineerYo: true,
    Cz4r: true,
    DirtyLittleCodeMonkey: true,
    Layl: true,
    c01: true
};

// prototype modules

require('API.Creep');
require('API.RoomVisual');

UserException = require('UserException');
Task = require('Task');

JobScout = require('Job.Scout');
JobReserve = require('Job.Reserve');
JobDefend = require('Job.Defend');
JobMine = require('Job.Mine');
JobHarvest = require('Job.Harvest');
JobUpgrade = require('Job.Upgrade');
JobHaul = require('Job.Haul');
JobBuild = require('Job.Build');
JobFillSpawn = require('Job.FillSpawn');

// startup function

global.startup = function()
{
    console.log('resetting all memory structures...');
    
    // clear memory
    Memory = {};
    
    let spawn = Game.spawns['Spawn1'];
    
    let sources = spawn.room.find(FIND_SOURCES);
    
    for (let source of sources)
    {
        JobHarvest.create(source, spawn);
    }
    
    JobUpgrade.create(spawn.room.controller, spawn);
    
    Memory.JobBuild = {};
    Memory.JobDefend = {};
    Memory.JobHaul = {};
    Memory.JobMine = {};
    Memory.JobReserve = {};
    Memory.JobScout = {};
    
    console.log('finished resetting all memory structures.');
}

// main loop

module.exports.loop = function()
{
    // if no harvest jobs are defined, define the new harvest jobs and upgrade job
    if (Memory.JobHarvest === undefined)
        startup();
    
    // get spawn by default spawn name
    let spawn = Game.spawns['Spawn1'];
    
    // look for hostile creeps in range of spawn in order to activate safe mode.
    
    let hostileCreeps = _.filter(spawn.room.find(FIND_HOSTILE_CREEPS), (creep) => (!IS_FRIENDLY[creep.owner.username]));
    let nearbyCreeps = _.filter(hostileCreeps, (creep) => (creep.pos.squareDistanceTo(spawn.pos) <= 3))
    
    if (nearbyCreeps.length > 0)
    {
        Game.notify('Safe mode has been activated because ' + hostileCreeps[0].owner.username + ' got too close to your spawn.');
        spawn.room.controller.activateSafeMode();
    }
    
    // delete dead creeps memory
    
    for (let creepName in Memory.creeps)
    {
        if (Game.creeps[creepName] === undefined)
        {
            console.log('Deleting creep \"' + creepName + '\" from memory.');
            delete Memory.creeps[creepName];
        }
    }
    
    // Show room visuals test
    
    /*
    for (let siteID in Game.constructionSites)
    {
        let site = Game.constructionSites[siteID];
        
        switch(site.structureType)
        {
            case STRUCTURE_SPAWN:
                site.room.visual.spawn(site.pos);
                break;
            case STRUCTURE_STORAGE:
                site.room.visual.storage(site.pos);
                break;
            case STRUCTURE_CONTAINER:
                site.room.visual.container(site.pos);
                break;
            case STRUCTURE_TOWER:
                site.room.visual.tower(site.pos);
                break;
        }
    }*/
    
    // tower control
    
    let roomStructures = spawn.room.find(FIND_STRUCTURES);
    let towers = _.filter(roomStructures, (structure) => (structure.structureType === STRUCTURE_TOWER));
    
    for (let tower of towers)
    {
        if (hostileCreeps.length > 0)
        {
            // find the nearest hostile creep and attack it.
            tower.attack(tower.pos.findClosestByRange(hostileCreeps));
        }
        else
        {
            let weakStructures = _.filter(roomStructures, (structure) => (structure.hits < 100000 && structure.hits < structure.hitsMax))
            
            if (weakStructures.length > 0)
            {
                tower.repair(tower.pos.findClosestByRange(weakStructures));
            }
        }
    }
    
    // link control
    
    let links = _.filter(roomStructures, (structure) => (structure.structureType === STRUCTURE_LINK));
    
    let mainLink = Game.getObjectById('589dd761ab78740044208feb');
    
    for (let link of links)
    {
        if (link.id !== '589dd761ab78740044208feb')
        {
            if ((link.energy / link.energyCapacity) > 0.5);
            {
                link.transferEnergy(mainLink);
            }
        }
    }
    
    // job control
    
    if (Memory.JobBuild === undefined)
        Memory.JobBuild = {};
    
    if (Object.keys(Memory.JobBuild).length === 0)
    {
        let constructionSites = spawn.room.find(FIND_CONSTRUCTION_SITES);
        
        if (constructionSites.length !== 0)
        {
            let newSite = spawn.room.storage.pos.findClosestByRange(constructionSites);
            
            job = JobBuild.create(newSite, spawn.room.storage);
        }
    }
    
    for (let id in Memory.JobBuild)
    {
        let job = new JobBuild(id);
        
        try
        {
            if (job.isDone())
            {
                let creeps = job.getCreeps();
                
                JobBuild.remove(id);
                
                // find the closest site to the spawn
                let newSite = spawn.room.storage.pos.findClosestByRange(spawn.room.find(FIND_CONSTRUCTION_SITES));
                
                
                if (newSite !== undefined)
                {
                    // set the new job
                    job = JobBuild.create(newSite, spawn.room.storage);
                    
                    // rehire the creeps from the last job
                    for (let creep of creeps)
                    {
                        job.hire(creep.name);
                    }
                }
                else
                {
                    // tell the creeps to suicide at the grave container?
                }
            }
        }
        catch (e)
        {
            console.log('There was a mishap while trying to reset a new construction job:\n' + e.stack)
        }
    }
    
    // Job execution
    
    for (let id in Memory.JobHarvest)
    {
        new JobHarvest(id).execute();
    }
    
    for (let id in Memory.JobHaul)
    {
        new JobHaul(id).execute();
    }
    
    for (let id in Memory.JobUpgrade)
    {
        new JobUpgrade(id).execute();
    }
    
    for (let id in Memory.JobBuild)
    {
        new JobBuild(id).execute();
    }
    
    for (let id in Memory.JobFillSpawn)
    {
        new JobFillSpawn(id).execute();
    }
    
    for (let id in Memory.JobMine)
    {
        new JobMine(id).execute();
    }
    
    for (let id in Memory.JobDefend)
    {
        new JobDefend(id).execute();
    }
    
    for (let id in Memory.JobReserve)
    {
        new JobReserve(id).execute();
    }
    
    for (let id in Memory.JobScout)
    {
        new JobScout(id).execute();
    }
    
    // spawn control (very much hacked together)
    
    let spawning = false;
    
    // spawn fillers
    
    if (!spawning)
    {
        let job = new JobFillSpawn('E68S4');
        
        let creeps = job.getCreeps()
        
        if (creeps.length < 2)
        {
            let body = (creeps.length === 0 ? [CARRY, MOVE] : [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE]);
            
            let name = spawn.createCreep(body);
            
            // prevent anything else from spawning
            spawning = true;
            
            if (!(name < 0))
            {
                console.log('spawning ' + name + ' to fill extensions');
                job.hire(name);
            }
        }
    }
    
    // link mover
    
    if (!spawning)
    {
        let job = new JobHaul('589dd761ab78740044208feb589d77f854fd9fb92ae9ef93');
        
        let creeps = job.getCreeps();
        
        if (creeps.length < 1)
        {
            let name = spawn.createCreep([CARRY, MOVE]);
            
            // prevent anything else from spawning
            spawning = true;
            
            if (!(name < 0))
            {
                console.log('spawning ' + name + ' to haul from link');
                job.hire(name);
            }
        }
    }
    
    // harvesters
    
    for (let id in Memory.JobHarvest)
    {
        if (!spawning)
        {
            // get harvest job and creeps
            let harvestJob = new JobHarvest(id);
            let harvestCreeps = harvestJob.getCreeps();
            
            let workParts = _.sum(harvestCreeps, (creep) => (_.countBy(creep.body, (part) => (part.type))[WORK]));
            // console.log('workParts: ' + workParts);
            
            if (workParts < 6)
            {
                let name = spawn.createCreep([WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE]);
                
                // prevent anything else from spawning
                spawning = true;
                
                if (!(name < 0))
                {
                    console.log('spawning ' + name + ' to harvest');
                    harvestJob.hire(name);
                }
            }
        }
    }
    
    // remote harvest hauler
    
    if (!spawning)
    {
        let job = new JobHaul('58abb6a15ace7d31c90b9bb9589d77f854fd9fb92ae9ef93');
        
        if (job.getCreeps().length === 0)
        {
            let name = spawn.createCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]);
            
            // prevent anything else from spawning
            spawning = true;
            
            if (!(name < 0))
            {
                console.log('spawning ' + name + ' to haul to from remote harvest');
                job.hire(name);
            }
        }
    }
    
    // west tower
    
    if (!spawning)
    {
        let job = new JobHaul('5897caf755a4abc81f0dbe3c589d2aef1da6a7420c875df9');
        
        if (job.getCreeps().length === 0)
        {
            let name = spawn.createCreep([CARRY, CARRY, MOVE, MOVE]);
            
            // prevent anything else from spawning
            spawning = true;
            
            if (!(name < 0))
            {
                console.log('spawning ' + name + ' to haul to west tower');
                job.hire(name);
            }
        }
    }
    
    // east tower
    
    if (!spawning)
    {
        let job = new JobHaul('589d77f854fd9fb92ae9ef93589ebc49fe3995e23c6dc83d');
        
        if (job.getCreeps().length === 0)
        {
            let name = spawn.createCreep([CARRY, CARRY, MOVE, MOVE]);
            
            // prevent anything else from spawning
            spawning = true;
            
            if (!(name < 0))
            {
                console.log('spawning ' + name + ' to haul to east tower');
                job.hire(name);
            }
        }
    }
    
    // keanium trade hauler
    
    if (!spawning)
    {
        let job = new JobHaul('589d77f854fd9fb92ae9ef9358a69697a707156f3ccbf7bb');
        
        if (job.getCreeps().length === 0)
        {
            let name = spawn.createCreep([CARRY, CARRY, CARRY, MOVE]);
            
            // prevent anything else from spawning
            spawning = true;
            
            if (!(name < 0))
            {
                console.log('spawning ' + name + ' to haul keanium to trader');
                job.hire(name);
            }
        }
    }
    
    // upgrader hauler
    
    if (!spawning)
    {
        let job = new JobHaul('589d77f854fd9fb92ae9ef93589ec3759c4e3b5b2d089af5');
        
        if (job.getCreeps().length === 0)
        {
            let name = spawn.createCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]);
            
            // prevent anything else from spawning
            spawning = true;
            
            if (!(name < 0))
            {
                console.log('spawning ' + name + ' to haul to upgrader bucket');
                job.hire(name);
            }
        }
    }
    
    // upgraders
    
    for (let id in Memory.JobUpgrade)
    {
        if (!spawning)
        {
            let job = new JobUpgrade(id);
            
            if (spawn.energy === spawn.energyCapacity && job.getCreeps().length < 4)
            {
                let name = spawn.createCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE]);
                
                // prevent anything else from spawning
                spawning = true;
                
                if (!(name < 0))
                {
                    console.log('spawning ' + name + ' to upgrade');
                    job.hire(name);
                }
            }
        }
    }
    
    // miner
    
    let keanium = Game.getObjectById('57efa11d08bd77920836f2e6');
    
    if (!(keanium.ticksToRegeneration > 0))
    {
        if (!spawning)
        {
            let job = new JobMine('57efa11d08bd77920836f2e6');
            
            if (job.getCreeps().length === 0)
            {
                let name = spawn.createCreep([WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE]);
                
                // prevent anything else from spawning
                spawning = true;
                
                if (!(name < 0))
                {
                    console.log('spawning ' + name + ' to mine the keanium resource');
                    job.hire(name);
                }
            }
        }
        
        // miner hauler
        
        if (!spawning)
        {
            let job = new JobHaul('589ede11263f6453f197b81d589d77f854fd9fb92ae9ef93');
            
            if (job.getCreeps().length === 0)
            {
                let name = spawn.createCreep([CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]);
                
                // prevent anything else from spawning
                spawning = true;
                
                if (!(name < 0))
                {
                    console.log('spawning ' + name + ' to haul from miner bucket');
                    job.hire(name);
                }
            }
        }
    }
    
    for (let id in Memory.JobReserve)
    {
        if (!spawning)
        {
            let job = new JobReserve(id);
            
            if ((job.getCreeps().length === 0) &&
                (job.getExpireTime() - Game.time < 4000))
            {
                let name = spawn.createCreep([CLAIM, CLAIM, CLAIM, MOVE, MOVE, MOVE]);
                
                // prevent anything else from spawning
                spawning = true;
                
                if (!(name < 0))
                {
                    console.log('spawning ' + name + ' to reserve');
                    job.hire(name);
                }
            }
        }
    }
    
    // builders
    
    for (let id in Memory.JobBuild)
    {
        if (!spawning)
        {
            let job = new JobBuild(id);
            
            if (job.getCreeps().length < Math.floor(spawn.room.storage.store[RESOURCE_ENERGY] / (2 * 5 /*parts*/ * CREEP_LIFE_TIME * BUILD_POWER)))
            {
                let name = spawn.createCreep([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE]);
                
                // prevent anything else from spawning
                spawning = true;
                
                if (!(name < 0))
                {
                    console.log('spawning ' + name + ' to build');
                    job.hire(name);
                }
            }
        }
    }
}