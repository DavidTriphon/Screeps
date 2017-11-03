import {Task as AbstractTask} from "./AbstractTask";

import {TaskHarvest as Harvest} from "./TaskHarvest";
import {TaskBuild as Build} from "./TaskBuild";
import {TaskTransfer as Transfer} from "./TaskTransfer";
import {TaskWithdraw as Withdraw} from "./TaskWithdraw";
import {TaskUpgrade as Upgrade} from "./TaskUpgrade";
// export {TaskAttack as Attack} from "./TaskAttack";
// export {TaskPickUp as PickUp} from "./TaskPickUp";
// export {TaskRepair as Repair} from "./TaskRepair";
// export {TaskReserve as Reserve} from "./TaskReserve";
// export {TaskMoveToPos as MoveToPos} from "./TaskMoveToPos";

const Task: ITaskList = {
  Harvest,
  Build,
  Transfer,
  Withdraw,
  Upgrade
};

export = Task;

interface ITaskList
{
  [type: string]: AbstractTask;
}
