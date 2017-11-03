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
  interface UpgradeTaskData
  {
    controller: IdentifiableStructure;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

export class TaskUpgrade
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static fromMemory(taskData: UpgradeTaskData)
  {
    let room = Game.rooms[taskData.room];

    if (room === undefined)
    {
      return TaskMoveToPos.fromMemory(taskData, 3);
    }
    else
    {
      return new TaskUpgrade(room.controller);
    }
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(controller: StructureController)
  {
    this.controller = controller;
  }

  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================



  toMemory()
  {
    let data =
      {
        type: 'upgrade',
        room: this.controller.room.name,
        pos: this.controller.pos
      };

    return data;
  }

  // =============================================================================
  //  INSTANCE METHODS
  // =============================================================================

  TaskUpgrade.prototype.execute = function(creep)
  {
    let result = creep.upgradeController(this.controller);

    if (result === ERR_NOT_IN_RANGE)
    {
      creep.moveTo(this.controller);
    }

    let energy = creep.carry[RESOURCE_ENERGY];
    let workParts = creep.getActiveBodyparts(WORK);
    let nextEnergy = energy - workParts;
    let isEmptyNext = (nextEnergy <= 0);

    if (creep.isEmptyOf(RESOURCE_ENERGY) || ((result === OK) && (isEmptyNext)))
    {
      return taskResults.DONE;
    }
    else
    {
      return taskResults.NOT_DONE;
    }
  }
}
