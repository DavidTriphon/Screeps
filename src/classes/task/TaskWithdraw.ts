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
  interface WithdrawTaskMemory extends TaskMemory
  {
    pickUp: IdentifiableStructure;
    resourceType: string;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("Withdraw")
export class Withdraw extends Task<WithdrawTaskMemory>
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static createMemory(structure: IdentifiableStructure, resourceType: string):
    WithdrawTaskMemory
  {
    if (!structure.isConstructed)
    {
      throw new Error("Identifier must be for a structure, not a construction site.");
    }

    return {pickUp: structure, resourceType, type: "Withdraw"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: WithdrawTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep): TaskResult
  {
    const structure = Visibility.identifyStructure(this.memory.pickUp);

    // get the idea out of its head that there could be multiple structures
    if (structure instanceof Array)
    {
      throw new Error("IMPOSSIBILITY: CHECK IMPLEMENTTAION:\n" +
        "Visibility claims there is an array of structures at a single position.");
    }

    // let's check if it actually found the structure
    if (structure instanceof Structure)
    {
      // try to withdraw from the structure
      const result = creep.withdraw(structure, this.memory.resourceType);

      // withdrew successfully
      if (result === OK || result === ERR_FULL)
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
        throw new Error("Unexpected result from withdrawing from " + structure +
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
            creep.moveTo(RoomPositionExt.deserialize(this.memory.pickUp.pos));
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
