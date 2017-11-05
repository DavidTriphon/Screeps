/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.FillSpawn');
 * mod.thing == 'a thing'; // true
 */

import {Job} from "./Job";
import {RoomPositionExt} from "../../prototypes/RoomPosition";
import * as Task from "../task/Module";
import {TaskResult} from "../task/TaskResult";
import {JobDefinition} from "./JobDefinition";

@JobDefinition("FillSpawn")
export class JobFillSpawn extends Job
{
  // =============================================================================
  //  MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - pickUp
  //   - id : string
  //   - pos : posData
  // - creepNames : []

  public static create(room: Room, pickUpStructure: Structure): JobFillSpawn
  {
    // make sure the main directory exists.
    if (Memory.JobFillSpawn === undefined)
    {
      Memory.JobFillSpawn = {};
    }
    // set the id by using the room name.
    const id = room.name;

    // make sure that the fillSpawn job doesn't already exist so you don't overwrite it
    if (this.isJob(id))
    {
      throw new Error("The spawn filler for this room is already defined.");
    }
    // set up local object
    Memory.JobFillSpawn[id] = {};

    // set the pick up structure
    Memory.JobFillSpawn[id].pickUp =
      {id: pickUpStructure.id, pos: pickUpStructure.pos.serialize(), type: pickUpStructure.structureType};

    // set up creep employee array
    Memory.JobFillSpawn[id].creepNames = [];

    // return the new object.
    return new JobFillSpawn(id);
  }

  public static remove(id: string): void
  {
    delete Memory.JobFillSpawn[id];
  }

  public static isJob(id: string): boolean
  {
    return (Memory.JobFillSpawn[id] !== undefined);
  }

  // =============================================================================
  //   INSTANCE FIELDS
  // =============================================================================

  private refillTask: Task.Transfer;
  private pickUp: Structure | null;

  // =============================================================================
  //  CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "JobFillSpawn");
  }

  // =============================================================================
  //  EXECUTE METHOD
  // =============================================================================

  public execute(): void
  {
    for (const creep of this.getCreeps())
    {
      try
      {
        // creep.say('I\'m a builder!');

        const result = creep.doTask();

        if (result !== TaskResult.WORKING)
        {
          // get the work task or refill task based on whether it's empty

          let task;

          if (creep.isEmptyOf(RESOURCE_ENERGY))
          {
            task = this.getRefillTask();
          }
          else
          {
            const room = this.getRoom();
            const structures = room.find<Structure>(FIND_MY_STRUCTURES);

            const extensions = _.filter(structures,
              (structure: Structure) => (structure.structureType === STRUCTURE_EXTENSION)) as StructureExtension[];

            const spawns = _.filter(structures,
              (structure: Structure) => (structure.structureType === STRUCTURE_SPAWN)) as StructureSpawn[];

            const data = this.getPickUpData();

            if (data.type === STRUCTURE_SPAWN)
            {
              const structure = Game.getObjectById<StructureSpawn>(data.id);

              if (structure !== null)
              {
                const index = spawns.indexOf(structure);

                if (index > -1)
                {
                  // remove the spawn that we fill from, from the list of things to fill.
                  spawns.splice(index, 1);
                }
              }
              else
              {
                // the structure is not visible despite that it would be our own structure, so that means it's gone
              }
            }

            const fillers = extensions.concat(spawns);
            const toFill = _.filter(fillers, (fill: StructureExtension) => (fill.energy < fill.energyCapacity));

            const dropOff = creep.pos.findClosestByRange(toFill);

            if (dropOff == null)
            {
              task = null;
            }
            else
            {
              task = new Task.Transfer(dropOff);
            }
          }

          // set the task and do it once this tick
          creep.setTask(task);
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

  public getRefillTask()
  {
    if (this.refillTask === undefined)
    {
      const pickUpData = this.getPickUpData();
      const pickUpPos = RoomPositionExt.deserialize(pickUpData.pos);
      const pickUpRoom = Game.rooms[pickUpPos.roomName];
      const pickUp = Game.getObjectById(pickUpData.id);

      let task = null;

      if (pickUp === undefined || pickUp === null)
      {
        // the pickUp is not visible

        if (pickUpRoom === undefined)
        {
          // the room is not visible

          // just go to the room by heading to the pickUp
          task = new TaskMoveToPos(pickUpPos, 1);
        }
        else
        {
          // the room is visible

          // Well apparently the structure to pick up from is gone, this is not good.

          throw new Error("The structure to pick up from for JobFillSpawn[" + this._id + "] is no longer visible!");
        }
      }
      else
      {
        // the pickUp is visible

        task = new TaskWithdraw(pickUp);
      }

      this.refillTask = task;
    }

    return this.refillTask;
  }

  // =============================================================================
  //  ROOM METHODS
  // =============================================================================

  public getRoom(): Room
  {
    return Game.rooms[this._id];
  }

  // =============================================================================
  //  PICKUP METHODS
  // =============================================================================

  public getPickUpData()
  {
    return Memory.JobFillSpawn[this._id].pickUp;
  }

  public getPickUpStructure(): Structure | null
  {
    if (this.pickUp === undefined)
    {
      this.pickUp = Game.getObjectById(this.getPickUpData());
    }

    return this.pickUp;
  }

  public setPickUpStructure(structure: Structure)
  {
    Memory.JobFillSpawn[this._id].pickUp =
      {id: structure.id, pos: structure.pos.serialize(), type: structure.structureType};
  }
}
