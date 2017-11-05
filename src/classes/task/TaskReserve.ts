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
  interface ReserveTaskMemory extends TaskMemory
  {
    controller: IdentifiableStructure;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("Reserve")
export class Reserve extends Task<ReserveTaskMemory>
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static createMemory(controller: IdentifiableStructure): ReserveTaskMemory
  {
    if (!controller.isConstructed)
    {
      throw new Error("Identifier must be for a structure, not a construction site.");
    }

    return {controller, type: "Reserve"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: ReserveTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep): TaskResult
  {
    const controller = Visibility.identifyStructure(this.memory.controller);

    // get the idea out of its head that there could be multiple controllers
    if (controller instanceof Array)
    {
      throw new Error("IMPOSSIBILITY: CHECK IMPLEMENTTAION:\n" +
        "Visibility claims there is an array of structures at a single position.");
    }

    // let's check if it actually found the controller
    if (controller instanceof StructureController)
    {
      // try to reserve the controller
      const result = creep.reserveController(controller);

      // reserved the controller
      if (result === OK)
      {
        // WORKING, ALWAYS WORKING!
        return TaskResult.WORKING;
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
        throw new Error("Unexpected result from reserving " + controller +
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
              "The controller data is REALLY BAD. ie. it's not a controller.");
          }
      }
    }
  }
}
