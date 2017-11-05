// =============================================================================
//   IMPORTS
// =============================================================================

import * as Visibility from "../Visibility";

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface RoomMemory
  {
    mineral: IdentifiableResource | undefined | null;
  }

  interface Room
  {
    // undefined means unseeable
    // null means there is none.
    getMineral(): Mineral | null;
    getMineralType(): MineralConstant | null;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class RoomExt extends Room
{
  private _mineral: Mineral | undefined | null;

  public getMineral(): Mineral | null
  {
    // if the local variable is not defined, get it from memory
    if (this._mineral === undefined)
    {
      // if the mineral for this room is not defined in memory, search for it.
      if (this.memory.mineral === undefined)
      {
        const mineral = this.lookForMineral();

        // set the memory identifier
        this.memory.mineral = (mineral === null ? null : mineral.identifier());
        // set the mineral that we return
        this._mineral = mineral;
      }

      // if the mineral in memory is null, we should return null
      else if (this.memory.mineral === null)
      {
        this._mineral = null;
      }
      else
      {
        // get the mineral from memory
        let visible = Visibility.identifyMineral(this.memory.mineral);

        if (visible instanceof Array)
        {
          visible = visible[0];
        }

        if (visible instanceof Mineral)
        {
          this._mineral = visible;
        }
        else
        {
          throw new Error("Mineral in " + this.toString() +
            " is no longer visible with the current identifier.");
        }

      }
    }

    // get the mineral from the local variable
    return this._mineral;
  }

  public getMineralType(): MineralConstant | null
  {
    if (this.memory.mineral === undefined)
    {
      this._mineral = this.lookForMineral();
      this.memory.mineral = (this._mineral === null ? null : this._mineral.identifier());
    }

    if (this.memory.mineral === null)
    {
      return null;
    }

    const resourceType = this.memory.mineral.resourceType;

    if (isMineral(resourceType, this.memory.mineral))
    {
      return resourceType;
    }

    throw new Error("Mineral resourceType was not a mineralConstant.");
  }

  private lookForMineral(): Mineral | null
  {
    // search for the mineral in the room
    const minerals: Mineral[] = this.find<Mineral>(FIND_MINERALS);

    // if there is a mineral, then use it,
    // else, then set it to null
    if (minerals.length > 0)
    {
      return minerals[0];
    }
    else
    {
      return null;
    }
  }
}

export function getRoomCoord(roomName: string): Coordinate
{
  // figure out direction polarity by finding direction letters
  const isSouth = roomName.indexOf("S") !== -1;
  const isEast = roomName.indexOf("E") !== -1;

  // separate the numbers from the string by
  // removing the starting letter and splitting at the middle letter
  const segments = roomName.substr(1).split((isSouth ? "S" : "N"));

  // get x by finding the value of the first number and
  // then seeing if it's opposite polarity
  let x = Number(segments[0]);
  if (!isEast)
  {
    x = -x - 1;
  }

  // get y by finding the value of the second number and
  // then seeing if it's opposite polarity
  let y = Number(segments[1]);
  if (!isSouth)
  {
    y = -y - 1;
  }

  // return position object
  return {x, y};
}

function isMineral(
  type: ResourceConstant, resource: IdentifiableResource):
  type is MineralConstant
{
  return type !== RESOURCE_ENERGY && resource.isRenewable;
}
