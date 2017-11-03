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

export class JobUpgrade extends JobHire
{
  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - controller: Identifiable
  // - pickUp : Identifiable
  // - creepNames : []

  public static create(controller: StructureController, pickUpStructure: Structure): JobUpgrade
  {
    // make sure the main directory exists.
    if (Memory.Job.Upgrade === undefined)
    {
      Memory.Job.Upgrade = {};
    }

    // set the id by using the controller id.
    const id = controller.id;

    // make sure that the upgrade job doesn't already exist so you don't overwrite it
    if (this.isJob(id))
    {
      throw new Error("The upgrader for this room is already defined.");
    }

    const data: JobUpgradeData = {
      controller: {id: controller.id, pos: controller.pos.serialize()},
      pickUp: {id: pickUpStructure.id, pos: pickUpStructure.pos.serialize()},
      creeps: []
    };

    // set the data to the memory address
    Memory.Job.Upgrade[id] = data;

    // return the new object.
    return new JobUpgrade(id);
  }

  public static remove(id: string): void
  {
    delete Memory.Job.Upgrade[id];
  }

  public static isJob(id: string): boolean
  {
    return (Memory.Job.Upgrade[id] !== undefined);
  }

  // =============================================================================
  //   INSTANCE FIELDS
  // =============================================================================

  private pickUpStructure: Structure | null;
  private controller: StructureController | null;

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "JobUpgrade");
  }

  // =============================================================================
  //   EXECUTE METHOD
  // =============================================================================

  public execute(): void
  {
    for (const creep of this.getCreeps())
    {
      // creep.say('I\'m a upgrader!');

      const result = creep.doTask();

      if (result !== TaskResult.NOT_DONE)
      {
        let task = null;

        if (creep.carry.energy !== undefined && creep.carry.energy >= creep.carryCapacity / 2)
        {
          const controllerData = this.getControllerData();

          const controller = Game.getObjectById(controllerData.id);

          if (controller !== undefined)
          {
            // if the controller is visible
            // try to upgrade to it
            task = new Task.Upgrade(controller);
          }
          else
          {
            // else give it a move task
            task = new Task.MoveToPos(RoomPositionExt.deserialize(controllerData.pos), 2);
          }
        }
        else
        {
          const pickUpData = this.getPickUpData();

          const pickUp = Game.getObjectById(pickUpData.id);

          if (pickUp !== undefined)
          {
            // if the pickUp is visible
            // try to withdraw from it
            task = new Task.Withdraw(pickUp);
          }
          else
          {
            // else give it a move task
            task = new Task.MoveToPos(RoomPositionExt.deserialize(pickUpData.pos), 2);
          }
        }

        // set the task and do it once this tick
        creep.setTask(task);
        creep.doTask();
      }
    }
  }

  // =============================================================================
  //   CONTROLLER METHODS
  // =============================================================================

  public isControllerVisible(): boolean
  {
    try
    {
      this.getController();
    }
    catch
    {
      return false;
    }

    return true;
  }

  public getController(): Controller
  {
    if (this.controller === undefined)
    {
      const data = this.getControllerData();

      this.controller = Game.getObjectById<Controller>(data.id);
    }

    if (this.controller === null)
    {
      throw new Error("The controller is not visible.");
    }

    return this.controller;
  }

  public getControllerData(): Identifiable
  {
    return Memory.Job.Upgrade[this._id].controller;
  }

  // =============================================================================
  //   PICKUP METHODS
  // =============================================================================

  public isPickUpVisible(): boolean
  {
    try
    {
      this.getPickUpStructure();
    }
    catch
    {
      return false;
    }

    return true;
  }

  public getPickUpStructure(): Structure
  {
    if (this.pickUpStructure === undefined)
    {
      const data = this.getPickUpData();

      this.pickUpStructure = Game.getObjectById<Structure>(data.id);
    }

    if (this.pickUpStructure === null)
    {
      throw new Error("The controller is not visible.");
    }

    return this.pickUpStructure;
  }

  public getPickUpData(): Identifiable
  {
    return Memory.Job.Upgrade[this._id].pickUp;
  }

  public setPickUpStructure(structure: Structure)
  {
    Memory.Job.Upgrade[this._id].pickUp = {id: structure.id, pos: structure.pos.serialize()};
  }
}
