// =============================================================================
//   IMPORTS
// =============================================================================

import {Task} from "./Task";
import {TaskResult} from "./TaskResult";
import * as Visibility from "../../Visibility";
import {RoomPositionExt} from "../../prototypes/RoomPosition";
import {TaskDefinition} from "./TaskDefinition";

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface BuildTaskMemory extends TaskMemory
  {
    site: IdentifiableStructure;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("Build")
export class Build extends Task<BuildTaskMemory>
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static createMemory(site: IdentifiableStructure): BuildTaskMemory
  {
    if (site.isConstructed === true)
    {
      throw new Error("Identifier must be for a construction site, not a structure.");
    }

    return {site, type: "Build"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: BuildTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep): TaskResult
  {
    const site = Visibility.identifyConstructionSite(this.memory.site);

    // get the idea out of its head that there could be multiple sites
    if (site instanceof Array)
    {
      throw new Error("IMPOSSIBILITY: CHECK IMPLEMENTTAION:\n" +
        "Visibility claims there is an array of sites at a single position.");
    }

    // let's check if it actually found the site
    if (site instanceof ConstructionSite)
    {
      // try to work on the site
      const result = creep.build(site);

      // built a little bit successfully
      if (result === OK)
      {
        const energy = creep.amountOf(RESOURCE_ENERGY);
        const used = creep.getActiveBodyparts(WORK) * BUILD_POWER;

        if (used > energy)
        {
          return TaskResult.DONE;
        }
        else
        {
          return TaskResult.WORKING;
        }
      }

      // site out of range
      else if (result === ERR_NOT_IN_RANGE)
      {
        creep.moveTo(site);
        return TaskResult.WORKING;
      }

      // really bad error
      else
      {
        throw new Error("Unexpected result from constructing " + site +
          " with " + creep + ": " + result);
      }
    }

    // Apparently the location errored
    else
    {
      switch (site)
      {
        case Visibility.ERROR.NOT_VISIBLE:
          {
            creep.moveTo(RoomPositionExt.deserialize(this.memory.site.pos));
            return TaskResult.WORKING;
          }
        default:
          {
            throw new Error("The site memory is REALLY BAD. ie. it's not a site.");
          }
      }
    }
  }
}
