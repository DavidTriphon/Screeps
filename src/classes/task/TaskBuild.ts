// =============================================================================
//   IMPORTS
// =============================================================================

import {Task} from "./AbstractTask";
import {TaskResult} from "./TaskResult";
import {RoomPositionExt} from "../../prototypes/RoomPosition";

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface BuildTaskData
  {
    site: IdentifiableStructure;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

export const TaskBuild: Task<BuildTaskData> = {
  execute(creep: Creep, data: BuildTaskData): TaskResult
  {
    const energy = (creep.carry.energy === undefined ? 0 : creep.carry.energy);

    if (energy === 0)
    {
      return TaskResult.INCAPABLE;
    }

    const site: ConstructionSite | null =
      Game.getObjectById<ConstructionSite>(data.site.id);

    if (site !== null)
    {
      // get the result from building the site
      const result = creep.build(site);

      // move if not in range
      if (result === ERR_NOT_IN_RANGE)
      {
        creep.moveTo(site);

        return TaskResult.NOT_DONE;
      }

      const used = creep.getActiveBodyparts(WORK) * BUILD_POWER;
      const willBeEmpty = ((energy - used) <= 0);

      // stop if the creep is empty now
      if (willBeEmpty)
      {
        return TaskResult.INCAPABLE;
      }

      return TaskResult.NOT_DONE;
    }

    const pos = RoomPositionExt.deserialize(data.site.pos);

    if (Game.rooms[pos.roomName] !== undefined)
    {
      return TaskResult.IMPOSSIBLE;
    }

    creep.moveTo(pos);

    return TaskResult.NOT_DONE;
  }
};
