import {TaskResult} from "./TaskResult";

export interface Task<TaskData>
{
  execute(creep: Creep, data: TaskData): TaskResult;
}
