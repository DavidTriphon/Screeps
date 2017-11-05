// =============================================================================
//   IMPORTS
// =============================================================================

import {TaskResult} from "./TaskResult";

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface TaskMemory
  {
    type: string;
  }
}

// =============================================================================
//   EXPORTS
// =============================================================================

export abstract class Task<M extends TaskMemory>
{
  protected memory: M;

  constructor(memory: M)
  {
    this.memory = memory;
  }

  public abstract execute(creep: Creep): TaskResult;
}
