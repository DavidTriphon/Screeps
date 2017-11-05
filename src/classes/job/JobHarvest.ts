// =============================================================================
//   IMPORTS
// =============================================================================

import {Job} from "./Job";
import {JobDefinition} from "./JobDefinition";

import * as Task from "../task/Module";
import {TaskResult} from "../task/TaskResult";

import {RoomPositionExt} from "../../prototypes/RoomPosition";

import * as Visibility from "../..//Visibility";

// =============================================================================
//   INTERFACES
// =============================================================================

declare global
{
  interface JobHarvestMemory extends JobMemory
  {
    source: IdentifiableResource;
    dropOff: IdentifiableStructure;
    contPos: string;
    linkPos: string;
    adjacentSpaces: number;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

@JobDefinition("Harvest")
export class JobHarvest extends Job
{
  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================

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
    const data: JobHarvestMemory = {
      source: source.identifier(),
      dropOff: dropOff.identifier(),
      contPos: idealContainerPosition.serialize(),
      linkPos: idealLinkPosition.serialize(),
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

  private dropOffMemory: TransferTaskMemory | BuildTaskMemory | RepairTaskMemory;
  private harvestTaskMemory: HarvestTaskMemory;

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(id: string)
  {
    super(id, "Harvest");
  }

  public get(id: string): Job
  {
    return new JobHarvest(id);
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
        const result = creep.doTask();

        if (result !== TaskResult.WORKING)
        {
          if (creep.amountOf(RESOURCE_ENERGY) >= creep.carryCapacity / 2)
          {
            creep.setTask(this.getDropOffTaskMemory());
          }
          else
          {
            creep.setTask(this.getHarvestTaskMemory());
          }

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

  // TASK METHODS

  private getHarvestTaskMemory(): HarvestTaskMemory
  {
    if (this.harvestTaskMemory === undefined)
    {
      this.harvestTaskMemory = Task.Harvest.createMemory(this.rawData().source);
    }
    return this.harvestTaskMemory;
  }

  private getDropOffTaskMemory():
    TransferTaskMemory | BuildTaskMemory | RepairTaskMemory | MoveToPosTaskMemory
  {
    if (this.dropOffMemory === undefined)
    {
      let task: TransferTaskMemory | BuildTaskMemory |
        RepairTaskMemory | MoveToPosTaskMemory;
      let dropOffData = this.getDropOffData();
      let dropOff = Visibility.identifyVagueStructure(dropOffData);

      if (dropOff instanceof Array)
      {
        let selected: ConstructionSite | Structure | undefined;

        for (const site of dropOff)
        {
          if (site.structureType === STRUCTURE_CONTAINER ||
            site.structureType === STRUCTURE_STORAGE ||
            site.structureType === STRUCTURE_SPAWN ||
            site.structureType === STRUCTURE_EXTENSION ||
            site.structureType === STRUCTURE_LINK)
          {
            selected = site;
          }
        }

        if (selected === undefined)
        {
          throw new Error(
            "Non-transferrable structure is selected as the dropOff point.");
        }

        dropOff = selected;

        // reassign memory to an object by id to prevent confusion in the future.
        this.setDropOffStructure(dropOff);
        dropOffData = this.getDropOffData();
      }

      // check if the dropOff is a structure
      if (dropOff instanceof Structure)
      {
        if (dropOff.hits < dropOff.hitsMax)
        {
          task = Task.Repair.createMemory(dropOffData);
        }
        else
        {
          task = Task.Transfer.createMemory(dropOffData, RESOURCE_ENERGY);
        }
      }

      // check if the dropOff is a construction site
      else if (dropOff instanceof ConstructionSite)
      {
        task = Task.Build.createMemory(dropOffData);
      }

      // Visibility error
      else
      {
        switch (dropOff)
        {
          // we just can't see it, move towards it until we can see it
          case Visibility.ERROR.NOT_VISIBLE:
            {
              task = Task.MoveToPos.createMemory(dropOffData.pos, 3);
            }
          // maybe it was a construction site and now it's done.
          case Visibility.ERROR.MISMATCH_TYPE:
          case Visibility.ERROR.NOT_PRESENT:
            {
              if (dropOffData.isConstructed === false)
              {
                Memory.Job.Harvest[this._id].dropOff.isConstructed = true;
              }
            }
          // there was a pretty severr error
          default:
            {
              throw new Error(
                "Severe Visibility error while generating dropOff task: " + dropOff);
            }
        }
      }

      this.dropOffMemory = task;
    }

    return this.dropOffMemory;
  }

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

  public getIdealContainerPos(): RoomPosition
  {
    return RoomPositionExt.deserialize(this.rawData().contPos);
  }

  public getIdealLinkPos(): RoomPosition
  {
    return RoomPositionExt.deserialize(this.rawData().linkPos);
  }

  public getDropOffData()
  {
    return this.rawData().dropOff;
  }

  public setDropOffStructure(structure: Structure | ConstructionSite): void
  {
    this.rawData().dropOff = structure.identifier();
  }

  // IDEAL DROPOFF METHODS

  public isContainerIdeal(): boolean
  {
    // return whether the drop off point is at the ideal container position
    return this.rawData().dropOff.pos === this.rawData().contPos;
  }

  public isLinkIdeal(): boolean
  {
    // return whether the drop off point is at the ideal link position
    return this.rawData().dropOff.pos === this.rawData().linkPos;
  }

  public setIdealContainer(): void
  {
    // get the ideal container position and room
    const idealPos = RoomPositionExt.deserialize(this.rawData().contPos);
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
              this.rawData().dropOff = site.identifier();
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
              this.rawData().dropOff = container.identifier();
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
          pos: this.rawData().contPos,
          structureType: STRUCTURE_CONTAINER,
          isConstructed: false
        };
    }
  }

  // =============================================================================
  //   PRIVATE METHODS
  // =============================================================================

  private rawData(): JobHarvestMemory
  {
    return Memory.Job.Harvest[this._id];
  }
}
