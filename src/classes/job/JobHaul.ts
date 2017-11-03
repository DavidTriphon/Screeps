// =============================================================================
//   IMPORTS
// =============================================================================

import {JobHire} from "./JobHire";
import {RoomPositionExt} from "../../prototypes/RoomPosition";
import * as Task from "../task/Module";
import {TaskResult} from "../task/TaskResult";

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class JobHaul extends JobHire
{
  // =============================================================================
  //   STATIC MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - resource : RESOURCE_*
  // - rate : number
  // - path : [posData]
  // - pickUp
  //   - id : string
  //   - pos : posData
  // - dropOff
  //   - id : string
  //   - pos : posData
  // - creepNames : [string]

  public static create(pickUpStructure: Structure, dropOffStructure: Structure,
    resourceType: string = RESOURCE_ENERGY, rate: number = Infinity)
  {
    // make sure the resource is a defined resource type, defaults to energy
    if (RESOURCES_ALL.indexOf(resourceType) < 0)
    {
      throw new Error(
        "The resource supplied was not a specified resource constant:\n- resource: " +
        JSON.stringify(resourceType));
    }
    // make sure rate is a number, or if it is undefined, define it as Infinity.
    // this means you can hire as many creeps as possible, and they will
    // just haul as fast as they can.
    if (rate < 0)
    {
      throw new Error("The rate must be a positive number:\n- rate: " +
        JSON.stringify(rate));
    }
    // set the id by using the pickUp id.
    const id = pickUpStructure.id + dropOffStructure.id + resourceType;

    // make sure the directory exists.
    if (Memory.JobHaul === undefined)
    {
      Memory.JobHaul = {};
    }

    // make sure that the haul job doesn't already exist so you don't overwrite it
    if (this.isJob(id))
    {
      throw new Error("The hauler for this pickUp and dropOff is already defined.");
    }
    // set up local object
    Memory.JobHaul[id] = {};

    // set the pick up and drop off memory
    Memory.JobHaul[id].pickUp =
      {id: pickUpStructure.id, pos: pickUpStructure.pos.serialize()};
    Memory.JobHaul[id].dropOff =
      {id: dropOffStructure.id, pos: dropOffStructure.pos.serialize()};

    // set the max rate that the resource can flow, and the resource type
    Memory.JobHaul[id].rate = rate;
    Memory.JobHaul[id].resource = resourceType;

    // set up creep employee array
    Memory.JobHaul[id].creepNames = [];

    // return the new object.
    return new JobHaul(id);
  }

  public static remove(id: string)
  {
    delete Memory.JobHaul[id];
  }

  public static isJob(id: string)
  {
    return (Memory.JobHaul[id] !== undefined);
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "JobHaul");
  }

  // =============================================================================
  //   INSTANCE MEMORY METHODS
  // =============================================================================

  public reassign(pickUpStructure: Structure, dropOffStructure: Structure,
    resource: string, rate: number): void
  {
    const newJob = JobHaul.create(pickUpStructure, dropOffStructure, resource, rate);

    for (const creep of this.getCreeps())
    {
      newJob.hire(creep);
    }

    JobHaul.remove(this._id);

    this._id = newJob._id;
  }

  // =============================================================================
  //   EXECUTE METHOD
  // =============================================================================

  public execute()
  {
    for (const creep of this.getCreeps())
    {
      // creep.say('I\'m a hauler!');

      const result = creep.doTask();

      if (result !== TaskResult.NOT_DONE)
      {
        let task = null;
        let resourceAmount = creep.carry[this.getResourceType()];
        resourceAmount = (resourceAmount === undefined ? 0 : resourceAmount);

        if (resourceAmount >= creep.carryCapacity / 2)
        {
          const dropOffData = this.getDropOffData();

          const dropOff = Game.getObjectById(dropOffData.id);

          if (dropOff !== undefined)
          {
            // if the structure is visible
            // try to transfer to it
            task = new Task.Transfer(dropOff, this.getResourceType());
          }
          else
          {
            // else give it a move task
            task = new Task.MoveToPos(RoomPositionExt.deserialize(dropOffData.pos), 2);
          }
        }
        else
        {
          const pickUpData = this.getPickUpData();

          const pickUp = Game.getObjectById(pickUpData.id);

          if (pickUp !== undefined)
          {
            // if the structure is visible
            // try to transfer to it
            task = new Task.Withdraw(pickUp, this.getResourceType());
          }
          else
          {
            // else give it a move task
            task = new Task.MoveToPos(RoomPositionExt.deserialize(pickUpData.pos), 2);
          }
        }

        // set the task and do it once this tick
        creep.setTask(task);
        creep.doTask();
      }
    }
  }

  // =============================================================================
  //  PICKUP / DROPOFF METHODS
  // =============================================================================

  public getResourceType(): string
  {
    return Memory.JobHaul[this._id].resource;
  }

  public getDropOffData()
  {
    return Memory.JobHaul[this._id].dropOff;
  }

  public getPickUpData()
  {
    return Memory.JobHaul[this._id].pickUp;
  }

  // TODO: Fix all these paths methods.
  // I assume that I must've been working on optimizing pathing
  // DO NOT USE THIS METHOD

  public getPathPositions()
  {
    if (Memory.JobHaul[this._id].path === undefined)
    {
      const dropOffPosition = RoomPositionExt.deserialize(this.getDropOffData().pos);
      const pickUpPosition = RoomPositionExt.deserialize(this.getPickUpData().pos);

      // wtf is this all supposed to do?
      // I got rid of the syntax errors but I'm prettu sure I developed useless behavior

      const options: PathFinderOpts =
        {
          roomCallback: (roomName: string) =>
          {
            const costMatrix = new PathFinder.CostMatrix();

            for (let x = 0; x < 50; x++)
            {
              for (let y = 0; x < 50; y++)
              {
                const terrain = Game.map.getTerrainAt(x, y, roomName);

                const cost = (terrain === "swamp" ? 2 : (terrain === "wall" ? 0 : 1));

                costMatrix.set(x, y, cost);
                throw Error("NDY");
              }
            }

            return costMatrix;
          }
        };

      const path = PathFinder.search(pickUpPosition,
        [{pos: dropOffPosition, range: 3}], options);

      Memory.JobHaul[this._id].path = path;
    }

    return Memory.JobHaul[this._id].path;
  }

  public getPathToDropOff(): PathStep[]
  {
    throw Error("NDY");
  }

  public getPathToPickUp(): PathStep[]
  {
    throw Error("NDY");
  }
}
