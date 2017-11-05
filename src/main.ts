// =============================================================================
//   IMPORTS
// =============================================================================

// constants

// job types

import * as Job from "./classes/job/Module";
import * as JobDefiner from "./classes/job/JobDefinition";

// task types

import * as TaskDefiner from "./classes/task/TaskDefinition";

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
  namespace NodeJS
  {
    interface Global
    {
      [k: string]: any;
      IS_FRIENDLY: {[name: string]: boolean};
      MY_USERNAME: string;
      System: any;
      ex: (x: any) => string;
      JobList: {[type: string]: JobDefiner.JobConstructor};
      TaskList: {[type: string]: TaskDefiner.TaskConstructor<any, any>};
    }
  }
}

global.System = {};

global.MY_USERNAME = "DavidTriphon";

global.IS_FRIENDLY = {
  Dfett: true,
  EngineerYo: true,
  Cz4r: true,
  DirtyLittleCodeMonkey: true,
  Layl: true,
  c01: true
};

global.ex = (x: any) => JSON.stringify(x, null, 2); // courtesy of @warinternal Aug 2016

global.JobList = JobDefiner.definitions;

global.TaskList = TaskDefiner.taskList;

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

  Memory.Job = {
    Build: {},
    Harvest: {},
    Haul: {},
    Upgrade: {}
  };

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

global.System.showSiteTypes = function showSiteTypes()
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
};

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
    (creep) => (!global.IS_FRIENDLY[creep.owner.username]));
  const nearbyCreeps: Creep[] = _.filter(hostileCreeps,
    (creep) => (creep.pos.squareDistanceTo(spawn.pos) <= 3));

  // check if any enemy creeps are near the spawn
  if (nearbyCreeps.length > 0 && (room.controller as Controller).safeMode === undefined)
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

  // == job control ==

  // == Job execution ==

  for (const jobType in Job)
  {
    for (const id in Memory.Job[jobType])
    {
      const job = new global.JobList[jobType](id);
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
      const harvestJob = new Job.Harvest(id);
      const harvestCreeps: Creep[] = harvestJob.getCreeps();

      const workParts = _.sum(harvestCreeps,
        (creep: Creep) => (_.countBy(creep.body, (part) => (part.type))[WORK]));
      // console.log("workParts: " + workParts);

      if (workParts < 6 && harvestCreeps.length < harvestJob.maxCreeps())
      {
        const name = spawn.createCreep(
          [WORK, CARRY, MOVE, MOVE]);

        // prevent anything else from spawning
        spawning = true;

        if (typeof name === "string")
        {
          console.log("spawning " + name + " to harvest");
          harvestJob.hireByName(name);
        }
      }
    }
  }

  // upgraders

  for (const id in Memory.Job.Upgrade)
  {
    if (!spawning)
    {
      const job = new Job.Upgrade(id);

      if (spawn.energy === spawn.energyCapacity)
      {
        const name = spawn.createCreep([WORK, CARRY, MOVE, MOVE]);

        // prevent anything else from spawning
        spawning = true;

        if (typeof name === "string")
        {
          console.log("spawning " + name + " to upgrade");
          job.hireByName(name);
        }
      }
    }
  }
};
