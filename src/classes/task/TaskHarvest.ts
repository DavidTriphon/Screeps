// =============================================================================
//   IMPORTS
// =============================================================================

import {Task} from "./AbstractTask";
import {TaskResult} from "./TaskResult";

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface HarvestTaskData extends TaskData
  {
    source: IdentifiableResource;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

export const TaskHarvest: Task =
  {
    execute(creep: Creep, data: HarvestTaskData): TaskResult
    {
      // if we have no target, checks for the target if we can see it now
      if (this.resource === undefined && this.pos !== undefined)
      {
        this.checkPosition();
      }

      if (this.resource !== undefined)
      {
        const result = creep.harvest(this.resource);

        if (result === ERR_NOT_IN_RANGE)
        {
          creep.moveTo(this.resource);
        }

        const emptySpace = creep.emptySpace();
        const mined = creep.getActiveBodyparts(WORK) *
          (this.isMineral() ? HARVEST_MINERAL_POWER : HARVEST_POWER);
        const isFullNext = ((emptySpace - mined) <= 0);

        if (creep.isFull() || ((result === OK) && isFullNext))
        {
          return TaskResult.DONE;
        }
        else
        {
          return TaskResult.NOT_DONE;
        }
      }
      else if (this.pos !== undefined)
      {
        creep.moveTo(this.pos);

        return TaskResult.NOT_DONE;
      }
      else
      {

      }
    }
  };
