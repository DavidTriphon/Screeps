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
  interface TransferTaskData
  {
    dropOff: IdentifiableStructure;
    resourceType: string;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

export const TaskTransfer: Task<TransferTaskData> =
  {
    execute(creep: Creep, taskData: TransferTaskData): TaskResult
    {
      if (this.structure.energy !== undefined ?
        (this.structure.energy === this.structure.energyCapacity) :
        (this.structure.store[RESOURCE_ENERGY] === this.structure.storeCapacity)
      )
      {
        return TaskResult.DONE;
      }

      let result = creep.transfer(this.structure, this.resource);

      if (result === ERR_NOT_IN_RANGE)
      {
        creep.moveTo(this.structure);
      }
      else if (result !== OK)
      {
        return TaskResult.INCAPABLE;
      }

      if (creep.isEmpty() || (result === OK))
      {
        return TaskResult.DONE;
      }
      else
      {
        return TaskResult.NOT_DONE;
      }
    }
  };
