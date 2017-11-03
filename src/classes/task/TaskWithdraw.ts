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
  interface WithdrawTaskData
  {
    pickUp: IdentifiableStructure;
    resourceType: string;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

export const TaskWithdraw: Task<WithdrawTaskData> = {
  execute(creep: Creep, taskData: WithdrawTaskData): TaskResult
  {
    if (this.structure === undefined)
    {
      return TaskResult.INCAPABLE;
    }

    if (this.resource === RESOURCE_ENERGY)
    {
      if ((this.structure.energy !== undefined && this.structure.energy === 0) ||
        this.structure.store !== undefined && this.structure.store[this.resource] === 0)
      {
        return TaskResult.DONE;
      }
    } else
    {
      if (this.structure.store !== undefined && this.structure.store[this.resource] === 0)
      {
        return TaskResult.DONE;
      }
    }

    let result = creep.withdraw(this.structure, this.resource);

    if (result === ERR_NOT_IN_RANGE)
    {
      creep.moveTo(this.structure);
    } else if (result !== OK)
    {
      return TaskResult.INCAPABLE;
    }

    if (creep.isFull() || (result === OK))
    {
      return TaskResult.DONE;
    } else
    {
      return TaskResult.NOT_DONE;
    }
  }
};
