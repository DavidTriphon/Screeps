// =============================================================================
//   IMPORTS
// =============================================================================

import {JobHire} from "./JobHire";
import * as Visibility from "../../Visibility";
import {TaskResult} from "../task/TaskResult";

const type = "Build";

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class JobBuild extends JobHire
{
  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - pickUp: IdentifiableStructure
  // - site: IdentifiableConstructionSite | boolean
  // - creepNames : []

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

    const job = new JobBuild(id);

    job.site = site;
    job.pickUp = pickUp;

    // return the new object.
    return job;
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

  private pickUp: Structure | null;
  private site: ConstructionSite | null;

  private buildTaskData: BuildTaskData;
  private withdrawTaskData: WithdrawTaskData;

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, type);
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

          if (result !== TaskResult.NOT_DONE)
          {
            // get the work task or refill task based on whether
            // it's over or under half full
            const energy: number =
              (creep.carry.energy === undefined ? 0 : creep.carry.energy);
            const task = ((energy >= creep.carryCapacity / 2) ?
              (this.getBuildTaskData()) :
              (this.getWithdrawTaskData()));

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

  public getSite(): ConstructionSite | null
  {
    if (this.site === undefined)
    {
      const data = this.rawData().site;

      if (data === null)
      {
        this.site = null;
      }
      else
      {
        const identified = Visibility.identifyConstructionSite(data);
        // there really shouldn't be an array of structures, but just in case...
        if (identified instanceof Array)
        {
          this.site = identified[0];
        }
        else if (identified instanceof ConstructionSite)
        {
          this.site = identified;
        }
        else
        {
          if (identified === Visibility.ERROR.NOT_PRESENT ||
            identified === Visibility.ERROR.NOT_VISIBLE)
          {
            this.site = null;
          }
          else
          {
            throw new Error("Unexpected identification error: " + identified);
          }
        }
      }
    }

    return this.site;
  }

  public getSiteIdentifier(): IdentifiableStructure | null
  {
    return this.rawData().site;
  }

  public isDone(): boolean
  {
    return this.getSiteIdentifier() === null;
  }

  // PICKUP METHODS

  public getPickUp(): Structure | null
  {
    if (this.pickUp === undefined)
    {
      const data = this.getPickUpIdentifier();

      const identified = Visibility.identifyStructure(data);
      // there really shouldn't be an array of structures, but just in case...
      if (identified instanceof Array)
      {
        this.pickUp = identified[0];
      }
      else if (identified instanceof Structure)
      {
        this.pickUp = identified;
      }
      else
      {
        if (identified === Visibility.ERROR.NOT_PRESENT ||
          identified === Visibility.ERROR.NOT_VISIBLE)
        {
          this.pickUp = null;
        }
        else
        {
          throw new Error("Unexpected identification error: " + identified);
        }
      }
    }

    return this.pickUp;
  }

  public getPickUpIdentifier(): IdentifiableStructure
  {
    return this.rawData().pickUp;
  }

  public setPickUp(structure: Structure): void
  {
    this.pickUp = structure;

    Memory.Job.Build[this._id].pickUp = structure.identifier();
  }

  // =============================================================================
  //   PRIVATE METHODS
  // =============================================================================

  private getBuildTaskData(): BuildTaskData
  {
    if (this.buildTaskData === undefined)
    {
      const siteData = this.getSiteIdentifier();

      if (siteData === null)
      {
        throw new Error("Cannot retrieve build task data, no identifiable site defined");
      }

      this.buildTaskData = {site: siteData};
    }

    return this.buildTaskData;
  }

  private getWithdrawTaskData(): WithdrawTaskData
  {
    if (this.withdrawTaskData === undefined)
    {
      this.withdrawTaskData = {
        pickUp: this.getPickUpIdentifier(),
        resourceType: RESOURCE_ENERGY
      };
    }

    return this.withdrawTaskData;
  }

  private rawData(): JobBuildData
  {
    return Memory.Job.Build[this._id];
  }
}
