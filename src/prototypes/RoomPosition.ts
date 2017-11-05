// =============================================================================
//   IMPORTS
// =============================================================================

import {getRoomCoord} from "./Room";

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface RoomPosition
  {
    // static isEqual(pos1: RoomPosition, pos2: RoomPosition): boolean;
    // static deserialize(posString: string): RoomPosition;
    serialize(): string;
    adjacentSpaces(range?: number,
      isValid?: (pos: RoomPosition) => boolean): RoomPosition[];
    isWalkable(): boolean;
    isDoor(): boolean;
    equals(pos: RoomPosition): boolean;
    distanceTo(pos: RoomPosition): number;
    squareDistanceTo(pos: RoomPosition): number;
    getAbsoluteCoords(): Coordinate;
  }

  interface Coordinate
  {
    x: number;
    y: number;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class RoomPositionExt extends RoomPosition
{
  // =============================================================================
  //   STATIC METHODS
  // =============================================================================

  public static isEqual(pos1: RoomPosition, pos2: RoomPosition)
  {
    return (
      pos1.x === pos2.x &&
      pos1.y === pos2.y &&
      pos1.roomName === pos2.roomName
    );
  }

  // =============================================================================
  //  SERIALIZATION METHODS
  // =============================================================================

  public static deserialize(posString: string): RoomPosition
  {
    // [0: x, 1: y, 2: roomName];
    const components: string[] = posString.split(" ");
    // return the roomPosition object
    return new RoomPosition(Number(components[0]), Number(components[1]), components[2]);
  }

  public serialize(): string
  {
    // 'x y roomName'
    // '23 16 W5N8'
    return (this.x + " " + this.y + " " + this.roomName);
  }

  // =============================================================================
  //  SPACE GETTER METHODS
  // =============================================================================

  // range being a square range.
  // isValid is a function that takes a position and
  // returns true if you want it added to the space you get back.
  // - defaults to always return true
  public adjacentSpaces(range: number = 1,
    isValid: (pos: RoomPosition) => boolean = () => true): RoomPosition[]
  {
    const retArray = [];

    for (let x = this.x - range; x <= this.x + range; x++)
    {
      for (let y = this.y - range; y <= this.y + range; y++)
      {
        if (0 <= x && x < 50 &&
          0 <= y && y < 50)
        {
          const pos = new RoomPosition(x, y, this.roomName);

          if (isValid(pos))
          {
            retArray.push(pos);
          }
        }
      }
    }

    return retArray;
  }

  // =============================================================================
  //  DETAIL METHODS
  // =============================================================================

  public isWalkable()
  {
    return (Game.map.getTerrainAt(this.x, this.y, this.roomName) !== "wall");
  }

  public isDoor()
  {
    return (
      this.x === 0 ||
      this.x === 49 ||
      this.y === 0 ||
      this.y === 49
    );
  }

  public equals(pos: RoomPosition)
  {
    return (
      this.x === pos.x &&
      this.y === pos.y &&
      this.roomName === pos.roomName
    );
  }

  // =============================================================================
  //  POSITION / DISTANCE METHODS
  // =============================================================================

  public distanceTo(pos: RoomPosition)
  {
    // use this line if you want to allow this
    // method to accept RoomObject instances as well
    // target = (target instanceof RoomObject ? target.pos : target);

    // get the objects for the absolute coordinates
    const hereCoords = this.getAbsoluteCoords();
    const thereCoords = pos.getAbsoluteCoords();

    // find the absolute distance on each axis
    const xDist = hereCoords.x - thereCoords.x;
    const yDist = hereCoords.y - thereCoords.y;

    // find pythagorean distance
    const dist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));

    // console.log('please confirm: (' + hereCoords.x + ', ' + hereCoords.y + ') to (' +
    //   thereCoords.x + ', ' + thereCoords.y + ') is ' + dist + '. ?');

    return dist;
  }

  public squareDistanceTo(pos: RoomPosition)
  {
    // get the objects for the absolute coordinates
    const hereCoords = this.getAbsoluteCoords();
    const thereCoords = pos.getAbsoluteCoords();

    // find the absolute distance on each axis
    const xDist = Math.abs(hereCoords.x - thereCoords.x);
    const yDist = Math.abs(hereCoords.y - thereCoords.y);

    // find euclidean distance
    const dist = Math.max(xDist, yDist);

    // console.log("please confirm: max of ("" +
    // xDist + ") and (" + yDist + ") is " + dist + ". ?");

    return dist;
  }

  public getAbsoluteCoords(): Coordinate
  {
    // get room coordinates
    const roomCoords = getRoomCoord(this.roomName);

    // find absolute position coordinates
    const x = this.x + 50 * roomCoords.x;
    const y = this.y + 50 * roomCoords.y;

    // return coordinate object
    return {x, y};
  }
}
