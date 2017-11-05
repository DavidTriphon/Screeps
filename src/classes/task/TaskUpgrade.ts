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
  interface UpgradeTaskMemory extends TaskMemory
  {
    controller: IdentifiableStructure;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("Upgrade")
export class Upgrade extends Task<UpgradeTaskMemory>
{
  // =============================================================================
  //   PUBLIC STATIC
  // =============================================================================

  public static createMemory(controller: IdentifiableStructure): UpgradeTaskMemory
  {
    if (!controller.isConstructed)
    {
      throw new Error("Identifier must be for a structure, not a construction site.");
    }

    return {controller, type: "Upgrade"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: UpgradeTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep)
  {
    const controller = Visibility.identifyStructure(this.memory.controller);

    // get the idea out of its head that there could be multiple controllers
    if (controller instanceof Array)
    {
      throw new Error("IMPOSSIBILITY: CHECK IMPLEMENTTAION:\n" +
        "Visibility claims there is an array of controllers at a single position.");
    }

    // let's check if it actually found the controller
    if (controller instanceof StructureController)
    {
      // try to upgrade the controller
      const result = creep.upgradeController(controller);

      // built a little bit successfully
      if (result === OK)
      {
        const energy = creep.amountOf(RESOURCE_ENERGY);
        const used = creep.getActiveBodyparts(WORK);
        const isEmptyNext = used > energy;

        if (isEmptyNext)
        {
          return TaskResult.DONE;
        }
        else
        {
          return TaskResult.WORKING;
        }
      }

      // controller out of range
      else if (result === ERR_NOT_IN_RANGE)
      {
        creep.moveTo(controller);
        return TaskResult.WORKING;
      }

      // really bad error
      else
      {
        throw new Error("Unexpected result from upgrading " + controller +
          " with " + creep + ": " + result);
      }
    }

    // Apparently the location errored
    else
    {
      switch (controller)
      {
        case Visibility.ERROR.NOT_VISIBLE:
          {
            creep.moveTo(RoomPositionExt.deserialize(this.memory.controller.pos));
            return TaskResult.WORKING;
          }
        default:
          {
            throw new Error(
              "The coontroller data is REALLY BAD. ie. it's not a controller.");
          }
      }
    }
  }
}
