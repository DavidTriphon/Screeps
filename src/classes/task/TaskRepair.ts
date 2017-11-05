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
  interface RepairTaskMemory extends TaskMemory
  {
    structure: IdentifiableStructure;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("Repair")
export class Repair extends Task<RepairTaskMemory>
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static createMemory(structure: IdentifiableStructure): RepairTaskMemory
  {
    if (!structure.isConstructed)
    {
      throw new Error("Identifier must be for a structure, not a construction site.");
    }

    return {structure, type: "Repair"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: RepairTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep): TaskResult
  {
    let structure = Visibility.identifyStructure(this.memory.structure);

    // there could be multiple things needing repairs here.
    if (structure instanceof Array)
    {
      structure = structure[0];
    }

    // let's check if it actually found the structure
    if (structure instanceof Structure)
    {
      // try to do thing to the thing
      const result = creep.repair(structure);

      // did thing well
      if (result === OK)
      {
        const energy = creep.amountOf(RESOURCE_ENERGY);
        const used = creep.getActiveBodyparts(WORK);

        if (used > energy)
        {
          return TaskResult.DONE;
        }
        else
        {
          return TaskResult.WORKING;
        }
      }

      // thing out of range
      else if (result === ERR_NOT_IN_RANGE)
      {
        creep.moveTo(structure);
        return TaskResult.WORKING;
      }

      // really bad error
      else
      {
        throw new Error("Unexpected result from repairing " + structure +
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
            creep.moveTo(RoomPositionExt.deserialize(this.memory.structure.pos));
            return TaskResult.WORKING;
          }
        default:
          {
            throw new Error(
              "The structure data is REALLY BAD. ie. it's not a structure.");
          }
      }
    }
  }
}
