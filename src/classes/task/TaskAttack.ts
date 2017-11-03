// =============================================================================
//   IMPORTS
// =============================================================================

import {Task} from "./AbstractTask";
import {TaskResult} from "./TaskResult";
import {RoomPositionExt} from "../../prototypes/RoomPosition";

// =============================================================================
//   DEFINITION
// =============================================================================

export const TaskAttack: Task<AttackTaskData> = {
  execute(creep: Creep, data: AttackTaskData): TaskResult
  {
    const target: Creep | Structure | null =
      Game.getObjectById<Creep | Structure>(data.target.id);

    if (target !== null)
    {
      // try to attack the target
      creep.attack(target);

      // make sure you chase it if it runs.
      creep.moveTo(target);

      return TaskResult.NOT_DONE;
    }

    const pos = RoomPositionExt.deserialize(data.target.pos);

    if (Game.rooms[pos.roomName] === undefined)
    {
      return TaskResult.DONE;
    }
    else
    {
      return TaskResult.NOT_DONE;
    }
  }
};
