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

export class JobHarvest extends JobHire
{
  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - source: IdentifiableResource
  // - dropOff: IdentifiableStructure | IdentifiableConstructionSite
  // - isBuilding: bool
  // - idealContainerPos: string
  // - idealLinkPos: string
  // - adjacentSpaces: number
  // - creepNames : []

  public static create(source: Source, dropOff: Structure | ConstructionSite): JobHarvest
  {
    // make sure the main directory exists.
    if (Memory.Job.Harvest === undefined)
    {
      Memory.Job.Harvest = {};
    }

    // set the id by using the source id.
    const id = source.id;

    // make sure that the harvest job doesn"t already exist so you don"t overwrite it
    if (this.isJob(id))
    {
      throw new Error("The harvester for this source is already defined.");
    }

    // get adjacent spaces
    const adjacentSpaces1: RoomPosition[] =
      source.pos.adjacentSpaces(1, (pos: RoomPosition) => (pos.isWalkable()));
    const adjacentSpaces2: RoomPosition[] =
      source.pos.adjacentSpaces(2, (pos: RoomPosition) => (pos.isWalkable()));

    // find the space adjacent to the maximum number of spaces
    const idealContainerPosition = _.max(
      adjacentSpaces1,
      (checkSpace) =>
      {
        let adjacentCount = 0;

        for (const otherSpace of adjacentSpaces1)
        {
          if (checkSpace.squareDistanceTo(otherSpace) <= 1)
          {
            adjacentCount++;
          }
        }

        return adjacentCount;
      }
    );

    // find the space adjacent to the maximum number of spaces
    // without being in the spaces (unless necessary)
    const idealLinkPosition = _.max(
      adjacentSpaces2,
      (checkSpace) =>
      {
        let adjacentCount = 0;

        for (const otherSpace of adjacentSpaces1)
        {
          if (checkSpace.squareDistanceTo(otherSpace) === 1)
          {
            adjacentCount++;
          }
        }

        return adjacentCount;
      }
    );

    // create the data structure for this new element in memory
    const data: JobHarvestData = {
      source: source.identifier(),
      dropOff: dropOff.identifier(),
      idealContainerPos: idealContainerPosition.serialize(),
      idealLinkPos: idealLinkPosition.serialize(),
      adjacentSpaces: adjacentSpaces1.length,
      creeps: []
    };

    Memory.Job.Harvest[id] = data;

    // return the new object.
    return new JobHarvest(id);
  }

  public static remove(id: string)
  {
    delete Memory.Job.Harvest[id];
  }

  public static isJob(id: string)
  {
    return (Memory.Job.Harvest[id] !== undefined);
  }

  // =============================================================================
  //   INSTANCE FIELDS
  // =============================================================================

  private isIdeal: boolean;

  private dropOffStructure: Structure | ConstructionSite | IdentifiableStructure;
  private source: Source | IdentifiableResource;

  private dropOffData: TransferTaskData | BuildTaskData;
  private harvestTaskData: HarvestTaskData;

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "JobHarvest");
  }

  // =============================================================================
  //   EXECUTE METHOD
  // =============================================================================

  public execute(): void
  {
    for (const creep of this.getCreeps())
    {
      try
      {
        // creep.say("I'm a harvester!");

        const result = creep.doTask();

        if (result !== TaskResult.NOT_DONE)
        {
          let task = null;
          const energy = (creep.carry.energy === undefined ? 0 : creep.carry.energy);

          if (energy >= creep.carryCapacity / 2)
          {
            const dropOffData = this.getDropOffData();
            const sitePos = RoomPositionExt.deserialize(dropOffData.pos);

            if (dropOffData.id === undefined)
            {
              // the only case in which the id is not specified is when
              //   the ideal container site has recently been created.
              // search for it and assign it's id.

              const room = Game.rooms[sitePos.roomName];

              if (room !== undefined)
              {
                const sites =
                  room.lookForAt<ConstructionSite>(LOOK_CONSTRUCTION_SITES, sitePos);

                if (sites.length === 0)
                {
                  throw new Error(
                    "There is no dropOff id specified and there is not " +
                    "a construction site at the ideal location.");
                }
                // get the site at that position
                const site = sites[0];
                // assign it's id
                this.rawData().dropOff.id = site.id;
              }
            }

            // get the dropOff if the id is specified
            let dropOff;

            if (dropOffData.id !== undefined)
            {
              dropOff = Game.getObjectById(dropOffData.id);
            }
            // if the dropOff could not be specified, go towards the position

            if (dropOff !== undefined && dropOff !== null)
            {
              // if the structure is visible

              if (dropOffData.isBuilding)
              {
                // is being constructed

                task = new Task.Build(dropOff);
              }
              else
              {
                // is already built

                if (dropOff.hits < dropOff.hitsMax)
                {
                  // if the dump structure is damaged
                  // try to repair it
                  task = new Task.Repair(dropOff);
                }
                else
                {
                  // try to transfer to it
                  task = new Task.Transfer(dropOff);
                }
              }
            }
            else
            {
              // the item is not visible

              const room = Game.rooms[sitePos.roomName];

              if (room === undefined)
              {
                // give it a move task
                task = new Task.MoveToPos(sitePos, 2);
              }
              else
              {
                // it's in the same room and the item is not there,
                // maybe it completed building it?
                const structures =
                  room.lookForAt<Structure>(LOOK_STRUCTURES, sitePos);
                const container = _.find(structures,
                  (struct) => struct.structureType ===
                    STRUCTURE_CONTAINER) as StructureContainer;

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
            const sourceData = this.getSourceData();

            const source = Game.getObjectById<Source>(sourceData.id);

            if (source !== null)
            {
              // if the source is visible
              // try to harvest it
              task = new Task.Harvest(source);
            }
            else
            {
              // else give it a move task
              task = new Task.MoveToPos(RoomPositionExt.deserialize(sourceData.pos), 2);
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
          " had an issue when trying to execute for the job " +
          this._jobType + ".\n" + e.stack);
      }
    }
  }

  // =============================================================================
  //   INSTANCE METHODS
  // =============================================================================

  // EMPLOYEE METHODS

  public maxCreeps(): number
  {
    return this.rawData().adjacentSpaces;
  }

  // SOURCE / HARVESTER METHODS

  public getSourceData()
  {
    return this.rawData().source;
  }

  // DROPOFF METHODS

  public getIdealDropPosition(): RoomPosition
  {
    return RoomPositionExt.deserialize(this.rawData().idealPos);
  }

  public getDropOffData()
  {
    return this.rawData().dropOff;
  }

  public setDropOffStructure(structure: Structure): void
  {
    this.rawData().dropOff = {
      id: structure.id,
      pos: structure.pos.serialize(),
      type: structure.structureType
    };
  }

  public isDropOffIdeal(): boolean
  {
    // set the ideal variable if it hasn't been calculated yet
    // (we don't want to have to repeatedly calculate it)
    if (this.rawData().dropOff.isIdeal === undefined)
    {
      // get position data
      const idealPos = this.rawData().idealPos;
      const dropOffPos = this.rawData().dropOff.pos;

      // set isIdeal to if the container position is the same as the dropOff position
      this.rawData().dropOff.isIdeal = (
        (idealPos === dropOffPos) &&
        (this.rawData().dropOff.type === STRUCTURE_CONTAINER)
      );
    }

    // return whether the drop off point is at the ideal position
    return this.rawData().dropOff.isIdeal;
  }

  public setIdealDropOff(): void
  {
    // get the ideal container position and room
    const idealPos = RoomPositionExt.deserialize(this.rawData().idealPos);
    const room = Game.rooms[idealPos.roomName];

    // make sure the room is visible before proceeding.
    if (room === undefined)
    {
      throw new Error(
        "The ideal container cannot be created because the room is not visible.");
    }
    // get the result from creating the construction site.
    const result = room.createConstructionSite(idealPos, STRUCTURE_CONTAINER);

    // based on which error was recieved or if it succeeded,
    // set the dropOffContainer and build flags
    switch (result)
    {
      case ERR_INVALID_TARGET:
        if (idealPos.isWalkable())
        {
          // there is another construction site or building here that is blocking the way.
          // hopefully it"s not a building and just a path or an already placed container.

          // try to find any construction sites at that position
          const sites = room.lookForAt<ConstructionSite>(
            LOOK_CONSTRUCTION_SITES, idealPos);

          if (sites.length > 0)
          {
            // there is a site in the way here

            // check if the site is a container or a road
            const site = sites[0];

            if (site.structureType === STRUCTURE_ROAD ||
              site.structureType === STRUCTURE_CONTAINER)
            {
              // a road is fine, just keep working on that, and then build the container
              this.rawData().dropOff = {
                id: site.id,
                pos: site.pos.serialize(),
                structureType: site.structureType,
                isBuilding: true
              };
            }
            else
            {
              // it isn't fine to build anything else here.
              // There must have been a really bad screw up.
              throw new Error(
                "There is an obstructing building being built at the ideal position");
            }
          }
          else
          {
            // there is not a site, there is a building here in the way.

            // check if the building is a container, we might be done!
            const structures = room.lookForAt<Structure>(LOOK_STRUCTURES, idealPos);

            const container = _.find(
              structures,
              (struct) => (struct.structureType === STRUCTURE_CONTAINER)
            ) as StructureContainer;

            // check the structures for a structure that is a container
            if (container !== undefined)
            {
              // there is a container here!
              // we've already built it (or someone else did ;) )
              this.rawData().dropOff = {
                id: container.id,
                pos: this.rawData().idealPos,
                type: STRUCTURE_CONTAINER
              };
            }
            else
            {
              // there is not a container here, and a structure blocks it being built
              throw new Error(
                "There is a building in the way of the ideal container position.");
            }
          }
        }
        else
        {
          // the ideal position for a container is corrupt,
          // because there is a solid unbreakable wall here.
          throw new Error(
            "The ideal position for the container is corrupt. " +
            "There is a solid wall here.");
        }
        break;
      case ERR_FULL:
        // there are too many construction sites right now.
        throw new Error(
          "There are too many construction sites to be able to place a new one.");
      case ERR_INVALID_ARGS:
        // the location is not a location, I don't think this should happen.
        throw new Error("Somehow the ideal position is not a position object.");
      case ERR_RCL_NOT_ENOUGH:
        // there are too many containers in this room already. How did this happen?
        throw new Error(
          "There are too many containers in this room for the current RCL.");
      case OK:
        // set the drop off point without the id specified, we can check that next tick.
        this.rawData().dropOff = {
          pos: this.rawData().idealPos,
          structureType: STRUCTURE_CONTAINER
        };
    }
  }

  // =============================================================================
  //   PRIVATE METHODS
  // =============================================================================

  private rawData(): JobHarvestData
  {
    return Memory.Job.Harvest[this._id];
  }
}
