// =============================================================================
//   IMPORTS
// =============================================================================

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface JobMemory
  {
    creeps: string[];
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export abstract class Job
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  // =============================================================================
  //   INSTANCE FIELDS
  // =============================================================================

  protected _id: string;
  protected _jobType: string;
  private _creeps: Creep[];

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string, jobType: string)
  {
    if (Memory.Job[jobType] === undefined)
    {
      Memory.Job[jobType] = {};
    }

    if (Memory.Job[jobType][id] === undefined)
    {
      throw new Error("No " + jobType + " exists with the id: " + id);
    }

    this._id = id;
    this._jobType = jobType;
  }

  // =============================================================================
  //   EMPLOYEE METHODS
  // =============================================================================

  public getCreeps(): Creep[]
  {
    if (this._creeps === undefined)
    {
      // make an array of creeps
      const creeps = [];

      // iterate over all the creep names
      for (const index in Memory.Job[this._jobType][this._id].creeps)
      {
        // get the name
        const name = Memory.Job[this._jobType][this._id].creeps[index];

        // get the creep by name
        const creep = Game.creeps[name];

        // if the creep is gone
        if (creep === undefined)
        {
          // fire it from the list
          Memory.Job[this._jobType][this._id].creeps.splice(Number(index), 1);
        }
        else
        {
          // otherwise, add it to the creep array
          creeps.push(creep);
        }
      }

      this._creeps = creeps;
    }

    // return the array of creeps.
    return this._creeps;
  }

  public hireByName(name: string): void
  {
    const creep: Creep = Game.creeps[name];

    if (creep === undefined)
    {
      throw new Error("There is no creep with the name \"" + name + "\".");
    }

    this.hire(creep);
  }

  public hire(creep: Creep): void
  {
    if (creep === undefined)
    {
      throw new Error("Cannot hire undefined for " + this.toString + ".");
    }

    // check to make sure it isn't already on the employee roster
    if (this.isHired(creep))
    {
      throw new Error("The creep \"" + creep.name +
        "\" is already hired for " + this.toString + ".");
    }

    // erase whatever old task it had.
    creep.memory.task = undefined;

    // push the name onto the list
    Memory.Job[this._jobType][this._id].creeps.push(creep.name);

    // if the creep array is already defined, put it on the array.
    if (this._creeps !== undefined)
    {
      this._creeps.push(creep);
    }
  }

  public fire(creep: Creep): void
  {
    if (creep === undefined)
    {
      throw new Error("Cannot fire undefined for " + this.toString + ".");
    }

    this.fireByName(creep.name);
  }

  public fireByName(name: string): void
  {
    // make sure that it is already hired before trying to fire it.
    const index = Memory.Job[this._jobType][this._id].creeps.indexOf(name);

    // if the index isn't -1, it is in the array.
    if (index > -1)
    {
      // splice out that one position from the array.
      Memory.Job[this._jobType][this._id].creeps.splice(index, 1);

      // if the creep array is already defined, remove it from the array.
      if (this._creeps !== undefined)
      {
        this._creeps.splice(index, 1);
      }
    }
  }

  public isHired(creep: Creep): boolean
  {
    if (creep === undefined)
    {
      return false;
    }

    return this.isHiredByName(creep.name);
  }

  public isHiredByName(name: string): boolean
  {
    return (Memory.Job[this._jobType][this._id].creeps.indexOf(name) !== -1);
  }

  public abstract execute(): void;

  // =============================================================================
  //  OBJECT METHODS
  // =============================================================================

  public toString()
  {
    return "[" + this._jobType + " : " + this._id + "]";
  }
}
