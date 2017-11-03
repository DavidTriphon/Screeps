// =============================================================================
//   IMPORTS
// =============================================================================

import {JobHire} from "./JobHire";
import {RoomPositionExt} from "../../prototypes/RoomPosition";
import * as Task from "../task/Module";
import {TaskResult} from "../task/TaskResult";

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class JobDefend extends JobHire
{
  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - pos: string
  // - range: number
  // - creepNames: Creep[]

  public static create(site: RoomPosition, range: number): JobDefend
  {
    // make sure the main directory exists.
    if (Memory.JobDefend === undefined)
    {
      Memory.JobDefend = {};
    }

    // make sure the range is a number above 0.
    if (range <= 0)
    {
      throw new Error("The range cannot be 0 or less:\n- range: " + range);
    }
    // set the id by using the site serialization.
    const id = site.serialize();

    // make sure that the build job doesn't already exist so you don't overwrite it
    if (this.isJob(id))
    {
      throw new Error("The defender for this site is already defined.");
    }
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

  public static remove(id: string): void
  {
    delete Memory.JobDefend[id];
  }

  public static isJob(id: string): boolean
  {
    return (Memory.JobDefend[id] !== undefined);
  }

  // =============================================================================
  //   INSTANCE FIELDS
  // =============================================================================

  private site: RoomPosition;
  private range: number;

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "JobDefend");
  }

  // =============================================================================
  //   EXECUTE METHOD
  // =============================================================================

  public execute(): void
  {
    const sitePos = this.getSite();
    const room = Game.rooms[sitePos.roomName];

    let hostiles: Creep[] = [];

    if (room !== undefined)
    {
      const roomCreeps = room.find<Creep>(FIND_HOSTILE_CREEPS);
      const hostileCreeps = _.filter(roomCreeps, (creep) => (IS_FRIENDLY[creep.owner.username]));
      hostiles = _.filter(hostileCreeps, (creep) => (creep.pos.squareDistanceTo(sitePos) <= this.getRange()));
    }

    for (const creep of this.getCreeps())
    {
      try
      {
        // creep.say('I\'m a defender!');

        if (hostiles.length > 0)
        {
          const taskType = creep.getTask().taskType;

          if (taskType !== "attack")
          {
            const closestHostile = creep.pos.findClosestByRange(hostiles);

            creep.setTask(new Task.Attack(closestHostile));
          }
        }

        const result = creep.doTask();

        if (result !== TaskResult.NOT_DONE)
        {
          if (hostiles.length > 0)
          {
            const closestHostile = creep.pos.findClosestByRange(hostiles);

            creep.setTask(new Task.Attack(closestHostile));
          }
          else
          {
            creep.setTask(new Task.MoveToPos(this.getSite(), 0));
          }
          creep.doTask();
        }
      }
      catch (e)
      {
        console.log("The creep " + creep.name +
          " had an issue when trying to execute for the job " + this._jobType + ".\n" + e.stack);
      }
    }
  }

  // =============================================================================
  //  SITE / RANGE METHODS
  // =============================================================================

  public getSite(): RoomPosition
  {
    if (this.site === undefined)
    {
      this.site = RoomPositionExt.deserialize(Memory.JobDefend[this._id].site);
    }
    return this.site;
  }

  public getRange(): number
  {
    if (this.range === undefined)
    {
      this.range = Memory.JobDefend[this._id].range;
    }
    return this.range;
  }

  public setRange(range: number): void
  {
    // set memory range
    Memory.JobDefend[this._id].range = range;

    // set instance range variable
    this.range = range;
  }
}
