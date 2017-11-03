// IMPORTS

import {RoomPositionExt} from "../../prototypes/RoomPosition";
import {JobHire} from "./JobHire";
import * as Task from "../task/Module";
import {TaskResult} from "../task/TaskResult";

// CLASS

export class JobAttack extends JobHire
{
  // =============================================================================
  //  MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - target
  //   - pos : posData
  //   - id : string
  // - creepNames : []

  public static create(target: Creep | Structure)
  {
    // make sure the main directory exists.
    if (Memory.JobAttack === undefined)
    {
      Memory.JobAttack = {};
    }

    // set the id by using the target id.
    const id = target.id;

    // make sure that the attack job doesn't already exist so you don't overwrite it
    if (this.isJob(id))
    {
      throw new Error("The attacker job for the target " + id + " is already defined.");
    }
    // set up local object
    Memory.JobAttack[id] = {};

    // set target position and id
    Memory.JobAttack[id].target = {id, pos: target.pos.serialize()};

    // set up creep employee array
    Memory.JobAttack[id].creepNames = [];

    // return the new object.
    return new JobAttack(id);
  }

  public static remove(id: string)
  {
    delete Memory.JobAttack[id];
  }

  public static isJob(id: string)
  {
    return (Memory.JobAttack[id] !== undefined);
  }

  // =============================================================================
  //  CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "JobAttack");
  }

  // =============================================================================
  //  EXECUTE METHOD
  // =============================================================================

  public execute(): void
  {
    const targetData = Memory.JobAttack[this._id].target;
    const targetPos = RoomPositionExt.deserialize(targetData.pos);
    const targetRoom = Game.rooms[targetPos.roomName];
    let currentTask = null;

    // determine what the current assigned task should be.

    // check if the room is visible
    if (targetRoom === undefined)
    {
      // the room is not visible

      // tell the attacks to go to the position
      currentTask = new Task.MoveToPos(targetPos, 10);
    }
    else
    {
      // the room is visible, the target should be visible
      const target = Game.getObjectById<Structure | Creep>(targetData.id);

      currentTask = new Task.Attack(target);
    }

    for (const creep of this.getCreeps())
    {
      try
      {
        // creep.say('I\'m a attacker!');

        const result = creep.doTask();

        if (result !== TaskResult.NOT_DONE)
        {
          // set the task and do it once this tick
          creep.setTask(currentTask);
          creep.doTask();
        }

      }
      catch (e)
      {
        console.log("The creep " + creep.name + " had an issue when trying to execute for the job "
          + this._jobType + ".\n" + e.stack);

      }
    }
  }
}
