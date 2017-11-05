// =============================================================================
//   IMPORTS
// =============================================================================

import {Job} from "./Job";
import {JobDefinition} from "./JobDefinition";

import * as Task from "../task/Module";
import {TaskResult} from "../task/TaskResult";

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface JobUpgradeMemory extends JobMemory
  {
    controller: IdentifiableStructure;
    pickUp: IdentifiableStructure;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

@JobDefinition("Upgrade")
export class JobUpgrade extends Job
{
  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - controller: Identifiable
  // - pickUp : Identifiable
  // - creepNames : []

  public static create(controller: StructureController, pickUpStructure: Structure):
    JobUpgrade
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

    const data: JobUpgradeMemory = {
      controller: controller.identifier(),
      pickUp: pickUpStructure.identifier(),
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

  private upgradeTaskMemory: UpgradeTaskMemory;
  private withdrawTaskMemory: WithdrawTaskMemory | MoveToPosTaskMemory;

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "Upgrade");
  }

  // =============================================================================
  //   EXECUTE METHOD
  // =============================================================================

  public execute(): void
  {
    for (const creep of this.getCreeps())
    {
      try
      {
        const result = creep.doTask();

        if (result !== TaskResult.WORKING)
        {
          if (creep.amountOf(RESOURCE_ENERGY) >= creep.carryCapacity / 2)
          {
            creep.setTask(this.getUpgradeTaskMemory());
          }
          else
          {
            creep.setTask(this.getWithdrawTaskMemory());
          }

          creep.doTask();
        }
      }
      catch (e)
      {
        console.log("The creep " + creep.name +
          " had an issue when trying to execute for the job " +
          this._jobType + ".\n" + e.stack);
      }
    }
  }

  // =============================================================================
  //   CONTROLLER METHODS
  // =============================================================================

  // TASK METHODS

  private getUpgradeTaskMemory(): UpgradeTaskMemory
  {
    if (this.upgradeTaskMemory === undefined)
    {
      this.upgradeTaskMemory = Task.Upgrade.createMemory(this.getControllerData());
    }

    return this.upgradeTaskMemory;
  }

  private getWithdrawTaskMemory(): WithdrawTaskMemory | MoveToPosTaskMemory
  {
    if (this.withdrawTaskMemory === undefined)
    {
      this.withdrawTaskMemory =
        Task.Withdraw.createMemory(this.getPickUpData(), RESOURCE_ENERGY);
    }

    return this.withdrawTaskMemory;
  }

  // CONTROLLER METHODS

  public getControllerData(): IdentifiableStructure
  {
    return Memory.Job.Upgrade[this._id].controller;
  }

  // PICKUP METHODS

  public getPickUpData(): IdentifiableStructure
  {
    return Memory.Job.Upgrade[this._id].pickUp;
  }

  public setPickUpStructure(structure: Structure)
  {
    Memory.Job.Upgrade[this._id].pickUp = structure.identifier();
  }
}
