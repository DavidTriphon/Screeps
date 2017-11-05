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
  interface TransferTaskMemory extends TaskMemory
  {
    dropOff: IdentifiableStructure;
    resourceType: string;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("Transfer")
export class Transfer extends Task<TransferTaskMemory>
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static createMemory(structure: IdentifiableStructure, resourceType: string):
    TransferTaskMemory
  {
    if (!structure.isConstructed)
    {
      throw new Error("Identifier must be for a structure, not a construction site.");
    }

    return {dropOff: structure, resourceType, type: "Transfer"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: TransferTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep): TaskResult
  {
    const structure = Visibility.identifyStructure(this.memory.dropOff);

    // get the idea out of its head that there could be multiple structures
    if (structure instanceof Array)
    {
      throw new Error("IMPOSSIBILITY: CHECK IMPLEMENTTAION:\n" +
        "Visibility claims there is an array of structures at a single position.");
    }

    // let's check if it actually found the structure
    if (structure instanceof Structure)
    {
      // try to transfer to the structure
      const result = creep.transfer(structure, this.memory.resourceType);

      // transferred successfully
      if (result === OK || result === ERR_NOT_ENOUGH_ENERGY)
      {
        return TaskResult.DONE;
      }

      // structure out of range
      else if (result === ERR_NOT_IN_RANGE)
      {
        creep.moveTo(structure);
        return TaskResult.WORKING;
      }

      // really bad error
      else
      {
        throw new Error("Unexpected result from transferring to " + structure +
          " with " + creep + ": " + result);
      }
    }

    // Apparently the location errored
    else
    {
      switch (structure)
      {
        case Visibility.ERROR.NOT_VISIBLE:
          {
            creep.moveTo(RoomPositionExt.deserialize(this.memory.dropOff.pos));
            return TaskResult.WORKING;
          }
        default:
          {
            throw new Error("The site data is REALLY BAD. ie. it's not a site.");
          }
      }
    }
  }
}
