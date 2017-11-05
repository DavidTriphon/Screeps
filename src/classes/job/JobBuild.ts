// =============================================================================
//   IMPORTS
// =============================================================================

import {Job} from "./Job";
import * as Task from "../task/Module";
import {TaskResult} from "../task/TaskResult";
import {JobDefinition} from "./JobDefinition";

// =============================================================================
//   CONSTANTS
// =============================================================================

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface JobBuildData extends JobMemory
  {
    pickUp: IdentifiableStructure;
    site: IdentifiableStructure | null;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

@JobDefinition("Build")
export class JobBuild extends Job
{
  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================

  public static create(site: ConstructionSite, pickUp: Structure): JobBuild
  {
    // make sure the main directory exists.
    if (Memory.Job.Build === undefined)
    {
      Memory.Job.Build = {};
    }
    // set the id by using the site id.
    const id = site.id;

    // make sure that the build job doesn't already exist so you don't overwrite it
    if (this.isJob(id))
    {
      throw new Error("The builder for this site is already defined.");
    }

    const data: JobBuildData = {
      creeps: [],
      site: site.identifier(),
      pickUp: pickUp.identifier()
    };

    // set up local object
    Memory.Job.Build[id] = data;

    // return the new object.
    return new JobBuild(id);
  }

  public static remove(id: string): void
  {
    delete Memory.Job.Build[id];
  }

  public static isJob(id: string): boolean
  {
    return (Memory.Job.Build[id] !== undefined);
  }

  // =============================================================================
  //   INSTANCE FIELDS
  // =============================================================================

  private buildTaskData: BuildTaskMemory;
  private withdrawTaskData: WithdrawTaskMemory;

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "Build");
  }

  public get(id: string): Job
  {
    return new JobBuild(id);
  }

  // =============================================================================
  //   EXECUTE METHOD
  // =============================================================================

  public execute(): void
  {
    for (const creep of this.getCreeps())
    {
      if (!this.isDone())
      {
        try
        {
          const result = creep.doTask();

          if (result !== TaskResult.WORKING)
          {
            // get the work task or refill task based on whether
            // it's over or under half full
            const energy: number =
              (creep.carry.energy === undefined ? 0 : creep.carry.energy);
            const task = ((energy >= creep.carryCapacity / 2) ?
              (this.getBuildTaskMemory()) :
              (this.getWithdrawTaskMemory()));

            // set the task and do it once this tick
            creep.setTask(task);
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
  }

  // =============================================================================
  //   INSTANCE METHODS
  // =============================================================================

  // SITE / COMPLETENESS METHODS

  public getSiteIdentifier(): IdentifiableStructure | null
  {
    return this.rawData().site;
  }

  public isDone(): boolean
  {
    return this.getSiteIdentifier() === null;
  }

  // PICKUP METHODS

  public getPickUpIdentifier(): IdentifiableStructure
  {
    return this.rawData().pickUp;
  }

  public setPickUp(structure: Structure): void
  {
    Memory.Job.Build[this._id].pickUp = structure.identifier();
  }

  // =============================================================================
  //   PRIVATE METHODS
  // =============================================================================

  private getBuildTaskMemory(): BuildTaskMemory
  {
    if (this.buildTaskData === undefined)
    {
      const siteData = this.getSiteIdentifier();

      if (siteData === null)
      {
        throw new Error("Cannot retrieve build task data, no identifiable site defined");
      }

      this.buildTaskData = Task.Build.createMemory(siteData);
    }

    return this.buildTaskData;
  }

  private getWithdrawTaskMemory(): WithdrawTaskMemory
  {
    if (this.withdrawTaskData === undefined)
    {
      this.withdrawTaskData =
        Task.Withdraw.createMemory(this.getPickUpIdentifier(), RESOURCE_ENERGY);
    }

    return this.withdrawTaskData;
  }

  private rawData(): JobBuildData
  {
    return Memory.Job.Build[this._id];
  }
}
