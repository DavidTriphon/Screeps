import {JobHire} from "./JobHire";
import {RoomPositionExt} from "../../prototypes/RoomPosition";
import * as Task from "../task/Module";
import {TaskResult} from "../task/TaskResult";

export class JobMine extends JobHire
{
  // =============================================================================
  //   STATIC VARIABLES
  // =============================================================================

  public static type: string = "JobMine";

  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - mineral
  //   - id : string
  //   - pos : posData
  // - resourceType : RESOURCE_*
  // - idealPos : posData
  // - dropOff
  //   - id : string
  //   - pos : posData
  //   - type : structureType
  //   - isIdeal : bool
  // - creepNames : []
  // - openSpaces : number

  public static create(mineral: Mineral, dropOffStructure: Structure): JobMine
  {
    // make sure the main directory exists.
    if (Memory.JobMine === undefined)
    {
      Memory.JobMine = {};
    }

    // set the id by using the mineral id.
    const id = mineral.id;

    // make sure that the mine job doesn't already exist so you don't overwrite it
    if (this.isJob(id))
    {
      throw new Error("The mining job for the mineral " + mineral.mineralType +
        " in " + mineral.room + " is already defined.");
    }
    // set up local object
    Memory.JobMine[id] = {};

    // set mineral position, id, and resource type
    Memory.JobMine[id].mineral = {id: mineral.id, pos: mineral.pos.serialize()};
    Memory.JobMine[id].resourceType = mineral.mineralType;

    // get adjacent spaces
    const openSpaces = mineral.pos.adjacentSpaces(1, (pos) => (pos.isWalkable()));

    // find the space adjacent to the maximum number of spaces
    const idealSpace = _.max(
      openSpaces,
      (checkSpace) =>
      {
        let adjacents = 0;

        for (const otherSpace of openSpaces)
        {
          if (checkSpace.squareDistanceTo(otherSpace) <= 1)
          {
            adjacents++;
          }
        }

        return adjacents;
      }
    );

    // set the container position
    Memory.JobMine[id].idealPos = idealSpace.serialize();

    // set the number of open spaces, determining the max number of miners
    Memory.JobMine[id].openSpaces = openSpaces.length;

    // set drop off structure position and id
    Memory.JobMine[id].dropOff =
      {id: dropOffStructure.id, pos: dropOffStructure.pos.serialize(), type: dropOffStructure.structureType};

    Memory.JobMine[id].creepNames = [];

    // return the new object.
    return new JobMine(id);
  }

  public static remove(id: string): void
  {
    delete Memory.JobMine[id];
  }

  public static isJob(id: string): boolean
  {
    return (Memory.JobMine[id] !== undefined);
  }

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, JobMine.type);
  }

  // =============================================================================
  //  EXECUTE METHOD
  // =============================================================================

  public execute(): void
  {
    for (const creep of this.getCreeps())
    {
      try
      {
        // creep.say('I\'m a miner!');

        const result = creep.doTask();

        if (result !== TaskResult.NOT_DONE)
        {
          let task = null;

          const carryAmount = creep.carry[this.getMineralType()];

          if (carryAmount instanceof Number && carryAmount >= creep.carryCapacity / 2)
          {
            const dropOffData = this.getDropOffData();
            const sitePos = RoomPositionExt.deserialize(dropOffData.pos);

            // if the id is not specified, this is very bad
            if (dropOffData.id === undefined)
            {
              throw new Error("There is no dropOff id specified.");
            }
            // get the dropOff by the specified id
            const dropOff = Game.getObjectById(dropOffData.id);

            // if the dropOff could not be specified, go towards the position

            if (dropOff !== undefined && dropOff !== null)
            {
              // if the structure is visible
              // try to transfer to it
              task = new Task.transfer(dropOff, this.getMineralType());
            }
            else
            {
              // the item is not visible

              const room = Game.rooms[sitePos.roomName];

              if (room === undefined)
              {
                // give it a move task
                task = new Task.moveToPos(sitePos, 2);
              }
              else
              {
                // it's in the same room and the item is not there, maybe it completed building it?
                const structures = room.lookForAt<Structure>(LOOK_STRUCTURES, sitePos);
                const container =
                  _.find(structures, (struct: Structure) => struct.structureType === STRUCTURE_CONTAINER);

                if (container)
                {
                  this.setDropOffStructure(container);
                }
                else
                {
                  throw new Error("The structure for the id appears to be gone.");
                }
              }
            }
          }
          else
          {
            const mineralData = this.getMineralData();
            const mineral = Game.getObjectById(mineralData.id);

            if (mineral !== undefined)
            {
              // if the mineral is visible
              // try to mine it
              task = new Task.harvest(mineral);
            }
            else
            {
              // else give it a move task
              task = new Task.moveToPos(RoomPositionExt.deserialize(mineralData.pos), 2);
            }
          }

          // set the task and do it once this tick
          creep.setTask(task);
          creep.doTask();
        }

      }
      catch (e)
      {
        console.log("The creep " + creep.name +
          " had an issue when trying to execute for the job " + this._jobType + ".\n" + e.stack);
      }
    }
  }

  // =============================================================================
  //  EMPLOYEE METHODS
  // =============================================================================

  public maxCreeps(): number
  {
    return Memory.JobMine[this._id].openSpaces;
  }

  // =============================================================================
  //  SOURCE / HARVESTER METHODS
  // =============================================================================

  public getMineralData()
  {
    return Memory.JobMine[this._id].mineral;
  }

  public getMineralType(): string
  {
    return Memory.JobMine[this._id].resourceType;
  }

  // =============================================================================
  //  CONTAINER / DROPOFF METHODS
  // =============================================================================

  public getIdealDropPosition(): RoomPosition
  {
    return RoomPositionExt.deserialize(Memory.JobMine[this._id].idealPos);
  }

  public getDropOffData()
  {
    return Memory.JobMine[this._id].dropOff;
  }

  public setDropOffStructure(structure: Structure): void
  {
    Memory.JobMine[this._id].dropOff =
      {id: structure.id, pos: structure.pos.serialize(), type: structure.structureType};
  }

  public isDropOffIdeal(): boolean
  {
    // set the ideal variable if it hasn't been calculated yet
    // (we don't want to have to repeatedly calculate it)
    if (Memory.JobMine[this._id].dropOff.isIdeal === undefined)
    {
      // get position data
      const idealPos = Memory.JobMine[this._id].idealPos;
      const dropOffPos = Memory.JobMine[this._id].dropOff.pos;

      // set isIdeal to if the container position is the same as the dropOff position
      Memory.JobMine[this._id].dropOff.isIdeal = (
        (idealPos === dropOffPos) &&
        (Memory.JobMine[this._id].dropOff.type === STRUCTURE_CONTAINER)
      );
    }

    // return whether the drop off point is at the ideal position
    return Memory.JobMine[this._id].dropOff.isIdeal;
  }
}
