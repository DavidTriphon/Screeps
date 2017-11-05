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
  interface PickUpTaskMemory extends TaskMemory
  {
    resource: IdentifiableResource;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("PickUp")
export class PickUp extends Task<PickUpTaskMemory>
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static createMemory(resource: IdentifiableResource): PickUpTaskMemory
  {
    if (resource.isRenewable)
    {
      throw new Error("Identifier must be for a resource, not a source or mineral.");
    }

    return {resource, type: "PickUp"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: PickUpTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep): TaskResult
  {
    let resource = Visibility.identifyResource(this.memory.resource);

    // multiple resources in the same position are actually really common,
    // so grab any of them
    if (resource instanceof Array)
    {
      resource = resource[0];
    }

    // let's check if it actually found the resource
    if (resource instanceof Resource)
    {
      // try to pick up the resource
      const result = creep.pickup(resource);

      // picked up successfully
      if (result === OK)
      {
        return TaskResult.DONE;
      }

      // resource out of range
      else if (result === ERR_NOT_IN_RANGE)
      {
        creep.moveTo(resource);
        return TaskResult.WORKING;
      }

      // really bad error
      else
      {
        throw new Error("Unexpected result from picking up " + resource +
          " with " + creep + ": " + result);
      }
    }

    // Apparently the resource errored
    else
    {
      switch (resource)
      {
        case Visibility.ERROR.NOT_VISIBLE:
          {
            creep.moveTo(RoomPositionExt.deserialize(this.memory.resource.pos));
            return TaskResult.WORKING;
          }
        default:
          {
            throw new Error("The resource data is REALLY BAD. ie. it's not a resource.");
          }
      }
    }
  }
}
