// =============================================================================
//   IMPORTS
// =============================================================================

import {Task} from "./Task";
import {TaskResult} from "./TaskResult";
import {RoomPositionExt} from "../../prototypes/RoomPosition";
import {TaskDefinition} from "./TaskDefinition";

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface MoveToPosTaskMemory extends TaskMemory
  {
    pos: string;
    range: number;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("MoveToPos")
export class MoveToPos extends Task<MoveToPosTaskMemory>
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static createMemory(pos: string, range: number): MoveToPosTaskMemory
  {
    if (!(RoomPositionExt.deserialize(pos) instanceof RoomPosition))
    {
      throw new Error("Position string must be valid serialized position.");
    }

    return {pos, range, type: "MoveToPos"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: MoveToPosTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep): TaskResult
  {
    // get the position
    const pos = RoomPositionExt.deserialize(this.memory.pos);

    if (pos.squareDistanceTo(creep.pos) <= this.memory.range)
    {
      return TaskResult.DONE;
    }
    else
    {
      creep.moveTo(pos);
      return TaskResult.WORKING;
    }
  }
}
