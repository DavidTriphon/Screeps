// =============================================================================
//   IMPORTS
// =============================================================================

import {Task} from "./Task";
import {TaskResult} from "./TaskResult";
import * as Visibility from "../../Visibility";
import {RoomPositionExt} from "../../prototypes/RoomPosition";
import {TaskDefinition} from "./TaskDefinition";

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface AttackTaskMemory extends TaskMemory
  {
    target: IdentifiableCreep | IdentifiableStructure;
    isCreep: boolean;
  }
}

// =============================================================================
//   DEFINITION
// =============================================================================

@TaskDefinition("Attack")
export class Attack extends Task<AttackTaskMemory>
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static createMemory(
    target: IdentifiableStructure | IdentifiableCreep,
    isCreep: boolean): AttackTaskMemory
  {
    if (isCreep && (target as IdentifiableCreep).user === undefined)
    {
      throw new Error("target must be a creep if the isCreep flag is set.");
    }

    return {target, isCreep, type: "Attack"};
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(memory: AttackTaskMemory)
  {
    super(memory);
  }

  // =============================================================================
  //   PUBLIC METHODS
  // =============================================================================

  public execute(creep: Creep): TaskResult
  {
    let target = (this.memory.isCreep ?
      Visibility.identifyCreep(this.memory.target as IdentifiableCreep) :
      Visibility.identifyVagueStructure(this.memory.target as IdentifiableStructure));

    // if there's an array, just grab the first element
    if (target instanceof Array)
    {
      target = target[0];
    }

    // attack the target
    if (target instanceof Creep ||
      target instanceof Structure)
    {
      // always move towards the target
      creep.moveTo(target);
      // attack the target
      const result = creep.attack(target);

      // really bad error
      if (result !== OK && result !== ERR_NOT_IN_RANGE)
      {
        throw new Error("Unexpected result from attacking " + target +
          " with " + creep + ": " + result);
      }

      return TaskResult.WORKING;
    }

    // attack a construction site by moving over it.
    else if (target instanceof ConstructionSite)
    {
      creep.moveTo(target);

      return TaskResult.WORKING;
    }

    // Apparently the location errored
    else
    {
      switch (target)
      {
        case Visibility.ERROR.NOT_VISIBLE:
          {
            creep.moveTo(RoomPositionExt.deserialize(this.memory.target.pos));
            return TaskResult.WORKING;
          }
        default:
          {
            throw new Error("The site data is REALLY BAD. ie. it's not a site.");
          }
      }
    }
  }
}
