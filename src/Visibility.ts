// =============================================================================
//   DESCRIPTION
// =============================================================================

//   This module is to allow the detection, identification, and status of
// RoomObjects using their position and id values. Using the Identifiable
// interface and it's extended interfaces will allow the data of a roomobject
// to be written and read from screeps json memory without any methods in the
// main code. The methods in this module will identify RoomObjects using the
// supplied identifiable instance data and return that(those) instance(s) or
// report an error code related to the status of the instance detection.

// =============================================================================
//   IMPORTS
// =============================================================================

import {RoomPositionExt} from "./prototypes/RoomPosition";

// =============================================================================
//   IDENTIFIABLE INTERFACES
// =============================================================================

declare global
{
  interface Identifiable
  {
    pos: string;
    id?: string;
  }

  interface IdentifiableStructure extends Identifiable
  {
    structureType: string;
    isConstructed: boolean;
  }

  interface IdentifiableCreep extends Identifiable
  {
    user: string;
  }

  interface IdentifiableResource extends Identifiable
  {
    resourceType: string;
    isRenewable: boolean;
  }
}

// =============================================================================
//   EXPORTS
// =============================================================================

// ERROR STATES

export enum ERROR
{
  NOT_VISIBLE, // we can't see where it is expected to be
  NOT_PRESENT, // we can see where we expected it to be and it's not there
  MISMATCH_POS, // we can see it but not where it was expected
  MISMATCH_TYPE, // we can see it but it's a differnt instance class
  MISMATCH_DETAIL, // we can see it but a fact about it is wrong
  INVALID_DATA // the data that was supplied to an explicit identifier didn't match
}

// VAGUE OBJECT IDENTIFIER METHODS

export function identifyVagueStructure(data: IdentifiableStructure):
  Structure | Structure[] | ConstructionSite | ConstructionSite[] | ERROR
{
  if (data.isConstructed)
  {
    return identifyStructure(data);
  }
  else
  {
    return identifyConstructionSite(data);
  }
}

export function identifyVagueResource(data: IdentifiableResource):
  Source | Source[] | Mineral | Mineral[] | Resource | Resource[] | ERROR
{
  if (data.isRenewable)
  {
    if (data.resourceType === RESOURCE_ENERGY)
    {
      return identifySource(data);
    }
    else
    {
      return identifyMineral(data);
    }
  }
  else
  {
    return identifyResource(data);
  }

}

// EXPLICIT OBJECT IDENTIFIER METHODS

export function identifyStructure(data: IdentifiableStructure):
  Structure | Structure[] | ERROR
{
  if (data.isConstructed === false)
  {
    return ERROR.INVALID_DATA;
  }

  return identifyWithClass<Structure>(
    data, Structure,
    (structure: Structure) => (structure.structureType === data.structureType)
  );
}

export function identifyConstructionSite(data: IdentifiableStructure):
  ConstructionSite | ConstructionSite[] | ERROR
{
  if (data.isConstructed === true)
  {
    return ERROR.INVALID_DATA;
  }

  return identifyWithClass<ConstructionSite>(
    data, ConstructionSite,
    (site: ConstructionSite) => (site.structureType === data.structureType)
  );
}

export function identifySource(data: IdentifiableResource):
  Source | Source[] | ERROR
{
  if (data.isRenewable !== true || data.resourceType !== RESOURCE_ENERGY)
  {
    return ERROR.INVALID_DATA;
  }

  return identifyWithClass<Source>(data, Source);
}

export function identifyMineral(data: IdentifiableResource):
  Mineral | Mineral[] | ERROR
{
  if (data.isRenewable !== true || data.resourceType === RESOURCE_ENERGY)
  {
    return ERROR.INVALID_DATA;
  }

  return identifyWithClass<Mineral>(
    data, Mineral,
    (mineral: Mineral) => (mineral.mineralType === data.resourceType)
  );
}

export function identifyResource(data: IdentifiableResource):
  Resource | Resource[] | ERROR
{
  if (data.isRenewable === true)
  {
    return ERROR.INVALID_DATA;
  }

  return identifyWithClass<Resource>(
    data, Resource,
    (resource: Resource) => (resource.resourceType === data.resourceType)
  );
}

export function identifyCreep(data: IdentifiableCreep):
  Creep | Creep[] | ERROR
{
  return identifyWithClass<Creep>(
    data, Creep,
    (creep: Creep) => (creep.owner.username === data.user)
  );
}

// =============================================================================
//   PRIVATE METHODS
// =============================================================================

const identifyWithClass = function <Class extends RoomObject>(
  data: Identifiable,
  constructor: {new(...args: any[]): Class},
  details?: (obj: Class) => boolean
): Class | Class[] | ERROR
{
  // identify the basics
  const identified = identify(data);

  // if it's an array, validate each entry individually.
  if (identified instanceof Array)
  {
    const validated: Class[] = [];

    // filter the items for the right type
    for (const entry of identified)
    {
      if (entry instanceof constructor)
      {
        validated.push(entry as Class);
      }
    }

    // no items in array, then nothing matches the type
    if (validated.length === 0)
    {
      return ERROR.MISMATCH_TYPE;
    }

    // filter the items for the right details
    for (let index = 0; index < validated.length; index++)
    {
      const entry = validated[index];

      // check that the details are correct
      if (!(details === undefined || details(entry)))
      {
        // splice the element out if it is bad.
        validated.splice(index, 1);
        // decrement the index count to balance out the array perusal
        index--;
      }
    }

    // no items in array, nothing matches the details
    if (validated.length === 0)
    {
      return ERROR.MISMATCH_DETAIL;
    }
    // if the array has only 1 element, just return the single element
    else if (validated.length === 1)
    {
      return validated[0];
    }
    // return the array for lengths > 1
    else
    {
      return validated;
    }
  }
  // if it's an instance, check if the type matches
  else if (identified instanceof RoomObject)
  {
    if (identified instanceof constructor)
    {
      // check that the details are correct
      if (details === undefined || details(identified))
      {
        return identified;
      }

      return ERROR.MISMATCH_DETAIL;
    }

    return ERROR.MISMATCH_TYPE;
  }
  // return the same error of the original method call
  else
  {
    return identified;
  }
};

const identify = function(
  data: Identifiable):
  RoomObject | RoomObject[] | ERROR
{
  // get object instance and position instance from data
  const obj: RoomObject | null = Game.getObjectById(data.id);
  const pos = RoomPositionExt.deserialize(data.pos);

  // if the object is defined, it either is what we're looking for
  // or has some mismatch
  if (obj !== null)
  {
    // check it's position
    if (obj.pos === pos)
    {
      // this is what we we're looking for
      return obj;
    }

    // the position didn't match
    return ERROR.MISMATCH_POS;
  }

  // check the room to figure out if we have visibility at that position
  const room = Game.rooms[pos.roomName];

  if (room !== undefined)
  {
    // if we can see the room and we know the id, the object for that id is not here
    if (data.id !== undefined)
    {
      return ERROR.NOT_PRESENT;
    }
    // okay, now we know that the id isn't defined,
    // so we're just looking for it by position now.

    // look for all the room objects at this position and
    // pass it on to the function calling this
    const lookResults: LookAtResult[] = room.lookAt(pos);

    // make an array to store all the results into
    const roomObjs: RoomObject[] = [];

    // for every result, if it's some resemblance of a roomobject,
    // add it to the list
    for (const result of lookResults)
    {
      // I hate this implementation, but `roomObjs.push(result[result.type]);`
      // throws a fit because it has no index signature...
      switch (result.type)
      {
        case LOOK_CREEPS:
          {
            roomObjs.push(result.creep as Creep);
          }
          break;
        case LOOK_STRUCTURES:
          {
            roomObjs.push(result.structure as Structure);
          }
          break;
        case LOOK_CONSTRUCTION_SITES:
          {
            roomObjs.push(result.constructionSite as ConstructionSite);
          }
          break;
        case LOOK_ENERGY:
          {
            roomObjs.push(result.energy as Resource);
          }
          break;
        case LOOK_RESOURCES:
          {
            roomObjs.push(result.resource as Resource);
          }
          break;
        case LOOK_SOURCES:
          {
            roomObjs.push(result.source as Source);
          }
          break;
        case LOOK_MINERALS:
          {
            roomObjs.push(result.mineral as Mineral);
          }
          break;
      }
    }

    // if there are no results then it's not here
    if (roomObjs.length === 0)
    {
      return ERROR.NOT_PRESENT;
    }
    // if there's only one just return the single instance
    else if (roomObjs.length === 1)
    {
      return roomObjs[0];
    }
    // return the array of possible targets. for more than 1 element
    else
    {
      return roomObjs;
    }
  }

  // we can't see the object or where it should be.
  return ERROR.NOT_VISIBLE;
};
