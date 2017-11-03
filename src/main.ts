// =============================================================================
//   IMPORTS
// =============================================================================

// constants

// job types

import {JobHire} from "./classes/job/JobHire";
import * as Job from "./classes/job/Module";

// prototypes

import * as Bootstrapper from "./prototypes/Bootstrapper";

// =============================================================================
//   PROTOTYPE INIT
// =============================================================================

Bootstrapper.extendPrototypes();

// =============================================================================
//   GLOBAL DECLARATION AND CONSTANTS
// =============================================================================

declare global
{
  const global: {
    [k: string]: any;
  };
}

global.MY_USERNAME = "DavidTriphon";

const IS_FRIENDLY: {[name: string]: boolean} = {
  Dfett: true,
  EngineerYo: true,
  Cz4r: true,
  DirtyLittleCodeMonkey: true,
  Layl: true,
  c01: true
};

global.IS_FRIENDLY = IS_FRIENDLY;

// =============================================================================
//   PRIVATE METHODS
// =============================================================================

function startup()
{
  console.log("resetting all memory structures...");

  // clear memory
  for (const key in Memory)
  {
    Memory[key] = {};
  }

  for (const jobType in Job)
  {
    Memory.Job[jobType] = {};
  }

  // create a harvesting job and an upgrading job for every room we have a spawn in.

  // TODO: fix this edge case
  // this will throw errors if we multiple spawns in a single room because
  // it will iterate over the room twice.
  for (const spawnName in Game.spawns)
  {
    const spawn = Game.spawns[spawnName];
    const sources = spawn.room.find<Source>(FIND_SOURCES);

    for (const source of sources)
    {
      Job.Harvest.create(source, spawn);
    }

    Job.Upgrade.create(spawn.room.controller as Controller, spawn);
  }

  console.log("finished resetting all memory structures.");
}

function showBuildings()
{
  for (const siteID in Game.constructionSites)
  {
    const site = Game.constructionSites[siteID];

    switch (site.structureType)
    {
      case STRUCTURE_SPAWN:
        (site.room as Room).visual.spawn(site.pos);
        break;
      case STRUCTURE_STORAGE:
        (site.room as Room).visual.storage(site.pos);
        break;
      case STRUCTURE_CONTAINER:
        (site.room as Room).visual.container(site.pos);
        break;
      case STRUCTURE_TOWER:
        (site.room as Room).visual.tower(site.pos);
        break;
    }
  }
}

// =============================================================================
//   MAIN LOOP
// =============================================================================

export const loop = function main(): void
{
  // if no harvest jobs are defined, define the new harvest jobs and upgrade job
  if (Memory.Job === undefined)
  {
    startup();
  }

  // get spawn by using first spawn name
  const spawnNames = Object.keys(Game.spawns);
  const spawn: Spawn = Game.spawns[spawnNames[0]];
  const room: Room = spawn.room;

  // == scan for hostiles ==

  // look for hostile creeps in range of spawn in order to activate safe mode.

  const hostileCreeps: Creep[] = _.filter(room.find(FIND_HOSTILE_CREEPS),
    (creep) => (!IS_FRIENDLY[creep.owner.username]));
  const nearbyCreeps: Creep[] = _.filter(hostileCreeps,
    (creep) => (creep.pos.squareDistanceTo(spawn.pos) <= 3));

  if (nearbyCreeps.length > 0)
  {
    Game.notify("Safe mode has been activated because " + nearbyCreeps[0].owner.username +
      " got too close to your spawn.");
    (room.controller as Controller).activateSafeMode();
  }

  // == delete dead creeps memory ==

  for (const creepName in Memory.creeps)
  {
    if (Game.creeps[creepName] === undefined)
    {
      console.log("Deleting creep \"" + creepName + "\" from memory.");
      delete Memory.creeps[creepName];
    }
  }

  // == tower control ==

  const roomStructures: Structure[] = room.find(FIND_STRUCTURES);
  const towers: Tower[] = _.filter(roomStructures,
    (structure: Structure) => (structure.structureType === STRUCTURE_TOWER)) as Tower[];

  if (hostileCreeps.length > 0)
  {
    for (const tower of towers)
    {
      // find the nearest hostile creep and attack it.
      tower.attack(tower.pos.findClosestByRange(hostileCreeps));
    }

  }
  // repair broken structures instead
  else
  {
    const weakStructures =
      _.filter(roomStructures, (structure) => (structure instanceof OwnedStructure
        && structure.hits < 100000 && structure.hits !== structure.hitsMax));

    for (const tower of towers)
    {
      if (weakStructures.length > 0)
      {
        tower.repair(tower.pos.findClosestByRange(weakStructures));
      }
    }
  }

  // == job control ==

  if (Object.keys(Memory.Job.Build).length === 0)
  {
    const constructionSites: ConstructionSite[] = room.find(FIND_CONSTRUCTION_SITES);

    if (constructionSites.length !== 0)
    {
      const newSite = (room.storage as Storage).pos.findClosestByRange(constructionSites);

      Job.Build.create(newSite, room.storage);
    }
  }

  for (const id in Memory.Job.Build)
  {
    let job = new Job.Build(id);

    try
    {
      if (job.isDone())
      {
        const creeps = job.getCreeps();

        Job.Build.remove(id);

        // find the closest site to the spawn
        const newSite =
          (room.storage as Storage).pos.findClosestByRange(
            room.find<ConstructionSite>(FIND_CONSTRUCTION_SITES));

        if (newSite !== undefined)
        {
          // set the new job
          job = Job.Build.create(newSite, room.storage);

          // rehire the creeps from the last job
          for (const creep of creeps)
          {
            job.hireByName(creep.name);
          }
        }
        else
        {
          // TODO: tell the creeps to suicide at the grave container?
        }
      }
    }
    catch (e)
    {
      console.log(
        "There was a mishap while trying to reset a new construction job:\n" + e.stack);
    }
  }

  // == Job execution ==

  for (const jobType in Job)
  {
    for (const id of Memory[jobType])
    {
      // TODO: FIND A PROPER WAY TO DO THIS #hack
      const job = new (Job as any)[jobType](id) as JobHire;
      job.execute();
    }
  }

  // == spawn control == (very much hacked together)

  let spawning = false;

  // harvesters

  for (const id in Memory.Job.Harvest)
  {
    if (!spawning)
    {
      // get harvest job and creeps
      const harvestJob: Job.Harvest = new Job.Harvest(id);
      const harvestCreeps: Creep[] = harvestJob.getCreeps();

      const workParts = _.sum(harvestCreeps,
        (creep: Creep) => (_.countBy(creep.body, (part) => (part.type))[WORK]));
      // console.log("workParts: " + workParts);

      if (workParts < 6)
      {
        const name = spawn.createCreep(
          [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE]);

        // prevent anything else from spawning
        spawning = true;

        if (!(name instanceof Number))
        {
          console.log("spawning " + name + " to harvest");
          harvestJob.hireByName(name);
        }
      }
    }
  }

  // remote harvest hauler

  if (!spawning)
  {
    const job = new Job.Haul("58abb6a15ace7d31c90b9bb9589d77f854fd9fb92ae9ef93");

    if (job.getCreeps().length === 0)
    {
      const name = spawn.createCreep(
        [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
          MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]);

      // prevent anything else from spawning
      spawning = true;

      if (name instanceof String)
      {
        console.log("spawning " + name + " to haul to from remote harvest");
        job.hireByName(name);
      }
    }
  }

  // west tower

  if (!spawning)
  {
    const job = new Job.Haul("5897caf755a4abc81f0dbe3c589d2aef1da6a7420c875df9");

    if (job.getCreeps().length === 0)
    {
      const name = spawn.createCreep([CARRY, CARRY, MOVE, MOVE]);

      // prevent anything else from spawning
      spawning = true;

      if (name instanceof String)
      {
        console.log("spawning " + name + " to haul to west tower");
        job.hireByName(name);
      }
    }
  }

  // east tower

  if (!spawning)
  {
    const job = new Job.Haul("589d77f854fd9fb92ae9ef93589ebc49fe3995e23c6dc83d");

    if (job.getCreeps().length === 0)
    {
      const name = spawn.createCreep([CARRY, CARRY, MOVE, MOVE]);

      // prevent anything else from spawning
      spawning = true;

      if (name instanceof String)
      {
        console.log("spawning " + name + " to haul to east tower");
        job.hireByName(name);
      }
    }
  }

  // keanium trade hauler

  if (!spawning)
  {
    const job = new Job.Haul("589d77f854fd9fb92ae9ef9358a69697a707156f3ccbf7bb");

    if (job.getCreeps().length === 0)
    {
      const name = spawn.createCreep([CARRY, CARRY, CARRY, MOVE]);

      // prevent anything else from spawning
      spawning = true;

      if (name instanceof String)
      {
        console.log("spawning " + name + " to haul keanium to trader");
        job.hireByName(name);
      }
    }
  }

  // upgrader hauler

  if (!spawning)
  {
    const job = new Job.Haul("589d77f854fd9fb92ae9ef93589ec3759c4e3b5b2d089af5");

    if (job.getCreeps().length === 0)
    {
      const name = spawn.createCreep(
        [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]);

      // prevent anything else from spawning
      spawning = true;

      if (name instanceof String)
      {
        console.log("spawning " + name + " to haul to upgrader bucket");
        job.hireByName(name);
      }
    }
  }

  // upgraders

  for (const id in Memory.Job.Upgrade)
  {
    if (!spawning)
    {
      const job = new Job.Upgrade(id);

      if (spawn.energy === spawn.energyCapacity && job.getCreeps().length < 4)
      {
        const name = spawn.createCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE]);

        // prevent anything else from spawning
        spawning = true;

        if (name instanceof String)
        {
          console.log("spawning " + name + " to upgrade");
          job.hireByName(name);
        }
      }
    }
  }

  // builders

  for (const id in Memory.Job.Build)
  {
    if (!spawning)
    {
      const job = new Job.Build(id);
      let energy = (room.storage as Storage).store[RESOURCE_ENERGY];
      energy = (energy === undefined ? 0 : energy);

      if (job.getCreeps().length < Math.floor(
        energy / (2 * 5 /*parts*/ * CREEP_LIFE_TIME * BUILD_POWER)))
      {
        const name = spawn.createCreep(
          [WORK, WORK, WORK, WORK, WORK,
            CARRY, CARRY, CARRY,
            MOVE, MOVE, MOVE, MOVE, MOVE]);

        // prevent anything else from spawning
        spawning = true;

        if (name instanceof String)
        {
          console.log("spawning " + name + " to build");
          job.hireByName(name);
        }
      }
    }
  }
};
