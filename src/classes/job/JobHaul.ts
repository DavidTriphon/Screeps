// =============================================================================
//   IMPORTS
// =============================================================================

import {Job} from "./Job";
import {RoomPositionExt} from "../../prototypes/RoomPosition";
import * as Task from "../task/Module";
import {TaskResult} from "../task/TaskResult";
import {JobDefinition} from "./JobDefinition";

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface JobHaulMemory extends JobMemory
  {
    dropOff: IdentifiableStructure;
    pickUp: IdentifiableStructure;
    rate: number;
    resourceType: ResourceConstant;
    pPath?: string;
    dPath?: string;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

@JobDefinition("Haul")
export class JobHaul extends Job
{
  // =============================================================================
  //   STATIC MEMORY METHODS
  // =============================================================================

  public static create(pickUpStructure: Structure, dropOffStructure: Structure,
    resourceType: ResourceConstant = RESOURCE_ENERGY, rate: number = Infinity)
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

    // set the id by using the pickUp and dropOff id and resourceType.
    const id = pickUpStructure.id + dropOffStructure.id + resourceType;

    // make sure the directory exists.
    if (Memory.Job.Haul === undefined)
    {
      Memory.Job.Haul = {};
    }

    // make sure that the haul job doesn't already exist so you don't overwrite it
    if (this.isJob(id))
    {
      throw new Error("The hauler for this pickUp and dropOff is already defined.");
    }

    // create object memory
    Memory.Job.Haul[id] = {
      pickUp: pickUpStructure.identifier(),
      dropOff: dropOffStructure.identifier(),
      rate,
      resourceType,
      creeps: []
    };

    // return the new object.
    return new JobHaul(id);
  }

  public static remove(id: string)
  {
    delete Memory.Job.Haul[id];
  }

  public static isJob(id: string)
  {
    return (Memory.Job.Haul[id] !== undefined);
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "Haul");
  }

  public get(id: string): Job
  {
    return new JobHaul(id);
  }

  // =============================================================================
  //   INSTANCE MEMORY METHODS
  // =============================================================================

  public reassign(pickUpStructure: Structure, dropOffStructure: Structure,
    resource: ResourceConstant, rate: number): void
  {
    const newJob = JobHaul.create(pickUpStructure, dropOffStructure, resource, rate);

    for (const creep of this.getCreeps())
    {
      this.fire(creep);
      newJob.hire(creep);
    }

    // gets rid of the old object memory and
    // turns this one into the new one by changing the key
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
      const result = creep.doTask();

      if (result !== TaskResult.WORKING)
      {
        // set the task and do it once this tick
        if (creep.emptySpace() <= creep.carryCapacity / 2)
        {
          creep.setTask(this.getTransferTaskMemory());
        }
        else
        {
          creep.setTask(this.getWithdrawTaskMemory());
        }

        creep.doTask();
      }
    }
  }

  // =============================================================================
  //  PICKUP / DROPOFF METHODS
  // =============================================================================

  // TASK METHODS

  private getWithdrawTaskMemory(): WithdrawTaskMemory
  {
    return Task.Withdraw.createMemory(this.rawData().pickUp, this.rawData().resourceType);
  }

  private getTransferTaskMemory(): TransferTaskMemory
  {
    return Task.Transfer.createMemory(
      this.rawData().dropOff, this.rawData().resourceType);
  }

  // ACCESSOR METHODS

  public getResourceType(): string
  {
    return this.rawData().resourceType;
  }

  public getDropOffData(): IdentifiableStructure
  {
    return this.rawData().dropOff;
  }

  public getPickUpData(): IdentifiableStructure
  {
    return this.rawData().pickUp;
  }

  // PATH METHODS

  public generatePaths(): ScreepsReturnCode
  {
    const dropOffPosition = RoomPositionExt.deserialize(this.getDropOffData().pos);
    const pickUpPosition = RoomPositionExt.deserialize(this.getPickUpData().pos);

    // wtf is this all supposed to do?
    // I got rid of the syntax errors but I'm pretty sure I developed useless behavior

    const options: PathFinderOpts = {
      roomCallback: (roomName: string) =>
      {
        const costMatrix = new PathFinder.CostMatrix();

        const room: Room | undefined = Game.rooms[roomName];

        for (let x = 0; x < 50; x++)
        {
          for (let y = 0; x < 50; y++)
          {
            let isRoad = false;

            if (room)
            {
              const structures = room.lookForAt<Structure>(LOOK_STRUCTURES, x, y);

              // searches structures for a structure that is a road
              let index = 0;
              while (isRoad === false && index < structures.length)
              {
                const structure = structures[index++];

                if (structure.structureType === STRUCTURE_ROAD)
                {
                  isRoad = true;
                }
              }
            }

            let cost;

            if (isRoad)
            {
              cost = 1;
            }
            else
            {
              const terrain = Game.map.getTerrainAt(x, y, roomName);

              cost = (terrain === "swamp" ? 10 : (terrain === "plain" ? 1 : 255));
            }

            costMatrix.set(x, y, cost);
          }
        }

        return costMatrix;
      }
    };

    const finderPathWrapper = PathFinder.search(pickUpPosition, dropOffPosition, options);

    if (finderPathWrapper.incomplete)
    {
      // can't generate the path
      return ERR_NO_PATH;
    }

    // take off the first and last positions of the path.
    const roomPosPath = finderPathWrapper.path;
    roomPosPath.pop();
    roomPosPath.shift();

    const dPath: PathStep[] = [];
    const pPath: PathStep[] = [];

    let previousPos: RoomPosition | undefined;

    for (const pos of roomPosPath)
    {
      if (previousPos)
      {
        // get difference in x and y between positions
        const dx = pos.x - previousPos.x;
        const dy = pos.y - previousPos.y;
        const dir = this.getDirectionFromOffset(dx, dy);
        const opDir = this.getDirectionFromOffset(dx, dy);

        // to convince the ts checker that they aren't 0.
        if (dir === 0 || opDir === 0)
        {
          return ERR_NO_PATH;
        }

        // current position, going from last position
        const pStep: PathStep = {
          x: pos.x,
          y: pos.y,
          dx,
          dy,
          direction: dir
        };

        // last position, going from current position
        const dStep: PathStep = {
          x: previousPos.x,
          y: previousPos.y,
          dx: -dx,
          dy: -dy,
          direction: opDir
        };

        // add steps to each array
        pPath.push(pStep); // insert at end
        dPath.unshift(dStep); // insert at front (going backwards)
      }

      previousPos = pos;
    }

    // serialize paths into memory
    Memory.Job.Haul[this._id].dPath = Room.serializePath(dPath);
    Memory.Job.Haul[this._id].pPath = Room.serializePath(pPath);

    // everything went ok!
    return OK;
  }

  public getPathFromDropOff(): PathStep[] | undefined
  {
    const path = this.rawData().dPath;

    if (path)
    {
      return Room.deserializePath(path);
    }

    return undefined;
  }

  public getPathFromPickUp(): PathStep[] | undefined
  {
    const path = this.rawData().pPath;

    if (path)
    {
      return Room.deserializePath(path);
    }

    return undefined;
  }

  private rawData(): JobHaulMemory
  {
    return Memory.Job.Haul[this._id];
  }

  private getDirectionFromOffset(dx: number, dy: number): DirectionConstant | 0
  {
    const directions: (DirectionConstant | 0)[][] = [
      [TOP_LEFT, TOP, TOP_RIGHT],
      [LEFT, 0, RIGHT],
      [BOTTOM_LEFT, BOTTOM, BOTTOM_RIGHT]];

    return directions[1 + dy][1 + dx];
  }
}
