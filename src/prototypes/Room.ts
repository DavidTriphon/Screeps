// =============================================================================
//   IMPORTS
// =============================================================================

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface Room
  {
    getMineral(): Mineral | null;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class RoomExt extends Room
{
  private _mineral: Mineral;

  public getMineral(): Mineral | null
  {
    // if the local variable is not defined, get it from memory
    if (this._mineral === undefined)
    {
      // if the mineral for this room is not defined in memory, search for it.
      if (this.memory.mineral === undefined)
      {
        // search for the mineral in the room
        const minerals: Mineral[] = this.find<Mineral>(FIND_MINERALS);

        // if there is a mineral, then add it,
        // else, then set it to null
        if (minerals.length > 0)
        {
          this.memory.mineral = minerals[0];
        }
        else
        {
          this.memory.mineral = null;
        }
      }

      // get the mineral from memory
      this._mineral = this.memory.mineral;
    }

    // get the mineral from the local variable
    return this._mineral;
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
