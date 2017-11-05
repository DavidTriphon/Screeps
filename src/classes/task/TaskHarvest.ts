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
  interface HarvestTaskMemory extends TaskMemory
  {
    source: IdentifiableResource;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("Harvest")
export class Harvest extends Task<HarvestTaskMemory>
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static createMemory(source: IdentifiableResource): HarvestTaskMemory
  {
    if (!source.isRenewable)
    {
      throw new Error("Identifier must be for a source, not a resource.");
    }

    if (source.resourceType !== RESOURCE_ENERGY)
    {
      throw new Error("Identifier must be for a source, not a mineral.");
    }

    return {source, type: "Harvest"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: HarvestTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep): TaskResult
  {
    const source = Visibility.identifySource(this.memory.source);

    // get the idea out of its head that there could be multiple sources
    if (source instanceof Array)
    {
      throw new Error("IMPOSSIBILITY: CHECK IMPLEMENTTAION:\n" +
        "Visibility claims there is an array of sources at a single position.");
    }

    // let's check if it actually found the source
    if (source instanceof Source)
    {
      // try to harvest from the source
      const result = creep.harvest(source);

      // harvested successfully
      if (result === OK)
      {
        const emptySpace = creep.emptySpace();
        const mined = creep.getActiveBodyparts(WORK) * HARVEST_POWER;

        if (mined > emptySpace)
        {
          return TaskResult.DONE;
        }
        else
        {
          return TaskResult.WORKING;
        }
      }

      // source out of range
      else if (result === ERR_NOT_IN_RANGE)
      {
        creep.moveTo(source);
        return TaskResult.WORKING;
      }

      // really bad error
      else
      {
        throw new Error("Unexpected result from harvesting " + source +
          " with " + creep + ": " + result);
      }
    }

    // Apparently the location errored
    else
    {
      switch (source)
      {
        case Visibility.ERROR.NOT_VISIBLE:
          {
            creep.moveTo(RoomPositionExt.deserialize(this.memory.source.pos));
            return TaskResult.WORKING;
          }
        default:
          {
            throw new Error("The source data is REALLY BAD. ie. it's not a source.");
          }
      }
    }
  }
}
